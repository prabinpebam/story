# Typography System Architecture

## Overview

The typography system provides a flexible, theme-aware text styling engine. It is designed to support semantic styling (e.g., "Title", "Body") while allowing for granular overrides. The system follows a strict cascade from Theme -> Master -> Slide -> Element.

## Core Components

### 1. Font Manager (`src/core/FontManager.js`)
**Responsibility**: Asset Management.
- Must maintain a registry of available fonts.
- Must handle lazy-loading of web fonts (Google Fonts) to minimize initial bundle size.
- Must provide synchronous checks for font availability (`isFontLoaded`).

### 2. Style Registry (`src/core/constants/FontPresets.js`)
**Responsibility**: Definition Source.
- Contains the immutable definitions of all built-in typography themes.
- Defines the 8 semantic roles: `Title`, `Subtitle`, `H1`, `H2`, `Body`, `BodySmall`, `Caption`, `Label`.

### 3. State Management (`Store`)
**Responsibility**: Runtime State.
- **`currentTheme.typography`**: Stores the ID of the active preset (e.g., `'modern-clean'`) OR a custom definition object.
- **`textStyles`**: A computed or stored map resolving the current theme's raw values for each semantic role.

### 4. Rendering Engine (`CanvasManager` / `TextRenderer`)
**Responsibility**: Visual Output & Active Linking.
- Must resolve styles dynamically at render time.
- Must support **Active Linking**: When the `currentTheme` changes, all text elements referencing a style ID must re-render immediately with the new values.

## The Cascade & Inheritance Model

The system implements a hierarchy identical to the Color Theme system to ensure consistent behavior.

### Layer 1: The Theme (Root)
- **Source**: `Store.currentTheme.typography`
- **Content**: The baseline definitions for all 8 semantic roles (Title, Body, etc.).
- **Behavior**: Changing the Theme updates all downstream layers immediately.

### Layer 2: Master Slide (Presentation Level)
- **Source**: `MasterSlide.typographyOverrides`
- **Context**: Global overrides for the entire presentation (e.g., "All Titles in this deck are Blue").
- **Behavior**: Inherits from Layer 1, overrides specific roles.

### Layer 3: Layout Master (Template Level)
- **Source**: `Layout.elements`
- **Context**: Specific layouts like "Title & Content" or "Section Header".
- **Behavior**:
  - Defines the *structure* of the slide.
  - Can override styles for specific placeholders (e.g., "In 'Title Only' layout, the Title is centered").

### Layer 4: Slide Instances
- **Source**: `Slide.elements`
- **Context**: Actual text boxes on user slides.
- **Behavior**:
  - **Linked State (Default)**: The element points to a `textStyleId`. It inherits properties from the Layout/Master chain.
  - **Updates**: If any upstream layer changes, this element updates automatically.

### Layer 5: Element Overrides (The "Detached" State)
- **Source**: `Element.properties`
- **Context**: User manually changes a property (e.g., Font Size).
- **Behavior**:
  - **Partial Override**: If user changes *only* color, the Font Family and Size remain linked to the Theme.
  - **Full Detach**: (Optional) If user explicitly breaks the link, the element stops listening to Theme updates.

## Resolution Logic

```javascript
function resolveTextStyle(element, layoutElement, masterElement, currentTheme) {
  // 1. Start with the Theme's definition
  const baseStyle = currentTheme.styles[element.textStyleId];

  // 2. Apply Master/Layout overrides
  const inheritedStyle = {
    ...baseStyle,
    ...masterElement?.overrides,
    ...layoutElement?.overrides
  };

  // 3. Apply Element-level overrides (manual user changes)
  const finalStyle = {
    ...inheritedStyle,
    ...element.manualOverrides
  };

  return finalStyle;
}
```

## Design System Alignment: UI vs. Content

It is critical to distinguish between the **Application UI Typography** and the **Canvas Content Typography**.

### 1. Application UI (The Editor)
- **Governed by**: `styles/modules/variables.css` (Design Tokens).
- **Usage**: All panels, buttons, dropdowns, and inspector labels.
- **Rules**:
  - MUST use `--font-ui` (Inter).
  - MUST use standard size tokens (e.g., `--font-size-sm` for labels).
  - NEVER use raw pixel values.

### 2. Canvas Content (The User's Work)
- **Governed by**: `FontPresets.js` and User Input.
- **Usage**: Text rendered on the slide canvas.
- **Rules**:
  - Uses raw pixel values (e.g., `fontSize: 72`) because user content is arbitrary.
  - Fonts are loaded dynamically via `FontManager`.
  - **Independence**: The user's choice of "Comic Sans" for their slide title does NOT affect the Editor UI font.

## CSS Design Tokens

The system maps semantic roles to CSS variables for UI consistency, but Canvas rendering uses raw pixel values derived from the presets.

- **UI Fonts**: `--font-family-ui` (Inter/System)
- **Canvas Fonts**: Loaded dynamically via `FontManager`.

## Data Persistence & Collaboration

### Serialization
- **`textStyleId`**: Stored as a string (e.g., `"title"`).
- **`manualOverrides`**: Stored as a sparse object (e.g., `{ "fontSize": 120 }`).
- **Reference Integrity**: Elements reference styles by ID, ensuring that Theme updates propagate to saved files upon reload.

### Realtime Collaboration
- **Atomic Updates**: Style changes are broadcast as atomic operations.
- **Conflict Resolution**: Granular overrides (Element level) take precedence over broad changes (Theme level), ensuring user intent is preserved during concurrent editing.
