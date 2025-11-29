
# Master Implementation Plan V2: Complete Identity, Storage & Collaboration

## Overview

This V2 plan takes the foundation from V1 (code complete) to **100% production-ready implementation**. It addresses the gaps identified in V1, adds missing features from the specifications, and ensures end-to-end integration.

**V1 Status (Baseline):**
- ✅ OAuth flow infrastructure (code complete, needs configuration)
- ✅ Token storage with multi-tab sync
- ✅ .str file format with JSZip
- ✅ Cloud storage providers (OneDrive, Google Drive)
- ✅ SignalR connection with auto-reconnect
- ✅ Presence and cursor managers
- ✅ Operational Transform with vector clocks

**V2 Goals:**
- ✅ User preferences file (encrypted, identity-locked) - **COMPLETE**
- ✅ Cross-device sync for preferences - **COMPLETE**
- ✅ Identity linking (multiple OAuth accounts) - **COMPLETE**
- 🔄 File sharing and permissions UI - **IN PROGRESS (Phase 2.2)**
- 🎯 Azure Functions deployment (negotiate, broadcast, join)
- 🎯 End-to-end integration testing
- 🎯 Version history and restore
- 🎯 Production-ready error handling

---

## Principles Compliance

This plan adheres to the [Story Principles](../principles.md). Each phase includes:

### ✅ App Integrity
- **Small incremental changes** - Each week focuses on one cohesive feature area
- **Mandatory validation with tests** - Every new component requires vitest tests before merge
- **Risk callouts** - Each phase includes explicit risks, dependencies, and mitigations

### ✅ Design & Craft
- **Global Design System** - All UI components use existing patterns (Modal, HUD, Toolbar)
- **Global CSS Variables** - No inline styles; use `--color-*`, `--spacing-*`, `--radius-*` tokens
- **Dark/Light Mode** - All UI must be tested in both themes before merge
- **Component Reuse** - Use variants of existing components (e.g., `Modal` not new modal patterns)

### ✅ Security & Privacy
- **Security-first architecture** - Identity encryption uses Web Crypto API with HKDF
- **No plaintext secrets** - OAuth tokens in secure storage, preferences encrypted at rest
- **Privacy by design** - User data stays in user's cloud storage, no server-side user database

### ✅ Performance
- **Performance benchmarks** defined in [Success Metrics](#success-metrics)
- **No regression below baseline** - Cursor latency < 200ms, save < 10s, version restore < 5s

### ✅ Undo/Redo Compatibility
- **Version history integrates with undo** - Restore creates undoable checkpoint
- **Preferences changes** - Not undoable (separate from document state)
- **Sharing changes** - Not undoable (server-side state)

### ✅ File Storage & Serialization Compatibility
- **Preferences file** - Uses existing .str ZIP format
- **Version history** - Uses existing serialization for restore
- **No changes to PresentationSerializer** - All new features are additive

### ✅ Realtime Collaboration Compatibility
- **Sharing integrates with presence** - Collaborators appear in presence panel
- **Version restore broadcasts** - Other users see "File restored to previous version" notification
- **Preferences are local** - No conflict with collaborative state

---

## Gap Analysis: V1 → V2

### Identity System Gaps

| Feature | V1 Status | V2 Target | Priority | V2 Status |
|---------|-----------|-----------|----------|-----------|
| OAuth flow | ✅ Code complete | Configure client IDs | HIGH | 🔄 Week 1 |
| Token storage | ✅ Complete | - | - | ✅ |
| User profile | ✅ Complete | - | - | ✅ |
| **User preferences file** | ❌ Not started | Identity-locked .str | HIGH | ✅ **DONE** |
| **Identity linking** | ⏸️ Prep only | Multiple OAuth accounts | MEDIUM | ✅ **DONE** |
| **Cross-device sync** | ❌ Not started | Preferences sync | MEDIUM | ✅ **DONE** |
| Guest mode | ✅ Code exists | Test and polish | LOW | 🔄 |

### Storage System Gaps

| Feature | V1 Status | V2 Target | Priority | V2 Status |
|---------|-----------|-----------|----------|-----------|
| .str format | ✅ Complete | - | - | ✅ |
| Cloud providers | ✅ Complete | - | - | ✅ |
| Auto-save | ✅ Complete | - | - | ✅ |
| **Sharing permissions** | ❌ Not started | Share dialogs, invite flow | HIGH | 🔄 Phase 2.2 |
| **Conflict resolution UI** | ⏸️ Code only | User-facing dialogs | MEDIUM | 🔄 |
| **Version history** | ❌ Not started | View and restore versions | MEDIUM | 🔄 Phase 2.5 |
| **Recent files list** | ❌ Not started | With cloud metadata | LOW | 🔄 |

### Collaboration System Gaps

| Feature | V1 Status | V2 Target | Priority | V2 Status |
|---------|-----------|-----------|----------|-----------|
| SignalR client | ✅ Complete | - | - | ✅ |
| Presence manager | ✅ Complete | - | - | ✅ |
| Cursor manager | ✅ Complete | - | - | ✅ |
| State sync (OT) | ✅ Complete | - | - | ✅ |
| **Azure Functions** | ❌ Not deployed | negotiate, broadcast, join | HIGH | 🔄 Phase 2.3 |
| **End-to-end test** | ❌ Not started | Multi-user editing test | HIGH | 🔄 Phase 2.4 |
| **Offline queue flush** | ⏸️ Partial | Full offline→online sync | MEDIUM | 🔄 |
| **Collaborator avatars** | ❌ Not started | Show in presence panel | LOW | 🔄 |

---

## Phase Breakdown

### Phase 2.1: Identity Configuration & Preferences (Weeks 1-3)

**Goal:** Complete identity system with user preferences file

#### Week 1: OAuth Configuration & Testing

| Day | Task | Status |
|-----|------|--------|
| Mon | Configure Microsoft Azure AD app (client ID, redirect URIs) | 🔄 |
| Tue | Configure Google OAuth app (client ID, origins) | 🔄 |
| Wed | Test OAuth flow end-to-end in browser | 🔄 |
| Thu | Fix any callback/popup issues | 🔄 |
| Fri | Update OAuthConfig.js with production values | 🔄 |

**Files to Update:**
- `src/core/auth/config/OAuthConfig.js` - Add real client IDs
- `src/core/auth/providers/MicrosoftProvider.js` - Verify endpoints
- `src/core/auth/providers/GoogleProvider.js` - Verify endpoints

**Validation Requirements:**
- ✅ All existing auth tests pass (`npm test -- --grep auth`)
- ✅ Manual test: Sign in with Microsoft in both dark/light mode
- ✅ Manual test: Sign in with Google in both dark/light mode

**Risks & Mitigations:**
| Risk | Impact | Mitigation |
|------|--------|------------|
| OAuth popup blocked | HIGH | Test in multiple browsers, provide fallback redirect flow |
| Wrong redirect URI | HIGH | Document exact URIs in Azure/Google console |
| Token refresh fails | MEDIUM | Keep existing guest mode as fallback |

#### Week 2: User Preferences File

| Day | Task | Status |
|-----|------|--------|
| Mon | Create `PreferencesFile.js` - encrypted .str format | ✅ |
| Tue | Implement identity-locked encryption (HKDF from OAuth sub) | ✅ |
| Wed | Create `PreferencesManager.js` - load/save/sync | ✅ |
| Thu | Add preferences discovery (default cloud locations) | ✅ |
| Fri | Write tests for preferences encryption/decryption | ✅ |

**New Files:**
```
src/core/auth/preferences/
├── PreferencesFile.js           # ✅ Encrypted preferences .str
├── PreferencesManager.js        # ✅ Load/save/sync
├── PreferencesDiscovery.js      # ✅ Find preferences file
├── IdentityEncryption.js        # ✅ HKDF-based encryption
├── PreferencesSchema.js         # ✅ Schema, defaults, validation
├── index.js                     # ✅ Module exports
└── PreferencesMigration.js      # 🔄 localStorage → file migration

tests/unit/core/auth/
├── PreferencesSchema.test.js    # ✅ 20 tests
├── PreferencesManager.test.js   # ✅ 17 tests
└── IdentityEncryption.test.js   # ✅ 15 tests
```

**Preference Schema (from spec):**
```javascript
// src/core/auth/preferences/PreferencesSchema.js
export const DEFAULT_PREFERENCES = {
    theme: 'system',
    language: navigator.language || 'en-US',
    gridSettings: { showGrid: true, snapToGrid: true, gridSize: 10 },
    defaultFont: { family: 'Inter', size: 16 },
    autoSaveInterval: 30000,
    shortcuts: {},
    recentFiles: [],
    recentColors: [],
    recentFonts: [],
    schemaVersion: 1,
    lastModified: new Date().toISOString()
};
```

**Validation Requirements:**
- ✅ New tests: `tests/unit/auth/preferences/*.test.js` (min 90% coverage)
- ✅ Encryption/decryption round-trip tests
- ✅ Migration from localStorage test
- ✅ Manual test: Preferences persist after browser restart

**Risks & Mitigations:**
| Risk | Impact | Mitigation |
|------|--------|------------|
| Encryption key derivation fails | HIGH | localStorage fallback, clear error message |
| Cloud storage unavailable | MEDIUM | Local IndexedDB cache |
| Migration loses settings | MEDIUM | Backup localStorage before migration |

**Compatibility Notes:**
- ⚠️ **Undo/Redo:** Preferences changes are NOT undoable (separate from document state)
- ⚠️ **Serialization:** Uses .str format but separate file from presentations

#### Week 3: Identity Linking & Cross-Device

| Day | Task | Status |
|-----|------|--------|
| Mon | Create `IdentityLinking.js` - link multiple OAuth accounts | ✅ |
| Tue | Update preferences file to support linked identities | ✅ |
| Wed | Implement key wrapping for multi-identity access | ✅ |
| Thu | Create cross-device sync with cloud storage | ✅ |
| Fri | Test preferences sync across devices/browsers | ✅ |

**New Files:**
```
src/core/auth/
├── IdentityLinking.js           # ✅ Link multiple OAuth accounts
└── preferences/
    ├── PreferencesSync.js       # ✅ Cross-device sync
    └── PreferencesMigration.js  # ✅ localStorage → file migration

tests/unit/core/auth/
├── IdentityLinking.test.js      # ✅ 17 tests
└── PreferencesMigration.test.js # ✅ 28 tests
```

**Validation Requirements:**
- ✅ Tests for identity linking flow
- ✅ Tests for cross-device sync conflict resolution
- ✅ Manual test: Link Microsoft + Google accounts

**Risks & Mitigations:**
| Risk | Impact | Mitigation |
|------|--------|------------|
| User loses access after relinking | HIGH | Keep all linked identities, require re-auth to unlink |
| Sync conflict between devices | MEDIUM | Last-write-wins with user notification |
| User confusion about linked accounts | LOW | Clear UI showing all linked accounts |

---

### Phase 2.2: Sharing & Permissions (Weeks 4-5)

**Goal:** Complete file sharing with cloud provider APIs

#### Week 4: Sharing Infrastructure

| Day | Task | Status |
|-----|------|--------|
| Mon | Create `SharingManager.js` - unified sharing API | ✅ **DONE** |
| Tue | Implement OneDrive sharing (invite, links) | ✅ **DONE** |
| Wed | Implement Google Drive sharing (permissions) | ✅ **DONE** |
| Thu | Create permission normalization layer | ✅ **DONE** |
| Fri | Write tests for sharing operations | ✅ **DONE** |

**New Files:**
```
src/core/storage/sharing/
├── SharingManager.js            # Unified sharing API ✅
├── PermissionNormalizer.js      # Normalize across providers ✅
├── ShareLinkGenerator.js        # Create shareable links ✅
└── SharingConstants.js          # Events, roles, types ✅

tests/unit/storage/sharing/
├── SharingManager.test.js       # 36 tests ✅
├── PermissionNormalizer.test.js # 37 tests ✅
└── ShareLinkGenerator.test.js   # 35 tests ✅
```

**Validation Requirements:**
- ✅ Tests for OneDrive sharing API integration
- ✅ Tests for Google Drive sharing API integration
- ✅ Tests for permission normalization across providers

**Risks & Mitigations:**
| Risk | Impact | Mitigation |
|------|--------|------------|
| Provider API rate limits | MEDIUM | Exponential backoff, cache collaborator list |
| Permission model mismatch | MEDIUM | Normalize to lowest common denominator |
| OAuth scope insufficient | HIGH | Verify required scopes in OAuth config |

**Compatibility Notes:**
- ⚠️ **Realtime Collaboration:** Sharing integrates with presence - new collaborators appear in presence panel
- ⚠️ **Undo/Redo:** Sharing changes are NOT undoable (server-side state)

**Sharing API (from spec):**
```javascript
// SharingManager interface
class SharingManager {
    async shareWithPeople(fileId, emails, role, message);
    async createShareLink(fileId, options);
    async getCollaborators(fileId);
    async updateAccess(fileId, email, newRole);
    async removeAccess(fileId, email);
}
```

#### Week 5: Sharing UI

| Day | Task | Status |
|-----|------|--------|
| Mon | Create `ShareModal.js` - share dialog UI | 🔄 |
| Tue | Add collaborator list with role management | 🔄 |
| Wed | Implement share link creation UI | 🔄 |
| Thu | Add share button to toolbar | 🔄 |
| Fri | Integration testing with real cloud accounts | 🔄 |

**New Files:**
```
src/ui/sharing/
├── ShareModal.js                # Main share dialog
├── CollaboratorList.js          # List of people with access
├── ShareLinkPanel.js            # Link sharing controls
├── InviteInput.js               # Email input with autocomplete
└── PermissionDropdown.js        # Role selection

styles/modules/
└── sharing.css                  # Sharing UI styles
```

**Design System Compliance:**
- Use existing modal patterns from SettingsModal
- Use design tokens for colors, spacing
- Follow HUD interaction patterns

**Design System Checklist (MANDATORY):**
- [ ] All colors use CSS variables (`--color-*`)
- [ ] All spacing uses CSS variables (`--spacing-*`)
- [ ] All radii use CSS variables (`--radius-*`)
- [ ] Dark mode tested and working
- [ ] Light mode tested and working
- [ ] No inline styles
- [ ] Reuses existing Modal component (variant, not new component)
- [ ] Reuses existing Button component
- [ ] Reuses existing Input component

**Validation Requirements:**
- ✅ Visual regression tests for ShareModal
- ✅ Manual test: Share flow in dark mode
- ✅ Manual test: Share flow in light mode
- ✅ All existing UI tests pass

**Risks & Mitigations:**
| Risk | Impact | Mitigation |
|------|--------|------------|
| UI inconsistent with design system | MEDIUM | Design review before merge |
| Dark mode not working | HIGH | Test dark mode for every component |
| Accessibility issues | MEDIUM | Keyboard navigation, focus states |

---

### Phase 2.3: Azure Functions & SignalR Deployment (Weeks 6-7)

**Goal:** Deploy serverless backend for real-time collaboration

#### Week 6: Azure Functions Development

| Day | Task | Status |
|-----|------|--------|
| Mon | Create Azure Functions project structure | 🔄 |
| Tue | Implement `negotiate` function (SignalR connection) | 🔄 |
| Wed | Implement `broadcast` function (message relay) | 🔄 |
| Thu | Implement `join-group` / `leave-group` functions | 🔄 |
| Fri | Local testing with Azure Functions Core Tools | 🔄 |

**New Files (Azure Functions project):**
```
azure-functions/
├── host.json
├── local.settings.json
├── package.json
├── functions/
│   ├── negotiate.js             # SignalR connection negotiation
│   ├── broadcast.js             # Message broadcast to groups
│   ├── join-group.js            # Add user to document group
│   └── leave-group.js           # Remove user from group
└── shared/
    ├── signalr-utils.js         # SignalR output bindings
    └── auth-utils.js            # Token validation
```

**Function Implementations (from spec):**

```javascript
// negotiate.js
module.exports = async function (context, req) {
    const userId = req.headers['x-ms-signalr-userid'];
    if (!userId) {
        context.res = { status: 400, body: 'User ID required' };
        return;
    }
    
    // Generate SignalR connection token
    const connectionInfo = await generateClientToken(userId);
    context.res = { status: 200, body: connectionInfo };
};

// broadcast.js
module.exports = async function (context, req) {
    const { groupName, target, data } = req.body;
    
    context.bindings.signalRMessages = [{
        target,
        groupName,
        arguments: [data]
    }];
    
    context.res = { status: 200 };
};
```

**Validation Requirements:**
- ✅ Local function tests with Azure Functions Core Tools
- ✅ Unit tests for each function
- ✅ Manual test: negotiate → connect → broadcast round-trip

**Security Requirements:**
- [ ] Validate OAuth token in negotiate function
- [ ] Rate limiting on broadcast function
- [ ] Group name validation (prevent unauthorized access)
- [ ] No sensitive data in function logs

#### Week 7: Azure Deployment & Integration

| Day | Task | Status |
|-----|------|--------|
| Mon | Create Azure SignalR Service (serverless mode) | 🔄 |
| Tue | Create Azure Functions App | 🔄 |
| Wed | Deploy functions and configure connection strings | 🔄 |
| Thu | Update client `SignalRConnection.js` with Azure URLs | 🔄 |
| Fri | End-to-end testing with 2+ browsers | 🔄 |

**Files to Update:**
- `src/core/collaboration/connection/SignalRConnection.js` - Azure endpoint URLs
- `src/core/collaboration/CollaborationService.js` - Enable real SignalR

**Azure Resources Required:**
| Resource | SKU | Estimated Cost |
|----------|-----|----------------|
| Azure SignalR Service | Free (20 connections) → Standard | $0 → $50/mo |
| Azure Functions App | Consumption | ~$10/mo |
| Azure Storage Account | LRS | ~$5/mo |

**Validation Requirements:**
- ✅ Connection test with 2+ browsers
- ✅ Cursor sync test (< 200ms latency)
- ✅ Presence test (join/leave visible)
- ✅ All collaboration tests pass

**Risks & Mitigations:**
| Risk | Impact | Mitigation |
|------|--------|------------|
| Azure deployment fails | HIGH | Local testing first, staged rollout |
| SignalR costs exceed budget | MEDIUM | Monitor usage, rate limiting |
| Connection string exposed | HIGH | Azure Key Vault for secrets |
| CORS issues | MEDIUM | Configure allowed origins |

**Compatibility Notes:**
- ⚠️ **Realtime Collaboration:** This is the core infrastructure - all collaboration features depend on this
- ⚠️ **Fallback:** If SignalR unavailable, app works in offline-only mode

---

### Phase 2.4: End-to-End Integration (Weeks 8-9)

**Goal:** Validate complete system with real multi-user scenarios

#### Week 8: Integration Testing

| Day | Task | Status |
|-----|------|--------|
| Mon | Create E2E test framework (Playwright) | 🔄 |
| Tue | Test: OAuth login → cloud save → share | 🔄 |
| Wed | Test: Multi-user editing with cursors | 🔄 |
| Thu | Test: Offline → online sync | 🔄 |
| Fri | Test: Conflict resolution scenarios | 🔄 |

**New Files:**
```
tests/e2e/
├── playwright.config.js
├── auth.e2e.test.js             # OAuth flow tests
├── storage.e2e.test.js          # Save/load tests
├── collaboration.e2e.test.js    # Multi-user tests
└── fixtures/
    └── test-presentation.str    # Test file
```

**Test Scenarios:**
1. **Auth Flow:** Sign in with Microsoft → verify profile → sign out
2. **Cloud Save:** Create presentation → save to OneDrive → reload
3. **Share:** Share with email → verify collaborator access
4. **Real-time:** Two browsers edit same file → verify sync
5. **Offline:** Disconnect → edit → reconnect → verify merge

**Validation Requirements:**
- ✅ All E2E tests pass in CI
- ✅ Tests run in both Chromium and Firefox
- ✅ Tests cover dark and light mode

**Performance Benchmarks (MANDATORY):**
| Metric | Target | Fail Threshold |
|--------|--------|----------------|
| OAuth sign-in | < 3s | > 5s = fail |
| Cloud save | < 10s | > 30s = fail |
| Cursor latency | < 200ms | > 500ms = fail |
| Version restore | < 5s | > 15s = fail |

#### Week 9: Bug Fixes & Polish

| Day | Task | Status |
|-----|------|--------|
| Mon | Fix issues from integration testing | 🔄 |
| Tue | Add loading states and error messages | 🔄 |
| Wed | Improve connection status indicators | 🔄 |
| Thu | Performance optimization (throttling, debouncing) | 🔄 |
| Fri | Documentation and code cleanup | 🔄 |

---

### Phase 2.5: Version History & Recovery (Week 10)

**Goal:** Implement version history with restore capability

#### Week 10: Version History

| Day | Task | Status |
|-----|------|--------|
| Mon | Create `VersionManager.js` - list versions from cloud | 🔄 |
| Tue | Implement version preview (read-only load) | 🔄 |
| Wed | Implement version restore (with confirmation) | 🔄 |
| Thu | Create version history panel UI | 🔄 |
| Fri | Testing and edge cases | 🔄 |

**New Files:**
```
src/core/storage/versioning/
├── VersionManager.js            # List, preview, restore versions
└── VersionDiff.js               # Compare versions (optional)

src/ui/versioning/
├── VersionHistoryPanel.js       # Version list UI
└── VersionPreview.js            # Read-only preview

tests/unit/storage/versioning/
└── VersionManager.test.js
```

**Version API (per provider):**
```javascript
// OneDrive: GET /me/drive/items/{id}/versions
// Google Drive: GET /files/{id}/revisions

class VersionManager {
    async listVersions(fileId);     // Get all versions
    async getVersion(fileId, versionId);  // Download specific version
    async restoreVersion(fileId, versionId);  // Restore version
}
```

**Validation Requirements:**
- ✅ Tests for listing versions from both providers
- ✅ Tests for version restore
- ✅ Manual test: View version history panel
- ✅ Manual test: Restore to previous version

**Compatibility Notes:**
- ⚠️ **Undo/Redo:** Version restore creates an undoable checkpoint (user can undo the restore)
- ⚠️ **Realtime Collaboration:** Version restore broadcasts "File restored" notification to collaborators
- ⚠️ **Serialization:** Uses existing PresentationDeserializer for loading old versions

**Risks & Mitigations:**
| Risk | Impact | Mitigation |
|------|--------|------------|
| Version format incompatible | MEDIUM | Schema version check, migration if needed |
| Restore overwrites current work | HIGH | Confirmation dialog, auto-backup before restore |
| Too many versions to display | LOW | Pagination, show most recent first |

**Design System Checklist (Version History Panel):**
- [ ] All colors use CSS variables
- [ ] Dark mode tested and working
- [ ] Light mode tested and working
- [ ] Uses existing Panel/List components
- [ ] Keyboard navigable

---

## Implementation Details

### User Preferences File Implementation

The preferences file is a critical V2 component that stores user settings encrypted with their OAuth identity.

**File Structure (from spec):**
```
story-preferences.str (ZIP)
├── manifest.json           # Format type, owner info
├── identity.json           # Owner identity + linked accounts
├── access/
│   └── allowed.json        # Authorized identities
└── preferences/
    └── data.json.enc       # Encrypted preferences
```

**Key Derivation (from spec):**
```javascript
// IdentityEncryption.js
class IdentityEncryption {
    async deriveKey(idTokenClaims, salt) {
        // Create stable identity material from OAuth claims
        const material = JSON.stringify({
            sub: idTokenClaims.sub,  // Stable user ID
            iss: idTokenClaims.iss   // Provider
        });
        
        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            new TextEncoder().encode(material),
            'HKDF',
            false,
            ['deriveKey']
        );
        
        return crypto.subtle.deriveKey(
            {
                name: 'HKDF',
                salt,
                info: new TextEncoder().encode('story-preferences-v1'),
                hash: 'SHA-256'
            },
            keyMaterial,
            { name: 'AES-GCM', length: 256 },
            false,
            ['encrypt', 'decrypt']
        );
    }
}
```

### Azure SignalR Integration

**Client-side changes needed:**

```javascript
// SignalRConnection.js - Update negotiateUrl
constructor() {
    this.config = {
        negotiateUrl: process.env.NODE_ENV === 'production'
            ? 'https://story-functions.azurewebsites.net/api/negotiate'
            : 'http://localhost:7071/api/negotiate',
        hubName: 'storyHub'
    };
}

// Add user ID header from OAuth
async connect() {
    const userId = authService.getCurrentUser()?.id;
    
    const response = await fetch(this.config.negotiateUrl, {
        method: 'POST',
        headers: {
            'x-ms-signalr-userid': userId,
            'Authorization': `Bearer ${await authService.getAccessToken()}`
        }
    });
    
    const { url, accessToken } = await response.json();
    // ... create SignalR connection
}
```

### Sharing UI Integration

**ShareModal.js structure:**

```javascript
// src/ui/sharing/ShareModal.js
export class ShareModal {
    constructor(options) {
        this.fileId = options.fileId;
        this.sharingManager = options.sharingManager;
        this.modal = null;
    }
    
    async show() {
        // Load current collaborators
        const collaborators = await this.sharingManager.getCollaborators(this.fileId);
        
        // Render modal with:
        // 1. Email input for inviting
        // 2. Current collaborator list
        // 3. Share link section
        // 4. Permission dropdowns
    }
    
    async inviteCollaborator(email, role) {
        await this.sharingManager.shareWithPeople(
            this.fileId,
            [email],
            role,
            'You have been invited to collaborate on this presentation.'
        );
        this.refreshCollaboratorList();
    }
    
    async createShareLink(options) {
        const link = await this.sharingManager.createShareLink(this.fileId, options);
        this.showLinkCopied(link.url);
    }
}
```

---

## Testing Strategy

### Unit Tests (Existing + New)

| Component | Test File | Coverage Target |
|-----------|-----------|-----------------|
| PreferencesFile | `PreferencesFile.test.js` | 90% |
| IdentityEncryption | `IdentityEncryption.test.js` | 95% |
| SharingManager | `SharingManager.test.js` | 85% |
| VersionManager | `VersionManager.test.js` | 85% |

### Integration Tests

| Scenario | Test File | Description |
|----------|-----------|-------------|
| OAuth → Cloud Save | `auth-storage.test.js` | Full sign-in → save flow |
| Multi-user Edit | `collaboration.e2e.test.js` | Two browsers editing |
| Offline Sync | `offline-sync.test.js` | Disconnect → edit → reconnect |

### Manual Testing Checklist

- [ ] Sign in with Microsoft
- [ ] Sign in with Google
- [ ] Continue as guest
- [ ] Save to OneDrive
- [ ] Save to Google Drive
- [ ] Share with email
- [ ] Create share link
- [ ] Join shared file as collaborator
- [ ] See collaborator cursors
- [ ] Edit while offline
- [ ] Reconnect and see sync
- [ ] View version history
- [ ] Restore previous version

---

## Risk Mitigation

### Dependencies Between Phases

```
Phase 2.1 (Identity) ──────────────────────────────────────────────────────┐
    │                                                                       │
    ├── OAuth config required for:                                         │
    │   • Cloud storage authentication                                     │
    │   • Preferences file encryption (needs OAuth sub claim)              │
    │   • SignalR user ID                                                  │
    │                                                                       │
    ▼                                                                       │
Phase 2.2 (Sharing) ◄── Depends on OAuth tokens for provider APIs          │
    │                                                                       │
    ▼                                                                       │
Phase 2.3 (Azure) ◄── Depends on OAuth for SignalR user authentication     │
    │                                                                       │
    ▼                                                                       │
Phase 2.4 (E2E) ◄── Depends on all previous phases                         │
    │                                                                       │
    ▼                                                                       │
Phase 2.5 (Versions) ◄── Depends on cloud storage (Phase 2.2)              │
────────────────────────────────────────────────────────────────────────────┘
```

**Critical Path:** Phase 2.1 → 2.2 → 2.3 are sequential. Phase 2.5 can start after 2.2.

### High-Risk Areas

| Area | Risk | Mitigation |
|------|------|------------|
| OAuth configuration | Wrong client IDs | Test with real accounts before merge |
| Preferences encryption | Data loss if keys fail | Local backup, clear error messages |
| Azure Functions | Deployment failures | Local testing, staged rollout |
| SignalR costs | Exceeding free tier | Monitoring, rate limiting |
| Multi-user conflicts | Data corruption | Comprehensive OT testing |

### Rollback Plan

1. **Feature flags** remain in place for all V2 features
2. **Preferences file** has localStorage fallback
3. **SignalR** falls back to offline-only mode
4. **Sharing** can be disabled without affecting core editing

---

## Success Metrics

### Technical Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| OAuth success rate | > 99% | Analytics tracking |
| Cloud save reliability | > 99.5% | Error logging |
| SignalR connection stability | > 95% uptime | Connection monitoring |
| OT conflict resolution | 100% (no data loss) | Checksum validation |
| Preferences sync latency | < 5s | Performance monitoring |

### User Experience Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Time to first save | < 10s | User timing |
| Share invite delivery | < 30s | Email tracking |
| Cursor update latency | < 200ms | Performance testing |
| Version restore time | < 5s | Performance testing |

---

## Timeline Summary

```
Phase 2.1: Identity & Preferences    (Weeks 1-3)   ─────────┐
Phase 2.2: Sharing & Permissions     (Weeks 4-5)   ─────────┤
Phase 2.3: Azure Functions           (Weeks 6-7)   ─────────┤ 10 weeks
Phase 2.4: E2E Integration           (Weeks 8-9)   ─────────┤
Phase 2.5: Version History           (Week 10)     ─────────┘
```

### Milestones

| Date | Milestone | Deliverable |
|------|-----------|-------------|
| End Week 3 | **Identity Complete** | OAuth configured, preferences file working |
| End Week 5 | **Sharing Complete** | Share dialog, invite flow working |
| End Week 7 | **Collaboration Live** | Azure SignalR deployed, real-time working |
| End Week 9 | **Integration Verified** | E2E tests passing |
| End Week 10 | **V2 Complete** | Version history, production ready |

---

## Post-V2 Roadmap

After V2 completion, the following features can be considered:

1. **Voice/Video Chat** - WebRTC integration for live communication
2. **Comments & Annotations** - Threaded comments on slides/elements
3. **Export Options** - PDF, PPTX export
4. **AI Design Suggestions** - Layout, color, typography recommendations
5. **Presentation Analytics** - View counts, engagement metrics
6. **Mobile Apps** - Native iOS/Android editors

---

## Related Documentation

- [Master Implementation Plan V1](./master-implementation-plan.md) - Original plan
- [Identity Architecture Spec](../specs/identity/identity-architecture.md) - Identity design
- [User Preferences File Spec](../specs/identity/user-preferences-file.md) - Preferences format
- [Cloud Storage Abstraction Spec](../specs/storage/cloud-storage-abstraction.md) - Storage API
- [Azure SignalR Integration Spec](../specs/collaboration/azure-signalr-integration.md) - Real-time

---

*V2 transforms Story from code-complete to production-ready, enabling real multi-user collaboration with cloud storage and identity management.*
