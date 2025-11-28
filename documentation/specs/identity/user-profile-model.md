# User Profile Model

## Overview

This specification defines the **user profile data model** for Story. Since Story uses a decentralized identity architecture, user profiles are derived from OAuth tokens and stored locally in the browser - not in a central database.

**Related Specifications:**
- [Identity Architecture](./identity-architecture.md) - Overall architecture
- [OAuth Identity Flow](./oauth-identity-flow.md) - Token-based identity
- [Session Lifecycle](./session-lifecycle.md) - Session management

---

## Table of Contents

1. [Profile Data Sources](#1-profile-data-sources)
2. [Profile Schema](#2-profile-schema)
3. [Profile Derivation](#3-profile-derivation)
4. [Local Storage](#4-local-storage)
5. [Profile Updates](#5-profile-updates)
6. [Collaboration Display](#6-collaboration-display)

---

## 1. Profile Data Sources

### 1.1 Where Profile Data Comes From

```
┌─────────────────────────────────────────────────────────────────┐
│                  PROFILE DATA SOURCES                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  OAUTH PROVIDER (Primary Source)                                │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  From ID Token:                                            │ │
│  │  • sub → userId (unique, stable)                          │ │
│  │  • email → email                                          │ │
│  │  • name → displayName                                     │ │
│  │  • given_name → firstName                                 │ │
│  │  • family_name → lastName                                 │ │
│  │  • picture → avatarUrl                                    │ │
│  │                                                            │ │
│  │  ✅ Trusted source of identity                            │ │
│  │  ✅ Always current (refreshed with tokens)                │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  LOCAL PREFERENCES (User-Controlled)                            │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  Stored in localStorage:                                   │ │
│  │  • displayNameOverride (custom name for Story)            │ │
│  │  • preferredColor (collaboration cursor color)            │ │
│  │  • theme (light/dark/system)                              │ │
│  │  • language (UI language)                                 │ │
│  │  • recentFiles                                            │ │
│  │                                                            │ │
│  │  ✅ User can customize                                    │ │
│  │  ✅ Persists across sessions                              │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  DERIVED (Computed)                                             │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  Computed at runtime:                                      │ │
│  │  • initials (from name)                                   │ │
│  │  • consistentId (provider + sub)                          │ │
│  │  • colorHash (if no preferred color)                      │ │
│  │                                                            │ │
│  │  ✅ No storage needed                                     │ │
│  │  ✅ Consistent algorithm                                  │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 What We DON'T Store

| Data | Why Not |
|------|---------|
| Password | OAuth handles authentication |
| Profile picture file | URL from OAuth, cached by browser |
| Full name (server-side) | Comes fresh from OAuth each time |
| Account creation date | No account = no creation date |
| Login history | No server = no logs |

---

## 2. Profile Schema

### 2.1 Core Profile Interface

```typescript
/**
 * Core user profile derived from OAuth
 */
interface UserProfile {
    // ─────────────────────────────────────────────────────────
    // Identity (from OAuth)
    // ─────────────────────────────────────────────────────────
    
    /** Unique user ID (provider_sub format) */
    id: string;
    
    /** OAuth provider */
    provider: 'microsoft' | 'google';
    
    /** Email address */
    email: string;
    
    /** Whether email is verified by provider */
    emailVerified: boolean;
    
    // ─────────────────────────────────────────────────────────
    // Display Information (from OAuth + overrides)
    // ─────────────────────────────────────────────────────────
    
    /** Display name (may be overridden) */
    displayName: string;
    
    /** Original name from OAuth */
    originalDisplayName: string;
    
    /** First name */
    firstName?: string;
    
    /** Last name */
    lastName?: string;
    
    /** Avatar URL */
    avatarUrl?: string;
    
    // ─────────────────────────────────────────────────────────
    // Derived (computed)
    // ─────────────────────────────────────────────────────────
    
    /** Initials for avatar fallback */
    initials: string;
    
    /** Consistent color for collaboration */
    color: string;
}

/**
 * User preferences stored locally
 */
interface UserPreferences {
    /** Custom display name for Story */
    displayNameOverride?: string;
    
    /** Preferred collaboration cursor color */
    preferredColor?: string;
    
    /** Theme preference */
    theme: 'light' | 'dark' | 'system';
    
    /** UI language */
    language: string;
    
    /** Default storage provider */
    defaultStorageProvider: 'onedrive' | 'google-drive' | 'local';
    
    /** Recent files list */
    recentFiles: RecentFile[];
    
    /** Keyboard shortcuts customization */
    shortcuts?: Record<string, string>;
}

interface RecentFile {
    id: string;
    name: string;
    provider: string;
    lastOpened: string;
    thumbnailUrl?: string;
}
```

### 2.2 Full User State

```typescript
/**
 * Complete user state (profile + preferences + session)
 */
interface UserState {
    /** User profile */
    profile: UserProfile;
    
    /** User preferences */
    preferences: UserPreferences;
    
    /** Session state */
    session: {
        /** Is currently signed in */
        isAuthenticated: boolean;
        
        /** When session started */
        sessionStart: Date;
        
        /** Token expiration */
        tokenExpiresAt: Date;
        
        /** Active storage provider */
        activeStorageProvider: string;
    };
}
```

---

## 3. Profile Derivation

### 3.1 Building Profile from OAuth Token

```typescript
/**
 * Build user profile from OAuth result
 */
class ProfileBuilder {
    /**
     * Create profile from OAuth authentication result
     */
    buildFromOAuth(
        idTokenClaims: IDTokenClaims,
        provider: 'microsoft' | 'google',
        savedPreferences?: UserPreferences
    ): UserProfile {
        // Core identity
        const id = `${provider}_${idTokenClaims.sub}`;
        const email = idTokenClaims.email || '';
        
        // Display name (use override if available)
        const originalDisplayName = this.extractDisplayName(idTokenClaims);
        const displayName = savedPreferences?.displayNameOverride || originalDisplayName;
        
        // Initials
        const initials = this.extractInitials(displayName);
        
        // Color (use preference or generate from ID)
        const color = savedPreferences?.preferredColor || this.generateColor(id);
        
        return {
            id,
            provider,
            email,
            emailVerified: idTokenClaims.email_verified ?? true,
            
            displayName,
            originalDisplayName,
            firstName: idTokenClaims.given_name,
            lastName: idTokenClaims.family_name,
            avatarUrl: idTokenClaims.picture,
            
            initials,
            color
        };
    }
    
    /**
     * Extract display name from various claim formats
     */
    private extractDisplayName(claims: IDTokenClaims): string {
        // Try full name
        if (claims.name) {
            return claims.name;
        }
        
        // Try first + last
        if (claims.given_name || claims.family_name) {
            return [claims.given_name, claims.family_name]
                .filter(Boolean)
                .join(' ');
        }
        
        // Fall back to email prefix
        if (claims.email) {
            return claims.email.split('@')[0];
        }
        
        // Last resort
        return 'Anonymous User';
    }
    
    /**
     * Extract initials from display name
     */
    private extractInitials(displayName: string): string {
        const parts = displayName.trim().split(/\s+/);
        
        if (parts.length >= 2) {
            // First letter of first and last word
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        } else if (parts.length === 1 && parts[0].length >= 2) {
            // First two letters of single word
            return parts[0].substring(0, 2).toUpperCase();
        } else {
            return '??';
        }
    }
    
    /**
     * Generate consistent color from user ID
     */
    private generateColor(userId: string): string {
        // Hash the user ID to get a consistent number
        let hash = 0;
        for (let i = 0; i < userId.length; i++) {
            const char = userId.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        
        // Convert to HSL color (fixed saturation and lightness for visibility)
        const hue = Math.abs(hash) % 360;
        return `hsl(${hue}, 70%, 50%)`;
    }
}

interface IDTokenClaims {
    sub: string;
    email?: string;
    email_verified?: boolean;
    name?: string;
    given_name?: string;
    family_name?: string;
    picture?: string;
}
```

### 3.2 Predefined Colors Palette

```typescript
/**
 * Predefined colors for user selection
 * These are designed to be distinct and accessible
 */
const COLLABORATION_COLORS = [
    { name: 'Red', value: '#FF6B6B' },
    { name: 'Orange', value: '#FFA94D' },
    { name: 'Yellow', value: '#FFD43B' },
    { name: 'Green', value: '#69DB7C' },
    { name: 'Teal', value: '#38D9A9' },
    { name: 'Cyan', value: '#3BC9DB' },
    { name: 'Blue', value: '#4DABF7' },
    { name: 'Indigo', value: '#748FFC' },
    { name: 'Violet', value: '#9775FA' },
    { name: 'Pink', value: '#F783AC' },
    { name: 'Gray', value: '#868E96' }
];

/**
 * Check if a color has good contrast
 */
function hasGoodContrast(color: string, background: 'light' | 'dark'): boolean {
    // Parse HSL or convert hex to determine luminance
    // Ensure color is visible on collaboration cursors
    // This is simplified - real implementation would use WCAG formulas
    return true;
}
```

---

## 4. Local Storage

### 4.1 Storage Schema

```typescript
/**
 * What gets stored in localStorage
 */
interface LocalStorageSchema {
    // User profile cache (for fast startup)
    'story:profile': {
        profile: UserProfile;
        cachedAt: string;
        provider: string;
    };
    
    // User preferences
    'story:preferences': UserPreferences;
    
    // Session hints (not actual tokens)
    'story:session': {
        lastProvider: 'microsoft' | 'google';
        lastSignIn: string;
    };
}
```

### 4.2 Storage Manager

```typescript
/**
 * Manage local storage for user data
 */
class UserStorageManager {
    private readonly PROFILE_KEY = 'story:profile';
    private readonly PREFERENCES_KEY = 'story:preferences';
    private readonly SESSION_KEY = 'story:session';
    
    // ─────────────────────────────────────────────────────────
    // Profile Operations
    // ─────────────────────────────────────────────────────────
    
    /**
     * Cache profile for fast startup
     */
    cacheProfile(profile: UserProfile): void {
        const cached = {
            profile,
            cachedAt: new Date().toISOString(),
            provider: profile.provider
        };
        
        localStorage.setItem(this.PROFILE_KEY, JSON.stringify(cached));
    }
    
    /**
     * Get cached profile (for instant UI before token validation)
     */
    getCachedProfile(): UserProfile | null {
        const cached = localStorage.getItem(this.PROFILE_KEY);
        if (!cached) return null;
        
        try {
            const { profile, cachedAt } = JSON.parse(cached);
            
            // Profile cache is valid for 24 hours
            const cacheAge = Date.now() - new Date(cachedAt).getTime();
            if (cacheAge > 24 * 60 * 60 * 1000) {
                return null;
            }
            
            return profile;
        } catch {
            return null;
        }
    }
    
    /**
     * Clear profile cache (on sign-out)
     */
    clearProfileCache(): void {
        localStorage.removeItem(this.PROFILE_KEY);
    }
    
    // ─────────────────────────────────────────────────────────
    // Preferences Operations
    // ─────────────────────────────────────────────────────────
    
    /**
     * Get user preferences (with defaults)
     */
    getPreferences(): UserPreferences {
        const stored = localStorage.getItem(this.PREFERENCES_KEY);
        const defaults = this.getDefaultPreferences();
        
        if (!stored) {
            return defaults;
        }
        
        try {
            return { ...defaults, ...JSON.parse(stored) };
        } catch {
            return defaults;
        }
    }
    
    /**
     * Save user preferences
     */
    savePreferences(preferences: Partial<UserPreferences>): void {
        const current = this.getPreferences();
        const updated = { ...current, ...preferences };
        
        localStorage.setItem(this.PREFERENCES_KEY, JSON.stringify(updated));
    }
    
    /**
     * Default preferences
     */
    private getDefaultPreferences(): UserPreferences {
        return {
            theme: 'system',
            language: navigator.language || 'en-US',
            defaultStorageProvider: 'local',
            recentFiles: []
        };
    }
    
    // ─────────────────────────────────────────────────────────
    // Session Hints
    // ─────────────────────────────────────────────────────────
    
    /**
     * Save session hint for faster sign-in
     */
    saveSessionHint(provider: 'microsoft' | 'google'): void {
        const hint = {
            lastProvider: provider,
            lastSignIn: new Date().toISOString()
        };
        
        localStorage.setItem(this.SESSION_KEY, JSON.stringify(hint));
    }
    
    /**
     * Get last used provider (for smart sign-in UI)
     */
    getLastProvider(): 'microsoft' | 'google' | null {
        const stored = localStorage.getItem(this.SESSION_KEY);
        if (!stored) return null;
        
        try {
            return JSON.parse(stored).lastProvider;
        } catch {
            return null;
        }
    }
    
    // ─────────────────────────────────────────────────────────
    // Clear All
    // ─────────────────────────────────────────────────────────
    
    /**
     * Clear all user data (sign-out or data reset)
     */
    clearAll(): void {
        localStorage.removeItem(this.PROFILE_KEY);
        localStorage.removeItem(this.PREFERENCES_KEY);
        localStorage.removeItem(this.SESSION_KEY);
    }
}
```

---

## 5. Profile Updates

### 5.1 Update Scenarios

```
┌─────────────────────────────────────────────────────────────────┐
│                   PROFILE UPDATE SCENARIOS                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. TOKEN REFRESH                                               │
│     ┌─────────────────────────────────────────────────────┐    │
│     │  • New ID token received                            │    │
│     │  • Re-parse claims                                  │    │
│     │  • Update profile with new OAuth data              │    │
│     │  • Preserve user preferences/overrides             │    │
│     └─────────────────────────────────────────────────────┘    │
│                                                                 │
│  2. USER CHANGES PREFERENCE                                     │
│     ┌─────────────────────────────────────────────────────┐    │
│     │  • User picks new color                             │    │
│     │  • User sets custom display name                    │    │
│     │  • Save to localStorage                            │    │
│     │  • Update in-memory profile                        │    │
│     │  • Notify collaboration clients                    │    │
│     └─────────────────────────────────────────────────────┘    │
│                                                                 │
│  3. OAUTH PROFILE CHANGED                                       │
│     ┌─────────────────────────────────────────────────────┐    │
│     │  • User changed name/picture at provider           │    │
│     │  • Detected on next token refresh                  │    │
│     │  • Update originalDisplayName                      │    │
│     │  • Only update displayName if no override         │    │
│     └─────────────────────────────────────────────────────┘    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Profile Manager

```typescript
/**
 * Manage user profile updates
 */
class ProfileManager {
    private currentProfile: UserProfile | null = null;
    private storage: UserStorageManager;
    private builder: ProfileBuilder;
    private listeners: Set<(profile: UserProfile) => void> = new Set();
    
    constructor() {
        this.storage = new UserStorageManager();
        this.builder = new ProfileBuilder();
    }
    
    /**
     * Initialize profile from cached data or OAuth
     */
    async initialize(): Promise<UserProfile | null> {
        // Try cached profile first (for instant UI)
        const cached = this.storage.getCachedProfile();
        if (cached) {
            this.currentProfile = cached;
            this.notifyListeners();
        }
        
        // Will be updated when OAuth completes
        return cached;
    }
    
    /**
     * Update profile from OAuth result
     */
    updateFromOAuth(idTokenClaims: IDTokenClaims, provider: 'microsoft' | 'google'): void {
        const preferences = this.storage.getPreferences();
        
        this.currentProfile = this.builder.buildFromOAuth(
            idTokenClaims,
            provider,
            preferences
        );
        
        // Cache for next startup
        this.storage.cacheProfile(this.currentProfile);
        this.storage.saveSessionHint(provider);
        
        this.notifyListeners();
    }
    
    /**
     * Update display name preference
     */
    updateDisplayName(newName: string | null): void {
        if (!this.currentProfile) return;
        
        if (newName) {
            this.storage.savePreferences({ displayNameOverride: newName });
            this.currentProfile.displayName = newName;
        } else {
            // Clear override, revert to OAuth name
            this.storage.savePreferences({ displayNameOverride: undefined });
            this.currentProfile.displayName = this.currentProfile.originalDisplayName;
        }
        
        // Update derived fields
        this.currentProfile.initials = this.builder['extractInitials'](
            this.currentProfile.displayName
        );
        
        this.storage.cacheProfile(this.currentProfile);
        this.notifyListeners();
    }
    
    /**
     * Update preferred color
     */
    updateColor(newColor: string): void {
        if (!this.currentProfile) return;
        
        this.storage.savePreferences({ preferredColor: newColor });
        this.currentProfile.color = newColor;
        
        this.storage.cacheProfile(this.currentProfile);
        this.notifyListeners();
    }
    
    /**
     * Get current profile
     */
    getProfile(): UserProfile | null {
        return this.currentProfile;
    }
    
    /**
     * Subscribe to profile changes
     */
    subscribe(listener: (profile: UserProfile) => void): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }
    
    /**
     * Clear profile (sign-out)
     */
    clear(): void {
        this.currentProfile = null;
        this.storage.clearProfileCache();
        this.notifyListeners();
    }
    
    private notifyListeners(): void {
        if (this.currentProfile) {
            this.listeners.forEach(listener => listener(this.currentProfile!));
        }
    }
}
```

---

## 6. Collaboration Display

### 6.1 Presence Info

```typescript
/**
 * User info sent in collaboration messages
 * Minimal subset of profile for privacy
 */
interface CollaborationPresence {
    /** User ID (for tracking) */
    id: string;
    
    /** Display name (may be override) */
    displayName: string;
    
    /** Initials for avatar fallback */
    initials: string;
    
    /** Avatar URL (optional) */
    avatarUrl?: string;
    
    /** Collaboration color */
    color: string;
}

/**
 * Convert profile to presence info
 */
function toPresence(profile: UserProfile): CollaborationPresence {
    return {
        id: profile.id,
        displayName: profile.displayName,
        initials: profile.initials,
        avatarUrl: profile.avatarUrl,
        color: profile.color
    };
}
```

### 6.2 Avatar Component (Conceptual)

```typescript
/**
 * Render user avatar with fallback
 */
interface AvatarProps {
    presence: CollaborationPresence;
    size: 'small' | 'medium' | 'large';
    showName?: boolean;
}

// Avatar renders:
// 1. Profile picture if avatarUrl exists
// 2. Colored circle with initials if no picture
// 3. Colored border to indicate collaboration color

// Example HTML structure:
// <div class="avatar" style="--user-color: ${presence.color}">
//   <img src="${presence.avatarUrl}" alt="${presence.displayName}" />
//   <!-- or -->
//   <span class="initials">${presence.initials}</span>
// </div>
```

### 6.3 Cursor Label

```typescript
/**
 * Cursor label for collaboration
 */
interface CursorLabel {
    /** User's display name */
    name: string;
    
    /** Label background color */
    color: string;
}

function toCursorLabel(presence: CollaborationPresence): CursorLabel {
    return {
        name: presence.displayName,
        color: presence.color
    };
}

// Renders as:
// ┌─────────────┐
// │ Alice Smith │ ◄── name in colored box
// └─────────────┘
//   |
//   ◢ ◄── cursor with same color
```

---

## Related Specifications

- [Identity Architecture](./identity-architecture.md) - Overall architecture
- [OAuth Identity Flow](./oauth-identity-flow.md) - Token handling
- [Collaboration Identity](./collaboration-identity.md) - Presence in collaboration
- [Privacy Model](./privacy-model.md) - What data we share

---

*User profiles in Story are derived from OAuth, cached locally, and customizable by users.*
