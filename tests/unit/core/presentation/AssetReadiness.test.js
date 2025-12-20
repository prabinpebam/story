import { describe, it, expect } from 'vitest';
import { waitForSlideAssetsReady, __test__ } from '../../../../src/core/presentation/AssetReadiness.js';

describe('AssetReadiness', () => {
    it('extractUrlsFromCssBackground should extract urls', () => {
        expect(__test__.extractUrlsFromCssBackground('none')).toEqual([]);
        expect(__test__.extractUrlsFromCssBackground('url(foo.png)')).toEqual(['foo.png']);
        expect(__test__.extractUrlsFromCssBackground('url("a.png"), url(\'b.png\')')).toEqual(['a.png', 'b.png']);
    });

    it('waitForSlideAssetsReady should await HTMLImageElement.decode when present', async () => {
        const root = document.createElement('div');
        const img = document.createElement('img');
        img.src = 'data:image/gif;base64,R0lGODlhAQABAAAAACw=';

        let resolveDecode;
        const decodePromise = new Promise((r) => (resolveDecode = r));

        img.decode = () => decodePromise;
        // Pretend the resource is already loaded to focus on decode gating.
        Object.defineProperty(img, 'complete', { value: true });
        Object.defineProperty(img, 'naturalWidth', { value: 1 });

        root.appendChild(img);

        const ready = waitForSlideAssetsReady(root, { perAssetTimeoutMs: 2000 });

        // Ensure it doesn't resolve until decode resolves.
        let settled = false;
        ready.then(() => {
            settled = true;
        });

        await Promise.resolve();
        expect(settled).toBe(false);

        resolveDecode();
        await ready;
        expect(settled).toBe(true);
    });
});
