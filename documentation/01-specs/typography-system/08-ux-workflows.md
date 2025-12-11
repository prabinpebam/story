# Typography UX Workflows & Property Inspector Spec

This document details the user experience for interacting with typography across the application. It aligns strictly with the **Color Theme UX** principles: "Edit with the styles you have" and "Explicit Opt-Out".

## 1. The Property Inspector (Text Section)

The Text Section is the primary interface for applying and modifying text styles. It is designed to encourage semantic styling over manual formatting.

### UI Layout Structure

```
┌─────────────────────────────────────────────────────────────────┐
│  Text                                                           │
├─────────────────────────────────────────────────────────────────┤
│  Style Role                                                     │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Title (Inherited)                                      ▼ │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Font Family                       Weight                       │
│  ┌──────────────────────────────┐  ┌─────────────────────────┐  │
│  │  Inter                     ▼ │  │  Bold                 ▼ │  │
│  └──────────────────────────────┘  └─────────────────────────┘  │
│                                                                 │
│  Size          Line Height         Letter Spacing               │
│  ┌──────────┐  ┌────────────────┐  ┌─────────────────────────┐  │
│  │  72      │  │  1.1           │  │  -1%                    │  │
│  └──────────┘  └────────────────┘  └─────────────────────────┘  │
│                                                                 │
│  [B] [I] [U] [S]    [Left] [Center] [Right] [Justify]           │
│                                                                 │
│  Color                                                          │
│  [Color Picker Button]                                          │
└─────────────────────────────────────────────────────────────────┘
```

### Control Behaviors

#### 1. Style Role Dropdown (The "Theme Slot")
This is the equivalent of the "Theme Swatches" in the Color Picker.
- **Purpose**: Assigns a semantic role (`textStyleId`) to the element.
- **Options**: The 8 semantic roles defined in the current theme (Title, Subtitle, H1, H2, Body, BodySmall, Caption, Label).
- **Behavior**:
    - Selecting a role (e.g., "Body") immediately updates `textStyleId`.
    - **Crucially**, it **CLEARS** all manual overrides (Font, Size, Weight) to match the new role's definition.
    - **Visual Feedback**: The dropdown shows the current role. If the element matches the role exactly, it shows a "Linked" icon (🔗).

#### 2. Font Properties (The "Custom Override")
These controls (Family, Size, Weight, etc.) allow granular customization.
- **Behavior**:
    - Changing any of these values creates a **Manual Override** on the element.
    - The `textStyleId` remains unchanged (e.g., it is still a "Title").
    - **Visual Feedback**:
        - The modified control highlights (e.g., label turns blue or shows a dot).
        - The Style Role dropdown changes state to indicate "Modified" (e.g., "Title *").
        - A **"Reset" button** appears next to the modified property or globally in the section header.

#### 3. Inheritance Indicator
- **Tooltip**: Hovering over the Style Role dropdown shows the source of the style:
    - "Inherited from Master Slide"
    - "Inherited from Layout"
    - "Theme Default"

---

## 2. Task Flows

### Flow A: Applying a Standard Style (The Happy Path)
**Goal**: User wants to make a text box look like a "Heading".
1.  User selects a text element.
2.  User opens the **Style Role Dropdown**.
3.  User selects **"Heading 1"**.
4.  **System Action**:
    - Sets `element.textStyleId = 'heading1'`.
    - Clears `element.manualOverrides`.
    - Re-renders text using the Theme's "Heading 1" properties.
5.  **Result**: Text updates instantly. If the global theme changes later, this text will update.

### Flow B: Creating a Custom Override (The "Detached" Path)
**Goal**: User wants the "Title" to be extra large for a specific slide.
1.  User selects a text element (currently "Title", Size 72px).
2.  User changes **Font Size** to `120px`.
3.  **System Action**:
    - Keeps `element.textStyleId = 'title'`.
    - Sets `element.manualOverrides.fontSize = 120`.
4.  **UI Update**:
    - Font Size input shows `120`.
    - Style Role dropdown shows "Title (Modified)".
    - A "Reset" icon appears next to the Size input.
5.  **Result**: The text is 120px. If the Theme changes font *family*, this text updates. If the Theme changes *size*, this text ignores it (because it's overridden).

### Flow C: Resetting to Style (Re-linking)
**Goal**: User messed up the formatting and wants to revert to the clean Theme style.
1.  User selects the modified text element.
2.  User clicks the **"Reset to Style"** button (or re-selects "Title" in the dropdown).
3.  **System Action**:
    - Clears `element.manualOverrides`.
4.  **Result**: Text snaps back to the Theme's definition (72px).

### Flow D: Updating a Master Slide (Advanced)
**Goal**: User wants ALL "Body" text in the presentation to be Blue.
1.  User navigates to **Master Slide View**.
2.  User selects the "Body Placeholder".
3.  User changes **Color** to Blue.
4.  **System Action**:
    - Sets `MasterSlide.overrides.body.color = 'blue'`.
5.  **Result**:
    - All slides inheriting from this Master now display Body text in Blue.
    - They are still linked to the Theme for Font Family and Size.

---

## 3. Visual States & Feedback

| State | UI Representation | Meaning |
|-------|-------------------|---------|
| **Linked** | Dropdown: "Title" <br> Icon: 🔗 (Subtle) | Element matches the Theme exactly. Updates automatically. |
| **Modified** | Dropdown: "Title *" <br> Reset Button: Visible | Element is a "Title" but has manual changes (e.g., Size). |
| **Detached** | Dropdown: "Custom" | Element has no semantic role (Legacy or explicit detach). |
| **Mixed** | Dropdown: "Mixed" | Selection contains multiple styles. |

## 4. Interaction with Color Theme
Typography and Color are separate but related.
- **Text Color** is treated as a property of the Text Style.
- However, the **Color Picker** itself enforces the "Edit with the colors you have" rule.
- **Scenario**:
    - User selects "Title".
    - "Title" style defines color as `text1` (from Color Theme).
    - User opens Color Picker.
    - User sees `text1` is selected.
    - User picks `accent1`.
    - **Result**: This is an **Override**. The text is still a "Title", but its color is now manually set to `accent1`.
