/**
 * @fileoverview Unit tests for PropertyRow component
 * 
 * Test ID Prefix: ROW
 * Spec Reference: documentation/01-specs/ui-system/property-inspector-v2/
 * 
 * PropertyRow is a reusable row component for Fill, Stroke, and Effects sections.
 * It provides: drag handle, content slot, visibility toggle, and delete button.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PropertyRow } from '../../../../src/ui/components/PropertyRow.js';

// Helper: Create a mock drag event since DragEvent is not available in JSDOM
function createMockDragEvent(type, options = {}) {
    const event = new Event(type, { bubbles: true, cancelable: true });
    event.dataTransfer = {
        data: {},
        setData(key, value) { this.data[key] = value; },
        getData(key) { return this.data[key]; },
        effectAllowed: 'move',
        dropEffect: 'move'
    };
    event.clientY = options.clientY || 0;
    return event;
}

describe('PropertyRow', () => {
    let row;
    
    beforeEach(() => {
        // Reset DOM
        document.body.innerHTML = '';
    });
    
    afterEach(() => {
        if (row) {
            row.destroy();
            row = null;
        }
    });
    
    describe('constructor', () => {
        it('ROW-001: should create an instance with default options', () => {
            row = new PropertyRow();
            expect(row).toBeInstanceOf(PropertyRow);
            expect(row.element).toBeDefined();
        });
        
        it('ROW-002: should create element with pi-property-row class', () => {
            row = new PropertyRow();
            expect(row.element.classList.contains('pi-property-row')).toBe(true);
        });
        
        it('ROW-003: should create drag handle by default', () => {
            row = new PropertyRow();
            const handle = row.element.querySelector('.pi-property-row__handle');
            expect(handle).toBeDefined();
            expect(handle.getAttribute('draggable')).toBe('true');
        });
        
        it('ROW-004: should not create drag handle when draggable: false', () => {
            row = new PropertyRow({ draggable: false });
            const handle = row.element.querySelector('.pi-property-row__handle');
            expect(handle).toBeNull();
        });
        
        it('ROW-005: should create content slot', () => {
            row = new PropertyRow();
            const content = row.element.querySelector('.pi-property-row__content');
            expect(content).toBeDefined();
        });
        
        it('ROW-006: should create visibility button by default', () => {
            row = new PropertyRow();
            const visibilityBtn = row.element.querySelector('.pi-property-row__visibility');
            expect(visibilityBtn).toBeDefined();
        });
        
        it('ROW-007: should not create visibility button when showVisibility: false', () => {
            row = new PropertyRow({ showVisibility: false });
            const visibilityBtn = row.element.querySelector('.pi-property-row__visibility');
            expect(visibilityBtn).toBeNull();
        });
        
        it('ROW-008: should create delete button by default', () => {
            row = new PropertyRow();
            const deleteBtn = row.element.querySelector('.pi-property-row__delete');
            expect(deleteBtn).toBeDefined();
        });
        
        it('ROW-009: should not create delete button when showDelete: false', () => {
            row = new PropertyRow({ showDelete: false });
            const deleteBtn = row.element.querySelector('.pi-property-row__delete');
            expect(deleteBtn).toBeNull();
        });
        
        it('ROW-010: should apply data-index attribute when provided', () => {
            row = new PropertyRow({ index: 3 });
            expect(row.element.getAttribute('data-index')).toBe('3');
        });
    });
    
    describe('appendChild', () => {
        it('ROW-011: should add child element to content slot', () => {
            row = new PropertyRow();
            const child = document.createElement('div');
            child.className = 'test-child';
            
            row.appendChild(child);
            
            const content = row.element.querySelector('.pi-property-row__content');
            expect(content.querySelector('.test-child')).toBe(child);
        });
        
        it('ROW-012: should support adding multiple children', () => {
            row = new PropertyRow();
            const child1 = document.createElement('div');
            const child2 = document.createElement('span');
            
            row.appendChild(child1);
            row.appendChild(child2);
            
            const content = row.element.querySelector('.pi-property-row__content');
            expect(content.children.length).toBe(2);
        });
    });
    
    describe('setVisible', () => {
        it('ROW-013: should add invisible class when setVisible(false)', () => {
            row = new PropertyRow();
            row.setVisible(false);
            expect(row.element.classList.contains('invisible')).toBe(true);
        });
        
        it('ROW-014: should remove invisible class when setVisible(true)', () => {
            row = new PropertyRow();
            row.setVisible(false);
            row.setVisible(true);
            expect(row.element.classList.contains('invisible')).toBe(false);
        });
        
        it('ROW-015: should update isVisible property', () => {
            row = new PropertyRow();
            expect(row.isVisible).toBe(true);
            row.setVisible(false);
            expect(row.isVisible).toBe(false);
        });
        
        it('ROW-016: should update visibility button icon', () => {
            row = new PropertyRow();
            const visibilityBtn = row.element.querySelector('.pi-property-row__visibility');
            
            row.setVisible(false);
            expect(visibilityBtn.getAttribute('aria-label')).toBe('Show');
            
            row.setVisible(true);
            expect(visibilityBtn.getAttribute('aria-label')).toBe('Hide');
        });
    });
    
    describe('setActive', () => {
        it('ROW-017: should add active class when setActive(true)', () => {
            row = new PropertyRow();
            row.setActive(true);
            expect(row.element.classList.contains('active')).toBe(true);
        });
        
        it('ROW-018: should remove active class when setActive(false)', () => {
            row = new PropertyRow();
            row.setActive(true);
            row.setActive(false);
            expect(row.element.classList.contains('active')).toBe(false);
        });
        
        it('ROW-019: should update isActive property', () => {
            row = new PropertyRow();
            expect(row.isActive).toBe(false);
            row.setActive(true);
            expect(row.isActive).toBe(true);
        });
    });
    
    describe('callbacks', () => {
        it('ROW-020: should call onVisibilityToggle when visibility button clicked', () => {
            const callback = vi.fn();
            row = new PropertyRow({ onVisibilityToggle: callback });
            
            const visibilityBtn = row.element.querySelector('.pi-property-row__visibility');
            visibilityBtn.click();
            
            expect(callback).toHaveBeenCalledTimes(1);
        });
        
        it('ROW-021: should call onDelete when delete button clicked', () => {
            const callback = vi.fn();
            row = new PropertyRow({ onDelete: callback });
            
            const deleteBtn = row.element.querySelector('.pi-property-row__delete');
            deleteBtn.click();
            
            expect(callback).toHaveBeenCalledTimes(1);
        });
        
        it('ROW-022: should call onClick when row clicked', () => {
            const callback = vi.fn();
            row = new PropertyRow({ onClick: callback });
            
            row.element.click();
            
            expect(callback).toHaveBeenCalledTimes(1);
        });
    });
    
    describe('drag and drop', () => {
        it('ROW-023: should set element as draggable', () => {
            row = new PropertyRow();
            expect(row.element.getAttribute('draggable')).toBe('true');
        });
        
        it('ROW-024: should not be draggable when draggable: false', () => {
            row = new PropertyRow({ draggable: false });
            expect(row.element.getAttribute('draggable')).toBeNull();
        });
        
        it('ROW-025: should add dragging class on dragstart', () => {
            row = new PropertyRow();
            
            const event = createMockDragEvent('dragstart');
            row.element.dispatchEvent(event);
            
            expect(row.element.classList.contains('dragging')).toBe(true);
        });
        
        it('ROW-026: should remove dragging class on dragend', () => {
            row = new PropertyRow();
            
            // Start drag
            const startEvent = createMockDragEvent('dragstart');
            row.element.dispatchEvent(startEvent);
            
            // End drag
            const endEvent = createMockDragEvent('dragend');
            row.element.dispatchEvent(endEvent);
            
            expect(row.element.classList.contains('dragging')).toBe(false);
        });
        
        it('ROW-027: should add drag-over-top class for upper half drop', () => {
            row = new PropertyRow();
            document.body.appendChild(row.element);
            
            // Mock getBoundingClientRect
            row.element.getBoundingClientRect = () => ({
                top: 0,
                bottom: 40,
                height: 40
            });
            
            const event = createMockDragEvent('dragover', { clientY: 5 }); // Near top
            row.element.dispatchEvent(event);
            
            expect(row.element.classList.contains('drag-over-top')).toBe(true);
            expect(row.element.classList.contains('drag-over-bottom')).toBe(false);
        });
        
        it('ROW-028: should add drag-over-bottom class for lower half drop', () => {
            row = new PropertyRow();
            document.body.appendChild(row.element);
            
            // Mock getBoundingClientRect
            row.element.getBoundingClientRect = () => ({
                top: 0,
                bottom: 40,
                height: 40
            });
            
            const event = createMockDragEvent('dragover', { clientY: 35 }); // Near bottom
            row.element.dispatchEvent(event);
            
            expect(row.element.classList.contains('drag-over-bottom')).toBe(true);
            expect(row.element.classList.contains('drag-over-top')).toBe(false);
        });
        
        it('ROW-029: should remove drag-over classes on dragleave', () => {
            row = new PropertyRow();
            
            row.element.classList.add('drag-over-top');
            
            const event = createMockDragEvent('dragleave');
            row.element.dispatchEvent(event);
            
            expect(row.element.classList.contains('drag-over-top')).toBe(false);
            expect(row.element.classList.contains('drag-over-bottom')).toBe(false);
        });
        
        it('ROW-030: should call onDrop callback on drop event', () => {
            const callback = vi.fn();
            row = new PropertyRow({ onDrop: callback });
            
            row.element.classList.add('drag-over-top');
            
            const event = createMockDragEvent('drop');
            row.element.dispatchEvent(event);
            
            expect(callback).toHaveBeenCalledWith(expect.objectContaining({
                position: 'before'
            }));
        });
    });
    
    describe('destroy', () => {
        it('ROW-031: should remove element from DOM', () => {
            row = new PropertyRow();
            document.body.appendChild(row.element);
            
            expect(document.body.contains(row.element)).toBe(true);
            
            row.destroy();
            
            expect(document.body.contains(row.element)).toBe(false);
        });
        
        it('ROW-032: should handle destroy when element not in DOM', () => {
            row = new PropertyRow();
            
            // Should not throw
            expect(() => row.destroy()).not.toThrow();
        });
    });
    
    describe('getElement', () => {
        it('ROW-033: should return the row element', () => {
            row = new PropertyRow();
            expect(row.getElement()).toBe(row.element);
        });
    });
    
    describe('integration', () => {
        it('ROW-034: should work with all options combined', () => {
            const onVisibilityToggle = vi.fn();
            const onDelete = vi.fn();
            const onClick = vi.fn();
            
            row = new PropertyRow({
                draggable: true,
                showVisibility: true,
                showDelete: true,
                index: 2,
                onVisibilityToggle,
                onDelete,
                onClick
            });
            
            // Verify structure
            expect(row.element.querySelector('.pi-property-row__handle')).toBeDefined();
            expect(row.element.querySelector('.pi-property-row__content')).toBeDefined();
            expect(row.element.querySelector('.pi-property-row__visibility')).toBeDefined();
            expect(row.element.querySelector('.pi-property-row__delete')).toBeDefined();
            expect(row.element.getAttribute('data-index')).toBe('2');
            
            // Test interactivity
            row.element.click();
            expect(onClick).toHaveBeenCalled();
        });
        
        it('ROW-035: should work with minimal options', () => {
            row = new PropertyRow({
                draggable: false,
                showVisibility: false,
                showDelete: false
            });
            
            // Only content slot should exist
            expect(row.element.querySelector('.pi-property-row__handle')).toBeNull();
            expect(row.element.querySelector('.pi-property-row__content')).toBeDefined();
            expect(row.element.querySelector('.pi-property-row__visibility')).toBeNull();
            expect(row.element.querySelector('.pi-property-row__delete')).toBeNull();
        });
    });
});
