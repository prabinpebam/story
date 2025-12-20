import { describe, it, expect } from 'vitest';
import { PresentationPrefetchManager } from '../../../../src/core/presentation/PresentationPrefetchManager.js';

describe('PresentationPrefetchManager', () => {
    it('should classify ACTIVE/HOT/WARM/COLD tiers based on slideOrder and currentIndex', () => {
        const mgr = new PresentationPrefetchManager({ getSlideData: () => null });
        mgr.warmRadius = 3;

        const slideOrder = ['a', 'b', 'c', 'd', 'e'];
        mgr.updateTiers({ slideOrder, currentIndex: 2 });

        expect(mgr.getTier('c')).toBe('active');
        expect(mgr.getTier('b')).toBe('hot');
        expect(mgr.getTier('d')).toBe('hot');
        expect(mgr.getTier('a')).toBe('warm');
        expect(mgr.getTier('e')).toBe('warm');
        expect(mgr.getTier('z')).toBe('cold');
    });

    it('should handle edges at beginning/end', () => {
        const mgr = new PresentationPrefetchManager({ getSlideData: () => null });
        mgr.warmRadius = 2;

        const slideOrder = ['a', 'b', 'c', 'd'];

        mgr.updateTiers({ slideOrder, currentIndex: 0 });
        expect(mgr.getTier('a')).toBe('active');
        expect(mgr.getTier('b')).toBe('hot');
        expect(mgr.getTier('c')).toBe('warm');
        expect(mgr.getTier('d')).toBe('cold');

        mgr.updateTiers({ slideOrder, currentIndex: 3 });
        expect(mgr.getTier('d')).toBe('active');
        expect(mgr.getTier('c')).toBe('hot');
        expect(mgr.getTier('b')).toBe('warm');
        expect(mgr.getTier('a')).toBe('cold');
    });

    it('should prune retained work to ACTIVE/HOT/WARM tiers', () => {
        const mgr = new PresentationPrefetchManager({ getSlideData: () => null });
        mgr.warmRadius = 2;

        // Seed cached promises for many slides.
        const ids = ['a', 'b', 'c', 'd', 'e', 'f'];
        for (const id of ids) {
            mgr._slidePromises.set(id, Promise.resolve());
        }

        mgr.updateTiers({ slideOrder: ids, currentIndex: 2 }); // active=c, hot=b/d, warm=a/e
        mgr._pruneRetained();

        expect(mgr._slidePromises.has('c')).toBe(true);
        expect(mgr._slidePromises.has('b')).toBe(true);
        expect(mgr._slidePromises.has('d')).toBe(true);
        expect(mgr._slidePromises.has('a')).toBe(true);
        expect(mgr._slidePromises.has('e')).toBe(true);
        expect(mgr._slidePromises.has('f')).toBe(false);
    });
});
