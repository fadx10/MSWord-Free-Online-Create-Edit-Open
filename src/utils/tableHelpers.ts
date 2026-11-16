export interface CellRect {
  r1: number;
  c1: number;
  r2: number;
  c2: number;
}

export interface TableGridMap {
  rows: HTMLTableRowElement[];
  numRows: number;
  numCols: number;
  grid: Array<Array<HTMLTableCellElement | null>>;
  cellRects: Map<HTMLTableCellElement, CellRect>;
}

export function getTableGridMap(table: HTMLTableElement): TableGridMap {
  const rows = Array.from(table.querySelectorAll<HTMLTableRowElement>('tr'));
  const grid: Array<Array<HTMLTableCellElement | null>> = rows.map(() => []);
  const cellRects = new Map<HTMLTableCellElement, CellRect>();
  let numCols = 0;

  rows.forEach((tr, r) => {
    let c = 0;
    const cells = Array.from(tr.children).filter(
      (el): el is HTMLTableCellElement =>
        el.tagName.toLowerCase() === 'td' || el.tagName.toLowerCase() === 'th'
    );

    cells.forEach((cell) => {
      while (grid[r][c] !== undefined && grid[r][c] !== null) {
        c++;
      }
      const rowSpan = Math.max(1, cell.rowSpan || 1);
      const colSpan = Math.max(1, cell.colSpan || 1);

      for (let rr = r; rr < r + rowSpan; rr++) {
        if (!grid[rr]) grid[rr] = [];
        for (let cc = c; cc < c + colSpan; cc++) {
          grid[rr][cc] = cell;
        }
      }

      cellRects.set(cell, {
        r1: r,
        c1: c,
        r2: r + rowSpan - 1,
        c2: c + colSpan - 1,
      });

      numCols = Math.max(numCols, c + colSpan);
      c += colSpan;
    });
  });

  // Normalize rectangular grid width
  for (let r = 0; r < rows.length; r++) {
    for (let c = 0; c < numCols; c++) {
      if (grid[r][c] === undefined) {
        grid[r][c] = null;
      }
    }
  }

  return {
    rows,
    numRows: rows.length,
    numCols,
    grid,
    cellRects,
  };
}

function rangeMeaningfullyIntersectsCell(
  range: Range,
  cell: HTMLTableCellElement
): boolean {
  if (!range.intersectsNode(cell)) return false;

  // Exclude trailing cell if range ends right at offset 0 of this cell
  if (
    cell.contains(range.endContainer) &&
    !cell.contains(range.startContainer) &&
    range.endOffset === 0
  ) {
    // Check if endContainer is the very first text/element position in cell
    const walker = document.createTreeWalker(cell, NodeFilter.SHOW_TEXT);
    const firstText = walker.nextNode();
    if (
      range.endContainer === cell ||
      range.endContainer === firstText ||
      (range.endContainer.nodeType === Node.ELEMENT_NODE &&
        range.endContainer === cell.firstChild)
    ) {
      return false;
    }
  }

  // Exclude leading cell if range starts at the very end of a text node inside it
  if (
    cell.contains(range.startContainer) &&
    !cell.contains(range.endContainer) &&
    range.startContainer.nodeType === Node.TEXT_NODE &&
    range.startOffset === (range.startContainer.textContent?.length ?? 0)
  ) {
    const walker = document.createTreeWalker(cell, NodeFilter.SHOW_TEXT);
    let lastText: Node | null = null;
    let cur = walker.nextNode();
    while (cur) {
      lastText = cur;
      cur = walker.nextNode();
    }
    if (range.startContainer === lastText) {
      return false;
    }
  }

  return true;
}

export function getSelectedTableCells(
  table: HTMLTableElement,
  fallbackCell: HTMLTableCellElement,
  activeRange: Range | null
): HTMLTableCellElement[] {
  if (!activeRange || activeRange.collapsed) {
    return [fallbackCell];
  }

  const map = getTableGridMap(table);
  const allCells = Array.from(map.cellRects.keys());
  const touched = allCells.filter((c) => rangeMeaningfullyIntersectsCell(activeRange, c));

  if (touched.length <= 1) {
    return [fallbackCell];
  }

  // Keep merge/split within the fallbackCell's table section (thead vs tbody/tfoot)
  const targetSection = fallbackCell.closest('thead, tbody, tfoot') || table;
  const sameSectionTouched = touched.filter(
    (c) => (c.closest('thead, tbody, tfoot') || table) === targetSection
  );

  const basis = sameSectionTouched.length > 0 ? sameSectionTouched : [fallbackCell];
  if (basis.length <= 1) return basis;

  let minR = Infinity;
  let minC = Infinity;
  let maxR = -Infinity;
  let maxC = -Infinity;

  basis.forEach((cell) => {
    const rect = map.cellRects.get(cell);
    if (!rect) return;
    minR = Math.min(minR, rect.r1);
    minC = Math.min(minC, rect.c1);
    maxR = Math.max(maxR, rect.r2);
    maxC = Math.max(maxC, rect.c2);
  });

  const resultSet = new Set<HTMLTableCellElement>();
  for (let r = minR; r <= maxR; r++) {
    for (let c = minC; c <= maxC; c++) {
      const cell = map.grid[r]?.[c];
      if (cell && (cell.closest('thead, tbody, tfoot') || table) === targetSection) {
        resultSet.add(cell);
      }
    }
  }

  return resultSet.size > 0 ? Array.from(resultSet) : [fallbackCell];
}

export function mergeTableCells(
  table: HTMLTableElement,
  cellsToMerge: HTMLTableCellElement[]
): boolean {
  if (cellsToMerge.length < 2) return false;

  const map = getTableGridMap(table);
  const targetSection = cellsToMerge[0].closest('thead, tbody, tfoot') || table;

  let minR = Infinity;
  let minC = Infinity;
  let maxR = -Infinity;
  let maxC = -Infinity;

  cellsToMerge.forEach((cell) => {
    const rect = map.cellRects.get(cell);
    if (!rect) return;
    minR = Math.min(minR, rect.r1);
    minC = Math.min(minC, rect.c1);
    maxR = Math.max(maxR, rect.r2);
    maxC = Math.max(maxC, rect.c2);
  });

  if (!Number.isFinite(minR)) return false;

  // Collect all unique cells inside the rectangular bounding box within the same section
  const rectCells: HTMLTableCellElement[] = [];
  const seen = new Set<HTMLTableCellElement>();

  for (let r = minR; r <= maxR; r++) {
    for (let c = minC; c <= maxC; c++) {
      const cell = map.grid[r]?.[c];
      if (!cell || seen.has(cell)) continue;
      if ((cell.closest('thead, tbody, tfoot') || table) !== targetSection) continue;
      seen.add(cell);
      rectCells.push(cell);
    }
  }

  if (rectCells.length < 2) return false;

  // Expand bounds if any partially-overlapping merged cell extends past initial bounds
  rectCells.forEach((cell) => {
    const rect = map.cellRects.get(cell);
    if (!rect) return;
    minR = Math.min(minR, rect.r1);
    minC = Math.min(minC, rect.c1);
    maxR = Math.max(maxR, rect.r2);
    maxC = Math.max(maxC, rect.c2);
  });

  const anchorCell = map.grid[minR]?.[minC] ?? rectCells[0];
  const combinedParts: string[] = [];

  rectCells.forEach((cell) => {
    const rawHtml = cell.innerHTML.trim();
    const text = (cell.textContent ?? '').trim();
    if (text || /<img|<table|<hr/i.test(rawHtml)) {
      combinedParts.push(rawHtml);
    }
    if (cell !== anchorCell) {
      cell.remove();
    }
  });

  const newRowSpan = maxR - minR + 1;
  const newColSpan = maxC - minC + 1;

  if (newRowSpan > 1) anchorCell.rowSpan = newRowSpan;
  else anchorCell.removeAttribute('rowspan');

  if (newColSpan > 1) anchorCell.colSpan = newColSpan;
  else anchorCell.removeAttribute('colspan');

  anchorCell.innerHTML = combinedParts.length > 0 ? combinedParts.join('<br />') : '<br />';
  return true;
}

function createEmptyCellLike(template: HTMLTableCellElement): HTMLTableCellElement {
  const tag = template.tagName.toLowerCase() === 'th' ? 'th' : 'td';
  const el = document.createElement(tag);
  if (template.style.border) {
    el.style.border = template.style.border;
  } else {
    if (template.style.borderStyle) el.style.borderStyle = template.style.borderStyle;
    if (template.style.borderColor) el.style.borderColor = template.style.borderColor;
    if (template.style.borderWidth) el.style.borderWidth = template.style.borderWidth;
  }
  el.innerHTML = '<br />';
  return el;
}

export function unmergeCell(table: HTMLTableElement, cell: HTMLTableCellElement): boolean {
  const oldRowSpan = Math.max(1, cell.rowSpan || 1);
  const oldColSpan = Math.max(1, cell.colSpan || 1);
  if (oldRowSpan === 1 && oldColSpan === 1) return false;

  const map = getTableGridMap(table);
  const rect = map.cellRects.get(cell);
  if (!rect) return false;

  cell.removeAttribute('rowspan');
  cell.removeAttribute('colspan');

  for (let r = rect.r1; r <= rect.r2; r++) {
    const tr = map.rows[r];
    if (!tr) continue;

    // Find the first existing DOM cell in row r whose logical column starts after rect.c2
    let insertBeforeEl: HTMLTableCellElement | null = null;
    for (let c = rect.c2 + 1; c < map.numCols; c++) {
      const candidate = map.grid[r]?.[c];
      if (candidate && candidate.parentElement === tr) {
        insertBeforeEl = candidate;
        break;
      }
    }

    const startCol = r === rect.r1 ? rect.c1 + 1 : rect.c1;
    for (let c = startCol; c <= rect.c2; c++) {
      const newCell = createEmptyCellLike(cell);
      if (insertBeforeEl) {
        tr.insertBefore(newCell, insertBeforeEl);
      } else {
        tr.appendChild(newCell);
      }
    }
  }

  return true;
}

export function splitTableCells(
  table: HTMLTableElement,
  cells: HTMLTableCellElement[],
  targetCols: number,
  targetRows: number
): boolean {
  const cols = Math.max(1, Math.min(8, Math.floor(targetCols)));
  const rows = Math.max(1, Math.min(8, Math.floor(targetRows)));

  let changed = false;

  cells.forEach((cell) => {
    if (!table.contains(cell)) return;

    const curColSpan = Math.max(1, cell.colSpan || 1);
    const curRowSpan = Math.max(1, cell.rowSpan || 1);

    // If splitting a merged cell into its exact original dimensions (or 1x1), unmerge cleanly first
    if (curColSpan > 1 || curRowSpan > 1) {
      unmergeCell(table, cell);
      changed = true;
      if (cols === curColSpan && rows === curRowSpan) {
        return;
      }
      if (cols === 1 && rows === 1) {
        return;
      }
    }

    if (cols === 1 && rows === 1) return;

    const map = getTableGridMap(table);
    const rect = map.cellRects.get(cell);
    if (!rect) return;

    // 1. Expand columns: add (cols - 1) cells after `cell` in its row,
    // and widen one covering cell in every other row that crosses column rect.c1
    if (cols > 1) {
      const parentRow = map.rows[rect.r1];
      let refNode = cell.nextSibling;
      for (let i = 1; i < cols; i++) {
        const extraCell = createEmptyCellLike(cell);
        parentRow.insertBefore(extraCell, refNode);
        refNode = extraCell.nextSibling;
      }

      const widened = new Set<HTMLTableCellElement>([cell]);
      for (let r = 0; r < map.numRows; r++) {
        if (r === rect.r1) continue;
        const other = map.grid[r]?.[rect.c1];
        if (other && !widened.has(other)) {
          widened.add(other);
          other.colSpan = Math.max(1, other.colSpan || 1) + (cols - 1);
        }
      }
      changed = true;
    }

    // 2. Expand rows: add (rows - 1) new rows after rect.r1,
    // and increase rowSpan on every other cell crossing row rect.r1
    if (rows > 1) {
      const refreshedMap = getTableGridMap(table);
      const stretched = new Set<HTMLTableCellElement>([cell]);
      for (let c = 0; c < refreshedMap.numCols; c++) {
        const other = refreshedMap.grid[rect.r1]?.[c];
        // Skip the newly inserted sibling cells from step 1
        const otherRect = other ? refreshedMap.cellRects.get(other) : undefined;
        const isSplitSibling =
          otherRect &&
          otherRect.r1 === rect.r1 &&
          otherRect.c1 >= rect.c1 &&
          otherRect.c1 < rect.c1 + cols;
        if (other && !stretched.has(other) && !isSplitSibling) {
          stretched.add(other);
          other.rowSpan = Math.max(1, other.rowSpan || 1) + (rows - 1);
        }
      }

      const anchorRow = refreshedMap.rows[rect.r1];
      let insertAfter: HTMLTableRowElement = anchorRow;
      for (let r = 1; r < rows; r++) {
        const newTr = document.createElement('tr');
        for (let c = 0; c < cols; c++) {
          newTr.appendChild(createEmptyCellLike(cell));
        }
        insertAfter.after(newTr);
        insertAfter = newTr;
      }
      changed = true;
    }
  });

  return changed;
}

export interface TableBorderState {
  enabled: boolean;
  color: string;
  widthPx: number;
}

function rgbToHex(colorStr: string): string {
  const trimmed = colorStr.trim();
  if (!trimmed) return '#8A8886';
  if (trimmed.startsWith('#')) return trimmed.toUpperCase();
  const match = trimmed.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (match) {
    const r = Number(match[1]).toString(16).padStart(2, '0');
    const g = Number(match[2]).toString(16).padStart(2, '0');
    const b = Number(match[3]).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`.toUpperCase();
  }
  return trimmed;
}

export function getSelectedTable(
  editorEl: HTMLElement | null,
  range?: Range | null
): HTMLTableElement | null {
  if (!editorEl || !range || !editorEl.contains(range.startContainer)) {
    return null;
  }
  const startNode =
    range.startContainer.nodeType === Node.ELEMENT_NODE
      ? (range.startContainer as HTMLElement)
      : range.startContainer.parentElement;
  const table = startNode?.closest('table') as HTMLTableElement | null;
  if (table && editorEl.contains(table)) {
    return table;
  }

  // Also check if a non-collapsed range spans into a table
  if (!range.collapsed) {
    const tables = Array.from(editorEl.querySelectorAll<HTMLTableElement>('table'));
    const intersected = tables.find((t) => {
      try {
        return range.intersectsNode(t);
      } catch {
        return false;
      }
    });
    if (intersected) return intersected;
  }

  return null;
}

export function getTableBorderState(table: HTMLTableElement | null): TableBorderState {
  if (!table) {
    return { enabled: true, color: '#8A8886', widthPx: 1 };
  }

  const enabledAttr = table.getAttribute('data-border-enabled');
  const colorAttr = table.getAttribute('data-border-color');
  const widthAttr = table.getAttribute('data-border-width');

  if (enabledAttr !== null || colorAttr !== null || widthAttr !== null) {
    const enabled = enabledAttr !== 'false';
    const color = colorAttr ? rgbToHex(colorAttr) : '#8A8886';
    const parsedWidth = widthAttr ? parseFloat(widthAttr) : 1;
    const widthPx = Number.isFinite(parsedWidth) && parsedWidth > 0 ? parsedWidth : 1;
    return { enabled, color, widthPx };
  }

  const firstCell = table.querySelector<HTMLTableCellElement>('td, th');
  if (firstCell) {
    const borderStyle = firstCell.style.borderStyle;
    const borderWidth = firstCell.style.borderWidth;
    const borderColor = firstCell.style.borderColor;

    const disabled =
      borderStyle === 'none' ||
      firstCell.style.border === 'none' ||
      borderWidth === '0px' ||
      borderWidth === '0';

    const parsedWidth = parseFloat(borderWidth);
    return {
      enabled: !disabled,
      color: borderColor ? rgbToHex(borderColor) : '#8A8886',
      widthPx: Number.isFinite(parsedWidth) && parsedWidth > 0 ? parsedWidth : 1,
    };
  }

  return { enabled: true, color: '#8A8886', widthPx: 1 };
}

export function applyTableBorders(
  table: HTMLTableElement,
  state: TableBorderState
): void {
  const normalizedColor = rgbToHex(state.color || '#8A8886');
  const clampedWidth = Math.max(0.5, Math.min(8, Number(state.widthPx) || 1));

  table.setAttribute('data-border-enabled', state.enabled ? 'true' : 'false');
  table.setAttribute('data-border-color', normalizedColor);
  table.setAttribute('data-border-width', String(clampedWidth));

  const borderCss = state.enabled
    ? `${clampedWidth}px solid ${normalizedColor}`
    : 'none';

  table.style.border = borderCss;
  table.querySelectorAll<HTMLTableCellElement>('th, td').forEach((cell) => {
    cell.style.border = borderCss;
  });
}

