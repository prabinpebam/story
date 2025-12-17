import { store } from '../core/Store.js';
import { cursorManager } from '../core/CursorManager.js';

export class Toolbar {
    constructor() {
        this.buttons = document.querySelectorAll('#floating-toolbar .tool-btn');
        this.panels = {
            resources: document.getElementById('icon-library')
        };

        this.shapeMenu = null;
        this.shapeMenuOpen = false;
        this.lastShapeKind = 'rectangle';
        this.lastLineEndCap = null; // 'arrow' | null

        this.init();
    }

    init() {
        console.log('Toolbar initialized', this.buttons.length);

        const shapeBtn = document.querySelector('[data-testid="tool-shape"]');
        const shapeCaret = shapeBtn?.querySelector('[data-testid="tool-shape-caret"]');
        if (shapeCaret) {
            shapeCaret.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.openShapeMenu();
            });
        }

        // Long-press on shape tool opens the menu (Spec 39).
        if (shapeBtn) {
            let longPressTimer = null;
            const clearTimer = () => {
                if (longPressTimer) {
                    clearTimeout(longPressTimer);
                    longPressTimer = null;
                }
            };

            shapeBtn.addEventListener('mousedown', (e) => {
                if (e.button !== 0) return;
                // Don't start a long press when the caret was the target.
                if (e.target?.closest?.('[data-testid="tool-shape-caret"]')) return;
                clearTimer();
                longPressTimer = setTimeout(() => {
                    longPressTimer = null;
                    this.openShapeMenu();
                }, 350);
            });

            shapeBtn.addEventListener('mouseup', clearTimer);
            shapeBtn.addEventListener('mouseleave', clearTimer);
        }
        
        // Button Clicks
        this.buttons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tool = btn.dataset.tool;
                if (tool === 'resources') {
                    this.togglePanel('resources');
                } else if (tool === 'shape') {
                    // Shape tool uses activeToolOptions.shapeKind (Spec 39)
                    this.setShapeTool(this.lastShapeKind, this.lastLineEndCap);
                } else if (tool) {
                    store.dispatch('SET_ACTIVE_TOOL', tool);
                }
                // Remove focus so spacebar doesn't trigger button again
                btn.blur();
            });
        });

        // Keyboard Shortcuts
        document.addEventListener('keydown', (e) => {
            // Ignore if typing in an input
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;

            // Close shape menu on Escape
            if (e.key === 'Escape' && this.shapeMenuOpen) {
                this.closeShapeMenu();
                return;
            }

            switch(e.key.toLowerCase()) {
                case 'v': store.dispatch('SET_ACTIVE_TOOL', 'select'); break;
                case 'h': store.dispatch('SET_ACTIVE_TOOL', 'hand'); break;
                // Shapes (Spec 39)
                case 'r': this.setShapeTool('rectangle', null); break;
                case 'o': this.setShapeTool('ellipse', null); break;
                case 'l':
                    if (e.shiftKey) {
                        this.setShapeTool('line', 'arrow');
                    } else {
                        this.setShapeTool('line', null);
                    }
                    break;
                case 'p':
                    if (e.shiftKey) this.setShapeTool('polygon', null);
                    break;
                case 's':
                    if (e.shiftKey) this.setShapeTool('star', null);
                    break;
                case 't': store.dispatch('SET_ACTIVE_TOOL', 'text'); break;
                case 'i': 
                    if (e.shiftKey) this.togglePanel('resources'); 
                    break;
                case 'k':
                    if (e.shiftKey) store.dispatch('SET_ACTIVE_TOOL', 'image');
                    break;
            }
        });

        // Close shape menu on outside click
        document.addEventListener('mousedown', (e) => {
            if (!this.shapeMenuOpen) return;
            const within = e.target?.closest?.('[data-testid="tool-shape"]') || e.target?.closest?.('.context-menu');
            if (!within) this.closeShapeMenu();
        });

        // Subscribe to state changes
        store.on('state-changed', (state) => {
            this.updateActiveState(state.editor.activeTool);
            this.updateCursor(state.editor.activeTool);

            const options = state.editor.activeToolOptions;
            if (state.editor.activeTool === 'shape' && options && typeof options === 'object') {
                const kind = options.shapeKind;
                if (typeof kind === 'string') {
                    this.lastShapeKind = kind;
                }
                this.lastLineEndCap = options.lineEndCap === 'arrow' ? 'arrow' : null;
            }

            this.updateShapeToolVisuals(state);
        });
        
        // Initialize cursor
        const state = store.getState();
        if (state.editor && state.editor.activeTool) {
            this.updateCursor(state.editor.activeTool);
        }

        this.updateShapeToolVisuals(state);

        // Close buttons on panels
        document.querySelectorAll('.floating-panel .close-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const panel = e.target.closest('.floating-panel');
                if (panel) {
                    panel.classList.add('hidden');
                    // Deactivate corresponding toolbar button
                    if (panel.id === 'icon-library') {
                        const toolBtn = document.querySelector('[data-tool="resources"]');
                        if (toolBtn) toolBtn.classList.remove('active');
                    }
                }
            });
        });
    }

    setShapeTool(shapeKind = 'rectangle', lineEndCap = null) {
        this.lastShapeKind = shapeKind;
        this.lastLineEndCap = lineEndCap === 'arrow' ? 'arrow' : null;

        // Spec 39 requires: activeTool='shape' and activeToolOptions.shapeKind
        const payload = {
            tool: 'shape',
            shapeKind: this.lastShapeKind
        };
        if (this.lastShapeKind === 'line' && this.lastLineEndCap === 'arrow') {
            payload.lineEndCap = 'arrow';
        }

        store.dispatch('SET_ACTIVE_TOOL', payload);
        this.closeShapeMenu();
    }

    openShapeMenu() {
        if (this.shapeMenuOpen) {
            this.closeShapeMenu();
            return;
        }

        const btn = document.querySelector('[data-testid="tool-shape"]');
        if (!btn) return;

        if (this.shapeMenu) {
            this.shapeMenu.remove();
            this.shapeMenu = null;
        }

        const menu = document.createElement('div');
        menu.className = 'context-menu visible';
        menu.setAttribute('role', 'menu');
        menu.setAttribute('data-testid', 'shape-tool-menu');

        const items = [
            { label: 'Rectangle', kind: 'rectangle', shortcut: 'R' },
            { label: 'Ellipse', kind: 'ellipse', shortcut: 'O' },
            { label: 'Line', kind: 'line', shortcut: 'L' },
            { label: 'Arrow', kind: 'line', lineEndCap: 'arrow', shortcut: 'Shift+L' },
            { label: 'Polygon', kind: 'polygon', shortcut: 'Shift+P' },
            { label: 'Star', kind: 'star', shortcut: 'Shift+S' }
        ];

        items.forEach((it) => {
            const row = document.createElement('div');
            row.className = 'context-menu-item';
            row.setAttribute('role', 'menuitem');
            row.setAttribute('data-testid', `shape-menu-${it.label.toLowerCase()}`);

            const label = document.createElement('div');
            label.className = 'context-menu-label';
            label.textContent = it.label;

            const shortcut = document.createElement('div');
            shortcut.className = 'context-menu-shortcut';
            shortcut.textContent = it.shortcut;

            row.appendChild(label);
            row.appendChild(shortcut);

            row.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.setShapeTool(it.kind, it.lineEndCap || null);
            });

            menu.appendChild(row);
        });

        const r = btn.getBoundingClientRect();
        const menuWidth = 220;
        const left = Math.max(8, Math.min(window.innerWidth - menuWidth - 8, r.left + r.width / 2 - menuWidth / 2));
        // Mount first so we can measure actual height, then reposition.
        menu.style.left = `${left}px`;
        menu.style.top = `${Math.max(8, r.bottom + 8)}px`;
        menu.style.transformOrigin = 'top center';

        document.body.appendChild(menu);

        requestAnimationFrame(() => {
            if (!this.shapeMenu || this.shapeMenu !== menu) return;
            const mb = menu.getBoundingClientRect();
            const spaceAbove = r.top - 8;
            const spaceBelow = window.innerHeight - r.bottom - 8;

            let top;
            if (spaceAbove >= mb.height || spaceAbove >= spaceBelow) {
                top = Math.max(8, r.top - mb.height - 8);
                menu.style.transformOrigin = 'bottom center';
            } else {
                top = Math.max(8, Math.min(window.innerHeight - mb.height - 8, r.bottom + 8));
                menu.style.transformOrigin = 'top center';
            }

            menu.style.top = `${top}px`;
        });
        this.shapeMenu = menu;
        this.shapeMenuOpen = true;
    }

    closeShapeMenu() {
        if (this.shapeMenu) {
            this.shapeMenu.remove();
            this.shapeMenu = null;
        }
        this.shapeMenuOpen = false;
    }

    updateShapeToolVisuals(state) {
        const btn = document.querySelector('[data-testid="tool-shape"]');
        if (!btn) return;

        const iconEl = btn.querySelector('[data-testid="tool-shape-icon"]');
        const options = state?.editor?.activeToolOptions;
        const kind = (state?.editor?.activeTool === 'shape' && options?.shapeKind) ? options.shapeKind : this.lastShapeKind;
        const isArrow = kind === 'line' && options?.lineEndCap === 'arrow';

        const titleByKind = {
            rectangle: 'Rectangle (R)',
            ellipse: 'Ellipse (O)',
            line: isArrow ? 'Arrow (Shift+L)' : 'Line (L)',
            polygon: 'Polygon (Shift+P)',
            star: 'Star (Shift+S)'
        };
        const title = titleByKind[kind] || 'Shape (R)';
        btn.title = title;
        btn.setAttribute('aria-label', `Shape tool (${title})`);

        if (!iconEl) return;

        const iconClassByKind = {
            rectangle: 'fa-regular fa-square',
            ellipse: 'fa-regular fa-circle',
            line: isArrow ? 'fa-solid fa-arrow-right' : 'fa-solid fa-slash',
            polygon: 'fa-solid fa-draw-polygon',
            star: 'fa-regular fa-star'
        };

        const classes = iconClassByKind[kind] || 'fa-regular fa-square';
        iconEl.className = classes;
    }

    updateActiveState(activeTool) {
        this.buttons.forEach(btn => {
            const tool = btn.dataset.tool;
            if (tool === activeTool) {
                btn.classList.add('active');
            } else if (tool !== 'resources') { // Resources is a toggle, not a tool state
                btn.classList.remove('active');
            }
        });
    }

    updateCursor(activeTool) {
        // Use CursorManager for centralized cursor control
        cursorManager.setTool(activeTool);
    }

    togglePanel(panelName) {
        const panel = this.panels[panelName];
        if (panel) {
            const isHidden = panel.classList.contains('hidden');
            if (isHidden) {
                panel.classList.remove('hidden');
                // Activate button state if needed
                const btn = document.querySelector(`[data-tool="${panelName}"]`);
                if (btn) btn.classList.add('active');
            } else {
                panel.classList.add('hidden');
                const btn = document.querySelector(`[data-tool="${panelName}"]`);
                if (btn) btn.classList.remove('active');
            }
        }
    }
}
