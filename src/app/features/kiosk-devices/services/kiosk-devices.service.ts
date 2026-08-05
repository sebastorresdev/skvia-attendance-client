import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { KioskDeviceResponse, AuthorizeDeviceRequest, AuthorizeDeviceResponse } from '../models/kiosk-device.model';

@Injectable({
  providedIn: 'root'
})
export class KioskDevicesService {
  private _http = inject(HttpClient);
  private readonly _base = `${environment.API_URL}/kioskdevices`;

  getDevices(): Observable<KioskDeviceResponse[]> {
    return this._http.get<KioskDeviceResponse[]>(this._base);
  }

  authorizeDevice(request: AuthorizeDeviceRequest): Observable<AuthorizeDeviceResponse> {
    return this._http.post<AuthorizeDeviceResponse>(`${this._base}/authorize`, request);
  }

  revokeDevice(id: string): Observable<void> {
    return this._http.post<void>(`${this._base}/${id}/revoke`, {});
  }

  deleteDevice(id: string): Observable<void> {
    return this._http.delete<void>(`${this._base}/${id}`);
  }
}
