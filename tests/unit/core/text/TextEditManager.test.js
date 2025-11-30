/**
 * TextEditManager Unit Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TextEditManager } from '../../../../src/core/text/TextEditManager.js';

// Mock dependencies
vi.mock('../../../../src/core/Store.js', () => ({
    store: {
        getState: vi.fn(),
        dispatch: vi.fn()
    }
}));

vi.mock('../../../../src/core/text/HistoryBridge.js', () => ({
    historyBridge: {
        beginSession: vi.fn(),
        endSession: vi.fn(),
        discardSession: vi.fn()
    }
}));

vi.mock('../../../../src/core/text/SelectionManager.js', () => ({
    selectionManager: {
        selectAll: vi.fn(),
        placeCaretAtEnd: vi.fn(),
        placeCaretAtStart: vi.fn(),
        save: vi.fn(),
        restore: vi.fn(),
        clear: vi.fn(),
        hasSelection: vi.fn(() => false),
        getSelectedText: vi.fn(() => ''),
        isSelectionInElement: vi.fn(() => false)
    }
}));

vi.mock('../../../../src/core/text/ContentSanitizer.js', () => ({
    contentSanitizer: {
        sanitize: vi.fn(content => content),
        toPlainText: vi.fn(content => content?.replace(/<[^>]*>/g, '') || '')
    }
}));

vi.mock('../../../../src/core/text/IMEHandler.js', () => ({
    imeHandler: {
        attach: vi.fn(),
        detach: vi.fn(),
        isCompositionInProgress: vi.fn(() => false)
    }
}));

import { store } from '../../../../src/core/Store.js';
import { historyBridge } from '../../../../src/core/text/HistoryBridge.js';
import { selectionManager } from '../../../../src/core/text/SelectionManager.js';

describe('TextEditManager', () => {
    let manager;
    let mockElement;
    
    beforeEach(() => {
        vi.clearAllMocks();
        manager = new TextEditManager();
        
        // Create mock DOM element
        mockElement = document.createElement('div');
        mockElement.id = 'test-element';
        mockElement.innerHTML = 'Test content';
        document.body.appendChild(mockElement);
        
        // Default store state
        store.getState.mockReturnValue({
            editor: {
                mode: 'edit',
                activeSlideId: 'slide-1',
                editingElementId: null
            },
            slides: {
                'slide-1': {
                    elements: {
                        'text-1': {
                            id: 'text-1',
                            type: 'text',
                            content: 'Test content'
                        }
                    }
                }
            }
        });
    });
    
    afterEach(() => {
        if (mockElement.parentNode) {
            mockElement.parentNode.removeChild(mockElement);
        }
        manager = null;
    });

    describe('constructor', () => {
        it('should initialize with default state', () => {
            expect(manager.isEditing).toBe(false);
            expect(manager.currentElementId).toBeNull();
            expect(manager.currentElement).toBeNull();
            expect(manager.saveTimer).toBeNull();
        });
    });

    describe('enterEditMode', () => {
        it('should enter edit mode for a valid element', () => {
            const result = manager.enterEditMode('text-1', mockElement, { entryMode: 'doubleClick' });
            
            expect(result).toBe(true);
            expect(manager.isEditing).toBe(true);
            expect(manager.currentElementId).toBe('text-1');
            expect(manager.currentElement).toBe(mockElement);
        });

        it('should set contentEditable to true', () => {
            manager.enterEditMode('text-1', mockElement, { entryMode: 'doubleClick' });
            
            expect(mockElement.contentEditable).toBe('true');
        });

        it('should set pointer-events and cursor styles', () => {
            manager.enterEditMode('text-1', mockElement, { entryMode: 'doubleClick' });
            
            expect(mockElement.style.pointerEvents).toBe('auto');
            expect(mockElement.style.cursor).toBe('text');
        });

        it('should add editing CSS class', () => {
            manager.enterEditMode('text-1', mockElement, { entryMode: 'doubleClick' });
            
            expect(mockElement.classList.contains('text-element--editing')).toBe(true);
        });

        it('should focus the element', () => {
            const focusSpy = vi.spyOn(mockElement, 'focus');
            manager.enterEditMode('text-1', mockElement, { entryMode: 'doubleClick' });
            
            expect(focusSpy).toHaveBeenCalled();
        });

        it('should begin a history session', () => {
            manager.enterEditMode('text-1', mockElement, { entryMode: 'doubleClick' });
            
            expect(historyBridge.beginSession).toHaveBeenCalledWith('text-1', {
                content: 'Test content',
                inlineStyles: {}
            });
        });

        it('should dispatch ENTER_TEXT_EDIT action', () => {
            manager.enterEditMode('text-1', mockElement, { entryMode: 'doubleClick' });
            
            expect(store.dispatch).toHaveBeenCalledWith('ENTER_TEXT_EDIT', { elementId: 'text-1' });
        });

        it('should return true if already editing the same element', () => {
            manager.enterEditMode('text-1', mockElement, { entryMode: 'doubleClick' });
            
            const result = manager.enterEditMode('text-1', mockElement, { entryMode: 'enter' });
            
            expect(result).toBe(true);
        });

        it('should exit current edit before entering new element', () => {
            manager.enterEditMode('text-1', mockElement, { entryMode: 'doubleClick' });
            
            // Add another element
            store.getState.mockReturnValue({
                editor: {
                    mode: 'edit',
                    activeSlideId: 'slide-1',
                    editingElementId: 'text-1'
                },
                slides: {
                    'slide-1': {
                        elements: {
                            'text-1': { id: 'text-1', type: 'text', content: 'Test content' },
                            'text-2': { id: 'text-2', type: 'text', content: 'Other content' }
                        }
                    }
                }
            });
            
            const mockElement2 = document.createElement('div');
            mockElement2.innerHTML = 'Other content';
            document.body.appendChild(mockElement2);
            
            manager.enterEditMode('text-2', mockElement2, { entryMode: 'doubleClick' });
            
            expect(manager.currentElementId).toBe('text-2');
            
            mockElement2.parentNode.removeChild(mockElement2);
        });

        it('should return false for non-existent element', () => {
            const result = manager.enterEditMode('non-existent', mockElement, { entryMode: 'doubleClick' });
            
            expect(result).toBe(false);
            expect(manager.isEditing).toBe(false);
        });

        it('should call selectAll for enter entry mode', () => {
            manager.enterEditMode('text-1', mockElement, { entryMode: 'enter' });
            
            expect(selectionManager.selectAll).toHaveBeenCalledWith(mockElement);
        });

        it('should call placeCaretAtEnd for doubleClick entry mode', () => {
            manager.enterEditMode('text-1', mockElement, { entryMode: 'doubleClick' });
            
            expect(selectionManager.placeCaretAtEnd).toHaveBeenCalledWith(mockElement);
        });
    });

    describe('exitEditMode', () => {
        beforeEach(() => {
            manager.enterEditMode('text-1', mockElement, { entryMode: 'doubleClick' });
            vi.clearAllMocks();
        });

        it('should exit edit mode', () => {
            const result = manager.exitEditMode();
            
            expect(result).toBe(true);
            expect(manager.isEditing).toBe(false);
            expect(manager.currentElementId).toBeNull();
            expect(manager.currentElement).toBeNull();
        });

        it('should set contentEditable to false', () => {
            manager.exitEditMode();
            
            expect(mockElement.contentEditable).toBe('false');
        });

        it('should reset cursor and pointer-events styles', () => {
            manager.exitEditMode();
            
            expect(mockElement.style.cursor).toBe('');
            expect(mockElement.style.pointerEvents).toBe('');
        });

        it('should remove editing CSS class', () => {
            manager.exitEditMode();
            
            expect(mockElement.classList.contains('text-element--editing')).toBe(false);
        });

        it('should dispatch EXIT_TEXT_EDIT action', () => {
            manager.exitEditMode();
            
            expect(store.dispatch).toHaveBeenCalledWith('EXIT_TEXT_EDIT', { 
                elementId: 'text-1',
                keepSelection: true 
            });
        });

        it('should return false if not in edit mode', () => {
            manager.isEditing = false;
            manager.currentElement = null;
            
            const result = manager.exitEditMode();
            
            expect(result).toBe(false);
        });

        it('should end history session with save', () => {
            manager.exitEditMode({ save: true });
            
            expect(historyBridge.endSession).toHaveBeenCalledWith(true, expect.any(Object));
        });
    });

    describe('isInEditMode', () => {
        it('should return true when editing', () => {
            manager.enterEditMode('text-1', mockElement, { entryMode: 'doubleClick' });
            
            expect(manager.isInEditMode()).toBe(true);
        });

        it('should return false when not editing', () => {
            expect(manager.isInEditMode()).toBe(false);
        });
    });

    describe('getCurrentElementId', () => {
        it('should return current element ID when editing', () => {
            manager.enterEditMode('text-1', mockElement, { entryMode: 'doubleClick' });
            
            expect(manager.getCurrentElementId()).toBe('text-1');
        });

        it('should return null when not editing', () => {
            expect(manager.getCurrentElementId()).toBeNull();
        });
    });

    describe('master mode support', () => {
        it('should find elements in master mode', () => {
            store.getState.mockReturnValue({
                editor: {
                    mode: 'master',
                    activeMasterId: 'master-1',
                    editingElementId: null
                },
                masters: {
                    'master-1': {
                        elements: {
                            'text-1': {
                                id: 'text-1',
                                type: 'text',
                                content: 'Master content'
                            }
                        }
                    }
                }
            });
            
            const result = manager.enterEditMode('text-1', mockElement, { entryMode: 'doubleClick' });
            
            expect(result).toBe(true);
        });
    });

    describe('event handling', () => {
        it('should emit TEXT_EDIT_START event on enter', () => {
            const callback = vi.fn();
            manager.on('text-edit-start', callback);
            
            manager.enterEditMode('text-1', mockElement, { entryMode: 'doubleClick' });
            
            expect(callback).toHaveBeenCalledWith({
                elementId: 'text-1',
                entryMode: 'doubleClick'
            });
        });

        it('should emit TEXT_EDIT_END event on exit', () => {
            manager.enterEditMode('text-1', mockElement, { entryMode: 'doubleClick' });
            
            const callback = vi.fn();
            manager.on('text-edit-end', callback);
            
            manager.exitEditMode();
            
            expect(callback).toHaveBeenCalledWith({
                elementId: 'text-1',
                saved: true
            });
        });
    });

    describe('newly created element tracking', () => {
        it('should track isNewlyCreated flag', () => {
            manager.enterEditMode('text-1', mockElement, { 
                entryMode: 'enter', 
                isNewlyCreated: true 
            });
            
            expect(manager.isNewlyCreated).toBe(true);
            expect(manager.hasReceivedInput).toBe(false);
        });

        it('should default isNewlyCreated to false', () => {
            manager.enterEditMode('text-1', mockElement, { entryMode: 'doubleClick' });
            
            expect(manager.isNewlyCreated).toBe(false);
        });

        it('should delete newly created element with no input on exit', () => {
            manager.enterEditMode('text-1', mockElement, { 
                entryMode: 'enter', 
                isNewlyCreated: true 
            });
            vi.clearAllMocks();
            
            manager.exitEditMode();
            
            // Should dispatch REMOVE_ELEMENT for newly created without input
            expect(store.dispatch).toHaveBeenCalledWith('REMOVE_ELEMENT', { id: 'text-1' });
            expect(store.dispatch).toHaveBeenCalledWith('UPDATE_SELECTION', []);
        });

        it('should NOT delete newly created element if user typed', () => {
            manager.enterEditMode('text-1', mockElement, { 
                entryMode: 'enter', 
                isNewlyCreated: true 
            });
            
            // Simulate user input
            manager.hasReceivedInput = true;
            
            vi.clearAllMocks();
            manager.exitEditMode();
            
            // Should NOT dispatch REMOVE_ELEMENT 
            expect(store.dispatch).not.toHaveBeenCalledWith('REMOVE_ELEMENT', expect.anything());
        });

        it('should reset tracking state on exit', () => {
            manager.enterEditMode('text-1', mockElement, { 
                entryMode: 'enter', 
                isNewlyCreated: true 
            });
            manager.hasReceivedInput = true;
            
            manager.exitEditMode();
            
            expect(manager.isNewlyCreated).toBe(false);
            expect(manager.hasReceivedInput).toBe(false);
        });
    });

    describe('Tab navigation', () => {
        it('should detect when caret is in a list', () => {
            manager.enterEditMode('text-1', mockElement, { entryMode: 'doubleClick' });
            
            // By default, not in list
            expect(manager._isInList()).toBe(false);
        });

        it('should have selectAdjacentElement method', () => {
            expect(typeof manager._selectAdjacentElement).toBe('function');
        });
    });
});
