let singleton = null;

function ensureSingleton() {
    if (singleton) return singleton;

    const container = document.createElement('div');
    container.className = 'notification-popover-container';
    container.setAttribute('data-testid', 'notification-popover-container');
    document.body.appendChild(container);

    singleton = {
        container,
        queue: [],
        current: null,
        dismissTimer: null
    };

    return singleton;
}

function clearTimer(state) {
    if (state.dismissTimer) {
        clearTimeout(state.dismissTimer);
        state.dismissTimer = null;
    }
}

function render(state) {
    state.container.innerHTML = '';

    if (!state.current) return;

    const { type, title, body, dismissible, autoDismissMs, actionLabel, onAction } = state.current;

    const card = document.createElement('div');
    card.className = `notification-popover notification-popover--${type}`;
    card.setAttribute('data-testid', 'notification-popover');

    const header = document.createElement('div');
    header.className = 'notification-popover__header';

    const titleEl = document.createElement('div');
    titleEl.className = 'notification-popover__title';
    titleEl.textContent = title;

    header.appendChild(titleEl);

    if (dismissible) {
        const closeBtn = document.createElement('button');
        closeBtn.className = 'notification-popover__close';
        closeBtn.type = 'button';
        closeBtn.setAttribute('aria-label', 'Dismiss notification');
        closeBtn.setAttribute('data-testid', 'notification-dismiss');
        closeBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
        closeBtn.addEventListener('click', () => dismiss());
        header.appendChild(closeBtn);
    }

    card.appendChild(header);

    if (body) {
        const bodyEl = document.createElement('div');
        bodyEl.className = 'notification-popover__body';
        bodyEl.textContent = body;
        card.appendChild(bodyEl);
    }

    if (actionLabel && typeof onAction === 'function') {
        const footer = document.createElement('div');
        footer.className = 'notification-popover__footer';

        const actionBtn = document.createElement('button');
        actionBtn.type = 'button';
        actionBtn.className = 'btn btn--secondary btn--sm';
        actionBtn.textContent = actionLabel;
        actionBtn.setAttribute('data-testid', 'notification-action');
        actionBtn.addEventListener('click', () => {
            try {
                onAction();
            } finally {
                dismiss();
            }
        });

        footer.appendChild(actionBtn);
        card.appendChild(footer);
    }

    // Pause auto-dismiss on hover (if any)
    card.addEventListener('mouseenter', () => clearTimer(state));
    card.addEventListener('mouseleave', () => {
        if (!dismissible && autoDismissMs) {
            clearTimer(state);
            state.dismissTimer = setTimeout(() => dismiss(), autoDismissMs);
        }
    });

    state.container.appendChild(card);

    if (!dismissible && autoDismissMs) {
        clearTimer(state);
        state.dismissTimer = setTimeout(() => dismiss(), autoDismissMs);
    }
}

export function notify({
    type = 'info',
    title,
    body = '',
    dismissible = false,
    autoDismissMs = 2000,
    actionLabel = '',
    onAction = null
}) {
    const state = ensureSingleton();

    state.queue.push({ type, title, body, dismissible, autoDismissMs, actionLabel, onAction });
    if (!state.current) {
        state.current = state.queue.shift();
        render(state);
    }
}

export function dismiss() {
    const state = ensureSingleton();

    clearTimer(state);
    state.current = null;
    render(state);

    if (state.queue.length > 0) {
        state.current = state.queue.shift();
        render(state);
    }
}
