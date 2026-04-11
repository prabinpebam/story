# Notification System — UX Specification (Bottom-Center Popover)

**Version:** 1.0  
**Last Updated:** December 12, 2025  
**Status:** Draft (Implementation-aligned)

---

## 0. Purpose

Define a consistent, minimal notification surface used across the app to inform users about outcomes and constraints, including blocked operations (e.g., blocking “Change Master preset” when the Master slide is in use).

This spec defines:
- placement and behavior
- dismiss rules (auto vs manual)
- content structure
- severity types

---

## 1. UX goals

- **Fast feedback:** user understands what happened within one glance.
- **Non-disruptive:** does not block the canvas or require modal interaction.
- **Actionable:** when something is blocked, the notification states the constraint and the next step.
- **Consistent:** same placement, sizing, and interaction across features.

---

## 2. Surface

### 2.1 Placement

- Notifications appear as a **minimal modern popover**, **center-aligned at the bottom**, positioned **just above the toolbar**.
- The notification must not overlap critical toolbar interactions; it should float above and leave the toolbar usable.

### 2.2 Stacking

- Default: show **one notification at a time**.
- If multiple notifications are triggered while one is visible:
  - queue them and show the next after the current one dismisses, OR
  - replace the current one only if the new one is higher severity.

(Implementation choice is flexible; UX requirement is that the user is not spammed with multiple overlapping popovers.)

---

## 3. Types and dismiss behavior

### 3.1 Severity types

- **Success**: action completed.
- **Info**: neutral guidance.
- **Warning**: something unexpected, but not blocked.
- **Error / Blocked**: action cannot be performed.

### 3.2 Dismiss rules

- **Self-dismissing** notifications:
  - Success, Info
  - Auto-dismiss after a short duration.
- **Explicitly dismissed** notifications:
  - Error / Blocked (and any notification that requires the user to take corrective steps)
  - Must include a clear dismiss affordance.

---

## 4. Content structure

A notification must be concise and fit in one small card:

- **Title** (required): 3–7 words.
- **Body** (optional): 1–2 short lines with the reason and the next step.
- **Action** (optional): one secondary action if it helps the user resolve the issue quickly.
  - Only include if an equivalent action already exists (e.g., “Open Layout Picker”).
- **Dismiss affordance**:
  - Always present for manual-dismiss notifications.

---

## 5. Interaction rules

- Notifications should not steal focus from text editing or the canvas.
- Hovering the notification should pause auto-dismiss (for self-dismissing types) if feasible.
- A new notification should not repeatedly re-appear for the same blocked condition during the same attempt loop; prefer “show once per attempt”.

---

## 6. Example: blocked Master preset replacement

**When it triggers**
- User is in Master View, selects a Master slide, tries to change “Master preset”.
- The Master slide is still used by at least one normal slide.

**Notification (Blocked)**
- Title: "Can’t change Master preset"
- Body: "This Master slide is used by existing slides. Move those slides to a different layout/master, then try again."
- Action (optional): "Open Layout Picker" (only if it exists and can help resolve the issue)
- Dismiss: manual

---

## 7. Design system constraints

- Use existing app tokens, primitives, and z-index conventions.
- Do not introduce new colors, typography scales, or shadows.
- Must work in light and dark themes.
