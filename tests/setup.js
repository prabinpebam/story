/**
 * Test Setup
 * 
 * Global test configuration and mocks.
 */

import { vi } from 'vitest';
import JSZip from 'jszip';

// ---------------------------------------------------------------------------
// JSDOM Polyfills
// ---------------------------------------------------------------------------

// ResizeObserver is used by thumbnail/layout rendering; jsdom doesn't provide it.
if (typeof globalThis.ResizeObserver === 'undefined') {
    globalThis.ResizeObserver = class ResizeObserver {
        constructor(callback) {
            this._callback = callback;
        }
        observe() {
            // No-op in tests; callers should handle initial sizing.
        }
        unobserve() {}
        disconnect() {}
    };
}

// Some UI code calls scrollIntoView; jsdom doesn't implement it.
if (typeof globalThis.HTMLElement !== 'undefined' && !globalThis.HTMLElement.prototype.scrollIntoView) {
    globalThis.HTMLElement.prototype.scrollIntoView = function() {};
}

// Canvas getContext is not implemented by jsdom by default.
const createMock2dContext = () => {
    const imageData = { data: new Uint8ClampedArray([0, 0, 0, 255]), width: 1, height: 1 };
    return {
        canvas: null,
        fillStyle: '#000000',
        strokeStyle: '#000000',
        globalAlpha: 1,
        lineWidth: 1,
        font: '12px sans-serif',
        textAlign: 'left',
        textBaseline: 'alphabetic',

        save: vi.fn(),
        restore: vi.fn(),
        beginPath: vi.fn(),
        closePath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        rect: vi.fn(),
        arc: vi.fn(),
        stroke: vi.fn(),
        fill: vi.fn(),
        clearRect: vi.fn(),
        fillRect: vi.fn(),
        strokeRect: vi.fn(),
        translate: vi.fn(),
        scale: vi.fn(),
        rotate: vi.fn(),
        setTransform: vi.fn(),
        resetTransform: vi.fn(),
        setLineDash: vi.fn(),
        drawImage: vi.fn(),
        fillText: vi.fn(),
        strokeText: vi.fn(),
        measureText: vi.fn(() => ({ width: 0 })),
        getImageData: vi.fn(() => imageData),
        putImageData: vi.fn(),
        createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
        createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
        createPattern: vi.fn(() => null)
    };
};

if (typeof globalThis.HTMLCanvasElement !== 'undefined') {
    // Override jsdom's not-implemented getContext.
    globalThis.HTMLCanvasElement.prototype.getContext = function(type) {
        if (type !== '2d') return null;
        const ctx = createMock2dContext();
        ctx.canvas = this;
        return ctx;
    };

    if (!globalThis.HTMLCanvasElement.prototype.toDataURL) {
        globalThis.HTMLCanvasElement.prototype.toDataURL = function() {
            return 'data:image/png;base64,';
        };
    }
}

// Some drag/drop code calls dataTransfer.setDragImage.
if (typeof globalThis.DataTransfer !== 'undefined' && !globalThis.DataTransfer.prototype.setDragImage) {
    globalThis.DataTransfer.prototype.setDragImage = function() {};
}

// Make JSZip available globally for modules that use window.JSZip
global.JSZip = JSZip;
if (typeof window !== 'undefined') {
    window.JSZip = JSZip;
}

// Mock localStorage
global.localStorage = {
    data: {},
    getItem(key) {
        return this.data[key] || null;
    },
    setItem(key, value) {
        this.data[key] = value;
    },
    removeItem(key) {
        delete this.data[key];
    },
    clear() {
        this.data = {};
    }
};

// Mock sessionStorage
global.sessionStorage = {
    data: {},
    getItem(key) {
        return this.data[key] || null;
    },
    setItem(key, value) {
        this.data[key] = value;
    },
    removeItem(key) {
        delete this.data[key];
    },
    clear() {
        this.data = {};
    }
};

// Mock BroadcastChannel
global.BroadcastChannel = class BroadcastChannel {
    constructor(name) {
        this.name = name;
        this.onmessage = null;
    }
    
    postMessage(data) {
        // Simulate async message delivery
        setTimeout(() => {
            if (this.onmessage) {
                this.onmessage({ data });
            }
        }, 0);
    }
    
    close() {
        this.onmessage = null;
    }
};

// Mock crypto.subtle for PKCE tests
if (!global.crypto) {
    global.crypto = {};
}

if (!global.crypto.getRandomValues) {
    global.crypto.getRandomValues = (buffer) => {
        for (let i = 0; i < buffer.length; i++) {
            buffer[i] = Math.floor(Math.random() * 256);
        }
        return buffer;
    };
}

if (!global.crypto.subtle) {
    global.crypto.subtle = {
        async digest(algorithm, data) {
            // Simple mock hash (not cryptographically secure, just for testing)
            const str = new TextDecoder().decode(data);
            let hash = 0;
            for (let i = 0; i < str.length; i++) {
                hash = ((hash << 5) - hash) + str.charCodeAt(i);
                hash = hash & hash;
            }
            const buffer = new ArrayBuffer(32);
            const view = new DataView(buffer);
            view.setInt32(0, hash);
            return buffer;
        }
    };
}

// Extend window with additional mocks (don't overwrite jsdom's window)
if (global.window) {
    // Set mock location properties
    Object.defineProperty(global.window, 'location', {
        value: {
            origin: 'http://localhost:3000',
            href: 'http://localhost:3000',
            pathname: '/',
            search: '',
            hash: ''
        },
        writable: true
    });
}

// Mock Web Animations API (not supported in jsdom)
if (typeof Element !== 'undefined' && !Element.prototype.animate) {
    Element.prototype.animate = function(keyframes, options) {
        const animation = {
            onfinish: null,
            oncancel: null,
            finished: Promise.resolve(),
            cancel: function() {
                if (this.oncancel) this.oncancel();
            },
            finish: function() {
                if (this.onfinish) this.onfinish();
            },
            play: function() {},
            pause: function() {},
            reverse: function() {},
            currentTime: 0,
            playbackRate: 1,
            playState: 'finished'
        };
        // Immediately call onfinish to simulate completed animation
        setTimeout(() => {
            if (animation.onfinish) animation.onfinish();
        }, 0);
        return animation;
    };
}
