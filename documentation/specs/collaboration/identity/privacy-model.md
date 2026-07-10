# Privacy Model

## Overview

This specification defines the **privacy model** for Story's decentralized identity system. By design, Story minimizes data collection and puts users in control of their information.

**Related Specifications:**
- [Identity Architecture](./identity-architecture.md) - Overall architecture
- [Collaboration Identity](./collaboration-identity.md) - Identity in collaboration
- [Identity Security](./identity-security.md) - Security considerations

---

## Table of Contents

1. [Privacy by Design](#1-privacy-by-design)
2. [Data Minimization](#2-data-minimization)
3. [User Control](#3-user-control)
4. [Data Retention](#4-data-retention)
5. [Third-Party Data Sharing](#5-third-party-data-sharing)
6. [GDPR Compliance](#6-gdpr-compliance)

---

## 1. Privacy by Design

### 1.1 Core Privacy Principles

```
┌─────────────────────────────────────────────────────────────────┐
│                  PRIVACY BY DESIGN PRINCIPLES                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. DATA MINIMIZATION                                           │
│     ┌───────────────────────────────────────────────────────┐  │
│     │ We collect only what's necessary for functionality     │  │
│     │ We don't collect "just in case" data                  │  │
│     │ We don't have a user database to populate             │  │
│     └───────────────────────────────────────────────────────┘  │
│                                                                 │
│  2. DECENTRALIZED STORAGE                                       │
│     ┌───────────────────────────────────────────────────────┐  │
│     │ User data stays with the user                         │  │
│     │ Files in user's cloud storage                         │  │
│     │ Tokens in user's browser                              │  │
│     └───────────────────────────────────────────────────────┘  │
│                                                                 │
│  3. PURPOSE LIMITATION                                          │
│     ┌───────────────────────────────────────────────────────┐  │
│     │ OAuth tokens only used for file access                │  │
│     │ No secondary use of user data                         │  │
│     │ No selling or monetizing user information             │  │
│     └───────────────────────────────────────────────────────┘  │
│                                                                 │
│  4. TRANSPARENCY                                                │
│     ┌───────────────────────────────────────────────────────┐  │
│     │ Users know exactly what we access                     │  │
│     │ OAuth scope clearly stated                            │  │
│     │ No hidden data collection                             │  │
│     └───────────────────────────────────────────────────────┘  │
│                                                                 │
│  5. USER CONTROL                                                │
│     ┌───────────────────────────────────────────────────────┐  │
│     │ Users can revoke access anytime                       │  │
│     │ Users control what collaborators see                  │  │
│     │ No data locked in our systems                         │  │
│     └───────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Architectural Privacy Benefits

| Traditional App | Story's Approach |
|-----------------|------------------|
| Central user database | No user database |
| Server stores sessions | Client-only sessions |
| Server logs user activity | No server-side logging |
| Data in company's servers | Data in user's cloud |
| Company controls data | User controls data |
| Breach exposes all users | No central data to breach |

---

## 2. Data Minimization

### 2.1 What We Access vs. What We Store

```
┌─────────────────────────────────────────────────────────────────┐
│                    DATA ACCESS VS STORAGE                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ACCESSED (from OAuth token) | STORED (in browser)             │
│  ───────────────────────────────────────────────────────────   │
│  • User ID (sub)              → Cached for quick access        │
│  • Email                      → Cached for display             │
│  • Display name               → Cached for display             │
│  • Profile picture URL        → NOT stored (fetched from URL)  │
│  • Access token               → Session storage (temp)         │
│  • Refresh token              → Local storage (encrypted)      │
│                                                                 │
│  NOT ACCESSED:                                                  │
│  ───────────────────────────────────────────────────────────   │
│  • Contacts list              (not in our OAuth scope)         │
│  • Calendar                   (not in our OAuth scope)         │
│  • Other files                (only .story files accessed)     │
│  • Email content              (not in our OAuth scope)         │
│  • Location                   (not requested)                  │
│  • Device identifiers         (not collected)                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 OAuth Scope Justification

```typescript
/**
 * OAuth scopes we request and why
 */
const OAUTH_SCOPES = {
    // Microsoft scopes
    microsoft: {
        'openid': 'Required for ID token (user identity)',
        'profile': 'For display name in collaboration',
        'email': 'For showing who owns/shared files',
        'offline_access': 'For session persistence (refresh token)',
        'Files.ReadWrite': 'To read/write user\'s .story files in OneDrive'
    },
    
    // Google scopes  
    google: {
        'openid': 'Required for ID token (user identity)',
        'profile': 'For display name in collaboration',
        'email': 'For showing who owns/shared files',
        'https://www.googleapis.com/auth/drive.file': 
            'To read/write user\'s .story files in Google Drive'
    }
};

// Note: drive.file scope only accesses files Story creates or user shares with Story
// We explicitly do NOT request:
// - 'https://www.googleapis.com/auth/drive' (full drive access)
// - 'https://www.googleapis.com/auth/contacts' (contacts)
// - 'https://www.googleapis.com/auth/calendar' (calendar)
```

### 2.3 Data Not Collected

```typescript
/**
 * Data we explicitly DO NOT collect
 */
const NOT_COLLECTED = [
    // Identifiers
    'IP address',
    'Device fingerprint',
    'Hardware identifiers',
    'Advertising ID',
    
    // Behavior
    'Browsing history',
    'Search queries',
    'Click patterns',
    'Time spent on slides',
    
    // Content
    'Presentation content (stays in user\'s cloud)',
    'Comments (stored in file, not our servers)',
    'Version history (cloud provider handles)',
    
    // Third-party
    'Social media profiles',
    'Purchase history',
    'Location data',
    'Contact lists'
];
```

---

## 3. User Control

### 3.1 Privacy Settings

```typescript
/**
 * User-controllable privacy settings
 */
interface PrivacySettings {
    // ─────────────────────────────────────────────────────────
    // Collaboration Privacy
    // ─────────────────────────────────────────────────────────
    
    /** Show pseudonym instead of real name to collaborators */
    hideRealName: boolean;
    
    /** Pseudonym to use when hiding real name */
    pseudonym?: string;
    
    /** Hide profile picture from collaborators */
    hideAvatar: boolean;
    
    /** Don't show which slide you're viewing */
    hideLocation: boolean;
    
    /** Appear as "Anonymous" (still need OAuth, just hide identity) */
    incognito: boolean;
    
    // ─────────────────────────────────────────────────────────
    // Data & Storage
    // ─────────────────────────────────────────────────────────
    
    /** Clear recent files list on sign-out */
    clearRecentsOnSignOut: boolean;
    
    /** Don't save any preferences locally */
    ephemeralSession: boolean;
    
    // ─────────────────────────────────────────────────────────
    // Notifications
    // ─────────────────────────────────────────────────────────
    
    /** Don't show browser notifications */
    disableNotifications: boolean;
}
```

### 3.2 Privacy Settings UI

```
┌─────────────────────────────────────────────────────────────────┐
│ Privacy Settings                                          [×]   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  COLLABORATION                                                  │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  [○] Use my real name: Alice Smith                             │
│  [●] Use a pseudonym: [Creative Writer      ]                  │
│                                                                 │
│  [○] Show my profile picture                                   │
│  [●] Hide profile picture                                      │
│                                                                 │
│  [ ] Hide which slide I'm viewing                              │
│      ↳ Others will see you're online but not where             │
│                                                                 │
│  LOCAL DATA                                                     │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  [✓] Clear recent files when I sign out                        │
│  [ ] Don't save any preferences (ephemeral session)            │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  [View what Story has access to]                               │
│  [Revoke Story's access to your account]                       │
│                                                                 │
│                                         [Cancel]   [Save]       │
└─────────────────────────────────────────────────────────────────┘
```

### 3.3 Access Revocation

```typescript
/**
 * User can revoke Story's access at any time
 */
class AccessRevocation {
    /**
     * Guide user to revoke OAuth access
     * (Must be done at provider, not in Story)
     */
    showRevocationInstructions(provider: 'microsoft' | 'google'): void {
        const instructions = {
            microsoft: {
                url: 'https://account.microsoft.com/privacy',
                steps: [
                    'Go to Microsoft Account Privacy Settings',
                    'Find "Apps and services"',
                    'Find Story in the list',
                    'Click "Remove access"'
                ]
            },
            google: {
                url: 'https://myaccount.google.com/permissions',
                steps: [
                    'Go to Google Account > Security > Third-party apps',
                    'Find Story in the list',
                    'Click "Remove Access"',
                    'Confirm removal'
                ]
            }
        };
        
        // Show modal with instructions
        this.showModal(instructions[provider]);
    }
    
    /**
     * Clear all local data after revocation
     */
    clearAllLocalData(): void {
        // Clear all localStorage keys with our prefix
        for (let i = localStorage.length - 1; i >= 0; i--) {
            const key = localStorage.key(i);
            if (key?.startsWith('story')) {
                localStorage.removeItem(key);
            }
        }
        
        // Clear sessionStorage
        sessionStorage.clear();
        
        // Clear IndexedDB (if used)
        indexedDB.deleteDatabase('story');
    }
}
```

---

## 4. Data Retention

### 4.1 Retention Periods

```
┌─────────────────────────────────────────────────────────────────┐
│                     DATA RETENTION POLICY                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  CLIENT-SIDE DATA                                               │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  Access Token          │ Until expiry (~1 hour) or tab close   │
│  Refresh Token         │ Until sign-out or revocation          │
│  Cached Profile        │ 24 hours, refreshed on sign-in       │
│  Preferences           │ Until cleared by user                 │
│  Recent Files          │ Until cleared by user (max 20 items) │
│                                                                 │
│  SERVER-SIDE DATA (What we DON'T have)                          │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  User accounts         │ N/A - we don't store accounts        │
│  Usage logs            │ N/A - we don't log usage             │
│  File content          │ N/A - stays in user's cloud          │
│  Collaboration history │ N/A - SignalR doesn't store          │
│                                                                 │
│  CLOUD PROVIDER DATA (in user's account, not ours)             │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  .story files          │ User controls in their cloud         │
│  Version history       │ Cloud provider's retention policy    │
│  Sharing permissions   │ Stored in file, user controls        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Automatic Cleanup

```typescript
/**
 * Automatic data cleanup
 */
class DataCleanup {
    /**
     * Run cleanup on app start
     */
    runCleanup(): void {
        this.cleanExpiredCache();
        this.trimRecentFiles();
        this.cleanStaleTokens();
    }
    
    /**
     * Remove expired cached data
     */
    private cleanExpiredCache(): void {
        const profileCache = localStorage.getItem('story:profile');
        if (profileCache) {
            const { cachedAt } = JSON.parse(profileCache);
            const age = Date.now() - new Date(cachedAt).getTime();
            
            // Remove if older than 24 hours
            if (age > 24 * 60 * 60 * 1000) {
                localStorage.removeItem('story:profile');
            }
        }
    }
    
    /**
     * Keep only recent N files
     */
    private trimRecentFiles(): void {
        const MAX_RECENT = 20;
        const prefs = localStorage.getItem('story:preferences');
        
        if (prefs) {
            const parsed = JSON.parse(prefs);
            if (parsed.recentFiles?.length > MAX_RECENT) {
                parsed.recentFiles = parsed.recentFiles.slice(0, MAX_RECENT);
                localStorage.setItem('story:preferences', JSON.stringify(parsed));
            }
        }
    }
    
    /**
     * Remove tokens that are clearly invalid
     */
    private cleanStaleTokens(): void {
        const expiresAt = sessionStorage.getItem('story_oauth_expires_at');
        if (expiresAt) {
            // If token expired more than 1 day ago, clean up
            const expiry = Number(expiresAt);
            if (Date.now() > expiry + 24 * 60 * 60 * 1000) {
                sessionStorage.removeItem('story_oauth_access_token');
                sessionStorage.removeItem('story_oauth_id_token');
                sessionStorage.removeItem('story_oauth_expires_at');
            }
        }
    }
}
```

---

## 5. Third-Party Data Sharing

### 5.1 What Flows Where

```
┌─────────────────────────────────────────────────────────────────┐
│                    DATA FLOW TO THIRD PARTIES                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  TO OAUTH PROVIDERS (Microsoft/Google)                          │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  We send:                                                  │ │
│  │  • OAuth requests (login, token refresh)                  │ │
│  │  • File API requests (read/write)                         │ │
│  │                                                            │ │
│  │  We DON'T send:                                            │ │
│  │  • Presentation content                                    │ │
│  │  • Usage analytics                                        │ │
│  │  • User behavior data                                     │ │
│  │                                                            │ │
│  │  Note: Providers have their own privacy policies          │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  TO AZURE SIGNALR (Collaboration)                               │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  We send:                                                  │ │
│  │  • Real-time collaboration messages                       │ │
│  │  • User presence info (name, color, cursor)              │ │
│  │                                                            │ │
│  │  SignalR:                                                  │ │
│  │  • Routes messages in real-time                           │ │
│  │  • Does NOT persist messages                              │ │
│  │  • Does NOT analyze content                               │ │
│  │                                                            │ │
│  │  Messages are transient - not stored by SignalR           │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  TO OTHER COLLABORATORS                                         │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  Visible to collaborators:                                │ │
│  │  • Your display name (or pseudonym if set)               │ │
│  │  • Your cursor color                                      │ │
│  │  • Your cursor position (unless hidden)                   │ │
│  │  • Your avatar (unless hidden)                           │ │
│  │                                                            │ │
│  │  NOT visible to collaborators:                            │ │
│  │  • Your email address                                     │ │
│  │  • Your OAuth provider                                    │ │
│  │  • Your device information                                │ │
│  │  • Your IP address                                        │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  TO ADVERTISERS / DATA BROKERS                                  │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  We share: NOTHING                                        │ │
│  │                                                            │ │
│  │  • No ads in Story                                        │ │
│  │  • No data selling                                        │ │
│  │  • No tracking pixels                                     │ │
│  │  • No third-party analytics                               │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Data Sharing Controls

```typescript
/**
 * Control what data is shared with collaborators
 */
interface SharingControls {
    /** What collaborators can see */
    collaboration: {
        shareDisplayName: boolean;      // Default: true
        shareAvatar: boolean;           // Default: true
        shareCursorPosition: boolean;   // Default: true
        shareCurrentSlide: boolean;     // Default: true
    };
    
    /** What file owner can see about you */
    fileOwner: {
        // Owner always sees your user ID (for permission management)
        // Owner always sees email if using cloud sharing
        shareActivityTime: boolean;     // When you last accessed
    };
}
```

---

## 6. GDPR Compliance

### 6.1 GDPR Rights Mapping

```
┌─────────────────────────────────────────────────────────────────┐
│                      GDPR RIGHTS MAPPING                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  RIGHT TO ACCESS (Art. 15)                                      │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  What data do we have?                                     │ │
│  │  • Essentially none server-side                            │ │
│  │  • Client-side: user can inspect localStorage             │ │
│  │                                                            │ │
│  │  How to access:                                            │ │
│  │  • Open browser DevTools → Application → Local Storage    │ │
│  │  • Filter by "story" prefix                               │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  RIGHT TO ERASURE (Art. 17)                                     │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  How to delete your data:                                  │ │
│  │  1. Sign out of Story                                     │ │
│  │  2. Clear browser data for story.app                      │ │
│  │  3. Revoke OAuth access at provider                       │ │
│  │                                                            │ │
│  │  Result: All traces of you are removed                    │ │
│  │  (We have nothing server-side to delete)                  │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  RIGHT TO DATA PORTABILITY (Art. 20)                            │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  Your data is already portable:                            │ │
│  │  • .story files are in YOUR cloud storage                 │ │
│  │  • You can download them anytime                          │ │
│  │  • You can move them to another provider                  │ │
│  │  • We don't lock you in                                   │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  RIGHT TO RECTIFICATION (Art. 16)                               │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  To correct your information:                              │ │
│  │  • Update your name/picture at OAuth provider             │ │
│  │  • Next sign-in will reflect changes                      │ │
│  │  • Or set a custom display name in Story                  │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  RIGHT TO OBJECT (Art. 21)                                      │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  We don't do any processing you'd need to object to:      │ │
│  │  • No profiling                                           │ │
│  │  • No automated decision-making                           │ │
│  │  • No marketing                                           │ │
│  │  • No analytics that identify you                         │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 GDPR-Friendly by Architecture

```typescript
/**
 * Why Story's architecture is GDPR-friendly
 */
const GDPR_ARCHITECTURE = {
    /**
     * Data minimization by default
     * We don't collect data we don't need
     */
    dataMinimization: true,
    
    /**
     * No consent management needed for most features
     * We don't do things that require consent
     */
    consentSimplified: true,
    
    /**
     * User data stays with user
     * Deletion is instant and complete
     */
    easyDeletion: true,
    
    /**
     * No data export needed
     * Files are already in user's cloud
     */
    builtInPortability: true,
    
    /**
     * No breach notification needed
     * Can't breach data we don't have
     */
    breachRiskMinimized: true,
    
    /**
     * No DPA needed for most operations
     * We're not a data processor if we don't store data
     */
    dpaSimplified: true
};
```

### 6.3 Privacy Policy Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                  PRIVACY POLICY KEY POINTS                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. We don't maintain a user database                           │
│  2. Your identity comes from Microsoft/Google                   │
│  3. Your files stay in your cloud storage                       │
│  4. We access only what you authorize via OAuth                 │
│  5. Collaboration messages are transient (not stored)          │
│  6. You can revoke access anytime at your OAuth provider       │
│  7. Local data (preferences) stays in your browser             │
│  8. We don't sell data or show ads                              │
│  9. Deleting your data = sign out + clear browser data         │
│  10. Your data is already portable (it's in your cloud)        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Related Specifications

- [Identity Architecture](./identity-architecture.md) - Overall architecture
- [Identity Security](./identity-security.md) - Security considerations
- [Collaboration Identity](./collaboration-identity.md) - Identity in collaboration
- [Sharing & Permissions](../sharing-permissions.md) - Access control

---

*Story's privacy model prioritizes user control and data minimization.*
