# 30 — File Operations

> Taskflows for save, load, autosave, cloud storage, and the .str file format.

## Local File Operations

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| FOP-01 | Save to file | Ctrl+S | Serializes state to .str (ZIP-based) via `PresentationSerializer`; uses File System Access API or fallback download | — |
| FOP-02 | Save as | Ctrl+Shift+S | Opens save picker for new filename/location | — |
| FOP-03 | Open file | Ctrl+O | Opens file picker; `.str` file deserialized via `PresentationDeserializer` | — |
| FOP-04 | New presentation | Ctrl+N | Creates fresh state with default slide, master, and theme | — |
| FOP-05 | File handle retention | Save to same file twice | File System Access API retains handle; second save writes to same file without picker | — |
| FOP-06 | Fallback download | Browser without File System Access API | Hidden `<a>` download + `<input type="file">` for open | — |

## .str File Format

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| FOP-07 | Serialize presentation | Save triggered | ZIP containing: manifest, metadata, theme, slide masters, slide order, sections, individual slides, assets, thumbnail | — |
| FOP-08 | Deserialize presentation | Open file | ZIP extracted; manifest validates structure; state rebuilt from individual files | — |

## Cloud Storage

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| FOP-09 | Save to Google Drive | File → Save to Google Drive | `GoogleDriveProvider` uploads .str via Drive API; requires OAuth | — |
| FOP-10 | Open from Google Drive | File → Open from Google Drive | `GoogleDrivePicker` or `CloudFileBrowser` lists files; downloads and deserializes | — |
| FOP-11 | Save to OneDrive | File → Save to OneDrive | `OneDriveProvider` uploads via Graph API; requires OAuth | — |
| FOP-12 | Open from OneDrive | File → Open from OneDrive | `OneDrivePicker` or `CloudFileBrowser` lists files | — |
| FOP-13 | Dynamic auth menu items | Cloud provider authenticated | Save/Open menu items only shown for authenticated providers | — |

## Autosave

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| FOP-14 | Autosave to IndexedDB | State changes (debounced) | `AutosaveManager` writes to IndexedDB `FileCache`; configurable debounce | — |
| FOP-15 | Crash recovery | App restart after crash | Autosaved state recovered from IndexedDB; user prompted to restore | — |
| FOP-16 | Unsaved changes tracking | Any edit after last save | Unsaved indicator shown; warns before navigation/close | — |
| FOP-17 | Version tracking | Each autosave | Incremental version number stored with autosave | — |
| FOP-18 | Conflict detection | Multiple tabs editing same file | Conflict detected; user prompted to resolve | — |

## Sharing

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| FOP-19 | Generate share link | Share button → Generate link | `ShareLinkGenerator` creates shareable URL; copies to clipboard | — |
| FOP-20 | Set share permissions | Access settings modal | `PermissionNormalizer` normalizes permissions: view, comment, edit | — |
| FOP-21 | Open shared file | Navigate to share link | `SharingManager` resolves link, loads presentation, connects collaboration | — |
