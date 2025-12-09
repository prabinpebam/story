# Property Inspector - Glossary of Terms

> **Part of:** [Property Inspector Specification v2.0](./00-overview.md)

---

## Purpose

This glossary defines the canonical terminology used throughout the Property Inspector specification. All spec documents should use these terms consistently.

---

## A

### Anchor Point
The reference point for transformations (rotation, scale). Currently defaults to center; future enhancement may allow user selection.

### ARIA (Accessible Rich Internet Applications)
W3C specification for making web content accessible. Used throughout PI for screen reader support.

---

## B

### Background Blur
An effect that blurs content behind the element, creating a frosted glass appearance. Applied via CSS `backdrop-filter`.

### Blend Mode
Determines how an element's colors combine with elements below it. Options include: Normal, Multiply, Screen, Overlay, Darken, Lighten, Color Dodge, Color Burn, Hard Light, Soft Light, Difference, Exclusion, Hue, Saturation, Color, Luminosity.

---

## C

### Canvas
The main editing area where elements are displayed and manipulated. Also called the "stage" or "artboard" in other tools.

### Code Fill
A fill type that uses programmatic generation (shader code, patterns) rather than static colors or images.

### Collapse State
Whether a section is expanded (showing content) or collapsed (header only). Persisted per session.

### Commit (value)
Finalizing a property change, creating an undo history entry. Opposite of transient update.

### Constrain Proportions
Lock maintaining aspect ratio when resizing. When enabled, changing width auto-updates height and vice versa.

---

## D

### Delta
The difference between current and previous values. Used in relative adjustments for multi-selection.

### Drag Handle
The vertical grip icon (⋮⋮) used to initiate drag-and-drop reordering of fills, strokes, or effects.

### Drop Shadow
An effect that creates a shadow beneath the element. Properties: color, offset X/Y, blur radius, spread.

---

## E

### Editor Mode
The current editing context: "slide" (normal editing), "master" (master layout editing), or "presenter" (presentation mode).

### Element
A single object on the canvas: shape, text, image, or group. Also called "object" or "node" in other tools.

### Eyedropper
A tool for sampling colors from anywhere on screen. Triggered from color picker.

---

## F

### Fill
The interior appearance of a shape. Types: solid color, gradient, image, video, code.

### Fill Stack
Multiple fills layered on a single element. Rendered bottom-to-top with blend modes.

### Flyout
A floating panel that appears anchored to a trigger element. Contains additional controls (e.g., color picker, stroke settings).

### Focus Trap
Technique to contain keyboard focus within a modal/flyout until dismissed.

---

## G

### Gradient
A fill type that transitions between multiple colors. Types: linear (directional) and radial (circular).

### Gradient Stop
A point on the gradient defining a specific color and position (0-100%).

---

## H

### Hex Color
Color specified as hexadecimal RGB values: #RRGGBB or #RGB shorthand.

### HSB/HSL
Color models: Hue-Saturation-Brightness / Hue-Saturation-Lightness. Used in color picker.

---

## I

### Inherited
A property value that comes from a parent (e.g., master layout) rather than being set directly on the element.

### Input (component)
A UI control for entering or adjusting values: NumberInput, TextInput, ColorInput, etc.

---

## L

### Layer Blur
An effect that blurs the element itself. Applied via CSS `filter: blur()`.

### Layout Mode (text)
How text bounds are determined: Auto Size, Fixed Width, or Fixed Size.

---

## M

### Master Layout
A template slide defining placeholder positions and default styles. Changes cascade to linked slides.

### Mixed Value
When multiple selected elements have different values for a property. Displayed as "—" or "Mixed".

### Multi-Selection
Having more than one element selected. Edits apply to all selected elements.

---

## N

### Nudge
Moving elements with arrow keys. Standard nudge: 1px. Big nudge (Shift): 10px.

---

## O

### Opacity
Transparency level from 0% (invisible) to 100% (fully opaque).

### OpenType Features
Advanced typography options: ligatures, small caps, stylistic alternates, etc.

---

## P

### Placeholder
A designated area in a master layout for content (title, body, media). Maintains position when switching layouts.

### Property Inspector (PI)
The right sidebar panel displaying and editing properties of the current selection.

### Property Memory
System that remembers last-used values for new fills, strokes, effects.

---

## R

### Row
A single line of controls in a section. Standard height: 28-32px.

---

## S

### Scrubbing
Adjusting a numeric value by dragging left/right on its label. Provides continuous control.

### Section
A collapsible group of related property controls (e.g., Position, Fill, Typography).

### Selection
The currently selected element(s) on the canvas. PI updates to reflect selection.

### Skip History
Flag indicating a transient update that shouldn't create an undo entry. See "Transient Update".

### Slide
A single page/screen in the presentation. Contains elements positioned on the canvas.

### Store
The centralized state management system. Sections subscribe to store changes.

### Stroke
The outline/border of a shape. Properties: color, width, position (inside/center/outside), dash pattern.

### Stroke Position
Where the stroke is drawn relative to the path: Inside, Center, or Outside.

---

## T

### Text Style
A named preset of typography properties (font, size, spacing, alignment) that can be applied to text.

### Theme
A collection of color and typography presets that define the visual identity of a presentation.

### Theme Slot
A semantic color reference (e.g., "Primary", "Accent") that resolves to different values based on active theme.

### Transient Update
A property change during an ongoing interaction (scrubbing, dragging) that doesn't create undo history. Committed on release.

### Type Settings
Advanced typography controls accessed via flyout: line height, letter spacing, paragraph spacing, etc.

---

## U

### Undo History
Stack of committed changes that can be reversed (Ctrl+Z) or re-applied (Ctrl+Shift+Z).

---

## V

### Variable Font
A font format supporting continuous axis variations (weight, width, slant) rather than discrete styles.

### Visibility (fill/stroke/effect)
Toggle showing or hiding an individual fill, stroke, or effect without removing it.

---

## W

### Weight (font)
The thickness of text strokes. Numeric scale from 100 (Thin) to 900 (Black), or named values (Regular, Bold).

### Weight (stroke)
The thickness of a stroke line, measured in pixels.

---

## Abbreviations

| Abbreviation | Full Term |
|--------------|-----------|
| PI | Property Inspector |
| HSB | Hue-Saturation-Brightness |
| HSL | Hue-Saturation-Lightness |
| ARIA | Accessible Rich Internet Applications |
| SR | Screen Reader |
| RTL | Right-to-Left |
| GPU | Graphics Processing Unit |
| CSS | Cascading Style Sheets |

---

## See Also

- [00-overview.md](./00-overview.md) - Main specification overview
- [01-architecture.md](./01-architecture.md) - Component architecture
- [11-interactions.md](./11-interactions.md) - Interaction patterns
