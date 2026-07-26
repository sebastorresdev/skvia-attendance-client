import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { BranchResponse } from '../models/branch-response';
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
}
