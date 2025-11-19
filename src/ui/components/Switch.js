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

        // Label
        const labelEl = document.createElement('div');
        labelEl.innerText = this.label;
        labelEl.style.fontSize = '11px';
        labelEl.style.color = 'var(--text-secondary)';
        container.appendChild(labelEl);

        // Switch Track
        const track = document.createElement('div');
        track.style.width = '32px';
        track.style.height = '16px';
        track.style.backgroundColor = this.value ? 'var(--te-orange)' : 'var(--bg-well)';
        track.style.borderRadius = '2px'; // Mechanical look, slightly rounded
        track.style.position = 'relative';
        track.style.cursor = 'pointer';
        track.style.transition = 'background-color 0.2s ease';

        // Switch Thumb
        const thumb = document.createElement('div');
        thumb.style.width = '12px';
        thumb.style.height = '12px';
        thumb.style.backgroundColor = 'white';
        thumb.style.borderRadius = '1px';
        thumb.style.position = 'absolute';
        thumb.style.top = '2px';
        thumb.style.left = this.value ? '18px' : '2px';
        thumb.style.transition = 'left 0.2s cubic-bezier(0.2, 0.0, 0.2, 1)';
        thumb.style.boxShadow = '0 1px 2px rgba(0,0,0,0.2)';

        track.appendChild(thumb);
        container.appendChild(track);

        // Interaction
        track.addEventListener('click', () => {
            this.value = !this.value;
            
            // Update Visuals
            track.style.backgroundColor = this.value ? 'var(--te-orange)' : 'var(--bg-well)';
            thumb.style.left = this.value ? '18px' : '2px';

            if (this.onChange) this.onChange(this.value);
        });

        return container;
    }
}
