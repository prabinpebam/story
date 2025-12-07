/**
 * Slide System Serialization Tests (Phase 0.2)
 * 
 * Tests that the slide system data (masters, layouts, sections, slideOrder)
 * is properly serialized and deserialized in the .str file format.
 * 
 * Following Phase 0 principles:
 * - Small incremental changes
 * - Test first, then fix if needed
 * - Validate file format compatibility
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { PresentationSerializer } from '../../../src/core/storage/serialization/PresentationSerializer.js';
import { PresentationDeserializer } from '../../../src/core/storage/serialization/PresentationDeserializer.js';
import { createInitialState } from '../../../src/core/store/InitialState.js';

describe('Slide System Serialization (Phase 0.2)', () => {
    let mockStateWithSlides;

    beforeEach(() => {
        // Create realistic state with masters, layouts, sections, and slides
        mockStateWithSlides = {
            ...createInitialState(),
            metadata: {
                title: 'Test Presentation',
                created: new Date().toISOString(),
                aspectRatio: '16:9'
            }
        };
    });

    describe('Masters and Layouts Serialization', () => {
        it('should serialize masters object', async () => {
            const serializer = new PresentationSerializer(mockStateWithSlides, {
                includeThumbnail: false,
                includeAssets: false
            });

            const blob = await serializer.serialize();
            expect(blob).toBeInstanceOf(Blob);

            // Deserialize to verify masters are included
            const deserializer = new PresentationDeserializer(blob);
            const restored = await deserializer.deserialize();

            // Should have masters in the restored state
            expect(restored.masters).toBeDefined();
            expect(typeof restored.masters).toBe('object');
        });

        it('should preserve master slide structure', async () => {
            const serializer = new PresentationSerializer(mockStateWithSlides, {
                includeThumbnail: false,
                includeAssets: false
            });

            const blob = await serializer.serialize();
            const deserializer = new PresentationDeserializer(blob);
            const restored = await deserializer.deserialize();

            // Verify theme master exists
            const themeMaster = restored.masters?.['theme-default'];
            expect(themeMaster).toBeDefined();
            if (themeMaster) {
                expect(themeMaster.id).toBe('theme-default');
                expect(themeMaster.type).toBe('theme');
                expect(themeMaster.themeSettings).toBeDefined();
            }
        });

        it('should preserve layout masters', async () => {
            const serializer = new PresentationSerializer(mockStateWithSlides, {
                includeThumbnail: false,
                includeAssets: false
            });

            const blob = await serializer.serialize();
            const deserializer = new PresentationDeserializer(blob);
            const restored = await deserializer.deserialize();

            // Verify layout masters exist
            const blankLayout = restored.masters?.['layout-blank'];
            expect(blankLayout).toBeDefined();
            if (blankLayout) {
                expect(blankLayout.id).toBe('layout-blank');
                expect(blankLayout.type).toBe('layout');
            }
        });

        it('should preserve placeholder definitions in layouts', async () => {
            const serializer = new PresentationSerializer(mockStateWithSlides, {
                includeThumbnail: false,
                includeAssets: false
            });

            const blob = await serializer.serialize();
            const deserializer = new PresentationDeserializer(blob);
            const restored = await deserializer.deserialize();

            // Check a layout with placeholders (e.g., layout-title)
            const titleLayout = restored.masters?.['layout-title'];
            if (titleLayout) {
                expect(titleLayout.elements).toBeDefined();
                // Title layout should have placeholder elements
                const placeholders = Object.values(titleLayout.elements || {}).filter(
                    el => el.isPlaceholder
                );
                expect(placeholders.length).toBeGreaterThan(0);
            }
        });
    });

    describe('Slide Order Serialization', () => {
        it('should serialize slideOrder array', async () => {
            const serializer = new PresentationSerializer(mockStateWithSlides, {
                includeThumbnail: false,
                includeAssets: false
            });

            const blob = await serializer.serialize();
            const deserializer = new PresentationDeserializer(blob);
            const restored = await deserializer.deserialize();

            expect(restored.slideOrder).toBeDefined();
            expect(Array.isArray(restored.slideOrder)).toBe(true);
        });

        it('should preserve slide order', async () => {
            // Add multiple slides in specific order
            const slide1 = mockStateWithSlides.slideOrder[0];
            const slide2 = `slide-${Date.now()}`;
            const slide3 = `slide-${Date.now() + 1}`;

            mockStateWithSlides.slideOrder = [slide1, slide2, slide3];
            mockStateWithSlides.slides[slide2] = {
                id: slide2,
                layoutId: 'layout-blank',
                elements: {},
                elementOrder: [],
                width: 1920,
                height: 1080
            };
            mockStateWithSlides.slides[slide3] = {
                id: slide3,
                layoutId: 'layout-blank',
                elements: {},
                elementOrder: [],
                width: 1920,
                height: 1080
            };

            const serializer = new PresentationSerializer(mockStateWithSlides, {
                includeThumbnail: false,
                includeAssets: false
            });

            const blob = await serializer.serialize();
            const deserializer = new PresentationDeserializer(blob);
            const restored = await deserializer.deserialize();

            expect(restored.slideOrder).toEqual([slide1, slide2, slide3]);
        });

        it('should match slideOrder with slides dictionary', async () => {
            const serializer = new PresentationSerializer(mockStateWithSlides, {
                includeThumbnail: false,
                includeAssets: false
            });

            const blob = await serializer.serialize();
            const deserializer = new PresentationDeserializer(blob);
            const restored = await deserializer.deserialize();

            // Every ID in slideOrder should have a corresponding slide
            restored.slideOrder?.forEach(slideId => {
                expect(restored.slides[slideId]).toBeDefined();
            });

            // Every slide should be in slideOrder
            Object.keys(restored.slides || {}).forEach(slideId => {
                expect(restored.slideOrder).toContain(slideId);
            });
        });
    });

    describe('Sections Serialization', () => {
        it('should serialize sections array', async () => {
            // Add sections to state
            mockStateWithSlides.sections = [
                {
                    id: 'section-1',
                    name: 'Introduction',
                    startSlideIndex: 0,
                    expanded: true
                },
                {
                    id: 'section-2',
                    name: 'Main Content',
                    startSlideIndex: 1,
                    expanded: true
                }
            ];

            const serializer = new PresentationSerializer(mockStateWithSlides, {
                includeThumbnail: false,
                includeAssets: false
            });

            const blob = await serializer.serialize();
            const deserializer = new PresentationDeserializer(blob);
            const restored = await deserializer.deserialize();

            expect(restored.sections).toBeDefined();
            expect(Array.isArray(restored.sections)).toBe(true);
        });

        it('should preserve section properties', async () => {
            mockStateWithSlides.sections = [
                {
                    id: 'section-intro',
                    name: 'Introduction',
                    startSlideIndex: 0,
                    expanded: true
                }
            ];

            const serializer = new PresentationSerializer(mockStateWithSlides, {
                includeThumbnail: false,
                includeAssets: false
            });

            const blob = await serializer.serialize();
            const deserializer = new PresentationDeserializer(blob);
            const restored = await deserializer.deserialize();

            const section = restored.sections?.[0];
            expect(section).toBeDefined();
            if (section) {
                expect(section.id).toBe('section-intro');
                expect(section.name).toBe('Introduction');
                expect(section.startSlideIndex).toBe(0);
                expect(section.expanded).toBe(true);
            }
        });

        it('should handle presentations without sections', async () => {
            // Remove sections from state
            delete mockStateWithSlides.sections;

            const serializer = new PresentationSerializer(mockStateWithSlides, {
                includeThumbnail: false,
                includeAssets: false
            });

            const blob = await serializer.serialize();
            const deserializer = new PresentationDeserializer(blob);
            const restored = await deserializer.deserialize();

            // Sections should be undefined or empty array
            expect(
                restored.sections === undefined || 
                restored.sections === null ||
                (Array.isArray(restored.sections) && restored.sections.length === 0)
            ).toBe(true);
        });
    });

    describe('Slide Properties Serialization', () => {
        it('should preserve layoutId in slides', async () => {
            const slideId = mockStateWithSlides.slideOrder[0];
            mockStateWithSlides.slides[slideId].layoutId = 'layout-title';

            const serializer = new PresentationSerializer(mockStateWithSlides, {
                includeThumbnail: false,
                includeAssets: false
            });

            const blob = await serializer.serialize();
            const deserializer = new PresentationDeserializer(blob);
            const restored = await deserializer.deserialize();

            expect(restored.slides[slideId].layoutId).toBe('layout-title');
        });

        it('should preserve slide notes', async () => {
            const slideId = mockStateWithSlides.slideOrder[0];
            mockStateWithSlides.slides[slideId].notes = 'Important speaker notes';

            const serializer = new PresentationSerializer(mockStateWithSlides, {
                includeThumbnail: false,
                includeAssets: false
            });

            const blob = await serializer.serialize();
            const deserializer = new PresentationDeserializer(blob);
            const restored = await deserializer.deserialize();

            expect(restored.slides[slideId].notes).toBe('Important speaker notes');
        });

        it('should preserve slide transitions', async () => {
            const slideId = mockStateWithSlides.slideOrder[0];
            mockStateWithSlides.slides[slideId].transition = 'fade';
            mockStateWithSlides.slides[slideId].transitionDuration = 500;

            const serializer = new PresentationSerializer(mockStateWithSlides, {
                includeThumbnail: false,
                includeAssets: false
            });

            const blob = await serializer.serialize();
            const deserializer = new PresentationDeserializer(blob);
            const restored = await deserializer.deserialize();

            expect(restored.slides[slideId].transition).toBe('fade');
            expect(restored.slides[slideId].transitionDuration).toBe(500);
        });

        it('should preserve slide background', async () => {
            const slideId = mockStateWithSlides.slideOrder[0];
            mockStateWithSlides.slides[slideId].background = {
                type: 'solid',
                value: '#FF0000'
            };

            const serializer = new PresentationSerializer(mockStateWithSlides, {
                includeThumbnail: false,
                includeAssets: false
            });

            const blob = await serializer.serialize();
            const deserializer = new PresentationDeserializer(blob);
            const restored = await deserializer.deserialize();

            expect(restored.slides[slideId].background.type).toBe('solid');
            expect(restored.slides[slideId].background.value).toBe('#FF0000');
        });

        it('should preserve hidden slide state', async () => {
            const slideId = mockStateWithSlides.slideOrder[0];
            mockStateWithSlides.slides[slideId].hidden = true;

            const serializer = new PresentationSerializer(mockStateWithSlides, {
                includeThumbnail: false,
                includeAssets: false
            });

            const blob = await serializer.serialize();
            const deserializer = new PresentationDeserializer(blob);
            const restored = await deserializer.deserialize();

            expect(restored.slides[slideId].hidden).toBe(true);
        });
    });

    describe('Complete Round-trip Test', () => {
        it('should preserve entire slide system state', async () => {
            // Create comprehensive state
            mockStateWithSlides.sections = [
                { id: 'sec-1', name: 'Intro', startSlideIndex: 0, expanded: true },
                { id: 'sec-2', name: 'Content', startSlideIndex: 1, expanded: false }
            ];

            const slide1 = mockStateWithSlides.slideOrder[0];
            const slide2 = `slide-${Date.now()}`;
            
            mockStateWithSlides.slideOrder = [slide1, slide2];
            mockStateWithSlides.slides[slide2] = {
                id: slide2,
                layoutId: 'layout-title',
                elements: {},
                elementOrder: [],
                width: 1920,
                height: 1080,
                notes: 'Test notes',
                transition: 'push',
                hidden: false,
                background: { type: 'solid', value: '#FFFFFF' }
            };

            // Serialize
            const serializer = new PresentationSerializer(mockStateWithSlides, {
                includeThumbnail: false,
                includeAssets: false
            });
            const blob = await serializer.serialize();

            // Deserialize
            const deserializer = new PresentationDeserializer(blob);
            const restored = await deserializer.deserialize();

            // Verify everything
            expect(restored.masters).toBeDefined();
            expect(restored.slideOrder).toEqual([slide1, slide2]);
            expect(restored.slides[slide1]).toBeDefined();
            expect(restored.slides[slide2]).toBeDefined();
            expect(restored.slides[slide2].layoutId).toBe('layout-title');
            expect(restored.slides[slide2].notes).toBe('Test notes');
            expect(restored.sections).toBeDefined();
            expect(restored.sections?.length).toBe(2);
        });
    });
});
