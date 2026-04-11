# The Agnostic Evaluation Loop — Framework Specification

> **Version**: 2.0  
> **Date**: April 6, 2026  
> **Scope**: A technology-agnostic framework for evaluating feature correctness in applications where output is non-deterministic. Evaluation criteria are derived entirely from user expectations and UI taskflows — not from implementation details.  
> **Status**: Codified from proven practice across chat rendering, todo panel, multi-window, WRM, insight charts, and image restore implementations.

---

## 0. What "Agnostic" Means

The evaluation is **agnostic of the technology used to produce the outcome.** Whether the UI is built with React, Vue, native code, or anything else — whether the backend uses an LLM, a rule engine, or a human operator — the evaluation doesn't care. It cares about one thing: **does the user see what they should see, given what they did?**

The evaluation criteria come from:
- **Taskflows**: step-by-step descriptions of what the user does and what the system should show
- **User expectations**: what a reasonable person would expect to see after each action
- **UI invariants**: properties that must always hold regardless of content (e.g., a progress bar can't exceed 100%, a spinner must eventually stop, completed work must be visible)

The technology (React, Zustand, Electron IPC, DOM selectors, store shapes) is referenced **only** in Step 3 (Plan Recording) — to figure out how to capture evidence of what the user sees. The evaluation criteria themselves never depend on implementation details. If the app were rewritten in a completely different stack but the taskflows stayed the same, the evaluation criteria would be identical. Only the capture mechanism would change.

---

## 1. The Problem This Solves

Traditional testing assumes deterministic output: given input X, expect output Y. This breaks when:

- An AI agent generates the content the UI renders — you can't assert "the response should be exactly this"
- Multiple async processes interact (streaming, tool calls, parallel threads) — timing-dependent behavior can't be unit-tested
- The feature only has issues under real usage conditions — mocked tests pass while the real app fails
- Edge cases emerge from the LLM's behavior, not from code paths you can enumerate

The Agnostic Evaluation Loop solves this by **observing the actual running system from the user's perspective, recording what the user would see, and checking invariants that must hold regardless of what content was produced or what technology produced it.**

---

## 2. The Six-Step Framework

Every evaluation loop implementation follows these six steps, in order. Each step depends on the previous one being done well. Skip a step and the loop produces noise instead of signal.

```
┌─────────────────────────────────────────────────────────────┐
│ Step 1: DEFINE — What the user should see                   │
│         "Start from the user, not the code"                │
├─────────────────────────────────────────────────────────────┤
│ Step 2: ENUMERATE — Every user-observable behavior            │
│         "If it's not in the list, it won't be checked"      │
├─────────────────────────────────────────────────────────────┤
│ Step 3: PLAN RECORDING — How to capture the evidence         │
│         "Tech enters here — only to plan capture"           │
├─────────────────────────────────────────────────────────────┤
│ Step 4: CAPTURE — Record the real system running              │
│         "Mock nothing. Real app, real APIs."                │
├─────────────────────────────────────────────────────────────┤
│ Step 5: DETECT — Find anomalies in the recording              │
│         "Two eyes: one deterministic, one semantic"         │
├─────────────────────────────────────────────────────────────┤
│ Step 6: CONVERGE — Fix, re-run, repeat until clean            │
│         "The loop is the test"                              │
└─────────────────────────────────────────────────────────────┘
```

**The boundary:** Steps 1–2 are entirely about user expectations. Step 3 is where technology enters — only to plan how to capture evidence. Steps 4–6 execute the capture and analysis.

---

## 3. Step 1: DEFINE — What the User Should See

**Principle**: You cannot evaluate what you haven't defined. Before writing any recording code or detectors, you need a complete description of what the user should experience — written from the user's perspective, not from the code's perspective.

### What "Define" Means

Not "document the DOM." Not "read the source code." Define means:
- The taskflows: what the user does step-by-step, and what they should see at each step
- The invariants: properties that must always hold from the user's perspective (a progress bar can't go backwards, a spinner must eventually stop, the answer must be visible)
- The edge cases: what happens on cancel, error, timeout, concurrent operations
- The content delivery contract: what counts as the system having successfully delivered its output to the user

The definition is grounded in **user expectations**, not implementation.

### How to Do It

**A. Document the taskflows.** Write out every user flow step-by-step, with expected system behavior at each step. This is the primary source of evaluation criteria. Not just the happy path — include what happens on close, cancel, error, concurrent operations.

```
Example (Multi-Window TF-2: Focus Other Window):
  1. User in Window 1 → Ctrl+K → clicks Thread B (in Window 2)
  2. EXPECTED: Window 2 focused. Window 1 stays on its thread.
  3. EDGE: If Window 2 was closed between check and focus → graceful fallback

Example (Chat Thread: Agent executes tools and synthesizes):
  1. User submits "Show me my top apps this week"
  2. EXPECTED: Agent shows progress (tools running), then delivers a visible answer with data
  3. INVARIANT: The answer must be visible without expanding collapsed tool cards
  4. EDGE: If tools fail, the error must appear at the point of failure, not suppressed
```

**B. Document the user-visible invariants.** These are properties a user would expect to always hold, expressed without reference to implementation:

```
Example:
  - Progress indicator: if work is happening, the user sees feedback. When work stops, feedback stops.
  - Completion: items shown as "done" stay done. Items shown as "in progress" eventually resolve.
  - Ordering: things appear in the order they happened. No reordering after the fact.
  - Visibility: the answer the user asked for is visible without digging into collapsed sections.
  - Consistency: if two views show the same data, they agree.
```

**C. Document the content delivery contract.** What counts as the system having successfully answered the user?

```
Example:
  - A completed turn with tool executions but no visible assistant message = delivery failure
  - Data locked inside collapsed tool cards is not "delivered" — the user can't see it
  - A chart that renders on page reload but not during live streaming = delivery failure
```

**D. Reference the DOM/store structure for capture planning (Step 3 only).** The implementation details (CSS classes, data attributes, store shapes) are documented separately as input to Step 3. They inform *how to capture evidence*, not *what to evaluate*.

```
Example (capture reference, used in Step 3):
  Todo panel: [data-testid="todo-panel"] > [role="list"] > [role="listitem"][data-status]
  Progress bar: [role="progressbar"][aria-valuenow]
  These selectors are HOW we observe the invariants. The invariants themselves
  ("progress must match completion ratio") are technology-agnostic.
```

### Why This Matters

If your evaluation criteria come from the source code, you're testing whether the code does what the code says — a tautology. If they come from user expectations and taskflows, you're testing whether the user gets what they should get. The second catches bugs the first never will.

---

## 4. Step 2: ENUMERATE — Exhaustive User-Observable Behavior Checklist

**Principle**: If a behavior isn't in the enumeration, it won't be checked. The enumeration is the contract between the user expectations (Step 1) and the detectors (Step 5).

### How to Enumerate

For each step in each taskflow, ask what the user should observe:

| Question | Yields |
|---|---|
| What should the user see after this action? | Rendering integrity checks |
| What should change when state transitions? | State transition checks |
| What numbers/counts should be consistent? | Arithmetic consistency checks |
| Does what the user sees match what the system believes? | Display↔truth sync checks |
| What should the user NEVER see? | Leak/corruption checks |
| Can the user navigate and interact without a mouse? | Accessibility checks |
| What should be true across TIME (not just at one moment)? | Temporal checks |
| What should be true across WINDOWS / VIEWS? | Cross-context checks |

### Organize by Failure Category

Group detectors by the TYPE of failure they catch, not by which component they target. This makes the anomaly report actionable — "you have 3 rendering integrity issues and 2 state sync issues" is more useful than "you have 5 issues in TodoPanel."

```
Example categories (from todo eval loop):
  Category A: Item Rendering Integrity — does each todo item render correctly?
  Category B: Progress Arithmetic — does the progress bar match the data?
  Category C: Sort & Layout — are items in the right order?
  Category D: Store↔DOM Sync — does the DOM match the Zustand store?
  Category E: Panel & Badge — do aggregate indicators match?
  Category F: Chat Integration — does the todo panel respond to chat events?
  Category G: Accessibility — do ARIA roles and labels hold?
  Category H: Cross-Snapshot Temporal — do things change correctly over time?

Example categories (for multi-window):
  Category A: Window-Session Binding — does each window show the right thread?
  Category B: Cross-Window Consistency — do all Ctrl+K dropdowns agree?
  Category C: Lifecycle Integrity — do close/hide/restore work correctly?
  Category D: Title Synchronization — do window titles match thread titles?
  Category E: Registry Persistence — does quit/restart restore correctly?
  Category F: Mini Composer Routing — do prompts go to the right window?
  Category G: Processing Continuity — does background processing survive window close?
```

### The Detector Catalog

Each enumerated check becomes a formal detector entry:

```
DETECTOR: ITEM_MISSING_STATUS
  Category:  A (Item Rendering Integrity)
  Severity:  critical
  Rule:      Every [role="listitem"] inside a todo list MUST have a data-status attribute
  Check:     items.filter(i => !i.dataStatus).length === 0
  Fires when: A todo item exists in the DOM without a status attribute
  Why:       Without status, the item can't be styled, sorted, or tracked
```

Every detector must specify:
1. A machine-readable **code** (for aggregation)
2. A **category** (for grouping in reports)
3. A **severity** (critical = breaks feature, warning = suspicious, info = cosmetic)
4. The **rule** it checks (in plain English)
5. The **implementation** (the boolean expression)
6. **When it fires** (what DOM state triggers it)
7. **Why it matters** (what user-facing problem it catches)

---

## 5. Step 3: PLAN RECORDING — How to Capture the Evidence

**Principle**: You can only detect what you record. Record too little and you miss issues. Record too much and signal drowns in noise.

**Critical design rule: the recording format must be GENERIC and VERSATILE — not shaped to fit known detectors.** The recording serves two consumers (heuristic detectors AND semantic/LLM evaluation), and the semantic evaluation is open-ended. If the recording only captures what the heuristic detectors check, the semantic evaluation has nothing to work with. The recording must capture enough structured state that *any* anomaly — including ones you haven't thought of yet — can be detected after the fact.

**This is where technology enters the framework.** Steps 1–2 defined what the user should see (technology-agnostic). This step figures out *how* to observe and record evidence of what the user actually sees, using the specific technology stack of the application. If the app were rewritten in a different stack, Steps 1–2 would stay identical. Only this step and its downstream implementation (Steps 4–6) would change.

### Three Recording Layers

Every recording captures THREE independent layers. The separation is critical — anomalies show up as divergences *between* layers.

#### Layer 1: Backend Events (what the system did)

Record EVERY event crossing process boundaries (IPC, WebSocket, API calls). Don't filter at capture time. Filtering is for analysis.

```typescript
interface BackendEvent {
  wallClockMs: number;      // performance.now()
  wallClockISO: string;     // ISO 8601 timestamp
  channel: string;          // IPC channel name
  type: string;             // Event type (e.g., 'assistant.turn_start')
  payload: unknown;         // Full event payload — never truncated
}
```

This is the system's ground truth. The backend said it produced X at time T. Did the user see X?

#### Layer 2: Component State Tree (what the UI shows)

Capture the UI as a **hierarchical tree of typed components with semantic state** — not as flat fields or raw DOM. Each node in the tree represents a user-visible component with its current state.

```typescript
interface ComponentNode {
  type: string;             // 'turn' | 'user-message' | 'assistant-message' | 'tool-card' | 'tool-group' | 'plan-card' | 'alert' | 'loading-indicator' | 'reasoning' | 'image' | 'chart'
  id: string;               // Stable identifier for cross-snapshot tracking
  state: string;            // Component-specific state ('WAITING' | 'HAS_CONTENT' | 'COMPLETE' | 'running' | 'complete' | 'error' | 'expanded' | 'collapsed' ...)
  contentHash: number;      // Hash of visible content (for mutation detection)
  visible: boolean;         // Is this component actually visible to the user?
  position: number;         // DOM order index among siblings
  timestamp: string;        // When this state was last observed
  children: ComponentNode[]; // Child components in DOM order
  properties: Record<string, unknown>; // Component-specific properties (label, text length, progress %, etc.)
}
```

**Why a tree, not flat fields.** Flat fields (e.g., `hasLoadingIndicator: boolean`) lose the relationship between components. A tree preserves: "this loading indicator is inside this turn, which is in COMPLETE state." That relationship is what makes the immutability rule ("once COMPLETE, no descendant changes") possible as a single generic rule instead of a per-component hardcoded detector.

**Example tree snapshot:**
```json
{
  "timestamp": "2026-04-06T10:55:56.000Z",
  "tree": [
    {
      "type": "turn", "id": "turn-0", "state": "COMPLETE", "contentHash": 48291,
      "visible": true, "position": 0,
      "children": [
        { "type": "user-message", "id": "um-0", "state": "rendered", "contentHash": 12345, "visible": true, "position": 0, "children": [], "properties": { "text": "What is the capital of France?" } },
        { "type": "tool-group", "id": "tg-0", "state": "collapsed", "contentHash": 0, "visible": true, "position": 1, "children": [
          { "type": "tool-card", "id": "tc-0", "state": "complete", "contentHash": 67890, "visible": true, "position": 0, "children": [], "properties": { "label": "search", "hasSpinner": false } }
        ], "properties": {} },
        { "type": "assistant-message", "id": "am-0", "state": "rendered", "contentHash": 22222, "visible": true, "position": 2, "children": [], "properties": { "textLength": 450, "svgCount": 0 } },
        { "type": "loading-indicator", "id": "li-0", "state": "hidden", "contentHash": 0, "visible": false, "position": 3, "children": [], "properties": {} }
      ],
      "properties": { "turnState": "COMPLETE", "isProcessing": false }
    }
  ]
}
```

#### Layer 3: Mutation Timeline (how the UI state changed over time)

Built by diffing consecutive component state trees. Each entry records one state change on one component.

```typescript
interface Mutation {
  timestamp: string;
  nodeId: string;           // Which component changed
  nodeType: string;         // Type of component
  field: string;            // Which field changed ('state' | 'contentHash' | 'visible' | 'position' | ...)
  oldValue: unknown;
  newValue: unknown;
  parentState: string;      // State of the parent node at mutation time (critical for immutability checking)
}
```

The mutation timeline is the primary input for temporal invariant rules (see Step 5). It's also a diagnostic artifact — when something goes wrong, you can see exactly when and how it changed.

### Capture Triggers

| Trigger | Why | Frequency |
|---|---|---|
| **Backend event received** | Catches state BEFORE rendering | Per-event |
| **After rendering** (`requestAnimationFrame` after state update) | Catches state AFTER rendering | Per-event |
| **Polling interval** (250ms) | Catches animations, timers, transient states | Every 250ms |
| **User action** (prompt submit, cancel click) | Captures the trigger point | Per-action |

### Where Records Live

```
test-results/<feature>-eval/<scenario>-<timestamp>/
  ├── backend-events.json      (Layer 1: ALL backend events with full payloads)
  ├── state-snapshots.json     (Layer 2: component state trees at each capture point)
  ├── mutation-timeline.json   (Layer 3: every state change with timestamps)
  ├── semantic-eval-input.json (compiled narrative for LLM evaluation)
  ├── anomaly-report.json      (aggregated anomalies from both heuristic and semantic eval)
  └── screenshots/             (visual snapshots at key moments)
```

---

## 6. Step 4: CAPTURE — Record the Real System

**Principle**: Mock nothing. Launch the real application. Hit real APIs. Use real data. Non-determinism is the point.

### Why No Mocking?

| Mocked Test | Eval Loop |
|---|---|
| Tests YOUR code against YOUR expectations | Tests YOUR code against REAL behavior |
| Passes when your mock is correct | Passes when the real system works |
| Never catches integration issues | Only catches real issues |
| Runs in CI (fast, deterministic) | Runs manually (slow, non-deterministic) |
| "The test passes" means nothing if the mock is wrong | "Zero anomalies" means the real feature works |

### The Capture Architecture

```
┌──────────────────────────────────────────────────────────────┐
│  Playwright Test Process                                      │
│                                                               │
│  ┌──────────────────┐  ┌──────────────────────────────┐      │
│  │  Scenario Runner  │  │  Report Writer                │      │
│  │  - launch app     │  │  - backend-record.json        │      │
│  │  - submit prompts │  │  - frontend-record.json       │      │
│  │  - wait for idle  │  │  - anomaly-report.json        │      │
│  │  - handle dialogs │  │  - summary.json               │      │
│  └──────┬───────────┘  └──────────────────────────────┘      │
│         │                                                     │
│         │ page.evaluate()                                     │
│         ▼                                                     │
│  ┌────────────────────────────────────────────────────────┐   │
│  │  Injected Code (runs in Electron renderer)             │   │
│  │                                                        │   │
│  │  ┌──────────────┐  ┌──────────────────────────────┐   │   │
│  │  │ IPC Recorder  │  │ CAPTURE_FN                    │   │   │
│  │  │ (intercepts   │  │ (reads DOM + store + runs     │   │   │
│  │  │  all events)  │  │  all detectors inline)        │   │   │
│  │  └──────────────┘  └──────────────────────────────┘   │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐   │
│  │  Post-Run Analysis                                     │   │
│  │  - Aggregate inline anomalies                          │   │
│  │  - Cross-snapshot temporal detectors                    │   │
│  │  - LLM gap-report analysis                             │   │
│  └────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

### Scenario Design

Scenarios are **user behavior patterns**, not feature tests. The prompts exercise the feature naturally. Whatever the system does in response, the recording captures it and detectors evaluate it.

```
Good scenario:
  "Make a plan to organize the files in my home directory"
  "Execute step 1."
  "Continue with the next step."

Why it's good:
  - Exercises plan creation (todo panel populates)
  - Exercises step-by-step execution (items transition in-progress → done)
  - Exercises continuation (new items discovered, sort order changes)
  - Non-deterministic: the agent may create 3 steps or 7
  - The detectors don't care HOW MANY steps — they check invariants

Bad scenario:
  "Create 3 todos: buy milk, call mom, fix bike"

Why it's bad:
  - Deterministic expectation (exactly 3 items)
  - Doesn't exercise real taskflows (no plan, no execution, no transitions)
  - Fragile: if the agent interprets differently, the "test" fails when the feature works
```

---

## 7. Step 5: DETECT — Find Anomalies

**Principle**: Three complementary mechanisms detect different classes of anomalies. No single mechanism is sufficient.

### Mechanism 1: Temporal Invariant Rules (Runtime Verification)

The most powerful detection mechanism. Rather than writing a detector for each known bug, express the rendering principles as **temporal rules over the mutation timeline**. These rules catch any violation — including bugs you haven't seen yet — because they check properties of the state evolution, not specific states.

This approach is based on **runtime verification** — a formal methods discipline pioneered at NASA Ames for spacecraft software, applied here to UI rendering. The key insight: instead of asking "did bug X happen?", ask "did the state evolve according to the rules?"

**Temporal rule types:**

| Rule Type | Pattern | Example |
|---|---|---|
| **Immutability (□ once)** | Once condition C is true, property P never changes | "Once turn.state = COMPLETE, no descendant's contentHash changes" |
| **Eventuality (◇)** | If condition C becomes true, condition D must eventually become true | "If loading-indicator.visible = true, it must eventually become false" |
| **Monotonicity (↑)** | A value only moves forward through an ordered sequence | "Turn state only transitions: idle → WAITING → HAS_CONTENT → COMPLETE" |
| **Immediate (○)** | Condition C must hold within N ms of trigger T | "Within 500ms of turn creation, a loading-indicator must become visible" |
| **Quantitative (≥/≤)** | Count constraint between related nodes | "Count of visible loading indicators ≥ count of tool-cards with state=running" |
| **Structural (∄)** | A node is never removed once created | "Once a turn node exists in the tree, it is never absent in subsequent snapshots" |

**Example rules derived from rendering principles:**

```
RULE: immutability (from P5, P9)
  "Once node.state = COMPLETE, no descendant's contentHash may change"
  → This single rule catches: completed text mutation, tool result mutation,
    plan card mutation, segment order mutation, alert mutation, user message mutation
  → Replaces 6+ individual hardcoded detectors with one temporal property

RULE: progress_resolution (from P7)
  "If node.type = loading-indicator AND visible = true,
   it must eventually (within the session) become visible = false"
  → Catches orphan spinners, stuck progress, loading in COMPLETE turns

RULE: monotonic_state (from P7, P10)
  "Turn state transitions must follow: idle → WAITING → HAS_CONTENT → COMPLETE
   Backward transitions are violations (unless new prompt reactivation)"
  → Catches turn state regression

RULE: eager_rendering (from P3)
  "Within 500ms of user-action 'submit', a turn node must exist AND
   a loading-indicator descendant must have visible = true"
  → Catches delayed rendering after submit

RULE: content_delivery (from P0, content delivery rule)
  "If turn has tool-card descendants with state=complete AND turn.state=COMPLETE,
   turn must have assistant-message descendant with textLength > 0"
  → Catches tools ran but no synthesis visible

RULE: append_only (from P4)
  "Once a node exists in the tree, it must exist in all subsequent snapshots
   (exception: cancel transitions)"
  → Catches disappeared turns, removed content

RULE: parallel_progress (from P2, P12)
  "Count of descendants where type=loading-indicator AND visible=true
   must be ≥ count of descendants where type=tool-card AND state=running"
  → Catches parallel work invisible to user
```

**Why this is fundamentally better than per-bug detectors:**
- ~10 temporal rules replace 60+ hardcoded detectors
- A new bug type is caught by existing rules if it violates any temporal property
- The mutation timeline is a diagnostic artifact — when a rule fires, you see exactly when and how the violation occurred
- Rules map directly to rendering principles — each rule cites the principle it enforces

### Mechanism 2: Heuristic Detection (Deterministic)

Heuristic detectors are **boolean invariant checks** that run at capture time, inside the renderer process, on every snapshot. Each detector checks a user-observable property — something the user would notice if it were wrong. These complement temporal rules by catching point-in-time violations that don't require the full mutation timeline.

**Design rules for heuristic detectors:**

1. **User-observable.** The rule must correspond to something the user can see or experience.

2. **Boolean invariant.** Either violated or not. No scoring, no thresholds, no gray areas.

3. **Independent.** Each detector fires regardless of what others found.

4. **Grounded in taskflows.** Every rule traces back to a user expectation from Step 1.

5. **Categorized by failure type.** Group by what KIND of user-visible problem they catch.

Heuristic detectors are NOT the primary detection mechanism. They are a fast, inline supplement to temporal rules. If a property can be expressed as a temporal rule over the mutation timeline, prefer that. Use heuristic detectors for:
- Point-in-time content checks (e.g., `[object Object]` visible, raw fence text leaked)
- Cross-layer comparisons (e.g., backend has chart spec but DOM has no SVG)
- Things that don't involve state evolution (e.g., accessibility attributes present)

### Mechanism 3: Semantic Evaluation (Open-Ended)

Semantic evaluation is an **open-ended analysis** of the full recording by an LLM (or human evaluator). It catches what neither temporal rules nor heuristic detectors can — because it understands intent, context, and user experience.

**Why semantic evaluation requires generic capture:** The semantic evaluator reads the full recording (backend events + component state trees + mutation timeline + screenshots) and looks for anomalies that no rule anticipated. If the capture format only contains fields that known detectors check, the semantic evaluator has nothing to discover. The capture must be **generic and versatile** — a complete representation of what happened, not a pre-filtered view.

**What semantic evaluation catches that rules cannot:**

| Rules/Heuristics Can Catch | Only Semantic Eval Can Catch |
|---|---|
| "Progress bar shows 45% but data says 43%" | "The agent claimed it finished the task but clearly didn't" |
| "Turn has no assistant message" | "The data is technically rendered but buried in collapsed tool cards — content delivery failure" |
| "Tool went from complete → running" | "The agent abandoned 3 steps without telling the user" |
| "[object Object] visible" | "The response is technically correct but completely unusable — 500 lines of raw data with no summary" |

**Semantic evaluation input format:**

The recording is compiled into a structured narrative:
```json
{
  "scenario": "S4-data-viz",
  "prompts": ["What apps did I use today? Show as chart.", "Show browsing activity too."],
  "backendEventSummary": { "totalEvents": 89, "turnStartCount": 3, "toolsExecuted": ["wrm_get_top_apps", "wrm_get_browsing"], "errors": [] },
  "componentStateSummary": { "finalTurnCount": 2, "chartsRendered": 0, "toolsCompleted": 2, "assistantTextTotal": 83 },
  "mutationTimeline": [ /* key mutations only, curated for readability */ ],
  "screenshots": ["baseline.png", "post-send-0.png", "complete-0.png", "final.png"],
  "temporalRuleViolations": [],
  "heuristicAnomalies": [{ "code": "A6_EXPECTED_VIZ_MISSING", "message": "..." }],
  "evaluationPrompt": "Given the above recording, evaluate: (1) Did the user get what they asked for? (2) Is any content missing, buried, or delivered incorrectly? (3) Do the state transitions make sense? (4) Would a reasonable user be satisfied with what they see?"
}
```

**LLM evaluation dimensions:**

1. **Content delivery** — Did the user get a complete, visible answer?
2. **State consistency** — Does what the user sees match what the backend produced?
3. **Behavioral fidelity** — Do state transitions make sense over time?
4. **Error handling** — Are failures visible and honest?
5. **User experience** — Is the result actually useful, not just technically present?
6. **Temporal coherence** — Does the UI state evolve in a way that makes sense to a human watching in real time?

### The Anomaly Report

The output of detection is a single JSON file that shows, at a glance, whether the feature is clean:

```json
{
  "scenario": "plan-creation-and-execution",
  "model": "claude-opus-4.6",
  "runs": 3,
  "summary": {
    "critical": 0,
    "warning": 2,
    "info": 5
  },
  "anomalies": [
    {
      "code": "SORT_ORDER_VIOLATION",
      "severity": "warning",
      "count": 2,
      "firstSeen": "snapshot-47",
      "message": "Item with status 'done' appears before item with status 'pending'"
    }
  ]
}
```

**Zero critical + zero warning = clean.** Info-level anomalies are documented and accepted or fixed at discretion.

---

## 8. Step 6: CONVERGE — The Loop Is the Test

**Principle**: The evaluation loop is not a single pass/fail. It's an iterative process that drives the feature toward correctness.

```
Run 1:  18 anomalies (5 critical, 8 warning, 5 info)
  → Fix 5 critical issues
  → Commit: "fix: resolve 5 critical eval loop findings"

Run 2:  7 anomalies (0 critical, 4 warning, 3 info)
  → Fix 4 warnings
  → Commit: "fix: resolve 4 warning eval loop findings"

Run 3:  3 anomalies (0 critical, 0 warning, 3 info)
  → Document 3 info-level as accepted
  → CLEAN ✅
```

### Why Multiple Runs?

The LLM produces different content each run. Different content exercises different code paths:

- Run 1: Agent creates a 3-step plan → progress bar at 0%, 33%, 67%, 100%
- Run 2: Agent creates a 7-step plan → progress bar at 0%, 14%, 28%, ...
- Run 3: Agent asks a clarifying question before creating the plan → panel starts empty

Each run may surface anomalies the others don't. Three runs with zero anomalies across all three gives high confidence.

### Convergence Criteria

```
For the feature to be considered VERIFIED:
  □ At least 3 independent runs per scenario
  □ Zero critical anomalies across ALL runs
  □ Zero warning anomalies across ALL runs (or documented exceptions)
  □ Any accepted info-level anomalies have written justification
  □ LLM evaluation produces no actionable findings
```

---

## 9. Taskflow-Driven Scenario Design

**Principle**: Evaluation loop scenarios are automated translations of the feature's taskflows. The taskflow spec defines what the user does step-by-step. The Playwright script simulates those exact steps against the real app. The detectors verify that the system behaved correctly at each step.

### From Taskflow to Scenario

Every taskflow document (e.g., `01-TASKFLOWS.md`) describes user actions and expected system behavior in a table:

```
| Step | User Action | System Behavior | UI State |
|------|-------------|-----------------|----------|
| 1    | Navigate to Connectors | Route loads, cards render | List view |
| 2    | Click "Set up" on Gmail | Wizard modal opens | Step 1: Prerequisites |
| 3    | — | GWS CLI detected | ✅ CLI found |
| 4    | Click "Next" | Advance to Step 2 | Step 2: Sign In |
```

The Playwright scenario automates the **User Action** column, waits for the **System Behavior** column, and captures snapshots to verify the **UI State** column. Detectors check invariants at each captured snapshot.

### What Normal Behavior Looks Like

For each taskflow, "normal" is defined by three user-observable properties:

1. **Visual correctness**: After each step, the user sees the expected state (status text, progress, content visibility, wizard step).
2. **Display↔truth sync**: What the user sees matches what the system believes. If the system thinks a task is done, the user sees it as done.
3. **Temporal ordering**: States transition in the correct sequence from the user's perspective (not-started → in-progress → done, never done → in-progress → done).

### What Anomalies Look Like

An anomaly is any observable violation of the taskflow's expected behavior:

| Anomaly Type | Example | Severity |
|---|---|---|
| **Missing element** | Wizard opened but step indicator not rendered | critical |
| **State mismatch** | Store says "connected" but DOM shows "Not connected" | critical |
| **Stuck state** | Auth spinner still visible 30s after OAuth completed | critical |
| **Content leak** | Raw JSON, `[object Object]`, or internal markers visible in UI | critical |
| **Ordering violation** | Tool group rendered after assistant message | critical |
| **Content delivery failure** | Tool executed with data but no assistant message synthesized | critical |
| **Style violation** | Done item missing strikethrough, green dot on error status | warning |
| **Missing accessibility** | Toggle without `role="switch"`, dialog without `aria-modal` | warning |
| **Unresolved placeholder** | "Loading..." text in a completed turn | critical |
| **Duplicate content** | Same paragraph rendered twice in assistant response | warning |

### Scenario Structure Pattern

Every eval loop scenario follows the same four-phase structure:

```
Phase 1: SETUP     — Launch app, get window, wait for ready, dismiss dialogs
Phase 2: EXERCISE  — Simulate taskflow steps (navigate, click, submit prompts)
Phase 3: CAPTURE   — Take DOM + store snapshots at each step, run inline detectors
Phase 4: REPORT    — Aggregate anomalies, write artifacts, determine verdict
```

---

## 10. Playwright Implementation Reference

This section documents the proven Playwright patterns extracted from 7+ existing eval loop implementations. Follow these patterns for trouble-free test execution.

### 10.1 App Launch Sequence

Every eval loop launches the real Electron app. The launch sequence has three phases:

**Phase 1: Launch Electron**

```typescript
import { _electron as electron, ElectronApplication, Page } from '@playwright/test';

const electronApp = await electron.launch({
  args: [
    path.join(__dirname, '../dist/main/main.js'),
    `--user-data-dir=${testUserDataDir}`,  // Optional: clean sandbox
  ],
  env: { ...process.env, NODE_ENV: 'test' },
});
```

Use `--user-data-dir` when you need a clean slate (no session history). Omit it when testing against existing user data (e.g., restore eval).

**Phase 2: Get the full app window**

The app starts with a mini window, then opens the full app. Detect the full window by URL:

```typescript
const miniWindow = await electronApp.firstWindow();

const fullAppPromise = new Promise<Page>((resolve) => {
  electronApp.on('window', (candidate) => {
    const url = candidate.url();
    if (url.includes('#/full') || url.includes('#%2Ffull')) resolve(candidate);
    else {
      candidate.on('framenavigated', () => {
        if (candidate.url().includes('#/full')) resolve(candidate);
      });
    }
  });
});

// Trigger full app open
await electronApp.evaluate(({ ipcMain }) => { ipcMain.emit('mini:openFullApp'); });

let page: Page;
try {
  page = await Promise.race([
    fullAppPromise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Window timeout')), 30_000)),
  ]);
} catch {
  page = await findMainWindow(electronApp);  // Polling fallback
}
```

**Phase 3: Wait for app ready**

```typescript
await page.waitForLoadState('domcontentloaded');
await page.waitForSelector('[data-testid="chat-input"]', { timeout: 45_000 });

// For SDK-dependent tests: wait for CLI ready
const cliIndicator = page.locator('[data-testid="cli-status-indicator"]');
await page.waitForFunction(
  () => document.querySelector('[data-testid="cli-status-indicator"]')
    ?.getAttribute('data-status') === 'ready',
  { timeout: 60_000 },
);
```

### 10.2 Dialog Dismissal

The app may show setup dialogs on launch. Dismiss them before starting the scenario:

```typescript
async function dismissDialogs(page: Page): Promise<void> {
  const setupDialog = page.locator('[role="dialog"]');
  if (await setupDialog.isVisible({ timeout: 2000 }).catch(() => false)) {
    const closeBtn = setupDialog.locator('button[aria-label="Close"], button:has-text("Dismiss")');
    if (await closeBtn.first().isVisible({ timeout: 500 }).catch(() => false)) {
      await closeBtn.first().click();
    }
    await wait(500);
  }
}
```

### 10.3 Prompt Submission

Submit prompts using `fill()` (not `type()`) for speed, then click the submit button:

```typescript
async function submitPrompt(page: Page, prompt: string): Promise<void> {
  const textarea = page.locator('[data-testid="chat-input"]');
  await textarea.waitFor({ state: 'visible', timeout: 10_000 });
  await textarea.fill(prompt);

  const submitBtn = page.locator('[data-testid="submit-button"]');
  await submitBtn.waitFor({ state: 'visible', timeout: 5_000 });
  await submitBtn.click();
}
```

### 10.4 Session Idle Detection

Wait for the agent to finish processing. Two complementary patterns:

**Pattern A: Content-growth quiet period** — Wait until content stops growing for N seconds.

```typescript
async function waitForContentStable(page: Page, quietMs = 12_000, maxMs = 180_000): Promise<void> {
  const start = Date.now();
  let lastLen = 0;
  let quietStart = 0;

  while (Date.now() - start < maxMs) {
    const state = await page.evaluate(() => {
      const es = (window as any).__sessionEventsStore?.getState?.();
      const turns = (es?.turns ?? []) as Array<Record<string, unknown>>;
      let total = 0;
      for (const t of turns) total += ((t.assistantContent as string) ?? '').length;
      return { totalContent: total, isActive: Boolean(es?.isSessionActive) };
    });

    if (state.totalContent !== lastLen) {
      lastLen = state.totalContent;
      quietStart = 0;
    } else if (state.totalContent > 50) {
      if (!quietStart) quietStart = Date.now();
      if (Date.now() - quietStart >= quietMs) break;
    }

    await wait(1000);
  }
}
```

**Pattern B: Session lifecycle** — Wait for `isSessionActive` to flip from true to false.

```typescript
async function waitForSessionIdle(page: Page, maxMs = 180_000): Promise<void> {
  const start = Date.now();
  let sawActive = false;

  while (Date.now() - start < maxMs) {
    const state = await page.evaluate(() => {
      const es = (window as any).__sessionEventsStore?.getState?.();
      return { isActive: es?.isSessionActive ?? false, events: es?.events?.length ?? 0 };
    });

    if (state.isActive) sawActive = true;
    if (sawActive && !state.isActive && state.events > 0) {
      await wait(2000);  // Trailing renders
      return;
    }
    await wait(500);
  }
}
```

### 10.5 DOM Snapshot Capture

Snapshots are captured via `page.evaluate()` with an injected function. The function runs in the Electron renderer context and has access to `document`, `window.__sessionEventsStore`, etc.

```typescript
const snapshot = await page.evaluate(() => {
  const qsa = (sel: string) => [...document.querySelectorAll(sel)];

  // Read DOM
  const cards = qsa('[data-testid="connector-card"]').map(el => ({
    id: el.getAttribute('data-connector-id'),
    status: el.querySelector('[data-testid="connector-status"]')?.textContent?.trim(),
    hasToggle: !!el.querySelector('[data-testid="connector-toggle"]'),
  }));

  // Read store
  const store = (window as any).__connectorsStore?.getState?.();

  // Run inline detectors
  const anomalies: Array<{ code: string; severity: string; message: string }> = [];
  
  for (const card of cards) {
    const storeItem = store?.connectors?.find((c: any) => c.id === card.id);
    if (storeItem && card.status !== expectedStatusText(storeItem.status)) {
      anomalies.push({
        code: 'CARD_STATUS_MISMATCH',
        severity: 'critical',
        message: `Card ${card.id}: DOM="${card.status}" but store="${storeItem.status}"`,
      });
    }
  }

  return { timestamp: new Date().toISOString(), cards, store, anomalies };
});
```

**Key rule**: Every field a detector needs must be in the snapshot. Design the snapshot schema FOR the detectors, not the other way around.

### 10.6 Output Artifact Pattern

All eval loops write structured JSON artifacts to `test-results/<feature>-eval/`:

```typescript
const OUTPUT_DIR = path.join(__dirname, '..', 'test-results', 'gws-connector-eval');
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// Anomaly report (the verdict)
fs.writeFileSync(path.join(OUTPUT_DIR, 'anomaly-report.json'), JSON.stringify({
  scenario: 'full-setup-flow',
  timestamp: new Date().toISOString(),
  verdict: criticalCount === 0 && warningCount === 0 ? 'CLEAN' : 'FAIL',
  summary: { critical: criticalCount, warning: warningCount, info: infoCount },
  anomalies: allAnomalies,
}, null, 2));

// DOM timeline (all snapshots)
fs.writeFileSync(path.join(OUTPUT_DIR, 'dom-timeline.json'), JSON.stringify(snapshots, null, 2));

// Final screenshot
await page.screenshot({ path: path.join(OUTPUT_DIR, 'final.png'), fullPage: true });
```

### 10.7 Timeout Configuration

| Feature Complexity | Timeout | Examples |
|---|---|---|
| Single prompt, fast response | 300s (5 min) | insight-chart-eval, image-restore-eval |
| Multi-prompt, tool execution | 600s (10 min) | behavior-recording |
| Multi-scenario, multi-run | 900s (15 min) | todo-eval-loop, wrm-event-capture |

Set `test.setTimeout()` at the top of the test file. Always be conservative — the app talks to real APIs.

### 10.8 Reusable Helpers

```typescript
function wait(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}

async function findMainWindow(app: ElectronApplication): Promise<Page> {
  for (let i = 0; i < 60; i++) {
    for (const w of app.windows()) {
      if (w.url().includes('#/full')) return w;
    }
    await wait(500);
  }
  throw new Error('Main window not found');
}

async function cleanupSessions(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const api = (window as any).electronAPI;
    if (!api?.sessions) return;
    const sessions = await api.sessions.list();
    for (const s of sessions) await api.sessions.delete(s.id);
  });
}
```

---

## 11. Applying the Framework to a New Feature

### Template: Feature Eval Loop Checklist

When implementing the eval loop for a new feature:

```
STEP 0: TASKFLOWS (the foundation — everything derives from these)
  □ All user-facing taskflows documented step-by-step (User Action → System Behavior → UI State)
  □ Each taskflow has edge cases enumerated
  □ Normal behavior articulated for each step (from user's perspective)
  □ Anomaly types identified for each step (what would the user notice going wrong?)

STEP 1: DEFINE (user expectations — no implementation details)
  □ User-visible invariants documented (progress, completion, ordering, visibility, consistency)
  □ Content delivery contract defined (what counts as "the user got their answer")
  □ All taskflows written step-by-step with expected user experience
  □ Edge cases enumerated from user perspective

STEP 2: ENUMERATE (user-observable behaviors — still no implementation)
  □ Failure categories defined by user-visible impact (at least 4)
  □ Detector catalog written (each with code, severity, rule — rule stated in user terms)
  □ Cross-snapshot temporal detectors identified
  □ LLM evaluation dimensions listed

STEP 3: PLAN RECORDING (technology enters here — how to capture evidence)
  □ DOM selectors / store access methods identified for each detector's needs
  □ Snapshot schema designed (every field needed by every detector is present)
  □ Backend event channels listed (technology-specific capture mechanism)
  □ Recording triggers defined (event-driven + polling interval)
  □ Output file structure defined

STEP 4: CAPTURE (Playwright)
  □ Playwright test file created following §10 patterns
  □ App launch sequence (launch → window → ready → dismiss dialogs)
  □ Scenario scripted from taskflows (each taskflow step → Playwright action)
  □ CAPTURE_FN written (runs in renderer, reads DOM + store + runs detectors)
  □ Idle detection configured (content-stable or session-lifecycle)
  □ First run produces non-empty recordings

STEP 5: DETECT
  □ All heuristic detectors implemented in CAPTURE_FN
  □ Cross-snapshot detectors implemented in post-run analysis
  □ Anomaly report aggregation works
  □ LLM evaluation prompt/framework prepared
  □ Anomaly report is readable and actionable

STEP 6: CONVERGE
  □ First run identifies real issues (not just noise)
  □ Fixes committed, re-run shows fewer anomalies
  □ 3 clean runs achieved
  □ Accepted info-level anomalies documented
```

---

## 12. Anti-Patterns

| Anti-Pattern | Why It Fails | Instead |
|---|---|---|
| **Detectors without a spec** | You don't know what "correct" is, so the detector checks the wrong thing | Write the taskflows and user expectations first, derive detectors from those |
| **Deriving evaluation criteria from source code** | You're testing whether the code does what the code says — a tautology. Code-derived criteria never catch "the code is wrong." | Derive criteria from user expectations and taskflows. Reference source code only for capture planning. |
| **Deterministic expected output** | "Assert exactly 3 items" fails when the LLM creates 5 items — the feature works, the test is wrong | Assert invariants: "all items have valid status," "count > 0" |
| **Recording everything** | Raw MutationObserver produces thousands of `characterData` changes per streaming turn, drowning signal | Record structured snapshots at meaningful moments |
| **Post-hoc-only detection** | If you run detectors only after the session ends, you miss transient anomalies (flickering states, momentary corruption) | Run detectors inline at capture time |
| **Scoring instead of boolean** | "This snapshot scores 7.2/10" is not actionable. "SORT_ORDER_VIOLATION: done item before pending item" is. | Every detector is pass/fail |
| **Skipping LLM evaluation** | Heuristics can't catch "the plan makes no sense" or "data is only visible in collapsed cards" | Both mechanisms are needed — neither is sufficient alone |
| **Running once and declaring clean** | One clean run proves nothing — the LLM might have produced easy output. Three clean runs build confidence. | At least 3 runs per scenario |
| **Imagined selectors** | `[data-testid="todo-item-status"]` doesn't exist — the real attribute is `[data-status]` on `[role="listitem"]` | Ground every selector in the actual rendered output, verified against the real app |

---

## 13. Relationship to Other Testing

| Testing Type | What It Does | When It Runs | What Eval Loop Adds |
|---|---|---|---|
| **Unit tests** (vitest) | Verifies functions in isolation | CI, every commit | Eval loop verifies the INTEGRATION — all pieces working together |
| **Component tests** (@testing-library) | Verifies a component renders correctly with mocked props | CI, every commit | Eval loop verifies the component with REAL data from a REAL backend |
| **E2E tests** (Playwright) | Verifies user flows with assertions | CI or manual | Eval loop is DIAGNOSTIC, not pass/fail — it produces a recording you can analyze |
| **Manual testing** | Human checks if it "looks right" | During development | Eval loop is SYSTEMATIC manual testing with permanent artifacts |

The eval loop doesn't replace any of these. It fills the gap between "all unit tests pass" and "the feature actually works when a real user uses it with real AI responses."
