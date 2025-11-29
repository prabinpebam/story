/**
 * FileIndicatorController
 * 
 * Connects the FileIndicatorPill UI with the FileService,
 * handling action events from the pill's menu.
 * 
 * Note: The pill subscribes to FileService events internally,
 * so this controller only needs to handle menu actions.
 */

import { FileIndicatorPill } from '../file/FileIndicatorPill.js';
import { AccessSettingsModal } from '../file/AccessSettingsModal.js';
import { fileService } from './FileService.js';

export class FileIndicatorController {
    /**
     * Create file indicator controller
     * @param {string} containerId - Container element ID for the pill
     */
    constructor(containerId) {
        this.containerId = containerId;
        this.pill = null;
        
        this.init();
    }
    
    init() {
        const container = document.getElementById(this.containerId);
        if (!container) {
            console.warn(`FileIndicatorController: Container '${this.containerId}' not found`);
            return;
        }
        
        // Create the pill (pass container to constructor)
        // The pill subscribes to FileService events internally
        this.pill = new FileIndicatorPill(container);
        
        // Bind pill action events (from its dropdown menu)
        this.pill.on('action', (action) => this.handleAction(action));
    }
    
    /**
     * Handle action from pill menu
     * @param {string} action
     */
    async handleAction(action) {
        switch (action) {
            case 'rename':
                // In-place rename would need custom implementation
                // For now, use save-as
                await fileService.saveAs();
                break;
                
            case 'move':
                // Move to different folder
                const source = fileService.getCurrentSource();
                if (source !== 'local') {
                    await fileService.saveToCloud(source, true);
                }
                break;
                
            case 'copy':
                // Create a copy
                await fileService.saveAs();
                break;
                
            case 'share':
            case 'access':
                await this.showAccessSettings();
                break;
                
            case 'history':
                // Version history - future feature
                console.log('Version history not yet implemented');
                break;
                
            default:
                console.log('Unknown action:', action);
        }
    }
    
    /**
     * Show access settings modal
     */
    async showAccessSettings() {
        const info = fileService.getCurrentFileInfo();
        
        if (info.source === 'local') {
            // Can't share local files
            return;
        }
        
        const result = await AccessSettingsModal.show({
            file: {
                name: info.name || 'Untitled.str',
                provider: info.source,
                accessLevel: info.cloudInfo?.accessLevel || 'account-locked',
                sharedWith: [] // Would come from cloud provider
            }
        });
        
        if (result) {
            // Update access settings via cloud provider
            console.log('Access settings updated:', result);
            // TODO: Implement actual cloud API call
        }
    }
    
    /**
     * Show the pill
     */
    show() {
        this.pill?.show();
    }
    
    /**
     * Hide the pill
     */
    hide() {
        this.pill?.hide();
    }
    
    /**
     * Destroy controller
     */
    destroy() {
        if (this.pill) {
            this.pill.destroy();
            this.pill = null;
        }
    }
}

export default FileIndicatorController;
