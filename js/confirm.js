/* ============================================================
   CONFIRM — Diálogo de confirmação
   ============================================================ */

import { escapeHtml } from './utils.js';

export function confirm({ title, message, confirmText = 'Confirmar', cancelText = 'Cancelar', variant = 'warning', onConfirm }) {
    const root = document.getElementById('modal-root');
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    overlay.innerHTML = `
        <div class="modal-dialog confirm">
            <div class="confirm__icon confirm__icon--${variant}">
                <i class="fas ${variant === 'danger' ? 'fa-triangle-exclamation' : 'fa-circle-question'}"></i>
            </div>
            <h3 class="confirm__title">${escapeHtml(title)}</h3>
            <p class="confirm__message">${escapeHtml(message)}</p>
            <div class="confirm__actions">
                <button class="btn btn--ghost" data-action="cancel">${escapeHtml(cancelText)}</button>
                <button class="btn ${variant === 'danger' ? 'btn--danger' : 'btn--primary'}" data-action="confirm">${escapeHtml(confirmText)}</button>
            </div>
        </div>
    `;

    root.appendChild(overlay);

    const close = () => {
        overlay.style.animation = 'fade-in 150ms reverse';
        setTimeout(() => overlay.remove(), 150);
    };

    overlay.querySelector('[data-action="cancel"]').onclick = close;
    overlay.querySelector('[data-action="confirm"]').onclick = () => { close(); onConfirm?.(); };
    overlay.onclick = (e) => { if (e.target === overlay) close(); };

    const onEsc = (e) => { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', onEsc); } };
    document.addEventListener('keydown', onEsc);
}