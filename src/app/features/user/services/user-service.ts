import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { UserResponse } from '../models/user-response';
import { UserDetailResponse } from '../models/user-detail-response';
import { CreateUserRequest } from '../models/create-user-request';
import { UpdateUserRequest } from '../models/update-user-request';
import { environment } from '../../../../environments/environment';
import { ResetPasswordRequest } from '../models/reset-password-request';
import { DeleteUsersRequest } from '../models/delete-users-request';
import { PermissionGroup } from '../../../shared/models/permission-group';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private _http = inject(HttpClient);
  private _base = `${environment.API_URL}/users`;

  getAll() {
    return this._http.get<UserResponse[]>(this._base);
  }

  getById(userId: string) {
    return this._http.get<UserDetailResponse>(`${this._base}/${userId}`);
  }

  create(request: CreateUserRequest) {
    return this._http.post<{ id: string }>(this._base, request);
  }

  update(userId: string, data: UpdateUserRequest) {
    return this._http.put(`${this._base}/${userId}`, data);
  }

  delete(userId: string) {
    return this._http.delete(`${this._base}/${userId}`);
  }

  deleteSelected(deleteUsers: DeleteUsersRequest) {
    return this._http.delete(`${this._base}/batch`, {
      body: deleteUsers
    });
  }

  uploadAvatar(avatar: FormData) {
    console.log('¿Tiene el archivo?', avatar.get('avatar'));

    // 2. O si quieres ver todas las llaves y valores que lleva:
    avatar.forEach((value, key) => {
      console.log(`${key}:`, value);
    });
    return this._http.post<{ url: string }>(`${this._base}/avatar`, avatar);
  }

  assignBranchesToUser(userId: string, branchIds: string[]) {
    return this._http.put(`${this._base}/${userId}/branches`, { branchIds });
  }

  resetPassword(request: ResetPasswordRequest) {
    return this._http.post<void>(`${this._base}/reset-password`, request);
  }

  getForUser(userId: string) {
    return this._http.get<PermissionGroup[]>(`${this._base}/${userId}/permissions`);
  }

  // Reemplaza los permisos individuales (overrides) del usuario
  setOverrides(userId: string, permissionKeys: string[]) {
    return this._http.put<void>(`${this._base}/${userId}/permissions/overrides`, { permissionKeys });
  }
}
