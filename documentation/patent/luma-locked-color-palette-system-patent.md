# Patent Documentation

## Luma-Locked Tonal Cluster Color Palette System with Photo-Style Adjustment Controls

**Inventor:** Prabin Pebam  
**Filing Date:** December 2025  
**Application Type:** Utility Patent

---

## Title of Invention

**"Luma-Locked Tonal Cluster Color Palette System with Photo-Style Adjustment Controls"**

Alternative titles:
- "Contrast-Preserving Color Theme Generation System Using Luminance-Anchored Tonal Clusters"
- "Method and System for Generating Interchangeable Color Themes Using Fixed-Luminance Tonal Slots"
- "Luminance-Constrained Color Palette Editor with Image-Processing-Inspired Adjustment Controls"

---

## Abstract

A computer-implemented method and system for generating, editing, and managing interchangeable color palettes through a luminance-constrained tonal cluster architecture. The system defines a scalable N-slot color palette where each slot has a predetermined, immutable luminance (luma) value organized into three or more perceptual tonal clusters—Shadows, Midtones, and Highlights—while allowing free manipulation of hue and saturation values. This luminance-locking mechanism guarantees consistent contrast relationships between any slot pairing across all themes, ensuring functional legibility regardless of color choices.

The system introduces photo-editing-inspired adjustment controls—including Brightness, Contrast, Highlights, Shadows, Whites, Blacks, and Saturation—that operate on the tonal clusters rather than individual colors, enabling intuitive global palette manipulation while preserving the fixed luminance delta relationships between slots. Adjustments are applied through cluster-aware algorithms that respect tonal boundaries.

The architecture is fully scalable: the number of slots per cluster, the number of clusters, and the number of color role columns can all be configured to produce palettes ranging from 3 colors to unlimited colors while maintaining the core luminance-locking principle. This enables automatic theme interchangeability: any palette can be applied to any template with guaranteed legibility because the luma delta values—the perceptual contrast between slots—remain constant.

---

## Technical Field

This invention relates to computer-implemented color management systems, specifically to methods and systems for generating, editing, and applying color palettes in design software, presentation applications, website builders, and other digital content creation tools.

---

## Background of the Invention

### Problems with Existing Color Palette Systems

Traditional color palette systems suffer from several fundamental limitations:

1. **Arbitrary Color Selection**: Users can select any colors without regard for functional relationships, leading to palettes with poor contrast and legibility issues.

2. **Semantic Rigidity**: Systems that use semantic labels (e.g., "background color," "accent color," "text color") impose design assumptions that may not fit all use cases and limit creative flexibility.

3. **Non-Interchangeable Themes**: When switching themes, designs often break because contrast relationships are not preserved between the old and new color sets.

4. **Complex Color Theory Requirements**: Users must understand color theory (complementary colors, contrast ratios, accessibility guidelines) to create functional palettes.

5. **Separate Light/Dark Mode Definitions**: Most systems require creating and maintaining separate palettes for light and dark modes.

6. **Per-Color Adjustment Paradigm**: Traditional color systems provide HSL/HSV/RGB controls for individual colors, but offer no mechanism for adjusting an entire color palette as a unified entity. Users must manually adjust each color individually to achieve coordinated changes across a palette.

7. **No Palette-Level Perceptual Controls**: While photo editing software offers intuitive controls (brightness, contrast, highlights, shadows) for adjusting images, no equivalent exists for adjusting color palettes. Users cannot say "make my entire palette brighter" or "increase contrast across my theme" with a single control.

### Need for the Invention

There exists a need for a color palette system that:
- Guarantees functional contrast relationships automatically
- Provides intuitive, photo-editing-style controls that operate on the **entire palette as a single entity**
- Enables seamless theme interchangeability
- Scales from minimal to complex palette requirements
- Unifies light and dark mode under a single definition
- Allows coordinated palette-wide adjustments without per-color manual editing

---

## Summary of the Invention

The present invention provides a **Luma-Locked Tonal Cluster Color Palette System** that addresses the above limitations through the following key innovations:

### Core Innovation: Luminance Locking

The system inverts the traditional color picker paradigm by **locking luminance (luma)** values while allowing free manipulation of **hue and saturation**. Since luminance is the primary factor determining contrast and legibility, locking it guarantees functional color relationships regardless of the hue/saturation choices made.

### Tonal Cluster Organization

Colors are organized into **tonal clusters** based on their luminance values:
- **Shadows Cluster**: Low luminance values (e.g., 5-25%)
- **Midtones Cluster**: Medium luminance values (e.g., 35-65%)
- **Highlights Cluster**: High luminance values (e.g., 70-97%)

Each cluster can contain multiple slots, enabling scalability from simple 3-color palettes to complex multi-color systems.

### Photo-Style Adjustment Controls for Entire Palettes

A key innovation of this system is the application of photo-editing adjustment paradigms to **color palettes as a whole**, rather than to individual colors. While HSL controls are intuitive for adjusting a single color, no prior system provides intuitive controls for coordinating adjustments across an entire multi-color palette.

The system provides adjustment controls borrowed from photo editing software, but applied to the palette as a unified entity:
- **Brightness**: Global luminance shift across ALL slots simultaneously
- **Contrast**: Expansion/compression of the ENTIRE tonal range
- **Highlights**: Selective adjustment of ALL high-luminance slots together
- **Shadows**: Selective adjustment of ALL low-luminance slots together
- **Whites**: Fine control of ALL highest luminance slots
- **Blacks**: Fine control of ALL lowest luminance slots
- **Saturation**: Global saturation scaling across ALL slots

This is analogous to how a photographer adjusts an entire image with a single "brightness" slider rather than adjusting each pixel individually. The invention brings this same intuitive, unified control paradigm to color palette management.

### Automatic Theme Interchangeability

Because luminance relationships are fixed, any theme can be applied to any template with guaranteed legibility. The design structure is preserved; only the aesthetic "feel" (hue/saturation) changes.

---

## Detailed Description of the Invention

### 1. Luminance-Locked Slot Architecture

#### 1.1 Core Principle

Each color slot in the palette has three components:
- **Hue (H)**: 0-360° on the color wheel — **User Editable**
- **Saturation (S)**: 0-100% color intensity — **User Editable**  
- **Luminance (L)**: 0-100% perceived brightness — **System Locked**

The luminance value for each slot is predetermined and immutable. Users can only modify hue and saturation, ensuring that the perceptual contrast between any two slots remains constant across all theme variations.

#### 1.2 Luminance Value Assignment

Luminance values are assigned based on:
1. **Perceptual clustering** into tonal groups (shadows, midtones, highlights)
2. **Minimum perceptible delta** between adjacent slots (based on Weber's Law, approximately 2% luminance difference)
3. **Non-uniform distribution** to create visually distinct tonal separations

Example luminance distribution for a 12-slot system:

| Cluster | Slot | Luminance | Description |
|---------|------|-----------|-------------|
| Shadows | 1 | 5% | Deepest shadow |
| Shadows | 2 | 10% | Dark shadow |
| Shadows | 3 | 18% | Medium shadow |
| Shadows | 4 | 25% | Light shadow |
| Midtones | 5 | 35% | Dark midtone |
| Midtones | 6 | 45% | Medium-dark midtone |
| Midtones | 7 | 55% | Medium-light midtone |
| Midtones | 8 | 65% | Light midtone |
| Highlights | 9 | 70% | Dark highlight |
| Highlights | 10 | 80% | Medium highlight |
| Highlights | 11 | 90% | Light highlight |
| Highlights | 12 | 97% | Brightest highlight |

#### 1.3 Contrast Guarantee

The fixed luminance delta between slots guarantees:
- **Legibility**: Text on background always meets contrast requirements when using slots from different clusters
- **Hierarchy**: Visual hierarchy is preserved across theme changes
- **Accessibility**: WCAG contrast ratios are inherently maintained for cross-cluster pairings

### 2. Scalable Tonal Cluster System

#### 2.1 Cluster Scalability

The system supports any number of slots per cluster:

**Minimal Configuration (3 slots):**
```
Shadows:    [Shadow 1]
Midtones:   [Midtone 1]
Highlights: [Highlight 1]
```

**Standard Configuration (12 slots):**
```
Shadows:    [Shadow 1] [Shadow 2] [Shadow 3] [Shadow 4]
Midtones:   [Midtone 1] [Midtone 2] [Midtone 3] [Midtone 4]
Highlights: [Highlight 1] [Highlight 2] [Highlight 3] [Highlight 4]
```

**Extended Configuration (24 slots):**
```
Shadows:    [Shadow 1] [Shadow 2] [Shadow 3] [Shadow 4] [Shadow 5] [Shadow 6] [Shadow 7] [Shadow 8]
Midtones:   [Midtone 1] [Midtone 2] [Midtone 3] [Midtone 4] [Midtone 5] [Midtone 6] [Midtone 7] [Midtone 8]
Highlights: [Highlight 1] [Highlight 2] [Highlight 3] [Highlight 4] [Highlight 5] [Highlight 6] [Highlight 7] [Highlight 8]
```

#### 2.2 Additional Cluster Types

Beyond the three primary clusters, the system can include additional intermediate clusters:

```
Deep Shadows:   L: 0-10%    [Deep Shadow 1] [Deep Shadow 2] ...
Shadows:        L: 10-25%   [Shadow 1] [Shadow 2] ...
Dark Midtones:  L: 25-40%   [Dark Midtone 1] [Dark Midtone 2] ...
Midtones:       L: 40-60%   [Midtone 1] [Midtone 2] ...
Light Midtones: L: 60-75%   [Light Midtone 1] [Light Midtone 2] ...
Highlights:     L: 75-90%   [Highlight 1] [Highlight 2] ...
Bright Lights:  L: 90-100%  [Bright 1] [Bright 2] ...
```

#### 2.3 Color Role Columns

Slots are further organized into **color role columns**, where each column represents a distinct color function:

**Basic Column Structure:**
```
         Primary    Accent
Shadows:   P-S       A-S
Midtones:  P-M       A-M
Highlights: P-H       A-H
```

**Extended Column Structure:**
```
         Primary   Secondary1   Secondary2   Accent   Tertiary1   Tertiary2
Shadows:   P-S       S1-S        S2-S        A-S       T1-S        T2-S
Midtones:  P-M       S1-M        S2-M        A-M       T1-M        T2-M
Highlights: P-H       S1-H        S2-H        A-H       T1-H        T2-H
```

Each column shares a common hue, creating visual coherence while the row (cluster) structure provides tonal variety.

#### 2.4 Scalability Formula

The total number of slots in a palette is calculated as:

```
Total Slots = Number of Clusters × Number of Columns
```

Examples:
- 3 clusters × 1 column = 3 slots (minimal)
- 3 clusters × 4 columns = 12 slots (standard)
- 5 clusters × 6 columns = 30 slots (extended)
- 7 clusters × 8 columns = 56 slots (comprehensive)

### 3. Photo-Style Adjustment Controls for Unified Palette Manipulation

#### 3.1 The Core Innovation: Palette-as-Entity Adjustment

Traditional color systems treat each color as an independent entity. While HSL (Hue, Saturation, Lightness) controls are intuitive for adjusting a **single color**, they provide no mechanism for adjusting multiple colors in a coordinated fashion.

This invention introduces **palette-level adjustment controls** that treat the entire color palette as a single entity—similar to how photo editing software treats an entire image as a single entity. Just as a photographer can adjust the "brightness" of an entire photograph with one slider (rather than adjusting each pixel), this system allows users to adjust the "brightness" of an entire color palette with one control.

**The Paradigm Shift:**

| Traditional Approach | This Invention |
|---------------------|----------------|
| Adjust colors one at a time | Adjust entire palette simultaneously |
| HSL controls per color | Photo-style controls for whole palette |
| Manual coordination required | Automatic coordinated changes |
| "Make this blue lighter" | "Make my entire palette lighter" |
| N adjustments for N colors | 1 adjustment for N colors |

#### 3.2 Available Adjustment Controls

#### 3.2 Brightness Adjustment

**Function:** Shifts all luminance values uniformly up or down.

**Algorithm:**
```
adjusted_luma = base_luma + (brightness × scale_factor)
```

**Behavior:**
- Positive values: All colors become lighter
- Negative values: All colors become darker
- Clipping prevention: Values clamped to 0-100% range

**Implementation:**
```javascript
function applyBrightness(luma, brightness) {
    const adjustment = brightness * 0.5; // Scale factor
    return Math.max(0, Math.min(100, luma + adjustment));
}
```

#### 3.3 Contrast Adjustment

**Function:** Expands or compresses the tonal range around a midpoint.

**Algorithm:**
```
factor = (contrast + 100) / 100
adjusted_luma = midpoint + (base_luma - midpoint) × factor
```

**Behavior:**
- Positive values: Shadows become darker, highlights become lighter
- Negative values: All values move toward middle gray
- Midpoint: Typically 50% luminance

**Implementation:**
```javascript
function applyContrast(luma, contrast) {
    const factor = (contrast + 100) / 100;
    const midpoint = 50;
    const adjusted = midpoint + (luma - midpoint) * factor;
    return Math.max(0, Math.min(100, adjusted));
}
```

#### 3.4 Highlights Adjustment

**Function:** Selectively adjusts slots in the highlights cluster (luminance > 50%).

**Algorithm:**
```
if (base_luma > 50):
    factor = (base_luma - 50) / 50  // 0-1 weight based on distance from midpoint
    adjusted_luma = base_luma + (highlights × weight × factor)
else:
    adjusted_luma = base_luma  // No change for non-highlights
```

**Behavior:**
- Only affects slots with luminance above 50%
- Effect scales with distance from midpoint (brighter slots affected more)

**Implementation:**
```javascript
function applyHighlights(luma, highlights) {
    if (luma < 50) return luma;
    const factor = (luma - 50) / 50;
    const adjustment = highlights * 0.3 * factor;
    return Math.max(0, Math.min(100, luma + adjustment));
}
```

#### 3.5 Shadows Adjustment

**Function:** Selectively adjusts slots in the shadows cluster (luminance < 50%).

**Algorithm:**
```
if (base_luma < 50):
    factor = (50 - base_luma) / 50  // 0-1 weight based on distance from midpoint
    adjusted_luma = base_luma + (shadows × weight × factor)
else:
    adjusted_luma = base_luma  // No change for non-shadows
```

**Behavior:**
- Only affects slots with luminance below 50%
- Effect scales with distance from midpoint (darker slots affected more)

**Implementation:**
```javascript
function applyShadows(luma, shadows) {
    if (luma > 50) return luma;
    const factor = (50 - luma) / 50;
    const adjustment = shadows * 0.3 * factor;
    return Math.max(0, Math.min(100, luma + adjustment));
}
```

#### 3.6 Whites Adjustment

**Function:** Fine-tunes the brightest slots (luminance > 80%).

**Algorithm:**
```
if (base_luma > 80):
    factor = (base_luma - 80) / 20  // 0-1 weight for whites region
    adjusted_luma = base_luma + (whites × weight × factor)
else:
    adjusted_luma = base_luma
```

**Implementation:**
```javascript
function applyWhites(luma, whites) {
    if (luma < 80) return luma;
    const factor = (luma - 80) / 20;
    const adjustment = whites * 0.2 * factor;
    return Math.max(0, Math.min(100, luma + adjustment));
}
```

#### 3.7 Blacks Adjustment

**Function:** Fine-tunes the darkest slots (luminance < 20%).

**Algorithm:**
```
if (base_luma < 20):
    factor = (20 - base_luma) / 20  // 0-1 weight for blacks region
    adjusted_luma = base_luma + (blacks × weight × factor)
else:
    adjusted_luma = base_luma
```

**Implementation:**
```javascript
function applyBlacks(luma, blacks) {
    if (luma > 20) return luma;
    const factor = (20 - luma) / 20;
    const adjustment = blacks * 0.2 * factor;
    return Math.max(0, Math.min(100, luma + adjustment));
}
```

#### 3.8 Saturation Adjustment

**Function:** Scales the saturation of all slots globally.

**Algorithm:**
```
adjusted_saturation = base_saturation × ((saturation + 100) / 100)
```

**Implementation:**
```javascript
function applySaturation(saturation, adjustment) {
    const factor = (adjustment + 100) / 100;
    return Math.max(0, Math.min(100, saturation * factor));
}
```

#### 3.9 Combined Adjustment Pipeline

All adjustments are applied in a specific order to ensure predictable results:

```javascript
function applyAllAdjustments(slotColor, baseLuma, adjustments) {
    let luma = baseLuma;
    
    // Apply luma adjustments in order
    luma = applyBrightness(luma, adjustments.brightness);
    luma = applyContrast(luma, adjustments.contrast);
    luma = applyHighlights(luma, adjustments.highlights);
    luma = applyShadows(luma, adjustments.shadows);
    luma = applyWhites(luma, adjustments.whites);
    luma = applyBlacks(luma, adjustments.blacks);
    
    // Apply saturation adjustment
    const saturation = applySaturation(slotColor.s, adjustments.saturation);
    
    return {
        h: slotColor.h,
        s: saturation,
        l: luma
    };
}
```

### 4. Minimum Perceptible Delta Constraint

#### 4.1 Weber's Law Foundation

Human luminance perception follows Weber's Law, which states that the just-noticeable difference (JND) in luminance is approximately 1-2% of the base luminance. The system enforces a minimum 2% luminance delta between adjacent slots to ensure visible distinction.

#### 4.2 Validation Algorithm

Before applying adjustments, the system validates that the resulting luminance values maintain minimum deltas:

```javascript
const MIN_LUMA_DELTA = 2;

function validateAdjustments(adjustments) {
    const lumaValues = calculateEffectiveLumaValues(adjustments);
    
    // Check for clipping
    const clipped = lumaValues.some(l => l <= 0 || l >= 100);
    
    // Check minimum delta between adjacent slots
    let minDelta = Infinity;
    for (let i = 1; i < lumaValues.length; i++) {
        const delta = Math.abs(lumaValues[i] - lumaValues[i - 1]);
        minDelta = Math.min(minDelta, delta);
    }
    
    return {
        valid: !clipped && minDelta >= MIN_LUMA_DELTA,
        clipped,
        deltaViolation: minDelta < MIN_LUMA_DELTA,
        minDelta
    };
}
```

### 5. Light/Dark Mode Support

#### 5.1 Inversion Mapping

The system provides automatic light/dark mode support through **slot index mirroring**:

```
Light Mode: Slot N → Slot N (no change)
Dark Mode:  Slot N → Slot (total_slots - 1 - N)
```

For a 12-slot system:
- Slot 0 (darkest) ↔ Slot 11 (brightest)
- Slot 1 ↔ Slot 10
- Slot 5 ↔ Slot 6
- etc.

#### 5.2 Single Theme, Dual Modes

This inversion means:
- **One theme definition** serves both light and dark modes
- **No duplicate maintenance** is required
- **Contrast relationships are preserved** because shadow/highlight clusters simply swap roles

```javascript
function getEffectiveSlotIndex(slotIndex, colorMode, totalSlots) {
    if (colorMode === 'dark') {
        return (totalSlots - 1) - slotIndex;
    }
    return slotIndex;
}
```

### 6. Color Harmony Generation

#### 6.1 Supported Harmony Types

The system includes algorithms for generating color harmonies within the luminance-locked constraints:

| Harmony Type | Description | Hue Distribution |
|--------------|-------------|------------------|
| Monochromatic | Single hue, all columns | All columns: same H |
| Complementary | Two opposing hues | Columns split 180° apart |
| Analogous | Adjacent hues | Columns within 30-60° |
| Triadic | Three equidistant hues | Columns 120° apart |
| Split-Complementary | Base + two near-complements | Base + 150° and 210° |
| Tetradic | Four hues in rectangle | Two complementary pairs |
| Square | Four equidistant hues | Columns 90° apart |

#### 6.2 Generation Algorithm

```javascript
function generateHarmonyHues(harmonyType, baseHue) {
    switch (harmonyType) {
        case 'complementary':
            return [baseHue, (baseHue + 180) % 360];
        case 'analogous':
            return [baseHue, (baseHue + 30) % 360, (baseHue + 330) % 360];
        case 'triadic':
            return [baseHue, (baseHue + 120) % 360, (baseHue + 240) % 360];
        case 'split-complementary':
            return [baseHue, (baseHue + 150) % 360, (baseHue + 210) % 360];
        case 'tetradic':
            return [baseHue, (baseHue + 60) % 360, (baseHue + 180) % 360, (baseHue + 240) % 360];
        case 'square':
            return [baseHue, (baseHue + 90) % 360, (baseHue + 180) % 360, (baseHue + 270) % 360];
        default:
            return [baseHue];
    }
}
```

### 7. Theme Interchangeability

#### 7.1 The Interchangeability Guarantee

Because luminance relationships are immutable:

1. **Any theme** can be applied to **any template**
2. **Legibility is guaranteed** because contrast ratios are fixed
3. **Only aesthetic qualities** (hue, saturation, "warmth," "coolness") change
4. **Design structure is preserved** through slot-based references

#### 7.2 Grayscale Test

A correctly implemented theme passes the "grayscale test":
- Desaturate any theme to 0% saturation
- The resulting grayscale palette remains **fully functional**
- All text remains legible, all hierarchy is preserved

This is because functionality depends on luminance, not hue or saturation.

---

## Claims

### Independent Claims

**Claim 1:** A computer-implemented method for generating interchangeable color palettes comprising:
- Defining a plurality of color slots, each slot having a luminance value, a hue value, and a saturation value;
- Locking the luminance value of each slot to a predetermined value while permitting modification of the hue and saturation values;
- Organizing the slots into tonal clusters based on their luminance values;
- Providing photo-editing-style adjustment controls that operate on the locked luminance values while preserving minimum perceptible delta constraints between adjacent slots.

**Claim 2:** A system for creating scalable color palettes comprising:
- A scalable slot architecture supporting any number of slots organized into tonal clusters (shadows, midtones, highlights);
- A column-based organization where slots within a column share a common hue;
- Adjustment controls including brightness, contrast, highlights, shadows, whites, blacks, and saturation;
- Algorithms for applying adjustments while respecting cluster boundaries and minimum delta constraints.

**Claim 3:** A method for providing automatic light/dark mode support comprising:
- Defining color slots with fixed luminance values;
- Implementing slot index mirroring for dark mode where slot N maps to slot (total - 1 - N);
- Maintaining a single theme definition that serves both light and dark modes through the mirroring mechanism.

### Dependent Claims

**Claim 4:** The method of Claim 1, wherein the tonal clusters comprise:
- A shadows cluster with luminance values in the range of 0-30%;
- A midtones cluster with luminance values in the range of 30-70%;
- A highlights cluster with luminance values in the range of 70-100%.

**Claim 5:** The method of Claim 1, wherein the minimum perceptible delta constraint is based on Weber's Law and is approximately 2% luminance difference.

**Claim 6:** The system of Claim 2, wherein the number of clusters is scalable from 3 to any number, including intermediate clusters such as deep shadows, dark midtones, light midtones, and bright lights.

**Claim 7:** The system of Claim 2, wherein the number of columns is scalable from 1 to any number, including primary, secondary, tertiary, accent, and additional color role columns.

**Claim 8:** The method of Claim 1, further comprising color harmony generation algorithms that operate within the luminance-locked constraints to produce complementary, analogous, triadic, split-complementary, tetradic, and square color harmonies.

**Claim 9:** The system of Claim 2, wherein the adjustment controls are applied in a specific order: brightness, contrast, highlights, shadows, whites, blacks, and saturation.

**Claim 10:** The method of Claim 3, wherein the grayscale test validates theme functionality by confirming that a desaturated version of any theme remains fully functional with preserved legibility and hierarchy.

---

## Drawings Description

### Figure 1: Tonal Cluster Organization
Illustrates the three primary tonal clusters (Shadows, Midtones, Highlights) with their respective luminance ranges and example slot distributions.

### Figure 2: Scalable Slot Grid
Shows the 4-column × 3-row grid structure with color role columns (Primary, Secondary, Accent, etc.) and tonal cluster rows.

### Figure 3: Photo-Style Adjustment Controls
Depicts the user interface for adjustment sliders (Brightness, Contrast, Highlights, Shadows, Whites, Blacks, Saturation) and their effect on the tonal range.

### Figure 4: Adjustment Algorithm Visualization
Graphs showing how each adjustment type affects luminance values across the tonal range.

### Figure 5: Light/Dark Mode Inversion
Diagram showing slot index mirroring for automatic light/dark mode support.

### Figure 6: Theme Interchangeability
Side-by-side comparison of different themes applied to the same template, demonstrating preserved structure with different aesthetics.

### Figure 7: Scalability Configurations
Examples of minimal (3-slot), standard (12-slot), and extended (24+ slot) configurations.

---

## Advantages of the Invention

1. **Guaranteed Legibility**: Locking luminance ensures contrast relationships are always preserved.

2. **Palette-as-Entity Control**: Photo-editing-style adjustments operate on the entire palette simultaneously, eliminating the need to adjust colors individually. One slider adjusts all 12 (or N) colors in a coordinated fashion.

3. **Familiar Mental Model**: Users already understand brightness/contrast/highlights/shadows from photo editing; this invention applies that familiar paradigm to color palette management.

4. **Unlimited Scalability**: The system scales from 3 colors to any number while maintaining the core principles.

5. **Automatic Theme Interchangeability**: Any theme works with any template without manual adjustment.

6. **Unified Light/Dark Mode**: Single theme definition serves both modes through mathematical inversion.

7. **Dramatic Efficiency Gains**: Adjusting a 12-color palette requires 1 action instead of 12 separate color adjustments.

8. **Accessibility Built-In**: WCAG contrast requirements are inherently satisfied by cross-cluster pairings.

9. **Perceptual Foundation**: Based on Weber's Law and human luminance perception research.

10. **Creative Freedom with Guardrails**: Users can explore any hue/saturation combinations knowing the result will always be functionally valid.

---

## Industrial Applicability

This invention is applicable to:
- Presentation software (e.g., PowerPoint alternatives)
- Design tools (e.g., Figma, Canva alternatives)
- Website builders
- Mobile app design tools
- Document editors
- Email template builders
- Social media content creation tools
- Any software requiring user-configurable color themes

---

## Prior Art Distinction

This invention is distinct from prior art in that:

1. **Traditional color pickers** (HSL/HSV/RGB) provide intuitive controls for **individual colors**, but offer no mechanism for adjusting an entire palette as a coordinated unit. Users must adjust each color separately.

2. **Semantic color systems** (e.g., Material Design, Bootstrap) assign meaning to colors but don't lock luminance values or provide palette-wide adjustment controls.

3. **Accessibility checkers** validate contrast after the fact rather than guaranteeing it by design.

4. **Photo editing software** provides brightness/contrast/highlights/shadows controls for **pixel images**, not for **color palettes**. This invention adapts the photo editing mental model to palette management—a novel application domain.

5. **Color palette generators** (e.g., Coolors, Adobe Color) generate harmonious hues but:
   - Don't organize colors by fixed luminance clusters
   - Don't provide unified palette-level adjustment controls
   - Require per-color adjustments for any modifications

6. **Design system tokens** (CSS variables, design tokens) provide named colors but no mechanism for adjusting all tokens as a coordinated unit.

**The Key Novel Combination:**
The combination of (a) luminance locking, (b) tonal clustering, (c) **photo-style adjustments applied to entire palettes as a single entity**, and (d) automatic mode inversion is novel and not found in any existing system. Specifically, the concept of treating a multi-color palette as a unified entity that can be adjusted with single controls (like adjusting a photograph) represents a fundamental paradigm shift in color palette management.

---

## Conclusion

The Luma-Locked Tonal Cluster Color Palette System represents a fundamental paradigm shift in color palette management. By locking the most functionally critical color component (luminance) while freeing the aesthetic components (hue, saturation), the system guarantees functional outcomes while enabling unlimited creative expression. The photo-style adjustment controls make palette manipulation intuitive for non-experts, and the scalable architecture ensures applicability across diverse use cases from minimal to comprehensive color systems.

---

*Document Version: 1.0*  
*Last Updated: December 2025*
