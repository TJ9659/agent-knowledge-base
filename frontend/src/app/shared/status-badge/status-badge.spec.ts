import { TestBed } from '@angular/core/testing';
import { ArticleStatus } from '../../core/models/article';
import { StatusBadge } from './status-badge';

describe('StatusBadge', () => {
  function render(status: ArticleStatus) {
    const fixture = TestBed.createComponent(StatusBadge);
    fixture.componentRef.setInput('status', status);
    fixture.detectChanges();
    return (fixture.nativeElement as HTMLElement).querySelector('.badge')!;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [StatusBadge] }).compileComponents();
  });

  it('shows published', () => {
    const badge = render('PUBLISHED');
    expect(badge.textContent?.trim()).toBe('Published');
    expect(badge.classList.contains('badge--draft')).toBe(false);
  });

  it('shows draft in its own colour', () => {
    const badge = render('DRAFT');
    expect(badge.textContent?.trim()).toBe('Draft');
    expect(badge.classList.contains('badge--draft')).toBe(true);
  });
});
