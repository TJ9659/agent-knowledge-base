import {
  HttpClient,
  HttpErrorResponse,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { User } from '../models/user';
import { authInterceptor } from './auth-interceptor';
import { AuthService } from './auth.service';

const user: User = {
  id: 4,
  name: 'Hafiz Ismail',
  email: 'agent@nexora.test',
  role: 'AGENT',
  isActive: true,
  isProtected: false,
  createdAt: '2026-11-23T00:00:00.000Z',
};

const unauthorized = { status: 401, statusText: 'Unauthorized' };

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let auth: AuthService;

  function signIn(accessToken: string) {
    auth.login(user.email, 'Password123!').subscribe();
    httpMock.expectOne('/api/auth/login').flush({ accessToken, user });
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideRouter([{ path: 'login', children: [] }]),
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthService);
  });

  afterEach(() => httpMock.verify());

  it('adds the bearer token to api requests', () => {
    signIn('token-1');

    http.get('/api/articles').subscribe();

    const req = httpMock.expectOne('/api/articles');
    expect(req.request.headers.get('Authorization')).toBe('Bearer token-1');
    req.flush([]);
  });

  it('sends no header when logged out', () => {
    http.get('/api/health').subscribe();

    const req = httpMock.expectOne('/api/health');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('on a 401 it refreshes once and retries with the new token', () => {
    signIn('old-token');
    let result: unknown;

    http.get('/api/articles').subscribe((body) => (result = body));

    httpMock
      .expectOne('/api/articles')
      .flush({ message: 'Invalid or expired token' }, unauthorized);
    httpMock.expectOne('/api/auth/refresh').flush({ accessToken: 'new-token', user });

    const retry = httpMock.expectOne('/api/articles');
    expect(retry.request.headers.get('Authorization')).toBe('Bearer new-token');
    retry.flush({ data: [] });

    expect(result).toEqual({ data: [] });
  });

  it('logs out when the refresh fails too', () => {
    signIn('old-token');
    let error: HttpErrorResponse | undefined;

    http.get('/api/articles').subscribe({ error: (err: HttpErrorResponse) => (error = err) });

    httpMock
      .expectOne('/api/articles')
      .flush({ message: 'Invalid or expired token' }, unauthorized);
    httpMock
      .expectOne('/api/auth/refresh')
      .flush({ message: 'Invalid refresh token' }, unauthorized);
    httpMock.expectOne('/api/auth/logout').flush(null);

    expect(auth.isLoggedIn()).toBe(false);
    expect(error?.status).toBe(401);
  });

  it('passes other errors through without refreshing', () => {
    signIn('token-1');
    let error: HttpErrorResponse | undefined;

    http.get('/api/articles/999').subscribe({ error: (err: HttpErrorResponse) => (error = err) });
    httpMock
      .expectOne('/api/articles/999')
      .flush({ message: 'Article not found' }, { status: 404, statusText: 'Not Found' });

    expect(error?.status).toBe(404);
    expect(auth.isLoggedIn()).toBe(true);
  });
});
