import { getMenuConfig } from '../components/AppMenu/menuConfig.js';

function flattenMenu(items, acc = []) {
    for (const item of items || []) {
        if (!item) continue;
        if (item.submenu) flattenMenu(item.submenu, acc);
        if (item.shortcut && item.label) {
            acc.push({
                id: item.id,
                section: 'Menu',
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
