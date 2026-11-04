import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiLogIn, FiEye, FiEyeOff } from 'react-icons/fi';
import api from '../services/api';

const RUTA_POR_ROL: Record<string, string> = {
  ADMINISTRADOR: '/admin',
  SECRETARIA: '/secretaria',
  ENTRENADOR: '/entrenador',
  CLIENTE: '/cliente',
};

export default function Login() {
  const navigate = useNavigate();
  const [documento, setDocumento] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [mostrar, setMostrar] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sesionExpirada = sessionStorage.getItem('sesionExpirada') === '1';
  if (sesionExpirada) sessionStorage.removeItem('sesionExpirada');

  const iniciarSesion = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!documento.trim() || !contrasena) {
      setError('Ingresa tu documento y tu contraseña');
      return;
    }
    setCargando(true);
    try {
      const { data } = await api.post('/auth/login', {
        documento: documento.trim(),
        contrasena,
      });

      const payload = data?.data ?? data;
      if (!payload?.token) {
        setError(payload?.message || 'Credenciales inválidas');
        return;
      }

      localStorage.setItem(
        'user',
        JSON.stringify({
          id: 0,
          numeroDocumento: Number(documento.trim()),
          nombreCompleto: payload.nombreCompleto,
          rol: payload.rol,
          token: payload.token,
        })
      );
      toast.success(`Bienvenido, ${payload.nombreCompleto}`);
      navigate(RUTA_POR_ROL[payload.rol] ?? '/');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number; data?: { message?: string } } };
      if (!axiosErr.response) {
        setError('No se pudo conectar con el servidor. Verifica que el backend esté activo (puerto 8080).');
      } else if (axiosErr.response.status === 401) {
        setError('Documento o contraseña incorrectos. Revisa tus datos e inténtalo de nuevo.');
      } else {
        setError(axiosErr.response.data?.message || 'Ocurrió un error inesperado. Inténtalo de nuevo.');
      }
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <form
        onSubmit={iniciarSesion}
        noValidate
        className="w-full max-w-md space-y-5 rounded-xl border border-gray-200 bg-white p-8 shadow-sm"
        aria-describedby="login-ayuda"
      >
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50">
            <FiLogIn className="h-6 w-6 text-blue-600" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Victus CAF</h1>
          <p id="login-ayuda" className="mt-1 text-sm text-gray-500">
            Inicia sesión con tu número de documento y tu contraseña
          </p>
        </div>

        {sesionExpirada && (
          <p role="status" className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            Tu sesión expiró. Inicia sesión de nuevo para continuar.
          </p>
        )}

        <div className="text-sm">
          <label htmlFor="login-documento" className="block font-medium text-gray-700">
            Número de documento <span className="text-red-600" aria-hidden="true">*</span>
          </label>
          <input
            id="login-documento"
            type="text"
            inputMode="numeric"
            autoComplete="username"
            value={documento}
            onChange={(e) => setDocumento(e.target.value.replace(/[^\d]/g, ''))}
            placeholder="Ej: 100000001"
            required
            aria-required
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm [&:focus-visible]:outline-none [&:focus-visible]:ring-2 [&:focus-visible]:ring-blue-500"
          />
        </div>

        <div className="text-sm">
          <label htmlFor="login-contrasena" className="block font-medium text-gray-700">
            Contraseña <span className="text-red-600" aria-hidden="true">*</span>
          </label>
          <div className="relative mt-1">
            <input
              id="login-contrasena"
              type={mostrar ? 'text' : 'password'}
              autoComplete="current-password"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              placeholder="Tu contraseña"
              required
              aria-required
              className="w-full rounded-md border border-gray-300 px-3 py-2 pr-20 shadow-sm [&:focus-visible]:outline-none [&:focus-visible]:ring-2 [&:focus-visible]:ring-blue-500"
            />
            <button
              type="button"
              onClick={() => setMostrar(!mostrar)}
              aria-pressed={mostrar}
              aria-label={mostrar ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              className="absolute inset-y-0 right-0 flex items-center gap-1 rounded-r-md px-3 text-xs font-medium text-gray-500 hover:text-gray-800 [&:focus-visible]:outline-none [&:focus-visible]:ring-2 [&:focus-visible]:ring-blue-500"
            >
              {mostrar ? <FiEyeOff aria-hidden="true" /> : <FiEye aria-hidden="true" />}
              {mostrar ? 'Ocultar' : 'Mostrar'}
            </button>
          </div>
        </div>

        {error && (
          <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={cargando}
          aria-busy={cargando || undefined}
          className="w-full rounded-md bg-blue-600 py-2.5 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 [&:focus-visible]:outline-none [&:focus-visible]:ring-2 [&:focus-visible]:ring-blue-500 [&:focus-visible]:ring-offset-2"
        >
          {cargando ? 'Ingresando...' : 'Ingresar'}
        </button>

        <details className="rounded-md border border-gray-200 px-3 py-2 text-xs text-gray-500">
          <summary className="cursor-pointer font-medium text-gray-700 [&:focus-visible]:outline-none [&:focus-visible]:ring-2 [&:focus-visible]:ring-blue-500">
            ¿Primera vez? Credenciales de prueba
          </summary>
          <p className="mt-2 leading-relaxed">
            En una instalación nueva, los datos iniciales se cargan en la base (seed):
          </p>
          <ul className="mt-1 list-disc pl-5 leading-relaxed">
            <li>Administrador: <code>100000001</code> / <code>admin123</code></li>
            <li>Secretaria: <code>100000002</code> / <code>secretaria123</code></li>
            <li>Entrenador: <code>100000003</code> / <code>entrenador123</code></li>
          </ul>
        </details>
      </form>
    </div>
  );
}
