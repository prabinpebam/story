export function isMasterInUseBySlides(state, masterId) {
    if (!state || !masterId) return false;

    const slides = state.slides;
    const slideList = Array.isArray(slides) ? slides : Object.values(slides || {});

    for (const slide of slideList) {
        const layoutId = slide?.layoutId;
        if (!layoutId) continue;
        const layout = state.slideMasterPresets?.[layoutId];
        const parentId = layout?.parentMasterId || layout?.parentId;
        if (parentId === masterId) return true;
    }

    return false;
}
