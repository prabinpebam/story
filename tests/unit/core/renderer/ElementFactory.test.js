import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock all element classes before importing ElementFactory
vi.mock('../../../../src/core/renderer/elements/ShapeElement.js', () => {
    const ShapeElement = vi.fn(function(data) {
        this.type = 'shape';
        this.data = data;
        this.render = vi.fn();
    });
    return { ShapeElement };
});

vi.mock('../../../../src/core/renderer/elements/TextElement.js', () => {
    const TextElement = vi.fn(function(data) {
        this.type = 'text';
        this.data = data;
        this.render = vi.fn();
    });
    return { TextElement };
});

vi.mock('../../../../src/core/renderer/elements/ImageElement.js', () => {
    const ImageElement = vi.fn(function(data) {
        this.type = 'image';
        this.data = data;
        this.render = vi.fn();
    });
    return { ImageElement };
});

vi.mock('../../../../src/core/renderer/elements/GroupElement.js', () => {
    const GroupElement = vi.fn(function(data) {
        this.type = 'group';
        this.data = data;
        this.render = vi.fn();
    });
    return { GroupElement };
});

import { ElementFactory } from '../../../../src/core/renderer/ElementFactory.js';
import { ShapeElement } from '../../../../src/core/renderer/elements/ShapeElement.js';
import { TextElement } from '../../../../src/core/renderer/elements/TextElement.js';
import { ImageElement } from '../../../../src/core/renderer/elements/ImageElement.js';
import { GroupElement } from '../../../../src/core/renderer/elements/GroupElement.js';

describe('ElementFactory', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('create()', () => {
        describe('text elements', () => {
            it('should create TextElement for text type', () => {
                const data = {
                    id: 'text-1',
                    type: 'text',
                    content: 'Hello World',
                    x: 100,
                    y: 100
                };

                const element = ElementFactory.create(data);

                expect(TextElement).toHaveBeenCalledWith(data);
                expect(element.type).toBe('text');
            });

            it('should pass all text properties to TextElement', () => {
                const data = {
                    id: 'text-2',
                    type: 'text',
                    content: 'Styled Text',
                    x: 50,
                    y: 50,
                    width: 200,
                    height: 100,
                    style: {
                        fontFamily: 'Arial',
                        fontSize: 24,
                        fontWeight: 'bold',
                        color: '#000000',
                        alignment: 'center'
                    }
                };

                ElementFactory.create(data);

                expect(TextElement).toHaveBeenCalledWith(data);
            });
        });

        describe('image elements', () => {
            it('should create ImageElement for image type', () => {
                const data = {
                    id: 'image-1',
                    type: 'image',
                    src: 'path/to/image.png',
                    x: 100,
                    y: 100
                };

                const element = ElementFactory.create(data);

                expect(ImageElement).toHaveBeenCalledWith(data);
                expect(element.type).toBe('image');
            });

            it('should pass all image properties to ImageElement', () => {
                const data = {
                    id: 'image-2',
                    type: 'image',
                    src: 'path/to/photo.jpg',
                    x: 0,
                    y: 0,
                    width: 400,
                    height: 300,
                    style: {
                        objectFit: 'cover',
                        opacity: 0.8,
                        borderRadius: 10
                    }
                };

                ElementFactory.create(data);

                expect(ImageElement).toHaveBeenCalledWith(data);
            });
        });

        describe('group elements', () => {
            it('should create GroupElement for group type', () => {
                const data = {
                    id: 'group-1',
                    type: 'group',
                    children: ['elem-1', 'elem-2'],
                    x: 100,
                    y: 100
                };

                const element = ElementFactory.create(data);

                expect(GroupElement).toHaveBeenCalledWith(data);
                expect(element.type).toBe('group');
            });

            it('should pass all group properties to GroupElement', () => {
                const data = {
                    id: 'group-2',
                    type: 'group',
                    children: ['text-1', 'rect-1', 'image-1'],
                    x: 50,
                    y: 50,
                    width: 500,
                    height: 400,
                    rotation: 45
                };

                ElementFactory.create(data);

                expect(GroupElement).toHaveBeenCalledWith(data);
            });
        });

        describe('shape elements', () => {
            it('should create ShapeElement for rect type', () => {
                const data = {
                    id: 'rect-1',
                    type: 'rect',
                    x: 100,
                    y: 100,
                    width: 200,
                    height: 150
                };

                const element = ElementFactory.create(data);

                expect(ShapeElement).toHaveBeenCalledWith(data);
                expect(element.type).toBe('shape');
            });

            it('should create ShapeElement for circle type', () => {
                const data = {
                    id: 'circle-1',
                    type: 'circle',
                    x: 100,
                    y: 100,
                    width: 100,
                    height: 100
                };

                const element = ElementFactory.create(data);

                expect(ShapeElement).toHaveBeenCalledWith(data);
                expect(element.type).toBe('shape');
            });

            it('should create ShapeElement for unknown types (default)', () => {
                const data = {
                    id: 'unknown-1',
                    type: 'polygon',
                    x: 100,
                    y: 100
                };

                const element = ElementFactory.create(data);

                expect(ShapeElement).toHaveBeenCalledWith(data);
                expect(element.type).toBe('shape');
            });

            it('should pass all shape properties to ShapeElement', () => {
                const data = {
                    id: 'rect-2',
                    type: 'rect',
                    x: 0,
                    y: 0,
                    width: 300,
                    height: 200,
                    rotation: 30,
                    style: {
                        fill: '#FF0000',
                        stroke: '#000000',
                        strokeWidth: 2,
                        borderRadius: 8,
                        opacity: 0.9
                    }
                };

                ElementFactory.create(data);

                expect(ShapeElement).toHaveBeenCalledWith(data);
            });
        });

        describe('edge cases', () => {
            it('should handle undefined type as shape', () => {
                const data = {
                    id: 'elem-1',
                    x: 100,
                    y: 100
                };

                const element = ElementFactory.create(data);

                expect(ShapeElement).toHaveBeenCalledWith(data);
                expect(element.type).toBe('shape');
            });

            it('should handle empty data object', () => {
                const data = {};

                const element = ElementFactory.create(data);

                expect(ShapeElement).toHaveBeenCalledWith(data);
                expect(element.type).toBe('shape');
            });

            it('should handle data with extra properties', () => {
                const data = {
                    id: 'text-extra',
                    type: 'text',
                    content: 'Extra Props',
                    customProperty: 'value',
                    metadata: { author: 'user' }
                };

                ElementFactory.create(data);

                expect(TextElement).toHaveBeenCalledWith(data);
            });

            it('should handle data with null values', () => {
                const data = {
                    id: 'rect-null',
                    type: 'rect',
                    style: null,
                    width: null,
                    height: null
                };

                ElementFactory.create(data);

                expect(ShapeElement).toHaveBeenCalledWith(data);
            });

            it('should be case-sensitive for type matching', () => {
                const data = {
                    id: 'text-upper',
                    type: 'TEXT', // Uppercase
                    content: 'Hello'
                };

                // 'TEXT' won't match 'text', so it falls through to default (ShapeElement)
                const element = ElementFactory.create(data);

                expect(ShapeElement).toHaveBeenCalledWith(data);
            });
        });

        describe('element data preservation', () => {
            it('should preserve position properties', () => {
                const data = {
                    id: 'elem-pos',
                    type: 'rect',
                    x: 123.456,
                    y: 789.012
                };

                ElementFactory.create(data);

                const calledData = ShapeElement.mock.calls[0][0];
                expect(calledData.x).toBe(123.456);
                expect(calledData.y).toBe(789.012);
            });

            it('should preserve dimension properties', () => {
                const data = {
                    id: 'elem-dim',
                    type: 'rect',
                    width: 500.5,
                    height: 300.25
                };

                ElementFactory.create(data);

                const calledData = ShapeElement.mock.calls[0][0];
                expect(calledData.width).toBe(500.5);
                expect(calledData.height).toBe(300.25);
            });

            it('should preserve rotation property', () => {
                const data = {
                    id: 'elem-rot',
                    type: 'rect',
                    rotation: 45.5
                };

                ElementFactory.create(data);

                const calledData = ShapeElement.mock.calls[0][0];
                expect(calledData.rotation).toBe(45.5);
            });

            it('should preserve style object', () => {
                const style = {
                    fill: { type: 'solid', color: '#FF5500' },
                    stroke: { color: '#000', width: 2 },
                    opacity: 0.75
                };

                const data = {
                    id: 'elem-style',
                    type: 'rect',
                    style
                };

                ElementFactory.create(data);

                const calledData = ShapeElement.mock.calls[0][0];
                expect(calledData.style).toEqual(style);
            });

            it('should preserve nested properties', () => {
                const data = {
                    id: 'elem-nested',
                    type: 'text',
                    content: 'Nested',
                    style: {
                        text: {
                            fontFamily: 'Arial',
                            fontSize: 16
                        },
                        effects: {
                            shadow: {
                                color: '#000',
                                blur: 4,
                                offsetX: 2,
                                offsetY: 2
                            }
                        }
                    }
                };

                ElementFactory.create(data);

                const calledData = TextElement.mock.calls[0][0];
                expect(calledData.style.text.fontFamily).toBe('Arial');
                expect(calledData.style.effects.shadow.blur).toBe(4);
            });
        });

        describe('returned element', () => {
            it('should return element with render method', () => {
                const data = { id: 'elem', type: 'rect' };
                const element = ElementFactory.create(data);

                expect(typeof element.render).toBe('function');
            });

            it('should return element with data property', () => {
                const data = { id: 'elem', type: 'text', content: 'Hello' };
                const element = ElementFactory.create(data);

                expect(element.data).toEqual(data);
            });
        });
    });

    describe('static method', () => {
        it('should be callable as static method', () => {
            expect(typeof ElementFactory.create).toBe('function');
        });

        it('should not require instantiation', () => {
            const data = { id: 'static-test', type: 'rect' };
            
            // Should work without new ElementFactory()
            expect(() => ElementFactory.create(data)).not.toThrow();
        });
    });
});
