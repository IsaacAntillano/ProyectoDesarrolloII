import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiRefreshCw, FiDollarSign, FiAlertTriangle } from 'react-icons/fi';
import Layout from '../components/Layout';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import StatusBadge from '../components/ui/StatusBadge';
import EmptyState from '../components/ui/EmptyState';
import LoadingState from '../components/ui/LoadingState';
import ErrorState from '../components/ui/ErrorState';
import { listarContratosVencidos, type ContratoVencido } from '../services/clienteService';
import { getApiErrorMessage, isServerUnreachable, SERVER_UNREACHABLE_MESSAGE } from '../utils/apiError';
import { etiqueta, ETIQUETA_TIPO_MEMBRESIA } from '../constants/labels';
import { formatearFecha, formatearNumero } from '../utils/format';

/**
 * Contratos particulares cuya fecha de vencimiento ya pasó.
 *
 * El criterio es la fecha del contrato, no el estado de la membresía: un
 * contrato vencido puede seguir marcado como ACTIVO si nadie lo renovó.
 */
export default function ContratosVencidos() {
  const [contratos, setContratos] = useState<ContratoVencido[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setContratos(await listarContratosVencidos());
    } catch (err) {
      setError(
        isServerUnreachable(err)
          ? SERVER_UNREACHABLE_MESSAGE
          : getApiErrorMessage(err, 'No se pudieron cargar los contratos vencidos')
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargar();
  }, [cargar]);

  const maxDias = contratos.reduce((m, c) => Math.max(m, c.diasVencido), 0);

  return (
    <Layout title="Contratos Vencidos" description="Clientes mensuales cuya fecha de vencimiento ya pasó">
      <PageHeader
        title="Contratos con pago pendiente"
        description={`Al ${contratos.length === 0 ? 'hoy no hay' : `hoy hay ${contratos.length}`} contrato(s) vencido(s). Registra el pago para renovar.`}
        actions={
          <Button variant="secondary" onClick={() => void cargar()} aria-label="Actualizar lista">
            <FiRefreshCw aria-hidden="true" /> Actualizar
          </Button>
        }
      />

      {!loading && !error && contratos.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2 text-sm">
          <StatusBadge tone="red" icon={FiAlertTriangle}>
            {contratos.length} vencido(s)
          </StatusBadge>
          <StatusBadge tone="amber">
            Antigüedad máxima: {maxDias} {maxDias === 1 ? 'día' : 'días'}
          </StatusBadge>
        </div>
      )}

      {loading ? (
        <LoadingState message="Cargando contratos vencidos..." />
      ) : error ? (
        <ErrorState message={error} onRetry={() => void cargar()} />
      ) : contratos.length === 0 ? (
        <EmptyState
          title="Al día, sin contratos vencidos"
          message="No hay clientes mensuales con la fecha de vencimiento pasada. Cuando un contrato se venza, aparecerá aquí para renovarlo con el pago."
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <caption className="sr-only">Contratos vencidos ordenados por urgencia</caption>
            <thead className="bg-gray-50">
              <tr>
                {['Documento', 'Cliente', 'Membresía', 'Inicio', 'Vencimiento', 'Días vencido', 'Acción'].map(
                  (h) => (
                    <th key={h} scope="col" className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {[...contratos]
                .sort((a, b) => b.diasVencido - a.diasVencido)
                .map((c) => (
                  <tr key={c.idContrato} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-sm">{formatearNumero(c.numeroDocumento)}</td>
                    <td className="px-3 py-2 text-sm font-medium text-gray-900">{c.nombreCompleto}</td>
                    <td className="px-3 py-2 text-sm">{etiqueta(ETIQUETA_TIPO_MEMBRESIA, c.tipoMembresia)}</td>
                    <td className="px-3 py-2 text-sm">{formatearFecha(c.fechaInicio)}</td>
                    <td className="px-3 py-2 text-sm">{formatearFecha(c.fechaVencimiento)}</td>
                    <td className="px-3 py-2">
                      <StatusBadge tone={c.diasVencido >= 7 ? 'red' : 'amber'}>
                        {c.diasVencido} {c.diasVencido === 1 ? 'día' : 'días'}
                      </StatusBadge>
                    </td>
                    <td className="px-3 py-2">
                      <Link
                        to={`/registrar-pago?documento=${c.numeroDocumento}`}
                        className="inline-flex items-center gap-1.5 rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 [&:focus-visible]:outline-none [&:focus-visible]:ring-2 [&:focus-visible]:ring-green-500"
                      >
                        <FiDollarSign aria-hidden="true" /> Registrar pago
                      </Link>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  );
}
