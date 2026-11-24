import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Pagination } from './pagination';

describe('Pagination', () => {
  let fixture: ComponentFixture<Pagination>;

  function render(page: number, total: number) {
    fixture = TestBed.createComponent(Pagination);
    fixture.componentRef.setInput('page', page);
    fixture.componentRef.setInput('pageSize', 10);
    fixture.componentRef.setInput('total', total);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Pagination] }).compileComponents();
  });

  it('is hidden when everything fits on one page', () => {
    expect(render(1, 8).querySelector('nav')).toBeNull();
  });

  it('shows where you are on the last page', () => {
    const page = render(2, 15);
    expect(page.textContent).toContain('Showing 11–15 of 15');
    expect(page.textContent).toContain('Page 2 of 2');
  });

  it('asks for the next page and disables previous on the first page', () => {
    const page = render(1, 15);
    const emitted: number[] = [];
    fixture.componentInstance.pageChange.subscribe((value) => emitted.push(value));

    const [previous, next] = Array.from(page.querySelectorAll('button'));
    expect(previous.disabled).toBe(true);
    next.click();

    expect(emitted).toEqual([2]);
  });
});
