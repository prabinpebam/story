import { mouseStateManager } from '../MouseStateManager.js';

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
        
        // Guard against zombie instances
        this.isDestroyed = false;
        
        // MouseStateManager subscription
        this.unsubscribeMouse = null;
        
        // Element bounds for hit testing (set by ShapeElement/SlideView)
        this.elementBounds = null;
        
        // Enhanced mouse state
        this.mouse = {
            // Position relative to this canvas (0 to width/height)
            x: 0,
            y: 0,
            
            // Normalized position (0 to 1)
            nx: 0.5,
            ny: 0.5,
            
            // Previous frame position (for trails)
            px: 0,
            py: 0,
            
            // Button state
            isDown: false,
            wasDown: false,
            
            // Single-frame events
            pressed: false,   // True only on frame of click
            released: false,  // True only on frame of release
            
            // Velocity (pixels per second)
            vx: 0,
            vy: 0,
            
            // Distance from center (0 to 1, useful for radial effects)
            distFromCenter: 0,
            
            // Angle from center (radians)
            angleFromCenter: 0,
            
            // Is mouse over this element?
            isOver: false
        };
        
        // Legacy: Keep old property for backward compatibility
        // (Old code may use: this.mouse.down instead of this.mouse.isDown)
        Object.defineProperty(this.mouse, 'down', {
            get: () => this.mouse.isDown,
            set: (v) => { this.mouse.isDown = v; }
        });

        // Logical sizing (CSS pixels / element-local units). Canvas backing store may be DPR-scaled.
        this._logicalWidth = canvas.width || 0;
        this._logicalHeight = canvas.height || 0;
        this._dpr = 1;
    }
    
    /**
     * Set the bounds of the element containing this canvas (in world/slide coordinates)
     * Used for hit testing to determine if mouse is over this element
     * @param {Object} bounds - { x, y, width, height, rotation?, cx?, cy? }
     */
    setElementBounds(bounds) {
        this.elementBounds = bounds;
    }
    
    /**
     * Check if a world-space point is inside a potentially rotated element
     * @private
     */
    _isPointInRotatedBounds(worldX, worldY, bounds) {
        if (!bounds.rotation) {
            // Fast path: no rotation, simple AABB check
            return (
                worldX >= bounds.x &&
                worldX <= bounds.x + bounds.width &&
                worldY >= bounds.y &&
                worldY <= bounds.y + bounds.height
            );
        }
        
        // Rotate the point around the element center (inverse rotation)
        const rad = -bounds.rotation * Math.PI / 180;
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);
        
        // Use provided center or calculate it
        const cx = bounds.cx !== undefined ? bounds.cx : bounds.x + bounds.width / 2;
        const cy = bounds.cy !== undefined ? bounds.cy : bounds.y + bounds.height / 2;
        
        // Translate point to origin (element center)
        const dx = worldX - cx;
        const dy = worldY - cy;
        
        // Apply inverse rotation
        const localX = dx * cos - dy * sin + cx;
        const localY = dx * sin + dy * cos + cy;
        
        // Now check against unrotated AABB
        return (
            localX >= bounds.x &&
            localX <= bounds.x + bounds.width &&
            localY >= bounds.y &&
            localY <= bounds.y + bounds.height
        );
    }
    
    /**
     * Update mouse state from MouseStateManager broadcast
     * @param {Object} globalState - State from MouseStateManager
     * @private
     */
    _updateMouseState(globalState) {
        if (!this.isPlaying || !this.elementBounds || this.isDestroyed) return;
        
        const bounds = this.elementBounds;
        
        // Check if mouse is over this element (with rotation support)
        this.mouse.isOver = this._isPointInRotatedBounds(
            globalState.worldX,
            globalState.worldY,
            bounds
        );
        
        // Store previous position
        this.mouse.px = this.mouse.x;
        this.mouse.py = this.mouse.y;
        this.mouse.wasDown = this.mouse.isDown;
        
        // Calculate local position (relative to element)
        const localX = globalState.worldX - bounds.x;
        const localY = globalState.worldY - bounds.y;
        
        // Scale to logical canvas resolution (coordinates user code draws in)
        const logicalW = this._logicalWidth || (this.canvas.width / (this._dpr || 1));
        const logicalH = this._logicalHeight || (this.canvas.height / (this._dpr || 1));
        const scaleX = logicalW / bounds.width;
        const scaleY = logicalH / bounds.height;
        
        this.mouse.x = localX * scaleX;
        this.mouse.y = localY * scaleY;
        
        // Normalized (0-1)
        this.mouse.nx = Math.max(0, Math.min(1, localX / bounds.width));
        this.mouse.ny = Math.max(0, Math.min(1, localY / bounds.height));
        
        // Velocity (scaled to canvas space)
        this.mouse.vx = globalState.velocityX * scaleX;
        this.mouse.vy = globalState.velocityY * scaleY;
        
        // Button state - only register clicks when over element
        this.mouse.isDown = globalState.isDown && this.mouse.isOver;
        this.mouse.pressed = globalState.clicked && this.mouse.isOver;
        this.mouse.released = globalState.released; // Released can happen anywhere
        
        // Distance and angle from center
        const cx = logicalW / 2;
        const cy = logicalH / 2;
        const dx = this.mouse.x - cx;
        const dy = this.mouse.y - cy;
        const maxDist = Math.max(cx, cy);
        this.mouse.distFromCenter = Math.sqrt(dx * dx + dy * dy) / maxDist;
        this.mouse.angleFromCenter = Math.atan2(dy, dx);
        
        // Update legacy canvas properties for backward compatibility
        this.canvas.mouseX = this.mouse.x;
        this.canvas.mouseY = this.mouse.y;
        this.canvas.isMouseDown = this.mouse.isDown;
    }

    setCode(code) {
        this.userCode = code;
        if (this.isPlaying) {
            this.stop();
            this.play();
        }
    }

    play() {
        if (this.isPlaying || this.isDestroyed) return;
        this.isPlaying = true;
        
        // Subscribe to MouseStateManager
        if (!this.unsubscribeMouse) {
            this.unsubscribeMouse = mouseStateManager.subscribe(
                (state) => this._updateMouseState(state)
            );
        }
        
        // Initialize mouse props on canvas (legacy)
        const dpr = this._dpr || ((typeof window !== 'undefined' && window.devicePixelRatio) ? window.devicePixelRatio : 1);
        const logicalW = this._logicalWidth || (this.canvas.width / dpr);
        const logicalH = this._logicalHeight || (this.canvas.height / dpr);
        this.canvas.mouseX = logicalW / 2;
        this.canvas.mouseY = logicalH / 2;
        this.canvas.isMouseDown = false;

        this.run();
    }

    stop() {
        this.isPlaying = false;
        
        // Unsubscribe from MouseStateManager
        if (this.unsubscribeMouse) {
            this.unsubscribeMouse();
            this.unsubscribeMouse = null;
        }

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
    
    /**
     * Full cleanup - call when element is removed
     */
    destroy() {
        this.stop();
        this.isDestroyed = true;
        this.elementBounds = null;
    }

    resize(w, h) {
        const newW = Math.floor(w);
        const newH = Math.floor(h);

        const dpr = (typeof window !== 'undefined' && window.devicePixelRatio) ? window.devicePixelRatio : 1;
        const backingW = Math.max(1, Math.floor(newW * dpr));
        const backingH = Math.max(1, Math.floor(newH * dpr));

        const sizeChanged =
            this._logicalWidth !== newW ||
            this._logicalHeight !== newH ||
            this._dpr !== dpr ||
            this.canvas.width !== backingW ||
            this.canvas.height !== backingH;

        if (sizeChanged) {
            this._logicalWidth = newW;
            this._logicalHeight = newH;
            this._dpr = dpr;

            // Backing store size (for crisp rendering on HiDPI)
            this.canvas.width = backingW;
            this.canvas.height = backingH;

            // Logical coordinate space (avoid cumulative scaling)
            this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            
            // Force immediate redraw to prevent flickering
            if (this.drawFunction && this.isPlaying) {
                const time = (Date.now() - this.startTime) / 1000;
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

        // Ensure DPI transform is applied before any user drawing.
        const dpr = this._dpr || ((typeof window !== 'undefined' && window.devicePixelRatio) ? window.devicePixelRatio : 1);
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        // Clear canvas in logical coordinates
        const logicalW = this._logicalWidth || (this.canvas.width / dpr);
        const logicalH = this._logicalHeight || (this.canvas.height / dpr);
        this.ctx.clearRect(0, 0, logicalW, logicalH);

        try {
            // Create a safe-ish scope
            // We provide: ctx, canvas, width, height, time, mouse
            // User defines: draw(time) or setup()/draw()
            
            let func;
            let result;
            let success = false;
            
            // Reference to mouse for closure
            const mouse = this.mouse;

            // Attempt 1: Try to interpret as an object literal or expression returning an object
            // This handles cases like: { draw: function(t) { ... } }
            try {
                func = new Function('ctx', 'canvas', 'width', 'height', 'time', 'mouse', `return (${this.userCode}\n);`);
                result = func(this.ctx, this.canvas, logicalW, logicalH, 0, mouse);
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
                    func = new Function('ctx', 'canvas', 'width', 'height', 'time', 'mouse', `
                        ${this.userCode}
                        // Return a cleanup function if needed, or an object with draw method
                        if (typeof draw === 'function') return { draw };
                        return null;
                    `);
                    result = func(this.ctx, this.canvas, logicalW, logicalH, 0, mouse);
                } catch (e) {
                    console.error('Compilation error in user code:', e);
                    this.startErrorState();
                    return;
                }
            }

            // console.log('CodeRunner: Execution result', result);
            
            if (result && typeof result.draw === 'function') {
                // Call init() if it exists to initialize state
                if (typeof result.init === 'function') {
                    try {
                        result.init.call(result);
                    } catch (e) {
                        console.error('Error in init function:', e);
                    }
                }
                
                // Bind draw to the result object so 'this' works inside draw
                this.drawFunction = result.draw.bind(result);
                this.startTime = Date.now();
                // console.log('CodeRunner: Starting animation loop');
                
                const loop = () => {
                    if (!this.isPlaying) return;
                    
                    const time = (Date.now() - this.startTime) / 1000;
                    
                    // Reset transform before draw (DPR-aware, non-cumulative)
                    const dpr = this._dpr || ((typeof window !== 'undefined' && window.devicePixelRatio) ? window.devicePixelRatio : 1);
                    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
                    
                    // Reset single-frame mouse flags after they've been consumed
                    // (They persist for one frame so user code can detect them)
                    
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
                const dpr = this._dpr || ((typeof window !== 'undefined' && window.devicePixelRatio) ? window.devicePixelRatio : 1);
                this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
                this.drawErrorState(time);
                this.animationFrame = requestAnimationFrame(loop);
            };
            loop();
        }
    }

    drawErrorState(t) {
        const dpr = this._dpr || ((typeof window !== 'undefined' && window.devicePixelRatio) ? window.devicePixelRatio : 1);
        const w = this._logicalWidth || (this.canvas.width / dpr);
        const h = this._logicalHeight || (this.canvas.height / dpr);
        const ctx = this.ctx;

        // Matrix Rain Effect
        // Semi-transparent black to create trails
        ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        ctx.fillRect(0, 0, w, h);

        const fontSize = 14;
        ctx.font = `${fontSize}px monospace`;
        const columns = Math.floor(w / fontSize);
        
        const glyphs = 'アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブヅプエェケセテネヘメレヱゲゼデベペオォコソトノホモヨョロヲゴゾドボポヴッンABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

        // Initialize drops
        if (!this.drops || this.drops.length !== columns) {
            this.drops = [];
            for (let x = 0; x < columns; x++) {
                this.drops[x] = 1;
            }
        }

        ctx.fillStyle = '#0F0'; // Green text
        for (let i = 0; i < this.drops.length; i++) {
            const text = glyphs.charAt(Math.floor(Math.random() * glyphs.length));
            ctx.fillText(text, i * fontSize, this.drops[i] * fontSize);

            // Reset drop to top randomly after it crosses bottom
            if (this.drops[i] * fontSize > h && Math.random() > 0.975) {
                this.drops[i] = 0;
            }
            this.drops[i]++;
        }

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
    
    /**
     * Capture a single frame from code fill
     * Creates a temporary canvas, runs the code once at t=0, and returns the canvas
     * @param {string} code - The user code to execute
     * @param {number} width - Canvas width
     * @param {number} height - Canvas height
     * @param {number} [time=0] - Time value to pass to draw function
     * @returns {HTMLCanvasElement|null} - Canvas with rendered frame, or null on error
     */
    static captureFrame(code, width, height, time = 0) {
        if (!code) return null;
        
        const canvas = document.createElement('canvas');
        canvas.width = Math.floor(width);
        canvas.height = Math.floor(height);
        const ctx = canvas.getContext('2d');
        
        // Create mock mouse object
        const mouse = { x: 0, y: 0, isDown: false };
        
        try {
            let func;
            let result;
            let success = false;
            
            // Attempt 1: Try to interpret as an object literal
            try {
                func = new Function('ctx', 'canvas', 'width', 'height', 'time', 'mouse', `return (${code}\n);`);
                result = func(ctx, canvas, canvas.width, canvas.height, time, mouse);
                if (result && typeof result.draw === 'function') {
                    success = true;
                }
            } catch (e) {
                // Fall back to statement mode
            }
            
            // Attempt 2: Interpret as statements
            if (!success) {
                try {
                    func = new Function('ctx', 'canvas', 'width', 'height', 'time', 'mouse', `
                        ${code}
                        if (typeof draw === 'function') return { draw };
                        return null;
                    `);
                    result = func(ctx, canvas, canvas.width, canvas.height, time, mouse);
                } catch (e) {
                    console.warn('CodeRunner.captureFrame: Compilation error', e);
                    return null;
                }
            }
            
            if (result && typeof result.draw === 'function') {
                // Call init() if it exists
                if (typeof result.init === 'function') {
                    try {
                        result.init.call(result);
                    } catch (e) {
                        console.warn('CodeRunner.captureFrame: Error in init', e);
                    }
                }
                
                // Reset transform and draw single frame
                try {
                    if (ctx.setTransform) {
                        ctx.setTransform(1, 0, 0, 1, 0, 0);
                    }
                } catch (e) {
                    // Ignore transform errors (may happen in test environments)
                }
                
                try {
                    result.draw.call(result, time);
                } catch (e) {
                    console.warn('CodeRunner.captureFrame: Error in draw', e);
                    // Still return the canvas even if draw failed
                }
                
                // Call cleanup if provided
                if (typeof result.cleanup === 'function') {
                    try {
                        result.cleanup.call(result);
                    } catch (e) {
                        // Ignore cleanup errors
                    }
                }
                
                return canvas;
            }
            
            return null;
        } catch (e) {
            console.warn('CodeRunner.captureFrame: Runtime error', e);
            return null;
        }
    }
}
