# Keyboard Shortcuts Specification

## Overview

This specification defines the keyboard shortcuts for Story, based on industry-standard patterns from Figma, Adobe XD, Sketch, and other modern design tools. We prioritize consistency with professional design tools over legacy office software shortcuts.

**Design Principles:**
1. **Follow Figma's patterns** - Industry standard, modern UX
2. **Single-key shortcuts for frequent tools** - V, R, T, O, L, etc.
3. **Modifier-based for actions** - Cmd/Ctrl for file ops, arrange
4. **Context-aware** - Different shortcuts based on selection/mode
5. **Discoverable** - Show in tooltips, menus, shortcut panel

---

## 1. Tools

### 1.1 Primary Tools (Single Key)

| Key | Mac | Windows | Tool | Notes |
|-----|-----|---------|------|-------|
| `V` | `V` | `V` | **Move/Select** | Primary selection tool |
| `H` | `H` | `H` | **Hand (Pan)** | Pan canvas, also `Space` drag |
| `R` | `R` | `R` | **Rectangle** | Shape tool |
| `O` | `O` | `O` | **Ellipse/Circle** | Shape tool |
| `L` | `L` | `L` | **Line** | Line drawing tool |
| `T` | `T` | `T` | **Text** | Text insertion |
| `P` | `P` | `P` | **Pen** | Vector pen tool |
| `F` | `F` | `F` | **Frame** | Frame/artboard tool |
| `K` | `K` | `K` | **Scale** | Scale tool (Figma) |
| `I` | `I` | `I` | **Eyedropper** | Pick color from canvas |

### 1.2 Tool Modifiers

| Key | Mac | Windows | Action | Context |
|-----|-----|---------|--------|---------|
| `Shift` + Tool | Hold `Shift` | Hold `Shift` | **Constrain proportions** | Shapes, resize |
| `Alt/Option` + Drag | `⌥` + Drag | `Alt` + Drag | **Resize from center** | Transform |
| `Cmd` + Click | `⌘` + Click | `Ctrl` + Click | **Deep select** | Select child in group |
| `Space` + Drag | `Space` + Drag | `Space` + Drag | **Pan canvas** | While any tool active |

---

## 2. Selection

### 2.1 Basic Selection

| Shortcut | Mac | Windows | Action |
|----------|-----|---------|--------|
| Click | Click | Click | Select single object |
| `Shift` + Click | `⇧` + Click | `Shift` + Click | Add/remove from selection |
| `Cmd/Ctrl` + Click | `⌘` + Click | `Ctrl` + Click | Deep select (into groups) |
| `Cmd/Ctrl` + `A` | `⌘A` | `Ctrl+A` | Select all on current slide |
| `Cmd/Ctrl` + `Shift` + `A` | `⌘⇧A` | `Ctrl+Shift+A` | Deselect all |
| `Esc` | `Esc` | `Esc` | Deselect / Exit mode |

### 2.2 Navigation Selection

| Shortcut | Mac | Windows | Action |
|----------|-----|---------|--------|
| `Tab` | `Tab` | `Tab` | Select next sibling |
| `Shift` + `Tab` | `⇧Tab` | `Shift+Tab` | Select previous sibling |
| `Enter/Return` | `↵` | `Enter` | Select child (into group) |
| `Shift` + `Enter` | `⇧↵` | `Shift+Enter` | Select parent |

---

## 3. Transform & Edit

### 3.1 Position & Size

| Shortcut | Mac | Windows | Action |
|----------|-----|---------|--------|
| `←` `↑` `→` `↓` | Arrow keys | Arrow keys | Nudge 1px |
| `Shift` + Arrows | `⇧` + Arrows | `Shift` + Arrows | Nudge 10px |
| `Cmd/Ctrl` + Arrows | `⌘` + Arrows | `Ctrl` + Arrows | Nudge by grid increment |
| `Cmd/Ctrl` + `D` | `⌘D` | `Ctrl+D` | Duplicate in place |
| `Alt/Option` + Drag | `⌥` + Drag | `Alt` + Drag | Duplicate while dragging |
| `Cmd/Ctrl` + `K` | `⌘K` | `Ctrl+K` | Scale tool |

### 3.2 Arrange (Z-Order)

| Shortcut | Mac | Windows | Action |
|----------|-----|---------|--------|
| `Cmd/Ctrl` + `]` | `⌘]` | `Ctrl+]` | Bring forward |
| `Cmd/Ctrl` + `[` | `⌘[` | `Ctrl+[` | Send backward |
| `Cmd/Ctrl` + `Opt` + `]` | `⌘⌥]` | `Ctrl+Alt+]` | Bring to front |
| `Cmd/Ctrl` + `Opt` + `[` | `⌘⌥[` | `Ctrl+Alt+[` | Send to back |

### 3.3 Flip & Rotate

| Shortcut | Mac | Windows | Action |
|----------|-----|---------|--------|
| `Shift` + `H` | `⇧H` | `Shift+H` | Flip horizontal |
| `Shift` + `V` | `⇧V` | `Shift+V` | Flip vertical |
| Hold `Shift` while rotating | Hold `⇧` | Hold `Shift` | Snap to 15° increments |

### 3.4 Group & Combine

| Shortcut | Mac | Windows | Action |
|----------|-----|---------|--------|
| `Cmd/Ctrl` + `G` | `⌘G` | `Ctrl+G` | Group selection |
| `Cmd/Ctrl` + `Shift` + `G` | `⌘⇧G` | `Ctrl+Shift+G` | Ungroup |
| `Cmd/Ctrl` + `E` | `⌘E` | `Ctrl+E` | Flatten selection |

---

## 4. Edit Operations

### 4.1 Clipboard

| Shortcut | Mac | Windows | Action |
|----------|-----|---------|--------|
| `Cmd/Ctrl` + `C` | `⌘C` | `Ctrl+C` | Copy |
| `Cmd/Ctrl` + `X` | `⌘X` | `Ctrl+X` | Cut |
| `Cmd/Ctrl` + `V` | `⌘V` | `Ctrl+V` | Paste |
| `Cmd/Ctrl` + `Shift` + `V` | `⌘⇧V` | `Ctrl+Shift+V` | Paste over selection |
| `Cmd/Ctrl` + `Alt` + `C` | `⌘⌥C` | `Ctrl+Alt+C` | Copy as PNG to clipboard |
| `Delete/Backspace` | `⌫` | `Del` | Delete selection |

### 4.2 History

| Shortcut | Mac | Windows | Action |
|----------|-----|---------|--------|
| `Cmd/Ctrl` + `Z` | `⌘Z` | `Ctrl+Z` | Undo |
| `Cmd/Ctrl` + `Shift` + `Z` | `⌘⇧Z` | `Ctrl+Shift+Z` | Redo |
| `Cmd/Ctrl` + `Y` | `⌘Y` | `Ctrl+Y` | Redo (alt) |

---

## 5. View & Navigation

### 5.1 Zoom

| Shortcut | Mac | Windows | Action |
|----------|-----|---------|--------|
| `Cmd/Ctrl` + `+` | `⌘+` | `Ctrl++` | Zoom in |
| `Cmd/Ctrl` + `-` | `⌘-` | `Ctrl+-` | Zoom out |
| `Cmd/Ctrl` + `0` | `⌘0` | `Ctrl+0` | Zoom to 100% |
| `Cmd/Ctrl` + `1` | `⌘1` | `Ctrl+1` | Zoom to fit |
| `Cmd/Ctrl` + `2` | `⌘2` | `Ctrl+2` | Zoom to selection |
| `Cmd/Ctrl` + `3` | `⌘3` | `Ctrl+3` | Zoom to all objects |
| `Cmd/Ctrl` + Scroll | `⌘` + Scroll | `Ctrl` + Scroll | Zoom at cursor |
| `Z` + Click/Drag | `Z` + Click | `Z` + Click | Zoom tool |

### 5.2 Pan

| Shortcut | Mac | Windows | Action |
|----------|-----|---------|--------|
| `Space` + Drag | `Space` + Drag | `Space` + Drag | Pan canvas (any tool) |
| `H` | `H` | `H` | Hand tool (persistent) |
| Scroll | Scroll | Scroll | Pan vertically |
| `Shift` + Scroll | `⇧` + Scroll | `Shift` + Scroll | Pan horizontally |

### 5.3 UI Panels

| Shortcut | Mac | Windows | Action |
|----------|-----|---------|--------|
| `Cmd/Ctrl` + `/` | `⌘/` | `Ctrl+/` | Quick actions (search) |
| `Cmd/Ctrl` + `\` | `⌘\` | `Ctrl+\` | Toggle UI visibility |
| `Cmd/Ctrl` + `.` | `⌘.` | `Ctrl+.` | Toggle layers panel |
| `Cmd/Ctrl` + `Alt` + `P` | `⌘⌥P` | `Ctrl+Alt+P` | Toggle properties inspector |
| `Cmd/Ctrl` + `Shift` + `C` | `⌘⇧C` | `Ctrl+Shift+C` | Toggle color theme manager |
| `Cmd/Ctrl` + `Shift` + `?` | `⌘⇧?` | `Ctrl+Shift+?` | Keyboard shortcuts panel |

---

## 6. File Operations

### 6.1 File Management

| Shortcut | Mac | Windows | Action |
|----------|-----|---------|--------|
| `Cmd/Ctrl` + `N` | `⌘N` | `Ctrl+N` | New presentation |
| `Cmd/Ctrl` + `O` | `⌘O` | `Ctrl+O` | Open file |
| `Cmd/Ctrl` + `S` | `⌘S` | `Ctrl+S` | Save |
| `Cmd/Ctrl` + `Shift` + `S` | `⌘⇧S` | `Ctrl+Shift+S` | Save as |
| `Cmd/Ctrl` + `E` | `⌘E` | `Ctrl+E` | Export selection |
| `Cmd/Ctrl` + `Shift` + `E` | `⌘⇧E` | `Ctrl+Shift+E` | Export all |

### 6.2 Presentation

| Shortcut | Mac | Windows | Action |
|----------|-----|---------|--------|
| `Cmd/Ctrl` + `Enter` | `⌘↵` | `Ctrl+Enter` | Start presentation from current slide |
| `Cmd/Ctrl` + `Shift` + `Enter` | `⌘⇧↵` | `Ctrl+Shift+Enter` | Start from beginning |
| `Esc` | `Esc` | `Esc` | Exit presentation mode |
| `→` / `Space` | `→` / `Space` | `→` / `Space` | Next slide |
| `←` | `←` | `←` | Previous slide |

---

## 7. Text Editing

### 7.1 Text Tools

| Shortcut | Mac | Windows | Action | Context |
|----------|-----|---------|--------|---------|
| `T` | `T` | `T` | Text tool | Canvas |
| `Enter/Return` | `↵` | `Enter` | Enter text edit | Text selected |
| `Esc` | `Esc` | `Esc` | Exit text edit | Text editing |
| `Cmd/Ctrl` + `Enter` | `⌘↵` | `Ctrl+Enter` | Exit text edit | Text editing |

### 7.2 Text Formatting

| Shortcut | Mac | Windows | Action | Context |
|----------|-----|---------|--------|---------|
| `Cmd/Ctrl` + `B` | `⌘B` | `Ctrl+B` | Bold | Text editing |
| `Cmd/Ctrl` + `I` | `⌘I` | `Ctrl+I` | Italic | Text editing |
| `Cmd/Ctrl` + `U` | `⌘U` | `Ctrl+U` | Underline | Text editing |
| `Cmd/Ctrl` + `Shift` + `>` | `⌘⇧>` | `Ctrl+Shift+>` | Increase font size | Text editing |
| `Cmd/Ctrl` + `Shift` + `<` | `⌘⇧<` | `Ctrl+Shift+<` | Decrease font size | Text editing |
| `Cmd/Ctrl` + `Alt` + `L` | `⌘⌥L` | `Ctrl+Alt+L` | Align left | Text editing |
| `Cmd/Ctrl` + `Alt` + `T` | `⌘⌥T` | `Ctrl+Alt+T` | Align center | Text editing |
| `Cmd/Ctrl` + `Alt` + `R` | `⌘⌥R` | `Ctrl+Alt+R` | Align right | Text editing |

---

## 8. Slides

### 8.1 Slide Management

| Shortcut | Mac | Windows | Action |
|----------|-----|---------|--------|
| `Cmd/Ctrl` + `Return` | `⌘↵` | `Ctrl+Enter` | New slide |
| `Cmd/Ctrl` + `Shift` + `D` | `⌘⇧D` | `Ctrl+Shift+D` | Duplicate slide |
| `Cmd/Ctrl` + `Delete` | `⌘⌫` | `Ctrl+Del` | Delete slide |
| `Cmd/Ctrl` + `↑` | `⌘↑` | `Ctrl+↑` | Previous slide |
| `Cmd/Ctrl` + `↓` | `⌘↓` | `Ctrl+↓` | Next slide |

### 8.2 Master & Layouts

| Shortcut | Mac | Windows | Action |
|----------|-----|---------|--------|
| `Cmd/Ctrl` + `Shift` + `M` | `⌘⇧M` | `Ctrl+Shift+M` | Toggle master mode |
| `Cmd/Ctrl` + `Shift` + `L` | `⌘⇧L` | `Ctrl+Shift+L` | Layout picker |

---

## 9. Alignment & Distribution

### 9.1 Alignment (Selection Required)

| Shortcut | Mac | Windows | Action |
|----------|-----|---------|--------|
| `Alt` + `A` | `⌥A` | `Alt+A` | Align left |
| `Alt` + `W` | `⌥W` | `Alt+W` | Align right |
| `Alt` + `H` | `⌥H` | `Alt+H` | Align horizontal centers |
| `Alt` + `T` | `⌥T` | `Alt+T` | Align top |
| `Alt` + `S` | `⌥S` | `Alt+S` | Align bottom |
| `Alt` + `V` | `⌥V` | `Alt+V` | Align vertical centers |

### 9.2 Distribution (3+ Selected)

| Shortcut | Mac | Windows | Action |
|----------|-----|---------|--------|
| `Ctrl` + `Alt` + `H` | `⌃⌥H` | `Ctrl+Alt+H` | Distribute horizontal spacing |
| `Ctrl` + `Alt` + `V` | `⌃⌥V` | `Ctrl+Alt+V` | Distribute vertical spacing |

---

## 10. Special Modes

### 10.1 Drawing & Constraints

| Shortcut | Mac | Windows | Action | Context |
|----------|-----|---------|--------|---------|
| `Shift` while drawing | Hold `⇧` | Hold `Shift` | Constrain to square/circle | Shape tools |
| `Alt` while resizing | Hold `⌥` | Hold `Alt` | Resize from center | Transform |
| `Shift` while resizing | Hold `⇧` | Hold `Shift` | Maintain aspect ratio | Transform |
| `Alt + Shift` while resizing | `⌥⇧` | `Alt+Shift` | Center + constrain | Transform |

### 10.2 Measurement & Spacing

| Shortcut | Mac | Windows | Action |
|----------|-----|---------|--------|
| `Alt` hover over element | `⌥` + Hover | `Alt` + Hover | Show distances to other elements |
| `Cmd/Ctrl` click on property | `⌘` + Click | `Ctrl` + Click | Reset to default value |

---

## 11. Advanced Features

### 11.1 Components & Symbols

| Shortcut | Mac | Windows | Action |
|----------|-----|---------|--------|
| `Cmd/Ctrl` + `Alt` + `K` | `⌘⌥K` | `Ctrl+Alt+K` | Create component |
| `Cmd/Ctrl` + `Alt` + `B` | `⌘⌥B` | `Ctrl+Alt+B` | Detach instance |

### 11.2 Boolean Operations

| Shortcut | Mac | Windows | Action |
|----------|-----|---------|--------|
| `Cmd/Ctrl` + `Alt` + `U` | `⌘⌥U` | `Ctrl+Alt+U` | Union |
| `Cmd/Ctrl` + `Alt` + `S` | `⌘⌥S` | `Ctrl+Alt+S` | Subtract |
| `Cmd/Ctrl` + `Alt` + `I` | `⌘⌥I` | `Ctrl+Alt+I` | Intersect |
| `Cmd/Ctrl` + `Alt` + `X` | `⌘⌥X` | `Ctrl+Alt+X` | Exclude |

---

## 12. Context-Specific Shortcuts

### 12.1 When Text Editing

Standard text editing shortcuts apply:
- `Cmd/Ctrl + A` - Select all text
- `Cmd/Ctrl + C/X/V` - Copy/Cut/Paste text
- `Arrow keys` - Move cursor
- `Shift + Arrow` - Select text
- `Cmd/Ctrl + Arrow` - Jump word/line

### 12.2 When In Presentation Mode

| Shortcut | Mac | Windows | Action |
|----------|-----|---------|--------|
| `→` / `Space` / `Page Down` | | | Next slide |
| `←` / `Page Up` | | | Previous slide |
| `Home` | `Home` | `Home` | First slide |
| `End` | `End` | `End` | Last slide |
| `Esc` / `Q` | `Esc` / `Q` | `Esc` / `Q` | Exit presentation |
| `B` | `B` | `B` | Black screen |
| `W` | `W` | `W` | White screen |
| `Number + Enter` | | | Jump to slide |

---

## 13. Discovery & Learning

### 13.1 Shortcut Panel

- **Open:** `Cmd/Ctrl + Shift + ?`
- **Features:**
  - Searchable list
  - Categories (Tools, Edit, View, etc.)
  - Highlight recently used shortcuts
  - Show context-specific shortcuts

### 13.2 Tooltips

- All toolbar buttons show shortcuts in tooltips
- Menu items show shortcuts on right side
- Context menu items show shortcuts

### 13.3 Onboarding

- First-time users see interactive shortcut tutorial
- Progressive disclosure: Show shortcuts after action is performed via UI

---

## 14. Customization

### 14.1 Keyboard Layout

Support for different keyboard layouts:
- QWERTY (default)
- AZERTY (French)
- QWERTZ (German)
- Dvorak
- Colemak

### 14.2 Custom Shortcuts (Future)

Allow users to customize shortcuts in preferences:
- Conflict detection
- Reset to defaults
- Export/import shortcut sets
- Cloud sync

---

## 15. Platform Differences

### 15.1 Modifier Keys

| Mac | Windows | Semantic Meaning |
|-----|---------|------------------|
| `⌘ Command` | `Ctrl` | Primary modifier (File ops, basic edits) |
| `⌥ Option/Alt` | `Alt` | Secondary modifier (Transform, arrange) |
| `⌃ Control` | N/A | Tertiary modifier (rarely used) |
| `⇧ Shift` | `Shift` | Constraint/extend modifier |

### 15.2 Key Equivalents

| Mac | Windows | Notes |
|-----|---------|-------|
| `Return` | `Enter` | |
| `Delete` | `Backspace` | Forward delete on Mac |
| `Fn + Delete` | `Del` | Delete key |

---

## 16. Implementation Priority

### P0 - Must Have (Launch)
- Tools (V, H, R, O, T, L)
- Selection (Click, Shift+Click, Cmd+A, Esc)
- Edit (Cmd+C/X/V, Delete, Cmd+Z/Shift+Z)
- File (Cmd+S, Cmd+N, Cmd+O)
- View (Zoom, Pan)

### P1 - High Priority
- Transform (Arrows, Shift+Arrows, Cmd+D)
- Arrange (Cmd+]/[, Cmd+Alt+]/[)
- Group (Cmd+G, Cmd+Shift+G)
- Text formatting (Cmd+B/I/U)
- Presentation mode shortcuts

### P2 - Nice to Have
- Alignment (Alt+A/W/H/T/S/V)
- Distribution (Ctrl+Alt+H/V)
- Boolean operations
- Component shortcuts
- Advanced text shortcuts

### P3 - Future
- Custom shortcuts
- Shortcut sets
- Cloud sync

---

## 17. Accessibility

### 17.1 Keyboard-Only Workflow

All functionality must be accessible via keyboard:
- Tab navigation through UI
- Arrow key navigation in lists
- Spacebar to activate buttons
- Enter to confirm dialogs
- Esc to cancel/close

### 17.2 Screen Reader Support

- Announce shortcut when action is performed
- ARIA labels include shortcuts
- Shortcut panel is fully accessible

### 17.3 Sticky Keys Support

- Support for users who cannot press multiple keys simultaneously
- Visual indication of modifier states

---

## 18. Testing Checklist

- [ ] All shortcuts work on Mac and Windows
- [ ] Shortcuts don't conflict with browser shortcuts
- [ ] Shortcuts are blocked when typing in text inputs
- [ ] Shortcuts work in all relevant contexts
- [ ] Tooltips show correct shortcuts
- [ ] Shortcut panel is accurate and searchable
- [ ] Text editing shortcuts don't interfere with canvas shortcuts
- [ ] Presentation mode shortcuts work correctly
- [ ] Modifier keys work as expected (Shift, Alt, Cmd/Ctrl)
- [ ] Shortcuts work with different keyboard layouts

---

## 19. Documentation

### 19.1 User Facing

- In-app shortcut panel (Cmd/Ctrl+Shift+?)
- Help menu → Keyboard Shortcuts
- Website documentation page
- Video tutorial highlighting key shortcuts

### 19.2 Developer Facing

- Technical implementation guide (see keyboard-shortcuts-implementation.md)
- Shortcut registration system
- Context management
- Testing framework

---

## References

- **Figma:** https://help.figma.com/hc/en-us/articles/360040328653
- **Sketch:** https://www.sketch.com/docs/shortcuts/
- **Adobe XD:** https://helpx.adobe.com/xd/help/keyboard-shortcuts.html
- **Keynote:** https://support.apple.com/guide/keynote/keyboard-shortcuts-tana9b4e6df3/mac
- **Industry Standard:** Single-key tools, Cmd/Ctrl for actions, context-aware behavior

---

**Last Updated:** December 10, 2025
**Version:** 1.0
**Status:** Draft - Ready for Implementation
