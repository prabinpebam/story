/**
 * Storage round-trip tests for Slide Transition (Phase 1)
 */

import { describe, it, expect } from 'vitest';
import { PresentationSerializer } from '../../../src/core/storage/serialization/PresentationSerializer.js';
import { PresentationDeserializer } from '../../../src/core/storage/serialization/PresentationDeserializer.js';
import { ZipFileReader } from '../../../src/core/storage/zip/ZipFileReader.js';

function createStateWithTransitions() {
    return {
        metadata: {
            title: 'Transitions Storage Test',
            description: 'Ensure slideTransition persists',
            created: '2024-01-01T00:00:00.000Z',
            aspectRatio: '16:9'
        },
        slideMasterPresets: {
            'master-default': {
                id: 'master-default',
                type: 'slideMasterPreset',
                name: 'Default Master',
                styleAssignments: {
                    slideTransition: {
                        type: 'crossFade',
                        durationMs: 350,
                        easing: 'ease-in-out'
                    }
                }
            },
            'layout-title': {
                id: 'layout-title',
                type: 'layoutMaster',
                parentMasterId: 'master-default',
                name: 'Title Layout',
                styleAssignments: {
                    slideTransition: {
                        type: 'wipe',
                        direction: 'right',
                        durationMs: 400,
                        easing: 'linear'
                    }
                }
            }
        },
        slideOrder: ['slide-1', 'slide-2', 'slide-morph'],
        slides: {
            'slide-1': {
                id: 'slide-1',
                layoutId: 'layout-title',
                elements: [],
                background: { type: 'solid', color: '#FFFFFF' },
                styleAssignments: {
                    slideTransition: {
                        type: 'push',
                        direction: 'left',
                        durationMs: 500,
                        easing: 'ease-out'
                    }
                }
            },
            'slide-2': {
                id: 'slide-2',
                layoutId: 'layout-title',
                elements: [],
                background: { type: 'solid', color: '#FFFFFF' },
                styleAssignments: {
                    slideTransition: null
                }
            },
            'slide-morph': {
                id: 'slide-morph',
                layoutId: 'layout-title',
                elements: [],
                background: { type: 'solid', color: '#FFFFFF' },
                styleAssignments: {
                    slideTransition: {
                        type: 'morph',
                        durationMs: 450,
                        easing: 'ease-in-out'
                    }
                }
            }
        },
        assets: new Map()
    };
}

describe('Slide Transition storage round-trip', () => {
    it('serializes slide + master `styleAssignments.slideTransition` into the .str archive', async () => {
        const state = createStateWithTransitions();
        const serializer = new PresentationSerializer(state, {
            includeThumbnail: false,
            includeAssets: false
        });

        const blob = await serializer.serialize();

        const reader = new ZipFileReader();
        await reader.init(blob);

        const slide1 = await reader.readSlide('slide-1');
        expect(slide1.styleAssignments?.slideTransition).toEqual({
            type: 'push',
            direction: 'left',
            durationMs: 500,
            easing: 'ease-out'
        });

        const slide2 = await reader.readSlide('slide-2');
        expect(slide2.styleAssignments?.slideTransition).toBe(null);

        const slideMorph = await reader.readSlide('slide-morph');
        expect(slideMorph.styleAssignments?.slideTransition).toEqual({
            type: 'morph',
            durationMs: 450,
            easing: 'ease-in-out'
        });

        const masters = await reader.readMasters();
        expect(masters['master-default']?.styleAssignments?.slideTransition).toEqual({
            type: 'crossFade',
            durationMs: 350,
            easing: 'ease-in-out'
        });
        expect(masters['layout-title']?.styleAssignments?.slideTransition).toEqual({
            type: 'wipe',
            direction: 'right',
            durationMs: 400,
            easing: 'linear'
        });
    });

    it('round-trips `styleAssignments.slideTransition` through PresentationDeserializer without default drift', async () => {
        const state = createStateWithTransitions();
        const serializer = new PresentationSerializer(state, {
            includeThumbnail: false,
            includeAssets: false
        });

        const blob = await serializer.serialize();

        const deserializer = new PresentationDeserializer(blob);
        const loaded = await deserializer.deserialize();

        expect(loaded.slideMasterPresets['master-default']?.styleAssignments?.slideTransition).toEqual({
            type: 'crossFade',
            durationMs: 350,
            easing: 'ease-in-out'
        });

        expect(loaded.slideMasterPresets['layout-title']?.styleAssignments?.slideTransition).toEqual({
            type: 'wipe',
            direction: 'right',
            durationMs: 400,
            easing: 'linear'
        });

        expect(loaded.slides['slide-1']?.styleAssignments?.slideTransition).toEqual({
            type: 'push',
            direction: 'left',
            durationMs: 500,
            easing: 'ease-out'
        });

        // Important: null must remain null (inherit), not replaced by a default config.
        expect(loaded.slides['slide-2']?.styleAssignments?.slideTransition).toBe(null);

        expect(loaded.slides['slide-morph']?.styleAssignments?.slideTransition).toEqual({
            type: 'morph',
            durationMs: 450,
            easing: 'ease-in-out'
        });
    });
});
