<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Reglas de Fuego y Brasas

## Lecturas según el trabajo

- Para cualquier tarea, leer [Reglas del proyecto](.agents/rules/proyecto.md) y la especificación del hito o módulo afectado.
- Para escribir o revisar código, aplicar también [Reglas de código](.agents/rules/codigo.md), incluidas las decisiones del propietario sobre Yarn, Tailwind, tipos separados y Proxy.
- Para diseñar, construir o revisar interfaces, componentes, navegación o documentación que defina su apariencia/interacción, leer también [Reglas UX/UI](.agents/rules/ux-ui.md) y [Sistema visual canónico](.agents/brand/sistema-visual.md).
- En ese trabajo visual, usar la skill `ui-ux-pro-max`: localizar y leer su `SKILL.md` mediante el catálogo del entorno. El nombre de la skill es la dependencia; no asumir una ruta personal para otros desarrolladores. Para trabajo exclusivamente de backend/infraestructura no se requiere una búsqueda visual.
- El [MASTER](design-system/fuego-y-brasas/MASTER.md) remite al sistema canónico. Colores, fuentes, medidas y patrones se definen una sola vez en `.agents/brand/sistema-visual.md`, sin otra paleta en documentos o componentes.
- Las recomendaciones de búsquedas se comprueban contra el producto y las guías del Next.js instalado antes de aplicarse. Las instrucciones actuales del propietario prevalecen sobre imágenes, sitios y antecedentes.

## Documentación y comprobación

Consultar [Diseño técnico](docs/diseno-tecnico/README.md) y [Hitos](docs/implementacion/hitos-del-proyecto.md). Mantener separados acuerdos funcionales, reglas del agente y evidencia de investigación. No declarar una prueba o hito completado por escribir su documentación.

Esta sección se mantiene fuera del bloque generado por Next.js; conservar ese bloque intacto.
