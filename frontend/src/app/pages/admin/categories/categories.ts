import { HttpErrorResponse } from '@angular/common/http';
import { Component, effect, ElementRef, inject, signal, viewChild } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CategoryService } from '../../../core/api/category.service';
import { CategoryStats } from '../../../core/models/category';
import { ConfirmService } from '../../../shared/confirm-dialog/confirm.service';
import { DataTable } from '../../../shared/data-table/data-table';

// same limits as the backend, checked after trimming
function nameProblem(name: string) {
  const length = name.trim().length;
  return length < 2 || length > 60 ? 'Use 2 to 60 characters.' : null;
}

// the server explains conflicts itself, e.g. "Category name is already in use"
function errorMessage(err: HttpErrorResponse) {
  if (err.status === 0) return "Can't reach the server. Check your connection and try again.";
  return err.error?.message ?? 'Something went wrong. Please try again.';
}

// admin only, uses the stats endpoint so drafts are counted too
@Component({
  imports: [ReactiveFormsModule, DataTable],
  selector: 'app-categories',
  styleUrl: './categories.scss',
  templateUrl: './categories.html',
})
export class Categories {
  private readonly categoryService = inject(CategoryService);
  private readonly confirm = inject(ConfirmService);

  protected readonly categories = rxResource({ stream: () => this.categoryService.stats() });

  readonly newName = new FormControl('', { nonNullable: true });
  readonly editName = new FormControl('', { nonNullable: true });

  protected readonly editingId = signal<number | null>(null);
  protected readonly saving = signal(false);
  protected readonly addError = signal<string | null>(null);
  protected readonly editError = signal<string | null>(null);
  protected readonly deleteError = signal<string | null>(null);

  private readonly editInput = viewChild<ElementRef<HTMLInputElement>>('editInput');

  constructor() {
    // move focus into the rename box when it opens, so keyboard users land in it
    effect(() => this.editInput()?.nativeElement.focus());
  }

  protected add(event: Event) {
    event.preventDefault();
    const name = this.newName.value;
    const problem = nameProblem(name);
    this.addError.set(problem);
    if (problem) return;

    this.saving.set(true);
    this.categoryService.create(name.trim()).subscribe({
      next: () => {
        this.saving.set(false);
        this.newName.reset();
        this.categories.reload();
      },
      error: (err: HttpErrorResponse) => {
        this.saving.set(false);
        this.addError.set(errorMessage(err));
      },
    });
  }

  protected startRename(category: CategoryStats) {
    this.editName.setValue(category.name);
    this.editError.set(null);
    this.editingId.set(category.id);
  }

  protected cancelRename() {
    this.editingId.set(null);
  }

  protected saveRename(event: Event, category: CategoryStats) {
    event.preventDefault();
    const name = this.editName.value;
    const problem = nameProblem(name);
    this.editError.set(problem);
    if (problem) return;

    this.saving.set(true);
    this.categoryService.rename(category.id, name.trim()).subscribe({
      next: () => {
        this.saving.set(false);
        this.editingId.set(null);
        this.categories.reload();
      },
      error: (err: HttpErrorResponse) => {
        this.saving.set(false);
        this.editError.set(errorMessage(err));
      },
    });
  }

  protected async remove(category: CategoryStats) {
    const confirmed = await this.confirm.ask({
      title: 'Delete this category?',
      message: `"${category.name}" will be removed. This can't be undone.`,
      confirmLabel: 'Delete',
    });
    if (!confirmed) return;

    this.deleteError.set(null);
    this.categoryService.delete(category.id).subscribe({
      next: () => this.categories.reload(),
      error: (err: HttpErrorResponse) => this.deleteError.set(errorMessage(err)),
    });
  }
}
