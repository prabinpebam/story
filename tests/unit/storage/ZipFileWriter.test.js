/**
 * Tests for ZipFileWriter
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ZipFileWriter } from '../../../src/core/storage/zip/ZipFileWriter.js';

describe('ZipFileWriter', () => {
    let writer;

    beforeEach(() => {
        writer = new ZipFileWriter();
    });

    describe('constructor', () => {
        it('should create a new writer instance', () => {
            expect(writer).toBeInstanceOf(ZipFileWriter);
        });
    });

    describe('addManifest', () => {
        it('should add manifest.json to the archive', () => {
            const manifest = {
                formatType: 'story-presentation',
                formatVersion: '1.0.0'
            };

            writer.addManifest(manifest);

            expect(writer.hasFile('manifest.json')).toBe(true);
        });
    });

    describe('addMetadata', () => {
        it('should add metadata to document folder', () => {
            const metadata = { title: 'Test Presentation' };

            writer.addMetadata(metadata);

            expect(writer.hasFile('document/metadata.json')).toBe(true);
        });
    });

    describe('addTheme', () => {
        it('should add theme to document folder', () => {
            const theme = { name: 'Default', colors: {} };

            writer.addTheme(theme);

            expect(writer.hasFile('document/theme.json')).toBe(true);
        });
    });

    describe('addSlide', () => {
        it('should add slide to slides folder', () => {
            const slideData = { id: 'slide-1', elements: [] };

            writer.addSlide('1', slideData);

            expect(writer.hasFile('document/slides/slide-1.json')).toBe(true);
        });

        it('should add multiple slides', () => {
            writer.addSlide('1', { id: 'slide-1' });
            writer.addSlide('2', { id: 'slide-2' });
            writer.addSlide('3', { id: 'slide-3' });

            expect(writer.hasFile('document/slides/slide-1.json')).toBe(true);
            expect(writer.hasFile('document/slides/slide-2.json')).toBe(true);
            expect(writer.hasFile('document/slides/slide-3.json')).toBe(true);
        });
    });

    describe('addImage', () => {
        it('should add image to assets/images folder', async () => {
            const blob = new Blob(['fake image data'], { type: 'image/png' });

            await writer.addImage('test.png', blob);

            expect(writer.hasFile('assets/images/test.png')).toBe(true);
        });
    });

    describe('addVideo', () => {
        it('should add video to assets/videos folder', async () => {
            const blob = new Blob(['fake video data'], { type: 'video/mp4' });

            await writer.addVideo('test.mp4', blob);

            expect(writer.hasFile('assets/videos/test.mp4')).toBe(true);
        });
    });

    describe('addFont', () => {
        it('should add font to assets/fonts folder', async () => {
            const blob = new Blob(['fake font data'], { type: 'font/ttf' });

            await writer.addFont('custom.ttf', blob);

            expect(writer.hasFile('assets/fonts/custom.ttf')).toBe(true);
        });
    });

    describe('addAsset', () => {
        it('should add asset with custom path', async () => {
            const blob = new Blob(['data']);

            await writer.addAsset('custom/path/file.bin', blob);

            expect(writer.hasFile('assets/custom/path/file.bin')).toBe(true);
        });
    });

    describe('addThumbnail', () => {
        it('should add thumbnail to preview folder', async () => {
            const blob = new Blob(['thumbnail data'], { type: 'image/png' });

            await writer.addThumbnail(blob);

            expect(writer.hasFile('preview/thumbnail.png')).toBe(true);
        });
    });

    describe('addFile', () => {
        it('should add file at arbitrary path', () => {
            writer.addFile('custom/path.txt', 'content');

            expect(writer.hasFile('custom/path.txt')).toBe(true);
        });
    });

    describe('hasFile', () => {
        it('should return false for non-existent file', () => {
            expect(writer.hasFile('nonexistent.txt')).toBe(false);
        });

        it('should return true for existing file', () => {
            writer.addFile('exists.txt', 'content');
            expect(writer.hasFile('exists.txt')).toBe(true);
        });
    });

    describe('removeFile', () => {
        it('should remove file from archive', () => {
            writer.addFile('toremove.txt', 'content');
            expect(writer.hasFile('toremove.txt')).toBe(true);

            writer.removeFile('toremove.txt');
            expect(writer.hasFile('toremove.txt')).toBe(false);
        });
    });

    describe('listFiles', () => {
        it('should return empty array for empty archive', () => {
            expect(writer.listFiles()).toEqual([]);
        });

        it('should list all files in archive', () => {
            writer.addFile('file1.txt', 'content1');
            writer.addFile('file2.txt', 'content2');
            writer.addFile('folder/file3.txt', 'content3');

            const files = writer.listFiles();

            expect(files).toContain('file1.txt');
            expect(files).toContain('file2.txt');
            expect(files).toContain('folder/file3.txt');
            expect(files.length).toBe(3);
        });
    });

    describe('generate', () => {
        it('should generate a Blob', async () => {
            writer.addManifest({ test: true });

            const blob = await writer.generate();

            expect(blob).toBeInstanceOf(Blob);
            expect(blob.size).toBeGreaterThan(0);
        });

        it('should generate compressed content', async () => {
            // Add some repetitive content that compresses well
            const largeContent = 'A'.repeat(10000);
            writer.addFile('large.txt', largeContent);

            const blob = await writer.generate();

            // Compressed size should be much smaller than original
            expect(blob.size).toBeLessThan(largeContent.length);
        });
    });

    describe('generateArrayBuffer', () => {
        it('should generate an ArrayBuffer', async () => {
            writer.addManifest({ test: true });

            const buffer = await writer.generateArrayBuffer();

            expect(buffer).toBeInstanceOf(ArrayBuffer);
            expect(buffer.byteLength).toBeGreaterThan(0);
        });
    });

    describe('generateBase64', () => {
        it('should generate a base64 string', async () => {
            writer.addManifest({ test: true });

            const base64 = await writer.generateBase64();

            expect(typeof base64).toBe('string');
            expect(base64.length).toBeGreaterThan(0);
        });
    });
});
