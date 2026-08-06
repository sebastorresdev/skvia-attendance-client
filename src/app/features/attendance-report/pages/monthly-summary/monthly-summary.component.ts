import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';

import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { NzFormModule } from 'ng-zorro-antd/form';

import { AttendanceService, MonthlySummaryResponse } from '../../services/attendance.service';
import { BranchService } from '../../../branch/services/branch-service';
import { BranchResponse } from '../../../branch/models/branch-response';

@Component({
  selector: 'app-monthly-summary',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzTableModule,
    NzButtonModule,
    NzIconModule,
    NzCardModule,
    NzTagModule,
    NzSelectModule,
    NzTooltipModule,
    NzFormModule
  ],
  templateUrl: './monthly-summary.component.html'
})
export class MonthlySummaryComponent implements OnInit {
  private _attendanceService = inject(AttendanceService);
  private _branchService = inject(BranchService);
  private _messageService = inject(NzMessageService);
  private _fb = inject(FormBuilder);

  summary = signal<MonthlySummaryResponse | null>(null);
  branches = signal<BranchResponse[]>([]);
  loading = signal(false);

  form!: FormGroup;

  years = [2024, 2025, 2026, 2027];
  months = [
    { value: 1, label: 'Enero' },
    { value: 2, label: 'Febrero' },
    { value: 3, label: 'Marzo' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Mayo' },
    { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Septiembre' },
    { value: 10, label: 'Octubre' },
    { value: 11, label: 'Noviembre' },
    { value: 12, label: 'Diciembre' }
  ];

  ngOnInit(): void {
    const now = new Date();
    this.form = this._fb.group({
      year: [now.getFullYear()],
      month: [now.getMonth() + 1],
      branchId: [null]
    });

    this.loadBranches();
    this.search();
  }

  loadBranches(): void {
    this._branchService.getAll().subscribe({
      next: (b) => this.branches.set(b),
      error: () => this._messageService.error('Error al cargar sedes')
    });
  }

  search(): void {
    this.loading.set(true);
    const val = this.form.value;
    this._attendanceService.getMonthlySummary(val.year, val.month, val.branchId || undefined).subscribe({
      next: (res) => {
        this.summary.set(res);
        this.loading.set(false);
      },
      error: () => {
        this._messageService.error('Error al obtener la matriz consolidada de asistencia');
        this.loading.set(false);
      }
    });
  }

  getMonthLabel(m: number): string {
    const found = this.months.find(x => x.value === m);
    return found ? found.label : '';
  }
}
