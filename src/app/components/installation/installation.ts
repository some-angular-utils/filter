import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-installation',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './installation.html',
})
export class InstallationComponent {
  installSnippet = `npm install @some-angular-utils/filter`;

  importSnippet = `import { SAUFilterModule } from '@some-angular-utils/filter';

@Component({
  imports: [SAUFilterModule],
  // ...
})`;

  usageSnippet = `public filterConfig = {
  order: ['search', 'status'],
  mobile: ['search'],
  form: {
    search: { name: 'Search', key: 'q', type: 'inputText', defaultValue: '' },
    status: {
      name: 'Status', key: 'status_id', type: 'selectSimple',
      dropdowns: [{ id: 1, name: 'Active' }, { id: 2, name: 'Inactive' }],
      defaultValue: '',
    },
  },
};

onFilterProcessed(event: { json: any, url: string }) {
  // event.url -> "?q=foo&status_id=1"
}`;

  templateSnippet = `<sau-filter
  [filterConfig]="filterConfig"
  searchButtonText="Search"
  (onFilterProcessed)="onFilterProcessed($event)">
</sau-filter>`;
}
