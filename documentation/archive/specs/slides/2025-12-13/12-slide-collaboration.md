# Slide Collaboration - Comments, Review, Co-Authoring

**Version:** 1.0  
**Last Updated:** December 7, 2025

## 1. Overview

This document specifies the complete collaboration system for presentations, including comments, review workflow, version history, co-authoring, and conflict resolution.

---

## 2. Comments System

### 2.1 Comment Types

**Slide-Level Comments:**
- Attached to entire slide
- Appear in comments panel
- Icon indicator on thumbnail

**Element-Level Comments:**
- Attached to specific element (text, image, shape)
- Anchored to element position
- Highlighted indicator on element

**General Comments:**
- Not attached to specific slide/element
- Presentation-level feedback
- Appear in comments panel only

### 2.2 Comment Interface

**Comment Thread:**
```
┌────────────────────────────────────────────────┐
│  Comments                                   ✕  │
├────────────────────────────────────────────────┤
│  [New Comment]  [Filter ▼]  [Sort ▼]          │
├────────────────────────────────────────────────┤
│                                                │
│  ┌─────────────────────────────────────────┐  │
│  │ 💬 Sarah Chen              Slide 3      │  │
│  │    2 hours ago                 [Reply]  │  │
│  │                                          │  │
│  │    Can we use a different chart type    │  │
│  │    here? Bar chart might be clearer.    │  │
│  │                                          │  │
│  │    ├─ 🔵 You replied        1 hour ago  │  │
│  │    │   Good point. I'll try a bar       │  │
│  │    │   chart and see how it looks.      │  │
│  │    │                                     │  │
│  │    └─ 💬 Sarah Chen        30 min ago   │  │
│  │        Much better! ✓ Resolved          │  │
│  └─────────────────────────────────────────┘  │
│                                                │
│  ┌─────────────────────────────────────────┐  │
│  │ 💬 John Park               Slide 5      │  │
│  │    1 day ago                   [Reply]  │  │
│  │                                          │  │
│  │    The title needs to be more specific. │  │
│  │    Current: "Results"                   │  │
│  │    Suggest: "Q4 2024 Results"           │  │
│  │                                          │  │
│  │    [Resolve]  [Edit]  [Delete]          │  │
│  └─────────────────────────────────────────┘  │
│                                                │
│  ┌─────────────────────────────────────────┐  │
│  │ ✅ Maria Garcia            Slide 1      │  │
│  │    3 days ago              Resolved     │  │
│  │                                          │  │
│  │    Typo in subtitle: "quater" should    │  │
│  │    be "quarter"                         │  │
│  │                                          │  │
│  │    [Show Thread ▼]                      │  │
│  └─────────────────────────────────────────┘  │
│                                                │
└────────────────────────────────────────────────┘
```

### 2.3 Adding Comments

**Methods:**
1. **Comments Panel**: Click "New Comment" button
2. **Right-click**: Right-click slide or element → "Add Comment"
3. **Keyboard**: **Ctrl + Alt + M**
4. **Selection**: Select element, click comment button

**New Comment Dialog:**
```
┌────────────────────────────────────────────────┐
│  New Comment                                ✕  │
├────────────────────────────────────────────────┤
│  On: Slide 5 - Title Text Box                 │
│                                                │
│  ┌────────────────────────────────────────┐   │
│  │ Type your comment...                   │   │
│  │                                        │   │
│  │                                        │   │
│  │                                        │   │
│  │                                        │   │
│  └────────────────────────────────────────┘   │
│                                                │
│  [@] Mention someone                           │
│                                                │
│  [ Cancel ]  [ Post Comment ]                  │
└────────────────────────────────────────────────┘
```

### 2.4 Comment Data Model

```typescript
interface Comment {
  id: string;
  presentationId: string;
  
  // Location
  slideId?: string;           // Slide-level comment
  elementId?: string;         // Element-level comment
  position?: {x: number; y: number}; // Visual position on slide
  
  // Content
  text: string;
  mentions: string[];         // User IDs mentioned with @
  
  // Author
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  
  // Metadata
  createdAt: Date;
  updatedAt?: Date;
  editedBy?: string;
  
  // Thread
  parentId?: string;          // Reply to another comment
  replies: Comment[];
  
  // Status
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: Date;
  
  // Visibility
  visibility: 'public' | 'private' | 'shared';
}
```

### 2.5 Comment Features

**Mentions:**
- Type `@` to see user list
- Autocomplete names
- Notifies mentioned user
- Highlighted in comment

**Rich Text (Limited):**
- **Bold** with `**text**`
- *Italic* with `*text*`
- `Code` with backticks
- Links auto-detected

**Attachments:**
- Images (screenshots)
- Files (reference documents)
- Links

**Reactions:**
- 👍 Like
- ❤️ Love
- 😂 Laugh
- 🤔 Thinking
- ✅ Resolved

---

## 3. Review Workflow

### 3.1 Review States

**Presentation States:**
- **Draft**: Work in progress
- **In Review**: Ready for feedback
- **Approved**: Final version
- **Archived**: Historical record

**State Transitions:**
```
DRAFT ──→ IN REVIEW ──→ APPROVED ──→ ARCHIVED
  ↑           ↓
  └─────── DRAFT (revisions needed)
```

### 3.2 Send for Review

**Dialog:**
```
┌────────────────────────────────────────────────┐
│  Send for Review                            ✕  │
├────────────────────────────────────────────────┤
│  Reviewers:                                    │
│  ┌────────────────────────────────────────┐   │
│  │ Sarah Chen        [sarah@company.com]  │   │
│  │ John Park         [john@company.com]   │   │
│  │ Maria Garcia      [maria@company.com]  │   │
│  └────────────────────────────────────────┘   │
│  [Add Reviewer...]                             │
│                                                │
│  Message:                                      │
│  ┌────────────────────────────────────────┐   │
│  │ Please review the Q4 presentation      │   │
│  │ and provide feedback by Friday.        │   │
│  │                                        │   │
│  └────────────────────────────────────────┘   │
│                                                │
│  Permissions:                                  │
│  ● Can comment only                            │
│  ○ Can edit                                    │
│                                                │
│  Due date: [12/15/2025  ▼]                     │
│                                                │
│  ☑ Notify reviewers via email                 │
│  ☑ Request review approval                    │
│                                                │
│  [ Cancel ]  [ Send ]                          │
└────────────────────────────────────────────────┘
```

### 3.3 Review Panel

**Reviewer View:**
```
┌────────────────────────────────────────────────┐
│  Review: Q4 2024 Presentation               ✕  │
├────────────────────────────────────────────────┤
│  From: John Doe                                │
│  Due: December 15, 2025                        │
│  Status: In Review                             │
│                                                │
│  Your Progress:                                │
│  [■■■■■□□□□□] 5/10 slides reviewed            │
│                                                │
│  Actions:                                      │
│  [Add Comment]  [Suggest Edit]  [Approve]     │
│                                                │
│  ─────────────────────────────────────────     │
│                                                │
│  Checklist:                                    │
│  ☑ Content accuracy                            │
│  ☑ Brand guidelines                            │
│  ☐ Data visualization                          │
│  ☐ Grammar and spelling                        │
│  ☐ Overall message clarity                     │
│                                                │
│  Notes:                                        │
│  ┌────────────────────────────────────────┐   │
│  │ Overall looks good. A few minor        │   │
│  │ suggestions on slides 3 and 7.         │   │
│  └────────────────────────────────────────┘   │
│                                                │
│  [ Complete Review ]                           │
└────────────────────────────────────────────────┘
```

### 3.4 Accept/Reject Changes

**Change Tracking:**
```typescript
interface Change {
  id: string;
  type: 'add' | 'delete' | 'modify';
  elementId: string;
  slideId: string;
  
  before: any;            // Original value
  after: any;             // New value
  
  authorId: string;
  timestamp: Date;
  
  status: 'pending' | 'accepted' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: Date;
}
```

**Review Changes UI:**
```
┌────────────────────────────────────────────────┐
│  Review Changes                             ✕  │
├────────────────────────────────────────────────┤
│  Changes by: Sarah Chen         5 changes      │
│                                                │
│  ┌─────────────────────────────────────────┐  │
│  │ ✏️ Slide 3 - Title Text                 │  │
│  │    Before: "Results"                    │  │
│  │    After:  "Q4 2024 Results"            │  │
│  │    [Accept]  [Reject]  [View Slide]     │  │
│  └─────────────────────────────────────────┘  │
│                                                │
│  ┌─────────────────────────────────────────┐  │
│  │ ➕ Slide 5 - New Chart Added             │  │
│  │    Added bar chart showing regional     │  │
│  │    breakdown                            │  │
│  │    [Accept]  [Reject]  [View Slide]     │  │
│  └─────────────────────────────────────────┘  │
│                                                │
│  ┌─────────────────────────────────────────┐  │
│  │ 🗑️ Slide 7 - Image Deleted               │  │
│  │    Removed placeholder image            │  │
│  │    [Accept]  [Reject]  [View Slide]     │  │
│  └─────────────────────────────────────────┘  │
│                                                │
│  [Accept All]  [Reject All]  [Review Later]   │
└────────────────────────────────────────────────┘
```

---

## 4. Co-Authoring (Real-Time Collaboration)

### 4.1 Presence Indicators

**Active Users:**
```
┌─────────────────────────────────────┐
│  Presentation.pptx                  │
│  ┌──┐ ┌──┐ ┌──┐                    │
│  │SC│ │JP│ │MG│ +2 others          │
│  └──┘ └──┘ └──┘                    │
│  Sarah Chen (you)                   │
│  John Park - Editing Slide 5        │
│  Maria Garcia - Viewing Slide 3     │
└─────────────────────────────────────┘
```

**Cursor Indicators:**
```
Slide canvas shows colored cursors:
• Red cursor (John Park) - editing text
• Blue cursor (Maria Garcia) - selecting shape
• Your cursor (normal)
```

### 4.2 Real-Time Updates

**WebSocket Architecture:**
```typescript
interface CollaborationMessage {
  type: 'cursor' | 'edit' | 'presence' | 'chat';
  userId: string;
  userName: string;
  timestamp: Date;
  data: any;
}

class CollaborationManager {
  constructor(presentationId) {
    this.presentationId = presentationId;
    this.ws = new WebSocket(`wss://api.story.app/collab/${presentationId}`);
    this.users = new Map();
    
    this.setupHandlers();
  }
  
  setupHandlers() {
    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.handleMessage(message);
    };
  }
  
  handleMessage(message) {
    switch (message.type) {
      case 'cursor':
        this.updateCursor(message.userId, message.data);
        break;
      
      case 'edit':
        this.applyRemoteEdit(message.data);
        break;
      
      case 'presence':
        this.updatePresence(message.userId, message.data);
        break;
      
      case 'chat':
        this.showChatMessage(message);
        break;
    }
  }
  
  broadcastEdit(edit) {
    this.ws.send(JSON.stringify({
      type: 'edit',
      userId: currentUser.id,
      userName: currentUser.name,
      timestamp: new Date(),
      data: edit
    }));
  }
  
  updateCursor(userId, position) {
    let cursor = this.users.get(userId)?.cursor;
    
    if (!cursor) {
      cursor = this.createCursor(userId);
      this.users.get(userId).cursor = cursor;
    }
    
    cursor.style.left = `${position.x}px`;
    cursor.style.top = `${position.y}px`;
    cursor.querySelector('.label').textContent = 
      this.users.get(userId).name;
  }
  
  createCursor(userId) {
    const user = this.users.get(userId);
    const cursor = document.createElement('div');
    cursor.className = 'remote-cursor';
    cursor.style.borderColor = user.color;
    
    cursor.innerHTML = `
      <div class="cursor-pointer"></div>
      <div class="label">${user.name}</div>
    `;
    
    document.body.appendChild(cursor);
    return cursor;
  }
}
```

### 4.3 Conflict Resolution

**Operational Transformation:**
```typescript
class OperationalTransform {
  // Transform operation against concurrent operation
  transform(op1, op2) {
    // If both operations affect same element
    if (op1.elementId === op2.elementId) {
      // Transform based on operation types
      if (op1.type === 'insert' && op2.type === 'insert') {
        return this.transformInserts(op1, op2);
      } else if (op1.type === 'delete' && op2.type === 'delete') {
        return this.transformDeletes(op1, op2);
      } else {
        return this.transformMixed(op1, op2);
      }
    }
    
    return [op1, op2]; // No conflict
  }
  
  transformInserts(op1, op2) {
    // Both users inserted text
    if (op1.position <= op2.position) {
      // op2 position needs adjustment
      op2.position += op1.text.length;
    } else {
      // op1 position needs adjustment
      op1.position += op2.text.length;
    }
    
    return [op1, op2];
  }
  
  transformDeletes(op1, op2) {
    // Handle overlapping deletes
    const op1Start = op1.position;
    const op1End = op1.position + op1.length;
    const op2Start = op2.position;
    const op2End = op2.position + op2.length;
    
    // Complex overlap logic...
    return this.resolveOverlap(op1, op2, op1Start, op1End, op2Start, op2End);
  }
}
```

**Last Write Wins (Simple Approach):**
```typescript
class ConflictResolver {
  resolveConflict(localEdit, remoteEdit) {
    // Compare timestamps
    if (remoteEdit.timestamp > localEdit.timestamp) {
      // Remote edit wins
      this.applyRemoteEdit(remoteEdit);
      
      // Notify user
      showNotification(
        `${remoteEdit.userName} updated this element`,
        'info'
      );
    } else {
      // Local edit wins
      this.broadcastLocalEdit(localEdit);
    }
  }
}
```

### 4.4 Editing Locks

**Slide-Level Locking:**
```typescript
class SlideLockManager {
  async requestLock(slideId) {
    const response = await fetch(`/api/slides/${slideId}/lock`, {
      method: 'POST',
      body: JSON.stringify({ userId: currentUser.id })
    });
    
    if (response.ok) {
      const lock = await response.json();
      this.activeLocks.set(slideId, lock);
      return true;
    } else {
      // Lock held by another user
      const lockInfo = await response.json();
      showNotification(
        `${lockInfo.userName} is editing this slide`,
        'warning'
      );
      return false;
    }
  }
  
  releaseLock(slideId) {
    const lock = this.activeLocks.get(slideId);
    if (lock) {
      fetch(`/api/slides/${slideId}/lock/${lock.id}`, {
        method: 'DELETE'
      });
      
      this.activeLocks.delete(slideId);
    }
  }
  
  // Auto-release locks on inactivity
  setupAutoRelease() {
    let activityTimeout;
    
    document.addEventListener('mousedown', () => {
      clearTimeout(activityTimeout);
      activityTimeout = setTimeout(() => {
        this.releaseAllLocks();
      }, 5 * 60 * 1000); // 5 minutes
    });
  }
}
```

---

## 5. Version History

### 5.1 Automatic Versioning

**Version Creation Triggers:**
- Every 15 minutes (if changes made)
- Manual save point
- Before major operations (delete slide, change master)
- On review completion
- Daily snapshot (if active)

### 5.2 Version History Panel

```
┌────────────────────────────────────────────────┐
│  Version History                            ✕  │
├────────────────────────────────────────────────┤
│  [Save Current Version]  [Compare Versions]    │
│                                                │
│  ┌─────────────────────────────────────────┐  │
│  │ ● Current Version                       │  │
│  │   Just now - You                        │  │
│  │   [Autosave]                            │  │
│  └─────────────────────────────────────────┘  │
│                                                │
│  ┌─────────────────────────────────────────┐  │
│  │   Version 42                            │  │
│  │   2 hours ago - You                     │  │
│  │   Updated slides 5-7                    │  │
│  │   [View]  [Restore]  [Name]             │  │
│  └─────────────────────────────────────────┘  │
│                                                │
│  ┌─────────────────────────────────────────┐  │
│  │   Version 41 (Review Complete)          │  │
│  │   1 day ago - Sarah Chen                │  │
│  │   Completed review                      │  │
│  │   [View]  [Restore]  [Compare]          │  │
│  └─────────────────────────────────────────┘  │
│                                                │
│  ┌─────────────────────────────────────────┐  │
│  │   Version 40 (Milestone)                │  │
│  │   3 days ago - You                      │  │
│  │   Final draft before review             │  │
│  │   [View]  [Restore]  [Compare]          │  │
│  └─────────────────────────────────────────┘  │
│                                                │
│  Show: [All ▼]  [Last 7 days ▼]               │
└────────────────────────────────────────────────┘
```

### 5.3 Version Data Model

```typescript
interface Version {
  id: string;
  presentationId: string;
  versionNumber: number;
  
  // Snapshot
  data: Presentation;     // Complete presentation state
  thumbnail: string;      // Preview image
  
  // Metadata
  createdAt: Date;
  createdBy: string;
  createdByName: string;
  
  // Categorization
  type: 'auto' | 'manual' | 'milestone';
  label?: string;         // User-defined name
  description?: string;
  
  // Comparison
  changesSincePrevious: ChangeSet;
  
  // Size optimization
  compressed: boolean;
  deltaFromPrevious?: Delta;  // Only store changes
}

interface ChangeSet {
  slidesAdded: number;
  slidesModified: number;
  slidesDeleted: number;
  elementsModified: number;
  summary: string;        // "Updated slides 3-5, added new conclusion"
}
```

### 5.4 Restore Version

**Confirmation:**
```
┌────────────────────────────────────────────────┐
│  Restore Version 40?                        ✕  │
├────────────────────────────────────────────────┤
│  You are about to restore Version 40:         │
│                                                │
│  "Final draft before review"                   │
│  Created 3 days ago by You                     │
│                                                │
│  ⚠️  This will:                                │
│  • Replace current presentation state          │
│  • Save current version before restoring       │
│  • Keep all comments and version history       │
│                                                │
│  Changes since Version 40:                     │
│  • 3 slides modified                           │
│  • 1 slide added                               │
│  • 2 comments added                            │
│                                                │
│  You can always restore the current version    │
│  from version history.                         │
│                                                │
│  [ Cancel ]           [ Restore Version ]      │
└────────────────────────────────────────────────┘
```

### 5.5 Compare Versions

**Side-by-Side View:**
```
┌──────────────────────────────────────────────────────────────┐
│  Compare Versions                                         ✕  │
├──────────────────────────────────────────────────────────────┤
│  [Version 40 ▼]                    [Current Version ▼]       │
│                                                              │
│  ┌─────────────────────────┐  ┌─────────────────────────┐  │
│  │ Slide 1                 │  │ Slide 1                 │  │
│  │ ┌─────────────────────┐ │  │ ┌─────────────────────┐ │  │
│  │ │ Q4 2024 Results     │ │  │ │ Q4 2024 Results     │ │  │
│  │ │                     │ │  │ │                     │ │  │
│  │ │ [No changes]        │ │  │ │ [No changes]        │ │  │
│  │ └─────────────────────┘ │  │ └─────────────────────┘ │  │
│  └─────────────────────────┘  └─────────────────────────┘  │
│                                                              │
│  ┌─────────────────────────┐  ┌─────────────────────────┐  │
│  │ Slide 3                 │  │ Slide 3                 │  │
│  │ ┌─────────────────────┐ │  │ ┌─────────────────────┐ │  │
│  │ │ Results             │ │  │ │ Q4 2024 Results     │ │  │
│  │ │        ⚠️          │ │  │ │        ✅          │ │  │
│  │ │ [Title changed]     │ │  │ │ [Title changed]     │ │  │
│  │ └─────────────────────┘ │  │ └─────────────────────┘ │  │
│  └─────────────────────────┘  └─────────────────────────┘  │
│                                                              │
│  Legend: ✅ Added  ⚠️ Modified  🗑️ Deleted                  │
│                                                              │
│  [Previous Difference]  [Next Difference]                   │
│  [ Close ]              [ Restore Version 40 ]               │
└──────────────────────────────────────────────────────────────┘
```

---

## 6. Share and Permissions

### 6.1 Sharing Dialog

```
┌────────────────────────────────────────────────┐
│  Share "Q4 2024 Presentation"               ✕  │
├────────────────────────────────────────────────┤
│  Link sharing:                                 │
│  ● Anyone with the link can view               │
│  ○ Anyone with the link can edit               │
│  ○ Only specific people                        │
│                                                │
│  Link: https://story.app/p/abc123             │
│  [Copy Link]  [🔗 Shorten]                     │
│                                                │
│  ─────────────────────────────────────────     │
│                                                │
│  People with access:                           │
│  ┌────────────────────────────────────────┐   │
│  │ 👤 You (Owner)                         │   │
│  │    Full access                         │   │
│  │                                        │   │
│  │ 👤 Sarah Chen                          │   │
│  │    Can edit          [Change ▼] [✕]   │   │
│  │                                        │   │
│  │ 👤 John Park                           │   │
│  │    Can comment       [Change ▼] [✕]   │   │
│  │                                        │   │
│  │ 👤 Maria Garcia                        │   │
│  │    Can view          [Change ▼] [✕]   │   │
│  └────────────────────────────────────────┘   │
│                                                │
│  [Add people...]                               │
│                                                │
│  Advanced:                                     │
│  ☑ Allow download                              │
│  ☐ Prevent sharing                             │
│  ☐ Set expiration date                         │
│                                                │
│  [ Done ]                                      │
└────────────────────────────────────────────────┘
```

### 6.2 Permission Levels

**Owner:**
- Full access
- Can delete presentation
- Can transfer ownership
- Can manage all permissions

**Editor:**
- Edit slides
- Add/remove slides
- Change layouts
- Cannot delete presentation
- Cannot change permissions

**Commenter:**
- Add comments
- Reply to comments
- No editing access
- View-only for content

**Viewer:**
- View slides only
- Cannot comment
- Cannot edit
- Can download (if allowed)

### 6.3 Permission Checks

```typescript
class PermissionManager {
  canEdit(userId, presentationId) {
    const permission = this.getPermission(userId, presentationId);
    return permission === 'owner' || permission === 'editor';
  }
  
  canComment(userId, presentationId) {
    const permission = this.getPermission(userId, presentationId);
    return ['owner', 'editor', 'commenter'].includes(permission);
  }
  
  canShare(userId, presentationId) {
    const permission = this.getPermission(userId, presentationId);
    return permission === 'owner';
  }
  
  canDelete(userId, presentationId) {
    const permission = this.getPermission(userId, presentationId);
    return permission === 'owner';
  }
}
```

---

## 7. Notifications

### 7.1 Notification Types

**In-App Notifications:**
- New comment on your slide
- Reply to your comment
- Mention in comment (@user)
- Review requested
- Review completed
- Changes accepted/rejected
- User joined presentation
- Version restored

**Email Notifications:**
- Review request (configurable)
- Comment mentions
- Daily digest of activity
- Approaching deadline

### 7.2 Notification Center

```
┌────────────────────────────────────────────────┐
│  Notifications                              ✕  │
├────────────────────────────────────────────────┤
│  [Mark all read]  [Settings]                   │
│                                                │
│  ● Sarah Chen commented on Slide 3             │
│    2 hours ago                                 │
│    "Can we use a different chart type?"        │
│    [View]  [Reply]                             │
│                                                │
│  ○ John Park approved your presentation        │
│    1 day ago                                   │
│    [View]                                      │
│                                                │
│  ○ Maria Garcia mentioned you in a comment     │
│    2 days ago                                  │
│    "@you Please review the data sources"       │
│    [View]  [Reply]                             │
│                                                │
│  ○ Version 40 was restored                     │
│    3 days ago                                  │
│    [View Version]                              │
│                                                │
│  [Load More...]                                │
└────────────────────────────────────────────────┘
```

---

## 8. Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| **Ctrl + Alt + M** | Add comment |
| **Ctrl + Alt + K** | Resolve comment |
| **Ctrl + Alt + H** | Show version history |
| **Ctrl + Shift + S** | Save version |
| **Ctrl + K** | Copy share link |

---

**Next**: See [05-slide-thumbnails.md](./05-slide-thumbnails.md) for thumbnail generation details.
