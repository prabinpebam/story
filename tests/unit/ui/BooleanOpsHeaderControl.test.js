import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const shared = vi.hoisted(() => ({
  lastMenuItems: null,
  lastMenuInstance: null,
  store: {
    getState: vi.fn(),
    dispatch: vi.fn(),
    on: vi.fn()
  }
}));

vi.mock('../../../src/ui/components/ContextMenu/ContextMenu.js', () => ({
  ContextMenu: vi.fn((items) => {
    shared.lastMenuItems = items;
    shared.lastMenuInstance = {
      items,
      show: vi.fn(),
      hideAll: vi.fn()
    };
    return shared.lastMenuInstance;
  })
}));

vi.mock('../../../src/core/Store.js', () => ({
  store: shared.store
}));

import { BooleanOpsHeaderControl } from '../../../src/ui/BooleanOpsHeaderControl.js';
import { store } from '../../../src/core/Store.js';

function makeState({ selection, elementsById }) {
  return {
    editor: {
      mode: 'edit',
      activeSlideId: 'slide-1',
      selectedElementIds: selection
    },
    slides: {
      'slide-1': {
        id: 'slide-1',
        elements: elementsById,
        elementOrder: Object.keys(elementsById)
      }
    },
    slideMasterPresets: {}
  };
}

describe('BooleanOpsHeaderControl', () => {
  let header;

  beforeEach(() => {
    vi.clearAllMocks();
    shared.lastMenuItems = null;
    shared.lastMenuInstance = null;

    header = document.createElement('div');
    header.className = 'sidebar-header';
    document.body.appendChild(header);

    // Default: no selection
    store.getState.mockReturnValue(makeState({ selection: [], elementsById: {} }));
  });

  afterEach(() => {
    header?.remove();
    document.body.innerHTML = '';
  });

  it('hides the trigger when selection has fewer than 2 elements', () => {
    store.getState.mockReturnValue(
      makeState({
        selection: ['a'],
        elementsById: { a: { id: 'a', type: 'rect', x: 0, y: 0, width: 10, height: 10 } }
      })
    );

    const control = new BooleanOpsHeaderControl(header);
    expect(control.trigger).toBeTruthy();
    expect(control.trigger.style.display).toBe('none');
  });

  it('shows the trigger when multi-selection contains 2+ eligible shapes', () => {
    store.getState.mockReturnValue(
      makeState({
        selection: ['a', 'b'],
        elementsById: {
          a: { id: 'a', type: 'rect', x: 0, y: 0, width: 10, height: 10 },
          b: { id: 'b', type: 'rect', x: 5, y: 5, width: 10, height: 10 }
        }
      })
    );

    const control = new BooleanOpsHeaderControl(header);
    expect(control.trigger).toBeTruthy();
    expect(control.trigger.getAttribute('aria-label')).toBe('Boolean operations');
    expect(control.trigger.style.display).not.toBe('none');
  });

  it('treats booleans as eligible operands (nested booleans)', () => {
    store.getState.mockReturnValue(
      makeState({
        selection: ['bool-1', 'rect-c'],
        elementsById: {
          'bool-1': { id: 'bool-1', type: 'shape', shapeKind: 'boolean', x: 0, y: 0, width: 10, height: 10, operation: 'union', operands: ['a', 'b'] },
          'rect-c': { id: 'rect-c', type: 'rect', x: 5, y: 5, width: 10, height: 10 }
        }
      })
    );

    const control = new BooleanOpsHeaderControl(header);
    expect(control.trigger).toBeTruthy();
    expect(control.trigger.style.display).not.toBe('none');
  });

  it('opens a menu with Union/Subtract/Intersect/Exclude, a separator, and Flatten', () => {
    store.getState.mockReturnValue(
      makeState({
        selection: ['a', 'b'],
        elementsById: {
          a: { id: 'a', type: 'rect', x: 0, y: 0, width: 10, height: 10 },
          b: { id: 'b', type: 'rect', x: 5, y: 5, width: 10, height: 10 }
        }
      })
    );

    const control = new BooleanOpsHeaderControl(header);
    control.trigger.click();

    expect(Array.isArray(shared.lastMenuItems)).toBe(true);
    expect(shared.lastMenuItems.map((i) => (i?.separator ? 'separator' : i.label))).toEqual([
      'Union',
      'Subtract',
      'Intersect',
      'Exclude',
      'separator',
      'Flatten'
    ]);

    const flatten = shared.lastMenuItems.find((i) => i?.id === 'flatten');
    expect(flatten?.danger).toBe(true);

    expect(shared.lastMenuInstance.show).toHaveBeenCalled();
    expect(control.isOpen).toBe(true);
  });

  it('dispatches the correct store actions for Union and Flatten', () => {
    const selection = ['a', 'b'];
    store.getState.mockReturnValue(
      makeState({
        selection,
        elementsById: {
          a: { id: 'a', type: 'rect', x: 0, y: 0, width: 10, height: 10 },
          b: { id: 'b', type: 'rect', x: 5, y: 5, width: 10, height: 10 }
        }
      })
    );

    new BooleanOpsHeaderControl(header).open();

    const union = shared.lastMenuItems.find((i) => i?.id === 'union');
    union.action();
    expect(store.dispatch).toHaveBeenCalledWith('CREATE_BOOLEAN_FROM_SELECTION', {
      ids: selection,
      operation: 'union'
    });

    const flatten = shared.lastMenuItems.find((i) => i?.id === 'flatten');
    flatten.action();
    expect(store.dispatch).toHaveBeenCalledWith('FLATTEN_BOOLEAN_FROM_SELECTION', { ids: selection });
  });

  it('does not block the next real click after keyboard open (suppression window expires)', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(1000));

    store.getState.mockReturnValue(
      makeState({
        selection: ['a', 'b'],
        elementsById: {
          a: { id: 'a', type: 'rect', x: 0, y: 0, width: 10, height: 10 },
          b: { id: 'b', type: 'rect', x: 5, y: 5, width: 10, height: 10 }
        }
      })
    );

    const control = new BooleanOpsHeaderControl(header);

    // Open via keyboard.
    control.trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(control.isOpen).toBe(true);

    // Close it (simulate choosing an item).
    control.close();
    expect(control.isOpen).toBe(false);

    // A click immediately after closing should work (we clear suppression on close).
    control.trigger.click();
    expect(control.isOpen).toBe(true);

    vi.useRealTimers();
  });
});
