import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
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
import { KioskDevicesService } from '../../services/kiosk-devices.service';
import { BranchService } from '../../../branch/services/branch-service';
import { BranchResponse } from '../../../branch/models/branch-response';

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
    NzDividerModule,
    NzModalModule
  ],
  templateUrl: './device-link.html'
})
export class DeviceLink implements OnInit {
  private _fb = inject(FormBuilder);
  private _kioskDevicesService = inject(KioskDevicesService);
  private _branchService = inject(BranchService);
  private _messageService = inject(NzMessageService);
  private _modalService = inject(NzModalService);
  private _router = inject(Router);
  private _route = inject(ActivatedRoute);

  form = this._fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    branchId: ['', Validators.required]
  });

  branches = signal<BranchResponse[]>([]);
  isLoadingBranches = signal(true);
  isSubmitting = signal(false);

  private _callbackUrl: string | null = null;

  ngOnInit() {
    this.loadBranches();
    this._route.queryParams.subscribe(params => {
      if (params['callbackUrl']) {
        this._callbackUrl = params['callbackUrl'];
      }
    });
  }

  loadBranches() {
    this.isLoadingBranches.set(true);
    this._branchService.getAll().subscribe({
      next: (data) => {
        this.branches.set(data);
        this.isLoadingBranches.set(false);
      },
      error: () => {
        this._messageService.error('Error al cargar sedes');
        this.isLoadingBranches.set(false);
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
      branchId: formValue.branchId
    }).subscribe({
      next: (res) => {
        this._messageService.success('Dispositivo autorizado correctamente');
        
        if (this._callbackUrl) {
          // Si vino desde el kiosko, redirige de vuelta enviando el token
          window.location.href = `${this._callbackUrl}?token=${encodeURIComponent(res.token)}&branchId=${formValue.branchId}`;
        } else {
          const generatedUrl = `${window.location.origin}/kiosk?token=${encodeURIComponent(res.token)}&branchId=${formValue.branchId}`;
          this._modalService.success({
            nzTitle: 'Dispositivo Vinculado',
            nzContent: `<p>Copia el siguiente enlace y ábrelo en el dispositivo que deseas utilizar como kiosko:</p><br><a href="${generatedUrl}" target="_blank" style="word-break: break-all;">${generatedUrl}</a>`,
            nzOnOk: () => this._router.navigate(['/kiosk-devices']),
            nzCancelText: null,
            nzMaskClosable: false
          });
        }
      },
      error: () => {
        this._messageService.error('Error al autorizar dispositivo');
        this.isSubmitting.set(false);
      }
    });
  }
}
