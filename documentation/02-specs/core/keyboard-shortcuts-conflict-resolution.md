# Keyboard Shortcuts - Browser Conflict Resolution

## Overview

Web applications face unique challenges with keyboard shortcuts due to browser default behaviors. This document provides a comprehensive strategy for preventing conflicts and ensuring shortcuts work reliably.

Canonical ledger: `documentation/02-specs/core/keyboard-shortcuts-ledger.md`


## 1. Browser Conflicts & Prevention

### 1.1 Critical Browser Shortcuts (DO NOT OVERRIDE)

These shortcuts should **NEVER** be prevented as they're essential browser functions:

| Shortcut | Browser Action | Strategy |
|----------|---------------|----------|
| `Ctrl/Cmd+Q` | Quit browser | ❌ Never intercept |
| `Cmd+H` | Hide app (macOS) | ❌ Never intercept |
| `Ctrl/Cmd+W` | Close tab | ❌ Never intercept |
| `Ctrl/Cmd+T` | New tab | ❌ Never intercept |
| `Ctrl/Cmd+Shift+T` | Reopen tab | ❌ Never intercept |
| `Ctrl/Cmd+Tab` | Switch tabs | ❌ Never intercept |
| `Ctrl/Cmd+R` | Reload page | ❌ Never intercept (except in specific contexts) |
| `F5` | Reload | ❌ Never intercept |
| `F11` | Fullscreen | ❌ Never intercept |
| `F12` | DevTools | ❌ Never intercept |
| `Ctrl/Cmd+U` | View source | ❌ Never intercept |
| `Ctrl+H` | History (Windows/Linux) | ❌ Never intercept |
| `Ctrl/Cmd+P` | Print | ⚠️ Context-aware (allow in presentation mode) |

### 1.2 Conditional Browser Shortcuts (CONTEXT-AWARE)

These can be overridden in specific contexts:

| Shortcut | Browser Action | Our Action | Prevention Strategy |
|----------|---------------|------------|---------------------|
| `Ctrl/Cmd+F` | Find in page | Search in app | ✅ preventDefault() in canvas context |
| `Ctrl/Cmd+L` | Focus address bar | (No default binding) | ❌ avoid binding |
| `Ctrl/Cmd+K` | Browser search | (No default binding) | ❌ avoid binding |
| `Ctrl/Cmd+D` | Bookmark | Duplicate | ✅ preventDefault() always |
| `Ctrl/Cmd+B` | Bookmarks bar | Bold (text) | ✅ preventDefault() in text-editing |
| `Ctrl/Cmd+I` | DevTools | Italic (text) | ✅ preventDefault() in text-editing |
| `Backspace` | Navigate back | Delete | ✅ preventDefault() when not in input |
| `Space` | Scroll down | Pan tool | ✅ preventDefault() when not in input |

### 1.3 Safe Shortcuts (NO CONFLICTS)

These have no browser conflicts:

```
Single keys: V, H, T, R, O, L (no browser action)
Modifiers + numbers: avoid Ctrl/Cmd+1..9 (tab switching)
Modifiers + symbols: Ctrl/Cmd+]/[ and Ctrl/Cmd+Shift+]/[ are generally safe
Alt+Shift+letter: generally safe but reserve for Story-specific panels only
```

---

## 2. Prevention Strategy

### 2.1 Event Prevention Pattern

```javascript
class KeyboardManager {
    handleKeyEvent(event) {
        // 1. Check if we should handle this shortcut
        const shortcut = this.findShortcut(event);
        if (!shortcut) return; // Not our shortcut, let browser handle
        
        // 2. Check if it's a critical browser shortcut
        if (this.isCriticalBrowserShortcut(event)) {
            return; // Never prevent critical shortcuts
        }
        
        // 3. Check context
        if (!this.isValidContext(shortcut, event)) {
            return; // Wrong context, let browser handle
        }
        
        // 4. Prevent default BEFORE executing
        event.preventDefault();
        event.stopPropagation();
        
        // 5. Execute our handler
        shortcut.handler(event);
    }
    
    isCriticalBrowserShortcut(event) {
        const key = event.key.toLowerCase();
        const ctrl = event.ctrlKey || event.metaKey;
        const shift = event.shiftKey;
        
        // Critical shortcuts (never prevent)
        if (ctrl && key === 'q') return true; // Quit
        if (ctrl && key === 'w') return true; // Close tab
        if (ctrl && key === 't' && !shift) return true; // New tab
        if (ctrl && shift && key === 't') return true; // Reopen tab
        if (ctrl && key === 'tab') return true; // Switch tabs
        if (key === 'f5') return true; // Reload
        if (key === 'f11') return true; // Fullscreen
        if (key === 'f12') return true; // DevTools
        if (ctrl && key === 'u') return true; // View source
        
        return false;
    }
}
```

### 2.2 Whitelist Approach

```javascript
// Only prevent shortcuts we explicitly handle
const HANDLED_SHORTCUTS = new Set([
    'v', 'h', 'r', 't', 'o', 'l', 'p', 'f', 'k', 'i',    // Tools
    'ctrl+s', 'ctrl+shift+s',                             // Save
    'ctrl+z', 'ctrl+shift+z', 'ctrl+y',                   // Undo/Redo
    'ctrl+c', 'ctrl+x', 'ctrl+v',                         // Clipboard
    'ctrl+d',                                              // Duplicate
    'ctrl+g', 'ctrl+shift+g',                             // Group
    'ctrl+]', 'ctrl+[',                                    // Arrange
    'ctrl+alt+]', 'ctrl+alt+[',                           // Front/Back
    'delete', 'backspace',                                 // Delete
    'escape',                                              // Cancel
    'space',                                               // Pan (context)
    // ... etc
]);

handleKeyEvent(event) {
    const shortcutStr = eventToShortcut(event);
    
    if (HANDLED_SHORTCUTS.has(shortcutStr)) {
        // Only prevent if it's our shortcut
        event.preventDefault();
        event.stopPropagation();
        this.executeShortcut(shortcutStr, event);
    }
    // Otherwise, let browser handle it
}
```

### 2.3 Context-Based Prevention

```javascript
shouldPreventDefault(event, context) {
    const shortcutStr = eventToShortcut(event);
    
    // Critical shortcuts - never prevent
    if (this.isCriticalBrowserShortcut(event)) {
        return false;
    }
    
    // Context-specific decisions
    switch (context) {
        case 'text-editing':
            // Prevent text formatting, allow browser clipboard
            return ['ctrl+b', 'ctrl+i', 'ctrl+u'].includes(shortcutStr);
            
        case 'canvas':
            // Prevent most shortcuts
            return HANDLED_SHORTCUTS.has(shortcutStr);
            
        case 'presentation':
            // Prevent navigation keys, allow Cmd+P (print)
            return ['space', 'arrowleft', 'arrowright'].includes(shortcutStr);
            
        case 'modal':
            // Only prevent Escape
            return shortcutStr === 'escape';
            
        default:
            return false;
    }
}
```

---

## 3. Browser-Specific Issues

### 3.1 Chrome/Edge

**Issues:**
- `Ctrl+D` triggers bookmark dialog (Windows)
- `Ctrl+H` opens history (Windows)
- `Backspace` navigates back (if not in input)

**Solution:**
```javascript
// Always preventDefault for these
const CHROME_CONFLICTS = ['ctrl+d', 'ctrl+h', 'backspace'];

if (isChrome() && CHROME_CONFLICTS.includes(shortcutStr)) {
    event.preventDefault();
}
```

### 3.2 Firefox

**Issues:**
- `Ctrl+K` focuses search bar
- `Ctrl+L` focuses address bar
- `Ctrl+T` opens new tab (can't be prevented)

**Solution:**
```javascript
// Prevent in canvas context only
if (isFirefox() && context === 'canvas') {
    if (['ctrl+k', 'ctrl+l'].includes(shortcutStr)) {
        event.preventDefault();
    }
}
```

### 3.3 Safari

**Issues:**
- `Cmd+L` focuses address bar (Mac only)
- Some shortcuts require more aggressive preventDefault
- `Cmd+,` opens preferences

**Solution:**
```javascript
if (isSafari()) {
    // Prevent more aggressively
    if (context === 'canvas' && event.metaKey) {
        if (['l', 'k', 'd'].includes(event.key.toLowerCase())) {
            event.preventDefault();
        }
    }
}
```

---

## 4. Input Field Protection

### 4.1 Detect Input Context

```javascript
function isInputActive() {
    const el = document.activeElement;
    const tagName = el.tagName.toLowerCase();
    
    return (
        tagName === 'input' ||
        tagName === 'textarea' ||
        el.isContentEditable ||
        el.hasAttribute('contenteditable')
    );
}
```

### 4.2 Input-Safe Shortcuts

These should **always work**, even in input fields:

```javascript
const INPUT_SAFE_SHORTCUTS = [
    'ctrl+s',      // Save
    'ctrl+shift+s', // Save as
    'ctrl+z',      // Undo
    'ctrl+shift+z', // Redo
    'ctrl+y',      // Redo
    'escape'       // Cancel
];

handleKeyEvent(event) {
    const shortcutStr = eventToShortcut(event);
    
    if (isInputActive()) {
        // Only allow input-safe shortcuts
        if (INPUT_SAFE_SHORTCUTS.includes(shortcutStr)) {
            event.preventDefault();
            this.executeShortcut(shortcutStr, event);
        }
        // Otherwise, let input handle it
        return;
    }
    
    // Normal handling for non-input context
    // ...
}
```

---

## 5. Conflict Detection System

### 5.1 Runtime Conflict Detection

```javascript
class ConflictDetector {
    constructor() {
        this.browserShortcuts = this.detectBrowserShortcuts();
        this.appShortcuts = new Set();
    }
    
    /**
     * Detect which browser shortcuts are active
     * (varies by browser, platform, and extensions)
     */
    async detectBrowserShortcuts() {
        const shortcuts = new Set();
        const testKeys = [
            'ctrl+d', 'ctrl+h', 'ctrl+k', 'ctrl+l',
            'ctrl+b', 'ctrl+i', 'ctrl+f', 'ctrl+p'
        ];
        
        for (const shortcut of testKeys) {
            if (await this.testShortcut(shortcut)) {
                shortcuts.add(shortcut);
            }
        }
        
        return shortcuts;
    }
    
    /**
     * Test if a shortcut triggers browser action
     */
    async testShortcut(shortcut) {
        return new Promise((resolve) => {
            let prevented = false;
            
            const handler = (e) => {
                if (eventToShortcut(e) === shortcut) {
                    e.preventDefault();
                    prevented = true;
                }
            };
            
            document.addEventListener('keydown', handler, { once: true });
            
            // Simulate keypress (if possible)
            // In practice, this would be done during app initialization
            // by asking user to press shortcuts
            
            setTimeout(() => {
                document.removeEventListener('keydown', handler);
                resolve(prevented);
            }, 100);
        });
    }
    
    /**
     * Check for conflicts when registering shortcuts
     */
    checkConflict(shortcut) {
        if (this.browserShortcuts.has(shortcut)) {
            console.warn(
                `⚠️ Shortcut conflict detected: ${shortcut} is used by browser`
            );
            return {
                hasConflict: true,
                type: 'browser',
                recommendation: this.getAlternativeShortcut(shortcut)
            };
        }
        
        if (this.appShortcuts.has(shortcut)) {
            console.warn(
                `⚠️ Shortcut conflict detected: ${shortcut} already registered`
            );
            return {
                hasConflict: true,
                type: 'app',
                recommendation: null
            };
        }
        
        return { hasConflict: false };
    }
    
    getAlternativeShortcut(shortcut) {
        const alternatives = {
            'ctrl+d': 'ctrl+alt+d',
            'ctrl+h': 'h', // Single key
            'ctrl+k': 'k',
            'ctrl+l': 'l',
            'ctrl+b': 'ctrl+shift+b',
            'ctrl+i': 'ctrl+shift+i'
        };
        
        return alternatives[shortcut] || null;
    }
}
```

### 5.2 User Notification

```javascript
function notifyConflict(shortcut, conflict) {
    const message = conflict.type === 'browser'
        ? `The shortcut "${shortcut}" may conflict with browser actions.`
        : `The shortcut "${shortcut}" is already in use.`;
    
    const recommendation = conflict.recommendation
        ? `\n\nTry using "${conflict.recommendation}" instead.`
        : '';
    
    showToast({
        type: 'warning',
        message: message + recommendation,
        duration: 5000,
        action: {
            label: 'Settings',
            callback: () => openShortcutSettings()
        }
    });
}
```

---

## 6. Fallback Strategies

### 6.1 Progressive Enhancement

```javascript
class ShortcutManager {
    register(shortcut, handler, options = {}) {
        const conflict = this.conflictDetector.checkConflict(shortcut.key);
        
        if (conflict.hasConflict) {
            if (options.fallback) {
                // Use fallback shortcut
                console.log(`Using fallback: ${options.fallback}`);
                this.register(
                    { ...shortcut, key: options.fallback },
                    handler,
                    { ...options, fallback: null }
                );
                return;
            }
            
            if (options.required) {
                // Show warning but register anyway
                notifyConflict(shortcut.key, conflict);
            } else {
                // Skip registration
                console.warn(`Skipping shortcut: ${shortcut.key}`);
                return;
            }
        }
        
        // Register shortcut
        this.shortcuts.set(shortcut.key, handler);
    }
}

// Usage
shortcutManager.register(
    { key: 'ctrl+d', description: 'Duplicate' },
    () => duplicate(),
    {
        fallback: 'ctrl+shift+d',  // Use if Ctrl+D conflicts
        required: true              // Show warning if no fallback works
    }
);
```

### 6.2 Dynamic Shortcut Adjustment

```javascript
function optimizeShortcuts() {
    const browser = detectBrowser();
    const platform = detectPlatform();
    
    // Adjust shortcuts based on environment
    if (browser === 'chrome' && platform === 'windows') {
        // Chrome on Windows: Ctrl+D conflicts
        shortcutManager.remap('ctrl+d', 'ctrl+shift+d');
    }
    
    if (browser === 'firefox') {
        // Firefox: Ctrl+K conflicts
        shortcutManager.remap('ctrl+k', 'k'); // Use single key
    }
    
    if (browser === 'safari' && platform === 'mac') {
        // Safari on Mac: Cmd+L conflicts
        shortcutManager.remap('cmd+l', 'l'); // Use single key
    }
}
```

---

## 7. Testing Strategy

### 7.1 Automated Tests

```javascript
describe('Keyboard Shortcuts - Browser Conflicts', () => {
    it('should not prevent critical browser shortcuts', () => {
        const criticalShortcuts = [
            { key: 'q', metaKey: true },      // Quit
            { key: 'w', metaKey: true },      // Close tab
            { key: 't', metaKey: true },      // New tab
            { key: 'F5' },                     // Reload
            { key: 'F12' }                     // DevTools
        ];
        
        criticalShortcuts.forEach(shortcut => {
            const event = new KeyboardEvent('keydown', shortcut);
            const preventedDefault = keyboardManager.handleKeyEvent(event);
            
            expect(preventedDefault).toBe(false);
        });
    });
    
    it('should prevent Ctrl+D in canvas context', () => {
        contextManager.push('canvas');
        
        const event = new KeyboardEvent('keydown', {
            key: 'd',
            ctrlKey: true
        });
        
        const spy = vi.spyOn(event, 'preventDefault');
        keyboardManager.handleKeyEvent(event);
        
        expect(spy).toHaveBeenCalled();
    });
    
    it('should allow text editing in inputs', () => {
        const input = document.createElement('input');
        document.body.appendChild(input);
        input.focus();
        
        const event = new KeyboardEvent('keydown', {
            key: 'v',
            target: input
        });
        
        const spy = vi.spyOn(event, 'preventDefault');
        keyboardManager.handleKeyEvent(event);
        
        expect(spy).not.toHaveBeenCalled();
        
        document.body.removeChild(input);
    });
});
```

### 7.2 Manual Browser Testing

**Test Matrix:**

| Shortcut | Chrome Win | Chrome Mac | Firefox Win | Firefox Mac | Safari Mac |
|----------|------------|------------|-------------|-------------|------------|
| Ctrl/Cmd+D | ✅ Test | ✅ Test | ✅ Test | ✅ Test | ✅ Test |
| Ctrl/Cmd+H | ✅ Test | ✅ Test | ✅ Test | ✅ Test | ✅ Test |
| Ctrl/Cmd+K | ✅ Test | ✅ Test | ✅ Test | ✅ Test | ✅ Test |
| Backspace | ✅ Test | ✅ Test | ✅ Test | ✅ Test | ✅ Test |
| Space | ✅ Test | ✅ Test | ✅ Test | ✅ Test | ✅ Test |

**Test procedure:**
1. Open app in browser
2. Focus canvas (not input)
3. Press shortcut
4. Verify:
   - App action executes
   - Browser action does NOT execute
   - No console errors

---

## 8. Documentation & User Communication

### 8.1 Shortcut Overlay

Show conflicts in the shortcuts panel:

```javascript
function renderShortcutItem(shortcut) {
    const conflict = conflictDetector.checkConflict(shortcut.key);
    
    return `
        <div class="shortcut-item ${conflict.hasConflict ? 'has-conflict' : ''}">
            <span class="shortcut-description">${shortcut.description}</span>
            <kbd class="shortcut-key">${shortcut.key}</kbd>
            ${conflict.hasConflict ? `
                <span class="conflict-badge" title="May conflict with browser">
                    ⚠️
                </span>
            ` : ''}
        </div>
    `;
}
```

### 8.2 First-Run Notification

```javascript
function showFirstRunNotification() {
    if (!localStorage.getItem('shortcuts-intro-shown')) {
        showModal({
            title: 'Keyboard Shortcuts',
            message: `
                <p>Story uses keyboard shortcuts like professional design tools.</p>
                <p>Some shortcuts may override browser defaults (like Ctrl+D).</p>
                <p>Press <kbd>?</kbd> or <kbd>Cmd/Ctrl+/</kbd> anytime to see all shortcuts.</p>
            `,
            actions: [
                {
                    label: 'Got it',
                    primary: true,
                    action: () => {
                        localStorage.setItem('shortcuts-intro-shown', 'true');
                    }
                }
            ]
        });
    }
}
```

---

## 9. Best Practices

### ✅ DO

1. **Always check context** before preventing default
2. **Never prevent critical shortcuts** (Quit, Close tab, Reload)
3. **Test across browsers** (Chrome, Firefox, Safari)
4. **Provide fallbacks** for conflicting shortcuts
5. **Document conflicts** in shortcuts panel
6. **Allow customization** for power users
7. **Use preventDefault() before executing** handler
8. **Stop propagation** to prevent duplicate handling

### ❌ DON'T

1. **Don't prevent Ctrl/Cmd+W/Q/T** - users need to close tabs/browser
2. **Don't prevent F5/F12** - users need to reload/debug
3. **Don't block text editing** in input fields
4. **Don't assume browser shortcuts** - they vary by browser/platform
5. **Don't forget to preventDefault()** - browser will still execute
6. **Don't use Ctrl+1-9** - browsers use for tab switching
7. **Don't forget stopPropagation()** - prevents bubbling issues

---

## 10. Implementation Checklist

### Phase 1: Core Prevention
- [ ] Implement `isCriticalBrowserShortcut()` check
- [ ] Add `preventDefault()` to all handled shortcuts
- [ ] Add `stopPropagation()` to prevent bubbling
- [ ] Test in Chrome, Firefox, Safari

### Phase 2: Context Awareness
- [ ] Implement input field detection
- [ ] Add context-based prevention logic
- [ ] Test with input fields, canvas, modals

### Phase 3: Conflict Detection
- [ ] Create `ConflictDetector` class
- [ ] Add runtime conflict detection
- [ ] Show warnings for conflicts
- [ ] Provide fallback shortcuts

### Phase 4: Browser Optimization
- [ ] Detect browser/platform
- [ ] Apply browser-specific fixes
- [ ] Test cross-browser compatibility

### Phase 5: User Communication
- [ ] Add conflict badges in shortcuts panel
- [ ] Show first-run notification
- [ ] Document conflicts in help

---

## 11. Reference: Complete Conflict Map

```javascript
const BROWSER_CONFLICTS = {
    // High conflict (vary by browser)
    'ctrl+d': { browsers: ['chrome', 'edge'], action: 'Bookmark', severity: 'high' },
    'ctrl+h': { browsers: ['chrome', 'firefox', 'edge'], action: 'History', severity: 'high' },
    'ctrl+k': { browsers: ['chrome', 'firefox'], action: 'Search', severity: 'medium' },
    'ctrl+l': { browsers: ['all'], action: 'Address bar', severity: 'high' },
    'ctrl+b': { browsers: ['chrome', 'firefox'], action: 'Bookmarks', severity: 'low' },
    'ctrl+i': { browsers: ['chrome'], action: 'DevTools', severity: 'low' },
    'ctrl+f': { browsers: ['all'], action: 'Find', severity: 'medium' },
    'ctrl+p': { browsers: ['all'], action: 'Print', severity: 'medium' },
    'backspace': { browsers: ['chrome', 'firefox'], action: 'Back', severity: 'high' },
    'space': { browsers: ['all'], action: 'Scroll', severity: 'low' },
    
    // Critical (never prevent)
    'ctrl+q': { browsers: ['all'], action: 'Quit', severity: 'critical' },
    'ctrl+w': { browsers: ['all'], action: 'Close tab', severity: 'critical' },
    'ctrl+t': { browsers: ['all'], action: 'New tab', severity: 'critical' },
    'ctrl+shift+t': { browsers: ['all'], action: 'Reopen tab', severity: 'critical' },
    'ctrl+tab': { browsers: ['all'], action: 'Switch tabs', severity: 'critical' },
    'f5': { browsers: ['all'], action: 'Reload', severity: 'critical' },
    'f11': { browsers: ['all'], action: 'Fullscreen', severity: 'critical' },
    'f12': { browsers: ['all'], action: 'DevTools', severity: 'critical' },
    'ctrl+u': { browsers: ['all'], action: 'View source', severity: 'critical' },
    
    // Safe (no conflicts)
    'v': { browsers: [], action: 'None', severity: 'safe' },
    'r': { browsers: [], action: 'None', severity: 'safe' },
    't': { browsers: [], action: 'None', severity: 'safe' },
    'ctrl+]': { browsers: [], action: 'None', severity: 'safe' },
    'ctrl+[': { browsers: [], action: 'None', severity: 'safe' },
    'alt+a': { browsers: [], action: 'None', severity: 'safe' }
};
```

---

**Last Updated:** December 10, 2025
**Version:** 1.0
**Status:** Ready for Implementation
