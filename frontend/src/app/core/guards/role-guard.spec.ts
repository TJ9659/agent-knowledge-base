import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, CanActivateFn, provideRouter, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Role } from '../models/user';
import { AuthService } from '../auth/auth.service';
import { roleGuard } from './role-guard';

describe('roleGuard', () => {
  const state = { url: '/admin/users' } as RouterStateSnapshot;

  const executeGuard: CanActivateFn = (...guardParameters) =>
    TestBed.runInInjectionContext(() => roleGuard(...guardParameters));

  // route data the way app.routes.ts will set it
  const routeWith = (data: object) => ({ data }) as unknown as ActivatedRouteSnapshot;

  // a fake AuthService for a user with this role
  function setup(role: Role) {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { hasRole: (...roles: Role[]) => roles.includes(role) } },
      ],
    });
  }

  it('lets an allowed role through', () => {
    setup('ADMIN');
    expect(executeGuard(routeWith({ roles: ['ADMIN'] }), state)).toBe(true);
  });

  it('sends a wrong role back to articles', () => {
    setup('AGENT');
    const result = executeGuard(routeWith({ roles: ['ADMIN'] }), state) as UrlTree;
    expect(TestBed.inject(Router).serializeUrl(result)).toBe('/articles');
  });

  it('blocks everyone when the route lists no roles', () => {
    setup('ADMIN');
    const result = executeGuard(routeWith({}), state) as UrlTree;
    expect(TestBed.inject(Router).serializeUrl(result)).toBe('/articles');
  });
});
