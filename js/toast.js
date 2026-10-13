/* ============================================================
   TOAST — Sistema de notificações
   ============================================================ */

import { escapeHtml } from './utils.js';

const ICONS = {
    success: 'fa-check-circle',
    error: 'fa-xmark-circle',
    warning: 'fa-triangle-exclamation',
    info: 'fa-circle-info'
};

const TITLES = {
    success: 'Sucesso',
    error: 'Erro',
    warning: 'Atenção',
    info: 'Info'
};

const MAX_TOASTS = 4;

function show(message, type = 'info', title = '') {
    const root = document.getElementById('toast-root');
    if (!root) return;

    // Limitar quantidade
    while (root.children.length >= MAX_TOASTS) {
        root.firstElementChild?.remove();
    }

    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.setAttribute('role', 'status');
    toast.innerHTML = `
        <div class="toast__icon"><i class="fas ${ICONS[type]}"></i></div>
        <div class="toast__content">
            <div class="toast__title">${escapeHtml(title || TITLES[type])}</div>
            <div class="toast__message">${escapeHtml(message)}</div>
        </div>
    `;

    root.appendChild(toast);

    const remove = () => {
        toast.classList.add('toast--leaving');
        setTimeout(() => toast.remove(), 250);
    };

    const timer = setTimeout(remove, 3800);
    toast.addEventListener('click', () => { clearTimeout(timer); remove(); });
}

export const toast = {
    show,
    success: (msg, title) => show(msg, 'success', title),
    error:   (msg, title) => show(msg, 'error', title),
    warning: (msg, title) => show(msg, 'warning', title),
    info:    (msg, title) => show(msg, 'info', title)
};