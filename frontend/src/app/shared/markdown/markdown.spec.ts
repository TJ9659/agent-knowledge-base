import { TestBed } from '@angular/core/testing';
import { Markdown } from './markdown';

describe('Markdown', () => {
  function render(content: string, skipTitle = false) {
    const fixture = TestBed.createComponent(Markdown);
    fixture.componentRef.setInput('content', content);
    fixture.componentRef.setInput('skipTitle', skipTitle);
    fixture.detectChanges();
    return (fixture.nativeElement as HTMLElement).querySelector('.markdown')!;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Markdown] }).compileComponents();
  });

  it('turns markdown into html', () => {
    const html = render('## Steps\n\n1. Verify the caller\n2. Open **Billing**');
    expect(html.querySelector('h2')?.textContent).toBe('Steps');
    expect(html.querySelectorAll('ol li').length).toBe(2);
    expect(html.querySelector('strong')?.textContent).toBe('Billing');
  });

  it('removes anything that could run a script', () => {
    const html = render('Hello <img src="x" onerror="alert(1)"> <script>alert(2)</script>');
    expect(html.querySelector('script')).toBeNull();
    expect(html.querySelector('img')?.hasAttribute('onerror')).toBe(false);
  });

  it('can skip the leading title', () => {
    const html = render('# Handling a double charge\n\nBody text', true);
    expect(html.querySelector('h1')).toBeNull();
    expect(html.textContent).toContain('Body text');
  });
});
