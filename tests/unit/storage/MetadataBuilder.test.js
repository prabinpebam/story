/**
 * Tests for MetadataBuilder
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MetadataBuilder } from '../../../src/core/storage/builders/MetadataBuilder.js';

describe('MetadataBuilder', () => {
    let builder;

    beforeEach(() => {
        builder = new MetadataBuilder();
    });

    describe('constructor', () => {
        it('should create builder with default values', () => {
            const metadata = builder.build();

            expect(metadata.title).toBe('Untitled Presentation');
            expect(metadata.description).toBe('');
            expect(metadata.author).toBeNull();
            expect(metadata.slideCount).toBe(0);
            expect(metadata.aspectRatio).toBe('16:9');
            expect(metadata.tags).toEqual([]);
            expect(metadata.language).toBe('en');
            expect(metadata.version).toBe(1);
        });

        it('should set timestamps', () => {
            const metadata = builder.build();

            expect(metadata.created).toBeDefined();
            expect(metadata.modified).toBeDefined();
        });
    });

    describe('setTitle', () => {
        it('should set title', () => {
            builder.setTitle('My Presentation');
            const metadata = builder.build();

            expect(metadata.title).toBe('My Presentation');
        });

        it('should default to "Untitled Presentation" for empty title', () => {
            builder.setTitle('');
            const metadata = builder.build();

            expect(metadata.title).toBe('Untitled Presentation');
        });

        it('should be chainable', () => {
            const result = builder.setTitle('Test');
            expect(result).toBe(builder);
        });
    });

    describe('setDescription', () => {
        it('should set description', () => {
            builder.setDescription('A great presentation');
            const metadata = builder.build();

            expect(metadata.description).toBe('A great presentation');
        });

        it('should default to empty string for null', () => {
            builder.setDescription(null);
            const metadata = builder.build();

            expect(metadata.description).toBe('');
        });
    });

    describe('setAuthor', () => {
        it('should set author with full user object', () => {
            const user = {
                id: 'user123',
                name: 'John Doe',
                email: 'john@example.com',
                avatarUrl: 'https://example.com/avatar.jpg'
            };
            builder.setAuthor(user);
            const metadata = builder.build();

            expect(metadata.author.id).toBe('user123');
            expect(metadata.author.name).toBe('John Doe');
            expect(metadata.author.email).toBe('john@example.com');
            expect(metadata.author.avatarUrl).toBe('https://example.com/avatar.jpg');
        });

        it('should handle user with displayName', () => {
            const user = { displayName: 'Display Name' };
            builder.setAuthor(user);
            const metadata = builder.build();

            expect(metadata.author.name).toBe('Display Name');
        });

        it('should handle user with picture (Google-style)', () => {
            const user = { picture: 'https://example.com/pic.jpg' };
            builder.setAuthor(user);
            const metadata = builder.build();

            expect(metadata.author.avatarUrl).toBe('https://example.com/pic.jpg');
        });

        it('should handle null user', () => {
            builder.setAuthor(null);
            const metadata = builder.build();

            expect(metadata.author).toBeNull();
        });
    });

    describe('setSlideCount', () => {
        it('should set slide count', () => {
            builder.setSlideCount(10);
            const metadata = builder.build();

            expect(metadata.slideCount).toBe(10);
        });
    });

    describe('setAspectRatio', () => {
        it('should set aspect ratio', () => {
            builder.setAspectRatio('4:3');
            const metadata = builder.build();

            expect(metadata.aspectRatio).toBe('4:3');
        });

        it('should default to 16:9 for null', () => {
            builder.setAspectRatio(null);
            const metadata = builder.build();

            expect(metadata.aspectRatio).toBe('16:9');
        });
    });

    describe('setTags', () => {
        it('should set tags array', () => {
            builder.setTags(['business', 'quarterly', 'report']);
            const metadata = builder.build();

            expect(metadata.tags).toEqual(['business', 'quarterly', 'report']);
        });

        it('should default to empty array for non-array', () => {
            builder.setTags('not an array');
            const metadata = builder.build();

            expect(metadata.tags).toEqual([]);
        });
    });

    describe('addTag', () => {
        it('should add a single tag', () => {
            builder.addTag('important');
            const metadata = builder.build();

            expect(metadata.tags).toContain('important');
        });

        it('should not add duplicate tags', () => {
            builder.addTag('test');
            builder.addTag('test');
            const metadata = builder.build();

            expect(metadata.tags.filter(t => t === 'test')).toHaveLength(1);
        });

        it('should not add empty tag', () => {
            builder.addTag('');
            const metadata = builder.build();

            expect(metadata.tags).toEqual([]);
        });
    });

    describe('setLanguage', () => {
        it('should set language', () => {
            builder.setLanguage('es');
            const metadata = builder.build();

            expect(metadata.language).toBe('es');
        });

        it('should default to en for null', () => {
            builder.setLanguage(null);
            const metadata = builder.build();

            expect(metadata.language).toBe('en');
        });
    });

    describe('setVersion', () => {
        it('should set version', () => {
            builder.setVersion(5);
            const metadata = builder.build();

            expect(metadata.version).toBe(5);
        });
    });

    describe('incrementVersion', () => {
        it('should increment version by 1', () => {
            builder.setVersion(3);
            builder.incrementVersion();
            const metadata = builder.build();

            expect(metadata.version).toBe(4);
        });

        it('should start from 1 if version is 0', () => {
            builder.setVersion(0);
            builder.incrementVersion();
            const metadata = builder.build();

            expect(metadata.version).toBe(1);
        });
    });

    describe('setCustomField', () => {
        it('should set custom field', () => {
            builder.setCustomField('customKey', { nested: 'value' });
            const metadata = builder.build();

            expect(metadata.customKey).toEqual({ nested: 'value' });
        });
    });

    describe('setCreated', () => {
        it('should set created from Date', () => {
            const date = new Date('2024-01-01');
            builder.setCreated(date);
            const metadata = builder.build();

            expect(metadata.created).toBe(date.toISOString());
        });

        it('should set created from string', () => {
            const dateStr = '2024-01-01T00:00:00.000Z';
            builder.setCreated(dateStr);
            const metadata = builder.build();

            expect(metadata.created).toBe(dateStr);
        });
    });

    describe('toJSON', () => {
        it('should return formatted JSON string', () => {
            builder.setTitle('Test');
            const json = builder.toJSON(true);

            expect(typeof json).toBe('string');
            expect(json).toContain('"title": "Test"');
        });

        it('should return compact JSON when pretty is false', () => {
            builder.setTitle('Test');
            const json = builder.toJSON(false);

            expect(json).not.toContain('\n');
        });
    });

    describe('fromExisting', () => {
        it('should create builder from existing metadata', () => {
            const existing = {
                title: 'Existing Presentation',
                description: 'Description',
                slideCount: 5,
                tags: ['tag1', 'tag2'],
                version: 10
            };

            const newBuilder = MetadataBuilder.fromExisting(existing);
            const metadata = newBuilder.build();

            expect(metadata.title).toBe('Existing Presentation');
            expect(metadata.description).toBe('Description');
            expect(metadata.slideCount).toBe(5);
            expect(metadata.tags).toEqual(['tag1', 'tag2']);
            expect(metadata.version).toBe(10);
        });

        it('should clone tags array', () => {
            const existing = { tags: ['original'] };
            const newBuilder = MetadataBuilder.fromExisting(existing);
            newBuilder.addTag('new');
            
            expect(existing.tags).not.toContain('new');
        });
    });

    describe('chaining', () => {
        it('should support method chaining', () => {
            const metadata = builder
                .setTitle('Chained')
                .setDescription('Description')
                .setSlideCount(10)
                .setAspectRatio('4:3')
                .addTag('test')
                .setLanguage('fr')
                .setVersion(2)
                .build();

            expect(metadata.title).toBe('Chained');
            expect(metadata.description).toBe('Description');
            expect(metadata.slideCount).toBe(10);
            expect(metadata.aspectRatio).toBe('4:3');
            expect(metadata.tags).toContain('test');
            expect(metadata.language).toBe('fr');
            expect(metadata.version).toBe(2);
        });
    });
});
