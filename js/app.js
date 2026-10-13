/* ============================================================
   APP — Bootstrap
   ============================================================ */

// ---------- FORÇAR ANIMAÇÕES (ignora preferência do SO) ----------
const originalMatchMedia = window.matchMedia;
window.matchMedia = function (query) {
    if (query.includes('prefers-reduced-motion')) {
        return {
            matches: false, media: query, onchange: null,
            addListener: () => {}, removeListener: () => {},
            addEventListener: () => {}, removeEventListener: () => {},
            dispatchEvent: () => false
        };
    }
    return originalMatchMedia.call(window, query);
};

// ---------- IMPORTS ----------
import { state } from './state.js';
import { storage } from './storage.js';
import { toast } from './toast.js';
import { theme } from './theme.js';
import { AI_AVATAR, AI_NAME, STORAGE_KEYS, DEFAULT_SETTINGS } from './config.js';
import { $, $$, escapeHtml, formatBytes, uid, throttle } from './utils.js';
import {
    renderMessages, renderHistory, sendMessage, updateSendButton,
    updateCharCount, handleImage, newChat, saveHistory, saveCurrentChat
} from './chat.js';
import { openSettings } from './settings.js';

// ---------- APP SHELL ----------
function shellHTML() {
    return `
        <div class="sidebar-overlay" id="sidebar-overlay"></div>

        <aside class="sidebar" id="sidebar" aria-label="Menu lateral">
            <div class="sidebar__brand">
                <div class="sidebar__logo">
                    <img src="${AI_AVATAR}" alt="${AI_NAME}">
                </div>
                <h1 class="sidebar__name">${AI_NAME}</h1>
                <div class="sidebar__status">
                    <span class="status-dot"></span>
                    <span>Online</span>
                </div>
                <button class="btn btn--primary btn--full" id="new-chat-btn" style="margin-top: var(--space-3);">
                    <i class="fas fa-plus"></i> Nova conversa
                </button>
            </div>

            <div class="sidebar__body">
                <div>
                    <div class="section-head">
                        <div class="section-head__title"><i class="fas fa-magnifying-glass"></i> Buscar</div>
                    </div>
                    <input type="text" class="input" id="historySearch" placeholder="Buscar conversas...">
                </div>

                <div>
                    <div class="section-head">
                        <div class="section-head__title"><i class="fas fa-clock-rotate-left"></i> Histórico</div>
                    </div>
                    <div class="history" id="history"></div>
                </div>
            </div>

            <div class="sidebar__footer">
                <button class="user-chip" id="open-settings">
                    <div class="user-chip__avatar">
                        ${state.get('userAvatar')
                            ? `<img src="${state.get('userAvatar')}" alt="">`
                            : `<i class="fas fa-user"></i>`}
                    </div>
                    <div class="user-chip__info">
                        <div class="user-chip__name">${escapeHtml(state.get('userName'))}</div>
                        <div class="user-chip__role">Usuário</div>
                    </div>
                    <i class="fas fa-gear" style="color: var(--fg-tertiary);"></i>
                </button>
            </div>
        </aside>

        <main class="main" id="main-content">
            <header class="header">
                <div class="header__left">
                    <button class="btn-menu" id="menu-btn" aria-label="Menu">
                        <i class="fas fa-bars"></i>
                    </button>
                    <div class="ai-identity">
                        <div class="ai-identity__avatar">
                            <img src="${AI_AVATAR}" alt="${AI_NAME}">
                        </div>
                        <div>
                            <div class="ai-identity__name">
                                ${AI_NAME}
                                <span class="badge">IA</span>
                            </div>
                            <div class="ai-identity__status">
                                <span class="status-dot"></span>
                                <span>Online · Pronto para ajudar</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="header__right">
                    <button class="btn btn--icon" id="export-btn" data-tooltip="Exportar" aria-label="Exportar">
                        <i class="fas fa-download"></i>
                    </button>
                    <button class="btn btn--icon" id="clear-btn" data-tooltip="Limpar" aria-label="Limpar">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </header>

            <div class="messages" id="messages" role="log" aria-live="polite"></div>

            <div class="composer">
                <div class="img-preview" id="image-preview"></div>
                <div class="composer__box">
                    <div class="composer__actions">
                        <button class="btn btn--icon" id="attach-btn" data-tooltip="Anexar imagem" aria-label="Anexar imagem">
                            <i class="fas fa-image"></i>
                        </button>
                        <input type="file" id="image-input" accept="image/*" hidden>
                    </div>
                    <textarea
                        id="composer-input"
                        class="composer__textarea"
                        placeholder="Digite sua mensagem..."
                        rows="1"
                        maxlength="2000"
                        aria-label="Mensagem"
                    ></textarea>
                    <button class="btn-send" id="send-btn" disabled aria-label="Enviar">
                        <i class="fas fa-paper-plane"></i>
                    </button>
                </div>
                <div class="composer__footer">
                    <span id="char-count">0 / 2000</span>
                    <span class="composer__hint">
                        <kbd>Enter</kbd> enviar · <kbd>Shift</kbd>+<kbd>Enter</kbd> nova linha
                    </span>
                </div>
            </div>
        </main>
    `;
}

// ---------- SETUP ----------
function setupHTML() {
    return `
        <div class="setup">
            <div class="setup__card">
                <div class="setup__header">
                    <div class="setup__logo"><img src="${AI_AVATAR}" alt="${AI_NAME}"></div>
                    <h1 class="setup__title">Bem-vindo ao ${AI_NAME}</h1>
                    <p class="setup__subtitle">Vamos configurar seu perfil em 10 segundos</p>
                </div>

                <form class="setup__form" id="setup-form">
                    <div class="setup__field">
                        <label class="setup__label" for="setup-name">
                            <i class="fas fa-user"></i> Como quer ser chamado?
                        </label>
                        <input type="text" class="input" id="setup-name" placeholder="Seu nome..." maxlength="30" autocomplete="off" required>
                    </div>

                    <div class="setup__field">
                        <label class="setup__label"><i class="fas fa-camera"></i> Foto de perfil</label>
                        <div class="avatar-picker" id="setup-picker">
                            <div class="avatar-picker__preview" id="setup-preview"><i class="fas fa-user-circle"></i></div>
                            <div class="avatar-picker__text">
                                <strong>Clique ou arraste</strong>
                                PNG, JPG — até 5MB
                            </div>
                            <input type="file" id="setup-avatar" accept="image/*" hidden>
                        </div>
                    </div>

                    <div class="setup__actions">
                        <button type="button" class="btn btn--ghost" id="setup-skip">Pular foto</button>
                        <button type="submit" class="btn btn--primary" style="flex:1;">
                            <i class="fas fa-arrow-right"></i> Começar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
}

// ---------- SETUP CONTROLLER ----------
function mountSetup() {
    const app = $('#app');
    app.innerHTML = setupHTML();

    const picker = $('#setup-picker');
    const input = $('#setup-avatar');
    const preview = $('#setup-preview');
    const nameInput = $('#setup-name');
    let tempAvatar = '';

    picker.addEventListener('click', () => input.click());
    picker.addEventListener('dragover', (e) => { e.preventDefault(); picker.classList.add('is-dragover'); });
    picker.addEventListener('dragleave', () => picker.classList.remove('is-dragover'));
    picker.addEventListener('drop', (e) => {
        e.preventDefault();
        picker.classList.remove('is-dragover');
        const file = e.dataTransfer.files[0];
        if (file) readAvatar(file);
    });

    input.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) readAvatar(file);
    });

    function readAvatar(file) {
        if (!file.type.startsWith('image/')) return toast.error('Arquivo inválido');
        if (file.size > 5 * 1024 * 1024) return toast.error('Máximo 5MB');
        const reader = new FileReader();
        reader.onload = (ev) => {
            tempAvatar = ev.target.result;
            preview.innerHTML = `<img src="${tempAvatar}" alt="">`;
        };
        reader.readAsDataURL(file);
    }

    $('#setup-skip').addEventListener('click', () => complete(nameInput.value, ''));

    $('#setup-form').addEventListener('submit', (e) => {
        e.preventDefault();
        complete(nameInput.value, tempAvatar);
    });

    setTimeout(() => nameInput.focus(), 200);
}

function complete(name, avatar) {
    const trimmed = name.trim();
    if (!trimmed) {
        toast.warning('Digite seu nome');
        $('#setup-name').focus();
        return;
    }

    state.update({ userName: trimmed, userAvatar: avatar });
    storage.set(STORAGE_KEYS.USER_NAME, trimmed);
    storage.set(STORAGE_KEYS.USER_AVATAR, avatar);
    storage.set(STORAGE_KEYS.HAS_PROFILE, true);

    mountApp();
    toast.success(`Bem-vindo, ${trimmed}!`);
}

// ---------- APP CONTROLLER ----------
function mountApp() {
    const app = $('#app');
    app.innerHTML = shellHTML();

    bindAppEvents();
    renderMessages();
    renderHistory();
    updateSendButton();
    updateCharCount();
}

function bindAppEvents() {
    // Sidebar mobile
    const sidebar = $('#sidebar');
    const overlay = $('#sidebar-overlay');

    $('#menu-btn')?.addEventListener('click', () => {
        sidebar.classList.toggle('is-open');
        overlay.classList.toggle('is-active');
    });

    overlay?.addEventListener('click', () => {
        sidebar.classList.remove('is-open');
        overlay.classList.remove('is-active');
    });

    // Nova conversa
    $('#new-chat-btn')?.addEventListener('click', newChat);

    // Settings
    $('#open-settings')?.addEventListener('click', openSettings);

    // Composer
    const input = $('#composer-input');
    const sendBtn = $('#send-btn');

    input.addEventListener('input', () => {
        input.style.height = 'auto';
        input.style.height = Math.min(input.scrollHeight, 220) + 'px';
        updateCharCount();
        updateSendButton();
    });

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey && state.get('settings').enterToSend) {
            e.preventDefault();
            sendMessage();
        }
    });

    sendBtn.addEventListener('click', sendMessage);

    // Attach image
    const attachBtn = $('#attach-btn');
    const imageInput = $('#image-input');

    attachBtn.addEventListener('click', () => imageInput.click());
    imageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) handleImage(file);
    });

    // Drag & drop no chat
    document.addEventListener('dragover', (e) => { e.preventDefault(); });
    document.addEventListener('drop', (e) => {
        const file = e.dataTransfer?.files?.[0];
        if (file && file.type.startsWith('image/')) {
            e.preventDefault();
            handleImage(file);
        }
    });

    // Paste de imagem
    document.addEventListener('paste', (e) => {
        const item = [...(e.clipboardData?.items || [])].find(i => i.type.startsWith('image/'));
        if (item) {
            const file = item.getAsFile();
            if (file) handleImage(file);
        }
    });

    // Export / Clear
    $('#export-btn')?.addEventListener('click', exportChat);
    $('#clear-btn')?.addEventListener('click', clearChat);

    // History search
    const search = $('#historySearch');
    search?.addEventListener('input', throttle(() => renderHistory(), 150));

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + K = nova conversa
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            newChat();
        }
        // Ctrl/Cmd + , = settings
        if ((e.ctrlKey || e.metaKey) && e.key === ',') {
            e.preventDefault();
            openSettings();
        }
    });
}

function exportChat() {
    const history = state.get('chatHistory');
    if (!history.length) return toast.warning('Sem conversa para exportar');

    const text = history.map(m => {
        const who = m.role === 'user' ? state.get('userName') : AI_NAME;
        return `[${m.timestamp}] ${who}:\n${m.content}\n`;
    }).join('\n---\n\n');

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kako-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Conversa exportada');
}

function clearChat() {
    if (!state.get('chatHistory').length) return toast.info('Nada para limpar');

    import('./confirm.js').then(({ confirm }) => {
        confirm({
            title: 'Limpar conversa?',
            message: 'Todas as mensagens da conversa atual serão apagadas.',
            confirmText: 'Limpar',
            variant: 'danger',
            onConfirm: () => {
                state.set('chatHistory', []);
                storage.set(STORAGE_KEYS.HISTORY, []);
                renderMessages();
                renderHistory();
                toast.success('Conversa limpa');
            }
        });
    });
}

// ---------- BOOTSTRAP ----------
function bootstrap() {
    // Session
    let sessionId = storage.get(STORAGE_KEYS.SESSION_ID);
    if (!sessionId) {
        sessionId = uid();
        storage.set(STORAGE_KEYS.SESSION_ID, sessionId);
    }
    state.set('sessionId', sessionId);

    // Settings
    const settings = { ...DEFAULT_SETTINGS, ...(storage.get(STORAGE_KEYS.SETTINGS) || {}) };
    state.set('settings', settings);

    // Theme
    theme.init();

    // Data
    state.set('chatHistory', storage.get(STORAGE_KEYS.HISTORY) || []);
    state.set('savedChats', storage.get(STORAGE_KEYS.SAVED) || []);
    state.set('userName', storage.get(STORAGE_KEYS.USER_NAME) || '');
    state.set('userAvatar', storage.get(STORAGE_KEYS.USER_AVATAR) || '');

    // Route
    const hasProfile = storage.get(STORAGE_KEYS.HAS_PROFILE);
    if (!hasProfile || !state.get('userName')) {
        mountSetup();
    } else {
        mountApp();
    }

    // Hide preloader
    setTimeout(() => {
        document.getElementById('preloader')?.classList.add('hidden');
    }, 700);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
} else {
    bootstrap();
}