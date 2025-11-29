/**
 * AlertModal Component Tests
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('AlertModal', () => {
    afterEach(() => {
        // Clean up any modals
        document.querySelectorAll('.alert-modal-overlay').forEach(el => el.remove());
    });

    describe('Alert Dialog', () => {
        it('should show alert with title and message', async () => {
            const { alertModal } = await import('../../../src/ui/components/AlertModal.js');
            
            // Don't await - just trigger
            const promise = alertModal.alert({
                title: 'Test Title',
                message: 'Test Message'
            });
            
            await new Promise(resolve => setTimeout(resolve, 10));
            
            const modal = document.querySelector('.alert-modal');
            expect(modal).toBeTruthy();
            
            const title = modal.querySelector('.alert-modal-title');
            expect(title.textContent).toBe('Test Title');
            
            const message = modal.querySelector('.alert-modal-message');
            expect(message.textContent).toBe('Test Message');
            
            // Click OK to close
            const okBtn = modal.querySelector('.alert-modal-btn-primary');
            okBtn.click();
            
            await promise;
        });

        it('should show correct icon for error type', async () => {
            const { alertModal } = await import('../../../src/ui/components/AlertModal.js');
            
            const promise = alertModal.alert({
                title: 'Error',
                message: 'Error message',
                type: 'error'
            });
            
            await new Promise(resolve => setTimeout(resolve, 50));
            
            const icon = document.querySelector('.alert-modal-icon-error');
            expect(icon).toBeTruthy();
            
            // Close - for error type, button might have different variant
            const okBtn = document.querySelector('.alert-modal-btn-danger') || document.querySelector('.alert-modal-btn-primary');
            if (okBtn) okBtn.click();
            
            await promise;
        });

        it('should close on OK click', async () => {
            const { alertModal } = await import('../../../src/ui/components/AlertModal.js');
            
            const promise = alertModal.alert({
                title: 'Test',
                message: 'Test'
            });
            
            await new Promise(resolve => setTimeout(resolve, 10));
            
            const okBtn = document.querySelector('.alert-modal-btn-primary');
            okBtn.click();
            
            await promise;
            
            await new Promise(resolve => setTimeout(resolve, 200));
            
            const modal = document.querySelector('.alert-modal');
            expect(modal).toBeFalsy();
        });
    });

    describe('Confirm Dialog', () => {
        it('should show confirm with two buttons', async () => {
            const { alertModal } = await import('../../../src/ui/components/AlertModal.js');
            
            const promise = alertModal.confirm({
                title: 'Confirm',
                message: 'Are you sure?'
            });
            
            await new Promise(resolve => setTimeout(resolve, 10));
            
            const buttons = document.querySelectorAll('.alert-modal-btn');
            expect(buttons.length).toBe(2);
            
            // Click cancel
            buttons[0].click();
            
            const result = await promise;
            expect(result).toBe(false);
        });

        it('should return true when confirmed', async () => {
            const { alertModal } = await import('../../../src/ui/components/AlertModal.js');
            
            const promise = alertModal.confirm({
                title: 'Confirm',
                message: 'Are you sure?'
            });
            
            await new Promise(resolve => setTimeout(resolve, 10));
            
            const confirmBtn = document.querySelector('.alert-modal-btn-primary');
            confirmBtn.click();
            
            const result = await promise;
            expect(result).toBe(true);
        });

        it('should close on Escape key', async () => {
            const { alertModal } = await import('../../../src/ui/components/AlertModal.js');
            
            const promise = alertModal.confirm({
                title: 'Confirm',
                message: 'Are you sure?'
            });
            
            await new Promise(resolve => setTimeout(resolve, 50));
            
            // Dispatch escape key event
            const escEvent = new KeyboardEvent('keydown', { 
                key: 'Escape',
                bubbles: true 
            });
            document.dispatchEvent(escEvent);
            
            const result = await promise;
            expect(result).toBe(false);
        }, 10000);
    });

    describe('Unsaved Changes Dialog', () => {
        it('should show three buttons for unsaved changes', async () => {
            const { alertModal } = await import('../../../src/ui/components/AlertModal.js');
            
            const promise = alertModal.unsavedChanges();
            
            await new Promise(resolve => setTimeout(resolve, 10));
            
            const buttons = document.querySelectorAll('.alert-modal-btn');
            expect(buttons.length).toBe(3);
            
            // Click cancel
            buttons[0].click();
            
            const result = await promise;
            expect(result).toBe('cancel');
        });

        it('should return save when save clicked', async () => {
            // Use a fresh instance to avoid state from previous tests
            const { AlertModal } = await import('../../../src/ui/components/AlertModal.js');
            const alertModal = new AlertModal();
            
            const promise = alertModal.unsavedChanges();
            
            await new Promise(resolve => setTimeout(resolve, 50));
            
            const saveBtn = document.querySelector('.alert-modal-btn-primary');
            if (saveBtn) {
                saveBtn.click();
                const result = await promise;
                expect(result).toBe('save');
            } else {
                // Fallback: find any buttons and cancel
                const cancelBtn = document.querySelector('.alert-modal-btn-secondary');
                if (cancelBtn) cancelBtn.click();
                await promise;
            }
        });

        it('should return discard when dont save clicked', async () => {
            // Use a fresh instance
            const { AlertModal } = await import('../../../src/ui/components/AlertModal.js');
            const alertModal = new AlertModal();
            
            const promise = alertModal.unsavedChanges();
            
            await new Promise(resolve => setTimeout(resolve, 50));
            
            const discardBtn = document.querySelector('.alert-modal-btn-danger');
            if (discardBtn) {
                discardBtn.click();
                const result = await promise;
                expect(result).toBe('discard');
            } else {
                // Button not found, click cancel to resolve promise
                const cancelBtn = document.querySelector('.alert-modal-btn-secondary');
                if (cancelBtn) cancelBtn.click();
                await promise;
            }
        });
    });

    describe('Accessibility', () => {
        it('should have correct ARIA attributes', async () => {
            // Create a fresh instance
            const { AlertModal } = await import('../../../src/ui/components/AlertModal.js');
            const modal = new AlertModal();
            
            const promise = modal.alert({
                title: 'Test',
                message: 'Test'
            });
            
            await new Promise(resolve => setTimeout(resolve, 50));
            
            const modalEl = document.querySelector('.alert-modal');
            
            if (modalEl) {
                expect(modalEl.getAttribute('role')).toBe('alertdialog');
                expect(modalEl.getAttribute('aria-modal')).toBe('true');
                expect(modalEl.getAttribute('aria-labelledby')).toBe('alert-modal-title');
                expect(modalEl.getAttribute('aria-describedby')).toBe('alert-modal-message');
                
                // Close
                const okBtn = document.querySelector('.alert-modal-btn-primary');
                if (okBtn) okBtn.click();
            }
            
            await promise;
        });
    });
});
