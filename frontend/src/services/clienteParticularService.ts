import api from './api';
import { type ApiResponse, unwrap } from './apiTypes';

// Clientes Particulares Mensuales
export interface ParticularMensual {
  id: number;
  tipoDeDocumento: string;
  numeroDeDocumento: number;
  nombreCompleto: string;
  fechaDeNacimiento: string;
  telefono: number;
  correoElectronico: string;
  estado: boolean;
  estadoMembresia: 'ACTIVO' | 'VENCIDO' | 'BLOQUEADO';
  tipoMembresia: 'MENSUAL' | 'TRIMESTRAL' | 'SEMESTRAL' | 'ANUAL';
  fechaVencimiento: string;
}

// Clientes Particulares Diarios
export interface ParticularDiario {
  id: number;
  tipoDeDocumento: string;
  numeroDeDocumento: number;
  nombreCompleto: string;
  fechaDeNacimiento?: string;
  telefono?: number;
  correoElectronico?: string;
  estado: boolean;
  horaIngreso: string;
  horaExpiracion: string;
  estadoAcceso: 'ACTIVO' | 'EXPIRADO';
}

// Beneficiarios EPS
export interface BeneficiarioEps {
  id: number;
  tipoDeDocumento: string;
  numeroDeDocumento: number;
  nombreCompleto: string;
  fechaDeNacimiento: string;
  telefono: number;
  correoElectronico: string;
  estado: boolean;
  entidadEps: string;
  sesionesAutorizadas: number;
  sesionesAsistidas: number;
  diagnostico: string;
  zonaCuerpoTratar: string;
  medicoRemitente: string;
  estadoContrato: 'ACTIVO' | 'FINALIZADO' | 'BLOQUEADO' | 'CANCELADO_ANTICIPADAMENTE';
}

// Asistencia / Registro de Ingreso: ver secretariaService (POST /acceso/registrar-ingreso)

export interface ClienteMensualDTO {
  tipoDeDocumento: string;
  numeroDeDocumento: number;
  nombreCompleto: string;
  fechaDeNacimiento: string;
  telefono: number;
  correoElectronico: string;
  contrasena: string;
  tipoMembresia: 'MENSUAL' | 'TRIMESTRAL' | 'SEMESTRAL' | 'ANUAL';
}

export interface ClienteDiarioDTO {
  tipoDeDocumento: string;
  numeroDeDocumento: number;
  nombreCompleto: string;
  fechaDeNacimiento?: string;
  telefono?: number;
  correoElectronico?: string;
  contrasena?: string;
}

export interface BeneficiarioEpsDTO {
  tipoDeDocumento: string;
  numeroDeDocumento: number;
  nombreCompleto: string;
  fechaDeNacimiento: string;
  telefono: number;
  correoElectronico: string;
  contrasena: string;
  tieneEntrenadorPermanente?: boolean;
  fechaFin: string;
  sesionesAutorizadas: number;
  medicoRemitente: string;
  entidadEps: string;
  diagnostico: string;
  zonaCuerpoTratar: string;
}

// ─── CLIENTES PARTICULARES MENSUALES ───
export const listarClientesMensuales = () =>
  api.get<ApiResponse<ParticularMensual[]>>('/clientes/mensuales/todos').then(unwrap);

export const buscarClienteMensual = (numeroDocumento: number) =>
  api.get<ApiResponse<ParticularMensual>>(`/clientes/mensual/${numeroDocumento}`).then(unwrap);

export const crearClienteMensual = (data: ClienteMensualDTO) =>
  api.post<ApiResponse<ParticularMensual>>('/clientes/mensual', data).then(unwrap);

export const actualizarClienteMensual = (numeroDocumento: number, data: Partial<ClienteMensualDTO>) =>
  api.put<ApiResponse<ParticularMensual>>(`/clientes/mensual/${numeroDocumento}`, data).then(unwrap);

export const desactivarClienteMensual = (numeroDocumento: number) =>
  api.delete<ApiResponse<void>>(`/clientes/mensual/${numeroDocumento}`);

export const reactivarClienteMensual = (numeroDocumento: number) =>
  api.put<ApiResponse<ParticularMensual>>(`/clientes/mensual/${numeroDocumento}/reactivar`).then(unwrap);

// ─── CLIENTES PARTICULARES DIARIOS ───
export const listarClientesDiarios = () =>
  api.get<ApiResponse<ParticularDiario[]>>('/clientes/diarios/todos').then(unwrap);

export const buscarClienteDiario = (numeroDocumento: number) =>
  api.get<ApiResponse<ParticularDiario>>(`/clientes/diario/${numeroDocumento}`).then(unwrap);

export const crearClienteDiario = (data: ClienteDiarioDTO) =>
  api.post<ApiResponse<ParticularDiario>>('/clientes/diario', data).then(unwrap);

export const actualizarClienteDiario = (numeroDocumento: number, data: Partial<ClienteDiarioDTO>) =>
  api.put<ApiResponse<ParticularDiario>>(`/clientes/diario/${numeroDocumento}`, data).then(unwrap);

export const desactivarClienteDiario = (numeroDocumento: number) =>
  api.delete<ApiResponse<void>>(`/clientes/diario/${numeroDocumento}`);

export const reactivarClienteDiario = (numeroDocumento: number) =>
  api.put<ApiResponse<ParticularDiario>>(`/clientes/diario/${numeroDocumento}/reactivar`).then(unwrap);

// ─── BENEFICIARIOS EPS ───
export const listarBeneficiariosEps = () =>
  api.get<ApiResponse<BeneficiarioEps[]>>('/clientes/eps/todos').then(unwrap);

export const buscarBeneficiarioEps = (numeroDocumento: number) =>
  api.get<ApiResponse<BeneficiarioEps>>(`/clientes/eps/${numeroDocumento}`).then(unwrap);

export const crearBeneficiarioEps = (data: BeneficiarioEpsDTO) =>
  api.post<ApiResponse<BeneficiarioEps>>('/clientes/eps', data).then(unwrap);

export const actualizarBeneficiarioEps = (numeroDocumento: number, data: Partial<BeneficiarioEpsDTO>) =>
  api.put<ApiResponse<BeneficiarioEps>>(`/clientes/eps/${numeroDocumento}`, data).then(unwrap);

export const desactivarBeneficiarioEps = (numeroDocumento: number) =>
  api.delete<ApiResponse<void>>(`/clientes/eps/${numeroDocumento}`);

export const reactivarBeneficiarioEps = (numeroDocumento: number) =>
  api.put<ApiResponse<BeneficiarioEps>>(`/clientes/eps/${numeroDocumento}/reactivar`).then(unwrap);


