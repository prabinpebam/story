# Property Inspector - Placeholder Section

> **Part of:** [Property Inspector Specification v2.0](./00-overview.md)  
> **Implementation:** `src/ui/properties/PlaceholderSection.js`  
> **Uses:** `Section`, `Button` (xs, text variant), `Dropdown`  
> **DO NOT** create custom placeholder buttons. Use `Button` with `variant: 'text'` and `size: 'xs'`.

---

## 1. Overview

The Placeholder Section provides a palette for adding placeholder elements to layout masters. It appears only when editing a layout master in master mode, enabling designers to define content areas that will be populated on individual slides.

### Section Header
- **Title:** "Placeholders"
- **Actions:** None
- **Collapsed by Default:** No

### Visibility Conditions

| Mode | Master Type | Section Visible |
|------|-------------|-----------------|
| Slide | N/A | ❌ Hidden |
| Master | Theme Master | ❌ Hidden |
| Master | Layout Master | ✅ Visible |

---

## 2. Layout Structure

```
┌─────────────────────────────────────────────────────────────────┐
│  Placeholders                                                ▼  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐                         │
│  │   H1    │  │   H2    │  │   ¶    │                         │
│  │  Title  │  │Subtitle │  │ Content│                         │
│  │   [✓]   │  │         │  │        │                         │
│  └─────────┘  └─────────┘  └─────────┘                         │
│                                                                 │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐                         │
│  │    T    │  │   🖼    │  │   ▶    │                         │
│  │  Text   │  │ Picture │  │  Media │                         │
│  │   (2)   │  │         │  │        │                         │
│  └─────────┘  └─────────┘  └─────────┘                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Placeholder Types

### 3.1 Type Definitions

| Type | Icon | Max Count | Description |
|------|------|-----------|-------------|
| `title` | H1 | 1 | Main slide title |
| `subtitle` | H2 | 1 | Slide subtitle |
| `body` | ¶ | 1 | Main content area |
| `text` | T | Unlimited | Generic text box |
| `picture` | 🖼 | Unlimited | Image placeholder |
| `media` | ▶ | Unlimited | Video/audio placeholder |

### 3.2 Type Constraints

**Limited Types** (Title, Subtitle, Content):
- Only one instance allowed per layout
- Disabled after placed
- Shows checkmark when placed

**Unlimited Types** (Text, Picture, Media):
- Multiple instances allowed
- Shows count badge
- Never disabled

---

## 4. Palette Item Structure

### 4.1 Item States

| State | Visual | Interaction |
|-------|--------|-------------|
| Default | Normal background | Clickable, draggable |
| Hover | Highlighted background | Shows tooltip |
| Disabled | Dimmed, no pointer | Not interactive |
| Dragging | Semi-transparent | Being dragged |
| Placed (limited) | Shows checkmark | Disabled |
| Placed (unlimited) | Shows count badge | Still active |

### 4.2 HTML Structure

```html
<div class="placeholder-palette-item" data-type="title" draggable="true">
    <div class="placeholder-icon">H1</div>
    <div class="placeholder-label">Title</div>
    <div class="placeholder-count-badge hidden">2</div>
    <div class="placeholder-checkmark hidden">✓</div>
</div>
```

---

## 5. Interaction Behaviors

### 5.1 Click to Add

| Action | Result |
|--------|--------|
| Click palette item | Add placeholder at default position |
| Click disabled item | No action |

**Default Positions:**

| Type | X | Y | Width | Height |
|------|---|---|-------|--------|
| Title | margin | 80 | slide - 2×margin | 120 |
| Subtitle | margin | 220 | slide - 2×margin | 80 |
| Body | margin | 320 | slide - 2×margin | slide - 420 |
| Text | margin + random | 350 + random | 400 | 150 |
| Picture | center - 200 | center - 150 | 400 | 300 |
| Media | center - 240 | center - 135 | 480 | 270 |

### 5.2 Drag to Place

```
Drag Start → Canvas Drag Over → Canvas Drop
     │              │                 │
     ▼              ▼                 ▼
Set drag data   Show preview    Create at drop
Notify canvas   at cursor       position
```

**Implementation:**

```javascript
element.addEventListener('dragstart', (e) => {
    if (element.classList.contains('disabled')) {
        e.preventDefault();
        return;
    }
    e.dataTransfer.setData('application/x-placeholder-type', type.id);
    e.dataTransfer.effectAllowed = 'copy';
    element.classList.add('dragging');
    
    // Notify canvas
    store.dispatch('SET_DRAG_PLACEHOLDER', { type: type.id });
});
```

---

## 6. Placeholder Element Data

### 6.1 Element Structure

```javascript
const placeholder = {
    id: 'placeholder-title-1234567890',
    type: 'text',
    isPlaceholder: true,
    placeholderType: 'title',  // title|subtitle|body|text|picture|media
    content: '<h1>Click to add title</h1>',
    x: 100,
    y: 80,
    width: 1720,
    height: 120,
    rotation: 0,
    opacity: 1,
    style: {
        fontSize: 72,
        textAlign: 'center',
        verticalAlign: 'middle',
        color: 'var(--theme-text-primary)',
        fontFamily: 'var(--theme-font-heading)',
        fontWeight: '700'
    }
};
```

### 6.2 Placeholder Content

| Type | Default Content |
|------|-----------------|
| Title | `<h1>Click to add title</h1>` |
| Subtitle | `<p>Click to add subtitle</p>` |
| Body | `<p>Click to add text</p>` |
| Text | `<p>Click to add text</p>` |
| Picture | `<p>🖼️ Click to add picture</p>` |
| Media | `<p>▶️ Click to add media</p>` |

---

## 7. State Management

### 7.1 Counting Placed Placeholders

```javascript
updatePlacedCounts(layout) {
    this.placedCounts = {};
    this.placeholderTypes.forEach(type => {
        this.placedCounts[type.id] = 0;
    });

    Object.values(layout.elements || {}).forEach(el => {
        if (el.isPlaceholder && el.placeholderType) {
            this.placedCounts[el.placeholderType]++;
        }
    });
}
```

### 7.2 Updating Palette States

```javascript
updatePaletteStates() {
    this.placeholderTypes.forEach(type => {
        const item = this.paletteItems[type.id];
        const count = this.placedCounts[type.id] || 0;
        
        const isDisabled = count >= type.maxCount;
        item.setDisabled(isDisabled);
        
        if (type.maxCount !== Infinity && count > 0) {
            item.showCheckmark(true);
        } else {
            item.showCheckmark(false);
        }
        
        item.updateBadge(count);
    });
}
```

---

## 8. CSS Specifications

### 8.1 Grid Layout

```css
.placeholder-palette {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    padding: 8px 12px;
}
```

### 8.2 Palette Item

```css
.placeholder-palette-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 12px 8px;
    background: var(--color-bg-input);
    border: 1px solid var(--color-border-subtle);
    border-radius: 6px;
    cursor: pointer;
    transition: all 150ms ease-out;
    position: relative;
}

.placeholder-palette-item:hover:not(.disabled) {
    background: var(--color-bg-hover);
    border-color: var(--color-border-strong);
}

.placeholder-palette-item.disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.placeholder-palette-item.dragging {
    opacity: 0.5;
}
```

### 8.3 Icons and Labels

```css
.placeholder-icon {
    font-size: 24px;
    margin-bottom: 4px;
    color: var(--color-text-primary);
}

.placeholder-label {
    font-size: 11px;
    color: var(--color-text-secondary);
    text-align: center;
}
```

### 8.4 Badges and Checkmarks

```css
.placeholder-count-badge {
    position: absolute;
    top: 4px;
    right: 4px;
    min-width: 16px;
    height: 16px;
    background: var(--color-accent-primary);
    color: white;
    border-radius: 8px;
    font-size: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 4px;
}

.placeholder-checkmark {
    position: absolute;
    top: 4px;
    right: 4px;
    color: var(--color-accent-success);
    font-size: 14px;
}

.hidden {
    display: none !important;
}
```

---

## 9. Accessibility (ARIA)

### 9.1 Section ARIA

```html
<div class="pi-section" role="group" aria-labelledby="placeholder-section-title">
    <button 
        id="placeholder-section-title"
        class="pi-section-header"
        aria-expanded="true"
        aria-controls="placeholder-content"
    >
        Placeholders
    </button>
    <div id="placeholder-content" role="region">
        <div class="placeholder-palette" role="listbox" aria-label="Placeholder types">
            <!-- Palette items -->
        </div>
    </div>
</div>
```

### 9.2 Palette Item ARIA

```html
<div 
    class="placeholder-palette-item"
    role="option"
    aria-label="Title placeholder"
    aria-disabled="false"
    aria-selected="false"
    tabindex="0"
>
    <!-- Content -->
</div>
```

### 9.3 Screen Reader Announcements

| Event | Announcement |
|-------|--------------|
| Placeholder added | "Title placeholder added to layout" |
| Placeholder disabled | "Title placeholder already placed" |
| Drag started | "Dragging Title placeholder" |
| Drag cancelled | "Drag cancelled" |

---

## 10. Integration Points

### 10.1 Store Actions

| Action | Payload | Description |
|--------|---------|-------------|
| `ADD_ELEMENT_TO_MASTER` | `{ masterId, element }` | Add placeholder element |
| `SET_DRAG_PLACEHOLDER` | `{ type }` | Notify canvas of drag |
| `SET_SELECTION` | `{ elementIds }` | Select new placeholder |

### 10.2 Canvas Integration

When dragging:
1. Canvas receives `SET_DRAG_PLACEHOLDER` action
2. Canvas shows drop preview at cursor
3. On drop, canvas calculates position
4. PlaceholderSection creates element at drop position

---

## 11. Future Enhancements

### 11.1 Planned

- [ ] **Custom placeholder types:** User-defined placeholder categories
- [ ] **Placeholder templates:** Pre-styled placeholder designs
- [ ] **Placeholder groups:** Grouped placeholder arrangements

### 11.2 Considered

- [ ] **Drag preview:** Ghost image during drag
- [ ] **Snap to guides:** Align placeholders to layout guides
- [ ] **Placeholder locking:** Prevent accidental modification

---

## See Also

- [00-overview.md](./00-overview.md) - Property Inspector overview
- [10-slide-section.md](./10-slide-section.md) - Slide and master properties
- [15-glossary.md](./15-glossary.md) - Term definitions

---

## Next Section: [12 - Interactions](./12-interactions.md)
