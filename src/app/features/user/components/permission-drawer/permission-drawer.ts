
// ============================================
// 3. permission-drawer.component.ts (REESCRITO)
// ============================================
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { NZ_DRAWER_DATA, NzDrawerModule, NzDrawerRef } from 'ng-zorro-antd/drawer';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzTagModule } from 'ng-zorro-antd/tag';

import { PermissionGroup } from '../../../../shared/models/permission-group';

export interface PermissionDrawerData {
  groups: PermissionGroup[];
  userName?: string | null;
}

@Component({
  selector: 'app-permission-drawer',
  standalone: true,
  imports: [
    FormsModule,
    NzDrawerModule,
    NzFormModule,
    NzButtonModule,
    NzCardModule,
    NzCheckboxModule,
    NzDividerModule,
    NzTagModule,
  ],
  templateUrl: './permission-drawer.html',
})
export class PermissionDrawer {
  readonly data = inject<PermissionDrawerData>(NZ_DRAWER_DATA);
  readonly drawerRef: NzDrawerRef<this, string[]> = inject(NzDrawerRef);

  groups: PermissionGroup[] = structuredClone(this.data?.groups ?? []);
  userName = this.data?.userName ?? null;

  // Set de overrides actuales (source === 'Override'), es lo único togglable
  overrides = signal<Set<string>>(
    new Set(
      this.groups
        .flatMap(g => g.permissions)
        .filter(p => p.source === 'Override')
        .map(p => p.key)
    )
  );

  isInherited(key: string): boolean {
    return this.findPermission(key)?.source === 'Role';
  }

  isChecked(key: string): boolean {
    return this.isInherited(key) || this.overrides().has(key);
  }

  toggle(key: string): void {
    if (this.isInherited(key)) return; // bloqueado, viene del rol

    const current = new Set(this.overrides());
    if (current.has(key)) current.delete(key);
    else current.add(key);
    this.overrides.set(current);
  }

  private findPermission(key: string) {
    return this.groups
      .flatMap(g => g.permissions)
      .find(p => p.key === key);
  }

  // ---------- Selección por grupo ----------

  private togglableKeysInGroup(group: PermissionGroup): string[] {
    return group.permissions
      .filter(p => p.source !== 'Role')
      .map(p => p.key);
  }

  isGroupAllChecked(group: PermissionGroup): boolean {
    const togglable = this.togglableKeysInGroup(group);
    if (togglable.length === 0) return true;
    return togglable.every(key => this.overrides().has(key));
  }

  isGroupIndeterminate(group: PermissionGroup): boolean {
    const togglable = this.togglableKeysInGroup(group);
    const checkedCount = togglable.filter(key => this.overrides().has(key)).length;
    return checkedCount > 0 && checkedCount < togglable.length;
  }

  onGroupAllChange(group: PermissionGroup, checked: boolean): void {
    const current = new Set(this.overrides());
    this.togglableKeysInGroup(group).forEach(key => {
      if (checked) current.add(key);
      else current.delete(key);
    });
    this.overrides.set(current);
  }

  // ---------- Acciones ----------

  save(): void {
    this.drawerRef.close(Array.from(this.overrides()));
  }

  close(): void {
    this.drawerRef.close();
  }
}
