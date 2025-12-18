import { test, expect } from '@playwright/test';
import { EditorPage } from '../../pages/EditorPage';
import { CanvasHelper } from '../../pages/CanvasHelper';
import { writeBenchMeta, writeBenchResult } from '../../helpers/perf/benchResults';

test.describe('Performance Benchmark Run (no CI gating)', () => {
  let editor: EditorPage;
  let canvas: CanvasHelper;

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

    await editor.setActiveTool('shape');
    await canvas.drawRectangle(0.1, 0.1, 0.2, 0.2);

    // Ensure deselected
    await canvas.clickAt(0.5, 0.5);

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

      win.__bench.measureSelectionPiReady = () => {
        // Reset per-iteration buffers.
        win.__bench.iterationLongTasks = [];
        win.__bench.longTasksStartIndex = Array.isArray(win.__bench.longTasks) ? win.__bench.longTasks.length : 0;
        win.__bench.pointerUpAt = null;

        const canvas = document.querySelector('#interaction-canvas');
        if (!canvas) throw new Error('Missing #interaction-canvas');

        const onPointerUp = () => {
          win.__bench.pointerUpAt = performance.now();
          canvas.removeEventListener('pointerup', onPointerUp, true);
        };
        canvas.addEventListener('pointerup', onPointerUp, true);

        return new Promise((resolve) => {
          const check = () => {
            const sections = Array.from(document.querySelectorAll('.pi-section'));
            const fill = sections.find((el) => (el.textContent || '').includes('Fill'));
            if (fill && isVisible(fill) && typeof win.__bench.pointerUpAt === 'number') {
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
      await canvas.clickAt(0.5, 0.5);

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
          note: 'Provisional end condition (PI Fill visible). Replace with app mark pi:ready_committed per audit plan.',
        },
      });

      expect(valueMs).toBeGreaterThan(0);
    }
  });
});
