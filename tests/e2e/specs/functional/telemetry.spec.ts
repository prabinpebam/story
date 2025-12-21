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
    const secret = `PM_GATE9_SECRET_${Date.now()}_DO_NOT_LEAK`;

    // Seed a unique secret into slide content + notes, then ensure crash telemetry never includes it.
    await page.evaluate((secret) => {
      const store = (window as any).__TEST_STORE__;
      if (!store) throw new Error('Test store not exposed');
      const st = store.getState();
      const slideId = st?.editor?.activeSlideId;
      const slide = slideId ? st?.slides?.[slideId] : null;
      if (!slide) throw new Error('No active slide');

      const elId = Array.isArray(slide.elementOrder) ? slide.elementOrder[0] : null;
      if (elId) {
        store.dispatch('UPDATE_ELEMENT', {
          id: elId,
          content: `<p>${secret}</p>`
        });
      }

      store.dispatch('UPDATE_SLIDE', {
        id: slideId,
        notesDoc: {
          version: 1,
          blocks: [{
            type: 'paragraph',
            inlines: [{ type: 'text', text: secret }]
          }]
        }
      });

      // Configure the deterministic crash fixture (test-only). It will auto-trigger on presentation entry.
      (window as any).__PM_TEST_CRASH_FIXTURE = 'both';
      // Do NOT include the secret in the crash message/stack; it lives only in slide content/notes.
      (window as any).__PM_TEST_CRASH_MESSAGE = 'boom <script>ignored</script>';
      (window as any).__PM_TEST_CRASH_STACK = 'x'.repeat(6000);
    }, secret);

    await editor.startPresentation();

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

    const crashEvents = events.filter((e: any) => e?.type === 'crash');
    expect(crashEvents.length).toBeGreaterThan(0);
    for (const ev of crashEvents) {
      // End-to-end sanitization assertions.
      const msg = String(ev?.data?.message ?? '');
      const stack = String(ev?.data?.stack ?? '');
      expect(msg).not.toContain('<');
      expect(msg).not.toContain('>');
      expect(stack.length).toBeLessThanOrEqual(2000);
    }

    const json = JSON.stringify(events);
    expect(json.toLowerCase()).not.toContain('notes');
    expect(json.toLowerCase()).not.toContain('speaker');
    expect(json.toLowerCase()).not.toContain('deckcontent');
    expect(json.toLowerCase()).not.toContain('<script');
    expect(json).not.toContain(secret);
  });
});
