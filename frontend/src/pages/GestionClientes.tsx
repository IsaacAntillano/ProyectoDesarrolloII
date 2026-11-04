import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import PageHeader from '../components/ui/PageHeader';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import StatusBadge from '../components/ui/StatusBadge';
import EmptyState from '../components/ui/EmptyState';
import LoadingState from '../components/ui/LoadingState';
import ErrorState from '../components/ui/ErrorState';
import Button from '../components/ui/Button';
import { Field, Input, Select, Textarea, PasswordInput } from '../components/ui/Field';
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
import {
  etiqueta,
  ETIQUETA_ESTADO_MEMBRESIA,
  ETIQUETA_ESTADO_EPS,
  ETIQUETA_TIPO_MEMBRESIA,
  ETIQUETA_ESTADO_CONTRATO,
} from '../constants/labels';
import { formatearFecha, formatearNumero } from '../utils/format';

type Tab = 'mensual' | 'diario' | 'eps';

const CUPO_ENTRENADOR = 4;

interface AccionConfirmable {
  tipo: 'inactivar' | 'reactivar' | 'liberar';
  cliente: ClienteBase;
}

export default function GestionClientes() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const esAdmin = user.rol === 'ADMINISTRADOR';

  const [tab, setTab] = useState<Tab>('mensual');
  const [verTodos, setVerTodos] = useState(esAdmin);
  const [clientes, setClientes] = useState<ClienteBase[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [editando, setEditando] = useState<ClienteBase | null>(null);
  const [formEdit, setFormEdit] = useState<ActualizarClienteDTO>({});
  const [entrenadores, setEntrenadores] = useState<UsuarioSistema[]>([]);
  const [guardando, setGuardando] = useState(false);

  // Modales de contrato, cancelación y asignación de entrenador (EPS).
  const [contratoDetalle, setContratoDetalle] = useState<{
    cliente: ClienteBase;
    contrato: Contrato;
  } | null>(null);
  const [cancelando, setCancelando] = useState<ClienteBase | null>(null);
  const [motivoCancelacion, setMotivoCancelacion] = useState('');
  const [asignando, setAsignando] = useState<ClienteBase | null>(null);
  const [documentoEntrenador, setDocumentoEntrenador] = useState('');

  // Confirmaciones destructivas (reemplazan window.confirm).
  const [accion, setAccion] = useState<AccionConfirmable | null>(null);
  const [procesandoAccion, setProcesandoAccion] = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true);
    setErrorCarga(null);
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
      setErrorCarga(
        isServerUnreachable(err) ? SERVER_UNREACHABLE_MESSAGE : 'No se pudieron cargar los clientes.'
      );
    } finally {
      setLoading(false);
    }
  }, [tab, verTodos, esAdmin]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargar();
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

  const nombreTab = () =>
    tab === 'mensual' ? 'Particular Mensual' : tab === 'diario' ? 'Particular Diario' : 'Beneficiario EPS';

  const handleBuscarDocumento = async () => {
    const doc = Number(busqueda.trim());
    if (!doc || Number.isNaN(doc)) {
      toast.error('Ingresa un número de documento válido para buscar');
      return;
    }
    try {
      let c: ClienteBase;
      if (tab === 'mensual') c = await buscarClienteMensual(doc);
      else if (tab === 'diario') c = await buscarClienteDiario(doc);
      else c = await buscarBeneficiarioEps(doc);
      setClientes((prev) => (prev.some((x) => x.id === c.id) ? prev : [...prev, c]));
      toast.success(`${c.nombreCompleto} encontrado`);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Cliente no encontrado'));
    }
  };

  const abrirEditar = (c: ClienteBase) => {
    setEditando(c);
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
    setGuardando(true);
    try {
      if (tab === 'mensual') await actualizarClienteMensual(editando.numeroDeDocumento, formEdit);
      else if (tab === 'diario') await actualizarClienteDiario(editando.numeroDeDocumento, formEdit);
      else await actualizarBeneficiarioEps(editando.numeroDeDocumento, formEdit);
      toast.success(`${editando.nombreCompleto} actualizado`);
      setEditando(null);
      cargar();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'No se pudo actualizar el cliente'));
    } finally {
      setGuardando(false);
    }
  };

  const confirmarAccion = async () => {
    if (!accion) return;
    setProcesandoAccion(true);
    try {
      const c = accion.cliente;
      if (accion.tipo === 'inactivar') {
        if (tab === 'mensual') await desactivarClienteMensual(c.numeroDeDocumento);
        else if (tab === 'diario') await desactivarClienteDiario(c.numeroDeDocumento);
        else await desactivarBeneficiarioEps(c.numeroDeDocumento);
        toast.success(`${c.nombreCompleto} inactivado`);
      } else if (accion.tipo === 'reactivar') {
        if (tab === 'mensual') await reactivarClienteMensual(c.numeroDeDocumento);
        else if (tab === 'diario') await reactivarClienteDiario(c.numeroDeDocumento);
        else await reactivarBeneficiarioEps(c.numeroDeDocumento);
        toast.success(`${c.nombreCompleto} reactivado`);
      } else {
        await liberarEntrenadorEps(c.numeroDeDocumento);
        toast.success(`Entrenador liberado de ${c.nombreCompleto}`);
      }
      setAccion(null);
      cargar();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'No se pudo completar la acción'));
    } finally {
      setProcesandoAccion(false);
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
    if (!documentoEntrenador) {
      toast.error('Selecciona un entrenador');
      return;
    }
    setGuardando(true);
    try {
      await asignarEntrenadorEps(asignando.numeroDeDocumento, Number(documentoEntrenador));
      toast.success(`Entrenador asignado a ${asignando.nombreCompleto}`);
      setAsignando(null);
      setDocumentoEntrenador('');
      cargar();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'No se pudo asignar el entrenador'));
    } finally {
      setGuardando(false);
    }
  };

  const epsCancelado = (c: ClienteBase) =>
    c.estadoContrato === 'CANCELADO_ANCTICIPADAMENTE' || c.estadoContrato === 'FINALIZADO';

  const estadoBadge = (c: ClienteBase) => {
    if (!c.estado) return <StatusBadge tone="gray">Inactivo</StatusBadge>;
    if (tab === 'eps') {
      const cancelado = epsCancelado(c);
      return (
        <StatusBadge tone={cancelado ? 'red' : 'green'}>
          {etiqueta(ETIQUETA_ESTADO_EPS, c.estadoContrato)}
        </StatusBadge>
      );
    }
    if (tab === 'mensual') {
      const activo = (c.estadoMembresia ?? 'ACTIVO') === 'ACTIVO';
      return (
        <StatusBadge tone={activo ? 'green' : 'red'}>
          {etiqueta(ETIQUETA_ESTADO_MEMBRESIA, c.estadoMembresia)}
        </StatusBadge>
      );
    }
    return <StatusBadge tone="green">Activo</StatusBadge>;
  };

  return (
    <Layout title="Gestión de Clientes" description="Consulta, crea y administra clientes de los tres tipos">
      <PageHeader
        title="Gestión de Clientes"
        description="Busca por documento o nombre, edita, inactiva o gestiona contratos. Los datos se guardan al confirmar."
        actions={
          <Link
            to={rutaRegistro()}
            className="inline-flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            <FiUserPlus aria-hidden="true" /> Nuevo {nombreTab().toLowerCase()}
          </Link>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2" role="tablist" aria-label="Tipo de cliente">
        {(['mensual', 'diario', 'eps'] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`rounded-md px-4 py-2 text-sm font-medium transition [&:focus-visible]:outline-none [&:focus-visible]:ring-2 [&:focus-visible]:ring-blue-500 ${
              tab === t
                ? 'bg-blue-600 text-white'
                : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            {t === 'mensual' ? 'Particular Mensual' : t === 'diario' ? 'Particular Diario' : 'Beneficiario EPS'}
          </button>
        ))}
        {esAdmin && (
          <label className="ml-auto flex cursor-pointer items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={verTodos}
              onChange={(e) => setVerTodos(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            Ver inactivos / todos
          </label>
        )}
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <div className="relative min-w-[200px] flex-1">
          <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true" />
          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void handleBuscarDocumento();
            }}
            placeholder="Buscar por documento o nombre..."
            aria-label="Buscar por documento o nombre"
            className="w-full rounded-md border border-gray-300 py-2 pl-10 pr-3 text-sm [&:focus-visible]:outline-none [&:focus-visible]:ring-2 [&:focus-visible]:ring-blue-500"
          />
        </div>
        <Button variant="secondary" onClick={() => void handleBuscarDocumento()}>
          Buscar por documento
        </Button>
        <Button variant="ghost" onClick={() => void cargar()} aria-label="Actualizar lista">
          <FiRefreshCw aria-hidden="true" /> Actualizar
        </Button>
      </div>

      {loading ? (
        <LoadingState message="Cargando clientes..." />
      ) : errorCarga ? (
        <ErrorState message={errorCarga} onRetry={() => void cargar()} />
      ) : filtrados.length === 0 ? (
        <EmptyState
          title="Sin clientes en esta categoría"
          message={
            busqueda
              ? `No se encontró ningún cliente que coincida con "${busqueda}". Prueba con el documento completo.`
              : 'Todavía no hay clientes registrados de este tipo. Crea el primero.'
          }
          action={
            <Link
              to={rutaRegistro()}
              className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              <FiUserPlus aria-hidden="true" /> Nuevo {nombreTab().toLowerCase()}
            </Link>
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <caption className="sr-only">Lista de {nombreTab().toLowerCase()}</caption>
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Documento</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Nombre</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Correo</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Estado</th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filtrados.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">
                    {c.tipoDeDocumento} {formatearNumero(c.numeroDeDocumento)}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{c.nombreCompleto}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{c.correoElectronico}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {estadoBadge(c)}
                      {tab === 'eps' && (
                        <StatusBadge tone={c.tieneEntrenadorPermanente ? 'blue' : 'gray'}>
                          {c.tieneEntrenadorPermanente ? 'Con entrenador' : 'Sin entrenador'}
                        </StatusBadge>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex flex-wrap justify-end gap-1">
                      {tab === 'mensual' && (
                        <button
                          type="button"
                          onClick={() => void verContrato(c)}
                          className="rounded-md p-2 text-slate-600 hover:bg-gray-100 hover:text-slate-900 [&:focus-visible]:outline-none [&:focus-visible]:ring-2 [&:focus-visible]:ring-blue-500"
                          aria-label={`Ver contrato de ${c.nombreCompleto}`}
                          title="Ver contrato"
                        >
                          <FiFileText aria-hidden="true" />
                        </button>
                      )}
                      {tab === 'eps' && esAdmin && !epsCancelado(c) && (
                        <button
                          type="button"
                          onClick={() => {
                            setAsignando(c);
                            setDocumentoEntrenador('');
                          }}
                          className="rounded-md p-2 text-blue-600 hover:bg-blue-50 [&:focus-visible]:outline-none [&:focus-visible]:ring-2 [&:focus-visible]:ring-blue-500"
                          aria-label={`${c.tieneEntrenadorPermanente ? 'Reasignar' : 'Asignar'} entrenador a ${c.nombreCompleto}`}
                          title={c.tieneEntrenadorPermanente ? 'Reasignar entrenador' : 'Asignar entrenador'}
                        >
                          <FiUserCheck aria-hidden="true" />
                        </button>
                      )}
                      {tab === 'eps' && esAdmin && c.tieneEntrenadorPermanente && !epsCancelado(c) && (
                        <button
                          type="button"
                          onClick={() => setAccion({ tipo: 'liberar', cliente: c })}
                          className="rounded-md p-2 text-amber-600 hover:bg-amber-50 [&:focus-visible]:outline-none [&:focus-visible]:ring-2 [&:focus-visible]:ring-amber-500"
                          aria-label={`Liberar el entrenador de ${c.nombreCompleto}`}
                          title="Liberar entrenador"
                        >
                          <FiUserX aria-hidden="true" />
                        </button>
                      )}
                      {tab === 'eps' && esAdmin && c.estado && !epsCancelado(c) && (
                        <button
                          type="button"
                          onClick={() => {
                            setCancelando(c);
                            setMotivoCancelacion('');
                          }}
                          className="rounded-md p-2 text-red-600 hover:bg-red-50 [&:focus-visible]:outline-none [&:focus-visible]:ring-2 [&:focus-visible]:ring-red-500"
                          aria-label={`Cancelar anticipadamente el contrato de ${c.nombreCompleto}`}
                          title="Cancelar contrato anticipadamente"
                        >
                          <FiXCircle aria-hidden="true" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => abrirEditar(c)}
                        className="rounded-md p-2 text-blue-600 hover:bg-blue-50 [&:focus-visible]:outline-none [&:focus-visible]:ring-2 [&:focus-visible]:ring-blue-500"
                        aria-label={`Actualizar a ${c.nombreCompleto}`}
                        title="Actualizar"
                      >
                        <FiEdit2 aria-hidden="true" />
                      </button>
                      {!c.estado && (
                        <button
                          type="button"
                          onClick={() => setAccion({ tipo: 'reactivar', cliente: c })}
                          className="rounded-md p-2 text-green-600 hover:bg-green-50 [&:focus-visible]:outline-none [&:focus-visible]:ring-2 [&:focus-visible]:ring-green-500"
                          aria-label={`Reactivar a ${c.nombreCompleto}`}
                          title="Reactivar"
                        >
                          <FiRefreshCw aria-hidden="true" />
                        </button>
                      )}
                      {esAdmin && c.estado && (
                        <button
                          type="button"
                          onClick={() => setAccion({ tipo: 'inactivar', cliente: c })}
                          className="rounded-md p-2 text-red-600 hover:bg-red-50 [&:focus-visible]:outline-none [&:focus-visible]:ring-2 [&:focus-visible]:ring-red-500"
                          aria-label={`Inactivar a ${c.nombreCompleto}`}
                          title="Inactivar"
                        >
                          <FiTrash2 aria-hidden="true" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Editar */}
      <Modal
        open={!!editando}
        onClose={() => setEditando(null)}
        title={editando ? `Actualizar a ${editando.nombreCompleto}` : 'Actualizar cliente'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditando(null)} disabled={guardando}>
              Cancelar
            </Button>
            <Button type="submit" form="form-editar" loading={guardando}>
              Guardar cambios
            </Button>
          </>
        }
      >
        <form id="form-editar" onSubmit={guardarEdicion} className="grid gap-4">
          {tab !== 'eps' && (
            <>
              <Field label="Nombre completo" htmlFor="edit-nombre" required>
                <Input
                  id="edit-nombre"
                  value={formEdit.nombreCompleto ?? ''}
                  onChange={(e) => setFormEdit({ ...formEdit, nombreCompleto: e.target.value })}
                  required
                />
              </Field>
              <Field label="Fecha de nacimiento" htmlFor="edit-nacimiento" help="No puede ser una fecha futura">
                <Input
                  id="edit-nacimiento"
                  type="date"
                  value={formEdit.fechaDeNacimiento ?? ''}
                  onChange={(e) => setFormEdit({ ...formEdit, fechaDeNacimiento: e.target.value })}
                />
              </Field>
            </>
          )}
          <Field label="Teléfono" htmlFor="edit-telefono" help="Solo números, sin espacios">
            <Input
              id="edit-telefono"
              type="tel"
              inputMode="numeric"
              value={formEdit.telefono ?? ''}
              onChange={(e) => setFormEdit({ ...formEdit, telefono: Number(e.target.value) })}
            />
          </Field>
          <Field label="Correo electrónico" htmlFor="edit-correo">
            <Input
              id="edit-correo"
              type="email"
              value={formEdit.correoElectronico ?? ''}
              onChange={(e) => setFormEdit({ ...formEdit, correoElectronico: e.target.value })}
            />
          </Field>
          {tab === 'mensual' && (
            <Field label="Tipo de membresía" htmlFor="edit-membresia">
              <Select
                id="edit-membresia"
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
              </Select>
            </Field>
          )}
          <Field label="Nueva contraseña (opcional)" htmlFor="edit-contrasena" help="Déjala vacía para conservar la actual">
            <PasswordInput
              id="edit-contrasena"
              value={formEdit.contrasena ?? ''}
              onChange={(e) => setFormEdit({ ...formEdit, contrasena: e.target.value })}
            />
          </Field>
        </form>
      </Modal>

      {/* Contrato */}
      <Modal
        open={!!contratoDetalle}
        onClose={() => setContratoDetalle(null)}
        title={contratoDetalle ? `Contrato de ${contratoDetalle.cliente.nombreCompleto}` : 'Contrato'}
        footer={
          contratoDetalle ? (
            <>
              <Link
                to={`/registrar-pago?documento=${contratoDetalle.cliente.numeroDeDocumento}`}
                className="inline-flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
              >
                Registrar pago
              </Link>
              <Button variant="secondary" onClick={() => setContratoDetalle(null)}>
                Cerrar
              </Button>
            </>
          ) : undefined
        }
      >
        {contratoDetalle && (
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-gray-500">Documento</dt>
              <dd className="font-medium">{formatearNumero(contratoDetalle.cliente.numeroDeDocumento)}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Membresía</dt>
              <dd className="font-medium">
                {etiqueta(ETIQUETA_TIPO_MEMBRESIA, contratoDetalle.contrato.tipoMembresia)}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Inicio</dt>
              <dd className="font-medium">{formatearFecha(contratoDetalle.contrato.fechaInicio)}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Vencimiento</dt>
              <dd className="font-medium">{formatearFecha(contratoDetalle.contrato.fechaVencimiento)}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Estado</dt>
              <dd className="font-medium">{etiqueta(ETIQUETA_ESTADO_CONTRATO, contratoDetalle.contrato.estado)}</dd>
            </div>
          </dl>
        )}
      </Modal>

      {/* Cancelar contrato EPS */}
      <Modal
        open={!!cancelando}
        onClose={() => setCancelando(null)}
        title="Cancelar contrato anticipadamente"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCancelando(null)} disabled={guardando}>
              Volver
            </Button>
            <Button variant="danger" onClick={() => void confirmarCancelacion()} loading={guardando}>
              Cancelar contrato
            </Button>
          </>
        }
      >
        {cancelando && (
          <>
            <p className="text-sm text-gray-600">
              Se cancelará el contrato de <strong>{cancelando.nombreCompleto}</strong>. El beneficiario
              quedará inactivo y se liberará su entrenador. Esta acción no se puede deshacer desde aquí;
              para reactivar, usa el botón de reactivar en la lista.
            </p>
            <Field label="Motivo" htmlFor="motivo-cancelacion" required help="Queda registrado en la remisión">
              <Textarea
                id="motivo-cancelacion"
                rows={3}
                value={motivoCancelacion}
                onChange={(e) => setMotivoCancelacion(e.target.value)}
                placeholder="Ej: el beneficiario ya no requiere terapia"
                required
              />
            </Field>
          </>
        )}
      </Modal>

      {/* Asignar entrenador */}
      <Modal
        open={!!asignando}
        onClose={() => setAsignando(null)}
        title="Asignar entrenador"
        footer={
          <>
            <Button variant="secondary" onClick={() => setAsignando(null)} disabled={guardando}>
              Cancelar
            </Button>
            <Button onClick={() => void confirmarAsignacion()} loading={guardando}>
              Asignar
            </Button>
          </>
        }
      >
        {asignando && (
          <>
            <p className="text-sm text-gray-600">
              Beneficiario EPS: <strong>{asignando.nombreCompleto}</strong>. Cada entrenador atiende un
              máximo de {CUPO_ENTRENADOR} clientes activos.
            </p>
            <Field label="Entrenador" htmlFor="entrenador-select" required>
              <Select
                id="entrenador-select"
                value={documentoEntrenador}
                onChange={(e) => setDocumentoEntrenador(e.target.value)}
                required
              >
                <option value="">Selecciona un entrenador</option>
                {entrenadores.map((e) => (
                  <option key={e.idUsuarioSistema} value={e.numeroDeDocumento}>
                    {e.nombreCompleto} — {formatearNumero(e.numeroDeDocumento)}
                  </option>
                ))}
              </Select>
            </Field>
            {entrenadores.length === 0 && (
              <p role="note" className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                No hay entrenadores activos registrados. Crea uno en el panel de administración.
              </p>
            )}
          </>
        )}
      </Modal>

      {/* Confirmación de acciones destructivas */}
      <ConfirmDialog
        open={!!accion}
        onClose={() => setAccion(null)}
        onConfirm={() => void confirmarAccion()}
        loading={procesandoAccion}
        title={
          accion?.tipo === 'liberar'
            ? 'Liberar entrenador'
            : accion?.tipo === 'reactivar'
              ? 'Reactivar cliente'
              : 'Inactivar cliente'
        }
        message={
          accion ? (
            <>
              {accion.tipo === 'liberar' && (
                <>
                  Se liberará el entrenador de <strong>{accion.cliente.nombreCompleto}</strong>. El
                  cliente dejará de ver horarios y rutinas de ese entrenador.
                </>
              )}
              {accion.tipo === 'reactivar' && (
                <>
                  <strong>{accion.cliente.nombreCompleto}</strong> volverá a estar activo y podrá
                  ingresar al gimnasio.
                </>
              )}
              {accion.tipo === 'inactivar' && (
                <>
                  <strong>{accion.cliente.nombreCompleto}</strong> quedará inactivo y no podrá
                  ingresar. Podrás reactivarlo después.
                </>
              )}
            </>
          ) : null
        }
        confirmLabel={
          accion?.tipo === 'liberar'
            ? 'Liberar'
            : accion?.tipo === 'reactivar'
              ? 'Reactivar'
              : 'Inactivar'
        }
      />
    </Layout>
  );
}
