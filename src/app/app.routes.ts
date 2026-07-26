import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';


export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: '/login' },
  {
    path: 'login',
    loadComponent: () => import('./features/login/login').then((m) => m.Login),
  },
  {
    path: '',
    loadComponent: () => import('./layout/layout').then((m) => m.Layout),
    canActivate: [authGuard],
    children: [
      // 💡 Redirección por defecto al Home (Dashboard) cuando entras al Layout
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      {
        path: 'welcome',
        loadChildren: () => import('./features/welcome/welcome.routes').then((m) => m.WELCOME_ROUTES),
      },
      {
        path: 'users',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./features/user/pages/user-list/user-list')
                .then(m => m.UserList),
          },
          {
            path: 'new',
            loadComponent: () =>
              import('./features/user/pages/user-form/user-form')
                .then(m => m.UserForm),
          },
          {
            path: ':userId',
            loadComponent: () =>
              import('./features/user/pages/user-form/user-form')
                .then(m => m.UserForm),
          }
        ]
      },
      // Si la ruta no existe PERO el usuario ya cruzó el authGuard, lo mandamos al 404 interno
      { path: '**', redirectTo: '404' },
    ],
  },
  { path: '**', redirectTo: '/login' },
];
