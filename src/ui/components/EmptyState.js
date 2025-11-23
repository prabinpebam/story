export class EmptyState {
    constructor(message) {
        this.element = document.createElement('div');
        this.element.className = 'empty-state-row';
        this.element.style.display = 'flex';
        this.element.style.alignItems = 'center';
        this.element.style.padding = '8px 4px'; // Match row padding
        this.element.style.gap = '8px';
        this.element.style.color = 'var(--text-tertiary)';
        this.element.style.fontSize = '11px';
        this.element.style.userSelect = 'none';

        // Placeholder slot
        const slot = document.createElement('div');
        slot.style.width = '16px';
        slot.style.height = '16px';
        slot.style.borderRadius = '2px';
        slot.style.border = '1px dashed var(--color-icon-tertiary)'; // Use variable
        slot.style.boxSizing = 'border-box';
        slot.style.opacity = '0.5';
        
        const text = document.createElement('span');
        text.textContent = message;

        this.element.appendChild(slot);
        this.element.appendChild(text);
    }
}
