# Styling UI (Shapes)

**Status**: Draft

Defines how fills/strokes/effects UI applies to shapes and vector geometry.

---

## 1. Hard rule
Reuse existing inspector sections:
- `FillSection`, `StrokeSection`, `EffectsSection`.

## 2. Shape-specific additions
- Any geometry controls must not create new styling surfaces.

## 3. Task flows
- Add/reorder fills
- Toggle visibility
- Link theme slots
- Adjust strokes

Additional task flows:
- Apply style to boolean result vs to operands (drill-in vs top-level).
- Edit mask shape vs masked content while keeping preview.
- Clear manual overrides while linked to typography/theme systems (where applicable).

Current-implementation paint parity (must match):
- Multi-fill: `style.fills[]` supports solid/theme-slot, gradient, image (assetId), video (assetId), and code fills.
- Multi-stroke: `style.strokes[]` supports multiple strokes with width/position/dash/cap/join/opacity/blendMode.
- Shapes additions must not fork or duplicate these inspector behaviors.

## 4. Acceptance
- No new hardcoded styles; dark/light works; accent-driven interactions.

Quality critique (gaps + risks)
- This spec was previously too minimal and didn’t define behavior for boolean/mask nodes, which is where styling ambiguity causes the most UX confusion.
- Styling changes must remain compatible with the current DOM renderer’s fill/stroke stacking and must not assume a single fill/stroke.
