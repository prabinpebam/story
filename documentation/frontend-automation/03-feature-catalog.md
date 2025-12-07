# 03. Feature Catalog

This document lists all frontend features derived from the `documentation/specs/` directory. It serves as the source of truth for what *can* be tested.

## 1. Canvas & Interaction (`specs/canvas/`)
- **Navigation:** Pan (Space+Drag), Zoom (Ctrl+Scroll), Fit to View.
- **Selection:** Click, Shift+Click (Multi), Marquee Select, Deep Select (Cmd+Click).
- **Transformation:** Move, Resize (8 handles), Rotate, Center Resize (Alt), Constrained Resize (Shift).
- **Snapping:** Smart guides, distance markers, snap-to-grid.
- **Grouping:** Group/Ungroup, Group selection behavior.
- **Context Menu:** Right-click actions (Cut, Copy, Paste, Delete, Bring to Front, etc.).

## 2. Text Editing (`specs/core/text-editing-v2.md`)
- **Modes:** Object Mode vs. Edit Mode.
- **Interaction:** Double-click to edit, Click outside to commit.
- **Formatting:** Bold, Italic, Underline, Alignment, Lists.
- **Typography:** Font Family, Size, Weight, Line Height, Letter Spacing.
- **Placeholders:** Editing master placeholders, prompt text behavior.

## 3. Property Inspector (`specs/property-inspector/`)
- **Position:** X, Y, W, H, Rotation.
- **Appearance:** Opacity, Blend Modes.
- **Fills:** Solid Color, Gradient, Image, Code Fill.
- **Strokes:** Color, Weight, Position (Inside/Center/Outside), Dashes.
- **Effects:** Drop Shadow, Inner Shadow, Blur (Layer/Background).
- **Typography:** Full text properties panel.
- **Slide Properties:** Background color/image, Transition settings.

## 4. Slide Management (`specs/slides/`)
- **Slide List:** Add, Delete, Duplicate, Reorder (Drag & Drop).
- **Thumbnails:** Visual preview of slide content.
- **Masters:** Apply Layout, Edit Master, Placeholder system.

## 5. Presentation Mode (`specs/presentation/`)
- **Playback:** Start from beginning, Start from current.
- **Navigation:** Next/Prev (Keys/Click), Jump to slide.
- **Overlays:** Laser Pointer, Black Screen, White Screen.
- **Views:** Grid View (Slide sorter), Presenter View (Notes).

## 6. Toolbar & Tools (`specs/toolbar/`)
- **Tools:** Select (V), Hand (H), Frame (F), Rectangle (R), Text (T), Image (K).
- **Behavior:** Tool persistence, One-off usage, Keyboard shortcuts.
- **Menus:** App Menu, Zoom controls, Undo/Redo buttons.

## 7. File & Storage (`specs/storage/`)
- **Operations:** Create New, Open, Save, Save As.
- **Cloud:** Save to Cloud, Open from Cloud.
- **Export:** PDF, PNG, JSON export.
- **Settings:** Document settings, User preferences.

## 8. App UI Design System (`specs/app-ui-design-system/`)
- **Themes:** Light/Dark mode switching.
- **Colors:** Theme color application.
- **UI Components:** Modals, Dropdowns, Inputs, Sliders, Color Pickers.
