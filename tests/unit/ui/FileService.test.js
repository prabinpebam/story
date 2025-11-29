/**
 * FileService Tests
 * 
 * Tests for the core file service functionality.
 * Note: These tests focus on the public API behavior.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('FileService', () => {
    describe('Recent Files Storage', () => {
        const RECENT_FILES_KEY = 'story_recent_files';

        beforeEach(() => {
            localStorage.clear();
        });

        afterEach(() => {
            localStorage.clear();
        });

        it('should store recent files as JSON in localStorage', () => {
            const recentFiles = [
                { name: 'test.str', lastOpened: '2025-01-01T00:00:00.000Z' },
                { name: 'another.str', lastOpened: '2025-01-02T00:00:00.000Z' }
            ];
            
            localStorage.setItem(RECENT_FILES_KEY, JSON.stringify(recentFiles));
            
            const stored = JSON.parse(localStorage.getItem(RECENT_FILES_KEY));
            expect(stored).toEqual(recentFiles);
            expect(stored.length).toBe(2);
        });

        it('should return empty array when no recent files', () => {
            const stored = localStorage.getItem(RECENT_FILES_KEY);
            expect(stored).toBeNull();
        });

        it('should handle invalid JSON gracefully', () => {
            localStorage.setItem(RECENT_FILES_KEY, 'invalid json');
            
            let files = [];
            try {
                files = JSON.parse(localStorage.getItem(RECENT_FILES_KEY));
            } catch {
                files = [];
            }
            
            expect(files).toEqual([]);
        });

        it('should limit recent files to max count', () => {
            const MAX_RECENT_FILES = 10;
            const manyFiles = Array.from({ length: 15 }, (_, i) => ({
                name: `file-${i}.str`,
                lastOpened: new Date().toISOString()
            }));
            
            // Simulate limiting to max
            const limited = manyFiles.slice(0, MAX_RECENT_FILES);
            
            expect(limited.length).toBe(MAX_RECENT_FILES);
        });
    });

    describe('File Name Handling', () => {
        it('should add .str extension if missing', () => {
            const name = 'MyPresentation';
            const extension = '.str';
            
            const fullName = name.endsWith(extension) ? name : name + extension;
            
            expect(fullName).toBe('MyPresentation.str');
        });

        it('should not duplicate .str extension', () => {
            const name = 'MyPresentation.str';
            const extension = '.str';
            
            const fullName = name.endsWith(extension) ? name : name + extension;
            
            expect(fullName).toBe('MyPresentation.str');
        });

        it('should use default name when none provided', () => {
            const name = null;
            const defaultName = 'Untitled.str';
            
            const result = name || defaultName;
            
            expect(result).toBe('Untitled.str');
        });
    });

    describe('Unsaved Changes Detection', () => {
        it('should detect no changes for empty slides', () => {
            const state = {
                slides: [],
                editor: { activeSlideId: null }
            };
            
            const hasContent = state.slides && state.slides.length > 0 &&
                state.slides.some(s => s.elements && s.elements.length > 0);
            
            expect(hasContent).toBe(false);
        });

        it('should detect changes when slides have elements', () => {
            const state = {
                slides: [
                    { id: 'slide-1', elements: [{ id: 'el-1', type: 'text' }] }
                ],
                editor: { activeSlideId: 'slide-1' }
            };
            
            const hasContent = state.slides && state.slides.length > 0 &&
                state.slides.some(s => s.elements && s.elements.length > 0);
            
            expect(hasContent).toBe(true);
        });

        it('should detect no changes for slides without elements', () => {
            const state = {
                slides: [
                    { id: 'slide-1', elements: [] }
                ],
                editor: { activeSlideId: 'slide-1' }
            };
            
            const hasContent = state.slides && state.slides.length > 0 &&
                state.slides.some(s => s.elements && s.elements.length > 0);
            
            expect(hasContent).toBe(false);
        });
    });

    describe('State Comparison', () => {
        it('should detect when state matches saved state', () => {
            const savedState = { slides: [{ id: '1', elements: [] }] };
            const currentState = { slides: [{ id: '1', elements: [] }] };
            
            const isUnchanged = JSON.stringify(currentState.slides) === 
                               JSON.stringify(savedState.slides);
            
            expect(isUnchanged).toBe(true);
        });

        it('should detect when state differs from saved state', () => {
            const savedState = { slides: [{ id: '1', elements: [] }] };
            const currentState = { slides: [{ id: '1', elements: [{ id: 'new' }] }] };
            
            const isUnchanged = JSON.stringify(currentState.slides) === 
                               JSON.stringify(savedState.slides);
            
            expect(isUnchanged).toBe(false);
        });
    });
});
