import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { DashboardStatsResponse } from '../models/dashboard-stats';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private _http = inject(HttpClient);
  private _apiUrl = `${environment.API_URL}/dashboard`;

  getStats(branchId?: string): Observable<DashboardStatsResponse> {
    let params = new HttpParams();
    if (branchId) {
      params = params.set('branchId', branchId);
    }
    return this._http.get<DashboardStatsResponse>(`${this._apiUrl}/stats`, { params });
  }

  getScheduleAlerts(): Observable<import('../models/schedule-alert').ScheduleAlert[]> {
    return this._http.get<import('../models/schedule-alert').ScheduleAlert[]>(`${this._apiUrl}/schedule-alerts`);
  }
}
