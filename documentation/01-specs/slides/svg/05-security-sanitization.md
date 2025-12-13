# SVG Security & Sanitization

**Status:** Planned
**Last updated:** Dec 13, 2025

SVG is an XML-based format that can embed script-like behavior and external references. This spec defines the security boundary for SVG import/render.

## 1) Threat model (what we must prevent)

- Script execution in the editor (XSS via `<script>` or event handlers).
- Exfiltration/network requests (external images, fonts, CSS).
- Browser feature abuse via `<foreignObject>` (HTML embedding) or embedded objects.
- Denial-of-service via extremely large/complex SVGs.

## 2) Sanitization requirements (must)

Before storing or rendering an SVG:

- Remove:
  - `<script>`
  - event handler attributes: `on*` (e.g., `onload`, `onclick`)
  - `<foreignObject>`
  - `<iframe>`, `<object>`, `<embed>`
- Remove or neutralize:
  - `<a>` links that navigate externally
  - `<use>` references that resolve outside the document
- Disallow external URLs:
  - Any `href`, `xlink:href`, `src`, `url(...)` references pointing to `http://` or `https://`
  - Allow `data:` URIs only for `data:image/*` and enforce size limits.
  - Disallow `javascript:` URLs.
- Normalize / strip risky attributes:
  - CSS that can reference external resources
  - `style` attributes should be parsed and filtered (do not allow `url(http…)`).

Sanitization philosophy:

- Prefer an **allowlist** approach for elements/attributes.
- If we cannot safely validate an attribute, drop it.

CSS rules (MVP):

- Allow only a restricted set of inline CSS properties commonly used for paint and geometry.
- Explicitly disallow `url(...)` anywhere in styles.
- Treat `<style>` blocks as best-effort: either strip entirely or parse+filter with the same restrictions.

## 3) Rendering isolation

- Inline SVG should be inserted as DOM in a way that does not allow script execution.
- Do not attach SVG via `innerHTML` unless the sanitization is proven correct.

Additional constraints:

- Do not allow SVG to escape its bounds to capture pointer events outside the object.
- Avoid referencing external IDs outside the SVG subtree.

## 4) Complexity limits (DoS protection)

Define limits and enforce them at import:

- Max SVG bytes
- Max total element nodes
- Max path commands / segments (approx)
- Max nested groups depth

If breached:

- Reject with a clear message, or
- Raster-fallback (policy decision).

Recommended MVP defaults (tunable):

- Max SVG bytes: 1 MB
- Max total element nodes: 10,000
- Max paths: 2,000
- Max group nesting depth: 100

## 5) User-facing messaging

- If we remove content (e.g., scripts), show a non-blocking import warning:
  - “Unsafe SVG content was removed (scripts/external references are not allowed).”

- If raster-fallback is used:
  - “This SVG was rendered as an image for compatibility/performance.”

## 6) QA checklist

- Verify no network requests during import/render.
- Verify no JS executes.
- Verify SVGs with `foreignObject` are rejected or sanitized.
- Verify huge SVGs don’t freeze the app.

Recommended validation tests:

- SVG with `<image href="https://...">` is blocked or stripped.
- SVG with `style="fill:url(https://...)"` is blocked or stripped.
- SVG with `<use href="https://...#id">` is blocked.
- SVG with `onload` attributes is stripped.
