/**
 * Sign In Modal Component
 * 
 * Modal for user authentication with OAuth providers.
 * Follows the design system and existing modal patterns.
 * 
 * @module ui/auth/SignInModal
 */

import { authService } from '../../core/auth/AuthService.js';
import { OAuthConfig } from '../../core/auth/config/OAuthConfig.js';

export class SignInModal {
    constructor() {
        this.createModal();
        this.bindEvents();
    }

    createModal() {
        this.overlay = document.createElement('div');
        this.overlay.className = 'modal-overlay sign-in-modal-overlay';
        this.overlay.style.display = 'none';

        this.modal = document.createElement('div');
        this.modal.className = 'sign-in-modal';

        // Header with close button
        this.header = document.createElement('div');
        this.header.className = 'sign-in-modal-header';
        this.header.innerHTML = `
            <div class="sign-in-modal-title">
                <h2>Sign in to Story</h2>
                <p class="sign-in-modal-subtitle">Save and sync your presentations</p>
            </div>
            <button class="close-btn" aria-label="Close">
                <i class="fa-solid fa-xmark"></i>
            </button>
        `;

        // Body with provider buttons
        this.body = document.createElement('div');
        this.body.className = 'sign-in-modal-body';

        // Create provider buttons
        this.renderProviderButtons();

        // Footer with terms
        this.footer = document.createElement('div');
        this.footer.className = 'sign-in-modal-footer';
        this.footer.innerHTML = `
            <p class="sign-in-terms">
                By signing in, you agree to our 
                <a href="#" class="link">Terms of Service</a> and 
                <a href="#" class="link">Privacy Policy</a>
            </p>
        `;

        // Error message container
        this.errorContainer = document.createElement('div');
        this.errorContainer.className = 'sign-in-error';
        this.errorContainer.style.display = 'none';

        this.modal.appendChild(this.header);
        this.modal.appendChild(this.errorContainer);
        this.modal.appendChild(this.body);
        this.modal.appendChild(this.footer);
        this.overlay.appendChild(this.modal);

        document.body.appendChild(this.overlay);
    }

    renderProviderButtons() {
        this.body.innerHTML = '';

        const validation = OAuthConfig.validate();

        // Microsoft Button
        if (validation.providers.microsoft) {
            const microsoftBtn = this.createProviderButton({
                provider: 'microsoft',
                label: 'Continue with Microsoft',
                icon: this.getMicrosoftIcon(),
                className: 'provider-microsoft'
            });
            this.body.appendChild(microsoftBtn);
        }

        // Google Button
        if (validation.providers.google) {
            const googleBtn = this.createProviderButton({
                provider: 'google',
                label: 'Continue with Google',
                icon: this.getGoogleIcon(),
                className: 'provider-google'
            });
            this.body.appendChild(googleBtn);
        }

        // Divider
        if (validation.providers.microsoft || validation.providers.google) {
            const divider = document.createElement('div');
            divider.className = 'sign-in-divider';
            divider.innerHTML = '<span>or</span>';
            this.body.appendChild(divider);
        }

        // Guest mode button
        const guestBtn = document.createElement('button');
        guestBtn.className = 'sign-in-btn provider-guest';
        guestBtn.innerHTML = `
            <i class="fa-solid fa-user"></i>
            <span>Continue as Guest</span>
        `;
        guestBtn.onclick = () => this.continueAsGuest();
        this.body.appendChild(guestBtn);

        // No providers configured warning
        if (!validation.isValid) {
            const warning = document.createElement('div');
            warning.className = 'sign-in-warning';
            warning.innerHTML = `
                <i class="fa-solid fa-exclamation-triangle"></i>
                <span>Sign-in providers not configured</span>
            `;
            this.body.insertBefore(warning, this.body.firstChild);
        }
    }

    createProviderButton({ provider, label, icon, className }) {
        const button = document.createElement('button');
        button.className = `sign-in-btn ${className}`;
        button.innerHTML = `
            ${icon}
            <span>${label}</span>
        `;
        button.onclick = () => this.signIn(provider);
        return button;
    }

    getMicrosoftIcon() {
        return `<svg class="provider-icon" viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg">
            <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
            <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
            <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
            <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
        </svg>`;
    }

    getGoogleIcon() {
        return `<svg class="provider-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>`;
    }

    async signIn(provider) {
        this.setLoading(true);
        this.hideError();

        try {
            await authService.login(provider);
            // User will be redirected to OAuth provider
        } catch (error) {
            console.error('Sign in failed:', error);
            this.showError(error.message || 'Failed to start sign in');
            this.setLoading(false);
        }
    }

    continueAsGuest() {
        this.close();
        // Guest mode - no auth required
    }

    setLoading(loading) {
        const buttons = this.body.querySelectorAll('.sign-in-btn');
        buttons.forEach(btn => {
            btn.disabled = loading;
            if (loading) {
                btn.classList.add('loading');
            } else {
                btn.classList.remove('loading');
            }
        });
    }

    showError(message) {
        this.errorContainer.textContent = message;
        this.errorContainer.style.display = 'block';
    }

    hideError() {
        this.errorContainer.style.display = 'none';
    }

    bindEvents() {
        this.header.querySelector('.close-btn').onclick = () => this.close();
        this.overlay.onclick = (e) => {
            if (e.target === this.overlay) this.close();
        };

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (this.overlay.style.display !== 'none' && e.key === 'Escape') {
                this.close();
            }
        });
    }

    open() {
        this.hideError();
        this.setLoading(false);
        this.overlay.style.display = 'flex';
        
        // Focus first provider button for accessibility
        const firstBtn = this.body.querySelector('.sign-in-btn');
        if (firstBtn) {
            firstBtn.focus();
        }
    }

    close() {
        this.overlay.style.display = 'none';
    }
}
