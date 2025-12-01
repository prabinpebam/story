import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { IconButton } from '../../../../src/ui/components/IconButton.js';

describe('IconButton', () => {
    let iconButton;
    let onClick;

    beforeEach(() => {
        vi.clearAllMocks();
        onClick = vi.fn();
    });

    afterEach(() => {
        vi.restoreAllMocks();
        document.body.innerHTML = '';
    });

    describe('constructor', () => {
        it('should create an instance with default options', () => {
            iconButton = new IconButton();
            expect(iconButton).toBeDefined();
        });

        it('should accept icon option', () => {
            iconButton = new IconButton({ icon: '<svg>icon</svg>' });
            expect(iconButton.options.icon).toBe('<svg>icon</svg>');
        });

        it('should accept title option', () => {
            iconButton = new IconButton({ title: 'Click me' });
            expect(iconButton.options.title).toBe('Click me');
        });

        it('should accept onClick callback', () => {
            iconButton = new IconButton({ onClick });
            expect(iconButton.options.onClick).toBe(onClick);
        });

        it('should accept isActive option', () => {
            iconButton = new IconButton({ isActive: true });
            expect(iconButton.options.isActive).toBe(true);
        });

        it('should default isActive to false', () => {
            iconButton = new IconButton();
            expect(iconButton.options.isActive).toBe(false);
        });
    });

    describe('create()', () => {
        it('should create a button element', () => {
            iconButton = new IconButton();
            expect(iconButton.element).toBeDefined();
            expect(iconButton.element.tagName).toBe('BUTTON');
        });

        it('should have pi-icon-btn class', () => {
            iconButton = new IconButton();
            expect(iconButton.element.className).toContain('pi-icon-btn');
        });

        it('should render icon as innerHTML', () => {
            iconButton = new IconButton({ icon: '<svg>test</svg>' });
            // Icon is now wrapped in a span, so check that the icon content is present
            expect(iconButton.element.innerHTML).toContain('<svg>test</svg>');
        });

        it('should set title attribute', () => {
            iconButton = new IconButton({ title: 'My Button' });
            expect(iconButton.element.title).toBe('My Button');
        });

        it('should not set title if not provided', () => {
            iconButton = new IconButton();
            expect(iconButton.element.title).toBe('');
        });

        it('should add active class when isActive is true', () => {
            iconButton = new IconButton({ isActive: true });
            expect(iconButton.element.classList.contains('active')).toBe(true);
        });

        it('should not add active class when isActive is false', () => {
            iconButton = new IconButton({ isActive: false });
            expect(iconButton.element.classList.contains('active')).toBe(false);
        });
    });

    describe('click event', () => {
        it('should call onClick when clicked', () => {
            iconButton = new IconButton({ onClick });
            
            iconButton.element.click();
            
            expect(onClick).toHaveBeenCalled();
        });

        it('should pass event to onClick', () => {
            iconButton = new IconButton({ onClick });
            
            iconButton.element.click();
            
            expect(onClick).toHaveBeenCalledWith(expect.any(MouseEvent));
        });

        it('should work with default onClick', () => {
            iconButton = new IconButton();
            expect(() => iconButton.element.click()).not.toThrow();
        });
    });

    describe('setActive()', () => {
        it('should add active class when setting active to true', () => {
            iconButton = new IconButton({ isActive: false });
            
            iconButton.setActive(true);
            
            expect(iconButton.element.classList.contains('active')).toBe(true);
        });

        it('should remove active class when setting active to false', () => {
            iconButton = new IconButton({ isActive: true });
            
            iconButton.setActive(false);
            
            expect(iconButton.element.classList.contains('active')).toBe(false);
        });

        it('should handle multiple setActive calls', () => {
            iconButton = new IconButton({ isActive: false });
            
            iconButton.setActive(true);
            iconButton.setActive(true);
            iconButton.setActive(false);
            iconButton.setActive(true);
            
            expect(iconButton.element.classList.contains('active')).toBe(true);
        });

        it('should not duplicate active class', () => {
            iconButton = new IconButton({ isActive: true });
            
            iconButton.setActive(true);
            
            const activeCount = Array.from(iconButton.element.classList)
                .filter(c => c === 'active').length;
            expect(activeCount).toBe(1);
        });
    });

    describe('edge cases', () => {
        it('should handle empty icon', () => {
            iconButton = new IconButton({ icon: '' });
            // With new Button component, empty icon means no icon element rendered
            expect(iconButton.element.querySelector('.btn__icon')).toBeNull();
        });

        it('should handle complex SVG icon', () => {
            const complexIcon = '<svg viewBox="0 0 24 24"><path d="M0 0h24v24H0z"/></svg>';
            iconButton = new IconButton({ icon: complexIcon });
            // Browser normalizes self-closing tags
            expect(iconButton.element.innerHTML).toContain('svg');
            expect(iconButton.element.innerHTML).toContain('path');
        });

        it('should handle HTML entities in title', () => {
            iconButton = new IconButton({ title: 'Add & Remove' });
            expect(iconButton.element.title).toBe('Add & Remove');
        });
    });
});
