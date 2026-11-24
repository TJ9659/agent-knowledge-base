import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { Role, User } from '../../core/models/user';
import { MainLayout } from './main-layout';

describe('MainLayout', () => {
  let fixture: ComponentFixture<MainLayout>;
  const logout = vi.fn();

  // a fake AuthService for a user with this role
  async function setup(role: Role) {
    const user: User = {
      id: 1,
      name: 'Aisha Rahman',
      email: 'admin@nexora.test',
      role,
      isActive: true,
      isProtected: false,
      createdAt: '2026-11-23T00:00:00.000Z',
    };
    await TestBed.configureTestingModule({
      imports: [MainLayout],
      providers: [
        provideRouter([{ path: 'ask', children: [] }]),
        {
          provide: AuthService,
          useValue: {
            user: signal(user),
            hasRole: (...roles: Role[]) => roles.includes(role),
            logout,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MainLayout);
    fixture.detectChanges();
  }

  function navLabels() {
    const links = (fixture.nativeElement as HTMLElement).querySelectorAll('.nav a');
    return Array.from(links, (link) => link.textContent?.trim());
  }

  it('shows an agent only the links for everyone', async () => {
    await setup('AGENT');
    expect(navLabels()).toEqual(['Articles', 'Ask the KB']);
  });

  it('adds my articles for an editor', async () => {
    await setup('EDITOR');
    expect(navLabels()).toEqual(['Articles', 'Ask the KB', 'My articles']);
  });

  it('shows an admin every link', async () => {
    await setup('ADMIN');
    expect(navLabels()).toEqual(['Articles', 'Ask the KB', 'My articles', 'Categories', 'Users']);
  });

  it('shows the user and logs out', async () => {
    await setup('ADMIN');
    const page = fixture.nativeElement as HTMLElement;

    expect(page.querySelector('.account__name')?.textContent).toContain('Aisha Rahman');
    expect(page.querySelector('.account__name')?.textContent).toContain('Admin');

    page.querySelector<HTMLButtonElement>('.account button')?.click();
    expect(logout).toHaveBeenCalled();
  });

  it('the menu button opens and closes the menu', async () => {
    await setup('AGENT');
    const page = fixture.nativeElement as HTMLElement;
    const button = page.querySelector<HTMLButtonElement>('.menu-button')!;

    expect(button.getAttribute('aria-expanded')).toBe('false');
    button.click();
    fixture.detectChanges();
    expect(button.getAttribute('aria-expanded')).toBe('true');
    expect(button.getAttribute('aria-label')).toBe('Close menu');
    expect(page.querySelector('#main-menu')?.classList.contains('is-open')).toBe(true);

    page.querySelector('header')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    expect(button.getAttribute('aria-expanded')).toBe('false');
  });

  it('closes the menu after navigating', async () => {
    await setup('AGENT');
    const page = fixture.nativeElement as HTMLElement;
    page.querySelector<HTMLButtonElement>('.menu-button')!.click();
    fixture.detectChanges();

    await TestBed.inject(Router).navigateByUrl('/ask');
    fixture.detectChanges();

    expect(page.querySelector('#main-menu')?.classList.contains('is-open')).toBe(false);
  });
});
