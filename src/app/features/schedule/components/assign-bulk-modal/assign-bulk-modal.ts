import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { ScheduleService } from '../../services/schedule.service';
import { ScheduleResponse } from '../../models/schedule';
import { parseApiErrorMessage } from '../../../../shared/utils/api-error.util';

@Component({
  selector: 'app-assign-bulk-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzFormModule,
    NzSelectModule,
    NzDatePickerModule,
    NzCheckboxModule,
    NzButtonModule,
    NzAlertModule
  ],
  templateUrl: './assign-bulk-modal.html'
})
export class AssignBulkModal implements OnInit {
  private modalRef = inject(NzModalRef);
  private fb = inject(FormBuilder);
  private scheduleService = inject(ScheduleService);
  private message = inject(NzMessageService);
  readonly data = inject<{ employeeIds: string[]; employeeNames?: string[] }>(NZ_MODAL_DATA);

  form!: FormGroup;
  schedules = signal<ScheduleResponse[]>([]);
  isSubmitting = signal(false);
  isIndefinite = signal(true);

  ngOnInit(): void {
    this.form = this.fb.group({
      scheduleTemplateId: [null, [Validators.required]],
      effectiveFrom: [new Date(), [Validators.required]],
      isIndefinite: [true],
      effectiveTo: [null]
    });

    this.loadSchedules();

    this.form.get('isIndefinite')?.valueChanges.subscribe((indefinite: boolean) => {
      this.isIndefinite.set(indefinite);
      const toControl = this.form.get('effectiveTo');
      if (indefinite) {
        toControl?.setValue(null);
        toControl?.clearValidators();
      } else {
        toControl?.setValidators([Validators.required]);
      }
      toControl?.updateValueAndValidity();
    });
  }

  loadSchedules(): void {
    this.scheduleService.getSchedules().subscribe({
      next: (list) => this.schedules.set(list),
      error: (err) => this.message.error('No se pudieron cargar las plantillas de horario')
    });
  }

  submit(): void {
    if (this.form.invalid) {
      Object.values(this.form.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
      return;
    }

    const val = this.form.value;
    const effectiveFromStr = this.formatDate(val.effectiveFrom);
    const effectiveToStr = val.isIndefinite || !val.effectiveTo ? null : this.formatDate(val.effectiveTo);

    this.isSubmitting.set(true);

    this.scheduleService.assignBulk({
      scheduleTemplateId: val.scheduleTemplateId,
      employeeIds: this.data.employeeIds,
      effectiveFrom: effectiveFromStr,
      effectiveTo: effectiveToStr
    }).subscribe({
      next: () => {
        this.message.success('Horario base asignado correctamente');
        this.modalRef.close(true);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.message.error(parseApiErrorMessage(err));
      }
    });
  }

  cancel(): void {
    this.modalRef.close(false);
  }

  private formatDate(d: Date): string {
    const dateObj = new Date(d);
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
