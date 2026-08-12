import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subscription, interval } from 'rxjs';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { KioskDevicesService } from '../../services/kiosk-devices.service';
import { KioskDeviceResponse, KioskDeviceStatus } from '../../models/kiosk-device.model';

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
    NzModalModule,
    NzTooltipModule
  ],
  templateUrl: './device-list.html'
})
export class DeviceList implements OnInit, OnDestroy {
  private _kioskDevicesService = inject(KioskDevicesService);
  private _messageService = inject(NzMessageService);
  private _modalService = inject(NzModalService);

  devices = signal<KioskDeviceResponse[]>([]);
  isLoading = signal(true);

  // Modal State Signals
  isModalVisible = signal(false);
  activeDeviceId = signal('');
  activeDeviceName = signal('');
  activePairingCode = signal('');
  activeExpiresAt = signal('');
  remainingTimeText = signal('');
  kioskUrl = signal('');
  generatingCodeId = signal<string | null>(null);
  isRegenerating = signal(false);

  private timerSubscription?: Subscription;
  private pollSubscription?: Subscription;

  ngOnInit() {
    this.loadDevices();
    this.startAutoRefreshPoll();
  }

  ngOnDestroy() {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }
    if (this.pollSubscription) {
      this.pollSubscription.unsubscribe();
    }
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

  startAutoRefreshPoll() {
    if (this.pollSubscription) return;
    this.pollSubscription = interval(3000).subscribe(() => {
      this.checkDevicesStatusUpdate();
    });
  }

  checkDevicesStatusUpdate() {
    this._kioskDevicesService.getDevices().subscribe({
      next: (data) => {
        this.devices.set(data);
        if (this.isModalVisible() && this.activeDeviceId()) {
          const currentDevice = data.find(d => d.id === this.activeDeviceId());
          if (currentDevice && currentDevice.status === KioskDeviceStatus.Linked) {
            this.closeModal();
            this._messageService.success(`¡Dispositivo "${currentDevice.name}" vinculado con éxito desde el equipo remoto!`);
          }
        }
      }
    });
  }

  copyKioskUrl() {
    const url = `${window.location.origin}/kiosk`;
    navigator.clipboard.writeText(url).then(() => {
      this._messageService.success('¡Enlace del Kiosko copiado al portapapeles!');
    });
  }

  copyUrl(url: string) {
    navigator.clipboard.writeText(url).then(() => {
      this._messageService.success('¡Enlace copiado al portapapeles!');
    });
  }

  copyCode(code: string) {
    navigator.clipboard.writeText(code).then(() => {
      this._messageService.success('¡Código de vinculación copiado!');
    });
  }

  closeModal() {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }
    this.isModalVisible.set(false);
  }

  startCountdownTimer(expiresAtIso: string) {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }

    const updateTimer = () => {
      const expires = new Date(expiresAtIso).getTime();
      const now = new Date().getTime();
      const diff = expires - now;

      if (diff <= 0) {
        this.remainingTimeText.set('Expirado');
        if (this.timerSubscription) this.timerSubscription.unsubscribe();
      } else {
        const minutes = Math.floor(diff / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        this.remainingTimeText.set(`${minutes}m ${seconds.toString().padStart(2, '0')}s`);
      }
    };

    updateTimer();
    this.timerSubscription = interval(1000).subscribe(() => updateTimer());
  }

  generateCode(device: KioskDeviceResponse) {
    if (device.status !== KioskDeviceStatus.Pending) {
      this._messageService.warning('Solo se pueden generar códigos para dispositivos en estado Pendiente.');
      return;
    }

    this.generatingCodeId.set(device.id);
    this._kioskDevicesService.regeneratePairingCode(device.id, false).subscribe({
      next: (res) => {
        this.generatingCodeId.set(null);
        this.activeDeviceId.set(device.id);
        this.activeDeviceName.set(device.name);
        this.activePairingCode.set(res.pairingCode);
        this.activeExpiresAt.set(res.expiresAt);
        this.kioskUrl.set(`${window.location.origin}/kiosk`);
        this.startCountdownTimer(res.expiresAt);
        this.isModalVisible.set(true);
      },
      error: (err) => {
        this.generatingCodeId.set(null);
        this._messageService.error(err?.error?.detail || 'Error al obtener código de vinculación.');
      }
    });
  }

  forceRegenerateCode() {
    const id = this.activeDeviceId();
    if (!id) return;

    this.isRegenerating.set(true);
    this._kioskDevicesService.regeneratePairingCode(id, true).subscribe({
      next: (res) => {
        this.isRegenerating.set(false);
        this.activePairingCode.set(res.pairingCode);
        this.activeExpiresAt.set(res.expiresAt);
        this.startCountdownTimer(res.expiresAt);
        this._messageService.success('¡Nuevo código generado con 30 minutos de validez!');
      },
      error: () => {
        this.isRegenerating.set(false);
        this._messageService.error('Error al regenerar código.');
      }
    });
  }

  confirmUnlink(device: KioskDeviceResponse) {
    this._modalService.confirm({
      nzTitle: '⚠️ ¿Desvincular Dispositivo Kiosko?',
      nzContent: `¿Estás seguro de desvincular "${device.name}"? Se romperá la vinculación con la PC o tablet física y el kiosko volverá a estado Pendiente.`,
      nzOkText: 'Sí, Desvincular',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzCancelText: 'Cancelar',
      nzOnOk: () => this.unlinkDevice(device.id)
    });
  }

  confirmRevoke(device: KioskDeviceResponse) {
    this._modalService.confirm({
      nzTitle: '🔴 ¿Inhabilitar / Suspender Kiosko?',
      nzContent: `¿Estás seguro de inhabilitar "${device.name}"? El kiosko quedará en estado Inactivo y la PC no podrá marcar hasta que sea reactivada.`,
      nzOkText: 'Sí, Inhabilitar',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzCancelText: 'Cancelar',
      nzOnOk: () => this.revokeDevice(device.id)
    });
  }

  confirmReactivate(device: KioskDeviceResponse) {
    this._modalService.confirm({
      nzTitle: '▶️ ¿Habilitar y Reactivar Kiosko?',
      nzContent: `¿Deseas reactivar el kiosko "${device.name}"? Volverá al estado Vinculado y la PC física se desbloqueará de inmediato.`,
      nzOkText: 'Sí, Habilitar Kiosko',
      nzOkType: 'primary',
      nzCancelText: 'Cancelar',
      nzOnOk: () => this.reactivateDevice(device.id)
    });
  }

  confirmDelete(device: KioskDeviceResponse) {
    this._modalService.confirm({
      nzTitle: '🗑️ ¿Eliminar Dispositivo Kiosko?',
      nzContent: `¿Estás seguro de eliminar "${device.name}" permanentemente? Esta acción no se puede deshacer.`,
      nzOkText: 'Sí, Eliminar',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzCancelText: 'Cancelar',
      nzOnOk: () => this.deleteDevice(device.id)
    });
  }

  unlinkDevice(id: string) {
    this._kioskDevicesService.unlinkDevice(id).subscribe({
      next: () => {
        this._messageService.success('Dispositivo desvinculado correctamente. Ahora está listo para vincularse de nuevo.');
        this.loadDevices();
      },
      error: () => {
        this._messageService.error('Error al desvincular dispositivo');
      }
    });
  }

  revokeDevice(id: string) {
    this._kioskDevicesService.revokeDevice(id).subscribe({
      next: () => {
        this._messageService.success('Dispositivo inhabilitado temporalmente.');
        this.loadDevices();
      },
      error: () => {
        this._messageService.error('Error al inhabilitar dispositivo');
      }
    });
  }

  reactivateDevice(id: string) {
    this._kioskDevicesService.reactivateDevice(id).subscribe({
      next: () => {
        this._messageService.success('Dispositivo reactivado y vuelto a estado Vinculado.');
        this.loadDevices();
      },
      error: () => {
        this._messageService.error('Error al reactivar dispositivo');
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
