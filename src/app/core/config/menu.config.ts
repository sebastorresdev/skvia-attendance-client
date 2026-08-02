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
    title: 'Seguridad',
    icon: 'safety',
    children: [
      { label: 'Roles', link: '/roles', permission: PERMISSIONS.Roles.View },
      { label: 'Usuarios', link: '/users', permission: PERMISSIONS.Users.View },
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
