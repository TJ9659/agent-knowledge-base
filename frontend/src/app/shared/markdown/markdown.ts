import { Component, computed, input, ViewEncapsulation } from '@angular/core';
import DOMPurify from 'dompurify';
import { marked } from 'marked';

// renders article markdown as html, DOMPurify strips anything that could run a script
@Component({
  imports: [],
  selector: 'app-markdown',
  styleUrl: './markdown.scss',
  templateUrl: './markdown.html',
  // the generated html has no angular attributes, so styles cant be scoped to this component
  encapsulation: ViewEncapsulation.None,
})
export class Markdown {
  readonly content = input.required<string>();
  // the detail page shows the title itself, so a leading "# title" line would repeat it
  readonly skipTitle = input(false);

  protected readonly html = computed(() => {
    const markdown = this.skipTitle() ? this.content().replace(/^\s*# .*\n?/, '') : this.content();
    return DOMPurify.sanitize(marked.parse(markdown, { async: false }));
  });
}
