/* ============================================================
   CHAT — Orquestração do chat
   ============================================================ */

import { state } from './state.js';
import { storage } from './storage.js';
import { toast } from './toast.js';
import * as api from './api.js';
import { Message, TypingIndicator, WelcomeScreen, HistoryItem } from './components.js';
import { STORAGE_KEYS, LIMITS, AI_AVATAR, AI_NAME } from './config.js';
import {
    $, $$, escapeHtml, formatTime, formatDate, renderMarkdown,
    uid, sleep, scrollToBottom as _scrollToBottom
} from './utils.js';

/* ---------- HISTORY ---------- */
export function saveHistory() {
    if (!state.get('settings').saveChatHistory) return;
    storage.set(STORAGE_KEYS.HISTORY, state.get('chatHistory'));
}

export function saveCurrentChat() {
    const history = state.get('chatHistory');
    if (!history.length) return;

    const firstUser = history.find(m => m.role === 'user');
    const chat = {
        id: uid(),
        title: (firstUser?.content || 'Conversa').slice(0, 40),
        messages: [...history],
        timestamp: Date.now()
    };

    const saved = state.get('savedChats');
    saved.push(chat);
    while (saved.length > LIMITS.MAX_HISTORY_ITEMS) saved.shift();
    state.set('savedChats', saved);
    storage.set(STORAGE_KEYS.SAVED, saved);
}

export function newChat() {
    if (state.get('chatHistory').length) saveCurrentChat();

    state.set('chatHistory', []);
    storage.set(STORAGE_KEYS.HISTORY, []);

    renderMessages();
    renderHistory();
    toast.success('Nova conversa iniciada');
}

export function loadChat(id) {
    const chat = state.get('savedChats').find(c => c.id === id);
    if (!chat) return;

    if (state.get('chatHistory').length) saveCurrentChat();

    state.set('chatHistory', [...chat.messages]);
    saveHistory();
    renderMessages();
    renderHistory();
    toast.success('Conversa carregada');
}

/* ---------- RENDER ---------- */
export function renderMessages() {
    const container = $('#messages');
    if (!container) return;

    const history = state.get('chatHistory');
    if (!history.length) {
        container.innerHTML = WelcomeScreen(state.get('userName'));
        return;
    }

    container.innerHTML = history.map(Message).join('');
    container.querySelectorAll('.msg').forEach(bindMessageActions);
    scrollToBottom(false);
}

export function renderHistory() {
    const list = $('#history');
    if (!list) return;

    const current = state.get('chatHistory');
    const saved = state.get('savedChats');
    const search = $('#historySearch')?.value?.toLowerCase() || '';

    let html = '';

    if (current.length) {
        const firstUser = current.find(m => m.role === 'user');
        const title = firstUser?.content?.slice(0, 40) || 'Nova conversa';
        if (!search || title.toLowerCase().includes(search)) {
            html += HistoryItem({ id: 'current', title, messages: current, when: 'Agora' }, true);
        }
    }

    [...saved].reverse().forEach(chat => {
        if (search && !chat.title.toLowerCase().includes(search)) return;
        html += HistoryItem({ ...chat, when: formatDate(new Date(chat.timestamp)) });
    });

    if (!html) {
        html = `
            <div class="history__empty">
                <i class="fas fa-comments"></i>
                <p>${search ? 'Nada encontrado' : 'Nenhuma conversa'}</p>
                <span>${search ? 'Tente outra busca' : 'Comece a conversar!'}</span>
            </div>
        `;
    }

    list.innerHTML = html;

    list.querySelectorAll('.history__item').forEach(el => {
        el.addEventListener('click', () => {
            const id = el.dataset.id;
            if (id === 'current') return;
            loadChat(id);
        });
    });
}

/* ---------- SEND ---------- */
export async function sendMessage() {
    if (state.get('isProcessing')) {
        toast.warning('Aguarde a resposta anterior');
        return;
    }

    const input = $('#composer-input');
    const text = input.value.trim();
    const image = state.get('currentImage');

    if (!text && !image) return;

    state.set('isProcessing', true);
    updateSendButton();

    try {
        $('#welcome')?.remove();

        const userMsg = {
            id: uid(),
            role: 'user',
            content: text || '[Imagem anexada]',
            image,
            userName: state.get('userName'),
            userAvatar: state.get('userAvatar'),
            timestamp: formatTime()
        };

        const history = [...state.get('chatHistory'), userMsg];
        state.set('chatHistory', history);
        appendMessage(userMsg);

        // reset input
        input.value = '';
        input.style.height = 'auto';
        updateCharCount();
        clearImagePreview();

        // typing
        const container = $('#messages');
        container.insertAdjacentHTML('beforeend', TypingIndicator());
        scrollToBottom();

        // API
        const reply = await api.sendMessage(history, image);

        $('#typing')?.remove();

        const aiMsg = {
            id: uid(),
            role: 'assistant',
            content: reply,
            timestamp: formatTime()
        };

        state.set('chatHistory', [...state.get('chatHistory'), aiMsg]);
        saveHistory();
        await appendMessageTyped(aiMsg);
        renderHistory();
        playNotificationSound();
    } catch (err) {
        console.error(err);
        $('#typing')?.remove();
        toast.error('Erro ao enviar mensagem');
    } finally {
        state.set('isProcessing', false);
        updateSendButton();
        $('#composer-input')?.focus();
    }
}

/* ---------- APPEND ---------- */
function appendMessage(msg) {
    const container = $('#messages');
    container.insertAdjacentHTML('beforeend', Message(msg));
    const el = container.lastElementChild;
    bindMessageActions(el);
    scrollToBottom();
}

async function appendMessageTyped(msg) {
    const container = $('#messages');
    const html = Message({ ...msg, content: '', html: '' });
    container.insertAdjacentHTML('beforeend', html);

    const el = container.lastElementChild;
    const bubble = el.querySelector('.msg__bubble');

    const speed = Math.max(15, Math.min(150, state.get('settings').typingSpeed));
    const delay = Math.max(8, 1000 / speed);

    const text = msg.content;
    let displayed = '';

    for (let i = 0; i < text.length; i++) {
        displayed += text[i];
        bubble.innerHTML = renderMarkdown(displayed) + '<span class="typing-cursor"></span>';
        if (i % 25 === 0) scrollToBottom();
        if ('.!?'.includes(text[i])) await sleep(60);
        await sleep(delay);
    }

    bubble.innerHTML = renderMarkdown(text);
    bindMessageActions(el);
    scrollToBottom();
}

/* ---------- ACTIONS ---------- */
function bindMessageActions(el) {
    el.querySelectorAll('.msg__action').forEach(btn => {
        btn.addEventListener('click', () => {
            const action = btn.dataset.action;
            const id = el.dataset.id;
            const history = state.get('chatHistory');
            const msg = history.find(m => m.id === id);
            if (!msg) return;

            if (action === 'copy') {
                navigator.clipboard.writeText(msg.content).then(() => toast.success('Copiado!'));
            } else if (action === 'edit') {
                const input = $('#composer-input');
                input.value = msg.content;
                input.dispatchEvent(new Event('input'));
                input.focus();
            } else if (action === 'regenerate') {
                regenerate(id);
            } else if (action === 'delete') {
                deleteMessage(id);
            }
        });
    });
}

function regenerate(id) {
    const history = state.get('chatHistory');
    const idx = history.findIndex(m => m.id === id);
    if (idx === -1) return;

    const userMsg = [...history.slice(0, idx)].reverse().find(m => m.role === 'user');
    if (!userMsg) return;

    state.set('chatHistory', history.filter(m => m.id !== id));
    const input = $('#composer-input');
    input.value = userMsg.content;
    sendMessage();
}

function deleteMessage(id) {
    const el = $(`.msg[data-id="${id}"]`);
    if (el) {
        el.style.transition = 'opacity 200ms, transform 200ms';
        el.style.opacity = '0';
        el.style.transform = 'translateX(20px)';
        setTimeout(() => el.remove(), 200);
    }
    state.set('chatHistory', state.get('chatHistory').filter(m => m.id !== id));
    saveHistory();
}

/* ---------- INPUT ---------- */
export function updateSendButton() {
    const btn = $('#send-btn');
    const input = $('#composer-input');
    if (!btn || !input) return;
    btn.disabled = state.get('isProcessing') || (!input.value.trim() && !state.get('currentImage'));
}

export function updateCharCount() {
    const el = $('#char-count');
    const input = $('#composer-input');
    if (!el || !input) return;
    const len = input.value.length;
    el.textContent = `${len} / ${LIMITS.MAX_MESSAGE_LENGTH}`;
    el.style.color = len > 1800 ? 'var(--color-danger)'
        : len > 1500 ? 'var(--color-warning)'
        : 'var(--fg-tertiary)';
}

/* ---------- IMAGE ---------- */
export function handleImage(file) {
    if (!file?.type.startsWith('image/')) {
        toast.error('Selecione uma imagem válida');
        return;
    }
    if (file.size > LIMITS.MAX_IMAGE_SIZE) {
        toast.error('A imagem deve ter até 5MB');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        state.set('currentImage', e.target.result);
        showImagePreview(file.name, file.size, e.target.result);
        updateSendButton();
    };
    reader.readAsDataURL(file);
}

function showImagePreview(name, size, dataUrl) {
    const el = $('#image-preview');
    if (!el) return;

    el.classList.add('is-active');
    el.innerHTML = `
        <div class="img-preview__thumb"><img src="${dataUrl}" alt=""></div>
        <div class="img-preview__info">
            <div class="img-preview__name">${escapeHtml(name)}</div>
            <div class="img-preview__size">${formatBytes(size)}</div>
        </div>
        <button class="btn btn--icon" id="remove-image" aria-label="Remover imagem">
            <i class="fas fa-xmark"></i>
        </button>
    `;
    $('#remove-image').addEventListener('click', clearImagePreview);
}

function clearImagePreview() {
    state.set('currentImage', null);
    const el = $('#image-preview');
    if (el) {
        el.classList.remove('is-active');
        el.innerHTML = '';
    }
    const input = $('#image-input');
    if (input) input.value = '';
    updateSendButton();
}

/* ---------- MISC ---------- */
function scrollToBottom(smooth = true) {
    requestAnimationFrame(() => {
        const el = $('#messages');
        if (!el) return;
        el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });
    });
}

function playNotificationSound() {
    if (!state.get('settings').soundEnabled) return;
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.value = 820;
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
    } catch {}
}