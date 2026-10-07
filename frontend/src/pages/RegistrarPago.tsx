import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FiPlus, FiRefreshCw } from 'react-icons/fi';
import Layout from '../components/Layout';
import DocumentTypeBar from '../components/DocumentTypeBar';
import {
  registrarPagoMensualidad,
  registrarPagoDiario,
  registrarCopagoEps,
  pagosDeCliente,
  type MetodoPago,
  type Pago,
} from '../services/pagoService';
import { getApiErrorMessage, isServerUnreachable, SERVER_UNREACHABLE_MESSAGE } from '../utils/apiError';

type Tipo = 'mensualidad' | 'diario' | 'copago';

const TIPOS: { value: Tipo; label: string }[] = [
  { value: 'mensualidad', label: 'Mensualidad (particular mensual)' },
  { value: 'diario', label: 'Acceso diario' },
  { value: 'copago', label: 'Copago EPS' },
];

const METODOS: MetodoPago[] = ['EFECTIVO', 'TARJETA_DEBITO', 'TARJETA_CREDITO', 'TRANSFERENCIA'];

export default function RegistrarPago() {
  const [tipo, setTipo] = useState<Tipo>('mensualidad');
  const [documento, setDocumento] = useState('');
  const [tipoDoc, setTipoDoc] = useState('CC');
  const [metodo, setMetodo] = useState<MetodoPago>('EFECTIVO');
  const [valor, setValor] = useState('');
  const [historial, setHistorial] = useState<Pago[]>([]);
  const [loading, setLoading] = useState(false);

  const cargarHistorial = useCallback(async () => {
    const doc = parseInt(documento, 10);
    if (!doc) return;
    setLoading(true);
    try {
      setHistorial(await pagosDeCliente(doc));
    } catch {
      // El historial es informativo: si falla no bloquea el cobro.
      setHistorial([]);
    } finally {
      setLoading(false);
    }
  }, [documento]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarHistorial();
  }, [cargarHistorial]);

  const registrar = async (e: React.FormEvent) => {
    e.preventDefault();
    const doc = parseInt(documento, 10);
    if (!doc) {
      toast.error('Ingresa el número de documento del cliente');
      return;
    }
    const monto = parseFloat(valor);
    if (Number.isNaN(monto) || monto <= 0) {
      toast.error('Ingresa el valor del pago');
      return;
    }

    try {
      if (tipo === 'mensualidad') await registrarPagoMensualidad(doc, metodo, monto);
      else if (tipo === 'diario') await registrarPagoDiario(doc, metodo, monto);
      else await registrarCopagoEps(doc, metodo, monto);

      toast.success('Pago registrado');
      setValor('');
      cargarHistorial();
    } catch (err) {
      if (isServerUnreachable(err)) {
        toast.error(SERVER_UNREACHABLE_MESSAGE);
      } else {
        // El backend valida contra la tarifa: el mensaje explica el motivo exacto.
        toast.error(getApiErrorMessage(err, 'No se pudo registrar el pago'));
      }
    }
  };

  return (
    <Layout title="Registrar Pago">
      <div className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={registrar} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-4 h-fit">
          <h3 className="font-semibold text-gray-800">Nuevo pago</h3>

          <label className="block text-sm">
            Tipo de pago
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value as Tipo)}
              className="mt-1 w-full px-3 py-2 border rounded-md"
            >
              {TIPOS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>

          <div>
            <p className="block text-sm mb-1">Documento del cliente</p>
            <div className="flex gap-2">
              <div className="w-40 shrink-0">
                <DocumentTypeBar value={tipoDoc} onChange={setTipoDoc} />
              </div>
              <input
                type="number"
                value={documento}
                onChange={(e) => setDocumento(e.target.value)}
                placeholder="Ej: 200000001"
                className="flex-1 px-3 py-2 border rounded-md"
                required
              />
            </div>
          </div>

          <label className="block text-sm">
            Método de pago
            <select
              value={metodo}
              onChange={(e) => setMetodo(e.target.value as MetodoPago)}
              className="mt-1 w-full px-3 py-2 border rounded-md"
            >
              {METODOS.map((m) => (
                <option key={m} value={m}>
                  {m.replaceAll('_', ' ')}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm">
            Valor
            <input
              type="number"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              placeholder="Debe coincidir con la tarifa vigente"
              className="mt-1 w-full px-3 py-2 border rounded-md"
              required
            />
            <span className="text-xs text-gray-500">
              El backend rechaza el pago si el valor no coincide con la tarifa configurada.
            </span>
          </label>

          <button type="submit" className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
            <FiPlus /> Registrar pago
          </button>
        </form>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800">Historial del cliente</h3>
            <button
              type="button"
              onClick={cargarHistorial}
              className="flex items-center gap-1 px-3 py-1.5 text-sm border rounded-md hover:bg-gray-50"
            >
              <FiRefreshCw /> Actualizar
            </button>
          </div>

          {!documento ? (
            <p className="text-gray-500 italic">Escribe un documento para ver su historial.</p>
          ) : loading ? (
            <p className="text-gray-500">Cargando...</p>
          ) : historial.length === 0 ? (
            <p className="text-gray-500 italic">Este cliente no tiene pagos registrados.</p>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Fecha', 'Tipo', 'Valor', 'Método', 'Estado'].map((h) => (
                    <th key={h} className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {historial.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-2 py-2 text-sm">{p.fechaPago}</td>
                    <td className="px-2 py-2 text-sm">{p.tipoPago}</td>
                    <td className="px-2 py-2 text-sm">${p.valor.toLocaleString('es-CO')}</td>
                    <td className="px-2 py-2 text-sm">{p.metodoPago.replaceAll('_', ' ')}</td>
                    <td className="px-2 py-2 text-sm text-green-700">{p.estadoPago}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </Layout>
  );
}