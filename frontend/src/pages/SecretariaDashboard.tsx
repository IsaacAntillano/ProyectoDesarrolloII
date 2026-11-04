import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import PageHeader from '../components/ui/PageHeader';
import ErrorState from '../components/ui/ErrorState';
import LoadingState from '../components/ui/LoadingState';
import {
  listarMensualesActivos,
  listarDiariosActivos,
  listarEpsActivos,
} from '../services/clienteService';
import { isServerUnreachable, SERVER_UNREACHABLE_MESSAGE } from '../utils/apiError';
import { FiUserPlus, FiDollarSign, FiLogIn, FiUsers } from 'react-icons/fi';

interface Totales {
  mensuales: number;
  diarios: number;
  eps: number;
}

/**
 * Inicio de secretaría: resumen del día y accesos rápidos.
 *
 * La gestión de clientes vive en `GestionClientes`; esta pantalla solo
 * muestra el panorama y lleva a donde corresponde.
 */
export default function SecretariaDashboard() {
  const [totales, setTotales] = useState<Totales | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [mensuales, diarios, eps] = await Promise.all([
        listarMensualesActivos(),
        listarDiariosActivos(),
        listarEpsActivos(),
      ]);
      setTotales({ mensuales: mensuales.length, diarios: diarios.length, eps: eps.length });
    } catch (err) {
      setError(isServerUnreachable(err) ? SERVER_UNREACHABLE_MESSAGE : 'No se pudieron cargar los totales.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargar();
  }, [cargar]);

  const total = totales ? totales.mensuales + totales.diarios + totales.eps : 0;

  return (
    <Layout title="Inicio" description="Resumen del gimnasio y accesos rápidos">
      <PageHeader
        title="Inicio de secretaría"
        description="Consulta los clientes, registra pagos y marca ingresos. La gestión completa está en Clientes."
        actions={
          <>
            <Link
              to="/gestion-clientes"
              className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              <FiUsers aria-hidden="true" /> Gestionar clientes
            </Link>
            <Link
              to="/registrar-pago"
              className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <FiDollarSign aria-hidden="true" /> Registrar pago
            </Link>
          </>
        }
      />

      {loading ? (
        <LoadingState message="Cargando resumen..." />
      ) : error ? (
        <ErrorState message={error} onRetry={cargar} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3" role="list" aria-label="Totales de clientes activos">
            {(
              [
                { label: 'Particulares mensuales', valor: totales!.mensuales },
                { label: 'Particulares diarios', valor: totales!.diarios },
                { label: 'Beneficiarios EPS', valor: totales!.eps },
              ] as const
            ).map((t) => (
              <div
                key={t.label}
                role="listitem"
                className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm"
              >
                <p className="text-sm text-gray-500">{t.label}</p>
                <p className="mt-1 text-3xl font-bold text-gray-900">{t.valor}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-600">
              <strong className="text-gray-900">{total} clientes activos</strong> en total.
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Para registrar el ingreso de un cliente al gimnasio necesitas su número de documento.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                to="/gestion-clientes"
                className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <FiLogIn aria-hidden="true" /> Registrar Ingreso
              </Link>
              <Link
                to="/registrar-cliente-mensual"
                className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <FiUserPlus aria-hidden="true" /> Nuevo cliente mensual
              </Link>
            </div>
          </div>
        </>
      )}
    </Layout>
  );
}
