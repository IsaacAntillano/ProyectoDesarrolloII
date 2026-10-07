# Victus-Caf · Contexto del proyecto

> Punto de entrada para el asistente y para ti. Leer **primero** al iniciar
> cualquier sesión de trabajo.
> Estado vivo: [[estado-proyecto]] · Lienzo: [[lienzo-victus.canvas]] ·
> Registro: [[decisiones]] · Glosario: [[glosario]]

## Qué es

Sistema de gestión de gimnasio (Victus-Caf) bajo arquitectura **MVC**, en un
monorepo con vista y backend.

| Capa | Stack | Dónde |
| --- | --- | --- |
| Vista | Vite · React 19 · TypeScript · Tailwind v4 | `frontend/` (puerto 5173) |
| Modelo + controlador | Spring Boot 3.2.5 · Java 21 · MariaDB | `backend/` (puerto 8080) |

## Arquitectura

- **Sin autenticación.** La entrada es un selector de rol
  (`SeleccionarRol.tsx`): guarda `localStorage['user'] =
  { id: 0, numeroDocumento: 0, nombreCompleto, rol }`. No hay token.
- **Autorización por header.** `api.ts` manda `X-Rol` y `X-Documento`;
  `RolHeaderFilter` en el backend construye el `SecurityContext`. Los
  `@PreAuthorize` de los controllers deciden el acceso. **No es
  autenticación**: solo desarrollo local.
- **Identidad del usuario.** `SeleccionarRol` pide rol + número de documento y
  los guarda en `localStorage`. El documento permite que el backend sepa a qué
  entrenador o cliente pertenece cada llamada.
- **Datos**: Vite proxy `/api` → `http://localhost:8080`. MariaDB debe escuchar
  en 3306 por TCP.
- **Base de datos**: sin migraciones. `ddl-auto=update` genera el esquema desde
  los entities; la base se crea vacía.

## Roles (dominio)

`ADMINISTRADOR` · `SECRETARIA` · `ENTRENADOR` · `CLIENTE`

## Módulos / features

- Vista por rol: Admin (`/admin`) · Secretaria (`/secretaria`, `/registrar-pago`)
  · Entrenador (`/entrenador`) · Cliente (`/cliente`)
- Clientes: mensual · diario · EPS (registro, consulta, edición, inactivación,
  reactivación)
- Pagos y caja: mensualidad, diario, copago EPS, nómina, arriendo, mantenimiento,
  flujo de caja, factura EPS
- Entrenador: horarios, rutinas, mensajes, evaluaciones físicas, metas
- Cliente: perfil con membresía, progreso, rutina, evaluaciones, asistencias
- Ingreso: `POST /api/acceso/registrar-ingreso`
- Administración: tarifas, equipos (inventario), flujo de caja
- Usuarios del sistema (admin / secretaria / entrenador)

## Modelo de datos

`Usuario` y `UsuarioSistema` son abstractas con
`@Inheritance(JOINED)`: cada subclase tiene tabla propia.
`ParticularMensual` ↔ `Contrato` y `BeneficiarioEps` ↔ `Remision` son 1:1.

## Estado actual (resumen)

Ver [[estado-proyecto]]. Lo más reciente: monorepo con el backend de vuelta,
autorización por header en lugar de JWT, servicios de cliente fusionados,
`AdminController` agregado y documentación reescrita.

## Convención con el asistente

1. **Al iniciar sesión**: leer este índice, [[estado-proyecto]] y el lienzo.
2. **Al terminar cada sesión**: actualizar [[estado-proyecto]], añadir entrada a
   [[decisiones]] y **agregar** nodos/aristas al lienzo (nunca borrar los
   previos).
3. Todo en **español**.