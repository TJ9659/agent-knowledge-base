import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { ArticleService } from '../../core/api/article.service';
import { ArticleListItem } from '../../core/models/article';
import { ConfirmService } from '../../shared/confirm-dialog/confirm.service';
import { DataTable } from '../../shared/data-table/data-table';
import { Pagination } from '../../shared/pagination/pagination';
import { StatusBadge } from '../../shared/status-badge/status-badge';

// your own articles in any status, the route only lets editors and admins in
@Component({
  imports: [RouterLink, DatePipe, DataTable, Pagination, StatusBadge],
  selector: 'app-my-articles',
  styleUrl: './my-articles.scss',
  templateUrl: './my-articles.html',
})
export class MyArticles {
  private readonly router = inject(Router);
  private readonly articleService = inject(ArticleService);
  private readonly confirm = inject(ConfirmService);

  // the page lives in the url like the article list, so refresh keeps it
  protected readonly page = toSignal(
    inject(ActivatedRoute).queryParamMap.pipe(map((params) => Number(params.get('page')) || 1)),
    { requireSync: true },
  );

  protected readonly articles = rxResource({
    params: () => this.page(),
    stream: ({ params }) => this.articleService.mine(params),
  });

  protected readonly deleteError = signal<string | null>(null);

  protected goToPage(page: number) {
    void this.router.navigate(['/my-articles'], { queryParams: { page } });
  }

  protected async remove(article: ArticleListItem) {
    const confirmed = await this.confirm.ask({
      title: 'Delete this article?',
      message: `"${article.title}" will be removed for everyone. This can't be undone.`,
      confirmLabel: 'Delete',
    });
    if (!confirmed) return;

    this.deleteError.set(null);
    this.articleService.delete(article.id).subscribe({
      next: () => this.afterDelete(),
      error: () => this.deleteError.set(`Couldn't delete "${article.title}". Please try again.`),
    });
  }

  // deleting the only row on a later page would leave it empty, so step back a page
  private afterDelete() {
    const result = this.articles.value();
    if (result && result.data.length === 1 && result.page > 1) {
      this.goToPage(result.page - 1);
    } else {
      this.articles.reload();
    }
  }
}
