# CLAUDE.md

Contexto para trabajar en este repo. Es un workspace de Angular con dos proyectos:

- **`filter`** (`src/app`) — la landing page/showcase de la librería. No es un producto real, no tiene backend.
- **`@some-angular-utils/filter`** (`projects/some-angular-utils/filter`) — la librería Angular publicable de verdad (el componente `<sau-filter>`).

Este repo es hermano de `c:\Users\ADMINISTRATOR\Desktop\table` (la librería `@some-angular-utils/table`) — ambas landing pages siguen exactamente el mismo patrón (mismo navbar/hero/features/demos/installation/footer, mismo mini editor de código). Si cambias algo estructural aquí, probablemente también aplique allí, y viceversa.

## Árbol del código

```
selector/
├── CLAUDE.md
├── README.md
├── angular.json
├── package.json
├── .postcssrc.json                      # Tailwind v4 vía @tailwindcss/postcss
├── tsconfig.json                        # mapea "@some-angular-utils/filter" -> dist/some-angular-utils/filter
│
├── src/                                  # app showcase (proyecto "filter")
│   ├── index.html
│   ├── main.ts
│   ├── styles.scss                       # Tailwind v4 (@import "tailwindcss" + @theme, sin tailwind.config.js)
│   └── app/
│       ├── app.ts / app.html / app.scss / app.config.ts / app.routes.ts
│       └── components/
│           ├── navbar/         navbar.ts                  — barra superior fija
│           ├── hero/            hero.ts, hero.html          — portada con un sau-filter de ejemplo
│           ├── features/        features.ts, features.html  — grid de características
│           ├── demos/           demos.ts, demos.html         — "See it in action": las 6 demos editables en vivo
│           ├── code-editor/     code-editor.ts/html/scss     — mini editor de código reutilizable (usado por demos)
│           ├── installation/    installation.ts, installation.html — instrucciones de instalación/uso
│           └── footer/          footer.ts                    — pie de página
│
└── projects/some-angular-utils/filter/   # la librería publicable
    └── src/
        ├── public-api.ts                  # exports públicos del paquete npm
        └── lib/
            └── filter.ts / filter.html / filter.scss   # componente principal <sau-filter>
```

`<sau-filter>` ya no contiene sus subcomponentes (`custom-input`/`custom-select`/`date-range-input`) en este repo — ahora son tres paquetes hermanos independientes, cada uno con su propio workspace Angular, que `filter` consume como dependencias normales:

- `sau-date-range-picker` → paquete `@some-angular-utils/date-range-picker`, repo `C:\Users\ADMINISTRATOR\Desktop\date-input`, **ya publicado en npm** (se instala normal, sin trucos).
- `sau-select` → paquete `@some-angular-utils/select`, repo `C:\Users\ADMINISTRATOR\Desktop\sau-select`.
- `sau-input` → paquete `@some-angular-utils/input`, repo `C:\Users\ADMINISTRATOR\Desktop\sau-input`.

Mientras `select` e `input` no estén publicados en npm, `projects/some-angular-utils/filter/package.json` los referencia vía `file:` apuntando a un **`.tgz`** generado con `npm pack` dentro del `dist/` de cada repo hermano (no a la carpeta del `dist/` directamente). Un `file:` a una carpeta crea un symlink/junction que arrastra el `node_modules` propio de ese repo hermano consigo; como ese `node_modules` trae su propia copia de `@angular/forms`, TypeScript la trata como un tipo distinto de la copia de `selector`, y `strictTemplates` rompe con errores como "Types have separate declarations of a private property '_parent'". Un `.tgz` en cambio se extrae como copia real sin `node_modules` propio, igual que haría un `npm install` desde el registro real. Flujo para recoger un cambio en `sau-select`/`sau-input`:

```bash
# en el repo hermano (p.ej. sau-select)
npm run build:lib && cd dist/some-angular-utils/select && npm pack

# de vuelta en selector
npm install   # vuelve a extraer el .tgz actualizado
npm run build:lib
```

El nombre del `.tgz` incluye la versión (`some-angular-utils-select-0.0.1.tgz`); si subes la versión en el `package.json` del repo hermano, actualiza también la ruta `file:` en `filter/package.json`. ng-packagr además exige declarar estos paquetes en `allowedNonPeerDependencies` dentro de `ng-package.json` de `filter` (igual que ya estaba hecho para `date-range-picker`) o falla el build con "must be explicitly allowed".

## El orden de build importa

La app importa la librería como `@some-angular-utils/filter`, que `tsconfig.json` mapea a `./dist/some-angular-utils/filter` — **no** al código fuente. Si editas algo dentro de `projects/some-angular-utils/filter/src`, hay que reconstruir antes de que la app lo vea:

```bash
npm run build:lib   # ng-packagr -> dist/some-angular-utils/filter
```

`ng serve` (usa Vite) pre-empaqueta dependencias y **no** recoge de forma confiable un `dist/` recién construido. Después de `build:lib`, mata y reinicia `ng serve` (o borra `.angular/cache` antes) — no asumas que el hot-reload lo detectó.

## Storybook fue eliminado

Storybook (`.storybook/` en la raíz y en la librería, `src/stories/`, los targets `storybook`/`build-storybook` en `angular.json`, las dependencias `@storybook/*`, el workflow `publishStorybook.yml` y `debug-storybook.log`) se eliminó a propósito en favor de la app showcase de `src/app`. No lo reintroduzcas a menos que se pida explícitamente.

## Gotcha de especificidad CSS al teñir en vivo (distinto del proyecto `table`)

La demo de "Theming" inyecta un `<style>` global de forma imperativa vía `Renderer2` + `DOCUMENT` (igual que en el proyecto `table`), porque Angular extrae las etiquetas `<style>` literales de las plantillas en tiempo de compilación y nunca llegan al DOM en tiempo de ejecución.

Pero a diferencia de `sau-table` (que usa `ViewEncapsulation.None`), **`sau-filter` usa encapsulación Emulated por defecto**. Eso significa que la propia regla `.sau-filter { ... }` de la librería se compila como `.sau-filter[_ngcontent-xxx] { ... }` — una clase + un atributo, exactamente la misma especificidad que nuestro override `.theme-live .sau-filter` (dos clases). Con especificidad empatada, gana el orden de inserción en el `<head>`, que no es fiable (depende de cuándo Angular registra el stylesheet del componente vs. cuándo se ejecuta nuestro constructor). La solución es añadir `!important` a cada declaración generada (función `withImportant()` en `demos.ts`) — confirmado con pruebas, no es una suposición. Si se porta este patrón a otra librería, comprobar primero qué `ViewEncapsulation` usa el componente raíz antes de asumir que la especificidad por selectores basta.

## Cómo funciona el editor de las demos en vivo (`src/app/components/demos`)

Mismo patrón que en el proyecto `table`: cada pestaña tiene su propio mini editor de código (`src/app/components/code-editor`) enlazado a un string de configuración `{ searchButtonText, filterConfig: {...} }`. Al editar (debounce ~600ms), el texto se evalúa con `new Function('"use strict"; return (' + texto + ');')()` — evaluado en el propio navegador del visitante, sin ida y vuelta al servidor (mismo modelo de confianza que cualquier playground de JS).

`filter.ts` solo construye el formulario en `ngOnInit()` (no tiene `ngOnChanges`), así que enlazar la config parseada directamente no provocaría un nuevo render al editar. Se usa el mismo truco `@for (cfg of [demo.parsed()]; track cfg)`: trackear por la referencia del objeto fuerza a Angular a destruir y recrear `<sau-filter>` cada vez que el evaluador produce un objeto nuevo.

El resultado de cada búsqueda (`onFilterProcessed` → `{ json, url }`) se muestra debajo de la tabla en todas las pestañas (excepto Theming) — es la forma más directa de demostrar que el componente realmente genera la query string.

## El README tenía errores que se corrigieron

El README original tenía un ejemplo de HTML copiado por error de otra librería de la familia (`@some-angular-utils/paginator`): mostraba `[totalPages]`/`(pageChange)`, que no son props de `sau-filter`. También tenía un typo en el import (`SAUfilterModule` en vez de `SAUFilterModule`). Se corrigió para reflejar la API real de `filter.ts` (`filterConfig`, `searchButtonText`, `(onFilterProcessed)`). Si se vuelve a tocar el README, verificar contra `filter.ts` directamente, no copiar de otro paquete hermano.

## El texto en español dentro de la librería es intencional, no un bug

El popover de orden ("Criterios de Ordenación", "Sin ordenar") y los labels por defecto del paquete hermano `@some-angular-utils/input` (`Activo`/`Inactivo`/`Sin especificar`, en `sau-input/projects/some-angular-utils/input/src/lib/input.component.ts`) están hardcodeados en español. No es algo que se pueda cambiar desde `filterConfig` ni desde la app showcase — es el comportamiento real del componente. No "corregir" esto en las demos para que parezca todo en inglés; mostrarlo tal cual es lo correcto.

## Convenciones de este repo (`.github/copilot-instructions.md`)

Este repo tiene un archivo de instrucciones para agentes de IA que sí se respetó al escribir los componentes nuevos de `src/app`: `ChangeDetectionStrategy.OnPush` en todos los componentes, `input()`/`output()`/`model()` en vez de decoradores `@Input`/`@Output` donde tiene sentido, `@if`/`@for`/`@switch` nativos en vez de `*ngIf`/`*ngFor`, sin `ngClass`/`ngStyle` (usar `[class.x]`/`[style.x]`), sin arrow functions dentro de plantillas. La librería (`projects/some-angular-utils/filter`) en cambio es código preexistente y NO sigue estas convenciones (usa `@Input`/`@Output`, `@HostListener`) — no es necesario migrarla solo por consistencia.

## Tailwind v4

No hay `tailwind.config.js` — v4 se configura con `@import "tailwindcss";` + un bloque `@theme { ... }` directamente en `src/styles.scss`, procesado por `@tailwindcss/postcss` (ver `.postcssrc.json`). La escala de color de marca (`brand-50`...`brand-900`) vive ahí. El IDE puede marcar "Unknown at rule @theme" como advertencia — es solo que el linter no conoce la sintaxis de Tailwind v4, no es un error de build.

## Gotcha de rutas en Windows + git-bash (solo importa al scriptear/probar con la herramienta Bash)

El `/tmp` de git-bash está mapeado a `AppData/Local/Temp`, pero un proceso `node.exe` nativo resuelve un string literal `'/tmp/...'` pasado como argumento JS relativo a la raíz de la unidad actual (`C:\tmp\...`) en su lugar — **no** son el mismo directorio. Si un script de Node escribe archivos en `/tmp/...` y la herramienta Bash no los encuentra después, revisar primero `C:\tmp\...` antes de asumir que la escritura falló.

También: la cwd de la herramienta Bash en esta sesión tiende a resetearse a otro directorio del workspace entre llamadas — antepón siempre `cd "C:/Users/ADMINISTRATOR/Desktop/selector" &&` a cada comando, no asumas que el `cd` anterior persiste.
