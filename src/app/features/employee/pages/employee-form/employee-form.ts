import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

// NG-ZORRO
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzTimePickerModule } from 'ng-zorro-antd/time-picker';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { NzDividerModule } from 'ng-zorro-antd/divider';

import { EmployeeService } from '../../services/employee-service';
import { BranchService } from '../../../branch/services/branch-service';
import { DocumentType } from '../../models/document-type';
import { parseApiErrorMessage } from '../../../../shared/utils/api-error.util';
import { EmployeeResponse } from '../../models/employee-response';
import { BranchResponse } from '../../../branch/models/branch-response';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { UserService } from '../../../user/services/user-service';
import { UserResponse } from '../../../user/models/user-response';

@Component({
  selector: 'app-employee-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzSelectModule,
    NzDatePickerModule,
    NzIconModule,
    NzGridModule,
    NzCardModule,
    NzSpaceModule,
    NzSpinModule,
    NzBreadCrumbModule,
    NzDividerModule,
    NzSwitchModule,
    NzCheckboxModule,
    NzTimePickerModule,
    RouterLink
  ],
  templateUrl: './employee-form.html'
})
export class EmployeeForm implements OnInit {
  private _fb = inject(FormBuilder);
  private _employeeService = inject(EmployeeService);
  private _messageService = inject(NzMessageService);
  private _route = inject(ActivatedRoute);
  private _router = inject(Router);
  private _location = inject(Location);

  private _branchService = inject(BranchService);
  private _userService = inject(UserService);

  form!: FormGroup;
  isEdit = false;
  employeeId: string | null = null;
  loading = signal(false);
  initialLoading = signal(false);
  branches = signal<BranchResponse[]>([]);
  users = signal<UserResponse[]>([]);

  // Enums for template
  documentTypes = [
    { label: 'DNI', value: DocumentType.Dni },
    { label: 'Carnet de Extranjería', value: DocumentType.Ce },
    { label: 'Pasaporte', value: DocumentType.Passport }
  ];

  ngOnInit(): void {
    this.initForm();
    this.loadBranches();
    this.loadUsers();
    
    this.employeeId = this._route.snapshot.paramMap.get('id');
    if (this.employeeId) {
      this.isEdit = true;
      this.loadEmployee(this.employeeId);
    }
  }

  private loadBranches(): void {
    this._branchService.getAll().subscribe({
      next: (data) => this.branches.set(data),
      error: () => this._messageService.error('Error al cargar sedes')
    });
  }

  private loadUsers(): void {
    this._userService.getAll().subscribe({
      next: (data) => this.users.set(data),
      error: () => this._messageService.error('Error al cargar usuarios')
    });
  }

  private initForm(): void {
    this.form = this._fb.group({
      code: ['', [Validators.required, Validators.maxLength(10)]],
      firstName: ['', [Validators.required, Validators.maxLength(100)]],
      lastName: ['', [Validators.required, Validators.maxLength(100)]],
      documentType: [DocumentType.Dni, [Validators.required]],
      documentNumber: ['', [Validators.required, Validators.maxLength(20)]],
      hireDate: [null, [Validators.required]],
      email: ['', [Validators.email, Validators.maxLength(250)]],
      phone: ['', [Validators.maxLength(20)]],
      position: ['', [Validators.maxLength(100)]],
      department: ['', [Validators.maxLength(100)]],
      photoUrl: ['', [Validators.maxLength(500)]],
      mainBranchId: [null],
      mobileCheckInEnabled: [false],
      applicationUserId: [null],
      requireFourPointAttendance: [null]
    });
  }

  private loadEmployee(id: string): void {
    this.initialLoading.set(true);
    this._employeeService.getById(id).subscribe({
      next: (emp: EmployeeResponse) => {
        this.form.patchValue({
          code: emp.code,
          firstName: emp.firstName,
          lastName: emp.lastName,
          documentType: emp.documentType,
          documentNumber: emp.documentNumber,
          // Convert string to Date for nz-date-picker
          hireDate: (emp as any).hireDate ? new Date((emp as any).hireDate) : null,
          email: emp.email,
          phone: emp.phone,
          position: emp.position,
          department: emp.department,
          photoUrl: emp.photoUrl,
          mainBranchId: emp.mainBranchId || null,
          mobileCheckInEnabled: (emp as any).mobileCheckInEnabled || false,
          applicationUserId: (emp as any).applicationUserId || null,
          requireFourPointAttendance: emp.requireFourPointAttendance
        });
        this.initialLoading.set(false);
      },
      error: (err) => {
        this._messageService.error('Error al cargar empleado');
        this.initialLoading.set(false);
        this.goBack();
      }
    });
  }

  goBack(): void {
    this._location.back();
  }

  submitForm(): void {
    if (this.form.invalid) {
      Object.values(this.form.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
      return;
    }

    this.loading.set(true);
    const val = this.form.value;

    const request = {
      code: val.code.trim().toUpperCase(),
      firstName: val.firstName.trim(),
      lastName: val.lastName.trim(),
      documentType: val.documentType,
      documentNumber: val.documentNumber.trim(),
      hireDate: val.hireDate ? val.hireDate.toISOString() : null,
      email: val.email ? val.email.trim() : null,
      phone: val.phone ? val.phone.trim() : null,
      position: val.position ? val.position.trim() : null,
      department: val.department ? val.department.trim() : null,
      photoUrl: val.photoUrl ? val.photoUrl.trim() : null,
      mainBranchId: val.mainBranchId || null,
      mobileCheckInEnabled: val.mobileCheckInEnabled,
      applicationUserId: val.applicationUserId || null,
      requireFourPointAttendance: val.requireFourPointAttendance === 'null' ? null : val.requireFourPointAttendance
    };

    const obs$ = this.isEdit 
      ? this._employeeService.update(this.employeeId!, request)
      : this._employeeService.create(request);

    obs$.subscribe({
      next: () => {
        this._messageService.success(`Empleado ${this.isEdit ? 'actualizado' : 'creado'} con éxito`);
        this.loading.set(false);
        this.goBack();
      },
      error: (err) => {
        this.loading.set(false);
        const msg = parseApiErrorMessage(err);
        this._messageService.error(msg);
      }
    });
  }
}
