/**
 * CodeFill Presets - Built-in preset library for dynamic canvas fills
 */

export const CODEFILL_PRESETS = [
    {
        id: 'mesh-gradient',
        name: 'Mesh Gradient',
        description: 'Smooth animated color blending with floating orbs',
        category: 'built-in',
        code: `return {
    colors: [
        [255, 77, 0],    // Orange
        [0, 84, 255],    // Blue
        [0, 255, 64],    // Green
        [255, 0, 128]    // Pink
    ],
    draw: function(t) {
        const w = canvas.width;
        const h = canvas.height;
        
        // Create image data for pixel manipulation
        const imageData = ctx.createImageData(w, h);
        const data = imageData.data;
        
        const time = t * 0.2;
        
        // Control points that move over time
        const points = [
            { x: 0.2 + 0.3 * Math.sin(time), y: 0.2 + 0.3 * Math.cos(time * 1.2) },
            { x: 0.8 - 0.3 * Math.cos(time * 0.8), y: 0.2 + 0.3 * Math.sin(time) },
            { x: 0.2 + 0.3 * Math.sin(time * 0.5), y: 0.8 - 0.3 * Math.cos(time * 0.9) },
            { x: 0.8 - 0.3 * Math.cos(time * 0.7), y: 0.8 + 0.3 * Math.sin(time * 1.1) }
        ];
        
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const sx = x / w;
                const sy = y / h;
                
                // Calculate weighted color blend based on distance to control points
                let totalWeight = 0;
                let r = 0, g = 0, b = 0;
                
                for (let i = 0; i < 4; i++) {
                    const dx = sx - points[i].x;
                    const dy = sy - points[i].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    const weight = 1 / (dist * dist + 0.001);
                    
                    r += this.colors[i][0] * weight;
                    g += this.colors[i][1] * weight;
                    b += this.colors[i][2] * weight;
                    totalWeight += weight;
                }
                
                const idx = (y * w + x) * 4;
                data[idx] = Math.min(255, r / totalWeight);
                data[idx + 1] = Math.min(255, g / totalWeight);
                data[idx + 2] = Math.min(255, b / totalWeight);
                data[idx + 3] = 255;
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
    }
};`
    },
    {
        id: 'gradient-wave',
        name: 'Gradient Wave',
        description: 'Flowing gradient with wave animation',
        category: 'built-in',
        code: `return {
    draw: function(t) {
        const w = canvas.width;
        const h = canvas.height;
        
        // Animated gradient angle
        const angle = t * 0.1;
        const x1 = w/2 + Math.cos(angle) * w;
        const y1 = h/2 + Math.sin(angle) * h;
        const x2 = w/2 - Math.cos(angle) * w;
        const y2 = h/2 - Math.sin(angle) * h;
        
        const grd = ctx.createLinearGradient(x1, y1, x2, y2);
        
        // Animated color stops
        const hue1 = (t * 20) % 360;
        const hue2 = (hue1 + 60) % 360;
        const hue3 = (hue1 + 180) % 360;
        
        grd.addColorStop(0, \`hsl(\${hue1}, 70%, 60%)\`);
        grd.addColorStop(0.5, \`hsl(\${hue2}, 80%, 50%)\`);
        grd.addColorStop(1, \`hsl(\${hue3}, 70%, 60%)\`);
        
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, w, h);
    }
};`
    },
    {
        id: 'particles',
        name: 'Floating Particles',
        description: 'Gentle floating particle system',
        category: 'built-in',
        code: `return {
    particles: null,
    init: function() {
        this.particles = [];
        for (let i = 0; i < 50; i++) {
            this.particles.push({
                x: Math.random(),
                y: Math.random(),
                size: Math.random() * 20 + 5,
                speed: Math.random() * 0.02 + 0.005,
                offset: Math.random() * Math.PI * 2
            });
        }
    },
    draw: function(t) {
        if (!this.particles) this.init();
        
        const w = canvas.width;
        const h = canvas.height;
        
        // Background gradient
        const grd = ctx.createLinearGradient(0, 0, w, h);
        grd.addColorStop(0, '#1a1a2e');
        grd.addColorStop(1, '#16213e');
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, w, h);
        
        // Draw particles
        this.particles.forEach(p => {
            const x = p.x * w + Math.sin(t * p.speed * 10 + p.offset) * 30;
            const y = ((p.y + t * p.speed) % 1.2 - 0.1) * h;
            
            ctx.save();
            ctx.filter = 'blur(2px)';
            ctx.beginPath();
            ctx.arc(x, y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = \`rgba(255, 255, 255, \${0.1 + Math.sin(t + p.offset) * 0.05})\`;
            ctx.fill();
            ctx.restore();
        });
    }
};`
    },
    {
        id: 'aurora',
        name: 'Aurora',
        description: 'Northern lights inspired flowing effect',
        category: 'built-in',
        code: `return {
    draw: function(t) {
        const w = canvas.width;
        const h = canvas.height;
        
        // Dark background
        ctx.fillStyle = '#0a0a1a';
        ctx.fillRect(0, 0, w, h);
        
        // Draw aurora bands
        const bands = 5;
        for (let i = 0; i < bands; i++) {
            ctx.save();
            ctx.filter = 'blur(20px)';
            
            ctx.beginPath();
            ctx.moveTo(0, h * 0.3);
            
            for (let x = 0; x <= w; x += 10) {
                const noise = Math.sin(x * 0.01 + t * 0.5 + i) * 50 +
                             Math.sin(x * 0.02 + t * 0.3 + i * 2) * 30;
                const y = h * 0.4 + noise + i * 40;
                ctx.lineTo(x, y);
            }
            
            ctx.lineTo(w, h);
            ctx.lineTo(0, h);
            ctx.closePath();
            
            const hue = 120 + i * 20 + Math.sin(t * 0.2) * 20;
            ctx.fillStyle = \`hsla(\${hue}, 80%, 50%, 0.15)\`;
            ctx.fill();
            ctx.restore();
        }
    }
};`
    },
    {
        id: 'bokeh',
        name: 'Bokeh',
        description: 'Soft focus light circles',
        category: 'built-in',
        code: `return {
    circles: null,
    init: function() {
        this.circles = [];
        for (let i = 0; i < 20; i++) {
            this.circles.push({
                x: Math.random(),
                y: Math.random(),
                size: Math.random() * 80 + 30,
                hue: Math.random() * 60 + 180,
                speed: Math.random() * 0.1 + 0.05,
                offset: Math.random() * Math.PI * 2
            });
        }
    },
    draw: function(t) {
        if (!this.circles) this.init();
        
        const w = canvas.width;
        const h = canvas.height;
        
        // Dark gradient background
        const grd = ctx.createRadialGradient(w/2, h/2, 0, w/2, h/2, w);
        grd.addColorStop(0, '#1a1a2e');
        grd.addColorStop(1, '#0f0f1a');
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, w, h);
        
        // Draw bokeh circles
        this.circles.forEach(c => {
            const x = c.x * w + Math.sin(t * c.speed + c.offset) * 50;
            const y = c.y * h + Math.cos(t * c.speed * 0.7 + c.offset) * 30;
            
            ctx.save();
            ctx.filter = \`blur(\${c.size * 0.3}px)\`;
            
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, c.size);
            gradient.addColorStop(0, \`hsla(\${c.hue}, 70%, 60%, 0.4)\`);
            gradient.addColorStop(0.5, \`hsla(\${c.hue}, 70%, 60%, 0.1)\`);
            gradient.addColorStop(1, 'transparent');
            
            ctx.beginPath();
            ctx.arc(x, y, c.size, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();
            ctx.restore();
        });
    }
};`
    },
    {
        id: 'plasma',
        name: 'Plasma',
        description: 'Classic plasma effect with flowing colors',
        category: 'built-in',
        code: `return {
    draw: function(t) {
        const w = canvas.width;
        const h = canvas.height;
        const imageData = ctx.createImageData(w, h);
        const data = imageData.data;
        
        const time = t * 0.5;
        
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const v1 = Math.sin(x * 0.02 + time);
                const v2 = Math.sin((y * 0.02 + time) / 2);
                const v3 = Math.sin((x * 0.02 + y * 0.02 + time) / 2);
                const v4 = Math.sin(Math.sqrt(x * x + y * y) * 0.01 + time);
                
                const v = (v1 + v2 + v3 + v4) / 4;
                
                const idx = (y * w + x) * 4;
                data[idx] = Math.sin(v * Math.PI) * 127 + 128;
                data[idx + 1] = Math.sin(v * Math.PI + 2) * 127 + 128;
                data[idx + 2] = Math.sin(v * Math.PI + 4) * 127 + 128;
                data[idx + 3] = 255;
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
    }
};`
    },
    {
        id: 'geometric',
        name: 'Geometric',
        description: 'Animated geometric pattern',
        category: 'built-in',
        code: `return {
    draw: function(t) {
        const w = canvas.width;
        const h = canvas.height;
        
        // Background
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, w, h);
        
        const size = 60;
        const cols = Math.ceil(w / size) + 1;
        const rows = Math.ceil(h / size) + 1;
        
        ctx.strokeStyle = 'rgba(100, 150, 255, 0.3)';
        ctx.lineWidth = 1;
        
        for (let i = 0; i < cols; i++) {
            for (let j = 0; j < rows; j++) {
                const x = i * size;
                const y = j * size;
                const offset = Math.sin(t + i * 0.3 + j * 0.2) * 10;
                
                ctx.save();
                ctx.translate(x + size/2, y + size/2);
                ctx.rotate(t * 0.2 + (i + j) * 0.1);
                
                // Draw rotating squares
                const scale = 0.5 + Math.sin(t * 0.5 + i + j) * 0.2;
                ctx.beginPath();
                ctx.rect(-size/4 * scale, -size/4 * scale, size/2 * scale, size/2 * scale);
                ctx.stroke();
                
                // Inner circle
                ctx.beginPath();
                ctx.arc(0, 0, size/6 * scale, 0, Math.PI * 2);
                ctx.fillStyle = \`rgba(100, 200, 255, \${0.1 + Math.sin(t + i + j) * 0.05})\`;
                ctx.fill();
                
                ctx.restore();
            }
        }
    }
};`
    },
    {
        id: 'noise-flow',
        name: 'Noise Flow',
        description: 'Organic flowing noise pattern',
        category: 'built-in',
        code: `return {
    // Simple noise function
    noise: function(x, y, t) {
        const n = Math.sin(x * 0.01 + t) * Math.cos(y * 0.01 + t * 0.7) +
                  Math.sin((x + y) * 0.02 + t * 0.5) * 0.5 +
                  Math.sin(Math.sqrt(x * x + y * y) * 0.01 - t * 0.3) * 0.3;
        return (n + 1.5) / 3;
    },
    draw: function(t) {
        const w = canvas.width;
        const h = canvas.height;
        
        const step = 4; // Lower = higher quality, slower
        for (let y = 0; y < h; y += step) {
            for (let x = 0; x < w; x += step) {
                const n = this.noise(x, y, t * 0.5);
                const hue = 200 + n * 60;
                const lightness = 20 + n * 40;
                
                ctx.fillStyle = \`hsl(\${hue}, 60%, \${lightness}%)\`;
                ctx.fillRect(x, y, step, step);
            }
        }
    }
};`
    },
    // ===== INTERACTIVE PRESETS (Mouse-Reactive) =====
    {
        id: 'mouse-trail',
        name: 'Mouse Trail',
        description: 'Glowing particles follow your cursor with trailing effect',
        category: 'interactive',
        code: `return {
    init: function() {
        this.particles = [];
        this.maxParticles = 50;
    },
    draw: function(t) {
        const w = canvas.width;
        const h = canvas.height;
        
        // Fade previous frame
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.fillRect(0, 0, w, h);
        
        // Add new particle at mouse position if moving
        if (mouse.isOver && (mouse.vx !== 0 || mouse.vy !== 0)) {
            this.particles.push({
                x: mouse.x,
                y: mouse.y,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                life: 1,
                hue: (t * 50) % 360,
                size: 5 + Math.random() * 10
            });
        }
        
        // Limit particles
        while (this.particles.length > this.maxParticles) {
            this.particles.shift();
        }
        
        // Update and draw particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.02;
            p.size *= 0.98;
            
            if (p.life <= 0) {
                this.particles.splice(i, 1);
                continue;
            }
            
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = \`hsla(\${p.hue}, 100%, 60%, \${p.life})\`;
            ctx.fill();
        }
        
        // Draw cursor glow
        if (mouse.isOver) {
            const gradient = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 30);
            gradient.addColorStop(0, \`hsla(\${(t * 50) % 360}, 100%, 70%, 0.8)\`);
            gradient.addColorStop(1, 'transparent');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(mouse.x, mouse.y, 30, 0, Math.PI * 2);
            ctx.fill();
        }
    }
};`
    },
    {
        id: 'click-ripple',
        name: 'Click Ripple',
        description: 'Beautiful ripples expand from each click location',
        category: 'interactive',
        code: `return {
    init: function() {
        this.ripples = [];
    },
    draw: function(t) {
        const w = canvas.width;
        const h = canvas.height;
        
        // Dark background with slight fade
        ctx.fillStyle = 'rgba(10, 10, 20, 0.15)';
        ctx.fillRect(0, 0, w, h);
        
        // Add new ripple on click
        if (mouse.pressed) {
            this.ripples.push({
                x: mouse.x,
                y: mouse.y,
                radius: 0,
                maxRadius: Math.max(w, h) * 0.6,
                hue: Math.random() * 360,
                birth: t
            });
        }
        
        // Draw and update ripples
        for (let i = this.ripples.length - 1; i >= 0; i--) {
            const r = this.ripples[i];
            const age = t - r.birth;
            r.radius = age * 200;
            
            if (r.radius > r.maxRadius) {
                this.ripples.splice(i, 1);
                continue;
            }
            
            const alpha = 1 - (r.radius / r.maxRadius);
            
            // Draw multiple rings
            for (let ring = 0; ring < 3; ring++) {
                const ringRadius = r.radius - ring * 15;
                if (ringRadius > 0) {
                    ctx.beginPath();
                    ctx.arc(r.x, r.y, ringRadius, 0, Math.PI * 2);
                    ctx.strokeStyle = \`hsla(\${r.hue + ring * 20}, 80%, 60%, \${alpha * 0.6})\`;
                    ctx.lineWidth = 3 - ring;
                    ctx.stroke();
                }
            }
        }
        
        // Ambient glow at cursor
        if (mouse.isOver) {
            const gradient = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 50);
            gradient.addColorStop(0, 'rgba(100, 150, 255, 0.3)');
            gradient.addColorStop(1, 'transparent');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(mouse.x, mouse.y, 50, 0, Math.PI * 2);
            ctx.fill();
        }
    }
};`
    },
    {
        id: 'magnetic-field',
        name: 'Magnetic Field',
        description: 'Field lines are attracted to cursor position',
        category: 'interactive',
        code: `return {
    init: function() {
        this.particles = [];
        const count = 100;
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                baseX: Math.random() * canvas.width,
                baseY: Math.random() * canvas.height,
                size: 2 + Math.random() * 3
            });
        }
    },
    draw: function(t) {
        const w = canvas.width;
        const h = canvas.height;
        
        // Dark background
        ctx.fillStyle = 'rgba(5, 5, 15, 0.2)';
        ctx.fillRect(0, 0, w, h);
        
        const mouseX = mouse.isOver ? mouse.x : w / 2;
        const mouseY = mouse.isOver ? mouse.y : h / 2;
        const attraction = mouse.isDown ? 0.15 : 0.05;
        
        // Update and draw particles
        for (const p of this.particles) {
            // Attraction to mouse
            const dx = mouseX - p.x;
            const dy = mouseY - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const force = Math.min(attraction / (dist * 0.01 + 0.1), 5);
            
            p.x += dx * force * 0.02;
            p.y += dy * force * 0.02;
            
            // Spring back to base position
            p.x += (p.baseX - p.x) * 0.01;
            p.y += (p.baseY - p.y) * 0.01;
            
            // Draw particle
            const alpha = 0.5 + 0.5 * (1 - Math.min(dist / 300, 1));
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = \`rgba(100, 180, 255, \${alpha})\`;
            ctx.fill();
            
            // Draw line to mouse if close
            if (dist < 200 && mouse.isOver) {
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(mouseX, mouseY);
                ctx.strokeStyle = \`rgba(100, 180, 255, \${0.1 * (1 - dist / 200)})\`;
                ctx.lineWidth = 1;
                ctx.stroke();
            }
        }
        
        // Mouse glow
        if (mouse.isOver) {
            const glowSize = mouse.isDown ? 40 : 20;
            const gradient = ctx.createRadialGradient(mouseX, mouseY, 0, mouseX, mouseY, glowSize);
            gradient.addColorStop(0, 'rgba(150, 200, 255, 0.8)');
            gradient.addColorStop(1, 'transparent');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(mouseX, mouseY, glowSize, 0, Math.PI * 2);
            ctx.fill();
        }
    }
};`
    },
    {
        id: 'paint-brush',
        name: 'Paint Brush',
        description: 'Draw colorful strokes by clicking and dragging',
        category: 'interactive',
        code: `return {
    init: function() {
        this.lastX = null;
        this.lastY = null;
        this.hue = 0;
    },
    draw: function(t) {
        const w = canvas.width;
        const h = canvas.height;
        
        // Initial fill on first frame
        if (this.lastX === null) {
            ctx.fillStyle = '#0a0a15';
            ctx.fillRect(0, 0, w, h);
        }
        
        // Draw when mouse is down and moving
        if (mouse.isDown && mouse.isOver) {
            if (this.lastX !== null) {
                ctx.beginPath();
                ctx.moveTo(this.lastX, this.lastY);
                ctx.lineTo(mouse.x, mouse.y);
                
                // Dynamic line width based on velocity
                const speed = Math.sqrt(mouse.vx * mouse.vx + mouse.vy * mouse.vy);
                const lineWidth = Math.max(2, 30 - speed * 0.05);
                
                ctx.lineWidth = lineWidth;
                ctx.lineCap = 'round';
                ctx.strokeStyle = \`hsl(\${this.hue}, 80%, 60%)\`;
                ctx.stroke();
                
                // Glow effect
                ctx.lineWidth = lineWidth * 2;
                ctx.strokeStyle = \`hsla(\${this.hue}, 80%, 60%, 0.3)\`;
                ctx.stroke();
                
                this.hue = (this.hue + 1) % 360;
            }
            this.lastX = mouse.x;
            this.lastY = mouse.y;
        } else {
            this.lastX = null;
            this.lastY = null;
        }
        
        // Cursor indicator
        if (mouse.isOver) {
            ctx.beginPath();
            ctx.arc(mouse.x, mouse.y, mouse.isDown ? 8 : 5, 0, Math.PI * 2);
            ctx.fillStyle = \`hsl(\${this.hue}, 80%, 70%)\`;
            ctx.fill();
        }
    }
};`
    },
    {
        id: 'gravity-balls',
        name: 'Gravity Balls',
        description: 'Bouncing balls attracted to your cursor',
        category: 'interactive',
        code: `return {
    init: function() {
        this.balls = [];
        for (let i = 0; i < 20; i++) {
            this.balls.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * 5,
                vy: (Math.random() - 0.5) * 5,
                radius: 10 + Math.random() * 20,
                hue: Math.random() * 360
            });
        }
    },
    draw: function(t) {
        const w = canvas.width;
        const h = canvas.height;
        
        // Clear with fade
        ctx.fillStyle = 'rgba(10, 10, 25, 0.3)';
        ctx.fillRect(0, 0, w, h);
        
        const gravityX = mouse.isOver ? mouse.x : w / 2;
        const gravityY = mouse.isOver ? mouse.y : h / 2;
        const gravityStrength = mouse.isDown ? 0.5 : 0.1;
        
        for (const ball of this.balls) {
            // Gravity towards mouse
            const dx = gravityX - ball.x;
            const dy = gravityY - ball.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            ball.vx += (dx / dist) * gravityStrength;
            ball.vy += (dy / dist) * gravityStrength;
            
            // Apply velocity
            ball.x += ball.vx;
            ball.y += ball.vy;
            
            // Friction
            ball.vx *= 0.98;
            ball.vy *= 0.98;
            
            // Bounce off walls
            if (ball.x < ball.radius) { ball.x = ball.radius; ball.vx *= -0.8; }
            if (ball.x > w - ball.radius) { ball.x = w - ball.radius; ball.vx *= -0.8; }
            if (ball.y < ball.radius) { ball.y = ball.radius; ball.vy *= -0.8; }
            if (ball.y > h - ball.radius) { ball.y = h - ball.radius; ball.vy *= -0.8; }
            
            // Draw ball
            const gradient = ctx.createRadialGradient(
                ball.x - ball.radius * 0.3, ball.y - ball.radius * 0.3, 0,
                ball.x, ball.y, ball.radius
            );
            gradient.addColorStop(0, \`hsl(\${ball.hue}, 80%, 70%)\`);
            gradient.addColorStop(1, \`hsl(\${ball.hue}, 80%, 30%)\`);
            
            ctx.beginPath();
            ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();
        }
    }
};`
    }
];

/**
 * Get all built-in presets
 */
export function getBuiltInPresets() {
    return CODEFILL_PRESETS;
}

/**
 * Get a preset by ID
 */
export function getPresetById(id) {
    return CODEFILL_PRESETS.find(p => p.id === id);
}

/**
 * Get default/first preset
 */
export function getDefaultPreset() {
    return CODEFILL_PRESETS[0];
}
