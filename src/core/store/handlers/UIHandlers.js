
export function handleUIInteractionStart(draft) {
    console.log('[UIHandlers] UI_INTERACTION_START - setting isInteracting = true');
    draft.ui.isInteracting = true;
}

export function handleUIInteractionEnd(draft) {
    console.log('[UIHandlers] UI_INTERACTION_END - setting isInteracting = false');
    draft.ui.isInteracting = false;
}
