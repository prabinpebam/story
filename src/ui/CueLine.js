import { store } from '../core/Store.js';

function sourceName(source, fallback) {
    return source?.name || source?.title || fallback;
}

export function deriveCueLine(state) {
    const activeSlide = state.slides?.[state.editor?.activeSlideId] ?? null;
    const slideIndex = activeSlide ? state.slideOrder?.indexOf(activeSlide.id) ?? -1 : -1;
    const editScope = state.context?.editScope ?? 'Slide';
    const activeMasterSource = state.editor?.activeMasterId
        ? state.slideMasterPresets?.[state.editor.activeMasterId] ?? null
        : null;
    let layout = null;
    let master = null;
    let includeSlide = true;

    if (editScope === 'Master') {
        master = activeMasterSource?.type === 'layoutMaster'
            ? state.slideMasterPresets?.[activeMasterSource.parentMasterId] ?? null
            : activeMasterSource;
        includeSlide = false;
    } else if (editScope === 'Layout') {
        layout = activeMasterSource?.type === 'layoutMaster' ? activeMasterSource : null;
        master = layout?.parentMasterId ? state.slideMasterPresets?.[layout.parentMasterId] ?? null : activeMasterSource;
        includeSlide = false;
    } else {
        layout = activeSlide?.layoutId ? state.slideMasterPresets?.[activeSlide.layoutId] ?? null : null;
        const masterId = layout?.parentMasterId ?? state.editor?.activeMasterId ?? null;
        master = masterId ? state.slideMasterPresets?.[masterId] ?? null : null;
    }
    const nodes = [
        {
            id: 'presentation',
            label: state.meta?.title || 'Untitled Presentation',
            meta: 'presentation',
            kind: 'presentation',
            navigable: state.context?.view !== 'System'
        }
    ];

    if (master) {
        nodes.push({
            id: `master:${master.id}`,
            label: sourceName(master, 'Master'),
            meta: 'source',
            kind: 'master',
            sourceId: master.id,
            navigable: true
        });
    }

    if (layout) {
        nodes.push({
            id: `layout:${layout.id}`,
            label: sourceName(layout, 'Layout'),
            meta: master ? 'inherited' : 'source',
            kind: 'layout',
            sourceId: layout.id,
            navigable: true
        });
    }

    if (activeSlide && includeSlide) {
        nodes.push({
            id: `slide:${activeSlide.id}`,
            label: `Slide ${slideIndex >= 0 ? String(slideIndex + 1).padStart(2, '0') : ''}`.trim(),
            meta: activeSlide.title || 'Untitled',
            kind: 'slide',
            sourceId: activeSlide.id,
            navigable: state.context?.view !== 'Canvas' || editScope !== 'Slide'
        });
    }

    nodes.push({
        id: 'readiness',
        label: 'Readiness',
        meta: 'Unavailable',
        kind: 'readiness',
        status: 'unchecked',
        navigable: false
    });

    return {
        nodes,
        view: state.context?.view ?? 'Canvas',
        editScope,
        canReturn: (state.context?.editScopeStack?.length ?? 0) > 0,
        inRuntime: state.context?.runtimeMode != null
    };
}

export class CueLine {
    constructor(containerId = 'cue-line') {
        this.container = document.getElementById(containerId);
        this.expanded = false;
        this.bind();
        this.update(store.getState());
    }

    bind() {
        this.container?.addEventListener('click', (event) => {
            const node = event.target.closest('[data-cue-kind]');
            if (!node || !this.container.contains(node)) return;
            if (node.dataset.cueKind === 'expand') {
                this.expanded = !this.expanded;
                this.update(store.getState());
                this.container.querySelector('[data-cue-kind="expand"]')?.focus();
                return;
            }
            if (node.dataset.cueKind === 'return') {
                store.dispatch('EXIT_EDIT_SCOPE');
                return;
            }
            this.navigate(node.dataset.cueKind, node.dataset.sourceId);
        });
        store.on('state-changed', (state) => this.update(state));
    }

    navigate(kind, sourceId) {
        if (store.getState().context?.runtimeMode != null) return;
        if (kind === 'presentation') {
            store.dispatch('SET_VIEW', 'System');
            return;
        }
        if (kind === 'master' && sourceId) {
            store.dispatch('ENTER_EDIT_SCOPE', { scope: 'Master', sourceId, view: 'Canvas' });
            return;
        }
        if (kind === 'layout' && sourceId) {
            store.dispatch('ENTER_EDIT_SCOPE', { scope: 'Layout', sourceId, view: 'Canvas' });
            return;
        }
        if (kind === 'slide' && sourceId) {
            store.dispatch('ENTER_EDIT_SCOPE', { scope: 'Slide', sourceId, view: 'Canvas' });
        }
    }

    update(state) {
        if (!this.container) return;
        const model = deriveCueLine(state);
        this.container.classList.toggle('hidden', model.inRuntime);
        if (model.inRuntime) {
            this.container.replaceChildren();
            return;
        }
        this.container.classList.toggle('cue-line--expanded', this.expanded);
        this.container.dataset.view = model.view;
        this.container.dataset.editScope = model.editScope;
        this.container.replaceChildren();

        model.nodes.forEach((node, index) => {
            if (index > 0) {
                const connector = document.createElement('span');
                connector.className = 'cue-line__connector';
                connector.dataset.cueFromEnd = String(model.nodes.length - index);
                connector.setAttribute('aria-hidden', 'true');
                connector.textContent = '›';
                this.container.appendChild(connector);
            }

            const element = document.createElement(node.navigable ? 'button' : 'span');
            if (element instanceof HTMLButtonElement) element.type = 'button';
            element.className = 'cue-line__node';
            element.dataset.cueIndex = String(index);
            element.dataset.cueFromEnd = String(model.nodes.length - index);
            element.dataset.cueKind = node.kind;
            if (node.sourceId) element.dataset.sourceId = node.sourceId;
            if (node.status) element.dataset.status = node.status;
            if (node.navigable) element.classList.add('cue-line__node--navigable');
            const label = document.createElement('span');
            label.className = 'cue-line__label';
            label.textContent = node.label;
            const meta = document.createElement('span');
            meta.className = 'cue-line__meta';
            meta.textContent = node.meta;
            element.append(label, meta);
            this.container.appendChild(element);
        });

        if (model.canReturn) {
            const returnButton = document.createElement('button');
            returnButton.type = 'button';
            returnButton.className = 'cue-line__return';
            returnButton.dataset.cueKind = 'return';
            returnButton.textContent = 'Return';
            this.container.appendChild(returnButton);
        }

        const expand = document.createElement('button');
        expand.type = 'button';
        expand.className = 'cue-line__expand';
        expand.dataset.cueKind = 'expand';
        expand.setAttribute('aria-expanded', this.expanded.toString());
        expand.setAttribute('aria-label', this.expanded ? 'Collapse full source chain' : 'Show full source chain');
        expand.textContent = this.expanded ? '−' : '…';
        this.container.appendChild(expand);
    }
}