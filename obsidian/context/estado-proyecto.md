# Estado del proyecto

> Snapshot al inicio/cierre de cada sesión. Última actualización: 2026-09-15.

## Sesión: 2026-09-15 (cierre · vista MVC sin JWT)

### Último commit
Sin commitear aún: la vista se convirtió en "vista MVC sin autenticación". Último commit previo: `92e8580`.

### Qué se hizo en la sesión
- **MVC / sin JWT**: el backend se retiró del workspace (visible en git history) y este repo quedó como **vista** única.
- **Selector de rol** (`SeleccionarRol.tsx`) reemplaza el login: `/` elige rol y guarda `localStorage['user'] = { id: 0, numeroDocumento: 0, nombreCompleto, rol }`. No hay `token`.
- Rutas reajustadas: `/login` y `getDefaultRoute` eliminados; catch-all `*` → `/`. `PrivateRoute` redirige a `/`; `Layout` cierra sesión limpiando `localStorage`.
- **Bugfixes**: `currentAdminId` en `AdminDashboard` (leía `idUsuarioSistema`; ya no hay `if (!localStorage)`); desactivar/activar clientes diario y beneficiarios EPS en `SecretariaDashboard` (con confirmación y actualización de estado); endpoint de ingreso unificado a `POST /acceso/registrar-ingreso` (canónico).
- **Refactor de servicios**: `ApiResponse`/`unwrap` en `apiTypes.ts` (se eliminaron las 5 copias); `getApiErrorMessage` consolidado en `apiError.ts`.
- **Lint en verde** (se silenciaron advertencias preexistentes de `react-hooks/set-state-in-effect`).

### Qué quedó en WIP
- `EntrenadorDashboard` y `ClienteDashboard` siguen siendo placeholders.
- Backend con JWT retirado del workspace: el flujo real exige levantar el backend en `:8080`.

### Problemas conocidos
- Al elegir rol, `id: 0` y `numeroDocumento: 0` (la vista no pide credenciales): los flujos que dependan de un usuario real requieren el backend.
- Código sin commitear (incluye la eliminación de `victus-caf-backend/` y `Login.tsx`).

### Próximos pasos
- Commitear la sesión (vista MVC sin JWT).
- Decidir si `EntrenadorDashboard`/`ClienteDashboard` se implementan con datos reales.
- Mantener al día vault Obsidian y lienzo.

---
## Plantilla (sesión nueva)

- Fecha:
- Último commit:
- Qué se hizo en la sesión:
- Qué quedó en WIP:
- Problemas nuevos:
- Próximos pasos:

---
## Sesión: 2026-09-15 (primer snapshot)

### Último commit
`92e8580` — "Se hacen las respectivas mejoras se implementa una capa de iteraciones para la secretaria"

### Qué funciona
- Backend multicapa (controller/service/repository/models/dto/exception) bajo `com.victuscaf.modules.client`.
- JWT + roles (`com.victuscaf.security`): único endpoint público `/api/auth/login`; el resto exige Bearer.
- Frontend React 19 con login, dashboards por rol y registro de clientes (diario / EPS / mensual).

### En progreso (WIP)
- Capa de iteraciones para la secretaria (mejoras recientes).
- Pulido de funcionalidades pendientes.

### Problemas conocidos
- No hay seed de admin: sin `ADMINISTRADOR` no se puede entrar (generar BCrypt de `admin123` con `security/GenerarHash.java` / root `BcryptGen.java`).
- `Readme.md` raíz desactualizado en versiones (dice React 18; `package.json` tiene React 19).
- `.metals/` y `.bloop/` son artefactos LSP trackeados por error; ignorar. `.github/modernize/` es salida de tool-use, no CI.

### Próximos pasos
- Definir siguientes features (PBI) con el equipo.
- Validar `../mvnw -q compile` y `npm run lint` / `npm run build` tras cambios.
- Comprobar que el vault Obsidian y el lienzo se mantienen al día.

---
## Plantilla (sesión nueva)

- Fecha:
- Último commit:
- Qué se hizo en la sesión:
- Qué quedó en WIP:
- Problemas nuevos:
- Próximos pasos: