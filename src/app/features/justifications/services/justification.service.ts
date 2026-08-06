import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  JustificationResponse,
  CreateJustificationRequest,
  ReviewJustificationRequest,
  JustificationStatus
} from '../models/justification';

@Injectable({
  providedIn: 'root'
})
export class JustificationService {
  private _http = inject(HttpClient);
  private _apiUrl = `${environment.API_URL}/justifications`;

  getAll(
    startDate?: string,
    endDate?: string,
    employeeId?: string,
    status?: JustificationStatus,
    branchId?: string
  ): Observable<JustificationResponse[]> {
    let params = new HttpParams();
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);
    if (employeeId) params = params.set('employeeId', employeeId);
    if (status !== undefined && status !== null) params = params.set('status', status.toString());
    if (branchId) params = params.set('branchId', branchId);

    return this._http.get<JustificationResponse[]>(this._apiUrl, { params });
  }

  create(request: CreateJustificationRequest): Observable<string> {
    return this._http.post<string>(this._apiUrl, request);
  }

  review(id: string, request: ReviewJustificationRequest): Observable<void> {
    return this._http.put<void>(`${this._apiUrl}/${id}/review`, request);
  }
}
