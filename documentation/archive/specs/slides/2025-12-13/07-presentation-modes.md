# Presentation Modes - Full Screen, Reading View, Recording

**Version:** 1.0  
**Last Updated:** December 7, 2025

## 1. Overview

This document specifies all presentation and viewing modes including full-screen presentation, reading view, presenter view, kiosk mode, and recording mode.

---

## 2. Presentation Mode Types

### 2.1 Mode Comparison

| Feature | Edit Mode | Reading View | Presenter View | Full Screen | Kiosk Mode |
|---------|-----------|--------------|----------------|-------------|------------|
| **UI Elements** | All visible | Minimal | Split screen | None | Minimal |
| **Navigation** | Full control | Click/Keys | Dual control | Click/Keys | Auto-advance |
| **Editing** | ✅ Yes | ❌ No | ❌ No | ❌ No | ❌ No |
| **Notes** | Visible | Hidden | Visible | Hidden | Hidden |
| **Animations** | Preview only | ✅ Play | ✅ Play | ✅ Play | ✅ Play |
| **Dual Screen** | ❌ No | ❌ No | ✅ Yes | Optional | ❌ No |
| **Mouse Pointer** | Always visible | Auto-hide | Controllable | Auto-hide | Always hidden |

---

## 3. Full Screen Presentation Mode

### 3.1 Activation

**Methods:**
- Click "Present" button in toolbar
- Keyboard: **F5** (from start) or **Shift + F5** (from current)
- Slide context menu → "Present"

**Behavior:**
1. Application enters full-screen mode
2. All UI chrome disappears
3. Current slide fills entire screen
4. Animations play automatically
5. Mouse auto-hides after 3 seconds

### 3.2 Full Screen Interface

**Visual:**
```
┌─────────────────────────────────────────────────┐
│                                                 │
│                                                 │
│                                                 │
│                                                 │
│               Slide Content                     │
│               (Full Screen)                     │
│                                                 │
│                                                 │
│                                                 │
│                                                 │
│                              [HUD: 5/12]  00:15 │
└─────────────────────────────────────────────────┘
```

**HUD (Heads-Up Display):**
- Appears on mouse move
- Fades after 3 seconds
- Shows: Slide count, timer
- Semi-transparent overlay

```css
.presentation-hud {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 14px;
  opacity: 0;
  transition: opacity 0.3s;
}

.presentation-hud.visible {
  opacity: 1;
}
```

### 3.3 Navigation Controls

**Keyboard:**
| Shortcut | Action |
|----------|--------|
| **→**, **Space**, **Page Down** | Next slide |
| **←**, **Backspace**, **Page Up** | Previous slide |
| **Home** | First slide |
| **End** | Last slide |
| **Number + Enter** | Jump to slide |
| **Esc** | Exit presentation |
| **B** | Blank screen (black) |
| **W** | Blank screen (white) |
| **P** | Pause (toggle timer) |

**Mouse:**
- Click left side → Previous
- Click right side → Next
- Click center → Show menu
- Scroll wheel → Next/Previous

**Touch (Tablet):**
- Swipe left → Next
- Swipe right → Previous
- Two-finger tap → Menu
- Three-finger tap → Exit

### 3.4 Context Menu (Full Screen)

**Access:** Right-click or click center of screen

```
┌────────────────────────────┐
│ Next                    →  │
│ Previous                ←  │
│ Jump to Slide...           │
│ ────────────────────────   │
│ Blank Screen               │
│ Show Presenter View        │
│ ────────────────────────   │
│ Pause Timer                │
│ Restart Timer              │
│ ────────────────────────   │
│ End Presentation        Esc│
└────────────────────────────┘
```

---

## 4. Reading View

### 4.1 Purpose

Reading View provides a distraction-free viewing experience without the full commitment of presentation mode. Ideal for:
- Reviewing presentation solo
- Previewing before presenting
- Sharing screen in video calls (with minimal UI)

### 4.2 Interface

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│ [Exit Reading View]                          [◀] 5/12 [▶]│
├─────────────────────────────────────────────────────────┤
│                                                         │
│                                                         │
│                                                         │
│                  Slide Content                          │
│                                                         │
│                                                         │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Features:**
- Minimal toolbar at top
- Slide fills most of screen
- Navigation controls visible
- Animations play on advance
- Mouse pointer always visible
- Window can be resized/moved

### 4.3 Activation

**Methods:**
- View menu → "Reading View"
- Keyboard: **Alt + R**
- Slide context menu → "View in Reading Mode"

**Entry Options:**
```
┌───────────────────────────────────────┐
│  Start Reading View                ✕  │
├───────────────────────────────────────┤
│  Start from:                          │
│  ● Current slide (Slide 5)            │
│  ○ Beginning (Slide 1)                │
│  ○ Select slide...                    │
│                                        │
│  Options:                             │
│  ☑ Play animations automatically      │
│  ☑ Auto-advance after animations      │
│  ☐ Loop at end                        │
│                                        │
│  [ Cancel ]           [ Start ]       │
└───────────────────────────────────────┘
```

### 4.4 Exit Behavior

**Methods:**
- Click "Exit Reading View" button
- Press **Esc**
- Window close button

**Returns to:**
- Edit mode at current slide
- Preserves slide selection

---

## 5. Kiosk Mode (Auto-Play)

### 5.1 Purpose

Kiosk Mode automatically advances through slides without user interaction. Use cases:
- Trade show displays
- Lobby information screens
- Self-running demos
- Digital signage

### 5.2 Configuration

```
┌────────────────────────────────────────────────┐
│  Kiosk Mode Settings                        ✕  │
├────────────────────────────────────────────────┤
│  Advance Mode:                                 │
│  ● Automatic (timed)                           │
│  ○ Manual (click to advance)                   │
│                                                │
│  Timing:                                       │
│  Advance every: [5_] seconds                   │
│                                                │
│  ☑ Use slide-specific timing (if set)         │
│                                                │
│  Looping:                                      │
│  ● Loop continuously                           │
│  ○ Stop at last slide                          │
│  ○ Loop [3_] times, then stop                  │
│                                                │
│  Interaction:                                  │
│  ☑ Pause on mouse move                         │
│  ☑ Resume after [10_] seconds                  │
│  ☐ Allow keyboard navigation                   │
│  ☐ Show navigation controls                    │
│                                                │
│  Exit:                                         │
│  Password: [••••••••]                          │
│  (Required to exit kiosk mode)                 │
│                                                │
│  [ Cancel ]           [ Start Kiosk ]          │
└────────────────────────────────────────────────┘
```

### 5.3 Slide-Specific Timing

**Per-Slide Override:**
```javascript
interface SlideKioskSettings {
  slideId: string;
  autoAdvance: boolean;
  advanceAfter: number;  // milliseconds
  pauseOnHover: boolean;
}
```

**UI (Slide Properties):**
```
┌────────────────────────────────────┐
│  Slide Properties               ✕  │
├────────────────────────────────────┤
│  Kiosk Mode:                       │
│  ☑ Override default timing         │
│                                    │
│  Display for: [10_] seconds        │
│                                    │
│  ☐ Wait for user input             │
│  ☐ Skip in kiosk mode              │
│                                    │
│  [ Cancel ]           [ Save ]     │
└────────────────────────────────────┘
```

### 5.4 Kiosk Implementation

```javascript
class KioskModeController {
  constructor(options) {
    this.options = options;
    this.currentSlideIndex = 0;
    this.timer = null;
    this.isPaused = false;
    this.loopCount = 0;
  }
  
  start() {
    this.enterFullScreen();
    this.showSlide(this.currentSlideIndex);
    this.scheduleNextSlide();
    
    if (this.options.pauseOnMouseMove) {
      this.setupMouseHandlers();
    }
  }
  
  scheduleNextSlide() {
    if (this.isPaused) return;
    
    const slide = presentation.slides[this.currentSlideIndex];
    const duration = slide.kioskSettings?.advanceAfter || 
                     this.options.defaultDuration;
    
    this.timer = setTimeout(() => {
      this.advance();
    }, duration);
  }
  
  advance() {
    const nextIndex = this.currentSlideIndex + 1;
    
    if (nextIndex >= presentation.slides.length) {
      // End of presentation
      if (this.options.loop === 'continuous') {
        this.currentSlideIndex = 0;
      } else if (this.options.loop === 'times') {
        this.loopCount++;
        if (this.loopCount < this.options.loopTimes) {
          this.currentSlideIndex = 0;
        } else {
          this.stop();
          return;
        }
      } else {
        // Stop at last slide
        this.stop();
        return;
      }
    } else {
      this.currentSlideIndex = nextIndex;
    }
    
    this.showSlide(this.currentSlideIndex);
    this.scheduleNextSlide();
  }
  
  setupMouseHandlers() {
    let mouseTimeout;
    
    document.addEventListener('mousemove', () => {
      if (!this.isPaused) {
        this.pause();
      }
      
      clearTimeout(mouseTimeout);
      mouseTimeout = setTimeout(() => {
        this.resume();
      }, this.options.resumeAfter);
    });
  }
  
  pause() {
    this.isPaused = true;
    clearTimeout(this.timer);
  }
  
  resume() {
    this.isPaused = false;
    this.scheduleNextSlide();
  }
  
  stop() {
    clearTimeout(this.timer);
    this.exitFullScreen();
  }
  
  async enterFullScreen() {
    await document.documentElement.requestFullscreen();
    document.body.classList.add('kiosk-mode');
  }
  
  exitFullScreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
    document.body.classList.remove('kiosk-mode');
  }
}
```

### 5.5 Exit Kiosk Mode

**Challenge:** Prevent unauthorized exit

**Solutions:**
1. **Password Protection**: Require password to exit
2. **Key Combination**: Special key combo (e.g., Ctrl + Alt + Shift + Q)
3. **Touch Gesture**: Complex gesture (e.g., 5-finger tap)
4. **Timer**: Auto-exit after X hours

**Exit Dialog:**
```
┌───────────────────────────────────────┐
│  Exit Kiosk Mode?                  ✕  │
├───────────────────────────────────────┤
│  Enter password to exit:              │
│                                        │
│  Password: [••••••••_]                 │
│                                        │
│                                        │
│  [ Cancel ]           [ Exit ]         │
└───────────────────────────────────────┘
```

---

## 6. Recording Mode

### 6.1 Recording Types

**Screen Recording**
- Captures slides + animations
- No audio
- Output: MP4 video

**Presentation Recording**
- Captures slides + audio narration
- Per-slide timing saved
- Can re-record individual slides

**Live Stream**
- Streams to YouTube, Teams, etc.
- Real-time presentation
- Requires external service

### 6.2 Recording Interface

**Setup:**
```
┌────────────────────────────────────────────────┐
│  Record Presentation                        ✕  │
├────────────────────────────────────────────────┤
│  Recording Type:                               │
│  ● Video with narration                        │
│  ○ Video only (no audio)                       │
│  ○ Slide timing only                           │
│                                                │
│  Microphone: [Built-in Microphone ▼]          │
│                                                │
│  Test: [━━━━●─────] 🎤 Recording...            │
│                                                │
│  Quality:                                      │
│  ○ Low (720p, 30fps)                           │
│  ● Medium (1080p, 30fps)                       │
│  ○ High (1080p, 60fps)                         │
│  ○ Ultra (4K, 60fps)                           │
│                                                │
│  Output:                                       │
│  Format: [MP4           ▼]                     │
│  Location: [C:\Users\...\Recordings ▼]        │
│                                                │
│  [ Cancel ]           [ Start Recording ]      │
└────────────────────────────────────────────────┘
```

### 6.3 Recording Controls

**During Recording:**
```
┌─────────────────────────────────────────────────┐
│ ● Recording                          00:05:32    │
│                                                 │
│               Slide Content                     │
│                                                 │
│                                                 │
│                                                 │
│ [⏸ Pause]  [⏹ Stop]  [▶ Next]  Slide 5/12     │
└─────────────────────────────────────────────────┘
```

**Keyboard Shortcuts:**
- **Space**: Next slide
- **P**: Pause recording
- **R**: Resume recording
- **S**: Stop and save
- **Esc**: Cancel recording (with confirmation)

### 6.4 Per-Slide Narration

**Re-record Individual Slides:**
```
┌────────────────────────────────────────────────┐
│  Slide Narration                            ✕  │
├────────────────────────────────────────────────┤
│  Slide 5: Solution Overview                    │
│                                                │
│  Current recording: 1:23                       │
│  🎤 [━━━━━━━━━━━━━━━━━━] 🔊                    │
│                                                │
│  [▶ Play] [⏸ Pause]                            │
│                                                │
│  [🔴 Re-record]  [🗑 Delete]                   │
│                                                │
│  ────────────────────────────────────────────  │
│                                                │
│  [◀ Previous Slide]    [Next Slide ▶]          │
│                                                │
│  [ Close ]            [ Save Changes ]         │
└────────────────────────────────────────────────┘
```

### 6.5 Recording Data Model

```typescript
interface PresentationRecording {
  id: string;
  presentationId: string;
  createdAt: Date;
  duration: number;           // milliseconds
  
  slides: SlideRecording[];
  
  video?: {
    url: string;
    format: 'mp4' | 'webm';
    resolution: string;       // "1920x1080"
    fps: number;
    size: number;             // bytes
  };
  
  audio?: {
    url: string;
    format: 'mp3' | 'wav';
    bitrate: number;
    size: number;
  };
}

interface SlideRecording {
  slideId: string;
  duration: number;           // milliseconds
  startTime: number;          // offset from recording start
  
  narration?: {
    url: string;
    transcript?: string;
  };
  
  annotations?: Annotation[];
}
```

### 6.6 Export Recording

**Options:**
```
┌────────────────────────────────────────────────┐
│  Export Recording                           ✕  │
├────────────────────────────────────────────────┤
│  Format:                                       │
│  ● Video file (MP4)                            │
│  ○ Separate video + audio files               │
│  ○ Slide timings only (embed in presentation) │
│                                                │
│  Include:                                      │
│  ☑ Animations                                  │
│  ☑ Transitions                                 │
│  ☑ Audio narration                             │
│  ☐ Mouse pointer                               │
│                                                │
│  Optimization:                                 │
│  ● Standard (H.264)                            │
│  ○ Web optimized (streaming)                   │
│  ○ High quality (H.265)                        │
│                                                │
│  Destination:                                  │
│  [C:\Users\...\presentation.mp4    📁]        │
│                                                │
│  Estimated size: ~150 MB                       │
│                                                │
│  [ Cancel ]           [ Export ]               │
└────────────────────────────────────────────────┘
```

---

## 7. Playback (Recorded Presentations)

### 7.1 Playback Interface

**Layout:**
```
┌─────────────────────────────────────────────────┐
│ [▶] [⏸] [⏹]  [━━━━●──────────] 5:32 / 15:45   │
│                                                 │
│                                                 │
│               Slide Content                     │
│               (Auto-advancing)                  │
│                                                 │
│                                                 │
│ [🔇] [━━━●─] Speed: [1.0x ▼]     Slide 5/12    │
└─────────────────────────────────────────────────┘
```

### 7.2 Playback Controls

| Control | Function |
|---------|----------|
| **Play/Pause** | Toggle playback |
| **Stop** | Stop and return to beginning |
| **Scrub** | Drag to any point in recording |
| **Volume** | Adjust narration volume |
| **Speed** | 0.5x, 0.75x, 1x, 1.25x, 1.5x, 2x |
| **Jump to Slide** | Skip to specific slide |

**Keyboard Shortcuts:**
- **Space**: Play/Pause
- **→**: Skip forward 5 seconds
- **←**: Skip backward 5 seconds
- **↑**: Increase volume
- **↓**: Decrease volume
- **Shift + →**: Next slide
- **Shift + ←**: Previous slide

---

## 8. Mode Transitions

### 8.1 Transition Matrix

| From → To | Behavior |
|-----------|----------|
| **Edit → Full Screen** | Enter from current slide |
| **Edit → Reading View** | Enter from current slide |
| **Edit → Kiosk** | Show configuration dialog |
| **Full Screen → Edit** | Return to edit at current slide |
| **Reading View → Edit** | Return to edit at current slide |
| **Kiosk → Edit** | Require password/key combo |

### 8.2 State Preservation

**Preserved Between Modes:**
- Current slide position
- Timer state (if paused)
- Zoom level (if applicable)
- Selected elements (in edit mode)

**Reset Between Modes:**
- Animations (reset to beginning)
- Temporary annotations
- Mouse pointer visibility

---

## 9. Performance Optimization

### 9.1 Slide Pre-rendering

**Strategy:** Pre-render upcoming slides for smooth transitions

```javascript
class SlidePrerenderer {
  constructor() {
    this.cache = new Map();
    this.preloadDistance = 3; // Preload 3 slides ahead
  }
  
  async preloadSlides(currentIndex) {
    const toPreload = [];
    
    // Preload next N slides
    for (let i = 1; i <= this.preloadDistance; i++) {
      const index = currentIndex + i;
      if (index < presentation.slides.length) {
        toPreload.push(index);
      }
    }
    
    // Preload in parallel
    await Promise.all(
      toPreload.map(index => this.preloadSlide(index))
    );
  }
  
  async preloadSlide(index) {
    if (this.cache.has(index)) return;
    
    const slide = presentation.slides[index];
    const rendered = await renderSlide(slide);
    this.cache.set(index, rendered);
    
    // Limit cache size
    if (this.cache.size > 10) {
      const oldest = Array.from(this.cache.keys())[0];
      this.cache.delete(oldest);
    }
  }
}
```

### 9.2 Asset Preloading

**Preload Critical Assets:**
- Images on current + next 3 slides
- Videos on current + next slide
- Fonts used in presentation
- Transition effects

### 9.3 Memory Management

**Cleanup Strategy:**
```javascript
class PresentationMemoryManager {
  cleanupOldSlides(currentIndex) {
    // Remove slides more than 5 positions behind
    const threshold = currentIndex - 5;
    
    slideCache.forEach((rendered, index) => {
      if (index < threshold) {
        slideCache.delete(index);
        unloadAssets(index);
      }
    });
  }
  
  unloadAssets(slideIndex) {
    const slide = presentation.slides[slideIndex];
    
    slide.elements.forEach(element => {
      if (element.type === 'image' || element.type === 'video') {
        // Release memory for large assets
        if (element.loadedData) {
          element.loadedData = null;
        }
      }
    });
  }
}
```

---

**Next**: See [08-slide-sizing.md](./08-slide-sizing.md) for aspect ratios and sizing options.
