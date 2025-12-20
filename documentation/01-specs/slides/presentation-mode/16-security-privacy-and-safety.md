# Security, Privacy & Safety

## Goals
- Ensure presentation mode respects privacy boundaries.
- Prevent accidental leakage of presenter-only content.
- Protect against XSS and injection attacks.

---

## 1) Privacy Boundaries
### Requirements
- MUST enforce strict separation between presenter and audience views.
- Speaker notes MUST never appear in audience DOM.
- Diagnostics (FPS, memory, cache status) MUST be presenter-only.
- Cross-window sync messages MUST NOT include note content.

---

## 2) Content Security
### Requirements
- MUST sanitize all user-generated content (slide HTML, speaker notes).
- MUST prevent XSS via script injection in slides.
- MUST validate cross-window messages (postMessage/BroadcastChannel).

### XSS Prevention
```typescript
// Allowed HTML tags for slide content
const ALLOWED_TAGS = new Set([
  'div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li', 'a', 'img', 'video', 'audio',
  'strong', 'em', 'code', 'pre', 'blockquote',
  'table', 'thead', 'tbody', 'tr', 'th', 'td'
]);

const ALLOWED_ATTRIBUTES = new Set([
  'class', 'id', 'href', 'src', 'alt', 'title',
  'data-build', 'data-build-order', 'data-build-animation',
  'data-hidden', 'data-title'
]);

function sanitizeSlideHTML(html: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  function sanitizeNode(node: Node): Node | null {
    if (node.nodeType === Node.TEXT_NODE) {
      return node; // Text nodes are safe
    }
    
    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as Element;
      
      // Check if tag is allowed
      if (!ALLOWED_TAGS.has(element.tagName.toLowerCase())) {
        return null; // Remove disallowed tag
      }
      
      // Remove disallowed attributes
      Array.from(element.attributes).forEach(attr => {
        if (!ALLOWED_ATTRIBUTES.has(attr.name)) {
          element.removeAttribute(attr.name);
        }
      });
      
      // Remove event handlers
      element.removeAttribute('onclick');
      element.removeAttribute('onerror');
      element.removeAttribute('onload');
      
      // Sanitize children
      Array.from(element.childNodes).forEach(child => {
        const sanitized = sanitizeNode(child);
        if (!sanitized) {
          element.removeChild(child);
        }
      });
      
      return element;
    }
    
    return null;
  }
  
  sanitizeNode(doc.body);
  return doc.body.innerHTML;
}
```

### Cross-Window Message Validation
```typescript
channel.addEventListener('message', (e: MessageEvent<SyncMessage>) => {
  // Validate message origin (same-origin only)
  if (e.origin !== window.location.origin) {
    console.warn('Rejected message from untrusted origin:', e.origin);
    return;
  }
  
  // Validate message schema
  if (!isValidSyncMessage(e.data)) {
    console.warn('Rejected invalid sync message:', e.data);
    return;
  }
  
  // Ensure no speaker notes in message
  if (containsSpeakerNotes(e.data)) {
    console.error('SECURITY: Speaker notes in sync message!', e.data);
    return;
  }
  
  // Process message
  handleSyncMessage(e.data);
});

function isValidSyncMessage(data: any): data is SyncMessage {
  return (
    typeof data === 'object' &&
    typeof data.type === 'string' &&
    ['state-sync', 'navigate', 'toggle-feature', 'exit'].includes(data.type)
  );
}
```

---

## 3) Audience-Safe Errors
### Requirements
- MUST not display presenter-only error messages in audience view.
- MUST fallback gracefully for media load failures (show placeholder, not stack trace).
- MUST log errors to telemetry without exposing sensitive data.

---

## 4) Network Privacy
### Requirements
- MUST not leak deck content via network requests (offline-first).
- MUST use Service Worker for asset caching (avoid CDN tracking).
- MUST respect Do Not Track (DNT) if enabled.

---

## Telemetry
- Privacy boundary violations (if detected in tests).
- XSS attempt detection (sanitizer rejections).

## Test plan
- Presenter View privacy audit (verify notes never in audience DOM).
- XSS injection tests (malicious script tags in slides).
- Cross-window message validation (reject malformed payloads).
- Network privacy (verify offline-first, no tracking pixels).

## Edge cases
- Malicious slide content (script tags, iframes, event handlers).
- Cross-window message spoofing (validate origin).
- DNT header enabled (respect privacy preferences).
