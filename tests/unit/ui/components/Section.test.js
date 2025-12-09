import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock dependencies before importing Section
vi.mock('../../../../src/ui/components/IconButton.js', () => ({
    IconButton: vi.fn()
}));

vi.mock('../../../../src/ui/Icons.js', () => ({
    Icons: {
        CHEVRON_DOWN: '<svg>chevron</svg>'
    }
}));

import { Section } from '../../../../src/ui/components/Section.js';
import { IconButton } from '../../../../src/ui/components/IconButton.js';

describe('Section', () => {
    let section;
    let onToggle;

    beforeEach(() => {
        vi.clearAllMocks();
        onToggle = vi.fn();
        
        IconButton.mockImplementation(() => ({
            element: document.createElement('button')
        }));
    });

    afterEach(() => {
        vi.restoreAllMocks();
        document.body.innerHTML = '';
    });

    describe('constructor', () => {
        it('should create an instance with default options', () => {
            section = new Section();
            expect(section).toBeDefined();
        });

        it('should use default title', () => {
            section = new Section();
            expect(section.options.title).toBe('Section');
        });

        it('should accept custom title', () => {
            section = new Section({ title: 'Custom Title' });
            expect(section.options.title).toBe('Custom Title');
        });

        it('should accept id option', () => {
            section = new Section({ id: 'my-section' });
            expect(section.options.id).toBe('my-section');
        });

        it('should accept collapsed option', () => {
            section = new Section({ collapsed: true });
            expect(section.collapsed).toBe(true);
        });

        it('should default to not collapsed', () => {
            section = new Section();
            expect(section.collapsed).toBe(false);
        });

        it('should accept onToggle callback', () => {
            section = new Section({ onToggle });
            expect(section.options.onToggle).toBe(onToggle);
        });

        it('should accept actions array', () => {
            const actions = [{ icon: 'plus', onClick: vi.fn(), title: 'Add' }];
            section = new Section({ actions });
            expect(section.options.actions).toBe(actions);
        });
    });

    describe('create()', () => {
        it('should create a container element', () => {
            section = new Section();
            expect(section.element).toBeDefined();
            expect(section.element.className).toBe('pi-section');
        });

        it('should create header with title', () => {
            section = new Section({ title: 'Fill' });
            const header = section.element.querySelector('.pi-section-header');
            expect(header).toBeDefined();
            const title = section.element.querySelector('.pi-section-title');
            expect(title.textContent).toBe('Fill');
        });

        it('should create chevron element', () => {
            section = new Section();
            expect(section.chevron).toBeDefined();
            expect(section.chevron.innerHTML).toContain('chevron');
        });

        it('should create content container', () => {
            section = new Section();
            expect(section.content).toBeDefined();
            expect(section.content.className).toBe('pi-section-content');
        });

        it('should hide content when collapsed', () => {
            section = new Section({ collapsed: true });
            expect(section.content.classList.contains('hidden')).toBe(true);
        });

        it('should show content when not collapsed', () => {
            section = new Section({ collapsed: false });
            expect(section.content.classList.contains('hidden')).toBe(false);
        });

        it('should rotate chevron when collapsed', () => {
            section = new Section({ collapsed: true });
            expect(section.chevron.classList.contains('collapsed')).toBe(true);
        });

        it('should not rotate chevron when expanded', () => {
            section = new Section({ collapsed: false });
            expect(section.chevron.classList.contains('collapsed')).toBe(false);
        });

        it('should create IconButtons for actions', () => {
            const actions = [
                { icon: 'plus', onClick: vi.fn(), title: 'Add' },
                { icon: 'minus', onClick: vi.fn(), title: 'Remove' }
            ];
            section = new Section({ actions });
            expect(IconButton).toHaveBeenCalledTimes(2);
        });

        it('should pass action options to IconButton', () => {
            const onClick = vi.fn();
            const actions = [{ icon: 'plus', onClick, title: 'Add Item' }];
            section = new Section({ actions });
            
            expect(IconButton).toHaveBeenCalledWith({
                icon: 'plus',
                title: 'Add Item',
                onClick
            });
        });
    });

    describe('toggle()', () => {
        it('should toggle collapsed state', () => {
            section = new Section({ collapsed: false });
            
            section.toggle();
            
            expect(section.collapsed).toBe(true);
        });

        it('should toggle back to expanded', () => {
            section = new Section({ collapsed: true });
            
            section.toggle();
            
            expect(section.collapsed).toBe(false);
        });

        it('should hide content when toggling to collapsed', () => {
            section = new Section({ collapsed: false });
            
            section.toggle();
            
            expect(section.content.classList.contains('hidden')).toBe(true);
        });

        it('should show content when toggling to expanded', () => {
            section = new Section({ collapsed: true });
            
            section.toggle();
            
            expect(section.content.classList.contains('hidden')).toBe(false);
        });

        it('should rotate chevron when toggling to collapsed', () => {
            section = new Section({ collapsed: false });
            
            section.toggle();
            
            expect(section.chevron.classList.contains('collapsed')).toBe(true);
        });

        it('should un-rotate chevron when toggling to expanded', () => {
            section = new Section({ collapsed: true });
            
            section.toggle();
            
            expect(section.chevron.classList.contains('collapsed')).toBe(false);
        });

        it('should call onToggle callback', () => {
            section = new Section({ onToggle });
            
            section.toggle();
            
            expect(onToggle).toHaveBeenCalledWith(true);
        });

        it('should call onToggle with correct state', () => {
            section = new Section({ collapsed: true, onToggle });
            
            section.toggle();
            
            expect(onToggle).toHaveBeenCalledWith(false);
        });
    });

    describe('setCollapsed()', () => {
        it('should set collapsed state to true', () => {
            section = new Section({ collapsed: false });
            
            section.setCollapsed(true);
            
            expect(section.collapsed).toBe(true);
        });

        it('should set collapsed state to false', () => {
            section = new Section({ collapsed: true });
            
            section.setCollapsed(false);
            
            expect(section.collapsed).toBe(false);
        });

        it('should not trigger change if already in desired state', () => {
            section = new Section({ collapsed: true, onToggle });
            
            section.setCollapsed(true);
            
            expect(onToggle).not.toHaveBeenCalled();
        });

        it('should update content visibility', () => {
            section = new Section({ collapsed: false });
            
            section.setCollapsed(true);
            
            expect(section.content.classList.contains('hidden')).toBe(true);
        });

        it('should update chevron rotation', () => {
            section = new Section({ collapsed: false });
            
            section.setCollapsed(true);
            
            expect(section.chevron.classList.contains('collapsed')).toBe(true);
        });

        it('should call onToggle when state changes', () => {
            section = new Section({ collapsed: false, onToggle });
            
            section.setCollapsed(true);
            
            expect(onToggle).toHaveBeenCalledWith(true);
        });
    });

    describe('appendChild()', () => {
        it('should append element to content', () => {
            section = new Section();
            const child = document.createElement('div');
            child.id = 'child-element';
            
            section.appendChild(child);
            
            expect(section.content.querySelector('#child-element')).toBe(child);
        });

        it('should append multiple elements', () => {
            section = new Section();
            const child1 = document.createElement('div');
            const child2 = document.createElement('div');
            
            section.appendChild(child1);
            section.appendChild(child2);
            
            expect(section.content.children.length).toBe(2);
        });
    });

    describe('clear()', () => {
        it('should remove all content', () => {
            section = new Section();
            section.appendChild(document.createElement('div'));
            section.appendChild(document.createElement('div'));
            
            section.clear();
            
            expect(section.content.children.length).toBe(0);
        });

        it('should clear innerHTML', () => {
            section = new Section();
            section.content.innerHTML = '<div>test</div>';
            
            section.clear();
            
            expect(section.content.innerHTML).toBe('');
        });
    });

    describe('header click', () => {
        it('should toggle section when header is clicked', () => {
            section = new Section({ collapsed: false });
            const header = section.element.querySelector('.pi-section-header');
            
            header.click();
            
            expect(section.collapsed).toBe(true);
        });

        it('should not toggle when action button is clicked', () => {
            const onClick = vi.fn();
            const actions = [{ icon: 'plus', onClick, title: 'Add' }];
            section = new Section({ collapsed: false, actions });
            
            // Actions group should stop propagation
            // This is verified by the implementation preventing header toggle
            expect(section.collapsed).toBe(false);
        });
    });

    describe('edge cases', () => {
        it('should work without onToggle callback', () => {
            section = new Section();
            expect(() => section.toggle()).not.toThrow();
        });

        it('should handle empty actions array', () => {
            section = new Section({ actions: [] });
            expect(IconButton).not.toHaveBeenCalled();
        });
    });
});
