import { store } from '../../Store.js';
import { getShapeKind } from '../../shapes/ShapeElementAdapter.js';
import { computeElementWorldRotation, computeElementWorldTopLeft } from '../../shapes/SceneGraphTransforms.js';
import { applyUnifiedMaskingToElementDom } from '../../shapes/masking/MaskEngine.js';

export class VisualElement {
    constructor(data) {
        this.data = data;
        this.domElement = null;
        this.container = null;
    }

    mount(container) {
        this.container = container;
        this.domElement = document.createElement('div');
        this.domElement.id = this.data.id;
        this.domElement.setAttribute('data-element-id', this.data.id);
        this.domElement.classList.add('slide-element');
        this.domElement.style.position = 'absolute';
        
        // Force initial update
        this.applyStyles(this.data);
        
        container.appendChild(this.domElement);
        return this.domElement;
    }

    update(newData, slideData) {
        // We can implement smart diffing here if needed
        // For now, we just re-apply styles which is fast enough for DOM properties
        this.data = newData;
        this.slideData = slideData; // Store for reference
        if (this.domElement) {
            this.applyStyles(this.data);
        }
    }

    applyStyles(el) {
        const div = this.domElement;

        // =====================================================
        // TEST/DEBUG METADATA (DOM-exposed)
        // =====================================================
        // Keep these lightweight and stable for Playwright.
        if (el?.type) {
            div.setAttribute('data-element-type', String(el.type));
        } else {
            div.removeAttribute('data-element-type');
        }

        if (el?.source) {
            div.setAttribute('data-source', String(el.source));
        } else {
            div.removeAttribute('data-source');
        }

        if (el?.isPlaceholder === true) {
            div.setAttribute('data-is-placeholder', 'true');
        } else {
            div.removeAttribute('data-is-placeholder');
        }

        if (el?.placeholderType) {
            div.setAttribute('data-placeholder-type', String(el.placeholderType));
        } else {
            div.removeAttribute('data-placeholder-type');
        }

        if (el?.textStyleId) {
            div.setAttribute('data-text-style-id', String(el.textStyleId));
        } else {
            div.removeAttribute('data-text-style-id');
        }

        // Presentation build metadata: entrance animations are treated as builds.
        // This enables spec-compliant build discovery via DOM attributes.
        const entrance = el?.animations?.entrance;
        if (entrance && entrance !== 'none') {
            div.setAttribute('data-build', 'true');
            const order = el?.animations?.buildOrder;
            if (Number.isFinite(order)) {
                div.setAttribute('data-build-order', String(order));
            } else {
                div.removeAttribute('data-build-order');
            }
        } else {
            div.removeAttribute('data-build');
            div.removeAttribute('data-build-order');
        }

        // Canonical shape metadata (use adapter so legacy `type:'rect'` etc are covered)
        const shapeKind = getShapeKind(el);
        if (shapeKind) {
            div.setAttribute('data-shape-kind', String(shapeKind));
        } else {
            div.removeAttribute('data-shape-kind');
        }
        
        // Calculate world position/rotation for nested elements.
        // We render everything as absolute-positioned siblings, so we must bake parent transforms into left/top.
        let x = el.x;
        let y = el.y;
        let rotation = el.rotation || 0;

        if (this.slideData && el.parentId) {
            const topLeft = computeElementWorldTopLeft(this.slideData, el);
            x = topLeft.x;
            y = topLeft.y;
            rotation = computeElementWorldRotation(this.slideData, el);
        }

        div.style.left = `${x}px`;
        div.style.top = `${y}px`;
        div.style.width = `${el.width}px`;
        div.style.height = `${el.height}px`;

        const sx = el.flipX ? -1 : 1;
        const sy = el.flipY ? -1 : 1;
        const hasFlip = sx !== 1 || sy !== 1;
        if (hasFlip) {
            div.style.transform = `rotate(${rotation}deg) scale(${sx}, ${sy})`;
        } else {
            div.style.transform = `rotate(${rotation}deg)`;
        }
        
        // Handle inherited/locked elements - they should appear dimmed
        // source: 'theme' or 'layout' means inherited, source: 'slide' means editable
        
        // Check editor mode to determine if 'layout' elements are editable
        // In Master Mode, if we are editing a layout, its elements (source='layout') are editable
        const state = store.getState(); // store is imported at top
        const isMasterMode = state.editor?.mode === 'master';
        
        let isInherited = el.isLocked || el.source === 'theme' || el.source === 'layout';
        
        if (isMasterMode && el.source === 'layout') {
            // If we are in master mode, check if we are editing the layout that owns this element
            const activeMasterId = state.editor.activeMasterId;
            const activeMaster = state.slideMasterPresets?.[activeMasterId];
            
                if (activeMaster && activeMaster.type === 'layoutMaster') {
                isInherited = false;
            }
        }
        
        const baseOpacity = (el.opacity !== undefined && el.opacity !== null) ? el.opacity : 1;
        
        // Apply 50% opacity to inherited elements for visual distinction
        if (isInherited) {
            div.style.opacity = baseOpacity * 0.5;
            div.style.pointerEvents = 'none'; // Can't interact with inherited elements
            div.classList.add('inherited-element');
        } else {
            div.style.opacity = baseOpacity;
            div.style.pointerEvents = 'auto';
            div.classList.remove('inherited-element');
        }
        
        div.style.zIndex = el.zIndex || 'auto';

        // Deep edit override (composition drill-in): reveal boolean operands while editing.
        const deepEdit = state?.editor?.deepEdit;
        let forceVisible = false;
        if (deepEdit?.kind === 'boolean' && deepEdit?.mode === 'operands' && deepEdit?.elementId && this.slideData) {
            const elements = this.slideData.effectiveElements || this.slideData.elements || {};
            const booleanEl = elements[deepEdit.elementId];
            const operands = Array.isArray(booleanEl?.operands) ? booleanEl.operands : [];
            forceVisible = operands.includes(el.id);
        }

        // Deep edit override (composition drill-in): reveal mask shape while editing.
        if (!forceVisible && deepEdit?.kind === 'mask' && deepEdit?.mode === 'shape' && deepEdit?.elementId && this.slideData) {
            const elements = this.slideData.effectiveElements || this.slideData.elements || {};
            const maskEl = elements[deepEdit.elementId];
            const maskShapeId = maskEl?.maskShapeId;
            forceVisible = typeof maskShapeId === 'string' && maskShapeId === el.id;
        }

        div.style.display = (el.hidden && !forceVisible) ? 'none' : 'block';
        div.style.mixBlendMode = el.blendMode || 'normal';
        
        // Border Radius is common enough to be here
        const radius = el.borderRadius || el.style?.radius || 0;
        div.style.borderRadius = `${radius}px`;

        // Unified masking (clip-path) applies to the entire rendered output of the element.
        // This must happen after sizing/position styles are applied.
        applyUnifiedMaskingToElementDom(div, el, this.slideData);
    }

    unmount() {
        if (this.domElement && this.domElement.parentNode) {
            this.domElement.parentNode.removeChild(this.domElement);
        }
        this.domElement = null;
        this.container = null;
    }
}
