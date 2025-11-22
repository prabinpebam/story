export class CodeRunner {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.animationFrame = null;
        this.isPlaying = false;
        this.userCode = '';
        this.cleanup = null;
        this.drawFunction = null;
        this.startTime = 0;
        
        // Mouse state
        this.mouse = { x: 0, y: 0, down: false };
        this._handleMouseMove = this._handleMouseMove.bind(this);
        this._handleMouseDown = this._handleMouseDown.bind(this);
        this._handleMouseUp = this._handleMouseUp.bind(this);
        
        // Attach mouse event listeners
        this.canvas.addEventListener('mousemove', this._handleMouseMove);
        this.canvas.addEventListener('mousedown', this._handleMouseDown);
        this.canvas.addEventListener('mouseup', this._handleMouseUp);
    }

    setCode(code) {
        this.userCode = code;
        if (this.isPlaying) {
            this.stop();
            this.play();
        }
    }

    play() {
        if (this.isPlaying) return;
        this.isPlaying = true;
        
        // Attach listeners
        this.canvas.addEventListener('mousemove', this._handleMouseMove);
        this.canvas.addEventListener('mousedown', this._handleMouseDown);
        this.canvas.addEventListener('mouseup', this._handleMouseUp);
        this.canvas.addEventListener('mouseleave', this._handleMouseUp);
        
        // Initialize mouse props on canvas
        this.canvas.mouseX = this.canvas.width / 2;
        this.canvas.mouseY = this.canvas.height / 2;
        this.canvas.isMouseDown = false;

        this.run();
    }

    stop() {
        this.isPlaying = false;
        
        // Remove listeners
        this.canvas.removeEventListener('mousemove', this._handleMouseMove);
        this.canvas.removeEventListener('mousedown', this._handleMouseDown);
        this.canvas.removeEventListener('mouseup', this._handleMouseUp);
        this.canvas.removeEventListener('mouseleave', this._handleMouseUp);

        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
        if (this.cleanup && typeof this.cleanup === 'function') {
            try {
                this.cleanup();
            } catch (e) {
                console.error('Error in cleanup:', e);
            }
        }
        this.cleanup = null;
        this.drawFunction = null;
    }

    resize(w, h) {
        const newW = Math.floor(w);
        const newH = Math.floor(h);
        
        if (this.canvas.width !== newW || this.canvas.height !== newH) {
            this.canvas.width = newW;
            this.canvas.height = newH;
            
            // Force immediate redraw to prevent flickering
            if (this.drawFunction && this.isPlaying) {
                const time = (Date.now() - this.startTime) / 1000;
                this.ctx.setTransform(1, 0, 0, 1, 0, 0);
                try {
                    this.drawFunction(time);
                } catch (e) {
                    console.error('Runtime error during resize:', e);
                }
            }
        }
    }

    run() {
        if (!this.userCode) {
            console.warn('CodeRunner: No user code to run');
            return;
        }

        // console.log('CodeRunner: Starting execution');
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        try {
            // Create a safe-ish scope
            // We provide: ctx, canvas, width, height, time
            // User defines: draw(time) or setup()/draw()
            
            let func;
            let result;
            let success = false;

            // Attempt 1: Try to interpret as an object literal or expression returning an object
            // This handles cases like: { draw: function(t) { ... } }
            try {
                func = new Function('ctx', 'canvas', 'width', 'height', 'time', `return (${this.userCode}\n);`);
                result = func(this.ctx, this.canvas, this.canvas.width, this.canvas.height, 0);
                if (result && typeof result.draw === 'function') {
                    success = true;
                }
            } catch (e) {
                // Ignore syntax/runtime errors in this attempt and fall back to statement mode
            }

            // Attempt 2: Interpret as statements
            // This handles cases like: function draw(t) { ... } or explicit return { ... }
            if (!success) {
                try {
                    func = new Function('ctx', 'canvas', 'width', 'height', 'time', `
                        ${this.userCode}
                        // Return a cleanup function if needed, or an object with draw method
                        if (typeof draw === 'function') return { draw };
                        return null;
                    `);
                    result = func(this.ctx, this.canvas, this.canvas.width, this.canvas.height, 0);
                } catch (e) {
                    console.error('Compilation error in user code:', e);
                    return;
                }
            }

            // console.log('CodeRunner: Execution result', result);
            
            if (result && typeof result.draw === 'function') {
                // Bind draw to the result object so 'this' works inside draw
                this.drawFunction = result.draw.bind(result);
                this.startTime = Date.now();
                // console.log('CodeRunner: Starting animation loop');
                
                const loop = () => {
                    if (!this.isPlaying) return;
                    
                    const time = (Date.now() - this.startTime) / 1000;
                    
                    // Reset transform before draw
                    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
                    
                    try {
                        this.drawFunction(time);
                    } catch (e) {
                        console.error('Runtime error in user code:', e);
                        this.stop();
                        return;
                    }
                    
                    this.animationFrame = requestAnimationFrame(loop);
                };
                
                loop();
            } else {
                // console.warn('CodeRunner: No draw function returned');
            }
            
            if (result && typeof result.cleanup === 'function') {
                this.cleanup = result.cleanup;
            }

        } catch (e) {
            console.error('Compilation error in user code:', e);
        }
    }
    
    _handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = e.clientX - rect.left;
        this.mouse.y = e.clientY - rect.top;
        
        // Update canvas properties for user access
        this.canvas.mouseX = this.mouse.x;
        this.canvas.mouseY = this.mouse.y;
    }

    _handleMouseDown(e) {
        this.mouse.down = true;
        this.canvas.isMouseDown = true;
        this._handleMouseMove(e); // Update pos
    }

    _handleMouseUp(e) {
        this.mouse.down = false;
        this.canvas.isMouseDown = false;
        this._handleMouseMove(e); // Update pos
    }

    static get DEFAULT_CODE() {
        return `
return {
    draw: function(t) {
        const w = canvas.width;
        const h = canvas.height;
        const grd = ctx.createLinearGradient(0, 0, w, h);
        const c1 = Math.sin(t * 0.2) * 50 + 200;
        const c2 = Math.cos(t * 0.15) * 50 + 200;
        grd.addColorStop(0, \`rgb(\${c1}, 200, 255)\`);
        grd.addColorStop(1, \`rgb(255, \${c2}, 200)\`);
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, w, h);
        
        // Floating circles with smooth, slow blur cycles
        for(let i=0; i<5; i++) {
            const x = (Math.sin(t * 0.2 + i) * 0.5 + 0.5) * w;
            const y = (Math.cos(t * 0.3 + i) * 0.5 + 0.5) * h;
            const r = 100 + Math.sin(t * 0.3 + i) * 50;
            
            // Smooth, slow blur cycle
            const blurCycleSpeed = 0.05 + i * 0.02;
            const blurAmount = (Math.sin(t * blurCycleSpeed + i * 1.5) * 0.5 + 0.5) * 25 + 5;
            
            ctx.save();
            ctx.filter = \`blur(\${blurAmount.toFixed(2)}px)\`;
            
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fillStyle = \`rgba(255, 255, 255, 0.2)\`;
            ctx.fill();
            
            ctx.restore();
        }
    }
};`.trim();
    }
}
