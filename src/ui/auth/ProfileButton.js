/**
 * User Profile Button Component
 * 
 * Shows user avatar/initials when signed in, or sign-in button when not.
 * Displays dropdown menu with profile info and sign-out option.
 * 
 * @module ui/auth/ProfileButton
 */

import { store } from '../../core/Store.js';
import { authService } from '../../core/auth/AuthService.js';
import { tokenStorage } from '../../core/auth/storage/TokenStorage.js';

export class ProfileButton {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.warn(`ProfileButton: Container #${containerId} not found`);
            return;
        }

        this.isOpen = false;
        this.createButton();
        this.createDropdown();
        this.bindEvents();
        this.updateState();
    }

    createButton() {
        this.button = document.createElement('button');
        this.button.className = 'profile-button';
        this.button.setAttribute('aria-label', 'User profile');
        this.button.innerHTML = this.getButtonContent();
        this.container.appendChild(this.button);
    }

    createDropdown() {
        this.dropdown = document.createElement('div');
        this.dropdown.className = 'profile-dropdown';
        this.dropdown.style.display = 'none';
        this.container.appendChild(this.dropdown);
    }

    getButtonContent() {
        const user = tokenStorage.getUserProfile();
        
        if (user) {
            if (user.avatar) {
                return `<img src="${user.avatar}" alt="${user.name}" class="profile-avatar" />`;
            } else {
                const initials = this.getInitials(user.name);
                return `<span class="profile-initials">${initials}</span>`;
            }
        } else {
            return `<i class="fa-solid fa-user"></i>`;
        }
    }

    getInitials(name) {
        if (!name) return '?';
        const parts = name.trim().split(' ');
        if (parts.length === 1) {
            return parts[0].charAt(0).toUpperCase();
        }
        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    }

    renderDropdown() {
        const user = tokenStorage.getUserProfile();
        const isAuthenticated = tokenStorage.isAuthenticated();

        if (isAuthenticated && user) {
            this.dropdown.innerHTML = `
                <div class="profile-dropdown-header">
                    <div class="profile-dropdown-avatar">
                        ${user.avatar 
                            ? `<img src="${user.avatar}" alt="${user.name}" />` 
                            : `<span class="profile-initials-large">${this.getInitials(user.name)}</span>`
                        }
                    </div>
                    <div class="profile-dropdown-info">
                        <span class="profile-dropdown-name">${user.name}</span>
                        <span class="profile-dropdown-email">${user.email}</span>
                    </div>
                </div>
                <div class="profile-dropdown-divider"></div>
                <button class="profile-dropdown-item" data-action="settings">
                    <i class="fa-solid fa-gear"></i>
                    <span>Settings</span>
                </button>
                <button class="profile-dropdown-item" data-action="signout">
                    <i class="fa-solid fa-right-from-bracket"></i>
                    <span>Sign out</span>
                </button>
            `;
        } else {
            this.dropdown.innerHTML = `
                <div class="profile-dropdown-header">
                    <div class="profile-dropdown-info">
                        <span class="profile-dropdown-name">Guest</span>
                        <span class="profile-dropdown-email">Not signed in</span>
                    </div>
                </div>
                <div class="profile-dropdown-divider"></div>
                <button class="profile-dropdown-item profile-dropdown-item-primary" data-action="signin">
                    <i class="fa-solid fa-right-to-bracket"></i>
                    <span>Sign in</span>
                </button>
            `;
        }
    }

    bindEvents() {
        // Toggle dropdown
        this.button.onclick = (e) => {
            e.stopPropagation();
            this.toggleDropdown();
        };

        // Close on outside click
        document.addEventListener('click', (e) => {
            if (this.isOpen && !this.dropdown.contains(e.target)) {
                this.closeDropdown();
            }
        });

        // Dropdown actions
        this.dropdown.addEventListener('click', (e) => {
            const actionEl = e.target.closest('[data-action]');
            if (!actionEl) return;

            const action = actionEl.dataset.action;
            this.handleAction(action);
        });

        // Listen for auth changes
        store.on('auth-changed', () => {
            this.updateState();
        });

        // Listen for token changes from other tabs
        tokenStorage.onChange(() => {
            this.updateState();
        });
    }

    handleAction(action) {
        this.closeDropdown();

        switch (action) {
            case 'signin':
                // Dispatch event for main app to handle
                window.dispatchEvent(new CustomEvent('story:show-signin'));
                break;
            case 'signout':
                authService.logout();
                break;
            case 'settings':
                // Open settings modal
                window.dispatchEvent(new CustomEvent('story:show-settings'));
                break;
        }
    }

    toggleDropdown() {
        if (this.isOpen) {
            this.closeDropdown();
        } else {
            this.openDropdown();
        }
    }

    openDropdown() {
        this.renderDropdown();
        this.dropdown.style.display = 'block';
        this.isOpen = true;
        this.button.classList.add('active');
    }

    closeDropdown() {
        this.dropdown.style.display = 'none';
        this.isOpen = false;
        this.button.classList.remove('active');
    }

    updateState() {
        this.button.innerHTML = this.getButtonContent();
        
        if (tokenStorage.isAuthenticated()) {
            this.button.classList.add('authenticated');
        } else {
            this.button.classList.remove('authenticated');
        }
    }
}
