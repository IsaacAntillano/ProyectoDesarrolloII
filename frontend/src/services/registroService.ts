import api from './api';
import { type ApiResponse, unwrap } from './apiTypes';
import type { ClienteMensualDTO } from './clienteService';

/** Registro público de particular mensual (CO-0001). Sin autenticación. */
export const registroCliente = (data: ClienteMensualDTO) =>
  api.post<ApiResponse<void>>('/auth/registro-cliente', data).then(unwrap);
