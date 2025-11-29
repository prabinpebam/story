/**
 * AppMenu - Main application menu component
 * 
 * Provides dropdown menu access to all application functionality
 * from the Story logo in the sidebar header.
 */

import { store } from '../../../core/Store.js';
import { MenuDropdown } from './MenuDropdown.js';
import { getMenuConfig } from './menuConfig.js';

export class AppMenu {
    constructor(containerId) {
        this.container = document.getElementById(containerId) || document.querySelector('.sidebar-header');
        this.isOpen = false;
        this.dropdown = null;
        
        this.init();
    }

    init() {
        this.createTrigger();
        this.bindEvents();
    }

    createTrigger() {
        // Replace existing logo with menu trigger
        const existingLogo = this.container.querySelector('.logo');
        if (existingLogo) {
            existingLogo.remove();
        }

        this.trigger = document.createElement('button');
        this.trigger.className = 'app-menu-trigger';
        this.trigger.setAttribute('aria-haspopup', 'true');
        this.trigger.setAttribute('aria-expanded', 'false');
        this.trigger.setAttribute('aria-label', 'Story application menu');

        this.trigger.innerHTML = `
            <img src="/assets/story.png" alt="" class="app-menu-logo" />
            <span class="app-menu-title">STORY</span>
            <svg class="app-menu-chevron" width="8" height="5" viewBox="0 0 8 5" fill="none">
                <path d="M1 1L4 4L7 1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        `;

        // Insert at beginning of container
        this.container.insertBefore(this.trigger, this.container.firstChild);
    }

    bindEvents() {
        // Toggle on click
        this.trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggle();
        });

        // Close on outside click
        document.addEventListener('mousedown', (e) => {
            if (this.isOpen && !this.trigger.contains(e.target) && 
                this.dropdown && !this.dropdown.element.contains(e.target)) {
                this.close();
            }
        });

        // Keyboard navigation
        this.trigger.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
                e.preventDefault();
                this.open();
            }
        });

        // Close on escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
                this.trigger.focus();
            }
        });
    }

    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    open() {
        if (this.isOpen) return;
        this.isOpen = true;

        this.trigger.classList.add('active');
        this.trigger.setAttribute('aria-expanded', 'true');

        // Get trigger position for dropdown
        const rect = this.trigger.getBoundingClientRect();

        // Create dropdown with dynamically generated config
        // This ensures cloud items reflect current auth state
        this.dropdown = new MenuDropdown({
            items: getMenuConfig(),
            position: {
                top: rect.bottom + 4,
                left: rect.left
            },
            onClose: () => this.close(),
            onAction: (action) => this.handleAction(action)
        });
    }

    close() {
        if (!this.isOpen) return;
        this.isOpen = false;

        this.trigger.classList.remove('active');
        this.trigger.setAttribute('aria-expanded', 'false');

        if (this.dropdown) {
            this.dropdown.destroy();
            this.dropdown = null;
        }
    }

    handleAction(action) {
        // Dispatch event for the action
        const event = new CustomEvent('story:menu-action', {
            detail: { action }
        });
        window.dispatchEvent(event);

        // Close menu after action
        this.close();
    }

    destroy() {
        this.close();
        if (this.trigger) {
            this.trigger.remove();
        }
    }
}
