/**
 * Tests for ZipFileReader
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ZipFileWriter } from '../../../src/core/storage/zip/ZipFileWriter.js';
import { ZipFileReader } from '../../../src/core/storage/zip/ZipFileReader.js';

describe('ZipFileReader', () => {
    let writer;
    let reader;

    beforeEach(() => {
        writer = new ZipFileWriter();
        reader = new ZipFileReader();
    });

    async function createTestZip() {
        // Create a test archive
        writer.addManifest({
            formatType: 'story-presentation',
            formatVersion: '1.0.0',
            title: 'Test Presentation',
            chunkIndex: {
                slides: [
                    { id: '1', path: 'document/slides/slide-1.json', size: 100 },
                    { id: '2', path: 'document/slides/slide-2.json', size: 100 }
                ],
                assets: [
                    { id: 'img1', path: 'assets/images/test.png', size: 500 }
                ]
            }
        });

        writer.addMetadata({
            title: 'Test Presentation',
            slideCount: 2
        });

        writer.addTheme({
            name: 'Default',
            colors: { primary: '#007AFF' }
        });

        writer.addSlide('1', {
            id: 'slide-1',
            elements: [{ type: 'text', text: 'Hello' }]
        });

        writer.addSlide('2', {
            id: 'slide-2',
            elements: []
        });

        await writer.addImage('test.png', new Blob(['fake image'], { type: 'image/png' }));
        await writer.addThumbnail(new Blob(['thumb'], { type: 'image/png' }));

        return writer.generate();
    }

    describe('init', () => {
        it('should initialize with valid ZIP data', async () => {
            const blob = await createTestZip();
            await reader.init(blob);
            expect(reader.isInitialized).toBe(true);
        });

        it('should throw on invalid data', async () => {
            const invalidBlob = new Blob(['not a zip file']);
            await expect(reader.init(invalidBlob)).rejects.toThrow();
        });
    });

    describe('readManifest', () => {
        it('should read manifest.json', async () => {
            const blob = await createTestZip();
            await reader.init(blob);

            const manifest = await reader.readManifest();

            expect(manifest.formatType).toBe('story-presentation');
            expect(manifest.formatVersion).toBe('1.0.0');
            expect(manifest.title).toBe('Test Presentation');
        });

        it('should throw if not initialized', () => {
            expect(() => reader._ensureInit()).toThrow('not initialized');
        });
    });

    describe('readMetadata', () => {
        it('should read metadata.json', async () => {
            const blob = await createTestZip();
            await reader.init(blob);

            const metadata = await reader.readMetadata();

            expect(metadata.title).toBe('Test Presentation');
            expect(metadata.slideCount).toBe(2);
        });
    });

    describe('readTheme', () => {
        it('should read theme.json', async () => {
            const blob = await createTestZip();
            await reader.init(blob);

            const theme = await reader.readTheme();

            expect(theme.name).toBe('Default');
            expect(theme.colors.primary).toBe('#007AFF');
        });
    });

    describe('listSlideIds', () => {
        it('should list all slide IDs', async () => {
            const blob = await createTestZip();
            await reader.init(blob);

            const slideIds = await reader.listSlideIds();

            expect(slideIds).toContain('1');
            expect(slideIds).toContain('2');
            expect(slideIds.length).toBe(2);
        });
    });

    describe('readSlide', () => {
        it('should read a single slide', async () => {
            const blob = await createTestZip();
            await reader.init(blob);

            const slide = await reader.readSlide('1');

            expect(slide.id).toBe('slide-1');
            expect(slide.elements).toHaveLength(1);
            expect(slide.elements[0].type).toBe('text');
        });

        it('should throw for non-existent slide', async () => {
            const blob = await createTestZip();
            await reader.init(blob);

            await expect(reader.readSlide('999')).rejects.toThrow();
        });
    });

    describe('readAllSlides', () => {
        it('should read all slides', async () => {
            const blob = await createTestZip();
            await reader.init(blob);

            const slides = await reader.readAllSlides();

            expect(slides).toHaveLength(2);
        });
    });

    describe('readAssetAsBlob', () => {
        it('should read asset as Blob', async () => {
            const blob = await createTestZip();
            await reader.init(blob);

            const assetBlob = await reader.readAssetAsBlob('images/test.png');

            expect(assetBlob).toBeInstanceOf(Blob);
        });

        it('should throw for non-existent asset', async () => {
            const blob = await createTestZip();
            await reader.init(blob);

            await expect(reader.readAssetAsBlob('nonexistent.png')).rejects.toThrow();
        });
    });

    describe('readAssetAsArrayBuffer', () => {
        it('should read asset as ArrayBuffer', async () => {
            const blob = await createTestZip();
            await reader.init(blob);

            const buffer = await reader.readAssetAsArrayBuffer('images/test.png');

            expect(buffer).toBeInstanceOf(ArrayBuffer);
        });
    });

    describe('readAssetAsBase64', () => {
        it('should read asset as base64', async () => {
            const blob = await createTestZip();
            await reader.init(blob);

            const base64 = await reader.readAssetAsBase64('images/test.png');

            expect(typeof base64).toBe('string');
        });
    });

    describe('readAssetAsDataUrl', () => {
        it('should read asset as data URL', async () => {
            const blob = await createTestZip();
            await reader.init(blob);

            const dataUrl = await reader.readAssetAsDataUrl('images/test.png', 'image/png');

            expect(dataUrl.startsWith('data:image/png;base64,')).toBe(true);
        });
    });

    describe('readThumbnail', () => {
        it('should read thumbnail', async () => {
            const blob = await createTestZip();
            await reader.init(blob);

            const thumbnail = await reader.readThumbnail();

            expect(thumbnail).toBeInstanceOf(Blob);
        });
    });

    describe('listAssets', () => {
        it('should list all assets', async () => {
            const blob = await createTestZip();
            await reader.init(blob);

            const assets = await reader.listAssets();

            expect(assets.some(a => a.path.includes('test.png'))).toBe(true);
        });
    });

    describe('hasFile', () => {
        it('should return true for existing file', async () => {
            const blob = await createTestZip();
            await reader.init(blob);

            expect(reader.hasFile('manifest.json')).toBe(true);
        });

        it('should return false for non-existent file', async () => {
            const blob = await createTestZip();
            await reader.init(blob);

            expect(reader.hasFile('nonexistent.txt')).toBe(false);
        });
    });

    describe('readFileAsText', () => {
        it('should read file as text', async () => {
            const blob = await createTestZip();
            await reader.init(blob);

            const content = await reader.readFileAsText('manifest.json');

            expect(content).toContain('story-presentation');
        });

        it('should return null for non-existent file', async () => {
            const blob = await createTestZip();
            await reader.init(blob);

            const content = await reader.readFileAsText('nonexistent.txt');

            expect(content).toBeNull();
        });
    });

    describe('getFileCount', () => {
        it('should return correct file count', async () => {
            const blob = await createTestZip();
            await reader.init(blob);

            const count = reader.getFileCount();

            expect(count).toBeGreaterThan(0);
        });
    });
});
