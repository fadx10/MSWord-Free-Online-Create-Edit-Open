import { DocumentStats, HeadingOutlineItem } from '../types/word';

export function resolvePageNumberPlaceholders(
  template: string,
  currentPage: number,
  totalPages: number
): string {
  return template
    .replace(/\{PAGE\}/g, String(currentPage))
    .replace(/\{NUMPAGES\}/g, String(totalPages));
}

export interface PaginationMetrics {
  currentPage: number;
  totalPages: number;
}

export function computePaginationMetrics(
  editorEl: HTMLElement | null,
  printablePageHeightPx: number,
  activeRange?: Range | null
): PaginationMetrics {
  if (!editorEl) {
    return { currentPage: 1, totalPages: 1 };
  }

  const pageSpan = Math.max(300, printablePageHeightPx);
  const breaks = Array.from(
    editorEl.querySelectorAll<HTMLElement>('.word-page-break')
  );

  // Measure each section separated by .word-page-break elements
  const editorRect = editorEl.getBoundingClientRect();
  const scrollHeight = editorEl.scrollHeight;

  if (breaks.length === 0) {
    const totalPages = Math.max(1, Math.ceil(scrollHeight / pageSpan));
    let currentPage = 1;

    if (activeRange && editorEl.contains(activeRange.startContainer)) {
      const caretY = getCaretOffsetY(editorEl, editorRect, activeRange);
      currentPage = Math.min(totalPages, Math.max(1, Math.floor(caretY / pageSpan) + 1));
    }

    return { currentPage, totalPages };
  }

  // Compute startY and height of each explicit page-break section
  const sectionStarts: number[] = [0];
  breaks.forEach((brk) => {
    sectionStarts.push(brk.offsetTop + brk.offsetHeight);
  });

  const sectionPageCounts: number[] = [];
  for (let i = 0; i < sectionStarts.length; i++) {
    const startY = sectionStarts[i];
    const endY =
      i < breaks.length ? breaks[i].offsetTop : Math.max(startY, scrollHeight);
    const sectionHeight = Math.max(0, endY - startY);
    sectionPageCounts.push(Math.max(1, Math.ceil(sectionHeight / pageSpan)));
  }

  const totalPages = sectionPageCounts.reduce((sum, count) => sum + count, 0);

  let currentPage = 1;
  if (activeRange && editorEl.contains(activeRange.startContainer)) {
    const caretNode = activeRange.startContainer;
    let sectionIndex = 0;
    for (let i = 0; i < breaks.length; i++) {
      const pos = breaks[i].compareDocumentPosition(caretNode);
      if (pos & Node.DOCUMENT_POSITION_FOLLOWING) {
        sectionIndex = i + 1;
      } else {
        break;
      }
    }

    const pagesBefore = sectionPageCounts
      .slice(0, sectionIndex)
      .reduce((sum, c) => sum + c, 0);
    const caretY = getCaretOffsetY(editorEl, editorRect, activeRange);
    const localY = Math.max(0, caretY - sectionStarts[sectionIndex]);
    const localPage = Math.min(
      sectionPageCounts[sectionIndex] - 1,
      Math.floor(localY / pageSpan)
    );
    currentPage = Math.min(totalPages, Math.max(1, pagesBefore + localPage + 1));
  }

  return { currentPage, totalPages };
}

function getCaretOffsetY(
  editorEl: HTMLElement,
  editorRect: DOMRect,
  range: Range
): number {
  const rects = range.getClientRects();
  if (rects.length > 0 && rects[0].height > 0) {
    const scale = editorRect.height > 0 ? editorEl.offsetHeight / editorRect.height : 1;
    return Math.max(0, (rects[0].top - editorRect.top) * scale);
  }
  const node =
    range.startContainer.nodeType === Node.ELEMENT_NODE
      ? (range.startContainer as HTMLElement)
      : range.startContainer.parentElement;
  if (node && editorEl.contains(node)) {
    return Math.max(0, node.offsetTop);
  }
  return 0;
}

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
  const { totalPages } = computePaginationMetrics(editorEl, pageHeightPx);

  return {
    words,
    charactersWithSpaces,
    charactersNoSpaces,
    paragraphs,
    lines,
    pages: totalPages,
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
