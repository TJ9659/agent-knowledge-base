import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ArticleService } from './article.service';

describe('ArticleService', () => {
  let service: ArticleService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ArticleService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('sends only the filters that were given', () => {
    service.list({ q: 'double charge', categoryId: undefined, page: 2 }).subscribe();

    const req = httpMock.expectOne((r) => r.url === '/api/articles');
    expect(req.request.params.keys().sort()).toEqual(['page', 'q']);
    expect(req.request.params.get('q')).toBe('double charge');
    req.flush({ data: [], page: 2, pageSize: 10, total: 0 });
  });

  it('drops an empty search', () => {
    service.list({ q: '' }).subscribe();

    const req = httpMock.expectOne((r) => r.url === '/api/articles');
    expect(req.request.params.has('q')).toBe(false);
    req.flush({ data: [], page: 1, pageSize: 10, total: 0 });
  });

  it('uses the right method and url for each action', () => {
    service.get(5).subscribe();
    service.update(5, { title: 'New' }).subscribe();
    service.delete(5).subscribe();
    service.mine(2).subscribe();

    expect(httpMock.expectOne({ method: 'GET', url: '/api/articles/5' })).toBeTruthy();
    expect(httpMock.expectOne({ method: 'PUT', url: '/api/articles/5' }).request.body).toEqual({
      title: 'New',
    });
    expect(httpMock.expectOne({ method: 'DELETE', url: '/api/articles/5' })).toBeTruthy();
    expect(httpMock.expectOne({ method: 'GET', url: '/api/articles/mine?page=2' })).toBeTruthy();
  });

  it('uploads the pdf as form data', () => {
    const file = new File(['%PDF'], 'sop.pdf', { type: 'application/pdf' });
    service.importPdf(file).subscribe();

    const req = httpMock.expectOne({ method: 'POST', url: '/api/articles/import' });
    expect(req.request.body).toBeInstanceOf(FormData);
    expect((req.request.body as FormData).get('file')).toBe(file);
    req.flush({ title: '', whenToUse: '', steps: '', customer: '', escalate: '', more: '' });
  });
});
