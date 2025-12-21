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

        // StyleResolver accesses the store via a window global.
        dom.window._storyAppStore = mockStore;
        global.window._storyAppStore = mockStore;

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

                    this._titleEl = titleEl;
                }
                setTitle(title) {
                    if (this._titleEl) this._titleEl.textContent = title;
                }
                appendChild(el) {
                    this.content.appendChild(el);
                }
            }
        }));

        vi.doMock('../../../src/ui/components/Button.js', () => ({
            Button: class {
                constructor({ label, title, ariaLabel, icon, className, onClick, dataTestId, active } = {}) {
                    this.element = global.document.createElement('button');
                    if (className) this.element.className = className;
                    if (title) {
                        this.element.setAttribute('title', title);
                        this.element.setAttribute('aria-label', title);
                    }
                    if (ariaLabel) {
                        this.element.setAttribute('aria-label', ariaLabel);
                    }
                    if (dataTestId) {
                        this.element.setAttribute('data-testid', dataTestId);
                    }
                    if (active) {
                        this.element.classList.add('btn--active');
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
                constructor({ options = [], onChange } = {}) {
                    this.element = global.document.createElement('div');
                    this.onChange = onChange;
                    this.options = options;
                    this.value = null;
                }
                setOptions(opts) {
                    this.options = opts;
                }
                setValue(val, triggerCallback = true) {
                    this.value = val;
                    if (triggerCallback && this.onChange) this.onChange(val);
                }
            }
        }));

        vi.doMock('../../../src/ui/components/Flyout.js', () => ({
            Flyout: class {
                constructor({ trigger, content, position, closeOnEscape = false, onClose } = {}) {
                    this.trigger = trigger;
                    this.content = content;
                    this.position = position;
                    this.closeOnEscape = closeOnEscape;
                    this.onClose = onClose;
                    this.isOpen = false;

                    this.element = global.document.createElement('div');
                    this.element.className = 'ui-flyout';
                    if (this.content) this.element.appendChild(this.content);

                    this._handleKeyDown = (e) => {
                        if (this.closeOnEscape && e.key === 'Escape') {
                            this.close();
                        }
                    };
                }
                open() {
                    this.isOpen = true;
                    global.document.body.appendChild(this.element);
                    global.document.addEventListener('keydown', this._handleKeyDown);
                }
                close() {
                    this.isOpen = false;
                    global.document.removeEventListener('keydown', this._handleKeyDown);
                    if (this.element.parentNode) {
                        this.element.parentNode.removeChild(this.element);
                    }
                    if (this.onClose) this.onClose();
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
                constructor({ onChange } = {}) {
                    this.element = global.document.createElement('input');
                    this.value = 0;
                    this.onChange = onChange;
                }
                setValue(val, notify = true, isTransient = false) {
                    this.value = val;
                    if (notify && this.onChange) this.onChange(val, isTransient);
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
                setSlideId() {}
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
                CLOSE: 'icon-close',
                OPACITY: 'icon-opacity',
                GRID_3X3: 'icon-grid-3x3',
                FLIP_H: 'icon-flip-h',
                FLIP_V: 'icon-flip-v',
                STYLES: 'icon-styles',
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

    describe('Transition Section', () => {
        const getSectionByTitle = (root, title) => {
            return Array.from(root.querySelectorAll('.pi-section')).find(sec => {
                const titleEl = sec.querySelector('.pi-section__title');
                return titleEl && titleEl.textContent === title;
            }) || null;
        };

        it('should render Transition section and picker trigger', () => {
            const slideSection = new SlideSection();
            const section = getSectionByTitle(slideSection.element, 'Transition');
            expect(section).toBeTruthy();

            expect(section.getAttribute('data-testid')).toBe('transition-section');
            expect(section.querySelector('[data-testid="transition-picker-trigger"]')).toBeTruthy();
            expect(section.querySelector('[data-testid="transition-duration-input"]')).toBeTruthy();
            expect(section.querySelector('[data-testid="transition-direction-grid"]')).toBeTruthy();
            expect(section.querySelector('[data-testid="transition-inherited-badge"]')).toBeTruthy();
            expect(section.querySelector('[data-testid="transition-source-label"]')).toBeTruthy();
        });

        it('should show Inherited badge and System default source when no override exists', () => {
            const slideSection = new SlideSection();

            // No explicit transition override at slide/layout/master
            delete store.state.slides['slide-1'].styleAssignments;
            delete store.state.slideMasterPresets['layout-title'].styleAssignments;
            delete store.state.slideMasterPresets['master-default'].styleAssignments;

            slideSection.updateTransitionDisplay();

            const badge = slideSection.element.querySelector('[data-testid="transition-inherited-badge"]');
            const resetBtn = slideSection.element.querySelector('[data-testid="transition-reset-btn"]');
            const trigger = slideSection.element.querySelector('[data-testid="transition-picker-trigger"]');
            const source = slideSection.element.querySelector('[data-testid="transition-source-label"]');

            expect(badge).toBeTruthy();
            expect(badge.textContent).toBe('Inherited');
            expect(resetBtn.classList.contains('hidden')).toBe(true);

            // Trigger label should reflect effective transition name
            expect(trigger.textContent.toLowerCase()).toContain('cross fade');

            // Truthful source line for no-config state
            expect(source.textContent).toBe('Source: System default');
        });

        it('should show Override badge + reset button + Source: Slide when slide override exists', () => {
            const slideSection = new SlideSection();

            store.state.slides['slide-1'].styleAssignments = {
                slideTransition: {
                    type: 'wipe',
                    direction: 'upLeft',
                    durationMs: 300,
                    easing: 'ease-in-out'
                }
            };

            slideSection.updateTransitionDisplay();

            const badge = slideSection.element.querySelector('[data-testid="transition-inherited-badge"]');
            const resetBtn = slideSection.element.querySelector('[data-testid="transition-reset-btn"]');
            const source = slideSection.element.querySelector('[data-testid="transition-source-label"]');

            expect(badge.textContent).toBe('Override');
            expect(resetBtn.classList.contains('hidden')).toBe(false);
            expect(source.textContent).toBe('Source: Slide');
        });

        it('should show Source: Layout: <layout name> when inherited from a layout override', () => {
            const slideSection = new SlideSection();

            delete store.state.slides['slide-1'].styleAssignments;
            store.state.slideMasterPresets['layout-title'].styleAssignments = {
                slideTransition: {
                    type: 'push',
                    direction: 'right',
                    durationMs: 300,
                    easing: 'ease-in-out'
                }
            };

            slideSection.updateTransitionDisplay();

            const badge = slideSection.element.querySelector('[data-testid="transition-inherited-badge"]');
            const resetBtn = slideSection.element.querySelector('[data-testid="transition-reset-btn"]');
            const source = slideSection.element.querySelector('[data-testid="transition-source-label"]');

            expect(badge.textContent).toBe('Inherited');
            expect(resetBtn.classList.contains('hidden')).toBe(true);
            expect(source.textContent).toBe('Source: Layout: Title Layout');
        });

        it('should render direction grid with aria-labels for wipe (8 directions)', () => {
            const slideSection = new SlideSection();

            // Force an effective wipe transition with a diagonal direction
            store.state.slides['slide-1'].styleAssignments = {
                slideTransition: {
                    type: 'wipe',
                    direction: 'upLeft',
                    durationMs: 300,
                    easing: 'ease-in-out'
                }
            };

            slideSection.updateTransitionDisplay();

            const grid = slideSection.element.querySelector('[data-testid="transition-direction-grid"]');
            const row = slideSection.element.querySelector('[data-testid="transition-direction-row"]');
            expect(grid).toBeTruthy();
            expect(row.classList.contains('hidden')).toBe(false);

            // Buttons for all 8 directions should exist
            const btnUpLeft = grid.querySelector('[data-testid="transition-direction-upLeft"]');
            const btnUp = grid.querySelector('[data-testid="transition-direction-up"]');
            const btnUpRight = grid.querySelector('[data-testid="transition-direction-upRight"]');
            const btnLeft = grid.querySelector('[data-testid="transition-direction-left"]');
            const btnRight = grid.querySelector('[data-testid="transition-direction-right"]');
            const btnDownLeft = grid.querySelector('[data-testid="transition-direction-downLeft"]');
            const btnDown = grid.querySelector('[data-testid="transition-direction-down"]');
            const btnDownRight = grid.querySelector('[data-testid="transition-direction-downRight"]');

            expect(btnUpLeft).toBeTruthy();
            expect(btnUp).toBeTruthy();
            expect(btnUpRight).toBeTruthy();
            expect(btnLeft).toBeTruthy();
            expect(btnRight).toBeTruthy();
            expect(btnDownLeft).toBeTruthy();
            expect(btnDown).toBeTruthy();
            expect(btnDownRight).toBeTruthy();

            expect(btnUpLeft.getAttribute('aria-label')).toBe('Direction: from top-left');
            expect(btnDownRight.getAttribute('aria-label')).toBe('Direction: from bottom-right');

            // Selected direction should be visually active.
            expect(btnUpLeft.classList.contains('btn--active')).toBe(true);
        });

        it('should render direction grid for cover/push/uncover with 4 directions only', () => {
            const slideSection = new SlideSection();

            store.state.slides['slide-1'].styleAssignments = {
                slideTransition: {
                    type: 'cover',
                    direction: 'left',
                    durationMs: 300,
                    easing: 'ease-in-out'
                }
            };

            slideSection.updateTransitionDisplay();

            const grid = slideSection.element.querySelector('[data-testid="transition-direction-grid"]');
            const btns = Array.from(grid.querySelectorAll('button[data-testid^="transition-direction-"]'));
            // 4-direction grid should only include up/left/right/down
            expect(btns.length).toBe(4);

            expect(grid.querySelector('[data-testid="transition-direction-up"]')).toBeTruthy();
            expect(grid.querySelector('[data-testid="transition-direction-left"]')).toBeTruthy();
            expect(grid.querySelector('[data-testid="transition-direction-right"]')).toBeTruthy();
            expect(grid.querySelector('[data-testid="transition-direction-down"]')).toBeTruthy();
        });

        it('should hide duration and direction controls when transition type is none', () => {
            const slideSection = new SlideSection();

            store.state.slides['slide-1'].styleAssignments = {
                slideTransition: {
                    type: 'none',
                    durationMs: 0,
                    easing: 'ease-in-out'
                }
            };

            slideSection.updateTransitionDisplay();

            const durationRow = slideSection.element.querySelector('[data-testid="transition-duration-row"]');
            const directionRow = slideSection.element.querySelector('[data-testid="transition-direction-row"]');
            expect(durationRow.classList.contains('hidden')).toBe(true);
            expect(directionRow.classList.contains('hidden')).toBe(true);
        });

        it('should show duration control and hide direction control for non-directional transitions', () => {
            const slideSection = new SlideSection();

            store.state.slides['slide-1'].styleAssignments = {
                slideTransition: {
                    type: 'crossFade',
                    durationMs: 300,
                    easing: 'ease-in-out'
                }
            };

            slideSection.updateTransitionDisplay();

            const durationRow = slideSection.element.querySelector('[data-testid="transition-duration-row"]');
            const directionRow = slideSection.element.querySelector('[data-testid="transition-direction-row"]');
            expect(durationRow.classList.contains('hidden')).toBe(false);
            expect(directionRow.classList.contains('hidden')).toBe(true);
        });

        it('should dispatch undoable action for duration changes and use skipHistory only for transient scrubbing', () => {
            const slideSection = new SlideSection();
            const dispatchSpy = vi.spyOn(store, 'dispatch');

            // Ensure we have an object override so duration update writes at slide level.
            store.state.slides['slide-1'].styleAssignments = {
                slideTransition: {
                    type: 'crossFade',
                    durationMs: 300,
                    easing: 'ease-in-out'
                }
            };

            slideSection.updateSlideTransitionDuration(350, true);
            expect(dispatchSpy).toHaveBeenLastCalledWith(
                'UPDATE_SLIDE_STYLE_ASSIGNMENTS',
                expect.objectContaining({
                    slideId: 'slide-1',
                    styleAssignments: expect.objectContaining({
                        slideTransition: expect.objectContaining({ durationMs: 350 })
                    })
                }),
                expect.objectContaining({ skipHistory: true })
            );

            slideSection.updateSlideTransitionDuration(400, false);
            expect(dispatchSpy).toHaveBeenLastCalledWith(
                'UPDATE_SLIDE_STYLE_ASSIGNMENTS',
                expect.objectContaining({
                    slideId: 'slide-1',
                    styleAssignments: expect.objectContaining({
                        slideTransition: expect.objectContaining({ durationMs: 400 })
                    })
                }),
                expect.objectContaining({ skipHistory: false })
            );
        });

        it('should dispatch undoable action for direction changes (no skipHistory)', () => {
            const slideSection = new SlideSection();
            const dispatchSpy = vi.spyOn(store, 'dispatch');

            store.state.slides['slide-1'].styleAssignments = {
                slideTransition: {
                    type: 'wipe',
                    direction: 'upLeft',
                    durationMs: 300,
                    easing: 'ease-in-out'
                }
            };

            slideSection.updateSlideTransitionDirection('downRight');

            const last = dispatchSpy.mock.calls[dispatchSpy.mock.calls.length - 1];
            expect(last[0]).toBe('UPDATE_SLIDE_STYLE_ASSIGNMENTS');
            expect(last[1]).toEqual(
                expect.objectContaining({
                    slideId: 'slide-1',
                    styleAssignments: expect.objectContaining({
                        slideTransition: expect.objectContaining({ direction: 'downRight' })
                    })
                })
            );
            expect(last[2]).toBeUndefined();
        });

        it('should open transition flyout with options', () => {
            const slideSection = new SlideSection();
            slideSection.openTransitionFlyout();

            expect(slideSection.transitionFlyout).toBeDefined();
            expect(slideSection.transitionFlyout.isOpen).toBe(true);

            const flyoutContent = slideSection.transitionFlyout.content;
            expect(flyoutContent.getAttribute('data-testid')).toBe('transition-picker-flyout');

            const opts = Array.from(flyoutContent.querySelectorAll('[data-testid="transition-picker-option"]'));
            expect(opts.length).toBeGreaterThan(0);
        });

        it('should apply required ARIA roles for the transition picker flyout', () => {
            const slideSection = new SlideSection();
            slideSection.openTransitionFlyout();

            expect(slideSection.transitionFlyout.element.getAttribute('role')).toBe('dialog');
            expect(slideSection.transitionFlyout.element.getAttribute('aria-label')).toBe('Select Transition');

            const flyoutContent = slideSection.transitionFlyout.content;
            const listbox = flyoutContent.querySelector('[data-testid="transition-picker-listbox"]');
            expect(listbox).toBeTruthy();
            expect(listbox.getAttribute('role')).toBe('listbox');
            expect(listbox.classList.contains('layout-flyout-grid')).toBe(true);

            const opts = Array.from(listbox.querySelectorAll('[data-testid="transition-picker-option"]'));
            expect(opts.length).toBeGreaterThan(0);
            for (const opt of opts) {
                expect(opt.getAttribute('role')).toBe('option');
                expect(['true', 'false']).toContain(opt.getAttribute('aria-selected'));

                // Grid items MUST be thumbnail + label.
                const preview = opt.querySelector('.layout-preview');
                expect(preview).toBeTruthy();
                expect(preview.textContent.trim().length).toBeGreaterThan(0);
                expect(opt.textContent.trim().length).toBeGreaterThan(0);
            }

            // Default selection should mark exactly one option as selected.
            expect(opts.filter(o => o.getAttribute('aria-selected') === 'true').length).toBe(1);
        });

        it('should close the transition flyout when Escape is pressed', () => {
            const slideSection = new SlideSection();
            slideSection.openTransitionFlyout();
            expect(slideSection.transitionFlyout.isOpen).toBe(true);

            const evt = new dom.window.KeyboardEvent('keydown', { key: 'Escape' });
            dom.window.document.dispatchEvent(evt);

            expect(slideSection.transitionFlyout.isOpen).toBe(false);
            expect(dom.window.document.querySelector('[data-testid="transition-picker-flyout"]')).toBeNull();
        });

        it('should dispatch UPDATE_SLIDE_STYLE_ASSIGNMENTS when selecting a transition type', () => {
            const slideSection = new SlideSection();
            const dispatchSpy = vi.spyOn(store, 'dispatch');

            slideSection.openTransitionFlyout();
            expect(slideSection.transitionFlyout.isOpen).toBe(true);

            const flyoutContent = slideSection.transitionFlyout.content;
            const crossFadeBtn = Array.from(flyoutContent.querySelectorAll('[data-testid="transition-picker-option"]'))
                .find(el => el.dataset.transitionType === 'crossFade');
            expect(crossFadeBtn).toBeTruthy();

            crossFadeBtn.click();

            // Single-step selection MUST close the flyout.
            expect(slideSection.transitionFlyout.isOpen).toBe(false);
            expect(dom.window.document.querySelector('[data-testid="transition-picker-flyout"]')).toBeNull();

            expect(dispatchSpy).toHaveBeenCalledWith(
                'UPDATE_SLIDE_STYLE_ASSIGNMENTS',
                expect.objectContaining({
                    slideId: 'slide-1',
                    styleAssignments: expect.objectContaining({
                        slideTransition: expect.objectContaining({ type: 'crossFade' })
                    })
                })
            );
        });

        it('should dispatch UPDATE_SLIDE_STYLE_ASSIGNMENTS with null on reset', () => {
            const slideSection = new SlideSection();
            const dispatchSpy = vi.spyOn(store, 'dispatch');

            slideSection.resetSlideTransitionToInherited();

            expect(dispatchSpy).toHaveBeenCalledWith(
                'UPDATE_SLIDE_STYLE_ASSIGNMENTS',
                expect.objectContaining({
                    slideId: 'slide-1',
                    styleAssignments: { slideTransition: null }
                })
            );
        });
    });

    describe('SlideSection visibility rules', () => {
        it('should hide slide properties when an element selection exists', () => {
            const slideSection = new SlideSection();

            slideSection.update(['element-1']);
            expect(slideSection.element.classList.contains('hidden')).toBe(true);

            slideSection.update([]);
            expect(slideSection.element.classList.contains('hidden')).toBe(false);
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
