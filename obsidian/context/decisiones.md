# Registro de decisiones

Formato: fecha · decisión · motivo. Se añade una entrada al cerrar cada sesión.

| Fecha | Decisión | Motivo |
| --- | --- | --- |
| 2026-09-15 | Crear vault Obsidian (`obsidian/`) con contexto + lienzo maestro `.canvas` | El asistente entrega contexto al iniciar sesión y deja un mapa visual en evolución ("lienzo infinito"). |
| 2026-09-15 | Retirar el backend del workspace y dejar el repo como **solo vista (MVC)** | El usuario sacó `victus-caf-backend/` (queda en git history); la vista consume su API real vía `/api` → `:8080`. |
| 2026-09-15 | Eliminar la autenticación **JWT** de la vista; entrada por **selector de rol** (`SeleccionarRol.tsx`) | Sin login ni token; se elige rol y se guarda `localStorage['user']` y se navega al dashboard del rol. |
| 2026-09-15 | Mantener el consumo de datos por la **API real** (solo se quitó el Bearer); unificar `ApiResponse`/`unwrap` en `apiTypes.ts` y helpers de error en `apiError.ts` | Evitar mocks y duplicación en la vista. |

## 2026-09-15 — Vault Obsidian en el repo

- **Decisión**: vault en subcarpeta `obsidian/` (no el repo entero); lienzo único maestro `canvas/lienzo-victus.canvas` que crece por sesión; convención de actualizar `estado-proyecto.md` y `decisiones.md` al cerrar cada sesión.
- **Motivo**: mantener Obsidian separado del source para no ensuciar el árbol; un lienzo evolutivo preserva el historial visual sin duplicados de archivos.

---
## Plantilla

- Fecha:
- Decisión:
- Motivo:
- Alternativas descartadas: