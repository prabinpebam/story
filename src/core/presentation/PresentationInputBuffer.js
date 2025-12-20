export const INPUT_THROTTLE_MS = 100;
export const NUMERIC_ENTRY_TIMEOUT_MS = 3000;

export class PresentationInputBuffer {
    constructor({ timeoutMs = NUMERIC_ENTRY_TIMEOUT_MS, onCommit } = {}) {
        this.timeoutMs = timeoutMs;
        this.onCommit = onCommit;

        this._buffer = '';
        this._timer = null;
    }

    get value() {
        return this._buffer;
    }

    get isActive() {
        return this._buffer.length > 0;
    }

    pushDigit(digit, scheduleTimeoutFn = setTimeout, clearTimeoutFn = clearTimeout) {
        if (!/^[0-9]$/.test(digit)) return;

        this._buffer += digit;

        if (this._timer) {
            clearTimeoutFn(this._timer);
        }

        this._timer = scheduleTimeoutFn(() => {
            this.commit();
        }, this.timeoutMs);
    }

    cancel(clearTimeoutFn = clearTimeout) {
        if (this._timer) {
            clearTimeoutFn(this._timer);
            this._timer = null;
        }
        this._buffer = '';
    }

    commit(clearTimeoutFn = clearTimeout) {
        if (!this.isActive) return;

        const raw = this._buffer;
        this.cancel(clearTimeoutFn);

        const slideNumber = parseInt(raw, 10);
        if (!Number.isFinite(slideNumber)) return;

        if (typeof this.onCommit === 'function') {
            this.onCommit(slideNumber);
        }
    }
}
