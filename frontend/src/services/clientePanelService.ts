import api from './api';
import { type ApiResponse, unwrap } from './apiTypes';

// Panel del cliente. El documento viaja en el header X-Documento (lo pone el
// interceptor de api.ts desde localStorage), así que estos servicios no
// reciben id: cada cliente solo puede ver lo suyo.

export interface MiPerfil {
  id: number;
  tipoDeDocumento: string;
  numeroDeDocumento: number;
  nombreCompleto: string;
  fechaDeNacimiento?: string;
  telefono?: number;
  correoElectronico?: string;
  estado: boolean;
  tipoDeCliente: 'PARTICULAR_MENSUAL' | 'PARTICULAR_DIARIO' | 'BENEFICIARIO_EPS';
  estadoMembresia?: 'ACTIVO' | 'VENCIDO' | 'BLOQUEADO';
  tipoMembresia?: 'MENSUAL' | 'TRIMESTRAL' | 'SEMESTRAL' | 'ANUAL';
  estadoContrato?: 'ACTIVO' | 'FINALIZADO' | 'BLOQUEADO' | 'CANCELADO_ANTICIPADAMENTE';
  contrato?: {
    id: number;
    fechaInicio: string;
    fechaVencimiento: string;
    tipoMembresia: string;
    estado: string;
  } | null;
  remision?: {
    id: number;
    sesionesAutorizadas: number;
    sesionesAsistidas: number;
  } | null;
  horaIngreso?: string;
  horaExpiracion?: string;
}

export interface Progreso {
  pesoPerdido: number;
  imcActual: number;
  porcentajeGrasaActual: number;
  mensaje: string;
}

export interface MiRutina {
  idRutina: number;
  nombre: string;
  descripcion: string;
  fechaCreacion: string;
  fechaVencimiento: string;
  activa: boolean;
}

export interface MiEvaluacion {
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

export interface MiAsistencia {
  id: number;
  fechaIngreso: string;
  horaIngreso: string;
}

export interface HorarioDisponible {
  idHorario: number;
  fechaDisponible: string;
  horaInicio: string;
  horaFin: string;
  entrenador: string;
}

export interface SolicitudPlus {
  id: number;
  fechaSolicitud: string;
  estado: 'PENDIENTE' | 'APROBADA' | 'RECHAZADA';
  observacion?: string;
  fechaRespuesta?: string;
  entrenadorAsignado?: { nombreCompleto: string } | null;
}

export interface Mensaje {
  id: number;
  contenido: string;
  fechaEnvio: string;
  horaEnvio: string;
  leido: boolean;
  entrenador?: { nombreCompleto: string } | null;
}

export interface SolicitudBaja {
  id: number;
  fechaSolicitud: string;
  horaSolicitud: string;
  motivo: string;
  estado: 'PENDIENTE' | 'APROBADA' | 'RECHAZADA';
  observacionAdmin?: string | null;
  fechaRespuesta?: string | null;
}

export const miPerfil = () => api.get<ApiResponse<MiPerfil>>('/cliente/perfil').then(unwrap);

export const miProgreso = () => api.get<ApiResponse<Progreso>>('/cliente/progreso').then(unwrap);

export const misRutinas = () => api.get<ApiResponse<MiRutina[]>>('/cliente/rutinas').then(unwrap);

export const misEvaluaciones = () => api.get<ApiResponse<MiEvaluacion[]>>('/cliente/evaluaciones').then(unwrap);

export const misAsistencias = () => api.get<ApiResponse<MiAsistencia[]>>('/cliente/asistencias').then(unwrap);

export const misHorariosDisponibles = () =>
  api.get<ApiResponse<HorarioDisponible[]>>('/cliente/horarios-disponibles').then(unwrap);

export const reservarHorario = (idHorario: number) =>
  api.post<ApiResponse<HorarioDisponible>>(`/cliente/horarios/${idHorario}/reservar`).then(unwrap);

export const misSolicitudesPlus = () =>
  api.get<ApiResponse<SolicitudPlus[]>>('/cliente/solicitud-plus').then(unwrap);

export const solicitarPlus = (observacion?: string) =>
  api.post<ApiResponse<SolicitudPlus>>('/cliente/solicitud-plus', { observacion }).then(unwrap);

// ─── Mensajes del entrenador (GE-0009) ──────────────────────────────

export const misMensajes = () =>
  api.get<ApiResponse<Mensaje[]>>('/cliente/mensajes').then(unwrap);

export const marcarMensajeLeido = (idMensaje: number) =>
  api.put<ApiResponse<Mensaje>>(`/cliente/mensajes/${idMensaje}/leido`).then(unwrap);

// ─── Solicitud de baja voluntaria (CLT-0005) ────────────────────────

export const misSolicitudesBaja = () =>
  api.get<ApiResponse<SolicitudBaja[]>>('/cliente/solicitud-baja').then(unwrap);

export const solicitarBaja = (motivo: string) =>
  api.post<ApiResponse<SolicitudBaja>>('/cliente/solicitud-baja', { motivo }).then(unwrap);