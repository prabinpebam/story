/**
 * ShareLinkPanel Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ShareLinkPanel } from '../../../src/ui/sharing/ShareLinkPanel.js';
import { ShareLinkTypes, ShareLinkScopes } from '../../../src/core/storage/sharing/SharingConstants.js';

// Mock clipboard API
Object.assign(navigator, {
    clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined)
    }
});

describe('ShareLinkPanel', () => {
    let panel;
    const mockLinks = [
        {
            id: 'link-1',
            type: ShareLinkTypes.VIEW,
            scope: ShareLinkScopes.ANYONE,
            url: 'https://story.app/share/abc123'
        },
        {
            id: 'link-2',
            type: ShareLinkTypes.EDIT,
            scope: ShareLinkScopes.ORGANIZATION,
            url: 'https://story.app/share/def456'
        }
    ];
    
    beforeEach(() => {
        document.body.innerHTML = '';
        vi.clearAllMocks();
        
        panel = new ShareLinkPanel({
            links: mockLinks
        });
        document.body.appendChild(panel.element);
    });
    
    afterEach(() => {
        panel?.destroy();
    });
    
    describe('Initialization', () => {
        it('should create panel element', () => {
            expect(panel.element).toBeDefined();
            expect(panel.element.classList.contains('share-link-panel')).toBe(true);
        });
        
        it('should render all links', () => {
            const items = panel.element.querySelectorAll('.share-link-item');
            expect(items.length).toBe(2);
        });
    });
    
    describe('Empty State', () => {
        it('should show create button when no links', () => {
            panel.destroy();
            panel = new ShareLinkPanel({ links: [] });
            document.body.appendChild(panel.element);
            
            const createBtn = panel.element.querySelector('.share-link-create-btn');
            expect(createBtn).toBeDefined();
        });
    });
    
    describe('Link Display', () => {
        it('should show link type label', () => {
            const labels = panel.element.querySelectorAll('.share-link-label');
            expect(labels[0].textContent).toContain('View');
        });
        
        it('should show link URL', () => {
            const urls = panel.element.querySelectorAll('.share-link-url');
            expect(urls[0].textContent).toBe('https://story.app/share/abc123');
        });
        
        it('should show appropriate icon for view link', () => {
            const icons = panel.element.querySelectorAll('.share-link-icon i');
            expect(icons[0].classList.contains('fa-eye')).toBe(true);
        });
        
        it('should show appropriate icon for edit link', () => {
            const icons = panel.element.querySelectorAll('.share-link-icon i');
            expect(icons[1].classList.contains('fa-pen')).toBe(true);
        });
    });
    
    describe('Copy Link', () => {
        it('should have copy button for each link', () => {
            const items = panel.element.querySelectorAll('.share-link-item');
            items.forEach(item => {
                const copyBtn = item.querySelector('[data-action="copy"]');
                expect(copyBtn).toBeDefined();
            });
        });
        
        it('should copy link to clipboard on click', async () => {
            const copyBtn = panel.element.querySelector('[data-action="copy"]');
            await copyBtn?.click();
            
            expect(navigator.clipboard.writeText).toHaveBeenCalledWith('https://story.app/share/abc123');
        });
        
        it('should show copied state', async () => {
            const copyBtn = panel.element.querySelector('[data-action="copy"]');
            await copyBtn?.click();
            
            // Wait for state update
            await new Promise(r => setTimeout(r, 10));
            expect(copyBtn?.classList.contains('copied')).toBe(true);
        });
    });
    
    describe('Revoke Link', () => {
        it('should have revoke button for each link', () => {
            const items = panel.element.querySelectorAll('.share-link-item');
            items.forEach(item => {
                const revokeBtn = item.querySelector('[data-action="revoke"]');
                expect(revokeBtn).toBeDefined();
            });
        });
        
        it('should call onRevoke when revoke clicked', () => {
            const onRevoke = vi.fn();
            panel.destroy();
            panel = new ShareLinkPanel({
                links: mockLinks,
                onRevoke
            });
            document.body.appendChild(panel.element);
            
            const revokeBtn = panel.element.querySelector('[data-action="revoke"]');
            revokeBtn?.click();
            
            expect(onRevoke).toHaveBeenCalledWith('link-1');
        });
    });
    
    describe('Create Link', () => {
        it('should call onCreate for view link', () => {
            const onCreate = vi.fn();
            panel.destroy();
            panel = new ShareLinkPanel({
                links: [],
                onCreate
            });
            document.body.appendChild(panel.element);
            
            const createBtn = panel.element.querySelector('[data-link-type="view"]');
            createBtn?.click();
            
            expect(onCreate).toHaveBeenCalledWith(ShareLinkTypes.VIEW);
        });
        
        it('should call onCreate for edit link', () => {
            const onCreate = vi.fn();
            panel.destroy();
            panel = new ShareLinkPanel({
                links: [],
                onCreate
            });
            document.body.appendChild(panel.element);
            
            const createBtn = panel.element.querySelector('[data-link-type="edit"]');
            createBtn?.click();
            
            expect(onCreate).toHaveBeenCalledWith(ShareLinkTypes.EDIT);
        });
    });
    
    describe('Link Sections', () => {
        it('should show view link section', () => {
            const sections = panel.element.querySelectorAll('.share-link-section');
            expect(sections.length).toBeGreaterThan(0);
        });
        
        it('should show section title', () => {
            const titles = panel.element.querySelectorAll('.share-link-section-title');
            expect(titles.length).toBeGreaterThan(0);
        });
    });
    
    describe('setLinks()', () => {
        it('should update links', () => {
            panel.setLinks([mockLinks[0]]);
            const items = panel.element.querySelectorAll('.share-link-item');
            expect(items.length).toBe(1);
        });
        
        it('should show create button when all links removed', () => {
            panel.setLinks([]);
            const createBtn = panel.element.querySelector('.share-link-create-btn');
            expect(createBtn).toBeDefined();
        });
    });
    
    describe('Scope Display', () => {
        it('should show scope for organization links', () => {
            const items = panel.element.querySelectorAll('.share-link-item');
            const label = items[1].querySelector('.share-link-label');
            expect(label?.textContent).toContain('Organization');
        });
    });
    
    describe('Loading State', () => {
        it('should show loading indicator', () => {
            panel.setLoading(true);
            const loading = panel.element.querySelector('.share-loading');
            expect(loading).toBeDefined();
        });
        
        it('should hide loading when done', () => {
            panel.setLoading(true);
            panel.setLoading(false);
            const loading = panel.element.querySelector('.share-loading');
            expect(loading).toBeNull();
        });
    });
    
    describe('Error State', () => {
        it('should show error message', () => {
            panel.setError('Failed to load links');
            const error = panel.element.querySelector('.share-error');
            expect(error).toBeDefined();
            expect(error?.textContent).toContain('Failed to load links');
        });
        
        it('should clear error', () => {
            panel.setError('Error');
            panel.setError(null);
            const error = panel.element.querySelector('.share-error');
            expect(error).toBeNull();
        });
    });
    
    describe('destroy()', () => {
        it('should remove element from DOM', () => {
            panel.destroy();
            expect(document.body.contains(panel.element)).toBe(false);
        });
    });
});
