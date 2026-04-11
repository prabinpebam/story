# Customization & Extensibility (Shapes)

**Status**: Draft

Defines extension points without over-engineering.

---

## 1. Preferences
- Handle sizes
- Snap sensitivity
- Grid defaults

Rules:
- Preferences must default to current Story behavior (no behavior change without explicit user opt-in).
- Preferences must be stored via the existing app preferences mechanism (no new ad-hoc storage).
- Preferences must not change `.str` document data unless the preference is explicitly a document setting (most are user settings).

## 2. Extensibility
- Plugin hooks are out of scope for v1.

Non-goals (v1):
- No third-party plugin API.
- No scripting surface for geometry operations.

Safe extension points to preserve:
- Shape kind expansion: add new `shapeKind` values without breaking legacy rendering; unknown kinds must degrade gracefully (deterministic fallback rendering + warning) rather than crashing.
- Operation expansion: new operations must be additive and optional; old docs/files must still load (copy-all-properties semantics).
- Paint expansion: new fill/stroke types must remain layer-based and compatible with the existing multi-fill/multi-stroke renderer.

## 3. Acceptance
- No architecture dead-ends that block new shape types.

Acceptance additions:
- Unknown fields in shape nodes are preserved round-trip in `.str` (lossless persistence).
- New shape kinds can be added without changing core interaction state machine structure (tool chooses capabilities per kind).

## 4. Quality critique (gaps + risks)
- “Leave room for plugins” is too vague; the real risk is accidentally hard-coding assumptions (only rect/ellipse/path) into hit-testing, selection, and serialization.
- Without explicit persistence rules, preferences can leak into document data and break collaboration/export determinism.
