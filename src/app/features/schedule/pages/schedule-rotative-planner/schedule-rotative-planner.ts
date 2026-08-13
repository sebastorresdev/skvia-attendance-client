import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';

import { ScheduleService } from '../../services/schedule.service';
import { DepartmentService } from '../../../department/services/department-service';
import { BranchService } from '../../../branch/services/branch-service';
import { DepartmentResponse } from '../../../department/models/department-response';
import { BranchResponse } from '../../../branch/models/branch-response';
import {
  EmployeeScheduleGridRowDto,
  ResolvedScheduleDayDto,
  ScheduleDayType,
  ScheduleResponse,
  ScheduleMatrixCellItem
} from '../../models/schedule';
import { ScheduleExceptionModal } from '../../components/schedule-exception-modal/schedule-exception-modal';
import { parseApiErrorMessage } from '../../../../shared/utils/api-error.util';

@Component({
  selector: 'app-schedule-rotative-planner',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzButtonModule,
    NzSelectModule,
    NzDatePickerModule,
    NzTagModule,
    NzIconModule,
    NzTooltipModule
  ],
  templateUrl: './schedule-rotative-planner.html'
})
export class ScheduleRotativePlanner implements OnInit {
  private scheduleService = inject(ScheduleService);
  private departmentService = inject(DepartmentService);
  private branchService = inject(BranchService);
  private modalService = inject(NzModalService);
  private message = inject(NzMessageService);

  gridRows = signal<EmployeeScheduleGridRowDto[]>([]);
  schedules = signal<ScheduleResponse[]>([]);
  departments = signal<DepartmentResponse[]>([]);
  branches = signal<BranchResponse[]>([]);
  isLoading = signal(false);
  isSaving = signal(false);

  selectedBranchId = signal<string | null>(null);
  selectedDepartmentId = signal<string | null>(null);

  startDate = signal<Date>(this.getStartOfWeek(new Date()));
  endDate = signal<Date>(this.getEndOfWeek(new Date()));

  activePaletteShiftId = signal<string | 'DAY_OFF' | null>(null);
  pendingChangesMap = new Map<string, ScheduleMatrixCellItem>();
  pendingChangesCount = signal(0);

  dateColumns = computed(() => {
    const start = new Date(this.startDate());
    const end = new Date(this.endDate());
    const days: { dateStr: string; dayName: string; dayNumber: string; isWeekend: boolean }[] = [];

    const dayNames = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const dayNum = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${dayNum}`;

      days.push({
        dateStr,
        dayName: dayNames[d.getDay()],
        dayNumber: dayNum,
        isWeekend: d.getDay() === 0 || d.getDay() === 6
      });
    }
    return days;
  });

  ScheduleDayType = ScheduleDayType;

  ngOnInit(): void {
    this.loadMetadata();
    this.loadGrid();
  }

  loadMetadata(): void {
    this.departmentService.getAll().subscribe(res => this.departments.set(res));
    this.branchService.getAll().subscribe(res => this.branches.set(res));
    this.scheduleService.getSchedules().subscribe({
      next: (list) => this.schedules.set(list),
      error: (err) => console.error(err)
    });
  }

  loadGrid(): void {
    this.isLoading.set(true);
    this.pendingChangesMap.clear();
    this.pendingChangesCount.set(0);
    const startStr = this.formatDate(this.startDate());
    const endStr = this.formatDate(this.endDate());
    const bId = this.selectedBranchId() || undefined;
    const dId = this.selectedDepartmentId() || undefined;

    this.scheduleService.getResolvedGrid(startStr, endStr, bId, dId).subscribe({
      next: (rows) => {
        this.gridRows.set(rows);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.message.error(parseApiErrorMessage(err));
      }
    });
  }

  previousWeek(): void {
    const s = new Date(this.startDate());
    s.setDate(s.getDate() - 7);
    const e = new Date(this.endDate());
    e.setDate(e.getDate() - 7);

    this.startDate.set(s);
    this.endDate.set(e);
    this.loadGrid();
  }

  nextWeek(): void {
    const s = new Date(this.startDate());
    s.setDate(s.getDate() + 7);
    const e = new Date(this.endDate());
    e.setDate(e.getDate() + 7);

    this.startDate.set(s);
    this.endDate.set(e);
    this.loadGrid();
  }

  currentWeek(): void {
    this.startDate.set(this.getStartOfWeek(new Date()));
    this.endDate.set(this.getEndOfWeek(new Date()));
    this.loadGrid();
  }

  selectPaletteShift(shiftId: string | 'DAY_OFF'): void {
    if (this.activePaletteShiftId() === shiftId) {
      this.activePaletteShiftId.set(null);
    } else {
      this.activePaletteShiftId.set(shiftId);
    }
  }

  onCellClick(row: EmployeeScheduleGridRowDto, day: ResolvedScheduleDayDto): void {
    const activePalette = this.activePaletteShiftId();
    if (!activePalette) {
      this.openExceptionModal(row, day);
      return;
    }

    const key = `${row.employeeId}_${day.date}`;

    if (activePalette === 'DAY_OFF') {
      day.dayType = ScheduleDayType.DayOff;
      day.startTime = null;
      day.endTime = null;
      day.scheduleId = null;
      day.scheduleCode = null;
      day.isException = true;

      this.pendingChangesMap.set(key, {
        employeeId: row.employeeId,
        date: day.date,
        dayType: ScheduleDayType.DayOff,
        customScheduleId: null,
        reason: 'Pintado en matriz rotativa'
      });
    } else {
      const sched = this.schedules().find(s => s.id === activePalette);
      if (sched) {
        day.dayType = ScheduleDayType.WorkDay;
        day.startTime = sched.defaultStartTime;
        day.endTime = sched.defaultEndTime;
        day.scheduleId = sched.id;
        day.scheduleCode = sched.code;
        day.scheduleDescription = sched.description;
        day.isException = true;

        this.pendingChangesMap.set(key, {
          employeeId: row.employeeId,
          date: day.date,
          dayType: ScheduleDayType.WorkDay,
          customScheduleId: sched.id,
          startTime: sched.defaultStartTime,
          endTime: sched.defaultEndTime,
          reason: 'Pintado en matriz rotativa'
        });
      }
    }
    this.pendingChangesCount.set(this.pendingChangesMap.size);
  }

  openExceptionModal(row: EmployeeScheduleGridRowDto, day: ResolvedScheduleDayDto): void {
    const modalRef = this.modalService.create({
      nzTitle: 'Gestionar Horario del Día',
      nzContent: ScheduleExceptionModal,
      nzData: { day, employeeName: row.employeeName },
      nzWidth: 500,
      nzFooter: null
    });

    modalRef.afterClose.subscribe(result => {
      if (result) this.loadGrid();
    });
  }

  savePendingChanges(): void {
    if (this.pendingChangesMap.size === 0) return;

    const cells = Array.from(this.pendingChangesMap.values());
    this.isSaving.set(true);

    this.scheduleService.assignMatrix({ cells }).subscribe({
      next: () => {
        this.message.success('Matriz de horarios guardada correctamente');
        this.isSaving.set(false);
        this.pendingChangesMap.clear();
        this.pendingChangesCount.set(0);
        this.loadGrid();
      },
      error: (err) => {
        this.isSaving.set(false);
        this.message.error(parseApiErrorMessage(err));
      }
    });
  }

  discardPendingChanges(): void {
    this.pendingChangesMap.clear();
    this.pendingChangesCount.set(0);
    this.loadGrid();
  }

  getBadgeClass(day: ResolvedScheduleDayDto): string {
    if (day.dayType === ScheduleDayType.DayOff) {
      return 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 border-slate-200';
    }
    if (day.dayType === ScheduleDayType.Vacation) {
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-300';
    }
    if (day.dayType === ScheduleDayType.MedicalLeave) {
      return 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 border-rose-300';
    }
    if (day.isException) {
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border-purple-300 font-semibold';
    }
    return 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200';
  }

  private getStartOfWeek(d: Date): Date {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff));
  }

  private getEndOfWeek(d: Date): Date {
    const start = this.getStartOfWeek(d);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return end;
  }

  formatDate(d: Date): string {
    const dateObj = new Date(d);
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
