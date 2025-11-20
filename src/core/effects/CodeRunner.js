export class CodeRunner {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.animationFrame = null;
        this.isPlaying = false;
        this.userCode = '';
        this.cleanup = null;
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
        this.run();
    }

    stop() {
        this.isPlaying = false;
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
    }

    run() {
        if (!this.userCode) return;

        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        try {
            // Create a safe-ish scope
            // We provide: ctx, canvas, width, height, time
            // User defines: draw(time) or setup()/draw()
            
            const func = new Function('ctx', 'canvas', 'width', 'height', 'time', `
                ${this.userCode}
                // Return a cleanup function if needed, or an object with draw method
                if (typeof draw === 'function') return { draw };
                return null;
            `);

            // Initial call to setup or get draw function
            const result = func(this.ctx, this.canvas, this.canvas.width, this.canvas.height, 0);
            
            if (result && typeof result.draw === 'function') {
                let startTime = Date.now();
                
                const loop = () => {
                    if (!this.isPlaying) return;
                    
                    const time = (Date.now() - startTime) / 1000;
                    
                    // Reset transform before draw
                    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
                    
                    // Pass current dimensions in case of resize
                    // User code should use 'canvas.width' or 'canvas.height' or the passed 'width'/'height' if we re-inject them?
                    // We can't re-inject 'width'/'height' variables into the closure easily.
                    // But 'canvas' is a reference. So 'canvas.width' is always current.
                    // However, if user used the 'width' argument, it's stale.
                    // We should encourage using canvas.width/height or re-call the function?
                    // Re-calling the function might reset state.
                    // Let's just rely on canvas.width/height being available via 'canvas' arg.
                    
                    try {
                        result.draw(time);
                    } catch (e) {
                        console.error('Runtime error in user code:', e);
                        this.stop();
                        return;
                    }
                    
                    this.animationFrame = requestAnimationFrame(loop);
                };
                
                loop();
            }
            
            if (result && typeof result.cleanup === 'function') {
                this.cleanup = result.cleanup;
            }

        } catch (e) {
            console.error('Compilation error in user code:', e);
        }
    }
}
