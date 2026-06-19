# @some-angular-utils/filter

[![github stars](https://img.shields.io/github/stars/some-angular-utils/filter.svg?style=social&label=Star)](https://github.com/some-angular-utils/filter)

[![NPM Version](https://img.shields.io/npm/v/@some-angular-utils/filter)](https://www.npmjs.com/package/@some-angular-utils/filter)
[![NPM Downloads](https://img.shields.io/npm/dm/@some-angular-utils/filter)](https://www.npmjs.com/package/@some-angular-utils/filter)

[![npm bundle size](https://img.shields.io/bundlephobia/min/@some-angular-utils/filter)](https://www.npmjs.com/package/@some-angular-utils/filter)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/@some-angular-utils/filter)](https://www.npmjs.com/package/@some-angular-utils/filter)

---

[NPM](https://www.npmjs.com/package/@some-angular-utils/filter)

---

## DEMO

This repo ships with an interactive showcase app — every field type has a live, editable example (edit the code, the filter bar updates in real time). Run it locally:

```bash
npm install
npm run dev
```

Then open http://localhost:4200.

## IMPORT
```ts
import { SAUFilterModule } from '@some-angular-utils/filter';
```

## TYPESCRIPT
```ts
public filterConfig = {
    order: ['search', 'status'],
    mobile: ['search'],
    form: {
        search: {
            name: 'Buscar',
            key: 'q',
            type: 'inputText',
            defaultValue: ''
        },
        status: {
            name: 'Estado',
            key: 'status_id',
            type: 'selectSimple',
            dropdowns: [
                { id: 1, name: 'Activo' },
                { id: 2, name: 'Inactivo' }
            ],
            defaultValue: ''
        }
    }
};

onFilterProcessed(event: { json: any, url: string }) {
    // event.url is a ready-to-use query string: "?q=foo&status_id=1"
}
```

## HTML
```ts
<sau-filter
    [filterConfig]="filterConfig"
    searchButtonText="Buscar"
    (onFilterProcessed)="onFilterProcessed($event)"
></sau-filter>
```

## FIELD TYPES

`inputText` · `inputNumber` · `inputCheckbox` (tri-state: true / false / unset) · `date` · `dateRange` (needs `keyTo`) · `selectSimple` · `selectMultiple` (both accept `dropdowns: [{ id, name }]`, optionally `bindSubLabel`)

## SORT ORDER

Add `orderParamName` and `orderByFields: [{ field, label }]` to `filterConfig` to get a built-in ascending/descending sort dropdown next to the search button.

## COLORS

```css
.sau-filter{
    --sau-color-primary: rgb(147, 51, 234);
    --sau-color-background: rgb(255, 255, 255);
}
```
