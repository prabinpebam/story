import { Icons } from '../../Icons.js';
import { IconButton } from '../IconButton.js';
import { FillTypeSelector } from '../FillTypeSelector.js';
import { SolidTab } from './SolidTab.js';
import { GradientTab } from './GradientTab.js';
import { ImageTab } from './ImageTab.js';
import { VideoTab } from './VideoTab.js';
import { CodeTab } from './CodeTab.js';
import { CodeRunner } from '../../../core/effects/CodeRunner.js';
import { Flyout } from '../Flyout.js';
import { CodeFillPanel } from '../../panels/CodeFillPanel.js';
import { propertyMemory } from '../../../core/services/PropertyMemoryManager.js';

// Module-level cache for last used gradient to preserve stops across types/sessions
// Note: This is now also managed by PropertyMemoryManager, but kept for backward compatibility
let LastUsedGradient = {
    type: 'linear',
    angle: 90,
    stops: [
        { color: '#000000', position: 0 },
        { color: '#FFFFFF', position: 100 }
    ]
};

export class FillFlyout extends Flyout {
    constructor(options = {}) {
        super(options);
        
        this.onChange = options.onChange || (() => {});
        // onClose is handled by Flyout base class via options.onClose
        
        // Context key for memory (default to object fill)
        this.contextKey = options.contextKey || 'fill.object';
        
        this.fill = options.fill || { type: 'solid', color: '#000000', opacity: 100 };
        
        // CRITICAL: Update memory FROM selection when panel opens
        // Memory reads from selection, not applied to selection
        propertyMemory.updateFromSelection(this.contextKey, this.fill);
        
        // Apply specific styles for FillFlyout
        this.element.className = 'fill-flyout ui-flyout';
        this.element.style.width = '240px';
        this.element.style.backgroundColor = 'var(--color-bg-elevated)';
        this.element.style.borderRadius = 'var(--radius-lg)';
        this.element.style.boxShadow = 'var(--shadow-2xl)';
        this.element.style.padding = '12px';
        this.element.style.display = 'flex';
        this.element.style.flexDirection = 'column';
        this.element.style.gap = '12px';

        // Prevent clicks from closing the flyout (if click-outside logic exists elsewhere)
        this.element.addEventListener('mousedown', (e) => e.stopPropagation());

        this.render();
    }

    render() {
        this.element.innerHTML = '';
        
        // 1. Header
        const header = document.createElement('div');
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.alignItems = 'center';
        header.style.marginBottom = '4px';

        // Tabs (Custom / Libraries)
        const tabs = document.createElement('div');
        tabs.style.display = 'flex';
        tabs.style.gap = '12px';
        
        const customTab = document.createElement('div');
        customTab.textContent = 'Custom';
        customTab.style.fontSize = 'var(--font-size-sm)';
        customTab.style.fontWeight = 'var(--font-weight-semibold)';
        customTab.style.color = 'var(--color-text-primary)';
        customTab.style.cursor = 'pointer';
        
        const librariesTab = document.createElement('div');
        librariesTab.textContent = 'Libraries';
        librariesTab.style.fontSize = 'var(--font-size-sm)';
        librariesTab.style.color = 'var(--color-text-secondary)';
        librariesTab.style.cursor = 'pointer';

        tabs.appendChild(customTab);
        tabs.appendChild(librariesTab);

        // Actions (+, X)
        const actions = document.createElement('div');
        actions.style.display = 'flex';
        actions.style.gap = '4px';

        const addBtn = new IconButton({ icon: Icons.PLUS, title: 'Create Style', onClick: () => {} });
        const closeBtn = new IconButton({ icon: Icons.CLOSE, title: 'Close', onClick: () => this.close() });

        actions.appendChild(addBtn.element);
        actions.appendChild(closeBtn.element);

        header.appendChild(tabs);
        header.appendChild(actions);
        this.element.appendChild(header);

        // 2. Mode Selector
        const modeRow = document.createElement('div');
        modeRow.style.display = 'flex';
        modeRow.style.justifyContent = 'space-between';
        modeRow.style.alignItems = 'center';
        modeRow.style.paddingBottom = '12px';
        modeRow.style.borderBottom = '1px solid var(--color-border)';

        const typeSelector = new FillTypeSelector({
            activeType: this.fill.type,
            onChange: (type) => this.setMode(type)
        });

        modeRow.appendChild(typeSelector.element);
        
        // Open Panel button for code fills (icon only)
        if (this.fill.type === 'code') {
            const openPanelBtn = new IconButton({ 
                icon: Icons.EXTERNAL || '↗', 
                title: 'Open Code Fill Panel (Ctrl+Shift+K)',
                onClick: () => CodeFillPanel.open()
            });
            openPanelBtn.element.style.marginLeft = 'auto';
            modeRow.appendChild(openPanelBtn.element);
        }
        
        this.element.appendChild(modeRow);

        // 3. Content Area
        const content = document.createElement('div');
        
        let TabComponent;
        switch (this.fill.type) {
            case 'solid': TabComponent = SolidTab; break;
            case 'gradient': TabComponent = GradientTab; break;
            case 'image': TabComponent = ImageTab; break;
            case 'video': TabComponent = VideoTab; break;
            case 'code': TabComponent = CodeTab; break;
            default: TabComponent = SolidTab;
        }

        if (TabComponent) {
            // Clean up previous tab if it has a destroy method (like CodeTab)
            if (this.currentTabInstance && typeof this.currentTabInstance.destroy === 'function') {
                this.currentTabInstance.destroy();
            }

            const tab = new TabComponent({
                fill: this.fill,
                onChange: (updates) => this.updateFill(updates)
            });
            this.currentTabInstance = tab;
            content.appendChild(tab.element);
        }

        this.element.appendChild(content);
    }

    setMode(type) {
        if (this.fill.type === type) return;
        
        // Get defaults from memory for the new mode
        const memoryDefaults = propertyMemory.getFillDefaults(this.contextKey, type);
        
        // When switching modes, create a clean fill object for the new type
        // Don't carry over properties from other fill types (like assetId from image fills)
        let newFill = { type, visible: this.fill.visible, blendMode: this.fill.blendMode };
        
        if (type === 'solid') {
            newFill.color = memoryDefaults?.color || '#000000';
            newFill.value = memoryDefaults?.color || '#000000';
            newFill.opacity = memoryDefaults?.opacity || 100;
        } else if (type === 'gradient') {
            // Use memory gradient, then LastUsedGradient fallback
            newFill.value = memoryDefaults?.value 
                ? JSON.parse(JSON.stringify(memoryDefaults.value))
                : JSON.parse(JSON.stringify(LastUsedGradient));
            newFill.opacity = this.fill.opacity || 100;
        } else if (type === 'image') {
            newFill.value = ''; // Empty image - not stored in memory
            newFill.assetId = null;
            newFill.scaleMode = 'fill';
            newFill.position = { x: 0.5, y: 0.5 };
            newFill.opacity = this.fill.opacity || 100;
        } else if (type === 'video') {
            newFill.value = ''; // Empty video - not stored in memory
            newFill.assetId = null;
            newFill.scaleMode = 'fill';
            newFill.opacity = this.fill.opacity || 100;
        } else if (type === 'code') {
            newFill.code = memoryDefaults?.code || CodeRunner.DEFAULT_CODE;
            newFill.opacity = this.fill.opacity || 100;
        }

        // Replace the fill entirely instead of merging
        this.fill = newFill;
        
        // Update memory with the new fill state
        propertyMemory.updateFromSelection(this.contextKey, this.fill);

        this.onChange(this.fill, false);
        this.render();
    }

    updateFill(updates, isTransient = false) {
        console.log('[FillFlyout.updateFill] Received updates:', updates);
        const oldType = this.fill.type;
        this.fill = { ...this.fill, ...updates };
        console.log('[FillFlyout.updateFill] Merged fill:', this.fill);
        
        // Update cache if it's a gradient (backward compatibility)
        if (this.fill.type === 'gradient' && this.fill.value) {
            // Ensure we store a clean object
            if (typeof this.fill.value === 'object') {
                LastUsedGradient = JSON.parse(JSON.stringify(this.fill.value));
            }
        }
        
        // Update memory with the new fill state
        // This ensures memory stays in sync with user edits
        propertyMemory.updateFromSelection(this.contextKey, this.fill);

        this.onChange(this.fill, isTransient);
        
        // Only re-render if the type changed (e.g. solid -> gradient)
        // This prevents destroying the active tab while dragging sliders
        if (updates.type && updates.type !== oldType) {
            this.render();
        }
    }

    destroy() {
        // Persist memory when flyout closes
        propertyMemory.onPanelClose(this.contextKey);
        
        if (this.currentTabInstance && typeof this.currentTabInstance.destroy === 'function') {
            this.currentTabInstance.destroy();
        }
        // Call parent close/destroy if needed, but Flyout.close() removes element
    }
}

