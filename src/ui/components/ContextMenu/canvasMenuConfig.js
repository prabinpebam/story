/**
 * Canvas Context Menu Configuration
 * 
 * Defines menu items for canvas-empty and canvas-element zones.
 * All menu items dispatch to the store or trigger appropriate handlers.
 */

/**
 * Canvas Empty Zone Menu Configuration
 * Shown when right-clicking on empty canvas area (no element selected)
 */
export const canvasEmptyMenuConfig = {
    getItems: (context) => {
        const { store } = context;
        const state = store.getState();
        const hasClipboard = !!window.elementClipboard;
        
        return [
            {
                id: 'paste',
                label: 'Paste',
                shortcut: 'Ctrl+V',
                icon: 'fa-regular fa-clipboard',
                disabled: !hasClipboard,
                action: () => {
                    if (window.elementClipboard) {
                        try {
                            const elements = JSON.parse(window.elementClipboard);
                            store.dispatch('PASTE_ELEMENTS', { elements });
                        } catch (err) {
                            console.error('Failed to paste elements', err);
                        }
                    }
                }
            },
            { type: 'separator' },
            {
                id: 'select-all',
                label: 'Select All',
                shortcut: 'Ctrl+A',
                icon: 'fa-regular fa-object-group',
                action: () => {
                    const slide = getActiveContainer(state);
                    if (slide && slide.elements) {
                        const allIds = Object.keys(slide.elements);
                        store.dispatch('UPDATE_SELECTION', allIds);
                    }
                }
            },
            { type: 'separator' },
            {
                id: 'insert',
                label: 'Insert',
                icon: 'fa-regular fa-plus',
                submenu: [
                    {
                        id: 'insert-text',
                        label: 'Text',
                        shortcut: 'T',
                        icon: 'fa-regular fa-text',
                        action: () => {
                            store.dispatch('SET_TOOL', 'text');
                        }
                    },
                    {
                        id: 'insert-rectangle',
                        label: 'Rectangle',
                        shortcut: 'R',
                        icon: 'fa-regular fa-square',
                        action: () => {
                            store.dispatch('SET_TOOL', 'rectangle');
                        }
                    },
                    {
                        id: 'insert-ellipse',
                        label: 'Ellipse',
                        shortcut: 'O',
                        icon: 'fa-regular fa-circle',
                        action: () => {
                            store.dispatch('SET_TOOL', 'ellipse');
                        }
                    },
                    {
                        id: 'insert-line',
                        label: 'Line',
                        shortcut: 'L',
                        icon: 'fa-regular fa-minus',
                        action: () => {
                            store.dispatch('SET_TOOL', 'line');
                        }
                    }
                ]
            }
        ];
    }
};

/**
 * Canvas Element Zone Menu Configuration
 * Shown when right-clicking on a selected element
 */
export const canvasElementMenuConfig = {
    getItems: (context) => {
        const { store, elementIds } = context;
        const state = store.getState();
        const hasSelection = elementIds && elementIds.length > 0;
        const hasMultipleSelected = elementIds && elementIds.length > 1;
        const hasClipboard = !!window.elementClipboard;
        
        // Check if selected element is a group
        const container = getActiveContainer(state);
        let isGroup = false;
        let isLocked = false;
        let isHidden = false;
        
        if (container && elementIds && elementIds.length === 1) {
            const element = container.elements[elementIds[0]];
            if (element) {
                isGroup = element.type === 'group';
                isLocked = !!element.locked;
                isHidden = !!element.hidden;
            }
        }
        
        return [
            {
                id: 'cut',
                label: 'Cut',
                shortcut: 'Ctrl+X',
                icon: 'fa-regular fa-scissors',
                disabled: !hasSelection || isLocked,
                action: () => {
                    if (container) {
                        const elementsToCopy = elementIds.map(id => container.elements[id]).filter(e => e);
                        if (elementsToCopy.length > 0) {
                            window.elementClipboard = JSON.stringify(elementsToCopy);
                            window.slideClipboard = null;
                            elementIds.forEach(id => store.dispatch('REMOVE_ELEMENT', id));
                        }
                    }
                }
            },
            {
                id: 'copy',
                label: 'Copy',
                shortcut: 'Ctrl+C',
                icon: 'fa-regular fa-copy',
                disabled: !hasSelection,
                action: () => {
                    if (container) {
                        const elementsToCopy = elementIds.map(id => container.elements[id]).filter(e => e);
                        if (elementsToCopy.length > 0) {
                            window.elementClipboard = JSON.stringify(elementsToCopy);
                            window.slideClipboard = null;
                        }
                    }
                }
            },
            {
                id: 'paste',
                label: 'Paste',
                shortcut: 'Ctrl+V',
                icon: 'fa-regular fa-clipboard',
                disabled: !hasClipboard,
                action: () => {
                    if (window.elementClipboard) {
                        try {
                            const elements = JSON.parse(window.elementClipboard);
                            store.dispatch('PASTE_ELEMENTS', { elements });
                        } catch (err) {
                            console.error('Failed to paste elements', err);
                        }
                    }
                }
            },
            {
                id: 'duplicate',
                label: 'Duplicate',
                shortcut: 'Ctrl+D',
                icon: 'fa-regular fa-clone',
                disabled: !hasSelection || isLocked,
                action: () => {
                    store.dispatch('DUPLICATE_ELEMENTS', { ids: elementIds, offset: true });
                }
            },
            { type: 'separator' },
            {
                id: 'delete',
                label: 'Delete',
                shortcut: 'Del',
                icon: 'fa-regular fa-trash-can',
                danger: true,
                disabled: !hasSelection || isLocked,
                action: () => {
                    elementIds.forEach(id => store.dispatch('REMOVE_ELEMENT', id));
                }
            },
            { type: 'separator' },
            {
                id: 'group',
                label: 'Group',
                shortcut: 'Ctrl+G',
                icon: 'fa-regular fa-object-group',
                disabled: !hasMultipleSelected || isLocked,
                action: () => {
                    store.dispatch('GROUP_ELEMENTS');
                }
            },
            {
                id: 'ungroup',
                label: 'Ungroup',
                shortcut: 'Ctrl+Shift+G',
                icon: 'fa-regular fa-object-ungroup',
                disabled: !isGroup || isLocked,
                action: () => {
                    store.dispatch('UNGROUP_ELEMENTS');
                }
            },
            { type: 'separator' },
            {
                id: 'arrange',
                label: 'Arrange',
                icon: 'fa-regular fa-layer-group',
                submenu: [
                    {
                        id: 'bring-to-front',
                        label: 'Bring to Front',
                        shortcut: 'Ctrl+Shift+]',
                        icon: 'fa-regular fa-bring-front',
                        disabled: !hasSelection || isLocked,
                        action: () => {
                            store.dispatch('REORDER_TO_FRONT', { elementIds });
                        }
                    },
                    {
                        id: 'bring-forward',
                        label: 'Bring Forward',
                        shortcut: 'Ctrl+]',
                        icon: 'fa-regular fa-bring-forward',
                        disabled: !hasSelection || isLocked,
                        action: () => {
                            store.dispatch('REORDER_FORWARD', { elementIds });
                        }
                    },
                    {
                        id: 'send-backward',
                        label: 'Send Backward',
                        shortcut: 'Ctrl+[',
                        icon: 'fa-regular fa-send-backward',
                        disabled: !hasSelection || isLocked,
                        action: () => {
                            store.dispatch('REORDER_BACKWARD', { elementIds });
                        }
                    },
                    {
                        id: 'send-to-back',
                        label: 'Send to Back',
                        shortcut: 'Ctrl+Shift+[',
                        icon: 'fa-regular fa-send-back',
                        disabled: !hasSelection || isLocked,
                        action: () => {
                            store.dispatch('REORDER_TO_BACK', { elementIds });
                        }
                    }
                ]
            },
            {
                id: 'align',
                label: 'Align',
                icon: 'fa-regular fa-align-left',
                disabled: !hasSelection || isLocked,
                submenu: [
                    {
                        id: 'align-left',
                        label: 'Align Left',
                        icon: 'fa-regular fa-align-left',
                        action: () => store.dispatch('ALIGN_ELEMENTS', 'left')
                    },
                    {
                        id: 'align-center-h',
                        label: 'Align Center',
                        icon: 'fa-regular fa-align-center',
                        action: () => store.dispatch('ALIGN_ELEMENTS', 'center')
                    },
                    {
                        id: 'align-right',
                        label: 'Align Right',
                        icon: 'fa-regular fa-align-right',
                        action: () => store.dispatch('ALIGN_ELEMENTS', 'right')
                    },
                    { type: 'separator' },
                    {
                        id: 'align-top',
                        label: 'Align Top',
                        icon: 'fa-regular fa-align-top',
                        action: () => store.dispatch('ALIGN_ELEMENTS', 'top')
                    },
                    {
                        id: 'align-center-v',
                        label: 'Align Middle',
                        icon: 'fa-regular fa-align-middle',
                        action: () => store.dispatch('ALIGN_ELEMENTS', 'middle')
                    },
                    {
                        id: 'align-bottom',
                        label: 'Align Bottom',
                        icon: 'fa-regular fa-align-bottom',
                        action: () => store.dispatch('ALIGN_ELEMENTS', 'bottom')
                    }
                ]
            },
            { type: 'separator' },
            {
                id: 'lock',
                label: isLocked ? 'Unlock' : 'Lock',
                shortcut: 'Ctrl+Shift+L',
                icon: isLocked ? 'fa-regular fa-lock-open' : 'fa-regular fa-lock',
                disabled: !hasSelection,
                action: () => {
                    elementIds.forEach(id => {
                        store.dispatch('TOGGLE_ELEMENT_LOCK', { id });
                    });
                }
            },
            {
                id: 'visibility',
                label: isHidden ? 'Show' : 'Hide',
                shortcut: 'Ctrl+Shift+H',
                icon: isHidden ? 'fa-regular fa-eye' : 'fa-regular fa-eye-slash',
                disabled: !hasSelection,
                action: () => {
                    elementIds.forEach(id => {
                        store.dispatch('TOGGLE_ELEMENT_VISIBILITY', { id });
                    });
                }
            }
        ];
    }
};

/**
 * Canvas Text Editing Zone Menu Configuration  
 * Shown when right-clicking while in text editing mode
 */
export const canvasTextEditingMenuConfig = {
    getItems: (context) => {
        return [
            {
                id: 'cut',
                label: 'Cut',
                shortcut: 'Ctrl+X',
                icon: 'fa-regular fa-scissors',
                action: () => {
                    document.execCommand('cut');
                }
            },
            {
                id: 'copy',
                label: 'Copy',
                shortcut: 'Ctrl+C',
                icon: 'fa-regular fa-copy',
                action: () => {
                    document.execCommand('copy');
                }
            },
            {
                id: 'paste',
                label: 'Paste',
                shortcut: 'Ctrl+V',
                icon: 'fa-regular fa-clipboard',
                action: () => {
                    document.execCommand('paste');
                }
            },
            { type: 'separator' },
            {
                id: 'select-all',
                label: 'Select All',
                shortcut: 'Ctrl+A',
                icon: 'fa-regular fa-text-size',
                action: () => {
                    document.execCommand('selectAll');
                }
            }
        ];
    }
};

/**
 * Helper function to get the active container (slide or master)
 */
function getActiveContainer(state) {
    if (state.editor.mode === 'master') {
        return state.masters[state.editor.activeMasterId];
    } else {
        return state.slides[state.editor.activeSlideId];
    }
}

/**
 * All canvas menu configurations exported as a map
 */
export const canvasMenuConfigs = {
    'canvas-empty': canvasEmptyMenuConfig,
    'canvas-element': canvasElementMenuConfig,
    'canvas-text-editing': canvasTextEditingMenuConfig
};
