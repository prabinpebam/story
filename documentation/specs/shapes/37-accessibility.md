# Accessibility & Inclusivity (Shapes)

**Status**: Draft

Defines baseline accessibility requirements for shapes editing.

---

## 1. Keyboard-only editing (baseline)
- Enter/exit edit modes
- Navigate selection

Required keyboard interactions (v1):
- Selection: arrow keys (nudge focus between nearest selectable elements), Tab/Shift+Tab cycles focus within current context where applicable.
- Manipulation: nudge selected object with arrow keys; Shift+arrow for larger nudge (use existing editor conventions).
- Mode control: Esc always exits the deepest edit mode first (vector → object → none).
- Inspector parity: any essential value (size/rotation/corner radius/boolean op/mask invert) must be editable via inspector controls.

## 2. Visual accessibility
- High contrast compatibility
- Hit target sizing

Additional requirements:
- Focus visibility: all focusable controls must show a token-driven focus ring in both themes.
- High contrast: ensure selection outlines and handles maintain sufficient contrast; do not rely on color alone (use shape/outline differences).
- Reduced motion: avoid animated “wiggle” feedback on handles; prefer immediate state changes.

Canvas overlay constraint:
- Canvas overlay interactions are inherently pointer-centric; we must not make the canvas the only way to complete key workflows.

## 3. Acceptance
- Editing remains possible without precise mouse-only behavior.

Acceptance additions:
- All critical Shapes operations have an inspector-based path (even if slower than canvas editing).
- Presentation mode remains accessible and does not expose edit-only focus traps.

## 4. Quality critique (gaps + risks)
- Current accessibility spec was too generic and didn’t enumerate keyboard/focus behaviors; that leads to inconsistent implementations.
- Canvas overlay is a common accessibility failure point; without an explicit “inspector parity” rule, features ship mouse-only.
