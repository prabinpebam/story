# Typography System - Manual Test Verification

## Purpose
Manually verify the Typography System implementation works correctly before finalizing automated tests.

## Test Workflow

### 1. Create a Slide ✓
- **Action**: Open the app, ensure at least one slide exists
- **Expected**: Slide visible in sidebar and canvas

### 2. Create a Text Object ✓
- **Action**: 
  - Click Text tool (T) in toolbar
  - Click on canvas
  - Type "Typography Test"
  - Click outside to exit text editing
- **Expected**: Text element created and visible

### 3. Select Text Element
- **Action**:
  - Click Select tool (V) in toolbar
  - Click on the text element
- **Expected**: 
  - Text element selected (selection handles visible)
  - Property Inspector shows "Typography" section
  - Text Style dropdown visible with options

### 4. Assign Text Style "Title"
- **Action**:
  - In Property Inspector → Typography section
  - Click Text Style dropdown
  - Select "Title"
- **Expected**:
  - Title style applied
  - Font properties update to match Title style
  - `textStyleId: "title"` in element state

### 5. Change Typography Preset of Slide
- **Action**:
  - Click outside text to deselect
  - Property Inspector should show slide properties
  - Find "Typography" section
  - Click edit button (pencil icon)
  - Typography Style Manager panel opens
  - Click on a different preset (e.g., "Professional" if currently "Modern")
- **Expected**:
  - Typography Style Manager shows available presets
  - Clicking preset applies it to slide's master

### 6. Verify Real-Time Property Inspector Updates
- **Action**:
  - Re-select the text element
  - Check Property Inspector → Typography section
- **Expected**:
  - Font Size, Line Height, Letter Spacing reflect new preset values
  - Text Style dropdown still shows "Title" selected
  - Visual appearance updated in canvas

### 7. Verify Text Style Cascade Works
- **Action**:
  - With text still selected, check rendered font properties
- **Expected**:
  - Text renders with Title style properties from new typography preset
  - Cascade: Theme → Master → Layout → Slide → Element working
  - `textStyleId` still "title" (reference maintained)

## Verification Checklist

- [ ] Text tool creates text elements
- [ ] Text element selection shows Property Inspector
- [ ] Typography section visible with Text Style dropdown
- [ ] Dropdown shows available text styles (Title, Body, Heading, Caption, etc.)
- [ ] Applying style updates `textStyleId` property
- [ ] Typography Style Manager accessible from slide properties
- [ ] Changing preset updates theme master's `typographyStyleId`
- [ ] Re-selecting text shows updated property values
- [ ] Text renders with correct typography from cascade
- [ ] Manual overrides work (changing font size directly)
- [ ] Detach style button works (if visible)
- [ ] Reset style button works (if visible)

## Known Issues

1. **E2E Tests Failing**: Property Inspector not appearing in automated tests
   - Issue: Click sequence for text selection may need adjustment
   - Manual testing required to verify actual functionality
   - Tests may need to wait longer or use different selectors

2. **Text Style Options**: Need to verify which styles appear in dropdown
   - Expected: display, title, subtitle, heading1-3, body, body-small, caption
   - Actual: TBD from manual test

3. **Typography Style Manager**: Need to verify panel opens and presets are clickable
   - Location: Right sidebar panel
   - Trigger: Edit button in Typography section when slide selected

## Testing Results

### Date: [Fill in after manual test]
### Tester: [Fill in]

**Test 1 - Basic Text Creation**: [ ] PASS [ ] FAIL
Notes:

**Test 2 - Style Application**: [ ] PASS [ ] FAIL
Notes:

**Test 3 - Preset Change**: [ ] PASS [ ] FAIL
Notes:

**Test 4 - Real-Time Updates**: [ ] PASS [ ] FAIL
Notes:

**Test 5 - Cascade Resolution**: [ ] PASS [ ] FAIL
Notes:

## Next Steps

Based on manual test results:
1. If PASS: Fix E2E test selectors and timing
2. If FAIL: Debug and fix the implementation
3. Document any edge cases or unexpected behavior
4. Create additional test scenarios as needed
