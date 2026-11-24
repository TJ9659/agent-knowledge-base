import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';

// logged in users skip the login page
export const guestGuard: CanActivateFn = () => {
  if (inject(AuthService).isLoggedIn()) {
    return inject(Router).createUrlTree(['/articles']);
  }
  return true;
};
