import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Use vi.hoisted() to declare mock functions that are available in hoisted vi.mock
const { mockImportFile, mockCreateImageFill } = vi.hoisted(() => ({
    mockImportFile: vi.fn().mockResolvedValue({
        assetId: 'img_test123',
        blobUrl: 'blob:test-url',
        metadata: { width: 800, height: 600, animated: false }
    }),
    mockCreateImageFill: vi.fn((props) => ({
        type: 'image',
        ...props
    }))
}));

vi.mock('../../../../src/core/media/MediaAssetManager.js', () => ({
    mediaAssetManager: {
        importFile: mockImportFile
    }
}));

vi.mock('../../../../src/core/constants/MediaDefaults.js', () => ({
    DEFAULT_IMAGE_FILL: {},
    createImageFill: mockCreateImageFill,
    FILE_SIZE_LIMITS: {
        inline: 100 * 1024,
        image: 50 * 1024 * 1024
    }
}));

import { ImageProcessor, imageProcessor } from '../../../../src/core/media/ImageProcessor.js';

describe('ImageProcessor', () => {
    let processor;

    beforeEach(() => {
        vi.clearAllMocks();
        
        // Reset mock implementations after clearAllMocks
        mockImportFile.mockResolvedValue({
            assetId: 'img_test123',
            blobUrl: 'blob:test-url',
            metadata: { width: 800, height: 600, animated: false }
        });
        mockCreateImageFill.mockImplementation((props) => ({
            type: 'image',
            ...props
        }));
        
        processor = new ImageProcessor();
        
        // Mock Image constructor
        vi.stubGlobal('Image', class MockImage {
            constructor() {
                this.naturalWidth = 800;
                this.naturalHeight = 600;
                this.crossOrigin = null;
            }
            set src(val) {
                setTimeout(() => this.onload?.(), 0);
            }
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    describe('constructor', () => {
        it('should create an instance', () => {
            expect(processor).toBeDefined();
            expect(processor instanceof ImageProcessor).toBe(true);
        });
    });

    describe('process()', () => {
        it('should import file via asset manager', async () => {
            const mockFile = { name: 'test.png', size: 1000, type: 'image/png' };
            
            await processor.process(mockFile);
            
            expect(mockImportFile).toHaveBeenCalledWith(mockFile);
        });

        it('should create image fill from metadata', async () => {
            const mockFile = { name: 'test.png', size: 1000, type: 'image/png' };
            
            await processor.process(mockFile);
            
            expect(mockCreateImageFill).toHaveBeenCalledWith(expect.objectContaining({
                assetId: 'img_test123',
                originalWidth: 800,
                originalHeight: 600,
                fileName: 'test.png',
                fileSize: 1000
            }));
        });

        it('should return fill object', async () => {
            const mockFile = { name: 'test.png', size: 1000, type: 'image/png' };
            
            const result = await processor.process(mockFile);
            
            expect(result).toHaveProperty('type', 'image');
            expect(result).toHaveProperty('assetId');
        });

        it('should set assetState to ready', async () => {
            const mockFile = { name: 'test.png', size: 1000, type: 'image/png' };
            
            await processor.process(mockFile);
            
            expect(mockCreateImageFill).toHaveBeenCalledWith(expect.objectContaining({
                assetState: 'ready'
            }));
        });
    });

    describe('getDimensions()', () => {
        it('should return width and height', async () => {
            const result = await processor.getDimensions('blob:test');
            
            expect(result).toHaveProperty('width', 800);
            expect(result).toHaveProperty('height', 600);
        });

        it('should reject on error', async () => {
            vi.stubGlobal('Image', class MockImage {
                set src(val) {
                    setTimeout(() => this.onerror?.(), 0);
                }
            });
            
            await expect(processor.getDimensions('invalid'))
                .rejects.toThrow('Failed to load image');
        });
    });

    describe('loadImage()', () => {
        it('should return image element on success', async () => {
            const img = await processor.loadImage('blob:test');
            
            expect(img).toBeDefined();
        });

        it('should set crossOrigin to anonymous', async () => {
            let capturedCrossOrigin;
            vi.stubGlobal('Image', class MockImage {
                set crossOrigin(val) { capturedCrossOrigin = val; }
                get crossOrigin() { return capturedCrossOrigin; }
                set src(val) {
                    setTimeout(() => this.onload?.(), 0);
                }
            });
            
            await processor.loadImage('blob:test');
            
            expect(capturedCrossOrigin).toBe('anonymous');
        });

        it('should reject on error', async () => {
            vi.stubGlobal('Image', class MockImage {
                set src(val) {
                    setTimeout(() => this.onerror?.(), 0);
                }
            });
            
            await expect(processor.loadImage('invalid'))
                .rejects.toThrow('Failed to load image');
        });
    });

    describe('checkIfAnimated()', () => {
        it('should return false for JPEG', async () => {
            const file = { type: 'image/jpeg' };
            
            const result = await processor.checkIfAnimated(file);
            
            expect(result).toBe(false);
        });

        it('should return false for PNG', async () => {
            const file = { type: 'image/png' };
            
            const result = await processor.checkIfAnimated(file);
            
            expect(result).toBe(false);
        });

        it('should check GIF files for animation', async () => {
            const mockArrayBuffer = new ArrayBuffer(100);
            const file = {
                type: 'image/gif',
                slice: vi.fn().mockReturnValue({
                    arrayBuffer: vi.fn().mockResolvedValue(mockArrayBuffer)
                })
            };
            
            const result = await processor.checkIfAnimated(file);
            
            expect(file.slice).toHaveBeenCalledWith(0, 1024);
            expect(typeof result).toBe('boolean');
        });

        it('should check WebP files for animation', async () => {
            const mockArrayBuffer = new ArrayBuffer(30);
            const file = {
                type: 'image/webp',
                slice: vi.fn().mockReturnValue({
                    arrayBuffer: vi.fn().mockResolvedValue(mockArrayBuffer)
                })
            };
            
            const result = await processor.checkIfAnimated(file);
            
            expect(file.slice).toHaveBeenCalledWith(0, 30);
            expect(typeof result).toBe('boolean');
        });
    });

    describe('_checkGifAnimation()', () => {
        it('should return false for single frame GIF', async () => {
            // Single frame has no repeated frame markers
            const buffer = new ArrayBuffer(100);
            const file = {
                slice: vi.fn().mockReturnValue({
                    arrayBuffer: vi.fn().mockResolvedValue(buffer)
                })
            };
            
            const result = await processor._checkGifAnimation(file);
            
            expect(result).toBe(false);
        });

        it('should return true for multi-frame GIF', async () => {
            // Create buffer with multiple frame markers
            const buffer = new ArrayBuffer(100);
            const bytes = new Uint8Array(buffer);
            // Two frame markers: 0x00 0x21 0xF9
            bytes[10] = 0x00; bytes[11] = 0x21; bytes[12] = 0xF9;
            bytes[30] = 0x00; bytes[31] = 0x21; bytes[32] = 0xF9;
            
            const file = {
                slice: vi.fn().mockReturnValue({
                    arrayBuffer: vi.fn().mockResolvedValue(buffer)
                })
            };
            
            const result = await processor._checkGifAnimation(file);
            
            expect(result).toBe(true);
        });
    });

    describe('_checkWebPAnimation()', () => {
        it('should return false for non-RIFF file', async () => {
            const buffer = new ArrayBuffer(30);
            const file = {
                slice: vi.fn().mockReturnValue({
                    arrayBuffer: vi.fn().mockResolvedValue(buffer)
                })
            };
            
            const result = await processor._checkWebPAnimation(file);
            
            expect(result).toBe(false);
        });

        it('should return false for static WebP', async () => {
            const buffer = new ArrayBuffer(30);
            const bytes = new Uint8Array(buffer);
            // RIFF header
            bytes[0] = 0x52; bytes[1] = 0x49; bytes[2] = 0x46; bytes[3] = 0x46;
            // WEBP
            bytes[8] = 0x57; bytes[9] = 0x45; bytes[10] = 0x42; bytes[11] = 0x50;
            // VP8 (not VP8X)
            bytes[12] = 0x56; bytes[13] = 0x50; bytes[14] = 0x38; bytes[15] = 0x20;
            
            const file = {
                slice: vi.fn().mockReturnValue({
                    arrayBuffer: vi.fn().mockResolvedValue(buffer)
                })
            };
            
            const result = await processor._checkWebPAnimation(file);
            
            expect(result).toBe(false);
        });

        it('should return true for animated WebP', async () => {
            const buffer = new ArrayBuffer(30);
            const bytes = new Uint8Array(buffer);
            // RIFF header
            bytes[0] = 0x52; bytes[1] = 0x49; bytes[2] = 0x46; bytes[3] = 0x46;
            // WEBP
            bytes[8] = 0x57; bytes[9] = 0x45; bytes[10] = 0x42; bytes[11] = 0x50;
            // VP8X (extended)
            bytes[12] = 0x56; bytes[13] = 0x50; bytes[14] = 0x38; bytes[15] = 0x58;
            // Animation flag (bit 1)
            bytes[20] = 0x02;
            
            const file = {
                slice: vi.fn().mockReturnValue({
                    arrayBuffer: vi.fn().mockResolvedValue(buffer)
                })
            };
            
            const result = await processor._checkWebPAnimation(file);
            
            expect(result).toBe(true);
        });
    });

    describe('resize()', () => {
        let mockCanvas;
        let mockCtx;

        beforeEach(() => {
            mockCtx = {
                drawImage: vi.fn()
            };
            mockCanvas = {
                width: 0,
                height: 0,
                getContext: vi.fn().mockReturnValue(mockCtx),
                toBlob: vi.fn((callback) => callback(new Blob(['test'])))
            };
            
            // Reset document.createElement mock to handle both canvas and Image needs
            vi.spyOn(document, 'createElement').mockImplementation((tag) => {
                if (tag === 'canvas') return mockCanvas;
                return null;
            });
            
            // Override loadImage to avoid Image constructor issues
            vi.spyOn(processor, 'loadImage').mockResolvedValue({
                width: 800,
                height: 600
            });
        });

        it('should resize image maintaining aspect ratio', async () => {
            const result = await processor.resize('blob:test', 400, 300);
            
            // The canvas dimensions should be set by resize()
            expect(mockCanvas.width).toBe(400);
            expect(mockCanvas.height).toBe(300);
        });

        it('should return a Blob', async () => {
            const result = await processor.resize('blob:test', 400, 300);
            
            expect(result instanceof Blob).toBe(true);
        });

        it('should use specified format', async () => {
            await processor.resize('blob:test', 400, 300, 'image/jpeg', 0.9);
            
            expect(mockCanvas.toBlob).toHaveBeenCalledWith(
                expect.any(Function),
                'image/jpeg',
                0.9
            );
        });

        it('should default to webp format', async () => {
            await processor.resize('blob:test', 400, 300);
            
            expect(mockCanvas.toBlob).toHaveBeenCalledWith(
                expect.any(Function),
                'image/webp',
                0.85
            );
        });
    });

    describe('createThumbnail()', () => {
        let mockCanvas;
        let mockCtx;

        beforeEach(() => {
            mockCtx = {
                drawImage: vi.fn()
            };
            mockCanvas = {
                width: 0,
                height: 0,
                getContext: vi.fn().mockReturnValue(mockCtx),
                toDataURL: vi.fn().mockReturnValue('data:image/jpeg;base64,abc')
            };
            
            vi.spyOn(document, 'createElement').mockImplementation((tag) => {
                if (tag === 'canvas') return mockCanvas;
                return null;
            });
        });

        it('should create square thumbnail', async () => {
            await processor.createThumbnail('blob:test', 64);
            
            expect(mockCanvas.width).toBe(64);
            expect(mockCanvas.height).toBe(64);
        });

        it('should return data URL', async () => {
            const result = await processor.createThumbnail('blob:test', 64);
            
            expect(result).toMatch(/^data:image/);
        });

        it('should use JPEG format for thumbnail', async () => {
            await processor.createThumbnail('blob:test', 64);
            
            expect(mockCanvas.toDataURL).toHaveBeenCalledWith('image/jpeg', 0.7);
        });

        it('should default to size 64', async () => {
            await processor.createThumbnail('blob:test');
            
            expect(mockCanvas.width).toBe(64);
        });
    });

    describe('Singleton export', () => {
        it('should export singleton instance', () => {
            expect(imageProcessor).toBeDefined();
            expect(imageProcessor instanceof ImageProcessor).toBe(true);
        });
    });
});
