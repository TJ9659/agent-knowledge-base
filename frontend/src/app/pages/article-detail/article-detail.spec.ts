import { HttpErrorResponse } from '@angular/common/http';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { ArticleService } from '../../core/api/article.service';
import { AuthService } from '../../core/auth/auth.service';
import { Article } from '../../core/models/article';
import { Role, User } from '../../core/models/user';
import { ConfirmService } from '../../shared/confirm-dialog/confirm.service';
import { ArticleDetail } from './article-detail';

const article: Article = {
  id: 7,
  title: 'Handling a double charge',
  content: [
    '# Handling a double charge',
    '',
    '**When to use:** the customer sees the same charge twice.',
    '',
    '## Steps',
    '1. Verify the caller.',
    '',
    '## What to tell the customer',
    '- Refunds take 5–7 working days.',
    '',
    '## Escalate if',
    '- The amount is over RM 500.',
  ].join('\n'),
  status: 'PUBLISHED',
  createdAt: '2026-11-23T00:00:00.000Z',
  updatedAt: '2026-11-23T00:00:00.000Z',
  category: { id: 13, name: 'Billing & Payments' },
  author: { id: 2, name: 'Daniel Tan' },
};

const userWith = (id: number, role: Role): User => ({
  id,
  name: 'Someone',
  email: 'someone@nexora.test',
  role,
  isActive: true,
  createdAt: '2026-11-23T00:00:00.000Z',
});

describe('ArticleDetail', () => {
  const articleService = { get: vi.fn(), delete: vi.fn() };
  const confirm = { ask: vi.fn() };

  // opens the real /articles/7 route as the given user
  async function open(user: User) {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'articles', children: [] },
          { path: 'articles/:id', component: ArticleDetail },
        ]),
        { provide: ArticleService, useValue: articleService },
        { provide: AuthService, useValue: { user: signal(user) } },
        { provide: ConfirmService, useValue: confirm },
      ],
    });
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/articles/7');
    await harness.fixture.whenStable();
    harness.detectChanges();
    return harness;
  }

  beforeEach(() => {
    articleService.get.mockReset().mockReturnValue(of(article));
    articleService.delete.mockReset().mockReturnValue(of(undefined));
    confirm.ask.mockReset();
  });

  it('shows the article with its sections', async () => {
    const element = (await open(userWith(4, 'AGENT'))).routeNativeElement!;

    expect(articleService.get).toHaveBeenCalledWith(7);
    expect(element.querySelector('h1')?.textContent).toBe('Handling a double charge');
    expect(element.querySelectorAll('h1').length).toBe(1);
    expect(element.querySelector('.callout:not(.callout--escalate) h2')?.textContent).toBe(
      'What to tell the customer',
    );
    expect(element.querySelector('.callout--escalate h2')?.textContent).toBe('Escalate if');
  });

  it('hides edit and delete from someone who did not write it', async () => {
    const element = (await open(userWith(4, 'AGENT'))).routeNativeElement!;
    expect(element.querySelector('.actions')).toBeNull();
  });

  it('shows edit and delete to the author and to admins', async () => {
    expect(
      (await open(userWith(2, 'EDITOR'))).routeNativeElement!.querySelector('.actions'),
    ).not.toBeNull();
    TestBed.resetTestingModule();
    expect(
      (await open(userWith(1, 'ADMIN'))).routeNativeElement!.querySelector('.actions'),
    ).not.toBeNull();
  });

  it('says not found for a missing article or a hidden draft', async () => {
    articleService.get.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 404 })));

    const element = (await open(userWith(4, 'AGENT'))).routeNativeElement!;

    expect(element.textContent).toContain('Article not found');
  });

  it('deletes after confirming and goes back to the list', async () => {
    confirm.ask.mockResolvedValue(true);
    const harness = await open(userWith(2, 'EDITOR'));

    harness.routeNativeElement!.querySelector<HTMLButtonElement>('.button--danger')!.click();
    await harness.fixture.whenStable();

    expect(articleService.delete).toHaveBeenCalledWith(7);
    expect(TestBed.inject(Router).url).toBe('/articles');
  });

  it('keeps the article when delete is cancelled', async () => {
    confirm.ask.mockResolvedValue(false);
    const harness = await open(userWith(2, 'EDITOR'));

    harness.routeNativeElement!.querySelector<HTMLButtonElement>('.button--danger')!.click();
    await harness.fixture.whenStable();

    expect(articleService.delete).not.toHaveBeenCalled();
  });
});
