# Benchmark Gap Checklist — PowerPoint / Keynote / Google Slides

This document enumerates “table stakes” behaviors expected from top-tier presentation tools. Each item must be mapped to **Parity / Surpass / Out of scope** with an explicit rationale.

**How to use**
- For each capability, add:
  - Decision: Parity / Surpass / Out of scope
  - Owner + milestone
  - Acceptance criteria link
  - Notes + edge cases

---

## 1) Show Configuration (Settings)
### 1.1 Start options
- Start from beginning
- Start from current slide
- Start from a selected slide
- Start from a named “custom show” / playlist

### 1.2 Show type
- Fullscreen presentation
- Present in window (screen-share friendly)
- Reading / preview mode

### 1.3 Display routing
- Choose target display (monitor/projector)
- Swap presenter/audience displays
- Remember per-device preference

### 1.4 Looping / kiosk
- Loop until Esc
- Stop at end
- Loop N times
- Kiosk restrictions (optional password to exit)

### 1.5 Timings / rehearsal
- Ignore timings
- Use recorded timings
- Rehearse timings (per slide + total)
- Per-slide timing overrides

### 1.6 Narration / recording toggles
- Play/ignore narration
- Include/exclude camera/mic track (if recording exists)

### 1.7 Interaction policies
- Allow hyperlinks
- Disable scroll wheel
- Disable keyboard shortcuts (kiosk)
- Disable right-click/context menu

### 1.8 Pointer policies
- Cursor always visible vs auto-hide
- Default tool (laser vs arrow)
- Enable/disable ink tools

---

## 2) Presenter View (Dual-Screen)
- Current + next preview
- Speaker notes with resizable text
- Timer: elapsed + clock + optional remaining
- Pause/reset/rehearsal
- Quick navigation: strip/grid, jump by number, search
- Blank screen controls
- Display hotplug handling

---

## 3) Pointer / Ink / Annotation
- Laser pointer (toggle)
- Pen + highlighter + eraser
- Tool palette: color + thickness
- Clear all ink
- Spotlight / magnifier (optional)
- Persistence policy: ephemeral / per-slide / saved

---

## 4) Navigation & Organization
- Sections + section jump
- Hidden slides behavior
- Custom show / playlist
- Hyperlinks + action buttons

---

## 5) Live Presenting & Remote Control
- Bluetooth clicker compatibility
- Phone-as-clicker pairing + reconnect
- Present-in-window for screen share
- Live captions/subtitles (a11y parity expectation; scope may vary)

---

## 6) Recording & Export
- Record slideshow (audio + optional camera)
- Capture pointer/ink (policy)
- Export to video
- Export handouts/notes
- Deterministic playback for recording/testing

---

## 7) Reliability & Professionalism
- Never embarrass the presenter: no jank, no missing fonts, no scary errors
- Presenter-only surfacing of issues
- Safe fallbacks for missing assets
- Fast exit to editor without corruption
