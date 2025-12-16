/**
 * CoordinateSpaces
 *
 * Implements the Shapes coordinate system spec contracts.
 * Spec reference: documentation/01-specs/shapes/03-coordinate-systems.md
 */

export function getActiveContainerFromState(state) {
    if (!state?.editor) return null;

    if (state.editor.mode === 'master') {
        return state.slideMasterPresets?.[state.editor.activeMasterId] ?? null;
    }

    return state.slides?.[state.editor.activeSlideId] ?? null;
}

export function worldToScreen(state, worldX, worldY, presentationMapping) {
    const mode = state?.editor?.mode ?? 'edit';

    if (mode === 'presentation') {
        const scale = presentationMapping?.scale ?? 1;
        const offsetX = presentationMapping?.offsetX ?? 0;
        const offsetY = presentationMapping?.offsetY ?? 0;
        return {
            screenX: (worldX * scale) + offsetX,
            screenY: (worldY * scale) + offsetY
        };
    }

    const zoom = state?.editor?.zoom ?? 1;
    const panX = state?.editor?.pan?.x ?? 0;
    const panY = state?.editor?.pan?.y ?? 0;

    return {
        screenX: (worldX * zoom) + panX,
        screenY: (worldY * zoom) + panY
    };
}

export function screenToWorld(state, screenX, screenY, presentationMapping) {
    const mode = state?.editor?.mode ?? 'edit';

    if (mode === 'presentation') {
        const scale = presentationMapping?.scale ?? 1;
        const offsetX = presentationMapping?.offsetX ?? 0;
        const offsetY = presentationMapping?.offsetY ?? 0;
        return {
            worldX: (screenX - offsetX) / scale,
            worldY: (screenY - offsetY) / scale
        };
    }

    const zoom = state?.editor?.zoom ?? 1;
    const panX = state?.editor?.pan?.x ?? 0;
    const panY = state?.editor?.pan?.y ?? 0;

    return {
        worldX: (screenX - panX) / zoom,
        worldY: (screenY - panY) / zoom
    };
}
