import type { UsuarioSistema } from '../services/usuarioSistemaService';

export const ROL_LIMITS: Record<UsuarioSistema['rol'], number> = {
  ADMINISTRADOR: 1,
  SECRETARIA: 2,
  ENTRENADOR: 3,
};

export function cupoDisponible(
  rol: UsuarioSistema['rol'],
  usuarios: UsuarioSistema[],
  excluirId?: number
): boolean {
  const activos = usuarios.filter(
    (u) =>
      u.rol === rol &&
      u.estado &&
      (excluirId === undefined || u.idUsuarioSistema !== excluirId)
  );
  if (rol === 'ADMINISTRADOR') {
    const totalAdmin = usuarios.filter(
      (u) => u.rol === 'ADMINISTRADOR' && (excluirId === undefined || u.idUsuarioSistema !== excluirId)
    );
    return totalAdmin.length < ROL_LIMITS.ADMINISTRADOR;
  }
  return activos.length < ROL_LIMITS[rol];
}

export function mensajeCupo(rol: UsuarioSistema['rol']): string {
  const max = ROL_LIMITS[rol];
  if (rol === 'ADMINISTRADOR') return 'Solo se permite 1 administrador (ya existe)';
  return `Cupo de ${rol.toLowerCase()} completado (máximo ${max})`;
}
