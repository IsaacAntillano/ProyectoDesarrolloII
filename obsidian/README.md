# Vault Obsidian · Victus-Caf

Este vault es la **memoria viva del proyecto**: contexto para el asistente y mapa visual en evolución.

## Contenido

```
obsidian/
  .obsidian/            # configuración local del vault
  context/
    index.md            # punto de entrada / "cerebro" (leer primero)
    estado-proyecto.md  # snapshot por sesión
    decisiones.md       # registro de decisiones
    glosario.md         # glosario de dominio
  canvas/
    lienzo-victus.canvas # lienzo infinito maestro (spec JSON Canvas)
```

## Cómo abrirlo

Obsidian → *Open folder as vault* → selecciona esta carpeta `obsidian/`.

## Convención (asistente ↔ humano)

1. **Inicio de sesión**: leer `context/index.md` + `lienzo-victus.canvas` para contextualizar.
2. **Cierre de sesión**: actualizar `estado-proyecto.md`, añadir a `decisiones.md` y **agregar** nodos/aristas al lienzo (el lienzo nunca se borra; solo crece).
3. Los nodos del lienzo con rutas de código (`victus-caf-backend/...`, `victus-caf-frontend/...`) son **referencias en texto** a archivos fuera del vault; el clic no abre el archivo, solo muestra la ruta. Las notas internas (`context/*.md`) sí se abren desde el lienzo.

Todo en **español**, igual que el resto del repo.