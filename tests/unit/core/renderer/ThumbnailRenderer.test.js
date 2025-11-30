/**
 * ThumbnailRenderer Unit Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock store before importing ThumbnailRenderer
vi.mock('../../../../src/core/Store.js', () => ({
    store: {
        getState: vi.fn(),
        dispatch: vi.fn(),
        on: vi.fn()
    }
}));

// Import after mocking
const { ThumbnailRenderer } = await import('../../../../src/core/renderer/ThumbnailRenderer.js');

describe('ThumbnailRenderer', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        ThumbnailRenderer.invalidateAll();
    });

    describe('createThumbnail', () => {
        it('should create a thumbnail container element', () => {
            const slideData = {
                id: 'slide-1',
                background: { type: 'solid', value: '#ffffff' },
                elements: {},
                elementOrder: []
            };

            const thumbnail = ThumbnailRenderer.createThumbnail('slide-1', slideData);

            expect(thumbnail).toBeInstanceOf(HTMLElement);
            expect(thumbnail.className).toBe('slide-thumbnail-preview');
            expect(thumbnail.style.aspectRatio).toContain('16');
        });

        it('should apply solid background', () => {
            const slideData = {
                id: 'slide-1',
                effectiveBackground: { type: 'solid', value: '#ff0000' },
                effectiveElements: {},
                effectiveOrder: []
            };

            const thumbnail = ThumbnailRenderer.createThumbnail('slide-1', slideData);
            const bgLayer = thumbnail.querySelector('.thumbnail-bg-layer');

            expect(bgLayer).toBeTruthy();
            expect(bgLayer.style.backgroundColor).toBe('rgb(255, 0, 0)');
        });

        it('should apply gradient background', () => {
            const slideData = {
                id: 'slide-1',
                effectiveBackground: {
                    type: 'gradient',
                    value: {
                        type: 'linear',
                        angle: 90,
                        stops: [
                            { color: '#ff0000', position: 0 },
                            { color: '#0000ff', position: 100 }
                        ]
                    }
                },
                effectiveElements: {},
                effectiveOrder: []
            };

            const thumbnail = ThumbnailRenderer.createThumbnail('slide-1', slideData);
            const bgLayer = thumbnail.querySelector('.thumbnail-bg-layer');

            expect(bgLayer).toBeTruthy();
            expect(bgLayer.style.background).toContain('linear-gradient');
        });

        it('should render text elements with content', () => {
            const slideData = {
                id: 'slide-1',
                effectiveBackground: { type: 'solid', value: '#ffffff' },
                effectiveElements: {
                    'text-1': {
                        id: 'text-1',
                        type: 'text',
                        x: 100,
                        y: 100,
                        width: 400,
                        height: 100,
                        content: '<p>Hello World</p>',
                        fontSize: 24
                    }
                },
                effectiveOrder: ['text-1']
            };

            const thumbnail = ThumbnailRenderer.createThumbnail('slide-1', slideData);
            const textElement = thumbnail.querySelector('.thumbnail-element');

            expect(textElement).toBeTruthy();
            expect(textElement.innerHTML).toContain('Hello World');
        });

        it('should render rect elements with styles', () => {
            const slideData = {
                id: 'slide-1',
                effectiveBackground: { type: 'solid', value: '#ffffff' },
                effectiveElements: {
                    'rect-1': {
                        id: 'rect-1',
                        type: 'rect',
                        x: 100,
                        y: 100,
                        width: 200,
                        height: 150,
                        style: {
                            fill: [{ type: 'solid', color: '#00ff00' }]
                        }
                    }
                },
                effectiveOrder: ['rect-1']
            };

            const thumbnail = ThumbnailRenderer.createThumbnail('slide-1', slideData);
            const rectElement = thumbnail.querySelector('.thumbnail-element');

            expect(rectElement).toBeTruthy();
            expect(rectElement.style.backgroundColor).toBe('rgb(0, 255, 0)');
        });

        it('should render placeholder elements with dashed border', () => {
            const slideData = {
                id: 'slide-1',
                effectiveBackground: { type: 'solid', value: '#ffffff' },
                effectiveElements: {
                    'placeholder-1': {
                        id: 'placeholder-1',
                        type: 'placeholder',
                        x: 100,
                        y: 100,
                        width: 400,
                        height: 100
                    }
                },
                effectiveOrder: ['placeholder-1']
            };

            const thumbnail = ThumbnailRenderer.createThumbnail('slide-1', slideData);
            const placeholderElement = thumbnail.querySelector('.thumbnail-element');

            expect(placeholderElement).toBeTruthy();
            expect(placeholderElement.style.border).toContain('dashed');
        });
    });

    describe('caching', () => {
        it('should cache thumbnails', () => {
            const slideData = {
                id: 'slide-1',
                effectiveBackground: { type: 'solid', value: '#ffffff' },
                effectiveElements: {},
                effectiveOrder: []
            };

            // First call - creates and caches
            ThumbnailRenderer.createThumbnail('slide-1', slideData);

            const stats = ThumbnailRenderer.getCacheStats();
            expect(stats.size).toBe(1);
            expect(stats.keys).toContain('slide-1');
        });

        it('should return cached version on second call', () => {
            const slideData = {
                id: 'slide-1',
                effectiveBackground: { type: 'solid', value: '#ffffff' },
                effectiveElements: {},
                effectiveOrder: []
            };

            const first = ThumbnailRenderer.createThumbnail('slide-1', slideData);
            const second = ThumbnailRenderer.createThumbnail('slide-1', slideData);

            // Both should have content (cached version is cloned)
            expect(first.querySelector('.thumbnail-content-wrapper')).toBeTruthy();
            expect(second.querySelector('.thumbnail-content-wrapper')).toBeTruthy();
        });

        it('should invalidate cache when content changes', () => {
            const slideData1 = {
                id: 'slide-1',
                effectiveBackground: { type: 'solid', value: '#ffffff' },
                effectiveElements: {},
                effectiveOrder: []
            };

            const slideData2 = {
                id: 'slide-1',
                effectiveBackground: { type: 'solid', value: '#ff0000' }, // Changed
                effectiveElements: {},
                effectiveOrder: []
            };

            ThumbnailRenderer.createThumbnail('slide-1', slideData1);
            ThumbnailRenderer.createThumbnail('slide-1', slideData2);

            // Cache should still have one entry (updated)
            const stats = ThumbnailRenderer.getCacheStats();
            expect(stats.size).toBe(1);
        });
    });

    describe('invalidation', () => {
        it('should invalidate specific slide', async () => {
            const slideData = {
                id: 'slide-1',
                effectiveBackground: { type: 'solid', value: '#ffffff' },
                effectiveElements: {},
                effectiveOrder: []
            };

            ThumbnailRenderer.createThumbnail('slide-1', slideData);
            expect(ThumbnailRenderer.getCacheStats().size).toBe(1);

            ThumbnailRenderer.invalidate('slide-1');

            // Wait for debounce
            await new Promise(resolve => setTimeout(resolve, 400));

            expect(ThumbnailRenderer.getCacheStats().size).toBe(0);
        });

        it('should invalidate all thumbnails', () => {
            const slideData1 = {
                id: 'slide-1',
                effectiveBackground: { type: 'solid', value: '#ffffff' },
                effectiveElements: {},
                effectiveOrder: []
            };

            const slideData2 = {
                id: 'slide-2',
                effectiveBackground: { type: 'solid', value: '#ffffff' },
                effectiveElements: {},
                effectiveOrder: []
            };

            ThumbnailRenderer.createThumbnail('slide-1', slideData1);
            ThumbnailRenderer.createThumbnail('slide-2', slideData2);
            expect(ThumbnailRenderer.getCacheStats().size).toBe(2);

            ThumbnailRenderer.invalidateAll();
            expect(ThumbnailRenderer.getCacheStats().size).toBe(0);
        });
    });

    describe('LRU eviction', () => {
        it('should evict oldest entries when cache is full', () => {
            // Create more entries than max cache size (50)
            for (let i = 0; i < 55; i++) {
                const slideData = {
                    id: `slide-${i}`,
                    effectiveBackground: { type: 'solid', value: '#ffffff' },
                    effectiveElements: { [`el-${i}`]: { id: `el-${i}`, type: 'text', x: i, y: 0, width: 100, height: 50 } },
                    effectiveOrder: [`el-${i}`]
                };
                ThumbnailRenderer.createThumbnail(`slide-${i}`, slideData);
            }

            const stats = ThumbnailRenderer.getCacheStats();
            expect(stats.size).toBeLessThanOrEqual(50);
        });
    });

    describe('theme variables', () => {
        it('should apply theme colors as CSS variables', () => {
            const slideData = {
                id: 'slide-1',
                effectiveBackground: { type: 'solid', value: '#ffffff' },
                effectiveElements: {},
                effectiveOrder: [],
                themeSettings: {
                    colors: {
                        text1: '#333333',
                        accent1: '#0066cc'
                    },
                    fonts: {
                        heading: 'Georgia',
                        body: 'Arial'
                    }
                }
            };

            const thumbnail = ThumbnailRenderer.createThumbnail('slide-1', slideData);
            const slideContent = thumbnail.querySelector('.thumbnail-slide-content');

            expect(slideContent.style.getPropertyValue('--theme-text1')).toBe('#333333');
            expect(slideContent.style.getPropertyValue('--theme-accent1')).toBe('#0066cc');
            expect(slideContent.style.getPropertyValue('--theme-font-heading')).toBe('Georgia');
            expect(slideContent.style.getPropertyValue('--theme-font-body')).toBe('Arial');
        });
    });

    describe('element positioning', () => {
        it('should position elements correctly', () => {
            const slideData = {
                id: 'slide-1',
                effectiveBackground: { type: 'solid', value: '#ffffff' },
                effectiveElements: {
                    'text-1': {
                        id: 'text-1',
                        type: 'text',
                        x: 100,
                        y: 200,
                        width: 300,
                        height: 50,
                        content: 'Test'
                    }
                },
                effectiveOrder: ['text-1']
            };

            const thumbnail = ThumbnailRenderer.createThumbnail('slide-1', slideData);
            const element = thumbnail.querySelector('.thumbnail-element');

            expect(element.style.left).toBe('100px');
            expect(element.style.top).toBe('200px');
            expect(element.style.width).toBe('300px');
            expect(element.style.height).toBe('50px');
        });

        it('should apply rotation to elements', () => {
            const slideData = {
                id: 'slide-1',
                effectiveBackground: { type: 'solid', value: '#ffffff' },
                effectiveElements: {
                    'rect-1': {
                        id: 'rect-1',
                        type: 'rect',
                        x: 100,
                        y: 100,
                        width: 200,
                        height: 100,
                        rotation: 45
                    }
                },
                effectiveOrder: ['rect-1']
            };

            const thumbnail = ThumbnailRenderer.createThumbnail('slide-1', slideData);
            const element = thumbnail.querySelector('.thumbnail-element');

            expect(element.style.transform).toBe('rotate(45deg)');
        });
    });

    describe('code fill support', () => {
        it('should apply code fill to background', () => {
            const slideData = {
                id: 'slide-1',
                effectiveBackground: {
                    type: 'code',
                    value: `return { draw: function(t) { canvas.drawn = true; } }`
                },
                effectiveElements: {},
                effectiveOrder: []
            };

            const thumbnail = ThumbnailRenderer.createThumbnail('slide-1', slideData);
            const bgLayer = thumbnail.querySelector('.thumbnail-bg-layer');

            expect(bgLayer).not.toBeNull();
            // Should have background set (either data URL from capture or fallback)
            expect(bgLayer.style.background).toBeTruthy();
        });

        it('should apply code fill to shape elements', () => {
            const slideData = {
                id: 'slide-1',
                effectiveBackground: { type: 'solid', value: '#ffffff' },
                effectiveElements: {
                    'rect-1': {
                        id: 'rect-1',
                        type: 'rect',
                        x: 100,
                        y: 100,
                        width: 200,
                        height: 100,
                        style: {
                            fill: [{
                                type: 'code',
                                value: `return { draw: function(t) { canvas.filled = true; } }`
                            }]
                        }
                    }
                },
                effectiveOrder: ['rect-1']
            };

            const thumbnail = ThumbnailRenderer.createThumbnail('slide-1', slideData);
            const element = thumbnail.querySelector('.thumbnail-element');

            expect(element).not.toBeNull();
            // Should have some styling applied (either background image from capture or fallback)
            // In JSDOM, canvas.toDataURL may not work fully, so check for any styling
            const hasBackground = element.style.background || element.style.backgroundColor;
            expect(hasBackground).toBeTruthy();
        });

        it('should handle invalid code fill gracefully', () => {
            const slideData = {
                id: 'slide-1',
                effectiveBackground: {
                    type: 'code',
                    value: 'this is invalid code { ] }'
                },
                effectiveElements: {},
                effectiveOrder: []
            };

            // Should not throw
            expect(() => {
                ThumbnailRenderer.createThumbnail('slide-1', slideData);
            }).not.toThrow();
        });

        it('should handle code fill with no value', () => {
            const slideData = {
                id: 'slide-1',
                effectiveBackground: {
                    type: 'code',
                    value: null
                },
                effectiveElements: {},
                effectiveOrder: []
            };

            const thumbnail = ThumbnailRenderer.createThumbnail('slide-1', slideData);
            const bgLayer = thumbnail.querySelector('.thumbnail-bg-layer');

            expect(bgLayer).not.toBeNull();
            // Should have fallback background
            expect(bgLayer.style.background).toBeTruthy();
        });

        it('should handle multiple background fills including code', () => {
            const slideData = {
                id: 'slide-1',
                effectiveBackground: [
                    { type: 'solid', value: '#000000' },
                    { type: 'code', value: `return { draw: function(t) { ctx.fillStyle = 'rgba(255,0,0,0.5)'; ctx.fillRect(0, 0, canvas.width, canvas.height); } }` }
                ],
                effectiveElements: {},
                effectiveOrder: []
            };

            const thumbnail = ThumbnailRenderer.createThumbnail('slide-1', slideData);
            const bgLayers = thumbnail.querySelectorAll('.thumbnail-bg-layer');

            expect(bgLayers.length).toBe(2);
        });
    });
});
