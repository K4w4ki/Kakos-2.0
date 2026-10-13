/* ============================================================
   CONFIG — Constantes da aplicação
   ============================================================ */

export const API_URL = 'https://kako-kakos.vercel.app/api/chat';

export const STORAGE_KEYS = Object.freeze({
    SESSION_ID:  'kako.sessionId',
    USER_NAME:   'kako.userName',
    USER_AVATAR: 'kako.userAvatar',
    HAS_PROFILE: 'kako.hasProfile',
    HISTORY:     'kako.history',
    SAVED:       'kako.savedChats',
    SETTINGS:    'kako.settings'
});

export const DEFAULT_SETTINGS = Object.freeze({
    theme: 'dark',
    typingSpeed: 55,
    soundEnabled: true,
    autoScroll: true,
    enterToSend: true,
    markdown: true,
    desktopNotifications: false,
    saveChatHistory: true,
    animations: true,
    blurEffects: true,
    highContrast: false,
    reduceMotion: false
});

export const LIMITS = Object.freeze({
    MAX_MESSAGE_LENGTH: 2000,
    MAX_IMAGE_SIZE: 5 * 1024 * 1024,
    MAX_HISTORY_ITEMS: 30,
    API_TIMEOUT: 30000
});

export const AI_NAME = 'Kako';
export const AI_AVATAR = 'image/kako-profile.png';