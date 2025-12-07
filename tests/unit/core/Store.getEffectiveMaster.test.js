/**
 * Store.getEffectiveMaster() Unit Tests
 * Tests the method used by layout picker to render layout thumbnails
 */

import { describe, it, expect, beforeEach } from 'vitest';

describe('Store.getEffectiveMaster()', () => {
    let store;
    
    beforeEach(async () => {
        // Import Store fresh for each test
        const { Store } = await import('../../../src/core/Store.js');
        store = new Store();
        
        // Set up test data
        store.state = {
            editor: {
                mode: 'slide',
                activeSlideId: 'slide-1',
                activeMasterId: null
            },
            slides: {
                'slide-1': {
                    id: 'slide-1',
                    layoutId: 'layout-title',
                    elements: {},
                    elementOrder: []
                }
            },
            slideOrder: ['slide-1'],
            slideMasterPresets: {
                'master-default': {
                    id: 'master-default',
                    type: 'themeMaster',
                    name: 'Default Theme',
                    width: 1920,
                    height: 1080,
                    background: { type: 'solid', value: '#ffffff' },
                    elements: {
                        'bg-shape': {
                            id: 'bg-shape',
                            type: 'shape',
                            x: 0,
                            y: 0,
                            width: 100,
                            height: 100
                        }
                    },
                    elementOrder: ['bg-shape']
                },
                'layout-title': {
                    id: 'layout-title',
                    type: 'layout',
                    name: 'Title Layout',
                    parentMasterId: 'master-default',
                    width: 1920,
                    height: 1080,
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
                'layout-blank': {
                    id: 'layout-blank',
                    type: 'layout',
                    name: 'Blank Layout',
                    parentMasterId: 'master-default',
                    width: 1920,
                    height: 1080,
                    background: { type: 'solid', value: '#000000' },
                    elements: {},
                    elementOrder: []
                }
            },
            masterOrder: ['master-default', 'layout-title', 'layout-blank']
        };
    });

    it('should return null for non-existent master', () => {
        const result = store.getEffectiveMaster('non-existent');
        expect(result).toBeNull();
    });

    it('should return theme master as-is with no inheritance', () => {
        const result = store.getEffectiveMaster('master-default');
        
        expect(result).toBeDefined();
        expect(result.id).toBe('master-default');
        expect(result.effectiveBackground).toEqual({ type: 'solid', value: '#ffffff' });
        expect(result.effectiveElements).toEqual({
            'bg-shape': {
                id: 'bg-shape',
                type: 'shape',
                x: 0,
                y: 0,
                width: 100,
                height: 100
            }
        });
        expect(result.effectiveOrder).toEqual(['bg-shape']);
    });

    it('should merge theme and layout elements for layout master', () => {
        const result = store.getEffectiveMaster('layout-title');
        
        expect(result).toBeDefined();
        expect(result.id).toBe('layout-title');
        
        // Should have both theme background shape AND layout placeholder
        expect(Object.keys(result.effectiveElements).length).toBe(2);
        expect(result.effectiveElements['bg-shape']).toBeDefined();
        expect(result.effectiveElements['bg-shape'].source).toBe('theme');
        expect(result.effectiveElements['bg-shape'].isLocked).toBe(true);
        
        expect(result.effectiveElements['ph-title']).toBeDefined();
        expect(result.effectiveElements['ph-title'].source).toBe('layout');
        
        // Order should be theme elements first, then layout elements
        expect(result.effectiveOrder).toEqual(['bg-shape', 'ph-title']);
    });

    it('should inherit background from theme when layout has null background', () => {
        const result = store.getEffectiveMaster('layout-title');
        
        expect(result.effectiveBackground).toEqual({ type: 'solid', value: '#ffffff' });
    });

    it('should use explicit layout background over theme background', () => {
        const result = store.getEffectiveMaster('layout-blank');
        
        expect(result.effectiveBackground).toEqual({ type: 'solid', value: '#000000' });
    });

    it('should handle inherited background type', () => {
        store.state.slideMasterPresets['layout-inherited'] = {
            id: 'layout-inherited',
            type: 'layout',
            name: 'Inherited Layout',
            parentMasterId: 'master-default',
            background: { type: 'inherited' },
            elements: {},
            elementOrder: []
        };
        
        const result = store.getEffectiveMaster('layout-inherited');
        
        // Should fall through to theme background
        expect(result.effectiveBackground).toEqual({ type: 'solid', value: '#ffffff' });
    });

    it('should return white background as fallback when no background is set', () => {
        store.state.slideMasterPresets['layout-no-bg'] = {
            id: 'layout-no-bg',
            type: 'layout',
            name: 'No Background Layout',
            parentMasterId: 'master-no-bg',
            background: null,
            elements: {},
            elementOrder: []
        };
        
        store.state.slideMasterPresets['master-no-bg'] = {
            id: 'master-no-bg',
            type: 'themeMaster',
            name: 'No Background Theme',
            background: null,
            elements: {},
            elementOrder: []
        };
        
        const result = store.getEffectiveMaster('layout-no-bg');
        
        expect(result.effectiveBackground).toEqual({ type: 'solid', value: '#ffffff' });
    });

    it('should handle empty elements and elementOrder gracefully', () => {
        const result = store.getEffectiveMaster('layout-blank');
        
        expect(result).toBeDefined();
        expect(result.effectiveElements).toBeDefined();
        expect(result.effectiveOrder).toBeDefined();
        expect(Array.isArray(result.effectiveOrder)).toBe(true);
    });

    it('should not include theme elements when hideBackgroundGraphics is true', () => {
        store.state.slideMasterPresets['layout-hidden-bg'] = {
            id: 'layout-hidden-bg',
            type: 'layout',
            name: 'Hidden BG Layout',
            parentMasterId: 'master-default',
            hideBackgroundGraphics: true,
            background: null,
            elements: {
                'ph-content': {
                    id: 'ph-content',
                    type: 'text',
                    isPlaceholder: true,
                    x: 50,
                    y: 50,
                    width: 500,
                    height: 300
                }
            },
            elementOrder: ['ph-content']
        };
        
        const result = store.getEffectiveMaster('layout-hidden-bg');
        
        // Should NOT have bg-shape from theme
        expect(result.effectiveElements['bg-shape']).toBeUndefined();
        expect(result.effectiveElements['ph-content']).toBeDefined();
        expect(result.effectiveOrder).toEqual(['ph-content']);
    });

    it('should work correctly when called for layout picker thumbnails', () => {
        // Simulate what the layout picker does
        const layouts = [
            store.state.slideMasterPresets['layout-title'],
            store.state.slideMasterPresets['layout-blank']
        ];
        
        layouts.forEach(layout => {
            const effectiveLayout = store.getEffectiveMaster(layout.id);
            
            // Should always return valid data (not null)
            expect(effectiveLayout).not.toBeNull();
            expect(effectiveLayout.effectiveBackground).toBeDefined();
            expect(effectiveLayout.effectiveElements).toBeDefined();
            expect(effectiveLayout.effectiveOrder).toBeDefined();
            
            // Should have required properties for ThumbnailRenderer
            expect(effectiveLayout.width).toBeDefined();
            expect(effectiveLayout.height).toBeDefined();
        });
    });
});
