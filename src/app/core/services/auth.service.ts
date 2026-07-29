import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginRequest } from '../models/LoginRequest';
import { LoginResponse } from '../models/LoginResponse';
import { CurrentUserDto } from '../models/current-user-dto';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  // Signals
  token = signal<string | null>(localStorage.getItem('accessToken'));
  userId = signal<string | null>(null);
  roles = signal<string[]>([]);
  permissions = signal<string[]>([]);

  isAuthenticated = computed(() => !!this.token());

  init() {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    this.http.get<CurrentUserDto>(`${environment.API_URL}/auth/me`)
      .subscribe({
        next: (me) => {
          this.userId.set(me.userId);
          this.roles.set(me.roles);
          this.permissions.set(me.permissions);
        },
        error: () => {
          this.logout();
        }
      });
  }

  login(loginRequest: LoginRequest) {
    return this.http.post<LoginResponse>(`${environment.API_URL}/auth/login`, loginRequest).pipe(
      tap(response => {
        this.token.set(response.accessToken);
        localStorage.setItem('accessToken', response.accessToken);
        localStorage.setItem('refreshToken', response.refreshToken);
      }),

      switchMap(() =>
        this.http.get<CurrentUserDto>(`${environment.API_URL}/auth/me`)
      ),

      tap(me => {
        this.userId.set(me.userId);
        this.roles.set(me.roles);
        this.permissions.set(me.permissions);
      })
    );
  }

  logout() {
    this.token.set(null);
    this.userId.set(null);
    this.roles.set([]);
    this.permissions.set([]);

    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');

    this.router.navigate(['/login']);
  }
}
