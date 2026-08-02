import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
// NG-ZORRO
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDropdownModule } from 'ng-zorro-antd/dropdown';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzDrawerModule, NzDrawerService } from 'ng-zorro-antd/drawer';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzMessageService } from 'ng-zorro-antd/message';
// PROYECTO
import { UserResponse } from '../../models/user-response';
import { UserService } from '../../services/user-service';
import { Router } from '@angular/router';
import { ResetPasswordModal } from '../../components/reset-password-modal/reset-password-modal';
import { DeleteUsersRequest } from '../../models/delete-users-request';
import { PermissionDrawer, PermissionDrawerData } from '../../components/permission-drawer/permission-drawer';
import { parseApiErrorMessage } from '../../../../shared/utils/api-error.util';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    NzInputModule,
    NzSpaceModule,
    DatePipe,
    FormsModule,
    NzTableModule,
    NzIconModule,
    NzButtonModule,
    NzDropdownModule,
    NzMenuModule,
    NzSwitchModule,
    NzTagModule,
    NzDrawerModule,
    NzModalModule,
    NzAvatarModule,
    NzSelectModule,
    ResetPasswordModal,
  ],
  templateUrl: './user-list.html',
})
export class UserList implements OnInit {
  private _router = inject(Router);
  private _userService = inject(UserService);
  private _messageService = inject(NzMessageService);
  private _modalService = inject(NzModalService);
  private _drawerService = inject(NzDrawerService);

  users = signal<UserResponse[]>([]);

  showResetPasswordModal = signal(false);
  selectedUser = signal<UserResponse | null>(null);

  checked = false;
  indeterminate = false;
  listOfCurrentPageData: readonly UserResponse[] = [];
  setOfCheckedId = new Set<string>();

  ngOnInit(): void {
    this.loadUsers();
  }

  // ---------- Navegación ----------

  goToNewUser(): void {
    this._router.navigate(['/users/new']);
  }

  editUser(userId: string): void {
    this._router.navigate(['/users', userId]);
  }

  // ---------- Carga de datos ----------

  loadUsers(): void {
    this._userService.getAll().subscribe({
      next: (data) => this.users.set(data),
      error: (error) => {
        console.error('Error al cargar usuarios', error);
        this._messageService.error('No se pudieron cargar los usuarios');
      },
    });
  }

  // ---------- Selección de checkboxes (tabla) ----------

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

  onCurrentPageDataChange(data: readonly UserResponse[]): void {
    this.listOfCurrentPageData = data;
    this.refreshCheckedStatus();
  }

  refreshCheckedStatus(): void {
    this.checked = this.listOfCurrentPageData.every((item) => this.setOfCheckedId.has(item.id));
    this.indeterminate =
      this.listOfCurrentPageData.some((item) => this.setOfCheckedId.has(item.id)) && !this.checked;
  }

  // ---------- Eliminación ----------

  showDeleteUserConfirm(user: UserResponse): void {
    this._modalService.confirm({
      nzTitle: `¿Estás seguro de que quieres eliminar a ${user.userName}?`,
      nzOkText: 'Confirmar',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => {
        // TODO: llamar a this._userService.delete(user.id) y recargar la lista
        this._userService.delete(user.id).subscribe({
          next: () => {
            this._messageService.success(`Usuario ${user.userName} eliminado`);
            this.loadUsers();
          },
          error: (err) => {
            console.error('Error al eliminar usuario', err);

            // Extraemos el mensaje amigable de la respuesta del backend
            const errorMessage = parseApiErrorMessage(err);
            this._messageService.error(errorMessage);
          },
        });
      },
      nzCancelText: 'Cancelar',
    });
  }

  showDeleteSelectedUsersConfirm(): void {
    this._modalService.confirm({
      nzTitle: `¿Estás seguro de que quieres eliminar ${this.setOfCheckedId.size} usuario(s)?`,
      nzOkText: 'Confirmar',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => this.deleteSelectedUsers(),
      nzCancelText: 'Cancelar',
    });
  }

  deleteSelectedUsers(): void {
    const request: DeleteUsersRequest = {
      userIds: Array.from(this.setOfCheckedId),
    };

    this._userService.deleteSelected(request).subscribe({
      next: () => {
        this.setOfCheckedId.clear();
        this.loadUsers();
      },
      error: (err) => {
        const errorMessage = parseApiErrorMessage(err);
        this._messageService.error(errorMessage);
      },
    });
  }

  // ---------- Permisos individuales ----------

  openPermissions(user: UserResponse): void {
    this._userService.getForUser(user.id).subscribe({
      next: (groups) => {
        const drawerRef = this._drawerService.create<PermissionDrawer, PermissionDrawerData, string[]>({
          nzTitle: 'Establecer Permisos',
          nzWidth: 480,
          nzContent: PermissionDrawer,
          nzData: { groups, userName: user.userName },
        });

        drawerRef.afterClose.subscribe((selectedOverrideKeys) => {
          if (!selectedOverrideKeys) return; // se cerró con "Cancelar" o la X

          console.log("Usuario seleccionado", user);
          this._userService.setOverrides(user.id, selectedOverrideKeys).subscribe({
            next: () => this._messageService.success('Permisos actualizados'),
            error: () => this._messageService.error('No se pudieron guardar los permisos'),
          });
        });
      },
      error: () => this._messageService.error('No se pudieron cargar los permisos del usuario'),
    });
  }

  // ---------- Contraseña ----------

  openResetPassword(user: UserResponse): void {
    this.selectedUser.set(user);
    this.showResetPasswordModal.set(true);
  }

  // ---------- Activar / Archivar ----------

  toggleActive(user: UserResponse, active: boolean): void {
    // TODO: llamar a this._userService.archive(user.id) / unarchive(user.id)
    console.log(active ? 'Activar usuario' : 'Archivar usuario', user.id);
  }
}
