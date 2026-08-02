import { inject, Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { RoleResponse } from '../models/role-response';
import { RoleRequest } from '../models/role-request';
import { DeleteRolesRequest } from '../models/delete-roles-request';
import { Observable } from 'rxjs';
@Injectable({
  providedIn: 'root',
})
export class RoleService {
  private _http = inject(HttpClient);
  private _base = `${environment.API_URL}/roles`;

  getAll(): Observable<RoleResponse[]> {
    return this._http.get<RoleResponse[]>(this._base);
  }

  getById(id: string): Observable<RoleResponse> {
    return this._http.get<RoleResponse>(`${this._base}/${id}`);
  }

  create(data: RoleRequest): Observable<string> {
    return this._http.post<string>(this._base, data);
  }

  update(id: string, data: RoleRequest): Observable<void> {
    return this._http.put<void>(`${this._base}/${id}`, data);
  }

  delete(id: string): Observable<void> {
    return this._http.delete<void>(`${this._base}/${id}`);
  }

  deleteSelected(data: DeleteRolesRequest): Observable<void> {
    return this._http.delete<void>(`${this._base}/batch`, { body: data });
  }

  getPermissions(roleId: string): Observable<import('../../../shared/models/permission-group').PermissionGroup[]> {
    return this._http.get<import('../../../shared/models/permission-group').PermissionGroup[]>(`${this._base}/${roleId}/permissions`);
  }

  setPermissions(roleId: string, permissionKeys: string[]): Observable<void> {
    return this._http.put<void>(`${this._base}/${roleId}/permissions`, { permissionKeys });
  }
}

