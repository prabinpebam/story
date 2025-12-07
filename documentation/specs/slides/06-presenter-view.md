# Presenter View - Notes, Dual Screen, Timer, Navigation

**Version:** 1.0  
**Last Updated:** December 7, 2025

## 1. Overview

Presenter View provides the presenter with essential tools while displaying slides to the audience. It includes presenter notes, next slide preview, timer, navigation controls, and dual-screen support.

---

## 2. Presenter View Layout

### 2.1 Main Interface

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Presenter View                          [⬓ Extend Display] [End Show]     00:15:32 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌───────────────────────────────────┐  ┌──────────────────┐                  │
│  │                                   │  │                  │                  │
│  │                                   │  │   Next Slide:    │                  │
│  │       Current Slide               │  │                  │                  │
│  │                                   │  │   [Preview]      │                  │
│  │       (Large Preview)             │  │                  │                  │
│  │                                   │  │                  │                  │
│  │                                   │  └──────────────────┘                  │
│  │                                   │                                        │
│  └───────────────────────────────────┘  ┌──────────────────┐                  │
│                                         │                  │                  │
│  ┌─────────────────────────────────────┐│  Timer:          │                  │
│  │ Presenter Notes                     ││  ⏱ 15:32 / 30:00 │                  │
│  │                                     ││                  │                  │
│  │ Welcome to the quarterly review.    ││  [ Restart ]     │                  │
│  │                                     ││                  │                  │
│  │ Key points:                         │└──────────────────┘                  │
│  │ • Revenue increased 25%             │                                      │
│  │ • New markets in APAC               │  ┌──────────────────┐                │
│  │ • Product launch next quarter       ││  Slide 5 of 12   │                │
│  │                                     ││                  │                │
│  │ [12 pt] [B] [I] [U]                 ││  [◀] [▶] [Jump]  │                │
│  │                                     ││                  │                │
│  └─────────────────────────────────────┘└──────────────────┘                  │
│                                                                                 │
│  [Show/Hide Mouse Pointer]  [Blank Screen]  [Show All Slides]  [Settings]     │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Layout Options

**Standard Layout** (Default)
- Current slide: 60% width, left
- Notes: Bottom, 40% height
- Next slide: Top right
- Timer: Middle right
- Navigation: Bottom right

**Notes-Focused Layout**
- Current slide: 40% width, left
- Notes: 60% width, right (larger)
- Next slide: Small preview, top right
- Timer: Bottom right

**Side-by-Side Layout**
- Current slide: 50% width, left
- Next slide: 30% width, middle
- Notes: 20% width, right
- Timer: Above notes

**User Customization:**
```javascript
interface PresenterViewLayout {
  currentSlide: {
    width: number;      // percentage
    height: number;     // percentage
    position: Position;
  };
  notes: {
    width: number;
    height: number;
    position: Position;
    fontSize: number;
  };
  nextSlide: {
    width: number;
    height: number;
    position: Position;
  };
  timer: {
    position: Position;
    format: 'elapsed' | 'remaining' | 'both';
  };
  navigation: {
    position: Position;
    showThumbnails: boolean;
  };
}
```

---

## 3. Presenter Notes

### 3.1 Rich Text Editing

**Supported Formatting:**
- **Bold**: Ctrl + B
- *Italic*: Ctrl + I
- <u>Underline</u>: Ctrl + U
- Font size: 10-24pt
- Lists: Bullets, numbers
- Hyperlinks

**Editor Interface:**
```
┌────────────────────────────────────────────────────┐
│ Presenter Notes - Slide 5                       ✕  │
├────────────────────────────────────────────────────┤
│ [12pt ▼] [B] [I] [U] [•] [1.] [🔗] [Color]        │
├────────────────────────────────────────────────────┤
│                                                    │
│  Welcome to the quarterly review.                 │
│                                                    │
│  Key points to cover:                             │
│  • Revenue grew 25% YoY                           │
│  • Expanded to 3 new markets                      │
│  • Product launch scheduled for Q4                │
│                                                    │
│  Transition: Ask for questions before moving to   │
│  financial details.                               │
│                                                    │
│                                                    │
│                                                    │
│                                                    │
│                                                    │
│                                                    │
│                                                    │
│                         0 / 1000 characters        │
└────────────────────────────────────────────────────┘
```

### 3.2 Notes Data Model

```typescript
interface PresenterNotes {
  slideId: string;
  content: string;          // HTML or Markdown
  format: 'html' | 'markdown';
  plainText: string;        // For search/export
  createdAt: Date;
  updatedAt: Date;
  characterCount: number;
  wordCount: number;
}

interface NotesStyle {
  fontSize: number;         // 10-24
  fontFamily: string;       // System fonts
  lineHeight: number;       // 1.4-2.0
  textColor: string;
  backgroundColor: string;
}
```

### 3.3 Notes Navigation

**Keyboard Shortcuts:**
- **Ctrl + N**: Focus notes editor
- **Esc**: Return focus to slide
- **Ctrl + Enter**: Save and close notes
- **Tab**: Next slide (while editing notes)
- **Shift + Tab**: Previous slide

**Auto-Save:**
- Saves every 3 seconds while typing
- Debounced to avoid excessive saves
- Visual indicator when saving

```javascript
class NotesAutoSaver {
  constructor(slideId) {
    this.slideId = slideId;
    this.saveTimeout = null;
    this.saveDelay = 3000; // 3 seconds
    this.isDirty = false;
  }
  
  onChange(content) {
    this.isDirty = true;
    clearTimeout(this.saveTimeout);
    
    this.saveTimeout = setTimeout(() => {
      this.save(content);
    }, this.saveDelay);
  }
  
  async save(content) {
    if (!this.isDirty) return;
    
    showSavingIndicator();
    
    try {
      await updateSlideNotes(this.slideId, content);
      this.isDirty = false;
      showSavedIndicator();
    } catch (error) {
      showErrorIndicator();
    }
  }
}
```

### 3.4 Notes Export

**Export Formats:**
- **PDF**: Slide + notes on same page
- **Word**: Slide thumbnail + notes text
- **Text**: Plain text notes only
- **HTML**: Formatted notes with slide references

**Export Options:**
```
┌───────────────────────────────────────────────┐
│  Export Presenter Notes                    ✕  │
├───────────────────────────────────────────────┤
│  Format: [PDF           ▼]                    │
│                                               │
│  Include:                                     │
│  ☑ Slide thumbnails                           │
│  ☑ Slide numbers                              │
│  ☑ Notes text                                 │
│  ☐ Hidden slides                              │
│                                               │
│  Layout:                                      │
│  ● Slide on top, notes below                  │
│  ○ Slide on left, notes on right             │
│  ○ Notes only (no slides)                    │
│                                               │
│  [ Cancel ]           [ Export ]              │
└───────────────────────────────────────────────┘
```

---

## 4. Dual Screen Support

### 4.1 Display Detection

**Automatic Detection:**
```javascript
class DisplayManager {
  constructor() {
    this.displays = [];
    this.primaryDisplay = null;
    this.secondaryDisplay = null;
    
    this.detectDisplays();
    
    // Listen for display changes
    screen.addEventListener('change', () => {
      this.detectDisplays();
    });
  }
  
  detectDisplays() {
    if (window.screen.isExtended) {
      this.displays = window.screen.getScreenDetails();
      this.primaryDisplay = this.displays[0];
      this.secondaryDisplay = this.displays[1];
    }
  }
  
  async requestMultiScreen() {
    if (!window.screen.isExtended) {
      const permission = await navigator.permissions.query({
        name: 'window-placement'
      });
      
      if (permission.state === 'granted') {
        this.detectDisplays();
      } else {
        // Show permission prompt
        await window.getScreenDetails();
        this.detectDisplays();
      }
    }
  }
}
```

### 4.2 Extended Display Mode

**Setup:**
1. Click "Extend Display" button
2. System detects connected displays
3. User selects which display for slides
4. Presenter view stays on current display
5. Slide show opens on selected display

**Display Selection Dialog:**
```
┌───────────────────────────────────────────────┐
│  Choose Display for Slide Show             ✕  │
├───────────────────────────────────────────────┤
│  Select which display to show slides on:      │
│                                               │
│  ┌──────────────┐     ┌──────────────┐       │
│  │ Display 1    │     │ Display 2    │       │
│  │              │     │              │       │
│  │ 1920 × 1080  │     │ 1920 × 1080  │       │
│  │              │     │              │       │
│  │ [Primary]    │     │ [Extended]   │       │
│  └──────────────┘     └──────────────┘       │
│      ( )                   (●)                │
│                                               │
│  Presenter View will remain on Display 1      │
│                                               │
│  [ Cancel ]           [ Start ]               │
└───────────────────────────────────────────────┘
```

### 4.3 Synchronized Navigation

**Challenge:** Keep both screens in sync

**Implementation:**
```javascript
class DualScreenSynchronizer {
  constructor(presenterWindow, slideWindow) {
    this.presenterWindow = presenterWindow;
    this.slideWindow = slideWindow;
    this.currentSlideId = null;
    
    this.setupMessageHandlers();
  }
  
  setupMessageHandlers() {
    // Listen for navigation in presenter view
    this.presenterWindow.addEventListener('slide-change', (e) => {
      this.syncSlide(e.detail.slideId);
    });
    
    // Listen for navigation in slide view (remote, etc.)
    this.slideWindow.addEventListener('slide-change', (e) => {
      this.syncPresenter(e.detail.slideId);
    });
  }
  
  syncSlide(slideId) {
    if (this.currentSlideId === slideId) return;
    
    this.currentSlideId = slideId;
    
    // Update slide window
    this.slideWindow.postMessage({
      type: 'navigate',
      slideId: slideId
    }, '*');
  }
  
  syncPresenter(slideId) {
    if (this.currentSlideId === slideId) return;
    
    this.currentSlideId = slideId;
    
    // Update presenter window
    this.presenterWindow.postMessage({
      type: 'navigate',
      slideId: slideId
    }, '*');
  }
}
```

### 4.4 Fallback Mode

**Single Display Mode:**
- Show slides full screen
- Presenter can press **P** to toggle presenter view overlay
- Overlay appears in corner, semi-transparent
- Contains timer, notes, next slide

**Presenter Overlay (Single Display):**
```
┌────────────────────────────────────┐
│  Full Screen Slide Display         │
│                                    │
│  ┌──────────────────────────────┐  │
│  │                              │  │
│  │                              │  │
│  │      Slide Content           │  │
│  │                              │  │
│  │                              │  │
│  │                              │  │
│  │                      ┌──────┐│  │
│  │                      │Next: ││  │
│  │                      │[5/12]││  │
│  │                      │      ││  │
│  │                      │⏱15:32││  │
│  │                      │      ││  │
│  │                      │Notes ││  │
│  │                      │...   ││  │
│  │                      └──────┘│  │
│  └──────────────────────────────┘  │
│                                    │
└────────────────────────────────────┘
```

---

## 5. Timer and Pacing

### 5.1 Timer Modes

**Elapsed Time**
- Shows time since presentation started
- Format: HH:MM:SS or MM:SS
- Starts at 00:00:00

**Countdown Timer**
- Shows time remaining
- User sets target duration
- Turns red when < 5 minutes
- Flashes when time expires

**Target Time**
- Shows both elapsed and target
- Example: "15:32 / 30:00"
- Progress bar visualization

**Pacer Mode**
- Calculates ideal time per slide
- Shows if ahead/behind schedule
- Example: "On track" or "2 min ahead"

### 5.2 Timer Interface

```
┌────────────────────────────────────┐
│  Timer Settings                 ✕  │
├────────────────────────────────────┤
│  Mode: [Countdown    ▼]            │
│                                    │
│  Target Duration:                  │
│  Hours:   [0_]                     │
│  Minutes: [30_]                    │
│  Seconds: [0_]                     │
│                                    │
│  Alerts:                           │
│  ☑ Alert at 5 minutes remaining    │
│  ☑ Alert at 1 minute remaining     │
│  ☑ Visual alert (flash timer)      │
│  ☑ Audio alert (beep)              │
│                                    │
│  Pacer:                            │
│  ☑ Show pacing indicator           │
│  ☐ Alert when behind schedule      │
│                                    │
│  [ Cancel ]           [ Save ]     │
└────────────────────────────────────┘
```

### 5.3 Timer Implementation

```typescript
class PresentationTimer {
  startTime: Date;
  pausedTime: number;
  targetDuration: number;  // milliseconds
  isPaused: boolean;
  mode: 'elapsed' | 'countdown' | 'target' | 'pacer';
  
  constructor(options: TimerOptions) {
    this.mode = options.mode;
    this.targetDuration = options.targetDuration;
    this.isPaused = false;
    this.pausedTime = 0;
  }
  
  start() {
    this.startTime = new Date();
    this.isPaused = false;
    this.updateDisplay();
  }
  
  pause() {
    this.isPaused = true;
    this.pausedTime += Date.now() - this.startTime.getTime();
  }
  
  resume() {
    this.startTime = new Date();
    this.isPaused = false;
  }
  
  restart() {
    this.startTime = new Date();
    this.pausedTime = 0;
    this.isPaused = false;
  }
  
  getElapsed(): number {
    if (this.isPaused) {
      return this.pausedTime;
    }
    return Date.now() - this.startTime.getTime() + this.pausedTime;
  }
  
  getRemaining(): number {
    return Math.max(0, this.targetDuration - this.getElapsed());
  }
  
  getProgress(): number {
    return (this.getElapsed() / this.targetDuration) * 100;
  }
  
  updateDisplay() {
    if (this.isPaused) return;
    
    const element = document.getElementById('timer-display');
    
    switch (this.mode) {
      case 'elapsed':
        element.textContent = this.formatTime(this.getElapsed());
        break;
      case 'countdown':
        element.textContent = this.formatTime(this.getRemaining());
        break;
      case 'target':
        element.textContent = `${this.formatTime(this.getElapsed())} / ${this.formatTime(this.targetDuration)}`;
        break;
      case 'pacer':
        element.textContent = this.getPacerText();
        break;
    }
    
    // Check for alerts
    this.checkAlerts();
    
    requestAnimationFrame(() => this.updateDisplay());
  }
  
  formatTime(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}:${String(minutes % 60).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
    }
    return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
  }
  
  getPacerText(): string {
    const idealTimePerSlide = this.targetDuration / presentation.slides.length;
    const currentSlideIndex = getCurrentSlideIndex();
    const idealElapsed = idealTimePerSlide * currentSlideIndex;
    const actualElapsed = this.getElapsed();
    const difference = actualElapsed - idealElapsed;
    
    if (Math.abs(difference) < 60000) { // Within 1 minute
      return 'On track';
    } else if (difference > 0) {
      return `${Math.ceil(difference / 60000)} min behind`;
    } else {
      return `${Math.ceil(-difference / 60000)} min ahead`;
    }
  }
  
  checkAlerts() {
    const remaining = this.getRemaining();
    
    if (remaining <= 300000 && remaining > 299000) { // 5 min
      this.showAlert('5 minutes remaining');
    } else if (remaining <= 60000 && remaining > 59000) { // 1 min
      this.showAlert('1 minute remaining');
    } else if (remaining === 0) {
      this.showAlert('Time is up!');
    }
  }
}
```

---

## 6. Navigation Controls

### 6.1 Quick Navigation

**Slide Counter:**
- Shows: "Slide 5 of 12"
- Clickable to open jump dialog

**Previous/Next Buttons:**
- Large, easy to hit
- Keyboard: ←/→
- Mouse wheel support

**Jump to Slide:**
```
┌────────────────────────────────────┐
│  Jump to Slide                  ✕  │
├────────────────────────────────────┤
│  Go to slide: [5_]                 │
│                                    │
│  Or select from list:              │
│  ┌──────────────────────────────┐  │
│  │ 1. Title Slide               │  │
│  │ 2. Agenda                    │  │
│  │ 3. Introduction              │  │
│  │ 4. Problem Statement         │  │
│  │ ▶ 5. Solution Overview      ◀│  │
│  │ 6. Architecture              │  │
│  │ 7. Implementation            │  │
│  └──────────────────────────────┘  │
│                                    │
│  [ Cancel ]           [ Jump ]     │
└────────────────────────────────────┘
```

### 6.2 Slide Thumbnail Grid

**Access:** Click "Show All Slides" button

**Interface:**
```
┌──────────────────────────────────────────────────┐
│  All Slides                                   ✕  │
├──────────────────────────────────────────────────┤
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐    │
│  │ 1  │ │ 2  │ │ 3  │ │ 4  │ │ 5  │ │ 6  │    │
│  │    │ │    │ │    │ │    │ │▓▓▓▓│ │    │    │
│  └────┘ └────┘ └────┘ └────┘ └────┘ └────┘    │
│                                                  │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐    │
│  │ 7  │ │ 8  │ │ 9  │ │ 10 │ │ 11 │ │ 12 │    │
│  │    │ │    │ │    │ │    │ │    │ │    │    │
│  └────┘ └────┘ └────┘ └────┘ └────┘ └────┘    │
│                                                  │
│  Click to jump to any slide                     │
└──────────────────────────────────────────────────┘
```

---

## 7. Additional Features

### 7.1 Blank Screen

**Purpose:** Temporarily black out the screen to focus audience attention

**Activation:**
- Button: "Blank Screen"
- Keyboard: **B** (black) or **W** (white)
- Toggle off: Press same key again

**Visual:**
```
Full screen black or white
No content visible
Press any key to resume
```

### 7.2 Mouse Pointer Control

**Show/Hide Pointer:**
- Toggle button in presenter view
- Keyboard: **A**
- Auto-hide after 3 seconds of inactivity

**Pointer Options:**
- Normal cursor
- Laser pointer (red dot)
- Pen (draw on screen)
- Highlighter

### 7.3 Screen Annotations

**Drawing Tools:**
- Pen: Draw freehand
- Highlighter: Semi-transparent
- Eraser: Remove drawings
- Clear all: Remove all annotations

**Keyboard Shortcuts:**
- **Ctrl + P**: Pen tool
- **Ctrl + H**: Highlighter
- **Ctrl + E**: Eraser
- **Ctrl + Shift + E**: Clear all

**Annotation Data:**
```typescript
interface Annotation {
  id: string;
  slideId: string;
  type: 'pen' | 'highlighter';
  color: string;
  width: number;
  points: Array<{x: number; y: number}>;
  timestamp: Date;
}
```

---

## 8. Keyboard Shortcuts (Presenter View)

| Shortcut | Action |
|----------|--------|
| **←** / **→** | Previous/Next slide |
| **Home** / **End** | First/Last slide |
| **Number + Enter** | Jump to slide |
| **P** | Pause timer |
| **R** | Restart timer |
| **B** | Blank screen (black) |
| **W** | Blank screen (white) |
| **A** | Toggle mouse pointer |
| **Ctrl + N** | Focus notes |
| **Esc** | Exit presenter view |
| **F11** | Toggle full screen |

---

**Next**: See [07-presentation-modes.md](./07-presentation-modes.md) for details on presentation modes and recording.
