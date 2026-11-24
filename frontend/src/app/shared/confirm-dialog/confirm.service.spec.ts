import { TestBed } from '@angular/core/testing';
import { ConfirmService } from './confirm.service';

describe('ConfirmService', () => {
  let confirm: ConfirmService;
  const question = { title: 'Delete article?', message: 'This cannot be undone.', confirmLabel: 'Delete' };

  beforeEach(() => {
    confirm = TestBed.inject(ConfirmService);
  });

  it('shows the question and resolves with the answer', async () => {
    const answer = confirm.ask(question);
    expect(confirm.request()).toEqual(question);

    confirm.answer(true);

    expect(await answer).toBe(true);
    expect(confirm.request()).toBeNull();
  });

  it('treats a new question as cancelling the old one', async () => {
    const first = confirm.ask(question);
    confirm.ask({ ...question, title: 'Delete category?' });

    expect(await first).toBe(false);
  });
});
