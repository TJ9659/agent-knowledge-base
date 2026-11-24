import { TestBed } from '@angular/core/testing';
import { ArticleBody } from './article-body';

const content = [
  '# Handling a double charge',
  '',
  '**When to use:** the customer sees the same charge twice.',
  '',
  '## Steps',
  '1. Verify the caller.',
  '',
  '## What to tell the customer',
  '- Refunds take 5–7 working days.',
  '',
  '## Escalate if',
  '- The amount is over RM 500.',
].join('\n');

describe('ArticleBody', () => {
  function render() {
    const fixture = TestBed.createComponent(ArticleBody);
    fixture.componentRef.setInput('content', content);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ArticleBody] }).compileComponents();
  });

  it('leaves out the title, the page shows it', () => {
    expect(render().querySelector('h1')).toBeNull();
  });

  it('shows normal sections plainly', () => {
    expect(render().querySelector('.section h2')?.textContent).toBe('Steps');
  });

  it('puts the customer and escalation sections in their own boxes', () => {
    const element = render();
    const customer = element.querySelector('.callout:not(.callout--escalate)')!;

    expect(customer.querySelector('h2')?.textContent).toBe('What to tell the customer');
    expect(customer.querySelector('button')?.textContent?.trim()).toBe('Copy');
    expect(element.querySelector('.callout--escalate h2')?.textContent).toBe('Escalate if');
  });
});
