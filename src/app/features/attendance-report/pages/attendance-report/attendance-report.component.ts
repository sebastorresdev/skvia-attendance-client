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

import { AttendanceService, AttendanceResponse } from '../../services/attendance.service';
import { BranchService } from '../../../branch/services/branch-service';
import { BranchResponse } from '../../../branch/models/branch-response';

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
    NzFormModule
  ],
  templateUrl: './attendance-report.component.html'
})
export class AttendanceReportComponent implements OnInit {
  private _fb = inject(FormBuilder);
  private _attendanceService = inject(AttendanceService);
  private _branchService = inject(BranchService);
  private _messageService = inject(NzMessageService);

  form!: FormGroup;
  attendances = signal<AttendanceResponse[]>([]);
  branches = signal<BranchResponse[]>([]);
  loading = signal(false);
  seeding = signal(false);

  ngOnInit(): void {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);

    this.form = this._fb.group({
      dateRange: [[firstDay, today]],
      branchId: [null],
      search: ['']
    });

    this.loadBranches();
    this.search();
  }

  loadBranches(): void {
    this._branchService.getAll().subscribe({
      next: (branches) => this.branches.set(branches),
      error: () => this._messageService.error('Error al cargar sedes')
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

    this._attendanceService.getAttendances(startDate, endDate, val.branchId, val.search).subscribe({
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
