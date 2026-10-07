# AGENTS.md

Sistema de gestión de gimnasio (Victus-Caf) bajo arquitectura **MVC**. Este repositorio contiene únicamente la **vista**: el frontend Vite + React 19 + TypeScript + Tailwind v4. El README raíz (`Readme.md`, español) está desactualizado; confiar en `package.json`.

## Vista (`victus-caf-frontend/`)
- Vite + React 19 + TypeScript + Tailwind v4 (via `@tailwindcss/vite` en `vite.config.ts`). Su `README.md` es la plantilla stock de Vite — ignorar.
- **Sin autenticación JWT.** El login fue reemplazado por un **selector de rol** (`src/pages/SeleccionarRol.tsx`): se elige rol y se guarda en `localStorage` la clave `user` con `{ id: 0, numeroDocumento: 0, nombreCompleto, rol }`. No existe `token`.
- Rutas: `/` → `SeleccionarRol`; `/admin`, `/secretaria`, `/entrenador`, `/cliente`, `/gestion-clientes*`, `/registrar-cliente-*` protegidas por `PrivateRoute` con prop `allowedRoles` (redirige a `/` si no hay `user` o el rol no es permitido) (`src/App.tsx`). `Layout.tsx` cierra sesión limpiando `localStorage` y volviendo a `BASE_URL`.
- Roles del dominio: `ADMINISTRADOR` · `SECRETARIA` · `ENTRENADOR` · `CLIENTE`. `EntrenadorDashboard` y `ClienteDashboard` son placeholders.
- `npm run dev`: Vite proxya `/api` → `http://localhost:8080`; no hace falta `.env`. `src/services/api.ts` usa `import.meta.env.VITE_API_URL ?? '/api'` (axios, sin interceptor de auth).
- `npm run build` = `tsc -b && vite build` (typecheck incluido). Lint: `npm run lint` (ESLint flat config).
- `vite.config.ts`: `base: '/Sistema-PMS-victus-caf/'` (GitHub Pages); `App.tsx` usa `import.meta.env.BASE_URL` como basename del router.
- Servicios en `src/services/`: `apiTypes.ts` define `ApiResponse<T>` y `unwrap` (compartidos); `apiError.ts` define `getApiErrorMessage` / `isServerUnreachable` / `SERVER_UNREACHABLE_MESSAGE`. No duplicar estos helpers en páginas ni servicios.
- Contrato API (canónico): `POST /api/acceso/registrar-ingreso` con body `{ numeroDocumento }` (en `secretariaService`). No hay versiones duplicadas.

## Backend (externo a este repo)
- El backend Spring Boot vivía en `victus-caf-backend/`; fue **retirado del workspace** (visible solo en git history). La vista consume su API real en `:8080` vía `/api`.
- Residuos de esa etapa quedan en la raíz (`.mvn/`, `mvnw`, `mvnw.cmd`, `BcryptGen.java`, `HELP.md`): **ignorarlos**, no limpiar ni usar.

## Obsidian (contexto + lienzo infinito)
- Vault en `obsidian/` (abrir en Obsidian como *Open folder as vault*): `context/` contiene notas, `canvas/lienzo-victus.canvas` es el lienzo maestro en evolución (spec JSON Canvas).
- **Al iniciar sesión**: leer `obsidian/context/index.md`, `obsidian/context/estado-proyecto.md` y `obsidian/canvas/lienzo-victus.canvas` para contextualizar.
- **Al cerrar sesión**: actualizar `estado-proyecto.md`, añadir entradas a `decisiones.md` y **agregar** nodos/aristas a `lienzo-victus.canvas` (nunca borrar los existentes); mantener JSON válido e IDs únicos. Los archivos de código se referencian como texto (viven fuera del vault); nodos `file` solo para notas internas del vault.
- Todo (notas, lienzo, commits) en español.

## Misc
- `.metals/` es un artefacto LSP de Scala Metals trackeado por error; ignorar.
- `.github/modernize/` es salida de tool-use, no CI. No hay workflows de CI.
- Código/comentarios/commits en español; mantener la convención.