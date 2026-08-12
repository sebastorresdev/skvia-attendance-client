import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { 
  KioskDeviceResponse, 
  AuthorizeDeviceRequest, 
  AuthorizeDeviceResponse,
  ClaimPairingCodeResponse 
} from '../models/kiosk-device.model';

export interface VerifyTokenResponse {
  isValid: boolean;
  name?: string;
  workplaceId?: string;
  workplaceName?: string;
  status?: number;
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

  regeneratePairingCode(id: string, force = false): Observable<AuthorizeDeviceResponse> {
    return this._http.post<AuthorizeDeviceResponse>(`${this._base}/${id}/regenerate-code?force=${force}`, {});
  }

  claimPairingCode(code: string): Observable<ClaimPairingCodeResponse> {
    return this._http.post<ClaimPairingCodeResponse>(`${this._base}/claim-code`, { code });
  }

  verifyToken(token: string): Observable<VerifyTokenResponse> {
    return this._http.post<VerifyTokenResponse>(`${this._base}/verify`, { token });
  }

  unlinkDevice(id: string): Observable<void> {
    return this._http.post<void>(`${this._base}/${id}/unlink`, {});
  }

  revokeDevice(id: string): Observable<void> {
    return this._http.post<void>(`${this._base}/${id}/revoke`, {});
  }

  reactivateDevice(id: string): Observable<void> {
    return this._http.post<void>(`${this._base}/${id}/reactivate`, {});
  }

  deleteDevice(id: string): Observable<void> {
    return this._http.delete<void>(`${this._base}/${id}`);
  }
}
