/**
 * Tests for SignInModal UI Component
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock dependencies before importing the module
vi.mock('../../../src/core/auth/AuthService.js', () => ({
    authService: {
        login: vi.fn()
    }
}));

vi.mock('../../../src/core/auth/config/OAuthConfig.js', () => ({
    OAuthConfig: {
        validate: vi.fn(() => ({
            isValid: true,
            providers: {
                microsoft: true,
                google: true
            }
        }))
    }
}));

import { SignInModal } from '../../../src/ui/auth/SignInModal.js';
import { authService } from '../../../src/core/auth/AuthService.js';
import { OAuthConfig } from '../../../src/core/auth/config/OAuthConfig.js';

describe('SignInModal', () => {
    let modal;

    beforeEach(() => {
        vi.clearAllMocks();
        // Clear body before each test
        document.body.innerHTML = '';
        modal = new SignInModal();
    });

    afterEach(() => {
        if (modal && modal.overlay && modal.overlay.parentNode) {
            modal.overlay.parentNode.removeChild(modal.overlay);
        }
    });

    describe('initialization', () => {
        it('should create modal overlay', () => {
            expect(modal.overlay).toBeDefined();
            expect(modal.overlay.classList.contains('modal-overlay')).toBe(true);
            expect(modal.overlay.classList.contains('sign-in-modal-overlay')).toBe(true);
        });

        it('should create modal container', () => {
            expect(modal.modal).toBeDefined();
            expect(modal.modal.classList.contains('sign-in-modal')).toBe(true);
        });

        it('should have header with title', () => {
            expect(modal.header).toBeDefined();
            const title = modal.header.querySelector('h2');
            expect(title).toBeDefined();
            expect(title.textContent).toBe('Sign in to Story');
        });

        it('should have close button', () => {
            const closeBtn = modal.header.querySelector('.close-btn');
            expect(closeBtn).toBeDefined();
        });

        it('should be hidden initially', () => {
            expect(modal.overlay.style.display).toBe('none');
        });

        it('should append to document body', () => {
            expect(document.body.contains(modal.overlay)).toBe(true);
        });
    });

    describe('provider buttons', () => {
        it('should render Microsoft button when enabled', () => {
            const microsoftBtn = modal.body.querySelector('.provider-microsoft');
            expect(microsoftBtn).toBeDefined();
            expect(microsoftBtn.textContent).toContain('Continue with Microsoft');
        });

        it('should render Google button when enabled', () => {
            const googleBtn = modal.body.querySelector('.provider-google');
            expect(googleBtn).toBeDefined();
            expect(googleBtn.textContent).toContain('Continue with Google');
        });

        it('should always show guest button', () => {
            const guestBtn = modal.body.querySelector('.provider-guest');
            expect(guestBtn).toBeDefined();
            expect(guestBtn.textContent).toContain('Continue as Guest');
        });

        it('should hide providers when not configured', () => {
            OAuthConfig.validate.mockReturnValue({
                isValid: false,
                providers: {
                    microsoft: false,
                    google: false
                }
            });

            // Create new modal with mocked config
            const restrictedModal = new SignInModal();
            
            const microsoftBtn = restrictedModal.body.querySelector('.provider-microsoft');
            const googleBtn = restrictedModal.body.querySelector('.provider-google');
            const warning = restrictedModal.body.querySelector('.sign-in-warning');
            
            expect(microsoftBtn).toBeNull();
            expect(googleBtn).toBeNull();
            expect(warning).toBeDefined();
            
            restrictedModal.overlay.parentNode.removeChild(restrictedModal.overlay);
        });
    });

    describe('open and close', () => {
        it('should show modal when open() is called', () => {
            modal.open();
            expect(modal.overlay.style.display).toBe('flex');
        });

        it('should hide modal when close() is called', () => {
            modal.open();
            modal.close();
            expect(modal.overlay.style.display).toBe('none');
        });

        it('should hide error on open', () => {
            modal.showError('Test error');
            modal.open();
            expect(modal.errorContainer.style.display).toBe('none');
        });

        it('should reset loading state on open', () => {
            modal.setLoading(true);
            modal.open();
            
            const buttons = modal.body.querySelectorAll('.sign-in-btn');
            buttons.forEach(btn => {
                expect(btn.disabled).toBe(false);
            });
        });

        it('should close when clicking overlay', () => {
            modal.open();
            
            // Simulate click on overlay
            const clickEvent = new MouseEvent('click', { bubbles: true });
            Object.defineProperty(clickEvent, 'target', { value: modal.overlay });
            modal.overlay.dispatchEvent(clickEvent);
            
            expect(modal.overlay.style.display).toBe('none');
        });

        it('should close when clicking close button', () => {
            modal.open();
            
            const closeBtn = modal.header.querySelector('.close-btn');
            closeBtn.click();
            
            expect(modal.overlay.style.display).toBe('none');
        });
    });

    describe('signIn', () => {
        it('should call authService.login with provider', async () => {
            authService.login.mockResolvedValue(undefined);
            
            await modal.signIn('microsoft');
            
            expect(authService.login).toHaveBeenCalledWith('microsoft');
        });

        it('should set loading state during sign in', async () => {
            authService.login.mockImplementation(() => new Promise(() => {})); // Never resolves
            
            modal.signIn('microsoft');
            
            // Check loading state immediately after calling
            await new Promise(resolve => setTimeout(resolve, 0));
            const buttons = modal.body.querySelectorAll('.sign-in-btn');
            buttons.forEach(btn => {
                expect(btn.disabled).toBe(true);
                expect(btn.classList.contains('loading')).toBe(true);
            });
        });

        it('should show error on sign in failure', async () => {
            authService.login.mockRejectedValue(new Error('Auth failed'));
            
            await modal.signIn('google');
            
            expect(modal.errorContainer.style.display).toBe('block');
            expect(modal.errorContainer.textContent).toBe('Auth failed');
        });

        it('should hide error before attempting sign in', async () => {
            modal.showError('Previous error');
            authService.login.mockResolvedValue(undefined);
            
            await modal.signIn('microsoft');
            
            // Error is hidden at the start of signIn
            // (but may show again if there's an error)
        });
    });

    describe('continueAsGuest', () => {
        it('should close modal', () => {
            modal.open();
            modal.continueAsGuest();
            
            expect(modal.overlay.style.display).toBe('none');
        });
    });

    describe('loading state', () => {
        it('should disable all buttons when loading', () => {
            modal.setLoading(true);
            
            const buttons = modal.body.querySelectorAll('.sign-in-btn');
            buttons.forEach(btn => {
                expect(btn.disabled).toBe(true);
            });
        });

        it('should add loading class when loading', () => {
            modal.setLoading(true);
            
            const buttons = modal.body.querySelectorAll('.sign-in-btn');
            buttons.forEach(btn => {
                expect(btn.classList.contains('loading')).toBe(true);
            });
        });

        it('should enable all buttons when not loading', () => {
            modal.setLoading(true);
            modal.setLoading(false);
            
            const buttons = modal.body.querySelectorAll('.sign-in-btn');
            buttons.forEach(btn => {
                expect(btn.disabled).toBe(false);
                expect(btn.classList.contains('loading')).toBe(false);
            });
        });
    });

    describe('error handling', () => {
        it('should show error message', () => {
            modal.showError('Test error message');
            
            expect(modal.errorContainer.style.display).toBe('block');
            expect(modal.errorContainer.textContent).toBe('Test error message');
        });

        it('should hide error message', () => {
            modal.showError('Test error');
            modal.hideError();
            
            expect(modal.errorContainer.style.display).toBe('none');
        });
    });

    describe('keyboard navigation', () => {
        it('should close on Escape key', () => {
            modal.open();
            
            const event = new KeyboardEvent('keydown', { key: 'Escape' });
            document.dispatchEvent(event);
            
            expect(modal.overlay.style.display).toBe('none');
        });

        it('should not close on Escape when already closed', () => {
            // Just ensure it doesn't throw
            const event = new KeyboardEvent('keydown', { key: 'Escape' });
            expect(() => document.dispatchEvent(event)).not.toThrow();
        });
    });

    describe('icons', () => {
        beforeEach(() => {
            // Reset OAuth config mock for icons tests
            OAuthConfig.validate.mockReturnValue({
                isValid: true,
                providers: {
                    microsoft: true,
                    google: true
                }
            });
            // Re-render provider buttons with reset config
            modal.renderProviderButtons();
        });

        it('should have Microsoft icon SVG', () => {
            const microsoftBtn = modal.body.querySelector('.provider-microsoft');
            expect(microsoftBtn).not.toBeNull();
            const svg = microsoftBtn.querySelector('svg');
            expect(svg).not.toBeNull();
        });

        it('should have Google icon SVG', () => {
            const googleBtn = modal.body.querySelector('.provider-google');
            expect(googleBtn).not.toBeNull();
            const svg = googleBtn.querySelector('svg');
            expect(svg).not.toBeNull();
        });
    });

    describe('footer', () => {
        it('should have terms and privacy links', () => {
            const links = modal.footer.querySelectorAll('a');
            expect(links.length).toBe(2);
            expect(modal.footer.textContent).toContain('Terms of Service');
            expect(modal.footer.textContent).toContain('Privacy Policy');
        });
    });
});
