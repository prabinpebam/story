import fs from 'node:fs';
import path from 'node:path';

import { JSDOM } from 'jsdom';

import { importEditableShapesFromSanitizedSvg } from '../../src/core/clipboard/EditableSvgImporter.js';
import { canonicalSha256 } from '../helpers/canonicalHash.js';

const CORPUS_DIR = path.resolve(process.cwd(), 'tests/corpus/shapes/figma-paste');

function ensureDomGlobals() {
  // Vitest provides DOMParser via jsdom; this script runs under Node.
  if (typeof globalThis.DOMParser === 'function' && typeof globalThis.XMLSerializer === 'function') return;

  const dom = new JSDOM('<!doctype html><html><body></body></html>');
  globalThis.DOMParser = dom.window.DOMParser;
  globalThis.XMLSerializer = dom.window.XMLSerializer;
  globalThis.document = dom.window.document;
}

function readText(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function writeJson(filePath, obj) {
  fs.writeFileSync(filePath, JSON.stringify(obj, null, 2) + '\n', 'utf8');
}

function main() {
  ensureDomGlobals();

  const entries = fs.readdirSync(CORPUS_DIR);
  const svgFiles = entries.filter((f) => f.endsWith('.svg')).sort();

  let updated = 0;
  for (const svgFile of svgFiles) {
    const name = svgFile.replace(/\.svg$/i, '');
    const svgPath = path.join(CORPUS_DIR, svgFile);
    const expectedPath = path.join(CORPUS_DIR, `${name}.expected.json`);

    const svg = readText(svgPath);
    const res = importEditableShapesFromSanitizedSvg(svg, { centerX: 0, centerY: 0, idSeed: 'corpus' });

    if (!res.ok) {
      // Keep failures explicit.
      // eslint-disable-next-line no-console
      console.error(`[update-figma-paste-corpus] ${name}: import failed: ${res.reason}`, res.warnings);
      process.exitCode = 1;
      continue;
    }

    const digest = canonicalSha256({ elements: res.elements, warnings: res.warnings });

    const expected = {
      name,
      warnings: res.warnings,
      elementsCount: res.elements.length,
      sha256: digest
    };

    writeJson(expectedPath, expected);
    updated++;
  }

  // eslint-disable-next-line no-console
  console.log(`[update-figma-paste-corpus] wrote ${updated} expected files.`);
}

main();
