/**
 * SlideSection Unit Tests
 * Tests layout picker functionality and integration with master slide system
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';

describe('SlideSection', () => {
    let dom;
    let document;
    let SlideSection;
    let store;
    let ThumbnailRenderer;

    beforeEach(async () => {
        // Setup DOM
        dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
            url: 'http://localhost',
            pretendToBeVisual: true,
        });
        document = dom.window.document;
        global.document = dom.window.document;
        global.window = dom.window;
        global.HTMLElement = dom.window.HTMLElement;
        global.Element = dom.window.Element;

        // Mock store
        const mockStore = {
            state: {
                editor: {
                    mode: 'slide',
                    activeSlideId: 'slide-1',
                    activeMasterId: null,
                    selectedElementIds: []
                },
                slides: {
                    'slide-1': {
                        id: 'slide-1',
                        layoutId: 'layout-title',
                        width: 1920,
                        height: 1080,
                        background: null,
                        elements: {},
                        elementOrder: []
                    }
                },
                slideMasterPresets: {
                    'master-default': {
                        id: 'master-default',
                        type: 'themeMaster',
                        name: 'Default Theme',
                        background: { type: 'solid', value: '#ffffff' },
                        elements: {},
                        elementOrder: []
                    },
                    'layout-title': {
                        id: 'layout-title',
                        type: 'layout',
                        name: 'Title Layout',
                        parentMasterId: 'master-default',
                        background: null,
                        elements: {
                            'ph-title': {
                                id: 'ph-title',
                                type: 'text',
                                isPlaceholder: true,
                                placeholderType: 'title',
                                x: 100,
                                y: 100,
                                width: 800,
                                height: 200
                            }
                        },
                        elementOrder: ['ph-title']
                    },
                    'layout-content': {
                        id: 'layout-content',
                        type: 'layout',
                        name: 'Content Layout',
                        parentMasterId: 'master-default',
                        background: null,
                        elements: {
                            'ph-content': {
                                id: 'ph-content',
                                type: 'text',
                                isPlaceholder: true,
                                placeholderType: 'content',
                                x: 100,
                                y: 300,
                                width: 1720,
                                height: 680
                            }
                        },
                        elementOrder: ['ph-content']
                    }
                }
            },
            subscribers: [],
            getState() {
                return this.state;
            },
            subscribe(callback) {
                this.subscribers.push(callback);
                return () => {
                    const index = this.subscribers.indexOf(callback);
                    if (index > -1) this.subscribers.splice(index, 1);
                };
            },
            dispatch(action, payload) {
                if (action === 'UPDATE_SLIDE' && payload.layoutId) {
                    // Simulate layout change
                    this.state.slides[payload.id].layoutId = payload.layoutId;
                }
                this.subscribers.forEach(callback => callback(this.state));
            },
            getEffectiveSlide(slideId) {
                const slide = this.state.slides[slideId];
                if (!slide) return null;
                
                const layout = this.state.slideMasterPresets[slide.layoutId];
                const theme = layout ? this.state.slideMasterPresets[layout.parentMasterId] : null;
                
                return {
                    ...slide,
                    effectiveBackground: slide.background || layout?.background || theme?.background || { type: 'solid', value: '#ffffff' },
                    effectiveElements: { ...layout?.elements, ...slide.elements },
                    effectiveOrder: [...(layout?.elementOrder || []), ...slide.elementOrder]
                };
            },
            getEffectiveMaster(masterId) {
                const master = this.state.slideMasterPresets[masterId];
                if (!master) return null;
                
                const parent = master.parentMasterId ? this.state.slideMasterPresets[master.parentMasterId] : null;
                
                return {
                    ...master,
                    effectiveBackground: master.background || parent?.background || { type: 'solid', value: '#ffffff' },
                    effectiveElements: { ...parent?.elements, ...master.elements },
                    effectiveOrder: [...(parent?.elementOrder || []), ...master.elementOrder]
                };
            }
        };

        // Mock ThumbnailRenderer
        const mockThumbnailRenderer = {
            createThumbnail: vi.fn((slideId, slideData) => {
                const container = document.createElement('div');
                container.className = 'thumbnail-container';
                container.dataset.slideId = slideId;
                return container;
            }),
            updateThumbnail: vi.fn(),
            invalidate: vi.fn(),
            destroyThumbnail: vi.fn()
        };

        // Mock modules
        vi.doMock('../../../src/core/Store.js', () => ({ store: mockStore }));
        vi.doMock('../../../src/core/renderer/ThumbnailRenderer.js', () => ({ 
            ThumbnailRenderer: mockThumbnailRenderer 
        }));

        // Mock UI components
        vi.doMock('../../../src/ui/components/Section.js', () => ({
            Section: class {
                constructor({ title }) {
                    this.element = global.document.createElement('div');
                    this.element.className = 'section';
                    this.title = title;
                }
                appendChild(el) {
                    this.element.appendChild(el);
                }
            }
        }));

        vi.doMock('../../../src/ui/components/Button.js', () => ({
            Button: class {
                constructor({ label, onClick }) {
                    this.element = global.document.createElement('button');
                    this.element.textContent = label;
                    this.element.onclick = onClick;
                    this.label = label;
                }
                setLabel(label) {
                    this.label = label;
                    this.element.textContent = label;
                }
            }
        }));

        vi.doMock('../../../src/ui/components/Dropdown.js', () => ({
            Dropdown: class {
                constructor({ onChange }) {
                    this.element = global.document.createElement('select');
                    this.onChange = onChange;
                }
                setValue(val) {
                    this.element.value = val;
                    if (this.onChange) this.onChange(val);
                }
            }
        }));

        vi.doMock('../../../src/ui/components/Flyout.js', () => ({
            Flyout: class {
                constructor({ trigger, content, position }) {
                    this.trigger = trigger;
                    this.content = content;
                    this.position = position;
                    this.isOpen = false;
                }
                open() {
                    this.isOpen = true;
                }
                close() {
                    this.isOpen = false;
                }
            }
        }));

        vi.doMock('../../../src/ui/components/TextInput.js', () => ({
            TextInput: class {
                constructor() {
                    this.element = global.document.createElement('input');
                }
            }
        }));

        vi.doMock('../../../src/ui/components/NumberInput.js', () => ({
            NumberInput: class {
                constructor() {
                    this.element = global.document.createElement('input');
                }
            }
        }));

        vi.doMock('../../../src/ui/properties/FillSection.js', () => ({
            FillSection: class {
                constructor() {
                    this.element = global.document.createElement('div');
                }
                update() {}
            }
        }));

        vi.doMock('../../../src/ui/components/ThemeSwatches.js', () => ({
            ThemeSwatches: class {
                constructor() {
                    this.element = global.document.createElement('div');
                }
            }
        }));

        vi.doMock('../../../src/ui/Icons.js', () => ({
            Icons: {
                SELECT: 'icon-select',
                TEXT: 'icon-text',
                SHAPE: 'icon-shape',
                IMAGE: 'icon-image',
                PLAY: 'icon-play',
                PAUSE: 'icon-pause',
                SETTINGS: 'icon-settings',
                MORE: 'icon-more',
                EDIT: 'icon-edit',
                TRASH: 'icon-trash',
                LOCK: 'icon-lock',
                UNLOCK: 'icon-unlock',
                VISIBLE: 'icon-visible',
                HIDDEN: 'icon-hidden',
                CHEVRON_RIGHT: 'icon-chevron-right',
                CHEVRON_DOWN: 'icon-chevron-down',
                PLUS: 'icon-plus',
                MINUS: 'icon-minus'
            }
        }));

        vi.doMock('../../../src/ui/PanelManager.js', () => ({
            panelManager: {
                register: vi.fn(),
                unregister: vi.fn()
            }
        }));

        // Import after mocks are set up
        try {
            const modules = await import('../../../src/ui/properties/SlideSection.js');
            SlideSection = modules.SlideSection;
            
            const storeModule = await import('../../../src/core/Store.js');
            store = storeModule.store;
            
            const thumbModule = await import('../../../src/core/renderer/ThumbnailRenderer.js');
            ThumbnailRenderer = thumbModule.ThumbnailRenderer;
        } catch (error) {
            console.error('Error importing modules in beforeEach:', error);
            throw error;
        }
    });

    afterEach(() => {
        vi.clearAllMocks();
        vi.resetModules();
    });

    describe('Layout Picker', () => {
        it('should create layout flyout with correct structure', () => {
            const slideSection = new SlideSection();
            
            // Simulate update to populate layouts
            slideSection.currentLayouts = [
                store.state.slideMasterPresets['layout-title'],
                store.state.slideMasterPresets['layout-content']
            ];
            slideSection.currentLayoutId = 'layout-title';
            slideSection.currentState = store.state;
            
            // Open flyout
            slideSection.openLayoutFlyout();
            
            expect(slideSection.layoutFlyout).toBeDefined();
            expect(slideSection.layoutFlyout.isOpen).toBe(true);
        });

        it('should use ThumbnailRenderer to create layout previews', () => {
            const slideSection = new SlideSection();
            
            slideSection.currentLayouts = [
                store.state.slideMasterPresets['layout-title'],
                store.state.slideMasterPresets['layout-content']
            ];
            slideSection.currentLayoutId = 'layout-title';
            slideSection.currentState = store.state;
            
            slideSection.openLayoutFlyout();
            
            // ThumbnailRenderer should be called for each layout
            expect(ThumbnailRenderer.createThumbnail).toHaveBeenCalledTimes(2);
            expect(ThumbnailRenderer.createThumbnail).toHaveBeenCalledWith(
                'layout-title',
                expect.objectContaining({ id: 'layout-title' })
            );
            expect(ThumbnailRenderer.createThumbnail).toHaveBeenCalledWith(
                'layout-content',
                expect.objectContaining({ id: 'layout-content' })
            );
        });

        it('should call store.getEffectiveMaster for each layout thumbnail', () => {
            const slideSection = new SlideSection();
            const getEffectiveMasterSpy = vi.spyOn(store, 'getEffectiveMaster');
            
            slideSection.currentLayouts = [
                store.state.slideMasterPresets['layout-title'],
                store.state.slideMasterPresets['layout-content']
            ];
            slideSection.currentLayoutId = 'layout-title';
            slideSection.currentState = store.state;
            
            slideSection.openLayoutFlyout();
            
            expect(getEffectiveMasterSpy).toHaveBeenCalledWith('layout-title');
            expect(getEffectiveMasterSpy).toHaveBeenCalledWith('layout-content');
        });

        it('should mark current layout as selected', () => {
            const slideSection = new SlideSection();
            
            slideSection.currentLayouts = [
                store.state.slideMasterPresets['layout-title'],
                store.state.slideMasterPresets['layout-content']
            ];
            slideSection.currentLayoutId = 'layout-title';
            slideSection.currentState = store.state;
            
            slideSection.openLayoutFlyout();
            
            const flyoutContent = slideSection.layoutFlyout.content;
            const thumbnails = flyoutContent.querySelectorAll('.layout-thumbnail');
            
            expect(thumbnails.length).toBe(2);
            
            // First thumbnail should be selected
            expect(thumbnails[0].classList.contains('selected')).toBe(true);
            expect(thumbnails[0].dataset.layoutId).toBe('layout-title');
            
            // Second should not be selected
            expect(thumbnails[1].classList.contains('selected')).toBe(false);
            expect(thumbnails[1].dataset.layoutId).toBe('layout-content');
        });

        it('should update layout when clicking a thumbnail', () => {
            const slideSection = new SlideSection();
            const dispatchSpy = vi.spyOn(store, 'dispatch');
            
            slideSection.currentLayouts = [
                store.state.slideMasterPresets['layout-title'],
                store.state.slideMasterPresets['layout-content']
            ];
            slideSection.currentLayoutId = 'layout-title';
            slideSection.currentState = store.state;
            
            slideSection.openLayoutFlyout();
            
            const flyoutContent = slideSection.layoutFlyout.content;
            const thumbnails = flyoutContent.querySelectorAll('.layout-thumbnail');
            
            // Click second thumbnail (content layout)
            thumbnails[1].click();
            
            expect(dispatchSpy).toHaveBeenCalledWith(
                'UPDATE_SLIDE',
                expect.objectContaining({ 
                    id: 'slide-1', 
                    layoutId: 'layout-content' 
                })
            );
        });

        it('should close flyout after selecting layout', () => {
            const slideSection = new SlideSection();
            
            slideSection.currentLayouts = [
                store.state.slideMasterPresets['layout-title'],
                store.state.slideMasterPresets['layout-content']
            ];
            slideSection.currentLayoutId = 'layout-title';
            slideSection.currentState = store.state;
            
            slideSection.openLayoutFlyout();
            expect(slideSection.layoutFlyout.isOpen).toBe(true);
            
            const flyoutContent = slideSection.layoutFlyout.content;
            const thumbnails = flyoutContent.querySelectorAll('.layout-thumbnail');
            
            thumbnails[1].click();
            
            expect(slideSection.layoutFlyout.isOpen).toBe(false);
        });

        it('should not update if clicking already selected layout', () => {
            const slideSection = new SlideSection();
            const dispatchSpy = vi.spyOn(store, 'dispatch');
            
            slideSection.currentLayouts = [
                store.state.slideMasterPresets['layout-title'],
                store.state.slideMasterPresets['layout-content']
            ];
            slideSection.currentLayoutId = 'layout-title';
            slideSection.currentState = store.state;
            
            slideSection.openLayoutFlyout();
            
            const flyoutContent = slideSection.layoutFlyout.content;
            const thumbnails = flyoutContent.querySelectorAll('.layout-thumbnail');
            
            dispatchSpy.mockClear();
            
            // Click first thumbnail (already selected)
            thumbnails[0].click();
            
            // Should not dispatch UPDATE_SLIDE
            expect(dispatchSpy).not.toHaveBeenCalledWith(
                'UPDATE_SLIDE',
                expect.anything(),
                expect.anything()
            );
        });

        it('should update button label when layout changes', () => {
            const slideSection = new SlideSection();
            
            slideSection.currentLayouts = [
                store.state.slideMasterPresets['layout-title'],
                store.state.slideMasterPresets['layout-content']
            ];
            slideSection.currentLayoutId = 'layout-title';
            slideSection.currentState = store.state;
            
            const initialLabel = slideSection.layoutTriggerBtn.label;
            
            slideSection.openLayoutFlyout();
            
            const flyoutContent = slideSection.layoutFlyout.content;
            const thumbnails = flyoutContent.querySelectorAll('.layout-thumbnail');
            
            thumbnails[1].click();
            
            expect(slideSection.layoutTriggerBtn.label).toBe('Content Layout');
            expect(slideSection.layoutTriggerBtn.label).not.toBe(initialLabel);
        });
    });

    describe('Integration with Master Slide System', () => {
        it('should respect cascading inheritance in thumbnails', () => {
            const slideSection = new SlideSection();
            
            // Update theme background
            store.state.slideMasterPresets['master-default'].background = {
                type: 'solid',
                value: '#ff0000'
            };
            
            slideSection.currentLayouts = [
                store.state.slideMasterPresets['layout-title']
            ];
            slideSection.currentLayoutId = 'layout-title';
            slideSection.currentState = store.state;
            
            slideSection.openLayoutFlyout();
            
            // Verify getEffectiveMaster returns theme background
            const effectiveMaster = store.getEffectiveMaster('layout-title');
            expect(effectiveMaster.effectiveBackground.value).toBe('#ff0000');
        });

        it('should handle explicit layout background overriding theme', () => {
            const slideSection = new SlideSection();
            
            // Set theme background
            store.state.slideMasterPresets['master-default'].background = {
                type: 'solid',
                value: '#ff0000'
            };
            
            // Set explicit layout background
            store.state.slideMasterPresets['layout-title'].background = {
                type: 'solid',
                value: '#00ff00'
            };
            
            slideSection.currentLayouts = [
                store.state.slideMasterPresets['layout-title']
            ];
            slideSection.currentLayoutId = 'layout-title';
            slideSection.currentState = store.state;
            
            slideSection.openLayoutFlyout();
            
            const effectiveMaster = store.getEffectiveMaster('layout-title');
            expect(effectiveMaster.effectiveBackground.value).toBe('#00ff00');
        });
    });
});
