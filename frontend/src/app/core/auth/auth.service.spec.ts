import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { User } from '../models/user';
import { AuthService } from './auth.service';

const user: User = {
  id: 4,
  name: 'Hafiz Ismail',
  email: 'agent@nexora.test',
  role: 'AGENT',
  isActive: true,
  createdAt: '2026-11-23T00:00:00.000Z',
};

describe('AuthService', () => {
  let auth: AuthService;
  let httpMock: HttpTestingController;

  // logs in through the real login method with a fake server reply
  function signIn(accessToken = 'token-1') {
    auth.login(user.email, 'Password123!').subscribe();
    httpMock.expectOne('/api/auth/login').flush({ accessToken, user });
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: 'login', children: [] }]),
      ],
    });
    auth = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  // fails the test if a request was sent that the test didnt expect
  afterEach(() => httpMock.verify());

  it('starts logged out', () => {
    expect(auth.isLoggedIn()).toBe(false);
    expect(auth.user()).toBeNull();
    expect(auth.getAccessToken()).toBeNull();
  });

  it('login posts the credentials and saves the token and user', () => {
    auth.login(user.email, 'Password123!').subscribe();

    const req = httpMock.expectOne('/api/auth/login');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: user.email, password: 'Password123!' });
    expect(req.request.withCredentials).toBe(true);
    req.flush({ accessToken: 'token-1', user });

    expect(auth.isLoggedIn()).toBe(true);
    expect(auth.user()).toEqual(user);
    expect(auth.getAccessToken()).toBe('token-1');
  });

  it('hasRole is true only for the listed roles', () => {
    expect(auth.hasRole('AGENT')).toBe(false);

    signIn();
    expect(auth.hasRole('AGENT')).toBe(true);
    expect(auth.hasRole('ADMIN')).toBe(false);
    expect(auth.hasRole('EDITOR', 'ADMIN')).toBe(false);
  });

  it('canEditArticle allows the author, and admins for any article', () => {
    expect(auth.canEditArticle(4)).toBe(false);

    signIn();
    expect(auth.canEditArticle(user.id)).toBe(true);
    expect(auth.canEditArticle(99)).toBe(false);
  });

  it('logout tells the server and forgets the session', () => {
    signIn();

    auth.logout();
    httpMock.expectOne('/api/auth/logout').flush(null);

    expect(auth.isLoggedIn()).toBe(false);
    expect(auth.getAccessToken()).toBeNull();
  });

  it('refresh sends one request even when called twice at once', () => {
    auth.refresh().subscribe();
    auth.refresh().subscribe();

    httpMock.expectOne('/api/auth/refresh').flush({ accessToken: 'token-2', user });

    expect(auth.getAccessToken()).toBe('token-2');
  });

  it('restoreSession stays logged out quietly when there is no cookie', () => {
    let finished = false;
    auth.restoreSession().subscribe({ complete: () => (finished = true) });

    httpMock
      .expectOne('/api/auth/refresh')
      .flush({ message: 'Missing refresh token' }, { status: 401, statusText: 'Unauthorized' });

    expect(finished).toBe(true);
    expect(auth.isLoggedIn()).toBe(false);
  });
});
