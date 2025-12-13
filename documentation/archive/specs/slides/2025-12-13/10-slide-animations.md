# Slide Animations - Entrance, Exit, Emphasis, Motion Paths

**Version:** 1.0  
**Last Updated:** December 7, 2025

## 1. Overview

Animations bring slides to life by controlling how and when elements appear, disappear, or move on slides. This document specifies the complete animation system including effects library, animation pane, timing controls, and motion paths.

---

## 2. Animation Types

### 2.1 Four Animation Categories

**1. Entrance Effects**
- Elements appear on slide
- Used when advancing to next click
- Examples: Fade In, Fly In, Wipe, Zoom

**2. Exit Effects**
- Elements disappear from slide
- Remove focus from content
- Examples: Fade Out, Fly Out, Disappear

**3. Emphasis Effects**
- Draw attention without appearing/disappearing
- Element stays visible
- Examples: Pulse, Grow/Shrink, Spin, Color Change

**4. Motion Paths**
- Element moves along a path
- Custom or preset paths
- Examples: Lines, Arcs, Shapes, Custom

### 2.2 Animation Effects Library

**Entrance Effects (30+):**
```
Basic:
• Appear          • Fade            • Fly In          • Float In
• Split           • Wipe            • Shape           • Wheel
• Random Bars     • Grow & Turn     • Zoom            • Swivel

Moderate:
• Bounce          • Glide           • Expand          • Spinner
• Spiral          • Swirl           • Flip            • Unfold
• Rise Up         • Peek In         • Checkerboard    • Plus

Exciting:
• Boomerang       • Credits         • Drop            • Float Down
• Pinwheel        • Spring          • Whip            • Swoosh
• Bounce Left     • Bounce Right    • Compress        • Stretch
```

**Exit Effects (30+):**
```
Basic:
• Disappear       • Fade            • Fly Out         • Float Out
• Split           • Wipe            • Shape           • Wheel
• Random Bars     • Shrink & Turn   • Zoom            • Swivel

Moderate:
• Bounce          • Sink Down       • Collapse        • Spinner
• Spiral Out      • Contract        • Flip Out        • Fold

Exciting:
• Drop Out        • Whip Out        • Swoosh Out      • Compress
• Stretch Out     • Credits Out
```

**Emphasis Effects (20+):**
```
Basic:
• Pulse           • Color Pulse     • Teeter          • Spin

Moderate:
• Grow/Shrink     • Lighten         • Darken          • Desaturate
• Bold Flash      • Wave            • Transparency    • Object Color

Exciting:
• Brush Color     • Blink           • Shimmer         • Bounce
• Vertical Grow   • Complementary   • Line Color      • Fill Color
```

**Motion Paths (20+):**
```
Basic:
• Lines           • Arcs            • Turns           • Shapes
• Loops           

Custom:
• Freeform        • Scribble        

Complex:
• Figure 8        • Neutron         • Spring          • Spiral
• Sine Wave       • Bouncing        • Zigzag          • Curved
```

### 2.3 Animation Data Model

```typescript
interface Animation {
  id: string;
  elementId: string;          // Target element
  slideId: string;
  
  // Effect
  effect: AnimationEffect;
  category: 'entrance' | 'exit' | 'emphasis' | 'motion-path';
  
  // Timing
  trigger: AnimationTrigger;
  delay: number;              // milliseconds
  duration: number;           // milliseconds
  
  // Options
  direction?: AnimationDirection;
  amount?: number;            // For grow/shrink, etc.
  path?: MotionPath;          // For motion path animations
  
  // Advanced
  easing: string;             // CSS easing function
  iterations: number;         // 1 or more, Infinity for loop
  autoReverse: boolean;
  
  // Sequencing
  order: number;              // Execution order on slide
  repeatCount: number;
  repeatDuration?: number;
}

type AnimationEffect = 
  // Entrance
  | 'appear' | 'fade' | 'fly-in' | 'float-in' | 'split'
  | 'wipe' | 'shape' | 'wheel' | 'random-bars' | 'grow-turn'
  | 'zoom' | 'swivel' | 'bounce' | 'glide' | 'expand'
  | 'spinner' | 'spiral' | 'swirl' | 'flip' | 'unfold'
  | 'rise-up' | 'peek-in' | 'checkerboard' | 'plus'
  | 'boomerang' | 'credits' | 'drop' | 'float-down'
  | 'pinwheel' | 'spring' | 'whip' | 'swoosh'
  // Exit (similar naming with -out suffix)
  | 'disappear' | 'fade-out' | 'fly-out' | 'float-out'
  // ... (30+ more)
  // Emphasis
  | 'pulse' | 'color-pulse' | 'teeter' | 'spin' | 'grow-shrink'
  | 'lighten' | 'darken' | 'desaturate' | 'bold-flash'
  | 'wave' | 'transparency' | 'object-color'
  // Motion Paths
  | 'line' | 'arc' | 'turn' | 'shape' | 'loop' | 'custom';

type AnimationTrigger = 
  | 'on-click'           // Default: wait for click
  | 'with-previous'      // Start with previous animation
  | 'after-previous'     // Start after previous completes
  | 'auto';              // Start automatically on slide entry

type AnimationDirection = 
  | 'from-bottom' | 'from-top' | 'from-left' | 'from-right'
  | 'from-bottom-left' | 'from-bottom-right'
  | 'from-top-left' | 'from-top-right'
  | 'horizontal' | 'vertical' | 'in' | 'out' | 'clockwise'
  | 'counterclockwise';

interface MotionPath {
  type: 'line' | 'arc' | 'custom';
  points: Array<{x: number; y: number}>;
  closed: boolean;        // Connect last to first?
  smooth: boolean;        // Smooth curves vs sharp corners
}
```

---

## 3. Animation Pane

### 3.1 Interface Layout

```
┌────────────────────────────────────────────────────────────┐
│  Animation Pane                                         ✕  │
├────────────────────────────────────────────────────────────┤
│  [Add Animation ▼]  [Remove]  [Preview All]               │
├────────────────────────────────────────────────────────────┤
│  Animations on slide:                                      │
│                                                            │
│  ┌────────────────────────────────────────────────────┐   │
│  │ ⚡ 1  ▶  Rectangle 1                               │   │
│  │          Entrance: Fly In (From Left)              │   │
│  │          Duration: 0.5s  Delay: 0s                 │   │
│  │          ├─────●───────────────┐                   │   │
│  │                                                     │   │
│  │ ⚡ 2  ↪  Title                                      │   │
│  │          Entrance: Fade                            │   │
│  │          Duration: 0.5s  With previous             │   │
│  │          ├─────●──────┐                            │   │
│  │                                                     │   │
│  │ ⚡ 3  ▶  Chart 1                                    │   │
│  │          Entrance: Wipe (From Bottom)              │   │
│  │          Duration: 1s  On click                    │   │
│  │                        ├─────────●──────────┐      │   │
│  │                                                     │   │
│  │ ⚡ 4  🔄 Image 1                                    │   │
│  │          Emphasis: Pulse                           │   │
│  │          Duration: 0.5s  After previous            │   │
│  │                                ├────●────┐         │   │
│  └────────────────────────────────────────────────────┘   │
│                                                            │
│  Timeline: [■■■□□□□□□□□□□□□□] 2.5s / 4s                   │
│                                                            │
│  [⏮] [▶] [⏭]     [Effect Options...]  [Timing...]         │
└────────────────────────────────────────────────────────────┘
```

### 3.2 Animation List Entry

**Visual Elements:**
- **Icon**: ▶ (on click), ↪ (with previous), → (after previous)
- **Number**: Execution order
- **Element name**: What's being animated
- **Effect description**: Animation type and direction
- **Timing bar**: Visual representation of when it plays

**Interaction:**
- Click to select
- Drag to reorder
- Right-click for context menu
- Double-click for effect options

### 3.3 Add Animation Dialog

```
┌────────────────────────────────────────────────────────────┐
│  Add Animation                                          ✕  │
├────────────────────────────────────────────────────────────┤
│  Select an effect to add:                                  │
│                                                            │
│  [Entrance] [Emphasis] [Exit] [Motion Paths]              │
│                                                            │
│  ┌────────────────────────────────────────────────────┐   │
│  │ Basic:                                             │   │
│  │ [Appear]  [Fade]  [Fly In]  [Float In]  [Split]  │   │
│  │ [Wipe]    [Shape] [Wheel]   [Grow]      [Zoom]    │   │
│  │                                                     │   │
│  │ Moderate:                                          │   │
│  │ [Bounce]  [Glide] [Expand]  [Spinner]   [Spiral]  │   │
│  │ [Swirl]   [Flip]  [Unfold]  [Rise Up]   [Peek In] │   │
│  │                                                     │   │
│  │ Exciting:                                          │   │
│  │ [Boomerang] [Credits] [Drop] [Float Down]         │   │
│  │ [Pinwheel]  [Spring]  [Whip] [Swoosh]             │   │
│  └────────────────────────────────────────────────────┘   │
│                                                            │
│  Preview:                                                  │
│  ┌──────────────────┐                                     │
│  │  [▶ Preview]     │                                     │
│  │                  │                                     │
│  │  Sample Object   │ ← Shows animation preview           │
│  │                  │                                     │
│  └──────────────────┘                                     │
│                                                            │
│  [More Effects...]                [ Cancel ]  [ OK ]       │
└────────────────────────────────────────────────────────────┘
```

### 3.4 Effect Options Dialog

```
┌────────────────────────────────────────────────────────────┐
│  Fly In - Effect Options                                ✕  │
├────────────────────────────────────────────────────────────┤
│  [Effect]  [Timing]  [Chart Animation]                    │
│                                                            │
│  Settings:                                                 │
│  Direction: [From Left       ▼]                           │
│                                                            │
│  Sound: [No Sound           ▼]                            │
│  ☐ Loop until next sound                                  │
│                                                            │
│  After animation:                                          │
│  ● Don't dim                                               │
│  ○ Dim after animation: [████ 50% Gray  ▼]                │
│  ○ Hide after animation                                    │
│  ○ Hide on next click                                      │
│                                                            │
│  Animate text:                                             │
│  ● All at once                                             │
│  ○ By word                                                 │
│  ○ By letter                                               │
│                                                            │
│  ☐ Reverse path direction                                 │
│  ☑ Smooth start                                           │
│  ☑ Smooth end                                             │
│                                                            │
│  [ Cancel ]  [ Preview ]  [ OK ]                           │
└────────────────────────────────────────────────────────────┘
```

### 3.5 Timing Options Dialog

```
┌────────────────────────────────────────────────────────────┐
│  Timing                                                 ✕  │
├────────────────────────────────────────────────────────────┤
│  Start:                                                    │
│  ● On Click                                                │
│  ○ With Previous                                           │
│  ○ After Previous                                          │
│                                                            │
│  Delay: [0_] seconds                                       │
│                                                            │
│  Duration:                                                 │
│  ● Very Fast (0.5 seconds)                                 │
│  ○ Fast (1 second)                                         │
│  ○ Medium (2 seconds)                                      │
│  ○ Slow (3 seconds)                                        │
│  ○ Very Slow (5 seconds)                                   │
│  ○ Custom: [1.5_] seconds                                  │
│                                                            │
│  Repeat:                                                   │
│  [None ▼]  (None, 2x, 3x, 4x, 5x, 10x, Until End, Forever)│
│                                                            │
│  ☐ Rewind when done playing                               │
│                                                            │
│  Triggers:                                                 │
│  [Add Trigger...]                                          │
│  No triggers set                                           │
│                                                            │
│  [ Cancel ]  [ OK ]                                        │
└────────────────────────────────────────────────────────────┘
```

---

## 4. Animation Timeline

### 4.1 Timeline View

**Visual Representation:**
```
Time:  0s        1s        2s        3s        4s        5s
       ├─────────┼─────────┼─────────┼─────────┼─────────┤
Rectangle  ▶ [■■■■──────────]                              On Click
Title      ↪ [■■■■──────────]                              With Prev
Chart      ▶               [■■■■■■■■──────────]            On Click
Image      →                       [■■■───────]            After Prev
Bullet 1   ▶                                 [■■──]        On Click
Bullet 2   →                                    [■■──]     After Prev
Bullet 3   →                                       [■■──]  After Prev
```

**Legend:**
- **▶** = On Click (waits for user)
- **↪** = With Previous (starts immediately)
- **→** = After Previous (starts when previous ends)
- **[■■■]** = Duration bar

### 4.2 Timeline Controls

**Playback:**
- Play/Pause
- Step forward (next animation)
- Step backward
- Restart
- Scrub timeline

**Zoom:**
- Fit all animations
- Zoom in/out
- Auto-scroll to current

---

## 5. Common Animation Patterns

### 5.1 Build Slides (Sequential Reveal)

**Pattern:** Reveal bullet points one at a time

**Setup:**
1. Select text box with bullets
2. Add Animation → Entrance → Fade
3. Effect Options → Animate: By paragraph
4. Timing → Start: On Click

**Result:**
- Click 1: First bullet appears
- Click 2: Second bullet appears
- Click 3: Third bullet appears

### 5.2 Emphasis on Important Points

**Pattern:** Draw attention without moving

**Setup:**
1. Select element
2. Add Animation → Emphasis → Pulse
3. Timing → Duration: 0.5s
4. Timing → Repeat: 2x

### 5.3 Smooth Transitions Between States

**Pattern:** Morph-like effect with separate elements

**Setup:**
1. Duplicate element in new position
2. Original: Add Animation → Exit → Fade Out
3. Duplicate: Add Animation → Entrance → Fade In
4. Both: Timing → Start: With Previous
5. Both: Duration: 0.5s

### 5.4 Motion Path Demonstration

**Pattern:** Move element along path

**Setup:**
1. Select element
2. Add Animation → Motion Path → Custom
3. Draw path with clicks
4. Adjust timing and easing

---

## 6. Animation Implementation

### 6.1 Animation Engine

```typescript
class AnimationEngine {
  constructor(slide) {
    this.slide = slide;
    this.animations = slide.animations.sort((a, b) => a.order - b.order);
    this.currentIndex = 0;
    this.isPlaying = false;
    this.isPaused = false;
  }
  
  async play() {
    this.isPlaying = true;
    
    // Auto-play animations (auto, with-previous, after-previous)
    while (this.currentIndex < this.animations.length && this.isPlaying) {
      const animation = this.animations[this.currentIndex];
      
      if (animation.trigger === 'on-click') {
        // Wait for user click
        this.isPaused = true;
        return;
      }
      
      await this.playAnimation(animation);
      this.currentIndex++;
    }
  }
  
  async playAnimation(animation) {
    const element = document.getElementById(animation.elementId);
    
    // Apply animation effect
    await this.applyEffect(element, animation);
  }
  
  async applyEffect(element, animation) {
    const keyframes = this.getKeyframes(animation);
    const options = {
      duration: animation.duration,
      delay: animation.delay,
      easing: animation.easing,
      iterations: animation.iterations,
      direction: animation.autoReverse ? 'alternate' : 'normal'
    };
    
    const webAnimation = element.animate(keyframes, options);
    
    return webAnimation.finished;
  }
  
  getKeyframes(animation) {
    // Generate CSS keyframes based on effect type
    switch (animation.effect) {
      case 'fade':
        return [
          { opacity: 0 },
          { opacity: 1 }
        ];
      
      case 'fly-in':
        return this.getFlyInKeyframes(animation.direction);
      
      case 'zoom':
        return [
          { transform: 'scale(0)', opacity: 0 },
          { transform: 'scale(1)', opacity: 1 }
        ];
      
      case 'spin':
        return [
          { transform: 'rotate(0deg)' },
          { transform: 'rotate(360deg)' }
        ];
      
      case 'pulse':
        return [
          { transform: 'scale(1)' },
          { transform: 'scale(1.1)' },
          { transform: 'scale(1)' }
        ];
      
      // ... 50+ more effects
    }
  }
  
  getFlyInKeyframes(direction) {
    const distance = '100%';
    const transforms = {
      'from-left': `translateX(-${distance})`,
      'from-right': `translateX(${distance})`,
      'from-top': `translateY(-${distance})`,
      'from-bottom': `translateY(${distance})`
    };
    
    return [
      { transform: transforms[direction], opacity: 0 },
      { transform: 'translate(0, 0)', opacity: 1 }
    ];
  }
  
  next() {
    if (this.currentIndex < this.animations.length) {
      const animation = this.animations[this.currentIndex];
      this.playAnimation(animation);
      this.currentIndex++;
      
      // Continue with auto animations
      if (this.currentIndex < this.animations.length) {
        const next = this.animations[this.currentIndex];
        if (next.trigger !== 'on-click') {
          this.play();
        }
      }
    }
  }
  
  previous() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.reverseAnimation(this.animations[this.currentIndex]);
    }
  }
  
  restart() {
    this.currentIndex = 0;
    this.resetAllAnimations();
  }
  
  resetAllAnimations() {
    this.animations.forEach(animation => {
      const element = document.getElementById(animation.elementId);
      
      if (animation.category === 'entrance') {
        element.style.opacity = '0';
      } else if (animation.category === 'exit') {
        element.style.opacity = '1';
      }
    });
  }
}
```

### 6.2 Motion Path Renderer

```typescript
class MotionPathAnimator {
  constructor(element, path, duration) {
    this.element = element;
    this.path = path;
    this.duration = duration;
  }
  
  async animate() {
    const totalDistance = this.calculatePathLength();
    const points = this.path.points;
    
    for (let i = 0; i < points.length - 1; i++) {
      const start = points[i];
      const end = points[i + 1];
      const segmentDistance = this.distance(start, end);
      const segmentDuration = (segmentDistance / totalDistance) * this.duration;
      
      await this.animateSegment(start, end, segmentDuration);
    }
    
    if (this.path.closed) {
      // Return to start
      await this.animateSegment(
        points[points.length - 1],
        points[0],
        this.duration * 0.1
      );
    }
  }
  
  async animateSegment(start, end, duration) {
    const keyframes = [
      { transform: `translate(${start.x}px, ${start.y}px)` },
      { transform: `translate(${end.x}px, ${end.y}px)` }
    ];
    
    const animation = this.element.animate(keyframes, {
      duration,
      easing: this.path.smooth ? 'ease-in-out' : 'linear',
      fill: 'forwards'
    });
    
    return animation.finished;
  }
  
  calculatePathLength() {
    let length = 0;
    for (let i = 0; i < this.path.points.length - 1; i++) {
      length += this.distance(
        this.path.points[i],
        this.path.points[i + 1]
      );
    }
    return length;
  }
  
  distance(p1, p2) {
    return Math.sqrt(
      Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2)
    );
  }
}
```

### 6.3 Animation Painter (Copy Animations)

```typescript
class AnimationPainter {
  constructor() {
    this.copiedAnimations = [];
  }
  
  copyAnimations(sourceElementId) {
    const animations = presentation.getCurrentSlide().animations.filter(
      a => a.elementId === sourceElementId
    );
    
    this.copiedAnimations = animations.map(a => ({
      ...a,
      elementId: null  // Will be set on paste
    }));
  }
  
  pasteAnimations(targetElementIds) {
    const slide = presentation.getCurrentSlide();
    
    targetElementIds.forEach(targetId => {
      this.copiedAnimations.forEach(copiedAnim => {
        const newAnimation = {
          ...copiedAnim,
          id: generateId(),
          elementId: targetId,
          order: slide.animations.length
        };
        
        slide.animations.push(newAnimation);
      });
    });
    
    // Refresh animation pane
    animationPane.refresh();
  }
}
```

---

## 7. Text Animation

### 7.1 Animate Text By

**Options:**
- **All at once**: Entire text box animates together
- **By paragraph**: Each paragraph animates separately
- **By word**: Each word animates separately  
- **By letter**: Each letter animates separately (typewriter effect)

**Implementation:**
```typescript
class TextAnimator {
  animateByParagraph(textElement, effect, timing) {
    const paragraphs = textElement.querySelectorAll('p');
    
    paragraphs.forEach((p, index) => {
      const animation = {
        ...effect,
        elementId: p.id,
        delay: timing.delay + (index * timing.stagger),
        order: timing.baseOrder + index
      };
      
      this.scheduleAnimation(animation);
    });
  }
  
  animateByWord(textElement, effect, timing) {
    const words = this.splitIntoWords(textElement);
    
    words.forEach((wordSpan, index) => {
      const animation = {
        ...effect,
        elementId: wordSpan.id,
        delay: timing.delay + (index * 50), // 50ms stagger
        order: timing.baseOrder + index
      };
      
      this.scheduleAnimation(animation);
    });
  }
  
  animateByLetter(textElement, effect, timing) {
    const letters = this.splitIntoLetters(textElement);
    
    letters.forEach((letterSpan, index) => {
      const animation = {
        ...effect,
        elementId: letterSpan.id,
        delay: timing.delay + (index * 30), // 30ms stagger
        order: timing.baseOrder + index
      };
      
      this.scheduleAnimation(animation);
    });
  }
  
  splitIntoWords(element) {
    const text = element.textContent;
    const words = text.split(/\s+/);
    
    element.innerHTML = '';
    return words.map((word, index) => {
      const span = document.createElement('span');
      span.id = `${element.id}-word-${index}`;
      span.textContent = word;
      span.style.display = 'inline-block';
      element.appendChild(span);
      
      if (index < words.length - 1) {
        element.appendChild(document.createTextNode(' '));
      }
      
      return span;
    });
  }
}
```

### 7.2 Bullet Build Animations

**Progressive Disclosure:**
```typescript
class BulletBuildAnimator {
  setupBulletBuild(listElement, options) {
    const items = listElement.querySelectorAll('li');
    
    items.forEach((item, index) => {
      // Entrance animation
      const entranceAnim = {
        id: generateId(),
        elementId: item.id,
        effect: options.effect || 'fade',
        category: 'entrance',
        trigger: index === 0 ? 'auto' : 'on-click',
        duration: 500,
        delay: 0,
        order: index
      };
      
      slide.animations.push(entranceAnim);
      
      // Dim previous bullets (optional)
      if (options.dimPrevious && index > 0) {
        const dimAnim = {
          id: generateId(),
          elementId: items[index - 1].id,
          effect: 'darken',
          category: 'emphasis',
          trigger: 'with-previous',
          duration: 300,
          order: index
        };
        
        slide.animations.push(dimAnim);
      }
    });
  }
}
```

---

## 8. Animation Triggers

### 8.1 Trigger Types

**On Click (Default):**
- Animation waits for user click
- Advances presentation

**With Previous:**
- Starts immediately with previous animation
- No user interaction needed
- Multiple animations play simultaneously

**After Previous:**
- Starts when previous animation completes
- Automatic sequencing
- No user interaction needed

**Auto (Slide Entry):**
- Plays immediately when slide appears
- No click required
- Good for entrance effects

### 8.2 Advanced Triggers

**Click Shape to Trigger:**
```
Click on [Rectangle 1] to play animation
```

**Mouse Over to Trigger:**
```
Mouse over [Button 1] to play animation
```

**Bookmark Trigger (Video):**
```
When video reaches bookmark [00:15] play animation
```

**Implementation:**
```typescript
class AnimationTriggerManager {
  setupTrigger(animation, trigger) {
    switch (trigger.type) {
      case 'on-click':
        this.setupClickTrigger(animation);
        break;
      
      case 'click-shape':
        this.setupShapeClickTrigger(animation, trigger.shapeId);
        break;
      
      case 'mouse-over':
        this.setupMouseOverTrigger(animation, trigger.shapeId);
        break;
      
      case 'bookmark':
        this.setupBookmarkTrigger(animation, trigger.videoId, trigger.time);
        break;
    }
  }
  
  setupShapeClickTrigger(animation, shapeId) {
    const shape = document.getElementById(shapeId);
    
    shape.addEventListener('click', () => {
      animationEngine.playAnimation(animation);
    });
    
    // Visual indicator
    shape.style.cursor = 'pointer';
  }
  
  setupMouseOverTrigger(animation, shapeId) {
    const shape = document.getElementById(shapeId);
    
    shape.addEventListener('mouseenter', () => {
      animationEngine.playAnimation(animation);
    });
  }
}
```

---

## 9. Performance Optimization

### 9.1 Animation Caching

**Strategy:** Pre-calculate animation parameters

```typescript
class AnimationCache {
  constructor() {
    this.cache = new Map();
  }
  
  precalculate(animation) {
    const key = `${animation.effect}-${animation.direction}`;
    
    if (!this.cache.has(key)) {
      this.cache.set(key, {
        keyframes: this.generateKeyframes(animation),
        timing: this.calculateTiming(animation)
      });
    }
    
    return this.cache.get(key);
  }
}
```

### 9.2 Hardware Acceleration

**Use CSS transforms:**
```typescript
// Good: GPU accelerated
element.animate([
  { transform: 'translateX(0px)' },
  { transform: 'translateX(100px)' }
], options);

// Bad: Causes reflow
element.animate([
  { left: '0px' },
  { left: '100px' }
], options);
```

### 9.3 Batch Animations

**Group simultaneous animations:**
```typescript
const simultaneousAnimations = animations.filter(
  a => a.trigger === 'with-previous'
);

// Play all at once
await Promise.all(
  simultaneousAnimations.map(a => this.playAnimation(a))
);
```

---

## 10. Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| **Shift + F5** | Start presentation from current slide |
| **Space** / **→** | Next animation or slide |
| **Backspace** / **←** | Previous animation or slide |
| **Ctrl + Shift + F5** | Preview animations on current slide |
| **Alt + Shift + A** | Open Animation Pane |
| **Shift + Ctrl + G** | Group animations |

---

**Next**: See [11-slide-transitions.md](./11-slide-transitions.md) for slide-to-slide transitions.
