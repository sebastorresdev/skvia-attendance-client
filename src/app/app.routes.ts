import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { permissionGuard } from './core/guards/permission.guard';
import { PERMISSIONS } from './core/constants/permissions';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: '/login' },

  {
    path: 'login',
    loadComponent: () => import('./features/login/login').then(m => m.Login),
  },

  {
    path: '',
    loadComponent: () => import('./layout/layout').then(m => m.Layout),
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },

      {
        path: 'welcome',
        canActivate: [permissionGuard(PERMISSIONS.Welcome.View)],
        loadChildren: () =>
          import('./features/welcome/welcome.routes').then(m => m.WELCOME_ROUTES),
      },

      {
        path: 'users',
        canActivate: [permissionGuard(PERMISSIONS.Users.View)],
        children: [
          { path: '', loadComponent: () => import('./features/user/pages/user-list/user-list').then(m => m.UserList) },
          { path: 'new', loadComponent: () => import('./features/user/pages/user-form/user-form').then(m => m.UserForm) },
          { path: ':userId', loadComponent: () => import('./features/user/pages/user-form/user-form').then(m => m.UserForm) },
        ]
      },

      {
        path: '404',
        loadComponent: () =>
          import('./features/errors/not-found/not-found')
            .then(m => m.NotFound),
      },

      {
        path: '403',
        loadComponent: () =>
          import('./features/errors/not-authorized/not-authorized')
            .then(m => m.NotAuthorized),
      },

      // 🔥 ESTA ES LA CLAVE
      { path: '**', redirectTo: '404' },
    ],
  },
];

