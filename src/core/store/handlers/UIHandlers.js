
export function handleUIInteractionStart(store) {
    store.state.ui.isInteracting = true;
    store.emit('state-changed', store.state);
}

export function handleUIInteractionEnd(store) {
    store.state.ui.isInteracting = false;
    store.emit('state-changed', store.state);
}
