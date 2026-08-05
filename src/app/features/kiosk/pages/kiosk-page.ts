import { Component, OnDestroy, OnInit, inject, ChangeDetectorRef, signal } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription, interval } from 'rxjs';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { KioskService, AttendanceRequest } from '../services/kiosk.service';
import { parseApiErrorMessage } from '../../../shared/utils/api-error.util';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-kiosk-page',
  standalone: true,
  imports: [CommonModule, FormsModule, NzInputModule, NzButtonModule, NzIconModule],
  providers: [DatePipe],
  templateUrl: './kiosk-page.html',
  styles: [`
    :host {
      display: block;
      height: 100vh;
      background-color: #f3f4f6;
    }
    :host-context(.dark) {
      background-color: #141414;
    }
  `]
})
export class KioskPage implements OnInit, OnDestroy {
  private _kioskService = inject(KioskService);
  private _messageService = inject(NzMessageService);
  private _cdr = inject(ChangeDetectorRef);
  private _router = inject(Router);
  private _route = inject(ActivatedRoute);
  
  currentTime: Date = new Date();
  identifier: string = '';
  isLoading = signal(false);
  isLocked = signal(true);
  
  private timeSubscription?: Subscription;

  private _branchId = '';
  private _token = '';

  ngOnInit() {
    this.timeSubscription = interval(1000).subscribe(() => {
      this.currentTime = new Date();
      this._cdr.markForCheck();
    });

    // Check if URL has token and branchId (Redirect from Admin)
    this._route.queryParams.subscribe(params => {
      const urlToken = params['token'];
      const urlBranchId = params['branchId'];

      if (urlToken && urlBranchId) {
        localStorage.setItem('kiosk_token', urlToken);
        localStorage.setItem('kiosk_branch_id', urlBranchId);
        
        // Remove query params from URL without reloading
        this._router.navigate([], {
          relativeTo: this._route,
          queryParams: { token: null, branchId: null },
          queryParamsHandling: 'merge'
        });
      }

      this.verifyDeviceStatus();
    });
  }

  verifyDeviceStatus() {
    const token = localStorage.getItem('kiosk_token');
    const branchId = localStorage.getItem('kiosk_branch_id');

    if (token && branchId) {
      this._token = token;
      this._branchId = branchId;
      this.isLocked.set(false);
    } else {
      this.isLocked.set(true);
    }
    this._cdr.markForCheck();
  }

  ngOnDestroy() {
    if (this.timeSubscription) {
      this.timeSubscription.unsubscribe();
    }
  }

  goBack() {
    this._router.navigate(['/']);
  }

  goToAdminLink() {
    // Generate a callback URL to return here
    const callbackUrl = encodeURIComponent(window.location.origin + '/kiosk');
    this._router.navigateByUrl(`/kiosk-devices/link?callbackUrl=${callbackUrl}`);
  }

  buildRequest(): AttendanceRequest {
    return {
      employeeIdentifier: this.identifier,
      branchId: this._branchId,
      photoUrl: 'kiosk-photo.jpg', // Simulado MVP
      source: 0, // Kiosk
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
          if (err.status === 401 || err.status === 403) {
            localStorage.removeItem('kiosk_token');
            localStorage.removeItem('kiosk_branch_id');
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
          if (err.status === 401 || err.status === 403) {
            localStorage.removeItem('kiosk_token');
            localStorage.removeItem('kiosk_branch_id');
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
