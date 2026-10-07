# Estado del proyecto

> Snapshot al inicio/cierre de cada sesión. Última actualización: 2026-10-07.

## Sesión: 2026-10-07 (cierre · monorepo + backend revivido)

### Último commit

Pendiente de cerrar al terminar la sesión (ver `git log`).

### Qué se hizo

- **Monorepo.** `victus-caf-frontend/` → `frontend/`; el backend (108 clases
  bajo `com.victuscaf`) vuelve al workspace desde el historial → `backend/`.
  El wrapper de Maven pasa a `backend/`, que es donde se usa.
- **Repos y zips eliminados del workspace:** `victus-caf-backend/` (esqueleto
  hexagonal vacío, 1 commit), `SistemaBasicoVictus/` (prototipo sin commits),
  `victus-notas/` (vault Obsidian vacío) y los 2 zips.
- **JWT eliminado.** `RolHeaderFilter` autoriza por los headers `X-Rol` y
  `X-Documento` que manda la vista. Se borran `JwtUtils`, `JwtResponse`,
  `LoginRequest`, `AuthController`, `GenerarHash`, `UserDetailsServiceImpl`,
  `UserDetailsImpl` y `JwtAuthTokenFilter`. Los `@PreAuthorize` no se tocaron.
- **`AdminController`** (tarifas, equipos, flujo de caja), **`PagoController`**
  (mensualidad, diario, copago, nómina, arriendo, mantenimiento, flujo de caja),
  **`EntrenadorController`** (horarios, rutinas, mensajes, evaluaciones, metas) y
  **`ClientePanelController`** (perfil, progreso, rutina, evaluaciones,
  asistencias). 61 endpoints en total, 7 controllers.
- **Servicios de cliente fusionados.** `clienteService.ts` y
  `clienteParticularService.ts` eran dos fuentes de verdad para la misma API.
- **Nombres saneados.** `com.victuscaf.modules.client` → `com.victuscaf.gimnasio`
  (99 archivos). `BeneficiarioEPSDTO` → `BeneficiarioEpsDTO`. Se elimina el
  endpoint `debug/mensual/{doc}`, sin autorización.
- **Vistas reales.** `EntrenadorDashboard` y `ClienteDashboard` dejaron de ser
  placeholders. Nueva vista `RegistrarPago`. `SeleccionarRol` pide el número de
  documento.
- **Documentación.** `Readme.md` y `AGENTS.md` reescritos. Nodo del canvas
  corregido (`README.md` → `Readme.md`).

### Bugs corregidos

- **El sistema no podía cobrar.** `AccesoService` exige pago de membresía para
  dar ingreso, pero no existía endpoint para registrarlo. Ahora `/api/pagos`.
- **ENTRENADOR y CLIENTE no podían hacer nada**: recibían 403 en todos los
  endpoints porque no había ninguno para esos roles, y sus dashboards eran
  placeholders.
- `GlobalExceptionHandler` degradaba los errores de seguridad a 400 (un solo
  handler para `RuntimeException`). Ahora hay 403, 401 y 404 específicos.
- `ClienteDiarioDTO` del frontend marcaba opcionales cuatro campos que el
  backend exige. El tipado mentía.
- Lombok 1.18.32 no soportaba JDK 27: el build fallaba. Actualizado a 1.18.48.
- `Equipo.estadoEquipo` persistía como ordinal; ahora `@Enumerated(STRING)`.
- `node_modules/.bin` tenía copias en vez de symlinks: `npm run dev`, `lint` y
  `build` fallaban. Resuelto con `npm ci`.
- `Layout.tsx` duplicaba el margen del sidebar (32rem en vez de 16rem).

### Bugs corregidos

- Lombok 1.18.32 no soportaba JDK 27: el build fallaba con
  `ExceptionInInitializerError`. Actualizado a 1.18.48.
- `Equipo.estadoEquipo` persistía como ordinal; ahora `@Enumerated(STRING)`.
- Los tres `reactivar*` del servicio de clientes declaraban
  `ApiResponse<X>` en vez de `ApiResponse<ApiResponse<X>>`, así que `unwrap`
  devolvía el sobre entero.
- `Layout.tsx` duplicaba el margen del sidebar en escritorio (`md:relative` +
  `md:ml-64` = 32rem en vez de 16rem).

### Qué quedó en WIP

- Sin datos de arranque: la base se crea vacía y Hibernate genera el esquema.
  No hay seed, así que `POST /usuarios-sistema` es la única forma de crear el
  primer administrador. Las tarifas tampoco tienen valores por defecto.
- `NotificacionService` y `SeguridadService` siguen sin exponerse.
- `EntrenadorDashboard` muestra horarios; la API de rutinas, evaluaciones y
  metas existe pero la vista aún no la consume.

### Problemas conocidos

- **La autorización por header no es autenticación.** Quien alcance el puerto
  8080 puede declarar `X-Rol: ADMINISTRADOR` y `X-Documento` de cualquiera.
  Solo desarrollo local.
- **Las contraseñas de cliente viajan en las respuestas.** Los DTO de cliente no
  aplican BCrypt (los de usuario sí), así que `crearClienteMensual` devuelve la
  contraseña en texto plano.
- **MariaDB debe escuchar en TCP.** Venía con `skip-networking`; se resolvió con
  `INSTALL PLUGIN bind_address SONAME 'haed'; SET GLOBAL bind_address='127.0.0.1';`
- **Sin tests.** No hay datasource de prueba ni framework en el frontend.
- La contraseña de `.env` se compartió en texto plano durante la sesión;
  conviene rotarla.

### Próximos pasos

- Exponer `NotificacionService` (reporte de copago pendiente).
- Corregir `migrarDiarioAMensual` con una decisión de dominio sobre el
  identificador.
- Decidir la política de contraseñas de cliente (BCrypt o no storing).
- Rotar la contraseña de `victus_app` en MariaDB.
- Considerar un seed para development.

---

## Plantilla (sesión nueva)

- Fecha:
- Último commit:
- Qué se hizo en la sesión:
- Qué quedó en WIP:
- Problemas nuevos:
- Próximos pasos:

---

## Sesión: 2026-09-15 (cierre · vista MVC sin JWT)

### Último commit

`e458b14` — "Se retira el backend y la vista pasa a MVC sin autenticación JWT"

### Qué se hizo en la sesión

- **MVC / sin JWT**: el backend se retiró del workspace y el repo quedó como
  **vista** única.
- **Selector de rol** (`SeleccionarRol.tsx`) reemplaza el login:
  `localStorage['user']`. No hay `token`.
- Rutas reajustadas; catch-all `*` → `/`.
- **Bugfixes**: `currentAdminId` en `AdminDashboard`; desactivar/activar
  clientes diario y beneficiarios EPS en `SecretariaDashboard`.
- **Refactor de servicios**: `ApiResponse`/`unwrap` en `apiTypes.ts`,
  `getApiErrorMessage` consolidado en `apiError.ts`.
- Vault Obsidian creado en `obsidian/`.

### Problemas conocidos en ese momento

- `id: 0` y `numeroDocumento: 0` al elegir rol.
- Código sin commitear.
- El backend exigía JWT mientras la vista ya no lo mandaba: toda petición
  devolvía 401. **Resuelto en la sesión del 2026-10-07.**

---

## Plantilla (sesión nueva)

- Fecha:
- Último commit:
- Qué se hizo en la sesión:
- Qué quedó en WIP:
- Problemas nuevos:
- Próximos pasos: