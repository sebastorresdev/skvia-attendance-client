import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzTimePickerModule } from 'ng-zorro-antd/time-picker';
import { NzMessageService } from 'ng-zorro-antd/message';
import { ScheduleService } from '../../services/schedule.service';
import { ScheduleResponse } from '../../models/schedule';

@Component({
  selector: 'app-schedule-form-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzTimePickerModule
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
  isLoading = false;

  constructor() {
    this.scheduleForm = this._fb.group({
      name: ['', [Validators.required]],
      defaultStartTime: [null, [Validators.required]],
      defaultEndTime: [null, [Validators.required]],
    });
  }

  ngOnInit(): void {
    if (this.nzModalData?.schedule) {
      this.isEdit = true;
      const { name, defaultStartTime, defaultEndTime } = this.nzModalData.schedule;
      
      // Parse "HH:mm:ss" into Date objects for the TimePicker
      const startDate = new Date();
      const [startHour, startMin] = defaultStartTime.split(':');
      startDate.setHours(+startHour, +startMin, 0);

      const endDate = new Date();
      const [endHour, endMin] = defaultEndTime.split(':');
      endDate.setHours(+endHour, +endMin, 0);

      this.scheduleForm.patchValue({
        name,
        defaultStartTime: startDate,
        defaultEndTime: endDate
      });
    }
  }

  submitForm(): void {
    if (this.scheduleForm.valid) {
      this.isLoading = true;
      
      const formValue = this.scheduleForm.value;
      
      // Format Date objects back to "HH:mm:ss"
      const formatTime = (date: Date) => {
        const h = date.getHours().toString().padStart(2, '0');
        const m = date.getMinutes().toString().padStart(2, '0');
        return `${h}:${m}:00`;
      };

      const request = {
        name: formValue.name,
        defaultStartTime: formatTime(formValue.defaultStartTime),
        defaultEndTime: formatTime(formValue.defaultEndTime)
      };

      if (this.isEdit && this.nzModalData.schedule) {
        this._scheduleService.update(this.nzModalData.schedule.id, request).subscribe({
          next: () => {
            this._messageService.success('Turno actualizado correctamente');
            this.isLoading = false;
            this._modalRef.close(true);
          },
          error: () => {
            this._messageService.error('Error al actualizar el turno');
            this.isLoading = false;
          }
        });
      } else {
        this._scheduleService.create(request).subscribe({
          next: () => {
            this._messageService.success('Turno creado correctamente');
            this.isLoading = false;
            this._modalRef.close(true);
          },
          error: () => {
            this._messageService.error('Error al crear el turno');
            this.isLoading = false;
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
