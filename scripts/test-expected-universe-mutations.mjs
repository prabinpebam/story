import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const implementationDir = path.join(root, 'documentation', 'product', 'implementation');
const sourceManifestPath = path.join(implementationDir, 'expected-universe-1.json');
const sourceProfilePath = path.join(implementationDir, 'profile-endstate-1.json');
const sourcePointerPath = path.join(implementationDir, 'endstate-profile-pointer.json');
const validatorPath = path.join(root, 'scripts', 'validate-expected-universe.mjs');

function readJson(filePath) { return JSON.parse(fs.readFileSync(filePath, 'utf8')); }
function sha256(value) { return crypto.createHash('sha256').update(value).digest('hex'); }
function writeJson(filePath, value, compact = false) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, `${JSON.stringify(value, null, compact ? 0 : 2)}\n`);
}
function updateContentHash(value) {
    const hashInput = { ...value };
    delete hashInput.contentSha256;
    value.contentSha256 = sha256(JSON.stringify(hashInput));
}
function assert(condition, message) { if (!condition) throw new Error(message); }

const sourceManifest = readJson(sourceManifestPath);
function fieldIndex(shard, field) { return shard.cellFields.indexOf(field); }
function recomputeJoinCellId(shard, row) {
    const axisFields = ['sourceCellId', 'sourceScope', 'surfaceCode', 'lifecycleCode', 'durabilityAxis', 'entityFamily', 'operationFamily', 'outputProfile', 'runtimeMode', 'inputClass', 'displayClass', 'failureClass', 'role', 'capability', 'connectivityState', 'environmentProfileId', 'accessibilityProfile', 'platformProfile'];
    const axes = Object.fromEntries(axisFields
        .map((field) => [field, row[fieldIndex(shard, field)]])
        .filter(([, value]) => value !== null)
        .sort(([left], [right]) => left.localeCompare(right)));
    const requirementId = row[fieldIndex(shard, 'requirementId')];
    const key = `JOIN|requirement=${requirementId}|${Object.entries(axes).map(([field, value]) => `${field}=${typeof value === 'object' ? JSON.stringify(value) : value}`).join('|')}`;
    row[fieldIndex(shard, 'cellId')] = `CELL-END1-JOIN-${requirementId}-${sha256(key).slice(0, 20).toUpperCase()}`;
}
function decrementManifestForRemovedRows(manifest, rows, shardName) {
    const field = (row, name) => row[manifest.cellFields.indexOf(name)];
    manifest.normalizedCellCount -= rows.length;
    manifest.shards.find((entry) => entry.name === shardName).cellCount -= rows.length;
    for (const row of rows) {
        const facet = field(row, 'matrixFacet');
        manifest.facetCounts[facet] -= 1;
        manifest.requirements.find((entry) => entry.id === field(row, 'requirementId')).normalizedCellCount -= 1;
        for (const protocolId of field(row, 'protocolIds')) manifest.protocols.find((entry) => entry.id === protocolId).requiredCellCount -= 1;
        const blockers = field(row, 'bindingBlockers');
        if (blockers.length) manifest.blockedCellCount -= 1;
        else if (field(row, 'applicability') === 'required') manifest.readyToEvaluateCellCount -= 1;
        for (const blocker of blockers) manifest.blockerCounts[blocker] -= 1;
    }
}
const mutations = [
    {
        name: 'deleted-required-cell',
        expectedError: 'Normalized cell count differs',
        mutate({ manifest, shard }) {
            shard.rows.shift();
            shard.cellCount = shard.rows.length;
            updateContentHash(shard);
            manifest.shards[0].cellCount = shard.cellCount;
        }
    },
    {
        name: 'collapsed-context-axis',
        expectedError: 'cell identity differs',
        shardName: 'matrix-context',
        mutate({ manifest, shard }) {
            const fieldIndex = shard.cellFields.indexOf('displayClass');
            const targetRows = shard.rows.filter((row) => row[shard.cellFields.indexOf('matrixFacet')] === 'CTX' && row[fieldIndex] === 'W1');
            for (const row of targetRows) row[fieldIndex] = 'W2';
            updateContentHash(shard);
            manifest.shards.find((entry) => entry.name === 'matrix-context').cellCount = shard.rows.length;
        }
    },
    {
        name: 'deleted-requirement-record',
        expectedError: 'Manifest requirement inventory differs',
        mutate({ manifest }) {
            manifest.requirements.pop();
        }
    },
    {
        name: 'deleted-protocol-record',
        expectedError: 'Protocol inventory differs',
        mutate({ manifest }) {
            manifest.protocols.pop();
        }
    },
    {
        name: 'deleted-artifact-obligation',
        expectedError: 'Artifact obligations differs',
        mutate({ manifest }) {
            manifest.artifactObligations.pop();
            manifest.artifactObligationCount -= 1;
        }
    },
    {
        name: 'deleted-evidence-binding',
        expectedError: 'evidence classes differ',
        shardName: 'matrix-context',
        mutate({ shard }) {
            shard.rows[0][fieldIndex(shard, 'requiredEvidenceClasses')].pop();
            updateContentHash(shard);
        }
    },
    {
        name: 'deleted-cell-protocol-binding',
        expectedError: 'protocol bindings differ',
        shardName: 'rsl-14',
        mutate({ shard }) {
            shard.rows[0][fieldIndex(shard, 'protocolIds')].pop();
            updateContentHash(shard);
        }
    },
    {
        name: 'deleted-durability-axis',
        expectedError: 'Entity durability matrix differs',
        shardName: 'matrix-entity-durability',
        mutate({ manifest, shard }) {
            const durabilityIndex = fieldIndex(shard, 'durabilityAxis');
            const removed = shard.rows.filter((row) => row[durabilityIndex] === 'DUR-COLLAB');
            shard.rows = shard.rows.filter((row) => row[durabilityIndex] !== 'DUR-COLLAB');
            shard.cellCount = shard.rows.length;
            decrementManifestForRemovedRows(manifest, removed, 'matrix-entity-durability');
            updateContentHash(shard);
        }
    },
    {
        name: 'wrong-matrix-owner',
        expectedError: 'cell identity differs',
        shardName: 'matrix-entity-durability',
        mutate({ manifest, shard }) {
            const row = shard.rows[0];
            row[fieldIndex(shard, 'requirementId')] = 'REQ-15-005';
            row[fieldIndex(shard, 'criterionId')] = 'AC-15-005';
            manifest.requirements.find((entry) => entry.id === 'REQ-15-004').normalizedCellCount -= 1;
            manifest.requirements.find((entry) => entry.id === 'REQ-15-005').normalizedCellCount += 1;
            updateContentHash(shard);
        }
    },
    {
        name: 'wrong-authorization-disposition',
        expectedError: 'Authorization matrix differs',
        shardName: 'matrix-authorization',
        mutate({ shard }) {
            const stateIndex = fieldIndex(shard, 'connectivityState');
            const dispositionIndex = fieldIndex(shard, 'matrixDisposition');
            const row = shard.rows.find((candidate) => candidate[stateIndex] === 'REVOKED');
            row[dispositionIndex] = 'allow';
            updateContentHash(shard);
        }
    },
    {
        name: 'invalid-applicability',
        expectedError: 'invalid applicability',
        shardName: 'matrix-context',
        mutate({ shard }) {
            shard.rows[0][fieldIndex(shard, 'applicability')] = 'unknown';
            updateContentHash(shard);
        }
    },
    {
        name: 'invalid-risk-class',
        expectedError: 'risk class differs',
        shardName: 'matrix-context',
        mutate({ shard }) {
            shard.rows[0][fieldIndex(shard, 'riskClass')] = 'C0-editorial';
            updateContentHash(shard);
        }
    },
    {
        name: 'unknown-evidence-class',
        expectedError: 'unknown evidence class',
        shardName: 'matrix-context',
        mutate({ shard }) {
            shard.rows[0][fieldIndex(shard, 'requiredEvidenceClasses')].push('EVC-UNKNOWN');
            updateContentHash(shard);
        }
    },
    {
        name: 'mismatched-environment',
        expectedError: 'unknown end-state environment',
        shardName: 'matrix-context',
        mutate({ shard }) {
            const row = shard.rows[0];
            const environmentId = 'ENV-END1-UNKNOWN';
            row[fieldIndex(shard, 'environmentProfileId')] = environmentId;
            row[fieldIndex(shard, 'environmentIds')] = [...new Set([...row[fieldIndex(shard, 'environmentIds')], environmentId])].sort();
            updateContentHash(shard);
        }
    },
    {
        name: 'deleted-protocol-maturity-blocker',
        expectedError: 'binding blockers differ',
        shardName: 'rsl-14',
        mutate({ shard }) {
            const blockers = shard.rows[0][fieldIndex(shard, 'bindingBlockers')];
            const blockerIndex = blockers.findIndex((value) => value.startsWith('protocol-incomplete:'));
            blockers.splice(blockerIndex, 1);
            updateContentHash(shard);
        }
    },
    {
        name: 'join-role-scope-corruption',
        expectedError: 'projected role differs',
        shardName: 'matrix-join-auth',
        mutate({ shard }) {
            const row = shard.rows.find((candidate) => candidate[fieldIndex(shard, 'role')] === 'OWNER');
            row[fieldIndex(shard, 'role')] = 'VIEWER';
            recomputeJoinCellId(shard, row);
            updateContentHash(shard);
        }
    },
    {
        name: 'join-requirement-scope-corruption',
        expectedError: 'source scope differs',
        shardName: 'matrix-join-auth',
        mutate({ shard }) {
            const row = shard.rows[0];
            row[fieldIndex(shard, 'sourceScope')].requirementId = 'REQ-15-006';
            recomputeJoinCellId(shard, row);
            updateContentHash(shard);
        }
    },
    {
        name: 'join-environment-scope-corruption',
        expectedError: 'source scope differs',
        shardName: 'matrix-join-a11y',
        mutate({ shard }) {
            const row = shard.rows[0];
            row[fieldIndex(shard, 'sourceScope')].environmentProfileId = 'ENV-END1-UNKNOWN';
            recomputeJoinCellId(shard, row);
            updateContentHash(shard);
        }
    },
    {
        name: 'join-protocol-scope-corruption',
        expectedError: 'source scope differs',
        shardName: 'matrix-join-auth',
        mutate({ shard }) {
            const row = shard.rows[0];
            row[fieldIndex(shard, 'sourceScope')].protocolIds.pop();
            recomputeJoinCellId(shard, row);
            updateContentHash(shard);
        }
    },
    {
        name: 'join-evidence-scope-corruption',
        expectedError: 'source scope differs',
        shardName: 'matrix-join-auth',
        mutate({ shard }) {
            const row = shard.rows[0];
            row[fieldIndex(shard, 'sourceScope')].requiredEvidenceClasses.pop();
            recomputeJoinCellId(shard, row);
            updateContentHash(shard);
        }
    },
    {
        name: 'join-artifact-scope-corruption',
        expectedError: 'source scope differs',
        shardName: 'matrix-join-auth',
        mutate({ shard }) {
            const row = shard.rows[0];
            row[fieldIndex(shard, 'sourceScope')].artifactObligationIds.pop();
            recomputeJoinCellId(shard, row);
            updateContentHash(shard);
        }
    },
    {
        name: 'coordinated-source-join-role-swap',
        expectedError: 'cell identity differs',
        shardName: 'matrix-authorization',
        additionalShardNames: ['matrix-join-auth'],
        mutate({ shard, shards }) {
            const roleIndex = fieldIndex(shard, 'role');
            const capabilityIndex = fieldIndex(shard, 'capability');
            const stateIndex = fieldIndex(shard, 'connectivityState');
            const cellIdIndex = fieldIndex(shard, 'cellId');
            const owner = shard.rows.find((row) => row[roleIndex] === 'OWNER' && row[capabilityIndex] === 'VIEW' && row[stateIndex] === 'ONLINE-CLEAN');
            const coowner = shard.rows.find((row) => row[roleIndex] === 'COOWNER' && row[capabilityIndex] === 'VIEW' && row[stateIndex] === 'ONLINE-CLEAN');
            const ownerId = owner[cellIdIndex];
            const coownerId = coowner[cellIdIndex];
            owner[roleIndex] = 'COOWNER';
            coowner[roleIndex] = 'OWNER';

            const joinShard = shards['matrix-join-auth'];
            const joinSourceIdIndex = fieldIndex(joinShard, 'sourceCellId');
            const joinRoleIndex = fieldIndex(joinShard, 'role');
            const joinScopeIndex = fieldIndex(joinShard, 'sourceScope');
            const ownerJoin = joinShard.rows.find((row) => row[joinSourceIdIndex] === ownerId);
            const coownerJoin = joinShard.rows.find((row) => row[joinSourceIdIndex] === coownerId);
            ownerJoin[joinRoleIndex] = 'COOWNER';
            ownerJoin[joinScopeIndex].role = 'COOWNER';
            coownerJoin[joinRoleIndex] = 'OWNER';
            coownerJoin[joinScopeIndex].role = 'OWNER';
            updateContentHash(shard);
            updateContentHash(joinShard);
        }
    },
    {
        name: 'activated-draft-pointer',
        expectedError: 'Draft universe must not be active',
        mutate({ pointer }) {
            pointer.activeProfileId = pointer.draftProfileId;
            pointer.activeUniverseId = pointer.draftUniverseId;
        }
    }
];

for (const mutation of mutations) {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'story-universe-mutation-'));
    try {
        const manifest = structuredClone(sourceManifest);
        const pointer = readJson(sourcePointerPath);
        const shardEntry = mutation.shardName
            ? manifest.shards.find((entry) => entry.name === mutation.shardName || entry.logicalName === mutation.shardName)
            : manifest.shards[0];
        const additionalEntries = (mutation.additionalShardNames ?? []).map((name) => manifest.shards.find((entry) => entry.name === name || entry.logicalName === name));
        const shardEntries = [shardEntry, ...additionalEntries];
        const shardRecords = shardEntries.map((entry) => ({ entry, shard: readJson(path.join(implementationDir, entry.file)) }));
        const shard = shardRecords[0].shard;
        const shards = Object.fromEntries(shardRecords.map(({ entry, shard: value }) => [entry.logicalName, value]));
        mutation.mutate({ manifest, pointer, shard, shards });

        const tempManifestPath = path.join(tempRoot, 'expected-universe-1.json');
        const tempPointerPath = path.join(tempRoot, 'endstate-profile-pointer.json');
        const tempShardRoot = path.join(tempRoot, 'shards');
        for (const record of shardRecords) {
            const tempShardPath = path.join(tempShardRoot, record.entry.file);
            writeJson(tempShardPath, record.shard, true);
            record.entry.sha256 = sha256(fs.readFileSync(tempShardPath, 'utf8'));
        }
        updateContentHash(manifest);
        writeJson(tempManifestPath, manifest);
        writeJson(tempPointerPath, pointer);

        const result = spawnSync(process.execPath, [validatorPath], {
            cwd: root,
            encoding: 'utf8',
            env: {
                ...process.env,
                STORY_UNIVERSE_MANIFEST: tempManifestPath,
                STORY_UNIVERSE_PROFILE: sourceProfilePath,
                STORY_UNIVERSE_POINTER: tempPointerPath,
                STORY_UNIVERSE_SHARD_ROOT: tempShardRoot
            }
        });
        const output = `${result.stdout}\n${result.stderr}`;
        assert(result.status !== 0, `${mutation.name} unexpectedly passed validation`);
        assert(output.includes(mutation.expectedError), `${mutation.name} failed for the wrong reason:\n${output}`);
        console.log(`Mutation rejected: ${mutation.name}`);
    } finally {
        fs.rmSync(tempRoot, { recursive: true, force: true });
    }
}

console.log(`Expected universe mutation gates passed (${mutations.length} semantic mutations rejected).`);
