# Typography System - Manual Test Guide

## ✅ Status: App Loading Successfully
- No typography-related JavaScript errors
- Typography Style Manager registered
- Font loading working (Source Sans Pro loaded)

## Quick Test Procedure

### 1. Create Text Element
1. Click **Text Tool** (T) in toolbar
2. Click on canvas
3. Type "Test Typography"
4. Click outside to exit editing

### 2. Apply Text Style
1. Click **Select Tool** (V)
2. Click on the text element
3. In Property Inspector, look for **Typography** section
4. Find **Text Style** dropdown
5. Select **"Title"** from dropdown
6. ✅ Verify: Font size changes to ~56px

### 3. Change Typography Preset (THE KEY TEST)
1. Click **outside** the text to select the slide
2. In Property Inspector, find **Typography** section (slide properties)
3. Click the **Edit button** (pencil icon)
4. Typography Style Manager panel opens
5. You should see 3 preset cards:
   - **Modern Sans** (Inter + Inter)
   - **Professional** (Playfair Display + Source Sans Pro)
   - **Editorial** (Merriweather + Open Sans)

### 4. Switch Presets
1. Click on **"Professional"** preset card
   - Should preview the changes immediately
2. Click **"Apply"** button at bottom
3. Panel closes (or close it manually)

### 5. Verify Real-Time Updates ⭐ CRITICAL TEST
1. Click on the text element again to select it
2. In Property Inspector → Typography section:
   - ✅ **Text Style dropdown** should still show "Title" selected
   - ✅ **Font Family** should now show "Playfair Display" 
   - ✅ **Font Size** should show ~64px (Professional's Title size)
   - ✅ Text on canvas should render with Playfair Display font
3. Switch back to **"Modern Sans"** preset
4. Re-select text element
   - ✅ Should show "Inter" font and ~56px size

## Expected Behavior

### ✅ What Should Work:
- [x] Typography Style Manager opens from slide properties
- [x] Three preset cards visible and clickable
- [x] Clicking preset shows preview
- [x] Apply button commits the change
- [x] Text elements with textStyleId update automatically
- [x] Property Inspector shows updated values
- [x] Font renders correctly on canvas
- [x] Switching presets updates all text with styles

### ⚠️ Known Limitations:
- Text elements WITHOUT textStyleId won't update (manual properties)
- Text edit mode has pre-existing bug (unrelated)
- First font load may be slow (Google Fonts download)

## Cascade Verification

The typography system uses a **5-layer cascade**:

1. **Theme Preset** (typo-style-default, typo-style-professional, etc.)
2. **Master** (references theme preset via typographyStyleId)
3. **Layout** (inherits from master)
4. **Slide** (inherits from layout)
5. **Element** (references text style via textStyleId)

When you change the master's typography preset:
- Master's `typographyStyleId` updates
- All slides using that master inherit the new preset
- All text elements referencing text styles get updated values
- Property Inspector shows the cascaded properties

## Testing Different Text Styles

Try these text styles to see the cascade in action:
- **Title** - Large display text (~56-64px)
- **Subtitle** - Secondary display (~28-32px)
- **Heading 1** - Primary heading (~44-48px)
- **Body** - Main content (~20px)
- **Caption** - Small text (~14px)

Each style will have different sizes across the three presets!

## Troubleshooting

### Typography Section Not Visible
- Make sure you've deselected text elements (click on canvas)
- Typography section only appears in slide/master properties

### Text Style Dropdown Empty
- Check browser console for errors
- Verify `typographyStylePresets` exist in state

### Preset Changes Don't Apply
- Check that Apply button was clicked
- Verify state update in Redux DevTools
- Check master's `typographyStyleId` property

### Fonts Not Loading
- Check Network tab for Google Fonts requests
- Some fonts may take 1-2 seconds to load
- Check FontManager.js console logs

## Success Criteria

✅ **PASS** if:
1. All 3 presets are visible and selectable
2. Clicking preset shows preview
3. Applying preset persists the change
4. Text elements update when preset changes
5. Property Inspector shows correct cascaded values
6. Text renders with correct font on canvas

❌ **FAIL** if:
1. JavaScript errors related to typography
2. Presets don't load or aren't clickable
3. Changes don't persist
4. Property Inspector shows wrong values
5. Text doesn't update after preset change

## Next Steps After Manual Test

If tests pass:
1. Update E2E tests to match working patterns
2. Add data-testid attributes for stable selectors
3. Fix text element selection timing in tests
4. Celebrate! 🎉

If tests fail:
1. Note which step fails
2. Check browser console for errors
3. Verify state updates in Redux DevTools
4. Report findings for debugging
