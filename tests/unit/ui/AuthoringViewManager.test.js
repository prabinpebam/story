import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockDispatch, mockGetState, mockOn, mockCreateThumbnail, mockDestroyThumbnail } = vi.hoisted(() => ({
    mockDispatch: vi.fn(),
    mockGetState: vi.fn(),
    mockOn: vi.fn(),
    mockCreateThumbnail: vi.fn(() => document.createElement('div')),
    mockDestroyThumbnail: vi.fn()
}));

vi.mock('../../../src/core/Store.js', () => ({
    store: {
        dispatch: mockDispatch,
        getState: mockGetState,
        on: mockOn,
        getEffectiveSlide: vi.fn((slideId) => mockGetState().slides[slideId])
    }
}));

vi.mock('../../../src/core/renderer/ThumbnailRenderer.js', () => ({
    ThumbnailRenderer: {
        createThumbnail: mockCreateThumbnail,
        destroyThumbnail: mockDestroyThumbnail
    }
}));

import { AuthoringViewManager } from '../../../src/ui/AuthoringViewManager.js';

function createState(view = 'Canvas') {
    return {
        meta: { title: 'Quarterly Story', theme: 'default-dark' },
        context: { view, editScope: 'Slide', runtimeMode: null },
        editor: {
            mode: 'edit',
            activeSlideId: 'slide-1',
            activeMasterId: 'master-default',
            selectedSlideIds: ['slide-1']
        },
        presentation: { isActive: false },
        slideOrder: ['slide-1', 'slide-2'],
        slides: {
            'slide-1': {
                id: 'slide-1',
                title: 'Opening',
                layoutId: 'layout-title',
                notesDoc: { version: 1, blocks: [{ type: 'paragraph', inlines: [{ type: 'text', text: 'Speaker note' }] }] },
                elementOrder: ['title-1'],
                elements: { 'title-1': { id: 'title-1', type: 'text', content: '<p>Opening message</p>' } }
            },
            'slide-2': {
                id: 'slide-2',
                title: 'Evidence',
                layoutId: 'layout-blank',
                elementOrder: [],
                elements: {}
            }
        },
        slideMasterPresets: {
            'master-default': { id: 'master-default', name: 'Default master' }
        }
    };
}

function installShell() {
    document.body.innerHTML = `
        <button id="compact-navigator-trigger" aria-expanded="false">Navigator</button>
        <button id="compact-inspector-trigger" aria-expanded="false">Inspector</button>
        <nav id="authoring-view-switcher">
            ${['Canvas', 'Grid', 'Outline', 'Notes', 'System'].map((view) => `<button data-authoring-view="${view}">${view}</button>`).join('')}
        </nav>
        <section id="authoring-workspace" class="hidden"></section>
        <div id="canvas-viewport"></div>
        <aside id="sidebar-left"><button>Slides</button></aside>
        <aside id="sidebar-right"><button>Properties</button></aside>
        <button id="compact-rail-backdrop" class="hidden">Close</button>
    `;
}

describe('AuthoringViewManager', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        installShell();
        mockGetState.mockReturnValue(createState());
    });

    it('switches views through the canonical Store action', () => {
        new AuthoringViewManager();

        document.querySelector('[data-authoring-view="Grid"]').click();

        expect(mockDispatch).toHaveBeenCalledWith('SET_VIEW', 'Grid');
    });

    it('renders Grid as a separate authoring projection with independent thumbnail keys', () => {
        const manager = new AuthoringViewManager();
        const state = createState('Grid');

        manager.update(state);

        expect(document.querySelector('[data-testid="authoring-grid"]')).not.toBeNull();
        expect(document.querySelector('#canvas-viewport').classList.contains('hidden')).toBe(true);
        expect(mockCreateThumbnail).toHaveBeenCalledWith('slide-1', state.slides['slide-1'], 'authoring-grid:slide-1');
        expect(mockCreateThumbnail).toHaveBeenCalledWith('slide-2', state.slides['slide-2'], 'authoring-grid:slide-2');
    });

    it('keeps slide selection synchronized from Grid', () => {
        const manager = new AuthoringViewManager();
        manager.update(createState('Grid'));

        document.querySelector('[data-slide-id="slide-2"]').click();

        expect(mockDispatch).toHaveBeenCalledWith('SET_ACTIVE_SLIDE', 'slide-2');
        expect(mockDispatch).toHaveBeenCalledWith('SELECT_SLIDE', { id: 'slide-2', multi: false });
    });

    it('edits slide titles and selects semantic text from Outline', () => {
        const manager = new AuthoringViewManager();
        manager.update(createState('Outline'));

        const title = document.querySelector('.authoring-outline__title');
        title.value = 'Reframed opening';
        title.dispatchEvent(new Event('change'));
        document.querySelector('.authoring-outline__text').click();

        expect(mockDispatch).toHaveBeenCalledWith('UPDATE_SLIDE', { id: 'slide-1', title: 'Reframed opening' });
        expect(mockDispatch).toHaveBeenCalledWith('UPDATE_SELECTION', ['title-1']);
    });

    it('persists Notes to the canonical notesDoc field', () => {
        vi.useFakeTimers();
        const manager = new AuthoringViewManager();
        manager.update(createState('Notes'));

        const editor = document.querySelector('.authoring-notes__editor');
        expect(editor.textContent).toContain('Speaker note');
        editor.innerHTML = '<p>Updated note</p>';
        editor.dispatchEvent(new Event('input'));
        vi.advanceTimersByTime(250);

        expect(mockDispatch).toHaveBeenCalledWith('UPDATE_SLIDE', expect.objectContaining({
            id: 'slide-1',
            notesDoc: expect.objectContaining({ version: 1 })
        }));
        vi.useRealTimers();
    });

    it('reports absent Story System state truthfully', () => {
        const manager = new AuthoringViewManager();
        manager.update(createState('System'));

        expect(document.querySelector('[data-testid="authoring-system"]').textContent).toContain('Story System');
        expect(document.querySelector('[data-testid="authoring-system"]').textContent).toContain('Not created');
    });

    it('restores Canvas and hides authoring navigation during runtime', () => {
        const manager = new AuthoringViewManager();
        const state = createState('Grid');
        state.context.runtimeMode = 'Presentation';
        state.editor.mode = 'presentation';

        manager.update(state);

        expect(document.querySelector('#authoring-workspace').classList.contains('hidden')).toBe(true);
        expect(document.querySelector('#canvas-viewport').classList.contains('hidden')).toBe(false);
        expect(document.querySelector('#authoring-view-switcher').classList.contains('hidden')).toBe(true);
    });

    it('opens one compact rail at a time and dismisses it with Escape', () => {
        new AuthoringViewManager();

        document.querySelector('#compact-navigator-trigger').click();
        expect(document.body.classList.contains('compact-navigator-open')).toBe(true);
        expect(document.querySelector('#compact-navigator-trigger').getAttribute('aria-expanded')).toBe('true');

        document.querySelector('#compact-inspector-trigger').click();
        expect(document.body.classList.contains('compact-navigator-open')).toBe(false);
        expect(document.body.classList.contains('compact-inspector-open')).toBe(true);

        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        expect(document.body.classList.contains('compact-inspector-open')).toBe(false);
        expect(document.querySelector('#compact-rail-backdrop').classList.contains('hidden')).toBe(true);
    });
});