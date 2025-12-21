/**
 * Morph matching (V1)
 * - L0-only (parentId falsy)
 * - name-based (trim, case-sensitive)
 * - duplicates allowed but matching chooses top-most deterministically
 */

/**
 * @typedef {{ id: string, name?: string, parentId?: string | null }} MorphElement
 */

/**
 * @param {string[]} order
 * @param {Record<string, MorphElement> | Map<string, MorphElement>} elements
 */
function buildTopMostByName(order, elements) {
    /** @type {Map<string, { id: string, count: number }>} */
    const map = new Map();

    const get = (id) => {
        if (!id) return null;
        if (elements instanceof Map) return elements.get(id) || null;
        return elements[id] || null;
    };

    for (const id of order || []) {
        const el = get(id);
        if (!el) continue;
        if (el.parentId) continue;
        const rawName = typeof el.name === 'string' ? el.name : '';
        const name = rawName.trim();
        if (!name) continue;

        const prev = map.get(name);
        if (!prev) {
            map.set(name, { id, count: 1 });
        } else {
            // Higher index (later in order) is top-most.
            map.set(name, { id, count: prev.count + 1 });
        }
    }

    return map;
}

/**
 * Compute deterministic morph matches for L0 elements.
 *
 * @param {{
 *   srcOrder: string[],
 *   srcElements: Record<string, MorphElement> | Map<string, MorphElement>,
 *   dstOrder: string[],
 *   dstElements: Record<string, MorphElement> | Map<string, MorphElement>
 * }} input
 */
export function computeMorphL0NameMatches(input) {
    const srcOrder = Array.isArray(input?.srcOrder) ? input.srcOrder : [];
    const dstOrder = Array.isArray(input?.dstOrder) ? input.dstOrder : [];

    const srcTop = buildTopMostByName(srcOrder, input?.srcElements || {});
    const dstTop = buildTopMostByName(dstOrder, input?.dstElements || {});

    /** @type {Array<{ name: string, srcId: string, dstId: string, srcDup: boolean, dstDup: boolean }>} */
    const matches = [];

    for (const [name, srcInfo] of srcTop.entries()) {
        const dstInfo = dstTop.get(name);
        if (!dstInfo) continue;
        matches.push({
            name,
            srcId: srcInfo.id,
            dstId: dstInfo.id,
            srcDup: srcInfo.count > 1,
            dstDup: dstInfo.count > 1
        });
    }

    return { matches };
}
