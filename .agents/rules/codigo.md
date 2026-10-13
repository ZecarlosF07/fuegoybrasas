# Reglas de código

**Versión:** 1.0 · **Fecha:** 4 de octubre de 2026.  
**Origen:** instrucciones explícitas del propietario. Aplicar al escribir, revisar o refactorizar código.

## Organización y responsabilidades

- Aplicar DRY: reutilizar componentes y lógica existentes; refactorizar duplicación real en cuanto se detecte, sin abstracciones hipotéticas.
- Organizar por feature o dominio. Dentro de cada módulo, mantener interfaces y aliases de tipos en una carpeta `types/`, en archivos separados de las implementaciones. Los tipos generados de PostgreSQL permanecen en `src/types/database.types.ts`; no editarlos manualmente.
- Mantener cada archivo de componente en **170 líneas como máximo**. Componer componentes pequeños; priorizar composición sobre herencia.
- Extraer lógica de negocio a funciones puras en `utils` o `services`. Separar presentación, validación, casos de uso y acceso a infraestructura. Cada función hace una sola cosa.
- Usar funciones pequeñas y específicas; máximo dos niveles de anidación y early returns. Evitar dependencias circulares y efectos secundarios innecesarios.

## Legibilidad y seguridad

- Nombres descriptivos y semánticos para variables, funciones y componentes; convenciones consistentes en todo el proyecto.
- Constantes para valores mágicos y configuración. Preferir código autodocumentado; comentar brevemente solo funciones complejas y motivos que el código no explique.
- Priorizar inmutabilidad; evitar mutaciones directas salvo las exigidas explícitamente por una API de infraestructura.
- Validar entradas críticas en ejecución. Manejar errores explícitamente; nunca silenciar excepciones ni convertir un fallo en éxito aparente.
- TypeScript estricto; evitar `any` y conversiones `as` siempre que sea posible. Una excepción necesaria debe ser acotada y justificada; no debilitar tipos globalmente.
- Agrupar imports: externos primero e internos después, ordenados alfabéticamente dentro de cada grupo. Los imports de efectos del framework conservan su posición necesaria.

## Herramientas y estilos

- Usar **Yarn** para instalar, ejecutar comprobaciones y compilar. Versionar `yarn.lock` y la versión del gestor; evitar lockfiles de otros gestores.
- Migraciones SQL exclusivamente en `supabase/migrations/`, ejecutadas mediante Supabase CLI. No aplicar cambios manuales como sustituto del historial.
- Usar `src/proxy.ts` cuando se necesite el punto de entrada de Next.js; **no crear middleware**. Proxy no sustituye autorización en el servidor.
- Todo estilo de interfaz usa **Tailwind**; no escribir selectores CSS, CSS Modules, estilos inline, `@apply` ni hojas de estilos personalizadas. El archivo de entrada de Tailwind solo conserva sus directivas de importación/configuración requeridas por el compilador. Definir el tema mediante configuración del framework, siguiendo el [sistema visual canónico](../brand/sistema-visual.md).
- UI minimalista: limitar acentos a los definidos en el sistema visual. Leer también [UX/UI](ux-ui.md), particularmente las reglas de acciones asíncronas.

Las reglas se comprueban sobre código propio. Los archivos generados y dependencias conservan el formato del generador; no refactorizarlos como código de aplicación.
