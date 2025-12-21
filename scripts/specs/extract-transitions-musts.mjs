import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const transitionsDir = path.join(repoRoot, 'documentation', '01-specs', 'slides', 'transitions');

// Non-normative / meta docs to exclude from MUST extraction.
const EXCLUDE = new Set([
  '00-slide-transitions-notes.md',
  '05-ledger-and-gate-plan.md',
  'README.md',
  'MUST-index.md',
]);

function listMarkdownFiles(dir) {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isFile() && d.name.endsWith('.md') && !EXCLUDE.has(d.name))
    .map((d) => path.join(dir, d.name))
    .sort((a, b) => a.localeCompare(b));
}

function isHeading(line) {
  return /^#{1,6}\s+/.test(line);
}

function normalizeWhitespace(s) {
  return s.replace(/\s+/g, ' ').trim();
}

function extractMustStatements(filePath) {
  const relPath = path.relative(repoRoot, filePath).replace(/\\/g, '/');
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/);

  let currentHeading = '';
  const items = [];

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.trimEnd();

    if (isHeading(line)) {
      currentHeading = normalizeWhitespace(line.replace(/^#{1,6}\s+/, ''));
      continue;
    }

    // Capture normative statements. We intentionally only match keyword-style MUST/MUST NOT
    // to avoid exploding on conversational "must".
    if (!/\bMUST\b/.test(line)) continue;

    // Skip code fences and code blocks.
    if (/^```/.test(line)) continue;

    // Capture the line, plus any immediately following indented continuation lines
    // (common in markdown bullet lists).
    const captured = [line.trim()];

    let j = i + 1;
    while (j < lines.length) {
      const nextRaw = lines[j];
      const next = nextRaw.trimEnd();
      if (next.trim() === '') break;
      if (isHeading(next.trim())) break;
      if (/^```/.test(next.trim())) break;

      // Continuation: indented line or nested bullet under the current bullet.
      if (/^\s{2,}\S/.test(nextRaw) || /^\s{2,}[-*+]\s+/.test(nextRaw)) {
        captured.push(next.trim());
        j++;
        continue;
      }

      break;
    }

    const statement = normalizeWhitespace(captured.join(' '));

    items.push({
      file: path.basename(filePath),
      relPath,
      heading: currentHeading || '(no heading)',
      statement,
      line: i + 1,
    });
  }

  return items;
}

function main() {
  const files = listMarkdownFiles(transitionsDir);
  const all = files.flatMap(extractMustStatements);

  // De-dup exact duplicates (same file+line+statement).
  const deduped = [];
  const seen = new Set();
  for (const item of all) {
    const key = `${item.relPath}#${item.line}:${item.statement}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(item);
  }

  // Output JSON to stdout; caller can format into tables.
  process.stdout.write(JSON.stringify({
    generatedAt: new Date().toISOString(),
    sourceDir: path.relative(repoRoot, transitionsDir).replace(/\\/g, '/'),
    excluded: Array.from(EXCLUDE.values()),
    count: deduped.length,
    items: deduped,
  }, null, 2));
}

main();
