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

/**
 * Sesión expirada o inválida (401): se limpia el almacenamiento y se vuelve
 * al inicio con un aviso, en vez de dejar errores sueltos en cada pantalla.
 */
api.interceptors.response.use(
    (res) => res,
    (err) => {
        if (axios.isAxiosError(err) && err.response?.status === 401 && localStorage.getItem('user')) {
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            sessionStorage.setItem('sesionExpirada', '1');
            window.location.assign(import.meta.env.BASE_URL);
        }
        return Promise.reject(err);
    }
);

function readUserFromStorage(): { token?: string } | null {
    try {
        const raw = localStorage.getItem('user');
        return raw ? (JSON.parse(raw) as { token?: string }) : null;
    } catch {
        return null;
    }
}

export default api;
