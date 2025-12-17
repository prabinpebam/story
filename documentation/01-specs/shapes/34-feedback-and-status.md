# Feedback & System Status (Shapes)

**Status**: Implemented (v1, partial)
**Last Updated**: December 17, 2025

Defines cursor states, inline feedback, and error UX.

---

## 1. Cursor states
- Tool cursor changes
- Hover affordances

## 2. Inline feedback
- Size/angle labels during drag
- Snap indicators

V1 non-goal:
- Dedicated numeric size/angle label overlays are not shipped in v1.

## 3. Error handling UX
- Invalid boolean warnings
- Auto-repair messaging policy

V1 implementation notes:
- Boolean fallback is surfaced as a non-blocking warning in the Property Inspector (Boolean section) and via a small layer-tree indicator.
- The editor remains responsive; warnings do not block pointer release.

Figma-class learnings (feedback discipline):
- Prefer non-blocking warnings over modal errors; geometry editors must stay responsive.
- If auto-repair occurs (e.g. tiny segment pruning), the policy must be:
	- deterministic
	- minimally invasive
	- explainable (debug log / optional inline note)
- Avoid noisy warnings during continuous drags; surface issues on commit (mouse-up) when possible.

## 4. Acceptance
- Feedback is immediate and non-disruptive.

Additional acceptance:
- Errors never block pointer release; the editor must always recover cleanly from a failed boolean/mask compute.
- Status feedback is mode-aware (no edit-only cues in `presentation`).

V1 note:
- `presentation` mode is view-only and selection/edit contexts are cleared when switching modes.

## 5. Quality critique (gaps + risks)
- The doc should define where warnings appear (toast vs inline vs inspector) and their lifetime; otherwise implementations will diverge.
- Debug-only overlays are valuable, but must be behind flags to avoid shipping noisy UI.
