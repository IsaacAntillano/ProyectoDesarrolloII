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

- **Sin autenticación.** El login fue reemplazado por un selector de rol
  (`src/pages/SeleccionarRol.tsx`): se elige rol **y se escribe el número de
  documento**, que se guarda en
  `localStorage['user'] = { id: 0, numeroDocumento, nombreCompleto, rol }`.
  No hay token.
- **Autorización por header.** `src/services/api.ts` tiene un interceptor que
  manda `X-Rol` y `X-Documento`. El backend los aplica (ver `RolHeaderFilter`).
  No confundir: esto es rol declarado, no autenticación.
- Rutas en `src/App.tsx`: `/` → `SeleccionarRol`; `/admin`, `/secretaria`,
  `/entrenador`, `/cliente`, `/gestion-clientes*`, `/registrar-cliente-*`,
  `/registrar-pago` protegidas por `PrivateRoute` con prop `allowedRoles`.
- `npm run dev` proxy `/api` → `http://localhost:8080`. `src/services/api.ts`
  usa `import.meta.env.VITE_API_URL ?? '/api'`.
- `npm run build` = `tsc -b && vite build` (typecheck incluido).
  `npm run lint` = ESLint flat config.
- Servicios en `src/services/`. `apiTypes.ts` define `ApiResponse<T>` y
  `unwrap` (compartidos). `src/utils/apiError.ts` define
  `getApiErrorMessage` / `isServerUnreachable` / `SERVER_UNREACHABLE_MESSAGE`.
  No reimplementar estos helpers en páginas.
- `clienteService.ts` es el servicio de clientes (registro, búsqueda, listados,
  edición, inactivación). `clientePanelService.ts` es el panel del cliente
  (`/api/cliente`), que usa el documento del header. No confundirlos: el primero
  opera sobre cualquier cliente, el segundo solo sobre el que llama.
- Servicios nuevos: `entrenadorService.ts`, `pagoService.ts`.
- `rolLimits.ts` codifica los cupos por rol (1 admin, 2 secretaria, 3
  entrenador). Es una regla de negocio en la vista, sin contraparte en backend.

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
└── security/                   # SecurityConfig, RolHeaderFilter
```

Controllers (7, mapean 1:1 con las áreas del sistema):

| Controller | Ruta base | Rol |
| --- | --- | --- |
| `ClienteController` | `/api/clientes` | secretaria, admin |
| `ClientePanelController` | `/api/cliente` | cliente, admin |
| `UsuarioSistemaController` | `/api/usuarios-sistema` | admin |
| `AccesoController` | `/api/acceso` | secretaria, admin |
| `AdminController` | `/api/admin` | admin |
| `PagoController` | `/api/pagos` | secretaria, admin |
| `EntrenadorController` | `/api/entrenador` | entrenador, admin |

Ojo: `ClienteController` y `ClientePanelController` son distintos a propósito.
El primero opera sobre cualquier cliente (registro, edición); el segundo solo
sobre el que llama, identificado por el header `X-Documento`. No fusionar.

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
3. **Autorización por header no es autenticación.** `RolHeaderFilter` confía en
   `X-Rol` y `X-Documento`. Quien alcance el puerto 8080 puede declararse admin.
   Solo local.
4. **Los services de entrenador y evaluación reciben documento, no id.** Antes
   usaban `idEntrenador` (id de base) y `findById`. Ahora usan
   `findByNumeroDeDocumento`, porque es lo que llega desde el header. Si se agrega
   un método nuevo de entrenador, que Tome el documento.
5. **`@PreAuthorize` es la fuente de verdad** de permisos. Vive en los
   controllers. El filtro solo construye el `SecurityContext`.
6. **Los pagos validan el monto contra la tarifa.** `PagoService` compara con
   tolerancia de 0.01 y rechaza. No agregar formas de cobrar sin validar.
7. **No hay tests.** No hay datasource de prueba. La verificación es `compile`
   más pruebas manuales con `curl`.
8. `spring.jpa.open-in-view=false` está activo: los controllers que necesiten
   una relación lazy deben cargarla explícitamente en el service.

### Contrato con el frontend

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