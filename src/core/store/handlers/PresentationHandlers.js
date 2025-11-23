
export function handlePresentationNext(store) {
    if (store.state.presentation.currentSlideIndex < store.state.slideOrder.length - 1) {
        store.state.presentation.currentSlideIndex++;
        store.state.presentation.buildIndex = -1;
        store.state.presentation.buildCount = 0;
        store.state.editor.activeSlideId = store.state.slideOrder[store.state.presentation.currentSlideIndex];
        store.emit('state-changed', store.state);
    }
}

export function handlePresentationPrev(store) {
    if (store.state.presentation.currentSlideIndex > 0) {
        store.state.presentation.currentSlideIndex--;
        store.state.presentation.buildIndex = -1;
        store.state.presentation.buildCount = 0;
        store.state.editor.activeSlideId = store.state.slideOrder[store.state.presentation.currentSlideIndex];
        store.emit('state-changed', store.state);
    }
}

export function handlePresentationGoto(store, payload) {
    const gotoIndex = payload;
    if (gotoIndex >= 0 && gotoIndex < store.state.slideOrder.length) {
        store.state.presentation.currentSlideIndex = gotoIndex;
        store.state.presentation.buildIndex = -1;
        store.state.presentation.buildCount = 0;
        store.state.editor.activeSlideId = store.state.slideOrder[gotoIndex];
        store.emit('state-changed', store.state);
    }
}

export function handleNextBuild(store) {
    if (store.state.presentation.buildIndex < store.state.presentation.buildCount - 1) {
        store.state.presentation.buildIndex++;
        store.emit('state-changed', store.state);
    }
}

export function handlePrevBuild(store) {
    if (store.state.presentation.buildIndex > -1) {
        store.state.presentation.buildIndex--;
        store.emit('state-changed', store.state);
    }
}

export function handleSetBuildCount(store, payload) {
    store.state.presentation.buildCount = payload;
    store.emit('state-changed', store.state);
}

export function handleToggleLaser(store) {
    store.state.presentation.laserPointer = !store.state.presentation.laserPointer;
    store.emit('state-changed', store.state);
}

export function handleToggleBlackScreen(store) {
    store.state.presentation.blackScreen = !store.state.presentation.blackScreen;
    store.state.presentation.whiteScreen = false;
    store.emit('state-changed', store.state);
}

export function handleToggleWhiteScreen(store) {
    store.state.presentation.whiteScreen = !store.state.presentation.whiteScreen;
    store.state.presentation.blackScreen = false;
    store.emit('state-changed', store.state);
}

export function handleToggleGridView(store) {
    store.state.presentation.gridView = !store.state.presentation.gridView;
    store.emit('state-changed', store.state);
}
