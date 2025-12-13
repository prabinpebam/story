import { BaseRenderer } from './BaseRenderer.js';
import { store } from '../Store.js';
import { SlideView } from './SlideView.js';
import { getEffectiveLayoutGuideForState, getContentBounds, getColumnRects } from '../utils/LayoutGuideUtils.js';

export class EditorRenderer extends BaseRenderer {
    constructor(containerId) {
        super(containerId);
        this.currentSlideId = null;
        this.render(); // Initial render
    }

    render() {
        const state = store.getState();
        const mode = state.editor.mode;
        const activeId = mode === 'master' ? state.editor.activeMasterId : state.editor.activeSlideId;

        if (!activeId) return;

        // Check if slide changed
        if (this.currentSlideId !== activeId) {
            // Unmount old
            if (this.currentSlideId && this.activeSlideViews.has(this.currentSlideId)) {
                this.activeSlideViews.get(this.currentSlideId).unmount();
                this.activeSlideViews.delete(this.currentSlideId);
            }
            this.currentSlideId = activeId;
        }

        // Get Data
        const slideData = this.getEffectiveSlideData(activeId, mode);
        if (!slideData) return;

        // Get or Create View
        let view = this.activeSlideViews.get(activeId);
        if (!view) {
            view = new SlideView(activeId);
            view.mount(this.layers.content);
            this.activeSlideViews.set(activeId, view);
        }

        // Update View
        view.update(slideData);

        // Layout Guide Overlay (DOM)
        this.renderLayoutGuideOverlay(state, slideData);

        // Render Overlay (Handles, Selection)
        this.renderOverlay(state, slideData);
    }

    getEffectiveLayoutGuide(state, activeMaster) {
        const fallback = {
            enabled: true,
            margins: { top: 40, right: 40, bottom: 40, left: 40 },
            marginsLinked: true,
            columns: { count: 3, gutter: 20 },
            appearance: { color: '#FF0000', opacity: 10 }
        };

        const direct = activeMaster?.layoutGuide || null;
        if (direct) {
            return {
                ...fallback,
                ...direct,
                margins: { ...fallback.margins, ...(direct.margins || {}) },
                columns: { ...fallback.columns, ...(direct.columns || {}) },
                appearance: { ...fallback.appearance, ...(direct.appearance || {}) }
            };
        }

        if (activeMaster?.type === 'layoutMaster' && activeMaster?.parentMasterId) {
            const parent = state.slideMasterPresets?.[activeMaster.parentMasterId] || null;
            const parentGuide = parent?.layoutGuide || null;
            if (parentGuide) {
                return {
                    ...fallback,
                    ...parentGuide,
                    margins: { ...fallback.margins, ...(parentGuide.margins || {}) },
                    columns: { ...fallback.columns, ...(parentGuide.columns || {}) },
                    appearance: { ...fallback.appearance, ...(parentGuide.appearance || {}) }
                };
            }
        }

        return fallback;
    }

    renderLayoutGuideOverlay(state, slideData) {
        if (!this.layoutGuideOverlayEl) {
            this.layoutGuideOverlayEl = document.createElement('div');
            this.layoutGuideOverlayEl.className = 'layout-guide-overlay';
            this.layoutGuideOverlayEl.setAttribute('data-testid', 'layout-guide-overlay');
            this.layoutGuideOverlayEl.style.position = 'absolute';
            this.layoutGuideOverlayEl.style.top = '0';
            this.layoutGuideOverlayEl.style.left = '0';
            this.layoutGuideOverlayEl.style.pointerEvents = 'none';
            this.layers.top.appendChild(this.layoutGuideOverlayEl);
        }

        const isVisible = state.editor.showLayoutGuides !== false;

        if (!isVisible) {
            this.layoutGuideOverlayEl.classList.add('hidden');
            this.layoutGuideOverlayEl.innerHTML = '';
            return;
        }

        this.layoutGuideOverlayEl.classList.remove('hidden');
        this.layoutGuideOverlayEl.style.width = `${slideData.width}px`;
        this.layoutGuideOverlayEl.style.height = `${slideData.height}px`;

        const activeMaster = state.slideMasterPresets?.[state.editor.activeMasterId] || null;
        const guide = getEffectiveLayoutGuideForState(state);

        if (guide.enabled === false) {
            this.layoutGuideOverlayEl.classList.add('hidden');
            this.layoutGuideOverlayEl.innerHTML = '';
            return;
        }

        const width = slideData.width;
        const height = slideData.height;
        const margins = guide.margins;
        const columns = guide.columns;

        const appearance = guide.appearance || { color: '#FF0000', opacity: 10 };
        const strokeAlpha = 0.6;
        const fillAlpha = Math.max(0, Math.min(1, (Number(appearance.opacity) || 0) / 100));
        const colorHex = String(appearance.color || '#FF0000');

        const hexToRgb = (hex) => {
            const cleaned = hex.replace('#', '').trim();
            if (cleaned.length === 3) {
                const r = parseInt(cleaned[0] + cleaned[0], 16);
                const g = parseInt(cleaned[1] + cleaned[1], 16);
                const b = parseInt(cleaned[2] + cleaned[2], 16);
                return { r, g, b };
            }
            if (cleaned.length === 6) {
                const r = parseInt(cleaned.slice(0, 2), 16);
                const g = parseInt(cleaned.slice(2, 4), 16);
                const b = parseInt(cleaned.slice(4, 6), 16);
                return { r, g, b };
            }
            return { r: 255, g: 0, b: 0 };
        };

        const rgb = hexToRgb(colorHex);
        const strokeColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${strokeAlpha})`;
        const fillColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${fillAlpha})`;

        const count = Math.max(1, Math.min(24, Number(columns.count) || 1));
        const gutter = Math.max(0, Number(columns.gutter) || 0);

        const innerWidth = Math.max(0, width - margins.left - margins.right);
        const totalGutters = gutter * (count - 1);
        const colWidth = count > 0 ? Math.max(0, (innerWidth - totalGutters) / count) : 0;

        // Rebuild overlay using SVG so we can use exact dash pattern 5/5
        this.layoutGuideOverlayEl.innerHTML = '';

        const svgNS = 'http://www.w3.org/2000/svg';
        const svg = document.createElementNS(svgNS, 'svg');
        svg.setAttribute('width', String(width));
        svg.setAttribute('height', String(height));
        svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
        svg.style.position = 'absolute';
        svg.style.top = '0';
        svg.style.left = '0';
        svg.style.pointerEvents = 'none';

        const contentX = margins.left;
        const contentY = margins.top;
        const contentW = Math.max(0, width - margins.left - margins.right);
        const contentH = Math.max(0, height - margins.top - margins.bottom);

        const marginRect = document.createElementNS(svgNS, 'rect');
        marginRect.setAttribute('data-testid', 'layout-guide-margin-rect');
        marginRect.setAttribute('x', String(contentX));
        marginRect.setAttribute('y', String(contentY));
        marginRect.setAttribute('width', String(contentW));
        marginRect.setAttribute('height', String(contentH));
        marginRect.setAttribute('fill', 'none');
        marginRect.setAttribute('stroke', strokeColor);
        marginRect.setAttribute('stroke-width', '1');
        marginRect.setAttribute('stroke-dasharray', '5 5');
        svg.appendChild(marginRect);

        const bounds = getContentBounds(slideData.width, slideData.height, guide.margins);
        const rects = getColumnRects(bounds, guide.columns.count, guide.columns.gutter);
        for (const r of rects) {
            const colRect = document.createElementNS(svgNS, 'rect');
            colRect.setAttribute('data-testid', 'layout-guide-column');
            colRect.setAttribute('x', String(r.x));
            colRect.setAttribute('y', String(r.y));
            colRect.setAttribute('width', String(r.width));
            colRect.setAttribute('height', String(r.height));
            colRect.setAttribute('fill', guide.appearance.color || '#FF0000');
            colRect.setAttribute('fill-opacity', String((Number(guide.appearance.opacity || 10) / 100)));
            svg.appendChild(colRect);
        }

        this.layoutGuideOverlayEl.appendChild(svg);
    }

    renderOverlay(state, slideData) {
        const editingId = state.editor.editingElementId;
        const selectionType = state.editor.editModeSelectionType;
        const clickPosition = state.editor.textEditClickPosition;
        const isNewlyCreated = state.editor.editModeIsNewlyCreated || false;
        const initialChar = state.editor.editModeInitialChar || null;
        const view = this.activeSlideViews.get(this.currentSlideId);
        
        if (view) {
            view.elements.forEach(el => {
                if (el.setEditing) {
                    if (el.data.id === editingId) {
                        el.setEditing(true, selectionType, clickPosition, isNewlyCreated, initialChar);
                        
                        if (!el.domElement._hasBlurListener) {
                            el.domElement.addEventListener('blur', (event) => {
                                // Check if focus is moving to something within the same element
                                // (e.g., to a child element) - if so, don't exit edit mode
                                const relatedTarget = event.relatedTarget;
                                if (relatedTarget && el.domElement.contains(relatedTarget)) {
                                    return;
                                }
                                
                                // Add a delay to allow for focus to settle
                                // This handles cases where focus briefly leaves during typing
                                setTimeout(() => {
                                    // Double-check we're still not focused AND still in edit mode
                                    const currentState = store.getState();
                                    if (currentState.editor.editingElementId !== el.data.id) {
                                        // Already exited edit mode through another path
                                        return;
                                    }
                                    
                                    if (document.activeElement !== el.domElement && 
                                        !el.domElement.contains(document.activeElement)) {
                                        this.handleTextBlur(el);
                                    }
                                }, 50);
                            });
                            el.domElement._hasBlurListener = true;
                        }
                    } else {
                        el.setEditing(false);
                    }
                }
            });
        }
    }

    handleTextBlur(el) {
        const state = store.getState();
        
        // Only handle blur if this element is actually the one being edited
        // This prevents handling blur events that fire during focus transitions
        if (state.editor.editingElementId !== el.data.id) {
            return;
        }
        
        const div = el.domElement;
        const content = div.innerHTML;
        
        // Check if text content is effectively empty (whitespace only, or just <br> tags)
        const textContent = div.textContent?.trim() || '';
        const isEmptyContent = textContent === '' || content === '<br>' || content === '<br/>';
        
        if (isEmptyContent) {
            // Don't delete placeholder elements - they should persist even when empty
            if (!el.data.isPlaceholder) {
                // Delete the element if it's empty
                store.dispatch('REMOVE_ELEMENT', el.data.id);
                store.dispatch('SET_EDITING_ELEMENT', null);
                return;
            }
            // For placeholders, just exit edit mode without deleting
            store.dispatch('SET_EDITING_ELEMENT', null);
            return;
        }
        
        const updates = {
            id: el.data.id,
            content: content
        };

        // Handle Auto Resize - save final dimensions and position for auto-sizing modes
        // Check root level first, then style level for resizing mode
        const resizing = el.data.resizing || el.data.style?.resizing || 'fixedWidth';
        if (resizing === 'autoSize' || resizing === 'fixedWidth') {
            updates.width = div.offsetWidth;
            updates.height = div.offsetHeight;
            
            // Also save the live position if it was updated during editing
            // (for alignment-based anchor point adjustments)
            if (el._liveX !== undefined) {
                updates.x = el._liveX;
            }
            if (el._liveY !== undefined) {
                updates.y = el._liveY;
            }
            
            // Clear all live values
            el._liveX = undefined;
            el._liveY = undefined;
            el._liveWidth = undefined;
            el._liveHeight = undefined;
            el._livePosition = null;
            el._liveDimensions = null;
        }

        store.dispatch('UPDATE_ELEMENT', updates);
        store.dispatch('SET_EDITING_ELEMENT', null);
    }
}
