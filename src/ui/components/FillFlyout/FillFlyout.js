import { Icons } from '../../Icons.js';
import { IconButton } from '../IconButton.js';
import { FillTypeSelector } from '../FillTypeSelector.js';
import { SolidTab } from './SolidTab.js';
import { GradientTab } from './GradientTab.js';
import { ImageTab } from './ImageTab.js';
import { VideoTab } from './VideoTab.js';
import { CodeTab } from './CodeTab.js';
import { CodeRunner } from '../../../core/effects/CodeRunner.js';

export class FillFlyout {
    constructor(options = {}) {
        this.options = options;
        this.onChange = options.onChange || (() => {});
        this.onClose = options.onClose || (() => {});
        this.fill = options.fill || { type: 'solid', color: '#000000', opacity: 100 };
        
        this.element = document.createElement('div');
        this.element.className = 'fill-flyout';
        this.element.style.position = 'absolute';
        this.element.style.width = '240px';
        this.element.style.backgroundColor = '#2C2C2C';
        this.element.style.borderRadius = '8px';
        this.element.style.boxShadow = '0 8px 24px rgba(0,0,0,0.5)';
        this.element.style.padding = '12px';
        this.element.style.zIndex = '10000';
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
        customTab.style.fontSize = '11px';
        customTab.style.fontWeight = '600';
        customTab.style.color = '#FFFFFF';
        customTab.style.cursor = 'pointer';
        
        const librariesTab = document.createElement('div');
        librariesTab.textContent = 'Libraries';
        librariesTab.style.fontSize = '11px';
        librariesTab.style.color = '#888888';
        librariesTab.style.cursor = 'pointer';

        tabs.appendChild(customTab);
        tabs.appendChild(librariesTab);

        // Actions (+, X)
        const actions = document.createElement('div');
        actions.style.display = 'flex';
        actions.style.gap = '4px';

        const addBtn = new IconButton({ icon: Icons.PLUS, title: 'Create Style', onClick: () => {} });
        const closeBtn = new IconButton({ icon: Icons.CLOSE, title: 'Close', onClick: () => this.onClose() });

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
        modeRow.style.borderBottom = '1px solid #444';

        const typeSelector = new FillTypeSelector({
            activeType: this.fill.type,
            onChange: (type) => this.setMode(type)
        });

        modeRow.appendChild(typeSelector.element);
        
        // Blend & Visibility (Right side of mode row)
        const extraGroup = document.createElement('div');
        extraGroup.style.display = 'flex';
        extraGroup.style.gap = '2px';
        
        const blendBtn = new IconButton({ icon: Icons.BLEND_MODE, title: 'Blend Mode' });
        const visBtn = new IconButton({ icon: Icons.VISIBLE, title: 'Visibility' }); // TODO: Sync with fill.visible
        
        extraGroup.appendChild(blendBtn.element);
        extraGroup.appendChild(visBtn.element);
        
        modeRow.appendChild(extraGroup);
        this.element.appendChild(modeRow);

        // 3. Content Area
        const content = document.createElement('div');
        content.style.marginTop = '12px';
        
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
        
        // Default values when switching modes
        let updates = { type };
        if (type === 'solid') {
            updates.color = '#000000';
            updates.value = '#000000';
        } else if (type === 'gradient') {
            updates.value = 'linear-gradient(90deg, #000000 0%, #FFFFFF 100%)';
        } else if (type === 'image') {
            updates.value = ''; // Empty image
        } else if (type === 'video') {
            updates.value = '';
        } else if (type === 'code') {
            updates.code = CodeRunner.DEFAULT_CODE;
        }

        this.updateFill(updates);
    }

    updateFill(updates) {
        const oldType = this.fill.type;
        this.fill = { ...this.fill, ...updates };
        this.onChange(this.fill);
        
        // Only re-render if the type changed (e.g. solid -> gradient)
        // This prevents destroying the active tab while dragging sliders
        if (updates.type && updates.type !== oldType) {
            this.render();
        }
    }

    destroy() {
        if (this.currentTabInstance && typeof this.currentTabInstance.destroy === 'function') {
            this.currentTabInstance.destroy();
        }
    }
}
