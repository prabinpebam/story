/**
 * MenuDropdown - Dropdown menu container component
 * 
 * Renders a hierarchical menu with support for submenus,
 * keyboard navigation, and accessibility.
 */

import { MenuItem } from './MenuItem.js';

export class MenuDropdown {
    constructor(options) {
        this.options = {
            items: [],
            position: { top: 0, left: 0 },
            onClose: () => {},
            onAction: () => {},
            isSubmenu: false,
            parentItem: null,
            ...options
        };

        this.element = null;
        this.menuItems = [];
        this.activeSubmenu = null;
        this.focusedIndex = -1;

        this.create();
    }

    create() {
        this.element = document.createElement('div');
        this.element.className = 'app-menu-dropdown';
        this.element.setAttribute('role', 'menu');
        this.element.setAttribute('aria-label', this.options.isSubmenu ? 'Submenu' : 'Application menu');

        if (this.options.isSubmenu) {
            this.element.classList.add('app-menu-submenu');
        }

        // Position
        this.element.style.top = `${this.options.position.top}px`;
        this.element.style.left = `${this.options.position.left}px`;

        // Build menu items
        this.options.items.forEach((item, index) => {
            if (item.divider) {
                const divider = document.createElement('div');
                divider.className = 'app-menu-divider';
                divider.setAttribute('role', 'separator');
                this.element.appendChild(divider);
            } else {
                const menuItem = new MenuItem({
                    ...item,
                    onAction: this.options.onAction,
                    onSubmenuOpen: (submenuItems, itemElement) => {
                        this.openSubmenu(submenuItems, itemElement);
                    },
                    onSubmenuClose: () => {
                        this.closeSubmenu();
                    }
                });
                this.menuItems.push(menuItem);
                this.element.appendChild(menuItem.element);
            }
        });

        // Add keyboard navigation
        this.element.addEventListener('keydown', (e) => this.handleKeydown(e));

        document.body.appendChild(this.element);

        // Animate in
        requestAnimationFrame(() => {
            this.element.classList.add('visible');
        });

        // Adjust position if off-screen
        this.adjustPosition();
    }

    adjustPosition() {
        const rect = this.element.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        // Check right edge
        if (rect.right > viewportWidth - 8) {
            if (this.options.isSubmenu) {
                // Flip to left side for submenus
                const parentRect = this.options.parentItem.getBoundingClientRect();
                this.element.style.left = `${parentRect.left - rect.width}px`;
            } else {
                this.element.style.left = `${viewportWidth - rect.width - 8}px`;
            }
        }

        // Check bottom edge
        if (rect.bottom > viewportHeight - 8) {
            const newTop = Math.max(8, viewportHeight - rect.height - 8);
            this.element.style.top = `${newTop}px`;
        }
    }

    openSubmenu(items, parentElement) {
        // Close existing submenu
        this.closeSubmenu();

        const parentRect = parentElement.getBoundingClientRect();

        this.activeSubmenu = new MenuDropdown({
            items,
            position: {
                top: parentRect.top,
                left: parentRect.right + 2
            },
            onClose: this.options.onClose,
            onAction: this.options.onAction,
            isSubmenu: true,
            parentItem: parentElement
        });
    }

    closeSubmenu() {
        if (this.activeSubmenu) {
            this.activeSubmenu.destroy();
            this.activeSubmenu = null;
        }
    }

    handleKeydown(e) {
        const focusableItems = this.menuItems.filter(item => !item.options.disabled);

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                this.focusNext(focusableItems);
                break;

            case 'ArrowUp':
                e.preventDefault();
                this.focusPrevious(focusableItems);
                break;

            case 'ArrowRight':
                e.preventDefault();
                if (this.focusedIndex >= 0 && focusableItems[this.focusedIndex]?.options.submenu) {
                    focusableItems[this.focusedIndex].openSubmenu();
                }
                break;

            case 'ArrowLeft':
                e.preventDefault();
                if (this.options.isSubmenu) {
                    this.options.onClose();
                }
                break;

            case 'Enter':
            case ' ':
                e.preventDefault();
                if (this.focusedIndex >= 0) {
                    focusableItems[this.focusedIndex].activate();
                }
                break;

            case 'Home':
                e.preventDefault();
                this.focusedIndex = 0;
                focusableItems[0]?.focus();
                break;

            case 'End':
                e.preventDefault();
                this.focusedIndex = focusableItems.length - 1;
                focusableItems[this.focusedIndex]?.focus();
                break;

            default:
                // Type-ahead: jump to item starting with letter
                if (e.key.length === 1 && /[a-zA-Z]/.test(e.key)) {
                    const char = e.key.toLowerCase();
                    const startIndex = this.focusedIndex + 1;
                    for (let i = 0; i < focusableItems.length; i++) {
                        const index = (startIndex + i) % focusableItems.length;
                        const label = focusableItems[index].options.label.toLowerCase();
                        if (label.startsWith(char)) {
                            this.focusedIndex = index;
                            focusableItems[index].focus();
                            break;
                        }
                    }
                }
        }
    }

    focusNext(items) {
        if (items.length === 0) return;
        this.focusedIndex = (this.focusedIndex + 1) % items.length;
        items[this.focusedIndex].focus();
    }

    focusPrevious(items) {
        if (items.length === 0) return;
        this.focusedIndex = this.focusedIndex <= 0 ? items.length - 1 : this.focusedIndex - 1;
        items[this.focusedIndex].focus();
    }

    destroy() {
        this.closeSubmenu();
        if (this.element) {
            this.element.classList.remove('visible');
            // Wait for animation before removing
            setTimeout(() => {
                this.element.remove();
            }, 100);
        }
    }
}
