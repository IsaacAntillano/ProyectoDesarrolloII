import { useEffect, useState } from 'react';
import {
  listarParticularesMensuales,
  listarParticularesDiarios,
  listarBeneficiariosEps,
  buscarClienteMensual,
  buscarClienteDiario,
  buscarBeneficiarioEps,
  crearClienteMensual,
  crearClienteDiario,
  crearBeneficiarioEps,
  actualizarClienteMensual,
  actualizarClienteDiario,
  actualizarBeneficiarioEps,
  desactivarClienteMensual,
  desactivarClienteDiario,
  reactivarClienteMensual,
  reactivarClienteDiario,
  desactivarBeneficiarioEps,
  reactivarBeneficiarioEps,
  type ParticularMensual,
  type ParticularDiario,
  type BeneficiarioEps,
  type ClienteMensualDTO,
  type ClienteDiarioDTO,
  type BeneficiarioEpsDTO,
} from '../services/clienteService';
import { registrarIngreso } from '../services/secretariaService';
import Layout from '../components/Layout';
import DocumentTypeBar from '../components/DocumentTypeBar';
import { getApiErrorMessage, isServerUnreachable, SERVER_UNREACHABLE_MESSAGE } from '../utils/apiError';
import toast from 'react-hot-toast';
import { FiEdit2, FiTrash2, FiPlus, FiSearch, FiRefreshCw, FiLogIn } from 'react-icons/fi';

type TabType = 'mensual' | 'diario' | 'eps' | 'ingreso';
type ModoType = 'list' | 'create' | 'edit';

export default function SecretariaDashboard() {
  const [tab, setTab] = useState<TabType>('mensual');
  const [modo, setModo] = useState<ModoType>('list');

  // Clientes Mensuales
  const [clientesMensuales, setClientesMensuales] = useState<ParticularMensual[]>([]);
  const [clientesDiarios, setClientesDiarios] = useState<ParticularDiario[]>([]);
  const [beneficiariosEps, setBeneficiariosEps] = useState<BeneficiarioEps[]>([]);

  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [documentoIngreso, setDocumentoIngreso] = useState('');

  const [currentMensual, setCurrentMensual] = useState<ParticularMensual | null>(null);
  const [currentDiario, setCurrentDiario] = useState<ParticularDiario | null>(null);
  const [currentEps, setCurrentEps] = useState<BeneficiarioEps | null>(null);

  const [formMensual, setFormMensual] = useState<Partial<ClienteMensualDTO>>({
    tipoDeDocumento: 'CC',
    numeroDeDocumento: 0,
    nombreCompleto: '',
    fechaDeNacimiento: '',
    telefono: 0,
    correoElectronico: '',
    contrasena: '',
    tipoMembresia: 'MENSUAL',
  });

  const [formDiario, setFormDiario] = useState<Partial<ClienteDiarioDTO>>({
    tipoDeDocumento: 'CC',
    numeroDeDocumento: 0,
    nombreCompleto: '',
    telefono: 0,
  });

  const [formEps, setFormEps] = useState<Partial<BeneficiarioEpsDTO>>({
    tipoDeDocumento: 'CC',
    numeroDeDocumento: 0,
    nombreCompleto: '',
    fechaDeNacimiento: '',
    telefono: 0,
    correoElectronico: '',
    contrasena: '',
    sesionesAutorizadas: 0,
    medicoRemitente: '',
    entidadEps: '',
    diagnostico: '',
    zonaCuerpoTratar: '',
    fechaFin: '',
  });

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [mensuales, diarios, eps] = await Promise.all([
        listarParticularesMensuales(),
        listarParticularesDiarios(),
        listarBeneficiariosEps(),
      ]);
      setClientesMensuales(mensuales);
      setClientesDiarios(diarios);
      setBeneficiariosEps(eps);
    } catch (err) {
      toast.error(isServerUnreachable(err) ? SERVER_UNREACHABLE_MESSAGE : 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarDatos();
  }, []);

  const handleBuscar = async () => {
    const doc = parseInt(busqueda, 10);
    if (!doc || Number.isNaN(doc)) {
      toast.error('Ingresa un número de documento válido');
      return;
    }
    try {
      if (tab === 'mensual') {
        const resultado = await buscarClienteMensual(doc);
        setClientesMensuales((prev) =>
          prev.some((c) => c.numeroDeDocumento === resultado.numeroDeDocumento)
            ? prev
            : [...prev, resultado]
        );
      } else if (tab === 'diario') {
        const resultado = await buscarClienteDiario(doc);
        setClientesDiarios((prev) =>
          prev.some((c) => c.numeroDeDocumento === resultado.numeroDeDocumento)
            ? prev
            : [...prev, resultado]
        );
      } else if (tab === 'eps') {
        const resultado = await buscarBeneficiarioEps(doc);
        setBeneficiariosEps((prev) =>
          prev.some((c) => c.numeroDeDocumento === resultado.numeroDeDocumento)
            ? prev
            : [...prev, resultado]
        );
      }
      setBusqueda(String(doc));
      toast.success('Encontrado');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'No encontrado'));
    }
  };

  // ─── MENSUAL ───
  const handleCreateMensual = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const nuevoCliente = await crearClienteMensual(formMensual as ClienteMensualDTO);
      setClientesMensuales([...clientesMensuales, nuevoCliente]);
      toast.success('Cliente mensual creado exitosamente');
      setModo('list');
      resetFormMensual();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Error al crear cliente'));
    }
  };

  const handleUpdateMensual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMensual) return;
    try {
      const actualizado = await actualizarClienteMensual(
        currentMensual.numeroDeDocumento,
        formMensual
      );
      setClientesMensuales(
        clientesMensuales.map((c) =>
          c.numeroDeDocumento === actualizado.numeroDeDocumento ? actualizado : c
        )
      );
      toast.success('Cliente actualizado exitosamente');
      setModo('list');
      setCurrentMensual(null);
      resetFormMensual();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Error al actualizar'));
    }
  };

  const handleDeleteMensual = async (numeroDocumento: number) => {
    if (!window.confirm('¿Desactivar cliente?')) return;
    try {
      await desactivarClienteMensual(numeroDocumento);
      setClientesMensuales(clientesMensuales.filter((c) => c.numeroDeDocumento !== numeroDocumento));
      toast.success('Cliente desactivado');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Error al desactivar'));
    }
  };

  const handleReactivarMensual = async (numeroDocumento: number) => {
    try {
      const reactivado = await reactivarClienteMensual(numeroDocumento);
      setClientesMensuales(
        clientesMensuales.map((c) =>
          c.numeroDeDocumento === reactivado.numeroDeDocumento ? reactivado : c
        )
      );
      toast.success('Cliente reactivado');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Error al reactivar'));
    }
  };

  const editMensual = (cliente: ParticularMensual) => {
    setCurrentMensual(cliente);
    setFormMensual({
      nombreCompleto: cliente.nombreCompleto,
      telefono: cliente.telefono,
      correoElectronico: cliente.correoElectronico,
      tipoMembresia: cliente.tipoMembresia,
    });
    setModo('edit');
  };

  const resetFormMensual = () => {
    setFormMensual({
      tipoDeDocumento: 'CC',
      numeroDeDocumento: 0,
      nombreCompleto: '',
      fechaDeNacimiento: '',
      telefono: 0,
      correoElectronico: '',
      contrasena: '',
      tipoMembresia: 'MENSUAL',
    });
  };

  // Similar para Diarios y EPS...
  const handleCreateDiario = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const nuevoCliente = await crearClienteDiario(formDiario as ClienteDiarioDTO);
      setClientesDiarios([...clientesDiarios, nuevoCliente]);
      toast.success('Cliente diario creado exitosamente');
      setModo('list');
      resetFormDiario();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Error al crear cliente'));
    }
  };

  const handleUpdateDiario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentDiario) return;
    try {
      const actualizado = await actualizarClienteDiario(
        currentDiario.numeroDeDocumento,
        formDiario
      );
      setClientesDiarios(
        clientesDiarios.map((c) =>
          c.numeroDeDocumento === actualizado.numeroDeDocumento ? actualizado : c
        )
      );
      toast.success('Cliente actualizado exitosamente');
      setModo('list');
      setCurrentDiario(null);
      resetFormDiario();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Error al actualizar'));
    }
  };

  const editDiario = (cliente: ParticularDiario) => {
    setCurrentDiario(cliente);
    setFormDiario({
      nombreCompleto: cliente.nombreCompleto,
      telefono: cliente.telefono,
    });
    setModo('edit');
  };

  const resetFormDiario = () => {
    setFormDiario({
      tipoDeDocumento: 'CC',
      numeroDeDocumento: 0,
      nombreCompleto: '',
      telefono: 0,
    });
  };

  const handleCreateEps = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const nuevoCliente = await crearBeneficiarioEps(formEps as BeneficiarioEpsDTO);
      setBeneficiariosEps([...beneficiariosEps, nuevoCliente]);
      toast.success('Beneficiario EPS creado exitosamente');
      setModo('list');
      resetFormEps();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Error al crear beneficiario'));
    }
  };

  const handleUpdateEps = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentEps) return;
    try {
      const actualizado = await actualizarBeneficiarioEps(currentEps.numeroDeDocumento, formEps);
      setBeneficiariosEps(
        beneficiariosEps.map((c) =>
          c.numeroDeDocumento === actualizado.numeroDeDocumento ? actualizado : c
        )
      );
      toast.success('Beneficiario actualizado exitosamente');
      setModo('list');
      setCurrentEps(null);
      resetFormEps();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Error al actualizar'));
    }
  };

  const editEps = (cliente: BeneficiarioEps) => {
    setCurrentEps(cliente);
    setFormEps({
      nombreCompleto: cliente.nombreCompleto,
      telefono: cliente.telefono,
      correoElectronico: cliente.correoElectronico,
      sesionesAutorizadas: cliente.sesionesAutorizadas,
    });
    setModo('edit');
  };

  const resetFormEps = () => {
    setFormEps({
      tipoDeDocumento: 'CC',
      numeroDeDocumento: 0,
      nombreCompleto: '',
      fechaDeNacimiento: '',
      telefono: 0,
      correoElectronico: '',
      contrasena: '',
      sesionesAutorizadas: 0,
      medicoRemitente: '',
      entidadEps: '',
      diagnostico: '',
      zonaCuerpoTratar: '',
      fechaFin: '',
    });
  };

  const handleDeleteDiario = async (numeroDocumento: number) => {
    if (!window.confirm('¿Desactivar cliente?')) return;
    try {
      await desactivarClienteDiario(numeroDocumento);
      setClientesDiarios(clientesDiarios.filter((c) => c.numeroDeDocumento !== numeroDocumento));
      toast.success('Cliente desactivado');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Error al desactivar'));
    }
  };

  const handleReactivarDiario = async (numeroDocumento: number) => {
    try {
      const reactivado = await reactivarClienteDiario(numeroDocumento);
      setClientesDiarios((prev) =>
        prev.map((c) =>
          c.numeroDeDocumento === reactivado.numeroDeDocumento ? { ...c, ...reactivado } : c
        )
      );
      toast.success('Cliente reactivado');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Error al reactivar'));
    }
  };

  const handleDeleteEps = async (numeroDocumento: number) => {
    if (!window.confirm('¿Desactivar beneficiario?')) return;
    try {
      await desactivarBeneficiarioEps(numeroDocumento);
      setBeneficiariosEps(beneficiariosEps.filter((c) => c.numeroDeDocumento !== numeroDocumento));
      toast.success('Beneficiario desactivado');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Error al desactivar'));
    }
  };

  const handleReactivarEps = async (numeroDocumento: number) => {
    try {
      const reactivado = await reactivarBeneficiarioEps(numeroDocumento);
      setBeneficiariosEps((prev) =>
        prev.map((c) =>
          c.numeroDeDocumento === reactivado.numeroDeDocumento ? { ...c, ...reactivado } : c
        )
      );
      toast.success('Beneficiario reactivado');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Error al reactivar'));
    }
  };

  const handleRegistrarIngreso = async (e: React.FormEvent) => {
    e.preventDefault();
    const doc = parseInt(documentoIngreso, 10);
    if (!doc || Number.isNaN(doc)) {
      toast.error('Ingresa un número de documento válido');
      return;
    }
    try {
      const asistencia = await registrarIngreso(doc);
      toast.success(`Ingreso registrado a las ${asistencia.horaIngreso}`);
      setDocumentoIngreso('');
      setTab('mensual');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Error al registrar ingreso'));
    }
  };

  if (loading) {
    return (
      <Layout title="Cargando...">
        <div className="flex items-center justify-center h-full text-gray-500">Cargando...</div>
      </Layout>
    );
  }

  return (
    <Layout title="Gestión de Clientes">
      {/* Pestañas */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex gap-8">
          <button
            onClick={() => { setTab('mensual'); setModo('list'); setBusqueda(''); }}
            className={`py-3 px-4 font-medium border-b-2 transition ${
              tab === 'mensual'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            Clientes Mensuales ({clientesMensuales.length})
          </button>
          <button
            onClick={() => { setTab('diario'); setModo('list'); setBusqueda(''); }}
            className={`py-3 px-4 font-medium border-b-2 transition ${
              tab === 'diario'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            Clientes Diarios ({clientesDiarios.length})
          </button>
          <button
            onClick={() => { setTab('eps'); setModo('list'); setBusqueda(''); }}
            className={`py-3 px-4 font-medium border-b-2 transition ${
              tab === 'eps'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            Beneficiarios EPS ({beneficiariosEps.length})
          </button>
          <button
            onClick={() => { setTab('ingreso'); setModo('list'); }}
            className={`py-3 px-4 font-medium border-b-2 transition flex items-center gap-2 ${
              tab === 'ingreso'
                ? 'border-green-600 text-green-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            <FiLogIn /> Registrar Ingreso
          </button>
        </div>
      </div>

      {/* CONTENIDO MENSUALES */}
      {tab === 'mensual' && (
        <>
          {modo === 'list' && (
            <>
              <div className="mb-4 flex gap-2">
                <div className="relative flex-1">
                  <FiSearch className="absolute left-3 top-2.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar documento..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <button
                  onClick={handleBuscar}
                  className="px-4 py-2 bg-slate-800 text-white rounded-md text-sm"
                >
                  Buscar
                </button>
                <button
                  onClick={() => { setModo('create'); resetFormMensual(); }}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md text-sm"
                >
                  <FiPlus /> Crear
                </button>
              </div>

              <div className="bg-white rounded-lg overflow-hidden border border-gray-200">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Documento</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Nombre</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Membresía</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Vencimiento</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Estado</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {clientesMensuales.map((c) => (
                      <tr key={c.id} className="hover:bg-gray-50">
                        <td className="px-6 py-3 text-sm">{c.tipoDeDocumento} {c.numeroDeDocumento}</td>
                        <td className="px-6 py-3 text-sm">{c.nombreCompleto}</td>
                        <td className="px-6 py-3 text-sm text-gray-600">{c.correoElectronico}</td>
                        <td className="px-6 py-3 text-sm"><span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">{c.tipoMembresia}</span></td>
                        <td className="px-6 py-3 text-sm">{c.fechaVencimiento}</td>
                        <td className="px-6 py-3 text-sm">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${c.estado ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {c.estado ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-right space-x-2">
                          <button onClick={() => editMensual(c)} className="text-blue-600 hover:text-blue-900"><FiEdit2 size={16} /></button>
                          {c.estado ? (
                            <button onClick={() => handleDeleteMensual(c.numeroDeDocumento)} className="text-red-600 hover:text-red-900"><FiTrash2 size={16} /></button>
                          ) : (
                            <button onClick={() => handleReactivarMensual(c.numeroDeDocumento)} className="text-green-600 hover:text-green-900"><FiRefreshCw size={16} /></button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {(modo === 'create' || modo === 'edit') && (
            <div className="bg-white p-8 rounded-lg max-w-4xl">
              <h2 className="text-xl font-bold mb-6">{modo === 'create' ? 'Crear Cliente Mensual' : 'Editar Cliente'}</h2>
              <form onSubmit={modo === 'create' ? handleCreateMensual : handleUpdateMensual} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {modo === 'create' && (
                  <>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-2">Tipo de Documento</label>
                      <DocumentTypeBar
                        value={formMensual.tipoDeDocumento || 'CC'}
                        onChange={(v) => setFormMensual({ ...formMensual, tipoDeDocumento: v })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Número</label>
                      <input
                        type="number"
                        value={formMensual.numeroDeDocumento || ''}
                        onChange={(e) => setFormMensual({ ...formMensual, numeroDeDocumento: parseInt(e.target.value) || 0 })}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                  </>
                )}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Nombre Completo</label>
                  <input
                    type="text"
                    value={formMensual.nombreCompleto || ''}
                    onChange={(e) => setFormMensual({ ...formMensual, nombreCompleto: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Fecha Nacimiento</label>
                  <input
                    type="date"
                    value={formMensual.fechaDeNacimiento || ''}
                    onChange={(e) => setFormMensual({ ...formMensual, fechaDeNacimiento: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Teléfono</label>
                  <input
                    type="number"
                    value={formMensual.telefono || ''}
                    onChange={(e) => setFormMensual({ ...formMensual, telefono: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input
                    type="email"
                    value={formMensual.correoElectronico || ''}
                    onChange={(e) => setFormMensual({ ...formMensual, correoElectronico: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                {modo === 'create' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-1">Contraseña</label>
                      <input
                        type="password"
                        value={formMensual.contrasena || ''}
                        onChange={(e) => setFormMensual({ ...formMensual, contrasena: e.target.value })}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Tipo Membresía</label>
                      <select
                        value={formMensual.tipoMembresia || 'MENSUAL'}
                        onChange={(e) => setFormMensual({ ...formMensual, tipoMembresia: e.target.value as ClienteMensualDTO['tipoMembresia'] })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white"
                      >
                        <option value="MENSUAL">Mensual</option>
                        <option value="TRIMESTRAL">Trimestral</option>
                        <option value="SEMESTRAL">Semestral</option>
                        <option value="ANUAL">Anual</option>
                      </select>
                    </div>
                  </>
                )}
                <div className="md:col-span-2 flex justify-end gap-3 mt-4">
                  <button type="button" onClick={() => setModo('list')} className="px-4 py-2 border border-gray-300 rounded-md text-sm">
                    Cancelar
                  </button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm">
                    {modo === 'create' ? 'Crear' : 'Guardar'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </>
      )}

      {/* CONTENIDO DIARIOS */}
      {tab === 'diario' && (
        <>
          {modo === 'list' && (
            <>
              <div className="mb-4 flex gap-2">
                <div className="relative flex-1">
                  <FiSearch className="absolute left-3 top-2.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar documento..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <button
                  onClick={handleBuscar}
                  className="px-4 py-2 bg-slate-800 text-white rounded-md text-sm"
                >
                  Buscar
                </button>
                <button
                  onClick={() => { setModo('create'); resetFormDiario(); }}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md text-sm"
                >
                  <FiPlus /> Crear
                </button>
              </div>

              <div className="bg-white rounded-lg overflow-hidden border border-gray-200">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Documento</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Nombre</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Hora Ingreso</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Hora Expira</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Estado</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {clientesDiarios.map((c) => (
                      <tr key={c.id} className="hover:bg-gray-50">
                        <td className="px-6 py-3 text-sm">{c.tipoDeDocumento} {c.numeroDeDocumento}</td>
                        <td className="px-6 py-3 text-sm">{c.nombreCompleto}</td>
                        <td className="px-6 py-3 text-sm">{c.horaIngreso}</td>
                        <td className="px-6 py-3 text-sm">{c.horaExpiracion}</td>
                        <td className="px-6 py-3 text-sm">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${c.estado ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {c.estado ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-right space-x-2">
                          <button onClick={() => editDiario(c)} className="text-blue-600"><FiEdit2 size={16} /></button>
                          {c.estado ? (
                            <button onClick={() => handleDeleteDiario(c.numeroDeDocumento)} className="text-red-600"><FiTrash2 size={16} /></button>
                          ) : (
                            <button onClick={() => handleReactivarDiario(c.numeroDeDocumento)} className="text-green-600"><FiRefreshCw size={16} /></button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {(modo === 'create' || modo === 'edit') && (
            <div className="bg-white p-8 rounded-lg max-w-2xl">
              <h2 className="text-xl font-bold mb-6">{modo === 'create' ? 'Crear Cliente Diario' : 'Editar Cliente'}</h2>
              <form onSubmit={modo === 'create' ? handleCreateDiario : handleUpdateDiario} className="space-y-6">
                {modo === 'create' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-2">Tipo de Documento</label>
                      <DocumentTypeBar
                        value={formDiario.tipoDeDocumento || 'CC'}
                        onChange={(v) => setFormDiario({ ...formDiario, tipoDeDocumento: v })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Número</label>
                      <input
                        type="number"
                        value={formDiario.numeroDeDocumento || ''}
                        onChange={(e) => setFormDiario({ ...formDiario, numeroDeDocumento: parseInt(e.target.value) || 0 })}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                  </>
                )}
                <div>
                  <label className="block text-sm font-medium mb-1">Nombre Completo</label>
                  <input
                    type="text"
                    value={formDiario.nombreCompleto || ''}
                    onChange={(e) => setFormDiario({ ...formDiario, nombreCompleto: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Teléfono</label>
                  <input
                    type="number"
                    value={formDiario.telefono || ''}
                    onChange={(e) => setFormDiario({ ...formDiario, telefono: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <button type="button" onClick={() => setModo('list')} className="px-4 py-2 border border-gray-300 rounded-md text-sm">
                    Cancelar
                  </button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm">
                    {modo === 'create' ? 'Crear' : 'Guardar'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </>
      )}

      {/* CONTENIDO EPS */}
      {tab === 'eps' && (
        <>
          {modo === 'list' && (
            <>
              <div className="mb-4 flex gap-2">
                <div className="relative flex-1">
                  <FiSearch className="absolute left-3 top-2.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar documento..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <button
                  onClick={handleBuscar}
                  className="px-4 py-2 bg-slate-800 text-white rounded-md text-sm"
                >
                  Buscar
                </button>
                <button
                  onClick={() => { setModo('create'); resetFormEps(); }}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md text-sm"
                >
                  <FiPlus /> Crear
                </button>
              </div>

              <div className="bg-white rounded-lg overflow-hidden border border-gray-200">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Documento</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Nombre</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">EPS</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Sesiones</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Estado</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {beneficiariosEps.map((c) => (
                      <tr key={c.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">{c.tipoDeDocumento} {c.numeroDeDocumento}</td>
                        <td className="px-4 py-3">{c.nombreCompleto}</td>
                        <td className="px-4 py-3">{c.entidadEps}</td>
                        <td className="px-4 py-3">{c.sesionesAsistidas}/{c.sesionesAutorizadas}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${c.estado ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {c.estado ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right space-x-2">
                          <button onClick={() => editEps(c)} className="text-blue-600"><FiEdit2 size={16} /></button>
                          {c.estado ? (
                            <button onClick={() => handleDeleteEps(c.numeroDeDocumento)} className="text-red-600"><FiTrash2 size={16} /></button>
                          ) : (
                            <button onClick={() => handleReactivarEps(c.numeroDeDocumento)} className="text-green-600"><FiRefreshCw size={16} /></button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {(modo === 'create' || modo === 'edit') && (
            <div className="bg-white p-8 rounded-lg max-w-4xl">
              <h2 className="text-xl font-bold mb-6">{modo === 'create' ? 'Crear Beneficiario EPS' : 'Editar Beneficiario'}</h2>
              <form onSubmit={modo === 'create' ? handleCreateEps : handleUpdateEps} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {modo === 'create' && (
                  <>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-2">Tipo de Documento</label>
                      <DocumentTypeBar
                        value={formEps.tipoDeDocumento || 'CC'}
                        onChange={(v) => setFormEps({ ...formEps, tipoDeDocumento: v })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Número</label>
                      <input
                        type="number"
                        value={formEps.numeroDeDocumento || ''}
                        onChange={(e) => setFormEps({ ...formEps, numeroDeDocumento: parseInt(e.target.value) || 0 })}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                  </>
                )}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Nombre</label>
                  <input
                    type="text"
                    value={formEps.nombreCompleto || ''}
                    onChange={(e) => setFormEps({ ...formEps, nombreCompleto: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Teléfono</label>
                  <input
                    type="number"
                    value={formEps.telefono || ''}
                    onChange={(e) => setFormEps({ ...formEps, telefono: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input
                    type="email"
                    value={formEps.correoElectronico || ''}
                    onChange={(e) => setFormEps({ ...formEps, correoElectronico: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Sesiones Autorizadas</label>
                  <input
                    type="number"
                    value={formEps.sesionesAutorizadas || ''}
                    onChange={(e) => setFormEps({ ...formEps, sesionesAutorizadas: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">EPS</label>
                  <input
                    type="text"
                    value={formEps.entidadEps || ''}
                    onChange={(e) => setFormEps({ ...formEps, entidadEps: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Diagnóstico</label>
                  <input
                    type="text"
                    value={formEps.diagnostico || ''}
                    onChange={(e) => setFormEps({ ...formEps, diagnostico: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Zona a Tratar</label>
                  <input
                    type="text"
                    value={formEps.zonaCuerpoTratar || ''}
                    onChange={(e) => setFormEps({ ...formEps, zonaCuerpoTratar: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div className="md:col-span-2 flex justify-end gap-3 mt-4">
                  <button type="button" onClick={() => setModo('list')} className="px-4 py-2 border border-gray-300 rounded-md text-sm">
                    Cancelar
                  </button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm">
                    {modo === 'create' ? 'Crear' : 'Guardar'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </>
      )}

      {/* REGISTRO DE INGRESO */}
      {tab === 'ingreso' && (
        <div className="bg-white p-8 rounded-lg max-w-xl">
          <h2 className="text-xl font-bold mb-6">Registrar Ingreso</h2>
          <form onSubmit={handleRegistrarIngreso} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Número de Documento</label>
              <input
                type="number"
                value={documentoIngreso}
                onChange={(e) => setDocumentoIngreso(e.target.value)}
                placeholder="Ej: 123456789"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md text-lg"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setTab('mensual')}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm"
              >
                Cancelar
              </button>
              <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium">
                Registrar Ingreso
              </button>
            </div>
          </form>
        </div>
      )}
    </Layout>
  );
}