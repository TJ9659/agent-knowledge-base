import { Service, signal } from '@angular/core';

export interface ConfirmRequest {
  title: string;
  message: string;
  confirmLabel: string;
}

// lets any page ask "are you sure?" and wait for the answer, the dialog in the main layout shows it
@Service()
export class ConfirmService {
  private readonly current = signal<ConfirmRequest | null>(null);
  readonly request = this.current.asReadonly();
  private resolve: ((confirmed: boolean) => void) | null = null;

  ask(request: ConfirmRequest) {
    // a new question cancels one that was never answered
    this.resolve?.(false);
    this.current.set(request);
    return new Promise<boolean>((resolve) => (this.resolve = resolve));
  }

  answer(confirmed: boolean) {
    this.resolve?.(confirmed);
    this.resolve = null;
    this.current.set(null);
  }
}
