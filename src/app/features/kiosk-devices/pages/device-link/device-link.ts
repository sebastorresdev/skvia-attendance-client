import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { KioskDevicesService } from '../../services/kiosk-devices.service';
import { WorkplaceService, WorkplaceResponse } from '../../../workplace/services/workplace.service';
import { parseApiErrorMessage } from '../../../../shared/utils/api-error.util';

@Component({
  selector: 'app-device-link',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzSelectModule,
    NzCardModule,
    NzIconModule,
    NzBreadCrumbModule,
    NzDividerModule
  ],
  templateUrl: './device-link.html'
})
export class DeviceLink implements OnInit {
  private _fb = inject(FormBuilder);
  private _kioskDevicesService = inject(KioskDevicesService);
  private _workplaceService = inject(WorkplaceService);
  private _messageService = inject(NzMessageService);
  private _router = inject(Router);

  form = this._fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    workplaceId: ['', Validators.required]
  });

  workplaces = signal<WorkplaceResponse[]>([]);
  isLoadingWorkplaces = signal(true);
  isSubmitting = signal(false);

  ngOnInit() {
    this.loadWorkplaces();
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

    this._kioskDevicesService.authorizeDevice({
      name: formValue.name,
      workplaceId: formValue.workplaceId
    }).subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        this._messageService.success(`¡Dispositivo Kiosko "${res.name}" creado con éxito! Puedes generar su código desde la lista.`);
        this._router.navigate(['/kiosk-devices']);
      },
      error: (err) => {
        this._messageService.error(parseApiErrorMessage(err));
        this.isSubmitting.set(false);
      }
    });
  }
}
