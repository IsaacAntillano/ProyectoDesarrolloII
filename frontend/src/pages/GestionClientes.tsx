import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import toast from 'react-hot-toast';
import {
  FiEdit2,
  FiSearch,
  FiTrash2,
  FiUserPlus,
  FiRefreshCw,
  FiFileText,
  FiXCircle,
  FiUserCheck,
  FiUserX,
} from 'react-icons/fi';
import {
  type ClienteBase,
  type ActualizarClienteDTO,
  type Contrato,
  listarMensualesActivos,
  listarMensualesTodos,
  listarDiariosActivos,
  listarDiariosTodos,
  listarEpsActivos,
  listarEpsTodos,
  actualizarClienteMensual,
  actualizarClienteDiario,
  actualizarBeneficiarioEps,
  desactivarClienteMensual,
  desactivarClienteDiario,
  desactivarBeneficiarioEps,
  reactivarClienteMensual,
  reactivarClienteDiario,
  reactivarBeneficiarioEps,
  buscarClienteMensual,
  buscarClienteDiario,
  buscarBeneficiarioEps,
  consultarContratoMensual,
  cancelarBeneficiarioEps,
  asignarEntrenadorEps,
  liberarEntrenadorEps,
  getApiErrorMessage,
} from '../services/clienteService';
import { listarUsuarios, type UsuarioSistema } from '../services/usuarioSistemaService';
import { isServerUnreachable, SERVER_UNREACHABLE_MESSAGE } from '../utils/apiError';

type Tab = 'mensual' | 'diario' | 'eps';

const ESTADO_EPS: Record<string, string> = {
  ACTIVO: 'Activo',
  BLOQUEADO: 'Bloqueado',
  FINALIZADO: 'Finalizado',
  // El valor guardado conserva el typo historico del enum; la etiqueta no.
  CANCELADO_ANCTICIPADAMENTE: 'Cancelado anticipadamente',
};

export default function GestionClientes() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const esAdmin = user.rol === 'ADMINISTRADOR';

  const [tab, setTab] = useState<Tab>('mensual');
  const [verTodos, setVerTodos] = useState(esAdmin);
  const [clientes, setClientes] = useState<ClienteBase[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [editando, setEditando] = useState<ClienteBase | null>(null);
  const [formEdit, setFormEdit] = useState<ActualizarClienteDTO>({});
  const [entrenadores, setEntrenadores] = useState<UsuarioSistema[]>([]);

  // Modales de contrato, cancelacion y asignacion de entrenador (EPS).
  const [contratoDetalle, setContratoDetalle] = useState<{
    cliente: ClienteBase;
    contrato: Contrato;
  } | null>(null);
  const [cancelando, setCancelando] = useState<ClienteBase | null>(null);
  const [motivoCancelacion, setMotivoCancelacion] = useState('');
  const [asignando, setAsignando] = useState<ClienteBase | null>(null);
  const [documentoEntrenador, setDocumentoEntrenador] = useState('');
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      let data: ClienteBase[];
      if (tab === 'mensual') {
        data = verTodos && esAdmin ? await listarMensualesTodos() : await listarMensualesActivos();
      } else if (tab === 'diario') {
        data = verTodos && esAdmin ? await listarDiariosTodos() : await listarDiariosActivos();
      } else {
        data = verTodos && esAdmin ? await listarEpsTodos() : await listarEpsActivos();
      }
      setClientes(data);
    } catch (err) {
      toast.error(
        isServerUnreachable(err) ? SERVER_UNREACHABLE_MESSAGE : 'Error al cargar clientes'
      );
    } finally {
      setLoading(false);
    }
  }, [tab, verTodos, esAdmin]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargar();
    const handleFocus = () => cargar();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [cargar]);

  useEffect(() => {
    if (!esAdmin) return;
    listarUsuarios()
      .then((usuarios) => setEntrenadores(usuarios.filter((u) => u.rol === 'ENTRENADOR' && u.estado)))
      .catch(() => setEntrenadores([]));
  }, [esAdmin]);

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return clientes || [];
    return (clientes || []).filter(
      (c) =>
        c.nombreCompleto.toLowerCase().includes(q) ||
        String(c.numeroDeDocumento).includes(q) ||
        c.tipoDeDocumento.toLowerCase().includes(q)
    );
  }, [clientes, busqueda]);

  const rutaRegistro = () => {
    if (tab === 'mensual') return '/registrar-cliente-mensual';
    if (tab === 'diario') return '/registrar-cliente-diario';
    return '/registrar-cliente-eps';
  };

  const handleBuscarDocumento = async () => {
    const doc = parseInt(busqueda, 10);
    if (!doc) {
      toast.error('Ingresa un número de documento válido');
      return;
    }
    try {
      let c: ClienteBase;
      if (tab === 'mensual') c = await buscarClienteMensual(doc);
      else if (tab === 'diario') c = await buscarClienteDiario(doc);
      else c = await buscarBeneficiarioEps(doc);
      setClientes((prev) => (prev.some((x) => x.id === c.id) ? prev : [...prev, c]));
      setBusqueda(String(doc));
      toast.success('Cliente encontrado');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Cliente no encontrado'));
    }
  };

  const abrirEditar = (c: ClienteBase) => {
    setEditando(c);
    // CLT-0016: en EPS el nombre y la fecha de nacimiento no son editables;
    // el formulario solo envia los datos de contacto y la contrasena.
    setFormEdit(
      tab === 'eps'
        ? { telefono: c.telefono, correoElectronico: c.correoElectronico }
        : {
            nombreCompleto: c.nombreCompleto,
            fechaDeNacimiento: c.fechaDeNacimiento?.slice(0, 10),
            telefono: c.telefono,
            correoElectronico: c.correoElectronico,
          }
    );
  };

  const guardarEdicion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editando) return;
    try {
      if (tab === 'mensual') await actualizarClienteMensual(editando.numeroDeDocumento, formEdit);
      else if (tab === 'diario') await actualizarClienteDiario(editando.numeroDeDocumento, formEdit);
      else await actualizarBeneficiarioEps(editando.numeroDeDocumento, formEdit);
      toast.success('Cliente actualizado');
      setEditando(null);
      cargar();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Error al actualizar'));
    }
  };

  const inactivar = async (c: ClienteBase) => {
    if (!window.confirm(`¿Inactivar a ${c.nombreCompleto}?`)) return;
    try {
      if (tab === 'mensual') await desactivarClienteMensual(c.numeroDeDocumento);
      else if (tab === 'diario') await desactivarClienteDiario(c.numeroDeDocumento);
      else await desactivarBeneficiarioEps(c.numeroDeDocumento);
      toast.success('Cliente inactivado');
      cargar();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Error al inactivar'));
    }
  };

  const reactivar = async (c: ClienteBase) => {
    if (!window.confirm(`¿Reactivar a ${c.nombreCompleto}?`)) return;
    try {
      if (tab === 'mensual') await reactivarClienteMensual(c.numeroDeDocumento);
      else if (tab === 'diario') await reactivarClienteDiario(c.numeroDeDocumento);
      else await reactivarBeneficiarioEps(c.numeroDeDocumento);
      toast.success('Cliente reactivado');
      cargar();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Error al reactivar'));
    }
  };

  const verContrato = async (c: ClienteBase) => {
    try {
      const contrato = await consultarContratoMensual(c.numeroDeDocumento);
      setContratoDetalle({ cliente: c, contrato });
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'No se pudo consultar el contrato'));
    }
  };

  const confirmarCancelacion = async () => {
    if (!cancelando) return;
    if (!motivoCancelacion.trim()) {
      toast.error('Escribe el motivo de la cancelación');
      return;
    }
    setGuardando(true);
    try {
      await cancelarBeneficiarioEps(cancelando.numeroDeDocumento, motivoCancelacion.trim());
      toast.success('Contrato EPS cancelado anticipadamente');
      setCancelando(null);
      setMotivoCancelacion('');
      cargar();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'No se pudo cancelar el contrato'));
    } finally {
      setGuardando(false);
    }
  };

  const confirmarAsignacion = async () => {
    if (!asignando) return;
    const documento = Number(documentoEntrenador);
    if (!documento) {
      toast.error('Selecciona un entrenador');
      return;
    }
    setGuardando(true);
    try {
      await asignarEntrenadorEps(asignando.numeroDeDocumento, documento);
      toast.success('Entrenador asignado');
      setAsignando(null);
      setDocumentoEntrenador('');
      cargar();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'No se pudo asignar el entrenador'));
    } finally {
      setGuardando(false);
    }
  };

  const quitarEntrenador = async (c: ClienteBase) => {
    if (!window.confirm(`¿Liberar el entrenador de ${c.nombreCompleto}?`)) return;
    try {
      await liberarEntrenadorEps(c.numeroDeDocumento);
      toast.success('Entrenador liberado');
      cargar();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'No se pudo liberar el entrenador'));
    }
  };

  const estadoLabel = (c: ClienteBase) => {
    if (tab === 'mensual') return c.estadoMembresia ?? (c.estado ? 'ACTIVO' : 'INACTIVO');
    if (tab === 'eps') return ESTADO_EPS[c.estadoContrato ?? ''] ?? c.estadoContrato ?? '-';
    return c.estado ? 'Activo' : 'Inactivo';
  };

  const epsCancelado = (c: ClienteBase) =>
    c.estadoContrato === 'CANCELADO_ANCTICIPADAMENTE' || c.estadoContrato === 'FINALIZADO';

  return (
    <Layout title="Gestión de Clientes">
      <div className="flex flex-wrap gap-2 mb-6">
        {(['mensual', 'diario', 'eps'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              tab === t ? 'bg-blue-600 text-white' : 'bg-white border text-gray-700 hover:bg-gray-50'
            }`}
          >
            {t === 'mensual' ? 'Particular Mensual' : t === 'diario' ? 'Particular Diario' : 'Beneficiario EPS'}
          </button>
        ))}
        <label className="ml-auto flex items-center gap-2 text-sm text-gray-600">
          <input type="checkbox" checked={verTodos} onChange={(e) => setVerTodos(e.target.checked)} />
          Ver inactivos / todos
        </label>
        <Link
          to={rutaRegistro()}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700"
        >
          <FiUserPlus /> Nuevo
        </Link>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <FiSearch className="absolute left-3 top-2.5 text-gray-400" />
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por documento o nombre..."
            className="w-full pl-10 pr-3 py-2 border rounded-md"
          />
        </div>
        <button
          type="button"
          onClick={handleBuscarDocumento}
          className="px-4 py-2 bg-slate-800 text-white rounded-md text-sm"
        >
          Buscar por documento
        </button>
      </div>

      {loading ? (
        <p className="text-gray-500">Cargando...</p>
      ) : (
        <div className="bg-white rounded-lg border overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Documento</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Correo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filtrados.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    Sin clientes en esta categoría
                  </td>
                </tr>
              ) : (
                filtrados.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">
                      {c.tipoDeDocumento} {c.numeroDeDocumento}
                    </td>
                    <td className="px-4 py-3 text-sm">{c.nombreCompleto}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{c.correoElectronico}</td>
                    <td className="px-4 py-3 text-sm">
                      <span>{estadoLabel(c)}</span>
                      {tab === 'eps' && (
                        <span
                          className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                            c.tieneEntrenadorPermanente
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {c.tieneEntrenadorPermanente ? 'Con entrenador' : 'Sin entrenador'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      {tab === 'mensual' && (
                        <button
                          type="button"
                          onClick={() => verContrato(c)}
                          className="text-slate-600 hover:text-slate-900"
                          title="Ver contrato"
                        >
                          <FiFileText size={18} />
                        </button>
                      )}
                      {tab === 'eps' && esAdmin && !epsCancelado(c) && (
                        <button
                          type="button"
                          onClick={() => {
                            setAsignando(c);
                            setDocumentoEntrenador('');
                          }}
                          className="text-blue-600 hover:text-blue-800"
                          title={c.tieneEntrenadorPermanente ? 'Reasignar entrenador' : 'Asignar entrenador'}
                        >
                          <FiUserCheck size={18} />
                        </button>
                      )}
                      {tab === 'eps' && esAdmin && c.tieneEntrenadorPermanente && !epsCancelado(c) && (
                        <button
                          type="button"
                          onClick={() => quitarEntrenador(c)}
                          className="text-amber-600 hover:text-amber-800"
                          title="Liberar entrenador"
                        >
                          <FiUserX size={18} />
                        </button>
                      )}
                      {tab === 'eps' && esAdmin && c.estado && !epsCancelado(c) && (
                        <button
                          type="button"
                          onClick={() => {
                            setCancelando(c);
                            setMotivoCancelacion('');
                          }}
                          className="text-red-600 hover:text-red-800"
                          title="Cancelar contrato anticipadamente"
                        >
                          <FiXCircle size={18} />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => abrirEditar(c)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Actualizar"
                      >
                        <FiEdit2 size={18} />
                      </button>
                      {!c.estado && (
                        <button
                          type="button"
                          onClick={() => reactivar(c)}
                          className="text-green-600 hover:text-green-800"
                          title="Reactivar"
                        >
                          <FiRefreshCw size={18} />
                        </button>
                      )}
                      {esAdmin && c.estado && (
                        <button
                          type="button"
                          onClick={() => inactivar(c)}
                          className="text-red-600 hover:text-red-800"
                          title="Inactivar"
                        >
                          <FiTrash2 size={18} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {editando && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <form
            onSubmit={guardarEdicion}
            className="bg-white rounded-lg p-6 max-w-lg w-full shadow-xl grid gap-4"
          >
            <h3 className="font-bold text-lg">Actualizar {editando.nombreCompleto}</h3>
            {/* CLT-0016: en EPS el nombre y la fecha de nacimiento vienen del
                contrato y no se editan desde aca. */}
            {tab !== 'eps' && (
              <>
                <input
                  className="border rounded px-3 py-2"
                  placeholder="Nombre completo"
                  value={formEdit.nombreCompleto ?? ''}
                  onChange={(e) => setFormEdit({ ...formEdit, nombreCompleto: e.target.value })}
                  required
                />
                <input
                  type="date"
                  className="border rounded px-3 py-2"
                  value={formEdit.fechaDeNacimiento ?? ''}
                  onChange={(e) => setFormEdit({ ...formEdit, fechaDeNacimiento: e.target.value })}
                />
              </>
            )}
            <input
              type="number"
              className="border rounded px-3 py-2"
              placeholder="Teléfono"
              value={formEdit.telefono ?? ''}
              onChange={(e) => setFormEdit({ ...formEdit, telefono: Number(e.target.value) })}
            />
            <input
              type="email"
              className="border rounded px-3 py-2"
              placeholder="Correo"
              value={formEdit.correoElectronico ?? ''}
              onChange={(e) => setFormEdit({ ...formEdit, correoElectronico: e.target.value })}
            />
            {tab === 'mensual' && (
              <select
                className="border rounded px-3 py-2"
                value={formEdit.tipoMembresia ?? 'MENSUAL'}
                onChange={(e) =>
                  setFormEdit({
                    ...formEdit,
                    tipoMembresia: e.target.value as ActualizarClienteDTO['tipoMembresia'],
                  })
                }
              >
                <option value="MENSUAL">Mensual</option>
                <option value="TRIMESTRAL">Trimestral</option>
                <option value="SEMESTRAL">Semestral</option>
                <option value="ANUAL">Anual</option>
              </select>
            )}
            <input
              type="password"
              className="border rounded px-3 py-2"
              placeholder="Nueva contraseña (opcional)"
              onChange={(e) => setFormEdit({ ...formEdit, contrasena: e.target.value })}
            />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setEditando(null)} className="px-4 py-2 border rounded">
                Cancelar
              </button>
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">
                Guardar
              </button>
            </div>
          </form>
        </div>
      )}
      {contratoDetalle && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full shadow-xl space-y-4">
            <h3 className="font-bold text-lg">
              Contrato de {contratoDetalle.cliente.nombreCompleto}
            </h3>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-gray-500">Documento</dt>
                <dd>{contratoDetalle.cliente.numeroDeDocumento}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Membresía</dt>
                <dd>{contratoDetalle.contrato.tipoMembresia}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Fecha de inicio</dt>
                <dd>{contratoDetalle.contrato.fechaInicio}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Fecha de vencimiento</dt>
                <dd>{contratoDetalle.contrato.fechaVencimiento}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Estado</dt>
                <dd>{contratoDetalle.contrato.estado.replaceAll('_', ' ')}</dd>
              </div>
            </dl>
            <div className="flex justify-end gap-2">
              <Link
                to={`/registrar-pago?documento=${contratoDetalle.cliente.numeroDeDocumento}`}
                className="px-4 py-2 bg-green-600 text-white rounded text-sm"
              >
                Registrar pago
              </Link>
              <button
                type="button"
                onClick={() => setContratoDetalle(null)}
                className="px-4 py-2 border rounded"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {cancelando && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl space-y-4">
            <h3 className="font-bold text-lg">Cancelar contrato anticipadamente</h3>
            <p className="text-sm text-gray-600">
              Cliente: <strong>{cancelando.nombreCompleto}</strong>. El beneficiario quedará
              inactivo y se liberará su entrenador.
            </p>
            <label className="block text-sm">
              Motivo
              <textarea
                value={motivoCancelacion}
                onChange={(e) => setMotivoCancelacion(e.target.value)}
                rows={3}
                className="mt-1 w-full px-3 py-2 border rounded-md"
                placeholder="Motivo de la cancelación (queda en la remisión)"
                required
              />
            </label>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCancelando(null)}
                className="px-4 py-2 border rounded"
                disabled={guardando}
              >
                Volver
              </button>
              <button
                type="button"
                onClick={confirmarCancelacion}
                disabled={guardando}
                className="px-4 py-2 bg-red-600 text-white rounded disabled:opacity-50"
              >
                Cancelar contrato
              </button>
            </div>
          </div>
        </div>
      )}

      {asignando && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl space-y-4">
            <h3 className="font-bold text-lg">Asignar entrenador</h3>
            <p className="text-sm text-gray-600">
              Beneficiario EPS: <strong>{asignando.nombreCompleto}</strong>
            </p>
            <label className="block text-sm">
              Entrenador
              <select
                value={documentoEntrenador}
                onChange={(e) => setDocumentoEntrenador(e.target.value)}
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
            {entrenadores.length === 0 && (
              <p className="text-xs text-amber-700">
                No hay entrenadores activos registrados.
              </p>
            )}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setAsignando(null)}
                className="px-4 py-2 border rounded"
                disabled={guardando}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarAsignacion}
                disabled={guardando || entrenadores.length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
              >
                Asignar
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
