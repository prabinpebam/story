import { ShapeElement } from './elements/ShapeElement.js';
import { TextElement } from './elements/TextElement.js';
import { ImageElement } from './elements/ImageElement.js';
import { GroupElement } from './elements/GroupElement.js';

export class ElementFactory {
    static create(data) {
        switch (data.type) {
            case 'text':
                return new TextElement(data);
            case 'image':
                return new ImageElement(data);
            case 'group':
                return new GroupElement(data);
            case 'rect':
            case 'circle':
            default:
                return new ShapeElement(data);
        }
    }
}
