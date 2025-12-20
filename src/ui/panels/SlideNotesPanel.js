import { store } from '../../core/Store.js';
import { DraggablePanel } from '../components/DraggablePanel.js';
import {
    createEmptyNotesDoc,
    legacyNotesToNotesDoc,
    notesDocToSafeHtml
} from '../../core/notes/NotesDoc.js';

function getActiveSlideFromState(state) {
    const slideId = state?.editor?.activeSlideId;
    return slideId ? state?.slides?.[slideId] : null;
}

export class SlideNotesPanel extends DraggablePanel {
    constructor() {
        super({
            id: 'slide-notes',
            title: 'Notes',
            defaultWidth: 360,
            defaultHeight: 420,
            minWidth: 300,
            minHeight: 240,
            maxWidth: 700,
            maxHeight: 900,
            resizable: true,
            closable: true,
            minimizable: true
        });

        this.element.classList.add('slide-notes-panel');
        this.element.setAttribute('data-testid', 'slide-notes-panel');

        this._activeSlideId = null;
    this._editingSlideId = null;
        this._editorEl = null;
        this._saveTimer = null;
    this._isDirty = false;

        this._buildUI();

        store.on('state-changed', (state) => this._onStateChanged(state));
        this._onStateChanged(store.getState());
    }

    // Spec requirement: remember position/size for the session only.
    _getSessionStorageKey() {
        return `sessionDraggablePanel_${this.options.id}`;
    }

    savePosition() {
        try {
            const data = {
                x: this.position.x,
                y: this.position.y,
                width: this.size.width,
                height: this.size.height,
                isMinimized: this.isMinimized
            };
            sessionStorage.setItem(this._getSessionStorageKey(), JSON.stringify(data));
        } catch {
            // Ignore persistence failures
        }
    }

    loadPosition() {
        try {
            const saved = sessionStorage.getItem(this._getSessionStorageKey());
            if (saved) {
                const data = JSON.parse(saved);
                this.position.x = data.x ?? this.position.x;
                this.position.y = data.y ?? this.position.y;
                this.size.width = data.width ?? this.size.width;
                this.size.height = data.height ?? this.size.height;
                this.isMinimized = data.isMinimized ?? false;
                this.constrainToViewport();
                return;
            }
        } catch {
            // fall through
        }

        if (this.options.defaultPosition) {
            this.position.x = this.options.defaultPosition.x;
            this.position.y = this.options.defaultPosition.y;
        } else {
            this.centerInViewport();
        }
    }

    _buildUI() {
        this.contentElement.classList.add('slide-notes-panel__content');

        const toolbar = document.createElement('div');
        toolbar.className = 'slide-notes-toolbar';
        toolbar.setAttribute('role', 'toolbar');
        toolbar.setAttribute('aria-label', 'Notes formatting');

        const makeBtn = (label, title, command, value = null) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'btn btn--text btn--xs slide-notes-toolbar__btn';
            btn.innerHTML = label;
            btn.title = title;
            btn.setAttribute('aria-label', title);
            btn.addEventListener('mousedown', (e) => {
                // Prevent focus loss from editor selection.
                e.preventDefault();
            });
            btn.addEventListener('click', () => {
                if (!this._editorEl) return;
                this._editorEl.focus();
                try {
                    document.execCommand(command, false, value);
                } catch {
                    // ignore
                }
                this._scheduleSave();
            });
            return btn;
        };

        toolbar.appendChild(makeBtn('<strong>B</strong>', 'Bold', 'bold'));
        toolbar.appendChild(makeBtn('<em>I</em>', 'Italics', 'italic'));
        toolbar.appendChild(makeBtn('<s>S</s>', 'Strikethrough', 'strikeThrough'));
        toolbar.appendChild(makeBtn('H1', 'Heading 1', 'formatBlock', 'h1'));
        toolbar.appendChild(makeBtn('H2', 'Heading 2', 'formatBlock', 'h2'));
        toolbar.appendChild(makeBtn('H3', 'Heading 3', 'formatBlock', 'h3'));
        toolbar.appendChild(makeBtn('•', 'Bullet list', 'insertUnorderedList'));
        toolbar.appendChild(makeBtn('1.', 'Numbered list', 'insertOrderedList'));
        toolbar.appendChild(makeBtn('↦', 'Indent', 'indent'));
        toolbar.appendChild(makeBtn('↤', 'Outdent', 'outdent'));

        const editor = document.createElement('div');
        editor.className = 'slide-notes-editor';
        editor.setAttribute('data-testid', 'slide-notes-editor');
        editor.setAttribute('contenteditable', 'true');
        editor.setAttribute('role', 'textbox');
        editor.setAttribute('aria-multiline', 'true');
        editor.setAttribute('aria-label', 'Slide notes');
        editor.spellcheck = true;

        editor.addEventListener('input', () => this._scheduleSave());
        editor.addEventListener('blur', () => this._flushSave());

        this.contentElement.appendChild(toolbar);
        this.contentElement.appendChild(editor);

        this._editorEl = editor;
    }

    _onStateChanged(state) {
        const mode = state?.editor?.mode;
        if (mode === 'presentation') {
            if (this.isOpen) this.close();
            return;
        }

        const slideId = state?.editor?.activeSlideId;
        if (!slideId) {
            if (this.isOpen) this.close();
            return;
        }

        if (this._activeSlideId !== slideId) {
            // If the user switches slides while a debounced save is pending,
            // flush to the previous slide before loading new notes.
            // IMPORTANT: set _activeSlideId first to avoid recursive state-changed loops
            // caused by flushing (dispatching UPDATE_SLIDE) within this handler.
            this._activeSlideId = slideId;
            if (this.isOpen) this._flushSave();
            if (this.isOpen) this._loadActiveSlideNotes(state);
        }
    }

    open() {
        super.open();
        this._loadActiveSlideNotes(store.getState());
    }

    onClose() {
        this._flushSave();
    }

    _loadActiveSlideNotes(state) {
        if (!this._editorEl) return;

        const slide = getActiveSlideFromState(state);
        if (!slide) {
            this._editorEl.innerHTML = '';
            this._editingSlideId = null;
            this._isDirty = false;
            return;
        }

        // Any content we render from state is by definition not dirty.
        this._editingSlideId = slide.id;
        this._isDirty = false;

        const doc = slide.notesDoc
            ? slide.notesDoc
            : (slide.notes || '').trim()
                ? legacyNotesToNotesDoc(slide.notes)
                : createEmptyNotesDoc();

        this._editorEl.innerHTML = notesDocToSafeHtml(doc);
    }

    _scheduleSave() {
        if (!this.isOpen) return;
        if (!this._editorEl) return;

        this._isDirty = true;

        if (this._saveTimer) {
            clearTimeout(this._saveTimer);
            this._saveTimer = null;
        }

        this._saveTimer = setTimeout(() => this._flushSave(), 200);
    }

    _flushSave() {
        if (!this.isOpen) return;
        if (!this._editorEl) return;

        if (!this._isDirty) {
            if (this._saveTimer) {
                clearTimeout(this._saveTimer);
                this._saveTimer = null;
            }
            return;
        }

        if (this._saveTimer) {
            clearTimeout(this._saveTimer);
            this._saveTimer = null;
        }

        const slideId = this._editingSlideId;
        if (!slideId) return;

        // Clear dirty/timer BEFORE dispatch to avoid re-entrant state-changed handlers
        // repeatedly flushing while UPDATE_SLIDE is being processed.
        this._isDirty = false;

        const doc = legacyNotesToNotesDoc(this._editorEl.innerHTML);
        store.dispatch('UPDATE_SLIDE', { id: slideId, notesDoc: doc });
    }
}
