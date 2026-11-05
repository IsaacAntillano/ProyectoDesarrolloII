import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FiPlus, FiRefreshCw, FiUsers, FiCalendar, FiActivity } from 'react-icons/fi';
import Layout from '../components/Layout';
import StatusBadge from '../components/ui/StatusBadge';
import EmptyState from '../components/ui/EmptyState';
import LoadingState from '../components/ui/LoadingState';
import ErrorState from '../components/ui/ErrorState';
import Button from '../components/ui/Button';
import { Field, Input, Select } from '../components/ui/Field';
import ProgressBar from '../components/ui/ProgressBar';
import {
  miPerfil,
  listarMisHorarios,
  crearHorario,
  listarMisRutinas,
  crearRutina,
  listarClientesAsignados,
  registrarEvaluacionPeriodica,
  registrarEvaluacionInicial,
  historialEvaluaciones,
  progresoCliente,
  rutinasCliente,
  type Progreso,
  type Horario,
  type Entrenador,
  type Rutina,
  type ClienteAsignado,
} from '../services/entrenadorService';
import { isServerUnreachable, getApiErrorMessage, SERVER_UNREACHABLE_MESSAGE } from '../utils/apiError';
import {
  etiqueta,
  ETIQUETA_TIPO_CLIENTE,
  ETIQUETA_ORIGEN_ASIGNACION,
} from '../constants/labels';
import { formatearFecha, formatearHora, formatearNumero, hoyISO } from '../utils/format';

const CUPO_ENTRENADOR = 4;
const PRESION_RE = /^\d{2,3}\/\d{2,3}$/;

function esPresionValida(v: string) {
  return PRESION_RE.test(v.trim());
}

interface ErroresEvaluacion {
  peso?: string;
  talla?: string;
  porcentajeGrasa?: string;
  perimetroCintura?: string;
  perimetroCadera?: string;
  perimetroBrazo?: string;
  presionArterial?: string;
  frecuenciaCardiaca?: string;
}

export default function EntrenadorDashboard() {
  const [perfil, setPerfil] = useState<Entrenador | null>(null);
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [rutinas, setRutinas] = useState<Rutina[]>([]);
  const [clientes, setClientes] = useState<ClienteAsignado[]>([]);
  const [progreso, setProgreso] = useState<Progreso | null>(null);
  const [rutinasClienteSel, setRutinasClienteSel] = useState<Rutina[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [agregando, setAgregando] = useState(false);
  const [clienteDoc, setClienteDoc] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [erroresEval, setErroresEval] = useState<ErroresEvaluacion>({});

  const [form, setForm] = useState({
    fechaDisponible: hoyISO(),
    horaInicio: '08:00',
    horaFin: '10:00',
  });
  const [rutinaForm, setRutinaForm] = useState({ nombre: '', descripcion: '', fechaVencimiento: '' });
  const [medForm, setMedForm] = useState({
    peso: '',
    talla: '',
    porcentajeGrasa: '',
    perimetroCintura: '',
    perimetroCadera: '',
    perimetroBrazo: '',
    presionArterial: '',
    frecuenciaCardiaca: '',
  });

  const clienteActivo = clientes.find((c) => String(c.numeroDocumento) === clienteDoc) ?? null;
  const ocupacion = clientes.length;
  const cupoLleno = ocupacion >= CUPO_ENTRENADOR;

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [p, h, r, c] = await Promise.all([
        miPerfil(),
        listarMisHorarios(),
        listarMisRutinas(),
        listarClientesAsignados(),
      ]);
      setPerfil(p);
      setHorarios(h);
      setRutinas(r);
      setClientes(c);
    } catch (err) {
      setError(
        isServerUnreachable(err)
          ? SERVER_UNREACHABLE_MESSAGE
          : getApiErrorMessage(err, 'No se pudieron cargar tus datos.')
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargar();
  }, [cargar]);

  // Seguimiento del cliente seleccionado: progreso físico y rutinas activas.
  const cargarSeguimiento = useCallback(async () => {
    if (!clienteDoc) {
      setProgreso(null);
      setRutinasClienteSel([]);
      return;
    }
    const [p, r] = await Promise.allSettled([
      progresoCliente(Number(clienteDoc)),
      rutinasCliente(Number(clienteDoc)),
    ]);
    setProgreso(p.status === 'fulfilled' ? p.value : null);
    setRutinasClienteSel(r.status === 'fulfilled' ? r.value : []);
  }, [clienteDoc]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void cargarSeguimiento();
  }, [cargarSeguimiento]);

  const elegirCliente = (doc: string) => {
    setClienteDoc(doc);
  };

  const agregarHorario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.horaFin <= form.horaInicio) {
      toast.error('La hora de fin debe ser posterior a la de inicio');
      return;
    }
    setGuardando(true);
    try {
      await crearHorario({
        fechaDisponible: form.fechaDisponible,
        horaInicio: `${form.horaInicio}:00`,
        horaFin: `${form.horaFin}:00`,
      });
      toast.success('Horario creado');
      setAgregando(false);
      cargar();
      void cargarSeguimiento();
    } catch (err) {
      toast.error(
        isServerUnreachable(err)
          ? SERVER_UNREACHABLE_MESSAGE
          : getApiErrorMessage(err, 'No se pudo crear el horario')
      );
    } finally {
      setGuardando(false);
    }
  };

  const crearRutinaCliente = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteActivo) {
      toast.error('Selecciona uno de tus clientes asignados');
      return;
    }
    const target = clienteActivo;
    setGuardando(true);
    try {
      await crearRutina(target.numeroDocumento, {
        nombre: rutinaForm.nombre,
        descripcion: rutinaForm.descripcion,
        fechaVencimiento: rutinaForm.fechaVencimiento,
      });
      toast.success(`Rutina creada para ${target.nombreCompleto}`);
      setRutinaForm({ nombre: '', descripcion: '', fechaVencimiento: '' });
      cargar();
      void cargarSeguimiento();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'No se pudo crear la rutina'));
    } finally {
      setGuardando(false);
    }
  };

  const registrarEvaluacionCliente = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteActivo) {
      toast.error('Selecciona uno de tus clientes asignados');
      return;
    }
    const target = clienteActivo;
    const errores: ErroresEvaluacion = {};
    const numero = (v: string) => Number(v);

    if (!medForm.peso || numero(medForm.peso) <= 0) errores.peso = 'Debe ser mayor que 0';
    if (!medForm.talla || numero(medForm.talla) <= 0.3 || numero(medForm.talla) > 2.5) errores.talla = 'Debe estar entre 0,3 y 2,5 m';
    if (!medForm.porcentajeGrasa || numero(medForm.porcentajeGrasa) < 0 || numero(medForm.porcentajeGrasa) > 70) errores.porcentajeGrasa = 'Debe estar entre 0 y 70 %';
    if (!medForm.perimetroCintura || numero(medForm.perimetroCintura) <= 0) errores.perimetroCintura = 'Debe ser mayor que 0';
    if (!medForm.perimetroCadera || numero(medForm.perimetroCadera) <= 0) errores.perimetroCadera = 'Debe ser mayor que 0';
    if (!medForm.perimetroBrazo || numero(medForm.perimetroBrazo) <= 0) errores.perimetroBrazo = 'Debe ser mayor que 0';
    if (!esPresionValida(medForm.presionArterial)) errores.presionArterial = 'Formato 120/80';
    if (!medForm.frecuenciaCardiaca || numero(medForm.frecuenciaCardiaca) < 20 || numero(medForm.frecuenciaCardiaca) > 250) errores.frecuenciaCardiaca = 'Debe estar entre 20 y 250 lpm';

    if (Object.values(errores).some(Boolean)) {
      setErroresEval(errores);
      toast.error('Revisa las medidas marcadas en rojo');
      return;
    }
    setErroresEval({});

    setGuardando(true);
    try {
      // Primera evaluación del cliente -> inicial; si ya tiene, -> periódica.
      const historial = await historialEvaluaciones(target.numeroDocumento);
      const medidas = {
        peso: numero(medForm.peso),
        talla: numero(medForm.talla),
        porcentajeGrasa: numero(medForm.porcentajeGrasa),
        perimetroCintura: numero(medForm.perimetroCintura),
        perimetroCadera: numero(medForm.perimetroCadera),
        perimetroBrazo: numero(medForm.perimetroBrazo),
        presionArterial: medForm.presionArterial.trim(),
        frecuenciaCardiaca: numero(medForm.frecuenciaCardiaca),
      };
      if (historial.length === 0) {
        await registrarEvaluacionInicial(target.numeroDocumento, medidas);
        toast.success(`Evaluación inicial registrada para ${target.nombreCompleto}`);
      } else {
        await registrarEvaluacionPeriodica(target.numeroDocumento, medidas);
        toast.success(`Evaluación periódica registrada para ${target.nombreCompleto}`);
      }
      setMedForm({
        peso: '', talla: '', porcentajeGrasa: '', perimetroCintura: '',
        perimetroCadera: '', perimetroBrazo: '', presionArterial: '', frecuenciaCardiaca: '',
      });
      cargar();
      void cargarSeguimiento();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'No se pudo registrar la evaluación'));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Layout title="Panel de Entrenador" description="Tus clientes asignados, horarios, rutinas y evaluaciones">
      {loading ? (
        <LoadingState message="Cargando tu panel..." filas={4} />
      ) : error ? (
        <ErrorState message={error} onRetry={() => void cargar()} />
      ) : (
        <div className="space-y-6">
          <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-800">
              Bienvenido, {perfil?.nombreCompleto ?? 'entrenador'}
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Documento {perfil?.numeroDeDocumento ? formatearNumero(perfil.numeroDeDocumento) : '—'} ·
              gestionas horarios, rutinas y seguimiento físico de tus clientes.
            </p>
          </section>

          <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h3 className="flex items-center gap-2 font-semibold text-gray-800">
                <FiUsers aria-hidden="true" /> Mis clientes ({ocupacion})
              </h3>
              <div className="min-w-[180px] flex-1 sm:max-w-xs">
                <ProgressBar
                  value={ocupacion}
                  max={CUPO_ENTRENADOR}
                  label="Cupo de clientes activos"
                  tone={cupoLleno ? 'red' : ocupacion >= 3 ? 'amber' : 'green'}
                />
              </div>
            </div>
            {cupoLleno && (
              <p role="note" className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
                Tienes el cupo completo ({CUPO_ENTRENADOR}/{CUPO_ENTRENADOR}). No puedes recibir nuevos
                clientes hasta que uno deje de estar activo.
              </p>
            )}
            {clientes.length === 0 ? (
              <EmptyState
                title="Sin clientes asignados"
                message="Cuando te asignen un cliente (primer mes o servicio Plus), aparecerá aquí para crear rutinas y registrar evaluaciones."
              />
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2">
                {clientes.map((c) => (
                  <li key={c.numeroDocumento}>
                    <button
                      type="button"
                      onClick={() => elegirCliente(String(c.numeroDocumento))}
                      aria-pressed={clienteDoc === String(c.numeroDocumento)}
                      aria-label={`Usar a ${c.nombreCompleto} en la gestión de abajo`}
                      className={`w-full rounded-md border p-3 text-left transition [&:focus-visible]:outline-none [&:focus-visible]:ring-2 [&:focus-visible]:ring-blue-500 ${
                        clienteDoc === String(c.numeroDocumento)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-400 hover:bg-blue-50'
                      }`}
                    >
                      <p className="font-medium text-gray-800">{c.nombreCompleto}</p>
                      <p className="text-xs text-gray-500">
                        {formatearNumero(c.numeroDocumento)} · {etiqueta(ETIQUETA_TIPO_CLIENTE, c.tipoDeCliente)}
                      </p>
                      <p className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                        <StatusBadge tone={c.origen === 'PLUS' ? 'blue' : 'gray'}>
                          {etiqueta(ETIQUETA_ORIGEN_ASIGNACION, c.origen)}
                        </StatusBadge>
                        desde {formatearFecha(c.fechaAsignacion)}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h3 className="flex items-center gap-2 font-semibold text-gray-800">
                <FiCalendar aria-hidden="true" /> Mis horarios
              </h3>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={() => void cargar()}>
                  <FiRefreshCw aria-hidden="true" /> Actualizar
                </Button>
                <Button size="sm" onClick={() => setAgregando((v) => !v)} aria-expanded={agregando}>
                  <FiPlus aria-hidden="true" /> Nuevo horario
                </Button>
              </div>
            </div>

            {agregando && (
              <form onSubmit={agregarHorario} className="mb-4 grid gap-3 rounded-md bg-gray-50 p-4 sm:grid-cols-4">
                <Field label="Fecha" htmlFor="horario-fecha" required>
                  <Input
                    id="horario-fecha"
                    type="date"
                    required
                    value={form.fechaDisponible}
                    onChange={(e) => setForm({ ...form, fechaDisponible: e.target.value })}
                  />
                </Field>
                <Field label="Hora de inicio" htmlFor="horario-inicio" required>
                  <Input
                    id="horario-inicio"
                    type="time"
                    required
                    value={form.horaInicio}
                    onChange={(e) => setForm({ ...form, horaInicio: e.target.value })}
                  />
                </Field>
                <Field label="Hora de fin" htmlFor="horario-fin" required help="Debe ser posterior al inicio">
                  <Input
                    id="horario-fin"
                    type="time"
                    required
                    value={form.horaFin}
                    onChange={(e) => setForm({ ...form, horaFin: e.target.value })}
                  />
                </Field>
                <div className="flex items-end">
                  <Button type="submit" variant="success" className="w-full" loading={guardando}>
                    Guardar
                  </Button>
                </div>
              </form>
            )}

            {horarios.length === 0 ? (
              <EmptyState
                title="Todavía no declaraste horarios"
                message="Crea tu primer horario para que tus clientes puedan reservarlo desde su portal."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <caption className="sr-only">Mis horarios declarados</caption>
                  <thead className="bg-gray-50">
                    <tr>
                      {['Fecha', 'Inicio', 'Fin', 'Estado'].map((h) => (
                        <th key={h} scope="col" className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {horarios.map((h) => (
                      <tr key={h.idHorario} className="hover:bg-gray-50">
                        <td className="px-3 py-2 text-sm">{formatearFecha(h.fechaDisponible)}</td>
                        <td className="px-3 py-2 text-sm">{formatearHora(h.horaInicio)}</td>
                        <td className="px-3 py-2 text-sm">{formatearHora(h.horaFin)}</td>
                        <td className="px-3 py-2">
                          <StatusBadge tone={h.disponible ? 'green' : 'gray'}>
                            {h.disponible ? 'Disponible' : 'Asignado'}
                          </StatusBadge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 font-semibold text-gray-800">Mis rutinas</h3>
            {rutinas.length === 0 ? (
              <EmptyState
                title="Todavía no has creado rutinas"
                message="Crea una rutina para uno de tus clientes asignados en la sección de abajo."
              />
            ) : (
              <ul className="space-y-3">
                {rutinas.map((r) => (
                  <li key={r.idRutina} className="border-l-4 border-blue-500 pl-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-gray-800">{r.nombre}</p>
                      <StatusBadge tone={r.activa ? 'green' : 'gray'}>{r.activa ? 'Activa' : 'Vencida'}</StatusBadge>
                    </div>
                    <p className="text-sm text-gray-600">{r.descripcion}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      Creada {formatearFecha(r.fechaCreacion)} · vence {formatearFecha(r.fechaVencimiento)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-1 flex items-center gap-2 font-semibold text-gray-800">
              <FiActivity aria-hidden="true" /> Gestionar cliente
            </h3>
            <p className="mb-4 text-sm text-gray-500">
              Elige uno de tus clientes asignados (se llena al hacer clic en la lista de arriba) y
              crea su rutina o registra una evaluación.
            </p>

            <Field
              label="Cliente asignado"
              htmlFor="cliente-select"
              help={clienteActivo ? `Seleccionado: ${clienteActivo.nombreCompleto}` : 'Elige de la lista de tus clientes asignados'}
            >
              <Select
                id="cliente-select"
                value={clienteDoc}
                onChange={(e) => elegirCliente(e.target.value)}
              >
                <option value="">Selecciona un cliente</option>
                {clientes.map((c) => (
                  <option key={c.numeroDocumento} value={c.numeroDocumento}>
                    {c.nombreCompleto} — {formatearNumero(c.numeroDocumento)}
                  </option>
                ))}
              </Select>
            </Field>

            {clientes.length === 0 && (
              <p className="mt-3 text-sm text-gray-500 italic">
                No tienes clientes asignados: las acciones de abajo aparecerán cuando tengas alguno.
              </p>
            )}

            <div className={`mt-4 grid gap-4 lg:grid-cols-2 ${clientes.length === 0 ? 'opacity-50' : ''}`}>
              <form
                onSubmit={crearRutinaCliente}
                className={`space-y-3 rounded-md border border-gray-200 p-4 ${clientes.length === 0 ? 'pointer-events-none' : ''}`}
                aria-disabled={clientes.length === 0}
              >
                <h4 className="font-medium text-gray-800">Nueva rutina</h4>
                <Field label="Nombre de la rutina" htmlFor="rutina-nombre" required>
                  <Input
                    id="rutina-nombre"
                    type="text"
                    value={rutinaForm.nombre}
                    onChange={(e) => setRutinaForm({ ...rutinaForm, nombre: e.target.value })}
                    required
                  />
                </Field>
                <Field label="Descripción" htmlFor="rutina-desc" required>
                  <Input
                    id="rutina-desc"
                    type="text"
                    value={rutinaForm.descripcion}
                    onChange={(e) => setRutinaForm({ ...rutinaForm, descripcion: e.target.value })}
                    required
                  />
                </Field>
                <Field label="Fecha de vencimiento" htmlFor="rutina-fecha" required help="Cuándo expira esta rutina">
                  <Input
                    id="rutina-fecha"
                    type="date"
                    value={rutinaForm.fechaVencimiento}
                    onChange={(e) => setRutinaForm({ ...rutinaForm, fechaVencimiento: e.target.value })}
                    required
                  />
                </Field>
                <Button type="submit" loading={guardando} disabled={clientes.length === 0}>
                  Crear rutina
                </Button>
              </form>

              <form
                onSubmit={registrarEvaluacionCliente}
                className={`space-y-3 rounded-md border border-gray-200 p-4 ${clientes.length === 0 ? 'pointer-events-none' : ''}`}
                aria-disabled={clientes.length === 0}
                noValidate
              >
                <h4 className="font-medium text-gray-800">Registrar evaluación</h4>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Peso (kg)" htmlFor="eval-peso" required error={erroresEval.peso}>
                    <Input id="eval-peso" type="number" step="any" inputMode="decimal" value={medForm.peso} onChange={(e) => setMedForm({ ...medForm, peso: e.target.value })} required error={!!erroresEval.peso} />
                  </Field>
                  <Field label="Talla (m)" htmlFor="eval-talla" required error={erroresEval.talla}>
                    <Input id="eval-talla" type="number" step="any" inputMode="decimal" value={medForm.talla} onChange={(e) => setMedForm({ ...medForm, talla: e.target.value })} required error={!!erroresEval.talla} />
                  </Field>
                  <Field label="Grasa (%)" htmlFor="eval-grasa" required error={erroresEval.porcentajeGrasa}>
                    <Input id="eval-grasa" type="number" step="any" inputMode="decimal" value={medForm.porcentajeGrasa} onChange={(e) => setMedForm({ ...medForm, porcentajeGrasa: e.target.value })} required error={!!erroresEval.porcentajeGrasa} />
                  </Field>
                  <Field label="Cintura (cm)" htmlFor="eval-cintura" required error={erroresEval.perimetroCintura}>
                    <Input id="eval-cintura" type="number" step="any" inputMode="decimal" value={medForm.perimetroCintura} onChange={(e) => setMedForm({ ...medForm, perimetroCintura: e.target.value })} required error={!!erroresEval.perimetroCintura} />
                  </Field>
                  <Field label="Cadera (cm)" htmlFor="eval-cadera" required error={erroresEval.perimetroCadera}>
                    <Input id="eval-cadera" type="number" step="any" inputMode="decimal" value={medForm.perimetroCadera} onChange={(e) => setMedForm({ ...medForm, perimetroCadera: e.target.value })} required error={!!erroresEval.perimetroCadera} />
                  </Field>
                  <Field label="Brazo (cm)" htmlFor="eval-brazo" required error={erroresEval.perimetroBrazo}>
                    <Input id="eval-brazo" type="number" step="any" inputMode="decimal" value={medForm.perimetroBrazo} onChange={(e) => setMedForm({ ...medForm, perimetroBrazo: e.target.value })} required error={!!erroresEval.perimetroBrazo} />
                  </Field>
                  <Field label="Presión arterial" htmlFor="eval-presion" required help="Formato 120/80" error={erroresEval.presionArterial}>
                    <Input id="eval-presion" type="text" inputMode="numeric" placeholder="120/80" value={medForm.presionArterial} onChange={(e) => setMedForm({ ...medForm, presionArterial: e.target.value })} required error={!!erroresEval.presionArterial} />
                  </Field>
                  <Field label="Frecuencia cardíaca (lpm)" htmlFor="eval-fc" required error={erroresEval.frecuenciaCardiaca}>
                    <Input id="eval-fc" type="number" inputMode="numeric" value={medForm.frecuenciaCardiaca} onChange={(e) => setMedForm({ ...medForm, frecuenciaCardiaca: e.target.value })} required error={!!erroresEval.frecuenciaCardiaca} />
                  </Field>
                </div>
                <Button type="submit" loading={guardando} disabled={clientes.length === 0}>
                  Registrar evaluación
                </Button>
              </form>
            </div>
          </section>

          <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-1 font-semibold text-gray-800">Seguimiento del cliente</h3>
            <p className="mb-4 text-sm text-gray-500">
              Progreso físico y rutinas activas del cliente seleccionado.
            </p>
            {!clienteActivo ? (
              <EmptyState
                title="Selecciona un cliente"
                message="Cuando elijas un cliente de la sección anterior verás aquí su progreso y rutinas."
              />
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-lg border border-gray-200 bg-white p-4">
                    <p className="text-sm text-gray-500">Peso perdido</p>
                    <p className="mt-1 text-2xl font-bold text-gray-800">
                      {(progreso?.pesoPerdido ?? 0) > 0 ? `${progreso?.pesoPerdido.toFixed(1)} kg` : '0 kg'}
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-white p-4">
                    <p className="text-sm text-gray-500">IMC actual</p>
                    <p className="mt-1 text-2xl font-bold text-gray-800">
                      {progreso?.imcActual?.toFixed(2) ?? '—'}
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-white p-4">
                    <p className="text-sm text-gray-500">Grasa corporal</p>
                    <p className="mt-1 text-2xl font-bold text-gray-800">
                      {progreso?.porcentajeGrasaActual != null ? `${progreso.porcentajeGrasaActual}%` : '—'}
                    </p>
                  </div>
                </div>
                {progreso?.mensaje && (
                  <p className="mt-2 text-xs text-gray-500">{progreso.mensaje}</p>
                )}
                <div className="mt-4">
                  <h4 className="font-medium text-gray-800">Rutinas activas</h4>
                  {rutinasClienteSel.length === 0 ? (
                    <p className="mt-2 text-sm text-gray-500">Este cliente todavía no tiene rutinas activas.</p>
                  ) : (
                    <ul className="mt-2 space-y-2">
                      {rutinasClienteSel.map((r) => (
                        <li key={r.idRutina} className="border-l-4 border-blue-500 pl-3">
                          <p className="font-medium text-gray-800">{r.nombre}</p>
                          <p className="text-sm text-gray-600">{r.descripcion}</p>
                          <p className="mt-1 text-xs text-gray-500">Vence {formatearFecha(r.fechaVencimiento)}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </>
            )}
          </section>
        </div>
      )}
    </Layout>
  );
}
