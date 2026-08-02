import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
// NG-ZORRO
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDropdownModule } from 'ng-zorro-antd/dropdown';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzDrawerModule, NzDrawerService } from 'ng-zorro-antd/drawer';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzMessageService } from 'ng-zorro-antd/message';
// PROYECTO
import { RoleResponse } from '../../models/role-response';
import { RoleService } from '../../services/role-service';
import { DeleteRolesRequest } from '../../models/delete-roles-request';
import { RoleFormModal } from '../../components/role-form-modal/role-form-modal';
import { parseApiErrorMessage } from '../../../../shared/utils/api-error.util';
import { PermissionDrawer, PermissionDrawerData } from '../../../user/components/permission-drawer/permission-drawer';

@Component({
  selector: 'app-role-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzTableModule,
    NzIconModule,
    NzButtonModule,
    NzDropdownModule,
    NzMenuModule,
    NzModalModule,
    NzDrawerModule,
    NzInputModule,
    NzSpaceModule,
    RoleFormModal
  ],
  templateUrl: './role-list.html',
})
export class RoleList implements OnInit {
  private _roleService = inject(RoleService);
  private _messageService = inject(NzMessageService);
  private _modalService = inject(NzModalService);
  private _drawerService = inject(NzDrawerService);

  roles = signal<RoleResponse[]>([]);

  // Modal State
  showRoleModal = signal(false);
  selectedRole = signal<RoleResponse | null>(null);

  // Table Selection State
  checked = false;
  indeterminate = false;
  listOfCurrentPageData: readonly RoleResponse[] = [];
  setOfCheckedId = new Set<string>();

  ngOnInit(): void {
    this.loadRoles();
  }

  // ---------- Data Loading ----------

  loadRoles(): void {
    this._roleService.getAll().subscribe({
      next: (data) => this.roles.set(data),
      error: (error) => {
        console.error('Error loading roles', error);
        this._messageService.error('No se pudieron cargar los roles');
      },
    });
  }

  // ---------- Modal Management ----------

  openNewRoleModal(): void {
    this.selectedRole.set(null);
    this.showRoleModal.set(true);
  }

  openEditRoleModal(role: RoleResponse): void {
    this.selectedRole.set(role);
    this.showRoleModal.set(true);
  }

  onRoleSaved(): void {
    this.loadRoles();
  }

  // ---------- Table Selection ----------

  updateCheckedSet(id: string, checked: boolean): void {
    if (checked) {
      this.setOfCheckedId.add(id);
    } else {
      this.setOfCheckedId.delete(id);
    }
  }

  onItemChecked(id: string, checked: boolean): void {
    this.updateCheckedSet(id, checked);
    this.refreshCheckedStatus();
  }

  onAllChecked(value: boolean): void {
    this.listOfCurrentPageData.forEach((item) => this.updateCheckedSet(item.id, value));
    this.refreshCheckedStatus();
  }

  onCurrentPageDataChange(data: readonly RoleResponse[]): void {
    this.listOfCurrentPageData = data;
    this.refreshCheckedStatus();
  }

  refreshCheckedStatus(): void {
    this.checked = this.listOfCurrentPageData.length > 0 && this.listOfCurrentPageData.every((item) => this.setOfCheckedId.has(item.id));
    this.indeterminate =
      this.listOfCurrentPageData.some((item) => this.setOfCheckedId.has(item.id)) && !this.checked;
  }

  // ---------- Deletion ----------

  showDeleteRoleConfirm(role: RoleResponse): void {
    this._modalService.confirm({
      nzTitle: `¿Estás seguro de que quieres eliminar el rol '${role.name}'?`,
      nzOkText: 'Confirmar',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => {
        this._roleService.delete(role.id).subscribe({
          next: () => {
            this._messageService.success(`Rol '${role.name}' eliminado`);
            this.setOfCheckedId.delete(role.id);
            this.refreshCheckedStatus();
            this.loadRoles();
          },
          error: (err) => {
            console.error('Error deleting role', err);
            const errorMessage = parseApiErrorMessage(err);
            this._messageService.error(errorMessage);
          },
        });
      },
      nzCancelText: 'Cancelar',
    });
  }

  showDeleteSelectedRolesConfirm(): void {
    this._modalService.confirm({
      nzTitle: `¿Estás seguro de que quieres eliminar ${this.setOfCheckedId.size} rol(es)?`,
      nzOkText: 'Confirmar',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => this.deleteSelectedRoles(),
      nzCancelText: 'Cancelar',
    });
  }

  deleteSelectedRoles(): void {
    const request: DeleteRolesRequest = {
      roleIds: Array.from(this.setOfCheckedId),
    };

    this._roleService.deleteSelected(request).subscribe({
      next: () => {
        this.setOfCheckedId.clear();
        this.refreshCheckedStatus();
        this.loadRoles();
      },
      error: (err) => {
        const errorMessage = parseApiErrorMessage(err);
        this._messageService.error(errorMessage);
      },
    });
  }

  // ---------- Permisos ----------
  openPermissions(role: RoleResponse): void {
    this._roleService.getPermissions(role.id).subscribe({
      next: (groups) => {
        const drawerRef = this._drawerService.create<PermissionDrawer, PermissionDrawerData, string[]>({
          nzTitle: 'Establecer Permisos del Rol',
          nzWidth: 480,
          nzContent: PermissionDrawer,
          nzData: { groups, userName: role.name }, // userName is a bit misnamed in the drawer, but acts as a display name
        });

        drawerRef.afterClose.subscribe((selectedKeys) => {
          if (!selectedKeys) return;

          this._roleService.setPermissions(role.id, selectedKeys).subscribe({
            next: () => this._messageService.success('Permisos actualizados'),
            error: () => this._messageService.error('No se pudieron guardar los permisos'),
          });
        });
      },
      error: () => this._messageService.error('No se pudieron cargar los permisos del rol'),
    });
  }
}
