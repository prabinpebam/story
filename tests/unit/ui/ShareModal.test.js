/**
 * ShareModal Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ShareModal } from '../../../src/ui/sharing/ShareModal.js';

describe('ShareModal', () => {
    let modal;
    let mockSharingManager;
    
    beforeEach(() => {
        // Setup document body
        document.body.innerHTML = '';
        
        // Mock SharingManager
        mockSharingManager = {
            shareWithPeople: vi.fn().mockResolvedValue({ success: true }),
            getCollaborators: vi.fn().mockResolvedValue([]),
            getShareLinks: vi.fn().mockResolvedValue([]),
            canShare: vi.fn().mockResolvedValue(true),
            addEventListener: vi.fn(),
            removeEventListener: vi.fn()
        };
        
        modal = new ShareModal({
            fileId: 'test-123',
            fileName: 'Test Presentation',
            provider: 'onedrive',
            sharingManager: mockSharingManager
        });
    });
    
    afterEach(() => {
        modal?.destroy();
        document.body.innerHTML = '';
    });
    
    describe('Initialization', () => {
        it('should create ShareModal instance', () => {
            expect(modal).toBeDefined();
            expect(modal.fileId).toBe('test-123');
        });
        
        it('should store file name', () => {
            expect(modal.fileName).toBe('Test Presentation');
        });
        
        it('should store provider', () => {
            expect(modal.provider).toBe('onedrive');
        });
        
        it('should have no overlay initially', () => {
            expect(modal.overlay).toBeNull();
        });
    });
    
    describe('show()', () => {
        it('should create overlay element', async () => {
            await modal.show();
            expect(modal.overlay).toBeDefined();
            expect(modal.overlay.classList.contains('share-modal-overlay')).toBe(true);
        });
        
        it('should create modal element', async () => {
            await modal.show();
            expect(modal.modal).toBeDefined();
            expect(modal.modal.classList.contains('share-modal')).toBe(true);
        });
        
        it('should append to body', async () => {
            await modal.show();
            expect(document.body.contains(modal.overlay)).toBe(true);
        });
        
        it('should make modal visible', async () => {
            await modal.show();
            // Wait for animation frame
            await new Promise(r => setTimeout(r, 20));
            expect(modal.overlay.classList.contains('visible')).toBe(true);
        });
        
        it('should load collaborators', async () => {
            await modal.show();
            expect(mockSharingManager.getCollaborators).toHaveBeenCalled();
        });
        
        it('should check share capability', async () => {
            await modal.show();
            expect(mockSharingManager.canShare).toHaveBeenCalled();
        });
    });
    
    describe('hide()', () => {
        beforeEach(async () => {
            await modal.show();
            await new Promise(r => setTimeout(r, 20));
        });
        
        it('should remove visible class', () => {
            modal.hide();
            expect(modal.overlay.classList.contains('visible')).toBe(false);
        });
        
        it('should remove from DOM after animation', async () => {
            modal.hide();
            await new Promise(r => setTimeout(r, 250));
            expect(document.body.contains(modal.overlay)).toBe(false);
        });
    });
    
    describe('Modal Structure', () => {
        beforeEach(async () => {
            await modal.show();
        });
        
        it('should have header with title', () => {
            const title = modal.modal.querySelector('.share-modal-title');
            expect(title).toBeDefined();
            expect(title.textContent).toContain('Test Presentation');
        });
        
        it('should have close button', () => {
            const closeBtn = modal.modal.querySelector('.share-modal-close');
            expect(closeBtn).toBeDefined();
        });
        
        it('should have invite section', () => {
            const inviteSection = modal.modal.querySelector('.share-modal-invite');
            expect(inviteSection).toBeDefined();
        });
        
        it('should have collaborators section', () => {
            const collabSection = modal.modal.querySelector('.share-modal-collaborators');
            expect(collabSection).toBeDefined();
        });
        
        it('should have link section', () => {
            const linkSection = modal.modal.querySelector('.share-modal-link-section');
            expect(linkSection).toBeDefined();
        });
        
        it('should have invite input', () => {
            expect(modal.inviteInput).toBeDefined();
        });
        
        it('should have permission dropdown', () => {
            expect(modal.permissionDropdown).toBeDefined();
        });
    });
    
    describe('Keyboard Navigation', () => {
        beforeEach(async () => {
            await modal.show();
            await new Promise(r => setTimeout(r, 20));
        });
        
        it('should close on Escape key', () => {
            const event = new KeyboardEvent('keydown', { key: 'Escape' });
            document.dispatchEvent(event);
            expect(modal.overlay.classList.contains('visible')).toBe(false);
        });
    });
    
    describe('Close Button', () => {
        beforeEach(async () => {
            await modal.show();
            await new Promise(r => setTimeout(r, 20));
        });
        
        it('should close modal when clicking close button', () => {
            const closeBtn = modal.modal.querySelector('.share-modal-close');
            closeBtn?.click();
            expect(modal.overlay.classList.contains('visible')).toBe(false);
        });
    });
    
    describe('Overlay Click', () => {
        beforeEach(async () => {
            await modal.show();
            await new Promise(r => setTimeout(r, 20));
        });
        
        it('should close when clicking overlay', () => {
            modal.overlay.dispatchEvent(new MouseEvent('click', { bubbles: true }));
            expect(modal.overlay.classList.contains('visible')).toBe(false);
        });
        
        it('should not close when clicking modal content', () => {
            const event = new MouseEvent('click', { bubbles: true });
            modal.modal.dispatchEvent(event);
            // Event shouldn't propagate to trigger close
            expect(modal.overlay.classList.contains('visible')).toBe(true);
        });
    });
    
    describe('Invite Functionality', () => {
        beforeEach(async () => {
            await modal.show();
        });
        
        it('should have invite button', () => {
            expect(modal.inviteButton).toBeDefined();
            expect(modal.inviteButton.element.querySelector('.btn__label').textContent).toBe('Invite');
        });
        
        it('should disable button when cannot share', async () => {
            mockSharingManager.canShare.mockResolvedValue(false);
            modal.destroy();
            
            modal = new ShareModal({
                fileId: 'test-123',
                provider: 'onedrive',
                sharingManager: mockSharingManager
            });
            await modal.show();
            
            expect(modal.inviteButton.element.disabled).toBe(true);
        });
    });
    
    describe('Error Handling', () => {
        it('should handle collaborators load failure', async () => {
            mockSharingManager.getCollaborators.mockRejectedValue(new Error('Network error'));
            await modal.show();
            
            const errorState = modal.collaboratorsContainer.querySelector('.share-modal-error-state');
            expect(errorState).toBeDefined();
        });
    });
    
    describe('destroy()', () => {
        it('should hide modal', async () => {
            await modal.show();
            modal.destroy();
            // After hide animation would complete
            await new Promise(r => setTimeout(r, 250));
            expect(document.body.contains(modal.overlay)).toBe(false);
        });
        
        it('should clean up components', async () => {
            await modal.show();
            modal.destroy();
            // After cleanup timeout
            await new Promise(r => setTimeout(r, 250));
            expect(modal.inviteInput).toBeNull();
            expect(modal.permissionDropdown).toBeNull();
        });
    });
    
    describe('Accessibility', () => {
        beforeEach(async () => {
            await modal.show();
        });
        
        it('should have dialog role', () => {
            expect(modal.modal.getAttribute('role')).toBe('dialog');
        });
        
        it('should have aria-modal', () => {
            expect(modal.modal.getAttribute('aria-modal')).toBe('true');
        });
        
        it('should have aria-labelledby', () => {
            expect(modal.modal.getAttribute('aria-labelledby')).toBe('share-modal-title');
        });
    });
});
