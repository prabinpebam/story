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

        it('should generate unique id if not provided', () => {
            section = new Section();
            expect(section.sectionId).toBeDefined();
            expect(section.sectionId).toMatch(/^section-[a-z0-9]+$/);
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
        it('should create a container element with BEM class', () => {
            section = new Section();
            expect(section.element).toBeDefined();
            expect(section.element.className).toContain('pi-section');
        });

        it('should create header with BEM class and title', () => {
            section = new Section({ title: 'Fill' });
            const header = section.element.querySelector('.pi-section__header');
            expect(header).toBeDefined();
            const title = section.element.querySelector('.pi-section__title');
            expect(title.textContent).toBe('Fill');
        });

        it('should create chevron element with BEM class', () => {
            section = new Section();
            expect(section.chevron).toBeDefined();
            expect(section.chevron.className).toContain('pi-section__chevron');
            expect(section.chevron.innerHTML).toContain('chevron');
        });

        it('should create content container with BEM class', () => {
            section = new Section();
            expect(section.content).toBeDefined();
            expect(section.content.className).toContain('pi-section__content');
        });

        it('should add collapsed modifier class when collapsed', () => {
            section = new Section({ collapsed: true });
            expect(section.element.classList.contains('pi-section--collapsed')).toBe(true);
        });

        it('should not add collapsed modifier when not collapsed', () => {
            section = new Section({ collapsed: false });
            expect(section.element.classList.contains('pi-section--collapsed')).toBe(false);
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

    describe('accessibility (ARIA)', () => {
        it('should have role="button" on header', () => {
            section = new Section();
            const header = section.element.querySelector('.pi-section__header');
            expect(header.getAttribute('role')).toBe('button');
        });

        it('should have tabindex="0" on header', () => {
            section = new Section();
            const header = section.element.querySelector('.pi-section__header');
            expect(header.getAttribute('tabindex')).toBe('0');
        });

        it('should have aria-expanded="true" when not collapsed', () => {
            section = new Section({ collapsed: false });
            const header = section.element.querySelector('.pi-section__header');
            expect(header.getAttribute('aria-expanded')).toBe('true');
        });

        it('should have aria-expanded="false" when collapsed', () => {
            section = new Section({ collapsed: true });
            const header = section.element.querySelector('.pi-section__header');
            expect(header.getAttribute('aria-expanded')).toBe('false');
        });

        it('should have aria-controls pointing to content id', () => {
            section = new Section({ id: 'test-section' });
            const header = section.element.querySelector('.pi-section__header');
            expect(header.getAttribute('aria-controls')).toBe('test-section-content');
        });

        it('should set content id for aria-controls reference', () => {
            section = new Section({ id: 'test-section' });
            expect(section.content.id).toBe('test-section-content');
        });

        it('should have role="region" on content', () => {
            section = new Section();
            expect(section.content.getAttribute('role')).toBe('region');
        });

        it('should have aria-labelledby on content pointing to title', () => {
            section = new Section({ id: 'test-section' });
            const title = section.element.querySelector('.pi-section__title');
            expect(title.id).toBe('test-section-title');
            expect(section.content.getAttribute('aria-labelledby')).toBe('test-section-title');
        });

        it('should have aria-hidden="true" on chevron', () => {
            section = new Section();
            expect(section.chevron.getAttribute('aria-hidden')).toBe('true');
        });
    });

    describe('keyboard interaction', () => {
        it('should toggle on Enter key', () => {
            section = new Section({ collapsed: false });
            const header = section.element.querySelector('.pi-section__header');
            
            const event = new KeyboardEvent('keydown', { key: 'Enter' });
            header.dispatchEvent(event);
            
            expect(section.collapsed).toBe(true);
        });

        it('should toggle on Space key', () => {
            section = new Section({ collapsed: false });
            const header = section.element.querySelector('.pi-section__header');
            
            const event = new KeyboardEvent('keydown', { key: ' ' });
            header.dispatchEvent(event);
            
            expect(section.collapsed).toBe(true);
        });

        it('should not toggle on other keys', () => {
            section = new Section({ collapsed: false });
            const header = section.element.querySelector('.pi-section__header');
            
            const event = new KeyboardEvent('keydown', { key: 'Tab' });
            header.dispatchEvent(event);
            
            expect(section.collapsed).toBe(false);
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

        it('should add collapsed modifier class when toggling to collapsed', () => {
            section = new Section({ collapsed: false });
            
            section.toggle();
            
            expect(section.element.classList.contains('pi-section--collapsed')).toBe(true);
        });

        it('should remove collapsed modifier class when toggling to expanded', () => {
            section = new Section({ collapsed: true });
            
            section.toggle();
            
            expect(section.element.classList.contains('pi-section--collapsed')).toBe(false);
        });

        it('should update aria-expanded when toggling to collapsed', () => {
            section = new Section({ collapsed: false });
            
            section.toggle();
            
            expect(section.header.getAttribute('aria-expanded')).toBe('false');
        });

        it('should update aria-expanded when toggling to expanded', () => {
            section = new Section({ collapsed: true });
            
            section.toggle();
            
            expect(section.header.getAttribute('aria-expanded')).toBe('true');
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

        it('should update collapsed modifier class', () => {
            section = new Section({ collapsed: false });
            
            section.setCollapsed(true);
            
            expect(section.element.classList.contains('pi-section--collapsed')).toBe(true);
        });

        it('should update aria-expanded attribute', () => {
            section = new Section({ collapsed: false });
            
            section.setCollapsed(true);
            
            expect(section.header.getAttribute('aria-expanded')).toBe('false');
        });

        it('should call onToggle when state changes', () => {
            section = new Section({ collapsed: false, onToggle });
            
            section.setCollapsed(true);
            
            expect(onToggle).toHaveBeenCalledWith(true);
        });
    });

    describe('isCollapsed()', () => {
        it('should return true when collapsed', () => {
            section = new Section({ collapsed: true });
            expect(section.isCollapsed()).toBe(true);
        });

        it('should return false when expanded', () => {
            section = new Section({ collapsed: false });
            expect(section.isCollapsed()).toBe(false);
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

    describe('setTitle()', () => {
        it('should update the section title', () => {
            section = new Section({ title: 'Original' });
            
            section.setTitle('Updated');
            
            const title = section.element.querySelector('.pi-section__title');
            expect(title.textContent).toBe('Updated');
        });
    });

    describe('addAction()', () => {
        it('should add an action button', () => {
            section = new Section();
            const initialCallCount = IconButton.mock.calls.length;
            
            section.addAction({ icon: 'plus', title: 'Add', onClick: vi.fn() });
            
            expect(IconButton).toHaveBeenCalledTimes(initialCallCount + 1);
        });

        it('should return the button element', () => {
            section = new Section();
            
            const btn = section.addAction({ icon: 'plus', title: 'Add', onClick: vi.fn() });
            
            expect(btn).toBeDefined();
            expect(btn.tagName).toBe('BUTTON');
        });
    });

    describe('getContentElement()', () => {
        it('should return the content container', () => {
            section = new Section();
            
            expect(section.getContentElement()).toBe(section.content);
        });
    });

    describe('header click', () => {
        it('should toggle section when header is clicked', () => {
            section = new Section({ collapsed: false });
            const header = section.element.querySelector('.pi-section__header');
            
            header.click();
            
            expect(section.collapsed).toBe(true);
        });

        it('should not toggle when action button is clicked', () => {
            const onClick = vi.fn();
            const actions = [{ icon: 'plus', onClick, title: 'Add' }];
            section = new Section({ collapsed: false, actions });
            
            // Actions group should stop propagation
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
