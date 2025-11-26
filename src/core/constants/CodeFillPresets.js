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
