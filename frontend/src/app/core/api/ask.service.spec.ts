import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AskService } from './ask.service';

describe('AskService', () => {
  let service: AskService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AskService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('posts the question', () => {
    service.ask('Customer was charged twice').subscribe();

    const req = httpMock.expectOne('/api/ask');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ question: 'Customer was charged twice' });
    req.flush({ answer: 'ok', sources: [] });
  });
});
