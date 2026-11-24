import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { CategoryService } from './category.service';

describe('CategoryService', () => {
  let service: CategoryService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(CategoryService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('uses the right method and url for each action', () => {
    service.list().subscribe();
    service.stats().subscribe();
    service.create('Roaming').subscribe();
    service.rename(3, 'Travel').subscribe();
    service.delete(3).subscribe();

    expect(httpMock.expectOne({ method: 'GET', url: '/api/categories' })).toBeTruthy();
    expect(httpMock.expectOne({ method: 'GET', url: '/api/stats/categories' })).toBeTruthy();
    expect(httpMock.expectOne({ method: 'POST', url: '/api/categories' }).request.body).toEqual({ name: 'Roaming' });
    expect(httpMock.expectOne({ method: 'PUT', url: '/api/categories/3' }).request.body).toEqual({ name: 'Travel' });
    expect(httpMock.expectOne({ method: 'DELETE', url: '/api/categories/3' })).toBeTruthy();
  });
});
