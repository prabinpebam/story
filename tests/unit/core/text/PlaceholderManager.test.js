/**
 * PlaceholderManager Unit Tests
 */

import { describe, it, expect } from 'vitest';
import { PlaceholderManager } from '../../../../src/core/text/PlaceholderManager.js';

describe('PlaceholderManager', () => {
    describe('isPlaceholder', () => {
        it('should return true for elements with isPlaceholder flag', () => {
            const element = { isPlaceholder: true };
            expect(PlaceholderManager.isPlaceholder(element)).toBe(true);
        });

        it('should return true for elements from master', () => {
            const element = { fromMaster: true };
            expect(PlaceholderManager.isPlaceholder(element)).toBe(true);
        });

        it('should return false for regular elements', () => {
            const element = { type: 'text', content: 'Hello' };
            expect(PlaceholderManager.isPlaceholder(element)).toBe(false);
        });

        it('should return false for null element', () => {
            expect(PlaceholderManager.isPlaceholder(null)).toBe(false);
        });

        it('should return false for undefined element', () => {
            expect(PlaceholderManager.isPlaceholder(undefined)).toBe(false);
        });
    });

    describe('hasUserContent', () => {
        it('should return true if hasUserContent flag is set', () => {
            const element = { isPlaceholder: true, hasUserContent: true };
            expect(PlaceholderManager.hasUserContent(element)).toBe(true);
        });

        it('should return false if hasUserContent is false', () => {
            const element = { isPlaceholder: true, hasUserContent: false };
            expect(PlaceholderManager.hasUserContent(element)).toBe(false);
        });

        it('should return false for null element', () => {
            expect(PlaceholderManager.hasUserContent(null)).toBe(false);
        });
    });

    describe('getPromptText', () => {
        it('should return prompt text for placeholder type', () => {
            const result = PlaceholderManager.getPromptText('title');
            expect(result).toContain('Click to add');
        });

        it('should return text prompt for body type', () => {
            const result = PlaceholderManager.getPromptText('body');
            expect(result).toContain('Click to add');
        });

        it('should return fallback text prompt for unknown type', () => {
            const result = PlaceholderManager.getPromptText('unknown');
            expect(result).toContain('Click to add');
        });
    });

    describe('prepareForEdit', () => {
        it('should clear content for empty placeholder', () => {
            const element = {
                isPlaceholder: true,
                content: '',
                placeholderType: 'title',
                hasUserContent: false
            };
            
            const result = PlaceholderManager.prepareForEdit(element);
            
            expect(result).toHaveProperty('_editContent');
            expect(result._wasEmpty).toBe(true);
        });

        it('should preserve user content', () => {
            const element = {
                isPlaceholder: true,
                content: 'User typed content',
                hasUserContent: true
            };
            
            const result = PlaceholderManager.prepareForEdit(element);
            
            expect(result._editContent).toBe('User typed content');
        });

        it('should handle regular elements', () => {
            const element = {
                type: 'text',
                content: 'Regular content'
            };
            
            const result = PlaceholderManager.prepareForEdit(element);
            
            expect(result.content).toBe('Regular content');
        });
    });

    describe('handleEditExit', () => {
        it('should mark as having user content when not empty', () => {
            const element = {
                isPlaceholder: true,
                hasUserContent: false
            };
            
            const result = PlaceholderManager.handleEditExit(element, 'New content');
            
            expect(result.hasUserContent).toBe(true);
            expect(result.content).toBe('New content');
        });

        it('should restore prompt when content is empty', () => {
            const element = {
                isPlaceholder: true,
                placeholderType: 'title',
                hasUserContent: false
            };
            
            const result = PlaceholderManager.handleEditExit(element, '');
            
            expect(result.hasUserContent).toBe(false);
            expect(result.content).toContain('Click to add');
        });

        it('should mark for deletion when non-placeholder is empty', () => {
            const element = {
                type: 'text'
            };
            
            const result = PlaceholderManager.handleEditExit(element, '');
            
            expect(result.shouldDelete).toBe(true);
        });

        it('should not mark for deletion when placeholder is empty', () => {
            const element = {
                isPlaceholder: true
            };
            
            const result = PlaceholderManager.handleEditExit(element, '');
            
            expect(result.shouldDelete).toBe(false);
        });
    });

    describe('getDisplayConfig', () => {
        it('should return prompt config for empty placeholder', () => {
            const element = {
                isPlaceholder: true,
                hasUserContent: false,
                placeholderType: 'title'
            };
            
            const result = PlaceholderManager.getDisplayConfig(element);
            
            expect(result.isPrompt).toBe(true);
            expect(result.cssClass).toBe('text-content--prompt');
        });

        it('should return content config for placeholder with user content', () => {
            const element = {
                isPlaceholder: true,
                hasUserContent: true,
                content: 'User content'
            };
            
            const result = PlaceholderManager.getDisplayConfig(element);
            
            expect(result.isPrompt).toBe(false);
            expect(result.content).toBe('User content');
        });

        it('should return content for regular elements', () => {
            const element = {
                type: 'text',
                content: 'Regular content'
            };
            
            const result = PlaceholderManager.getDisplayConfig(element);
            
            expect(result.content).toBe('Regular content');
            expect(result.isPrompt).toBe(false);
        });
    });

    describe('canResetToMaster', () => {
        it('should return true for placeholder with user content', () => {
            const element = {
                isPlaceholder: true,
                hasUserContent: true
            };
            
            expect(PlaceholderManager.canResetToMaster(element)).toBe(true);
        });

        it('should return false for placeholder without changes', () => {
            const element = {
                isPlaceholder: true,
                hasUserContent: false
            };
            
            expect(PlaceholderManager.canResetToMaster(element)).toBe(false);
        });

        it('should return false for non-placeholder', () => {
            const element = { type: 'text' };
            
            expect(PlaceholderManager.canResetToMaster(element)).toBe(false);
        });
    });
});
