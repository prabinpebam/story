# Presets and Style Data Model

## Data Schema

The typography system relies on a strict schema for Presets and Styles to ensure consistency across themes.

### 1. Text Style Object
Defines the visual properties of a single text role.

```typescript
interface TextStyle {
  fontFamily: string;
  fontSize: string;      // e.g., "48px"
  fontWeight: number;    // 100-900
  lineHeight: number;    // Unitless multiplier (e.g., 1.2)
  letterSpacing?: string;// e.g., "0.05em"
  textTransform?: 'uppercase' | 'lowercase' | 'capitalize' | 'none';
  fontStyle?: 'normal' | 'italic';
}
```

### 2. Typography Preset
Defines a complete typographic theme.

```typescript
interface TypographyPreset {
  id: string;            // Unique ID (e.g., "modern-clean")
  name: string;          // Display name
  category: 'sans' | 'serif' | 'display' | 'handwriting' | 'mixed';
  fonts: string[];       // Array of font families to load
  styles: {
    title: TextStyle;
    subtitle: TextStyle;
    h1: TextStyle;
    h2: TextStyle;
    body: TextStyle;
    bodySmall: TextStyle;
    caption: TextStyle;
    label: TextStyle;
  };
}
```

## Semantic Roles

The system enforces the following 8 semantic roles. Every text element created in the app must default to one of these roles.

| Role | Usage Intent | Typical Characteristics |
|------|--------------|-------------------------|
| **Title** | Slide Main Title | Largest size, Display font, Tight leading |
| **Subtitle** | Slide Subtitle | Medium-Large, often lighter weight |
| **H1** | Section Header | Large, Bold, High contrast |
| **H2** | Sub-section | Medium, Semi-bold |
| **Body** | Main Content | Readable size (16-24px), Good line-height (1.5) |
| **BodySmall** | Secondary Text | Smaller than body, often lighter color |
| **Caption** | Image Captions | Small, Italic or Neutral |
| **Label** | UI Tags / Data | Small, Uppercase, Wide tracking |

## Style Resolution Strategy

To support "Active Linking," the system must distinguish between **Defined Styles** and **Applied Properties**.

### 1. The "Linked" State (Happy Path)
When an element is fully linked:
- It has a `textStyleId` (e.g., `'body'`).
- It has **NO** explicit values for `fontFamily`, `fontSize`, `fontWeight`, etc., in its own data model.
- **Render Time**: The renderer fetches these values directly from the `currentTheme`.
- **Result**: Changing the theme instantly changes the look of this element.

### 2. The "Overridden" State (Partial Link)
When a user manually changes a specific property (e.g., makes a word Bold):
- The element retains its `textStyleId` (`'body'`).
- It stores an **override** for that specific property: `{ fontWeight: 700 }`.
- **Render Time**: Renderer uses Theme values for Family/Size, but the Element value for Weight.
- **Result**: Changing the Theme's *Font Family* will still update this element, but changing the Theme's *Weight* will be ignored.

### 3. Master Slide Inheritance
Master slides introduce a middle layer.
- **Scenario**: A Master Slide has a "Title Placeholder".
- **Master Edit**: The user edits the Master Slide and changes the Title Placeholder to "Blue".
- **Instance Effect**: All slides using that Master will now have Blue titles, *unless* they have specifically overridden the color themselves.
- **Theme Effect**: If the Theme is changed to a Serif font, the Master Placeholder (and all instances) update to Serif, while keeping the Blue color override.

### 4. Reset Behavior
The system must provide a way to "Re-link" or "Reset".
- **Action**: "Reset Styles"
- **Logic**: `delete element.manualOverrides`
- **Result**: The element snaps back to perfectly matching the Theme + Master definition.
