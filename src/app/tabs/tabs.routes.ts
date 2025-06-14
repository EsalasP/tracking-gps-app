import { Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

export const routes: Routes = [
  {
    path: 'tabs',
    component: TabsPage,
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('../pages/dashboard/dashboard.page').then((m) => m.DashboardPage),
      },
      {
        path: 'tracking',
        loadComponent: () =>
          import('../pages/tracking/tracking.page').then((m) => m.TrackingPage),
      },
      {
        path: 'alerts',
        loadComponent: () =>
          import('../pages/alerts/alerts.page').then((m) => m.AlertsPage),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('../pages/settings/settings.page').then((m) => m.SettingsPage),
      },
      {
        path: '',
        redirectTo: '/tabs/dashboard',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '',
    redirectTo: '/tabs/dashboard',
    pathMatch: 'full',
  },
];