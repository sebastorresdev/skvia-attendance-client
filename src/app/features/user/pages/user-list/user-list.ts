import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
// NG-ZORRO
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule, NzButtonSize } from 'ng-zorro-antd/button';
import { NzDropdownModule } from 'ng-zorro-antd/dropdown';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzModalModule } from 'ng-zorro-antd/modal'
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { UserResponse } from '../../models/user-response';
import { UserService } from '../../services/user-service';
import { Router } from '@angular/router';
import { ResetPasswordModal } from '../../components/reset-password-modal/reset-password-modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { DeleteUsersRequest } from '../../models/delete-users-request';


@Component({
  selector: 'app-user-list',
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
  templateUrl: './user-list.html'
})
export class UserList implements OnInit {
  private _router = inject(Router);
  private _userService = inject(UserService);
  private _messageService = inject(NzMessageService);
  private _modalService = inject(NzModalService);

  showResetPasswordModal = signal(false);
  selectedUser = signal<UserResponse | null>(null);


  users = signal<UserResponse[]>([]);
  checked = false;
  indeterminate = false;
  listOfCurrentPageData: readonly UserResponse[] = [];
  setOfCheckedId = new Set<string>();

  readonly options = [
    { value: 'jack', label: 'Jack' },
    { value: 'lucy', label: 'Lucy' },
    { value: 'Yiminghe', label: 'yiminghe' },
    { value: 'disabled', label: 'Disabled', disabled: true }
  ];

  readonly value = signal('');

  private modal = inject(NzModalService);

  // INICIALIZACION DE DATOS
  ngOnInit(): void {
    this.loadUsers();
  }

  // NAVEGACION A LA PAGINA DE CREAR
  goToNewUser(): void {
    this._router.navigate(['/users/new']);
  }

  // NAVEGACION A LA PAGINA DE EDITAR
  editUser(userId: string) {
    this._router.navigate(['/users', userId]);
  }

  loadUsers() {
    this._userService.getAll().subscribe({
      next: (data) => {
        this.users.set(data);
      },
      error: (error) => {
        console.log('Error al cargar usuarios', error);
      },
    });
  }

  // Actualizar los checkbox seleccionados
  updateCheckedSet(id: string, checked: boolean): void {
    if (checked) {
      this.setOfCheckedId.add(id);
    } else {
      this.setOfCheckedId.delete(id);
    }
  }

  // METODO CUANDO SE SELECCIONA UN UNICO CHECKBOX
  onItemChecked(id: string, checked: boolean): void {
    this.updateCheckedSet(id, checked);
    this.refreshCheckedStatus();
  }

  // METODO CUANDO SE SELECCIONA TODO EL CHEKBOX
  onAllChecked(value: boolean): void {
    this.listOfCurrentPageData.forEach((item) => this.updateCheckedSet(item.userId, value));
    this.refreshCheckedStatus();
  }

  onCurrentPageDataChange($event: readonly UserResponse[]): void {
    this.listOfCurrentPageData = $event;
    this.refreshCheckedStatus();
  }

  refreshCheckedStatus(): void {
    this.checked = this.listOfCurrentPageData.every((item) => this.setOfCheckedId.has(item.userId));
    this.indeterminate =
      this.listOfCurrentPageData.some((item) => this.setOfCheckedId.has(item.userId)) && !this.checked;
  }

  // MODAL CONFIRMACION PARA ELIMINACION
  showDeleteUserConfirm(user: UserResponse): void {
    this._modalService.confirm({
      nzTitle: `Estas seguro de que quieres eliminar ${user.userName}`,
      nzOkText: 'Confirmar',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => {
        alert("LLAMAR A LA FUNCION PARA ELIMINAR UN UNICO USUARIO");
      },
      nzCancelText: 'Cancelar',
      nzOnCancel: () => console.log('Cancel')
    });
  }

  showDeleteSelectedUsersConfirm() : void {
        this._modalService.confirm({
      nzTitle: `Estas seguro de que quieres eliminar ${this.setOfCheckedId.size}`,
      nzOkText: 'Confirmar',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => {
        alert("LLAMAR A LA FUNCION PARA ELIMINAR USUARIOS SELECCIONADOS");
      },
      nzCancelText: 'Cancelar',
      nzOnCancel: () => console.log('Cancel')
    });
  }

  // ELIMINACION DE USUARIO SELECCIONADOS
  deleteSelectedUsers(): void {

    TODO: "Falta implementar el currentUser"; "Implementar el modal"
    // if (this.setOfCheckedId.has(currentUserId)) {
    //   this._messageService.warning('No puedes eliminar tu propio usuario.');
    //   return;
    // }

    // const request: DeleteUsersRequest = {
    //   currentUserId:currentUserId,
    //   userIds: Array.from(this.setOfCheckedId)
    // };

    // this._userService.deleteSelected(request).subscribe({
    //   next: () => {
    //     // Limpias el Set y recargas la data
    //     this.setOfCheckedId.clear();
    //     this.loadUsers();
    //   },
    //   error: (err) => {
    //     console.error('Error al eliminar usuarios', err);
    //   }
    // });
  }

  deleteUser(user: UserResponse): void {
    TODO: "No debe eliminar al usuario autenticado"; "Implementar el modal"

    console.log('Se llamo al endpoint eliminar usuario');
    this._userService.delete(user.userId).subscribe({
      next: () => {
        this._messageService.success("Usuario Eliminado.");
      },
      error: (error) => {
        console.log('Error al eliminar usuario.', error);
      },
    })
  }


  setPermissions(user: UserResponse): void {
    console.log('Establecer permisos');
    this.visible = true;
  }
  resetPassword(user: UserResponse): void {
    console.log('Restablecer contraseña');
  }
  toggleActive(user: UserResponse, active: boolean) {
    console.log(active ? 'Activar usuario' : 'Archivar usuario');
  }

  // DRAWER
  visible = false;

  open(): void {
    this.visible = true;
  }

  close(): void {
    this.visible = false;
  }

  openResetPassword(user: UserResponse): void {
    this.selectedUser.set(user);
    this.showResetPasswordModal.set(true);
  }
}
