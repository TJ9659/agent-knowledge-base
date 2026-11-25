import { HttpErrorResponse } from '@angular/common/http';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { UserService } from '../../../core/api/user.service';
import { AuthService } from '../../../core/auth/auth.service';
import { User } from '../../../core/models/user';
import { ConfirmService } from '../../../shared/confirm-dialog/confirm.service';
import { Users } from './users';

const userWith = (id: number, name: string, role: User['role'], isActive = true): User => ({
  id,
  name,
  email: `${name.split(' ')[0].toLowerCase()}@nexora.test`,
  role,
  isActive,
  isProtected: false,
  createdAt: '2026-11-23T00:00:00.000Z',
});

const admin = { ...userWith(1, 'Admin User', 'ADMIN'), isProtected: true };
const agent = userWith(4, 'Hafiz Ismail', 'AGENT');
const inactive = userWith(5, 'Mei Ling Wong', 'AGENT', false);

describe('Users', () => {
  const userService = { list: vi.fn(), create: vi.fn(), update: vi.fn(), deactivate: vi.fn() };
  const confirm = { ask: vi.fn() };

  async function open() {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'admin/users', component: Users }]),
        { provide: UserService, useValue: userService },
        { provide: ConfirmService, useValue: confirm },
        { provide: AuthService, useValue: { user: signal(admin) } },
      ],
    });
    const harness = await RouterTestingHarness.create();
    const page = await harness.navigateByUrl('/admin/users', Users);
    await harness.fixture.whenStable();
    harness.detectChanges();
    const settle = async () => {
      await harness.fixture.whenStable();
      harness.detectChanges();
    };
    return { page, element: harness.routeNativeElement!, settle };
  }

  const rowFor = (element: HTMLElement, name: string) =>
    Array.from(element.querySelectorAll('tbody tr')).find((row) =>
      row.textContent?.includes(name),
    )!;

  const buttonIn = (row: Element, label: string) =>
    Array.from(row.querySelectorAll<HTMLButtonElement>('button')).find(
      (b) => b.textContent?.trim() === label,
    )!;

  beforeEach(() => {
    userService.list
      .mockReset()
      .mockReturnValue(of({ data: [admin, agent, inactive], page: 1, pageSize: 10, total: 3 }));
    userService.create.mockReset().mockReturnValue(of(userWith(6, 'Nur Aina', 'AGENT')));
    userService.update.mockReset().mockReturnValue(of(agent));
    userService.deactivate.mockReset().mockReturnValue(of(undefined));
    confirm.ask.mockReset();
  });

  it('lists users with their role and status, and marks your own row', async () => {
    const { element } = await open();

    expect(element.querySelectorAll('tbody tr').length).toBe(3);
    expect(rowFor(element, 'Admin User').textContent).toContain('you');
    expect(rowFor(element, 'Admin User').textContent).toContain('Admin');
    expect(rowFor(element, 'Hafiz').textContent).toContain('Agent');
    expect(buttonIn(rowFor(element, 'Admin User'), 'Deactivate').disabled).toBe(true);
    expect(rowFor(element, 'Mei Ling').textContent).toContain('Deactivated');
  });

  it('does not send an incomplete new user', async () => {
    const { element, settle } = await open();
    element.querySelector<HTMLButtonElement>('.heading .button--primary')!.click();
    await settle();

    element.querySelector<HTMLButtonElement>('form.create button[type="submit"]')!.click();
    await settle();

    expect(userService.create).not.toHaveBeenCalled();
    expect(element.textContent).toContain('Use at least 8 characters.');
  });

  it('adds a user and reloads the list', async () => {
    const { page, element, settle } = await open();
    element.querySelector<HTMLButtonElement>('.heading .button--primary')!.click();
    await settle();
    page.createForm.setValue({
      name: 'Nur Aina',
      email: 'nur@nexora.test',
      password: 'Password123!',
      role: 'EDITOR',
    });

    element.querySelector<HTMLButtonElement>('form.create button[type="submit"]')!.click();
    await settle();

    expect(userService.create).toHaveBeenCalledWith({
      name: 'Nur Aina',
      email: 'nur@nexora.test',
      password: 'Password123!',
      role: 'EDITOR',
    });
    expect(userService.list).toHaveBeenCalledTimes(2);
    expect(element.querySelector('[role="status"]')?.textContent).toContain('Added Nur Aina');
  });

  it('shows the server message for an email already in use', async () => {
    userService.create.mockReturnValue(
      throwError(
        () => new HttpErrorResponse({ status: 409, error: { message: 'Email is already in use' } }),
      ),
    );
    const { page, element, settle } = await open();
    element.querySelector<HTMLButtonElement>('.heading .button--primary')!.click();
    await settle();
    page.createForm.setValue({
      name: 'Copy',
      email: 'agent@nexora.test',
      password: 'Password123!',
      role: 'AGENT',
    });

    element.querySelector<HTMLButtonElement>('form.create button[type="submit"]')!.click();
    await settle();

    expect(element.querySelector('form.create [role="alert"]')?.textContent).toContain(
      'Email is already in use',
    );
  });

  it('edits a row in place and only saves on Save', async () => {
    const { page, element, settle } = await open();
    buttonIn(rowFor(element, 'Hafiz'), 'Edit').click();
    await settle();

    expect(page.editForm.getRawValue()).toEqual({
      name: 'Hafiz Ismail',
      email: 'hafiz@nexora.test',
      role: 'AGENT',
    });
    page.editForm.controls.role.setValue('EDITOR');
    expect(userService.update).not.toHaveBeenCalled();

    buttonIn(element.querySelector('tr.is-editing')!, 'Save').click();
    await settle();

    expect(userService.update).toHaveBeenCalledWith(4, { role: 'EDITOR' });
    expect(element.querySelector('[role="status"]')?.textContent).toContain(
      "Hafiz Ismail is now Editor. They'll need to sign in again.",
    );
    expect(element.querySelector('tr.is-editing')).toBeNull();
  });

  it('cancel and Esc leave the user unchanged', async () => {
    const { page, element, settle } = await open();
    buttonIn(rowFor(element, 'Hafiz'), 'Edit').click();
    await settle();
    page.editForm.controls.role.setValue('ADMIN');

    element
      .querySelector('tr.is-editing')!
      .dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await settle();

    expect(element.querySelector('tr.is-editing')).toBeNull();
    expect(userService.update).not.toHaveBeenCalled();
  });

  it('keeps the row open with the reason when saving is refused', async () => {
    userService.update.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 400, error: { message: 'Not allowed' } })),
    );
    const { page, element, settle } = await open();
    buttonIn(rowFor(element, 'Hafiz'), 'Edit').click();
    await settle();
    page.editForm.controls.role.setValue('ADMIN');

    buttonIn(element.querySelector('tr.is-editing')!, 'Save').click();
    await settle();

    expect(element.querySelector('tr.is-editing')).not.toBeNull();
    expect(element.querySelector('tr.edit-note [role="alert"]')?.textContent).toContain(
      'Not allowed',
    );
  });

  it('locks the system admin: only the name can change', async () => {
    const { page, element, settle } = await open();
    const row = rowFor(element, 'Admin User');

    expect(row.textContent).toContain('System admin');
    expect(buttonIn(row, 'Deactivate').disabled).toBe(true);

    buttonIn(row, 'Edit').click();
    await settle();
    expect(page.editForm.controls.role.disabled).toBe(true);
    expect(page.editForm.controls.email.disabled).toBe(true);
    expect(element.querySelector('tr.edit-note')?.textContent).toContain(
      'Only its name can be changed',
    );

    page.editForm.controls.name.setValue('Admin U.');
    buttonIn(element.querySelector('tr.is-editing')!, 'Save').click();
    await settle();
    expect(userService.update).toHaveBeenCalledWith(1, { name: 'Admin U.' });
  });

  it('changes an email, trimmed and lowercased', async () => {
    const { page, element, settle } = await open();
    buttonIn(rowFor(element, 'Hafiz'), 'Edit').click();
    await settle();

    page.editForm.controls.email.setValue('  Hafiz.Ismail@Nexora.test ');
    buttonIn(element.querySelector('tr.is-editing')!, 'Save').click();
    await settle();

    expect(userService.update).toHaveBeenCalledWith(4, { email: 'hafiz.ismail@nexora.test' });
    expect(element.querySelector('[role="status"]')?.textContent).toContain(
      'They now log in with hafiz.ismail@nexora.test',
    );
  });

  it('catches an invalid email before sending', async () => {
    const { page, element, settle } = await open();
    buttonIn(rowFor(element, 'Hafiz'), 'Edit').click();
    await settle();

    page.editForm.controls.email.setValue('not-an-email');
    buttonIn(element.querySelector('tr.is-editing')!, 'Save').click();
    await settle();

    expect(userService.update).not.toHaveBeenCalled();
    expect(element.querySelector('tr.edit-note [role="alert"]')?.textContent).toContain(
      'valid email',
    );
  });

  it('deactivates after confirming, and reactivates', async () => {
    confirm.ask.mockResolvedValue(true);
    const { element, settle } = await open();

    buttonIn(rowFor(element, 'Hafiz'), 'Deactivate').click();
    await settle();
    expect(userService.deactivate).toHaveBeenCalledWith(4);

    buttonIn(rowFor(element, 'Mei Ling'), 'Reactivate').click();
    await settle();
    expect(userService.update).toHaveBeenCalledWith(5, { isActive: true });
  });
});
