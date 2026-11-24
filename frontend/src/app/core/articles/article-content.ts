// every article is stored as one markdown text with these standard headings:
//
// # Title
// **When to use:** ...
// ## Steps
// ## What to tell the customer   (optional)
// ## Escalate if                 (optional)
// any other ## sections          (optional)

export type SectionKind = 'customer' | 'escalate' | 'plain';

export interface Section {
  heading: string;
  body: string;
  kind: SectionKind;
}

// one box per standard heading in the article form, "more" holds any other sections
export interface ArticleFields {
  whenToUse: string;
  steps: string;
  customer: string;
  escalate: string;
  more: string;
}

const WHEN_TO_USE = '**When to use:**';

// headings that get their own box on the article page
const SECTION_KINDS: Record<string, SectionKind> = {
  'what to tell the customer': 'customer',
  'escalate if': 'escalate',
};

// headings that get their own box in the form
const FIELD_FOR_HEADING: Record<string, keyof ArticleFields> = {
  steps: 'steps',
  'what to tell the customer': 'customer',
  'escalate if': 'escalate',
};

// splits an article on its "## " headings, the title line is dropped since pages show it themselves
export function splitSections(markdown: string) {
  const [intro, ...parts] = markdown.replace(/^\s*# .*\n?/, '').split(/^## /m);
  const sections: Section[] = parts.map((part) => {
    const [heading = '', ...lines] = part.split('\n');
    const title = heading.trim();
    return {
      heading: title,
      body: lines.join('\n').trim(),
      kind: SECTION_KINDS[title.toLowerCase()] ?? 'plain',
    };
  });
  return { intro: (intro ?? '').trim(), sections };
}

// fills the form boxes from a saved article, unknown sections keep their heading in "more"
export function toFields(markdown: string): ArticleFields {
  const { intro, sections } = splitSections(markdown);
  const fields: ArticleFields = {
    whenToUse: intro.replace(WHEN_TO_USE, '').trim(),
    steps: '',
    customer: '',
    escalate: '',
    more: '',
  };

  const extra: string[] = [];
  for (const section of sections) {
    const field = FIELD_FOR_HEADING[section.heading.toLowerCase()];
    if (field && !fields[field]) {
      fields[field] = section.body;
    } else {
      extra.push(`## ${section.heading}\n${section.body}`);
    }
  }
  fields.more = extra.join('\n\n');
  return fields;
}

// builds the markdown that gets saved, empty optional boxes are left out
export function toMarkdown(title: string, fields: ArticleFields) {
  const parts = [
    `# ${title.trim()}`,
    `${WHEN_TO_USE} ${fields.whenToUse.trim()}`,
    `## Steps\n${fields.steps.trim()}`,
  ];
  if (fields.customer.trim()) parts.push(`## What to tell the customer\n${fields.customer.trim()}`);
  if (fields.escalate.trim()) parts.push(`## Escalate if\n${fields.escalate.trim()}`);
  if (fields.more.trim()) parts.push(fields.more.trim());
  return parts.join('\n\n');
}
