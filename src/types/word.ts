export type RibbonTab =
  | 'Home'
  | 'Insert'
  | 'Draw'
  | 'Design'
  | 'Layout'
  | 'References'
  | 'Mailings'
  | 'Review'
  | 'View'
  | 'Table Design';

export type PageSize = 'Letter' | 'A4' | 'Legal';
export type Orientation = 'portrait' | 'landscape';
export type MarginPreset = 'normal' | 'narrow' | 'moderate' | 'wide';
export type ViewMode = 'print' | 'web' | 'read';
export type PageBorderStyle = 'none' | 'box' | 'shadow' | 'double';
export type ThemePreset = 'office' | 'facet' | 'integral' | 'editorial';

export interface ImportedBaseStyle {
  fontFamily?: string;
  fontSizePt?: number;
  color?: string;
  lineHeight?: number;
}

export interface CustomMarginsInches {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface DocumentSettings {
  margins: MarginPreset;
  customMargins?: CustomMarginsInches;
  pageSize: PageSize;
  orientation: Orientation;
  pageColor: string;
  pageBorder: PageBorderStyle;
  watermark: string;
  theme: ThemePreset;
  columns: 1 | 2 | 3;
  lineSpacing: number;
  showRuler: boolean;
  showMarginGuides: boolean;
  showNavigationPane: boolean;
  showHeaderFooter: boolean;
  preserveImportedStyles?: boolean;
  importedBaseStyle?: ImportedBaseStyle;
  importedCss?: string;
}

export interface DocumentComment {
  id: string;
  author: string;
  text: string;
  quote: string;
  createdAt: string;
  resolved: boolean;
}

export interface DocumentRecord {
  id: string;
  title: string;
  contentHtml: string;
  headerText: string;
  footerText: string;
  updatedAt: string;
  settings: DocumentSettings;
  comments: DocumentComment[];
  isImported?: boolean;
}

export interface DocumentStats {
  words: number;
  charactersWithSpaces: number;
  charactersNoSpaces: number;
  paragraphs: number;
  lines: number;
  pages: number;
}

export interface HeadingOutlineItem {
  id: string;
  text: string;
  level: 1 | 2 | 3;
}

export const DEFAULT_DOCUMENT_SETTINGS: DocumentSettings = {
  margins: 'normal',
  pageSize: 'Letter',
  orientation: 'portrait',
  pageColor: '#FFFFFF',
  pageBorder: 'none',
  watermark: '',
  theme: 'office',
  columns: 1,
  lineSpacing: 1.15,
  showRuler: true,
  showMarginGuides: true,
  showNavigationPane: false,
  showHeaderFooter: false,
};

export const MARGIN_INCHES: Record<
  MarginPreset,
  { top: number; right: number; bottom: number; left: number; label: string; desc: string }
> = {
  normal: { top: 1, right: 1, bottom: 1, left: 1, label: 'Normal', desc: 'Top: 1"  Bottom: 1"  Left: 1"  Right: 1"' },
  narrow: { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5, label: 'Narrow', desc: 'All sides: 0.5"' },
  moderate: { top: 1, right: 0.75, bottom: 1, left: 0.75, label: 'Moderate', desc: 'Top/Bottom: 1"  Left/Right: 0.75"' },
  wide: { top: 1, right: 1.5, bottom: 1, left: 1.5, label: 'Wide', desc: 'Top/Bottom: 1"  Left/Right: 1.5"' },
};

export const PAGE_DIMENSIONS_INCHES: Record<PageSize, { width: number; height: number; label: string }> = {
  Letter: { width: 8.5, height: 11, label: 'Letter (8.5" × 11")' },
  A4: { width: 8.27, height: 11.69, label: 'A4 (8.27" × 11.69")' },
  Legal: { width: 8.5, height: 14, label: 'Legal (8.5" × 14")' },
};

export const THEME_PALETTES: Record<
  ThemePreset,
  { name: string; primary: string; secondary: string; fontHeading: string; fontBody: string }
> = {
  office: {
    name: 'Office Classic',
    primary: '#0F6CBD',
    secondary: '#185ABD',
    fontHeading: "'Calibri', 'Plus Jakarta Sans', sans-serif",
    fontBody: "'Calibri', 'Plus Jakarta Sans', sans-serif",
  },
  facet: {
    name: 'Facet Emerald',
    primary: '#107C41',
    secondary: '#217346',
    fontHeading: "'DM Sans', 'Segoe UI', sans-serif",
    fontBody: "'Plus Jakarta Sans', 'Segoe UI', sans-serif",
  },
  integral: {
    name: 'Integral Slate',
    primary: '#2B3A55',
    secondary: '#475569',
    fontHeading: "'Plus Jakarta Sans', sans-serif",
    fontBody: "'DM Sans', sans-serif",
  },
  editorial: {
    name: 'Crisp Editorial',
    primary: '#7A1C1C',
    secondary: '#374151',
    fontHeading: "'Source Serif 4', Georgia, serif",
    fontBody: "'Lora', Georgia, serif",
  },
};
