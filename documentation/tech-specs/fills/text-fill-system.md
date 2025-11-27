# Text Fill System Tech Spec

## Overview
This document outlines the technical implementation of the advanced text fill system, specifically focusing on Gradient and Code (Generative) fills for typography.

## Architecture

### 1. Data Model
The text element's data structure supports a polymorphic `textFill` property:

```javascript
// Solid
{
    type: 'solid',
    value: '#FF0000',
    opacity: 100
}

// Gradient
{
    type: 'gradient',
    value: {
        type: 'linear',
        angle: 90,
        stops: [
            { color: '#FF0000', position: 0 },
            { color: '#0000FF', position: 1 }
        ]
    }
}

// Code (Generative)
{
    type: 'code',
    code: 'return { draw: (t) => { ... } }'
}
```

### 2. UI Layer (`TextSection.js`)
- The Typography section in the Property Inspector handles fill configuration.
- It delegates complex fill editing (Gradient, Code) to the `FillFlyout` component.
- It adapts the `FillFlyout` output to the `textFill` property structure.
- The generic `FillSection` is hidden when a text element is selected to avoid redundancy.

### 3. Rendering Layer (`TextElement.js`)

#### Gradient Fill
- **Implementation**: CSS `background-clip: text`.
- **Mechanism**:
    1.  Construct a CSS `linear-gradient` or `radial-gradient` string.
    2.  Apply it to `background-image`.
    3.  Set `-webkit-background-clip: text`.
    4.  Set `-webkit-text-fill-color: transparent`.
    5.  Set `color: transparent` (fallback).

#### Code Fill
- **Implementation**: Offscreen Canvas + Data URL Sync.
- **Mechanism**:
    1.  **CodeRunner**: A `CodeRunner` instance is created for the text element.
    2.  **Canvas**: An offscreen canvas is created, sized to match the text element's dimensions.
    3.  **Execution**: The user's code is executed by `CodeRunner`, drawing to the offscreen canvas.
    4.  **Sync Loop**: A `requestAnimationFrame` loop captures the canvas state using `toDataURL()`.
    5.  **Application**: The Data URL is applied as the `background-image` of the text element.
    6.  **Masking**: `background-clip: text` masks the dynamic background to the text shape.

### 4. Performance Considerations
- **Code Fill**: The `toDataURL()` operation is synchronous and potentially expensive.
    - *Optimization*: The sync loop only runs if the `CodeRunner` is playing.
    - *Future Optimization*: Consider using `createImageBitmap` or CSS Paint API (Houdini) when browser support improves.
- **Memory**: `CodeRunner` instances are cleaned up (`stop()`) when the element is unmounted or the fill type changes.

## Limitations
- **Browser Support**: Relies on `-webkit-background-clip: text` (widely supported but prefixed).
- **Performance**: High-resolution animated code fills on large text blocks may impact frame rate due to Data URL generation.
