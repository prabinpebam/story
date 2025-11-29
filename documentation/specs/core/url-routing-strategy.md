# URL Routing Strategy Specification

## Executive Summary

This document defines the comprehensive URL routing strategy for Story, a cloud-based presentation application. The strategy ensures:
- Clean, shareable URLs for all application states
- Proper asset resolution regardless of route depth
- OAuth callback handling without breaking assets
- Deep linking to specific files, slides, and elements
- Analytics and tracking support
- SEO-friendly structure for public content

---

## 1. Industry Benchmarks

### 1.1 Figma URL Structure
```
https://www.figma.com/design/{fileKey}/{fileName}?node-id={nodeId}&t={shareToken}
https://www.figma.com/file/{fileKey}/{fileName}?node-id={nodeId}
https://www.figma.com/board/{fileKey}/{fileName}
https://www.figma.com/proto/{fileKey}?node-id={nodeId}  (Prototype view)
```

**Key Features:**
- File type in path (`/design/`, `/file/`, `/board/`, `/proto/`)
- Unique file key (shortened ID)
- Human-readable file name in URL (SEO)
- Node selection via query param
- Share tokens for access control
- Prototype mode as separate route

### 1.2 Google Slides URL Structure
```
https://docs.google.com/presentation/d/{fileId}/edit
https://docs.google.com/presentation/d/{fileId}/edit#slide=id.{slideId}
https://docs.google.com/presentation/d/{fileId}/present
https://docs.google.com/presentation/d/{fileId}/preview
https://docs.google.com/presentation/d/{fileId}/pub?start=true&loop=true
```

**Key Features:**
- Product type in path (`/presentation/`)
- Long file ID
- Mode as path segment (`/edit`, `/present`, `/preview`, `/pub`)
- Slide selection via hash fragment
- Publishing options via query params

### 1.3 Canva URL Structure
```
https://www.canva.com/design/{designId}/{designSlug}/edit
https://www.canva.com/design/{designId}/{designSlug}/view
https://www.canva.com/design/{designId}/{designSlug}/view?utm_content=...
```

**Key Features:**
- Design ID + slug pattern
- Mode in path
- UTM tracking in query params

### 1.4 Notion URL Structure
```
https://www.notion.so/{workspace}/{pageTitle}-{pageId}
https://www.notion.so/{pageTitle}-{pageId}#{blockId}
```

**Key Features:**
- Page title for SEO/readability
- Short page ID appended
- Block-level linking via hash

---

## 2. Story URL Structure

### 2.1 Route Hierarchy

```
/                                    # Home / Dashboard
├── /auth/callback                   # OAuth callback (internal)
├── /new                             # Create new presentation
├── /d/{fileId}                      # Open local/cloud file (edit mode)
│   ├── /d/{fileId}/edit             # Explicit edit mode
│   ├── /d/{fileId}/present          # Presentation mode
│   └── /d/{fileId}/preview          # Preview/read-only mode
├── /recent                          # Recent files list
├── /templates                       # Template gallery
└── /settings                        # User settings
```

### 2.2 File URL Format

```
/d/{fileId}[/{mode}][?params]#{fragment}
```

**Components:**

| Component | Description | Example |
|-----------|-------------|---------|
| `/d/` | Document prefix (short for readability) | `/d/` |
| `{fileId}` | Unique file identifier | `abc123xyz` |
| `{mode}` | Optional mode segment | `edit`, `present`, `preview` |
| `?params` | Query parameters | `?slide=2&utm_source=share` |
| `#{fragment}` | Hash fragment for in-page state | `#slide-2`, `#element-xyz` |

### 2.3 File ID Generation

**Format:** `{timestamp-base36}{random-base36}`

```javascript
function generateFileId() {
    const timestamp = Date.now().toString(36);  // ~8 chars
    const random = Math.random().toString(36).substring(2, 8); // 6 chars
    return `${timestamp}${random}`; // ~14 chars total
}

// Example: "lz5k8g2m4n7p3q"
```

**Properties:**
- Sortable by creation time (timestamp prefix)
- Collision-resistant (random suffix)
- URL-safe (base36)
- Reasonably short (~14 characters)

### 2.4 Cloud File Mapping

For cloud-stored files, maintain a mapping:

```javascript
{
    "lz5k8g2m4n7p3q": {
        "provider": "onedrive",
        "cloudId": "DriveItem.id",
        "path": "/Documents/Story/MyPresentation.str",
        "created": "2024-01-15T10:30:00Z"
    }
}
```

---

## 3. Query Parameters

### 3.1 Navigation Parameters

| Parameter | Description | Example |
|-----------|-------------|---------|
| `slide` | Current slide number (1-indexed) | `?slide=3` |
| `element` | Selected element ID | `?element=text-abc123` |
| `zoom` | Zoom level percentage | `?zoom=150` |
| `fit` | Fit mode | `?fit=width`, `?fit=page` |

### 3.2 Sharing Parameters

| Parameter | Description | Example |
|-----------|-------------|---------|
| `token` | Share access token | `?token=xyz789` |
| `access` | Access level hint | `?access=view`, `?access=comment` |
| `expires` | Expiration timestamp | `?expires=1735689600` |

### 3.3 Presentation Mode Parameters

| Parameter | Description | Example |
|-----------|-------------|---------|
| `autoplay` | Auto-advance slides | `?autoplay=true` |
| `interval` | Slide interval (seconds) | `?interval=5` |
| `loop` | Loop presentation | `?loop=true` |
| `start` | Starting slide | `?start=1` |

### 3.4 Tracking Parameters (UTM)

| Parameter | Description | Example |
|-----------|-------------|---------|
| `utm_source` | Traffic source | `?utm_source=twitter` |
| `utm_medium` | Marketing medium | `?utm_medium=social` |
| `utm_campaign` | Campaign name | `?utm_campaign=launch2024` |
| `utm_content` | Content identifier | `?utm_content=hero_cta` |
| `ref` | Referrer ID | `?ref=user123` |

---

## 4. Hash Fragments

Hash fragments provide instant navigation without page reload:

### 4.1 Slide Navigation
```
#slide-{number}        # By position: #slide-3
#slide-{id}           # By ID: #slide-abc123
```

### 4.2 Element Focus
```
#element-{id}         # Focus element: #element-text-xyz
#layer-{id}           # Expand layer in tree: #layer-group-abc
```

### 4.3 Panel State
```
#panel-properties     # Open properties panel
#panel-layers         # Open layers panel
#panel-comments       # Open comments panel
```

### 4.4 Modal State
```
#share                # Open share dialog
#export               # Open export dialog
#settings             # Open settings
```

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
        this.routes = new Map();
        this.currentRoute = null;
        this.params = {};
        this.query = {};
        this.hash = '';
        
        this.init();
    }
    
    init() {
        // Handle initial route
        this.handleRoute(window.location);
        
        // Listen for navigation
        window.addEventListener('popstate', (e) => {
            this.handleRoute(window.location);
        });
        
        // Intercept link clicks
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[href^="/"]');
            if (link && !link.hasAttribute('data-external')) {
                e.preventDefault();
                this.navigate(link.href);
            }
        });
    }
    
    navigate(url, replace = false) {
        const method = replace ? 'replaceState' : 'pushState';
        history[method]({}, '', url);
        this.handleRoute(new URL(url, window.location.origin));
    }
    
    handleRoute(location) {
        const path = location.pathname;
        this.query = Object.fromEntries(new URLSearchParams(location.search));
        this.hash = location.hash.slice(1);
        
        // Match route
        for (const [pattern, handler] of this.routes) {
            const match = this.matchRoute(pattern, path);
            if (match) {
                this.params = match;
                this.currentRoute = pattern;
                handler(match, this.query, this.hash);
                return;
            }
        }
        
        // 404 - redirect to home
        this.navigate('/', true);
    }
    
    matchRoute(pattern, path) {
        const patternParts = pattern.split('/');
        const pathParts = path.split('/');
        
        if (patternParts.length !== pathParts.length) {
            return null;
        }
        
        const params = {};
        
        for (let i = 0; i < patternParts.length; i++) {
            if (patternParts[i].startsWith(':')) {
                params[patternParts[i].slice(1)] = pathParts[i];
            } else if (patternParts[i] !== pathParts[i]) {
                return null;
            }
        }
        
        return params;
    }
    
    register(pattern, handler) {
        this.routes.set(pattern, handler);
    }
    
    // URL builders
    fileUrl(fileId, options = {}) {
        let url = `/d/${fileId}`;
        
        if (options.mode && options.mode !== 'edit') {
            url += `/${options.mode}`;
        }
        
        const params = new URLSearchParams();
        if (options.slide) params.set('slide', options.slide);
        if (options.token) params.set('token', options.token);
        
        const queryString = params.toString();
        if (queryString) url += `?${queryString}`;
        
        if (options.element) url += `#element-${options.element}`;
        else if (options.slideHash) url += `#slide-${options.slideHash}`;
        
        return url;
    }
}
```

### 6.2 Route Handlers

```javascript
// Initialize router
const router = new AppRouter();

// Home / Dashboard
router.register('/', () => {
    app.showDashboard();
});

// OAuth callback
router.register('/auth/callback', async () => {
    await handleAuthCallback();
    const returnUrl = getReturnUrl() || '/';
    router.navigate(returnUrl, true);
});

// New presentation
router.register('/new', () => {
    app.createNewPresentation();
    const fileId = generateFileId();
    router.navigate(`/d/${fileId}`, true);
});

// Open file (default to edit mode)
router.register('/d/:fileId', (params, query, hash) => {
    app.openFile(params.fileId, {
        mode: 'edit',
        slide: query.slide,
        element: hash?.startsWith('element-') ? hash.slice(8) : null
    });
});

// Explicit edit mode
router.register('/d/:fileId/edit', (params, query, hash) => {
    app.openFile(params.fileId, { mode: 'edit', ...query });
});

// Presentation mode
router.register('/d/:fileId/present', (params, query) => {
    app.openFile(params.fileId, {
        mode: 'presentation',
        autoplay: query.autoplay === 'true',
        start: parseInt(query.start) || 1
    });
});
```

---

## 7. State Persistence

### 7.1 URL State Sync

The URL should reflect application state for:
- Current file
- Current slide
- Selected element (optional)
- View mode
- Share context

```javascript
class URLStateSync {
    constructor(router, store) {
        this.router = router;
        this.store = store;
        
        // Sync store changes to URL
        store.on('slide-changed', (slideId) => {
            this.updateHash(`slide-${slideId}`);
        });
        
        store.on('selection-changed', (selection) => {
            if (selection.length === 1) {
                this.updateQuery({ element: selection[0] });
            } else {
                this.removeQuery('element');
            }
        });
    }
    
    updateHash(hash) {
        const url = new URL(window.location);
        url.hash = hash;
        history.replaceState({}, '', url);
    }
    
    updateQuery(params) {
        const url = new URL(window.location);
        for (const [key, value] of Object.entries(params)) {
            url.searchParams.set(key, value);
        }
        history.replaceState({}, '', url);
    }
    
    removeQuery(...keys) {
        const url = new URL(window.location);
        keys.forEach(key => url.searchParams.delete(key));
        history.replaceState({}, '', url);
    }
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
https://story.app/d/lz5k8g2m4n7p3q

# Edit file, specific slide
https://story.app/d/lz5k8g2m4n7p3q?slide=3

# Edit file, specific element
https://story.app/d/lz5k8g2m4n7p3q#element-text-abc123

# Presentation mode
https://story.app/d/lz5k8g2m4n7p3q/present

# Presentation with autoplay
https://story.app/d/lz5k8g2m4n7p3q/present?autoplay=true&interval=5

# Preview mode with share token
https://story.app/d/lz5k8g2m4n7p3q/preview?token=abc123xyz

# Shared with tracking
https://story.app/d/lz5k8g2m4n7p3q?token=abc123xyz&utm_source=email&utm_campaign=q1_2024
```

---

## Appendix B: Error Handling

| Error | URL | Behavior |
|-------|-----|----------|
| File not found | `/d/invalid` | Redirect to `/` with toast |
| Invalid token | `/d/xyz?token=bad` | Show "Access Denied" page |
| Expired token | `/d/xyz?token=expired` | Show "Link Expired" page |
| Auth required | `/d/xyz` (private) | Redirect to sign-in, then back |
| 404 route | `/unknown/path` | Redirect to `/` |
