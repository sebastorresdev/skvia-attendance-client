// ============================================
// login.component.ts (sin cambios de lógica, solo referencia)
// ============================================
import { Component, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

// NG-ZORRO
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';

// PROJECT
import { AuthService } from '../../core/services/auth.service';
import { LoginRequest } from '../../core/models/LoginRequest';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NzButtonModule,
    NzCheckboxModule,
    NzFormModule,
    NzInputModule,
    NzIconModule,
  ],
  templateUrl: './login.html',
})
export class Login {
  private fb = inject(NonNullableFormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private message = inject(NzMessageService);
  currentYear = new Date().getFullYear();

  validateForm = this.fb.group({
    userName: this.fb.control('', [Validators.required]),
    password: this.fb.control('', [Validators.required]),
    remember: this.fb.control(true),
  });

  submitForm(): void {
    if (this.validateForm.valid) {
      const { userName, password } = this.validateForm.getRawValue();
      const request: LoginRequest = {
        userName: userName!,
        password: password!,
      };
      this.authService.login(request).subscribe({
        next: () => {
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          console.log(err.error);
          this.message.create('error', `${err.error.title}`);
        },
      });
    } else {
      Object.values(this.validateForm.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
    }
  }
}
