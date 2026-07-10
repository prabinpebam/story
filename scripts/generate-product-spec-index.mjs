import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const specDir = path.join(root, 'documentation', 'product', 'specification');
const jsonPath = path.join(specDir, 'traceability-index.json');
const markdownPath = path.join(specDir, 'traceability-index.md');
const checkOnly = process.argv.includes('--check');
const sourceReviewedAt = '2026-07-10';

function read(filePath) {
    return fs.readFileSync(filePath, 'utf8');
}

function sha256(value) {
    return crypto.createHash('sha256').update(value).digest('hex');
}

function metadata(text, key) {
    const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return text.match(new RegExp(`^> \\*\\*${escaped}:\\*\\* (.+?)\\s*$`, 'm'))?.[1] ?? '';
}

function tableCells(line) {
    return line
        .split('|')
        .slice(1, -1)
        .map((cell) => cell.trim());
}

function requirementDefinitions(fileName, text) {
    const requirements = [];
    for (const line of text.split(/\r?\n/)) {
        const match = line.match(/^\|\s*`?(REQ-(\d{2})-\d{3})`?\s*\|/);
        if (!match) continue;

        const cells = tableCells(line);
        const statement = cells.find((cell) => /\b(MUST NOT|SHOULD NOT|MUST|SHOULD|MAY)\b/.test(cell)) ?? '';
        const keyword = statement.match(/\b(MUST NOT|SHOULD NOT|MUST|SHOULD|MAY)\b/)?.[1] ?? '';
        const parents = [...new Set([...line.matchAll(/\b(?:DES|PRE|ARC)-\d{3}\b/g)].map((item) => item[0]))].sort();
        const acceptance = [...new Set([...line.matchAll(/\bAC-\d{2}-\d{3}\b/g)].map((item) => item[0]))].sort();

        requirements.push({
            id: match[1],
            volume: match[2],
            file: `documentation/product/specification/${fileName}`,
            parents,
            acceptance,
            keyword,
            statement,
        });
    }
    return requirements;
}

function acceptanceDefinitions(text) {
    return text.split(/\r?\n/).flatMap((line) => {
        const match = line.match(/^\|\s*`?(AC-\d{2}-\d{3})`?\s*\|/);
        return match ? [match[1]] : [];
    });
}

const volumeFiles = fs.readdirSync(specDir).filter((name) => /^\d{2}-.*\.md$/.test(name)).sort();
const volumes = [];
const requirements = [];
const acceptanceIds = new Set();
const sourceParts = [];

for (const fileName of volumeFiles) {
    const text = read(path.join(specDir, fileName));
    const title = text.match(/^#\s+(.+)$/m)?.[1] ?? fileName;
    const volumeRequirements = requirementDefinitions(fileName, text).sort((left, right) => left.id.localeCompare(right.id));
    const volumeAcceptance = acceptanceDefinitions(text);

    requirements.push(...volumeRequirements);
    for (const id of volumeAcceptance) acceptanceIds.add(id);
    sourceParts.push(`${fileName}\n${text}`);

    volumes.push({
        id: fileName.slice(0, 2),
        file: `documentation/product/specification/${fileName}`,
        title,
        status: metadata(text, 'Status'),
        version: metadata(text, 'Version'),
        owner: metadata(text, 'Owner'),
        requirementCount: volumeRequirements.length,
        acceptanceCount: volumeAcceptance.length,
        requirementRange: volumeRequirements.length
            ? `${volumeRequirements[0].id}..${volumeRequirements.at(-1).id}`
            : '',
        sourceHash: sha256(text),
    });
}

requirements.sort((left, right) => left.id.localeCompare(right.id));

const parentMap = new Map();
for (const requirement of requirements) {
    for (const parent of requirement.parents) {
        const entry = parentMap.get(parent) ?? { id: parent, requirements: [], volumes: new Set() };
        entry.requirements.push(requirement.id);
        entry.volumes.add(requirement.volume);
        parentMap.set(parent, entry);
    }
}

const parents = [...parentMap.values()]
    .map((entry) => ({
        id: entry.id,
        requirementCount: entry.requirements.length,
        volumes: [...entry.volumes].sort(),
        requirements: entry.requirements.sort(),
    }))
    .sort((left, right) => left.id.localeCompare(right.id));

const sourceHash = sha256(sourceParts.join('\n---\n'));
const registry = {
    schemaVersion: 1,
    sourceRevision: `sha256:${sourceHash}`,
    sourceReviewedAt,
    sourceHash,
    volumeCount: volumes.length,
    requirementCount: requirements.length,
    acceptanceCount: acceptanceIds.size,
    volumes,
    parents,
    requirements,
};

const json = `${JSON.stringify(registry, null, 2)}\n`;
const markdown = `# Generated Product Specification Index

> **Generated artifact:** Do not edit manually.  
> **Source:** Numbered volumes 00-15  
> **Source revision:** \`${registry.sourceRevision}\`
> **Source reviewed:** ${registry.sourceReviewedAt}  
> **Source hash:** \`${registry.sourceHash}\`
> **Regenerate:** \`npm run spec:index\`  
> **Validate:** \`npm run spec:validate\`

## Summary

| Volumes | Atomic requirements | Acceptance criteria | Parent capabilities represented |
|---:|---:|---:|---:|
| ${registry.volumeCount} | ${registry.requirementCount} | ${registry.acceptanceCount} | ${parents.length} |

## Volumes

| Volume | Owner | Requirements | Acceptance | Range |
|---:|---|---:|---:|---|
${volumes.map((volume) => `| ${volume.id} | ${volume.owner} | ${volume.requirementCount} | ${volume.acceptanceCount} | \`${volume.requirementRange}\` |`).join('\n')}

## Parent Capability Coverage

| Parent | Atomic requirements | Owning volumes |
|---|---:|---|
${parents.map((parent) => `| \`${parent.id}\` | ${parent.requirementCount} | ${parent.volumes.join(', ')} |`).join('\n')}

## Executable Product Slice

- [R1 Preview Profile](profiles/R1-preview.md): 24 required end-to-end workflows, exact support tiers, defaults, exclusions, and gates.
- [Familiarity and Story-Native Benchmark](benchmarks/familiarity-and-story-native.md): 12 Figma-transfer, 14 PowerPoint-transfer, and 8 Story-native tasks.

## Full Registry

The complete requirement-to-parent and requirement-to-acceptance registry is in [traceability-index.json](traceability-index.json). The JSON file is the generated machine-readable view; the numbered Markdown volumes remain normative.
`;

function verify(filePath, expected) {
    if (!fs.existsSync(filePath)) {
        console.error(`Missing generated file: ${path.relative(root, filePath)}`);
        return false;
    }
    if (read(filePath) !== expected) {
        console.error(`Generated file is stale: ${path.relative(root, filePath)}`);
        return false;
    }
    return true;
}

if (checkOnly) {
    const valid = verify(jsonPath, json) && verify(markdownPath, markdown);
    if (!valid) process.exit(1);
    console.log(`Product specification index is current (${requirements.length} requirements).`);
} else {
    fs.writeFileSync(jsonPath, json);
    fs.writeFileSync(markdownPath, markdown);
    console.log(`Generated ${path.relative(root, jsonPath)} and ${path.relative(root, markdownPath)}.`);
}