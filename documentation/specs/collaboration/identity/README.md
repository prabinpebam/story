# Identity Management Specifications

## Overview

This folder contains specifications for Story's **decentralized identity management** system. In Story's architecture, identity is fundamentally decentralized - each user manages their own identity through existing OAuth providers (Microsoft/Google), with no central user database.

## Design Philosophy

```
┌─────────────────────────────────────────────────────────────────┐
│                 DECENTRALIZED IDENTITY MODEL                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Traditional Approach:                                          │
│  ┌────────┐   ┌────────────┐   ┌────────────────┐             │
│  │ User   │──►│ Our Server │──►│ User Database  │             │
│  └────────┘   └────────────┘   └────────────────┘             │
│                                                                 │
│  Story's Decentralized Approach:                               │
│  ┌────────┐   ┌────────────────┐                               │
│  │ User   │──►│ OAuth Provider │  ◄── Identity source          │
│  └────────┘   │ (MS/Google)    │                               │
│       │       └────────────────┘                               │
│       │                                                         │
│       └──►  Browser + Cloud Storage  ◄── User's data           │
│                                                                 │
│  No central database • No user records • No server state       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Core Principles

| Principle | Description |
|-----------|-------------|
| **User-Owned Identity** | Identity comes from user's OAuth provider, not our database |
| **Zero User Database** | We don't store user records - OAuth tokens ARE the identity |
| **Decentralized Data** | User's files live in THEIR cloud storage (OneDrive/Google Drive) |
| **Client-Side Authority** | Identity verification happens in the browser, not a server |
| **Minimal Server Role** | Only server component is real-time relay (Azure SignalR) |
| **Privacy by Design** | We can't access what we don't store |

## Specification Files

### Core Identity

| File | Description |
|------|-------------|
| [identity-architecture.md](./identity-architecture.md) | Overall architecture and data flow |
| [oauth-identity-flow.md](./oauth-identity-flow.md) | OAuth integration and token handling |
| [user-profile-model.md](./user-profile-model.md) | User data structure and storage |

### Identity Lifecycle

| File | Description |
|------|-------------|
| [session-lifecycle.md](./session-lifecycle.md) | Sign-in, session, sign-out flows |
| [cross-device-identity.md](./cross-device-identity.md) | Multi-device and sync considerations |
| [user-preferences-file.md](./user-preferences-file.md) | Core encrypted preferences storage spec |
| Account linking | Not yet specified; tracked as an identity-system gap |

### User Preferences System

| File | Description |
|------|-------------|
| **UX & Flows** | |
| [preferences-ux-first-run.md](./preferences-ux-first-run.md) | First-time user onboarding flow |
| [preferences-ux-returning-user.md](./preferences-ux-returning-user.md) | Returning user and new device flows |
| [preferences-ux-import-export.md](./preferences-ux-import-export.md) | Import, export, and migration flows |
| **UI Design** | |
| [preferences-ui-panels.md](./preferences-ui-panels.md) | Main settings panel design |
| [preferences-ui-dialogs.md](./preferences-ui-dialogs.md) | Import, link, and confirmation dialogs |
| [preferences-ui-indicators.md](./preferences-ui-indicators.md) | Sync status and notifications UI |
| **Architecture** | |
| [preferences-tech-autosave.md](./preferences-tech-autosave.md) | Auto-save and debouncing logic |
| [preferences-tech-sync.md](./preferences-tech-sync.md) | Cloud sync and conflict resolution |
| [preferences-tech-cache.md](./preferences-tech-cache.md) | Local IndexedDB caching strategy |
| [preferences-file-linking.md](./preferences-file-linking.md) | Linking presentations to preferences |
| [preferences-notifications.md](./preferences-notifications.md) | System notification catalog |

### Collaboration Identity

| File | Description |
|------|-------------|
| [collaboration-identity.md](./collaboration-identity.md) | Identity in real-time collaboration |
| [trust-relationships.md](./trust-relationships.md) | How users establish trust with each other |
| Identity verification | Not yet specified; tracked as an identity-system gap |

### Privacy & Security

| File | Description |
|------|-------------|
| [privacy-model.md](./privacy-model.md) | Privacy architecture and data handling |
| [identity-security.md](./identity-security.md) | Security considerations and threat model |

## Key Concepts

### What We Store vs. What We Don't

```
┌─────────────────────────────────────────────────────────────────┐
│  WE STORE (in user's browser/cloud):                           │
│  • OAuth tokens (access, refresh, ID)                          │
│  • Cached user profile (from OAuth claims)                     │
│  • User preferences (in encrypted preferences file)            │
│  • Recent files list                                           │
│  • Collaboration contacts (user-managed)                       │
│                                                                 │
│  PREFERENCES FILE (story-preferences.str):                     │
│  • Identity-locked encryption (OAuth = the key)                │
│  • Stored in user's cloud storage (OneDrive/Google Drive)      │
│  • Syncs automatically across devices                          │
│  • Only owner can decrypt                                       │
│                                                                 │
│  WE DON'T STORE (no server database):                          │
│  • User account records                                        │
│  • Email/password credentials                                  │
│  • User files (they're in user's cloud)                       │
│  • Analytics about users                                       │
│  • Social graphs or contact lists                              │
│  • Session state                                                │
└─────────────────────────────────────────────────────────────────┘
```

### Identity Sources

```
                    ┌──────────────────────┐
                    │   IDENTITY SOURCES   │
                    └──────────────────────┘
                              │
         ┌────────────────────┼────────────────────┐
         ▼                    ▼                    ▼
   ┌───────────┐       ┌───────────┐       ┌───────────┐
   │ Microsoft │       │  Google   │       │  Future   │
   │ (Azure AD)│       │ Identity  │       │ Providers │
   └─────┬─────┘       └─────┬─────┘       └───────────┘
         │                   │
         └─────────┬─────────┘
                   ▼
            ┌─────────────┐
            │  ID Token   │
            │  (JWT)      │
            └──────┬──────┘
                   │
                   ▼
            ┌─────────────┐
            │ User Profile│
            │  (in-memory)│
            └─────────────┘
```

## Integration Points

| Component | Identity Relationship |
|-----------|----------------------|
| **Cloud Storage** | OAuth tokens grant access to user's files |
| **Real-time Collaboration** | Identity included in SignalR messages |
| **Sharing** | Owner identity stored in file manifest |
| **Comments** | Commenter identity from OAuth claims |
| **Presence** | User's name/avatar shown to collaborators |

## Related Specifications

- [Authentication](../authentication.md) - OAuth provider implementation
- [Sharing & Permissions](../sharing-permissions.md) - Access control
- [Real-Time Collaboration](../realtime-collaboration.md) - Collaboration architecture
- [Cloud Storage Abstraction](../cloud-storage-abstraction.md) - File storage

---

*Story's identity system is designed to be simple, private, and user-controlled.*
