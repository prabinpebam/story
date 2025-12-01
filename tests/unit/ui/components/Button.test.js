import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { Button } from '../../../../src/ui/components/Button.js';

describe('Button', () => {
    let button;
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
            button = new Button();
            expect(button).toBeDefined();
            expect(button.element).toBeDefined();
            expect(button.element.tagName).toBe('BUTTON');
        });

        it('should accept label option', () => {
            button = new Button({ label: 'Click me' });
            expect(button.options.label).toBe('Click me');
            expect(button.element.textContent).toContain('Click me');
        });

        it('should accept icon option', () => {
            button = new Button({ icon: '<svg>icon</svg>' });
            expect(button.options.icon).toBe('<svg>icon</svg>');
            expect(button.element.innerHTML).toContain('<svg>icon</svg>');
        });

        it('should accept variant option', () => {
            button = new Button({ variant: 'primary' });
            expect(button.options.variant).toBe('primary');
            expect(button.element.classList.contains('btn--primary')).toBe(true);
        });

        it('should accept size option', () => {
            button = new Button({ size: 'lg' });
            expect(button.options.size).toBe('lg');
            expect(button.element.classList.contains('btn--lg')).toBe(true);
        });

        it('should default to secondary variant', () => {
            button = new Button();
            expect(button.options.variant).toBe('secondary');
            expect(button.element.classList.contains('btn--secondary')).toBe(true);
        });

        it('should default to md size', () => {
            button = new Button();
            expect(button.options.size).toBe('md');
            expect(button.element.classList.contains('btn--md')).toBe(true);
        });
    });

    describe('variants', () => {
        it('should apply primary variant class', () => {
            button = new Button({ variant: 'primary' });
            expect(button.element.classList.contains('btn--primary')).toBe(true);
        });

        it('should apply secondary variant class', () => {
            button = new Button({ variant: 'secondary' });
            expect(button.element.classList.contains('btn--secondary')).toBe(true);
        });

        it('should apply text variant class', () => {
            button = new Button({ variant: 'text' });
            expect(button.element.classList.contains('btn--text')).toBe(true);
        });

        it('should apply danger variant class', () => {
            button = new Button({ variant: 'danger' });
            expect(button.element.classList.contains('btn--danger')).toBe(true);
        });
    });

    describe('sizes', () => {
        it('should apply xs size class', () => {
            button = new Button({ size: 'xs' });
            expect(button.element.classList.contains('btn--xs')).toBe(true);
        });

        it('should apply sm size class', () => {
            button = new Button({ size: 'sm' });
            expect(button.element.classList.contains('btn--sm')).toBe(true);
        });

        it('should apply md size class', () => {
            button = new Button({ size: 'md' });
            expect(button.element.classList.contains('btn--md')).toBe(true);
        });

        it('should apply lg size class', () => {
            button = new Button({ size: 'lg' });
            expect(button.element.classList.contains('btn--lg')).toBe(true);
        });
    });

    describe('icon handling', () => {
        it('should render icon on the left by default', () => {
            button = new Button({ icon: '<svg>icon</svg>', label: 'Text' });
            const iconSpan = button.element.querySelector('.btn__icon');
            const labelSpan = button.element.querySelector('.btn__label');
            expect(iconSpan).not.toBeNull();
            expect(labelSpan).not.toBeNull();
            // Icon should come before label
            expect(button.element.innerHTML.indexOf('btn__icon')).toBeLessThan(
                button.element.innerHTML.indexOf('btn__label')
            );
        });

        it('should render icon on the right when specified', () => {
            button = new Button({ icon: '<svg>icon</svg>', label: 'Text', iconPosition: 'right' });
            const iconSpan = button.element.querySelector('.btn__icon');
            const labelSpan = button.element.querySelector('.btn__label');
            expect(iconSpan).not.toBeNull();
            expect(labelSpan).not.toBeNull();
            // Label should come before icon
            expect(button.element.innerHTML.indexOf('btn__label')).toBeLessThan(
                button.element.innerHTML.indexOf('btn__icon')
            );
        });

        it('should add icon-only class when no label provided', () => {
            button = new Button({ icon: '<svg>icon</svg>' });
            expect(button.element.classList.contains('btn--icon-only')).toBe(true);
        });

        it('should not add icon-only class when label provided', () => {
            button = new Button({ icon: '<svg>icon</svg>', label: 'Text' });
            expect(button.element.classList.contains('btn--icon-only')).toBe(false);
        });
    });

    describe('click event', () => {
        it('should call onClick when clicked', () => {
            button = new Button({ onClick });
            button.element.click();
            expect(onClick).toHaveBeenCalled();
        });

        it('should pass event to onClick', () => {
            button = new Button({ onClick });
            button.element.click();
            expect(onClick).toHaveBeenCalledWith(expect.any(MouseEvent));
        });

        it('should not call onClick when disabled', () => {
            button = new Button({ onClick, disabled: true });
            button.element.click();
            expect(onClick).not.toHaveBeenCalled();
        });

        it('should not call onClick when loading', () => {
            button = new Button({ onClick, loading: true });
            button.element.click();
            expect(onClick).not.toHaveBeenCalled();
        });
    });

    describe('states', () => {
        it('should apply disabled state', () => {
            button = new Button({ disabled: true });
            expect(button.element.disabled).toBe(true);
            expect(button.element.classList.contains('btn--disabled')).toBe(true);
        });

        it('should apply loading state', () => {
            button = new Button({ loading: true });
            expect(button.element.classList.contains('btn--loading')).toBe(true);
            expect(button.element.querySelector('.btn__spinner')).not.toBeNull();
        });

        it('should apply active state', () => {
            button = new Button({ active: true });
            expect(button.element.classList.contains('btn--active')).toBe(true);
        });

        it('should apply fullWidth modifier', () => {
            button = new Button({ fullWidth: true });
            expect(button.element.classList.contains('btn--full')).toBe(true);
        });
    });

    describe('accessibility', () => {
        it('should set title attribute', () => {
            button = new Button({ title: 'My tooltip' });
            expect(button.element.title).toBe('My tooltip');
        });

        it('should set aria-label when provided', () => {
            button = new Button({ ariaLabel: 'Screen reader text' });
            expect(button.element.getAttribute('aria-label')).toBe('Screen reader text');
        });

        it('should use title as aria-label for icon-only buttons', () => {
            button = new Button({ icon: '<svg></svg>', title: 'Close' });
            expect(button.element.getAttribute('aria-label')).toBe('Close');
        });

        it('should set aria-busy when loading', () => {
            button = new Button({ loading: true });
            expect(button.element.getAttribute('aria-busy')).toBe('true');
        });

        it('should set button type', () => {
            button = new Button({ type: 'submit' });
            expect(button.element.type).toBe('submit');
        });

        it('should default button type to button', () => {
            button = new Button();
            expect(button.element.type).toBe('button');
        });
    });

    describe('setDisabled()', () => {
        it('should enable when setting disabled to false', () => {
            button = new Button({ disabled: true });
            button.setDisabled(false);
            expect(button.element.disabled).toBe(false);
            expect(button.element.classList.contains('btn--disabled')).toBe(false);
        });

        it('should disable when setting disabled to true', () => {
            button = new Button({ disabled: false });
            button.setDisabled(true);
            expect(button.element.disabled).toBe(true);
            expect(button.element.classList.contains('btn--disabled')).toBe(true);
        });
    });

    describe('setLoading()', () => {
        it('should show spinner when setting loading to true', () => {
            button = new Button({ loading: false });
            button.setLoading(true);
            expect(button.element.classList.contains('btn--loading')).toBe(true);
            expect(button.element.querySelector('.btn__spinner')).not.toBeNull();
        });

        it('should hide spinner when setting loading to false', () => {
            button = new Button({ loading: true });
            button.setLoading(false);
            expect(button.element.classList.contains('btn--loading')).toBe(false);
            expect(button.element.querySelector('.btn__spinner')).toBeNull();
        });
    });

    describe('setActive()', () => {
        it('should add active class when setting active to true', () => {
            button = new Button({ active: false });
            button.setActive(true);
            expect(button.element.classList.contains('btn--active')).toBe(true);
        });

        it('should remove active class when setting active to false', () => {
            button = new Button({ active: true });
            button.setActive(false);
            expect(button.element.classList.contains('btn--active')).toBe(false);
        });
    });

    describe('setLabel()', () => {
        it('should update label text', () => {
            button = new Button({ label: 'Old' });
            button.setLabel('New');
            expect(button.element.textContent).toContain('New');
        });

        it('should add icon-only class when label removed', () => {
            button = new Button({ icon: '<svg></svg>', label: 'Text' });
            button.setLabel('');
            expect(button.element.classList.contains('btn--icon-only')).toBe(true);
        });
    });

    describe('setIcon()', () => {
        it('should update icon', () => {
            button = new Button({ icon: '<svg>old</svg>' });
            button.setIcon('<svg>new</svg>');
            expect(button.element.innerHTML).toContain('<svg>new</svg>');
        });

        it('should add icon-only class when icon added without label', () => {
            button = new Button({ label: '' });
            button.setIcon('<svg></svg>');
            expect(button.element.classList.contains('btn--icon-only')).toBe(true);
        });
    });

    describe('setVariant()', () => {
        it('should change variant class', () => {
            button = new Button({ variant: 'secondary' });
            button.setVariant('primary');
            expect(button.element.classList.contains('btn--primary')).toBe(true);
            expect(button.element.classList.contains('btn--secondary')).toBe(false);
        });
    });

    describe('focus()', () => {
        it('should focus the button element', () => {
            button = new Button();
            document.body.appendChild(button.element);
            button.focus();
            expect(document.activeElement).toBe(button.element);
        });
    });

    describe('destroy()', () => {
        it('should remove element from DOM', () => {
            button = new Button();
            document.body.appendChild(button.element);
            expect(document.body.contains(button.element)).toBe(true);
            button.destroy();
            expect(document.body.contains(button.element)).toBe(false);
        });
    });

    describe('custom className', () => {
        it('should add custom class names', () => {
            button = new Button({ className: 'my-custom-class another-class' });
            expect(button.element.classList.contains('my-custom-class')).toBe(true);
            expect(button.element.classList.contains('another-class')).toBe(true);
        });
    });
});
