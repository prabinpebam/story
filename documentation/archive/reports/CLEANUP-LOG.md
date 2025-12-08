# Documentation Cleanup & Reorganization Report

**Date:** December 8, 2025
**Status:** Draft Proposal

## 1. Assessment of Current State

The `documentation/` directory currently contains **~130 files** across multiple subdirectories. While it contains valuable information, it suffers from several organizational issues that hinder discoverability and maintainability.

### Key Issues Identified:

1.  **Fragmentation of Specifications**:
    *   There is a split between `specs/` (Functional Specs) and `tech-specs/` (Technical Specs).
    *   This leads to duplication and desynchronization. For example, `text-editing-v2.md` exists in both `specs/core/` and `tech-specs/core/`.
    *   **Recommendation**: Merge these into a single `specs/` directory organized by feature. Each feature folder should contain both functional and technical details, or a single consolidated document.

2.  **Transient "Plans" vs. Long-Lived "Specs"**:
    *   The `plans/` directory contains 30+ "implementation plans". These are typically transient documents meant to guide a specific block of work.
    *   Many of these (e.g., `global-input-behavior-plan.md`, `undo-redo-implementation-plan.md`) date back to November and likely describe features that are already implemented.
    *   **Recommendation**: Completed plans should be **Archived**. Active plans should be kept, but clearly distinguished from the permanent system documentation.

3.  **Redundant/Overlapping Directories**:
    *   `testing/` appears to contain an older or duplicate structure of `frontend-automation/`.
    *   `reports/` contains a mix of specific audits (valuable history) and general reports.

4.  **Root Level Clutter**:
    *   High-level documents like `product-spec.md`, `principles.md`, and `oauth-setup-guide.md` are mixed with transient reports like `REORG-REPORT.md` and `TEST-COVERAGE-ANALYSIS.md`.

---

## 2. Proposed New Structure

We propose a consolidated structure that separates **Permanent Documentation** (Specs, Guides) from **Transient/Historical Documentation** (Plans, Reports, Archives).

```text
documentation/
├── 00-product/                  # High-level product vision & requirements
│   ├── product-spec.md
│   ├── principles.md
│   └── ...
├── 01-specs/                    # THE Single Source of Truth (Merged specs & tech-specs)
│   ├── core/                    # Core architecture (Store, Undo/Redo, Input)
│   ├── ui-system/               # Design System, Themes, Components
│   ├── canvas/                  # Canvas interactions, Rendering
│   ├── slides/                  # Slide data model, Master slides
│   ├── text-editing/            # Text editing (consolidated v1/v2)
│   ├── collaboration/           # Real-time, Identity, Storage
│   └── ai/                      # AI features
├── 02-guides/                   # Developer guides & How-tos
│   ├── oauth-setup-guide.md
│   └── ...
├── 03-automation/               # Frontend automation docs (renamed from frontend-automation)
│   ├── ...
├── archive/                     # OLD plans and superseded specs
│   ├── plans/                   # Completed implementation plans
│   ├── legacy-specs/            # Old v1 specs
│   └── reports/                 # Old analysis reports
└── active-plans/                # Currently active/in-progress implementation plans
```

---

## 3. Detailed Action Plan

### Phase 1: Archiving (Immediate Cleanup)
Move the following to `documentation/archive/`:
1.  **Completed Plans**: Move most files from `plans/` to `archive/plans/`. Only keep plans for work *currently in progress*.
2.  **Old Reports**: Move `REORG-REPORT.md`, `PHASE1-COMPLETION-STATUS.md` to `archive/reports/`.
3.  **Legacy Specs**: Move `tech-specs/` content that is redundant to `archive/legacy-specs/`.

### Phase 2: Consolidation (The Merge)
1.  **Merge `tech-specs` into `specs`**:
    *   Move unique content from `tech-specs/<feature>` into `specs/<feature>`.
    *   Example: Merge `tech-specs/core/text-editing` content into `specs/text-editing/`.
2.  **Flatten `specs`**:
    *   Ensure every feature has a dedicated folder in `specs/`.
    *   Rename `app-ui-design-system` to `ui-system` for brevity.

### Phase 3: Root Cleanup
1.  Create `00-product` and move `product-spec.md`, `principles.md` there.
2.  Rename `frontend-automation` to `03-automation` (optional, but helps ordering).

---

## 4. Immediate Next Steps

1.  **Approve this plan.**
2.  **Execute Phase 1 (Archiving)**: This will immediately reduce the noise by hiding ~40 files.
3.  **Execute Phase 2 (Consolidation)**: We will systematically merge the folders.

**Shall I proceed with Phase 1 (Archiving)?**
