export const PERMISSIONS = {
  Roles: {
    View: 'Permissions.Roles.View',
    Create: 'Permissions.Roles.Create',
    Edit: 'Permissions.Roles.Edit',
    Delete: 'Permissions.Roles.Delete',
  },

  Users: {
    View: 'Permissions.Users.View',
    Create: 'Permissions.Users.Create',
    Edit: 'Permissions.Users.Edit',
    Delete: 'Permissions.Users.Delete',
  },

  Welcome: {
    View: 'Permissions.Welcome.View',
  },

  Dashboard: {
    View: 'Permissions.Dashboard.View',
  },

  Branches: {
    View: 'Permissions.Branches.View',
    Create: 'Permissions.Branches.Create',
    Edit: 'Permissions.Branches.Edit',
    Delete: 'Permissions.Branches.Delete',
  },

  Employees: {
    View: 'Permissions.Employees.View',
    Create: 'Permissions.Employees.Create',
    Edit: 'Permissions.Employees.Edit',
    Delete: 'Permissions.Employees.Delete',
  }
} as const;
