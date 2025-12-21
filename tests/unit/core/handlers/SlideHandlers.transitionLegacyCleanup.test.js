import { describe, it, expect, beforeEach } from 'vitest';
import { store } from '../../../../src/core/Store.js';
import { historyManager } from '../../../../src/core/HistoryManager.js';
import { createInitialState } from '../../../../src/core/store/InitialState.js';

describe('SlideHandlers legacy transition cleanup', () => {
  beforeEach(() => {
    store.restoreState(createInitialState());
    historyManager.clear();
  });

  it('removes legacy slide.transition when updating styleAssignments.slideTransition (undo/redo safe)', () => {
    const slideId = store.getState().slideOrder[0];

    // Simulate a legacy slide.
    store.dispatch('UPDATE_SLIDE', {
      id: slideId,
      transition: 'slide',
      styleAssignments: undefined,
    });

    const before = store.getState();
    expect(before.slides[slideId].transition).toBe('slide');

    store.dispatch('UPDATE_SLIDE_STYLE_ASSIGNMENTS', {
      slideId,
      styleAssignments: {
        slideTransition: { type: 'cover', direction: 'right', durationMs: 300, easing: 'ease-in-out' },
      },
    });

    const after = store.getState();
    expect(after.slides[slideId].transition).toBeUndefined();
    expect(after.slides[slideId].styleAssignments.slideTransition).toEqual({
      type: 'cover',
      direction: 'right',
      durationMs: 300,
      easing: 'ease-in-out',
    });

    // Undo restores legacy state.
    store.dispatch('UNDO');
    const afterUndo = store.getState();
    expect(afterUndo.slides[slideId].transition).toBe('slide');

    // Redo re-applies cleanup.
    store.dispatch('REDO');
    const afterRedo = store.getState();
    expect(afterRedo.slides[slideId].transition).toBeUndefined();
  });
});
