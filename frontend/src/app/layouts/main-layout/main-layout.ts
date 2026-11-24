import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { Role } from '../../core/models/user';

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

// header for every page after logging in
@Component({
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
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
}
