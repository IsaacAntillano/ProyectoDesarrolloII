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

Credenciales del seed (documentadas, solo locales): `ana@victus.co/admin123`
(admin), `sara@victus.co/secretaria123` (secretaria), `enzo@victus.co/entrenador123`
(entrenador).

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

## Autorización por header

> **Esto no es autenticación.** Ver la advertencia al final de la sección.

La vista no maneja token. Al abrir la app se elige un rol
(`SeleccionarRol.tsx`), que queda en `localStorage['user']` y se reenvía en cada
petición como header `X-Rol`. El backend (`RolHeaderFilter`) lee ese header,
valida el valor contra el enum `Rol` y construye el contexto de seguridad con
`ROLE_<rol>`. Los `@PreAuthorize` de los controllers siguen siendo la única
fuente de verdad sobre quién puede llamar a cada endpoint.

```bash
curl -H "X-Rol: ADMINISTRADOR" http://localhost:8080/api/admin/tarifas
```

Sin header, la respuesta es `401`.

**Roles:** `ADMINISTRADOR` · `SECRETARIA` · `ENTRENADOR` · `CLIENTE`

Además del rol, la vista manda **`X-Documento`** con el número de documento del
usuario. El backend lo adjunta al principal de seguridad (`RolHeaderFilter`) y lo
usa para saber a qué entrenador o cliente pertenece la llamada. Por eso los
endpoints de entrenador y de panel de cliente **no reciben el id por la ruta**: un
entrenador no puede actuar en nombre de otro.

```bash
curl -H "X-Rol: ENTRENADOR" -H "X-Documento: 100000003" \
     http://localhost:8080/api/entrenador/perfil
```

| Perfil de acceso | Endpoints |
| --- | --- |
| `SECRETARIA`, `ADMINISTRADOR` | registrar, consultar, listar, actualizar y reactivar clientes |
| `ADMINISTRADOR` | desactivar clientes, CRUD de usuarios del sistema, todo `/api/admin` |
| `SECRETARIA`, `ADMINISTRADOR` | registrar ingreso |
| `SECRETARIA`, `ADMINISTRADOR` | registrar pagos, nomina, arriendo, mantenimiento |
| `ADMINISTRADOR` | generar flujo de caja, factura EPS |
| `ENTRENADOR`, `ADMINISTRADOR` | panel del entrenador (`/api/entrenador`) |
| `CLIENTE`, `ADMINISTRADOR` | panel del cliente (`/api/cliente`) |

### Advertencia

No hay prueba de identidad: cualquier persona o proceso que alcance el puerto
8080 puede declarar `X-Rol: ADMINISTRADOR` y obtener permisos de administrador.
Es aceptable **únicamente en desarrollo local**. No expongas el backend en red
con esta configuración. Para un despliegue real hay que volver a autenticación
(sesión con cookie o token firmado).

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
| `GET` | `/contratos/vencidos` | secretaria, admin |
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

### Pagos y caja — `/pagos` (secretaría y admin)

| Método | Ruta | Descripción |
| --- | --- | --- |
| `POST` | `/mensualidad/{documento}` | mensualidad; renueva el contrato un mes |
| `POST` | `/diario/{documento}` | acceso de cliente diario |
| `POST` | `/copago-eps/{documento}` | copago de beneficiario EPS |
| `POST` | `/nomina/{documento}` | pago a entrenador |
| `POST` | `/arriendo` | gasto de arriendo |
| `POST` | `/mantenimiento/{idEquipo}` | gasto de mantenimiento |
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
│       └── security/      # SecurityConfig, RolHeaderFilter
└── obsidian/              # notas de contexto y lienzo del proyecto
```

### Roles de la aplicación

| Rol | Vista | Qué puede hacer |
| --- | --- | --- |
| `ADMINISTRADOR` | `/admin` | usuarios del sistema, tarifas, equipos, flujo de caja, clientes |
| `SECRETARIA` | `/secretaria`, `/registrar-pago` | clientes, ingresos, pagos |
| `ENTRENADOR` | `/entrenador` | horarios, rutinas, evaluaciones y metas sobre sus clientes |
| `CLIENTE` | `/cliente` | membresía, progreso, rutina, evaluaciones, ingresos |

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

---

## Notas técnicas

- **Lombok 1.18.48** es la versión mínima: las anteriores no soportan JDK 27 y el
  build falla con `ExceptionInInitializerError`.
- **`Equipo.estadoEquipo`** usa `@Enumerated(EnumType.STRING)` para que agregar
  valores al enum no corrompa los registros existentes.
- **No hay tests.** No hay datasource de prueba ni framework de test en el
  frontend. La verificación es `compile`, `npm run build` y `npm run lint`.
- **Las credenciales** viven en `backend/.env`, que está en `.gitignore`.
  `backend/.env.example` documenta las variables.

---

## Licencia

Uso estudiantil. Ver [`LICENSE`](LICENSE).