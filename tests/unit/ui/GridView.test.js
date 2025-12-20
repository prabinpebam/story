import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Use vi.hoisted() for mock functions
const { mockOn, mockDispatch, mockGetState } = vi.hoisted(() => ({
    mockOn: vi.fn(),
    mockDispatch: vi.fn(),
    mockGetState: vi.fn(() => ({
        editor: { mode: 'presentation' },
        presentation: { 
            gridView: true,
            currentSlideIndex: 0
        },
        slideOrder: ['slide-1', 'slide-2', 'slide-3'],
        slides: {
            'slide-1': { id: 'slide-1', title: 'Introduction' },
            'slide-2': { id: 'slide-2', title: 'Content' },
            'slide-3': { id: 'slide-3', title: '' }
        }
    }))
}));

// Mock store
vi.mock('../../../src/core/Store.js', () => ({
    store: {
        on: mockOn,
        dispatch: mockDispatch,
        getState: mockGetState
    }
}));

import { GridView } from '../../../src/ui/GridView.js';

describe('GridView', () => {
    let gridView;
    let container;
    let content;
    let closeBtn;
    let stateChangedHandler;

    beforeEach(() => {
        vi.clearAllMocks();
        
        // Reset mock state
        mockGetState.mockReturnValue({
            editor: { mode: 'presentation' },
            presentation: { 
                gridView: true,
                currentSlideIndex: 0
            },
            slideOrder: ['slide-1', 'slide-2', 'slide-3'],
            slides: {
                'slide-1': { id: 'slide-1', title: 'Introduction' },
                'slide-2': { id: 'slide-2', title: 'Content' },
                'slide-3': { id: 'slide-3', title: '' }
            }
        });
        
        // Capture store.on handler
        mockOn.mockImplementation((event, handler) => {
            if (event === 'state-changed') stateChangedHandler = handler;
        });
        
        // Create container elements in DOM
        container = document.createElement('div');
        container.id = 'grid-view';
        
        content = document.createElement('div');
        content.id = 'grid-content';
        container.appendChild(content);
        
        closeBtn = document.createElement('button');
        closeBtn.id = 'close-grid-btn';
        container.appendChild(closeBtn);
        
        document.body.appendChild(container);
        
        gridView = new GridView('grid-view');
    });

    afterEach(() => {
        if (container && container.parentNode) {
            container.parentNode.removeChild(container);
        }
        vi.restoreAllMocks();
    });

    describe('constructor', () => {
        it('should create an instance', () => {
            expect(gridView).toBeDefined();
            expect(gridView instanceof GridView).toBe(true);
        });

        it('should find container element', () => {
            expect(gridView.container).toBe(container);
        });

        it('should find content element', () => {
            expect(gridView.content).toBe(content);
        });

        it('should find close button', () => {
            expect(gridView.closeBtn).toBe(closeBtn);
        });

        it('should subscribe to state-changed event', () => {
            expect(mockOn).toHaveBeenCalledWith('state-changed', expect.any(Function));
        });
    });

    describe('close button', () => {
        it('should dispatch TOGGLE_GRID_VIEW on click', () => {
            closeBtn.click();
            
            expect(mockDispatch).toHaveBeenCalledWith('TOGGLE_GRID_VIEW');
        });
    });

    describe('update()', () => {
        it('should remove hidden class when grid visible in presentation mode', () => {
            container.classList.add('hidden');
            
            gridView.update({
                editor: { mode: 'presentation' },
                presentation: { gridView: true, currentSlideIndex: 0 },
                slideOrder: [],
                slides: {}
            });
            
            expect(container.classList.contains('hidden')).toBe(false);
        });

        it('should add hidden class when grid not visible', () => {
            gridView.update({
                editor: { mode: 'presentation' },
                presentation: { gridView: false, currentSlideIndex: 0 },
                slideOrder: [],
                slides: {}
            });
            
            expect(container.classList.contains('hidden')).toBe(true);
        });

        it('should add hidden class when not in presentation mode', () => {
            gridView.update({
                editor: { mode: 'edit' },
                presentation: { gridView: true, currentSlideIndex: 0 },
                slideOrder: [],
                slides: {}
            });
            
            expect(container.classList.contains('hidden')).toBe(true);
        });

        it('should call render when visible', () => {
            const renderSpy = vi.spyOn(gridView, 'render');
            
            gridView.update({
                editor: { mode: 'presentation' },
                presentation: { gridView: true, currentSlideIndex: 0 },
                slideOrder: ['slide-1'],
                slides: { 'slide-1': { id: 'slide-1', title: 'Test' } }
            });
            
            expect(renderSpy).toHaveBeenCalled();
        });
    });

    describe('render()', () => {
        const mockState = {
            editor: { mode: 'presentation' },
            presentation: { gridView: true, currentSlideIndex: 0 },
            slideOrder: ['slide-1', 'slide-2', 'slide-3'],
            slides: {
                'slide-1': { id: 'slide-1', title: 'Introduction' },
                'slide-2': { id: 'slide-2', title: 'Content' },
                'slide-3': { id: 'slide-3', title: '' }
            }
        };

        beforeEach(() => {
            gridView.update(mockState);
        });

        it('should render slide items', () => {
            const items = content.querySelectorAll('.grid-slide-item');
            expect(items.length).toBe(3);
        });

        it('should mark active slide', () => {
            const activeItem = content.querySelector('.grid-slide-item.active');
            expect(activeItem).toBeDefined();
        });

        it('should display slide titles', () => {
            const titles = content.querySelectorAll('.slide-title');
            expect(titles[0].innerText).toBe('Introduction');
            expect(titles[1].innerText).toBe('Content');
        });

        it('should display default title for untitled slides', () => {
            const titles = content.querySelectorAll('.slide-title');
            expect(titles[2].innerText).toBe('Slide 3');
        });

        it('should display slide numbers', () => {
            const numbers = content.querySelectorAll('.slide-number');
            expect(String(numbers[0].innerText)).toBe('1');
            expect(String(numbers[1].innerText)).toBe('2');
            expect(String(numbers[2].innerText)).toBe('3');
        });

        it('should have slide preview elements', () => {
            const previews = content.querySelectorAll('.slide-preview');
            expect(previews.length).toBe(3);
        });
    });

    describe('slide item click', () => {
        beforeEach(() => {
            gridView.update({
                editor: { mode: 'presentation' },
                presentation: { gridView: true, currentSlideIndex: 0 },
                slideOrder: ['slide-1', 'slide-2'],
                slides: {
                    'slide-1': { id: 'slide-1', title: 'Slide 1' },
                    'slide-2': { id: 'slide-2', title: 'Slide 2' }
                }
            });
        });

        it('should dispatch PRESENTATION_GOTO on click', () => {
            const items = content.querySelectorAll('.grid-slide-item');
            items[1].click();
            
            expect(mockDispatch).toHaveBeenCalledWith('PRESENTATION_JUMP_TO', { index: 1, source: 'grid' });
        });

        it('should dispatch TOGGLE_GRID_VIEW on click', () => {
            const items = content.querySelectorAll('.grid-slide-item');
            items[0].click();
            
            expect(mockDispatch).toHaveBeenCalledWith('TOGGLE_GRID_VIEW');
        });
    });

    describe('active slide highlighting', () => {
        it('should highlight first slide when currentSlideIndex is 0', () => {
            gridView.update({
                editor: { mode: 'presentation' },
                presentation: { gridView: true, currentSlideIndex: 0 },
                slideOrder: ['slide-1', 'slide-2'],
                slides: {
                    'slide-1': { id: 'slide-1', title: 'Slide 1' },
                    'slide-2': { id: 'slide-2', title: 'Slide 2' }
                }
            });
            
            const items = content.querySelectorAll('.grid-slide-item');
            expect(items[0].classList.contains('active')).toBe(true);
            expect(items[1].classList.contains('active')).toBe(false);
        });

        it('should highlight second slide when currentSlideIndex is 1', () => {
            gridView.update({
                editor: { mode: 'presentation' },
                presentation: { gridView: true, currentSlideIndex: 1 },
                slideOrder: ['slide-1', 'slide-2'],
                slides: {
                    'slide-1': { id: 'slide-1', title: 'Slide 1' },
                    'slide-2': { id: 'slide-2', title: 'Slide 2' }
                }
            });
            
            const items = content.querySelectorAll('.grid-slide-item');
            expect(items[0].classList.contains('active')).toBe(false);
            expect(items[1].classList.contains('active')).toBe(true);
        });
    });

    describe('state-changed handler', () => {
        it('should update grid when state changes', () => {
            const updateSpy = vi.spyOn(gridView, 'update');
            
            stateChangedHandler({
                editor: { mode: 'presentation' },
                presentation: { gridView: true, currentSlideIndex: 0 },
                slideOrder: [],
                slides: {}
            });
            
            expect(updateSpy).toHaveBeenCalled();
        });
    });

    describe('no container', () => {
        it('should handle missing container gracefully', () => {
            const noContainer = new GridView('non-existent-id');
            
            expect(noContainer.container).toBeNull();
        });

        it('should not throw on update() without container', () => {
            const noContainer = new GridView('non-existent-id');
            
            expect(() => noContainer.update({})).not.toThrow();
        });
    });

    describe('no content element', () => {
        it('should not throw on render() without content', () => {
            // Create grid view with container but no content
            const containerOnly = document.createElement('div');
            containerOnly.id = 'container-only';
            document.body.appendChild(containerOnly);
            
            const view = new GridView('container-only');
            
            expect(() => view.render({
                slideOrder: ['slide-1'],
                slides: { 'slide-1': { title: 'Test' } },
                presentation: { currentSlideIndex: 0 }
            })).not.toThrow();
            
            containerOnly.remove();
        });
    });
});
