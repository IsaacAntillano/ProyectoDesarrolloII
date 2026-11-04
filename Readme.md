# Victus CAF

Sistema de gestión para un Centro de Acondicionamiento Físico (CAF): clientes,
contratos, remisiones médicas, inventario, tarifas y flujo de caja.

Monorepo con dos módulos:

| Módulo | Stack | Puerto |
| --- | --- | --- |
| [`frontend/`](frontend/) | Vite · React 19 · TypeScript · Tailwind v4 · axios | 5173 |
| [`backend/`](backend/) | Spring Boot 3.2.5 · Java 21 · Spring Security · JPA · MariaDB | 8080 |

---

## Puesta en marcha

### Requisitos

- JDK 21 o superior (probado con JDK 27)
- Node.js 20 o superior
- MariaDB corriendo con la base `victus_caf_db` creada y accesible por TCP

No hace falta instalar Maven: el backend trae wrapper (`backend/mvnw`).

### 1. Base de datos

El esquema lo genera Hibernate a partir de los entities (`ddl-auto=update`), así
que no hay migraciones que correr. Solo hace falta la base vacía:

```sql
CREATE DATABASE IF NOT EXISTS victus_caf_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;
```

Al levantar por primera vez, el backend ejecuta un seed (`DataSeeder`) que
crea el admin, la secretaria, el entrenador, las tarifas y un equipo de
ejemplo, **solo si la base no tiene usuarios todavía**. No pisa datos
existentes.

Credenciales del seed (documento/contraseña, solo locales):
`100000001` / `admin123` (admin), `100000002` / `secretaria123` (secretaria),
`100000003` / `entrenador123` (entrenador). El login se hace con el número de
documento, no con el correo.

Spring Boot se conecta por TCP, así que MariaDB debe escuchar en `3306`. En
distribuciones que vienen con `skip-networking` o sin `bind-address`, hay que
habilitarlo:

```sql
INSTALL PLUGIN bind_address SONAME 'haed';
SET GLOBAL bind_address='127.0.0.1';
```

### 2. Backend

```bash
cd backend
cp .env.example .env      # y completar DB_USERNAME / DB_PASSWORD
./mvnw spring-boot:run
```

Levanta en `http://localhost:8080`.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Levanta en `http://localhost:5173`. Vite hace proxy de `/api` a
`http://localhost:8080`, así que no hace falta configurar nada más.

### Verificación

```bash
cd frontend && npm run build   # incluye typecheck (tsc -b)
cd frontend && npm run lint
cd backend && ./mvnw compile
```

---

## Autenticación JWT

El backend es **stateless** y exige `Authorization: Bearer <token>` en todas las
rutas, salvo el login. El login se hace con **documento y contraseña**:

```bash
curl -X POST http://localhost:8080/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"documento":"100000001","contrasena":"admin123"}'
```

La respuesta incluye `token`, `rol`, `documento` y `nombreCompleto`. El frontend
(`Login.tsx`) guarda todo en `localStorage['user']`; el interceptor de
`src/services/api.ts` añade el header `Authorization: Bearer ...` en cada
petición.

`JwtAuthFilter` valida el token, y construye el `SecurityContext` con
`ROLE_<rol>`. El documento viaja como sujeto del token y queda en el principal
como `ROL:documento`; los controllers que necesitan saber quién llama usan
`RolHeaderFilter.documentoActual()`, que lee el principal (el nombre de la clase
es histórico: ya no lee headers). Por eso los endpoints de entrenador y de panel
de cliente **no reciben el id por la ruta**: un entrenador no puede actuar en
nombre de otro.

**Roles:** `ADMINISTRADOR` · `SECRETARIA` · `ENTRENADOR` · `CLIENTE`

| Perfil de acceso | Endpoints |
| --- | --- |
| `SECRETARIA`, `ADMINISTRADOR` | registrar, consultar, listar, actualizar y reactivar clientes; registrar ingresos y pagos |
| `ADMINISTRADOR` | desactivar clientes, CRUD de usuarios del sistema, tarifas, equipos, flujo de caja, contratos vencidos, cancelación/cupos de entrenador y solicitudes plus |
| `ENTRENADOR`, `ADMINISTRADOR` | panel del entrenador (`/api/entrenador`) |
| `CLIENTE`, `ADMINISTRADOR` | panel del cliente (`/api/cliente`) |

### Advertencia

El token se firma con `app.jwtSecret` (variable `JWT_SECRET`) y expira en 24 h
por defecto (`JWT_EXPIRATION_MS`). En desarrollo la clave por defecto está en
`application.properties`, así que **no expongas el backend en red** sin
configurar un secreto propio.


---

## Endpoints

Base: `/api`

### Clientes — `/clientes`

| Método | Ruta | Acceso |
| --- | --- | --- |
| `POST` | `/mensual` | secretaria, admin |
| `GET` | `/mensual/{numeroDocumento}` | secretaria, admin |
| `PUT` | `/mensual/{numeroDocumento}` | secretaria, admin |
| `PUT` | `/mensual/{numeroDocumento}/reactivar` | secretaria, admin |
| `DELETE` | `/mensual/{numeroDocumento}` | admin |
| `POST` | `/diario` | secretaria, admin |
| `GET` | `/diario/{numeroDocumento}` | secretaria, admin |
| `PUT` | `/diario/{numeroDocumento}` | secretaria, admin |
| `PUT` | `/diario/{numeroDocumento}/reactivar` | secretaria, admin |
| `DELETE` | `/diario/{numeroDocumento}` | admin |
| `POST` | `/eps` | secretaria, admin |
| `GET` | `/eps/{numeroDocumento}` | secretaria, admin |
| `PUT` | `/eps/{numeroDocumento}` | secretaria, admin |
| `PUT` | `/eps/{numeroDocumento}/reactivar` | secretaria, admin |
| `DELETE` | `/eps/{numeroDocumento}` | admin |
| `GET` | `/mensuales/activos` · `/mensuales/todos` | secretaria, admin |
| `GET` | `/diarios/activos` · `/diarios/todos` | secretaria, admin |
| `GET` | `/eps/activos` · `/eps/todos` | secretaria, admin |
| `GET` | `/mensual/{numeroDocumento}/contrato` | secretaria, admin |
| `PUT` | `/eps/{numeroDocumento}/cancelar` | admin |
| `PUT` | `/eps/{numeroDocumento}/entrenador/{documentoEntrenador}` | admin |
| `DELETE` | `/eps/{numeroDocumento}/entrenador` | admin |
| `GET` | `/contratos/vencidos` | admin |
| `POST` | `/diario/migrar/{numeroDocumento}` | secretaria, admin |

### Usuarios del sistema — `/usuarios-sistema` (solo admin)

| Método | Ruta |
| --- | --- |
| `GET` | `/` |
| `GET` | `/buscar?documento=` |
| `POST` | `/` |
| `PUT` | `/{id}` |
| `DELETE` | `/{id}` |
| `PATCH` | `/{id}/reactivar` |

### Administración — `/admin` (solo admin)

| Método | Ruta | Descripción |
| --- | --- | --- |
| `GET` | `/tarifas` | tarifas por tipo de cliente |
| `PUT` | `/tarifas/{tipo}` | actualiza la tarifa de un tipo |
| `GET` | `/equipos` | inventario de equipos |
| `GET` | `/equipos/mantenimiento-proximo` | mantenimiento en los próximos 5 días |
| `POST` | `/equipos` | registra un equipo |
| `GET` | `/flujo-caja?fecha=AAAA-MM-DD` | flujo de caja de una fecha |
| `GET` | `/solicitudes-plus?estado=` | solicitudes de entrenador plus |
| `PUT` | `/solicitudes-plus/{id}/aprobar` | aprueba y asigna entrenador |
| `PUT` | `/solicitudes-plus/{id}/rechazar` | rechaza con observación |

### Pagos y caja — `/pagos` (secretaría y admin)

| Método | Ruta | Descripción |
| --- | --- | --- |
| `POST` | `/mensualidad/{documento}` | mensualidad; renueva el contrato un mes |
| `POST` | `/diario/{documento}` | acceso de cliente diario |
| `POST` | `/copago-eps/{documento}` | copago de beneficiario EPS |
| `POST` | `/plus/{documento}` | servicio de entrenador plus |
| `POST` | `/nomina/{documento}` | pago a entrenador |
| `POST` | `/arriendo` | gasto de arriendo |
| `POST` | `/mantenimiento/{idEquipo}` | gasto de mantenimiento |
| `GET` | `/gastos?fecha=AAAA-MM-DD` | gastos operativos (solo admin) |
| `POST` | `/flujo-caja?fecha=` | consolida pagos y gastos (solo admin) |
| `GET` | `/facturas-eps?periodo=` | factura EPS (solo admin) |
| `GET` | `/cliente/{documento}` | historial de pagos |
| `PUT` | `/tarifas/{tipo}` | actualiza tarifa (solo admin) |

El backend **valida el valor contra la tarifa vigente** y rechaza el pago si no
coincide: es imposible cobrar un monto arbitrario.

### Entrenador — `/entrenador` (entrenador y admin)

| Método | Ruta | Descripción |
| --- | --- | --- |
| `GET` | `/perfil` | datos del entrenador que llama |
| `GET` | `/clientes` | clientes activos asignados al entrenador |
| `GET` | `/horarios` | sus horarios declarados |
| `POST` | `/horarios` | declara un horario |
| `POST` | `/horarios/{id}/asignar/{documento}` | asigna horario a cliente Plus |
| `POST` | `/rutinas/{documento}` | crea rutina para un cliente |
| `POST` | `/mensajes/{documento}` | mensaje a un cliente |
| `POST` | `/evaluaciones/inicial/{documento}` | evaluación inicial (calcula IMC) |
| `POST` | `/evaluaciones/periodica/{documento}` | evaluación de seguimiento |
| `POST` | `/metas/particular/{documento}` | meta física de particular |
| `POST` | `/metas/eps/{documento}` | meta clínica de EPS |

### Panel del cliente — `/cliente` (cliente y admin)

| Método | Ruta | Descripción |
| --- | --- | --- |
| `GET` | `/perfil` | datos, membresía y contrato |
| `GET` | `/progreso` | peso perdido, IMC y grasa |
| `GET` | `/rutinas` | rutinas activas |
| `GET` | `/evaluaciones` | historial de evaluaciones |
| `GET` | `/asistencias` | historial de ingresos |
| `GET` | `/horarios-disponibles` | cupos del entrenador asignado |
| `POST` | `/horarios/{id}/reservar` | reserva un cupo |
| `POST` | `/solicitud-plus` | solicita entrenador plus |
| `GET` | `/solicitud-plus` | estado de sus solicitudes plus |

### Notificaciones — `/notificaciones` (admin y secretaria)

| Método | Ruta | Descripción |
| --- | --- | --- |
| `GET` | `/` | todas |
| `GET` | `/no-leidas` | sin leer |
| `POST` | `/copago-pendiente/{documento}` | genera alerta de copago pendiente |
| `PUT` | `/{id}/leida` | marca leida |

### Acceso — `/acceso`

| Método | Ruta | Acceso |
| --- | --- | --- |
| `POST` | `/registrar-ingreso` | secretaria, admin |

Todas las respuestas usan el sobre `ApiResponse<T>`:
`{ success, message, data }`. Los errores también: `{ success: false, message }`
con el status HTTP correspondiente (400 validación, 401 sin autenticar, 403 sin
permisos, 404 no encontrado).

---

## Estructura

```
victus-caf/
├── frontend/              # vista
│   └── src/
│       ├── components/    # Layout, PrivateRoute, DocumentTypeBar
│       ├── constants/     # límites de cupo por rol
│       ├── pages/         # una vista por rol + formularios de registro
│       ├── services/      # capa de acceso a la API (axios)
│       └── utils/         # helpers de error
├── backend/               # modelo + controlador
│   └── src/main/java/com/victuscaf/
│       ├── VictusCafApplication.java
│       ├── gimnasio/      # dominio del CAF
│       │   ├── controller/
│       │   ├── service/
│       │   ├── repository/
│       │   ├── models/
│       │   ├── dto/
│       │   └── exception/
│       └── security/      # SecurityConfig, JwtAuthFilter, AuthController
└── obsidian/              # notas de contexto y lienzo del proyecto
```

### Roles de la aplicación

| Rol | Vista | Qué puede hacer |
| --- | --- | --- |
| `ADMINISTRADOR` | `/admin` | usuarios del sistema, tarifas, equipos, flujo de caja, clientes, gastos operativos, contratos vencidos y solicitudes plus |
| `SECRETARIA` | `/secretaria`, `/registrar-pago` | clientes, ingresos, pagos |
| `ENTRENADOR` | `/entrenador` | sus clientes asignados, horarios, rutinas, evaluaciones y metas |
| `CLIENTE` | `/cliente` | membresía, progreso, rutina, evaluaciones, ingresos, horarios y solicitud plus |

---

## Modelo de datos

`Usuario` y `UsuarioSistema` son clases abstractas con
`@Inheritance(strategy = JOINED)`, así que cada subclase tiene su propia tabla.

```
Usuario (abstracta)          UsuarioSistema (abstracta)
├── ParticularMensual        ├── Administrador
├── ParticularDiario         ├── Secretaria
└── BeneficiarioEps          └── Entrenador
```

Relaciones: `ParticularMensual` ↔ `Contrato` (1:1, genera contrato al registrarse)
y `BeneficiarioEps` ↔ `Remision` (1:1). Ambas usan
`@JsonManagedReference` / `@JsonBackReference` para evitar recursión al
serializar a JSON.

### Asignación de entrenador

`AsignacionEntrenador` relaciona un cliente (`Usuario`) con un `Entrenador`:

- Un cliente tiene **una sola asignación activa** a la vez.
- Un entrenador atiende como máximo **4 clientes activos** (cupo validado en
  `AsignacionEntrenadorService`; `Entrenador.cantidadClientesActivos` se
  resincroniza desde las asignaciones).
- `origen` distingue `PRIMER_MES` (entrenador incluido al registrarse, con
  `fechaFin` a un mes) de `PLUS` (servicio solicitado por el cliente y aprobado
  por el administrador, sin fecha de corte).
- Al cancelar el contrato EPS o liberar el entrenador, la asignación se cierra y
  el cupo queda disponible.

`SolicitudEntrenadorPlus` registra la petición del servicio plus: `PENDIENTE`,
`APROBADA` o `RECHAZADA`. Solo se permite después del primer mes de contrato y
sin un entrenador activo; al aprobarla se crea la asignación `PLUS` y se marca
`ParticularMensual.tieneEntrenador`.

---

## Notas técnicas

- **Lombok 1.18.48** es la versión mínima: las anteriores no soportan JDK 27 y el
  build falla con `ExceptionInInitializerError`.
- **`Equipo.estadoEquipo`** usa `@Enumerated(EnumType.STRING)` para que agregar
  valores al enum no corrompa los registros existentes.
- **No hay tests.** No hay datasource de prueba ni framework de test en el
  frontend. La verificación es `compile`, `npm run build` y `npm run lint`.
- **`SeleccionarRol.tsx` es código obsoleto.** Sigue montado en
  `/seleccionar-rol`, pero ya no emite token; el ingreso real es `Login.tsx`.
- **El enum EPS conserva un typo histórico:**
  `CANCELADO_ANCTICIPADAMENTE` (sic). No se renombra porque está persistido con
  `@Enumerated(EnumType.STRING)`; la vista lo muestra como "Cancelado
  anticipadamente".
- **Las contraseñas no se serializan.** `Usuario.contrasena` y
  `UsuarioSistema.contrasena` llevan `@JsonIgnore`; el login lee el campo en el
  backend, pero nunca viaja en una respuesta.
- **Las credenciales** viven en `backend/.env`, que está en `.gitignore`.
  `backend/.env.example` documenta las variables.

---

## Licencia

Uso estudiantil. Ver [`LICENSE`](LICENSE).