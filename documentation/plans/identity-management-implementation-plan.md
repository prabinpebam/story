# Identity Management - Implementation Plan

## Overview

This plan outlines the phased implementation of Story's decentralized identity system using OAuth providers (Microsoft, Google) with no central user database.

**Related Specifications:**
- [Identity Architecture](../specs/identity/identity-architecture.md)
- [OAuth Identity Flow](../specs/identity/oauth-identity-flow.md)
- [User Profile Model](../specs/identity/user-profile-model.md)
- [Session Lifecycle](../specs/identity/session-lifecycle.md)

**Key Principles:**
- Small, testable incremental phases
- No breaking changes to existing features
- Design system adherence
- Risk mitigation at each phase

---

## Dependencies & Prerequisites

### Existing Infrastructure
- ✅ Design system tokens (`styles/design-tokens.css`)
- ✅ Modal/Dialog components
- ✅ Button components
- ⚠️ **Need**: Cloud storage abstraction (dependency on File Storage plan)

### External Services Required
- Microsoft Azure AD app registration
- Google Cloud Console OAuth app
- Environment variables for client IDs

### Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| OAuth flow breaks existing auth | HIGH | Implement behind feature flag |
| Token storage security | HIGH | Use httpOnly cookies + PKCE |
| Multi-tab token sync | MEDIUM | Use BroadcastChannel API |
| Provider downtime | MEDIUM | Graceful degradation, cached tokens |

---

## Phase 1: OAuth Infrastructure Setup (Non-Breaking)

**Goal:** Set up OAuth providers and basic token exchange without touching existing code.

**Duration:** 2-3 days

### Tasks

#### 1.1 Azure AD Registration
```yaml
Create Azure App:
  - Name: Story Presentation Maker
  - Redirect URIs: 
      - http://localhost:3000/auth/callback
      - https://story.app/auth/callback
  - Scopes: openid, profile, email, Files.ReadWrite.All
  - Store: CLIENT_ID, AUTHORITY in .env
```

#### 1.2 Google OAuth Registration
```yaml
Create Google Console App:
  - Project: Story App
  - Redirect URIs: Same as Azure
  - Scopes: openid, profile, email, drive.file
  - Store: GOOGLE_CLIENT_ID in .env
```

#### 1.3 Environment Configuration
**File:** `src/config/auth.config.js` (NEW)
```javascript
export const authConfig = {
    microsoft: {
        clientId: import.meta.env.VITE_MS_CLIENT_ID,
        authority: 'https://login.microsoftonline.com/common',
        redirectUri: `${window.location.origin}/auth/callback`,
        scopes: ['openid', 'profile', 'email', 'Files.ReadWrite.All']
    },
    google: {
        clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        redirectUri: `${window.location.origin}/auth/callback`,
        scopes: ['openid', 'profile', 'email', 
                 'https://www.googleapis.com/auth/drive.file']
    }
};
```

**Testing:**
- ✅ Config loads without errors
- ✅ Missing env vars throw helpful errors

**What might break:** Nothing (no existing code affected)

---

## Phase 2: Token Management Layer

**Goal:** Create secure token storage and management without UI.

**Duration:** 3-4 days

### Tasks

#### 2.1 Token Storage Service
**File:** `src/core/auth/TokenStorage.js` (NEW)
```javascript
/**
 * Secure token storage with multi-tab sync
 */
export class TokenStorage {
    constructor() {
        this.channel = new BroadcastChannel('story:auth');
        this.setupListeners();
    }
    
    // Store tokens securely
    async setTokens(provider, tokens) {
        // Validate tokens first
        if (!this.validateTokens(tokens)) {
            throw new Error('Invalid token format');
        }
        
        // Store in localStorage (encrypted in Phase 3)
        const key = `story:tokens:${provider}`;
        localStorage.setItem(key, JSON.stringify({
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            expiresAt: tokens.expiresAt,
            idToken: tokens.idToken
        }));
        
        // Notify other tabs
        this.channel.postMessage({ 
            type: 'tokens-updated', 
            provider 
        });
    }
    
    // Get tokens (returns null if expired)
    async getTokens(provider) {
        const key = `story:tokens:${provider}`;
        const stored = localStorage.getItem(key);
        if (!stored) return null;
        
        const tokens = JSON.parse(stored);
        
        // Check expiration
        if (Date.now() >= tokens.expiresAt) {
            return null; // Caller should refresh
        }
        
        return tokens;
    }
    
    // Clear tokens (sign out)
    async clearTokens(provider) {
        const key = `story:tokens:${provider}`;
        localStorage.removeItem(key);
        this.channel.postMessage({ 
            type: 'tokens-cleared', 
            provider 
        });
    }
}
```

#### 2.2 Token Refresh Logic
**File:** `src/core/auth/TokenRefresher.js` (NEW)
```javascript
export class TokenRefresher {
    constructor(tokenStorage) {
        this.storage = tokenStorage;
        this.refreshPromises = new Map(); // Prevent duplicate refreshes
    }
    
    async ensureValidToken(provider) {
        const tokens = await this.storage.getTokens(provider);
        
        if (!tokens) {
            throw new Error('Not authenticated');
        }
        
        // If token expires in < 5 minutes, refresh
        const expiresIn = tokens.expiresAt - Date.now();
        if (expiresIn < 5 * 60 * 1000) {
            return this.refreshToken(provider, tokens.refreshToken);
        }
        
        return tokens.accessToken;
    }
    
    async refreshToken(provider, refreshToken) {
        // Prevent duplicate refresh calls
        const existingPromise = this.refreshPromises.get(provider);
        if (existingPromise) return existingPromise;
        
        const promise = this._doRefresh(provider, refreshToken);
        this.refreshPromises.set(provider, promise);
        
        try {
            const result = await promise;
            return result;
        } finally {
            this.refreshPromises.delete(provider);
        }
    }
    
    async _doRefresh(provider, refreshToken) {
        // Implementation depends on provider
        // Phase 3 will implement provider-specific logic
        throw new Error('Not implemented');
    }
}
```

**Testing:**
- ✅ Tokens stored/retrieved correctly
- ✅ Expired tokens return null
- ✅ Multi-tab sync works via BroadcastChannel
- ✅ Concurrent refresh requests deduplicated

**What might break:** Nothing (no UI yet)

---

## Phase 3: OAuth Flow Implementation

**Goal:** Implement complete OAuth login flow for Microsoft and Google.

**Duration:** 4-5 days

### Tasks

#### 3.1 Microsoft OAuth Flow
**File:** `src/core/auth/providers/MicrosoftAuth.js` (NEW)
```javascript
import { authConfig } from '../../../config/auth.config.js';

export class MicrosoftAuth {
    constructor(tokenStorage) {
        this.config = authConfig.microsoft;
        this.storage = tokenStorage;
    }
    
    /**
     * Initiate OAuth login (redirect flow)
     */
    async signIn() {
        // Generate PKCE challenge
        const { codeVerifier, codeChallenge } = 
            await this.generatePKCE();
        
        // Store verifier for callback
        sessionStorage.setItem('pkce_verifier', codeVerifier);
        
        // Build authorization URL
        const authUrl = new URL(
            `${this.config.authority}/oauth2/v2.0/authorize`
        );
        authUrl.searchParams.set('client_id', this.config.clientId);
        authUrl.searchParams.set('response_type', 'code');
        authUrl.searchParams.set('redirect_uri', this.config.redirectUri);
        authUrl.searchParams.set('scope', this.config.scopes.join(' '));
        authUrl.searchParams.set('code_challenge', codeChallenge);
        authUrl.searchParams.set('code_challenge_method', 'S256');
        authUrl.searchParams.set('state', this.generateState());
        
        // Redirect to Microsoft
        window.location.href = authUrl.toString();
    }
    
    /**
     * Handle OAuth callback
     */
    async handleCallback(code, state) {
        // Verify state
        const storedState = sessionStorage.getItem('oauth_state');
        if (state !== storedState) {
            throw new Error('Invalid state parameter');
        }
        
        // Exchange code for tokens
        const codeVerifier = sessionStorage.getItem('pkce_verifier');
        const tokens = await this.exchangeCode(code, codeVerifier);
        
        // Store tokens
        await this.storage.setTokens('microsoft', tokens);
        
        // Clean up
        sessionStorage.removeItem('pkce_verifier');
        sessionStorage.removeItem('oauth_state');
        
        return tokens;
    }
    
    async exchangeCode(code, codeVerifier) {
        const tokenUrl = `${this.config.authority}/oauth2/v2.0/token`;
        
        const response = await fetch(tokenUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                client_id: this.config.clientId,
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: this.config.redirectUri,
                code_verifier: codeVerifier
            })
        });
        
        if (!response.ok) {
            throw new Error('Token exchange failed');
        }
        
        const data = await response.json();
        
        return {
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            idToken: data.id_token,
            expiresAt: Date.now() + (data.expires_in * 1000)
        };
    }
    
    // PKCE helpers
    async generatePKCE() {
        const codeVerifier = this.generateRandomString(128);
        const codeChallenge = await this.sha256(codeVerifier);
        return { codeVerifier, codeChallenge };
    }
    
    generateRandomString(length) {
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
        const values = crypto.getRandomValues(new Uint8Array(length));
        return Array.from(values)
            .map(v => possible[v % possible.length])
            .join('');
    }
    
    async sha256(plain) {
        const encoder = new TextEncoder();
        const data = encoder.encode(plain);
        const hash = await crypto.subtle.digest('SHA-256', data);
        return btoa(String.fromCharCode(...new Uint8Array(hash)))
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=/g, '');
    }
    
    generateState() {
        const state = this.generateRandomString(32);
        sessionStorage.setItem('oauth_state', state);
        return state;
    }
}
```

#### 3.2 Google OAuth Flow
**File:** `src/core/auth/providers/GoogleAuth.js` (NEW)
```javascript
// Similar structure to MicrosoftAuth
// Uses Google's OAuth 2.0 endpoints
// Implementation details in separate file
```

#### 3.3 OAuth Callback Route Handler
**File:** `src/routes/AuthCallback.js` (NEW)
```javascript
import { MicrosoftAuth } from '../core/auth/providers/MicrosoftAuth.js';
import { GoogleAuth } from '../core/auth/providers/GoogleAuth.js';

export async function handleAuthCallback() {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');
    const error = params.get('error');
    
    if (error) {
        console.error('OAuth error:', error);
        window.location.href = '/?auth_error=' + error;
        return;
    }
    
    // Determine provider from state or separate param
    const provider = sessionStorage.getItem('auth_provider');
    
    try {
        let auth;
        if (provider === 'microsoft') {
            auth = new MicrosoftAuth(window.tokenStorage);
        } else if (provider === 'google') {
            auth = new GoogleAuth(window.tokenStorage);
        }
        
        await auth.handleCallback(code, state);
        
        // Redirect to app
        window.location.href = '/';
    } catch (err) {
        console.error('Auth callback failed:', err);
        window.location.href = '/?auth_error=callback_failed';
    }
}
```

**Testing:**
- ✅ PKCE generation follows RFC 7636
- ✅ State parameter validation works
- ✅ Token exchange successful
- ✅ Tokens stored correctly
- ✅ Error handling redirects properly

**What might break:** 
- Existing routes if `/auth/callback` conflicts
- **Mitigation:** Check existing routes first

---

## Phase 4: User Profile Extraction

**Goal:** Extract user profile from ID token and cache it.

**Duration:** 2 days

### Tasks

#### 4.1 Profile Extractor
**File:** `src/core/auth/ProfileExtractor.js` (NEW)
```javascript
/**
 * Extract user profile from OAuth ID token
 */
export class ProfileExtractor {
    /**
     * Parse JWT ID token and extract claims
     */
    parseIdToken(idToken) {
        const parts = idToken.split('.');
        if (parts.length !== 3) {
            throw new Error('Invalid ID token format');
        }
        
        const payload = JSON.parse(atob(parts[1]));
        return payload;
    }
    
    /**
     * Extract user profile from token claims
     */
    extractProfile(idToken, provider) {
        const claims = this.parseIdToken(idToken);
        
        // Normalize across providers
        return {
            id: `${provider}_${claims.sub}`,
            provider: provider,
            sub: claims.sub,
            email: claims.email,
            name: claims.name,
            picture: this.getPictureUrl(claims, provider),
            emailVerified: claims.email_verified || false
        };
    }
    
    getPictureUrl(claims, provider) {
        if (provider === 'microsoft') {
            // Microsoft doesn't include picture in token
            // Will fetch from Graph API in Phase 5
            return null;
        } else if (provider === 'google') {
            return claims.picture;
        }
        return null;
    }
}
```

#### 4.2 Profile Cache
**File:** `src/core/auth/ProfileCache.js` (NEW)
```javascript
export class ProfileCache {
    constructor() {
        this.channel = new BroadcastChannel('story:profile');
    }
    
    setProfile(profile) {
        localStorage.setItem('story:profile', JSON.stringify(profile));
        this.channel.postMessage({ type: 'profile-updated', profile });
    }
    
    getProfile() {
        const cached = localStorage.getItem('story:profile');
        return cached ? JSON.parse(cached) : null;
    }
    
    clearProfile() {
        localStorage.removeItem('story:profile');
        this.channel.postMessage({ type: 'profile-cleared' });
    }
}
```

**Testing:**
- ✅ ID token parsing works for both providers
- ✅ Profile normalized correctly
- ✅ Cache stores/retrieves profile
- ✅ Multi-tab sync works

**What might break:** Nothing (internal logic only)

---

## Phase 5: Authentication Manager (Facade)

**Goal:** Create unified API for all auth operations.

**Duration:** 2 days

### Tasks

#### 5.1 Auth Manager
**File:** `src/core/auth/AuthManager.js` (NEW)
```javascript
import { TokenStorage } from './TokenStorage.js';
import { TokenRefresher } from './TokenRefresher.js';
import { ProfileExtractor } from './ProfileExtractor.js';
import { ProfileCache } from './ProfileCache.js';
import { MicrosoftAuth } from './providers/MicrosoftAuth.js';
import { GoogleAuth } from './providers/GoogleAuth.js';

/**
 * Unified authentication manager
 */
export class AuthManager {
    constructor() {
        this.tokenStorage = new TokenStorage();
        this.refresher = new TokenRefresher(this.tokenStorage);
        this.profileExtractor = new ProfileExtractor();
        this.profileCache = new ProfileCache();
        
        this.providers = {
            microsoft: new MicrosoftAuth(this.tokenStorage),
            google: new GoogleAuth(this.tokenStorage)
        };
    }
    
    /**
     * Sign in with provider
     */
    async signIn(provider) {
        if (!this.providers[provider]) {
            throw new Error(`Unknown provider: ${provider}`);
        }
        
        sessionStorage.setItem('auth_provider', provider);
        await this.providers[provider].signIn();
    }
    
    /**
     * Get current user (from cache or token)
     */
    async getCurrentUser() {
        // Try cache first
        const cached = this.profileCache.getProfile();
        if (cached) return cached;
        
        // Try to extract from token
        for (const provider of ['microsoft', 'google']) {
            const tokens = await this.tokenStorage.getTokens(provider);
            if (tokens && tokens.idToken) {
                const profile = this.profileExtractor.extractProfile(
                    tokens.idToken, 
                    provider
                );
                this.profileCache.setProfile(profile);
                return profile;
            }
        }
        
        return null;
    }
    
    /**
     * Check if user is authenticated
     */
    async isAuthenticated() {
        const user = await this.getCurrentUser();
        return user !== null;
    }
    
    /**
     * Sign out
     */
    async signOut() {
        // Clear tokens for all providers
        await this.tokenStorage.clearTokens('microsoft');
        await this.tokenStorage.clearTokens('google');
        
        // Clear profile
        this.profileCache.clearProfile();
    }
    
    /**
     * Get valid access token (refreshes if needed)
     */
    async getAccessToken(provider) {
        return this.refresher.ensureValidToken(provider);
    }
}

// Global singleton
export const authManager = new AuthManager();
```

**Testing:**
- ✅ Sign in redirects correctly
- ✅ getCurrentUser returns cached or fresh profile
- ✅ isAuthenticated works
- ✅ Sign out clears all data

**What might break:** Nothing (standalone service)

---

## Phase 6: Sign-In UI Components

**Goal:** Create sign-in modal UI adhering to design system.

**Duration:** 3 days

### Tasks

#### 6.1 Sign-In Modal Component
**File:** `src/ui/modals/SignInModal.js` (NEW)
```javascript
import { authManager } from '../../core/auth/AuthManager.js';

export class SignInModal {
    constructor() {
        this.modal = null;
    }
    
    show() {
        this.modal = this.createModal();
        document.body.appendChild(this.modal);
    }
    
    createModal() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 400px;">
                <div class="modal-header">
                    <h2 class="modal-title">Sign In</h2>
                    <button class="modal-close" aria-label="Close">×</button>
                </div>
                <div class="modal-body">
                    <p style="
                        color: var(--color-text-secondary);
                        margin-bottom: var(--spacing-6);
                    ">
                        Sign in to save your work to the cloud and collaborate with others.
                    </p>
                    
                    <div class="sign-in-providers">
                        <button 
                            class="btn-provider btn-microsoft"
                            data-provider="microsoft"
                        >
                            <svg class="provider-icon" width="20" height="20">
                                <!-- Microsoft icon -->
                            </svg>
                            Continue with Microsoft
                        </button>
                        
                        <button 
                            class="btn-provider btn-google"
                            data-provider="google"
                        >
                            <svg class="provider-icon" width="20" height="20">
                                <!-- Google icon -->
                            </svg>
                            Continue with Google
                        </button>
                    </div>
                    
                    <p class="sign-in-note">
                        By signing in, you agree to our Terms of Service.
                    </p>
                </div>
            </div>
        `;
        
        // Event listeners
        modal.querySelector('.modal-close').onclick = () => this.hide();
        modal.querySelector('.modal-overlay').onclick = (e) => {
            if (e.target === modal) this.hide();
        };
        
        modal.querySelectorAll('.btn-provider').forEach(btn => {
            btn.onclick = () => this.handleProviderClick(
                btn.dataset.provider
            );
        });
        
        return modal;
    }
    
    async handleProviderClick(provider) {
        try {
            await authManager.signIn(provider);
        } catch (err) {
            console.error('Sign in failed:', err);
            alert('Sign in failed. Please try again.');
        }
    }
    
    hide() {
        if (this.modal) {
            this.modal.remove();
            this.modal = null;
        }
    }
}
```

#### 6.2 Sign-In Modal CSS
**File:** `styles/modules/sign-in.css` (NEW)
```css
.sign-in-providers {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-3);
}

.btn-provider {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-2);
    padding: var(--spacing-3) var(--spacing-4);
    border-radius: var(--radius-md);
    font-size: var(--font-size-md);
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
    border: 1px solid var(--color-border);
    background: var(--color-bg-elevated);
}

.btn-provider:hover {
    background: var(--color-bg-hover);
    border-color: var(--color-border-focus);
}

.btn-microsoft {
    /* Microsoft brand colors if needed */
}

.btn-google {
    /* Google brand colors if needed */
}

.provider-icon {
    width: 20px;
    height: 20px;
}

.sign-in-note {
    margin-top: var(--spacing-6);
    font-size: var(--font-size-sm);
    color: var(--color-text-tertiary);
    text-align: center;
}
```

**Testing:**
- ✅ Modal opens and closes correctly
- ✅ Provider buttons trigger sign-in
- ✅ Design system tokens applied correctly
- ✅ Keyboard navigation works (Escape closes)

**What might break:**
- Existing modal system
- **Mitigation:** Test with existing modals open

---

## Phase 7: User Profile UI

**Goal:** Display user profile in UI (avatar, name, sign-out).

**Duration:** 2-3 days

### Tasks

#### 7.1 Profile Flyout Component
**File:** `src/ui/components/ProfileFlyout.js` (NEW)
```javascript
import { authManager } from '../../core/auth/AuthManager.js';

export class ProfileFlyout {
    constructor() {
        this.isOpen = false;
        this.flyout = null;
    }
    
    async render(user) {
        const flyout = document.createElement('div');
        flyout.className = 'profile-flyout';
        flyout.innerHTML = `
            <div class="profile-header">
                <img 
                    src="${user.picture || '/assets/default-avatar.svg'}" 
                    alt="${user.name}"
                    class="profile-avatar"
                />
                <div class="profile-info">
                    <div class="profile-name">${user.name}</div>
                    <div class="profile-email">${user.email}</div>
                </div>
            </div>
            <div class="profile-divider"></div>
            <div class="profile-actions">
                <button class="profile-action" data-action="preferences">
                    <svg width="16" height="16"><!-- Settings icon --></svg>
                    Preferences
                </button>
                <button class="profile-action" data-action="signout">
                    <svg width="16" height="16"><!-- Sign out icon --></svg>
                    Sign Out
                </button>
            </div>
        `;
        
        // Event listeners
        flyout.querySelector('[data-action="signout"]').onclick = 
            () => this.handleSignOut();
        flyout.querySelector('[data-action="preferences"]').onclick =
            () => this.handlePreferences();
        
        return flyout;
    }
    
    async handleSignOut() {
        if (confirm('Are you sure you want to sign out?')) {
            await authManager.signOut();
            window.location.reload();
        }
    }
    
    handlePreferences() {
        // Will implement in Preferences Plan
        console.log('Open preferences');
    }
}
```

#### 7.2 Profile Button (Toolbar)
**File:** Update existing toolbar to add profile button
```javascript
// Add to toolbar after authentication
if (await authManager.isAuthenticated()) {
    const user = await authManager.getCurrentUser();
    const profileBtn = createProfileButton(user);
    toolbar.appendChild(profileBtn);
} else {
    const signInBtn = createSignInButton();
    toolbar.appendChild(signInBtn);
}
```

**Testing:**
- ✅ Profile button appears when signed in
- ✅ Sign-in button appears when signed out
- ✅ Flyout opens/closes correctly
- ✅ Sign-out works and refreshes page

**What might break:**
- Toolbar layout
- **Mitigation:** Test on different screen sizes

---

## Phase 8: Session Persistence & Tab Sync

**Goal:** Maintain session across page reloads and tabs.

**Duration:** 2 days

### Tasks

#### 8.1 Session Initialization
**File:** `src/main.js` (UPDATE)
```javascript
import { authManager } from './core/auth/AuthManager.js';

// On app startup
async function initializeApp() {
    // Check if returning from OAuth callback
    if (window.location.pathname === '/auth/callback') {
        await handleAuthCallback();
        return;
    }
    
    // Check existing session
    const isAuthenticated = await authManager.isAuthenticated();
    
    if (isAuthenticated) {
        const user = await authManager.getCurrentUser();
        console.log('Signed in as:', user.email);
        // Initialize with user context
    } else {
        console.log('Not signed in');
        // Show guest mode
    }
    
    // Continue app initialization...
}

initializeApp();
```

#### 8.2 Multi-Tab Sync
Already implemented in TokenStorage and ProfileCache via BroadcastChannel.

**Testing:**
- ✅ Session persists across page reload
- ✅ Sign-in in one tab reflects in others
- ✅ Sign-out in one tab signs out all tabs

**What might break:**
- App initialization flow
- **Mitigation:** Feature flag for auth integration

---

## Phase 9: Error Handling & Edge Cases

**Goal:** Handle auth errors gracefully.

**Duration:** 2 days

### Tasks

#### 9.1 Error States
```javascript
// OAuth error handling
if (params.get('error')) {
    showErrorToast({
        'access_denied': 'Sign in was cancelled',
        'invalid_request': 'Something went wrong. Please try again.',
        'server_error': 'Server error. Please try again later.'
    }[params.get('error')]);
}
```

#### 9.2 Token Expiry Handling
```javascript
// In API calls
try {
    const token = await authManager.getAccessToken('microsoft');
    // Use token...
} catch (err) {
    if (err.message === 'Not authenticated') {
        // Show sign-in modal
        new SignInModal().show();
    }
}
```

**Testing:**
- ✅ OAuth errors shown to user
- ✅ Expired tokens trigger refresh
- ✅ Failed refresh prompts re-authentication

---

## Phase 10: Integration Testing & Rollout

**Goal:** Comprehensive testing before full rollout.

**Duration:** 3-4 days

### Testing Checklist

- [ ] Sign in with Microsoft works
- [ ] Sign in with Google works
- [ ] Profile displays correctly
- [ ] Sign out works
- [ ] Multi-tab sync works
- [ ] Token refresh works
- [ ] Error states handled
- [ ] Design system adherence verified
- [ ] Accessibility tested (keyboard, screen reader)
- [ ] Mobile responsive

### Rollout Strategy

1. **Feature Flag**: `ENABLE_OAUTH_AUTH=true`
2. **Beta Test**: Small group of users
3. **Monitor**: Error rates, auth success rates
4. **Full Rollout**: Remove feature flag

---

## Dependencies for Future Phases

Once identity is complete, these features can be built:

- **Cloud Storage Integration** (needs access tokens)
- **Real-Time Collaboration** (needs user identity)
- **User Preferences File** (needs identity for encryption)
- **Sharing & Permissions** (needs user ID)

---

## Risk Mitigation Summary

| Risk | Phase | Mitigation |
|------|-------|------------|
| Breaking existing auth | All | Feature flag |
| Token security | 2-3 | PKCE, httpOnly (future) |
| Multi-tab issues | 2, 8 | BroadcastChannel |
| Provider downtime | 3 | Graceful error messages |
| UI layout break | 6-7 | Test with existing UI |

---

## Files Created

```
src/
  config/
    auth.config.js
  core/
    auth/
      TokenStorage.js
      TokenRefresher.js
      ProfileExtractor.js
      ProfileCache.js
      AuthManager.js
      providers/
        MicrosoftAuth.js
        GoogleAuth.js
  ui/
    modals/
      SignInModal.js
    components/
      ProfileFlyout.js
  routes/
    AuthCallback.js
styles/
  modules/
    sign-in.css
```

**Total:** 12 new files, 1 updated file (`main.js`)

---

*This plan implements decentralized identity with zero database, following OAuth best practices and Story's design system.*
