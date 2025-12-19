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
                        type: 'slideMasterPreset',
                        name: 'Default Master',
                        background: { type: 'solid', value: '#ffffff' },
                        elements: {},
                        elementOrder: [],
                        layoutIds: ['layout-title', 'layout-content']
                    },
                    'layout-title': {
                        id: 'layout-title',
                        type: 'layoutMaster',
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
                        type: 'layoutMaster',
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
                    this.collapsed = false;

                    this.element = global.document.createElement('div');
                    this.element.className = 'pi-section';

                    this.header = global.document.createElement('div');
                    this.header.className = 'pi-section__header';
                    this.header.setAttribute('role', 'button');
                    this.header.setAttribute('tabindex', '0');
                    this.header.setAttribute('aria-expanded', 'true');

                    const titleGroup = global.document.createElement('div');
                    titleGroup.className = 'pi-section__title-group';

                    const titleEl = global.document.createElement('div');
                    titleEl.className = 'pi-section__title';
                    titleEl.textContent = title;
                    titleGroup.appendChild(titleEl);

                    this.actionsGroup = global.document.createElement('div');
                    this.actionsGroup.className = 'pi-section__actions';
                    this.actionsGroup.addEventListener('click', (e) => e.stopPropagation());
                    this.actionsGroup.addEventListener('keydown', (e) => e.stopPropagation());

                    this.header.addEventListener('click', () => {
                        this.collapsed = !this.collapsed;
                        this.header.setAttribute('aria-expanded', String(!this.collapsed));
                    });

                    this.header.appendChild(titleGroup);
                    this.header.appendChild(this.actionsGroup);

                    this.content = global.document.createElement('div');
                    this.content.className = 'pi-section__content';

                    this.element.appendChild(this.header);
                    this.element.appendChild(this.content);
                }
                appendChild(el) {
                    this.content.appendChild(el);
                }
            }
        }));

        vi.doMock('../../../src/ui/components/Button.js', () => ({
            Button: class {
                constructor({ label, title, icon, className, onClick, dataTestId }) {
                    this.element = global.document.createElement('button');
                    if (className) this.element.className = className;
                    if (title) {
                        this.element.setAttribute('title', title);
                        this.element.setAttribute('aria-label', title);
                    }
                    if (dataTestId) {
                        this.element.setAttribute('data-testid', dataTestId);
                    }
                    if (icon) {
                        this.element.innerHTML = icon;
                    } else {
                        this.element.textContent = label || '';
                    }
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
                unregister: vi.fn(),
                toggle: vi.fn()
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
            const titleThumb = flyoutContent.querySelector('.layout-thumbnail[data-layout-id="layout-title"]');
            const contentThumb = flyoutContent.querySelector('.layout-thumbnail[data-layout-id="layout-content"]');

            expect(titleThumb).toBeTruthy();
            expect(contentThumb).toBeTruthy();

            expect(titleThumb.classList.contains('selected')).toBe(true);
            expect(contentThumb.classList.contains('selected')).toBe(false);
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
            const contentThumb = flyoutContent.querySelector('.layout-thumbnail[data-layout-id="layout-content"]');
            expect(contentThumb).toBeTruthy();

            // Click content layout
            contentThumb.click();
            
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
            const contentThumb = flyoutContent.querySelector('.layout-thumbnail[data-layout-id="layout-content"]');
            expect(contentThumb).toBeTruthy();

            contentThumb.click();
            
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
            const titleThumb = flyoutContent.querySelector('.layout-thumbnail[data-layout-id="layout-title"]');
            expect(titleThumb).toBeTruthy();
            
            dispatchSpy.mockClear();
            
            // Click first thumbnail (already selected)
            titleThumb.click();
            
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
            const contentThumb = flyoutContent.querySelector('.layout-thumbnail[data-layout-id="layout-content"]');
            expect(contentThumb).toBeTruthy();

            contentThumb.click();
            
            expect(slideSection.layoutTriggerBtn.label).toBe('Content Layout');
            expect(slideSection.layoutTriggerBtn.label).not.toBe(initialLabel);
        });
    });

    describe('Theme Header Controls', () => {
        const getSectionByTitle = (root, title) => {
            return Array.from(root.querySelectorAll('.pi-section')).find(sec => {
                const titleEl = sec.querySelector('.pi-section__title');
                return titleEl && titleEl.textContent === title;
            }) || null;
        };

        it('should render Colors controls in the section header actions', () => {
            const slideSection = new SlideSection();

            const colorsSection = getSectionByTitle(slideSection.element, 'Colors');
            expect(colorsSection).toBeTruthy();

            const header = colorsSection.querySelector('.pi-section__header');
            const actions = colorsSection.querySelector('.pi-section__actions');
            const content = colorsSection.querySelector('.pi-section__content');

            expect(header).toBeTruthy();
            expect(actions).toBeTruthy();
            expect(content).toBeTruthy();

            expect(actions.querySelector('[data-testid="color-theme-inherited-badge"]')).toBeTruthy();
            expect(actions.querySelector('[data-testid="color-theme-reset-btn"]')).toBeTruthy();
            expect(content.querySelector('[data-testid="color-theme-inherited-badge"]')).toBeNull();

            // Clicking inside actions should not toggle collapse.
            expect(header.getAttribute('aria-expanded')).toBe('true');
            actions.querySelector('[data-testid="color-theme-inherited-badge"]').click();
            expect(header.getAttribute('aria-expanded')).toBe('true');

            const editBtn = actions.querySelector('button[title="Edit colors"]');
            expect(editBtn).toBeTruthy();
            editBtn.click();
            expect(header.getAttribute('aria-expanded')).toBe('true');
        });

        it('should render Typography controls in the section header actions', () => {
            const slideSection = new SlideSection();

            const typoSection = getSectionByTitle(slideSection.element, 'Typography');
            expect(typoSection).toBeTruthy();

            const header = typoSection.querySelector('.pi-section__header');
            const actions = typoSection.querySelector('.pi-section__actions');
            const content = typoSection.querySelector('.pi-section__content');

            expect(header).toBeTruthy();
            expect(actions).toBeTruthy();
            expect(content).toBeTruthy();

            expect(actions.querySelector('[data-testid="typography-inherited-badge"]')).toBeTruthy();
            expect(actions.querySelector('[data-testid="typography-reset-btn"]')).toBeTruthy();
            expect(content.querySelector('[data-testid="typography-inherited-badge"]')).toBeNull();

            // Clicking inside actions should not toggle collapse.
            expect(header.getAttribute('aria-expanded')).toBe('true');
            actions.querySelector('[data-testid="typography-inherited-badge"]').click();
            expect(header.getAttribute('aria-expanded')).toBe('true');

            const editBtn = actions.querySelector('button[title="Edit typography"]');
            expect(editBtn).toBeTruthy();
            editBtn.click();
            expect(header.getAttribute('aria-expanded')).toBe('true');
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
