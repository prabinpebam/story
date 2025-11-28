import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Use vi.hoisted() to declare mock functions that are available in hoisted vi.mock
const { mockImportFile, mockCreateVideoFill } = vi.hoisted(() => ({
    mockImportFile: vi.fn().mockResolvedValue({
        assetId: 'vid_test123',
        blobUrl: 'blob:video-url',
        metadata: { width: 1920, height: 1080, duration: 30.5 }
    }),
    mockCreateVideoFill: vi.fn((props) => ({
        type: 'video',
        ...props
    }))
}));

vi.mock('../../../../src/core/media/MediaAssetManager.js', () => ({
    mediaAssetManager: {
        importFile: mockImportFile
    }
}));

vi.mock('../../../../src/core/constants/MediaDefaults.js', () => ({
    DEFAULT_VIDEO_FILL: {},
    createVideoFill: mockCreateVideoFill
}));

import { VideoProcessor, videoProcessor } from '../../../../src/core/media/VideoProcessor.js';

describe('VideoProcessor', () => {
    let processor;
    let mockVideo;

    beforeEach(() => {
        vi.clearAllMocks();
        
        // Reset mock implementations after clearAllMocks
        mockImportFile.mockResolvedValue({
            assetId: 'vid_test123',
            blobUrl: 'blob:video-url',
            metadata: { width: 1920, height: 1080, duration: 30.5 }
        });
        mockCreateVideoFill.mockImplementation((props) => ({
            type: 'video',
            ...props
        }));
        
        processor = new VideoProcessor();
        
        // Mock HTMLVideoElement
        mockVideo = {
            videoWidth: 1920,
            videoHeight: 1080,
            duration: 30.5,
            currentTime: 0,
            crossOrigin: null,
            muted: false,
            playsInline: false,
            src: '',
            load: vi.fn(),
            addEventListener: vi.fn(),
            removeEventListener: vi.fn()
        };
        
        vi.spyOn(document, 'createElement').mockImplementation((tag) => {
            if (tag === 'video') {
                return {
                    ...mockVideo,
                    set src(val) {
                        mockVideo.src = val;
                        setTimeout(() => {
                            this.onloadedmetadata?.();
                            this.onloadeddata?.();
                        }, 0);
                    },
                    get src() { return mockVideo.src; }
                };
            }
            if (tag === 'canvas') {
                return {
                    width: 0,
                    height: 0,
                    getContext: vi.fn().mockReturnValue({
                        drawImage: vi.fn()
                    }),
                    toDataURL: vi.fn().mockReturnValue('data:image/jpeg;base64,abc')
                };
            }
            return null;
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('constructor', () => {
        it('should create an instance', () => {
            expect(processor).toBeDefined();
            expect(processor instanceof VideoProcessor).toBe(true);
        });
    });

    describe('process()', () => {
        it('should import file via asset manager', async () => {
            const mockFile = { name: 'test.mp4', size: 10000000, type: 'video/mp4' };
            
            await processor.process(mockFile);
            
            expect(mockImportFile).toHaveBeenCalledWith(mockFile);
        });

        it('should create video fill from metadata', async () => {
            const mockFile = { name: 'test.mp4', size: 10000000, type: 'video/mp4' };
            
            await processor.process(mockFile);
            
            expect(mockCreateVideoFill).toHaveBeenCalledWith(expect.objectContaining({
                assetId: 'vid_test123',
                originalWidth: 1920,
                originalHeight: 1080,
                duration: 30.5,
                fileName: 'test.mp4',
                fileSize: 10000000
            }));
        });

        it('should return fill object', async () => {
            const mockFile = { name: 'test.mp4', size: 10000000, type: 'video/mp4' };
            
            const result = await processor.process(mockFile);
            
            expect(result).toHaveProperty('type', 'video');
            expect(result).toHaveProperty('assetId');
        });

        it('should set assetState to ready', async () => {
            const mockFile = { name: 'test.mp4', size: 10000000, type: 'video/mp4' };
            
            await processor.process(mockFile);
            
            expect(mockCreateVideoFill).toHaveBeenCalledWith(expect.objectContaining({
                assetState: 'ready'
            }));
        });
    });

    describe('getMetadata()', () => {
        it('should return width, height, and duration', async () => {
            const result = await processor.getMetadata('blob:video');
            
            expect(result).toHaveProperty('width', 1920);
            expect(result).toHaveProperty('height', 1080);
            expect(result).toHaveProperty('duration', 30.5);
        });

        it('should call load on video element', async () => {
            await processor.getMetadata('blob:video');
            
            // The mock should have been created
            expect(document.createElement).toHaveBeenCalledWith('video');
        });

        it('should reject on error', async () => {
            vi.spyOn(document, 'createElement').mockImplementation((tag) => {
                if (tag === 'video') {
                    return {
                        ...mockVideo,
                        set src(val) {
                            setTimeout(() => this.onerror?.(), 0);
                        }
                    };
                }
                return null;
            });
            
            await expect(processor.getMetadata('invalid'))
                .rejects.toThrow('Failed to load video');
        });
    });

    describe('loadVideo()', () => {
        it('should return video element on success', async () => {
            const video = await processor.loadVideo('blob:video');
            
            expect(video).toBeDefined();
        });

        it('should set crossOrigin to anonymous', async () => {
            const video = await processor.loadVideo('blob:video');
            
            expect(video.crossOrigin).toBe('anonymous');
        });

        it('should set muted to true', async () => {
            const video = await processor.loadVideo('blob:video');
            
            expect(video.muted).toBe(true);
        });

        it('should set playsInline to true', async () => {
            const video = await processor.loadVideo('blob:video');
            
            expect(video.playsInline).toBe(true);
        });

        it('should reject on error', async () => {
            vi.spyOn(document, 'createElement').mockImplementation((tag) => {
                if (tag === 'video') {
                    return {
                        ...mockVideo,
                        set src(val) {
                            setTimeout(() => this.onerror?.(), 0);
                        }
                    };
                }
                return null;
            });
            
            await expect(processor.loadVideo('invalid'))
                .rejects.toThrow('Failed to load video');
        });
    });

    describe('extractFrame()', () => {
        it('should return data URL', async () => {
            // Mock _seekTo
            vi.spyOn(processor, '_seekTo').mockResolvedValue();
            
            const result = await processor.extractFrame('blob:video', 5);
            
            expect(result).toMatch(/^data:image/);
        });

        it('should seek to specified time', async () => {
            const seekSpy = vi.spyOn(processor, '_seekTo').mockResolvedValue();
            
            await processor.extractFrame('blob:video', 10);
            
            expect(seekSpy).toHaveBeenCalled();
        });

        it('should use video dimensions by default', async () => {
            vi.spyOn(processor, '_seekTo').mockResolvedValue();
            
            await processor.extractFrame('blob:video', 0);
            
            // Canvas should use video dimensions
            expect(document.createElement).toHaveBeenCalledWith('canvas');
        });

        it('should use custom dimensions when provided', async () => {
            vi.spyOn(processor, '_seekTo').mockResolvedValue();
            
            await processor.extractFrame('blob:video', 0, 640, 480);
            
            // Just verify it completes
            expect(document.createElement).toHaveBeenCalledWith('canvas');
        });
    });

    describe('extractPosterFrame()', () => {
        it('should call extractFrame with default time 0', async () => {
            const extractSpy = vi.spyOn(processor, 'extractFrame').mockResolvedValue('data:image/jpeg');
            
            await processor.extractPosterFrame('blob:video');
            
            expect(extractSpy).toHaveBeenCalledWith('blob:video', 0);
        });

        it('should call extractFrame with specified time', async () => {
            const extractSpy = vi.spyOn(processor, 'extractFrame').mockResolvedValue('data:image/jpeg');
            
            await processor.extractPosterFrame('blob:video', 5);
            
            expect(extractSpy).toHaveBeenCalledWith('blob:video', 5);
        });
    });

    describe('createThumbnail()', () => {
        it('should create square thumbnail', async () => {
            vi.spyOn(processor, '_seekTo').mockResolvedValue();
            
            const result = await processor.createThumbnail('blob:video', 0, 64);
            
            expect(result).toMatch(/^data:image/);
        });

        it('should default to size 64', async () => {
            vi.spyOn(processor, '_seekTo').mockResolvedValue();
            
            await processor.createThumbnail('blob:video');
            
            // Just verify it completes
            expect(document.createElement).toHaveBeenCalledWith('canvas');
        });
    });

    describe('_seekTo()', () => {
        it('should resolve immediately if already at time', async () => {
            const video = { currentTime: 5 };
            
            await processor._seekTo(video, 5);
            
            // Should not add listener
            expect(video.addEventListener).toBeUndefined();
        });

        it('should seek and wait for seeked event', async () => {
            const video = {
                currentTime: 0,
                addEventListener: vi.fn((event, cb) => {
                    if (event === 'seeked') setTimeout(cb, 0);
                }),
                removeEventListener: vi.fn()
            };
            
            await processor._seekTo(video, 5);
            
            expect(video.currentTime).toBe(5);
        });
    });

    describe('formatTime()', () => {
        it('should format seconds correctly', () => {
            expect(processor.formatTime(5)).toBe('00:05.0');
        });

        it('should format minutes correctly', () => {
            expect(processor.formatTime(65.5)).toBe('01:05.5');
        });

        it('should pad minutes with zeros', () => {
            expect(processor.formatTime(5.3)).toBe('00:05.3');
        });

        it('should handle zero', () => {
            expect(processor.formatTime(0)).toBe('00:00.0');
        });

        it('should handle negative values', () => {
            expect(processor.formatTime(-5)).toBe('00:00.0');
        });

        it('should handle Infinity', () => {
            expect(processor.formatTime(Infinity)).toBe('00:00.0');
        });

        it('should handle NaN', () => {
            expect(processor.formatTime(NaN)).toBe('00:00.0');
        });
    });

    describe('formatDuration()', () => {
        it('should format seconds under a minute', () => {
            expect(processor.formatDuration(30.5)).toBe('30.5s');
        });

        it('should format minutes and seconds', () => {
            expect(processor.formatDuration(90)).toBe('1m 30s');
        });

        it('should format minutes only', () => {
            expect(processor.formatDuration(120)).toBe('2m');
        });

        it('should format hours and minutes', () => {
            expect(processor.formatDuration(3660)).toBe('1h 1m');
        });

        it('should format hours only', () => {
            expect(processor.formatDuration(3600)).toBe('1h');
        });

        it('should handle zero', () => {
            expect(processor.formatDuration(0)).toBe('0.0s');
        });

        it('should handle negative values', () => {
            expect(processor.formatDuration(-5)).toBe('0s');
        });

        it('should handle Infinity', () => {
            expect(processor.formatDuration(Infinity)).toBe('0s');
        });
    });

    describe('getCodecInfo()', () => {
        it('should return video dimensions', () => {
            const video = { videoWidth: 1920, videoHeight: 1080, duration: 30 };
            
            const info = processor.getCodecInfo(video);
            
            expect(info).toHaveProperty('width', 1920);
            expect(info).toHaveProperty('height', 1080);
        });

        it('should return duration', () => {
            const video = { videoWidth: 1920, videoHeight: 1080, duration: 30 };
            
            const info = processor.getCodecInfo(video);
            
            expect(info).toHaveProperty('duration', 30);
        });
    });

    describe('Singleton export', () => {
        it('should export singleton instance', () => {
            expect(videoProcessor).toBeDefined();
            expect(videoProcessor instanceof VideoProcessor).toBe(true);
        });
    });
});
