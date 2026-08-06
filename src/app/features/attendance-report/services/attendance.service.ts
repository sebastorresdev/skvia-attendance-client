import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface AttendanceResponse {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  branchId: string;
  branchName: string;
  date: string;
  assignedStartTime: string | null;
  assignedEndTime: string | null;
  checkIn: string | null;
  checkOut: string | null;
  tardinessMinutes: number;
  isLate: boolean;
}

export interface EmployeeMonthlySummaryItem {
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  branchName: string;
  totalWorkDaysScheduled: number;
  daysWorked: number;
  daysOff: number;
  vacationDays: number;
  medicalLeaveDays: number;
  unjustifiedAbsences: number;
  justifiedAbsences: number;
  totalLateMinutes: number;
  justifiedLateMinutes: number;
  totalOvertimeMinutes: number;
}

export interface MonthlySummaryResponse {
  year: number;
  month: number;
  totalEmployees: number;
  items: EmployeeMonthlySummaryItem[];
}

@Injectable({
  providedIn: 'root'
})
export class AttendanceService {
  private _http = inject(HttpClient);
  private _apiUrl = `${environment.API_URL}/attendances`;

  getAttendances(
    startDate: string,
    endDate: string,
    branchId?: string,
    employeeSearch?: string,
    employeeId?: string,
    statusFilter?: string
  ): Observable<AttendanceResponse[]> {
    let params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);

    if (branchId) {
      params = params.set('branchId', branchId);
    }
    if (employeeSearch) {
      params = params.set('employeeSearch', employeeSearch);
    }
    if (employeeId) {
      params = params.set('employeeId', employeeId);
    }
    if (statusFilter) {
      params = params.set('statusFilter', statusFilter);
    }

    return this._http.get<AttendanceResponse[]>(this._apiUrl, { params });
  }

  getMonthlySummary(year: number, month: number, branchId?: string): Observable<MonthlySummaryResponse> {
    let params = new HttpParams()
      .set('year', year.toString())
      .set('month', month.toString());

    if (branchId) {
      params = params.set('branchId', branchId);
    }

    return this._http.get<MonthlySummaryResponse>(`${this._apiUrl}/monthly-summary`, { params });
  }

  exportExcel(
    startDate: string,
    endDate: string,
    branchId?: string,
    employeeSearch?: string,
    employeeId?: string,
    statusFilter?: string
  ): Observable<Blob> {
    let params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);

    if (branchId) {
      params = params.set('branchId', branchId);
    }
    if (employeeSearch) {
      params = params.set('employeeSearch', employeeSearch);
    }
    if (employeeId) {
      params = params.set('employeeId', employeeId);
    }
    if (statusFilter) {
      params = params.set('statusFilter', statusFilter);
    }

    return this._http.get(`${this._apiUrl}/export`, {
      params,
      responseType: 'blob'
    });
  }

  seedData(): Observable<any> {
    return this._http.post(`${this._apiUrl}/seed`, {});
  }
}
