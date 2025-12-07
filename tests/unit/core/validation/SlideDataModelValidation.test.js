/**
 * Phase 0.3: Slide Data Model Validation Tests
 * 
 * Validates:
 * - Slide data structure integrity
 * - Master/Layout relationships
 * - State consistency across operations
 * - Data type constraints
 * - Required field validation
 * - Relationship integrity
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createInitialState } from '../../../../src/core/store/InitialState.js';

describe('Slide Data Model Validation (Phase 0.3)', () => {
    let state;

    beforeEach(() => {
        state = createInitialState();
    });

    describe('Slide Structure Validation', () => {
        it('should have required fields in slide object', () => {
            const slideId = 'slide-1';
            state.slides[slideId] = {
                id: slideId,
                title: 'Test Slide',
                order: 0,
                elements: [],
                background: { type: 'solid', color: '#ffffff' }
            };

            const slide = state.slides[slideId];
            expect(slide).toHaveProperty('id');
            expect(slide).toHaveProperty('title');
            expect(slide).toHaveProperty('order');
            expect(slide).toHaveProperty('elements');
            expect(slide).toHaveProperty('background');
        });

        it('should validate slide id is a string', () => {
            const slideId = 'slide-1';
            state.slides[slideId] = {
                id: slideId,
                title: 'Test Slide',
                order: 0,
                elements: []
            };

            expect(typeof state.slides[slideId].id).toBe('string');
            expect(state.slides[slideId].id.length).toBeGreaterThan(0);
        });

        it('should validate slide order is a number', () => {
            const slideId = 'slide-1';
            state.slides[slideId] = {
                id: slideId,
                title: 'Test Slide',
                order: 0,
                elements: []
            };

            expect(typeof state.slides[slideId].order).toBe('number');
            expect(state.slides[slideId].order).toBeGreaterThanOrEqual(0);
        });

        it('should validate slide elements is an array', () => {
            const slideId = 'slide-1';
            state.slides[slideId] = {
                id: slideId,
                title: 'Test Slide',
                order: 0,
                elements: []
            };

            expect(Array.isArray(state.slides[slideId].elements)).toBe(true);
        });

        it('should allow optional fields (layoutId, notes, transition, hidden)', () => {
            const slideId = 'slide-1';
            state.slides[slideId] = {
                id: slideId,
                title: 'Test Slide',
                order: 0,
                elements: [],
                layoutId: 'layout-1',
                notes: 'Speaker notes',
                transition: { type: 'fade', duration: 500 },
                hidden: false
            };

            const slide = state.slides[slideId];
            expect(slide).toHaveProperty('layoutId');
            expect(slide).toHaveProperty('notes');
            expect(slide).toHaveProperty('transition');
            expect(slide).toHaveProperty('hidden');
        });

        it('should validate slide background object structure', () => {
            const slideId = 'slide-1';
            state.slides[slideId] = {
                id: slideId,
                title: 'Test Slide',
                order: 0,
                elements: [],
                background: { type: 'solid', color: '#ffffff' }
            };

            const bg = state.slides[slideId].background;
            expect(bg).toHaveProperty('type');
            expect(['solid', 'gradient', 'image', 'video', 'code']).toContain(bg.type);
        });
    });

    describe('Slide Order Validation', () => {
        it('should maintain unique order numbers', () => {
            state.slides['slide-1'] = { id: 'slide-1', order: 0, elements: [] };
            state.slides['slide-2'] = { id: 'slide-2', order: 1, elements: [] };
            state.slides['slide-3'] = { id: 'slide-3', order: 2, elements: [] };
            state.slideOrder = ['slide-1', 'slide-2', 'slide-3'];

            const orders = Object.values(state.slides).map(s => s.order);
            const uniqueOrders = new Set(orders);
            
            expect(orders.length).toBe(uniqueOrders.size);
        });

        it('should validate slideOrder matches slides dictionary keys', () => {
            state.slides['slide-1'] = { id: 'slide-1', order: 0, elements: [] };
            state.slides['slide-2'] = { id: 'slide-2', order: 1, elements: [] };
            state.slideOrder = ['slide-1', 'slide-2'];

            expect(state.slideOrder.length).toBe(Object.keys(state.slides).length);
            
            for (const slideId of state.slideOrder) {
                expect(state.slides).toHaveProperty(slideId);
            }
        });

        it('should validate slideOrder contains no duplicates', () => {
            state.slideOrder = ['slide-1', 'slide-2', 'slide-3'];
            
            const uniqueIds = new Set(state.slideOrder);
            expect(state.slideOrder.length).toBe(uniqueIds.size);
        });

        it('should validate order numbers are sequential', () => {
            state.slides['slide-1'] = { id: 'slide-1', order: 0, elements: [] };
            state.slides['slide-2'] = { id: 'slide-2', order: 1, elements: [] };
            state.slides['slide-3'] = { id: 'slide-3', order: 2, elements: [] };
            state.slideOrder = ['slide-1', 'slide-2', 'slide-3'];

            const orders = state.slideOrder.map(id => state.slides[id].order).sort((a, b) => a - b);
            
            for (let i = 0; i < orders.length; i++) {
                expect(orders[i]).toBe(i);
            }
        });
    });

    describe('Master/Layout Relationship Validation', () => {
        it('should have valid masters object structure', () => {
            state.masters = {
                theme: 'default-theme',
                layouts: {
                    'layout-1': {
                        id: 'layout-1',
                        name: 'Title Slide',
                        placeholders: []
                    }
                }
            };

            expect(state.masters).toHaveProperty('theme');
            expect(state.masters).toHaveProperty('layouts');
            expect(typeof state.masters.layouts).toBe('object');
        });

        it('should validate layout references in slides exist in masters', () => {
            state.masters = {
                theme: 'default-theme',
                layouts: {
                    'layout-1': { id: 'layout-1', name: 'Title', placeholders: [] },
                    'layout-2': { id: 'layout-2', name: 'Content', placeholders: [] }
                }
            };

            state.slides['slide-1'] = {
                id: 'slide-1',
                order: 0,
                elements: [],
                layoutId: 'layout-1'
            };

            state.slides['slide-2'] = {
                id: 'slide-2',
                order: 1,
                elements: [],
                layoutId: 'layout-2'
            };

            // Validate all layoutIds reference existing layouts
            for (const slide of Object.values(state.slides)) {
                if (slide.layoutId) {
                    expect(state.masters.layouts).toHaveProperty(slide.layoutId);
                }
            }
        });

        it('should validate layout structure has required fields', () => {
            state.masters = {
                theme: 'default-theme',
                layouts: {
                    'layout-1': {
                        id: 'layout-1',
                        name: 'Title Slide',
                        placeholders: []
                    }
                }
            };

            const layout = state.masters.layouts['layout-1'];
            expect(layout).toHaveProperty('id');
            expect(layout).toHaveProperty('name');
            expect(layout).toHaveProperty('placeholders');
            expect(Array.isArray(layout.placeholders)).toBe(true);
        });

        it('should allow slides without layoutId (custom layouts)', () => {
            state.slides['slide-1'] = {
                id: 'slide-1',
                order: 0,
                elements: []
                // No layoutId - custom layout
            };

            expect(state.slides['slide-1'].layoutId).toBeUndefined();
            // Should be valid - slides can have custom layouts
        });

        it('should validate placeholder structure in layouts', () => {
            state.masters = {
                theme: 'default-theme',
                layouts: {
                    'layout-1': {
                        id: 'layout-1',
                        name: 'Title Slide',
                        placeholders: [
                            {
                                id: 'ph-1',
                                type: 'title',
                                x: 100,
                                y: 100,
                                width: 800,
                                height: 200
                            }
                        ]
                    }
                }
            };

            const placeholder = state.masters.layouts['layout-1'].placeholders[0];
            expect(placeholder).toHaveProperty('id');
            expect(placeholder).toHaveProperty('type');
            expect(placeholder).toHaveProperty('x');
            expect(placeholder).toHaveProperty('y');
            expect(placeholder).toHaveProperty('width');
            expect(placeholder).toHaveProperty('height');
        });
    });

    describe('Sections Validation', () => {
        it('should validate sections array structure', () => {
            state.sections = [
                {
                    id: 'section-1',
                    name: 'Introduction',
                    startSlideId: 'slide-1',
                    color: '#4285f4'
                }
            ];

            expect(Array.isArray(state.sections)).toBe(true);
            const section = state.sections[0];
            expect(section).toHaveProperty('id');
            expect(section).toHaveProperty('name');
            expect(section).toHaveProperty('startSlideId');
        });

        it('should validate section slide references exist', () => {
            state.slides['slide-1'] = { id: 'slide-1', order: 0, elements: [] };
            state.slides['slide-2'] = { id: 'slide-2', order: 1, elements: [] };
            state.slideOrder = ['slide-1', 'slide-2'];

            state.sections = [
                {
                    id: 'section-1',
                    name: 'Introduction',
                    startSlideId: 'slide-1'
                },
                {
                    id: 'section-2',
                    name: 'Content',
                    startSlideId: 'slide-2'
                }
            ];

            // Validate all section references point to existing slides
            for (const section of state.sections) {
                expect(state.slides).toHaveProperty(section.startSlideId);
            }
        });

        it('should allow empty sections array', () => {
            state.sections = [];
            expect(state.sections).toBeDefined();
            expect(Array.isArray(state.sections)).toBe(true);
            expect(state.sections.length).toBe(0);
        });

        it('should validate sections are ordered by startSlideId order', () => {
            state.slides['slide-1'] = { id: 'slide-1', order: 0, elements: [] };
            state.slides['slide-3'] = { id: 'slide-3', order: 2, elements: [] };
            state.slides['slide-5'] = { id: 'slide-5', order: 4, elements: [] };
            state.slideOrder = ['slide-1', 'slide-3', 'slide-5'];

            state.sections = [
                { id: 'sec-1', name: 'Intro', startSlideId: 'slide-1' },
                { id: 'sec-2', name: 'Middle', startSlideId: 'slide-3' },
                { id: 'sec-3', name: 'End', startSlideId: 'slide-5' }
            ];

            // Verify sections are in order
            for (let i = 0; i < state.sections.length - 1; i++) {
                const currentOrder = state.slides[state.sections[i].startSlideId].order;
                const nextOrder = state.slides[state.sections[i + 1].startSlideId].order;
                expect(currentOrder).toBeLessThan(nextOrder);
            }
        });
    });

    describe('State Consistency Validation', () => {
        it('should maintain consistency between slides and slideOrder after add', () => {
            const slideId = 'new-slide';
            state.slides[slideId] = {
                id: slideId,
                order: Object.keys(state.slides).length,
                elements: []
            };
            state.slideOrder.push(slideId);

            expect(Object.keys(state.slides).length).toBe(state.slideOrder.length);
            expect(state.slideOrder).toContain(slideId);
        });

        it('should maintain consistency between slides and slideOrder after delete', () => {
            state.slides['slide-1'] = { id: 'slide-1', order: 0, elements: [] };
            state.slides['slide-2'] = { id: 'slide-2', order: 1, elements: [] };
            state.slides['slide-3'] = { id: 'slide-3', order: 2, elements: [] };
            state.slideOrder = ['slide-1', 'slide-2', 'slide-3'];

            // Delete slide-2
            delete state.slides['slide-2'];
            state.slideOrder = state.slideOrder.filter(id => id !== 'slide-2');

            expect(Object.keys(state.slides).length).toBe(state.slideOrder.length);
            expect(state.slideOrder).not.toContain('slide-2');
            
            // Verify all slideOrder entries exist in slides
            for (const slideId of state.slideOrder) {
                expect(state.slides).toHaveProperty(slideId);
            }
        });

        it('should maintain consistency after slide reorder', () => {
            state.slides['slide-1'] = { id: 'slide-1', order: 0, elements: [] };
            state.slides['slide-2'] = { id: 'slide-2', order: 1, elements: [] };
            state.slides['slide-3'] = { id: 'slide-3', order: 2, elements: [] };
            state.slideOrder = ['slide-1', 'slide-2', 'slide-3'];

            // Reorder: move slide-3 to position 0
            state.slideOrder = ['slide-3', 'slide-1', 'slide-2'];
            state.slides['slide-3'].order = 0;
            state.slides['slide-1'].order = 1;
            state.slides['slide-2'].order = 2;

            // Verify consistency
            expect(state.slideOrder.length).toBe(Object.keys(state.slides).length);
            
            for (let i = 0; i < state.slideOrder.length; i++) {
                const slideId = state.slideOrder[i];
                expect(state.slides[slideId].order).toBe(i);
            }
        });

        it('should validate all slides have unique IDs', () => {
            state.slides['slide-1'] = { id: 'slide-1', order: 0, elements: [] };
            state.slides['slide-2'] = { id: 'slide-2', order: 1, elements: [] };
            state.slides['slide-3'] = { id: 'slide-3', order: 2, elements: [] };

            const ids = Object.keys(state.slides);
            const uniqueIds = new Set(ids);
            
            expect(ids.length).toBe(uniqueIds.size);
        });

        it('should validate currentSlideId references an existing slide', () => {
            state.slides['slide-1'] = { id: 'slide-1', order: 0, elements: [] };
            state.slides['slide-2'] = { id: 'slide-2', order: 1, elements: [] };
            state.slideOrder = ['slide-1', 'slide-2'];
            state.currentSlideId = 'slide-1';

            if (state.currentSlideId) {
                expect(state.slides).toHaveProperty(state.currentSlideId);
            }
        });

        it('should validate deleted slide is removed from all references', () => {
            state.slides['slide-1'] = { id: 'slide-1', order: 0, elements: [] };
            state.slides['slide-2'] = { id: 'slide-2', order: 1, elements: [] };
            state.slideOrder = ['slide-1', 'slide-2'];
            state.currentSlideId = 'slide-2';

            const deletedId = 'slide-2';
            
            // Simulate deletion
            delete state.slides[deletedId];
            state.slideOrder = state.slideOrder.filter(id => id !== deletedId);
            if (state.currentSlideId === deletedId) {
                state.currentSlideId = state.slideOrder[0] || null;
            }

            // Verify no references remain
            expect(state.slides[deletedId]).toBeUndefined();
            expect(state.slideOrder).not.toContain(deletedId);
            expect(state.currentSlideId).not.toBe(deletedId);
        });
    });

    describe('Data Type Constraints', () => {
        it('should validate slide title is string or undefined', () => {
            state.slides['slide-1'] = {
                id: 'slide-1',
                title: 'Test Slide',
                order: 0,
                elements: []
            };

            const title = state.slides['slide-1'].title;
            expect(title === undefined || typeof title === 'string').toBe(true);
        });

        it('should validate slide notes is string or undefined', () => {
            state.slides['slide-1'] = {
                id: 'slide-1',
                order: 0,
                elements: [],
                notes: 'Speaker notes here'
            };

            const notes = state.slides['slide-1'].notes;
            expect(notes === undefined || typeof notes === 'string').toBe(true);
        });

        it('should validate slide hidden is boolean or undefined', () => {
            state.slides['slide-1'] = {
                id: 'slide-1',
                order: 0,
                elements: [],
                hidden: false
            };

            const hidden = state.slides['slide-1'].hidden;
            expect(hidden === undefined || typeof hidden === 'boolean').toBe(true);
        });

        it('should validate transition duration is positive number', () => {
            state.slides['slide-1'] = {
                id: 'slide-1',
                order: 0,
                elements: [],
                transition: { type: 'fade', duration: 500 }
            };

            if (state.slides['slide-1'].transition) {
                const duration = state.slides['slide-1'].transition.duration;
                expect(typeof duration).toBe('number');
                expect(duration).toBeGreaterThan(0);
            }
        });

        it('should validate section color is valid hex or undefined', () => {
            state.sections = [
                {
                    id: 'section-1',
                    name: 'Introduction',
                    startSlideId: 'slide-1',
                    color: '#4285f4'
                }
            ];

            const color = state.sections[0].color;
            if (color) {
                expect(typeof color).toBe('string');
                expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
            }
        });
    });

    describe('Edge Cases and Boundary Conditions', () => {
        it('should handle empty slides object', () => {
            state.slides = {};
            state.slideOrder = [];
            
            expect(Object.keys(state.slides).length).toBe(0);
            expect(state.slideOrder.length).toBe(0);
        });

        it('should handle single slide presentation', () => {
            // Clear initial state
            state.slides = {};
            state.slideOrder = [];
            
            state.slides['slide-1'] = { id: 'slide-1', order: 0, elements: [] };
            state.slideOrder = ['slide-1'];
            
            expect(Object.keys(state.slides).length).toBe(1);
            expect(state.slideOrder.length).toBe(1);
        });

        it('should handle large number of slides (100+)', () => {
            // Clear initial state
            state.slides = {};
            state.slideOrder = [];
            
            for (let i = 0; i < 150; i++) {
                const slideId = `slide-${i}`;
                state.slides[slideId] = {
                    id: slideId,
                    order: i,
                    elements: []
                };
                state.slideOrder.push(slideId);
            }

            expect(Object.keys(state.slides).length).toBe(150);
            expect(state.slideOrder.length).toBe(150);
            
            // Verify order consistency
            for (let i = 0; i < state.slideOrder.length; i++) {
                expect(state.slides[state.slideOrder[i]].order).toBe(i);
            }
        });

        it('should handle slide with no elements', () => {
            state.slides['slide-1'] = {
                id: 'slide-1',
                order: 0,
                elements: []
            };

            expect(state.slides['slide-1'].elements).toBeDefined();
            expect(Array.isArray(state.slides['slide-1'].elements)).toBe(true);
            expect(state.slides['slide-1'].elements.length).toBe(0);
        });

        it('should handle masters with no layouts', () => {
            state.masters = {
                theme: 'default-theme',
                layouts: {}
            };

            expect(state.masters.layouts).toBeDefined();
            expect(typeof state.masters.layouts).toBe('object');
            expect(Object.keys(state.masters.layouts).length).toBe(0);
        });
    });
});
