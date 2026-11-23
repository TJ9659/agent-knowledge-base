import { Routes } from '@angular/router';
import { AuthLayout } from './layouts/auth-layout/auth-layout';
import { Login } from './pages/login/login';

export const routes: Routes = [
  // exactly "/" only, otherwise the empty path below matches with no page inside
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: '', component: AuthLayout, children: [{ path: 'login', component: Login }] },
  { path: '**', redirectTo: 'login' },
];
