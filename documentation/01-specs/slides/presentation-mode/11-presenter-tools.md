# Presenter Tools (Dual‑screen / Presenter View)

This document defines Presenter View at **PowerPoint parity**.

Hard constraints:
- Audience DOM must remain **audience‑clean**.
- Presenter‑only content (notes/diagnostics) must never leak to the audience surface or sync payloads.
- Presenter View must behave “smart by default” when a second display is connected.

---

## 0) Definitions
- **Audience surface**: what attendees see.
- **Presenter surface**: what the speaker sees.
- **Show**: one active presentation session.
- **Display**: physical monitor/projector.
- **Window**: browser window/tab.
- **Host**: runtime environment (web browser vs desktop wrapper).

---

## 1) PowerPoint parity baseline
Presenter View MUST provide:
- Automatic dual‑display behavior when possible.
- A dedicated presenter surface: current slide, next slide, notes, timer/clock, slide/build progress.
- Presenter navigation controls (slide/build, jump, thumbnails/sorter).
- In‑show display management: swap audience/presenter.
- Robustness: popup blockers, accidental close/reopen, display hotplug.

---

## 2) Entry behavior (automatic + manual)

### 2.1 Start show actions
- MUST support starting a show:
  - From beginning
  - From current slide
  - From a chosen slide (via grid / jump)

### 2.2 Default behavior (single display)
- MUST start a show in a single window.
- SHOULD offer presenter tools as an in‑window panel if a second display is not available.

### 2.3 Default behavior (two displays)
- MUST automatically start in Presenter View mode when:
  - multiple displays are detected with confidence by the host, AND
  - the user starts a show.

Default assignment:
- Audience surface SHOULD go fullscreen on the external display.
- Presenter surface SHOULD remain on the primary display.

### 2.4 Manual controls (always present)
- MUST provide explicit actions:
  - Open Presenter View
  - Close Presenter View
  - Swap Displays
  - Return to single‑window viewer

These MUST work regardless of whether automatic detection is supported.

---

## 3) Connected display detection + placement

### 3.1 Requirements
- MUST implement multi‑display behavior via a Host Display Adapter.
- MUST not block the show if display detection fails.
- MUST surface actionable guidance when permissions/popup policies prevent auto behavior.

### 3.2 Host Display Adapter (contract)
The app MUST route display enumeration/placement through an adapter (host‑provided implementation):

```ts
type DisplayInfo = { id: string; name?: string; isPrimary?: boolean };

type DisplayCapabilities = {
  canEnumerateDisplays: boolean;
  canPlaceWindows: boolean;
  canFullscreenOnTargetDisplay: boolean;
};

type DisplayAdapter = {
  getCapabilities(): Promise<DisplayCapabilities>;
  getDisplays(): Promise<DisplayInfo[]>; // may be [] if unsupported
  onDisplaysChanged?(cb: () => void): () => void;

  // Optional placement primitives
  placeWindowOnDisplay?(win: Window, displayId: string): Promise<void>;
  requestFullscreenOnDisplay?(displayId: string): Promise<void>;
};
```

### 3.3 Web implementation guidance (minimum viable)
- SHOULD use the Multi‑Screen / Window Placement capability when available.
  - Example signals: `navigator.permissions` + `window.getScreenDetails` (where supported).
- MUST gracefully fall back when not supported:
  - Still open Presenter View (manual or automatic Tier‑B),
  - Ask the user to move windows to the desired screens.

### 3.4 Desktop host implementation guidance (PowerPoint‑level)
- Desktop hosts (Electron/Tauri/etc) SHOULD implement Tier‑A:
  - enumerate displays,
  - place presenter and audience windows,
  - swap displays during a show,
  - detect hotplug.

---

## 4) Display assignment + Swap Displays

### 4.1 Assignment
- MUST support assigning which display shows Audience and which shows Presenter.
- MUST preserve show position during reassignment (slide index + build index + overlays).

### 4.2 Swap Displays
- MUST provide a one‑action Swap Displays.
- MUST preserve show position.
- MUST NOT leak notes/diagnostics during swap (including transient DOM).

### 4.3 Persistence
- SHOULD persist the last successful assignment policy per device/host.

---

## 5) Presenter View surface (information architecture)

### 5.1 Core panes (PowerPoint parity)
Presenter View MUST display:
- **Current slide** pane (matches audience)
- **Next slide** pane (preview)
- **Notes** pane (scrollable)
- **Timing** pane (elapsed timer + clock)
- **Progress** pane (slide X of N, build k of m when builds exist)

### 5.2 Navigation surfaces
Presenter View MUST provide at least one of:
- Slide thumbnails strip, OR
- Slide sorter grid/list, OR
- A jump-to-slide control with visible feedback.

Presenter View MUST support jump by number (e.g., type digits then Enter).

### 5.3 Presenter tools (PowerPoint parity)
Presenter View MUST include controls to:
- Next/Previous
- Toggle laser/pointer
- Toggle black/white screen overlays
- Open slide sorter/thumbnails
- Exit show

Presenter View SHOULD include:
- Pen/ink annotations, erase, and clear (presenter-only),
- A “laser active” indicator,
- Optional diagnostics (FPS/frame time/memory/cache tier) behind a presenter-only toggle.

---

## 6) Notes behavior

### 6.1 Rendering
- MUST render notes with readable typography (line wrapping, paragraphs).
- MUST support scroll and text selection.
- SHOULD support adjustable note text size.

### 6.2 Editing
- If the product supports editing notes during a show, it MUST be presenter-only and safe.
- If editing during a show is not supported, Presenter View MUST state that clearly.

---

## 7) Keyboard + input parity

Presenter View MUST support:
- Next: `ArrowRight`, `PageDown`, `Space`, `Enter`
- Previous: `ArrowLeft`, `PageUp`, `Backspace`
- First/Last: `Home` / `End`
- Jump: digits then `Enter` (with a visible input affordance)
- Black screen: `B`
- White screen: `W`
- Exit: `Esc`

Notes:
- These keybindings mirror common presenter expectations and should be consistent with the broader input spec.

---

## 8) Windowing model + reliability

### 8.1 Separate windows
- MUST implement Presenter View as a separate window (not a modal).
- MUST implement the audience surface as a distinct, audience-clean surface.

### 8.2 Popup blockers
- If the presenter window cannot open:
  - MUST continue the show in audience/viewer mode,
  - MUST provide a visible, actionable instruction to allow popups.

### 8.3 Close/reopen recovery
- MUST detect presenter window closure during an active show.
- MUST allow reopening without losing position.

### 8.4 Hotplug
- SHOULD detect display connect/disconnect.
- MUST keep the audience surface stable if displays change.

---

## 9) Security + privacy boundary (non‑negotiable)

### 9.1 Audience cleanliness
- Notes MUST NOT appear in the audience DOM.
- Presenter UI MUST NOT appear in the audience DOM.
- Presenter-only diagnostics MUST NOT appear in the audience DOM.

### 9.2 Sync payload hygiene
- Notes MUST NOT be included in sync messages.
- Diagnostics MUST NOT be included in audience-bound messages.
- All cross-window messages MUST be allowlisted and schema-validated.

### 9.3 Logging/telemetry
- MUST NOT log note content.
- MUST NOT emit telemetry containing note content or slide content.

---

## 10) DOM contract (test hooks)

Presenter View MUST expose stable selectors for automated tests:
- `[data-testid="presenter-view-panel"]`
- `[data-testid="presenter-current-slide"]`
- `[data-testid="presenter-next-preview"]`
- `[data-testid="presenter-notes"]`
- `[data-testid="presenter-elapsed"]`
- `[data-testid="presenter-clock"]`
- `[data-testid="presenter-swap-displays"]`

Audience window MUST NOT contain `[data-testid="presenter-view-panel"]`.

---

## 11) Acceptance tests

### 11.1 Automated (CI proxies)
Playwright MUST validate:
- Presenter window opens (manual path).
- Lockstep slide navigation.
- Close→reopen recovery.
- Malformed sync messages are ignored.
- Privacy boundary (no notes/diagnostics leaked to audience DOM or sync payload).

Vitest MUST validate:
- Sync message sanitizer/validator behavior.
- Show position snapshotting (slide + build indices) used for reopen.

### 11.2 Manual / hardware checklist (host dependent)
- Start show with 2 displays → presenter view opens automatically (where host supports detection).
- Swap displays during show.
- Hotplug a display during show.

---

## 12) Future (beyond PowerPoint)
Non-blocking extensions:
- Pace coaching and rehearsal insights.
- Remote presenter pairing.
- Rich next-build preview and cue list.
- Streaming/recording overlays.
