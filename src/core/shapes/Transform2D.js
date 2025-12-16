import { EPS_LENGTH, normalizeNegativeZero } from './Epsilon.js';

/**
 * Transform2D
 *
 * A 2D affine transform compatible with SVG's matrix(a b c d e f):
 *   x' = a*x + c*y + e
 *   y' = b*x + d*y + f
 */
export class Transform2D {
    constructor(a = 1, b = 0, c = 0, d = 1, e = 0, f = 0) {
        this.a = a;
        this.b = b;
        this.c = c;
        this.d = d;
        this.e = e;
        this.f = f;
    }

    static identity() {
        return new Transform2D(1, 0, 0, 1, 0, 0);
    }

    static translation(tx = 0, ty = 0) {
        return new Transform2D(1, 0, 0, 1, tx, ty);
    }

    static rotationRadians(rad = 0) {
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);
        return new Transform2D(cos, sin, -sin, cos, 0, 0);
    }

    static rotationRadiansAbout(rad, cx, cy) {
        // T(cx,cy) * R(rad) * T(-cx,-cy)
        return Transform2D.translation(cx, cy)
            .compose(Transform2D.rotationRadians(rad))
            .compose(Transform2D.translation(-cx, -cy));
    }

    static scale(sx = 1, sy = 1) {
        return new Transform2D(sx, 0, 0, sy, 0, 0);
    }

    /**
     * Compose transforms: result = this ∘ other (apply other, then this).
     */
    compose(other) {
        return Transform2D.multiply(this, other);
    }

    /**
     * Multiply transforms: result = a ∘ b (apply b, then a).
     */
    static multiply(a, b) {
        return new Transform2D(
            a.a * b.a + a.c * b.b,
            a.b * b.a + a.d * b.b,
            a.a * b.c + a.c * b.d,
            a.b * b.c + a.d * b.d,
            a.a * b.e + a.c * b.f + a.e,
            a.b * b.e + a.d * b.f + a.f
        );
    }

    applyToPoint(p) {
        const x = this.a * p.x + this.c * p.y + this.e;
        const y = this.b * p.x + this.d * p.y + this.f;
        return { x: normalizeNegativeZero(x), y: normalizeNegativeZero(y) };
    }

    applyToPoints(points) {
        return points.map((p) => this.applyToPoint(p));
    }

    invert() {
        const det = this.a * this.d - this.b * this.c;
        if (!Number.isFinite(det) || Math.abs(det) <= EPS_LENGTH) {
            return null;
        }

        const invDet = 1 / det;
        const a = this.d * invDet;
        const b = -this.b * invDet;
        const c = -this.c * invDet;
        const d = this.a * invDet;
        const e = (this.c * this.f - this.d * this.e) * invDet;
        const f = (this.b * this.e - this.a * this.f) * invDet;
        return new Transform2D(a, b, c, d, e, f);
    }

    equalsWithin(other, eps = EPS_LENGTH) {
        if (!other) return false;
        return (
            Math.abs(this.a - other.a) <= eps &&
            Math.abs(this.b - other.b) <= eps &&
            Math.abs(this.c - other.c) <= eps &&
            Math.abs(this.d - other.d) <= eps &&
            Math.abs(this.e - other.e) <= eps &&
            Math.abs(this.f - other.f) <= eps
        );
    }

    /**
     * Build local->world transform for a Story element using x/y/width/height/rotation.
     * Rotation is about the element's visual center.
     */
    static fromElementBox(el) {
        const x = Number(el?.x ?? 0);
        const y = Number(el?.y ?? 0);
        const width = Number(el?.width ?? 0);
        const height = Number(el?.height ?? 0);
        const rotationDeg = Number(el?.rotation ?? 0);

        const rad = (rotationDeg * Math.PI) / 180;
        const cx = width / 2;
        const cy = height / 2;

        // local -> world: T(x,y) * T(cx,cy) * R(rad) * T(-cx,-cy)
        return Transform2D.translation(x, y)
            .compose(Transform2D.translation(cx, cy))
            .compose(Transform2D.rotationRadians(rad))
            .compose(Transform2D.translation(-cx, -cy));
    }

    /**
     * Build a world->local transform for a Story element.
     */
    static inverseFromElementBox(el) {
        const t = Transform2D.fromElementBox(el);
        return t.invert();
    }

    /**
     * Axis-aligned bounds of the transformed element box corners.
     */
    static getTransformedBoxBounds(el, transform) {
        const width = Number(el?.width ?? 0);
        const height = Number(el?.height ?? 0);

        const corners = [
            { x: 0, y: 0 },
            { x: width, y: 0 },
            { x: width, y: height },
            { x: 0, y: height }
        ];

        const pts = transform.applyToPoints(corners);
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        for (const p of pts) {
            minX = Math.min(minX, p.x);
            minY = Math.min(minY, p.y);
            maxX = Math.max(maxX, p.x);
            maxY = Math.max(maxY, p.y);
        }

        return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
    }
}
