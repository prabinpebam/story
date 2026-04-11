/**
 * Eval Loop: Slide Notes (SNT-01 → SNT-08)
 */
import { expect } from '@playwright/test';
import { test } from '../../fixtures/base-test';
import { EditorPage } from '../../pages/EditorPage';
import {
  capture, waitForCanvasManager, assertNoCriticalAnomalies,
} from '../../helpers/eval-loop';

test.describe('Eval Loop: Slide Notes', () => {
  let editor: EditorPage;

  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    await editor.goto();
    await editor.waitForLoad();
    await waitForCanvasManager(page);
  });

  function getSlideNotes(page: import('@playwright/test').Page) {
    return page.evaluate(() => {
      const s = (window as any).__TEST_STORE__.getState();
      const slide = s.slides[s.editor.activeSlideId];
      return slide?.notesDoc ?? slide?.notes ?? null;
    });
  }

  // ─── SNT-01: Set slide notes via store ────────────────────────────────────
  test('SNT-01: Set slide notes via UPDATE_SLIDE', async ({ page }) => {
    const slideId = await page.evaluate(() => (window as any).__TEST_STORE__.getState().editor.activeSlideId);

    await page.evaluate(({ sid }) => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_SLIDE', {
        id: sid,
        notesDoc: {
          version: 1,
          blocks: [{ type: 'paragraph', content: '<p>Test speaker notes</p>' }],
        },
      });
    }, { sid: slideId });
    await page.waitForTimeout(200);

    const notes = await getSlideNotes(page);
    expect(notes).not.toBeNull();
    expect(notes.blocks[0].content).toContain('Test speaker notes');

    const snap = await capture(page, 'notes-set');
    assertNoCriticalAnomalies(snap);
  });

  // ─── SNT-02: Update existing notes ────────────────────────────────────────
  test('SNT-02: Update existing slide notes', async ({ page }) => {
    const slideId = await page.evaluate(() => (window as any).__TEST_STORE__.getState().editor.activeSlideId);

    // Set initial
    await page.evaluate(({ sid }) => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_SLIDE', {
        id: sid,
        notesDoc: { version: 1, blocks: [{ type: 'paragraph', content: '<p>Initial notes</p>' }] },
      });
    }, { sid: slideId });
    await page.waitForTimeout(100);

    // Update
    await page.evaluate(({ sid }) => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_SLIDE', {
        id: sid,
        notesDoc: { version: 1, blocks: [{ type: 'paragraph', content: '<p>Updated notes content</p>' }] },
      });
    }, { sid: slideId });
    await page.waitForTimeout(200);

    const notes = await getSlideNotes(page);
    expect(notes.blocks[0].content).toContain('Updated notes content');
  });

  // ─── SNT-03: Clear notes ──────────────────────────────────────────────────
  test('SNT-03: Clear slide notes', async ({ page }) => {
    const slideId = await page.evaluate(() => (window as any).__TEST_STORE__.getState().editor.activeSlideId);

    // Set then clear
    await page.evaluate(({ sid }) => {
      const store = (window as any).__TEST_STORE__;
      store.dispatch('UPDATE_SLIDE', {
        id: sid,
        notesDoc: { version: 1, blocks: [{ type: 'paragraph', content: '<p>Delete me</p>' }] },
      });
    }, { sid: slideId });
    await page.waitForTimeout(100);

    await page.evaluate(({ sid }) => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_SLIDE', {
        id: sid,
        notesDoc: null,
      });
    }, { sid: slideId });
    await page.waitForTimeout(200);

    const notes = await getSlideNotes(page);
    expect(!notes || notes === '' || notes === null).toBe(true);
  });

  // ─── SNT-04: Notes persist across slide switch ────────────────────────────
  test('SNT-04: Notes persist after switching slides', async ({ page }) => {
    const slideId = await page.evaluate(() => (window as any).__TEST_STORE__.getState().editor.activeSlideId);

    // Set notes on slide 1
    await page.evaluate(({ sid }) => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_SLIDE', {
        id: sid,
        notesDoc: { version: 1, blocks: [{ type: 'paragraph', content: '<p>Persistent notes</p>' }] },
      });
    }, { sid: slideId });
    await page.waitForTimeout(100);

    // Add a second slide and switch to it
    await page.evaluate(() => {
      (window as any).__TEST_STORE__.dispatch('ADD_SLIDE');
    });
    await page.waitForTimeout(200);

    // Switch back to first slide
    await page.evaluate(({ sid }) => {
      (window as any).__TEST_STORE__.dispatch('SET_ACTIVE_SLIDE', sid);
    }, { sid: slideId });
    await page.waitForTimeout(200);

    const notes = await getSlideNotes(page);
    expect(notes.blocks[0].content).toContain('Persistent notes');
  });

  // ─── Cross-cutting ────────────────────────────────────────────────────────
  test('Invariant: Notes operations maintain consistency', async ({ page }) => {
    const slideId = await page.evaluate(() => (window as any).__TEST_STORE__.getState().editor.activeSlideId);
    await page.evaluate(({ sid }) => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_SLIDE', {
        id: sid,
        notesDoc: { version: 1, blocks: [{ type: 'paragraph', content: '<p>Invariant check</p>' }] },
      });
    }, { sid: slideId });
    await page.waitForTimeout(200);

    const snap = await capture(page, 'notes-invariant');
    assertNoCriticalAnomalies(snap);
  });
});
