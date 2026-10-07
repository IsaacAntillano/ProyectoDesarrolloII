import api from './api';
import { type ApiResponse, unwrap } from './apiTypes';

export interface Secretaria {
  idUsuarioSistema: number;
  tipoDeDocumento: string;
  numeroDeDocumento: number;
  nombreCompleto: string;
  telefono: number;
  correoElectronico: string;
  rol: 'SECRETARIA';
  estado: boolean;
  turno?: string;
  contrasena?: string;
}

export interface SecretariaInput {
  tipoDeDocumento: string;
  numeroDeDocumento: number;
  nombreCompleto: string;
  telefono: number;
  correoElectronico: string;
  contrasena?: string;
  turno?: string;
}

export interface Asistencia {
  id: number;
  fechaIngreso: string;
  horaIngreso: string;
  usuario?: {
    idUsuarioSistema: number;
    nombreCompleto: string;
    numeroDeDocumento: number;
  };
}

export interface RegistroIngresoDTO {
  numeroDocumento: number;
}

// Secretarias CRUD
export const listarSecretarias = () =>
  api.get<ApiResponse<Secretaria[]>>('/usuarios-sistema').then(unwrap);

export const buscarSecretariaPorDocumento = (documento: number) =>
  api.get<ApiResponse<Secretaria>>('/usuarios-sistema/buscar', { params: { documento } }).then(unwrap);

export const crearSecretaria = (data: SecretariaInput & { contrasena: string }) =>
  api.post<ApiResponse<Secretaria>>('/usuarios-sistema', { ...data, rol: 'SECRETARIA' }).then(unwrap);

export const actualizarSecretaria = (id: number, data: SecretariaInput) =>
  api.put<ApiResponse<Secretaria>>(`/usuarios-sistema/${id}`, { ...data, rol: 'SECRETARIA' }).then(unwrap);

export const desactivarSecretaria = (id: number) =>
  api.delete<ApiResponse<void>>(`/usuarios-sistema/${id}`);

export const reactivarSecretaria = (id: number) =>
  api.patch<ApiResponse<Secretaria>>(`/usuarios-sistema/${id}/reactivar`).then(unwrap);

// Registros de ingreso
export const registrarIngreso = (numeroDocumento: number) =>
  api.post<ApiResponse<Asistencia>>('/acceso/registrar-ingreso', { numeroDocumento }).then(unwrap);
