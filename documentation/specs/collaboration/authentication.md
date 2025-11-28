# Authentication - Specification

## Overview

This specification defines the **authentication system** for Story, supporting multiple identity providers (Microsoft, Google) with a unified abstraction layer. The design ensures:

1. **Single Sign-On** - Use existing Microsoft/Google accounts
2. **Provider flexibility** - Easy to add/switch providers
3. **Secure token management** - PKCE flow, secure storage
4. **Seamless integration** - With cloud storage and real-time services

**Related Specifications:**
- [Cloud Storage Abstraction](./cloud-storage-abstraction.md) - Uses auth tokens
- [Azure SignalR Integration](./azure-signalr-integration.md) - Authenticated connections
- [Collaboration Protocol](./collaboration-protocol.md) - User identity

---

## Table of Contents

1. [Architecture](#1-architecture)
2. [Provider Interface](#2-provider-interface)
3. [Microsoft (Azure AD) Provider](#3-microsoft-azure-ad-provider)
4. [Google Provider](#4-google-provider)
5. [Token Management](#5-token-management)
6. [Session Management](#6-session-management)
7. [Implementation Guide](#7-implementation-guide)

---

## 1. Architecture

### 1.1 Authentication Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      STORY APPLICATION                          │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  AuthenticationManager                                   │   │
│  │  • Provider selection                                    │   │
│  │  • Session management                                    │   │
│  │  • Token refresh                                         │   │
│  └───────────────────────────┬─────────────────────────────┘   │
│                              │                                  │
│         ┌────────────────────┼────────────────────┐            │
│         ▼                    ▼                    ▼            │
│  ┌─────────────┐    ┌─────────────────┐    ┌─────────────┐    │
│  │  Microsoft  │    │     Google      │    │   Future    │    │
│  │  Provider   │    │    Provider     │    │  Provider   │    │
│  │  (MSAL.js)  │    │   (gapi/GIS)    │    │             │    │
│  └──────┬──────┘    └────────┬────────┘    └─────────────┘    │
│         │                    │                                  │
└─────────│────────────────────│──────────────────────────────────┘
          │                    │
          ▼                    ▼
   ┌─────────────┐    ┌─────────────────┐
   │  Azure AD   │    │ Google Identity │
   │  (OAuth 2)  │    │   (OAuth 2)     │
   └─────────────┘    └─────────────────┘
```

### 1.2 OAuth 2.0 PKCE Flow

```
┌──────────────┐                              ┌─────────────────┐
│   Browser    │                              │ Identity Server │
│  (Story App) │                              │ (Azure AD/Google)│
└──────┬───────┘                              └────────┬────────┘
       │                                               │
       │  1. Generate code_verifier + code_challenge  │
       │                                               │
       │  2. Redirect to /authorize                    │
       │  ─────────────────────────────────────────►  │
       │     ?client_id=...                           │
       │     &redirect_uri=...                        │
       │     &code_challenge=...                      │
       │     &code_challenge_method=S256              │
       │                                               │
       │  3. User authenticates                        │
       │  ◄─────────────────────────────────────────  │
       │                                               │
       │  4. Redirect back with code                   │
       │  ◄─────────────────────────────────────────  │
       │     ?code=...                                │
       │                                               │
       │  5. Exchange code for tokens                  │
       │  ─────────────────────────────────────────►  │
       │     POST /token                              │
       │     { code, code_verifier, ... }             │
       │                                               │
       │  6. Receive tokens                            │
       │  ◄─────────────────────────────────────────  │
       │     { access_token, refresh_token, id_token }│
       │                                               │
       ▼                                               ▼
```

---

## 2. Provider Interface

### 2.1 AuthProvider Interface

```typescript
/**
 * Abstract interface for authentication providers.
 * Implement this interface to add support for a new identity provider.
 */
interface AuthProvider {
    /** Provider identifier */
    readonly providerId: 'microsoft' | 'google' | string;
    
    /** Human-readable name */
    readonly displayName: string;
    
    /** Provider logo URL */
    readonly logoUrl: string;
    
    // ─────────────────────────────────────────────────────────
    // Authentication
    // ─────────────────────────────────────────────────────────
    
    /** Check if user is currently authenticated */
    isAuthenticated(): boolean;
    
    /** Get current user info without triggering auth */
    getCurrentUser(): Promise<AuthUser | null>;
    
    /** Initiate sign-in flow */
    signIn(options?: SignInOptions): Promise<AuthResult>;
    
    /** Sign in silently using cached tokens */
    signInSilent(): Promise<AuthResult>;
    
    /** Sign out and clear all tokens */
    signOut(): Promise<void>;
    
    // ─────────────────────────────────────────────────────────
    // Token Management
    // ─────────────────────────────────────────────────────────
    
    /** Get access token for API calls */
    getAccessToken(scopes?: string[]): Promise<string>;
    
    /** Force token refresh */
    refreshToken(): Promise<AuthTokens>;
    
    /** Get token expiration time */
    getTokenExpiration(): Date | null;
}
```

### 2.2 Supporting Types

```typescript
interface AuthUser {
    /** Unique user ID from provider */
    id: string;
    
    /** Email address */
    email: string;
    
    /** Display name */
    displayName: string;
    
    /** First name */
    givenName?: string;
    
    /** Last name */
    familyName?: string;
    
    /** Avatar URL */
    avatarUrl?: string;
    
    /** Provider that authenticated this user */
    provider: string;
}

interface SignInOptions {
    /** Requested scopes */
    scopes?: string[];
    
    /** Force account selection */
    prompt?: 'select_account' | 'consent' | 'login' | 'none';
    
    /** Login hint (email) */
    loginHint?: string;
    
    /** Use popup instead of redirect */
    usePopup?: boolean;
}

interface AuthResult {
    success: boolean;
    user?: AuthUser;
    tokens?: AuthTokens;
    error?: AuthError;
}

interface AuthTokens {
    accessToken: string;
    idToken?: string;
    refreshToken?: string;
    expiresAt: Date;
    scopes: string[];
}

interface AuthError {
    code: string;
    message: string;
    details?: any;
}
```

---

## 3. Microsoft (Azure AD) Provider

### 3.1 Azure AD App Registration

```json
// Azure Portal → Azure Active Directory → App registrations
{
    "displayName": "Story",
    "signInAudience": "AzureADandPersonalMicrosoftAccount",
    "spa": {
        "redirectUris": [
            "https://story.app/auth/callback",
            "http://localhost:3000/auth/callback"
        ]
    },
    "requiredResourceAccess": [
        {
            "resourceAppId": "Microsoft Graph",
            "resourceAccess": [
                { "id": "Files.ReadWrite", "type": "Scope" },
                { "id": "User.Read", "type": "Scope" },
                { "id": "offline_access", "type": "Scope" }
            ]
        }
    ]
}
```

### 3.2 MSAL.js Implementation

```typescript
import * as msal from '@azure/msal-browser';

class MicrosoftAuthProvider implements AuthProvider {
    readonly providerId = 'microsoft';
    readonly displayName = 'Microsoft';
    readonly logoUrl = '/icons/microsoft.svg';
    
    private msalInstance: msal.PublicClientApplication;
    private account: msal.AccountInfo | null = null;
    
    constructor(config: MicrosoftAuthConfig) {
        const msalConfig: msal.Configuration = {
            auth: {
                clientId: config.clientId,
                authority: 'https://login.microsoftonline.com/common',
                redirectUri: config.redirectUri,
                postLogoutRedirectUri: config.postLogoutRedirectUri
            },
            cache: {
                cacheLocation: 'localStorage',
                storeAuthStateInCookie: false
            },
            system: {
                loggerOptions: {
                    logLevel: msal.LogLevel.Warning
                }
            }
        };
        
        this.msalInstance = new msal.PublicClientApplication(msalConfig);
        
        // Handle redirect callback
        this.msalInstance.handleRedirectPromise()
            .then(response => this.handleResponse(response))
            .catch(error => console.error('MSAL redirect error:', error));
    }
    
    // ─────────────────────────────────────────────────────────
    // Authentication
    // ─────────────────────────────────────────────────────────
    
    isAuthenticated(): boolean {
        const accounts = this.msalInstance.getAllAccounts();
        return accounts.length > 0;
    }
    
    async getCurrentUser(): Promise<AuthUser | null> {
        const accounts = this.msalInstance.getAllAccounts();
        if (accounts.length === 0) return null;
        
        this.account = accounts[0];
        return this.mapAccountToUser(this.account);
    }
    
    async signIn(options: SignInOptions = {}): Promise<AuthResult> {
        const scopes = options.scopes || ['User.Read', 'Files.ReadWrite', 'offline_access'];
        
        const loginRequest: msal.PopupRequest = {
            scopes,
            prompt: options.prompt,
            loginHint: options.loginHint
        };
        
        try {
            let response: msal.AuthenticationResult;
            
            if (options.usePopup) {
                response = await this.msalInstance.loginPopup(loginRequest);
            } else {
                await this.msalInstance.loginRedirect(loginRequest);
                // Redirect - result handled in handleRedirectPromise
                return { success: false, error: { code: 'redirect', message: 'Redirecting...' } };
            }
            
            return this.handleResponse(response);
        } catch (error) {
            return this.handleError(error);
        }
    }
    
    async signInSilent(): Promise<AuthResult> {
        const accounts = this.msalInstance.getAllAccounts();
        if (accounts.length === 0) {
            return { success: false, error: { code: 'no_account', message: 'No cached account' } };
        }
        
        const silentRequest: msal.SilentRequest = {
            scopes: ['User.Read', 'Files.ReadWrite'],
            account: accounts[0]
        };
        
        try {
            const response = await this.msalInstance.acquireTokenSilent(silentRequest);
            return this.handleResponse(response);
        } catch (error) {
            if (error instanceof msal.InteractionRequiredAuthError) {
                // Need interactive login
                return { success: false, error: { code: 'interaction_required', message: 'Please sign in' } };
            }
            return this.handleError(error);
        }
    }
    
    async signOut(): Promise<void> {
        const account = this.msalInstance.getAllAccounts()[0];
        
        if (account) {
            await this.msalInstance.logoutPopup({
                account,
                postLogoutRedirectUri: window.location.origin
            });
        }
        
        this.account = null;
    }
    
    // ─────────────────────────────────────────────────────────
    // Token Management
    // ─────────────────────────────────────────────────────────
    
    async getAccessToken(scopes: string[] = ['Files.ReadWrite']): Promise<string> {
        const accounts = this.msalInstance.getAllAccounts();
        if (accounts.length === 0) {
            throw new Error('No authenticated account');
        }
        
        const silentRequest: msal.SilentRequest = {
            scopes,
            account: accounts[0]
        };
        
        try {
            const response = await this.msalInstance.acquireTokenSilent(silentRequest);
            return response.accessToken;
        } catch (error) {
            if (error instanceof msal.InteractionRequiredAuthError) {
                // Try popup
                const response = await this.msalInstance.acquireTokenPopup({ scopes });
                return response.accessToken;
            }
            throw error;
        }
    }
    
    async refreshToken(): Promise<AuthTokens> {
        const token = await this.getAccessToken();
        const accounts = this.msalInstance.getAllAccounts();
        
        return {
            accessToken: token,
            expiresAt: new Date(Date.now() + 3600 * 1000), // 1 hour
            scopes: ['User.Read', 'Files.ReadWrite']
        };
    }
    
    getTokenExpiration(): Date | null {
        // MSAL handles this internally
        return null;
    }
    
    // ─────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────
    
    private handleResponse(response: msal.AuthenticationResult | null): AuthResult {
        if (!response) {
            return { success: false };
        }
        
        this.account = response.account;
        
        return {
            success: true,
            user: this.mapAccountToUser(response.account),
            tokens: {
                accessToken: response.accessToken,
                idToken: response.idToken,
                expiresAt: response.expiresOn || new Date(Date.now() + 3600 * 1000),
                scopes: response.scopes
            }
        };
    }
    
    private handleError(error: any): AuthResult {
        console.error('Microsoft auth error:', error);
        
        return {
            success: false,
            error: {
                code: error.errorCode || 'unknown',
                message: error.errorMessage || error.message || 'Authentication failed',
                details: error
            }
        };
    }
    
    private mapAccountToUser(account: msal.AccountInfo): AuthUser {
        return {
            id: account.homeAccountId,
            email: account.username,
            displayName: account.name || account.username,
            provider: 'microsoft'
        };
    }
}

interface MicrosoftAuthConfig {
    clientId: string;
    redirectUri: string;
    postLogoutRedirectUri?: string;
}
```

---

## 4. Google Provider

### 4.1 Google Cloud Console Setup

```json
// Google Cloud Console → APIs & Services → Credentials
{
    "web": {
        "client_id": "YOUR_CLIENT_ID.apps.googleusercontent.com",
        "project_id": "story-app",
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token",
        "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
        "javascript_origins": [
            "https://story.app",
            "http://localhost:3000"
        ]
    }
}
```

### 4.2 Google Identity Services Implementation

```typescript
class GoogleAuthProvider implements AuthProvider {
    readonly providerId = 'google';
    readonly displayName = 'Google';
    readonly logoUrl = '/icons/google.svg';
    
    private tokenClient: google.accounts.oauth2.TokenClient | null = null;
    private accessToken: string | null = null;
    private tokenExpiration: Date | null = null;
    private user: AuthUser | null = null;
    
    constructor(private config: GoogleAuthConfig) {
        this.initializeGIS();
    }
    
    private async initializeGIS(): Promise<void> {
        // Load Google Identity Services library
        await this.loadScript('https://accounts.google.com/gsi/client');
        
        // Initialize token client
        this.tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: this.config.clientId,
            scope: this.config.scopes.join(' '),
            callback: (response) => this.handleTokenResponse(response)
        });
    }
    
    private loadScript(src: string): Promise<void> {
        return new Promise((resolve, reject) => {
            if (document.querySelector(`script[src="${src}"]`)) {
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.src = src;
            script.async = true;
            script.defer = true;
            script.onload = () => resolve();
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
    
    // ─────────────────────────────────────────────────────────
    // Authentication
    // ─────────────────────────────────────────────────────────
    
    isAuthenticated(): boolean {
        return this.accessToken !== null && 
               this.tokenExpiration !== null && 
               this.tokenExpiration > new Date();
    }
    
    async getCurrentUser(): Promise<AuthUser | null> {
        if (!this.accessToken) return null;
        
        if (!this.user) {
            await this.fetchUserInfo();
        }
        
        return this.user;
    }
    
    async signIn(options: SignInOptions = {}): Promise<AuthResult> {
        return new Promise((resolve) => {
            this.pendingResolve = resolve;
            
            // Request access token
            this.tokenClient?.requestAccessToken({
                prompt: options.prompt === 'select_account' ? 'select_account' : '',
                hint: options.loginHint
            });
        });
    }
    
    private pendingResolve: ((result: AuthResult) => void) | null = null;
    
    private async handleTokenResponse(response: google.accounts.oauth2.TokenResponse): Promise<void> {
        if (response.error) {
            this.pendingResolve?.({
                success: false,
                error: {
                    code: response.error,
                    message: response.error_description || 'Google sign-in failed'
                }
            });
            return;
        }
        
        this.accessToken = response.access_token;
        this.tokenExpiration = new Date(Date.now() + response.expires_in * 1000);
        
        // Fetch user info
        await this.fetchUserInfo();
        
        this.pendingResolve?.({
            success: true,
            user: this.user!,
            tokens: {
                accessToken: this.accessToken,
                expiresAt: this.tokenExpiration,
                scopes: response.scope.split(' ')
            }
        });
    }
    
    private async fetchUserInfo(): Promise<void> {
        const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: {
                'Authorization': `Bearer ${this.accessToken}`
            }
        });
        
        const data = await response.json();
        
        this.user = {
            id: data.sub,
            email: data.email,
            displayName: data.name,
            givenName: data.given_name,
            familyName: data.family_name,
            avatarUrl: data.picture,
            provider: 'google'
        };
    }
    
    async signInSilent(): Promise<AuthResult> {
        // Check if we have a valid token in storage
        const storedToken = localStorage.getItem('google_access_token');
        const storedExpiration = localStorage.getItem('google_token_expiration');
        
        if (storedToken && storedExpiration) {
            const expiration = new Date(storedExpiration);
            if (expiration > new Date()) {
                this.accessToken = storedToken;
                this.tokenExpiration = expiration;
                await this.fetchUserInfo();
                
                return {
                    success: true,
                    user: this.user!,
                    tokens: {
                        accessToken: this.accessToken,
                        expiresAt: this.tokenExpiration,
                        scopes: this.config.scopes
                    }
                };
            }
        }
        
        return {
            success: false,
            error: { code: 'no_token', message: 'No valid token found' }
        };
    }
    
    async signOut(): Promise<void> {
        if (this.accessToken) {
            // Revoke token
            google.accounts.oauth2.revoke(this.accessToken, () => {
                console.log('Google token revoked');
            });
        }
        
        this.accessToken = null;
        this.tokenExpiration = null;
        this.user = null;
        
        localStorage.removeItem('google_access_token');
        localStorage.removeItem('google_token_expiration');
    }
    
    // ─────────────────────────────────────────────────────────
    // Token Management
    // ─────────────────────────────────────────────────────────
    
    async getAccessToken(): Promise<string> {
        if (!this.accessToken) {
            throw new Error('Not authenticated');
        }
        
        // Check if token is expired or expiring soon
        if (this.tokenExpiration && this.tokenExpiration < new Date(Date.now() + 5 * 60 * 1000)) {
            // Refresh token
            await this.refreshToken();
        }
        
        return this.accessToken;
    }
    
    async refreshToken(): Promise<AuthTokens> {
        // Google's token client doesn't support refresh tokens for SPAs
        // Need to request a new token (may require interaction)
        return new Promise((resolve, reject) => {
            this.tokenClient?.requestAccessToken({
                prompt: ''  // Try silent
            });
            
            // Set up a timeout for silent failure
            setTimeout(() => {
                if (!this.isAuthenticated()) {
                    reject(new Error('Token refresh failed'));
                } else {
                    resolve({
                        accessToken: this.accessToken!,
                        expiresAt: this.tokenExpiration!,
                        scopes: this.config.scopes
                    });
                }
            }, 5000);
        });
    }
    
    getTokenExpiration(): Date | null {
        return this.tokenExpiration;
    }
}

interface GoogleAuthConfig {
    clientId: string;
    scopes: string[];
}
```

---

## 5. Token Management

### 5.1 Secure Token Storage

```typescript
class TokenStorage {
    private readonly STORAGE_KEY_PREFIX = 'story_auth_';
    
    /**
     * Store tokens securely
     * Uses sessionStorage for access tokens (cleared on tab close)
     * Uses localStorage for refresh tokens (persistent)
     */
    storeTokens(providerId: string, tokens: AuthTokens): void {
        // Access token in session storage (memory-like)
        sessionStorage.setItem(
            `${this.STORAGE_KEY_PREFIX}${providerId}_access`,
            JSON.stringify({
                token: tokens.accessToken,
                expiresAt: tokens.expiresAt.toISOString()
            })
        );
        
        // Refresh token in localStorage (if available)
        if (tokens.refreshToken) {
            localStorage.setItem(
                `${this.STORAGE_KEY_PREFIX}${providerId}_refresh`,
                tokens.refreshToken
            );
        }
    }
    
    getAccessToken(providerId: string): { token: string; expiresAt: Date } | null {
        const stored = sessionStorage.getItem(`${this.STORAGE_KEY_PREFIX}${providerId}_access`);
        if (!stored) return null;
        
        const { token, expiresAt } = JSON.parse(stored);
        return {
            token,
            expiresAt: new Date(expiresAt)
        };
    }
    
    getRefreshToken(providerId: string): string | null {
        return localStorage.getItem(`${this.STORAGE_KEY_PREFIX}${providerId}_refresh`);
    }
    
    clearTokens(providerId: string): void {
        sessionStorage.removeItem(`${this.STORAGE_KEY_PREFIX}${providerId}_access`);
        localStorage.removeItem(`${this.STORAGE_KEY_PREFIX}${providerId}_refresh`);
    }
    
    clearAllTokens(): void {
        // Clear all auth-related storage
        for (let i = sessionStorage.length - 1; i >= 0; i--) {
            const key = sessionStorage.key(i);
            if (key?.startsWith(this.STORAGE_KEY_PREFIX)) {
                sessionStorage.removeItem(key);
            }
        }
        
        for (let i = localStorage.length - 1; i >= 0; i--) {
            const key = localStorage.key(i);
            if (key?.startsWith(this.STORAGE_KEY_PREFIX)) {
                localStorage.removeItem(key);
            }
        }
    }
}
```

### 5.2 Token Refresh Manager

```typescript
class TokenRefreshManager {
    private refreshTimers = new Map<string, number>();
    
    constructor(private providers: Map<string, AuthProvider>) {}
    
    /**
     * Schedule automatic token refresh before expiration
     */
    scheduleRefresh(providerId: string, expiresAt: Date): void {
        // Clear existing timer
        this.cancelRefresh(providerId);
        
        // Refresh 5 minutes before expiration
        const refreshTime = expiresAt.getTime() - 5 * 60 * 1000 - Date.now();
        
        if (refreshTime > 0) {
            const timerId = window.setTimeout(async () => {
                await this.refreshToken(providerId);
            }, refreshTime);
            
            this.refreshTimers.set(providerId, timerId);
        }
    }
    
    cancelRefresh(providerId: string): void {
        const timerId = this.refreshTimers.get(providerId);
        if (timerId) {
            clearTimeout(timerId);
            this.refreshTimers.delete(providerId);
        }
    }
    
    private async refreshToken(providerId: string): Promise<void> {
        const provider = this.providers.get(providerId);
        if (!provider) return;
        
        try {
            const tokens = await provider.refreshToken();
            this.scheduleRefresh(providerId, tokens.expiresAt);
            console.log(`Token refreshed for ${providerId}`);
        } catch (error) {
            console.error(`Token refresh failed for ${providerId}:`, error);
            // Emit event for UI to handle
            window.dispatchEvent(new CustomEvent('auth:refresh-failed', {
                detail: { providerId, error }
            }));
        }
    }
}
```

---

## 6. Session Management

### 6.1 Authentication Manager

```typescript
class AuthenticationManager {
    private providers = new Map<string, AuthProvider>();
    private activeProvider: AuthProvider | null = null;
    private currentUser: AuthUser | null = null;
    private tokenStorage = new TokenStorage();
    private refreshManager: TokenRefreshManager;
    
    constructor() {
        // Register providers
        this.registerProvider(new MicrosoftAuthProvider({
            clientId: process.env.MICROSOFT_CLIENT_ID!,
            redirectUri: `${window.location.origin}/auth/callback`
        }));
        
        this.registerProvider(new GoogleAuthProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            scopes: [
                'https://www.googleapis.com/auth/drive.file',
                'https://www.googleapis.com/auth/userinfo.profile',
                'https://www.googleapis.com/auth/userinfo.email'
            ]
        }));
        
        this.refreshManager = new TokenRefreshManager(this.providers);
    }
    
    registerProvider(provider: AuthProvider): void {
        this.providers.set(provider.providerId, provider);
    }
    
    getProviders(): AuthProvider[] {
        return Array.from(this.providers.values());
    }
    
    // ─────────────────────────────────────────────────────────
    // Session Management
    // ─────────────────────────────────────────────────────────
    
    /**
     * Try to restore session from storage
     */
    async restoreSession(): Promise<AuthUser | null> {
        // Check each provider for valid session
        for (const [providerId, provider] of this.providers) {
            try {
                const result = await provider.signInSilent();
                if (result.success && result.user) {
                    this.activeProvider = provider;
                    this.currentUser = result.user;
                    
                    if (result.tokens) {
                        this.refreshManager.scheduleRefresh(providerId, result.tokens.expiresAt);
                    }
                    
                    return result.user;
                }
            } catch {
                // Continue to next provider
            }
        }
        
        return null;
    }
    
    /**
     * Sign in with specific provider
     */
    async signIn(providerId: string, options?: SignInOptions): Promise<AuthResult> {
        const provider = this.providers.get(providerId);
        if (!provider) {
            return {
                success: false,
                error: { code: 'unknown_provider', message: `Unknown provider: ${providerId}` }
            };
        }
        
        const result = await provider.signIn(options);
        
        if (result.success && result.user) {
            this.activeProvider = provider;
            this.currentUser = result.user;
            
            if (result.tokens) {
                this.tokenStorage.storeTokens(providerId, result.tokens);
                this.refreshManager.scheduleRefresh(providerId, result.tokens.expiresAt);
            }
        }
        
        return result;
    }
    
    /**
     * Sign out from current session
     */
    async signOut(): Promise<void> {
        if (this.activeProvider) {
            await this.activeProvider.signOut();
            this.tokenStorage.clearTokens(this.activeProvider.providerId);
            this.refreshManager.cancelRefresh(this.activeProvider.providerId);
        }
        
        this.activeProvider = null;
        this.currentUser = null;
    }
    
    /**
     * Get current authenticated user
     */
    getCurrentUser(): AuthUser | null {
        return this.currentUser;
    }
    
    /**
     * Get access token for API calls
     */
    async getAccessToken(scopes?: string[]): Promise<string> {
        if (!this.activeProvider) {
            throw new Error('Not authenticated');
        }
        
        return this.activeProvider.getAccessToken(scopes);
    }
    
    /**
     * Check if user is authenticated
     */
    isAuthenticated(): boolean {
        return this.activeProvider?.isAuthenticated() ?? false;
    }
    
    /**
     * Get active provider ID
     */
    getActiveProviderId(): string | null {
        return this.activeProvider?.providerId ?? null;
    }
}
```

### 6.2 Auth Context for UI

```typescript
// React context example
interface AuthContextType {
    user: AuthUser | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    providerId: string | null;
    signIn: (providerId: string) => Promise<void>;
    signOut: () => Promise<void>;
    getAccessToken: () => Promise<string>;
}

const AuthContext = createContext<AuthContextType | null>(null);

function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const authManager = useMemo(() => new AuthenticationManager(), []);
    
    useEffect(() => {
        // Try to restore session on mount
        authManager.restoreSession()
            .then(user => setUser(user))
            .finally(() => setIsLoading(false));
    }, []);
    
    const signIn = async (providerId: string) => {
        setIsLoading(true);
        const result = await authManager.signIn(providerId);
        if (result.success) {
            setUser(result.user!);
        }
        setIsLoading(false);
    };
    
    const signOut = async () => {
        await authManager.signOut();
        setUser(null);
    };
    
    return (
        <AuthContext.Provider value={{
            user,
            isAuthenticated: !!user,
            isLoading,
            providerId: authManager.getActiveProviderId(),
            signIn,
            signOut,
            getAccessToken: () => authManager.getAccessToken()
        }}>
            {children}
        </AuthContext.Provider>
    );
}
```

---

## 7. Implementation Guide

### 7.1 Sign-In UI

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                      Welcome to Story                           │
│                                                                 │
│         Create beautiful presentations effortlessly            │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  🔵  Continue with Microsoft                             │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  🔴  Continue with Google                                │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│                          ─── or ───                            │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │      Continue without signing in (local only)           │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  By signing in, you agree to our Terms of Service              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 Account Menu

```
┌─────────────────────────────────────────────────────────────────┐
│  Header                                                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  [Logo]  My Presentation        👤 ▼                     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                      │                          │
│                                      ▼                          │
│                         ┌─────────────────────────┐            │
│                         │ 👤 Alice Smith          │            │
│                         │    alice@example.com    │            │
│                         │    Microsoft account    │            │
│                         ├─────────────────────────┤            │
│                         │ ⚙️ Account Settings     │            │
│                         │ 🔗 Connected Services   │            │
│                         ├─────────────────────────┤            │
│                         │ 🚪 Sign Out             │            │
│                         └─────────────────────────┘            │
└─────────────────────────────────────────────────────────────────┘
```

### 7.3 Environment Configuration

```typescript
// .env.local (development)
MICROSOFT_CLIENT_ID=your-azure-ad-client-id
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
AUTH_REDIRECT_URI=http://localhost:3000/auth/callback

// .env.production
MICROSOFT_CLIENT_ID=your-production-client-id
GOOGLE_CLIENT_ID=your-production-client-id.apps.googleusercontent.com
AUTH_REDIRECT_URI=https://story.app/auth/callback
```

### 7.4 Adding a New Provider

1. **Create provider class** implementing `AuthProvider`
2. **Register in AuthenticationManager**:
   ```typescript
   authManager.registerProvider(new AppleAuthProvider(config));
   ```
3. **Add to sign-in UI**
4. **Test OAuth flow**

---

## Related Documents

- [Cloud Storage Abstraction](./cloud-storage-abstraction.md)
- [Azure SignalR Integration](./azure-signalr-integration.md)
- [Collaboration Protocol](./collaboration-protocol.md)
- [Security Model](./security-model.md)

---

*This authentication system provides secure, provider-agnostic identity management for Story.*
