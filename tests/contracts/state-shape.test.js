import { describe, it, expect } from 'vitest';
import { validateStateShape, createMockState } from '../helpers/mockState.js';

describe('State Shape Contract Tests', () => {
  it('should have Phase 1 architecture properties', () => {
    const state = createMockState();
    
    // Required top-level properties
    expect(state).toHaveProperty('slideMasterPresets');
    expect(state).toHaveProperty('colorThemePresets');
    expect(state).toHaveProperty('typographyStylePresets');
    expect(state).toHaveProperty('slides');
    expect(state).toHaveProperty('elements');
    expect(state).toHaveProperty('editor');
    
    // Deprecated properties should NOT exist
    expect(state).not.toHaveProperty('masters');
    expect(state).not.toHaveProperty('themeSettings');
  });
  
  it('should have valid preset references in slides', () => {
    const state = createMockState();
    const firstSlide = state.slides[state.slideOrder[0]];
    
    // New architecture: reference IDs
    expect(firstSlide).toHaveProperty('colorThemeId');
    expect(firstSlide).toHaveProperty('typographyStyleId');
    
    // Old architecture: embedded data (should not exist)
    expect(firstSlide).not.toHaveProperty('styleAssignments');
    expect(firstSlide).not.toHaveProperty('themeSettings');
  });
  
  it('should have valid preset references in elements', () => {
    const state = createMockState();
    const textElement = Object.values(state.elements).find(e => e.type === 'text');
    
    if (textElement) {
      // Typography should reference preset ID
      expect(textElement.typographyStyleId).toBeDefined();
      expect(typeof textElement.typographyStyleId).toBe('string');
    }
  });

  it('validateStateShape should throw on deprecated properties', () => {
    const invalidState = {
      masters: {}, // Deprecated
      slideMasterPresets: {},
      colorThemePresets: {},
      typographyStylePresets: {}
    };

    expect(() => validateStateShape(invalidState)).toThrow(/deprecated properties/);
  });

  it('validateStateShape should throw on missing required properties', () => {
    const invalidState = {
      // Missing slideMasterPresets
      colorThemePresets: {},
      typographyStylePresets: {}
    };

    expect(() => validateStateShape(invalidState)).toThrow(/missing required Phase 1 properties/);
  });
});
