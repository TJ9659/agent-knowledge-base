import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { CategoryService } from '../../../core/api/category.service';
import { ConfirmService } from '../../../shared/confirm-dialog/confirm.service';
import { Categories } from './categories';

const stats = [
  { id: 13, name: 'Billing & Payments', total: 4, published: 4, drafts: 0 },
  { id: 20, name: 'Roaming', total: 0, published: 0, drafts: 0 },
];

describe('Categories', () => {
  const categoryService = { stats: vi.fn(), create: vi.fn(), rename: vi.fn(), delete: vi.fn() };
  const confirm = { ask: vi.fn() };
  let fixture: ComponentFixture<Categories>;

  const element = () => fixture.nativeElement as HTMLElement;
  const settle = async () => {
    await fixture.whenStable();
    fixture.detectChanges();
  };

  beforeEach(async () => {
    categoryService.stats.mockReset().mockReturnValue(of(stats));
    categoryService.create.mockReset().mockReturnValue(of({ id: 21, name: 'Travel' }));
    categoryService.rename.mockReset().mockReturnValue(of({ id: 20, name: 'Travel' }));
    categoryService.delete.mockReset().mockReturnValue(of(undefined));
    confirm.ask.mockReset();

    await TestBed.configureTestingModule({
      imports: [Categories],
      providers: [
        { provide: CategoryService, useValue: categoryService },
        { provide: ConfirmService, useValue: confirm },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(Categories);
    await settle();
  });

  it('lists each category with its counts', () => {
    const cells = Array.from(element().querySelectorAll('tbody tr:first-child td'), (td) =>
      td.textContent?.trim(),
    );
    expect(cells.slice(0, 4)).toEqual(['Billing & Payments', '4', '4', '0']);
  });

  it('adds a trimmed name and reloads', async () => {
    fixture.componentInstance.newName.setValue('  Travel  ');
    element().querySelector<HTMLFormElement>('form.add')!.dispatchEvent(new Event('submit'));
    await settle();

    expect(categoryService.create).toHaveBeenCalledWith('Travel');
    expect(categoryService.stats).toHaveBeenCalledTimes(2);
    expect(fixture.componentInstance.newName.value).toBe('');
  });

  it('checks the length before sending', async () => {
    fixture.componentInstance.newName.setValue(' a ');
    element().querySelector<HTMLFormElement>('form.add')!.dispatchEvent(new Event('submit'));
    await settle();

    expect(categoryService.create).not.toHaveBeenCalled();
    expect(element().textContent).toContain('Use 2 to 60 characters.');
  });

  it('shows the server message for a duplicate name', async () => {
    categoryService.create.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 409,
            error: { message: 'Category name is already in use' },
          }),
      ),
    );
    fixture.componentInstance.newName.setValue('Roaming');
    element().querySelector<HTMLFormElement>('form.add')!.dispatchEvent(new Event('submit'));
    await settle();

    expect(element().querySelector('.add [role="alert"]')?.textContent).toContain(
      'Category name is already in use',
    );
  });

  it('renames in place', async () => {
    const roamingRow = element().querySelectorAll('tbody tr')[1];
    roamingRow.querySelector<HTMLButtonElement>('.actions .button')!.click();
    await settle();

    const input = element().querySelector<HTMLInputElement>('form.rename input')!;
    expect(input.value).toBe('Roaming');

    fixture.componentInstance.editName.setValue('Travel');
    element().querySelector<HTMLFormElement>('form.rename')!.dispatchEvent(new Event('submit'));
    await settle();

    expect(categoryService.rename).toHaveBeenCalledWith(20, 'Travel');
    expect(element().querySelector('form.rename')).toBeNull();
  });

  it('only lets an empty category be deleted', async () => {
    confirm.ask.mockResolvedValue(true);
    const [billing, roaming] = Array.from(
      element().querySelectorAll<HTMLButtonElement>('.button--danger'),
    );

    expect(billing.disabled).toBe(true);
    roaming.click();
    await settle();

    expect(categoryService.delete).toHaveBeenCalledWith(20);
    expect(categoryService.stats).toHaveBeenCalledTimes(2);
  });
});
