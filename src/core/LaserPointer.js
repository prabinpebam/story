export class LaserPointer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.points = [];
        this.isActive = false;
        this.animationFrame = null;
        this.width = 0;
        this.height = 0;
        
        // Configuration
        this.trailLength = 20;
        this.color = '#FF0000'; // Red
        this.lineWidth = 4;
        
        this.init();
    }

    init() {
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        if (!this.canvas) return;
        
        // Always use window dimensions for the laser pointer as it is fixed position full screen
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        
        // Handle high DPI
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = this.width * dpr;
        this.canvas.height = this.height * dpr;
        this.ctx.scale(dpr, dpr);
        this.canvas.style.width = `${this.width}px`;
        this.canvas.style.height = `${this.height}px`;
    }

    start() {
        this.isActive = true;
        this.points = [];
        this.loop();
    }

    stop() {
        this.isActive = false;
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        this.clear();
    }

    clear() {
        this.ctx.clearRect(0, 0, this.width, this.height);
    }

    addPoint(x, y) {
        if (!this.isActive) return;
        this.points.push({ x, y, age: 0 });
        if (this.points.length > this.trailLength) {
            this.points.shift();
        }
    }

    loop() {
        if (!this.isActive) return;

        this.clear();
        
        // Update points age
        this.points.forEach(p => p.age++);
        // Remove old points
        this.points = this.points.filter(p => p.age < this.trailLength);

        if (this.points.length < 2) {
            this.animationFrame = requestAnimationFrame(() => this.loop());
            return;
        }

        // Draw Trail
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        // Draw segments with varying opacity
        for (let i = 0; i < this.points.length - 1; i++) {
            const p1 = this.points[i];
            const p2 = this.points[i + 1];
            
            const opacity = 1 - (p1.age / this.trailLength);
            
            this.ctx.beginPath();
            this.ctx.moveTo(p1.x, p1.y);
            this.ctx.lineTo(p2.x, p2.y);
            this.ctx.strokeStyle = `rgba(255, 0, 0, ${opacity})`;
            this.ctx.lineWidth = this.lineWidth * opacity; // Tapering
            this.ctx.stroke();
        }
        
        // Draw head (glow)
        const head = this.points[this.points.length - 1];
        if (head) {
            this.ctx.beginPath();
            this.ctx.arc(head.x, head.y, 4, 0, Math.PI * 2);
            this.ctx.fillStyle = '#FF0000';
            this.ctx.fill();
            
            // Glow
            this.ctx.beginPath();
            this.ctx.arc(head.x, head.y, 8, 0, Math.PI * 2);
            this.ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
            this.ctx.fill();
        }

        this.animationFrame = requestAnimationFrame(() => this.loop());
    }
}
