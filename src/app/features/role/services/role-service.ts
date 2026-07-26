import { inject, Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { RoleResponse } from '../models/role-response';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class RoleService {
  private _http = inject(HttpClient);
  private _base = `${environment.API_URL}/roles`;

  getAll() : Observable<RoleResponse[]>{
    return this._http.get<RoleResponse[]>(this._base);
  }
}

