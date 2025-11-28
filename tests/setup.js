/**
 * Test Setup
 * 
 * Global test configuration and mocks.
 */

import { vi } from 'vitest';

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

// Mock window.location
delete global.window;
global.window = {
    location: {
        origin: 'http://localhost:3000',
        href: 'http://localhost:3000'
    }
};
