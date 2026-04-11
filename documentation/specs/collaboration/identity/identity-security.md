# Identity Security

## Overview

This specification defines the **security model** for Story's decentralized identity system. It covers threat analysis, security controls, and best practices for protecting user identity.

**Related Specifications:**
- [Identity Architecture](./identity-architecture.md) - Overall architecture
- [OAuth Identity Flow](./oauth-identity-flow.md) - Token handling
- [Privacy Model](./privacy-model.md) - Privacy considerations
- [Trust Relationships](./trust-relationships.md) - Trust model

---

## Table of Contents

1. [Threat Model](#1-threat-model)
2. [Security Controls](#2-security-controls)
3. [Token Security](#3-token-security)
4. [Collaboration Security](#4-collaboration-security)
5. [Client-Side Security](#5-client-side-security)
6. [Incident Response](#6-incident-response)

---

## 1. Threat Model

### 1.1 Attack Surface

```
┌─────────────────────────────────────────────────────────────────┐
│                      ATTACK SURFACE                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  BROWSER-BASED THREATS                                          │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  XSS (Cross-Site Scripting)                               │ │
│  │  • Could steal tokens from storage                        │ │
│  │  • Could impersonate user in collaboration                │ │
│  │  Mitigations: CSP, sanitization, httpOnly where possible │ │
│  │                                                            │ │
│  │  CSRF (Cross-Site Request Forgery)                        │ │
│  │  • Limited impact - we use OAuth state parameter          │ │
│  │  • No server-side state to corrupt                        │ │
│  │  Mitigations: OAuth state, SameSite cookies               │ │
│  │                                                            │ │
│  │  Token Theft                                               │ │
│  │  • Via XSS                                                 │ │
│  │  • Via malicious browser extension                        │ │
│  │  • Via compromised machine                                │ │
│  │  Mitigations: Short token lifetime, secure storage        │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  NETWORK-BASED THREATS                                          │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  Man-in-the-Middle                                        │ │
│  │  • Token interception                                     │ │
│  │  • Collaboration message tampering                        │ │
│  │  Mitigations: HTTPS only, HSTS, certificate pinning      │ │
│  │                                                            │ │
│  │  Replay Attacks                                            │ │
│  │  • Replaying old collaboration messages                   │ │
│  │  Mitigations: Timestamps, nonces, sequence numbers        │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  COLLABORATION THREATS                                          │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  Identity Spoofing                                        │ │
│  │  • Malicious client sends fake userInfo                   │ │
│  │  • Impersonating another user                             │ │
│  │  Mitigations: See "Collaboration Security" section        │ │
│  │                                                            │ │
│  │  Message Injection                                        │ │
│  │  • Injecting malicious operations                         │ │
│  │  • Corrupting shared document                             │ │
│  │  Mitigations: Operation validation, access control        │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  OAUTH-SPECIFIC THREATS                                         │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  Authorization Code Interception                          │ │
│  │  • Stealing code before exchange                          │ │
│  │  Mitigations: PKCE (code_verifier)                        │ │
│  │                                                            │ │
│  │  Redirect URI Manipulation                                 │ │
│  │  • Redirecting to attacker's site                         │ │
│  │  Mitigations: Strict redirect URI validation              │ │
│  │                                                            │ │
│  │  Token Leakage                                             │ │
│  │  • Token in URL fragment, referrer header                 │ │
│  │  Mitigations: Use code flow (not implicit)                │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Threat Actors

| Actor | Capability | Target | Motivation |
|-------|------------|--------|------------|
| **Curious collaborator** | Low | Other users' identity | Privacy breach |
| **Malicious website** | Medium | OAuth tokens | Account takeover |
| **Browser extension** | High | All browser data | Data theft |
| **Network attacker** | Medium | Network traffic | Credential theft |
| **Insider (contributor)** | High | Source code | Backdoor insertion |

---

## 2. Security Controls

### 2.1 Defense in Depth

```
┌─────────────────────────────────────────────────────────────────┐
│                    DEFENSE IN DEPTH                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  LAYER 1: TRANSPORT SECURITY                                    │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  • HTTPS only (no HTTP)                                    │ │
│  │  • HSTS with long max-age                                  │ │
│  │  • TLS 1.3 preferred                                       │ │
│  │  • Certificate Transparency                                │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  LAYER 2: CONTENT SECURITY                                      │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  • Strict Content-Security-Policy                          │ │
│  │  • X-Content-Type-Options: nosniff                        │ │
│  │  • X-Frame-Options: DENY                                  │ │
│  │  • Referrer-Policy: strict-origin-when-cross-origin       │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  LAYER 3: AUTHENTICATION SECURITY                               │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  • PKCE for all OAuth flows                               │ │
│  │  • State parameter for CSRF                               │ │
│  │  • Short-lived access tokens                              │ │
│  │  • Secure token storage                                   │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  LAYER 4: APPLICATION SECURITY                                  │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  • Input validation                                        │ │
│  │  • Output encoding                                         │ │
│  │  • Operation authorization                                 │ │
│  │  • Rate limiting                                           │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Security Headers

```typescript
/**
 * Security headers for Story application
 */
const SECURITY_HEADERS = {
    // Prevent XSS
    'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' https://accounts.google.com https://apis.google.com",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https: blob:",
        "connect-src 'self' https://*.signalr.net https://graph.microsoft.com https://www.googleapis.com https://login.microsoftonline.com https://accounts.google.com",
        "frame-src https://accounts.google.com https://login.microsoftonline.com",
        "base-uri 'self'",
        "form-action 'self'"
    ].join('; '),
    
    // Prevent clickjacking
    'X-Frame-Options': 'DENY',
    
    // Prevent MIME sniffing
    'X-Content-Type-Options': 'nosniff',
    
    // HTTPS only
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    
    // Control referrer
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    
    // Permissions policy
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
};
```

---

## 3. Token Security

### 3.1 Token Handling Best Practices

```typescript
/**
 * Secure token handling
 */
class SecureTokenStorage {
    private readonly ACCESS_TOKEN_KEY = 'story_access_token';
    private readonly REFRESH_TOKEN_KEY = 'story_refresh_token';
    
    /**
     * Store access token in sessionStorage
     * - Cleared when tab closes
     * - Not accessible from other tabs (slightly more secure)
     * - But still vulnerable to XSS in current tab
     */
    storeAccessToken(token: string, expiresAt: Date): void {
        sessionStorage.setItem(this.ACCESS_TOKEN_KEY, JSON.stringify({
            token,
            expiresAt: expiresAt.toISOString()
        }));
    }
    
    /**
     * Store refresh token in localStorage
     * - Persists across sessions
     * - Needed for session restoration
     * - Higher risk, but necessary for UX
     */
    storeRefreshToken(token: string): void {
        // Consider encrypting with a key derived from user interaction
        localStorage.setItem(this.REFRESH_TOKEN_KEY, token);
    }
    
    /**
     * Get access token (returns null if expired)
     */
    getAccessToken(): string | null {
        const stored = sessionStorage.getItem(this.ACCESS_TOKEN_KEY);
        if (!stored) return null;
        
        const { token, expiresAt } = JSON.parse(stored);
        
        // Never return expired token
        if (new Date(expiresAt) < new Date()) {
            this.clearAccessToken();
            return null;
        }
        
        return token;
    }
    
    /**
     * Clear all tokens
     */
    clearAllTokens(): void {
        sessionStorage.removeItem(this.ACCESS_TOKEN_KEY);
        localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    }
}
```

### 3.2 Token Lifecycle Security

```
┌─────────────────────────────────────────────────────────────────┐
│                   TOKEN LIFECYCLE SECURITY                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ACQUISITION                                                    │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  ✓ Use authorization code flow (not implicit)            │ │
│  │  ✓ Always use PKCE                                        │ │
│  │  ✓ Verify state parameter                                 │ │
│  │  ✓ Exchange code over HTTPS only                         │ │
│  │  ✗ Never expose client secret (we don't have one)        │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  STORAGE                                                        │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  ✓ Access token in sessionStorage (short-lived)          │ │
│  │  ✓ Refresh token in localStorage (persistent)            │ │
│  │  ✗ Never in cookies (CSRF risk)                          │ │
│  │  ✗ Never in URL parameters                               │ │
│  │  ✗ Never in global variables                             │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  USAGE                                                          │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  ✓ Check expiration before use                            │ │
│  │  ✓ Refresh proactively (before expiry)                   │ │
│  │  ✓ Use for intended API calls only                       │ │
│  │  ✗ Never log tokens                                       │ │
│  │  ✗ Never send to third parties                           │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  DISPOSAL                                                       │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  ✓ Clear on sign-out                                      │ │
│  │  ✓ Revoke refresh token with provider                    │ │
│  │  ✓ Clear if refresh fails                                │ │
│  │  ✓ Auto-clear on session expiry                          │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 3.3 Token Theft Detection

```typescript
/**
 * Detect potential token theft or misuse
 */
class TokenSecurityMonitor {
    /**
     * Check for signs of token theft
     */
    detectAnomalies(): TokenAnomaly[] {
        const anomalies: TokenAnomaly[] = [];
        
        // Check for unexpected token presence
        if (this.hasTokenButNoSession()) {
            anomalies.push({
                type: 'orphan_token',
                severity: 'medium',
                description: 'Token exists without active session'
            });
        }
        
        // Check for token in unexpected locations
        if (this.tokenInUrl()) {
            anomalies.push({
                type: 'token_in_url',
                severity: 'high',
                description: 'Token found in URL - possible leakage'
            });
        }
        
        return anomalies;
    }
    
    /**
     * Handle detected anomaly
     */
    handleAnomaly(anomaly: TokenAnomaly): void {
        switch (anomaly.severity) {
            case 'high':
                // Clear all tokens immediately
                this.clearAllTokens();
                // Force re-authentication
                this.forceReauth();
                break;
                
            case 'medium':
                // Log and monitor
                console.warn('Token anomaly detected:', anomaly);
                break;
        }
    }
    
    private hasTokenButNoSession(): boolean {
        const hasToken = !!localStorage.getItem('story_refresh_token');
        const hasSession = !!sessionStorage.getItem('story_session_active');
        return hasToken && !hasSession;
    }
    
    private tokenInUrl(): boolean {
        const url = window.location.href;
        return url.includes('access_token=') || 
               url.includes('id_token=') ||
               url.includes('refresh_token=');
    }
}

interface TokenAnomaly {
    type: string;
    severity: 'low' | 'medium' | 'high';
    description: string;
}
```

---

## 4. Collaboration Security

### 4.1 Identity Spoofing Prevention

```
┌─────────────────────────────────────────────────────────────────┐
│                COLLABORATION IDENTITY SECURITY                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  THE CHALLENGE:                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  Clients self-report their identity in messages.          │ │
│  │  Malicious client could send fake userInfo.               │ │
│  │                                                            │ │
│  │  Message from Alice:                                       │ │
│  │  {                                                         │ │
│  │    userInfo: { id: "bob_123", name: "Bob" }, // FAKE!     │ │
│  │    type: "operation:apply",                               │ │
│  │    payload: { ... malicious changes ... }                 │ │
│  │  }                                                         │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  MITIGATIONS:                                                   │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  1. REQUIRE OAUTH FOR COLLABORATION                       │ │
│  │     • Must be signed in to join session                   │ │
│  │     • Token validated when connecting to SignalR         │ │
│  │                                                            │ │
│  │  2. SERVER-ASSIGNED SESSION ID                            │ │
│  │     • SignalR assigns connection ID                       │ │
│  │     • Can't be spoofed by client                          │ │
│  │                                                            │ │
│  │  3. PERMISSION CHECKS                                      │ │
│  │     • File owner controls who has access                  │ │
│  │     • Operations rejected if user lacks permission        │ │
│  │                                                            │ │
│  │  4. TRUST BUT VERIFY (for low-risk operations)            │ │
│  │     • Trust userInfo for cursors, presence                │ │
│  │     • More scrutiny for document changes                  │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Message Validation

```typescript
/**
 * Validate incoming collaboration messages
 */
class MessageValidator {
    constructor(
        private accessControl: AccessControl,
        private connectionManager: ConnectionManager
    ) {}
    
    /**
     * Validate a collaboration message
     */
    async validateMessage(
        message: CollaborationMessage,
        connectionId: string
    ): Promise<ValidationResult> {
        const errors: string[] = [];
        
        // 1. Check message structure
        if (!this.isValidStructure(message)) {
            errors.push('Invalid message structure');
        }
        
        // 2. Check timestamp (prevent replay)
        if (!this.isRecentTimestamp(message.timestamp)) {
            errors.push('Message timestamp too old or in future');
        }
        
        // 3. Check user ID consistency
        const expectedUserId = this.connectionManager.getUserId(connectionId);
        if (message.userInfo.id !== expectedUserId) {
            errors.push('User ID does not match connection');
        }
        
        // 4. Check permission for operation type
        if (message.type === 'operation:apply') {
            const hasPermission = await this.accessControl.canEdit(
                message.userInfo.id,
                message.payload.documentId
            );
            if (!hasPermission) {
                errors.push('User lacks edit permission');
            }
        }
        
        return {
            valid: errors.length === 0,
            errors
        };
    }
    
    private isValidStructure(message: any): boolean {
        return (
            typeof message.type === 'string' &&
            typeof message.userInfo?.id === 'string' &&
            typeof message.timestamp === 'number' &&
            typeof message.messageId === 'string'
        );
    }
    
    private isRecentTimestamp(timestamp: number): boolean {
        const now = Date.now();
        const fiveMinutes = 5 * 60 * 1000;
        
        // Must be within 5 minutes of now
        return Math.abs(now - timestamp) < fiveMinutes;
    }
}

interface ValidationResult {
    valid: boolean;
    errors: string[];
}
```

---

## 5. Client-Side Security

### 5.1 XSS Prevention

```typescript
/**
 * XSS prevention utilities
 */
class XSSPrevention {
    /**
     * Sanitize user-provided content before rendering
     */
    sanitizeHTML(input: string): string {
        const div = document.createElement('div');
        div.textContent = input;
        return div.innerHTML;
    }
    
    /**
     * Sanitize URL before using in href
     */
    sanitizeURL(url: string): string | null {
        try {
            const parsed = new URL(url);
            
            // Only allow safe protocols
            if (!['http:', 'https:'].includes(parsed.protocol)) {
                return null;
            }
            
            return parsed.toString();
        } catch {
            return null;
        }
    }
    
    /**
     * Sanitize collaboration display name
     */
    sanitizeDisplayName(name: string): string {
        // Remove any HTML/script
        const sanitized = this.sanitizeHTML(name);
        
        // Limit length
        return sanitized.slice(0, 100);
    }
}

// Usage in rendering
function renderCollaboratorName(identity: CollaborationIdentity): string {
    const sanitizer = new XSSPrevention();
    const safeName = sanitizer.sanitizeDisplayName(identity.displayName);
    
    return `<span class="collaborator-name">${safeName}</span>`;
}
```

### 5.2 Secure Storage Access

```typescript
/**
 * Secure wrapper for browser storage
 */
class SecureStorage {
    private readonly prefix = 'story_';
    
    /**
     * Set item with JSON serialization and prefix
     */
    setItem(key: string, value: any): void {
        const prefixedKey = this.prefix + key;
        const serialized = JSON.stringify(value);
        
        try {
            localStorage.setItem(prefixedKey, serialized);
        } catch (e) {
            // Handle quota exceeded
            console.error('Storage quota exceeded');
            this.cleanup();
        }
    }
    
    /**
     * Get item with JSON parsing and validation
     */
    getItem<T>(key: string, validator?: (v: any) => v is T): T | null {
        const prefixedKey = this.prefix + key;
        const stored = localStorage.getItem(prefixedKey);
        
        if (!stored) return null;
        
        try {
            const parsed = JSON.parse(stored);
            
            // Validate if validator provided
            if (validator && !validator(parsed)) {
                console.warn('Stored value failed validation:', key);
                return null;
            }
            
            return parsed;
        } catch {
            console.warn('Failed to parse stored value:', key);
            return null;
        }
    }
    
    /**
     * Remove old/expired items
     */
    cleanup(): void {
        const keysToRemove: string[] = [];
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith(this.prefix)) {
                // Check if item is expired
                try {
                    const item = JSON.parse(localStorage.getItem(key) || '');
                    if (item.expiresAt && new Date(item.expiresAt) < new Date()) {
                        keysToRemove.push(key);
                    }
                } catch {
                    // Invalid JSON - remove it
                    keysToRemove.push(key);
                }
            }
        }
        
        keysToRemove.forEach(key => localStorage.removeItem(key));
    }
}
```

---

## 6. Incident Response

### 6.1 Security Events

```typescript
/**
 * Security event types and handling
 */
enum SecurityEventType {
    // Token events
    TOKEN_EXPIRED = 'token_expired',
    TOKEN_REFRESH_FAILED = 'token_refresh_failed',
    TOKEN_ANOMALY = 'token_anomaly',
    
    // Authentication events
    AUTH_FAILED = 'auth_failed',
    AUTH_REVOKED = 'auth_revoked',
    
    // Access events
    ACCESS_DENIED = 'access_denied',
    PERMISSION_VIOLATION = 'permission_violation',
    
    // Collaboration events
    INVALID_MESSAGE = 'invalid_message',
    SPOOFING_ATTEMPT = 'spoofing_attempt'
}

/**
 * Security event handler
 */
class SecurityEventHandler {
    private handlers: Map<SecurityEventType, ((event: SecurityEvent) => void)[]> = new Map();
    
    /**
     * Emit a security event
     */
    emit(type: SecurityEventType, details: any): void {
        const event: SecurityEvent = {
            type,
            timestamp: new Date(),
            details
        };
        
        // Log to console (in development)
        console.warn('Security event:', event);
        
        // Run handlers
        const handlers = this.handlers.get(type) || [];
        handlers.forEach(handler => handler(event));
        
        // Take automatic action for critical events
        this.handleCriticalEvent(event);
    }
    
    /**
     * Handle critical security events
     */
    private handleCriticalEvent(event: SecurityEvent): void {
        switch (event.type) {
            case SecurityEventType.TOKEN_ANOMALY:
            case SecurityEventType.SPOOFING_ATTEMPT:
                // Force sign-out
                this.forceSignOut('Security event detected');
                break;
                
            case SecurityEventType.AUTH_REVOKED:
                // Clear all data and show sign-in
                this.clearAndRedirect();
                break;
        }
    }
    
    private forceSignOut(reason: string): void {
        window.dispatchEvent(new CustomEvent('story:force-signout', {
            detail: { reason }
        }));
    }
    
    private clearAndRedirect(): void {
        // Clear all storage
        localStorage.clear();
        sessionStorage.clear();
        
        // Redirect to sign-in
        window.location.href = '/signin?reason=revoked';
    }
}

interface SecurityEvent {
    type: SecurityEventType;
    timestamp: Date;
    details: any;
}
```

### 6.2 User Notification

```
┌─────────────────────────────────────────────────────────────────┐
│               SECURITY NOTIFICATIONS TO USER                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  SESSION EXPIRED                                                │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  ⚠️ Your session has expired                              │ │
│  │                                                            │ │
│  │  Please sign in again to continue.                        │ │
│  │                                                            │ │
│  │  [Sign In]                                                 │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ACCESS REVOKED                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  ⚠️ Access has been revoked                               │ │
│  │                                                            │ │
│  │  Story's access to your account has been removed.         │ │
│  │  This may have been done from your account settings.     │ │
│  │                                                            │ │
│  │  [Sign In Again]                                           │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  SUSPICIOUS ACTIVITY                                            │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  ⚠️ Suspicious activity detected                          │ │
│  │                                                            │ │
│  │  We noticed unusual activity and signed you out            │ │
│  │  for security. Please sign in again.                      │ │
│  │                                                            │ │
│  │  If you didn't expect this, consider:                     │ │
│  │  • Changing your password at Microsoft/Google             │ │
│  │  • Reviewing connected apps                               │ │
│  │                                                            │ │
│  │  [Sign In]  [Learn More]                                   │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Related Specifications

- [Identity Architecture](./identity-architecture.md) - Overall architecture
- [OAuth Identity Flow](./oauth-identity-flow.md) - Token handling
- [Privacy Model](./privacy-model.md) - Privacy considerations
- [Trust Relationships](./trust-relationships.md) - Trust model

---

*Security is built into Story's identity system through defense in depth.*
