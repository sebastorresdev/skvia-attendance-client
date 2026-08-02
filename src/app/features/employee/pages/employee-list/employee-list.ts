import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
// NG-ZORRO
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDropdownModule } from 'ng-zorro-antd/dropdown';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzMessageService } from 'ng-zorro-antd/message';
// PROYECTO
import { EmployeeResponse } from '../../models/employee-response';
import { EmployeeService } from '../../services/employee-service';
import { parseApiErrorMessage } from '../../../../shared/utils/api-error.util';
import { DocumentType } from '../../models/document-type';

@Component({
  selector: 'app-employee-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzTableModule,
    NzIconModule,
    NzButtonModule,
    NzDropdownModule,
    NzMenuModule,
    NzModalModule,
    NzInputModule,
    NzSpaceModule
  ],
  templateUrl: './employee-list.html',
})
export class EmployeeList implements OnInit {
  private _employeeService = inject(EmployeeService);
  private _messageService = inject(NzMessageService);
  private _modalService = inject(NzModalService);
  private _router = inject(Router);

  allEmployees = signal<EmployeeResponse[]>([]);
  search = signal('');

  filteredEmployees = computed(() => {
    const term = this.search().toLowerCase().trim();
    if (!term) return this.allEmployees();
    return this.allEmployees().filter(r => 
      r.firstName.toLowerCase().includes(term) || 
      r.lastName.toLowerCase().includes(term) || 
      r.code.toLowerCase().includes(term) ||
      r.documentNumber.toLowerCase().includes(term)
    );
  });

  // Table Selection State
  checked = false;
  indeterminate = false;
  listOfCurrentPageData: readonly EmployeeResponse[] = [];
  setOfCheckedId = new Set<string>();

  ngOnInit(): void {
    this.loadEmployees();
  }

  // ---------- Data Loading ----------

  loadEmployees(): void {
    this._employeeService.getAll().subscribe({
      next: (data) => this.allEmployees.set(data),
      error: (error) => {
        console.error('Error loading employees', error);
        this._messageService.error('No se pudieron cargar los empleados');
      },
    });
  }

  // ---------- Routing to Forms ----------

  navigateToNew(): void {
    this._router.navigate(['/employees/new']);
  }

  navigateToEdit(employee: EmployeeResponse): void {
    this._router.navigate(['/employees', employee.id]);
  }

  navigateToSchedule(employee: EmployeeResponse): void {
    this._router.navigate(['/employees', employee.id, 'schedule']);
  }

  // ---------- Helpers ----------
  
  getDocumentTypeName(type: DocumentType): string {
    switch (type) {
      case DocumentType.Dni: return 'DNI';
      case DocumentType.Ce: return 'CE';
      case DocumentType.Passport: return 'Pasaporte';
      default: return 'Desconocido';
    }
  }

  // ---------- Table Selection ----------

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
    this.listOfCurrentPageData.forEach((item) => this.updateCheckedSet(item.id, value));
    this.refreshCheckedStatus();
  }

  onCurrentPageDataChange(data: readonly EmployeeResponse[]): void {
    this.listOfCurrentPageData = data;
    this.refreshCheckedStatus();
  }

  refreshCheckedStatus(): void {
    this.checked = this.listOfCurrentPageData.length > 0 && this.listOfCurrentPageData.every((item) => this.setOfCheckedId.has(item.id));
    this.indeterminate =
      this.listOfCurrentPageData.some((item) => this.setOfCheckedId.has(item.id)) && !this.checked;
  }

  // ---------- Deletion ----------

  showDeleteConfirm(employee: EmployeeResponse): void {
    this._modalService.confirm({
      nzTitle: `¿Estás seguro de que quieres eliminar al empleado '${employee.firstName} ${employee.lastName}'?`,
      nzOkText: 'Confirmar',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => {
        this._employeeService.delete(employee.id).subscribe({
          next: () => {
            this._messageService.success(`Empleado eliminado`);
            this.setOfCheckedId.delete(employee.id);
            this.refreshCheckedStatus();
            this.loadEmployees();
          },
          error: (err) => {
            console.error('Error deleting employee', err);
            const errorMessage = parseApiErrorMessage(err);
            this._messageService.error(errorMessage);
          },
        });
      },
      nzCancelText: 'Cancelar',
    });
  }

  showDeleteSelectedConfirm(): void {
    this._modalService.confirm({
      nzTitle: `¿Estás seguro de que quieres eliminar ${this.setOfCheckedId.size} empleado(s)?`,
      nzOkText: 'Confirmar',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => this.deleteSelected(),
      nzCancelText: 'Cancelar',
    });
  }

  deleteSelected(): void {
    const ids = Array.from(this.setOfCheckedId);
    if (ids.length === 0) return;
    
    const observables = ids.map(id => this._employeeService.delete(id));
    
    forkJoin(observables).subscribe({
      next: () => {
        this._messageService.success(`${ids.length} empleado(s) eliminados`);
        this.setOfCheckedId.clear();
        this.refreshCheckedStatus();
        this.loadEmployees();
      },
      error: (err) => {
        const errorMessage = parseApiErrorMessage(err);
        this._messageService.error('Error al eliminar empleados: ' + errorMessage);
        this.loadEmployees();
      }
    });
  }
}
