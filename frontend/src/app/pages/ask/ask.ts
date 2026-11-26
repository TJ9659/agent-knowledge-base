import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AskService } from '../../core/api/ask.service';
import { AskAnswer } from '../../core/models/ask';
import { Markdown } from '../../shared/markdown/markdown';
import { errorMessage } from '../../core/api/error-message';

const EXAMPLES = [
  'Customer was charged twice, what do I do?',
  'Caller forgot their app password',
  'Customer wants to cancel their contract',
];

@Component({
  imports: [ReactiveFormsModule, RouterLink, Markdown],
  selector: 'app-ask',
  styleUrl: './ask.scss',
  templateUrl: './ask.html',
})
export class Ask {
  private readonly askService = inject(AskService);

  readonly examples = EXAMPLES;
  readonly form = inject(NonNullableFormBuilder).group({
    question: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(500)]],
  });
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly result = signal<AskAnswer | null>(null);
  // kept apart from the box, so editing the box doesn't change the shown answer's question
  readonly asked = signal('');

  showError() {
    const control = this.form.controls.question;
    return control.invalid && control.touched;
  }

  askExample(question: string) {
    this.form.setValue({ question });
    this.submit();
  }

  submit() {
    if (this.loading()) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const question = this.form.getRawValue().question.trim();
    this.loading.set(true);
    this.error.set(null);
    this.result.set(null);
    this.asked.set(question);

    this.askService
      .ask(question)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (answer) => this.result.set(answer),
        error: (err: HttpErrorResponse) => this.error.set(errorMessage(err)),
      });
  }
}
