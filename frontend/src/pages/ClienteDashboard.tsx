import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FiRefreshCw, FiActivity } from 'react-icons/fi';
import Layout from '../components/Layout';
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

const ETIQUETA_ESTADO: Record<string, string> = {
  ACTIVO: 'Activo',
  VENCIDO: 'Vencido',
  BLOQUEADO: 'Bloqueado',
  FINALIZADO: 'Finalizado',
  CANCELADO_ANTICIPADAMENTE: 'Cancelado',
};

const ETIQUETA_SOLICITUD: Record<SolicitudPlus['estado'], string> = {
  PENDIENTE: 'Pendiente',
  APROBADA: 'Aprobada',
  RECHAZADA: 'Rechazada',
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
  const [loading, setLoading] = useState(true);

  const cargar = useCallback(async () => {
    setLoading(true);
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

      // Horarios y solicitudes plus solo existen para clientes con entrenador;
      // un cliente diario o sin asignacion recibe error y se muestra vacio.
      const [h, s] = await Promise.allSettled([misHorariosDisponibles(), misSolicitudesPlus()]);
      setHorarios(h.status === 'fulfilled' ? h.value : []);
      setSolicitudes(s.status === 'fulfilled' ? s.value : []);
    } catch (err) {
      toast.error(
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

  const reservar = async (idHorario: number) => {
    setGuardando(true);
    try {
      await reservarHorario(idHorario);
      toast.success('Horario reservado');
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

  const estado = perfil?.estadoMembresia ?? perfil?.estadoContrato;

  return (
    <Layout title="Mi Panel - Victus CAF">
      {loading ? (
        <p className="text-gray-500">Cargando...</p>
      ) : (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">
                Hola, {perfil?.nombreCompleto ?? 'cliente'}
              </h2>
              <p className="text-gray-600 mt-1">
                {perfil?.tipoDeCliente === 'PARTICULAR_MENSUAL' && 'Particular mensual'}
                {perfil?.tipoDeCliente === 'PARTICULAR_DIARIO' && 'Particular diario'}
                {perfil?.tipoDeCliente === 'BENEFICIARIO_EPS' && 'Beneficiario EPS'}
                {perfil?.numeroDeDocumento ? ` · documento ${perfil.numeroDeDocumento}` : ''}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {estado && (
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    estado === 'ACTIVO'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {ETIQUETA_ESTADO[estado] ?? estado}
                </span>
              )}
              <button
                type="button"
                onClick={cargar}
                className="flex items-center gap-1 px-3 py-1.5 text-sm border rounded-md hover:bg-gray-50"
              >
                <FiRefreshCw /> Actualizar
              </button>
            </div>
          </div>

          {perfil?.contrato && (
            <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
              <h3 className="font-semibold text-gray-800 mb-2">Mi contrato</h3>
              <p className="text-gray-700 text-sm">
                Plan {perfil.contrato.tipoMembresia} · vigente hasta{' '}
                <strong>{perfil.contrato.fechaVencimiento}</strong>
              </p>
            </div>
          )}

          {perfil?.remision && (
            <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
              <h3 className="font-semibold text-gray-800 mb-2">Autorización EPS</h3>
              <p className="text-gray-700 text-sm">
                {perfil.remision.sesionesAsistidas} de {perfil.remision.sesionesAutorizadas} sesiones usadas
              </p>
            </div>
          )}

          {/* GE-0005: cupos del entrenador asignado, reservables desde el portal. */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="font-semibold text-gray-800 mb-3">Mi entrenador y horarios</h3>
            {horarios.length === 0 ? (
              <p className="text-gray-500 italic">
                No hay horarios disponibles. Si no tienes entrenador asignado, pide el servicio plus.
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {horarios.map((h) => (
                  <div key={h.idHorario} className="border border-gray-200 rounded-md p-3">
                    <p className="font-medium text-gray-800">{h.entrenador}</p>
                    <p className="text-sm text-gray-600">
                      {h.fechaDisponible} · {h.horaInicio} - {h.horaFin}
                    </p>
                    <button
                      type="button"
                      onClick={() => reservar(h.idHorario)}
                      disabled={guardando}
                      className="mt-2 px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
                    >
                      Reservar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* PC-0011: solicitud del servicio de entrenador plus. */}
          {perfil?.tipoDeCliente === 'PARTICULAR_MENSUAL' && (
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="font-semibold text-gray-800 mb-3">Entrenador Plus</h3>
              <p className="text-sm text-gray-600 mb-3">
                El servicio plus se puede solicitar después del primer mes de contrato. El
                administrador revisa y aprueba la solicitud.
              </p>

              {solicitudes.length > 0 && (
                <ul className="mb-4 space-y-2">
                  {solicitudes.map((s) => (
                    <li
                      key={s.id}
                      className="flex flex-wrap items-center justify-between gap-2 text-sm border-b pb-2"
                    >
                      <span className="text-gray-700">Solicitud del {s.fechaSolicitud}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          s.estado === 'APROBADA'
                            ? 'bg-green-100 text-green-800'
                            : s.estado === 'RECHAZADA'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {ETIQUETA_SOLICITUD[s.estado]}
                      </span>
                      {s.estado === 'APROBADA' && s.entrenadorAsignado && (
                        <span className="text-xs text-gray-500">
                          Entrenador: {s.entrenadorAsignado.nombreCompleto}
                        </span>
                      )}
                      {s.observacion && (
                        <span className="text-xs text-gray-500">{s.observacion}</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}

              {haySolicitudPendiente ? (
                <p className="text-sm text-amber-700">
                  Tu solicitud está pendiente de respuesta del administrador.
                </p>
              ) : (
                <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
                  <label className="flex-1 text-sm">
                    Observación (opcional)
                    <input
                      type="text"
                      value={observacionPlus}
                      onChange={(e) => setObservacionPlus(e.target.value)}
                      placeholder="Ej: prefiero entrenamiento en la mañana"
                      className="mt-1 w-full px-3 py-2 border rounded-md"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={pedirPlus}
                    disabled={guardando}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
                  >
                    Solicitar entrenador plus
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
              <p className="text-sm text-gray-500">Peso perdido</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">
                {(progreso?.pesoPerdido ?? 0) > 0 ? `${progreso?.pesoPerdido} kg` : '0 kg'}
              </p>
            </div>
            <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
              <p className="text-sm text-gray-500">IMC actual</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">
                {progreso?.imcActual?.toFixed(2) ?? '—'}
              </p>
            </div>
            <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
              <p className="text-sm text-gray-500">Grasa corporal</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">
                {progreso?.porcentajeGrasaActual != null ? `${progreso.porcentajeGrasaActual}%` : '—'}
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <FiActivity /> Mi rutina
            </h3>
            {rutinas.length === 0 ? (
              <p className="text-gray-500 italic">Tu entrenador todavía no te ha asignado una rutina.</p>
            ) : (
              <ul className="space-y-3">
                {rutinas.map((r) => (
                  <li key={r.idRutina} className="border-l-4 border-blue-500 pl-3">
                    <p className="font-medium text-gray-800">{r.nombre}</p>
                    <p className="text-sm text-gray-600">{r.descripcion}</p>
                    <p className="text-xs text-gray-500 mt-1">Vence {r.fechaVencimiento}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="font-semibold text-gray-800 mb-3">Evaluaciones físicas</h3>
              {evaluaciones.length === 0 ? (
                <p className="text-gray-500 italic">Sin evaluaciones registradas.</p>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {['Fecha', 'Peso', 'IMC', 'Grasa'].map((h) => (
                        <th key={h} className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {evaluaciones.map((e) => (
                      <tr key={e.id}>
                        <td className="px-2 py-2 text-sm">{e.fechaEvaluacion}</td>
                        <td className="px-2 py-2 text-sm">{e.peso} kg</td>
                        <td className="px-2 py-2 text-sm">{e.imc.toFixed(1)}</td>
                        <td className="px-2 py-2 text-sm">{e.porcentajeGrasa}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="font-semibold text-gray-800 mb-3">Mis ingresos</h3>
              {asistencias.length === 0 ? (
                <p className="text-gray-500 italic">Todavía no has registrado ingresos.</p>
              ) : (
                <ul className="space-y-2">
                  {asistencias.map((a) => (
                    <li key={a.id} className="flex justify-between text-sm border-b pb-1">
                      <span className="text-gray-700">{a.fechaIngreso}</span>
                      <span className="text-gray-500">{a.horaIngreso?.slice(0, 8)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}