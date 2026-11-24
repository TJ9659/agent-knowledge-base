import { Component, computed, input, signal } from '@angular/core';
import { splitSections } from '../../core/articles/article-content';
import { Markdown } from '../markdown/markdown';

// an article's content with the customer and escalation sections in their own boxes,
// used by the article page and the form preview so both look the same
@Component({
  imports: [Markdown],
  selector: 'app-article-body',
  styleUrl: './article-body.scss',
  templateUrl: './article-body.html',
})
export class ArticleBody {
  readonly content = input.required<string>();

  protected readonly parts = computed(() => splitSections(this.content()));
  protected readonly copied = signal<string | null>(null);

  protected async copy(heading: string, element: HTMLElement) {
    try {
      await navigator.clipboard.writeText(element.innerText);
      this.copied.set(heading);
      setTimeout(() => this.copied.set(null), 2000);
    } catch {
      // clipboard blocked by the browser, the text can still be selected by hand
    }
  }
}
