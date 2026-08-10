import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { EmployeeResponse, EmployeeStatus } from '../models/employee-response';
import { CreateEmployeeRequest } from '../models/create-employee-request';
import { UpdateEmployeeRequest } from '../models/update-employee-request';
import { AssignWeeklyScheduleRequest, EmployeeScheduleResponse } from '../models/employee-schedule';

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  private _http = inject(HttpClient);
  private readonly _base = `${environment.API_URL}/employees`;

  getAll(): Observable<EmployeeResponse[]> {
    return this._http.get<EmployeeResponse[]>(this._base);
  }

  getById(id: string): Observable<EmployeeResponse> {
    return this._http.get<EmployeeResponse>(`${this._base}/${id}`);
  }

  create(request: CreateEmployeeRequest): Observable<any> {
    return this._http.post<any>(this._base, request);
  }

  update(id: string, request: UpdateEmployeeRequest): Observable<any> {
    return this._http.put<any>(`${this._base}/${id}`, request);
  }

  delete(id: string): Observable<void> {
    return this._http.delete<void>(`${this._base}/${id}`);
  }

  getSchedule(id: string, startDate: string, endDate: string): Observable<EmployeeScheduleResponse[]> {
    return this._http.get<EmployeeScheduleResponse[]>(`${this._base}/${id}/schedules?startDate=${startDate}&endDate=${endDate}`);
  }

  assignWeeklySchedule(id: string, request: AssignWeeklyScheduleRequest): Observable<void> {
    return this._http.post<void>(`${this._base}/${id}/schedules/weekly`, request);
  }

  changeStatus(id: string, status: EmployeeStatus): Observable<void> {
    return this._http.put<void>(`${this._base}/${id}/status`, { status });
  }

  generateSchedules(id: string, startDate: string, endDate: string, patterns?: any[]): Observable<void> {
    return this._http.post<void>(`${this._base}/${id}/schedules/generate`, { startDate, endDate, patterns });
  }

  uploadPhoto(file: File): Observable<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this._http.post<{ url: string }>(`${this._base}/upload-photo`, formData);
  }
}
