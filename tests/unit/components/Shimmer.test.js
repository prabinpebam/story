import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Shimmer } from '../../../src/ui/components/Shimmer.js';

describe('Shimmer Component', () => {
    let container;

    beforeEach(() => {
        // Register the custom element if not already registered
        if (!customElements.get('story-shimmer')) {
            customElements.define('story-shimmer', Shimmer);
        }
        container = document.createElement('div');
        document.body.appendChild(container);
    });

    afterEach(() => {
        document.body.removeChild(container);
        container = null;
    });

    it('renders with default attributes', () => {
        const shimmer = document.createElement('story-shimmer');
        container.appendChild(shimmer);

        const shadow = shimmer.shadowRoot;
        const style = shadow.querySelector('style');
        
        expect(shadow).toBeTruthy();
        expect(style.textContent).toContain('width: 100%'); // Default width
        expect(style.textContent).toContain('height: 16px'); // Default height
        expect(style.textContent).toContain('border-radius: 4px'); // Default radius
    });

    it('respects custom width and height attributes', () => {
        const shimmer = document.createElement('story-shimmer');
        shimmer.setAttribute('width', '50px');
        shimmer.setAttribute('height', '50px');
        container.appendChild(shimmer);

        const shadow = shimmer.shadowRoot;
        const style = shadow.querySelector('style');
        
        expect(style.textContent).toContain('width: 50px');
        expect(style.textContent).toContain('height: 50px');
    });

    it('handles variant="circle"', () => {
        const shimmer = document.createElement('story-shimmer');
        shimmer.setAttribute('variant', 'circle');
        container.appendChild(shimmer);

        const shadow = shimmer.shadowRoot;
        const style = shadow.querySelector('style');
        
        expect(style.textContent).toContain('border-radius: 50%');
    });

    it('prioritizes radius attribute over variant', () => {
        const shimmer = document.createElement('story-shimmer');
        shimmer.setAttribute('variant', 'circle');
        shimmer.setAttribute('radius', '8px');
        container.appendChild(shimmer);

        const shadow = shimmer.shadowRoot;
        const style = shadow.querySelector('style');
        
        expect(style.textContent).toContain('border-radius: 8px');
    });

    it('updates when attributes change', () => {
        const shimmer = document.createElement('story-shimmer');
        container.appendChild(shimmer);
        
        shimmer.setAttribute('width', '200px');
        
        const shadow = shimmer.shadowRoot;
        const style = shadow.querySelector('style');
        expect(style.textContent).toContain('width: 200px');
    });
});
