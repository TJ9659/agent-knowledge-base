import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { Role } from '../../core/models/user';
import { ConfirmDialog } from '../../shared/confirm-dialog/confirm-dialog';

interface NavLink {
  path: string;
  label: string;
  roles?: Role[];
}

// links without roles are for everyone, the backend still checks every request
const NAV_LINKS: NavLink[] = [
  { path: '/articles', label: 'Articles' },
  { path: '/ask', label: 'Ask the KB' },
  { path: '/my-articles', label: 'My articles', roles: ['EDITOR', 'ADMIN'] },
  { path: '/admin/categories', label: 'Categories', roles: ['ADMIN'] },
  { path: '/admin/users', label: 'Users', roles: ['ADMIN'] },
];

const ROLE_LABELS: Record<Role, string> = { ADMIN: 'Admin', EDITOR: 'Editor', AGENT: 'Agent' };

// header for every page after logging in, the links fold into a menu button on phones
@Component({
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ConfirmDialog],
  selector: 'app-main-layout',
  styleUrl: './main-layout.scss',
  templateUrl: './main-layout.html',
})
export class MainLayout {
  protected readonly auth = inject(AuthService);
  protected readonly roleLabels = ROLE_LABELS;

  protected readonly links = computed(() =>
    NAV_LINKS.filter((link) => !link.roles || this.auth.hasRole(...link.roles)),
  );

  // only matters on phones, on wider screens the links are always shown
  protected readonly menuOpen = signal(false);

  constructor() {
    // close the menu after any navigation, including the back button
    inject(Router)
      .events.pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.menuOpen.set(false));
  }

  protected toggleMenu() {
    this.menuOpen.update((open) => !open);
  }

  // esc closes the menu and puts focus back on the button that opened it
  protected closeMenu(button: HTMLButtonElement) {
    if (!this.menuOpen()) return;
    this.menuOpen.set(false);
    button.focus();
  }
}
