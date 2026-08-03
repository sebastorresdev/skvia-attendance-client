import { Component, OnDestroy, OnInit, inject, ChangeDetectorRef, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription, interval } from 'rxjs';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { KioskService, AttendanceRequest } from '../services/kiosk.service';
import { environment } from '../../../../environments/environment';
import { parseApiErrorMessage } from '../../../shared/utils/api-error.util';
import { AuthService } from '../../../core/services/auth.service';

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
  private _auth = inject(AuthService);
  private _cdr = inject(ChangeDetectorRef);
  private _router = inject(Router);
  
  currentTime: Date = new Date();
  identifier: string = '';
  isLoading = signal(false);
  
  private timeSubscription?: Subscription;

  private _branchId = '';

  ngOnInit() {
    this.timeSubscription = interval(1000).subscribe(() => {
      this.currentTime = new Date();
      this._cdr.markForCheck();
    });

    const currentUserId = this._auth.userId();
    if (currentUserId) {
      this._kioskService.getKioskBranch(currentUserId).subscribe({
        next: (branchId) => {
          if (branchId) {
            this._branchId = branchId;
          } else {
            this._messageService.warning('Advertencia: Tu usuario no tiene ninguna sucursal asignada.', { nzDuration: 0 });
          }
        },
        error: () => {
          this._messageService.error('Error al intentar cargar la sucursal del kiosco.');
        }
      });
    } else {
      this._messageService.error('Error: No se encontró un usuario autenticado para el kiosco.');
    }
  }

  ngOnDestroy() {
    if (this.timeSubscription) {
      this.timeSubscription.unsubscribe();
    }
  }

  goBack() {
    this._router.navigate(['/']);
  }

  checkIn() {
    if (!this._branchId) {
      this._messageService.error('El kiosco no tiene una sucursal asignada.');
      return;
    }

    if (!this.identifier.trim()) {
      this._messageService.warning('Ingresa tu DNI o Código');
      return;
    }

    this.isLoading.set(true);
    const req: AttendanceRequest = {
      employeeIdentifier: this.identifier,
      branchId: this._branchId,
      photoUrl: 'kiosk-photo.jpg' // Simulado MVP
    };

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
          this._messageService.error(parseApiErrorMessage(err));
          this._cdr.markForCheck();
        });
      }
    });
  }

  checkOut() {
    if (!this._branchId) {
      this._messageService.error('El kiosco no tiene una sucursal asignada.');
      return;
    }

    if (!this.identifier.trim()) {
      this._messageService.warning('Ingresa tu DNI o Código');
      return;
    }

    this.isLoading.set(true);
    const req: AttendanceRequest = {
      employeeIdentifier: this.identifier,
      branchId: this._branchId,
      photoUrl: 'kiosk-photo.jpg' // Simulado MVP
    };

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
          this._messageService.error(parseApiErrorMessage(err));
          this._cdr.markForCheck();
        });
      }
    });
  }
}
