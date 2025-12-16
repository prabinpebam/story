import { createHash } from 'node:crypto';

function stableStringify(value) {
    const seen = new WeakSet();
    const stringify = (v) => {
        if (v === null || v === undefined) return 'null';
        const t = typeof v;
        if (t === 'number') {
            if (!Number.isFinite(v)) return 'null';
            // Bucket floats for determinism across platforms.
            return String(Math.round(v * 1e6) / 1e6);
        }
        if (t === 'boolean') return v ? 'true' : 'false';
        if (t === 'string') return JSON.stringify(v);
        if (Array.isArray(v)) return `[${v.map(stringify).join(',')}]`;
        if (t === 'object') {
            if (seen.has(v)) return 'null';
            seen.add(v);
            const keys = Object.keys(v).sort();
            return `{${keys.map(k => `${JSON.stringify(k)}:${stringify(v[k])}`).join(',')}}`;
        }
        return 'null';
    };
    return stringify(value);
}

export function canonicalSha256(value) {
    const str = stableStringify(value);
    return createHash('sha256').update(str).digest('hex');
}
