/**
 * Menu Configuration
 * 
 * Defines the complete menu structure for the Story application.
 * Each item has: id, label, shortcut (optional), icon (optional), submenu (optional)
 */

import { tokenStorage } from '../../../core/auth/storage/TokenStorage.js';

/**
 * Get cloud storage menu items based on current authentication
 * @returns {Object[]} Cloud storage menu items
 */
function getCloudOpenItems() {
    const provider = tokenStorage.getProvider();
    const isAuthenticated = tokenStorage.isAuthenticated();
    
    // If not authenticated, show both options
    if (!isAuthenticated || !provider) {
        return [
            { 
                id: 'open-onedrive', 
                label: 'OneDrive...', 
                icon: 'fa-brands fa-microsoft'
            },
            { 
                id: 'open-google-drive', 
                label: 'Google Drive...', 
                icon: 'fa-brands fa-google-drive'
            }
        ];
    }
    
    // Show only the provider user is signed in with
    if (provider === 'microsoft') {
        return [{ 
            id: 'open-onedrive', 
            label: 'OneDrive...', 
            icon: 'fa-brands fa-microsoft'
        }];
    } else if (provider === 'google') {
        return [{ 
            id: 'open-google-drive', 
            label: 'Google Drive...', 
            icon: 'fa-brands fa-google-drive'
        }];
    }
    
    return [];
}

/**
 * Get cloud save menu items based on current authentication
 * @returns {Object[]} Cloud save menu items
 */
function getCloudSaveItems() {
    const provider = tokenStorage.getProvider();
    const isAuthenticated = tokenStorage.isAuthenticated();
    
    // If not authenticated, show both options
    if (!isAuthenticated || !provider) {
        return [
            { 
                id: 'save-onedrive', 
                label: 'OneDrive...', 
                icon: 'fa-brands fa-microsoft'
            },
            { 
                id: 'save-google-drive', 
                label: 'Google Drive...', 
                icon: 'fa-brands fa-google-drive'
            }
        ];
    }
    
    // Show only the provider user is signed in with
    if (provider === 'microsoft') {
        return [{ 
            id: 'save-onedrive', 
            label: 'OneDrive...', 
            icon: 'fa-brands fa-microsoft'
        }];
    } else if (provider === 'google') {
        return [{ 
            id: 'save-google-drive', 
            label: 'Google Drive...', 
            icon: 'fa-brands fa-google-drive'
        }];
    }
    
    return [];
}

/**
 * Generate menu configuration dynamically
 * @returns {Object[]} Menu configuration
 */
export function getMenuConfig() {
    return [
        // File operations
        {
            id: 'file-new',
            label: 'New Presentation',
            shortcut: 'Ctrl+N',
            icon: 'fa-regular fa-file'
        },
        {
            id: 'file-open',
            label: 'Open...',
            shortcut: 'Ctrl+O',
            icon: 'fa-regular fa-folder-open'
        },
        {
            id: 'file-open-cloud',
            label: 'Open from Cloud',
            icon: 'fa-solid fa-cloud-arrow-down',
            submenu: getCloudOpenItems()
        },
        {
            id: 'file-recent',
            label: 'Open Recent',
            icon: 'fa-solid fa-clock-rotate-left',
            submenu: [
                { id: 'recent-empty', label: 'No recent files', disabled: true }
                // Dynamic items will be added here
            ]
        },
        { divider: true },
        {
            id: 'file-save',
            label: 'Save',
            shortcut: 'Ctrl+S',
            icon: 'fa-regular fa-floppy-disk'
        },
        {
            id: 'file-save-as',
            label: 'Save As...',
            shortcut: 'Ctrl+Shift+S',
            icon: 'fa-solid fa-floppy-disk'
        },
        {
            id: 'file-save-cloud',
            label: 'Save to Cloud',
            icon: 'fa-solid fa-cloud-arrow-up',
            submenu: getCloudSaveItems()
        },
        {
            id: 'file-export',
            label: 'Export',
            icon: 'fa-solid fa-file-export',
            submenu: [
                { id: 'export-pdf', label: 'PDF...', icon: 'fa-regular fa-file-pdf' },
                { id: 'export-png', label: 'PNG Images...', icon: 'fa-regular fa-image' },
                { id: 'export-jpg', label: 'JPEG Images...', icon: 'fa-regular fa-image' },
                { divider: true },
                { id: 'export-html', label: 'HTML...', icon: 'fa-solid fa-code' }
            ]
        },
        { divider: true },

    // Edit operations
    {
        id: 'edit',
        label: 'Edit',
        icon: 'fa-solid fa-pen-to-square',
        submenu: [
            { id: 'edit-undo', label: 'Undo', shortcut: 'Ctrl+Z', icon: 'fa-solid fa-rotate-left' },
            { id: 'edit-redo', label: 'Redo', shortcut: 'Ctrl+Shift+Z', icon: 'fa-solid fa-rotate-right' },
            { divider: true },
            { id: 'edit-cut', label: 'Cut', shortcut: 'Ctrl+X', icon: 'fa-solid fa-scissors' },
            { id: 'edit-copy', label: 'Copy', shortcut: 'Ctrl+C', icon: 'fa-regular fa-copy' },
            { id: 'edit-paste', label: 'Paste', shortcut: 'Ctrl+V', icon: 'fa-regular fa-paste' },
            { id: 'edit-paste-place', label: 'Paste in Place', shortcut: 'Ctrl+Shift+V' },
            { id: 'edit-duplicate', label: 'Duplicate', shortcut: 'Ctrl+D', icon: 'fa-regular fa-clone' },
            { id: 'edit-delete', label: 'Delete', shortcut: 'Del', icon: 'fa-regular fa-trash-can' },
            { divider: true },
            { id: 'edit-select-all', label: 'Select All', shortcut: 'Ctrl+A' },
            { id: 'edit-deselect', label: 'Deselect All', shortcut: 'Esc' }
        ]
    },

    // View operations
    {
        id: 'view',
        label: 'View',
        icon: 'fa-regular fa-eye',
        submenu: [
            { id: 'view-zoom-in', label: 'Zoom In', shortcut: 'Ctrl++', icon: 'fa-solid fa-magnifying-glass-plus' },
            { id: 'view-zoom-out', label: 'Zoom Out', shortcut: 'Ctrl+-', icon: 'fa-solid fa-magnifying-glass-minus' },
            { id: 'view-fit', label: 'Fit to Screen', shortcut: 'Ctrl+0', icon: 'fa-solid fa-expand' },
            { id: 'view-actual', label: 'Actual Size', shortcut: 'Ctrl+1' },
            { divider: true },
            { id: 'view-grid', label: 'Show Grid', shortcut: "Ctrl+'" },
            { id: 'view-guides', label: 'Show Guides', shortcut: 'Ctrl+;' },
            { id: 'view-snap-grid', label: 'Snap to Grid' },
            { id: 'view-snap-objects', label: 'Snap to Objects' },
            { divider: true },
            { id: 'view-rulers', label: 'Show Rulers', shortcut: 'Ctrl+R' },
            { divider: true },
            {
                id: 'view-theme',
                label: 'Theme',
                icon: 'fa-solid fa-palette',
                submenu: [
                    { id: 'theme-dark', label: 'Dark (Default)', checked: true },
                    { id: 'theme-light', label: 'Light' }
                ]
            }
        ]
    },

    // Slide operations
    {
        id: 'slide',
        label: 'Slide',
        icon: 'fa-regular fa-images',
        submenu: [
            { id: 'slide-new', label: 'New Slide', shortcut: 'Ctrl+Enter', icon: 'fa-solid fa-plus' },
            { id: 'slide-duplicate', label: 'Duplicate Slide', shortcut: 'Ctrl+Shift+D', icon: 'fa-regular fa-clone' },
            { id: 'slide-delete', label: 'Delete Slide', shortcut: 'Ctrl+Backspace', icon: 'fa-regular fa-trash-can' },
            { divider: true },
            { id: 'slide-edit-master', label: 'Edit Master', icon: 'fa-solid fa-layer-group' },
            { divider: true },
            { id: 'slide-move-up', label: 'Move Slide Up', shortcut: 'Ctrl+↑', icon: 'fa-solid fa-arrow-up' },
            { id: 'slide-move-down', label: 'Move Slide Down', shortcut: 'Ctrl+↓', icon: 'fa-solid fa-arrow-down' }
        ]
    },

    // Arrange operations
    {
        id: 'arrange',
        label: 'Arrange',
        icon: 'fa-solid fa-layer-group',
        submenu: [
            { id: 'arrange-front', label: 'Bring to Front', shortcut: 'Ctrl+Shift+]', icon: 'fa-solid fa-layer-group' },
            { id: 'arrange-forward', label: 'Bring Forward', shortcut: 'Ctrl+]' },
            { id: 'arrange-backward', label: 'Send Backward', shortcut: 'Ctrl+[' },
            { id: 'arrange-back', label: 'Send to Back', shortcut: 'Ctrl+Shift+[' },
            { divider: true },
            {
                id: 'arrange-align',
                label: 'Align',
                icon: 'fa-solid fa-align-left',
                submenu: [
                    { id: 'align-left', label: 'Left', icon: 'fa-solid fa-align-left' },
                    { id: 'align-center-h', label: 'Center Horizontal', icon: 'fa-solid fa-align-center' },
                    { id: 'align-right', label: 'Right', icon: 'fa-solid fa-align-right' },
                    { divider: true },
                    { id: 'align-top', label: 'Top', icon: 'fa-solid fa-align-left fa-rotate-90' },
                    { id: 'align-center-v', label: 'Center Vertical' },
                    { id: 'align-bottom', label: 'Bottom' }
                ]
            },
            {
                id: 'arrange-distribute',
                label: 'Distribute',
                icon: 'fa-solid fa-arrows-left-right',
                submenu: [
                    { id: 'distribute-h', label: 'Horizontal', icon: 'fa-solid fa-arrows-left-right' },
                    { id: 'distribute-v', label: 'Vertical', icon: 'fa-solid fa-arrows-up-down' }
                ]
            },
            { divider: true },
            { id: 'arrange-group', label: 'Group', shortcut: 'Ctrl+G', icon: 'fa-regular fa-object-group' },
            { id: 'arrange-ungroup', label: 'Ungroup', shortcut: 'Ctrl+Shift+G', icon: 'fa-regular fa-object-ungroup' },
            { divider: true },
            { id: 'arrange-lock', label: 'Lock', shortcut: 'Ctrl+L', icon: 'fa-solid fa-lock' },
            { id: 'arrange-unlock', label: 'Unlock All', shortcut: 'Ctrl+Shift+L', icon: 'fa-solid fa-unlock' }
        ]
    },

    // Insert operations
    {
        id: 'insert',
        label: 'Insert',
        icon: 'fa-solid fa-plus-circle',
        submenu: [
            { id: 'insert-rectangle', label: 'Rectangle', shortcut: 'R', icon: 'fa-regular fa-square' },
            { id: 'insert-ellipse', label: 'Ellipse', shortcut: 'O', icon: 'fa-regular fa-circle' },
            { id: 'insert-line', label: 'Line', shortcut: 'L', icon: 'fa-solid fa-minus' },
            { divider: true },
            { id: 'insert-text', label: 'Text', shortcut: 'T', icon: 'fa-solid fa-font' },
            { id: 'insert-image', label: 'Image...', shortcut: 'Shift+K', icon: 'fa-regular fa-image' },
            { id: 'insert-video', label: 'Video...', icon: 'fa-solid fa-video' },
            { divider: true },
            { id: 'insert-icon', label: 'Icon...', shortcut: 'Shift+I', icon: 'fa-solid fa-icons' },
            { id: 'insert-code', label: 'Code Block', icon: 'fa-solid fa-code' }
        ]
    },

    // Present operations
    {
        id: 'present',
        label: 'Present',
        icon: 'fa-solid fa-play',
        submenu: [
            { id: 'present-start', label: 'From Beginning', shortcut: 'Ctrl+Enter', icon: 'fa-solid fa-play' },
            { id: 'present-current', label: 'From Current Slide', shortcut: 'Ctrl+Shift+Enter', icon: 'fa-solid fa-forward' },
            { divider: true },
            { id: 'present-presenter', label: 'Presenter View', icon: 'fa-solid fa-display' },
            { divider: true },
            { id: 'present-rehearse', label: 'Rehearse Timings', icon: 'fa-solid fa-stopwatch' }
        ]
    },

    { divider: true },

    // Settings
    {
        id: 'settings',
        label: 'Settings...',
        shortcut: 'Ctrl+,',
        icon: 'fa-solid fa-gear'
    },

    // Help
    {
        id: 'help',
        label: 'Help',
        icon: 'fa-regular fa-circle-question',
        submenu: [
            { id: 'help-shortcuts', label: 'Keyboard Shortcuts', shortcut: 'Ctrl+/', icon: 'fa-regular fa-keyboard' },
            { id: 'help-docs', label: 'Documentation', icon: 'fa-solid fa-book' },
            { divider: true },
            { id: 'help-issue', label: 'Report an Issue', icon: 'fa-solid fa-bug' },
            { divider: true },
            { id: 'help-about', label: 'About Story', icon: 'fa-solid fa-info-circle' }
        ]
    }
];
}

/**
 * Get a flat list of all menu item IDs for action handling
 */
export function getAllMenuActions() {
    const actions = [];
    
    function traverse(items) {
        for (const item of items) {
            if (item.id) {
                actions.push(item.id);
            }
            if (item.submenu) {
                traverse(item.submenu);
            }
        }
    }
    
    traverse(getMenuConfig());
    return actions;
}

/**
 * Legacy export for backwards compatibility
 * Note: This is evaluated once at import time, so cloud items may not reflect 
 * current auth state. Use getMenuConfig() for dynamic menu generation.
 */
export const menuConfig = getMenuConfig();
