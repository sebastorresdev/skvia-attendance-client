import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { PermissionGroup } from '../models/permission-group';

@Injectable({ providedIn: 'root' })
export class PermissionService {
  private http = inject(HttpClient);

  getAll() {
    return this.http.get<PermissionGroup[]>(`${environment.API_URL}/permissions`);
  }

  updatePermissions(userId: string, permissions: string[]) {
    return this.http.put(`${environment.API_URL}/permissions/${userId}`, { permissions });
  }
}
