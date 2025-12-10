import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ExportSection } from '../../../../src/ui/properties/ExportSection.js';
import { store } from '../../../../src/core/Store.js';
import { ExportPreviewRenderer } from '../../../../src/core/renderer/ExportPreviewRenderer.js';

// Mock dependencies
vi.mock('../../../../src/core/Store.js', () => ({
    store: {
        getState: vi.fn(),
        dispatch: vi.fn(),
        subscribe: vi.fn()
    }
}));

vi.mock('../../../../src/core/renderer/ExportPreviewRenderer.js', () => ({
    ExportPreviewRenderer: {
        renderExportPreview: vi.fn()
    }
}));

describe('ExportSection', () => {
    let section;
    let mockCanvas;

    beforeEach(() => {
        // Create mock canvas
        mockCanvas = document.createElement('canvas');
        mockCanvas.width = 200;
        mockCanvas.height = 200;
        mockCanvas.toDataURL = vi.fn(() => 'data:image/png;base64,mock');
        
        // Mock ExportPreviewRenderer
        ExportPreviewRenderer.renderExportPreview.mockResolvedValue(mockCanvas);
        
        // Mock store state
        store.getState.mockReturnValue({
            editor: {
                mode: 'slide',
                activeSlideId: 'slide-1'
            },
            slides: {
                'slide-1': {
                    elements: {
                        'elem-1': {
                            id: 'elem-1',
                            name: 'Rectangle',
                            type: 'rect',
                            x: 100,
                            y: 100,
                            width: 200,
                            height: 150
                        }
                    }
                }
            },
            slideMasterPresets: {}
        });
        
        section = new ExportSection();
    });

    afterEach(() => {
        vi.clearAllMocks();
        vi.clearAllTimers();
    });

    describe('Initialization', () => {
        it('should initialize with preview container', () => {
            expect(section.previewContainer).toBeDefined();
            expect(section.previewContainer.className).toBe('pi-export-preview');
        });

        it('should initialize with debounce timer', () => {
            expect(section.previewDebounceTimer).toBe(null);
        });

        it('should be collapsed by default', () => {
            expect(section.section.collapsed).toBe(true);
        });
    });

    describe('Preview Rendering', () => {
        it('should render preview on update', async () => {
            await section.update(['elem-1']);
            
            // Wait for async preview render
            await vi.waitFor(() => {
                expect(ExportPreviewRenderer.renderExportPreview).toHaveBeenCalled();
            }, { timeout: 2000 });
            
            // Wait for DOM update
            await new Promise(resolve => setTimeout(resolve, 50));
            
            const img = section.previewContainer.querySelector('.pi-export-preview-image');
            expect(img).not.toBeNull();
            expect(img.src).toBe('data:image/png;base64,mock');
        });

        it('should show loading state during preview generation', async () => {
            const slowPromise = new Promise(resolve => setTimeout(() => resolve(mockCanvas), 100));
            ExportPreviewRenderer.renderExportPreview.mockReturnValue(slowPromise);
            
            section.update(['elem-1']);
            
            // Check loading state immediately
            const loadingText = section.previewContainer.textContent;
            expect(loadingText).toContain('Generating preview');
            
            // Wait for completion
            await slowPromise;
        });

        it('should pass correct options to renderer', async () => {
            await section.update(['elem-1']);
            
            await vi.waitFor(() => {
                expect(ExportPreviewRenderer.renderExportPreview).toHaveBeenCalledWith(
                    expect.any(Array),
                    expect.objectContaining({
                        scale: 1,
                        maxWidth: 200,
                        maxHeight: 200
                    })
                );
            });
        });

        it('should use preset scale for preview', async () => {
            store.getState.mockReturnValue({
                editor: { mode: 'slide', activeSlideId: 'slide-1' },
                slides: {
                    'slide-1': {
                        elements: {
                            'elem-1': {
                                id: 'elem-1',
                                name: 'Rectangle',
                                type: 'rect',
                                x: 100,
                                y: 100,
                                width: 200,
                                height: 150,
                                exportPresets: [{ scale: '2x', format: 'png', suffix: '@2x' }]
                            }
                        }
                    }
                },
                slideMasterPresets: {}
            });
            
            await section.update(['elem-1']);
            
            await vi.waitFor(() => {
                expect(ExportPreviewRenderer.renderExportPreview).toHaveBeenCalledWith(
                    expect.any(Array),
                    expect.objectContaining({ scale: 2 })
                );
            });
        });
    });

    describe('Preview Error Handling', () => {
        it('should show error state on render failure', async () => {
            ExportPreviewRenderer.renderExportPreview.mockRejectedValue(
                new Error('Render failed')
            );
            
            await section.update(['elem-1']);
            
            await vi.waitFor(() => {
                const errorText = section.previewContainer.textContent;
                expect(errorText).toContain('Preview unavailable');
            });
        });

        it('should handle empty selection gracefully', async () => {
            await section.updatePreview();
            
            expect(section.previewContainer.innerHTML).toBe('');
            expect(ExportPreviewRenderer.renderExportPreview).not.toHaveBeenCalled();
        });

        it('should handle missing elements', async () => {
            store.getState.mockReturnValue({
                editor: { mode: 'slide', activeSlideId: 'slide-1' },
                slides: { 'slide-1': { elements: {} } },
                slideMasterPresets: {}
            });
            
            section.selection = ['elem-1'];
            await section.updatePreview();
            
            await vi.waitFor(() => {
                const errorText = section.previewContainer.textContent;
                expect(errorText).toContain('Preview unavailable');
            }, { timeout: 2000 });
        });
    });

    describe('Debounced Preview Updates', () => {
        beforeEach(() => {
            vi.useFakeTimers();
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it('should debounce preview updates', async () => {
            section.selection = ['elem-1'];
            section.presets = [{ scale: '1x', format: 'png', suffix: '' }];
            
            section.updatePreviewDebounced();
            section.updatePreviewDebounced();
            section.updatePreviewDebounced();
            
            expect(ExportPreviewRenderer.renderExportPreview).not.toHaveBeenCalled();
            
            await vi.advanceTimersByTimeAsync(300);
            
            expect(ExportPreviewRenderer.renderExportPreview).toHaveBeenCalledTimes(1);
        });

        it('should cancel pending debounced updates', async () => {
            section.selection = ['elem-1'];
            section.presets = [{ scale: '1x', format: 'png', suffix: '' }];
            
            section.updatePreviewDebounced();
            await vi.advanceTimersByTimeAsync(200);
            
            section.updatePreviewDebounced();
            await vi.advanceTimersByTimeAsync(200);
            
            expect(ExportPreviewRenderer.renderExportPreview).not.toHaveBeenCalled();
            
            await vi.advanceTimersByTimeAsync(100);
            
            expect(ExportPreviewRenderer.renderExportPreview).toHaveBeenCalledTimes(1);
        });

        it('should update preview on preset changes', () => {
            section.selection = ['elem-1'];
            section.presets = [{ scale: '1x', format: 'png', suffix: '' }];
            
            section.savePresets([
                { scale: '2x', format: 'png', suffix: '@2x' }
            ]);
            
            expect(section.previewDebounceTimer).not.toBe(null);
            
            vi.advanceTimersByTime(300);
            
            expect(ExportPreviewRenderer.renderExportPreview).toHaveBeenCalled();
        });
    });

    describe('Preset Management', () => {
        beforeEach(async () => {
            await section.update(['elem-1']);
        });

        it('should update preview when adding preset', () => {
            vi.useFakeTimers();
            
            section.addPreset();
            
            vi.advanceTimersByTime(300);
            
            expect(ExportPreviewRenderer.renderExportPreview).toHaveBeenCalledTimes(2);
            
            vi.useRealTimers();
        });

        it('should update preview when removing preset', () => {
            vi.useFakeTimers();
            
            section.presets = [
                { scale: '1x', format: 'png', suffix: '' },
                { scale: '2x', format: 'png', suffix: '@2x' }
            ];
            
            section.removePreset(1);
            
            vi.advanceTimersByTime(300);
            
            expect(ExportPreviewRenderer.renderExportPreview).toHaveBeenCalled();
            
            vi.useRealTimers();
        });

        it('should update preview when modifying preset', () => {
            vi.useFakeTimers();
            
            section.presets = [{ scale: '1x', format: 'png', suffix: '' }];
            
            section.updatePreset(0, 'scale', '2x');
            
            vi.advanceTimersByTime(300);
            
            expect(ExportPreviewRenderer.renderExportPreview).toHaveBeenCalled();
            
            vi.useRealTimers();
        });
    });

    describe('Multi-Selection', () => {
        it('should render preview for multiple elements', async () => {
            store.getState.mockReturnValue({
                editor: { mode: 'slide', activeSlideId: 'slide-1' },
                slides: {
                    'slide-1': {
                        elements: {
                            'elem-1': { id: 'elem-1', name: 'Rect 1', type: 'rect', x: 50, y: 50, width: 100, height: 100 },
                            'elem-2': { id: 'elem-2', name: 'Rect 2', type: 'rect', x: 200, y: 200, width: 150, height: 120 }
                        }
                    }
                },
                slideMasterPresets: {}
            });
            
            await section.update(['elem-1', 'elem-2']);
            
            await vi.waitFor(() => {
                expect(ExportPreviewRenderer.renderExportPreview).toHaveBeenCalledWith(
                    expect.arrayContaining([
                        expect.objectContaining({ id: 'elem-1' }),
                        expect.objectContaining({ id: 'elem-2' })
                    ]),
                    expect.any(Object)
                );
            });
        });
    });

    describe('Master Mode', () => {
        it('should render preview in master mode', async () => {
            store.getState.mockReturnValue({
                editor: {
                    mode: 'master',
                    activeMasterId: 'master-1'
                },
                slides: {},
                slideMasterPresets: {
                    'master-1': {
                        elements: {
                            'elem-1': {
                                id: 'elem-1',
                                name: 'Master Rect',
                                type: 'rect',
                                x: 100,
                                y: 100,
                                width: 200,
                                height: 150
                            }
                        }
                    }
                }
            });
            
            await section.update(['elem-1']);
            
            await vi.waitFor(() => {
                expect(ExportPreviewRenderer.renderExportPreview).toHaveBeenCalledWith(
                    expect.arrayContaining([
                        expect.objectContaining({ id: 'elem-1' })
                    ]),
                    expect.any(Object)
                );
            });
        });
    });

    describe('Section Visibility', () => {
        it('should hide section when no selection', () => {
            section.update([]);
            
            expect(section.section.element.classList.contains('hidden')).toBe(true);
        });

        it('should show section when elements selected', () => {
            section.update(['elem-1']);
            
            expect(section.section.element.classList.contains('hidden')).toBe(false);
        });

        it('should collapse section when no custom presets', () => {
            section.update(['elem-1']);
            
            expect(section.section.collapsed).toBe(true);
        });

        it('should expand section when custom presets exist', () => {
            store.getState.mockReturnValue({
                editor: { mode: 'slide', activeSlideId: 'slide-1' },
                slides: {
                    'slide-1': {
                        elements: {
                            'elem-1': {
                                id: 'elem-1',
                                type: 'rect',
                                x: 100,
                                y: 100,
                                width: 200,
                                height: 150,
                                exportPresets: [
                                    { scale: '2x', format: 'png', suffix: '@2x' }
                                ]
                            }
                        }
                    }
                },
                slideMasterPresets: {}
            });
            
            section.update(['elem-1']);
            
            expect(section.section.collapsed).toBe(false);
        });
    });
});
