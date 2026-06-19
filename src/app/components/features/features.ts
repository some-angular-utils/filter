import { ChangeDetectionStrategy, Component } from '@angular/core';

interface Feature {
  title: string;
  description: string;
  icon: string;
}

@Component({
  selector: 'app-features',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './features.html',
})
export class FeaturesComponent {
  features: Feature[] = [
    {
      title: 'Declarative config',
      description:
        'Describe each field once — name, key, type, default value — and the reactive form, layout and validation follow automatically.',
      icon: 'M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2 M9 5a2 2 0 002 2h2a2 2 0 002-2 M9 5a2 2 0 012-2h2a2 2 0 012 2',
    },
    {
      title: 'Seven field types',
      description:
        'Text, number, tri-state checkbox, date, date range with presets, single-select and multi-select — all with optional search and sub-labels.',
      icon: 'M4 6h16M4 12h16M4 18h16',
    },
    {
      title: 'Ready-to-use output',
      description:
        'Every search emits both a clean JSON object and a pre-built query string — drop it straight into your HTTP call.',
      icon: 'M13 10V3L4 14h7v7l9-11h-7z',
    },
    {
      title: 'URL-aware on load',
      description:
        'Reads existing query params on init, so a shared or bookmarked URL re-opens with the same filters already applied.',
      icon: 'M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z',
    },
    {
      title: 'Built-in sort dropdown',
      description:
        'Add orderByFields and get an ascending/descending sort popover next to the search button, for free.',
      icon: 'M3 7h18M6 12h12M10 17h4',
    },
    {
      title: 'Responsive by default',
      description:
        'Pick which fields stay visible on mobile via filterConfig.mobile — the rest collapse behind a "show more" toggle.',
      icon: 'M12 3v18M3 12h18',
    },
  ];
}
