/**
 * MenuItem Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { MenuItem } from '../../../src/ui/components/AppMenu/MenuItem.js';

describe('MenuItem', () => {
    describe('Creation', () => {
        it('should create menu item element', () => {
            const item = new MenuItem({
                id: 'test',
                label: 'Test Item'
            });
            
            expect(item.element).toBeTruthy();
            expect(item.element.className).toContain('app-menu-item');
        });

        it('should display label', () => {
            const item = new MenuItem({
                id: 'test',
                label: 'Test Label'
            });
            
            const label = item.element.querySelector('.app-menu-item-label');
            expect(label.textContent).toBe('Test Label');
        });

        it('should display shortcut', () => {
            const item = new MenuItem({
                id: 'test',
                label: 'Test',
                shortcut: 'Ctrl+S'
            });
            
            const shortcut = item.element.querySelector('.app-menu-item-shortcut');
            expect(shortcut).toBeTruthy();
        });

        it('should display icon', () => {
            const item = new MenuItem({
                id: 'test',
                label: 'Test',
                icon: 'fa-solid fa-save'
            });
            
            const icon = item.element.querySelector('.app-menu-item-icon i');
            expect(icon).toBeTruthy();
        });

        it('should show submenu arrow for items with submenu', () => {
            const item = new MenuItem({
                id: 'test',
                label: 'Test',
                submenu: [{ id: 'sub', label: 'Sub' }]
            });
            
            const arrow = item.element.querySelector('.app-menu-item-arrow');
            expect(arrow).toBeTruthy();
        });
    });

    describe('Disabled State', () => {
        it('should add disabled class', () => {
            const item = new MenuItem({
                id: 'test',
                label: 'Test',
                disabled: true
            });
            
            expect(item.element.className).toContain('disabled');
        });

        it('should set aria-disabled', () => {
            const item = new MenuItem({
                id: 'test',
                label: 'Test',
                disabled: true
            });
            
            expect(item.element.getAttribute('aria-disabled')).toBe('true');
        });

        it('should not call action when disabled', () => {
            const onAction = vi.fn();
            const item = new MenuItem({
                id: 'test',
                label: 'Test',
                disabled: true,
                onAction
            });
            
            item.activate();
            
            expect(onAction).not.toHaveBeenCalled();
        });
    });

    describe('Checked State', () => {
        it('should add checked class', () => {
            const item = new MenuItem({
                id: 'test',
                label: 'Test',
                checked: true
            });
            
            expect(item.element.className).toContain('checked');
        });

        it('should show checkmark icon', () => {
            const item = new MenuItem({
                id: 'test',
                label: 'Test',
                checked: true
            });
            
            const icon = item.element.querySelector('.app-menu-item-icon i.fa-check');
            expect(icon).toBeTruthy();
        });
    });

    describe('Actions', () => {
        it('should call onAction when activated', () => {
            const onAction = vi.fn();
            const item = new MenuItem({
                id: 'test-action',
                label: 'Test',
                onAction
            });
            
            item.activate();
            
            expect(onAction).toHaveBeenCalledWith('test-action');
        });

        it('should call onAction on click', () => {
            const onAction = vi.fn();
            const item = new MenuItem({
                id: 'test-click',
                label: 'Test',
                onAction
            });
            
            item.element.click();
            
            expect(onAction).toHaveBeenCalledWith('test-click');
        });
    });

    describe('Focus', () => {
        it('should add focused class on focus event', () => {
            const item = new MenuItem({
                id: 'test',
                label: 'Test'
            });
            
            // Append to document so focus events work
            document.body.appendChild(item.element);
            
            // Dispatch focus event
            item.element.dispatchEvent(new FocusEvent('focus'));
            
            expect(item.element.className).toContain('focused');
            
            // Cleanup
            item.element.remove();
        });

        it('should remove focused class on blur event', () => {
            const item = new MenuItem({
                id: 'test',
                label: 'Test'
            });
            
            // Append to document so focus events work
            document.body.appendChild(item.element);
            
            // Dispatch focus then blur
            item.element.dispatchEvent(new FocusEvent('focus'));
            item.element.dispatchEvent(new FocusEvent('blur'));
            
            expect(item.element.className).not.toContain('focused');
            
            // Cleanup
            item.element.remove();
        });
    });

    describe('Accessibility', () => {
        it('should have menuitem role', () => {
            const item = new MenuItem({
                id: 'test',
                label: 'Test'
            });
            
            expect(item.element.getAttribute('role')).toBe('menuitem');
        });

        it('should have tabindex', () => {
            const item = new MenuItem({
                id: 'test',
                label: 'Test'
            });
            
            expect(item.element.getAttribute('tabindex')).toBe('-1');
        });

        it('should have aria-haspopup for items with submenu', () => {
            const item = new MenuItem({
                id: 'test',
                label: 'Test',
                submenu: [{ id: 'sub', label: 'Sub' }]
            });
            
            expect(item.element.getAttribute('aria-haspopup')).toBe('true');
        });
    });

    describe('Shortcut Formatting', () => {
        it('should format Ctrl correctly', () => {
            const item = new MenuItem({
                id: 'test',
                label: 'Test',
                shortcut: 'Ctrl+S'
            });
            
            const shortcut = item.element.querySelector('.app-menu-item-shortcut');
            // On non-Mac, should show Ctrl
            expect(shortcut.textContent).toContain('Ctrl');
        });
    });
});
