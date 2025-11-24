
export function handleUIInteractionStart(draft) {
    draft.ui.isInteracting = true;
}

export function handleUIInteractionEnd(draft) {
    draft.ui.isInteracting = false;
}
