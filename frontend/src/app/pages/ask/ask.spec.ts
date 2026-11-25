import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Ask } from './ask';

describe('Ask', () => {
  let fixture: ComponentFixture<Ask>;
  let httpMock: HttpTestingController;
  let page: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Ask],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(Ask);
    httpMock = TestBed.inject(HttpTestingController);
    page = fixture.nativeElement;
    await fixture.whenStable();
  });

  afterEach(() => httpMock.verify());

  function ask(question: string) {
    fixture.componentInstance.form.setValue({ question });
    fixture.componentInstance.submit();
  }

  it('does not send a question under 5 characters', async () => {
    ask('hi');
    await fixture.whenStable();

    httpMock.expectNone('/api/ask');
    expect(page.textContent).toContain('Write at least 5 characters.');
  });

  it('shows the answer with links to the cited articles', async () => {
    ask('  Customer was charged twice  ');
    const req = httpMock.expectOne('/api/ask');
    expect(req.request.body).toEqual({ question: 'Customer was charged twice' });
    req.flush({
      answer: '1. Verify the caller. [1]',
      general: '',
      sources: [{ ref: 1, id: 62, title: 'Handling a double charge' }],
    });
    await fixture.whenStable();

    expect(page.querySelector('.answer app-markdown')?.textContent).toContain('Verify the caller.');
    const link = page.querySelector<HTMLAnchorElement>('.sources a');
    expect(link?.textContent).toBe('Handling a double charge');
    expect(link?.getAttribute('href')).toBe('/articles/62');
  });

  it('marks an answer with no sources', async () => {
    ask('What is the weather today?');
    httpMock
      .expectOne('/api/ask')
      .flush({ answer: 'No article covers this.', general: '', sources: [] });
    await fixture.whenStable();

    expect(page.querySelector('.answer--none')).not.toBeNull();
    expect(page.textContent).toContain('No published article answers this.');
  });

  it('labels general advice that is not from an article', async () => {
    ask('customer phone keeps dropping calls');
    httpMock
      .expectOne('/api/ask')
      .flush({ answer: '', general: '1. Restart the phone.', sources: [] });
    await fixture.whenStable();

    const general = page.querySelector('.general');
    expect(general?.querySelector('h2')?.textContent).toBe('General advice, not from an article');
    expect(general?.textContent).toContain('Restart the phone.');
    expect(page.querySelector('.answer--none')).toBeNull();
    expect(page.querySelector('.sources')).toBeNull();
  });

  it('shows the server message when the ai is unavailable', async () => {
    ask('Customer was charged twice');
    httpMock
      .expectOne('/api/ask')
      .flush(
        { message: 'AI unavailable: no Gemini API key is set' },
        { status: 503, statusText: 'Unavailable' },
      );
    await fixture.whenStable();

    expect(page.querySelector('[role=alert]')?.textContent).toContain('AI unavailable');
  });

  it('asks an example question when it is clicked', async () => {
    page.querySelector<HTMLButtonElement>('.example')?.click();

    const req = httpMock.expectOne('/api/ask');
    expect(req.request.body.question).toBe('Customer was charged twice, what do I do?');
    req.flush({ answer: 'ok', general: '', sources: [] });
  });
});
