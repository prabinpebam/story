# Presenter Tools (Dual-screen / Presenter View)

## Goals
- Provide presenter with private notes, timing, and preview.
- Maintain strict privacy boundary (notes never in audience feed).

---

## 1) Presenter View Window
### Requirements
- MUST open as separate window (not modal).
- MUST sync position with audience window.
- MUST survive accidental close (prompt to reopen).
- SHOULD allow presenter to choose which display shows audience vs presenter view.

### Window Creation
```typescript
function openPresenterView(): Window {
  const presenterWindow = window.open(
    '/presenter-view.html',
    'presenter-view',
    'width=1280,height=720,menubar=no,toolbar=no'
  );
  
  if (!presenterWindow) {
    throw new Error('Popup blocked - cannot open presenter view');
  }
  
  // Setup sync channel
  const channel = new BroadcastChannel('presentation-sync');
  
  // Send initial state
  channel.postMessage({
    type: 'state-sync',
    state: getCurrentPresentationState()
  });
  
  // Handle window close
  presenterWindow.addEventListener('beforeunload', () => {
    const reopen = confirm('Presenter view closed. Reopen?');
    if (reopen) {
      setTimeout(() => openPresenterView(), 100);
    }
  });
  
  return presenterWindow;
}
```

---

## 2) Presenter View Content
### Requirements
- MUST show:
  - Current slide (same as audience)
  - Next slide preview
  - Speaker notes for current slide
  - Elapsed time / timer
- SHOULD show:
  - Build progress indicator
  - Slide counter
  - Diagnostics (FPS, memory, cache status)

### Layout
```html
<div class="presenter-view">
  <div class="pv-main">
    <div class="pv-current-slide">
      <!-- Current slide render -->
    </div>
    <div class="pv-notes">
      <h3>Speaker Notes</h3>
      <div class="notes-content">
        <!-- Slide notes here -->
      </div>
    </div>
  </div>
  
  <div class="pv-sidebar">
    <div class="pv-next-preview">
      <h4>Next Slide</h4>
      <!-- Next slide thumbnail -->
    </div>
    
    <div class="pv-timer">
      <div class="elapsed">00:15:32</div>
      <div class="clock">2:45 PM</div>
    </div>
    
    <div class="pv-progress">
      <span>Slide 5 / 24</span>
      <span>Build 2 / 4</span>
    </div>
    
    <div class="pv-diagnostics" (if enabled)>
      <div>FPS: 60</div>
      <div>Memory: 245 MB</div>
      <div>Cache: HOT ready</div>
    </div>
  </div>
</div>
```

---

## 3) Privacy Boundary
### Requirements
- MUST enforce strict separation: notes/diagnostics never appear in audience DOM.
- MUST sanitize cross-window messages (no note content in sync protocol).
- MUST provide visual indicator when presenter view is active.

---

## 4) Sync Protocol
### Requirements
- MUST keep presenter and audience windows in lockstep (slide/build position).
- MUST handle window close/reopen without losing position.
- SHOULD use BroadcastChannel or postMessage for sync.

### Message Schema
```typescript
type SyncMessage = 
  | { type: 'state-sync'; state: PresentationState }
  | { type: 'navigate'; slideIndex: number; buildIndex: number }
  | { type: 'toggle-feature'; feature: 'laser' | 'grid' | 'black' | 'white'; active: boolean }
  | { type: 'exit' };

// Audience window listens and updates
channel.addEventListener('message', (e: MessageEvent<SyncMessage>) => {
  switch (e.data.type) {
    case 'state-sync':
      updatePresentationState(e.data.state);
      break;
    case 'navigate':
      navigateToSlide(e.data.slideIndex, e.data.buildIndex);
      break;
    case 'toggle-feature':
      toggleFeature(e.data.feature, e.data.active);
      break;
    case 'exit':
      exitPresentation();
      break;
  }
});

// Presenter view sends commands
function sendNavigate(slideIndex: number, buildIndex: number) {
  channel.postMessage({ type: 'navigate', slideIndex, buildIndex });
}
```

### Privacy Boundary
- **Speaker notes MUST NOT be in sync messages**.
- Presenter view fetches notes directly from deck data, never via sync channel.
- Audience window never receives or has access to note content.

---

## Telemetry
- Presenter view usage rate
- Window close/reopen events

## Test plan
- Dual-screen setup (physical or simulated)
- Window close/reopen during show
- Privacy boundary audit (ensure notes never in audience DOM)

## Edge cases
- No second display available
- Display hotplug during show
- Sleep/wake with presenter view open
