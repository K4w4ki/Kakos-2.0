/* ============================================================
   STATE — Store reativo minimalista com pub/sub
   ============================================================ */

import { DEFAULT_SETTINGS } from './config.js';

class Store {
    constructor() {
        this._state = {
            sessionId: null,
            userName: '',
            userAvatar: '',
            chatHistory: [],
            savedChats: [],
            settings: { ...DEFAULT_SETTINGS },
            currentImage: null,
            isProcessing: false,
            isReady: false
        };
        this._listeners = new Map();
    }

    get(key) {
        return key ? this._state[key] : this._state;
    }

    set(key, value) {
        const prev = this._state[key];
        if (prev === value) return;
        this._state[key] = value;
        this._emit(key, value, prev);
        this._emit('*', this._state, null);
    }

    update(patch) {
        Object.entries(patch).forEach(([k, v]) => this.set(k, v));
    }

    subscribe(key, handler) {
        if (!this._listeners.has(key)) this._listeners.set(key, new Set());
        this._listeners.get(key).add(handler);
        return () => this._listeners.get(key)?.delete(handler);
    }

    _emit(key, value, prev) {
        this._listeners.get(key)?.forEach(fn => {
            try { fn(value, prev); } catch (e) { console.error(e); }
        });
    }
}

export const state = new Store();