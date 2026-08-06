import { PERMISSIONS } from '../constants/permissions';
import { MenuGroup } from '../models/menu.types';

export const MENU: MenuGroup[] = [
  {
    title: 'Dashboard',
    icon: 'dashboard',
    children: [
      { label: 'Panel Principal', link: '/dashboard', permission: PERMISSIONS.Welcome.View },
    ]
  },
  {
    title: 'Kiosco',
    icon: 'desktop',
    children: [
      { label: 'Dispositivos', link: '/kiosk-devices', permission: PERMISSIONS.Branches.View } // TODO: Use proper permission
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
      { label: 'Reportes de Asistencia', link: '/attendance-report', permission: PERMISSIONS.Employees.View },
      { label: 'Justificaciones', link: '/justifications', permission: PERMISSIONS.Employees.View },
      { label: 'Pre-Nómina Mensual', link: '/monthly-summary', permission: PERMISSIONS.Employees.View },
    ]
  }
] as const;
