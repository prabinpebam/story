
export function handlePresentationNext(draft) {
    if (draft.presentation.currentSlideIndex < draft.slideOrder.length - 1) {
        draft.presentation.currentSlideIndex++;
        draft.presentation.buildIndex = -1;
        draft.presentation.buildCount = 0;
        draft.editor.activeSlideId = draft.slideOrder[draft.presentation.currentSlideIndex];
    }
}

export function handlePresentationPrev(draft) {
    if (draft.presentation.currentSlideIndex > 0) {
        draft.presentation.currentSlideIndex--;
        draft.presentation.buildIndex = -1;
        draft.presentation.buildCount = 0;
        draft.editor.activeSlideId = draft.slideOrder[draft.presentation.currentSlideIndex];
    }
}

export function handlePresentationGoto(draft, payload) {
    const gotoIndex = payload;
    if (gotoIndex >= 0 && gotoIndex < draft.slideOrder.length) {
        draft.presentation.currentSlideIndex = gotoIndex;
        draft.presentation.buildIndex = -1;
        draft.presentation.buildCount = 0;
        draft.editor.activeSlideId = draft.slideOrder[gotoIndex];
    }
}

export function handleNextBuild(draft) {
    if (draft.presentation.buildIndex < draft.presentation.buildCount - 1) {
        draft.presentation.buildIndex++;
    }
}

export function handlePrevBuild(draft) {
    if (draft.presentation.buildIndex > -1) {
        draft.presentation.buildIndex--;
    }
}

export function handleSetBuildCount(draft, payload) {
    draft.presentation.buildCount = payload;
}

export function handleToggleLaser(draft) {
    draft.presentation.laserPointer = !draft.presentation.laserPointer;
}

export function handleToggleBlackScreen(draft) {
    draft.presentation.blackScreen = !draft.presentation.blackScreen;
    draft.presentation.whiteScreen = false;
}

export function handleToggleWhiteScreen(draft) {
    draft.presentation.whiteScreen = !draft.presentation.whiteScreen;
    draft.presentation.blackScreen = false;
}

export function handleToggleGridView(draft) {
    draft.presentation.gridView = !draft.presentation.gridView;
}
