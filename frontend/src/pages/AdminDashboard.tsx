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
  const [flujoFecha, setFlujoFecha] = useState(() => new Date().toISOString().slice(0, 10));
  const [flujoCaja, setFlujoCaja] = useState<FlujoCaja | null>(null);

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
    try {
      const datos = await consultarFlujoCaja(fecha);
      setFlujoCaja(datos);
    } catch (err) {
      toast.error(isServerUnreachable(err) ? SERVER_UNREACHABLE_MESSAGE : getApiErrorMessage(err, 'No hay flujo de caja para esa fecha'));
      setFlujoCaja(null);
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
    }
  };

  const handleCrearEquipo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!equipoForm.nombre || !equipoForm.fechaAdquisicion || !equipoForm.proximoMantenimiento) {
      toast.error('Completa los campos obligatorios del equipo');
      return;
    }
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
    }
  };

  const handleConsultarFlujoCaja = async () => {
    await cargarFlujoCaja(flujoFecha);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cupoDisponible(formData.rol, usuarios)) {
      toast.error(mensajeCupo(formData.rol));
      return;
    }
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
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
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
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Estás seguro de inactivar este usuario?')) return;
    try {
      await desactivarUsuario(id);
      toast.success('Usuario inactivado');
      cargarUsuarios();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Error al inactivar usuario'));
    }
  };

  const handleReactivar = async (id: number) => {
    try {
      await reactivarUsuario(id);
      toast.success('Usuario reactivado');
      cargarUsuarios();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Error al reactivar usuario'));
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
    <Layout title="Panel de Administrador">
      <div className="mb-4 p-4 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-900">
        <strong>Cupos:</strong> Administrador {conteoPorRol.adminTotal}/{ROL_LIMITS.ADMINISTRADOR}
        {' · '}Secretarias activas {conteoPorRol.secActivas}/{ROL_LIMITS.SECRETARIA}
        {' · '}Entrenadores activos {conteoPorRol.entActivos}/{ROL_LIMITS.ENTRENADOR}
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setSection('usuarios')}
          className={`px-4 py-2 rounded-md shadow-sm transition ${
            section === 'usuarios' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          Usuarios del sistema
        </button>
        <button
          type="button"
          onClick={() => setSection('recursos')}
          className={`px-4 py-2 rounded-md shadow-sm transition ${
            section === 'recursos' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          Gestión de recursos
        </button>
      </div>

      {section === 'usuarios' && (
        <>
          <div className="mb-6 flex flex-wrap gap-3">
            <button
          onClick={() => {
            setModo('list');
            resetForm();
          }}
          className={`flex items-center space-x-2 px-4 py-2 rounded shadow-sm transition ${modo === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50 border'}`}
        >
          <FiList /> <span>Listar Usuarios</span>
        </button>
        <button
          onClick={() => {
            if (rolesDisponibles.length === 0) {
              toast.error('Todos los cupos de usuarios del sistema están completos');
              return;
            }
            setModo('create');
            resetForm();
          }}
          disabled={rolesDisponibles.length === 0}
          className={`flex items-center space-x-2 px-4 py-2 rounded shadow-sm transition ${modo === 'create' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50 border'} disabled:opacity-50`}
        >
          <FiPlus /> <span>Crear Usuario</span>
        </button>
      </div>

      {modo === 'list' && (
        <>
          <div className="mb-4 flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <FiSearch className="absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por documento, nombre o rol..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              type="button"
              onClick={handleBuscarDocumento}
              className="px-4 py-2 bg-slate-800 text-white rounded-md hover:bg-slate-700 text-sm font-medium"
            >
              Buscar por documento
            </button>
          </div>

          <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Documento</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Correo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rol</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
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
                          <span className="px-2 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            {user.rol}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {user.estado ? (
                            <span className="px-2 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                              Activo
                            </span>
                          ) : (
                            <span className="px-2 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                              Inactivo
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-medium space-x-2">
                          <button
                            onClick={() => editUser(user)}
                            className="text-blue-600 hover:text-blue-900 inline-flex"
                            title="Actualizar"
                          >
                            <FiEdit2 size={18} />
                          </button>
                          {user.estado ? (
                            <button
                              onClick={() => handleDelete(user.idUsuarioSistema)}
                              disabled={user.rol === 'ADMINISTRADOR'}
                              className={`inline-flex ${user.rol === 'ADMINISTRADOR' ? 'text-gray-300 cursor-not-allowed' : 'text-red-600 hover:text-red-900'}`}
                              title="Inactivar"
                            >
                              <FiTrash2 size={18} />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleReactivar(user.idUsuarioSistema)}
                              className="text-green-600 hover:text-green-900 inline-flex"
                              title="Reactivar"
                            >
                              <FiRefreshCw size={18} />
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md disabled:bg-gray-100"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
              <input
                type="text"
                value={formData.nombreCompleto}
                onChange={(e) => setFormData({ ...formData, nombreCompleto: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
              <input
                type="number"
                value={formData.telefono || ''}
                onChange={(e) => setFormData({ ...formData, telefono: parseInt(e.target.value, 10) || 0 })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
              <input
                type="email"
                value={formData.correoElectronico}
                onChange={(e) => setFormData({ ...formData, correoElectronico: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white disabled:bg-gray-100"
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
                <p className="text-xs text-red-600 mt-1">{mensajeCupo(formData.rol)}</p>
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div className="md:col-span-2 flex justify-end space-x-3 mt-4">
              <button
                type="button"
                onClick={() => setModo('list')}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button type="submit" className="px-4 py-2 rounded-md text-sm text-white bg-blue-600 hover:bg-blue-700">
                {modo === 'create' ? 'Crear Usuario' : 'Guardar Cambios'}
              </button>
            </div>
          </form>
        </div>
      )}
      </>
      )}

      {section === 'recursos' && (
        <>
          <div className="mb-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setResourceTab('tarifas')}
              className={`px-4 py-2 rounded-md shadow-sm transition ${
                resourceTab === 'tarifas' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              Tarifas
            </button>
            <button
              type="button"
              onClick={() => setResourceTab('equipos')}
              className={`px-4 py-2 rounded-md shadow-sm transition ${
                resourceTab === 'equipos' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              Equipos
            </button>
            <button
              type="button"
              onClick={() => setResourceTab('flujoCaja')}
              className={`px-4 py-2 rounded-md shadow-sm transition ${
                resourceTab === 'flujoCaja' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              Flujo de caja
            </button>
          </div>

          {resourceTab === 'tarifas' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <h2 className="text-xl font-semibold mb-4">Gestión de Tarifas</h2>
                <p className="text-sm text-gray-600 mb-4">
                  Ajusta los valores vigentes para clientes mensuales, diarios y beneficiarios EPS.
                </p>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Tipo de cliente</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Valor mensual</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Valor diario</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Valor plus</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {tarifas.map((tarifa) => (
                        <tr key={tarifa.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                            {tarifa.tipoDeCliente.replaceAll('_', ' ')}
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              min={0}
                              step="0.01"
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
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              min={0}
                              step="0.01"
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
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              min={0}
                              step="0.01"
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
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleActualizarTarifa(tarifa.tipoDeCliente)}
                              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
                            >
                              Guardar
                            </button>
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
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                      <input
                        type="text"
                        value={equipoForm.nombre || ''}
                        onChange={(e) => setEquipoForm({ ...equipoForm, nombre: e.target.value })}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                      <textarea
                        value={equipoForm.descripcion || ''}
                        onChange={(e) => setEquipoForm({ ...equipoForm, descripcion: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de adquisición</label>
                      <input
                        type="date"
                        value={equipoForm.fechaAdquisicion || ''}
                        onChange={(e) => setEquipoForm({ ...equipoForm, fechaAdquisicion: e.target.value })}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                      <select
                        value={equipoForm.estadoEquipo || 'OPERATIVO'}
                        onChange={(e) => setEquipoForm({ ...equipoForm, estadoEquipo: e.target.value as Equipo['estadoEquipo'] })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white"
                      >
                        <option value="OPERATIVO">Operativo</option>
                        <option value="EN_MANTENIMIENTO">En mantenimiento</option>
                        <option value="DADO_DE_BAJA">Dado de baja</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Próximo mantenimiento</label>
                      <input
                        type="date"
                        value={equipoForm.proximoMantenimiento || ''}
                        onChange={(e) => setEquipoForm({ ...equipoForm, proximoMantenimiento: e.target.value })}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div className="flex justify-end">
                      <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                        Crear equipo
                      </button>
                    </div>
                  </form>
                </div>

                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                  <h2 className="text-xl font-semibold mb-4">Inventario de equipos</h2>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Nombre</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Estado</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Mantenimiento</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {equipos.map((equipo) => (
                          <tr key={equipo.idEquipo} className="hover:bg-gray-50">
                            <td className="px-4 py-3">{equipo.nombre}</td>
                            <td className="px-4 py-3">{equipo.estadoEquipo.replaceAll('_', ' ')}</td>
                            <td className="px-4 py-3">{equipo.proximoMantenimiento}</td>
                          </tr>
                        ))}
                        {equipos.length === 0 && (
                          <tr>
                            <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                              No hay equipos registrados.
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
                  <p className="text-gray-600">No hay equipos con mantenimiento programado en los próximos 5 días.</p>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {equiposProximo.map((equipo) => (
                      <div key={equipo.idEquipo} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="font-semibold">{equipo.nombre}</p>
                        <p className="text-sm text-gray-600">Próximo mantenimiento: {equipo.proximoMantenimiento}</p>
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
                <div className="grid gap-4 md:grid-cols-3 items-end">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                    <input
                      type="date"
                      value={flujoFecha}
                      onChange={(e) => setFlujoFecha(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div className="md:col-span-2 flex gap-3">
                    <button
                      type="button"
                      onClick={handleConsultarFlujoCaja}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Consultar flujo
                    </button>
                  </div>
                </div>
              </div>

              {flujoCaja && (
                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm grid gap-4 md:grid-cols-2">
                  <div className="space-y-3">
                    <p className="text-sm text-gray-500">Fecha</p>
                    <p className="text-lg font-semibold">{flujoCaja.fecha}</p>
                  </div>
                  <div className="space-y-3">
                    <p className="text-sm text-gray-500">Ingreso mensual</p>
                    <p className="text-lg font-semibold">${flujoCaja.totalIngresoParticular.toFixed(2)}</p>
                  </div>
                  <div className="space-y-3">
                    <p className="text-sm text-gray-500">Ingreso diario</p>
                    <p className="text-lg font-semibold">${flujoCaja.totalIngresoParticularDiario.toFixed(2)}</p>
                  </div>
                  <div className="space-y-3">
                    <p className="text-sm text-gray-500">Copago EPS</p>
                    <p className="text-lg font-semibold">${flujoCaja.totalIngresoCopagoEps.toFixed(2)}</p>
                  </div>
                  <div className="space-y-3">
                    <p className="text-sm text-gray-500">Egresos mantenimiento</p>
                    <p className="text-lg font-semibold">${flujoCaja.totalEgresosMantenimiento.toFixed(2)}</p>
                  </div>
                  <div className="space-y-3">
                    <p className="text-sm text-gray-500">Utilidad neta</p>
                    <p className="text-lg font-semibold text-green-700">${flujoCaja.utilidadNeta.toFixed(2)}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </Layout>
  );
}
