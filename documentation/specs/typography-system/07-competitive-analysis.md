# Competitive Analysis & Benchmarks

To ensure the Story typography system meets user expectations, we benchmark against industry leaders in design and presentation tools: **Figma**, **Canva**, and **Pitch**.

## 1. Figma (Professional Design Tool)
**Strengths:**
- **Granular Text Styles:** Styles are atomic (Font, Size, Line Height, Spacing) and can be applied independently.
- **Decoupled Properties:** Color is often separate from Typography styles.
- **Variable Fonts:** Full support for variable axes.
- **Missing/Conflict Handling:** Clear UI when a font is missing or when a style is detached.

**Relevance to Story:**
- We should adopt the concept of **"Detaching"** styles. If a user manually edits a property of a styled element, it should either update the style (if allowed) or detach from the style.
- We need a clear distinction between "Text Properties" (font, size) and "Fill" (color).

## 2. Canva (Consumer Design Tool)
**Strengths:**
- **Brand Kits:** Users define a "Brand" with specific fonts for Headings, Subheadings, and Body.
- **Font Pairings:** "Styles" tab offers one-click font combinations that update the entire design instantly.
- **Simplicity:** Hides complex properties (kerning, ligatures) unless requested.

**Relevance to Story:**
- Our **"Presets"** system closely mirrors Canva's "Styles". This is the right approach for our target audience (presentation creators, not type designers).
- The ability to "Shuffle" styles (Canva feature) is a powerful delight feature we should consider for the "AI" tab.

## 3. Pitch (Presentation Tool)
**Strengths:**
- **Semantic Hierarchy:** Slides are built on semantic slots (`Title`, `Subtitle`, `Body`).
- **Slide Styles:** Changing a style updates *all* slides in the deck immediately.
- **Sticky Styles:** If you change a master slide, the instances update intelligently.

**Relevance to Story:**
- This is our primary functional benchmark.
- **Requirement:** We must implement the **Semantic Link**. A text box isn't just text; it is a `Title` or a `Body`.
- **Requirement:** Changing the "Modern" preset to "Classic" must reflow the entire deck.

## Summary of Best Practices to Adopt

1.  **Semantic Roles**: Every text element should ideally have a role (`Title`, `Body`, etc.).
2.  **Cascade**: Theme -> Master -> Slide -> Element.
3.  **Override State**: Visual indication when an element has deviated from its assigned style.
4.  **Smart Fallbacks**: If a font fails to load, the layout should not break (use metric-compatible fallbacks if possible).
