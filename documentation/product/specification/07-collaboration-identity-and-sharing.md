# Volume 07: Collaboration, Identity, and Sharing

> **Specification ID:** `STORY-SPEC-07`  
> **Volume:** 07 (16 volumes total, 00-15)  
> **Status:** Normative draft  
> **Version:** 2.0.0-draft  
> **Owner:** Collaboration, Identity, Storage, and Trust Engineering  
> **Approvers:** Product, Design, Engineering, Quality, Accessibility, Security, Privacy  
> **Last reviewed:** July 10, 2026  
> **Review cadence:** At every accepted collaboration, identity, permission, or sharing change and at least once per release train  
> **Normative scope:** Shared-document authority, replicas, concurrency, offline queues, presence, identity binding, comments, permissions, sharing, revocation, collaboration audit, and provider-failure behavior  
> **Explicit non-ownership:** Canonical authored entity meaning, transaction semantics, package and asset persistence, rendering, general security and privacy policy, implementation status, and release evidence  
> **Parent capabilities:** `PRE-060`, `PRE-061`, `PRE-062`, `ARC-010`, `ARC-011`, `ARC-012`, `ARC-030`, `ARC-031`  
> **Parent specification:** [Story Product Specification System](README.md)  
> **Governed by:** [Volume 00 - Governance and Traceability](00-governance-and-traceability.md)  
> **Supersedes:** Conflicting collaboration, identity, sharing, and collaborative-save claims in active domain specifications where this volume is more precise  
> **Implementation status:** Out of scope; see the dated [Capability Audit](../capability-audit.md) for evidence-backed current-state reporting

---

## 1. Authority and Scope

This volume is the sole normative owner of shared-document authority, replicas, operation acceptance, reconnect, presence, comment operations and delivery, permissions, sharing, revocation, and collaboration audit semantics. Volume 03 owns canonical durable comment content and anchor schemas. This volume adopts those schemas plus the transaction contracts owned by Volume 04 and the package, asset, checkpoint, and recovery contracts owned by Volume 06.

This volume supersedes collaboration-domain claims that:

- an ephemeral messaging group can be the only collaboration state;
- an owner's open browser is responsible for persisting collaborators' accepted work;
- a client timestamp, unverified identity embedded in a message, or cloud-file manifest grants authority;
- a full-document overwrite is a valid real-time synchronization primitive;
- presence, cursors, selections, or transport delivery constitute document acceptance;
- `.story` is the native extension; `.str` remains canonical;
- a taskflow, isolated module, or passing unit test proves integrated multiplayer behavior.

The existing domain specifications remain informative implementation inputs where they do not conflict with this volume. In particular, transport may remain provider-agnostic and serverless in deployment, but shared editing requires durable server-side coordination state. "Serverless" does not mean "stateless."

### 1.1 Applicability Modes

| Mode | Document authority | Required behavior |
|---|---|---|
| Local solo | Local canonical document plus Volume 06 atomic persistence | No collaboration service is required; local operations still use the canonical transaction boundary. |
| Cloud solo | Cloud checkpoint plus provider concurrency token | The client may edit optimistically and reconcile provider conflicts under Volume 06. |
| Shared online | Durable collaboration authority described here | Every durable mutation is accepted into one canonical operation stream. |
| Shared offline | Last verified snapshot plus durable local pending queue | The client may create tentative operations but must not represent them as shared or acknowledged. |
| Published/view-only | Immutable publication revision or authorized shared head | No document mutation is permitted; audience interaction is a separate scoped service. |

### 1.2 Normative Language

`MUST`, `MUST NOT`, `SHOULD`, `SHOULD NOT`, and `MAY` are normative. Each `REQ-07-*` row contains one primary normative outcome. Supporting `INV`, `SCH`, `SM`, `FLOW`, `SLO`, `AC`, `TEST`, and `EVD` identifiers refine that outcome and do not replace it.

## 2. Collaboration Architecture

### 2.1 Authority Decision

For a shared document, authority is a durable, access-controlled collaboration record:

```text
CollaborationAuthority =
  documentId
  + epoch
  + headSequence
  + acceptedOperationLog
  + durableSnapshot/checkpoint chain
  + current permissionRevision
  + semanticHash at durable boundaries
```

The collaboration service may be implemented with managed functions, a transactional log, and object storage. It need not maintain a general-purpose user-profile database. It must nevertheless durably store the minimum coordination metadata, permissions, accepted operations, snapshots, revocation state, and audit events required by this contract.

`documentId` identifies the collaboration lineage. `epoch` identifies a non-overlapping authority generation. `headSequence` is the contiguous server-assigned sequence within an epoch. An operation is durable only after the authority atomically validates, authorizes, appends, sequences, and acknowledges it.

### 2.2 Architecture Requirements

| ID | Parent | Atomic requirement | Applies to | Acceptance |
|---|---|---|---|---|
| `REQ-07-001` | [ARC-010](../product-spec.md#72-transactions-history-and-collaboration), [PRE-061](../product-spec.md#67-review-and-collaboration) | A shared presentation **MUST** have exactly one durable canonical accepted-operation stream per document epoch. | Shared online, reconnect, checkpoint | `AC-07-001` |
| `REQ-07-002` | [ARC-012](../product-spec.md#72-transactions-history-and-collaboration) | The collaboration authority **MUST** assign a contiguous monotonic sequence to each accepted transaction within an epoch. | Acceptance, replay, resync | `AC-07-002` |
| `REQ-07-003` | [ARC-030](../product-spec.md#74-storage-and-recovery), [ARC-031](../product-spec.md#74-storage-and-recovery) | The collaboration authority **MUST** durably retain snapshots and enough accepted log history to recover every acknowledged change under the published retention contract. | Save, crash, failover, resync | `AC-07-003` |
| `REQ-07-004` | [ARC-001](../product-spec.md#71-canonical-document-model), [PRE-061](../product-spec.md#67-review-and-collaboration) | Each client **MUST** operate as an optimistic replica whose acknowledged base and tentative overlay are distinguishable. | Online and offline clients | `AC-07-004` |
| `REQ-07-005` | [ARC-011](../product-spec.md#72-transactions-history-and-collaboration) | Operation acceptance **MUST** be idempotent by the tuple `(documentId, epoch, actorId, clientInstanceId, clientOperationId)`. | Submit, retry, reconnect | `AC-07-005` |
| `REQ-07-006` | [ARC-002](../product-spec.md#71-canonical-document-model), [ARC-011](../product-spec.md#72-transactions-history-and-collaboration) | The authority **MUST** validate operation schema, target identity, preconditions, size, epoch, and authorization before append. | Every submitted transaction | `AC-07-006` |
| `REQ-07-007` | [ARC-012](../product-spec.md#72-transactions-history-and-collaboration) | Every replica **MUST** converge to the same semantic document hash after applying the same accepted prefix. | Two or more replicas | `AC-07-007` |
| `REQ-07-008` | [ARC-012](../product-spec.md#72-transactions-history-and-collaboration) | Local undo **MUST** submit a new intent-reversing transaction against the current accepted head without removing accepted remote work. | Undo and redo | `AC-07-008` |
| `REQ-07-009` | [ARC-030](../product-spec.md#74-storage-and-recovery) | A `.str` package produced during collaboration **MUST** identify the document epoch and accepted sequence represented by its snapshot. | Checkpoint, download, reopen | `AC-07-009` |
| `REQ-07-010` | [ARC-031](../product-spec.md#74-storage-and-recovery) | No acknowledged collaborator change **MUST** depend on an owner's browser remaining connected or performing a later save. | Owner disconnect, autosave | `AC-07-010` |

### 2.3 Core Invariants

| ID | Invariant |
|---|---|
| `INV-07-001` | For one `(documentId, epoch)`, no two distinct accepted transactions have the same `serverSequence`. |
| `INV-07-002` | `headSequence` equals the largest contiguous durably appended sequence; gaps are never exposed as a completed head. |
| `INV-07-003` | An acknowledgment is emitted only after the accepted record is durable according to the service's write policy. |
| `INV-07-004` | Replaying the snapshot base followed by accepted operations in sequence order yields the declared semantic hash. |
| `INV-07-005` | Tentative operations, presence, cache state, access tokens, and editor selection never enter canonical document state. |
| `INV-07-006` | A retry of an accepted client operation returns the original disposition and sequence without applying its mutation twice. |
| `INV-07-007` | A rejected operation cannot affect the canonical stream, snapshot, semantic hash, or another replica. |
| `INV-07-008` | A permission check uses authoritative current grant state, not a role cached in a file or client. |
| `INV-07-009` | Changing authority generation increments `epoch`; operations from older epochs cannot be appended. |
| `INV-07-010` | Asset references become accepted only when their immutable content identity and authorized durable upload are valid. |

## 3. Canonical Collaboration Schemas

The wire encoding may use compact field names, but decoded values must satisfy these logical contracts.

### 3.1 Authority Head

**`SCH-07-001 CollaborationHead`**

| Field | Type | Rule |
|---|---|---|
| `documentId` | opaque stable ID | Not a provider path and not user-controlled display text. |
| `epoch` | unsigned integer or opaque monotonic token | Changes on restore, destructive rebase, authority migration, or lineage fork. |
| `headSequence` | unsigned integer | Highest contiguous accepted transaction. |
| `snapshotId` | immutable ID | References a verified durable snapshot at or before `headSequence`. |
| `snapshotSequence` | unsigned integer | Sequence represented by the snapshot. |
| `semanticHash` | versioned digest | Computed with the canonical hash algorithm at `headSequence`. |
| `schemaVersion` | version identifier | Selects document and operation validators. |
| `permissionRevision` | unsigned integer | Selects the access-control state used for current decisions. |
| `updatedAt` | server timestamp | Diagnostic only; never orders operations. |

### 3.2 Operation Envelope

**`SCH-07-002 OperationEnvelope`**

| Field | Type | Rule |
|---|---|---|
| `documentId`, `epoch` | authority identity | Must match the current authority. |
| `actorId` | verified principal ID | Derived from validated authentication, never trusted from payload claims. |
| `clientInstanceId` | random per installation/session ID | Rotates on reset; contains no PII. |
| `clientOperationId` | unique stable ID | Persists across retries and offline restart. |
| `transactionId` | stable ID | Groups one user intent and its operations. |
| `baseSequence` | unsigned integer | Accepted head against which the client formed the intent. |
| `schemaVersion` | version | Must be supported or rejected with upgrade guidance. |
| `operations` | non-empty typed list | Uses Volume 04 operation schemas and stable target IDs. |
| `preconditions` | typed list | Expected existence, generation, value revision, or order anchors. |
| `intent` | bounded enum plus safe label | Supports undo, audit, and diagnostics; not executable. |
| `createdAtLocal` | client timestamp | Diagnostic only; never resolves concurrency. |

**`SCH-07-003 AcceptedOperationRecord`** adds `serverSequence`, `acceptedAt`, `permissionRevision`, canonical transformed/rebased operations when applicable, result hash or hash checkpoint reference, and disposition. The service-derived actor identity replaces any client-supplied actor field.

**`SCH-07-004 OperationAcknowledgment`** contains `clientOperationId`, `epoch`, disposition (`accepted`, `duplicate`, `rejected`, `resync-required`), assigned `serverSequence` when accepted or duplicate, canonical operation result, new `headSequence`, and a stable machine-readable reason when not accepted.

### 3.3 Snapshot and Log

**`SCH-07-005 CollaborationSnapshot`** contains the canonical persisted document, `documentId`, `epoch`, `throughSequence`, schema version, canonicalization version, semantic hash, asset manifest roots, creation reason, and integrity metadata. It excludes tokens, presence, local queues, editor state, and private presenter state.

**`SCH-07-006 LogSegment`** contains one epoch, an inclusive contiguous sequence range, immutable accepted records, a segment checksum, previous-segment digest, and format version. Compaction may replace replay history only after a verified snapshot covers it and the retention and active-replica rules permit deletion.

### 3.4 Replica State

**`SCH-07-007 ReplicaState`**

```text
verifiedBase: snapshot + accepted operations through acknowledgedSequence
tentativeOverlay: ordered local transactions not yet accepted
receiveBuffer: accepted records above the next contiguous sequence
durableQueue: encrypted-at-rest local pending envelopes
replicaStatus: see SM-07-001
```

The UI must derive "Saved/shared" from acknowledged durability, not merely from local application or transport send completion.

## 4. Acceptance, Ordering, and Concurrency

### 4.1 Acceptance Flow

**`FLOW-07-001 Online operation acceptance`**

1. The user action enters the Volume 04 transaction boundary.
2. The client validates and applies a tentative preview/commit locally.
3. The client durably records the envelope before or atomically with network submission.
4. The authority authenticates the principal and resolves current permissions.
5. The authority validates epoch, base, schema, limits, targets, and preconditions.
6. The authority deterministically rebases or rejects the transaction against accepted records after `baseSequence`.
7. The authority atomically appends the canonical accepted record and advances `headSequence`.
8. The authority acknowledges the sender and publishes the accepted record to subscribers.
9. Each replica applies accepted records only in contiguous server-sequence order, rebases its tentative overlay, and verifies scheduled semantic hashes.
10. The client removes a pending envelope only after matching acceptance, duplicate acknowledgment, or an explicit user-resolved rejection.

### 4.2 Concurrency Requirements

| ID | Parent | Atomic requirement | Acceptance |
|---|---|---|---|
| `REQ-07-011` | [ARC-011](../product-spec.md#72-transactions-history-and-collaboration) | Concurrent operations **MUST** resolve by typed deterministic rules over stable identities and server order rather than client wall-clock time. | `AC-07-011` |
| `REQ-07-012` | [ARC-011](../product-spec.md#72-transactions-history-and-collaboration), [PRE-061](../product-spec.md#67-review-and-collaboration) | Ordered collections **MUST** preserve all non-conflicting concurrent insert and move intents without index-addressed ambiguity. | `AC-07-012` |
| `REQ-07-013` | [DES-033](../product-spec.md#54-text-and-typography), [PRE-061](../product-spec.md#67-review-and-collaboration) | Concurrent rich-text editing **MUST** preserve Unicode scalar, grapheme, run, paragraph, and selection-anchor integrity. | `AC-07-013` |
| `REQ-07-014` | [DES-023](../product-spec.md#53-vector-and-shape-authoring), [PRE-061](../product-spec.md#67-review-and-collaboration) | Concurrent vector editing **MUST** address paths, points, segments, handles, and operands by stable identity. | `AC-07-014` |
| `REQ-07-015` | [ARC-012](../product-spec.md#72-transactions-history-and-collaboration) | Delete-versus-edit resolution **MUST** preserve recoverable user intent without silently resurrecting or discarding content. | `AC-07-015` |
| `REQ-07-016` | [ARC-012](../product-spec.md#72-transactions-history-and-collaboration) | A rejected tentative transaction **MUST** be removed or repaired through a visible deterministic reconciliation flow. | `AC-07-016` |

Typed concurrency policy:

| Conflict | Canonical policy |
|---|---|
| Independent stable targets | Accept both in server order. |
| Same scalar property | Apply deterministic precondition policy; stale conditional writes reject or become explicit overwrite operations. No timestamp LWW. |
| Concurrent ordered insertion | Position identifiers/anchors plus deterministic tie-break preserve both items. |
| Concurrent move | Latest accepted move intent for the same stable item wins; unrelated items remain. |
| Delete then edit same entity | Edit is rejected as target-gone and offered as recoverable copy or explicit restore; automatic resurrection is forbidden. |
| Concurrent delete | First accepted delete changes state; duplicate semantic delete is an idempotent no-op with traceability. |
| Text edits | Use one specified sequence/CRDT/OT algorithm with conformance vectors; UTF-16 indexes alone are forbidden as durable identity. |
| Asset upload/reference | Upload commits by content hash first; document reference is accepted second. Orphan collection follows Volume 06 retention. |

## 5. Replica Lifecycle, Offline Work, and Reconnect

### 5.1 Replica State Machine

**`SM-07-001 Replica lifecycle`**

| State | Meaning | Allowed transitions |
|---|---|---|
| `closed` | No document material is active. | `opening` |
| `opening` | Authenticating, authorizing, and resolving snapshot/log. | `catching-up`, `offline-readonly`, `blocked` |
| `catching-up` | Applying a verified contiguous accepted prefix. | `online-clean`, `online-pending`, `blocked` |
| `online-clean` | At known head with no local pending transaction. | `online-pending`, `offline-clean`, `revoked` |
| `online-pending` | Tentative local work exists. | `online-clean`, `offline-pending`, `reconciling`, `revoked` |
| `offline-clean` | Disconnected with no tentative work. | `reconnecting`, `offline-pending`, `revoked` |
| `offline-pending` | Disconnected with durable tentative work. | `reconnecting`, `fork-required`, `revoked` |
| `reconnecting` | Reauthenticating and querying current authority. | `reconciling`, `online-clean`, `revoked`, `blocked` |
| `reconciling` | Applying missed records and resubmitting/rebasing pending work. | `online-clean`, `online-pending`, `fork-required`, `revoked` |
| `fork-required` | Pending intent cannot enter the current lineage safely. | local-copy/export, explicit discard, authorized new document |
| `revoked` | Current principal no longer has required access. | local recovery decision, `closed`; never implicit resubmit |
| `blocked` | Integrity, schema, or service condition prevents safe editing. | retry, repair, local recovery decision, `closed` |

### 5.2 Offline and Reconnect Requirements

| ID | Parent | Atomic requirement | Acceptance |
|---|---|---|---|
| `REQ-07-017` | [ARC-031](../product-spec.md#74-storage-and-recovery), [PRE-061](../product-spec.md#67-review-and-collaboration) | Offline-capable clients **MUST** durably queue each tentative transaction with its authority identity and stable idempotency key before reporting local commit. | `AC-07-017` |
| `REQ-07-018` | [PRE-061](../product-spec.md#67-review-and-collaboration) | The UI **MUST** continuously distinguish local-only, sending, acknowledged, conflicted, blocked, and revoked states without claiming "saved" for tentative work. | `AC-07-018` |
| `REQ-07-019` | [ARC-031](../product-spec.md#74-storage-and-recovery) | Reconnect **MUST** authenticate and fetch the current epoch, permission revision, head, and either missing accepted records or a verified newer snapshot before submitting pending work. | `AC-07-019` |
| `REQ-07-020` | [ARC-011](../product-spec.md#72-transactions-history-and-collaboration) | The client **MUST** submit pending transactions in stable local-intent order while retaining each idempotency key across retries. | `AC-07-020` |
| `REQ-07-021` | [ARC-031](../product-spec.md#74-storage-and-recovery) | An epoch mismatch **MUST** block automatic replay and offer an explicit safe fork, copy, or discard decision. | `AC-07-021` |
| `REQ-07-022` | [ARC-031](../product-spec.md#74-storage-and-recovery) | Permission loss during offline work **MUST** prevent resubmission while preserving a policy-compliant local recovery path for the user's unshared edits. | `AC-07-022` |
| `REQ-07-023` | [ARC-031](../product-spec.md#74-storage-and-recovery) | Reconnect after log compaction **MUST** recover from a verified snapshot without duplicating acknowledged or pending operations. | `AC-07-023` |
| `REQ-07-024` | [ARC-031](../product-spec.md#74-storage-and-recovery) | Cross-tab clients **MUST** coordinate one logical pending queue per client identity or use distinct idempotent client instances without double submission. | `AC-07-024` |

**`FLOW-07-002 Reconnect`**

1. Freeze network submission but retain local editing according to policy.
2. Refresh authentication without exposing tokens to document or collaboration messages.
3. Request `CollaborationHead` with last acknowledged epoch/sequence and pending IDs.
4. Stop on revocation, epoch mismatch, unsupported schema, or integrity failure.
5. Apply missing accepted records contiguously; request a snapshot if the log window is unavailable.
6. Rebase the tentative overlay against the verified new base.
7. Resubmit pending envelopes in local intent order using original IDs.
8. Resolve per-operation acceptance or rejection; never clear the entire queue on partial success.
9. Verify semantic hash at the next declared checkpoint.
10. Return to clean only when no unresolved pending item remains.

## 6. Snapshots, Checkpoints, Assets, and Recovery

| ID | Parent | Atomic requirement | Acceptance |
|---|---|---|---|
| `REQ-07-025` | [ARC-030](../product-spec.md#74-storage-and-recovery) | Snapshot creation **MUST** materialize exactly one contiguous accepted sequence and record its canonical semantic hash. | `AC-07-025` |
| `REQ-07-026` | [ARC-030](../product-spec.md#74-storage-and-recovery) | Log compaction **MUST** retain a verified recovery base for every supported reconnect and version-history window. | `AC-07-026` |
| `REQ-07-027` | [ARC-030](../product-spec.md#74-storage-and-recovery) | Shared asset creation **MUST** use authorized durable content-addressed upload before any accepted operation makes the asset required for document fidelity. | `AC-07-027` |
| `REQ-07-028` | [ARC-031](../product-spec.md#74-storage-and-recovery) | Authority restore **MUST** create a new epoch and preserve the prior lineage as immutable version history according to retention policy. | `AC-07-028` |
| `REQ-07-029` | [ARC-031](../product-spec.md#74-storage-and-recovery) | Disaster recovery **MUST** meet the collaboration recovery objectives defined by `SLO-14-051` without acknowledging non-durable work. | `AC-07-029` |
| `REQ-07-030` | [ARC-030](../product-spec.md#74-storage-and-recovery) | Downloaded `.str` checkpoints **MUST** remain self-contained or carry explicit authorized external-asset degradation under Volume 06. | `AC-07-030` |

Snapshot triggers include bounded accepted-operation count or bytes, elapsed time, schema migration, explicit version creation, graceful close when useful, and recovery compaction. A client may request a checkpoint, but only the authority may certify the sequence it represents. Provider ETags protect checkpoint objects; they do not order collaborative edits.

## 7. Identity and Session Binding

Identity has three separate meanings:

- **Authentication principal:** verified `(issuer, subject)` plus assurance and tenant context.
- **Story actor:** stable opaque identifier bound server-side to a principal for operation and audit attribution.
- **Display profile:** mutable name, avatar, and optional organization information; never an authorization source.

### 7.1 Identity Requirements

| ID | Parent | Atomic requirement | Acceptance |
|---|---|---|---|
| `REQ-07-031` | [PRE-061](../product-spec.md#67-review-and-collaboration), [PRE-062](../product-spec.md#67-review-and-collaboration) | The service **MUST** derive actor identity from a validated OAuth/OIDC session and ignore identity asserted only inside client messages. | `AC-07-031` |
| `REQ-07-032` | [PRE-062](../product-spec.md#67-review-and-collaboration) | Authorization **MUST** key principals by issuer and subject rather than mutable email, name, or avatar claims. | `AC-07-032` |
| `REQ-07-033` | [PRE-061](../product-spec.md#67-review-and-collaboration) | Each connection **MUST** bind document, actor, client instance, granted capabilities, permission revision, expiry, and a replay-resistant session identifier. | `AC-07-033` |
| `REQ-07-034` | [PRE-061](../product-spec.md#67-review-and-collaboration) | Display profile changes **MUST NOT** alter ownership, grants, audit attribution, or operation identity. | `AC-07-034` |
| `REQ-07-035` | [PRE-062](../product-spec.md#67-review-and-collaboration) | Account linking **MUST** require proof of control for both identities and preserve an auditable reversible mapping. | `AC-07-035` |
| `REQ-07-036` | [PRE-061](../product-spec.md#67-review-and-collaboration) | Session expiry or token refresh failure **MUST** stop new privileged acceptance while preserving acknowledged state and recoverable tentative work. | `AC-07-036` |

**`SCH-07-008 CollaborationSessionGrant`** contains a short-lived opaque session ID, document ID, epoch, actor ID, client instance ID, granted capability set, permission revision, issued/expiry times, token binding or proof-of-possession material where supported, and server signature. It contains no provider access token.

## 8. Presence and Awareness

Presence is an ephemeral, lossy, separately authorized channel. It is not part of the operation log, snapshot, native file, version history, semantic hash, undo stack, or audit trail except for narrowly defined abuse/security events.

### 8.1 Presence Requirements

| ID | Parent | Atomic requirement | Acceptance |
|---|---|---|---|
| `REQ-07-037` | [ARC-001](../product-spec.md#71-canonical-document-model), [PRE-061](../product-spec.md#67-review-and-collaboration) | Presence **MUST** remain logically and durably separate from document state and accepted operations. | `AC-07-037` |
| `REQ-07-038` | [PRE-061](../product-spec.md#67-review-and-collaboration) | Presence messages **MUST** be authenticated, document-scoped, rate-limited, size-bounded, and discardable under load. | `AC-07-038` |
| `REQ-07-039` | [PRE-061](../product-spec.md#67-review-and-collaboration) | Cursor and selection presence **MUST** use slide/document coordinates and stable visible target IDs without granting locks or edit authority. | `AC-07-039` |
| `REQ-07-040` | [PRE-061](../product-spec.md#67-review-and-collaboration) | Presence UI **MUST** tolerate loss, duplication, reordering, disconnect without leave, deleted targets, and stale profile data. | `AC-07-040` |
| `REQ-07-041` | [PRE-061](../product-spec.md#67-review-and-collaboration) | Users **MUST** be able to suppress their fine-grained cursor or selection broadcasting without losing document access. | `AC-07-041` |

**`SCH-07-009 PresenceEnvelope`** contains session ID, server-verified actor display projection, document ID, presence sequence, kind, bounded payload, and server-observed expiry. Email addresses, access tokens, provider file URLs, notes, clipboard content, and private presenter state are forbidden.

Default behavior: cursor updates are coalesced to at most 20 messages per second per active pointer, selection updates send on semantic change, heartbeats are transport-managed where possible, and stale awareness expires without requiring a reliable leave event. These are defaults, not durable delivery promises.

## 9. Roles, Permissions, and Capability Enforcement

### 9.1 Role Baseline

Roles are named bundles; enforcement uses capabilities. A deployment may add narrower roles but cannot silently broaden these baselines.

| Capability | Owner | Co-owner | Editor | Commenter | Viewer | Presenter |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| View document | Yes | Yes | Yes | Yes | Yes | Yes |
| Present authorized revision | Yes | Yes | Yes | No | Policy | Yes |
| Export/download | Yes | Yes | Policy | Policy | Policy | Policy |
| Mutate authored content | Yes | Yes | Yes | No | No | No |
| Create/reply comments | Yes | Yes | Yes | Yes | No | Policy |
| Resolve own thread | Yes | Yes | Yes | Yes | No | No |
| Resolve any thread | Yes | Yes | Policy | No | No | No |
| Invite people/create links | Yes | Yes | Policy | No | No | No |
| Change roles/revoke | Yes | Yes | No | No | No | No |
| Transfer ownership/delete | Yes | Policy | No | No | No | No |

### 9.2 Permission Requirements

| ID | Parent | Atomic requirement | Acceptance |
|---|---|---|---|
| `REQ-07-042` | [PRE-062](../product-spec.md#67-review-and-collaboration) | Every read, mutation, comment, asset, export, presentation, share, and administrative request **MUST** be authorized server-side against its specific capability. | `AC-07-042` |
| `REQ-07-043` | [PRE-062](../product-spec.md#67-review-and-collaboration) | The effective permission **MUST** be the least privilege allowed by direct grant, group grant, link grant, tenant policy, content policy, and explicit deny. | `AC-07-043` |
| `REQ-07-044` | [PRE-062](../product-spec.md#67-review-and-collaboration) | Permission changes **MUST** atomically increment `permissionRevision` and become effective for subsequent acceptance decisions. | `AC-07-044` |
| `REQ-07-045` | [PRE-062](../product-spec.md#67-review-and-collaboration) | The client **MUST** present disabled or absent affordances consistently with its current grant while treating server denial as authoritative. | `AC-07-045` |
| `REQ-07-046` | [PRE-062](../product-spec.md#67-review-and-collaboration) | Ownership transfer **MUST** require explicit confirmation, current-owner authority, target acceptance where policy requires, and an audit event. | `AC-07-046` |
| `REQ-07-047` | [PRE-062](../product-spec.md#67-review-and-collaboration) | Export, copy, print, recording, and presenting capabilities **MUST** be independently policy-controllable rather than inferred from view access. | `AC-07-047` |

**`SCH-07-010 PermissionGrant`** contains grant ID, document ID, principal or unguessable link identity, role/capabilities, issuer, creator actor, creation and optional expiry, status, permission revision, and policy metadata. Secrets and password verifiers are stored only in the authority, never in the `.str` manifest.

## 10. Sharing and Revocation

Supported share scopes are `restricted-principal`, `organization`, and `anyone-with-link` where deployment policy permits. Password protection may add a factor to a link but does not turn client-side manifest checking into authorization.

### 10.1 Sharing Requirements

| ID | Parent | Atomic requirement | Acceptance |
|---|---|---|---|
| `REQ-07-048` | [PRE-062](../product-spec.md#67-review-and-collaboration) | Creating a share **MUST** require an authorized actor to choose recipients or scope, capabilities, expiry, and notification behavior before activation. | `AC-07-048` |
| `REQ-07-049` | [PRE-062](../product-spec.md#67-review-and-collaboration) | Share links **MUST** use high-entropy revocable server-side grants whose secrets are stored hashed or otherwise non-recoverably where verification permits. | `AC-07-049` |
| `REQ-07-050` | [PRE-062](../product-spec.md#67-review-and-collaboration) | Link resolution **MUST** disclose no document metadata before validity, policy, expiry, and authentication requirements are evaluated. | `AC-07-050` |
| `REQ-07-051` | [PRE-062](../product-spec.md#67-review-and-collaboration) | The access-review surface **MUST** enumerate direct, group, organization, and link-derived access with effective capabilities and expiry. | `AC-07-051` |
| `REQ-07-052` | [PRE-062](../product-spec.md#67-review-and-collaboration) | Revocation **MUST** deny new operations and protected reads within `SLO-14-050` and terminate or downgrade active sessions. | `AC-07-052` |
| `REQ-07-053` | [PRE-062](../product-spec.md#67-review-and-collaboration) | Revocation **MUST NOT** claim erasure of copies or exports legitimately obtained before revocation. | `AC-07-053` |
| `REQ-07-054` | [PRE-062](../product-spec.md#67-review-and-collaboration) | Changing a link's scope or capability **MUST** rotate or invalidate the prior grant unless an explicit narrower in-place transition is proven. | `AC-07-054` |
| `REQ-07-055` | [PRE-062](../product-spec.md#67-review-and-collaboration) | Provider-native sharing **MUST** map to Story capabilities explicitly and fail closed when provider role or revocation state cannot be verified. | `AC-07-055` |

**`FLOW-07-003 Revocation`**

1. Authorize the administrative request at the current permission revision.
2. Atomically mark the grant revoked and increment `permissionRevision`.
3. Publish a security control event to active sessions.
4. Reject subsequent mutation, comment, asset, and protected-read requests.
5. Remove revoked sessions from presence and clear protected caches according to policy.
6. Preserve pending local edits only in the revocation recovery surface; do not resubmit them.
7. Record the audit event without exposing document content.

## 11. Comments, Mentions, and Review

Comments are durable authored collaboration data and therefore use the same accepted operation stream. Volume 03 is the sole owner of `CommentThread`, `CommentMessage`, and `CommentAnchor`. This volume owns accepted-operation chronology, actor attribution, permissions, service indexes, subscriptions, notifications, and concurrent lifecycle policy. Notification delivery is derived, retryable side-effect state and is not document authority.

### 11.1 Comment Schema

**`SCH-07-011 CommentCollaborationRecord`** references one canonical Volume 03 thread ID and includes document ID, creation accepted sequence, latest accepted sequence, resolution actor/sequence, service-side subscription IDs, notification cursor, moderation state where applicable, and service tombstone metadata. It never duplicates canonical message bodies, anchor values, or thread status as a second document authority.

**`SCH-07-012 CommentAnchorIndex`** maps a canonical Volume 03 `CommentAnchor` and its `StableAddress` values to searchable document, slide, entity, sub-entity, and text-marker indexes. Derived scene or semantic node IDs may be cached only with the exact resolution revision and a reverse mapping to canonical addresses; they are never durable anchor identity.

**`SCH-07-013 CommentNotificationState`** includes stable delivery ID, canonical thread/message ID, recipient actor ID, permission revision, redacted notification payload class, idempotency key, attempt state, and terminal delivery disposition. It contains no canonical comment body beyond the minimum permission-checked notification excerpt allowed by policy.

### 11.2 Comment Requirements

| ID | Parent | Atomic requirement | Acceptance |
|---|---|---|---|
| `REQ-07-056` | [PRE-060](../product-spec.md#67-review-and-collaboration) | Comment creation, reply, edit, delete, resolve, and reopen **MUST** be typed accepted operations with stable identities. | `AC-07-056` |
| `REQ-07-057` | [PRE-060](../product-spec.md#67-review-and-collaboration) | Comment anchors **MUST** remain navigable across reorder, transform, text edits, and supported target migration or expose an explicit orphaned state. | `AC-07-057` |
| `REQ-07-058` | [PRE-060](../product-spec.md#67-review-and-collaboration) | Mentions **MUST** resolve only to principals discoverable at request time under document and tenant privacy policy. | `AC-07-058` |
| `REQ-07-059` | [PRE-060](../product-spec.md#67-review-and-collaboration) | Notification dispatch **MUST** be idempotent, permission-checked at delivery, and redact inaccessible content. | `AC-07-059` |
| `REQ-07-060` | [PRE-060](../product-spec.md#67-review-and-collaboration) | Resolved and reopened threads **MUST** retain their complete authorized chronology and actor attribution. | `AC-07-060` |
| `REQ-07-061` | [PRE-060](../product-spec.md#67-review-and-collaboration) | A user **MUST** be able to filter, search, and navigate threads by status, slide, anchor, author, mention, and recency without changing document state. | `AC-07-061` |
| `REQ-07-062` | [PRE-060](../product-spec.md#67-review-and-collaboration) | Deleting an anchored object **MUST** preserve its threads as explicitly orphaned or include their deletion in the same visible transaction policy. | `AC-07-062` |

## 12. Audit and Version History

The operation log supports deterministic reconstruction; the audit log supports accountable security and administrative review. They are related but distinct. Audit records must not duplicate arbitrary document content.

### 12.1 Audit Requirements

| ID | Parent | Atomic requirement | Acceptance |
|---|---|---|---|
| `REQ-07-063` | [PRE-062](../product-spec.md#67-review-and-collaboration), [ARC-031](../product-spec.md#74-storage-and-recovery) | The service **MUST** append tamper-evident audit events for access grants, link changes, role changes, revocation, ownership transfer, restore, export policy decisions, and administrative access. | `AC-07-063` |
| `REQ-07-064` | [PRE-061](../product-spec.md#67-review-and-collaboration) | Accepted transactions **MUST** retain actor, intent, epoch, sequence, permission revision, and canonical operation identity sufficient for authorized version history. | `AC-07-064` |
| `REQ-07-065` | [PRE-062](../product-spec.md#67-review-and-collaboration) | Audit access **MUST** require a dedicated capability and expose only fields permitted by privacy and tenant policy. | `AC-07-065` |
| `REQ-07-066` | [ARC-031](../product-spec.md#74-storage-and-recovery) | Restoring a historical version **MUST** preserve the previous head and begin a new authority epoch. | `AC-07-066` |
| `REQ-07-067` | [ARC-031](../product-spec.md#74-storage-and-recovery) | Audit and operation retention **MUST** follow declared minimum, maximum, legal-hold, deletion, and tenant policies without silent indefinite retention. | `AC-07-067` |

**`SCH-07-014 AuditEvent`** contains immutable event ID, server time, event kind, actor or system principal, document ID, affected grant/principal pseudonymous reference, result, policy reason, request correlation ID, permission revision, integrity-chain fields, and retention class. Tokens, passwords, share secrets, raw comment bodies, slide content, and imported asset bytes are forbidden.

## 13. Failure and Rescue Semantics

"Gstack failure/rescue" means every expected failure has a visible state, a bounded rescue action, and evidence that rescue preserves authority and user work. It never means converting failure into a success toast.

| Failure | Required detection | Required rescue | Forbidden response |
|---|---|---|---|
| Transport disconnect | Heartbeat/close/send failure | Enter offline state; persist queue; reconnect with `FLOW-07-002` | Clear pending work or claim shared save |
| Duplicate/retried submit | Idempotency lookup | Return original disposition | Apply twice |
| Missing sequence | Gap in contiguous receive stream | Buffer and fetch gap/snapshot | Apply later records over gap |
| Hash divergence | Scheduled semantic-hash mismatch | Quarantine replica; fetch verified snapshot; retain pending envelopes | Continue editing silently |
| Expired auth | Rejected refresh/session | Pause acceptance; reauthenticate; preserve local work | Send token in collaboration payload |
| Permission downgrade/revoke | Permission revision/control event/server denial | Downgrade UI; stop submit; recovery copy where allowed | Continue using cached role |
| Epoch change | Head response mismatch | Block replay; explicit fork/copy/discard | Rebase automatically across lineage |
| Invalid remote operation | Schema/precondition/hash failure | Reject/quarantine; log safe diagnostics | Mutate partially |
| Asset upload failure | Durable upload not committed | Keep local placeholder and retry/remove | Accept broken durable reference |
| Service write failure | Transactional append failure | No ack; retry idempotently | Ack before durability |
| Snapshot corruption | Digest/schema validation failure | Fall back to prior verified snapshot plus log | Load and repair ad hoc |
| Comment notification failure | Outbox retry exhausted | Keep comment accepted; expose notification health | Roll back comment or duplicate notification |

| ID | Parent | Atomic requirement | Acceptance |
|---|---|---|---|
| `REQ-07-068` | [ARC-031](../product-spec.md#74-storage-and-recovery) | Every collaboration failure state **MUST** preserve acknowledged state, classify tentative state, and expose a bounded recovery action. | `AC-07-068` |
| `REQ-07-069` | [ARC-031](../product-spec.md#74-storage-and-recovery) | Integrity divergence **MUST** quarantine the affected replica from further mutation submission until repaired. | `AC-07-069` |
| `REQ-07-070` | [ARC-031](../product-spec.md#74-storage-and-recovery) | Partial multi-step side effects **MUST** use an idempotent outbox, saga, or compensating action with observable terminal state. | `AC-07-070` |

### 13.1 Provider Dependency Health

**`SM-07-002 Provider dependency health`**

| State | Meaning | Allowed transition or action |
|---|---|---|
| `healthy` | Required provider capability is verified and within policy. | `degraded`, `unavailable`, `outcome-unknown` |
| `degraded` | A non-authoritative capability is impaired or a safe fallback is active. | Continue only declared bounded functions; retry or recover. |
| `unavailable` | Requests cannot complete or a required capability is absent. | Preserve work; use local or alternate recovery; do not claim success. |
| `outcome-unknown` | A mutating request may have committed but its response is ambiguous. | Resolve by stable request ID and provider readback before retry. |
| `recovering` | Health returned and authoritative state is being revalidated. | Reconcile identity, permission, head, sequence, and hashes before `healthy`. |

| Provider failure | Required collaboration result | Required rescue | Forbidden response |
|---|---|---|---|
| Identity provider unavailable | Existing service-issued session remains bounded by its verified grant and expiry. | Retry authentication; preserve acknowledged and tentative state. | Treat cached profile or expired token as authority. |
| Realtime transport unavailable | Accepted history remains in durable authority; presence becomes stale or absent. | Queue local intent; reconnect and catch up by accepted sequence. | Promote peer arrival order to authority or retain false online presence. |
| Collaboration authority unavailable | No new durable acknowledgment is issued. | Keep durable local queue; retry idempotently or create an explicit local fork. | Acknowledge from local application or transport send alone. |
| Snapshot/log object store unavailable | Existing verified base remains readable when cached; compaction stops. | Restore service or fail over to a verified replica before snapshot or compaction resumes. | Delete covered log or synthesize an unverified snapshot. |
| Cloud file provider unavailable | Collaboration authority may continue if independent and policy permits; external `.str` publication remains pending. | Preserve accepted stream and local checkpoint; retry Volume 06 publication. | Relabel collaboration acknowledgment as cloud-file save. |
| Provider permission API unavailable | Effective external grant cannot be verified. | Fail closed for new provider-derived access; retain prior local recovery state. | Trust a cached provider role for a new privileged request. |
| Notification provider unavailable | Accepted comment or share state remains authoritative. | Retry an idempotent redacted outbox and expose delivery health. | Roll back accepted content or send duplicate or unredacted notices. |
| Regional failover or provider migration | One fenced authority generation remains writable. | Verify snapshot, log prefix, permissions, audit chain, and semantic hash before traffic cutover. | Permit old and new authorities to accept concurrently. |

| ID | Parent | Atomic requirement | Acceptance |
|---|---|---|---|
| `REQ-07-071` | [ARC-012](../product-spec.md#72-transactions-history-and-collaboration), [ARC-031](../product-spec.md#74-storage-and-recovery) | A dependency failure **MUST NOT** change accepted-operation authority or acknowledgment meaning. | `AC-07-071` |
| `REQ-07-072` | [ARC-031](../product-spec.md#74-storage-and-recovery) | An ambiguous provider mutation **MUST** be resolved by stable request identity and authoritative readback before retry or failure disposition. | `AC-07-072` |
| `REQ-07-073` | [PRE-061](../product-spec.md#67-review-and-collaboration) | Realtime transport failure **MUST** recover replicas from the durable accepted sequence while treating presence as disposable. | `AC-07-073` |
| `REQ-07-074` | [ARC-030](../product-spec.md#74-storage-and-recovery), [ARC-031](../product-spec.md#74-storage-and-recovery) | Cloud-file provider failure **MUST** keep collaboration acknowledgment separate from checkpoint publication state. | `AC-07-074` |
| `REQ-07-075` | [PRE-062](../product-spec.md#67-review-and-collaboration) | Identity-provider unavailability **MUST NOT** extend authorization beyond the verified service-issued session grant. | `AC-07-075` |
| `REQ-07-076` | [ARC-012](../product-spec.md#72-transactions-history-and-collaboration), [ARC-031](../product-spec.md#74-storage-and-recovery) | Collaboration failover or provider migration **MUST** retain one fenced writable authority generation. | `AC-07-076` |

## 14. Collaboration Observation Contracts

Volume 14 owns every quantified quality target. These contracts define collaboration-specific measurement boundaries and privacy-safe dimensions consumed by those objectives.

| ID | Observation | Measurement boundary |
|---|---|---|
| `OBS-07-001` | Accepted-operation acknowledgment | Client commit to durable acknowledgment; excludes local preview. |
| `OBS-07-002` | Remote accepted-operation visibility | Origin local commit to remote rendered semantic state. |
| `OBS-07-003` | Presence update visibility | Origin send to remote awareness paint; presence loss remains permissible. |
| `OBS-07-004` | Reconnect and snapshot fallback | Connection restoration to editable reconciled state, classified by missed-operation and document profile. |
| `OBS-07-005` | Replica convergence | Final semantic hash after every accepted operation has been delivered. |
| `OBS-07-006` | Revocation enforcement | Authority commit to denied privileged request across active and reconnecting sessions. |
| `OBS-07-007` | Disaster recovery | Last acknowledged sequence and service outage to verified writable recovery. |
| `OBS-07-008` | Pending queue integrity | Crash injection boundary to recovered envelope count, identity, and order. |

## 15. Acceptance Criteria

By normative mapping, each `AC-07-NNN` evaluates exactly `REQ-07-NNN`; the shared suffix is the bidirectional requirement-to-acceptance link.

| ID | Pass condition |
|---|---|
| `AC-07-001` | Authority-split and production-route fixtures prove that one epoch cannot accept divergent heads and that every shared document mutation is traceable to that stream or an enumerated non-document exception. |
| `AC-07-002` | Parallel submission yields a gap-free unique sequence and deterministic broadcast order. |
| `AC-07-003` | Killing every client after acknowledgment still permits snapshot-plus-log reconstruction of the acknowledged semantic hash at every sampled boundary. |
| `AC-07-004` | Capture distinguishes verified base, tentative overlay, and rendered result before and after acknowledgment. |
| `AC-07-005` | Retrying identical envelopes before and after timeout, restart, and reconnect creates one accepted mutation. |
| `AC-07-006` | The shared validator rejects malformed, oversized, stale-epoch, nonexistent-target, precondition-failing, and unauthorized operations atomically at local, authority, and replay boundaries. |
| `AC-07-007` | All permutations in the concurrency corpus converge to the same semantic hash. |
| `AC-07-008` | Undo after interleaved remote changes reverses only the local accepted intent and preserves remote changes. |
| `AC-07-009` | A downloaded and reopened `.str` declares and renders the accepted epoch and sequence it represents. |
| `AC-07-010` | Owner disconnect immediately after another actor's acknowledgment causes no acknowledged data loss. |
| `AC-07-011` | Manipulated client timestamps cannot change canonical conflict outcomes. |
| `AC-07-012` | Concurrent insert, move, and delete fixtures for slides, layers, effects, animations, and component children retain all valid intents and order deterministically. |
| `AC-07-013` | Concurrent multilingual text fixtures preserve graphemes, marks, runs, paragraphs, and stable anchors. |
| `AC-07-014` | Concurrent point, segment, and operand fixtures do not address durable geometry by mutable array index. |
| `AC-07-015` | Delete-versus-edit produces target-gone recovery with no silent loss or resurrection. |
| `AC-07-016` | Rejection visibly rolls back or rebases only the affected tentative intent and leaves accepted state intact. |
| `AC-07-017` | Crash at every offline-queue write boundary recovers every reported local commit exactly once and in order. |
| `AC-07-018` | Headed UI evidence shows accurate local-only, sending, acknowledged, conflict, blocked, and revoked states. |
| `AC-07-019` | Reconnect never submits pending work before current authentication, epoch, permissions, and head are known. |
| `AC-07-020` | Packet loss and retry preserve pending intent order and original idempotency IDs. |
| `AC-07-021` | Restore or new epoch blocks queued old-epoch replay and offers copy, fork, or discard. |
| `AC-07-022` | Offline edits after revocation remain recoverable only as policy permits and never reach the revoked document. |
| `AC-07-023` | A client older than retained log history recovers from snapshot and submits each pending transaction at most once. |
| `AC-07-024` | Two tabs cannot duplicate a shared pending transaction after crash or leader change. |
| `AC-07-025` | Snapshot generation under concurrent writes includes exactly its declared contiguous sequence. |
| `AC-07-026` | Compaction cannot remove the sole valid base for any supported history or reconnect window. |
| `AC-07-027` | Other clients never receive an accepted required asset reference before durable authorized upload verification. |
| `AC-07-028` | Historical restore creates a new epoch while the previous lineage remains inspectable. |
| `AC-07-029` | Disaster exercise meets `SLO-14-051` with no acknowledged-operation loss. |
| `AC-07-030` | Shared checkpoint round trip preserves or explicitly reports every asset. |
| `AC-07-031` | Forged `actorId`, email, role, or profile fields in a message do not alter server-derived identity. |
| `AC-07-032` | The same email under distinct issuers does not alias principals, and an email change does not lose grants. |
| `AC-07-033` | Replayed, expired, wrong-document, and wrong-client session grants are denied. |
| `AC-07-034` | Profile rename or avatar change leaves ownership, grants, history, and attribution stable. |
| `AC-07-035` | Account link and unlink require proof, are audited, and preserve recoverable attribution. |
| `AC-07-036` | Token expiry pauses acceptance and retains acknowledged and tentative states correctly. |
| `AC-07-037` | Presence traffic never changes semantic hash, dirty state, undo history, native file, or version history. |
| `AC-07-038` | Presence flood and oversize tests are throttled or rejected without delaying durable operations beyond budget. |
| `AC-07-039` | Remote awareness follows zoom and transform and ignores deleted targets without granting edit locks. |
| `AC-07-040` | Dropped, duplicate, reordered, and missing-leave presence produces bounded stale UI and no document error. |
| `AC-07-041` | Cursor and selection privacy controls suppress fine-grained broadcasts while editing continues. |
| `AC-07-042` | Direct API tests deny each capability to every unauthorized baseline role. |
| `AC-07-043` | Effective-access fixtures prove explicit deny and tenant policy cannot be bypassed by link or cached direct grant. |
| `AC-07-044` | Permission-revision changes are atomic with the administrative decision. |
| `AC-07-045` | Headed UI and direct API denial agree, and forged enabled controls do not bypass enforcement. |
| `AC-07-046` | Ownership transfer has two-party or policy confirmation, one resulting owner policy, and audit evidence. |
| `AC-07-047` | View-only grants cannot export, copy, print, record, or present when those capabilities are disabled. |
| `AC-07-048` | Share creation review shows scope, capability, expiry, and notification before activation. |
| `AC-07-049` | Link tokens meet entropy policy, are absent from logs and referrers, and cannot be recovered from stored verifier data. |
| `AC-07-050` | Invalid or expired links reveal no title, thumbnail, owner, collaborator, or content metadata. |
| `AC-07-051` | Access review explains every effective path and highlights links and expiry. |
| `AC-07-052` | Revocation matrix meets `SLO-14-050` for WebSocket, API, asset, comment, export, and reconnect paths. |
| `AC-07-053` | Revocation copy accurately states that prior downloads cannot be recalled. |
| `AC-07-054` | Link rotation invalidates old URLs and active sessions according to policy. |
| `AC-07-055` | Provider outage or ambiguous provider role fails closed with actionable recovery. |
| `AC-07-056` | Concurrent comment operations converge and survive save, reopen, and version history. |
| `AC-07-057` | Anchor corpus survives reorder, transforms, Unicode text edits, and target migration or becomes explicitly orphaned. |
| `AC-07-058` | Mention search excludes undiscoverable principals and stores actor IDs rather than mutable labels. |
| `AC-07-059` | Notification retry sends once, rechecks access, and redacts after revocation. |
| `AC-07-060` | Resolve and reopen retain ordered chronology and actor attribution. |
| `AC-07-061` | Filters and navigation work through real UI without mutating the presentation. |
| `AC-07-062` | Deleting an anchor never silently deletes its discussion. |
| `AC-07-063` | Required administrative events form a tamper-evident ordered audit chain. |
| `AC-07-064` | Version history attributes accepted intent without using mutable display identity as key. |
| `AC-07-065` | Unauthorized users cannot enumerate audit actors or events. |
| `AC-07-066` | Restore is atomic, audited, and starts a new epoch. |
| `AC-07-067` | Retention expiry, legal hold, and deletion jobs are exercised with immutable evidence. |
| `AC-07-068` | Each failure row has headed or integration evidence for detection, state, rescue, and preserved work. |
| `AC-07-069` | Hash mismatch stops submission until verified repair, and pending envelopes survive repair. |
| `AC-07-070` | Failure injection between side-effect steps reaches one observable terminal or compensated state without duplicate effects. |
| `AC-07-071` | Identity, transport, authority, object-store, cloud-file, permission, and notification outages leave accepted sequence, acknowledgment classification, and authority identity unchanged. |
| `AC-07-072` | Timeout before and after provider commit resolves to one outcome by request-ID lookup or readback and never creates a duplicate mutation or grant. |
| `AC-07-073` | Dropped transport and relay replacement recover each replica from the durable sequence while stale presence expires without document mutation. |
| `AC-07-074` | During cloud-file outage, accepted collaboration remains reconstructable while UI and receipts continue to report external publication as pending or failed. |
| `AC-07-075` | After identity-provider outage and session expiry, cached claims cannot authorize any new privileged request; policy-compliant local recovery remains available. |
| `AC-07-076` | Regional failover and provider-migration fault injection never expose two writable epochs and finish with matching log prefix, permissions, audit chain, and semantic hash. |

## 16. Required Test and Evidence Protocols

| ID | Protocol | Required evidence |
|---|---|---|
| `TEST-07-001` | Deterministic model tests permute concurrent typed operations, duplicate delivery, reorder, gaps, and replay. | Input seed, algorithm/version, operation trace, final hashes. |
| `TEST-07-002` | Multi-process integration tests run a real authority, durable store, asset store, and at least three independent replicas. | Service config, fault schedule, accepted log, replica hashes. |
| `TEST-07-003` | Offline/crash tests terminate clients at every queue, submit, append, ack, snapshot, and compaction boundary. | Crash point, recovered queue, accepted disposition, no-loss assertion. |
| `TEST-07-004` | Headed multi-context E2E exercises share, edit, text, reorder, comments, offline, reconnect, undo, role change, and revocation through production UI. | Visible browser video/screens, DOM/state capture, server log correlation, hashes. |
| `TEST-07-005` | Security tests forge identity, role, epoch, base, operation targets, link tokens, sessions, and provider responses. | Sanitized request/response, denial reason, unchanged head. |
| `TEST-07-006` | Artifact tests inspect snapshots, log segments, `.str` checkpoints, asset roots, and audit exports. | Parsed semantic fields and integrity digests, not file existence alone. |
| `TEST-07-007` | Soak/load tests exercise the Volume 14 collaboration profiles with disconnect churn and presence flood. | Percentiles, error rates, capacity, queue age, memory, convergence. |
| `TEST-07-008` | Manual assistive-technology review covers collaborator list, awareness announcements, comments, access review, conflict, and revocation recovery. | Versioned checklist and observations per Volume 15. |

Browser evidence from `TEST-07-004` is valid only in headed mode. Captures must be agenda-free: record the raw accepted stream, replica states, UI/DOM, execution events, and artifacts before detectors judge convergence or anomalies.

**`EVD-07-001 Collaboration conformance bundle`** must include revision, build, environment, authority schema/version, fixtures, random seeds, test IDs, requirement/criterion links, start/end timestamps, raw logs, semantic hashes, screenshots/video for headed workflows, parsed artifact reports, failure-injection schedule, result, and known limitations. A green filename or isolated mock is not evidence of product completion.

## 17. Traceability and Release Gate

| Requirement group | Parent capabilities | Primary protocols |
|---|---|---|
| `REQ-07-001` through `REQ-07-030` | `ARC-010` through `ARC-012`, `ARC-030`, `ARC-031`, `PRE-061` | `TEST-07-001` through `TEST-07-007` |
| `REQ-07-031` through `REQ-07-036` | `PRE-061`, `PRE-062` | `TEST-07-004`, `TEST-07-005` |
| `REQ-07-037` through `REQ-07-041` | `ARC-001`, `PRE-061` | `TEST-07-004`, `TEST-07-007`, `TEST-07-008` |
| `REQ-07-042` through `REQ-07-055` | `PRE-062` | `TEST-07-004`, `TEST-07-005`, `TEST-07-008` |
| `REQ-07-056` through `REQ-07-062` | `PRE-060` | `TEST-07-001`, `TEST-07-004`, `TEST-07-008` |
| `REQ-07-063` through `REQ-07-070` | `PRE-061`, `PRE-062`, `ARC-031` | `TEST-07-002`, `TEST-07-005`, `TEST-07-006` |
| `REQ-07-071` through `REQ-07-076` | `PRE-061`, `PRE-062`, `ARC-012`, `ARC-030`, `ARC-031` | `TEST-07-002` through `TEST-07-007` |

Collaboration release conformance requires all applicable criteria, zero unresolved convergence/hash divergence, zero acknowledged-operation loss, server-side permission enforcement, revocation evidence, headed multi-client rescue evidence, and an accepted Volume 15 evidence bundle. Current isolated collaboration modules and tests are useful foundations but do not satisfy this gate by themselves.

## 18. Source Adoption and Open Decisions

This volume adopts useful concepts from:

- [Collaboration Protocol](../../specs/collaboration/collaboration-protocol.md), for small typed messages and channel separation;
- [State Synchronization Engine](../../specs/collaboration/state-sync-engine.md), for optimistic replicas, offline queues, and local undo intent;
- [Collaborative Save Protocol](../../specs/collaboration/storage/collaborative-save-protocol.md), for checkpoints, assets, and failure awareness, while superseding owner-browser save authority;
- [Sharing and Permissions](../../specs/collaboration/sharing-permissions.md), for provider abstraction and role vocabulary, while superseding client-side authorization and manifest secrets;
- [Collaboration Identity](../../specs/collaboration/identity/collaboration-identity.md) and related identity specifications, subject to server-verified issuer/subject identity;
- [Collaboration Eval Taskflow](../../automation/eval-loop/taskflows/27-collaboration.md), as scenario input rather than coverage evidence.

The following implementation choices remain open decisions under Volume 00 and require globally allocated ADRs before production:

| ID | Decision/question | Default in force | Owner | Review trigger | Affected requirements/contracts | Blocking class |
|---|---|---|---|---|---|---|
| `OD-07-001` | Transactional log and snapshot storage technology | Use an append-only durable log plus immutable verified snapshots; product semantics cannot depend on vendor-specific ordering. | Collaboration Engineering | Before selecting production persistence infrastructure | `REQ-07-001` through `REQ-07-010`, `SCH-07-001` through `SCH-07-004` | `R1-blocking` |
| `OD-07-002` | Typed concurrency algorithm per rich-text and ordered-collection family | Use the algorithm-independent operation contracts in Volumes 04 and 07; no production claim until the deterministic corpus passes. | Document and Collaboration Engineering | Before implementing the first shared rich or ordered operation family | `REQ-07-007` through `REQ-07-016`, `TEST-07-001` | `R1-blocking` |
| `OD-07-003` | Snapshot cadence and reconnect/version-history retention windows | Retain enough log and verified snapshots to satisfy Volume 14 recovery targets and Volume 15 history profiles. | Collaboration and Storage Engineering | Before R1 conformance-profile acceptance | `REQ-07-023` through `REQ-07-030`, `SLO-14-048`, `SLO-14-051` | `R1-blocking` |
| `OD-07-004` | Tenant, group, and provider-role federation model | Direct Story grants are authoritative; unverified provider roles fail closed. | Identity and Security | Before organization/group sharing ships | `REQ-07-042` through `REQ-07-055`, Volume 13 | `non-blocking` |
| `OD-07-005` | Regional placement, disaster recovery, and data residency | One fenced writable region per document lineage; no cross-region active-active acceptance. | Platform, Security, Privacy | Before multi-region deployment or regulated-data support | `REQ-07-029`, `REQ-07-076`, `SLO-14-051` | `non-blocking` |

No completion claim is made by this draft. The July 10, 2026 capability audit classifies the collaboration engine and sharing UI as partial, comments as missing, and integrated multi-client convergence as unproven.

## 19. Identifier Counts

| Namespace | Count | Range |
|---|---:|---|
| Requirements | 76 | `REQ-07-001` through `REQ-07-076` |
| Schemas | 14 | `SCH-07-001` through `SCH-07-014` |
| Invariants | 10 | `INV-07-001` through `INV-07-010` |
| State machines | 2 | `SM-07-001` through `SM-07-002` |
| Flows | 3 | `FLOW-07-001` through `FLOW-07-003` |
| Observation contracts | 8 | `OBS-07-001` through `OBS-07-008` |
| Acceptance criteria | 76 | `AC-07-001` through `AC-07-076` |
| Test protocols | 8 | `TEST-07-001` through `TEST-07-008` |

The counts above describe this draft inventory and do not imply implementation or conformance.