import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { ArticleService } from '../../core/api/article.service';
import { AuthService } from '../../core/auth/auth.service';
import { ArticleBody } from '../../shared/article-body/article-body';
import { ConfirmService } from '../../shared/confirm-dialog/confirm.service';
import { StatusBadge } from '../../shared/status-badge/status-badge';

@Component({
  imports: [RouterLink, DatePipe, ArticleBody, StatusBadge],
  selector: 'app-article-detail',
  styleUrl: './article-detail.scss',
  templateUrl: './article-detail.html',
})
export class ArticleDetail {
  private readonly router = inject(Router);
  private readonly articleService = inject(ArticleService);
  private readonly confirm = inject(ConfirmService);
  private readonly auth = inject(AuthService);

  private readonly id = toSignal(
    inject(ActivatedRoute).paramMap.pipe(map((params) => Number(params.get('id')))),
    { requireSync: true },
  );

  protected readonly article = rxResource({
    params: () => this.id(),
    stream: ({ params }) => this.articleService.get(params),
  });

  // a missing article and someone else's draft both come back as 404
  protected readonly notFound = computed(() => {
    const error = this.article.error();
    return error instanceof HttpErrorResponse && error.status === 404;
  });

  protected readonly canEdit = computed(() => {
    const article = this.article.value();
    return !!article && this.auth.canEditArticle(article.author.id);
  });

  protected readonly deleteError = signal<string | null>(null);

  protected async remove() {
    const article = this.article.value();
    if (!article) return;

    const confirmed = await this.confirm.ask({
      title: 'Delete this article?',
      message: `"${article.title}" will be removed for everyone. This can't be undone.`,
      confirmLabel: 'Delete',
    });
    if (!confirmed) return;

    this.articleService.delete(article.id).subscribe({
      next: () => void this.router.navigate(['/articles']),
      error: () => this.deleteError.set("Couldn't delete the article. Please try again."),
    });
  }
}
