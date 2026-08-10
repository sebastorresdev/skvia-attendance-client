import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { DepartmentResponse } from '../models/department-response';

@Injectable({
  providedIn: 'root'
})
export class DepartmentService {
  private _http = inject(HttpClient);
  private _apiUrl = `${environment.API_URL}/departments`;

  getAll(): Observable<DepartmentResponse[]> {
    return this._http.get<DepartmentResponse[]>(this._apiUrl);
  }
}
