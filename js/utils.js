/* ============================================================
   UTILS — Funções utilitárias
   ============================================================ */

export const $  = (sel, ctx = document) => ctx.querySelector(sel);
export const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

export const sleep = (ms) => new Promise(r => setTimeout(r, ms));

export function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = String(text ?? '');
    return div.innerHTML;
}

export function formatTime(date = new Date()) {
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export function formatDate(date) {
    const now = new Date();
    const diff = Math.floor((now - date) / 86400000);
    if (diff === 0) return 'Hoje';
    if (diff === 1) return 'Ontem';
    if (diff < 7) return `${diff} dias`;
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

export function formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
}

export function uid() {
    return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/**
 * Renderiza markdown leve (negrito, itálico, código, links)
 */
export function renderMarkdown(text) {
    if (!text) return '';
    let s = escapeHtml(text);
    s = s.replace(/\n/g, '<br>');
    s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/__(.+?)__/g, '<strong>$1</strong>');
    s = s.replace(/(^|[^*])\*([^*\n]+?)\*/g, '$1<em>$2</em>');
    s = s.replace(/(^|[^_])_([^_\n]+?)_/g, '$1<em>$2</em>');
    s = s.replace(/`([^`]+?)`/g, '<code>$1</code>');
    s = s.replace(/\[([^\]]+?)\]\(([^)]+?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    return s;
}

export function debounce(fn, delay = 200) {
    let t;
    return (...args) => {
        clearTimeout(t);
        t = setTimeout(() => fn(...args), delay);
    };
}

export function throttle(fn, limit = 100) {
    let inThrottle = false;
    return (...args) => {
        if (inThrottle) return;
        fn(...args);
        inThrottle = true;
        setTimeout(() => { inThrottle = false; }, limit);
    };
}