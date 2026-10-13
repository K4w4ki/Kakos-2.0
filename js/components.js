/* ============================================================
   COMPONENTS — Templates HTML reutilizáveis
   ============================================================ */

import { escapeHtml } from './utils.js';
import { AI_AVATAR, AI_NAME } from './config.js';

export const WelcomeScreen = (userName) => `
    <div class="welcome" id="welcome">
        <div class="welcome__avatar">
            <img src="${AI_AVATAR}" alt="${AI_NAME}">
        </div>
        <h1 class="welcome__title">E aí, ${escapeHtml(userName)}! 👋</h1>
        <p class="welcome__subtitle">
            Eu sou o <strong>${AI_NAME}</strong> — seu assistente IA inteligente e brincalhão.
            Manda a pergunta que eu respondo na hora!
        </p>

        <div class="welcome__features">
            <span class="feature-chip"><i class="fas fa-image"></i> Análise de imagens</span>
            <span class="feature-chip"><i class="fas fa-bolt"></i> Respostas rápidas</span>
            <span class="feature-chip"><i class="fas fa-brain"></i> IA avançada</span>
        </div>

        <div class="quick">
            <div class="quick__title"><i class="fas fa-wand-magic-sparkles"></i> Perguntas rápidas</div>
            <div class="quick__grid">
                ${quickCard('fa-robot', 'O que é IA?', 'Explicação simples', 'Me explica o que é inteligência artificial de forma simples')}
                ${quickCard('fa-calendar-check', 'Planejar meu dia', 'Organize sua rotina', 'Me ajuda a planejar meu dia de forma produtiva')}
                ${quickCard('fa-utensils', 'Receita com ovo', 'Ideias para cozinhar', 'Cria uma receita fácil e rápida com ovo')}
                ${quickCard('fa-graduation-cap', 'Dicas de estudo', 'Aprenda melhor', 'Me dá dicas para estudar melhor e ser mais produtivo')}
            </div>
        </div>
    </div>
`;

const quickCard = (icon, text, desc, question) => `
    <button class="quick-card" data-question="${escapeHtml(question)}">
        <div class="quick-card__icon"><i class="fas ${icon}"></i></div>
        <div class="quick-card__text">${escapeHtml(text)}</div>
        <div class="quick-card__desc">${escapeHtml(desc)}</div>
    </button>
`;

export const Message = (msg) => {
    const isUser = msg.role === 'user';
    const avatarHTML = isUser
        ? (msg.userAvatar ? `<img src="${msg.userAvatar}" alt="">` : `<i class="fas fa-user"></i>`)
        : `<img src="${AI_AVATAR}" alt="${AI_NAME}">`;

    const content = isUser
        ? escapeHtml(msg.content).replace(/\n/g, '<br>')
        : (msg.html || escapeHtml(msg.content).replace(/\n/g, '<br>'));

    const imageHTML = msg.image
        ? `<div class="msg__image"><img src="${msg.image}" alt="Imagem anexada"></div>`
        : '';

    return `
        <div class="msg ${isUser ? 'msg--user' : 'msg--ai'}" data-id="${msg.id}">
            <div class="msg__avatar">${avatarHTML}</div>
            <div class="msg__body">
                <div class="msg__bubble">${content}${imageHTML}</div>
                <div class="msg__meta">
                    <span>${isUser ? escapeHtml(msg.userName || 'Você') : AI_NAME}</span>
                    <span>·</span>
                    <span>${msg.timestamp}</span>
                    ${actionsHTML(isUser)}
                </div>
            </div>
        </div>
    `;
};

const actionsHTML = (isUser) => `
    <div class="msg__actions">
        <button class="msg__action" data-action="copy" title="Copiar" aria-label="Copiar">
            <i class="fas fa-copy"></i>
        </button>
        ${isUser ? `
            <button class="msg__action" data-action="edit" title="Editar" aria-label="Editar">
                <i class="fas fa-pen"></i>
            </button>
        ` : `
            <button class="msg__action" data-action="regenerate" title="Regenerar" aria-label="Regenerar">
                <i class="fas fa-rotate"></i>
            </button>
        `}
        <button class="msg__action" data-action="delete" title="Excluir" aria-label="Excluir">
            <i class="fas fa-trash"></i>
        </button>
    </div>
`;

export const TypingIndicator = () => `
    <div class="msg msg--ai msg--typing" id="typing">
        <div class="msg__avatar"><img src="${AI_AVATAR}" alt="${AI_NAME}"></div>
        <div class="msg__bubble">
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
        </div>
    </div>
`;

export const HistoryItem = (chat, isActive = false) => `
    <button class="history__item ${isActive ? 'history__item--active' : ''}" data-id="${chat.id}" type="button">
        <div class="history__title">${escapeHtml(chat.title)}</div>
        <div class="history__meta">
            <span>${chat.messages.length} mensagens</span>
            <span>${chat.when}</span>
        </div>
    </button>
`;