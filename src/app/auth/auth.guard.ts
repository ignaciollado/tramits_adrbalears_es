import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const isAuthenticated = !!localStorage.getItem('token'); // o usa un AuthService

  if (!isAuthenticated) {
    router.navigate(['/login']);
    return false;
  }

  return true;
};
