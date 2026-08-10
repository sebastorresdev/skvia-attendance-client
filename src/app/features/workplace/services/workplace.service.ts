import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface WorkplaceResponse {
  id: string;
  code: string;
  name: string;
  address?: string;
  timeZoneId: string;
  latitude: number;
  longitude: number;
  geofenceRadiusMeters: number;
  requirePhotoForMobile: boolean;
}

export interface CreateWorkplaceRequest {
  code: string;
  name: string;
  address?: string;
  timeZoneId?: string;
  latitude: number;
  longitude: number;
  geofenceRadiusMeters: number;
  requirePhotoForMobile?: boolean;
}

export interface UpdateWorkplaceRequest {
  code: string;
  name: string;
  address?: string;
  timeZoneId?: string;
  latitude: number;
  longitude: number;
  geofenceRadiusMeters: number;
  requirePhotoForMobile?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class WorkplaceService {
  private _http = inject(HttpClient);
  private readonly _base = `${environment.API_URL}/workplaces`;

  getAll(): Observable<WorkplaceResponse[]> {
    return this._http.get<WorkplaceResponse[]>(this._base);
  }

  create(request: CreateWorkplaceRequest): Observable<{ id: string }> {
    return this._http.post<{ id: string }>(this._base, request);
  }

  update(id: string, request: UpdateWorkplaceRequest): Observable<void> {
    return this._http.put<void>(`${this._base}/${id}`, request);
  }

  delete(id: string): Observable<void> {
    return this._http.delete<void>(`${this._base}/${id}`);
  }
}
