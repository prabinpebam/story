# URL Routing Strategy Specification

## Executive Summary

Story uses **globally resolvable URLs** that encode the cloud provider and file ID directly in the URL. This ensures URLs work for anyone, anywhere - no local storage dependencies. Authentication determines access, not URL validity.

**Example URLs:**
```
story.app/d/o/MDFBQkNE                     # OneDrive file (minimal)
story.app/d/o/MDFBQkNE/Q4-Report           # With readable name
story.app/d/o/MDFBQkNE/Q4-Report.5p        # Slide 5, presentation mode
story.app/d/g/MUJ4aU1WczBYUkE1/Annual-Plan # Google Drive file
```

**Key Properties:**
- ✅ **Universally resolvable** - works for anyone with access
- ✅ **No server registry needed** - file reference encoded in URL
- ✅ **Human-readable** - optional slug for clarity
- ✅ **Reasonably short** - ~35-45 chars (vs Figma's 100+)

**Comparison:**
| App | URL Length | Example |
|-----|------------|---------|
| Figma | ~120 chars | `figma.com/design/AbCdEf123456/My-Design?node-id=1234%3A5678&t=...` |
| Google Slides | ~90 chars | `docs.google.com/presentation/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit#slide=id.g123` |
| **Story** | **~40 chars** | `story.app/d/o/MDFBQkNE/Q4-Report.5p` |

---

## 1. URL Structure

### 1.1 Format

```
/d/{provider}/{encodedId}[/{slug}][.{slide}][{mode}]
```

| Part | Chars | Description | Example |
|------|-------|-------------|---------|
| `/d/` | 3 | Document prefix | `/d/` |
| `{provider}` | 1 | Cloud provider code | `o`, `g`, `d`, `l` |
| `{encodedId}` | 10-25 | Base64URL encoded cloud ID | `MDFBQkNERUY` |
| `/{slug}` | 0-50 | Optional human-readable name | `/Q4-Report` |
| `.{slide}` | 1-4 | Optional slide number | `.5`, `.15` |
| `{mode}` | 0-1 | Optional mode flag | `p`, `v`, `r` |

### 1.2 Provider Codes

| Code | Provider | ID Format |
|------|----------|-----------|
| `o` | OneDrive | `driveItem.id` (typically 20+ chars) |
| `g` | Google Drive | File ID (typically 33 chars) |
| `d` | Dropbox | `id:xxx` format |
| `l` | Local | FileSystem Access API handle reference |

### 1.3 URL Examples

```
# Basic file URLs
/d/o/MDFBQkNERUY                          # OneDrive file
/d/g/MUJ4aU1WczBYUkE1bkZNZEt2             # Google Drive file
/d/d/aWQ6YWJjMTIzZGVm                      # Dropbox file

# With human-readable slug (ignored for routing)
/d/o/MDFBQkNERUY/Q4-Financial-Report      # Same file, readable URL
/d/o/MDFBQkNERUY/My-Presentation          # Slug can be anything

# With slide number
/d/o/MDFBQkNERUY/Q4-Report.5              # Slide 5
/d/o/MDFBQkNERUY.5                         # Slide 5 (no slug)

# With mode
/d/o/MDFBQkNERUY/Q4-Report.5p             # Slide 5, presentation mode
/d/o/MDFBQkNERUYp                          # Presentation mode (slide 1)
/d/o/MDFBQkNERUYv                          # View-only mode

# Full example
/d/o/MDFBQkNERUY/Q4-Report.5p             # OneDrive, Q4 Report, slide 5, presenting
```

### 1.4 Special Routes

```
/                            # Home / Dashboard
/auth/callback               # OAuth callback (internal)
/new                         # Create new presentation
/t                           # Templates
/s                           # Settings
```

---

## 2. Encoding System

### 2.1 Base64URL Encoding

Use URL-safe Base64 (no `+`, `/`, or `=` padding):

```javascript
class UrlCodec {
    /**
     * Encode string to URL-safe Base64
     */
    static encode(str) {
        const base64 = btoa(unescape(encodeURIComponent(str)));
        return base64
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');
    }
    
    /**
     * Decode URL-safe Base64 to string
     */
    static decode(encoded) {
        // Add back padding if needed
        const padded = encoded + '==='.slice(0, (4 - encoded.length % 4) % 4);
        const base64 = padded.replace(/-/g, '+').replace(/_/g, '/');
        return decodeURIComponent(escape(atob(base64)));
    }
}

// Examples:
UrlCodec.encode('01ABCDEF123456789');  // → 'MDFBQkNERUYxMjM0NTY3ODk'
UrlCodec.decode('MDFBQkNERUYxMjM0NTY3ODk');  // → '01ABCDEF123456789'
```

### 2.2 Provider Mapping

```javascript
const PROVIDERS = {
    o: 'onedrive',
    g: 'googledrive', 
    d: 'dropbox',
    l: 'local'
};

const PROVIDER_CODES = {
    onedrive: 'o',
    googledrive: 'g',
    dropbox: 'd',
    local: 'l'
};
```

### 2.3 Slug Generation

```javascript
function slugify(name) {
    return name
        .toLowerCase()
        .replace(/\.story$/, '')           // Remove extension
        .replace(/[^a-z0-9]+/g, '-')        // Replace non-alphanumeric with dash
        .replace(/^-+|-+$/g, '')            // Trim dashes
        .substring(0, 50);                   // Limit length
}

// Examples:
slugify('Q4 Financial Report.story');  // → 'q4-financial-report'
slugify('My Awesome Presentation');     // → 'my-awesome-presentation'
```

---

## 3. URL Builder & Parser

### 3.1 StoryUrl Class

```javascript
class StoryUrl {
    /**
     * Build a Story URL from file info
     */
    static build({ provider, cloudId, name = null, slide = null, mode = null }) {
        const providerCode = PROVIDER_CODES[provider];
        if (!providerCode) throw new Error(`Unknown provider: ${provider}`);
        
        const encodedId = UrlCodec.encode(cloudId);
        
        let url = `/d/${providerCode}/${encodedId}`;
        
        // Add optional slug for readability
        if (name) {
            url += `/${slugify(name)}`;
        }
        
        // Add slide number (only if > 1 or if mode specified)
        if (slide && slide > 1) {
            url += `.${slide}`;
        } else if (slide === 1 && mode) {
            url += '.1';
        }
        
        // Add mode flag
        if (mode === 'present') url += 'p';
        else if (mode === 'view') url += 'v';
        else if (mode === 'preview') url += 'r';
        
        return url;
    }
    
    /**
     * Parse a Story URL
     */
    static parse(pathname) {
        // Pattern: /d/{provider}/{encodedId}[/{slug}][.{slide}][{mode}]
        const match = pathname.match(
            /^\/d\/([ogdl])\/([A-Za-z0-9_-]+)(?:\/([^/.]+))?(?:\.(\d+))?([pvr])?$/
        );
        
        if (!match) return null;
        
        const [, providerCode, encodedId, slug, slideStr, modeChar] = match;
        
        return {
            provider: PROVIDERS[providerCode],
            cloudId: UrlCodec.decode(encodedId),
            slug: slug || null,
            slide: slideStr ? parseInt(slideStr, 10) : 1,
            mode: { p: 'present', v: 'view', r: 'preview' }[modeChar] || 'edit'
        };
    }
    
    /**
     * Update current URL with new state (preserves file reference)
     */
    static updateState({ slide = null, mode = null }) {
        const current = this.parse(window.location.pathname);
        if (!current) return;
        
        const newUrl = this.build({
            provider: current.provider,
            cloudId: current.cloudId,
            name: current.slug,
            slide,
            mode
        });
        
        history.replaceState({}, '', newUrl);
    }
}
```

### 3.2 Usage Examples

```javascript
// Build URLs
StoryUrl.build({
    provider: 'onedrive',
    cloudId: '01ABCDEF123456789',
    name: 'Q4 Report'
});
// → '/d/o/MDFBQkNERUYxMjM0NTY3ODk/q4-report'

StoryUrl.build({
    provider: 'onedrive', 
    cloudId: '01ABCDEF123456789',
    name: 'Q4 Report',
    slide: 5,
    mode: 'present'
});
// → '/d/o/MDFBQkNERUYxMjM0NTY3ODk/q4-report.5p'

// Parse URLs
StoryUrl.parse('/d/o/MDFBQkNERUYxMjM0NTY3ODk/q4-report.5p');
// → {
//     provider: 'onedrive',
//     cloudId: '01ABCDEF123456789',
//     slug: 'q4-report',
//     slide: 5,
//     mode: 'present'
// }
```

---

## 4. Router Implementation

### 4.1 Router Class

```javascript
class AppRouter {
    constructor() {
        this.currentFile = null;
        this.init();
    }
    
    init() {
        this.handleRoute();
        window.addEventListener('popstate', () => this.handleRoute());
    }
    
    navigate(url, replace = false) {
        history[replace ? 'replaceState' : 'pushState']({}, '', url);
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
        
        // File route
        const parsed = StoryUrl.parse(path);
        if (parsed) {
            return this.handleFile(parsed);
        }
        
        // Unknown route - go home
        this.navigate('/', true);
    }
    
    async handleFile({ provider, cloudId, slug, slide, mode }) {
        try {
            // Get cloud provider service
            const cloudService = getCloudService(provider);
            
            // Check if user is authenticated with this provider
            if (!cloudService.isAuthenticated()) {
                // Store return URL and redirect to auth
                sessionStorage.setItem('returnUrl', window.location.href);
                return cloudService.authenticate();
            }
            
            // Fetch and open the file
            const file = await cloudService.getFile(cloudId);
            
            if (!file) {
                return this.showError('file_not_found');
            }
            
            // Check access permissions
            if (!file.canAccess) {
                return this.showError('access_denied');
            }
            
            // Load the file
            await app.openCloudFile(provider, cloudId, file);
            this.currentFile = { provider, cloudId, name: file.name };
            
            // Update URL with correct name if slug was wrong/missing
            if (slug !== slugify(file.name)) {
                const correctUrl = StoryUrl.build({
                    provider, cloudId, 
                    name: file.name,
                    slide, mode
                });
                history.replaceState({}, '', correctUrl);
            }
            
            // Apply navigation state
            if (slide > 1) store.dispatch('GO_TO_SLIDE', slide);
            if (mode === 'present') store.dispatch('START_PRESENTATION');
            else if (mode === 'view') store.dispatch('SET_READ_ONLY', true);
            
        } catch (error) {
            console.error('Failed to open file:', error);
            this.showError('load_failed');
        }
    }
    
    async handleAuthCallback() {
        await handleOAuthCallback();
        const returnUrl = sessionStorage.getItem('returnUrl') || '/';
        sessionStorage.removeItem('returnUrl');
        this.navigate(returnUrl, true);
    }
    
    showError(type) {
        const messages = {
            file_not_found: 'This file could not be found.',
            access_denied: 'You don\'t have permission to access this file.',
            load_failed: 'Failed to load the file. Please try again.'
        };
        app.showErrorPage(messages[type] || 'An error occurred.');
    }
}
```

### 4.2 URL Updates on Navigation

```javascript
// When user navigates to a different slide
store.on('slide-changed', (slideIndex) => {
    if (!router.currentFile) return;
    
    StoryUrl.updateState({ 
        slide: slideIndex + 1,
        mode: store.getState().mode 
    });
});

// When user enters/exits presentation mode
store.on('mode-changed', (mode) => {
    if (!router.currentFile) return;
    
    StoryUrl.updateState({ 
        slide: store.getState().currentSlide + 1,
        mode 
    });
});

// When opening a file (update URL)
async function openFile(provider, cloudId, file) {
    const url = StoryUrl.build({
        provider,
        cloudId,
        name: file.name
    });
    router.navigate(url);
}
```

---

## 5. Access Control Flow

### 5.1 Authentication Flow

```
User clicks URL: story.app/d/o/MDFBQkNE/Report.5p
                              ↓
                    Parse URL → provider: onedrive
                              ↓
              Is user authenticated with OneDrive?
                    ↓                    ↓
                   YES                   NO
                    ↓                    ↓
            Fetch file from         Save returnUrl
            OneDrive API            Redirect to OAuth
                    ↓                    ↓
           Can user access?         OAuth callback
                    ↓                    ↓
           YES           NO         Restore returnUrl
            ↓             ↓              ↓
         Load file   Show error    Back to step 1
            ↓
     Go to slide 5, start presenting
```

### 5.2 Permission Handling

```javascript
async function checkFileAccess(provider, cloudId) {
    const cloudService = getCloudService(provider);
    
    try {
        const file = await cloudService.getFile(cloudId);
        
        return {
            exists: true,
            canRead: file.permissions.includes('read'),
            canWrite: file.permissions.includes('write'),
            canShare: file.permissions.includes('share'),
            owner: file.owner,
            sharedWith: file.sharedWith
        };
    } catch (error) {
        if (error.status === 404) {
            return { exists: false };
        }
        if (error.status === 403) {
            return { exists: true, canRead: false };
        }
        throw error;
    }
}
```

---

## 6. Share Links

### 6.1 Sharing via Cloud Provider

Since the URL contains the cloud file ID, sharing uses the provider's native sharing:

```javascript
async function shareFile(provider, cloudId, options = {}) {
    const cloudService = getCloudService(provider);
    
    // Create share link via provider's API
    const shareLink = await cloudService.createShareLink(cloudId, {
        access: options.access || 'view',  // 'view', 'edit'
        expires: options.expires,
        password: options.password
    });
    
    // The share link is the provider's link, OR our link
    // Our link works if user authenticates
    const storyUrl = StoryUrl.build({ provider, cloudId, name: options.name });
    const fullUrl = new URL(storyUrl, window.location.origin).href;
    
    return {
        providerLink: shareLink.webUrl,  // Native provider sharing page
        storyLink: fullUrl                // Direct Story link
    };
}
```

### 6.2 Share Flow

1. User clicks "Share" in Story
2. Story opens provider's sharing dialog OR updates permissions via API
3. Story generates the shareable URL: `story.app/d/o/MDFBQkNE/Report`
4. Recipient clicks link
5. Recipient authenticates with their account (if needed)
6. Cloud provider checks if recipient has access
7. File loads (or shows "Access Denied")

---

## 7. Local Files

### 7.1 Local File URLs

For local files (via File System Access API), we can't use cloud IDs. Options:

**Option A: Ephemeral URL (current session only)**
```
/d/l/session-123/My-Presentation
```
The session ID maps to a FileSystemHandle stored in memory. URL only works in current tab.

**Option B: IndexedDB persistence**
```
/d/l/abc123/My-Presentation  
```
Store FileSystemHandle in IndexedDB. URL works across sessions (with permission re-prompt).

**Option C: No URL for local files**
```
/  (always return to home for local files)
```
Local files don't get URLs - only cloud files are linkable.

### 7.2 Recommended: Hybrid

```javascript
class LocalFileRegistry {
    static DB_NAME = 'story-local-files';
    
    /**
     * Store a file handle and get a reference ID
     */
    static async register(handle, name) {
        const id = crypto.randomUUID().substring(0, 8);
        
        // Store in IndexedDB
        const db = await this.getDB();
        await db.put('handles', { id, handle, name, created: Date.now() });
        
        return id;
    }
    
    /**
     * Retrieve a file handle by ID
     */
    static async getHandle(id) {
        const db = await this.getDB();
        const record = await db.get('handles', id);
        
        if (!record) return null;
        
        // Verify permission
        const permission = await record.handle.queryPermission({ mode: 'readwrite' });
        if (permission !== 'granted') {
            // Request permission
            const result = await record.handle.requestPermission({ mode: 'readwrite' });
            if (result !== 'granted') return null;
        }
        
        return record.handle;
    }
}
```

Local file URL format:
```
/d/l/a1b2c3d4/My-Presentation.5p
```

---

## 8. Asset Path Resolution

### 8.1 Problem

Nested routes break relative asset paths:
```
Route: /d/o/MDFBQkNE/Report
Asset: assets/logo.png
Resolved: /d/o/MDFBQkNE/assets/logo.png ❌
```

### 8.2 Solution

All asset paths must be absolute:

```html
<!-- index.html -->
<link rel="icon" href="/assets/story.png">
<link rel="stylesheet" href="/styles/main.css">
<script type="module" src="/src/main.js"></script>
```

```javascript
// JavaScript
const logo = '/assets/story.png';  // ✅ Absolute
const logo = 'assets/story.png';   // ❌ Relative
```

---

## 9. URL Length Analysis

### 9.1 Component Breakdown

| Component | Length | Example |
|-----------|--------|---------|
| Domain | ~15 | `story.app/d/` |
| Provider | 2 | `o/` |
| Encoded ID | 15-30 | `MDFBQkNERUYxMjM0NTY` |
| Slug | 0-50 | `/q4-financial-report` |
| State | 0-5 | `.5p` |

### 9.2 Typical Lengths

| Scenario | URL | Length |
|----------|-----|--------|
| Minimal | `/d/o/MDFBQkNERUY` | ~20 |
| With slug | `/d/o/MDFBQkNERUY/report` | ~30 |
| With state | `/d/o/MDFBQkNERUY/report.5p` | ~35 |
| Long name | `/d/o/MDFBQkNERUY/q4-financial-report-draft` | ~50 |

### 9.3 Comparison

| App | Typical Length |
|-----|----------------|
| **Story** | **30-45 chars** |
| Figma | 100-130 chars |
| Google Slides | 85-100 chars |
| Canva | 70-90 chars |

---

## 10. Implementation Checklist

### Phase 1: Foundation ✅ (Done)
- [x] Absolute asset paths in index.html
- [x] Absolute asset paths in JavaScript

### Phase 2: URL System
- [ ] Implement `UrlCodec` class
- [ ] Implement `StoryUrl` class
- [ ] Implement `AppRouter` class
- [ ] Handle OAuth callback redirect

### Phase 3: File Routing
- [ ] Parse file URLs on load
- [ ] Authenticate with correct provider
- [ ] Fetch and open file from cloud
- [ ] Update URL on file open
- [ ] Handle file not found / access denied

### Phase 4: State Sync
- [ ] Update URL on slide change
- [ ] Update URL on mode change
- [ ] Restore state on page load
- [ ] Handle browser back/forward

### Phase 5: Local Files
- [ ] Implement LocalFileRegistry
- [ ] Store FileSystemHandles in IndexedDB
- [ ] Handle permission re-prompts

---

## Appendix A: URL Examples

```
# Dashboard
https://story.app/

# OneDrive file
https://story.app/d/o/MDFBQkNERUYxMjM0NTY3ODk/q4-report

# Google Drive file  
https://story.app/d/g/MUJ4aU1WczBYUkE1bkZNZEt2QmRCWmpnbVVVcXB0bGJz/annual-plan

# Dropbox file
https://story.app/d/d/aWQ6YWJjMTIzZGVmNDU2/budget-2024

# Local file
https://story.app/d/l/a1b2c3d4/my-presentation

# With slide number
https://story.app/d/o/MDFBQkNERUY/report.5

# Presentation mode
https://story.app/d/o/MDFBQkNERUY/report.5p

# View-only mode
https://story.app/d/o/MDFBQkNERUYv
```

---

## Appendix B: Error Handling

| Error | Cause | User Experience |
|-------|-------|-----------------|
| `file_not_found` | File deleted or ID invalid | "This file no longer exists" |
| `access_denied` | User lacks permission | "Request access" button |
| `auth_required` | Not signed in to provider | Redirect to OAuth flow |
| `provider_error` | API error from provider | "Try again later" |
| `invalid_url` | Malformed URL | Redirect to home |

---

## Appendix C: Security Considerations

1. **Cloud IDs are not secret** - They're exposed in the URL, but access is controlled by the provider
2. **OAuth scopes** - Only request minimum necessary permissions
3. **No sensitive data in URL** - Passwords, tokens go in headers/body
4. **HTTPS required** - All URLs must use HTTPS in production
5. **CSP headers** - Restrict script sources to prevent XSS
