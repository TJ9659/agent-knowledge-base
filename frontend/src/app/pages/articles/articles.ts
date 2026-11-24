import { DatePipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { rxResource, takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, ParamMap, Params, Router, RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged, map, Subject } from 'rxjs';
import { ArticleQuery, ArticleService } from '../../core/api/article.service';
import { CategoryService } from '../../core/api/category.service';
import { Pagination } from '../../shared/pagination/pagination';

// reads the filters from the url, missing or bad values fall back to defaults
function toQuery(params: ParamMap): ArticleQuery {
  return {
    q: params.get('q') ?? undefined,
    categoryId: Number(params.get('categoryId')) || undefined,
    page: Number(params.get('page')) || 1,
  };
}

// mysql ignores words under 3 letters, so a shorter search just shows the normal list
function cleanSearch(text: string) {
  const q = text.trim();
  return q.length >= 3 ? q : null;
}

@Component({
  imports: [RouterLink, DatePipe, Pagination],
  selector: 'app-articles',
  styleUrl: './articles.scss',
  templateUrl: './articles.html',
})
export class Articles {
  private readonly router = inject(Router);
  private readonly articleService = inject(ArticleService);
  private readonly categoryService = inject(CategoryService);
  private readonly typing = new Subject<string>();

  // the url holds the filters, so refresh, back and shared links keep them
  protected readonly query = toSignal(inject(ActivatedRoute).queryParamMap.pipe(map(toQuery)), {
    requireSync: true,
  });

  // reloads by itself whenever the query changes
  protected readonly articles = rxResource({
    params: () => this.query(),
    stream: ({ params }) => this.articleService.list(params),
  });

  protected readonly categories = rxResource({
    stream: () => this.categoryService.list(),
    defaultValue: [],
  });

  protected readonly totalPublished = computed(() =>
    this.categories.value().reduce((sum, category) => sum + category.articleCount, 0),
  );

  protected readonly selectedCategory = computed(() =>
    this.categories.value().find((category) => category.id === this.query().categoryId),
  );

  constructor() {
    // search 300ms after the last keystroke, and replace the url so back skips each letter
    this.typing
      .pipe(debounceTime(300), map(cleanSearch), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe((q) => this.updateUrl({ q, page: null }, { replaceUrl: true }));
  }

  protected onType(text: string) {
    this.typing.next(text);
  }

  protected search(event: Event, text: string) {
    // pressing enter will search right away
    event.preventDefault();
    this.updateUrl({ q: cleanSearch(text), page: null });
  }

  protected goToPage(page: number) {
    this.updateUrl({ page });
  }

  // null removes a filter from the url, page goes back to 1 when the filters change
  private updateUrl(changes: Params, options: { replaceUrl?: boolean } = {}) {
    void this.router.navigate(['/articles'], {
      queryParams: changes,
      queryParamsHandling: 'merge',
      ...options,
    });
  }
}
