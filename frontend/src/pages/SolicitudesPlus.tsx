import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { FiCheck, FiRefreshCw, FiX } from 'react-icons/fi';
import Layout from '../components/Layout';
import {
  listarSolicitudesPlus,
  aprobarSolicitudPlus,
  rechazarSolicitudPlus,
  type EstadoSolicitudPlus,
  type SolicitudPlus,
} from '../services/adminService';
import { listarUsuarios, type UsuarioSistema } from '../services/usuarioSistemaService';
import { getApiErrorMessage, isServerUnreachable, SERVER_UNREACHABLE_MESSAGE } from '../utils/apiError';

const FILTROS: { value: '' | EstadoSolicitudPlus; label: string }[] = [
  { value: 'PENDIENTE', label: 'Pendientes' },
  { value: 'APROBADA', label: 'Aprobadas' },
  { value: 'RECHAZADA', label: 'Rechazadas' },
  { value: '', label: 'Todas' },
];

const ETIQUETA_ESTADO: Record<EstadoSolicitudPlus, string> = {
  PENDIENTE: 'Pendiente',
  APROBADA: 'Aprobada',
  RECHAZADA: 'Rechazada',
};

const CLASE_ESTADO: Record<EstadoSolicitudPlus, string> = {
  PENDIENTE: 'bg-amber-100 text-amber-800',
  APROBADA: 'bg-green-100 text-green-800',
  RECHAZADA: 'bg-red-100 text-red-800',
};

/**
 * Aprobacion de solicitudes del servicio de entrenador plus (PC-0011).
 *
 * Al aprobar se puede elegir el entrenador; si se deja el automatico, el
 * backend escoge el que tenga menos clientes activos y cupo disponible.
 */
export default function SolicitudesPlus() {
  const [filtro, setFiltro] = useState<'' | EstadoSolicitudPlus>('PENDIENTE');
  const [solicitudes, setSolicitudes] = useState<SolicitudPlus[]>([]);
  const [entrenadores, setEntrenadores] = useState<UsuarioSistema[]>([]);
  const [loading, setLoading] = useState(true);

  const [aprobando, setAprobando] = useState<SolicitudPlus | null>(null);
  const [documentoEntrenador, setDocumentoEntrenador] = useState('');
  const [rechazando, setRechazando] = useState<SolicitudPlus | null>(null);
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const [s, usuarios] = await Promise.all([
        listarSolicitudesPlus(filtro || undefined),
        listarUsuarios(),
      ]);
      setSolicitudes(s);
      setEntrenadores(usuarios.filter((u) => u.rol === 'ENTRENADOR' && u.estado));
    } catch (err) {
      toast.error(
        isServerUnreachable(err)
          ? SERVER_UNREACHABLE_MESSAGE
          : getApiErrorMessage(err, 'No se pudieron cargar las solicitudes')
      );
    } finally {
      setLoading(false);
    }
  }, [filtro]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargar();
  }, [cargar]);

  const pendientes = useMemo(
    () => solicitudes.filter((s) => s.estado === 'PENDIENTE').length,
    [solicitudes]
  );

  const confirmarAprobacion = async () => {
    if (!aprobando) return;
    setGuardando(true);
    try {
      const documento = documentoEntrenador ? Number(documentoEntrenador) : undefined;
      await aprobarSolicitudPlus(aprobando.id, documento);
      toast.success('Solicitud aprobada y entrenador asignado');
      setAprobando(null);
      setDocumentoEntrenador('');
      cargar();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'No se pudo aprobar la solicitud'));
    } finally {
      setGuardando(false);
    }
  };

  const confirmarRechazo = async () => {
    if (!rechazando) return;
    if (!motivoRechazo.trim()) {
      toast.error('Escribe el motivo del rechazo');
      return;
    }
    setGuardando(true);
    try {
      await rechazarSolicitudPlus(rechazando.id, motivoRechazo.trim());
      toast.success('Solicitud rechazada');
      setRechazando(null);
      setMotivoRechazo('');
      cargar();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'No se pudo rechazar la solicitud'));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Layout title="Solicitudes de Entrenador Plus">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="font-semibold text-gray-800">Solicitudes del portal del cliente</h3>
            <p className="text-sm text-gray-500">
              {pendientes > 0
                ? `${pendientes} solicitud${pendientes === 1 ? '' : 'es'} pendiente${pendientes === 1 ? '' : 's'} de respuesta.`
                : 'No hay solicitudes pendientes con el filtro actual.'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={filtro}
              onChange={(e) => setFiltro(e.target.value as '' | EstadoSolicitudPlus)}
              className="px-3 py-1.5 border rounded-md text-sm"
            >
              {FILTROS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={cargar}
              className="flex items-center gap-1 px-3 py-1.5 text-sm border rounded-md hover:bg-gray-50"
            >
              <FiRefreshCw /> Actualizar
            </button>
          </div>
        </div>

        {loading ? (
          <p className="text-gray-500">Cargando...</p>
        ) : solicitudes.length === 0 ? (
          <p className="text-gray-500 italic">No hay solicitudes para mostrar.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Fecha', 'Cliente', 'Estado', 'Observación', 'Entrenador', 'Acciones'].map((h) => (
                    <th
                      key={h}
                      className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {solicitudes.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-sm">{s.fechaSolicitud}</td>
                    <td className="px-3 py-2 text-sm">
                      <p className="font-medium text-gray-800">
                        {s.cliente?.nombreCompleto ?? 'Cliente'}
                      </p>
                      {s.cliente?.numeroDocumento && (
                        <p className="text-xs text-gray-500">{s.cliente.numeroDocumento}</p>
                      )}
                    </td>
                    <td className="px-3 py-2 text-sm">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${CLASE_ESTADO[s.estado]}`}
                      >
                        {ETIQUETA_ESTADO[s.estado]}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-600">{s.observacion || '—'}</td>
                    <td className="px-3 py-2 text-sm">
                      {s.entrenadorAsignado?.nombreCompleto ?? '—'}
                    </td>
                    <td className="px-3 py-2 text-sm">
                      {s.estado === 'PENDIENTE' ? (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setAprobando(s);
                              setDocumentoEntrenador('');
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-md text-xs hover:bg-green-700"
                          >
                            <FiCheck /> Aprobar
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setRechazando(s);
                              setMotivoRechazo('');
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-md text-xs hover:bg-red-700"
                          >
                            <FiX /> Rechazar
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">
                          {s.fechaRespuesta ? `Respondida ${s.fechaRespuesta}` : '—'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {aprobando && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl space-y-4">
            <h3 className="font-bold text-lg">Aprobar solicitud plus</h3>
            <p className="text-sm text-gray-600">
              Cliente: <strong>{aprobando.cliente?.nombreCompleto}</strong>
            </p>
            <label className="block text-sm">
              Entrenador
              <select
                value={documentoEntrenador}
                onChange={(e) => setDocumentoEntrenador(e.target.value)}
                className="mt-1 w-full px-3 py-2 border rounded-md"
              >
                <option value="">Automático (el que tenga menos clientes)</option>
                {entrenadores.map((e) => (
                  <option key={e.idUsuarioSistema} value={e.numeroDeDocumento}>
                    {e.nombreCompleto} — {e.numeroDeDocumento}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setAprobando(null)}
                className="px-4 py-2 border rounded"
                disabled={guardando}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarAprobacion}
                disabled={guardando}
                className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
              >
                Aprobar
              </button>
            </div>
          </div>
        </div>
      )}

      {rechazando && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl space-y-4">
            <h3 className="font-bold text-lg">Rechazar solicitud plus</h3>
            <p className="text-sm text-gray-600">
              Cliente: <strong>{rechazando.cliente?.nombreCompleto}</strong>
            </p>
            <label className="block text-sm">
              Motivo
              <textarea
                value={motivoRechazo}
                onChange={(e) => setMotivoRechazo(e.target.value)}
                rows={3}
                className="mt-1 w-full px-3 py-2 border rounded-md"
                placeholder="Explica por qué no se aprueba la solicitud"
                required
              />
            </label>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRechazando(null)}
                className="px-4 py-2 border rounded"
                disabled={guardando}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarRechazo}
                disabled={guardando}
                className="px-4 py-2 bg-red-600 text-white rounded disabled:opacity-50"
              >
                Rechazar
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
