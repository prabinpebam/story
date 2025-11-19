# Feature Spec: Typography & Media

## 1. Typography Engine

### 1.1 Text Object
- **Rendering:** HTML `div` with `contenteditable="true"` (or a custom implementation if advanced layout is needed).
- **Auto-Resize:**
    - **Auto Width:** Box grows horizontally as you type.
    - **Fixed Width:** Text wraps to next line. Box grows vertically.
    - **Fixed Size:** Text overflows or is clipped (user configurable).

### 1.2 Formatting Properties
- **Font Family:**
    - **System Fonts:** Arial, Helvetica, Times New Roman, etc.
    - **Google Fonts:** Integrated picker to load fonts dynamically.
    - **Custom Fonts:** Support for uploading `.woff2` files.
- **Basic:** Size (px), Weight (100-900), Style (Italic).
- **Advanced:**
    - **Line Height:** Multiplier (e.g., 1.2) or px.
    - **Letter Spacing:** Tracking (em).
    - **Text Transform:** Uppercase, Lowercase, Capitalize.
    - **Alignment:** Left, Center, Right, Justify.

### 1.3 Text Styles (Global)
- Users can define global styles: `Header 1`, `Header 2`, `Body`, `Caption`.
- **Update Propagation:** Changing the definition of `Header 1` updates all text objects using that style across the entire deck.

## 2. Visual Assets (Media)

### 2.1 Images
- **Formats:** JPG, PNG, WEBP, SVG, GIF.
- **Import:** Drag and drop from OS, or "Upload" button.
- **Processing:**
    - **Crop:** Non-destructive masking. User enters "Crop Mode" to adjust the image within its frame.
    - **Filters:** CSS Filters (Grayscale, Blur, Brightness, Contrast, Saturation).
    - **Border:** Radius (Rounded corners) and Stroke.
    - **Shadow:** Drop shadow controls (X, Y, Blur, Color).

### 2.2 Icon Library
- **Integration:** FontAwesome (Free) and Noun Project (API).
- **Search:** Sidebar panel with search bar.
- **Insertion:** Drag and drop SVG onto canvas.
- **Styling:** SVGs are treated as shapes (can change Fill Color).

### 2.3 Shapes
- **Primitives:** Rectangle, Ellipse, Triangle, Star, Polygon, Line/Arrow.
- **Properties:** Fill (Solid/Gradient), Stroke (Width, Style: Dashed/Solid), Corner Radius.
