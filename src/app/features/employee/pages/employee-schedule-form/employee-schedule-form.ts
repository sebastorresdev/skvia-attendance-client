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
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
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
    NzSegmentedModule,
    NzModalModule,
    NzCheckboxModule
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

  get availableSchedules(): ScheduleResponse[] {
    if (this.currentEmployee?.requireFourPointAttendance) {
      return this.schedules.filter(s => s.hasBreak);
    }
    return this.schedules;
  }

  loadingData = signal(true);
  saving = signal(false);

  viewMode: 'week' | 'month' = 'month';
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
        if (this.currentEmployee && !this.currentEmployee.isAttendanceTracked) {
           this._messageService.warning('Este empleado no tiene habilitado el control de asistencia. No se puede configurar horario.');
           this._router.navigate(['/employees']);
           return;
        }
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

  onViewModeChange(mode: 'week' | 'month'): void {
    this.viewMode = mode;
    this.loadScheduleForCurrentPeriod();
  }

  serverSchedulesCache: any[] = [];
  unsavedDraftsMap: Map<string, any> = new Map();

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
        this.serverSchedulesCache = schedules;
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
    
    const diffDays = Math.abs(differenceInDays(end, start)) + 1;

    for (let i = 0; i < diffDays; i++) {
      const date = addDays(start, i);
      const dateStr = format(date, 'yyyy-MM-dd');
      
      const draft = this.unsavedDraftsMap.get(dateStr);
      const existing = existingSchedules.find(s => s.date.startsWith(dateStr));

      let dayType = draft ? draft.dayType : (existing?.dayType ?? null);
      let baseScheduleId = draft ? draft.baseScheduleId : (existing?.baseScheduleId ?? null);

      let startTimeDate: Date | null = null;
      let endTimeDate: Date | null = null;

      if (draft) {
        startTimeDate = draft.startTime;
        endTimeDate = draft.endTime;
      } else {
        if (existing?.assignedStartTime) {
          const [h, m, s] = existing.assignedStartTime.split(':');
          startTimeDate = new Date(date);
          startTimeDate.setHours(+h, +m, +s || 0);
        }

        if (existing?.assignedEndTime) {
          const [h, m, s] = existing.assignedEndTime.split(':');
          endTimeDate = new Date(date);
          endTimeDate.setHours(+h, +m, +s || 0);
        }
      }

      const dayGroup = this._fb.group({
        date: [dateStr],
        dayType: [dayType],
        baseScheduleId: [baseScheduleId],
        startTime: [startTimeDate],
        endTime: [endTimeDate],
        isSaved: [!draft && !!existing]
      });

      // Track manual changes in memory
      dayGroup.valueChanges.subscribe(val => {
        if (val.date) {
          this.unsavedDraftsMap.set(val.date, val);
        }
      });

      dayGroup.get('dayType')?.valueChanges.subscribe(type => {
        const startCtrl = dayGroup.get('startTime');
        const endCtrl = dayGroup.get('endTime');
        const baseCtrl = dayGroup.get('baseScheduleId');

        if (type === ScheduleDayType.WorkDay || type === ScheduleDayType.MakeUpDay) {
          startCtrl?.setValidators(Validators.required);
          endCtrl?.setValidators(Validators.required);
        } else {
          startCtrl?.clearValidators();
          endCtrl?.clearValidators();
          
          startCtrl?.setValue(null, { emitEvent: false });
          endCtrl?.setValue(null, { emitEvent: false });
          baseCtrl?.setValue(null, { emitEvent: false });
        }
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
    this.selectedDate = date;
    if (this.viewMode === 'week') {
      this.currentWeekStart.set(startOfWeek(date, { weekStartsOn: 1 }));
      this.currentWeekEnd.set(endOfWeek(date, { weekStartsOn: 1 }));
    } else {
      this.currentMonthStart.set(startOfMonth(date));
      this.currentMonthEnd.set(endOfMonth(date));
    }
    this.loadScheduleForCurrentPeriod();
  }

  changePeriod(delta: number): void {
    if (this.viewMode === 'week') {
      this.selectedDate = addWeeks(this.selectedDate, delta);
      this.currentWeekStart.set(startOfWeek(this.selectedDate, { weekStartsOn: 1 }));
      this.currentWeekEnd.set(endOfWeek(this.selectedDate, { weekStartsOn: 1 }));
    } else {
      this.selectedDate = addMonths(this.selectedDate, delta);
      this.currentMonthStart.set(startOfMonth(this.selectedDate));
      this.currentMonthEnd.set(endOfMonth(this.selectedDate));
    }
    this.loadScheduleForCurrentPeriod();
  }

  goToToday(): void {
    this.selectedDate = new Date();
    if (this.viewMode === 'week') {
      this.currentWeekStart.set(startOfWeek(this.selectedDate, { weekStartsOn: 1 }));
      this.currentWeekEnd.set(endOfWeek(this.selectedDate, { weekStartsOn: 1 }));
    } else {
      this.currentMonthStart.set(startOfMonth(this.selectedDate));
      this.currentMonthEnd.set(endOfMonth(this.selectedDate));
    }
    this.loadScheduleForCurrentPeriod();
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

  isPastDate(dateStr: string): boolean {
    const date = parseISO(dateStr);
    const today = new Date();
    today.setHours(0,0,0,0);
    date.setHours(0,0,0,0);
    return date.getTime() < today.getTime();
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

    const allDaysMap = new Map<string, any>();

    // 1. Gather entries from unsavedDraftsMap
    this.unsavedDraftsMap.forEach((draft, dateStr) => {
      if (draft.dayType !== null) {
        allDaysMap.set(dateStr, draft);
      }
    });

    // 2. Override/Add with current form controls
    const formValues = this.form.getRawValue().days;
    formValues.forEach((val: any) => {
      if (val.dayType !== null && val.date) {
        allDaysMap.set(val.date, val);
      }
    });

    if (allDaysMap.size === 0) {
      // Si todo está vacío, en vez de error, enviamos un array vacío para limpiar el horario de esa vista
      const startDateStr = this.viewMode === 'week' ? format(this.currentWeekStart(), 'yyyy-MM-dd') : format(this.currentMonthStart(), 'yyyy-MM-dd');
      const endDateStr = this.viewMode === 'week' ? format(this.currentWeekEnd(), 'yyyy-MM-dd') : format(this.currentMonthEnd(), 'yyyy-MM-dd');
      
      const request: AssignWeeklyScheduleRequest = {
        startDate: startDateStr,
        endDate: endDateStr,
        days: []
      };

      this._employeeService.assignWeeklySchedule(this.employeeId, request).subscribe({
        next: () => {
          this._messageService.success('Se han limpiado los horarios de este periodo.');
          this.unsavedDraftsMap.clear();
          this.saving.set(false);
          this.loadScheduleForCurrentPeriod();
        },
        error: (err) => {
          const msg = parseApiErrorMessage(err);
          this._messageService.error(msg);
          this.saving.set(false);
        }
      });
      return;
    }

    const sortedDates = Array.from(allDaysMap.keys()).sort();
    const startDateStr = this.viewMode === 'week' ? format(this.currentWeekStart(), 'yyyy-MM-dd') : format(this.currentMonthStart(), 'yyyy-MM-dd');
    const endDateStr = this.viewMode === 'week' ? format(this.currentWeekEnd(), 'yyyy-MM-dd') : format(this.currentMonthEnd(), 'yyyy-MM-dd');

    const daysPayload = Array.from(allDaysMap.values()).map((val: any) => {
      let startStr: string | null = null;
      let endStr: string | null = null;

      if (val.startTime) {
        if (typeof val.startTime === 'string') {
          startStr = val.startTime;
        } else if (val.startTime instanceof Date) {
          startStr = format(val.startTime, 'HH:mm:ss');
        }
      }

      if (val.endTime) {
        if (typeof val.endTime === 'string') {
          endStr = val.endTime;
        } else if (val.endTime instanceof Date) {
          endStr = format(val.endTime, 'HH:mm:ss');
        }
      }

      return {
        date: val.date,
        dayType: val.dayType,
        baseScheduleId: val.baseScheduleId || null,
        startTime: startStr,
        endTime: endStr
      };
    });

    const request: AssignWeeklyScheduleRequest = {
      startDate: startDateStr,
      endDate: endDateStr,
      days: daysPayload
    };

    this._employeeService.assignWeeklySchedule(this.employeeId, request).subscribe({
      next: () => {
        this._messageService.success('Horario guardado correctamente en la base de datos.');
        this.unsavedDraftsMap.clear();
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

  // --- MODAL DE ASIGNACIÓN RÁPIDA POR PATRÓN Y RANGO ---
  patternModalVisible = signal(false);
  patternForm!: FormGroup;

  get patternFormArray() {
    return this.patternForm?.get('patterns') as FormArray;
  }

  openPatternModal(): void {
    const today = new Date();
    const threeMonthsLater = addMonths(today, 3);

    this.patternForm = this._fb.group({
      dateRange: [[today, threeMonthsLater], [Validators.required]],
      patterns: this._fb.array(this.createDefaultPatternControls())
    });

    this.patternModalVisible.set(true);
  }

  closePatternModal(): void {
    this.patternModalVisible.set(false);
  }

  private createDefaultPatternControls(): FormGroup[] {
    const defaultDays = [0, 1, 2, 3, 4, 5, 6]; // Domingo a Sábado
    return defaultDays.map(d => {
      const isWorkDay = d >= 1 && d <= 5; // Lunes a Viernes default

      const group = this._fb.group({
        dayOfWeek: [d],
        isWorkDay: [isWorkDay],
        baseScheduleId: [null as string | null],
        startTime: [null as Date | null],
        endTime: [null as Date | null]
      });

      group.get('baseScheduleId')?.valueChanges.subscribe(schId => {
        if (!schId) return;
        const sch = this.schedules.find(s => s.id === schId);
        if (sch) {
          const [h1, m1, s1] = sch.defaultStartTime.split(':');
          const startD = new Date(0,0,0, +h1, +m1, +s1 || 0);
          const [h2, m2, s2] = sch.defaultEndTime.split(':');
          const endD = new Date(0,0,0, +h2, +m2, +s2 || 0);
          group.patchValue({
            startTime: startD,
            endTime: endD
          });
        }
      });

      return group;
    });
  }

  getPatternDayName(dayIndex: number): string {
    const names = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return names[dayIndex];
  }

  copyMondayToAll(): void {
    if (!this.patternFormArray || this.patternFormArray.length < 2) return;
    const mondayCtrl = this.patternFormArray.at(1); // Lunes es el índice 1
    if (!mondayCtrl) return;

    const { isWorkDay, baseScheduleId, startTime, endTime } = mondayCtrl.value;

    for (let i = 2; i <= 5; i++) { // Martes a Viernes (indices 2 a 5)
      this.patternFormArray.at(i).patchValue({
        isWorkDay,
        baseScheduleId,
        startTime,
        endTime
      });
    }
  }

  // --- MODAL DE EDICIÓN DE DÍA INDIVIDUAL ---
  dayEditModalVisible = signal(false);
  editingDayGroup: FormGroup | null = null;

  openDayEditModal(dayGroup: any): void {
    const group = dayGroup as FormGroup;
    if (this.isPastDate(group.get('date')?.value)) {
       this._messageService.warning('No se puede modificar un horario de una fecha pasada.');
       return;
    }
    this.editingDayGroup = group;
    this.dayEditModalVisible.set(true);
  }

  closeDayEditModal(): void {
    this.dayEditModalVisible.set(false);
    this.editingDayGroup = null;
  }


  getScheduleName(scheduleId: string | null): string {
    if (!scheduleId) return '';
    const sch = this.schedules.find(s => s.id === scheduleId);
    return sch ? sch.code : '';
  }

  applyPatternToRange(): void {
    if (!this.patternForm || this.patternForm.invalid) {
      this._messageService.warning('Seleccione un rango de fechas válido.');
      return;
    }

    const val = this.patternForm.value;
    const [start, end] = val.dateRange as [Date, Date];
    const patterns = val.patterns as any[];

    if (this.currentEmployee?.requireFourPointAttendance) {
      const invalidSelected = patterns.some(p => {
        if (p.isWorkDay && p.scheduleId) {
          const sch = this.schedules.find(s => s.id === p.scheduleId);
          return sch && !sch.hasBreak;
        }
        return false;
      });

      if (invalidSelected) {
        this._messageService.error('El empleado requiere 4 marcaciones obligatorias (con refrigerio). Por favor seleccione únicamente horarios con refrigerio.');
        return;
      }
    }

    const patternMap = new Map<number, any>();
    patterns.forEach(p => patternMap.set(p.dayOfWeek, p));

    const startDateStr = format(start, 'yyyy-MM-dd');
    const endDateStr = format(end, 'yyyy-MM-dd');

    const defaultBranchId = this.currentEmployee?.mainBranchId ? this.currentEmployee.mainBranchId.toLowerCase() : null;
    let totalDaysApplied = 0;

    for (let cur = new Date(start); cur <= end; cur = addDays(cur, 1)) {
      const dateStr = format(cur, 'yyyy-MM-dd');

      // Strict string date bounds comparison to avoid timezone leakage!
      if (dateStr < startDateStr || dateStr > endDateStr) {
        continue;
      }

      // No permitir modificar fechas pasadas
      if (this.isPastDate(dateStr)) {
        continue;
      }

      const dayOfWeek = cur.getDay();
      const p = patternMap.get(dayOfWeek);

      if (p) {
        if (p.isWorkDay) {
          let startD: Date | null = null;
          let endD: Date | null = null;

          if (p.startTime && p.endTime) {
            const h1 = p.startTime.getHours();
            const m1 = p.startTime.getMinutes();
            startD = new Date(cur);
            startD.setHours(h1, m1, 0, 0);

            const h2 = p.endTime.getHours();
            const m2 = p.endTime.getMinutes();
            endD = new Date(cur);
            endD.setHours(h2, m2, 0, 0);
          }

          this.unsavedDraftsMap.set(dateStr, {
            date: dateStr,
            dayType: ScheduleDayType.WorkDay,
            baseScheduleId: p.baseScheduleId || null,
            startTime: startD,
            endTime: endD,
            isDraft: true
          });
        } else {
          this.unsavedDraftsMap.set(dateStr, {
            date: dateStr,
            dayType: ScheduleDayType.DayOff,
            baseScheduleId: null,
            startTime: null,
            endTime: null,
            isDraft: true
          });
        }
        totalDaysApplied++;
      }
    }

    // Re-render current period form so it picks up the drafts from unsavedDraftsMap
    this.buildFormForPeriod(this.serverSchedulesCache || []);

    this._messageService.success(`Se completó el horario para ${totalDaysApplied} día(s). Haz clic en "Guardar Horario" para confirmar.`);
    this.patternModalVisible.set(false);
  }

  private formatTime(date: Date): string {
    const h = date.getHours().toString().padStart(2, '0');
    const m = date.getMinutes().toString().padStart(2, '0');
    const s = date.getSeconds().toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  }
}
