import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzMessageService } from 'ng-zorro-antd/message';
import { KioskDevicesService } from '../../services/kiosk-devices.service';
import { KioskDeviceResponse } from '../../models/kiosk-device.model';

@Component({
  selector: 'app-device-list',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    NzTableModule, 
    NzButtonModule, 
    NzIconModule, 
    NzTagModule, 
    NzCardModule,
    NzPopconfirmModule
  ],
  templateUrl: './device-list.html'
})
export class DeviceList implements OnInit {
  private _kioskDevicesService = inject(KioskDevicesService);
  private _messageService = inject(NzMessageService);

  devices = signal<KioskDeviceResponse[]>([]);
  isLoading = signal(true);

  ngOnInit() {
    this.loadDevices();
  }

  loadDevices() {
    this.isLoading.set(true);
    this._kioskDevicesService.getDevices().subscribe({
      next: (data) => {
        this.devices.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this._messageService.error('Error al cargar dispositivos');
        this.isLoading.set(false);
      }
    });
  }

  revokeDevice(id: string) {
    this._kioskDevicesService.revokeDevice(id).subscribe({
      next: () => {
        this._messageService.success('Dispositivo revocado correctamente');
        this.loadDevices();
      },
      error: () => {
        this._messageService.error('Error al revocar dispositivo');
      }
    });
  }

  deleteDevice(id: string) {
    this._kioskDevicesService.deleteDevice(id).subscribe({
      next: () => {
        this._messageService.success('Dispositivo eliminado correctamente');
        this.loadDevices();
      },
      error: () => {
        this._messageService.error('Error al eliminar dispositivo');
      }
    });
  }
}
