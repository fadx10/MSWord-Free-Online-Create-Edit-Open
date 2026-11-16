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

export function buildTickBoxHtml(checked = false): string {
  const checkedAttr = checked ? ' checked="checked"' : '';
  return `<span class="word-tickbox-wrap" contenteditable="false"><input type="checkbox" class="word-tickbox"${checkedAttr} aria-label="Tick box" /></span>&nbsp;`;
}

export function buildChecklistItemHtml(label = 'Task item', checked = false): string {
  return `<p class="word-checklist-item">${buildTickBoxHtml(checked)}${escapeText(label)}</p>`;
}

export function buildChecklistGroupHtml(count = 3): string {
  return Array.from({ length: count }, (_, idx) =>
    buildChecklistItemHtml(`Task item ${idx + 1}`, false)
  ).join('');
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

export function findSearchMatchRanges(
  editorEl: HTMLElement | null,
  query: string,
  caseSensitive: boolean
): Range[] {
  if (!editorEl || !query) return [];
  const needle = caseSensitive ? query : query.toLowerCase();
  if (!needle) return [];

  const ranges: Range[] = [];
  const walker = document.createTreeWalker(editorEl, NodeFilter.SHOW_TEXT);
  let current = walker.nextNode();

  while (current) {
    const textNode = current as Text;
    const raw = textNode.nodeValue ?? '';
    if (raw.length > 0) {
      const haystack = caseSensitive ? raw : raw.toLowerCase();
      let startIndex = 0;
      while (startIndex <= haystack.length - needle.length) {
        const foundAt = haystack.indexOf(needle, startIndex);
        if (foundAt === -1) break;
        const range = document.createRange();
        range.setStart(textNode, foundAt);
        range.setEnd(textNode, foundAt + needle.length);
        ranges.push(range);
        startIndex = foundAt + needle.length;
      }
    }
    current = walker.nextNode();
  }

  return ranges;
}

interface HighlightRegistryLike {
  set: (name: string, highlight: unknown) => void;
  delete: (name: string) => void;
}

export function applySearchHighlights(
  ranges: Range[],
  activeIndex: number
): boolean {
  const cssObj = typeof CSS !== 'undefined' ? (CSS as unknown as { highlights?: HighlightRegistryLike }) : undefined;
  const HighlightCtor = (globalThis as unknown as { Highlight?: new (...ranges: Range[]) => unknown }).Highlight;

  if (!cssObj?.highlights || !HighlightCtor) {
    return false;
  }

  if (ranges.length === 0) {
    cssObj.highlights.delete('word-find-match');
    cssObj.highlights.delete('word-find-active');
    return true;
  }

  const clampedActive = Math.max(0, Math.min(activeIndex, ranges.length - 1));
  const inactiveRanges = ranges.filter((_, idx) => idx !== clampedActive);

  if (inactiveRanges.length > 0) {
    cssObj.highlights.set('word-find-match', new HighlightCtor(...inactiveRanges));
  } else {
    cssObj.highlights.delete('word-find-match');
  }

  cssObj.highlights.set('word-find-active', new HighlightCtor(ranges[clampedActive]));
  return true;
}

export function parseCssLengthToInches(value: string | undefined | null): number {
  if (!value) return 0;
  const trimmed = value.trim().toLowerCase();
  if (!trimmed || trimmed === '0' || trimmed === 'auto' || trimmed === 'none') return 0;

  const match = trimmed.match(/^(-?[\d.]+)\s*(in|pt|px|cm|mm)?$/);
  if (!match) return 0;
  const num = parseFloat(match[1]);
  if (!Number.isFinite(num)) return 0;

  const unit = match[2] || 'px';
  let inches = 0;
  switch (unit) {
    case 'in':
      inches = num;
      break;
    case 'pt':
      inches = num / 72;
      break;
    case 'px':
      inches = num / 96;
      break;
    case 'cm':
      inches = num / 2.54;
      break;
    case 'mm':
      inches = num / 25.4;
      break;
    default:
      inches = num / 96;
  }
  return Math.max(0, Math.round(inches * 100) / 100);
}

const BLOCK_TAGS = new Set(['p', 'h1', 'h2', 'h3', 'h4', 'blockquote', 'li', 'div']);

function isTargetParagraphBlock(el: HTMLElement, editorEl: HTMLElement): boolean {
  if (el === editorEl) return false;
  if (el.classList.contains('word-page-break')) return false;
  const tag = el.tagName.toLowerCase();
  if (!BLOCK_TAGS.has(tag)) return false;

  if (tag === 'div') {
    // Only treat leaf divs (that don't wrap other block paragraphs) as paragraph blocks
    const hasNestedBlock = Array.from(el.children).some((child) => {
      const cTag = child.tagName.toLowerCase();
      return BLOCK_TAGS.has(cTag);
    });
    if (hasNestedBlock) return false;
  }

  return true;
}

function isRangeEndingAtStartOf(range: Range, el: HTMLElement): boolean {
  if (range.collapsed || !el.contains(range.endContainer)) return false;
  if (range.endOffset !== 0) return false;
  let node: Node | null = range.endContainer;
  while (node && node !== el) {
    if (node.previousSibling) return false;
    node = node.parentNode;
  }
  return node === el;
}

export function getSelectedBlockElements(
  editorEl: HTMLElement | null,
  range?: Range | null
): HTMLElement[] {
  if (!editorEl) return [];

  if (range && editorEl.contains(range.startContainer)) {
    if (range.collapsed) {
      let node: Node | null = range.startContainer;
      while (node && node !== editorEl) {
        if (
          node.nodeType === Node.ELEMENT_NODE &&
          isTargetParagraphBlock(node as HTMLElement, editorEl)
        ) {
          return [node as HTMLElement];
        }
        node = node.parentNode;
      }
      return [];
    }

    const blocks: HTMLElement[] = [];
    const walker = document.createTreeWalker(editorEl, NodeFilter.SHOW_ELEMENT);
    let current = walker.nextNode();
    while (current) {
      const el = current as HTMLElement;
      if (isTargetParagraphBlock(el, editorEl)) {
        try {
          if (range.intersectsNode(el) && !isRangeEndingAtStartOf(range, el)) {
            blocks.push(el);
          }
        } catch {
          // Ignore detached nodes
        }
      }
      current = walker.nextNode();
    }

    if (blocks.length > 0) {
      return blocks;
    }
  }

  // Fallback to nearest block containing the active range or first paragraph
  const firstBlock = editorEl.querySelector<HTMLElement>('p, h1, h2, h3, h4, blockquote, li');
  return firstBlock && isTargetParagraphBlock(firstBlock, editorEl) ? [firstBlock] : [];
}

export function readBlockIndentationState(
  editorEl: HTMLElement | null,
  range?: Range | null
): { leftIndentIn: number; firstLineIndent: boolean } {
  const blocks = getSelectedBlockElements(editorEl, range);
  if (blocks.length === 0) {
    return { leftIndentIn: 0, firstLineIndent: false };
  }
  const primary = blocks[0];
  const leftIndentIn = parseCssLengthToInches(primary.style.marginLeft);
  const firstLineIn = parseCssLengthToInches(primary.style.textIndent);
  return {
    leftIndentIn,
    firstLineIndent: firstLineIn > 0.05,
  };
}

export function adjustParagraphLeftIndent(
  editorEl: HTMLElement | null,
  range: Range | null,
  deltaInches: number
): number {
  const blocks = getSelectedBlockElements(editorEl, range);
  if (blocks.length === 0) return 0;

  let firstResult = 0;
  blocks.forEach((block, idx) => {
    const current = parseCssLengthToInches(block.style.marginLeft);
    const next = Math.max(0, Math.min(4.5, Math.round((current + deltaInches) * 100) / 100));
    block.style.marginLeft = next > 0 ? `${next}in` : '';
    if (idx === 0) firstResult = next;
  });
  return firstResult;
}

export function setParagraphLeftIndent(
  editorEl: HTMLElement | null,
  range: Range | null,
  inches: number
): number {
  const blocks = getSelectedBlockElements(editorEl, range);
  const clamped = Math.max(0, Math.min(4.5, Math.round(inches * 100) / 100));
  blocks.forEach((block) => {
    block.style.marginLeft = clamped > 0 ? `${clamped}in` : '';
  });
  return clamped;
}

export function toggleParagraphFirstLineIndent(
  editorEl: HTMLElement | null,
  range: Range | null,
  indentInches = 0.5
): boolean {
  const blocks = getSelectedBlockElements(editorEl, range);
  if (blocks.length === 0) return false;

  const isCurrentlyIndented = parseCssLengthToInches(blocks[0].style.textIndent) > 0.05;
  const nextState = !isCurrentlyIndented;

  blocks.forEach((block) => {
    block.style.textIndent = nextState ? `${indentInches}in` : '';
  });

  return nextState;
}

