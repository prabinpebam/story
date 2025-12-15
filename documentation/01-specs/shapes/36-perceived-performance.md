# Performance & Perceived Speed (Shapes)

**Status**: Draft

Defines UX-level performance techniques that keep the editor feeling fast.

---

## 1. Latency budgets
- Pointer move to visual update target.

## 2. Progressive refinement
- If heavy booleans exist:
  - preview during drag
  - refine on release

Required linkage:
- Preview vs final rendering must use discrete LOD buckets (not continuous zoom deltas). Canonical: [16a-tessellation-and-aa.md](./16a-tessellation-and-aa.md)

## 3. Acceptance
- No stutter during common edits.

## 4. Figma-class learnings (what keeps it feeling fast)
- Never block pointer-move rendering on heavy geometry work; use a fast preview path and refine on release.
- Make refinement deterministic: same input state must converge to the same final output (avoid “settling” differences across runs).
- Prefer incremental invalidation: update only the changed operands/nodes rather than recomputing entire groups on every move.
- If a refinement fails (numerical/boolean edge case), keep the last-good preview and surface non-blocking status (don’t drop content or freeze the editor).

## 5. Quality critique (gaps + risks)
- Latency budgets need to be made concrete (per platform/browser) and validated with a reproducible stress scene; otherwise “feels fast” is not enforceable.
- Without a canonical preview-vs-final LOD policy, different teams will implement inconsistent "preview" behaviors; LOD must be centralized.
