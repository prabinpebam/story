# Identity Architecture

## Overview

This specification defines the **overall architecture** of Story's decentralized identity system. Unlike traditional applications that maintain a central user database, Story delegates identity entirely to OAuth providers (Microsoft, Google) and stores all user data in the user's own cloud storage.

**Related Specifications:**
- [OAuth Identity Flow](./oauth-identity-flow.md) - Token-based identity
- [User Profile Model](./user-profile-model.md) - Profile data structure
- [Session Lifecycle](./session-lifecycle.md) - Session management

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Decentralized Design](#2-decentralized-design)
3. [Component Responsibilities](#3-component-responsibilities)
4. [Data Flow](#4-data-flow)
5. [Identity Resolution](#5-identity-resolution)
6. [Comparison with Traditional Models](#6-comparison-with-traditional-models)

---

## 1. Architecture Overview

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           STORY IDENTITY ARCHITECTURE                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         CLIENT (Browser)                             │   │
│  │                                                                      │   │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │   │
│  │  │ Identity Manager │  │ Session Manager  │  │ Storage Manager  │  │   │
│  │  │                  │  │                  │  │                  │  │   │
│  │  │ • OAuth flow     │  │ • Token storage  │  │ • File access    │  │   │
│  │  │ • Profile extract│  │ • Refresh logic  │  │ • Sync state     │  │   │
│  │  │ • Multi-provider │  │ • Tab sync       │  │ • Offline cache  │  │   │
│  │  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘  │   │
│  │           │                     │                     │             │   │
│  └───────────│─────────────────────│─────────────────────│─────────────┘   │
│              │                     │                     │                  │
│              ▼                     ▼                     ▼                  │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐ │
│  │   OAuth Providers   │  │   Browser Storage   │  │   Cloud Storage     │ │
│  │   (MS, Google)      │  │   (localStorage)    │  │   (OneDrive, GDrive)│ │
│  │                     │  │                     │  │                     │ │
│  │   • Identity source │  │   • Tokens          │  │   • User's files    │ │
│  │   • Token issuance  │  │   • Cached profile  │  │   • .story files    │ │
│  │   • Token refresh   │  │   • Preferences     │  │   • Assets          │ │
│  └─────────────────────┘  └─────────────────────┘  └─────────────────────┘ │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     REAL-TIME LAYER (Serverless)                    │   │
│  │                                                                      │   │
│  │   Azure SignalR Service ────► Message relay only, no identity store │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Key Architectural Decisions

| Decision | Rationale |
|----------|-----------|
| **No user database** | Reduces liability, simplifies ops, respects privacy |
| **OAuth as identity source** | Leverages proven identity infrastructure |
| **Client-side verification** | No server round-trips for identity checks |
| **User-owned storage** | Files in user's cloud = user's control |
| **Stateless server** | SignalR only relays, doesn't store |

---

## 2. Decentralized Design

### 2.1 What "Decentralized" Means for Story

```
┌─────────────────────────────────────────────────────────────────┐
│                    DECENTRALIZATION MODEL                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  IDENTITY: Owned by OAuth provider                              │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  Microsoft Account ─────┐                                  │ │
│  │                         ├──► User controls their identity  │ │
│  │  Google Account ────────┘                                  │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  DATA: Owned by user in their cloud storage                    │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  OneDrive ───────────┐                                     │ │
│  │                      ├──► User controls their data         │ │
│  │  Google Drive ───────┘                                     │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  COLLABORATION: Peer-to-peer via relay                         │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  SignalR is a "dumb pipe" that:                           │ │
│  │  • Routes messages between clients                        │ │
│  │  • Does NOT store messages                                │ │
│  │  • Does NOT maintain user records                         │ │
│  │  • Does NOT authenticate (clients do)                     │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Trust Model

```
┌─────────────────────────────────────────────────────────────────┐
│                       TRUST RELATIONSHIPS                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Story App                                                      │
│      │                                                          │
│      ├──── TRUSTS ────► OAuth Provider                         │
│      │                   • To authenticate users                │
│      │                   • To issue valid tokens                │
│      │                   • To provide accurate claims           │
│      │                                                          │
│      ├──── TRUSTS ────► Cloud Storage Provider                 │
│      │                   • To securely store files              │
│      │                   • To enforce access controls           │
│      │                   • To maintain file integrity           │
│      │                                                          │
│      └──── TRUSTS ────► User's Browser                         │
│                          • To securely store tokens             │
│                          • To execute client code               │
│                          • To enforce HTTPS                     │
│                                                                 │
│  Story Server (SignalR)                                         │
│      │                                                          │
│      └──── DOES NOT ───► Verify identity                       │
│            NEED TO       (clients self-identify)                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.3 Data Ownership Matrix

| Data Type | Owner | Location | Story's Access |
|-----------|-------|----------|----------------|
| User identity | User (via OAuth provider) | OAuth provider | Read-only (via token) |
| User profile | User | Browser localStorage | Cached copy only |
| Presentation files | User | User's cloud storage | Via user's OAuth token |
| Preferences | User | Browser localStorage | Full (user's browser) |
| Collaboration messages | Users | In-transit only | Relay only |

---

## 3. Component Responsibilities

### 3.1 Client Components

```typescript
/**
 * Identity Manager
 * Handles all identity-related operations on the client
 */
interface IdentityManager {
    // Provider management
    registerProvider(provider: AuthProvider): void;
    getProviders(): AuthProvider[];
    
    // Identity operations
    getCurrentUser(): AuthUser | null;
    signIn(providerId: string, options?: SignInOptions): Promise<AuthResult>;
    signOut(): Promise<void>;
    
    // Token operations
    getAccessToken(scopes?: string[]): Promise<string>;
    refreshToken(): Promise<void>;
    
    // Profile operations
    getUserProfile(): UserProfile | null;
    updateLocalProfile(updates: Partial<UserProfile>): void;
}

/**
 * Session Manager
 * Manages the user session across browser tabs and page reloads
 */
interface SessionManager {
    // Session state
    isSessionActive(): boolean;
    getSessionInfo(): SessionInfo | null;
    
    // Session lifecycle
    startSession(authResult: AuthResult): void;
    endSession(): void;
    
    // Cross-tab sync
    syncAcrossTabs(): void;
    onSessionChange(callback: (session: SessionInfo | null) => void): void;
    
    // Token refresh scheduling
    scheduleTokenRefresh(expiresAt: Date): void;
}

/**
 * Storage Manager
 * Manages user data in cloud storage using their OAuth tokens
 */
interface StorageManager {
    // File operations use user's OAuth token
    listFiles(folder?: string): Promise<FileInfo[]>;
    readFile(fileId: string): Promise<Blob>;
    writeFile(fileId: string, content: Blob): Promise<void>;
    
    // Access is inherently user-scoped
    // (OAuth token only grants access to that user's files)
}
```

### 3.2 External Services

```
┌─────────────────────────────────────────────────────────────────┐
│                     EXTERNAL SERVICES                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  OAUTH PROVIDERS                                                │
│  ├── Microsoft (Azure AD)                                       │
│  │   • Personal Microsoft accounts                              │
│  │   • Work/School accounts (Azure AD)                         │
│  │   • Token endpoint: login.microsoftonline.com               │
│  │                                                              │
│  └── Google                                                     │
│      • Personal Google accounts                                 │
│      • Google Workspace accounts                                │
│      • Token endpoint: accounts.google.com                     │
│                                                                 │
│  CLOUD STORAGE                                                  │
│  ├── OneDrive (Microsoft)                                       │
│  │   • Personal OneDrive                                        │
│  │   • OneDrive for Business                                   │
│  │   • API: graph.microsoft.com                                │
│  │                                                              │
│  └── Google Drive                                               │
│      • Personal Drive                                           │
│      • Shared Drives (Workspace)                               │
│      • API: googleapis.com/drive                               │
│                                                                 │
│  REAL-TIME (Story's only server)                               │
│  └── Azure SignalR Service (Serverless)                        │
│      • WebSocket connections                                    │
│      • Message routing                                          │
│      • No persistent storage                                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Data Flow

### 4.1 Sign-In Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         SIGN-IN DATA FLOW                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────┐    ┌──────────────┐    ┌────────────────┐                │
│  │  User    │    │  Story App   │    │ OAuth Provider │                │
│  │ (Browser)│    │  (Client JS) │    │  (MS/Google)   │                │
│  └────┬─────┘    └──────┬───────┘    └───────┬────────┘                │
│       │                 │                     │                         │
│       │ 1. Click        │                     │                         │
│       │    "Sign In"    │                     │                         │
│       │────────────────►│                     │                         │
│       │                 │                     │                         │
│       │                 │ 2. Generate PKCE    │                         │
│       │                 │    code_verifier    │                         │
│       │                 │    + challenge      │                         │
│       │                 │                     │                         │
│       │◄────────────────│ 3. Redirect to      │                         │
│       │                 │    OAuth login      │                         │
│       │                 │                     │                         │
│       │────────────────────────────────────────────────────────────────►│
│       │                 │                     │ 4. User enters          │
│       │                 │                     │    credentials          │
│       │◄────────────────────────────────────────────────────────────────│
│       │                 │                     │ 5. Redirect with        │
│       │                 │                     │    auth code            │
│       │                 │                     │                         │
│       │────────────────►│                     │                         │
│       │                 │ 6. Exchange code    │                         │
│       │                 │    for tokens       │                         │
│       │                 │────────────────────►│                         │
│       │                 │                     │                         │
│       │                 │◄────────────────────│                         │
│       │                 │ 7. Receive:         │                         │
│       │                 │    - access_token   │                         │
│       │                 │    - id_token       │                         │
│       │                 │    - refresh_token  │                         │
│       │                 │                     │                         │
│       │                 │ 8. Extract user     │                         │
│       │                 │    from id_token:   │                         │
│       │                 │    { sub, email,    │                         │
│       │                 │      name, picture }│                         │
│       │                 │                     │                         │
│       │                 │ 9. Store in         │                         │
│       │                 │    localStorage:    │                         │
│       │                 │    - tokens         │                         │
│       │                 │    - user profile   │                         │
│       │                 │                     │                         │
│       │◄────────────────│ 10. Show signed-in │                         │
│       │                 │     UI              │                         │
│       │                 │                     │                         │
│       ▼                 ▼                     ▼                         │
│                                                                         │
│  No server database touched! Identity came directly from OAuth.        │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.2 File Access Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       FILE ACCESS DATA FLOW                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────┐    ┌──────────────┐    ┌────────────────┐                │
│  │  User    │    │  Story App   │    │ Cloud Storage  │                │
│  │ (Browser)│    │  (Client JS) │    │ (User's Drive) │                │
│  └────┬─────┘    └──────┬───────┘    └───────┬────────┘                │
│       │                 │                     │                         │
│       │ 1. Open file    │                     │                         │
│       │────────────────►│                     │                         │
│       │                 │                     │                         │
│       │                 │ 2. Get access token │                         │
│       │                 │    from cache or    │                         │
│       │                 │    refresh          │                         │
│       │                 │                     │                         │
│       │                 │ 3. Request file     │                         │
│       │                 │    with token       │                         │
│       │                 │────────────────────►│                         │
│       │                 │                     │                         │
│       │                 │                     │ 4. Cloud verifies:      │
│       │                 │                     │    - Token valid?       │
│       │                 │                     │    - User owns file?    │
│       │                 │                     │    - Scopes sufficient? │
│       │                 │                     │                         │
│       │                 │◄────────────────────│                         │
│       │                 │ 5. Return file      │                         │
│       │                 │    contents         │                         │
│       │                 │                     │                         │
│       │◄────────────────│ 6. Display file     │                         │
│       │                 │                     │                         │
│       ▼                 ▼                     ▼                         │
│                                                                         │
│  User's OAuth token grants access only to THEIR files.                 │
│  Story app cannot access files beyond user's permission.               │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.3 Collaboration Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     COLLABORATION DATA FLOW                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────┐              ┌────────────┐              ┌──────────┐    │
│  │  Alice   │              │  SignalR   │              │   Bob    │    │
│  │ (Editor) │              │  Service   │              │ (Editor) │    │
│  └────┬─────┘              └─────┬──────┘              └────┬─────┘    │
│       │                          │                          │          │
│       │ 1. Edit slide            │                          │          │
│       │    (local change)        │                          │          │
│       │                          │                          │          │
│       │ 2. Send message:         │                          │          │
│       │    {                     │                          │          │
│       │      type: "edit",       │                          │          │
│       │      userInfo: {         │                          │          │
│       │        id: "alice_123",  │                          │          │
│       │        name: "Alice",    │                          │          │
│       │        color: "#FF6B6B"  │                          │          │
│       │      },                  │                          │          │
│       │      payload: {...}      │                          │          │
│       │    }                     │                          │          │
│       │─────────────────────────►│                          │          │
│       │                          │                          │          │
│       │                          │ 3. Relay message         │          │
│       │                          │    (no storage)          │          │
│       │                          │─────────────────────────►│          │
│       │                          │                          │          │
│       │                          │                          │ 4. Receive│
│       │                          │                          │    message│
│       │                          │                          │          │
│       │                          │                          │ 5. Apply │
│       │                          │                          │    edit + │
│       │                          │                          │    show   │
│       │                          │                          │    Alice  │
│       ▼                          ▼                          ▼          │
│                                                                         │
│  Identity travels WITH messages. SignalR doesn't verify - it relays.  │
│  Bob's client trusts Alice's identity claims (OAuth-backed).           │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Identity Resolution

### 5.1 How Identity is Resolved

```typescript
/**
 * Identity is resolved from OAuth ID tokens
 * No database lookup needed
 */
class IdentityResolver {
    /**
     * Resolve identity from ID token
     * Called after OAuth sign-in
     */
    resolveFromIdToken(idToken: string): ResolvedIdentity {
        // Decode JWT payload (signature already verified by OAuth library)
        const payload = this.decodeJwtPayload(idToken);
        
        return {
            // Unique identifier (stable across sessions)
            id: payload.sub,
            
            // Display info
            email: payload.email,
            displayName: payload.name || payload.email,
            givenName: payload.given_name,
            familyName: payload.family_name,
            avatarUrl: payload.picture,
            
            // Provider info
            provider: this.extractProvider(payload.iss),
            providerAccountId: payload.sub,
            
            // Token metadata
            issuedAt: new Date(payload.iat * 1000),
            expiresAt: new Date(payload.exp * 1000)
        };
    }
    
    /**
     * Resolve identity from collaboration message
     * Trust the included userInfo (sender self-identified)
     */
    resolveFromMessage(message: CollaborationMessage): ResolvedIdentity {
        return {
            id: message.userInfo.id,
            displayName: message.userInfo.displayName,
            avatarUrl: message.userInfo.avatarUrl,
            color: message.userInfo.color,
            
            // Limited info - only what sender chose to share
            email: undefined,
            provider: undefined
        };
    }
    
    private decodeJwtPayload(jwt: string): any {
        const [, payload] = jwt.split('.');
        return JSON.parse(atob(payload));
    }
    
    private extractProvider(issuer: string): 'microsoft' | 'google' {
        if (issuer.includes('microsoft') || issuer.includes('sts.windows.net')) {
            return 'microsoft';
        }
        if (issuer.includes('google') || issuer.includes('accounts.google.com')) {
            return 'google';
        }
        throw new Error(`Unknown issuer: ${issuer}`);
    }
}

interface ResolvedIdentity {
    id: string;
    email?: string;
    displayName: string;
    givenName?: string;
    familyName?: string;
    avatarUrl?: string;
    color?: string;
    provider?: 'microsoft' | 'google';
    providerAccountId?: string;
    issuedAt?: Date;
    expiresAt?: Date;
}
```

### 5.2 Identity Caching

```typescript
/**
 * Cache resolved identity for performance
 * But always re-resolve on fresh tokens
 */
class IdentityCache {
    private readonly CACHE_KEY = 'story_identity_cache';
    
    /**
     * Cache identity locally for quick access
     */
    cacheIdentity(identity: ResolvedIdentity): void {
        const cached = {
            identity,
            cachedAt: new Date().toISOString(),
            validUntil: identity.expiresAt?.toISOString()
        };
        
        localStorage.setItem(this.CACHE_KEY, JSON.stringify(cached));
    }
    
    /**
     * Get cached identity (for instant UI on page load)
     */
    getCachedIdentity(): ResolvedIdentity | null {
        const cached = localStorage.getItem(this.CACHE_KEY);
        if (!cached) return null;
        
        const { identity, validUntil } = JSON.parse(cached);
        
        // Check if cache is still valid
        if (validUntil && new Date(validUntil) < new Date()) {
            return null; // Expired
        }
        
        return identity;
    }
    
    /**
     * Clear cached identity on sign-out
     */
    clearCache(): void {
        localStorage.removeItem(this.CACHE_KEY);
    }
}
```

---

## 6. Comparison with Traditional Models

### 6.1 Architecture Comparison

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    TRADITIONAL vs STORY ARCHITECTURE                    │
├──────────────────────────────────┬──────────────────────────────────────┤
│         TRADITIONAL              │            STORY                      │
├──────────────────────────────────┼──────────────────────────────────────┤
│                                  │                                      │
│  ┌──────────┐                    │  ┌──────────┐                        │
│  │  Client  │                    │  │  Client  │                        │
│  └────┬─────┘                    │  └────┬─────┘                        │
│       │                          │       │                              │
│       ▼                          │       ├───────────► OAuth Provider   │
│  ┌──────────┐                    │       │              (identity)      │
│  │  Server  │ ◄── API calls      │       │                              │
│  └────┬─────┘                    │       ├───────────► Cloud Storage    │
│       │                          │       │              (user's files)  │
│       ▼                          │       │                              │
│  ┌──────────┐                    │       └───────────► SignalR          │
│  │ Database │ ◄── User records   │                      (relay only)    │
│  │          │    Session state   │                                      │
│  │          │    File metadata   │                                      │
│  └──────────┘                    │                                      │
│                                  │                                      │
├──────────────────────────────────┼──────────────────────────────────────┤
│  CHARACTERISTICS:                │  CHARACTERISTICS:                    │
│  • Centralized control           │  • Decentralized by design           │
│  • Server holds user data        │  • User owns their data              │
│  • Server authenticates          │  • OAuth provider authenticates      │
│  • Server manages sessions       │  • Client manages sessions           │
│  • Single point of failure       │  • No single point of failure        │
│  • Scales with more servers      │  • Scales with cloud providers       │
│                                  │                                      │
└──────────────────────────────────┴──────────────────────────────────────┘
```

### 6.2 Trade-offs

| Aspect | Traditional | Story (Decentralized) |
|--------|-------------|----------------------|
| **User identity storage** | Our database | OAuth provider |
| **File storage** | Our servers | User's cloud |
| **Session management** | Server-side | Client-side |
| **Scaling costs** | High (more servers) | Low (cloud providers scale) |
| **Data liability** | High (we store PII) | Low (we don't store) |
| **Offline capability** | Limited | Good (cached locally) |
| **User control** | Low | High |
| **Feature flexibility** | High | Some constraints |
| **Analytics** | Easy | Limited (privacy) |
| **Enterprise features** | Easier | Requires creativity |

### 6.3 When This Model Works Best

```
✅ IDEAL FOR:
• Privacy-focused applications
• Applications where users have existing cloud storage
• Applications with minimal server-side logic needs
• Small to medium team products
• Products targeting privacy-conscious users
• Products where data portability is important

⚠️ CHALLENGES FOR:
• Enterprise with custom identity providers
• Applications requiring complex server-side processing
• Applications needing cross-user analytics
• Applications with admin panels managing all users
• Applications requiring data residency compliance
```

---

## Related Specifications

- [OAuth Identity Flow](./oauth-identity-flow.md) - Token-based identity details
- [User Profile Model](./user-profile-model.md) - Profile data structure
- [Session Lifecycle](./session-lifecycle.md) - Session management
- [Privacy Model](./privacy-model.md) - Privacy considerations

---

*Story's decentralized identity architecture puts users in control of their identity and data.*
