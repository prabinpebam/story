/**
 * Tests for ProfileButton UI Component
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock dependencies before importing the module
vi.mock('../../../src/core/Store.js', () => ({
    store: {
        on: vi.fn(),
        off: vi.fn()
    }
}));

vi.mock('../../../src/core/auth/AuthService.js', () => ({
    authService: {
        logout: vi.fn()
    }
}));

vi.mock('../../../src/core/auth/storage/TokenStorage.js', () => ({
    tokenStorage: {
        getUserProfile: vi.fn(),
        isAuthenticated: vi.fn(),
        onChange: vi.fn()
    }
}));

import { ProfileButton } from '../../../src/ui/auth/ProfileButton.js';
import { store } from '../../../src/core/Store.js';
import { authService } from '../../../src/core/auth/AuthService.js';
import { tokenStorage } from '../../../src/core/auth/storage/TokenStorage.js';

// Mock window event methods
const mockEventListeners = new Map();
vi.stubGlobal('window', {
    ...global.window,
    dispatchEvent: vi.fn((event) => {
        const handlers = mockEventListeners.get(event.type) || [];
        handlers.forEach(h => h(event));
    }),
    addEventListener: vi.fn((type, handler) => {
        if (!mockEventListeners.has(type)) {
            mockEventListeners.set(type, []);
        }
        mockEventListeners.get(type).push(handler);
    }),
    removeEventListener: vi.fn((type, handler) => {
        if (mockEventListeners.has(type)) {
            const handlers = mockEventListeners.get(type);
            const index = handlers.indexOf(handler);
            if (index > -1) handlers.splice(index, 1);
        }
    })
});

describe('ProfileButton', () => {
    let profileButton;
    let container;

    beforeEach(() => {
        vi.clearAllMocks();
        mockEventListeners.clear();
        
        // Create container
        document.body.innerHTML = '<div id="profile-container"></div>';
        container = document.getElementById('profile-container');
        
        // Default mock values
        tokenStorage.getUserProfile.mockReturnValue(null);
        tokenStorage.isAuthenticated.mockReturnValue(false);
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    describe('initialization', () => {
        it('should create button in container', () => {
            profileButton = new ProfileButton('profile-container');
            
            const button = container.querySelector('.profile-button');
            expect(button).toBeDefined();
        });

        it('should create dropdown element', () => {
            profileButton = new ProfileButton('profile-container');
            
            const dropdown = container.querySelector('.profile-dropdown');
            expect(dropdown).toBeDefined();
        });

        it('should have dropdown hidden initially', () => {
            profileButton = new ProfileButton('profile-container');
            
            expect(profileButton.dropdown.style.display).toBe('none');
            expect(profileButton.isOpen).toBe(false);
        });

        it('should warn if container not found', () => {
            const warnSpy = vi.spyOn(console, 'warn');
            
            new ProfileButton('non-existent-container');
            
            expect(warnSpy).toHaveBeenCalledWith(
                'ProfileButton: Container #non-existent-container not found'
            );
        });

        it('should subscribe to auth changes', () => {
            profileButton = new ProfileButton('profile-container');
            
            expect(store.on).toHaveBeenCalledWith('auth-changed', expect.any(Function));
        });

        it('should subscribe to token changes', () => {
            profileButton = new ProfileButton('profile-container');
            
            expect(tokenStorage.onChange).toHaveBeenCalledWith(expect.any(Function));
        });
    });

    describe('button display - unauthenticated', () => {
        it('should show user icon when not authenticated', () => {
            profileButton = new ProfileButton('profile-container');
            
            const icon = profileButton.button.querySelector('i.fa-solid.fa-user');
            expect(icon).toBeDefined();
        });

        it('should not have authenticated class', () => {
            profileButton = new ProfileButton('profile-container');
            
            expect(profileButton.button.classList.contains('authenticated')).toBe(false);
        });
    });

    describe('button display - authenticated with avatar', () => {
        beforeEach(() => {
            tokenStorage.getUserProfile.mockReturnValue({
                name: 'John Doe',
                email: 'john@example.com',
                avatar: 'https://example.com/avatar.jpg'
            });
            tokenStorage.isAuthenticated.mockReturnValue(true);
        });

        it('should show avatar image', () => {
            profileButton = new ProfileButton('profile-container');
            
            const avatar = profileButton.button.querySelector('.profile-avatar');
            expect(avatar).toBeDefined();
            expect(avatar.src).toBe('https://example.com/avatar.jpg');
        });

        it('should have authenticated class', () => {
            profileButton = new ProfileButton('profile-container');
            
            expect(profileButton.button.classList.contains('authenticated')).toBe(true);
        });
    });

    describe('button display - authenticated without avatar', () => {
        beforeEach(() => {
            tokenStorage.getUserProfile.mockReturnValue({
                name: 'John Doe',
                email: 'john@example.com',
                avatar: null
            });
            tokenStorage.isAuthenticated.mockReturnValue(true);
        });

        it('should show initials', () => {
            profileButton = new ProfileButton('profile-container');
            
            const initials = profileButton.button.querySelector('.profile-initials');
            expect(initials).toBeDefined();
            expect(initials.textContent).toBe('JD');
        });
    });

    describe('getInitials', () => {
        beforeEach(() => {
            profileButton = new ProfileButton('profile-container');
        });

        it('should return first and last initials', () => {
            expect(profileButton.getInitials('John Doe')).toBe('JD');
        });

        it('should return single initial for single name', () => {
            expect(profileButton.getInitials('John')).toBe('J');
        });

        it('should handle multiple names', () => {
            expect(profileButton.getInitials('John Michael Doe')).toBe('JD');
        });

        it('should return ? for empty name', () => {
            expect(profileButton.getInitials('')).toBe('?');
        });

        it('should return ? for null/undefined', () => {
            expect(profileButton.getInitials(null)).toBe('?');
            expect(profileButton.getInitials(undefined)).toBe('?');
        });

        it('should handle lowercase names', () => {
            expect(profileButton.getInitials('john doe')).toBe('JD');
        });
    });

    describe('dropdown - unauthenticated', () => {
        beforeEach(() => {
            tokenStorage.getUserProfile.mockReturnValue(null);
            tokenStorage.isAuthenticated.mockReturnValue(false);
            profileButton = new ProfileButton('profile-container');
        });

        it('should show Guest text', () => {
            profileButton.openDropdown();
            
            expect(profileButton.dropdown.textContent).toContain('Guest');
            expect(profileButton.dropdown.textContent).toContain('Not signed in');
        });

        it('should show sign in button', () => {
            profileButton.openDropdown();
            
            const signInBtn = profileButton.dropdown.querySelector('[data-action="signin"]');
            expect(signInBtn).toBeDefined();
            expect(signInBtn.textContent).toContain('Sign in');
        });

        it('should not show sign out button', () => {
            profileButton.openDropdown();
            
            const signOutBtn = profileButton.dropdown.querySelector('[data-action="signout"]');
            expect(signOutBtn).toBeNull();
        });
    });

    describe('dropdown - authenticated', () => {
        beforeEach(() => {
            tokenStorage.getUserProfile.mockReturnValue({
                name: 'John Doe',
                email: 'john@example.com',
                avatar: 'https://example.com/avatar.jpg'
            });
            tokenStorage.isAuthenticated.mockReturnValue(true);
            profileButton = new ProfileButton('profile-container');
        });

        it('should show user name and email', () => {
            profileButton.openDropdown();
            
            expect(profileButton.dropdown.textContent).toContain('John Doe');
            expect(profileButton.dropdown.textContent).toContain('john@example.com');
        });

        it('should show avatar in dropdown', () => {
            profileButton.openDropdown();
            
            const avatar = profileButton.dropdown.querySelector('img');
            expect(avatar).toBeDefined();
            expect(avatar.src).toBe('https://example.com/avatar.jpg');
        });

        it('should show sign out button', () => {
            profileButton.openDropdown();
            
            const signOutBtn = profileButton.dropdown.querySelector('[data-action="signout"]');
            expect(signOutBtn).toBeDefined();
            expect(signOutBtn.textContent).toContain('Sign out');
        });

        it('should show settings button', () => {
            profileButton.openDropdown();
            
            const settingsBtn = profileButton.dropdown.querySelector('[data-action="settings"]');
            expect(settingsBtn).toBeDefined();
            expect(settingsBtn.textContent).toContain('Settings');
        });

        it('should not show sign in button', () => {
            profileButton.openDropdown();
            
            const signInBtn = profileButton.dropdown.querySelector('[data-action="signin"]');
            expect(signInBtn).toBeNull();
        });
    });

    describe('dropdown toggle', () => {
        beforeEach(() => {
            profileButton = new ProfileButton('profile-container');
        });

        it('should open dropdown on button click', () => {
            profileButton.button.click();
            
            expect(profileButton.isOpen).toBe(true);
            expect(profileButton.dropdown.style.display).toBe('block');
        });

        it('should close dropdown on second button click', () => {
            profileButton.button.click();
            profileButton.button.click();
            
            expect(profileButton.isOpen).toBe(false);
            expect(profileButton.dropdown.style.display).toBe('none');
        });

        it('should add active class when open', () => {
            profileButton.openDropdown();
            
            expect(profileButton.button.classList.contains('active')).toBe(true);
        });

        it('should remove active class when closed', () => {
            profileButton.openDropdown();
            profileButton.closeDropdown();
            
            expect(profileButton.button.classList.contains('active')).toBe(false);
        });
    });

    describe('actions', () => {
        beforeEach(() => {
            profileButton = new ProfileButton('profile-container');
        });

        it('should dispatch show-signin event on sign in action', () => {
            profileButton.handleAction('signin');
            
            expect(window.dispatchEvent).toHaveBeenCalledWith(
                expect.objectContaining({ type: 'story:show-signin' })
            );
        });

        it('should call authService.logout on sign out action', () => {
            tokenStorage.isAuthenticated.mockReturnValue(true);
            
            profileButton.handleAction('signout');
            
            expect(authService.logout).toHaveBeenCalled();
        });

        it('should dispatch show-settings event on settings action', () => {
            profileButton.handleAction('settings');
            
            expect(window.dispatchEvent).toHaveBeenCalledWith(
                expect.objectContaining({ type: 'story:show-settings' })
            );
        });

        it('should close dropdown after action', () => {
            tokenStorage.isAuthenticated.mockReturnValue(true);
            profileButton.openDropdown();
            profileButton.handleAction('signout');
            
            expect(profileButton.isOpen).toBe(false);
        });
    });

    describe('updateState', () => {
        it('should update button content on state change', () => {
            profileButton = new ProfileButton('profile-container');
            
            // Initially unauthenticated
            expect(profileButton.button.querySelector('i.fa-solid.fa-user')).toBeDefined();
            
            // Simulate authentication
            tokenStorage.getUserProfile.mockReturnValue({
                name: 'Jane Doe',
                email: 'jane@example.com'
            });
            tokenStorage.isAuthenticated.mockReturnValue(true);
            
            profileButton.updateState();
            
            const initials = profileButton.button.querySelector('.profile-initials');
            expect(initials).toBeDefined();
            expect(initials.textContent).toBe('JD');
        });

        it('should add authenticated class when authenticated', () => {
            profileButton = new ProfileButton('profile-container');
            
            tokenStorage.isAuthenticated.mockReturnValue(true);
            profileButton.updateState();
            
            expect(profileButton.button.classList.contains('authenticated')).toBe(true);
        });

        it('should remove authenticated class when not authenticated', () => {
            tokenStorage.isAuthenticated.mockReturnValue(true);
            profileButton = new ProfileButton('profile-container');
            
            tokenStorage.isAuthenticated.mockReturnValue(false);
            tokenStorage.getUserProfile.mockReturnValue(null);
            profileButton.updateState();
            
            expect(profileButton.button.classList.contains('authenticated')).toBe(false);
        });
    });

    describe('accessibility', () => {
        it('should have aria-label on button', () => {
            profileButton = new ProfileButton('profile-container');
            
            expect(profileButton.button.getAttribute('aria-label')).toBe('User profile');
        });
    });
});
