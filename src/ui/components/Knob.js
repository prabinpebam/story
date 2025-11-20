export class Knob {
    constructor(label, value, min, max, onChange) {
        this.label = label;
        this.value = value;
        this.min = min;
        this.max = max;
        this.onChange = onChange;
        this.isDragging = false;
        this.startY = 0;
        this.startValue = 0;
        
        this.element = this.create();
    }

    create() {
        const container = document.createElement('div');
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.alignItems = 'center';
        container.style.width = '48px';
        container.style.marginRight = '8px';

        // Knob Circle
        const size = 32;
        const canvas = document.createElement('canvas');
        canvas.width = size * 2; // Retina
        canvas.height = size * 2;
        canvas.style.width = `${size}px`;
        canvas.style.height = `${size}px`;
        canvas.style.cursor = 'ns-resize';
        
        this.ctx = canvas.getContext('2d');
        this.canvas = canvas;

        // Label
        const labelEl = document.createElement('div');
        labelEl.innerText = this.label;
        labelEl.style.fontSize = '10px';
        labelEl.style.color = 'var(--color-text-secondary)';
        labelEl.style.marginTop = '4px';
        labelEl.style.textAlign = 'center';

        // Value Display (Optional, maybe tooltip?)
        // For now, just the knob

        container.appendChild(canvas);
        container.appendChild(labelEl);

        this.renderKnob();

        // Interaction
        canvas.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            this.startY = e.clientY;
            this.startValue = this.value;
            document.body.style.cursor = 'ns-resize';
            
            const moveHandler = (ev) => {
                if (!this.isDragging) return;
                const deltaY = this.startY - ev.clientY; // Up increases value
                const range = this.max - this.min;
                const sensitivity = range / 200; // 200px drag for full range
                
                let newValue = this.startValue + (deltaY * sensitivity);
                newValue = Math.max(this.min, Math.min(this.max, newValue));
                
                if (newValue !== this.value) {
                    this.value = newValue;
                    this.renderKnob();
                    if (this.onChange) this.onChange(this.value);
                }
            };

            const upHandler = () => {
                this.isDragging = false;
                document.body.style.cursor = 'default';
                window.removeEventListener('mousemove', moveHandler);
                window.removeEventListener('mouseup', upHandler);
            };

            window.addEventListener('mousemove', moveHandler);
            window.addEventListener('mouseup', upHandler);
        });

        return container;
    }

    renderKnob() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;
        const cx = w / 2;
        const cy = h / 2;
        const r = (w / 2) - 4;

        // Get colors from CSS variables
        const style = getComputedStyle(document.body);
        const bg = style.getPropertyValue('--color-bg-well').trim() || '#E6E6E6';
        const border = style.getPropertyValue('--color-border').trim() || '#B3B3B3';
        const accent = style.getPropertyValue('--color-accent').trim() || '#18A0FB';

        ctx.clearRect(0, 0, w, h);

        // Background Circle
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fillStyle = bg;
        ctx.fill();
        ctx.strokeStyle = border;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Value Indicator (Arc)
        const startAngle = Math.PI * 0.75;
        const endAngle = Math.PI * 2.25;
        const range = this.max - this.min;
        const pct = (this.value - this.min) / range;
        const currentAngle = startAngle + (pct * (endAngle - startAngle));

        // Tick Mark
        const tickLen = r * 0.6;
        const tx = cx + Math.cos(currentAngle) * tickLen;
        const ty = cy + Math.sin(currentAngle) * tickLen;

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(tx, ty);
        ctx.strokeStyle = accent;
        ctx.lineWidth = 4;
        ctx.stroke();
    }
}
