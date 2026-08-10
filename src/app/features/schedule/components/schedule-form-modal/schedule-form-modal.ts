import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzTimePickerModule } from 'ng-zorro-antd/time-picker';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzMessageService } from 'ng-zorro-antd/message';
import { ScheduleService } from '../../services/schedule.service';
import { ScheduleResponse } from '../../models/schedule';
import { parseApiErrorMessage } from '../../../../shared/utils/api-error.util';

@Component({
  selector: 'app-schedule-form-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzTimePickerModule,
    NzCheckboxModule,
    NzSelectModule
  ],
  templateUrl: './schedule-form-modal.html',
})
export class ScheduleFormModal implements OnInit {
  private _fb = inject(FormBuilder);
  private _scheduleService = inject(ScheduleService);
  private _modalRef = inject(NzModalRef);
  private _messageService = inject(NzMessageService);
  
  readonly nzModalData: { schedule?: ScheduleResponse } = inject(NZ_MODAL_DATA);

  scheduleForm: FormGroup;
  isEdit = false;
  isLoading = signal(false);

  timeZones = [
    { value: 'America/Lima', label: 'Lima, Perú (GMT-5)' },
    { value: 'America/Bogota', label: 'Bogotá, Colombia (GMT-5)' },
    { value: 'America/Santiago', label: 'Santiago, Chile (GMT-4)' },
    { value: 'America/Argentina/Buenos_Aires', label: 'Buenos Aires, Argentina (GMT-3)' },
    { value: 'America/Mexico_City', label: 'Ciudad de México, México (GMT-6)' }
  ];

  constructor() {
    this.scheduleForm = this._fb.group({
      code: ['', [Validators.required]],
      description: ['', [Validators.required]],
      timeZoneId: ['America/Lima', [Validators.required]],
      defaultStartTime: [null, [Validators.required]],
      defaultEndTime: [null, [Validators.required]],
      hasBreak: [false],
      breakStartTime: [null],
      breakEndTime: [null]
    });

    this.scheduleForm.get('hasBreak')?.valueChanges.subscribe(hasBreak => {
      const bStart = this.scheduleForm.get('breakStartTime');
      const bEnd = this.scheduleForm.get('breakEndTime');
      if (hasBreak) {
        bStart?.setValidators([Validators.required]);
        bEnd?.setValidators([Validators.required]);
      } else {
        bStart?.clearValidators();
        bEnd?.clearValidators();
        bStart?.setValue(null);
        bEnd?.setValue(null);
      }
      bStart?.updateValueAndValidity();
      bEnd?.updateValueAndValidity();
    });
  }

  ngOnInit(): void {
    if (this.nzModalData?.schedule) {
      this.isEdit = true;
      const { code, description, timeZoneId, defaultStartTime, defaultEndTime, hasBreak, breakStartTime, breakEndTime } = this.nzModalData.schedule;
      
      this.scheduleForm.patchValue({
        code,
        description,
        timeZoneId,
        defaultStartTime: defaultStartTime ? defaultStartTime.substring(0, 5) : null,
        defaultEndTime: defaultEndTime ? defaultEndTime.substring(0, 5) : null,
        hasBreak,
        breakStartTime: breakStartTime ? breakStartTime.substring(0, 5) : null,
        breakEndTime: breakEndTime ? breakEndTime.substring(0, 5) : null
      });
    }
  }

  submitForm(): void {
    if (this.scheduleForm.valid) {
      this.isLoading.set(true);
      
      const formValue = this.scheduleForm.value;
      
      const formatTime = (timeString: string | null) => {
        if (!timeString) return null;
        return timeString.length === 5 ? `${timeString}:00` : timeString;
      };

      const request = {
        code: formValue.code,
        description: formValue.description,
        timeZoneId: formValue.timeZoneId,
        defaultStartTime: formatTime(formValue.defaultStartTime)!,
        defaultEndTime: formatTime(formValue.defaultEndTime)!,
        hasBreak: formValue.hasBreak,
        breakStartTime: formatTime(formValue.breakStartTime),
        breakEndTime: formatTime(formValue.breakEndTime)
      };

      if (this.isEdit && this.nzModalData.schedule) {
        this._scheduleService.update(this.nzModalData.schedule.id, request).subscribe({
          next: () => {
            this._messageService.success('Turno actualizado correctamente');
            this.isLoading.set(false);
            this._modalRef.close(true);
          },
          error: (err) => {
            const msg = parseApiErrorMessage(err) || 'Error al actualizar el turno';
            this._messageService.error(msg);
            setTimeout(() => this.isLoading.set(false));
          }
        });
      } else {
        this._scheduleService.create(request).subscribe({
          next: () => {
            this._messageService.success('Turno creado correctamente');
            setTimeout(() => this.isLoading.set(false));
            this._modalRef.close(true);
          },
          error: (err) => {
            const msg = parseApiErrorMessage(err) || 'Error al crear el turno';
            this._messageService.error(msg);
            setTimeout(() => this.isLoading.set(false));
          }
        });
      }
    } else {
      Object.values(this.scheduleForm.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
    }
  }

  cancel(): void {
    this._modalRef.close(false);
  }
}
