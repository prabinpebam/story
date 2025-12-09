export class EmptyState {
    constructor(message) {
        this.element = document.createElement('div');
        this.element.className = 'empty-state-row';

        // Placeholder slot
        const slot = document.createElement('div');
        slot.className = 'empty-state-slot';
        
        const text = document.createElement('span');
        text.textContent = message;

        this.element.appendChild(slot);
        this.element.appendChild(text);
    }
}
