import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { BranchResponse } from '../models/branch-response';
import { CreateBranchRequest } from '../models/create-branch-request';
import { UpdateBranchRequest } from '../models/update-branch-request';
import { DeleteBranchesRequest } from '../models/delete-branches-request';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class BranchService {
  private _http = inject(HttpClient);
  private _base = `${environment.API_URL}/branches`;

  getAll() : Observable<BranchResponse[]> {
    return this._http.get<BranchResponse[]>(this._base);
  }

  getById(id: string): Observable<BranchResponse> {
    return this._http.get<BranchResponse>(`${this._base}/${id}`);
  }

  create(request: CreateBranchRequest): Observable<string> {
    return this._http.post<string>(this._base, request);
  }

  update(id: string, request: UpdateBranchRequest): Observable<void> {
    return this._http.put<void>(`${this._base}/${id}`, request);
  }

  delete(id: string): Observable<void> {
    return this._http.delete<void>(`${this._base}/${id}`);
  }

  deleteSelected(request: DeleteBranchesRequest): Observable<void> {
    return this._http.post<void>(`${this._base}/delete`, request);
  }
}
