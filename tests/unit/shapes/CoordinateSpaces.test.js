import { describe, expect, it } from 'vitest';

import {
    getActiveContainerFromState,
    screenToWorld,
    worldToScreen
} from '../../../src/core/shapes/CoordinateSpaces.js';

describe('CoordinateSpaces', () => {
    it('selects active container by mode', () => {
        const state = {
            editor: { mode: 'edit', activeSlideId: 's1', activeMasterId: 'm1' },
            slides: { s1: { id: 's1' } },
            slideMasterPresets: { m1: { id: 'm1' } }
        };

        expect(getActiveContainerFromState(state)?.id).toBe('s1');
        expect(getActiveContainerFromState({ ...state, editor: { ...state.editor, mode: 'master' } })?.id).toBe('m1');
    });

    it('world<->screen mapping matches edit/master pan+zoom', () => {
        const state = { editor: { mode: 'edit', zoom: 2, pan: { x: 10, y: 20 } } };
        const s = worldToScreen(state, 5, 7);
        expect(s).toEqual({ screenX: 20, screenY: 34 });

        const w = screenToWorld(state, s.screenX, s.screenY);
        expect(w.worldX).toBe(5);
        expect(w.worldY).toBe(7);
    });

    it('world<->screen mapping matches presentation scale+offset', () => {
        const state = { editor: { mode: 'presentation' } };
        const mapping = { scale: 3, offsetX: 100, offsetY: 50 };

        const s = worldToScreen(state, 10, 5, mapping);
        expect(s).toEqual({ screenX: 130, screenY: 65 });

        const w = screenToWorld(state, s.screenX, s.screenY, mapping);
        expect(w.worldX).toBe(10);
        expect(w.worldY).toBe(5);
    });
});
