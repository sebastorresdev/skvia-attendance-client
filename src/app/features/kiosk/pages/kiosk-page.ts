import { Component, OnDestroy, OnInit, inject, ChangeDetectorRef, signal } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription, interval } from 'rxjs';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzMessageService } from 'ng-zorro-antd/message';
import { KioskService, AttendanceRequest } from '../services/kiosk.service';
import { KioskDevicesService } from '../../kiosk-devices/services/kiosk-devices.service';
import { parseApiErrorMessage } from '../../../shared/utils/api-error.util';

@Component({
  selector: 'app-kiosk-page',
  standalone: true,
  imports: [CommonModule, FormsModule, NzInputModule, NzButtonModule, NzIconModule, NzSpinModule],
  providers: [DatePipe],
  templateUrl: './kiosk-page.html',
  styles: [`
    :host {
      display: block;
      height: 100vh;
      background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%);
    }
  `]
})
export class KioskPage implements OnInit, OnDestroy {
  private _kioskService = inject(KioskService);
  private _kioskDevicesService = inject(KioskDevicesService);
  private _messageService = inject(NzMessageService);
  private _cdr = inject(ChangeDetectorRef);
  private _router = inject(Router);
  private _route = inject(ActivatedRoute);

  currentTime: Date = new Date();
  identifier: string = '';
  isLoading = signal(false);
  isLocked = signal(true);
  isVerifying = signal(true);
  pairingCode = signal<string | null>(null);

  private timeSubscription?: Subscription;
  private pairingSubscription?: Subscription;

  private _workplaceId = '';
  private _token = '';

  ngOnInit() {
    this.timeSubscription = interval(1000).subscribe(() => {
      this.currentTime = new Date();
      this._cdr.markForCheck();
    });

    // Check if URL has token and workplaceId
    this._route.queryParams.subscribe(params => {
      const urlToken = params['token'];
      const urlWorkplaceId = params['workplaceId'] || params['branchId'];

      if (urlToken && urlWorkplaceId) {
        localStorage.setItem('kiosk_token', urlToken);
        localStorage.setItem('kiosk_workplace_id', urlWorkplaceId);

        this._router.navigate([], {
          relativeTo: this._route,
          queryParams: { token: null, workplaceId: null, branchId: null },
          queryParamsHandling: 'merge'
        });
      }

      this.verifyDeviceStatus();
    });
  }

  verifyDeviceStatus() {
    this.isVerifying.set(true);
    const token = localStorage.getItem('kiosk_token');

    if (token) {
      this._kioskDevicesService.verifyToken(token).subscribe({
        next: (res: any) => {
          const isValid = res?.isValid ?? res?.IsValid;
          const workplaceId = res?.workplaceId ?? res?.WorkplaceId;

          if (isValid) {
            this._token = token;
            this._workplaceId = workplaceId || '';
            this.isLocked.set(false);
            this.isVerifying.set(false);
            this.stopPairingFlow();
          } else {
            this.clearDeviceStorage();
            this.startPairingFlow();
          }
          this._cdr.markForCheck();
        },
        error: () => {
          this.clearDeviceStorage();
          this.startPairingFlow();
          this._cdr.markForCheck();
        }
      });
    } else {
      this.startPairingFlow();
    }
  }

  clearDeviceStorage() {
    localStorage.removeItem('kiosk_token');
    localStorage.removeItem('kiosk_workplace_id');
    localStorage.removeItem('kiosk_branch_id');
    this._token = '';
    this._workplaceId = '';
  }

  startPairingFlow() {
    this.isLocked.set(true);
    this.isVerifying.set(false);
    this.stopPairingFlow();

    this._kioskDevicesService.generatePairingCode().subscribe({
      next: (res) => {
        this.pairingCode.set(res.code);
        this._cdr.markForCheck();

        this.pairingSubscription = interval(2000).subscribe(() => {
          const currentCode = this.pairingCode();
          if (!currentCode) return;

          this._kioskDevicesService.checkPairingStatus(currentCode).subscribe({
            next: (status: any) => {
              const isApproved = status?.isApproved ?? status?.IsApproved;
              const token = status?.token ?? status?.Token;
              const workplaceId = status?.workplaceId ?? status?.WorkplaceId;

              if (isApproved && token && workplaceId) {
                localStorage.setItem('kiosk_token', token);
                localStorage.setItem('kiosk_workplace_id', workplaceId);
                this._messageService.success('¡Dispositivo vinculado con éxito!');
                this.stopPairingFlow();
                this.verifyDeviceStatus();
              }
            },
            error: (err) => {
              if (err.status === 404) {
                this.stopPairingFlow();
                this.startPairingFlow();
              }
            }
          });
        });
      },
      error: () => {
        this._messageService.error('Error al generar código de vinculación.');
      }
    });
  }

  stopPairingFlow() {
    if (this.pairingSubscription) {
      this.pairingSubscription.unsubscribe();
      this.pairingSubscription = undefined;
    }
  }

  ngOnDestroy() {
    if (this.timeSubscription) {
      this.timeSubscription.unsubscribe();
    }
    this.stopPairingFlow();
  }

  appendDigit(digit: string) {
    if (this.identifier.length < 12) {
      this.identifier += digit;
      this._cdr.markForCheck();
    }
  }

  deleteDigit() {
    if (this.identifier.length > 0) {
      this.identifier = this.identifier.slice(0, -1);
      this._cdr.markForCheck();
    }
  }

  clearDigit() {
    this.identifier = '';
    this._cdr.markForCheck();
  }

  goToAdminLink() {
    const callbackUrl = encodeURIComponent(window.location.origin + '/kiosk');
    this._router.navigateByUrl(`/kiosk-devices/link?callbackUrl=${callbackUrl}`);
  }

  buildRequest(): AttendanceRequest {
    return {
      employeeIdentifier: this.identifier,
      workplaceId: this._workplaceId,
      photoUrl: 'kiosk-photo.jpg',
      source: 0,
      deviceToken: this._token
    };
  }

  checkIn() {
    if (this.isLocked()) return;
    if (!this.identifier.trim()) {
      this._messageService.warning('Ingresa tu DNI o Código');
      return;
    }

    this.isLoading.set(true);
    const req = this.buildRequest();

    this._kioskService.checkIn(req).subscribe({
      next: () => {
        setTimeout(() => {
          this.isLoading.set(false);
          this.identifier = '';
          this._messageService.success('¡Entrada registrada correctamente!');
          this._cdr.markForCheck();
        });
      },
      error: (err) => {
        setTimeout(() => {
          this.isLoading.set(false);
          if (err.status === 401) {
            this.clearDeviceStorage();
            this.verifyDeviceStatus();
            this._messageService.error('Dispositivo no autorizado o revocado.');
          } else {
            this._messageService.error(parseApiErrorMessage(err));
          }
          this._cdr.markForCheck();
        });
      }
    });
  }

  startBreak() {
    if (this.isLocked()) return;
    if (!this.identifier.trim()) {
      this._messageService.warning('Ingresa tu DNI o Código');
      return;
    }

    this.isLoading.set(true);
    const req = this.buildRequest();

    this._kioskService.startBreak(req).subscribe({
      next: () => {
        setTimeout(() => {
          this.isLoading.set(false);
          this.identifier = '';
          this._messageService.success('¡Inicio de refrigerio registrado correctamente!');
          this._cdr.markForCheck();
        });
      },
      error: (err) => {
        setTimeout(() => {
          this.isLoading.set(false);
          if (err.status === 401) {
            this.clearDeviceStorage();
            this.verifyDeviceStatus();
            this._messageService.error('Dispositivo no autorizado o revocado.');
          } else {
            this._messageService.error(parseApiErrorMessage(err));
          }
          this._cdr.markForCheck();
        });
      }
    });
  }

  endBreak() {
    if (this.isLocked()) return;
    if (!this.identifier.trim()) {
      this._messageService.warning('Ingresa tu DNI o Código');
      return;
    }

    this.isLoading.set(true);
    const req = this.buildRequest();

    this._kioskService.endBreak(req).subscribe({
      next: () => {
        setTimeout(() => {
          this.isLoading.set(false);
          this.identifier = '';
          this._messageService.success('¡Fin de refrigerio registrado correctamente!');
          this._cdr.markForCheck();
        });
      },
      error: (err) => {
        setTimeout(() => {
          this.isLoading.set(false);
          if (err.status === 401) {
            this.clearDeviceStorage();
            this.verifyDeviceStatus();
            this._messageService.error('Dispositivo no autorizado o revocado.');
          } else {
            this._messageService.error(parseApiErrorMessage(err));
          }
          this._cdr.markForCheck();
        });
      }
    });
  }

  checkOut() {
    if (this.isLocked()) return;
    if (!this.identifier.trim()) {
      this._messageService.warning('Ingresa tu DNI o Código');
      return;
    }

    this.isLoading.set(true);
    const req = this.buildRequest();

    this._kioskService.checkOut(req).subscribe({
      next: () => {
        setTimeout(() => {
          this.isLoading.set(false);
          this.identifier = '';
          this._messageService.success('¡Salida registrada correctamente!');
          this._cdr.markForCheck();
        });
      },
      error: (err) => {
        setTimeout(() => {
          this.isLoading.set(false);
          if (err.status === 401) {
            this.clearDeviceStorage();
            this.verifyDeviceStatus();
            this._messageService.error('Dispositivo no autorizado o revocado.');
          } else {
            this._messageService.error(parseApiErrorMessage(err));
          }
          this._cdr.markForCheck();
        });
      }
    });
  }
}
