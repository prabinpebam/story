/**
 * Type definitions for Story E2E tests
 */

/**
 * Extend Window interface to include test-specific properties
 */
declare global {
  interface Window {
    __TEST_STORE__?: {
      getState: () => any;
      dispatch: (actionType: string, payload?: any) => void;
      restoreState?: (state: any) => void;
    };
    app?: any;
  }
}

export {};
