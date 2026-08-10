import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { KioskDevicesService } from '../../services/kiosk-devices.service';
import { WorkplaceService, WorkplaceResponse } from '../../../workplace/services/workplace.service';
import { parseApiErrorMessage } from '../../../../shared/utils/api-error.util';

@Component({
  selector: 'app-device-link',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzSelectModule,
    NzCardModule,
    NzIconModule,
    NzBreadCrumbModule,
    NzDividerModule,
    NzModalModule,
    NzRadioModule
  ],
  templateUrl: './device-link.html'
})
export class DeviceLink implements OnInit {
  private _fb = inject(FormBuilder);
  private _kioskDevicesService = inject(KioskDevicesService);
  private _workplaceService = inject(WorkplaceService);
  private _messageService = inject(NzMessageService);
  private _modalService = inject(NzModalService);
  private _router = inject(Router);
  private _route = inject(ActivatedRoute);

  pairingMethod = 'pin'; // 'pin' | 'link'

  form = this._fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    workplaceId: ['', Validators.required],
    pairingCode: ['']
  });

  workplaces = signal<WorkplaceResponse[]>([]);
  isLoadingWorkplaces = signal(true);
  isSubmitting = signal(false);

  private _callbackUrl: string | null = null;

  ngOnInit() {
    this.loadWorkplaces();
    this._route.queryParams.subscribe(params => {
      if (params['callbackUrl']) {
        this._callbackUrl = params['callbackUrl'];
        this.pairingMethod = 'link';
      }
    });
  }

  loadWorkplaces() {
    this.isLoadingWorkplaces.set(true);
    this._workplaceService.getAll().subscribe({
      next: (data) => {
        this.workplaces.set(data);
        this.isLoadingWorkplaces.set(false);
      },
      error: () => {
        this._messageService.error('Error al cargar lugares de marcación');
        this.isLoadingWorkplaces.set(false);
      }
    });
  }

  submitForm() {
    if (this.pairingMethod === 'pin' && !this.form.value.pairingCode?.trim()) {
      this._messageService.warning('Por favor ingrese el Código PIN de 6 dígitos que muestra la pantalla remota.');
      return;
    }

    if (this.form.invalid) {
      Object.values(this.form.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
      return;
    }

    this.isSubmitting.set(true);
    const formValue = this.form.getRawValue();

    if (this.pairingMethod === 'pin' && formValue.pairingCode) {
      // Autorización mediante PIN de 6 dígitos
      this._kioskDevicesService.authorizePin({
        code: formValue.pairingCode.trim(),
        name: formValue.name,
        workplaceId: formValue.workplaceId
      }).subscribe({
        next: () => {
          this._messageService.success('¡Dispositivo remoto autorizado con éxito! La pantalla remota ingresará en breve.');
          this.isSubmitting.set(false);
          this._router.navigate(['/kiosk-devices']);
        },
        error: (err) => {
          this._messageService.error(parseApiErrorMessage(err));
          this.isSubmitting.set(false);
        }
      });
    } else {
      // Generación de Enlace / Token directo
      this._kioskDevicesService.authorizeDevice({
        name: formValue.name,
        workplaceId: formValue.workplaceId
      }).subscribe({
        next: (res) => {
          this._messageService.success('Dispositivo autorizado correctamente');
          this.isSubmitting.set(false);

          if (this._callbackUrl) {
            window.location.href = `${this._callbackUrl}?token=${encodeURIComponent(res.token)}&workplaceId=${formValue.workplaceId}`;
          } else {
            const generatedUrl = `${window.location.origin}/kiosk?token=${encodeURIComponent(res.token)}&workplaceId=${formValue.workplaceId}`;
            this._modalService.success({
              nzTitle: 'Dispositivo Vinculado',
              nzContent: `<p>Copia el siguiente enlace y ábrelo en el dispositivo que deseas utilizar como kiosko:</p><br><a href="${generatedUrl}" target="_blank" style="word-break: break-all;">${generatedUrl}</a>`,
              nzOnOk: () => this._router.navigate(['/kiosk-devices']),
              nzCancelText: null,
              nzMaskClosable: false
            });
          }
        },
        error: (err) => {
          this._messageService.error(parseApiErrorMessage(err));
          this.isSubmitting.set(false);
        }
      });
    }
  }
}
