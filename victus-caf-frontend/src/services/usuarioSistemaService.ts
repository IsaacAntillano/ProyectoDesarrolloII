import api from './api';
import { type ApiResponse, unwrap } from './apiTypes';

// Esta interfaz debe ser exportada
export interface UsuarioSistema {
  idUsuarioSistema: number;
  tipoDeDocumento: string;
  numeroDeDocumento: number;
  nombreCompleto: string;
  telefono: number;
  correoElectronico: string;
  rol: 'ADMINISTRADOR' | 'ENTRENADOR' | 'SECRETARIA';
  estado: boolean;
  contrasena?: string;
}

export type UsuarioSistemaInput = {
  tipoDeDocumento: string;
  numeroDeDocumento: number;
  nombreCompleto: string;
  telefono: number;
  correoElectronico: string;
  rol: UsuarioSistema['rol'];
  contrasena?: string;
};

export const listarUsuarios = () =>
  api.get<ApiResponse<UsuarioSistema[]>>('/usuarios-sistema').then(unwrap);

export const buscarUsuarioPorDocumento = (documento: number) =>
  api.get<ApiResponse<UsuarioSistema>>('/usuarios-sistema/buscar', { params: { documento } }).then(unwrap);

export const crearUsuario = (data: UsuarioSistemaInput & { contrasena: string }) =>
  api.post<ApiResponse<UsuarioSistema>>('/usuarios-sistema', data).then(unwrap);

export const actualizarUsuario = (id: number, data: UsuarioSistemaInput) =>
  api.put<ApiResponse<UsuarioSistema>>(`/usuarios-sistema/${id}`, data).then(unwrap);

export const desactivarUsuario = (id: number) =>
  api.delete<ApiResponse<void>>(`/usuarios-sistema/${id}`);

export const reactivarUsuario = (id: number) =>
  api.patch<ApiResponse<UsuarioSistema>>(`/usuarios-sistema/${id}/reactivar`).then(unwrap);