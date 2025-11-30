# ContentSanitizer - HTML Cleaning and Validation

## 1. Purpose

Clean and normalize HTML content from contenteditable elements. Ensure only allowed tags, attributes, and styles are preserved. Prevent XSS and ensure consistent content structure.

## 2. Why Sanitization is Needed

ContentEditable produces messy HTML:
- Browsers add their own markup (Chrome uses `<b>`, Safari uses `<span style="font-weight:bold">`)
- Pasted content brings in unwanted formatting
- External paste (Word, Google Docs) includes proprietary markup
- Security risk from script injection

## 3. Approach: Allowlist-Based

**Strategy**: Parse HTML into DOM, walk tree, keep only allowed elements/attributes/styles, discard everything else.

**Why allowlist over blocklist**: More secure. Unknown elements are stripped rather than potentially harmful ones slipping through.

## 4. Allowed Elements

| Category | Tags |
|----------|------|
| Structure | `p`, `div`, `br` |
| Formatting | `b`, `strong`, `i`, `em`, `u`, `s`, `del` |
| Inline | `span` |
| Future | `ul`, `ol`, `li` (lists, not yet) |

**Disallowed elements** are unwrapped - their children are kept, the element itself is removed.

## 5. Allowed Attributes

Only `style` attribute, and only on specific elements:
- `span`: style (for inline formatting)
- `div`: style (for paragraph formatting)
- `p`: style (for paragraph formatting)

All other attributes (class, id, data-*, event handlers) are stripped.

## 6. Allowed Styles

| Category | Properties |
|----------|------------|
| Typography | font-size, font-family, font-weight, font-style, text-decoration, text-align |
| Color | color, background-color |
| Spacing | line-height, letter-spacing |

**Disallowed styles** are removed from the style attribute.

## 7. Style Value Validation

Each style property value is validated:
- **font-size**: Must match pattern like `16px`, `1.2em`, `120%`
- **color**: Must be valid hex, rgb(), rgba(), or named color
- **font-weight**: Must be `normal`, `bold`, or numeric (400, 700, etc.)

**Security checks**:
- No `expression()` (IE CSS expressions)
- No `javascript:` URLs
- No `url()` in unexpected places

## 8. Paste Cleaning

Additional cleaning for pasted content:

**Word artifacts to remove**:
- Conditional comments (`<!--[if gte mso...]-->`)
- mso-* style properties
- XML namespace elements (`<o:p>`, `<w:sdt>`)
- MsoNormal class references

**Google Docs artifacts to remove**:
- docs-internal-* IDs
- Complex font stacks

## 9. Whitespace Normalization

- Multiple spaces → single space
- Trim whitespace around tags
- Normalize `&nbsp;` to regular space
- Collapse multiple `<br>` to max 2

## 10. Empty Content Detection

Utility methods to check if content is effectively empty:
- `isEmpty(html)`: True if only whitespace after stripping tags
- `isWhitespaceOnly(html)`: True if only whitespace characters

Used by PlaceholderManager to determine whether to restore prompt text.

## 11. Performance Consideration

**Caching**: For repeated sanitization of same content (e.g., during debounced saves), consider caching by content hash. Limit cache size to prevent memory issues.

## 12. Security Considerations

| Threat | Mitigation |
|--------|------------|
| XSS via script tags | Not in allowed tags list |
| XSS via event handlers | All attributes except style are stripped |
| XSS via javascript: URLs | Style value validation rejects |
| CSS expression attacks | Style value validation rejects |
| DOM clobbering | No id/name attributes allowed |

## 13. Integration Points

| Component | Usage |
|-----------|-------|
| TextEditManager | Sanitize before saving to Store |
| Paste handler | Sanitize pasted content |
| Import | Sanitize imported presentation content |
| Collaboration | Sanitize received content |

## 14. Testing Approach

Key test cases:
- Nested formatting tags preserved correctly
- Unknown tags unwrapped
- Script/event handlers stripped
- Word paste cleaned
- Google Docs paste cleaned
- Edge cases: empty content, only whitespace, deeply nested

## 15. Open Questions

1. Should we preserve `<a>` tags for links in text? If so, with what href validation?
2. Should we allow `<sub>` and `<sup>` for subscript/superscript?
3. How aggressive should whitespace normalization be?
