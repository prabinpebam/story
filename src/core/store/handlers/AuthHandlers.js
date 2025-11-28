/**
 * Auth State Handlers
 * 
 * Handles state updates for authentication actions.
 */

export function handleLoginStart(draft) {
    draft.auth.loading = true;
    draft.auth.error = null;
}

export function handleLoginSuccess(draft, user) {
    draft.auth.loading = false;
    draft.auth.isAuthenticated = true;
    draft.auth.user = user;
    draft.auth.error = null;
}

export function handleLoginFailure(draft, error) {
    draft.auth.loading = false;
    draft.auth.isAuthenticated = false;
    draft.auth.user = null;
    draft.auth.error = error;
}

export function handleLogout(draft) {
    draft.auth.loading = false;
    draft.auth.isAuthenticated = false;
    draft.auth.user = null;
    draft.auth.error = null;
}

export function handleUpdateProfile(draft, profile) {
    if (draft.auth.user) {
        Object.assign(draft.auth.user, profile);
    }
}
