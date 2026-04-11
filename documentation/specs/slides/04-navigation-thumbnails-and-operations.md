# Slides — Navigation, Thumbnails, and Core Operations (Implementation)

**Last updated:** Dec 13, 2025

This doc captures what’s currently implemented for slide navigation, thumbnail rendering, and core CRUD-style slide operations.

## 1) Navigation model

- The editor tracks the active slide via `editor.activeSlideId`.
- Changing the active slide updates the canvas and Property Inspector context.

## 2) Thumbnails

- Thumbnails are rendered from the same underlying slide model (style resolution uses real slide IDs).
- Thumbnails update when Color Theme assignments change (including repeated theme changes).

## 3) Core slide operations

Store actions exist for:

- `ADD_SLIDE`
- `DELETE_SLIDE`
- `DUPLICATE_SLIDE`
- `UPDATE_SLIDE`

Behavior is implementation-driven and validated by tests.

## 4) What’s intentionally not specified here

Several older documents in the archive describe future/aspirational UX for:

- Presenter View
- Full presentation/reading/kiosk modes
- Advanced slide animations
- Comment/review collaboration UX
- Section UI

Those features are not treated as “spec’d + guaranteed” unless they exist in the current implementation.
If/when implementation lands, the spec should be updated from the code/tests.
