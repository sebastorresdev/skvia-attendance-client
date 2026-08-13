import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { EmployeeService } from '../../../employee/services/employee-service';
import { DepartmentService } from '../../../department/services/department-service';
import { BranchService } from '../../../branch/services/branch-service';
import { EmployeeResponse, EmployeeStatus } from '../../../employee/models/employee-response';
import { DepartmentResponse } from '../../../department/models/department-response';
import { BranchResponse } from '../../../branch/models/branch-response';
import { AssignBulkModal } from '../../components/assign-bulk-modal/assign-bulk-modal';

@Component({
  selector: 'app-schedule-bulk-assign',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzTableModule,
    NzButtonModule,
    NzInputModule,
    NzSelectModule,
    NzTagModule,
    NzIconModule
  ],
  templateUrl: './schedule-bulk-assign.html'
})
export class ScheduleBulkAssign implements OnInit {
  private employeeService = inject(EmployeeService);
  private departmentService = inject(DepartmentService);
  private branchService = inject(BranchService);
  private modalService = inject(NzModalService);
  private message = inject(NzMessageService);

  EmployeeStatus = EmployeeStatus;

  allEmployees = signal<EmployeeResponse[]>([]);
  departments = signal<DepartmentResponse[]>([]);
  branches = signal<BranchResponse[]>([]);
  isLoading = signal(false);

  searchQuery = signal('');
  selectedBranchId = signal<string | null>(null);
  selectedDepartmentId = signal<string | null>(null);

  checked = false;
  indeterminate = false;
  setOfCheckedId = new Set<string>();

  filteredEmployees = computed(() => {
    let list = this.allEmployees();
    const query = this.searchQuery().toLowerCase().trim();
    const bId = this.selectedBranchId();
    const dId = this.selectedDepartmentId();

    if (bId) list = list.filter(e => e.mainBranchId === bId);
    if (dId) list = list.filter(e => e.departmentId === dId);
    if (query) {
      list = list.filter(e =>
        e.firstName.toLowerCase().includes(query) ||
        e.lastName.toLowerCase().includes(query) ||
        e.code.toLowerCase().includes(query) ||
        (e.documentNumber && e.documentNumber.toLowerCase().includes(query))
      );
    }
    return list;
  });

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading.set(true);
    this.employeeService.getAll().subscribe({
      next: (data) => {
        this.allEmployees.set(data.filter(e => e.isAttendanceTracked !== false));
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });

    this.departmentService.getAll().subscribe({ next: (list) => this.departments.set(list) });
    this.branchService.getAll().subscribe({ next: (list) => this.branches.set(list) });
  }

  updateCheckedSet(id: string, checked: boolean): void {
    if (checked) {
      this.setOfCheckedId.add(id);
    } else {
      this.setOfCheckedId.delete(id);
    }
  }

  onItemChecked(id: string, checked: boolean): void {
    this.updateCheckedSet(id, checked);
    this.refreshCheckedStatus();
  }

  onAllChecked(value: boolean): void {
    this.filteredEmployees().forEach(item => this.updateCheckedSet(item.id, value));
    this.refreshCheckedStatus();
  }

  refreshCheckedStatus(): void {
    const data = this.filteredEmployees();
    this.checked = data.length > 0 && data.every(item => this.setOfCheckedId.has(item.id));
    this.indeterminate = data.some(item => this.setOfCheckedId.has(item.id)) && !this.checked;
  }

  openAssignModal(): void {
    if (this.setOfCheckedId.size === 0) {
      this.message.warning('Selecciona al menos un empleado para asignar el horario base.');
      return;
    }

    const selectedIds = Array.from(this.setOfCheckedId);
    const modalRef = this.modalService.create({
      nzTitle: 'Asignar Horario Base a Empleados',
      nzContent: AssignBulkModal,
      nzData: { employeeIds: selectedIds },
      nzWidth: 550,
      nzFooter: null
    });

    modalRef.afterClose.subscribe(result => {
      if (result) {
        this.setOfCheckedId.clear();
        this.refreshCheckedStatus();
      }
    });
  }
}
