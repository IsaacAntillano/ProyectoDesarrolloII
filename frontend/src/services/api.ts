import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL ?? '/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

/**
 * El backend autoriza por rol declarado en el header `X-Rol` (ver
 * `RolHeaderFilter` en el backend). La vista no maneja token: elige rol en
 * `SeleccionarRol.tsx` y lo guarda en `localStorage['user']`, asi que lo
 * reenviamos en cada peticion.
 *
 * Ojo: esto no es autenticacion. El backend confía en el header. Solo es valido
 * para desarrollo local; no exponer el backend en red.
 */
api.interceptors.request.use((config) => {
    const user = readUserFromStorage();
    if (user?.rol) {
        config.headers.set('X-Rol', user.rol);
        // El backend usa el documento para saber qué entrenador o cliente
        // está llamando (services como EntrenadorService lo requieren).
        if (user.numeroDocumento) {
            config.headers.set('X-Documento', String(user.numeroDocumento));
        }
    }
    return config;
});

function readUserFromStorage(): { rol?: string; numeroDocumento?: number } | null {
    try {
        const raw = localStorage.getItem('user');
        return raw ? (JSON.parse(raw) as { rol?: string; numeroDocumento?: number }) : null;
    } catch {
        // JSON invalido en localStorage: se sigue sin header y el backend
        // respondera 401, que es el comportamiento correcto.
        return null;
    }
}

export default api;