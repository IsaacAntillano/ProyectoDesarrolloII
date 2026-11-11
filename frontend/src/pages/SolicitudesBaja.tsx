import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FiRefreshCw, FiCheckCircle } from 'react-icons/fi';
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
  listarSolicitudesBaja,
  aprobarSolicitudBaja,
  rechazarSolicitudBaja,
  type EstadoSolicitudBaja,
  type SolicitudBaja,
} from '../services/adminService';
import { getApiErrorMessage, isServerUnreachable, SERVER_UNREACHABLE_MESSAGE } from '../utils/apiError';
import { etiqueta, ETIQUETA_ESTADO_SOLICITUD } from '../constants/labels';
import { formatearFecha, formatearNumero } from '../utils/format';

const FILTROS: { value: '' | EstadoSolicitudBaja; label: string }[] = [
  { value: 'PENDIENTE', label: 'Pendientes' },
  { value: 'APROBADA', label: 'Aprobadas' },
  { value: 'RECHAZADA', label: 'Rechazadas' },
  { value: '', label: 'Todas' },
];

const TONE_SOLICITUD: Record<EstadoSolicitudBaja, 'amber' | 'green' | 'red'> = {
  PENDIENTE: 'amber',
  APROBADA: 'green',
  RECHAZADA: 'red',
};

/**
 * Bandeja de solicitudes de baja voluntaria de clientes mensuales (CLT-0005).
 *
 * Aprobar ejecuta la baja: desactiva al cliente, cierra su contrato y libera
 * al entrenador. Rechazar solo deja la observación para el cliente.
 */
export default function SolicitudesBaja() {
  const [filtro, setFiltro] = useState<'' | EstadoSolicitudBaja>('PENDIENTE');
  const [solicitudes, setSolicitudes] = useState<SolicitudBaja[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [aprobando, setAprobando] = useState<SolicitudBaja | null>(null);
  const [observacionAprobacion, setObservacionAprobacion] = useState('');
  const [rechazando, setRechazando] = useState<SolicitudBaja | null>(null);
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setSolicitudes(await listarSolicitudesBaja(filtro || undefined));
    } catch (err) {
      setError(
        isServerUnreachable(err)
          ? SERVER_UNREACHABLE_MESSAGE
          : getApiErrorMessage(err, 'No se pudieron cargar las solicitudes de baja')
      );
    } finally {
      setLoading(false);
    }
  }, [filtro]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void cargar();
  }, [cargar]);

  const confirmarAprobacion = async () => {
    if (!aprobando) return;
    setGuardando(true);
    try {
      await aprobarSolicitudBaja(aprobando.id, observacionAprobacion.trim() || undefined);
      toast.success('Baja aprobada: el cliente quedó inactivo y su entrenador liberado');
      setAprobando(null);
      setObservacionAprobacion('');
      void cargar();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'No se pudo aprobar la baja'));
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
      await rechazarSolicitudBaja(rechazando.id, motivoRechazo.trim());
      toast.success('Solicitud de baja rechazada');
      setRechazando(null);
      setMotivoRechazo('');
      void cargar();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'No se pudo rechazar la solicitud'));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Layout title="Solicitudes de Baja" description="Aprueba o rechaza las bajas voluntarias de clientes mensuales">
      <PageHeader
        title="Solicitudes de baja"
        description="Cada solicitud la envía un cliente particular mensual desde su portal. Al aprobarla se ejecuta la baja: el cliente queda inactivo, el contrato se cierra y el entrenador se libera."
        actions={
          <>
            <label className="sr-only" htmlFor="filtro-bajas">
              Filtrar por estado
            </label>
            <Select
              id="filtro-bajas"
              value={filtro}
              onChange={(e) => setFiltro(e.target.value as '' | EstadoSolicitudBaja)}
              className="!w-auto"
            >
              {FILTROS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </Select>
            <Button variant="secondary" onClick={() => void cargar()} aria-label="Actualizar solicitudes de baja">
              <FiRefreshCw aria-hidden="true" /> Actualizar
            </Button>
          </>
        }
      />

      <HelpTip title="¿Qué pasa al aprobar una baja?">
        <p>
          Se desactiva el registro del cliente, se marca su contrato como vencido en la fecha efectiva
          y se libera el cupo del entrenador. Es irreversible desde esta pantalla: para volver a
          activarlo hay que registrarlo de nuevo.
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
                ? 'No hay solicitudes pendientes. Cuando un cliente pida la baja desde su portal, aparecerá aquí.'
                : 'No hay solicitudes con este estado. Prueba con otro filtro.'
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <caption className="sr-only">Solicitudes de baja voluntaria</caption>
              <thead className="bg-gray-50">
                <tr>
                  {['Fecha', 'Cliente', 'Motivo', 'Estado', 'Observación', 'Acciones'].map((h) => (
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
                    <td className="px-3 py-2 text-sm text-gray-600">{s.motivo || '—'}</td>
                    <td className="px-3 py-2">
                      <StatusBadge tone={TONE_SOLICITUD[s.estado]}>
                        {etiqueta(ETIQUETA_ESTADO_SOLICITUD, s.estado)}
                      </StatusBadge>
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-600">{s.observacionAdmin || '—'}</td>
                    <td className="px-3 py-2">
                      {s.estado === 'PENDIENTE' ? (
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="success"
                            onClick={() => {
                              setAprobando(s);
                              setObservacionAprobacion('');
                            }}
                          >
                            <FiCheckCircle aria-hidden="true" /> Aprobar
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
        title="Aprobar solicitud de baja"
        footer={
          <>
            <Button variant="secondary" onClick={() => setAprobando(null)} disabled={guardando}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={() => void confirmarAprobacion()} loading={guardando}>
              Aprobar baja
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
              . Al aprobar, el cliente queda inactivo, el contrato se cierra y el entrenador se libera.
            </p>
            <Field
              label="Observación (opcional)"
              htmlFor="observacion-aprobacion"
              help="Queda visible para el cliente en su portal"
            >
              <Textarea
                id="observacion-aprobacion"
                rows={3}
                value={observacionAprobacion}
                onChange={(e) => setObservacionAprobacion(e.target.value)}
                placeholder="Ej: baja procesada en la fecha solicitada"
              />
            </Field>
          </>
        )}
      </Modal>

      <Modal
        open={!!rechazando}
        onClose={() => setRechazando(null)}
        title="Rechazar solicitud de baja"
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
            <Field label="Motivo del rechazo" htmlFor="motivo-rechazo-baja" required help="Sé claro: el cliente lo verá">
              <Textarea
                id="motivo-rechazo-baja"
                rows={3}
                value={motivoRechazo}
                onChange={(e) => setMotivoRechazo(e.target.value)}
                placeholder="Ej: el contrato sigue vigente hasta la fecha de vencimiento"
                required
              />
            </Field>
          </>
        )}
      </Modal>
    </Layout>
  );
}
