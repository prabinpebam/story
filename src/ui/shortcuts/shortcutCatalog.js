import { getMenuConfig } from '../components/AppMenu/menuConfig.js';

function inferFunctionalSection({ id, label, pathLabel }) {
    const actionId = String(id || '');
    const top = String(pathLabel || '').toLowerCase();

    // Prefer semantic action id prefixes when available.
    if (actionId.startsWith('file-') || actionId === 'file') return 'File';
    if (actionId.startsWith('edit-') || actionId === 'edit') return 'Edit';
    if (actionId.startsWith('insert-') || actionId === 'insert') return 'Insert';
    if (actionId.startsWith('arrange-') || actionId === 'arrange') return 'Arrange';
    if (actionId.startsWith('view-') || actionId === 'view') return 'View';
    if (actionId.startsWith('present-') || actionId === 'present') return 'Presentation';
    if (actionId.startsWith('help-') || actionId === 'help') return 'Help';
    if (actionId === 'settings') return 'Settings';

    // Fallback to top-level menu location (still function-oriented).
    if (top.includes('file')) return 'File';
    if (top.includes('edit')) return 'Edit';
    if (top.includes('insert')) return 'Insert';
    if (top.includes('arrange')) return 'Arrange';
    if (top.includes('view')) return 'View';
    if (top.includes('present')) return 'Presentation';
    if (top.includes('help')) return 'Help';
    if (top.includes('setting')) return 'Settings';

    // Final heuristic: label keywords.
    const text = String(label || '').toLowerCase();
    if (text.includes('export') || text.includes('save') || text.includes('open') || text.includes('new')) return 'File';
    if (text.includes('undo') || text.includes('redo') || text.includes('copy') || text.includes('paste') || text.includes('duplicate')) return 'Edit';
    if (text.includes('zoom') || text.includes('grid') || text.includes('ruler')) return 'View';

    return 'Other';
}

function flattenMenu(items, acc = [], parentLabel = null) {
    for (const item of items || []) {
        if (!item) continue;

        const isTopLevel = parentLabel == null;
        const nextParent = isTopLevel ? item.label : parentLabel;

        if (item.submenu) flattenMenu(item.submenu, acc, nextParent);
        if (item.shortcut && item.label) {
            acc.push({
                id: item.id,
                section: inferFunctionalSection({ id: item.id, label: item.label, pathLabel: nextParent }),
                label: item.label,
                shortcut: item.shortcut,
            });
        }
    }
    return acc;
}

/**
 * Canonical shortcut catalog for the in-app overlay.
 *
 * NOTE: This is intentionally a UI catalog (what we show), not a full shortcut router.
 */
export function getShortcutCatalog() {
    const nonMenu = [
        // Tools
        { id: 'tool-select', section: 'Tools', label: 'Select / Move', shortcut: 'V' },
        { id: 'tool-hand', section: 'Tools', label: 'Hand (pan)', shortcut: 'H' },
        { id: 'tool-text', section: 'Tools', label: 'Text tool', shortcut: 'T' },
        { id: 'tool-rect', section: 'Tools', label: 'Rectangle tool', shortcut: 'R' },
        { id: 'tool-ellipse', section: 'Tools', label: 'Ellipse tool', shortcut: 'O' },
        { id: 'tool-line', section: 'Tools', label: 'Line tool', shortcut: 'L' },
        { id: 'tool-arrow', section: 'Tools', label: 'Arrow tool', shortcut: 'Shift+L' },
        { id: 'tool-resources', section: 'Tools', label: 'Toggle Resources (Icon Library)', shortcut: 'Shift+I' },
        { id: 'tool-image', section: 'Tools', label: 'Image tool', shortcut: 'Shift+K' },

        // Core editing
        { id: 'edit-duplicate', section: 'Edit', label: 'Duplicate selection', shortcut: 'Cmd/Ctrl+D' },
        { id: 'edit-delete', section: 'Edit', label: 'Delete selection', shortcut: 'Delete / Backspace' },
        { id: 'edit-select-all', section: 'Edit', label: 'Select all', shortcut: 'Cmd/Ctrl+A' },
        { id: 'edit-copy', section: 'Edit', label: 'Copy', shortcut: 'Cmd/Ctrl+C' },
        { id: 'edit-paste', section: 'Edit', label: 'Paste', shortcut: 'Cmd/Ctrl+V' },

        // Panels
        { id: 'panel-color-theme', section: 'Panels', label: 'Toggle Color Theme manager', shortcut: 'Cmd/Ctrl+Shift+C' },
        { id: 'panel-typography', section: 'Panels', label: 'Toggle Typography Style manager', shortcut: 'Cmd/Ctrl+Shift+T' },
        { id: 'panel-code-fill', section: 'Panels', label: 'Toggle Code Fill panel', shortcut: 'Cmd/Ctrl+Shift+K' },

        // Presentation
        { id: 'present-next', section: 'Presentation', label: 'Next (build, then slide)', shortcut: '→ / Space / Enter / PgDn / N' },
        { id: 'present-prev', section: 'Presentation', label: 'Previous (build, then slide)', shortcut: '← / Backspace / PgUp / P' },
        { id: 'present-exit', section: 'Presentation', label: 'Exit presentation', shortcut: 'Esc' },

        // Overlay
        { id: 'overlay-toggle-question', section: 'Help', label: 'Toggle keyboard shortcuts overlay', shortcut: '?' },
        { id: 'overlay-toggle-slash', section: 'Help', label: 'Toggle keyboard shortcuts overlay', shortcut: 'Cmd/Ctrl+/' },
    ];

    // Pull menu-labeled shortcuts from the menu config.
    // If duplicates exist, we keep the first occurrence.
    const seen = new Set(nonMenu.map((s) => s.shortcut));
    const menuShortcuts = flattenMenu(getMenuConfig())
        .filter((s) => {
            if (seen.has(s.shortcut)) return false;
            seen.add(s.shortcut);
            return true;
        });

    return [...nonMenu, ...menuShortcuts];
}

export function groupShortcutsBySection(shortcuts) {
    const groups = new Map();
    for (const shortcut of shortcuts) {
        const section = shortcut.section || 'Other';
        if (!groups.has(section)) groups.set(section, []);
        groups.get(section).push(shortcut);
    }
    return Array.from(groups.entries()).map(([section, items]) => ({ section, items }));
}
