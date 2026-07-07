import { ChangeDetectionStrategy, Component, effect, inject, OnDestroy, Renderer2, signal, WritableSignal } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { SAUFilterModule } from '@some-angular-utils/filter';
import { CodeEditorComponent } from '../code-editor/code-editor';

type DemoId = 'search' | 'selects' | 'numbers' | 'dates' | 'sort' | 'sortDefaults' | 'theme';
type DemoKind = 'js' | 'css';

interface DemoEntry {
  id: DemoId;
  label: string;
  description: string;
  kind: DemoKind;
  initialCode: string;
  code: WritableSignal<string>;
  parsed: WritableSignal<any>;
  error: WritableSignal<string | null>;
}

function evalConfig(text: string): any {
  return new Function(`"use strict"; return (\n${text}\n);`)();
}

// sau-filter uses emulated encapsulation, so its own `.sau-filter[_ngcontent-x]` rule has
// the same specificity as our override and can win on source order alone — !important forces ours to win.
function withImportant(declarations: string): string {
  return declarations.replace(/;\s*$/gm, ' !important;');
}

function createDemo(id: DemoId, label: string, description: string, kind: DemoKind, initialCode: string): DemoEntry {
  const initialParsed = kind === 'css' ? { css: initialCode } : evalConfig(initialCode);
  return {
    id,
    label,
    description,
    kind,
    initialCode,
    code: signal(initialCode),
    parsed: signal<any>(initialParsed),
    error: signal<string | null>(null),
  };
}

const SEARCH_CODE = `{
  searchButtonText: 'Search',
  filterConfig: {
    order: ['search'],
    mobile: ['search'],
    form: {
      search: { name: 'Search', key: 'q', type: 'inputText', defaultValue: '' },
    },
  },
}`;

const SELECTS_CODE = `{
  searchButtonText: 'Filter',
  filterConfig: {
    order: ['name', 'company', 'status'],
    mobile: ['name'],
    form: {
      name: { name: 'Name', key: 'name', type: 'inputText', defaultValue: '' },
      company: {
        name: 'Company',
        key: 'company_id',
        type: 'selectSimple',
        dropdowns: [
          { id: 1, name: 'Acme Corp', nif: 'ES12345678' },
          { id: 2, name: 'Tech Solutions', nif: 'ES87654321' },
          { id: 3, name: 'Global Industries', nif: 'ES11223344' },
        ],
        defaultValue: '',
      },
      status: {
        name: 'Categories',
        key: 'categories',
        type: 'selectMultiple',
        dropdowns: [
          { id: 10, name: 'Technology' },
          { id: 20, name: 'Support' },
          { id: 30, name: 'Administration' },
        ],
        defaultValue: [10],
      },
    },
  },
}`;

const NUMBERS_CODE = `{
  searchButtonText: 'Search products',
  filterConfig: {
    order: ['name', 'minPrice', 'maxPrice', 'inStock'],
    mobile: ['name'],
    form: {
      name: { name: 'Product', key: 'product_name', type: 'inputText', defaultValue: '' },
      minPrice: { name: 'Min. price', key: 'price_min', type: 'inputNumber', defaultValue: '' },
      maxPrice: { name: 'Max. price', key: 'price_max', type: 'inputNumber', defaultValue: '' },
      inStock: { name: 'In stock', key: 'in_stock', type: 'inputCheckbox', defaultValue: undefined },
    },
  },
}`;

const DATES_CODE = `{
  searchButtonText: 'Filter',
  filterConfig: {
    order: ['search', 'date', 'range'],
    mobile: ['search'],
    form: {
      search: { name: 'Search', key: 'q', type: 'inputText', defaultValue: '' },
      date: { name: 'Start date', key: 'start_date', type: 'date', defaultValue: '' },
      range: {
        name: 'Period',
        key: 'date_from',
        keyTo: 'date_to',
        type: 'dateRange',
        defaultValue: [],
      },
    },
  },
}`;

const SORT_CODE = `{
  searchButtonText: 'Search',
  filterConfig: {
    orderParamName: 'sort',
    orderByFields: [
      { field: 'title', label: 'Title' },
      { field: 'created_at', label: 'Created date' },
      { field: 'total', label: 'Total amount' },
    ],
    order: ['search'],
    mobile: ['search'],
    form: {
      search: { name: 'Search', key: 'q', type: 'inputText', defaultValue: '' },
    },
  },
}`;

const SORT_DEFAULTS_CODE = `{
  searchButtonText: 'Search',
  filterConfig: {
    orderParamName: 'sort',
    orderByFields: [
      { field: 'title',      label: 'Title',        defaultValue: true },
      { field: 'created_at', label: 'Created date',  defaultValue: false },
      { field: 'total',      label: 'Total amount' },
    ],
    order: ['status'],
    mobile: ['status'],
    form: {
      status: {
        name: 'Status',
        key: 'status',
        type: 'selectSimple',
        dropdowns: [
          { id: 'active',   name: 'Active' },
          { id: 'draft',    name: 'Draft' },
          { id: 'archived', name: 'Archived' },
        ],
        defaultValue: '',
      },
    },
  },
}`;

const THEME_CODE = `--sau-color-primary: rgb(35, 163, 31);
--sau-color-background: rgb(255, 255, 255);`;

@Component({
  selector: 'app-demos',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SAUFilterModule, CodeEditorComponent],
  templateUrl: './demos.html',
})
export class DemosComponent implements OnDestroy {
  private renderer = inject(Renderer2);
  private document = inject(DOCUMENT);
  private themeStyleEl = this.renderer.createElement('style') as HTMLStyleElement;

  activeTab = signal<DemoId>('search');
  resultJson = signal<string | null>(null);
  resultUrl = signal<string | null>(null);

  demos: DemoEntry[] = [
    createDemo('search', 'Basic search', 'A single text field. Edit the key or label below — onFilterProcessed reflects it instantly.', 'js', SEARCH_CODE),
    createDemo('selects', 'Selects & sub-labels', 'Single-select and multi-select fields, both with searchable dropdowns and an optional sub-label.', 'js', SELECTS_CODE),
    createDemo('numbers', 'Numbers & checkbox', 'Numeric range fields plus a tri-state checkbox (true / false / unset).', 'js', NUMBERS_CODE),
    createDemo('dates', 'Dates & ranges', 'A single date picker and a date-range field with quick presets (today, this month...).', 'js', DATES_CODE),
    createDemo('sort', 'Sort order', 'Add orderByFields to get a built-in ascending/descending sort dropdown next to the button.', 'js', SORT_CODE),
    createDemo('sortDefaults', 'Sort defaults', 'Use defaultValue: true (asc) or false (desc) on each orderByField to pre-populate the sort state on load.', 'js', SORT_DEFAULTS_CODE),
    createDemo('theme', 'Theming', 'Every color is a CSS custom property. Edit the values below and watch it restyle instantly.', 'css', THEME_CODE),
  ];

  constructor() {
    this.renderer.appendChild(this.document.head, this.themeStyleEl);

    for (const demo of this.demos) {
      let timer: ReturnType<typeof setTimeout> | undefined;

      effect(() => {
        const text = demo.code();

        if (demo.kind === 'css') {
          demo.parsed.set({ css: text });
          demo.error.set(null);
          this.renderer.setProperty(this.themeStyleEl, 'textContent', `.theme-live .sau-filter { ${withImportant(text)} }`);
          return;
        }

        clearTimeout(timer);
        timer = setTimeout(() => {
          try {
            demo.parsed.set(evalConfig(text));
            demo.error.set(null);
          } catch (err) {
            demo.error.set(err instanceof Error ? err.message : 'Invalid code');
          }
        }, 600);
      });
    }
  }

  ngOnDestroy(): void {
    this.renderer.removeChild(this.document.head, this.themeStyleEl);
  }

  selectTab(id: DemoId) {
    this.activeTab.set(id);
    this.resultJson.set(null);
    this.resultUrl.set(null);
  }

  onFilterProcessed(event: { json: unknown; url: string }) {
    this.resultJson.set(JSON.stringify(event.json));
    this.resultUrl.set(event.url || '?');
  }

  themeFilterConfig = {
    order: ['search'],
    mobile: ['search'],
    form: {
      search: { name: 'Search', key: 'q', type: 'inputText', defaultValue: '' },
    },
  };
}
