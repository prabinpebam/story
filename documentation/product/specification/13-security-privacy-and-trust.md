# Volume 13: Security, Privacy, and Trust

> **Specification ID:** `STORY-SPEC-13`  
> **Volume:** 13 (16 volumes total, 00-15)  
> **Status:** Normative draft  
> **Version:** 2.0.0-draft  
> **Owner:** Security, Privacy, Trust, Identity, and Platform Engineering  
> **Approvers:** Product, Design, Engineering, Quality, Accessibility, Security, Privacy, Legal  
> **Last reviewed:** July 10, 2026  
> **Review cadence:** At every accepted trust-boundary, data-processing, active-content, provider, or incident-policy change and at least once per release train  
> **Normative scope:** Threat model, trust boundaries, OAuth and token safety, provider access, untrusted files and imports, collaboration and sharing security, SVG, code fills, embeds, recording consent, AI transfer and output safety, telemetry, retention, deletion, audit, incident response, and abuse controls  
> **Explicit non-ownership:** Canonical authored schemas, operation algorithms, package byte layout, collaboration convergence, renderer behavior, presentation sequencing, output format mapping, accessibility semantics, implementation status, and release evidence  
> **Parent specification:** [Story Product Specification System](README.md)  
> **Governed by:** [Volume 00 - Governance and Traceability](00-governance-and-traceability.md)  
> **Supersedes:** Conflicting security, privacy, identity, token, sharing, SVG, code-execution, embed, recording, AI, telemetry, and retention claims in active domain specifications where this volume is more precise  
> **Implementation status:** Out of scope; see the dated [Capability Audit](../capability-audit.md) and Section 18 for evidence-backed current-state boundaries

---

## Table of Contents

1. [Purpose, Scope, and Authority](#1-purpose-scope-and-authority)
2. [Threat Model and Trust Boundaries](#2-threat-model-and-trust-boundaries)
3. [Shared Trust Contracts](#3-shared-trust-contracts)
4. [OAuth, Identity, Tokens, and Local Secrets](#4-oauth-identity-tokens-and-local-secrets)
5. [Files, Providers, Collaboration, and Sharing](#5-files-providers-collaboration-and-sharing)
6. [Imports, SVG, Clipboard, and PPTX](#6-imports-svg-clipboard-and-pptx)
7. [Code Fills, Embeds, External Resources, and Links](#7-code-fills-embeds-external-resources-and-links)
8. [Recording, Devices, Captions, and Transcription](#8-recording-devices-captions-and-transcription)
9. [AI Requests, Outputs, and Generated Code](#9-ai-requests-outputs-and-generated-code)
10. [Privacy, Telemetry, Retention, and Deletion](#10-privacy-telemetry-retention-and-deletion)
11. [Audit, Administration, Abuse, and Incident Response](#11-audit-administration-abuse-and-incident-response)
12. [Failure and Rescue Semantics](#12-failure-and-rescue-semantics)
13. [Security and Privacy Objectives](#13-security-and-privacy-objectives)
14. [Acceptance Criteria](#14-acceptance-criteria)
15. [Required Test and Evidence Protocols](#15-required-test-and-evidence-protocols)
16. [Traceability and Release Gate](#16-traceability-and-release-gate)
17. [Source Adoption and Supersession](#17-source-adoption-and-supersession)
18. [Current Evidence Boundary](#18-current-evidence-boundary)
19. [Open Decisions](#19-open-decisions)
20. [Identifier Counts](#20-identifier-counts)

---

## 1. Purpose, Scope, and Authority

This volume defines when Story may trust a principal, byte stream, provider response, executable capability, external destination, device, model, diagnostic event, or administrative action. Its product promise is visible trust: consequential data use and privilege changes are decided before transfer or execution, not explained only after failure.

Security controls preserve authored work and deterministic core workflows. Failing closed means denying the unsafe privilege, execution, transfer, or disclosure. It does not mean deleting local work, hiding recovery, or making a provider mandatory for safe local inspection.

### 1.1 In Scope

- OAuth/OIDC authorization, callback binding, claim validation, account linking, app sessions, access and refresh tokens, API keys, and local secret storage.
- Local files, `.str` packages, cloud providers, signed URLs, remote fetch, collaboration requests, presence, comments, permissions, share links, revocation, and provider failure.
- Untrusted archives, JSON, XML, HTML, clipboard payloads, SVG, fonts, media, PPTX/OPC, macros, OLE/ActiveX, signatures, encryption, and preserved unknown content.
- Code fills, generated code, sandbox capabilities, embeds, cross-origin messages, external resources, links, navigation, and offline/output fallbacks.
- Microphone, camera, screen capture, recording chunks, live captions, transcription, participant disclosure, consent, and deletion.
- AI prompts, context minimization, model providers, credentials, prompt injection, tools, response validation, preview, commit, provenance, training, and retention.
- Telemetry schemas, diagnostics, privacy preferences, processing records, retention, legal hold, deletion, backups, audit, support access, abuse, incident response, and supply-chain trust.

### 1.2 Normative Dependencies

| Owned contract | Normative dependency |
|---|---|
| Requirement language, evidence, waivers, and traceability | [Volume 00](00-governance-and-traceability.md) |
| Trust-visible product principle and deterministic core | [Volume 01](01-product-constitution.md) |
| Consent, permission, error, and recovery interaction grammar | [Volume 02](02-experience-architecture.md) |
| Authored/runtime boundary, preservation envelopes, and tombstones | [Volume 03](03-canonical-document-model.md) |
| Untrusted transaction validation, operation limits, and audit-safe diagnostics | [Volume 04](04-mutation-history-and-determinism.md) |
| Resource readiness, opaque content, private overlays, and degradation | [Volume 05](05-resolution-scene-and-rendering.md) |
| Package admission, quarantine, assets, cloud publication, and recovery bytes | [Volume 06](06-files-assets-and-recovery.md) |
| Collaboration authority, identity binding, permissions, sharing, revocation, and audit semantics | [Volume 07](07-collaboration-identity-and-sharing.md) |
| Code-fill, SVG, clipboard, media, and authoring entry behavior | [Volume 08](08-figma-class-design-authoring.md) |
| Recording setup, authored captions, media, equations, and embeds | [Volume 09](09-powerpoint-class-presentation-authoring.md) |
| Runtime roles, cross-window routing, device use, recording capture, and audience privacy | [Volume 10](10-presentation-runtime.md) |
| PPTX parsing, format mapping, quarantine disposition, and artifact writing | [Volume 11](11-interchange-and-output.md) |
| Accessible consent, errors, captions, controls, language, and output | [Volume 12](12-accessibility-and-internationalization.md) |

### 1.3 Normative Language

The BCP 14 terms defined by Volume 00 apply. Every `REQ-13-*` row contains one primary normative outcome, one parent-capability link set, and one same-suffix `AC-13-*` criterion.

### 1.4 Explicit Decisions and Supersession

This volume makes the following decisions:

1. A provider-issued identity claim is an input to verification, not authorization by itself.
2. Client-carried display identity, email, profile, role, or file-manifest data never grants privilege.
3. Raw long-lived bearer tokens and AI provider keys are not acceptable in script-readable persistent browser storage for conforming production profiles.
4. OAuth issuer and subject identify a principal; email, name, avatar, tenant display text, and provider file path do not.
5. Identity claims are public identifiers, not high-entropy encryption secrets.
6. Files and provider responses remain untrusted until bounded validation completes, regardless of filename, extension, origin, signature claim, owner, or transport encryption.
7. Preserved active content remains inert. Preservation is not permission to execute.
8. A worker, iframe, or `Function` scope is not a sandbox unless its capabilities, origin, communication, resource budgets, and termination are constrained and tested.
9. HTTPS proves transport to a destination, not that an embed, URL, model, or fetched payload is safe or appropriate.
10. A user-triggered AI command is not blanket consent to send the complete presentation, notes, comments, recordings, or identities.
11. DNT alone is not a complete telemetry policy, and the absence of a central user database does not erase processor, retention, deletion, audit, or incident obligations.
12. Local deletion cannot claim erasure of previously downloaded copies, provider versions, active legal holds, or processor backups before their declared deletion states complete.

---

## 2. Threat Model and Trust Boundaries

### 2.1 Protected Assets

| Asset | Required protection |
|---|---|
| Canonical authored content and pending local intent | Integrity, authorization, confidentiality by document policy, recoverability |
| OAuth tokens, app sessions, API keys, share secrets, encryption keys | Confidentiality, audience/scope binding, revocation, non-replay |
| Collaboration operation stream, snapshots, permissions, comments, audit | Integrity, ordering, attribution, least privilege, retention |
| Presenter notes, next slide, diagnostics, devices, recovery details | Presenter-only confidentiality |
| Recordings, camera, narration, screen capture, captions, transcripts | Consent, confidentiality, purpose limitation, deletion |
| Imported bytes and preserved unknown content | Non-execution, integrity, bounded parsing, provenance |
| AI prompts, context, responses, generated code, provenance | Consent, minimization, output validation, provider policy |
| Telemetry, crash reports, audit, abuse reports | Minimization, integrity, access control, bounded retention |
| Build dependencies, application origin, service worker, provider adapters | Supply-chain integrity and change accountability |

### 2.2 Threat Actors

- An unauthenticated external attacker probing OAuth, links, APIs, parsers, embeds, or rate limits.
- A malicious or compromised collaborator with legitimate document access but excess curiosity or hostile intent.
- A malicious presentation, SVG, PPTX, clipboard payload, font, media file, archive, link, embed, or generated-code response.
- A compromised or misconfigured identity, cloud-storage, realtime, notification, AI, telemetry, or transcription provider.
- A malicious website, cross-window sender, framed parent, popup, redirect target, or network endpoint.
- A compromised browser extension, device, or local profile. Story reduces exposure but cannot promise isolation from a fully compromised host.
- A privileged administrator, support operator, developer, CI dependency, or deployment credential acting beyond approved purpose.
- An abusive owner, presenter, audience participant, commenter, link recipient, automated client, or tenant member.

### 2.3 Trust-Boundary Matrix

| Boundary | Untrusted input | Authority required before consequence | Failure default |
|---|---|---|---|
| Browser to OAuth/OIDC provider | Redirects, callback parameters, tokens, claims | Pinned provider config, PKCE/state/nonce binding, token validation | Reject callback; preserve local work |
| Browser to Story service | Requests, app session, operation, share/admin command | Authenticated app session plus current capability | Deny request; no partial side effect |
| Collaboration authority to durable stores | Log, snapshot, grant, audit mutation receipts | Fenced writer, conditional commit, integrity verification | Outcome lookup or failover; no acknowledgment |
| Browser to cloud provider | File IDs, metadata, bytes, permissions, redirects, URLs | Scoped provider grant plus verified provider response | Pending/offline/conflict; no implicit overwrite |
| File/clipboard/network bytes to parser | Lengths, paths, encodings, nested content, declarations | Quarantine, limits, signature/type/hash/schema/safety checks | Block, preserve inertly, or explicit fallback |
| Main application to code sandbox | Code, parameters, frame requests, returned messages | Approved sandbox profile and bounded capability protocol | Terminate sandbox; retain inert source/last safe frame |
| Main application to embed | Origin, frame content, messages, navigation, network | Approved provider/profile, sandbox, Permissions Policy, user action | Poster/link/blocked placeholder |
| Main application to capture device | Device labels, streams, tracks, permission result | User gesture, OS/browser grant, selected scope, recording state | No capture; existing accepted recording preserved |
| Main application to AI/transcription service | Prompt, selected content, media, metadata, response | Purpose-specific disclosure and consent plus minimized request | No mutation; retry/local deterministic path |
| Main application to telemetry/diagnostic sink | Event fields, stack, IDs, timings | Registered schema, purpose, preference/policy, retention | Drop event or retain bounded local diagnostics |
| Presenter/controller to audience surface | Runtime messages and rendered scene | Role/session binding, privacy-safe schema, revision barrier | Keep last coherent audience state |
| Administrator/support tool to user data | Search, recovery, audit, diagnostic access | Dedicated role, reason, approval, scope, expiry, audit | Deny and alert |

### 2.4 Threat Families

| Threat | Representative attacks | Required control family |
|---|---|---|
| Spoofing | Forged OAuth claims, actor IDs, roles, provider callbacks, postMessage sender | Cryptographic verification, session binding, server-side identity derivation |
| Tampering | Operation rewrite, snapshot/log mutation, malicious package relationships, response substitution | Hashes, signatures where applicable, schema validation, conditional writes, canonical replay |
| Repudiation | Disputed share, restore, export, admin access, recording start | Tamper-evident minimized audit and stable actor/session attribution |
| Information disclosure | Token/referrer leaks, notes to audience, AI over-sharing, telemetry content, link previews | Data classification, minimization, redaction, role-separated schemas, consent |
| Denial of service | ZIP bomb, path explosion, SVG/path complexity, sandbox loop, presence/comment flood | Pre-allocation limits, quotas, timeouts, termination, backpressure, rate limits |
| Elevation of privilege | Cached role, forwarded link, same-origin sandbox, permissive embed, tool-enabled prompt injection | Current capability checks, revocation, isolated origins, explicit capability grants |
| Supply-chain compromise | Malicious dependency, model endpoint, service worker, build artifact, provider adapter | Locked dependencies, provenance, review, signing/attestation, rapid revocation |
| Privacy abuse | Undisclosed recording, indefinite logs, shadow analytics, unbounded support access | Consent receipts, purpose limitation, retention/deletion, access review, abuse response |

### 2.5 Data Classes

| Class | Examples | Default handling |
|---|---|---|
| Public | Published presentation, public template metadata | Integrity protected; disclosure permitted only by explicit publication |
| Account | Display name, avatar, provider, organization | Minimized; mutable display data never grants authority |
| Authored confidential | Slides, notes, comments, assets, accessibility text, audience editions | Document permission and purpose bound |
| Highly sensitive | Recordings, transcripts, unpublished financial/health/legal content, private presenter state | Explicit selection/consent for external transfer; shortest retention |
| Secret | Tokens, API keys, share secrets, encryption keys, signed URLs | Never authored content; no logs/telemetry; protected storage and rotation |
| Security operational | Audit events, abuse reports, IP/risk signals where justified, incident evidence | Dedicated access, minimization, tamper evidence, bounded retention |

---

## 3. Shared Trust Contracts

### 3.1 Schemas

**`SCH-13-001 TrustDecision`** contains decision ID, policy version, boundary, action, verified actor/session, target resource, requested capabilities, data classes, purpose, consent reference, outcome (`allow`, `deny`, `review`, `degrade`), reason code, expiry, and audit reference. It contains no bearer secret or raw authored content.

**`SCH-13-002 DataHandlingRecord`** contains data category, precise fields, source, destination/processor, purpose, required/optional status, user/tenant control, residency, transit/storage protection, minimum and maximum retention, deletion route, subprocessors, and policy version.

**`SCH-13-003 UntrustedResourceDescriptor`** contains resource ID, source class, original name as untrusted display text, detected and declared media types, byte length, full content hash when available, parser profile, active-capability inventory, quarantine state, provenance, validation findings, and safe preview reference.

**`SCH-13-004 ConsentReceipt`** contains receipt ID, verified actor or authorized administrator, action, selected data categories, exact destination/provider, purpose, scope, disclosure version, granted time, expiry, revocation state, and resulting artifact/session IDs. Consent is not embedded into unrelated presentation content.

**`SCH-13-005 RetentionPolicy`** contains retention class, purpose, start event, minimum and maximum duration, aggregation/anonymization policy, legal-hold behavior, primary deletion action, backup/processor deletion window, owner, policy version, and user-visible disclosure.

**`SCH-13-006 SandboxProfile`** contains profile ID/version, origin isolation, allowed APIs, network destinations, storage/device/navigation permissions, input/output schemas, byte/node/frame limits, CPU/wall-clock/memory budgets, deterministic clock/random policy, termination behavior, and output type.

**`SCH-13-007 ExternalTransferIntent`** contains transfer ID, verified actor, source revision and stable addresses, minimized payload manifest, destination, processor/model/profile, purpose, consent/policy basis, retention policy, encryption requirements, idempotency key, and current transfer state.

**`SCH-13-008 SecurityAuditEvent`** contains immutable event ID, event kind, server time, verified actor/system principal, resource pseudonym, action/result, reason/policy version, correlation ID, prior-event digest or equivalent tamper-evidence field, retention class, and redaction version.

**`SCH-13-009 DeletionJob`** contains job ID, requester/authority, subject/resource scope, target stores/processors/backups, legal-hold exclusions, requested time, per-target state, retry state, completion/exception receipts, and final user-visible result.

**`SCH-13-010 AIProvenance`** contains provider/model/service profile, request policy version, prompt-template identity/hash, selected context addresses and semantic hash, response hash, safety/schema dispositions, human review action, resulting transaction ID, and retention/training policy. Raw secret keys are excluded; raw prompt/response retention is profile-controlled.

### 3.2 Invariants

| ID | Invariant |
|---|---|
| `INV-13-001` | No client-controlled display field, document field, URL parameter, provider path, or cached role grants authority. |
| `INV-13-002` | Authentication, authorization, consent, and content trust are separate decisions. Passing one never implies the others. |
| `INV-13-003` | Every external transfer has an exact purpose, minimized payload, destination, policy/consent basis, and retention class before send. |
| `INV-13-004` | Tokens, API keys, passwords, share secrets, encryption keys, signed URLs, and raw authorization codes never enter canonical content, collaboration payloads, telemetry, logs, or user-visible recovery artifacts. |
| `INV-13-005` | Transport encryption, provider ownership, filename, extension, and declared media type never replace content validation. |
| `INV-13-006` | Preserved active or unknown content remains inert until a separately authorized and supported action admits execution. |
| `INV-13-007` | Sanitized content is the only representation eligible for active render; original untrusted bytes remain quarantined or inert preservation data. |
| `INV-13-008` | Sandbox code cannot reach the application origin, DOM, credentials, provider SDKs, storage, devices, navigation, or network except through declared profile capabilities. |
| `INV-13-009` | Presenter-private content is absent from audience messages, DOM/accessibility tree, pixels, recording, export, and telemetry unless explicitly authored/published for that destination. |
| `INV-13-010` | AI and generated-code output is untrusted proposal data until validated and explicitly committed through the canonical transaction boundary. |
| `INV-13-011` | Optional analytics cannot become a condition for local authoring, save/open, presentation, export, accessibility, or recovery. |
| `INV-13-012` | Retention has a declared maximum; absent policy is not permission for indefinite retention. |
| `INV-13-013` | Deletion reports distinguish requested, blocked by declared hold, deleted from active stores, pending processor/backup expiry, and complete. |
| `INV-13-014` | Audit and abuse systems minimize content and identities while retaining enough integrity and attribution to investigate authorized events. |
| `INV-13-015` | Security failure denies the unsafe consequence while preserving acknowledged content and policy-compliant local recovery wherever possible. |
| `INV-13-016` | Changing a security policy or sandbox/parser profile invalidates evidence and readiness produced under incompatible prior policy. |
| `INV-13-017` | A revoked grant or secret cannot be restored from a stale cache, offline queue, provider metadata, or old browser tab. |
| `INV-13-018` | No error, telemetry, notification, compatibility report, or audit record echoes more untrusted or sensitive input than its bounded schema permits. |

### 3.3 Trust-Disposition State Machine

**`SM-13-001 Untrusted resource disposition`**

```text
received -> quarantined -> validating -> admitted-inert
                                |         -> admitted-active
                                |         -> review-required
                                |         -> blocked
                                -> failed

admitted-* -> revoked -> blocked-or-purged
review-required -> admitted-inert | admitted-active | blocked
```

`admitted-active` requires an execution-capable feature, an approved profile, and current policy; ordinary files and preserved package parts normally end at `admitted-inert`. A policy change can move any admitted resource to `review-required` or `revoked` without deleting its original preservation bytes.

### 3.4 Consent State Machine

**`SM-13-002 Consent lifecycle`**

| State | Meaning | Valid next states |
|---|---|---|
| `absent` | No applicable receipt exists. | `prompted`, `not-required-by-policy` |
| `prompted` | Exact action, data, destination, purpose, and retention are visible. | `granted`, `denied`, `canceled` |
| `granted` | Receipt is valid for its bounded scope. | `used`, `revoked`, `expired` |
| `used` | The declared action consumed the receipt as configured. | `granted` for reusable scope, `expired`, `revoked` |
| `denied` | Transfer/capture does not occur. | `prompted` after a new user action |
| `revoked` | Future covered actions are denied. | `prompted` with a new receipt |
| `expired` | Time, policy, provider, or scope changed. | `prompted` |
| `canceled` | No decision or side effect occurred. | `prompted` |

### 3.5 External-Transfer State Machine

**`SM-13-003 External transfer`**

```text
planned -> disclosed -> authorized -> sending -> committed
   |          |             |            |-> outcome-unknown -> committed | failed
   |          |             |            -> failed
   |          |             -> canceled
   |          -> denied
   -> canceled
```

No content bytes leave Story before `authorized`. An ambiguous mutating provider response is `outcome-unknown`, not automatically failed or retried with a new identity.

### 3.6 Deletion State Machine

**`SM-13-004 Deletion lifecycle`**

```text
requested -> verified -> active-store-deleting -> processor-deleting
                  |                 |                    |
                  -> held           -> partial           -> backup-expiry-pending
                                                        -> complete
```

`held` identifies exact scope, authority, and review date. `partial` exposes failed targets and retry. `complete` requires target receipts or policy-defined proof; it does not claim recall of legitimate prior recipient copies.

### 3.7 Incident State Machine

**`SM-13-005 Security incident`**

```text
detected -> triaged -> contained -> investigating -> eradicated -> recovering -> closed
               |          |             |               |
               -> false-positive        -> monitoring    -> re-contained
```

Closure requires scope, root cause, affected data/tenants, containment, recovery, notification decision, evidence, and follow-up owners. Evidence remains access-controlled and immutable.

### 3.8 Governing Flows

**`FLOW-13-001 Trust decision`**

1. Identify boundary, requested action, resource, actor/session, data classes, and destination.
2. Apply cheap size, shape, protocol, and capability checks before allocation or transfer.
3. Resolve current policy, permission, consent, provider, parser/sandbox, retention, and residency profiles.
4. Validate identity, integrity, schema, provenance, and safety at the boundary that can enforce them.
5. Produce one `TrustDecision` with allow, deny, review, or degrade disposition.
6. Execute only the granted consequence and emit a minimized audit/security event where required.
7. On policy, grant, content, or provider change, invalidate the decision and re-evaluate before reuse.

**`FLOW-13-002 Untrusted content admission`**

1. Stream bytes into quarantine with a bounded total and cancellation.
2. Compute content identity and detect type independently from declaration.
3. Enumerate nested structure and active capabilities without executing or fetching external targets.
4. Apply parser-specific depth, count, ratio, time, memory, and recursion limits.
5. Sanitize or semantically parse into a safe canonical representation.
6. Revalidate the produced representation and record every removal, quarantine, fallback, and preservation-only item.
7. Admit inert or active content only under the current profile; retain original bytes according to preservation and retention policy.

**`FLOW-13-003 External transfer and consent`**

1. Build an `ExternalTransferIntent` from exact selected source addresses.
2. Remove fields not required for the named purpose.
3. Show destination, provider/model, data categories, purpose, retention/training, and cancel behavior.
4. Resolve consent or policy authority and record the receipt.
5. Send with scoped credentials, idempotency, timeout, and cancellation.
6. Validate response type, size, schema, provenance, and safety before preview.
7. Expose retry, discard, or local fallback on failure; no document mutation occurs until a separate accepted commit.

**`FLOW-13-004 Deletion request`**

1. Authenticate the requester and verify scope/authority without requiring unnecessary content disclosure.
2. Enumerate active stores, collaboration/audit records, provider objects, processors, caches, and backups covered by policy.
3. Check legal/contractual holds and show exact exclusions.
4. Revoke active access and stop new processing where applicable.
5. Delete or cryptographically erase active data, then send idempotent processor/provider requests.
6. Record target receipts, retries, backup-expiry state, and irreversible limitations.
7. Return a truthful final status and retain only the minimized deletion proof required by policy.

**`FLOW-13-005 Incident response`**

1. Detect and classify the event without logging secrets or unnecessary content.
2. Contain affected tokens, sessions, links, providers, sandboxes, imports, builds, or deployments.
3. Preserve tamper-evident evidence under dedicated access and legal policy.
4. Determine affected resources, actors, processors, time range, and data classes.
5. Eradicate root cause, rotate credentials, repair state, and validate clean recovery.
6. Decide and execute user, tenant, provider, regulator, or public notification obligations.
7. Close only after residual risk, evidence, retrospective, and preventive owners are recorded.

---

## 4. OAuth, Identity, Tokens, and Local Secrets

| ID | Parent capability | Atomic normative statement | Applies to | Acceptance |
|---|---|---|---|---|
| `REQ-13-001` | [PRE-062](../product-spec.md#67-review-and-collaboration) | Browser OAuth authorization **MUST** use authorization-code flow with PKCE S256. | Sign-in, reauthentication, account linking | `AC-13-001` |
| `REQ-13-002` | [PRE-062](../product-spec.md#67-review-and-collaboration) | Each OAuth callback **MUST** bind cryptographic state and OIDC nonce to the initiating browser session and intended action. | Redirect and popup callbacks | `AC-13-002` |
| `REQ-13-003` | [PRE-062](../product-spec.md#67-review-and-collaboration) | OAuth redirect URIs **MUST** match an exact approved origin and path before callback processing. | Provider configuration and callback | `AC-13-003` |
| `REQ-13-004` | [PRE-062](../product-spec.md#67-review-and-collaboration) | An ID token used for authority **MUST** pass signature, algorithm, key, issuer, audience/authorized-party, time, nonce, and tenant-policy validation. | Story service, collaboration, linking | `AC-13-004` |
| `REQ-13-005` | [PRE-062](../product-spec.md#67-review-and-collaboration) | Story principal identity **MUST** be keyed by canonical issuer and subject. | Grants, ownership, audit, linking | `AC-13-005` |
| `REQ-13-006` | [ARC-030](../product-spec.md#74-storage-and-recovery) | An OAuth access token **MUST** be sent only to its intended audience/resource server for an allowed scope. | Cloud, identity, collaboration APIs | `AC-13-006` |
| `REQ-13-007` | [ARC-030](../product-spec.md#74-storage-and-recovery) | Provider scopes **MUST** be requested incrementally at the first user action that needs the bounded capability. | Sign-in, cloud open/save/share | `AC-13-007` |
| `REQ-13-008` | [ARC-001](../product-spec.md#71-canonical-document-model) | Bearer tokens and authorization codes **MUST NOT** enter documents, collaboration messages, URLs after callback cleanup, logs, telemetry, notifications, or recovery payloads. | Every auth and data boundary | `AC-13-008` |
| `REQ-13-009` | [ARC-030](../product-spec.md#74-storage-and-recovery) | Raw long-lived bearer credentials **MUST NOT** be stored in script-readable persistent browser storage. | Refresh tokens, provider API keys, service credentials | `AC-13-009` |
| `REQ-13-010` | [ARC-031](../product-spec.md#74-storage-and-recovery) | Token refresh **MUST** preserve provider rotation and reuse-detection semantics and terminate the affected session on replay evidence. | Silent refresh and session restoration | `AC-13-010` |
| `REQ-13-011` | [PRE-061](../product-spec.md#67-review-and-collaboration) | A Story app session **MUST** be short-lived, document/capability scoped where applicable, revocable, and free of provider access tokens. | Collaboration, sharing, admin, runtime remote | `AC-13-011` |
| `REQ-13-012` | [ARC-031](../product-spec.md#74-storage-and-recovery) | Sign-out **MUST** invalidate Story sessions and clear locally held secrets across active same-profile clients. | User sign-out, forced sign-out, provider revoke | `AC-13-012` |
| `REQ-13-013` | [PRE-062](../product-spec.md#67-review-and-collaboration) | Account linking **MUST** require fresh proof of control of both principals without using email equality as proof. | Link and unlink identities | `AC-13-013` |
| `REQ-13-014` | [ARC-030](../product-spec.md#74-storage-and-recovery) | Public identity claims **MUST NOT** be the sole secret material for encryption-key derivation. | Preferences, local secrets, protected caches | `AC-13-014` |
| `REQ-13-015` | [ARC-030](../product-spec.md#74-storage-and-recovery) | Persistent local secret encryption **MUST** use authenticated encryption with unique nonces and a non-exportable platform-, server-, or user-secret-backed key. | Tokens, provider keys, protected preferences | `AC-13-015` |
| `REQ-13-016` | [ARC-031](../product-spec.md#74-storage-and-recovery) | Authentication failure **MUST** deny new privileged actions while preserving acknowledged state and policy-compliant local recovery. | Expiry, provider outage, revoked consent, invalid callback | `AC-13-016` |

---

## 5. Files, Providers, Collaboration, and Sharing

| ID | Parent capability | Atomic normative statement | Applies to | Acceptance |
|---|---|---|---|---|
| `REQ-13-017` | [ARC-030](../product-spec.md#74-storage-and-recovery) | File bytes **MUST** remain untrusted regardless of extension, provider, owner, transport, prior open, or signature claim until current admission succeeds. | Local, cloud, shared, clipboard, recovery files | `AC-13-017` |
| `REQ-13-018` | [ARC-030](../product-spec.md#74-storage-and-recovery) | Mutable file admission **MUST** wait for applicable signature, size, path, hash, schema, reference, and security-policy validation. | `.str`, import, recovery, provider download | `AC-13-018` |
| `REQ-13-019` | [ARC-031](../product-spec.md#74-storage-and-recovery) | Each provider adapter **MUST** publish and enforce a verified capability profile rather than infer guarantees from API names. | Cloud storage, identity, sharing, realtime, AI | `AC-13-019` |
| `REQ-13-020` | [ARC-030](../product-spec.md#74-storage-and-recovery) | Provider credentials **MUST** remain isolated by provider, resource audience, tenant, account, and capability scope. | Multi-provider and multi-account sessions | `AC-13-020` |
| `REQ-13-021` | [ARC-001](../product-spec.md#71-canonical-document-model) | Signed provider URLs **MUST** remain ephemeral protected runtime references outside canonical content and user-shareable diagnostics. | Download, upload, media streaming, thumbnails | `AC-13-021` |
| `REQ-13-022` | [ARC-031](../product-spec.md#74-storage-and-recovery) | An ambiguous provider mutation **MUST** be resolved by stable request identity and authoritative readback before retry. | Save, share, revoke, delete, upload, AI job | `AC-13-022` |
| `REQ-13-023` | [ARC-030](../product-spec.md#74-storage-and-recovery) | Server-side remote fetch **MUST** enforce scheme, destination, DNS/IP, redirect, credential, size, and timeout policy against SSRF and exfiltration. | Linked assets, previews, embeds, imports, web output | `AC-13-023` |
| `REQ-13-024` | [PRE-061](../product-spec.md#67-review-and-collaboration) | Every collaboration consequence **MUST** derive actor and capability from a validated current service session. | Operation, comment, asset, presence, share/admin | `AC-13-024` |
| `REQ-13-025` | [ARC-012](../product-spec.md#72-transactions-history-and-collaboration) | Collaboration admission **MUST** validate schema, size, epoch, sequence/base, idempotency, replay, target, and permission before expensive application. | Realtime and reconnect requests | `AC-13-025` |
| `REQ-13-026` | [PRE-061](../product-spec.md#67-review-and-collaboration) | Presence payloads **MUST** exclude secrets, email by default, provider locators, notes, clipboard content, and presenter-private state. | Cursor, selection, status, collaborator list | `AC-13-026` |
| `REQ-13-027` | [PRE-062](../product-spec.md#67-review-and-collaboration) | Share-link authority **MUST** use a high-entropy revocable server-side grant with a non-recoverable verifier where verification permits. | View, comment, edit, present links | `AC-13-027` |
| `REQ-13-028` | [PRE-062](../product-spec.md#67-review-and-collaboration) | Share secrets **MUST NOT** appear in logs, analytics, referrers, third-party previews, page titles, screenshots, or notification bodies. | Link creation, resolution, copy, email, QR | `AC-13-028` |
| `REQ-13-029` | [PRE-062](../product-spec.md#67-review-and-collaboration) | Share-link resolution **MUST** reveal no document metadata before grant validity and access policy pass. | Invalid, expired, revoked, unauthenticated links | `AC-13-029` |
| `REQ-13-030` | [PRE-062](../product-spec.md#67-review-and-collaboration) | Grant revocation **MUST** invalidate new privileged requests and active Story sessions under the Volume 07 revocation objective. | Direct, group, organization, link grants | `AC-13-030` |
| `REQ-13-031` | [PRE-062](../product-spec.md#67-review-and-collaboration) | Provider-native permissions **MUST** map explicitly to Story capabilities and deny privilege when current mapping cannot be verified. | OneDrive, Google Drive, future providers | `AC-13-031` |
| `REQ-13-032` | [PRE-060](../product-spec.md#67-review-and-collaboration) | Comment text and attachments **MUST** pass bounded rich-text, URL, file, mention, and notification-safety validation before durable acceptance. | Comments, replies, edits, mentions | `AC-13-032` |

---

## 6. Imports, SVG, Clipboard, and PPTX

| ID | Parent capability | Atomic normative statement | Applies to | Acceptance |
|---|---|---|---|---|
| `REQ-13-033` | [PRE-073](../product-spec.md#68-import-export-print-and-compatibility) | Imported and clipboard bytes **MUST** enter quarantine before parser, decoder, preview, or canonical registration. | `.str`, PPTX, SVG, HTML, images, media, fonts | `AC-13-033` |
| `REQ-13-034` | [PRE-070](../product-spec.md#68-import-export-print-and-compatibility) | Archive admission **MUST** enforce compressed/expanded byte, entry-count, ratio, nesting, path-depth, and processing-time limits before full expansion. | `.str`, PPTX/OPC, embedded archives | `AC-13-034` |
| `REQ-13-035` | [PRE-070](../product-spec.md#68-import-export-print-and-compatibility) | Package paths **MUST** reject absolute, traversal, device, alternate-stream, malformed, duplicate, and normalization-colliding forms. | ZIP/OPC/native package entries | `AC-13-035` |
| `REQ-13-036` | [PRE-070](../product-spec.md#68-import-export-print-and-compatibility) | XML parsing **MUST** disable DTDs, external entities, external schemas, and parser-driven network access. | SVG, PPTX/OOXML, metadata XML | `AC-13-036` |
| `REQ-13-037` | [ARC-030](../product-spec.md#74-storage-and-recovery) | Asset type decisions **MUST** use detected signatures and bounded decoding rather than filename extension or declared MIME alone. | Images, audio, video, fonts, archives, SVG | `AC-13-037` |
| `REQ-13-038` | [ARC-030](../product-spec.md#74-storage-and-recovery) | Untrusted parsers and decoders **MUST** run with bounded memory, CPU/time, recursion, allocation, and cancellation. | File, media, font, image, SVG, PPTX parsing | `AC-13-038` |
| `REQ-13-039` | [DES-073](../product-spec.md#58-layers-clipboard-and-interoperability) | SVG active rendering **MUST** use an element, attribute, URL, and CSS allowlist that removes scripts, event handlers, `foreignObject`, frames/objects, and external execution. | SVG import, clipboard, render, export preview | `AC-13-039` |
| `REQ-13-040` | [DES-073](../product-spec.md#58-layers-clipboard-and-interoperability) | SVG reference resolution **MUST** remain inside the admitted SVG resource graph and reject external, cyclic, or escaping references. | `href`, `use`, paint servers, masks, clips, filters | `AC-13-040` |
| `REQ-13-041` | [DES-072](../product-spec.md#58-layers-clipboard-and-interoperability) | Sanitized SVG **MUST** be reparsed and revalidated before its safe representation is stored or rendered. | Import and clipboard admission | `AC-13-041` |
| `REQ-13-042` | [DES-073](../product-spec.md#58-layers-clipboard-and-interoperability) | SVG admission **MUST** enforce byte, node, path-command, nesting, reference, filter, and rendering-cost limits. | Hostile and high-complexity SVG | `AC-13-042` |
| `REQ-13-043` | [DES-071](../product-spec.md#58-layers-clipboard-and-interoperability) | Clipboard HTML **MUST** be parsed into an allowlisted semantic representation without script, event, active style, automatic fetch, or privileged URL behavior. | Paste and drag/drop HTML | `AC-13-043` |
| `REQ-13-044` | [PRE-070](../product-spec.md#68-import-export-print-and-compatibility) | PPTX macros, OLE/ActiveX, controls, executable packages, and suspicious binaries **MUST** remain quarantined and non-executable during import, preview, edit, and export. | PPTM/PPTX/OPC intake and round trip | `AC-13-044` |
| `REQ-13-045` | [PRE-070](../product-spec.md#68-import-export-print-and-compatibility) | PPTX external relationships **MUST** remain inert reviewed metadata until an authorized action resolves an allowed destination. | Links, data, media, templates, workbooks | `AC-13-045` |
| `REQ-13-046` | [PRE-070](../product-spec.md#68-import-export-print-and-compatibility) | Package passwords, decryption keys, and rights tokens **MUST** remain transient secrets outside files, logs, telemetry, and retained plaintext caches. | Encrypted and rights-managed packages | `AC-13-046` |
| `REQ-13-047` | [PRE-070](../product-spec.md#68-import-export-print-and-compatibility) | Digital-signature trust **MUST** report verified, invalid, unknown, expired/revoked, modified-after-signing, and unsupported states without treating signature presence as content safety. | Signed files and packages | `AC-13-047` |
| `REQ-13-048` | [PRE-073](../product-spec.md#68-import-export-print-and-compatibility) | Preserved unknown or active package parts **MUST** retain an inert security classification through every supported round trip. | Preservation envelopes and compatibility reports | `AC-13-048` |

---

## 7. Code Fills, Embeds, External Resources, and Links

| ID | Parent capability | Atomic normative statement | Applies to | Acceptance |
|---|---|---|---|---|
| `REQ-13-049` | [DES-061](../product-spec.md#57-paint-effects-and-media) | Executable code fills **MUST** run only under an approved active-content policy and current sandbox profile. | Editor preview, presentation, recording, web output | `AC-13-049` |
| `REQ-13-050` | [DES-061](../product-spec.md#57-paint-effects-and-media) | Code-fill execution **MUST** use an opaque-origin isolation boundary without application-origin privileges. | User, imported, template, and AI-generated code | `AC-13-050` |
| `REQ-13-051` | [DES-061](../product-spec.md#57-paint-effects-and-media) | A code sandbox **MUST** deny DOM, top/parent, storage, credentials, provider SDK, device, navigation, and network capabilities unless individually granted by profile. | Sandbox global environment | `AC-13-051` |
| `REQ-13-052` | [ARC-020](../product-spec.md#73-rendering-and-fidelity) | Sandbox communication **MUST** use versioned allowlisted message schemas with source/session binding and bounded structured-clone payloads. | Main/sandbox requests and results | `AC-13-052` |
| `REQ-13-053` | [ARC-022](../product-spec.md#73-rendering-and-fidelity) | Code execution **MUST** terminate when CPU, wall-clock, memory, allocation, recursion, message, or frame budgets exceed its profile. | Preview, runtime, export, recording | `AC-13-053` |
| `REQ-13-054` | [PRE-033](../product-spec.md#64-transitions-and-object-animation) | Deterministic code-render profiles **MUST** bind logical time, seed, input, dimensions, and dependency versions. | Replay, recording, video, thumbnails, export | `AC-13-054` |
| `REQ-13-055` | [DES-061](../product-spec.md#57-paint-effects-and-media) | Sandbox output **MUST** be inert pixels or a validated declarative drawing result rather than executable markup or code. | Code-fill render handoff | `AC-13-055` |
| `REQ-13-056` | [ARC-022](../product-spec.md#73-rendering-and-fidelity) | Sandbox failures **MUST** expose bounded author-safe diagnostics without secrets, application internals, or untrusted code echo. | Editor, runtime, export failure | `AC-13-056` |
| `REQ-13-057` | [DES-061](../product-spec.md#57-paint-effects-and-media) | Generated, imported, shared, and template code **MUST** receive the same sandbox and trust treatment as manually authored code. | All code provenance | `AC-13-057` |
| `REQ-13-058` | [PRE-023](../product-spec.md#63-presentation-content-primitives) | An embed **MUST** identify an approved provider/origin, requested capabilities, transferred data, privacy policy, and fallback before activation. | Authoring, audience, presenter, web output | `AC-13-058` |
| `REQ-13-059` | [PRE-023](../product-spec.md#63-presentation-content-primitives) | Embed frames **MUST** receive the minimum sandbox and Permissions Policy capabilities for their declared function. | Web media and interactive embeds | `AC-13-059` |
| `REQ-13-060` | [PRE-023](../product-spec.md#63-presentation-content-primitives) | Embed and cross-window messages **MUST** validate origin, source window/channel, session/revision, type, schema, size, replay, and role before state change. | Editor, audience, presenter, recorder, embeds | `AC-13-060` |
| `REQ-13-061` | [ARC-030](../product-spec.md#74-storage-and-recovery) | External resource requests **MUST** omit ambient credentials and minimize referrer information unless a reviewed provider contract requires otherwise. | Images, media, fonts, previews, embeds | `AC-13-061` |
| `REQ-13-062` | [PRE-051](../product-spec.md#66-slide-show-and-audience-runtime) | External navigation **MUST** require a user activation and an allowlisted scheme with visible destination context. | Links, actions, embeds, generated content | `AC-13-062` |
| `REQ-13-063` | [ARC-021](../product-spec.md#73-rendering-and-fidelity) | Code and embed surfaces **MUST** provide an explicit inert poster, static render, link, preserved-only, or blocked fallback for offline and unsupported outputs. | Editor, presentation, print, PDF, video, web | `AC-13-063` |

---

## 8. Recording, Devices, Captions, and Transcription

| ID | Parent capability | Atomic normative statement | Applies to | Acceptance |
|---|---|---|---|---|
| `REQ-13-064` | [PRE-042](../product-spec.md#65-notes-rehearsal-recording-and-presenter-tools) | Capture-device permission **MUST** be requested from a user gesture only when the selected recording action needs that device. | Microphone, camera, screen/window/tab capture | `AC-13-064` |
| `REQ-13-065` | [PRE-042](../product-spec.md#65-notes-rehearsal-recording-and-presenter-tools) | Recording preflight **MUST** identify selected devices/tracks, captured surface, recipients/outputs, external processors, and retention before start. | Recording setup and retake | `AC-13-065` |
| `REQ-13-066` | [PRE-042](../product-spec.md#65-notes-rehearsal-recording-and-presenter-tools) | Active capture **MUST** maintain a persistent perceivable indicator naming the recording tracks and stop control. | Editor, Presenter View, recorder controller | `AC-13-066` |
| `REQ-13-067` | [PRE-042](../product-spec.md#65-notes-rehearsal-recording-and-presenter-tools) | Media capture **MUST** begin only after the explicit recording-start transition. | Initial record and slide retake | `AC-13-067` |
| `REQ-13-068` | [PRE-042](../product-spec.md#65-notes-rehearsal-recording-and-presenter-tools) | Stop, cancel, device loss, revocation, and fatal error **MUST** end affected live tracks and close their handles promptly. | Recording lifecycle | `AC-13-068` |
| `REQ-13-069` | [PRE-043](../product-spec.md#65-notes-rehearsal-recording-and-presenter-tools) | Screen capture **MUST** exclude or explicitly warn before including notes, diagnostics, notifications, other windows, or private presenter regions. | Display/window/tab recording | `AC-13-069` |
| `REQ-13-070` | [PRE-053](../product-spec.md#66-slide-show-and-audience-runtime) | Remote participant audio, video, identity, or live-caption capture **MUST** follow a distinct participant disclosure and consent policy. | Shared viewing, Q&A, remote recording | `AC-13-070` |
| `REQ-13-071` | [ARC-030](../product-spec.md#74-storage-and-recovery) | Provisional recording chunks **MUST** use protected storage, integrity metadata, bounded retention, and crash-safe identity before author acceptance. | Local and cloud recording staging | `AC-13-071` |
| `REQ-13-072` | [PRE-042](../product-spec.md#65-notes-rehearsal-recording-and-presenter-tools) | Accepting a recording **MUST** be an explicit reviewed canonical transaction that names selected tracks and slide scope. | Recording review and retake | `AC-13-072` |
| `REQ-13-073` | [PRE-042](../product-spec.md#65-notes-rehearsal-recording-and-presenter-tools) | A failed or canceled retake **MUST NOT** replace the previously accepted recording. | Per-slide and track retake | `AC-13-073` |
| `REQ-13-074` | [PRE-042](../product-spec.md#65-notes-rehearsal-recording-and-presenter-tools) | External captioning or transcription **MUST** use a separate transfer intent that discloses audio/text fields, provider, purpose, language, and retention. | Live and prerecorded captions/transcripts | `AC-13-074` |
| `REQ-13-075` | [ARC-031](../product-spec.md#74-storage-and-recovery) | Recording deletion **MUST** enumerate accepted media, provisional chunks, derived captions/transcripts, provider copies, exports, and backup-expiry state. | Delete track, slide recording, presentation, account | `AC-13-075` |

---

## 9. AI Requests, Outputs, and Generated Code

| ID | Parent capability | Atomic normative statement | Applies to | Acceptance |
|---|---|---|---|---|
| `REQ-13-076` | [ARC-010](../product-spec.md#72-transactions-history-and-collaboration) | AI services **MUST** remain optional to opening, editing, preserving, presenting, recovering, and exporting authored content. | All deterministic core workflows | `AC-13-076` |
| `REQ-13-077` | [ARC-030](../product-spec.md#74-storage-and-recovery) | Each AI action **MUST** disclose destination, selected data categories, purpose, provider/model profile, retention/training policy, and cancel behavior before transfer. | Rewrite, translate, layout, generation, summarization | `AC-13-077` |
| `REQ-13-078` | [ARC-030](../product-spec.md#74-storage-and-recovery) | AI request context **MUST** be minimized to the exact selected semantic scope required for the action. | Text, slide, selection, presentation, data context | `AC-13-078` |
| `REQ-13-079` | [PRE-043](../product-spec.md#65-notes-rehearsal-recording-and-presenter-tools) | Notes, comments, recordings, presenter diagnostics, identities, hidden content, and unrelated slides **MUST** be excluded from AI context by default. | Every AI request builder | `AC-13-079` |
| `REQ-13-080` | [ARC-030](../product-spec.md#74-storage-and-recovery) | Production AI credentials **MUST** use a protected broker, platform secret store, or equivalent non-script-readable boundary. | Hosted and enterprise provider access | `AC-13-080` |
| `REQ-13-081` | [ARC-030](../product-spec.md#74-storage-and-recovery) | Configurable AI endpoints **MUST** pass HTTPS, origin/destination, redirect, credential, residency, and tenant-policy validation. | Azure, OpenAI, Anthropic, local/custom providers | `AC-13-081` |
| `REQ-13-082` | [ARC-010](../product-spec.md#72-transactions-history-and-collaboration) | Document and model text **MUST NOT** alter system policy, permissions, tool grants, destination, or consent scope through prompt instructions. | Prompt assembly and agent/tool execution | `AC-13-082` |
| `REQ-13-083` | [ARC-010](../product-spec.md#72-transactions-history-and-collaboration) | An AI tool call with external or destructive consequence **MUST** pass the same capability check and explicit confirmation as the equivalent direct command. | Network, file, share, delete, publish, record tools | `AC-13-083` |
| `REQ-13-084` | [ARC-002](../product-spec.md#71-canonical-document-model) | AI responses **MUST** be treated as untrusted bounded input and validated against the requested schema and content policy. | Text, JSON, layout, media, code responses | `AC-13-084` |
| `REQ-13-085` | [DES-033](../product-spec.md#54-text-and-typography) | AI-proposed content changes **MUST** show a reviewable exact preview or diff before document commit. | Rewrite, translation, layout, slide generation | `AC-13-085` |
| `REQ-13-086` | [ARC-010](../product-spec.md#72-transactions-history-and-collaboration) | Accepting AI output **MUST** create one authorized canonical transaction with ordinary undo, collaboration, save, and audit semantics. | All AI-authored mutations | `AC-13-086` |
| `REQ-13-087` | [ARC-002](../product-spec.md#71-canonical-document-model) | Accepted AI-assisted output **MUST** retain bounded `AIProvenance` sufficient to explain source scope, service profile, validation, and human decision. | Authored AI output and audits | `AC-13-087` |
| `REQ-13-088` | [DES-061](../product-spec.md#57-paint-effects-and-media) | AI-generated code **MUST** remain inert until admitted under the same code-fill sandbox policy as any other untrusted code. | Backgrounds, automation snippets, embeds | `AC-13-088` |
| `REQ-13-089` | [ARC-030](../product-spec.md#74-storage-and-recovery) | AI provider use for model training or payload retention beyond request delivery **MUST** be disabled by default or require an explicit approved profile and consent. | Consumer, enterprise, and custom AI providers | `AC-13-089` |
| `REQ-13-090` | [ARC-031](../product-spec.md#74-storage-and-recovery) | AI cancellation, timeout, refusal, unsafe response, or provider failure **MUST** leave the canonical document unchanged. | Every AI operation lifecycle | `AC-13-090` |

---

## 10. Privacy, Telemetry, Retention, and Deletion

| ID | Parent capability | Atomic normative statement | Applies to | Acceptance |
|---|---|---|---|---|
| `REQ-13-091` | [ARC-030](../product-spec.md#74-storage-and-recovery) | Every production data flow **MUST** have a current `DataHandlingRecord` before collecting, transferring, retaining, or processing user data. | Providers, collaboration, AI, recording, telemetry, support | `AC-13-091` |
| `REQ-13-092` | [ARC-022](../product-spec.md#73-rendering-and-fidelity) | Telemetry emission **MUST** use a registered event and field allowlist that drops unknown types and fields. | Product analytics, performance, crash, security events | `AC-13-092` |
| `REQ-13-093` | [ARC-022](../product-spec.md#73-rendering-and-fidelity) | Telemetry **MUST NOT** contain slide text, notes, comments, recordings, captions, prompts, secrets, provider URLs, share links, or raw stable document/entity/user IDs by default. | Client and service telemetry | `AC-13-093` |
| `REQ-13-094` | [ARC-022](../product-spec.md#73-rendering-and-fidelity) | Analytics identifiers **MUST** be purpose-bounded, pseudonymous, rotating, and unlinkable to document identity without separately authorized data. | Session, device, tenant, experiment identifiers | `AC-13-094` |
| `REQ-13-095` | [ARC-022](../product-spec.md#73-rendering-and-fidelity) | Optional analytics **MUST** respect the applicable user/tenant choice and recognized DNT or Global Privacy Control signal. | Remote product analytics and experiments | `AC-13-095` |
| `REQ-13-096` | [ARC-031](../product-spec.md#74-storage-and-recovery) | Necessary security and reliability diagnostics **MUST** remain separately classified from optional product analytics with their own purpose and retention. | Abuse, incident, integrity, crash, availability | `AC-13-096` |
| `REQ-13-097` | [ARC-022](../product-spec.md#73-rendering-and-fidelity) | Error and crash reporting **MUST** sanitize messages, stacks, URLs, request bodies, local paths, content values, and secrets before persistence or transfer. | Client and service diagnostics | `AC-13-097` |
| `REQ-13-098` | [ARC-022](../product-spec.md#73-rendering-and-fidelity) | Telemetry sink failure **MUST NOT** block or alter core authoring, presentation, save, export, or recovery outcomes. | Offline, blocked, slow, or unavailable sinks | `AC-13-098` |
| `REQ-13-099` | [ARC-030](../product-spec.md#74-storage-and-recovery) | Every retained data class **MUST** have an enforced maximum retention and a defined start event under `SCH-13-005`. | Client, Story service, provider, processor, backups | `AC-13-099` |
| `REQ-13-100` | [ARC-031](../product-spec.md#74-storage-and-recovery) | User- or administrator-authorized deletion **MUST** target every active Story store and contracted processor in scope. | Document, account, recording, AI, telemetry, audit subject data | `AC-13-100` |
| `REQ-13-101` | [PRE-062](../product-spec.md#67-review-and-collaboration) | A legal or contractual hold **MUST** expose its exact retained scope, authority, owner, review trigger, and effect on deletion to authorized users. | Audit, collaboration history, abuse, incident evidence | `AC-13-101` |
| `REQ-13-102` | [ARC-031](../product-spec.md#74-storage-and-recovery) | Deletion status **MUST** use `SM-13-004` and provide per-target receipts or explicit exceptions. | User-facing deletion and operations | `AC-13-102` |
| `REQ-13-103` | [ARC-031](../product-spec.md#74-storage-and-recovery) | Deleted data in backups **MUST** be inaccessible to ordinary product use and expire under the published backup-deletion window. | Service and processor backups | `AC-13-103` |
| `REQ-13-104` | [ARC-030](../product-spec.md#74-storage-and-recovery) | A user privacy export **MUST** provide authorized held data and processing metadata in a documented machine-readable form without exposing other principals. | Account/data access request | `AC-13-104` |
| `REQ-13-105` | [PRE-060](../product-spec.md#67-review-and-collaboration) | Notifications **MUST** minimize document content, identity, link secrets, and private metadata for the destination and lock-screen context. | Email, push, browser, collaboration notifications | `AC-13-105` |

---

## 11. Audit, Administration, Abuse, and Incident Response

| ID | Parent capability | Atomic normative statement | Applies to | Acceptance |
|---|---|---|---|---|
| `REQ-13-106` | [PRE-062](../product-spec.md#67-review-and-collaboration) | Security-relevant authentication, grant, share, revoke, export-policy, restore, deletion, admin, moderation, and incident actions **MUST** emit a typed audit event. | Story services and privileged clients | `AC-13-106` |
| `REQ-13-107` | [ARC-031](../product-spec.md#74-storage-and-recovery) | Security audit records **MUST** be append-only or equivalently tamper-evident with detectable gap and alteration semantics. | Audit storage, export, investigation | `AC-13-107` |
| `REQ-13-108` | [ARC-001](../product-spec.md#71-canonical-document-model) | Audit records **MUST** exclude bearer secrets and minimize authored content to stable pseudonymous references and reason codes. | Every audit event and export | `AC-13-108` |
| `REQ-13-109` | [PRE-062](../product-spec.md#67-review-and-collaboration) | Audit access **MUST** require a dedicated current capability and field-level privacy policy. | Owner, tenant admin, security, support | `AC-13-109` |
| `REQ-13-110` | [PRE-062](../product-spec.md#67-review-and-collaboration) | Administrative or support access to user data **MUST** be just-in-time, reason-bound, scoped, expiring, approved where policy requires, and audited. | Recovery, investigation, legal, support tools | `AC-13-110` |
| `REQ-13-111` | [PRE-053](../product-spec.md#66-slide-show-and-audience-runtime) | Abuse reports **MUST** collect the minimum stable references and optional user-selected evidence needed for the named category. | Links, comments, audience interaction, shared content | `AC-13-111` |
| `REQ-13-112` | [PRE-061](../product-spec.md#67-review-and-collaboration) | Public and collaboration endpoints **MUST** enforce identity-, grant-, document-, tenant-, network-risk-, and cost-aware rate or quota controls. | Auth, links, presence, operations, comments, AI, exports | `AC-13-112` |
| `REQ-13-113` | [PRE-062](../product-spec.md#67-review-and-collaboration) | Share-secret verification **MUST** resist online guessing through entropy, constant-time verification where applicable, throttling, and abuse monitoring. | Link and password/factor verification | `AC-13-113` |
| `REQ-13-114` | [PRE-060](../product-spec.md#67-review-and-collaboration) | Comment, mention, notification, and audience-interaction systems **MUST** provide spam, harassment, block/mute, and tenant-moderation controls appropriate to the enabled surface. | Review and live audience services | `AC-13-114` |
| `REQ-13-115` | [PRE-053](../product-spec.md#66-slide-show-and-audience-runtime) | A moderation action **MUST** record scope, actor, reason, duration, affected capability/content reference, and review or appeal path where policy permits. | Remove, mute, block, suspend, restrict link | `AC-13-115` |
| `REQ-13-116` | [ARC-031](../product-spec.md#74-storage-and-recovery) | A suspected security or privacy incident **MUST** enter `SM-13-005` with an accountable incident owner and preserved evidence. | Client, service, provider, supply chain | `AC-13-116` |
| `REQ-13-117` | [ARC-031](../product-spec.md#74-storage-and-recovery) | Suspected compromise of a token, key, link, session, build, or provider integration **MUST** trigger bounded containment and rotation/revocation before normal reuse. | Credential and supply-chain incidents | `AC-13-117` |
| `REQ-13-118` | [ARC-030](../product-spec.md#74-storage-and-recovery) | Production builds and dependencies **MUST** retain reviewable provenance, locked resolution, vulnerability disposition, and deployable revocation/rollback. | Application, service worker, parsers, sandboxes, providers | `AC-13-118` |
| `REQ-13-119` | [ARC-020](../product-spec.md#73-rendering-and-fidelity) | A material trust-policy, parser, sandbox, provider, or dependency change **MUST** invalidate affected readiness, conformance evidence, and cached trust decisions. | Release, runtime cache, imports, exports | `AC-13-119` |

---

## 12. Failure and Rescue Semantics

| Failure | Required detection/state | Required rescue | Forbidden response |
|---|---|---|---|
| OAuth state/nonce mismatch | Reject callback as unbound | Clear callback artifacts; restart sign-in from user action | Accept claims or reveal callback details |
| Invalid/expired/revoked token | Denied/reauth-required | Preserve local work; obtain fresh verified session | Trust cached profile or extend expiry locally |
| Token/secret storage unavailable | Secret persistence blocked | Use memory-only session or require sign-in | Fall back to plaintext persistent storage |
| Identity provider unavailable | Existing grant bounded by expiry | Retry or continue safe local work | Mint or extend authority from client claims |
| Cloud provider timeout after mutation | `outcome-unknown` | Lookup by stable request/save/grant ID | Blindly retry as a new mutation |
| Provider permission ambiguity | Privileged action blocked | Refresh authoritative grant or use explicit local copy | Infer role from manifest or stale cache |
| Malformed/oversized package | Quarantined/blocked | Cancel, inspect safe report, or use supported salvage | Partially admit mutable content |
| ZIP/path/XML attack | Exact parser finding | Keep prior state; quarantine source | Normalize into a potentially colliding path |
| Unsafe SVG/HTML | Sanitized/review/blocked | Show removals; use inert preview or explicit raster fallback | Execute original markup or fetch resources |
| PPTX active content | Quarantined/preserved-only | Open inert with report, remove explicitly, or cancel | Execute macro/OLE/ActiveX during preview |
| Encrypted package secret failure | Locked | Retry without retaining secret; cancel safely | Log secret or retain decrypted package indefinitely |
| Code sandbox timeout/crash | Terminated/degraded | Restart clean sandbox or show last safe/static fallback | Continue runaway code in main origin |
| Embed blocked/offline | Inert fallback | Poster, safe link, retry, or remove | Relax sandbox or auto-navigate |
| Cross-window/embed spoof | Message rejected | Re-handshake through current session | Apply partial state or trust type alone |
| Recording permission denied | No-capture | Continue rehearsal/presentation without denied track | Repeatedly prompt or claim recording active |
| Device lost mid-recording | Track failed/provisional | Preserve accepted recording; finalize/retry affected provisional track | Overwrite prior accepted recording |
| AI provider timeout/unsafe output | Failed/blocked proposal | Retry minimized request, switch approved provider, or discard | Commit partial/unvalidated output |
| Telemetry sink unavailable | Event dropped/bounded local queue | Continue product flow; retry under retention budget | Block interaction or grow unbounded queue |
| Deletion processor failure | `partial` | Retry idempotently; expose target and status | Declare complete or silently abandon |
| Legal hold blocks deletion | `held` | Show exact scope/authority/review date | Hide hold or retain unrelated data |
| Audit write failure for privileged action | Privileged consequence blocked or safely rolled back | Restore audit service and retry same action identity | Complete unaudited administrative action |
| Abuse flood | Throttled/degraded | Backoff, challenge, mute/block, preserve legitimate durable work | Let lossy traffic starve accepted operations |
| Suspected compromise | Incident detected/contained | Revoke/rotate, isolate, investigate, recover | Continue normal use pending convenience |

Every rescue action must be keyboard-operable and accessible under Volume 12, preserve the last verified state, and avoid echoing the malicious or sensitive input that caused failure.

---

## 13. Security and Privacy Objectives

Volume 14 is the sole normative owner of `SLO-14-070` through `SLO-14-077`. This volume owns the threat boundaries, prohibited outcomes, and adversarial protocol inputs those objectives evaluate; it references rather than redefines their values.

---

## 14. Acceptance Criteria

By normative mapping, each `AC-13-NNN` evaluates exactly `REQ-13-NNN`; the shared suffix is the bidirectional requirement-to-acceptance link.

| ID | Pass condition |
|---|---|
| `AC-13-001` | Provider and intercepted-code fixtures complete only with authorization code plus matching PKCE S256 verifier; implicit/token-fragment and missing-PKCE flows fail. |
| `AC-13-002` | Replayed, swapped-tab, wrong-action, missing, expired, and attacker-generated state/nonce callbacks are rejected with no session creation. |
| `AC-13-003` | Callback tests accept only registered exact scheme/host/port/path combinations and remove authorization parameters before ordinary navigation or telemetry. |
| `AC-13-004` | Wrong signature/algorithm/key/issuer/audience/authorized-party/time/nonce/tenant fixtures cannot create an authoritative principal or session. |
| `AC-13-005` | Same email under two issuers remains two principals, while name/email/avatar changes leave grants and attribution stable. |
| `AC-13-006` | A token for one provider, tenant, audience, or scope is rejected by every other resource and never forwarded by Story. |
| `AC-13-007` | Initial sign-in receives identity-only scopes; cloud write/share scopes appear only from the corresponding user action with accurate disclosure. |
| `AC-13-008` | Static/dynamic scans and runtime captures find no bearer secret or code in any forbidden document, URL, message, log, telemetry, notification, or recovery field. |
| `AC-13-009` | Production-profile inspection finds no raw refresh token or AI/provider key in localStorage, IndexedDB, Cache Storage, service-worker script-readable storage, or persisted app state. |
| `AC-13-010` | Rotated refresh-token replay invalidates the affected session family and cannot yield another accepted token. |
| `AC-13-011` | App-session fixtures prove expiry, revocation, document/capability limits, replay resistance, and absence of provider bearer tokens. |
| `AC-13-012` | Sign-out and forced-revoke tests invalidate service sessions and clear local secret access across tabs without deleting recoverable authored work. |
| `AC-13-013` | Linking and unlinking require fresh control of both accounts, reject email-only matches, and produce reversible audit attribution. |
| `AC-13-014` | Knowing issuer/subject and stored ciphertext is insufficient to derive the encryption key or decrypt protected local secrets. |
| `AC-13-015` | Ciphertext fixtures use AEAD, unique nonces, versioned metadata, and a non-exportable secret-backed key; tampering and nonce reuse tests fail closed. |
| `AC-13-016` | Expiry, revocation, and provider-outage tests deny privileged calls while acknowledged content and allowed local recovery remain intact. |
| `AC-13-017` | Identical malicious bytes receive identical quarantine/admission treatment from local, cloud, owner, collaborator, recent, and recovery sources. |
| `AC-13-018` | Mutable open is impossible before all applicable admission checks pass; failure leaves prior canonical state and source evidence unchanged. |
| `AC-13-019` | Provider conformance probes agree with the declared profile, and unsupported atomicity, revocation, range, integrity, or retention behavior fails closed. |
| `AC-13-020` | Cross-provider/account/tenant token substitution cannot read, mutate, share, or enumerate another provider resource. |
| `AC-13-021` | Signed URLs are absent from canonical serialization, logs, user-visible diagnostics, telemetry, and share output and expire from protected runtime state. |
| `AC-13-022` | Lost-response fixtures before/after commit resolve exactly once by readback under the original request identity. |
| `AC-13-023` | SSRF corpus blocks loopback, link-local, private/reserved, alternate-scheme, credential-bearing, DNS-rebinding, and redirect-escape targets before content use. |
| `AC-13-024` | Forged actor/profile/role fields and stale cached grants cannot alter server-derived identity or capability for any collaboration consequence. |
| `AC-13-025` | Malformed, oversized, stale-epoch, replayed, duplicate-ID/different-digest, unauthorized, and invalid-target messages fail before document allocation or mutation. |
| `AC-13-026` | Presence sink capture contains none of the prohibited fields and privacy suppression removes fine-grained location without denying document access. |
| `AC-13-027` | Link grants meet entropy policy, stored verifier data cannot recover the secret, and revocation blocks reuse. |
| `AC-13-028` | Referrer, log, analytics, preview-bot, page metadata, screenshot, QR, email, and notification tests reveal no share secret outside the intended recipient channel. |
| `AC-13-029` | Invalid, expired, revoked, and policy-blocked links reveal no title, thumbnail, owner, collaborators, provider, content, or existence distinction beyond policy-safe output. |
| `AC-13-030` | Revocation tests deny every protected route and active/reconnect session within the Volume 07 objective without restoring access from cache. |
| `AC-13-031` | Provider-role ambiguity and outage deny new Story privilege and expose an actionable recovery path. |
| `AC-13-032` | Hostile markup/URLs/files/mentions in comments are rejected or sanitized before acceptance, and notification output remains redacted after permission loss. |
| `AC-13-033` | Instrumented import proves no parser, decoder, DOM insertion, preview, or canonical write occurs before quarantine creation. |
| `AC-13-034` | Boundary fixtures for each archive limit terminate predictably without excessive allocation, partial admission, or application hang. |
| `AC-13-035` | Traversal, absolute, device, alternate-stream, duplicate, mixed-normalization, and case-collision paths are rejected with exact findings. |
| `AC-13-036` | XXE/DTD/schema/network fixtures produce zero outbound requests, local-file reads, or entity expansion. |
| `AC-13-037` | Declared/extension type mismatch fixtures use detected type or block and never dispatch solely by the attacker-controlled declaration. |
| `AC-13-038` | Parser/decoder fuzzing hits each resource limit, remains cancelable, and leaves the process and prior document usable. |
| `AC-13-039` | SVG corpus removes every forbidden element/attribute/URL/CSS behavior while preserving only declared safe semantics and issuing precise warnings. |
| `AC-13-040` | External, cross-document, cyclic, missing, escaping, and over-budget SVG reference graphs never fetch or resolve outside the admitted graph. |
| `AC-13-041` | Mutation between sanitize and reparse cannot enter storage/render; only the revalidated safe representation becomes active. |
| `AC-13-042` | Byte/node/path/depth/reference/filter/render-cost limits stop adversarial SVG before UI starvation or unbounded memory. |
| `AC-13-043` | Clipboard corpus yields allowed semantic content with zero script, event, style-based fetch, privileged scheme, or automatic network request. |
| `AC-13-044` | Macro/OLE/ActiveX/control/executable fixtures never execute in parse, preview, editor, audience, report, or export and retain declared quarantine disposition. |
| `AC-13-045` | Import analysis makes zero external relationship requests; explicit allowed resolution shows destination and updates compatibility/security records. |
| `AC-13-046` | Secrets and decrypted bytes disappear at the declared boundary and are absent from caches, logs, telemetry, crash reports, and later ordinary reopen. |
| `AC-13-047` | Signature corpus reports every named state correctly and still applies content safety validation to cryptographically valid hostile content. |
| `AC-13-048` | Unknown active parts round-trip inertly or report explicit removal; no adapter silently promotes them to executable. |
| `AC-13-049` | Code does not execute in inert/review/blocked policy states and begins only under an approved current profile. |
| `AC-13-050` | Sandbox inspection and exploit corpus cannot access application-origin DOM, storage, service worker, cookies, credentials, or same-origin resources. |
| `AC-13-051` | Attempts to use every denied capability fail inside the sandbox without affecting the app or leaking a privileged object reference. |
| `AC-13-052` | Wrong-source/session/version/type/schema/size and replayed sandbox messages are rejected before app or frame state changes. |
| `AC-13-053` | Infinite loop, allocation bomb, recursion, message flood, and frame abuse terminate under the declared budget and meet `SLO-14-073`. |
| `AC-13-054` | Repeated render/export with the same time, seed, input, dimensions, and versions produces the same declared semantic/pixel result. |
| `AC-13-055` | Sandbox return corpus accepts only inert bitmap or validated declarative output and rejects HTML, script, function, URL, and privileged transferable objects. |
| `AC-13-056` | Error output identifies the code surface and bounded failure without token, URL, stack-internal, document-content, or unbounded source echo. |
| `AC-13-057` | Equivalent code from manual, AI, clipboard, import, template, and collaborator sources receives identical admission and sandbox results. |
| `AC-13-058` | Embed activation cannot proceed until provider/origin, capabilities, data, privacy, and fallback are available and reviewed under policy. |
| `AC-13-059` | Effective frame sandbox and Permissions Policy contain no capability beyond the approved profile and reject unsafe same-origin/script combinations. |
| `AC-13-060` | Spoofed origin/source/session/revision/role/type/oversize/replay messages cause no state change; presenter-private payload fields are structurally impossible for audience roles. |
| `AC-13-061` | Network capture shows no ambient cookie/auth credential and the minimum approved referrer for external resource requests. |
| `AC-13-062` | Scripted, autoplay, unsafe-scheme, hidden, and no-user-activation navigation attempts are blocked; approved navigation exposes the destination. |
| `AC-13-063` | Offline, print, PDF, video, SVG/raster, and unsupported-host fixtures produce the selected inert fallback and an accurate degradation record. |
| `AC-13-064` | Device prompts occur only after the corresponding user action and request no unused microphone, camera, or display capability. |
| `AC-13-065` | Preflight accurately enumerates tracks, surface, outputs, processors, and retention and blocks start when a required disclosure is absent. |
| `AC-13-066` | Every live track has a persistent visual and assistive indicator plus keyboard-operable stop; no indicator appears for inactive tracks. |
| `AC-13-067` | Media-track event capture proves zero samples before explicit start and correctly timestamps the first accepted sample boundary. |
| `AC-13-068` | Stop/cancel/loss/revocation/error closes affected tracks and indicators within the declared bound with no continued sample capture. |
| `AC-13-069` | Seeded notes, diagnostics, notifications, and private windows are excluded or trigger explicit pre-capture warning and selection before capture. |
| `AC-13-070` | Remote-participant capture remains off without the distinct disclosure/consent policy and records each enabled participant data class. |
| `AC-13-071` | Crash/integrity/access tests recover or reject provisional chunks without exposing them to unrelated documents, users, or ordinary caches. |
| `AC-13-072` | Recording review names exact slide/tracks and acceptance creates one transaction; preview/cancel leaves authored state unchanged. |
| `AC-13-073` | Failure at every retake boundary leaves the prior accepted media playable and referenced. |
| `AC-13-074` | Proxy capture matches the disclosed minimized audio/text manifest, provider, language, purpose, and retention receipt. |
| `AC-13-075` | Deletion exercise accounts for every accepted/provisional/derived/provider/export/backup target and reports unavoidable prior recipient copies honestly. |
| `AC-13-076` | With all AI endpoints and credentials disabled, representative open/edit/save/present/recover/export workflows complete. |
| `AC-13-077` | Each AI surface displays all required disclosure fields before send and cancellation produces no request. |
| `AC-13-078` | Captured AI payload contains only selected stable addresses and purpose-required fields; whole-document substitution fails the detector. |
| `AC-13-079` | Seeded secrets in notes/comments/recordings/diagnostics/hidden slides/unrelated slides/identity never appear in default AI payloads. |
| `AC-13-080` | Production profile contains no raw AI key in script-readable storage, source bundle, URL, log, or telemetry, and broker scope/rotation tests pass. |
| `AC-13-081` | HTTP, private/reserved, redirect-escaping, credential-bearing, wrong-residency, and unapproved custom endpoint configurations are rejected. |
| `AC-13-082` | Prompt-injection corpus cannot change policy, destination, selected context, consent, capability, system prompt, or tool allowlist. |
| `AC-13-083` | AI-originated tool requests face the same direct-command permission and confirmation matrix and cannot bypass it through chaining. |
| `AC-13-084` | Malformed, oversized, mixed-prose/JSON, unsafe URL, executable, policy-violating, and adversarial responses remain rejected proposal data. |
| `AC-13-085` | Headed review shows exact before/proposed result and source scope before the commit control is enabled. |
| `AC-13-086` | Accepted AI output has one transaction, normal undo/replay/collaboration/save behavior, and no mutation before acceptance. |
| `AC-13-087` | Saved/reopened accepted AI output retains bounded provenance that resolves service profile, context hash, validation, reviewer action, and transaction without secrets. |
| `AC-13-088` | Generated code remains inert in response/preview storage and passes the identical sandbox corpus only after explicit code activation. |
| `AC-13-089` | Default provider profiles disable training/extended retention; any enabled exception has approved policy, disclosure, receipt, and expiry. |
| `AC-13-090` | Failure injection at request, stream, parse, validation, preview, and cancel boundaries leaves the canonical semantic hash unchanged. |
| `AC-13-091` | Data-flow inventory reports zero production flows without all `DataHandlingRecord` fields and catches an undeclared test transfer. |
| `AC-13-092` | Unknown event types and fields are dropped before sink, while every registered event passes schema/version tests. |
| `AC-13-093` | Negative-corpus secrets/content/URLs/IDs do not appear in client, network, service, storage, export, or vendor telemetry captures. |
| `AC-13-094` | Identifier analysis proves rotation, bounded purpose, no raw stable source, and no document/user join without separately authorized mapping. |
| `AC-13-095` | Preference, tenant policy, DNT, and Global Privacy Control matrix suppresses optional remote analytics without disabling core workflows. |
| `AC-13-096` | Security/reliability events have distinct schema, purpose, access, disclosure, retention, and legal/policy basis from optional analytics. |
| `AC-13-097` | Fuzzed messages/stacks/URLs/paths/bodies/secrets are removed or bounded before every persisted or remote diagnostic sink. |
| `AC-13-098` | Sink timeout, denial, offline, quota, and exception fixtures leave product result/state identical and keep queues bounded. |
| `AC-13-099` | Retention-policy tests expire every registered class at its maximum and reject no-maximum/unknown-start configurations. |
| `AC-13-100` | Deletion inventory and receipts reconcile every in-scope active Story store and processor with no orphan target. |
| `AC-13-101` | Hold UI/audit exposes exact retained scope/authority/owner/review and permits deletion of unrelated data. |
| `AC-13-102` | Requested, held, partial, active-deleted, processor-pending, backup-pending, and complete fixtures render accurate states and receipts. |
| `AC-13-103` | Ordinary product/service access cannot read deleted backup data, and expiry exercises remove it within the declared window. |
| `AC-13-104` | Privacy export contains the requester's authorized data/processing records in documented form and no other principal's protected data. |
| `AC-13-105` | Notification corpus reveals only destination-required minimized text and never a token, share secret, full note/comment, private title, or unapproved identity on lock-screen channels. |
| `AC-13-106` | Event matrix produces one typed audit event for every named successful/denied privileged action and no duplicate on idempotent retry. |
| `AC-13-107` | Removed, inserted, reordered, or altered audit records are detected at the exact gap or integrity boundary. |
| `AC-13-108` | Audit negative corpus contains no bearer secret or raw authored body and retains sufficient pseudonymous reference/reason for investigation. |
| `AC-13-109` | Authorization matrix denies audit enumeration and sensitive fields without the dedicated current capability. |
| `AC-13-110` | Admin/support access cannot start without scope/reason/expiry and required approval, expires automatically, and appears in user/tenant audit policy. |
| `AC-13-111` | Each abuse category accepts stable references and optional selected evidence while default capture excludes unrelated document content and identities. |
| `AC-13-112` | Load/adversarial tests enforce bounded per-dimension controls while durable accepted operations and owner recovery remain available within profile. |
| `AC-13-113` | Brute-force and timing corpus cannot recover a link secret within policy, and throttling/monitoring activate without leaking link validity metadata. |
| `AC-13-114` | Enabled review/audience surfaces expose and enforce the declared spam, mute/block, harassment, and tenant-moderation controls through headed workflows. |
| `AC-13-115` | Every moderation action is scoped, attributed, reasoned, time-bounded where applicable, reviewable, and reversible when policy permits. |
| `AC-13-116` | Incident exercise enters every required state with owner, evidence, scope, containment, notification decision, recovery validation, and follow-up. |
| `AC-13-117` | Suspected token/key/link/session/build/provider compromise blocks normal reuse until bounded revocation/rotation and clean validation finish. |
| `AC-13-118` | Build/dependency evidence includes locked resolution, provenance, vulnerability disposition, integrity/attestation, and tested rollback or revocation. |
| `AC-13-119` | Changing each material policy/profile/dependency marks affected decisions, readiness, caches, and evidence stale and forces revalidation before consequence. |

---

## 15. Required Test and Evidence Protocols

| ID | Protocol | Required evidence |
|---|---|---|
| `TEST-13-001` | OAuth/OIDC and session integration tests exercise PKCE, state, nonce, claims, issuer/audience, linking, refresh rotation, replay, sign-out, and provider outage. | Sanitized request/claim classes, session dispositions, no-secret captures. |
| `TEST-13-002` | Token/secret storage inspection tests browser stores, process memory boundaries where observable, source maps/bundles, logs, URLs, crash reports, and multi-tab cleanup. | Storage inventory, secret canaries, rotation/revocation trace. |
| `TEST-13-003` | File/parser fuzzing covers package limits, paths, JSON/XML, media signatures, fonts, archives, corruption, cancellation, and recovery. | Corpus version, resource usage, findings, unchanged prior hash. |
| `TEST-13-004` | SVG/HTML/clipboard/PPTX adversarial corpus verifies sanitization, no execution/network, quarantine, active-content preservation, signatures, encryption, and reports. | Raw input hashes, safe parsed output, network/execution capture, artifact report. |
| `TEST-13-005` | Headed sandbox/embed/link workflows exercise origin isolation, capabilities, messages, budgets, CSP/Permissions Policy, navigation, offline, and output fallbacks. | Visible browser, frame policies, message/network trace, pixels, termination. |
| `TEST-13-006` | Headed recording/device matrix exercises permission, preflight, indicators, start/stop, screen privacy, retake failure, provisional recovery, transcription, and deletion. | Device/track events, video/audio samples, UI/AT capture, artifact inventory. |
| `TEST-13-007` | AI boundary tests capture minimized requests, consent/disclosure, endpoint validation, prompt injection, tool checks, response schemas, diffs, transactions, provenance, and failure. | Proxy payload manifest, response disposition, semantic hashes, transaction/audit trace. |
| `TEST-13-008` | Telemetry/privacy tests fuzz every event field and sink, preferences, DNT/GPC, crash reporting, identifiers, backpressure, and vendor payloads. | Raw pre-sink/sink capture, schema detector, secret/content canaries. |
| `TEST-13-009` | Retention/deletion exercises enumerate client/service/provider/processor/backup targets, holds, retries, receipts, privacy export, and expiry. | Policy versions, clock controls, per-target state, receipts, exceptions. |
| `TEST-13-010` | Collaboration/sharing security tests forge principals, grants, operations, presence, comments, links, provider roles, revocation, notification, and outcome ambiguity. | Denial/acceptance responses, unchanged/accepted heads, audit chain. |
| `TEST-13-011` | Abuse/load tests exercise brute force, spam, mention/notification floods, endpoint quotas, mute/block, moderation, and metadata side channels. | Rate/quota observations, legitimate-work continuity, moderation records. |
| `TEST-13-012` | Incident/admin/supply-chain exercises cover just-in-time access, audit tampering, compromise containment, key rotation, vulnerable dependency, build rollback, notification decision, and evidence preservation. | Incident timeline, approvals, integrity proof, recovery and retrospective. |

Headed workflow evidence follows Volume 00 and repository policy. Browser behavior is not accepted from headless-only runs. Network and artifact claims require real payload/artifact inspection; unit tests and module names alone cannot establish boundary conformance.

**`EVD-13-001 Security, privacy, and trust conformance bundle`** contains product/spec revisions, environment, deployment/provider/sandbox/parser/policy versions, requirement/criterion/test links, fixture/corpus hashes, threat cases, consent and retention profiles, raw sanitized captures, network and artifact evidence, audit/incident records, results, waivers, and limitations. Secrets and unnecessary authored content are excluded from the evidence bundle itself.

---

## 16. Traceability and Release Gate

| Requirement range | Parent capabilities | Primary contracts and protocols |
|---|---|---|
| `REQ-13-001` through `REQ-13-016` | `PRE-061`, `PRE-062`, `ARC-001`, `ARC-030`, `ARC-031` | `SCH-13-001`, `INV-13-001` through `INV-13-005`, `SM-13-002`, `TEST-13-001`, `TEST-13-002` |
| `REQ-13-017` through `REQ-13-032` | `PRE-060` through `PRE-062`, `ARC-012`, `ARC-030`, `ARC-031` | `SCH-13-003`, `SM-13-001`, `FLOW-13-001`, `TEST-13-003`, `TEST-13-010` |
| `REQ-13-033` through `REQ-13-048` | `DES-071` through `DES-073`, `PRE-070`, `PRE-073`, `ARC-030` | `SCH-13-003`, `FLOW-13-002`, `SLO-14-072`, `TEST-13-003`, `TEST-13-004` |
| `REQ-13-049` through `REQ-13-063` | `DES-061`, `PRE-023`, `PRE-033`, `PRE-051`, `ARC-020` through `ARC-022` | `SCH-13-006`, `INV-13-008`, `SLO-14-073`, `TEST-13-005` |
| `REQ-13-064` through `REQ-13-075` | `PRE-042`, `PRE-043`, `PRE-053`, `ARC-030`, `ARC-031` | `SCH-13-004`, `SCH-13-007`, `SM-13-002`, `SM-13-003`, `TEST-13-006` |
| `REQ-13-076` through `REQ-13-090` | `DES-033`, `DES-061`, `ARC-002`, `ARC-010`, `ARC-030`, `ARC-031` | `SCH-13-007`, `SCH-13-010`, `FLOW-13-003`, `SLO-14-075`, `TEST-13-007` |
| `REQ-13-091` through `REQ-13-105` | `PRE-060`, `PRE-062`, `ARC-022`, `ARC-030`, `ARC-031` | `SCH-13-002`, `SCH-13-005`, `SCH-13-009`, `SM-13-004`, `FLOW-13-004`, `TEST-13-008`, `TEST-13-009` |
| `REQ-13-106` through `REQ-13-119` | `PRE-053`, `PRE-060` through `PRE-062`, `ARC-001`, `ARC-020`, `ARC-030`, `ARC-031` | `SCH-13-008`, `SM-13-005`, `FLOW-13-005`, `SLO-14-077`, `TEST-13-010` through `TEST-13-012` |

A release profile cannot claim Volume 13 conformance with an authentication/authorization bypass, undeclared content transfer, secret leakage, unsafe active-content execution, presenter-private disclosure, unindicated recording, AI mutation without review, indefinite unclassified retention, false deletion status, unaudited privileged action, or unresolved critical incident. These conditions are non-waivable under Volume 00 where they create the prohibited harm.

---

## 17. Source Adoption and Supersession

| Source | Adopted input | Superseded or excluded claim |
|---|---|---|
| [Product Specification](../product-spec.md) | Trust boundary, least privilege, explicit consent/retention, provider failure, deterministic core | Parent capabilities remain immutable; this volume adds enforceable detail. |
| [Capability Audit](../capability-audit.md) | Partial implementation and evidence boundary | Audit does not create or prove requirements. |
| [Collaboration authentication](../../specs/collaboration/authentication.md) and [OAuth identity flow](../../specs/collaboration/identity/oauth-identity-flow.md) | Authorization code/PKCE intent, provider abstraction, issuer/subject concepts | Token-as-authority, unverified client parsing, broad/persistent token storage, and completion claims are superseded. |
| [Identity security](../../specs/collaboration/identity/identity-security.md) and [privacy model](../../specs/collaboration/identity/privacy-model.md) | Threat inventory, minimization, user control, provider disclosure | Client-authoritative identity, trust-client exceptions, zero-database absolution, and deletion/compliance overclaims are superseded. |
| [Collaboration security model](../../specs/collaboration/security-model.md) | File validation, asset signatures, code isolation intent, authenticated encryption | Regex code sanitization, identity-claim-only keys, token-storage examples, and implementation snippets are informative only. |
| [Sharing and permissions](../../specs/collaboration/sharing-permissions.md) | Role vocabulary, provider-aware sharing, access review needs | Client-side manifest authorization/password verification, metadata-bearing URLs, and revocation-by-file-edit are superseded. |
| [SVG security](../../specs/slides/svg/05-security-sanitization.md) | Allowlist sanitization, no external references, complexity limits, warning requirements | Exact old limits and planned status are not conformance; this volume owns the trust policy. |
| [Presentation security and privacy](../../specs/slides/presentation-mode/16-security-privacy-and-safety.md) | Presenter/audience separation, content sanitization, audience-safe errors, cross-window validation | Origin assumptions and implementation examples do not prove secure messaging or complete privacy. |
| [AI assisted creation](../../specs/ai/ai-copilot.md) and [AI integration](../../specs/ai/ai-integration.md) | Optional providers, preview intent, generated-code use case | Raw keys in localStorage, direct unbounded context, automatic code injection, and user-trigger-as-blanket-consent are superseded. |
| [Volume 11](11-interchange-and-output.md) | OPC/PPTX package limits, XML/relationship inventory, active-content quarantine, compatibility reporting | Volume 11 owns format behavior; this volume owns trust decisions and data policy. |

---

## 18. Current Evidence Boundary

As of the July 10, 2026 audit baseline, Story has useful but partial trust foundations:

- OAuth provider configuration and token lifecycle tests exist, but production token storage places access and refresh tokens in `localStorage`; that does not satisfy `REQ-13-009`.
- Identity encryption uses HKDF and AES-GCM with issuer/subject material, but public identity claims alone are not a conforming secret root under `REQ-13-014` and `REQ-13-015`.
- Identity linking, cloud-provider adapters, share-link/UI modules, and collaboration services exist, but they do not prove server-authoritative identity, complete revocation, durable collaboration authority, or provider-failure safety.
- The SVG sanitizer has an allowlist, strips scripts/events/external references, enforces byte/node limits, and has unit tests. That is evidence for a bounded subset, not the full SVG/import/PPTX trust contract.
- Presentation message sanitization, presenter/audience privacy checks, telemetry allowlists, DNT handling, unit tests, and headed telemetry tests are meaningful foundations. They do not prove complete cross-window authorization, consent, retention, deletion, or vendor-sink behavior.
- AI calls are direct from the browser and provider keys are stored in `localStorage`; AI privacy, brokered secrets, endpoint policy, prompt-injection, provenance, and generated-code admission remain unproven.
- Integrated recording and PPTX workflows are missing or incomplete according to the capability audit; no conformance claim is made for their security/privacy requirements.

No requirement in this volume is marked implemented by the existence of a module, control, mock, unit test, document, or taskflow.

---

## 19. Open Decisions

Defaults below are binding until an accepted decision supersedes them.

| ID | Decision/question | Default in force | Owner | Review trigger | Affected requirements/contracts | Blocking class |
|---|---|---|---|---|---|---|
| `OD-13-001` | Browser provider-token architecture: SDK memory cache, backend-for-frontend, OS broker, or hybrid? | Use a reviewed provider SDK memory/session boundary for bounded browser sessions; raw long-lived tokens and provider keys are never in script-readable persistent storage. | Identity and Security | Production authentication architecture review | `REQ-13-001` through `REQ-13-016`, `SLO-14-070` | `R1-blocking` |
| `OD-13-002` | Which code-fill runtime technology satisfies opaque origin, budgets, deterministic rendering, and output needs? | Code fills remain inert/static-preview only until a sandbox passes `TEST-13-005`. | Rendering and Security | First production code-fill release candidate | `REQ-13-049` through `REQ-13-063`, `SLO-14-073` | `R1-blocking` |
| `OD-13-003` | Which embed providers/capabilities are approved? | No active embed provider is approved; content remains poster/link/preserved-only until provider-specific review. | Product, Security, Privacy | First embed provider proposal | `REQ-13-054` through `REQ-13-063`, `REQ-09-115` | `non-blocking` |
| `OD-13-004` | What is the default remote product-analytics posture? | Optional remote product analytics are off until a disclosed consent/tenant policy is accepted; bounded local diagnostics may operate without remote transfer. | Product Analytics and Privacy | First remote analytics deployment | `REQ-13-091` through `REQ-13-105`, `OUTCOME-001` through `OUTCOME-008` | `non-blocking` |
| `OD-13-005` | Which AI providers, regions, retention, and training profiles are approved? | Send only exact selected context to an approved no-training/shortest-retention profile; otherwise AI remains unavailable. | AI, Privacy, Security | Provider onboarding or policy change | `REQ-13-076` through `REQ-13-090`, `SLO-14-075` | `non-blocking` |
| `OD-13-006` | What participant consent model applies to remote audience recording and live captions? | Only the presenter's local selected devices are capturable; remote participant identity/media capture remains disabled. | Product, Legal, Privacy | Audience-service recording proposal | `REQ-13-064` through `REQ-13-075`, `SLO-14-074` | `non-blocking` |
| `OD-13-007` | What concrete retention durations apply to each class? | Keep the shortest operationally necessary duration, publish it before collection, and prohibit indefinite retention; legal holds are explicit exceptions. | Privacy, Legal, Operations | Acceptance of deployment data inventory | `REQ-13-091` through `REQ-13-105`, `SLO-14-076` | `R1-blocking` |
| `OD-13-008` | What abuse moderation service and appeal policy apply to public audience features? | Public posting/reactions/Q&A remain disabled unless the surface has rate, report, block/mute, moderation, retention, and review controls. | Trust and Safety, Product | First public audience-interaction release | `REQ-13-106` through `REQ-13-119`, `SLO-14-077` | `non-blocking` |

---

## 20. Identifier Counts

| Namespace | Count | Range |
|---|---:|---|
| Requirements | 119 | `REQ-13-001` through `REQ-13-119` |
| Schemas | 10 | `SCH-13-001` through `SCH-13-010` |
| Invariants | 18 | `INV-13-001` through `INV-13-018` |
| State machines | 5 | `SM-13-001` through `SM-13-005` |
| Flows | 5 | `FLOW-13-001` through `FLOW-13-005` |
| Adopted SLOs | 8 | `SLO-14-070` through `SLO-14-077` |
| Acceptance criteria | 119 | `AC-13-001` through `AC-13-119` |
| Test protocols | 12 | `TEST-13-001` through `TEST-13-012` |
| Evidence bundles | 1 | `EVD-13-001` |
| Open decisions | 8 | `OD-13-001` through `OD-13-008` |

The counts above describe this draft inventory and do not imply implementation or conformance.