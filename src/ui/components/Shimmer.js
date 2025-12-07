/**
 * Shimmer Component
 * 
 * A lightweight web component for displaying loading skeletons.
 * Usage: <story-shimmer width="100%" height="20px" variant="text"></story-shimmer>
 */
export class Shimmer extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    static get observedAttributes() {
        return ['width', 'height', 'variant', 'radius'];
    }

    connectedCallback() {
        this.render();
    }

    attributeChangedCallback() {
        this.render();
    }

    render() {
        const width = this.getAttribute('width') || '100%';
        const height = this.getAttribute('height') || '16px';
        const variant = this.getAttribute('variant') || 'rect'; // rect, circle, text
        const radius = this.getAttribute('radius');

        let borderRadius = '4px';
        if (variant === 'circle') borderRadius = '50%';
        if (radius) borderRadius = radius;

        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    width: ${width};
                    height: ${height};
                    overflow: hidden;
                    border-radius: ${borderRadius};
                    background: var(--color-bg-input, #383838);
                    position: relative;
                }

                .shimmer-effect {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(
                        90deg,
                        transparent 0%,
                        var(--color-bg-hover, rgba(255, 255, 255, 0.05)) 50%,
                        transparent 100%
                    );
                    animation: shimmer 1.5s infinite;
                    transform: translateX(-100%);
                }

                @keyframes shimmer {
                    100% {
                        transform: translateX(100%);
                    }
                }

                @media (prefers-reduced-motion) {
                    .shimmer-effect {
                        animation: none;
                        background: var(--color-bg-hover, rgba(255, 255, 255, 0.05));
                    }
                }
            </style>
            <div class="shimmer-effect"></div>
        `;
    }
}

customElements.define('story-shimmer', Shimmer);
