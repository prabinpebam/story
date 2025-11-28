import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock dependencies
vi.mock('../../../../src/ui/components/DraggablePanel.js', () => ({
    DraggablePanel: class MockDraggablePanel {
        constructor(options = {}) {
            this.options = options;
            this.element = document.createElement('div');
            this.element.className = 'draggable-panel';
            this.headerElement = document.createElement('div');
            this.contentElement = document.createElement('div');
            this.element.appendChild(this.headerElement);
            this.element.appendChild(this.contentElement);
            document.body.appendChild(this.element);
            this.isOpen = false;
        }
        open() { this.isOpen = true; this.onOpen(); }
        close() { this.isOpen = false; this.onClose(); }
        toggle() { this.isOpen ? this.close() : this.open(); }
        onOpen() {}
        onClose() {}
        destroy() { this.element.remove(); }
    }
}));

vi.mock('../../../../src/ui/components/SegmentedControl.js', () => ({
    SegmentedControl: class MockSegmentedControl {
        constructor(options = {}) {
            this.element = document.createElement('div');
            this.element.className = 'segmented-control';
            this.options = options.options || [];
            this.value = options.value;
            this.onChange = options.onChange;
        }
    }
}));

vi.mock('../../../../src/ui/components/Dropdown.js', () => ({
    Dropdown: class MockDropdown {
        constructor(options = {}) {
            this.element = document.createElement('div');
            this.element.className = 'dropdown';
            this.value = options.value;
            this.onChange = options.onChange;
        }
    }
}));

vi.mock('../../../../src/core/Store.js', () => ({
    store: {
        getState: vi.fn(() => ({
            editor: {
                selectedElementIds: [],
                activeSlideId: 'slide-1',
                mode: 'slide'
            },
            slides: {
                'slide-1': {
                    elements: {},
                    background: { fills: [] }
                }
            },
            masters: {}
        })),
        on: vi.fn(),
        off: vi.fn(),
        dispatch: vi.fn(),
        snapshot: vi.fn()
    }
}));

vi.mock('../../../../src/core/effects/CodeRunner.js', () => ({
    CodeRunner: class MockCodeRunner {
        static DEFAULT_CODE = 'function render(ctx, w, h, t) {}';
        constructor(canvas) {
            this.canvas = canvas;
            this.ctx = canvas.getContext('2d');
            this.isPlaying = false;
            this.hasError = false;
        }
        setCode(code) { this.code = code; }
        run() { this.isPlaying = true; }
        play() { this.isPlaying = true; }
        pause() { this.isPlaying = false; }
        stop() { this.isPlaying = false; }
        reset() { this.isPlaying = false; }
    }
}));

vi.mock('../../../../src/core/services/PresetManager.js', () => ({
    PresetManager: {
        getBuiltInPresets: vi.fn(() => []),
        getUserPresets: vi.fn(() => []),
        saveUserPreset: vi.fn(),
        updateUserPreset: vi.fn(),
        deleteUserPreset: vi.fn(),
        duplicatePreset: vi.fn(),
        isNameTaken: vi.fn(() => false)
    }
}));

vi.mock('../../../../src/core/ai/AIService.js', () => ({
    AIService: class MockAIService {
        generate = vi.fn().mockResolvedValue('function render(ctx) {}')
    }
}));

vi.mock('../../../../src/core/ai/prompts/templates.js', () => ({
    CODE_FILL_PROMPT: 'test prompt {description}',
    CODE_FILL_UPDATE_PROMPT: 'update {existingCode} {request}',
    PROMPT_REFINEMENT_PROMPT: 'refine {userPrompt}'
}));

vi.mock('../../../../src/ui/Icons.js', () => ({
    Icons: {
        CURSOR: '↖',
        CODE: '</>',
        PLUS: '+',
        CLOSE: '×'
    }
}));

vi.mock('../../../../src/ui/panels/components/FillLayerBar.js', () => ({
    FillLayerBar: class MockFillLayerBar {
        constructor(options = {}) {
            this.element = document.createElement('div');
            this.element.className = 'fill-layer-bar';
            this.options = options;
        }
    }
}));

// Must reset singleton before importing
beforeEach(() => {
    vi.resetModules();
});

describe('CodeFillPanel', () => {
    let CodeFillPanel;
    let panel;
    let mockCanvas;

    beforeEach(async () => {
        document.body.innerHTML = '';
        
        // Mock canvas getContext
        mockCanvas = {
            getContext: vi.fn(() => ({
                clearRect: vi.fn(),
                fillRect: vi.fn(),
                beginPath: vi.fn(),
                arc: vi.fn(),
                fill: vi.fn(),
                stroke: vi.fn(),
                setTransform: vi.fn()
            })),
            width: 100,
            height: 100
        };
        
        HTMLCanvasElement.prototype.getContext = vi.fn(() => mockCanvas.getContext());
        
        // Import fresh module
        const module = await import('../../../../src/ui/panels/CodeFillPanel.js');
        CodeFillPanel = module.CodeFillPanel;
    });

    afterEach(() => {
        if (panel) {
            panel.destroy();
            panel = null;
        }
    });

    describe('singleton pattern', () => {
        it('should return same instance from getInstance', () => {
            const instance1 = CodeFillPanel.getInstance();
            const instance2 = CodeFillPanel.getInstance();
            
            expect(instance1).toBe(instance2);
            
            instance1.destroy();
        });

        it('should open panel via static method', () => {
            const openedPanel = CodeFillPanel.open();
            
            expect(openedPanel).toBeDefined();
            expect(openedPanel.isOpen).toBe(true);
            
            openedPanel.destroy();
        });

        it('should toggle panel via static method', () => {
            const toggled = CodeFillPanel.toggle();
            expect(toggled.isOpen).toBe(true);
            
            CodeFillPanel.toggle();
            expect(toggled.isOpen).toBe(false);
            
            toggled.destroy();
        });
    });

    describe('constructor', () => {
        it('should initialize with presets as active tab', () => {
            panel = new CodeFillPanel();
            expect(panel.activeTab).toBe('presets');
        });

        it('should initialize with no selection state', () => {
            panel = new CodeFillPanel();
            
            expect(panel.selectedCodeFillIndex).toBe(-1);
            expect(panel.currentFills).toEqual([]);
            expect(panel.currentElementId).toBeNull();
        });

        it('should set refine prompt enabled by default', () => {
            panel = new CodeFillPanel();
            expect(panel.refinePromptEnabled).toBe(true);
        });

        it('should create with correct panel options', () => {
            panel = new CodeFillPanel();
            
            expect(panel.options.id).toBe('code-fill-panel');
            expect(panel.options.title).toBe('Code Fill');
            expect(panel.options.defaultWidth).toBe(420);
        });
    });

    describe('buildUI', () => {
        it('should add panel-specific class', () => {
            panel = new CodeFillPanel();
            expect(panel.element.classList.contains('code-fill-panel')).toBe(true);
        });

        it('should create tab control', () => {
            panel = new CodeFillPanel();
            expect(panel.tabControl).toBeDefined();
        });

        it('should create fill bar container', () => {
            panel = new CodeFillPanel();
            expect(panel.fillBarContainer).toBeDefined();
        });

        it('should create context indicator', () => {
            panel = new CodeFillPanel();
            expect(panel.contextIndicator).toBeDefined();
        });

        it('should create presets content', () => {
            panel = new CodeFillPanel();
            expect(panel.presetsContent).toBeDefined();
        });

        it('should create custom content', () => {
            panel = new CodeFillPanel();
            expect(panel.customContent).toBeDefined();
        });

        it('should create empty state', () => {
            panel = new CodeFillPanel();
            expect(panel.emptyState).toBeDefined();
        });

        it('should create footer', () => {
            panel = new CodeFillPanel();
            expect(panel.footerElement).toBeDefined();
        });
    });

    describe('switchTab', () => {
        it('should switch to presets tab', () => {
            panel = new CodeFillPanel();
            panel.switchTab('presets');
            
            expect(panel.activeTab).toBe('presets');
        });

        it('should switch to custom tab', () => {
            panel = new CodeFillPanel();
            panel.currentElementId = 'test-element';
            panel.currentFills = [{ type: 'code', code: 'test' }];
            panel.selectedCodeFillIndex = 0;
            
            panel.switchTab('custom');
            
            expect(panel.activeTab).toBe('custom');
        });

        it('should show no-selection empty state when no element', () => {
            panel = new CodeFillPanel();
            panel.currentElementId = null;
            
            panel.switchTab('custom');
            
            expect(panel.emptyState.style.display).toBe('flex');
        });

        it('should show no-code-fills empty state on custom tab with no fills', () => {
            panel = new CodeFillPanel();
            panel.currentElementId = 'test-element';
            panel.currentFills = [];
            
            panel.switchTab('custom');
            
            expect(panel.emptyState.style.display).toBe('flex');
        });
    });

    describe('fill layer bar', () => {
        it('should update fill layer bar', () => {
            panel = new CodeFillPanel();
            panel.currentElementId = 'test';
            panel.currentFills = [{ type: 'code', code: 'test' }];
            
            panel.updateFillLayerBar();
            
            expect(panel.fillBarContainer.style.display).toBe('block');
        });

        it('should hide fill layer bar when no element', () => {
            panel = new CodeFillPanel();
            panel.currentElementId = null;
            
            panel.updateFillLayerBar();
            
            expect(panel.fillBarContainer.style.display).toBe('none');
        });
    });

    describe('handleFillSelect', () => {
        it('should select code fill', () => {
            panel = new CodeFillPanel();
            panel.currentElementId = 'test';
            panel.currentFills = [
                { type: 'solid', color: '#000' },
                { type: 'code', code: 'test' }
            ];
            
            panel.handleFillSelect(1);
            
            expect(panel.selectedCodeFillIndex).toBe(1);
        });

        it('should not select non-code fill', () => {
            panel = new CodeFillPanel();
            panel.currentElementId = 'test';
            panel.currentFills = [
                { type: 'solid', color: '#000' },
                { type: 'code', code: 'test' }
            ];
            panel.selectedCodeFillIndex = 1;
            
            panel.handleFillSelect(0);
            
            expect(panel.selectedCodeFillIndex).toBe(1);
        });
    });

    describe('handleAddCodeFill', () => {
        it('should not add fill when no element selected', () => {
            panel = new CodeFillPanel();
            panel.currentElementId = null;
            panel.currentFills = [];
            
            panel.handleAddCodeFill();
            
            expect(panel.currentFills.length).toBe(0);
        });

        it('should add new code fill', async () => {
            const { store } = await import('../../../../src/core/Store.js');
            
            panel = new CodeFillPanel();
            panel.currentElementId = 'test';
            panel.currentFills = [];
            
            panel.handleAddCodeFill();
            
            expect(panel.currentFills.length).toBe(1);
            expect(panel.currentFills[0].type).toBe('code');
            expect(store.dispatch).toHaveBeenCalled();
        });

        it('should select new fill', () => {
            panel = new CodeFillPanel();
            panel.currentElementId = 'test';
            panel.currentFills = [];
            
            panel.handleAddCodeFill();
            
            expect(panel.selectedCodeFillIndex).toBe(0);
        });

        it('should switch to custom tab', () => {
            panel = new CodeFillPanel();
            panel.currentElementId = 'test';
            panel.currentFills = [];
            
            panel.handleAddCodeFill();
            
            expect(panel.activeTab).toBe('custom');
        });
    });

    describe('handleDeleteCodeFill', () => {
        it('should delete fill at index', () => {
            panel = new CodeFillPanel();
            panel.currentElementId = 'test';
            panel.currentFills = [
                { type: 'code', code: 'test1' },
                { type: 'code', code: 'test2' }
            ];
            panel.selectedCodeFillIndex = 0;
            
            panel.handleDeleteCodeFill(0);
            
            expect(panel.currentFills.length).toBe(1);
            expect(panel.currentFills[0].code).toBe('test2');
        });

        it('should update selection after delete', () => {
            panel = new CodeFillPanel();
            panel.currentElementId = 'test';
            panel.currentFills = [
                { type: 'code', code: 'test1' },
                { type: 'code', code: 'test2' }
            ];
            panel.selectedCodeFillIndex = 1;
            
            panel.handleDeleteCodeFill(1);
            
            expect(panel.selectedCodeFillIndex).toBe(0);
        });
    });

    describe('handleDuplicateFill', () => {
        it('should duplicate code fill', () => {
            panel = new CodeFillPanel();
            panel.currentElementId = 'test';
            panel.currentFills = [{ type: 'code', code: 'test' }];
            panel.selectedCodeFillIndex = 0;
            
            panel.handleDuplicateFill(0);
            
            expect(panel.currentFills.length).toBe(2);
        });

        it('should select duplicated fill', () => {
            panel = new CodeFillPanel();
            panel.currentElementId = 'test';
            panel.currentFills = [{ type: 'code', code: 'test' }];
            panel.selectedCodeFillIndex = 0;
            
            panel.handleDuplicateFill(0);
            
            expect(panel.selectedCodeFillIndex).toBe(1);
        });

        it('should not duplicate non-code fill', () => {
            panel = new CodeFillPanel();
            panel.currentElementId = 'test';
            panel.currentFills = [{ type: 'solid', color: '#000' }];
            
            panel.handleDuplicateFill(0);
            
            expect(panel.currentFills.length).toBe(1);
        });
    });

    describe('findFirstCodeFillIndex', () => {
        it('should find first code fill', () => {
            panel = new CodeFillPanel();
            
            const fills = [
                { type: 'solid' },
                { type: 'code' },
                { type: 'gradient' }
            ];
            
            expect(panel.findFirstCodeFillIndex(fills)).toBe(1);
        });

        it('should return -1 if no code fill', () => {
            panel = new CodeFillPanel();
            
            const fills = [{ type: 'solid' }, { type: 'gradient' }];
            
            expect(panel.findFirstCodeFillIndex(fills)).toBe(-1);
        });
    });

    describe('createPresetsTab', () => {
        it('should create search input', () => {
            panel = new CodeFillPanel();
            
            const searchInput = panel.presetsContent.querySelector('.cfp-search-input');
            expect(searchInput).toBeDefined();
        });

        it('should create preset grid', () => {
            panel = new CodeFillPanel();
            
            expect(panel.presetGrid).toBeDefined();
        });

        it('should create category dropdown', () => {
            panel = new CodeFillPanel();
            
            expect(panel.categoryDropdown).toBeDefined();
        });
    });

    describe('createCustomTab', () => {
        it('should create preview canvas', () => {
            panel = new CodeFillPanel();
            
            expect(panel.previewCanvas).toBeDefined();
            expect(panel.previewCanvas.width).toBe(360);
            expect(panel.previewCanvas.height).toBe(180);
        });

        it('should create playback controls', () => {
            panel = new CodeFillPanel();
            
            expect(panel.playPauseBtn).toBeDefined();
            expect(panel.resetBtn).toBeDefined();
        });

        it('should create AI prompt input', () => {
            panel = new CodeFillPanel();
            
            expect(panel.aiPromptInput).toBeDefined();
        });

        it('should create AI generation buttons', () => {
            panel = new CodeFillPanel();
            
            expect(panel.aiUpdateBtn).toBeDefined();
            expect(panel.aiGenerateBtn).toBeDefined();
        });

        it('should create error indicator', () => {
            panel = new CodeFillPanel();
            
            expect(panel.errorIndicator).toBeDefined();
        });
    });

    describe('empty state', () => {
        it('should show no-selection empty state', () => {
            panel = new CodeFillPanel();
            panel.showEmptyState('no-selection');
            
            expect(panel.emptyStateTitle.textContent).toBe('Select an object');
        });

        it('should show no-code-fills empty state', () => {
            panel = new CodeFillPanel();
            panel.showEmptyState('no-code-fills');
            
            expect(panel.emptyStateTitle.textContent).toBe('No code fills yet');
            expect(panel.emptyStateCTA.style.display).toBe('block');
        });

        it('should hide empty state', () => {
            panel = new CodeFillPanel();
            panel.showEmptyState('no-selection');
            
            panel.hideEmptyState();
            
            expect(panel.emptyState.style.display).toBe('none');
        });
    });

    describe('lifecycle', () => {
        it('should subscribe to store on open', async () => {
            const { store } = await import('../../../../src/core/Store.js');
            
            panel = new CodeFillPanel();
            panel.onOpen();
            
            expect(store.on).toHaveBeenCalledWith('state-changed', expect.any(Function));
        });

        it('should unsubscribe from store on close', async () => {
            const { store } = await import('../../../../src/core/Store.js');
            
            panel = new CodeFillPanel();
            panel.onClose();
            
            expect(store.off).toHaveBeenCalledWith('state-changed', expect.any(Function));
        });

        it('should stop runner on close', () => {
            panel = new CodeFillPanel();
            panel.runner = { stop: vi.fn() };
            
            panel.onClose();
            
            expect(panel.runner.stop).toHaveBeenCalled();
        });
    });

    describe('footer', () => {
        it('should create save preset button', () => {
            panel = new CodeFillPanel();
            
            const saveBtn = panel.footerElement.querySelector('.cfp-btn');
            expect(saveBtn.textContent).toBe('Save as Preset');
        });
    });
});
