import { HttpClient } from '@angular/common/http';
import { computed, inject, Service, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthResponse, Role, User } from '../models/user';
import { catchError, finalize, Observable, of, shareReplay, tap } from 'rxjs';

@Service()
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private accessToken: string | null = null;

  private readonly currentUser = signal<User | null>(null);
  readonly user = this.currentUser.asReadonly();
  readonly isLoggedIn = computed(() => this.currentUser() !== null);

  private readonly api = '/api/auth';

  private refreshRequest: Observable<AuthResponse> | null = null;

  getAccessToken() {
    return this.accessToken;
  }

  hasRole(...roles: Role[]): boolean {
    const user = this.currentUser();
    if (user === null) {
      return false;
    }
    return roles.includes(user.role);
  }

  private setSession({ accessToken, user }: AuthResponse) {
    this.accessToken = accessToken;
    this.currentUser.set(user);
  }

  private clearSession() {
    this.accessToken = null;
    this.currentUser.set(null);
  }

  login(email: string, password: string) {
    return this.http
      .post<AuthResponse>(`${this.api}/login`, { email, password }, { withCredentials: true })
      .pipe(tap((res) => this.setSession(res)));
  }

  logout() {
    this.http
      .post(`${this.api}/logout`, {}, { withCredentials: true })
      .subscribe({ error: () => undefined });
    this.clearSession();
    void this.router.navigate(['/login']);
  }

  refresh() {
    return this.refreshRequest ??= this.http
      .post<AuthResponse>(`${this.api}/refresh`, {}, { withCredentials: true })
      .pipe(
        tap((res) => this.setSession(res)),
        finalize(() => (this.refreshRequest = null)),
        shareReplay(1),
      );
  }

  restoreSession() {
    return this.refresh().pipe(catchError(() => of(null)));
  }
}
