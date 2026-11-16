import { DocumentStats, HeadingOutlineItem } from '../types/word';

export function computeDocumentStats(
  editorEl: HTMLElement | null,
  pageHeightPx: number
): DocumentStats {
  if (!editorEl) {
    return {
      words: 0,
      charactersWithSpaces: 0,
      charactersNoSpaces: 0,
      paragraphs: 0,
      lines: 0,
      pages: 1,
    };
  }

  const rawText = editorEl.innerText ?? editorEl.textContent ?? '';
  const trimmed = rawText.trim();
  const words = trimmed ? trimmed.split(/\s+/).filter(Boolean).length : 0;
  const charactersWithSpaces = rawText.replace(/\n/g, '').length;
  const charactersNoSpaces = rawText.replace(/\s+/g, '').length;
  const paragraphs = Math.max(
    editorEl.querySelectorAll('p, h1, h2, h3, h4, li, blockquote').length,
    trimmed ? 1 : 0
  );
  const lines = trimmed ? rawText.split(/\n/).filter((l) => l.trim().length > 0).length : 0;
  const explicitBreaks = editorEl.querySelectorAll('.word-page-break').length;
  const estimatedByHeight = Math.max(1, Math.ceil(editorEl.scrollHeight / Math.max(400, pageHeightPx)));
  const pages = Math.max(estimatedByHeight, explicitBreaks + 1);

  return {
    words,
    charactersWithSpaces,
    charactersNoSpaces,
    paragraphs,
    lines,
    pages,
  };
}

export function extractHeadingOutline(editorEl: HTMLElement | null): HeadingOutlineItem[] {
  if (!editorEl) return [];
  const headings = editorEl.querySelectorAll('h1, h2, h3, h4.word-title');
  const items: HeadingOutlineItem[] = [];
  headings.forEach((h, idx) => {
    const text = (h.textContent || '').trim();
    if (!text) return;
    if (!h.id) {
      h.id = `doc-heading-${idx}`;
    }
    const tag = h.tagName.toLowerCase();
    const level: 1 | 2 | 3 = tag === 'h2' ? 2 : tag === 'h3' ? 3 : 1;
    items.push({ id: h.id, text, level });
  });
  return items;
}

export function buildTableHtml(rows: number, cols: number): string {
  let html = '<table><thead><tr>';
  for (let c = 0; c < cols; c++) {
    html += `<th>Header ${c + 1}</th>`;
  }
  html += '</tr></thead><tbody>';
  for (let r = 1; r < rows; r++) {
    html += '<tr>';
    for (let c = 0; c < cols; c++) {
      html += '<td><br /></td>';
    }
    html += '</tr>';
  }
  html += '</tbody></table><p><br /></p>';
  return html;
}

export function buildTableOfContentsHtml(editorEl: HTMLElement | null): string {
  const outline = extractHeadingOutline(editorEl);
  if (outline.length === 0) {
    return `<div class="word-toc"><strong>Table of Contents</strong><p style="color:#605e5c;font-size:10pt;margin-top:4pt;">Add Heading 1, Heading 2, or Heading 3 styles to your document, then insert a Table of Contents.</p></div><p><br /></p>`;
  }
  const rows = outline
    .map((item) => {
      const indent = (item.level - 1) * 16;
      return `<div style="padding-left:${indent}px;margin:3pt 0;font-size:10.5pt;color:#242424;">${escapeText(item.text)}</div>`;
    })
    .join('');
  return `<div class="word-toc"><div style="font-weight:600;color:#0f6cbd;margin-bottom:6pt;font-size:12pt;">Table of Contents</div>${rows}</div><p><br /></p>`;
}

function escapeText(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export interface SpellingIssue {
  id: string;
  word: string;
  suggestion: string;
  reason: string;
}

const COMMON_TYPOS: Record<string, string> = {
  teh: 'the',
  recieve: 'receive',
  seperate: 'separate',
  occured: 'occurred',
  definately: 'definitely',
  untill: 'until',
  wich: 'which',
  adn: 'and',
  thier: 'their',
  becuase: 'because',
  acheive: 'achieve',
  accomodate: 'accommodate',
  wierd: 'weird',
  goverment: 'government',
  enviroment: 'environment',
  tommorow: 'tomorrow',
  neccessary: 'necessary',
  langauge: 'language',
  documnet: 'document',
  microsfot: 'Microsoft',
};

export function runQuickProofingCheck(text: string): SpellingIssue[] {
  const issues: SpellingIssue[] = [];
  const words = text.match(/\b[A-Za-z]+\b/g) || [];
  const seen = new Set<string>();

  words.forEach((w, i) => {
    const lower = w.toLowerCase();
    if (COMMON_TYPOS[lower] && !seen.has(lower)) {
      seen.add(lower);
      issues.push({
        id: `typo-${i}-${lower}`,
        word: w,
        suggestion: COMMON_TYPOS[lower],
        reason: 'Spelling suggestion',
      });
    }
  });

  // Check repeated consecutive words like "the the"
  const repeatedRegex = /\b([A-Za-z]+)\s+\1\b/gi;
  let match: RegExpExecArray | null;
  while ((match = repeatedRegex.exec(text)) !== null) {
    issues.push({
      id: `repeat-${match.index}`,
      word: match[0],
      suggestion: match[1],
      reason: 'Repeated word',
    });
  }

  return issues;
}
