# Registro de decisiones

Formato: fecha · decisión · motivo. Se añade una entrada al cerrar cada sesión.

| Fecha | Decisión | Motivo |
| --- | --- | --- |
| 2026-11-03 | Ocultar `contrasena` en las entidades con **`@JsonIgnore`** | Las respuestas de clientes, usuarios y solicitudes plus devolvían la contraseña en texto plano. El login y los DTO de entrada no se afectan |
| 2026-11-03 | Modelar la relación entrenador-cliente en **`AsignacionEntrenador`** | El flag booleano del cliente no guardaba origen, fechas ni historial. Una tabla permite cupo, vencimiento a un mes y liberar el cupo al cancelar |
| 2026-11-03 | **Primer mes incluido** (`origen=PRIMER_MES`, `fechaFin=hoy+1 mes`); el **plus** (`origen=PLUS`) no lleva fecha de corte | Es la regla del negocio: todo particular mensual arranca con entrenador un mes; después el servicio se solicita y se cobra aparte |
| 2026-11-03 | **Cupo máximo de 4 clientes activos** por entrenador, validado en backend | La vista ya limitaba roles, pero el cupo de clientes es una regla de negocio y no puede depender del cliente |
| 2026-11-03 | La solicitud plus requiere **aprobación del administrador** y puede elegir entrenador; si no, se escoge el de menos clientes con cupo | PC-0011 pide control administrativo. La asignación automática evita dejar solicitudes aprobadas sin entrenador |
| 2026-11-03 | Los **contratos vencidos se buscan por fecha** (`fechaVencimiento < hoy`), no por `estadoMembresia` | Un contrato puede quedar `ACTIVO` si nadie lo renovó; el estado no refleja el vencimiento real |
| 2026-11-03 | Conservar `CANCELADO_ANCTICIPADAMENTE` y corregir solo la etiqueta de la vista | El valor ya está persistido como `STRING`; renombrarlo rompería los registros existentes |
| 2026-11-04 | **Eliminar `RolHeaderFilter` y cualquier header de rol** | `JwtAuthFilter` arma el principal `"ROL:documento"`; el filtro viejo seguía autenticando por `X-Rol` como fallback. El JWT es la única fuente de verdad |
| 2026-11-04 | **Expiración JWT: 4 h, sin denylist** | RS-0012 se cierra con tokens cortos y borrado local; una tabla de revocación añadiría complejidad sin beneficio para un proyecto académico |
| 2026-11-04 | **Factura EPS = sesiones EPS × (tarifa EPS ÷ 20) + copagos del período** | La mensualidad EPS prorratea el valor por sesión estándar; el total no puede salir de copagos únicamente porque "los servicios prestados" son las terapias |
| 2026-11-04 | **`/registro` público para particular mensual** | CO-0001 exige que el cliente seleccione su membresía; se reutiliza el flujo de creación del particular mensual sin romper el cupo ni exigir login previo |
| 2026-11-04 | **Bloqueo automático por vencimiento de contrato** para mensuales, y por copago en 30 días para EPS | Rechazar ingreso no basta: el estado debe reflejarlo sin depender de que alguien lo pulse. Es la misma regla menos rígida que el stub de 30 días |

| 2026-10-07 | Agregar el header **`X-Documento`** además de `X-Rol` | El selector de rol dejaba `numeroDocumento` en 0, así que los services de entrenador (que lo necesitan) no podían resolver quién llamaba. Ahora la identidad viaja en un header aparte y el backend la adjunta al principal |
| 2026-10-07 | Corregir `migrarDiarioAMensual` convirtiendo el cliente en vez de crear uno nuevo | La versión anterior insertaba un nuevo usuario con el mismo `numeroDeDocumento`, que es único, así que siempre fallaba. Ahora se mueve la fila entre `particular_diario` y `particular_mensual` conservando el `usuario.id`, y se crea el contrato. Se hace con SQL nativo porque borrar la entidad del hijo eliminaba también la fila base por la herencia JOINED, que chocaba con las FKs de asistencia/pago |
| 2026-10-07 | Los services de entrenador y evaluación reciben **documento, no id de base** | Antes usaban `idEntrenador` con `findById`. Lo que llega del cliente es un documento, y además así nadie puede actuar en nombre de otro entrenador |
| 2026-10-07 | Exponer **`PagoController`** (`/api/pagos`) | `AccesoService` exige pago de membresía para dar ingreso, pero no había forma de registrarlo: el sistema no podía cobrar |
| 2026-10-07 | Dejar el mantenimiento de tarifas en `AdminService` y los pagos en `PagoService` | `PagoService` ya tenía `actualizarTarifa`; duplicarlo en `AdminService` habría creado dos caminos para lo mismo. `/api/admin/tarifas` es el que usa la vista |
| 2026-10-07 | Convertir el repo en **monorepo** (`frontend/` + `backend/`) y revivir el backend desde git history | Había 4 repos y 2 vaults en un mismo workspace, 3 de ellos muertos. El backend hacía falta: sin él la vista no tiene con qué speak |
| 2026-10-07 | Reemplazar JWT por **autorización por header de rol** (`X-Rol`) | La vista ya no manejaba token desde la sesión anterior; con el backend exigiendo JWT toda petición daba 401. Es la mínima pieza que hace que ambos lados se entiendan |
| 2026-10-07 | Conservar la **arquitectura MVC**, no adoptar la hexagonal | `victus-caf-backend/AGENTS.md` prescribía una arquitectura hexagonal de 4 capas para un repo que solo tenía 7 archivos. Sanear no es rediseñar: las 108 clases MVC funcionan |
| 2026-10-07 | Un único `clienteService.ts` con los tipos ricos | Había dos servicios contra los mismos endpoints con tipos distintos: dos fuentes de verdad que ya divergían |
| 2026-10-07 | Credenciales a `.env`, nunca al repositorio | `application.properties` tenía `root/12345` hardcodeado |
| 2026-10-07 | Subir **Lombok a 1.18.48** en vez de degradar el JDK | 1.18.32 no soporta JDK 27 (`ExceptionInInitializerError`). El proyecto apunta a Java 21, así que el JDK local iba a cambiar antes que el código |
| 2026-10-07 | Borrar los repos y zips del workspace | `victus-caf-backend/` (esqueleto vacío), `SistemaBasicoVictus/` (prototipo sin commits), `victus-notas/` (vault vacío), 2 zips. Nada útil: el `schema.sql` de `SistemaBasicoVictus` resultaba incompatible con el modelo JPA real |
| 2026-10-07 | **No agregar tests** en esta sesión | No hay datasource de prueba ni framework en el frontend. `victus-caf-backend/AGENTS.md` los exigía, pero ese repo se eliminó |
| 2026-09-15 | Crear vault Obsidian (`obsidian/`) con contexto + lienzo maestro `.canvas` | El asistente entrega contexto al iniciar sesión y deja un mapa visual en evolución |
| 2026-09-15 | Retirar el backend del workspace y dejar el repo como **solo vista (MVC)** | Decisión del usuario en ese momento; **revertida el 2026-10-07** al devolver el backend al workspace |
| 2026-09-15 | Eliminar la autenticación **JWT** de la vista; entrada por **selector de rol** | Sin login ni token; se elige rol y se guarda `localStorage['user']` |

---

## 2026-10-07 — Monorepo y autorización por header

- **Decisión**: repo único con `frontend/` y `backend/`; la autenticación pasa a
  ser un header `X-Rol` que el backend toma como declaración de rol.
- **Motivo**: había tres repos vivos para un solo producto y ninguna forma de que
  la vista hablara con el backend.
- **Alternativas descartadas**:
  - *Volver a JWT en la vista*: más seguro, pero deshace una decisión de diseño ya
    tomada y registrada en este vault.
  - *Sesión con cookie*: más seguro todavía, pero es un rediseño de auth que
    excede el alcance.
  - *Adoptar la arquitectura hexagonal del esqueleto*: exigiría reescribir 108
    clases que ya funcionan.
- **Consecuencia asumida**: la autorización no prueba identidad. Documentado en
  el README y en `AGENTS.md` como advertencia explícita.

---

## 2026-11-04 — Cierre de brechas para las 48 HU

- **Decisión**: el sistema pasa de “funciona para la mayoría” a “48 HU
  auditadas sin brechas”. `FacturaEps`, auto-registro, ingreso, migración,
  bloqueo automático y permisos de gastos quedan operativos.
- **Motivo**: auditoría destapó huecos reales: factura EPS placeholder,
  "Registrar ingreso" invisible, `/api/auth/registro-cliente` inexistente,
  blocker por secretaria o permiso inexistente.
- **Consecuencias**:
  - MariaDB apagada impidió el curl final; se reportará siempre.
  - Los JWT duran 4 h; sin revocación explícita.
  - La migración diario → mensual usa BCrypt, no texto plano.

---

## 2026-11-03 — Asignación de entrenador y servicio plus

- **Decisión**: toda relación entrenador-cliente pasa por `AsignacionEntrenador`;
  el entrenador del primer mes se crea al registrar el particular mensual y el
  servicio plus requiere `SolicitudEntrenadorPlus` aprobada por el admin.
- **Motivo**: el cliente solo tenía un booleano. No había forma de saber si el
  entrenador venía incluido, si era plus, cuándo vencía ni cuántos clientes
  tenía cada entrenador. El cupo de 4 y la aprobación administrativa son reglas
  del negocio que deben vivir en el backend.
- **Consecuencias**:
  - `AsignacionEntrenadorService` es la única puerta para asignar/liberar; cierra
    la asignación anterior y resincroniza `cantidadClientesActivos`.
  - Un cliente sin entrenador puede pedir plus solo después del primer mes.
  - Cancelar el contrato EPS o liberar manualmente cierra la asignación y
    devuelve el cupo.
- **Alternativas descartadas**:
  - *Seguir usando el flag `tieneEntrenador` del cliente*: no guarda historial ni
    origen, y el cupo se volvería a contar mal.
  - *Asignación automática sin aprobación*: contradice PC-0011.
  - *Renombrar el enum EPS*: rompe los valores persistidos con `EnumType.STRING`.

---

## Plantilla

- Fecha:
- Decisión:
- Motivo:
- Alternativas descartadas: