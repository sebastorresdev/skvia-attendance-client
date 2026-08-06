import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { NzTableModule } from 'ng-zorro-antd/table';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';

import { AttendanceService, AttendanceResponse } from '../../services/attendance.service';
import { BranchService } from '../../../branch/services/branch-service';
import { BranchResponse } from '../../../branch/models/branch-response';
import { EmployeeService } from '../../../employee/services/employee-service';
import { EmployeeResponse } from '../../../employee/models/employee-response';

@Component({
  selector: 'app-attendance-report',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzTableModule,
    NzDatePickerModule,
    NzSelectModule,
    NzInputModule,
    NzButtonModule,
    NzIconModule,
    NzCardModule,
    NzTagModule,
    NzFormModule,
    NzTooltipModule
  ],
  templateUrl: './attendance-report.component.html'
})
export class AttendanceReportComponent implements OnInit {
  private _fb = inject(FormBuilder);
  private _attendanceService = inject(AttendanceService);
  private _branchService = inject(BranchService);
  private _employeeService = inject(EmployeeService);
  private _messageService = inject(NzMessageService);

  form!: FormGroup;
  attendances = signal<AttendanceResponse[]>([]);
  branches = signal<BranchResponse[]>([]);
  employees = signal<EmployeeResponse[]>([]);
  loading = signal(false);
  exporting = signal(false);
  seeding = signal(false);

  ngOnInit(): void {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);

    this.form = this._fb.group({
      dateRange: [[firstDay, today]],
      branchId: [null],
      employeeId: [null],
      statusFilter: ['all'],
      search: ['']
    });

    this.loadBranches();
    this.loadEmployees();
    this.search();
  }

  loadBranches(): void {
    this._branchService.getAll().subscribe({
      next: (branches) => this.branches.set(branches),
      error: () => this._messageService.error('Error al cargar sedes')
    });
  }

  loadEmployees(): void {
    this._employeeService.getAll().subscribe({
      next: (empList) => this.employees.set(empList),
      error: () => this._messageService.error('Error al cargar empleados')
    });
  }

  search(): void {
    const val = this.form.value;
    if (!val.dateRange || val.dateRange.length !== 2) {
      this._messageService.warning('Seleccione un rango de fechas');
      return;
    }

    this.loading.set(true);
    const startDate = this.formatDate(val.dateRange[0]);
    const endDate = this.formatDate(val.dateRange[1]);

    const status = val.statusFilter === 'all' ? undefined : val.statusFilter;

    this._attendanceService.getAttendances(
      startDate,
      endDate,
      val.branchId || undefined,
      val.search || undefined,
      val.employeeId || undefined,
      status
    ).subscribe({
      next: (data) => {
        this.attendances.set(data);
        this.loading.set(false);
      },
      error: () => {
        this._messageService.error('Error al cargar asistencias');
        this.loading.set(false);
      }
    });
  }

  exportExcel(): void {
    const val = this.form.value;
    if (!val.dateRange || val.dateRange.length !== 2) {
      this._messageService.warning('Seleccione un rango de fechas para exportar');
      return;
    }

    this.exporting.set(true);
    const startDate = this.formatDate(val.dateRange[0]);
    const endDate = this.formatDate(val.dateRange[1]);
    const status = val.statusFilter === 'all' ? undefined : val.statusFilter;

    this._attendanceService.exportExcel(
      startDate,
      endDate,
      val.branchId || undefined,
      val.search || undefined,
      val.employeeId || undefined,
      status
    ).subscribe({
      next: (data) => {
        const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Reporte_Asistencias_${startDate}_${endDate}.xlsx`;
        a.click();
        window.URL.revokeObjectURL(url);
        this._messageService.success('Reporte descargado correctamente');
        this.exporting.set(false);
      },
      error: () => {
        this._messageService.error('Error al generar archivo Excel');
        this.exporting.set(false);
      }
    });
  }

  seedData(): void {
    this.seeding.set(true);
    this._attendanceService.seedData().subscribe({
      next: (res: any) => {
        this._messageService.success(res || 'Datos generados correctamente');
        this.seeding.set(false);
        this.search();
      },
      error: () => {
        this._messageService.error('Error al generar datos');
        this.seeding.set(false);
      }
    });
  }

  private formatDate(date: Date): string {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
  }
}
