# Cross-Device Identity

## Overview

This specification defines how **user identity works across multiple devices** in Story's decentralized architecture. Since there's no central user database, cross-device identity relies on OAuth providers and user-owned cloud storage.

**Related Specifications:**
- [Identity Architecture](./identity-architecture.md) - Overall architecture
- [Session Lifecycle](./session-lifecycle.md) - Session management
- [OAuth Identity Flow](./oauth-identity-flow.md) - Token handling

---

## Table of Contents

1. [Cross-Device Model](#1-cross-device-model)
2. [Preference Sync](#2-preference-sync)
3. [Recent Files Across Devices](#3-recent-files-across-devices)
4. [Multi-Device Collaboration](#4-multi-device-collaboration)
5. [Conflict Resolution](#5-conflict-resolution)

---

## 1. Cross-Device Model

### 1.1 How Cross-Device Works

```
┌─────────────────────────────────────────────────────────────────┐
│                   CROSS-DEVICE IDENTITY                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Same User, Different Devices                                   │
│                                                                 │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐       │
│  │   Laptop    │     │   Tablet    │     │   Phone     │       │
│  │             │     │             │     │             │       │
│  │  Browser    │     │  Browser    │     │  Browser    │       │
│  │  Session    │     │  Session    │     │  Session    │       │
│  └──────┬──────┘     └──────┬──────┘     └──────┬──────┘       │
│         │                   │                   │               │
│         └──────────────┬────┴───────────────────┘               │
│                        │                                         │
│                        ▼                                         │
│         ┌──────────────────────────────────────────┐            │
│         │           OAuth Provider                  │            │
│         │          (Same Account)                   │            │
│         │                                           │            │
│         │  • Same user ID (sub claim)              │            │
│         │  • Same email                            │            │
│         │  • Same profile picture                  │            │
│         │  • Independent sessions/tokens           │            │
│         └──────────────────────────────────────────┘            │
│                        │                                         │
│                        ▼                                         │
│         ┌──────────────────────────────────────────┐            │
│         │           Cloud Storage                   │            │
│         │          (Same Account)                   │            │
│         │                                           │            │
│         │  • Same files accessible                 │            │
│         │  • Same sharing permissions              │            │
│         │  • Synced automatically by provider      │            │
│         └──────────────────────────────────────────┘            │
│                                                                  │
│  Each device has:                                               │
│  • Its own OAuth session                                        │
│  • Its own access/refresh tokens                                │
│  • Its own local preferences (not synced by default)           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Identity Consistency

```typescript
/**
 * Identity is consistent across devices because:
 * - Same OAuth provider = same user ID
 * - ID token contains same claims
 */
interface CrossDeviceIdentity {
    // CONSISTENT ACROSS DEVICES (from OAuth)
    userId: string;          // Same sub claim everywhere
    email: string;           // Same email
    displayName: string;     // Same name (unless provider updated)
    avatarUrl: string;       // Same picture URL
    
    // DEVICE-SPECIFIC
    sessionId: string;       // Unique per device/browser
    deviceType?: string;     // 'desktop', 'tablet', 'mobile'
    lastActive: Date;        // Per-device activity
}

/**
 * Generate consistent user ID from OAuth
 */
function getUserId(idToken: IDTokenClaims): string {
    // This will be identical across all devices
    // because 'sub' claim is stable per user per provider
    return `${determineProvider(idToken.iss)}_${idToken.sub}`;
}
```

---

## 2. Preference Sync

### 2.1 Sync Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                   PREFERENCE SYNC OPTIONS                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  OPTION A: NO SYNC (Current Default)                            │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  Each device has independent preferences                  │ │
│  │  Stored in browser localStorage                           │ │
│  │                                                            │ │
│  │  Pros: Simple, private, no cloud dependency              │ │
│  │  Cons: Must set up each device separately                │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  OPTION B: CLOUD FILE SYNC                                      │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  Preferences stored in a file in user's cloud storage    │ │
│  │  e.g., /Story/settings.json in OneDrive/Google Drive     │ │
│  │                                                            │ │
│  │  Flow:                                                     │ │
│  │  1. On sign-in, fetch settings.json                       │ │
│  │  2. Merge with local preferences                          │ │
│  │  3. On preference change, update settings.json           │ │
│  │                                                            │ │
│  │  Pros: Preferences sync automatically                    │ │
│  │  Cons: Requires cloud access, conflict handling          │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  OPTION C: BROWSER SYNC (Native)                                │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  Let browser handle sync (Chrome sync, Firefox sync)     │ │
│  │  localStorage doesn't sync, but could use storage API    │ │
│  │                                                            │ │
│  │  Pros: User's existing sync infrastructure               │ │
│  │  Cons: Not all browsers support, less control            │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Cloud Settings Sync Implementation

```typescript
/**
 * Sync preferences via cloud storage
 */
class CloudPreferenceSync {
    private readonly SETTINGS_FILE = 'Story/settings.json';
    
    constructor(
        private cloudStorage: CloudStorageProvider,
        private localPrefs: LocalPreferencesManager
    ) {}
    
    /**
     * Load and merge preferences on sign-in
     */
    async loadPreferences(): Promise<UserPreferences> {
        // Get local preferences first
        const local = this.localPrefs.getPreferences();
        
        // Try to get cloud preferences
        let cloud: UserPreferences | null = null;
        try {
            cloud = await this.fetchCloudSettings();
        } catch (error) {
            console.log('No cloud settings found, using local');
        }
        
        if (!cloud) {
            return local;
        }
        
        // Merge: cloud wins for synced settings, local for device-specific
        return this.mergePreferences(local, cloud);
    }
    
    /**
     * Save preferences to cloud
     */
    async savePreferences(prefs: UserPreferences): Promise<void> {
        // Save locally first
        this.localPrefs.savePreferences(prefs);
        
        // Then sync to cloud (non-blocking)
        this.syncToCloud(prefs).catch(error => {
            console.warn('Failed to sync preferences to cloud:', error);
        });
    }
    
    /**
     * Merge local and cloud preferences
     */
    private mergePreferences(
        local: UserPreferences,
        cloud: UserPreferences
    ): UserPreferences {
        return {
            // Synced settings (cloud wins)
            theme: cloud.theme,
            language: cloud.language,
            displayNameOverride: cloud.displayNameOverride,
            preferredColor: cloud.preferredColor,
            
            // Device-specific (local wins)
            defaultStorageProvider: local.defaultStorageProvider,
            
            // Merged lists
            recentFiles: this.mergeRecentFiles(local.recentFiles, cloud.recentFiles)
        };
    }
    
    /**
     * Merge recent files from multiple devices
     */
    private mergeRecentFiles(
        local: RecentFile[],
        cloud: RecentFile[]
    ): RecentFile[] {
        const merged = new Map<string, RecentFile>();
        
        // Add all files, keeping most recent
        for (const file of [...cloud, ...local]) {
            const existing = merged.get(file.id);
            if (!existing || new Date(file.lastOpened) > new Date(existing.lastOpened)) {
                merged.set(file.id, file);
            }
        }
        
        // Sort by most recent, limit to 20
        return Array.from(merged.values())
            .sort((a, b) => new Date(b.lastOpened).getTime() - new Date(a.lastOpened).getTime())
            .slice(0, 20);
    }
    
    private async fetchCloudSettings(): Promise<UserPreferences | null> {
        try {
            const content = await this.cloudStorage.readFile(this.SETTINGS_FILE);
            return JSON.parse(content);
        } catch {
            return null;
        }
    }
    
    private async syncToCloud(prefs: UserPreferences): Promise<void> {
        const content = JSON.stringify(prefs, null, 2);
        await this.cloudStorage.writeFile(this.SETTINGS_FILE, content);
    }
}
```

---

## 3. Recent Files Across Devices

### 3.1 Recent Files Sync

```
┌─────────────────────────────────────────────────────────────────┐
│                 RECENT FILES ACROSS DEVICES                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Since files are in cloud storage, they're already accessible  │
│  from any device. The question is tracking "recent" list.      │
│                                                                 │
│  APPROACH 1: Per-Device Recent                                  │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  Each device maintains its own recent list                │ │
│  │                                                            │ │
│  │  Laptop: [FileA, FileB, FileC]                            │ │
│  │  Tablet: [FileB, FileD, FileA]                            │ │
│  │  Phone:  [FileC, FileE]                                   │ │
│  │                                                            │ │
│  │  Pros: Simple, no sync needed                             │ │
│  │  Cons: Have to find files again on new device             │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  APPROACH 2: Synced Recent                                      │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  Store recent list in cloud settings file                │ │
│  │  Merge across devices                                     │ │
│  │                                                            │ │
│  │  Merged: [FileB(latest), FileA, FileC, FileD, FileE]     │ │
│  │                                                            │ │
│  │  Pros: Recent files available everywhere                  │ │
│  │  Cons: Need conflict resolution                          │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  APPROACH 3: Cloud Provider's Recent                            │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  Use OneDrive/Google Drive's own recent list              │ │
│  │  Filter by .story extension                               │ │
│  │                                                            │ │
│  │  Pros: Already synced, no extra work                      │ │
│  │  Cons: Limited control, mixed with other files           │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Cloud-Based Recent Implementation

```typescript
/**
 * Get recent files from cloud provider
 */
class CloudRecentFiles {
    constructor(private cloudStorage: CloudStorageProvider) {}
    
    /**
     * Get recent .story files
     */
    async getRecentFiles(limit: number = 20): Promise<RecentFile[]> {
        // Use cloud provider's recent/modified query
        const files = await this.cloudStorage.listFiles({
            query: "fileExtension = 'story'",
            orderBy: 'modifiedTime desc',
            pageSize: limit
        });
        
        return files.map(file => ({
            id: file.id,
            name: file.name,
            provider: this.cloudStorage.providerId,
            lastOpened: file.modifiedTime,
            thumbnailUrl: file.thumbnailUrl
        }));
    }
}
```

---

## 4. Multi-Device Collaboration

### 4.1 Same User on Multiple Devices

```
┌─────────────────────────────────────────────────────────────────┐
│            SAME USER COLLABORATING FROM MULTIPLE DEVICES        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Alice has the same file open on Laptop AND Tablet             │
│                                                                 │
│  ┌─────────────────┐        ┌─────────────────┐                │
│  │  Alice Laptop   │        │  Alice Tablet   │                │
│  │                 │        │                 │                │
│  │  userId: alice1 │        │  userId: alice1 │ ← SAME ID      │
│  │  sessionId: L1  │        │  sessionId: T1  │ ← DIFFERENT    │
│  └────────┬────────┘        └────────┬────────┘                │
│           │                          │                          │
│           └──────────┬───────────────┘                          │
│                      │                                          │
│                      ▼                                          │
│           ┌──────────────────────┐                             │
│           │  Collaboration Room  │                             │
│           │                      │                             │
│           │  Participants:       │                             │
│           │  • Alice (Laptop)   │                             │
│           │  • Alice (Tablet)   │                             │
│           │  • Bob              │                             │
│           └──────────────────────┘                             │
│                                                                 │
│  OPTIONS FOR HANDLING:                                          │
│                                                                 │
│  1. SHOW SEPARATE CURSORS                                       │
│     • "Alice (Laptop)" and "Alice (Tablet)"                    │
│     • Both cursors visible                                     │
│     • Useful if Alice is genuinely using both                  │
│                                                                 │
│  2. SHOW SINGLE PRESENCE                                        │
│     • Just "Alice" in collaborators list                       │
│     • Show most recent cursor position                         │
│     • Simpler for other collaborators                          │
│                                                                 │
│  3. LET ALICE CHOOSE                                            │
│     • "You're connected from another device"                   │
│     • "Keep both sessions?" / "Close other?"                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Multi-Device Session Management

```typescript
/**
 * Handle same user on multiple devices
 */
class MultiDeviceSessionManager {
    private sessions = new Map<string, DeviceSession[]>(); // userId -> sessions
    
    /**
     * Register a new device session
     */
    registerSession(userId: string, session: DeviceSession): void {
        const existing = this.sessions.get(userId) || [];
        existing.push(session);
        this.sessions.set(userId, existing);
        
        // Notify the new device about other sessions
        if (existing.length > 1) {
            this.notifyMultiDevice(userId, session.sessionId, existing);
        }
    }
    
    /**
     * Notify user about multi-device situation
     */
    private notifyMultiDevice(
        userId: string,
        newSessionId: string,
        allSessions: DeviceSession[]
    ): void {
        const otherDevices = allSessions
            .filter(s => s.sessionId !== newSessionId)
            .map(s => s.deviceType || 'unknown');
        
        // Send notification to new session
        this.sendToSession(newSessionId, {
            type: 'multi_device_detected',
            otherDevices,
            message: `You're also connected from: ${otherDevices.join(', ')}`
        });
    }
    
    /**
     * Get display info for multi-device user
     */
    getPresenceDisplay(userId: string, sessionId: string): PresenceDisplay {
        const sessions = this.sessions.get(userId) || [];
        
        if (sessions.length === 1) {
            return {
                displayName: sessions[0].displayName,
                showDeviceLabel: false
            };
        }
        
        // Multiple devices - add label
        const session = sessions.find(s => s.sessionId === sessionId);
        return {
            displayName: session?.displayName || 'Unknown',
            deviceLabel: session?.deviceType || 'Device',
            showDeviceLabel: true
        };
    }
    
    /**
     * Remove a session
     */
    removeSession(userId: string, sessionId: string): void {
        const sessions = this.sessions.get(userId) || [];
        const remaining = sessions.filter(s => s.sessionId !== sessionId);
        
        if (remaining.length === 0) {
            this.sessions.delete(userId);
        } else {
            this.sessions.set(userId, remaining);
        }
    }
}

interface DeviceSession {
    sessionId: string;
    deviceType?: 'desktop' | 'tablet' | 'mobile';
    displayName: string;
    connectedAt: Date;
}

interface PresenceDisplay {
    displayName: string;
    deviceLabel?: string;
    showDeviceLabel: boolean;
}
```

---

## 5. Conflict Resolution

### 5.1 Edit Conflicts

```
┌─────────────────────────────────────────────────────────────────┐
│                     EDIT CONFLICTS                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Same user editing on two devices simultaneously:               │
│                                                                 │
│  Laptop:  "Hello World" → "Hello Everyone"                     │
│  Tablet:  "Hello World" → "Hello There"                        │
│                                                                 │
│  RESOLUTION: Same as any collaboration conflict                │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  • Operations are timestamped                              │ │
│  │  • CRDT/OT handles concurrent edits                       │ │
│  │  • Both edits are applied in order                        │ │
│  │  • Result may be merge of both                            │ │
│  │                                                            │ │
│  │  Example result: "Hello There" (if tablet was later)      │ │
│  │  Or with OT: "Hello Everyone There" (merged)              │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  Same rules as multi-user collaboration                        │
│  No special handling needed for same-user conflicts            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Preference Conflicts

```typescript
/**
 * Handle preference sync conflicts
 */
class PreferenceConflictResolver {
    /**
     * Resolve conflict between local and cloud preferences
     */
    resolve(
        local: UserPreferences,
        cloud: UserPreferences,
        lastSyncTime: Date
    ): ResolvedPreferences {
        const result: Partial<UserPreferences> = {};
        const conflicts: PreferenceConflict[] = [];
        
        // For each preference field
        for (const key of Object.keys(local) as (keyof UserPreferences)[]) {
            const localValue = local[key];
            const cloudValue = cloud[key];
            
            if (JSON.stringify(localValue) === JSON.stringify(cloudValue)) {
                // No conflict
                result[key] = localValue;
            } else if (this.isDeviceSpecific(key)) {
                // Device-specific: keep local
                result[key] = localValue;
            } else {
                // Conflict: use most recent or merge
                const resolution = this.resolveField(key, localValue, cloudValue);
                result[key] = resolution.value;
                
                if (resolution.wasConflict) {
                    conflicts.push({
                        field: key,
                        localValue,
                        cloudValue,
                        resolvedTo: resolution.value
                    });
                }
            }
        }
        
        return {
            preferences: result as UserPreferences,
            conflicts
        };
    }
    
    private isDeviceSpecific(key: keyof UserPreferences): boolean {
        return ['defaultStorageProvider'].includes(key);
    }
    
    private resolveField(
        key: keyof UserPreferences,
        local: any,
        cloud: any
    ): { value: any; wasConflict: boolean } {
        // For simple values, cloud wins (assume it's more recent)
        // For lists, merge them
        
        if (Array.isArray(local) && Array.isArray(cloud)) {
            return {
                value: this.mergeArrays(local, cloud),
                wasConflict: true
            };
        }
        
        // Cloud wins for simple values
        return {
            value: cloud,
            wasConflict: true
        };
    }
    
    private mergeArrays(a: any[], b: any[]): any[] {
        // Simple merge: union of both
        const set = new Set([...a.map(JSON.stringify), ...b.map(JSON.stringify)]);
        return Array.from(set).map(JSON.parse);
    }
}

interface ResolvedPreferences {
    preferences: UserPreferences;
    conflicts: PreferenceConflict[];
}

interface PreferenceConflict {
    field: keyof UserPreferences;
    localValue: any;
    cloudValue: any;
    resolvedTo: any;
}
```

---

## Related Specifications

- [Identity Architecture](./identity-architecture.md) - Overall architecture
- [Session Lifecycle](./session-lifecycle.md) - Session management
- [User Profile Model](./user-profile-model.md) - Profile structure
- [Collaboration Identity](./collaboration-identity.md) - Identity in collaboration

---

*Cross-device identity works seamlessly because OAuth providers maintain consistent user IDs.*
