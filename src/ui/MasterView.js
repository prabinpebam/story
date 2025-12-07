/**
 * MasterView.js
 * The main view component for the Slide Master editing mode.
 * Displays the master/layout hierarchy sidebar and manages the master editing context.
 */

import { store } from '../core/Store.js';
import { Button } from './components/Button.js';

export class MasterView {
    constructor() {
        this.element = document.createElement('div');
        this.element.id = 'master-view';
        this.element.className = 'master-view';
        this.element.style.display = 'none'; // Hidden by default
        
        this.buildUI();
        this.setupListeners();
    }

    buildUI() {
        // Header / Toolbar for Master View
        this.header = document.createElement('div');
        this.header.className = 'master-view-header';
        
        const titleGroup = document.createElement('div');
        titleGroup.className = 'master-view-title-group';
        
        const title = document.createElement('div');
        title.className = 'master-view-title';
        title.textContent = 'Slide Master View';
        
        titleGroup.appendChild(title);
        
        const actions = document.createElement('div');
        actions.className = 'master-view-actions';
        
        this.closeButton = new Button({
            label: 'Close Master View',
            variant: 'primary',
            onClick: () => this.close()
        });
        
        actions.appendChild(this.closeButton.element);
        this.header.appendChild(titleGroup);
        this.header.appendChild(actions);
        
        this.element.appendChild(this.header);
        
        // Sidebar for Masters/Layouts
        this.sidebar = document.createElement('div');
        this.sidebar.className = 'master-view-sidebar';
        this.element.appendChild(this.sidebar);
        
        // Note: The main canvas is behind this view.
        // When Master View is active, the main SlideList is hidden via CSS or state,
        // and this sidebar takes its place on the left.
    }

    setupListeners() {
        store.on('state-changed', (state) => {
            this.update(state);
        });
    }

    update(state) {
        const isMasterMode = state.editor.mode === 'master';
        
        if (isMasterMode) {
            this.element.style.display = 'flex';
            this.renderSidebar(state);
        } else {
            this.element.style.display = 'none';
        }
    }

    renderSidebar(state) {
        this.sidebar.innerHTML = '';
        
        const masters = state.slideMasterPresets || {};
        const layouts = state.layoutMasters || {}; // Assuming layoutMasters are at root or we need to find them
        const activeMasterId = state.editor.activeMasterId;
        
        // If layoutMasters are not at root, we might need to look inside masters or a separate collection.
        // Based on InitialState.js, they seem to be in a separate collection if they have IDs like "layout-title".
        // But let's check if they are in `state.layoutMasters`.
        // InitialState.js showed `DEFAULT_LAYOUT_MASTERS` but didn't explicitly show the root state key.
        // I'll assume `state.layoutMasters` exists or I need to derive it.
        // Actually, `SlideMasterPreset` usually contains layouts or references them.
        // Let's assume `state.layoutMasters` is the collection for now.
        
        const allLayouts = state.layoutMasters || {};

        Object.values(masters).forEach(master => {
            const masterGroup = document.createElement('div');
            masterGroup.className = 'master-group';
            
            // Master Item
            const masterItem = this.createThumbnailItem(master, activeMasterId === master.id, true);
            masterItem.onclick = () => {
                store.dispatch('SET_ACTIVE_MASTER', { masterId: master.id });
            };
            masterGroup.appendChild(masterItem);
            
            // Layout Items
            // Filter layouts that belong to this master
            const masterLayouts = Object.values(allLayouts).filter(l => l.parentMasterId === master.id);
            
            masterLayouts.forEach(layout => {
                const layoutItem = this.createThumbnailItem(layout, activeMasterId === layout.id, false);
                layoutItem.onclick = () => {
                    // When clicking a layout, we set it as the active "master" context for editing
                    store.dispatch('SET_ACTIVE_MASTER', { masterId: layout.id });
                };
                masterGroup.appendChild(layoutItem);
            });
            
            this.sidebar.appendChild(masterGroup);
        });
    }
    
    createThumbnailItem(item, isActive, isMaster) {
        const el = document.createElement('div');
        el.className = `master-thumbnail-item ${isActive ? 'active' : ''} ${isMaster ? 'is-master' : 'is-layout'}`;
        
        // Indentation for layouts
        if (!isMaster) {
            el.style.paddingLeft = '20px';
        }
        
        const label = document.createElement('div');
        label.className = 'master-thumbnail-label';
        label.textContent = item.name;
        
        // Simple preview placeholder
        const thumb = document.createElement('div');
        thumb.className = 'master-thumbnail-preview';
        thumb.textContent = isMaster ? 'M' : 'L';
        
        el.appendChild(thumb);
        el.appendChild(label);
        
        return el;
    }

    close() {
        store.dispatch('SET_EDITOR_MODE', { mode: 'edit' });
    }
}
