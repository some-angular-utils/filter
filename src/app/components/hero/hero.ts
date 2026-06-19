import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { SAUFilterModule } from '@some-angular-utils/filter';

@Component({
  selector: 'app-hero',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SAUFilterModule],
  templateUrl: './hero.html',
})
export class HeroComponent {
  copied = signal(false);
  resultUrl = signal<string | null>(null);

  filterConfig = {
    order: ['search', 'status'],
    mobile: ['search'],
    form: {
      search: { name: 'Search', key: 'q', type: 'inputText', defaultValue: '' },
      status: {
        name: 'Status',
        key: 'status_id',
        type: 'selectSimple',
        dropdowns: [
          { id: 1, name: 'Active' },
          { id: 2, name: 'Inactive' },
        ],
        defaultValue: '',
      },
    },
  };

  onFilterProcessed(event: { json: unknown; url: string }) {
    this.resultUrl.set(event.url || '?');
  }

  copyInstall() {
    navigator.clipboard?.writeText('npm install @some-angular-utils/filter');
    this.copied.set(true);
    setTimeout(() => this.copied.set(false), 1500);
  }
}
