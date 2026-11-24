import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfirmDialog } from './confirm-dialog';
import { ConfirmService } from './confirm.service';

describe('ConfirmDialog', () => {
  let fixture: ComponentFixture<ConfirmDialog>;
  let confirm: ConfirmService;

  beforeEach(async () => {
    // the test browser has no real modal dialogs, so fake opening and closing
    HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
      this.setAttribute('open', '');
    });
    HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
      this.removeAttribute('open');
    });

    await TestBed.configureTestingModule({ imports: [ConfirmDialog] }).compileComponents();
    fixture = TestBed.createComponent(ConfirmDialog);
    confirm = TestBed.inject(ConfirmService);
    fixture.detectChanges();
  });

  const dialog = () => (fixture.nativeElement as HTMLElement).querySelector('dialog')!;

  it('opens with the question and answers when a button is clicked', async () => {
    const answer = confirm.ask({ title: 'Delete article?', message: 'This cannot be undone.', confirmLabel: 'Delete' });
    fixture.detectChanges();

    expect(dialog().open).toBe(true);
    expect(dialog().textContent).toContain('Delete article?');

    dialog().querySelector<HTMLButtonElement>('.danger')!.click();
    fixture.detectChanges();

    expect(await answer).toBe(true);
    expect(dialog().open).toBe(false);
  });

  it('cancel answers no', async () => {
    const answer = confirm.ask({ title: 'Delete article?', message: 'Sure?', confirmLabel: 'Delete' });
    fixture.detectChanges();

    dialog().querySelector<HTMLButtonElement>('.cancel')!.click();

    expect(await answer).toBe(false);
  });
});
