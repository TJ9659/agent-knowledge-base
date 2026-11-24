import { HttpErrorResponse } from '@angular/common/http';
import { Component, effect, ElementRef, inject, signal, viewChild } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, map } from 'rxjs';
import { UserService } from '../../../core/api/user.service';
import { AuthService } from '../../../core/auth/auth.service';
import { Role, ROLE_LABELS, User, UserChanges } from '../../../core/models/user';
import { ConfirmService } from '../../../shared/confirm-dialog/confirm.service';
import { DataTable } from '../../../shared/data-table/data-table';
import { Pagination } from '../../../shared/pagination/pagination';

type FieldName = 'name' | 'email' | 'password';

// the server's message, plus each field's reason when validation fails
function errorMessage(err: HttpErrorResponse) {
  if (err.status === 0) return "Can't reach the server. Check your connection and try again.";
  const details: string[] = err.error?.errors?.map((e: { message: string }) => e.message) ?? [];
  return [err.error?.message ?? 'Something went wrong. Please try again.', ...details].join(' ');
}

// admin only: there is no public sign up, accounts are created here
@Component({
  imports: [ReactiveFormsModule, DataTable, Pagination],
  selector: 'app-users',
  styleUrl: './users.scss',
  templateUrl: './users.html',
})
export class Users {
  private readonly router = inject(Router);
  private readonly userService = inject(UserService);
  private readonly confirm = inject(ConfirmService);
  private readonly fb = inject(NonNullableFormBuilder);

  // you can rename yourself, but not change your own role or deactivate yourself, the backend refuses too
  protected readonly currentUserId = inject(AuthService).user()?.id;
  protected readonly roles: Role[] = ['AGENT', 'EDITOR', 'ADMIN'];
  protected readonly roleLabels = ROLE_LABELS;

  protected readonly page = toSignal(
    inject(ActivatedRoute).queryParamMap.pipe(map((params) => Number(params.get('page')) || 1)),
    { requireSync: true },
  );

  protected readonly users = rxResource({
    params: () => this.page(),
    stream: ({ params }) => this.userService.list(params),
  });

  readonly createForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(100)]],
    role: ['AGENT' as Role],
  });

  // one row at a time is edited in place, nothing is saved until Save
  readonly editForm = this.fb.group({ name: [''], role: ['AGENT' as Role] });

  protected readonly showCreate = signal(false);
  protected readonly creating = signal(false);
  protected readonly createError = signal<string | null>(null);
  protected readonly editingId = signal<number | null>(null);
  protected readonly saving = signal(false);
  protected readonly editError = signal<string | null>(null);
  protected readonly notice = signal<string | null>(null);
  protected readonly actionError = signal<string | null>(null);

  private readonly editName = viewChild<ElementRef<HTMLInputElement>>('editName');

  constructor() {
    // move focus into the name box when a row opens for editing
    effect(() => this.editName()?.nativeElement.focus());
  }

  showError(name: FieldName) {
    const control = this.createForm.controls[name];
    return control.invalid && control.touched;
  }

  protected goToPage(page: number) {
    void this.router.navigate(['/admin/users'], { queryParams: { page } });
  }

  protected create() {
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }

    this.creating.set(true);
    this.createError.set(null);
    this.userService
      .create(this.createForm.getRawValue())
      .pipe(finalize(() => this.creating.set(false)))
      .subscribe({
        next: (user) => {
          this.done(`Added ${user.name}. They can log in now.`);
          this.createForm.reset();
          this.showCreate.set(false);
        },
        error: (err: HttpErrorResponse) => this.createError.set(errorMessage(err)),
      });
  }

  protected startEdit(user: User) {
    this.editForm.setValue({ name: user.name, role: user.role });
    const role = this.editForm.controls.role;
    if (user.id === this.currentUserId) role.disable();
    else role.enable();
    this.editError.set(null);
    this.editingId.set(user.id);
  }

  protected cancelEdit() {
    this.editingId.set(null);
  }

  protected saveEdit(user: User) {
    const name = this.editForm.controls.name.value.trim();
    const role = this.editForm.controls.role.value;
    if (name.length < 2 || name.length > 100) {
      this.editError.set('Enter a name of 2 to 100 characters.');
      return;
    }

    // only send what changed, nothing changed means nothing to save
    const changes: UserChanges = {};
    if (name !== user.name) changes.name = name;
    if (role !== user.role) changes.role = role;
    if (Object.keys(changes).length === 0) {
      this.cancelEdit();
      return;
    }

    this.saving.set(true);
    this.userService
      .update(user.id, changes)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => {
          this.editingId.set(null);
          this.done(
            changes.role
              ? `${name} is now ${this.roleLabels[role]}. They'll need to sign in again.`
              : `Saved ${name}.`,
          );
        },
        error: (err: HttpErrorResponse) => this.editError.set(errorMessage(err)),
      });
  }

  protected async deactivate(user: User) {
    const confirmed = await this.confirm.ask({
      title: `Deactivate ${user.name}?`,
      message: "They'll be logged out and can't log in until reactivated. Their articles stay.",
      confirmLabel: 'Deactivate',
    });
    if (!confirmed) return;

    this.userService.deactivate(user.id).subscribe({
      next: () => this.done(`${user.name} is deactivated.`),
      error: (err: HttpErrorResponse) => this.actionError.set(errorMessage(err)),
    });
  }

  protected reactivate(user: User) {
    this.userService.update(user.id, { isActive: true }).subscribe({
      next: () => this.done(`${user.name} can log in again.`),
      error: (err: HttpErrorResponse) => this.actionError.set(errorMessage(err)),
    });
  }

  // after any change: say what happened and reload the table
  private done(message: string) {
    this.actionError.set(null);
    this.notice.set(message);
    this.users.reload();
  }
}
