/* ============================================================
   THEME — Gerenciamento de tema + acessibilidade
   ============================================================ */

import { state } from './state.js';

const MEDIA_DARK = window.matchMedia('(prefers-color-scheme: dark)');

function resolveTheme(theme) {
    if (theme === 'auto') return MEDIA_DARK.matches ? 'dark' : 'light';
    return theme;
}

function apply(theme = state.get('settings').theme) {
    const resolved = resolveTheme(theme);
    const settings = state.get('settings');

    document.documentElement.setAttribute('data-theme', resolved);

    // Atributos de acessibilidade / preferências
    document.body.dataset.animations = (settings.animations && !settings.reduceMotion) ? 'on' : 'off';
    document.body.dataset.blur = settings.blurEffects ? 'on' : 'off';
    document.body.dataset.contrast = settings.highContrast ? 'high' : 'normal';

    // Theme color meta
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', resolved === 'dark' ? '#0a0a0a' : '#ffffff');
}

function init() {
    apply();

    MEDIA_DARK.addEventListener('change', () => {
        if (state.get('settings').theme === 'auto') apply('auto');
    });

    // Aplicar quando settings mudarem
    state.subscribe('settings', (settings) => apply(settings.theme));
}

export const theme = { init, apply };