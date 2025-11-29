/**
 * ShareLinkPanel
 * 
 * Panel for managing share links (view, edit) with copy functionality.
 */

import { ShareLinkTypes, ShareLinkScopes } from '../../core/storage/sharing/SharingConstants.js';
import { ShareLinkGenerator } from '../../core/storage/sharing/ShareLinkGenerator.js';

export class ShareLinkPanel {
    /**
     * Create a ShareLinkPanel
     * @param {Object} options - Configuration options
     * @param {string} options.fileId - File ID
     * @param {string} options.provider - Cloud provider
     * @param {Array} options.links - Existing share links
     * @param {Object} options.sharingManager - Sharing manager
     * @param {Function} options.onCreate - Callback for creating links
     * @param {Function} options.onCreateLink - Callback for creating links (alias)
     * @param {Function} options.onRevoke - Callback for revoking links
     * @param {Function} options.onRevokeLink - Callback for revoking links (alias)
     */
    constructor(options = {}) {
        this.fileId = options.fileId;
        this.provider = options.provider;
        this.links = options.links || [];
        this.sharingManager = options.sharingManager;
        this.onCreate = options.onCreate || options.onCreateLink;
        this.onRevoke = options.onRevoke || options.onRevokeLink;
        
        this.linkGenerator = new ShareLinkGenerator();
        this.isLoading = false;
        this.error = null;
        
        this.element = document.createElement('div');
        this.element.className = 'share-link-panel';
        
        this._render();
    }

    /**
     * Render the panel
     * @private
     */
    _render() {
        this.element.innerHTML = '';
        
        // Show loading state
        if (this.isLoading) {
            this._renderLoading();
            return;
        }
        
        // Show error state
        if (this.error) {
            this._renderError();
        }
        
        // If no links, show create buttons
        if (this.links.length === 0) {
            const createSection = this._renderCreateSection();
            this.element.appendChild(createSection);
        } else {
            // View links section
            const viewLinks = this.links.filter(l => l.type === ShareLinkTypes.VIEW);
            const editLinks = this.links.filter(l => l.type === ShareLinkTypes.EDIT);
            
            if (viewLinks.length > 0) {
                const viewSection = this._renderLinkSection('View links', viewLinks);
                this.element.appendChild(viewSection);
            }
            
            if (editLinks.length > 0) {
                const editSection = this._renderLinkSection('Edit links', editLinks);
                this.element.appendChild(editSection);
            }
            
            // Create buttons for missing types
            if (viewLinks.length === 0 || editLinks.length === 0) {
                const createSection = this._renderCreateSection();
                this.element.appendChild(createSection);
            }
        }
    }

    /**
     * Render loading state
     * @private
     */
    _renderLoading() {
        const loading = document.createElement('div');
        loading.className = 'share-loading';
        loading.innerHTML = `
            <div class="share-loading-spinner"></div>
            <span>Loading links...</span>
        `;
        this.element.appendChild(loading);
    }

    /**
     * Render error state
     * @private
     */
    _renderError() {
        const error = document.createElement('div');
        error.className = 'share-error';
        error.innerHTML = `
            <i class="fa-solid fa-exclamation-triangle"></i>
            <span>${this.error}</span>
        `;
        this.element.appendChild(error);
    }

    /**
     * Render a section of links
     * @param {string} title - Section title
     * @param {Array} links - Links to render
     * @private
     */
    _renderLinkSection(title, links) {
        const section = document.createElement('div');
        section.className = 'share-link-section';
        
        const sectionTitle = document.createElement('h4');
        sectionTitle.className = 'share-link-section-title';
        sectionTitle.textContent = title;
        section.appendChild(sectionTitle);
        
        links.forEach(link => {
            const item = this._renderLinkItem(link);
            section.appendChild(item);
        });
        
        return section;
    }

    /**
     * Render create link section
     * @private
     */
    _renderCreateSection() {
        const section = document.createElement('div');
        section.className = 'share-link-create';
        
        const viewLink = this.links.find(l => l.type === ShareLinkTypes.VIEW);
        const editLink = this.links.find(l => l.type === ShareLinkTypes.EDIT);
        
        // If no view link exists, show create button
        if (!viewLink) {
            const createViewBtn = document.createElement('button');
            createViewBtn.className = 'share-link-create-btn';
            createViewBtn.dataset.linkType = 'view';
            createViewBtn.innerHTML = '<i class="fa-solid fa-eye"></i> Create view link';
            createViewBtn.addEventListener('click', () => {
                if (this.onCreate) {
                    this.onCreate(ShareLinkTypes.VIEW);
                }
            });
            section.appendChild(createViewBtn);
        }
        
        // If no edit link exists, show create button
        if (!editLink) {
            const createEditBtn = document.createElement('button');
            createEditBtn.className = 'share-link-create-btn';
            createEditBtn.dataset.linkType = 'edit';
            createEditBtn.innerHTML = '<i class="fa-solid fa-pen"></i> Create edit link';
            createEditBtn.addEventListener('click', () => {
                if (this.onCreate) {
                    this.onCreate(ShareLinkTypes.EDIT);
                }
            });
            section.appendChild(createEditBtn);
        }
        
        return section;
    }

    /**
     * Render a single link item
     * @param {Object} link - Link data
     * @private
     */
    _renderLinkItem(link) {
        const item = document.createElement('div');
        item.className = 'share-link-item';
        item.dataset.linkId = link.id;
        
        // Icon
        const icon = document.createElement('div');
        icon.className = 'share-link-icon';
        icon.innerHTML = link.type === ShareLinkTypes.EDIT 
            ? '<i class="fa-solid fa-pen"></i>'
            : '<i class="fa-solid fa-eye"></i>';
        item.appendChild(icon);
        
        // Info
        const info = document.createElement('div');
        info.className = 'share-link-info';
        
        const label = document.createElement('span');
        label.className = 'share-link-label';
        
        let labelText = link.type === ShareLinkTypes.EDIT ? 'Edit' : 'View';
        if (link.scope === ShareLinkScopes.ORGANIZATION) {
            labelText += ' (Organization only)';
        }
        label.textContent = labelText;
        info.appendChild(label);
        
        const url = document.createElement('span');
        url.className = 'share-link-url';
        url.textContent = link.url;
        info.appendChild(url);
        
        item.appendChild(info);
        
        // Actions
        const actions = document.createElement('div');
        actions.className = 'share-link-actions';
        
        // Copy button
        const copyBtn = document.createElement('button');
        copyBtn.className = 'share-link-btn';
        copyBtn.dataset.action = 'copy';
        copyBtn.dataset.url = link.url;
        copyBtn.title = 'Copy link';
        copyBtn.innerHTML = '<i class="fa-solid fa-copy"></i> Copy';
        copyBtn.addEventListener('click', () => this._copyLink(link.url, copyBtn));
        actions.appendChild(copyBtn);
        
        // Revoke button
        const revokeBtn = document.createElement('button');
        revokeBtn.className = 'share-link-btn share-link-btn-revoke';
        revokeBtn.dataset.action = 'revoke';
        revokeBtn.dataset.linkId = link.id;
        revokeBtn.title = 'Remove link';
        revokeBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';
        revokeBtn.addEventListener('click', () => {
            if (this.onRevoke) {
                this.onRevoke(link.id);
            }
        });
        actions.appendChild(revokeBtn);
        
        item.appendChild(actions);
        
        return item;
    }

    /**
     * Copy link to clipboard
     * @private
     */
    async _copyLink(url, button) {
        try {
            await navigator.clipboard.writeText(url);
            
            const originalContent = button.innerHTML;
            button.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
            button.classList.add('copied');
            
            setTimeout(() => {
                button.innerHTML = originalContent;
                button.classList.remove('copied');
            }, 2000);
        } catch (error) {
            console.error('Failed to copy link:', error);
        }
    }

    /**
     * Set links
     * @param {Array} links - New links array
     */
    setLinks(links) {
        this.links = links;
        this._render();
    }

    /**
     * Update links (alias for setLinks)
     * @param {Array} links - New links array
     */
    update(links) {
        this.setLinks(links);
    }

    /**
     * Set loading state
     * @param {boolean} loading - Loading state
     */
    setLoading(loading) {
        this.isLoading = loading;
        this._render();
    }

    /**
     * Set error message
     * @param {string|null} error - Error message or null to clear
     */
    setError(error) {
        this.error = error;
        this._render();
    }

    /**
     * Destroy the component
     */
    destroy() {
        if (this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    }
}

export default ShareLinkPanel;
