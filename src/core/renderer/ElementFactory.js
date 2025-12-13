import { ShapeElement } from './elements/ShapeElement.js';
import { TextElement } from './elements/TextElement.js';
import { ImageElement } from './elements/ImageElement.js';
import { GroupElement } from './elements/GroupElement.js';
import { SvgElement } from './elements/SvgElement.js';

export class ElementFactory {
    static create(data) {
        switch (data.type) {
            case 'text':
                return new TextElement(data);
            case 'image':
                return new ImageElement(data);
            case 'svg':
                return new SvgElement(data);
            case 'group':
                return new GroupElement(data);
            case 'placeholder':
                // Text-based placeholders use TextElement
                if (['title', 'subtitle', 'body', 'text', 'date', 'footer', 'slideNumber'].includes(data.placeholderType)) {
                    return new TextElement(data);
                }
                // Media/Content placeholders use ShapeElement (initially)
                return new ShapeElement(data);
            case 'rect':
            case 'circle':
            default:
                return new ShapeElement(data);
        }
    }
}
