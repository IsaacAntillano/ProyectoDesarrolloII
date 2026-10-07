# Victus-Caf · Contexto del proyecto

> Punto de entrada para el asistente y para ti. Leer **primero** al iniciar cualquier sesión de trabajo.
> Estado vivo: [[estado-proyecto]] · Lienzo: [[lienzo-victus.canvas]] · Registro: [[decisiones]] · Glosario: [[glosario]]

## Qué es

Sistema de gestión de gimnasio (Victus-Caf) bajo arquitectura **MVC**. Este repo es solo la **vista**; el modelo/controlador (backend) vive en otro repo y se consume vía API.

| Capa | Stack | Dónde |
| --- | --- | --- |
| Vista | Vite · React 19 · TypeScript · Tailwind v4 | `victus-caf-frontend/` (este repo) |
| Backend (MVC: modelo/controlador) | Spring Boot · MariaDB · API REST | Repo externo, consumido vía `/api` en `:8080`; retirado de este workspace |

## Arquitectura de la vista

- **Sin JWT.** La entrada es un **selector de rol** (`SeleccionarRol.tsx`): guarda en `localStorage` la clave `user` con `{ id: 0, numeroDocumento: 0, nombreCompleto, rol }`. No existe `token`.
- **Rutas**: `/` → `SeleccionarRol`. `/admin`, `/secretaria`, `/entrenador`, `/cliente`, `/gestion-clientes*` y `/registrar-cliente-*` están guardadas por `PrivateRoute` (prop `allowedRoles`); sin `user` o rol no permitido → redirige a `/`.
- **Datos**: Vite proxya `/api` → `http://localhost:8080`. Servicios en `src/services/`; helpers compartidos en `apiTypes.ts` (`ApiResponse`/`unwrap`) y `apiError.ts` (`getApiErrorMessage`, `isServerUnreachable`).

## Roles (dominio)

`ADMINISTRADOR` · `SECRETARIA` · `ENTRENADOR` · `CLIENTE`

## Módulos / features

- Vista por rol: Admin (`/admin`) · Secretaria (`/secretaria`) · Entrenador (`/entrenador`, placeholder) · Cliente (`/cliente`, placeholder)
- Clientes: diario · EPS · mensual (registro y gestión)
- Registro de ingreso: `POST /api/acceso/registrar-ingreso` (canónico)
- Módulos restantes (equipos, flujo de caja, tarifas, usuarios) expuestos en el dashboard del admin

## Estado actual (resumen)

Ver [[estado-proyecto]]. Lo más reciente: la vista quedó como **vista MVC sin autenticación JWT** (selector de rol en lugar de login); todos los flujos siguen consumiendo la API real del backend por `/api`.

## Convención con el asistente

1. **Al iniciar sesión**: leer este índice, [[estado-proyecto]] y el lienzo [[lienzo-victus.canvas]].
2. **Al terminar cada sesión**: actualizar [[estado-proyecto]], añadir entradas a [[decisiones]] y **agregar nodos/aristas al lienzo** (nunca borrar los previos — el lienzo es infinito).
3. Todo en **español** (convención del repo).