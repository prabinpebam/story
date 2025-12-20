import { Button } from './components/Button.js';
import { Icons } from './Icons.js';
import { getShortcutCatalog, groupShortcutsBySection } from './shortcuts/shortcutCatalog.js';
import { MasonryGrid } from './layout/MasonryGrid.js';

export class KeyboardShortcutsModal {
    constructor() {
        this.isOpen = false;
        this.query = '';
        this.shortcuts = getShortcutCatalog();
        this.grouped = groupShortcutsBySection(this.shortcuts);

        this._masonry = null;

        this._create();
        this._bind();
    }

    _create() {
        this.overlay = document.createElement('div');
        this.overlay.className = 'modal-overlay shortcuts-overlay';
        this.overlay.setAttribute('data-testid', 'keyboard-shortcuts-overlay');
        this.overlay.setAttribute('data-open', 'false');
        this.overlay.style.display = 'none';

        this.modal = document.createElement('div');
        this.modal.className = 'modal-content shortcuts-modal';
        this.modal.setAttribute('role', 'dialog');
        this.modal.setAttribute('aria-modal', 'true');
        this.modal.setAttribute('aria-labelledby', 'keyboard-shortcuts-title');

        this.header = document.createElement('div');
        this.header.className = 'shortcuts-modal__header';

        const title = document.createElement('h3');
        title.id = 'keyboard-shortcuts-title';
        title.setAttribute('data-testid', 'keyboard-shortcuts-title');
        title.textContent = 'Keyboard Shortcuts';

        this.closeBtn = new Button({
            icon: Icons.CLOSE,
            label: '',
            variant: 'text',
            size: 'sm',
            ariaLabel: 'Close keyboard shortcuts',
            dataTestId: 'keyboard-shortcuts-close',
            onClick: () => this.close(),
        });
        this.closeBtn.element.classList.add('shortcuts-modal__close');

        this.header.appendChild(title);
        this.header.appendChild(this.closeBtn.element);

        this.searchRow = document.createElement('div');
        this.searchRow.className = 'shortcuts-modal__search-row';

        this.searchInput = document.createElement('input');
        this.searchInput.type = 'text';
        this.searchInput.className = 'form-control shortcuts-modal__search';
        this.searchInput.placeholder = 'Search shortcuts…';
        this.searchInput.setAttribute('data-testid', 'keyboard-shortcuts-search');
        this.searchInput.setAttribute('autocomplete', 'off');

        this.searchRow.appendChild(this.searchInput);

        this.body = document.createElement('div');
        this.body.className = 'shortcuts-modal__body';

        this.list = document.createElement('div');
        this.list.className = 'shortcuts-modal__list ds-masonry-grid';
        this.list.setAttribute('data-testid', 'keyboard-shortcuts-list');

        this.body.appendChild(this.list);

        this.modal.appendChild(this.header);
        this.modal.appendChild(this.searchRow);
        this.modal.appendChild(this.body);

        this.overlay.appendChild(this.modal);
        document.body.appendChild(this.overlay);

        this._renderList();

        this._masonry = new MasonryGrid(this.list, {
            itemSelector: '.shortcuts-modal__section',
        });
    }

    _bind() {
        // Backdrop click closes
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) this.close();
        });

        // Search updates
        this.searchInput.addEventListener('input', () => {
            this.query = this.searchInput.value || '';
            this._renderList();
        });

        // Modal key handling (capture) to behave like a true modal.
        document.addEventListener(
            'keydown',
            (e) => {
                if (!this.isOpen) return;

                const isCmdOrCtrl = e.ctrlKey || e.metaKey;
                const isQuestion = !isCmdOrCtrl && (e.key === '?' || (e.code === 'Slash' && e.shiftKey));
                const isCmdCtrlSlash = isCmdOrCtrl && (e.key === '/' || e.code === 'Slash');
                const isToggle = isQuestion || isCmdCtrlSlash;

                if (e.key === 'Escape' || isToggle) {
                    e.preventDefault();
                    e.stopPropagation();
                    this.close();
                    return;
                }

                // Prevent other app shortcuts while the modal is open.
                e.stopPropagation();
            },
            true
        );
    }

    _renderList() {
        const q = this.query.trim().toLowerCase();

        this.list.innerHTML = '';

        const groups = this.grouped
            .map(({ section, items }) => {
                const filtered = q
                    ? items.filter((it) => (it.label || '').toLowerCase().includes(q))
                    : items;
                return { section, items: filtered };
            })
            .filter((g) => g.items.length > 0);

        for (const group of groups) {
            const sectionEl = document.createElement('div');
            sectionEl.className = 'shortcuts-modal__section ds-surface-card ds-masonry-item';

            const header = document.createElement('div');
            header.className = 'shortcuts-modal__section-title';
            header.textContent = group.section;
            sectionEl.appendChild(header);

            const grid = document.createElement('div');
            grid.className = 'shortcuts-modal__grid';

            for (const item of group.items) {
                const row = document.createElement('div');
                row.className = 'shortcuts-modal__row';
                row.setAttribute('data-testid', `keyboard-shortcut-row-${item.id}`);

                const label = document.createElement('div');
                label.className = 'shortcuts-modal__label';
                label.textContent = item.label;

                const keys = document.createElement('div');
                keys.className = 'shortcuts-modal__keys';

                for (const token of String(item.shortcut).split('/').map((s) => s.trim()).filter(Boolean)) {
                    const kbd = document.createElement('kbd');
                    kbd.className = 'shortcuts-modal__kbd';
                    kbd.textContent = token;
                    keys.appendChild(kbd);
                }

                row.appendChild(label);
                row.appendChild(keys);
                grid.appendChild(row);
            }

            sectionEl.appendChild(grid);
            this.list.appendChild(sectionEl);
        }

        // Ensure masonry spans are recalculated after DOM updates.
        this._masonry?.scheduleLayout();
    }

    open() {
        if (this.isOpen) return;
        this.isOpen = true;
        this.overlay.style.display = 'flex';
        this.overlay.setAttribute('data-open', 'true');

        // The modal is display:none when closed; relayout after it becomes visible.
        requestAnimationFrame(() => this._masonry?.scheduleLayout());

        // Focus the search input for quick filtering.
        setTimeout(() => this.searchInput.focus(), 0);
    }

    close() {
        if (!this.isOpen) return;
        this.isOpen = false;
        this.overlay.style.display = 'none';
        this.overlay.setAttribute('data-open', 'false');

        // Reset search for next time.
        this.searchInput.value = '';
        this.query = '';
        this._renderList();
    }

    toggle() {
        if (this.isOpen) this.close();
        else this.open();
    }
}
