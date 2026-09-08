import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const implementationDir = path.join(root, 'documentation', 'product', 'implementation');
const specDir = path.join(root, 'documentation', 'product', 'specification');
const manifestPath = process.env.STORY_UNIVERSE_MANIFEST
    ? path.resolve(process.env.STORY_UNIVERSE_MANIFEST)
    : path.join(implementationDir, 'expected-universe-1.json');
const profilePath = process.env.STORY_UNIVERSE_PROFILE
    ? path.resolve(process.env.STORY_UNIVERSE_PROFILE)
    : path.join(implementationDir, 'profile-endstate-1.json');
const pointerPath = process.env.STORY_UNIVERSE_POINTER
    ? path.resolve(process.env.STORY_UNIVERSE_POINTER)
    : path.join(implementationDir, 'endstate-profile-pointer.json');
const shardRoot = process.env.STORY_UNIVERSE_SHARD_ROOT
    ? path.resolve(process.env.STORY_UNIVERSE_SHARD_ROOT)
    : implementationDir;

function read(filePath) { return fs.readFileSync(filePath, 'utf8'); }
function readJson(filePath) { return JSON.parse(read(filePath)); }
function sha256(value) { return crypto.createHash('sha256').update(value).digest('hex'); }
function assert(condition, message) { if (!condition) throw new Error(message); }
function sorted(values) { return [...values].sort(); }
function sameSet(actual, expected, label) {
    assert(JSON.stringify(sorted(actual)) === JSON.stringify(sorted(expected)), `${label} differs`);
}
function cartesian(...axes) {
    return axes.reduce((rows, axis) => rows.flatMap((row) => axis.map((value) => [...row, value])), [[]]);
}
function rowValue(row, field, fields) { return row[fields.indexOf(field)]; }
const IDENTITY_AXES_BY_FACET = {
    RSL: ['surfaceCode', 'lifecycleCode'],
    CTX: ['displayClass', 'accessibilityProfile', 'inputClass'],
    ED: ['durabilityAxis', 'entityFamily', 'lifecycleCode', 'operationFamily'],
    OUT: ['surfaceCode', 'lifecycleCode', 'outputProfile', 'operationFamily'],
    RTI: ['surfaceCode', 'lifecycleCode', 'runtimeMode', 'inputClass'],
    RTD: ['surfaceCode', 'lifecycleCode', 'runtimeMode', 'displayClass'],
    RTF: ['surfaceCode', 'lifecycleCode', 'runtimeMode', 'failureClass'],
    RRP: ['lifecycleCode', 'runtimeMode', 'role', 'displayClass'],
    AUTH: ['surfaceCode', 'lifecycleCode', 'role', 'capability', 'connectivityState'],
    A11Y: ['environmentProfileId', 'accessibilityProfile', 'outputProfile', 'runtimeMode', 'lifecycleCode', 'operationFamily', 'platformProfile'],
    QUAL: ['environmentProfileId', 'operationFamily', 'lifecycleCode'],
    FAIL: ['surfaceCode', 'lifecycleCode', 'inputClass', 'failureClass'],
    JOIN: ['sourceCellId', 'sourceScope', 'surfaceCode', 'lifecycleCode', 'durabilityAxis', 'entityFamily', 'operationFamily', 'outputProfile', 'runtimeMode', 'inputClass', 'displayClass', 'failureClass', 'role', 'capability', 'connectivityState', 'environmentProfileId', 'accessibilityProfile', 'platformProfile']
};
function expectedCellId(row, fields) {
    const facet = rowValue(row, 'matrixFacet', fields);
    const requirementId = rowValue(row, 'requirementId', fields);
    const axes = Object.fromEntries(IDENTITY_AXES_BY_FACET[facet]
        .map((field) => [field, rowValue(row, field, fields)])
        .filter(([, value]) => value !== null)
        .sort(([left], [right]) => left.localeCompare(right)));
    const key = `${facet}|requirement=${requirementId}|${Object.entries(axes).map(([field, value]) => `${field}=${typeof value === 'object' ? JSON.stringify(value) : value}`).join('|')}`;
    return `CELL-END1-${facet}-${requirementId}-${sha256(key).slice(0, 20).toUpperCase()}`;
}
function expectedEvidenceClasses(facet) {
    const classes = {
        RSL: ['EVC-MODEL', 'EVC-HEADED'], CTX: ['EVC-HEADED', 'EVC-EVAL', 'EVC-MANUAL'],
        ED: ['EVC-MODEL', 'EVC-ARTIFACT', 'EVC-COLLAB'], OUT: ['EVC-ARTIFACT', 'EVC-MANUAL'],
        RTI: ['EVC-HEADED', 'EVC-MANUAL'], RTD: ['EVC-HEADED', 'EVC-MANUAL'],
        RTF: ['EVC-HEADED', 'EVC-RESCUE'], RRP: ['EVC-HEADED', 'EVC-RESCUE'],
        AUTH: ['EVC-COLLAB', 'EVC-RESCUE'], A11Y: ['EVC-HEADED', 'EVC-MANUAL', 'EVC-ARTIFACT'],
        QUAL: ['EVC-QUALITY'], FAIL: ['EVC-RESCUE', 'EVC-QUALITY'], JOIN: ['EVC-MODEL']
    };
    return classes[facet];
}
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

const manifest = readJson(manifestPath);
const profile = readJson(profilePath);
const pointer = readJson(pointerPath);
const traceability = readJson(path.join(specDir, 'traceability-index.json'));
const protocolRegistry = readJson(path.join(specDir, 'protocol-registry.json'));

assert(manifest.schemaVersion === 'story.expected-universe/3.0.0', 'Unexpected universe schema');
assert(manifest.status === 'generated-draft-not-active', 'Universe must remain generated-draft-not-active');
assert(profile.status === 'draft-not-accepted', 'Profile must remain draft-not-accepted');
assert(pointer.status === 'bootstrap-draft-not-active', 'Pointer must remain bootstrap-draft-not-active');
assert(pointer.activeProfileId === null && pointer.activeUniverseId === null, 'Draft universe must not be active');
assert(pointer.draftProfileId === profile.profileId && pointer.draftUniverseId === manifest.universeId, 'Pointer draft pair differs');
assert(pointer.draftProfileSha256 === sha256(read(profilePath)), 'Pointer profile hash differs');
assert(manifest.profileSha256 === sha256(read(profilePath)), 'Manifest profile hash differs');
assert(manifest.protocolRegistrySha256 === sha256(read(path.join(specDir, 'protocol-registry.json'))), 'Manifest protocol registry hash differs');
assert(manifest.traceabilityIndexSha256 === sha256(read(path.join(specDir, 'traceability-index.json'))), 'Manifest traceability hash differs');
const contentHashInput = { ...manifest };
delete contentHashInput.contentSha256;
assert(manifest.contentSha256 === sha256(JSON.stringify(contentHashInput)), 'Manifest content hash differs');

const requirements = new Map(traceability.requirements.map((entry) => [entry.id, entry]));
const criteria = new Map(traceability.requirements.map((entry) => [entry.acceptance[0], entry.id]));
assert(manifest.requirementCount === requirements.size, 'Manifest requirement count differs');
assert(manifest.criterionCount === criteria.size, 'Manifest criterion count differs');
assert(manifest.requirements.length === requirements.size, 'Manifest requirement inventory differs');
for (const entry of manifest.requirements) {
    const source = requirements.get(entry.id);
    assert(source && entry.criterionId === source.acceptance[0] && entry.volume === source.volume, `Manifest requirement ${entry.id} differs`);
    assert(Number.isInteger(entry.normalizedCellCount) && entry.normalizedCellCount > 0, `${entry.id} has invalid normalized cell count`);
}

const protocolById = new Map(protocolRegistry.protocols.map((entry) => [entry.id, entry]));
const protocolsByRequirement = new Map([...requirements.keys()].map((id) => [id, []]));
for (const protocol of protocolRegistry.protocols) for (const requirementId of protocol.applicability.requirements) protocolsByRequirement.get(requirementId)?.push(protocol.id);
const mappedRequirementCount = [...protocolsByRequirement.values()].filter((ids) => ids.length > 0).length;
assert(manifest.protocolCount === protocolRegistry.protocolCount && manifest.protocols.length === protocolRegistry.protocolCount, 'Protocol inventory differs');
sameSet(manifest.protocols.map((entry) => entry.id), protocolRegistry.protocols.map((entry) => entry.id), 'Manifest protocol IDs');
for (const entry of manifest.protocols) {
    const source = protocolById.get(entry.id);
    assert(source && entry.version === source.definitionVersion && entry.status === source.status, `${entry.id} manifest protocol differs`);
    assert(JSON.stringify(entry.templates) === JSON.stringify(source.templates), `${entry.id} templates differ`);
    assert(JSON.stringify(entry.fixtureIds) === JSON.stringify(source.setup.fixtureIds), `${entry.id} fixture inventory differs`);
    assert(JSON.stringify(entry.environmentIds) === JSON.stringify(source.setup.environmentIds), `${entry.id} environment inventory differs`);
    assert(JSON.stringify(entry.requirementIds) === JSON.stringify(source.applicability.requirements), `${entry.id} requirement inventory differs`);
}

const fields = manifest.cellFields;
const requiredFields = ['durabilityAxis', 'platformProfile', 'bindingBlockers', 'sourceCellId', 'sourceScope'];
const applicabilityValues = new Set(['required', 'not-applicable']);
const verificationValues = new Set(['blocked', 'not-evaluated']);
const knownFacets = new Set(Object.keys(profile.requiredProtocolIdsByFacet));
const knownRisks = new Set(Object.keys(profile.requiredVerificationLayersByRisk));
const knownProtocolIds = new Set(protocolById.keys());
const knownEnvironmentIds = new Set(manifest.environmentObligations.map((entry) => entry.id));
const protocolLayers = (protocolIds) => new Set(protocolIds.flatMap((id) => protocolById.get(id)?.status === 'complete' ? protocolById.get(id).verificationLayers ?? [] : []));
function artifactObligationIds(protocolIds) {
    const ids = [];
    for (const protocolId of protocolIds) {
        const protocol = protocolById.get(protocolId);
        for (const template of protocol.templates) for (const fixtureId of protocol.setup.fixtureIds) for (const role of artifactRolesByTemplate[template]) ids.push(`ART-END1-${protocolId.slice(5)}-${fixtureId}-${template.toUpperCase()}-${role}`);
        for (const role of protocol.evidence.artifacts ?? []) ids.push(`ART-END1-${protocolId.slice(5)}-SOURCE-${String(role).toUpperCase()}`);
    }
    return [...new Set(ids)].sort();
}
assert(new Set(fields).size === fields.length && fields.length === 36 && requiredFields.every((field) => fields.includes(field)), 'Normalized field schema differs');
function expectedBindingBlockers(requirementId, facet, applicability, protocols, fixtures, environmentProfileId, riskClass, semanticBlockers = []) {
    if (applicability !== 'required') return [];
    const blockers = [];
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
    return [...blockers, ...semanticBlockers];
}
const rows = [];
const cellIds = new Set();
const facetCounts = {};
const requirementCounts = new Map([...requirements.keys()].map((id) => [id, 0]));
const protocolCounts = new Map([...protocolById.keys()].map((id) => [id, 0]));
if (!process.env.STORY_UNIVERSE_SHARD_ROOT) {
    const expectedShardFiles = sorted(manifest.shards.map((entry) => path.basename(entry.file)));
    const actualShardFiles = sorted(fs.readdirSync(path.join(implementationDir, 'expected-universe-1')).filter((name) => name.endsWith('.json')));
    assert(JSON.stringify(actualShardFiles) === JSON.stringify(expectedShardFiles), 'Shard directory differs from manifest');
}
for (const entry of manifest.shards) {
    const overrideShardPath = path.join(shardRoot, entry.file);
    const shardPath = fs.existsSync(overrideShardPath) ? overrideShardPath : path.join(implementationDir, entry.file);
    assert(fs.existsSync(shardPath), `Missing shard ${entry.file}`);
    assert(fs.statSync(shardPath).size < 15 * 1024 * 1024, `${entry.file} exceeds 15 MiB`);
    const content = read(shardPath);
    assert(entry.sha256 === sha256(content), `${entry.file} file hash differs`);
    const shard = JSON.parse(content);
    const shardHashInput = { ...shard };
    delete shardHashInput.contentSha256;
    assert(shard.contentSha256 === sha256(JSON.stringify(shardHashInput)), `${entry.file} content hash differs`);
    assert(JSON.stringify(shard.cellFields) === JSON.stringify(fields), `${entry.file} field schema differs`);
    assert(shard.cellCount === shard.rows.length && shard.cellCount === entry.cellCount, `${entry.file} row count differs`);
    for (const row of shard.rows) {
        assert(Array.isArray(row) && row.length === fields.length, `${entry.file} has malformed row`);
        const id = rowValue(row, 'cellId', fields);
        const requirementId = rowValue(row, 'requirementId', fields);
        const criterionId = rowValue(row, 'criterionId', fields);
        const facet = rowValue(row, 'matrixFacet', fields);
        assert(/^CELL-END1-[A-Z0-9]+-REQ-\d{2}-\d{3}-[A-F0-9]{20}$/.test(id), `Invalid cell ID ${id}`);
        assert(id === expectedCellId(row, fields), `${id} cell identity differs`);
        assert(!cellIds.has(id), `Duplicate cell ID ${id}`);
        assert(requirements.has(requirementId), `${id} has unknown requirement`);
        assert(criteria.get(criterionId) === requirementId, `${id} criterion mismatch`);
        assert(rowValue(row, 'profileId', fields) === profile.profileId, `${id} profile mismatch`);
        const requirement = requirements.get(requirementId);
        const applicability = rowValue(row, 'applicability', fields);
        const verificationDisposition = rowValue(row, 'verificationDisposition', fields);
        const riskClass = rowValue(row, 'riskClass', fields);
        assert(applicabilityValues.has(applicability), `${id} has invalid applicability`);
        assert(verificationValues.has(verificationDisposition), `${id} has invalid verification disposition`);
        assert(knownFacets.has(facet), `${id} has unknown matrix facet`);
        assert(knownRisks.has(riskClass) && riskClass === profile.riskClassByVolume[requirement.volume], `${id} risk class differs`);
        const lifecycleCode = rowValue(row, 'lifecycleCode', fields);
        assert(lifecycleCode === null || profile.lifecycles.includes(lifecycleCode), `${id} has noncanonical lifecycle`);
        const durabilityAxis = rowValue(row, 'durabilityAxis', fields);
        assert(durabilityAxis === null || profile.durabilityAxes.includes(durabilityAxis), `${id} has unknown durability axis`);
        const surfaceCode = rowValue(row, 'surfaceCode', fields);
        assert(surfaceCode === null || profile.surfaces.includes(surfaceCode), `${id} has unknown surface`);
        const runtimeMode = rowValue(row, 'runtimeMode', fields);
        assert(runtimeMode === null || profile.runtimeModes.includes(runtimeMode), `${id} has unknown runtime mode`);
        const role = rowValue(row, 'role', fields);
        assert(role === null || profile.runtimeRoles.includes(role) || profile.authorizationRoles.includes(role), `${id} has unknown role`);
        const evidenceClasses = rowValue(row, 'requiredEvidenceClasses', fields);
        assert(Array.isArray(evidenceClasses) && evidenceClasses.length > 0 && new Set(evidenceClasses).size === evidenceClasses.length, `${id} has invalid evidence classes`);
        assert(evidenceClasses.every((value) => profile.evidenceClasses.includes(value)), `${id} has unknown evidence class`);
        assert(JSON.stringify(evidenceClasses) === JSON.stringify(expectedEvidenceClasses(facet)), `${id} evidence classes differ`);
        assert(rowValue(row, 'evidenceIds', fields).length === 0, `${id} claims evidence`);
        assert(rowValue(row, 'waiverId', fields) === null, `${id} claims a waiver`);
        const expectedProtocols = sorted(protocolsByRequirement.get(requirementId));
        const actualProtocols = rowValue(row, 'protocolIds', fields);
        assert(Array.isArray(actualProtocols) && actualProtocols.every((value) => knownProtocolIds.has(value)), `${id} has unknown protocol`);
        assert(JSON.stringify(actualProtocols) === JSON.stringify(expectedProtocols), `${id} protocol bindings differ`);
        const expectedFixtures = sorted(new Set(expectedProtocols.flatMap((protocolId) => protocolById.get(protocolId).setup.fixtureIds)));
        const environmentProfileId = rowValue(row, 'environmentProfileId', fields);
        const expectedEnvironments = sorted(new Set([...expectedProtocols.flatMap((protocolId) => protocolById.get(protocolId).setup.environmentIds), ...(environmentProfileId ? [environmentProfileId] : [])]));
        assert(JSON.stringify(rowValue(row, 'fixtureIds', fields)) === JSON.stringify(expectedFixtures), `${id} fixture bindings differ`);
        assert(JSON.stringify(rowValue(row, 'environmentIds', fields)) === JSON.stringify(expectedEnvironments), `${id} environment bindings differ`);
        assert(environmentProfileId === null || expectedEnvironments.includes(environmentProfileId), `${id} environment profile is not bound`);
        if (environmentProfileId?.startsWith('ENV-END1-')) assert(knownEnvironmentIds.has(environmentProfileId), `${id} has unknown end-state environment`);
        const blockers = rowValue(row, 'bindingBlockers', fields);
        const semanticBlockers = [];
        if (facet === 'RRP' && !profile.normativeRuntimeRolePlacements[runtimeMode]?.[role]?.includes(rowValue(row, 'displayClass', fields))) semanticBlockers.push('runtime-role-placement-allocation-unresolved');
        if (facet === 'RRP' && runtimeMode === 'Kiosk') semanticBlockers.push('runtime-host-controller-role-unresolved');
        const expectedBlockers = expectedBindingBlockers(requirementId, facet, applicability, actualProtocols, expectedFixtures, environmentProfileId, riskClass, semanticBlockers);
        assert(Array.isArray(blockers) && new Set(blockers).size === blockers.length, `${id} has invalid binding blockers`);
        assert(JSON.stringify(blockers) === JSON.stringify(expectedBlockers), `${id} binding blockers differ`);
        assert(verificationDisposition === (blockers.length ? 'blocked' : 'not-evaluated'), `${id} blocker disposition differs`);
        cellIds.add(id);
        rows.push(row);
        facetCounts[facet] = (facetCounts[facet] ?? 0) + 1;
        requirementCounts.set(requirementId, requirementCounts.get(requirementId) + 1);
        for (const protocolId of actualProtocols) protocolCounts.set(protocolId, protocolCounts.get(protocolId) + 1);
    }
}
assert(rows.length === manifest.normalizedCellCount, 'Normalized cell count differs');
assert(JSON.stringify(Object.entries(facetCounts).sort()) === JSON.stringify(Object.entries(manifest.facetCounts).sort()), 'Facet counts differ');
for (const entry of manifest.requirements) assert(requirementCounts.get(entry.id) === entry.normalizedCellCount, `${entry.id} normalized count differs`);
for (const entry of manifest.protocols) assert(protocolCounts.get(entry.id) === entry.requiredCellCount, `${entry.id} cell count differs`);
assert(manifest.mappedRequirementCount === mappedRequirementCount && manifest.unmappedRequirementCount === requirements.size - mappedRequirementCount, 'Mapped requirement blocker counts differ');
const reconstructedBlockerCounts = {};
let reconstructedBlockedCells = 0;
let reconstructedReadyCells = 0;
for (const row of rows) {
    const blockers = rowValue(row, 'bindingBlockers', fields);
    if (blockers.length) reconstructedBlockedCells += 1;
    else if (rowValue(row, 'applicability', fields) === 'required') reconstructedReadyCells += 1;
    for (const blocker of blockers) reconstructedBlockerCounts[blocker] = (reconstructedBlockerCounts[blocker] ?? 0) + 1;
}
assert(manifest.blockedCellCount === reconstructedBlockedCells, 'Blocked cell count differs');
assert(manifest.readyToEvaluateCellCount === reconstructedReadyCells, 'Ready-to-evaluate cell count differs');
assert(JSON.stringify(Object.entries(manifest.blockerCounts).sort()) === JSON.stringify(Object.entries(reconstructedBlockerCounts).sort()), 'Blocker reason counts differ');

function selectFacet(facet) { return rows.filter((row) => rowValue(row, 'matrixFacet', fields) === facet); }
function tuple(row, names) { return names.map((name) => rowValue(row, name, fields)).join('|'); }
function assertExactRows(actualRows, expectedTuples, names, label) {
    const actual = actualRows.map((row) => tuple(row, names));
    assert(actual.length === new Set(actual).size, `${label} has duplicate axis tuples`);
    sameSet(actual, expectedTuples.map((values) => values.join('|')), label);
}

const rslRows = selectFacet('RSL');
for (const [requirementId, requirement] of requirements) {
    const minimum = profile.ownerMinimums[requirement.volume];
    const expected = cartesian(minimum.surfaces, minimum.lifecycles);
    assertExactRows(rslRows.filter((row) => rowValue(row, 'requirementId', fields) === requirementId), expected, ['surfaceCode', 'lifecycleCode'], `${requirementId} RSL coverage`);
}
const contextExpected = cartesian(profile.windowTiers, profile.workspaceViews, profile.inputTiers);
assertExactRows(selectFacet('CTX'), contextExpected, ['displayClass', 'accessibilityProfile', 'inputClass'], 'Context matrix');
assert(selectFacet('CTX').every((row) => rowValue(row, 'requirementId', fields) === 'REQ-15-008'), 'Context matrix owner differs');

const durabilityExpected = [];
for (const entityFamily of profile.entityFamilies) for (const operationFamily of profile.operationsByEntityFamily[entityFamily]) profile.durabilityAxes.forEach((durabilityAxis, index) => durabilityExpected.push([entityFamily, operationFamily, durabilityAxis, profile.durabilityLifecycleByAxis[durabilityAxis], profile.durabilityDispositionByEntity[entityFamily][index]]));
assertExactRows(selectFacet('ED'), durabilityExpected, ['entityFamily', 'operationFamily', 'durabilityAxis', 'lifecycleCode', 'matrixDisposition'], 'Entity durability matrix');
assert(selectFacet('ED').every((row) => rowValue(row, 'requirementId', fields) === 'REQ-15-004'), 'Entity durability owner differs');
const outputExpected = [];
for (const outputProfile of profile.outputProfiles) for (const dimension of profile.fidelityDimensions) outputExpected.push([outputProfile, `FIDELITY-${dimension}`, profile.requiredFidelityByOutput[outputProfile].includes(dimension) ? 'R' : 'N not-applicable under the Section 3.4 output contract']);
assertExactRows(selectFacet('OUT'), outputExpected, ['outputProfile', 'operationFamily', 'matrixDisposition'], 'Output fidelity matrix');
assert(selectFacet('OUT').every((row) => rowValue(row, 'requirementId', fields) === 'REQ-15-005'), 'Output matrix owner differs');

const runtimeInputExpected = [];
const runtimeFailureExpected = [];
for (const runtimeMode of profile.runtimeModes) {
    profile.runtimeInputs.forEach((inputClass, index) => runtimeInputExpected.push([runtimeMode, inputClass, profile.runtimeInputDispositions[runtimeMode][index]]));
    profile.runtimeFailures.forEach((failureClass) => runtimeFailureExpected.push([runtimeMode, failureClass, profile.runtimeFailureDispositions[failureClass][profile.runtimeModes.indexOf(runtimeMode)]]));
}
assertExactRows(selectFacet('RTI'), runtimeInputExpected, ['runtimeMode', 'inputClass', 'matrixDisposition'], 'Runtime input matrix');
assertExactRows(selectFacet('RTF'), runtimeFailureExpected, ['runtimeMode', 'failureClass', 'matrixDisposition'], 'Runtime failure matrix');
assertExactRows(selectFacet('RTD'), cartesian(profile.runtimeModes, profile.runtimeDisplays).map(([mode, display]) => [mode, display, profile.runtimeDisplayBehaviors[display]]), ['runtimeMode', 'displayClass', 'matrixDisposition'], 'Runtime display matrix');
const runtimeRoleExpected = [];
for (const runtimeMode of profile.runtimeModes) for (const role of profile.runtimeRoles) for (const placement of profile.placements) {
    const allocated = profile.normativeRuntimeRolePlacements[runtimeMode]?.[role]?.includes(placement);
    const requiredRole = profile.runtimeRequiredPrivateRoles[runtimeMode].includes(role);
    runtimeRoleExpected.push([runtimeMode, role, placement, allocated ? 'X' : requiredRole ? 'UNRESOLVED required private role placement' : 'UNRESOLVED mode/role/placement compatibility']);
}
assertExactRows(selectFacet('RRP'), runtimeRoleExpected, ['runtimeMode', 'role', 'displayClass', 'matrixDisposition'], 'Runtime role/placement matrix');
for (const facet of ['RTI', 'RTD', 'RTF', 'RRP']) assert(selectFacet(facet).every((row) => rowValue(row, 'requirementId', fields) === 'REQ-15-006'), `${facet} owner differs`);

const authExpected = [];
for (const role of profile.authorizationRoles) profile.authorizationCapabilities.forEach((capability, index) => profile.connectivityStates.forEach((state) => authExpected.push([role, capability, state, profile.authorizationConnectivityTransforms[state][profile.authorizationCapabilityClasses[capability]][profile.authorizationPolicyRows[role][index]]])));
assertExactRows(selectFacet('AUTH'), authExpected, ['role', 'capability', 'connectivityState', 'matrixDisposition'], 'Authorization matrix');
assert(selectFacet('AUTH').every((row) => rowValue(row, 'requirementId', fields) === 'REQ-15-007'), 'Authorization owner differs');

const endstateEnvironments = manifest.environmentObligations.filter((entry) => entry.source === 'end-state-profile');
const platformExpected = [];
for (const platformProfile of profile.platformApplicabilityProfiles) {
    const environmentIds = endstateEnvironments.filter((entry) => platformProfile.environmentClasses.includes(entry.definition.environmentClass)).map((entry) => entry.id);
    assert(environmentIds.length > 0, `${platformProfile.id} has no concrete environments`);
    for (const environmentId of environmentIds) {
        for (const accessibilityProfile of platformProfile.accessibilityVariants) platformExpected.push([platformProfile.id, environmentId, 'PLATFORM-ACCESSIBILITY', accessibilityProfile, '', '', platformProfile.lifecycleCode]);
        for (const outputProfile of platformProfile.outputProfiles) platformExpected.push([platformProfile.id, environmentId, 'PLATFORM-OUTPUT', '', outputProfile, '', platformProfile.lifecycleCode]);
        for (const runtimeMode of platformProfile.runtimeModes) platformExpected.push([platformProfile.id, environmentId, 'PLATFORM-RUNTIME', '', '', runtimeMode, platformProfile.lifecycleCode]);
    }
}
assertExactRows(selectFacet('A11Y'), platformExpected, ['platformProfile', 'environmentProfileId', 'operationFamily', 'accessibilityProfile', 'outputProfile', 'runtimeMode', 'lifecycleCode'], 'Platform/accessibility matrix');
assert(selectFacet('A11Y').every((row) => rowValue(row, 'requirementId', fields) === 'REQ-15-008'), 'Platform/accessibility owner differs');
assertExactRows(selectFacet('FAIL'), cartesian(profile.workloadProfiles, [...profile.runtimeFailures, ...profile.generalFailureClasses]), ['inputClass', 'failureClass'], 'Failure matrix');
assert(selectFacet('FAIL').every((row) => rowValue(row, 'requirementId', fields) === 'REQ-14-009'), 'Failure matrix owner differs');

function qualitySelector(slo) {
    const selectors = profile.qualityEnvironmentSelectors.filter((entry) => slo >= entry.start && slo <= entry.end);
    assert(selectors.length === 1, `${slo} quality selector differs`);
    return selectors[0];
}
for (const row of selectFacet('QUAL')) {
    const slo = rowValue(row, 'operationFamily', fields);
    const environmentId = rowValue(row, 'environmentProfileId', fields);
    const environment = endstateEnvironments.find((entry) => entry.id === environmentId);
    const selector = qualitySelector(slo);
    assert(environment && selector.environmentClasses.includes(environment.definition.environmentClass) && selector.networkProfiles.includes(environment.definition.networkProfile) && selector.powerProfiles.includes(environment.definition.powerMode), `${rowValue(row, 'cellId', fields)} quality environment differs`);
}
for (const slo of manifest.qualityObjectiveIds) assert(selectFacet('QUAL').some((row) => rowValue(row, 'operationFamily', fields) === slo), `${slo} has no quality cell`);

const joinSourceFacets = new Set(['CTX', 'ED', 'OUT', 'RTI', 'RTD', 'RTF', 'RRP', 'AUTH', 'A11Y', 'QUAL', 'FAIL']);
const requiredJoinSources = rows.filter((row) => joinSourceFacets.has(rowValue(row, 'matrixFacet', fields)) && rowValue(row, 'applicability', fields) === 'required');
const joinRows = selectFacet('JOIN');
assert(joinRows.length === requiredJoinSources.length, 'Cross-matrix join count differs');
sameSet(joinRows.map((row) => rowValue(row, 'sourceCellId', fields)), requiredJoinSources.map((row) => rowValue(row, 'cellId', fields)), 'Cross-matrix join source IDs');
assert(joinRows.every((row) => rowValue(row, 'requirementId', fields) === 'REQ-15-009'), 'Cross-matrix join owner differs');
const sourceByCellId = new Map(requiredJoinSources.map((row) => [rowValue(row, 'cellId', fields), row]));
const projectedAxisFields = ['surfaceCode', 'lifecycleCode', 'durabilityAxis', 'entityFamily', 'operationFamily', 'outputProfile', 'runtimeMode', 'inputClass', 'displayClass', 'failureClass', 'role', 'capability', 'connectivityState', 'environmentProfileId', 'accessibilityProfile', 'platformProfile'];
for (const join of joinRows) {
    const joinId = rowValue(join, 'cellId', fields);
    const source = sourceByCellId.get(rowValue(join, 'sourceCellId', fields));
    assert(source, `${joinId} source cell is missing`);
    const expectedSourceScope = Object.fromEntries(SOURCE_SCOPE_FIELDS.map((field) => [field, rowValue(source, field, fields)]));
    expectedSourceScope.artifactObligationIds = artifactObligationIds(expectedSourceScope.protocolIds);
    assert(JSON.stringify(rowValue(join, 'sourceScope', fields)) === JSON.stringify(expectedSourceScope), `${joinId} source scope differs`);
    for (const field of projectedAxisFields) assert(JSON.stringify(rowValue(join, field, fields)) === JSON.stringify(rowValue(source, field, fields)), `${joinId} projected ${field} differs`);
}

assert(manifest.fixtureObligations.length === manifest.fixtureObligationCount, 'Fixture obligation count differs');
assert(manifest.environmentObligations.length === manifest.environmentObligationCount, 'Environment obligation count differs');
assert(manifest.artifactObligations.length === manifest.artifactObligationCount, 'Artifact obligation count differs');
const expectedArtifactIds = [];
for (const protocol of protocolRegistry.protocols) {
    for (const template of protocol.templates) for (const fixtureId of protocol.setup.fixtureIds) for (const role of artifactRolesByTemplate[template]) expectedArtifactIds.push(`ART-END1-${protocol.id.slice(5)}-${fixtureId}-${template.toUpperCase()}-${role}`);
    for (const role of protocol.evidence.artifacts ?? []) expectedArtifactIds.push(`ART-END1-${protocol.id.slice(5)}-SOURCE-${String(role).toUpperCase()}`);
}
sameSet(manifest.artifactObligations.map((entry) => entry.id), expectedArtifactIds, 'Artifact obligations');
assert(manifest.goldenObligations.length === manifest.goldenObligationCount, 'Golden obligation count differs');
assert(manifest.qualityObjectiveIds.length === manifest.qualityObjectiveCount, 'Quality objective count differs');
assert(manifest.decisions.length === manifest.decisionCount, 'Decision count differs');
const expectedIds = sorted([
    ...requirements.keys(), ...criteria.keys(), ...cellIds, ...manifest.protocols.map((entry) => entry.id),
    ...manifest.fixtureObligations.map((entry) => entry.id), ...manifest.environmentObligations.map((entry) => entry.id),
    ...manifest.artifactObligations.map((entry) => entry.id), ...manifest.goldenObligations.map((entry) => entry.id),
    ...manifest.corpusFamilies, ...manifest.evidenceClasses, ...manifest.qualityObjectiveIds,
    ...manifest.decisions.map((entry) => entry.id)
]);
assert(new Set(expectedIds).size === expectedIds.length, 'Expected universe contains duplicate IDs');
assert(expectedIds.length === manifest.expectedIdCount, 'Expected ID count differs');
assert(sha256(expectedIds.join('\n')) === manifest.expectedIdsSha256, 'Expected ID hash differs');
assert(fs.statSync(manifestPath).size < 15 * 1024 * 1024, 'Manifest exceeds 15 MiB');

console.log(`Expected universe V3 is valid (${manifest.expectedIdCount} IDs, ${manifest.normalizedCellCount} normalized cells, ${manifest.shards.length} shards).`);
