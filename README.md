# @some-angular-utils/filter

[![github stars](https://img.shields.io/github/stars/some-angular-utils/filter.svg?style=social&label=Star)](https://github.com/some-angular-utils/filter)

[![NPM Version](https://img.shields.io/npm/v/@some-angular-utils/filter)](https://www.npmjs.com/package/@some-angular-utils/filter)
[![NPM Downloads](https://img.shields.io/npm/dm/@some-angular-utils/filter)](https://www.npmjs.com/package/@some-angular-utils/filter)

[![npm bundle size](https://img.shields.io/bundlephobia/min/@some-angular-utils/filter)](https://www.npmjs.com/package/@some-angular-utils/filter)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/@some-angular-utils/filter)](https://www.npmjs.com/package/@some-angular-utils/filter)

---

[DEMO](https://some-angular-utils.github.io/filter)

[NPM](https://www.npmjs.com/package/@some-angular-utils/filter)

---

## IMPORT
```ts
import { SAUfilterModule } from '@some-angular-utils/filter';
```

## HTML
```ts
<sau-filter
    [totalPages]="totalPages"
    [currentPage]="currentPage"
    (pageChange)="onPageChange($event)"
></sau-filter>
```

## COLORS

```css
.sau-filter{
    --sau-color-primary: rgb(147, 51, 234);
    --sau-color-secondary: var(--sau-color-primary);
    --sau-color-background: rgb(255, 255, 255);
    --sau-color-edit: rgb(34, 197, 94);
    --sau-color-delete: rgb(239, 68, 68);
    --sau-color-text: rgb(31, 41, 55);
}
```