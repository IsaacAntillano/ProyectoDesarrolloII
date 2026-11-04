import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FiRefreshCw, FiCalendar } from 'react-icons/fi';
import Layout from '../components/Layout';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import StatusBadge from '../components/ui/StatusBadge';
import EmptyState from '../components/ui/EmptyState';
import LoadingState from '../components/ui/LoadingState';
import ErrorState from '../components/ui/ErrorState';
import Button from '../components/ui/Button';
import { Field, Input } from '../components/ui/Field';
import HelpTip from '../components/ui/HelpTip';
import ProgressBar from '../components/ui/ProgressBar';
import {
  miPerfil,
  miProgreso,
  misRutinas,
  misEvaluaciones,
  misAsistencias,
  misHorariosDisponibles,
  reservarHorario,
  misSolicitudesPlus,
  solicitarPlus,
  type MiPerfil,
  type MiRutina,
  type MiEvaluacion,
  type MiAsistencia,
  type Progreso,
  type HorarioDisponible,
  type SolicitudPlus,
} from '../services/clientePanelService';
import { isServerUnreachable, getApiErrorMessage, SERVER_UNREACHABLE_MESSAGE } from '../utils/apiError';
import {
  etiqueta,
  ETIQUETA_TIPO_CLIENTE,
  ETIQUETA_ESTADO_MEMBRESIA,
  ETIQUETA_ESTADO_EPS,
  ETIQUETA_TIPO_MEMBRESIA,
  ETIQUETA_ESTADO_CONTRATO,
  ETIQUETA_ESTADO_SOLICITUD,
} from '../constants/labels';
import { formatearFecha, formatearHora, formatearNumero } from '../utils/format';

const TONE_SOLICITUD: Record<SolicitudPlus['estado'], 'amber' | 'green' | 'red'> = {
  PENDIENTE: 'amber',
  APROBADA: 'green',
  RECHAZADA: 'red',
};

export default function ClienteDashboard() {
  const [perfil, setPerfil] = useState<MiPerfil | null>(null);
  const [progreso, setProgreso] = useState<Progreso | null>(null);
  const [rutinas, setRutinas] = useState<MiRutina[]>([]);
  const [evaluaciones, setEvaluaciones] = useState<MiEvaluacion[]>([]);
  const [asistencias, setAsistencias] = useState<MiAsistencia[]>([]);
  const [horarios, setHorarios] = useState<HorarioDisponible[]>([]);
  const [solicitudes, setSolicitudes] = useState<SolicitudPlus[]>([]);
  const [observacionPlus, setObservacionPlus] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [reservando, setReservando] = useState<HorarioDisponible | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [p, prog, r, ev, as] = await Promise.all([
        miPerfil(),
        miProgreso(),
        misRutinas(),
        misEvaluaciones(),
        misAsistencias(),
      ]);
      setPerfil(p);
      setProgreso(prog);
      setRutinas(r);
      setEvaluaciones(ev);
      setAsistencias(as);

      const [h, s] = await Promise.allSettled([misHorariosDisponibles(), misSolicitudesPlus()]);
      setHorarios(h.status === 'fulfilled' ? h.value : []);
      setSolicitudes(s.status === 'fulfilled' ? s.value : []);
    } catch (err) {
      setError(
        isServerUnreachable(err)
          ? SERVER_UNREACHABLE_MESSAGE
          : 'No se pudo cargar tu información. Revisa que el backend esté activo.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargar();
  }, [cargar]);

  const confirmarReserva = async () => {
    if (!reservando) return;
    setGuardando(true);
    try {
      await reservarHorario(reservando.idHorario);
      toast.success('Horario reservado');
      setReservando(null);
      await cargar();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'No se pudo reservar el horario'));
    } finally {
      setGuardando(false);
    }
  };

  const pedirPlus = async () => {
    setGuardando(true);
    try {
      await solicitarPlus(observacionPlus.trim() || undefined);
      toast.success('Solicitud enviada. El administrador la revisará.');
      setObservacionPlus('');
      await cargar();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'No se pudo enviar la solicitud'));
    } finally {
      setGuardando(false);
    }
  };

  const haySolicitudPendiente = solicitudes.some((s) => s.estado === 'PENDIENTE');
  const haySolicitudAprobada = solicitudes.some((s) => s.estado === 'APROBADA');
  const estado = perfil?.estadoMembresia ?? perfil?.estadoContrato;
  const tieneContrato = !!perfil?.contrato;

  return (
    <Layout title="Mi Panel" description="Tu contrato, horarios, rutinas, evaluaciones e ingresos">
      {loading ? (
        <LoadingState message="Cargando tu panel..." filas={4} />
      ) : error ? (
        <ErrorState message={error} onRetry={() => void cargar()} />
      ) : (
        <div className="space-y-6">
          <section className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">
                Hola, {perfil?.nombreCompleto ?? 'cliente'}
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                {perfil?.tipoDeCliente ? etiqueta(ETIQUETA_TIPO_CLIENTE, perfil.tipoDeCliente) : ''}
                {perfil?.numeroDeDocumento ? ` · documento ${formatearNumero(perfil.numeroDeDocumento)}` : ''}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {estado && (
                <StatusBadge tone={estado === 'ACTIVO' ? 'green' : 'red'}>
                  {etiqueta(
                    estado === 'ACTIVO' || estado === 'VENCIDO' || estado === 'BLOQUEADO'
                      ? ETIQUETA_ESTADO_MEMBRESIA
                      : ETIQUETA_ESTADO_EPS,
                    estado
                  )}
                </StatusBadge>
              )}
              <Button variant="secondary" size="sm" onClick={() => void cargar()}>
                <FiRefreshCw aria-hidden="true" /> Actualizar
              </Button>
            </div>
          </section>

          {perfil?.contrato && (
            <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="mb-2 font-semibold text-gray-800">Mi contrato</h3>
              <p className="text-sm text-gray-700">
                Plan {etiqueta(ETIQUETA_TIPO_MEMBRESIA, perfil.contrato.tipoMembresia)} · vigente hasta{' '}
                <strong>{formatearFecha(perfil.contrato.fechaVencimiento)}</strong>{' '}
                <StatusBadge tone={perfil.contrato.estado === 'ACTIVO' ? 'green' : 'amber'}>
                  {etiqueta(ETIQUETA_ESTADO_CONTRATO, perfil.contrato.estado)}
                </StatusBadge>
              </p>
            </section>
          )}

          {perfil?.remision && (
            <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="mb-3 font-semibold text-gray-800">Autorización EPS</h3>
              <ProgressBar
                value={perfil.remision.sesionesAsistidas}
                max={perfil.remision.sesionesAutorizadas}
                label="Sesiones usadas"
                tone={
                  perfil.remision.sesionesAsistidas >= perfil.remision.sesionesAutorizadas
                    ? 'red'
                    : perfil.remision.sesionesAsistidas >= perfil.remision.sesionesAutorizadas * 0.8
                      ? 'amber'
                      : 'green'
                }
              />
              <p className="mt-2 text-xs text-gray-500">
                {perfil.remision.sesionesAutorizadas - perfil.remision.sesionesAsistidas} sesiones
                restantes de la remisión.
              </p>
            </section>
          )}

          <section aria-labelledby="titulo-horarios" className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h3 id="titulo-horarios" className="mb-3 font-semibold text-gray-800 flex items-center gap-2">
              <FiCalendar aria-hidden="true" /> Mi entrenador y horarios
            </h3>
            {horarios.length === 0 ? (
              <EmptyState
                title="No hay horarios disponibles"
                message={
                  tieneContrato && !haySolicitudAprobada
                    ? 'Tu primer mes de entrenador está activo. Cuando termine, pide el servicio Plus para seguir con entrenador.'
                    : 'Cuando tengas un entrenador asignado, aquí verás sus horarios libres para reservar.'
                }
              />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {horarios.map((h) => (
                  <article key={h.idHorario} className="rounded-md border border-gray-200 p-3">
                    <p className="font-medium text-gray-800">{h.entrenador}</p>
                    <p className="text-sm text-gray-600">
                      {formatearFecha(h.fechaDisponible)} · {formatearHora(h.horaInicio)} - {formatearHora(h.horaFin)}
                    </p>
                    <Button size="sm" className="mt-2" onClick={() => setReservando(h)}>
                      Reservar
                    </Button>
                  </article>
                ))}
              </div>
            )}
          </section>

          {perfil?.tipoDeCliente === 'PARTICULAR_MENSUAL' && (
            <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="mb-2 font-semibold text-gray-800">Entrenador Plus</h3>
              <p className="mb-3 text-sm text-gray-600">
                El servicio Plus se puede solicitar después del primer mes de contrato, cuando ya
                no tienes un entrenador activo. El administrador revisa y aprueba la solicitud.
              </p>
              <HelpTip title="¿Qué incluye el servicio Plus?">
                <p>
                  Un entrenador asignado de forma permanente con horarios reservables, rutinas y
                  seguimiento físico. Se cobra una vez según la tarifa Plus vigente. Si tu
                  solicitud es aprobada, verás quién es tu entrenador aquí.
                </p>
              </HelpTip>

              {solicitudes.length > 0 && (
                <ul className="mb-4 mt-3 space-y-2">
                  {solicitudes.map((s) => (
                    <li key={s.id} className="flex flex-wrap items-center gap-2 border-b pb-2 text-sm">
                      <span className="text-gray-700">Solicitud del {formatearFecha(s.fechaSolicitud)}</span>
                      <StatusBadge tone={TONE_SOLICITUD[s.estado]}>
                        {etiqueta(ETIQUETA_ESTADO_SOLICITUD, s.estado)}
                      </StatusBadge>
                      {s.estado === 'APROBADA' && s.entrenadorAsignado && (
                        <span className="text-xs text-gray-500">
                          Entrenador: {s.entrenadorAsignado.nombreCompleto}
                        </span>
                      )}
                      {s.observacion && <span className="text-xs text-gray-500">{s.observacion}</span>}
                    </li>
                  ))}
                </ul>
              )}

              {haySolicitudPendiente ? (
                <p role="status" className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                  Tu solicitud está pendiente de respuesta del administrador. Te avisaremos aquí cuando respondan.
                </p>
              ) : haySolicitudAprobada ? (
                <p role="status" className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-900">
                  Ya tienes un entrenador Plus asignado. Puedes reservar sus horarios arriba.
                </p>
              ) : (
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                  <Field label="Observación (opcional)" htmlFor="obs-plus" className="flex-1">
                    <Input
                      id="obs-plus"
                      type="text"
                      value={observacionPlus}
                      onChange={(e) => setObservacionPlus(e.target.value)}
                      placeholder="Ej: prefiero entrenamiento en la mañana"
                    />
                  </Field>
                  <Button onClick={() => void pedirPlus()} loading={guardando}>
                    Solicitar entrenador Plus
                  </Button>
                </div>
              )}
            </section>
          )}

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">Peso perdido</p>
              <p className="mt-1 text-2xl font-bold text-gray-800">
                {(progreso?.pesoPerdido ?? 0) > 0 ? `${progreso?.pesoPerdido} kg` : '0 kg'}
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">IMC actual</p>
              <p className="mt-1 text-2xl font-bold text-gray-800">
                {progreso?.imcActual?.toFixed(2) ?? '—'}
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">Grasa corporal</p>
              <p className="mt-1 text-2xl font-bold text-gray-800">
                {progreso?.porcentajeGrasaActual != null ? `${progreso.porcentajeGrasaActual}%` : '—'}
              </p>
            </div>
          </div>

          <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-3 font-semibold text-gray-800">Mi rutina</h3>
            {rutinas.length === 0 ? (
              <EmptyState
                title="Aún no tienes una rutina"
                message="Tu entrenador la creará cuando tenga tu primera evaluación. Si ya tienes entrenador y no ves nada, coméntale en tu próxima sesión."
              />
            ) : (
              <ul className="space-y-3">
                {rutinas.map((r) => (
                  <li key={r.idRutina} className="border-l-4 border-blue-500 pl-3">
                    <p className="font-medium text-gray-800">{r.nombre}</p>
                    <p className="text-sm text-gray-600">{r.descripcion}</p>
                    <p className="mt-1 text-xs text-gray-500">Vence {formatearFecha(r.fechaVencimiento)}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <div className="grid gap-4 lg:grid-cols-2">
            <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="mb-3 font-semibold text-gray-800">Evaluaciones físicas</h3>
              {evaluaciones.length === 0 ? (
                <EmptyState
                  title="Sin evaluaciones registradas"
                  message="Tu entrenador registrará tus medidas (peso, IMC, grasa) en cada evaluación periódica."
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <caption className="sr-only">Historial de evaluaciones físicas</caption>
                    <thead className="bg-gray-50">
                      <tr>
                        {['Fecha', 'Peso', 'IMC', 'Grasa'].map((h) => (
                          <th key={h} scope="col" className="px-2 py-2 text-left text-xs font-medium uppercase text-gray-500">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {evaluaciones.map((e) => (
                        <tr key={e.id} className="hover:bg-gray-50">
                          <td className="px-2 py-2 text-sm">{formatearFecha(e.fechaEvaluacion)}</td>
                          <td className="px-2 py-2 text-sm">{e.peso} kg</td>
                          <td className="px-2 py-2 text-sm">{e.imc.toFixed(1)}</td>
                          <td className="px-2 py-2 text-sm">{e.porcentajeGrasa}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="mb-3 font-semibold text-gray-800">Mis ingresos</h3>
              {asistencias.length === 0 ? (
                <EmptyState
                  title="Todavía no has registrado ingresos"
                  message="Cuando ingreses al gimnasio, la secretaría marcará tu asistencia y aparecerá aquí."
                />
              ) : (
                <ul className="space-y-2">
                  {asistencias.map((a) => (
                    <li key={a.id} className="flex justify-between border-b pb-1 text-sm">
                      <span className="text-gray-700">{formatearFecha(a.fechaIngreso)}</span>
                      <span className="text-gray-500">{formatearHora(a.horaIngreso)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!reservando}
        onClose={() => setReservando(null)}
        onConfirm={() => void confirmarReserva()}
        loading={guardando}
        variant="primary"
        title="Reservar horario"
        confirmLabel="Confirmar reserva"
        message={
          reservando ? (
            <>
              ¿Reservar el horario con <strong>{reservando.entrenador}</strong> del{' '}
              <strong>{formatearFecha(reservando.fechaDisponible)}</strong> de{' '}
              <strong>{formatearHora(reservando.horaInicio)} a {formatearHora(reservando.horaFin)}</strong>?
              Una vez reservado, ese cupo deja de estar disponible para otros clientes.
            </>
          ) : null
        }
      />
    </Layout>
  );
}
