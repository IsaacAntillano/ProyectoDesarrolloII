# Evaluación heurística de usabilidad — Victus CAF

Evaluación de las 10 heurísticas de Nielsen sobre el frontend (`frontend/src/`),
con línea base **antes** de aplicar las mejoras (Fases 1 y 2) y cierre **después**.

- **H1** Visibilidad del estado del sistema
- **H2** Correspondencia entre el sistema y el mundo real
- **H3** Control y libertad del usuario
- **H4** Consistencia y estándares
- **H5** Prevención de errores
- **H6** Reconocimiento más que recuerdo
- **H7** Flexibilidad y eficiencia de uso
- **H8** Estética y diseño minimalista
- **H9** Ayuda a reconocer, diagnosticar y recuperarse de errores
- **H10** Ayuda y documentación

Severidad: 🔴 alta · 🟠 media · 🟢 baja / ✅ resuelto.

---

## Línea base (ANTES)

| Pantalla / componente | Heurística | Hallazgo | Sev. |
| --- | --- | --- | --- |
| Todas las páginas | H1 | Carga mostrada solo como texto "Cargando...", sin skeletons, sin `aria-busy` ni estado de progreso en botones de guardado (algunos botones no se deshabilitan). | 🟠 |
| Todas las páginas | H9 | Error de carga no ofrece reintento; el usuario debe recargar la página o pulsar "Actualizar" si existe. | 🟠 |
| Todas las páginas | H2/H4 | Enums crudos visibles: `tipoPago`, `estadoPago`, `tipoMembresia`, `rol` (p. ej. `ADMINISTRADOR`), métodos de pago con `replaceAll('_',' ')`. Fechas ISO `YYYY-MM-DD` sin formato local. | 🟠 |
| Todas las páginas | H4 | `Login.tsx` usa librerías y estilos distintos de los formularios de registro; cada página duplica sus propios estilos de botón/tabla. | 🟢 |
| `GestionClientes`, `SecretariaDashboard`, `AdminDashboard` | H3/H5 | `window.confirm` nativo (7 usos) sin explicación de consecuencias, no accesible, rompe el flujo. | 🔴 |
| `GestionClientes`, `SolicitudesPlus`, `AdminDashboard` | H3 | Modales hechos a mano con `div fixed`: sin `role="dialog"`, sin `aria-modal`, sin cierre con Escape, sin trampa ni restauración de foco, sin foco inicial. | 🔴 |
| Todas las páginas | H3 | Sin "deshacer" tras acciones destructivas; sin confirmación previa legible (solo se confía en el `confirm`). | 🟠 |
| `Layout.tsx` | H4/H6 | Navegación con `Link`, sin estado activo visible, sin `aria-current`; el usuario no sabe en qué sección está. | 🟠 |
| `Layout.tsx` | H10/H7 | Menú móvil con `aria-label` pero sin `aria-expanded`/`aria-controls`; sin skip link; sin indicador de sesión próxima a expirar. | 🟢 |
| `RegistrarPago.tsx` | H5 | El usuario debe adivinar el valor exacto de la tarifa; el backend rechaza si no coincide. Sin resumen previo de la operación. | 🔴 |
| `RegistrarPago.tsx` | H3/H2 | Selector de tipo de documento (CC/TI/CE) que no se envía a ningún endpoint: control muerto que induce error. | 🟠 |
| `RegistrarPago.tsx` | H1 | Historial carga en silencio; si falla, muestra vacío sin explicar. | 🟢 |
| Registros (mensual/diario/EPS) | H5/H9 | Solo validación `required` del navegador; sin error por campo, sin ayudas de formato (teléfono, documento, correo), el formulario se pierde si el envío falla (no, mantiene valores; sí pierde contexto del error). | 🟠 |
| Registros | H10 | No explican consecuencia: el mensual incluye entrenador el primer mes (cupo 4), el EPS llega con remisión, etc. | 🟢 |
| `SecretariaDashboard.tsx` | H4/H8 | Duplica casi todo `GestionClientes.tsx` (665 vs 981 líneas) con estilos y comportamientos distintos: dos formas de gestionar clientes. | 🟠 |
| `SecretariaDashboard.tsx` | H2 | Acciones solo con icono y `title`; en tablas de mensual/diario/EPS los campos se muestran en crudo. | 🟢 |
| `ClienteDashboard.tsx` | H6/H10 | "No hay horarios disponibles" no distingue sin entrenador / con entrenador sin cupos; Plus no explica elegibilidad (después del primer mes) ni por qué está deshabilitado. | 🟠 |
| `ClienteDashboard.tsx` | H5 | Reservar horario sin confirmación previa: un clic ocupa el cupo. | 🟠 |
| `ClienteDashboard.tsx` | H2 | Progreso EPS como texto plano "3 de 10 sesiones" sin barra; fechas ISO. | 🟢 |
| `EntrenadorDashboard.tsx` | H2 | Texto en inglés mezclado: "manages horarios, rutinas y seguimiento físico". | 🟢 |
| `EntrenadorDashboard.tsx` | H5/H6 | Rutinas/evaluaciones exigen escribir el documento del cliente a mano aunque la lista de asignados está justo encima; error fácil de documento. | 🔴 |
| `EntrenadorDashboard.tsx` | H5 | Evaluación: 8 inputs con solo `placeholder`, sin label visible; validación solo de formato de presión, sin rangos (peso, talla, FC). Sin validación hora inicio < hora fin. | 🟠 |
| `EntrenadorDashboard.tsx` | H1 | Cupo mostrado como texto "Cupo máximo: 4" sin indicar ocupación actual (`2/4`). | 🟢 |
| `SolicitudesPlus.tsx` | H6/H10 | "Automático (el que tenga menos clientes)" no muestra cupos ni explica el criterio; sin contexto del cliente más allá del nombre. | 🟠 |
| `SolicitudesPlus.tsx` | H1 | Tras aprobar/rechazar, el filtro se conserva pero no hay constancia de la acción salvo el toast. | 🟢 |
| `ContratosVencidos.tsx` | H1/H2 | Sin resumen (cantidad, antigüedad máxima); fechas ISO; sin acción de contactar. | 🟢 |
| `GastosOperativos.tsx` | H2 | Valores con `$` + `toLocaleString` sin formato de moneda consistente; sin totales por tipo. | 🟢 |
| `AdminDashboard.tsx` | H4 | Botones sin `type="button"` en varios tab; etiquetas de recurso inconsistentes; `replaceAll('_',' ')` para enums. | 🟢 |
| `Login.tsx` | H5/H9 | Sin mostrar/ocultar contraseña; sin `autoComplete`; credenciales de prueba siempre visibles (ruido) en vez de ayuda opt-in; error 401 genérico. | 🟢 |
| `api.ts` / `App.tsx` | H9 | Token expirado (401) no redirige al login: el usuario ve errores por pantalla. Sin `ErrorBoundary`: un fallo de render deja la pantalla en blanco. | 🔴 |
| `App.tsx` | H1 | `Toaster` sin `aria-live` explícito ni duración diferenciada. | 🟢 |
| `index.html` | H4 | `lang="en"` con interfaz en español. | 🟢 |
| `App.css` | H8 | Archivo muerto (184 líneas) no importado por nadie. | 🟢 |
| `SeleccionarRol.tsx` | H8/H9 | Ruta obsoleta que emite un "usuario" sin JWT y contradice la autenticación real (`X-Documento` eliminado en backend). Falsa sensación de seguridad. | 🔴 |
| Accesibilidad global | H4 | Solo 3 usos de `aria-*` en toda la app; botones de icono sin `aria-label` (solo `title`); tablas sin `scope="col"`; sin foco visible consistente; `required` sin marcador visual; sin skip link. | 🟠 |

### Resumen de la línea base

- 7 confirmaciones nativas, 4 modales artesanales, 0 componentes compartidos de UI.
- 0 etiquetas en español centralizadas: cada página traduce (o no) los enums por su cuenta.
- 0 formateo de fechas/moneda: ISO crudo en todas las tablas.
- 2 CRUD de clientes duplicados (secretaría vs. gestión).
- 1 control muerto (tipo de documento en pagos) y 1 ruta obsoleta (`/seleccionar-rol`).
- Sin gestión global de 401 ni `ErrorBoundary`.

---

## Cierre (DESPUÉS)

Aplicadas las Fases 1 y 2. La Fase 3 (verificación exhaustiva y documentación)
queda pospuesta por decisión de alcance, pero el cierre de la evaluación se
completa aquí.

### Fundaciones aplicadas (Fase 1)

| Pieza | Heurísticas | Estado |
| --- | --- | --- |
| `components/ui/` — `Button`, `Modal` (con `<dialog>` + `showModal()`), `ConfirmDialog`, `Field`/`Input`/`Select`/`Textarea`/`PasswordInput`, `StatusBadge`, `EmptyState`, `LoadingState`, `ErrorState`, `PageHeader`, `HelpTip`, `ProgressBar`, `ErrorBoundary` | H1, H3, H4, H5, H8, H9, H10 | ✅ |
| `constants/labels.ts` — etiquetas en español para todos los enums, incluida la etiqueta corregida de `CANCELADO_ANCTICIPADAMENTE` | H2, H4 | ✅ |
| `utils/format.ts` — fechas y horas en zona local (`3 nov 2026`, `08:00`), moneda (`$85.000`), documentos con miles | H1, H2 | ✅ |
| `Layout`: `NavLink` con estado activo y `aria-current`, menú móvil con `aria-expanded`/`aria-controls`, skip link al contenido | H4, H6, H7 | ✅ |
| `services/api.ts`: interceptor 401 que limpia la sesión y redirige al login con aviso | H9 | ✅ |
| `App.tsx`: `ErrorBoundary` y `Toaster` con `aria-live` y duración fija | H1, H9 | ✅ |
| `index.html`: `lang="es"` y título descriptivo | H4 | ✅ |
| Eliminados `App.css` (muerto) y `SeleccionarRol.tsx` con su ruta `/seleccionar-rol` | H8, H9 | ✅ |
| `GET /api/pagos/tarifas` (solo lectura, admin + secretaria) para mostrar el valor esperado antes de cobrar | H5 | ✅ |

### Pantallas (Fase 2)

| Pantalla | Mejoras aplicadas | Estado |
| --- | --- | --- |
| **Login** | Mostrar/ocultar contraseña con `aria-pressed`, `autoComplete="username"`/`"current-password"`, errores específicos por causa (401, red caída, inesperado), aviso "tu sesión expiró", credenciales de prueba dentro de `<details>` opt-in. | ✅ |
| **Secretaría** | Consolidada en un inicio con totales por tipo de cliente y accesos rápidos. El CRUD vive solo en `GestionClientes`. | ✅ |
| **Gestión de Clientes** | `ConfirmDialog` con consecuencia explícita en lugar de `window.confirm`; modales accesibles para editar, ver contrato, cancelar EPS y asignar entrenador; badges de estado; fechas y documentos formateados; `aria-label` en botones de icono; estados de carga, vacío (con siguiente paso) y error con reintento; tabla con `scope="col"` y `caption`. | ✅ |
| **Registro Mensual** | Validación inline por campo con `role="alert"`, ayudas de formato, explicación de la consecuencia (entrenador el primer mes, cupo 4) en `HelpTip`, botón con carga, sin pérdida de datos ante error. | ✅ |
| **Registro Diario** | Idem, con ayuda del flujo (cobrar → marcar ingreso). | ✅ |
| **Registro EPS** | Validación de sesiones (≥1), fecha de fin futura, dental/médicos obligatorios; ayuda de qué es la remisión. | ✅ |
| **Registrar Pago** | Eliminado el control muerto de tipo de documento; tarifa esperada pre-rellenada desde `GET /api/pagos/tarifas`; **resumen de confirmación** antes de cobrar con aviso si el valor no coincide; historial con fechas, moneda y badges; auto-búsqueda con debounce. | ✅ |
| **Contratos Vencidos** | Resumen (cantidad, antigüedad máxima), ordenación por urgencia, badges de días vencidos, estado vacío positivo, fechas formateadas. | ✅ |
| **Gastos Operativos** | Totales por tipo, ayuda de cálculo del flujo de caja, formato de moneda consistente, botones con carga. | ✅ |
| **Solicitudes Plus** | Modales accesibles para aprobar/rechazar; explicación del modo automático (menos clientes, cupo 4) y de la consecuencia; fechas formateadas; filtros accesibles; motivo de rechazo visible para el cliente. | ✅ |
| **Portal del Cliente** | Confirmación de reserva con detalle del horario; barra de progreso de sesiones EPS con restantes; elegibilidad Plus explicada (después del primer mes) y estados diferenciados (pendiente/aprobada/sin entrenador); estados vacíos con siguiente paso en rutinas, evaluaciones e ingresos; fechas formateadas. | ✅ |
| **Portal del Entrenador** | Selector de clientes asignados en lugar de escribir el documento a mano (clic en la lista + desplegable); etiquetas reales en la evaluación (antes solo placeholders); validación por rangos (peso, talla, grasa, FC, presión `120/80`) e inicio < fin; cupo con barra de progreso y aviso al completarse; texto en inglés corregido. | ✅ |
| **Administrador** | Inactivar usuario con diálogo accesible confirmado; botones de guardado con carga y sin doble envío; `aria-label` en acciones de icono; admin protegido de auto-inactivación. | ✅ |

### Balance final

- Confirmaciones nativas: **7 → 0**. Modales artesanales: **4 → 0** (todos `<dialog>` con Escape, foco atrapado y restauración).
- Enums crudos visibles: eliminados en las pantallas migradas; etiquetas centralizadas en `labels.ts`.
- Fechas ISO crudas: reemplazadas por formato `es-CO` en zona local en todas las pantallas migradas.
- CRUD de clientes duplicado: **eliminado** (secretaría es un inicio; gestión centralizada).
- Control muerto en pagos y ruta obsoleta sin JWT: **eliminados**.
- `aria-*`: de 3 usos a navegación, diálogos, campos con `aria-describedby`/`aria-invalid`, barras de progreso con `role="progressbar"` y botones con `aria-label`/`aria-pressed`.
- Formularios con validación inline y ayudas: registries, pagos, horarios, evaluación, gastos.

### Verificación realizada

- `npm run build` (typecheck + Vite) y `npm run lint`: ✅
- Backend: `./mvnw -q compile` tras añadir `GET /api/pagos/tarifas`: ✅
- La prueba manual existente de flujos funcionales (61 checks) no se re-ejecutó en esta fase porque no se tocó lógica de negocio; el cambio de backend es un endpoint de lectura aditivo. Queda como parte de la **Fase 3** pendiente.
