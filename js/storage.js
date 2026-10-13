/* ============================================================
   STORAGE — Persistência segura com fallback
   ============================================================ */

export const storage = {
    get(key, fallback = null) {
        try {
            const raw = localStorage.getItem(key);
            if (raw === null) return fallback;
            try { return JSON.parse(raw); } catch { return raw; }
        } catch {
            return fallback;
        }
    },

    set(key, value) {
        try {
            const serialized = typeof value === 'string' ? value : JSON.stringify(value);
            localStorage.setItem(key, serialized);
            return true;
        } catch (e) {
            console.warn('Storage set failed:', e);
            return false;
        }
    },

    remove(key) {
        try { localStorage.removeItem(key); } catch {}
    },

    clear() {
        try { localStorage.clear(); } catch {}
    }
};