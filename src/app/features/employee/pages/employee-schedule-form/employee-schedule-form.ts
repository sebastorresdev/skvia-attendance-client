import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, FormArray, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';

// NG-ZORRO
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzTimePickerModule } from 'ng-zorro-antd/time-picker';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzSegmentedModule } from 'ng-zorro-antd/segmented';
import { startOfWeek, endOfWeek, addDays, format, parseISO, isSameDay, addWeeks, startOfMonth, endOfMonth, addMonths, differenceInDays } from 'date-fns';

// PROYECTO
import { EmployeeService } from '../../services/employee-service';
import { BranchService } from '../../../branch/services/branch-service';
import { EmployeeResponse } from '../../models/employee-response';
import { BranchResponse } from '../../../branch/models/branch-response';
import { ScheduleResponse } from '../../../schedule/models/schedule';
import { ScheduleService } from '../../../schedule/services/schedule.service';
import { ScheduleDayType, AssignWeeklyScheduleRequest } from '../../models/employee-schedule';
import { parseApiErrorMessage } from '../../../../shared/utils/api-error.util';

@Component({
  selector: 'app-employee-schedule-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterLink,
    NzCardModule,
    NzFormModule,
    NzSelectModule,
    NzDatePickerModule,
    NzTimePickerModule,
    NzButtonModule,
    NzIconModule,
    NzSpinModule,
    NzBreadCrumbModule,
    NzSegmentedModule
  ],
  templateUrl: './employee-schedule-form.html',
  providers: [DatePipe]
})
export class EmployeeScheduleForm implements OnInit {
  private _fb = inject(FormBuilder);
  private _route = inject(ActivatedRoute);
  private _router = inject(Router);
  private _employeeService = inject(EmployeeService);
  private _branchService = inject(BranchService);
  private _scheduleService = inject(ScheduleService);
  private _messageService = inject(NzMessageService);

  employeeId!: string;
  currentEmployee: EmployeeResponse | null = null;
  branches: BranchResponse[] = [];
  schedules: ScheduleResponse[] = [];

  loadingData = signal(true);
  saving = signal(false);

  viewMode: 'week' | 'month' = 'week';
  viewModeOptions = [
    { label: 'Semanal', value: 'week', icon: 'bars' },
    { label: 'Mensual', value: 'month', icon: 'calendar' }
  ];

  selectedDate: Date = new Date();
  currentWeekStart = signal<Date>(startOfWeek(new Date(), { weekStartsOn: 1 }));
  currentWeekEnd = signal<Date>(endOfWeek(new Date(), { weekStartsOn: 1 }));

  currentMonthStart = signal<Date>(startOfMonth(new Date()));
  currentMonthEnd = signal<Date>(endOfMonth(new Date()));

  form: FormGroup = this._fb.group({
    days: this._fb.array([])
  });

  get daysFormArray() {
    return this.form.get('days') as FormArray;
  }

  ngOnInit(): void {
    this.employeeId = this._route.snapshot.paramMap.get('id')!;
    if (!this.employeeId) {
      this._router.navigate(['/employees']);
      return;
    }

    this.selectedDate = new Date();
    this.loadInitialData();
  }

  loadInitialData(): void {
    this.loadingData.set(true);

    forkJoin({
      employee: this._employeeService.getById(this.employeeId),
      branches: this._branchService.getAll(),
      schedules: this._scheduleService.getSchedules()
    }).subscribe({
      next: ({ employee, branches, schedules }) => {
        this.currentEmployee = employee;
        this.branches = branches;
        this.schedules = schedules;
        this.loadScheduleForCurrentPeriod();
      },
      error: () => {
        this._messageService.error('Error al cargar datos del empleado.');
        this._router.navigate(['/employees']);
      }
    });
  }

  onViewModeChange(value: any): void {
    this.viewMode = value;
    this.loadScheduleForCurrentPeriod();
  }

  loadScheduleForCurrentPeriod(): void {
    this.loadingData.set(true);
    
    let startStr: string;
    let endStr: string;

    if (this.viewMode === 'week') {
      startStr = format(this.currentWeekStart(), 'yyyy-MM-dd');
      endStr = format(this.currentWeekEnd(), 'yyyy-MM-dd');
    } else {
      startStr = format(this.currentMonthStart(), 'yyyy-MM-dd');
      endStr = format(this.currentMonthEnd(), 'yyyy-MM-dd');
    }

    this._employeeService.getSchedule(this.employeeId, startStr, endStr).subscribe({
      next: (schedules) => {
        this.buildFormForPeriod(schedules);
        this.loadingData.set(false);
      },
      error: () => {
        this._messageService.error('Error al cargar los horarios.');
        this.loadingData.set(false);
      }
    });
  }

  buildFormForPeriod(existingSchedules: any[]): void {
    this.daysFormArray.clear();

    const start = this.viewMode === 'week' ? this.currentWeekStart() : this.currentMonthStart();
    const end = this.viewMode === 'week' ? this.currentWeekEnd() : this.currentMonthEnd();
    
    // Calculate difference in days safely
    const diffDays = Math.abs(differenceInDays(end, start)) + 1;

    for (let i = 0; i < diffDays; i++) {
      const date = addDays(start, i);
      const dateStr = format(date, 'yyyy-MM-dd');
      
      const existing = existingSchedules.find(s => s.date.startsWith(dateStr));

      let startTimeDate: Date | null = null;
      let endTimeDate: Date | null = null;

      if (existing?.assignedStartTime) {
        // Parse HH:mm:ss to Date for nz-time-picker
        const [h, m, s] = existing.assignedStartTime.split(':');
        startTimeDate = new Date(date);
        startTimeDate.setHours(+h, +m, +s || 0);
      }

      if (existing?.assignedEndTime) {
        const [h, m, s] = existing.assignedEndTime.split(':');
        endTimeDate = new Date(date);
        endTimeDate.setHours(+h, +m, +s || 0);
      }

      let defaultBranchId = null;
      if (existing && existing.branchId) {
        defaultBranchId = existing.branchId.toLowerCase();
      } else if (this.currentEmployee?.mainBranchId) {
        defaultBranchId = this.currentEmployee.mainBranchId.toLowerCase();
      }

      const dayGroup = this._fb.group({
        date: [dateStr],
        dayType: [existing?.dayType ?? null],
        branchId: [defaultBranchId],
        baseScheduleId: [existing?.baseScheduleId ?? null],
        startTime: [startTimeDate],
        endTime: [endTimeDate],
        isSaved: [!!existing]
      });

      // Update validation based on dayType
      dayGroup.get('dayType')?.valueChanges.subscribe(type => {
        const branchCtrl = dayGroup.get('branchId');
        const startCtrl = dayGroup.get('startTime');
        const endCtrl = dayGroup.get('endTime');
        const baseCtrl = dayGroup.get('baseScheduleId');

        if (type === ScheduleDayType.WorkDay || type === ScheduleDayType.MakeUpDay) {
          branchCtrl?.setValidators(Validators.required);
          startCtrl?.setValidators(Validators.required);
          endCtrl?.setValidators(Validators.required);
          
          if (!branchCtrl?.value && this.currentEmployee?.mainBranchId) {
            branchCtrl?.setValue(this.currentEmployee.mainBranchId.toLowerCase(), { emitEvent: false });
          }
        } else {
          branchCtrl?.clearValidators();
          startCtrl?.clearValidators();
          endCtrl?.clearValidators();
          
          branchCtrl?.setValue(null, { emitEvent: false });
          startCtrl?.setValue(null, { emitEvent: false });
          endCtrl?.setValue(null, { emitEvent: false });
          baseCtrl?.setValue(null, { emitEvent: false });
        }
        branchCtrl?.updateValueAndValidity();
        startCtrl?.updateValueAndValidity();
        endCtrl?.updateValueAndValidity();
      });
      
      // Auto-fill times when base schedule is selected
      dayGroup.get('baseScheduleId')?.valueChanges.subscribe(scheduleId => {
        if (!scheduleId) return;
        const schedule = this.schedules.find(s => s.id === scheduleId);
        if (schedule) {
          const [h1, m1, s1] = schedule.defaultStartTime.split(':');
          const startDate = new Date(date);
          startDate.setHours(+h1, +m1, +s1 || 0);

          const [h2, m2, s2] = schedule.defaultEndTime.split(':');
          const endDate = new Date(date);
          endDate.setHours(+h2, +m2, +s2 || 0);
          
          dayGroup.patchValue({
            startTime: startDate,
            endTime: endDate
          });
        }
      });

      // Trigger validation setup once manually
      dayGroup.get('dayType')?.updateValueAndValidity();

      this.daysFormArray.push(dayGroup);
    }
  }

  onPeriodChange(date: Date): void {
    if (this.viewMode === 'week') {
      this.currentWeekStart.set(startOfWeek(date, { weekStartsOn: 1 }));
      this.currentWeekEnd.set(endOfWeek(date, { weekStartsOn: 1 }));
    } else {
      this.currentMonthStart.set(startOfMonth(date));
      this.currentMonthEnd.set(endOfMonth(date));
    }
    this.loadScheduleForCurrentPeriod();
  }

  changePeriod(offset: number): void {
    if (this.viewMode === 'week') {
      this.selectedDate = addWeeks(this.selectedDate, offset);
    } else {
      this.selectedDate = addMonths(this.selectedDate, offset);
    }
    this.onPeriodChange(this.selectedDate);
  }

  goToToday(): void {
    this.selectedDate = new Date();
    this.onPeriodChange(this.selectedDate);
  }

  onBaseScheduleChange(index: number, scheduleId: string | null): void {
    if (!scheduleId) return;
    
    const schedule = this.schedules.find(s => s.id.toLowerCase() === scheduleId.toLowerCase());
    if (schedule) {
      const group = this.daysFormArray.at(index) as FormGroup;
      const baseDate = parseISO(group.get('date')?.value);
      
      const startTime = new Date(baseDate);
      const [sh, sm, ss] = schedule.defaultStartTime.split(':');
      startTime.setHours(+sh, +sm, +ss || 0);

      const endTime = new Date(baseDate);
      const [eh, em, es] = schedule.defaultEndTime.split(':');
      endTime.setHours(+eh, +em, +es || 0);

      group.patchValue({
        startTime,
        endTime
      });
    }
  }

  isToday(dateStr: string): boolean {
    return isSameDay(parseISO(dateStr), new Date());
  }

  getDayName(dateStr: string): string {
    const date = parseISO(dateStr);
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    return days[date.getDay()];
  }

  saveSchedule(): void {
    if (this.form.invalid) {
      Object.values(this.daysFormArray.controls).forEach(group => {
        Object.values((group as FormGroup).controls).forEach(control => {
          if (control.invalid) {
            control.markAsDirty();
            control.updateValueAndValidity({ onlySelf: true });
          }
        });
      });
      this._messageService.error('Revisa los campos obligatorios.');
      return;
    }

    this.saving.set(true);

    let startStr: string;
    let endStr: string;
    if (this.viewMode === 'week') {
      startStr = format(this.currentWeekStart(), 'yyyy-MM-dd');
      endStr = format(this.currentWeekEnd(), 'yyyy-MM-dd');
    } else {
      startStr = format(this.currentMonthStart(), 'yyyy-MM-dd');
      endStr = format(this.currentMonthEnd(), 'yyyy-MM-dd');
    }

    const formValues = this.form.getRawValue().days;
    
    const request: AssignWeeklyScheduleRequest = {
      startDate: startStr,
      endDate: endStr,
      days: formValues.filter((val: any) => val.dayType !== null).map((val: any) => ({
        date: val.date,
        branchId: val.branchId || this.currentEmployee?.mainBranchId || '00000000-0000-0000-0000-000000000000',
        dayType: val.dayType,
        baseScheduleId: val.baseScheduleId,
        startTime: val.startTime ? format(val.startTime, 'HH:mm:ss') : null,
        endTime: val.endTime ? format(val.endTime, 'HH:mm:ss') : null
      }))
    };

    this._employeeService.assignWeeklySchedule(this.employeeId, request).subscribe({
      next: () => {
        this._messageService.success('Horario semanal guardado correctamente.');
        this.saving.set(false);
        this.loadScheduleForCurrentPeriod();
      },
      error: (err) => {
        const msg = parseApiErrorMessage(err);
        this._messageService.error(msg);
        this.saving.set(false);
      }
    });
  }
}
