import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FiPlus, FiRefreshCw } from 'react-icons/fi';
import Layout from '../components/Layout';
import {
  miPerfil,
  listarMisHorarios,
  crearHorario,
  type Horario,
  type Entrenador,
} from '../services/entrenadorService';
import { isServerUnreachable, getApiErrorMessage, SERVER_UNREACHABLE_MESSAGE } from '../utils/apiError';

const HOY = () => new Date().toISOString().slice(0, 10);

export default function EntrenadorDashboard() {
  const [perfil, setPerfil] = useState<Entrenador | null>(null);
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [loading, setLoading] = useState(true);
  const [agregando, setAgregando] = useState(false);
  const [form, setForm] = useState({
    fechaDisponible: HOY(),
    horaInicio: '08:00',
    horaFin: '10:00',
  });

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const [p, h] = await Promise.all([miPerfil(), listarMisHorarios()]);
      setPerfil(p);
      setHorarios(h);
    } catch (err) {
      toast.error(
        isServerUnreachable(err)
          ? SERVER_UNREACHABLE_MESSAGE
          : 'No se pudieron cargar tus datos. Revisa que el backend esté activo y que tu documento exista.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargar();
  }, [cargar]);

  const agregarHorario = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await crearHorario({
        fechaDisponible: form.fechaDisponible,
        // El backend espera LocalTime completo (HH:mm:ss).
        horaInicio: `${form.horaInicio}:00`,
        horaFin: `${form.horaFin}:00`,
      });
      toast.success('Horario creado');
      setAgregando(false);
      cargar();
    } catch (err) {
      toast.error(
        isServerUnreachable(err)
          ? SERVER_UNREACHABLE_MESSAGE
          : getApiErrorMessage(err, 'No se pudo crear el horario')
      );
    }
  };

  return (
    <Layout title="Panel de Entrenador">
      {loading ? (
        <p className="text-gray-500">Cargando...</p>
      ) : (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">
              Bienvenido, {perfil?.nombreCompleto ?? 'entrenador'}
            </h2>
            <p className="text-gray-600 mt-1">
              Documento {perfil?.numeroDeDocumento ?? '—'} · manages horarios, rutinas y seguimiento físico
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">Mis horarios</h3>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={cargar}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm border rounded-md hover:bg-gray-50"
                >
                  <FiRefreshCw /> Actualizar
                </button>
                <button
                  type="button"
                  onClick={() => setAgregando((v) => !v)}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  <FiPlus /> Nuevo horario
                </button>
              </div>
            </div>

            {agregando && (
              <form onSubmit={agregarHorario} className="mb-4 grid gap-3 sm:grid-cols-4 bg-gray-50 p-4 rounded-md">
                <label className="text-sm">
                  Fecha
                  <input
                    type="date"
                    required
                    value={form.fechaDisponible}
                    onChange={(e) => setForm({ ...form, fechaDisponible: e.target.value })}
                    className="mt-1 w-full border rounded px-2 py-1.5"
                  />
                </label>
                <label className="text-sm">
                  Hora inicio
                  <input
                    type="time"
                    required
                    value={form.horaInicio}
                    onChange={(e) => setForm({ ...form, horaInicio: e.target.value })}
                    className="mt-1 w-full border rounded px-2 py-1.5"
                  />
                </label>
                <label className="text-sm">
                  Hora fin
                  <input
                    type="time"
                    required
                    value={form.horaFin}
                    onChange={(e) => setForm({ ...form, horaFin: e.target.value })}
                    className="mt-1 w-full border rounded px-2 py-1.5"
                  />
                </label>
                <div className="flex items-end">
                  <button type="submit" className="w-full px-3 py-1.5 bg-green-600 text-white rounded-md text-sm">
                    Guardar
                  </button>
                </div>
              </form>
            )}

            {horarios.length === 0 ? (
              <p className="text-gray-500 italic">Todavía no declaraste horarios.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {['Fecha', 'Inicio', 'Fin', 'Estado'].map((h) => (
                        <th key={h} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {horarios.map((h) => (
                      <tr key={h.idHorario} className="hover:bg-gray-50">
                        <td className="px-3 py-2 text-sm">{h.fechaDisponible}</td>
                        <td className="px-3 py-2 text-sm">{h.horaInicio}</td>
                        <td className="px-3 py-2 text-sm">{h.horaFin}</td>
                        <td className="px-3 py-2 text-sm">
                          {h.disponible ? (
                            <span className="text-green-700">Disponible</span>
                          ) : (
                            <span className="text-gray-500">Asignado</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="font-semibold text-gray-800 mb-2">Próximos pasos</h3>
            <p className="text-gray-600 text-sm">
              La API de rutinas, evaluaciones y metas ya está disponible en{' '}
              <code className="bg-gray-100 px-1 rounded">/api/entrenador</code>. Estas vistas se pueden
              completar sobre esos endpoints.
            </p>
          </div>
        </div>
      )}
    </Layout>
  );
}