import { describe, it, expect, beforeEach } from 'vitest';
import { store } from '../../../../src/core/Store.js';
import { createInitialState } from '../../../../src/core/store/InitialState.js';

describe('Store LOAD_PRESENTATION transition migration', () => {
  beforeEach(() => {
    store.restoreState(createInitialState());
  });

  it('migrates legacy slide.transition into styleAssignments.slideTransition and removes legacy field', () => {
    store.dispatch('LOAD_PRESENTATION', {
      slides: [
        {
          id: 's1',
          title: 'Legacy',
          transition: 'push',
          elements: {},
          elementOrder: [],
        },
      ],
    });

    const st = store.getState();
    const slide = st.slides.s1;

    expect(slide).toBeTruthy();
    expect(slide.transition).toBeUndefined();
    expect(slide.styleAssignments).toBeTruthy();
    expect(slide.styleAssignments.slideTransition).toEqual({
      type: 'push',
      direction: 'right',
      durationMs: 300,
      easing: 'ease-in-out',
    });
  });

  it('does not override canonical styleAssignments.slideTransition when present (but still removes legacy field)', () => {
    store.dispatch('LOAD_PRESENTATION', {
      slides: [
        {
          id: 's2',
          title: 'Already canonical',
          transition: 'push',
          styleAssignments: {
            slideTransition: { type: 'wipe', direction: 'down', durationMs: 400, easing: 'linear' },
          },
          elements: {},
          elementOrder: [],
        },
      ],
    });

    const st = store.getState();
    const slide = st.slides.s2;

    expect(slide.transition).toBeUndefined();
    expect(slide.styleAssignments.slideTransition).toEqual({
      type: 'wipe',
      direction: 'down',
      durationMs: 400,
      easing: 'linear',
    });
  });
});
