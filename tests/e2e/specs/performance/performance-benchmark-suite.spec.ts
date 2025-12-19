import { test, expect } from '@playwright/test';
import { EditorPage } from '../../pages/EditorPage';
import { CanvasHelper } from '../../pages/CanvasHelper';
import { writeBenchMeta, writeBenchResult } from '../../helpers/perf/benchResults';

test.describe('Performance Benchmark Suite (no CI gating)', () => {
  let editor: EditorPage;
  let canvas: CanvasHelper;

  test.setTimeout(15 * 60 * 1000);

  async function ensureNoSelection(page: any) {
    await editor.dispatchAction('UPDATE_SELECTION', []);
    await expect(page.locator('.sidebar-header .header-title')).toHaveText('Slide');
  }

  async function exitTextEditIfNeeded() {
    await editor.dispatchAction('SET_EDITING_ELEMENT', null);
  }

  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    canvas = new CanvasHelper(page);
  });

  test('suite.all', async ({ page, context }) => {
    const warmupIterations = Number(process.env.BENCH_WARMUP ?? 5);
    const measuredIterations = Number(process.env.BENCH_N ?? 30);
    const maxPerMetric = Number(process.env.BENCH_MAX_PER_METRIC ?? 10);
    const perMetricIterations = Math.max(1, Math.min(measuredIterations, maxPerMetric));
    const cappedFrameIterations = Math.min(measuredIterations, 10);

    const withTimeout = async <T,>(p: Promise<T>, ms: number, label: string): Promise<T> => {
      let t: any;
      const timeout = new Promise<T>((_, reject) => {
        t = setTimeout(() => reject(new Error(`Timeout waiting for ${label} (${ms}ms)`)), ms);
      });
      try {
        return await Promise.race([p, timeout]);
      } finally {
        clearTimeout(t);
      }
    };

    console.log('[perf:bench] goto');
    await withTimeout(editor.goto(), 15000, 'editor.goto');
    console.log('[perf:bench] waitForLoad');
    await withTimeout(editor.waitForLoad(), 15000, 'editor.waitForLoad');
    console.log('[perf:bench] waitForFonts');
    try {
      await withTimeout(editor.waitForFonts(), 8000, 'editor.waitForFonts');
    } catch {
      console.log('[perf:bench] waitForFonts timed out; continuing');
    }

    // Strict DOM/UI validation.
    await expect(page.locator('#interaction-canvas')).toBeVisible();
    await expect(page.locator('[data-testid="property-inspector"]')).toBeVisible();
    await expect(page.locator('.sidebar-header .header-title')).toBeVisible();
    await expect(page.locator('[data-testid="tool-select"]')).toBeVisible();
    await expect(page.locator('[data-testid="tool-text"]')).toBeVisible();

    await exitTextEditIfNeeded();

    // Emit env + suite metadata once.
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
        scenarioId: 'suite.all',
        warmup: warmupIterations,
        iterations: measuredIterations,
        note: 'Suite run. Some metrics cap iterations (e.g., frame windows use min(BENCH_N, 10)). All end conditions are DOM/state-derived (provisional) until deterministic app marks exist per audit plan.',
      },
    });

    // Shared in-page bench harness.
    await page.evaluate(() => {
      const win = window as any;
      win.__bench = win.__bench || {};
      if (win.__bench.installed) return;
      win.__bench.installed = true;

      const getStore = () => {
        const s = win.__TEST_STORE__ || win._storyAppStore;
        if (!s) throw new Error('Test store not exposed');
        return s;
      };

      const percentile = (sorted: number[], p: number) => {
        if (!sorted.length) return null;
        const idx = Math.ceil((p / 100) * sorted.length) - 1;
        const clamped = Math.min(Math.max(idx, 0), sorted.length - 1);
        return sorted[clamped];
      };

      const p95 = (values: number[]) => {
        const nums = values
          .filter((v) => typeof v === 'number' && Number.isFinite(v))
          .slice()
          .sort((a, b) => a - b);
        return percentile(nums, 95);
      };

      const isVisible = (el: Element | null) => {
        if (!el) return false;
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

      win.__bench.collectFramesForMs = (durationMs: number) =>
        new Promise<number[]>((resolve) => {
          const deltas: number[] = [];
          let last = performance.now();
          const start = last;
          const step = (now: number) => {
            deltas.push(now - last);
            last = now;
            if (now - start >= durationMs) {
              resolve(deltas.slice(1));
              return;
            }
            requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        });

      win.__bench.measureSelectionWindow = () => {
        const canvas = document.querySelector('#interaction-canvas');
        if (!canvas) throw new Error('Missing #interaction-canvas');

        const pi = document.querySelector('[data-testid="property-inspector"]');
        if (!pi) throw new Error('Missing [data-testid="property-inspector"]');

        const headerTitle = document.querySelector('.sidebar-header .header-title');
        if (!headerTitle) throw new Error('Missing .sidebar-header .header-title');

        const app = win.app;
        const ht = app?.canvasManager?.hitTesting;
        const origHitTest = ht?.hitTest ? ht.hitTest.bind(ht) : null;
        const hitSamples: number[] = [];

        if (origHitTest) {
          ht.hitTest = function (...args: any[]) {
            const s = performance.now();
            const r = origHitTest(...args);
            const e = performance.now();
            hitSamples.push(e - s);
            return r;
          };
        }

        let pointerUpAt: number | null = null;
        const onPointerUp = () => {
          pointerUpAt = performance.now();
          canvas.removeEventListener('pointerup', onPointerUp, true);
        };
        canvas.addEventListener('pointerup', onPointerUp, true);

        const longTasks: any[] = [];
        let longObs: any = null;
        try {
          longObs = new PerformanceObserver((list: any) => {
            for (const entry of list.getEntries()) {
              longTasks.push({ startTime: entry.startTime, duration: entry.duration });
            }
          });
          longObs.observe({ entryTypes: ['longtask'] as any });
        } catch {
          longObs = null;
        }

        const frameDeltas: number[] = [];
        let lastFrame = performance.now();
        let rafId: number | null = null;
        const raf = (now: number) => {
          frameDeltas.push(now - lastFrame);
          lastFrame = now;
          rafId = requestAnimationFrame(raf);
        };
        rafId = requestAnimationFrame(raf);

        return new Promise((resolve) => {
          const check = () => {
            const title = (headerTitle.textContent || '').trim();
            const positionSection = getSectionByTitle(pi, 'Position');
            const fillSection = getSectionByTitle(pi, 'Fill');

            const selectionMode = title !== 'Slide';
            const positionReady =
              !!positionSection && !positionSection.classList.contains('hidden') && isVisible(positionSection);
            const fillReady =
              !!fillSection &&
              !fillSection.classList.contains('hidden') &&
              !fillSection.classList.contains('pi-section--collapsed') &&
              isVisible(fillSection);

            if (selectionMode && positionReady && fillReady && typeof pointerUpAt === 'number') {
              const end = performance.now();
              const start = pointerUpAt;

              if (rafId != null) cancelAnimationFrame(rafId);
              if (longObs) longObs.disconnect();
              if (origHitTest) ht.hitTest = origHitTest;

              observer.disconnect();
              resolve({
                piReadyMs: end - start,
                longTasksCount: longTasks.length,
                frameP95Ms: p95(frameDeltas.slice(1)) ?? null,
                hittestP95Ms: p95(hitSamples) ?? null,
              });
            }
          };

          const observer = new MutationObserver(check);
          observer.observe(document.body, { subtree: true, childList: true, attributes: true, characterData: true });
          check();
        });
      };

      win.__bench.measureSelectionHighlight = () => {
        const canvas = document.querySelector('#interaction-canvas');
        if (!canvas) throw new Error('Missing #interaction-canvas');
        const headerTitle = document.querySelector('.sidebar-header .header-title');
        if (!headerTitle) throw new Error('Missing .sidebar-header .header-title');

        let pointerUpAt: number | null = null;
        const onPointerUp = () => {
          pointerUpAt = performance.now();
          canvas.removeEventListener('pointerup', onPointerUp, true);
        };
        canvas.addEventListener('pointerup', onPointerUp, true);

        return new Promise((resolve) => {
          const check = () => {
            const title = (headerTitle.textContent || '').trim();
            if (title !== 'Slide' && typeof pointerUpAt === 'number') {
              // Measure through the next frame boundary to avoid 0ms measurements
              // on fast machines / tight mutation timing.
              const start = pointerUpAt;
              observer.disconnect();
              requestAnimationFrame(() => {
                const end = performance.now();
                resolve({ durationMs: end - start });
              });
            }
          };
          const observer = new MutationObserver(check);
          observer.observe(document.body, { subtree: true, childList: true, attributes: true, characterData: true });
          check();
        });
      };

      win.__bench.measureToolSwitch = (toolTestId: string, expectedTool: string) => {
        const el = document.querySelector(`[data-testid="${toolTestId}"]`);
        if (!el) throw new Error(`Missing tool element ${toolTestId}`);

        const store = getStore();
        // IMPORTANT: state updates can occur before pointerup;
        // starting from invocation avoids hanging when no further state-changed occurs.
        const start = performance.now();

        return new Promise((resolve) => {
          const onState = () => {
            const state = store.getState();
            if (state?.editor?.activeTool === expectedTool) {
              const end = performance.now();
              store.off('state-changed', onState);
              resolve({ durationMs: end - start });
            }
          };
          store.on('state-changed', onState);
          onState();
        });
      };

      win.__bench.measureSlideSwitch = (thumbTestId: string, expectedSlideId: string) => {
        const el = document.querySelector(`[data-testid="${thumbTestId}"]`);
        if (!el) throw new Error(`Missing slide thumb ${thumbTestId}`);

        const store = getStore();
        const start = performance.now();

        return new Promise((resolve) => {
          const onState = () => {
            const state = store.getState();
            if (state?.editor?.activeSlideId === expectedSlideId) {
              const end = performance.now();
              store.off('state-changed', onState);
              resolve({ durationMs: end - start });
            }
          };
          store.on('state-changed', onState);
          onState();
        });
      };

      win.__bench.measureThemeSwitch = (actionId: string, expectedDataTheme: string | null) => {
        // NOTE: App's menu action dispatches SET_THEME (not handled by Store.js).
        // Use DOM attribute as the canonical signal for theme-mode changes.
        const start = performance.now();
        window.dispatchEvent(new CustomEvent('story:menu-action', { detail: { action: actionId } }));

        return new Promise((resolve, reject) => {
          const deadline = performance.now() + 2000;
          const tick = () => {
            const themeAttr = document.documentElement.getAttribute('data-theme');
            const okAttr = expectedDataTheme == null ? themeAttr == null : themeAttr === expectedDataTheme;
            if (okAttr) {
              // Measure through next frame so we at least include a paint boundary.
              requestAnimationFrame(() => {
                const end = performance.now();
                resolve({ durationMs: end - start });
              });
              return;
            }
            if (performance.now() > deadline) {
              reject(new Error('Timed out waiting for theme attribute'));
              return;
            }
            requestAnimationFrame(tick);
          };
          tick();
        });
      };

      win.__bench.measureDragStart = (elementId: string) => {
        const cm = (win as any).app?.canvasManager;
        if (!cm) throw new Error('Missing app.canvasManager');

        const store = getStore();

        const readEl = () => {
          const st = store.getState();
          const slide = st.slides?.[st.editor.activeSlideId];
          const el = slide?.elements?.[elementId];
          return el ? { x: el.x, y: el.y } : null;
        };

        const baseline = readEl();
        if (!baseline) throw new Error(`Missing element ${elementId}`);

        let start: number | null = null;
        const invokedAt = performance.now();
        const cleanupDownListeners = () => {
          window.removeEventListener('pointerdown', onDown, true);
          window.removeEventListener('mousedown', onDown, true);
        };

        const onDown = () => {
          if (typeof start !== 'number') start = performance.now();
          cleanupDownListeners();
        };

        // Playwright's page.mouse.* emits mouse events reliably; pointer events can vary.
        window.addEventListener('pointerdown', onDown, true);
        window.addEventListener('mousedown', onDown, true);

        return new Promise((resolve, reject) => {
          const deadline = performance.now() + 5000;

          const cleanup = () => {
            cleanupDownListeners();
            store.off('state-changed', onState);
          };

          const resolveNow = (details: Record<string, unknown>) => {
            const end = performance.now();
            const s = typeof start === 'number' ? start : invokedAt;
            cleanup();
            resolve({ durationMs: end - s, ...details });
          };

          const isDraggingState = (state: string) =>
            state === 'DRAGGING' ||
            state === 'RESIZING' ||
            state === 'VECTOR_NODE_DRAGGING' ||
            state === 'VECTOR_HANDLE_DRAGGING';

          const tick = () => {
            const state = String(cm.interactionState || '');
            const st = store.getState();
            const pos = readEl();
            const moved = !!pos && (pos.x !== baseline.x || pos.y !== baseline.y);
            const interacting = st?.ui?.isInteracting === true;

            if (isDraggingState(state) || moved || interacting) {
              resolveNow({
                reason: isDraggingState(state) ? 'canvasManager.interactionState' : moved ? 'element.moved' : 'ui.isInteracting',
                interactionState: state,
              });
              return;
            }
            if (performance.now() > deadline) {
              cleanup();
              reject(
                new Error(
                  `Timed out waiting for interaction start (interactionState=${cm.interactionState}, ui.isInteracting=${st?.ui?.isInteracting})`
                )
              );
              return;
            }
            requestAnimationFrame(tick);
          };

          const onState = () => {
            // A store tick is usually a good proxy for interaction start.
            // Still keep the rAF tick to avoid missing fast transitions.
            tick();
          };

          store.on('state-changed', onState);
          tick();
        });
      };

      win.__bench.measureTyping = (elementId: string) => {
        // DOM-based measurement: keydown -> contenteditable DOM mutation.
        const editable = document.querySelector('#slide-content [contenteditable="true"]') as HTMLElement | null;
        if (!editable) throw new Error('Missing #slide-content [contenteditable="true"]');

        const baseline = editable.innerHTML;
        let start: number | null = null;

        const onKeyDown = () => {
          start = performance.now();
          document.removeEventListener('keydown', onKeyDown, true);
        };
        document.addEventListener('keydown', onKeyDown, true);

        return new Promise((resolve, reject) => {
          const deadline = performance.now() + 2000;
          const observer = new MutationObserver(() => {
            const next = editable.innerHTML;
            if (next !== baseline && typeof start === 'number') {
              const end = performance.now();
              observer.disconnect();
              resolve({ durationMs: end - start });
            }
          });
          observer.observe(editable, { subtree: true, childList: true, characterData: true, attributes: true });

          const tick = () => {
            if (performance.now() > deadline) {
              observer.disconnect();
              reject(new Error('Timed out waiting for contenteditable mutation'));
              return;
            }
            requestAnimationFrame(tick);
          };
          tick();
        });
      };

      win.__bench.measureRenderOnce = () => {
        // IMPORTANT: BaseRenderer registers a bound render listener with Store at construction time,
        // so swapping renderer.render won't intercept the store-driven render.
        // Measure an explicit render() call instead.
        const app = win.app;
        const renderer = app?.currentRenderer;
        if (!renderer || typeof renderer.render !== 'function') throw new Error('Missing app.currentRenderer.render');
        const s = performance.now();
        renderer.render();
        const e = performance.now();
        return { durationMs: e - s };
      };

      win.__bench.p95 = p95;
    });

    // === Scenario: selection.simple_rect ===
    console.log('[perf:bench] scenario selection.simple_rect');
    await editor.setActiveTool('shape');
    await canvas.drawRectangle(0.1, 0.1, 0.2, 0.2);
    await editor.setActiveTool('select');
    await ensureNoSelection(page);

    const rectId = await page.evaluate(() => {
      const win = window as any;
      const store = win.__TEST_STORE__ || win._storyAppStore;
      const st = store.getState();
      const slide = st.slides?.[st.editor.activeSlideId];
      const order = slide?.elementOrder ?? [];
      return order[order.length - 1] ?? null;
    });
    expect(rectId).toBeTruthy();

    const selectionTotal = warmupIterations + perMetricIterations;
    for (let i = 0; i < selectionTotal; i++) {
      await ensureNoSelection(page);

      const highlightPromise = page.evaluate(() => (window as any).__bench.measureSelectionHighlight());
      const windowPromise = page.evaluate(() => (window as any).__bench.measureSelectionWindow());
      await canvas.clickAt(0.2, 0.2);

      const highlight = (await withTimeout(highlightPromise as any, 5000, 'selection.highlight')) as any;
      const winMeasured = (await withTimeout(windowPromise as any, 8000, 'selection.pi_ready')) as any;

      const highlightMs = Number(highlight?.durationMs);
      const piReadyMs = Number(winMeasured?.piReadyMs);
      const frameP95Ms = winMeasured?.frameP95Ms == null ? null : Number(winMeasured?.frameP95Ms);
      const longCount = Number(winMeasured?.longTasksCount ?? 0);
      const hittestP95Ms = winMeasured?.hittestP95Ms == null ? null : Number(winMeasured?.hittestP95Ms);

      if (i < warmupIterations) continue;
      const iter = i - warmupIterations;

      writeBenchResult({
        metricId: 'selection.highlight.latency_ms',
        scenarioId: 'selection.simple_rect',
        unit: 'ms',
        value: highlightMs,
        details: { iteration: iter, note: 'Provisional end condition: PI header title != Slide (selection mode). Replace with selection:highlight_committed mark.' },
      });

      writeBenchResult({
        metricId: 'selection.pi_ready.latency_ms',
        scenarioId: 'selection.simple_rect',
        unit: 'ms',
        value: piReadyMs,
        details: { iteration: iter, note: 'Provisional end condition: selection-mode Property Inspector detected (header != Slide, Position visible, Fill visible). Replace with pi:ready_committed mark.' },
      });

      if (frameP95Ms != null) {
        writeBenchResult({
          metricId: 'frame.interaction.p95_ms',
          scenarioId: 'selection.simple_rect',
          unit: 'ms',
          value: frameP95Ms,
          details: { iteration: iter, note: 'Provisional: rAF delta p95 collected during selection window.' },
        });
      }

      writeBenchResult({
        metricId: 'longtask.count',
        scenarioId: 'selection.simple_rect',
        unit: 'count',
        value: longCount,
        details: { iteration: iter, note: 'Long tasks (>50ms) observed during selection window. Provisional until app marks exist.' },
      });

      if (hittestP95Ms != null) {
        writeBenchResult({
          metricId: 'hittest.pointer.p95_ms',
          scenarioId: 'selection.simple_rect',
          unit: 'ms',
          value: hittestP95Ms,
          details: { iteration: iter, note: 'Provisional: wrapped app.canvasManager.hitTesting.hitTest durations during selection window.' },
        });
      }

      expect(highlightMs).toBeGreaterThan(0);
      expect(piReadyMs).toBeGreaterThan(0);
    }

    // === Scenario: tool_switch.text ===
    console.log('[perf:bench] scenario tool_switch.text');
    const toolTotal = warmupIterations + perMetricIterations;
    for (let i = 0; i < toolTotal; i++) {
      await editor.setActiveTool('select');
      const p = page.evaluate(() => (window as any).__bench.measureToolSwitch('tool-text', 'text'));
      await page.locator('[data-testid="tool-text"]').click();
      const r = (await withTimeout(p as any, 5000, 'tool_switch')) as any;
      const ms = Number(r?.durationMs);
      if (i < warmupIterations) continue;
      writeBenchResult({
        metricId: 'tool_switch.latency_ms',
        scenarioId: 'tool_switch.text',
        unit: 'ms',
        value: ms,
        details: { iteration: i - warmupIterations, note: 'Provisional end condition: store.editor.activeTool becomes "text".' },
      });
      expect(ms).toBeGreaterThan(0);
    }

    // === Scenario: drag.simple_shape ===
    console.log('[perf:bench] scenario drag.simple_shape');
    // Create a dedicated element for drag using the same geometry as the existing
    // functional test `tests/e2e/specs/functional/element-manipulation.spec.ts`.
    await editor.setActiveTool('shape');
    await canvas.drawRectangle(0.3, 0.3, 0.2, 0.15);
    await page.waitForTimeout(300);

    const dragRectId = await page.evaluate(() => {
      const win = window as any;
      const store = win.__TEST_STORE__ || win._storyAppStore;
      const st = store.getState();
      const slide = st.slides?.[st.editor.activeSlideId];
      const order = slide?.elementOrder ?? [];
      return order[order.length - 1] ?? null;
    });
    expect(dragRectId).toBeTruthy();

    await editor.setActiveTool('select');
    await ensureNoSelection(page);
    const dragTotal = warmupIterations + perMetricIterations;
    for (let i = 0; i < dragTotal; i++) {
      // Compute the element's actual on-screen center (drag loop moves it).
      const center = await page.evaluate((id) => {
        const win = window as any;
        const app = win.app;
        const cm = app?.canvasManager;
        const store = win.__TEST_STORE__ || win._storyAppStore;
        const st = store.getState();
        const slide = st.slides?.[st.editor.activeSlideId];
        const el = slide?.elements?.[id];
        if (!cm || !el) return null;

        const rect = cm.container.getBoundingClientRect();
        const zoom = st.editor.zoom;
        const pan = st.editor.pan;

        const mouseX = (el.x + el.width / 2) * zoom + pan.x;
        const mouseY = (el.y + el.height / 2) * zoom + pan.y;

        return { x: rect.left + mouseX, y: rect.top + mouseY };
      }, dragRectId);
      expect(center).toBeTruthy();

      // Ensure the element is selected (but don't include selection latency in this metric).
      await page.mouse.click((center as any).x, (center as any).y);
      await page.waitForTimeout(100);

      const selected = await page.evaluate((id) => {
        const win = window as any;
        const store = win.__TEST_STORE__ || win._storyAppStore;
        const sel = store.getState()?.editor?.selectedElementIds ?? [];
        return Array.isArray(sel) && sel.includes(id);
      }, dragRectId);
      expect(selected).toBe(true);

      const p = page.evaluate(({ elementId }) => (window as any).__bench.measureDragStart(elementId), { elementId: dragRectId });

      // Perform a visible, frame-spanning drag.
      await page.mouse.move((center as any).x, (center as any).y);
      await page.mouse.down();
      await page.waitForTimeout(50);
      await page.mouse.move((center as any).x + 120, (center as any).y + 80, { steps: 10 });
      await page.waitForTimeout(50);
      await page.mouse.up();
      await page.waitForTimeout(100);

      let ms: number | null = null;
      let details: any = null;
      try {
        const r = (await withTimeout(p as any, 6000, 'drag_start')) as any;
        ms = Number(r?.durationMs);
        details = r;
      } catch (e) {
        // This suite is explicitly non-gating; capture what we can and continue.
        console.log('[perf:bench] drag_start measurement failed; continuing:', (e as any)?.message ?? e);
      }

      if (i < warmupIterations) continue;
      if (typeof ms === 'number' && Number.isFinite(ms) && ms > 0) {
        writeBenchResult({
          metricId: 'drag.start.latency_ms',
          scenarioId: 'drag.simple_shape',
          unit: 'ms',
          value: ms,
          details: {
            iteration: i - warmupIterations,
            reason: details?.reason ?? null,
            interactionState: details?.interactionState ?? null,
            note: 'Provisional end condition: interaction start detected via canvasManager interactionState, ui.isInteracting, or element position change.',
          },
        });
      }
    }

    // === Scenario: typing.simple_text ===
    console.log('[perf:bench] scenario typing.simple_text');
    await editor.setActiveTool('text');
    await canvas.clickAt(0.3, 0.3);
    const editable = page.locator('#slide-content [contenteditable="true"]');
    await expect(editable).toBeVisible();

    // Avoid Playwright click retries when the interaction canvas intercepts pointer events.
    await editable.evaluate((el) => (el as HTMLElement).focus());

    const textId = await page.evaluate(() => {
      const win = window as any;
      const store = win.__TEST_STORE__ || win._storyAppStore;
      const st = store.getState();
      const slide = st.slides?.[st.editor.activeSlideId];
      const order = slide?.elementOrder ?? [];
      return order[order.length - 1] ?? null;
    });
    expect(textId).toBeTruthy();

    const typingTotal = warmupIterations + perMetricIterations;
    for (let i = 0; i < typingTotal; i++) {
      await editable.evaluate((el) => (el as HTMLElement).focus());
      const p = page.evaluate(({ elementId }) => (window as any).__bench.measureTyping(elementId), { elementId: textId });
      await page.keyboard.type('a');

      let ms: number | null = null;
      try {
        const r = (await withTimeout(p as any, 5000, 'typing')) as any;
        ms = Number(r?.durationMs);
      } catch (e) {
        console.log('[perf:bench] typing measurement failed; continuing:', (e as any)?.message ?? e);
      }

      if (i < warmupIterations) continue;
      if (typeof ms === 'number' && Number.isFinite(ms) && ms > 0) {
        writeBenchResult({
          metricId: 'typing.latency_ms',
          scenarioId: 'typing.simple_text',
          unit: 'ms',
          value: ms,
          details: { iteration: i - warmupIterations, note: 'Provisional end condition: [contenteditable=true] DOM mutates after a typed character.' },
        });
      }
    }
    await exitTextEditIfNeeded();

    // === Scenario: slide_switch.typical_deck ===
    console.log('[perf:bench] scenario slide_switch.typical_deck');
    await page.evaluate(() => {
      const win = window as any;
      const store = win.__TEST_STORE__ || win._storyAppStore;
      const st = store.getState();
      const existing = Array.isArray(st.slideOrder) ? st.slideOrder.length : 0;
      const need = 20 - existing;
      for (let i = 0; i < need; i++) store.dispatch('ADD_SLIDE');
    });

    await expect(page.locator('[data-testid="slide-thumbnail-0"]')).toBeVisible();
    await expect(page.locator('[data-testid="slide-thumbnail-1"]')).toBeVisible();

    // Alternate between slide 0 and 1 using slideOrder mapping.
    const slideTotal = warmupIterations + perMetricIterations;
    for (let i = 0; i < slideTotal; i++) {
      const targetIdx = i % 2 === 0 ? 1 : 0;
      const expectedId = await page.evaluate((idx) => {
        const win = window as any;
        const store = win.__TEST_STORE__ || win._storyAppStore;
        const st = store.getState();
        return st.slideOrder?.[idx] ?? null;
      }, targetIdx);

      expect(expectedId).toBeTruthy();
      const p = page.evaluate(({ idx, expected }) => (window as any).__bench.measureSlideSwitch(`slide-thumbnail-${idx}`, expected), {
        idx: targetIdx,
        expected: expectedId,
      });
      await page.locator(`[data-testid="slide-thumbnail-${targetIdx}"]`).click();
      const r = (await withTimeout(p as any, 5000, 'slide_switch')) as any;
      const ms = Number(r?.durationMs);
      if (i < warmupIterations) continue;
      writeBenchResult({
        metricId: 'slide_switch.latency_ms',
        scenarioId: 'slide_switch.typical_deck',
        unit: 'ms',
        value: ms,
        details: { iteration: i - warmupIterations, note: 'Provisional end condition: store.editor.activeSlideId changes to the target.' },
      });
      expect(ms).toBeGreaterThan(0);
    }

    // === Scenario: theme_switch.typical_deck ===
    console.log('[perf:bench] scenario theme_switch.typical_deck');
    const themeTotal = warmupIterations + perMetricIterations;
    for (let i = 0; i < themeTotal; i++) {
      const toLight = i % 2 === 0;
      const actionId = toLight ? 'theme-light' : 'theme-dark';
      const expectedAttr = toLight ? 'light' : null;
      const r = (await withTimeout(page.evaluate(
        ({ actionId, expectedAttr }) => (window as any).__bench.measureThemeSwitch(actionId, expectedAttr),
        { actionId, expectedAttr }
      ) as any, 7000, 'theme_switch')) as any;
      const ms = Number(r?.durationMs);
      if (i < warmupIterations) continue;
      writeBenchResult({
        metricId: 'theme_switch.latency_ms',
        scenarioId: 'theme_switch.typical_deck',
        unit: 'ms',
        value: ms,
        details: { iteration: i - warmupIterations, note: 'Provisional end condition: documentElement data-theme updates after menu action; measured through next rAF.' },
      });
      expect(ms).toBeGreaterThan(0);
    }

    // === Scenario: idle.typical (steady frames) ===
    for (let i = 0; i < warmupIterations + cappedFrameIterations; i++) {
      const deltas = await page.evaluate(() => (window as any).__bench.collectFramesForMs(1000));
      const p95 = await page.evaluate((arr) => (window as any).__bench.p95(arr), deltas);
      const ms = p95 == null ? null : Number(p95);
      if (i < warmupIterations) continue;
      if (ms != null) {
        writeBenchResult({
          metricId: 'frame.steady.p95_ms',
          scenarioId: 'idle.typical',
          unit: 'ms',
          value: ms,
          details: { iteration: i - warmupIterations, windowMs: 1000, note: 'Provisional: rAF delta p95 over an idle 1s window.' },
        });
      }
    }

    // === Scenario: render.simple_slide / render.complex_slide ===
    console.log('[perf:bench] scenario render.simple_slide');
    for (let i = 0; i < warmupIterations + Math.min(measuredIterations, 10); i++) {
      await editor.dispatchAction('UPDATE_VIEWPORT', { pan: { x: i + 1, y: i + 1 } });
      const r = await page.evaluate(() => (window as any).__bench.measureRenderOnce());
      const ms = Number(r?.durationMs);
      if (i < warmupIterations) continue;
      writeBenchResult({
        metricId: 'render.simple_slide.p95_ms',
        scenarioId: 'render.simple_slide',
        unit: 'ms',
        value: ms,
        details: { iteration: i - warmupIterations, note: 'Provisional: duration of app.currentRenderer.render() on a pan update (simple content).' },
      });
      expect(ms).toBeGreaterThan(0);
    }

    const complexSlideSetup = await page.evaluate(() => {
      const win = window as any;
      const store = win.__TEST_STORE__ || win._storyAppStore;
      store.dispatch('ADD_SLIDE');
      const st = store.getState();
      const complexId = st.slideOrder[st.slideOrder.length - 1];
      store.dispatch('SET_ACTIVE_SLIDE', complexId);

      const baseX = 100;
      const baseY = 100;
      const cols = 20;
      const rows = 10;
      let n = 0;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          n++;
          const id = `bench-heavy-${n}`;
          store.dispatch('ADD_ELEMENT', {
            id,
            type: 'shape',
            shapeKind: 'rectangle',
            x: baseX + c * 40,
            y: baseY + r * 30,
            width: 30,
            height: 20,
            rotation: 0,
            style: { fills: [{ type: 'solid', value: '#000000', opacity: 100, visible: true }] },
          });
        }
      }
      return { complexId, elementCount: n };
    });

    expect(complexSlideSetup?.elementCount).toBeGreaterThan(0);

    console.log('[perf:bench] scenario render.complex_slide');
    for (let i = 0; i < warmupIterations + Math.min(measuredIterations, 10); i++) {
      await editor.dispatchAction('UPDATE_VIEWPORT', { pan: { x: 100 + i, y: 100 + i } });
      const r = await page.evaluate(() => (window as any).__bench.measureRenderOnce());
      const ms = Number(r?.durationMs);
      if (i < warmupIterations) continue;
      writeBenchResult({
        metricId: 'render.complex_slide.p95_ms',
        scenarioId: 'render.complex_slide',
        unit: 'ms',
        value: ms,
        details: { iteration: i - warmupIterations, elementCount: complexSlideSetup.elementCount, note: 'Provisional: duration of app.currentRenderer.render() on a pan update (heavy content).' },
      });
      expect(ms).toBeGreaterThan(0);
    }

    // === Scenario: startup.warm ===
    console.log('[perf:bench] scenario startup.warm');
    {
      const startupPage = await context.newPage();
      const startupEditor = new EditorPage(startupPage);
      await startupEditor.goto();
      await startupEditor.waitForLoad();

      const ttiMs = await startupPage.evaluate(() => performance.now());
      const firstFrameMs = await startupPage.evaluate(
        () =>
          new Promise<number>((resolve) => {
            requestAnimationFrame(() => resolve(performance.now()));
          })
      );

      writeBenchResult({
        metricId: 'startup.tti_ms',
        scenarioId: 'startup.warm',
        unit: 'ms',
        value: Number(ttiMs),
        details: { note: 'Provisional: performance.now() when editor is usable (boot-screen hidden, toolbar/canvas visible).' },
      });

      writeBenchResult({
        metricId: 'startup.first_frame_ms',
        scenarioId: 'startup.warm',
        unit: 'ms',
        value: Number(firstFrameMs),
        details: { note: 'Provisional: first rAF timestamp after editor is usable.' },
      });

      await startupPage.close();
    }

    // === Scenario: soak.60min (scaled-down placeholder) ===
    {
      const client = await context.newCDPSession(page);
      const heapStart = await page.evaluate(() => {
        const mem = (performance as any).memory;
        return mem?.usedJSHeapSize ?? null;
      });
      const domStart = await client.send('Memory.getDOMCounters');

      await page.evaluate(() => {
        const win = window as any;
        const store = win.__TEST_STORE__ || win._storyAppStore;
        const slideId = store.getState().editor.activeSlideId;
        const base = 50;
        for (let i = 0; i < 50; i++) {
          const id = `bench-soak-${i}`;
          store.dispatch('ADD_ELEMENT', {
            id,
            type: 'shape',
            shapeKind: 'rectangle',
            x: base + i,
            y: base + i,
            width: 10,
            height: 10,
            rotation: 0,
            style: { fills: [{ type: 'solid', value: '#000000', opacity: 100, visible: true }] },
          });
          store.dispatch('REMOVE_ELEMENT', id);
        }
        store.dispatch('UPDATE_SELECTION', []);
        store.dispatch('SET_ACTIVE_SLIDE', slideId);
      });

      try {
        await client.send('HeapProfiler.collectGarbage');
      } catch {
        // Best-effort.
      }

      const heapEnd = await page.evaluate(() => {
        const mem = (performance as any).memory;
        return mem?.usedJSHeapSize ?? null;
      });
      const domEnd = await client.send('Memory.getDOMCounters');

      const heapDeltaMb =
        typeof heapStart === 'number' && typeof heapEnd === 'number' ? (heapEnd - heapStart) / (1024 * 1024) : 0;

      const nodeDelta =
        typeof domStart?.nodes === 'number' && typeof domEnd?.nodes === 'number' ? domEnd.nodes - domStart.nodes : 0;

      writeBenchResult({
        metricId: 'memory.heap_delta_mb',
        scenarioId: 'soak.60min',
        unit: 'mb',
        value: Number(heapDeltaMb),
        details: {
          note: 'Scaled-down placeholder (not 60min). Uses performance.memory.usedJSHeapSize delta (after best-effort GC).',
          samples: { heapStart, heapEnd },
        },
      });

      writeBenchResult({
        metricId: 'memory.detached_nodes',
        scenarioId: 'soak.60min',
        unit: 'count',
        value: Number(nodeDelta),
        details: {
          note: 'Scaled-down placeholder. Uses CDP Memory.getDOMCounters.nodes delta as a proxy (not true detached nodes).',
          samples: { domStart, domEnd },
        },
      });
    }
  });
});
