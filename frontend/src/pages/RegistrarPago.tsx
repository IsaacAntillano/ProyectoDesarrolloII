import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiRefreshCw, FiDollarSign, FiCheckCircle } from 'react-icons/fi';
import Layout from '../components/Layout';
import PageHeader from '../components/ui/PageHeader';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import StatusBadge from '../components/ui/StatusBadge';
import EmptyState from '../components/ui/EmptyState';
import LoadingState from '../components/ui/LoadingState';
import ErrorState from '../components/ui/ErrorState';
import { Field, Input, Select } from '../components/ui/Field';
import {
  registrarPagoMensualidad,
  registrarPagoDiario,
  registrarCopagoEps,
  registrarPagoPlus,
  pagosDeCliente,
  listarTarifasVigentes,
  type MetodoPago,
  type Pago,
  type TarifaVigente,
} from '../services/pagoService';
import { getApiErrorMessage, isServerUnreachable, SERVER_UNREACHABLE_MESSAGE } from '../utils/apiError';
import {
  etiqueta,
  ETIQUETA_METODO_PAGO,
  ETIQUETA_TIPO_PAGO,
  ETIQUETA_ESTADO_PAGO,
} from '../constants/labels';
import { formatearFecha, formatearMoneda, formatearNumero } from '../utils/format';

type Tipo = 'mensualidad' | 'diario' | 'copago' | 'plus';

const TIPOS: { value: Tipo; label: string; campo: keyof TarifaVigente }[] = [
  { value: 'mensualidad', label: 'Mensualidad (particular mensual)', campo: 'valorMensual' },
  { value: 'diario', label: 'Acceso diario', campo: 'valorDiario' },
  { value: 'copago', label: 'Copago EPS', campo: 'valorMensual' },
  { value: 'plus', label: 'Entrenador Plus', campo: 'valorPlus' },
];

const CAMPOS_TARIFA: Record<Tipo, { tipoCliente: TarifaVigente['tipoDeCliente']; campo: 'valorMensual' | 'valorDiario' | 'valorPlus' }> = {
  mensualidad: { tipoCliente: 'PARTICULAR_MENSUAL', campo: 'valorMensual' },
  diario: { tipoCliente: 'PARTICULAR_DIARIO', campo: 'valorDiario' },
  copago: { tipoCliente: 'BENEFICIARIO_EPS', campo: 'valorMensual' },
  plus: { tipoCliente: 'PARTICULAR_MENSUAL', campo: 'valorPlus' },
};

const METODOS: MetodoPago[] = ['EFECTIVO', 'TARJETA_DEBITO', 'TARJETA_CREDITO', 'TRANSFERENCIA'];

export default function RegistrarPago() {
  const [searchParams] = useSearchParams();
  const documentoParam = searchParams.get('documento') ?? '';
  const [tipo, setTipo] = useState<Tipo>('mensualidad');
  const [documento, setDocumento] = useState(documentoParam);
  const [metodo, setMetodo] = useState<MetodoPago>('EFECTIVO');
  const [valor, setValor] = useState('');
  const [historial, setHistorial] = useState<Pago[]>([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [tarifas, setTarifas] = useState<TarifaVigente[]>([]);
  const [errorHistorial, setErrorHistorial] = useState<string | null>(null);
  const [confirmando, setConfirmando] = useState(false);

  // Al cambiar de tipo o llegar las tarifas, se pre-rellena el valor esperado.
  // Se hace en el evento (no en un efecto) para no forzar actualizaciones.
  const [valorManual, setValorManual] = useState(false);
  const valorEsperado = () => {
    const mapa = CAMPOS_TARIFA[tipo];
    const tarifa = tarifas.find((t) => t.tipoDeCliente === mapa.tipoCliente);
    const valorBase = tarifa?.[mapa.campo] ?? null;
    // El copago EPS es el 3% de la tarifa mensual vigente.
    if (tipo === 'copago' && valorBase != null) {
      return Math.round((valorBase * 0.03) * 100) / 100;
    }
    return valorBase;
  };

  const cargarHistorial = useCallback(async () => {
    const doc = Number(documento);
    if (!doc) {
      setHistorial([]);
      setErrorHistorial(null);
      return;
    }
    setCargandoHistorial(true);
    setErrorHistorial(null);
    try {
      setHistorial(await pagosDeCliente(doc));
    } catch {
      setHistorial([]);
      setErrorHistorial('No se pudo cargar el historial. Volverá a intentarse al registrar el pago.');
    } finally {
      setCargandoHistorial(false);
    }
  }, [documento]);

  useEffect(() => {
    listarTarifasVigentes()
      .then(setTarifas)
      .catch(() => setTarifas([]));
  }, []);

  useEffect(() => {
    if (documentoParam) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDocumento(documentoParam);
    }
  }, [documentoParam]);

  // Pre-relleno del valor esperado cuando llega la tarifa o cambia el tipo.
  useEffect(() => {
    if (valorManual) return;
    const map = CAMPOS_TARIFA[tipo];
    const tarifa = tarifas.find((t) => t.tipoDeCliente === map.tipoCliente);
    const esperado = tarifa?.[map.campo];
    if (esperado != null) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setValor(String(esperado));
    }
  }, [tipo, tarifas, valorManual]);

  useEffect(() => {
    const t = setTimeout(() => void cargarHistorial(), 400);
    return () => clearTimeout(t);
  }, [cargarHistorial]);

  const registrar = async () => {
    const doc = Number(documento);
    const monto = parseFloat(valor);
    if (!doc || doc <= 0) {
      toast.error('Ingresa el número de documento del cliente');
      return;
    }
    if (Number.isNaN(monto) || monto <= 0) {
      toast.error('Ingresa el valor del pago');
      return;
    }
    setGuardando(true);
    try {
      if (tipo === 'mensualidad') await registrarPagoMensualidad(doc, metodo, monto);
      else if (tipo === 'diario') await registrarPagoDiario(doc, metodo, monto);
      else if (tipo === 'copago') await registrarCopagoEps(doc, metodo, monto);
      else await registrarPagoPlus(doc, metodo, monto);

      toast.success(
        tipo === 'copago'
          ? `Copago EPS de ${formatearMoneda(monto)} registrado para el documento ${doc}.`
          : tipo === 'mensualidad'
            ? `Mensualidad de ${formatearMoneda(monto)} registrada para el documento ${doc}. Contrato renovado.`
            : tipo === 'diario'
              ? `Acceso diario de ${formatearMoneda(monto)} registrado para el documento ${doc}.`
              : `Pago de entrenador Plus de ${formatearMoneda(monto)} registrado para el documento ${doc}.`
      );
      setConfirmando(false);
      cargarHistorial();
    } catch (err) {
      toast.error(
        isServerUnreachable(err)
          ? SERVER_UNREACHABLE_MESSAGE
          : getApiErrorMessage(err, 'No se pudo registrar el pago')
      );
    } finally {
      setGuardando(false);
    }
  };

  const tipoSeleccionado = TIPOS.find((t) => t.value === tipo)!;
  const esperado = valorEsperado();

  // Valor base de la tarifa para mostrar en la ayuda del copago (antes del 3%).
  const tarifaBase = tipo === 'copago'
    ? tarifas.find((t) => t.tipoDeCliente === CAMPOS_TARIFA.copago.tipoCliente)?.[CAMPOS_TARIFA.copago.campo] ?? 0
    : 0;

  return (
    <Layout title="Registrar Pago" description="El valor debe coincidir con la tarifa vigente; verás el monto esperado antes de confirmar">
      <PageHeader
        title="Registrar pago"
        description="Verifica el resumen antes de confirmar. El backend rechaza el pago si el valor no coincide con la tarifa."
      />

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setConfirmando(true);
          }}
          className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
        >
          <h3 className="font-semibold text-gray-800">Nuevo pago</h3>

          <Field label="Tipo de pago" htmlFor="tipo-pago" required help="El valor esperado cambia según el tipo">
            <Select
              id="tipo-pago"
              value={tipo}
              onChange={(e) => {
                setTipo(e.target.value as Tipo);
                setValorManual(false);
              }}
              required
            >
              {TIPOS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </Select>
          </Field>

          <Field
            label="Documento del cliente"
            htmlFor="doc-cliente"
            required
            help="Solo números"
          >
            <Input
              id="doc-cliente"
              type="number"
              inputMode="numeric"
              min={1}
              value={documento}
              onChange={(e) => setDocumento(e.target.value)}
              placeholder="Ej: 200000001"
              required
            />
          </Field>

          <Field label="Método de pago" htmlFor="metodo" required>
            <Select
              id="metodo"
              value={metodo}
              onChange={(e) => setMetodo(e.target.value as MetodoPago)}
              required
            >
              {METODOS.map((m) => (
                <option key={m} value={m}>
                  {etiqueta(ETIQUETA_METODO_PAGO, m)}
                </option>
              ))}
            </Select>
          </Field>

          <Field
            label="Valor"
            htmlFor="valor"
            required
            help={
              esperado != null
                ? tipo === 'copago'
                  ? `Copago EPS = 3% de la tarifa mensual vigente (${formatearMoneda(tarifaBase)}): debe pagar exactamente ${formatearMoneda(esperado)}.`
                  : `Tarifa vigente: ${formatearMoneda(esperado)}. Debe coincidir exactamente. Si editas el valor, dejará de pre-rellenarse al cambiar de tipo.`
                : 'Debe coincidir con la tarifa vigente configurada por el administrador.'
            }
          >
            <Input
              id="valor"
              type="number"
              inputMode="decimal"
              min={1}
              step="0.01"
              value={valor}
              onChange={(e) => {
                setValor(e.target.value);
                setValorManual(true);
              }}
              placeholder="Ej: 85000"
              required
            />
          </Field>

          <Button type="submit" className="w-full" size="lg" disabled={esperado != null && parseFloat(valor) !== esperado}>
            <FiDollarSign aria-hidden="true" /> Revisar y registrar
          </Button>
        </form>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="font-semibold text-gray-800">Historial del cliente</h3>
            <Button variant="ghost" size="sm" onClick={() => void cargarHistorial()} aria-label="Actualizar historial">
              <FiRefreshCw aria-hidden="true" /> Actualizar
            </Button>
          </div>

          {!documento ? (
            <p className="text-sm text-gray-500 italic">Escribe un documento para ver su historial.</p>
          ) : cargandoHistorial ? (
            <LoadingState message="Cargando historial..." filas={2} />
          ) : errorHistorial ? (
            <ErrorState message={errorHistorial} onRetry={() => void cargarHistorial()} />
          ) : historial.length === 0 ? (
            <EmptyState
              title="Sin pagos registrados"
              message={`El cliente ${formatearNumero(Number(documento))} todavía no tiene pagos en el sistema.`}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <caption className="sr-only">Pagos del cliente</caption>
                <thead className="bg-gray-50">
                  <tr>
                    {['Fecha', 'Tipo', 'Valor', 'Método', 'Estado'].map((h) => (
                      <th key={h} scope="col" className="px-2 py-2 text-left text-xs font-medium uppercase text-gray-500">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {historial.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-2 py-2 text-sm">{formatearFecha(p.fechaPago)}</td>
                      <td className="px-2 py-2 text-sm">{etiqueta(ETIQUETA_TIPO_PAGO, p.tipoPago)}</td>
                      <td className="px-2 py-2 text-sm font-medium">{formatearMoneda(p.valor)}</td>
                      <td className="px-2 py-2 text-sm">{etiqueta(ETIQUETA_METODO_PAGO, p.metodoPago)}</td>
                      <td className="px-2 py-2">
                        <StatusBadge tone={p.estadoPago === 'EXITOSO' ? 'green' : p.estadoPago === 'FALLIDO' ? 'red' : 'amber'}>
                          {etiqueta(ETIQUETA_ESTADO_PAGO, p.estadoPago)}
                        </StatusBadge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <Modal
        open={confirmando}
        onClose={() => setConfirmando(false)}
        title="Confirmar pago"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmando(false)} disabled={guardando}>
              Volver
            </Button>
            <Button variant="success" onClick={() => void registrar()} loading={guardando} disabled={esperado != null && parseFloat(valor) !== esperado}>
              {guardando ? 'Registrando...' : 'Confirmar pago'}
            </Button>
          </>
        }
      >
        <dl className="grid gap-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-gray-500">Cliente</dt>
            <dd className="font-medium">{formatearNumero(Number(documento)) || '—'}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-gray-500">Tipo de pago</dt>
            <dd className="font-medium">{tipoSeleccionado.label}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-gray-500">Método</dt>
            <dd className="font-medium">{etiqueta(ETIQUETA_METODO_PAGO, metodo)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-gray-500">Valor</dt>
            <dd className="font-semibold text-gray-900">{formatearMoneda(parseFloat(valor) || 0)}</dd>
          </div>
          {tipo === 'copago' && esperado != null && (
            <div className="flex justify-between gap-4">
              <dt className="text-gray-500">Fórmula</dt>
              <dd className="font-medium text-sm text-gray-600">
                3% × tarifa mensual EPS ({formatearMoneda(tarifaBase)}) = {formatearMoneda(esperado)}
              </dd>
            </div>
          )}
        </dl>
        {esperado != null && parseFloat(valor) !== esperado && (
          <p role="alert" className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            El valor ({formatearMoneda(parseFloat(valor) || 0)}) no coincide con la tarifa vigente (
            {formatearMoneda(esperado)}). El backend lo rechazará. Corrige el valor antes de confirmar.
          </p>
        )}
        <p className="flex items-start gap-1.5 text-xs text-gray-500">
          <FiCheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-600" aria-hidden="true" />
          Al confirmar, el pago queda registrado y el contrato se renueva si aplica.
        </p>
      </Modal>
    </Layout>
  );
}
