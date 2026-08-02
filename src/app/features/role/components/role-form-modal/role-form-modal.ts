import { Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzMessageService } from 'ng-zorro-antd/message';
import { RoleService } from '../../services/role-service';
import { RoleRequest } from '../../models/role-request';
import { RoleResponse } from '../../models/role-response';

@Component({
  selector: 'app-role-form-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzModalModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
  ],
  templateUrl: './role-form-modal.html',
})
export class RoleFormModal implements OnInit {
  private _fb = inject(FormBuilder);
  private _roleService = inject(RoleService);
  private _messageService = inject(NzMessageService);

  @Input() visible = false;
  @Input() role: RoleResponse | null = null;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() saved = new EventEmitter<void>();

  form!: FormGroup;
  isSaving = false;

  ngOnInit(): void {
    this.form = this._fb.group({
      name: ['', [Validators.required, Validators.maxLength(256)]],
      description: ['', [Validators.maxLength(1000)]],
    });
  }

  // Se dispara cada vez que cambia un input (@Input)
  ngOnChanges(): void {
    if (this.visible) {
      this.resetForm();
    }
  }

  resetForm(): void {
    if (this.form) {
      if (this.role) {
        this.form.patchValue({
          name: this.role.name,
          description: this.role.description,
        });
      } else {
        this.form.reset();
      }
    }
  }

  handleCancel(): void {
    this.visible = false;
    this.visibleChange.emit(this.visible);
  }

  handleOk(): void {
    if (this.form.invalid) {
      Object.values(this.form.controls).forEach((control) => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
      return;
    }

    this.isSaving = true;
    const request: RoleRequest = this.form.value;

    if (this.role) {
      this._roleService.update(this.role.id, request).subscribe({
        next: () => {
          this._messageService.success('Rol actualizado con éxito');
          this.isSaving = false;
          this.saved.emit();
          this.handleCancel();
        },
        error: (err) => {
          console.error(err);
          this._messageService.error('Error al actualizar el rol');
          this.isSaving = false;
        },
      });
    } else {
      this._roleService.create(request).subscribe({
        next: () => {
          this._messageService.success('Rol creado con éxito');
          this.isSaving = false;
          this.saved.emit();
          this.handleCancel();
        },
        error: (err) => {
          console.error(err);
          this._messageService.error('Error al crear el rol');
          this.isSaving = false;
        },
      });
    }
  }
}
