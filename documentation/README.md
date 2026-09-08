# Story Documentation

This directory contains product intent, feature specifications, implementation evidence, quality methodology, and historical records. These document types are intentionally separate.

## Start Here

For the long-term destination and the evidence required to call Story finished, read the [World-Class Definition of Done](product/definition-of-done.md). It combines a September 8, 2026 current-state review with complete product outcome bundles, cross-cutting acceptance, and proposed comparative/craft gates. Its additions require adoption by the existing numbered owners; it does not supersede their authority or claim current conformance.

1. [Complete Product Specification](product/specification/README.md) is the normative multi-volume system from vision through release evidence.
2. [Product Constitution](product/specification/01-product-constitution.md) defines why Story exists, whom it serves first, and what is uniquely Story.
3. [Experience Architecture](product/specification/02-experience-architecture.md) defines the shell, views, scopes, tools, states, adaptive tiers, and visual direction.
4. [R1 Preview Profile](product/specification/profiles/R1-preview.md) defines the first executable 24-workflow product slice.
5. [Familiarity and Story-Native Benchmark](product/specification/benchmarks/familiarity-and-story-native.md) freezes the Figma, PowerPoint, and Story-native evaluation tasks.
6. [Parent Capability Charter](product/product-spec.md) retains the stable `DES`, `PRE`, and `ARC` capability IDs and provides a concise gateway to v2.
7. [Capability Audit](product/capability-audit.md) records what the current repository proves and what remains missing.
8. [Parent Requirement Status](product/requirement-status.md) maps the 74 parent capabilities to current evidence and delivery programs.
9. [100% Implementation Plan](product/implementation-plan.md) defines the six execution phases and strict full-specification closure standard.
10. [Delivery Roadmap](product/delivery-roadmap.md) defines detailed work packages, dependency order, and release gates.
11. [Feature Specifications](specs/README.md) route to detailed domain behavior and architecture.
12. [Automation](automation/index.md) defines how user-visible behavior is verified.

## Authority Model

When documents disagree, use this order:

1. **Specification governance and ownership:** `product/specification/00-governance-and-traceability.md`
2. **Product intent:** `product/specification/01-product-constitution.md`
3. **Accepted numbered-volume behavior:** the sole owning volume under `product/specification/`
4. **Selected release scope:** the accepted profile under `product/specification/profiles/`
5. **Adopted domain detail:** the domain entry point under `specs/`
6. **Current implementation:** production source code
7. **Current verification:** executable tests and dated artifacts from the same revision
8. **Current status:** `product/capability-audit.md`
9. **Historical context:** `archive/`

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

Run `npm run spec:validate` after changing the product specification. The [Completeness Standard](product/specification/README.md#7-completeness-standard) and [Acceptance and Release Conformance](product/specification/15-acceptance-and-release-conformance.md) apply to every major capability.