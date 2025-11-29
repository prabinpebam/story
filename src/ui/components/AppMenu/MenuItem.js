/**
 * MenuItem - Individual menu item component
 * 
 * Supports regular items, items with submenus, disabled state,
 * and keyboard shortcuts display.
 */

export class MenuItem {
    constructor(options) {
        this.options = {
            id: '',
            label: '',
            shortcut: null,
            icon: null,
            disabled: false,
            checked: false,
            submenu: null,
            onAction: () => {},
            onSubmenuOpen: () => {},
            onSubmenuClose: () => {},
            ...options
        };

        this.element = null;
        this.submenuTimeout = null;
        this.isSubmenuOpen = false;

        this.create();
    }

    create() {
        this.element = document.createElement('div');
        this.element.className = 'app-menu-item';
        this.element.setAttribute('role', 'menuitem');
        this.element.setAttribute('tabindex', '-1');

        if (this.options.disabled) {
            this.element.classList.add('disabled');
            this.element.setAttribute('aria-disabled', 'true');
        }

        if (this.options.checked) {
            this.element.classList.add('checked');
        }

        if (this.options.submenu) {
            this.element.setAttribute('aria-haspopup', 'true');
            this.element.setAttribute('aria-expanded', 'false');
        }

        // Build inner content
        let html = '';

        // Icon or checkmark space
        html += '<span class="app-menu-item-icon">';
        if (this.options.checked) {
            html += '<i class="fa-solid fa-check"></i>';
        } else if (this.options.icon) {
            html += `<i class="${this.options.icon}"></i>`;
        }
        html += '</span>';

        // Label
        html += `<span class="app-menu-item-label">${this.options.label}</span>`;

        // Shortcut or submenu arrow
        if (this.options.submenu) {
            html += `<span class="app-menu-item-arrow">
                <svg width="6" height="10" viewBox="0 0 6 10" fill="none">
                    <path d="M1 1L5 5L1 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </span>`;
        } else if (this.options.shortcut) {
            html += `<span class="app-menu-item-shortcut">${this.formatShortcut(this.options.shortcut)}</span>`;
        }

        this.element.innerHTML = html;

        this.bindEvents();
    }

    formatShortcut(shortcut) {
        // Convert shortcut notation to display format
        // Handle both Mac and Windows
        const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
        
        return shortcut
            .replace(/\$mod/g, isMac ? '⌘' : 'Ctrl')
            .replace(/Ctrl/g, isMac ? '⌘' : 'Ctrl')
            .replace(/Shift/g, isMac ? '⇧' : 'Shift')
            .replace(/Alt/g, isMac ? '⌥' : 'Alt')
            .replace(/\+/g, isMac ? '' : '+');
    }

    bindEvents() {
        // Click
        this.element.addEventListener('click', (e) => {
            e.stopPropagation();
            this.activate();
        });

        // Hover for submenus
        if (this.options.submenu) {
            this.element.addEventListener('mouseenter', () => {
                this.scheduleSubmenuOpen();
            });

            this.element.addEventListener('mouseleave', () => {
                this.cancelSubmenuOpen();
            });
        }
    }

    scheduleSubmenuOpen() {
        if (this.options.disabled) return;
        
        this.cancelSubmenuOpen();
        this.submenuTimeout = setTimeout(() => {
            this.openSubmenu();
        }, 150);
    }

    cancelSubmenuOpen() {
        if (this.submenuTimeout) {
            clearTimeout(this.submenuTimeout);
            this.submenuTimeout = null;
        }
    }

    openSubmenu() {
        if (!this.options.submenu || this.isSubmenuOpen) return;
        
        this.isSubmenuOpen = true;
        this.element.classList.add('submenu-open');
        this.element.setAttribute('aria-expanded', 'true');
        this.options.onSubmenuOpen(this.options.submenu, this.element);
    }

    closeSubmenu() {
        if (!this.isSubmenuOpen) return;
        
        this.isSubmenuOpen = false;
        this.element.classList.remove('submenu-open');
        this.element.setAttribute('aria-expanded', 'false');
        this.options.onSubmenuClose();
    }

    activate() {
        if (this.options.disabled) return;

        if (this.options.submenu) {
            this.openSubmenu();
        } else {
            this.options.onAction(this.options.id);
        }
    }

    focus() {
        this.element.focus();
        this.element.classList.add('focused');
    }

    blur() {
        this.element.classList.remove('focused');
    }
}
