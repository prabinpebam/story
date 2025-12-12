import { test, expect } from '@playwright/test';
import { EditorPage } from '../../pages/EditorPage';

test.describe('Layout reconciliation: detach + restore', () => {
  let editor: EditorPage;

  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    await editor.goto();
    await editor.waitForLoad();
    await editor.waitForFonts();
  });

  test('detaches unmapped placeholder content with origin and restores later', async ({ page }) => {
    const chosen = await page.evaluate(() => {
      const store = (window as any)._storyAppStore || (window as any).__TEST_STORE__;
      const state = store.getState();

      const layouts = (Object.values(state.slideMasterPresets || {}) as any[]).filter(
        (m: any) => m?.type === 'layoutMaster'
      );

      const hasPlaceholderType = (layout: any, type: string) => {
        return Object.values(layout.elements || {}).some((el: any) => el?.isPlaceholder && (el.placeholderType || 'content') === type);
      };

      const findPlaceholder = (layout: any, type: string) => {
        const els = Object.values(layout.elements || {}).filter((el: any) => el?.isPlaceholder && (el.placeholderType || 'content') === type);
        return els[0] || null;
      };

      const sourceLayout: any = layouts.find((l: any) => hasPlaceholderType(l, 'picture'));
      const targetLayout: any = layouts.find(
        (l: any) => l?.id !== sourceLayout?.id && !hasPlaceholderType(l, 'picture')
      );
      const restoreLayout: any = sourceLayout;

      if (!sourceLayout || !targetLayout) {
        return { ok: false };
      }

      const picturePh: any = findPlaceholder(sourceLayout, 'picture');
      if (!picturePh) {
        return { ok: false };
      }

      const slideId = state.editor.activeSlideId;

      // Set slide to the source layout first
      store.dispatch('UPDATE_SLIDE', { id: slideId, layoutId: sourceLayout.id });

      // Inject user content into the picture placeholder override
      const after = store.getState();
      const slide = after.slides[slideId];
      store.dispatch('UPDATE_SLIDE', {
        id: slideId,
        elements: {
          ...(slide.elements || {}),
          [picturePh.id]: {
            ...picturePh,
            content: 'User Picture Content',
            hasUserContent: true
          }
        },
        elementOrder: Array.from(new Set([...(slide.elementOrder || []), picturePh.id]))
      });

      // Change to target layout (no picture placeholders)
      store.dispatch('UPDATE_SLIDE', { id: slideId, layoutId: targetLayout.id });

      const mid = store.getState().slides[slideId];
      const detached: any = (Object.values(mid.elements || {}) as any[]).find(
        (el: any) => !el?.isPlaceholder && el?.origin?.placeholderType === 'picture'
      );

      // Change back to restore layout (has picture placeholder again)
      store.dispatch('UPDATE_SLIDE', { id: slideId, layoutId: restoreLayout.id });

      const fin = store.getState().slides[slideId];
      const restored = fin.elements?.[picturePh.id];
      const stillDetached: any = (Object.values(fin.elements || {}) as any[]).find(
        (el: any) => !el?.isPlaceholder && el?.origin?.placeholderType === 'picture'
      );

      return {
        ok: true,
        targetLayoutId: targetLayout.id,
        detachedOrigin: detached?.origin || null,
        detachedContent: detached?.content || null,
        restoredContent: restored?.content || null,
        stillDetached: !!stillDetached
      };
    });

    expect(chosen.ok).toBe(true);

    // Verify detach metadata exists and content preserved
    expect(chosen.detachedContent).toBe('User Picture Content');
    expect(chosen.detachedOrigin).toBeTruthy();
    expect(chosen.detachedOrigin.placeholderType).toBe('picture');
    expect(chosen.detachedOrigin.sourceLayoutId).toBeTruthy();
    expect(chosen.detachedOrigin.sourceMasterElementId).toBeTruthy();

    // Verify restored into placeholder when returning to layout with that placeholder type
    expect(chosen.restoredContent).toBe('User Picture Content');
    expect(chosen.stillDetached).toBe(false);
  });
});
