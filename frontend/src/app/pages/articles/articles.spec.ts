import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { ArticleService } from '../../core/api/article.service';
import { CategoryService } from '../../core/api/category.service';
import { AuthService } from '../../core/auth/auth.service';
import { ArticleListItem } from '../../core/models/article';
import { Paginated } from '../../core/models/paginated';
import { Articles } from './articles';

const article: ArticleListItem = {
  id: 7,
  title: 'Handling a double charge',
  snippet: 'When to use: the customer sees the same charge twice.',
  status: 'PUBLISHED',
  createdAt: '2026-11-23T00:00:00.000Z',
  updatedAt: '2026-11-23T00:00:00.000Z',
  category: { id: 13, name: 'Billing & Payments' },
  author: { id: 2, name: 'Daniel Tan' },
};

const page = (data: ArticleListItem[], total = data.length): Paginated<ArticleListItem> => ({
  data,
  page: 1,
  pageSize: 10,
  total,
});

// visible text with line breaks and repeated spaces collapsed
const text = (element: Element) => element.textContent?.replace(/\s+/g, ' ').trim();

describe('Articles', () => {
  const articleService = { list: vi.fn() };
  const categories = [
    { id: 13, name: 'Billing & Payments', articleCount: 4 },
    { id: 14, name: 'Policies', articleCount: 1 },
  ];

  // opens the real /articles route so the query string drives the page
  async function open(url: string) {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'articles', component: Articles }]),
        { provide: ArticleService, useValue: articleService },
        { provide: CategoryService, useValue: { list: () => of(categories) } },
        { provide: AuthService, useValue: { hasRole: () => false } },
      ],
    });
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(url, Articles);
    await harness.fixture.whenStable();
    harness.detectChanges();
    return harness;
  }

  beforeEach(() => articleService.list.mockReset());

  it('loads with the filters from the url', async () => {
    articleService.list.mockReturnValue(of(page([article])));

    await open('/articles?q=charge&categoryId=13&page=2');

    expect(articleService.list).toHaveBeenCalledWith({ q: 'charge', categoryId: 13, page: 2 });
  });

  it('shows a card that links to the article', async () => {
    articleService.list.mockReturnValue(of(page([article])));

    const harness = await open('/articles');
    const card = harness.routeNativeElement!.querySelector<HTMLAnchorElement>('.card')!;

    expect(card.textContent).toContain('Handling a double charge');
    expect(card.textContent).toContain('Billing & Payments');
    expect(card.getAttribute('href')).toBe('/articles/7');
  });

  it('lists categories with counts and an all articles total', async () => {
    articleService.list.mockReturnValue(of(page([article])));

    const harness = await open('/articles?categoryId=14');
    const links = Array.from(harness.routeNativeElement!.querySelectorAll('.categories a'));

    const rows = links.map((link) => Array.from(link.querySelectorAll('span'), text));
    expect(rows).toEqual([
      ['All articles', '5'],
      ['Billing & Payments', '4'],
      ['Policies', '1'],
    ]);
    expect(links[2].classList.contains('is-active')).toBe(true);
  });

  it('puts a search into the url and goes back to page 1', async () => {
    articleService.list.mockReturnValue(of(page([article])));
    const harness = await open('/articles?page=3');
    const element = harness.routeNativeElement!;

    element.querySelector<HTMLInputElement>('#search')!.value = '  refund  ';
    element.querySelector('form')!.dispatchEvent(new Event('submit'));
    await harness.fixture.whenStable();

    expect(TestBed.inject(Router).url).toBe('/articles?q=refund');
  });

  it('searches by itself once typing pauses, ignoring words under 3 letters', async () => {
    articleService.list.mockReturnValue(of(page([article])));
    const harness = await open('/articles');
    const router = TestBed.inject(Router);
    const input = harness.routeNativeElement!.querySelector<HTMLInputElement>('#search')!;
    const type = (value: string) => {
      input.value = value;
      input.dispatchEvent(new Event('input'));
    };
    const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    type('do');
    await wait(350);
    expect(router.url).toBe('/articles');

    type('double charge');
    expect(router.url).toBe('/articles');
    await wait(350);
    await harness.fixture.whenStable();

    expect(router.url).toBe('/articles?q=double%20charge');
  });

  it('says so when nothing matches', async () => {
    articleService.list.mockReturnValue(of(page([])));

    const harness = await open('/articles?q=xylophone');

    const element = harness.routeNativeElement!;
    expect(text(element)).toContain('No articles match');
    expect(text(element.querySelector('.summary')!)).toContain('0 articles for “xylophone”');
  });

  it('offers to try again when loading fails', async () => {
    articleService.list.mockReturnValueOnce(throwError(() => new Error('offline')));
    articleService.list.mockReturnValue(of(page([article])));

    const harness = await open('/articles');
    expect(harness.routeNativeElement!.textContent).toContain("Couldn't load articles");

    harness.routeNativeElement!.querySelector<HTMLButtonElement>('.status--error button')!.click();
    await harness.fixture.whenStable();
    harness.detectChanges();

    expect(harness.routeNativeElement!.textContent).toContain('Handling a double charge');
  });
});
