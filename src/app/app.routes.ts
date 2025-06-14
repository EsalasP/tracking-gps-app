import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./tabs/tabs.routes').then((m) => m.routes),
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./pages/dashboard/dashboard.page').then( m => m.DashboardPage)
  },
  {
    path: 'tracking',
    loadComponent: () => import('./pages/tracking/tracking.page').then( m => m.TrackingPage)
  },
  {
    path: 'alerts',
    loadComponent: () => import('./pages/alerts/alerts.page').then( m => m.AlertsPage)
  },
  {
    path: 'settings',
    loadComponent: () => import('./pages/settings/settings.page').then( m => m.SettingsPage)
  }
];