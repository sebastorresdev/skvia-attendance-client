import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { ScheduleResponse, CreateScheduleRequest, UpdateScheduleRequest } from '../models/schedule';

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
}
