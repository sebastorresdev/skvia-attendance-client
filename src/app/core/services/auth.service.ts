import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginRequest } from '../models/LoginRequest';
import { LoginResponse } from '../models/LoginResponse';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  // ✅ Signal — reactivo
  token = signal<string | null>(localStorage.getItem('token'));
  isAuthenticated = computed(() => !!this.token());

  login(loginRequest : LoginRequest) {
    return this.http.post<LoginResponse>(`${environment.API_URL}/auth/login`, loginRequest).pipe(
      tap(response => {
        // Guardamos el accessToken opaco
        this.token.set(response.accessToken);
        localStorage.setItem('accessToken', response.accessToken);

        // Opcional: guardar refresh token si lo usarás
        localStorage.setItem('refreshToken', response.refreshToken);
      })
    );
  }

  logout() {
    this.token.set(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    this.router.navigate(['/login']);
  }
}
