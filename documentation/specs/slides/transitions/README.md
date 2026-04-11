# Slide Transitions (No Morph)

This folder documents the **current slide transition implementation**.

Supported transition types:
- `none`
- `crossFade`
- `wipe`
- `push`
- `cover`
- `uncover`

Out of scope (not implemented as a slide transition):
- Morph / Smart Animate
	- Planned spec: [05-morph-slide-transition-spec.md](05-morph-slide-transition-spec.md) (not implemented)
	- Delivery ledger: [06-morph-ledger-and-gate-plan.md](06-morph-ledger-and-gate-plan.md)

## Primary docs
- [01-phase-1-slide-transitions-spec.md](01-phase-1-slide-transitions-spec.md)
	- Transition config model and normalization
	- Runtime orchestration (readiness gating, reduced motion, fallbacks)
- [02-transition-inheritance-and-property-inspector-ux.md](02-transition-inheritance-and-property-inspector-ux.md)
	- Cascade/inheritance model
	- Property Inspector UX (picker, reset-to-inherited, previews)
- [03-performance-readiness-and-caching.md](03-performance-readiness-and-caching.md)
	- Readiness probe contract and bounded wait behavior
- [04-testing-and-verification.md](04-testing-and-verification.md)
	- Unit + Playwright coverage that locks in behavior

## Archived historical/process docs
The following files are intentionally no longer maintained at the top level:
- Notes: [00-slide-transitions-notes.md](00-slide-transitions-notes.md) (stub) → [archive/2025-12-21/00-slide-transitions-notes.md](archive/2025-12-21/00-slide-transitions-notes.md)
- Ledger: [05-ledger-and-gate-plan.md](05-ledger-and-gate-plan.md) (stub) → [archive/2025-12-21/05-ledger-and-gate-plan.md](archive/2025-12-21/05-ledger-and-gate-plan.md)
- MUST index: [MUST-index.md](MUST-index.md) (stub) → [archive/2025-12-21/MUST-index.md](archive/2025-12-21/MUST-index.md)
