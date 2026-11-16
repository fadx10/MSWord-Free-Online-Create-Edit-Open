import mammoth from 'mammoth/mammoth.browser.js';
import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  HeadingLevel,
  ImageRun,
  Packer,
  PageNumber,
  PageOrientation,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  UnderlineType,
  WidthType,
  convertInchesToTwip,
} from 'docx';
import {
  DocumentSettings,
  MARGIN_INCHES,
  PAGE_DIMENSIONS_INCHES,
} from '../types/word';

export interface ImportedFileResult {
  title: string;
  contentHtml: string;
  warnings: string[];
}

export async function importFileToHtml(file: File): Promise<ImportedFileResult> {
  const baseName = file.name.replace(/\.[^/.]+$/, '') || 'Imported Document';
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';

  if (ext === 'docx') {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.convertToHtml({ arrayBuffer });
    const html = result.value?.trim() ? result.value : '<p><br /></p>';
    return {
      title: baseName,
      contentHtml: html,
      warnings: result.messages.map((m) => m.message),
    };
  }

  const text = await file.text();

  if (ext === 'html' || ext === 'htm') {
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/html');
    const bodyHtml = doc.body?.innerHTML?.trim() || '<p><br /></p>';
    return {
      title: doc.title?.trim() || baseName,
      contentHtml: bodyHtml,
      warnings: [],
    };
  }

  if (ext === 'md' || ext === 'markdown') {
    const html = convertMarkdownToHtml(text);
    return {
      title: baseName,
      contentHtml: html,
      warnings: [],
    };
  }

  // Fallback for .txt / .rtf / plain text
  const paragraphs = text
    .split(/\r?\n\r?\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => `<p>${escapeHtml(block).replace(/\r?\n/g, '<br />')}</p>`)
    .join('');

  return {
    title: baseName,
    contentHtml: paragraphs || '<p><br /></p>',
    warnings: [],
  };
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function convertMarkdownToHtml(md: string): string {
  const lines = md.split(/\r?\n/);
  const out: string[] = [];
  let inUl = false;
  let inOl = false;

  const closeLists = () => {
    if (inUl) {
      out.push('</ul>');
      inUl = false;
    }
    if (inOl) {
      out.push('</ol>');
      inOl = false;
    }
  };

  const inlineFormat = (s: string) =>
    escapeHtml(s)
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code>$1</code>');

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    if (!line.trim()) {
      closeLists();
      continue;
    }
    if (line.startsWith('### ')) {
      closeLists();
      out.push(`<h3>${inlineFormat(line.slice(4))}</h3>`);
    } else if (line.startsWith('## ')) {
      closeLists();
      out.push(`<h2>${inlineFormat(line.slice(3))}</h2>`);
    } else if (line.startsWith('# ')) {
      closeLists();
      out.push(`<h1>${inlineFormat(line.slice(2))}</h1>`);
    } else if (/^[-*]\s+/.test(line)) {
      if (inOl) {
        out.push('</ol>');
        inOl = false;
      }
      if (!inUl) {
        out.push('<ul>');
        inUl = true;
      }
      out.push(`<li>${inlineFormat(line.replace(/^[-*]\s+/, ''))}</li>`);
    } else if (/^\d+\.\s+/.test(line)) {
      if (inUl) {
        out.push('</ul>');
        inUl = false;
      }
      if (!inOl) {
        out.push('<ol>');
        inOl = true;
      }
      out.push(`<li>${inlineFormat(line.replace(/^\d+\.\s+/, ''))}</li>`);
    } else if (line.startsWith('> ')) {
      closeLists();
      out.push(`<blockquote>${inlineFormat(line.slice(2))}</blockquote>`);
    } else if (line === '---' || line === '***') {
      closeLists();
      out.push('<hr />');
    } else {
      closeLists();
      out.push(`<p>${inlineFormat(line)}</p>`);
    }
  }
  closeLists();
  return out.join('') || '<p><br /></p>';
}

interface InlineRunStyle {
  bold?: boolean;
  italics?: boolean;
  underline?: boolean;
  strike?: boolean;
  subScript?: boolean;
  superScript?: boolean;
  color?: string;
  highlight?: string;
  font?: string;
  sizeHalfPoints?: number;
}

function normalizeHexColor(cssColor: string | undefined): string | undefined {
  if (!cssColor) return undefined;
  const trimmed = cssColor.trim();
  if (trimmed.startsWith('#')) {
    const hex = trimmed.slice(1);
    if (hex.length === 3) {
      return hex
        .split('')
        .map((c) => c + c)
        .join('')
        .toUpperCase();
    }
    if (hex.length === 6) return hex.toUpperCase();
  }
  const rgbMatch = trimmed.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (rgbMatch) {
    const r = Number(rgbMatch[1]).toString(16).padStart(2, '0');
    const g = Number(rgbMatch[2]).toString(16).padStart(2, '0');
    const b = Number(rgbMatch[3]).toString(16).padStart(2, '0');
    return `${r}${g}${b}`.toUpperCase();
  }
  return undefined;
}

function mapHighlightColor(
  cssBg: string | undefined
):
  | 'yellow'
  | 'green'
  | 'cyan'
  | 'magenta'
  | 'red'
  | 'blue'
  | 'darkBlue'
  | 'lightGray'
  | undefined {
  if (!cssBg) return undefined;
  const hex = normalizeHexColor(cssBg);
  if (!hex || hex === 'FFFFFF' || hex === 'TRANSPARENT') return undefined;
  if (hex.startsWith('FF') || hex.startsWith('FE') || hex === 'FFF59D') return 'yellow';
  if (hex === 'A7F3D0' || hex === 'BBF7D0' || hex === '00FF00') return 'green';
  if (hex === 'BAE6FD' || hex === 'A5F3FC' || hex === '00FFFF') return 'cyan';
  if (hex === 'FBCFE8' || hex === 'F5D0FE' || hex === 'FF00FF') return 'magenta';
  if (hex === 'FECACA') return 'red';
  return 'yellow';
}

function parseFontSizeHalfPoints(fontSizeStr: string | undefined): number | undefined {
  if (!fontSizeStr) return undefined;
  const ptMatch = fontSizeStr.match(/([\d.]+)\s*pt/i);
  if (ptMatch) return Math.round(parseFloat(ptMatch[1]) * 2);
  const pxMatch = fontSizeStr.match(/([\d.]+)\s*px/i);
  if (pxMatch) return Math.round(parseFloat(pxMatch[1]) * 0.75 * 2);
  return undefined;
}

function mapAlignment(
  alignStr: string | undefined
): (typeof AlignmentType)[keyof typeof AlignmentType] | undefined {
  if (!alignStr) return undefined;
  switch (alignStr.toLowerCase()) {
    case 'center':
      return AlignmentType.CENTER;
    case 'right':
      return AlignmentType.RIGHT;
    case 'justify':
      return AlignmentType.JUSTIFIED;
    case 'left':
      return AlignmentType.LEFT;
    default:
      return undefined;
  }
}

function collectRunsFromNode(
  node: Node,
  inherited: InlineRunStyle
): Array<TextRun | ImageRun> {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent ?? '';
    if (!text) return [];
    return [
      new TextRun({
        text,
        bold: inherited.bold,
        italics: inherited.italics,
        underline: inherited.underline ? { type: UnderlineType.SINGLE } : undefined,
        strike: inherited.strike,
        subScript: inherited.subScript,
        superScript: inherited.superScript,
        color: inherited.color,
        highlight: mapHighlightColor(inherited.highlight),
        font: inherited.font,
        size: inherited.sizeHalfPoints,
      }),
    ];
  }

  if (node.nodeType !== Node.ELEMENT_NODE) return [];
  const el = node as HTMLElement;
  const tag = el.tagName.toLowerCase();

  if (tag === 'br') {
    return [new TextRun({ break: 1 })];
  }

  if (tag === 'img') {
    const src = el.getAttribute('src') || '';
    if (src.startsWith('data:image/')) {
      try {
        const [meta, base64] = src.split(',');
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        const imgType = meta.includes('png')
          ? 'png'
          : meta.includes('gif')
            ? 'gif'
            : meta.includes('bmp')
              ? 'bmp'
              : 'jpg';
        const width = Math.min(el.clientWidth || 320, 520);
        const height = Math.min(el.clientHeight || 200, 400);
        return [
          new ImageRun({
            data: bytes,
            transformation: { width, height },
            type: imgType,
          }),
        ];
      } catch {
        return [];
      }
    }
    return [];
  }

  const next: InlineRunStyle = { ...inherited };
  if (tag === 'strong' || tag === 'b') next.bold = true;
  if (tag === 'em' || tag === 'i') next.italics = true;
  if (tag === 'u') next.underline = true;
  if (tag === 's' || tag === 'strike' || tag === 'del') next.strike = true;
  if (tag === 'sub') next.subScript = true;
  if (tag === 'sup') next.superScript = true;
  if (tag === 'a') {
    next.color = '0563C1';
    next.underline = true;
  }

  const style = el.style;
  if (style.fontWeight === 'bold' || Number(style.fontWeight) >= 600) next.bold = true;
  if (style.fontStyle === 'italic') next.italics = true;
  if (style.textDecoration?.includes('underline')) next.underline = true;
  if (style.textDecoration?.includes('line-through')) next.strike = true;
  if (style.color) next.color = normalizeHexColor(style.color) ?? next.color;
  if (style.backgroundColor) next.highlight = style.backgroundColor;
  if (style.fontFamily) next.font = style.fontFamily.replace(/['"]/g, '').split(',')[0].trim();
  if (style.fontSize) {
    next.sizeHalfPoints = parseFontSizeHalfPoints(style.fontSize) ?? next.sizeHalfPoints;
  }

  const fontAttrColor = el.getAttribute('color');
  if (fontAttrColor) next.color = normalizeHexColor(fontAttrColor) ?? next.color;
  const fontAttrFace = el.getAttribute('face');
  if (fontAttrFace) next.font = fontAttrFace;

  const runs: Array<TextRun | ImageRun> = [];
  el.childNodes.forEach((child) => {
    runs.push(...collectRunsFromNode(child, next));
  });
  return runs;
}

function convertTableElement(tableEl: HTMLTableElement): Table {
  const rows: TableRow[] = [];
  const trList = tableEl.querySelectorAll('tr');
  trList.forEach((tr) => {
    const cells: TableCell[] = [];
    tr.querySelectorAll('th, td').forEach((cell) => {
      const cellEl = cell as HTMLTableCellElement;
      const isHeader = cell.tagName.toLowerCase() === 'th';
      const runs = collectRunsFromNode(cellEl, { bold: isHeader });
      cells.push(
        new TableCell({
          columnSpan: cellEl.colSpan > 1 ? cellEl.colSpan : undefined,
          rowSpan: cellEl.rowSpan > 1 ? cellEl.rowSpan : undefined,
          children: [
            new Paragraph({
              children: runs.length ? runs : [new TextRun('')],
            }),
          ],
          shading: isHeader ? { fill: 'F3F2F1' } : undefined,
        })
      );
    });
    if (cells.length) {
      rows.push(new TableRow({ children: cells }));
    }
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: rows.length
      ? rows
      : [new TableRow({ children: [new TableCell({ children: [new Paragraph('')] })] })],
  });
}

function convertBlockElement(
  el: HTMLElement,
  settings: DocumentSettings
): Array<Paragraph | Table> {
  const tag = el.tagName.toLowerCase();
  const align = mapAlignment(el.style.textAlign);
  const lineRule = Math.round(settings.lineSpacing * 240);

  if (el.classList.contains('word-page-break')) {
    return [new Paragraph({ pageBreakBefore: true, children: [] })];
  }

  if (tag === 'table') {
    return [convertTableElement(el as HTMLTableElement)];
  }

  if (tag === 'hr') {
    return [
      new Paragraph({
        border: {
          bottom: { color: 'C8C6C4', space: 1, style: BorderStyle.SINGLE, size: 6 },
        },
        children: [],
      }),
    ];
  }

  if (tag === 'ul' || tag === 'ol') {
    const items: Paragraph[] = [];
    const isOrdered = tag === 'ol';
    Array.from(el.children).forEach((li, index) => {
      const runs = collectRunsFromNode(li, {});
      items.push(
        new Paragraph({
          bullet: isOrdered ? undefined : { level: 0 },
          children: isOrdered
            ? [new TextRun({ text: `${index + 1}. ` }), ...runs]
            : runs.length
              ? runs
              : [new TextRun('')],
          spacing: { after: 100, line: lineRule },
        })
      );
    });
    return items;
  }

  if (tag === 'h1') {
    return [
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        alignment: align,
        children: collectRunsFromNode(el, { sizeHalfPoints: 36, color: '0F6CBD' }),
        spacing: { before: 240, after: 80, line: lineRule },
      }),
    ];
  }

  if (tag === 'h2') {
    return [
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        alignment: align,
        children: collectRunsFromNode(el, { sizeHalfPoints: 30, color: '0F6CBD' }),
        spacing: { before: 200, after: 80, line: lineRule },
      }),
    ];
  }

  if (tag === 'h3') {
    return [
      new Paragraph({
        heading: HeadingLevel.HEADING_3,
        alignment: align,
        children: collectRunsFromNode(el, { bold: true, sizeHalfPoints: 26, color: '104A9E' }),
        spacing: { before: 160, after: 60, line: lineRule },
      }),
    ];
  }

  if (tag === 'h4' && el.classList.contains('word-title')) {
    return [
      new Paragraph({
        heading: HeadingLevel.TITLE,
        alignment: align,
        children: collectRunsFromNode(el, { sizeHalfPoints: 52, color: '242424' }),
        spacing: { after: 120 },
      }),
    ];
  }

  if (tag === 'blockquote') {
    return [
      new Paragraph({
        alignment: align,
        indent: { left: convertInchesToTwip(0.5), right: convertInchesToTwip(0.5) },
        children: collectRunsFromNode(el, { italics: true, color: '484644' }),
        spacing: { before: 120, after: 120, line: lineRule },
      }),
    ];
  }

  // Generic container divs or paragraphs
  const hasBlockChildren = Array.from(el.children).some((c) =>
    ['p', 'div', 'h1', 'h2', 'h3', 'h4', 'ul', 'ol', 'table', 'blockquote', 'hr'].includes(
      c.tagName.toLowerCase()
    )
  );

  if (tag === 'div' && hasBlockChildren && !el.classList.contains('word-callout')) {
    const nested: Array<Paragraph | Table> = [];
    el.childNodes.forEach((child) => {
      if (child.nodeType === Node.ELEMENT_NODE) {
        nested.push(...convertBlockElement(child as HTMLElement, settings));
      } else if (child.nodeType === Node.TEXT_NODE && child.textContent?.trim()) {
        nested.push(new Paragraph({ children: [new TextRun(child.textContent)] }));
      }
    });
    return nested;
  }

  const runs = collectRunsFromNode(el, {});
  return [
    new Paragraph({
      alignment: align,
      children: runs.length ? runs : [new TextRun('')],
      spacing: { after: 160, line: lineRule },
    }),
  ];
}

export async function exportHtmlToDocx(
  title: string,
  contentHtml: string,
  headerText: string,
  footerText: string,
  settings: DocumentSettings
): Promise<void> {
  const parser = new DOMParser();
  const parsed = parser.parseFromString(contentHtml, 'text/html');
  const children: Array<Paragraph | Table> = [];

  parsed.body.childNodes.forEach((node) => {
    if (node.nodeType === Node.ELEMENT_NODE) {
      children.push(...convertBlockElement(node as HTMLElement, settings));
    } else if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
      children.push(
        new Paragraph({
          children: [new TextRun(node.textContent)],
        })
      );
    }
  });

  if (children.length === 0) {
    children.push(new Paragraph(''));
  }

  const margins = MARGIN_INCHES[settings.margins];
  const dim = PAGE_DIMENSIONS_INCHES[settings.pageSize];
  const isLandscape = settings.orientation === 'landscape';

  const doc = new Document({
    title,
    creator: 'Word Online',
    sections: [
      {
        properties: {
          page: {
            size: {
              width: convertInchesToTwip(isLandscape ? dim.height : dim.width),
              height: convertInchesToTwip(isLandscape ? dim.width : dim.height),
              orientation: isLandscape
                ? PageOrientation.LANDSCAPE
                : PageOrientation.PORTRAIT,
            },
            margin: {
              top: convertInchesToTwip(margins.top),
              right: convertInchesToTwip(margins.right),
              bottom: convertInchesToTwip(margins.bottom),
              left: convertInchesToTwip(margins.left),
            },
          },
        },
        headers: headerText.trim()
          ? {
              default: new Header({
                children: [
                  new Paragraph({
                    alignment: AlignmentType.RIGHT,
                    children: [
                      new TextRun({
                        text: headerText,
                        color: '605E5C',
                        size: 18,
                      }),
                    ],
                  }),
                ],
              }),
            }
          : undefined,
        footers: footerText.trim()
          ? {
              default: new Footer({
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: footerText
                      .split(/(\{PAGE\}|\{NUMPAGES\})/g)
                      .filter(Boolean)
                      .map((part) => {
                        if (part === '{PAGE}') {
                          return new TextRun({
                            children: [PageNumber.CURRENT],
                            color: '605E5C',
                            size: 18,
                          });
                        }
                        if (part === '{NUMPAGES}') {
                          return new TextRun({
                            children: [PageNumber.TOTAL_PAGES],
                            color: '605E5C',
                            size: 18,
                          });
                        }
                        return new TextRun({
                          text: part,
                          color: '605E5C',
                          size: 18,
                        });
                      }),
                  }),
                ],
              }),
            }
          : undefined,
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  triggerBlobDownload(blob, `${sanitizeFilename(title)}.docx`);
}

export function exportHtmlToHtmlFile(title: string, contentHtml: string): void {
  const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    body { font-family: Calibri, 'Segoe UI', sans-serif; max-width: 816px; margin: 48px auto; padding: 0 32px; color: #1b1a19; line-height: 1.4; }
    table { border-collapse: collapse; width: 100%; margin: 12px 0; }
    td, th { border: 1px solid #8a8886; padding: 6px 10px; }
    th { background: #f3f2f1; }
    h1, h2 { color: #0f6cbd; font-weight: 400; }
  </style>
</head>
<body>
${contentHtml}
</body>
</html>`;
  const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
  triggerBlobDownload(blob, `${sanitizeFilename(title)}.html`);
}

export function exportHtmlToTextFile(title: string, contentHtml: string): void {
  const parser = new DOMParser();
  const parsed = parser.parseFromString(contentHtml, 'text/html');
  const plainText = parsed.body.innerText || parsed.body.textContent || '';
  const blob = new Blob([plainText], { type: 'text/plain;charset=utf-8' });
  triggerBlobDownload(blob, `${sanitizeFilename(title)}.txt`);
}

function sanitizeFilename(name: string): string {
  return (name.trim() || 'Document1').replace(/[<>:"/\\|?*]+/g, '_');
}

function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
