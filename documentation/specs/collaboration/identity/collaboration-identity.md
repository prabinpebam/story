# Collaboration Identity

## Overview

This specification defines how **user identity works in real-time collaboration**. When multiple users collaborate on a presentation, each participant's identity must be visible to others for cursors, selections, comments, and presence indicators.

**Related Specifications:**
- [Identity Architecture](./identity-architecture.md) - Overall architecture
- [User Profile Model](./user-profile-model.md) - Profile data
- [Real-Time Collaboration](../realtime-collaboration.md) - Collaboration system
- [Trust Relationships](./trust-relationships.md) - Trust model

---

## Table of Contents

1. [Collaboration Identity Model](#1-collaboration-identity-model)
2. [Identity in Messages](#2-identity-in-messages)
3. [Presence Display](#3-presence-display)
4. [Identity Privacy](#4-identity-privacy)
5. [Conflict Resolution](#5-conflict-resolution)
6. [Guest vs Authenticated](#6-guest-vs-authenticated)

---

## 1. Collaboration Identity Model

### 1.1 Identity Flow in Collaboration

```
┌─────────────────────────────────────────────────────────────────────────┐
│                   COLLABORATION IDENTITY FLOW                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │                        ALICE'S BROWSER                            │ │
│  │                                                                    │ │
│  │  1. OAuth Sign-In → Get ID Token                                  │ │
│  │                      ↓                                            │ │
│  │  2. Parse Token → Extract User Info                               │ │
│  │                    { id: "google_123", name: "Alice" }            │ │
│  │                      ↓                                            │ │
│  │  3. Generate Collaboration Identity                               │ │
│  │     { id, displayName, avatarUrl, color }                        │ │
│  │                      ↓                                            │ │
│  │  4. Include Identity in All Messages                              │ │
│  │     { type: "cursor:move", userInfo: {...}, payload: {...} }     │ │
│  │                                                                    │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                               │                                         │
│                               ▼                                         │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │                      SIGNALR (Relay)                              │ │
│  │                                                                    │ │
│  │  • Routes messages between participants                           │ │
│  │  • Does NOT verify identity                                       │ │
│  │  • Does NOT store identity                                        │ │
│  │  • Just a "dumb pipe"                                             │ │
│  │                                                                    │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                               │                                         │
│                               ▼                                         │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │                        BOB'S BROWSER                              │ │
│  │                                                                    │ │
│  │  1. Receive Message with userInfo                                 │ │
│  │                      ↓                                            │ │
│  │  2. Extract Sender Identity                                       │ │
│  │     userInfo: { id, displayName, avatarUrl, color }              │ │
│  │                      ↓                                            │ │
│  │  3. Display Sender's Presence                                     │ │
│  │     • Show cursor with Alice's name and color                    │ │
│  │     • Show Alice in collaborators list                           │ │
│  │     • Attribute edits to Alice                                   │ │
│  │                                                                    │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Collaboration Identity Interface

```typescript
/**
 * Identity sent with collaboration messages
 * Minimal subset for privacy
 */
interface CollaborationIdentity {
    /** Unique user ID (provider_sub format) */
    id: string;
    
    /** Display name (may be override) */
    displayName: string;
    
    /** Initials for avatar fallback */
    initials: string;
    
    /** Avatar URL (optional - user may hide) */
    avatarUrl?: string;
    
    /** Collaboration color */
    color: string;
    
    /** Session ID (unique per browser session) */
    sessionId: string;
}

/**
 * Build collaboration identity from user profile
 */
function buildCollaborationIdentity(
    profile: UserProfile,
    privacySettings: PrivacySettings
): CollaborationIdentity {
    return {
        id: profile.id,
        displayName: privacySettings.hideRealName 
            ? privacySettings.pseudonym || 'Anonymous'
            : profile.displayName,
        initials: privacySettings.hideRealName
            ? getInitials(privacySettings.pseudonym || 'Anonymous')
            : profile.initials,
        avatarUrl: privacySettings.hideAvatar 
            ? undefined 
            : profile.avatarUrl,
        color: profile.color,
        sessionId: generateSessionId()
    };
}
```

---

## 2. Identity in Messages

### 2.1 Message Structure

```typescript
/**
 * All collaboration messages include sender identity
 */
interface CollaborationMessage<T = any> {
    /** Message type */
    type: MessageType;
    
    /** Sender's identity */
    userInfo: CollaborationIdentity;
    
    /** Message payload */
    payload: T;
    
    /** Timestamp */
    timestamp: number;
    
    /** Message ID (for deduplication) */
    messageId: string;
}

type MessageType =
    | 'cursor:move'
    | 'cursor:leave'
    | 'selection:change'
    | 'operation:apply'
    | 'presence:join'
    | 'presence:leave'
    | 'presence:heartbeat'
    | 'comment:add'
    | 'comment:reply';
```

### 2.2 Message Examples

```typescript
// Cursor movement
const cursorMessage: CollaborationMessage<CursorPayload> = {
    type: 'cursor:move',
    userInfo: {
        id: 'google_123',
        displayName: 'Alice Smith',
        initials: 'AS',
        avatarUrl: 'https://...',
        color: '#FF6B6B',
        sessionId: 'sess_abc123'
    },
    payload: {
        slideId: 'slide_1',
        x: 450,
        y: 230
    },
    timestamp: 1701234567890,
    messageId: 'msg_xyz789'
};

// Edit operation
const operationMessage: CollaborationMessage<OperationPayload> = {
    type: 'operation:apply',
    userInfo: {
        id: 'microsoft_456',
        displayName: 'Bob',
        initials: 'B',
        color: '#4DABF7',
        sessionId: 'sess_def456'
    },
    payload: {
        operations: [
            {
                type: 'update',
                path: ['slides', 'slide_1', 'elements', 'text_1', 'content'],
                value: 'Hello World'
            }
        ],
        baseVersion: 42
    },
    timestamp: 1701234567891,
    messageId: 'msg_abc123'
};
```

### 2.3 Identity Attachment

```typescript
/**
 * Automatically attach identity to outgoing messages
 */
class MessageBuilder {
    constructor(
        private identity: CollaborationIdentity
    ) {}
    
    /**
     * Create a collaboration message with identity attached
     */
    build<T>(type: MessageType, payload: T): CollaborationMessage<T> {
        return {
            type,
            userInfo: this.identity,
            payload,
            timestamp: Date.now(),
            messageId: this.generateMessageId()
        };
    }
    
    /**
     * Update identity (e.g., when user changes name/color)
     */
    updateIdentity(updates: Partial<CollaborationIdentity>): void {
        Object.assign(this.identity, updates);
    }
    
    private generateMessageId(): string {
        return `${this.identity.sessionId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}
```

---

## 3. Presence Display

### 3.1 Presence List

```
┌─────────────────────────────────────────────────────────────────┐
│                      PRESENCE DISPLAY                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  COLLABORATORS LIST (Header/Sidebar)                            │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  Collaborators (3)                                        │ │
│  │                                                            │ │
│  │  [🔴] Alice Smith (You)                  ← Owner, self    │ │
│  │  [🟢] Bob Johnson        Editing Slide 2 ← Active editor  │ │
│  │  [🟡] Carol Williams     Viewing         ← Viewer         │ │
│  │                                                            │ │
│  │  [Invite...]                                               │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  AVATAR STACK (Compact)                                         │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │       ┌──┐┌──┐┌──┐                                        │ │
│  │       │AS││BJ││CW│ +2                                     │ │
│  │       └──┘└──┘└──┘                                        │ │
│  │        ↑   ↑   ↑                                          │ │
│  │   Colored borders = collaboration color                   │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  CURSOR LABELS (On Canvas)                                      │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                                                            │ │
│  │           ┌────────────┐                                  │ │
│  │           │ Bob Johnson│ ◄── Colored label                │ │
│  │           └────────────┘                                  │ │
│  │              ◢ ◄── Cursor with same color                │ │
│  │                                                            │ │
│  │                      ┌───────────────┐                    │ │
│  │                      │Carol Williams │                    │ │
│  │                      └───────────────┘                    │ │
│  │                         ◢                                 │ │
│  │                                                            │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Presence State Management

```typescript
/**
 * Track all collaborators' presence
 */
class PresenceManager {
    private collaborators = new Map<string, CollaboratorPresence>();
    private listeners: Set<(collaborators: CollaboratorPresence[]) => void> = new Set();
    
    /**
     * Handle presence update from collaboration message
     */
    handleMessage(message: CollaborationMessage): void {
        const { userInfo } = message;
        
        // Update or add collaborator
        const existing = this.collaborators.get(userInfo.id);
        
        const presence: CollaboratorPresence = {
            ...userInfo,
            lastSeen: Date.now(),
            status: this.inferStatus(message),
            currentSlide: this.extractCurrentSlide(message)
        };
        
        if (message.type === 'presence:leave') {
            this.collaborators.delete(userInfo.id);
        } else {
            this.collaborators.set(userInfo.id, presence);
        }
        
        this.notifyListeners();
    }
    
    /**
     * Get all active collaborators
     */
    getCollaborators(): CollaboratorPresence[] {
        const now = Date.now();
        const staleThreshold = 30000; // 30 seconds
        
        return Array.from(this.collaborators.values())
            .filter(c => now - c.lastSeen < staleThreshold);
    }
    
    /**
     * Check for stale collaborators (no heartbeat)
     */
    pruneStale(): void {
        const now = Date.now();
        const staleThreshold = 30000;
        
        for (const [id, presence] of this.collaborators) {
            if (now - presence.lastSeen > staleThreshold) {
                this.collaborators.delete(id);
            }
        }
        
        this.notifyListeners();
    }
    
    private inferStatus(message: CollaborationMessage): CollaboratorStatus {
        switch (message.type) {
            case 'operation:apply':
                return 'editing';
            case 'cursor:move':
            case 'selection:change':
                return 'active';
            default:
                return 'viewing';
        }
    }
    
    private extractCurrentSlide(message: CollaborationMessage): string | null {
        if (message.type === 'cursor:move') {
            return message.payload.slideId;
        }
        if (message.type === 'operation:apply') {
            const firstOp = message.payload.operations[0];
            if (firstOp?.path[0] === 'slides') {
                return firstOp.path[1];
            }
        }
        return null;
    }
    
    private notifyListeners(): void {
        const collaborators = this.getCollaborators();
        this.listeners.forEach(listener => listener(collaborators));
    }
}

interface CollaboratorPresence extends CollaborationIdentity {
    lastSeen: number;
    status: CollaboratorStatus;
    currentSlide: string | null;
}

type CollaboratorStatus = 'editing' | 'active' | 'viewing' | 'idle';
```

---

## 4. Identity Privacy

### 4.1 Privacy Controls

```typescript
/**
 * Privacy settings for collaboration
 */
interface PrivacySettings {
    /** Use pseudonym instead of real name */
    hideRealName: boolean;
    
    /** Custom name to show if hiding real name */
    pseudonym?: string;
    
    /** Hide profile picture */
    hideAvatar: boolean;
    
    /** Hide current slide/location */
    hideLocation: boolean;
    
    /** Show as "Anonymous" even to file owner */
    incognito: boolean;
}

const DEFAULT_PRIVACY: PrivacySettings = {
    hideRealName: false,
    hideAvatar: false,
    hideLocation: false,
    incognito: false
};
```

### 4.2 What Others See

```
┌─────────────────────────────────────────────────────────────────┐
│              WHAT OTHERS CAN SEE ABOUT YOU                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ALWAYS VISIBLE:                                                │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  • Your unique session ID (for cursor tracking)          │ │
│  │  • Your collaboration color                              │ │
│  │  • That you are present                                  │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  BASED ON PRIVACY SETTINGS:                                     │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  hideRealName = false:                                    │ │
│  │    • Your display name from OAuth                        │ │
│  │    • Your initials                                       │ │
│  │                                                           │ │
│  │  hideRealName = true:                                     │ │
│  │    • Your pseudonym (or "Anonymous")                     │ │
│  │    • Pseudonym initials                                  │ │
│  └───────────────────────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  hideAvatar = false:                                      │ │
│  │    • Your profile picture URL                            │ │
│  │                                                           │ │
│  │  hideAvatar = true:                                       │ │
│  │    • No picture (initials only)                          │ │
│  └───────────────────────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  hideLocation = false:                                    │ │
│  │    • Which slide you're viewing                          │ │
│  │    • Your cursor position                                │ │
│  │                                                           │ │
│  │  hideLocation = true:                                     │ │
│  │    • Only presence (not location)                        │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  NEVER VISIBLE TO OTHER COLLABORATORS:                          │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  • Your email address                                     │ │
│  │  • Your OAuth provider                                   │ │
│  │  • Your refresh token                                    │ │
│  │  • Your browser/device info                              │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 4.3 Privacy-Aware Identity Builder

```typescript
/**
 * Build collaboration identity respecting privacy settings
 */
function buildPrivacyAwareIdentity(
    profile: UserProfile,
    privacy: PrivacySettings
): CollaborationIdentity {
    // Determine display name
    let displayName: string;
    let initials: string;
    
    if (privacy.incognito) {
        displayName = 'Anonymous';
        initials = '?';
    } else if (privacy.hideRealName) {
        displayName = privacy.pseudonym || 'Anonymous';
        initials = getInitials(displayName);
    } else {
        displayName = profile.displayName;
        initials = profile.initials;
    }
    
    // Determine avatar
    const avatarUrl = privacy.hideAvatar ? undefined : profile.avatarUrl;
    
    return {
        id: privacy.incognito 
            ? `anon_${generateRandomId()}` 
            : profile.id,
        displayName,
        initials,
        avatarUrl,
        color: profile.color,
        sessionId: generateSessionId()
    };
}
```

---

## 5. Conflict Resolution

### 5.1 Identity Conflicts

```
┌─────────────────────────────────────────────────────────────────┐
│                   IDENTITY CONFLICT SCENARIOS                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  SCENARIO 1: Same User, Multiple Tabs                           │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  Problem: Alice opens file in two tabs                    │ │
│  │                                                            │ │
│  │  Solution:                                                 │ │
│  │  • Each tab has unique sessionId                          │ │
│  │  • Show as "Alice Smith" and "Alice Smith (2)"           │ │
│  │  • Or show as single presence (deduplicate by user ID)   │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  SCENARIO 2: Same User, Multiple Devices                        │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  Problem: Alice on laptop and tablet simultaneously       │ │
│  │                                                            │ │
│  │  Solution:                                                 │ │
│  │  • Same user ID, different session IDs                   │ │
│  │  • Show as "Alice (Laptop)" and "Alice (Tablet)"         │ │
│  │  • Or deduplicate, show single cursor following latest   │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  SCENARIO 3: Color Collision                                    │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  Problem: Two users have same/similar color               │ │
│  │                                                            │ │
│  │  Solution:                                                 │ │
│  │  • Detect color proximity on join                        │ │
│  │  • Automatically shift one user's color                  │ │
│  │  • Or allow users to pick from palette                   │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Session Deduplication

```typescript
/**
 * Handle multiple sessions from same user
 */
class SessionDeduplicator {
    private userSessions = new Map<string, Set<string>>(); // userId -> sessionIds
    
    /**
     * Register a session
     */
    registerSession(userId: string, sessionId: string): void {
        if (!this.userSessions.has(userId)) {
            this.userSessions.set(userId, new Set());
        }
        this.userSessions.get(userId)!.add(sessionId);
    }
    
    /**
     * Unregister a session
     */
    unregisterSession(userId: string, sessionId: string): void {
        const sessions = this.userSessions.get(userId);
        if (sessions) {
            sessions.delete(sessionId);
            if (sessions.size === 0) {
                this.userSessions.delete(userId);
            }
        }
    }
    
    /**
     * Get session count for user
     */
    getSessionCount(userId: string): number {
        return this.userSessions.get(userId)?.size || 0;
    }
    
    /**
     * Generate display name with session indicator
     */
    getDisplayName(identity: CollaborationIdentity): string {
        const count = this.getSessionCount(identity.id);
        
        if (count <= 1) {
            return identity.displayName;
        }
        
        // Find this session's index
        const sessions = Array.from(this.userSessions.get(identity.id) || []);
        const index = sessions.indexOf(identity.sessionId) + 1;
        
        return `${identity.displayName} (${index})`;
    }
}
```

### 5.3 Color Collision Handling

```typescript
/**
 * Ensure cursor colors are distinguishable
 */
class ColorCollisionHandler {
    private usedColors = new Map<string, string>(); // userId -> color
    
    /**
     * Assign a color to a user, adjusting for collisions
     */
    assignColor(userId: string, preferredColor: string): string {
        // Check if preferred color is available
        if (!this.isColorTooClose(preferredColor)) {
            this.usedColors.set(userId, preferredColor);
            return preferredColor;
        }
        
        // Find an alternative color
        const alternativeColor = this.findAlternativeColor(preferredColor);
        this.usedColors.set(userId, alternativeColor);
        return alternativeColor;
    }
    
    /**
     * Check if a color is too close to existing colors
     */
    private isColorTooClose(color: string): boolean {
        for (const usedColor of this.usedColors.values()) {
            if (this.colorDistance(color, usedColor) < 30) {
                return true;
            }
        }
        return false;
    }
    
    /**
     * Calculate perceptual distance between colors
     */
    private colorDistance(color1: string, color2: string): number {
        const hsl1 = this.parseHSL(color1);
        const hsl2 = this.parseHSL(color2);
        
        // Simple hue distance
        const hueDiff = Math.abs(hsl1.h - hsl2.h);
        return Math.min(hueDiff, 360 - hueDiff);
    }
    
    /**
     * Find an alternative color with good distance
     */
    private findAlternativeColor(preferred: string): string {
        const hsl = this.parseHSL(preferred);
        
        // Try shifting hue in 30-degree increments
        for (let shift = 30; shift <= 180; shift += 30) {
            const newHue = (hsl.h + shift) % 360;
            const newColor = `hsl(${newHue}, ${hsl.s}%, ${hsl.l}%)`;
            
            if (!this.isColorTooClose(newColor)) {
                return newColor;
            }
        }
        
        // Fallback to random
        return `hsl(${Math.random() * 360}, 70%, 50%)`;
    }
    
    private parseHSL(color: string): { h: number; s: number; l: number } {
        const match = color.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
        if (match) {
            return {
                h: parseInt(match[1]),
                s: parseInt(match[2]),
                l: parseInt(match[3])
            };
        }
        // Fallback for hex colors - would need conversion
        return { h: 0, s: 70, l: 50 };
    }
}
```

---

## 6. Guest vs Authenticated

### 6.1 Access Levels

```
┌─────────────────────────────────────────────────────────────────┐
│                GUEST vs AUTHENTICATED IDENTITY                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  AUTHENTICATED USER (Signed in with OAuth)                      │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  Identity Source: OAuth ID token                          │ │
│  │                                                            │ │
│  │  Has:                                                      │ │
│  │  • Stable user ID (same across sessions)                  │ │
│  │  • Verified email                                         │ │
│  │  • Real name (from OAuth)                                 │ │
│  │  • Profile picture                                        │ │
│  │                                                            │ │
│  │  Can:                                                      │ │
│  │  • Be granted persistent access to files                  │ │
│  │  • Own files                                              │ │
│  │  • Have edits attributed to them                          │ │
│  │  • Use cloud storage                                      │ │
│  │  • Receive email notifications                            │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  GUEST USER (Accessed via share link without signing in)        │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  Identity Source: Generated session ID                   │ │
│  │                                                            │ │
│  │  Has:                                                      │ │
│  │  • Temporary session ID (lost on tab close)              │ │
│  │  • Self-chosen display name ("Guest" or custom)          │ │
│  │  • No verified email                                      │ │
│  │  • No profile picture                                     │ │
│  │                                                            │ │
│  │  Can:                                                      │ │
│  │  • View (if link allows)                                  │ │
│  │  • Edit (if link allows editing)                          │ │
│  │  • See other collaborators                                │ │
│  │                                                            │ │
│  │  Cannot:                                                   │ │
│  │  • Own files                                              │ │
│  │  • Have persistent identity                               │ │
│  │  • Use cloud storage                                      │ │
│  │  • Receive notifications                                  │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  NOTE: Story may require OAuth for all access (no true guests) │
│  to maintain accountability and identity consistency.          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 Guest Identity

```typescript
/**
 * Generate guest identity (if guest access is allowed)
 */
function createGuestIdentity(displayName?: string): CollaborationIdentity {
    const guestName = displayName || 'Guest';
    const guestId = `guest_${generateRandomId()}`;
    
    return {
        id: guestId,
        displayName: guestName,
        initials: getInitials(guestName),
        avatarUrl: undefined,
        color: generateColorFromId(guestId),
        sessionId: generateSessionId()
    };
}

/**
 * Check if identity is from authenticated user
 */
function isAuthenticated(identity: CollaborationIdentity): boolean {
    return !identity.id.startsWith('guest_') && 
           !identity.id.startsWith('anon_');
}

/**
 * Get identity trust level
 */
function getIdentityTrust(identity: CollaborationIdentity): IdentityTrust {
    if (identity.id.startsWith('guest_')) {
        return 'guest'; // Self-asserted, temporary
    }
    if (identity.id.startsWith('anon_')) {
        return 'anonymous'; // Authenticated but hidden
    }
    return 'verified'; // OAuth-backed identity
}

type IdentityTrust = 'verified' | 'anonymous' | 'guest';
```

---

## Related Specifications

- [Identity Architecture](./identity-architecture.md) - Overall identity model
- [User Profile Model](./user-profile-model.md) - Profile structure
- [Trust Relationships](./trust-relationships.md) - Trust model
- [Real-Time Collaboration](../realtime-collaboration.md) - Collaboration system
- [Collaboration Protocol](../collaboration-protocol.md) - Message protocol

---

*Identity in collaboration enables accountability while respecting user privacy preferences.*
