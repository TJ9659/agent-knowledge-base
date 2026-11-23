// plain text preview for list pages, markdown symbols removed
export function toSnippet(markdown: string, max = 150) {
  const text = markdown
    .replace(/```[\s\S]*?```/g, ' ')
    // headings are dropped, the first one repeats the title
    .replace(/^\s*#{1,6}\s.*$/gm, ' ')
    // links and images keep their text
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    // quote and list markers at the start of a line
    .replace(/^\s*(>\s?|[-*+]\s|\d+\.\s)/gm, '')
    .replace(/[*_`~]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (text.length <= max) return text;

  // cut at the last space so words are not split
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  return `${cut.slice(0, lastSpace > 0 ? lastSpace : max).trimEnd()}…`;
}
