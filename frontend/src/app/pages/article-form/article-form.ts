import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize, map } from 'rxjs';
import { ArticleService } from '../../core/api/article.service';
import { CategoryService } from '../../core/api/category.service';
import { toFields, toMarkdown } from '../../core/articles/article-content';
import { AuthService } from '../../core/auth/auth.service';
import { ArticleStatus } from '../../core/models/article';
import { ArticleBody } from '../../shared/article-body/article-body';

type FieldName = 'title' | 'categoryId' | 'whenToUse' | 'steps';

// the server's message, plus each field's reason when validation fails
function errorMessage(err: HttpErrorResponse) {
  if (err.status === 0) return "Can't reach the server. Check your connection and try again.";
  if (err.status === 403) return 'You can only edit your own articles.';
  const details: string[] = err.error?.errors?.map((e: { message: string }) => e.message) ?? [];
  return [err.error?.message ?? 'Something went wrong. Please try again.', ...details].join(' ');
}

// one page for both /articles/new and /articles/:id/edit
@Component({
  imports: [ReactiveFormsModule, RouterLink, ArticleBody],
  selector: 'app-article-form',
  styleUrl: './article-form.scss',
  templateUrl: './article-form.html',
})
export class ArticleForm {
  private readonly router = inject(Router);
  private readonly articleService = inject(ArticleService);
  private readonly categoryService = inject(CategoryService);
  private readonly auth = inject(AuthService);

  // no id in the url means a new article
  protected readonly id = Number(inject(ActivatedRoute).snapshot.paramMap.get('id')) || null;

  readonly form = inject(NonNullableFormBuilder).group({
    title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(150)]],
    categoryId: [0, Validators.min(1)],
    status: ['DRAFT' as ArticleStatus],
    whenToUse: ['', Validators.required],
    steps: ['', Validators.required],
    customer: [''],
    escalate: [''],
    more: [''],
  });

  protected readonly categories = rxResource({
    stream: () => this.categoryService.list(),
    defaultValue: [],
  });

  protected readonly tab = signal<'write' | 'preview'>('write');
  protected readonly loading = signal(this.id !== null);
  protected readonly loadError = signal<string | null>(null);
  protected readonly saving = signal(false);
  protected readonly saveError = signal<string | null>(null);

  // the preview is built from the same boxes the save uses, so it matches the real page
  private readonly values = toSignal(
    this.form.valueChanges.pipe(map(() => this.form.getRawValue())),
    {
      initialValue: this.form.getRawValue(),
    },
  );
  protected readonly previewTitle = computed(
    () => this.values().title.trim() || 'Untitled article',
  );
  protected readonly previewContent = computed(() => {
    const { title, categoryId, status, ...fields } = this.values();
    return toMarkdown(title, fields);
  });

  constructor() {
    if (this.id) this.load(this.id);
  }

  showError(name: FieldName) {
    const control = this.form.controls[name];
    return control.invalid && control.touched;
  }

  protected save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.tab.set('write');
      return;
    }

    const { title, categoryId, status, ...fields } = this.form.getRawValue();
    const input = { title: title.trim(), categoryId, status, content: toMarkdown(title, fields) };
    const request = this.id
      ? this.articleService.update(this.id, input)
      : this.articleService.create(input);

    this.saving.set(true);
    this.saveError.set(null);
    request.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: (article) => void this.router.navigate(['/articles', article.id]),
      error: (err: HttpErrorResponse) => this.saveError.set(errorMessage(err)),
    });
  }

  // fills the boxes from the saved markdown, someone else's article is refused before showing the form
  private load(id: number) {
    this.articleService
      .get(id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (article) => {
          if (!this.auth.canEditArticle(article.author.id)) {
            this.loadError.set('You can only edit your own articles.');
            return;
          }
          this.form.setValue({
            title: article.title,
            categoryId: article.category.id,
            status: article.status,
            ...toFields(article.content),
          });
        },
        error: (err: HttpErrorResponse) =>
          this.loadError.set(
            err.status === 404
              ? 'This article no longer exists.'
              : "Couldn't load the article. Please try again.",
          ),
      });
  }
}
