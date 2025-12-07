/**
 * Creates a valid mock state that matches Phase 1 architecture
 * @param {Object} overrides - Properties to override
 * @returns {Object} Valid state object
 */
export function createMockState(overrides = {}) {
  const baseState = {
    // Phase 1 architecture - NEW
    slideMasterPresets: {
      'master-default': {
        id: 'master-default',
        type: 'slideMasterPreset',
        name: 'Default Master',
        layouts: ['layout-title', 'layout-content']
      }
    },
    colorThemePresets: {
      'theme-default': {
        id: 'theme-default',
        name: 'Default Theme',
        colors: { primary: '#3B82F6', background: '#FFFFFF' }
      }
    },
    typographyStylePresets: {
      'typo-default': {
        id: 'typo-default',
        name: 'Default Typography',
        fontFamily: 'Inter',
        fontSize: 16
      }
    },
    
    // Core state
    slides: {
      'slide-1': {
        id: 'slide-1',
        masterId: 'master-default',
        layoutId: 'layout-title',
        colorThemeId: 'theme-default', // Reference, not embedded
        typographyStyleId: 'typo-default', // Reference, not embedded
        elements: []
      }
    },
    slideOrder: ['slide-1'],
    elements: {
      'text-1': {
        id: 'text-1',
        type: 'text',
        content: 'Hello',
        typographyStyleId: 'typo-default'
      }
    },
    editor: {
      selectedElementIds: [],
      selectedSlideId: 'slide-1'
    },
    
    ...overrides
  };
  
  // Validate no deprecated properties exist
  validateStateShape(baseState);
  
  return baseState;
}

/**
 * Validates state matches Phase 1 architecture
 * Throws if deprecated properties found
 */
export function validateStateShape(state) {
  const deprecated = ['masters', 'themeSettings', 'styleAssignments'];
  const found = deprecated.filter(prop => prop in state);
  
  if (found.length > 0) {
    throw new Error(
      `Mock state contains deprecated properties: ${found.join(', ')}\n` +
      `Please update to Phase 1 architecture.`
    );
  }
  
  // Verify required properties exist
  const required = ['slideMasterPresets', 'colorThemePresets', 'typographyStylePresets'];
  const missing = required.filter(prop => !(prop in state));
  
  if (missing.length > 0) {
    throw new Error(
      `Mock state missing required Phase 1 properties: ${missing.join(', ')}`
    );
  }
}
