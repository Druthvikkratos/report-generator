import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./layout/shell/shell').then((m) => m.Shell),
    children: [
      {
        path: '',
        loadComponent: () => import('./features/dashboard/dashboard/dashboard').then((m) => m.Dashboard),
      },
      {
        path: 'templates',
        loadComponent: () =>
          import('./features/report-templates/template-list/template-list').then(
            (m) => m.TemplateList,
          ),
      },
      {
        path: 'runs',
        loadComponent: () =>
          import('./features/report-runs/run-list/run-list').then((m) => m.RunList),
      },
    ],
  },
];
