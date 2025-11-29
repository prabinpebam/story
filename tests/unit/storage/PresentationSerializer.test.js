/**
 * Tests for PresentationSerializer
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PresentationSerializer } from '../../../src/core/storage/serialization/PresentationSerializer.js';

describe('PresentationSerializer', () => {
    let mockState;

    beforeEach(() => {
        // Reset mock state
        mockState = {
            metadata: {
                title: 'Test Presentation',
                description: 'A test presentation',
                created: '2024-01-01T00:00:00.000Z',
                aspectRatio: '16:9'
            },
            theme: {
                name: 'Default',
                colors: { primary: '#007AFF' },
                fonts: { heading: 'Inter' }
            },
            slides: [
                {
                    id: 'slide-1',
                    order: 0,
                    elements: [
                        {
                            id: 'text-1',
                            type: 'text',
                            x: 100,
                            y: 100,
                            width: 300,
                            height: 50,
                            content: '<p>Hello World</p>',
                            fontFamily: 'Inter',
                            fontSize: 24,
                            textFill: { type: 'solid', value: '#000000' },
                            style: {
                                fontFamily: 'Inter',
                                fontSize: 24,
                                color: '#000000'
                            }
                        }
                    ],
                    background: {
                        type: 'solid',
                        color: '#FFFFFF'
                    },
                    notes: 'Speaker notes here'
                },
                {
                    id: 'slide-2',
                    order: 1,
                    elements: [],
                    background: {
                        type: 'gradient',
                        gradient: { type: 'linear', colors: ['#FF0000', '#0000FF'] }
                    }
                }
            ],
            auth: {
                user: {
                    id: 'user123',
                    name: 'Test User',
                    email: 'test@example.com'
                }
            },
            assets: new Map()
        };
    });

    describe('constructor', () => {
        it('should create serializer with app state', () => {
            const serializer = new PresentationSerializer(mockState);
            expect(serializer).toBeInstanceOf(PresentationSerializer);
        });

        it('should accept options', () => {
            const serializer = new PresentationSerializer(mockState, {
                includeThumbnail: false,
                includeAssets: false
            });
            expect(serializer.options.includeThumbnail).toBe(false);
            expect(serializer.options.includeAssets).toBe(false);
        });
    });

    describe('serialize', () => {
        it('should generate a Blob', async () => {
            const serializer = new PresentationSerializer(mockState, {
                includeThumbnail: false
            });
            
            const blob = await serializer.serialize();

            expect(blob).toBeInstanceOf(Blob);
            expect(blob.size).toBeGreaterThan(0);
        });
    });

    describe('buildMetadata', () => {
        it('should build metadata with correct title', () => {
            const serializer = new PresentationSerializer(mockState);
            const metadata = serializer.buildMetadata();

            expect(metadata.title).toBe('Test Presentation');
            expect(metadata.description).toBe('A test presentation');
        });

        it('should include slide count', () => {
            const serializer = new PresentationSerializer(mockState);
            const metadata = serializer.buildMetadata();

            expect(metadata.slideCount).toBe(2);
        });

        it('should include author from auth state', () => {
            const serializer = new PresentationSerializer(mockState);
            const metadata = serializer.buildMetadata();

            expect(metadata.author.name).toBe('Test User');
            expect(metadata.author.email).toBe('test@example.com');
        });
    });

    describe('serializeSlide', () => {
        it('should serialize slide with all properties', () => {
            const serializer = new PresentationSerializer(mockState);
            const slide = mockState.slides[0];
            const serialized = serializer.serializeSlide(slide);

            expect(serialized.id).toBe('slide-1');
            expect(serialized.order).toBe(0);
            expect(serialized.elements).toHaveLength(1);
            expect(serialized.notes).toBe('Speaker notes here');
        });

        it('should serialize background', () => {
            const serializer = new PresentationSerializer(mockState);
            const slide = mockState.slides[0];
            const serialized = serializer.serializeSlide(slide);

            expect(serialized.background.type).toBe('solid');
            expect(serialized.background.color).toBe('#FFFFFF');
        });
    });

    describe('serializeElement', () => {
        it('should serialize text element', () => {
            const serializer = new PresentationSerializer(mockState);
            const element = mockState.slides[0].elements[0];
            const serialized = serializer.serializeElement(element);

            expect(serialized.type).toBe('text');
            expect(serialized.content).toBe('<p>Hello World</p>');
            expect(serialized.fontFamily).toBe('Inter');
            expect(serialized.x).toBe(100);
            expect(serialized.y).toBe(100);
        });

        it('should serialize image element', () => {
            const serializer = new PresentationSerializer(mockState);
            const imageElement = {
                id: 'img-1',
                type: 'image',
                x: 0,
                y: 0,
                width: 400,
                height: 300,
                assetId: 'asset-123'
            };
            const serialized = serializer.serializeElement(imageElement);

            expect(serialized.type).toBe('image');
            expect(serialized.assetId).toBe('asset-123');
        });

        it('should serialize shape element', () => {
            const serializer = new PresentationSerializer(mockState);
            const shapeElement = {
                id: 'shape-1',
                type: 'shape',
                x: 0,
                y: 0,
                width: 100,
                height: 100,
                shapeType: 'circle',
                fill: { type: 'solid', color: '#FF0000' },
                stroke: { color: '#000000', width: 2 }
            };
            const serialized = serializer.serializeElement(shapeElement);

            expect(serialized.type).toBe('shape');
            expect(serialized.shapeType).toBe('circle');
            expect(serialized.fill.color).toBe('#FF0000');
        });

        it('should serialize code element', () => {
            const serializer = new PresentationSerializer(mockState);
            const codeElement = {
                id: 'code-1',
                type: 'code',
                x: 0,
                y: 0,
                width: 400,
                height: 200,
                code: 'console.log("Hello");',
                language: 'javascript',
                theme: 'dark'
            };
            const serialized = serializer.serializeElement(codeElement);

            expect(serialized.type).toBe('code');
            expect(serialized.code).toBe('console.log("Hello");');
            expect(serialized.language).toBe('javascript');
        });

        it('should include default rotation and opacity', () => {
            const serializer = new PresentationSerializer(mockState);
            const element = mockState.slides[0].elements[0];
            const serialized = serializer.serializeElement(element);

            expect(serialized.rotation).toBe(0);
            expect(serialized.opacity).toBe(1);
        });
    });

    describe('serializeBackground', () => {
        it('should serialize solid background with value', () => {
            const serializer = new PresentationSerializer(mockState);
            const bg = { type: 'solid', value: '#FFFF00' };
            const serialized = serializer.serializeBackground(bg);

            expect(serialized.type).toBe('solid');
            expect(serialized.value).toBe('#FFFF00');
        });

        it('should serialize gradient background', () => {
            const serializer = new PresentationSerializer(mockState);
            const bg = {
                type: 'gradient',
                value: { type: 'linear', stops: [{ color: '#FF0000', position: 0 }, { color: '#00FF00', position: 100 }] }
            };
            const serialized = serializer.serializeBackground(bg);

            expect(serialized.type).toBe('gradient');
            expect(serialized.value.type).toBe('linear');
        });

        it('should preserve null background (inherit from parent)', () => {
            const serializer = new PresentationSerializer(mockState);
            const serialized = serializer.serializeBackground(null);

            expect(serialized).toBe(null);
        });

        it('should serialize array of fills', () => {
            const serializer = new PresentationSerializer(mockState);
            const bg = [
                { type: 'solid', value: '#FF0000', opacity: 100 },
                { type: 'gradient', value: 'linear-gradient(90deg, #000 0%, #fff 100%)' }
            ];
            const serialized = serializer.serializeBackground(bg);

            expect(Array.isArray(serialized)).toBe(true);
            expect(serialized.length).toBe(2);
            expect(serialized[0].type).toBe('solid');
            expect(serialized[0].value).toBe('#FF0000');
        });
    });

    describe('serializeTheme', () => {
        it('should serialize theme', () => {
            const serializer = new PresentationSerializer(mockState);
            const serialized = serializer.serializeTheme(mockState.theme);

            expect(serialized.name).toBe('Default');
            expect(serialized.colors.primary).toBe('#007AFF');
            expect(serialized.fonts.heading).toBe('Inter');
        });
    });

    describe('collectAssetIds', () => {
        it('should collect asset IDs from image elements', () => {
            mockState.slides[0].elements.push({
                id: 'img-1',
                type: 'image',
                assetId: 'asset-1'
            });
            mockState.slides[0].elements.push({
                id: 'img-2',
                type: 'image',
                assetId: 'asset-2'
            });

            const serializer = new PresentationSerializer(mockState);
            const assetIds = serializer.collectAssetIds();

            expect(assetIds.has('asset-1')).toBe(true);
            expect(assetIds.has('asset-2')).toBe(true);
        });

        it('should collect asset IDs from background images', () => {
            mockState.slides[0].background = {
                type: 'image',
                assetId: 'bg-asset'
            };

            const serializer = new PresentationSerializer(mockState);
            const assetIds = serializer.collectAssetIds();

            expect(assetIds.has('bg-asset')).toBe(true);
        });

        it('should deduplicate asset IDs', () => {
            mockState.slides[0].elements.push({
                id: 'img-1',
                type: 'image',
                assetId: 'shared-asset'
            });
            mockState.slides[1].elements.push({
                id: 'img-2',
                type: 'image',
                assetId: 'shared-asset'
            });

            const serializer = new PresentationSerializer(mockState);
            const assetIds = serializer.collectAssetIds();

            expect(assetIds.size).toBe(1);
        });
    });

    describe('getExtension', () => {
        it('should return correct extension for image types', () => {
            const serializer = new PresentationSerializer(mockState);

            expect(serializer.getExtension('image/png')).toBe('png');
            expect(serializer.getExtension('image/jpeg')).toBe('jpg');
            expect(serializer.getExtension('image/gif')).toBe('gif');
            expect(serializer.getExtension('image/webp')).toBe('webp');
            expect(serializer.getExtension('image/svg+xml')).toBe('svg');
        });

        it('should return correct extension for video types', () => {
            const serializer = new PresentationSerializer(mockState);

            expect(serializer.getExtension('video/mp4')).toBe('mp4');
            expect(serializer.getExtension('video/webm')).toBe('webm');
        });

        it('should return correct extension for font types', () => {
            const serializer = new PresentationSerializer(mockState);

            expect(serializer.getExtension('font/ttf')).toBe('ttf');
            expect(serializer.getExtension('font/otf')).toBe('otf');
            expect(serializer.getExtension('font/woff')).toBe('woff');
            expect(serializer.getExtension('font/woff2')).toBe('woff2');
        });

        it('should return bin for unknown types', () => {
            const serializer = new PresentationSerializer(mockState);

            expect(serializer.getExtension('application/unknown')).toBe('bin');
        });
    });

    describe('hashBlob', () => {
        it('should hash ArrayBuffer data', async () => {
            const serializer = new PresentationSerializer(mockState);
            const encoder = new TextEncoder();
            const buffer = encoder.encode('test content').buffer;
            
            const hash = await serializer.hashBlob(buffer);

            expect(typeof hash).toBe('string');
            expect(hash.length).toBe(64); // SHA-256 = 64 hex chars
        });

        it('should produce same hash for same content', async () => {
            const serializer = new PresentationSerializer(mockState);
            const encoder = new TextEncoder();
            const buffer1 = encoder.encode('identical content').buffer;
            const buffer2 = encoder.encode('identical content').buffer;
            
            const hash1 = await serializer.hashBlob(buffer1);
            const hash2 = await serializer.hashBlob(buffer2);

            expect(hash1).toBe(hash2);
        });

        it('should produce different hash for different content', async () => {
            const serializer = new PresentationSerializer(mockState);
            const encoder = new TextEncoder();
            const buffer1 = encoder.encode('content A').buffer;
            const buffer2 = encoder.encode('content B').buffer;
            
            const hash1 = await serializer.hashBlob(buffer1);
            const hash2 = await serializer.hashBlob(buffer2);

            expect(hash1).not.toBe(hash2);
        });
    });
});
