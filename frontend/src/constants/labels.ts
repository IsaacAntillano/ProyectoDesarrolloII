/**
 * Etiquetas en español para los enums del backend.
 *
 * Una sola fuente de verdad: ninguna página traduce enums con `replaceAll`.
 * Ojo con `CANCELADO_ANCTICIPADAMENTE`: el valor conserva el typo histórico
 * del backend (verificado en la base de datos), solo se corrige la etiqueta.
 */
import type { TipoDeCliente } from '../services/adminService';

export const ETIQUETA_TIPO_CLIENTE: Record<TipoDeCliente, string> = {
  PARTICULAR_MENSUAL: 'Particular mensual',
  PARTICULAR_DIARIO: 'Particular diario',
  BENEFICIARIO_EPS: 'Beneficiario EPS',
};

export const ETIQUETA_TIPO_CLIENTE_CORTA: Record<TipoDeCliente, string> = {
  PARTICULAR_MENSUAL: 'Mensual',
  PARTICULAR_DIARIO: 'Diario',
  BENEFICIARIO_EPS: 'EPS',
};

export const ETIQUETA_ROL: Record<string, string> = {
  ADMINISTRADOR: 'Administrador',
  SECRETARIA: 'Secretaria',
  ENTRENADOR: 'Entrenador',
  CLIENTE: 'Cliente',
};

export const ETIQUETA_ESTADO_EQUIPO: Record<string, string> = {
  OPERATIVO: 'Operativo',
  EN_MANTENIMIENTO: 'En mantenimiento',
  DADO_DE_BAJA: 'Dado de baja',
};

export const ETIQUETA_METODO_PAGO: Record<string, string> = {
  EFECTIVO: 'Efectivo',
  TARJETA_DEBITO: 'Tarjeta débito',
  TARJETA_CREDITO: 'Tarjeta crédito',
  TRANSFERENCIA: 'Transferencia',
};

export const ETIQUETA_TIPO_PAGO: Record<string, string> = {
  MEMBRESIA: 'Mensualidad',
  DIARIO: 'Acceso diario',
  COPAGO: 'Copago EPS',
  PLUS: 'Entrenador Plus',
};

export const ETIQUETA_ESTADO_PAGO: Record<string, string> = {
  EXITOSO: 'Exitoso',
  FALLIDO: 'Fallido',
  PENDIENTE: 'Pendiente',
};

export const ETIQUETA_TIPO_GASTO: Record<string, string> = {
  NOMINA: 'Nómina',
  ARRIENDO: 'Arriendo',
  MANTENIMIENTO: 'Mantenimiento',
};

export const ETIQUETA_ESTADO_SOLICITUD: Record<string, string> = {
  PENDIENTE: 'Pendiente',
  APROBADA: 'Aprobada',
  RECHAZADA: 'Rechazada',
};

export const ETIQUETA_ORIGEN_ASIGNACION: Record<string, string> = {
  PRIMER_MES: 'Primer mes',
  PLUS: 'Servicio Plus',
};

export const ETIQUETA_TIPO_MEMBRESIA: Record<string, string> = {
  MENSUAL: 'Mensual',
  TRIMESTRAL: 'Trimestral',
  SEMESTRAL: 'Semestral',
  ANUAL: 'Anual',
};

export const ETIQUETA_ESTADO_MEMBRESIA: Record<string, string> = {
  ACTIVO: 'Activo',
  VENCIDO: 'Vencido',
  BLOQUEADO: 'Bloqueado',
};

export const ETIQUETA_ESTADO_CONTRATO: Record<string, string> = {
  ACTIVO: 'Activo',
  VENCIDO: 'Vencido',
  POR_RENOVAR: 'Por renovar',
};

export const ETIQUETA_ESTADO_EPS: Record<string, string> = {
  ACTIVO: 'Activo',
  BLOQUEADO: 'Bloqueado',
  FINALIZADO: 'Finalizado',
  // El valor guardado conserva el typo histórico del enum; la etiqueta no.
  CANCELADO_ANCTICIPADAMENTE: 'Cancelado anticipadamente',
};

/** Etiqueta de un enum con respaldo al valor crudo si no está mapeado. */
export function etiqueta(
  mapa: Record<string, string>,
  valor?: string | null,
  respaldo = '—'
): string {
  if (!valor) return respaldo;
  return mapa[valor] ?? valor.replaceAll('_', ' ');
}
