# Story Documentation

This directory contains product intent, feature specifications, implementation evidence, quality methodology, and historical records. These document types are intentionally separate.

## Start Here

1. [Product Specification](product/product-spec.md) defines the product Story must become.
2. [Capability Audit](product/capability-audit.md) records what the current repository proves and what remains missing.
3. [Requirement Status](product/requirement-status.md) maps every product requirement to current evidence and the next delivery program.
4. [Delivery Roadmap](product/delivery-roadmap.md) defines dependency order and release gates.
5. [Product Glossary](product/glossary.md) defines canonical terminology.
6. [Principles](product/principles.md) defines cross-cutting engineering and design constraints.
7. [Feature Specifications](specs/README.md) route to detailed domain behavior and architecture.
8. [Automation](automation/index.md) defines how user-visible behavior is verified.

## Authority Model

When documents disagree, use this order:

1. **Product intent:** `product/product-spec.md`
2. **Accepted domain behavior:** the domain entry point under `specs/`
3. **Current implementation:** production source code
4. **Current verification:** executable tests and dated artifacts from the same revision
5. **Current status:** `product/capability-audit.md`
6. **Historical context:** `archive/`

Source code is authoritative for what the current build does, but it does not override the intended product behavior. A difference between code and accepted specification is a product gap, not permission to rewrite the requirement silently.

## Status Vocabulary

Every active specification or status table must keep these dimensions separate:

| Dimension | Allowed values | Meaning |
|---|---|---|
| Specification | `draft`, `accepted`, `superseded` | Whether the intended behavior is ready to implement. |
| Implementation | `missing`, `partial`, `implemented` | Whether a routed production workflow exists. |
| Verification | `none`, `unit`, `integration`, `headed-e2e`, `artifact`, `manual` | What evidence currently proves. Multiple values may apply. |

Do not use `active`, `done`, a percentage, a green symbol, a test filename, or module presence as a substitute for these dimensions.

## Documentation Rules

1. Each domain has exactly one entry point that identifies its normative specifications and any superseded material.
2. Requirements describe user-observable behavior and invariants. Implementation plans describe sequencing and ownership.
3. Taskflow inventories are requirements, not coverage reports.
4. Coverage claims must identify the requirement, evidence type, test or artifact, revision, date, and result.
5. Point-in-time audits and completed plans belong in `archive/` unless they remain the maintained source of truth.
6. Archived documents must not be used as normative requirements.
7. Unsupported behavior must be marked explicitly. Never infer implementation from a control label or document status.
8. The native Story file extension is `.str` until an explicit migration changes the format contract.
9. Local Markdown links must resolve from a clean checkout.
10. Sections explicitly marked `DO NOT EDIT` or `DO NOT DELETE` are never modified or moved.

## Directory Roles

| Directory | Role |
|---|---|
| `product/` | Product promise, users, requirements, principles, current audit, roadmap, and terminology. |
| `specs/` | Accepted or draft behavior and technical contracts organized by product domain. |
| `guides/` | Task-oriented developer setup and operating instructions. |
| `automation/` | Test architecture, eval-loop methodology, taskflow requirements, and evidence guidance. |
| `patent/` | Patent-oriented technical descriptions; not product or implementation authority. |
| `archive/` | Superseded plans, reports, audits, and specifications retained only for history. |

## Change Discipline

A feature change should update, in order:

1. Product requirement only when product scope or promise changes.
2. Domain specification and taskflows before or with implementation.
3. Production code and migrations.
4. Deterministic tests and headed user-flow evidence.
5. Capability status after evidence passes on the current revision.

The [Definition of Done](product/product-spec.md#9-definition-of-done) applies to every major capability.