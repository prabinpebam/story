# Security Model - Specification

## Overview

This document defines the security architecture for Story, covering code execution sandboxing, file validation, encryption, and secure authentication.

---

## 1. Code Fill Sandboxing

### The Risk

Code fills contain user-written JavaScript that executes in the browser. Without sandboxing, malicious code could:
- Access the DOM and steal data
- Access localStorage/IndexedDB
- Make network requests
- Access other presentations
- Hijack user session

### Sandbox Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Main Application                         │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                    Canvas Element                        ││
│  │                 (Renders sandboxed output)               ││
│  └─────────────────────────────────────────────────────────┘│
│                            ▲                                 │
│                            │ ImageBitmap transfer            │
│                            │                                 │
├────────────────────────────┼────────────────────────────────┤
│                            │                                 │
│  ┌─────────────────────────▼─────────────────────────────┐  │
│  │              Sandboxed iframe (srcdoc)                 │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │  sandbox="allow-scripts"                        │  │  │
│  │  │  (no allow-same-origin, no allow-forms, etc.)   │  │  │
│  │  │                                                 │  │  │
│  │  │  ┌─────────────────────────────────────────┐   │  │  │
│  │  │  │         OffscreenCanvas                 │   │  │  │
│  │  │  │         (User code draws here)          │   │  │  │
│  │  │  └─────────────────────────────────────────┘   │  │  │
│  │  │                                                 │  │  │
│  │  │  postMessage(ImageBitmap) to parent            │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Implementation

```javascript
class SandboxedCodeRunner {
    constructor() {
        this.iframe = null;
        this.canvas = null;
    }
    
    initialize() {
        // Create sandboxed iframe
        this.iframe = document.createElement('iframe');
        this.iframe.sandbox = 'allow-scripts'; // Only scripts, nothing else
        this.iframe.style.display = 'none';
        
        // Inject minimal runtime
        this.iframe.srcdoc = `
            <!DOCTYPE html>
            <html>
            <head>
                <script>
                    // No access to parent, localStorage, fetch, etc.
                    // Only canvas drawing APIs available
                    
                    let canvas, ctx;
                    let userDraw = null;
                    
                    window.addEventListener('message', (e) => {
                        if (e.data.type === 'INIT') {
                            canvas = new OffscreenCanvas(e.data.width, e.data.height);
                            ctx = canvas.getContext('2d');
                        }
                        
                        if (e.data.type === 'SET_CODE') {
                            try {
                                // Wrap user code in function
                                userDraw = new Function('ctx', 'canvas', 'time', e.data.code);
                            } catch (err) {
                                parent.postMessage({ type: 'ERROR', message: err.message }, '*');
                            }
                        }
                        
                        if (e.data.type === 'DRAW') {
                            if (userDraw && ctx) {
                                try {
                                    userDraw(ctx, canvas, e.data.time);
                                    // Transfer rendered frame to parent
                                    const bitmap = canvas.transferToImageBitmap();
                                    parent.postMessage({ type: 'FRAME', bitmap }, '*', [bitmap]);
                                } catch (err) {
                                    parent.postMessage({ type: 'ERROR', message: err.message }, '*');
                                }
                            }
                        }
                    });
                </script>
            </head>
            <body></body>
            </html>
        `;
        
        document.body.appendChild(this.iframe);
    }
    
    setCode(code) {
        // Validate code before sending to sandbox
        const sanitized = this.sanitizeCode(code);
        
        this.iframe.contentWindow.postMessage({
            type: 'SET_CODE',
            code: sanitized
        }, '*');
    }
    
    sanitizeCode(code) {
        // Remove dangerous patterns
        const forbidden = [
            /\beval\b/g,
            /\bFunction\b/g,
            /\bfetch\b/g,
            /\bXMLHttpRequest\b/g,
            /\bimport\b/g,
            /\bparent\b/g,
            /\btop\b/g,
            /\bwindow\b/g,
            /\bdocument\b/g,
            /\blocalStorage\b/g,
            /\bsessionStorage\b/g,
            /\bindexedDB\b/g,
            /\bpostMessage\b/g
        ];
        
        for (const pattern of forbidden) {
            if (pattern.test(code)) {
                throw new SecurityError(`Forbidden pattern detected: ${pattern}`);
            }
        }
        
        return code;
    }
}
```

### Alternative: Web Worker Sandbox

```javascript
class WorkerSandbox {
    constructor() {
        // Create worker from blob URL (isolated context)
        const workerCode = `
            let canvas, ctx;
            let userDraw = null;
            
            self.onmessage = (e) => {
                if (e.data.type === 'INIT') {
                    canvas = e.data.canvas; // OffscreenCanvas transferred
                    ctx = canvas.getContext('2d');
                }
                
                if (e.data.type === 'SET_CODE') {
                    try {
                        // Create function from user code
                        userDraw = new Function('ctx', 'canvas', 'time', e.data.code);
                    } catch (err) {
                        self.postMessage({ type: 'ERROR', message: err.message });
                    }
                }
                
                if (e.data.type === 'DRAW') {
                    if (userDraw) {
                        try {
                            userDraw(ctx, canvas, e.data.time);
                            self.postMessage({ type: 'FRAME_READY' });
                        } catch (err) {
                            self.postMessage({ type: 'ERROR', message: err.message });
                        }
                    }
                }
            };
        `;
        
        const blob = new Blob([workerCode], { type: 'application/javascript' });
        this.worker = new Worker(URL.createObjectURL(blob));
    }
}
```

---

## 2. File Validation

### ZIP Structure Validation

```javascript
class FileValidator {
    async validate(file) {
        const errors = [];
        
        // 1. Check file signature (ZIP magic bytes)
        const header = await this.readBytes(file, 0, 4);
        if (!this.isZipSignature(header)) {
            throw new ValidationError('Invalid file format: not a ZIP archive');
        }
        
        // 2. Check file size limits
        if (file.size > MAX_FILE_SIZE) {
            throw new ValidationError(`File too large: ${file.size} bytes (max: ${MAX_FILE_SIZE})`);
        }
        
        // 3. Extract and validate manifest
        const zip = await this.openZip(file);
        const manifest = await this.validateManifest(zip);
        
        // 4. Validate all entries against manifest
        await this.validateEntries(zip, manifest);
        
        // 5. Validate assets
        await this.validateAssets(zip, manifest);
        
        return { valid: true, manifest };
    }
    
    async validateManifest(zip) {
        const manifestData = await zip.readFile('manifest.json');
        if (!manifestData) {
            throw new ValidationError('Missing manifest.json');
        }
        
        let manifest;
        try {
            manifest = JSON.parse(manifestData);
        } catch (e) {
            throw new ValidationError('Invalid manifest.json: not valid JSON');
        }
        
        // Required fields
        const required = ['version', 'appVersion', 'created', 'modified'];
        for (const field of required) {
            if (!manifest[field]) {
                throw new ValidationError(`Missing required field: ${field}`);
            }
        }
        
        // Version compatibility
        if (!this.isVersionCompatible(manifest.version)) {
            throw new ValidationError(
                `Incompatible file version: ${manifest.version}. ` +
                `Please update Story to open this file.`
            );
        }
        
        return manifest;
    }
    
    async validateAssets(zip, manifest) {
        const assetIndex = await zip.readFile('assets/index.json');
        if (!assetIndex) return; // No assets
        
        const assets = JSON.parse(assetIndex);
        
        for (const [filename, meta] of Object.entries(assets)) {
            // Verify asset exists
            if (!await zip.hasFile(`assets/${filename}`)) {
                throw new ValidationError(`Missing asset: ${filename}`);
            }
            
            // Verify hash matches
            const assetData = await zip.readFile(`assets/${filename}`);
            const hash = await this.computeHash(assetData);
            
            if (hash !== meta.hash) {
                throw new ValidationError(
                    `Asset integrity check failed: ${filename}. File may be corrupted.`
                );
            }
            
            // Validate asset type
            await this.validateAssetType(assetData, meta.type);
        }
    }
}
```

### Asset Type Validation

```javascript
class AssetValidator {
    async validateAssetType(data, declaredType) {
        // Check magic bytes match declared type
        const signature = new Uint8Array(data.slice(0, 12));
        
        const signatures = {
            'image/jpeg': [0xFF, 0xD8, 0xFF],
            'image/png': [0x89, 0x50, 0x4E, 0x47],
            'image/gif': [0x47, 0x49, 0x46],
            'image/webp': null, // Check RIFF header
            'video/mp4': null,  // Check ftyp atom
            'video/webm': [0x1A, 0x45, 0xDF, 0xA3]
        };
        
        const expected = signatures[declaredType];
        if (expected) {
            for (let i = 0; i < expected.length; i++) {
                if (signature[i] !== expected[i]) {
                    throw new ValidationError(
                        `Asset type mismatch: declared ${declaredType} but signature doesn't match`
                    );
                }
            }
        }
    }
    
    // SVG needs special handling - can contain scripts
    async validateSVG(svgString) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(svgString, 'image/svg+xml');
        
        // Check for script elements
        const scripts = doc.querySelectorAll('script');
        if (scripts.length > 0) {
            throw new SecurityError('SVG contains script elements');
        }
        
        // Check for event handlers
        const allElements = doc.querySelectorAll('*');
        for (const el of allElements) {
            for (const attr of el.attributes) {
                if (attr.name.startsWith('on')) {
                    throw new SecurityError(`SVG contains event handler: ${attr.name}`);
                }
            }
            
            // Check for javascript: URLs
            const href = el.getAttribute('href') || el.getAttribute('xlink:href');
            if (href && href.toLowerCase().startsWith('javascript:')) {
                throw new SecurityError('SVG contains javascript: URL');
            }
        }
        
        // Check for external references
        const externalRefs = doc.querySelectorAll('[href^="http"], [xlink\\:href^="http"]');
        if (externalRefs.length > 0) {
            console.warn('SVG contains external references - they will not be loaded');
        }
        
        return true;
    }
}
```

---

## 3. Encryption

Story supports two encryption modes:
1. **Password Protection** - For sharing encrypted presentations
2. **Identity-Bound Encryption** - For user preferences files (see [User Preferences File](../identity/user-preferences-file.md))

### Password Protection

```javascript
class EncryptedFileHandler {
    constructor() {
        this.algorithm = 'AES-GCM';
        this.keyLength = 256;
        this.iterations = 100000;
    }
    
    async encrypt(data, password) {
        // Generate salt
        const salt = crypto.getRandomValues(new Uint8Array(16));
        
        // Derive key using PBKDF2
        const key = await this.deriveKey(password, salt);
        
        // Generate IV
        const iv = crypto.getRandomValues(new Uint8Array(12));
        
        // Encrypt data
        const encrypted = await crypto.subtle.encrypt(
            { name: this.algorithm, iv },
            key,
            data
        );
        
        // Package: salt + iv + encrypted data
        return this.packageEncryptedData(salt, iv, encrypted);
    }
    
    async decrypt(encryptedPackage, password) {
        // Extract components
        const { salt, iv, encryptedData } = this.unpackageEncryptedData(encryptedPackage);
        
        // Derive key
        const key = await this.deriveKey(password, salt);
        
        // Decrypt
        try {
            return await crypto.subtle.decrypt(
                { name: this.algorithm, iv },
                key,
                encryptedData
            );
        } catch (e) {
            throw new DecryptionError('Invalid password or corrupted file');
        }
    }
    
    async deriveKey(password, salt) {
        // Import password as key material
        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            new TextEncoder().encode(password),
            'PBKDF2',
            false,
            ['deriveKey']
        );
        
        // Derive AES key
        return crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt,
                iterations: this.iterations,
                hash: 'SHA-256'
            },
            keyMaterial,
            { name: this.algorithm, length: this.keyLength },
            false,
            ['encrypt', 'decrypt']
        );
    }
    
    packageEncryptedData(salt, iv, encrypted) {
        // Format: [1 byte version][16 bytes salt][12 bytes iv][encrypted data]
        const version = new Uint8Array([1]);
        const encryptedArray = new Uint8Array(encrypted);
        
        const result = new Uint8Array(1 + 16 + 12 + encryptedArray.length);
        result.set(version, 0);
        result.set(salt, 1);
        result.set(iv, 17);
        result.set(encryptedArray, 29);
        
        return result.buffer;
    }
}
```

### Manifest for Encrypted Files

```javascript
{
    "version": "1.0.0",
    "encryption": {
        "enabled": true,
        "algorithm": "AES-256-GCM",
        "keyDerivation": {
            "algorithm": "PBKDF2",
            "iterations": 100000,
            "hash": "SHA-256"
        },
        // Only unencrypted metadata
        "title": "Protected Presentation",
        "thumbnail": null  // Thumbnail is inside encrypted payload
    }
}
```

### Identity-Bound Encryption

For user preferences files, encryption is bound to OAuth identity rather than a password:

```javascript
/**
 * Derive encryption key from OAuth identity
 * No password needed - OAuth IS the key
 */
class IdentityBoundEncryption {
    /**
     * Derive key from stable OAuth claims
     */
    async deriveKey(idTokenClaims, salt) {
        // Create identity material from stable claims
        const identityMaterial = JSON.stringify({
            sub: idTokenClaims.sub,     // Unique user ID (stable)
            iss: idTokenClaims.iss      // Issuer (provider)
            // Note: Don't use email or name (can change)
        });
        
        // Import as key material
        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            new TextEncoder().encode(identityMaterial),
            'HKDF',
            false,
            ['deriveKey']
        );
        
        // Derive AES key using HKDF
        return crypto.subtle.deriveKey(
            {
                name: 'HKDF',
                salt: salt,
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

> **See [User Preferences File](../identity/user-preferences-file.md) for complete implementation.**

---

## 4. Token Storage

### Secure Token Management

```javascript
class SecureTokenStorage {
    constructor() {
        // Use session storage for access tokens (cleared on browser close)
        // Use encrypted IndexedDB for refresh tokens
        this.accessTokenKey = 'story:access_token';
        this.refreshTokenKey = 'story:refresh_token';
    }
    
    async storeTokens(accessToken, refreshToken) {
        // Access token in session storage (short-lived)
        sessionStorage.setItem(this.accessTokenKey, accessToken);
        
        // Refresh token encrypted in IndexedDB
        if (refreshToken) {
            const encrypted = await this.encryptForStorage(refreshToken);
            await this.db.put('tokens', {
                key: this.refreshTokenKey,
                value: encrypted,
                expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000 // 30 days
            });
        }
    }
    
    async getAccessToken() {
        const token = sessionStorage.getItem(this.accessTokenKey);
        
        if (!token || this.isExpired(token)) {
            // Try to refresh
            return this.refreshAccessToken();
        }
        
        return token;
    }
    
    async refreshAccessToken() {
        const encryptedRefresh = await this.db.get('tokens', this.refreshTokenKey);
        if (!encryptedRefresh) {
            throw new AuthError('No refresh token available');
        }
        
        const refreshToken = await this.decryptFromStorage(encryptedRefresh.value);
        
        // Call refresh endpoint
        const response = await fetch('/api/auth/refresh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken })
        });
        
        if (!response.ok) {
            // Refresh failed, clear tokens and redirect to login
            await this.clearTokens();
            throw new AuthError('Session expired');
        }
        
        const { accessToken, newRefreshToken } = await response.json();
        await this.storeTokens(accessToken, newRefreshToken);
        
        return accessToken;
    }
    
    async encryptForStorage(data) {
        // Use device-bound key (derived from origin + user agent)
        const key = await this.getDeviceKey();
        const iv = crypto.getRandomValues(new Uint8Array(12));
        
        const encrypted = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv },
            key,
            new TextEncoder().encode(data)
        );
        
        return { iv: Array.from(iv), data: Array.from(new Uint8Array(encrypted)) };
    }
}
```

---

## 5. Content Security Policy

### Recommended CSP Headers

```
Content-Security-Policy: 
    default-src 'self';
    script-src 'self' 'wasm-unsafe-eval';
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data:;
    media-src 'self' blob:;
    connect-src 'self' https://accounts.google.com https://www.googleapis.com wss://collab.story.com;
    frame-src 'self';
    worker-src 'self' blob:;
    child-src 'self' blob:;
```

### Frame Sandbox for Code Fills

```html
<!-- Code fill iframe -->
<iframe 
    sandbox="allow-scripts"
    csp="default-src 'none'; script-src 'unsafe-inline'"
    srcdoc="..."
></iframe>
```

---

## 6. Input Sanitization

### HTML/Text Input

```javascript
class InputSanitizer {
    sanitizeText(input) {
        // Remove any HTML tags
        return input.replace(/<[^>]*>/g, '');
    }
    
    sanitizeRichText(html) {
        // Allow only safe tags and attributes
        const allowedTags = ['b', 'i', 'u', 's', 'sup', 'sub', 'span', 'br'];
        const allowedAttributes = {
            'span': ['style'],
            '*': []
        };
        
        // Use DOMPurify or similar
        return DOMPurify.sanitize(html, {
            ALLOWED_TAGS: allowedTags,
            ALLOWED_ATTR: ['style'],
            ALLOW_STYLE_ATTRIBUTES: true
        });
    }
    
    sanitizeFilename(filename) {
        // Remove path traversal
        return filename
            .replace(/\.\./g, '')
            .replace(/[\/\\]/g, '')
            .replace(/[^a-zA-Z0-9._-]/g, '_');
    }
}
```

---

## 7. Audit Logging

### Security Events to Log

```javascript
const SecurityEvents = {
    // Authentication
    AUTH_SUCCESS: 'auth_success',
    AUTH_FAILURE: 'auth_failure',
    TOKEN_REFRESH: 'token_refresh',
    LOGOUT: 'logout',
    
    // File operations
    FILE_OPEN: 'file_open',
    FILE_SAVE: 'file_save',
    FILE_SHARE: 'file_share',
    
    // Security violations
    CODE_INJECTION_ATTEMPT: 'code_injection_attempt',
    INVALID_FILE_FORMAT: 'invalid_file_format',
    PERMISSION_DENIED: 'permission_denied',
    
    // Encryption
    FILE_ENCRYPTED: 'file_encrypted',
    FILE_DECRYPTED: 'file_decrypted',
    DECRYPT_FAILED: 'decrypt_failed'
};

class SecurityLogger {
    log(event, details = {}) {
        const entry = {
            event,
            timestamp: new Date().toISOString(),
            userId: this.getCurrentUserId(),
            sessionId: this.getSessionId(),
            details,
            userAgent: navigator.userAgent,
            origin: window.location.origin
        };
        
        // Local logging
        console.info('[Security]', entry);
        
        // Send to server (for collaboration mode)
        if (this.isCollaborationEnabled()) {
            this.sendToServer(entry);
        }
        
        // Store locally for debugging
        this.storeLocally(entry);
    }
}
```

---

## 8. Security Checklist

### Before Release

- [ ] Code fill sandboxing implemented and tested
- [ ] SVG sanitization implemented
- [ ] File validation covers all attack vectors
- [ ] Encryption uses strong algorithms (AES-256-GCM)
- [ ] Tokens stored securely (not in localStorage)
- [ ] CSP headers configured
- [ ] Input sanitization on all user input
- [ ] Audit logging in place

### Regular Security Reviews

- [ ] Dependency vulnerability scanning
- [ ] Penetration testing for collaboration features
- [ ] Code review for security-sensitive changes
- [ ] Update encryption parameters as needed

---

*Security is an ongoing concern. This spec should be updated as new threats are identified.*
