import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth-guard';
import { guestGuard } from './core/auth/guest-guard';
import { roleGuard } from './core/auth/role-guard';
import { AuthLayout } from './layouts/auth-layout/auth-layout';
import { MainLayout } from './layouts/main-layout/main-layout';
import { Categories } from './pages/admin/categories/categories';
import { Users } from './pages/admin/users/users';
import { Articles } from './pages/articles/articles';
import { Ask } from './pages/ask/ask';
import { Login } from './pages/login/login';
import { MyArticles } from './pages/my-articles/my-articles';

export const routes: Routes = [
  // exactly "/" only, otherwise the empty paths below match with no page inside
  { path: '', pathMatch: 'full', redirectTo: 'articles' },
  {
    path: '',
    component: AuthLayout,
    canActivate: [guestGuard],
    children: [{ path: 'login', component: Login }],
  },
  {
    path: '',
    component: MainLayout,
    canActivate: [authGuard],
    children: [
      { path: 'articles', component: Articles },
      { path: 'ask', component: Ask },
      { path: 'my-articles', component: MyArticles, canActivate: [roleGuard], data: { roles: ['EDITOR', 'ADMIN'] } },
      { path: 'admin/categories', component: Categories, canActivate: [roleGuard], data: { roles: ['ADMIN'] } },
      { path: 'admin/users', component: Users, canActivate: [roleGuard], data: { roles: ['ADMIN'] } },
    ],
  },
  { path: '**', redirectTo: 'articles' },
];
