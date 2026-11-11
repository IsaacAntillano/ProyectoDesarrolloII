import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft, FiPrinter } from 'react-icons/fi';
import Layout from '../components/Layout';
import LoadingState from '../components/ui/LoadingState';
import ErrorState from '../components/ui/ErrorState';
import Button from '../components/ui/Button';
import { reporteEps, type ReporteProgresoEps } from '../services/entrenadorService';
import { isServerUnreachable, getApiErrorMessage, SERVER_UNREACHABLE_MESSAGE } from '../utils/apiError';
import { formatearFecha, formatearNumero } from '../utils/format';

/**
 * Reporte de progreso físico de un beneficiario EPS (EF-0008).
 *
 * Se genera desde el panel del entrenador asignado y se imprime con el diálogo
 * del navegador (`window.print()`); el usuario puede guardarlo como PDF desde
 * ahí. No depende de librerías externas.
 */
export default function ReporteEps() {
  const { documento } = useParams<{ documento: string }>();
  const navigate = useNavigate();
  const [reporte, setReporte] = useState<ReporteProgresoEps | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    if (!documento) return;
    setLoading(true);
    setError(null);
    try {
      setReporte(await reporteEps(Number(documento)));
    } catch (err) {
      setError(
        isServerUnreachable(err)
          ? SERVER_UNREACHABLE_MESSAGE
          : getApiErrorMessage(err, 'No se pudo generar el reporte EPS')
      );
    } finally {
      setLoading(false);
    }
  }, [documento]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void cargar();
  }, [cargar]);

  return (
    <Layout title="Reporte EPS" description="Reporte de progreso para imprimir o guardar como PDF">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 print:hidden">
        <Button variant="secondary" onClick={() => navigate(-1)}>
          <FiArrowLeft aria-hidden="true" /> Volver
        </Button>
        <Button onClick={() => window.print()} disabled={!reporte}>
          <FiPrinter aria-hidden="true" /> Imprimir / Guardar PDF
        </Button>
      </div>

      {loading ? (
        <LoadingState message="Generando reporte..." filas={5} />
      ) : error ? (
        <ErrorState message={error} onRetry={() => void cargar()} />
      ) : reporte ? (
        <article className="mx-auto max-w-3xl rounded-lg border border-gray-300 bg-white p-8 text-gray-900 print:max-w-none print:rounded-none print:border-0 print:p-0">
          <header className="border-b border-gray-300 pb-4">
            <h1 className="text-2xl font-bold">Reporte de progreso físico</h1>
            <p className="mt-1 text-sm text-gray-600">
              Entidad EPS: <strong>{reporte.entidadEps ?? '—'}</strong> · Generado el{' '}
              {formatearFecha(reporte.fechaGeneracion)}
            </p>
          </header>

          <section className="mt-6">
            <h2 className="text-lg font-semibold">Datos del beneficiario</h2>
            <dl className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
              <div>
                <dt className="text-gray-500">Nombre</dt>
                <dd className="font-medium">{reporte.nombreBeneficiario}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Documento</dt>
                <dd className="font-medium">{formatearNumero(reporte.numeroDocumento)}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Diagnóstico</dt>
                <dd className="font-medium">{reporte.diagnostico ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Zona a tratar</dt>
                <dd className="font-medium">{reporte.zonaCuerpoTratar ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Médico remitente</dt>
                <dd className="font-medium">{reporte.medicoRemitente ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Entrenador</dt>
                <dd className="font-medium">{reporte.nombreEntrenador ?? '—'}</dd>
              </div>
            </dl>
          </section>

          <section className="mt-6">
            <h2 className="text-lg font-semibold">Objetivo clínico</h2>
            <p className="mt-1 text-sm">{reporte.objetivoClinico ?? 'Sin meta registrada.'}</p>
            {reporte.observacionMedica && (
              <p className="mt-1 text-sm text-gray-600">{reporte.observacionMedica}</p>
            )}
            {reporte.fechaObjetivo && (
              <p className="mt-1 text-sm text-gray-600">
                Fecha objetivo: {formatearFecha(reporte.fechaObjetivo)}
              </p>
            )}
          </section>

          <section className="mt-6">
            <h2 className="text-lg font-semibold">Resumen del progreso</h2>
            <div className="mt-2 grid grid-cols-3 gap-4 text-sm">
              <div className="rounded border border-gray-300 p-3">
                <p className="text-gray-500">Peso perdido</p>
                <p className="text-xl font-bold">
                  {(reporte.progreso.pesoPerdido ?? 0) > 0
                    ? `${reporte.progreso.pesoPerdido.toFixed(1)} kg`
                    : '0 kg'}
                </p>
              </div>
              <div className="rounded border border-gray-300 p-3">
                <p className="text-gray-500">IMC actual</p>
                <p className="text-xl font-bold">{reporte.progreso.imcActual?.toFixed(2) ?? '—'}</p>
              </div>
              <div className="rounded border border-gray-300 p-3">
                <p className="text-gray-500">Grasa corporal</p>
                <p className="text-xl font-bold">
                  {reporte.progreso.porcentajeGrasaActual != null
                    ? `${reporte.progreso.porcentajeGrasaActual}%`
                    : '—'}
                </p>
              </div>
            </div>
            {reporte.progreso.mensaje && (
              <p className="mt-2 text-xs text-gray-500">{reporte.progreso.mensaje}</p>
            )}
          </section>

          <section className="mt-6">
            <h2 className="text-lg font-semibold">Evaluaciones físicas</h2>
            <p className="text-sm text-gray-600">
              Inicial: {formatearFecha(reporte.fechaEvaluacionInicial)} · Última:{' '}
              {formatearFecha(reporte.fechaEvaluacionFinal)}
            </p>
            {reporte.evaluaciones.length === 0 ? (
              <p className="mt-2 text-sm">Sin evaluaciones registradas.</p>
            ) : (
              <table className="mt-3 min-w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-gray-300 text-left">
                    <th scope="col" className="py-1 pr-2">Fecha</th>
                    <th scope="col" className="py-1 pr-2">Peso</th>
                    <th scope="col" className="py-1 pr-2">IMC</th>
                    <th scope="col" className="py-1 pr-2">Grasa</th>
                    <th scope="col" className="py-1 pr-2">Cintura</th>
                    <th scope="col" className="py-1 pr-2">Cadera</th>
                    <th scope="col" className="py-1 pr-2">Brazo</th>
                    <th scope="col" className="py-1 pr-2">Pierna</th>
                  </tr>
                </thead>
                <tbody>
                  {reporte.evaluaciones.map((ev) => (
                    <tr key={ev.id} className="border-b border-gray-200">
                      <td className="py-1 pr-2">{formatearFecha(ev.fechaEvaluacion)}</td>
                      <td className="py-1 pr-2">{ev.peso} kg</td>
                      <td className="py-1 pr-2">{ev.imc?.toFixed(2)}</td>
                      <td className="py-1 pr-2">{ev.porcentajeGrasa}%</td>
                      <td className="py-1 pr-2">{ev.perimetroCintura} cm</td>
                      <td className="py-1 pr-2">{ev.perimetroCadera ?? '—'}</td>
                      <td className="py-1 pr-2">{ev.perimetroBrazo ?? '—'}</td>
                      <td className="py-1 pr-2">{ev.perimetroPierna ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          <footer className="mt-10 border-t border-gray-300 pt-4 text-xs text-gray-500">
            Reporte generado por Victus-Caf. Documento informativo para la EPS; no reemplaza la
            historia clínica.
          </footer>
        </article>
      ) : null}
    </Layout>
  );
}
