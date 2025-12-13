# SVG Serialization & .str File Format Integration

**Status:** Planned
**Last updated:** Dec 13, 2025

This document specifies how SVG objects are stored in Story’s `.str` presentation format.

It is intentionally aligned with:

- The existing serializer/deserializer behavior (`PresentationSerializer` / `PresentationDeserializer`)
- The `.str` ZIP layout described in [File Format & Storage](../../collaboration/storage/file-format-storage.md)

## 1) Principles alignment

- **App integrity:** store SVG data in a way that round-trips cleanly with existing save/load.
- **Security & privacy:** persist *sanitized* SVG only; never persist an unsanitized original.
- **Performance:** avoid duplicating large SVG strings across slides; dedupe via assets.
- **Compatibility:** must work with undo/redo, incremental saves, and collaboration diffs.

## 2) Where SVG lives in the `.str` ZIP

Story saves one JSON file per slide:

- `document/slides/slide-<slideId>.json`

SVG elements in that JSON should **reference** an SVG asset stored under `assets/`.

Recommended storage:

- `assets/vectors/<sha256>.svg` (stored as text)

This enables:

- Deduplication (the same SVG used multiple times)
- Smaller slide JSON
- Future byte-range or lazy access patterns (consistent with asset strategy)

## 3) Element schema (storage-facing)

An SVG element stored in slide JSON includes:

- Core element geometry fields (x/y/width/height/rotation)
- `type: "svg"`
- `svg` payload with:
  - `assetId` (hash key)
  - `sourceFileName` (optional)
  - `viewBox` + intrinsic size metadata (optional but recommended)
  - `fitMode` (`contain` | `cover` | `stretch`)
  - `importWarnings[]` (optional)
  - `fallback` state (optional) describing raster fallback

Important: the serializer/deserializer currently copy “all properties” for slides/elements.
That means adding new fields is forward-compatible as long as we keep them JSON-serializable.

## 4) Asset index integration

Add SVG assets into the existing asset inventory (conceptually):

- `assets/index.json` should include `.svg` entries with:
  - `originalName`
  - `type: "image/svg+xml"`
  - `size`
  - `hash`
  - `references` (slide/element IDs)

Also update content-type mappings to include:

- `.svg` → `image/svg+xml`

## 5) Sanitization and persistence rules

- Sanitization runs at import and again on paste/replace (defense in depth).
- The stored asset content is the **sanitized SVG**.
- Any disallowed content is removed before writing to disk.

## 6) Collaboration implications

In collaborative scenarios:

- Referencing shared assets by hash avoids sending huge SVG payloads repeatedly.
- Changes to the SVG source should be treated like an asset update + element reference update.

(Exact collaboration protocol is outside this doc, but storage choices should support it.)

## 7) Migration/versioning

- If we later change SVG element fields, we rely on existing manifest format versioning.
- Old files should continue to load:
  - Unknown fields are ignored by older clients.
  - New clients should provide defaults for missing SVG fields.
