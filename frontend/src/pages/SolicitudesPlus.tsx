import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FiRefreshCw, FiUserCheck } from 'react-icons/fi';
import Layout from '../components/Layout';
import PageHeader from '../components/ui/PageHeader';
import Modal from '../components/ui/Modal';
import StatusBadge from '../components/ui/StatusBadge';
import EmptyState from '../components/ui/EmptyState';
import LoadingState from '../components/ui/LoadingState';
import ErrorState from '../components/ui/ErrorState';
import Button from '../components/ui/Button';
import { Field, Select, Textarea } from '../components/ui/Field';
import HelpTip from '../components/ui/HelpTip';
import {
  listarSolicitudesPlus,
  aprobarSolicitudPlus,
  rechazarSolicitudPlus,
  type EstadoSolicitudPlus,
  type SolicitudPlus,
} from '../services/adminService';
import { listarUsuarios, type UsuarioSistema } from '../services/usuarioSistemaService';
import { getApiErrorMessage, isServerUnreachable, SERVER_UNREACHABLE_MESSAGE } from '../utils/apiError';
import { etiqueta, ETIQUETA_ESTADO_SOLICITUD } from '../constants/labels';
import { formatearFecha, formatearNumero } from '../utils/format';

const FILTROS: { value: '' | EstadoSolicitudPlus; label: string }[] = [
  { value: 'PENDIENTE', label: 'Pendientes' },
  { value: 'APROBADA', label: 'Aprobadas' },
  { value: 'RECHAZADA', label: 'Rechazadas' },
  { value: '', label: 'Todas' },
];

const CUPO_ENTRENADOR = 4;

const TONE_SOLICITUD: Record<EstadoSolicitudPlus, 'amber' | 'green' | 'red'> = {
  PENDIENTE: 'amber',
  APROBADA: 'green',
  RECHAZADA: 'red',
};

/**
 * Aprobación de solicitudes del servicio de entrenador plus (PC-0011).
 *
 * Al aprobar se puede elegir el entrenador; si se deja el automático, el
 * backend escoge el que tenga menos clientes activos y cupo disponible.
 */
export default function SolicitudesPlus() {
  const [filtro, setFiltro] = useState<'' | EstadoSolicitudPlus>('PENDIENTE');
  const [solicitudes, setSolicitudes] = useState<SolicitudPlus[]>([]);
  const [entrenadores, setEntrenadores] = useState<UsuarioSistema[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [aprobando, setAprobando] = useState<SolicitudPlus | null>(null);
  const [documentoEntrenador, setDocumentoEntrenador] = useState('');
  const [rechazando, setRechazando] = useState<SolicitudPlus | null>(null);
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, usuarios] = await Promise.all([
        listarSolicitudesPlus(filtro || undefined),
        listarUsuarios(),
      ]);
      setSolicitudes(s);
      setEntrenadores(usuarios.filter((u) => u.rol === 'ENTRENADOR' && u.estado));
    } catch (err) {
      setError(
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
    <Layout title="Solicitudes de Entrenador Plus" description="Aprueba o rechaza las solicitudes que llegan desde el portal del cliente">
      <PageHeader
        title="Solicitudes Plus"
        description="Cada solicitud es de un cliente particular mensual que terminó su primer mes sin entrenador. Al aprobar, queda asignado un entrenador."
        actions={
          <>
            <label className="sr-only" htmlFor="filtro-solicitudes">
              Filtrar por estado
            </label>
            <Select
              id="filtro-solicitudes"
              value={filtro}
              onChange={(e) => setFiltro(e.target.value as '' | EstadoSolicitudPlus)}
              className="!w-auto"
            >
              {FILTROS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </Select>
            <Button variant="secondary" onClick={() => void cargar()} aria-label="Actualizar solicitudes">
              <FiRefreshCw aria-hidden="true" /> Actualizar
            </Button>
          </>
        }
      />

      <HelpTip title="¿Cómo se asigna el entrenador?">
        <p>
          Si dejas el modo automático, el sistema elige el entrenador con menos clientes activos que
          todavía tenga cupo (máximo {CUPO_ENTRENADOR} por entrenador). También puedes elegir uno
          específico en el desplegable.
        </p>
      </HelpTip>

      <div className="mt-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        {loading ? (
          <LoadingState message="Cargando solicitudes..." />
        ) : error ? (
          <ErrorState message={error} onRetry={() => void cargar()} />
        ) : solicitudes.length === 0 ? (
          <EmptyState
            title="No hay solicitudes para mostrar"
            message={
              filtro === 'PENDIENTE'
                ? 'No hay solicitudes pendientes con el filtro actual. Cuando un cliente pida el servicio Plus desde su portal, aparecerá aquí.'
                : 'No hay solicitudes con este estado. Prueba con otro filtro.'
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <caption className="sr-only">Solicitudes de entrenador plus</caption>
              <thead className="bg-gray-50">
                <tr>
                  {['Fecha', 'Cliente', 'Estado', 'Observación', 'Entrenador asignado', 'Acciones'].map((h) => (
                    <th key={h} scope="col" className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {solicitudes.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-sm">{formatearFecha(s.fechaSolicitud)}</td>
                    <td className="px-3 py-2">
                      <p className="text-sm font-medium text-gray-900">
                        {s.cliente?.nombreCompleto ?? 'Cliente'}
                      </p>
                      {s.cliente?.numeroDocumento && (
                        <p className="text-xs text-gray-500">{formatearNumero(s.cliente.numeroDocumento)}</p>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <StatusBadge tone={TONE_SOLICITUD[s.estado]}>
                        {etiqueta(ETIQUETA_ESTADO_SOLICITUD, s.estado)}
                      </StatusBadge>
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-600">{s.observacion || '—'}</td>
                    <td className="px-3 py-2 text-sm">{s.entrenadorAsignado?.nombreCompleto ?? '—'}</td>
                    <td className="px-3 py-2">
                      {s.estado === 'PENDIENTE' ? (
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="success"
                            onClick={() => {
                              setAprobando(s);
                              setDocumentoEntrenador('');
                            }}
                          >
                            <FiUserCheck aria-hidden="true" /> Aprobar
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => {
                              setRechazando(s);
                              setMotivoRechazo('');
                            }}
                          >
                            Rechazar
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">
                          {s.fechaRespuesta ? `Respondida ${formatearFecha(s.fechaRespuesta)}` : '—'}
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

      <Modal
        open={!!aprobando}
        onClose={() => setAprobando(null)}
        title="Aprobar solicitud Plus"
        footer={
          <>
            <Button variant="secondary" onClick={() => setAprobando(null)} disabled={guardando}>
              Cancelar
            </Button>
            <Button variant="success" onClick={() => void confirmarAprobacion()} loading={guardando}>
              Aprobar y asignar
            </Button>
          </>
        }
      >
        {aprobando && (
          <>
            <p className="text-sm text-gray-600">
              Cliente: <strong>{aprobando.cliente?.nombreCompleto ?? 'Cliente'}</strong>
              {aprobando.cliente?.numeroDocumento
                ? ` (${formatearNumero(aprobando.cliente.numeroDocumento)})`
                : ''}
            </p>
            <Field
              label="Entrenador"
              htmlFor="entrenador-plus"
              help="Automático: el que tenga menos clientes activos y cupo disponible."
            >
              <Select
                id="entrenador-plus"
                value={documentoEntrenador}
                onChange={(e) => setDocumentoEntrenador(e.target.value)}
              >
                <option value="">Automático (menos clientes, con cupo)</option>
                {entrenadores.map((e) => (
                  <option key={e.idUsuarioSistema} value={e.numeroDeDocumento}>
                    {e.nombreCompleto} — {formatearNumero(e.numeroDeDocumento)}
                  </option>
                ))}
              </Select>
            </Field>
            {entrenadores.length === 0 && (
              <p role="note" className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                No hay entrenadores activos. En modo automático la solicitud no podrá aprobarse.
              </p>
            )}
          </>
        )}
      </Modal>

      <Modal
        open={!!rechazando}
        onClose={() => setRechazando(null)}
        title="Rechazar solicitud Plus"
        footer={
          <>
            <Button variant="secondary" onClick={() => setRechazando(null)} disabled={guardando}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={() => void confirmarRechazo()} loading={guardando}>
              Rechazar
            </Button>
          </>
        }
      >
        {rechazando && (
          <>
            <p className="text-sm text-gray-600">
              Cliente: <strong>{rechazando.cliente?.nombreCompleto ?? 'Cliente'}</strong>. El motivo
              queda visible para el cliente en su portal.
            </p>
            <Field label="Motivo del rechazo" htmlFor="motivo-rechazo" required help="Sé claro: el cliente lo verá">
              <Textarea
                id="motivo-rechazo"
                rows={3}
                value={motivoRechazo}
                onChange={(e) => setMotivoRechazo(e.target.value)}
                placeholder="Ej: por ahora no hay cupos de entrenador disponibles"
                required
              />
            </Field>
          </>
        )}
      </Modal>

    </Layout>
  );
}
