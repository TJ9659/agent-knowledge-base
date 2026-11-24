import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DataTable } from './data-table';

// a page that uses the table the same way the real pages do
@Component({
  imports: [DataTable],
  template: `
    <app-data-table minWidth="400px">
      <thead>
        <tr>
          <th>Name</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Billing &amp; Payments</td>
        </tr>
        <tr>
          <td>Policies</td>
        </tr>
      </tbody>
    </app-data-table>
  `,
})
class Host {}

describe('DataTable', () => {
  it('shows the rows the page puts inside it', async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    const table = element.querySelector('.data-table table') as HTMLTableElement;
    expect(table.style.minWidth).toBe('400px');
    expect(Array.from(table.querySelectorAll('tbody td'), (td) => td.textContent)).toEqual([
      'Billing & Payments',
      'Policies',
    ]);
  });
});
