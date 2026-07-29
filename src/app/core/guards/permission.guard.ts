import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const permissionGuard = (permission: string): CanActivateFn => {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (auth.permissions().includes(permission)) {
      return true;
    }

    router.navigate(['/403']);
    return false;
  };
};
