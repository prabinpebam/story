# URL Routing Strategy Specification

## Executive Summary

Story uses **ultra-short encoded URLs** that pack all navigation state into a compact, URL-safe string. Unlike Figma's verbose URLs, Story URLs are designed to be as short as possible while remaining fully functional.

**Example URLs:**
```
story.app/d/Kx9mP2              # Basic file (6 chars)
story.app/d/Kx9mP2.3            # File + slide 3
story.app/d/Kx9mP2.3p           # Slide 3, presentation mode
story.app/d/Kx9mP2~sH7kL        # Shared link with token
```

**Comparison:**
| App | URL Length | Example |
|-----|------------|---------|
| Figma | ~120 chars | `figma.com/design/AbCdEf123456/My-Design?node-id=1234%3A5678&t=...` |
| Google Slides | ~90 chars | `docs.google.com/presentation/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit#slide=id.g123` |
| **Story** | **~15 chars** | `story.app/d/Kx9mP2.3p` |

---

## 1. URL Structure

### 1.1 Minimal Format

```
/d/{code}[.{slide}][{mode}][~{token}]
```

| Part | Chars | Description | Example |
|------|-------|-------------|---------|
| `/d/` | 3 | Document prefix | `/d/` |
| `{code}` | 6 | Encoded file ID | `Kx9mP2` |
| `.{slide}` | 1-3 | Optional slide number | `.3`, `.15` |
| `{mode}` | 1 | Optional mode flag | `p`=present, `v`=view |
| `~{token}` | 6 | Optional share token | `~sH7kL` |

### 1.2 URL Examples

```
/d/Kx9mP2                    # Edit file (default mode)
/d/Kx9mP2.1                  # Edit slide 1
/d/Kx9mP2.5p                 # Present starting at slide 5
/d/Kx9mP2v                   # View-only mode
/d/Kx9mP2~sH7kL              # Shared link
/d/Kx9mP2.3p~sH7kL           # Shared presentation at slide 3
```

### 1.3 Special Routes

```
/                            # Home / Dashboard
/auth/callback               # OAuth callback (internal)
/new                         # Create new presentation
/t                           # Templates
/s                           # Settings
```

---

## 2. Encoding System

### 2.1 Character Set

Uses a URL-safe Base62 alphabet (no special characters needed):

```javascript
const ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
// 62 characters = ~5.95 bits per character
```

### 2.2 File Code Generation

6-character codes provide 62^6 = **56.8 billion unique combinations**.

```javascript
class UrlCodec {
    static ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    
    /**
     * Generate a random 6-character file code
     */
    static generateFileCode() {
        const bytes = new Uint8Array(6);
        crypto.getRandomValues(bytes);
        return Array.from(bytes)
            .map(b => this.ALPHABET[b % 62])
            .join('');
    }
    
    /**
     * Encode a number to Base62
     */
    static encodeNumber(num) {
        if (num === 0) return '0';
        let result = '';
        while (num > 0) {
            result = this.ALPHABET[num % 62] + result;
            num = Math.floor(num / 62);
        }
        return result;
    }
    
    /**
     * Decode Base62 to number
     */
    static decodeNumber(str) {
        let result = 0;
        for (const char of str) {
            result = result * 62 + this.ALPHABET.indexOf(char);
        }
        return result;
    }
}
```

### 2.3 Full URL Encoding

Pack all state into a single short string:

```javascript
class StoryUrl {
    /**
     * Build a Story URL from components
     */
    static build({ fileCode, slide = null, mode = null, shareToken = null }) {
        let url = `/d/${fileCode}`;
        
        // Add slide number (if not slide 1 or default)
        if (slide && slide > 1) {
            url += `.${slide}`;
        } else if (slide === 1 && mode) {
            // Need separator before mode
            url += '.1';
        }
        
        // Add mode flag
        if (mode === 'present') url += 'p';
        else if (mode === 'view') url += 'v';
        else if (mode === 'preview') url += 'r';
        
        // Add share token
        if (shareToken) {
            url += `~${shareToken}`;
        }
        
        return url;
    }
    
    /**
     * Parse a Story URL
     */
    static parse(url) {
        const match = url.match(/^\/d\/([A-Za-z0-9]{6})(?:\.(\d+))?([pvr])?(?:~([A-Za-z0-9]+))?$/);
        
        if (!match) return null;
        
        return {
            fileCode: match[1],
            slide: match[2] ? parseInt(match[2], 10) : 1,
            mode: { 'p': 'present', 'v': 'view', 'r': 'preview' }[match[3]] || 'edit',
            shareToken: match[4] || null
        };
    }
}

// Examples:
StoryUrl.build({ fileCode: 'Kx9mP2' });
// → "/d/Kx9mP2"

StoryUrl.build({ fileCode: 'Kx9mP2', slide: 5, mode: 'present' });
// → "/d/Kx9mP2.5p"

StoryUrl.build({ fileCode: 'Kx9mP2', shareToken: 'sH7kL' });
// → "/d/Kx9mP2~sH7kL"

StoryUrl.parse('/d/Kx9mP2.5p~sH7kL');
// → { fileCode: 'Kx9mP2', slide: 5, mode: 'present', shareToken: 'sH7kL' }
```

### 2.4 Share Token Generation

5-character tokens provide 62^5 = **916 million combinations** (plenty for share links):

```javascript
static generateShareToken() {
    const bytes = new Uint8Array(5);
    crypto.getRandomValues(bytes);
    return Array.from(bytes)
        .map(b => this.ALPHABET[b % 62])
        .join('');
}
```

---

## 3. File Code Registry

### 3.1 Local Storage Mapping

Map short codes to actual file references:

```javascript
class FileCodeRegistry {
    static STORAGE_KEY = 'story-file-codes';
    
    static getRegistry() {
        return JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '{}');
    }
    
    static saveRegistry(registry) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(registry));
    }
    
    /**
     * Register a file and get its code
     */
    static register(fileInfo) {
        const registry = this.getRegistry();
        
        // Check if file already has a code
        const existing = Object.entries(registry).find(([code, info]) => 
            info.provider === fileInfo.provider && 
            info.cloudId === fileInfo.cloudId
        );
        
        if (existing) return existing[0];
        
        // Generate new code
        const code = UrlCodec.generateFileCode();
        registry[code] = {
            ...fileInfo,
            created: Date.now()
        };
        
        this.saveRegistry(registry);
        return code;
    }
    
    /**
     * Look up file info by code
     */
    static lookup(code) {
        const registry = this.getRegistry();
        return registry[code] || null;
    }
    
    /**
     * Get code for existing file
     */
    static getCode(provider, cloudId) {
        const registry = this.getRegistry();
        const entry = Object.entries(registry).find(([_, info]) => 
            info.provider === provider && info.cloudId === cloudId
        );
        return entry ? entry[0] : null;
    }
}

// Usage:
const code = FileCodeRegistry.register({
    provider: 'onedrive',
    cloudId: 'DriveItem.12345',
    name: 'My Presentation.story',
    path: '/Documents/Story/'
});
// → "Kx9mP2"

FileCodeRegistry.lookup('Kx9mP2');
// → { provider: 'onedrive', cloudId: '...', name: '...', ... }
```

### 3.2 Registry Entry Structure

```typescript
interface FileCodeEntry {
    provider: 'local' | 'onedrive' | 'googledrive' | 'dropbox';
    cloudId?: string;       // Cloud provider's file ID
    localHandle?: string;   // Serialized FileSystemHandle (for local files)
    name: string;           // File name
    path?: string;          // File path
    created: number;        // Timestamp when code was created
    lastAccessed?: number;  // Last access timestamp
}
```

### 3.3 Cleanup & Limits

```javascript
class FileCodeRegistry {
    static MAX_ENTRIES = 1000;
    static MAX_AGE_DAYS = 90;
    
    static cleanup() {
        const registry = this.getRegistry();
        const now = Date.now();
        const maxAge = this.MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
        
        // Remove old entries
        const entries = Object.entries(registry)
            .filter(([_, info]) => now - info.created < maxAge)
            .sort((a, b) => (b[1].lastAccessed || b[1].created) - (a[1].lastAccessed || a[1].created))
            .slice(0, this.MAX_ENTRIES);
        
        const cleaned = Object.fromEntries(entries);
        this.saveRegistry(cleaned);
    }
}
```

---

## 4. Share Links

### 4.1 Share Link Structure

```
/d/{fileCode}~{token}
```

The token maps to share permissions stored server-side or in the file metadata.

### 4.2 Share Token Registry

```javascript
class ShareTokenRegistry {
    /**
     * Create a share link
     */
    static async create(fileCode, options = {}) {
        const token = UrlCodec.generateShareToken();
        
        const shareInfo = {
            fileCode,
            token,
            access: options.access || 'view',  // 'view', 'comment', 'edit'
            expires: options.expires || null,   // Timestamp or null for no expiry
            password: options.password ? await this.hashPassword(options.password) : null,
            created: Date.now(),
            createdBy: options.userId
        };
        
        // Store in file metadata or server
        await this.saveShare(shareInfo);
        
        return token;
    }
    
    /**
     * Validate share token
     */
    static async validate(fileCode, token, password = null) {
        const share = await this.getShare(fileCode, token);
        
        if (!share) return { valid: false, reason: 'invalid_token' };
        if (share.expires && Date.now() > share.expires) return { valid: false, reason: 'expired' };
        if (share.password && !await this.verifyPassword(password, share.password)) {
            return { valid: false, reason: 'password_required' };
        }
        
        return { valid: true, access: share.access };
    }
}
```

---

## 5. Extended State (Optional)

For advanced use cases, support an extended state parameter that can be compressed:

### 5.1 Extended URL Format

```
/d/{fileCode}:{extendedState}
```

### 5.2 State Compression

```javascript
class ExtendedState {
    /**
     * Encode complex state into a short string
     */
    static encode(state) {
        // Convert to minimal JSON
        const json = JSON.stringify(state);
        
        // Compress using simple dictionary + base62
        const compressed = this.compress(json);
        
        // URL-safe base62 encoding
        return this.toBase62(compressed);
    }
    
    /**
     * Decode state string back to object
     */
    static decode(encoded) {
        const compressed = this.fromBase62(encoded);
        const json = this.decompress(compressed);
        return JSON.parse(json);
    }
    
    /**
     * Simple compression for common keys
     */
    static compress(json) {
        const dictionary = {
            '"slide":': 's:',
            '"zoom":': 'z:',
            '"element":': 'e:',
            '"panel":': 'p:',
            'true': '1',
            'false': '0'
        };
        
        let result = json;
        for (const [long, short] of Object.entries(dictionary)) {
            result = result.replace(new RegExp(long, 'g'), short);
        }
        return result;
    }
}
```

### 5.3 When to Use Extended State

| Use Case | Simple URL | Extended State |
|----------|------------|----------------|
| Open file | ✓ `/d/Kx9mP2` | |
| Go to slide | ✓ `/d/Kx9mP2.5` | |
| Present mode | ✓ `/d/Kx9mP2p` | |
| Zoom level | | ✓ `/d/Kx9mP2:z150` |
| Selected element | | ✓ `/d/Kx9mP2:eAbc` |
| Multiple selections | | ✓ `/d/Kx9mP2:e[Ab,Cd]` |

---

## 5. Asset Path Resolution

### 5.1 Problem

Relative asset paths break when navigating to deep routes:
- Route: `/auth/callback`
- Asset: `assets/story.png`
- Resolved: `/auth/assets/story.png` ❌

### 5.2 Solution: Absolute Paths with Base URL

**index.html:**
```html
<head>
    <base href="/">
    <link rel="icon" type="image/png" href="/assets/story.png">
    <!-- All CSS links should use absolute paths -->
    <link rel="stylesheet" href="/styles/modules/variables.css">
</head>
```

**JavaScript:**
```javascript
// Use import.meta.url for module-relative assets
const logoUrl = new URL('../assets/story.png', import.meta.url).href;

// Or use absolute paths
const logoUrl = '/assets/story.png';
```

### 5.3 Vite Configuration

```javascript
// vite.config.js
export default {
    base: '/',
    build: {
        assetsDir: 'assets',
        rollupOptions: {
            output: {
                assetFileNames: 'assets/[name]-[hash][extname]'
            }
        }
    }
}
```

---

## 6. Router Implementation

### 6.1 Router Class

```javascript
class AppRouter {
    constructor() {
        this.currentFile = null;
        this.init();
    }
    
    init() {
        // Handle initial route
        this.handleRoute();
        
        // Listen for navigation
        window.addEventListener('popstate', () => this.handleRoute());
    }
    
    navigate(url, replace = false) {
        const method = replace ? 'replaceState' : 'pushState';
        history[method]({}, '', url);
        this.handleRoute();
    }
    
    handleRoute() {
        const path = window.location.pathname;
        
        // Special routes
        if (path === '/') return this.handleHome();
        if (path === '/auth/callback') return this.handleAuthCallback();
        if (path === '/new') return this.handleNew();
        if (path === '/t') return this.handleTemplates();
        if (path === '/s') return this.handleSettings();
        
        // File route: /d/{code}[.{slide}][{mode}][~{token}]
        const parsed = StoryUrl.parse(path);
        if (parsed) {
            return this.handleFile(parsed);
        }
        
        // Unknown route - go home
        this.navigate('/', true);
    }
    
    async handleFile({ fileCode, slide, mode, shareToken }) {
        // Validate share token if present
        if (shareToken) {
            const validation = await ShareTokenRegistry.validate(fileCode, shareToken);
            if (!validation.valid) {
                return this.showError(validation.reason);
            }
        }
        
        // Look up file
        const fileInfo = FileCodeRegistry.lookup(fileCode);
        if (!fileInfo) {
            return this.showError('file_not_found');
        }
        
        // Load file
        await app.openFile(fileInfo);
        
        // Apply state
        if (slide > 1) store.dispatch('GO_TO_SLIDE', slide);
        if (mode === 'present') store.dispatch('START_PRESENTATION');
        else if (mode === 'view') store.dispatch('SET_READ_ONLY', true);
    }
    
    // Update URL when state changes
    updateUrl(options = {}) {
        const code = this.currentFile?.code;
        if (!code) return;
        
        const url = StoryUrl.build({
            fileCode: code,
            slide: options.slide,
            mode: options.mode,
            shareToken: options.shareToken
        });
        
        history.replaceState({}, '', url);
    }
}
```

### 6.2 Integration with Store

```javascript
// Sync slide changes to URL
store.on('slide-changed', (slideIndex) => {
    router.updateUrl({ slide: slideIndex + 1 });
});

// Sync mode changes to URL  
store.on('mode-changed', (mode) => {
    router.updateUrl({ mode });
});
```

---

## 7. State Persistence

### 7.1 URL State Sync

The URL reflects the minimal required state:
- File code (always)
- Slide number (if not 1)
- Mode (if not edit)
- Share token (if shared link)
}
```

### 7.2 Page Reload Persistence

On page reload:
1. Parse current URL
2. Extract file ID from path
3. Load file from storage (local or cloud)
4. Apply URL state (slide, element, mode)

```javascript
async function restoreFromUrl() {
    const { fileId, mode, slide, element } = parseCurrentUrl();
    
    if (!fileId) return;
    
    // Look up file location
    const fileMapping = await getFileMapping(fileId);
    
    if (fileMapping) {
        // Cloud file
        await app.openCloudFile(fileMapping.provider, fileMapping.cloudId);
    } else {
        // Try local storage
        const localFile = await getLocalFile(fileId);
        if (localFile) {
            await app.loadPresentation(localFile);
        } else {
            // File not found
            router.navigate('/', true);
            return;
        }
    }
    
    // Apply state
    if (slide) store.dispatch('GO_TO_SLIDE', slide);
    if (element) store.dispatch('SELECT_ELEMENT', element);
    if (mode === 'presentation') store.dispatch('SET_MODE', 'presentation');
}
```

---

## 8. Share URL Generation

### 8.1 Share Link Types

| Type | URL | Access |
|------|-----|--------|
| Edit | `/d/{fileId}?token={token}` | Full edit access |
| View | `/d/{fileId}/preview?token={token}` | Read-only |
| Present | `/d/{fileId}/present?token={token}` | Presentation only |
| Embed | `/embed/{fileId}?token={token}` | Embeddable iframe |

### 8.2 Token Generation

```javascript
function generateShareToken(fileId, options = {}) {
    const payload = {
        fileId,
        access: options.access || 'view',
        expires: options.expires || null,
        createdBy: getCurrentUserId(),
        createdAt: Date.now()
    };
    
    // Sign with secret (server-side in production)
    return signPayload(payload);
}
```

### 8.3 Copy Share Link

```javascript
async function copyShareLink(fileId, options = {}) {
    const token = await generateShareToken(fileId, options);
    
    const url = router.fileUrl(fileId, {
        mode: options.mode || 'preview',
        token
    });
    
    const fullUrl = new URL(url, window.location.origin).href;
    
    await navigator.clipboard.writeText(fullUrl);
    
    return fullUrl;
}
```

---

## 9. Analytics Integration

### 9.1 Route Change Tracking

```javascript
router.on('route-change', (route, params, query) => {
    // Google Analytics 4
    gtag('event', 'page_view', {
        page_path: route,
        page_title: document.title,
        ...extractUtmParams(query)
    });
    
    // Custom analytics
    analytics.track('page_view', {
        route,
        fileId: params.fileId,
        mode: params.mode,
        referrer: query.ref,
        source: query.utm_source
    });
});
```

### 9.2 UTM Parameter Handling

```javascript
function extractUtmParams(query) {
    const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
    const params = {};
    
    for (const key of utmKeys) {
        if (query[key]) {
            params[key] = query[key];
        }
    }
    
    return params;
}

// Store UTM params in session for attribution
function storeUtmParams(query) {
    const utmParams = extractUtmParams(query);
    if (Object.keys(utmParams).length > 0) {
        sessionStorage.setItem('utm_params', JSON.stringify(utmParams));
    }
}
```

---

## 10. SEO Considerations

### 10.1 Meta Tags

```javascript
function updateMetaTags(file) {
    document.title = `${file.name} - Story`;
    
    // Open Graph
    updateMeta('og:title', file.name);
    updateMeta('og:description', file.description || 'Created with Story');
    updateMeta('og:image', file.thumbnailUrl);
    updateMeta('og:url', window.location.href);
    
    // Twitter
    updateMeta('twitter:card', 'summary_large_image');
    updateMeta('twitter:title', file.name);
}

function updateMeta(property, content) {
    let meta = document.querySelector(`meta[property="${property}"]`);
    if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('property', property);
        document.head.appendChild(meta);
    }
    meta.setAttribute('content', content);
}
```

### 10.2 Canonical URLs

```html
<link rel="canonical" href="https://story.app/d/{fileId}">
```

---

## 11. Implementation Checklist

### Phase 1: Foundation
- [ ] Add `<base href="/">` to index.html
- [ ] Convert all asset paths to absolute
- [ ] Create Router class
- [ ] Implement basic route matching
- [ ] Handle OAuth callback with proper redirect

### Phase 2: File Routing
- [ ] Implement file ID generation
- [ ] Create file ID to cloud mapping storage
- [ ] Implement `/d/{fileId}` route
- [ ] Add mode routes (edit, present, preview)
- [ ] Handle file not found gracefully

### Phase 3: State Sync
- [ ] Sync slide changes to URL hash
- [ ] Sync element selection to query params
- [ ] Restore state on page reload
- [ ] Handle browser back/forward

### Phase 4: Sharing
- [ ] Generate share tokens
- [ ] Create share URL builder
- [ ] Validate tokens on access
- [ ] Handle expired tokens

### Phase 5: Analytics
- [ ] Track route changes
- [ ] Extract and store UTM params
- [ ] Integrate with analytics provider

---

## 12. Migration Plan

### 12.1 Current State
- Single-page app with no routing
- OAuth callback causes asset path issues
- No file URLs (files opened via picker)

### 12.2 Migration Steps

1. **Add base href** (immediate fix for asset paths)
2. **Implement minimal router** (handle OAuth, basic navigation)
3. **Add file routes** (gradual rollout)
4. **Enable URL state sync** (after file routes stable)
5. **Add sharing features** (requires backend support)

### 12.3 Backward Compatibility

- Keep `/#` hash routes working during transition
- Redirect old patterns to new routes
- Maintain session storage for unsaved files

---

## Appendix A: URL Examples

```
# Dashboard
https://story.app/

# New presentation
https://story.app/new

# Edit file
https://story.app/d/Kx9mP2

# Edit file, slide 5
https://story.app/d/Kx9mP2.5

# Presentation mode
https://story.app/d/Kx9mP2p

# Presentation starting at slide 3
https://story.app/d/Kx9mP2.3p

# View-only mode
https://story.app/d/Kx9mP2v

# Shared link
https://story.app/d/Kx9mP2~sH7kL

# Shared presentation at slide 5
https://story.app/d/Kx9mP2.5p~sH7kL
```

**URL Length Comparison:**

| Scenario | Story | Figma |
|----------|-------|-------|
| Open file | 22 chars | ~80 chars |
| Slide 5 | 24 chars | ~95 chars |
| Present mode | 23 chars | ~90 chars |
| Shared link | 28 chars | ~120 chars |

---

## Appendix B: Error Handling

| Error | URL | Behavior |
|-------|-----|----------|
| File not found | `/d/Kx9mP2` | Redirect to `/` with toast |
| Invalid token | `/d/Kx9mP2~bad` | Show "Access Denied" page |
| Expired token | `/d/Kx9mP2~exp` | Show "Link Expired" page |
| Auth required | `/d/Kx9mP2` (private) | Redirect to sign-in, then back |
| 404 route | `/unknown` | Redirect to `/` |
