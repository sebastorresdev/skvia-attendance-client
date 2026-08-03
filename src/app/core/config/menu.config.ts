import { PERMISSIONS } from '../constants/permissions';
import { MenuGroup } from '../models/menu.types';

export const MENU: MenuGroup[] = [
  {
    title: 'Dashboard',
    icon: 'dashboard',
    children: [
      { label: 'Welcome', link: '/welcome', permission: PERMISSIONS.Welcome.View },
    ]
  },
  {
    title: 'Kiosco',
    icon: 'desktop',
    children: [
      { label: 'Marcador', link: '/kiosk', target: '_blank' }
    ]
  },
  {
    title: 'Seguridad',
    icon: 'safety',
    children: [
      { label: 'Roles', link: '/roles', permission: PERMISSIONS.Roles.View },
      { label: 'Usuarios', link: '/users', permission: PERMISSIONS.Users.View },
    ]
  },
  {
    title: 'Organización',
    icon: 'bank',
    children: [
      { label: 'Sedes', link: '/branches', permission: PERMISSIONS.Branches.View },
    ]
  },
  {
    title: 'Recursos Humanos',
    icon: 'team',
    children: [
      { label: 'Empleados', link: '/employees', permission: PERMISSIONS.Employees.View },
      { label: 'Turnos', link: '/schedules', permission: PERMISSIONS.Employees.View },
    ]
  },
  {
    title: 'Form',
    icon: 'form',
    children: [
      { label: 'Basic Form', link: '/form/basic' } // 🔥 sin permiso
    ]
  }
] as const;
