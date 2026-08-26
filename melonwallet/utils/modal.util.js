export function showMelonAlert(message, options = {}) {
    const {
        title = 'Aviso',
        icon = '🍈',
        type = 'info',
        onClose = null,
    } = options;

    return new Promise((resolve) => {
        const result = createModal({
            type,
            title,
            icon,
            message,
            buttons: [
                {
                    label: 'Entendi',
                    variant: 'primary',
                    action: () => resolve(undefined),
                },
            ],
            onClose: (val) => {
                if (typeof onClose === 'function') onClose(val);
                resolve(val);
            },
        });
    });
}

export function showMelonConfirm(message, options = {}) {
    const {
        title = 'Confirmação',
        icon = '🤔',
        type = 'confirm',
        confirmLabel = 'Confirmar',
        cancelLabel = 'Cancelar',
        danger = false,
        onClose = null,
    } = options;

    return new Promise((resolve) => {
        const result = createModal({
            type,
            title,
            icon,
            message,
            buttons: [
                {
                    label: cancelLabel,
                    variant: 'secondary',
                    action: () => resolve(false),
                },
                {
                    label: confirmLabel,
                    variant: danger ? 'danger' : 'primary',
                    action: () => resolve(true),
                },
            ],
            onClose: (val) => {
                if (typeof onClose === 'function') onClose(val);
                resolve(val);
            },
        });
    });
}

export function showMelonPrompt(message, options = {}) {
    const {
        title = 'Entrada',
        icon = '✏️',
        type = 'info',
        placeholder = '',
        defaultValue = '',
        confirmLabel = 'Salvar',
        cancelLabel = 'Cancelar',
        onClose = null,
    } = options;

    return new Promise((resolve) => {
        const result = createModal({
            type,
            title,
            icon,
            message,
            inputPlaceholder: placeholder,
            inputValue: defaultValue,
            buttons: [
                {
                    label: cancelLabel,
                    variant: 'secondary',
                    action: () => resolve(null),
                },
                {
                    label: confirmLabel,
                    variant: 'primary',
                    action: () => {
                        const input = result.getInput();
                        const value = input ? input.value.trim() : '';
                        resolve(value || null);
                    },
                },
            ],
            onClose: (val) => {
                if (typeof onClose === 'function') onClose(val);
                resolve(val);
            },
        });
    });
}

function createModal({ type, title, icon, message, inputPlaceholder, inputValue, buttons, onClose }) {
    const overlay = document.createElement('div');
    overlay.className = 'global-modal-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', title || 'Modal');

    const card = document.createElement('div');
    card.className = 'global-modal-card';

    if (type) {
        card.classList.add(`type-${type}`);
    }

    if (icon !== undefined && icon !== null) {
        const iconEl = document.createElement('div');
        iconEl.className = 'global-modal-icon';
        iconEl.textContent = icon;
        card.appendChild(iconEl);
    }

    if (title) {
        const titleEl = document.createElement('div');
        titleEl.className = 'global-modal-title';
        titleEl.textContent = title;
        card.appendChild(titleEl);
    }

    if (message) {
        const bodyEl = document.createElement('div');
        bodyEl.className = 'global-modal-body';
        bodyEl.textContent = message;
        card.appendChild(bodyEl);
    }

    if (inputPlaceholder !== undefined) {
        const input = document.createElement('input');
        input.className = 'global-modal-input';
        input.type = 'text';
        input.placeholder = inputPlaceholder;
        input.value = inputValue || '';
        card.appendChild(input);
    }

    const footer = document.createElement('div');
    footer.className = 'global-modal-footer';

    if (buttons.length === 2) {
        footer.classList.add('cols-2');
    } else {
        footer.classList.add('cols-1');
    }

    const buttonElements = [];

    buttons.forEach((btnConfig) => {
        const btn = document.createElement('button');
        btn.className = `global-modal-btn ${btnConfig.variant || 'secondary'}`;
        btn.textContent = btnConfig.label;
        btn.addEventListener('click', () => {
            const result = btnConfig.action();
            close(result);
        });
        footer.appendChild(btn);
        buttonElements.push(btn);
    });

    card.appendChild(footer);
    overlay.appendChild(card);
    document.body.appendChild(overlay);

    let currentFocusIndex = 0;

    function focusButton(index) {
        currentFocusIndex = Math.max(0, Math.min(index, buttonElements.length - 1));
        buttonElements[currentFocusIndex]?.focus();
    }

    overlay.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            close(undefined);
        } else if (e.key === 'Tab') {
            e.preventDefault();
            const direction = e.shiftKey ? -1 : 1;
            focusButton(currentFocusIndex + direction);
        } else if (e.key === 'Enter') {
            const focused = document.activeElement;
            const isInput = focused?.classList.contains('global-modal-input');
            if (!isInput) {
                e.preventDefault();
                buttonElements[currentFocusIndex]?.click();
            }
        }
    });

    function close(result) {
        overlay.classList.remove('open');
        setTimeout(() => {
            if (overlay.parentNode) {
                document.body.removeChild(overlay);
            }
            if (typeof onClose === 'function') {
                onClose(result);
            }
        }, 250);
    }

    requestAnimationFrame(() => {
        overlay.classList.add('open');
        const inputEl = overlay.querySelector('.global-modal-input');
        if (inputEl) {
            inputEl.focus();
            inputEl.select();
        } else {
            focusButton(0);
        }
    });

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            close(undefined);
        }
    });

    return {
        close,
        getElement: () => overlay,
        getInput: () => overlay.querySelector('.global-modal-input'),
    };
}

export function closeAllMelonModals() {
    document.querySelectorAll('.global-modal-overlay').forEach((overlay) => {
        overlay.classList.remove('open');
        setTimeout(() => {
            if (overlay.parentNode) {
                document.body.removeChild(overlay);
            }
        }, 250);
    });
}

if (typeof window !== 'undefined') {
    window.showMelonAlert = showMelonAlert;
    window.showMelonConfirm = showMelonConfirm;
    window.showMelonPrompt = showMelonPrompt;
    window.closeAllMelonModals = closeAllMelonModals;
}
