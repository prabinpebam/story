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
                    this.startErrorState();
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
                        this.startErrorState();
                        return;
                    }
                    
                    this.animationFrame = requestAnimationFrame(loop);
                };
                
                loop();
            } else {
                // console.warn('CodeRunner: No draw function returned');
                this.startErrorState();
            }
            
            if (result && typeof result.cleanup === 'function') {
                this.cleanup = result.cleanup;
            }

        } catch (e) {
            console.error('Compilation error in user code:', e);
            this.startErrorState();
        }
    }

    startErrorState() {
        this.drawFunction = this.drawErrorState.bind(this);
        this.startTime = Date.now();
        
        // If not already looping, start loop
        if (!this.animationFrame) {
            const loop = () => {
                if (!this.isPlaying) return;
                const time = (Date.now() - this.startTime) / 1000;
                this.ctx.setTransform(1, 0, 0, 1, 0, 0);
                this.drawErrorState(time);
                this.animationFrame = requestAnimationFrame(loop);
            };
            loop();
        }
    }

    drawErrorState(t) {
        const w = this.canvas.width;
        const h = this.canvas.height;
        const ctx = this.ctx;

        // Solid black background
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, w, h);

        const fontSize = 12;
        ctx.font = `${fontSize}px monospace`;
        const speed = 1; 
        const trailLength = 15;
        const numCols = Math.floor(w / fontSize);

        // Initialize drops if needed
        if (!this._matrixDrops) {
            this._matrixDrops = [];
            // Initial population - Reduced density (was 0.2)
            for (let i = 0; i < numCols; i++) {
                if (Math.random() > 0.05) {
                    this._matrixDrops.push({
                        col: i,
                        y: Math.random() * h
                    });
                }
            }
        }

        // Update positions & Remove off-screen
        for (let i = this._matrixDrops.length - 1; i >= 0; i--) {
            this._matrixDrops[i].y += speed;
            // Remove if trail is off screen
            if (this._matrixDrops[i].y - (trailLength * fontSize) > h) {
                this._matrixDrops.splice(i, 1);
            }
        }

        // Spawn new drops - Reduced frequency
        // Was 2 attempts at 0.1 prob (~0.2/frame). Now 1 attempt at 0.05 prob (~0.05/frame)
        if (Math.random() > 0.95) { 
             const col = Math.floor(Math.random() * numCols);
             // Check if this column is clear at the top
             const isClear = !this._matrixDrops.some(d => d.col === col && d.y < (trailLength * fontSize + fontSize));
             
             if (isClear) {
                 this._matrixDrops.push({ col, y: 0 });
             }
        }

        // Draw Trails (Green, Linear Fade)
        this._matrixDrops.forEach(drop => {
            const x = drop.col * fontSize;
            const y = drop.y;
            
            for (let j = 1; j < trailLength; j++) {
                const trailY = y - (j * fontSize);
                const snappedY = Math.floor(trailY / fontSize) * fontSize;
                
                if (snappedY < -fontSize || snappedY > h) continue;

                const charCode = 0x30A0 + ((x + snappedY) * 33) % 96;
                const char = String.fromCharCode(charCode);
                
                // Linear fade from 1.0 to 0.0
                const opacity = 1 - (j / trailLength);
                ctx.fillStyle = `rgba(36, 215, 102, ${opacity})`;
                ctx.fillText(char, x, snappedY);
            }
        });

        // Draw Heads (White + Glow)
        ctx.save();
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
        ctx.shadowBlur = 8;
        
        this._matrixDrops.forEach(drop => {
            const x = drop.col * fontSize;
            const y = drop.y;
            const snappedY = Math.floor(y / fontSize) * fontSize;
            
            if (snappedY < -fontSize || snappedY > h) return;

            const charCode = 0x30A0 + ((x + snappedY) * 33) % 96;
            const char = String.fromCharCode(charCode);
            ctx.fillText(char, x, snappedY);
        });
        ctx.restore();

        // Error Box - Static, Smaller, Classy
        const boxW = 140;
        const boxH = 40;
        const boxX = (w - boxW) / 2;
        const boxY = (h - boxH) / 2;
        const matrixColor = '#24D766'; 

        ctx.save();
        ctx.translate(boxX, boxY); 
        
        // Box Background - Subtle dark green
        ctx.fillStyle = 'rgba(0, 20, 10, 0.85)';
        ctx.strokeStyle = matrixColor;
        ctx.lineWidth = 1;
        
        // Rounded corners
        ctx.beginPath();
        ctx.roundRect(0, 0, boxW, boxH, 4);
        ctx.fill();
        ctx.stroke();

        // Icon (Warning Triangle)
        ctx.beginPath();
        ctx.moveTo(15, 30);
        ctx.lineTo(25, 10);
        ctx.lineTo(35, 30);
        ctx.closePath();
        ctx.strokeStyle = matrixColor;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        
        // Exclamation mark
        ctx.beginPath();
        ctx.moveTo(25, 16);
        ctx.lineTo(25, 22);
        ctx.moveTo(25, 25);
        ctx.lineTo(25, 26);
        ctx.stroke();

        // Text
        ctx.fillStyle = matrixColor;
        ctx.font = '12px "Inter", sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText('CODE ERROR', 45, 20);

        ctx.restore();
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
