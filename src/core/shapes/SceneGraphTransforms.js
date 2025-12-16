import { Transform2D } from './Transform2D.js';

function getElement(slide, elementId) {
    const elements = slide?.effectiveElements || slide?.elements;
    return elements ? elements[elementId] : null;
}

/**
 * Compute the transform that maps coordinates in the element's PARENT space to world space.
 *
 * If the element has no parent, this is identity (world == parent space).
 */
export function computeParentToWorldTransform(slide, element) {
    if (!slide || !element?.parentId) return Transform2D.identity();

    const parents = [];
    let parentId = element.parentId;

    while (parentId) {
        const parent = getElement(slide, parentId);
        if (!parent) break;
        parents.push(parent);
        parentId = parent.parentId;
    }

    // Compose root -> leaf.
    let t = Transform2D.identity();
    for (let i = parents.length - 1; i >= 0; i--) {
        t = t.compose(Transform2D.fromElementBox(parents[i]));
    }

    return t;
}

/**
 * Compute world-space center point of an element, accounting for parent transforms.
 */
export function computeElementWorldCenter(slide, element) {
    const cx = Number(element?.x ?? 0) + Number(element?.width ?? 0) / 2;
    const cy = Number(element?.y ?? 0) + Number(element?.height ?? 0) / 2;

    const tParent = computeParentToWorldTransform(slide, element);
    return tParent.applyToPoint({ x: cx, y: cy });
}

/**
 * Compute world-space rotation in degrees as the sum of rotations in the parent chain.
 */
export function computeElementWorldRotation(slide, element) {
    let rotation = Number(element?.rotation ?? 0);

    let parentId = element?.parentId;
    while (parentId) {
        const parent = getElement(slide, parentId);
        if (!parent) break;
        rotation += Number(parent.rotation ?? 0);
        parentId = parent.parentId;
    }

    return rotation;
}

/**
 * Compute world-space top-left for an element's unrotated box such that CSS center-pivot
 * rotation at that top-left produces the correct world center.
 */
export function computeElementWorldTopLeft(slide, element) {
    const center = computeElementWorldCenter(slide, element);
    const width = Number(element?.width ?? 0);
    const height = Number(element?.height ?? 0);

    return {
        x: center.x - width / 2,
        y: center.y - height / 2
    };
}
