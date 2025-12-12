import { describe, it, expect } from 'vitest';
import {
    mapPlaceholders,
    detachUnmappedPlaceholderContent,
    restoreDetachedContent
} from '../../../../src/core/master/Reconciliation.js';

function layout(id, elements, elementOrder) {
    return {
        id,
        type: 'layoutMaster',
        elements,
        elementOrder
    };
}

function ph(id, placeholderType) {
    return {
        id,
        type: 'text',
        isPlaceholder: true,
        placeholderType,
        x: 0,
        y: 0,
        width: 100,
        height: 50,
        style: {}
    };
}

describe('Reconciliation', () => {
    it('maps by stable id when available', () => {
        const sourceLayout = layout(
            'layout-a',
            { 'placeholder-title': ph('placeholder-title', 'title') },
            ['placeholder-title']
        );
        const targetLayout = layout(
            'layout-b',
            { 'placeholder-title': ph('placeholder-title', 'title') },
            ['placeholder-title']
        );
        const slide = {
            elements: {
                'placeholder-title': {
                    id: 'placeholder-title',
                    type: 'text',
                    content: 'Hello',
                    isPlaceholder: true,
                    placeholderType: 'title',
                    style: {}
                }
            },
            elementOrder: ['placeholder-title']
        };

        const { mapping } = mapPlaceholders(sourceLayout, targetLayout, slide);
        expect(mapping['placeholder-title']).toBe('placeholder-title');
    });

    it('maps by type+index when ids differ', () => {
        const sourceLayout = layout(
            'layout-a',
            {
                a1: ph('a1', 'body'),
                a2: ph('a2', 'body')
            },
            ['a1', 'a2']
        );
        const targetLayout = layout(
            'layout-b',
            {
                b1: ph('b1', 'body'),
                b2: ph('b2', 'body')
            },
            ['b1', 'b2']
        );
        const slide = {
            elements: {
                a2: {
                    id: 'a2',
                    type: 'text',
                    content: 'Second body',
                    isPlaceholder: true,
                    placeholderType: 'body',
                    style: {}
                }
            },
            elementOrder: ['a2']
        };

        const { mapping } = mapPlaceholders(sourceLayout, targetLayout, slide);
        expect(mapping.a2).toBe('b2');
    });

    it('detaches unmapped placeholder content with provenance', () => {
        const slide = {
            elements: {
                'placeholder-picture': {
                    id: 'placeholder-picture',
                    type: 'text',
                    content: 'User pic',
                    isPlaceholder: true,
                    placeholderType: 'picture',
                    style: {}
                }
            },
            elementOrder: ['placeholder-picture']
        };

        detachUnmappedPlaceholderContent(slide, {
            sourceLayoutId: 'layout-with-picture',
            idsToDetach: ['placeholder-picture'],
            now: 123
        });

        const ids = Object.keys(slide.elements);
        expect(ids.length).toBe(1);
        const detachedId = ids[0];
        const el = slide.elements[detachedId];

        expect(detachedId).toContain('detached-picture-placeholder-picture-123');
        expect(el.isPlaceholder).toBeUndefined();
        expect(el.placeholderType).toBeUndefined();
        expect(el.origin).toBeDefined();
        expect(el.origin.placeholderType).toBe('picture');
        expect(el.origin.sourceLayoutId).toBe('layout-with-picture');
        expect(el.origin.sourceMasterElementId).toBe('placeholder-picture');
        expect(el.origin.detachedAt).toBe(123);
    });

    it('restores detached content into matching target placeholders', () => {
        const targetLayout = layout(
            'layout-b',
            {
                'placeholder-picture': { ...ph('placeholder-picture', 'picture'), x: 10 },
                'placeholder-title': ph('placeholder-title', 'title')
            },
            ['placeholder-title', 'placeholder-picture']
        );

        const slide = {
            elements: {
                'detached-picture-old-1': {
                    id: 'detached-picture-old-1',
                    type: 'text',
                    content: 'User pic',
                    style: { fontSize: 22 },
                    origin: {
                        placeholderType: 'picture',
                        sourceLayoutId: 'layout-a',
                        sourceMasterElementId: 'old-picture',
                        detachedAt: 1
                    }
                }
            },
            elementOrder: ['detached-picture-old-1']
        };

        restoreDetachedContent(slide, targetLayout);

        expect(slide.elements['placeholder-picture']).toBeDefined();
        expect(slide.elements['placeholder-picture'].isPlaceholder).toBe(true);
        expect(slide.elements['placeholder-picture'].content).toBe('User pic');
        expect(slide.elements['placeholder-picture'].x).toBe(10);

        expect(slide.elements['detached-picture-old-1']).toBeUndefined();
    });
});
