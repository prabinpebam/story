import { Section } from '../components/Section.js';
import { store } from '../../core/Store.js';
import { Icons } from '../Icons.js';

/**
 * PlaceholderSection - Placeholder Toolbar/Palette for Layout Masters
 * 
 * This section appears in the Property Inspector when:
 * - Mode is 'master'
 * - The active master is a 'layout' type
 * 
 * UX Model:
 * - Displays a grid of all available placeholder types
 * - Users can DRAG a placeholder type onto the canvas to place it
 * - Users can CLICK a placeholder type to enter "draw mode" and draw a rectangle
 * - Placeholder types that are already placed (and limited to 1) are disabled
 * - Some types allow multiple instances (e.g., Text, Picture, Media)
 * - Some types are limited to one per layout (e.g., Title, Subtitle)
 */
export class PlaceholderSection {
    constructor() {
        this.section = new Section({ 
            title: 'Placeholders',
            collapsed: false
        });
        
        // Define placeholder types with their constraints
        this.placeholderTypes = [
            { id: 'title', label: 'Title', icon: 'H1', maxCount: 1, description: 'Main slide title' },
            { id: 'subtitle', label: 'Subtitle', icon: 'H2', maxCount: 1, description: 'Slide subtitle' },
            { id: 'body', label: 'Content', icon: '¶', maxCount: 1, description: 'Main content area' },
            { id: 'text', label: 'Text', icon: 'T', maxCount: Infinity, description: 'Generic text box' },
            { id: 'picture', label: 'Picture', icon: '🖼', maxCount: Infinity, description: 'Image placeholder' },
            { id: 'media', label: 'Media', icon: '▶', maxCount: Infinity, description: 'Video/audio placeholder' }
        ];
        
        this.placedCounts = {}; // Track how many of each type are placed
        this.activeDrawType = null; // Currently selected type for drawing
        
        this.createContent();
    }

    createContent() {
        // Instructions
        this.instructions = document.createElement('div');
        this.instructions.className = 'placeholder-instructions';
        this.instructions.style.cssText = `
            font-size: var(--font-size-xs);
            color: var(--color-text-tertiary);
            margin-bottom: var(--spacing-2);
            line-height: 1.4;
        `;
        this.instructions.textContent = 'Drag onto canvas or click to draw';
        this.section.appendChild(this.instructions);

        // Grid container for placeholder types
        this.gridContainer = document.createElement('div');
        this.gridContainer.className = 'placeholder-palette';
        this.gridContainer.style.cssText = `
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 6px;
        `;
        this.section.appendChild(this.gridContainer);

        // Create palette items
        this.paletteItems = {};
        this.placeholderTypes.forEach(type => {
            const item = this.createPaletteItem(type);
            this.paletteItems[type.id] = item;
            this.gridContainer.appendChild(item.element);
        });

        // Active draw mode indicator
        this.drawModeIndicator = document.createElement('div');
        this.drawModeIndicator.className = 'draw-mode-indicator';
        this.drawModeIndicator.style.cssText = `
            display: none;
            margin-top: var(--spacing-2);
            padding: 8px;
            background: var(--color-accent-bg);
            border: 1px solid var(--color-accent);
            border-radius: var(--radius-sm);
            font-size: var(--font-size-sm);
            color: var(--color-accent);
            text-align: center;
        `;
        this.section.appendChild(this.drawModeIndicator);

        // Cancel button for draw mode
        this.cancelBtn = document.createElement('button');
        this.cancelBtn.textContent = 'Cancel (Esc)';
        this.cancelBtn.style.cssText = `
            display: none;
            margin-top: var(--spacing-1);
            padding: 4px 8px;
            width: 100%;
            border: 1px solid var(--color-border);
            border-radius: var(--radius-sm);
            background: var(--color-bg-well);
            color: var(--color-text-secondary);
            font-size: var(--font-size-xs);
            cursor: pointer;
        `;
        this.cancelBtn.addEventListener('click', () => this.cancelDrawMode());
        this.section.appendChild(this.cancelBtn);

        // Listen for escape key to cancel draw mode
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.activeDrawType) {
                this.cancelDrawMode();
            }
        });
    }

    createPaletteItem(type) {
        const element = document.createElement('div');
        element.className = 'placeholder-palette-item';
        element.dataset.type = type.id;
        element.draggable = true;
        element.title = type.description;
        element.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 8px 4px;
            background: var(--color-bg-well);
            border: 1px solid var(--color-border);
            border-radius: var(--radius-sm);
            cursor: grab;
            transition: all 0.15s;
            min-height: 52px;
            position: relative;
        `;

        // Icon
        const icon = document.createElement('div');
        icon.className = 'placeholder-icon';
        icon.textContent = type.icon;
        icon.style.cssText = `
            font-size: 16px;
            margin-bottom: 2px;
            line-height: 1;
        `;

        // Label
        const label = document.createElement('div');
        label.className = 'placeholder-label';
        label.textContent = type.label;
        label.style.cssText = `
            font-size: 9px;
            color: var(--color-text-secondary);
            text-align: center;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 100%;
        `;

        // Count badge (for types that allow multiple)
        const badge = document.createElement('div');
        badge.className = 'placeholder-badge';
        badge.style.cssText = `
            display: none;
            position: absolute;
            top: -4px;
            right: -4px;
            width: 16px;
            height: 16px;
            background: var(--color-accent);
            color: white;
            border-radius: 50%;
            font-size: 9px;
            line-height: 16px;
            text-align: center;
        `;

        // Checkmark overlay for placed items (limited types)
        const checkmark = document.createElement('div');
        checkmark.className = 'placeholder-checkmark';
        checkmark.innerHTML = '✓';
        checkmark.style.cssText = `
            display: none;
            position: absolute;
            top: 2px;
            right: 2px;
            width: 14px;
            height: 14px;
            background: var(--color-success, #1BC47D);
            color: white;
            border-radius: 50%;
            font-size: 10px;
            line-height: 14px;
            text-align: center;
        `;

        element.appendChild(icon);
        element.appendChild(label);
        element.appendChild(badge);
        element.appendChild(checkmark);

        // Event handlers
        element.addEventListener('mouseenter', () => {
            if (!element.classList.contains('disabled')) {
                element.style.background = 'var(--color-bg-hover)';
                element.style.borderColor = 'var(--color-accent)';
            }
        });

        element.addEventListener('mouseleave', () => {
            if (!element.classList.contains('disabled') && !element.classList.contains('active')) {
                element.style.background = 'var(--color-bg-well)';
                element.style.borderColor = 'var(--color-border)';
            }
        });

        // Click to enter draw mode
        element.addEventListener('click', () => {
            if (!element.classList.contains('disabled')) {
                this.enterDrawMode(type);
            }
        });

        // Drag start
        element.addEventListener('dragstart', (e) => {
            if (element.classList.contains('disabled')) {
                e.preventDefault();
                return;
            }
            e.dataTransfer.setData('application/x-placeholder-type', type.id);
            e.dataTransfer.effectAllowed = 'copy';
            element.style.opacity = '0.5';
            
            // Notify the canvas that we're dragging a placeholder
            store.dispatch('SET_DRAG_PLACEHOLDER', { type: type.id });
        });

        element.addEventListener('dragend', () => {
            element.style.opacity = '1';
            store.dispatch('SET_DRAG_PLACEHOLDER', { type: null });
        });

        return {
            element,
            type,
            icon,
            label,
            badge,
            checkmark,
            setDisabled: (disabled) => {
                if (disabled) {
                    element.classList.add('disabled');
                    element.draggable = false;
                    element.style.opacity = '0.5';
                    element.style.cursor = 'not-allowed';
                } else {
                    element.classList.remove('disabled');
                    element.draggable = true;
                    element.style.opacity = '1';
                    element.style.cursor = 'grab';
                }
            },
            setActive: (active) => {
                if (active) {
                    element.classList.add('active');
                    element.style.background = 'var(--color-accent-bg)';
                    element.style.borderColor = 'var(--color-accent)';
                } else {
                    element.classList.remove('active');
                    if (!element.classList.contains('disabled')) {
                        element.style.background = 'var(--color-bg-well)';
                        element.style.borderColor = 'var(--color-border)';
                    }
                }
            },
            updateBadge: (count) => {
                if (count > 0 && type.maxCount === Infinity) {
                    badge.style.display = 'block';
                    badge.textContent = count;
                } else {
                    badge.style.display = 'none';
                }
            },
            showCheckmark: (show) => {
                checkmark.style.display = show ? 'block' : 'none';
            }
        };
    }

    enterDrawMode(type) {
        // Clear any previous active state
        Object.values(this.paletteItems).forEach(item => item.setActive(false));
        
        this.activeDrawType = type;
        this.paletteItems[type.id].setActive(true);
        
        // Show indicator
        this.drawModeIndicator.innerHTML = `Drawing: <strong>${type.label}</strong> — Click and drag on canvas`;
        this.drawModeIndicator.style.display = 'block';
        this.cancelBtn.style.display = 'block';
        
        // Set the tool to placeholder draw mode
        store.dispatch('SET_ACTIVE_TOOL', { tool: 'placeholder', placeholderType: type.id });
    }

    cancelDrawMode() {
        if (this.activeDrawType) {
            this.paletteItems[this.activeDrawType.id].setActive(false);
        }
        this.activeDrawType = null;
        this.drawModeIndicator.style.display = 'none';
        this.cancelBtn.style.display = 'none';
        
        // Return to select tool
        store.dispatch('SET_ACTIVE_TOOL', { tool: 'select' });
    }

    update(selection) {
        const state = store.getState();
        const mode = state.editor.mode;
        const activeMaster = state.masters[state.editor.activeMasterId];

        // Only show for layout masters in master mode
        if (mode !== 'master' || !activeMaster || activeMaster.type !== 'layout') {
            this.section.element.style.display = 'none';
            return;
        }

        this.section.element.style.display = 'block';
        
        // Count placed placeholders
        this.updatePlacedCounts(activeMaster);
        
        // Update palette item states
        this.updatePaletteStates();
        
        // Check if current tool is still placeholder mode
        const activeTool = state.editor.activeTool;
        if (activeTool !== 'placeholder' && this.activeDrawType) {
            // Tool changed externally, clear our draw mode state
            this.paletteItems[this.activeDrawType.id].setActive(false);
            this.activeDrawType = null;
            this.drawModeIndicator.style.display = 'none';
            this.cancelBtn.style.display = 'none';
        }
    }

    updatePlacedCounts(layout) {
        // Reset counts
        this.placedCounts = {};
        this.placeholderTypes.forEach(type => {
            this.placedCounts[type.id] = 0;
        });

        // Count placeholders in the layout
        Object.values(layout.elements || {}).forEach(el => {
            if (el.isPlaceholder && el.placeholderType) {
                if (this.placedCounts[el.placeholderType] !== undefined) {
                    this.placedCounts[el.placeholderType]++;
                }
            }
        });
    }

    updatePaletteStates() {
        this.placeholderTypes.forEach(type => {
            const item = this.paletteItems[type.id];
            const count = this.placedCounts[type.id] || 0;
            
            // For limited types, disable if max count reached
            const isDisabled = count >= type.maxCount;
            item.setDisabled(isDisabled);
            
            // Show checkmark for limited types that are placed
            if (type.maxCount !== Infinity && count > 0) {
                item.showCheckmark(true);
            } else {
                item.showCheckmark(false);
            }
            
            // Update badge for unlimited types
            item.updateBadge(count);
        });
    }

    /**
     * Called when a placeholder is successfully drawn/dropped
     * Can be called by CanvasManager after placement
     */
    onPlaceholderPlaced(placeholderType) {
        // For limited types, auto-cancel draw mode after placement
        const typeConfig = this.placeholderTypes.find(t => t.id === placeholderType);
        if (typeConfig && typeConfig.maxCount !== Infinity) {
            this.cancelDrawMode();
        }
        
        // Force update to refresh states
        const state = store.getState();
        const activeMaster = state.masters[state.editor.activeMasterId];
        if (activeMaster) {
            this.updatePlacedCounts(activeMaster);
            this.updatePaletteStates();
        }
    }
}
