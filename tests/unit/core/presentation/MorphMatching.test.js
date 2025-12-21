import { describe, it, expect } from 'vitest';
import { computeMorphL0NameMatches } from '../../../../src/core/presentation/MorphMatching.js';

describe('MorphMatching (V1)', () => {
    it('matches by trimmed name (case-sensitive)', () => {
        const result = computeMorphL0NameMatches({
            srcOrder: ['a', 'b'],
            srcElements: {
                a: { id: 'a', name: ' Box ' },
                b: { id: 'b', name: 'box' }
            },
            dstOrder: ['c'],
            dstElements: {
                c: { id: 'c', name: 'Box' }
            }
        });

        expect(result.matches).toEqual([
            { name: 'Box', srcId: 'a', dstId: 'c', srcDup: false, dstDup: false }
        ]);
    });

    it('ignores non-L0 (has parentId) and unnamed elements', () => {
        const result = computeMorphL0NameMatches({
            srcOrder: ['a', 'b', 'c'],
            srcElements: {
                a: { id: 'a', name: 'A', parentId: 'p1' },
                b: { id: 'b', name: '   ' },
                c: { id: 'c', name: 'C' }
            },
            dstOrder: ['d'],
            dstElements: {
                d: { id: 'd', name: 'C' }
            }
        });

        expect(result.matches).toEqual([
            { name: 'C', srcId: 'c', dstId: 'd', srcDup: false, dstDup: false }
        ]);
    });

    it('resolves duplicates by choosing top-most (last in order) and flags duplicates', () => {
        const result = computeMorphL0NameMatches({
            srcOrder: ['a1', 'a2', 'x'],
            srcElements: {
                a1: { id: 'a1', name: 'Title' },
                a2: { id: 'a2', name: 'Title' },
                x: { id: 'x', name: 'Other' }
            },
            dstOrder: ['b1', 'b2'],
            dstElements: {
                b1: { id: 'b1', name: 'Title' },
                b2: { id: 'b2', name: 'Title' }
            }
        });

        expect(result.matches).toEqual([
            { name: 'Title', srcId: 'a2', dstId: 'b2', srcDup: true, dstDup: true }
        ]);
    });
});
