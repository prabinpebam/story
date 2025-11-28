import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock store
vi.mock('../../../src/core/Store.js', () => ({
    store: {
        dispatch: vi.fn(),
        getState: vi.fn(() => ({
            editor: { mode: 'slide' }
        })),
        on: vi.fn(),
        off: vi.fn()
    }
}));

import { LeftPanel } from '../../../src/ui/LeftPanel.js';
import { store } from '../../../src/core/Store.js';

describe('LeftPanel', () => {
    let container;
    let slideList;
    let layerTree;
    let localStorageMock;

    beforeEach(() => {
        vi.clearAllMocks();
        
        // Setup localStorage mock
        localStorageMock = {
            data: {},
            getItem: vi.fn((key) => localStorageMock.data[key] || null),
            setItem: vi.fn((key, value) => { localStorageMock.data[key] = value; }),
            removeItem: vi.fn((key) => { delete localStorageMock.data[key]; }),
            clear: vi.fn(() => { localStorageMock.data = {}; })
        };
        vi.stubGlobal('localStorage', localStorageMock);
        
        // Create DOM structure
        container = document.createElement('div');
        container.className = 'sidebar-content';
        
        slideList = document.createElement('div');
        slideList.id = 'slide-list';
        
        layerTree = document.createElement('div');
        layerTree.id = 'layer-tree';
        
        document.body.appendChild(container);
        document.body.appendChild(slideList);
        document.body.appendChild(layerTree);
    });

    afterEach(() => {
        container.remove();
        slideList.remove();
        layerTree.remove();
        vi.unstubAllGlobals();
    });

    describe('initialization', () => {
        it('creates accordion structure', () => {
            const panel = new LeftPanel();
            expect(panel.slidesSection).toBeDefined();
            expect(panel.layersSection).toBeDefined();
        });

        it('creates resizer element', () => {
            const panel = new LeftPanel();
            expect(panel.resizer).toBeDefined();
            expect(panel.resizer.className).toBe('panel-resizer');
        });

        it('uses default expanded state', () => {
            const panel = new LeftPanel();
            expect(panel.slidesExpanded).toBe(true);
            expect(panel.layersExpanded).toBe(true);
        });

        it('uses default split ratio', () => {
            const panel = new LeftPanel();
            expect(panel.splitRatio).toBe(0.5);
        });

        it('loads saved state from localStorage', () => {
            localStorageMock.data.leftPanelState = JSON.stringify({
                slidesExpanded: false,
                layersExpanded: true,
                splitRatio: 0.7
            });
            
            const panel = new LeftPanel();
            expect(panel.slidesExpanded).toBe(false);
            expect(panel.layersExpanded).toBe(true);
            expect(panel.splitRatio).toBe(0.7);
        });

        it('handles invalid localStorage data gracefully', () => {
            localStorageMock.data.leftPanelState = 'invalid json';
            
            expect(() => new LeftPanel()).not.toThrow();
        });

        it('listens for state changes', () => {
            new LeftPanel();
            expect(store.on).toHaveBeenCalledWith('state-changed', expect.any(Function));
        });
    });

    describe('createSection', () => {
        it('creates wrapper element', () => {
            const panel = new LeftPanel();
            const section = panel.createSection('test', 'TEST', true);
            
            expect(section.wrapper).toBeDefined();
            expect(section.wrapper.className).toContain('accordion-section');
        });

        it('creates expanded section correctly', () => {
            const panel = new LeftPanel();
            const section = panel.createSection('test', 'TEST', true);
            
            expect(section.wrapper.classList.contains('expanded')).toBe(true);
            expect(section.wrapper.classList.contains('collapsed')).toBe(false);
        });

        it('creates collapsed section correctly', () => {
            const panel = new LeftPanel();
            const section = panel.createSection('test', 'TEST', false);
            
            expect(section.wrapper.classList.contains('collapsed')).toBe(true);
            expect(section.wrapper.classList.contains('expanded')).toBe(false);
        });

        it('sets section title', () => {
            const panel = new LeftPanel();
            const section = panel.createSection('test', 'MY TITLE', true);
            
            expect(section.titleEl.textContent).toBe('MY TITLE');
        });

        it('sets correct chevron for expanded state', () => {
            const panel = new LeftPanel();
            const section = panel.createSection('test', 'TEST', true);
            
            expect(section.chevron.className).toContain('fa-chevron-down');
        });

        it('sets correct chevron for collapsed state', () => {
            const panel = new LeftPanel();
            const section = panel.createSection('test', 'TEST', false);
            
            expect(section.chevron.className).toContain('fa-chevron-right');
        });
    });

    describe('toggleSection', () => {
        it('toggles slides section', () => {
            const panel = new LeftPanel();
            expect(panel.slidesExpanded).toBe(true);
            
            panel.toggleSection('slides');
            expect(panel.slidesExpanded).toBe(false);
            
            panel.toggleSection('slides');
            expect(panel.slidesExpanded).toBe(true);
        });

        it('toggles layers section', () => {
            const panel = new LeftPanel();
            expect(panel.layersExpanded).toBe(true);
            
            panel.toggleSection('layers');
            expect(panel.layersExpanded).toBe(false);
            
            panel.toggleSection('layers');
            expect(panel.layersExpanded).toBe(true);
        });

        it('updates CSS classes on toggle', () => {
            const panel = new LeftPanel();
            
            panel.toggleSection('slides');
            expect(panel.slidesSection.wrapper.classList.contains('collapsed')).toBe(true);
            
            panel.toggleSection('slides');
            expect(panel.slidesSection.wrapper.classList.contains('expanded')).toBe(true);
        });

        it('updates chevron on toggle', () => {
            const panel = new LeftPanel();
            
            panel.toggleSection('slides');
            expect(panel.slidesSection.chevron.className).toContain('fa-chevron-right');
            
            panel.toggleSection('slides');
            expect(panel.slidesSection.chevron.className).toContain('fa-chevron-down');
        });

        it('saves state after toggle', () => {
            const panel = new LeftPanel();
            vi.clearAllMocks();
            
            panel.toggleSection('slides');
            
            expect(localStorageMock.setItem).toHaveBeenCalled();
        });
    });

    describe('updateLayout', () => {
        it('shows resizer when both expanded', () => {
            const panel = new LeftPanel();
            panel.slidesExpanded = true;
            panel.layersExpanded = true;
            
            panel.updateLayout();
            
            expect(panel.resizer.style.display).toBe('block');
        });

        it('hides resizer when one collapsed', () => {
            const panel = new LeftPanel();
            panel.slidesExpanded = true;
            panel.layersExpanded = false;
            
            panel.updateLayout();
            
            expect(panel.resizer.style.display).toBe('none');
        });

        it('hides both contents when both collapsed', () => {
            const panel = new LeftPanel();
            panel.slidesExpanded = false;
            panel.layersExpanded = false;
            
            panel.updateLayout();
            
            expect(panel.slidesSection.content.style.display).toBe('none');
            expect(panel.layersSection.content.style.display).toBe('none');
        });

        it('shows only slides content when only slides expanded', () => {
            const panel = new LeftPanel();
            panel.slidesExpanded = true;
            panel.layersExpanded = false;
            
            panel.updateLayout();
            
            expect(panel.slidesSection.content.style.display).toBe('block');
            expect(panel.layersSection.content.style.display).toBe('none');
        });

        it('shows only layers content when only layers expanded', () => {
            const panel = new LeftPanel();
            panel.slidesExpanded = false;
            panel.layersExpanded = true;
            
            panel.updateLayout();
            
            expect(panel.slidesSection.content.style.display).toBe('none');
            expect(panel.layersSection.content.style.display).toBe('block');
        });
    });

    describe('saveState', () => {
        it('saves current state to localStorage', () => {
            const panel = new LeftPanel();
            panel.slidesExpanded = false;
            panel.layersExpanded = true;
            panel.splitRatio = 0.3;
            
            panel.saveState();
            
            expect(localStorageMock.setItem).toHaveBeenCalledWith(
                'leftPanelState',
                expect.any(String)
            );
            
            const savedData = JSON.parse(localStorageMock.data.leftPanelState);
            expect(savedData.slidesExpanded).toBe(false);
            expect(savedData.layersExpanded).toBe(true);
            expect(savedData.splitRatio).toBe(0.3);
        });

        it('handles localStorage errors gracefully', () => {
            const panel = new LeftPanel();
            localStorageMock.setItem.mockImplementation(() => {
                throw new Error('Storage full');
            });
            
            expect(() => panel.saveState()).not.toThrow();
        });
    });

    describe('updateSlidesTitle', () => {
        it('shows SLIDES in slide mode', () => {
            store.getState.mockReturnValue({ editor: { mode: 'slide' } });
            const panel = new LeftPanel();
            
            panel.updateSlidesTitle();
            
            expect(panel.slidesSection.titleEl.textContent).toBe('SLIDES');
        });

        it('shows MASTERS in master mode', () => {
            store.getState.mockReturnValue({ editor: { mode: 'master' } });
            const panel = new LeftPanel();
            
            panel.updateSlidesTitle();
            
            expect(panel.slidesSection.titleEl.textContent).toBe('MASTERS');
        });
    });

    describe('header click behavior', () => {
        it('toggles section on header click', () => {
            const panel = new LeftPanel();
            expect(panel.slidesExpanded).toBe(true);
            
            panel.slidesSection.header.click();
            
            expect(panel.slidesExpanded).toBe(false);
        });
    });

    describe('resizer', () => {
        it('has correct class name', () => {
            const panel = new LeftPanel();
            expect(panel.resizer.className).toBe('panel-resizer');
        });

        it('is a child of container', () => {
            const panel = new LeftPanel();
            expect(panel.resizer.parentNode).toBe(panel.container);
        });
    });
});
