import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiLogIn } from 'react-icons/fi';
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
  const [cargando, setCargando] = useState(false);

  const iniciarSesion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!documento.trim() || !contrasena) {
      toast.error('Ingresa tu documento y tu contraseña');
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
        toast.error(payload?.message || 'Credenciales inválidas');
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
      toast.success('Bienvenido, ' + payload.nombreCompleto);
      navigate(RUTA_POR_ROL[payload.rol] ?? '/');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const mensaje = axiosErr?.response?.data?.message || 'Credenciales inválidas';
      toast.error(mensaje);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <form
        onSubmit={iniciarSesion}
        className="bg-white w-full max-w-md p-8 rounded-xl shadow-sm border border-gray-200 space-y-5"
      >
        <div className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mb-3">
            <FiLogIn className="text-blue-600 h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Victus CAF</h1>
          <p className="text-sm text-gray-500 mt-1">Inicia sesión con tu documento y contraseña</p>
        </div>

        <label className="block text-sm">
          <span className="font-medium text-gray-700">Número de documento</span>
          <input
            type="number"
            value={documento}
            onChange={(e) => setDocumento(e.target.value)}
            className="mt-1 w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="Ej: 100000001"
            required
          />
        </label>

        <label className="block text-sm">
          <span className="font-medium text-gray-700">Contraseña</span>
          <input
            type="password"
            value={contrasena}
            onChange={(e) => setContrasena(e.target.value)}
            className="mt-1 w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="Tu contraseña"
            required
          />
        </label>

        <button
          type="submit"
          disabled={cargando}
          className="w-full py-2.5 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {cargando ? 'Ingresando...' : 'Ingresar'}
        </button>

        <p className="text-center text-xs text-gray-400">
          Los datos de acceso iniciales se cargan en la base (seed). Si es una instalación
          nueva, el documento del admin es <code>100000001</code> y la contraseña{' '}
          <code>admin123</code>.
        </p>
      </form>
    </div>
  );
}