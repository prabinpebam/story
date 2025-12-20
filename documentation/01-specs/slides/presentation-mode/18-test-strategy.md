# Test Strategy

This strategy is enforced via the delivery gates and exit criteria in:
- [23-ledger-and-gate-plan.md](23-ledger-and-gate-plan.md)

## Goals
- Define comprehensive test coverage for presentation mode.
- Ensure reliability, performance, and accessibility.

---

## 1) Unit Tests
### Coverage
- Presentation state management (slide/build index, feature toggles).
- Cache tier logic (ACTIVE/HOT/WARM/COLD transitions).
- Keyboard shortcut handling.
- Scaling/letterboxing calculations.

---

## 2) Integration Tests
### Coverage
- Enter/exit presentation mode (fullscreen request, state restoration).
- Navigation (next/prev, jump-to-slide, builds).
- HUD rendering and auto-hide.
- Overlay rendering (laser, grid, black/white screen).
- Presenter View sync (cross-window messaging).

---

## 3) End-to-End (E2E) Tests
### Coverage
- Core user journeys (see [05-core-user-journeys.md](05-core-user-journeys.md)):
  - Start presentation → Navigate → Exit
  - Start → Jump to slide → Back navigation
  - Start → Enable laser → Disable laser
  - Start → Open grid → Click to jump
  - Start → Dual-screen presenter view → Sync verification
- Performance benchmarks (10/50/100 slide decks).
- Chaos tests (display hotplug, sleep/wake, network drop).

---

## 4) Accessibility Tests
### Coverage
- Screen reader announcements (slide/build changes).
- Keyboard-only navigation (no mouse).
- Reduced motion verification.
- High-contrast mode verification.
- Focus management (HUD buttons, modal traps).

---

## 5) Performance Tests
### Coverage
- First frame <300ms (target), <800ms (max).
- Next/prev <50ms (target), <150ms (max).
- Grid open <200ms (target), <500ms (max).
- Memory <500MB (target), <1GB (max) for 100 slides.
- Rapid navigation stress (100 next/prev in succession).

---

## 6) Security Tests
### Coverage
- XSS injection (malicious script tags in slides).
- Cross-window message validation (malformed payloads).
- Privacy boundary audit (notes never in audience DOM).
- Sanitizer coverage (user-generated content).

---

## 7) Visual Regression Tests
### Coverage
- Letterbox color matches theme token.
- HUD styling matches design system.
- Laser color matches theme token.
- Scaling/letterboxing across aspect ratios (16:9, 4:3, ultra-wide).

---

## Test plan
- Unit: Vitest (not Jest), target >80% coverage for presentation modules.
- Integration: Playwright (DOM/UI validation), all core features.
- E2E: Playwright, all user journeys.
- A11y: axe-core, WCAG 2.1 AA compliance.
- Performance: Lighthouse, custom benchmarks.
- Security: OWASP ZAP, manual audits.
- Visual: Percy/Chromatic, theme variations.

## Edge cases
- Browser zoom changes during show.
- Display scaling changes mid-show.
- Fullscreen denial scenarios.
- Media load failures.
- Network drop during navigation.
