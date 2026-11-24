import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of } from 'rxjs';
import { ArticleService } from '../../core/api/article.service';
import { ArticleListItem } from '../../core/models/article';
import { Paginated } from '../../core/models/paginated';
import { ConfirmService } from '../../shared/confirm-dialog/confirm.service';
import { MyArticles } from './my-articles';

const draft: ArticleListItem = {
  id: 54,
  title: 'Updated data privacy handling',
  snippet: '',
  status: 'DRAFT',
  createdAt: '2026-11-23T00:00:00.000Z',
  updatedAt: '2026-11-23T00:00:00.000Z',
  category: { id: 18, name: 'Policies' },
  author: { id: 2, name: 'Daniel Tan' },
};

const published: ArticleListItem = {
  ...draft,
  id: 37,
  title: 'Handling a double charge',
  status: 'PUBLISHED',
};

const page = (data: ArticleListItem[]): Paginated<ArticleListItem> => ({
  data,
  page: 1,
  pageSize: 10,
  total: data.length,
});

describe('MyArticles', () => {
  const articleService = { mine: vi.fn(), delete: vi.fn() };
  const confirm = { ask: vi.fn() };

  async function open(url = '/my-articles') {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'my-articles', component: MyArticles }]),
        { provide: ArticleService, useValue: articleService },
        { provide: ConfirmService, useValue: confirm },
      ],
    });
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(url, MyArticles);
    await harness.fixture.whenStable();
    harness.detectChanges();
    return harness;
  }

  beforeEach(() => {
    articleService.mine.mockReset().mockReturnValue(of(page([draft, published])));
    articleService.delete.mockReset().mockReturnValue(of(undefined));
    confirm.ask.mockReset();
  });

  it('loads the page from the url', async () => {
    await open('/my-articles?page=2');
    expect(articleService.mine).toHaveBeenCalledWith(2);
  });

  it('lists drafts and published articles with their status', async () => {
    const element = (await open()).routeNativeElement!;
    const rows = Array.from(element.querySelectorAll('tbody tr'));

    expect(rows.length).toBe(2);
    expect(rows[0].textContent).toContain('Updated data privacy handling');
    expect(rows[0].querySelector('.badge')?.textContent?.trim()).toBe('Draft');
    expect(rows[1].querySelector('.badge')?.textContent?.trim()).toBe('Published');
    expect(rows[0].querySelector('a.button')?.getAttribute('href')).toBe('/articles/54/edit');
  });

  it('invites a first article when there are none', async () => {
    articleService.mine.mockReturnValue(of(page([])));
    const element = (await open()).routeNativeElement!;

    expect(element.textContent).toContain("You haven't written any articles yet.");
  });

  it('deletes after confirming and reloads the list', async () => {
    confirm.ask.mockResolvedValue(true);
    const harness = await open();

    harness.routeNativeElement!.querySelector<HTMLButtonElement>('tbody .button--danger')!.click();
    await harness.fixture.whenStable();

    expect(articleService.delete).toHaveBeenCalledWith(54);
    expect(articleService.mine).toHaveBeenCalledTimes(2);
  });

  it('keeps the article when delete is cancelled', async () => {
    confirm.ask.mockResolvedValue(false);
    const harness = await open();

    harness.routeNativeElement!.querySelector<HTMLButtonElement>('tbody .button--danger')!.click();
    await harness.fixture.whenStable();

    expect(articleService.delete).not.toHaveBeenCalled();
  });
});
