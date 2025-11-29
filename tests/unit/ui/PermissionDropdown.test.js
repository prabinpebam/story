/**
 * PermissionDropdown Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PermissionDropdown } from '../../../src/ui/sharing/PermissionDropdown.js';
import { SharingRoles } from '../../../src/core/storage/sharing/SharingConstants.js';

describe('PermissionDropdown', () => {
    let dropdown;
    
    beforeEach(() => {
        document.body.innerHTML = '';
        dropdown = new PermissionDropdown({
            value: SharingRoles.VIEWER
        });
        document.body.appendChild(dropdown.element);
    });
    
    afterEach(() => {
        dropdown?.destroy();
    });
    
    describe('Initialization', () => {
        it('should create dropdown element', () => {
            expect(dropdown.element).toBeDefined();
            expect(dropdown.element.classList.contains('permission-dropdown')).toBe(true);
        });
        
        it('should display initial value', () => {
            expect(dropdown.getValue()).toBe(SharingRoles.VIEWER);
        });
        
        it('should be closed initially', () => {
            expect(dropdown.isOpen).toBe(false);
            expect(dropdown.element.classList.contains('open')).toBe(false);
        });
        
        it('should show trigger button with label', () => {
            const trigger = dropdown.element.querySelector('.permission-dropdown-trigger');
            expect(trigger.textContent).toContain('Viewer');
        });
    });
    
    describe('Role Options', () => {
        it('should have viewer, commenter, editor by default', () => {
            dropdown.trigger.click();
            const items = dropdown.element.querySelectorAll('.permission-dropdown-item');
            expect(items.length).toBe(3);
        });
        
        it('should include owner when showOwner is true', () => {
            dropdown.destroy();
            dropdown = new PermissionDropdown({
                value: SharingRoles.VIEWER,
                showOwner: true
            });
            document.body.appendChild(dropdown.element);
            
            dropdown.trigger.click();
            const items = dropdown.element.querySelectorAll('.permission-dropdown-item');
            expect(items.length).toBe(4);
        });
    });
    
    describe('Opening/Closing', () => {
        it('should open on trigger click', () => {
            dropdown.trigger.click();
            expect(dropdown.isOpen).toBe(true);
            expect(dropdown.menu.classList.contains('open')).toBe(true);
        });
        
        it('should close on second trigger click', () => {
            dropdown.trigger.click();
            dropdown.trigger.click();
            expect(dropdown.isOpen).toBe(false);
        });
        
        it('should close on outside click', () => {
            dropdown.trigger.click();
            document.body.click();
            expect(dropdown.isOpen).toBe(false);
        });
        
        it('should close on Escape key', () => {
            dropdown.trigger.click();
            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
            expect(dropdown.isOpen).toBe(false);
        });
    });
    
    describe('Selection', () => {
        beforeEach(() => {
            dropdown.trigger.click();
        });
        
        it('should select role on click', () => {
            const editorItem = dropdown.element.querySelector('[data-role="editor"]');
            editorItem?.click();
            expect(dropdown.getValue()).toBe(SharingRoles.EDITOR);
        });
        
        it('should close after selection', () => {
            const editorItem = dropdown.element.querySelector('[data-role="editor"]');
            editorItem?.click();
            expect(dropdown.isOpen).toBe(false);
        });
        
        it('should update trigger label after selection', () => {
            const editorItem = dropdown.element.querySelector('[data-role="editor"]');
            editorItem?.click();
            expect(dropdown.trigger.textContent).toContain('Editor');
        });
        
        it('should mark selected item', () => {
            const editorItem = dropdown.element.querySelector('[data-role="editor"]');
            editorItem?.click();
            dropdown.trigger.click();
            
            const selectedItem = dropdown.element.querySelector('[data-role="editor"]');
            expect(selectedItem.classList.contains('selected')).toBe(true);
        });
    });
    
    describe('onChange Callback', () => {
        it('should call onChange when role changes', () => {
            const onChange = vi.fn();
            dropdown.destroy();
            dropdown = new PermissionDropdown({
                value: SharingRoles.VIEWER,
                onChange
            });
            document.body.appendChild(dropdown.element);
            
            dropdown.trigger.click();
            const editorItem = dropdown.element.querySelector('[data-role="editor"]');
            editorItem?.click();
            
            expect(onChange).toHaveBeenCalledWith(SharingRoles.EDITOR, SharingRoles.VIEWER);
        });
        
        it('should not call onChange when selecting same role', () => {
            const onChange = vi.fn();
            dropdown.destroy();
            dropdown = new PermissionDropdown({
                value: SharingRoles.VIEWER,
                onChange
            });
            document.body.appendChild(dropdown.element);
            
            dropdown.trigger.click();
            const viewerItem = dropdown.element.querySelector('[data-role="viewer"]');
            viewerItem?.click();
            
            expect(onChange).not.toHaveBeenCalled();
        });
    });
    
    describe('setValue()', () => {
        it('should update value programmatically', () => {
            dropdown.setValue(SharingRoles.EDITOR);
            expect(dropdown.getValue()).toBe(SharingRoles.EDITOR);
        });
        
        it('should update trigger label', () => {
            dropdown.setValue(SharingRoles.COMMENTER);
            expect(dropdown.trigger.textContent).toContain('Commenter');
        });
    });
    
    describe('disable()/enable()', () => {
        it('should disable dropdown', () => {
            dropdown.disable();
            expect(dropdown.isDisabled).toBe(true);
            expect(dropdown.trigger.disabled).toBe(true);
            expect(dropdown.element.classList.contains('disabled')).toBe(true);
        });
        
        it('should not open when disabled', () => {
            dropdown.disable();
            dropdown.trigger.click();
            expect(dropdown.isOpen).toBe(false);
        });
        
        it('should enable dropdown', () => {
            dropdown.disable();
            dropdown.enable();
            expect(dropdown.isDisabled).toBe(false);
            expect(dropdown.trigger.disabled).toBe(false);
        });
    });
    
    describe('Disabled State', () => {
        it('should initialize as disabled', () => {
            dropdown.destroy();
            dropdown = new PermissionDropdown({
                value: SharingRoles.VIEWER,
                disabled: true
            });
            document.body.appendChild(dropdown.element);
            
            expect(dropdown.isDisabled).toBe(true);
            expect(dropdown.element.classList.contains('disabled')).toBe(true);
        });
    });
    
    describe('Role Icons', () => {
        it('should show eye icon for viewer', () => {
            const icon = dropdown.trigger.querySelector('i');
            expect(icon.classList.contains('fa-eye')).toBe(true);
        });
        
        it('should show pen icon for editor', () => {
            dropdown.setValue(SharingRoles.EDITOR);
            const icon = dropdown.trigger.querySelector('i');
            expect(icon.classList.contains('fa-pen')).toBe(true);
        });
        
        it('should show comment icon for commenter', () => {
            dropdown.setValue(SharingRoles.COMMENTER);
            const icon = dropdown.trigger.querySelector('i');
            expect(icon.classList.contains('fa-comment')).toBe(true);
        });
    });
    
    describe('Role Descriptions', () => {
        it('should show description for each role', () => {
            dropdown.trigger.click();
            const descriptions = dropdown.element.querySelectorAll('.permission-dropdown-item-description');
            expect(descriptions.length).toBeGreaterThan(0);
        });
    });
    
    describe('destroy()', () => {
        it('should remove element from DOM', () => {
            dropdown.destroy();
            expect(document.body.contains(dropdown.element)).toBe(false);
        });
        
        it('should clean up document listeners', () => {
            const removeSpy = vi.spyOn(document, 'removeEventListener');
            dropdown.destroy();
            expect(removeSpy).toHaveBeenCalled();
            removeSpy.mockRestore();
        });
    });
});
