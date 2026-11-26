import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, CanActivateFn, provideRouter, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { authGuard } from './auth-guard';
import { AuthService } from '../auth/auth.service';

describe('authGuard', () => {
  const route = {} as ActivatedRouteSnapshot;
  const state = { url: '/articles/5' } as RouterStateSnapshot;

  const executeGuard: CanActivateFn = (...guardParameters) =>
    TestBed.runInInjectionContext(() => authGuard(...guardParameters));

  // a fake AuthService that only answers isLoggedIn
  function setup(loggedIn: boolean) {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthService, useValue: { isLoggedIn: () => loggedIn } }],
    });
  }

  it('lets a logged in user through', () => {
    setup(true);
    expect(executeGuard(route, state)).toBe(true);
  });

  it('sends a logged out user to login and remembers where they were going', () => {
    setup(false);
    const result = executeGuard(route, state) as UrlTree;
    expect(TestBed.inject(Router).serializeUrl(result)).toBe('/login?returnUrl=%2Farticles%2F5');
  });

  it('leaves out returnUrl for the home page, since login goes there anyway', () => {
    setup(false);
    const result = executeGuard(route, { url: '/articles' } as RouterStateSnapshot) as UrlTree;
    expect(TestBed.inject(Router).serializeUrl(result)).toBe('/login');
  });
});
