import { store } from '../core/Store.js';
import { ThumbnailRenderer } from '../core/renderer/ThumbnailRenderer.js';
import {
    createEmptyNotesDoc,
    legacyNotesToNotesDoc,
    notesDocToSafeHtml
} from '../core/notes/NotesDoc.js';

const VIEWS = ['Canvas', 'Grid', 'Outline', 'Notes', 'System'];

function plainTextFromHtml(html) {
    const element = document.createElement('div');
    element.innerHTML = String(html ?? '');
    return (element.textContent ?? '').replace(/\s+/g, ' ').trim();
}

function getTextElements(slide) {
    const order = slide?.effectiveOrder ?? slide?.elementOrder ?? [];
    const elements = slide?.effectiveElements ?? slide?.elements ?? {};
    return order
        .map((id) => elements[id])
        .filter((element) => element?.type === 'text' || element?.type === 'placeholder')
        .map((element) => ({ id: element.id, text: plainTextFromHtml(element.content) }))
        .filter((entry) => entry.text);
}

export class AuthoringViewManager {
    constructor({ workspaceId = 'authoring-workspace', canvasId = 'canvas-viewport', switcherId = 'authoring-view-switcher' } = {}) {
        this.workspace = document.getElementById(workspaceId);
        this.canvas = document.getElementById(canvasId);
        this.switcher = document.getElementById(switcherId);
        this.navigatorTrigger = document.getElementById('compact-navigator-trigger');
        this.inspectorTrigger = document.getElementById('compact-inspector-trigger');
        this.railBackdrop = document.getElementById('compact-rail-backdrop');
        this.activeThumbnailKeys = new Set();
        this.notesSaveTimer = null;
        this.notesSlideId = null;

        this.bind();
        this.update(store.getState());
    }

    bind() {
        this.switcher?.addEventListener('click', (event) => {
            const button = event.target.closest('[data-authoring-view]');
            if (!button || !this.switcher.contains(button)) return;
            store.dispatch('SET_VIEW', button.dataset.authoringView);
        });

        this.switcher?.addEventListener('keydown', (event) => {
            if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
            const current = store.getState().context?.view ?? 'Canvas';
            const currentIndex = Math.max(0, VIEWS.indexOf(current));
            let nextIndex = currentIndex;
            if (event.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + VIEWS.length) % VIEWS.length;
            if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % VIEWS.length;
            if (event.key === 'Home') nextIndex = 0;
            if (event.key === 'End') nextIndex = VIEWS.length - 1;
            event.preventDefault();
            store.dispatch('SET_VIEW', VIEWS[nextIndex]);
            this.switcher.querySelector(`[data-authoring-view="${VIEWS[nextIndex]}"]`)?.focus();
        });

        this.navigatorTrigger?.addEventListener('click', () => this.toggleCompactRail('navigator'));
        this.inspectorTrigger?.addEventListener('click', () => this.toggleCompactRail('inspector'));
        this.railBackdrop?.addEventListener('click', () => this.closeCompactRails());
        window.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && this.hasOpenCompactRail()) {
                event.preventDefault();
                this.closeCompactRails({ restoreFocus: true });
            }
        });
        window.addEventListener('resize', () => {
            if (!window.matchMedia('(max-width: 1640px)').matches) this.closeCompactRails();
        });

        store.on('state-changed', (state) => this.update(state));
    }

    update(state) {
        const inRuntime = state.context?.runtimeMode != null || state.editor?.mode === 'presentation';
        const view = VIEWS.includes(state.context?.view) ? state.context.view : 'Canvas';

        this.switcher?.classList.toggle('hidden', inRuntime);
        if (inRuntime) this.closeCompactRails();
        for (const button of this.switcher?.querySelectorAll('[data-authoring-view]') ?? []) {
            const selected = button.dataset.authoringView === view;
            button.classList.toggle('active', selected);
            button.setAttribute('aria-selected', selected.toString());
            button.tabIndex = selected ? 0 : -1;
        }

        if (inRuntime || view === 'Canvas') {
            this.flushNotes();
            this.clearGridThumbnails();
            this.workspace?.classList.add('hidden');
            this.canvas?.classList.remove('hidden');
            document.body.classList.remove('authoring-view-noncanvas');
            return;
        }

        this.canvas?.classList.add('hidden');
        this.workspace?.classList.remove('hidden');
        document.body.classList.add('authoring-view-noncanvas');
        this.render(view, state);
    }

    hasOpenCompactRail() {
        return document.body.classList.contains('compact-navigator-open')
            || document.body.classList.contains('compact-inspector-open')
            || (this.railBackdrop && !this.railBackdrop.classList.contains('hidden'));
    }

    toggleCompactRail(which) {
        const className = which === 'navigator' ? 'compact-navigator-open' : 'compact-inspector-open';
        const wasOpen = document.body.classList.contains(className);
        this.closeCompactRails();
        if (wasOpen) return;

        document.body.classList.add(className);
        this.railBackdrop?.classList.remove('hidden');
        this.navigatorTrigger?.setAttribute('aria-expanded', (which === 'navigator').toString());
        this.inspectorTrigger?.setAttribute('aria-expanded', (which === 'inspector').toString());
        const rail = document.getElementById(which === 'navigator' ? 'sidebar-left' : 'sidebar-right');
        rail?.querySelector('button, input, [tabindex]:not([tabindex="-1"])')?.focus();
    }

    closeCompactRails({ restoreFocus = false } = {}) {
        const navigatorWasOpen = document.body.classList.contains('compact-navigator-open');
        const inspectorWasOpen = document.body.classList.contains('compact-inspector-open');
        document.body.classList.remove('compact-navigator-open', 'compact-inspector-open');
        this.railBackdrop?.classList.add('hidden');
        this.navigatorTrigger?.setAttribute('aria-expanded', 'false');
        this.inspectorTrigger?.setAttribute('aria-expanded', 'false');
        if (restoreFocus) {
            if (navigatorWasOpen) this.navigatorTrigger?.focus();
            if (inspectorWasOpen) this.inspectorTrigger?.focus();
        }
    }

    render(view, state) {
        if (!this.workspace) return;
        if (view !== 'Notes') this.flushNotes();

        if (view === 'Grid') this.renderGrid(state);
        if (view === 'Outline') this.renderOutline(state);
        if (view === 'Notes') this.renderNotes(state);
        if (view === 'System') this.renderSystem(state);
    }

    renderHeader(view, state) {
        const header = document.createElement('header');
        header.className = 'authoring-workspace__header';

        const title = document.createElement('h1');
        title.className = 'authoring-workspace__title';
        title.textContent = view;

        const meta = document.createElement('div');
        meta.className = 'authoring-workspace__meta';
        meta.textContent = `${state.meta?.title ?? 'Untitled Presentation'} · ${state.slideOrder?.length ?? 0} slides`;

        header.append(title, meta);
        return header;
    }

    selectSlide(slideId, multi = false) {
        store.dispatch('SET_ACTIVE_SLIDE', slideId);
        store.dispatch('SELECT_SLIDE', { id: slideId, multi });
    }

    renderGrid(state) {
        this.clearGridThumbnails();
        this.workspace.replaceChildren(this.renderHeader('Grid', state));

        const grid = document.createElement('div');
        grid.className = 'authoring-grid';
        grid.setAttribute('data-testid', 'authoring-grid');

        state.slideOrder.forEach((slideId, index) => {
            const slide = state.slides[slideId];
            if (!slide) return;

            const item = document.createElement('button');
            item.type = 'button';
            item.className = 'authoring-grid__item';
            item.classList.toggle('selected', state.editor.selectedSlideIds?.includes(slideId));
            item.setAttribute('aria-label', `Slide ${index + 1}: ${slide.title || 'Untitled'}`);
            item.dataset.slideId = slideId;
            item.addEventListener('click', (event) => this.selectSlide(slideId, event.ctrlKey || event.metaKey));
            item.addEventListener('dblclick', () => {
                this.selectSlide(slideId);
                store.dispatch('SET_VIEW', 'Canvas');
            });

            const thumbnailKey = `authoring-grid:${slideId}`;
            const effectiveSlide = store.getEffectiveSlide(slideId) ?? slide;
            item.appendChild(ThumbnailRenderer.createThumbnail(slideId, effectiveSlide, thumbnailKey));
            this.activeThumbnailKeys.add(thumbnailKey);

            const label = document.createElement('div');
            label.className = 'authoring-grid__label';
            const number = document.createElement('span');
            number.textContent = String(index + 1);
            const name = document.createElement('strong');
            name.textContent = slide.title || `Slide ${index + 1}`;
            label.append(number, name);
            item.appendChild(label);
            grid.appendChild(item);
        });

        this.workspace.appendChild(grid);
    }

    clearGridThumbnails() {
        for (const key of this.activeThumbnailKeys) ThumbnailRenderer.destroyThumbnail(key);
        this.activeThumbnailKeys.clear();
    }

    renderOutline(state) {
        if (this.workspace?.querySelector('.authoring-outline__title:focus')) return;
        this.clearGridThumbnails();
        this.workspace.replaceChildren(this.renderHeader('Outline', state));
        const outline = document.createElement('div');
        outline.className = 'authoring-outline';
        outline.setAttribute('data-testid', 'authoring-outline');

        state.slideOrder.forEach((slideId, index) => {
            const slide = state.slides[slideId];
            if (!slide) return;
            const effectiveSlide = store.getEffectiveSlide(slideId) ?? slide;

            const row = document.createElement('section');
            row.className = 'authoring-outline__slide';
            row.dataset.slideId = slideId;

            const number = document.createElement('div');
            number.className = 'authoring-outline__number';
            number.textContent = String(index + 1).padStart(2, '0');

            const title = document.createElement('input');
            title.className = 'authoring-outline__title';
            title.value = slide.title || '';
            title.setAttribute('aria-label', `Slide ${index + 1} title`);
            title.addEventListener('focus', () => this.selectSlide(slideId));
            title.addEventListener('change', () => store.dispatch('UPDATE_SLIDE', { id: slideId, title: title.value.trim() }));

            const content = document.createElement('div');
            content.className = 'authoring-outline__content';
            const textElements = getTextElements(effectiveSlide);
            if (textElements.length === 0) {
                const empty = document.createElement('div');
                empty.className = 'authoring-workspace__meta';
                empty.textContent = 'No semantic text on this slide';
                content.appendChild(empty);
            } else {
                for (const entry of textElements) {
                    const text = document.createElement('button');
                    text.type = 'button';
                    text.className = 'authoring-outline__text';
                    text.textContent = entry.text;
                    text.addEventListener('click', () => {
                        this.selectSlide(slideId);
                        store.dispatch('UPDATE_SELECTION', [entry.id]);
                    });
                    content.appendChild(text);
                }
            }

            row.append(number, title, content);
            outline.appendChild(row);
        });

        this.workspace.appendChild(outline);
    }

    renderNotes(state) {
        const slideId = state.editor.activeSlideId;
        const slide = state.slides[slideId];
        const currentEditor = this.workspace?.querySelector('.authoring-notes__editor');
        if (currentEditor?.dataset.slideId === slideId && document.activeElement === currentEditor) return;
        this.clearGridThumbnails();
        this.workspace.replaceChildren(this.renderHeader('Notes', state));
        if (!slide) return;

        const layout = document.createElement('div');
        layout.className = 'authoring-notes';
        layout.setAttribute('data-testid', 'authoring-notes');

        const reference = document.createElement('div');
        reference.className = 'authoring-notes__reference';
        const effectiveSlide = store.getEffectiveSlide(slideId) ?? slide;
        const thumbnailKey = `authoring-notes:${slideId}`;
        reference.appendChild(ThumbnailRenderer.createThumbnail(slideId, effectiveSlide, thumbnailKey));
        this.activeThumbnailKeys.add(thumbnailKey);
        const title = document.createElement('h2');
        title.textContent = slide.title || 'Untitled slide';
        reference.appendChild(title);

        const editor = document.createElement('div');
        editor.className = 'authoring-notes__editor';
        editor.contentEditable = 'true';
        editor.setAttribute('role', 'textbox');
        editor.setAttribute('aria-multiline', 'true');
        editor.setAttribute('aria-label', `Notes for ${slide.title || 'active slide'}`);
        editor.dataset.slideId = slideId;
        const notesDoc = slide.notesDoc ?? ((slide.notes || '').trim() ? legacyNotesToNotesDoc(slide.notes) : createEmptyNotesDoc());
        editor.innerHTML = notesDocToSafeHtml(notesDoc);
        editor.addEventListener('input', () => this.scheduleNotesSave(editor));
        editor.addEventListener('blur', () => this.flushNotes());
        this.notesSlideId = slideId;

        layout.append(reference, editor);
        this.workspace.appendChild(layout);
    }

    scheduleNotesSave(editor) {
        if (this.notesSaveTimer) clearTimeout(this.notesSaveTimer);
        this.notesSaveTimer = setTimeout(() => {
            this.notesSaveTimer = null;
            const slideId = editor.dataset.slideId;
            if (!slideId || !editor.isConnected) return;
            store.dispatch('UPDATE_SLIDE', { id: slideId, notesDoc: legacyNotesToNotesDoc(editor.innerHTML) });
        }, 200);
    }

    flushNotes() {
        if (!this.notesSaveTimer) return;
        clearTimeout(this.notesSaveTimer);
        this.notesSaveTimer = null;
        const editor = this.workspace?.querySelector('.authoring-notes__editor');
        const slideId = editor?.dataset.slideId ?? this.notesSlideId;
        if (editor && slideId) {
            store.dispatch('UPDATE_SLIDE', { id: slideId, notesDoc: legacyNotesToNotesDoc(editor.innerHTML) });
        }
    }

    renderSystem(state) {
        this.clearGridThumbnails();
        this.workspace.replaceChildren(this.renderHeader('System', state));
        const system = document.createElement('div');
        system.className = 'authoring-system';
        system.setAttribute('data-testid', 'authoring-system');

        const activeSlide = state.slides[state.editor.activeSlideId];
        const activeMaster = state.slideMasterPresets[state.editor.activeMasterId];
        const rows = [
            ['Presentation', state.meta?.title ?? 'Untitled Presentation'],
            ['Current source', state.context?.editScope ?? 'Slide'],
            ['Workspace view', state.context?.view ?? 'System'],
            ['Active slide', activeSlide ? `${state.slideOrder.indexOf(activeSlide.id) + 1}. ${activeSlide.title || 'Untitled'}` : 'None'],
            ['Layout', activeSlide?.layoutId ?? 'None'],
            ['Master', activeMaster?.name ?? activeMaster?.title ?? state.editor.activeMasterId ?? 'None'],
            ['Color theme', activeSlide?.colorThemeId ?? state.meta?.theme ?? 'Default'],
            ['Typography style', activeSlide?.typographyStyleId ?? 'Inherited'],
            ['Runtime', state.context?.runtimeMode ?? 'Not active'],
            ['Story System', 'Not created']
        ];

        for (const [labelText, valueText] of rows) {
            const row = document.createElement('div');
            row.className = 'authoring-system__row';
            const label = document.createElement('div');
            label.className = 'authoring-system__label';
            label.textContent = labelText;
            const value = document.createElement('div');
            value.className = 'authoring-system__value';
            value.textContent = valueText;
            row.append(label, value);
            system.appendChild(row);
        }

        this.workspace.appendChild(system);
    }
}