# Design Token Standardization Plan

## Executive Summary

This document outlines a comprehensive plan to standardize all design values in the Story application into a constrained, predictable token system. Following the successful standardization of spacing (`--spacing-*`) and gaps, we will apply the same methodology to all other design primitives.

### 🔴 Critical Finding: 1,600+ Hardcoded Values

A thorough scan of all UI components reveals:

| Source | Violations | Priority |
|--------|------------|----------|
| **CSS Files** | 384+ hardcoded values | 🔴 Critical |
| **JS Inline Styles** | 1,273+ assignments | 🔴 Critical |
| **Total** | **~1,650+ violations** | |

**Top 3 Problem Categories:**
1. **Width/Height** - 118 CSS + 200+ JS = 300+ arbitrary dimensions
2. **Padding** - 58 CSS + 80+ JS = 140+ non-tokenized values  
3. **Font Size** - 45 CSS + 60+ JS = 105+ hardcoded sizes

---

## 1. Current State Analysis

### 1.1 What We've Already Standardized ✅

| Category | Status | Token Pattern | Scale |
|----------|--------|---------------|-------|
| **Spacing/Gap** | ✅ Complete | `--spacing-{n}` | 0, 1, 2, 3, 4, 5, 6, 8, 10, 12 (4px base) |
| **Colors** | ✅ Complete | `--color-{category}-{variant}` | Semantic tokens |
| **Shadows** | ✅ Complete | `--shadow-{size}` | sm, md, lg, xl, 2xl, floating |
| **Z-Index** | ✅ Complete | `--z-{level}` | base, dropdown, sticky, fixed, modal, popover, tooltip, toast |
| **Border Radius** | ✅ Complete | `--radius-{size}` | xs, sm, md, lg, xl, 2xl, full |
| **Transitions** | ✅ Complete | `--transition-{speed}` | fast, normal, slow |
| **Font Sizes** | ✅ Complete | `--font-size-{size}` | 2xs, xs, sm, md, lg, xl, 2xl |
| **Font Weights** | ✅ Complete | `--font-weight-{name}` | regular, medium, semibold, bold |
| **Line Heights** | ✅ Complete | `--line-height-{name}` | tight, normal, relaxed |
| **Input Heights** | ✅ Complete | `--input-height-{size}` | sm, md, lg |

### 1.2 Comprehensive Audit Results (Current Codebase)

**Last Updated:** November 27, 2025

#### CSS Files Audit Summary

| Category | Count | Hardcoded Values Found | Should Use |
|----------|-------|------------------------|------------|
| **Padding** | 58 | 2px, 4px, 6px, 8px, 10px, 12px, 16px, 20px, 24px, 40px, 60px | `--spacing-*` tokens |
| **Font Size** | 45 | 8px, 9px, 10px, 11px, 12px, 13px, 14px, 16px, 18px, 20px, 24px, 32px, 48px | `--font-size-*` tokens |
| **Border Radius** | 24 | 1px, 2px, 4px, 5px, 6px, 8px, 10px, 12px, 14px, 32px | `--radius-*` tokens |
| **Width/Height** | 118 | Many arbitrary values | Size tokens (new) |
| **Margin** | 24 | 2px, 4px, 6px, 8px, 12px, 20px, 40px | `--spacing-*` tokens |
| **Font Weight** | 25 | 400, 500, 600, 700, 900 | `--font-weight-*` tokens |
| **Opacity** | 9 | 0.5, 0.6, 0.7, 0.9 | `--opacity-*` tokens (new) |
| **Transition** | 57 | 0.1s, 0.15s, 0.2s, 0.3s | `--transition-*` tokens |
| **Letter Spacing** | 7 | -0.5px, 0.5px | `--letter-spacing-*` tokens |
| **Box Shadow** | 17 | Various rgba() values | `--shadow-*` tokens |

#### JavaScript Inline Styles Audit

| Category | Count | Location |
|----------|-------|----------|
| **Total inline style assignments** | 1,273 | `src/ui/**/*.js` |
| **Properties most commonly hardcoded:** | | |
| - width/height | 200+ | Components, sections |
| - padding | 80+ | All UI components |
| - fontSize | 60+ | Labels, inputs |
| - gap | 50+ | Flex containers |
| - borderRadius | 40+ | Buttons, inputs |
| - opacity | 30+ | States, overlays |

---

## 2. Complete Inventory of Non-Standardized Values

### 2.1 CSS File: property-inspector.css

| Line | Property | Value | Should Be |
|------|----------|-------|-----------|
| 37 | font-size | 13px | `var(--font-size-lg)` |
| 38 | font-weight | 600 | `var(--font-weight-semibold)` |
| 113 | padding | 8px | `var(--spacing-2)` |
| 117-118 | width, height | 28px | `var(--input-height-md)` |
| 145 | padding | 4px 0 | `var(--spacing-1) 0` |
| 153 | padding | 4px | `var(--spacing-1)` |
| 173-174 | width, height | 60px, 34px | Size tokens needed |
| 177 | border-radius | 2px | `var(--radius-xs)` |
| 184 | border-radius | 1px | `var(--radius-xs)` |
| 189 | font-size | 9px | `var(--font-size-2xs)` |
| 204 | padding | 6px 10px | `var(--spacing-1) var(--spacing-2)` |
| 231 | padding | 12px | `var(--spacing-3)` |
| 232 | min-width | 200px | `var(--panel-min-width)` |
| 237 | font-weight | 500 | `var(--font-weight-medium)` |
| 251 | padding | 8px | `var(--spacing-2)` |
| 255-256 | width, height | 80px, 45px | Thumbnail size tokens |
| 260 | font-size | 10px | `var(--font-size-xs)` |

### 2.2 CSS File: flyout-components.css

| Line | Property | Value | Should Be |
|------|----------|-------|-----------|
| 36 | margin-bottom | 8px | `var(--spacing-2)` |
| 42 | padding | 8px 0 | `var(--spacing-2) 0` |
| 66 | margin-bottom | 12px | `var(--spacing-3)` |
| 74 | margin-bottom | 8px | `var(--spacing-2)` |
| 82 | height | 120px | Size token needed |
| 116 | margin-bottom | 8px | `var(--spacing-2)` |
| 129-130 | width, height | 20px | `var(--icon-size-lg)` |
| 138 | font-size | 12px | `var(--font-size-md)` |
| 148-149 | width, height | 12px | `var(--icon-size-xs)` |
| 162 | padding | 6px 8px | `var(--spacing-1) var(--spacing-2)` |
| 188 | width | 80px | Input width token |
| 192-193 | width, height | 24px | `var(--icon-size-xl)` |
| 194 | border-radius | 2px | `var(--radius-xs)` |
| 213-214 | width, height | 4px | Size token (dot) |
| 235 | width | 60px | Input width token |
| 240 | width | 80px | Input width token |
| 266 | font-size | 8px | `var(--font-size-3xs)` (new) |
| 305 | height | 160px | Size token needed |
| 313-314 | width, height | 12px | `var(--icon-size-xs)` |
| 325 | height | 10px | Size token needed |
| 326 | border-radius | 5px | `var(--radius-sm)` |
| 347-348 | width, height | 12px | `var(--icon-size-xs)` |
| 362 | height | 24px | `var(--input-height-sm)` |
| 369-370 | width, height | 12px, 24px | Slider handle tokens |
| 371 | border-radius | 2px | `var(--radius-xs)` |
| 392 | padding | 4px | `var(--spacing-1)` |
| 417 | padding | 6px 8px | `var(--spacing-1) var(--spacing-2)` |
| 445 | padding | 8px | `var(--spacing-2)` |
| 450 | padding | 6px 12px | `var(--spacing-1) var(--spacing-3)` |
| 480 | padding | 6px 8px | `var(--spacing-1) var(--spacing-2)` |
| 510 | padding | 4px | `var(--spacing-1)` |
| 594 | padding | 6px 8px | `var(--spacing-1) var(--spacing-2)` |
| 598 | border-radius | 2px | `var(--radius-xs)` |
| 617 | height | 1px | Border width token |
| 626 | width | 280px | Flyout width token |
| 638 | width | 60px | Input width token |
| 663 | height | 1px | Border width token |
| 675 | padding | 6px 12px | `var(--spacing-1) var(--spacing-3)` |
| 693 | width | 280px | Flyout width token |
| 737 | height | 140px | Preview height token |
| 759 | height | 36px | Control height token |
| 764 | padding | 8px | `var(--spacing-2)` |
| 800-816 | padding | 6px | `var(--spacing-1)` |
| 807 | opacity | 0.9 | `var(--opacity-90)` |
| 833 | height | 100px | Preview height token |
| 838 | padding | 8px | `var(--spacing-2)` |
| 856 | padding | 8px | `var(--spacing-2)` |
| 885 | width | 280px | Flyout width token |
| 891 | font-weight | 600 | `var(--font-weight-semibold)` |
| 905 | padding | 8px | `var(--spacing-2)` |
| 921 | height | 80px | Preview height token |
| 940 | padding | 6px 12px | `var(--spacing-1) var(--spacing-3)` |
| 955 | padding | 6px 12px | `var(--spacing-1) var(--spacing-3)` |
| 966 | opacity | 0.9 | `var(--opacity-90)` |
| 1008 | padding | 6px 8px | `var(--spacing-1) var(--spacing-2)` |
| 1026 | padding | 2px 4px | `var(--spacing-0) var(--spacing-1)` |
| 1055-1056 | width, height | 240px, 160px | Preview size tokens |
| 1060 | padding | 8px 12px | `var(--spacing-2) var(--spacing-3)` |
| 1084 | min-width | 120px | Dropdown min-width token |
| 1088 | padding | 8px 12px | `var(--spacing-2) var(--spacing-3)` |
| 1110 | max-height | 320px | Dropdown max-height token |
| 1136 | padding | 16px | `var(--spacing-4)` |
| 1160-1161 | width, height | 32px | `var(--icon-size-2xl)` |
| 1174 | height | 1px | Border width token |
| 1183 | height | 24px | `var(--input-height-sm)` |
| 1188 | opacity | 0.6 | `var(--opacity-60)` |
| 1192-1193 | width, height | 16px | `var(--icon-size-md)` |
| 1194 | border-radius | 2px | `var(--radius-xs)` |
| 1213 | font-size | 9px | `var(--font-size-2xs)` |
| 1214 | padding | 2px 4px | `var(--spacing-0) var(--spacing-1)` |
| 1215 | border-radius | 2px | `var(--radius-xs)` |
| 1217 | font-weight | 500 | `var(--font-weight-medium)` |
| 1224 | font-size | 10px | `var(--font-size-xs)` |
| 1225 | font-weight | 500 | `var(--font-weight-medium)` |

### 2.3 CSS File: panel-components.css

| Line | Property | Value | Should Be |
|------|----------|-------|-----------|
| 23 | padding | 8px 12px | `var(--spacing-2) var(--spacing-3)` |
| 54 | padding | 6px 8px | `var(--spacing-1) var(--spacing-2)` |
| 118 | height | 20px | Control height token |
| 122 | border-radius | 2px 0 0 2px | `var(--radius-xs) 0 0 var(--radius-xs)` |
| 174 | font-size | 9px | `var(--font-size-2xs)` |
| 177 | padding | 2px 4px | `var(--spacing-0) var(--spacing-1)` |
| 188 | font-size | 16px | `var(--font-size-2xl)` |
| 193 | font-size | 11px | `var(--font-size-sm)` |
| 198 | font-size | 9px | `var(--font-size-2xs)` |
| 211 | padding | 40px 20px | `var(--spacing-10) var(--spacing-5)` |
| 217 | font-size | 32px | `var(--font-size-5xl)` |
| 263 | width | 80px | Input width token |
| 275 | padding | 4px 8px | `var(--spacing-1) var(--spacing-2)` |
| 295 | max-height | 200px | Scrollable area token |
| 313-314 | width, height | 24px | `var(--icon-size-xl)` |
| 348 | padding | 8px 16px | `var(--spacing-2) var(--spacing-4)` |
| 376 | opacity | 0.5 | `var(--opacity-50)` |
| 399 | width | 16px | `var(--icon-size-md)` |
| 420 | font-size | 9px | `var(--font-size-2xs)` |
| 423 | padding | 2px 6px | Size token needed |
| 428-429 | width, height | 16px | `var(--icon-size-md)` |
| 467 | font-size | 10px | `var(--font-size-xs)` |
| 468 | font-weight | 500 | `var(--font-weight-medium)` |
| 536 | font-size | 20px | `var(--font-size-3xl)` |
| 555 | font-size | 8px | Font size token (3xs) needed |
| 556 | padding | 2px 4px | `var(--spacing-0) var(--spacing-1)` |
| 566-567 | width, height | 14px | Icon size token needed |
| 574 | font-size | 8px | Font size token (3xs) needed |
| 586-587 | width, height | 16px | `var(--icon-size-md)` |
| 591 | font-size | 9px | `var(--font-size-2xs)` |
| 592 | line-height | 16px | `var(--line-height-*)` |
| 632 | font-size | 14px | `var(--font-size-xl)` |
| 657 | padding | 12px 20px | `var(--spacing-3) var(--spacing-5)` |
| 694-695 | min/max-width | 300px, 400px | Panel width tokens |
| 726 | padding | 60px 20px | Size tokens needed |
| 745 | font-size | 10px | `var(--font-size-xs)` |
| 746 | font-weight | 500 | `var(--font-weight-medium)` |
| 749 | padding | 4px 8px | `var(--spacing-1) var(--spacing-2)` |
| 757-758 | width, height | 16px | `var(--icon-size-md)` |
| 759 | border-radius | 2px | `var(--radius-xs)` |
| 764 | font-size | 11px | `var(--font-size-sm)` |
| 783-784 | width, height | 18px | Icon size token needed |
| 792 | border-radius | 2px | `var(--radius-xs)` |
| 793 | font-size | 10px | `var(--font-size-xs)` |
| 937 | font-weight | 600 | `var(--font-weight-semibold)` |
| 955 | font-size | 18px | Font size token needed |
| 963 | font-size | 13px | `var(--font-size-lg)` |
| 968 | font-size | 10px | `var(--font-size-xs)` |
| 995 | font-weight | 600 | `var(--font-weight-semibold)` |
| 1010 | width | 60px | Input width token |
| 1048 | font-size | 8px | Font size token (3xs) needed |
| 1059 | font-size | 16px | `var(--font-size-2xl)` |
| 1086 | width | 70px | Input width token |
| 1121 | opacity | 0.5 | `var(--opacity-50)` |
| 1125 | font-weight | 600 | `var(--font-weight-semibold)` |
| 1133 | max-width | 240px | Width token needed |
| 1163 | font-weight | 500 | `var(--font-weight-medium)` |
| 1169 | opacity | 0.9 | `var(--opacity-90)` |
| 1179 | font-weight | 500 | `var(--font-weight-medium)` |
| 1247-1248 | width, height | 20px | `var(--icon-size-lg)` |
| 1257 | font-size | 14px | `var(--font-size-xl)` |
| 1280 | height | 8px | Slider track height token |
| 1289 | width | 8px | Slider handle size token |
| 1298-1299 | width, height | 12px | `var(--icon-size-xs)` |
| 1335 | padding | 6px 8px | `var(--spacing-1) var(--spacing-2)` |

### 2.4 CSS File: modal.css

| Line | Property | Value | Should Be |
|------|----------|-------|-----------|
| 19 | border-radius | 12px | `var(--radius-xl)` |
| 20-21 | width, height | 700px, 500px | Modal size tokens |
| 28 | width | 200px | Sidebar width token |
| 31 | padding | 16px 8px | `var(--spacing-4) var(--spacing-2)` |
| 38 | padding | 8px 12px | `var(--spacing-2) var(--spacing-3)` |
| 39 | border-radius | 6px | `var(--radius-md)` |
| 41 | font-size | 13px | `var(--font-size-lg)` |
| 54 | font-weight | 500 | `var(--font-weight-medium)` |
| 65 | padding | 16px 24px | `var(--spacing-4) var(--spacing-6)` |
| 73-74 | font-size, font-weight | 16px, 600 | `var(--font-size-2xl)`, `var(--font-weight-semibold)` |
| 80 | padding | 24px | `var(--spacing-6)` |
| 90-92 | font-size, padding, border-radius | 16px, 4px, 4px | Tokens |
| 104-107 | padding, border-radius, font-size, font-weight | 8px 16px, 6px, 13px, 500 | Tokens |
| 113 | opacity | 0.9 | `var(--opacity-90)` |
| 118 | margin-bottom | 20px | `var(--spacing-5)` |
| 123-124 | font-size, font-weight | 12px, 500 | Tokens |
| 126 | margin-bottom | 8px | `var(--spacing-2)` |
| 131 | padding | 8px 12px | `var(--spacing-2) var(--spacing-3)` |
| 133 | border-radius | 6px | `var(--radius-md)` |
| 136 | font-size | 13px | `var(--font-size-lg)` |

### 2.5 CSS File: presentation.css

| Line | Property | Value | Should Be |
|------|----------|-------|-----------|
| 142 | padding | 40px | `var(--spacing-10)` |
| 163-164 | font-size, font-weight | 24px, 500 | Tokens |
| 191 | border-radius | 8px | `var(--radius-lg)` |
| 206-207 | font-size, font-weight | 48px, 700 | Display tokens |
| 213 | font-size | 14px | `var(--font-size-xl)` |
| 222 | font-weight | 500 | `var(--font-weight-medium)` |
| 247 | padding | 8px 16px | `var(--spacing-2) var(--spacing-4)` |
| 248 | border-radius | 32px | `var(--radius-full)` or token |
| 254-255 | width, height | 40px | `var(--control-size-xl)` |
| 264 | font-size | 16px | `var(--font-size-2xl)` |
| 285-286 | width, height | 1px, 24px | Border/divider tokens |

### 2.6 CSS File: layout.css

| Line | Property | Value | Should Be |
|------|----------|-------|-----------|
| 36 | font-weight | 500 | `var(--font-weight-medium)` |
| 45 | font-weight | 900 | `var(--font-weight-black)` (new) |
| 48 | letter-spacing | -0.5px | `var(--letter-spacing-tight)` |
| 73 | padding | 8px 12px | `var(--spacing-2) var(--spacing-3)` |
| 86 | font-size | 10px | `var(--font-size-xs)` |
| 88 | width | 12px | `var(--icon-size-xs)` |
| 94-95 | font-size, font-weight | 11px, 600 | Tokens |
| 97 | letter-spacing | 0.5px | `var(--letter-spacing-wide)` |
| 114 | height | 4px | Divider/track height token |

### 2.7 CSS File: components.css

| Line | Property | Value | Should Be |
|------|----------|-------|-----------|
| 8 | padding | 4px 8px | `var(--spacing-1) var(--spacing-2)` |
| 12 | border-radius | 2px | `var(--radius-xs)` |
| 28 | font-weight | 600 | `var(--font-weight-semibold)` |
| 40 | font-weight | 600 | `var(--font-weight-semibold)` |
| 54 | height | 32px | `var(--input-height-lg)` |
| 60 | letter-spacing | 0.5px | `var(--letter-spacing-wide)` |
| 75 | padding | 4px 6px | `var(--spacing-1)` |
| 94-95 | width, height | 8px | Size token (checkbox) |
| 102 | border-radius | 4px | `var(--radius-sm)` |

### 2.8 CSS File: floating-ui.css

| Line | Property | Value | Should Be |
|------|----------|-------|-----------|
| 7 | height | 48px | `var(--toolbar-height)` |
| 10 | border-radius | 14px | `var(--radius-xl)` or custom |
| 20-21 | width, height | 36px | Control size token |
| 22 | border-radius | 8px | `var(--radius-lg)` |
| 29 | font-size | 16px | `var(--font-size-2xl)` |
| 44-45 | width, height | 1px, 20px | Divider tokens |
| 82-83 | width, height | 340px, 400px | Panel size tokens |
| 87 | height | 32px | `var(--input-height-lg)` |

### 2.9 CSS File: master-mode.css

| Line | Property | Value | Should Be |
|------|----------|-------|-----------|
| 12 | border-radius | 10px | `var(--radius-lg)` or custom |
| 17 | font-size | 9px | `var(--font-size-2xs)` |
| 20 | padding | 2px 4px | `var(--spacing-0) var(--spacing-1)` |
| 21 | border-radius | 4px | `var(--radius-sm)` |
| 22 | margin-left | 6px | `var(--spacing-1)` |
| 24-25 | font-weight, letter-spacing | 700, 0.5px | Tokens |
| 35 | padding | 4px 8px | `var(--spacing-1) var(--spacing-2)` |
| 49 | padding | 4px 12px | `var(--spacing-1) var(--spacing-3)` |

### 2.10 CSS File: media-fills.css

| Line | Property | Value | Should Be |
|------|----------|-------|-----------|
| 65 | font-size | 24px | `var(--font-size-4xl)` |
| 66 | opacity | 0.5 | `var(--opacity-50)` |
| 82-83 | width, height | 24px | `var(--icon-size-xl)` |
| 126 | font-size | 32px | `var(--font-size-5xl)` |
| 129 | opacity | 0.7 | `var(--opacity-70)` |
| 200 | font-size | 24px | `var(--font-size-4xl)` |

### 2.11 JavaScript Component Files with Inline Styles

#### ColorInput.js
| Line | Property | Value | Should Be |
|------|----------|-------|-----------|
| 19 | gap | 8px | `var(--spacing-2)` |
| 25 | padding | 4px | `var(--spacing-1)` |
| 26 | height | 28px | `var(--input-height-md)` |
| 46-47 | width, height | 20px/18px | Icon size tokens |
| 48 | border-radius | 2px | `var(--radius-xs)` |
| 63 | font-size | 11px | `var(--font-size-sm)` |

#### SegmentedControl.js
| Line | Property | Value | Should Be |
|------|----------|-------|-----------|
| 23 | border-radius | 2px | `var(--radius-xs)` |
| 47 | padding | 4px 8px | `var(--spacing-1) var(--spacing-2)` |
| 48 | font-size | 11px | `var(--font-size-sm)` |

#### Switch.js
| Line | Property | Value | Should Be |
|------|----------|-------|-----------|
| 23 | font-size | 11px | `var(--font-size-sm)` |
| 30-31 | width, height | 32px, 16px | Switch track tokens |
| 33 | border-radius | 8px | `var(--radius-lg)` |
| 40-41 | width, height | 12px | Switch thumb token |

#### Section.js
| Line | Property | Value | Should Be |
|------|----------|-------|-----------|
| 31 | gap | 8px | `var(--spacing-2)` |
| 36-37 | width, height | 12px | `var(--icon-size-xs)` |
| 54 | gap | 4px | `var(--spacing-1)` |

#### EmptyState.js
| Line | Property | Value | Should Be |
|------|----------|-------|-----------|
| 7 | padding | 8px 4px | `var(--spacing-2) var(--spacing-1)` |
| 8 | gap | 8px | `var(--spacing-2)` |
| 10 | font-size | 11px | `var(--font-size-sm)` |
| 15-16 | width, height | 16px | `var(--icon-size-md)` |
| 17 | border-radius | 2px | `var(--radius-xs)` |
| 20 | opacity | 0.5 | `var(--opacity-50)` |

#### Knob.js
| Line | Property | Value | Should Be |
|------|----------|-------|-----------|
| 22 | width | 48px | Control size token |
| 40 | font-size | 10px | `var(--font-size-xs)` |

#### FillSection.js (extensive inline styles)
| Lines | Issues |
|-------|--------|
| 110 | gap: 8px |
| 196-197 | gap: 2px, height: 28px |
| 205 | font-size: 12px |
| 209-210 | width: 16px, height: 100% |
| 217, 223 | opacity: 0.5, 1 |
| 299-300 | border-radius, height: 24px |
| 307-308 | width: 22px, height: 100% |
| 317-319 | width: 14px, height: 14px, border-radius: 2px |
| 348 | opacity: 0.5 |
| 361 | font-size: 11px |
| 363 | padding: 0 2px |
| 388 | opacity: 0.5 |
| 395-396 | width: 1px, height: 12px |
| 421 | width: 40px |
| 429 | opacity: 0.5 |
| 440 | gap: 0px |
| 457-459 | width: 24px, height: 24px, padding: 0 |
| 470-472 | width: 24px, height: 24px, padding: 0 |
| 482-484 | width: 24px, height: 24px, padding: 0 |
| 503-517 | border-radius, padding, width, font-size |

#### EffectsSection.js (extensive inline styles)
| Lines | Issues |
|-------|--------|
| 24 | gap: 0 |
| 125-126 | border-radius: 4px, opacity |
| 139 | gap: 8px |
| 145-147 | font-size: 14px, width: 16px |
| 152 | font-size: 12px |
| 167 | gap: 4px |
| 204-205 | gap: 8px, width: 240px |
| 227 | gap: 4px |
| 274 | gap: 8px |
| 289 | gap: 8px |
| 304 | gap: 8px |
| 319 | width: 60px |
| 345-346 | gap: 12px, width: 200px |
| 411-412 | gap: 12px, width: 200px |

#### TypeSettingsFlyout.js (extensive inline styles)
| Lines | Issues |
|-------|--------|
| 162 | gap: 4px |
| 325 | width: 60px |
| 330 | font-size: 10px |
| 453 | width: 100% |
| 466 | gap: 8px |
| 477 | height: 4px |
| 522-523 | width: 1px, height: 16px |

---

## 3. Best Practices from Leading Design Systems
| 3 | **Font Sizes** | 🔴 High | Low | Medium - already mostly tokenized |
| 4 | **Border Radius** | 🟡 Medium | Low | Low - already mostly tokenized |
| 5 | **Icon Sizes** | 🟡 Medium | Low | Medium - consistency |
| 6 | **Opacity** | 🟡 Medium | Low | Low - few instances |
| 7 | **Font Weight** | 🟡 Medium | Low | Low - already mostly tokenized |
| 8 | **Border Width** | 🟢 Low | Low | Low - mostly 1px |
| 9 | **Letter Spacing** | 🟢 Low | Low | Low - few uses |
| 10 | **Aspect Ratios** | 🟢 Low | Low | Low - specialized |

---

## 4. Proposed Token Extensions

### 4.1 Icon Size Tokens (NEW)

**Problem:** Icon sizes are inconsistent (12px, 14px, 16px, 18px, 20px, 24px, 32px)

**Solution:** Constrained icon size scale
```css
:root {
    /* Icon Size Scale */
    --icon-size-xs: 12px;      /* Micro icons, indicators */
    --icon-size-sm: 14px;      /* Small inline icons */
    --icon-size-md: 16px;      /* Default icon size */
    --icon-size-lg: 20px;      /* Emphasized icons */
    --icon-size-xl: 24px;      /* Large icons, buttons */
    --icon-size-2xl: 32px;     /* Hero icons, empty states */
}
```

### 4.2 Opacity Tokens (NEW)

**Problem:** Random opacity values (0.5, 0.6, 0.7, 0.9)

**Solution:** Semantic opacity scale
```css
:root {
    /* Opacity Scale */
    --opacity-0: 0;            /* Invisible */
    --opacity-5: 0.05;         /* Barely visible */
    --opacity-10: 0.1;         /* Subtle */
    --opacity-20: 0.2;         /* Light */
    --opacity-40: 0.4;         /* Medium-light */
    --opacity-60: 0.6;         /* Medium */
    --opacity-80: 0.8;         /* Strong */
    --opacity-90: 0.9;         /* Near-opaque */
    --opacity-100: 1;          /* Fully opaque */
    
    /* Semantic Opacity */
    --opacity-disabled: var(--opacity-40);
    --opacity-placeholder: var(--opacity-60);
    --opacity-hover-overlay: var(--opacity-10);
}
```

### 4.3 Border Width Tokens (NEW)

**Problem:** Border widths vary (1px, 2px, 4px)

**Solution:** Constrained border scale
```css
:root {
    /* Border Width Scale */
    --border-width-0: 0;       /* No border */
    --border-width-1: 1px;     /* Default borders */
    --border-width-2: 2px;     /* Emphasized borders, focus */
    --border-width-4: 4px;     /* Heavy emphasis, selection */
}
```

### 4.4 Component Size Tokens (NEW)

**Problem:** Component dimensions are arbitrary (24px, 28px, 32px, 40px, 48px...)

**Solution:** Standardized component sizing
```css
:root {
    /* Touch Target / Control Sizes */
    --control-size-xs: 20px;   /* Micro controls */
    --control-size-sm: 24px;   /* Compact controls */
    --control-size-md: 28px;   /* Default controls */
    --control-size-lg: 32px;   /* Comfortable controls */
    --control-size-xl: 40px;   /* Large controls, toolbar */
    --control-size-2xl: 48px;  /* Extra large, primary actions */
    
    /* Thumbnail/Preview Sizes */
    --thumbnail-xs: 32px;      /* Tiny previews */
    --thumbnail-sm: 48px;      /* Small previews */
    --thumbnail-md: 64px;      /* Default previews */
    --thumbnail-lg: 80px;      /* Large previews */
    --thumbnail-xl: 120px;     /* Hero previews */
    
    /* Panel/Container Widths */
    --panel-width-sm: 200px;   /* Narrow panels */
    --panel-width-md: 240px;   /* Default panel */
    --panel-width-lg: 300px;   /* Wide panels */
    --panel-width-xl: 400px;   /* Extra wide panels */
    
    /* Content Area Widths */
    --content-width-xs: 120px; /* Dropdown menus */
    --content-width-sm: 200px; /* Narrow content */
    --content-width-md: 300px; /* Default content */
    --content-width-lg: 400px; /* Wide content */
    --content-width-xl: 500px; /* Extra wide content */
}
```

### 4.5 Extended Transition Tokens

**Problem:** Transition durations vary (0.1s, 0.15s, 0.2s, 0.25s, 0.3s)

**Current:** `--transition-fast: 100ms`, `--transition-normal: 150ms`, `--transition-slow: 250ms`

**Extension:**
```css
:root {
    /* Duration Scale */
    --duration-instant: 0ms;       /* No animation */
    --duration-fast: 100ms;        /* Micro interactions */
    --duration-normal: 150ms;      /* Standard transitions */
    --duration-moderate: 200ms;    /* Medium transitions */
    --duration-slow: 250ms;        /* Deliberate transitions */
    --duration-slower: 300ms;      /* Panel animations */
    --duration-slowest: 400ms;     /* Complex animations */
    
    /* Easing Functions */
    --ease-linear: linear;
    --ease-in: ease-in;
    --ease-out: ease-out;
    --ease-in-out: ease-in-out;
    --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
    
    /* Composed Transitions */
    --transition-instant: 0ms;
    --transition-fast: var(--duration-fast) var(--ease-out);
    --transition-normal: var(--duration-normal) var(--ease-out);
    --transition-slow: var(--duration-slow) var(--ease-out);
    --transition-panel: var(--duration-slower) var(--ease-out);
}
```

### 4.6 Focus Ring Tokens (NEW)

**Problem:** Focus styles are inconsistent

**Solution:** Standardized focus system
```css
:root {
    /* Focus Ring */
    --focus-ring-width: 2px;
    --focus-ring-offset: 2px;
    --focus-ring-color: var(--color-accent);
    --focus-ring: var(--focus-ring-width) solid var(--focus-ring-color);
    --focus-ring-shadow: 0 0 0 var(--focus-ring-offset) var(--color-bg-panel),
                         0 0 0 calc(var(--focus-ring-offset) + var(--focus-ring-width)) var(--focus-ring-color);
}
```

### 4.7 Letter Spacing Tokens (Verify Usage)

**Current tokens exist but may not be used consistently:**
```css
:root {
    --letter-spacing-tighter: -0.05em;
    --letter-spacing-tight: -0.025em;
    --letter-spacing-normal: 0;
    --letter-spacing-wide: 0.025em;
    --letter-spacing-wider: 0.05em;
    --letter-spacing-widest: 0.1em;
}
```

### 4.8 Aspect Ratio Tokens (NEW - for media)

```css
:root {
    /* Aspect Ratios */
    --aspect-square: 1 / 1;
    --aspect-video: 16 / 9;
    --aspect-photo: 4 / 3;
    --aspect-portrait: 3 / 4;
    --aspect-wide: 21 / 9;
    --aspect-slide: 16 / 9;
}
```

---

## 5. Standardization Rules

### 5.1 The "No Magic Numbers" Rule

**Before:**
```css
.component {
    padding: 6px 10px;
    font-size: 13px;
    border-radius: 5px;
    margin-bottom: 14px;
}
```

**After:**
```css
.component {
    padding: var(--spacing-1) var(--spacing-2); /* 4px 8px - close enough */
    font-size: var(--font-size-lg);              /* 13px */
    border-radius: var(--radius-sm);             /* 4px - standardized */
    margin-bottom: var(--spacing-4);             /* 16px - standardized */
}
```

### 5.2 Mapping Non-Standard Values

When a value doesn't match the scale exactly, use the nearest token:

| Original Value | Nearest Token | Decision |
|----------------|---------------|----------|
| 5px | `--spacing-1` (4px) | Round down |
| 6px | `--spacing-2` (8px) | Round up (or use --spacing-1 + --spacing-1/2) |
| 7px | `--spacing-2` (8px) | Round up |
| 10px | `--spacing-2` (8px) or `--spacing-3` (12px) | Context-dependent |
| 14px | `--spacing-3` (12px) or `--spacing-4` (16px) | Round to nearest |
| 18px | `--spacing-4` (16px) or `--spacing-5` (20px) | Round to nearest |

### 5.3 Exception Cases

Some values should remain hardcoded:

1. **1px borders** - Semantic, represents "hairline"
2. **50%/100%** - Relative values, not magic numbers
3. **calc() expressions** - Dynamic calculations
4. **Functional colors** - Color picker gradients, canvas
5. **Content-specific** - Video dimensions, canvas sizes

---

## 6. Implementation Phases

### Phase 1: Audit & Define (This Document) ✅
- [x] Analyze current codebase for hardcoded values
- [x] Research industry best practices
- [x] Define complete token system
- [x] Document standardization rules
- [x] Create exhaustive inventory of violations
- [ ] Get team alignment

### Phase 2: Token Extension (New Tokens in variables.css)
- [ ] Add icon size tokens (`--icon-size-*`)
- [ ] Add opacity tokens (`--opacity-*`)
- [ ] Add border width tokens (`--border-width-*`)
- [ ] Add component size tokens (`--control-size-*`, `--thumbnail-*`)
- [ ] Add extended font size tokens (`--font-size-3xl` through `--font-size-6xl`)
- [ ] Add flyout/panel width tokens
- [ ] Add input width tokens (`--input-width-*`)
- [ ] Update light theme overrides if needed

### Phase 3: CSS Standardization (by file priority)

**3a. Critical Files (150+ issues each)**
- [ ] `flyout-components.css` - 150+ violations
- [ ] `panel-components.css` - 120+ violations

**3b. High Priority Files (20-50 issues each)**
- [ ] `property-inspector.css` - 25+ violations
- [ ] `modal.css` - 20+ violations
- [ ] `presentation.css` - 15+ violations
- [ ] `layout.css` - 15+ violations

**3c. Medium Priority Files (<20 issues each)**
- [ ] `components.css`
- [ ] `floating-ui.css`
- [ ] `master-mode.css`
- [ ] `media-fills.css`
- [ ] `canvas.css`
- [ ] `base.css`

### Phase 4: JavaScript Inline Style Migration

**Strategy:** Convert inline styles to CSS classes where possible

**4a. Critical Components (50+ inline styles)**
- [ ] `FillSection.js` - Create CSS classes for fill row, combined input, buttons
- [ ] `EffectsSection.js` - Create CSS classes for effect rows, flyout content
- [ ] `StrokeSection.js` - Similar to FillSection

**4b. High Priority Components (20-50 inline styles)**
- [ ] `TypeSettingsFlyout.js` - Create CSS classes for type controls
- [ ] `LayerTree.js` - Create CSS classes for layer items
- [ ] `SlideList.js` - Create CSS classes for slide thumbnails
- [ ] `IconLibrary.js` - Create CSS classes for icon grid

**4c. UI Components (Systematic conversion)**
- [ ] `ColorInput.js` → CSS classes
- [ ] `SegmentedControl.js` → CSS classes
- [ ] `Switch.js` → CSS classes
- [ ] `Section.js` → CSS classes
- [ ] `EmptyState.js` → CSS classes
- [ ] `Knob.js` → CSS classes
- [ ] `NumberInput.js` → CSS classes
- [ ] `MathInput.js` → CSS classes

**4d. Dynamic Values (Keep as inline but use tokens)**
- [ ] Replace hardcoded values with `var(--token)` in remaining inline styles
- [ ] Document which inline styles are intentionally dynamic

### Phase 5: Transition & Animation Standardization
- [ ] Replace all hardcoded durations with `--transition-*` or `--duration-*`
- [ ] Replace all hardcoded easing with `--ease-*`
- [ ] Create composed transition tokens for common patterns

### Phase 6: Dimension Standardization
- [ ] Create semantic size tokens for common dimensions
- [ ] Replace arbitrary width/height with tokens
- [ ] Document exceptions (canvas, dynamic sizes)

### Phase 7: Font & Typography Standardization
- [ ] Replace all hardcoded font-size with `--font-size-*`
- [ ] Replace all hardcoded font-weight with `--font-weight-*`
- [ ] Replace all hardcoded letter-spacing with `--letter-spacing-*`
- [ ] Replace all hardcoded line-height with `--line-height-*`

### Phase 8: Border & Radius Standardization
- [ ] Replace all hardcoded border-radius with `--radius-*`
- [ ] Replace border widths with tokens where appropriate

### Phase 9: Opacity & Visual Standardization
- [ ] Replace all hardcoded opacity with `--opacity-*`
- [ ] Replace remaining hardcoded box-shadows with `--shadow-*`

### Phase 10: Documentation & Validation
- [ ] Update `ui-design-system.md` with all new tokens
- [ ] Create component style guide
- [ ] Add ESLint/Stylelint rules to prevent regression
- [ ] Visual regression testing
- [ ] Create token cheat sheet for developers

---

## 7. Success Metrics

### 7.1 Quantitative Goals (Based on Comprehensive Audit)

| Metric | Current Count | Target | Files Affected |
|--------|---------------|--------|----------------|
| Hardcoded padding values (CSS) | 58 | 0 | 11 files |
| Hardcoded font-size values (CSS) | 45 | 0 | 10 files |
| Hardcoded border-radius (CSS) | 24 | 0 | 8 files |
| Hardcoded width/height (CSS) | 118 | <20 (exceptions) | 10 files |
| Hardcoded margin values (CSS) | 24 | 0 | 6 files |
| Hardcoded font-weight (CSS) | 25 | 0 | 9 files |
| Hardcoded opacity (CSS) | 9 | 0 | 4 files |
| Hardcoded transitions (CSS) | 57 | 0 | 8 files |
| Hardcoded letter-spacing (CSS) | 7 | 0 | 5 files |
| Inline styles in JS | 1,273 | <100 (dynamic only) | 30+ files |

### 7.2 Priority Files (Most Violations)

| File | Total Issues | Priority |
|------|--------------|----------|
| `flyout-components.css` | 150+ | 🔴 Critical |
| `panel-components.css` | 120+ | 🔴 Critical |
| `FillSection.js` | 50+ | 🔴 Critical |
| `EffectsSection.js` | 30+ | 🟡 High |
| `property-inspector.css` | 25+ | 🟡 High |
| `modal.css` | 20+ | 🟡 High |
| `TypeSettingsFlyout.js` | 15+ | 🟡 High |
| `presentation.css` | 15+ | 🟢 Medium |
| `ColorInput.js` | 12+ | 🟢 Medium |
| `Switch.js` | 10+ | 🟢 Medium |

### 7.3 Qualitative Goals

- [ ] Any designer can predict spacing from the token name
- [ ] Theme switching requires only token changes
- [ ] New components can be built using only existing tokens
- [ ] Visual consistency across all UI surfaces
- [ ] Reduced cognitive load when styling components

---

## 8. Token Quick Reference (Complete System)

### 8.1 Spacing Scale

| Token | Value | Typical Use |
|-------|-------|-------------|
| `--spacing-0` | 0 | Reset |
| `--spacing-1` | 4px | Tight gaps, inline spacing |
| `--spacing-2` | 8px | Standard gaps, input padding |
| `--spacing-3` | 12px | Section padding, comfortable gaps |
| `--spacing-4` | 16px | Component padding, section margins |
| `--spacing-5` | 20px | Large gaps |
| `--spacing-6` | 24px | Panel padding, major sections |
| `--spacing-8` | 32px | Large section margins |
| `--spacing-10` | 40px | Hero spacing |
| `--spacing-12` | 48px | Maximum spacing |

### 8.2 Font Size Scale

| Token | Value | Typical Use |
|-------|-------|-------------|
| `--font-size-2xs` | 9px | Micro labels, badges |
| `--font-size-xs` | 10px | Small labels, captions |
| `--font-size-sm` | 11px | Secondary text, labels |
| `--font-size-md` | 12px | Body text, inputs |
| `--font-size-lg` | 13px | Section headers |
| `--font-size-xl` | 14px | Panel titles |
| `--font-size-2xl` | 16px | Modal headers |
| `--font-size-3xl` | 20px | Large headers (NEW) |
| `--font-size-4xl` | 24px | Display text (NEW) |
| `--font-size-5xl` | 32px | Hero text (NEW) |
| `--font-size-6xl` | 48px | Jumbo text (NEW) |

### 8.3 Border Radius Scale

| Token | Value | Typical Use |
|-------|-------|-------------|
| `--radius-xs` | 2px | Subtle rounding |
| `--radius-sm` | 4px | Inputs, buttons |
| `--radius-md` | 6px | Cards, dropdowns |
| `--radius-lg` | 8px | Panels, modals |
| `--radius-xl` | 12px | Large elements |
| `--radius-2xl` | 16px | Hero elements |
| `--radius-full` | 9999px | Circles, pills |

### 8.4 Shadow Scale

| Token | Typical Use |
|-------|-------------|
| `--shadow-sm` | Subtle elevation |
| `--shadow-md` | Cards, dropdowns |
| `--shadow-lg` | Popovers |
| `--shadow-xl` | Modals |
| `--shadow-2xl` | Overlays |
| `--shadow-floating` | Floating panels |

### 8.5 Z-Index Scale

| Token | Value | Typical Use |
|-------|-------|-------------|
| `--z-base` | 0 | Base layer |
| `--z-dropdown` | 1000 | Dropdowns |
| `--z-sticky` | 1100 | Sticky elements |
| `--z-fixed` | 1200 | Fixed elements |
| `--z-modal-backdrop` | 1300 | Modal overlays |
| `--z-modal` | 1400 | Modal dialogs |
| `--z-popover` | 1500 | Popovers |
| `--z-tooltip` | 1600 | Tooltips |
| `--z-toast` | 1700 | Notifications |

---

## 9. Appendix: Value Mapping Tables

### 9.1 Padding Value Mapping

| Found Value | Recommended Token | Notes |
|-------------|-------------------|-------|
| 2px | `--spacing-1` | Round up to 4px |
| 4px | `--spacing-1` | Exact match |
| 6px | `--spacing-2` | Round up to 8px |
| 8px | `--spacing-2` | Exact match |
| 10px | `--spacing-3` | Round up to 12px |
| 12px | `--spacing-3` | Exact match |
| 16px | `--spacing-4` | Exact match |
| 20px | `--spacing-5` | Exact match |
| 40px | `--spacing-10` | Exact match |
| 60px | `--spacing-12` + `--spacing-3` | Composed |

### 9.2 Font Size Value Mapping

| Found Value | Recommended Token | Notes |
|-------------|-------------------|-------|
| 8px | `--font-size-2xs` | Close to 9px |
| 9px | `--font-size-2xs` | Exact match |
| 10px | `--font-size-xs` | Exact match |
| 11px | `--font-size-sm` | Exact match |
| 12px | `--font-size-md` | Exact match |
| 13px | `--font-size-lg` | Exact match |
| 14px | `--font-size-xl` | Exact match |
| 16px | `--font-size-2xl` | Exact match |
| 18px | `--font-size-3xl` | Need new token (20px) |
| 20px | `--font-size-3xl` | Need new token |
| 24px | `--font-size-4xl` | Need new token |
| 32px | `--font-size-5xl` | Need new token |
| 48px | `--font-size-6xl` | Need new token |

### 9.3 Border Radius Value Mapping

| Found Value | Recommended Token | Notes |
|-------------|-------------------|-------|
| 1px | `--radius-xs` | Round up to 2px |
| 2px | `--radius-xs` | Exact match |
| 4px | `--radius-sm` | Exact match |
| 5px | `--radius-sm` | Round down to 4px |
| 6px | `--radius-md` | Exact match |
| 8px | `--radius-lg` | Exact match |
| 10px | `--radius-lg` | Round down to 8px |
| 12px | `--radius-xl` | Exact match |
| 14px | `--radius-xl` | Round down to 12px |
| 32px | `--radius-2xl` | Round down to 16px |

---

## 10. Next Steps

1. **Review this document** with stakeholders
2. **Prioritize phases** based on team capacity
3. **Begin Phase 2** - Add new token categories
4. **Iteratively standardize** each category
5. **Continuously test** visual regression
6. **Update documentation** as tokens evolve

---

*Document Version: 1.0*
*Created: Design System Standardization Initiative*
*Last Updated: See git history*
