import api from './api';
import { type ApiResponse, unwrap } from './apiTypes';

// El backend usa el documento del header X-Documento para saber qué
// entrenador o cliente está llamando, así que estos servicios no reciben id:
// el document viene implícito en el interceptor de api.ts.

export interface Entrenador {
  idUsuarioSistema: number;
  numeroDeDocumento: number;
  nombreCompleto: string;
  rol: string;
  estado: boolean;
}

export interface Horario {
  id: number;
  fechaDisponible: string;
  horaInicio: string;
  horaFin: string;
  disponible: boolean;
  idClienteAsignado?: number | null;
}

export interface Rutina {
  idRutina: number;
  nombre: string;
  descripcion: string;
  fechaCreacion: string;
  fechaVencimiento: string;
  activa: boolean;
}

export interface ClienteAsignado {
  numeroDocumento: number;
  nombreCompleto: string;
  tipoDeCliente: 'PARTICULAR_MENSUAL' | 'PARTICULAR_DIARIO' | 'BENEFICIARIO_EPS';
  estado: boolean;
  fechaAsignacion: string;
  origen: 'PRIMER_MES' | 'PLUS';
}

export interface Medidas {
  peso: number;
  talla: number;
  porcentajeGrasa: number;
  perimetroCintura: number;
  perimetroCadera: number;
  perimetroBrazo: number;
  perimetroPierna?: number;
  presionArterial: string;
  frecuenciaCardiaca: number;
  nivelDolor?: number;
  movilidadArticular?: number;
  observaciones?: string;
}

export interface EvaluacionFisica {
  id: number;
  fechaEvaluacion: string;
  peso: number;
  talla: number;
  imc: number;
  porcentajeGrasa: number;
  perimetroCintura: number;
  perimetroCadera?: number;
  perimetroBrazo?: number;
  perimetroPierna?: number;
  presionArterial: string;
  frecuenciaCardiaca: number;
  observaciones?: string;
}

export interface MetaFisica {
  id: number;
  descripcion: string;
  pesoObjetivo?: number | null;
  porcentajeGrasaObjetivo?: number | null;
  perimetroCinturaObjetivo?: number | null;
  fechaObjetivo?: string | null;
  observacionMedica?: string | null;
}

export interface Mensaje {
  id: number;
  contenido: string;
  fechaEnvio: string;
  horaEnvio: string;
  leido: boolean;
  entrenador?: { nombreCompleto: string } | null;
  cliente?: { nombreCompleto: string } | null;
}

// ─── Identidad ──────────────────────────────────────────────────────

export const miPerfil = () => api.get<ApiResponse<Entrenador>>('/entrenador/perfil').then(unwrap);

// ─── Horarios ───────────────────────────────────────────────────────

export const listarMisHorarios = () =>
  api.get<ApiResponse<Horario[]>>('/entrenador/horarios').then(unwrap);

export const crearHorario = (data: { fechaDisponible: string; horaInicio: string; horaFin: string }) =>
  api.post<ApiResponse<Horario>>('/entrenador/horarios', data).then(unwrap);

export const asignarHorario = (idHorario: number, numeroDocumento: number) =>
  api.post<ApiResponse<void>>(`/entrenador/horarios/${idHorario}/asignar/${numeroDocumento}`).then(unwrap);

// ─── Rutinas ────────────────────────────────────────────────────────

export const listarMisRutinas = () =>
  api.get<ApiResponse<Rutina[]>>('/entrenador/rutinas').then(unwrap);

/** Clientes activos que el backend tiene asignados a este entrenador. */
export const listarClientesAsignados = () =>
  api.get<ApiResponse<ClienteAsignado[]>>('/entrenador/clientes').then(unwrap);

export const crearRutina = (numeroDocumento: number, data: { nombre: string; descripcion: string; fechaVencimiento: string }) =>
  api.post<ApiResponse<Rutina>>(`/entrenador/rutinas/${numeroDocumento}`, data).then(unwrap);

export const historialEvaluaciones = (numeroDocumento: number) =>
  api.get<ApiResponse<EvaluacionFisica[]>>(`/entrenador/clientes/${numeroDocumento}/evaluaciones`).then(unwrap);

// ─── Evaluaciones ───────────────────────────────────────────────────

export const registrarEvaluacionInicial = (numeroDocumento: number, medidas: Medidas) =>
  api.post<ApiResponse<EvaluacionFisica>>(`/entrenador/evaluaciones/inicial/${numeroDocumento}`, medidas).then(unwrap);

export const registrarEvaluacionPeriodica = (numeroDocumento: number, medidas: Medidas) =>
  api.post<ApiResponse<EvaluacionFisica>>(`/entrenador/evaluaciones/periodica/${numeroDocumento}`, medidas).then(unwrap);

// ─── Metas ──────────────────────────────────────────────────────────

export const crearMetaParticular = (
  numeroDocumento: number,
  data: {
    descripcion: string;
    pesoObjetivo?: number;
    porcentajeGrasaObjetivo?: number;
    perimetroCinturaObjetivo?: number;
    fechaObjetivo: string;
  }
) => api.post<ApiResponse<MetaFisica>>(`/entrenador/metas/particular/${numeroDocumento}`, data).then(unwrap);

// ─── Progreso y rutinas del cliente ─────────────────────────────────

export interface Progreso {
  pesoPerdido: number;
  imcActual: number;
  porcentajeGrasaActual: number;
  mensaje: string;
}

/** Progreso físico de un cliente asignado a este entrenador (EF-0007). */
export const progresoCliente = (numeroDocumento: number) =>
  api.get<ApiResponse<Progreso>>(`/entrenador/clientes/${numeroDocumento}/progreso`).then(unwrap);

/** Rutinas activas de un cliente asignado a este entrenador (GE-0008). */
export const rutinasCliente = (numeroDocumento: number) =>
  api.get<ApiResponse<Rutina[]>>(`/entrenador/clientes/${numeroDocumento}/rutinas`).then(unwrap);

export const crearMetaEps = (
  numeroDocumento: number,
  data: { objetivoClinico: string; observacionMedica?: string; fechaObjetivo?: string }
) => api.post<ApiResponse<MetaFisica>>(`/entrenador/metas/eps/${numeroDocumento}`, data).then(unwrap);

/** Meta vigente del cliente (EF-0006). */
export const metaCliente = (numeroDocumento: number) =>
  api.get<ApiResponse<MetaFisica | null>>(`/entrenador/clientes/${numeroDocumento}/metas`).then(unwrap);

// ─── Mensajes (GE-0009) ─────────────────────────────────────────────

export const enviarMensaje = (numeroDocumento: number, contenido: string) =>
  api.post<ApiResponse<void>>(`/entrenador/mensajes/${numeroDocumento}`, { contenido }).then(unwrap);

export const mensajesEnviados = (numeroDocumento: number) =>
  api.get<ApiResponse<Mensaje[]>>(`/entrenador/clientes/${numeroDocumento}/mensajes`).then(unwrap);

// ─── Reporte EPS (EF-0008) ──────────────────────────────────────────

export interface ReporteProgresoEps {
  numeroDocumento: number;
  nombreBeneficiario: string;
  entidadEps?: string | null;
  diagnostico?: string | null;
  zonaCuerpoTratar?: string | null;
  medicoRemitente?: string | null;
  nombreEntrenador?: string | null;
  fechaGeneracion: string;
  fechaEvaluacionInicial?: string | null;
  fechaEvaluacionFinal?: string | null;
  evaluaciones: EvaluacionFisica[];
  progreso: Progreso;
  objetivoClinico?: string | null;
  observacionMedica?: string | null;
  fechaObjetivo?: string | null;
}

/** Reporte de progreso físico de un beneficiario EPS (EF-0008). */
export const reporteEps = (numeroDocumento: number) =>
  api
    .get<ApiResponse<ReporteProgresoEps>>(`/entrenador/clientes/${numeroDocumento}/reporte-eps`)
    .then(unwrap);