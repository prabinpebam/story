import fs from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve(process.cwd());

const mustLinesPath = path.join(
    repoRoot,
    'documentation',
    '01-specs',
    'slides',
    'presentation-mode',
    '_must-lines.txt'
);

const outPath = path.join(
    repoRoot,
    'documentation',
    '01-specs',
    'slides',
    'presentation-mode',
    'MUST-index.md'
);

const EXCLUDE_BASENAMES = new Set([
    '00-master-outline.md',
    '22-implementation-readiness.md',
    '23-ledger-and-gate-plan.md'
]);

const normalizeSlashes = (p) => p.replace(/\\/g, '/');

function relFromRepo(absPath) {
    return normalizeSlashes(path.relative(repoRoot, absPath));
}

function readLines(p) {
    return fs.readFileSync(p, 'utf8').split(/\r?\n/);
}

function findHeadingForLine(fileLines, oneBasedLine) {
    const idx = Math.min(Math.max(oneBasedLine - 1, 0), fileLines.length - 1);
    for (let i = idx; i >= 0; i--) {
        const line = fileLines[i];
        const m = /^(#{1,6})\s+(.+?)\s*$/.exec(line);
        if (m) return m[2];
    }
    return '(no heading)';
}

function stripBulletPrefix(text) {
    return text.replace(/^\s*[-*+]\s+/, '').trim();
}

function escapeMdTableCell(text) {
    return String(text ?? '')
        .replace(/\|/g, '\\|')
        .replace(/\r?\n/g, ' ')
        .trim();
}

function pw(file, title) {
    if (!title) return `PLAYWRIGHT: ${file}`;
    return `PLAYWRIGHT: ${file} - "${title}"`;
}

function vt(file, title) {
    if (!title) return `VITEST: ${file}`;
    return `VITEST: ${file} - "${title}"`;
}

function mapToPmSurface({ specFile, heading, clause }) {
    const file = specFile;
    const h = (heading || '').toLowerCase();
    const c = (clause || '').toLowerCase();

    const looksLikePerfTarget =
        /<\s*\d+\s*ms/i.test(c) ||
        c.includes('kpi') ||
        c.includes('benchmark') ||
        c.includes('telemetry') ||
        c.includes('threshold') ||
        c.includes('regress') ||
        c.includes('ci');

    if (file.endsWith('/06-mode-taxonomy-and-entry-exit.md')) {
        if (h.includes('fullscreen') || c.includes('fullscreen')) return 'PM-002';
        if (h.includes('exit') || c.includes('exit') || c.includes('restore')) return 'PM-003';
        if (h.includes('kiosk') || c.includes('kiosk') || c.includes('autoplay') || c.includes('loop')) return 'PM-140';
        return 'PM-001';
    }

    if (file.endsWith('/01-principles.md')) {
        if (looksLikePerfTarget || c.includes('performance')) return 'PM-130';
        // Principles tend to reinforce audience-clean boundaries and token discipline.
        return 'PM-032';
    }

    if (file.endsWith('/07-input-and-controls.md')) {
        if (h.includes('keyboard') || c.includes('keyboard') || c.includes('shortcut') || c.includes('numeric')) return 'PM-010';
        if (h.includes('touch') || c.includes('swipe') || c.includes('tap')) return 'PM-011';
        if (h.includes('interactive') || c.includes('link') || c.includes('button') || c.includes('input') || c.includes('video')) return 'PM-012';
        if (c.includes('mouse') || c.includes('click')) return 'PM-011';
        return 'PM-010';
    }

    if (file.endsWith('/08-navigation-model.md')) {
        if (h.includes('hidden') || c.includes('hidden slide')) return 'PM-022';
        if (h.includes('non-linear') || c.includes('jump')) return 'PM-021';
        return 'PM-020';
    }

    if (file.endsWith('/09-visual-surface-and-scaling.md')) {
        if (h.includes('high dpi') || c.includes('devicepixelratio') || c.includes('settransform')) return 'PM-031';
        return 'PM-030';
    }

    if (file.endsWith('/03-rendering-in-presentation-mode.md')) {
        if (h.includes('grid') || c.includes('grid')) return 'PM-060';
        if (h.includes('laser') || c.includes('laser')) return 'PM-070';
        if (h.includes('scal') || c.includes('letterbox') || c.includes('aspect')) return 'PM-030';
        return 'PM-032';
    }

    if (file.endsWith('/10-playback-system.md')) {
        if (h.includes('build') || c.includes('build')) return 'PM-020';
        if (h.includes('transition') || c.includes('transition')) return 'PM-040';
        if (c.includes('reduced motion')) return 'PM-042';
        if (c.includes('media') || c.includes('video') || c.includes('audio')) return 'PM-100';
        return 'PM-040';
    }

    if (file.endsWith('/12-hud-and-audience-controls.md')) return 'PM-050';
    if (file.endsWith('/13-theming-and-polish.md')) {
        if (c.includes('reduced motion') || h.includes('motion')) return 'PM-042';
        return 'PM-050';
    }
    if (file.endsWith('/14-reliability-and-recovery.md')) {
        if (c.includes('audience') || c.includes('presenter-only')) return 'PM-051';
        if (c.includes('fullscreen') || c.includes('display')) return 'PM-002';
        return 'PM-100';
    }
    if (file.endsWith('/11-presenter-tools.md')) {
        if (c.includes('sync') || c.includes('message') || c.includes('allowlist') || c.includes('schema')) return 'PM-121';
        if (c.includes('notes') || c.includes('diagnostic') || c.includes('audience dom') || c.includes('privacy')) return 'PM-081';
        return 'PM-080';
    }
    if (file.endsWith('/15-accessibility.md')) {
        if (c.includes('announce') || c.includes('screen reader') || c.includes('aria-live')) return 'PM-110';
        return 'PM-111';
    }
    if (file.endsWith('/16-security-privacy-and-safety.md')) {
        if (c.includes('message') || c.includes('broadcastchannel') || c.includes('postmessage')) return 'PM-121';
        if (c.includes('sanitize') || c.includes('xss') || c.includes('html')) return 'PM-120';
        if (c.includes('telemetry') || c.includes('dnt') || c.includes('pii')) return 'PM-130';
        if (c.includes('audience')) return 'PM-081';
        return 'PM-120';
    }
    if (file.endsWith('/17-observability-and-quality-gates.md')) return 'PM-130';

    // Performance docs and core journeys largely land on existing perf/caching surfaces.
    if (file.endsWith('/02-performance-and-caching.md')) {
        if (looksLikePerfTarget) return 'PM-130';
        if (c.includes('transition') || c.includes('decode') || c.includes('readiness') || c.includes('fully decoded')) return 'PM-041';
        if (c.includes('prefetch') || c.includes('warm') || c.includes('evict')) return 'PM-091';
        if (c.includes('cache') || c.includes('hot tier') || c.includes('service worker') || c.includes('offline')) return 'PM-090';
        return 'PM-090';
    }

    if (file.endsWith('/04-product-bar-and-benchmarks.md')) return 'PM-130';
    if (file.endsWith('/05-core-user-journeys.md')) return 'PM-001';
    if (file.endsWith('/19-implementation-boundaries-and-extensibility.md')) return 'PM-032';

    // Fall back to a conservative audience-boundary mapping.
    return 'PM-032';
}

function verificationForPm(pm) {
    switch (pm) {
        case 'PM-001':
        case 'PM-002':
        case 'PM-003':
            return 'PLAYWRIGHT: tests/e2e/specs/functional/presentation-mode.spec.ts';
        case 'PM-010':
            return 'VITEST: tests/unit/core/presentation/PresentationInputBuffer.test.js; PLAYWRIGHT: tests/e2e/specs/functional/presentation-mode.spec.ts';
        case 'PM-011':
        case 'PM-012':
            return 'PLAYWRIGHT: tests/e2e/specs/functional/presentation-mode.spec.ts';
        case 'PM-020':
        case 'PM-021':
        case 'PM-022':
            return 'PLAYWRIGHT: tests/e2e/specs/functional/presentation-mode.spec.ts';
        case 'PM-030':
        case 'PM-031':
        case 'PM-032':
        case 'PM-060':
        case 'PM-070':
            return 'VITEST: tests/unit/core/PresentationManager.test.js; PLAYWRIGHT: tests/e2e/specs/functional/presentation-mode.spec.ts';
        case 'PM-040':
            return 'PLAYWRIGHT: tests/e2e/specs/functional/presentation-mode.spec.ts';
        case 'PM-041':
            return 'VITEST: tests/unit/core/presentation/AssetReadiness.test.js; PLAYWRIGHT: tests/e2e/specs/functional/presentation-mode.spec.ts';
        case 'PM-042':
            return 'PLAYWRIGHT: tests/e2e/specs/functional/presentation-accessibility.spec.ts';
        case 'PM-050':
            return 'PLAYWRIGHT: tests/e2e/specs/functional/presentation-mode.spec.ts; PLAYWRIGHT: tests/e2e/specs/functional/presentation-accessibility.spec.ts';
        case 'PM-051':
        case 'PM-100':
            return 'PLAYWRIGHT: tests/e2e/specs/functional/presentation-mode.spec.ts';
        case 'PM-080':
        case 'PM-081':
            return 'PLAYWRIGHT: tests/e2e/specs/functional/presenter-view.spec.ts';
        case 'PM-090':
        case 'PM-091':
            return 'VITEST: tests/unit/core/presentation/PresentationPrefetchManager.test.js; PLAYWRIGHT: tests/e2e/specs/functional/presentation-mode.spec.ts';
        case 'PM-110':
        case 'PM-111':
            return 'PLAYWRIGHT: tests/e2e/specs/functional/presentation-accessibility.spec.ts';
        case 'PM-120':
            return 'VITEST: tests/unit/core/notes/NotesDoc.test.js; PLAYWRIGHT: tests/e2e/specs/functional/slide-notes.spec.ts';
        case 'PM-121':
            return 'VITEST: tests/unit/core/presentation/PresenterSyncValidation.test.js; PLAYWRIGHT: tests/e2e/specs/functional/presenter-view.spec.ts';
        case 'PM-130':
            return 'VITEST: tests/unit/core/telemetry/Telemetry.test.js; PLAYWRIGHT: tests/e2e/specs/functional/telemetry.spec.ts; VITEST: tests/unit/perf/PerfBenchGate.test.js';
        case 'PM-140':
            return 'VITEST: tests/unit/core/presentation/KioskMode.test.js; PLAYWRIGHT: tests/e2e/specs/functional/kiosk-mode.spec.ts';
        default:
            return 'TBD';
    }
}

function verificationForClause({ specFile, heading, clause, pm }) {
    const file = specFile;
    const h = (heading || '').toLowerCase();
    const c = (clause || '').toLowerCase();

    const refs = [];
    const add = (s) => {
        if (s && !refs.includes(s)) refs.push(s);
    };

    // Common files
    const PW_PM = 'tests/e2e/specs/functional/presentation-mode.spec.ts';
    const PW_PRESENTER = 'tests/e2e/specs/functional/presenter-view.spec.ts';
    const PW_A11Y = 'tests/e2e/specs/functional/presentation-accessibility.spec.ts';
    const PW_NOTES = 'tests/e2e/specs/functional/slide-notes.spec.ts';
    const PW_TELEMETRY = 'tests/e2e/specs/functional/telemetry.spec.ts';
    const PW_KIOSK = 'tests/e2e/specs/functional/kiosk-mode.spec.ts';

    const VT_PM = 'tests/unit/core/PresentationManager.test.js';
    const VT_INPUT = 'tests/unit/core/presentation/PresentationInputBuffer.test.js';
    const VT_PREFETCH = 'tests/unit/core/presentation/PresentationPrefetchManager.test.js';
    const VT_READINESS = 'tests/unit/core/presentation/AssetReadiness.test.js';
    const VT_SYNC_VALIDATION = 'tests/unit/core/presentation/PresenterSyncValidation.test.js';
    const VT_NOTESDOC = 'tests/unit/core/notes/NotesDoc.test.js';
    const VT_TELEM = 'tests/unit/core/telemetry/Telemetry.test.js';
    const VT_PERF_GATE = 'tests/unit/perf/PerfBenchGate.test.js';
    const VT_KIOSK = 'tests/unit/core/presentation/KioskMode.test.js';

    // --- Presentation mode (Playwright) — clause-level anchors ---

    // Entry / mode picker / fullscreen
    if (file.endsWith('/06-mode-taxonomy-and-entry-exit.md') || file.endsWith('/05-core-user-journeys.md')) {
        if (c.includes('mode picker') || c.includes('fullscreen vs windowed') || h.includes('mode picker')) {
            add(pw(PW_PM, 'should expose a mode picker (fullscreen vs windowed) from Play button'));
        }
        if (c.includes('re-request') || c.includes('fullscreen re-request')) {
            add(pw(PW_PM, 'should show fullscreen re-request button in HUD when not fullscreen'));
        }
        if (c.includes('enter') && (c.includes('menu') || c.includes('toolbar') || c.includes('shortcut'))) {
            add(pw(PW_PM, 'should enter presentation mode via menu action'));
        }
        if (c.includes('request fullscreen') || (c.includes('fullscreen') && c.includes('request'))) {
            // We verify the post-condition (HUD shows re-request when not fullscreen) + denial handling.
            add(pw(PW_PM, 'should show fullscreen re-request button in HUD when not fullscreen'));
        }
        if (c.includes('denial') || c.includes('denied')) {
            add(pw(PW_PM, 'should continue presenting when fullscreen is denied'));
        }
        if (c.includes('externally') || c.includes('fullscreen exits')) {
            add(pw(PW_PM, 'should remain in presentation mode when fullscreen exits externally'));
        }
        if (c.includes('exit') && (c.includes('esc') || c.includes('keyboard'))) {
            add(pw(PW_PM, 'should exit presentation mode with keyboard'));
        }
        if (c.includes('exit') && (c.includes('hud') || c.includes('button'))) {
            add(pw(PW_PM, 'should exit presentation mode with HUD button'));
        }
    }

    // Rendering boundaries / DOM contract / scaling / tokens
    if (file.endsWith('/03-rendering-in-presentation-mode.md') || file.endsWith('/09-visual-surface-and-scaling.md')) {
        if (c.includes('dom contract') || c.includes('required') || h.includes('dom contract')) {
            add(pw(PW_PM, 'should satisfy presentation DOM contract (required IDs exist)'));
        }
        if (c.includes('hide') && (c.includes('chrome') || c.includes('placeholder') || c.includes('toolbar') || c.includes('panel'))) {
            add(pw(PW_PM, 'should hide editor-only chrome and placeholder affordances in presentation'));
        }
        if (c.includes('forbidden selector') || c.includes('selector checklist') || h.includes('forbidden selector')) {
            add(pw(PW_PM, 'should enforce forbidden selector checklist in presentation (DOM audit)'));
        }
        if (c.includes('scale') || c.includes('letterbox') || c.includes('aspect ratio') || h.includes('scaling') || h.includes('letterbox')) {
            add(pw(PW_PM, 'should scale using offset translate + scale (no -50% centering)'));
            add(vt(VT_PM));
        }
        if (c.includes('token') || c.includes('hardcoded') || c.includes('var(') || c.includes('theme')) {
            add(pw(PW_PM, 'should use token-based presentation stage background'));
            add(pw(PW_A11Y, 'should apply presentation stage/HUD colors via tokens (no hardcoded overrides)'));
        }
    }

    // Prefetch/readiness/offline gating and presenter-only loader
    if (file.endsWith('/02-performance-and-caching.md')) {
        if (c.includes('offline')) {
            add(pw(PW_PM, 'should bypass prefetch gating when offline (navigator.onLine=false)'));
        }
        if (c.includes('loading indicator') || (c.includes('presenter') && c.includes('indicator'))) {
            add(pw(PW_PM, 'should never render presenter-only loading indicator in audience view'));
            add(pw(PW_PM, 'should show presenter-only loading indicator while navigation is gated (and hide after ready)'));
        }
        if (c.includes('decode') || c.includes('decoded') || c.includes('first frame') || c.includes('readiness') || c.includes('transition must not start')) {
            add(vt(VT_READINESS));
            add(pw(PW_PM, 'should not start slide transition until assets are decoded (readiness gate)'));
        }
        if (c.includes('prefetch') || c.includes('warm') || c.includes('hot tier') || c.includes('service worker') || c.includes('cache')) {
            add(vt(VT_PREFETCH));
        }
    }

    // Input + navigation (Playwright + Vitest)
    if (file.endsWith('/07-input-and-controls.md')) {
        if (c.includes('keyboard') || c.includes('shortcut') || c.includes('numeric')) {
            add(vt(VT_INPUT));
            if (c.includes('modifier')) add(pw(PW_PM, 'should ignore shortcuts when modifier keys are held'));
            if (c.includes('arrow')) add(pw(PW_PM, 'should navigate with keyboard arrows'));
            if (c.includes('digit') || c.includes('number') || c.includes('enter')) add(pw(PW_PM, 'should jump to slide by number with digits + Enter'));
            if (c.includes('cancel') || c.includes('escape')) add(pw(PW_PM, 'should cancel numeric entry with Escape (without exiting presentation)'));
        }
        if (c.includes('click')) {
            add(pw(PW_PM, 'should advance on click-to-advance when clicking the slide area'));
            add(pw(PW_PM, 'should not advance when clicking inside the HUD (excluded region)'));
        }
    }

    if (file.endsWith('/08-navigation-model.md') || file.endsWith('/10-playback-system.md') || file.endsWith('/05-core-user-journeys.md')) {
        if (c.includes('next') || c.includes('prev') || c.includes('forward') || c.includes('backward')) {
            add(pw(PW_PM, 'should navigate forward in presentation'));
            add(pw(PW_PM, 'should navigate backward in presentation'));
        }
        if (c.includes('grid')) {
            add(pw(PW_PM, 'should open and close grid view'));
            add(pw(PW_PM, 'should jump via grid and support back-stack (Alt+Backspace)'));
        }
        if (c.includes('jump') && (c.includes('number') || c.includes('digit'))) {
            add(pw(PW_PM, 'should jump to slide by number with digits + Enter'));
        }
    }

    // Presenter view / privacy boundary / sync validation
    if (file.endsWith('/11-presenter-tools.md')) {
        if (c.includes('popup') || c.includes('separate window') || c.includes('lockstep') || c.includes('reopen') || c.includes('close')) {
            add(pw(PW_PRESENTER, 'should open as a popup window and stay in lockstep with audience'));
            add(pw(PW_PRESENTER, 'should prompt to reopen if presenter window closes during a show'));
        }
        if (c.includes('swap')) {
            add(pw(PW_PRESENTER, 'should swap presenter role between windows (Swap Displays)'));
        }
        if (c.includes('buildindex')) {
            add(pw(PW_PRESENTER, 'should keep buildIndex in lockstep across presenter and audience'));
        }
        if (c.includes('notes') || c.includes('speaker notes')) {
            add(pw(PW_PRESENTER, 'should sanitize speaker notes in the presenter panel'));
            add(pw(PW_NOTES, 'SN02: sanitizes unsafe HTML on save/reload'));
            add(vt(VT_NOTESDOC));
        }
        if (c.includes('sync') || c.includes('message') || c.includes('allowlist') || c.includes('schema') || c.includes('postmessage') || c.includes('broadcastchannel')) {
            add(pw(PW_PRESENTER, 'should ignore malformed sync messages (validation allowlist)'));
            add(vt(VT_SYNC_VALIDATION));
        }
    }

    // Accessibility
    if (file.endsWith('/15-accessibility.md') || file.endsWith('/13-theming-and-polish.md')) {
        if (c.includes('announce') || c.includes('screen reader') || c.includes('aria-live')) {
            add(pw(PW_A11Y, 'should announce slide/build changes via live region'));
        }
        if (c.includes('accessible name') || c.includes('accessible') || c.includes('toggle')) {
            add(pw(PW_A11Y, 'should expose accessible HUD controls and toggle semantics'));
        }
        if (c.includes('focus') || c.includes('trap') || c.includes('keyboard-only')) {
            add(pw(PW_A11Y, 'should allow keyboard-only exit (no focus trap)'));
        }
        if (c.includes('reduced motion')) {
            add(pw(PW_A11Y, 'should disable slide transitions when prefers-reduced-motion is set'));
        }
        if (c.includes('forced-colors') || c.includes('higher contrast') || c.includes('prefers-contrast')) {
            add(pw(PW_A11Y, 'should remain usable under forced-colors and higher contrast'));
        }
        if (c.includes('light') || c.includes('dark')) {
            add(pw(PW_A11Y, 'should apply light/dark theme changes to presentation tokens'));
        }
        if (c.includes('accent') && c.includes('grid')) {
            add(pw(PW_A11Y, 'should apply accent theme to presentation grid active indicator'));
        }
    }

    // Security / privacy / telemetry
    if (file.endsWith('/16-security-privacy-and-safety.md') || file.endsWith('/17-observability-and-quality-gates.md') || file.endsWith('/04-product-bar-and-benchmarks.md')) {
        if (c.includes('telemetry') || c.includes('kpi') || c.includes('benchmark') || c.includes('regress') || c.includes('threshold') || c.includes('ci')) {
            add(vt(VT_TELEM));
            add(vt(VT_PERF_GATE));
            add(pw(PW_TELEMETRY, 'emits presentation telemetry events without notes/content'));
        }
        if (c.includes('crash') || c.includes('stack trace') || c.includes('unhandled')) {
            add(pw(PW_TELEMETRY, 'emits privacy-safe crash events during presentation (error + unhandledrejection)'));
        }
        if (c.includes('pii') || c.includes('do not track') || c.includes('dnt') || c.includes('notes') || c.includes('deck content')) {
            add(vt(VT_TELEM));
            add(pw(PW_TELEMETRY, 'emits presentation telemetry events without notes/content'));
        }
        if (c.includes('sanitize') || c.includes('xss') || c.includes('html')) {
            add(vt(VT_NOTESDOC));
            add(pw(PW_NOTES, 'SN02: sanitizes unsafe HTML on save/reload'));
            add(pw(PW_PRESENTER, 'should sanitize speaker notes in the presenter panel'));
        }
        if (c.includes('postmessage') || c.includes('broadcastchannel') || c.includes('message')) {
            add(vt(VT_SYNC_VALIDATION));
            add(pw(PW_PRESENTER, 'should ignore malformed sync messages (validation allowlist)'));
        }
    }

    // Kiosk
    if (pm === 'PM-140' || file.includes('kiosk')) {
        if (c.includes('loop') || c.includes('autoplay') || c.includes('timed') || c.includes('advance')) {
            add(pw(PW_KIOSK, 'auto-advances and can loop'));
            add(pw(PW_KIOSK, 'user input resets the autoplay countdown'));
            add(vt(VT_KIOSK));
        }
        if (c.includes('disableinput') || (c.includes('disable') && c.includes('input')) || (c.includes('escape') && c.includes('exit'))) {
            add(pw(PW_KIOSK, 'disableInput blocks manual navigation but Escape exits'));
            add(vt(VT_KIOSK));
        }
    }

    if (refs.length) return refs.join('; ');
    return verificationForPm(pm);
}

function main() {
    if (!fs.existsSync(mustLinesPath)) {
        console.error(`Missing ${relFromRepo(mustLinesPath)}. Generate it first.`);
        process.exit(1);
    }

    const raw = readLines(mustLinesPath).filter(Boolean);
    const rows = [];
    const seen = new Set();

    for (const line of raw) {
        // Format: C:\abs\path\file.md:123:- MUST ...
        const m = /^(.*?):(\d+):(.*)$/.exec(line);
        if (!m) continue;
        const absFile = m[1];
        const lineNo = Number(m[2]);
        const clauseRaw = (m[3] || '').trim();

        const base = path.basename(absFile);
        if (EXCLUDE_BASENAMES.has(base)) continue;

        const abs = path.resolve(absFile);
        if (!abs.startsWith(repoRoot)) continue;

        const rel = relFromRepo(abs);
        if (!rel.startsWith('documentation/01-specs/slides/presentation-mode/')) continue;

        const key = `${rel}:${lineNo}:${clauseRaw}`;
        if (seen.has(key)) continue;
        seen.add(key);

        let fileLines;
        try {
            fileLines = readLines(abs);
        } catch {
            continue;
        }
        const heading = findHeadingForLine(fileLines, lineNo);
        const clause = stripBulletPrefix(clauseRaw);

        // Filter out obvious meta lines that are not product requirements.
        if (/\bUse MUST\b/i.test(clause) || /MUST\/SHOULD\/MAY/i.test(clause)) continue;
        if (rel.endsWith('00-master-outline.md')) continue;

        const pm = mapToPmSurface({ specFile: rel, heading, clause });
        const verification = verificationForClause({ specFile: rel, heading, clause, pm });
        const mustId = `MUST-${path.basename(rel, '.md').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '')}-L${lineNo}`;

        rows.push({ mustId, specFile: rel, lineNo, heading, clause, pm, verification });
    }

    rows.sort((a, b) => {
        if (a.specFile !== b.specFile) return a.specFile.localeCompare(b.specFile);
        return a.lineNo - b.lineNo;
    });

    const out = [];
    out.push('# Presentation Mode — MUST Index (100%)');
    out.push('');
    out.push('This file is the exhaustive index of all **MUST** / **MUST NOT** clauses across the Presentation Mode spec suite.');
    out.push('');
    out.push('Conventions:');
    out.push('- `MUST-ID` is derived from the spec filename + line number for stability across edits.');
    out.push('- `Maps to` is the owning `PM-###` surface used by the Gate 11 traceability ledger.');
    out.push('');
    out.push('Generation:');
    out.push('- Source: `documentation/01-specs/slides/presentation-mode/_must-lines.txt`');
    out.push('- Command: `node scripts/generate-must-index.mjs`');
    out.push('');
    out.push('| MUST-ID | Spec file | Section heading | Requirement summary | Maps to | Automated verification |');
    out.push('|---|---|---|---|---|---|');

    for (const r of rows) {
        out.push(
            `| ${escapeMdTableCell(r.mustId)} | ${escapeMdTableCell(r.specFile.replace('documentation/01-specs/slides/presentation-mode/', ''))} | ${escapeMdTableCell(r.heading)} | ${escapeMdTableCell(r.clause)} | ${escapeMdTableCell(r.pm)} | ${escapeMdTableCell(r.verification)} |`
        );
    }

    fs.writeFileSync(outPath, out.join('\n') + '\n', 'utf8');
    console.log(`Wrote ${relFromRepo(outPath)} (${rows.length} rows)`);
}

main();
