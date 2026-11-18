/**
 * DOM helpers for wrapping, styling, navigating, and unwrapping
 * comment text range highlights inside the contentEditable editor.
 */

export function getCommentHighlightElements(
  editorEl: HTMLElement | null,
  commentId?: string
): HTMLElement[] {
  if (!editorEl) return [];
  const all = Array.from(
    editorEl.querySelectorAll<HTMLElement>('.word-comment-highlight[data-comment-id]')
  );
  if (!commentId) return all;
  return all.filter((el) => el.getAttribute('data-comment-id') === commentId);
}

/**
 * Wraps the text nodes intersecting `range` inside `editorEl` with
 * `<span class="word-comment-highlight" data-comment-id="...">`.
 * Uses text-node splitting rather than `surroundContents()` so selections
 * spanning partial inline formatting or multiple paragraphs succeed cleanly.
 */
export function wrapRangeWithCommentHighlight(
  editorEl: HTMLElement,
  range: Range,
  commentId: string
): string {
  if (range.collapsed || !editorEl.contains(range.commonAncestorContainer)) {
    return '';
  }

  const capturedQuote = range.toString().trim();
  if (!capturedQuote) return '';

  const walker = document.createTreeWalker(editorEl, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const textNode = node as Text;
      if (!textNode.data) return NodeFilter.FILTER_REJECT;

      const parentEl = textNode.parentElement;
      if (!parentEl) return NodeFilter.FILTER_REJECT;
      if (parentEl.closest('[contenteditable="false"], .word-tickbox-wrap, .word-page-break')) {
        return NodeFilter.FILTER_REJECT;
      }

      try {
        if (!range.intersectsNode(textNode)) return NodeFilter.FILTER_REJECT;
      } catch {
        return NodeFilter.FILTER_REJECT;
      }

      return NodeFilter.FILTER_ACCEPT;
    },
  });

  const targets: Array<{ node: Text; start: number; end: number }> = [];
  let current = walker.nextNode() as Text | null;
  while (current) {
    const start = current === range.startContainer ? range.startOffset : 0;
    const end = current === range.endContainer ? range.endOffset : current.data.length;
    const slice = current.data.slice(start, end);

    // Skip empty slices and raw HTML newline-only whitespace between blocks
    if (end > start && (slice.trim().length > 0 || !/\n/.test(slice))) {
      targets.push({ node: current, start, end });
    }
    current = walker.nextNode() as Text | null;
  }

  for (const { node, start, end } of targets) {
    if (!node.parentNode) continue;

    if (end < node.data.length) {
      node.splitText(end);
    }

    const highlightTextNode = start > 0 ? node.splitText(start) : node;
    if (!highlightTextNode.data) continue;

    const span = document.createElement('span');
    span.className = 'word-comment-highlight';
    span.setAttribute('data-comment-id', commentId);

    highlightTextNode.parentNode?.insertBefore(span, highlightTextNode);
    span.appendChild(highlightTextNode);
  }

  return capturedQuote;
}

/**
 * Unwraps all highlight spans for `commentId`, restoring plain text nodes.
 */
export function unwrapCommentHighlight(
  editorEl: HTMLElement | null,
  commentId: string
): boolean {
  if (!editorEl) return false;
  const spans = getCommentHighlightElements(editorEl, commentId);
  if (spans.length === 0) return false;

  for (const span of spans) {
    const parent = span.parentNode;
    if (!parent) continue;
    while (span.firstChild) {
      parent.insertBefore(span.firstChild, span);
    }
    parent.removeChild(span);
  }

  editorEl.normalize();
  return true;
}

/**
 * Updates resolved styling on highlight spans for a comment.
 */
export function setCommentHighlightResolved(
  editorEl: HTMLElement | null,
  commentId: string,
  resolved: boolean
): boolean {
  const spans = getCommentHighlightElements(editorEl, commentId);
  if (spans.length === 0) return false;

  for (const span of spans) {
    if (resolved) {
      span.classList.add('word-comment-highlight-resolved');
      span.setAttribute('data-comment-resolved', 'true');
    } else {
      span.classList.remove('word-comment-highlight-resolved');
      span.removeAttribute('data-comment-resolved');
    }
  }
  return true;
}

/**
 * Highlights whichever comment highlight is currently active in the CommentsPane.
 */
export function syncActiveCommentHighlight(
  editorEl: HTMLElement | null,
  activeCommentId: string | null
): void {
  const spans = getCommentHighlightElements(editorEl);
  for (const span of spans) {
    const isMatch =
      Boolean(activeCommentId) && span.getAttribute('data-comment-id') === activeCommentId;
    span.classList.toggle('word-comment-highlight-active', isMatch);
  }
}

/**
 * Scrolls the editor smoothly to the highlighted range for `commentId` and flashes it.
 */
export function scrollToCommentHighlight(
  editorEl: HTMLElement | null,
  commentId: string
): boolean {
  const spans = getCommentHighlightElements(editorEl, commentId);
  if (spans.length === 0) return false;

  spans[0].scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
  for (const span of spans) {
    span.classList.remove('word-comment-flash');
    void span.offsetWidth;
    span.classList.add('word-comment-flash');
    window.setTimeout(() => {
      span.classList.remove('word-comment-flash');
    }, 1200);
  }
  return true;
}
