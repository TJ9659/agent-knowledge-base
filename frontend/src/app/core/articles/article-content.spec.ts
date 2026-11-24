import { splitSections, toFields, toMarkdown } from './article-content';

const article = [
  '# Verifying a caller',
  '',
  '**When to use:** at the start of every call.',
  '',
  '## Steps',
  '1. Ask for the full name.',
  '   - Check the spelling.',
  '2. Ask for the date of birth.',
  '',
  '## Never',
  '- Read the password out loud.',
  '',
  '## What to tell the customer',
  '- This keeps the account safe.',
  '',
  '## Escalate if',
  '- The caller fails the checks twice.',
].join('\n');

describe('article content', () => {
  it('splits sections and marks the customer and escalation ones', () => {
    const { intro, sections } = splitSections(article);

    expect(intro).toBe('**When to use:** at the start of every call.');
    expect(sections.map((s) => [s.heading, s.kind])).toEqual([
      ['Steps', 'plain'],
      ['Never', 'plain'],
      ['What to tell the customer', 'customer'],
      ['Escalate if', 'escalate'],
    ]);
  });

  it('fills the form boxes and keeps unknown sections with their heading', () => {
    const fields = toFields(article);

    expect(fields.whenToUse).toBe('at the start of every call.');
    expect(fields.steps).toBe(
      '1. Ask for the full name.\n   - Check the spelling.\n2. Ask for the date of birth.',
    );
    expect(fields.customer).toBe('- This keeps the account safe.');
    expect(fields.escalate).toBe('- The caller fails the checks twice.');
    expect(fields.more).toBe('## Never\n- Read the password out loud.');
  });

  it('keeps a heading like "Escalate when" as its own section', () => {
    const fields = toFields('# T\n\n**When to use:** x\n\n## Steps\n1. a\n\n## Escalate when\n- b');
    expect(fields.escalate).toBe('');
    expect(fields.more).toBe('## Escalate when\n- b');
  });

  it('builds markdown with the standard headings and skips empty boxes', () => {
    const markdown = toMarkdown('  Double charge  ', {
      whenToUse: 'the same charge twice.',
      steps: '1. Verify the caller.',
      customer: '',
      escalate: '- Over RM 500.',
      more: '',
    });

    expect(markdown).toBe(
      '# Double charge\n\n**When to use:** the same charge twice.\n\n## Steps\n1. Verify the caller.\n\n## Escalate if\n- Over RM 500.',
    );
  });

  it('loses nothing when an article goes through the form and back', () => {
    const again = toFields(toMarkdown('Verifying a caller', toFields(article)));
    expect(again).toEqual(toFields(article));
  });
});
