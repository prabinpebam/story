# OAuth Identity Flow

## Overview

This specification details how Story uses **OAuth 2.0 with PKCE** to establish user identity without maintaining a user database. OAuth tokens are not just for authentication - they ARE the identity.

**Related Specifications:**
- [Identity Architecture](./identity-architecture.md) - Overall architecture
- [Session Lifecycle](./session-lifecycle.md) - Session management
- [User Profile Model](./user-profile-model.md) - Profile structure

---

## Table of Contents

1. [OAuth as Identity Source](#1-oauth-as-identity-source)
2. [Token Types and Purposes](#2-token-types-and-purposes)
3. [PKCE Flow](#3-pkce-flow)
4. [ID Token Parsing](#4-id-token-parsing)
5. [Token Storage](#5-token-storage)
6. [Token Refresh](#6-token-refresh)
7. [Provider-Specific Details](#7-provider-specific-details)

---

## 1. OAuth as Identity Source

### 1.1 The Key Insight

```
┌─────────────────────────────────────────────────────────────────┐
│                 TOKEN = IDENTITY                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  TRADITIONAL VIEW:                                              │
│  "Token proves user authenticated → look up user in database"  │
│                                                                 │
│  STORY'S VIEW:                                                  │
│  "Token CONTAINS user identity → no database needed"           │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  ID Token (JWT):                                          │ │
│  │  {                                                        │ │
│  │    "iss": "https://accounts.google.com",                 │ │
│  │    "sub": "117291281634281946283",  ◄── Unique user ID   │ │
│  │    "email": "alice@gmail.com",      ◄── User's email     │ │
│  │    "name": "Alice Smith",           ◄── Display name     │ │
│  │    "picture": "https://..."         ◄── Avatar URL       │ │
│  │  }                                                        │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  Everything we need to know about the user is IN the token.   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Why This Works

| OAuth Provides | How Story Uses It |
|----------------|-------------------|
| Unique user ID (`sub`) | Primary identifier across sessions |
| Email address | Display, contact, file ownership |
| Display name | Show in UI, collaboration |
| Profile picture | Avatar in presence, comments |
| Token expiration | Session management |
| Refresh capability | Long-lived sessions |

---

## 2. Token Types and Purposes

### 2.1 Token Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      TOKEN TYPES                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ACCESS TOKEN                                                   │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  Purpose: Access cloud storage APIs                       │ │
│  │  Format:  Opaque string (varies by provider)              │ │
│  │  Lifespan: Short (1 hour typical)                         │ │
│  │  Storage: Session storage (memory-like)                   │ │
│  │                                                            │ │
│  │  Used for:                                                 │ │
│  │  • Reading files from OneDrive/Google Drive               │ │
│  │  • Writing files to cloud storage                         │ │
│  │  • Managing file sharing                                  │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ID TOKEN                                                       │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  Purpose: User identity information                       │ │
│  │  Format:  JWT (JSON Web Token)                            │ │
│  │  Lifespan: Short (matches access token)                   │ │
│  │  Storage: Parse and cache claims only                     │ │
│  │                                                            │ │
│  │  Contains:                                                 │ │
│  │  • sub (unique user ID)                                   │ │
│  │  • email                                                  │ │
│  │  • name                                                   │ │
│  │  • picture                                                │ │
│  │  • Provider-specific claims                               │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  REFRESH TOKEN                                                  │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  Purpose: Get new access/ID tokens without re-login       │ │
│  │  Format:  Opaque string                                   │ │
│  │  Lifespan: Long (days to months)                          │ │
│  │  Storage: Local storage (encrypted if possible)           │ │
│  │                                                            │ │
│  │  Used for:                                                 │ │
│  │  • Silent token refresh                                   │ │
│  │  • Maintaining session across browser restarts            │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Token Usage Matrix

| Token | Read Files | Write Files | Get User Info | Refresh Tokens |
|-------|------------|-------------|---------------|----------------|
| Access Token | ✅ | ✅ | Via userinfo endpoint | ❌ |
| ID Token | ❌ | ❌ | ✅ (embedded claims) | ❌ |
| Refresh Token | ❌ | ❌ | ❌ | ✅ |

---

## 3. PKCE Flow

### 3.1 Why PKCE?

PKCE (Proof Key for Code Exchange) protects against code interception attacks in public clients (browser apps).

```
┌─────────────────────────────────────────────────────────────────┐
│                       WITHOUT PKCE                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. App redirects to OAuth with client_id                      │
│  2. User authenticates                                          │
│  3. OAuth redirects back with auth code                        │
│  4. ⚠️ Malicious app could intercept code!                     │
│  5. ⚠️ Malicious app exchanges code for tokens                 │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                        WITH PKCE                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. App generates random code_verifier                         │
│  2. App creates code_challenge = SHA256(code_verifier)         │
│  3. App redirects with code_challenge                          │
│  4. User authenticates                                          │
│  5. OAuth redirects with auth code                              │
│  6. App exchanges code + code_verifier                         │
│  7. OAuth verifies SHA256(code_verifier) == code_challenge     │
│  8. ✅ Only the original app can complete the exchange         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Complete PKCE Flow

```
┌──────────────┐                              ┌─────────────────┐
│   Browser    │                              │ OAuth Provider  │
│  (Story App) │                              │ (MS / Google)   │
└──────┬───────┘                              └────────┬────────┘
       │                                               │
       │  ┌──────────────────────────────────────┐    │
       │  │ 1. Generate PKCE values:              │    │
       │  │    code_verifier = random(128 chars)  │    │
       │  │    code_challenge = base64url(        │    │
       │  │      SHA256(code_verifier))           │    │
       │  └──────────────────────────────────────┘    │
       │                                               │
       │  2. Redirect to authorize endpoint            │
       │  ─────────────────────────────────────────►  │
       │     GET /authorize?                           │
       │       client_id=story_app                     │
       │       redirect_uri=https://story.app/callback │
       │       response_type=code                      │
       │       scope=openid profile email Files.ReadWrite │
       │       code_challenge={challenge}              │
       │       code_challenge_method=S256              │
       │       state={random}                          │
       │                                               │
       │                                               │  3. User signs in
       │                                               │     (OAuth handles)
       │                                               │
       │  4. Redirect back with authorization code     │
       │  ◄─────────────────────────────────────────  │
       │     GET /callback?                            │
       │       code={authorization_code}               │
       │       state={same_random}                     │
       │                                               │
       │  ┌──────────────────────────────────────┐    │
       │  │ 5. Verify state matches               │    │
       │  └──────────────────────────────────────┘    │
       │                                               │
       │  6. Exchange code for tokens                  │
       │  ─────────────────────────────────────────►  │
       │     POST /token                               │
       │       grant_type=authorization_code           │
       │       client_id=story_app                     │
       │       code={authorization_code}               │
       │       redirect_uri=https://story.app/callback │
       │       code_verifier={verifier}                │
       │                                               │
       │  7. Receive tokens                            │
       │  ◄─────────────────────────────────────────  │
       │     {                                         │
       │       "access_token": "eyJ...",               │
       │       "id_token": "eyJ...",                   │
       │       "refresh_token": "1//...",              │
       │       "expires_in": 3600,                     │
       │       "token_type": "Bearer"                  │
       │     }                                         │
       │                                               │
       │  ┌──────────────────────────────────────┐    │
       │  │ 8. Parse ID token for user identity   │    │
       │  │ 9. Store tokens securely              │    │
       │  │ 10. User is now signed in             │    │
       │  └──────────────────────────────────────┘    │
       │                                               │
       ▼                                               ▼
```

### 3.3 Implementation

```typescript
/**
 * PKCE utilities for OAuth flow
 */
class PKCEHelper {
    /**
     * Generate cryptographically random code verifier
     */
    static generateCodeVerifier(): string {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return this.base64UrlEncode(array);
    }
    
    /**
     * Create code challenge from verifier
     */
    static async generateCodeChallenge(verifier: string): Promise<string> {
        const encoder = new TextEncoder();
        const data = encoder.encode(verifier);
        const hash = await crypto.subtle.digest('SHA-256', data);
        return this.base64UrlEncode(new Uint8Array(hash));
    }
    
    /**
     * Generate state parameter for CSRF protection
     */
    static generateState(): string {
        const array = new Uint8Array(16);
        crypto.getRandomValues(array);
        return this.base64UrlEncode(array);
    }
    
    /**
     * Base64 URL encoding (no padding, URL-safe chars)
     */
    private static base64UrlEncode(buffer: Uint8Array): string {
        let binary = '';
        for (let i = 0; i < buffer.byteLength; i++) {
            binary += String.fromCharCode(buffer[i]);
        }
        return btoa(binary)
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');
    }
}

/**
 * OAuth flow manager
 */
class OAuthFlow {
    private codeVerifier: string | null = null;
    private state: string | null = null;
    
    constructor(
        private clientId: string,
        private redirectUri: string,
        private scopes: string[]
    ) {}
    
    /**
     * Start OAuth flow (redirect to provider)
     */
    async startFlow(provider: 'microsoft' | 'google'): Promise<void> {
        // Generate PKCE values
        this.codeVerifier = PKCEHelper.generateCodeVerifier();
        const codeChallenge = await PKCEHelper.generateCodeChallenge(this.codeVerifier);
        this.state = PKCEHelper.generateState();
        
        // Store for callback
        sessionStorage.setItem('oauth_code_verifier', this.codeVerifier);
        sessionStorage.setItem('oauth_state', this.state);
        
        // Build authorization URL
        const authUrl = this.buildAuthUrl(provider, codeChallenge);
        
        // Redirect to OAuth provider
        window.location.href = authUrl;
    }
    
    /**
     * Handle OAuth callback
     */
    async handleCallback(callbackUrl: string): Promise<OAuthResult> {
        const url = new URL(callbackUrl);
        const code = url.searchParams.get('code');
        const state = url.searchParams.get('state');
        const error = url.searchParams.get('error');
        
        // Check for errors
        if (error) {
            throw new OAuthError(error, url.searchParams.get('error_description'));
        }
        
        // Verify state
        const savedState = sessionStorage.getItem('oauth_state');
        if (state !== savedState) {
            throw new OAuthError('state_mismatch', 'OAuth state mismatch');
        }
        
        // Get saved code verifier
        const codeVerifier = sessionStorage.getItem('oauth_code_verifier');
        if (!codeVerifier) {
            throw new OAuthError('no_verifier', 'Code verifier not found');
        }
        
        // Exchange code for tokens
        const tokens = await this.exchangeCodeForTokens(code!, codeVerifier);
        
        // Clean up
        sessionStorage.removeItem('oauth_code_verifier');
        sessionStorage.removeItem('oauth_state');
        
        return tokens;
    }
    
    private buildAuthUrl(provider: 'microsoft' | 'google', codeChallenge: string): string {
        const endpoints = {
            microsoft: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
            google: 'https://accounts.google.com/o/oauth2/v2/auth'
        };
        
        const params = new URLSearchParams({
            client_id: this.clientId,
            redirect_uri: this.redirectUri,
            response_type: 'code',
            scope: this.scopes.join(' '),
            code_challenge: codeChallenge,
            code_challenge_method: 'S256',
            state: this.state!
        });
        
        return `${endpoints[provider]}?${params.toString()}`;
    }
    
    private async exchangeCodeForTokens(code: string, codeVerifier: string): Promise<OAuthResult> {
        // Token endpoint depends on provider
        // This is typically handled by the provider's SDK (MSAL, Google Identity Services)
        // Example for direct implementation:
        
        const response = await fetch(this.tokenEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                client_id: this.clientId,
                code,
                redirect_uri: this.redirectUri,
                code_verifier: codeVerifier
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new OAuthError(error.error, error.error_description);
        }
        
        return response.json();
    }
}

interface OAuthResult {
    access_token: string;
    id_token: string;
    refresh_token?: string;
    expires_in: number;
    token_type: string;
}

class OAuthError extends Error {
    constructor(
        public code: string,
        public description?: string | null
    ) {
        super(`${code}: ${description || 'Unknown error'}`);
        this.name = 'OAuthError';
    }
}
```

---

## 4. ID Token Parsing

### 4.1 JWT Structure

```
┌─────────────────────────────────────────────────────────────────┐
│                     ID TOKEN (JWT)                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL...  │
│  ├──────────────────────────┬───────────────────────────────────┤
│  │       HEADER             │           PAYLOAD                 │
│  │  {                       │  {                                │
│  │    "alg": "RS256",       │    "iss": "https://...",         │
│  │    "typ": "JWT",         │    "sub": "117291...",           │
│  │    "kid": "abc123"       │    "aud": "client_id",           │
│  │  }                       │    "exp": 1701234567,            │
│  │                          │    "iat": 1701230967,            │
│  │  (base64url encoded)     │    "email": "alice@...",         │
│  │                          │    "name": "Alice Smith",        │
│  │                          │    "picture": "https://..."      │
│  │                          │  }                                │
│  │                          │  (base64url encoded)              │
│  ├──────────────────────────┴───────────────────────────────────┤
│  │                        SIGNATURE                             │
│  │  RS256 signature (signed by provider's private key)         │
│  └──────────────────────────────────────────────────────────────┘
│                                                                 │
│  Note: We trust the signature because the OAuth library         │
│  already verified it during token exchange.                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Standard Claims

| Claim | Description | Example |
|-------|-------------|---------|
| `iss` | Issuer (OAuth provider) | `https://accounts.google.com` |
| `sub` | Subject (unique user ID) | `117291281634281946283` |
| `aud` | Audience (our client ID) | `story-app.apps.googleusercontent.com` |
| `exp` | Expiration time (Unix) | `1701234567` |
| `iat` | Issued at (Unix) | `1701230967` |
| `email` | User's email | `alice@gmail.com` |
| `name` | Display name | `Alice Smith` |
| `picture` | Avatar URL | `https://lh3.googleusercontent.com/...` |

### 4.3 Parsing Implementation

```typescript
/**
 * Parse ID token to extract user identity
 */
class IdTokenParser {
    /**
     * Extract user identity from ID token
     * Note: Signature verification is handled by OAuth library
     */
    parse(idToken: string): ParsedIdentity {
        const payload = this.decodePayload(idToken);
        
        return {
            // Core identity
            id: payload.sub,
            email: payload.email,
            emailVerified: payload.email_verified ?? true,
            
            // Display info
            displayName: payload.name || payload.email?.split('@')[0] || 'Anonymous',
            givenName: payload.given_name,
            familyName: payload.family_name,
            avatarUrl: payload.picture,
            
            // Provider info
            issuer: payload.iss,
            provider: this.determineProvider(payload.iss),
            
            // Token metadata
            audience: payload.aud,
            issuedAt: new Date(payload.iat * 1000),
            expiresAt: new Date(payload.exp * 1000),
            
            // Raw claims for debugging
            rawClaims: payload
        };
    }
    
    /**
     * Decode JWT payload (base64url -> JSON)
     */
    private decodePayload(jwt: string): JWTPayload {
        const parts = jwt.split('.');
        if (parts.length !== 3) {
            throw new Error('Invalid JWT format');
        }
        
        const payload = parts[1];
        const decoded = this.base64UrlDecode(payload);
        return JSON.parse(decoded);
    }
    
    /**
     * Base64 URL decoding
     */
    private base64UrlDecode(str: string): string {
        // Add padding
        const padded = str + '='.repeat((4 - (str.length % 4)) % 4);
        // Replace URL-safe chars
        const base64 = padded.replace(/-/g, '+').replace(/_/g, '/');
        return atob(base64);
    }
    
    /**
     * Determine OAuth provider from issuer URL
     */
    private determineProvider(issuer: string): 'microsoft' | 'google' | 'unknown' {
        if (issuer.includes('microsoft') || issuer.includes('sts.windows.net')) {
            return 'microsoft';
        }
        if (issuer.includes('google') || issuer.includes('accounts.google.com')) {
            return 'google';
        }
        return 'unknown';
    }
}

interface ParsedIdentity {
    // Core identity
    id: string;
    email?: string;
    emailVerified: boolean;
    
    // Display info
    displayName: string;
    givenName?: string;
    familyName?: string;
    avatarUrl?: string;
    
    // Provider info
    issuer: string;
    provider: 'microsoft' | 'google' | 'unknown';
    
    // Token metadata
    audience: string;
    issuedAt: Date;
    expiresAt: Date;
    
    // Raw claims
    rawClaims: JWTPayload;
}

interface JWTPayload {
    iss: string;
    sub: string;
    aud: string;
    exp: number;
    iat: number;
    email?: string;
    email_verified?: boolean;
    name?: string;
    given_name?: string;
    family_name?: string;
    picture?: string;
    [key: string]: any;
}
```

---

## 5. Token Storage

### 5.1 Storage Strategy

```
┌─────────────────────────────────────────────────────────────────┐
│                    TOKEN STORAGE STRATEGY                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  SESSION STORAGE (cleared when tab closes)                      │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  • Access token                                            │ │
│  │  • ID token                                                │ │
│  │  • Token expiration                                        │ │
│  │                                                            │ │
│  │  Why: Short-lived, security-sensitive                      │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  LOCAL STORAGE (persists across sessions)                       │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  • Refresh token (if available)                            │ │
│  │  • Cached user profile                                     │ │
│  │  • Last provider used                                      │ │
│  │                                                            │ │
│  │  Why: Enable silent sign-in, faster app startup            │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  MEMORY ONLY (never persisted)                                  │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  • Decrypted secrets                                       │ │
│  │  • Active user object                                      │ │
│  │                                                            │ │
│  │  Why: Maximum security                                     │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Implementation

```typescript
/**
 * Secure token storage manager
 */
class TokenStorage {
    private readonly PREFIX = 'story_oauth_';
    
    /**
     * Store tokens after successful OAuth
     */
    storeTokens(result: OAuthResult, provider: string): void {
        // Access token in session storage
        sessionStorage.setItem(`${this.PREFIX}access_token`, result.access_token);
        sessionStorage.setItem(`${this.PREFIX}expires_at`, 
            String(Date.now() + result.expires_in * 1000));
        
        // ID token in session storage (for re-parsing if needed)
        if (result.id_token) {
            sessionStorage.setItem(`${this.PREFIX}id_token`, result.id_token);
        }
        
        // Refresh token in local storage (for session restoration)
        if (result.refresh_token) {
            localStorage.setItem(`${this.PREFIX}refresh_token`, result.refresh_token);
        }
        
        // Remember provider
        localStorage.setItem(`${this.PREFIX}provider`, provider);
    }
    
    /**
     * Get access token (returns null if expired)
     */
    getAccessToken(): string | null {
        const token = sessionStorage.getItem(`${this.PREFIX}access_token`);
        const expiresAt = sessionStorage.getItem(`${this.PREFIX}expires_at`);
        
        if (!token || !expiresAt) {
            return null;
        }
        
        // Check expiration (with 5 minute buffer)
        if (Date.now() > Number(expiresAt) - 5 * 60 * 1000) {
            return null; // Expired or expiring soon
        }
        
        return token;
    }
    
    /**
     * Get ID token
     */
    getIdToken(): string | null {
        return sessionStorage.getItem(`${this.PREFIX}id_token`);
    }
    
    /**
     * Get refresh token
     */
    getRefreshToken(): string | null {
        return localStorage.getItem(`${this.PREFIX}refresh_token`);
    }
    
    /**
     * Get last used provider
     */
    getProvider(): string | null {
        return localStorage.getItem(`${this.PREFIX}provider`);
    }
    
    /**
     * Check if tokens need refresh
     */
    needsRefresh(): boolean {
        const expiresAt = sessionStorage.getItem(`${this.PREFIX}expires_at`);
        if (!expiresAt) return true;
        
        // Refresh 5 minutes before expiration
        return Date.now() > Number(expiresAt) - 5 * 60 * 1000;
    }
    
    /**
     * Clear all tokens (on sign-out)
     */
    clearTokens(): void {
        // Session storage
        sessionStorage.removeItem(`${this.PREFIX}access_token`);
        sessionStorage.removeItem(`${this.PREFIX}expires_at`);
        sessionStorage.removeItem(`${this.PREFIX}id_token`);
        
        // Local storage
        localStorage.removeItem(`${this.PREFIX}refresh_token`);
        localStorage.removeItem(`${this.PREFIX}provider`);
    }
}
```

---

## 6. Token Refresh

### 6.1 Refresh Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     TOKEN REFRESH FLOW                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  App detects access token expired or expiring                  │
│         │                                                       │
│         ▼                                                       │
│  ┌─────────────────┐                                           │
│  │ Have refresh    │──No──► Redirect to sign-in                │
│  │ token?          │                                           │
│  └────────┬────────┘                                           │
│           │ Yes                                                 │
│           ▼                                                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  POST /token                                             │   │
│  │    grant_type=refresh_token                              │   │
│  │    client_id={client_id}                                 │   │
│  │    refresh_token={refresh_token}                         │   │
│  └────────────────────────────┬────────────────────────────┘   │
│                               │                                 │
│         ┌─────────────────────┴─────────────────────┐          │
│         ▼                                           ▼          │
│  ┌─────────────┐                           ┌─────────────┐     │
│  │  Success    │                           │   Error     │     │
│  │  New tokens │                           │  (expired)  │     │
│  └──────┬──────┘                           └──────┬──────┘     │
│         │                                         │             │
│         ▼                                         ▼             │
│  Store new tokens                         Redirect to sign-in  │
│  Continue operation                                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 Implementation

```typescript
/**
 * Automatic token refresh manager
 */
class TokenRefreshManager {
    private refreshTimer: number | null = null;
    
    constructor(
        private tokenStorage: TokenStorage,
        private authProvider: AuthProvider
    ) {}
    
    /**
     * Schedule automatic refresh before token expires
     */
    scheduleRefresh(expiresAt: Date): void {
        // Cancel existing timer
        if (this.refreshTimer) {
            clearTimeout(this.refreshTimer);
        }
        
        // Calculate refresh time (5 minutes before expiration)
        const refreshTime = expiresAt.getTime() - Date.now() - 5 * 60 * 1000;
        
        if (refreshTime <= 0) {
            // Already expired or expiring soon - refresh now
            this.refreshToken();
        } else {
            // Schedule refresh
            this.refreshTimer = window.setTimeout(() => {
                this.refreshToken();
            }, refreshTime);
        }
    }
    
    /**
     * Refresh tokens
     */
    async refreshToken(): Promise<boolean> {
        const refreshToken = this.tokenStorage.getRefreshToken();
        
        if (!refreshToken) {
            console.log('No refresh token available');
            this.emitSessionExpired();
            return false;
        }
        
        try {
            const result = await this.authProvider.refreshToken(refreshToken);
            
            // Store new tokens
            this.tokenStorage.storeTokens(result, this.authProvider.providerId);
            
            // Schedule next refresh
            const expiresAt = new Date(Date.now() + result.expires_in * 1000);
            this.scheduleRefresh(expiresAt);
            
            console.log('Token refreshed successfully');
            return true;
        } catch (error) {
            console.error('Token refresh failed:', error);
            
            // Clear tokens and notify
            this.tokenStorage.clearTokens();
            this.emitSessionExpired();
            
            return false;
        }
    }
    
    /**
     * Stop automatic refresh
     */
    stopRefresh(): void {
        if (this.refreshTimer) {
            clearTimeout(this.refreshTimer);
            this.refreshTimer = null;
        }
    }
    
    private emitSessionExpired(): void {
        window.dispatchEvent(new CustomEvent('story:session-expired'));
    }
}
```

---

## 7. Provider-Specific Details

### 7.1 Microsoft (Azure AD)

```typescript
/**
 * Microsoft-specific OAuth configuration
 */
const microsoftConfig = {
    // Endpoints
    authorizationEndpoint: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    tokenEndpoint: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    
    // Scopes for Story
    scopes: [
        'openid',           // Required for ID token
        'profile',          // Name, etc.
        'email',            // Email address
        'offline_access',   // Refresh token
        'Files.ReadWrite'   // OneDrive access
    ],
    
    // ID token claims (Microsoft-specific)
    idTokenClaims: {
        sub: 'Unique user ID',
        email: 'User email (if consented)',
        name: 'Display name',
        preferred_username: 'Usually email',
        oid: 'Object ID (Azure AD)',
        tid: 'Tenant ID (for work accounts)'
    }
};

// Microsoft uses MSAL.js library
// ID token parsing is handled by the library
```

### 7.2 Google

```typescript
/**
 * Google-specific OAuth configuration
 */
const googleConfig = {
    // Endpoints
    authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenEndpoint: 'https://oauth2.googleapis.com/token',
    
    // Scopes for Story
    scopes: [
        'openid',                                      // Required for ID token
        'profile',                                     // Name, picture
        'email',                                       // Email address
        'https://www.googleapis.com/auth/drive.file'  // Google Drive access
    ],
    
    // ID token claims (Google-specific)
    idTokenClaims: {
        sub: 'Unique user ID (stable)',
        email: 'Email address',
        email_verified: 'Boolean',
        name: 'Full name',
        given_name: 'First name',
        family_name: 'Last name',
        picture: 'Profile picture URL',
        hd: 'Hosted domain (for Workspace accounts)'
    }
};

// Google uses Google Identity Services (GIS)
// Or can use gapi for Drive access
```

### 7.3 Cross-Provider User ID

```typescript
/**
 * Generate consistent user ID across providers
 * Used for collaboration identity
 */
function generateConsistentUserId(identity: ParsedIdentity): string {
    // Prefix with provider to ensure uniqueness
    return `${identity.provider}_${identity.id}`;
}

// Examples:
// Microsoft: "microsoft_abc123def456"
// Google: "google_117291281634281946283"
```

---

## Related Specifications

- [Identity Architecture](./identity-architecture.md) - Overall architecture
- [Session Lifecycle](./session-lifecycle.md) - Session management
- [User Profile Model](./user-profile-model.md) - Profile structure
- [Cross-Device Identity](./cross-device-identity.md) - Multi-device sync

---

*OAuth tokens are the foundation of Story's decentralized identity system.*
