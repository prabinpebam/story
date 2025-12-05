# Implementation Prerequisites Checklist

Before starting Phase 1 of the Playwright implementation roadmap, the following prerequisites MUST be completed. This checklist ensures the codebase is ready for automated testing.

---

## 1. Code Instrumentation

### 1.1 Add `data-testid` Attributes
**Status:** ⚠️ Not Started  
**Priority:** Critical  
**Effort:** ~2-3 days

Add `data-testid` attributes to all interactive elements in the React components.

**Pattern:**
```jsx
// Before
<button className="btn-primary" onClick={handleSave}>Save</button>

// After
<button 
    className="btn-primary" 
    onClick={handleSave}
    data-testid="save-button"
>
    Save
</button>
```

**Target components:**
- [ ] Toolbar buttons (Add Slide, Text, Shape, etc.)
- [ ] Property Inspector panels and inputs
- [ ] Modal dialogs (Save, Export, Share)
- [ ] Sidebar elements (Slide sorter, Theme selector)
- [ ] Canvas container (`data-testid="slide-canvas"`)
- [ ] Slide elements (use `data-element-id` for canvas items)

**Naming Convention:**
- Use kebab-case: `add-slide-btn`, `theme-selector`, `font-size-input`
- Be descriptive: `save-presentation-btn` > `save-btn`
- For lists, use indexes: `slide-item-0`, `slide-item-1`

### 1.2 Expose Redux Store in Test Mode
**Status:** ⚠️ Not Started  
**Priority:** Critical  
**Effort:** ~1 hour

Expose the Redux store on the window object for state seeding and inspection.

**Implementation:**
```javascript
// src/main.js or src/store/Store.js
if (import.meta.env.MODE === 'development' || import.meta.env.MODE === 'test') {
    window.__TEST_STORE__ = store;
    console.log('[TEST MODE] Store exposed on window.__TEST_STORE__');
}
```

**Verification:**
```bash
npm run dev
# Open browser console
window.__TEST_STORE__.getState() // Should return current state
```

---

## 2. Authentication & Authorization

### 2.1 Create Mock Auth Mode
**Status:** ⚠️ Not Started  
**Priority:** High  
**Effort:** ~4 hours

Create a bypass mechanism for OAuth to avoid real authentication flows in tests.

**Options:**

**Option A: Environment Variable Bypass**
```javascript
// src/core/identity/auth/bootAuth.js
export async function bootAuth() {
    if (import.meta.env.VITE_TEST_AUTH_BYPASS === 'true') {
        console.log('[TEST MODE] Bypassing OAuth');
        return {
            user: {
                id: 'test-user-123',
                email: 'test@example.com',
                name: 'Test User',
            },
            token: 'mock-jwt-token',
        };
    }
    
    // Normal OAuth flow
    // ...
}
```

**Option B: Mock Auth Provider**
```javascript
// tests/e2e/fixtures/mock-auth.ts
export async function mockAuthState(page: Page) {
    await page.addInitScript(() => {
        window.localStorage.setItem('auth_token', 'mock-jwt-token');
        window.localStorage.setItem('user_id', 'test-user-123');
    });
}
```

**Tasks:**
- [ ] Decide on approach (Option A recommended for cleaner separation)
- [ ] Implement mock auth logic
- [ ] Test with `VITE_TEST_AUTH_BYPASS=true npm run dev`
- [ ] Document usage in `global-setup.ts`

### 2.2 Create Test User Account
**Status:** ⚠️ Not Started  
**Priority:** Medium  
**Effort:** ~1 hour

If using real OAuth for some tests, create a dedicated test user.

- [ ] Create `test@storyapp.com` account
- [ ] Store credentials in `.env.test` (DO NOT commit to Git)
- [ ] Add to GitHub Secrets for CI: `TEST_USER_EMAIL`, `TEST_USER_PASSWORD`

---

## 3. Development Environment Setup

### 3.1 Install Playwright
**Status:** ⚠️ Not Started  
**Priority:** Critical  
**Effort:** ~15 minutes

```bash
npm install -D @playwright/test @axe-core/playwright
npx playwright install chromium firefox webkit
```

### 3.2 Create Playwright Config
**Status:** ⚠️ Not Started  
**Priority:** Critical  
**Effort:** ~30 minutes

Create `playwright.config.ts` based on `01-architecture-spec.md`.

- [ ] Copy config template from spec
- [ ] Set `baseURL` to `http://localhost:5173` (Vite dev server)
- [ ] Configure trace, screenshot, video settings
- [ ] Enable `fullyParallel: true` for speed

### 3.3 Update package.json Scripts
**Status:** ⚠️ Not Started  
**Priority:** Critical  
**Effort:** ~5 minutes

Add test scripts:
```json
{
    "scripts": {
        "test:e2e": "playwright test",
        "test:e2e:headed": "playwright test --headed",
        "test:e2e:debug": "playwright test --debug",
        "test:e2e:ui": "playwright test --ui",
        "test:e2e:report": "playwright show-report"
    }
}
```

---

## 4. Collaboration Testing Setup

### 4.1 Mock Collaboration Server
**Status:** ⚠️ Not Started  
**Priority:** Medium (if testing collaboration features)  
**Effort:** ~1 day

Story has real-time collaboration via `CollaborationService`. For testing:

**Option A: Disable Collaboration in Tests**
```javascript
// In test setup
await page.addInitScript(() => {
    window.__DISABLE_COLLABORATION__ = true;
});
```

**Option B: Mock WebSocket Server**
```typescript
// tests/e2e/fixtures/mock-collaboration-server.ts
import { WebSocketServer } from 'ws';

export function startMockCollaborationServer() {
    const wss = new WebSocketServer({ port: 8080 });
    wss.on('connection', (ws) => {
        ws.on('message', (data) => {
            // Echo back for testing
            ws.send(data);
        });
    });
    return wss;
}
```

**Tasks:**
- [ ] Decide on approach based on whether collaboration features will be tested
- [ ] Document collaboration testing strategy
- [ ] Add to global setup if needed

---

## 5. Test Data & Fixtures

### 5.1 Create Sample Presentations
**Status:** ⚠️ Not Started  
**Priority:** Medium  
**Effort:** ~2 hours

Create reusable test data for seeding state.

**Structure:**
```
tests/e2e/fixtures/
├── data/
│   ├── presentations/
│   │   ├── empty-presentation.json
│   │   ├── simple-presentation.json (3 slides, basic text)
│   │   ├── complex-presentation.json (20 slides, themes, masters)
│   ├── themes/
│   │   ├── custom-theme.json
│   ├── images/
│   │   ├── test-image-1.png (100x100, solid color)
│   │   ├── test-image-2.png (1920x1080, gradient)
```

**Tasks:**
- [ ] Export sample presentations from app (manually create & export state)
- [ ] Sanitize data (remove real user IDs)
- [ ] Document JSON schema in `06-state-seeding-guide.md`

### 5.2 Create Builder Factories
**Status:** ⚠️ Not Started  
**Priority:** High  
**Effort:** ~4 hours

Implement TypeScript factories for building state objects programmatically.

See `06-state-seeding-guide.md` for examples:
- [ ] `createPresentation()`
- [ ] `createSlide()`
- [ ] `createTextElement()`
- [ ] `createTheme()`

---

## 6. CI/CD Configuration

### 6.1 Set Up GitHub Actions Workflow
**Status:** ⚠️ Not Started  
**Priority:** High (after Phase 1-2 tests written)  
**Effort:** ~2 hours

Create `.github/workflows/playwright.yml` based on `00-master-plan.md`.

**Tasks:**
- [ ] Copy workflow template
- [ ] Add caching for node_modules and Playwright browsers
- [ ] Configure matrix strategy for browser parallelization
- [ ] Add artifact upload for traces/videos on failure
- [ ] Test workflow by committing to feature branch

### 6.2 Configure Docker for Visual Tests
**Status:** ⚠️ Not Started  
**Priority:** Medium (Phase 3)  
**Effort:** ~3 hours

Visual regression tests MUST run in Docker for consistency.

**Tasks:**
- [ ] Create `Dockerfile.playwright` (use `mcr.microsoft.com/playwright:v1.40.0`)
- [ ] Update CI workflow to use Docker container
- [ ] Test visual tests produce consistent screenshots locally vs CI

---

## 7. Documentation Review

### 7.1 Team Onboarding
**Status:** ⚠️ Not Started  
**Priority:** Medium  
**Effort:** ~1 hour

Ensure team is familiar with the documentation.

**Tasks:**
- [ ] Schedule team walkthrough of `00-master-plan.md`
- [ ] Assign ownership of each guide to team members
- [ ] Create "Getting Started with Playwright" quick-start doc (5 min read)

### 7.2 Code Review Guidelines
**Status:** ⚠️ Not Started  
**Priority:** Low  
**Effort:** ~30 minutes

Update team's code review checklist to include:
- [ ] "All new features have E2E tests" checkbox
- [ ] "data-testid attributes added for new UI" checkbox

---

## 8. Verification Checklist

Before proceeding to Phase 1, verify ALL of the following:

### Critical Prerequisites (MUST BE DONE)
- [ ] `data-testid` attributes added to at least core components (toolbar, canvas)
- [ ] `window.__TEST_STORE__` exposed in test mode
- [ ] Mock auth mode implemented and tested
- [ ] Playwright installed and config created
- [ ] `npm run test:e2e` command works (even with 0 tests)

### High Priority (Should Be Done)
- [ ] Sample test data created (at least `simple-presentation.json`)
- [ ] Builder factories for state seeding implemented
- [ ] Team reviewed documentation

### Medium Priority (Nice to Have)
- [ ] Collaboration mocking strategy decided
- [ ] GitHub Actions workflow drafted (can be refined later)

### Low Priority (Can Be Deferred)
- [ ] Docker setup for visual tests (Phase 3 only)
- [ ] Test user account created (if not using mock auth)

---

## 9. Estimated Timeline

| Task | Effort | Dependencies |
|------|--------|--------------|
| Add data-testid attributes | 2-3 days | None |
| Expose store in test mode | 1 hour | None |
| Mock auth mode | 4 hours | None |
| Install Playwright + config | 45 min | None |
| Create builder factories | 4 hours | Store exposed |
| Sample test data | 2 hours | None |
| **TOTAL (Parallel)** | **3-4 days** | - |

**Recommendation:** Assign 2 developers for 2 days to parallelize tasks.

---

## 10. Next Steps

Once this checklist is complete:
1. ✅ Verify with `npm run test:e2e -- --list` (should show 0 tests)
2. ✅ Proceed to Phase 1 (Foundation) in `03-implementation-roadmap.md`
3. ✅ Create first test: `tests/e2e/specs/smoke/app-loads.spec.ts`

---

## Questions?
Refer to:
- **Architecture details:** `01-architecture-spec.md`
- **State seeding:** `06-state-seeding-guide.md`
- **Best practices:** `02-best-practices.md`
