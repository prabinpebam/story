import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const specDir = path.join(root, 'documentation', 'product', 'specification');
const outputJson = path.join(specDir, 'protocol-registry.json');
const outputMarkdown = path.join(specDir, 'protocol-registry.md');
const checkOnly = process.argv.includes('--check');

const templateByVolume = {
    '01': ['usability-benchmark', 'headed-e2e', 'artifact-roundtrip', 'accessibility-manual'],
    '07': ['integration-contract'],
    '12': ['accessibility-manual'],
    '13': ['security-fault'],
    '14': ['performance-soak'],
    '15': ['integration-contract'],
};

const descriptionOverrides = {
    'TEST-01-001': 'Figma-transfer, PowerPoint-transfer, and Story-native product outcome benchmark.',
};

function sha256(value) {
    return crypto.createHash('sha256').update(value).digest('hex');
}

function read(filePath) {
    return fs.readFileSync(filePath, 'utf8');
}

function protocolRows(fileName, text) {
    return text.split(/\r?\n/).flatMap((line) => {
        const match = line.match(/^\|\s*`?(TEST-(\d{2})-\d{3})`?\s*\|\s*(.+?)\s*\|(?:\s*(.+?)\s*\|)?$/);
        if (!match) return [];
        return [{ id: match[1], volume: match[2], description: match[3], evidenceHint: match[4] ?? '', fileName }];
    });
}

function chooseTemplates(row) {
    const text = `${row.description} ${row.evidenceHint}`.toLowerCase();
    const templates = new Set(templateByVolume[row.volume] ?? ['integration-contract']);
    if (/headed|browser|playwright|ui\b|interaction/.test(text)) templates.add('headed-e2e');
    if (/artifact|file|clipboard|output|parse|round.?trip|pdf|pptx|svg|video/.test(text)) templates.add('artifact-roundtrip');
    if (/accessib|assistive|ime|manual|hardware|device|office|printer|codec/.test(text)) templates.add('accessibility-manual');
    if (/performance|benchmark|load|soak|memory|frame|calibration|capacity|prolonged/.test(text)) templates.add('performance-soak');
    if (/security|fault|crash|malformed|auth|privacy|secret|incident|recovery|fuzz|adversarial/.test(text)) templates.add('security-fault');
    if (/unit|model|schema|deterministic|pure/.test(text)) templates.add('unit-model');
    if (/integration|contract|service|authority|store|provider|multi-client/.test(text)) templates.add('integration-contract');
    return [...templates];
}

const rows = [];
for (const fileName of fs.readdirSync(specDir).filter((name) => /^\d{2}-.*\.md$/.test(name)).sort()) {
    rows.push(...protocolRows(fileName, read(path.join(specDir, fileName))));
}
rows.push({
    id: 'TEST-01-001',
    volume: '01',
    description: descriptionOverrides['TEST-01-001'],
    evidenceHint: '34 frozen tasks, objective semantic validators, qualified cohorts, headed captures, artifacts, and manual accessibility sessions.',
    fileName: 'benchmarks/familiarity-and-story-native.md',
});

const uniqueRows = new Map();
for (const row of rows) {
    if (uniqueRows.has(row.id)) throw new Error(`Duplicate protocol definition: ${row.id}`);
    uniqueRows.set(row.id, row);
}

const traceability = JSON.parse(read(path.join(specDir, 'traceability-index.json')));
const fixtureIdByProtocol = (id) => id === 'TEST-01-001' ? ['FIX-PRODUCT-MEDIUM-01'] : [`FIX-${id.slice(5)}`];
const environmentIdByProtocol = (id) => id === 'TEST-01-001' ? ['ENV-R1-WIN-DESKTOP-01', 'ENV-FIGMA-CURRENT', 'ENV-POWERPOINT-M365-WIN', 'ENV-R1-A11Y-01'] : [`ENV-${id.slice(5)}`];

const protocols = [...uniqueRows.values()].sort((left, right) => left.id.localeCompare(right.id)).map((row) => {
    const templates = chooseTemplates(row);
    const fixtureIds = fixtureIdByProtocol(row.id);
    const environmentIds = environmentIdByProtocol(row.id);
    const isMaterializedBenchmark = row.id === 'TEST-01-001' && fs.existsSync(path.join(specDir, 'fixtures', 'FIX-PRODUCT-MEDIUM-01.json'));
    return {
        id: row.id,
        aliases: row.id === 'TEST-01-001' ? ['BENCH-PRODUCT-001'] : [],
        definitionVersion: '1.0.0-draft',
        status: 'draft-incomplete',
        owner: { volume: row.volume, source: `documentation/product/specification/${row.fileName}` },
        templates,
        description: row.description,
        applicability: {
            profiles: row.id === 'TEST-01-001' ? ['PROFILE-R1-2026-01'] : [],
            riskClasses: [],
            matrixCells: [],
            requirements: [],
            criteria: [],
        },
        setup: {
            fixtureIds,
            fixtureStatus: isMaterializedBenchmark ? 'manifest-present-artifacts-missing' : 'registry-entry-required',
            environmentIds,
            environmentStatus: 'registry-entry-required',
            preconditions: ['Candidate, specification, fixture, environment, and protocol revisions are frozen.'],
            productionBoundaries: ['Use the production boundary claimed by the source protocol; mocks must be disclosed and cannot prove the mocked boundary.'],
            allowedSubstitutions: [],
            realInput: templates.includes('headed-e2e') || templates.includes('usability-benchmark'),
        },
        procedure: {
            steps: [row.description],
            retries: { max: 0, policy: 'append-only-diagnostic-reruns' },
            timeoutMs: null,
        },
        evidence: {
            captureSchema: 'SCH-15-008',
            captures: row.evidenceHint ? [row.evidenceHint] : [],
            detectors: [],
            artifacts: templates.includes('artifact-roundtrip') ? ['actual-produced-artifact', 'independent-parse-report'] : [],
            privacy: 'Volume 13 minimization, consent, access, retention, and no-secret rules apply.',
            retention: 'Defined by the active conformance profile and evidence store policy.',
        },
        outcome: {
            terminalCondition: row.description,
            assertions: [],
            pass: 'All declared assertions and applicable matrix cells pass with current admissible evidence.',
            fail: 'Any declared assertion fails or observed state contradicts the required terminal condition.',
            blocked: 'Fixture, environment, production boundary, consent, hardware, or protocol field is unavailable or incomplete.',
        },
        cleanup: {
            steps: ['Release protocol-owned processes, handles, temporary artifacts, permissions, devices, and injected state.'],
            verification: 'No protocol resource or temporary mutation remains unless retained as immutable evidence.',
        },
        limitations: ['This generated draft is not release-admissible until every empty applicability/assertion/detector/timeout and registry reference required by SCH-15-007 is materialized and reviewed.'],
    };
});

const registry = {
    schemaVersion: 'story.protocol-registry/1.0.0',
    registryVersion: '1.0.0-draft',
    sourceRevision: traceability.sourceRevision,
    sourceReviewedAt: traceability.sourceReviewedAt,
    sourceHash: sha256(protocols.map((item) => `${item.id}:${item.description}`).join('\n')),
    aliases: { 'BENCH-PRODUCT-001': 'TEST-01-001' },
    templateDefinitions: {
        'unit-model': 'Deterministic model boundary with exact semantics and negative/mutation controls.',
        'integration-contract': 'Production module/service/store/authority/writer boundary with correlated success and failure state.',
        'headed-e2e': 'Visible headed browser, real input, focus/hit-test/paint, semantic terminal state, and recovery.',
        'artifact-roundtrip': 'Actual writer bytes, independent parser/consumer, semantic/preservation/visual validation.',
        'accessibility-manual': 'Actual claimed AT/IME/hardware environment with versioned operator procedure and observations.',
        'performance-soak': 'Correctness-first exact environment with semantic marks, raw samples, frames, memory, trends, and thresholds.',
        'security-fault': 'Adversarial/fault boundary with unchanged protected state, bounded rescue, and audit evidence.',
        'usability-benchmark': 'Qualified cohorts, frozen tasks/fixtures, objective validators, interventions, time/error/confidence, and privacy-safe results.'
    },
    protocolCount: protocols.length,
    releaseAdmissibleCount: protocols.filter((item) => item.status === 'complete').length,
    protocols,
};

const json = `${JSON.stringify(registry, null, 2)}\n`;
const markdown = `# Generated Protocol Registry

> **Generated artifact:** Do not edit manually.  
> **Source revision:** \`${registry.sourceRevision}\`
> **Source reviewed:** ${registry.sourceReviewedAt}  
> **Protocols:** ${registry.protocolCount}  
> **Release-admissible:** ${registry.releaseAdmissibleCount}  
> **Regenerate:** \`npm run spec:protocols\`

All protocol records are currently \`draft-incomplete\`. They provide no release coverage until every \`SCH-15-007\` field, fixture, environment, step, detector, assertion, timeout, cleanup, and terminal condition is materialized and reviewed.

| Protocol | Owner | Templates | Status | Fixture status |
|---|---:|---|---|---|
${protocols.map((item) => `| \`${item.id}\` | ${item.owner.volume} | ${item.templates.join(', ')} | ${item.status} | ${item.setup.fixtureStatus} |`).join('\n')}

The complete flattened protocol records and alias map are in [protocol-registry.json](protocol-registry.json).
`;

function writeOrCheck(filePath, expected) {
    if (checkOnly) {
        if (!fs.existsSync(filePath) || read(filePath) !== expected) {
            console.error(`Generated protocol registry is stale: ${path.relative(root, filePath)}`);
            return false;
        }
        return true;
    }
    fs.writeFileSync(filePath, expected);
    return true;
}

const valid = writeOrCheck(outputJson, json) && writeOrCheck(outputMarkdown, markdown);
if (!valid) process.exit(1);
console.log(checkOnly
    ? `Protocol registry is current (${protocols.length} protocols, ${registry.releaseAdmissibleCount} release-admissible).`
    : `Generated ${path.relative(root, outputJson)} and ${path.relative(root, outputMarkdown)}.`);