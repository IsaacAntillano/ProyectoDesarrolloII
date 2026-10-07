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
- **JWT eliminado.** `RolHeaderFilter` autoriza por el header `X-Rol` que
  manda la vista. Se borran `JwtUtils`, `JwtResponse`, `LoginRequest`,
  `AuthController`, `GenerarHash`, `UserDetailsServiceImpl`, `UserDetailsImpl` y
  `JwtAuthTokenFilter`. Los `@PreAuthorize` existentes no se tocaron.
- **`AdminController`** nuevo: expone tarifas, equipos y flujo de caja. Solo 3
  métodos de service son nuevos; el resto ya existía (`EquipoDTO`,
  `InventarioService.crearEquipo`, `equiposPorMantenimientoProximo`,
  `AdminService.consultarFlujoCaja`).
- **Servicios de cliente fusionados.** `clienteService.ts` y
  `clienteParticularService.ts` eran dos fuentes de verdad para la misma API.
  Se conserva el primero con los tipos ricos.
- **Nombres saneados.** `com.victuscaf.modules.client` → `com.victuscaf.gimnasio`
  (99 archivos). `BeneficiarioEPSDTO` → `BeneficiarioEpsDTO`. Se elimina el
  endpoint `debug/mensual/{doc}`, que no tenía autorización.
- **Configuración.** Credenciales fuera del repo (`.env` + `.env.example`).
  `.gitignore` raíz unificado. `victus.code-workspace` con rutas locales.
  `vite.config.ts` con `base: '/'` (desarrollo local).
- **Documentación.** `Readme.md` y `AGENTS.md` reescritos para describir la
  realidad. Nodo del canvas corregido (`README.md` → `Readme.md`).

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

- `EntrenadorDashboard` y `ClienteDashboard` siguen siendo placeholders.
- 6 services (`Evaluacion`, `Inventario` parcialmente, `Notificacion`, `Pago`,
  `Entrenador`, `Seguridad`) no están expuestos por ningún controller: el trabajo
  está escrito pero no llega a la API.
- Sin datos de arranque: la base se crea vacía y Hibernate genera el esquema.
  No hay seed de administrador, así que `POST /usuarios-sistema` es la única
  forma de crear el primer admin.

### Problemas conocidos

- **La autorización por header no es autenticación.** Quien alcance el puerto
  8080 puede declarar `X-Rol: ADMINISTRADOR`. Solo desarrollo local.
- **MariaDB debe escuchar en TCP.** En la máquina local venía con
  `skip-networking`; se resolvió con
  `INSTALL PLUGIN bind_address SONAME 'haed'; SET GLOBAL bind_address='127.0.0.1';`
- **Sin tests.** No hay datasource de prueba ni framework en el frontend.
- La contraseña de `.env` se compartió en texto plano durante la sesión;
  conviene rotarla.

### Próximos pasos

- Probar los endpoints end-to-end con `curl` (requiere el backend levantado).
- Decidir si se expone `InventarioService` (registro de mantenimiento) y los
  services de entrenador, evaluación y pago.
- Implementar o quitar `EntrenadorDashboard` / `ClienteDashboard`.
- Rotar la contraseña de `victus_app` en MariaDB.

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