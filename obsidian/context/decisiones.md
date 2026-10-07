# Registro de decisiones

Formato: fecha · decisión · motivo. Se añade una entrada al cerrar cada sesión.

| Fecha | Decisión | Motivo |
| --- | --- | --- |
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

## Plantilla

- Fecha:
- Decisión:
- Motivo:
- Alternativas descartadas: