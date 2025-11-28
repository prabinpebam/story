import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LaserPointer } from '../../../src/core/LaserPointer.js';

describe('LaserPointer', () => {
    let laserPointer;
    let mockCanvas;
    let mockCtx;
    let addEventListenerSpy;

    beforeEach(() => {
        // Create mock canvas and context
        mockCtx = {
            clearRect: vi.fn(),
            beginPath: vi.fn(),
            moveTo: vi.fn(),
            lineTo: vi.fn(),
            stroke: vi.fn(),
            arc: vi.fn(),
            fill: vi.fn(),
            scale: vi.fn(),
            strokeStyle: '',
            fillStyle: '',
            lineWidth: 0,
            lineCap: '',
            lineJoin: ''
        };

        mockCanvas = {
            getContext: vi.fn().mockReturnValue(mockCtx),
            width: 0,
            height: 0,
            style: {}
        };

        // Mock document.getElementById
        vi.spyOn(document, 'getElementById').mockReturnValue(mockCanvas);

        // Mock window dimensions
        vi.stubGlobal('innerWidth', 1920);
        vi.stubGlobal('innerHeight', 1080);
        vi.stubGlobal('devicePixelRatio', 1);

        // Mock requestAnimationFrame
        vi.stubGlobal('requestAnimationFrame', vi.fn((cb) => {
            return 1; // Return a frame ID
        }));

        vi.stubGlobal('cancelAnimationFrame', vi.fn());

        // Mock window.addEventListener - MUST be before creating LaserPointer
        addEventListenerSpy = vi.fn();
        vi.stubGlobal('addEventListener', addEventListenerSpy);

        laserPointer = new LaserPointer('laser-canvas');
    });

    afterEach(() => {
        if (laserPointer) {
            laserPointer.stop();
        }
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    describe('constructor', () => {
        it('should get canvas element by ID', () => {
            expect(document.getElementById).toHaveBeenCalledWith('laser-canvas');
        });

        it('should get 2D rendering context', () => {
            expect(mockCanvas.getContext).toHaveBeenCalledWith('2d');
        });

        it('should initialize with empty points array', () => {
            expect(laserPointer.points).toEqual([]);
        });

        it('should initialize with isActive set to false', () => {
            expect(laserPointer.isActive).toBe(false);
        });

        it('should initialize with null animationFrame', () => {
            expect(laserPointer.animationFrame).toBe(null);
        });

        it('should set default configuration values', () => {
            expect(laserPointer.trailLength).toBe(20);
            expect(laserPointer.color).toBe('#FF0000');
            expect(laserPointer.lineWidth).toBe(4);
        });

        it('should call resize on initialization', () => {
            expect(laserPointer.width).toBe(1920);
            expect(laserPointer.height).toBe(1080);
        });
    });

    describe('resize()', () => {
        it('should set canvas dimensions to window size', () => {
            laserPointer.resize();

            expect(laserPointer.width).toBe(1920);
            expect(laserPointer.height).toBe(1080);
        });

        it('should handle high DPI displays', () => {
            vi.stubGlobal('devicePixelRatio', 2);

            laserPointer.resize();

            expect(mockCanvas.width).toBe(3840); // 1920 * 2
            expect(mockCanvas.height).toBe(2160); // 1080 * 2
            expect(mockCtx.scale).toHaveBeenCalledWith(2, 2);
        });

        it('should set canvas CSS size', () => {
            laserPointer.resize();

            expect(mockCanvas.style.width).toBe('1920px');
            expect(mockCanvas.style.height).toBe('1080px');
        });

        it('should handle missing canvas gracefully', () => {
            laserPointer.canvas = null;

            expect(() => laserPointer.resize()).not.toThrow();
        });

        it('should update on window resize', () => {
            vi.stubGlobal('innerWidth', 2560);
            vi.stubGlobal('innerHeight', 1440);

            laserPointer.resize();

            expect(laserPointer.width).toBe(2560);
            expect(laserPointer.height).toBe(1440);
        });
    });

    describe('start()', () => {
        it('should set isActive to true', () => {
            laserPointer.start();

            expect(laserPointer.isActive).toBe(true);
        });

        it('should clear points array', () => {
            laserPointer.points = [{ x: 100, y: 100, age: 0 }];
            laserPointer.start();

            expect(laserPointer.points).toEqual([]);
        });

        it('should start animation loop', () => {
            laserPointer.start();

            expect(requestAnimationFrame).toHaveBeenCalled();
        });
    });

    describe('stop()', () => {
        it('should set isActive to false', () => {
            laserPointer.start();
            laserPointer.stop();

            expect(laserPointer.isActive).toBe(false);
        });

        it('should cancel animation frame', () => {
            laserPointer.start();
            laserPointer.animationFrame = 123;
            laserPointer.stop();

            expect(cancelAnimationFrame).toHaveBeenCalledWith(123);
        });

        it('should clear the canvas', () => {
            laserPointer.stop();

            expect(mockCtx.clearRect).toHaveBeenCalled();
        });
    });

    describe('clear()', () => {
        it('should clear the entire canvas', () => {
            laserPointer.width = 1920;
            laserPointer.height = 1080;
            laserPointer.clear();

            expect(mockCtx.clearRect).toHaveBeenCalledWith(0, 0, 1920, 1080);
        });
    });

    describe('addPoint()', () => {
        it('should not add point when inactive', () => {
            laserPointer.isActive = false;
            laserPointer.addPoint(100, 200);

            expect(laserPointer.points).toEqual([]);
        });

        it('should add point when active', () => {
            laserPointer.isActive = true;
            laserPointer.addPoint(100, 200);

            expect(laserPointer.points).toHaveLength(1);
            expect(laserPointer.points[0]).toEqual({ x: 100, y: 200, age: 0 });
        });

        it('should add multiple points', () => {
            laserPointer.isActive = true;
            laserPointer.addPoint(100, 100);
            laserPointer.addPoint(150, 150);
            laserPointer.addPoint(200, 200);

            expect(laserPointer.points).toHaveLength(3);
        });

        it('should limit points to trail length', () => {
            laserPointer.isActive = true;
            laserPointer.trailLength = 5;

            for (let i = 0; i < 10; i++) {
                laserPointer.addPoint(i * 10, i * 10);
            }

            expect(laserPointer.points).toHaveLength(5);
        });

        it('should remove oldest points when exceeding trail length', () => {
            laserPointer.isActive = true;
            laserPointer.trailLength = 3;

            laserPointer.addPoint(0, 0);
            laserPointer.addPoint(10, 10);
            laserPointer.addPoint(20, 20);
            laserPointer.addPoint(30, 30);

            expect(laserPointer.points[0].x).toBe(10);
            expect(laserPointer.points[2].x).toBe(30);
        });
    });

    describe('loop()', () => {
        it('should not continue if not active', () => {
            laserPointer.isActive = false;
            laserPointer.loop();

            // Should not request another frame
            expect(requestAnimationFrame).not.toHaveBeenCalled();
        });

        it('should clear canvas on each frame', () => {
            laserPointer.isActive = true;
            laserPointer.loop();

            expect(mockCtx.clearRect).toHaveBeenCalled();
        });

        it('should increment age of all points', () => {
            laserPointer.isActive = true;
            laserPointer.points = [
                { x: 100, y: 100, age: 0 },
                { x: 150, y: 150, age: 2 }
            ];

            laserPointer.loop();

            expect(laserPointer.points[0].age).toBe(1);
            expect(laserPointer.points[1].age).toBe(3);
        });

        it('should remove points older than trail length', () => {
            laserPointer.isActive = true;
            laserPointer.trailLength = 5;
            laserPointer.points = [
                { x: 100, y: 100, age: 10 }, // Should be removed
                { x: 150, y: 150, age: 2 }   // Should remain
            ];

            laserPointer.loop();

            expect(laserPointer.points).toHaveLength(1);
            expect(laserPointer.points[0].x).toBe(150);
        });

        it('should request next animation frame', () => {
            laserPointer.isActive = true;
            laserPointer.loop();

            expect(requestAnimationFrame).toHaveBeenCalled();
        });

        it('should not draw trail with less than 2 points', () => {
            laserPointer.isActive = true;
            laserPointer.points = [{ x: 100, y: 100, age: 0 }];

            laserPointer.loop();

            // Should not draw lines (only clear and request frame)
            expect(mockCtx.moveTo).not.toHaveBeenCalled();
            expect(mockCtx.lineTo).not.toHaveBeenCalled();
        });

        it('should draw trail segments with varying opacity', () => {
            laserPointer.isActive = true;
            laserPointer.trailLength = 20;
            laserPointer.points = [
                { x: 100, y: 100, age: 0 },
                { x: 150, y: 150, age: 0 }
            ];

            laserPointer.loop();

            expect(mockCtx.beginPath).toHaveBeenCalled();
            expect(mockCtx.moveTo).toHaveBeenCalledWith(100, 100);
            expect(mockCtx.lineTo).toHaveBeenCalledWith(150, 150);
            expect(mockCtx.stroke).toHaveBeenCalled();
        });

        it('should set correct line properties', () => {
            laserPointer.isActive = true;
            laserPointer.points = [
                { x: 100, y: 100, age: 0 },
                { x: 150, y: 150, age: 0 }
            ];

            laserPointer.loop();

            expect(mockCtx.lineCap).toBe('round');
            expect(mockCtx.lineJoin).toBe('round');
        });

        it('should draw head glow at last point', () => {
            laserPointer.isActive = true;
            laserPointer.points = [
                { x: 100, y: 100, age: 0 },
                { x: 150, y: 150, age: 0 }
            ];

            laserPointer.loop();

            // Should draw head circle
            expect(mockCtx.arc).toHaveBeenCalled();
            expect(mockCtx.fill).toHaveBeenCalled();
        });
    });

    describe('configuration', () => {
        it('should allow custom trail length', () => {
            laserPointer.trailLength = 50;

            expect(laserPointer.trailLength).toBe(50);
        });

        it('should allow custom color', () => {
            laserPointer.color = '#00FF00';

            expect(laserPointer.color).toBe('#00FF00');
        });

        it('should allow custom line width', () => {
            laserPointer.lineWidth = 8;

            expect(laserPointer.lineWidth).toBe(8);
        });
    });

    describe('window resize handling', () => {
        it('should register resize event listener on init', () => {
            // addEventListenerSpy is set up in beforeEach
            expect(addEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
        });
    });

    describe('edge cases', () => {
        it('should handle zero points gracefully', () => {
            laserPointer.isActive = true;
            laserPointer.points = [];

            expect(() => laserPointer.loop()).not.toThrow();
        });

        it('should handle negative coordinates', () => {
            laserPointer.isActive = true;
            laserPointer.addPoint(-100, -200);

            expect(laserPointer.points[0]).toEqual({ x: -100, y: -200, age: 0 });
        });

        it('should handle very large coordinates', () => {
            laserPointer.isActive = true;
            laserPointer.addPoint(10000, 10000);

            expect(laserPointer.points[0]).toEqual({ x: 10000, y: 10000, age: 0 });
        });

        it('should handle fractional coordinates', () => {
            laserPointer.isActive = true;
            laserPointer.addPoint(100.5, 200.75);

            expect(laserPointer.points[0]).toEqual({ x: 100.5, y: 200.75, age: 0 });
        });
    });
});
