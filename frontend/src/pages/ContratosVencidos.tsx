import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiRefreshCw, FiDollarSign } from 'react-icons/fi';
import Layout from '../components/Layout';
import { listarContratosVencidos, type ContratoVencido } from '../services/clienteService';
import { getApiErrorMessage, isServerUnreachable, SERVER_UNREACHABLE_MESSAGE } from '../utils/apiError';

/**
 * Contratos particulares cuya fecha de vencimiento ya paso.
 *
 * El criterio es la fecha del contrato, no el estado de la membresia: un
 * contrato vencido puede seguir marcado como ACTIVO si nadie lo renovo.
 */
export default function ContratosVencidos() {
  const [contratos, setContratos] = useState<ContratoVencido[]>([]);
  const [loading, setLoading] = useState(true);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      setContratos(await listarContratosVencidos());
    } catch (err) {
      toast.error(
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

  return (
    <Layout title="Contratos Vencidos">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="font-semibold text-gray-800">Contratos con pago pendiente</h3>
            <p className="text-sm text-gray-500">
              Clientes mensuales cuya fecha de vencimiento ya paso. Registra el pago para renovar.
            </p>
          </div>
          <button
            type="button"
            onClick={cargar}
            className="flex items-center gap-1 px-3 py-1.5 text-sm border rounded-md hover:bg-gray-50"
          >
            <FiRefreshCw /> Actualizar
          </button>
        </div>

        {loading ? (
          <p className="text-gray-500">Cargando...</p>
        ) : contratos.length === 0 ? (
          <p className="text-gray-500 italic">No hay contratos vencidos.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Documento', 'Cliente', 'Membresía', 'Inicio', 'Vencimiento', 'Días vencido', 'Acciones'].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase"
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {contratos.map((c) => (
                  <tr key={c.idContrato} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-sm">{c.numeroDocumento}</td>
                    <td className="px-3 py-2 text-sm">{c.nombreCompleto}</td>
                    <td className="px-3 py-2 text-sm">{c.tipoMembresia}</td>
                    <td className="px-3 py-2 text-sm">{c.fechaInicio}</td>
                    <td className="px-3 py-2 text-sm">{c.fechaVencimiento}</td>
                    <td className="px-3 py-2 text-sm">
                      <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-800 text-xs font-medium">
                        {c.diasVencido} {c.diasVencido === 1 ? 'día' : 'días'}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-sm">
                      <Link
                        to={`/registrar-pago?documento=${c.numeroDocumento}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-md text-xs hover:bg-green-700"
                      >
                        <FiDollarSign /> Registrar pago
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}
