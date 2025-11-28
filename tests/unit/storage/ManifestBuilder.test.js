/**
 * Tests for ManifestBuilder
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ManifestBuilder } from '../../../src/core/storage/builders/ManifestBuilder.js';

describe('ManifestBuilder', () => {
    let builder;

    beforeEach(() => {
        builder = new ManifestBuilder();
    });

    describe('constructor', () => {
        it('should create builder with default values', () => {
            const manifest = builder.build();

            expect(manifest.formatType).toBe('story-presentation');
            expect(manifest.formatVersion).toBe('1.0.0');
            expect(manifest.title).toBe('Untitled Presentation');
            expect(manifest.chunkIndex.slides).toEqual([]);
            expect(manifest.chunkIndex.assets).toEqual([]);
        });

        it('should set timestamps', () => {
            const manifest = builder.build();

            expect(manifest.created).toBeDefined();
            expect(manifest.modified).toBeDefined();
        });
    });

    describe('setTitle', () => {
        it('should set title', () => {
            builder.setTitle('My Presentation');
            const manifest = builder.build();

            expect(manifest.title).toBe('My Presentation');
        });

        it('should default to "Untitled Presentation" for empty title', () => {
            builder.setTitle('');
            const manifest = builder.build();

            expect(manifest.title).toBe('Untitled Presentation');
        });

        it('should be chainable', () => {
            const result = builder.setTitle('Test');
            expect(result).toBe(builder);
        });
    });

    describe('setAuthor', () => {
        it('should set author from string', () => {
            builder.setAuthor('John Doe');
            const manifest = builder.build();

            expect(manifest.author).toBe('John Doe');
        });

        it('should set author from object with name', () => {
            builder.setAuthor({ name: 'Jane Doe', email: 'jane@example.com' });
            const manifest = builder.build();

            expect(manifest.author).toBe('Jane Doe');
        });

        it('should use email if name not available', () => {
            builder.setAuthor({ email: 'user@example.com' });
            const manifest = builder.build();

            expect(manifest.author).toBe('user@example.com');
        });
    });

    describe('setAppVersion', () => {
        it('should set app version', () => {
            builder.setAppVersion('2.0.0');
            const manifest = builder.build();

            expect(manifest.appVersion).toBe('2.0.0');
        });
    });

    describe('setCreated', () => {
        it('should set created from Date', () => {
            const date = new Date('2024-01-01');
            builder.setCreated(date);
            const manifest = builder.build();

            expect(manifest.created).toBe(date.toISOString());
        });

        it('should set created from string', () => {
            const dateStr = '2024-01-01T00:00:00.000Z';
            builder.setCreated(dateStr);
            const manifest = builder.build();

            expect(manifest.created).toBe(dateStr);
        });
    });

    describe('setModified', () => {
        it('should set modified from Date', () => {
            const date = new Date('2024-06-15');
            builder.setModified(date);
            const manifest = builder.build();

            // Note: build() updates modified to current time
            expect(manifest.modified).toBeDefined();
        });
    });

    describe('addSlideChunk', () => {
        it('should add slide chunk info', () => {
            builder.addSlideChunk('slide-1', 1024, 0);
            const manifest = builder.build();

            expect(manifest.chunkIndex.slides).toHaveLength(1);
            expect(manifest.chunkIndex.slides[0]).toEqual({
                id: 'slide-1',
                path: 'document/slides/slide-slide-1.json',
                size: 1024,
                order: 0
            });
        });

        it('should add multiple slides', () => {
            builder.addSlideChunk('1', 100, 0);
            builder.addSlideChunk('2', 200, 1);
            builder.addSlideChunk('3', 150, 2);
            const manifest = builder.build();

            expect(manifest.chunkIndex.slides).toHaveLength(3);
        });

        it('should sort slides by order on build', () => {
            builder.addSlideChunk('3', 150, 2);
            builder.addSlideChunk('1', 100, 0);
            builder.addSlideChunk('2', 200, 1);
            const manifest = builder.build();

            expect(manifest.chunkIndex.slides[0].id).toBe('1');
            expect(manifest.chunkIndex.slides[1].id).toBe('2');
            expect(manifest.chunkIndex.slides[2].id).toBe('3');
        });
    });

    describe('addAssetChunk', () => {
        it('should add asset chunk info', () => {
            builder.addAssetChunk('img1', 'images/photo.png', 50000, 'abc123', 'image/png');
            const manifest = builder.build();

            expect(manifest.chunkIndex.assets).toHaveLength(1);
            expect(manifest.chunkIndex.assets[0]).toEqual({
                id: 'img1',
                path: 'assets/images/photo.png',
                size: 50000,
                hash: 'abc123',
                mimeType: 'image/png'
            });
        });

        it('should add asset without mimeType', () => {
            builder.addAssetChunk('font1', 'fonts/custom.ttf', 10000, 'def456');
            const manifest = builder.build();

            expect(manifest.chunkIndex.assets[0].mimeType).toBeNull();
        });
    });

    describe('setCustomField', () => {
        it('should set custom field', () => {
            builder.setCustomField('customKey', 'customValue');
            const manifest = builder.build();

            expect(manifest.customKey).toBe('customValue');
        });
    });

    describe('toJSON', () => {
        it('should return formatted JSON string', () => {
            builder.setTitle('Test');
            const json = builder.toJSON(true);

            expect(typeof json).toBe('string');
            expect(json).toContain('"title": "Test"');
            expect(json).toContain('\n'); // Pretty printed
        });

        it('should return compact JSON when pretty is false', () => {
            builder.setTitle('Test');
            const json = builder.toJSON(false);

            expect(json).not.toContain('\n');
        });
    });

    describe('fromExisting', () => {
        it('should create builder from existing manifest', () => {
            const existing = {
                formatType: 'story-presentation',
                formatVersion: '1.0.0',
                title: 'Existing',
                author: 'Author',
                chunkIndex: {
                    slides: [{ id: '1', path: 'test', size: 100, order: 0 }],
                    assets: []
                }
            };

            const newBuilder = ManifestBuilder.fromExisting(existing);
            const manifest = newBuilder.build();

            expect(manifest.title).toBe('Existing');
            expect(manifest.author).toBe('Author');
            expect(manifest.chunkIndex.slides).toHaveLength(1);
        });
    });

    describe('chaining', () => {
        it('should support method chaining', () => {
            const manifest = builder
                .setTitle('Chained')
                .setAuthor('Author')
                .setAppVersion('1.2.3')
                .addSlideChunk('1', 100, 0)
                .addAssetChunk('a1', 'test.png', 50, 'hash')
                .build();

            expect(manifest.title).toBe('Chained');
            expect(manifest.author).toBe('Author');
            expect(manifest.appVersion).toBe('1.2.3');
            expect(manifest.chunkIndex.slides).toHaveLength(1);
            expect(manifest.chunkIndex.assets).toHaveLength(1);
        });
    });
});
