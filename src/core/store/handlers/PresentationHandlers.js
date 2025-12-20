
function isSlideHidden(draft, slideId) {
    const slide = draft.slides?.[slideId];
    return slide?.hidden === true || slide?.isHidden === true;
}

function getNextVisibleIndex(draft, fromIndex) {
    for (let i = fromIndex + 1; i < draft.slideOrder.length; i++) {
        const id = draft.slideOrder[i];
        if (!isSlideHidden(draft, id)) return i;
    }
    return -1;
}

function getPrevVisibleIndex(draft, fromIndex) {
    for (let i = fromIndex - 1; i >= 0; i--) {
        const id = draft.slideOrder[i];
        if (!isSlideHidden(draft, id)) return i;
    }
    return -1;
}

function pushBackStack(draft) {
    const entry = {
        slideIndex: draft.presentation.currentSlideIndex,
        buildIndex: draft.presentation.buildIndex
    };
    const stack = Array.isArray(draft.presentation.backStack) ? draft.presentation.backStack : [];
    stack.push(entry);
    const maxDepth = Number.isFinite(draft.presentation.backStackMaxDepth)
        ? draft.presentation.backStackMaxDepth
        : 10;
    if (stack.length > maxDepth) {
        stack.splice(0, stack.length - maxDepth);
    }
    draft.presentation.backStack = stack;
}

function getBuildCountForSlide(draft, slideId) {
    const byId = draft.presentation.buildCountBySlideId || {};
    const fromMap = byId?.[slideId];
    if (Number.isFinite(fromMap)) return fromMap;

    // Fallback: infer from slide element data (entrance animations imply builds).
    const slide = draft.slides?.[slideId];
    const elements = slide?.elements || {};
    return Object.values(elements).filter((el) => el?.animations?.entrance && el.animations.entrance !== 'none').length;
}

export function handlePresentationNext(draft) {
    const nextIndex = getNextVisibleIndex(draft, draft.presentation.currentSlideIndex);
    if (nextIndex === -1) return;

    const nextSlideId = draft.slideOrder[nextIndex];
    const buildCount = getBuildCountForSlide(draft, nextSlideId);

    draft.presentation.currentSlideIndex = nextIndex;
    draft.presentation.buildCount = buildCount;
    draft.presentation.buildIndex = -1;
    draft.editor.activeSlideId = nextSlideId;
}

export function handlePresentationPrev(draft) {
    const prevIndex = getPrevVisibleIndex(draft, draft.presentation.currentSlideIndex);
    if (prevIndex === -1) return;

    const prevSlideId = draft.slideOrder[prevIndex];
    const buildCount = getBuildCountForSlide(draft, prevSlideId);

    draft.presentation.currentSlideIndex = prevIndex;
    draft.presentation.buildCount = buildCount;
    draft.presentation.buildIndex = buildCount > 0 ? Math.max(0, buildCount - 1) : -1;
    draft.editor.activeSlideId = prevSlideId;
}

export function handlePresentationGoto(draft, payload) {
    const gotoIndex = typeof payload === 'number' ? payload : payload?.index;
    if (gotoIndex >= 0 && gotoIndex < draft.slideOrder.length) {
        const slideId = draft.slideOrder[gotoIndex];
        const buildCount = getBuildCountForSlide(draft, slideId);
        const desiredBuildIndex = typeof payload === 'object' && payload !== null ? payload.buildIndex : undefined;

        draft.presentation.currentSlideIndex = gotoIndex;
        draft.presentation.buildCount = buildCount;

        if (typeof desiredBuildIndex === 'number') {
            if (buildCount <= 0) {
                draft.presentation.buildIndex = -1;
            } else {
                draft.presentation.buildIndex = Math.min(Math.max(desiredBuildIndex, -1), buildCount - 1);
            }
        } else {
            draft.presentation.buildIndex = -1;
        }

        draft.editor.activeSlideId = slideId;
    }
}

export function handlePresentationJumpTo(draft, payload) {
    const gotoIndex = payload?.index;
    if (typeof gotoIndex !== 'number') return;
    if (gotoIndex < 0 || gotoIndex >= draft.slideOrder.length) return;

    pushBackStack(draft);
    handlePresentationGoto(draft, gotoIndex);
}

export function handlePresentationGoBack(draft) {
    const stack = Array.isArray(draft.presentation.backStack) ? draft.presentation.backStack : [];
    const prev = stack.pop();
    draft.presentation.backStack = stack;
    if (!prev) return;

    const slideIndex = prev.slideIndex;
    if (typeof slideIndex !== 'number') return;
    if (slideIndex < 0 || slideIndex >= draft.slideOrder.length) return;

    const slideId = draft.slideOrder[slideIndex];
    const buildCount = getBuildCountForSlide(draft, slideId);
    const desiredBuild = typeof prev.buildIndex === 'number' ? prev.buildIndex : -1;

    draft.presentation.currentSlideIndex = slideIndex;
    draft.presentation.buildCount = buildCount;
    if (buildCount <= 0) {
        draft.presentation.buildIndex = -1;
    } else {
        draft.presentation.buildIndex = Math.min(Math.max(desiredBuild, -1), buildCount - 1);
    }
    draft.editor.activeSlideId = slideId;
}

export function handleSetKioskConfig(draft, payload) {
    const current = draft.presentation.kiosk || {
        enabled: false,
        autoAdvanceSeconds: 5,
        loop: true,
        passwordHash: null,
        disableInput: false
    };

    if (!payload || typeof payload !== 'object') {
        draft.presentation.kiosk = { ...current, enabled: false };
        return;
    }

    const enabled = payload.enabled === true;
    const autoAdvanceSeconds = Number.isFinite(payload.autoAdvanceSeconds)
        ? Math.max(0.1, Number(payload.autoAdvanceSeconds))
        : current.autoAdvanceSeconds;
    const loop = payload.loop !== undefined ? payload.loop === true : current.loop;
    const disableInput = payload.disableInput !== undefined ? payload.disableInput === true : current.disableInput;
    const passwordHash = typeof payload.passwordHash === 'string' && payload.passwordHash.trim()
        ? payload.passwordHash.trim()
        : null;

    draft.presentation.kiosk = {
        enabled,
        autoAdvanceSeconds,
        loop,
        passwordHash,
        disableInput
    };
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

export function handleSetBuildCountForSlide(draft, payload) {
    const slideId = payload?.slideId;
    const buildCount = payload?.buildCount;
    if (typeof slideId !== 'string') return;
    if (!Number.isFinite(buildCount)) return;
    if (!draft.presentation.buildCountBySlideId) draft.presentation.buildCountBySlideId = {};
    draft.presentation.buildCountBySlideId[slideId] = buildCount;
}

export function handleSetRequestFullscreen(draft, payload) {
    draft.presentation.requestFullscreen = payload !== false;
}

export function handleSetPresentationPaused(draft, payload) {
    draft.presentation.isPaused = payload === true;
}

export function handleSetPresentationNavLoading(draft, payload) {
    draft.presentation.navLoading = payload === true;
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
