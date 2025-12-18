import { store } from '../core/Store.js';
import { Knob } from './components/Knob.js';
import { Switch } from './components/Switch.js';
import { SegmentedControl } from './components/SegmentedControl.js';
import { ScrubbableControl } from './components/ScrubbableControl.js';
import { ColorInput } from './components/ColorInput.js';
import { aiService } from '../core/ai/AIService.js';
import { PositionSection } from './properties/PositionSection.js';
import { LayoutSection } from './properties/LayoutSection.js';
import { AppearanceSection } from './properties/AppearanceSection.js';
import { FillSection } from './properties/FillSection.js';
import { StrokeSection } from './properties/StrokeSection.js';
import { EffectsSection } from './properties/EffectsSection.js';
import { ExportSection } from './properties/ExportSection.js';
import { SlideSection } from './properties/SlideSection.js';
import { TextSection } from './properties/TextSection.js';
import { PlaceholderSection } from './properties/PlaceholderSection.js';
import { SvgSection } from './properties/SvgSection.js';
import { MaskSection } from './properties/MaskSection.js';
import { BooleanSection } from './properties/BooleanSection.js';
import { ShapeSection } from './properties/ShapeSection.js';
import { getShapeKind } from '../core/shapes/ShapeElementAdapter.js';
import { BooleanOpsHeaderControl } from './BooleanOpsHeaderControl.js';

export class PropertyInspector {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.sectionStates = {}; // Persist section collapse state
        
        // Get the sidebar header for title updates
        this.sidebar = this.container.closest('.sidebar');
        this.headerTitle = this.sidebar?.querySelector('.sidebar-header .header-title');
        this.sidebarHeader = this.sidebar?.querySelector('.sidebar-header');

        this.deepEditBar = null;
        this.deepEditCrumbs = null;
        this.deepEditDoneBtn = null;
        
        // Initialize Sections
        this.positionSection = new PositionSection();
        this.layoutSection = new LayoutSection();
        this.appearanceSection = new AppearanceSection();
        this.textSection = new TextSection();
        this.fillSection = new FillSection();
        this.strokeSection = new StrokeSection();
        this.effectsSection = new EffectsSection();
        this.exportSection = new ExportSection();
        this.svgSection = new SvgSection();
        this.maskSection = new MaskSection();
        this.booleanSection = new BooleanSection();
        this.shapeSection = new ShapeSection();
        this.slideSection = new SlideSection();
        this.placeholderSection = new PlaceholderSection();

        // Sidebar header controls (selection-level actions)
        this.booleanOpsHeaderControl = this.sidebarHeader
            ? new BooleanOpsHeaderControl(this.sidebarHeader)
            : null;
        
        this.init();
    }

    init() {
        this.render();
        store.on('state-changed', (state) => {
            // Don't re-render if we are in the middle of an interaction (like scrubbing)
            // This prevents the input from being destroyed while dragging
            if (state.ui && state.ui.isInteracting) return;
            this.render();
        });
        store.on('selection-changed', () => this.render());
    }

    render() {
        this.container.classList.add('property-inspector');
        this.container.setAttribute('data-testid', 'property-inspector');
        
        const state = store.getState();
        const selection = state.editor.selectedElementIds;

        this.updateDeepEditHeader(state);
        
        // Update header title
        this.updateHeaderTitle(state, selection);
        
        // Clear container
        this.container.innerHTML = '';
        
        if (selection && selection.length > 0) {
            // 1. Position Section
            this.positionSection.update(selection);
            this.container.appendChild(this.positionSection.section.element);
            
            // 2. Layout Section
            this.layoutSection.update(selection);
            this.container.appendChild(this.layoutSection.section.element);

            // 3. Appearance Section
            this.appearanceSection.update(selection);
            this.container.appendChild(this.appearanceSection.section.element);

            // 4. Typography Section (Text Only)
            this.textSection.update(selection);
            this.container.appendChild(this.textSection.section.element);

            // 4.5 SVG Section (SVG only)
            this.svgSection.update(selection);
            this.container.appendChild(this.svgSection.section.element);

            // 4.6 Mask Section (mask nodes only)
            this.maskSection.update(selection);
            this.container.appendChild(this.maskSection.section.element);

            // 4.7 Boolean Section (boolean nodes only)
            this.booleanSection.update(selection);
            this.container.appendChild(this.booleanSection.section.element);

            // 4.8 Shape params (polygon/star only)
            this.shapeSection.update(selection);
            this.container.appendChild(this.shapeSection.section.element);

            // 5. Fill Section (Hide for Text as it has its own control)
            const isText = selection.length === 1 && this.getElement(state, selection[0])?.type === 'text';
            if (!isText) {
                this.fillSection.update(selection);
                this.container.appendChild(this.fillSection.section.element);
            }

            // 5. Stroke Section
            this.strokeSection.update(selection);
            this.container.appendChild(this.strokeSection.section.element);

            // 6. Effects Section
            this.effectsSection.update(selection);
            this.container.appendChild(this.effectsSection.section.element);

            // 7. Export Section
            this.exportSection.update(selection);
            this.container.appendChild(this.exportSection.section.element);
            
            // TODO: Add other sections here as they are built
        } else {
            // No selection: Show Slide Properties
            this.slideSection.update(selection);
            this.container.appendChild(this.slideSection.element);
            this.container.appendChild(this.slideSection.fillSection.section.element);
            
            // Show Placeholder Section when in master mode with a layout selected
            this.placeholderSection.update(selection);
            this.container.appendChild(this.placeholderSection.section.element);
        }
    }

    updateDeepEditHeader(state) {
        if (!this.sidebarHeader) return;

        const stack = Array.isArray(state?.editor?.deepEditStack) ? state.editor.deepEditStack : [];

        if (!this.deepEditBar) {
            const bar = document.createElement('div');
            bar.className = 'deep-edit-bar hidden';
            bar.setAttribute('data-testid', 'deep-edit-bar');

            const crumbs = document.createElement('div');
            crumbs.className = 'deep-edit-breadcrumb';
            crumbs.setAttribute('data-testid', 'deep-edit-breadcrumb');

            const done = document.createElement('button');
            done.className = 'btn btn--text btn--xs';
            done.type = 'button';
            done.textContent = 'Done';
            done.setAttribute('data-testid', 'deep-edit-done');
            done.addEventListener('click', () => store.dispatch('POP_DEEP_EDIT'));

            bar.appendChild(crumbs);
            bar.appendChild(done);

            this.sidebarHeader.appendChild(bar);
            this.deepEditBar = bar;
            this.deepEditCrumbs = crumbs;
            this.deepEditDoneBtn = done;
        }

        if (!this.deepEditBar || !this.deepEditCrumbs) return;

        const visible = stack.length > 0;
        this.deepEditBar.classList.toggle('hidden', !visible);
        if (!visible) return;

        // Rebuild crumbs (small, low-frequency DOM).
        this.deepEditCrumbs.innerHTML = '';
        stack.forEach((ctx, idx) => {
            const isLast = idx === stack.length - 1;

            const label = (() => {
                if (!ctx) return 'Edit';
                if (ctx.kind === 'boolean') return 'Boolean';
                if (ctx.kind === 'mask') return 'Mask';
                if (ctx.kind === 'vector') return 'Vector';
                return 'Edit';
            })();

            const btn = document.createElement('button');
            btn.className = `btn btn--text btn--xs deep-edit-crumb${isLast ? ' deep-edit-crumb--current' : ''}`;
            btn.type = 'button';
            btn.textContent = label;
            btn.setAttribute('data-testid', `deep-edit-crumb-${idx}`);
            btn.disabled = isLast;
            btn.addEventListener('click', () => {
                if (isLast) return;
                const next = stack.slice(0, idx + 1);
                store.dispatch('SET_DEEP_EDIT_STACK', next);
            });

            this.deepEditCrumbs.appendChild(btn);

            if (!isLast) {
                const sep = document.createElement('span');
                sep.className = 'deep-edit-sep';
                sep.textContent = '›';
                this.deepEditCrumbs.appendChild(sep);
            }
        });
    }

    getElement(state, id) {
        const mode = state.editor.mode;
        if (mode === 'master') {
            const master = state.slideMasterPresets[state.editor.activeMasterId];
            return master?.elements[id];
        } else {
            const slide = state.slides[state.editor.activeSlideId];
            return slide?.elements[id];
        }
    }
    
    updateHeaderTitle(state, selection) {
        if (!this.headerTitle) return;
        
        if (selection && selection.length > 0) {
            if (selection.length === 1) {
                // Single selection: show element name or type
                const element = this.getElement(state, selection[0]);
                if (element) {
                    // Use element name if available, otherwise use type
                    const name = element.name || this.getElementDisplayName(element);
                    this.headerTitle.textContent = name;
                } else {
                    this.headerTitle.textContent = 'Properties';
                }
            } else {
                // Multiple selection
                this.headerTitle.textContent = `${selection.length} Objects`;
            }
        } else {
            // No selection: show Slide or Master/Layout
            const mode = state.editor.mode;
            if (mode === 'master') {
                const master = state.slideMasterPresets[state.editor.activeMasterId];
                this.headerTitle.textContent = master?.name || 'Master';
            } else {
                this.headerTitle.textContent = 'Slide';
            }
        }
    }
    
    getElementDisplayName(element) {
        if (!element) return 'Object';

        // For shapes, prefer the normalized kind so we show Polygon/Star/etc.
        const kind = getShapeKind(element);
        if (kind && kind !== element.type) {
            return this.getTypeName(kind);
        }
        return this.getTypeName(element.type);
    }

    getTypeName(type) {
        const typeNames = {
            'rect': 'Rectangle',
            'circle': 'Ellipse',
            'rectangle': 'Rectangle',
            'ellipse': 'Ellipse',
            'polygon': 'Polygon',
            'star': 'Star',
            'text': 'Text',
            'image': 'Image',
            'svg': 'SVG',
            'line': 'Line',
            'group': 'Group',
            'frame': 'Frame'
        };
        return typeNames[type] || 'Object';
    }
}