import { describe, it, expect } from 'vitest';

import { HitTesting } from '../../../src/core/canvas/HitTesting.js';

describe('HitTesting deterministic tie-break', () => {
  it('prefers lower priority rank', () => {
    const a = { priorityRank: 2, distance: 0, zOrder: 10, hitKey: 'fill:layer:a:fill-0', result: { id: 'a' } };
    const b = { priorityRank: 1, distance: 999, zOrder: 0, hitKey: 'stroke:layer:b:stroke-0', result: { id: 'b' } };

    const best = HitTesting.chooseBestHitCandidate([a, b]);
    expect(best?.result?.id).toBe('b');
  });

  it('prefers smaller distance within same priority', () => {
    const far = { priorityRank: 2, distance: 10, zOrder: 100, hitKey: 'fill:layer:far:fill-0', result: { id: 'far' } };
    const near = { priorityRank: 2, distance: 1, zOrder: 0, hitKey: 'fill:layer:near:fill-0', result: { id: 'near' } };

    const best = HitTesting.chooseBestHitCandidate([far, near]);
    expect(best?.result?.id).toBe('near');
  });

  it('prefers higher z-order when priority and distance tie', () => {
    const back = { priorityRank: 2, distance: 0, zOrder: 1, hitKey: 'fill:layer:back:fill-0', result: { id: 'back' } };
    const front = { priorityRank: 2, distance: 0, zOrder: 9, hitKey: 'fill:layer:front:fill-0', result: { id: 'front' } };

    const best = HitTesting.chooseBestHitCandidate([back, front]);
    expect(best?.result?.id).toBe('front');
  });

  it('uses hitKey as final stable tie-break, independent of input order', () => {
    const a = { priorityRank: 2, distance: 0, zOrder: 0, hitKey: 'fill:layer:aaa:fill-0', result: { id: 'aaa' } };
    const b = { priorityRank: 2, distance: 0, zOrder: 0, hitKey: 'fill:layer:bbb:fill-0', result: { id: 'bbb' } };

    const best1 = HitTesting.chooseBestHitCandidate([b, a]);
    const best2 = HitTesting.chooseBestHitCandidate([a, b]);

    expect(best1?.result?.id).toBe('aaa');
    expect(best2?.result?.id).toBe('aaa');
  });
});
