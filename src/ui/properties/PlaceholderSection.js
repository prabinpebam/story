import { Section } from '../components/Section.js';
import { Dropdown } from '../components/Dropdown.js';
import { store } from '../../core/Store.js';
import { Icons } from '../Icons.js';

/**
 * PlaceholderSection - Manages placeholders for Layout Masters
 * 
 * This section appears in the Property Inspector when:
 * - Mode is 'master'
 * - The active master is a 'layout' type
 * - No element is selected
 * 
 * It allows users to:
 * - View all placeholders in the current layout
 * - Add new placeholders (title, subtitle, body, picture, etc.)
 * - Select placeholders for editing
 * - Delete custom placeholders
 */
export class PlaceholderSection {
    constructor() {
        this.section = new Section({ 
            title: 'Placeholders',
            actions: [
                {
                    icon: Icons.PLUS || '+',
                    title: 'Add Placeholder',
                    onClick: () => this.showAddMenu()
                }
            ]
        });
        
        this.createContent();
    }

    createContent() {
        // Container for the placeholder list
        this.listContainer = document.createElement('div');
        this.listContainer.className = 'placeholder-list';
        this.listContainer.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: var(--spacing-1);
        `;
        this.section.appendChild(this.listContainer);

        // Add placeholder menu (hidden by default)
        this.addMenu = this.createAddMenu();
        this.section.appendChild(this.addMenu);
    }

    createAddMenu() {
        const menu = document.createElement('div');
        menu.className = 'placeholder-add-menu';
        menu.style.cssText = `
            display: none;
            flex-direction: column;
            gap: var(--spacing-1);
            padding: var(--spacing-2);
            margin-top: var(--spacing-2);
            background: var(--color-bg-well);
            border-radius: var(--radius-sm);
            border: 1px solid var(--color-border);
        `;

        const label = document.createElement('div');
        label.textContent = 'Add Placeholder';
        label.style.cssText = `
            font-size: var(--font-size-xs);
            color: var(--color-text-secondary);
            margin-bottom: var(--spacing-1);
        `;
        menu.appendChild(label);

        // Placeholder type options
        const types = [
            { value: 'title', label: 'Title', icon: '📝' },
            { value: 'subtitle', label: 'Subtitle', icon: '📋' },
            { value: 'body', label: 'Body / Content', icon: '📄' },
            { value: 'text', label: 'Text', icon: '✏️' },
            { value: 'picture', label: 'Picture', icon: '🖼️' },
            { value: 'media', label: 'Media', icon: '🎬' }
        ];

        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = `
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: var(--spacing-1);
        `;

        types.forEach(type => {
            const btn = document.createElement('button');
            btn.className = 'placeholder-type-btn';
            btn.innerHTML = `<span style="margin-right: 4px;">${type.icon}</span>${type.label}`;
            btn.style.cssText = `
                display: flex;
                align-items: center;
                justify-content: flex-start;
                padding: 6px 8px;
                border: 1px solid var(--color-border);
                border-radius: var(--radius-sm);
                background: var(--color-bg-panel);
                color: var(--color-text-primary);
                font-size: var(--font-size-sm);
                cursor: pointer;
                transition: background 0.15s, border-color 0.15s;
            `;
            btn.addEventListener('mouseenter', () => {
                btn.style.background = 'var(--color-bg-hover)';
                btn.style.borderColor = 'var(--color-border-active)';
            });
            btn.addEventListener('mouseleave', () => {
                btn.style.background = 'var(--color-bg-panel)';
                btn.style.borderColor = 'var(--color-border)';
            });
            btn.addEventListener('click', () => {
                this.addPlaceholder(type.value);
                this.hideAddMenu();
            });
            buttonContainer.appendChild(btn);
        });

        menu.appendChild(buttonContainer);

        // Cancel button
        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'Cancel';
        cancelBtn.style.cssText = `
            margin-top: var(--spacing-2);
            padding: 4px 8px;
            border: none;
            border-radius: var(--radius-sm);
            background: transparent;
            color: var(--color-text-secondary);
            font-size: var(--font-size-sm);
            cursor: pointer;
        `;
        cancelBtn.addEventListener('click', () => this.hideAddMenu());
        menu.appendChild(cancelBtn);

        return menu;
    }

    showAddMenu() {
        this.addMenu.style.display = 'flex';
    }

    hideAddMenu() {
        this.addMenu.style.display = 'none';
    }

    update(selection) {
        const state = store.getState();
        const mode = state.editor.mode;
        const activeMaster = state.masters[state.editor.activeMasterId];

        // Only show for layout masters in master mode with no selection
        if (mode !== 'master' || !activeMaster || activeMaster.type !== 'layout' || (selection && selection.length > 0)) {
            this.section.element.style.display = 'none';
            return;
        }

        this.section.element.style.display = 'block';
        this.renderPlaceholderList(activeMaster);
    }

    renderPlaceholderList(layout) {
        this.listContainer.innerHTML = '';

        // Get elements that are placeholders
        const placeholders = Object.values(layout.elements || {}).filter(el => el.isPlaceholder);

        if (placeholders.length === 0) {
            const emptyMsg = document.createElement('div');
            emptyMsg.textContent = 'No placeholders. Click + to add.';
            emptyMsg.style.cssText = `
                font-size: var(--font-size-sm);
                color: var(--color-text-tertiary);
                font-style: italic;
                padding: var(--spacing-2);
                text-align: center;
            `;
            this.listContainer.appendChild(emptyMsg);
            return;
        }

        // Sort by elementOrder if available
        const order = layout.elementOrder || [];
        placeholders.sort((a, b) => {
            const idxA = order.indexOf(a.id);
            const idxB = order.indexOf(b.id);
            return idxA - idxB;
        });

        placeholders.forEach(placeholder => {
            const item = this.createPlaceholderItem(placeholder, layout);
            this.listContainer.appendChild(item);
        });
    }

    createPlaceholderItem(placeholder, layout) {
        const item = document.createElement('div');
        item.className = 'placeholder-item';
        item.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 6px 8px;
            background: var(--color-bg-well);
            border: 1px solid var(--color-border);
            border-radius: var(--radius-sm);
            cursor: pointer;
            transition: background 0.15s, border-color 0.15s;
        `;

        // Left side: icon + name
        const leftSide = document.createElement('div');
        leftSide.style.cssText = `
            display: flex;
            align-items: center;
            gap: 8px;
        `;

        const icon = document.createElement('span');
        icon.textContent = this.getPlaceholderIcon(placeholder.placeholderType);
        icon.style.cssText = `
            font-size: 14px;
            width: 20px;
            text-align: center;
        `;

        const nameContainer = document.createElement('div');
        nameContainer.style.cssText = `
            display: flex;
            flex-direction: column;
        `;

        const name = document.createElement('span');
        name.textContent = this.getPlaceholderLabel(placeholder.placeholderType);
        name.style.cssText = `
            font-size: var(--font-size-sm);
            color: var(--color-text-primary);
        `;

        const subtext = document.createElement('span');
        subtext.textContent = placeholder.id;
        subtext.style.cssText = `
            font-size: var(--font-size-xs);
            color: var(--color-text-tertiary);
        `;

        nameContainer.appendChild(name);
        nameContainer.appendChild(subtext);

        leftSide.appendChild(icon);
        leftSide.appendChild(nameContainer);

        // Right side: actions
        const rightSide = document.createElement('div');
        rightSide.style.cssText = `
            display: flex;
            align-items: center;
            gap: 4px;
        `;

        // Select button
        const selectBtn = document.createElement('button');
        selectBtn.innerHTML = Icons.EYE || '👁';
        selectBtn.title = 'Select placeholder';
        selectBtn.style.cssText = `
            padding: 4px;
            border: none;
            border-radius: var(--radius-sm);
            background: transparent;
            color: var(--color-text-secondary);
            cursor: pointer;
            font-size: 12px;
            opacity: 0;
            transition: opacity 0.15s, background 0.15s;
        `;
        selectBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.selectPlaceholder(placeholder.id);
        });

        // Delete button (only for non-essential placeholders)
        const deleteBtn = document.createElement('button');
        deleteBtn.innerHTML = Icons.TRASH || '🗑';
        deleteBtn.title = 'Delete placeholder';
        deleteBtn.style.cssText = `
            padding: 4px;
            border: none;
            border-radius: var(--radius-sm);
            background: transparent;
            color: var(--color-text-secondary);
            cursor: pointer;
            font-size: 12px;
            opacity: 0;
            transition: opacity 0.15s, background 0.15s, color 0.15s;
        `;
        deleteBtn.addEventListener('mouseenter', () => {
            deleteBtn.style.color = 'var(--color-error)';
            deleteBtn.style.background = 'rgba(255,0,0,0.1)';
        });
        deleteBtn.addEventListener('mouseleave', () => {
            deleteBtn.style.color = 'var(--color-text-secondary)';
            deleteBtn.style.background = 'transparent';
        });
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.deletePlaceholder(placeholder.id, layout.id);
        });

        rightSide.appendChild(selectBtn);
        rightSide.appendChild(deleteBtn);

        item.appendChild(leftSide);
        item.appendChild(rightSide);

        // Hover effects
        item.addEventListener('mouseenter', () => {
            item.style.background = 'var(--color-bg-hover)';
            item.style.borderColor = 'var(--color-border-active)';
            selectBtn.style.opacity = '1';
            deleteBtn.style.opacity = '1';
        });
        item.addEventListener('mouseleave', () => {
            item.style.background = 'var(--color-bg-well)';
            item.style.borderColor = 'var(--color-border)';
            selectBtn.style.opacity = '0';
            deleteBtn.style.opacity = '0';
        });

        // Click to select
        item.addEventListener('click', () => {
            this.selectPlaceholder(placeholder.id);
        });

        return item;
    }

    getPlaceholderIcon(type) {
        const icons = {
            title: '📝',
            subtitle: '📋',
            body: '📄',
            content: '📄',
            text: '✏️',
            picture: '🖼️',
            media: '🎬',
            table: '📊',
            date: '📅',
            footer: '📌',
            slideNumber: '#'
        };
        return icons[type] || '📄';
    }

    getPlaceholderLabel(type) {
        const labels = {
            title: 'Title',
            subtitle: 'Subtitle',
            body: 'Body / Content',
            content: 'Content',
            text: 'Text',
            picture: 'Picture',
            media: 'Media',
            table: 'Table',
            date: 'Date',
            footer: 'Footer',
            slideNumber: 'Slide Number'
        };
        return labels[type] || type;
    }

    selectPlaceholder(elementId) {
        store.dispatch('SET_SELECTION', { elementIds: [elementId] });
    }

    addPlaceholder(type) {
        const state = store.getState();
        const layoutId = state.editor.activeMasterId;
        const layout = state.masters[layoutId];

        if (!layout || layout.type !== 'layout') return;

        // Generate unique ID
        const existingCount = Object.values(layout.elements || {})
            .filter(el => el.placeholderType === type).length;
        const newId = `placeholder-${type}-${existingCount + 1}`;

        // Default positions and sizes based on type
        const defaults = this.getPlaceholderDefaults(type, layout);

        const newPlaceholder = {
            id: newId,
            type: 'text',
            isPlaceholder: true,
            placeholderType: type,
            content: `<p>${this.getPlaceholderPrompt(type)}</p>`,
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
            this.selectPlaceholder(newId);
        }, 50);
    }

    getPlaceholderDefaults(type, layout) {
        const slideWidth = layout.width || 1920;
        const slideHeight = layout.height || 1080;
        const margin = 100;

        const defaults = {
            title: {
                x: margin,
                y: 100,
                width: slideWidth - margin * 2,
                height: 120,
                style: {
                    fontSize: 72,
                    textAlign: 'center',
                    color: 'var(--theme-text-primary, #333333)',
                    fontFamily: 'var(--theme-font-heading, Inter)',
                    fontWeight: '700'
                }
            },
            subtitle: {
                x: margin,
                y: 250,
                width: slideWidth - margin * 2,
                height: 80,
                style: {
                    fontSize: 32,
                    textAlign: 'center',
                    color: 'var(--theme-text-secondary, #666666)',
                    fontFamily: 'var(--theme-font-body, Inter)',
                    fontWeight: '400'
                }
            },
            body: {
                x: margin,
                y: 350,
                width: slideWidth - margin * 2,
                height: slideHeight - 450,
                style: {
                    fontSize: 24,
                    textAlign: 'left',
                    color: 'var(--theme-text-primary, #333333)',
                    fontFamily: 'var(--theme-font-body, Inter)',
                    fontWeight: '400'
                }
            },
            text: {
                x: margin,
                y: slideHeight / 2 - 50,
                width: 400,
                height: 100,
                style: {
                    fontSize: 18,
                    textAlign: 'left',
                    color: 'var(--theme-text-primary, #333333)',
                    fontFamily: 'var(--theme-font-body, Inter)',
                    fontWeight: '400'
                }
            },
            picture: {
                x: slideWidth / 2 - 200,
                y: slideHeight / 2 - 150,
                width: 400,
                height: 300,
                style: {
                    fontSize: 16,
                    textAlign: 'center',
                    color: 'var(--theme-text-secondary, #666666)'
                }
            },
            media: {
                x: slideWidth / 2 - 240,
                y: slideHeight / 2 - 135,
                width: 480,
                height: 270,
                style: {
                    fontSize: 16,
                    textAlign: 'center',
                    color: 'var(--theme-text-secondary, #666666)'
                }
            }
        };

        return defaults[type] || defaults.text;
    }

    getPlaceholderPrompt(type) {
        const prompts = {
            title: 'Click to add title',
            subtitle: 'Click to add subtitle',
            body: 'Click to add text',
            content: 'Click to add content',
            text: 'Click to add text',
            picture: '🖼️ Click to add picture',
            media: '🎬 Click to add media'
        };
        return prompts[type] || 'Click to add content';
    }

    deletePlaceholder(elementId, masterId) {
        if (confirm('Delete this placeholder?')) {
            store.dispatch('DELETE_ELEMENT_FROM_MASTER', { 
                masterId, 
                elementId 
            });
        }
    }
}
