import { Routes } from '@angular/router';
export const routes: Routes = [
  {
    path: '',
    title: 'Cerrado-Forca | Monitoramento de Incendios',
    loadComponent: () => import('./features/home/home-page').then((module) => module.HomePage),
  },
  {
    path: 'sobre',
    title: 'Sobre a Plataforma | Cerrado-Forca',
    loadComponent: () => import('./features/about/about-page').then((module) => module.AboutPage),
  },
  {
    path: 'prevencao',
    title: 'Prevencao e Orientacoes | Cerrado-Forca',
    loadComponent: () =>
      import('./features/prevention/prevention-page').then((module) => module.PreventionPage),
  },
  {
    path: 'fauna',
    title: 'Fauna e Resgate | Cerrado-Forca',
    loadComponent: () => import('./features/fauna/fauna-page').then((module) => module.FaunaPage),
  },
  {
    path: 'participar',
    title: 'Participacao e Apoio | Cerrado-Forca',
    loadComponent: () => import('./features/join/join-page').then((module) => module.JoinPage),
  },
  {
    path: 'notificar',
    title: 'Notificar Incendio | Cerrado-Forca',
    loadComponent: () =>
      import('./features/emergency/emergency-page').then((module) => module.EmergencyPage),
  },
  {
    path: 'emergencia',
    redirectTo: 'notificar',
  },
  {
    path: 'login',
    title: 'Entrar | Cerrado-Forca',
    loadComponent: () => import('./features/auth/login-page').then((module) => module.LoginPage),
  },
  {
    path: 'cadastro',
    title: 'Cadastro | Cerrado-Forca',
    loadComponent: () =>
      import('./features/auth/register-page').then((module) => module.RegisterPage),
  },
  {
    path: 'painel',
    title: 'Painel de Monitoramento | Cerrado-Forca',
    loadComponent: () =>
      import('./features/dashboard/dashboard-page').then((module) => module.DashboardPage),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
