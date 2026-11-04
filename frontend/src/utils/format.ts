/**
 * Formato de fechas, horas y moneda para la interfaz.
 *
 * El backend devuelve fechas como cadena ISO local (`YYYY-MM-DD` o
 * `YYYY-MM-DDTHH:mm:ss`). No se parsean con `new Date(...)` directamente
 * porque el navegador las interpreta en UTC y puede correr un día el
 * resultado. Aquí se construye la fecha en zona local.
 */

function esFechaISO(valor: string): boolean {
  return /^\d{4}-\d{2}-\d{2}/.test(valor);
}

function parsearLocal(valor: string): Date {
  const [fecha, hora] = valor.split('T');
  const [anio, mes, dia] = fecha.split('-').map(Number);
  const [hh, mm, ss] = (hora ?? '00:00:00').split(':').map(Number);
  return new Date(anio, mes - 1, dia, hh || 0, mm || 0, ss || 0);
}

const MES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/** `2026-11-03` → `3 nov 2026`. Si no es fecha, devuelve el valor tal cual. */
export function formatearFecha(valor?: string | null): string {
  if (!valor) return '—';
  if (!esFechaISO(valor)) return valor;
  const f = parsearLocal(valor);
  return `${f.getDate()} ${MES[f.getMonth()]} ${f.getFullYear()}`;
}

/** `08:00:00` → `08:00`. */
export function formatearHora(valor?: string | null): string {
  if (!valor) return '—';
  const m = valor.match(/^(\d{2}):(\d{2})/);
  return m ? `${m[1]}:${m[2]}` : valor;
}

/** `08:00:00` con fecha `2026-11-03` → `3 nov · 08:00`. */
export function formatearFechaHora(fecha?: string | null, hora?: string | null): string {
  return `${formatearFecha(fecha)} · ${formatearHora(hora)}`;
}

const MONEDA = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

/** `85000` → `$85.000`. */
export function formatearMoneda(valor?: number | null): string {
  if (valor == null || Number.isNaN(valor)) return '—';
  return MONEDA.format(valor);
}

/** Fecha de hoy en formato `YYYY-MM-DD` para inputs `type="date"`. */
export function hoyISO(): string {
  const f = new Date();
  const mm = String(f.getMonth() + 1).padStart(2, '0');
  const dd = String(f.getDate()).padStart(2, '0');
  return `${f.getFullYear()}-${mm}-${dd}`;
}

/** Número entero con separador de miles. `300000001` → `300.000.001`. */
export function formatearNumero(valor?: number | null): string {
  if (valor == null || Number.isNaN(valor)) return '—';
  return new Intl.NumberFormat('es-CO').format(valor);
}
