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
  isDisabled = signal(false);
  disabledDeviceName = signal('');

  // OTP 6-Digit Box state
  otpDigits = signal<string[]>(['', '', '', '', '', '']);
  isSubmittingCode = signal(false);

  private timeSubscription?: Subscription;
  private heartbeatSubscription?: Subscription;

  private _workplaceId = '';
  private _token = '';

  get pairingInputCode(): string {
    return this.otpDigits().join('');
  }

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
          const status = res?.status ?? res?.Status;
          const workplaceId = res?.workplaceId ?? res?.WorkplaceId;

          if (isValid) {
            this._token = token;
            this._workplaceId = workplaceId || '';
            this.isDisabled.set(false);
            this.isLocked.set(false);
            this.isVerifying.set(false);
            this.startHeartbeatPoll();
          } else if (status === 2) {
            // Revoked / Inactivo State: Keep token, show disabled screen!
            this._token = token;
            this.disabledDeviceName.set(res?.name || 'Este Kiosko');
            this.isDisabled.set(true);
            this.isLocked.set(true);
            this.isVerifying.set(false);
            this.startHeartbeatPoll();
          } else {
            // Unlinked / Pending State
            this.clearDeviceStorage();
            this.showPairingScreen();
          }
          this._cdr.markForCheck();
        },
        error: () => {
          this.clearDeviceStorage();
          this.showPairingScreen();
          this._cdr.markForCheck();
        }
      });
    } else {
      this.showPairingScreen();
    }
  }

  startHeartbeatPoll() {
    this.stopHeartbeatPoll();
    this.heartbeatSubscription = interval(4000).subscribe(() => {
      const token = localStorage.getItem('kiosk_token');
      if (token) {
        this._kioskDevicesService.verifyToken(token).subscribe({
          next: (res: any) => {
            const isValid = res?.isValid ?? res?.IsValid;
            const status = res?.status ?? res?.Status;
            const workplaceId = res?.workplaceId ?? res?.WorkplaceId;

            if (isValid) {
              if (this.isLocked() || this.isDisabled()) {
                this._token = token;
                this._workplaceId = workplaceId || '';
                this.isDisabled.set(false);
                this.isLocked.set(false);
                this._messageService.success('¡Dispositivo reactivado y listo para marcar!');
                this._cdr.markForCheck();
              }
            } else if (status === 2) {
              if (!this.isDisabled()) {
                this.disabledDeviceName.set(res?.name || 'Este Kiosko');
                this.isDisabled.set(true);
                this.isLocked.set(true);
                this._messageService.warning('El dispositivo ha sido inhabilitado por el Administrador.');
                this._cdr.markForCheck();
              }
            } else {
              this.stopHeartbeatPoll();
              this.clearDeviceStorage();
              this.showPairingScreen();
              this._messageService.warning('El dispositivo ha sido desvinculado por el Administrador.');
              this._cdr.markForCheck();
            }
          },
          error: () => {
            this.stopHeartbeatPoll();
            this.clearDeviceStorage();
            this.showPairingScreen();
          }
        });
      }
    });
  }

  stopHeartbeatPoll() {
    if (this.heartbeatSubscription) {
      this.heartbeatSubscription.unsubscribe();
      this.heartbeatSubscription = undefined;
    }
  }

  clearDeviceStorage() {
    localStorage.removeItem('kiosk_token');
    localStorage.removeItem('kiosk_workplace_id');
    localStorage.removeItem('kiosk_branch_id');
    this._token = '';
    this._workplaceId = '';
  }

  showPairingScreen() {
    this.stopHeartbeatPoll();
    this.isDisabled.set(false);
    this.isLocked.set(true);
    this.isVerifying.set(false);
    this.otpDigits.set(['', '', '', '', '', '']);
    this._cdr.markForCheck();
  }

  onOtpInput(index: number, event: Event) {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, '');
    if (value.length > 1) {
      value = value.slice(-1);
    }
    const current = [...this.otpDigits()];
    current[index] = value;
    this.otpDigits.set(current);

    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`) as HTMLInputElement;
      if (nextInput) {
        nextInput.focus();
        nextInput.select();
      }
    }
    this._cdr.markForCheck();
  }

  onOtpKeyDown(index: number, event: KeyboardEvent) {
    if (event.key === 'Backspace') {
      if (!this.otpDigits()[index] && index > 0) {
        const prevInput = document.getElementById(`otp-input-${index - 1}`) as HTMLInputElement;
        if (prevInput) {
          prevInput.focus();
          prevInput.select();
        }
      }
    } else if (event.key === 'Enter') {
      this.submitPairingCode();
    }
  }

  onOtpPaste(event: ClipboardEvent) {
    event.preventDefault();
    const pastedData = event.clipboardData?.getData('text')?.trim() || '';
    if (pastedData) {
      const digits = pastedData.replace(/\D/g, '').slice(0, 6).split('');
      const newOtp = ['', '', '', '', '', ''];
      digits.forEach((d, i) => {
        if (i < 6) newOtp[i] = d;
      });
      this.otpDigits.set(newOtp);
      const focusIndex = Math.min(digits.length, 5);
      const targetInput = document.getElementById(`otp-input-${focusIndex}`) as HTMLInputElement;
      if (targetInput) targetInput.focus();
      this._cdr.markForCheck();
    }
  }

  appendPairingDigit(digit: string) {
    const current = [...this.otpDigits()];
    const emptyIndex = current.findIndex(d => d === '');
    if (emptyIndex !== -1) {
      current[emptyIndex] = digit;
      this.otpDigits.set(current);
      if (emptyIndex < 5) {
        const nextInput = document.getElementById(`otp-input-${emptyIndex + 1}`) as HTMLInputElement;
        if (nextInput) nextInput.focus();
      }
      this._cdr.markForCheck();
    }
  }

  deletePairingDigit() {
    const current = [...this.otpDigits()];
    let lastIndex = -1;
    for (let i = 5; i >= 0; i--) {
      if (current[i] !== '') {
        lastIndex = i;
        break;
      }
    }
    if (lastIndex !== -1) {
      current[lastIndex] = '';
      this.otpDigits.set(current);
      const targetInput = document.getElementById(`otp-input-${lastIndex}`) as HTMLInputElement;
      if (targetInput) targetInput.focus();
      this._cdr.markForCheck();
    }
  }

  clearPairingDigit() {
    this.otpDigits.set(['', '', '', '', '', '']);
    const firstInput = document.getElementById('otp-input-0') as HTMLInputElement;
    if (firstInput) firstInput.focus();
    this._cdr.markForCheck();
  }

  submitPairingCode() {
    const code = this.pairingInputCode.trim();
    if (!code || code.length < 6) {
      this._messageService.warning('Por favor ingrese el código de vinculación completo de 6 dígitos.');
      return;
    }

    this.isSubmittingCode.set(true);
    this._kioskDevicesService.claimPairingCode(code).subscribe({
      next: (res) => {
        this.isSubmittingCode.set(false);
        localStorage.setItem('kiosk_token', res.token);
        localStorage.setItem('kiosk_workplace_id', res.workplaceId);
        this._token = res.token;
        this._workplaceId = res.workplaceId;
        this.isDisabled.set(false);
        this.isLocked.set(false);
        this.isVerifying.set(false);
        this.clearPairingDigit();
        this.startHeartbeatPoll();
        this._messageService.success(`¡Dispositivo "${res.name}" vinculado con éxito!`);
        this._cdr.markForCheck();
      },
      error: (err) => {
        this.isSubmittingCode.set(false);
        this._messageService.error(parseApiErrorMessage(err));
      }
    });
  }

  ngOnDestroy() {
    if (this.timeSubscription) {
      this.timeSubscription.unsubscribe();
    }
    this.stopHeartbeatPoll();
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
    if (this.isLocked() || this.isDisabled()) return;
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
    if (this.isLocked() || this.isDisabled()) return;
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
    if (this.isLocked() || this.isDisabled()) return;
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
    if (this.isLocked() || this.isDisabled()) return;
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
