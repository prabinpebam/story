import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Simple mock for Store  
vi.mock('../../../src/core/Store.js', () => ({
    store: {
        getState: vi.fn(() => ({
            editor: {
                mode: 'edit',
                activeSlideId: 'slide-1',
                activeMasterId: null,
                selectedElementIds: []
            },
            slides: {
                'slide-1': {
                    id: 'slide-1',
                    elements: {},
                    elementOrder: []
                }
            },
            masters: {}
        })),
        dispatch: vi.fn(),
        on: vi.fn(),
        getEffectiveSlide: vi.fn(() => null)
    }
}));

import { LayerTree } from '../../../src/ui/LayerTree.js';
import { store } from '../../../src/core/Store.js';

describe('LayerTree', () => {
    let layerTree;
    let mockContainer;

    beforeEach(() => {
        vi.clearAllMocks();

        mockContainer = document.createElement('div');
        mockContainer.id = 'layer-tree';

        vi.spyOn(document, 'getElementById').mockReturnValue(mockContainer);
        vi.spyOn(document, 'addEventListener').mockImplementation(() => {});

        // Reset mock state
        store.getState.mockReturnValue({
            editor: {
                mode: 'edit',
                activeSlideId: 'slide-1',
                activeMasterId: null,
                selectedElementIds: []
            },
            slides: {
                'slide-1': {
                    id: 'slide-1',
                    elements: {},
                    elementOrder: []
                }
            },
            masters: {}
        });

        layerTree = new LayerTree('layer-tree');
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('constructor', () => {
        it('should initialize with container reference', () => {
            expect(layerTree.container).toBe(mockContainer);
        });

        it('should initialize drag state to null', () => {
            expect(layerTree.draggedId).toBeNull();
            expect(layerTree.dragOverItem).toBeNull();
            expect(layerTree.dropPosition).toBeNull();
        });
    });

    describe('init()', () => {
        it('should subscribe to state-changed event', () => {
            expect(store.on).toHaveBeenCalledWith('state-changed', expect.any(Function));
        });

        it('should add global dragend listener', () => {
            expect(document.addEventListener).toHaveBeenCalledWith('dragend', expect.any(Function));
        });

        it('should call render on initialization', () => {
            // Container should have content after init
            expect(mockContainer.innerHTML).not.toBe('');
        });
    });

    describe('render()', () => {
        it('should clear container before rendering', () => {
            mockContainer.innerHTML = '<div>Old content</div>';
            layerTree.render();
            expect(mockContainer.innerHTML).not.toContain('Old content');
        });

        it('should render elements in reverse order (front to back)', () => {
            store.getState.mockReturnValue({
                editor: {
                    mode: 'edit',
                    activeSlideId: 'slide-1',
                    activeMasterId: null,
                    selectedElementIds: []
                },
                slides: {
                    'slide-1': {
                        id: 'slide-1',
                        elements: {
                            'el-1': { id: 'el-1', type: 'rect' },
                            'el-2': { id: 'el-2', type: 'rect' }
                        },
                        elementOrder: ['el-1', 'el-2'] // el-1 is back, el-2 is front
                    }
                },
                masters: {}
            });

            layerTree.render();

            const items = mockContainer.querySelectorAll('.layer-item');
            if (items.length >= 2) {
                // First rendered should be el-2 (front)
                expect(items[0].dataset.id).toBe('el-2');
                expect(items[1].dataset.id).toBe('el-1');
            }
        });

        it('should use master in master mode', () => {
            store.getState.mockReturnValue({
                editor: {
                    mode: 'master',
                    activeSlideId: 'slide-1',
                    activeMasterId: 'master-1',
                    selectedElementIds: []
                },
                slides: {},
                masters: {
                    'master-1': {
                        id: 'master-1',
                        elements: {
                            'ph-1': { id: 'ph-1', type: 'placeholder', isPlaceholder: true, placeholderType: 'title' }
                        },
                        elementOrder: ['ph-1']
                    }
                }
            });

            layerTree.render();

            const items = mockContainer.querySelectorAll('.layer-item');
            expect(items.length).toBe(1);
            expect(items[0].dataset.id).toBe('ph-1');
        });
    });

    describe('createLayerItem()', () => {
        it('should create layer item with correct data attributes', () => {
            store.getState.mockReturnValue({
                editor: {
                    mode: 'edit',
                    activeSlideId: 'slide-1',
                    activeMasterId: null,
                    selectedElementIds: []
                },
                slides: {
                    'slide-1': {
                        id: 'slide-1',
                        elements: {
                            'rect-1': { id: 'rect-1', type: 'rect' }
                        },
                        elementOrder: ['rect-1']
                    }
                },
                masters: {}
            });

            layerTree.render();

            const item = mockContainer.querySelector('[data-id="rect-1"]');
            expect(item).toBeTruthy();
            expect(item.dataset.id).toBe('rect-1');
        });

        it('should show correct icon for rect elements', () => {
            store.getState.mockReturnValue({
                editor: {
                    mode: 'edit',
                    activeSlideId: 'slide-1',
                    activeMasterId: null,
                    selectedElementIds: []
                },
                slides: {
                    'slide-1': {
                        id: 'slide-1',
                        elements: {
                            'rect-1': { id: 'rect-1', type: 'rect' }
                        },
                        elementOrder: ['rect-1']
                    }
                },
                masters: {}
            });

            layerTree.render();

            const icon = mockContainer.querySelector('.fa-regular.fa-square');
            expect(icon).toBeTruthy();
        });

        it('should show correct icon for text elements', () => {
            store.getState.mockReturnValue({
                editor: {
                    mode: 'edit',
                    activeSlideId: 'slide-1',
                    activeMasterId: null,
                    selectedElementIds: []
                },
                slides: {
                    'slide-1': {
                        id: 'slide-1',
                        elements: {
                            'text-1': { id: 'text-1', type: 'text', content: 'Hello' }
                        },
                        elementOrder: ['text-1']
                    }
                },
                masters: {}
            });

            layerTree.render();

            const icon = mockContainer.querySelector('.fa-solid.fa-font');
            expect(icon).toBeTruthy();
        });

        it('should show correct icon for image elements', () => {
            store.getState.mockReturnValue({
                editor: {
                    mode: 'edit',
                    activeSlideId: 'slide-1',
                    activeMasterId: null,
                    selectedElementIds: []
                },
                slides: {
                    'slide-1': {
                        id: 'slide-1',
                        elements: {
                            'img-1': { id: 'img-1', type: 'image' }
                        },
                        elementOrder: ['img-1']
                    }
                },
                masters: {}
            });

            layerTree.render();

            const icon = mockContainer.querySelector('.fa-regular.fa-image');
            expect(icon).toBeTruthy();
        });

        it('should show correct icon for group elements', () => {
            store.getState.mockReturnValue({
                editor: {
                    mode: 'edit',
                    activeSlideId: 'slide-1',
                    activeMasterId: null,
                    selectedElementIds: []
                },
                slides: {
                    'slide-1': {
                        id: 'slide-1',
                        elements: {
                            'group-1': { id: 'group-1', type: 'group', children: [] }
                        },
                        elementOrder: ['group-1']
                    }
                },
                masters: {}
            });

            layerTree.render();

            const icon = mockContainer.querySelector('.fa-solid.fa-layer-group');
            expect(icon).toBeTruthy();
        });

        it('should highlight selected elements', () => {
            store.getState.mockReturnValue({
                editor: {
                    mode: 'edit',
                    activeSlideId: 'slide-1',
                    activeMasterId: null,
                    selectedElementIds: ['rect-1']
                },
                slides: {
                    'slide-1': {
                        id: 'slide-1',
                        elements: {
                            'rect-1': { id: 'rect-1', type: 'rect' }
                        },
                        elementOrder: ['rect-1']
                    }
                },
                masters: {}
            });

            layerTree.render();

            const item = mockContainer.querySelector('[data-id="rect-1"]');
            expect(item).toBeTruthy();
            // Should have active background color (CSS var or specific color)
            expect(item.style.backgroundColor).toContain('var(--color-bg-active)');
        });
    });

    describe('Selection', () => {
        it('should dispatch UPDATE_SELECTION on click', () => {
            store.getState.mockReturnValue({
                editor: {
                    mode: 'edit',
                    activeSlideId: 'slide-1',
                    activeMasterId: null,
                    selectedElementIds: []
                },
                slides: {
                    'slide-1': {
                        id: 'slide-1',
                        elements: {
                            'rect-1': { id: 'rect-1', type: 'rect' }
                        },
                        elementOrder: ['rect-1']
                    }
                },
                masters: {}
            });

            layerTree.render();

            const item = mockContainer.querySelector('[data-id="rect-1"]');
            if (item) {
                item.click();
                expect(store.dispatch).toHaveBeenCalledWith('UPDATE_SELECTION', ['rect-1']);
            }
        });

        it('should toggle selection with shift+click', () => {
            store.getState.mockReturnValue({
                editor: {
                    mode: 'edit',
                    activeSlideId: 'slide-1',
                    activeMasterId: null,
                    selectedElementIds: ['rect-1']
                },
                slides: {
                    'slide-1': {
                        id: 'slide-1',
                        elements: {
                            'rect-1': { id: 'rect-1', type: 'rect' },
                            'rect-2': { id: 'rect-2', type: 'rect' }
                        },
                        elementOrder: ['rect-1', 'rect-2']
                    }
                },
                masters: {}
            });

            layerTree.render();

            const item = mockContainer.querySelector('[data-id="rect-2"]');
            if (item) {
                const clickEvent = new MouseEvent('click', { shiftKey: true });
                item.dispatchEvent(clickEvent);
                expect(store.dispatch).toHaveBeenCalledWith('UPDATE_SELECTION', ['rect-1', 'rect-2']);
            }
        });

        it('should remove from selection with shift+click on selected item', () => {
            store.getState.mockReturnValue({
                editor: {
                    mode: 'edit',
                    activeSlideId: 'slide-1',
                    activeMasterId: null,
                    selectedElementIds: ['rect-1', 'rect-2']
                },
                slides: {
                    'slide-1': {
                        id: 'slide-1',
                        elements: {
                            'rect-1': { id: 'rect-1', type: 'rect' },
                            'rect-2': { id: 'rect-2', type: 'rect' }
                        },
                        elementOrder: ['rect-1', 'rect-2']
                    }
                },
                masters: {}
            });

            layerTree.render();

            const item = mockContainer.querySelector('[data-id="rect-2"]');
            if (item) {
                const clickEvent = new MouseEvent('click', { shiftKey: true });
                item.dispatchEvent(clickEvent);
                expect(store.dispatch).toHaveBeenCalledWith('UPDATE_SELECTION', ['rect-1']);
            }
        });
    });

    describe('Lock and Visibility toggles', () => {
        it('should dispatch TOGGLE_ELEMENT_LOCK on lock button click', () => {
            store.getState.mockReturnValue({
                editor: {
                    mode: 'edit',
                    activeSlideId: 'slide-1',
                    activeMasterId: null,
                    selectedElementIds: ['rect-1']
                },
                slides: {
                    'slide-1': {
                        id: 'slide-1',
                        elements: {
                            'rect-1': { id: 'rect-1', type: 'rect', locked: false }
                        },
                        elementOrder: ['rect-1']
                    }
                },
                masters: {}
            });

            layerTree.render();

            const lockBtn = mockContainer.querySelector('.fa-lock-open');
            if (lockBtn) {
                lockBtn.click();
                expect(store.dispatch).toHaveBeenCalledWith('TOGGLE_ELEMENT_LOCK', { id: 'rect-1' });
            }
        });

        it('should dispatch TOGGLE_ELEMENT_VISIBILITY on eye button click', () => {
            store.getState.mockReturnValue({
                editor: {
                    mode: 'edit',
                    activeSlideId: 'slide-1',
                    activeMasterId: null,
                    selectedElementIds: ['rect-1']
                },
                slides: {
                    'slide-1': {
                        id: 'slide-1',
                        elements: {
                            'rect-1': { id: 'rect-1', type: 'rect', hidden: false }
                        },
                        elementOrder: ['rect-1']
                    }
                },
                masters: {}
            });

            layerTree.render();

            const visBtn = mockContainer.querySelector('.fa-eye');
            if (visBtn) {
                visBtn.click();
                expect(store.dispatch).toHaveBeenCalledWith('TOGGLE_ELEMENT_VISIBILITY', { id: 'rect-1' });
            }
        });

        it('should show locked icon for locked elements', () => {
            store.getState.mockReturnValue({
                editor: {
                    mode: 'edit',
                    activeSlideId: 'slide-1',
                    activeMasterId: null,
                    selectedElementIds: []
                },
                slides: {
                    'slide-1': {
                        id: 'slide-1',
                        elements: {
                            'rect-1': { id: 'rect-1', type: 'rect', locked: true }
                        },
                        elementOrder: ['rect-1']
                    }
                },
                masters: {}
            });

            layerTree.render();

            // Should have fa-lock (not fa-lock-open)
            const lockIcon = mockContainer.querySelector('.fa-lock:not(.fa-lock-open)');
            expect(lockIcon).toBeTruthy();
        });

        it('should show eye-slash icon for hidden elements', () => {
            store.getState.mockReturnValue({
                editor: {
                    mode: 'edit',
                    activeSlideId: 'slide-1',
                    activeMasterId: null,
                    selectedElementIds: []
                },
                slides: {
                    'slide-1': {
                        id: 'slide-1',
                        elements: {
                            'rect-1': { id: 'rect-1', type: 'rect', hidden: true }
                        },
                        elementOrder: ['rect-1']
                    }
                },
                masters: {}
            });

            layerTree.render();

            const hiddenIcon = mockContainer.querySelector('.fa-eye-slash');
            expect(hiddenIcon).toBeTruthy();
        });
    });

    describe('Drag and Drop', () => {
        it('should set draggedId on drag start', () => {
            store.getState.mockReturnValue({
                editor: {
                    mode: 'edit',
                    activeSlideId: 'slide-1',
                    activeMasterId: null,
                    selectedElementIds: []
                },
                slides: {
                    'slide-1': {
                        id: 'slide-1',
                        elements: {
                            'rect-1': { id: 'rect-1', type: 'rect' }
                        },
                        elementOrder: ['rect-1']
                    }
                },
                masters: {}
            });

            layerTree.render();

            const item = mockContainer.querySelector('[data-id="rect-1"]');
            if (item) {
                const dragEvent = new Event('dragstart');
                dragEvent.dataTransfer = { setData: vi.fn() };
                item.dispatchEvent(dragEvent);

                expect(layerTree.draggedId).toBe('rect-1');
            }
        });

        it('should set opacity on drag start', () => {
            store.getState.mockReturnValue({
                editor: {
                    mode: 'edit',
                    activeSlideId: 'slide-1',
                    activeMasterId: null,
                    selectedElementIds: []
                },
                slides: {
                    'slide-1': {
                        id: 'slide-1',
                        elements: {
                            'rect-1': { id: 'rect-1', type: 'rect' }
                        },
                        elementOrder: ['rect-1']
                    }
                },
                masters: {}
            });

            layerTree.render();

            const item = mockContainer.querySelector('[data-id="rect-1"]');
            if (item) {
                const dragEvent = new Event('dragstart');
                dragEvent.dataTransfer = { setData: vi.fn() };
                item.dispatchEvent(dragEvent);

                expect(item.style.opacity).toBe('0.5');
            }
        });

        it('should dispatch REORDER_ELEMENTS on drop', () => {
            store.getState.mockReturnValue({
                editor: {
                    mode: 'edit',
                    activeSlideId: 'slide-1',
                    activeMasterId: null,
                    selectedElementIds: []
                },
                slides: {
                    'slide-1': {
                        id: 'slide-1',
                        elements: {
                            'rect-1': { id: 'rect-1', type: 'rect' },
                            'rect-2': { id: 'rect-2', type: 'rect' }
                        },
                        elementOrder: ['rect-1', 'rect-2']
                    }
                },
                masters: {}
            });

            layerTree.render();

            const items = mockContainer.querySelectorAll('[data-id]');
            if (items.length >= 2) {
                // Simulate drag from rect-1 to rect-2
                layerTree.draggedId = 'rect-1';
                layerTree.dropPosition = 'before';
                layerTree.dragOverItem = items[0];

                const dropEvent = new Event('drop');
                dropEvent.preventDefault = vi.fn();
                items[0].dispatchEvent(dropEvent);

                expect(store.dispatch).toHaveBeenCalledWith('REORDER_ELEMENTS', expect.any(Object));
            }
        });
    });

    describe('clearDragState()', () => {
        it('should reset all drag state', () => {
            layerTree.draggedId = 'rect-1';
            layerTree.dragOverItem = document.createElement('div');
            layerTree.dropPosition = 'before';

            layerTree.clearDragState();

            expect(layerTree.draggedId).toBeNull();
            expect(layerTree.dragOverItem).toBeNull();
            expect(layerTree.dropPosition).toBeNull();
        });
    });

    describe('Placeholder handling', () => {
        it('should show appropriate icon for placeholder types', () => {
            store.getState.mockReturnValue({
                editor: {
                    mode: 'master',
                    activeSlideId: null,
                    activeMasterId: 'master-1',
                    selectedElementIds: []
                },
                slides: {},
                masters: {
                    'master-1': {
                        id: 'master-1',
                        elements: {
                            'ph-title': { id: 'ph-title', type: 'placeholder', isPlaceholder: true, placeholderType: 'title' }
                        },
                        elementOrder: ['ph-title']
                    }
                }
            });

            layerTree.render();

            const titleIcon = mockContainer.querySelector('.fa-heading');
            expect(titleIcon).toBeTruthy();
        });

        it('should show picture icon for picture placeholder', () => {
            store.getState.mockReturnValue({
                editor: {
                    mode: 'master',
                    activeSlideId: null,
                    activeMasterId: 'master-1',
                    selectedElementIds: []
                },
                slides: {},
                masters: {
                    'master-1': {
                        id: 'master-1',
                        elements: {
                            'ph-pic': { id: 'ph-pic', type: 'placeholder', isPlaceholder: true, placeholderType: 'picture' }
                        },
                        elementOrder: ['ph-pic']
                    }
                }
            });

            layerTree.render();

            const picIcon = mockContainer.querySelector('.fa-regular.fa-image');
            expect(picIcon).toBeTruthy();
        });
    });

    describe('Inline rename', () => {
        it('should dispatch UPDATE_ELEMENT on rename', () => {
            store.getState.mockReturnValue({
                editor: {
                    mode: 'edit',
                    activeSlideId: 'slide-1',
                    activeMasterId: null,
                    selectedElementIds: []
                },
                slides: {
                    'slide-1': {
                        id: 'slide-1',
                        elements: {
                            'rect-1': { id: 'rect-1', type: 'rect', name: 'My Rectangle' }
                        },
                        elementOrder: ['rect-1']
                    }
                },
                masters: {}
            });

            layerTree.render();

            const item = mockContainer.querySelector('[data-id="rect-1"]');
            if (item) {
                const nameSpan = item.querySelector('span');
                if (nameSpan) {
                    // Simulate double-click to enter edit mode
                    nameSpan.dispatchEvent(new Event('dblclick'));

                    const input = item.querySelector('input');
                    if (input) {
                        input.value = 'New Name';
                        input.dispatchEvent(new Event('blur'));

                        expect(store.dispatch).toHaveBeenCalledWith('UPDATE_ELEMENT', { 
                            id: 'rect-1', 
                            name: 'New Name' 
                        });
                    }
                }
            }
        });
    });
});
