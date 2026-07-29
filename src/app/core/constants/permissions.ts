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
  }
} as const;
