# Session Lifecycle

## Overview

This specification defines the **session lifecycle** for Story, covering sign-in, session maintenance, and sign-out flows. Since Story uses a decentralized identity model, sessions are entirely client-side with no server session state.

**Related Specifications:**
- [Identity Architecture](./identity-architecture.md) - Overall architecture
- [OAuth Identity Flow](./oauth-identity-flow.md) - Token handling
- [Cross-Device Identity](./cross-device-identity.md) - Multi-device considerations

---

## Table of Contents

1. [Session Model](#1-session-model)
2. [Sign-In Flow](#2-sign-in-flow)
3. [Session Maintenance](#3-session-maintenance)
4. [Sign-Out Flow](#4-sign-out-flow)
5. [Session Recovery](#5-session-recovery)
6. [Cross-Tab Synchronization](#6-cross-tab-synchronization)

---

## 1. Session Model

### 1.1 Client-Side Sessions

```
┌─────────────────────────────────────────────────────────────────┐
│                   CLIENT-SIDE SESSION MODEL                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  TRADITIONAL SERVER SESSION:                                    │
│  ┌────────┐         ┌────────┐         ┌────────┐             │
│  │ Client │ ──────► │ Server │ ──────► │Session │             │
│  │        │ cookie  │        │         │ Store  │             │
│  └────────┘         └────────┘         └────────┘             │
│                                                                 │
│  STORY CLIENT SESSION:                                          │
│  ┌────────────────────────────────────────────────────────┐    │
│  │                      BROWSER                            │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐  │    │
│  │  │ Session  │  │ Local    │  │ Memory               │  │    │
│  │  │ Storage  │  │ Storage  │  │ (Tab-specific)       │  │    │
│  │  │          │  │          │  │                      │  │    │
│  │  │ • Access │  │ • Refresh│  │ • Active user object │  │    │
│  │  │   token  │  │   token  │  │ • Computed profile   │  │    │
│  │  │ • ID     │  │ • Cached │  │ • Live subscriptions │  │    │
│  │  │   token  │  │   profile│  │                      │  │    │
│  │  └──────────┘  └──────────┘  └──────────────────────┘  │    │
│  └────────────────────────────────────────────────────────┘    │
│                              │                                  │
│                              ▼                                  │
│                     NO SERVER SESSION!                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Session State

```typescript
/**
 * Session state (entirely client-side)
 */
interface SessionState {
    /** Is user currently authenticated */
    isAuthenticated: boolean;
    
    /** Current user (null if not authenticated) */
    user: UserProfile | null;
    
    /** Active OAuth provider */
    provider: 'microsoft' | 'google' | null;
    
    /** Token state */
    tokens: {
        /** Access token (in session storage) */
        hasAccessToken: boolean;
        
        /** Token expiration */
        expiresAt: Date | null;
        
        /** Has refresh token (in local storage) */
        hasRefreshToken: boolean;
    };
    
    /** Session start time */
    sessionStart: Date | null;
    
    /** Last activity time */
    lastActivity: Date | null;
}

/**
 * Session lifecycle events
 */
type SessionEvent =
    | { type: 'SIGN_IN_STARTED'; provider: string }
    | { type: 'SIGN_IN_COMPLETED'; user: UserProfile }
    | { type: 'SIGN_IN_FAILED'; error: Error }
    | { type: 'TOKEN_REFRESHED'; expiresAt: Date }
    | { type: 'TOKEN_REFRESH_FAILED'; error: Error }
    | { type: 'SESSION_EXPIRED' }
    | { type: 'SIGN_OUT_STARTED' }
    | { type: 'SIGN_OUT_COMPLETED' };
```

---

## 2. Sign-In Flow

### 2.1 Complete Sign-In Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          SIGN-IN FLOW                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────┐                                                          │
│  │  START   │                                                          │
│  └────┬─────┘                                                          │
│       │                                                                 │
│       ▼                                                                 │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ 1. RESTORE SESSION (on app load)                                 │  │
│  │    • Check localStorage for refresh token                       │  │
│  │    • Check sessionStorage for access token                      │  │
│  │    • If found, try silent sign-in                               │  │
│  └────────────────────────────────────────────────────────────────┬─┘  │
│       │                                                           │     │
│       │ No token                                           Token found │
│       ▼                                                           ▼     │
│  ┌──────────────────┐                            ┌──────────────────┐  │
│  │ 2. SHOW SIGN-IN  │                            │ SILENT SIGN-IN   │  │
│  │    UI            │                            │ (via OAuth lib)  │  │
│  │                  │                            │                  │  │
│  │ • Microsoft btn  │                            └────────┬─────────┘  │
│  │ • Google btn     │                                     │            │
│  │ • Continue local │                          ┌──────────┴──────────┐ │
│  └────────┬─────────┘                          │                     │ │
│           │                                Success               Failed│
│           │ User clicks                        │                     │ │
│           ▼                                    ▼                     ▼ │
│  ┌──────────────────────┐             ┌──────────────┐    ┌──────────┐│
│  │ 3. INITIATE OAUTH    │             │ 5. COMPLETE  │    │Show login││
│  │                      │             │              │    │   UI     ││
│  │ • Generate PKCE      │             └──────────────┘    └──────────┘│
│  │ • Store state        │                     │                       │
│  │ • Redirect to        │                     │                       │
│  │   provider           │                     │                       │
│  └────────┬─────────────┘                     │                       │
│           │                                   │                       │
│           ▼                                   │                       │
│  ┌──────────────────────┐                     │                       │
│  │ 4. OAUTH CALLBACK    │                     │                       │
│  │                      │                     │                       │
│  │ • Verify state       │                     │                       │
│  │ • Exchange code      │                     │                       │
│  │ • Parse ID token     │                     │                       │
│  │ • Store tokens       │                     │                       │
│  │ • Build profile      │                     │                       │
│  └────────┬─────────────┘                     │                       │
│           │                                   │                       │
│           └───────────────────────────────────┘                       │
│                                   │                                    │
│                                   ▼                                    │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │ 5. SESSION ESTABLISHED                                           │ │
│  │                                                                   │ │
│  │ • User profile loaded                                            │ │
│  │ • Token refresh scheduled                                        │ │
│  │ • Cloud storage connected                                        │ │
│  │ • Emit SIGN_IN_COMPLETED event                                   │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Sign-In Implementation

```typescript
/**
 * Session manager - handles complete session lifecycle
 */
class SessionManager {
    private state: SessionState = {
        isAuthenticated: false,
        user: null,
        provider: null,
        tokens: {
            hasAccessToken: false,
            expiresAt: null,
            hasRefreshToken: false
        },
        sessionStart: null,
        lastActivity: null
    };
    
    private tokenStorage: TokenStorage;
    private profileManager: ProfileManager;
    private tokenRefreshManager: TokenRefreshManager;
    private listeners: Set<(state: SessionState) => void> = new Set();
    
    constructor(
        private providers: Map<string, AuthProvider>
    ) {
        this.tokenStorage = new TokenStorage();
        this.profileManager = new ProfileManager();
    }
    
    // ─────────────────────────────────────────────────────────
    // Initialization
    // ─────────────────────────────────────────────────────────
    
    /**
     * Initialize session on app load
     */
    async initialize(): Promise<void> {
        // Show cached profile immediately (for fast UI)
        await this.profileManager.initialize();
        
        // Try to restore session
        const restored = await this.tryRestoreSession();
        
        if (!restored) {
            this.emit({ type: 'SESSION_EXPIRED' });
        }
    }
    
    /**
     * Try to restore session from stored tokens
     */
    private async tryRestoreSession(): Promise<boolean> {
        const lastProvider = this.tokenStorage.getProvider();
        if (!lastProvider) {
            return false;
        }
        
        const provider = this.providers.get(lastProvider);
        if (!provider) {
            return false;
        }
        
        try {
            // Try silent sign-in
            const result = await provider.signInSilent();
            
            if (result.success && result.user) {
                await this.completeSignIn(result, lastProvider);
                return true;
            }
        } catch (error) {
            console.warn('Silent sign-in failed:', error);
        }
        
        return false;
    }
    
    // ─────────────────────────────────────────────────────────
    // Sign In
    // ─────────────────────────────────────────────────────────
    
    /**
     * Start interactive sign-in
     */
    async signIn(
        providerId: 'microsoft' | 'google',
        options?: SignInOptions
    ): Promise<void> {
        this.emit({ type: 'SIGN_IN_STARTED', provider: providerId });
        
        const provider = this.providers.get(providerId);
        if (!provider) {
            throw new Error(`Unknown provider: ${providerId}`);
        }
        
        try {
            const result = await provider.signIn(options);
            
            if (result.success && result.user) {
                await this.completeSignIn(result, providerId);
            } else {
                throw new Error(result.error?.message || 'Sign-in failed');
            }
        } catch (error) {
            this.emit({ type: 'SIGN_IN_FAILED', error: error as Error });
            throw error;
        }
    }
    
    /**
     * Complete sign-in process
     */
    private async completeSignIn(
        result: AuthResult,
        providerId: string
    ): Promise<void> {
        // Store tokens
        if (result.tokens) {
            this.tokenStorage.storeTokens(result.tokens, providerId);
        }
        
        // Build and cache profile
        if (result.tokens?.idToken) {
            const claims = this.parseIdToken(result.tokens.idToken);
            this.profileManager.updateFromOAuth(claims, providerId as 'microsoft' | 'google');
        }
        
        // Update state
        this.state = {
            isAuthenticated: true,
            user: this.profileManager.getProfile(),
            provider: providerId as 'microsoft' | 'google',
            tokens: {
                hasAccessToken: true,
                expiresAt: result.tokens?.expiresAt || null,
                hasRefreshToken: !!result.tokens?.refreshToken
            },
            sessionStart: new Date(),
            lastActivity: new Date()
        };
        
        // Schedule token refresh
        if (result.tokens?.expiresAt) {
            this.scheduleTokenRefresh(result.tokens.expiresAt);
        }
        
        // Notify listeners
        this.notifyListeners();
        this.emit({ type: 'SIGN_IN_COMPLETED', user: this.state.user! });
    }
    
    private parseIdToken(idToken: string): IDTokenClaims {
        const parts = idToken.split('.');
        const payload = JSON.parse(atob(parts[1]));
        return payload;
    }
}
```

---

## 3. Session Maintenance

### 3.1 Token Refresh

```
┌─────────────────────────────────────────────────────────────────┐
│                    TOKEN REFRESH TIMELINE                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Token Issued         Refresh Window          Token Expires     │
│       │                    │                       │            │
│       ▼                    ▼                       ▼            │
│  ─────┼────────────────────┼───────────────────────┼────────   │
│       │                    │                       │            │
│       │◄────── 55 min ────►│◄──── 5 min ─────────►│            │
│       │    Normal use      │  Refresh happens     │            │
│       │                    │  before expiry       │            │
│                                                                 │
│  Timeline:                                                      │
│  • t=0:     Token issued (1 hour validity)                     │
│  • t=55min: Refresh timer fires                                │
│  • t=55min: New token requested using refresh_token            │
│  • t=55min: New token received, timer rescheduled              │
│  • t=60min: Old token would have expired (but we refreshed!)   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Activity Tracking

```typescript
/**
 * Track user activity for session management
 */
class ActivityTracker {
    private lastActivity: Date = new Date();
    private activityTimer: number | null = null;
    private readonly IDLE_TIMEOUT = 30 * 60 * 1000; // 30 minutes
    
    constructor(private sessionManager: SessionManager) {
        this.setupActivityListeners();
    }
    
    /**
     * Listen for user activity
     */
    private setupActivityListeners(): void {
        const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
        
        const handleActivity = this.throttle(() => {
            this.recordActivity();
        }, 1000);
        
        events.forEach(event => {
            document.addEventListener(event, handleActivity, { passive: true });
        });
    }
    
    /**
     * Record activity and reset idle timer
     */
    private recordActivity(): void {
        this.lastActivity = new Date();
        this.sessionManager.updateActivity(this.lastActivity);
        
        // Reset idle timer
        if (this.activityTimer) {
            clearTimeout(this.activityTimer);
        }
        
        this.activityTimer = window.setTimeout(() => {
            this.handleIdle();
        }, this.IDLE_TIMEOUT);
    }
    
    /**
     * Handle idle state
     */
    private handleIdle(): void {
        // Pause token refresh to save resources
        // (will resume on next activity)
        this.sessionManager.pauseTokenRefresh();
    }
    
    private throttle(fn: Function, delay: number): () => void {
        let lastCall = 0;
        return () => {
            const now = Date.now();
            if (now - lastCall >= delay) {
                lastCall = now;
                fn();
            }
        };
    }
}
```

### 3.3 Session State Machine

```typescript
/**
 * Session state machine
 */
type SessionMachineState =
    | 'idle'           // No session
    | 'authenticating' // OAuth in progress
    | 'active'         // Session active
    | 'refreshing'     // Refreshing token
    | 'expired'        // Session expired, needs re-auth
    | 'signing_out';   // Sign-out in progress

type SessionMachineEvent =
    | { type: 'SIGN_IN' }
    | { type: 'SIGN_IN_SUCCESS' }
    | { type: 'SIGN_IN_FAILURE' }
    | { type: 'TOKEN_EXPIRING' }
    | { type: 'TOKEN_REFRESHED' }
    | { type: 'TOKEN_REFRESH_FAILED' }
    | { type: 'SIGN_OUT' }
    | { type: 'SIGN_OUT_COMPLETE' };

const sessionTransitions: Record<SessionMachineState, Partial<Record<SessionMachineEvent['type'], SessionMachineState>>> = {
    idle: {
        SIGN_IN: 'authenticating'
    },
    authenticating: {
        SIGN_IN_SUCCESS: 'active',
        SIGN_IN_FAILURE: 'idle'
    },
    active: {
        TOKEN_EXPIRING: 'refreshing',
        SIGN_OUT: 'signing_out'
    },
    refreshing: {
        TOKEN_REFRESHED: 'active',
        TOKEN_REFRESH_FAILED: 'expired'
    },
    expired: {
        SIGN_IN: 'authenticating',
        SIGN_OUT: 'signing_out'
    },
    signing_out: {
        SIGN_OUT_COMPLETE: 'idle'
    }
};
```

---

## 4. Sign-Out Flow

### 4.1 Sign-Out Process

```
┌─────────────────────────────────────────────────────────────────┐
│                        SIGN-OUT FLOW                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────┐                                                  │
│  │  User    │                                                  │
│  │ clicks   │                                                  │
│  │ Sign Out │                                                  │
│  └────┬─────┘                                                  │
│       │                                                         │
│       ▼                                                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 1. CONFIRM (Optional)                                     │  │
│  │    "Are you sure you want to sign out?"                  │  │
│  │    [Cancel] [Sign Out]                                   │  │
│  └────────────────────────────────────────────────────────┬─┘  │
│       │                                                         │
│       ▼                                                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 2. CLEAN UP LOCAL STATE                                   │  │
│  │    • Cancel pending operations                            │  │
│  │    • Leave collaboration sessions                         │  │
│  │    • Clear in-memory user data                           │  │
│  └────────────────────────────────────────────────────────┬─┘  │
│       │                                                         │
│       ▼                                                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 3. REVOKE TOKENS (Optional but recommended)              │  │
│  │    • Call provider's revoke endpoint                     │  │
│  │    • Invalidates refresh token server-side              │  │
│  └────────────────────────────────────────────────────────┬─┘  │
│       │                                                         │
│       ▼                                                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 4. CLEAR STORAGE                                          │  │
│  │    • Clear sessionStorage (access token, ID token)       │  │
│  │    • Clear localStorage (refresh token)                  │  │
│  │    • Keep preferences if user chose "Stay signed in"    │  │
│  └────────────────────────────────────────────────────────┬─┘  │
│       │                                                         │
│       ▼                                                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 5. REDIRECT TO SIGN-IN                                    │  │
│  │    • Show sign-in UI                                     │  │
│  │    • Or redirect to landing page                         │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Sign-Out Implementation

```typescript
/**
 * Sign-out handler
 */
class SignOutHandler {
    constructor(
        private sessionManager: SessionManager,
        private tokenStorage: TokenStorage,
        private profileManager: ProfileManager,
        private collaborationManager: CollaborationManager
    ) {}
    
    /**
     * Perform complete sign-out
     */
    async signOut(options: SignOutOptions = {}): Promise<void> {
        const { keepPreferences = true, revokeTokens = true } = options;
        
        try {
            // 1. Notify that sign-out is starting
            this.sessionManager.emit({ type: 'SIGN_OUT_STARTED' });
            
            // 2. Leave collaboration sessions
            await this.collaborationManager.leaveAllSessions();
            
            // 3. Cancel pending operations
            this.cancelPendingOperations();
            
            // 4. Revoke tokens with provider (optional)
            if (revokeTokens) {
                await this.revokeTokens();
            }
            
            // 5. Clear storage
            this.clearStorage(keepPreferences);
            
            // 6. Clear in-memory state
            this.profileManager.clear();
            
            // 7. Notify completion
            this.sessionManager.emit({ type: 'SIGN_OUT_COMPLETED' });
            
        } catch (error) {
            console.error('Error during sign-out:', error);
            // Still clear local state even if revoke fails
            this.clearStorage(keepPreferences);
            throw error;
        }
    }
    
    /**
     * Revoke tokens with OAuth provider
     */
    private async revokeTokens(): Promise<void> {
        const provider = this.sessionManager.getActiveProvider();
        if (!provider) return;
        
        const refreshToken = this.tokenStorage.getRefreshToken();
        if (!refreshToken) return;
        
        try {
            await provider.revokeToken(refreshToken);
        } catch (error) {
            // Log but don't fail sign-out
            console.warn('Token revocation failed:', error);
        }
    }
    
    /**
     * Clear browser storage
     */
    private clearStorage(keepPreferences: boolean): void {
        // Always clear tokens
        this.tokenStorage.clearTokens();
        
        // Clear profile cache
        this.profileManager.clearCache();
        
        // Optionally keep preferences
        if (!keepPreferences) {
            localStorage.removeItem('story:preferences');
        }
    }
    
    /**
     * Cancel any pending async operations
     */
    private cancelPendingOperations(): void {
        // Cancel file saves
        // Cancel pending uploads
        // Cancel pending API calls
        window.dispatchEvent(new CustomEvent('story:cancel-operations'));
    }
}

interface SignOutOptions {
    /** Keep user preferences (theme, etc.) */
    keepPreferences?: boolean;
    
    /** Revoke tokens with OAuth provider */
    revokeTokens?: boolean;
}
```

---

## 5. Session Recovery

### 5.1 Recovery Scenarios

```
┌─────────────────────────────────────────────────────────────────┐
│                   SESSION RECOVERY SCENARIOS                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  SCENARIO 1: Page Reload                                        │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  • sessionStorage preserved (access token intact)         │ │
│  │  • localStorage preserved (refresh token intact)          │ │
│  │  • Recovery: Instant (no network call needed)            │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  SCENARIO 2: Browser Restart                                    │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  • sessionStorage cleared (access token gone)             │ │
│  │  • localStorage preserved (refresh token intact)          │ │
│  │  • Recovery: Silent refresh (use refresh token)          │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  SCENARIO 3: Token Expired                                      │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  • Access token expired                                   │ │
│  │  • Refresh token may or may not be valid                 │ │
│  │  • Recovery: Try refresh, fall back to re-auth           │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  SCENARIO 4: Refresh Token Revoked                              │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  • User revoked app access at provider                    │ │
│  │  • Refresh attempt fails with invalid_grant              │ │
│  │  • Recovery: Full re-authentication required             │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Recovery Implementation

```typescript
/**
 * Session recovery handler
 */
class SessionRecovery {
    constructor(
        private sessionManager: SessionManager,
        private tokenStorage: TokenStorage
    ) {}
    
    /**
     * Attempt to recover session on app start
     */
    async recover(): Promise<RecoveryResult> {
        // Step 1: Check for access token in session storage
        const accessToken = this.tokenStorage.getAccessToken();
        if (accessToken) {
            // Token exists and not expired - instant recovery
            return {
                status: 'recovered',
                method: 'session_storage'
            };
        }
        
        // Step 2: Check for refresh token in local storage
        const refreshToken = this.tokenStorage.getRefreshToken();
        if (!refreshToken) {
            // No tokens - need full sign-in
            return {
                status: 'needs_auth',
                method: 'none'
            };
        }
        
        // Step 3: Try silent refresh
        const provider = this.tokenStorage.getProvider();
        if (!provider) {
            return {
                status: 'needs_auth',
                method: 'none'
            };
        }
        
        try {
            const result = await this.sessionManager.silentRefresh(provider);
            
            if (result.success) {
                return {
                    status: 'recovered',
                    method: 'token_refresh'
                };
            }
        } catch (error) {
            console.warn('Session recovery failed:', error);
        }
        
        // Step 4: Refresh failed - need re-auth
        this.tokenStorage.clearTokens();
        
        return {
            status: 'needs_auth',
            method: 'refresh_failed',
            error: 'Session expired. Please sign in again.'
        };
    }
}

interface RecoveryResult {
    status: 'recovered' | 'needs_auth';
    method: 'session_storage' | 'token_refresh' | 'refresh_failed' | 'none';
    error?: string;
}
```

---

## 6. Cross-Tab Synchronization

### 6.1 Tab Sync Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                   CROSS-TAB SESSION SYNC                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐          │
│  │    Tab 1    │   │    Tab 2    │   │    Tab 3    │          │
│  │  (Active)   │   │  (Inactive) │   │  (Inactive) │          │
│  └──────┬──────┘   └──────┬──────┘   └──────┬──────┘          │
│         │                 │                 │                   │
│         │    BroadcastChannel: 'story-session'                 │
│         │◄────────────────┼─────────────────┤                   │
│         │                 │                 │                   │
│         │                 │                 │                   │
│  User signs out in Tab 1                                       │
│         │                 │                 │                   │
│         ├────────────────►│                 │                   │
│         │  { type: 'SIGN_OUT' }             │                   │
│         │                 │                 │                   │
│         │                 ├────────────────►│                   │
│         │                 │  { type: 'SIGN_OUT' }               │
│         │                 │                 │                   │
│         │           Tab 2 & 3 also sign out                    │
│         │                 │                 │                   │
│         ▼                 ▼                 ▼                   │
│  All tabs now signed out                                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 Tab Sync Implementation

```typescript
/**
 * Cross-tab session synchronization
 */
class SessionTabSync {
    private channel: BroadcastChannel;
    private sessionManager: SessionManager;
    
    constructor(sessionManager: SessionManager) {
        this.sessionManager = sessionManager;
        this.channel = new BroadcastChannel('story-session');
        
        this.channel.onmessage = (event) => {
            this.handleMessage(event.data);
        };
        
        // Also listen for storage events (fallback for older browsers)
        window.addEventListener('storage', (event) => {
            this.handleStorageEvent(event);
        });
    }
    
    /**
     * Broadcast session change to other tabs
     */
    broadcast(message: TabSyncMessage): void {
        this.channel.postMessage(message);
    }
    
    /**
     * Handle message from another tab
     */
    private handleMessage(message: TabSyncMessage): void {
        switch (message.type) {
            case 'SIGN_IN':
                // Another tab signed in - update our state
                this.sessionManager.syncFromOtherTab(message.user);
                break;
                
            case 'SIGN_OUT':
                // Another tab signed out - sign out here too
                this.sessionManager.signOutLocal();
                break;
                
            case 'TOKEN_REFRESHED':
                // Another tab refreshed token - update our timer
                this.sessionManager.syncTokenExpiry(message.expiresAt);
                break;
                
            case 'PROFILE_UPDATED':
                // User updated their profile in another tab
                this.sessionManager.syncProfile(message.profile);
                break;
        }
    }
    
    /**
     * Handle localStorage changes (fallback)
     */
    private handleStorageEvent(event: StorageEvent): void {
        if (event.key === 'story_oauth_refresh_token') {
            if (event.newValue === null && event.oldValue !== null) {
                // Refresh token was cleared - sign out
                this.sessionManager.signOutLocal();
            }
        }
    }
    
    /**
     * Clean up on page unload
     */
    destroy(): void {
        this.channel.close();
    }
}

type TabSyncMessage =
    | { type: 'SIGN_IN'; user: UserProfile }
    | { type: 'SIGN_OUT' }
    | { type: 'TOKEN_REFRESHED'; expiresAt: Date }
    | { type: 'PROFILE_UPDATED'; profile: Partial<UserProfile> };
```

---

## Related Specifications

- [Identity Architecture](./identity-architecture.md) - Overall architecture
- [OAuth Identity Flow](./oauth-identity-flow.md) - Token handling
- [Cross-Device Identity](./cross-device-identity.md) - Multi-device considerations
- [Cross-Tab Coordination](../storage/cross-tab-coordination.md) - Tab synchronization

---

*Session management in Story is entirely client-side, with no server session state.*
