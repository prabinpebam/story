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
| [user-preferences-file.md](./user-preferences-file.md) | Encrypted preferences storage |
| [account-linking.md](./account-linking.md) | Linking multiple OAuth providers |

### Collaboration Identity

| File | Description |
|------|-------------|
| [collaboration-identity.md](./collaboration-identity.md) | Identity in real-time collaboration |
| [trust-relationships.md](./trust-relationships.md) | How users establish trust with each other |
| [identity-verification.md](./identity-verification.md) | Verifying identity claims |

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

- [Authentication](../collaboration/authentication.md) - OAuth provider implementation
- [Sharing & Permissions](../collaboration/sharing-permissions.md) - Access control
- [Real-Time Collaboration](../collaboration/realtime-collaboration.md) - Collaboration architecture
- [Cloud Storage Abstraction](../collaboration/cloud-storage-abstraction.md) - File storage

---

*Story's identity system is designed to be simple, private, and user-controlled.*
