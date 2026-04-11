# Performance & Caching

## Goals
- Define performance bar and KPI targets.
- Specify caching strategy for instant navigation.
- Ensure scalability to 100+ slide decks.

---

## 1) Performance Bar

### Requirements
- MUST meet targets defined in [04-product-bar-and-benchmarks.md](04-product-bar-and-benchmarks.md).
- First frame MUST render <300ms from entry (target), <800ms max.
- Next/Prev slide MUST respond <50ms (target), <150ms max.
- Grid overlay open MUST render <200ms (target), <500ms max.

### Continuous Verification
- MUST instrument KPIs with telemetry (privacy-safe aggregates).
- MUST fail builds if KPIs regress beyond max thresholds.
- SHOULD provide performance HUD in presenter view (FPS, frame time, memory).

---

## 2) Cache Tiers

### 2.1 ACTIVE (Current Slide)
- **Scope**: Currently visible slide.
- **State**: Fully rendered, all resources loaded.
- **TTL**: Until navigation away.

### 2.2 HOT (Immediate Neighbors)
- **Scope**: Prev and Next slides (±1).
- **State**: **Fully loaded and render-ready**. All images at full resolution, video first frame decoded, fonts loaded.
- **TTL**: Until no longer adjacent.
- **Non-negotiable**: Transition MUST NOT start until next slide is fully loaded (no pixelated images, no loading spinners, no decode-in-progress artifacts).

### 2.3 WARM (Prefetch Window)
- **Scope**: Slides within prefetch window (±3 from current, configurable).
- **State**: Resources loaded, not yet rendered.
- **TTL**: Until outside prefetch window.

### 2.4 COLD (Rest of Deck)
- **Scope**: All other slides.
- **State**: Metadata only (thumbnail, title).
- **TTL**: Indefinite (evict on memory pressure).

---

## 3) Prefetch Strategy

### Requirements
- MUST preload HOT tier (±1) on entering presentation mode.
- MUST ensure HOT tier assets are **fully loaded and render-ready** before allowing navigation to those slides.
- MUST prefetch WARM tier (±3) in idle cycles.
- SHOULD adjust prefetch window based on network/memory conditions.
- MUST deprioritize prefetch during active navigation (no jank).
- MUST block navigation if next slide is not fully loaded (show loading indicator to presenter only, never to audience).

### Adaptive Behavior
- On slow network: Reduce prefetch window to ±1 (HOT only).
- On low memory: Evict WARM tier aggressively.
- On fast navigation: Pause prefetch until navigation settles.

**Transition Readiness**
- Before executing transition to next slide:
  1. Verify all images are fully decoded (use `Image.decode()` or equivalent).
  2. Verify video first frame is ready (metadata loaded, first frame decoded).
  3. Verify all fonts are loaded and applied.
  4. Only then proceed with transition animation.
- If readiness check fails, delay transition and show presenter-only loading indicator (never visible to audience).

---

## 4) Memory Management

### Requirements
- MUST monitor total memory usage (via `performance.memory` if available).
- MUST evict WARM tier if memory exceeds threshold (e.g., 80% of budget).
- SHOULD warn presenter if memory usage is critical.
- MUST never block navigation due to memory pressure.

### Budget
- Target: <500MB for 100-slide deck.
- Max: <1GB for 100-slide deck.

---

## 5) Resource Handling

### 5.1 Images
- MUST use `loading="lazy"` for COLD tier images.
- MUST use `loading="eager"` for ACTIVE and HOT tier images.
- MUST ensure HOT tier images are fully decoded before transition starts.
- MUST NOT initiate transition while HOT tier images are still loading/decoding.
- SHOULD generate thumbnails for grid view (lower resolution).

**Acceptance Criteria**
- Transition to next slide shows full-resolution image immediately, never pixelated or progressive-decode artifacts.

### 5.2 Video
- MUST preload video metadata for ACTIVE slide.
- MUST decode and cache first frame for HOT tier video before transition starts.
- MUST NOT preload video data for WARM/COLD tiers.
- MUST NOT initiate transition while HOT tier video first frame is still decoding.

**Acceptance Criteria**
- Transition to slide with video shows sharp first frame immediately, never loading spinner or black frame.

### 5.3 Fonts
- MUST ensure all fonts are loaded before first frame.
- SHOULD subset fonts to reduce payload.
- MUST ensure HOT tier slides have all required fonts loaded (no font-swap flash during transition).

---

## 6) Network Resilience

### Requirements
- MUST cache all assets in Service Worker (offline-first).
- MUST handle offline gracefully (disable prefetch, use cached assets only).
- SHOULD provide network status indicator in presenter view.

---

## Telemetry
- KPI tracking (first frame, next/prev, grid open, memory usage).
- Cache hit/miss rate per tier.
- Prefetch effectiveness (% of slides accessed that were preloaded).
- Memory pressure events.

## Test plan
- 10-slide, 50-slide, 100-slide deck performance benchmarks.
- Network throttle simulation (slow 3G, offline).
- Memory pressure simulation (low-memory device, background tabs).
- Rapid navigation stress test (prev/next in rapid succession).
- **Transition quality test**: Verify no pixelated/half-loaded assets ever appear during transitions (visual regression).
- **Asset readiness test**: Verify transitions are blocked until HOT tier is fully loaded (automated check for decode completion).

## Edge cases
- Deck with 20MB video on slide 2.
- Deck with 200+ slides (scalability).
- Network drop during navigation.
- Browser tab backgrounded during show.
- **Rapid navigation before HOT tier fully loaded** (verify graceful delay, not broken transition).
