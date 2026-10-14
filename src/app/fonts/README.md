# Fuentes incluidas en la aplicación

Fraunces y Manrope conservan las familias, pesos y variables del [sistema visual canónico](../../../.agents/brand/sistema-visual.md). `src/app/layout.tsx` usa `next/font/local`: Next.js genera los recursos estáticos y sus precargas desde estos archivos versionados, sin descargar fuentes durante el build. No cambiar las familias para resolver errores de infraestructura.

Archivos originales WOFF2 servidos por Google Fonts, descargados el 13/10/2026; no se editaron ni reconvirtieron. Solo subset latin, estilo normal; incluye las letras y tildes del español. Otros caracteres pueden utilizar los fallbacks declarados.

| Archivo | Familia/pesos usados | Tamaño | SHA-256 |
| --- | --- | --- | --- |
| `fraunces-latin-variable.woff2` | Fraunces 600–700 | 36.620 bytes | `7f9d191d999336d3b9790afa72e1358e50a13b06d4f289341e92a311967a80f9` |
| `manrope-latin-variable.woff2` | Manrope 400–700 | 24.836 bytes | `a30ddcd349703aff7464c34bef3fffdff405ee50c113440d7c8693c02d210972` |

## Procedencia y licencias

- Fraunces: [consulta oficial de pesos](https://fonts.googleapis.com/css2?family=Fraunces:wght@600..700&display=swap), [WOFF2 original](https://fonts.gstatic.com/s/fraunces/v38/6NUu8FyLNQOQZAnv9bYEvDiIdE9Ea92uemAk_WBq8U_9v0c2Wa0K7iN7hzFUPJH58nib14c7qv8.woff2), [licencia oficial](https://github.com/google/fonts/blob/main/ofl/fraunces/OFL.txt).
- Manrope: [consulta oficial de pesos](https://fonts.googleapis.com/css2?family=Manrope:wght@400..700&display=swap), [WOFF2 original](https://fonts.gstatic.com/s/manrope/v20/xn7gYHE41ni1AdIRggexSg.woff2), [licencia oficial](https://github.com/google/fonts/blob/main/ofl/manrope/OFL.txt).

Las copias completas de SIL Open Font License 1.1 y los avisos de autoría se distribuyen junto a los archivos en [fraunces-OFL.txt](fraunces-OFL.txt) y [manrope-OFL.txt](manrope-OFL.txt). Conservarlas al redistribuir estos recursos.

Usar el loader y las rutas relativas documentados por la versión instalada en `node_modules/next/dist/docs/01-app/01-getting-started/13-fonts.md`; [referencia pública](https://nextjs.org/docs/app/getting-started/fonts). No introducir enlaces de Google Fonts en el HTML ni CSS propio.
