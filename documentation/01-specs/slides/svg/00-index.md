# Slides — SVG Objects (Specs)

**Status:** Planned

This section specifies the planned support for inserting and rendering SVG objects on Story slides.

## Documents

- [01-svg-support-plan.md](01-svg-support-plan.md) — End-to-end plan (UX/UI/PI + architecture)
- [02-supported-svg-and-compat.md](02-supported-svg-and-compat.md) — What SVG we support (standard/version/features) and how we handle gaps
- [03-property-inspector-svg.md](03-property-inspector-svg.md) — Property Inspector controls and constraints
- [04-data-model-and-rendering.md](04-data-model-and-rendering.md) — Data model, rendering pipeline, caching, performance
- [05-security-sanitization.md](05-security-sanitization.md) — Sanitization, security boundaries, and threat model
- [06-serialization-and-str-format.md](06-serialization-and-str-format.md) — How SVG saves/loads in `.str` files (ZIP + assets)

## Scope

- Add: Insert SVG onto canvas as a single editable object.
- Edit: Transform (position/size/rotation) like other objects; limited SVG-specific controls.
- Don’t add (initially): vector path editing, per-node editing, animation timeline for SVG.
