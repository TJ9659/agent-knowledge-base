import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';

export const authGuard: CanActivateFn = (_route, state) => {
  if(inject(AuthService).isLoggedIn()){
    return true;
  }

  const returnUrl = state.url === '/articles' ? undefined : state.url;
  return inject(Router).createUrlTree(['/login'], {queryParams: {returnUrl}});
};
