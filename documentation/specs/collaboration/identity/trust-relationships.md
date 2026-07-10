# Trust Relationships

## Overview

This specification defines the **trust model** for Story's decentralized identity system. It explains who trusts whom, for what, and how trust is established and maintained.

**Related Specifications:**
- [Identity Architecture](./identity-architecture.md) - Overall architecture
- [Identity Security](./identity-security.md) - Security model
- [Collaboration Identity](./collaboration-identity.md) - Identity in collaboration

---

## Table of Contents

1. [Trust Model Overview](#1-trust-model-overview)
2. [User-to-User Trust](#2-user-to-user-trust)
3. [Trust in Collaboration](#3-trust-in-collaboration)
4. [Trust Verification](#4-trust-verification)
5. [Trust Revocation](#5-trust-revocation)

---

## 1. Trust Model Overview

### 1.1 Trust Hierarchy

```
┌─────────────────────────────────────────────────────────────────┐
│                      TRUST HIERARCHY                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│                    ┌────────────────────┐                       │
│                    │  OAuth Provider    │                       │
│                    │  (MS / Google)     │                       │
│                    │                    │                       │
│                    │  Trusted to:       │                       │
│                    │  • Verify identity │                       │
│                    │  • Issue tokens    │                       │
│                    │  • Maintain security│                      │
│                    └─────────┬──────────┘                       │
│                              │                                  │
│                              ▼                                  │
│              ┌───────────────────────────────────┐              │
│              │        Story Application          │              │
│              │                                   │              │
│              │  Trusts OAuth for:                │              │
│              │  • User identity                  │              │
│              │  • Token validity                 │              │
│              │                                   │              │
│              │  Trusted by users for:            │              │
│              │  • Protecting their tokens        │              │
│              │  • Not misusing access            │              │
│              │  • Honest collaboration           │              │
│              └─────────────────┬─────────────────┘              │
│                                │                                │
│              ┌─────────────────┴─────────────────┐              │
│              ▼                                   ▼              │
│  ┌─────────────────────┐           ┌─────────────────────┐     │
│  │   Cloud Storage     │           │   Azure SignalR     │     │
│  │  (OneDrive/GDrive)  │           │   Service           │     │
│  │                     │           │                     │     │
│  │  Trusted to:        │           │  Trusted to:        │     │
│  │  • Store files      │           │  • Relay messages   │     │
│  │  • Enforce access   │           │  • Not store data   │     │
│  │  • Maintain privacy │           │  • Handle connections│    │
│  └─────────────────────┘           └─────────────────────┘     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Trust Relationships Table

| Truster | Trustee | Trust For | Verification |
|---------|---------|-----------|--------------|
| Story App | OAuth Provider | User identity | Token validation |
| Story App | Cloud Storage | File security | Provider's auth |
| Story App | SignalR | Message routing | TLS + connection |
| User | Story App | Token security | Open source review |
| User | OAuth Provider | Identity service | Provider reputation |
| User | Other Users | Collaboration | Sharing decision |

---

## 2. User-to-User Trust

### 2.1 Sharing as Trust Grant

```
┌─────────────────────────────────────────────────────────────────┐
│               SHARING = GRANTING TRUST                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  When Alice shares a file with Bob, she is trusting Bob:        │
│                                                                 │
│  VIEWER TRUST                                                   │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  Alice trusts Bob to:                                      │ │
│  │  • Not share the content inappropriately                   │ │
│  │  • Not screenshot and distribute                           │ │
│  │  • Respect the content's confidentiality                  │ │
│  │                                                            │ │
│  │  Alice knows Bob can:                                      │ │
│  │  • View all slide content                                  │ │
│  │  • See other collaborators' identities                    │ │
│  │  • Export/download (if not restricted)                    │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  EDITOR TRUST                                                   │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  Alice trusts Bob with all of the above, PLUS:            │ │
│  │  • Making appropriate edits                                │ │
│  │  • Not vandalizing the content                            │ │
│  │  • Not deleting important slides                          │ │
│  │  • Collaborative good faith                               │ │
│  │                                                            │ │
│  │  Alice knows Bob can:                                      │ │
│  │  • Modify any element                                      │ │
│  │  • Add/delete slides                                       │ │
│  │  • Add/remove comments                                     │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  OWNER TRUST (Transferring Ownership)                           │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  Alice trusts Bob with complete control:                  │ │
│  │  • Managing who else has access                           │ │
│  │  • Changing/removing Alice's access                       │ │
│  │  • Deleting the file entirely                             │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Trust Indicators

```typescript
/**
 * Indicators of trustworthiness shown to file owner
 */
interface TrustIndicators {
    /** How the user was invited */
    inviteMethod: 'direct_email' | 'link' | 'password_link';
    
    /** Whether user's email is verified by OAuth */
    emailVerified: boolean;
    
    /** OAuth provider */
    provider: 'microsoft' | 'google';
    
    /** Previous collaboration history with this user */
    previousCollaborations: number;
    
    /** When they first accessed the file */
    firstAccess: Date;
    
    /** How they're currently connected */
    connectionType: 'direct' | 'via_link';
}

/**
 * Display trust level in sharing UI
 */
function getTrustBadge(indicators: TrustIndicators): TrustBadge {
    if (indicators.inviteMethod === 'direct_email' && 
        indicators.emailVerified &&
        indicators.previousCollaborations > 0) {
        return {
            level: 'high',
            label: 'Known collaborator',
            icon: '✓'
        };
    }
    
    if (indicators.emailVerified) {
        return {
            level: 'medium',
            label: 'Verified email',
            icon: '○'
        };
    }
    
    return {
        level: 'low',
        label: 'Via shared link',
        icon: '?'
    };
}
```

---

## 3. Trust in Collaboration

### 3.1 Identity Trust Levels

```
┌─────────────────────────────────────────────────────────────────┐
│                COLLABORATION IDENTITY TRUST                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  FULLY VERIFIED (Highest Trust)                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  Requirement:                                              │ │
│  │  • OAuth authenticated                                     │ │
│  │  • Invited by email (email matches OAuth)                 │ │
│  │  • Email verified by provider                             │ │
│  │                                                            │ │
│  │  Display:                                                  │ │
│  │  [✓] Alice Smith (alice@example.com) - Verified           │ │
│  │                                                            │ │
│  │  Trust: High confidence this is who they claim to be      │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  OAUTH AUTHENTICATED (Medium Trust)                             │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  Requirement:                                              │ │
│  │  • OAuth authenticated                                     │ │
│  │  • Accessed via shared link (not direct invite)           │ │
│  │                                                            │ │
│  │  Display:                                                  │ │
│  │  [○] Bob Johnson - Via link                               │ │
│  │                                                            │ │
│  │  Trust: We know they have a valid OAuth account,          │ │
│  │         but owner didn't specifically invite them         │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  SELF-IDENTIFIED (Low Trust - if guests allowed)               │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  Requirement:                                              │ │
│  │  • No OAuth (guest access)                                │ │
│  │  • Self-provided name                                     │ │
│  │                                                            │ │
│  │  Display:                                                  │ │
│  │  [?] "Carol" - Guest                                      │ │
│  │                                                            │ │
│  │  Trust: Name is self-asserted, could be anyone           │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Operation Trust

```typescript
/**
 * Trust requirements for different operations
 */
const OPERATION_TRUST_REQUIREMENTS: Record<string, TrustRequirement> = {
    // Low-risk operations - basic OAuth is enough
    'cursor:move': {
        minTrustLevel: 'oauth',
        requiresPermission: 'viewer',
        canSpoof: true, // Spoofing only affects display
        impact: 'visual_only'
    },
    
    'presence:join': {
        minTrustLevel: 'oauth',
        requiresPermission: 'viewer',
        canSpoof: true,
        impact: 'visual_only'
    },
    
    // Medium-risk operations - need edit permission
    'operation:apply': {
        minTrustLevel: 'oauth',
        requiresPermission: 'editor',
        canSpoof: false, // Spoofing affects document
        impact: 'document_change'
    },
    
    'comment:add': {
        minTrustLevel: 'oauth',
        requiresPermission: 'commenter',
        canSpoof: false, // Comments are attributed
        impact: 'document_change'
    },
    
    // High-risk operations - need verified identity
    'permission:change': {
        minTrustLevel: 'verified',
        requiresPermission: 'owner',
        canSpoof: false,
        impact: 'access_control'
    }
};

interface TrustRequirement {
    minTrustLevel: 'guest' | 'oauth' | 'verified';
    requiresPermission: 'viewer' | 'commenter' | 'editor' | 'owner';
    canSpoof: boolean;
    impact: 'visual_only' | 'document_change' | 'access_control';
}
```

---

## 4. Trust Verification

### 4.1 Verification Mechanisms

```
┌─────────────────────────────────────────────────────────────────┐
│                  TRUST VERIFICATION METHODS                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. OAUTH VALIDATION                                            │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  What: OAuth provider signed the ID token                 │ │
│  │  When: At sign-in, and on token refresh                  │ │
│  │  How:  OAuth library verifies JWT signature               │ │
│  │  Trust: Provider vouches for user identity               │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  2. EMAIL MATCH                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  What: User's OAuth email matches invite email            │ │
│  │  When: When user joins shared document                   │ │
│  │  How:  Compare OAuth claim to invited email              │ │
│  │  Trust: Confirms this is the intended recipient          │ │
│  │                                                            │ │
│  │  if (oauthEmail.toLowerCase() ===                         │ │
│  │      invitedEmail.toLowerCase()) {                        │ │
│  │    // Verified match                                      │ │
│  │  }                                                         │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  3. CLOUD STORAGE VERIFICATION                                  │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  What: Cloud provider confirms access permission          │ │
│  │  When: When user accesses file                           │ │
│  │  How:  API request with user's token                     │ │
│  │  Trust: Provider enforces access control                 │ │
│  │                                                            │ │
│  │  // If user can access, provider has validated them      │ │
│  │  const file = await cloudStorage.getFile(fileId, token); │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  4. CONNECTION CONSISTENCY                                      │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  What: Same user ID throughout session                    │ │
│  │  When: Every message in collaboration                    │ │
│  │  How:  Track user ID per SignalR connection              │ │
│  │  Trust: Can't switch identity mid-session                │ │
│  │                                                            │ │
│  │  // Server tracks: connectionId → userId                  │ │
│  │  // Reject if message.userId !== expected                 │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Verification Implementation

```typescript
/**
 * Verify user identity for collaboration
 */
class IdentityVerifier {
    /**
     * Verify that a user can join collaboration
     */
    async verifyForCollaboration(
        fileId: string,
        userIdentity: ParsedIdentity,
        accessToken: string
    ): Promise<VerificationResult> {
        const checks: VerificationCheck[] = [];
        
        // Check 1: OAuth token is valid
        const oauthValid = this.isTokenValid(userIdentity);
        checks.push({
            name: 'oauth_token',
            passed: oauthValid,
            details: oauthValid ? 'Token valid' : 'Token expired or invalid'
        });
        
        // Check 2: User has access to file
        const hasAccess = await this.checkFileAccess(fileId, accessToken);
        checks.push({
            name: 'file_access',
            passed: hasAccess.allowed,
            details: hasAccess.role || 'No access'
        });
        
        // Check 3: Email verified (if applicable)
        const emailVerified = userIdentity.emailVerified;
        checks.push({
            name: 'email_verified',
            passed: emailVerified,
            details: emailVerified ? 'Verified by provider' : 'Not verified'
        });
        
        // Determine overall trust level
        const trustLevel = this.calculateTrustLevel(checks, hasAccess);
        
        return {
            verified: checks.every(c => c.passed) || hasAccess.allowed,
            trustLevel,
            checks,
            role: hasAccess.role
        };
    }
    
    private isTokenValid(identity: ParsedIdentity): boolean {
        return identity.expiresAt > new Date();
    }
    
    private async checkFileAccess(
        fileId: string, 
        accessToken: string
    ): Promise<{ allowed: boolean; role?: string }> {
        try {
            const metadata = await this.cloudStorage.getFileMetadata(fileId, accessToken);
            return {
                allowed: true,
                role: metadata.permissions?.role || 'viewer'
            };
        } catch (error) {
            if (error.status === 403 || error.status === 404) {
                return { allowed: false };
            }
            throw error;
        }
    }
    
    private calculateTrustLevel(
        checks: VerificationCheck[],
        access: { allowed: boolean; role?: string }
    ): TrustLevel {
        if (!checks.find(c => c.name === 'oauth_token')?.passed) {
            return 'guest';
        }
        
        if (checks.find(c => c.name === 'email_verified')?.passed &&
            access.role && ['owner', 'editor'].includes(access.role)) {
            return 'verified';
        }
        
        return 'oauth';
    }
}

interface VerificationResult {
    verified: boolean;
    trustLevel: TrustLevel;
    checks: VerificationCheck[];
    role?: string;
}

interface VerificationCheck {
    name: string;
    passed: boolean;
    details: string;
}

type TrustLevel = 'guest' | 'oauth' | 'verified';
```

---

## 5. Trust Revocation

### 5.1 Revocation Scenarios

```
┌─────────────────────────────────────────────────────────────────┐
│                    TRUST REVOCATION                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  OWNER REVOKES ACCESS                                           │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  Trigger: Owner removes collaborator from share list      │ │
│  │                                                            │ │
│  │  Actions:                                                  │ │
│  │  1. Update file permissions (via cloud API)              │ │
│  │  2. Notify SignalR to disconnect user                    │ │
│  │  3. Broadcast presence:leave to other collaborators      │ │
│  │                                                            │ │
│  │  Effect: Immediate loss of access                         │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  USER REVOKES OAUTH                                             │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  Trigger: User revokes Story at OAuth provider           │ │
│  │                                                            │ │
│  │  Actions:                                                  │ │
│  │  1. Next token refresh fails                              │ │
│  │  2. Story detects and clears local tokens                │ │
│  │  3. User is signed out                                    │ │
│  │  4. All collaborations end                                │ │
│  │                                                            │ │
│  │  Effect: Complete disconnection from Story                │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  LINK DISABLED                                                  │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  Trigger: Owner disables link sharing                     │ │
│  │                                                            │ │
│  │  Actions:                                                  │ │
│  │  1. Update sharing settings in file manifest             │ │
│  │  2. Existing link-based connections continue             │ │
│  │  3. New link accesses are denied                         │ │
│  │  4. Optionally: disconnect existing link users           │ │
│  │                                                            │ │
│  │  Effect: No new access via link                          │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  PASSWORD CHANGED                                               │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  Trigger: Owner changes share password                    │ │
│  │                                                            │ │
│  │  Actions:                                                  │ │
│  │  1. Update password hash in file manifest                │ │
│  │  2. Existing sessions may continue (cached verification) │ │
│  │  3. New accesses require new password                    │ │
│  │  4. Optionally: require re-verification                  │ │
│  │                                                            │ │
│  │  Effect: Old password no longer works                    │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Revocation Implementation

```typescript
/**
 * Handle trust/access revocation
 */
class AccessRevocationHandler {
    constructor(
        private cloudStorage: CloudStorageProvider,
        private collaborationHub: CollaborationHub,
        private sessionManager: SessionManager
    ) {}
    
    /**
     * Revoke a specific user's access
     */
    async revokeUserAccess(
        fileId: string,
        userId: string,
        reason: RevocationReason
    ): Promise<void> {
        // 1. Update cloud permissions
        await this.cloudStorage.removePermission(fileId, userId);
        
        // 2. Disconnect from collaboration
        await this.collaborationHub.disconnectUser(fileId, userId, {
            reason: reason,
            message: this.getRevocationMessage(reason)
        });
        
        // 3. Notify other collaborators
        await this.collaborationHub.broadcast(fileId, {
            type: 'presence:leave',
            userInfo: { id: userId },
            payload: { reason: 'access_revoked' }
        });
    }
    
    /**
     * Disable link sharing
     */
    async disableLinkSharing(
        fileId: string,
        disconnectExisting: boolean = false
    ): Promise<void> {
        // 1. Update file manifest
        await this.updateSharingConfig(fileId, { mode: 'none' });
        
        // 2. Optionally disconnect existing link users
        if (disconnectExisting) {
            const linkUsers = await this.collaborationHub.getLinkUsers(fileId);
            for (const user of linkUsers) {
                await this.revokeUserAccess(fileId, user.id, 'link_disabled');
            }
        }
    }
    
    /**
     * Handle OAuth revocation (detected on refresh failure)
     */
    async handleOAuthRevocation(): Promise<void> {
        // 1. Clear all tokens
        this.sessionManager.clearTokens();
        
        // 2. Disconnect from all collaborations
        await this.collaborationHub.disconnectAll('auth_revoked');
        
        // 3. Clear local data
        this.sessionManager.clearProfile();
        
        // 4. Redirect to sign-in
        window.location.href = '/signin?reason=revoked';
    }
    
    private getRevocationMessage(reason: RevocationReason): string {
        const messages: Record<RevocationReason, string> = {
            'owner_removed': 'The owner has removed your access.',
            'link_disabled': 'Link sharing has been disabled.',
            'password_changed': 'The share password has been changed.',
            'auth_revoked': 'Your authentication has expired.',
            'suspicious_activity': 'Access was revoked for security reasons.'
        };
        return messages[reason];
    }
}

type RevocationReason = 
    | 'owner_removed'
    | 'link_disabled'
    | 'password_changed'
    | 'auth_revoked'
    | 'suspicious_activity';
```

---

## Related Specifications

- [Identity Architecture](./identity-architecture.md) - Overall architecture
- [Identity Security](./identity-security.md) - Security model
- [Collaboration Identity](./collaboration-identity.md) - Identity in collaboration
- [Sharing & Permissions](../sharing-permissions.md) - Access control

---

*Trust in Story is earned through OAuth verification and maintained through consistent identity.*
