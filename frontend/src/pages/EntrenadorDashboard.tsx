import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FiPlus, FiRefreshCw } from 'react-icons/fi';
import Layout from '../components/Layout';
import {
  miPerfil,
  listarMisHorarios,
  crearHorario,
  listarMisRutinas,
  crearRutina,
  registrarEvaluacionPeriodica,
  type Horario,
  type Entrenador,
  type Rutina,
} from '../services/entrenadorService';
import { isServerUnreachable, getApiErrorMessage, SERVER_UNREACHABLE_MESSAGE } from '../utils/apiError';

const HOY = () => new Date().toISOString().slice(0, 10);

function esPresionValida(v: string) {
  return /^\d{2,3}\/\d{2,3}$/.test(v.trim());
}

export default function EntrenadorDashboard() {
  const [perfil, setPerfil] = useState<Entrenador | null>(null);
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [rutinas, setRutinas] = useState<Rutina[]>([]);
  const [loading, setLoading] = useState(true);
  const [agregando, setAgregando] = useState(false);
  const [clienteDoc, setClienteDoc] = useState('');
  const [form, setForm] = useState({
    fechaDisponible: HOY(),
    horaInicio: '08:00',
    horaFin: '10:00',
  });
  const [rutinaForm, setRutinaForm] = useState({ nombre: '', descripcion: '', fechaVencimiento: '' });
  const [medForm, setMedForm] = useState({
    peso: '',
    talla: '',
    porcentajeGrasa: '',
    perimetroCintura: '',
    perimetroCadera: '',
    perimetroBrazo: '',
    presionArterial: '',
    frecuenciaCardiaca: '',
  });

  const crearRutinaCliente = async (e: React.FormEvent) => {
    e.preventDefault();
    const doc = Number(clienteDoc);
    if (!doc) {
      toast.error('Ingresa el documento del cliente');
      return;
    }
    try {
      await crearRutina(doc, {
        nombre: rutinaForm.nombre,
        descripcion: rutinaForm.descripcion,
        fechaVencimiento: rutinaForm.fechaVencimiento,
      });
      toast.success('Rutina creada');
      setRutinaForm({ nombre: '', descripcion: '', fechaVencimiento: '' });
      cargar();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'No se pudo crear la rutina'));
    }
  };

  const registrarEvaluacionCliente = async (e: React.FormEvent) => {
    e.preventDefault();
    const doc = Number(clienteDoc);
    if (!doc) {
      toast.error('Ingresa el documento del cliente');
      return;
    }
    if (!esPresionValida(medForm.presionArterial)) {
      toast.error('La presión arterial debe tener el formato 120/80');
      return;
    }
    try {
      await registrarEvaluacionPeriodica(doc, {
        peso: Number(medForm.peso),
        talla: Number(medForm.talla),
        porcentajeGrasa: Number(medForm.porcentajeGrasa),
        perimetroCintura: Number(medForm.perimetroCintura),
        perimetroCadera: Number(medForm.perimetroCadera),
        perimetroBrazo: Number(medForm.perimetroBrazo),
        presionArterial: medForm.presionArterial.trim(),
        frecuenciaCardiaca: Number(medForm.frecuenciaCardiaca),
      });
      toast.success('Evaluación registrada');
      setMedForm({
        peso: '', talla: '', porcentajeGrasa: '', perimetroCintura: '',
        perimetroCadera: '', perimetroBrazo: '', presionArterial: '', frecuenciaCardiaca: '',
      });
      cargar();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'No se pudo registrar la evaluación'));
    }
  };

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const [p, h, r] = await Promise.all([miPerfil(), listarMisHorarios(), listarMisRutinas()]);
      setPerfil(p);
      setHorarios(h);
      setRutinas(r);
    } catch (err) {
      toast.error(
        isServerUnreachable(err)
          ? SERVER_UNREACHABLE_MESSAGE
          : getApiErrorMessage(err, 'No se pudieron cargar tus datos. Revisa que el backend esté activo y que tu documento exista.')
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
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

          {/* Mis rutinas */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="font-semibold text-gray-800 mb-4">Mis rutinas</h3>
            {rutinas.length === 0 ? (
              <p className="text-gray-500 italic">Todavía no has creado rutinas.</p>
            ) : (
              <ul className="space-y-3">
                {rutinas.map((r) => (
                  <li key={r.idRutina} className="border-l-4 border-blue-500 pl-3">
                    <p className="font-medium text-gray-800">{r.nombre}</p>
                    <p className="text-sm text-gray-600">{r.descripcion}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Creada {r.fechaCreacion} · vence {r.fechaVencimiento} ·{' '}
                      {r.activa ? 'activa' : 'vencida'}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Gestionar un cliente por documento */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="font-semibold text-gray-800 mb-4">Gestionar cliente por documento</h3>

            <label className="block text-sm mb-4 sm:max-w-xs">
              Documento del cliente
              <input
                type="number"
                value={clienteDoc}
                onChange={(e) => setClienteDoc(e.target.value)}
                placeholder="Ej: 200000001"
                className="mt-1 w-full px-3 py-2 border rounded-md"
              />
            </label>

            <div className="grid gap-4 lg:grid-cols-2">
              {/* Nueva rutina */}
              <form
                onSubmit={crearRutinaCliente}
                className="space-y-3 border border-gray-200 rounded-md p-4"
              >
                <h4 className="font-medium text-gray-800">Nueva rutina</h4>
                <input
                  type="text"
                  placeholder="Nombre de la rutina"
                  value={rutinaForm.nombre}
                  onChange={(e) => setRutinaForm({ ...rutinaForm, nombre: e.target.value })}
                  className="w-full border rounded px-2 py-1.5"
                  required
                />
                <textarea
                  placeholder="Descripción"
                  value={rutinaForm.descripcion}
                  onChange={(e) => setRutinaForm({ ...rutinaForm, descripcion: e.target.value })}
                  className="w-full border rounded px-2 py-1.5"
                  rows={2}
                  required
                />
                <input
                  type="date"
                  value={rutinaForm.fechaVencimiento}
                  onChange={(e) => setRutinaForm({ ...rutinaForm, fechaVencimiento: e.target.value })}
                  className="w-full border rounded px-2 py-1.5"
                  required
                />
                <button type="submit" className="px-4 py-1.5 bg-blue-600 text-white rounded-md text-sm">
                  Crear rutina
                </button>
              </form>

              {/* Evaluación */}
              <form
                onSubmit={registrarEvaluacionCliente}
                className="space-y-3 border border-gray-200 rounded-md p-4"
              >
                <h4 className="font-medium text-gray-800">Registrar evaluación</h4>
                <div className="grid grid-cols-2 gap-2">
                  <input type="number" step="any" placeholder="Peso (kg)" value={medForm.peso} onChange={(e) => setMedForm({ ...medForm, peso: e.target.value })} className="border rounded px-2 py-1.5" required />
                  <input type="number" step="any" placeholder="Talla (m)" value={medForm.talla} onChange={(e) => setMedForm({ ...medForm, talla: e.target.value })} className="border rounded px-2 py-1.5" required />
                  <input type="number" step="any" placeholder="Grasa (%)" value={medForm.porcentajeGrasa} onChange={(e) => setMedForm({ ...medForm, porcentajeGrasa: e.target.value })} className="border rounded px-2 py-1.5" required />
                  <input type="number" step="any" placeholder="Cintura (cm)" value={medForm.perimetroCintura} onChange={(e) => setMedForm({ ...medForm, perimetroCintura: e.target.value })} className="border rounded px-2 py-1.5" required />
                  <input type="number" step="any" placeholder="Cadera (cm)" value={medForm.perimetroCadera} onChange={(e) => setMedForm({ ...medForm, perimetroCadera: e.target.value })} className="border rounded px-2 py-1.5" required />
                  <input type="number" step="any" placeholder="Brazo (cm)" value={medForm.perimetroBrazo} onChange={(e) => setMedForm({ ...medForm, perimetroBrazo: e.target.value })} className="border rounded px-2 py-1.5" required />
                  <input type="text" placeholder="Presión (120/80)" value={medForm.presionArterial} onChange={(e) => setMedForm({ ...medForm, presionArterial: e.target.value })} className="border rounded px-2 py-1.5" required />
                  <input type="number" placeholder="FC (bpm)" value={medForm.frecuenciaCardiaca} onChange={(e) => setMedForm({ ...medForm, frecuenciaCardiaca: e.target.value })} className="border rounded px-2 py-1.5" required />
                </div>
                <button type="submit" className="px-4 py-1.5 bg-blue-600 text-white rounded-md text-sm">
                  Registrar evaluación
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}