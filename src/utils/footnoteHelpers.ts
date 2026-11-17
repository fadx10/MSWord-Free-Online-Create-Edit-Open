export interface FootnoteItem {
  id: string;
  number: number;
  text: string;
  contextSnippet: string;
}

function getFootnoteBodyElements(editorEl: HTMLElement): HTMLElement[] {
  const result: HTMLElement[] = [];
  const seen = new Set<HTMLElement>();

  // 1. Explicit data-fn-body paragraphs
  editorEl.querySelectorAll<HTMLElement>('[data-fn-body]').forEach((el) => {
    if (!seen.has(el)) {
      seen.add(el);
      result.push(el);
    }
  });

  // 2. Legacy footnote blocks created without data-fn-body (9.5pt "[N] ...")
  const supNums = new Set(
    Array.from(editorEl.querySelectorAll<HTMLElement>('sup[data-fn]')).map(
      (s) => s.getAttribute('data-fn') || ''
    )
  );
  editorEl.querySelectorAll<HTMLElement>('p').forEach((p) => {
    if (seen.has(p)) return;
    const raw = (p.textContent || '').trim();
    const match = raw.match(/^\[(\d+)\]\s*(.+)$/);
    if (!match) return;
    const isFnStyle = p.style.fontSize === '9.5pt' || supNums.has(match[1]);
    if (isFnStyle) {
      const assignedId = `fn-legacy-${match[1]}-${result.length + 1}`;
      p.setAttribute('data-fn-body', assignedId);
      p.classList.add('word-fn-body');
      // Pair legacy <sup data-fn="N"> lacking data-fn-id
      editorEl
        .querySelectorAll<HTMLElement>(`sup[data-fn="${match[1]}"]:not([data-fn-id])`)
        .forEach((sup) => {
          sup.setAttribute('data-fn-id', assignedId);
          sup.classList.add('word-fn-ref');
        });
      seen.add(p);
      result.push(p);
    }
  });

  // Sort by actual DOM order
  result.sort((a, b) => {
    if (a === b) return 0;
    const pos = a.compareDocumentPosition(b);
    return pos & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
  });

  return result;
}

function stripLeadingFootnoteNumber(rawText: string): string {
  return rawText.replace(/^\s*\[\d+\]\s*/, '').trim();
}

function buildContextSnippet(supEl: HTMLElement | null): string {
  if (!supEl) return '';
  const block = supEl.closest('p, li, td, th, blockquote, h1, h2, h3, h4, div');
  const full = (block?.textContent || '').replace(/\s+/g, ' ').trim();
  if (!full) return '';
  const markerText = (supEl.textContent || '').trim();
  const idx = markerText ? full.indexOf(markerText) : -1;
  if (idx === -1) {
    return full.length > 64 ? `${full.slice(0, 64)}…` : full;
  }
  const start = Math.max(0, idx - 26);
  const end = Math.min(full.length, idx + markerText.length + 28);
  const prefix = start > 0 ? '…' : '';
  const suffix = end < full.length ? '…' : '';
  return `${prefix}${full.slice(start, end)}${suffix}`;
}

export function extractFootnotes(editorEl: HTMLElement | null): FootnoteItem[] {
  if (!editorEl) return [];
  const bodies = getFootnoteBodyElements(editorEl);
  const items: FootnoteItem[] = [];

  bodies.forEach((bodyEl, idx) => {
    let fnId = bodyEl.getAttribute('data-fn-body') || '';
    if (!fnId) {
      fnId = `fn-${idx + 1}`;
      bodyEl.setAttribute('data-fn-body', fnId);
    }
    const raw = (bodyEl.textContent || '').trim();
    const numMatch = raw.match(/^\[(\d+)\]/);
    const num = numMatch ? Number(numMatch[1]) : idx + 1;
    const text = stripLeadingFootnoteNumber(raw);

    const refEl =
      editorEl.querySelector<HTMLElement>(`sup[data-fn-id="${fnId}"]`) ||
      editorEl.querySelector<HTMLElement>(`sup[data-fn="${num}"]`);

    if (refEl && !refEl.getAttribute('data-fn-id')) {
      refEl.setAttribute('data-fn-id', fnId);
      refEl.classList.add('word-fn-ref');
    }

    items.push({
      id: fnId,
      number: idx + 1,
      text,
      contextSnippet: buildContextSnippet(refEl),
    });
  });

  return items;
}

export function renumberFootnotes(editorEl: HTMLElement): FootnoteItem[] {
  const bodies = getFootnoteBodyElements(editorEl);

  bodies.forEach((bodyEl, idx) => {
    const newNumber = idx + 1;
    let fnId = bodyEl.getAttribute('data-fn-body') || '';
    if (!fnId) {
      fnId = `fn-${Date.now()}-${newNumber}`;
      bodyEl.setAttribute('data-fn-body', fnId);
    }

    const cleanBody = stripLeadingFootnoteNumber(bodyEl.textContent || '');
    bodyEl.textContent = `[${newNumber}] ${cleanBody}`;

    editorEl
      .querySelectorAll<HTMLElement>(`sup[data-fn-id="${fnId}"]`)
      .forEach((sup) => {
        sup.setAttribute('data-fn', String(newNumber));
        sup.textContent = `[${newNumber}]`;
      });
  });

  return extractFootnotes(editorEl);
}

export function insertFootnoteInEditor(
  editorEl: HTMLElement,
  savedRange: Range | null,
  initialText?: string
): FootnoteItem | null {
  const existingCount = getFootnoteBodyElements(editorEl).length;
  const nextNum = existingCount + 1;
  const fnId = `fn-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  const sup = document.createElement('sup');
  sup.setAttribute('data-fn', String(nextNum));
  sup.setAttribute('data-fn-id', fnId);
  sup.className = 'word-fn-ref';
  sup.textContent = `[${nextNum}]`;

  let inserted = false;
  const sel = window.getSelection();
  let targetRange: Range | null = null;
  if (sel && sel.rangeCount > 0 && editorEl.contains(sel.anchorNode)) {
    targetRange = sel.getRangeAt(0);
  } else if (savedRange && editorEl.contains(savedRange.startContainer)) {
    targetRange = savedRange;
  }

  if (targetRange) {
    try {
      const cloned = targetRange.cloneRange();
      cloned.collapse(false);
      cloned.insertNode(sup);
      const after = document.createRange();
      after.setStartAfter(sup);
      after.collapse(true);
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(after);
      }
      inserted = true;
    } catch {
      inserted = false;
    }
  }

  if (!inserted) {
    // Place at the end of the last non-footnote paragraph, or create one
    const paragraphs = Array.from(editorEl.querySelectorAll<HTMLElement>('p')).filter(
      (p) => !p.hasAttribute('data-fn-body')
    );
    const targetP = paragraphs[paragraphs.length - 1];
    if (targetP) {
      targetP.appendChild(sup);
    } else {
      const p = document.createElement('p');
      p.appendChild(sup);
      editorEl.prepend(p);
    }
  }

  const fnBlock = document.createElement('p');
  fnBlock.setAttribute('data-fn-body', fnId);
  fnBlock.className = 'word-fn-body';
  fnBlock.style.fontSize = '9.5pt';
  fnBlock.style.color = '#605E5C';
  fnBlock.textContent = `[${nextNum}] ${(initialText || 'Enter footnote citation here.').trim()}`;
  editorEl.appendChild(fnBlock);

  const updated = renumberFootnotes(editorEl);
  return updated.find((item) => item.id === fnId) ?? updated[updated.length - 1] ?? null;
}

export function updateFootnoteText(
  editorEl: HTMLElement,
  fnId: string,
  newText: string
): boolean {
  const bodyEl = editorEl.querySelector<HTMLElement>(`[data-fn-body="${fnId}"]`);
  if (!bodyEl) return false;
  const bodies = getFootnoteBodyElements(editorEl);
  const idx = bodies.indexOf(bodyEl);
  const num = idx >= 0 ? idx + 1 : 1;
  bodyEl.textContent = `[${num}] ${newText.trim()}`;
  return true;
}

export function moveFootnote(
  editorEl: HTMLElement,
  fnId: string,
  direction: -1 | 1
): boolean {
  const bodies = getFootnoteBodyElements(editorEl);
  const idx = bodies.findIndex((el) => el.getAttribute('data-fn-body') === fnId);
  if (idx === -1) return false;
  const targetIdx = idx + direction;
  if (targetIdx < 0 || targetIdx >= bodies.length) return false;

  const movingEl = bodies[idx];
  const swapEl = bodies[targetIdx];

  if (direction === -1) {
    swapEl.before(movingEl);
  } else {
    swapEl.after(movingEl);
  }

  renumberFootnotes(editorEl);
  return true;
}

export function reorderFootnotesByAppearance(editorEl: HTMLElement): boolean {
  const bodies = getFootnoteBodyElements(editorEl);
  if (bodies.length < 2) return false;

  const sups = Array.from(editorEl.querySelectorAll<HTMLElement>('sup[data-fn-id]'));
  const firstPos = new Map<string, number>();
  sups.forEach((sup, idx) => {
    const id = sup.getAttribute('data-fn-id');
    if (id && !firstPos.has(id)) {
      firstPos.set(id, idx);
    }
  });

  const sortedBodies = [...bodies].sort((a, b) => {
    const idA = a.getAttribute('data-fn-body') || '';
    const idB = b.getAttribute('data-fn-body') || '';
    const posA = firstPos.has(idA) ? (firstPos.get(idA) as number) : Number.MAX_SAFE_INTEGER;
    const posB = firstPos.has(idB) ? (firstPos.get(idB) as number) : Number.MAX_SAFE_INTEGER;
    return posA - posB;
  });

  const anchorParent = bodies[0].parentElement;
  if (!anchorParent) return false;
  sortedBodies.forEach((el) => {
    anchorParent.appendChild(el);
  });

  renumberFootnotes(editorEl);
  return true;
}

export function removeFootnote(editorEl: HTMLElement, fnId: string): boolean {
  const bodyEl = editorEl.querySelector<HTMLElement>(`[data-fn-body="${fnId}"]`);
  const supEls = Array.from(
    editorEl.querySelectorAll<HTMLElement>(`sup[data-fn-id="${fnId}"]`)
  );
  if (!bodyEl && supEls.length === 0) return false;

  supEls.forEach((sup) => sup.remove());
  bodyEl?.remove();
  renumberFootnotes(editorEl);
  return true;
}
