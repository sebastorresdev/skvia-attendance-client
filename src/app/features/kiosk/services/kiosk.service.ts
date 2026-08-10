import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface AttendanceRequest {
  employeeIdentifier: string;
  workplaceId: string;
  photoUrl: string;
  source: number;
  latitude?: number;
  longitude?: number;
  deviceName?: string;
  deviceToken?: string;
}

export interface Branch {
  id: string;
  code: string;
  name: string;
}

@Injectable({
  providedIn: 'root'
})
export class KioskService {
  private _http = inject(HttpClient);
  private readonly _base = `${environment.API_URL}/attendances`;

  checkIn(request: AttendanceRequest): Observable<void> {
    return this._http.post<void>(`${this._base}/check-in`, request);
  }

  checkOut(request: AttendanceRequest): Observable<void> {
    return this._http.post<void>(`${this._base}/check-out`, request);
  }

  startBreak(request: AttendanceRequest): Observable<void> {
    return this._http.post<void>(`${this._base}/start-break`, request);
  }

  endBreak(request: AttendanceRequest): Observable<void> {
    return this._http.post<void>(`${this._base}/end-break`, request);
  }

  getBranches(): Observable<Branch[]> {
    return this._http.get<Branch[]>(`${environment.API_URL}/branches`);
  }

  getKioskBranch(userId: string): Observable<string | null> {
    return this._http.get<{ branchIds: string[] }>(`${environment.API_URL}/users/${userId}`).pipe(
      map(user => user.branchIds && user.branchIds.length > 0 ? user.branchIds[0] : null)
    );
  }
}
