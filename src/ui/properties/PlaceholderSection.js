import { Section } from '../components/Section.js';
import { store } from '../../core/Store.js';
import { Icons } from '../Icons.js';

/**
 * PlaceholderSection - Placeholder Palette for Layout Masters
 * 
 * This section appears in the Property Inspector when:
 * - Mode is 'master'
 * - The active master is a 'layout' type
 * 
 * UX Model:
 * - Displays a grid of all available placeholder types
 * - CLICK adds placeholder at default location immediately
 * - DRAG onto canvas places at drop location
 * - Limited types (Title, Subtitle, Content) disabled after placed
 * - Unlimited types (Text, Picture, Media) show count badge
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
        
        this.createContent();
    }

    createContent() {
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
            cursor: pointer;
            transition: all 0.15s;
            min-height: 52px;
            position: relative;
            user-select: none;
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
            if (!element.classList.contains('disabled')) {
                element.style.background = 'var(--color-bg-well)';
                element.style.borderColor = 'var(--color-border)';
            }
        });

        // Click to add placeholder at default location
        element.addEventListener('click', () => {
            if (!element.classList.contains('disabled')) {
                this.addPlaceholder(type);
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
                    element.style.cursor = 'pointer';
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

    /**
     * Add a placeholder at the default location for its type
     */
    addPlaceholder(type) {
        const state = store.getState();
        const layoutId = state.editor.activeMasterId;
        const layout = state.masters[layoutId];

        if (!layout || layout.type !== 'layout') return;

        // Generate unique ID
        const existingCount = Object.values(layout.elements || {})
            .filter(el => el.placeholderType === type.id).length;
        const newId = `placeholder-${type.id}-${Date.now()}`;

        // Get default position and size for this type
        const defaults = this.getPlaceholderDefaults(type.id, layout);

        const newPlaceholder = {
            id: newId,
            type: 'text',
            isPlaceholder: true,
            placeholderType: type.id,
            content: this.getPlaceholderContent(type.id),
            x: defaults.x,
            y: defaults.y,
            width: defaults.width,
            height: defaults.height,
            rotation: 0,
            opacity: 1,
            style: defaults.style
        };

        // Dispatch action to add element to master
        store.dispatch('ADD_ELEMENT_TO_MASTER', { 
            masterId: layoutId, 
            element: newPlaceholder 
        });

        // Select the new placeholder
        setTimeout(() => {
            store.dispatch('SET_SELECTION', { elementIds: [newId] });
        }, 50);
    }

    /**
     * Get default position, size, and style for a placeholder type
     */
    getPlaceholderDefaults(typeId, layout) {
        const slideWidth = layout.width || 1920;
        const slideHeight = layout.height || 1080;
        const margin = 100;

        const defaults = {
            title: {
                x: margin,
                y: 80,
                width: slideWidth - margin * 2,
                height: 120,
                style: {
                    fontSize: 72,
                    textAlign: 'center',
                    verticalAlign: 'middle',
                    color: 'var(--theme-text-primary, #333333)',
                    fontFamily: 'var(--theme-font-heading, Inter)',
                    fontWeight: '700'
                }
            },
            subtitle: {
                x: margin,
                y: 220,
                width: slideWidth - margin * 2,
                height: 80,
                style: {
                    fontSize: 32,
                    textAlign: 'center',
                    verticalAlign: 'middle',
                    color: 'var(--theme-text-secondary, #666666)',
                    fontFamily: 'var(--theme-font-body, Inter)',
                    fontWeight: '400'
                }
            },
            body: {
                x: margin,
                y: 320,
                width: slideWidth - margin * 2,
                height: slideHeight - 420,
                style: {
                    fontSize: 24,
                    textAlign: 'left',
                    verticalAlign: 'top',
                    color: 'var(--theme-text-primary, #333333)',
                    fontFamily: 'var(--theme-font-body, Inter)',
                    fontWeight: '400'
                }
            },
            text: {
                x: margin + Math.random() * 200,
                y: 350 + Math.random() * 100,
                width: 400,
                height: 150,
                style: {
                    fontSize: 18,
                    textAlign: 'left',
                    verticalAlign: 'top',
                    color: 'var(--theme-text-primary, #333333)',
                    fontFamily: 'var(--theme-font-body, Inter)',
                    fontWeight: '400'
                }
            },
            picture: {
                x: slideWidth / 2 - 200 + Math.random() * 50,
                y: slideHeight / 2 - 150 + Math.random() * 50,
                width: 400,
                height: 300,
                style: {
                    fontSize: 16,
                    textAlign: 'center',
                    verticalAlign: 'middle',
                    color: 'var(--theme-text-secondary, #666666)'
                }
            },
            media: {
                x: slideWidth / 2 - 240 + Math.random() * 50,
                y: slideHeight / 2 - 135 + Math.random() * 50,
                width: 480,
                height: 270,
                style: {
                    fontSize: 16,
                    textAlign: 'center',
                    verticalAlign: 'middle',
                    color: 'var(--theme-text-secondary, #666666)'
                }
            }
        };

        return defaults[typeId] || defaults.text;
    }

    /**
     * Get the default placeholder content/prompt text
     */
    getPlaceholderContent(typeId) {
        const contents = {
            title: '<h1 style="margin:0;font-size:inherit;font-weight:inherit;">Click to add title</h1>',
            subtitle: '<p style="margin:0;">Click to add subtitle</p>',
            body: '<p style="margin:0;">Click to add text</p>',
            text: '<p style="margin:0;">Click to add text</p>',
            picture: '<p style="margin:0;opacity:0.5;">🖼️ Click to add picture</p>',
            media: '<p style="margin:0;opacity:0.5;">▶️ Click to add media</p>'
        };
        return contents[typeId] || '<p style="margin:0;">Click to add content</p>';
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
}
