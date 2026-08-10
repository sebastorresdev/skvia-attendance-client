import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Observable, Observer, Subscription, of, switchMap, catchError, map, finalize } from 'rxjs';

// NG-ZORRO
import { NzUploadModule, NzUploadFile, NzUploadXHRArgs } from 'ng-zorro-antd/upload';
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
import { NzTabsModule } from 'ng-zorro-antd/tabs';

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
import { DepartmentService } from '../../../department/services/department-service';
import { DepartmentResponse } from '../../../department/models/department-response';
import { WorkplaceService, WorkplaceResponse } from '../../../workplace/services/workplace.service';

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
    NzTabsModule,
    NzUploadModule,
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
  private _departmentService = inject(DepartmentService);
  private _workplaceService = inject(WorkplaceService);

  form!: FormGroup;
  isEdit = false;
  employeeId: string | null = null;
  loading = signal(false);
  initialLoading = signal(false);
  branches = signal<BranchResponse[]>([]);
  users = signal<UserResponse[]>([]);
  departments = signal<DepartmentResponse[]>([]);
  workplaces = signal<WorkplaceResponse[]>([]);

  // Avatar states
  uploadingPhoto = signal<boolean>(false);
  avatarUrl = signal<string | undefined>(undefined);
  avatarChanged = signal<boolean>(false);
  private avatarFile = signal<File | null>(null);

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
    this.loadDepartments();
    this.loadWorkplaces();
    
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

  private loadWorkplaces(): void {
    this._workplaceService.getAll().subscribe({
      next: (data) => this.workplaces.set(data),
      error: () => this._messageService.error('Error al cargar lugares de marcación')
    });
  }

  private loadDepartments(): void {
    this._departmentService.getAll().subscribe({
      next: (data) => this.departments.set(data),
      error: () => this._messageService.error('Error al cargar departamentos')
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
      departmentId: [null],
      photoUrl: ['', [Validators.maxLength(500)]],
      mainBranchId: [null],
      mobileCheckInEnabled: [false],
      applicationUserId: [null],
      requireFourPointAttendance: [false],
      isAttendanceTracked: [true],
      autoCompleteClockOut: [false],
      allowedWorkplaceIds: [[]]
    });

    this.form.get('mobileCheckInEnabled')?.valueChanges.subscribe(enabled => {
      const userCtrl = this.form.get('applicationUserId');
      if (enabled) {
        userCtrl?.setValidators([Validators.required]);
      } else {
        userCtrl?.clearValidators();
      }
      userCtrl?.updateValueAndValidity();
    });

    this.form.get('isAttendanceTracked')?.valueChanges.subscribe(tracked => {
      const mobileCtrl = this.form.get('mobileCheckInEnabled');
      if (!tracked) {
        mobileCtrl?.setValue(false);
        mobileCtrl?.disable();
      } else {
        mobileCtrl?.enable();
      }
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
          departmentId: emp.departmentId,
          photoUrl: emp.photoUrl,
          mainBranchId: emp.mainBranchId || null,
          mobileCheckInEnabled: (emp as any).mobileCheckInEnabled || false,
          applicationUserId: (emp as any).applicationUserId || null,
          requireFourPointAttendance: emp.requireFourPointAttendance || false,
          isAttendanceTracked: emp.isAttendanceTracked ?? true,
          autoCompleteClockOut: emp.autoCompleteClockOut || false,
          allowedWorkplaceIds: (emp as any).allowedWorkplaceIds || []
        });
        
        // Trigger manual check on load just in case it's false in DB
        if (emp.isAttendanceTracked === false) {
          this.form.get('mobileCheckInEnabled')?.disable();
        }
        
        this.avatarUrl.set(emp.photoUrl ?? undefined);
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

  // ---------- Avatar ----------

  readonly beforeUpload = (file: NzUploadFile): Observable<boolean> => {
    return new Observable((observer: Observer<boolean>) => {
      const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
      if (!isJpgOrPng) {
        this._messageService.error('Solo puedes subir archivos JPG o PNG.');
        observer.next(false);
        observer.complete();
        return;
      }

      const isLt2M = (file.size ?? 0) / 1024 / 1024 < 2;
      if (!isLt2M) {
        this._messageService.error('La imagen debe pesar menos de 2MB.');
        observer.next(false);
        observer.complete();
        return;
      }

      observer.next(true);
      observer.complete();
    });
  };

  handleChange(info: { file: NzUploadFile }): void {
    switch (info.file.status) {
      case 'uploading':
        this.uploadingPhoto.set(true);
        break;
      case 'done':
      case 'success':
        if (info.file.originFileObj) {
          this.avatarFile.set(info.file.originFileObj as unknown as File);
          this.avatarChanged.set(true);

          this._getBase64(info.file.originFileObj as unknown as File, (img: string) => {
            this.uploadingPhoto.set(false);
            this.avatarUrl.set(img);
          });
        } else {
          this.uploadingPhoto.set(false);
        }
        break;
      case 'error':
        this._messageService.error('Error al cargar la imagen.');
        this.uploadingPhoto.set(false);
        break;
    }
  }

  readonly customUpload = (item: NzUploadXHRArgs): Subscription => {
    setTimeout(() => {
      if (item.file) {
        item.onSuccess?.({}, item.file, null);
      }
    }, 0);
    return new Subscription();
  };

  removeAvatar(event: Event): void {
    event.stopPropagation();
    this.avatarUrl.set(undefined);
    this.avatarFile.set(null);
  }

  private _getBase64(file: File, callback: (img: string) => void): void {
    const reader = new FileReader();
    reader.addEventListener('load', () => callback(reader.result?.toString() ?? ''));
    reader.readAsDataURL(file);
  }

  private uploadPhotoIfNeeded$(): Observable<string | null> {
    const file = this.avatarFile();

    if (!file || !this.avatarChanged()) {
      return of(this.avatarUrl() ?? null);
    }

    return this._employeeService.uploadPhoto(file).pipe(
      switchMap((res: { url: string }) => {
        this.avatarChanged.set(false);
        return of(res.url);
      }),
    );
  }

  submitForm(): void {
    if (this.form.invalid) {
      Object.values(this.form.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
      this._messageService.warning('Por favor, revise los campos marcados en rojo antes de guardar.');
      return;
    }

    this.loading.set(true);

    this.uploadPhotoIfNeeded$().pipe(
      switchMap((uploadedUrl) => {
        const val = this.form.getRawValue();

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
          departmentId: val.departmentId || null,
          photoUrl: uploadedUrl ?? undefined,
          mainBranchId: val.mainBranchId || null,
          mobileCheckInEnabled: val.mobileCheckInEnabled,
          applicationUserId: val.applicationUserId || null,
          requireFourPointAttendance: val.requireFourPointAttendance,
          isAttendanceTracked: val.isAttendanceTracked,
          autoCompleteClockOut: val.autoCompleteClockOut,
          allowedWorkplaceIds: val.allowedWorkplaceIds || []
        };

        return this.isEdit 
          ? this._employeeService.update(this.employeeId!, request)
          : this._employeeService.create(request);
      }),
      finalize(() => this.loading.set(false))
    ).subscribe({
      next: () => {
        this._messageService.success(`Empleado ${this.isEdit ? 'actualizado' : 'creado'} con éxito`);
        this.goBack();
      },
      error: (err) => {
        const msg = parseApiErrorMessage(err);
        this._messageService.error(msg);
      }
    });
  }

}
