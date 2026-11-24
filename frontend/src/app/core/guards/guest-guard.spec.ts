import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, CanActivateFn, provideRouter, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { guestGuard } from './guest-guard';

describe('guestGuard', () => {
  const route = {} as ActivatedRouteSnapshot;
  const state = { url: '/login' } as RouterStateSnapshot;

  const executeGuard: CanActivateFn = (...guardParameters) =>
    TestBed.runInInjectionContext(() => guestGuard(...guardParameters));

  function setup(loggedIn: boolean) {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthService, useValue: { isLoggedIn: () => loggedIn } }],
    });
  }

  it('shows the login page to a logged out user', () => {
    setup(false);
    expect(executeGuard(route, state)).toBe(true);
  });

  it('sends a logged in user to articles', () => {
    setup(true);
    const result = executeGuard(route, state) as UrlTree;
    expect(TestBed.inject(Router).serializeUrl(result)).toBe('/articles');
  });
});
