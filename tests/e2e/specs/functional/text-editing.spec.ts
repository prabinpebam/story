import { test, expect } from '@playwright/test';
import { EditorPage } from '../../pages/EditorPage';
import { CanvasHelper } from '../../pages/CanvasHelper';

async function getPointForSubstring(
  page: any,
  elementSelector: string,
  substring: string
): Promise<{ x: number; y: number }> {
  return await page.evaluate(({ elementSelector, substring }) => {
    const el = document.querySelector(elementSelector) as HTMLElement | null;
    if (!el) throw new Error(`Element not found: ${elementSelector}`);

    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    let node: Text | null = walker.nextNode() as Text | null;
    while (node) {
      const text = node.nodeValue || '';
      const idx = text.indexOf(substring);
      if (idx >= 0) {
        const range = document.createRange();
        range.setStart(node, idx);
        range.setEnd(node, idx + substring.length);
        const rect = range.getClientRects()[0] || range.getBoundingClientRect();
        if (!rect || rect.width === 0 || rect.height === 0) {
          break;
        }
        return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      }
      node = walker.nextNode() as Text | null;
    }

    const rect = el.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  }, { elementSelector, substring });
}

test.describe('Text Editing Scenarios', () => {
  let editor: EditorPage;
  let canvas: CanvasHelper;

  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    canvas = new CanvasHelper(page);
    
    await editor.goto();
    await editor.waitForLoad();
  });

  test('T01: Create text element via tool', async ({ page }) => {
    await editor.setActiveTool('text');
    await canvas.clickAt(0.3, 0.3);
    const textInput = page.locator('#slide-content [contenteditable="true"]');
    await expect(textInput).toBeVisible();
    await canvas.typeText('Hello');
    await canvas.clickAt(0.5, 0.5); // Commit
    await expect(page.locator('#slide-content')).toContainText('Hello');
  });

  test('T02: Enter edit mode (Double click)', async ({ page }) => {
    // Setup: Create text
    await editor.setActiveTool('text');
    await canvas.clickAt(0.3, 0.3);
    await canvas.typeText('Original');
    await canvas.clickAt(0.5, 0.5); // Commit
    await expect(page.locator('#slide-content')).toContainText('Original');
    
    await editor.setActiveTool('select');

    // Enter edit mode deterministically via the store (mirrors what CanvasManager does on double-click).
    const originalText = page.locator('#slide-content .slide-element', { hasText: 'Original' }).first();
    const box = await originalText.boundingBox();
    if (!box) throw new Error('Original text element has no bounding box');
    const elementId = await originalText.getAttribute('data-element-id');
    if (!elementId) throw new Error('Original text element missing data-element-id');

    await page.evaluate(({ elementId, clientX, clientY }) => {
      const store = (window as any).__TEST_STORE__ || (window as any)._storyAppStore;
      store.dispatch('SET_EDITING_ELEMENT', {
        id: elementId,
        selectionType: 'caret',
        clickPosition: { clientX, clientY }
      });
    // Intentionally place caret near the right edge so typing appends.
    }, { elementId, clientX: box.x + box.width - 2, clientY: box.y + box.height / 2 });
    
    // Verify input appears
    await expect(originalText).toHaveAttribute('data-editing', 'true');
    await expect(originalText).toHaveAttribute('contenteditable', 'true');
    
    // Verify we can edit (caret should land at/near click position, not always end)
    await canvas.typeText('Edited');
    await canvas.clickAt(0.1, 0.1);
    const updated = page.locator(`#slide-content .slide-element[data-element-id="${elementId}"]`);
    await expect(updated).toContainText('Edited');
    await expect
      .poll(async () => {
        const t = (await updated.textContent()) || '';
        return t.replace('Edited', '');
      })
      .toBe('Original');
  });

  test('T02b: Typing while selected does NOT enter edit mode (shortcuts remain usable)', async ({ page }) => {
    // Setup: Create text
    await editor.setActiveTool('text');
    await canvas.clickAt(0.3, 0.3);
    await canvas.typeText('Shortcut Target');
    await canvas.clickAt(0.5, 0.5); // Commit
    await expect(page.locator('#slide-content')).toContainText('Shortcut Target');

    await editor.setActiveTool('select');
    const textEl = page.locator('#slide-content .slide-element', { hasText: 'Shortcut Target' }).first();
    const elementId = await textEl.getAttribute('data-element-id');
    if (!elementId) throw new Error('Shortcut Target text element missing data-element-id');

    // Select the element via store.
    await page.evaluate((id) => {
      const store = (window as any).__TEST_STORE__ || (window as any)._storyAppStore;
      store.dispatch('UPDATE_SELECTION', [id]);
    }, elementId);

    const before = await editor.getState();
    const beforeCount = Object.keys(before.slides[before.editor.activeSlideId].elements || {}).length;

    // Typing should NOT enter edit mode.
    await page.keyboard.press('x');
    await expect(textEl).not.toHaveAttribute('contenteditable', 'true');
    await expect(textEl).not.toHaveAttribute('data-editing', 'true');

    // Shortcuts should still work (duplicate selected element).
    const modifier = process.platform === 'darwin' ? 'Meta' : 'Control';
    await page.keyboard.press(`${modifier}+D`);

    await expect
      .poll(async () => {
        const after = await editor.getState();
        return Object.keys(after.slides[after.editor.activeSlideId].elements || {}).length;
      })
      .toBe(beforeCount + 1);
  });

  test('T02c: Enter enters edit mode (select-all); double-click enters edit mode (caret only)', async ({ page }) => {
    // Setup: Create text
    await editor.setActiveTool('text');
    await canvas.clickAt(0.35, 0.35);
    await canvas.typeText('Select All Check');
    await canvas.clickAt(0.1, 0.1); // Commit
    await editor.setActiveTool('select');

    const textEl = page.locator('#slide-content .slide-element', { hasText: 'Select All Check' }).first();
    await expect(textEl).toBeVisible();
    const elementId = await textEl.getAttribute('data-element-id');
    if (!elementId) throw new Error('Select All Check text element missing data-element-id');

    await page.evaluate((id) => {
      const store = (window as any).__TEST_STORE__ || (window as any)._storyAppStore;
      store.dispatch('UPDATE_SELECTION', [id]);
    }, elementId);

    // Enter: select all
    await page.keyboard.press('Enter');
    await expect(textEl).toHaveAttribute('contenteditable', 'true');
    await editor.waitForTextEditingSelectionState({ mode: 'selectAll', elementId });
    const enterSelection = await page.evaluate((id) => {
      const el = document.querySelector(`#slide-content .slide-element[data-element-id="${id}"]`) as HTMLElement | null;
      if (!el) throw new Error('Element not found for selection check');
      const sel = window.getSelection();
      return {
        selected: sel?.toString() || '',
        isCollapsed: !!sel?.isCollapsed,
        fullText: el.textContent || ''
      };
    }, elementId);
    expect(enterSelection.isCollapsed).toBe(false);
    expect(enterSelection.selected).toBe(enterSelection.fullText);

    // Exit edit mode
    const modifier = process.platform === 'darwin' ? 'Meta' : 'Control';
    await page.keyboard.press(`${modifier}+Enter`);
    await expect(textEl).not.toHaveAttribute('contenteditable', 'true');

    // Double click: caret only (no select-all)
    const box = await textEl.boundingBox();
    if (!box) throw new Error('Text element has no bounding box');
    await page.mouse.dblclick(box.x + box.width / 2, box.y + box.height / 2);
    await expect(textEl).toHaveAttribute('contenteditable', 'true');
    await editor.waitForTextEditingSelectionState({ mode: 'caret', elementId });
    const dblSelection = await page.evaluate((id) => {
      const el = document.querySelector(`#slide-content .slide-element[data-element-id="${id}"]`) as HTMLElement | null;
      if (!el) throw new Error('Element not found for selection check');
      const sel = window.getSelection();
      return {
        selected: sel?.toString() || '',
        isCollapsed: !!sel?.isCollapsed,
        fullText: el.textContent || ''
      };
    }, elementId);
    expect(dblSelection.isCollapsed).toBe(true);
    expect(dblSelection.selected).not.toBe(dblSelection.fullText);
  });

  test('T02d: Double-click caret lands at closest click position (DOM validated)', async ({ page }) => {
    // Use a content string without spaces to avoid word-selection ambiguity.
    await editor.setActiveTool('text');
    await canvas.clickAt(0.35, 0.35);
    await canvas.typeText('ABCDEFGHIJ');
    await canvas.clickAt(0.1, 0.1); // Commit
    await editor.setActiveTool('select');

    const textEl = page.locator('#slide-content .slide-element', { hasText: 'ABCDEFGHIJ' }).first();
    await expect(textEl).toBeVisible();
    const elementId = await textEl.getAttribute('data-element-id');
    if (!elementId) throw new Error('Caret validation: text element missing data-element-id');

    const stableEl = page.locator(`#slide-content .slide-element[data-element-id="${elementId}"]`);
    const box = await textEl.boundingBox();
    if (!box) throw new Error('Text element has no bounding box');

    // Pick a point near the start (should not resolve to end).
    const clickX = box.x + Math.min(8, box.width * 0.15);
    const clickY = box.y + box.height / 2;
    await page.mouse.dblclick(clickX, clickY);
    await expect(stableEl).toHaveAttribute('contenteditable', 'true');

    // DOM validation: selection should match caretRangeFromPoint for the same point
    // (with interaction-canvas pointer-events disabled, same as production code).
    await expect
      .poll(async () => {
        return await page.evaluate(({ clickX, clickY, elementSelector }) => {
          const el = document.querySelector(elementSelector) as HTMLElement | null;
          if (!el) return { ok: false, reason: 'el-missing' };

          const sel = window.getSelection();
          if (!sel || sel.rangeCount === 0) return { ok: false, reason: 'no-selection' };
          const actual = sel.getRangeAt(0);

          const canvas = document.getElementById('interaction-canvas') as HTMLElement | null;
          const prev = canvas ? canvas.style.pointerEvents : null;
          if (canvas) canvas.style.pointerEvents = 'none';

          let expected: Range | null = null;
          if ((document as any).caretRangeFromPoint) {
            expected = (document as any).caretRangeFromPoint(clickX, clickY);
          } else if ((document as any).caretPositionFromPoint) {
            const pos = (document as any).caretPositionFromPoint(clickX, clickY);
            if (pos) {
              expected = document.createRange();
              expected.setStart(pos.offsetNode, pos.offset);
              expected.collapse(true);
            }
          }

          if (canvas && prev !== null) canvas.style.pointerEvents = prev;

          if (!expected) return { ok: false, reason: 'no-expected-range' };
          if (!el.contains(expected.startContainer)) return { ok: false, reason: 'expected-not-in-el' };
          if (!el.contains(actual.startContainer)) return { ok: false, reason: 'actual-not-in-el' };

          return {
            ok: expected.startContainer === actual.startContainer && expected.startOffset === actual.startOffset,
            expectedOffset: expected.startOffset,
            actualOffset: actual.startOffset
          };
        }, {
          clickX,
          clickY,
          elementSelector: `#slide-content .slide-element[data-element-id="${elementId}"][contenteditable="true"]`
        });
      })
      .toMatchObject({ ok: true });

    // Behavioral validation: inserted char should appear near the start, not appended.
    await page.keyboard.type('X');
    const finalText = await stableEl.textContent();
    if (!finalText) throw new Error('Missing text content after typing');
    expect(finalText.includes('X')).toBe(true);
    expect(finalText.lastIndexOf('X')).toBeLessThanOrEqual(3);
  });

  test('T02e: In edit mode, double-click selects word (native browser behavior)', async ({ page }) => {
    await editor.setActiveTool('text');
    await canvas.clickAt(0.35, 0.35);
    await canvas.typeText('alpha bravo charlie');
    await canvas.clickAt(0.1, 0.1); // Commit
    await editor.setActiveTool('select');

    const textEl = page.locator('#slide-content .slide-element', { hasText: 'alpha bravo charlie' }).first();
    await expect(textEl).toBeVisible();

    const box = await textEl.boundingBox();
    if (!box) throw new Error('Text element has no bounding box');

    // Enter edit mode via canvas/object-mode double click.
    await page.mouse.dblclick(box.x + box.width / 2, box.y + box.height / 2);
    await expect(textEl).toHaveAttribute('contenteditable', 'true');

    // On entry, we expect caret-only (collapsed selection).
    const entrySelection = await page.evaluate(() => {
      const sel = window.getSelection();
      return { isCollapsed: !!sel?.isCollapsed, selected: sel?.toString() || '' };
    });
    expect(entrySelection.isCollapsed).toBe(true);

    // Native dblclick inside contenteditable should select a word.
    const elementId = await textEl.getAttribute('data-element-id');
    if (!elementId) throw new Error('Text element missing data-element-id');
    const selector = `#slide-content .slide-element[data-element-id="${elementId}"][contenteditable="true"]`;
    const { x, y } = await getPointForSubstring(page, selector, 'bravo');
    await page.mouse.dblclick(x, y);

    const selectedWord = await page.evaluate(() => {
      const sel = window.getSelection();
      return { isCollapsed: !!sel?.isCollapsed, selected: (sel?.toString() || '').trim() };
    });
    expect(selectedWord.isCollapsed).toBe(false);
    expect(selectedWord.selected).toBe('bravo');
  });

  test('T02f: In edit mode, triple-click selects paragraph/line (native browser behavior)', async ({ page }) => {
    await editor.setActiveTool('text');
    await canvas.clickAt(0.35, 0.35);
    await canvas.typeText('delta echo foxtrot');
    await canvas.clickAt(0.1, 0.1); // Commit
    await editor.setActiveTool('select');

    const textEl = page.locator('#slide-content .slide-element', { hasText: 'delta echo foxtrot' }).first();
    await expect(textEl).toBeVisible();

    const box = await textEl.boundingBox();
    if (!box) throw new Error('Text element has no bounding box');

    // Enter edit mode.
    await page.mouse.dblclick(box.x + box.width / 2, box.y + box.height / 2);
    await expect(textEl).toHaveAttribute('contenteditable', 'true');

    const elementId = await textEl.getAttribute('data-element-id');
    if (!elementId) throw new Error('Text element missing data-element-id');
    const selector = `#slide-content .slide-element[data-element-id="${elementId}"][contenteditable="true"]`;
    const { x, y } = await getPointForSubstring(page, selector, 'echo');

    // Triple click should select the whole paragraph/line in a single-paragraph text box.
    await page.mouse.click(x, y, { clickCount: 3 });

    const selectionState = await page.evaluate((selector) => {
      const el = document.querySelector(selector) as HTMLElement | null;
      const sel = window.getSelection();
      const normalize = (s: string) => s.replace(/\s+/g, ' ').trim();
      return {
        selected: normalize(sel?.toString() || ''),
        fullText: normalize(el?.textContent || ''),
        isCollapsed: !!sel?.isCollapsed
      };
    }, selector);

    expect(selectionState.isCollapsed).toBe(false);
    expect(selectionState.selected).toBe(selectionState.fullText);
  });

  test('T03: Type text content', async ({ page }) => {
    await editor.setActiveTool('text');
    await canvas.clickAt(0.4, 0.4);
    await canvas.typeText('Typing Test');
    const textInput = page.locator('#slide-content [contenteditable="true"]');
    await expect(textInput).toBeVisible();
  });

  test('T05: Commit text changes (Click outside)', async ({ page }) => {
    await editor.setActiveTool('text');
    await canvas.clickAt(0.4, 0.4);
    await canvas.typeText('Commit Click');
    await canvas.clickAt(0.1, 0.1);
    await expect(page.locator('#slide-content [contenteditable="true"]')).not.toBeVisible();
    await expect(page.locator('#slide-content')).toContainText('Commit Click');
  });

  test('T06: Commit text changes (Cmd+Enter)', async ({ page }) => {
    await editor.setActiveTool('text');
    await canvas.clickAt(0.4, 0.4);
    await canvas.typeText('Commit Shortcut');
    const modifier = process.platform === 'darwin' ? 'Meta' : 'Control';
    await page.keyboard.press(`${modifier}+Enter`);
    await expect(page.locator('#slide-content [contenteditable="true"]')).not.toBeVisible();
    await expect(page.locator('#slide-content')).toContainText('Commit Shortcut');
  });

  test('T07: Cancel text changes (Esc)', async ({ page }) => {
    // Case 1: Cancel creation
    await editor.setActiveTool('text');
    await canvas.clickAt(0.2, 0.2);
    await canvas.typeText('To Be Cancelled');
    await page.keyboard.press('Escape');
    
    // Should revert creation (disappear)
    await expect(page.locator('#slide-content [contenteditable="true"]')).not.toBeVisible();
    await expect(page.locator('#slide-content')).not.toContainText('To Be Cancelled');

    // Case 2: Cancel edit
    await editor.setActiveTool('text');
    await canvas.clickAt(0.5, 0.5);
    await canvas.typeText('Saved');
    await canvas.clickAt(0.1, 0.1); // Commit
    
    // Edit again
    const savedText = page.locator('#slide-content .slide-element', { hasText: 'Saved' });
    const box = await savedText.boundingBox();
    if (box) {
        await page.mouse.dblclick(box.x + box.width / 2, box.y + box.height / 2);
    }
    
    await canvas.typeText(' Unsaved');
    await page.keyboard.press('Escape');
    
    // Should revert to 'Saved'
    await expect(page.locator('#slide-content')).toContainText('Saved');
    await expect(page.locator('#slide-content')).not.toContainText('Unsaved');
  });

  test('T08: Delete empty text element on commit', async ({ page }) => {
    await editor.setActiveTool('text');
    await canvas.clickAt(0.6, 0.6);
    // Don't type anything
    await canvas.clickAt(0.1, 0.1); // Commit
    
    // Should not exist (back to initial 2 elements)
    const elements = page.locator('#slide-content .slide-element');
    await expect(elements).toHaveCount(2);
  });

  test('T14-T16: Typography Properties', async ({ page }) => {
    await editor.setActiveTool('text');
    await canvas.clickAt(0.4, 0.4);
    await canvas.typeText('Font Props');
    await canvas.clickAt(0.1, 0.1);
    
    await editor.setActiveTool('select');
    const textElement = page.locator('#slide-content .slide-element').filter({ hasText: 'Font Props' }).first();
    await expect(textElement).toBeVisible();

    // Select the element via store (canvas intercepts pointer events)
    await page.evaluate(() => {
      const store = (window as any)._storyAppStore || (window as any).__TEST_STORE__;
      const state = store.getState();
      const slide = state.slides[state.editor.activeSlideId];
      const match = Object.values(slide.elements || {}).find((el: any) =>
        el?.type === 'text' && String(el?.text || el?.content || '').includes('Font Props')
      ) as any;
      if (!match) throw new Error('Could not find text element for typography test');
      store.dispatch('UPDATE_SELECTION', [match.id]);
    });

    // Ensure Property Inspector is visible
    await page.evaluate(() => {
      window.__PANEL_MANAGER__?.show?.('propertyInspector');
    });
    
    const pi = page.locator('[data-testid="property-inspector"]');
    await expect(pi).toBeVisible();
    
    // T16: Font Size
    const fontSizeInput = pi.locator('[data-testid="font-size-input"] input.pi-input');
    await expect(fontSizeInput).toBeVisible();
    await fontSizeInput.fill('48');
    await fontSizeInput.press('Enter');
    await expect(textElement).toHaveCSS('font-size', '48px');

    // T15: Font Weight
    const fontWeightDropdown = pi.locator('[data-testid="font-weight-select"]');
    await fontWeightDropdown.click();
    await page.getByText('Bold', { exact: true }).click();
    await expect(textElement).toHaveCSS('font-weight', '700');

    // T16: Color
    const elementId = await textElement.getAttribute('data-element-id');
    if (!elementId) throw new Error('Typography test: text element missing data-element-id');

    await expect(editor.textColorHex).toBeVisible();
    await editor.textColorHex.fill('#00FF00');
    await editor.textColorHex.press('Enter');

    await expect
      .poll(async () => {
        const state = await editor.getState();
        const slide = state.slides[state.editor.activeSlideId];
        const el = slide.elements?.[elementId];
        return el?.textFill?.value;
      })
      .toBe('#00FF00');
  });
});
