import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { UserService } from './user.service';

describe('UserService', () => {
  let service: UserService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('uses the right method and url for each action', () => {
    const input = { name: 'Nur Aina', email: 'nur@nexora.test', password: 'Password123!', role: 'AGENT' as const };

    service.list(2).subscribe();
    service.create(input).subscribe();
    service.update(7, { role: 'EDITOR' }).subscribe();
    service.deactivate(7).subscribe();

    expect(httpMock.expectOne({ method: 'GET', url: '/api/users?page=2' })).toBeTruthy();
    expect(httpMock.expectOne({ method: 'POST', url: '/api/users' }).request.body).toEqual(input);
    expect(httpMock.expectOne({ method: 'PUT', url: '/api/users/7' }).request.body).toEqual({ role: 'EDITOR' });
    expect(httpMock.expectOne({ method: 'DELETE', url: '/api/users/7' })).toBeTruthy();
  });
});
