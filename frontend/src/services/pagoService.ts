import api from './api';
import { type ApiResponse, unwrap } from './apiTypes';

export type MetodoPago = 'EFECTIVO' | 'TARJETA_DEBITO' | 'TARJETA_CREDITO' | 'TRANSFERENCIA';
export type TipoPago = 'MEMBRESIA' | 'COPAGO' | 'PLUS' | 'DIARIO' | 'EPS';

export interface Pago {
  id: number;
  fechaPago: string;
  valor: number;
  metodoPago: MetodoPago;
  tipoPago: TipoPago;
  estadoPago: 'EXITOSO' | 'FALLIDO' | 'PENDIENTE';
}

export interface GastoOperativo {
  id: number;
  fecha: string;
  descripcion: string;
  valor: number;
  tipoGasto: string;
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

// ─── Pagos ──────────────────────────────────────────────────────────
// El backend valida el valor contra la tarifa vigente y lo rechaza si no
// coincide, asi que hay que enviar el monto exacto.

export const registrarPagoMensualidad = (numeroDocumento: number, metodoPago: MetodoPago, valor: number) =>
  api.post<ApiResponse<Pago>>(`/pagos/mensualidad/${numeroDocumento}`, { metodoPago, valor }).then(unwrap);

export const registrarPagoDiario = (numeroDocumento: number, metodoPago: MetodoPago, valor: number) =>
  api.post<ApiResponse<Pago>>(`/pagos/diario/${numeroDocumento}`, { metodoPago, valor }).then(unwrap);
export const registrarCopagoEps = (numeroDocumento: number, metodoPago: MetodoPago, valor: number) =>
  api.post<ApiResponse<Pago>>(`/pagos/copago-eps/${numeroDocumento}`, { metodoPago, valor }).then(unwrap);

export const registrarPagoPlus = (numeroDocumento: number, metodoPago: MetodoPago, valor: number) =>
  api.post<ApiResponse<Pago>>(`/pagos/plus/${numeroDocumento}`, { metodoPago, valor }).then(unwrap);

export const pagosDeCliente = (numeroDocumento: number) =>
  api.get<ApiResponse<Pago[]>>(`/pagos/cliente/${numeroDocumento}`).then(unwrap);

/** Tarifas vigentes en solo lectura (admin y secretaria). */
export interface TarifaVigente {
  tipoDeCliente: 'PARTICULAR_MENSUAL' | 'PARTICULAR_DIARIO' | 'BENEFICIARIO_EPS';
  valorMensual: number;
  valorDiario: number;
  valorPlus: number;
}

export const listarTarifasVigentes = () =>
  api.get<ApiResponse<TarifaVigente[]>>('/pagos/tarifas').then(unwrap);

// ─── Gastos ─────────────────────────────────────────────────────────

export const registrarArriendo = (valor: number, descripcion: string) =>
  api.post<ApiResponse<GastoOperativo>>('/pagos/arriendo', { valor, descripcion }).then(unwrap);

export const registrarNomina = (documentoEntrenador: number, valor: number, descripcion: string) =>
  api.post<ApiResponse<GastoOperativo>>(`/pagos/nomina/${documentoEntrenador}`, { valor, descripcion }).then(unwrap);

export const registrarMantenimiento = (idEquipo: number, valor: number, descripcion: string) =>
  api.post<ApiResponse<GastoOperativo>>(`/pagos/mantenimiento/${idEquipo}`, { valor, descripcion }).then(unwrap);

/** Gastos operativos de una fecha (por defecto, hoy). Solo admin. */
export const gastosDelDia = (fecha?: string) =>
  api.get<ApiResponse<GastoOperativo[]>>('/pagos/gastos', { params: { fecha } }).then(unwrap);

// ─── Flujo de caja ──────────────────────────────────────────────────

/** Consolida pagos y gastos de una fecha. Solo admin; falla si ya existe. */
export const generarFlujoCaja = (fecha?: string) =>
  api.post<ApiResponse<FlujoCaja>>('/pagos/flujo-caja', null, { params: { fecha } }).then(unwrap);

export const consultarFlujoCaja = (fecha: string) =>
  api.get<ApiResponse<FlujoCaja>>('/admin/flujo-caja', { params: { fecha } }).then(unwrap);