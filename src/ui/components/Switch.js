import { store } from '../../core/Store.js';

export class Switch {
    constructor(label, initialValue, onChange) {
        this.label = label;
        this.value = initialValue;
        this.onChange = onChange;
        this.element = this.create();
    }

    create() {
        const container = document.createElement('div');
        container.style.display = 'flex';
        container.style.alignItems = 'center';
        container.style.justifyContent = 'space-between';
        container.style.marginBottom = '8px';
        
        // Stop propagation on container to prevent parent collapse
        container.addEventListener('click', (e) => e.stopPropagation());

        // Label
        if (this.label) {
            const labelEl = document.createElement('div');
            labelEl.innerText = this.label;
            labelEl.style.fontSize = '11px';
            labelEl.style.color = 'var(--color-text-secondary)';
            container.appendChild(labelEl);
        }

        // Switch Track
        const track = document.createElement('div');
        track.style.width = '32px';
        track.style.height = '16px';
        track.style.backgroundColor = this.value ? 'var(--color-accent)' : 'var(--color-border)';
        track.style.borderRadius = '8px'; // Rounded pill
        track.style.position = 'relative';
        track.style.cursor = 'pointer';
        track.style.transition = 'background-color 0.2s ease';

        // Switch Thumb
        const thumb = document.createElement('div');
        thumb.style.width = '12px';
        thumb.style.height = '12px';
        thumb.style.backgroundColor = 'white';
        thumb.style.borderRadius = '50%'; // Circle
        thumb.style.position = 'absolute';
        thumb.style.top = '2px';
        thumb.style.left = this.value ? '18px' : '2px';
        thumb.style.transition = 'left 0.2s cubic-bezier(0.2, 0.0, 0.2, 1)';
        thumb.style.boxShadow = '0 1px 2px var(--color-shadow)';

        track.appendChild(thumb);
        container.appendChild(track);

        // Interaction
        track.addEventListener('click', (e) => {
            e.stopPropagation();
            store.dispatch('UI_INTERACTION_START');
            this.value = !this.value;
            
            // Update Visuals
            track.style.backgroundColor = this.value ? 'var(--color-accent)' : 'var(--color-border)';
            thumb.style.left = this.value ? '18px' : '2px';

            if (this.onChange) this.onChange(this.value);
            store.dispatch('UI_INTERACTION_END');
        });

        return container;
    }
}
