import JSZip from 'jszip';
import {
  CustomMarginsInches,
  DEFAULT_DOCUMENT_SETTINGS,
  DocumentSettings,
  ImportedBaseStyle,
  MARGIN_INCHES,
  MarginPreset,
  Orientation,
  PageSize,
} from '../types/word';

export interface DocxImportOutput {
  contentHtml: string;
  headerText: string;
  footerText: string;
  settings: Partial<DocumentSettings>;
  warnings: string[];
}

interface ResolvedRunStyle {
  fontFamily?: string;
  fontSizePt?: number;
  color?: string;
  backgroundColor?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strike?: boolean;
  vertAlign?: 'superscript' | 'subscript';
  caps?: boolean;
  smallCaps?: boolean;
}

interface BorderDef {
  style: 'none' | 'solid' | 'dashed' | 'dotted' | 'double';
  widthPx: number;
  color: string;
}

interface ResolvedBorders {
  top?: BorderDef;
  bottom?: BorderDef;
  left?: BorderDef;
  right?: BorderDef;
  insideH?: BorderDef;
  insideV?: BorderDef;
}

interface ResolvedParaStyle {
  align?: 'left' | 'center' | 'right' | 'justify';
  spaceBeforePt?: number;
  spaceAfterPt?: number;
  lineHeight?: number | string;
  lineHeightNumeric?: number;
  leftIndentPt?: number;
  rightIndentPt?: number;
  firstLinePt?: number;
  hangingPt?: number;
  backgroundColor?: string;
  borders?: ResolvedBorders;
  outlineLvl?: number;
  pageBreakBefore?: boolean;
  numId?: string;
  ilvl?: number;
}

interface StyleDefinition {
  styleId: string;
  type: string;
  name: string;
  basedOn?: string;
  isDefault: boolean;
  pPrEl: Element | null;
  rPrEl: Element | null;
  tblPrEl: Element | null;
  tcPrEl: Element | null;
  firstRowPPrEl: Element | null;
  firstRowRPrEl: Element | null;
  firstRowTcPrEl: Element | null;
}

interface ThemeContext {
  majorFont?: string;
  minorFont?: string;
  colors: Record<string, string>;
}

interface NumberingLevelInfo {
  numFmt: string;
  lvlText: string;
  isOrdered: boolean;
  cssListType: string;
}

const HIGHLIGHT_MAP: Record<string, string> = {
  yellow: '#FFFF00',
  green: '#00FF00',
  cyan: '#00FFFF',
  magenta: '#FF00FF',
  blue: '#0000FF',
  red: '#FF0000',
  darkblue: '#00008B',
  darkcyan: '#008B8B',
  darkgreen: '#006400',
  darkmagenta: '#8B008B',
  darkred: '#8B0000',
  darkyellow: '#808000',
  darkgray: '#A9A9A9',
  lightgray: '#D3D3D3',
  black: '#000000',
  white: '#FFFFFF',
};

function localName(node: Node | null | undefined): string {
  if (!node || node.nodeType !== Node.ELEMENT_NODE) return '';
  const el = node as Element;
  return (el.localName || el.tagName.split(':').pop() || '').toLowerCase();
}

function childElements(parent: Element | null | undefined): Element[] {
  if (!parent) return [];
  const out: Element[] = [];
  for (let i = 0; i < parent.children.length; i++) {
    out.push(parent.children[i]);
  }
  return out;
}

function firstChildByLocal(parent: Element | null | undefined, name: string): Element | null {
  if (!parent) return null;
  const target = name.toLowerCase();
  for (let i = 0; i < parent.children.length; i++) {
    const ch = parent.children[i];
    if (localName(ch) === target) return ch;
  }
  return null;
}

function childrenByLocal(parent: Element | null | undefined, name: string): Element[] {
  if (!parent) return [];
  const target = name.toLowerCase();
  const out: Element[] = [];
  for (let i = 0; i < parent.children.length; i++) {
    const ch = parent.children[i];
    if (localName(ch) === target) out.push(ch);
  }
  return out;
}

function findDescendantsByLocal(root: Element | null | undefined, name: string): Element[] {
  if (!root) return [];
  const target = name.toLowerCase();
  const out: Element[] = [];
  const walk = (el: Element) => {
    for (let i = 0; i < el.children.length; i++) {
      const ch = el.children[i];
      if (localName(ch) === target) out.push(ch);
      walk(ch);
    }
  };
  walk(root);
  return out;
}

function findFirstDescendant(root: Element | null | undefined, name: string): Element | null {
  if (!root) return null;
  const target = name.toLowerCase();
  const stack: Element[] = childElements(root);
  while (stack.length > 0) {
    const cur = stack.shift()!;
    if (localName(cur) === target) return cur;
    const kids = childElements(cur);
    if (kids.length) stack.unshift(...kids);
  }
  return null;
}

function getAttr(el: Element | null | undefined, attrLocalName: string): string | null {
  if (!el) return null;
  const target = attrLocalName.toLowerCase();
  for (let i = 0; i < el.attributes.length; i++) {
    const attr = el.attributes[i];
    const name = (attr.localName || attr.name.split(':').pop() || '').toLowerCase();
    if (name === target) return attr.value;
  }
  return null;
}

function escapeHtmlText(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeAttr(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function parseBoolToggle(el: Element | null): boolean | undefined {
  if (!el) return undefined;
  const val = getAttr(el, 'val');
  if (val === null) return true;
  const lower = val.toLowerCase();
  if (lower === '0' || lower === 'false' || lower === 'off' || lower === 'none') {
    return false;
  }
  return true;
}

function normalizeHex6(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const cleaned = raw.trim().replace(/^#/, '');
  if (/^[0-9a-f]{6}$/i.test(cleaned)) {
    return `#${cleaned.toUpperCase()}`;
  }
  if (/^[0-9a-f]{3}$/i.test(cleaned)) {
    return `#${cleaned
      .split('')
      .map((c) => c + c)
      .join('')
      .toUpperCase()}`;
  }
  return null;
}

function applyTintShade(hex: string, tintHex: string | null, shadeHex: string | null): string {
  const clean = hex.replace(/^#/, '');
  if (clean.length !== 6) return hex;
  let r = parseInt(clean.slice(0, 2), 16);
  let g = parseInt(clean.slice(2, 4), 16);
  let b = parseInt(clean.slice(4, 6), 16);

  if (tintHex && /^[0-9a-f]{2}$/i.test(tintHex)) {
    const tint = parseInt(tintHex, 16) / 255;
    r = Math.round(r * tint + 255 * (1 - tint));
    g = Math.round(g * tint + 255 * (1 - tint));
    b = Math.round(b * tint + 255 * (1 - tint));
  }
  if (shadeHex && /^[0-9a-f]{2}$/i.test(shadeHex)) {
    const shade = parseInt(shadeHex, 16) / 255;
    r = Math.round(r * shade);
    g = Math.round(g * shade);
    b = Math.round(b * shade);
  }

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`.toUpperCase();
}

function resolveColorFromEl(
  colorEl: Element | null,
  theme: ThemeContext,
  attrName = 'val'
): string | undefined {
  if (!colorEl) return undefined;
  const val = getAttr(colorEl, attrName);
  const themeColor = getAttr(colorEl, 'themeColor');

  let resolved: string | null = null;

  if (val && val.toLowerCase() !== 'auto' && val.toLowerCase() !== 'none') {
    resolved = normalizeHex6(val);
  }

  if (!resolved && themeColor) {
    const key = themeColor.toLowerCase();
    const mappedKey =
      key === 'text1' || key === 'tx1'
        ? 'dk1'
        : key === 'background1' || key === 'bg1'
          ? 'lt1'
          : key === 'text2' || key === 'tx2'
            ? 'dk2'
            : key === 'background2' || key === 'bg2'
              ? 'lt2'
              : key === 'hyperlink'
                ? 'hlink'
                : key === 'followedhyperlink'
                  ? 'folhlink'
                  : key;
    resolved = theme.colors[mappedKey] ?? null;
  }

  if (!resolved) return undefined;

  const tint = getAttr(colorEl, 'themeTint');
  const shade = getAttr(colorEl, 'themeShade');
  if (tint || shade) {
    resolved = applyTintShade(resolved, tint, shade);
  }

  return resolved;
}

function parseXml(xmlText: string): Document | null {
  try {
    const doc = new DOMParser().parseFromString(xmlText, 'application/xml');
    if (doc.querySelector('parsererror')) return null;
    return doc;
  } catch {
    return null;
  }
}

function parseTheme(xmlText: string | null): ThemeContext {
  const ctx: ThemeContext = {
    colors: {
      dk1: '#000000',
      lt1: '#FFFFFF',
      dk2: '#44546A',
      lt2: '#E7E6E6',
      accent1: '#4472C4',
      accent2: '#ED7D31',
      accent3: '#A5A5A5',
      accent4: '#FFC000',
      accent5: '#5B9BD5',
      accent6: '#70AD47',
      hlink: '#0563C1',
      folhlink: '#954F72',
    },
  };
  if (!xmlText) return ctx;
  const doc = parseXml(xmlText);
  if (!doc) return ctx;

  const majorFont = findFirstDescendant(doc.documentElement, 'majorFont');
  const majorLatin = firstChildByLocal(majorFont, 'latin');
  const majorTypeface = getAttr(majorLatin, 'typeface');
  if (majorTypeface) ctx.majorFont = majorTypeface;

  const minorFont = findFirstDescendant(doc.documentElement, 'minorFont');
  const minorLatin = firstChildByLocal(minorFont, 'latin');
  const minorTypeface = getAttr(minorLatin, 'typeface');
  if (minorTypeface) ctx.minorFont = minorTypeface;

  const clrScheme = findFirstDescendant(doc.documentElement, 'clrScheme');
  if (clrScheme) {
    childElements(clrScheme).forEach((entry) => {
      const slot = localName(entry);
      const srgb = firstChildByLocal(entry, 'srgbClr');
      const sysClr = firstChildByLocal(entry, 'sysClr');
      const hex =
        normalizeHex6(getAttr(srgb, 'val')) ||
        normalizeHex6(getAttr(sysClr, 'lastClr')) ||
        normalizeHex6(getAttr(sysClr, 'val'));
      if (slot && hex) {
        ctx.colors[slot] = hex;
      }
    });
  }

  return ctx;
}

function extractRunStyleFromRPr(rPrEl: Element | null, theme: ThemeContext): ResolvedRunStyle {
  const out: ResolvedRunStyle = {};
  if (!rPrEl) return out;

  const rFonts = firstChildByLocal(rPrEl, 'rFonts');
  if (rFonts) {
    let font =
      getAttr(rFonts, 'ascii') ||
      getAttr(rFonts, 'hAnsi') ||
      getAttr(rFonts, 'cs') ||
      getAttr(rFonts, 'eastAsia');
    if (!font) {
      const themeAttr = (
        getAttr(rFonts, 'asciiTheme') ||
        getAttr(rFonts, 'hAnsiTheme') ||
        getAttr(rFonts, 'cstheme') ||
        ''
      ).toLowerCase();
      if (themeAttr.startsWith('major')) font = theme.majorFont ?? null;
      else if (themeAttr.startsWith('minor')) font = theme.minorFont ?? null;
    }
    if (font) {
      out.fontFamily = font;
    }
  }

  const sz = firstChildByLocal(rPrEl, 'sz') || firstChildByLocal(rPrEl, 'szCs');
  if (sz) {
    const val = Number(getAttr(sz, 'val'));
    if (Number.isFinite(val) && val > 0) {
      out.fontSizePt = Math.round((val / 2) * 10) / 10;
    }
  }

  const colorEl = firstChildByLocal(rPrEl, 'color');
  const color = resolveColorFromEl(colorEl, theme);
  if (color) out.color = color;

  const highlightEl = firstChildByLocal(rPrEl, 'highlight');
  if (highlightEl) {
    const hVal = (getAttr(highlightEl, 'val') || '').toLowerCase();
    if (hVal === 'none') {
      out.backgroundColor = 'transparent';
    } else if (HIGHLIGHT_MAP[hVal]) {
      out.backgroundColor = HIGHLIGHT_MAP[hVal];
    }
  }

  const shdEl = firstChildByLocal(rPrEl, 'shd');
  if (shdEl && !out.backgroundColor) {
    const shdColor = resolveColorFromEl(shdEl, theme, 'fill');
    if (shdColor) out.backgroundColor = shdColor;
  }

  const bEl = firstChildByLocal(rPrEl, 'b') || firstChildByLocal(rPrEl, 'bCs');
  const bVal = parseBoolToggle(bEl);
  if (bVal !== undefined) out.bold = bVal;

  const iEl = firstChildByLocal(rPrEl, 'i') || firstChildByLocal(rPrEl, 'iCs');
  const iVal = parseBoolToggle(iEl);
  if (iVal !== undefined) out.italic = iVal;

  const uEl = firstChildByLocal(rPrEl, 'u');
  if (uEl) {
    const uVal = (getAttr(uEl, 'val') || 'single').toLowerCase();
    out.underline = uVal !== 'none';
  }

  const strikeEl = firstChildByLocal(rPrEl, 'strike') || firstChildByLocal(rPrEl, 'dstrike');
  const strikeVal = parseBoolToggle(strikeEl);
  if (strikeVal !== undefined) out.strike = strikeVal;

  const vertAlign = firstChildByLocal(rPrEl, 'vertAlign');
  if (vertAlign) {
    const vVal = (getAttr(vertAlign, 'val') || '').toLowerCase();
    if (vVal === 'superscript') out.vertAlign = 'superscript';
    else if (vVal === 'subscript') out.vertAlign = 'subscript';
  }

  const capsEl = firstChildByLocal(rPrEl, 'caps');
  const capsVal = parseBoolToggle(capsEl);
  if (capsVal !== undefined) out.caps = capsVal;

  const smallCapsEl = firstChildByLocal(rPrEl, 'smallCaps');
  const smallCapsVal = parseBoolToggle(smallCapsEl);
  if (smallCapsVal !== undefined) out.smallCaps = smallCapsVal;

  return out;
}

function mergeRunStyles(...layers: Array<ResolvedRunStyle | undefined>): ResolvedRunStyle {
  const result: ResolvedRunStyle = {};
  for (const layer of layers) {
    if (!layer) continue;
    if (layer.fontFamily !== undefined) result.fontFamily = layer.fontFamily;
    if (layer.fontSizePt !== undefined) result.fontSizePt = layer.fontSizePt;
    if (layer.color !== undefined) result.color = layer.color;
    if (layer.backgroundColor !== undefined) result.backgroundColor = layer.backgroundColor;
    if (layer.bold !== undefined) result.bold = layer.bold;
    if (layer.italic !== undefined) result.italic = layer.italic;
    if (layer.underline !== undefined) result.underline = layer.underline;
    if (layer.strike !== undefined) result.strike = layer.strike;
    if (layer.vertAlign !== undefined) result.vertAlign = layer.vertAlign;
    if (layer.caps !== undefined) result.caps = layer.caps;
    if (layer.smallCaps !== undefined) result.smallCaps = layer.smallCaps;
  }
  return result;
}

function parseSingleBorder(borderEl: Element | null, theme: ThemeContext): BorderDef | undefined {
  if (!borderEl) return undefined;
  const val = (getAttr(borderEl, 'val') || 'single').toLowerCase();
  if (val === 'none' || val === 'nil') {
    return { style: 'none', widthPx: 0, color: 'transparent' };
  }

  const sz = Number(getAttr(borderEl, 'sz'));
  // OOXML sz is in 1/8 pt; 1pt = 1.333px
  const pt = Number.isFinite(sz) && sz > 0 ? sz / 8 : 0.75;
  const widthPx = Math.max(0.75, Math.min(8, Math.round(pt * 1.333 * 10) / 10));

  let style: BorderDef['style'] = 'solid';
  if (val.includes('dash')) style = 'dashed';
  else if (val.includes('dot')) style = 'dotted';
  else if (val.includes('double')) style = 'double';

  const rawColor = getAttr(borderEl, 'color');
  let color = resolveColorFromEl(borderEl, theme) || '#000000';
  if (rawColor && rawColor.toLowerCase() === 'auto') {
    color = '#000000';
  }

  return { style, widthPx, color };
}

function extractBordersFromContainer(
  bordersEl: Element | null,
  theme: ThemeContext
): ResolvedBorders | undefined {
  if (!bordersEl) return undefined;
  const out: ResolvedBorders = {};
  const top = parseSingleBorder(firstChildByLocal(bordersEl, 'top'), theme);
  const bottom = parseSingleBorder(firstChildByLocal(bordersEl, 'bottom'), theme);
  const left = parseSingleBorder(
    firstChildByLocal(bordersEl, 'left') || firstChildByLocal(bordersEl, 'start'),
    theme
  );
  const right = parseSingleBorder(
    firstChildByLocal(bordersEl, 'right') || firstChildByLocal(bordersEl, 'end'),
    theme
  );
  const insideH = parseSingleBorder(firstChildByLocal(bordersEl, 'insideH'), theme);
  const insideV = parseSingleBorder(firstChildByLocal(bordersEl, 'insideV'), theme);

  if (top) out.top = top;
  if (bottom) out.bottom = bottom;
  if (left) out.left = left;
  if (right) out.right = right;
  if (insideH) out.insideH = insideH;
  if (insideV) out.insideV = insideV;

  return Object.keys(out).length > 0 ? out : undefined;
}

function mergeBorders(...layers: Array<ResolvedBorders | undefined>): ResolvedBorders | undefined {
  const out: ResolvedBorders = {};
  for (const layer of layers) {
    if (!layer) continue;
    if (layer.top) out.top = layer.top;
    if (layer.bottom) out.bottom = layer.bottom;
    if (layer.left) out.left = layer.left;
    if (layer.right) out.right = layer.right;
    if (layer.insideH) out.insideH = layer.insideH;
    if (layer.insideV) out.insideV = layer.insideV;
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

function extractParaStyleFromPPr(pPrEl: Element | null, theme: ThemeContext): ResolvedParaStyle {
  const out: ResolvedParaStyle = {};
  if (!pPrEl) return out;

  const jc = firstChildByLocal(pPrEl, 'jc');
  if (jc) {
    const val = (getAttr(jc, 'val') || '').toLowerCase();
    if (val === 'center') out.align = 'center';
    else if (val === 'right' || val === 'end') out.align = 'right';
    else if (val === 'both' || val === 'distribute') out.align = 'justify';
    else if (val === 'left' || val === 'start') out.align = 'left';
  }

  const spacing = firstChildByLocal(pPrEl, 'spacing');
  if (spacing) {
    const before = Number(getAttr(spacing, 'before'));
    if (Number.isFinite(before) && before >= 0) {
      out.spaceBeforePt = Math.round((before / 20) * 10) / 10;
    }
    const after = Number(getAttr(spacing, 'after'));
    if (Number.isFinite(after) && after >= 0) {
      out.spaceAfterPt = Math.round((after / 20) * 10) / 10;
    }
    const line = Number(getAttr(spacing, 'line'));
    const lineRule = (getAttr(spacing, 'lineRule') || 'auto').toLowerCase();
    if (Number.isFinite(line) && line > 0) {
      if (lineRule === 'auto') {
        const mult = Math.round((line / 240) * 100) / 100;
        out.lineHeight = mult;
        out.lineHeightNumeric = mult;
      } else {
        out.lineHeight = `${Math.round((line / 20) * 10) / 10}pt`;
      }
    }
  }

  const ind = firstChildByLocal(pPrEl, 'ind');
  if (ind) {
    const left = Number(getAttr(ind, 'left') ?? getAttr(ind, 'start'));
    if (Number.isFinite(left)) out.leftIndentPt = Math.round((left / 20) * 10) / 10;

    const right = Number(getAttr(ind, 'right') ?? getAttr(ind, 'end'));
    if (Number.isFinite(right)) out.rightIndentPt = Math.round((right / 20) * 10) / 10;

    const firstLine = Number(getAttr(ind, 'firstLine'));
    if (Number.isFinite(firstLine)) out.firstLinePt = Math.round((firstLine / 20) * 10) / 10;

    const hanging = Number(getAttr(ind, 'hanging'));
    if (Number.isFinite(hanging)) out.hangingPt = Math.round((hanging / 20) * 10) / 10;
  }

  const shd = firstChildByLocal(pPrEl, 'shd');
  if (shd) {
    const fill = resolveColorFromEl(shd, theme, 'fill');
    if (fill) out.backgroundColor = fill;
  }

  const pBdr = firstChildByLocal(pPrEl, 'pBdr');
  if (pBdr) {
    out.borders = extractBordersFromContainer(pBdr, theme);
  }

  const outlineLvl = firstChildByLocal(pPrEl, 'outlineLvl');
  if (outlineLvl) {
    const lvl = Number(getAttr(outlineLvl, 'val'));
    if (Number.isFinite(lvl)) out.outlineLvl = lvl;
  }

  const pageBreakBefore = firstChildByLocal(pPrEl, 'pageBreakBefore');
  if (pageBreakBefore && parseBoolToggle(pageBreakBefore) !== false) {
    out.pageBreakBefore = true;
  }

  const numPr = firstChildByLocal(pPrEl, 'numPr');
  if (numPr) {
    const numIdEl = firstChildByLocal(numPr, 'numId');
    const ilvlEl = firstChildByLocal(numPr, 'ilvl');
    const numIdVal = getAttr(numIdEl, 'val');
    if (numIdVal && numIdVal !== '0') {
      out.numId = numIdVal;
      const ilvlVal = Number(getAttr(ilvlEl, 'val') ?? '0');
      out.ilvl = Number.isFinite(ilvlVal) ? ilvlVal : 0;
    }
  }

  return out;
}

function mergeParaStyles(...layers: Array<ResolvedParaStyle | undefined>): ResolvedParaStyle {
  const out: ResolvedParaStyle = {};
  for (const layer of layers) {
    if (!layer) continue;
    if (layer.align !== undefined) out.align = layer.align;
    if (layer.spaceBeforePt !== undefined) out.spaceBeforePt = layer.spaceBeforePt;
    if (layer.spaceAfterPt !== undefined) out.spaceAfterPt = layer.spaceAfterPt;
    if (layer.lineHeight !== undefined) out.lineHeight = layer.lineHeight;
    if (layer.lineHeightNumeric !== undefined) out.lineHeightNumeric = layer.lineHeightNumeric;
    if (layer.leftIndentPt !== undefined) out.leftIndentPt = layer.leftIndentPt;
    if (layer.rightIndentPt !== undefined) out.rightIndentPt = layer.rightIndentPt;
    if (layer.firstLinePt !== undefined) out.firstLinePt = layer.firstLinePt;
    if (layer.hangingPt !== undefined) out.hangingPt = layer.hangingPt;
    if (layer.backgroundColor !== undefined) out.backgroundColor = layer.backgroundColor;
    if (layer.borders !== undefined) out.borders = mergeBorders(out.borders, layer.borders);
    if (layer.outlineLvl !== undefined) out.outlineLvl = layer.outlineLvl;
    if (layer.pageBreakBefore !== undefined) out.pageBreakBefore = layer.pageBreakBefore;
    if (layer.numId !== undefined) out.numId = layer.numId;
    if (layer.ilvl !== undefined) out.ilvl = layer.ilvl;
  }
  return out;
}

function parseStylesXml(xmlText: string | null) {
  const styles = new Map<string, StyleDefinition>();
  let docDefaultsPPr: Element | null = null;
  let docDefaultsRPr: Element | null = null;
  let defaultParaStyleId: string | undefined;
  let defaultCharStyleId: string | undefined;
  let defaultTableStyleId: string | undefined;

  if (!xmlText) {
    return {
      styles,
      docDefaultsPPr,
      docDefaultsRPr,
      defaultParaStyleId,
      defaultCharStyleId,
      defaultTableStyleId,
    };
  }

  const doc = parseXml(xmlText);
  if (!doc) {
    return {
      styles,
      docDefaultsPPr,
      docDefaultsRPr,
      defaultParaStyleId,
      defaultCharStyleId,
      defaultTableStyleId,
    };
  }

  const docDefaults = firstChildByLocal(doc.documentElement, 'docDefaults');
  if (docDefaults) {
    const rPrDefault = firstChildByLocal(docDefaults, 'rPrDefault');
    docDefaultsRPr = firstChildByLocal(rPrDefault, 'rPr');
    const pPrDefault = firstChildByLocal(docDefaults, 'pPrDefault');
    docDefaultsPPr = firstChildByLocal(pPrDefault, 'pPr');
  }

  childrenByLocal(doc.documentElement, 'style').forEach((stEl) => {
    const styleId = getAttr(stEl, 'styleId');
    if (!styleId) return;
    const type = (getAttr(stEl, 'type') || 'paragraph').toLowerCase();
    const isDefault = getAttr(stEl, 'default') === '1' || getAttr(stEl, 'default') === 'true';
    const nameEl = firstChildByLocal(stEl, 'name');
    const name = getAttr(nameEl, 'val') || styleId;
    const basedOnEl = firstChildByLocal(stEl, 'basedOn');
    const basedOn = getAttr(basedOnEl, 'val') || undefined;

    let firstRowPPrEl: Element | null = null;
    let firstRowRPrEl: Element | null = null;
    let firstRowTcPrEl: Element | null = null;

    childrenByLocal(stEl, 'tblStylePr').forEach((tsp) => {
      if ((getAttr(tsp, 'type') || '').toLowerCase() === 'firstRow'.toLowerCase()) {
        firstRowPPrEl = firstChildByLocal(tsp, 'pPr');
        firstRowRPrEl = firstChildByLocal(tsp, 'rPr');
        firstRowTcPrEl = firstChildByLocal(tsp, 'tcPr');
      }
    });

    styles.set(styleId, {
      styleId,
      type,
      name,
      basedOn,
      isDefault,
      pPrEl: firstChildByLocal(stEl, 'pPr'),
      rPrEl: firstChildByLocal(stEl, 'rPr'),
      tblPrEl: firstChildByLocal(stEl, 'tblPr'),
      tcPrEl: firstChildByLocal(stEl, 'tcPr'),
      firstRowPPrEl,
      firstRowRPrEl,
      firstRowTcPrEl,
    });

    if (isDefault) {
      if (type === 'paragraph') defaultParaStyleId = styleId;
      else if (type === 'character') defaultCharStyleId = styleId;
      else if (type === 'table') defaultTableStyleId = styleId;
    }
  });

  if (!defaultParaStyleId && styles.has('Normal')) {
    defaultParaStyleId = 'Normal';
  }

  return {
    styles,
    docDefaultsPPr,
    docDefaultsRPr,
    defaultParaStyleId,
    defaultCharStyleId,
    defaultTableStyleId,
  };
}

function getStyleChain(
  styleId: string | undefined,
  styles: Map<string, StyleDefinition>
): StyleDefinition[] {
  const chain: StyleDefinition[] = [];
  const visited = new Set<string>();
  let curId = styleId;
  while (curId && !visited.has(curId)) {
    visited.add(curId);
    const def = styles.get(curId);
    if (!def) break;
    chain.unshift(def);
    curId = def.basedOn;
  }
  return chain;
}

function mapNumFmtToCss(numFmt: string): { isOrdered: boolean; cssListType: string } {
  switch (numFmt) {
    case 'bullet':
      return { isOrdered: false, cssListType: 'disc' };
    case 'lowerLetter':
      return { isOrdered: true, cssListType: 'lower-alpha' };
    case 'upperLetter':
      return { isOrdered: true, cssListType: 'upper-alpha' };
    case 'lowerRoman':
      return { isOrdered: true, cssListType: 'lower-roman' };
    case 'upperRoman':
      return { isOrdered: true, cssListType: 'upper-roman' };
    case 'none':
      return { isOrdered: false, cssListType: 'none' };
    default:
      return { isOrdered: true, cssListType: 'decimal' };
  }
}

function parseNumberingXml(xmlText: string | null): Map<string, Map<number, NumberingLevelInfo>> {
  const result = new Map<string, Map<number, NumberingLevelInfo>>();
  if (!xmlText) return result;
  const doc = parseXml(xmlText);
  if (!doc) return result;

  const abstractMap = new Map<string, Map<number, NumberingLevelInfo>>();
  childrenByLocal(doc.documentElement, 'abstractNum').forEach((absEl) => {
    const absId = getAttr(absEl, 'abstractNumId');
    if (!absId) return;
    const lvls = new Map<number, NumberingLevelInfo>();
    childrenByLocal(absEl, 'lvl').forEach((lvlEl) => {
      const ilvl = Number(getAttr(lvlEl, 'ilvl') ?? '0');
      const numFmt = getAttr(firstChildByLocal(lvlEl, 'numFmt'), 'val') || 'decimal';
      const lvlText = getAttr(firstChildByLocal(lvlEl, 'lvlText'), 'val') || '';
      const mapped = mapNumFmtToCss(numFmt);
      lvls.set(ilvl, {
        numFmt,
        lvlText,
        isOrdered: mapped.isOrdered,
        cssListType: mapped.cssListType,
      });
    });
    abstractMap.set(absId, lvls);
  });

  childrenByLocal(doc.documentElement, 'num').forEach((numEl) => {
    const numId = getAttr(numEl, 'numId');
    const absId = getAttr(firstChildByLocal(numEl, 'abstractNumId'), 'val');
    if (!numId || !absId) return;
    const baseLvls = abstractMap.get(absId);
    if (baseLvls) {
      result.set(numId, new Map(baseLvls));
    }
  });

  return result;
}

function parseRelationships(xmlText: string | null): Map<string, { target: string; type: string }> {
  const map = new Map<string, { target: string; type: string }>();
  if (!xmlText) return map;
  const doc = parseXml(xmlText);
  if (!doc) return map;

  childrenByLocal(doc.documentElement, 'Relationship').forEach((rel) => {
    const id = getAttr(rel, 'Id');
    const target = getAttr(rel, 'Target');
    const type = getAttr(rel, 'Type') || '';
    if (id && target) {
      map.set(id, { target, type });
    }
  });
  return map;
}

function guessImageMime(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase() ?? '';
  switch (ext) {
    case 'png':
      return 'image/png';
    case 'gif':
      return 'image/gif';
    case 'webp':
      return 'image/webp';
    case 'svg':
      return 'image/svg+xml';
    case 'bmp':
      return 'image/bmp';
    default:
      return 'image/jpeg';
  }
}

function formatCssFontFamily(font: string): string {
  const trimmed = font.trim();
  if (!trimmed) return trimmed;
  if (trimmed.includes(',') || trimmed.startsWith('"') || trimmed.startsWith("'")) {
    return trimmed;
  }
  return `"${trimmed.replace(/"/g, '')}", sans-serif`;
}

function formatBorderCss(b: BorderDef | undefined): string | null {
  if (!b) return null;
  if (b.style === 'none' || b.widthPx <= 0) return 'none';
  return `${b.widthPx}px ${b.style} ${b.color}`;
}

function styleObjectToCss(entries: Array<[string, string | number | undefined]>): string {
  return entries
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => `${k}: ${v}`)
    .join('; ');
}

function extractHeaderFooterText(xmlText: string | null): string {
  if (!xmlText) return '';
  const doc = parseXml(xmlText);
  if (!doc) return '';

  const parts: string[] = [];
  const paragraphs = findDescendantsByLocal(doc.documentElement, 'p');
  paragraphs.forEach((pEl) => {
    let line = '';
    const walk = (node: Element) => {
      const tag = localName(node);
      if (tag === 'fldSimple') {
        const instr = (getAttr(node, 'instr') || '').toUpperCase();
        if (instr.includes('NUMPAGES')) {
          line += '{NUMPAGES}';
          return;
        }
        if (instr.includes('PAGE')) {
          line += '{PAGE}';
          return;
        }
      }
      if (tag === 'instrText') {
        const instr = (node.textContent || '').toUpperCase();
        if (instr.includes('NUMPAGES')) line += '{NUMPAGES}';
        else if (instr.includes('PAGE')) line += '{PAGE}';
        return;
      }
      if (tag === 't') {
        line += node.textContent || '';
        return;
      }
      if (tag === 'tab') {
        line += '  ';
        return;
      }
      childElements(node).forEach(walk);
    };
    walk(pEl);
    const trimmed = line.replace(/\s+/g, ' ').trim();
    if (trimmed) parts.push(trimmed);
  });

  // Clean up duplicate placeholders if complex field also emitted cached number after instrText
  return parts
    .join(' · ')
    .replace(/(\{PAGE\})\s*\d+/g, '$1')
    .replace(/(\{NUMPAGES\})\s*\d+/g, '$1')
    .trim();
}

function detectClosestMarginPreset(margins: CustomMarginsInches): MarginPreset {
  let bestPreset: MarginPreset = 'normal';
  let bestDiff = Infinity;
  (Object.keys(MARGIN_INCHES) as MarginPreset[]).forEach((preset) => {
    const m = MARGIN_INCHES[preset];
    const diff =
      Math.abs(m.top - margins.top) +
      Math.abs(m.right - margins.right) +
      Math.abs(m.bottom - margins.bottom) +
      Math.abs(m.left - margins.left);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestPreset = preset;
    }
  });
  return bestPreset;
}

function detectPageSize(wInches: number, hInches: number): PageSize {
  const shortSide = Math.min(wInches, hInches);
  const longSide = Math.max(wInches, hInches);
  if (Math.abs(longSide - 14) < 0.4) return 'Legal';
  if (Math.abs(shortSide - 8.27) < 0.18 && Math.abs(longSide - 11.69) < 0.25) return 'A4';
  return 'Letter';
}

function detectHeadingTag(
  styleId: string | undefined,
  styleName: string | undefined,
  outlineLvl: number | undefined
): string {
  const combined = `${styleId || ''} ${styleName || ''}`.toLowerCase();
  if (/^title$|\btitle\b/.test(combined) && !combined.includes('subtitle')) {
    return 'h4_title';
  }
  if (combined.includes('subtitle')) {
    return 'p_subtitle';
  }
  const headingMatch = combined.match(/heading\s*([1-6])/i);
  if (headingMatch) {
    return `h${headingMatch[1]}`;
  }
  if (outlineLvl !== undefined && outlineLvl >= 0 && outlineLvl <= 5) {
    return `h${outlineLvl + 1}`;
  }
  return 'p';
}

export async function importDocxWithStyles(
  arrayBuffer: ArrayBuffer,
  _fallbackBaseName: string
): Promise<DocxImportOutput> {
  const warnings: string[] = [];
  const zip = await JSZip.loadAsync(arrayBuffer);

  const docXmlText = await zip.file('word/document.xml')?.async('string');
  if (!docXmlText) {
    throw new Error('Missing word/document.xml in DOCX archive');
  }
  const docXml = parseXml(docXmlText);
  if (!docXml) {
    throw new Error('Invalid XML in word/document.xml');
  }

  const themeXml = (await zip.file('word/theme/theme1.xml')?.async('string')) ?? null;
  const stylesXml = (await zip.file('word/styles.xml')?.async('string')) ?? null;
  const numberingXml = (await zip.file('word/numbering.xml')?.async('string')) ?? null;
  const relsXml = (await zip.file('word/_rels/document.xml.rels')?.async('string')) ?? null;

  const theme = parseTheme(themeXml);
  const parsedStyles = parseStylesXml(stylesXml);
  const numberingMap = parseNumberingXml(numberingXml);
  const rels = parseRelationships(relsXml);

  // Preload media data URIs referenced by rels
  const mediaDataUris = new Map<string, string>();
  for (const [rId, rel] of rels.entries()) {
    if (rel.type.includes('/image') || rel.target.startsWith('media/')) {
      const normalizedPath = rel.target.startsWith('/')
        ? rel.target.slice(1)
        : rel.target.startsWith('word/')
          ? rel.target
          : `word/${rel.target.replace(/^\.\//, '')}`;
      const mediaFile = zip.file(normalizedPath);
      if (mediaFile) {
        const b64 = await mediaFile.async('base64');
        const mime = guessImageMime(normalizedPath);
        mediaDataUris.set(rId, `data:${mime};base64,${b64}`);
      }
    }
  }

  // Base document defaults + Normal style
  const defaultPStyleChain = getStyleChain(parsedStyles.defaultParaStyleId, parsedStyles.styles);
  const baseRunStyle = mergeRunStyles(
    extractRunStyleFromRPr(parsedStyles.docDefaultsRPr, theme),
    ...defaultPStyleChain.map((s) => extractRunStyleFromRPr(s.rPrEl, theme))
  );
  const baseParaStyle = mergeParaStyles(
    extractParaStyleFromPPr(parsedStyles.docDefaultsPPr, theme),
    ...defaultPStyleChain.map((s) => extractParaStyleFromPPr(s.pPrEl, theme))
  );

  const importedBaseStyle: ImportedBaseStyle = {
    fontFamily: baseRunStyle.fontFamily
      ? formatCssFontFamily(baseRunStyle.fontFamily)
      : theme.minorFont
        ? formatCssFontFamily(theme.minorFont)
        : undefined,
    fontSizePt: baseRunStyle.fontSizePt ?? 11,
    color: baseRunStyle.color ?? '#000000',
    lineHeight: baseParaStyle.lineHeightNumeric ?? 1.15,
  };

  // Helper to resolve paragraph + run styles for a given styleId
  const resolveParaAndRunFromStyleId = (styleId: string | undefined) => {
    const chain = getStyleChain(
      styleId || parsedStyles.defaultParaStyleId,
      parsedStyles.styles
    );
    const pStyle = mergeParaStyles(
      extractParaStyleFromPPr(parsedStyles.docDefaultsPPr, theme),
      ...chain.map((s) => extractParaStyleFromPPr(s.pPrEl, theme))
    );
    const rStyle = mergeRunStyles(
      extractRunStyleFromRPr(parsedStyles.docDefaultsRPr, theme),
      ...chain.map((s) => extractRunStyleFromRPr(s.rPrEl, theme))
    );
    const styleDef = styleId ? parsedStyles.styles.get(styleId) : undefined;
    return { pStyle, rStyle, styleName: styleDef?.name };
  };

  const resolveCharRunStyle = (charStyleId: string | undefined): ResolvedRunStyle => {
    if (!charStyleId) return {};
    const chain = getStyleChain(charStyleId, parsedStyles.styles);
    return mergeRunStyles(...chain.map((s) => extractRunStyleFromRPr(s.rPrEl, theme)));
  };

  // Page settings from w:sectPr & w:background
  const body = firstChildByLocal(docXml.documentElement, 'body');
  const sectPr =
    firstChildByLocal(body, 'sectPr') || findFirstDescendant(docXml.documentElement, 'sectPr');

  const settingsPatch: Partial<DocumentSettings> = {
    ...DEFAULT_DOCUMENT_SETTINGS,
    preserveImportedStyles: true,
    importedBaseStyle,
    lineSpacing: baseParaStyle.lineHeightNumeric ?? 1.15,
  };

  const bgEl = firstChildByLocal(docXml.documentElement, 'background');
  if (bgEl) {
    const bgHex = resolveColorFromEl(bgEl, theme, 'color');
    if (bgHex) settingsPatch.pageColor = bgHex;
  }

  let headerText = '';
  let footerText = '';

  if (sectPr) {
    const pgSz = firstChildByLocal(sectPr, 'pgSz');
    if (pgSz) {
      const wTwips = Number(getAttr(pgSz, 'w'));
      const hTwips = Number(getAttr(pgSz, 'h'));
      const orientAttr = (getAttr(pgSz, 'orient') || '').toLowerCase();
      if (Number.isFinite(wTwips) && Number.isFinite(hTwips) && wTwips > 0 && hTwips > 0) {
        const wIn = wTwips / 1440;
        const hIn = hTwips / 1440;
        const orientation: Orientation =
          orientAttr === 'landscape' || wIn > hIn ? 'landscape' : 'portrait';
        settingsPatch.orientation = orientation;
        settingsPatch.pageSize = detectPageSize(wIn, hIn);
      }
    }

    const pgMar = firstChildByLocal(sectPr, 'pgMar');
    if (pgMar) {
      const top = Math.max(0.25, Math.round((Number(getAttr(pgMar, 'top') || 1440) / 1440) * 100) / 100);
      const right = Math.max(0.25, Math.round((Number(getAttr(pgMar, 'right') || 1440) / 1440) * 100) / 100);
      const bottom = Math.max(0.25, Math.round((Number(getAttr(pgMar, 'bottom') || 1440) / 1440) * 100) / 100);
      const left = Math.max(0.25, Math.round((Number(getAttr(pgMar, 'left') || 1440) / 1440) * 100) / 100);
      const customMargins: CustomMarginsInches = { top, right, bottom, left };
      settingsPatch.customMargins = customMargins;
      settingsPatch.margins = detectClosestMarginPreset(customMargins);
    }

    const headerRefs = childrenByLocal(sectPr, 'headerReference');
    const chosenHeaderRef =
      headerRefs.find((r) => (getAttr(r, 'type') || 'default') === 'default') || headerRefs[0];
    if (chosenHeaderRef) {
      const rId = getAttr(chosenHeaderRef, 'id');
      const rel = rId ? rels.get(rId) : undefined;
      if (rel) {
        const path = rel.target.startsWith('word/') ? rel.target : `word/${rel.target.replace(/^\.\//, '')}`;
        const hXml = (await zip.file(path)?.async('string')) ?? null;
        headerText = extractHeaderFooterText(hXml);
      }
    }

    const footerRefs = childrenByLocal(sectPr, 'footerReference');
    const chosenFooterRef =
      footerRefs.find((r) => (getAttr(r, 'type') || 'default') === 'default') || footerRefs[0];
    if (chosenFooterRef) {
      const rId = getAttr(chosenFooterRef, 'id');
      const rel = rId ? rels.get(rId) : undefined;
      if (rel) {
        const path = rel.target.startsWith('word/') ? rel.target : `word/${rel.target.replace(/^\.\//, '')}`;
        const fXml = (await zip.file(path)?.async('string')) ?? null;
        footerText = extractHeaderFooterText(fXml);
      }
    }

    if (headerText || footerText) {
      settingsPatch.showHeaderFooter = true;
    }
  }

  // Run -> HTML converter
  const convertRunElement = (
    rEl: Element,
    inheritedRunStyle: ResolvedRunStyle,
    forceDefaultsOnRun = false
  ): string => {
    const rPrEl = firstChildByLocal(rEl, 'rPr');
    const rStyleId = getAttr(firstChildByLocal(rPrEl, 'rStyle'), 'val') || undefined;
    const charStyle = resolveCharRunStyle(rStyleId);
    const directStyle = extractRunStyleFromRPr(rPrEl, theme);
    const merged = mergeRunStyles(inheritedRunStyle, charStyle, directStyle);

    // Build inner content from children of w:r
    let innerHtml = '';
    let hasImageOrBreak = false;

    childElements(rEl).forEach((ch) => {
      const tag = localName(ch);
      if (tag === 'rpr') return;

      if (tag === 't') {
        innerHtml += escapeHtmlText(ch.textContent || '');
      } else if (tag === 'tab') {
        innerHtml += '&nbsp;&nbsp;&nbsp;&nbsp;';
      } else if (tag === 'br') {
        const brType = (getAttr(ch, 'type') || '').toLowerCase();
        if (brType === 'page') {
          hasImageOrBreak = true;
          innerHtml += '<div class="word-page-break" contenteditable="false"></div>';
        } else {
          hasImageOrBreak = true;
          innerHtml += '<br />';
        }
      } else if (tag === 'sym') {
        const charCode = getAttr(ch, 'char');
        if (charCode) {
          const code = parseInt(charCode, 16);
          if (Number.isFinite(code)) {
            if (code === 0x00a8 || code === 0xf0a8 || code === 0x006f || code === 0xf06f) {
              innerHtml += '☐';
            } else if (code === 0x00fe || code === 0xf0fe || code === 0x00fc || code === 0xf0fc) {
              innerHtml += '☑';
            } else {
              innerHtml += escapeHtmlText(String.fromCharCode(code & 0xffff));
            }
          }
        }
      } else if (tag === 'drawing' || tag === 'pict') {
        const blip = findFirstDescendant(ch, 'blip');
        const imagedata = findFirstDescendant(ch, 'imagedata');
        const embedId = getAttr(blip, 'embed') || getAttr(imagedata, 'id');
        if (embedId && mediaDataUris.has(embedId)) {
          hasImageOrBreak = true;
          const src = mediaDataUris.get(embedId)!;
          const extent = findFirstDescendant(ch, 'extent');
          const cx = Number(getAttr(extent, 'cx'));
          const cy = Number(getAttr(extent, 'cy'));
          const widthStyle =
            Number.isFinite(cx) && cx > 0
              ? `width: ${Math.min(680, Math.max(16, Math.round(cx / 9525)))}px; `
              : 'max-width: 100%; ';
          const heightStyle =
            Number.isFinite(cy) && cy > 0 && Number.isFinite(cx) && cx > 0
              ? `height: ${Math.max(12, Math.round(cy / 9525))}px; `
              : 'height: auto; ';
          innerHtml += `<img src="${src}" alt="Document image" style="${widthStyle}${heightStyle}max-width: 100%;" />`;
        }
      }
    });

    if (!innerHtml) return '';
    if (hasImageOrBreak && !innerHtml.replace(/<[^>]+>/g, '').trim()) {
      return innerHtml;
    }

    // Wrap semantic formatting tags
    let wrapped = innerHtml;
    if (merged.bold) wrapped = `<strong>${wrapped}</strong>`;
    if (merged.italic) wrapped = `<em>${wrapped}</em>`;
    if (merged.underline) wrapped = `<u>${wrapped}</u>`;
    if (merged.strike) wrapped = `<s>${wrapped}</s>`;
    if (merged.vertAlign === 'superscript') wrapped = `<sup>${wrapped}</sup>`;
    if (merged.vertAlign === 'subscript') wrapped = `<sub>${wrapped}</sub>`;

    const cssEntries: Array<[string, string | number | undefined]> = [];
    const compareBase = forceDefaultsOnRun ? {} : baseRunStyle;

    if (merged.fontFamily && merged.fontFamily !== compareBase.fontFamily) {
      cssEntries.push(['font-family', formatCssFontFamily(merged.fontFamily)]);
    }
    if (merged.fontSizePt && merged.fontSizePt !== compareBase.fontSizePt) {
      cssEntries.push(['font-size', `${merged.fontSizePt}pt`]);
    }
    if (merged.color && merged.color !== compareBase.color) {
      cssEntries.push(['color', merged.color]);
    }
    if (merged.backgroundColor && merged.backgroundColor !== 'transparent') {
      cssEntries.push(['background-color', merged.backgroundColor]);
    }
    if (merged.caps) {
      cssEntries.push(['text-transform', 'uppercase']);
    } else if (merged.smallCaps) {
      cssEntries.push(['font-variant', 'small-caps']);
    }

    const css = styleObjectToCss(cssEntries);
    return css ? `<span style="${escapeAttr(css)}">${wrapped}</span>` : wrapped;
  };

  // Paragraph / SDT inline content converter
  const convertInlineNodes = (
    container: Element,
    inheritedRunStyle: ResolvedRunStyle,
    forceDefaultsOnRun = false
  ): string => {
    let html = '';
    childElements(container).forEach((ch) => {
      const tag = localName(ch);
      if (tag === 'ppr' || tag === 'bookmarkstart' || tag === 'bookmarkend') return;

      if (tag === 'r') {
        html += convertRunElement(ch, inheritedRunStyle, forceDefaultsOnRun);
      } else if (tag === 'hyperlink') {
        const rId = getAttr(ch, 'id');
        const anchor = getAttr(ch, 'anchor');
        const rel = rId ? rels.get(rId) : undefined;
        const href = rel?.target || (anchor ? `#${anchor}` : '#');
        const linkText = convertInlineNodes(ch, inheritedRunStyle, forceDefaultsOnRun);
        if (linkText) {
          html += `<a href="${escapeAttr(href)}" target="_blank" rel="noopener noreferrer">${linkText}</a>`;
        }
      } else if (tag === 'sdt') {
        // Check if SDT is a Word checkbox content control
        const sdtPr = firstChildByLocal(ch, 'sdtpr');
        const checkboxEl =
          findFirstDescendant(sdtPr, 'checkbox') || findFirstDescendant(sdtPr, 'checkBox');
        if (checkboxEl) {
          const checkedEl =
            firstChildByLocal(checkboxEl, 'checked') ||
            findFirstDescendant(checkboxEl, 'checked');
          const checkedVal = getAttr(checkedEl, 'val');
          const isChecked = checkedVal === '1' || checkedVal === 'true';
          html += `<span class="word-tickbox-wrap" contenteditable="false"><input type="checkbox" class="word-tickbox"${isChecked ? ' checked="checked"' : ''} aria-label="Tick box" /></span>`;
        } else {
          const sdtContent = firstChildByLocal(ch, 'sdtcontent');
          if (sdtContent) {
            html += convertInlineNodes(sdtContent, inheritedRunStyle, forceDefaultsOnRun);
          }
        }
      } else if (tag === 'smarttag' || tag === 'ins') {
        html += convertInlineNodes(ch, inheritedRunStyle, forceDefaultsOnRun);
      }
    });
    return html;
  };

  // Convert a single w:p element
  const convertParagraphElement = (
    pEl: Element,
    extraParaStyle?: ResolvedParaStyle,
    extraRunStyle?: ResolvedRunStyle,
    asListItem = false
  ): {
    html: string;
    numId?: string;
    ilvl?: number;
    pageBreakBefore?: boolean;
  } => {
    const pPrEl = firstChildByLocal(pEl, 'pPr');
    const pStyleId = getAttr(firstChildByLocal(pPrEl, 'pStyle'), 'val') || undefined;
    const { pStyle: styleP, rStyle: styleR, styleName } = resolveParaAndRunFromStyleId(pStyleId);
    const directP = extractParaStyleFromPPr(pPrEl, theme);
    const directPPrRPr = extractRunStyleFromRPr(firstChildByLocal(pPrEl, 'rPr'), theme);

    const resolvedP = mergeParaStyles(extraParaStyle, styleP, directP);
    const resolvedR = mergeRunStyles(extraRunStyle, styleR, directPPrRPr);

    const tagKey = asListItem
      ? 'li'
      : detectHeadingTag(pStyleId, styleName, resolvedP.outlineLvl);
    const isHeading = tagKey !== 'p' && tagKey !== 'li';

    let innerHtml = convertInlineNodes(pEl, resolvedR, isHeading);
    if (!innerHtml) innerHtml = '<br />';

    const pCssEntries: Array<[string, string | number | undefined]> = [];
    if (resolvedP.align) pCssEntries.push(['text-align', resolvedP.align]);
    if (resolvedP.spaceBeforePt !== undefined) {
      pCssEntries.push(['margin-top', `${resolvedP.spaceBeforePt}pt`]);
    } else if (isHeading) {
      pCssEntries.push(['margin-top', '0pt']);
    }
    if (resolvedP.spaceAfterPt !== undefined) {
      pCssEntries.push(['margin-bottom', `${resolvedP.spaceAfterPt}pt`]);
    } else if (!asListItem) {
      pCssEntries.push(['margin-bottom', '0pt']);
    }
    if (resolvedP.lineHeight !== undefined) {
      pCssEntries.push(['line-height', resolvedP.lineHeight]);
    }

    if (resolvedP.leftIndentPt && !asListItem) {
      pCssEntries.push(['margin-left', `${resolvedP.leftIndentPt}pt`]);
    }
    if (resolvedP.rightIndentPt) {
      pCssEntries.push(['margin-right', `${resolvedP.rightIndentPt}pt`]);
    }
    if (resolvedP.firstLinePt) {
      pCssEntries.push(['text-indent', `${resolvedP.firstLinePt}pt`]);
    } else if (resolvedP.hangingPt && !asListItem) {
      pCssEntries.push(['text-indent', `-${resolvedP.hangingPt}pt`]);
    }

    if (resolvedP.backgroundColor && resolvedP.backgroundColor !== 'transparent') {
      pCssEntries.push(['background-color', resolvedP.backgroundColor]);
      pCssEntries.push(['padding', '2pt 6pt']);
    }

    if (resolvedP.borders) {
      const bt = formatBorderCss(resolvedP.borders.top);
      const bb = formatBorderCss(resolvedP.borders.bottom);
      const bl = formatBorderCss(resolvedP.borders.left);
      const br = formatBorderCss(resolvedP.borders.right);
      if (bt) pCssEntries.push(['border-top', bt]);
      if (bb) pCssEntries.push(['border-bottom', bb]);
      if (bl) pCssEntries.push(['border-left', bl]);
      if (br) pCssEntries.push(['border-right', br]);
    }

    // Explicitly apply heading typography on heading tags so they inherit the document's styling
    if (isHeading) {
      if (resolvedR.fontFamily) {
        pCssEntries.push(['font-family', formatCssFontFamily(resolvedR.fontFamily)]);
      }
      if (resolvedR.fontSizePt) {
        pCssEntries.push(['font-size', `${resolvedR.fontSizePt}pt`]);
      }
      pCssEntries.push(['font-weight', resolvedR.bold ? '700' : '400']);
      if (resolvedR.italic) pCssEntries.push(['font-style', 'italic']);
      if (resolvedR.color) pCssEntries.push(['color', resolvedR.color]);
    }

    const styleStr = styleObjectToCss(pCssEntries);
    const styleAttr = styleStr ? ` style="${escapeAttr(styleStr)}"` : '';

    let openTag = `<p${styleAttr}>`;
    let closeTag = '</p>';
    if (tagKey === 'h4_title') {
      openTag = `<h4 class="word-title"${styleAttr}>`;
      closeTag = '</h4>';
    } else if (tagKey === 'p_subtitle') {
      openTag = `<p class="word-subtitle"${styleAttr}>`;
      closeTag = '</p>';
    } else if (tagKey !== 'p') {
      openTag = `<${tagKey}${styleAttr}>`;
      closeTag = `</${tagKey}>`;
    }

    return {
      html: `${openTag}${innerHtml}${closeTag}`,
      numId: resolvedP.numId,
      ilvl: resolvedP.ilvl ?? 0,
      pageBreakBefore: resolvedP.pageBreakBefore,
    };
  };

  // Convert w:tbl element
  const convertTableElement = (tblEl: Element): string => {
    const tblPrEl = firstChildByLocal(tblEl, 'tblPr');
    const tblStyleId =
      getAttr(firstChildByLocal(tblPrEl, 'tblStyle'), 'val') || parsedStyles.defaultTableStyleId;
    const tblStyleChain = getStyleChain(tblStyleId, parsedStyles.styles);

    const parsedTblBorders = mergeBorders(
      ...tblStyleChain.map((s) =>
        extractBordersFromContainer(firstChildByLocal(s.tblPrEl, 'tblBorders'), theme)
      ),
      extractBordersFromContainer(firstChildByLocal(tblPrEl, 'tblBorders'), theme)
    );
    const tblBorders =
      parsedTblBorders ||
      (tblStyleId?.toLowerCase() === 'tablegrid'
        ? {
            top: { style: 'solid', widthPx: 1, color: '#000000' },
            bottom: { style: 'solid', widthPx: 1, color: '#000000' },
            left: { style: 'solid', widthPx: 1, color: '#000000' },
            right: { style: 'solid', widthPx: 1, color: '#000000' },
            insideH: { style: 'solid', widthPx: 1, color: '#000000' },
            insideV: { style: 'solid', widthPx: 1, color: '#000000' },
          }
        : undefined);

    const tblLookEl = firstChildByLocal(tblPrEl, 'tblLook');
    const applyFirstRowStyle =
      tblLookEl !== null
        ? getAttr(tblLookEl, 'firstRow') !== '0'
        : true;

    const firstRowStyleTc = applyFirstRowStyle
      ? tblStyleChain.find((s) => s.firstRowTcPrEl)?.firstRowTcPrEl ?? null
      : null;
    const firstRowStyleR = applyFirstRowStyle
      ? tblStyleChain.find((s) => s.firstRowRPrEl)?.firstRowRPrEl ?? null
      : null;
    const firstRowStyleP = applyFirstRowStyle
      ? tblStyleChain.find((s) => s.firstRowPPrEl)?.firstRowPPrEl ?? null
      : null;

    // Table width & layout
    const tblWEl = firstChildByLocal(tblPrEl, 'tblW');
    const tblWVal = Number(getAttr(tblWEl, 'w'));
    const tblWType = (getAttr(tblWEl, 'type') || '').toLowerCase();
    const tblLayoutEl = firstChildByLocal(tblPrEl, 'tblLayout');
    const tblLayoutType = (getAttr(tblLayoutEl, 'type') || '').toLowerCase();

    const isAutoFitContents =
      tblLayoutType === 'autofit' || (tblWType === 'auto' && tblLayoutType !== 'fixed');

    let tableWidthCss = '100%';
    if (tblWType === 'pct' && Number.isFinite(tblWVal) && tblWVal > 0) {
      tableWidthCss = `${Math.min(100, Math.round(tblWVal / 50))}%`;
    } else if (tblWType === 'dxa' && Number.isFinite(tblWVal) && tblWVal > 0) {
      tableWidthCss = `${Math.round((tblWVal / 20) * 10) / 10}pt`;
    } else if (isAutoFitContents) {
      tableWidthCss = 'auto';
    }

    // Grid column widths
    const tblGridEl = firstChildByLocal(tblEl, 'tblGrid');
    const gridColWidthsPt = childrenByLocal(tblGridEl, 'gridCol').map((col) => {
      const wTwips = Number(getAttr(col, 'w'));
      return Number.isFinite(wTwips) && wTwips > 0 ? Math.round((wTwips / 20) * 10) / 10 : 0;
    });

    // Determine summary border attributes for Table Design controls
    const sampleBorder =
      tblBorders?.top ||
      tblBorders?.bottom ||
      tblBorders?.left ||
      tblBorders?.right ||
      tblBorders?.insideH ||
      tblBorders?.insideV;
    const bordersEnabled = sampleBorder ? sampleBorder.style !== 'none' : false;
    const borderColor = sampleBorder && sampleBorder.style !== 'none' ? sampleBorder.color : '#8A8886';
    const borderWidthPx =
      sampleBorder && sampleBorder.style !== 'none' ? sampleBorder.widthPx : 1;

    const tblCss = styleObjectToCss([
      ['border-collapse', 'collapse'],
      ['width', tableWidthCss],
      ['max-width', '100%'],
      ['table-layout', isAutoFitContents ? 'auto' : 'fixed'],
      ['margin', '8pt 0 12pt 0'],
    ]);

    const colgroupHtml =
      !isAutoFitContents && gridColWidthsPt.some((w) => w > 0)
        ? `<colgroup>${gridColWidthsPt
            .map((w) => (w > 0 ? `<col style="width: ${w}pt" />` : '<col />'))
            .join('')}</colgroup>`
        : '';

    // Parse rows & resolve vertical merges (vMerge)
    const trElements = childrenByLocal(tblEl, 'tr');
    interface ParsedCell {
      htmlTag: 'td' | 'th';
      colSpan: number;
      rowSpan: number;
      skip: boolean;
      styleAttr: string;
      innerHtml: string;
    }

    const rowGrid: ParsedCell[][] = [];
    const activeVMergeAtCol = new Map<number, ParsedCell>();

    trElements.forEach((trEl, rowIndex) => {
      const trPrEl = firstChildByLocal(trEl, 'trPr');
      const isHeaderRow = Boolean(firstChildByLocal(trPrEl, 'tblHeader'));
      const cells: ParsedCell[] = [];
      let logicalCol = 0;

      childrenByLocal(trEl, 'tc').forEach((tcEl) => {
        const tcPrEl = firstChildByLocal(tcEl, 'tcPr');
        const gridSpanVal = Number(getAttr(firstChildByLocal(tcPrEl, 'gridSpan'), 'val'));
        const colSpan = Number.isFinite(gridSpanVal) && gridSpanVal > 1 ? gridSpanVal : 1;

        const vMergeEl = firstChildByLocal(tcPrEl, 'vMerge');
        const vMergeVal = vMergeEl ? (getAttr(vMergeEl, 'val') || 'continue').toLowerCase() : null;

        if (vMergeEl && vMergeVal !== 'restart') {
          const anchor = activeVMergeAtCol.get(logicalCol);
          if (anchor) {
            anchor.rowSpan += 1;
            logicalCol += colSpan;
            return;
          }
        }

        // Borders for cell
        const tcBorders = extractBordersFromContainer(
          firstChildByLocal(tcPrEl, 'tcBorders'),
          theme
        );
        const isTopRow = rowIndex === 0;
        const isBottomRow = rowIndex === trElements.length - 1;
        const isFirstCol = logicalCol === 0;
        const bTop = tcBorders?.top || (isTopRow ? tblBorders?.top : tblBorders?.insideH);
        const bBottom = tcBorders?.bottom || (isBottomRow ? tblBorders?.bottom : tblBorders?.insideH);
        const bLeft = tcBorders?.left || (isFirstCol ? tblBorders?.left : tblBorders?.insideV);
        const bRight = tcBorders?.right || tblBorders?.right || tblBorders?.insideV;

        // Shading
        const styleShdEl =
          rowIndex === 0 && firstRowStyleTc ? firstChildByLocal(firstRowStyleTc, 'shd') : null;
        const directShdEl = firstChildByLocal(tcPrEl, 'shd');
        const cellBg =
          resolveColorFromEl(directShdEl, theme, 'fill') ||
          resolveColorFromEl(styleShdEl, theme, 'fill') ||
          'transparent';

        // Vertical align
        const vAlignEl = firstChildByLocal(tcPrEl, 'vAlign');
        const vAlignVal = (getAttr(vAlignEl, 'val') || 'top').toLowerCase();
        const vAlignCss =
          vAlignVal === 'center' ? 'middle' : vAlignVal === 'bottom' ? 'bottom' : 'top';

        // Cell width
        const tcWEl = firstChildByLocal(tcPrEl, 'tcW');
        const tcWVal = Number(getAttr(tcWEl, 'w'));
        const tcWType = (getAttr(tcWEl, 'type') || '').toLowerCase();
        let cellWidthCss: string | undefined;
        if (!isAutoFitContents) {
          if (tcWType === 'pct' && Number.isFinite(tcWVal) && tcWVal > 0) {
            cellWidthCss = `${Math.round(tcWVal / 50)}%`;
          } else if (tcWType === 'dxa' && Number.isFinite(tcWVal) && tcWVal > 0) {
            cellWidthCss = `${Math.round((tcWVal / 20) * 10) / 10}pt`;
          }
        }

        const cellCss = styleObjectToCss([
          ['border-top', formatBorderCss(bTop) || 'none'],
          ['border-bottom', formatBorderCss(bBottom) || 'none'],
          ['border-left', formatBorderCss(bLeft) || 'none'],
          ['border-right', formatBorderCss(bRight) || 'none'],
          ['background-color', cellBg],
          ['vertical-align', vAlignCss],
          ['padding', '4pt 6pt'],
          ['width', cellWidthCss],
        ]);

        const extraP =
          rowIndex === 0 && firstRowStyleP
            ? extractParaStyleFromPPr(firstRowStyleP, theme)
            : undefined;
        const extraR =
          rowIndex === 0 && firstRowStyleR
            ? extractRunStyleFromRPr(firstRowStyleR, theme)
            : undefined;

        const cellBlocks: string[] = [];
        childElements(tcEl).forEach((cellChild) => {
          const cTag = localName(cellChild);
          if (cTag === 'p') {
            cellBlocks.push(convertParagraphElement(cellChild, extraP, extraR, false).html);
          } else if (cTag === 'tbl') {
            cellBlocks.push(convertTableElement(cellChild));
          }
        });

        const parsedCell: ParsedCell = {
          htmlTag: isHeaderRow ? 'th' : 'td',
          colSpan,
          rowSpan: 1,
          skip: false,
          styleAttr: cellCss ? ` style="${escapeAttr(cellCss)}"` : '',
          innerHtml: cellBlocks.join('') || '<p><br /></p>',
        };

        if (vMergeVal === 'restart') {
          activeVMergeAtCol.set(logicalCol, parsedCell);
        } else {
          activeVMergeAtCol.delete(logicalCol);
        }

        cells.push(parsedCell);
        logicalCol += colSpan;
      });

      rowGrid.push(cells);
    });

    const rowsHtml = rowGrid
      .map(
        (cells) =>
          `<tr>${cells
            .filter((c) => !c.skip)
            .map((c) => {
              const colAttr = c.colSpan > 1 ? ` colspan="${c.colSpan}"` : '';
              const rowAttr = c.rowSpan > 1 ? ` rowspan="${c.rowSpan}"` : '';
              return `<${c.htmlTag}${colAttr}${rowAttr}${c.styleAttr}>${c.innerHtml}</${c.htmlTag}>`;
            })
            .join('')}</tr>`
      )
      .join('');

    const autofitAttr = isAutoFitContents ? ' data-autofit="contents"' : '';
    const borderAttrs = ` data-border-enabled="${bordersEnabled ? 'true' : 'false'}" data-border-color="${escapeAttr(borderColor)}" data-border-width="${borderWidthPx}"`;

    return `<table${autofitAttr}${borderAttrs} style="${escapeAttr(tblCss)}">${colgroupHtml}<tbody>${rowsHtml}</tbody></table>`;
  };

  // Assemble document body with list grouping
  const bodyOut: string[] = [];
  let openList: {
    tag: 'ul' | 'ol';
    numId: string;
    ilvl: number;
    cssListType: string;
    items: string[];
  } | null = null;

  const flushOpenList = () => {
    if (!openList) return;
    const indentPx = Math.max(24, (openList.ilvl + 1) * 24);
    bodyOut.push(
      `<${openList.tag} style="list-style-type: ${openList.cssListType}; margin: 4pt 0 8pt ${indentPx}px; padding-left: 16px;">${openList.items.join('')}</${openList.tag}>`
    );
    openList = null;
  };

  const processBlockElement = (el: Element) => {
    const tag = localName(el);
    if (tag === 'p') {
      // Peek numPr before converting
      const pPrEl = firstChildByLocal(el, 'pPr');
      const pStyleId = getAttr(firstChildByLocal(pPrEl, 'pStyle'), 'val') || undefined;
      const { pStyle: styleP } = resolveParaAndRunFromStyleId(pStyleId);
      const directP = extractParaStyleFromPPr(pPrEl, theme);
      const mergedP = mergeParaStyles(styleP, directP);

      if (mergedP.numId) {
        const lvl = mergedP.ilvl ?? 0;
        const lvlInfo = numberingMap.get(mergedP.numId)?.get(lvl);
        const listTag: 'ul' | 'ol' = lvlInfo?.isOrdered ? 'ol' : 'ul';
        const cssListType = lvlInfo?.cssListType || 'disc';

        const converted = convertParagraphElement(el, undefined, undefined, true);
        if (converted.pageBreakBefore) {
          flushOpenList();
          bodyOut.push('<div class="word-page-break" contenteditable="false"></div>');
        }

        if (
          openList &&
          openList.numId === mergedP.numId &&
          openList.ilvl === lvl &&
          openList.tag === listTag
        ) {
          openList.items.push(converted.html);
        } else {
          flushOpenList();
          openList = {
            tag: listTag,
            numId: mergedP.numId,
            ilvl: lvl,
            cssListType,
            items: [converted.html],
          };
        }
        return;
      }

      flushOpenList();
      const converted = convertParagraphElement(el, undefined, undefined, false);
      if (converted.pageBreakBefore) {
        bodyOut.push('<div class="word-page-break" contenteditable="false"></div>');
      }
      bodyOut.push(converted.html);
    } else if (tag === 'tbl') {
      flushOpenList();
      bodyOut.push(convertTableElement(el));
    } else if (tag === 'sdt') {
      const sdtContent = firstChildByLocal(el, 'sdtContent');
      if (sdtContent) {
        childElements(sdtContent).forEach(processBlockElement);
      }
    }
  };

  if (body) {
    childElements(body).forEach(processBlockElement);
  }
  flushOpenList();

  return {
    contentHtml: bodyOut.join('') || '<p><br /></p>',
    headerText,
    footerText,
    settings: settingsPatch,
    warnings,
  };
}

export function scopeImportedHtmlStyles(rawCss: string): string {
  // Rewrite body/:root/html selectors to .word-editor-content.word-imported-doc
  // and prefix simple selectors so imported HTML CSS never leaks into app UI
  let css = rawCss.replace(/\/\*[\s\S]*?\*\//g, '');
  css = css.replace(/@import[^;]+;/gi, '');

  return css.replace(/([^{}@]+)\{([^{}]*)\}/g, (_match, selectorGroup: string, body: string) => {
    const scopedSelectors = selectorGroup
      .split(',')
      .map((sel) => sel.trim())
      .filter(Boolean)
      .map((sel) => {
        if (/^(html|body|:root)$/i.test(sel)) {
          return '.word-editor-content.word-imported-doc';
        }
        if (sel.toLowerCase().startsWith('body ')) {
          return `.word-editor-content.word-imported-doc ${sel.slice(5).trim()}`;
        }
        if (sel.includes('.word-editor-content')) {
          return sel;
        }
        return `.word-editor-content.word-imported-doc ${sel}`;
      })
      .join(', ');
    return `${scopedSelectors} { ${body} }`;
  });
}
