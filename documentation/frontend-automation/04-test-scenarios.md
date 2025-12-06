# 04. Test Scenarios

This document outlines the comprehensive list of testable frontend interactions, organized by category.

## 1. Canvas & Selection
| ID | Scenario | Priority | Status |
|----|----------|----------|--------|
| C01 | Select single element by clicking | P0 | ✅ |
| C02 | Deselect by clicking empty space | P0 | ✅ |
| C03 | Multi-select using Shift+Click | P1 | ✅ |
| C04 | Marquee selection (drag to select multiple) | P1 | ⬜ |
| C05 | Move element by dragging | P0 | ✅ |
| C06 | Resize element using corner handles | P1 | ⬜ |
| C07 | Resize element using edge handles | P1 | ⬜ |
| C08 | Rotate element using rotation handle | P2 | ⬜ |
| C09 | Constrained resize (Shift+Drag) | P2 | ⬜ |
| C10 | Center resize (Alt+Drag) | P2 | ⬜ |
| C11 | Delete element using Delete/Backspace key | P0 | ✅ |
| C12 | Duplicate element (Ctrl+D / Alt+Drag) | P1 | ⬜ |
| C13 | Group multiple elements (Ctrl+G) | P2 | ⬜ |
| C14 | Ungroup elements (Ctrl+Shift+G) | P2 | ⬜ |
| C15 | Select element inside group (Deep select) | P2 | ⬜ |
| C16 | Pan canvas (Space+Drag) | P2 | ⬜ |
| C17 | Zoom canvas (Ctrl+Scroll / Buttons) | P2 | ⬜ |

## 2. Typography & Text Editing
| ID | Scenario | Priority | Status |
|----|----------|----------|--------|
| **Core Editing** | | | |
| T01 | Create text element via tool | P0 | ✅ |
| T02 | Enter edit mode (Double click) | P0 | ⬜ |
| T03 | Type text content (Alphanumeric) | P0 | ⬜ |
| T04 | Type special characters & symbols | P1 | ⬜ |
| T05 | Commit text changes (Click outside) | P0 | ⬜ |
| T06 | Commit text changes (Cmd+Enter) | P1 | ⬜ |
| T07 | Cancel text changes (Esc) - Reverts to previous state | P1 | ⬜ |
| T08 | Delete empty text element on commit | P1 | ⬜ |
| **Selection & Navigation** | | | |
| T09 | Select all text (Cmd+A) inside edit mode | P1 | ⬜ |
| T10 | Move caret with Arrow keys | P1 | ⬜ |
| T11 | Select text range with Shift+Arrow | P1 | ⬜ |
| T12 | Select word (Double click) | P2 | ⬜ |
| T13 | Select paragraph (Triple click) | P2 | ⬜ |
| **Typography Properties** | | | |
| T14 | Change Font Family (Dropdown selection) | P1 | ⬜ |
| T15 | Change Font Weight/Style (Bold, Italic, etc.) | P1 | ⬜ |
| T16 | Change Font Size (Input value) | P1 | ⬜ |
| T17 | Change Font Size (Keyboard shortcuts Cmd+Shift+>/<) | P2 | ⬜ |
| T18 | Change Line Height (Auto vs Fixed) | P2 | ⬜ |
| T19 | Change Letter Spacing (Tracking) | P2 | ⬜ |
| T20 | Change Paragraph Spacing | P2 | ⬜ |
| T21 | Change Text Alignment (Left, Center, Right, Justify) | P1 | ⬜ |
| T22 | Change Vertical Alignment (Top, Middle, Bottom) | P1 | ⬜ |
| **Advanced Formatting** | | | |
| T23 | Toggle Text Decoration (Underline, Strikethrough) | P2 | ⬜ |
| T24 | Toggle Case (Uppercase, Lowercase, Title Case, Small Caps) | P2 | ⬜ |
| T25 | Create Bullet List | P2 | ⬜ |
| T26 | Create Numbered List | P2 | ⬜ |
| T27 | Adjust List Spacing | P2 | ⬜ |
| T28 | Toggle Text Truncation & Max Lines | P2 | ⬜ |
| **Styles** | | | |
| T29 | Create new Text Style from current selection | P2 | ⬜ |
| T30 | Apply existing Text Style | P2 | ⬜ |
| T31 | Detach Text Style | P2 | ⬜ |
| T32 | Update Text Style (Propagate changes) | P2 | ⬜ |
| T33 | Reset overrides to Style defaults | P2 | ⬜ |

## 3. Layout & Transforms
| ID | Scenario | Priority | Status |
|----|----------|----------|--------|
| P01 | Inspector shows correct properties for selection | P0 | ✅ |
| P02 | Change X/Y coordinates via input | P1 | ⬜ |
| P03 | Change Width/Height via input | P1 | ⬜ |
| P04 | Toggle Constrain Proportions (Link icon) | P2 | ⬜ |
| P05 | Change Rotation angle | P2 | ⬜ |
| P06 | Flip Horizontal | P2 | ⬜ |
| P07 | Flip Vertical | P2 | ⬜ |
| P08 | Change Opacity (Layer level) | P1 | ⬜ |
| P09 | Change Blend Mode (Layer level) | P2 | ⬜ |
| P10 | Adjust Corner Radius (Uniform) | P2 | ⬜ |
| P11 | Adjust Corner Radius (Independent corners) | P2 | ⬜ |

## 4. Fills & Color System
| ID | Scenario | Priority | Status |
|----|----------|----------|--------|
| **Solid Fills** | | | |
| FL01 | Apply Solid Fill color via Hex input | P0 | ⬜ |
| FL02 | Apply Solid Fill via Color Picker (HSB area) | P1 | ⬜ |
| FL03 | Apply Solid Fill via Swatch Grid | P1 | ⬜ |
| FL04 | Change Solid Fill Opacity | P1 | ⬜ |
| FL05 | Toggle Fill Visibility | P1 | ⬜ |
| FL06 | Remove Fill Layer | P1 | ⬜ |
| FL07 | Add Multiple Fill Layers | P2 | ⬜ |
| FL08 | Reorder Fill Layers | P2 | ⬜ |
| **Gradient Fills** | | | |
| FL09 | Switch Fill Type to Linear Gradient | P1 | ⬜ |
| FL10 | Switch Fill Type to Radial Gradient | P2 | ⬜ |
| FL11 | Switch Fill Type to Angular Gradient | P2 | ⬜ |
| FL12 | Switch Fill Type to Diamond Gradient | P2 | ⬜ |
| FL13 | Add Gradient Stop (Flyout) | P2 | ⬜ |
| FL14 | Remove Gradient Stop (Flyout) | P2 | ⬜ |
| FL15 | Move Gradient Stop position (Flyout input) | P2 | ⬜ |
| FL16 | Change Gradient Stop Color | P2 | ⬜ |
| FL17 | Change Gradient Stop Opacity | P2 | ⬜ |
| FL18 | Reverse Gradient Direction | P2 | ⬜ |
| FL19 | Rotate Gradient (90 deg step) | P2 | ⬜ |
| FL20 | Manipulate Gradient Handles on Canvas (Start/End) | P2 | ⬜ |
| **Image & Video Fills** | | | |
| FL21 | Switch Fill Type to Image | P1 | ⬜ |
| FL22 | Upload Image file | P1 | ⬜ |
| FL23 | Change Image Scale Mode (Fill, Fit, Tile, Crop) | P2 | ⬜ |
| FL24 | Switch Fill Type to Video | P2 | ⬜ |
| FL25 | Upload Video file | P2 | ⬜ |
| **Code Fills** | | | |
| FL26 | Switch Fill Type to Code | P2 | ⬜ |
| FL27 | Open Code Fill Panel | P2 | ⬜ |
| FL28 | Apply Code Fill Preset | P2 | ⬜ |
| FL29 | Edit Code in Editor | P2 | ⬜ |
| FL30 | Generate Code Fill via AI Prompt | P2 | ⬜ |
| FL31 | Run/Pause Code Fill execution | P2 | ⬜ |
| **Color Picker UI** | | | |
| FL32 | Switch between Color Models (Hex, RGB, HSL, CSS) | P2 | ⬜ |
| FL33 | Use Eyedropper tool | P2 | ⬜ |
| FL34 | Save Color to Document Colors | P2 | ⬜ |
| FL35 | Switch between Custom and Library tabs | P2 | ⬜ |

## 5. Effects & Styling
| ID | Scenario | Priority | Status |
|----|----------|----------|--------|
| **Strokes** | | | |
| ST01 | Add Stroke Layer | P1 | ⬜ |
| ST02 | Change Stroke Color | P1 | ⬜ |
| ST03 | Change Stroke Weight (px) | P1 | ⬜ |
| ST04 | Change Stroke Position (Inside, Center, Outside) | P2 | ⬜ |
| ST05 | Configure Dashed Stroke (Dash/Gap values) | P2 | ⬜ |
| ST06 | Set Stroke Cap Styles (Round, Butt, Square) | P2 | ⬜ |
| ST07 | Add Multiple Stroke Layers | P2 | ⬜ |
| **Drop & Inner Shadows** | | | |
| FX01 | Add Drop Shadow Effect | P1 | ⬜ |
| FX02 | Configure Shadow X/Y Offset | P2 | ⬜ |
| FX03 | Configure Shadow Blur Radius | P2 | ⬜ |
| FX04 | Configure Shadow Spread | P2 | ⬜ |
| FX05 | Configure Shadow Color & Opacity | P2 | ⬜ |
| FX06 | Add Inner Shadow Effect | P2 | ⬜ |
| FX07 | Stack Multiple Shadow Effects | P2 | ⬜ |
| **Blurs** | | | |
| FX08 | Add Layer Blur Effect | P2 | ⬜ |
| FX09 | Configure Layer Blur Radius | P2 | ⬜ |
| FX10 | Add Background Blur Effect | P2 | ⬜ |
| FX11 | Configure Background Blur Radius | P2 | ⬜ |

## 6. Color Theme Manager
| ID | Scenario | Priority | Status |
|----|----------|----------|--------|
| TM01 | Open Color Theme Manager | P2 | ⬜ |
| TM02 | Apply Preset Theme to Slide | P1 | ⬜ |
| TM03 | Create Custom Theme | P2 | ⬜ |
| TM04 | Edit Theme Colors (Primary, Accent, Background) | P2 | ⬜ |
| TM05 | Generate Theme from Image | P2 | ⬜ |
| TM06 | Generate Theme via AI Prompt | P2 | ⬜ |
| TM07 | Verify Theme Cascade (Master -> Slide -> Element) | P2 | ⬜ |
| TM08 | Save Custom Theme | P2 | ⬜ |

## 7. Slide Management
| ID | Scenario | Priority | Status |
|----|----------|----------|--------|
| S01 | Add new slide | P0 | ✅ |
| S02 | Delete slide | P0 | ⬜ |
| S03 | Duplicate slide | P1 | ⬜ |
| S04 | Reorder slides (Drag & Drop) | P1 | ⬜ |
| S05 | Change Slide Background | P1 | ⬜ |
| S06 | Apply Master Layout to slide | P1 | ⬜ |

## 8. Presentation Mode
| ID | Scenario | Priority | Status |
|----|----------|----------|--------|
| R01 | Start Presentation | P0 | ✅ |
| R02 | Navigate Next/Prev (Keyboard) | P0 | ✅ |
| R03 | Navigate Next/Prev (HUD) | P0 | ✅ |
| R04 | Exit Presentation (Esc) | P0 | ✅ |
| R05 | Toggle Black Screen (B) | P1 | ✅ |
| R06 | Toggle Grid View (G) | P1 | ✅ |
| R07 | Toggle Laser Pointer (L) | P2 | ⬜ |

## 9. Master Mode
| ID | Scenario | Priority | Status |
|----|----------|----------|--------|
| M01 | Switch to Master Mode | P0 | ✅ |
| M02 | Create new Master Slide | P1 | ⬜ |
| M03 | Add Placeholder to Master | P1 | ⬜ |
| M04 | Rename Master Slide | P2 | ⬜ |
| M05 | Switch back to Normal Mode | P0 | ✅ |

## 10. File Operations
| ID | Scenario | Priority | Status |
|----|----------|----------|--------|
| F01 | Create New Document | P1 | ⬜ |
| F02 | Save Document (Local) | P1 | ⬜ |
| F03 | Load Document (Local) | P1 | ⬜ |
| F04 | Export to JSON | P2 | ⬜ |
| F05 | Change Document Title | P2 | ⬜ |
