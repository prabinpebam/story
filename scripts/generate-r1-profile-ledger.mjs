import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const specDir = path.join(root, 'documentation', 'product', 'specification');
const traceabilityPath = path.join(specDir, 'traceability-index.json');
const selectionPath = path.join(specDir, 'profiles', 'R1-selection.json');
const outputPath = path.join(specDir, 'profiles', 'R1-ledger.json');
const markdownPath = path.join(specDir, 'profiles', 'R1-ledger.md');
const checkOnly = process.argv.includes('--check');

function readJson(filePath) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function sha256(value) {
    return crypto.createHash('sha256').update(value).digest('hex');
}

function expandRange(token) {
    const match = token.match(/^(\d{2})-(\d{3})(?:\.\.(\d{3}))?$/);
    if (!match) throw new Error(`Invalid requirement range token: ${token}`);
    const [, volume, startText, endText = startText] = match;
    const start = Number(startText);
    const end = Number(endText);
    if (end < start) throw new Error(`Invalid descending range: ${token}`);
    return Array.from({ length: end - start + 1 }, (_, index) => `REQ-${volume}-${String(start + index).padStart(3, '0')}`);
}

function expandTokens(tokens) {
    return [...new Set(tokens.flatMap(expandRange))].sort();
}

function writeOrCheck(filePath, content) {
    if (checkOnly) {
        if (!fs.existsSync(filePath) || fs.readFileSync(filePath, 'utf8') !== content) {
            console.error(`Generated R1 ledger is stale: ${path.relative(root, filePath)}`);
            return false;
        }
        return true;
    }
    fs.writeFileSync(filePath, content);
    return true;
}

const traceability = readJson(traceabilityPath);
const selection = readJson(selectionPath);
const allRequirementIds = new Set(traceability.requirements.map((entry) => entry.id));
const dispositionByRequirement = new Map(traceability.requirements.map((entry) => [entry.id, selection.defaultDisposition]));
const explicitAssignments = new Map();

for (const [disposition, ranges] of Object.entries(selection.dispositionRanges)) {
    for (const id of expandTokens(ranges)) {
        if (!allRequirementIds.has(id)) throw new Error(`R1 selection references unknown requirement: ${id}`);
        if (explicitAssignments.has(id)) throw new Error(`R1 selection assigns ${id} more than once`);
        explicitAssignments.set(id, disposition);
        dispositionByRequirement.set(id, disposition);
    }
}

const sharedAuthoring = expandTokens(selection.workflowSharedRequirements.authoringMutation);
const sharedBrowser = expandTokens(selection.workflowSharedRequirements.browserEvidence);
const sharedDurable = expandTokens(selection.workflowSharedRequirements.durableWorkflow);
const durableWorkflowIds = new Set(['R1-WF-01', 'R1-WF-02', 'R1-WF-04', 'R1-WF-05', 'R1-WF-07', 'R1-WF-08', 'R1-WF-09', 'R1-WF-11', 'R1-WF-12', 'R1-WF-13', 'R1-WF-14', 'R1-WF-15', 'R1-WF-16', 'R1-WF-17', 'R1-WF-18', 'R1-WF-19', 'R1-WF-20', 'R1-WF-21', 'R1-WF-23', 'R1-WF-24']);
const authoredWorkflowIds = new Set(['R1-WF-01', 'R1-WF-03', 'R1-WF-04', 'R1-WF-05', 'R1-WF-06', 'R1-WF-07', 'R1-WF-08', 'R1-WF-09', 'R1-WF-10', 'R1-WF-11', 'R1-WF-12', 'R1-WF-13', 'R1-WF-14', 'R1-WF-15', 'R1-WF-16', 'R1-WF-17', 'R1-WF-18', 'R1-WF-19', 'R1-WF-21', 'R1-WF-23']);

const workflows = Object.entries(selection.workflowRequirements).map(([workflowId, ranges]) => {
    const requirements = new Set(expandTokens(ranges));
    if (authoredWorkflowIds.has(workflowId)) for (const id of sharedAuthoring) requirements.add(id);
    for (const id of sharedBrowser) requirements.add(id);
    if (durableWorkflowIds.has(workflowId)) for (const id of sharedDurable) requirements.add(id);
    for (const id of requirements) {
        if (!allRequirementIds.has(id)) throw new Error(`${workflowId} references unknown requirement ${id}`);
        if (dispositionByRequirement.get(id) === 'excluded-by-profile') throw new Error(`${workflowId} references excluded requirement ${id}`);
    }
    const sorted = [...requirements].sort();
    return {
        id: workflowId,
        requirements: sorted,
        acceptanceCriteria: sorted.map((id) => id.replace('REQ-', 'AC-')),
    };
}).sort((left, right) => left.id.localeCompare(right.id));

const workflowIdsByRequirement = new Map();
for (const workflow of workflows) {
    for (const id of workflow.requirements) {
        const current = workflowIdsByRequirement.get(id) ?? [];
        current.push(workflow.id);
        workflowIdsByRequirement.set(id, current);
    }
}

const requirements = traceability.requirements.map((entry) => ({
    id: entry.id,
    acceptanceId: entry.acceptance[0] ?? entry.id.replace('REQ-', 'AC-'),
    volume: entry.volume,
    parents: entry.parents,
    disposition: dispositionByRequirement.get(entry.id),
    dispositionReason: selection.reasons[dispositionByRequirement.get(entry.id)],
    workflows: (workflowIdsByRequirement.get(entry.id) ?? []).sort(),
    statement: entry.statement,
}));

const dispositionCounts = requirements.reduce((counts, requirement) => {
    counts[requirement.disposition] = (counts[requirement.disposition] ?? 0) + 1;
    return counts;
}, {});
const volumeCoverage = traceability.volumes.map((volume) => {
    const entries = requirements.filter((item) => item.volume === volume.id);
    const dispositions = entries.reduce((counts, item) => {
        counts[item.disposition] = (counts[item.disposition] ?? 0) + 1;
        return counts;
    }, {});
    return {
        volume: volume.id,
        owner: volume.owner,
        requirementCount: entries.length,
        dispositions,
    };
});

for (const volume of volumeCoverage) {
    if (volume.requirementCount === 0) throw new Error(`R1 ledger has empty required volume ${volume.volume}`);
}
if (requirements.length !== traceability.requirementCount) throw new Error('R1 ledger does not cover all source requirements');
if (workflows.length !== 24) throw new Error(`R1 ledger must define 24 workflows; found ${workflows.length}`);

const sourceHash = sha256(`${traceability.sourceHash}\n${fs.readFileSync(selectionPath, 'utf8')}`);
const ledger = {
    schemaVersion: 'story.profile-ledger/1.0.0',
    profileId: selection.profileId,
    profileVersion: selection.profileVersion,
    maturity: 'normative-draft',
    sourceRevision: traceability.sourceRevision,
    sourceReviewedAt: traceability.sourceReviewedAt,
    sourceHash,
    requirementSetHash: sha256(requirements.map((entry) => `${entry.id}:${entry.disposition}`).join('\n')),
    workflowSetHash: sha256(workflows.map((entry) => `${entry.id}:${entry.requirements.join(',')}`).join('\n')),
    requiredVolumeSet: volumeCoverage.map((entry) => entry.volume),
    requirementCount: requirements.length,
    dispositionCounts,
    workflowCount: workflows.length,
    volumeCoverage,
    workflows,
    requirements,
};

const json = `${JSON.stringify(ledger, null, 2)}\n`;
const markdown = `# Generated R1 Preview Atomic Ledger

> **Generated artifact:** Do not edit manually.  
> **Profile:** \`${ledger.profileId}\`  
> **Source revision:** \`${ledger.sourceRevision}\`  
> **Source reviewed:** ${ledger.sourceReviewedAt}  
> **Requirement-set hash:** \`${ledger.requirementSetHash}\`  
> **Regenerate:** \`npm run spec:r1\`

## Closure Summary

| Total atomic requirements | Included | Deferred | Excluded by profile | Preview, not gating | Workflows | Required volumes |
|---:|---:|---:|---:|---:|---:|---:|
| ${requirements.length} | ${dispositionCounts.included ?? 0} | ${dispositionCounts.deferred ?? 0} | ${dispositionCounts['excluded-by-profile'] ?? 0} | ${dispositionCounts['preview-not-gating'] ?? 0} | ${workflows.length} | ${volumeCoverage.length} |

## Volume Dispositions

| Volume | Owner | Total | Included | Deferred | Excluded | Preview |
|---:|---|---:|---:|---:|---:|---:|
${volumeCoverage.map((entry) => `| ${entry.volume} | ${entry.owner} | ${entry.requirementCount} | ${entry.dispositions.included ?? 0} | ${entry.dispositions.deferred ?? 0} | ${entry.dispositions['excluded-by-profile'] ?? 0} | ${entry.dispositions['preview-not-gating'] ?? 0} |`).join('\n')}

## Workflow Closure

| Workflow | Requirements | Acceptance criteria |
|---|---:|---:|
${workflows.map((entry) => `| \`${entry.id}\` | ${entry.requirements.length} | ${entry.acceptanceCriteria.length} |`).join('\n')}

The complete per-requirement disposition and workflow mapping is in [R1-ledger.json](R1-ledger.json). Numbered volumes and [R1-selection.json](R1-selection.json) remain the editable sources.
`;

const valid = writeOrCheck(outputPath, json) && writeOrCheck(markdownPath, markdown);
if (!valid) process.exit(1);
if (checkOnly) {
    console.log(`R1 profile ledger is current (${requirements.length} requirements, ${workflows.length} workflows).`);
} else {
    console.log(`Generated ${path.relative(root, outputPath)} and ${path.relative(root, markdownPath)}.`);
}