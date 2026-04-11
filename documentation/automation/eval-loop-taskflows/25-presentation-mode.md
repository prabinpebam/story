# 25 — Presentation Mode

> Taskflows for entering/exiting presentation, keyboard/touch navigation, build system, kiosk mode, presenter view, asset prefetch, and screen features.

## Entry / Exit

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| PRS-01 | Enter presentation | Click play button | `SET_MODE('presentation')`; fullscreen requested; notes panel auto-closes | `SET_MODE` |
| PRS-02 | Exit presentation | Press Escape | Returns to edit mode; fullscreen exited | `SET_MODE('edit')` |
| PRS-03 | Exit from kiosk | Press Escape in kiosk mode | Exits kiosk; returns to edit | `SET_MODE('edit')` |
| PRS-04 | External fullscreen exit | Press F11 or browser button | Fullscreen exited gracefully; presentation continues | — |

## Keyboard Navigation

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| PRS-05 | Next build/slide (Right) | ArrowRight, ArrowDown, Space, Enter, PageDown, or `n` | If builds remaining: `buildIndex++`; else: next visible slide with `buildIndex=-1` | `NEXT_BUILD` or `SET_ACTIVE_SLIDE` |
| PRS-06 | Previous build/slide (Left) | ArrowLeft, ArrowUp, Backspace, PageUp, or `p` | If `buildIndex > -1`: `buildIndex--`; else: prev visible slide with `buildIndex=buildCount-1` | `PREV_BUILD` or `SET_ACTIVE_SLIDE` |
| PRS-07 | Go to first slide | Home key | Jump to first visible slide | `SET_ACTIVE_SLIDE` |
| PRS-08 | Go to last slide | End key | Jump to last visible slide | `SET_ACTIVE_SLIDE` |
| PRS-09 | Numeric jump | Type digits (0-9) then Enter | PowerPoint-style: buffer builds number, Enter navigates to slide N | `PRESENTATION_JUMP_TO` |
| PRS-10 | Go back | Alt+Left or Alt+Backspace | Pop from back-stack (max depth 10); PowerPoint-style navigation history | `PRESENTATION_GO_BACK` |
| PRS-11 | Key repeat throttle | Hold down navigation key | `INPUT_THROTTLE_MS` prevents rapid-fire navigation | — |

## Touch Navigation

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| PRS-12 | Swipe left → next | Left swipe (min 50px, max 500ms, max 30px vertical deviation) | Same as Right Arrow | `NEXT_BUILD` or `SET_ACTIVE_SLIDE` |
| PRS-13 | Swipe right → previous | Right swipe with same thresholds | Same as Left Arrow | `PREV_BUILD` or `SET_ACTIVE_SLIDE` |

## Click to Advance

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| PRS-14 | Click advances | Left-click on slide area | Advance to next build (default `action: 'next-build'`) | `NEXT_BUILD` |
| PRS-15 | Click excluded regions | Click on `.hud-controls`, `#presentation-hud`, links, buttons, inputs, videos, `.code-canvas` | Click does NOT advance; handled by target element | — |

## Build System

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| PRS-16 | Build count inference | Slide loaded in presentation | `getBuildCountForSlide()` counts elements with `el.animations.entrance !== 'none'` | — |
| PRS-17 | Reveal next element | Next build triggered | `buildIndex` incremented; elements up to index visible, rest hidden | `NEXT_BUILD` |
| PRS-18 | Hide element (prev build) | Prev build triggered | `buildIndex` decremented; element at index+1 hidden | `PREV_BUILD` |
| PRS-19 | All builds revealed | Continue past last build | Navigate to next slide | `SET_ACTIVE_SLIDE` |
| PRS-20 | Skip to all revealed | Navigate backwards to slide | `buildIndex = buildCount - 1` (all elements shown) | — |
| PRS-21 | Hidden slides skipped | Navigate through slides | `getNextVisibleIndex()` / `getPrevVisibleIndex()` skip hidden slides | — |

## Screen Features

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| PRS-22 | Toggle black screen | Press `b` or `.` | Opaque black overlay; mutually exclusive with white | `TOGGLE_BLACK_SCREEN` |
| PRS-23 | Toggle white screen | Press `w` or `,` | Opaque white overlay; mutually exclusive with black | `TOGGLE_WHITE_SCREEN` |
| PRS-24 | Toggle laser pointer | Press `l` | Laser pointer on `#laser-canvas`; follows mouse | `TOGGLE_LASER` |
| PRS-25 | Toggle grid view | Press `g` | Thumbnail grid overlay of all slides | `TOGGLE_GRID_VIEW` |
| PRS-26 | Idle cursor hiding | No mouse movement for 5 seconds | Cursor hidden automatically; reappears on movement | — |

## Kiosk Mode

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| PRS-27 | Configure kiosk | Set kiosk config | `{enabled, autoAdvanceSeconds: 5, loop, passwordHash, disableInput}` | `SET_KIOSK_CONFIG` |
| PRS-28 | Auto-advance | Timer fires after autoAdvanceSeconds | `computeKioskAdvanceAction()`: build.next → slide.next → slide.goto (loop) → stop | — |
| PRS-29 | Disable manual input | `disableInput: true` | All navigation except Escape blocked in kiosk | — |
| PRS-30 | Kiosk loop | Last slide reached with `loop: true` | Loops back to first slide | — |
| PRS-31 | Timer interrupt | User interacts during kiosk | Auto-advance timer reset | — |

## Presenter View

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| PRS-32 | Open presenter view | Click presenter view button or auto-open on multi-display | Popup window via `window.open(url + '?presenter=1')` | — |
| PRS-33 | Sync via BroadcastChannel | Navigate in either window | `BroadcastChannel('presentation-sync')` sends: hello, state-sync, navigate, toggle-feature, exit, swap-role | — |
| PRS-34 | Current slide preview | Presenter panel renders | Live `SlideView` of current slide | — |
| PRS-35 | Next slide preview | Presenter panel renders | Live `SlideView` of next slide | — |
| PRS-36 | Speaker notes display | Presenter panel renders | Notes from `notesDoc` rendered as safe HTML | — |
| PRS-37 | Progress display | Presenter panel renders | "Slide X/Y · Build A/B" text | — |
| PRS-38 | Timer | Presenter panel renders | Elapsed time + wall clock; pause/resume; rehearsal timings per-slide | — |
| PRS-39 | Presenter controls | Presenter panel buttons | Prev, Next, Pause, Reset, Rehearse, Grid, Laser, Black, White, Swap Displays, Exit | — |
| PRS-40 | Swap displays | Click Swap Displays | Swaps presenter/audience roles via `swap-role` message | — |
| PRS-41 | Numeric jump display | Type numbers in presenter | Jump indicator shows typed number | — |
| PRS-42 | Watchdog | Presenter window closed | Polls every 1s; prompts reopen if closed during show | — |
| PRS-43 | Auto-open on multi-display | Multiple displays detected | `DisplayAdapter.getDisplays()` triggers auto-open | — |

## Asset Prefetch

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| PRS-44 | Prefetch tiers | Navigation in presentation | Active (current), hot (±1), warm (±3), cold; 3-tier priority | — |
| PRS-45 | Image prefetch | Slide with image fills loaded | `new Image()` + `img.decode()`; timeout 2500ms | — |
| PRS-46 | Video prefetch | Slide with video fills (hot/active) | `<video preload="auto">`; timeout 3000ms | — |
| PRS-47 | Offline detection | `navigator.onLine === false` | Prefetch skipped for offline slides | — |
| PRS-48 | LRU pruning | More than 16 slides prefetched | Oldest prefetched slides evicted: `maxRetainedSlides=16` | — |
| PRS-49 | Navigation gating | Navigate to slide with hot assets | Blocks until hot-tier assets render-ready | — |

## Accessibility

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| PRS-50 | ARIA live region | Navigate slides/builds | Announces "Slide X of Y, Build A of B" for screen readers | — |
