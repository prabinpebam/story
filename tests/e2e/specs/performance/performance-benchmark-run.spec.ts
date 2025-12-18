import { test, expect } from '@playwright/test';
import { EditorPage } from '../../pages/EditorPage';
import { CanvasHelper } from '../../pages/CanvasHelper';
import { writeBenchMeta, writeBenchResult } from '../../helpers/perf/benchResults';

test.describe('Performance Benchmark Run (no CI gating)', () => {
  let editor: EditorPage;
  let canvas: CanvasHelper;

  async function ensureNoSelection(page: any) {
    // Deterministic: clear selection via store dispatch (strict test contract).
    await editor.dispatchAction('UPDATE_SELECTION', []);
    await expect(page.locator('.sidebar-header .header-title')).toHaveText('Slide');
  }

  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    canvas = new CanvasHelper(page);
  });

  test('selection.simple_rect', async ({ page }) => {
    const warmupIterations = Number(process.env.BENCH_WARMUP ?? 5);
    const measuredIterations = Number(process.env.BENCH_N ?? 30);

    await editor.goto();
    await editor.waitForLoad();
    await editor.waitForFonts();

    // Strict DOM/UI validation: core surfaces are present.
    await expect(page.locator('#interaction-canvas')).toBeVisible();
    await expect(page.locator('[data-testid="property-inspector"]')).toBeVisible();
    await expect(page.locator('.sidebar-header .header-title')).toBeVisible();

    await editor.setActiveTool('shape');
    await canvas.drawRectangle(0.1, 0.1, 0.2, 0.2);

    // Measure selection, so ensure the select tool is active.
    await editor.setActiveTool('select');

    // Ensure deselected (strict, deterministic).
    await ensureNoSelection(page);

    // Emit env + run metadata once per test.
    const envMeta = {
      userAgent: await page.evaluate(() => navigator.userAgent),
      dpr: await page.evaluate(() => window.devicePixelRatio),
      viewport: page.viewportSize() ?? null,
      browserVersion: page.context().browser()?.version() ?? null,
      baseURL: null,
    };

    writeBenchMeta({ type: 'env', details: envMeta as any });
    writeBenchMeta({
      type: 'run',
      details: {
        scenarioId: 'selection.simple_rect',
        warmup: warmupIterations,
        iterations: measuredIterations,
        note: 'Start is pointerup on #interaction-canvas; end is PI Fill visible via MutationObserver (provisional until app emits pi:ready_committed).',
      },
    });

    // Install a persistent in-page measurer (pointerup start + PI Fill visible end).
    await page.evaluate(() => {
      const win = window as any;
      win.__bench = win.__bench || {};

      if (win.__bench.installed) return;
      win.__bench.installed = true;

      win.__bench.longTasks = [];
      try {
        const obs = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            win.__bench.longTasks.push({
              name: entry.name,
              startTime: entry.startTime,
              duration: entry.duration,
            });
          }
        });
        obs.observe({ entryTypes: ['longtask'] as any });
        win.__bench.longTaskObserver = obs;
      } catch {
        win.__bench.longTaskObserver = null;
      }

      const isVisible = (el: Element) => {
        const rect = (el as HTMLElement).getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      };

      const getSectionByTitle = (root: Element, title: string) => {
        const sections = Array.from(root.querySelectorAll('.pi-section'));
        for (const s of sections) {
          const t = s.querySelector('.pi-section__title');
          const text = t?.textContent?.trim();
          if (text === title) return s;
        }
        return null;
      };

      win.__bench.measureSelectionPiReady = () => {
        // Reset per-iteration buffers.
        win.__bench.iterationLongTasks = [];
        win.__bench.longTasksStartIndex = Array.isArray(win.__bench.longTasks) ? win.__bench.longTasks.length : 0;
        win.__bench.pointerUpAt = null;

        const canvas = document.querySelector('#interaction-canvas');
        if (!canvas) throw new Error('Missing #interaction-canvas');

        const pi = document.querySelector('[data-testid="property-inspector"]');
        if (!pi) throw new Error('Missing [data-testid="property-inspector"]');

        const headerTitle = document.querySelector('.sidebar-header .header-title');
        if (!headerTitle) throw new Error('Missing .sidebar-header .header-title');

        const onPointerUp = () => {
          win.__bench.pointerUpAt = performance.now();
          canvas.removeEventListener('pointerup', onPointerUp, true);
        };
        canvas.addEventListener('pointerup', onPointerUp, true);

        return new Promise((resolve) => {
          const check = () => {
            // End condition must reflect selection-mode PI, not slide-mode PI.
            const title = (headerTitle.textContent || '').trim();
            const positionSection = getSectionByTitle(pi, 'Position');
            const fillSection = getSectionByTitle(pi, 'Fill');

            const selectionMode = title !== 'Slide';
            const positionReady = !!positionSection && !positionSection.classList.contains('hidden') && isVisible(positionSection);
            const fillReady = !!fillSection && !fillSection.classList.contains('hidden') && !fillSection.classList.contains('pi-section--collapsed') && isVisible(fillSection);

            if (selectionMode && positionReady && fillReady && typeof win.__bench.pointerUpAt === 'number') {
              const end = performance.now();
              const start = win.__bench.pointerUpAt;

              const tasks = Array.isArray(win.__bench.longTasks) ? win.__bench.longTasks.slice(win.__bench.longTasksStartIndex) : [];
              const totalMs = tasks.reduce((sum: number, t: any) => sum + (t.duration || 0), 0);

              observer.disconnect();
              resolve({ durationMs: end - start, longTasks: { count: tasks.length, totalMs } });
            }
          };

          const observer = new MutationObserver(check);
          observer.observe(document.body, { subtree: true, childList: true, attributes: true, characterData: true });
          check();
        });
      };
    });

    const totalIterations = warmupIterations + measuredIterations;
    for (let i = 0; i < totalIterations; i++) {
      // Reset to a known state between iterations.
      await ensureNoSelection(page);

      // Prepare measurement before click.
      const measurePromise = page.evaluate(() => {
        const win = window as any;
        return win.__bench.measureSelectionPiReady();
      });

      // Trigger selection.
      await canvas.clickAt(0.2, 0.2);

      const measured = await measurePromise as any;
      const valueMs = Number(measured?.durationMs);

      // Discard warmup.
      if (i < warmupIterations) continue;

      writeBenchResult({
        metricId: 'selection.pi_ready.latency_ms',
        scenarioId: 'selection.simple_rect',
        unit: 'ms',
        value: valueMs,
        details: {
          iteration: i - warmupIterations,
          longTasks: measured?.longTasks ?? null,
          note: 'Provisional end condition: selection-mode Property Inspector detected (header title != Slide, Position visible, Fill visible). Replace with deterministic app mark pi:ready_committed per audit plan.',
        },
      });

      expect(valueMs).toBeGreaterThan(0);
    }
  });
});
