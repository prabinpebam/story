import { test, expect } from '../../fixtures/base-test';
import { EditorPage } from '../../pages/EditorPage';
import { PresentationPage } from '../../pages/PresentationPage';

test.describe('Telemetry (Gate 9)', () => {
  let editor: EditorPage;
  let presentation: PresentationPage;

  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    presentation = new PresentationPage(page);
    await editor.goto();
    await editor.waitForLoad();
  });

  test('emits presentation telemetry events without notes/content', async ({ page }) => {
    await editor.startPresentation();

    // Exercise a few presentation interactions.
    await presentation.next();
    await presentation.toggleGrid();
    await presentation.toggleGrid();
    await presentation.exitWithKeyboard();

    const events = await page.evaluate(() => {
      const dbg = (window as any).__TELEMETRY_DEBUG__;
      return dbg?.getEvents?.() ?? [];
    });

    expect(Array.isArray(events)).toBe(true);

    const types = events.map((e: any) => e?.type).filter(Boolean);
    expect(types).toContain('presentation.entered');
    expect(types).toContain('presentation.exited');

    // At least one KPI should be emitted.
    expect(types).toContain('performance.kpi');

    // Privacy: no notes/content-like keys should appear.
    const json = JSON.stringify(events);
    expect(json.toLowerCase()).not.toContain('notes');
    expect(json.toLowerCase()).not.toContain('speaker');
    expect(json.toLowerCase()).not.toContain('deckcontent');
    expect(json.toLowerCase()).not.toContain('<script');
  });

  test('emits privacy-safe crash events during presentation (error + unhandledrejection)', async ({ page }) => {
    await editor.startPresentation();

    // Trigger a synthetic ErrorEvent without actually crashing the page.
    await page.evaluate(() => {
      // Prevent the test harness from treating this as a hard page error.
      window.addEventListener('error', (ev) => {
        try { ev.preventDefault(); } catch { /* noop */ }
      }, { once: true });

      window.dispatchEvent(
        new ErrorEvent('error', {
          message: 'boom-error',
          error: new Error('boom-error')
        })
      );
    });

    // Trigger an unhandledrejection event *without* causing a Playwright pageerror.
    await page.evaluate(() => {
      // Prevent default so the browser doesn't surface this as an unhandled exception.
      window.addEventListener('unhandledrejection', (ev) => {
        try { ev.preventDefault(); } catch { /* noop */ }
      }, { once: true });

      const reason = new Error('boom-rejection');
      if (typeof (window as any).PromiseRejectionEvent === 'function') {
        window.dispatchEvent(new (window as any).PromiseRejectionEvent('unhandledrejection', { reason, promise: Promise.resolve() }));
      } else {
        const ev: any = new Event('unhandledrejection');
        ev.reason = reason;
        window.dispatchEvent(ev);
      }
    });

    await expect
      .poll(async () => {
        const events = await page.evaluate(() => {
          const dbg = (window as any).__TELEMETRY_DEBUG__;
          return dbg?.getEvents?.() ?? [];
        });
        const crashes = events.filter((e: any) => e?.type === 'crash');
        return crashes.map((c: any) => c?.data?.kind).filter(Boolean).sort().join(',');
      }, { timeout: 5000 })
      .toContain('error');

    await expect
      .poll(async () => {
        const events = await page.evaluate(() => {
          const dbg = (window as any).__TELEMETRY_DEBUG__;
          return dbg?.getEvents?.() ?? [];
        });
        const crashes = events.filter((e: any) => e?.type === 'crash');
        return crashes.map((c: any) => c?.data?.kind).filter(Boolean);
      }, { timeout: 5000 })
      .toContain('unhandledrejection');

    const events = await page.evaluate(() => {
      const dbg = (window as any).__TELEMETRY_DEBUG__;
      return dbg?.getEvents?.() ?? [];
    });

    const json = JSON.stringify(events);
    expect(json.toLowerCase()).not.toContain('notes');
    expect(json.toLowerCase()).not.toContain('speaker');
    expect(json.toLowerCase()).not.toContain('deckcontent');
    expect(json.toLowerCase()).not.toContain('<script');
  });
});
