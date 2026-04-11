# 17 — Typography & Type Settings

> Taskflows for text style management, TypeSettingsFlyout (Basics, Details, Variable tabs), inline formatting, and style linking/unlinking.

## Text Style System

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| TYP-01 | Apply text style | Select from text style dropdown | Style properties applied (family, weight, size, lineHeight, letterSpacing, fontStyle, textDecoration); `textStyleId` set | `applyTextStyle()` |
| TYP-02 | Unlink from style | Click unlink button | `textStyleId` cleared; properties become local and editable | `unlinkFromStyle()` |
| TYP-03 | Reset style overrides | Click reset button | Overridden props reverted to style definition values | `resetToStyle()` |
| TYP-04 | Style-locked fields | Try to edit font family/weight/size while style linked | Controls disabled; must unlink first to modify | — |
| TYP-05 | Text fill not locked | Edit text fill while style linked | Text fill always editable (driven by Color Theme, not style) | — |
| TYP-06 | Override indicator | Local value differs from linked style | Override badge/indicator shown on overridden property | — |

## Font Properties

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| TYP-07 | Change font family | Select from font family dropdown | `fontFamily` updated; available weights may change | `UPDATE_ELEMENT({id, fontFamily})` |
| TYP-08 | Change font weight | Select from weight dropdown (100–900) | `fontWeight` updated | `UPDATE_ELEMENT({id, fontWeight})` |
| TYP-09 | Change font size | Edit font size NumberInput | `fontSize` updated; scrubbable | `UPDATE_ELEMENT({id, fontSize})` |
| TYP-10 | Set line height | Edit line height NumberInput | `lineHeight` updated | `UPDATE_ELEMENT({id, lineHeight})` |
| TYP-11 | Set letter spacing | Edit letter spacing NumberInput (%) | `letterSpacing` updated | `UPDATE_ELEMENT({id, letterSpacing})` |

## TypeSettingsFlyout — Basics Tab

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| TYP-12 | Set justify alignment | Click justify button | `textAlign: 'justify'` via `execCommand('justifyFull')` | `UPDATE_ELEMENT({id, textAlign})` |
| TYP-13 | Toggle underline | Click underline button | `textDecoration` includes/removes 'underline' | `UPDATE_ELEMENT({id, textDecoration})` |
| TYP-14 | Toggle strikethrough | Click strikethrough button | `textDecoration` includes/removes 'line-through' | `UPDATE_ELEMENT({id, textDecoration})` |
| TYP-15 | Set case: None | Click None option | `textTransform: 'none'` | `UPDATE_ELEMENT({id, textTransform})` |
| TYP-16 | Set case: Uppercase | Click Uppercase | `textTransform: 'uppercase'` | `UPDATE_ELEMENT({id, textTransform})` |
| TYP-17 | Set case: Lowercase | Click Lowercase | `textTransform: 'lowercase'` | `UPDATE_ELEMENT({id, textTransform})` |
| TYP-18 | Set case: Capitalize | Click Capitalize | `textTransform: 'capitalize'` | `UPDATE_ELEMENT({id, textTransform})` |
| TYP-19 | Set case: Small Caps | Click Small Caps | `fontVariant: 'small-caps'` | `UPDATE_ELEMENT({id, fontVariant})` |
| TYP-20 | Set paragraph spacing | Edit paragraph spacing NumberInput | Spacing between paragraphs | `UPDATE_ELEMENT({id, paragraphSpacing})` |
| TYP-21 | Set paragraph indent | Edit paragraph indent NumberInput | First-line indentation | `UPDATE_ELEMENT({id, paragraphIndent})` |
| TYP-22 | Set vertical trim | Select from dropdown: Standard, Cap Height | Controls vertical text bounds | `UPDATE_ELEMENT({id, verticalTrim})` |
| TYP-23 | Set list: None | Click None list button | Removes list formatting | `UPDATE_ELEMENT({id, listStyle})` |
| TYP-24 | Set list: Bullet | Click Bullet button | Applies unordered list | `UPDATE_ELEMENT({id, listStyle})` |
| TYP-25 | Set list: Numbered | Click Numbered button | Applies ordered list | `UPDATE_ELEMENT({id, listStyle})` |
| TYP-26 | Set list spacing | Edit list spacing NumberInput | Spacing between list items (only when list active) | `UPDATE_ELEMENT({id, listSpacing})` |
| TYP-27 | Toggle truncate | Click truncate switch | Enables text truncation with ellipsis | `UPDATE_ELEMENT({id, truncate})` |
| TYP-28 | Set max lines | Edit max lines NumberInput | Maximum visible lines (only when truncate enabled) | `UPDATE_ELEMENT({id, maxLines})` |

## TypeSettingsFlyout — Details Tab (OpenType Features)

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| TYP-29 | Set figure style | Select: Default, Lining, Old Style | `font-feature-settings` for `lnum` / `onum` | `UPDATE_ELEMENT({id, openTypeFeatures})` |
| TYP-30 | Set figure spacing | Select: Default, Proportional, Tabular | `font-feature-settings` for `pnum` / `tnum` | `UPDATE_ELEMENT({id, openTypeFeatures})` |
| TYP-31 | Set fractions | Select: Off, Diagonal, Stacked | `font-feature-settings` for `frac` / `afrc` | `UPDATE_ELEMENT({id, openTypeFeatures})` |
| TYP-32 | Toggle standard ligatures | Click switch (default on) | `font-feature-settings` for `liga` | `UPDATE_ELEMENT({id, openTypeFeatures})` |
| TYP-33 | Toggle discretionary ligatures | Click switch | `font-feature-settings` for `dlig` | `UPDATE_ELEMENT({id, openTypeFeatures})` |
| TYP-34 | Toggle contextual alternates | Click switch (default on) | `font-feature-settings` for `calt` | `UPDATE_ELEMENT({id, openTypeFeatures})` |
| TYP-35 | Set stylistic set | Edit NumberInput (0–20) | `font-feature-settings` for `ss01`–`ss20` | `UPDATE_ELEMENT({id, openTypeFeatures})` |
| TYP-36 | Set vertical position | Select: Normal, Superscript, Subscript, Ordinal | `font-feature-settings` for `sups` / `subs` / `ordn` | `UPDATE_ELEMENT({id, openTypeFeatures})` |

## TypeSettingsFlyout — Variable Tab

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| TYP-37 | Set weight axis | Drag weight slider (100–900) | `font-variation-settings` for `wght` | `UPDATE_ELEMENT({id, variableAxes})` |
| TYP-38 | Set width axis | Drag width slider (50–200) | `font-variation-settings` for `wdth` | `UPDATE_ELEMENT({id, variableAxes})` |
| TYP-39 | Set slant axis | Drag slant slider (-15 to 0) | `font-variation-settings` for `slnt` | `UPDATE_ELEMENT({id, variableAxes})` |
| TYP-40 | Variable tab info | Variable font not loaded | Info text explaining variable fonts shown | — |
| TYP-41 | Custom axis display | Font with non-standard axes | Additional sliders for custom registered axes | `UPDATE_ELEMENT({id, variableAxes})` |

## Inline Formatting (During Text Edit)

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| TYP-42 | Apply format to selection | Change font size/family/color in PI while editing with selection | Format applied to selected text only via `wrapSelectionWithStyle` or `execCommand` | — |
| TYP-43 | Apply format to element | Change font property in PI while editing with no selection | Property updated on whole element | `UPDATE_ELEMENT` |
