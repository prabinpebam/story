import { test, expect } from '@playwright/test';
import { EditorPage } from '../../pages/EditorPage';
import { CanvasHelper } from '../../pages/CanvasHelper';

type SoakSample = {
  tMs: number;
  frameP95Ms: number | null;
  longtaskCount: number | null;
  heapUsedMB: number | null;
  domNodes: number | null;
  jsEventListeners: number | null;
};

test.describe('Performance Soak Diagnose (no gating)', () => {
  test.setTimeout(20 * 60 * 1000);

  test('soak.diagnose', async ({ page, context }) => {
    const durationMs = Number(process.env.SOAK_DURATION_MS ?? 2 * 60 * 1000);
    const sampleEveryMs = Number(process.env.SOAK_SAMPLE_EVERY_MS ?? 5000);
    const doActivity = (process.env.SOAK_ACTIVITY ?? 'idle') !== 'idle';

    const editor = new EditorPage(page);
    const canvas = new CanvasHelper(page);

    await editor.goto();
    await editor.waitForLoad();

    await expect(page.locator('#interaction-canvas')).toBeVisible();
    await expect(page.locator('[data-testid="property-inspector"]')).toBeVisible();

    // Install in-page collectors once.
    await page.evaluate(() => {
      const win = window as any;
      win.__soak = win.__soak || {};
      if (win.__soak.installed) return;
      win.__soak.installed = true;

      win.__soak.collectFramesForMs = (windowMs: number) =>
        new Promise<number[]>((resolve) => {
          const deltas: number[] = [];
          let last = performance.now();
          const start = last;
          const step = (now: number) => {
            deltas.push(now - last);
            last = now;
            if (now - start >= windowMs) {
              resolve(deltas.slice(1));
              return;
            }
            requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        });

      win.__soak.p95 = (values: number[]) => {
        const nums = values
          .filter((v) => typeof v === 'number' && Number.isFinite(v))
          .slice()
          .sort((a, b) => a - b);
        if (!nums.length) return null;
        const idx = Math.ceil(0.95 * nums.length) - 1;
        return nums[Math.min(Math.max(idx, 0), nums.length - 1)];
      };

      win.__soak.longtasksForMs = (windowMs: number) =>
        new Promise<number | null>((resolve) => {
          const longTasks: any[] = [];
          let obs: PerformanceObserver | null = null;
          try {
            obs = new PerformanceObserver((list) => {
              for (const entry of list.getEntries()) longTasks.push(entry);
            });
            // @ts-expect-error
            obs.observe({ entryTypes: ['longtask'] });
          } catch {
            obs = null;
          }

          const done = () => {
            if (obs) obs.disconnect();
            resolve(obs ? longTasks.length : null);
          };

          setTimeout(done, windowMs);
        });

      win.__soak.heapUsedMB = () => {
        const mem = (performance as any).memory;
        const used = mem?.usedJSHeapSize;
        if (typeof used !== 'number') return null;
        return used / (1024 * 1024);
      };
    });

    // Attach CDP to sample DOM counters (nodes, listeners).
    const client = await context.newCDPSession(page);

    const start = Date.now();
    const samples: SoakSample[] = [];

    // Optional activity loop (kept lightweight, bounded): tool switch + simple selection.
    // This helps reproduce "gets worse after use" without manual interaction.
    const activity = async () => {
      if (!doActivity) return;

      await editor.setActiveTool('shape');
      await canvas.drawRectangle(0.15, 0.15, 0.15, 0.12);
      await editor.setActiveTool('select');

      // Click a few times to exercise hit-testing/selection.
      for (let i = 0; i < 5; i++) {
        await canvas.clickAt(0.2, 0.2);
        await page.waitForTimeout(100);
        await editor.dispatchAction('UPDATE_SELECTION', []);
      }
    };

    while (Date.now() - start < durationMs) {
      const tMs = Date.now() - start;

      // Measure over a fixed 1s window to avoid noisy single-frame FPS.
      const [deltas, longCount, heapUsedMB, domCounters] = await Promise.all([
        page.evaluate(() => (window as any).__soak.collectFramesForMs(1000)),
        page.evaluate(() => (window as any).__soak.longtasksForMs(1000)),
        page.evaluate(() => (window as any).__soak.heapUsedMB()),
        client.send('Memory.getDOMCounters').catch(() => null as any),
      ]);

      const frameP95Ms = await page.evaluate((arr) => (window as any).__soak.p95(arr), deltas);

      samples.push({
        tMs,
        frameP95Ms: typeof frameP95Ms === 'number' ? frameP95Ms : null,
        longtaskCount: typeof longCount === 'number' ? longCount : null,
        heapUsedMB: typeof heapUsedMB === 'number' ? heapUsedMB : null,
        domNodes: typeof domCounters?.nodes === 'number' ? domCounters.nodes : null,
        jsEventListeners: typeof domCounters?.jsEventListeners === 'number' ? domCounters.jsEventListeners : null,
      });

      await activity();
      await page.waitForTimeout(sampleEveryMs);
    }

    // Basic sanity check: we collected at least one sample.
    expect(samples.length).toBeGreaterThan(0);

    // Print a compact summary for CI logs.
    const last = samples[samples.length - 1];
    console.log('[soak] samples:', samples.length);
    console.log('[soak] first:', samples[0]);
    console.log('[soak] last:', last);

    // Emit JSON to stdout so the node runner can capture it if desired.
    console.log('[soak] json:', JSON.stringify({
      durationMs,
      sampleEveryMs,
      doActivity,
      samples,
    }));
  });
});
