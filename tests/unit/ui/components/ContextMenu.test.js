/**
 * Context Menu Tests
 * 
 * Unit tests for ContextMenu and ContextMenuManager components.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ContextMenu } from '../../../../src/ui/components/ContextMenu/ContextMenu.js';
import { ContextMenuManager, contextMenuManager } from '../../../../src/ui/components/ContextMenu/ContextMenuManager.js';

describe('ContextMenu', () => {
    let menu;
    
    afterEach(() => {
        if (menu) {
            menu.destroy();
            menu = null;
        }
        // Clean up any menus left in DOM
        document.querySelectorAll('.context-menu').forEach(el => el.remove());
    });

    describe('render', () => {
        it('renders items with correct labels', () => {
            menu = new ContextMenu([
                { id: 'cut', label: 'Cut' },
                { id: 'copy', label: 'Copy' },
                { id: 'paste', label: 'Paste' }
            ]);
            
            const element = menu.render();
            const items = element.querySelectorAll('.context-menu-item');
            
            expect(items.length).toBe(3);
            expect(items[0].textContent).toContain('Cut');
            expect(items[1].textContent).toContain('Copy');
            expect(items[2].textContent).toContain('Paste');
        });

        it('displays keyboard shortcuts', () => {
            menu = new ContextMenu([
                { id: 'cut', label: 'Cut', shortcut: 'Ctrl+X' },
                { id: 'copy', label: 'Copy', shortcut: 'Ctrl+C' }
            ]);
            
            const element = menu.render();
            const shortcuts = element.querySelectorAll('.context-menu-shortcut');
            
            expect(shortcuts.length).toBe(2);
            // On non-Mac, should show Ctrl+X
            expect(shortcuts[0].textContent).toMatch(/Ctrl\+X|⌘X/);
        });

        it('renders separators between groups', () => {
            menu = new ContextMenu([
                { id: 'cut', label: 'Cut' },
                { separator: true },
                { id: 'delete', label: 'Delete' }
            ]);
            
            const element = menu.render();
            const separators = element.querySelectorAll('.context-menu-separator');
            
            expect(separators.length).toBe(1);
        });

        it('applies disabled class to disabled items', () => {
            menu = new ContextMenu([
                { id: 'paste', label: 'Paste', disabled: true }
            ]);
            
            const element = menu.render();
            const item = element.querySelector('.context-menu-item');
            
            expect(item.classList.contains('disabled')).toBe(true);
            expect(item.getAttribute('aria-disabled')).toBe('true');
        });

        it('applies danger class to destructive items', () => {
            menu = new ContextMenu([
                { id: 'delete', label: 'Delete', danger: true }
            ]);
            
            const element = menu.render();
            const item = element.querySelector('.context-menu-item');
            
            expect(item.classList.contains('danger')).toBe(true);
        });

        it('hides items when visible is false', () => {
            menu = new ContextMenu([
                { id: 'cut', label: 'Cut', visible: false },
                { id: 'copy', label: 'Copy' }
            ]);
            
            const element = menu.render();
            const items = element.querySelectorAll('.context-menu-item');
            
            // Only visible item should render
            expect(items.length).toBe(1);
            expect(items[0].textContent).toContain('Copy');
        });

        it('evaluates visible function for conditional items', () => {
            menu = new ContextMenu([
                { id: 'group', label: 'Group', visible: () => true },
                { id: 'ungroup', label: 'Ungroup', visible: () => false }
            ]);
            
            const element = menu.render();
            const items = element.querySelectorAll('.context-menu-item');
            
            expect(items.length).toBe(1);
            expect(items[0].textContent).toContain('Group');
        });

        it('renders icons when provided', () => {
            menu = new ContextMenu([
                { id: 'copy', label: 'Copy', icon: 'fa-solid fa-copy' }
            ]);
            
            const element = menu.render();
            const icon = element.querySelector('.context-menu-icon');
            
            expect(icon).not.toBeNull();
            expect(icon.classList.contains('fa-solid')).toBe(true);
        });

        it('marks submenu items with has-submenu class', () => {
            menu = new ContextMenu([
                { 
                    id: 'align', 
                    label: 'Align', 
                    submenu: [
                        { id: 'left', label: 'Left' }
                    ] 
                }
            ]);
            
            const element = menu.render();
            const item = element.querySelector('.context-menu-item');
            
            expect(item.classList.contains('has-submenu')).toBe(true);
            expect(item.getAttribute('aria-haspopup')).toBe('menu');
        });
    });

    describe('accessibility', () => {
        it('has role="menu" on container', () => {
            menu = new ContextMenu([{ id: 'cut', label: 'Cut' }]);
            const element = menu.render();
            
            expect(element.getAttribute('role')).toBe('menu');
        });

        it('has role="menuitem" on items', () => {
            menu = new ContextMenu([{ id: 'cut', label: 'Cut' }]);
            const element = menu.render();
            const item = element.querySelector('.context-menu-item');
            
            expect(item.getAttribute('role')).toBe('menuitem');
        });

        it('has role="separator" on dividers', () => {
            menu = new ContextMenu([
                { id: 'cut', label: 'Cut' },
                { separator: true }
            ]);
            const element = menu.render();
            const separator = element.querySelector('.context-menu-separator');
            
            expect(separator.getAttribute('role')).toBe('separator');
        });
    });

    describe('show/hide', () => {
        it('shows menu at specified coordinates', () => {
            menu = new ContextMenu([{ id: 'cut', label: 'Cut' }]);
            menu.show(100, 200);
            
            const element = document.querySelector('.context-menu');
            expect(element).not.toBeNull();
            expect(element.style.left).toBe('100px');
            expect(element.style.top).toBe('200px');
        });

        it('adds visible class after showing', async () => {
            menu = new ContextMenu([{ id: 'cut', label: 'Cut' }]);
            menu.show(100, 200);
            
            // Wait for requestAnimationFrame
            await new Promise(resolve => requestAnimationFrame(resolve));
            
            const element = document.querySelector('.context-menu');
            expect(element.classList.contains('visible')).toBe(true);
        });

        it('removes menu from DOM after hiding', async () => {
            menu = new ContextMenu([{ id: 'cut', label: 'Cut' }]);
            menu.show(100, 200);
            menu.hide();
            
            // Wait for animation timeout
            await new Promise(resolve => setTimeout(resolve, 150));
            
            const element = document.querySelector('.context-menu');
            expect(element).toBeNull();
        });

        it('adjusts position to stay within viewport', () => {
            menu = new ContextMenu([{ id: 'cut', label: 'Cut' }]);
            
            // Try to show at bottom-right corner of viewport
            menu.show(window.innerWidth + 100, window.innerHeight + 100);
            
            const element = document.querySelector('.context-menu');
            const rect = element.getBoundingClientRect();
            
            // Menu should be positioned within viewport
            expect(rect.right).toBeLessThanOrEqual(window.innerWidth);
            expect(rect.bottom).toBeLessThanOrEqual(window.innerHeight);
        });
    });

    describe('keyboard navigation', () => {
        beforeEach(() => {
            menu = new ContextMenu([
                { id: 'cut', label: 'Cut' },
                { id: 'copy', label: 'Copy' },
                { separator: true },
                { id: 'delete', label: 'Delete' }
            ]);
            menu.show(100, 200);
        });

        it('moves focus down with ArrowDown', () => {
            const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
            document.dispatchEvent(event);
            
            // Should focus second item (first is already focused on show)
            expect(menu.focusedIndex).toBe(1);
        });

        it('moves focus up with ArrowUp', () => {
            // Focus second item first
            menu.focusItem(1);
            
            const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });
            document.dispatchEvent(event);
            
            expect(menu.focusedIndex).toBe(0);
        });

        it('skips separators when navigating', () => {
            // Focus second item (copy)
            menu.focusItem(1);
            
            const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
            document.dispatchEvent(event);
            
            // Should skip separator and focus delete
            expect(menu.focusedIndex).toBe(3);
        });

        it('wraps to first item when at end', () => {
            menu.focusItem(3); // Last item
            
            const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
            document.dispatchEvent(event);
            
            expect(menu.focusedIndex).toBe(0);
        });

        it('closes menu with Escape', () => {
            const event = new KeyboardEvent('keydown', { key: 'Escape' });
            document.dispatchEvent(event);
            
            expect(menu.element.classList.contains('visible')).toBe(false);
        });

        it('activates item with Enter', () => {
            const action = vi.fn();
            menu = new ContextMenu([
                { id: 'test', label: 'Test', action }
            ]);
            menu.show(100, 200);
            
            const event = new KeyboardEvent('keydown', { key: 'Enter' });
            document.dispatchEvent(event);
            
            expect(action).toHaveBeenCalled();
        });
    });

    describe('actions', () => {
        it('calls action on item click', () => {
            const action = vi.fn();
            menu = new ContextMenu([
                { id: 'cut', label: 'Cut', action }
            ]);
            menu.show(100, 200);
            
            const item = document.querySelector('.context-menu-item');
            item.click();
            
            expect(action).toHaveBeenCalled();
        });

        it('hides menu after action', () => {
            menu = new ContextMenu([
                { id: 'cut', label: 'Cut', action: () => {} }
            ]);
            menu.show(100, 200);
            
            const item = document.querySelector('.context-menu-item');
            item.click();
            
            expect(menu.element.classList.contains('visible')).toBe(false);
        });

        it('does not call action on disabled item click', () => {
            const action = vi.fn();
            menu = new ContextMenu([
                { id: 'paste', label: 'Paste', action, disabled: true }
            ]);
            menu.show(100, 200);
            
            const item = document.querySelector('.context-menu-item');
            item.click();
            
            expect(action).not.toHaveBeenCalled();
        });
    });
});

describe('ContextMenuManager', () => {
    let manager;
    
    beforeEach(() => {
        manager = new ContextMenuManager();
    });
    
    afterEach(() => {
        manager.destroy();
        // Clean up any menus left in DOM
        document.querySelectorAll('.context-menu').forEach(el => el.remove());
    });

    describe('register/unregister', () => {
        it('registers menu configuration', () => {
            manager.register('test-zone', {
                getItems: () => [{ id: 'test', label: 'Test' }]
            });
            
            expect(manager.isRegistered('test-zone')).toBe(true);
        });

        it('unregisters menu configuration', () => {
            manager.register('test-zone', {
                getItems: () => [{ id: 'test', label: 'Test' }]
            });
            manager.unregister('test-zone');
            
            expect(manager.isRegistered('test-zone')).toBe(false);
        });
    });

    describe('show/hide', () => {
        beforeEach(() => {
            manager.register('test-zone', {
                getItems: () => [
                    { id: 'cut', label: 'Cut' },
                    { id: 'copy', label: 'Copy' }
                ]
            });
        });

        it('shows menu for registered zone', () => {
            manager.show('test-zone', 100, 200);
            
            expect(manager.isVisible()).toBe(true);
            expect(document.querySelector('.context-menu')).not.toBeNull();
        });

        it('hides menu', () => {
            manager.show('test-zone', 100, 200);
            manager.hide();
            
            expect(manager.isVisible()).toBe(false);
        });

        it('only shows one menu at a time', () => {
            manager.show('test-zone', 100, 200);
            manager.show('test-zone', 300, 400);
            
            const menus = document.querySelectorAll('.context-menu');
            // One is hiding (animating out), one is showing
            expect(manager.activeMenu).not.toBeNull();
        });

        it('returns active zone', () => {
            manager.show('test-zone', 100, 200);
            
            expect(manager.getActiveZone()).toBe('test-zone');
        });
    });

    describe('getMenuItems', () => {
        it('returns items for registered zone', () => {
            manager.register('test-zone', {
                getItems: () => [{ id: 'test', label: 'Test' }]
            });
            
            const items = manager.getMenuItems('test-zone');
            
            expect(items).toHaveLength(1);
            expect(items[0].label).toBe('Test');
        });

        it('passes context to getItems', () => {
            const getItems = vi.fn(() => []);
            manager.register('test-zone', { getItems });
            
            const context = { selection: ['element1'] };
            manager.getMenuItems('test-zone', context);
            
            expect(getItems).toHaveBeenCalledWith(context);
        });

        it('returns empty array for unregistered zone', () => {
            const items = manager.getMenuItems('unknown-zone');
            
            expect(items).toEqual([]);
        });
    });

    describe('filterItems', () => {
        it('removes hidden items', () => {
            const items = [
                { id: 'visible', label: 'Visible' },
                { id: 'hidden', label: 'Hidden', visible: false }
            ];
            
            const filtered = manager.filterItems(items, {});
            
            expect(filtered).toHaveLength(1);
            expect(filtered[0].id).toBe('visible');
        });

        it('removes leading separators', () => {
            const items = [
                { separator: true },
                { id: 'item', label: 'Item' }
            ];
            
            const filtered = manager.filterItems(items, {});
            
            expect(filtered).toHaveLength(1);
            expect(filtered[0].id).toBe('item');
        });

        it('removes trailing separators', () => {
            const items = [
                { id: 'item', label: 'Item' },
                { separator: true }
            ];
            
            const filtered = manager.filterItems(items, {});
            
            expect(filtered).toHaveLength(1);
            expect(filtered[0].id).toBe('item');
        });

        it('removes consecutive separators', () => {
            const items = [
                { id: 'item1', label: 'Item 1' },
                { separator: true },
                { separator: true },
                { id: 'item2', label: 'Item 2' }
            ];
            
            const filtered = manager.filterItems(items, {});
            
            expect(filtered).toHaveLength(3);
            expect(filtered.filter(i => i.separator)).toHaveLength(1);
        });

        it('evaluates visible function with context', () => {
            const items = [
                { id: 'group', label: 'Group', visible: (ctx) => ctx.count > 1 }
            ];
            
            const filtered1 = manager.filterItems(items, { count: 1 });
            expect(filtered1).toHaveLength(0);
            
            const filtered2 = manager.filterItems(items, { count: 2 });
            expect(filtered2).toHaveLength(1);
        });
    });

    describe('createHandler', () => {
        it('creates event handler for zone', () => {
            manager.register('test-zone', {
                getItems: () => [{ id: 'test', label: 'Test' }]
            });
            
            const handler = manager.createHandler('test-zone');
            
            expect(typeof handler).toBe('function');
        });

        it('handler prevents default and shows menu', () => {
            manager.register('test-zone', {
                getItems: () => [{ id: 'test', label: 'Test' }]
            });
            
            const handler = manager.createHandler('test-zone');
            const event = {
                preventDefault: vi.fn(),
                stopPropagation: vi.fn(),
                clientX: 100,
                clientY: 200
            };
            
            handler(event);
            
            expect(event.preventDefault).toHaveBeenCalled();
            expect(manager.isVisible()).toBe(true);
        });

        it('handler passes context from getContext function', () => {
            const getItems = vi.fn(() => [{ id: 'test', label: 'Test' }]);
            manager.register('test-zone', { getItems });
            
            const getContext = (e) => ({ target: e.target });
            const handler = manager.createHandler('test-zone', getContext);
            const event = {
                preventDefault: vi.fn(),
                stopPropagation: vi.fn(),
                clientX: 100,
                clientY: 200,
                target: document.body
            };
            
            handler(event);
            
            expect(getItems).toHaveBeenCalledWith(expect.objectContaining({ 
                target: document.body 
            }));
        });
    });
});

describe('contextMenuManager singleton', () => {
    afterEach(() => {
        contextMenuManager.hide();
        contextMenuManager.menuConfigs.clear();
        document.querySelectorAll('.context-menu').forEach(el => el.remove());
    });

    it('is a singleton instance', () => {
        expect(contextMenuManager).toBeInstanceOf(ContextMenuManager);
    });

    it('can register and show menus', () => {
        contextMenuManager.register('singleton-test', {
            getItems: () => [{ id: 'test', label: 'Test' }]
        });
        
        contextMenuManager.show('singleton-test', 100, 200);
        
        expect(contextMenuManager.isVisible()).toBe(true);
    });
});
