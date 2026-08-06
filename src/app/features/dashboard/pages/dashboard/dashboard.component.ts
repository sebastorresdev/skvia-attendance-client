import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';

import { NzCardModule } from 'ng-zorro-antd/card';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';

import { DashboardService } from '../../services/dashboard.service';
import { DashboardStatsResponse } from '../../models/dashboard-stats';
import { BranchService } from '../../../branch/services/branch-service';
import { BranchResponse } from '../../../branch/models/branch-response';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzCardModule,
    NzGridModule,
    NzIconModule,
    NzTagModule,
    NzSelectModule,
    NzTableModule,
    NzProgressModule,
    NzButtonModule,
    NzAvatarModule
  ],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit {
  private _dashboardService = inject(DashboardService);
  private _branchService = inject(BranchService);
  private _messageService = inject(NzMessageService);
  private _fb = inject(FormBuilder);

  stats = signal<DashboardStatsResponse | null>(null);
  branches = signal<BranchResponse[]>([]);
  loading = signal(true);

  form!: FormGroup;
  currentTime = signal(new Date());

  ngOnInit(): void {
    this.form = this._fb.group({
      branchId: [null]
    });

    setInterval(() => {
      this.currentTime.set(new Date());
    }, 1000);

    this.loadBranches();
    this.loadStats();

    this.form.get('branchId')?.valueChanges.subscribe(() => {
      this.loadStats();
    });
  }

  loadBranches(): void {
    this._branchService.getAll().subscribe({
      next: (data) => this.branches.set(data),
      error: () => this._messageService.error('Error al cargar sedes')
    });
  }

  loadStats(): void {
    this.loading.set(true);
    const branchId = this.form.get('branchId')?.value;
    this._dashboardService.getStats(branchId || undefined).subscribe({
      next: (res) => {
        this.stats.set(res);
        this.loading.set(false);
      },
      error: () => {
        this._messageService.error('Error al cargar métricas del Dashboard');
        this.loading.set(false);
      }
    });
  }
}
