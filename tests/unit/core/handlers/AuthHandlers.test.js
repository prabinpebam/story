/**
 * AuthHandlers Unit Tests
 * 
 * Tests the pure handler functions for authentication state management.
 * These handlers modify Immer draft state directly.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { produce } from '../../../../src/vendor/immer.js';
import {
    handleLoginStart,
    handleLoginSuccess,
    handleLoginFailure,
    handleLogout,
    handleUpdateProfile
} from '../../../../src/core/store/handlers/AuthHandlers.js';
import { createInitialState } from '../../../../src/core/store/InitialState.js';

describe('AuthHandlers', () => {
    let initialState;

    beforeEach(() => {
        initialState = createInitialState();
        // Ensure auth object exists with proper structure
        initialState = produce(initialState, draft => {
            if (!draft.auth) {
                draft.auth = {
                    isAuthenticated: false,
                    user: null,
                    loading: false,
                    error: null
                };
            }
        });
    });

    describe('handleLoginStart()', () => {
        it('should set loading to true', () => {
            const newState = produce(initialState, draft => {
                handleLoginStart(draft);
            });

            expect(newState.auth.loading).toBe(true);
        });

        it('should clear any previous error', () => {
            let state = produce(initialState, draft => {
                draft.auth.error = 'Previous error';
            });

            state = produce(state, draft => {
                handleLoginStart(draft);
            });

            expect(state.auth.error).toBe(null);
        });

        it('should not change isAuthenticated', () => {
            const newState = produce(initialState, draft => {
                handleLoginStart(draft);
            });

            expect(newState.auth.isAuthenticated).toBe(false);
        });

        it('should not change existing user', () => {
            let state = produce(initialState, draft => {
                draft.auth.user = { id: '123', name: 'Test' };
            });

            state = produce(state, draft => {
                handleLoginStart(draft);
            });

            expect(state.auth.user).toEqual({ id: '123', name: 'Test' });
        });
    });

    describe('handleLoginSuccess()', () => {
        const mockUser = {
            id: 'user-123',
            name: 'John Doe',
            email: 'john@example.com'
        };

        it('should set isAuthenticated to true', () => {
            const newState = produce(initialState, draft => {
                handleLoginSuccess(draft, mockUser);
            });

            expect(newState.auth.isAuthenticated).toBe(true);
        });

        it('should store the user object', () => {
            const newState = produce(initialState, draft => {
                handleLoginSuccess(draft, mockUser);
            });

            expect(newState.auth.user).toEqual(mockUser);
        });

        it('should set loading to false', () => {
            let state = produce(initialState, draft => {
                draft.auth.loading = true;
            });

            state = produce(state, draft => {
                handleLoginSuccess(draft, mockUser);
            });

            expect(state.auth.loading).toBe(false);
        });

        it('should clear any error', () => {
            let state = produce(initialState, draft => {
                draft.auth.error = 'Login failed';
            });

            state = produce(state, draft => {
                handleLoginSuccess(draft, mockUser);
            });

            expect(state.auth.error).toBe(null);
        });

        it('should handle complete login flow', () => {
            // Start login
            let state = produce(initialState, draft => {
                handleLoginStart(draft);
            });
            expect(state.auth.loading).toBe(true);

            // Login success
            state = produce(state, draft => {
                handleLoginSuccess(draft, mockUser);
            });
            expect(state.auth.isAuthenticated).toBe(true);
            expect(state.auth.user).toEqual(mockUser);
            expect(state.auth.loading).toBe(false);
            expect(state.auth.error).toBe(null);
        });
    });

    describe('handleLoginFailure()', () => {
        const errorMessage = 'Invalid credentials';

        it('should store the error message', () => {
            const newState = produce(initialState, draft => {
                handleLoginFailure(draft, errorMessage);
            });

            expect(newState.auth.error).toBe(errorMessage);
        });

        it('should set loading to false', () => {
            let state = produce(initialState, draft => {
                draft.auth.loading = true;
            });

            state = produce(state, draft => {
                handleLoginFailure(draft, errorMessage);
            });

            expect(state.auth.loading).toBe(false);
        });

        it('should not change isAuthenticated', () => {
            const newState = produce(initialState, draft => {
                handleLoginFailure(draft, errorMessage);
            });

            expect(newState.auth.isAuthenticated).toBe(false);
        });

        it('should clear user on failure', () => {
            let state = produce(initialState, draft => {
                draft.auth.user = { id: '123' };
            });

            state = produce(state, draft => {
                handleLoginFailure(draft, errorMessage);
            });

            expect(state.auth.user).toBe(null);
        });

        it('should handle complete failed login flow', () => {
            // Start login
            let state = produce(initialState, draft => {
                handleLoginStart(draft);
            });
            expect(state.auth.loading).toBe(true);

            // Login failure
            state = produce(state, draft => {
                handleLoginFailure(draft, errorMessage);
            });
            expect(state.auth.isAuthenticated).toBe(false);
            expect(state.auth.user).toBe(null);
            expect(state.auth.loading).toBe(false);
            expect(state.auth.error).toBe(errorMessage);
        });

        it('should handle error objects', () => {
            const errorObject = { message: 'Server error', code: 500 };

            const newState = produce(initialState, draft => {
                handleLoginFailure(draft, errorObject);
            });

            expect(newState.auth.error).toEqual(errorObject);
        });
    });

    describe('handleLogout()', () => {
        it('should set isAuthenticated to false', () => {
            let state = produce(initialState, draft => {
                draft.auth.isAuthenticated = true;
            });

            state = produce(state, draft => {
                handleLogout(draft);
            });

            expect(state.auth.isAuthenticated).toBe(false);
        });

        it('should clear user', () => {
            let state = produce(initialState, draft => {
                draft.auth.user = { id: '123', name: 'Test' };
            });

            state = produce(state, draft => {
                handleLogout(draft);
            });

            expect(state.auth.user).toBe(null);
        });

        it('should set loading to false', () => {
            let state = produce(initialState, draft => {
                draft.auth.loading = true;
            });

            state = produce(state, draft => {
                handleLogout(draft);
            });

            expect(state.auth.loading).toBe(false);
        });

        it('should clear any error', () => {
            let state = produce(initialState, draft => {
                draft.auth.error = 'Some error';
            });

            state = produce(state, draft => {
                handleLogout(draft);
            });

            expect(state.auth.error).toBe(null);
        });

        it('should reset to clean auth state', () => {
            let state = produce(initialState, draft => {
                draft.auth.isAuthenticated = true;
                draft.auth.user = { id: '123', name: 'Test' };
                draft.auth.loading = true;
                draft.auth.error = 'Some error';
            });

            state = produce(state, draft => {
                handleLogout(draft);
            });

            expect(state.auth).toEqual({
                isAuthenticated: false,
                user: null,
                loading: false,
                error: null
            });
        });
    });

    describe('handleUpdateProfile()', () => {
        const loggedInState = () => produce(initialState, draft => {
            draft.auth.isAuthenticated = true;
            draft.auth.user = {
                id: 'user-123',
                name: 'John Doe',
                email: 'john@example.com',
                avatar: null
            };
        });

        it('should update user properties', () => {
            let state = loggedInState();

            state = produce(state, draft => {
                handleUpdateProfile(draft, { name: 'Jane Doe' });
            });

            expect(state.auth.user.name).toBe('Jane Doe');
        });

        it('should preserve existing user properties', () => {
            let state = loggedInState();

            state = produce(state, draft => {
                handleUpdateProfile(draft, { name: 'Jane Doe' });
            });

            expect(state.auth.user.id).toBe('user-123');
            expect(state.auth.user.email).toBe('john@example.com');
        });

        it('should handle multiple profile updates', () => {
            let state = loggedInState();

            state = produce(state, draft => {
                handleUpdateProfile(draft, { email: 'new@example.com' });
            });

            state = produce(state, draft => {
                handleUpdateProfile(draft, { avatar: 'avatar.png' });
            });

            expect(state.auth.user.email).toBe('new@example.com');
            expect(state.auth.user.avatar).toBe('avatar.png');
            expect(state.auth.user.name).toBe('John Doe');
        });

        it('should add new properties to user', () => {
            let state = loggedInState();

            state = produce(state, draft => {
                handleUpdateProfile(draft, { bio: 'Hello World' });
            });

            expect(state.auth.user.bio).toBe('Hello World');
        });

        it('should update multiple properties at once', () => {
            let state = loggedInState();

            state = produce(state, draft => {
                handleUpdateProfile(draft, {
                    name: 'Jane Doe',
                    email: 'jane@example.com',
                    avatar: 'avatar.png'
                });
            });

            expect(state.auth.user.name).toBe('Jane Doe');
            expect(state.auth.user.email).toBe('jane@example.com');
            expect(state.auth.user.avatar).toBe('avatar.png');
        });

        it('should not affect other auth state', () => {
            let state = loggedInState();

            state = produce(state, draft => {
                handleUpdateProfile(draft, { name: 'Jane Doe' });
            });

            expect(state.auth.isAuthenticated).toBe(true);
            expect(state.auth.loading).toBe(false);
            expect(state.auth.error).toBe(null);
        });
    });

    describe('Auth lifecycle', () => {
        it('should handle full login -> profile update -> logout cycle', () => {
            let state = initialState;
            const user = { id: '123', name: 'John' };

            // Login start
            state = produce(state, draft => {
                handleLoginStart(draft);
            });
            expect(state.auth.loading).toBe(true);

            // Login success
            state = produce(state, draft => {
                handleLoginSuccess(draft, user);
            });
            expect(state.auth.isAuthenticated).toBe(true);

            // Update profile
            state = produce(state, draft => {
                handleUpdateProfile(draft, { name: 'Jane' });
            });
            expect(state.auth.user.name).toBe('Jane');

            // Logout
            state = produce(state, draft => {
                handleLogout(draft);
            });
            expect(state.auth.isAuthenticated).toBe(false);
            expect(state.auth.user).toBe(null);
        });

        it('should handle failed login retry with success', () => {
            let state = initialState;
            const user = { id: '123', name: 'John' };

            // First attempt - failure
            state = produce(state, draft => {
                handleLoginStart(draft);
            });
            state = produce(state, draft => {
                handleLoginFailure(draft, 'Invalid password');
            });
            expect(state.auth.error).toBe('Invalid password');

            // Second attempt - success
            state = produce(state, draft => {
                handleLoginStart(draft);
            });
            expect(state.auth.error).toBe(null);
            
            state = produce(state, draft => {
                handleLoginSuccess(draft, user);
            });
            expect(state.auth.isAuthenticated).toBe(true);
            expect(state.auth.user).toEqual(user);
        });
    });
});
