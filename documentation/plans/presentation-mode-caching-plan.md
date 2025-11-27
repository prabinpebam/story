# Presentation Mode Caching - Implementation Plan

## Overview

This plan outlines the implementation of the presentation mode caching system, which ensures seamless, instant transitions during presentations.

**Specification:** [Presentation Mode Caching](../specs/presentation/presentation-mode-caching.md)

**Estimated Total Time:** 40-50 hours

**Priority:** High (Critical for user experience)

---

## Dependencies

| Dependency | Status | Notes |
|------------|--------|-------|
| Rendering Architecture | In Progress | PresentationRenderer needed |
| Asset Management | Planned | Asset cache layer needed |
| Code Fill Execution | Complete | Worker-based execution ready |
| Progressive Loading | Planned | Streaming loader needed |

---

## Phase 1: Core Cache Infrastructure (12-15 hours)

### 1.1 Slide Cache Pool

**File:** `src/core/presentation/SlideCachePool.js`

**Tasks:**
- [ ] Implement `HotCache` (WeakMap for GPU-ready slides)
- [ ] Implement `WarmCache` (Map for decoded slides)
- [ ] Implement `ColdCache` (Map for raw slide JSON)
- [ ] Add cache temperature promotion/demotion
- [ ] Implement LRU eviction logic

**Validation:**
- [ ] Slides can move between temperature levels
- [ ] Eviction respects memory limits
- [ ] Cache hit/miss tracking works

---

### 1.2 Memory Manager

**File:** `src/core/presentation/MemoryManager.js`

**Tasks:**
- [ ] Implement GPU memory tracking
- [ ] Implement heap memory estimation
- [ ] Add memory budget configuration
- [ ] Implement emergency eviction trigger
- [ ] Add memory pressure detection

**API:**
```javascript
class MemoryManager {
    getGPUUsage(): number;
    getHeapUsage(): number;
    isUnderPressure(): boolean;
    requestEviction(bytesNeeded: number): void;
    registerResource(id: string, size: number, type: 'gpu' | 'heap'): void;
    releaseResource(id: string): void;
}
```

**Validation:**
- [ ] Memory tracking is accurate within 10%
- [ ] Emergency eviction triggers at 90% budget
- [ ] Resources properly registered/released

---

### 1.3 Preload Scheduler

**File:** `src/core/presentation/PreloadScheduler.js`

**Tasks:**
- [ ] Implement priority queue for slide loading
- [ ] Add scheduling based on navigation direction
- [ ] Implement adaptive preload depth
- [ ] Add linked slide detection
- [ ] Implement section-awareness

**API:**
```javascript
class PreloadScheduler {
    scheduleSlide(index: number, priority: 'urgent' | 'high' | 'medium' | 'low'): void;
    updateNavigationContext(currentIndex: number, direction: number): void;
    getNextToLoad(): { index: number, priority: string } | null;
    cancelPending(indices: number[]): void;
}
```

**Validation:**
- [ ] Priority queue orders correctly
- [ ] Direction changes update priorities
- [ ] Linked slides are detected and scheduled

---

## Phase 2: Asset Handling (10-12 hours)

### 2.1 Image Preloader

**File:** `src/core/presentation/ImagePreloader.js`

**Tasks:**
- [ ] Implement progressive quality loading (thumbnail → preview → full)
- [ ] Add GPU texture upload management
- [ ] Implement decode prioritization
- [ ] Add asset readiness state tracking

**Validation:**
- [ ] Images load in progressive quality steps
- [ ] GPU textures are uploaded without blocking
- [ ] Readiness states update correctly

---

### 2.2 Video Prebuffer

**File:** `src/core/presentation/VideoPrebuffer.js`

**Tasks:**
- [ ] Implement video element pooling
- [ ] Add 5-second pre-buffer logic
- [ ] Implement buffer monitoring
- [ ] Add autoplay preparation (muted trick)
- [ ] Handle video cleanup on eviction

**API:**
```javascript
class VideoPrebuffer {
    prepareVideo(slideIndex: number, element: VideoElement): Promise<void>;
    getVideoForSlide(slideIndex: number): HTMLVideoElement | null;
    isBuffered(slideIndex: number): boolean;
    releaseVideo(slideIndex: number): void;
}
```

**Validation:**
- [ ] Videos pre-buffer 5 seconds
- [ ] Autoplay works without user gesture (muted)
- [ ] Video elements are reused (pooling)

---

### 2.3 Code Fill Preparer

**File:** `src/core/presentation/CodeFillPreparer.js`

**Tasks:**
- [ ] Pre-execute code fills for upcoming slides
- [ ] Cache rendered output (canvas/image data)
- [ ] Handle animated code fills (pre-render frames)
- [ ] Implement execution prioritization

**Validation:**
- [ ] Code fills execute before slide is shown
- [ ] Animated code fills have frames ready
- [ ] Execution doesn't block main thread

---

## Phase 3: Prediction Engine (8-10 hours)

### 3.1 Navigation Predictor

**File:** `src/core/presentation/NavigationPredictor.js`

**Tasks:**
- [ ] Track navigation patterns (forward, back, jump)
- [ ] Detect linked slides from current slide
- [ ] Identify section header slides
- [ ] Calculate prediction confidence scores
- [ ] Adapt based on user behavior

**API:**
```javascript
class NavigationPredictor {
    getPredictedSlides(currentIndex: number): PredictedSlide[];
    recordNavigation(fromIndex: number, toIndex: number): void;
    setNavigationMode(mode: 'linear' | 'random' | 'presenter'): void;
}

interface PredictedSlide {
    index: number;
    probability: number;  // 0-1
    reason: 'adjacent' | 'linked' | 'section' | 'history';
}
```

**Validation:**
- [ ] Adjacent slides always have high probability
- [ ] Linked slides are detected
- [ ] Patterns influence predictions

---

### 3.2 Complexity Analyzer

**File:** `src/core/presentation/ComplexityAnalyzer.js`

**Tasks:**
- [ ] Analyze slide element composition
- [ ] Calculate complexity scores
- [ ] Determine adaptive preload depth
- [ ] Track resource requirements per slide

**Validation:**
- [ ] Complex slides have higher scores
- [ ] Preload depth adjusts based on complexity
- [ ] Video slides trigger reduced caching

---

## Phase 4: Integration (8-10 hours)

### 4.1 Presentation Cache Controller

**File:** `src/core/presentation/PresentationCacheController.js`

**Tasks:**
- [ ] Orchestrate all caching subsystems
- [ ] Handle presentation mode entry/exit
- [ ] Coordinate with slide transitions
- [ ] Manage presenter view sync
- [ ] Implement preload progress reporting

**API:**
```javascript
class PresentationCacheController {
    async initialize(presentation: Presentation, startSlide: number): Promise<void>;
    onSlideChange(newIndex: number, direction: number): void;
    onTransitionStart(fromIndex: number, toIndex: number): void;
    onTransitionEnd(newIndex: number): void;
    onGridViewEnter(): void;
    onGridViewExit(selectedIndex: number): void;
    getPreloadProgress(): PreloadProgress;
    destroy(): void;
}
```

---

### 4.2 PresentationRenderer Integration

**File:** Update `src/core/renderer/PresentationRenderer.js`

**Tasks:**
- [ ] Integrate with SlideCachePool
- [ ] Use cached renders for transitions
- [ ] Coordinate GPU resource management
- [ ] Handle cache misses gracefully

---

### 4.3 Presenter View Sync

**File:** `src/core/presentation/PresenterViewSync.js`

**Tasks:**
- [ ] Implement BroadcastChannel messaging
- [ ] Share cache status between windows
- [ ] Coordinate slide preloading
- [ ] Handle presenter window cache requests

---

## Phase 5: Optimization & Polish (5-6 hours)

### 5.1 Performance Monitoring

**Tasks:**
- [ ] Add cache hit/miss metrics
- [ ] Track transition latency
- [ ] Monitor memory usage over time
- [ ] Add warning indicators for memory pressure

---

### 5.2 Edge Cases

**Tasks:**
- [ ] Handle very large presentations (100+ slides)
- [ ] Handle low-memory devices
- [ ] Handle network disconnection mid-presentation
- [ ] Handle corrupt asset recovery

---

### 5.3 UI Indicators

**Tasks:**
- [ ] Preload progress bar before presentation
- [ ] Memory pressure warning in presenter view
- [ ] Asset loading indicator (if unavoidable)

---

## Testing Strategy

### Unit Tests

```javascript
describe('SlideCachePool', () => {
    test('promotes slides from cold to warm to hot');
    test('evicts LRU slides when at capacity');
    test('respects memory budget');
});

describe('NavigationPredictor', () => {
    test('predicts adjacent slides with high probability');
    test('detects and prioritizes linked slides');
    test('adapts to navigation patterns');
});

describe('VideoPrebuffer', () => {
    test('buffers 5 seconds of video');
    test('pools video elements efficiently');
    test('releases resources on eviction');
});
```

### Integration Tests

```javascript
describe('Presentation Mode Caching', () => {
    test('next slide renders in <16ms (1 frame)');
    test('previous slide renders in <16ms');
    test('jump to slide renders in <100ms');
    test('grid view displays all thumbnails in <200ms');
    test('memory stays within budget during full presentation');
});
```

### Performance Tests

```javascript
describe('Performance', () => {
    test('50-slide presentation loads first slide in <500ms');
    test('100-slide presentation stays under memory budget');
    test('transitions maintain 60fps');
    test('video playback is seamless');
});
```

---

## Rollout Plan

### Phase A: Internal Testing (Week 1)
- Complete core cache infrastructure
- Test with sample presentations
- Measure baseline performance

### Phase B: Feature Flag Release (Week 2)
- Enable for beta users
- Collect performance metrics
- Gather feedback on edge cases

### Phase C: General Release (Week 3)
- Enable for all users
- Monitor memory usage reports
- Fine-tune memory budgets based on telemetry

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Memory overflow on low-end devices | Medium | High | Adaptive budget, aggressive eviction |
| Video buffering failures | Low | Medium | Fallback to load-on-demand |
| Prediction misses | Medium | Low | Always cache adjacent slides |
| Worker thread bottleneck | Low | Medium | Increase worker pool size |

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Next slide latency (p95) | <16ms | Performance.measure |
| Cache hit rate | >95% | Cache instrumentation |
| Memory budget compliance | 100% | Memory tracking |
| Transition frame drops | 0 | requestAnimationFrame tracking |
| User-reported lag complaints | <1% | Telemetry |

---

*This plan implements Phase 4 (Presentation Polish) of the overall rendering overhaul.*
