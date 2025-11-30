# Property Memory System Specification

## 1. Overview

The Property Memory System provides intelligent persistence of user preferences across flyout panels, property editors, and editing sessions. This ensures users don't lose their work and can quickly return to frequently-used settings.

### Design Principles

1. **Memory Reads From Selection**: Memory is updated FROM selected objects, never applied TO them. Selecting an object updates memory with its properties.
2. **Update on Panel Open**: Memory is only updated when the corresponding panel/flyout is opened. Simply selecting an object does NOT update memory.
3. **Context Separation**: Different property contexts (fill, stroke, text color, etc.) maintain separate memory
4. **Mode Preservation**: Within a session, switching between modes preserves settings for each mode
5. **Selective Persistence**: Only appropriate data persists across sessions (no large media assets)
6. **Gradient Consistency**: Gradient stops are shared across all gradient types within a context

---

## 2. Memory Direction: Read From Selection

### 2.1 Core Behavior

**Memory does NOT override object properties.** Instead, memory is updated FROM the currently selected object.

```
┌─────────────────────────────────────────────────────────────┐
│                    MEMORY UPDATE FLOW                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   User selects object → User opens fill panel               │
│                              ↓                              │
│                    Object's fill properties                 │
│                              ↓                              │
│                    Memory is UPDATED with                   │
│                    object's current values                  │
│                                                             │
│   ✅ Correct: Memory learns from selection                  │
│   ❌ Wrong:   Memory overwrites selection                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 When Memory Updates

| Action | Memory Updated? | Notes |
|--------|-----------------|-------|
| Select object | ❌ No | Selection alone doesn't update memory |
| Open fill panel | ✅ Yes | Object's fill becomes new memory |
| Open typography panel | ✅ Yes | Object's typography becomes memory |
| Switch fill mode (in panel) | ✅ Yes | New mode settings saved to memory |
| Close panel | ✅ Yes | Final state saved to persistent memory |
| Edit value in panel | ✅ Yes | Changes apply to object AND update memory |

### 2.3 When Memory is Used

Memory is only used when there is **no selection** or when **applying to a new object**:

| Scenario | Memory Used? | Behavior |
|----------|--------------|----------|
| Object selected, open panel | ❌ No | Show object's actual properties |
| No selection, open panel | ✅ Yes | Show last-remembered values |
| Add new fill to object | ✅ Yes | New fill uses memory defaults |
| Create new object | ✅ Yes | New object uses memory values |
| Add new effect | ✅ Yes | New effect uses effect memory |

### 2.4 Example Flow

```javascript
// User Flow:
// 1. Select Rectangle A (blue fill)
// 2. Open fill panel
//    → Memory updated: { solid: { color: '#0000FF' } }
// 3. Close panel
// 4. Select Rectangle B (red fill)  
// 5. Open fill panel
//    → Panel shows RED (object's color), not blue
//    → Memory updated: { solid: { color: '#FF0000' } }
// 6. Memory now remembers red
```

---

## 3. Fill & Color Picker Memory

### 3.1 Memory Scopes

| Scope | Description | Lifetime | Storage |
|-------|-------------|----------|---------|
| **Session Memory** | While flyout is open | Until flyout closes | In-memory state |
| **Persistent Memory** | Across sessions | Until app reset/clear | localStorage |

### 3.2 Property Contexts

Each context maintains its own independent memory:

| Context Key | Description | Used In |
|-------------|-------------|---------|
| `fill.object` | Object/shape fill | Property Inspector → Fill section |
| `fill.slide` | Slide background fill | Slide properties |
| `fill.text` | Text color/fill | Typography section |
| `stroke.object` | Stroke/border color | Property Inspector → Stroke section |
| `effect.shadow` | Drop shadow color | Effects section |
| `effect.glow` | Outer/inner glow color | Effects section |

### 3.3 Session Memory (Flyout Open)

While the flyout panel remains open (not closed), **all fill modes remember their last-used state**:

```typescript
interface SessionFillMemory {
    // Per-mode memory
    solid: {
        color: string;      // Hex color
        opacity: number;    // 0-100
    };
    gradient: {
        type: 'linear' | 'radial' | 'angular' | 'diamond';
        stops: GradientStop[];  // Shared across all gradient types
        angle: number;          // For linear
        // ... other gradient settings
    };
    image: {
        assetId: string | null;
        scaleMode: 'fill' | 'fit' | 'crop' | 'tile';
        position: { x: number; y: number };
        adjustments: ImageAdjustments;
    };
    video: {
        assetId: string | null;
        scaleMode: 'fill' | 'fit' | 'crop';
        playback: VideoPlaybackSettings;
        adjustments: ImageAdjustments;
    };
    codeFill: {
        code: string;
        presetId: string | null;
    };
    
    // Currently active mode
    activeMode: 'solid' | 'gradient' | 'image' | 'video' | 'codeFill';
}
```

**Key Behaviors:**

1. **Tab Switching**: Changing from Solid → Gradient → Image and back preserves each mode's state
2. **Gradient Type Switching**: Changing Linear → Radial → Angular preserves the same stops
3. **No Data Loss**: User can freely explore modes without losing work

### 3.4 Persistent Memory (Across Sessions)

When the flyout closes, only **appropriate data** persists:

| Mode | Persisted | Reason |
|------|-----------|--------|
| **Solid** | ✅ Color, Opacity | Small data, frequently reused |
| **Gradient** | ✅ Type, Stops, Angle | Small data, complex to recreate |
| **Image** | ❌ Not persisted | Asset may not exist, large data |
| **Video** | ❌ Not persisted | Asset may not exist, large data |
| **Code Fill** | ✅ Code, Preset ID | Small data, complex to recreate |

```typescript
interface PersistentFillMemory {
    solid: {
        color: string;
        opacity: number;
    };
    gradient: {
        type: 'linear' | 'radial' | 'angular' | 'diamond';
        stops: GradientStop[];
        angle: number;
    };
    codeFill: {
        code: string;
        presetId: string | null;
    };
    
    // Last active mode (for initial tab selection)
    lastActiveMode: 'solid' | 'gradient' | 'codeFill';
}
```

**Fallback Behavior:**

When opening flyout with no memory or when media fill was last used:
- Default to **Solid** mode
- Use last remembered solid color, or default black (#000000)

### 3.5 Gradient Stop Sharing

**Critical Rule**: Gradient stops are **shared across all gradient types** within a single context.

```javascript
// Example: User creates stops for linear gradient
gradient.stops = [
    { position: 0, color: '#FF0000', opacity: 100 },
    { position: 50, color: '#00FF00', opacity: 100 },
    { position: 100, color: '#0000FF', opacity: 100 }
];

// Switching to radial uses SAME stops
gradient.type = 'radial';  // Stops unchanged

// Switching to angular uses SAME stops
gradient.type = 'angular'; // Stops unchanged
```

**Rationale**: Users often want the same color progression with different gradient shapes.

---

## 4. Typography Memory

### 4.1 Memory Contexts

| Context Key | Description |
|-------------|-------------|
| `typography.text` | Text element properties |
| `typography.heading` | Heading presets (future) |

### 4.2 Remembered Properties

```typescript
interface TypographyMemory {
    // Font selection
    fontFamily: string;
    fontWeight: string | number;
    fontStyle: 'normal' | 'italic';
    
    // Size and spacing
    fontSize: number;
    lineHeight: number | 'auto';
    letterSpacing: number;
    
    // Alignment
    textAlign: 'left' | 'center' | 'right' | 'justify';
    verticalAlign: 'top' | 'middle' | 'bottom';
    
    // Decoration
    textDecoration: 'none' | 'underline' | 'strikethrough';
    textTransform: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
    
    // Text fill (uses fill memory context 'fill.text')
    // - References fill memory system
}
```

### 4.3 Persistence Rules

| Property | Session | Persistent | Notes |
|----------|---------|------------|-------|
| Font Family | ✅ | ✅ | Popular choice |
| Font Weight | ✅ | ✅ | Common variation |
| Font Style | ✅ | ✅ | Italic preference |
| Font Size | ✅ | ❌ | Too context-specific |
| Line Height | ✅ | ❌ | Too context-specific |
| Letter Spacing | ✅ | ❌ | Too context-specific |
| Text Align | ✅ | ✅ | User preference |
| Vertical Align | ✅ | ✅ | User preference |
| Text Decoration | ✅ | ❌ | Rarely default |
| Text Transform | ✅ | ❌ | Rarely default |

---

## 5. Effects Memory

### 5.1 Memory Contexts

| Context Key | Description |
|-------------|-------------|
| `effect.dropShadow` | Drop shadow defaults |
| `effect.innerShadow` | Inner shadow defaults |
| `effect.blur` | Blur effect defaults |
| `effect.glow` | Glow effect defaults |

### 5.2 Remembered Properties

```typescript
interface DropShadowMemory {
    x: number;
    y: number;
    blur: number;
    spread: number;
    color: string;      // Uses effect.shadow fill context
    opacity: number;
}

interface InnerShadowMemory {
    x: number;
    y: number;
    blur: number;
    spread: number;
    color: string;
    opacity: number;
}

interface BlurMemory {
    amount: number;
}

interface GlowMemory {
    blur: number;
    spread: number;
    color: string;      // Uses effect.glow fill context
    opacity: number;
}
```

### 5.3 Persistence Rules

| Property | Session | Persistent | Notes |
|----------|---------|------------|-------|
| Shadow X/Y | ✅ | ✅ | Common style choice |
| Shadow Blur | ✅ | ✅ | Common style choice |
| Shadow Spread | ✅ | ✅ | Common style choice |
| Shadow Color | ✅ | ✅ | Via fill memory |
| Blur Amount | ✅ | ❌ | Too context-specific |
| Glow Settings | ✅ | ✅ | Common style choice |

---

## 6. Storage Architecture

### 6.1 localStorage Keys

```javascript
const STORAGE_KEYS = {
    // Fill memory per context
    'story.memory.fill.object': PersistentFillMemory,
    'story.memory.fill.slide': PersistentFillMemory,
    'story.memory.fill.text': PersistentFillMemory,
    'story.memory.stroke.object': PersistentFillMemory,
    'story.memory.effect.shadow': PersistentFillMemory,
    
    // Typography memory
    'story.memory.typography': TypographyMemory,
    
    // Effects memory
    'story.memory.effects.dropShadow': DropShadowMemory,
    'story.memory.effects.innerShadow': InnerShadowMemory,
    'story.memory.effects.glow': GlowMemory,
};
```

### 6.2 Memory Manager Service

```typescript
class PropertyMemoryManager {
    private sessionMemory: Map<string, any> = new Map();
    
    // Session memory (in-memory only)
    getSessionMemory<T>(contextKey: string): T | null;
    setSessionMemory<T>(contextKey: string, value: T): void;
    clearSessionMemory(contextKey: string): void;
    
    // Persistent memory (localStorage)
    getPersistentMemory<T>(contextKey: string): T | null;
    setPersistentMemory<T>(contextKey: string, value: T): void;
    clearPersistentMemory(contextKey: string): void;
    
    // Combined getter (session takes precedence)
    getMemory<T>(contextKey: string): T | null;
    
    // Lifecycle hooks
    onFlyoutOpen(contextKey: string): void;  // Load from persistent
    onFlyoutClose(contextKey: string): void; // Save to persistent
}

export const propertyMemory = new PropertyMemoryManager();
```

### 6.3 Integration with Flyout Components

```javascript
// FillFlyout.js example
class FillFlyout {
    constructor(contextKey) {
        this.contextKey = contextKey; // e.g., 'fill.object'
    }
    
    open(selectedObject) {
        // CRITICAL: Memory reads FROM selection, not applied TO it
        if (selectedObject && selectedObject.fill) {
            // Object is selected: UPDATE memory with object's fill
            this.updateMemoryFromObject(selectedObject);
            // Display object's actual fill (NOT memory)
            this.displayObjectFill(selectedObject.fill);
        } else {
            // No selection: USE memory for defaults
            const memory = propertyMemory.getMemory(this.contextKey);
            if (memory) {
                this.displayMemoryState(memory);
            }
        }
    }
    
    updateMemoryFromObject(object) {
        // Extract fill properties and update memory
        const fillState = this.extractFillState(object.fill);
        propertyMemory.setSessionMemory(this.contextKey, fillState);
    }
    
    close() {
        // Save current state to memory on close
        const state = this.getCurrentState();
        propertyMemory.setSessionMemory(this.contextKey, state);
        propertyMemory.onFlyoutClose(this.contextKey); // Persists if appropriate
    }
    
    onValueChange(property, value) {
        // Changes go to BOTH object AND memory
        this.applyToObject(property, value);
        this.updateMemory(property, value);
    }
}
```

---

## 7. Default Values

### 7.1 Fill Defaults

```typescript
const DEFAULT_FILL_MEMORY: PersistentFillMemory = {
    solid: {
        color: '#000000',
        opacity: 100
    },
    gradient: {
        type: 'linear',
        stops: [
            { position: 0, color: '#000000', opacity: 100 },
            { position: 100, color: '#FFFFFF', opacity: 100 }
        ],
        angle: 180
    },
    codeFill: {
        code: '',
        presetId: null
    },
    lastActiveMode: 'solid'
};
```

### 7.2 Typography Defaults

```typescript
const DEFAULT_TYPOGRAPHY_MEMORY: TypographyMemory = {
    fontFamily: 'Inter',
    fontWeight: 400,
    fontStyle: 'normal',
    fontSize: 16,
    lineHeight: 'auto',
    letterSpacing: 0,
    textAlign: 'left',
    verticalAlign: 'top',
    textDecoration: 'none',
    textTransform: 'none'
};
```

### 7.3 Effects Defaults

```typescript
const DEFAULT_DROP_SHADOW_MEMORY: DropShadowMemory = {
    x: 0,
    y: 4,
    blur: 8,
    spread: 0,
    color: '#000000',
    opacity: 25
};

const DEFAULT_GLOW_MEMORY: GlowMemory = {
    blur: 10,
    spread: 0,
    color: '#FFFFFF',
    opacity: 75
};
```

---

## 8. Edge Cases & Special Handling

### 8.1 First-Time Use

When no memory exists:
1. Load default values
2. Don't persist until user makes a change

### 8.2 Corrupted Storage

If localStorage data is corrupted:
1. Catch JSON parse errors
2. Clear corrupted key
3. Return default values
4. Log warning (dev mode only)

### 8.3 Version Migration

If memory schema changes:
```javascript
const MEMORY_VERSION = 2;

interface StoredMemory {
    version: number;
    data: any;
}

function loadMemory(key) {
    const stored = localStorage.getItem(key);
    if (!stored) return getDefaults(key);
    
    const parsed = JSON.parse(stored);
    
    if (parsed.version !== MEMORY_VERSION) {
        return migrateMemory(parsed.version, parsed.data);
    }
    
    return parsed.data;
}
```

### 8.4 Multiple Elements Selected

When multiple elements are selected:
- **Reading**: Show "Mixed" for differing values
- **Writing**: Apply to all selected elements
- **Memory**: Use the last explicitly set value

### 8.5 Context Switching

When user switches from one element to another:
1. Current flyout closes → saves to memory
2. New flyout opens → loads appropriate context memory
3. Different elements = independent memory contexts

---

## 9. Implementation Checklist

### Phase 1: Core Infrastructure
- [ ] Create `PropertyMemoryManager` service
- [ ] Define storage keys and interfaces
- [ ] Implement localStorage read/write with error handling
- [ ] Add version migration support

### Phase 2: Fill Flyout Integration
- [ ] Update `FillFlyout` to use memory manager
- [ ] Implement session memory for all fill modes
- [ ] Implement gradient stop sharing across types
- [ ] Add persistent memory for solid, gradient, code
- [ ] Test context separation (fill vs stroke vs text)

### Phase 3: Typography Integration
- [ ] Create `TypographyMemory` interface
- [ ] Update typography panel to use memory
- [ ] Implement session and persistent memory
- [ ] Test with text color flyout (separate context)

### Phase 4: Effects Integration
- [ ] Create `EffectsMemory` interfaces
- [ ] Update effects section to use memory
- [ ] Implement shadow/glow color memory (uses fill system)

### Phase 5: Testing & Polish
- [ ] Test flyout open/close cycles
- [ ] Test mode switching within session
- [ ] Test persistence across browser refresh
- [ ] Test context separation
- [ ] Test default value fallbacks
- [ ] Test corrupted data handling

---

## 10. Related Documents

- [Color Picker UI Specification](../fills/color-picker-ui.md)
- [Gradient Fill Specification](../fills/gradient-fill.md)
- [Code Fill Panel Specification](../fills/code-fill-panel.md)
- [Media Fill System](../fills/media-fill-system.md)
- [Typography Style Manager](../design-system/typography-style-manager.md)
- [Data Model Properties](../storage/data-model-properties.md)
