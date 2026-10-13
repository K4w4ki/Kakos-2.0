/* ============================================================
   SETTINGS — Painel de configurações
   ============================================================ */

import { state } from './state.js';
import { storage } from './storage.js';
import { toast } from './toast.js';
import { STORAGE_KEYS, DEFAULT_SETTINGS } from './config.js';
import { $, $$, escapeHtml } from './utils.js';
import { renderHistory } from './chat.js';

/* ---------- TEMPLATE ---------- */
function SettingsHTML() {
    const s = state.get('settings');
    const avatar = state.get('userAvatar')
        ? `<img src="${state.get('userAvatar')}" alt="">`
        : `<i class="fas fa-user"></i>`;

    return `
        <div class="modal-overlay" data-modal="settings">
            <div class="modal-dialog settings">
                <div class="settings__header">
                    <h2 class="settings__title"><i class="fas fa-sliders"></i> Configurações</h2>
                    <button class="btn btn--icon" data-close aria-label="Fechar"><i class="fas fa-xmark"></i></button>
                </div>

                <div class="settings__body">
                    <nav class="settings__nav" role="tablist">
                        ${navItem('appearance', 'fa-palette', 'Aparência', true)}
                        ${navItem('account', 'fa-user', 'Conta')}
                        ${navItem('chat', 'fa-comments', 'Chat')}
                        ${navItem('accessibility', 'fa-universal-access', 'Acessibilidade')}
                        ${navItem('advanced', 'fa-triangle-exclamation', 'Avançado')}
                    </nav>

                    <div class="settings__content">
                        ${panelAppearance(s)}
                        ${panelAccount(s, avatar)}
                        ${panelChat(s)}
                        ${panelAccessibility(s)}
                        ${panelAdvanced()}
                    </div>
                </div>

                <div class="settings__footer">
                    <button class="btn btn--ghost" data-close>Cancelar</button>
                    <button class="btn btn--primary" id="save-settings"><i class="fas fa-check"></i> Salvar</button>
                </div>
            </div>
        </div>
    `;
}

const navItem = (id, icon, label, active = false) => `
    <button class="settings__nav-item ${active ? 'is-active' : ''}" data-panel="${id}" role="tab" type="button">
        <i class="fas ${icon}"></i><span>${label}</span>
    </button>
`;

const row = (label, desc, control) => `
    <div class="settings__row">
        <div class="settings__row-info">
            <span class="settings__row-label">${label}</span>
            ${desc ? `<span class="settings__row-desc">${desc}</span>` : ''}
        </div>
        ${control}
    </div>
`;

const toggle = (id, checked) => `
    <label class="toggle">
        <input type="checkbox" id="${id}" ${checked ? 'checked' : ''}>
        <span class="toggle__track"></span>
    </label>
`;

function panelAppearance(s) {
    return `
        <div class="settings__panel is-active" data-panel="appearance" role="tabpanel">
            <h3 class="settings__panel-title"><i class="fas fa-palette"></i> Aparência</h3>

            <div class="settings__group">
                <div class="settings__group-title">Tema</div>
                <div class="theme-grid">
                    ${themeCard('dark', 'Escuro', s.theme)}
                    ${themeCard('light', 'Claro', s.theme)}
                    ${themeCard('auto', 'Automático', s.theme)}
                </div>
            </div>

            <div class="settings__group">
                <div class="settings__group-title">Efeitos visuais</div>
                ${row('Animações', 'Ativar transições suaves', toggle('opt-animations', s.animations))}
                ${row('Efeitos de blur', 'Fundo desfocado', toggle('opt-blur', s.blurEffects))}
            </div>
        </div>
    `;
}

const themeCard = (id, label, current) => `
    <button class="theme-card ${current === id ? 'is-active' : ''}" data-theme="${id}" type="button">
        <div class="theme-card__preview" data-preview="${id}"></div>
        <span class="theme-card__label">${label}</span>
    </button>
`;

function panelAccount(s, avatar) {
    return `
        <div class="settings__panel" data-panel="account" role="tabpanel">
            <h3 class="settings__panel-title"><i class="fas fa-user"></i> Conta</h3>

            <div class="settings__group">
                <div class="settings__group-title">Perfil</div>

                <div class="settings__row" style="flex-direction: column; align-items: stretch;">
                    <div class="settings__row-info" style="margin-bottom: var(--space-3);">
                        <span class="settings__row-label">Nome de exibição</span>
                    </div>
                    <input type="text" class="input" id="opt-username" value="${escapeHtml(s.userName || state.get('userName'))}" maxlength="30">
                </div>

                <div class="settings__row" style="flex-direction: column; align-items: stretch;">
                    <div class="settings__row-info" style="margin-bottom: var(--space-3);">
                        <span class="settings__row-label">Foto de perfil</span>
                    </div>
                    <div class="avatar-picker" id="avatar-picker">
                        <div class="avatar-picker__preview" id="avatar-preview">${avatar}</div>
                        <div class="avatar-picker__text">
                            <strong>Clique ou arraste uma imagem</strong>
                            PNG, JPG — até 5MB
                        </div>
                        <input type="file" id="avatar-input" accept="image/*" hidden>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function panelChat(s) {
    return `
        <div class="settings__panel" data-panel="chat" role="tabpanel">
            <h3 class="settings__panel-title"><i class="fas fa-comments"></i> Chat</h3>

            <div class="settings__group">
                <div class="settings__group-title">Comportamento</div>
                ${row('Rolagem automática', 'Ir para a última mensagem', toggle('opt-autoscroll', s.autoScroll))}
                ${row('Enter para enviar', 'Shift+Enter para nova linha', toggle('opt-enter', s.enterToSend))}
                ${row('Formatação Markdown', 'Negrito, itálico, código', toggle('opt-markdown', s.markdown))}
            </div>

            <div class="settings__group">
                <div class="settings__group-title">Notificações</div>
                ${row('Sons', 'Reproduzir ao receber resposta', toggle('opt-sound', s.soundEnabled))}
                ${row('Notificações do sistema', 'Quando a aba não está em foco', toggle('opt-desktop', s.desktopNotifications))}
            </div>
        </div>
    `;
}

function panelAccessibility(s) {
    return `
        <div class="settings__panel" data-panel="accessibility" role="tabpanel">
            <h3 class="settings__panel-title"><i class="fas fa-universal-access"></i> Acessibilidade</h3>

            <div class="settings__group">
                <div class="settings__group-title">Velocidade de digitação</div>
                ${row('Velocidade', 'Efeito de digitação do Kako', `
                    <div class="range">
                        <input type="range" id="opt-typingspeed" min="10" max="150" value="${s.typingSpeed}">
                        <span class="range__value" id="typingspeed-value">${s.typingSpeed} cps</span>
                    </div>
                `)}
            </div>

            <div class="settings__group">
                <div class="settings__group-title">Visual</div>
                ${row('Alto contraste', 'Melhorar legibilidade', toggle('opt-contrast', s.highContrast))}
                ${row('Reduzir movimento', 'Diminuir animações', toggle('opt-motion', s.reduceMotion))}
            </div>
        </div>
    `;
}

function panelAdvanced() {
    return `
        <div class="settings__panel" data-panel="advanced" role="tabpanel">
            <h3 class="settings__panel-title"><i class="fas fa-triangle-exclamation"></i> Avançado</h3>

            <div class="settings__group">
                <div class="settings__group-title">Gerenciar dados</div>
                <div class="danger-zone">
                    <div class="danger-zone__row">
                        <div class="settings__row-info">
                            <span class="settings__row-label">Limpar histórico</span>
                            <span class="settings__row-desc">Remove todas as conversas salvas</span>
                        </div>
                        <button class="btn btn--danger" id="action-clear-history"><i class="fas fa-trash"></i> Limpar</button>
                    </div>
                    <div class="danger-zone__row">
                        <div class="settings__row-info">
                            <span class="settings__row-label">Resetar preferências</span>
                            <span class="settings__row-desc">Volta ao padrão de fábrica</span>
                        </div>
                        <button class="btn btn--danger" id="action-reset"><i class="fas fa-rotate"></i> Resetar</button>
                    </div>
                    <div class="danger-zone__row">
                        <div class="settings__row-info">
                            <span class="settings__row-label">Exportar dados</span>
                            <span class="settings__row-desc">Backup em JSON</span>
                        </div>
                        <button class="btn btn--ghost" id="action-export"><i class="fas fa-download"></i> Exportar</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

/* ---------- CONTROLLER ---------- */
export function openSettings() {
    const root = document.getElementById('modal-root');
    root.innerHTML = SettingsHTML();
    bindSettings();
    document.body.style.overflow = 'hidden';
}

export function closeSettings() {
    const overlay = document.querySelector('[data-modal="settings"]');
    if (overlay) {
        overlay.style.animation = 'fade-in 150ms reverse';
        setTimeout(() => {
            overlay.remove();
            document.body.style.overflow = '';
        }, 150);
    }
}

function bindSettings() {
    const overlay = document.querySelector('[data-modal="settings"]');

    // close
    overlay.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', closeSettings));
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeSettings(); });

    // Escape
    const onEsc = (e) => {
        if (e.key === 'Escape') { closeSettings(); document.removeEventListener('keydown', onEsc); }
    };
    document.addEventListener('keydown', onEsc);

    // Tabs
    overlay.querySelectorAll('.settings__nav-item').forEach(btn => {
        btn.addEventListener('click', () => {
            overlay.querySelectorAll('.settings__nav-item').forEach(b => b.classList.remove('is-active'));
            overlay.querySelectorAll('.settings__panel').forEach(p => p.classList.remove('is-active'));
            btn.classList.add('is-active');
            overlay.querySelector(`.settings__panel[data-panel="${btn.dataset.panel}"]`)?.classList.add('is-active');
        });
    });

    // Theme cards
    overlay.querySelectorAll('.theme-card').forEach(card => {
        card.addEventListener('click', () => {
            overlay.querySelectorAll('.theme-card').forEach(c => c.classList.remove('is-active'));
            card.classList.add('is-active');
            import('./theme.js').then(m => m.theme.apply(card.dataset.theme));
        });
    });

    // Typing speed
    const range = $('#opt-typingspeed');
    range?.addEventListener('input', () => {
        $('#typingspeed-value').textContent = `${range.value} cps`;
    });

    // Avatar picker
    const picker = $('#avatar-picker');
    const fileInput = $('#avatar-input');
    const preview = $('#avatar-preview');

    picker?.addEventListener('click', () => fileInput.click());
    picker?.addEventListener('dragover', (e) => { e.preventDefault(); picker.classList.add('is-dragover'); });
    picker?.addEventListener('dragleave', () => picker.classList.remove('is-dragover'));
    picker?.addEventListener('drop', (e) => {
        e.preventDefault();
        picker.classList.remove('is-dragover');
        const file = e.dataTransfer.files[0];
        if (file) readAvatar(file, preview);
    });

    fileInput?.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) readAvatar(file, preview);
    });

    // Danger actions
    $('#action-clear-history')?.addEventListener('click', () => {
        import('./confirm.js').then(({ confirm }) => {
            confirm({
                title: 'Limpar histórico?',
                message: 'Todas as conversas salvas serão removidas. Essa ação é irreversível.',
                confirmText: 'Limpar',
                variant: 'danger',
                onConfirm: () => {
                    state.set('savedChats', []);
                    storage.set(STORAGE_KEYS.SAVED, []);
                    renderHistory();
                    toast.success('Histórico limpo');
                }
            });
        });
    });

    $('#action-reset')?.addEventListener('click', () => {
        import('./confirm.js').then(({ confirm }) => {
            confirm({
                title: 'Resetar preferências?',
                message: 'Todas as configurações voltarão ao padrão.',
                confirmText: 'Resetar',
                variant: 'danger',
                onConfirm: () => {
                    state.set('settings', { ...DEFAULT_SETTINGS });
                    storage.set(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
                    import('./theme.js').then(m => m.theme.apply('dark'));
                    closeSettings();
                    toast.success('Preferências resetadas');
                }
            });
        });
    });

    $('#action-export')?.addEventListener('click', () => {
        const data = {
            user: { name: state.get('userName'), hasAvatar: Boolean(state.get('userAvatar')) },
            settings: state.get('settings'),
            chatHistory: state.get('chatHistory'),
            savedChats: state.get('savedChats'),
            exportedAt: new Date().toISOString(),
            version: 2
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `kako-backup-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Dados exportados');
    });

    // Save
    $('#save-settings')?.addEventListener('click', saveSettings);
}

function readAvatar(file, preview) {
    if (!file.type.startsWith('image/')) return toast.error('Arquivo inválido');
    if (file.size > 5 * 1024 * 1024) return toast.error('Máximo 5MB');

    const reader = new FileReader();
    reader.onload = (e) => {
        preview.innerHTML = `<img src="${e.target.result}" alt="">`;
        preview.dataset.dataUrl = e.target.result;
    };
    reader.readAsDataURL(file);
}

function saveSettings() {
    const overlay = document.querySelector('[data-modal="settings"]');
    const settings = { ...state.get('settings') };

    settings.theme = overlay.querySelector('.theme-card.is-active')?.dataset.theme || 'dark';
    settings.animations = $('#opt-animations').checked;
    settings.blurEffects = $('#opt-blur').checked;
    settings.autoScroll = $('#opt-autoscroll').checked;
    settings.enterToSend = $('#opt-enter').checked;
    settings.markdown = $('#opt-markdown').checked;
    settings.soundEnabled = $('#opt-sound').checked;
    settings.desktopNotifications = $('#opt-desktop').checked;
    settings.typingSpeed = parseInt($('#opt-typingspeed').value, 10);
    settings.highContrast = $('#opt-contrast').checked;
    settings.reduceMotion = $('#opt-motion').checked;

    // Avatar
    const preview = $('#avatar-preview');
    if (preview.dataset.dataUrl) {
        state.set('userAvatar', preview.dataset.dataUrl);
        storage.set(STORAGE_KEYS.USER_AVATAR, preview.dataset.dataUrl);
    }

    // Nome
    const name = $('#opt-username').value.trim();
    if (name && name !== state.get('userName')) {
        state.set('userName', name);
        storage.set(STORAGE_KEYS.USER_NAME, name);
        // update UI
        document.querySelectorAll('.user-chip__name').forEach(el => el.textContent = name);
    }

    state.set('settings', settings);
    storage.set(STORAGE_KEYS.SETTINGS, settings);

    import('./theme.js').then(m => m.theme.apply(settings.theme));

    closeSettings();
    toast.success('Configurações salvas');
}