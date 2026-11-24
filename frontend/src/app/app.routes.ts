import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';
import { guestGuard } from './core/guards/guest-guard';
import { roleGuard } from './core/guards/role-guard';
import { AuthLayout } from './layouts/auth-layout/auth-layout';
import { MainLayout } from './layouts/main-layout/main-layout';

// lazy load pages
export const routes: Routes = [
  // exactly "/" only, otherwise the empty paths below match with no page inside
  { path: '', pathMatch: 'full', redirectTo: 'articles' },
  {
    path: '',
    component: AuthLayout,
    canActivate: [guestGuard],
    children: [
      { path: 'login', loadComponent: () => import('./pages/login/login').then((m) => m.Login) },
    ],
  },
  {
    path: '',
    component: MainLayout,
    canActivate: [authGuard],
    children: [
      {
        path: 'articles',
        loadComponent: () => import('./pages/articles/articles').then((m) => m.Articles),
      },
      // before articles/:id, otherwise "new" is read as an id
      {
        path: 'articles/new',
        loadComponent: () => import('./pages/article-form/article-form').then((m) => m.ArticleForm),
        canActivate: [roleGuard],
        data: { roles: ['EDITOR', 'ADMIN'] },
      },
      {
        path: 'articles/:id',
        loadComponent: () =>
          import('./pages/article-detail/article-detail').then((m) => m.ArticleDetail),
      },
      {
        path: 'articles/:id/edit',
        loadComponent: () => import('./pages/article-form/article-form').then((m) => m.ArticleForm),
        canActivate: [roleGuard],
        data: { roles: ['EDITOR', 'ADMIN'] },
      },
      { path: 'ask', loadComponent: () => import('./pages/ask/ask').then((m) => m.Ask) },
      {
        path: 'my-articles',
        loadComponent: () => import('./pages/my-articles/my-articles').then((m) => m.MyArticles),
        canActivate: [roleGuard],
        data: { roles: ['EDITOR', 'ADMIN'] },
      },
      {
        path: 'admin/categories',
        loadComponent: () =>
          import('./pages/admin/categories/categories').then((m) => m.Categories),
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] },
      },
      {
        path: 'admin/users',
        loadComponent: () => import('./pages/admin/users/users').then((m) => m.Users),
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] },
      },
    ],
  },
  { path: '**', redirectTo: 'articles' },
];
