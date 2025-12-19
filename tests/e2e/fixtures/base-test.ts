import { test as base, expect } from '@playwright/test';

/**
 * Base test fixtures for Story E2E tests
 * Extends Playwright's test object with custom fixtures and utilities
 */

type StoryFixtures = {
  /**
   * Get the current Redux store state from the page
   */
  getState: () => Promise<any>;
  
  /**
   * Dispatch an action to the Redux store
   */
  dispatchAction: (actionType: string, payload?: any) => Promise<void>;
};

/**
 * Extended test object with Story-specific fixtures
 */
export const test = base.extend<StoryFixtures>({
  /**
   * Enhanced page fixture with error monitoring
   */
  page: async ({ page }, use) => {
    const errors: Array<{ type: string; message: string; stack?: string }> = [];
    
    // Catch console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push({ type: 'console', message: msg.text() });
      }
    });
    
    // Catch uncaught exceptions (CRITICAL!)
    page.on('pageerror', error => {
      errors.push({
        type: 'exception',
        message: error.message,
        stack: error.stack
      });
    });
    
    // Catch unhandled promise rejections/failed requests
    page.on('requestfailed', request => {
      // Ignore cancelled requests
      if (request.failure()?.errorText === 'net::ERR_ABORTED') return;

      // Vite dev server on Windows/OneDrive can intermittently drop a connection during
      // dependency temp-dir cleanup; a single stylesheet fetch can fail and then recover.
      // Treat these as non-fatal to avoid flaky E2E failures.
      const errorText = request.failure()?.errorText || '';
      const url = request.url() || '';
      if (
        request.resourceType() === 'stylesheet' &&
        errorText.includes('net::ERR_CONNECTION_FAILED') &&
        url.includes('/styles/modules/') &&
        url.endsWith('.css')
      ) {
        return;
      }
      
      errors.push({
        type: 'request',
        message: `Failed: ${url} - ${errorText}`
      });
    });
    
    await use(page);
    
    // Report any errors at the end of the test
    if (errors.length > 0) {
      const errorMsg = errors.map(e => `[${e.type}] ${e.message}`).join('\n');
      throw new Error(`Page errors detected during test:\n${errorMsg}`);
    }
  },

  /**
   * Fixture to get store state
   */
  getState: async ({ page }, use) => {
    const getStateFn = async () => {
      return await page.evaluate(() => {
        if (!window.__TEST_STORE__) {
          throw new Error('Test store not exposed! Ensure app is running in development mode.');
        }
        return window.__TEST_STORE__.getState();
      });
    };
    await use(getStateFn);
  },

  /**
   * Fixture to dispatch actions to the store
   */
  dispatchAction: async ({ page }, use) => {
    const dispatchFn = async (actionType: string, payload?: any) => {
      await page.evaluate(({ type, data }) => {
        if (!window.__TEST_STORE__) {
          throw new Error('Test store not exposed! Ensure app is running in development mode.');
        }
        window.__TEST_STORE__.dispatch(type, data);
      }, { type: actionType, data: payload });
    };
    await use(dispatchFn);
  },
});

// Re-export expect for convenience
export { expect };
