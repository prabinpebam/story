/**
 * ContextMenu Component
 * 
 * A reusable context menu component that renders menu items with keyboard
 * navigation, submenus, and accessibility support.
 * 
 * @example
 * const menu = new ContextMenu([
 *     { id: 'cut', label: 'Cut', shortcut: 'Ctrl+X', action: () => {} },
 *     { separator: true },
 *     { id: 'delete', label: 'Delete', danger: true, action: () => {} }
 * ]);
 * menu.show(100, 200);
 */

export class ContextMenu {
    /**
     * @param {MenuItem[]} items - Array of menu item configurations
     * @param {Object} options - Menu options
     * @param {boolean} options.isSubmenu - Whether this is a submenu
     * @param {ContextMenu} options.parentMenu - Parent menu reference for submenus
     */
    constructor(items, options = {}) {
        this.items = items;
        this.isSubmenu = options.isSubmenu || false;
        this.parentMenu = options.parentMenu || null;
        
        this.element = null;
        this.activeSubmenu = null;
        this.focusedIndex = -1;
        this.submenuTimeout = null;
        this.itemElements = [];
        
        // Bind methods
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleClickOutside = this.handleClickOutside.bind(this);
    }

    /**
     * Render the menu DOM structure
     * @returns {HTMLElement}
     */
    render() {
        const menu = document.createElement('div');
        menu.className = 'context-menu';
        menu.setAttribute('role', 'menu');
        menu.setAttribute('tabindex', '-1');
        
        this.itemElements = [];
        
        this.items.forEach((item, index) => {
            if (item.separator) {
                const separator = document.createElement('div');
                separator.className = 'context-menu-separator';
                separator.setAttribute('role', 'separator');
                menu.appendChild(separator);
                this.itemElements.push(null); // Placeholder for index alignment
            } else if (item.visible === false || (typeof item.visible === 'function' && !item.visible())) {
                this.itemElements.push(null); // Hidden item
            } else {
                const itemEl = this.renderItem(item, index);
                menu.appendChild(itemEl);
                this.itemElements.push(itemEl);
            }
        });
        
        this.element = menu;
        return menu;
    }

    /**
     * Render a single menu item
     * @param {MenuItem} item
     * @param {number} index
     * @returns {HTMLElement}
     */
    renderItem(item, index) {
        const itemEl = document.createElement('div');
        itemEl.className = 'context-menu-item';
        itemEl.setAttribute('role', 'menuitem');
        itemEl.setAttribute('data-index', index);
        itemEl.id = `context-menu-item-${item.id || index}`;
        
        if (item.disabled) {
            itemEl.classList.add('disabled');
            itemEl.setAttribute('aria-disabled', 'true');
        }
        
        if (item.danger) {
            itemEl.classList.add('danger');
        }
        
        if (item.submenu) {
            itemEl.classList.add('has-submenu');
            itemEl.setAttribute('aria-haspopup', 'menu');
            itemEl.setAttribute('aria-expanded', 'false');
        }
        
        // Icon (optional)
        if (item.icon) {
            const icon = document.createElement('i');
            icon.className = `context-menu-icon ${item.icon}`;
            icon.setAttribute('aria-hidden', 'true');
            itemEl.appendChild(icon);
        }
        
        // Label
        const label = document.createElement('span');
        label.className = 'context-menu-label';
        label.textContent = item.label;
        itemEl.appendChild(label);
        
        // Shortcut (optional)
        if (item.shortcut) {
            const shortcut = document.createElement('span');
            shortcut.className = 'context-menu-shortcut';
            shortcut.textContent = this.formatShortcut(item.shortcut);
            itemEl.appendChild(shortcut);
        }
        
        // Event listeners
        if (!item.disabled) {
            itemEl.addEventListener('click', (e) => {
                e.stopPropagation();
                if (item.submenu) {
                    this.openSubmenu(item, itemEl);
                } else if (item.action) {
                    item.action();
                    this.hideAll();
                }
            });
            
            itemEl.addEventListener('mouseenter', () => {
                this.focusItem(index);
                if (item.submenu) {
                    this.scheduleSubmenu(item, itemEl);
                } else {
                    this.closeSubmenu();
                }
            });
            
            itemEl.addEventListener('mouseleave', () => {
                this.clearSubmenuTimeout();
            });
        }
        
        return itemEl;
    }

    /**
     * Format keyboard shortcut for display
     * @param {string} shortcut
     * @returns {string}
     */
    formatShortcut(shortcut) {
        // Detect Mac
        const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
        
        if (isMac) {
            return shortcut
                .replace(/Ctrl\+/g, '⌘')
                .replace(/Alt\+/g, '⌥')
                .replace(/Shift\+/g, '⇧')
                .replace(/Delete/g, '⌫');
        }
        
        return shortcut;
    }

    /**
     * Show the menu at specified coordinates
     * @param {number} x
     * @param {number} y
     */
    show(x, y) {
        if (!this.element) {
            this.render();
        }

        // Ensure menu is visible to the accessibility tree when shown.
        this.element.removeAttribute('aria-hidden');
        this.element.style.visibility = 'visible';
        this.element.style.pointerEvents = '';
        
        document.body.appendChild(this.element);
        
        // Position menu
        this.position(x, y);
        
        // Animate in
        requestAnimationFrame(() => {
            // Check if element still exists (may have been destroyed)
            if (this.element) {
                this.element.classList.add('visible');
            }
        });

        // Move focus into the menu so subsequent key presses (Enter/Arrow keys)
        // are handled by the menu keyboard handler instead of the trigger.
        try {
            this.element.focus({ preventScroll: true });
        } catch {
            // Older browsers / test environments may not support focus options.
            this.element.focus();
        }
        
        // Focus first item
        this.focusFirstItem();
        
        // Add global listeners
        document.addEventListener('keydown', this.handleKeyDown);
        
        // Delay click outside listener to prevent immediate close
        setTimeout(() => {
            document.addEventListener('click', this.handleClickOutside);
        }, 0);
    }

    /**
     * Position menu within viewport bounds
     * @param {number} x
     * @param {number} y
     */
    position(x, y) {
        // Temporarily show to measure
        this.element.style.visibility = 'hidden';
        this.element.style.left = '0';
        this.element.style.top = '0';
        
        const rect = this.element.getBoundingClientRect();
        const viewport = {
            width: window.innerWidth,
            height: window.innerHeight
        };
        
        const margin = 8;
        
        // Flip horizontally if overflows right
        if (x + rect.width > viewport.width - margin) {
            if (this.isSubmenu && this.parentMenu) {
                // Position submenu to the left of parent
                const parentRect = this.parentMenu.element.getBoundingClientRect();
                x = parentRect.left - rect.width;
            } else {
                x = viewport.width - rect.width - margin;
            }
        }
        
        // Flip vertically if overflows bottom
        if (y + rect.height > viewport.height - margin) {
            y = viewport.height - rect.height - margin;
        }
        
        // Ensure never negative
        x = Math.max(margin, x);
        y = Math.max(margin, y);
        
        this.element.style.left = `${x}px`;
        this.element.style.top = `${y}px`;
        this.element.style.visibility = 'visible';
    }

    /**
     * Hide the menu
     */
    hide() {
        if (!this.element) return;
        
        this.closeSubmenu();
        
        this.element.classList.remove('visible');

        // Remove from the accessibility tree immediately. The element is
        // removed from the DOM after the close animation finishes.
        this.element.setAttribute('aria-hidden', 'true');
        this.element.style.visibility = 'hidden';
        this.element.style.pointerEvents = 'none';
        
        // Remove after animation
        setTimeout(() => {
            if (this.element && this.element.parentNode) {
                this.element.parentNode.removeChild(this.element);
            }
        }, 100); // Match --duration-fast
        
        // Remove global listeners
        document.removeEventListener('keydown', this.handleKeyDown);
        document.removeEventListener('click', this.handleClickOutside);
        
        this.focusedIndex = -1;
    }

    /**
     * Hide this menu and all parent/child menus
     */
    hideAll() {
        // Find root menu
        let root = this;
        while (root.parentMenu) {
            root = root.parentMenu;
        }
        root.hide();
    }

    /**
     * Handle click outside menu
     * @param {MouseEvent} e
     */
    handleClickOutside(e) {
        if (this.element && !this.element.contains(e.target)) {
            // Check if click is in submenu
            if (this.activeSubmenu && this.activeSubmenu.element.contains(e.target)) {
                return;
            }
            this.hide();
        }
    }

    /**
     * Handle keyboard navigation
     * @param {KeyboardEvent} e
     */
    handleKeyDown(e) {
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                this.focusNextItem();
                break;
                
            case 'ArrowUp':
                e.preventDefault();
                this.focusPreviousItem();
                break;
                
            case 'ArrowRight':
                e.preventDefault();
                this.openFocusedSubmenu();
                break;
                
            case 'ArrowLeft':
                e.preventDefault();
                if (this.isSubmenu) {
                    this.hide();
                    this.parentMenu?.element?.focus();
                }
                break;
                
            case 'Enter':
            case ' ':
                e.preventDefault();
                this.activateFocusedItem();
                break;
                
            case 'Escape':
                e.preventDefault();
                if (this.isSubmenu) {
                    this.hide();
                    this.parentMenu?.element?.focus();
                } else {
                    this.hide();
                }
                break;
                
            case 'Home':
                e.preventDefault();
                this.focusFirstItem();
                break;
                
            case 'End':
                e.preventDefault();
                this.focusLastItem();
                break;
                
            default:
                // Type-ahead: focus item starting with typed character
                if (e.key.length === 1 && /[a-zA-Z]/.test(e.key)) {
                    this.focusItemByChar(e.key.toLowerCase());
                }
        }
    }

    /**
     * Focus a specific item by index
     * @param {number} index
     */
    focusItem(index) {
        // Remove previous focus
        if (this.focusedIndex >= 0 && this.itemElements[this.focusedIndex]) {
            this.itemElements[this.focusedIndex].classList.remove('focused');
        }
        
        // Set new focus
        if (this.itemElements[index]) {
            this.focusedIndex = index;
            this.itemElements[index].classList.add('focused');
            this.element.setAttribute('aria-activedescendant', this.itemElements[index].id);
        }
    }

    /**
     * Focus first non-separator, non-disabled item
     */
    focusFirstItem() {
        for (let i = 0; i < this.itemElements.length; i++) {
            if (this.itemElements[i] && !this.items[i].disabled) {
                this.focusItem(i);
                return;
            }
        }
    }

    /**
     * Focus last non-separator, non-disabled item
     */
    focusLastItem() {
        for (let i = this.itemElements.length - 1; i >= 0; i--) {
            if (this.itemElements[i] && !this.items[i].disabled) {
                this.focusItem(i);
                return;
            }
        }
    }

    /**
     * Focus next non-separator, non-disabled item
     */
    focusNextItem() {
        let index = this.focusedIndex + 1;
        while (index < this.itemElements.length) {
            if (this.itemElements[index] && !this.items[index].disabled) {
                this.focusItem(index);
                return;
            }
            index++;
        }
        // Wrap to beginning
        this.focusFirstItem();
    }

    /**
     * Focus previous non-separator, non-disabled item
     */
    focusPreviousItem() {
        let index = this.focusedIndex - 1;
        while (index >= 0) {
            if (this.itemElements[index] && !this.items[index].disabled) {
                this.focusItem(index);
                return;
            }
            index--;
        }
        // Wrap to end
        this.focusLastItem();
    }

    /**
     * Focus item by first character
     * @param {string} char
     */
    focusItemByChar(char) {
        // Start from focused item + 1
        const startIndex = this.focusedIndex + 1;
        
        for (let i = 0; i < this.items.length; i++) {
            const index = (startIndex + i) % this.items.length;
            const item = this.items[index];
            
            if (item.label && 
                item.label.toLowerCase().startsWith(char) &&
                this.itemElements[index] &&
                !item.disabled) {
                this.focusItem(index);
                return;
            }
        }
    }

    /**
     * Activate (click) the currently focused item
     */
    activateFocusedItem() {
        if (this.focusedIndex >= 0 && this.itemElements[this.focusedIndex]) {
            const item = this.items[this.focusedIndex];
            if (!item.disabled) {
                if (item.submenu) {
                    this.openSubmenu(item, this.itemElements[this.focusedIndex]);
                } else if (item.action) {
                    item.action();
                    this.hideAll();
                }
            }
        }
    }

    /**
     * Open submenu for focused item (ArrowRight)
     */
    openFocusedSubmenu() {
        if (this.focusedIndex >= 0) {
            const item = this.items[this.focusedIndex];
            if (item.submenu && !item.disabled) {
                this.openSubmenu(item, this.itemElements[this.focusedIndex]);
            }
        }
    }

    /**
     * Schedule submenu opening after hover delay
     * @param {MenuItem} item
     * @param {HTMLElement} itemEl
     */
    scheduleSubmenu(item, itemEl) {
        this.clearSubmenuTimeout();
        this.submenuTimeout = setTimeout(() => {
            this.openSubmenu(item, itemEl);
        }, 150); // --duration-normal
    }

    /**
     * Clear submenu timeout
     */
    clearSubmenuTimeout() {
        if (this.submenuTimeout) {
            clearTimeout(this.submenuTimeout);
            this.submenuTimeout = null;
        }
    }

    /**
     * Open a submenu
     * @param {MenuItem} item
     * @param {HTMLElement} itemEl
     */
    openSubmenu(item, itemEl) {
        this.closeSubmenu();
        
        if (!item.submenu || item.submenu.length === 0) return;
        
        const submenu = new ContextMenu(item.submenu, {
            isSubmenu: true,
            parentMenu: this
        });
        
        submenu.render();
        
        // Position submenu to the right of the item
        const itemRect = itemEl.getBoundingClientRect();
        submenu.show(itemRect.right, itemRect.top);
        
        // Update ARIA
        itemEl.setAttribute('aria-expanded', 'true');
        
        this.activeSubmenu = submenu;
    }

    /**
     * Close the active submenu
     */
    closeSubmenu() {
        this.clearSubmenuTimeout();
        
        if (this.activeSubmenu) {
            // Update ARIA on parent item
            const expandedItem = this.element?.querySelector('[aria-expanded="true"]');
            if (expandedItem) {
                expandedItem.setAttribute('aria-expanded', 'false');
            }
            
            this.activeSubmenu.hide();
            this.activeSubmenu = null;
        }
    }

    /**
     * Destroy the menu and clean up
     */
    destroy() {
        this.hide();
        this.element = null;
        this.itemElements = [];
    }
}

/**
 * @typedef {Object} MenuItem
 * @property {string} [id] - Unique identifier for the item
 * @property {string} [label] - Display text
 * @property {string} [icon] - Icon class (e.g., 'fa-solid fa-copy')
 * @property {string} [shortcut] - Keyboard shortcut display (e.g., 'Ctrl+C')
 * @property {Function} [action] - Click handler
 * @property {MenuItem[]} [submenu] - Nested menu items
 * @property {boolean} [disabled] - Whether item is disabled
 * @property {boolean|Function} [visible] - Whether item is visible
 * @property {boolean} [danger] - Whether item is destructive (styled red)
 * @property {boolean} [separator] - Whether this is a separator line
 */
