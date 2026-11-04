import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { FiPlus, FiRefreshCw } from 'react-icons/fi';
import Layout from '../components/Layout';
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

const HOY = () => new Date().toISOString().slice(0, 10);

const ETIQUETA_GASTO: Record<string, string> = {
  NOMINA: 'Nómina',
  ARRIENDO: 'Arriendo',
  MANTENIMIENTO: 'Mantenimiento',
};

export default function GastosOperativos() {
  const [fecha, setFecha] = useState(HOY());
  const [gastos, setGastos] = useState<GastoOperativo[]>([]);
  const [entrenadores, setEntrenadores] = useState<UsuarioSistema[]>([]);
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [loading, setLoading] = useState(true);

  const [nomina, setNomina] = useState({ documento: '', valor: '', descripcion: 'Pago de nómina' });
  const [arriendo, setArriendo] = useState({ valor: '', descripcion: 'Arriendo del local' });
  const [mantenimiento, setMantenimiento] = useState({
    idEquipo: '',
    valor: '',
    descripcion: 'Mantenimiento',
  });

  const cargar = useCallback(async () => {
    setLoading(true);
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
      toast.error(
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

  const totalGastos = useMemo(
    () => gastos.reduce((suma, gasto) => suma + gasto.valor, 0),
    [gastos]
  );

  const guardarNomina = async (e: React.FormEvent) => {
    e.preventDefault();
    const documento = Number(nomina.documento);
    const valor = Number(nomina.valor);
    if (!documento || valor <= 0) {
      toast.error('Selecciona un entrenador e ingresa un valor válido');
      return;
    }
    try {
      await registrarNomina(documento, valor, nomina.descripcion || 'Pago de nómina');
      toast.success('Nómina registrada');
      setNomina({ documento: '', valor: '', descripcion: 'Pago de nómina' });
      cargar();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'No se pudo registrar la nómina'));
    }
  };

  const guardarArriendo = async (e: React.FormEvent) => {
    e.preventDefault();
    const valor = Number(arriendo.valor);
    if (valor <= 0) {
      toast.error('Ingresa un valor válido');
      return;
    }
    try {
      await registrarArriendo(valor, arriendo.descripcion || 'Arriendo del local');
      toast.success('Arriendo registrado');
      setArriendo({ valor: '', descripcion: 'Arriendo del local' });
      cargar();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'No se pudo registrar el arriendo'));
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
    try {
      await registrarMantenimiento(
        idEquipo,
        valor,
        mantenimiento.descripcion || 'Mantenimiento'
      );
      toast.success('Mantenimiento registrado');
      setMantenimiento({ idEquipo: '', valor: '', descripcion: 'Mantenimiento' });
      cargar();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'No se pudo registrar el mantenimiento'));
    }
  };

  return (
    <Layout title="Gastos Operativos">
      <div className="grid gap-6 lg:grid-cols-3">
        <form onSubmit={guardarNomina} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-3 h-fit">
          <h3 className="font-semibold text-gray-800">Pago de nómina</h3>
          <label className="block text-sm">
            Entrenador
            <select
              value={nomina.documento}
              onChange={(e) => setNomina({ ...nomina, documento: e.target.value })}
              className="mt-1 w-full px-3 py-2 border rounded-md"
              required
            >
              <option value="">Selecciona un entrenador</option>
              {entrenadores.map((e) => (
                <option key={e.idUsuarioSistema} value={e.numeroDeDocumento}>
                  {e.nombreCompleto} — {e.numeroDeDocumento}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            Valor
            <input
              type="number"
              min="1"
              value={nomina.valor}
              onChange={(e) => setNomina({ ...nomina, valor: e.target.value })}
              className="mt-1 w-full px-3 py-2 border rounded-md"
              required
            />
          </label>
          <label className="block text-sm">
            Descripción
            <input
              type="text"
              value={nomina.descripcion}
              onChange={(e) => setNomina({ ...nomina, descripcion: e.target.value })}
              className="mt-1 w-full px-3 py-2 border rounded-md"
            />
          </label>
          <button type="submit" className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            <FiPlus /> Registrar nómina
          </button>
        </form>

        <form onSubmit={guardarArriendo} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-3 h-fit">
          <h3 className="font-semibold text-gray-800">Pago de arriendo</h3>
          <label className="block text-sm">
            Valor
            <input
              type="number"
              min="1"
              value={arriendo.valor}
              onChange={(e) => setArriendo({ ...arriendo, valor: e.target.value })}
              className="mt-1 w-full px-3 py-2 border rounded-md"
              required
            />
          </label>
          <label className="block text-sm">
            Descripción
            <input
              type="text"
              value={arriendo.descripcion}
              onChange={(e) => setArriendo({ ...arriendo, descripcion: e.target.value })}
              className="mt-1 w-full px-3 py-2 border rounded-md"
            />
          </label>
          <button type="submit" className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
            <FiPlus /> Registrar arriendo
          </button>
        </form>

        <form onSubmit={guardarMantenimiento} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-3 h-fit">
          <h3 className="font-semibold text-gray-800">Pago de mantenimiento</h3>
          <label className="block text-sm">
            Equipo
            <select
              value={mantenimiento.idEquipo}
              onChange={(e) => setMantenimiento({ ...mantenimiento, idEquipo: e.target.value })}
              className="mt-1 w-full px-3 py-2 border rounded-md"
              required
            >
              <option value="">Selecciona un equipo</option>
              {equipos.map((eq) => (
                <option key={eq.idEquipo} value={eq.idEquipo}>
                  {eq.nombre}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            Valor
            <input
              type="number"
              min="1"
              value={mantenimiento.valor}
              onChange={(e) => setMantenimiento({ ...mantenimiento, valor: e.target.value })}
              className="mt-1 w-full px-3 py-2 border rounded-md"
              required
            />
          </label>
          <label className="block text-sm">
            Descripción
            <input
              type="text"
              value={mantenimiento.descripcion}
              onChange={(e) => setMantenimiento({ ...mantenimiento, descripcion: e.target.value })}
              className="mt-1 w-full px-3 py-2 border rounded-md"
            />
          </label>
          <button type="submit" className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700">
            <FiPlus /> Registrar mantenimiento
          </button>
        </form>
      </div>

      <div className="mt-6 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h3 className="font-semibold text-gray-800">
            Gastos del día {totalGastos > 0 && `· $${totalGastos.toLocaleString('es-CO')}`}
          </h3>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="px-3 py-1.5 border rounded-md text-sm"
            />
            <button
              type="button"
              onClick={cargar}
              className="flex items-center gap-1 px-3 py-1.5 text-sm border rounded-md hover:bg-gray-50"
            >
              <FiRefreshCw /> Actualizar
            </button>
          </div>
        </div>

        {loading ? (
          <p className="text-gray-500">Cargando...</p>
        ) : gastos.length === 0 ? (
          <p className="text-gray-500 italic">No hay gastos registrados para esa fecha.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Fecha', 'Tipo', 'Descripción', 'Valor'].map((h) => (
                    <th key={h} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {gastos.map((g) => (
                  <tr key={g.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-sm">{g.fecha}</td>
                    <td className="px-3 py-2 text-sm">{ETIQUETA_GASTO[g.tipoGasto] ?? g.tipoGasto}</td>
                    <td className="px-3 py-2 text-sm">{g.descripcion}</td>
                    <td className="px-3 py-2 text-sm">${g.valor.toLocaleString('es-CO')}</td>
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
