# Continuity & Curve UX

**Status**: Implemented (v1, partial)
**Last Updated**: December 17, 2025

Defines UX for corner/smooth/symmetric and handle locking/breaking.

---

## 1. Indicators
- Corner
- Smooth
- Symmetric

## 2. Controls
- Toolbar toggles OR inspector control (must align to existing IA)
- Context menu actions
- Modifier-key gestures

V1 decision (explicit):
- Continuity is controlled via **double-click on a node** to toggle **corner ↔ smooth**.
- Handle endpoints are draggable for cubic segments.

V1 non-goals:
- Symmetric continuity mode.
- Explicit handle break/link gesture (e.g. Alt-drag to break).
- Dedicated toolbar/inspector controls for continuity.

## 3. Handle constraint UX
- Linked movement for smooth/symmetric
- Break gesture (define exact interaction)

## 4. Acceptance
- Users can predict handle behavior without surprises.

## 5. Figma-class UX learnings (continuity pitfalls)
- Continuity changes must be deterministic and reversible via undo; toggling Corner↔Smooth↔Symmetric should not “wander” handles over repeated toggles.
- Define a single, explicit “break” interaction (e.g. Alt-drag a handle to unlink) and never infer breaking implicitly from small movements.
- Use sticky capture for handles: do not switch to the opposite handle or nearby point mid-drag.
- Keep the model consistent across zoom levels: the same gesture should yield the same continuity result regardless of viewport scale.
- When repairing invalid states (e.g. collinear zero-length handles), do the minimal deterministic fix and show non-blocking feedback.

## 6. Quality critique (gaps + risks)
- The doc still lacks explicit UI placement decisions (toolbar vs inspector). Choose one for v1 to avoid fragmented implementations.
