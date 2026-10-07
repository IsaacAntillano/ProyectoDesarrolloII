import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiShield, FiUsers, FiUserCheck, FiHome } from 'react-icons/fi';

const ROLES = [
  {
    rol: 'ADMINISTRADOR',
    label: 'Administrador',
    descripcion: 'Usuarios del sistema, tarifas, equipos y flujo de caja',
    ruta: '/admin',
    icono: FiShield,
  },
  {
    rol: 'SECRETARIA',
    label: 'Secretaria',
    descripcion: 'Clientes (mensual/diario/EPS), pagos y registro de ingresos',
    ruta: '/secretaria',
    icono: FiUsers,
  },
  {
    rol: 'ENTRENADOR',
    label: 'Entrenador',
    descripcion: 'Clientes asignados, rutinas y seguimiento físico',
    ruta: '/entrenador',
    icono: FiUserCheck,
  },
  {
    rol: 'CLIENTE',
    label: 'Cliente',
    descripcion: 'Progreso, rutinas y estado de mi membresía',
    ruta: '/cliente',
    icono: FiHome,
  },
] as const;

export default function SeleccionarRol() {
  const navigate = useNavigate();
  const [documento, setDocumento] = useState('');

  const entrar = (rol: string, label: string, ruta: string) => {
    const numeroDocumento = Number(documento.trim());
    if (!numeroDocumento || numeroDocumento <= 0) {
      toast.error('Ingresa tu número de documento para continuar');
      return;
    }

    localStorage.setItem(
      'user',
      JSON.stringify({ id: 0, numeroDocumento, nombreCompleto: label, rol })
    );
    navigate(ruta);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <h2 className="text-3xl font-extrabold text-gray-900">Victus CAF</h2>
        <p className="mt-2 text-sm text-gray-600">
          Vista del sistema (MVC) · sin autenticación JWT
        </p>
        <p className="mt-1 text-sm text-gray-500">
          Elige tu rol y escribe tu número de documento
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <label htmlFor="documento" className="block text-sm font-medium text-gray-700 mb-1">
          Número de documento
        </label>
        <input
          id="documento"
          type="number"
          value={documento}
          onChange={(e) => setDocumento(e.target.value)}
          placeholder="Ej: 100000001"
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
        <p className="mt-1 text-xs text-gray-500">
          Se usa para identificarte en la API (header X-Documento). No es una contraseña:
          el backend confía en el valor, así que es solo para desarrollo local.
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-2xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {ROLES.map(({ rol, label, descripcion, ruta, icono: Icono }) => (
            <button
              key={rol}
              type="button"
              onClick={() => entrar(rol, label, ruta)}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 text-left hover:border-blue-400 hover:shadow-md transition text-gray-800"
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <Icono className="h-6 w-6" />
                </span>
                <span className="font-semibold text-gray-900">{label}</span>
              </div>
              <p className="text-sm text-gray-600">{descripcion}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}