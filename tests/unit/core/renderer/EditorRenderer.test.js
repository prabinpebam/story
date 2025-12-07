import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock Store with factory function
vi.mock('../../../../src/core/Store.js', () => {
    const mockState = {
        editor: {
            editingElementId: null
        }
    };
    
    const mockDispatch = vi.fn();
    const mockGetState = vi.fn(() => mockState);
    const mockOn = vi.fn();
    
    return {
        store: {
            getState: mockGetState,
            dispatch: mockDispatch,
            on: mockOn,
            _mockState: mockState,  // Expose for test access
            _mockDispatch: mockDispatch,
            _mockGetState: mockGetState
        }
    };
});

import { EditorRenderer } from '../../../../src/core/renderer/EditorRenderer.js';
import { store } from '../../../../src/core/Store.js';

describe('EditorRenderer', () => {
    let editorRenderer;
    let mockCanvas;
    const mockState = store._mockState;
    const mockDispatch = store._mockDispatch;

    beforeEach(() => {
        vi.clearAllMocks();
        
        // EditorRenderer extends BaseRenderer which expects container ID
        const mockContainer = document.createElement('div');
        mockContainer.id = 'test-editor-container';
        document.body.appendChild(mockContainer);
        
        editorRenderer = new EditorRenderer('test-editor-container');
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('handleTextBlur', () => {
        it('should remove empty regular text elements', () => {
            // Setup: Create a regular text element that's being edited
            const mockElement = {
                data: {
                    id: 'text-1',
                    type: 'text',
                    isPlaceholder: false
                },
                domElement: document.createElement('div')
            };
            mockElement.domElement.innerHTML = '<br>';
            
            // Set editing state
            mockState.editor.editingElementId = 'text-1';
            
            // Call handleTextBlur
            editorRenderer.handleTextBlur(mockElement);
            
            // Verify element was removed
            expect(mockDispatch).toHaveBeenCalledWith('REMOVE_ELEMENT', 'text-1');
            expect(mockDispatch).toHaveBeenCalledWith('SET_EDITING_ELEMENT', null);
        });

        it('should preserve empty placeholder elements', () => {
            // Setup: Create a placeholder text element that's being edited
            const mockElement = {
                data: {
                    id: 'placeholder-title',
                    type: 'text',
                    isPlaceholder: true
                },
                domElement: document.createElement('div')
            };
            mockElement.domElement.innerHTML = '<br>';
            
            // Set editing state
            mockState.editor.editingElementId = 'placeholder-title';
            
            // Call handleTextBlur
            editorRenderer.handleTextBlur(mockElement);
            
            // Verify element was NOT removed, only editing state cleared
            expect(mockDispatch).not.toHaveBeenCalledWith('REMOVE_ELEMENT', expect.anything());
            expect(mockDispatch).toHaveBeenCalledWith('SET_EDITING_ELEMENT', null);
        });

        it('should update element with content when not empty', () => {
            const domElement = document.createElement('div');
            domElement.innerHTML = 'Hello World';
            
            // Stub offsetWidth/offsetHeight (read-only properties)
            Object.defineProperty(domElement, 'offsetWidth', { value: 100, configurable: true });
            Object.defineProperty(domElement, 'offsetHeight', { value: 20, configurable: true });
            
            const mockElement = {
                data: {
                    id: 'text-1',
                    type: 'text',
                    isPlaceholder: false
                },
                domElement
            };
            
            mockState.editor.editingElementId = 'text-1';
            
            editorRenderer.handleTextBlur(mockElement);
            
            // Verify UPDATE_ELEMENT was called with content
            expect(mockDispatch).toHaveBeenCalledWith('UPDATE_ELEMENT', expect.objectContaining({
                id: 'text-1',
                content: 'Hello World'
            }));
            expect(mockDispatch).toHaveBeenCalledWith('SET_EDITING_ELEMENT', null);
        });

        it('should not process blur if element is not being edited', () => {
            const mockElement = {
                data: {
                    id: 'text-1',
                    type: 'text'
                },
                domElement: document.createElement('div')
            };
            
            // Different element is being edited
            mockState.editor.editingElementId = 'text-2';
            
            editorRenderer.handleTextBlur(mockElement);
            
            // Verify no actions were dispatched
            expect(mockDispatch).not.toHaveBeenCalled();
        });

        it('should handle whitespace-only content as empty', () => {
            const mockElement = {
                data: {
                    id: 'text-1',
                    type: 'text',
                    isPlaceholder: false
                },
                domElement: document.createElement('div')
            };
            mockElement.domElement.innerHTML = '   \n\t   ';
            
            mockState.editor.editingElementId = 'text-1';
            
            editorRenderer.handleTextBlur(mockElement);
            
            // Verify element was removed
            expect(mockDispatch).toHaveBeenCalledWith('REMOVE_ELEMENT', 'text-1');
        });

        it('should preserve placeholder with whitespace-only content', () => {
            const mockElement = {
                data: {
                    id: 'placeholder-1',
                    type: 'text',
                    isPlaceholder: true
                },
                domElement: document.createElement('div')
            };
            mockElement.domElement.innerHTML = '   \n\t   ';
            
            mockState.editor.editingElementId = 'placeholder-1';
            
            editorRenderer.handleTextBlur(mockElement);
            
            // Verify element was NOT removed
            expect(mockDispatch).not.toHaveBeenCalledWith('REMOVE_ELEMENT', expect.anything());
            expect(mockDispatch).toHaveBeenCalledWith('SET_EDITING_ELEMENT', null);
        });
    });
});
