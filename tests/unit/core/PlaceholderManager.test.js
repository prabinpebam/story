import { describe, it, expect } from 'vitest';
import { placeholderManager } from '../../../src/core/PlaceholderManager.js';
import { PLACEHOLDER_TYPES } from '../../../src/core/constants/PlaceholderTypes.js';

describe('PlaceholderManager', () => {
    it('should create a placeholder with default values', () => {
        const placeholder = placeholderManager.createPlaceholder(PLACEHOLDER_TYPES.TITLE);
        
        expect(placeholder.id).toBeDefined();
        expect(placeholder.type).toBe('text');
        expect(placeholder.isPlaceholder).toBe(true);
        expect(placeholder.placeholderType).toBe(PLACEHOLDER_TYPES.TITLE);
        expect(placeholder.text).toBeDefined();
        expect(placeholder.style).toBeDefined();
    });

    it('should allow overriding options', () => {
        const options = { x: 50, y: 50, width: 500 };
        const placeholder = placeholderManager.createPlaceholder(PLACEHOLDER_TYPES.BODY, options);
        
        expect(placeholder.x).toBe(50);
        expect(placeholder.y).toBe(50);
        expect(placeholder.width).toBe(500);
    });

    it('should return correct allowed content types', () => {
        const titleContent = placeholderManager.getAllowedContentForType(PLACEHOLDER_TYPES.TITLE);
        expect(titleContent).toContain('text');
        expect(titleContent).not.toContain('image');

        const pictureContent = placeholderManager.getAllowedContentForType(PLACEHOLDER_TYPES.PICTURE);
        expect(pictureContent).toContain('image');
        
        const contentContent = placeholderManager.getAllowedContentForType(PLACEHOLDER_TYPES.CONTENT);
        expect(contentContent).toContain('text');
        expect(contentContent).toContain('image');
        expect(contentContent).toContain('video');
    });

    it('should identify placeholders correctly', () => {
        const placeholder = placeholderManager.createPlaceholder(PLACEHOLDER_TYPES.TITLE);
        const normalElement = { type: 'text', id: '123' };
        
        expect(placeholderManager.isPlaceholder(placeholder)).toBe(true);
        expect(placeholderManager.isPlaceholder(normalElement)).toBe(false);
    });

    it('should get correct prompt text', () => {
        const placeholder = placeholderManager.createPlaceholder(PLACEHOLDER_TYPES.TITLE);
        const prompt = placeholderManager.getPromptText(placeholder);
        
        expect(prompt).toBe(placeholder.text);
        expect(prompt).toBeTruthy();
    });
});
