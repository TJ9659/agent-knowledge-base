import { CanActivateFn, Router } from '@angular/router';
import { Role } from '../models/user';
import { inject } from '@angular/core';
import { AuthService } from '../auth/auth.service';

export const roleGuard: CanActivateFn = (route) => {
  const roles = (route.data['roles'] ?? []) as Role[];

  if(inject(AuthService).hasRole(...roles)){
    return true;
  }

  return inject(Router).createUrlTree(['/articles']);
};
