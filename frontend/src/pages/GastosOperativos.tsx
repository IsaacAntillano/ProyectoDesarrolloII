import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { FiRefreshCw, FiPlus } from 'react-icons/fi';
import Layout from '../components/Layout';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import StatusBadge from '../components/ui/StatusBadge';
import EmptyState from '../components/ui/EmptyState';
import LoadingState from '../components/ui/LoadingState';
import ErrorState from '../components/ui/ErrorState';
import { Field, Input, Select } from '../components/ui/Field';
import HelpTip from '../components/ui/HelpTip';
import { listarEquipos, type Equipo } from '../services/adminService';
import {
  gastosDelDia,
  registrarArriendo,
  registrarMantenimiento,
  registrarNomina,
  type GastoOperativo,
} from '../services/pagoService';
import { listarUsuarios, type UsuarioSistema } from '../services/usuarioSistemaService';
import { getApiErrorMessage, isServerUnreachable, SERVER_UNREACHABLE_MESSAGE } from '../utils/apiError';
import { etiqueta, ETIQUETA_TIPO_GASTO } from '../constants/labels';
import { formatearFecha, formatearMoneda, hoyISO } from '../utils/format';

export default function GastosOperativos() {
  const [fecha, setFecha] = useState(hoyISO());
  const [gastos, setGastos] = useState<GastoOperativo[]>([]);
  const [entrenadores, setEntrenadores] = useState<UsuarioSistema[]>([]);
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const [nomina, setNomina] = useState({ documento: '', valor: '', descripcion: 'Pago de nómina' });
  const [arriendo, setArriendo] = useState({ valor: '', descripcion: 'Arriendo del local' });
  const [mantenimiento, setMantenimiento] = useState({
    idEquipo: '',
    valor: '',
    descripcion: 'Mantenimiento',
  });

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [g, usuarios, eq] = await Promise.all([
        gastosDelDia(fecha),
        listarUsuarios(),
        listarEquipos(),
      ]);
      setGastos(g);
      setEntrenadores(usuarios.filter((u) => u.rol === 'ENTRENADOR' && u.estado));
      setEquipos(eq);
    } catch (err) {
      setError(
        isServerUnreachable(err)
          ? SERVER_UNREACHABLE_MESSAGE
          : getApiErrorMessage(err, 'No se pudieron cargar los gastos')
      );
    } finally {
      setLoading(false);
    }
  }, [fecha]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargar();
  }, [cargar]);

  const totalGastos = useMemo(() => gastos.reduce((s, g) => s + g.valor, 0), [gastos]);

  const totalesPorTipo = useMemo(() => {
    const mapa = new Map<string, number>();
    for (const g of gastos) mapa.set(g.tipoGasto, (mapa.get(g.tipoGasto) ?? 0) + g.valor);
    return [...mapa.entries()].sort((a, b) => b[1] - a[1]);
  }, [gastos]);

  const guardarNomina = async (e: React.FormEvent) => {
    e.preventDefault();
    const documento = Number(nomina.documento);
    const valor = Number(nomina.valor);
    if (!documento || valor <= 0) {
      toast.error('Selecciona un entrenador e ingresa un valor válido');
      return;
    }
    setGuardando(true);
    try {
      await registrarNomina(documento, valor, nomina.descripcion || 'Pago de nómina');
      toast.success(`Nómina de ${formatearMoneda(valor)} registrada`);
      setNomina({ documento: '', valor: '', descripcion: 'Pago de nómina' });
      cargar();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'No se pudo registrar la nómina'));
    } finally {
      setGuardando(false);
    }
  };

  const guardarArriendo = async (e: React.FormEvent) => {
    e.preventDefault();
    const valor = Number(arriendo.valor);
    if (valor <= 0) {
      toast.error('Ingresa un valor válido para el arriendo');
      return;
    }
    setGuardando(true);
    try {
      await registrarArriendo(valor, arriendo.descripcion || 'Arriendo del local');
      toast.success(`Arriendo de ${formatearMoneda(valor)} registrado`);
      setArriendo({ valor: '', descripcion: 'Arriendo del local' });
      cargar();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'No se pudo registrar el arriendo'));
    } finally {
      setGuardando(false);
    }
  };

  const guardarMantenimiento = async (e: React.FormEvent) => {
    e.preventDefault();
    const idEquipo = Number(mantenimiento.idEquipo);
    const valor = Number(mantenimiento.valor);
    if (!idEquipo || valor <= 0) {
      toast.error('Selecciona un equipo e ingresa un valor válido');
      return;
    }
    setGuardando(true);
    try {
      await registrarMantenimiento(idEquipo, valor, mantenimiento.descripcion || 'Mantenimiento');
      toast.success(`Mantenimiento de ${formatearMoneda(valor)} registrado`);
      setMantenimiento({ idEquipo: '', valor: '', descripcion: 'Mantenimiento' });
      cargar();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'No se pudo registrar el mantenimiento'));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Layout title="Gastos Operativos" description="Nómina, arriendo y mantenimiento del día; descuentan del flujo de caja">
      <PageHeader
        title="Gastos operativos"
        description="Registra los egresos del día. Quedan asociados a la fecha seleccionada y se descuentan de los ingresos en el flujo de caja."
        actions={
          <div className="flex items-center gap-2">
            <Field label="Fecha" htmlFor="fecha-gastos">
              <Input type="date" id="fecha-gastos" value={fecha} onChange={(e) => setFecha(e.target.value)} />
            </Field>
            <div className="self-end">
              <Button variant="secondary" onClick={() => void cargar()} aria-label="Actualizar gastos">
                <FiRefreshCw aria-hidden="true" /> Actualizar
              </Button>
            </div>
          </div>
        }
      />

      <HelpTip title="¿Cómo se calcula el flujo de caja?">
        <p>
          Los ingresos del día (mensualidades, acceso diario, copagos EPS y servicio Plus) menos
          los gastos registrados aquí dan la utilidad neta. Los gastos se registran por fecha; para
          consolidarlos usa "Generar flujo de caja" en el panel de administración.
        </p>
      </HelpTip>

      <div className="mt-4 grid gap-6 lg:grid-cols-3">
        <form onSubmit={guardarNomina} className="space-y-3 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="font-semibold text-gray-800">Pago de nómina</h3>
          <Field label="Entrenador" htmlFor="nomina-entrenador" required>
            <Select
              id="nomina-entrenador"
              value={nomina.documento}
              onChange={(e) => setNomina({ ...nomina, documento: e.target.value })}
              required
            >
              <option value="">Selecciona un entrenador</option>
              {entrenadores.map((e) => (
                <option key={e.idUsuarioSistema} value={e.numeroDeDocumento}>
                  {e.nombreCompleto}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Valor" htmlFor="nomina-valor" required help="En pesos, sin puntos">
            <Input
              id="nomina-valor"
              type="number"
              inputMode="decimal"
              min={1}
              value={nomina.valor}
              onChange={(e) => setNomina({ ...nomina, valor: e.target.value })}
              required
            />
          </Field>
          <Field label="Descripción" htmlFor="nomina-desc">
            <Input
              id="nomina-desc"
              type="text"
              value={nomina.descripcion}
              onChange={(e) => setNomina({ ...nomina, descripcion: e.target.value })}
            />
          </Field>
          <Button type="submit" className="w-full" loading={guardando}>
            <FiPlus aria-hidden="true" /> Registrar nómina
          </Button>
        </form>

        <form onSubmit={guardarArriendo} className="space-y-3 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="font-semibold text-gray-800">Pago de arriendo</h3>
          <Field label="Valor" htmlFor="arriendo-valor" required help="En pesos, sin puntos">
            <Input
              id="arriendo-valor"
              type="number"
              inputMode="decimal"
              min={1}
              value={arriendo.valor}
              onChange={(e) => setArriendo({ ...arriendo, valor: e.target.value })}
              required
            />
          </Field>
          <Field label="Descripción" htmlFor="arriendo-desc">
            <Input
              id="arriendo-desc"
              type="text"
              value={arriendo.descripcion}
              onChange={(e) => setArriendo({ ...arriendo, descripcion: e.target.value })}
            />
          </Field>
          <Button type="submit" variant="success" className="w-full" loading={guardando}>
            <FiPlus aria-hidden="true" /> Registrar arriendo
          </Button>
        </form>

        <form onSubmit={guardarMantenimiento} className="space-y-3 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="font-semibold text-gray-800">Pago de mantenimiento</h3>
          <Field label="Equipo" htmlFor="mantenimiento-equipo" required>
            <Select
              id="mantenimiento-equipo"
              value={mantenimiento.idEquipo}
              onChange={(e) => setMantenimiento({ ...mantenimiento, idEquipo: e.target.value })}
              required
            >
              <option value="">Selecciona un equipo</option>
              {equipos.map((eq) => (
                <option key={eq.idEquipo} value={eq.idEquipo}>
                  {eq.nombre}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Valor" htmlFor="mantenimiento-valor" required help="En pesos, sin puntos">
            <Input
              id="mantenimiento-valor"
              type="number"
              inputMode="decimal"
              min={1}
              value={mantenimiento.valor}
              onChange={(e) => setMantenimiento({ ...mantenimiento, valor: e.target.value })}
              required
            />
          </Field>
          <Field label="Descripción" htmlFor="mantenimiento-desc">
            <Input
              id="mantenimiento-desc"
              type="text"
              value={mantenimiento.descripcion}
              onChange={(e) => setMantenimiento({ ...mantenimiento, descripcion: e.target.value })}
            />
          </Field>
          <Button type="submit" className="w-full !bg-amber-600 !text-white hover:!bg-amber-700" loading={guardando}>
            <FiPlus aria-hidden="true" /> Registrar mantenimiento
          </Button>
        </form>
      </div>

      <section aria-labelledby="resumen-gastos" className="mt-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h3 id="resumen-gastos" className="mb-4 font-semibold text-gray-800">
          Gastos del {formatearFecha(fecha)}
          {totalGastos > 0 && (
            <span className="ml-2 text-base font-bold text-gray-900">{formatearMoneda(totalGastos)}</span>
          )}
        </h3>

        {!loading && !error && gastos.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {totalesPorTipo.map(([tipo, total]) => (
              <StatusBadge key={tipo} tone="gray">
                {etiqueta(ETIQUETA_TIPO_GASTO, tipo)}: {formatearMoneda(total)}
              </StatusBadge>
            ))}
          </div>
        )}

        {loading ? (
          <LoadingState message="Cargando gastos..." />
        ) : error ? (
          <ErrorState message={error} onRetry={() => void cargar()} />
        ) : gastos.length === 0 ? (
          <EmptyState
            title="Sin gastos para esa fecha"
            message="Todavía no registraste nómina, arriendo ni mantenimiento para este día. Usa los formularios de arriba."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <caption className="sr-only">Gastos operativos registrados</caption>
              <thead className="bg-gray-50">
                <tr>
                  {['Fecha', 'Tipo', 'Descripción', 'Valor'].map((h) => (
                    <th key={h} scope="col" className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {gastos.map((g) => (
                  <tr key={g.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-sm">{formatearFecha(g.fecha)}</td>
                    <td className="px-3 py-2 text-sm">{etiqueta(ETIQUETA_TIPO_GASTO, g.tipoGasto)}</td>
                    <td className="px-3 py-2 text-sm text-gray-600">{g.descripcion}</td>
                    <td className="px-3 py-2 text-sm font-medium">{formatearMoneda(g.valor)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </Layout>
  );
}
