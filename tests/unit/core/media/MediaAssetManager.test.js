import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the dependencies
vi.mock('../../../../src/core/Events.js', () => ({
    EventEmitter: class MockEventEmitter {
        constructor() {
            this.listeners = new Map();
        }
        on(event, callback) {
            if (!this.listeners.has(event)) {
                this.listeners.set(event, []);
            }
            this.listeners.get(event).push(callback);
        }
        emit(event, data) {
            const callbacks = this.listeners.get(event) || [];
            callbacks.forEach(cb => cb(data));
        }
    }
}));

vi.mock('../../../../src/core/constants/MediaDefaults.js', () => ({
    ASSET_ID_PREFIX: {
        image: 'img_',
        video: 'vid_'
    },
    SUPPORTED_IMAGE_FORMATS: ['image/png', 'image/jpeg', 'image/gif', 'image/webp'],
    SUPPORTED_VIDEO_FORMATS: ['video/mp4', 'video/webm'],
    FILE_SIZE_LIMITS: {
        inline: 100 * 1024, // 100KB
        image: 50 * 1024 * 1024, // 50MB
        video: 200 * 1024 * 1024 // 200MB
    },
    isImageFormat: (type) => ['image/png', 'image/jpeg', 'image/gif', 'image/webp'].includes(type),
    isVideoFormat: (type) => ['video/mp4', 'video/webm'].includes(type),
    validateFileSize: (file) => {
        const isVideo = ['video/mp4', 'video/webm'].includes(file.type);
        const limit = isVideo ? 200 * 1024 * 1024 : 50 * 1024 * 1024;
        return file.size <= limit 
            ? { valid: true } 
            : { valid: false, message: 'File too large' };
    }
}));

import { MediaAssetManager, mediaAssetManager } from '../../../../src/core/media/MediaAssetManager.js';

describe('MediaAssetManager', () => {
    let manager;

    beforeEach(() => {
        vi.clearAllMocks();
        
        // Create fresh instance for isolation
        manager = new MediaAssetManager();
        
        // Mock URL methods
        vi.stubGlobal('URL', {
            createObjectURL: vi.fn().mockReturnValue('blob:test-url'),
            revokeObjectURL: vi.fn()
        });
    });

    afterEach(() => {
        // Clear manager before unstubbing globals (so clear() has access to URL mock)
        manager.clear();
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    describe('constructor', () => {
        it('should initialize with empty assets map', () => {
            expect(manager.assets).toBeDefined();
            expect(manager.assets.size).toBe(0);
        });

        it('should initialize with empty blobToAsset map', () => {
            expect(manager.blobToAsset).toBeDefined();
            expect(manager.blobToAsset.size).toBe(0);
        });

        it('should initialize with empty hashToAsset map', () => {
            expect(manager.hashToAsset).toBeDefined();
            expect(manager.hashToAsset.size).toBe(0);
        });

        it('should initialize with empty pathToAsset map', () => {
            expect(manager.pathToAsset).toBeDefined();
            expect(manager.pathToAsset.size).toBe(0);
        });

        it('should extend EventEmitter', () => {
            expect(typeof manager.on).toBe('function');
            expect(typeof manager.emit).toBe('function');
        });
    });

    describe('importFile() - format validation', () => {
        it('should reject unsupported formats', async () => {
            const unsupportedFile = { type: 'application/xyz', name: 'test.xyz', size: 100 };
            
            await expect(manager.importFile(unsupportedFile))
                .rejects.toThrow('Unsupported format');
        });

        it('should throw for unsupported image format', async () => {
            const unsupportedFile = { type: 'image/tiff', name: 'test.tiff', size: 100 };
            
            await expect(manager.importFile(unsupportedFile))
                .rejects.toThrow();
        });

        it('should throw for unsupported video format', async () => {
            const unsupportedFile = { type: 'video/avi', name: 'test.avi', size: 100 };
            
            await expect(manager.importFile(unsupportedFile))
                .rejects.toThrow();
        });
    });

    describe('getBlobUrl()', () => {
        it('should return null for non-existent asset', () => {
            expect(manager.getBlobUrl('non-existent')).toBeNull();
        });

        it('should return blob URL for registered asset', () => {
            // Manually register an asset
            const assetId = 'img_test123';
            const blob = new Blob(['test'], { type: 'image/png' });
            manager.assets.set(assetId, {
                id: assetId,
                blob,
                blobUrl: null,
                mimeType: 'image/png',
                size: 4,
                refCount: 0,
                historyRefCount: 0,
                metadata: { width: 100, height: 100 }
            });
            
            const url = manager.getBlobUrl(assetId);
            
            expect(url).toBe('blob:test-url');
        });

        it('should cache blob URL after creation', () => {
            const assetId = 'img_test123';
            const blob = new Blob(['test'], { type: 'image/png' });
            manager.assets.set(assetId, {
                id: assetId,
                blob,
                blobUrl: null,
                mimeType: 'image/png',
                size: 4,
                refCount: 0,
                historyRefCount: 0,
                metadata: { width: 100, height: 100 }
            });
            
            manager.getBlobUrl(assetId);
            manager.getBlobUrl(assetId);
            
            // Should only create once
            expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
        });

        it('should return existing blobUrl without creating new one', () => {
            const assetId = 'img_test123';
            manager.assets.set(assetId, {
                id: assetId,
                blob: new Blob(['test']),
                blobUrl: 'existing-blob-url',
                mimeType: 'image/png',
                size: 4,
                refCount: 0,
                historyRefCount: 0,
                metadata: {}
            });
            
            const url = manager.getBlobUrl(assetId);
            
            expect(url).toBe('existing-blob-url');
            expect(URL.createObjectURL).not.toHaveBeenCalled();
        });
    });

    describe('getDataUrl()', () => {
        it('should return null for non-existent asset', () => {
            expect(manager.getDataUrl('non-existent')).toBeNull();
        });

        it('should return dataUrl if present', () => {
            const assetId = 'img_test123';
            manager.assets.set(assetId, {
                id: assetId,
                dataUrl: 'data:image/png;base64,abc123',
                mimeType: 'image/png',
                metadata: {}
            });
            
            const url = manager.getDataUrl(assetId);
            
            expect(url).toBe('data:image/png;base64,abc123');
        });

        it('should return null if no dataUrl', () => {
            const assetId = 'img_test123';
            manager.assets.set(assetId, {
                id: assetId,
                dataUrl: null,
                mimeType: 'image/png',
                metadata: {}
            });
            
            const url = manager.getDataUrl(assetId);
            
            expect(url).toBeNull();
        });
    });

    describe('getMetadata()', () => {
        it('should return null for non-existent asset', () => {
            expect(manager.getMetadata('non-existent')).toBeNull();
        });

        it('should return metadata for existing asset', () => {
            const assetId = 'img_test123';
            const metadata = { width: 800, height: 600, animated: false };
            manager.assets.set(assetId, {
                id: assetId,
                metadata,
                mimeType: 'image/png'
            });
            
            const result = manager.getMetadata(assetId);
            
            expect(result).toEqual(metadata);
        });
    });

    describe('getEntry()', () => {
        it('should return null for non-existent asset', () => {
            expect(manager.getEntry('non-existent')).toBeNull();
        });

        it('should return full entry for existing asset', () => {
            const assetId = 'img_test123';
            const entry = {
                id: assetId,
                blob: new Blob(['test']),
                mimeType: 'image/png',
                size: 100,
                refCount: 0,
                historyRefCount: 0,
                metadata: { width: 100, height: 100 }
            };
            manager.assets.set(assetId, entry);
            
            const result = manager.getEntry(assetId);
            
            expect(result).toBe(entry);
        });
    });

    describe('has()', () => {
        it('should return false for non-existent asset', () => {
            expect(manager.has('non-existent')).toBe(false);
        });

        it('should return true for existing asset', () => {
            manager.assets.set('img_test123', { id: 'img_test123' });
            
            expect(manager.has('img_test123')).toBe(true);
        });
    });

    describe('Reference counting - retain()', () => {
        it('should increment refCount', () => {
            const assetId = 'img_test123';
            const entry = { id: assetId, refCount: 0, historyRefCount: 0 };
            manager.assets.set(assetId, entry);
            
            manager.retain(assetId);
            
            expect(entry.refCount).toBe(1);
        });

        it('should increment refCount multiple times', () => {
            const assetId = 'img_test123';
            const entry = { id: assetId, refCount: 0, historyRefCount: 0 };
            manager.assets.set(assetId, entry);
            
            manager.retain(assetId);
            manager.retain(assetId);
            manager.retain(assetId);
            
            expect(entry.refCount).toBe(3);
        });

        it('should emit asset-retained event', () => {
            const assetId = 'img_test123';
            manager.assets.set(assetId, { id: assetId, refCount: 0, historyRefCount: 0 });
            
            const callback = vi.fn();
            manager.on('asset-retained', callback);
            
            manager.retain(assetId);
            
            expect(callback).toHaveBeenCalled();
        });

        it('should not throw for non-existent asset', () => {
            expect(() => manager.retain('non-existent')).not.toThrow();
        });
    });

    describe('Reference counting - release()', () => {
        it('should decrement refCount', () => {
            const assetId = 'img_test123';
            const entry = { id: assetId, refCount: 2, historyRefCount: 0 };
            manager.assets.set(assetId, entry);
            
            manager.release(assetId);
            
            expect(entry.refCount).toBe(1);
        });

        it('should emit asset-released event', () => {
            const assetId = 'img_test123';
            manager.assets.set(assetId, { id: assetId, refCount: 1, historyRefCount: 0 });
            
            const callback = vi.fn();
            manager.on('asset-released', callback);
            
            manager.release(assetId);
            
            expect(callback).toHaveBeenCalled();
        });

        it('should not go below zero', () => {
            const assetId = 'img_test123';
            const entry = { id: assetId, refCount: 0, historyRefCount: 0 };
            manager.assets.set(assetId, entry);
            
            manager.release(assetId);
            
            expect(entry.refCount).toBe(0);
        });

        it('should not throw for non-existent asset', () => {
            expect(() => manager.release('non-existent')).not.toThrow();
        });
    });

    describe('Reference counting - retainForHistory()', () => {
        it('should increment historyRefCount', () => {
            const assetId = 'img_test123';
            const entry = { id: assetId, refCount: 0, historyRefCount: 0 };
            manager.assets.set(assetId, entry);
            
            manager.retainForHistory(assetId);
            
            expect(entry.historyRefCount).toBe(1);
        });

        it('should not affect refCount', () => {
            const assetId = 'img_test123';
            const entry = { id: assetId, refCount: 5, historyRefCount: 0 };
            manager.assets.set(assetId, entry);
            
            manager.retainForHistory(assetId);
            
            expect(entry.refCount).toBe(5);
        });
    });

    describe('Reference counting - releaseFromHistory()', () => {
        it('should decrement historyRefCount', () => {
            const assetId = 'img_test123';
            const entry = { id: assetId, refCount: 0, historyRefCount: 2 };
            manager.assets.set(assetId, entry);
            
            manager.releaseFromHistory(assetId);
            
            expect(entry.historyRefCount).toBe(1);
        });

        it('should not go below zero', () => {
            const assetId = 'img_test123';
            const entry = { id: assetId, refCount: 0, historyRefCount: 0 };
            manager.assets.set(assetId, entry);
            
            manager.releaseFromHistory(assetId);
            
            expect(entry.historyRefCount).toBe(0);
        });
    });

    describe('getStats()', () => {
        it('should return statistics object', () => {
            const stats = manager.getStats();
            
            expect(stats).toHaveProperty('totalAssets');
            expect(stats).toHaveProperty('imageCount');
            expect(stats).toHaveProperty('videoCount');
            expect(stats).toHaveProperty('totalSize');
            expect(stats).toHaveProperty('totalSizeFormatted');
            expect(stats).toHaveProperty('orphanedCount');
            expect(stats).toHaveProperty('blobUrlCount');
        });

        it('should return zero counts for empty manager', () => {
            const stats = manager.getStats();
            
            expect(stats.totalAssets).toBe(0);
            expect(stats.imageCount).toBe(0);
            expect(stats.videoCount).toBe(0);
            expect(stats.totalSize).toBe(0);
        });

        it('should count images correctly', () => {
            manager.assets.set('img_1', { 
                id: 'img_1', 
                mimeType: 'image/png', 
                category: 'image',
                size: 1000,
                refCount: 1,
                historyRefCount: 0,
                blobUrl: null
            });
            manager.assets.set('img_2', { 
                id: 'img_2', 
                mimeType: 'image/jpeg', 
                category: 'image',
                size: 2000,
                refCount: 1,
                historyRefCount: 0,
                blobUrl: 'blob:url'
            });
            
            const stats = manager.getStats();
            
            expect(stats.totalAssets).toBe(2);
            expect(stats.imageCount).toBe(2);
            expect(stats.totalSize).toBe(3000);
        });

        it('should count videos correctly', () => {
            manager.assets.set('vid_1', { 
                id: 'vid_1', 
                mimeType: 'video/mp4', 
                category: 'video',
                size: 5000,
                refCount: 1,
                historyRefCount: 0,
                blobUrl: null
            });
            
            const stats = manager.getStats();
            
            expect(stats.videoCount).toBe(1);
        });

        it('should count orphaned assets', () => {
            manager.assets.set('img_1', { 
                id: 'img_1', 
                mimeType: 'image/png', 
                category: 'image',
                size: 1000,
                refCount: 0,
                historyRefCount: 0,
                blobUrl: null
            });
            
            const stats = manager.getStats();
            
            expect(stats.orphanedCount).toBe(1);
        });

        it('should count blob URLs', () => {
            // blobUrlCount is based on blobToAsset map size, not asset entries
            manager.assets.set('img_1', { 
                id: 'img_1', 
                category: 'image',
                size: 1000,
                refCount: 1,
                historyRefCount: 0,
                blobUrl: 'blob:url1'
            });
            manager.assets.set('img_2', { 
                id: 'img_2', 
                category: 'image',
                size: 1000,
                refCount: 1,
                historyRefCount: 0,
                blobUrl: 'blob:url2'
            });
            // Also need to populate blobToAsset map
            manager.blobToAsset.set('blob:url1', 'img_1');
            manager.blobToAsset.set('blob:url2', 'img_2');
            
            const stats = manager.getStats();
            
            expect(stats.blobUrlCount).toBe(2);
        });
    });

    describe('clear()', () => {
        it('should clear all assets', () => {
            manager.assets.set('img_1', { id: 'img_1', blobUrl: null });
            manager.assets.set('img_2', { id: 'img_2', blobUrl: null });
            
            expect(manager.assets.size).toBe(2);
            
            manager.clear();
            
            expect(manager.assets.size).toBe(0);
        });

        it('should revoke blob URLs', () => {
            manager.assets.set('img_1', { id: 'img_1', blobUrl: 'blob:url1' });
            manager.assets.set('img_2', { id: 'img_2', blobUrl: 'blob:url2' });
            
            manager.clear();
            
            expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:url1');
            expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:url2');
        });

        it('should emit cleared event', () => {
            const callback = vi.fn();
            manager.on('cleared', callback);
            
            manager.clear();
            
            expect(callback).toHaveBeenCalled();
        });

        it('should clear all maps', () => {
            manager.assets.set('img_1', { id: 'img_1', blobUrl: null });
            manager.blobToAsset.set('blob:url', 'img_1');
            manager.hashToAsset.set('hash123', 'img_1');
            manager.pathToAsset.set('/path/to/file', 'img_1');
            
            manager.clear();
            
            expect(manager.assets.size).toBe(0);
            expect(manager.blobToAsset.size).toBe(0);
            expect(manager.hashToAsset.size).toBe(0);
            expect(manager.pathToAsset.size).toBe(0);
        });
    });

    describe('Singleton export', () => {
        it('should export singleton instance', () => {
            expect(mediaAssetManager).toBeDefined();
            expect(mediaAssetManager instanceof MediaAssetManager).toBe(true);
        });

        it('should export class for testing', () => {
            expect(MediaAssetManager).toBeDefined();
            expect(typeof MediaAssetManager).toBe('function');
        });
    });

    describe('Asset registration workflow', () => {
        it('should properly track blobToAsset mapping when blob URL is created', () => {
            const assetId = 'img_test123';
            const blob = new Blob(['test'], { type: 'image/png' });
            manager.assets.set(assetId, {
                id: assetId,
                blob,
                blobUrl: null,
                mimeType: 'image/png',
                size: 4,
                refCount: 0,
                historyRefCount: 0,
                metadata: {}
            });
            
            manager.getBlobUrl(assetId);
            
            // Should track the mapping
            expect(manager.blobToAsset.has('blob:test-url')).toBe(true);
            expect(manager.blobToAsset.get('blob:test-url')).toBe(assetId);
        });

        it('should handle multiple assets', () => {
            manager.assets.set('img_1', { id: 'img_1', blobUrl: null, blob: new Blob(['1']) });
            manager.assets.set('img_2', { id: 'img_2', blobUrl: null, blob: new Blob(['2']) });
            manager.assets.set('vid_1', { id: 'vid_1', blobUrl: null, blob: new Blob(['3']) });
            
            expect(manager.assets.size).toBe(3);
            expect(manager.has('img_1')).toBe(true);
            expect(manager.has('img_2')).toBe(true);
            expect(manager.has('vid_1')).toBe(true);
            expect(manager.has('img_3')).toBe(false);
        });
    });
});
