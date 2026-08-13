import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../../environments/environment';
import {
  ScheduleResponse,
  CreateScheduleRequest,
  UpdateScheduleRequest,
  AssignBulkScheduleRequest,
  AssignScheduleMatrixRequest,
  CreateScheduleExceptionRequest,
  ResolvedScheduleDayDto,
  EmployeeScheduleGridRowDto
} from '../models/schedule';

@Injectable({
  providedIn: 'root'
})
export class ScheduleService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.API_URL}/schedules`;

  getSchedules() {
    return this.http.get<ScheduleResponse[]>(this.apiUrl);
  }

  create(request: CreateScheduleRequest) {
    return this.http.post<string>(this.apiUrl, request);
  }

  update(id: string, request: UpdateScheduleRequest) {
    return this.http.put<void>(`${this.apiUrl}/${id}`, request);
  }

  delete(id: string) {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  assignBulk(request: AssignBulkScheduleRequest) {
    return this.http.post<void>(`${this.apiUrl}/assign-bulk`, request);
  }

  assignMatrix(request: AssignScheduleMatrixRequest) {
    return this.http.post<void>(`${this.apiUrl}/assign-matrix`, request);
  }

  createException(request: CreateScheduleExceptionRequest) {
    return this.http.post<string>(`${this.apiUrl}/exceptions`, request);
  }

  deleteException(id: string) {
    return this.http.delete<void>(`${this.apiUrl}/exceptions/${id}`);
  }

  getResolvedEmployeeSchedule(employeeId: string, startDate: string, endDate: string) {
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);

    return this.http.get<ResolvedScheduleDayDto[]>(`${this.apiUrl}/employee/${employeeId}/range`, { params });
  }

  getResolvedGrid(startDate: string, endDate: string, branchId?: string, departmentId?: string) {
    let params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);

    if (branchId) params = params.set('branchId', branchId);
    if (departmentId) params = params.set('departmentId', departmentId);

    return this.http.get<EmployeeScheduleGridRowDto[]>(`${this.apiUrl}/calendar-grid`, { params });
  }
}
