# Estado del proyecto

> Snapshot al inicio/cierre de cada sesión. Última actualización: 2026-11-11.

## Sesión: 2026-11-11 (cierre · revisión 47 HU + prueba E2E)

### Último commit

Pendiente: el árbol de trabajo sigue sucio; no se hizo commit en esta sesión.

### Qué se hizo

- **Revisión completa de las 47 HU** de los Sprint 1 (31) y 2 (16): todas
  tienen implementación backend + frontend. No faltaban historias, sino
  agujeros de integridad en flujos ya existentes.
- **Fix renovación de contrato (`CO-0004`).** `PagoService.registrarPagoMensualidad`
  renovaba siempre desde `fechaVencimiento`. Si el contrato estaba vencido hace
  meses, el pago lo dejaba vencido otra vez. Ahora renueva desde
  `max(hoy, fechaVencimiento)`, valida que el contrato exista y lo marca
  `ACTIVO`.
- **Fix escrituras del entrenador.** Nuevo
  `AsignacionEntrenadorService.validarAsignacionActiva(...)`. `crearRutina`,
  `enviarMensaje`, `verificarAsignacionActiva` y `crearEvaluacionInicial` ya no
  permiten operar sobre clientes ajenos; el historial del entrenador usa un
  overload que exige la asignación. El admin sigue con acceso libre.
- **Fix `idAdminModificador`.** `AdminController` resuelve el id del
  administrador desde el documento del JWT e ignora el valor del body, que
  antes llegaba en 0.
- **Fix flujo de caja.** `generarFlujoCaja` existía en `pagoService.ts` pero
  ninguna página lo llamaba, y la UI pedía "generarlo desde el panel" sin
  botón. Se agregó "Generar flujo" en `AdminDashboard.tsx`.

### Verificación

- `backend/./mvnw -q compile` ✅
- `frontend/npm run build` ✅
- `frontend/npm run lint` ✅
- **Smoke test `curl`: 68 PASS / 0 FAIL** contra MariaDB local
  (`/tmp/opencode/mariadb`, puerto 3306) con el seed cargado. Cubre login por
  rol, tarifas, clientes mensual/diario/EPS, migración, pagos, ingresos,
  rutinas/evaluaciones, asignación y cupo, cancelación EPS, equipos, gastos,
  flujo de caja, factura EPS, contratos vencidos, plus y autorización por rol.
- Verificado en BD: `id_admin_modificador` guarda el id real del admin (1) y la
  renovación de un contrato vencido 2 meses deja fecha futura (`2026-12-11`).

### Qué quedó en WIP / problemas conocidos

- Los cambios no están commiteados.
- `SeleccionarRol.tsx` sigue montado en `/seleccionar-rol` sin emitir token:
  código obsoleto.
- No hay tests automatizados; la verificación es `compile` + smoke manual.
- MariaDB no se pudo levantar como servicio (sin `sudo`); se usó una instancia
  local con datadir propio en `/tmp/opencode/mariadb`.

### Próximos pasos

- Commit del trabajo.
- Eliminar o archivar `SeleccionarRol.tsx`.
- Evaluar convertir el smoke test en una suite repetible (hoy no es idempotente:
  requiere base limpia).

---

## Sesión: 2026-11-04 (cierre · 48 HU funcionales)

### Último commit

Pendiente: el árbol de trabajo sigue sucio; no se hizo commit en esta sesión.

### Qué se hizo

- **Cierre de brechas del sistema.** Backend y frontend quedaron funcionales
  para las 48 HU auditadas. Migración diario → mensual ahora tiene botón;
  `Registrar ingreso` queda visible en gestión de clientes; `Factura EPS`
  calcula sesiones × valor prorrateado + copagos.
- **Facturación EPS real** (`PA-0009`): genera factura consolidada por
  período `YYYY-MM`, única por período y sólo admin; vista admin `/factura-eps`.
- **Auto-registro** (`CO-0001`): `POST /api/auth/registro-cliente` y ruta
  pública `/registro`; crea cliente + contrato y asigna entrenador incluído.
- **Bloqueo automático** (`CA-0002`): job cada hora marca mensuales con
  contrato vencido como `VENCIDO` y EPS sin copagos recientes como
  `BLOQUEADO`; ingreso mensual valida vencimiento de contrato.
- **Huecos de UI**: seguimiento de clientes del entrenador (progreso y rutinas
  activas), y sección "Mis sesiones diarias" en el cliente particular diario.
- **Seguridad**: login rechaza usuarios inactivos, gastos operativos sólo admin,
  JWT por defecto de 4 h y eliminado cualquier rastro de `X-Rol`/`X-Documento`.
- **Bug real**: la migración diario → mensual acordaba la contraseña en
  texto plano; ahora se guarda BCrypt.

### Verificación

- `backend/./mvnw -q compile` ✅
- `frontend/npm run build` ✅
- `frontend/npm run lint` ✅
- Pruebas manuales con `curl`: **no ejecutadas**. MariaDB está inactiva en
  el entorno; no se alteró el servicio.

### Qué quedó en WIP / problemas conocidos

- No se commitearon los cambios.
- La fórmula de factura prorratea la mensualidad EPS en 20 sesiones; si la
  gobernanza define otro divisor hay que ajustarlo en un solo lugar.
- El bloqueo EPS asume que un copago vale para 30 días; es la misma ventana
  que ya usaba `AccesoService`.
- `SeleccionarRol.tsx` sigue montado en `/seleccionar-rol`, sin emitir token.

### Próximos pasos

- Levantar MariaDB y hacer las pruebas con `curl`.
- Decidir si se elimina `SeleccionarRol.tsx`.
- Commit del trabajo.

---

## Sesión: 2026-11-03 (cierre · 16 HU de Victus CAF)

### Último commit

Pendiente: el árbol de trabajo sigue sucio, no se hizo commit en esta sesión.

### Qué se hizo

- **16 historias de usuario implementadas** de punta a punta (backend + frontend):
  contratos mensuales y vencidos, cancelación anticipada EPS, asignación y cupo
  de entrenadores, servicio plus con aprobación, horarios/reservas, gastos
  operativos y ajustes de registro/edición.
- **Modelo nuevo:** `AsignacionEntrenador` (cliente ↔ entrenador, `origen`
  `PRIMER_MES`/`PLUS`, cupo de 4 activos) y `SolicitudEntrenadorPlus`
  (`PENDIENTE`/`APROBADA`/`RECHAZADA`). Se agregan
  `AsignacionEntrenadorService` y `SolicitudPlusService`.
- **Endpoints nuevos:** contrato mensual, cancelar EPS, asignar/liberar
  entrenador EPS, contratos vencidos, clientes asignados del entrenador,
  horarios disponibles y reserva, solicitud plus (cliente y admin), pago plus y
  gastos operativos por fecha.
- **Frontend nuevo:** `GastosOperativos.tsx` (PA-0005/6/7),
  `ContratosVencidos.tsx` (CO-0003) y `SolicitudesPlus.tsx` (PC-0011), con sus
  rutas y enlaces de sidebar solo para admin. `RegistrarPago` suma el tipo
  "Entrenador Plus" y acepta `?documento=`.
- **Vistas actualizadas:** `GestionClientes` con modal de contrato, cancelación
  EPS, asignación/liberación de entrenador y etiqueta corregida del enum;
  `EntrenadorDashboard` con "Mis clientes"; `ClienteDashboard` con horarios y
  solicitud plus.
- **Documentación:** `Readme.md` y `AGENTS.md` corregidos de "autorización por
  header" a JWT real; se documentan endpoints, roles, credenciales del seed y
  las reglas de asignación/plus.

### Verificación

- `backend/./mvnw -q compile` ✅
- `frontend/npm run build` ✅ (tsc + vite)
- `frontend/npm run lint` ✅
- Pruebas manuales con `curl`: **pendientes**. MariaDB está inactiva y no hay
  `sudo` para levantarla, así que el backend no se pudo arrancar.

### Qué quedó en WIP / problemas conocidos

- `SeleccionarRol.tsx` sigue montado en `/seleccionar-rol`, pero ya no emite
  token: es código obsoleto.
- Los cambios no están commiteados.

### Resuelto en esta sesión

- Las contraseñas de clientes y usuarios del sistema dejaron de viajar en las
  respuestas JSON: `Usuario.contrasena` y `UsuarioSistema.contrasena` llevan
  `@JsonIgnore`. El login y los DTO de entrada no se ven afectados.

### Próximos pasos

- Levantar MariaDB y hacer la pasada manual de los flujos nuevos con `curl`.
- Evaluar un DTO público para solicitudes plus (sin contraseña).
- Eliminar o archivar `SeleccionarRol.tsx`.
- Commit del trabajo.

---

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

- La base arranca vacía y Hibernate genera el esquema; el `DataSeeder` carga
  admin, secretaria, entrenador, tarifas y equipos **solo si no hay usuarios**.
  Sobre una base con datos se queda inactivo.
- `SeguridadService` sigue sin exponerse (no tiene caso de uso claro en la
  aplicación actual).
- `EntrenadorDashboard`: ya muestra horarios, lista de rutinas creadas y
  formulario para crear rutina/evaluación en un cliente por documento, pero no
  cubre metas (el endpoint existe).

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

### Se resolvió esta sesión

- **`migrarDiarioAMensual`**: la versión anterior insertaba un usuario nuevo
  con el mismo documento y siempre fallaba. Ahora convierte el cliente (mueve
  la fila entre `particular_diario` y `particular_mensual`, conserva el id y
  crea el contrato). Probado.
- **Seed inicial** (`DataSeeder`).
- **`NotificacionService` expuesto** vía `/api/notificaciones` (persistencia,
  listado, no leídas, marcar leída); antes solo imprimía por consola.
- **`EntrenadorDashboard`** completa: perfil, horarios, rutinas creadas,
  formulario de rutina y evaluación por documento.

### Próximos pasos

- `EntrenadorDashboard`: cubrir metas y evaluaciones repetidas.
- Decidir la política de contraseñas de cliente (BCrypt o no storing).
- Rotar la contraseña de `victus_app` en MariaDB.
- Considerar si `CLIENTE` debe ver también sus pagos.

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
## Sesión: 2026-11-11 (cierre · Sprint 3 implementado)

### Último commit

Pendiente: el árbol de trabajo sigue sucio; no se hizo commit en esta sesión.

### Qué se hizo

- **Sprint 3 (16 HU) implementado** backend + frontend, verificado con
  `./mvnw -q compile`, `npm run build` y `npm run lint` (verde).
- **Backend:**
  - `CA-0003`: `desbloquearParticularMensual` / `desbloquearBeneficiarioEPS`
    + endpoints admin + bitácora `DESBLOQUEO_ACCESO`; rechaza si el contrato
    mensual venció.
  - `PA-0013/PA-0010`: `TipoDePago.EPS`, `Pago.facturaEps`, flujo de caja
    `totalIngresoFacturaEps`, detalle/radicar/pagar factura, bitácora
    `REGISTRO_PAGO`; el pago actualiza el flujo del día si ya existe.
  - `EF-0002/0004/0006`: `perimetroPierna` en `MedidasDTO`/`EvaluacionFisica`;
    metas con upsert, validación de asignación y `GET /metas`;
    `MetaEPSDTO.fechaObjetivo`.
  - `GE-0006`: `asignarHorarioAEps`, `listarHorariosDisponiblesParaEps` +
    endpoints admin.
  - `GE-0009`: listado de mensajes enviados, bandeja del cliente y
    marcar leído.
  - `EF-0008`: `ReporteProgresoEpsDTO` + `generarReporteEps` + endpoint
    `GET /api/entrenador/clientes/{doc}/reporte-eps`.
  - `CLT-0005`: entidad `SolicitudBaja`, repo, servicio, controller y
    endpoints del portal.
- **Frontend:**
  - `EntrenadorDashboard.tsx`: `perimetroPierna`, meta (EPS/particular),
    mensajes enviados + envío, historial con pierna, botón reporte EPS.
  - `ClienteDashboard.tsx`: bandeja de mensajes con "marcar leído" y solicitud
    de baja voluntaria con `ConfirmDialog`.
  - `ReporteEps.tsx`: vista imprimible con `window.print()`, ruta
    `/reporte-eps/:documento`.
  - `SolicitudesBaja.tsx`: bandeja admin con filtros, aprobar/rechazar.
  - `GestionClientes.tsx`: desbloqueo, asignación de horario EPS, `formatearHora`.
  - `FacturaEps.tsx`: modal de detalle con pagos, radicar y pago.
  - `AdminDashboard.tsx`: "Ingreso factura EPS" en el flujo.
  - `App.tsx`/`Layout.tsx`: rutas y nav nuevas.
- **Smoke test** ampliado con sección 11 (Sprint 3): **108 PASS / 0 FAIL** sobre
  base limpia.

### Verificación

- `./mvnw -q compile` OK (solo warnings de Lombok).
- `npm run build` OK.
- `npm run lint` OK.
- Smoke E2E: 108 PASS / 0 FAIL.
