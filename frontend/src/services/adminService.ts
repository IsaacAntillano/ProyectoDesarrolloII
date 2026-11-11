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
  totalIngresoFacturaEps: number;
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

export interface PagoFacturaEps {
  id: number;
  fechaPago: string;
  valor: number;
  metodoPago: 'EFECTIVO' | 'TARJETA_DEBITO' | 'TARJETA_CREDITO' | 'TRANSFERENCIA';
  tipoPago: string;
  estadoPago: string;
}

export interface FacturaEpsDetalle {
  factura: FacturaEps;
  pagos: PagoFacturaEps[];
}

/** Detalle de una factura EPS con los pagos registrados (PA-0010). */
export const detalleFacturaEps = (id: number) =>
  api.get<ApiResponse<FacturaEpsDetalle>>(`/pagos/facturas-eps/${id}`).then(unwrap);

/** Marca la factura como radicada ante la EPS. */
export const radicarFacturaEps = (id: number) =>
  api.put<ApiResponse<FacturaEps>>(`/pagos/facturas-eps/${id}/radicar`).then(unwrap);

/** Registra el pago recibido de la EPS (PA-0013). */
export const pagarFacturaEps = (
  id: number,
  data: { fechaPago: string; metodoPago: PagoFacturaEps['metodoPago']; valor: number }
) => api.put<ApiResponse<FacturaEps>>(`/pagos/facturas-eps/${id}/pagar`, data).then(unwrap);

// ─── Horarios de beneficiarios EPS (GE-0006) ────────────────────────

export interface HorarioDisponibleEps {
  idHorario: number;
  fechaDisponible: string;
  horaInicio: string;
  horaFin: string;
  entrenador: string;
}

export const listarHorariosDisponiblesEps = (numeroDocumento: number) =>
  api
    .get<ApiResponse<HorarioDisponibleEps[]>>(`/admin/eps/${numeroDocumento}/horarios-disponibles`)
    .then(unwrap);

export const asignarHorarioEps = (numeroDocumento: number, idHorario: number) =>
  api
    .put<ApiResponse<void>>(`/admin/eps/${numeroDocumento}/horarios/${idHorario}`)
    .then(unwrap);

// ─── Solicitudes de baja voluntaria (CLT-0005) ──────────────────────

export type EstadoSolicitudBaja = 'PENDIENTE' | 'APROBADA' | 'RECHAZADA';

export interface SolicitudBaja {
  id: number;
  fechaSolicitud: string;
  horaSolicitud: string;
  motivo: string;
  estado: EstadoSolicitudBaja;
  observacionAdmin?: string | null;
  fechaRespuesta?: string | null;
  cliente?: { numeroDocumento: number; nombreCompleto: string } | null;
}

export const listarSolicitudesBaja = (estado?: EstadoSolicitudBaja) =>
  api
    .get<ApiResponse<SolicitudBaja[]>>('/admin/solicitudes-baja', { params: { estado } })
    .then(unwrap);

export const aprobarSolicitudBaja = (id: number, observacion?: string) =>
  api
    .put<ApiResponse<SolicitudBaja>>(`/admin/solicitudes-baja/${id}/aprobar`, { observacion })
    .then(unwrap);

export const rechazarSolicitudBaja = (id: number, observacion: string) =>
  api
    .put<ApiResponse<SolicitudBaja>>(`/admin/solicitudes-baja/${id}/rechazar`, { observacion })
    .then(unwrap);

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
