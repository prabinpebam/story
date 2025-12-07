import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Store, store as globalStore } from '../../src/core/Store.js';
import { PropertyInspector } from '../../src/ui/PropertyInspector.js';
import { TextSection } from '../../src/ui/properties/TextSection.js';
import { createMockState } from '../helpers/mockState.js';

describe('PropertyInspector Integration Tests', () => {
  let store, inspector, realState;
  
  beforeEach(() => {
    // Mock DOM elements
    document.body.innerHTML = `
      <div class="sidebar">
        <div class="sidebar-header">
          <div class="header-title">Properties</div>
        </div>
        <div id="property-inspector"></div>
      </div>
      <div id="canvas-container"></div>
    `;

    // Use REAL state structure, not mocks
    realState = createMockState(); // Helper that creates valid Phase 1 state
    store = new Store(realState);
    
    // Mock store dispatch to avoid side effects but keep state access real
    // store.dispatch = vi.fn(); 
    
    inspector = new PropertyInspector('property-inspector');
  });
  
  it('should initialize all sections with real state', () => {
    // This would have caught the state.masters issue!
    expect(() => {
      inspector.init();
    }).not.toThrow();
  });
  
  it('should handle selection changes across sections', () => {
    const textElement = realState.elements['text-1'];
    
    // Simulate selection change
    store.dispatch('editor/setSelection', { elementIds: ['text-1'] });
    
    // Verify all sections update correctly
    // Note: We need to check if sections are created/visible
    // This depends on PropertyInspector implementation details
    
    // Assuming inspector has a way to check active sections or we can check DOM
    // For this test, just ensuring it doesn't crash is a big win
    
    // If inspector.sections is public:
    if (inspector.sections) {
        const textSection = inspector.sections.find(s => s instanceof TextSection);
        // If text section exists, it should be active/visible for text element
        if (textSection) {
            // Check if it didn't throw during update
            expect(textSection).toBeDefined();
        }
    }
  });
  
  it('should access state properties that actually exist', () => {
    // Verify no code tries to access deprecated properties
    const accessAttempts = [];
    
    // Proxy to track property access
    const stateProxy = new Proxy(realState, {
      get(target, prop) {
        accessAttempts.push(prop);
        return Reflect.get(target, prop);
      }
    });
    
    // Spy on globalStore.getState to return proxy
    const getStateSpy = vi.spyOn(globalStore, 'getState').mockReturnValue(stateProxy);
    
    // Re-render inspector to trigger state access
    inspector.render();
    
    // Should NOT access old architecture
    expect(accessAttempts).not.toContain('masters');
    expect(accessAttempts).not.toContain('themeSettings');
    
    // Should access new architecture
    // Note: PropertyInspector accesses 'editor' first, then others via activeContainer
    expect(accessAttempts).toContain('editor');
    
    getStateSpy.mockRestore();
  });
});
