import { Component, effect, ElementRef, inject, viewChild } from '@angular/core';
import { ConfirmService } from './confirm.service';

// the native dialog handles focus, the Esc key and the dimmed backdrop
@Component({
  imports: [],
  selector: 'app-confirm-dialog',
  styleUrl: './confirm-dialog.scss',
  templateUrl: './confirm-dialog.html',
})
export class ConfirmDialog {
  protected readonly confirm = inject(ConfirmService);
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  constructor() {
    // open and close the dialog to match the current question
    effect(() => {
      const dialog = this.dialog().nativeElement;
      const asking = this.confirm.request() !== null;
      if (asking && !dialog.open) dialog.showModal();
      if (!asking && dialog.open) dialog.close();
    });
  }
}
