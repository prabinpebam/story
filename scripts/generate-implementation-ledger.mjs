import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const specDir = path.join(root, 'documentation', 'product', 'specification');
const implementationDir = path.join(root, 'documentation', 'product', 'implementation');
const traceabilityPath = path.join(specDir, 'traceability-index.json');
const implementationPlanPath = path.join(root, 'documentation', 'product', 'implementation-plan.md');
const outputJsonPath = path.join(implementationDir, 'implementation-ledger.json');
const outputMarkdownPath = path.join(implementationDir, 'implementation-ledger.md');
const checkOnly = process.argv.includes('--check');
const testBootstrapIndex = process.argv.indexOf('--test-bootstrap');
if (testBootstrapIndex >= 0 && (!checkOnly || process.env.NODE_ENV !== 'test' || !process.argv[testBootstrapIndex + 1])) {
    throw new Error('--test-bootstrap requires NODE_ENV=test, --check, and an explicit fixture path');
}
const bootstrapPath = testBootstrapIndex >= 0
    ? path.resolve(root, process.argv[testBootstrapIndex + 1])
    : path.join(implementationDir, 'bootstrap-phase-1.json');

function readJson(filePath) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function readJsonStrict(filePath) {
    const text = fs.readFileSync(filePath, 'utf8');
    let cursor = 0;

    function fail(message) {
        throw new Error(`${path.relative(root, filePath)}:${cursor + 1}: ${message}`);
    }

    function skipWhitespace() {
        while (/\s/.test(text[cursor] ?? '')) cursor += 1;
    }

    function parseString() {
        if (text[cursor] !== '"') fail('Expected JSON string');
        const start = cursor;
        cursor += 1;
        while (cursor < text.length) {
            if (text[cursor] === '\\') {
                cursor += 2;
            } else if (text[cursor] === '"') {
                cursor += 1;
                return JSON.parse(text.slice(start, cursor));
            } else {
                cursor += 1;
            }
        }
        fail('Unterminated JSON string');
    }

    function parseArray(location) {
        cursor += 1;
        const values = [];
        skipWhitespace();
        if (text[cursor] === ']') {
            cursor += 1;
            return values;
        }
        while (cursor < text.length) {
            values.push(parseValue(`${location}[${values.length}]`));
            skipWhitespace();
            if (text[cursor] === ']') {
                cursor += 1;
                return values;
            }
            if (text[cursor] !== ',') fail(`Expected comma in ${location}`);
            cursor += 1;
        }
        fail(`Unterminated array ${location}`);
    }

    function parseObject(location) {
        cursor += 1;
        const value = {};
        const keys = new Set();
        skipWhitespace();
        if (text[cursor] === '}') {
            cursor += 1;
            return value;
        }
        while (cursor < text.length) {
            skipWhitespace();
            const key = parseString();
            if (keys.has(key)) fail(`Duplicate JSON key ${location}.${key}`);
            keys.add(key);
            skipWhitespace();
            if (text[cursor] !== ':') fail(`Expected colon after ${location}.${key}`);
            cursor += 1;
            value[key] = parseValue(`${location}.${key}`);
            skipWhitespace();
            if (text[cursor] === '}') {
                cursor += 1;
                return value;
            }
            if (text[cursor] !== ',') fail(`Expected comma in ${location}`);
            cursor += 1;
        }
        fail(`Unterminated object ${location}`);
    }

    function parseValue(location) {
        skipWhitespace();
        if (text[cursor] === '{') return parseObject(location);
        if (text[cursor] === '[') return parseArray(location);
        if (text[cursor] === '"') return parseString();
        for (const [token, value] of [['true', true], ['false', false], ['null', null]]) {
            if (text.startsWith(token, cursor)) {
                cursor += token.length;
                return value;
            }
        }
        const number = text.slice(cursor).match(/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/);
        if (number) {
            cursor += number[0].length;
            return Number(number[0]);
        }
        fail(`Invalid JSON value at ${location}`);
    }

    const result = parseValue('$');
    skipWhitespace();
    if (cursor !== text.length) fail('Unexpected trailing JSON content');
    return result;
}

function sha256(value) {
    return crypto.createHash('sha256').update(value).digest('hex');
}

function expandOverride(volume, token) {
    const match = token.match(/^(\d{3})(?:\.\.(\d{3}))?$/);
    if (!match) throw new Error(`Invalid override range ${volume}-${token}`);
    const start = Number(match[1]);
    const end = Number(match[2] ?? match[1]);
    if (end < start) throw new Error(`Descending override range ${volume}-${token}`);
    return Array.from({ length: end - start + 1 }, (_, offset) => `REQ-${volume}-${String(start + offset).padStart(3, '0')}`);
}

function assertPhasePair(pair, label) {
    if (!Array.isArray(pair) || pair.length !== 2) throw new Error(`${label} must be [implementationPhase, closurePhase]`);
    const [implementationPhase, closurePhase] = pair;
    if (!Number.isInteger(implementationPhase) || implementationPhase < 1 || implementationPhase > 6) {
        throw new Error(`${label} has invalid implementation phase ${implementationPhase}`);
    }
    if (!Number.isInteger(closurePhase) || closurePhase < 1 || closurePhase > 6) {
        throw new Error(`${label} has invalid closure phase ${closurePhase}`);
    }
    if (closurePhase < implementationPhase) throw new Error(`${label} closes before implementation`);
}

function assertExactKeys(actual, expected, label) {
    const actualKeys = Object.keys(actual ?? {}).sort();
    const expectedKeys = [...expected].sort();
    if (JSON.stringify(actualKeys) !== JSON.stringify(expectedKeys)) {
        throw new Error(`${label} keys differ; expected [${expectedKeys.join(', ')}], found [${actualKeys.join(', ')}]`);
    }
}

function writeOrCheck(filePath, content) {
    if (checkOnly) {
        if (!fs.existsSync(filePath) || fs.readFileSync(filePath, 'utf8') !== content) {
            console.error(`Generated implementation ledger is stale: ${path.relative(root, filePath)}`);
            return false;
        }
        return true;
    }
    fs.writeFileSync(filePath, content);
    return true;
}

const traceability = readJson(traceabilityPath);
const bootstrap = readJsonStrict(bootstrapPath);
const requirementIds = traceability.requirements.map((entry) => entry.id).sort();
const requirementIdSet = new Set(requirementIds);
const requirementIdsHash = sha256(requirementIds.join('\n'));
const implementationPlanHash = sha256(fs.readFileSync(implementationPlanPath, 'utf8'));
const volumeIds = traceability.volumes.map((entry) => entry.id).sort();
const expectedPhaseNames = {
    '1': 'Control Plane and Product Shell',
    '2': 'Canonical Product Platform',
    '3': 'Story-Native Vertical',
    '4': 'Professional Authoring',
    '5': 'Team, Exchange, and Delivery',
    '6': 'Ultimate Closure and Assurance',
};

assertExactKeys(bootstrap, [
    'schemaVersion', 'bootstrapId', 'version', 'status', 'sourceRevision', 'implementationPlanSha256',
    'expectedRequirementCount', 'expectedRequirementIdsSha256', 'authority', 'rationale', 'phaseNames',
    'volumeDefaults', 'overrides',
], 'Bootstrap');
assertExactKeys(bootstrap.phaseNames, Object.keys(expectedPhaseNames), 'Phase names');
assertExactKeys(bootstrap.volumeDefaults, volumeIds, 'Volume defaults');
assertExactKeys(bootstrap.overrides, volumeIds, 'Override volumes');
if (JSON.stringify(bootstrap.phaseNames) !== JSON.stringify(expectedPhaseNames)) {
    throw new Error('Bootstrap phase names do not match the controlling implementation plan');
}

if (bootstrap.sourceRevision !== traceability.sourceRevision) {
    throw new Error(`Bootstrap source revision ${bootstrap.sourceRevision} does not match ${traceability.sourceRevision}`);
}
if (bootstrap.implementationPlanSha256 !== implementationPlanHash) {
    throw new Error(`Bootstrap implementation plan hash ${bootstrap.implementationPlanSha256} does not match ${implementationPlanHash}`);
}
if (bootstrap.expectedRequirementCount !== traceability.requirementCount) {
    throw new Error(`Bootstrap expected ${bootstrap.expectedRequirementCount} requirements; found ${traceability.requirementCount}`);
}
if (bootstrap.expectedRequirementIdsSha256 !== requirementIdsHash) {
    throw new Error('Bootstrap requirement ID universe hash does not match traceability');
}

const phaseByRequirement = new Map();
for (const volume of traceability.volumes) {
    const pair = bootstrap.volumeDefaults?.[volume.id];
    assertPhasePair(pair, `Volume ${volume.id} default`);
    for (const requirement of traceability.requirements.filter((entry) => entry.volume === volume.id)) {
        phaseByRequirement.set(requirement.id, pair);
    }
}

const overridden = new Set();
for (const [volume, ranges] of Object.entries(bootstrap.overrides ?? {})) {
    if (!traceability.volumes.some((entry) => entry.id === volume)) throw new Error(`Override references unknown volume ${volume}`);
    for (const [token, pair] of Object.entries(ranges)) {
        assertPhasePair(pair, `Override ${volume}-${token}`);
        for (const id of expandOverride(volume, token)) {
            if (!requirementIdSet.has(id)) throw new Error(`Override references unknown requirement ${id}`);
            if (overridden.has(id)) throw new Error(`Requirement ${id} is overridden more than once`);
            overridden.add(id);
            phaseByRequirement.set(id, pair);
        }
    }
}

if (phaseByRequirement.size !== requirementIds.length) {
    throw new Error(`Phase routing covers ${phaseByRequirement.size} of ${requirementIds.length} requirements`);
}

const requirements = traceability.requirements.map((entry) => {
    const pair = phaseByRequirement.get(entry.id);
    if (!pair) throw new Error(`Requirement ${entry.id} lacks a phase assignment`);
    const [implementationPhase, closurePhase] = pair;
    return {
        id: entry.id,
        acceptanceId: entry.acceptance[0] ?? entry.id.replace('REQ-', 'AC-'),
        volume: entry.volume,
        owner: traceability.volumes.find((volume) => volume.id === entry.volume)?.owner ?? '',
        parents: entry.parents,
        implementationPhase,
        closurePhase,
        implementationDisposition: 'unknown',
        verificationDisposition: 'not-evaluated',
        evidenceFreshness: 'missing',
        primaryWorkPackage: null,
        dependencies: [],
        blockingDecisionIds: [],
        evidenceIds: [],
        sourceFile: entry.file,
        statement: entry.statement,
    };
});

const phaseSummary = Object.entries(bootstrap.phaseNames).map(([phaseText, name]) => {
    const phase = Number(phaseText);
    return {
        phase,
        name,
        implementationCount: requirements.filter((entry) => entry.implementationPhase === phase).length,
        closureCount: requirements.filter((entry) => entry.closurePhase === phase).length,
    };
});

const dispositionCounts = requirements.reduce((counts, entry) => {
    counts[entry.implementationDisposition] = (counts[entry.implementationDisposition] ?? 0) + 1;
    return counts;
}, {});

const bootstrapSource = fs.readFileSync(bootstrapPath, 'utf8');
const ledger = {
    schemaVersion: 'story.implementation-ledger/1.0.0',
    ledgerId: 'IMPLEMENTATION-LEDGER-1',
    status: 'bootstrap-generated',
    bootstrapId: bootstrap.bootstrapId,
    bootstrapVersion: bootstrap.version,
    sourceRevision: traceability.sourceRevision,
    implementationPlanSha256: implementationPlanHash,
    sourceHash: sha256(`${traceability.sourceHash}\n${implementationPlanHash}\n${bootstrapSource}`),
    requirementIdsSha256: requirementIdsHash,
    assignmentHash: sha256(requirements.map((entry) => `${entry.id}:${entry.implementationPhase}:${entry.closurePhase}`).join('\n')),
    requirementCount: requirements.length,
    overriddenRequirementCount: overridden.size,
    dispositionCounts,
    phaseSummary,
    requirements,
};

const json = `${JSON.stringify(ledger, null, 2)}\n`;
const markdown = `# Generated Story Implementation Ledger

> **Generated artifact:** Do not edit manually.  
> **Bootstrap:** \`${ledger.bootstrapId}\` v${ledger.bootstrapVersion}  
> **Specification revision:** \`${ledger.sourceRevision}\`
> **Assignment hash:** \`${ledger.assignmentHash}\`  
> **Regenerate:** \`npm run implementation:ledger\`  
> **Validate:** \`npm run implementation:validate\`

## Honest Baseline

Every active atomic requirement has exactly one implementation phase and one closure phase. Implementation and verification dispositions remain \`unknown\` / \`not-evaluated\` until production routes and current evidence are audited. Phase assignment is sequencing, not completion credit.

| Requirements | Explicit overrides | Unknown implementation | Not evaluated |
|---:|---:|---:|---:|
| ${ledger.requirementCount} | ${ledger.overriddenRequirementCount} | ${dispositionCounts.unknown ?? 0} | ${requirements.filter((entry) => entry.verificationDisposition === 'not-evaluated').length} |

## Phase Routing

| Phase | Name | Implementation rows | Closure rows |
|---:|---|---:|---:|
${phaseSummary.map((entry) => `| ${entry.phase} | ${entry.name} | ${entry.implementationCount} | ${entry.closureCount} |`).join('\n')}

## Source of Truth

- Editable routing: [bootstrap-phase-1.json](bootstrap-phase-1.json)
- Machine-readable ledger: [implementation-ledger.json](implementation-ledger.json)
- Atomic requirements: [Specification traceability index](../specification/traceability-index.md)
- Phase and closure rules: [Story 100% Implementation Plan](../implementation-plan.md)

The JSON ledger contains every requirement row, exact phases, current dispositions, source statement, and evidence placeholders. Generated counts do not claim implementation or conformance.
`;

const valid = writeOrCheck(outputJsonPath, json) && writeOrCheck(outputMarkdownPath, markdown);
if (!valid) process.exit(1);

if (checkOnly) {
    console.log(`Implementation ledger is current (${requirements.length} requirements, ${overridden.size} explicit overrides).`);
} else {
    console.log(`Generated ${path.relative(root, outputJsonPath)} and ${path.relative(root, outputMarkdownPath)}.`);
}