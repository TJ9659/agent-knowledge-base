import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { ArticleService } from '../../core/api/article.service';
import { CategoryService } from '../../core/api/category.service';
import { AuthService } from '../../core/auth/auth.service';
import { Article } from '../../core/models/article';
import { ArticleForm } from './article-form';

const saved: Article = {
  id: 9,
  title: 'Verifying a caller',
  content: [
    '# Verifying a caller',
    '',
    '**When to use:** at the start of every call.',
    '',
    '## Steps',
    '1. Ask for the full name.',
    '',
    '## Never',
    '- Read the password out loud.',
    '',
    '## What to tell the customer',
    '- This keeps the account safe.',
  ].join('\n'),
  status: 'PUBLISHED',
  createdAt: '2026-11-23T00:00:00.000Z',
  updatedAt: '2026-11-23T00:00:00.000Z',
  category: { id: 14, name: 'Account & Security' },
  author: { id: 2, name: 'Daniel Tan' },
};

describe('ArticleForm', () => {
  const articleService = { get: vi.fn(), create: vi.fn(), update: vi.fn(), importPdf: vi.fn() };
  let canEdit = true;

  async function open(url: string) {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'articles/new', component: ArticleForm },
          { path: 'articles/:id', children: [] },
          { path: 'articles/:id/edit', component: ArticleForm },
        ]),
        { provide: ArticleService, useValue: articleService },
        {
          provide: CategoryService,
          useValue: { list: () => of([{ id: 14, name: 'Account & Security', articleCount: 3 }]) },
        },
        { provide: AuthService, useValue: { canEditArticle: () => canEdit } },
      ],
    });
    const harness = await RouterTestingHarness.create();
    const form = await harness.navigateByUrl(url, ArticleForm);
    await harness.fixture.whenStable();
    harness.detectChanges();
    return { harness, form, element: harness.routeNativeElement! };
  }

  function submit(element: HTMLElement) {
    element.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
  }

  beforeEach(() => {
    canEdit = true;
    articleService.get.mockReset().mockReturnValue(of(saved));
    articleService.create.mockReset().mockReturnValue(of({ ...saved, id: 21 }));
    articleService.update.mockReset().mockReturnValue(of(saved));
    articleService.importPdf.mockReset();
  });

  function choosePdf(element: HTMLElement, file: File) {
    const input = element.querySelector<HTMLInputElement>('input[type="file"]')!;
    Object.defineProperty(input, 'files', { value: [file], configurable: true });
    input.dispatchEvent(new Event('change'));
  }

  const pdf = (bytes = 10) =>
    new File([new Uint8Array(bytes)], 'roaming-faq.pdf', { type: 'application/pdf' });

  it('shows what is missing and does not save an empty article', async () => {
    const { harness, element } = await open('/articles/new');

    submit(element);
    harness.detectChanges();

    expect(articleService.create).not.toHaveBeenCalled();
    expect(element.textContent).toContain('Enter a title');
    expect(element.textContent).toContain('Choose a category');
    expect(element.textContent).toContain('Add at least one step');
  });

  it('creates an article from the boxes and opens it', async () => {
    const { harness, form, element } = await open('/articles/new');
    form.form.setValue({
      title: 'Double charge',
      categoryId: 14,
      status: 'DRAFT',
      whenToUse: 'the same charge twice.',
      steps: '1. Verify the caller.',
      customer: '- Refunds take 5–7 working days.',
      escalate: '',
      more: '',
    });

    submit(element);
    await harness.fixture.whenStable();

    expect(articleService.create).toHaveBeenCalledWith({
      title: 'Double charge',
      categoryId: 14,
      status: 'DRAFT',
      content:
        '# Double charge\n\n**When to use:** the same charge twice.\n\n## Steps\n1. Verify the caller.\n\n## What to tell the customer\n- Refunds take 5–7 working days.',
    });
    expect(TestBed.inject(Router).url).toBe('/articles/21');
  });

  it('fills the boxes when editing, keeping extra sections', async () => {
    const { form } = await open('/articles/9/edit');

    expect(articleService.get).toHaveBeenCalledWith(9);
    expect(form.form.getRawValue()).toEqual({
      title: 'Verifying a caller',
      categoryId: 14,
      status: 'PUBLISHED',
      whenToUse: 'at the start of every call.',
      steps: '1. Ask for the full name.',
      customer: '- This keeps the account safe.',
      escalate: '',
      more: '## Never\n- Read the password out loud.',
    });
  });

  it('saves changes to the same article', async () => {
    const { harness, form, element } = await open('/articles/9/edit');
    form.form.controls.title.setValue('Verifying a caller (updated)');

    submit(element);
    await harness.fixture.whenStable();

    expect(articleService.update).toHaveBeenCalledWith(
      9,
      expect.objectContaining({ title: 'Verifying a caller (updated)' }),
    );
    expect(TestBed.inject(Router).url).toBe('/articles/9');
  });

  it("refuses to open someone else's article", async () => {
    canEdit = false;
    const { element } = await open('/articles/9/edit');

    expect(element.textContent).toContain('You can only edit your own articles.');
    expect(element.querySelector('form')).toBeNull();
  });

  it('shows the server message when saving fails', async () => {
    articleService.update.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 409,
            error: { message: 'A related record is missing or still in use' },
          }),
      ),
    );
    const { harness, element } = await open('/articles/9/edit');

    submit(element);
    await harness.fixture.whenStable();
    harness.detectChanges();

    expect(element.querySelector('[role="alert"]')?.textContent).toContain(
      'A related record is missing or still in use',
    );
  });

  it('previews the article like the real page', async () => {
    const { harness, element } = await open('/articles/9/edit');

    Array.from(element.querySelectorAll<HTMLButtonElement>('[role="tab"]'))
      .find((tab) => tab.textContent?.includes('Preview'))!
      .click();
    harness.detectChanges();

    expect(element.querySelector('.preview__title')?.textContent).toBe('Verifying a caller');
    expect(element.querySelector('.callout h2')?.textContent).toBe('What to tell the customer');
  });

  it('fills the boxes from an imported pdf, without saving', async () => {
    articleService.importPdf.mockReturnValue(
      of({
        title: 'Handling roaming questions',
        whenToUse: 'the customer has roaming questions',
        steps: '1. Check Plans > Roaming.',
        customer: '- We send an SMS with the rates.',
        escalate: '',
        more: '## Cost\n- RM 15 a day.',
      }),
    );
    const { harness, form, element } = await open('/articles/new');

    choosePdf(element, pdf());
    await harness.fixture.whenStable();
    harness.detectChanges();

    expect(articleService.importPdf).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'roaming-faq.pdf' }),
    );
    expect(form.form.controls.title.value).toBe('Handling roaming questions');
    expect(form.form.controls.steps.value).toBe('1. Check Plans > Roaming.');
    expect(form.form.controls.status.value).toBe('DRAFT');
    expect(element.querySelector('.notice')?.textContent).toContain(
      'Filled in from roaming-faq.pdf',
    );
    expect(articleService.create).not.toHaveBeenCalled();
  });

  it('shows why an import failed', async () => {
    articleService.importPdf.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 400,
            error: { message: "Couldn't find a procedure in this PDF." },
          }),
      ),
    );
    const { harness, element } = await open('/articles/new');

    choosePdf(element, pdf());
    await harness.fixture.whenStable();
    harness.detectChanges();

    expect(element.querySelector('[role="alert"]')?.textContent).toContain(
      "Couldn't find a procedure",
    );
  });

  it('refuses a pdf over 5 MB without uploading it', async () => {
    const { harness, element } = await open('/articles/new');

    choosePdf(element, pdf(6 * 1024 * 1024));
    harness.detectChanges();

    expect(articleService.importPdf).not.toHaveBeenCalled();
    expect(element.querySelector('[role="alert"]')?.textContent).toContain('over 5 MB');
  });

  it('only offers the import on a new article', async () => {
    const { element } = await open('/articles/9/edit');

    expect(element.querySelector('.import')).toBeNull();
  });
});
