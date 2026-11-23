import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { Login } from './login';

describe('Login', () => {
  const auth = { login: vi.fn() };
  let fixture: ComponentFixture<Login>;
  let router: Router;

  // returnUrl is what the auth guard puts in the address
  async function setup(returnUrl?: string) {
    auth.login.mockReset();
    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: auth },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap({ returnUrl }) } } },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    fixture = TestBed.createComponent(Login);
    fixture.detectChanges();
  }

  function submit(email: string, password: string) {
    fixture.componentInstance.form.setValue({ email, password });
    fixture.componentInstance.submit();
    fixture.detectChanges();
  }

  function alertText() {
    return (fixture.nativeElement as HTMLElement).querySelector('[role="alert"]')?.textContent;
  }

  it('shows field errors and does not call the api when empty', async () => {
    await setup();

    submit('', '');

    const text = (fixture.nativeElement as HTMLElement).textContent;
    expect(auth.login).not.toHaveBeenCalled();
    expect(text).toContain('Enter a valid email address.');
    expect(text).toContain('Enter your password.');
  });

  it('logs in and goes to articles', async () => {
    await setup();
    auth.login.mockReturnValue(of({}));

    submit('agent@nexora.test', 'Password123!');

    expect(auth.login).toHaveBeenCalledWith('agent@nexora.test', 'Password123!');
    expect(router.navigateByUrl).toHaveBeenCalledWith('/articles');
    expect(fixture.componentInstance.loading()).toBe(false);
  });

  it('goes back to the page the guard saved', async () => {
    await setup('/articles/5');
    auth.login.mockReturnValue(of({}));

    submit('agent@nexora.test', 'Password123!');

    expect(router.navigateByUrl).toHaveBeenCalledWith('/articles/5');
  });

  it('ignores a returnUrl that points to another site', async () => {
    await setup('//evil.example');
    auth.login.mockReturnValue(of({}));

    submit('agent@nexora.test', 'Password123!');

    expect(router.navigateByUrl).toHaveBeenCalledWith('/articles');
  });

  it('shows the server message when login fails', async () => {
    await setup();
    auth.login.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 401, error: { message: 'Invalid email or password' } })),
    );

    submit('agent@nexora.test', 'wrong');

    expect(alertText()).toContain('Invalid email or password');
    expect(router.navigateByUrl).not.toHaveBeenCalled();
    expect(fixture.componentInstance.loading()).toBe(false);
  });

  it('explains when the server cannot be reached', async () => {
    await setup();
    auth.login.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 0 })));

    submit('agent@nexora.test', 'Password123!');

    expect(alertText()).toContain("Can't reach the server");
  });
});
