# Font Management Specification

## Component: `FontManager`
**File**: `src/core/FontManager.js`

The `FontManager` is a critical service responsible for ensuring fonts are available and loaded in the browser. It must handle network requests, caching, and fallback strategies to ensure zero layout shifts (CLS) where possible.

## Requirements

### 1. Font Inventory
The manager must maintain a registry of high-quality, open-license fonts (primarily Google Fonts).
- **Categories**:
  - Sans Serif (e.g., Inter, Roboto, Open Sans)
  - Serif (e.g., Merriweather, Playfair Display)
  - Display (e.g., Montserrat, Oswald)
  - Monospace (e.g., Fira Code, Roboto Mono)
  - Handwriting (e.g., Caveat, Pacifico)

### 2. Dynamic Loading Strategy
- **Lazy Loading**: Fonts should only be loaded when requested by a Theme or User Action.
- **Batching**: Requests for multiple weights (400, 700) of the same family should be batched into a single request.
- **Provider**: Google Fonts API (or self-hosted proxy for privacy compliance).

### 3. System Font Fallbacks
The system must provide robust fallbacks to ensure text is readable even if web fonts fail.
- **Stack**:
  - `-apple-system`
  - `BlinkMacSystemFont`
  - `Segoe UI`
  - `Roboto`
  - `Helvetica Neue`
  - `Arial`

## API Specification

```javascript
interface IFontManager {
  /** Checks if a font family is currently available in the document */
  isFontLoaded(family: string): boolean;

  /** Triggers a load of the specified font family */
  loadFont(family: string): Promise<void>;

  /** Returns the list of all available font definitions */
  getAvailableFonts(): FontDefinition[];
}
```
