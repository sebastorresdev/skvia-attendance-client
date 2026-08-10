import { Component, inject, OnInit, AfterViewInit, OnDestroy, signal, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NzModalModule, NzModalRef, NZ_MODAL_DATA } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

import { WorkplaceResponse, WorkplaceService } from '../../services/workplace.service';
import { parseApiErrorMessage } from '../../../../shared/utils/api-error.util';
import { Observable } from 'rxjs';

declare const L: any;

@Component({
  selector: 'app-workplace-form-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzInputNumberModule,
    NzSelectModule,
    NzButtonModule,
    NzModalModule,
    NzSwitchModule,
    NzCheckboxModule,
    NzDividerModule,
    NzIconModule
  ],
  templateUrl: './workplace-form-modal.html'
})
export class WorkplaceFormModal implements OnInit, AfterViewInit, OnDestroy {
  private _fb = inject(FormBuilder);
  private _modalRef = inject(NzModalRef);
  private _workplaceService = inject(WorkplaceService);
  private _messageService = inject(NzMessageService);
  private _http = inject(HttpClient);
  private _cdr = inject(ChangeDetectorRef);
  private _modalData: { workplace?: WorkplaceResponse } = inject(NZ_MODAL_DATA, { optional: true }) || {};

  workplace?: WorkplaceResponse;
  isEdit = false;

  form!: FormGroup;
  loading = signal(false);
  gettingLocation = signal(false);
  searchingAddress = signal(false);

  private map: any;
  private marker: any;
  private circle: any;

  ngOnInit(): void {
    this.workplace = this._modalData.workplace;
    this.isEdit = !!this.workplace;

    const hasGeofence = !!(this.workplace?.latitude != null && this.workplace?.longitude != null);

    this.form = this._fb.group({
      code: [this.workplace?.code || '', [Validators.required, Validators.maxLength(20)]],
      name: [this.workplace?.name || '', [Validators.required, Validators.maxLength(100)]],
      address: [this.workplace?.address || '', [Validators.maxLength(250)]],
      timeZoneId: [this.workplace?.timeZoneId || 'America/Lima', [Validators.required]],
      enableGeofence: [hasGeofence],
      latitude: [this.workplace?.latitude ?? null],
      longitude: [this.workplace?.longitude ?? null],
      geofenceRadiusMeters: [this.workplace?.geofenceRadiusMeters ?? 200, [Validators.min(1)]],
      requirePhotoForMobile: [this.workplace?.requirePhotoForMobile ?? true]
    });

    this.form.get('enableGeofence')?.valueChanges.subscribe(enabled => {
      if (enabled) {
        this.form.get('geofenceRadiusMeters')?.setValidators([Validators.required, Validators.min(1)]);
        setTimeout(() => this.initMap(), 150);
      } else {
        this.form.get('geofenceRadiusMeters')?.clearValidators();
        this.form.patchValue({ latitude: null, longitude: null });
        this.destroyMap();
      }
      this.form.get('geofenceRadiusMeters')?.updateValueAndValidity();
      this._cdr.markForCheck();
    });

    this.form.get('geofenceRadiusMeters')?.valueChanges.subscribe(radius => {
      if (this.circle && radius > 0) {
        this.circle.setRadius(radius);
      }
    });
  }

  ngAfterViewInit(): void {
    if (this.form.get('enableGeofence')?.value) {
      setTimeout(() => this.initMap(), 200);
    }
  }

  ngOnDestroy(): void {
    this.destroyMap();
  }

  private initMap(): void {
    if (typeof L === 'undefined') return;

    const mapElement = document.getElementById('workplace-map');
    if (!mapElement) return;

    if (this.map) {
      this.map.invalidateSize();
      return;
    }

    const initialLat = this.form.get('latitude')?.value || -12.046374;
    const initialLng = this.form.get('longitude')?.value || -77.042793;
    const initialRadius = this.form.get('geofenceRadiusMeters')?.value || 200;

    this.map = L.map('workplace-map').setView([initialLat, initialLng], 16);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap'
    }).addTo(this.map);

    this.marker = L.marker([initialLat, initialLng], { draggable: true }).addTo(this.map);
    this.circle = L.circle([initialLat, initialLng], {
      radius: initialRadius,
      color: '#2563eb',
      fillColor: '#3b82f6',
      fillOpacity: 0.2
    }).addTo(this.map);

    this.map.on('click', (e: any) => {
      this.updateMapPosition(e.latlng.lat, e.latlng.lng);
    });

    this.marker.on('dragend', () => {
      const pos = this.marker.getLatLng();
      this.updateMapPosition(pos.lat, pos.lng);
    });

    if (!this.form.get('latitude')?.value) {
      this.updateMapPosition(initialLat, initialLng);
    }
  }

  private updateMapPosition(lat: number, lng: number): void {
    const formattedLat = Number(lat.toFixed(6));
    const formattedLng = Number(lng.toFixed(6));

    this.form.patchValue({
      latitude: formattedLat,
      longitude: formattedLng
    });

    if (this.marker) this.marker.setLatLng([lat, lng]);
    if (this.circle) this.circle.setLatLng([lat, lng]);
    this._cdr.markForCheck();
  }

  private destroyMap(): void {
    if (this.map) {
      this.map.remove();
      this.map = null;
      this.marker = null;
      this.circle = null;
    }
  }

  searchAddress(address: string): void {
    if (!address || !address.trim()) {
      this._messageService.warning('Ingresa una dirección o lugar para buscar.');
      return;
    }

    this.searchingAddress.set(true);
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address.trim())}`;

    this._http.get<any[]>(url).subscribe({
      next: (results) => {
        this.searchingAddress.set(false);
        if (results && results.length > 0) {
          const lat = parseFloat(results[0].lat);
          const lng = parseFloat(results[0].lon);

          if (!this.form.get('enableGeofence')?.value) {
            this.form.patchValue({ enableGeofence: true });
          }

          setTimeout(() => {
            if (this.map) {
              this.map.flyTo([lat, lng], 17);
            }
            this.updateMapPosition(lat, lng);
            this._messageService.success(`Ubicación encontrada: ${results[0].display_name.substring(0, 50)}...`);
          }, 200);
        } else {
          this._messageService.warning('No se encontraron resultados para la dirección ingresada.');
        }
        this._cdr.markForCheck();
      },
      error: () => {
        this.searchingAddress.set(false);
        this._messageService.error('Error al realizar la búsqueda de dirección.');
        this._cdr.markForCheck();
      }
    });
  }

  getCurrentLocation(): void {
    if (!navigator.geolocation) {
      this._messageService.error('Geolocalización no soportada por el navegador.');
      return;
    }

    this.gettingLocation.set(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        if (!this.form.get('enableGeofence')?.value) {
          this.form.patchValue({ enableGeofence: true });
        }

        setTimeout(() => {
          if (this.map) {
            this.map.flyTo([lat, lng], 17);
          }
          this.updateMapPosition(lat, lng);
          this.gettingLocation.set(false);
          this._messageService.success('¡Ubicación GPS capturada con éxito!');
        }, 200);
      },
      () => {
        this.gettingLocation.set(false);
        this._messageService.error('No se pudo obtener la ubicación. Verifique los permisos del navegador.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  destroyModal(): void {
    this._modalRef.destroy(false);
  }

  submitForm(): void {
    if (this.form.valid) {
      this.loading.set(true);
      const val = this.form.value;

      const isGeofenceActive = !!val.enableGeofence;

      const request = {
        code: val.code.trim().toUpperCase(),
        name: val.name.trim(),
        address: val.address ? val.address.trim() : undefined,
        timeZoneId: val.timeZoneId.trim(),
        latitude: isGeofenceActive && val.latitude != null ? val.latitude : undefined,
        longitude: isGeofenceActive && val.longitude != null ? val.longitude : undefined,
        geofenceRadiusMeters: isGeofenceActive ? (val.geofenceRadiusMeters || 200) : 0,
        requirePhotoForMobile: !!val.requirePhotoForMobile
      };

      const obs$ = (this.isEdit
        ? this._workplaceService.update(this.workplace!.id, request)
        : this._workplaceService.create(request)) as Observable<any>;

      obs$.subscribe({
        next: () => {
          this._messageService.success(`Lugar de marcación ${this.isEdit ? 'actualizado' : 'creado'} con éxito`);
          setTimeout(() => this.loading.set(false));
          this._modalRef.close(true);
        },
        error: (err: any) => {
          setTimeout(() => this.loading.set(false));
          const msg = parseApiErrorMessage(err);
          this._messageService.error(msg);
        }
      });
    } else {
      Object.values(this.form.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
    }
  }
}
