import api from './api';
import { type ApiResponse, unwrap } from './apiTypes';

export type TipoDeCliente = 'PARTICULAR_MENSUAL' | 'PARTICULAR_DIARIO' | 'BENEFICIARIO_EPS';

export interface Tarifa {
  id: number;
  tipoDeCliente: TipoDeCliente;
  valorMensual: number;
  valorDiario: number;
  valorPlus: number;
  fechaUltimaModificacion: string;
  idAdminModificador: number;
}

export interface TarifaUpdateDTO {
  tipoDeCliente: TipoDeCliente;
  valorMensual: number;
  valorDiario: number;
  valorPlus: number;
  idAdminModificador: number;
}

export interface Equipo {
  idEquipo: number;
  nombre: string;
  descripcion?: string;
  fechaAdquisicion: string;
  estadoEquipo: 'OPERATIVO' | 'EN_MANTENIMIENTO' | 'DADO_DE_BAJA';
  proximoMantenimiento: string;
}

export interface EquipoDTO {
  nombre: string;
  descripcion?: string;
  fechaAdquisicion: string;
  estadoEquipo: Equipo['estadoEquipo'];
  proximoMantenimiento: string;
}

export interface FlujoCaja {
  fecha: string;
  totalIngresoParticular: number;
  totalIngresoParticularDiario: number;
  totalIngresoCopagoEps: number;
  totalIngresoPlus: number;
  totalEgresosMantenimiento: number;
  totalEgresosNomina: number;
  totalEgresosArriendo: number;
  utilidadNeta: number;
}

export const listarTarifas = () => api.get<ApiResponse<Tarifa[]>>('/admin/tarifas').then(unwrap);
export const actualizarTarifa = (tipo: TipoDeCliente, data: TarifaUpdateDTO) =>
  api.put<ApiResponse<Tarifa>>(`/admin/tarifas/${tipo}`, data).then(unwrap);

export const listarEquipos = () => api.get<ApiResponse<Equipo[]>>('/admin/equipos').then(unwrap);
export const listarEquiposMantenimientoProximo = () =>
  api.get<ApiResponse<Equipo[]>>('/admin/equipos/mantenimiento-proximo').then(unwrap);
export const crearEquipo = (data: EquipoDTO) =>
  api.post<ApiResponse<Equipo>>('/admin/equipos', data).then(unwrap);

export const consultarFlujoCaja = (fecha: string) =>
  api.get<ApiResponse<FlujoCaja>>('/admin/flujo-caja', { params: { fecha } }).then(unwrap);

// ─── Factura EPS (PA-0009) ──────────────────────────────────────────

export interface FacturaEps {
  id: number;
  periodoConsolidado: string;
  fechaGeneracion: string;
  fechaRadicacion?: string | null;
  fechaPago?: string | null;
  valorTotal: number;
  entidadEps: string;
  estado: 'PENDIENTE' | 'RADICADA' | 'PAGADA';
}

export const generarFacturaEps = (periodo: string) =>
  api.post<ApiResponse<FacturaEps>>('/pagos/facturas-eps', null, { params: { periodo } }).then(unwrap);

export const listarFacturasEps = () =>
  api.get<ApiResponse<FacturaEps[]>>('/pagos/facturas-eps').then(unwrap);

// ─── Solicitudes de entrenador plus ─────────────────────────────────

export type EstadoSolicitudPlus = 'PENDIENTE' | 'APROBADA' | 'RECHAZADA';

export interface SolicitudPlus {
  id: number;
  fechaSolicitud: string;
  estado: EstadoSolicitudPlus;
  observacion?: string;
  fechaRespuesta?: string;
  cliente?: { numeroDocumento: number; nombreCompleto: string };
  entrenadorAsignado?: { nombreCompleto: string } | null;
}

export const listarSolicitudesPlus = (estado?: EstadoSolicitudPlus) =>
  api
    .get<ApiResponse<SolicitudPlus[]>>('/admin/solicitudes-plus', { params: { estado } })
    .then(unwrap);

export const aprobarSolicitudPlus = (id: number, documentoEntrenador?: number) =>
  api
    .put<ApiResponse<SolicitudPlus>>(`/admin/solicitudes-plus/${id}/aprobar`, {
      documentoEntrenador,
    })
    .then(unwrap);

export const rechazarSolicitudPlus = (id: number, observacion: string) =>
  api
    .put<ApiResponse<SolicitudPlus>>(`/admin/solicitudes-plus/${id}/rechazar`, { observacion })
    .then(unwrap);
