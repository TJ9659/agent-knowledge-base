import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthLayout } from './auth-layout';

describe('AuthLayout', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuthLayout],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('shows the brand and a place for the page', () => {
    const fixture = TestBed.createComponent(AuthLayout);
    fixture.detectChanges();
    const page: HTMLElement = fixture.nativeElement;

    expect(page.querySelector('.brand')?.textContent).toContain('Nexora');
    expect(page.querySelector('router-outlet')).not.toBeNull();
  });
});
