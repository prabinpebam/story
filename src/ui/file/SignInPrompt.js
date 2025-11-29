/**
 * SignInPrompt - Authentication prompt for cloud features
 * 
 * Shown when user tries to access cloud storage without being signed in.
 * Offers sign-in options for Microsoft and Google.
 */

import { authService } from '../../core/auth/index.js';

export class SignInPrompt {
    /**
     * Create sign-in prompt
     * @param {Object} options
     * @param {string} options.message - Custom message (optional)
     * @param {Function} options.onSignIn - Called after successful sign-in
     * @param {Function} options.onCancel - Called when cancelled
     * @param {Function} options.onGuest - Called when continuing as guest
     */
    constructor(options = {}) {
        this.message = options.message || 'Sign in to save and open files from your cloud storage.';
        this.onSignIn = options.onSignIn || (() => {});
        this.onCancel = options.onCancel || (() => {});
        this.onGuest = options.onGuest || (() => {});
        
        /** @type {HTMLElement} */
        this.overlay = null;
        
        /** @type {HTMLElement} */
        this.modal = null;
        
        this.create();
    }
    
    create() {
        // Create overlay
        this.overlay = document.createElement('div');
        this.overlay.className = 'signin-prompt-overlay';
        
        // Create modal
        this.modal = document.createElement('div');
        this.modal.className = 'signin-prompt';
        this.modal.setAttribute('role', 'dialog');
        this.modal.setAttribute('aria-modal', 'true');
        this.modal.setAttribute('aria-labelledby', 'signin-prompt-title');
        
        this.modal.innerHTML = `
            <button class="signin-prompt__close" aria-label="Close">
                <i class="fa-solid fa-xmark"></i>
            </button>
            
            <div class="signin-prompt__icon">
                <i class="fa-solid fa-cloud"></i>
            </div>
            
            <h2 id="signin-prompt-title" class="signin-prompt__title">
                Sign in to access cloud storage
            </h2>
            
            <p class="signin-prompt__description">
                ${this.escapeHtml(this.message)}
            </p>
            
            <p class="signin-prompt__note">
                Your files will be encrypted by default for privacy.
            </p>
            
            <div class="signin-prompt__providers">
                <button class="signin-prompt__provider" data-provider="microsoft">
                    <div class="signin-prompt__provider-icon">
                        <svg viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg">
                            <rect width="9" height="9" fill="#f25022"/>
                            <rect x="11" width="9" height="9" fill="#7fba00"/>
                            <rect y="11" width="9" height="9" fill="#00a4ef"/>
                            <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
                        </svg>
                    </div>
                    <span class="signin-prompt__provider-text">
                        <span class="signin-prompt__provider-label">Sign in with</span>
                        <span class="signin-prompt__provider-name">Microsoft</span>
                    </span>
                </button>
                
                <button class="signin-prompt__provider" data-provider="google">
                    <div class="signin-prompt__provider-icon">
                        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                    </div>
                    <span class="signin-prompt__provider-text">
                        <span class="signin-prompt__provider-label">Sign in with</span>
                        <span class="signin-prompt__provider-name">Google</span>
                    </span>
                </button>
            </div>
            
            <button class="signin-prompt__guest">
                Continue as Guest
            </button>
        `;
        
        this.overlay.appendChild(this.modal);
        document.body.appendChild(this.overlay);
        
        this.bindEvents();
        
        // Focus first provider button
        requestAnimationFrame(() => {
            const firstBtn = this.modal.querySelector('.signin-prompt__provider');
            if (firstBtn) firstBtn.focus();
        });
    }
    
    bindEvents() {
        // Close button
        this.modal.querySelector('.signin-prompt__close').addEventListener('click', () => {
            this.close();
            this.onCancel();
        });
        
        // Overlay click
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) {
                this.close();
                this.onCancel();
            }
        });
        
        // Provider buttons
        this.modal.querySelectorAll('.signin-prompt__provider').forEach(btn => {
            btn.addEventListener('click', async () => {
                const provider = btn.dataset.provider;
                await this.handleSignIn(provider);
            });
        });
        
        // Guest button
        this.modal.querySelector('.signin-prompt__guest').addEventListener('click', () => {
            this.close();
            this.onGuest();
        });
        
        // Escape key
        document.addEventListener('keydown', this.handleKeyDown);
    }
    
    handleKeyDown = (e) => {
        if (e.key === 'Escape') {
            this.close();
            this.onCancel();
        }
    };
    
    /**
     * Handle sign-in with provider
     * @param {string} provider
     */
    async handleSignIn(provider) {
        try {
            // Show loading state
            const btn = this.modal.querySelector(`[data-provider="${provider}"]`);
            btn.classList.add('signin-prompt__provider--loading');
            btn.disabled = true;
            
            // Sign in
            await authService.signIn(provider);
            
            // Success
            this.close();
            this.onSignIn(provider);
        } catch (error) {
            console.error('Sign-in failed:', error);
            
            // Reset button
            const btn = this.modal.querySelector(`[data-provider="${provider}"]`);
            btn.classList.remove('signin-prompt__provider--loading');
            btn.disabled = false;
            
            // Show error (could use alertModal here)
            alert('Sign-in failed. Please try again.');
        }
    }
    
    /**
     * Escape HTML
     * @param {string} str
     * @returns {string}
     */
    escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
    
    /**
     * Close and destroy
     */
    close() {
        document.removeEventListener('keydown', this.handleKeyDown);
        
        if (this.overlay) {
            this.overlay.classList.add('signin-prompt-overlay--closing');
            setTimeout(() => {
                if (this.overlay) {
                    this.overlay.remove();
                    this.overlay = null;
                    this.modal = null;
                }
            }, 150);
        }
    }
    
    /**
     * Static method to show prompt and return promise
     * @param {Object} options
     * @returns {Promise<{action: 'signin'|'guest'|'cancel', provider?: string}>}
     */
    static show(options = {}) {
        return new Promise((resolve) => {
            new SignInPrompt({
                ...options,
                onSignIn: (provider) => resolve({ action: 'signin', provider }),
                onGuest: () => resolve({ action: 'guest' }),
                onCancel: () => resolve({ action: 'cancel' })
            });
        });
    }
}

export default SignInPrompt;
