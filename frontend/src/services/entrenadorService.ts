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
  idHorario: number;
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
  presionArterial: string;
  frecuenciaCardiaca: number;
}

export interface MetaFisica {
  id: number;
  descripcion: string;
  fechaObjetivo: string;
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

export const crearMetaEps = (numeroDocumento: number, data: { objetivoClinico: string; observacionMedica?: string }) =>
  api.post<ApiResponse<MetaFisica>>(`/entrenador/metas/eps/${numeroDocumento}`, data).then(unwrap);