import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { ArticleService } from '../../core/api/article.service';
import { AuthService } from '../../core/auth/auth.service';
import { ConfirmService } from '../../shared/confirm-dialog/confirm.service';
import { Markdown } from '../../shared/markdown/markdown';
import { StatusBadge } from '../../shared/status-badge/status-badge';

type SectionKind = 'customer' | 'escalate' | 'plain';

interface Section {
  heading: string;
  body: string;
  kind: SectionKind;
}

// headings every article uses, written by editors in the seed and the form
const SECTION_KINDS: Record<string, SectionKind> = {
  'what to tell the customer': 'customer',
  'escalate if': 'escalate',
};

// splits an article on its "## " headings so the customer and escalation parts can stand out
function splitSections(markdown: string) {
  const [intro, ...parts] = markdown.replace(/^\s*# .*\n?/, '').split(/^## /m);
  const sections: Section[] = parts.map((part) => {
    const [heading = '', ...lines] = part.split('\n');
    const title = heading.trim();
    return {
      heading: title,
      body: lines.join('\n').trim(),
      kind: SECTION_KINDS[title.toLowerCase()] ?? 'plain',
    };
  });
  return { intro: (intro ?? '').trim(), sections };
}

@Component({
  imports: [RouterLink, DatePipe, Markdown, StatusBadge],
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
    {
      requireSync: true,
    },
  );

  protected readonly article = rxResource({
    params: () => this.id(),
    stream: ({ params }) => this.articleService.get(params),
  });

  protected readonly parts = computed(() => {
    const article = this.article.value();
    return article ? splitSections(article.content) : null;
  });

  // a missing article and someone else's draft both come back as 404
  protected readonly notFound = computed(() => {
    const error = this.article.error();
    return error instanceof HttpErrorResponse && error.status === 404;
  });

  // same rule as the backend, which still checks on delete and save
  protected readonly canEdit = computed(() => {
    const article = this.article.value();
    const user = this.auth.user();
    return !!article && !!user && (user.role === 'ADMIN' || article.author.id === user.id);
  });

  protected readonly copied = signal<string | null>(null);
  protected readonly deleteError = signal<string | null>(null);

  protected async copy(heading: string, element: HTMLElement) {
    try {
      await navigator.clipboard.writeText(element.innerText);
      this.copied.set(heading);
      setTimeout(() => this.copied.set(null), 2000);
    } catch {
      // clipboard blocked by the browser, the text can still be selected by hand
    }
  }

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
