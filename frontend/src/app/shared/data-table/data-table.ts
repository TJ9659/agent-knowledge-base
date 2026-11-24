import { Component, input, ViewEncapsulation } from '@angular/core';

// the shared table look, each page puts its own <thead> and <tbody> inside
@Component({
  imports: [],
  selector: 'app-data-table',
  styleUrl: './data-table.scss',
  templateUrl: './data-table.html',
  // the rows come from the page, so they carry the page's style scope, not this one
  encapsulation: ViewEncapsulation.None,
})
export class DataTable {
  // below this width the table scrolls inside its box instead of squashing the columns
  readonly minWidth = input('600px');
}
