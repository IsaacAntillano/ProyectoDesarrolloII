import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL ?? '/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

/**
 * El backend autentica por JWT: `Login.tsx` guarda el token en
 * `localStorage['user']` y lo reenviamos como `Authorization: Bearer ...`.
 * Sin token, el backend rechaza con un error (no autorizado).
 */
api.interceptors.request.use((config) => {
    const user = readUserFromStorage();
    if (user?.token) {
        config.headers.set('Authorization', `Bearer ${user.token}`);
    }
    return config;
});

function readUserFromStorage(): { token?: string } | null {
    try {
        const raw = localStorage.getItem('user');
        return raw ? (JSON.parse(raw) as { token?: string }) : null;
    } catch {
        return null;
    }
}

export default api;