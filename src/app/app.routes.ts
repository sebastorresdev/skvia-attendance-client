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
    path: 'kiosk',
    // Kiosk is now a public screen (but locked by default without token)
    loadComponent: () => import('./features/kiosk/pages/kiosk-page').then(m => m.KioskPage),
  },

  {
    path: '',
    loadComponent: () => import('./layout/layout').then(m => m.Layout),
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/pages/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },

      {
        path: 'welcome',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },

      {
        path: 'roles',
        canActivate: [permissionGuard(PERMISSIONS.Roles.View)],
        loadComponent: () => import('./features/role/pages/role-list/role-list').then(m => m.RoleList)
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
        path: 'branches',
        canActivate: [permissionGuard(PERMISSIONS.Branches.View)],
        loadComponent: () => import('./features/branch/pages/branch-list/branch-list').then(m => m.BranchList)
      },

      {
        path: 'workplaces',
        canActivate: [permissionGuard(PERMISSIONS.Branches.View)],
        loadComponent: () => import('./features/workplace/pages/workplace-list/workplace-list').then(m => m.WorkplaceList)
      },

      {
        path: 'employees',
        canActivate: [permissionGuard(PERMISSIONS.Employees.View)],
        children: [
          { path: '', loadComponent: () => import('./features/employee/pages/employee-list/employee-list').then(m => m.EmployeeList) },
          { path: 'new', loadComponent: () => import('./features/employee/pages/employee-form/employee-form').then(m => m.EmployeeForm) },
          { path: ':id/schedule', loadComponent: () => import('./features/employee/pages/employee-schedule-form/employee-schedule-form').then(m => m.EmployeeScheduleForm) },
          { path: ':id', loadComponent: () => import('./features/employee/pages/employee-form/employee-form').then(m => m.EmployeeForm) },
        ]
      },

      {
        path: 'kiosk-devices',
        canActivate: [permissionGuard(PERMISSIONS.Branches.View)], // Reusing Branches view for now
        children: [
          { path: '', loadComponent: () => import('./features/kiosk-devices/pages/device-list/device-list').then(m => m.DeviceList) },
          { path: 'link', loadComponent: () => import('./features/kiosk-devices/pages/device-link/device-link').then(m => m.DeviceLink) },
        ]
      },
      
      {
        path: 'schedules',
        canActivate: [permissionGuard(PERMISSIONS.Employees.View)], // Reusing Employees.View for now, or maybe create a new permission if there is one. We can just use Employees.View
        loadComponent: () => import('./features/schedule/pages/schedule-list/schedule-list').then(m => m.ScheduleList)
      },

      {
        path: 'attendance-report',
        canActivate: [permissionGuard(PERMISSIONS.Employees.View)], // Reusing Employees.View for now
        loadComponent: () => import('./features/attendance-report/pages/attendance-report/attendance-report.component').then(m => m.AttendanceReportComponent)
      },

      {
        path: 'justifications',
        canActivate: [permissionGuard(PERMISSIONS.Employees.View)],
        loadComponent: () => import('./features/justifications/pages/justification-list/justification-list.component').then(m => m.JustificationListComponent)
      },

      {
        path: 'monthly-summary',
        canActivate: [permissionGuard(PERMISSIONS.Employees.View)],
        loadComponent: () => import('./features/attendance-report/pages/monthly-summary/monthly-summary.component').then(m => m.MonthlySummaryComponent)
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

