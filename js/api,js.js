/* ============================================================
   API — Cliente HTTP para o backend
   ============================================================ */

import { API_URL, LIMITS } from './config.js';
import { state } from './state.js';

const FALLBACKS = [
    "E aí! Beleza? 😄 Tô pronto pra ajudar no que precisar!",
    "Olá! Tudo certo? Pode mandar a pergunta que eu respondo!",
    "Opa! Cheguei! 🚀 Como posso te ajudar hoje?",
    "Oi! 👋 Que bom te ver por aqui! Manda a pergunta!"
];

function randomFallback() {
    return FALLBACKS[Math.floor(Math.random() * FALLBACKS.length)];
}

export async function sendMessage(messages, imageData) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), LIMITS.API_TIMEOUT);

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sessionId: state.get('sessionId'),
                messages: messages.slice(-10).map(({ role, content }) => ({ role, content })),
                imageData: Boolean(imageData),
                userName: state.get('userName')
            }),
            signal: controller.signal
        });

        clearTimeout(timer);

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();
        return data.reply || randomFallback();
    } catch (error) {
        clearTimeout(timer);
        if (error.name === 'AbortError') {
            return "Poxa, a conexão tá lenta! 😅 Tenta de novo daqui a pouco?";
        }
        console.warn('API error, using fallback:', error);
        return randomFallback();
    }
}