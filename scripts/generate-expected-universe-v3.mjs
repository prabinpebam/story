import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const specDir = path.join(root, 'documentation', 'product', 'specification');
const implementationDir = path.join(root, 'documentation', 'product', 'implementation');
const shardDir = path.join(implementationDir, 'expected-universe-1');
const profilePath = path.join(implementationDir, 'profile-endstate-1.json');
const traceabilityPath = path.join(specDir, 'traceability-index.json');
const enumPath = path.join(specDir, 'registries', 'canonical-enums.json');
const protocolPath = path.join(specDir, 'protocol-registry.json');
const implementationPlanPath = path.join(root, 'documentation', 'product', 'implementation-plan.md');
const volume14Path = path.join(specDir, '14-quality-attributes-and-observability.md');
const volume15Path = path.join(specDir, '15-acceptance-and-release-conformance.md');
const manifestPath = path.join(implementationDir, 'expected-universe-1.json');
const markdownPath = path.join(implementationDir, 'expected-universe-1.md');
const pointerPath = path.join(implementationDir, 'endstate-profile-pointer.json');
const checkOnly = process.argv.includes('--check');
const SHARD_TARGET_BYTES = 12 * 1024 * 1024;
const SHARD_MAX_BYTES = 15 * 1024 * 1024;

const CELL_FIELDS = [
    'cellId', 'requirementId', 'criterionId', 'profileId', 'surfaceCode', 'lifecycleCode',
    'durabilityAxis', 'entityFamily', 'operationFamily', 'outputProfile', 'runtimeMode', 'inputClass',
    'displayClass', 'failureClass', 'role', 'capability', 'connectivityState',
    'environmentProfileId', 'environmentIds', 'accessibilityProfile', 'platformProfile', 'applicability',
    'rationale', 'owner', 'protocolIds', 'fixtureIds', 'requiredEvidenceClasses',
    'riskClass', 'verificationDisposition', 'bindingBlockers', 'evidenceIds', 'waiverId', 'matrixFacet',
    'matrixDisposition', 'sourceCellId', 'sourceScope'
];

const SOURCE_SCOPE_FIELDS = [
    'cellId', 'requirementId', 'criterionId', 'profileId', 'surfaceCode', 'lifecycleCode',
    'durabilityAxis', 'entityFamily', 'operationFamily', 'outputProfile', 'runtimeMode',
    'inputClass', 'displayClass', 'failureClass', 'role', 'capability', 'connectivityState',
    'environmentProfileId', 'environmentIds', 'accessibilityProfile', 'platformProfile',
    'applicability', 'owner', 'protocolIds', 'fixtureIds', 'requiredEvidenceClasses',
    'riskClass', 'verificationDisposition', 'bindingBlockers', 'evidenceIds', 'waiverId',
    'matrixFacet', 'matrixDisposition'
];

const artifactRolesByTemplate = {
    'unit-model': ['INPUT', 'RESULT'], 'integration-contract': ['CONFIG', 'TRACE', 'RESULT'],
    'headed-e2e': ['VIDEO', 'SCREENSHOT', 'SEMANTIC-CAPTURE'], 'artifact-roundtrip': ['ARTIFACT', 'PARSER-REPORT', 'COMPARISON'],
    'accessibility-manual': ['PROCEDURE', 'OBSERVATIONS', 'MEDIA'], 'performance-soak': ['RAW-SAMPLES', 'AGGREGATE', 'TRACE'],
    'security-fault': ['FAULT-SCHEDULE', 'PROTECTED-STATE', 'AUDIT'], 'usability-benchmark': ['TASKS', 'RAW-OBSERVATIONS', 'AGGREGATE']
};

function read(filePath) { return fs.readFileSync(filePath, 'utf8'); }
function readJson(filePath) { return JSON.parse(read(filePath)); }
function sha256(value) { return crypto.createHash('sha256').update(value).digest('hex'); }
function assert(condition, message) { if (!condition) throw new Error(message); }
function assertUniqueNonempty(values, label) {
    assert(Array.isArray(values) && values.length > 0, `${label} must be nonempty`);
    assert(values.every((value) => typeof value === 'string' && value.length > 0), `${label} contains an invalid value`);
    assert(new Set(values).size === values.length, `${label} contains duplicate values`);
}
function writeOrCheck(filePath, content) {
    if (checkOnly) {
        if (!fs.existsSync(filePath) || read(filePath) !== content) {
            console.error(`Generated expected universe is stale: ${path.relative(root, filePath)}`);
            return false;
        }
        return true;
    }
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content);
    return true;
}
function expandIdReferences(text, prefix) {
    const ids = new Set();
    const normalized = String(text).replaceAll('`', '');
    const range = new RegExp(`\\b${prefix}-(\\d{2})-(\\d{3})\\b\\s*(?:through|to|\\.\\.)\\s*(?:${prefix}-)?(?:\\d{2}-)?(\\d{3})\\b`, 'gi');
    for (const match of normalized.matchAll(range)) {
        const start = Number(match[2]);
        const end = Number(match[3]);
        assert(end >= start, `Descending ${prefix} range ${match[0]}`);
        for (let value = start; value <= end; value += 1) ids.add(`${prefix}-${match[1]}-${String(value).padStart(3, '0')}`);
    }
    for (const match of normalized.matchAll(new RegExp(`\\b${prefix}-\\d{2}-\\d{3}\\b`, 'g'))) ids.add(match[0]);
    return [...ids].sort();
}
function chunkRows(rows) {
    const chunks = [];
    let chunk = [];
    let bytes = 0;
    for (const row of rows) {
        const rowBytes = Buffer.byteLength(JSON.stringify(row)) + 1;
        if (chunk.length && bytes + rowBytes > SHARD_TARGET_BYTES) {
            chunks.push(chunk);
            chunk = [];
            bytes = 0;
        }
        chunk.push(row);
        bytes += rowBytes;
    }
    if (chunk.length) chunks.push(chunk);
    return chunks;
}

const profile = readJson(profilePath);
const traceability = readJson(traceabilityPath);
const enums = readJson(enumPath);
const protocolRegistry = readJson(protocolPath);
const profileSha256 = sha256(read(profilePath));

assert(profile.status === 'draft-not-accepted', 'Profile must remain draft-not-accepted before activation');
assert(profile.productCommit === 'UNFROZEN' && profile.buildId === 'UNFROZEN', 'Draft candidate identity must remain unfrozen');
assert(profile.sourceRevision === traceability.sourceRevision && profile.specificationRevision === traceability.sourceRevision, 'Profile specification revision is stale');
assert(profile.implementationPlanSha256 === sha256(read(implementationPlanPath)), 'Implementation plan hash is stale');
assert(profile.traceabilityIndexSha256 === sha256(read(traceabilityPath)), 'Traceability hash is stale');
assert(profile.canonicalEnumsSha256 === sha256(read(enumPath)), 'Canonical enum hash is stale');
assert(profile.protocolRegistrySha256 === sha256(read(protocolPath)), 'Protocol registry hash is stale');
assert(profile.qualityRegistryVersion === `STORY-SPEC-14@sha256:${sha256(read(volume14Path))}`, 'Quality registry hash is stale');
assert(profile.conformanceMatrixVersion === `STORY-SPEC-15@sha256:${sha256(read(volume15Path))}`, 'Conformance matrix hash is stale');
assert(profile.expectedRequirementCount === traceability.requirementCount, 'Requirement count is stale');
assert(profile.expectedRequirementIdsSha256 === sha256(traceability.requirements.map((entry) => entry.id).sort().join('\n')), 'Requirement ID hash is stale');
assert(JSON.stringify(profile.requiredVolumeSet) === JSON.stringify(traceability.volumes.map((entry) => entry.id)), 'Required volumes differ from manifest');
assert(JSON.stringify(profile.windowTiers) === JSON.stringify(enums.windowTiers.map((entry) => entry.id)), 'Window tiers differ from canonical enums');
assert(JSON.stringify(profile.inputTiers) === JSON.stringify(enums.inputTiers.map((entry) => entry.id)), 'Input tiers differ from canonical enums');
assert(JSON.stringify(profile.workspaceViews) === JSON.stringify(enums.workspaceViews), 'Workspace views differ from canonical enums');
assert(JSON.stringify(profile.runtimeModes) === JSON.stringify(enums.runtimeModes), 'Runtime modes differ from canonical enums');
assert(JSON.stringify(profile.runtimeRoles) === JSON.stringify(enums.surfaceRoles), 'Runtime roles differ from canonical enums');
assert(JSON.stringify(profile.placements) === JSON.stringify(enums.placements), 'Placements differ from canonical enums');
assert(profile.releaseTier === 'R3-assured' && profile.allowedWaiverClasses.length === 0, 'End-state target must be waiver-free R3');

const axisNames = [
    'surfaces', 'lifecycles', 'windowTiers', 'inputTiers', 'workspaceViews', 'runtimeModes',
    'runtimeRoles', 'placements', 'runtimeInputs', 'runtimeDisplays', 'runtimeFailures',
    'entityFamilies', 'durabilityAxes', 'outputProfiles', 'fidelityDimensions',
    'authorizationRoles', 'authorizationCapabilities', 'connectivityStates',
    'environmentClasses', 'environmentTargets', 'networkProfiles', 'powerProfiles',
    'accessibilityVariants', 'generalFailureClasses', 'workloadProfiles', 'evidenceClasses',
    'corpusFamilies', 'goldenTypes', 'phaseDecisionIds', 'releaseDecisionIds', 'rollbackDecisionIds'
];
for (const axis of axisNames) assertUniqueNonempty(profile[axis], axis);
assertUniqueNonempty(profile.platformApplicabilityProfiles.map((entry) => entry.id), 'platform applicability profile IDs');
assert(JSON.stringify(Object.keys(profile.ownerMinimums).sort()) === JSON.stringify(profile.requiredVolumeSet), 'Owner minima must cover all volumes');
assert(JSON.stringify(Object.keys(profile.operationFamiliesByVolume).sort()) === JSON.stringify(profile.requiredVolumeSet), 'Operation families must cover all volumes');
assert(JSON.stringify(Object.keys(profile.riskClassByVolume).sort()) === JSON.stringify(profile.requiredVolumeSet), 'Risk classes must cover all volumes');
assert(JSON.stringify(Object.keys(profile.operationsByEntityFamily).sort()) === JSON.stringify([...profile.entityFamilies].sort()), 'Entity operation mappings must cover all entity families');
assert(JSON.stringify(Object.keys(profile.durabilityLifecycleByAxis).sort()) === JSON.stringify([...profile.durabilityAxes].sort()), 'Durability lifecycle mappings must cover all durability axes');
assert(profile.riskClassificationStatus === 'proposed-volume-default-requires-cell-review', 'Draft risk classification status must remain explicit');
assert(JSON.stringify(Object.keys(profile.runtimeInputDispositions)) === JSON.stringify(profile.runtimeModes), 'Runtime input rows must cover all modes');
assert(JSON.stringify(Object.keys(profile.runtimeFailureDispositions)) === JSON.stringify(profile.runtimeFailures), 'Runtime failure rows must cover all failures');
assert(JSON.stringify(Object.keys(profile.environmentClassTemplates)) === JSON.stringify(profile.environmentClasses), 'Environment templates must cover all classes');
assert(JSON.stringify(Object.keys(profile.goldenTypesByCorpus)) === JSON.stringify(profile.corpusFamilies), 'Golden applicability must cover all corpora');
for (const volume of profile.requiredVolumeSet) {
    const minimum = profile.ownerMinimums[volume];
    assertUniqueNonempty(minimum.surfaces, `${volume} minimum surfaces`);
    assertUniqueNonempty(minimum.lifecycles, `${volume} minimum lifecycles`);
    assert(minimum.surfaces.every((value) => profile.surfaces.includes(value)), `${volume} has unknown surface`);
    assert(minimum.lifecycles.every((value) => profile.lifecycles.includes(value)), `${volume} has unknown lifecycle`);
    assertUniqueNonempty(profile.operationFamiliesByVolume[volume], `${volume} operation families`);
}
for (const mode of profile.runtimeModes) assert(profile.runtimeInputDispositions[mode].length === profile.runtimeInputs.length, `${mode} runtime input row is incomplete`);
for (const failure of profile.runtimeFailures) assert(profile.runtimeFailureDispositions[failure].length === profile.runtimeModes.length, `${failure} runtime failure row is incomplete`);
for (const corpus of profile.corpusFamilies) {
    assertUniqueNonempty(profile.goldenTypesByCorpus[corpus], `${corpus} golden types`);
    assert(profile.goldenTypesByCorpus[corpus].every((type) => profile.goldenTypes.includes(type)), `${corpus} uses unknown golden type`);
}
for (const entityFamily of profile.entityFamilies) assertUniqueNonempty(profile.operationsByEntityFamily[entityFamily], `${entityFamily} operations`);
for (const platformProfile of profile.platformApplicabilityProfiles) {
    assertUniqueNonempty(platformProfile.environmentClasses, `${platformProfile.id} environment classes`);
    assertUniqueNonempty(platformProfile.accessibilityVariants, `${platformProfile.id} accessibility variants`);
    assertUniqueNonempty(platformProfile.outputProfiles, `${platformProfile.id} output profiles`);
    assertUniqueNonempty(platformProfile.runtimeModes, `${platformProfile.id} runtime modes`);
    assert(platformProfile.environmentClasses.every((value) => profile.environmentClasses.includes(value)), `${platformProfile.id} has unknown environment class`);
    assert(platformProfile.accessibilityVariants.every((value) => profile.accessibilityVariants.includes(value)), `${platformProfile.id} has unknown accessibility variant`);
    assert(platformProfile.outputProfiles.every((value) => profile.outputProfiles.includes(value)), `${platformProfile.id} has unknown output profile`);
    assert(platformProfile.runtimeModes.every((value) => profile.runtimeModes.includes(value)), `${platformProfile.id} has unknown runtime mode`);
    assert(profile.lifecycles.includes(platformProfile.lifecycleCode), `${platformProfile.id} has unknown lifecycle`);
}

const requirements = traceability.requirements.map((entry) => ({
    id: entry.id,
    criterionId: entry.acceptance[0] ?? entry.id.replace('REQ-', 'AC-'),
    volume: entry.volume,
    owner: traceability.volumes.find((volume) => volume.id === entry.volume)?.owner ?? '',
    parents: entry.parents,
    statement: entry.statement
}));
const requirementById = new Map(requirements.map((entry) => [entry.id, entry]));
const criteria = requirements.map((entry) => entry.criterionId);
assert(requirementById.size === requirements.length && new Set(criteria).size === criteria.length, 'Duplicate requirement or criterion IDs');
for (const id of ['REQ-15-004', 'REQ-15-005', 'REQ-15-006', 'REQ-15-007', 'REQ-15-008']) assert(requirementById.has(id), `Missing matrix owner ${id}`);

const protocolById = new Map(protocolRegistry.protocols.map((entry) => [entry.id, entry]));
const knownVerificationLayers = new Set(protocolRegistry.protocols.flatMap((entry) => entry.verificationLayers));
for (const [riskClass, layers] of Object.entries(profile.requiredVerificationLayersByRisk)) {
    assertUniqueNonempty(layers, `${riskClass} required verification layers`);
    assert(layers.every((layer) => knownVerificationLayers.has(layer)), `${riskClass} uses unknown verification layer`);
}
for (const [facet, protocolIds] of Object.entries(profile.requiredProtocolIdsByFacet)) {
    assert(Array.isArray(protocolIds), `${facet} required protocols must be an array`);
    assert(protocolIds.every((id) => protocolById.has(id)), `${facet} uses unknown required protocol`);
}
const protocolIdsByRequirement = new Map(requirements.map((entry) => [entry.id, []]));
for (const protocol of protocolRegistry.protocols) {
    assert(Array.isArray(protocol.applicability.requirements), `${protocol.id} requirements must be an array`);
    for (const requirementId of protocol.applicability.requirements) {
        assert(requirementById.has(requirementId), `${protocol.id} maps unknown ${requirementId}`);
        protocolIdsByRequirement.get(requirementId).push(protocol.id);
    }
}
const mappedRequirementCount = requirements.filter((entry) => protocolIdsByRequirement.get(entry.id).length > 0).length;

function evidenceForFacet(facet) {
    const map = {
        RSL: ['EVC-MODEL', 'EVC-HEADED'], CTX: ['EVC-HEADED', 'EVC-EVAL', 'EVC-MANUAL'],
        ED: ['EVC-MODEL', 'EVC-ARTIFACT', 'EVC-COLLAB'], OUT: ['EVC-ARTIFACT', 'EVC-MANUAL'],
        RTI: ['EVC-HEADED', 'EVC-MANUAL'], RTD: ['EVC-HEADED', 'EVC-MANUAL'],
        RTF: ['EVC-HEADED', 'EVC-RESCUE'], RRP: ['EVC-HEADED', 'EVC-RESCUE'],
        AUTH: ['EVC-COLLAB', 'EVC-RESCUE'], A11Y: ['EVC-HEADED', 'EVC-MANUAL', 'EVC-ARTIFACT'],
        QUAL: ['EVC-QUALITY'], FAIL: ['EVC-RESCUE', 'EVC-QUALITY']
    };
    return map[facet] ?? ['EVC-MODEL'];
}
function protocolFixtures(protocolIds) { return [...new Set(protocolIds.flatMap((id) => protocolById.get(id)?.setup.fixtureIds ?? []))].sort(); }
function protocolEnvironments(protocolIds) { return [...new Set(protocolIds.flatMap((id) => protocolById.get(id)?.setup.environmentIds ?? []))].sort(); }
function protocolLayers(protocolIds) { return new Set(protocolIds.flatMap((id) => protocolById.get(id)?.status === 'complete' ? protocolById.get(id).verificationLayers ?? [] : [])); }
function artifactObligationIds(protocolIds) {
    const ids = [];
    for (const protocolId of protocolIds) {
        const protocol = protocolById.get(protocolId);
        for (const template of protocol.templates) for (const fixtureId of protocol.setup.fixtureIds) for (const role of artifactRolesByTemplate[template]) ids.push(`ART-END1-${protocolId.slice(5)}-${fixtureId}-${template.toUpperCase()}-${role}`);
        for (const role of protocol.evidence.artifacts ?? []) ids.push(`ART-END1-${protocolId.slice(5)}-SOURCE-${String(role).toUpperCase()}`);
    }
    return [...new Set(ids)].sort();
}

const cellKeyById = new Map();
const shards = new Map();
const requirementCellIds = new Map(requirements.map((entry) => [entry.id, []]));
const facetCounts = {};
function addCell({ shard, facet, requirementId, axes = {}, disposition = 'required', rationale, semanticBlockers = [] }) {
    const requirement = requirementById.get(requirementId);
    assert(requirement, `${facet} references unknown requirement ${requirementId}`);
    const orderedAxes = Object.fromEntries(Object.entries(axes).filter(([, value]) => value !== null && value !== undefined).sort(([left], [right]) => left.localeCompare(right)));
    const cellKey = `${facet}|requirement=${requirementId}|${Object.entries(orderedAxes).map(([key, value]) => `${key}=${typeof value === 'object' ? JSON.stringify(value) : value}`).join('|')}`;
    const id = `CELL-END1-${facet}-${requirementId}-${sha256(cellKey).slice(0, 20).toUpperCase()}`;
    assert(!cellKeyById.has(id), `Duplicate/colliding normalized cell ${id}`);
    cellKeyById.set(id, cellKey);
    const protocols = [...protocolIdsByRequirement.get(requirementId)].sort();
    const fixtures = protocolFixtures(protocols);
    const protocolEnvironmentIds = protocolEnvironments(protocols);
    const environmentProfileId = axes.environmentProfileId ?? protocolEnvironmentIds[0] ?? null;
    const environments = [...new Set([...protocolEnvironmentIds, ...(environmentProfileId ? [environmentProfileId] : [])])].sort();
    const applicability = /^N(?:\b| by default| unless| incompatible)/.test(disposition) ? 'not-applicable' : 'required';
    const riskClass = profile.riskClassByVolume[requirement.volume];
    const blockers = [];
    if (applicability === 'required') {
        if (!protocols.length) blockers.push('missing-protocol-binding');
        if (!fixtures.length) blockers.push('missing-fixture-binding');
        if (!environmentProfileId) blockers.push('missing-environment-binding');
        for (const protocolId of protocols) if (protocolById.get(protocolId).status !== 'complete') blockers.push(`protocol-incomplete:${protocolId}`);
        for (const protocolId of protocols) {
            const protocol = protocolById.get(protocolId);
            if (protocol.setup.fixtureStatus !== 'active') for (const fixtureId of protocol.setup.fixtureIds) blockers.push(`fixture-not-materialized:${fixtureId}`);
            if (protocol.setup.environmentStatus !== 'active') for (const environmentId of protocol.setup.environmentIds) blockers.push(`environment-not-materialized:${environmentId}`);
        }
        if (environmentProfileId?.startsWith('ENV-END1-')) blockers.push(`environment-not-materialized:${environmentProfileId}`);
        for (const protocolId of profile.requiredProtocolIdsByFacet[facet] ?? []) if (!protocols.includes(protocolId)) blockers.push(`missing-required-protocol:${protocolId}`);
        const layers = protocolLayers(protocols);
        for (const layer of profile.requiredVerificationLayersByRisk[riskClass]) if (!layers.has(layer)) blockers.push(`missing-risk-layer:${layer}`);
        blockers.push('missing-current-evidence');
        blockers.push('missing-verification-result');
        blockers.push('risk-class-review-required');
    }
    blockers.push(...semanticBlockers);
    const values = {
        cellId: id, requirementId, criterionId: requirement.criterionId, profileId: profile.profileId,
        surfaceCode: axes.surfaceCode ?? null, lifecycleCode: axes.lifecycleCode ?? null,
        durabilityAxis: axes.durabilityAxis ?? null,
        entityFamily: axes.entityFamily ?? null, operationFamily: axes.operationFamily ?? profile.operationFamiliesByVolume[requirement.volume][0],
        outputProfile: axes.outputProfile ?? null, runtimeMode: axes.runtimeMode ?? null,
        inputClass: axes.inputClass ?? null, displayClass: axes.displayClass ?? null,
        failureClass: axes.failureClass ?? null, role: axes.role ?? null,
        capability: axes.capability ?? null, connectivityState: axes.connectivityState ?? null,
        environmentProfileId, environmentIds: environments,
        accessibilityProfile: axes.accessibilityProfile ?? null, platformProfile: axes.platformProfile ?? null,
        applicability,
        rationale, owner: requirement.owner, protocolIds: protocols, fixtureIds: fixtures,
        requiredEvidenceClasses: evidenceForFacet(facet), riskClass,
        verificationDisposition: blockers.length ? 'blocked' : 'not-evaluated', bindingBlockers: blockers,
        evidenceIds: [], waiverId: null,
        matrixFacet: facet, matrixDisposition: disposition, sourceCellId: axes.sourceCellId ?? null,
        sourceScope: axes.sourceScope ?? null
    };
    const row = CELL_FIELDS.map((field) => values[field]);
    assert(row.every((value) => value !== undefined), `${id} has an undefined normalized field`);
    const rows = shards.get(shard) ?? [];
    rows.push(row);
    shards.set(shard, rows);
    requirementCellIds.get(requirementId).push(id);
    facetCounts[facet] = (facetCounts[facet] ?? 0) + 1;
}

for (const requirement of requirements) {
    const minimum = profile.ownerMinimums[requirement.volume];
    for (const surfaceCode of minimum.surfaces) for (const lifecycleCode of minimum.lifecycles) {
        addCell({ shard: `rsl-${requirement.volume}`, facet: 'RSL', requirementId: requirement.id, axes: { surfaceCode, lifecycleCode }, disposition: 'required', rationale: `STORY-SPEC-15 Section 3.2 Volume ${requirement.volume} owner minimum` });
    }
    assert(requirementCellIds.get(requirement.id).length === minimum.surfaces.length * minimum.lifecycles.length, `${requirement.id} owner-minimum Cartesian coverage mismatch`);
}

for (const windowTier of profile.windowTiers) for (const view of profile.workspaceViews) for (const inputClass of profile.inputTiers) addCell({ shard: 'matrix-context', facet: 'CTX', requirementId: 'REQ-15-008', axes: { displayClass: windowTier, accessibilityProfile: view, inputClass }, disposition: 'required', rationale: 'STORY-SPEC-02/15 canonical view-window-input applicability' });
for (const entityFamily of profile.entityFamilies) for (const operationFamily of profile.operationsByEntityFamily[entityFamily]) profile.durabilityAxes.forEach((durabilityAxis, durabilityIndex) => addCell({ shard: 'matrix-entity-durability', facet: 'ED', requirementId: 'REQ-15-004', axes: { durabilityAxis, entityFamily, lifecycleCode: profile.durabilityLifecycleByAxis[durabilityAxis], operationFamily }, disposition: profile.durabilityDispositionByEntity[entityFamily][durabilityIndex], rationale: 'STORY-SPEC-15 Section 3.3 exact entity/operation durability disposition' }));
for (const outputProfile of profile.outputProfiles) for (const dimension of profile.fidelityDimensions) addCell({ shard: 'matrix-output', facet: 'OUT', requirementId: 'REQ-15-005', axes: { surfaceCode: 'SUR-OUTPUT', lifecycleCode: 'LC-OUTPUT', outputProfile, operationFamily: `FIDELITY-${dimension}` }, disposition: profile.requiredFidelityByOutput[outputProfile].includes(dimension) ? 'R' : 'N not-applicable under the Section 3.4 output contract', rationale: 'STORY-SPEC-15 Section 3.4 explicit output fidelity disposition' });
for (const runtimeMode of profile.runtimeModes) {
    const modeIndex = profile.runtimeModes.indexOf(runtimeMode);
    profile.runtimeInputs.forEach((inputClass, inputIndex) => addCell({ shard: 'matrix-runtime', facet: 'RTI', requirementId: 'REQ-15-006', axes: { surfaceCode: 'SUR-AUDIENCE', lifecycleCode: 'LC-PRESENT', runtimeMode, inputClass }, disposition: profile.runtimeInputDispositions[runtimeMode][inputIndex], rationale: 'STORY-SPEC-15 Section 3.5 exact mode/input disposition' }));
    for (const displayClass of profile.runtimeDisplays) addCell({ shard: 'matrix-runtime', facet: 'RTD', requirementId: 'REQ-15-006', axes: { surfaceCode: 'SUR-AUDIENCE', lifecycleCode: 'LC-PRESENT', runtimeMode, displayClass }, disposition: profile.runtimeDisplayBehaviors[displayClass], rationale: 'STORY-SPEC-15 Section 3.5 required display behavior' });
    for (const failureClass of profile.runtimeFailures) addCell({ shard: 'matrix-runtime', facet: 'RTF', requirementId: 'REQ-15-006', axes: { surfaceCode: 'SUR-AUDIENCE', lifecycleCode: 'LC-FAIL', runtimeMode, failureClass }, disposition: profile.runtimeFailureDispositions[failureClass][modeIndex], rationale: 'STORY-SPEC-15 Section 3.5 exact failure/mode disposition' });
    for (const role of profile.runtimeRoles) for (const displayClass of profile.placements) {
        const allocated = profile.normativeRuntimeRolePlacements[runtimeMode]?.[role]?.includes(displayClass);
        const requiredRole = profile.runtimeRequiredPrivateRoles[runtimeMode].includes(role);
        const semanticBlockers = allocated ? [] : ['runtime-role-placement-allocation-unresolved'];
        if (runtimeMode === 'Kiosk') semanticBlockers.push('runtime-host-controller-role-unresolved');
        addCell({ shard: 'matrix-runtime', facet: 'RRP', requirementId: 'REQ-15-006', axes: { lifecycleCode: 'LC-PRESENT', runtimeMode, role, displayClass }, disposition: allocated ? 'X' : requiredRole ? 'UNRESOLVED required private role placement' : 'UNRESOLVED mode/role/placement compatibility', semanticBlockers, rationale: allocated ? 'STORY-SPEC-10 Section 5.1 normative default audience placement' : 'STORY-SPEC-10 Section 5.1 does not allocate this complete mode/role/placement combination' });
    }
}
for (const role of profile.authorizationRoles) {
    const policies = profile.authorizationPolicyRows[role];
    profile.authorizationCapabilities.forEach((capability, capabilityIndex) => {
        const capabilityClass = profile.authorizationCapabilityClasses[capability];
        for (const connectivityState of profile.connectivityStates) {
            const disposition = profile.authorizationConnectivityTransforms[connectivityState][capabilityClass][policies[capabilityIndex]];
            addCell({ shard: 'matrix-authorization', facet: 'AUTH', requirementId: 'REQ-15-007', axes: { surfaceCode: 'SUR-SERVICE', lifecycleCode: 'LC-COLLAB', role, capability, connectivityState }, disposition, rationale: 'STORY-SPEC-15 Section 3.6 exact role/capability/connectivity policy' });
        }
    });
}

const endstateEnvironments = [];
for (const target of profile.environmentTargets) {
    const [environmentClass, browserHostVersion] = target.split('|');
    const template = profile.environmentClassTemplates[environmentClass];
    assert(template && browserHostVersion, `Invalid environment target ${target}`);
    for (const networkProfile of profile.networkProfiles) for (const powerMode of profile.powerProfiles) {
        const definition = {
            environmentClass, osBuild: template.osBuild, architecture: template.architecture,
            cpuClass: template.cpuClass, logicalCoreCount: 'UNFROZEN', ramBucket: template.ramBucket,
            gpuDriverClass: template.gpuDriverClass, storageClass: template.storageClass, powerMode,
            thermalState: 'UNFROZEN', browserHostVersion, javascriptEngine: 'UNFROZEN',
            playwrightVersion: 'package-lock-bound', viewportWindow: template.viewportWindow, dpr: template.dpr,
            displayRefreshRate: template.displayRefreshRate, colorProfile: template.colorProfile,
            inputDevices: template.inputDevices, locale: 'UNFROZEN', language: 'UNFROZEN',
            accessibilityPreferences: 'per applicability cell', networkProfile,
            appBuildMode: 'production', featureConfiguration: 'PROFILE-ENDSTATE-1',
            workerCount: 'UNFROZEN', backgroundLoad: 'declared-none-or-versioned'
        };
        const id = `ENV-END1-${sha256(JSON.stringify(definition)).slice(0, 20).toUpperCase()}`;
        endstateEnvironments.push({ id, status: 'required-not-materialized', definition });
    }
}
assert(new Set(endstateEnvironments.map((entry) => entry.id)).size === endstateEnvironments.length, 'Duplicate environment profiles');
for (const platformApplicability of profile.platformApplicabilityProfiles) {
    const environments = endstateEnvironments.filter((entry) => platformApplicability.environmentClasses.includes(entry.definition.environmentClass));
    assert(environments.length > 0, `${platformApplicability.id} has no concrete environments`);
    for (const environment of environments) {
        for (const accessibilityProfile of platformApplicability.accessibilityVariants) addCell({ shard: `matrix-platform-${platformApplicability.id.toLowerCase()}`, facet: 'A11Y', requirementId: 'REQ-15-008', axes: { environmentProfileId: environment.id, accessibilityProfile, lifecycleCode: platformApplicability.lifecycleCode, operationFamily: 'PLATFORM-ACCESSIBILITY', platformProfile: platformApplicability.id }, disposition: 'required', rationale: `STORY-SPEC-15 Section 3.7 ${platformApplicability.id} accessibility/input applicability` });
        for (const outputProfile of platformApplicability.outputProfiles) addCell({ shard: `matrix-platform-${platformApplicability.id.toLowerCase()}`, facet: 'A11Y', requirementId: 'REQ-15-008', axes: { environmentProfileId: environment.id, outputProfile, lifecycleCode: platformApplicability.lifecycleCode, operationFamily: 'PLATFORM-OUTPUT', platformProfile: platformApplicability.id }, disposition: 'required', rationale: `STORY-SPEC-15 Section 3.7 ${platformApplicability.id} output applicability` });
        for (const runtimeMode of platformApplicability.runtimeModes) addCell({ shard: `matrix-platform-${platformApplicability.id.toLowerCase()}`, facet: 'A11Y', requirementId: 'REQ-15-008', axes: { environmentProfileId: environment.id, runtimeMode, lifecycleCode: platformApplicability.lifecycleCode, operationFamily: 'PLATFORM-RUNTIME', platformProfile: platformApplicability.id }, disposition: 'required', rationale: `STORY-SPEC-15 Section 3.7 ${platformApplicability.id} runtime applicability` });
    }
}

const volumeTexts = fs.readdirSync(specDir).filter((name) => /^\d{2}-.*\.md$/.test(name)).map((name) => read(path.join(specDir, name))).join('\n');
const sloIds = [...new Set([...volumeTexts.matchAll(/\bSLO-(?:01|14|15)-\d{3}\b/g)].map((match) => match[0]))].sort();
const openDecisionIds = [...new Set([...volumeTexts.matchAll(/\bOD-\d{2}-\d{3}\b/g)].map((match) => match[0]))].sort();
assert(sloIds.length === 98 && openDecisionIds.length === 101, 'SLO or decision inventory changed');
const sloOwners = new Map();
for (const requirement of requirements) for (const slo of expandIdReferences(requirement.statement, 'SLO')) {
    const list = sloOwners.get(slo) ?? [];
    list.push(requirement.id);
    sloOwners.set(slo, list);
}
for (const [slo, ownerIds] of Object.entries(profile.qualityObjectiveOwnerOverrides)) {
    assert(sloIds.includes(slo), `Unknown quality objective override ${slo}`);
    assertUniqueNonempty(ownerIds, `${slo} owner overrides`);
    for (const requirementId of ownerIds) assert(requirementById.has(requirementId), `${slo} maps unknown ${requirementId}`);
    sloOwners.set(slo, [...new Set([...(sloOwners.get(slo) ?? []), ...ownerIds])].sort());
}
for (const slo of sloIds) assertUniqueNonempty(sloOwners.get(slo), `${slo} owning requirements`);
function qualityEnvironments(slo) {
    const selectors = profile.qualityEnvironmentSelectors.filter((entry) => slo >= entry.start && slo <= entry.end);
    assert(selectors.length === 1, `${slo} must have exactly one quality environment selector`);
    const selector = selectors[0];
    const environments = endstateEnvironments.filter((entry) => selector.environmentClasses.includes(entry.definition.environmentClass) && selector.networkProfiles.includes(entry.definition.networkProfile) && selector.powerProfiles.includes(entry.definition.powerMode));
    assert(environments.length > 0, `${slo} selector has no concrete environments`);
    return environments;
}
for (const slo of sloIds) for (const requirementId of sloOwners.get(slo)) for (const environment of qualityEnvironments(slo)) addCell({ shard: `matrix-quality-${slo.slice(4, 6)}`, facet: 'QUAL', requirementId, axes: { environmentProfileId: environment.id, operationFamily: slo, lifecycleCode: 'LC-FAIL' }, disposition: 'required', rationale: `${slo} exact owning requirement and declared quality environment` });
for (const inputClass of profile.workloadProfiles) for (const failureClass of [...profile.runtimeFailures, ...profile.generalFailureClasses]) addCell({ shard: 'matrix-failure', facet: 'FAIL', requirementId: 'REQ-14-009', axes: { surfaceCode: 'SUR-DIAG', lifecycleCode: 'LC-FAIL', inputClass, failureClass }, disposition: 'required', rationale: 'STORY-SPEC-14 Section 3.4 workload failure-variant matrix' });

const joinSourceFacets = new Set(['CTX', 'ED', 'OUT', 'RTI', 'RTD', 'RTF', 'RRP', 'AUTH', 'A11Y', 'QUAL', 'FAIL']);
const joinSources = [...shards.values()].flat().filter((row) => joinSourceFacets.has(row[CELL_FIELDS.indexOf('matrixFacet')]) && row[CELL_FIELDS.indexOf('applicability')] === 'required');
for (const source of joinSources) {
    const sourceFacet = source[CELL_FIELDS.indexOf('matrixFacet')];
    const sourceScope = Object.fromEntries(SOURCE_SCOPE_FIELDS.map((field) => [field, source[CELL_FIELDS.indexOf(field)]]));
    sourceScope.artifactObligationIds = artifactObligationIds(sourceScope.protocolIds);
    const axes = { sourceCellId: sourceScope.cellId, sourceScope };
    for (const field of ['surfaceCode', 'lifecycleCode', 'durabilityAxis', 'entityFamily', 'operationFamily', 'outputProfile', 'runtimeMode', 'inputClass', 'displayClass', 'failureClass', 'role', 'capability', 'connectivityState', 'environmentProfileId', 'accessibilityProfile', 'platformProfile']) {
        const value = source[CELL_FIELDS.indexOf(field)];
        if (value !== null) axes[field] = value;
    }
    addCell({ shard: `matrix-join-${sourceFacet.toLowerCase()}`, facet: 'JOIN', requirementId: 'REQ-15-009', axes, disposition: 'required', rationale: `STORY-SPEC-15 Section 3.8 exact cross-matrix join for ${sourceFacet} cell ${axes.sourceCellId}` });
}

const sourceFixtureIds = [...new Set(protocolRegistry.protocols.flatMap((entry) => entry.setup.fixtureIds ?? []))].sort();
const sourceEnvironmentIds = [...new Set(protocolRegistry.protocols.flatMap((entry) => entry.setup.environmentIds ?? []))].sort();
assert(sourceFixtureIds.length === 55 && sourceEnvironmentIds.length === 58, 'Source protocol fixture/environment inventory changed');
const protocolEntries = protocolRegistry.protocols.map((entry) => ({
    id: entry.id, version: entry.definitionVersion, status: entry.status, owner: entry.owner,
    templates: entry.templates, fixtureIds: entry.setup.fixtureIds, environmentIds: entry.setup.environmentIds,
    requirementIds: entry.applicability.requirements, criterionIds: entry.applicability.criteria,
    requiredCellCount: [...shards.values()].flat().filter((row) => row[CELL_FIELDS.indexOf('protocolIds')].includes(entry.id)).length
}));
const fixtureObligations = sourceFixtureIds.flatMap((fixtureId) => ['POSITIVE', 'NEGATIVE', 'BOUNDARY', 'MALFORMED', 'FAILURE'].map((variant) => ({ id: `FIXTURE-OBLIGATION-END1-${fixtureId}-${variant}`, fixtureId, variant, status: 'required-not-materialized' })));
const environmentObligations = [
    ...sourceEnvironmentIds.map((id) => ({ id, source: 'protocol-registry', status: 'required-not-materialized' })),
    ...endstateEnvironments.map((entry) => ({ ...entry, source: 'end-state-profile' }))
];
const artifactObligations = [];
for (const protocol of protocolRegistry.protocols) {
    for (const template of protocol.templates) {
        assert(artifactRolesByTemplate[template], `${protocol.id} has unknown template ${template}`);
        for (const fixtureId of protocol.setup.fixtureIds) for (const role of artifactRolesByTemplate[template]) artifactObligations.push({ id: `ART-END1-${protocol.id.slice(5)}-${fixtureId}-${template.toUpperCase()}-${role}`, protocolId: protocol.id, fixtureId, template, role, status: 'required-not-materialized' });
    }
    for (const role of protocol.evidence.artifacts ?? []) artifactObligations.push({ id: `ART-END1-${protocol.id.slice(5)}-SOURCE-${String(role).toUpperCase()}`, protocolId: protocol.id, fixtureId: null, template: 'source-protocol', role, status: 'required-not-materialized' });
}
assert(new Set(artifactObligations.map((entry) => entry.id)).size === artifactObligations.length, 'Duplicate artifact obligations');
const goldenObligations = profile.corpusFamilies.flatMap((corpus) => profile.goldenTypesByCorpus[corpus].map((type) => ({ id: `GOLDEN-END1-${corpus.slice(4)}-${type}`, corpus, type, version: 'UNMATERIALIZED', sourceHash: null, status: 'required-not-materialized' })));
const decisions = [
    ...openDecisionIds.map((id) => ({ id, kind: 'open-decision-trigger', state: 'pending' })),
    ...profile.phaseDecisionIds.map((id) => ({ id, kind: 'phase-exit', state: 'pending' })),
    ...profile.releaseDecisionIds.map((id) => ({ id, kind: 'release-checkpoint', state: 'pending' })),
    ...profile.rollbackDecisionIds.map((id) => ({ id, kind: 'rollback-trigger', state: 'pending' })),
    { id: profile.activationDecisionId, kind: 'universe-activation', state: 'pending' }
];
assert(new Set(decisions.map((entry) => entry.id)).size === decisions.length, 'Duplicate decisions');

const shardManifest = [];
const physicalShards = new Map();
let normalizedCellCount = 0;
const blockerCounts = {};
let blockedCellCount = 0;
let readyToEvaluateCellCount = 0;
for (const [name, rows] of [...shards.entries()].sort(([left], [right]) => left.localeCompare(right))) {
    const chunks = chunkRows(rows);
    for (const [chunkIndex, chunk] of chunks.entries()) {
        const physicalName = chunks.length === 1 ? name : `${name}-part-${String(chunkIndex + 1).padStart(3, '0')}`;
        const shard = { schemaVersion: 'story.expected-universe.cells/3.0.0', universeId: 'EXPECTED-UNIVERSE-1', profileId: profile.profileId, sourceRevision: traceability.sourceRevision, cellFields: CELL_FIELDS, cellCount: chunk.length, rows: chunk };
        shard.contentSha256 = sha256(JSON.stringify(shard));
        const content = `${JSON.stringify(shard)}\n`;
        const file = `expected-universe-1/${physicalName}.json`;
        assert(Buffer.byteLength(content) < SHARD_MAX_BYTES, `${file} exceeds 15 MiB shard limit`);
        physicalShards.set(physicalName, chunk);
        shardManifest.push({ name: physicalName, logicalName: name, part: chunkIndex + 1, partCount: chunks.length, file, cellCount: chunk.length, sha256: sha256(content), contentSha256: shard.contentSha256 });
    }
    normalizedCellCount += rows.length;
    for (const row of rows) {
        const blockers = row[CELL_FIELDS.indexOf('bindingBlockers')];
        if (blockers.length) blockedCellCount += 1;
        else if (row[CELL_FIELDS.indexOf('applicability')] === 'required') readyToEvaluateCellCount += 1;
        for (const blocker of blockers) blockerCounts[blocker] = (blockerCounts[blocker] ?? 0) + 1;
    }
}

const expectedIds = [
    ...requirements.map((entry) => entry.id), ...requirements.map((entry) => entry.criterionId),
    ...[...shards.values()].flat().map((row) => row[0]), ...protocolEntries.map((entry) => entry.id),
    ...fixtureObligations.map((entry) => entry.id), ...environmentObligations.map((entry) => entry.id),
    ...artifactObligations.map((entry) => entry.id), ...goldenObligations.map((entry) => entry.id),
    ...profile.corpusFamilies, ...profile.evidenceClasses, ...sloIds, ...decisions.map((entry) => entry.id)
].sort();
assert(new Set(expectedIds).size === expectedIds.length, 'Expected universe contains duplicate IDs');

const pointer = {
    schemaVersion: 'story.endstate-profile-pointer/1.0.0',
    status: 'bootstrap-draft-not-active',
    activeProfileId: null,
    activeUniverseId: null,
    draftProfileId: profile.profileId,
    draftProfileSha256: profileSha256,
    draftUniverseId: 'EXPECTED-UNIVERSE-1',
    activationDecisionId: profile.activationDecisionId,
    predecessorPair: null,
    successorPair: null
};
const manifest = {
    schemaVersion: 'story.expected-universe/3.0.0', universeId: 'EXPECTED-UNIVERSE-1', version: '3.0.0-draft',
    status: 'generated-draft-not-active', predecessorUniverseId: null, successorUniverseId: null,
    profileId: profile.profileId, profileVersion: profile.profileVersion, profileSha256,
    implementationPlanSha256: profile.implementationPlanSha256, traceabilityIndexSha256: profile.traceabilityIndexSha256,
    canonicalEnumsSha256: profile.canonicalEnumsSha256, protocolRegistrySha256: profile.protocolRegistrySha256,
    qualityRegistryVersion: profile.qualityRegistryVersion, conformanceMatrixVersion: profile.conformanceMatrixVersion,
    sourceRevision: traceability.sourceRevision, candidateIdentity: { productCommit: profile.productCommit, buildId: profile.buildId },
    requirementCount: requirements.length, criterionCount: requirements.length, normalizedCellCount,
    mappedRequirementCount, unmappedRequirementCount: requirements.length - mappedRequirementCount,
    blockedCellCount, readyToEvaluateCellCount, blockerCounts,
    protocolCount: protocolEntries.length, fixtureObligationCount: fixtureObligations.length,
    environmentObligationCount: environmentObligations.length, artifactObligationCount: artifactObligations.length,
    goldenObligationCount: goldenObligations.length, corpusFamilyCount: profile.corpusFamilies.length,
    evidenceClassCount: profile.evidenceClasses.length, qualityObjectiveCount: sloIds.length,
    decisionCount: decisions.length, expectedIdCount: expectedIds.length, expectedIdsSha256: sha256(expectedIds.join('\n')),
    facetCounts, cellFields: CELL_FIELDS, shards: shardManifest,
    requirements: requirements.map((entry) => ({ ...entry, normalizedCellCount: requirementCellIds.get(entry.id).length })),
    protocols: protocolEntries,
    fixtureObligations, environmentObligations, artifactObligations, goldenObligations,
    corpusFamilies: profile.corpusFamilies, evidenceClasses: profile.evidenceClasses,
    qualityObjectiveIds: sloIds, decisions
};
manifest.contentSha256 = sha256(JSON.stringify(manifest));
const manifestJson = `${JSON.stringify(manifest, null, 2)}\n`;
const pointerJson = `${JSON.stringify(pointer, null, 2)}\n`;
const markdown = `# Generated End-State Expected Universe\n\n> **Schema:** \`${manifest.schemaVersion}\`  \n> **Universe:** \`${manifest.universeId}\`  \n> **Status:** ${manifest.status}  \n> **Profile:** \`${manifest.profileId}\` (${profile.status})  \n> **Candidate:** ${profile.productCommit} / ${profile.buildId}  \n> **Expected-ID hash:** \`${manifest.expectedIdsSha256}\`  \n> **Validate:** \`npm run universe:validate\`\n\nThis is a sharded generated draft denominator, not implementation, evidence, support, activation, or release. The active pointer remains null until \`${profile.activationDecisionId}\` closes. Protocol, fixture, environment, risk, or evidence readiness is represented as an explicit blocker and is never inferred as complete.\n\n| Requirements | Mapped requirements | Unmapped requirements | Criteria | Normalized cells | Blocked cells | Ready to evaluate | Shards | Protocols | Expected IDs |\n|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|\n| ${manifest.requirementCount} | ${manifest.mappedRequirementCount} | ${manifest.unmappedRequirementCount} | ${manifest.criterionCount} | ${manifest.normalizedCellCount} | ${manifest.blockedCellCount} | ${manifest.readyToEvaluateCellCount} | ${manifest.shards.length} | ${manifest.protocolCount} | ${manifest.expectedIdCount} |\n\n## Binding Blockers\n\n| Reason | Cells |\n|---|---:|\n${Object.entries(blockerCounts).sort(([left], [right]) => left.localeCompare(right)).map(([reason, count]) => `| \`${reason}\` | ${count} |`).join('\n')}\n\n## Normalized Matrix\n\nEvery row uses the embedded \`SCH-15-002\` field order, binds one exact requirement/criterion/profile, preserves its matrix disposition, and records the currently allocated protocol, fixture, environment, evidence-class, and proposed risk scope together with every missing binding.\n\n| Facet | Cells |\n|---|---:|\n${Object.entries(facetCounts).map(([facet, count]) => `| \`${facet}\` | ${count} |`).join('\n')}\n\n| Shard | Cells | SHA-256 |\n|---|---:|---|\n${shardManifest.map((entry) => `| [${entry.name}](${entry.file}) | ${entry.cellCount} | \`${entry.sha256}\` |`).join('\n')}\n`;

let valid = writeOrCheck(manifestPath, manifestJson) && writeOrCheck(markdownPath, markdown) && writeOrCheck(pointerPath, pointerJson);
const expectedShardFiles = new Set(shardManifest.map((entry) => path.basename(entry.file)));
const actualShardFiles = fs.existsSync(shardDir) ? fs.readdirSync(shardDir).filter((name) => name.endsWith('.json')) : [];
if (checkOnly) {
    if (actualShardFiles.length !== expectedShardFiles.size || actualShardFiles.some((name) => !expectedShardFiles.has(name))) {
        console.error('Generated expected universe has missing or stale shard files.');
        valid = false;
    }
} else {
    for (const name of actualShardFiles) if (!expectedShardFiles.has(name)) fs.rmSync(path.join(shardDir, name));
}
for (const entry of shardManifest) {
    const rows = physicalShards.get(entry.name);
    const shard = { schemaVersion: 'story.expected-universe.cells/3.0.0', universeId: 'EXPECTED-UNIVERSE-1', profileId: profile.profileId, sourceRevision: traceability.sourceRevision, cellFields: CELL_FIELDS, cellCount: rows.length, rows };
    shard.contentSha256 = sha256(JSON.stringify(shard));
    valid = writeOrCheck(path.join(implementationDir, entry.file), `${JSON.stringify(shard)}\n`) && valid;
}
if (!valid) process.exit(1);
if (checkOnly) console.log(`Expected universe V3 is current (${manifest.expectedIdCount} IDs, ${manifest.normalizedCellCount} normalized cells, ${manifest.shards.length} shards).`);
else console.log(`Generated ${path.relative(root, manifestPath)}, ${path.relative(root, pointerPath)}, and ${manifest.shards.length} shards.`);
