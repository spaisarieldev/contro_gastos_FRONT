import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'uber' },
  {
    path: 'uber',
    loadComponent: () =>
      import('./pages/uber/uber.component').then((m) => m.UberComponent),
  },
  {
    path: 'gastos',
    loadComponent: () =>
      import('./pages/gastos/gastos.component').then((m) => m.GastosComponent),
  },
  {
    path: 'resumen',
    loadComponent: () =>
      import('./pages/dashboard/dashboard.component').then(
        (m) => m.DashboardComponent,
      ),
  },
  { path: '**', redirectTo: 'uber' },
];
