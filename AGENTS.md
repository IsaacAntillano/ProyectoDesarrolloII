# AGENTS.md

Monorepo del sistema de gestión de gimnasio (Victus-Caf). Dos módulos: `frontend/`
(vista) y `backend/` (modelo + controlador). Confiar en los archivos, no en
documentación previa: el README raíz está actualizado a la realidad actual.

## Convenciones

- Código, comentarios y commits en **español**.
- Nombres de clases en inglés; paquetes en inglés también.
- El vault de Obsidian está en `obsidian/`. Al cerrar sesión, actualizar
  `obsidian/context/estado-proyecto.md`, añadir entrada a
  `obsidian/context/decisiones.md` y **agregar** nodos/aristas a
  `obsidian/canvas/lienzo-victus.canvas` (nunca borrar los previos; IDs únicos,
  JSON válido). Para leer contexto al inicio: `obsidian/context/index.md`,
  `estado-proyecto.md` y el lienzo.

## Frontend (`frontend/`)

Vite · React 19 · TypeScript · Tailwind v4 · axios · react-router-dom.

- **Autenticación JWT.** `src/pages/Login.tsx` (ruta `/`) llama a
  `POST /api/auth/login` con **documento y contraseña** y guarda
  `localStorage['user'] = { token, rol, documento, nombreCompleto }`.
  `src/services/api.ts` añade `Authorization: Bearer <token>` en cada petición.
  `SeleccionarRol.tsx` sigue existiendo en `/seleccionar-rol`, pero ya no emite
  token: es código obsoleto, no usar.
- Rutas en `src/App.tsx`: `/` → `Login`; `/admin`, `/secretaria`,
  `/entrenador`, `/cliente`, `/gestion-clientes`, `/registrar-cliente-*`,
  `/registrar-pago`, `/gastos-operativos`, `/contratos-vencidos` y
  `/solicitudes-plus`, todas protegidas por `PrivateRoute` con `allowedRoles`.
  Las tres últimas son solo de `ADMINISTRADOR`.
- `npm run dev` proxy `/api` → `http://localhost:8080`. `src/services/api.ts`
  usa `import.meta.env.VITE_API_URL ?? '/api'`.
- `npm run build` = `tsc -b && vite build` (typecheck incluido).
  `npm run lint` = ESLint flat config.
- Servicios en `src/services/`. `apiTypes.ts` define `ApiResponse<T>` y
  `unwrap` (compartidos). `src/utils/apiError.ts` define
  `getApiErrorMessage` / `isServerUnreachable` / `SERVER_UNREACHABLE_MESSAGE`.
  No reimplementar estos helpers en páginas.
- `clienteService.ts` es el servicio de clientes (registro, búsqueda, listados,
  edición, inactivación, contrato mensual, cancelación EPS, asignación de
  entrenador y contratos vencidos). `clientePanelService.ts` es el panel del
  cliente (`/api/cliente`): el documento sale del token, no de un header. No
  confundirlos: el primero opera sobre cualquier cliente, el segundo solo sobre
  el que llama.
- Servicios: `entrenadorService.ts` (perfil, horarios, rutinas, evaluaciones y
  clientes asignados), `pagoService.ts` (pagos, plus, gastos y flujo de caja),
  `adminService.ts` (tarifas, equipos, flujo de caja y solicitudes plus),
  `usuarioSistemaService.ts` (CRUD de usuarios) y `secretariaService.ts`
  (ingresos).
- Páginas destacadas: `GestionClientes.tsx` concentra los modales de contrato
  mensual, cancelación anticipada EPS y asignación/liberación de entrenador;
  `GastosOperativos.tsx`, `ContratosVencidos.tsx` y `SolicitudesPlus.tsx` son
  las vistas nuevas de administración.
- `rolLimits.ts` codifica los cupos por rol (1 admin, 2 secretaria, 3
  entrenador). Es una regla de negocio en la vista, sin contraparte en backend.
  No confundir con el cupo de **4 clientes activos por entrenador**, que sí se
  valida en backend (`AsignacionEntrenadorService`).

## Backend (`backend/`)

Spring Boot 3.2.5 · Java 21 · Spring Security · Spring Data JPA · MariaDB.
Paquete base: `com.victuscaf`. Todo lo nuevo va dentro de ese paquete: es la
raíz del component scan.

```
com.victuscaf
├── VictusCafApplication.java   # @SpringBootApplication, NO mover
├── gimnasio/                   # dominio (MVC: controller/service/repository/models/dto)
│   ├── controller/             # @RestController, traduce HTTP <-> caso de uso
│   ├── service/                # lógica de negocio, inyecta repositorios
│   ├── repository/             # Spring Data JPA
│   ├── models/                 # @Entity
│   ├── dto/                    # records / clases de entrada
│   └── exception/              # @RestControllerAdvice
└── security/                   # SecurityConfig, JwtAuthFilter, JwtTokenProvider, AuthController
```

Controllers (8 en `gimnasio` + el login en `security`):

| Controller | Ruta base | Rol |
| --- | --- | --- |
| `AuthController` (`security/`) | `/api/auth` | público (solo login) |
| `ClienteController` | `/api/clientes` | secretaria, admin |
| `ClientePanelController` | `/api/cliente` | cliente, admin |
| `UsuarioSistemaController` | `/api/usuarios-sistema` | admin |
| `AccesoController` | `/api/acceso` | secretaria, admin |
| `AdminController` | `/api/admin` | admin |
| `PagoController` | `/api/pagos` | secretaria, admin |
| `EntrenadorController` | `/api/entrenador` | entrenador, admin |
| `NotificacionController` | `/api/notificaciones` | secretaria, admin |

Ojo: `ClienteController` y `ClientePanelController` son distintos a propósito.
El primero opera sobre cualquier cliente (registro, edición); el segundo solo
sobre el que llama, identificado por el documento del token. No fusionar.

`RolHeaderFilter` conserva el nombre por historia: ya no lee headers, solo
expone `documentoActual()` leyendo el principal `ROL:documento` que arma
`JwtAuthFilter`.

Estructura MVC clásica, no hexagonal. Las layers se cruzan: los services
inyectan repositorios directamente, y los controllers devuelven entities JPA
(envueltas en `ApiResponse<T>`), no DTOs de salida.

### Comandos

No hay `mvn` en el PATH → **siempre `./mvnw`**.

| Tarea | Comando |
| --- | --- |
| Compilar | `./mvnw -q compile` |
| Levantar | `./mvnw spring-boot:run` |
| Empaquetar | `./mvnw clean package` |

### Configuración

- **Sin migraciones** (ni Flyway ni Liquibase ni `schema.sql`).
  `spring.jpa.hibernate.ddl-auto=update` → Hibernate genera el esquema desde los
  entities. Requiere que la base exista pero esté vacía.
- Credenciales en variables de entorno leídas de `backend/.env` vía
  `spring.config.import`. **Nunca commitear el `.env`.** `.env.example` es la
  plantilla.
- MariaDB debe escuchar en `3306` por TCP. En distros con `skip-networking` hay
  que habilitar `bind_address`.

### Gotchas

1. **Lombok 1.18.48 mínimo.** Con 1.18.32 y JDK 27 el build falla con
   `ExceptionInInitializerError`.
2. **`Equipo.estadoEquipo`** usa `@Enumerated(EnumType.STRING)`. Si se agrega un
   valor al enum, los registros existentes no se corrompen (por eso es STRING y
   no el ordinal por defecto).
3. **El JWT es la única autenticación.** `JwtAuthFilter` valida
   `Authorization: Bearer <token>` y arma el `SecurityContext`; sin token, las
   rutas protegidas responden `401`. El token se firma con `JWT_SECRET` y expira
   según `JWT_EXPIRATION_MS`. No reintroducir `X-Rol`/`X-Documento`: el login
   (`POST /api/auth/login`) es el único endpoint público.
4. **Los services de entrenador y evaluación reciben documento, no id.** Antes
   usaban `idEntrenador` (id de base) y `findById`. Ahora usan
   `findByNumeroDeDocumento`, porque es lo que llega en el token. Si se agrega
   un método nuevo de entrenador, que tome el documento.
5. **`@PreAuthorize` es la fuente de verdad** de permisos. Vive en los
   controllers. El filtro solo construye el `SecurityContext`.
6. **Los pagos validan el monto contra la tarifa.** `PagoService` compara con
   tolerancia de 0.01 y rechaza. No agregar formas de cobrar sin validar.
7. **No hay tests.** No hay datasource de prueba. La verificación es `compile`
   más pruebas manuales con `curl`.
8. `spring.jpa.open-in-view=false` está activo: los controllers que necesiten
   una relación lazy deben cargarla explícitamente en el service.
9. **La asignación entrenador-cliente vive en `AsignacionEntrenador`**, no en el
   cliente. `AsignacionEntrenadorService` valida el cupo de 4 activos, cierra la
   asignación anterior y resincroniza `Entrenador.cantidadClientesActivos`. No
   volver a usar el flag booleano del cliente como fuente de verdad.
10. **`origen` de la asignación importa:** `PRIMER_MES` se crea al registrar un
    particular mensual y lleva `fechaFin = hoy + 1 mes`; `PLUS` se crea al
    aprobar una `SolicitudEntrenadorPlus` y no lleva fecha de corte. Al vencer
    `fechaFin`, la asignación deja de contar como activa.
11. **La cancelación EPS conserva el typo del enum:**
    `EstadoContratoEps.CANCELADO_ANCTICIPADAMENTE` (sic). No renombrar el valor:
    está persistido con `@Enumerated(EnumType.STRING)`. La etiqueta visible se
    corrige en la vista (`GestionClientes.tsx`).
12. **Contratos vencidos se calculan por fecha, no por estado.**
    `ContratoRepository.findByFechaVencimientoBefore(LocalDate.now())`; un
    contrato puede seguir `ACTIVO` y aun así estar vencido si nadie lo renovó.
    El endpoint es solo de administrador.

### Reglas de negocio nuevas

- **Contrato mensual (CO-0002/3).** Cada `ParticularMensual` tiene un
  `Contrato` 1:1. `GET /api/clientes/mensual/{doc}/contrato` lo consulta y
  `GET /api/clientes/contratos/vencidos` lista los que ya pasaron su
  `fechaVencimiento`. El pago de mensualidad renueva el contrato un mes.
- **Cancelación anticipada EPS (CLT-0017).** `PUT
  /api/clientes/eps/{doc}/cancelar` exige motivo, marca el contrato como
  `CANCELADO_ANCTICIPADAMENTE`, inactiva al beneficiario y cierra la asignación
  de entrenador. Es solo de administrador.
- **Asignación manual de entrenador.** `PUT`/`DELETE
  /api/clientes/eps/{doc}/entrenador[/{docEntrenador}]` asignan o liberan al
  entrenador de un beneficiario EPS, respetando el cupo de 4.
- **Servicio plus (PC-0011).** El cliente solicita con `POST
  /api/cliente/solicitud-plus` (solo tras el primer mes y sin entrenador
  activo). El admin lista, aprueba (elige entrenador o deja que el backend
  escoja el de menos clientes con cupo) o rechaza con observación en
  `/api/admin/solicitudes-plus`. El cobro se registra con `POST
  /api/pagos/plus/{doc}`, que valida contra `valorPlus` de la tarifa.
- **Horarios y reservas (GE-0003/5).** El entrenador declara horarios; el
  cliente ve los de su entrenador en `GET /api/cliente/horarios-disponibles` y
  reserva con `POST /api/cliente/horarios/{id}/reservar`. El entrenador consulta
  sus clientes en `GET /api/entrenador/clientes`.
- **Gastos operativos (PA-0005/6/7).** Nómina, arriendo y mantenimiento se
  registran como `GastoOperativo`; `GET /api/pagos/gastos?fecha=` los lista
  (admin) y el flujo de caja los descuenta de los ingresos del día.

## Contrato con el frontend

El sobre de respuesta es `ApiResponse<T> { success, message, data }` y el
frontend lo desenvuelve con `unwrap` (`frontend/src/services/apiTypes.ts`).

Endpoint de ingreso canónico: `POST /api/acceso/registrar-ingreso`.

## Misc

- `.metals/`, `.bloop/`, `backend.log`, `BcryptGen.*` son artefactos y están en
  `.gitignore`. Si aparecen trackeados, sacarlos con `git rm --cached`.
- `.github/modernize/` es salida de herramienta, no CI. **No hay CI**: la
  verificación es local.
- No hay despliegue a GitHub Pages configurado; `vite.config.ts` usa `base: '/'`
  para desarrollo local.