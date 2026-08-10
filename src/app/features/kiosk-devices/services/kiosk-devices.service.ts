import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { KioskDeviceResponse, AuthorizeDeviceRequest, AuthorizeDeviceResponse } from '../models/kiosk-device.model';

export interface AuthorizePinRequest {
  code: string;
  name: string;
  workplaceId: string;
}

export interface CheckPairingResponse {
  isApproved: boolean;
  token?: string;
  workplaceId?: string;
}

export interface VerifyTokenResponse {
  isValid: boolean;
  name?: string;
  workplaceId?: string;
  workplaceName?: string;
}

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

  generatePairingCode(): Observable<{ code: string }> {
    return this._http.post<{ code: string }>(`${this._base}/pairing-code`, {});
  }

  checkPairingStatus(code: string): Observable<CheckPairingResponse> {
    return this._http.get<CheckPairingResponse>(`${this._base}/check-pairing/${code}`);
  }

  authorizePin(request: AuthorizePinRequest): Observable<AuthorizeDeviceResponse> {
    return this._http.post<AuthorizeDeviceResponse>(`${this._base}/authorize-pin`, request);
  }

  verifyToken(token: string): Observable<VerifyTokenResponse> {
    return this._http.post<VerifyTokenResponse>(`${this._base}/verify`, { token });
  }

  revokeDevice(id: string): Observable<void> {
    return this._http.post<void>(`${this._base}/${id}/revoke`, {});
  }

  deleteDevice(id: string): Observable<void> {
    return this._http.delete<void>(`${this._base}/${id}`);
  }
}
