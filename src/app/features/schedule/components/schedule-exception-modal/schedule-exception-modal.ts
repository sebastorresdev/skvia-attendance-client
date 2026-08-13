import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTimePickerModule } from 'ng-zorro-antd/time-picker';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { ScheduleService } from '../../services/schedule.service';
import { ResolvedScheduleDayDto, ScheduleDayType, ScheduleResponse } from '../../models/schedule';
import { parseApiErrorMessage } from '../../../../shared/utils/api-error.util';

@Component({
  selector: 'app-schedule-exception-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzFormModule,
    NzSelectModule,
    NzTimePickerModule,
    NzInputModule,
    NzButtonModule,
    NzAlertModule,
    NzTagModule
  ],
  templateUrl: './schedule-exception-modal.html'
})
export class ScheduleExceptionModal implements OnInit {
  private modalRef = inject(NzModalRef);
  private fb = inject(FormBuilder);
  private scheduleService = inject(ScheduleService);
  private message = inject(NzMessageService);
  readonly data = inject<{ day: ResolvedScheduleDayDto; employeeName?: string }>(NZ_MODAL_DATA);

  form!: FormGroup;
  schedules = signal<ScheduleResponse[]>([]);
  isSubmitting = signal(false);
  isDeleting = signal(false);

  ScheduleDayType = ScheduleDayType;

  ngOnInit(): void {
    const day = this.data.day;

    this.form = this.fb.group({
      dayType: [day.dayType ?? ScheduleDayType.WorkDay, [Validators.required]],
      customScheduleId: [day.scheduleId || null],
      startTime: [day.startTime ? this.parseTimeToDate(day.startTime) : null],
      endTime: [day.endTime ? this.parseTimeToDate(day.endTime) : null],
      reason: [day.exceptionReason || '']
    });

    this.loadSchedules();
  }

  loadSchedules(): void {
    this.scheduleService.getSchedules().subscribe({
      next: (list) => this.schedules.set(list),
      error: (err) => console.error(err)
    });
  }

  onScheduleSelect(scheduleId: string | null): void {
    if (!scheduleId) return;
    const sched = this.schedules().find(s => s.id === scheduleId);
    if (sched) {
      this.form.patchValue({
        startTime: this.parseTimeToDate(sched.defaultStartTime),
        endTime: this.parseTimeToDate(sched.defaultEndTime)
      });
    }
  }

  submit(): void {
    if (this.form.invalid) return;

    const val = this.form.value;
    const day = this.data.day;

    const isWorkDayType = val.dayType === ScheduleDayType.WorkDay || val.dayType === ScheduleDayType.MakeUpDay;

    const customScheduleId = isWorkDayType ? val.customScheduleId : null;
    const isDayOff = !isWorkDayType || val.dayType === ScheduleDayType.DayOff;
    const startTimeStr = isWorkDayType && val.startTime ? this.formatTime(val.startTime) : null;
    const endTimeStr = isWorkDayType && val.endTime ? this.formatTime(val.endTime) : null;

    this.isSubmitting.set(true);

    this.scheduleService.createException({
      employeeId: day.employeeId,
      date: day.date,
      dayType: val.dayType,
      customScheduleId: customScheduleId,
      isDayOff: isDayOff,
      startTime: startTimeStr,
      endTime: endTimeStr,
      reason: val.reason
    }).subscribe({
      next: () => {
        this.message.success('Excepción guardada correctamente');
        this.modalRef.close(true);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.message.error(parseApiErrorMessage(err));
      }
    });
  }

  deleteException(): void {
    if (!this.data.day.exceptionId) return;

    this.isDeleting.set(true);
    this.scheduleService.deleteException(this.data.day.exceptionId).subscribe({
      next: () => {
        this.message.success('Excepción eliminada (Horario restablecido a plantilla base)');
        this.modalRef.close(true);
      },
      error: (err) => {
        this.isDeleting.set(false);
        this.message.error(parseApiErrorMessage(err));
      }
    });
  }

  cancel(): void {
    this.modalRef.close(false);
  }

  private parseTimeToDate(timeStr: string): Date {
    const d = new Date();
    const [h, m] = timeStr.split(':').map(Number);
    d.setHours(h, m, 0, 0);
    return d;
  }

  private formatTime(d: Date): string {
    const dateObj = new Date(d);
    const h = String(dateObj.getHours()).padStart(2, '0');
    const m = String(dateObj.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  }
}
