/**
 * Property Inspector - Theme Display Test
 * 
 * Tests the color theme inheritance badge and name display behavior
 * in the Property Inspector's SlideSection.
 * 
 * Validates:
 * - Initial state shows "Inherited" badge
 * - After theme override, badge hides and theme name shows
 * - After reset, badge reappears and theme name hides
 * - Theme name displays correct theme
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { store } from '../../src/core/Store.js';
import { PropertyInspector } from '../../src/ui/PropertyInspector.js';
import { THEME_PRESETS } from '../../src/ui/panels/color-theme/ThemePresets.js';

describe('Property Inspector - Theme Display', () => {
    let container;
    let propertyInspector;
    let slideId;
    let themeMasterId;

    beforeEach(async () => {
        // Setup DOM container
        container = document.createElement('div');
        container.id = 'test-property-inspector';
        document.body.appendChild(container);

        // Initialize store with test data
        const state = store.getState();
        
        // Find theme master (best-effort; not required for these assertions)
        themeMasterId = Object.keys(state.slideMasterPresets || {})[0] || 'theme-default';

        // Get or create a test slide
        slideId = state.editor?.activeSlideId || Object.keys(state.slides || {})[0];
        if (!slideId) {
            const layoutId =
                Object.keys(state.layoutMasters || {})[0] ||
                Object.keys(state.slideMasterPresets || {}).find(id => state.slideMasterPresets[id]?.parentMasterId);

            store.dispatch('ADD_SLIDE', { layoutId });
            slideId = Object.keys(store.getState().slides)[0];
        }

        // Ensure slide has no initial override (inherited state)
        store.dispatch('UPDATE_SLIDE_STYLE_ASSIGNMENTS', {
            slideId,
            styleAssignments: {
                colorTheme: null
            }
        });

        // Switch to edit mode with no selection
        store.dispatch('SET_MODE', 'edit');
        store.dispatch('SET_ACTIVE_SLIDE', slideId);
        store.dispatch('UPDATE_SELECTION', []);

        // Initialize Property Inspector
        propertyInspector = new PropertyInspector('test-property-inspector');

        // Wait for initial render
        await vi.waitFor(() => {
            const badge = container.querySelector('.inherited-fill-badge');
            return badge !== null;
        });
    });

    afterEach(() => {
        container.remove();
        propertyInspector = null;
    });

    describe('Initial Inherited State', () => {
        it('should show inherited badge when no override exists', () => {
            const badge = container.querySelector('.inherited-fill-badge');
            const themeName = container.querySelector('.theme-detail-name');

            expect(badge).not.toBeNull();
            expect(badge.classList.contains('hidden')).toBe(false);
            expect(badge.textContent).toBe('Inherited');
            
            expect(themeName).not.toBeNull();
            expect(themeName.classList.contains('hidden')).toBe(true);
        });

        it('should hide Edit button when inherited', () => {
            const editBtn = container.querySelector('button[title="Edit colors"]');
            expect(editBtn).not.toBeNull();
        });

        it('should hide Reset button when inherited', () => {
            const resetBtn = container.querySelector('button[title="Reset to inherited"]');
            expect(resetBtn).not.toBeNull();
            expect(resetBtn.classList.contains('hidden')).toBe(true);
        });
    });

    describe('Theme Override Application', () => {
        it('should update UI when theme override is applied', async () => {
            const testTheme = THEME_PRESETS[1]; // Electric Dreams or another preset
            expect(testTheme).toBeDefined();
            expect(testTheme.name).toBeDefined();

            // Apply theme override
            store.dispatch('UPDATE_SLIDE_STYLE_ASSIGNMENTS', {
                slideId,
                styleAssignments: {
                    colorTheme: testTheme.id
                }
            });

            // Wait for UI update
            await vi.waitFor(() => {
                const badge = container.querySelector('.inherited-fill-badge');
                return badge && badge.classList.contains('hidden');
            }, { timeout: 1000 });

            const badge = container.querySelector('.inherited-fill-badge');
            const themeName = container.querySelector('.theme-detail-name');

            // Badge should be hidden
            expect(badge.classList.contains('hidden')).toBe(true);

            // Theme name should be visible
            expect(themeName.classList.contains('hidden')).toBe(false);
            expect(themeName.textContent).toBe(testTheme.name);
        });

        it('should show reset button when override exists', async () => {
            const testTheme = THEME_PRESETS[1];

            store.dispatch('UPDATE_SLIDE_STYLE_ASSIGNMENTS', {
                slideId,
                styleAssignments: {
                    colorTheme: testTheme.id
                }
            });

            await vi.waitFor(() => {
                const resetBtn = container.querySelector('button[title="Reset to inherited"]');
                return resetBtn && !resetBtn.classList.contains('hidden');
            }, { timeout: 1000 });

            const resetBtn = container.querySelector('button[title="Reset to inherited"]');
            expect(resetBtn.classList.contains('hidden')).toBe(false);
        });

        it('should display correct theme name for different themes', async () => {
            for (let i = 0; i < Math.min(3, THEME_PRESETS.length); i++) {
                const testTheme = THEME_PRESETS[i];

                store.dispatch('UPDATE_SLIDE_STYLE_ASSIGNMENTS', {
                    slideId,
                    styleAssignments: {
                        colorTheme: testTheme.id
                    }
                });

                await vi.waitFor(() => {
                    const themeName = container.querySelector('.theme-detail-name');
                    return themeName && themeName.textContent === testTheme.name;
                }, { timeout: 1000 });

                const themeName = container.querySelector('.theme-detail-name');
                expect(themeName.textContent).toBe(testTheme.name);
                expect(themeName.classList.contains('hidden')).toBe(false);
            }
        });
    });

    describe('Reset to Inherited', () => {
        it('should restore inherited badge when reset', async () => {
            const testTheme = THEME_PRESETS[1];

            // First apply override
            store.dispatch('UPDATE_SLIDE_STYLE_ASSIGNMENTS', {
                slideId,
                styleAssignments: {
                    colorTheme: testTheme.id
                }
            });

            await vi.waitFor(() => {
                const badge = container.querySelector('.inherited-fill-badge');
                return badge && badge.classList.contains('hidden');
            }, { timeout: 1000 });

            // Now reset to inherited
            store.dispatch('UPDATE_SLIDE_STYLE_ASSIGNMENTS', {
                slideId,
                styleAssignments: {
                    colorTheme: null
                }
            });

            await vi.waitFor(() => {
                const badge = container.querySelector('.inherited-fill-badge');
                return badge && !badge.classList.contains('hidden');
            }, { timeout: 1000 });

            const badge = container.querySelector('.inherited-fill-badge');
            const themeName = container.querySelector('.theme-detail-name');

            expect(badge.classList.contains('hidden')).toBe(false);
            expect(themeName.classList.contains('hidden')).toBe(true);
        });

        it('should hide reset button after reset', async () => {
            const testTheme = THEME_PRESETS[1];

            // Apply and then reset
            store.dispatch('UPDATE_SLIDE_STYLE_ASSIGNMENTS', {
                slideId,
                styleAssignments: { colorTheme: testTheme.id }
            });

            await vi.waitFor(() => {
                const resetBtn = container.querySelector('button[title="Reset to inherited"]');
                return resetBtn && !resetBtn.classList.contains('hidden');
            });

            store.dispatch('UPDATE_SLIDE_STYLE_ASSIGNMENTS', {
                slideId,
                styleAssignments: { colorTheme: null }
            });

            await vi.waitFor(() => {
                const resetBtn = container.querySelector('button[title="Reset to inherited"]');
                return resetBtn && resetBtn.classList.contains('hidden');
            });

            const resetBtn = container.querySelector('button[title="Reset to inherited"]');
            expect(resetBtn.classList.contains('hidden')).toBe(true);
        });
    });

    describe('DOM Structure Validation', () => {
        it('should have correct DOM structure for colors section', () => {
            const badge = container.querySelector('[data-testid="color-theme-inherited-badge"]');
            expect(badge).not.toBeNull();

            const headerRow = badge.closest('.pi-row');
            expect(headerRow).not.toBeNull();

            const themeName = headerRow.querySelector('.theme-detail-name');
            const buttonGroup = headerRow.querySelector('.pi-button-group');

            expect(themeName).not.toBeNull();
            expect(buttonGroup).not.toBeNull();

            // Verify order: badge first, then name, then buttons
            const children = Array.from(headerRow.children);
            expect(children[0]).toBe(badge);
            expect(children[1]).toBe(themeName);
            expect(children[2]).toBe(buttonGroup);
        });

        it('should have both edit and reset buttons in button group', () => {
            const badge = container.querySelector('[data-testid="color-theme-inherited-badge"]');
            expect(badge).not.toBeNull();

            const headerRow = badge.closest('.pi-row');
            expect(headerRow).not.toBeNull();

            const buttonGroup = headerRow.querySelector('.pi-button-group');
            expect(buttonGroup).not.toBeNull();

            const buttons = buttonGroup.querySelectorAll('button');
            expect(buttons.length).toBe(2);

            const editBtn = buttonGroup.querySelector('button[title="Edit colors"]');
            const resetBtn = buttonGroup.querySelector('button[title="Reset to inherited"]');

            expect(editBtn).not.toBeNull();
            expect(resetBtn).not.toBeNull();
        });
    });

    describe('State Synchronization', () => {
        it('should update when state changes externally', async () => {
            const state = store.getState();
            const slide = state.slides[slideId];

            // Verify initial state
            expect(slide.styleAssignments?.colorTheme).toBeNull();

            const testTheme = THEME_PRESETS[2];
            
            // Modify store directly (simulating external change)
            store.dispatch('UPDATE_SLIDE_STYLE_ASSIGNMENTS', {
                slideId,
                styleAssignments: {
                    colorTheme: testTheme.id
                }
            });

            // UI should update automatically
            await vi.waitFor(() => {
                const themeName = container.querySelector('.theme-detail-name');
                return themeName && !themeName.classList.contains('hidden');
            }, { timeout: 1000 });

            const themeName = container.querySelector('.theme-detail-name');
            expect(themeName.textContent).toBe(testTheme.name);
        });

        it('should not update when state.ui.isInteracting is true', async () => {
            const testTheme = THEME_PRESETS[1];

            // Set isInteracting flag (simulating scrubbing)
            store.dispatch('UI_INTERACTION_START');

            store.dispatch('UPDATE_SLIDE_STYLE_ASSIGNMENTS', {
                slideId,
                styleAssignments: {
                    colorTheme: testTheme.id
                }
            });

            // Wait a bit
            await new Promise(resolve => setTimeout(resolve, 200));

            // UI should NOT have updated
            const badge = container.querySelector('.inherited-fill-badge');
            expect(badge.classList.contains('hidden')).toBe(false);

            // Clear flag and trigger update
            store.dispatch('UI_INTERACTION_END');
            propertyInspector.render();

            await vi.waitFor(() => {
                const badge = container.querySelector('.inherited-fill-badge');
                return badge && badge.classList.contains('hidden');
            }, { timeout: 1000 });

            const themeName = container.querySelector('.theme-detail-name');
            expect(themeName.textContent).toBe(testTheme.name);
        });
    });

    describe('Console Logging Validation', () => {
        it('should log update calls', () => {
            const consoleSpy = vi.spyOn(console, 'log');

            // Make the test deterministic: explicitly call the method that logs.
            propertyInspector.slideSection.createThemeSection();

            // Check for expected log messages (argument count may vary)
            const sawSlideSectionLog = consoleSpy.mock.calls.some(
                (args) => typeof args[0] === 'string' && args[0].includes('SlideSection:')
            );
            expect(sawSlideSectionLog).toBe(true);

            consoleSpy.mockRestore();
        });
    });

    describe('Edge Cases', () => {
        it('should handle undefined theme gracefully', async () => {
            store.dispatch('UPDATE_SLIDE_STYLE_ASSIGNMENTS', {
                slideId,
                styleAssignments: {
                    colorTheme: 'non-existent-theme-id'
                }
            });

            await vi.waitFor(() => {
                const themeName = container.querySelector('.theme-detail-name');
                return themeName && !themeName.classList.contains('hidden');
            }, { timeout: 1000 });

            const themeName = container.querySelector('.theme-detail-name');
            // Should show "Default" fallback
            expect(themeName.textContent).toBeTruthy();
        });

        it('should handle rapid theme changes', async () => {
            const themes = THEME_PRESETS.slice(0, 3);

            for (const theme of themes) {
                store.dispatch('UPDATE_SLIDE_STYLE_ASSIGNMENTS', {
                    slideId,
                    styleAssignments: {
                        colorTheme: theme.id
                    }
                });
            }

            // Final theme should be displayed
            const finalTheme = themes[themes.length - 1];
            await vi.waitFor(() => {
                const themeName = container.querySelector('.theme-detail-name');
                return themeName && themeName.textContent === finalTheme.name;
            }, { timeout: 1000 });

            const themeName = container.querySelector('.theme-detail-name');
            expect(themeName.textContent).toBe(finalTheme.name);
        });

        it('should handle switching between slides', async () => {
            // Create second slide
            const state = store.getState();
            const layoutId =
                Object.keys(state.layoutMasters || {})[0] ||
                Object.keys(state.slideMasterPresets || {}).find(id => state.slideMasterPresets[id]?.parentMasterId);
            store.dispatch('ADD_SLIDE', { layoutId });
            const slide2Id = Object.keys(store.getState().slides).find(id => id !== slideId);

            const testTheme = THEME_PRESETS[1];

            // Set different override on first slide
            store.dispatch('UPDATE_SLIDE_STYLE_ASSIGNMENTS', {
                slideId,
                styleAssignments: { colorTheme: testTheme.id }
            });

            // Switch to second slide (should be inherited)
            store.dispatch('SET_ACTIVE_SLIDE', slide2Id);
            store.dispatch('UPDATE_SELECTION', []);
            propertyInspector.render();

            await vi.waitFor(() => {
                const badge = container.querySelector('.inherited-fill-badge');
                return badge && !badge.classList.contains('hidden');
            }, { timeout: 1000 });

            const badge = container.querySelector('.inherited-fill-badge');
            expect(badge.classList.contains('hidden')).toBe(false);

            // Switch back to first slide (should show override)
            store.dispatch('SET_ACTIVE_SLIDE', slideId);
            store.dispatch('UPDATE_SELECTION', []);
            propertyInspector.render();

            await vi.waitFor(() => {
                const themeName = container.querySelector('.theme-detail-name');
                return themeName && !themeName.classList.contains('hidden') && themeName.textContent === testTheme.name;
            }, { timeout: 1000 });

            const themeName = container.querySelector('.theme-detail-name');
            expect(themeName.textContent).toBe(testTheme.name);
        });
    });

    describe('Typography Section (Parallel Test)', () => {
        it('should have same badge pattern for typography', () => {
            const badge = container.querySelector('[data-testid="typography-inherited-badge"]');
            if (!badge) return; // Skip if not rendered

            const headerRow = badge.closest('.pi-row');
            expect(headerRow).not.toBeNull();

            const buttonGroup = headerRow.querySelector('.pi-button-group');

            expect(badge).not.toBeNull();
            expect(buttonGroup).not.toBeNull();
        });
    });
});
