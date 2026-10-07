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
  type MiPerfil,
  type MiRutina,
  type MiEvaluacion,
  type MiAsistencia,
  type Progreso,
} from '../services/clientePanelService';
import { isServerUnreachable, SERVER_UNREACHABLE_MESSAGE } from '../utils/apiError';

const ETIQUETA_ESTADO: Record<string, string> = {
  ACTIVO: 'Activo',
  VENCIDO: 'Vencido',
  BLOQUEADO: 'Bloqueado',
  FINALIZADO: 'Finalizado',
  CANCELADO_ANTICIPADAMENTE: 'Cancelado',
};

export default function ClienteDashboard() {
  const [perfil, setPerfil] = useState<MiPerfil | null>(null);
  const [progreso, setProgreso] = useState<Progreso | null>(null);
  const [rutinas, setRutinas] = useState<MiRutina[]>([]);
  const [evaluaciones, setEvaluaciones] = useState<MiEvaluacion[]>([]);
  const [asistencias, setAsistencias] = useState<MiAsistencia[]>([]);
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