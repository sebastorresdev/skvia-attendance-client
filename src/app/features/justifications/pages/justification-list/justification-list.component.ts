import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzMessageService } from 'ng-zorro-antd/message';

import { JustificationService } from '../../services/justification.service';
import {
  JustificationResponse,
  JustificationStatus,
  JustificationType
} from '../../models/justification';
import { EmployeeService } from '../../../employee/services/employee-service';
import { EmployeeResponse } from '../../../employee/models/employee-response';

@Component({
  selector: 'app-justification-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzTableModule,
    NzButtonModule,
    NzIconModule,
    NzCardModule,
    NzTagModule,
    NzModalModule,
    NzFormModule,
    NzInputModule,
    NzSelectModule,
    NzDatePickerModule
  ],
  templateUrl: './justification-list.component.html'
})
export class JustificationListComponent implements OnInit {
  private _justificationService = inject(JustificationService);
  private _employeeService = inject(EmployeeService);
  private _messageService = inject(NzMessageService);
  private _fb = inject(FormBuilder);

  justifications = signal<JustificationResponse[]>([]);
  employees = signal<EmployeeResponse[]>([]);
  loading = signal(false);
  submitting = signal(false);

  isCreateModalVisible = false;
  isReviewModalVisible = false;

  selectedJustification: JustificationResponse | null = null;

  createForm!: FormGroup;
  reviewForm!: FormGroup;

  JustificationStatus = JustificationStatus;
  JustificationType = JustificationType;

  ngOnInit(): void {
    this.createForm = this._fb.group({
      employeeId: [null, [Validators.required]],
      date: [new Date(), [Validators.required]],
      type: [JustificationType.Tardiness, [Validators.required]],
      reason: ['', [Validators.required, Validators.maxLength(500)]],
      documentUrl: ['']
    });

    this.reviewForm = this._fb.group({
      approve: [true, [Validators.required]],
      notes: ['']
    });

    this.loadEmployees();
    this.loadJustifications();
  }

  loadEmployees(): void {
    this._employeeService.getAll().subscribe({
      next: (list) => this.employees.set(list),
      error: () => this._messageService.error('Error al cargar lista de empleados')
    });
  }

  loadJustifications(): void {
    this.loading.set(true);
    this._justificationService.getAll().subscribe({
      next: (list) => {
        this.justifications.set(list);
        this.loading.set(false);
      },
      error: () => {
        this._messageService.error('Error al cargar justificaciones');
        this.loading.set(false);
      }
    });
  }

  openCreateModal(): void {
    this.createForm.reset({
      employeeId: null,
      date: new Date(),
      type: JustificationType.Tardiness,
      reason: '',
      documentUrl: ''
    });
    this.isCreateModalVisible = true;
  }

  closeCreateModal(): void {
    this.isCreateModalVisible = false;
  }

  submitCreate(): void {
    if (this.createForm.invalid) {
      Object.values(this.createForm.controls).forEach(c => c.markAsDirty());
      return;
    }

    this.submitting.set(true);
    const val = this.createForm.value;
    const dateStr = this.formatDate(val.date);

    this._justificationService.create({
      employeeId: val.employeeId,
      date: dateStr,
      type: val.type,
      reason: val.reason,
      documentUrl: val.documentUrl || undefined
    }).subscribe({
      next: () => {
        this._messageService.success('Solicitud de justificación creada exitosamente');
        this.submitting.set(false);
        this.closeCreateModal();
        this.loadJustifications();
      },
      error: (err) => {
        this._messageService.error(err.error?.detail || 'Error al registrar solicitud');
        this.submitting.set(false);
      }
    });
  }

  openReviewModal(item: JustificationResponse): void {
    this.selectedJustification = item;
    this.reviewForm.reset({
      approve: true,
      notes: ''
    });
    this.isReviewModalVisible = true;
  }

  closeReviewModal(): void {
    this.isReviewModalVisible = false;
    this.selectedJustification = null;
  }

  submitReview(): void {
    if (!this.selectedJustification) return;

    this.submitting.set(true);
    const val = this.reviewForm.value;

    this._justificationService.review(this.selectedJustification.id, {
      approve: val.approve,
      notes: val.notes || undefined
    }).subscribe({
      next: () => {
        this._messageService.success(val.approve ? 'Justificación APROBADA' : 'Justificación RECHAZADA');
        this.submitting.set(false);
        this.closeReviewModal();
        this.loadJustifications();
      },
      error: () => {
        this._messageService.error('Error al evaluar la justificación');
        this.submitting.set(false);
      }
    });
  }

  getTypeLabel(type: JustificationType): string {
    switch (type) {
      case JustificationType.Tardiness: return 'Tardanza';
      case JustificationType.Absence: return 'Ausencia / Falta';
      case JustificationType.EarlyLeave: return 'Salida Temprana';
      default: return 'Otro';
    }
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
