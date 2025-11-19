# Technical Specification: Text Engine & Formatting

## 1. Overview
The Text Engine handles the rendering, editing, and styling of text elements. It relies on standard HTML `contenteditable` for editing but uses a robust data model to ensure consistency across rendering modes.

## 2. Data Model
The `TextElement` schema supports granular control over typography.

```javascript
const TextElement = {
  type: "text",
  content: "<h1>Hello World</h1>", // HTML string for rich text, or plain text
  style: {
    // Font
    fontFamily: "Inter, sans-serif",
    fontSize: 64,
    fontWeight: 700,
    fontStyle: "normal", // 'italic'
    textDecoration: "none", // 'underline', 'line-through'
    
    // Color
    color: "#000000",
    opacity: 1.0,
    
    // Paragraph
    textAlign: "left", // 'left', 'center', 'right', 'justify'
    lineHeight: 1.2, // Multiplier
    letterSpacing: -0.02, // em
    
    // Advanced
    textTransform: "none", // 'uppercase', 'lowercase'
    shadow: "none" // CSS text-shadow
  },
  autoFit: "height" // 'none', 'width', 'height', 'both'
};
```

## 3. Font Management
- **System Fonts:** Standard stack (Arial, Helvetica, Times New Roman).
- **Web Fonts:** Google Fonts integration.
    - **Loader:** `FontLoader.js` dynamically injects `<link>` tags for requested fonts.
    - **Selection:** A font picker UI that previews the font faces.

## 4. Editing Experience
- **Interaction:** Double-click a text element to enter "Edit Mode".
- **Mechanism:**
    1.  The `div` becomes `contenteditable="true"`.
    2.  Keyboard shortcuts (Ctrl+B, Ctrl+I) are intercepted to update the *Data Model* rather than just the DOM (if possible) or synced back on blur.
    3.  **Sync:** On `blur` or `input`, the innerHTML is sanitized and saved to the Store.

## 5. Formatting Controls (Property Inspector)
When a text element is selected, the Property Inspector renders:

### 5.1 Typography Section
- **Font Family:** Dropdown with search.
- **Weight:** Dropdown (100-900).
- **Size:** Knob control + Input.
- **Color:** Color picker (Hex/RGBA).

### 5.2 Paragraph Section
- **Alignment:** Segmented Control (Left, Center, Right, Justify).
- **Line Height:** Knob control (0.8 - 3.0).
- **Letter Spacing:** Knob control (-0.1 - 0.5em).

## 6. Advanced Features
- **Auto-Resize:**
    - **Fixed Width:** Text wraps, height grows.
    - **Auto Width:** Width grows with text (no wrap).
- **Markdown Support:** (Optional) Allow users to write Markdown and convert to styled HTML.
