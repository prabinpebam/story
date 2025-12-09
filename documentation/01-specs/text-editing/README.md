# Text Editing Specifications

This folder contains the authoritative specifications for the text editing system.

## Current Specs

| Document | Purpose |
|----------|---------|
| [`text-editing-interaction-comprehensive.md`](./text-editing-interaction-comprehensive.md) | **Master specification** - Complete interaction model, behaviors, and implementation reference |
| [`text-editing-test-plan.md`](./text-editing-test-plan.md) | Test scenarios and coverage requirements |
| [`technical/`](./technical/) | Modular technical specs for each component |

## Technical Component Specs

The `technical/` folder contains detailed implementation specs:

- `00-architecture-overview.md` - System architecture
- `01-text-edit-manager.md` - Central orchestrator
- `02-placeholder-manager.md` - Master/slide placeholder logic
- `03-selection-manager.md` - Selection save/restore
- `04-content-sanitizer.md` - HTML sanitization
- `05-style-bridge.md` - Style system integration
- `06-history-bridge.md` - Undo/redo integration
- `07-ime-handler.md` - International input support
- `08-content-recovery.md` - Draft recovery system
- `09-text-element-integration.md` - DOM rendering
- `10-store-handlers.md` - State management
- `11-property-inspector-integration.md` - PI sync
- `12-constants.md` - Shared constants

## Archived Specs

Older versions have been moved to `documentation/archive/specs/text-editing/`:
- `text-editing-interaction.md` - Superseded by comprehensive spec
- `text-editing-v2.md` - UX spec, merged into comprehensive
- `text-editing-v2-technical.md` - Technical spec, split into modular files
