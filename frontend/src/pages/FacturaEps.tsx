import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import PageHeader from '../components/ui/PageHeader';
import Modal from '../components/ui/Modal';
import LoadingState from '../components/ui/LoadingState';
import ErrorState from '../components/ui/ErrorState';
import EmptyState from '../components/ui/EmptyState';
import Button from '../components/ui/Button';
import StatusBadge from '../components/ui/StatusBadge';
import { Field, Input, Select } from '../components/ui/Field';
import {
  generarFacturaEps,
  listarFacturasEps,
  detalleFacturaEps,
  radicarFacturaEps,
  pagarFacturaEps,
  type FacturaEps,
  type FacturaEpsDetalle,
  type PagoFacturaEps,
} from '../services/adminService';
import { isServerUnreachable, getApiErrorMessage, SERVER_UNREACHABLE_MESSAGE } from '../utils/apiError';
import { formatearFecha, formatearMoneda, hoyISO } from '../utils/format';

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

const METODOS: PagoFacturaEps['metodoPago'][] = [
  'TRANSFERENCIA',
  'EFECTIVO',
  'TARJETA_DEBITO',
  'TARJETA_CREDITO',
];

const ETIQUETA_METODO: Record<PagoFacturaEps['metodoPago'], string> = {
  TRANSFERENCIA: 'Transferencia',
  EFECTIVO: 'Efectivo',
  TARJETA_DEBITO: 'Tarjeta débito',
  TARJETA_CREDITO: 'Tarjeta crédito',
};

/** Factura mensual EPS para cobrar servicios a la aseguradora (PA-0009/PA-0010/PA-0013). */
export default function FacturaEps() {
  const [periodo, setPeriodo] = useState(() => new Date().toISOString().slice(0, 7));
  const [facturas, setFacturas] = useState<FacturaEps[]>([]);
  const [loading, setLoading] = useState(true);
  const [generando, setGenerando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [detalle, setDetalle] = useState<FacturaEpsDetalle | null>(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [pagando, setPagando] = useState<FacturaEps | null>(null);
  const [pagoForm, setPagoForm] = useState<{
    fechaPago: string;
    metodoPago: PagoFacturaEps['metodoPago'];
    valor: number;
  }>({ fechaPago: hoyISO(), metodoPago: 'TRANSFERENCIA', valor: 0 });
  const [guardando, setGuardando] = useState(false);

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

  const verDetalle = async (factura: FacturaEps) => {
    setCargandoDetalle(true);
    setDetalle({ factura, pagos: [] });
    try {
      setDetalle(await detalleFacturaEps(factura.id));
    } catch (err) {
      setDetalle(null);
      toast.error(getApiErrorMessage(err, 'No se pudo cargar el detalle de la factura'));
    } finally {
      setCargandoDetalle(false);
    }
  };

  const radicar = async (factura: FacturaEps) => {
    setGuardando(true);
    try {
      const actualizada = await radicarFacturaEps(factura.id);
      toast.success(`Factura del ${actualizada.periodoConsolidado} radicada ante la EPS`);
      await cargar();
      if (detalle?.factura.id === factura.id) {
        await verDetalle(actualizada);
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'No se pudo radicar la factura'));
    } finally {
      setGuardando(false);
    }
  };

  const abrirPago = (factura: FacturaEps) => {
    setPagando(factura);
    setPagoForm({ fechaPago: hoyISO(), metodoPago: 'TRANSFERENCIA', valor: factura.valorTotal });
  };

  const confirmarPago = async () => {
    if (!pagando) return;
    if (Math.abs(pagoForm.valor - pagando.valorTotal) > 0.01) {
      toast.error(`El valor debe ser igual al total de la factura: ${formatearMoneda(pagando.valorTotal)}`);
      return;
    }
    setGuardando(true);
    try {
      await pagarFacturaEps(pagando.id, pagoForm);
      toast.success('Pago de la factura EPS registrado en el flujo de caja');
      setPagando(null);
      await cargar();
      if (detalle?.factura.id === pagando.id) {
        await verDetalle(pagando);
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'No se pudo registrar el pago'));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Layout title="Factura EPS" description="Genera, radica y cobra la facturación mensual consolidada para la EPS">
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
                    {['Período', 'Generación', 'Entidad', 'Total', 'Estado', 'Acciones'].map((h) => (
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
                      <td className="px-4 py-2">
                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" variant="secondary" onClick={() => void verDetalle(f)}>
                            Detalle
                          </Button>
                          {f.estado === 'PENDIENTE' && (
                            <Button size="sm" variant="primary" loading={guardando} onClick={() => void radicar(f)}>
                              Radicar
                            </Button>
                          )}
                          {f.estado !== 'PAGADA' && (
                            <Button size="sm" variant="success" onClick={() => abrirPago(f)}>
                              Registrar pago
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {/* Detalle de la factura (PA-0010) */}
      <Modal
        open={!!detalle}
        onClose={() => setDetalle(null)}
        title={detalle ? `Factura EPS ${detalle.factura.periodoConsolidado}` : 'Detalle de factura EPS'}
        footer={
          <Button variant="secondary" onClick={() => setDetalle(null)}>
            Cerrar
          </Button>
        }
      >
        {detalle && (
          <div className="space-y-4">
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-gray-500">Período</dt>
                <dd className="font-medium">{detalle.factura.periodoConsolidado}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Entidad</dt>
                <dd className="font-medium">{detalle.factura.entidadEps}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Generación</dt>
                <dd className="font-medium">{formatearFecha(detalle.factura.fechaGeneracion)}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Radicación</dt>
                <dd className="font-medium">{formatearFecha(detalle.factura.fechaRadicacion)}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Pago</dt>
                <dd className="font-medium">{formatearFecha(detalle.factura.fechaPago)}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Estado</dt>
                <dd className="font-medium">
                  <StatusBadge tone={TONE_ESTADO[detalle.factura.estado]}>
                    {ETIQUETA_ESTADO[detalle.factura.estado]}
                  </StatusBadge>
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Total</dt>
                <dd className="text-lg font-semibold">{formatearMoneda(detalle.factura.valorTotal)}</dd>
              </div>
            </dl>

            <div>
              <h4 className="mb-2 font-medium text-gray-800">Pagos registrados</h4>
              {cargandoDetalle ? (
                <p className="text-sm text-gray-500">Cargando pagos...</p>
              ) : detalle.pagos.length === 0 ? (
                <p className="text-sm text-gray-500">La EPS todavía no ha pagado esta factura.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <caption className="sr-only">Pagos de la factura EPS</caption>
                    <thead className="bg-gray-50">
                      <tr>
                        {['Fecha', 'Método', 'Valor'].map((h) => (
                          <th key={h} scope="col" className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {detalle.pagos.map((p) => (
                        <tr key={p.id}>
                          <td className="px-3 py-2 text-sm">{formatearFecha(p.fechaPago)}</td>
                          <td className="px-3 py-2 text-sm">{ETIQUETA_METODO[p.metodoPago] ?? p.metodoPago}</td>
                          <td className="px-3 py-2 text-sm font-medium">{formatearMoneda(p.valor)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Registro del pago de la EPS (PA-0013) */}
      <Modal
        open={!!pagando}
        onClose={() => setPagando(null)}
        title="Registrar pago de la EPS"
        footer={
          <>
            <Button variant="secondary" onClick={() => setPagando(null)} disabled={guardando}>
              Cancelar
            </Button>
            <Button variant="success" onClick={() => void confirmarPago()} loading={guardando}>
              Registrar pago
            </Button>
          </>
        }
      >
        {pagando && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Factura del período <strong>{pagando.periodoConsolidado}</strong> por{' '}
              <strong>{formatearMoneda(pagando.valorTotal)}</strong>. Al registrarla, la factura
              queda pagada y el ingreso entra al flujo de caja del día.
            </p>
            <Field label="Fecha de pago" htmlFor="pago-fecha" required>
              <Input
                id="pago-fecha"
                type="date"
                value={pagoForm.fechaPago}
                onChange={(e) => setPagoForm({ ...pagoForm, fechaPago: e.target.value })}
                required
              />
            </Field>
            <Field label="Método de pago" htmlFor="pago-metodo" required>
              <Select
                id="pago-metodo"
                value={pagoForm.metodoPago}
                onChange={(e) =>
                  setPagoForm({ ...pagoForm, metodoPago: e.target.value as PagoFacturaEps['metodoPago'] })
                }
                required
              >
                {METODOS.map((m) => (
                  <option key={m} value={m}>
                    {ETIQUETA_METODO[m]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field
              label="Valor recibido"
              htmlFor="pago-valor"
              required
              help={`Debe coincidir con el total de la factura (${formatearMoneda(pagando.valorTotal)})`}
            >
              <Input
                id="pago-valor"
                type="number"
                step="0.01"
                inputMode="decimal"
                value={pagoForm.valor}
                onChange={(e) => setPagoForm({ ...pagoForm, valor: parseFloat(e.target.value) || 0 })}
                required
              />
            </Field>
          </div>
        )}
      </Modal>
    </Layout>
  );
}
