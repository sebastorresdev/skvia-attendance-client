export interface PermissionItem {
  key: string;
  display: string;
  description: string;
  granted: boolean;
  source: 'Role' | 'Override' | null;
}

export interface PermissionGroup {
  group: string;
  groupDescription: string;
  permissions: PermissionItem[];
}
