import api from './api';
import { type ApiResponse, unwrap } from './apiTypes';
import { getApiErrorMessage } from '../utils/apiError';

export { getApiErrorMessage };

// ─── Tipos ──────────────────────────────────────────────────────────
// `ParticularMensual`, `ParticularDiario` y `BeneficiarioEps` son las tres
// especializaciones de Usuario que expone el backend. `ClienteBase` es el
// alias plano que necesitan las vistas de gestion, donde no importa la
// especializacion concreta.

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

/** Vista plana para listados que no distinguen tipo (GestionClientes). */
export interface ClienteBase {
  id: number;
  tipoDeDocumento: string;
  numeroDeDocumento: number;
  nombreCompleto: string;
  fechaDeNacimiento?: string;
  // Opcional: los clientes diarios pueden registrarse sin telefono ni correo.
  telefono?: number;
  correoElectronico?: string;
  estado?: boolean;
  tipoDeCliente?: string;
  estadoMembresia?: string;
  estadoContrato?: string;
  tieneEntrenador?: boolean;
  tieneEntrenadorPermanente?: boolean;
}

// ─── Contratos ──────────────────────────────────────────────────────

export interface Contrato {
  id: number;
  fechaInicio: string;
  fechaVencimiento: string;
  tipoMembresia: 'MENSUAL' | 'TRIMESTRAL' | 'SEMESTRAL' | 'ANUAL';
  estado: 'ACTIVO' | 'VENCIDO' | 'POR_RENOVAR';
}

export interface ContratoVencido {
  idContrato: number;
  numeroDocumento: number;
  nombreCompleto: string;
  tipoMembresia: Contrato['tipoMembresia'];
  fechaInicio: string;
  fechaVencimiento: string;
  diasVencido: number;
}

// ─── DTOs de entrada ────────────────────────────────────────────────

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

/**
 * El backend exige todos estos campos (`@NotNull` / `@NotBlank` en
 * ClienteDiarioDTO), asi que aca son obligatorios aunque el tipo sea parcial
 * para permitir actualizaciones parciales.
 */
export interface ClienteDiarioDTO {
  tipoDeDocumento: string;
  numeroDeDocumento: number;
  nombreCompleto: string;
  fechaDeNacimiento: string;
  telefono: number;
  correoElectronico: string;
  contrasena: string;
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

/** Actualizacion parcial. El backend acepta todos los campos opcionales. */
export interface ActualizarClienteDTO {
  nombreCompleto?: string;
  fechaDeNacimiento?: string;
  telefono?: number;
  correoElectronico?: string;
  contrasena?: string;
  tipoMembresia?: 'MENSUAL' | 'TRIMESTRAL' | 'SEMESTRAL' | 'ANUAL';
}

// ─── Listados ───────────────────────────────────────────────────────
// Listados planos para vistas de gestion (GestionClientes), donde no importa
// la especializacion.

export const listarMensualesActivos = () =>
  api.get<ApiResponse<ClienteBase[]>>('/clientes/mensuales/activos').then(unwrap);

export const listarMensualesTodos = () =>
  api.get<ApiResponse<ClienteBase[]>>('/clientes/mensuales/todos').then(unwrap);

export const listarDiariosActivos = () =>
  api.get<ApiResponse<ClienteBase[]>>('/clientes/diarios/activos').then(unwrap);

export const listarDiariosTodos = () =>
  api.get<ApiResponse<ClienteBase[]>>('/clientes/diarios/todos').then(unwrap);

export const listarEpsActivos = () =>
  api.get<ApiResponse<ClienteBase[]>>('/clientes/eps/activos').then(unwrap);

export const listarEpsTodos = () =>
  api.get<ApiResponse<ClienteBase[]>>('/clientes/eps/todos').then(unwrap);

// Listados tipados por especializacion, para vistas que muestran los campos
// propios de cada tipo (SecretariaDashboard).

export const listarParticularesMensuales = () =>
  api.get<ApiResponse<ParticularMensual[]>>('/clientes/mensuales/todos').then(unwrap);

export const listarParticularesDiarios = () =>
  api.get<ApiResponse<ParticularDiario[]>>('/clientes/diarios/todos').then(unwrap);

export const listarBeneficiariosEps = () =>
  api.get<ApiResponse<BeneficiarioEps[]>>('/clientes/eps/todos').then(unwrap);

// ─── Particulares mensuales ─────────────────────────────────────────

export const buscarClienteMensual = (numeroDocumento: number) =>
  api.get<ApiResponse<ParticularMensual>>(`/clientes/mensual/${numeroDocumento}`).then(unwrap);

export const crearClienteMensual = (data: ClienteMensualDTO) =>
  api.post<ApiResponse<ParticularMensual>>('/clientes/mensual', data).then(unwrap);

export const actualizarClienteMensual = (
  numeroDocumento: number,
  data: ActualizarClienteDTO
) =>
  api
    .put<ApiResponse<ParticularMensual>>(`/clientes/mensual/${numeroDocumento}`, data)
    .then(unwrap);

export const desactivarClienteMensual = (numeroDocumento: number) =>
  api.delete<ApiResponse<void>>(`/clientes/mensual/${numeroDocumento}`);

export const reactivarClienteMensual = (numeroDocumento: number) =>
  api
    .put<ApiResponse<ParticularMensual>>(`/clientes/mensual/${numeroDocumento}/reactivar`)
    .then(unwrap);

// ─── Particulares diarios ───────────────────────────────────────────

export const buscarClienteDiario = (numeroDocumento: number) =>
  api.get<ApiResponse<ParticularDiario>>(`/clientes/diario/${numeroDocumento}`).then(unwrap);

export const crearClienteDiario = (data: ClienteDiarioDTO) =>
  api.post<ApiResponse<ParticularDiario>>('/clientes/diario', data).then(unwrap);

export const actualizarClienteDiario = (numeroDocumento: number, data: ActualizarClienteDTO) =>
  api.put<ApiResponse<ParticularDiario>>(`/clientes/diario/${numeroDocumento}`, data).then(unwrap);

export const desactivarClienteDiario = (numeroDocumento: number) =>
  api.delete<ApiResponse<void>>(`/clientes/diario/${numeroDocumento}`);

export const reactivarClienteDiario = (numeroDocumento: number) =>
  api
    .put<ApiResponse<ParticularDiario>>(`/clientes/diario/${numeroDocumento}/reactivar`)
    .then(unwrap);

// ─── Beneficiarios EPS ──────────────────────────────────────────────

export const buscarBeneficiarioEps = (numeroDocumento: number) =>
  api.get<ApiResponse<BeneficiarioEps>>(`/clientes/eps/${numeroDocumento}`).then(unwrap);

export const crearBeneficiarioEps = (data: BeneficiarioEpsDTO) =>
  api.post<ApiResponse<BeneficiarioEps>>('/clientes/eps', data).then(unwrap);

export const actualizarBeneficiarioEps = (numeroDocumento: number, data: ActualizarClienteDTO) =>
  api.put<ApiResponse<BeneficiarioEps>>(`/clientes/eps/${numeroDocumento}`, data).then(unwrap);

export const desactivarBeneficiarioEps = (numeroDocumento: number) =>
  api.delete<ApiResponse<void>>(`/clientes/eps/${numeroDocumento}`);

export const reactivarBeneficiarioEps = (numeroDocumento: number) =>
  api
    .put<ApiResponse<BeneficiarioEps>>(`/clientes/eps/${numeroDocumento}/reactivar`)
    .then(unwrap);

export const cancelarBeneficiarioEps = (numeroDocumento: number, motivo: string) =>
  api
    .put<ApiResponse<BeneficiarioEps>>(`/clientes/eps/${numeroDocumento}/cancelar`, { motivo })
    .then(unwrap);

/** Asigna o cambia el entrenador de cualquier tipo de cliente (solo admin). */
export const asignarEntrenadorCliente = (numeroDocumento: number, documentoEntrenador: number) =>
  api
    .put<ApiResponse<ClienteBase>>(`/clientes/${numeroDocumento}/entrenador`, { documentoEntrenador })
    .then(unwrap);

export const asignarEntrenadorEps = (numeroDocumento: number, documentoEntrenador: number) =>
  api
    .put<ApiResponse<BeneficiarioEps>>(
      `/clientes/eps/${numeroDocumento}/entrenador/${documentoEntrenador}`
    )
    .then(unwrap);

export const liberarEntrenadorEps = (numeroDocumento: number) =>
  api
    .delete<ApiResponse<BeneficiarioEps>>(`/clientes/eps/${numeroDocumento}/entrenador`)
    .then(unwrap);

// ─── Contratos ──────────────────────────────────────────────────────

export const consultarContratoMensual = (numeroDocumento: number) =>
  api.get<ApiResponse<Contrato>>(`/clientes/mensual/${numeroDocumento}/contrato`).then(unwrap);

export const listarContratosVencidos = () =>
  api.get<ApiResponse<ContratoVencido[]>>('/clientes/contratos/vencidos').then(unwrap);

// ─── Migración diario -> mensual ────────────────────────────────────

export interface MigracionDTO {
  correoElectronico: string;
  contrasena: string;
  tipoMembresia: 'MENSUAL' | 'TRIMESTRAL' | 'SEMESTRAL' | 'ANUAL';
}

export const migrarDiarioAMensual = (numeroDocumento: number, data: MigracionDTO) =>
  api.post<ApiResponse<ParticularMensual>>(`/clientes/diario/migrar/${numeroDocumento}`, data).then(unwrap);