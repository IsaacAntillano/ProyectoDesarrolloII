import { useEffect, useMemo, useState } from 'react';
import type { UsuarioSistema } from '../services/usuarioSistemaService';
import {
  listarUsuarios,
  crearUsuario,
  actualizarUsuario,
  desactivarUsuario,
  reactivarUsuario,
  buscarUsuarioPorDocumento,
} from '../services/usuarioSistemaService';
import {
  listarTarifas,
  actualizarTarifa,
  listarEquipos,
  listarEquiposMantenimientoProximo,
  crearEquipo,
  consultarFlujoCaja,
  type Tarifa,
  type Equipo,
  type EquipoDTO,
  type FlujoCaja,
} from '../services/adminService';
import Layout from '../components/Layout';
import DocumentTypeBar from '../components/DocumentTypeBar';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Button from '../components/ui/Button';
import StatusBadge from '../components/ui/StatusBadge';
import EmptyState from '../components/ui/EmptyState';
import HelpTip from '../components/ui/HelpTip';
import { Field, Input, Select, Textarea } from '../components/ui/Field';
import {
  etiqueta,
  ETIQUETA_TIPO_CLIENTE,
  ETIQUETA_ESTADO_EQUIPO,
} from '../constants/labels';
import { formatearFecha, formatearMoneda } from '../utils/format';
import { cupoDisponible, mensajeCupo, ROL_LIMITS } from '../constants/rolLimits';
import { isServerUnreachable, getApiErrorMessage, SERVER_UNREACHABLE_MESSAGE } from '../utils/apiError';
import toast from 'react-hot-toast';
import { FiEdit2, FiTrash2, FiPlus, FiList, FiSearch, FiRefreshCw } from 'react-icons/fi';

export default function AdminDashboard() {
  const [usuarios, setUsuarios] = useState<UsuarioSistema[]>([]);
  const [loading, setLoading] = useState(true);
  const [modo, setModo] = useState<'list' | 'create' | 'edit'>('list');
  const [currentUser, setCurrentUser] = useState<UsuarioSistema | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [formData, setFormData] = useState({
    tipoDeDocumento: 'CC',
    numeroDeDocumento: 0,
    nombreCompleto: '',
    telefono: 0,
    correoElectronico: '',
    rol: 'SECRETARIA' as UsuarioSistema['rol'],
    contrasena: '',
  });

  const [section, setSection] = useState<'usuarios' | 'recursos'>('usuarios');
  const [resourceTab, setResourceTab] = useState<'tarifas' | 'equipos' | 'flujoCaja'>('tarifas');
  const [alternando, setAlternando] = useState<UsuarioSistema | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [procesandoInactivar, setProcesandoInactivar] = useState(false);
  const [tarifas, setTarifas] = useState<Tarifa[]>([]);
  const [tarifaEdits, setTarifaEdits] = useState<Record<Tarifa['tipoDeCliente'], { valorMensual: number; valorDiario: number; valorPlus: number }>>({
    PARTICULAR_MENSUAL: { valorMensual: 0, valorDiario: 0, valorPlus: 0 },
    PARTICULAR_DIARIO: { valorMensual: 0, valorDiario: 0, valorPlus: 0 },
    BENEFICIARIO_EPS: { valorMensual: 0, valorDiario: 0, valorPlus: 0 },
  });
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [equiposProximo, setEquiposProximo] = useState<Equipo[]>([]);
  const [equipoForm, setEquipoForm] = useState<Partial<EquipoDTO>>({
    nombre: '',
    descripcion: '',
    fechaAdquisicion: '',
    estadoEquipo: 'OPERATIVO',
    proximoMantenimiento: '',
  });
  const [flujoFecha, setFlujoFecha] = useState(() => {
    const f = new Date();
    const mm = String(f.getMonth() + 1).padStart(2, '0');
    const dd = String(f.getDate()).padStart(2, '0');
    return `${f.getFullYear()}-${mm}-${dd}`;
  });
  const [flujoCaja, setFlujoCaja] = useState<FlujoCaja | null>(null);
  const [consultando, setConsultando] = useState(false);
  const [errorFlujo, setErrorFlujo] = useState<string | null>(null);

  const currentAdminId = (() => {
    const userString = localStorage.getItem('user');
    if (!userString) return 0;
    try {
      const parsed = JSON.parse(userString);
      return parsed?.id ?? 0;
    } catch {
      return 0;
    }
  })();

  const cargarUsuarios = async () => {
    setLoading(true);
    try {
      const data = await listarUsuarios();
      setUsuarios(data);
    } catch (err) {
      toast.error(
        isServerUnreachable(err) ? SERVER_UNREACHABLE_MESSAGE : 'Error al cargar usuarios'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarUsuarios();
  }, []);

  const cargarTarifas = async () => {
    try {
      const data = await listarTarifas();
      setTarifas(data);
      const edits: Record<Tarifa['tipoDeCliente'], { valorMensual: number; valorDiario: number; valorPlus: number }> = {
        PARTICULAR_MENSUAL: { valorMensual: 0, valorDiario: 0, valorPlus: 0 },
        PARTICULAR_DIARIO: { valorMensual: 0, valorDiario: 0, valorPlus: 0 },
        BENEFICIARIO_EPS: { valorMensual: 0, valorDiario: 0, valorPlus: 0 },
      };
      data.forEach((tarifa) => {
        edits[tarifa.tipoDeCliente] = {
          valorMensual: tarifa.valorMensual,
          valorDiario: tarifa.valorDiario,
          valorPlus: tarifa.valorPlus,
        };
      });
      setTarifaEdits(edits);
    } catch (err) {
      toast.error(isServerUnreachable(err) ? SERVER_UNREACHABLE_MESSAGE : 'Error al cargar tarifas');
    }
  };

  const cargarEquipos = async () => {
    try {
      const datos = await listarEquipos();
      setEquipos(datos);
    } catch (err) {
      toast.error(isServerUnreachable(err) ? SERVER_UNREACHABLE_MESSAGE : 'Error al cargar equipos');
    }
  };

  const cargarEquiposProximoMantenimiento = async () => {
    try {
      const datos = await listarEquiposMantenimientoProximo();
      setEquiposProximo(datos);
    } catch (err) {
      toast.error(isServerUnreachable(err) ? SERVER_UNREACHABLE_MESSAGE : 'Error al cargar equipos para mantenimiento');
    }
  };

  const cargarFlujoCaja = async (fecha: string) => {
    setConsultando(true);
    setErrorFlujo(null);
    try {
      const datos = await consultarFlujoCaja(fecha);
      setFlujoCaja(datos);
    } catch (err) {
      setFlujoCaja(null);
      setErrorFlujo(
        isServerUnreachable(err)
          ? SERVER_UNREACHABLE_MESSAGE
          : getApiErrorMessage(err, 'No hay flujo de caja para esa fecha. Genéralo desde Gastos Operativos.')
      );
    } finally {
      setConsultando(false);
    }
  };

  useEffect(() => {
    if (section !== 'recursos') return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarTarifas();
    cargarEquipos();
    cargarEquiposProximoMantenimiento();
  }, [section]);

  useEffect(() => {
    if (section !== 'recursos') return;
    if (resourceTab === 'tarifas') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      cargarTarifas();
    }
    if (resourceTab === 'equipos') {
      cargarEquipos();
      cargarEquiposProximoMantenimiento();
    }
    if (resourceTab === 'flujoCaja') {
      setFlujoCaja(null);
    }
  }, [section, resourceTab]);

  const conteoPorRol = useMemo(() => {
    const adminTotal = usuarios.filter((u) => u.rol === 'ADMINISTRADOR').length;
    const secActivas = usuarios.filter((u) => u.rol === 'SECRETARIA' && u.estado).length;
    const entActivos = usuarios.filter((u) => u.rol === 'ENTRENADOR' && u.estado).length;
    return { adminTotal, secActivas, entActivos };
  }, [usuarios]);

  const rolesDisponibles = useMemo(() => {
    const roles: UsuarioSistema['rol'][] = ['ADMINISTRADOR', 'SECRETARIA', 'ENTRENADOR'];
    if (modo === 'edit' && currentUser) {
      return roles;
    }
    return roles.filter((r) => cupoDisponible(r, usuarios));
  }, [usuarios, modo, currentUser]);

  const usuariosFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return usuarios;
    return usuarios.filter(
      (u) =>
        u.nombreCompleto.toLowerCase().includes(q) ||
        String(u.numeroDeDocumento).includes(q) ||
        u.tipoDeDocumento.toLowerCase().includes(q) ||
        u.rol.toLowerCase().includes(q)
    );
  }, [usuarios, busqueda]);

  const handleBuscarDocumento = async () => {
    const doc = parseInt(busqueda, 10);
    if (!doc || Number.isNaN(doc)) {
      toast.error('Ingresa un número de documento válido para buscar');
      return;
    }
    try {
      const encontrado = await buscarUsuarioPorDocumento(doc);
      setUsuarios((prev) =>
        prev.some((u) => u.idUsuarioSistema === encontrado.idUsuarioSistema)
          ? prev
          : [...prev, encontrado]
      );
      setBusqueda(String(doc));
      toast.success(`Usuario encontrado: ${encontrado.nombreCompleto}`);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Usuario no encontrado'));
    }
  };

  const handleActualizarTarifa = async (tipo: Tarifa['tipoDeCliente']) => {
    setGuardando(true);
    try {
      const tarifa = tarifaEdits[tipo];
      await actualizarTarifa(tipo, {
        tipoDeCliente: tipo,
        valorMensual: tarifa.valorMensual,
        valorDiario: tarifa.valorDiario,
        valorPlus: tarifa.valorPlus,
        idAdminModificador: currentAdminId,
      });
      toast.success('Tarifa actualizada correctamente');
      cargarTarifas();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Error al actualizar tarifa'));
    } finally {
      setGuardando(false);
    }
  };

  const handleCrearEquipo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!equipoForm.nombre || !equipoForm.fechaAdquisicion || !equipoForm.proximoMantenimiento) {
      toast.error('Completa los campos obligatorios del equipo');
      return;
    }
    setGuardando(true);
    try {
      const nuevo = await crearEquipo(equipoForm as EquipoDTO);
      setEquipos((prev) => [...prev, nuevo]);
      toast.success('Equipo registrado correctamente');
      setEquipoForm({
        nombre: '',
        descripcion: '',
        fechaAdquisicion: '',
        estadoEquipo: 'OPERATIVO',
        proximoMantenimiento: '',
      });
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Error al crear equipo'));
    } finally {
      setGuardando(false);
    }
  };

  const handleConsultarFlujoCaja = async () => {
    await cargarFlujoCaja(flujoFecha);
  };

  /** Etiquetas de las pestañas de recursos con estado activo visible. */
  const pestañasRecursos = [
    { value: 'tarifas', label: 'Tarifas' },
    { value: 'equipos', label: 'Equipos' },
    { value: 'flujoCaja', label: 'Flujo de caja' },
  ] as const;

  const toneEquipo: Record<string, 'green' | 'amber' | 'red'> = {
    OPERATIVO: 'green',
    EN_MANTENIMIENTO: 'amber',
    DADO_DE_BAJA: 'red',
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cupoDisponible(formData.rol, usuarios)) {
      toast.error(mensajeCupo(formData.rol));
      return;
    }
    setGuardando(true);
    try {
      await crearUsuario({
        ...formData,
        contrasena: formData.contrasena,
      });
      toast.success('Usuario creado exitosamente');
      setModo('list');
      cargarUsuarios();
      resetForm();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Error al crear usuario'));
    } finally {
      setGuardando(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setGuardando(true);
    try {
      await actualizarUsuario(currentUser.idUsuarioSistema, {
        tipoDeDocumento: formData.tipoDeDocumento,
        numeroDeDocumento: formData.numeroDeDocumento,
        nombreCompleto: formData.nombreCompleto,
        telefono: formData.telefono,
        correoElectronico: formData.correoElectronico,
        rol: formData.rol,
        contrasena: formData.contrasena || undefined,
      });
      toast.success('Usuario actualizado exitosamente');
      setModo('list');
      cargarUsuarios();
      setCurrentUser(null);
      resetForm();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Error al actualizar usuario'));
    } finally {
      setGuardando(false);
    }
  };

  const alternarEstado = async () => {
    if (!alternando) return;
    setProcesandoInactivar(true);
    try {
      if (alternando.estado) {
        await desactivarUsuario(alternando.idUsuarioSistema);
        toast.success(`${alternando.nombreCompleto} inactivado`);
      } else {
        await reactivarUsuario(alternando.idUsuarioSistema);
        toast.success(`${alternando.nombreCompleto} reactivado`);
      }
      setAlternando(null);
      cargarUsuarios();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'No se pudo cambiar el estado del usuario'));
    } finally {
      setProcesandoInactivar(false);
    }
  };

  const editUser = (user: UsuarioSistema) => {
    setCurrentUser(user);
    setFormData({
      tipoDeDocumento: user.tipoDeDocumento,
      numeroDeDocumento: user.numeroDeDocumento,
      nombreCompleto: user.nombreCompleto,
      telefono: user.telefono,
      correoElectronico: user.correoElectronico,
      rol: user.rol,
      contrasena: '',
    });
    setModo('edit');
  };

  const resetForm = () => {
    const rolDefault = rolesDisponibles[0] ?? 'SECRETARIA';
    setFormData({
      tipoDeDocumento: 'CC',
      numeroDeDocumento: 0,
      nombreCompleto: '',
      telefono: 0,
      correoElectronico: '',
      rol: rolDefault,
      contrasena: '',
    });
  };

  if (loading && usuarios.length === 0) {
    return (
      <Layout title="Cargando...">
        <div className="flex items-center justify-center h-full text-gray-500">Cargando...</div>
      </Layout>
    );
  }

  return (
    <Layout title="Panel de Administrador" description="Usuarios del sistema, tarifas, equipos y flujo de caja">
      <ConfirmDialog
        open={!!alternando}
        onClose={() => setAlternando(null)}
        onConfirm={() => void alternarEstado()}
        loading={procesandoInactivar}
        title={alternando?.estado ? 'Inactivar usuario' : 'Reactivar usuario'}
        confirmLabel={alternando?.estado ? 'Inactivar' : 'Reactivar'}
        message={
          alternando ? (
            alternando.estado ? (
              <>
                <strong>{alternando.nombreCompleto}</strong> dejará de poder ingresar al sistema.
                Podrás reactivarlo después desde esta misma lista.
              </>
            ) : (
              <>
                <strong>{alternando.nombreCompleto}</strong> volverá a poder ingresar al sistema.
              </>
            )
          ) : null
        }
      />

      <div className="mb-4 rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
        <strong>Cupos:</strong> Administrador {conteoPorRol.adminTotal}/{ROL_LIMITS.ADMINISTRADOR}
        {' · '}Secretarias activas {conteoPorRol.secActivas}/{ROL_LIMITS.SECRETARIA}
        {' · '}Entrenadores activos {conteoPorRol.entActivos}/{ROL_LIMITS.ENTRENADOR}
      </div>

      <div className="mb-6 flex flex-wrap gap-3" role="tablist" aria-label="Sección del panel">
        <button
          type="button"
          role="tab"
          aria-selected={section === 'usuarios'}
          onClick={() => setSection('usuarios')}
          className={`rounded-md px-4 py-2 shadow-sm transition [&:focus-visible]:outline-none [&:focus-visible]:ring-2 [&:focus-visible]:ring-blue-500 ${
            section === 'usuarios'
              ? 'bg-blue-600 text-white'
              : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          Usuarios del sistema
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={section === 'recursos'}
          onClick={() => setSection('recursos')}
          className={`rounded-md px-4 py-2 shadow-sm transition [&:focus-visible]:outline-none [&:focus-visible]:ring-2 [&:focus-visible]:ring-blue-500 ${
            section === 'recursos'
              ? 'bg-blue-600 text-white'
              : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          Gestión de recursos
        </button>
      </div>

      {section === 'usuarios' && (
        <>
          <div className="mb-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                setModo('list');
                resetForm();
              }}
              className={`flex items-center space-x-2 px-4 py-2 rounded shadow-sm transition [&:focus-visible]:outline-none [&:focus-visible]:ring-2 [&:focus-visible]:ring-blue-500 ${modo === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50 border'}`}
            >
              <FiList aria-hidden="true" /> <span>Listar Usuarios</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (rolesDisponibles.length === 0) {
                  toast.error('Todos los cupos de usuarios del sistema están completos');
                  return;
                }
                setModo('create');
                resetForm();
              }}
              disabled={rolesDisponibles.length === 0}
              className={`flex items-center space-x-2 px-4 py-2 rounded shadow-sm transition [&:focus-visible]:outline-none [&:focus-visible]:ring-2 [&:focus-visible]:ring-blue-500 ${modo === 'create' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50 border'} disabled:opacity-50`}
            >
              <FiPlus aria-hidden="true" /> <span>Crear Usuario</span>
            </button>
          </div>

          {modo === 'list' && (
            <>
              <div className="mb-4 flex flex-wrap gap-2">
                <div className="relative flex-1 min-w-[200px]">
                  <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true" />
                  <input
                    type="search"
                    placeholder="Buscar por documento, nombre o rol..."
                    aria-label="Buscar por documento, nombre o rol"
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm [&:focus-visible]:outline-none [&:focus-visible]:ring-2 [&:focus-visible]:ring-blue-500"
                  />
                </div>
                <Button variant="secondary" onClick={() => void handleBuscarDocumento()}>
                  <FiSearch aria-hidden="true" /> Buscar por documento
                </Button>
              </div>

              <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <caption className="sr-only">Usuarios del sistema</caption>
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Documento</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Correo</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rol</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {usuariosFiltrados.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                            No hay usuarios que coincidan con la búsqueda
                          </td>
                        </tr>
                      ) : (
                        usuariosFiltrados.map((user) => (
                          <tr key={user.idUsuarioSistema} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {user.tipoDeDocumento} {user.numeroDeDocumento}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">{user.nombreCompleto}</td>
                            <td className="px-6 py-4 text-sm text-gray-500">{user.correoElectronico}</td>
                            <td className="px-6 py-4 text-sm">
                              <StatusBadge tone="blue">{user.rol}</StatusBadge>
                            </td>
                            <td className="px-6 py-4 text-sm">
                              <StatusBadge tone={user.estado ? 'green' : 'red'}>
                                {user.estado ? 'Activo' : 'Inactivo'}
                              </StatusBadge>
                            </td>
                            <td className="px-6 py-4 text-right text-sm font-medium space-x-2">
                              <button
                                type="button"
                                onClick={() => editUser(user)}
                                className="text-blue-600 hover:text-blue-900 inline-flex rounded-md p-1 [&:focus-visible]:outline-none [&:focus-visible]:ring-2 [&:focus-visible]:ring-blue-500"
                                title="Actualizar"
                                aria-label={`Actualizar a ${user.nombreCompleto}`}
                              >
                                <FiEdit2 size={18} aria-hidden="true" />
                              </button>
                              {user.estado ? (
                                <button
                                  type="button"
                                  onClick={() => setAlternando(user)}
                                  disabled={user.rol === 'ADMINISTRADOR'}
                                  className={`inline-flex rounded-md p-1 ${user.rol === 'ADMINISTRADOR' ? 'text-gray-300 cursor-not-allowed' : 'text-red-600 hover:text-red-900 [&:focus-visible]:outline-none [&:focus-visible]:ring-2 [&:focus-visible]:ring-red-500'}`}
                                  title="Inactivar"
                                  aria-label={`Inactivar a ${user.nombreCompleto}`}
                                >
                                  <FiTrash2 size={18} aria-hidden="true" />
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setAlternando(user)}
                                  disabled={guardando}
                                  className="inline-flex rounded-md p-1 text-green-600 hover:text-green-900 disabled:opacity-50 [&:focus-visible]:outline-none [&:focus-visible]:ring-2 [&:focus-visible]:ring-green-500"
                                  title="Reactivar"
                                  aria-label={`Reactivar a ${user.nombreCompleto}`}
                                >
                                  <FiRefreshCw size={18} aria-hidden="true" />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {(modo === 'create' || modo === 'edit') && (
            <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 max-w-3xl">
              <h2 className="text-xl font-bold mb-6 text-gray-800">
                {modo === 'create' ? 'Crear Nuevo Usuario' : 'Actualizar Usuario'}
              </h2>
              <form onSubmit={modo === 'create' ? handleCreate : handleUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Documento</label>
                  <DocumentTypeBar
                    value={formData.tipoDeDocumento}
                    onChange={(v) => setFormData({ ...formData, tipoDeDocumento: v })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Número de Documento</label>
                  <input
                    type="number"
                    value={formData.numeroDeDocumento || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, numeroDeDocumento: parseInt(e.target.value, 10) || 0 })
                    }
                    required
                    disabled={modo === 'edit'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md disabled:bg-gray-100 [&:focus-visible]:outline-none [&:focus-visible]:ring-2 [&:focus-visible]:ring-blue-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                  <input
                    type="text"
                    value={formData.nombreCompleto}
                    onChange={(e) => setFormData({ ...formData, nombreCompleto: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md [&:focus-visible]:outline-none [&:focus-visible]:ring-2 [&:focus-visible]:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                  <input
                    type="number"
                    value={formData.telefono || ''}
                    onChange={(e) => setFormData({ ...formData, telefono: parseInt(e.target.value, 10) || 0 })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md [&:focus-visible]:outline-none [&:focus-visible]:ring-2 [&:focus-visible]:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
                  <input
                    type="email"
                    value={formData.correoElectronico}
                    onChange={(e) => setFormData({ ...formData, correoElectronico: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md [&:focus-visible]:outline-none [&:focus-visible]:ring-2 [&:focus-visible]:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                  <select
                    value={formData.rol}
                    onChange={(e) =>
                      setFormData({ ...formData, rol: e.target.value as UsuarioSistema['rol'] })
                    }
                    disabled={modo === 'edit'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white disabled:bg-gray-100 [&:focus-visible]:outline-none [&:focus-visible]:ring-2 [&:focus-visible]:ring-blue-500"
                  >
                    {(modo === 'edit' ? (['ADMINISTRADOR', 'SECRETARIA', 'ENTRENADOR'] as const) : rolesDisponibles).map(
                      (r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      )
                    )}
                  </select>
                  {modo === 'create' && !cupoDisponible(formData.rol, usuarios) && (
                    <p role="alert" className="text-xs text-red-600 mt-1">{mensajeCupo(formData.rol)}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {modo === 'create' ? 'Contraseña' : 'Nueva contraseña (opcional)'}
                  </label>
                  <input
                    type="password"
                    value={formData.contrasena}
                    onChange={(e) => setFormData({ ...formData, contrasena: e.target.value })}
                    required={modo === 'create'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md [&:focus-visible]:outline-none [&:focus-visible]:ring-2 [&:focus-visible]:ring-blue-500"
                  />
                </div>

                <div className="md:col-span-2 flex justify-end space-x-3 mt-4">
                  <button
                    type="button"
                    onClick={() => setModo('list')}
                    disabled={guardando}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={guardando}
                    aria-busy={guardando || undefined}
                    className="px-4 py-2 rounded-md text-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                  >
                    {guardando ? 'Guardando...' : modo === 'create' ? 'Crear Usuario' : 'Guardar Cambios'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </>
      )}

      {section === 'recursos' && (
        <>
          <div className="mb-6 flex flex-wrap gap-3" role="tablist" aria-label="Recursos">
            {pestañasRecursos.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={resourceTab === value}
                onClick={() => setResourceTab(value)}
                className={`px-4 py-2 rounded-md shadow-sm transition [&:focus-visible]:outline-none [&:focus-visible]:ring-2 [&:focus-visible]:ring-blue-500 ${
                  resourceTab === value
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {resourceTab === 'tarifas' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <h2 className="text-xl font-semibold mb-4">Gestión de Tarifas</h2>
                <p className="text-sm text-gray-600 mb-4">
                  Ajusta los valores vigentes para clientes mensuales, diarios y beneficiarios EPS.
                  Los pagos validan contra estos valores.
                </p>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <caption className="sr-only">Tarifas vigentes por tipo de cliente</caption>
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Tipo de cliente</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Valor mensual</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Valor diario</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Valor plus</th>
                        <th scope="col" className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {tarifas.map((tarifa) => (
                        <tr key={tarifa.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                            {etiqueta(ETIQUETA_TIPO_CLIENTE, tarifa.tipoDeCliente)}
                          </td>
                          <td className="px-4 py-3">
                            <label className="sr-only" htmlFor={`tarifa-mensual-${tarifa.id}`}>
                              Valor mensual — {etiqueta(ETIQUETA_TIPO_CLIENTE, tarifa.tipoDeCliente)}
                            </label>
                            <Input
                              id={`tarifa-mensual-${tarifa.id}`}
                              type="number"
                              min={0}
                              step="0.01"
                              inputMode="decimal"
                              value={tarifaEdits[tarifa.tipoDeCliente]?.valorMensual ?? 0}
                              onChange={(e) =>
                                setTarifaEdits({
                                  ...tarifaEdits,
                                  [tarifa.tipoDeCliente]: {
                                    ...tarifaEdits[tarifa.tipoDeCliente],
                                    valorMensual: parseFloat(e.target.value) || 0,
                                  },
                                })
                              }
                            />
                          </td>
                          <td className="px-4 py-3">
                            <label className="sr-only" htmlFor={`tarifa-diario-${tarifa.id}`}>
                              Valor diario — {etiqueta(ETIQUETA_TIPO_CLIENTE, tarifa.tipoDeCliente)}
                            </label>
                            <Input
                              id={`tarifa-diario-${tarifa.id}`}
                              type="number"
                              min={0}
                              step="0.01"
                              inputMode="decimal"
                              value={tarifaEdits[tarifa.tipoDeCliente]?.valorDiario ?? 0}
                              onChange={(e) =>
                                setTarifaEdits({
                                  ...tarifaEdits,
                                  [tarifa.tipoDeCliente]: {
                                    ...tarifaEdits[tarifa.tipoDeCliente],
                                    valorDiario: parseFloat(e.target.value) || 0,
                                  },
                                })
                              }
                            />
                          </td>
                          <td className="px-4 py-3">
                            <label className="sr-only" htmlFor={`tarifa-plus-${tarifa.id}`}>
                              Valor plus — {etiqueta(ETIQUETA_TIPO_CLIENTE, tarifa.tipoDeCliente)}
                            </label>
                            <Input
                              id={`tarifa-plus-${tarifa.id}`}
                              type="number"
                              min={0}
                              step="0.01"
                              inputMode="decimal"
                              value={tarifaEdits[tarifa.tipoDeCliente]?.valorPlus ?? 0}
                              onChange={(e) =>
                                setTarifaEdits({
                                  ...tarifaEdits,
                                  [tarifa.tipoDeCliente]: {
                                    ...tarifaEdits[tarifa.tipoDeCliente],
                                    valorPlus: parseFloat(e.target.value) || 0,
                                  },
                                })
                              }
                            />
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button size="sm" onClick={() => void handleActualizarTarifa(tarifa.tipoDeCliente)} disabled={guardando}>
                              Guardar
                            </Button>
                          </td>
                        </tr>
                      ))}
                      {tarifas.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                            No hay tarifas cargadas.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {resourceTab === 'equipos' && (
            <div className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                  <h2 className="text-xl font-semibold mb-4">Registrar nuevo equipo</h2>
                  <form onSubmit={handleCrearEquipo} className="space-y-4">
                    <Field label="Nombre" htmlFor="equipo-nombre" required>
                      <Input
                        id="equipo-nombre"
                        type="text"
                        value={equipoForm.nombre || ''}
                        onChange={(e) => setEquipoForm({ ...equipoForm, nombre: e.target.value })}
                        required
                      />
                    </Field>
                    <Field label="Descripción" htmlFor="equipo-desc">
                      <Textarea
                        id="equipo-desc"
                        value={equipoForm.descripcion || ''}
                        onChange={(e) => setEquipoForm({ ...equipoForm, descripcion: e.target.value })}
                        rows={2}
                      />
                    </Field>
                    <Field label="Fecha de adquisición" htmlFor="equipo-adq" required>
                      <Input
                        id="equipo-adq"
                        type="date"
                        value={equipoForm.fechaAdquisicion || ''}
                        onChange={(e) => setEquipoForm({ ...equipoForm, fechaAdquisicion: e.target.value })}
                        required
                      />
                    </Field>
                    <Field label="Estado" htmlFor="equipo-estado" required>
                      <Select
                        id="equipo-estado"
                        value={equipoForm.estadoEquipo || 'OPERATIVO'}
                        onChange={(e) => setEquipoForm({ ...equipoForm, estadoEquipo: e.target.value as Equipo['estadoEquipo'] })}
                        required
                      >
                        <option value="OPERATIVO">Operativo</option>
                        <option value="EN_MANTENIMIENTO">En mantenimiento</option>
                        <option value="DADO_DE_BAJA">Dado de baja</option>
                      </Select>
                    </Field>
                    <Field label="Próximo mantenimiento" htmlFor="equipo-mant" required help="Fecha programada del siguiente mantenimiento">
                      <Input
                        id="equipo-mant"
                        type="date"
                        value={equipoForm.proximoMantenimiento || ''}
                        onChange={(e) => setEquipoForm({ ...equipoForm, proximoMantenimiento: e.target.value })}
                        required
                      />
                    </Field>
                    <div className="flex justify-end">
                      <Button type="submit" loading={guardando}>
                        Crear equipo
                      </Button>
                    </div>
                  </form>
                </div>

                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                  <h2 className="text-xl font-semibold mb-4">Inventario de equipos</h2>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                      <caption className="sr-only">Inventario de equipos</caption>
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Nombre</th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Estado</th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Próximo mantenimiento</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {equipos.map((equipo) => (
                          <tr key={equipo.idEquipo} className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium">{equipo.nombre}</td>
                            <td className="px-4 py-3">
                              <StatusBadge tone={toneEquipo[equipo.estadoEquipo] ?? 'gray'}>
                                {etiqueta(ETIQUETA_ESTADO_EQUIPO, equipo.estadoEquipo)}
                              </StatusBadge>
                            </td>
                            <td className="px-4 py-3">{formatearFecha(equipo.proximoMantenimiento)}</td>
                          </tr>
                        ))}
                        {equipos.length === 0 && (
                          <tr>
                            <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                              No hay equipos registrados todavía.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <h3 className="text-lg font-semibold mb-3">Equipos con mantenimiento próximo</h3>
                {equiposProximo.length === 0 ? (
                  <EmptyState
                    title="Nada próximo por mantener"
                    message="No hay equipos con mantenimiento programado en los próximos 5 días."
                  />
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {equiposProximo.map((equipo) => (
                      <div key={equipo.idEquipo} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="font-semibold">{equipo.nombre}</p>
                        <p className="text-sm text-gray-600">Próximo mantenimiento: {formatearFecha(equipo.proximoMantenimiento)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {resourceTab === 'flujoCaja' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <h2 className="text-xl font-semibold mb-4">Consulta de flujo de caja</h2>
                <HelpTip title="¿Qué muestra el flujo de caja?">
                  <p>
                    Los ingresos del día (mensualidades, diario, copagos y Plus) menos los gastos
                    operativos (nómina, arriendo, mantenimiento). Si no existe aún para esa fecha,
                    genéralo desde Gastos Operativos.
                  </p>
                </HelpTip>
                <div className="mt-3 grid gap-4 md:grid-cols-3 items-end">
                  <Field label="Fecha" htmlFor="flujo-fecha">
                    <Input
                      id="flujo-fecha"
                      type="date"
                      value={flujoFecha}
                      onChange={(e) => setFlujoFecha(e.target.value)}
                    />
                  </Field>
                  <div className="md:col-span-2 flex gap-3">
                    <Button onClick={() => void handleConsultarFlujoCaja()} loading={consultando}>
                      Consultar flujo
                    </Button>
                  </div>
                </div>
                {errorFlujo && (
                  <p role="alert" className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                    {errorFlujo}
                  </p>
                )}
              </div>

              {flujoCaja && (
                <dl className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm grid gap-4 md:grid-cols-2">
                  <div className="space-y-1">
                    <dt className="text-sm text-gray-500">Fecha</dt>
                    <dd className="text-lg font-semibold">{formatearFecha(flujoCaja.fecha)}</dd>
                  </div>
                  <div className="space-y-1">
                    <dt className="text-sm text-gray-500">Ingreso mensual</dt>
                    <dd className="text-lg font-semibold">{formatearMoneda(flujoCaja.totalIngresoParticular)}</dd>
                  </div>
                  <div className="space-y-1">
                    <dt className="text-sm text-gray-500">Ingreso diario</dt>
                    <dd className="text-lg font-semibold">{formatearMoneda(flujoCaja.totalIngresoParticularDiario)}</dd>
                  </div>
                  <div className="space-y-1">
                    <dt className="text-sm text-gray-500">Copago EPS</dt>
                    <dd className="text-lg font-semibold">{formatearMoneda(flujoCaja.totalIngresoCopagoEps)}</dd>
                  </div>
                  <div className="space-y-1">
                    <dt className="text-sm text-gray-500">Ingreso Plus</dt>
                    <dd className="text-lg font-semibold">{formatearMoneda(flujoCaja.totalIngresoPlus)}</dd>
                  </div>
                  <div className="space-y-1">
                    <dt className="text-sm text-gray-500">Egresos de mantenimiento</dt>
                    <dd className="text-lg font-semibold">{formatearMoneda(flujoCaja.totalEgresosMantenimiento)}</dd>
                  </div>
                  <div className="space-y-1">
                    <dt className="text-sm text-gray-500">Egresos de nómina</dt>
                    <dd className="text-lg font-semibold">{formatearMoneda(flujoCaja.totalEgresosNomina)}</dd>
                  </div>
                  <div className="space-y-1">
                    <dt className="text-sm text-gray-500">Egresos de arriendo</dt>
                    <dd className="text-lg font-semibold">{formatearMoneda(flujoCaja.totalEgresosArriendo)}</dd>
                  </div>
                  <div className="space-y-1">
                    <dt className="text-sm text-gray-500">Utilidad neta</dt>
                    <dd className={`text-lg font-semibold ${flujoCaja.utilidadNeta >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                      {formatearMoneda(flujoCaja.utilidadNeta)}
                    </dd>
                  </div>
                </dl>
              )}
            </div>
          )}
        </>
      )}
    </Layout>
  );
}
