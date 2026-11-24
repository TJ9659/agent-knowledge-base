import { Component, input } from '@angular/core';
import { ArticleStatus } from '../../core/models/article';

@Component({
  imports: [],
  selector: 'app-status-badge',
  styleUrl: './status-badge.scss',
  templateUrl: './status-badge.html',
})
export class StatusBadge {
  readonly status = input.required<ArticleStatus>();
}
