
import { Component, inject, input, model, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { finalize } from 'rxjs';

import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzMessageService } from 'ng-zorro-antd/message';

import { UserService } from '../../services/user-service';
import { ResetPasswordRequest } from '../../models/reset-password-request';

function passwordsMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('newPassword')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;
  if (!password && !confirmPassword) return null;
  return password === confirmPassword ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-reset-password-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzModalModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
  ],
  templateUrl: './reset-password-modal.html',
})
export class ResetPasswordModal {
  private _fb = inject(FormBuilder);
  private _userService = inject(UserService);
  private _messageService = inject(NzMessageService);

  // Two-way binding: el padre controla cuándo se abre/cierra
  visible = model.required<boolean>();

  // Datos del usuario al que se le resetea la contraseña
  userId = input.required<string>();
  userName = input<string | null>(null);

  // Avisa al padre que el reset se completó (por si quiere refrescar algo)
  passwordReset = output<void>();

  saving = signal(false);

  form = this._fb.group({
    newPassword: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]],
  }, { validators: passwordsMatchValidator });

  handleCancel(): void {
    this.form.reset();
    this.visible.set(false);
  }

  handleOk(): void {
    if (this.form.invalid) {
      Object.values(this.form.controls).forEach(c => c.markAsTouched());
      return;
    }

    this.saving.set(true);
    const { newPassword, confirmPassword } = this.form.getRawValue();

    const payload: ResetPasswordRequest = {
      userId: this.userId(),
      NewPassword: newPassword!,
      ConfirmNewPassword: confirmPassword!,
    };

    this._userService.resetPassword(payload)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => {
          this._messageService.success('Contraseña restablecida correctamente');
          this.form.reset();
          this.visible.set(false);
          this.passwordReset.emit();
        },
        error: (err) => {
          console.error(err);
          this._messageService.error('No se pudo restablecer la contraseña');
        },
      });
  }
}

