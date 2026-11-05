import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import PageHeader from '../components/ui/PageHeader';
import LoadingState from '../components/ui/LoadingState';
import ErrorState from '../components/ui/ErrorState';
import EmptyState from '../components/ui/EmptyState';
import Button from '../components/ui/Button';
import StatusBadge from '../components/ui/StatusBadge';
import { Field, Input } from '../components/ui/Field';
import {
  generarFacturaEps,
  listarFacturasEps,
  type FacturaEps,
} from '../services/adminService';
import { isServerUnreachable, getApiErrorMessage, SERVER_UNREACHABLE_MESSAGE } from '../utils/apiError';
import { formatearFecha, formatearMoneda } from '../utils/format';

const ETIQUETA_ESTADO: Record<FacturaEps['estado'], string> = {
  PENDIENTE: 'Pendiente',
  RADICADA: 'Radicada',
  PAGADA: 'Pagada',
};

const TONE_ESTADO: Record<FacturaEps['estado'], 'amber' | 'blue' | 'green'> = {
  PENDIENTE: 'amber',
  RADICADA: 'blue',
  PAGADA: 'green',
};

/** Factura mensual EPS para cobrar servicios a la aseguradora (PA-0009). */
export default function FacturaEps() {
  const [periodo, setPeriodo] = useState(() => new Date().toISOString().slice(0, 7));
  const [facturas, setFacturas] = useState<FacturaEps[]>([]);
  const [loading, setLoading] = useState(true);
  const [generando, setGenerando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setFacturas(await listarFacturasEps());
    } catch (err) {
      setError(
        isServerUnreachable(err)
          ? SERVER_UNREACHABLE_MESSAGE
          : getApiErrorMessage(err, 'No se pudieron cargar las facturas')
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void cargar();
  }, [cargar]);

  const generar = async () => {
    if (!/^\d{4}-\d{2}$/.test(periodo)) {
      toast.error('El período debe tener el formato AAAA-MM, por ejemplo 2026-10');
      return;
    }
    setGenerando(true);
    try {
      const factura = await generarFacturaEps(periodo);
      toast.success(`Factura del ${factura.periodoConsolidado} generada por ${formatearMoneda(factura.valorTotal)}`);
      await cargar();
    } catch (err) {
      toast.error(
        isServerUnreachable(err)
          ? SERVER_UNREACHABLE_MESSAGE
          : getApiErrorMessage(err, 'No se pudo generar la factura')
      );
    } finally {
      setGenerando(false);
    }
  };

  return (
    <Layout title="Factura EPS" description="Genera y consulta la facturación mensual consolidada para la EPS">
      <PageHeader
        title="Factura EPS"
        description="El valor se calcula desde las sesiones EPS asistidas en el período y los copagos cobrados; una factura por período."
      />

      <div className="grid items-start gap-6 lg:grid-cols-3">
        <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="font-semibold text-gray-800">Generar factura</h3>
          <div className="mt-4 space-y-4">
            <Field label="Período" htmlFor="periodo" required help="Mes a consolidar, por ejemplo 2026-10">
              <Input
                id="periodo"
                type="month"
                value={periodo}
                onChange={(e) => setPeriodo(e.target.value)}
                required
              />
            </Field>
            <p className="text-xs text-gray-500 leading-relaxed">
              Fórmula: sesiones EPS asistidas en el período × tarifa EPS vigente prorrateada
              (valor mensual ÷ 20 sesiones) + copagos EPS cobrados en el período.
              Solo existe una factura por período: si ya fue generada, el backend la rechaza.
            </p>
            <Button onClick={() => void generar()} loading={generando} className="w-full">
              Generar factura
            </Button>
          </div>
        </section>

        <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm lg:col-span-2">
          <h3 className="mb-3 font-semibold text-gray-800">Facturas generadas</h3>
          {loading ? (
            <LoadingState message="Cargando facturas..." filas={3} />
          ) : error ? (
            <ErrorState message={error} onRetry={() => void cargar()} />
          ) : facturas.length === 0 ? (
            <EmptyState
              title="Todavía no hay facturas"
              message="Genera la primera factura del mes que ya pasó."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <caption className="sr-only">Facturas EPS generadas</caption>
                <thead className="bg-gray-50">
                  <tr>
                    {['Período', 'Generación', 'Entidad', 'Total', 'Estado'].map((h) => (
                      <th key={h} scope="col" className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {facturas.map((f) => (
                    <tr key={f.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm font-medium">{f.periodoConsolidado}</td>
                      <td className="px-4 py-2 text-sm">{formatearFecha(f.fechaGeneracion)}</td>
                      <td className="px-4 py-2 text-sm">{f.entidadEps}</td>
                      <td className="px-4 py-2 text-sm font-semibold">{formatearMoneda(f.valorTotal)}</td>
                      <td className="px-4 py-2 text-sm">
                        <StatusBadge tone={TONE_ESTADO[f.estado]}>
                          {ETIQUETA_ESTADO[f.estado]}
                        </StatusBadge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
}
