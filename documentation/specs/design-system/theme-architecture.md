# Theme Architecture Specification

**Version**: 1.0  
**Date**: 2024-11-30  
**Status**: Proposed  

---

## 1. Overview

This specification defines the multi-theme architecture for Story. Theming is not just about colors—it encompasses typography, spacing, and visual treatment. Each theme has both light and dark mode variants.

### 1.1 Why Multi-Theme?

1. **Design System Validation**: If the design system breaks when switching themes, there are hardcoded values
2. **User Preference**: Different users prefer different visual styles
3. **Context Adaptation**: Presentation mode may need a different theme than editing mode
4. **Enterprise Customization**: Corporate clients may want branded themes

### 1.2 Theme Components

A theme is composed of:

| Component | What It Controls |
|-----------|------------------|
| **Colors** | Accent, backgrounds, text, borders, semantic colors |
| **Typography** | Font family, size scale, weight scale |
| **Spacing** | Base grid, padding/margin scale |
| **Radii** | Corner radius values |
| **Shadows** | Shadow intensity and spread |
| **Motion** | Animation timing and easing |

---

## 2. Theme Structure

### 2.1 TypeScript Interface

```typescript
interface Theme {
  id: string;
  name: string;
  description: string;
  
  // Each theme has light and dark variants
  modes: {
    light: ThemeTokens;
    dark: ThemeTokens;
  };
}

interface ThemeTokens {
  colors: ColorTokens;
  typography: TypographyTokens;
  spacing: SpacingTokens;
  radii: RadiusTokens;
  shadows: ShadowTokens;
  motion: MotionTokens;
}

interface ColorTokens {
  // Brand
  accent: string;
  accentHover: string;
  accentActive: string;
  accentSubtle: string;   // 15% opacity - for hover backgrounds
  accentMuted: string;    // 25% opacity - for active backgrounds
  
  // Backgrounds
  bgApp: string;
  bgSecondary: string;
  bgTertiary: string;
  bgElevated: string;
  bgInput: string;
  bgHover: string;        // Derived from accentSubtle
  bgActive: string;       // Derived from accentMuted
  
  // Text
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textDisabled: string;
  textOnAccent: string;
  
  // Borders
  border: string;
  borderSubtle: string;
  borderStrong: string;
  borderFocus: string;    // Same as accent
  
  // Semantic
  success: string;
  warning: string;
  error: string;
  info: string;
}

interface TypographyTokens {
  fontFamilyUI: string;
  fontFamilyMono: string;
  fontFamilyDisplay?: string;  // Optional: for headers
  
  // Size scale (7-step)
  fontSize2xs: string;
  fontSizeXs: string;
  fontSizeSm: string;
  fontSizeMd: string;
  fontSizeLg: string;
  fontSizeXl: string;
  fontSize2xl: string;
  
  // Weight scale
  fontWeightRegular: number;
  fontWeightMedium: number;
  fontWeightSemibold: number;
  fontWeightBold: number;
  
  // Line heights
  lineHeightTight: number;
  lineHeightNormal: number;
  lineHeightRelaxed: number;
}

interface SpacingTokens {
  baseGrid: number;  // 4px default, can be 3px for compact
  
  // Derived from baseGrid
  spacing1: string;   // 1 * base
  spacing2: string;   // 2 * base
  spacing3: string;   // 3 * base
  spacing4: string;   // 4 * base
  spacing5: string;   // 5 * base
  spacing6: string;   // 6 * base
  spacing8: string;   // 8 * base
  spacing10: string;  // 10 * base
  spacing12: string;  // 12 * base
}

interface RadiusTokens {
  radiusXs: string;
  radiusSm: string;
  radiusMd: string;
  radiusLg: string;
  radiusXl: string;
  radius2xl: string;
  radiusFull: string;
}

interface ShadowTokens {
  shadowSm: string;
  shadowMd: string;
  shadowLg: string;
  shadowFloating: string;
}

interface MotionTokens {
  durationFast: string;
  durationNormal: string;
  durationSlow: string;
  easeDefault: string;
  easeIn: string;
  easeOut: string;
  easeInOut: string;
}
```

---

## 3. Planned Themes

### 3.1 Story Default

The current theme—dark-first, blue accent, Inter font.

```css
html[data-theme="default"] {
  /* Colors */
  --color-accent: #18A0FB;
  --color-accent-subtle: rgba(24, 160, 251, 0.15);
  --color-accent-muted: rgba(24, 160, 251, 0.25);
  
  /* Typography */
  --font-family-ui: 'Inter', -apple-system, sans-serif;
  --font-family-mono: 'JetBrains Mono', monospace;
  
  /* Spacing */
  --spacing-base: 4px;
  
  /* Radii */
  --radius-sm: 4px;
  --radius-md: 6px;
}
```

### 3.2 Minimal

Compact, expert-focused. Tighter spacing, smaller text, muted colors.

```css
html[data-theme="minimal"] {
  /* Colors - more muted accent */
  --color-accent: #64B5F6;
  --color-accent-subtle: rgba(100, 181, 246, 0.12);
  --color-accent-muted: rgba(100, 181, 246, 0.20);
  
  /* Typography - smaller scale */
  --font-family-ui: 'SF Pro Text', -apple-system, sans-serif;
  --font-size-md: 11px;  /* instead of 12px */
  --font-size-lg: 12px;  /* instead of 13px */
  
  /* Spacing - tighter */
  --spacing-base: 3px;
  
  /* Radii - sharper */
  --radius-sm: 2px;
  --radius-md: 4px;
}
```

### 3.3 Vibrant

Bold, presentation-friendly. Larger targets, more contrast, stronger colors.

```css
html[data-theme="vibrant"] {
  /* Colors - stronger accent */
  --color-accent: #00D4FF;
  --color-accent-subtle: rgba(0, 212, 255, 0.18);
  --color-accent-muted: rgba(0, 212, 255, 0.30);
  
  /* Typography - larger scale */
  --font-family-ui: 'Inter', sans-serif;
  --font-size-md: 14px;  /* instead of 12px */
  --font-size-lg: 16px;  /* instead of 13px */
  
  /* Spacing - more generous */
  --spacing-base: 5px;
  
  /* Radii - softer */
  --radius-sm: 6px;
  --radius-md: 10px;
}
```

### 3.4 Corporate

Conservative, enterprise-friendly. Serif headers, muted palette, professional.

```css
html[data-theme="corporate"] {
  /* Colors - purple accent */
  --color-accent: #7C3AED;
  --color-accent-subtle: rgba(124, 58, 237, 0.15);
  --color-accent-muted: rgba(124, 58, 237, 0.25);
  
  /* Typography - serif headers */
  --font-family-ui: 'IBM Plex Sans', sans-serif;
  --font-family-display: 'IBM Plex Serif', serif;
  
  /* Spacing - standard */
  --spacing-base: 4px;
  
  /* Radii - subtle */
  --radius-sm: 3px;
  --radius-md: 5px;
}
```

---

## 4. Theme + Mode Matrix

Each theme has light and dark modes:

| Theme | Dark Mode | Light Mode |
|-------|-----------|------------|
| Default | ✅ Current | ✅ Exists |
| Minimal | 🔄 Planned | 🔄 Planned |
| Vibrant | 🔄 Planned | 🔄 Planned |
| Corporate | 🔄 Planned | 🔄 Planned |

### 4.1 Mode Affects Colors Only

When switching between light/dark mode within a theme:
- **Background colors** flip (dark ↔ light)
- **Text colors** flip (light ↔ dark)
- **Accent colors** stay the same
- **Typography** stays the same
- **Spacing** stays the same

```css
/* Dark mode (default) */
html[data-theme="default"] body.mode-dark {
  --color-bg-app: #1E1E1E;
  --color-text-primary: #FFFFFF;
}

/* Light mode */
html[data-theme="default"] body.mode-light {
  --color-bg-app: #FFFFFF;
  --color-text-primary: #1A1A1A;
}
```

---

## 5. Implementation Strategy

### 5.1 Phase 1: Token Audit (Current)

1. Identify all hardcoded values in CSS
2. Identify all hardcoded values in JavaScript
3. Replace with CSS variables
4. Validate light/dark toggle works

### 5.2 Phase 2: Accent-Based Interactions

1. Update `--color-bg-hover` to use `--color-accent-subtle`
2. Update `--color-bg-active` to use `--color-accent-muted`
3. Add `--color-accent-muted` token
4. Test: change accent → all interactions change

### 5.3 Phase 3: Theme Infrastructure

1. Create ThemeManager service
2. Add theme selector to Settings
3. Persist theme preference
4. Create theme CSS files

### 5.4 Phase 4: Additional Themes

1. Create Minimal theme
2. Create Vibrant theme
3. Create Corporate theme
4. Test all themes with light/dark modes

---

## 6. Theme Switching Mechanism

### 6.1 HTML Structure

```html
<html data-theme="default">
  <body class="mode-dark">
    <!-- App content -->
  </body>
</html>
```

### 6.2 ThemeManager API

```javascript
class ThemeManager {
  // Get current theme and mode
  getCurrentTheme(): { theme: string, mode: 'light' | 'dark' }
  
  // Set theme (keeps current mode)
  setTheme(themeId: string): void
  
  // Set mode (keeps current theme)
  setMode(mode: 'light' | 'dark'): void
  
  // Toggle mode
  toggleMode(): void
  
  // Get available themes
  getAvailableThemes(): Theme[]
  
  // Persist preference
  savePreference(): void
  loadPreference(): void
}
```

### 6.3 CSS Variable Resolution

```css
/* Base tokens (theme-agnostic) */
:root {
  --color-bg-hover: var(--color-accent-subtle);
  --color-bg-active: var(--color-accent-muted);
}

/* Theme sets the accent */
html[data-theme="default"] {
  --color-accent: #18A0FB;
  --color-accent-subtle: rgba(24, 160, 251, 0.15);
  --color-accent-muted: rgba(24, 160, 251, 0.25);
}

html[data-theme="corporate"] {
  --color-accent: #7C3AED;
  --color-accent-subtle: rgba(124, 58, 237, 0.15);
  --color-accent-muted: rgba(124, 58, 237, 0.25);
}

/* Mode sets the backgrounds/text */
body.mode-dark {
  --color-bg-app: #1E1E1E;
  --color-text-primary: #FFFFFF;
}

body.mode-light {
  --color-bg-app: #FFFFFF;
  --color-text-primary: #1A1A1A;
}
```

---

## 7. Theming Litmus Test

### 7.1 The Test Protocol

1. Apply `data-theme="test"` to `<html>`
2. Define test theme with obviously different values:
   ```css
   html[data-theme="test"] {
     --color-accent: #FF00FF;  /* Magenta - obviously different */
     --font-family-ui: 'Comic Sans MS';  /* Obviously different */
     --spacing-base: 8px;  /* Double the spacing */
   }
   ```
3. Check every component:
   - If it's still blue → hardcoded color
   - If font is still Inter → hardcoded font
   - If spacing looks normal → hardcoded pixels

### 7.2 Expected Results

| Component | Expected Change |
|-----------|-----------------|
| Menu hover | Magenta subtle |
| Menu selected | Magenta solid |
| Button accent | Magenta |
| Focus rings | Magenta |
| All text | Comic Sans |
| All spacing | Doubled |

### 7.3 Documenting Failures

For each component that fails:
1. Note the file location
2. Note the hardcoded value
3. Add to remediation backlog
4. Fix and re-test

---

## 8. Settings UI

### 8.1 Theme Selector

```
┌─────────────────────────────────────────┐
│ Appearance                              │
├─────────────────────────────────────────┤
│                                         │
│ Theme: [Default     ▼]                  │
│                                         │
│   ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐      │
│   │     │ │     │ │     │ │     │      │
│   │ 🔵  │ │ 🔵  │ │ 🔵  │ │ 🟣  │      │
│   │     │ │     │ │     │ │     │      │
│   └─────┘ └─────┘ └─────┘ └─────┘      │
│   Default Minimal Vibrant Corporate     │
│                                         │
│ Mode: ○ Light  ● Dark                   │
│                                         │
│ [ ] Use system preference               │
│                                         │
└─────────────────────────────────────────┘
```

---

## 9. Migration Path

### 9.1 Current State

- Single theme with light/dark mode
- Many hardcoded values
- `--color-bg-hover` uses gray, not accent

### 9.2 Target State

- Multiple themes, each with light/dark
- Zero hardcoded values
- All interactions use accent color

### 9.3 Steps

1. ✅ Audit existing tokens
2. 🔄 Update `--color-bg-hover` to use accent
3. 🔄 Replace inline styles with CSS classes
4. ⬜ Create ThemeManager
5. ⬜ Create additional themes
6. ⬜ Add theme selector UI
7. ⬜ Run litmus test on all themes

---

## 10. Success Criteria

| Metric | Target |
|--------|--------|
| Themes available | 4 (Default, Minimal, Vibrant, Corporate) |
| Each theme has light + dark | Yes |
| Hardcoded values | 0 |
| Components responding to theme switch | 100% |
| Theme switch causes layout issues | Never |
| Theme persists across sessions | Yes |
