import React, { useRef, useState } from 'react';
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  BookOpen,
  Bookmark,
  CheckSquare,
  ChevronDown,
  Clipboard,
  Columns3,
  Copy,
  Eraser,
  FilePlus,
  FileText,
  Globe,
  Hash,
  Highlighter,
  Image as ImageIcon,
  IndentDecrease,
  IndentIncrease,
  Italic,
  LayoutGrid,
  Link2,
  List,
  ListOrdered,
  ListTree,
  Maximize2,
  MessageSquarePlus,
  MessageSquareText,
  Minus,
  PaintBucket,
  Paintbrush,
  Palette,
  PenTool,
  Pilcrow,
  Printer,
  Replace,
  RotateCcw,
  Ruler,
  Scissors,
  Search,
  Sigma,
  Sparkles,
  SpellCheck,
  Stamp,
  Strikethrough,
  Subscript,
  Superscript,
  Table as TableIcon,
  Type,
  Underline,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  DocumentSettings,
  MARGIN_INCHES,
  MarginPreset,
  Orientation,
  PAGE_DIMENSIONS_INCHES,
  PageBorderStyle,
  PageSize,
  RibbonTab,
  THEME_PALETTES,
  ThemePreset,
  ViewMode,
} from '../types/word';

export interface ActiveFormattingState {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikeThrough: boolean;
  subscript: boolean;
  superscript: boolean;
  align: 'left' | 'center' | 'right' | 'justify';
  orderedList: boolean;
  unorderedList: boolean;
  fontName: string;
  fontSizePt: string;
  blockTag: string;
}

interface RibbonProps {
  activeTab: RibbonTab;
  onSelectTab: (tab: RibbonTab) => void;
  onOpenFileBackstage: () => void;
  collapsed: boolean;
  formatting: ActiveFormattingState;
  settings: DocumentSettings;
  viewMode: ViewMode;
  zoom: number;
  commentsCount: number;
  commentsOpen: boolean;
  onToggleCommentsPane: () => void;
  isReadingAloud: boolean;
  formatPainterActive: boolean;
  onToggleFormatPainter: () => void;
  onExecCommand: (cmd: string, value?: string) => void;
  onApplyFontFamily: (font: string) => void;
  onApplyFontSize: (pt: string) => void;
  onStepFontSize: (delta: number) => void;
  onChangeCase: (mode: 'upper' | 'lower' | 'title') => void;
  onClearFormatting: () => void;
  onApplyStyle: (style: 'p' | 'h1' | 'h2' | 'h3' | 'title' | 'subtitle' | 'blockquote') => void;
  onPaste: () => void;
  onCut: () => void;
  onCopy: () => void;
  onSelectAll: () => void;
  onOpenFindReplace: (tab: 'find' | 'replace' | 'outline') => void;
  onInsertPageBreak: () => void;
  onInsertBlankPage: () => void;
  onInsertTable: (rows: number, cols: number) => void;
  onInsertImageFile: (file: File) => void;
  onInsertHorizontalRule: () => void;
  onInsertCallout: () => void;
  onOpenLinkDialog: () => void;
  onToggleHeaderFooter: () => void;
  onInsertPageNumber: (format: 'pageOfTotal' | 'pageOnly' | 'numberOnly' | 'remove') => void;
  onInsertDateTime: () => void;
  onInsertSymbol: (sym: string) => void;
  onOpenDrawPad: () => void;
  onUpdateSettings: (patch: Partial<DocumentSettings>) => void;
  onOpenWatermarkDialog: () => void;
  onInsertToc: () => void;
  onInsertFootnote: () => void;
  onOpenCitationDialog: () => void;
  onOpenMailMergeDialog: () => void;
  onInsertMergeField: (field: string) => void;
  onRunProofing: () => void;
  onOpenWordCount: () => void;
  onToggleReadAloud: () => void;
  onAddComment: () => void;
  onViewModeChange: (mode: ViewMode) => void;
  onZoomChange: (zoom: number) => void;
  onFitPageWidth: () => void;
}

const TABS: RibbonTab[] = [
  'Home',
  'Insert',
  'Draw',
  'Design',
  'Layout',
  'References',
  'Mailings',
  'Review',
  'View',
];

const FONT_FAMILIES = [
  { label: 'Calibri (Body)', value: 'Calibri, "Plus Jakarta Sans", sans-serif' },
  { label: 'Plus Jakarta Sans', value: '"Plus Jakarta Sans", sans-serif' },
  { label: 'Segoe UI', value: '"Segoe UI", sans-serif' },
  { label: 'Arial', value: 'Arial, sans-serif' },
  { label: 'DM Sans', value: '"DM Sans", sans-serif' },
  { label: 'Times New Roman', value: '"Times New Roman", "Source Serif 4", serif' },
  { label: 'Source Serif 4', value: '"Source Serif 4", Georgia, serif' },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Lora', value: 'Lora, Georgia, serif' },
  { label: 'Courier New', value: '"Courier New", "JetBrains Mono", monospace' },
  { label: 'JetBrains Mono', value: '"JetBrains Mono", monospace' },
];

const FONT_SIZES = ['8', '9', '10', '11', '12', '14', '16', '18', '20', '24', '28', '36', '48', '72'];

const TEXT_COLORS = [
  '#1B1A19',
  '#C00000',
  '#FF0000',
  '#ED7D31',
  '#FFC000',
  '#70AD47',
  '#0F6CBD',
  '#185ABD',
  '#7030A0',
  '#605E5C',
];

const HIGHLIGHT_COLORS = [
  { label: 'Yellow', color: '#FFF59D' },
  { label: 'Bright Green', color: '#BBF7D0' },
  { label: 'Turquoise', color: '#A5F3FC' },
  { label: 'Pink', color: '#FBCFE8' },
  { label: 'Red', color: '#FECACA' },
  { label: 'None', color: 'transparent' },
];

const SYMBOLS = ['©', '®', '™', '€', '£', '¥', '§', '°', '±', '×', '÷', '≠', '≤', '≥', '→', '✓', '★', '•'];

const RibbonGroup: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="flex flex-col justify-between px-2.5 py-1 border-r border-[#E1DFDD] last:border-r-0 shrink-0 h-[84px]">
    <div className="flex items-center gap-1 flex-1">{children}</div>
    <div className="text-[10px] text-[#605E5C] text-center leading-none pt-0.5 whitespace-nowrap">
      {label}
    </div>
  </div>
);

const IconBtn: React.FC<{
  active?: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}> = ({ active, onClick, title, children, className = '' }) => (
  <button
    type="button"
    onMouseDown={(e) => e.preventDefault()}
    onClick={onClick}
    title={title}
    className={`h-6 min-w-[24px] px-1 rounded flex items-center justify-center text-xs transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
      active
        ? 'bg-[#CFE4FA] text-[#0F6CBD] border border-[#96C5F7]'
        : 'text-[#242424] hover:bg-[#E1DFDD]/80 active:bg-[#D2D0CE]'
    } ${className}`}
  >
    {children}
  </button>
);

const LargeBtn: React.FC<{
  active?: boolean;
  onClick: () => void;
  title: string;
  icon: React.ReactNode;
  label: string;
}> = ({ active, onClick, title, icon, label }) => (
  <button
    type="button"
    onMouseDown={(e) => e.preventDefault()}
    onClick={onClick}
    title={title}
    className={`h-[60px] px-2.5 rounded flex flex-col items-center justify-center gap-1 text-[11px] transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
      active
        ? 'bg-[#CFE4FA] text-[#0F6CBD] border border-[#96C5F7]'
        : 'text-[#242424] hover:bg-[#E1DFDD]/80 active:bg-[#D2D0CE]'
    }`}
  >
    {icon}
    <span className="leading-tight">{label}</span>
  </button>
);

export const Ribbon: React.FC<RibbonProps> = ({
  activeTab,
  onSelectTab,
  onOpenFileBackstage,
  collapsed,
  formatting,
  settings,
  viewMode,
  zoom,
  commentsCount,
  commentsOpen,
  onToggleCommentsPane,
  isReadingAloud,
  formatPainterActive,
  onToggleFormatPainter,
  onExecCommand,
  onApplyFontFamily,
  onApplyFontSize,
  onStepFontSize,
  onChangeCase,
  onClearFormatting,
  onApplyStyle,
  onPaste,
  onCut,
  onCopy,
  onSelectAll,
  onOpenFindReplace,
  onInsertPageBreak,
  onInsertBlankPage,
  onInsertTable,
  onInsertImageFile,
  onInsertHorizontalRule,
  onInsertCallout,
  onOpenLinkDialog,
  onToggleHeaderFooter,
  onInsertPageNumber,
  onInsertDateTime,
  onInsertSymbol,
  onOpenDrawPad,
  onUpdateSettings,
  onOpenWatermarkDialog,
  onInsertToc,
  onInsertFootnote,
  onOpenCitationDialog,
  onOpenMailMergeDialog,
  onInsertMergeField,
  onRunProofing,
  onOpenWordCount,
  onToggleReadAloud,
  onAddComment,
  onViewModeChange,
  onZoomChange,
  onFitPageWidth,
}) => {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [tableHover, setTableHover] = useState<{ r: number; c: number }>({ r: 3, c: 4 });
  const [activeFontColor, setActiveFontColor] = useState('#C00000');
  const [activeHighlight, setActiveHighlight] = useState('#FFF59D');
  const imageInputRef = useRef<HTMLInputElement>(null);

  const toggleMenu = (name: string) => {
    setOpenMenu((prev) => (prev === name ? null : name));
  };

  return (
    <div className="no-print bg-[#F3F2F1] border-b border-[#D2D0CE] select-none shrink-0 relative z-30">
      {/* Hidden image file picker */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            onInsertImageFile(file);
            e.target.value = '';
          }
        }}
      />

      {/* Menu Tabs Bar */}
      <div className="h-8 px-2 flex items-center justify-between border-b border-[#E1DFDD] bg-[#F3F2F1]">
        <div className="flex items-center gap-0.5 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={onOpenFileBackstage}
            className="h-7 px-3.5 rounded-t text-xs font-semibold bg-[#185ABD] text-white hover:bg-[#104A9E] transition-colors cursor-pointer whitespace-nowrap shrink-0 mr-1"
          >
            File
          </button>

          {TABS.map((tab) => {
            const isActive = activeTab === tab && !collapsed;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => {
                  onSelectTab(tab);
                  setOpenMenu(null);
                }}
                className={`relative h-8 px-2.5 text-xs transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'font-semibold text-[#185ABD] bg-white rounded-t border-x border-t border-[#E1DFDD]'
                    : 'text-[#242424] hover:bg-[#E1DFDD]/70 rounded'
                }`}
              >
                {tab}
                {isActive && (
                  <span className="absolute left-2 right-2 bottom-0 h-[2px] bg-[#185ABD] rounded-full" />
                )}
              </button>
            );
          })}
        </div>

        {/* Right: Comments toggle button (just like screenshot) */}
        <div className="flex items-center gap-1.5 pl-2 shrink-0">
          <button
            type="button"
            onClick={onToggleCommentsPane}
            className={`h-6 px-2.5 rounded border text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              commentsOpen
                ? 'bg-[#CFE4FA] border-[#96C5F7] text-[#0F6CBD]'
                : 'bg-white border-[#D2D0CE] text-[#242424] hover:bg-[#EDEBE9]'
            }`}
          >
            <MessageSquareText className="w-3.5 h-3.5 text-[#185ABD]" />
            <span>Comments</span>
            {commentsCount > 0 && (
              <span className="text-[11px] font-semibold text-[#185ABD] tabular-nums">
                ({commentsCount})
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Ribbon Content Area */}
      {!collapsed && (
        <div className="bg-white/95 border-b border-[#E1DFDD] px-2 py-1 overflow-x-auto overflow-y-visible">
          <div className="flex items-stretch min-w-max">
            {activeTab === 'Home' && (
              <>
                {/* Clipboard Group */}
                <RibbonGroup label="Clipboard">
                  <LargeBtn
                    onClick={onPaste}
                    title="Paste from clipboard (Ctrl+V)"
                    icon={<Clipboard className="w-5 h-5 text-[#C27803]" />}
                    label="Paste"
                  />
                  <div className="flex flex-col gap-0.5">
                    <IconBtn onClick={onCut} title="Cut (Ctrl+X)" className="justify-start px-1.5 gap-1">
                      <Scissors className="w-3.5 h-3.5 text-[#484644]" />
                      <span className="text-[11px] hidden xl:inline">Cut</span>
                    </IconBtn>
                    <IconBtn onClick={onCopy} title="Copy (Ctrl+C)" className="justify-start px-1.5 gap-1">
                      <Copy className="w-3.5 h-3.5 text-[#185ABD]" />
                      <span className="text-[11px] hidden xl:inline">Copy</span>
                    </IconBtn>
                    <IconBtn
                      active={formatPainterActive}
                      onClick={onToggleFormatPainter}
                      title="Format Painter — copy formatting to next selection"
                      className="justify-start px-1.5 gap-1"
                    >
                      <Paintbrush className="w-3.5 h-3.5 text-[#C27803]" />
                      <span className="text-[11px] hidden xl:inline">Painter</span>
                    </IconBtn>
                  </div>
                </RibbonGroup>

                {/* Font Group */}
                <RibbonGroup label="Font">
                  <div className="flex flex-col gap-1.5">
                    {/* Top Row: Font Family, Size, Step, Case, Clear */}
                    <div className="flex items-center gap-1">
                      <select
                        value={formatting.fontName}
                        onChange={(e) => onApplyFontFamily(e.target.value)}
                        title="Font Family"
                        aria-label="Font Family"
                        className="h-6 px-1.5 text-xs bg-white border border-[#C8C6C4] rounded hover:border-[#8A8886] outline-none w-36 cursor-pointer"
                      >
                        {FONT_FAMILIES.map((f) => (
                          <option key={f.label} value={f.value}>
                            {f.label}
                          </option>
                        ))}
                      </select>

                      <select
                        value={formatting.fontSizePt}
                        onChange={(e) => onApplyFontSize(e.target.value)}
                        title="Font Size (pt)"
                        aria-label="Font Size"
                        className="h-6 px-1 text-xs bg-white border border-[#C8C6C4] rounded hover:border-[#8A8886] outline-none w-12 tabular-nums cursor-pointer"
                      >
                        {FONT_SIZES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>

                      <IconBtn onClick={() => onStepFontSize(1)} title="Increase Font Size">
                        <span className="font-semibold text-[11px]">A^</span>
                      </IconBtn>
                      <IconBtn onClick={() => onStepFontSize(-1)} title="Decrease Font Size">
                        <span className="font-semibold text-[10px]">Av</span>
                      </IconBtn>

                      <div className="relative">
                        <IconBtn onClick={() => toggleMenu('case')} title="Change Case">
                          <span className="text-[11px] font-medium">Aa</span>
                          <ChevronDown className="w-2.5 h-2.5 ml-0.5" />
                        </IconBtn>
                        {openMenu === 'case' && (
                          <div className="absolute left-0 top-7 bg-white border border-[#D2D0CE] rounded shadow-lg py-1 z-50 w-36">
                            <button
                              type="button"
                              onClick={() => {
                                onChangeCase('upper');
                                setOpenMenu(null);
                              }}
                              className="w-full px-3 py-1.5 text-left text-xs hover:bg-[#F3F2F1] cursor-pointer"
                            >
                              UPPERCASE
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                onChangeCase('lower');
                                setOpenMenu(null);
                              }}
                              className="w-full px-3 py-1.5 text-left text-xs hover:bg-[#F3F2F1] cursor-pointer"
                            >
                              lowercase
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                onChangeCase('title');
                                setOpenMenu(null);
                              }}
                              className="w-full px-3 py-1.5 text-left text-xs hover:bg-[#F3F2F1] cursor-pointer"
                            >
                              Capitalize Each Word
                            </button>
                          </div>
                        )}
                      </div>

                      <IconBtn onClick={onClearFormatting} title="Clear All Formatting">
                        <Eraser className="w-3.5 h-3.5 text-[#A4262C]" />
                      </IconBtn>
                    </div>

                    {/* Bottom Row: B, I, U, S, x2, x^2, Highlight, Font Color */}
                    <div className="flex items-center gap-0.5">
                      <IconBtn
                        active={formatting.bold}
                        onClick={() => onExecCommand('bold')}
                        title="Bold (Ctrl+B)"
                      >
                        <Bold className="w-3.5 h-3.5" />
                      </IconBtn>
                      <IconBtn
                        active={formatting.italic}
                        onClick={() => onExecCommand('italic')}
                        title="Italic (Ctrl+I)"
                      >
                        <Italic className="w-3.5 h-3.5" />
                      </IconBtn>
                      <IconBtn
                        active={formatting.underline}
                        onClick={() => onExecCommand('underline')}
                        title="Underline (Ctrl+U)"
                      >
                        <Underline className="w-3.5 h-3.5" />
                      </IconBtn>
                      <IconBtn
                        active={formatting.strikeThrough}
                        onClick={() => onExecCommand('strikeThrough')}
                        title="Strikethrough"
                      >
                        <Strikethrough className="w-3.5 h-3.5" />
                      </IconBtn>
                      <IconBtn
                        active={formatting.subscript}
                        onClick={() => onExecCommand('subscript')}
                        title="Subscript"
                      >
                        <Subscript className="w-3.5 h-3.5" />
                      </IconBtn>
                      <IconBtn
                        active={formatting.superscript}
                        onClick={() => onExecCommand('superscript')}
                        title="Superscript"
                      >
                        <Superscript className="w-3.5 h-3.5" />
                      </IconBtn>

                      <div className="w-px h-4 bg-[#E1DFDD] mx-1" />

                      {/* Text Highlight Color */}
                      <div className="relative flex items-center">
                        <IconBtn
                          onClick={() => onExecCommand('hiliteColor', activeHighlight)}
                          title="Text Highlight Color"
                          className="flex-col py-0.5"
                        >
                          <Highlighter className="w-3.5 h-3.5" />
                          <span
                            className="w-3.5 h-[2.5px] rounded-full"
                            style={{
                              backgroundColor:
                                activeHighlight === 'transparent' ? '#FFF59D' : activeHighlight,
                            }}
                          />
                        </IconBtn>
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => toggleMenu('highlight')}
                          title="Choose Highlight Color"
                          className="h-6 px-0.5 rounded hover:bg-[#E1DFDD] cursor-pointer"
                        >
                          <ChevronDown className="w-2.5 h-2.5 text-[#605E5C]" />
                        </button>
                        {openMenu === 'highlight' && (
                          <div className="absolute left-0 top-7 bg-white border border-[#D2D0CE] rounded shadow-lg p-2 z-50 w-40">
                            <div className="text-[10px] font-semibold text-[#605E5C] mb-1.5">
                              Highlight Color
                            </div>
                            <div className="grid grid-cols-3 gap-1.5">
                              {HIGHLIGHT_COLORS.map((item) => (
                                <button
                                  key={item.label}
                                  type="button"
                                  onMouseDown={(e) => e.preventDefault()}
                                  onClick={() => {
                                    setActiveHighlight(item.color);
                                    onExecCommand('hiliteColor', item.color);
                                    setOpenMenu(null);
                                  }}
                                  title={item.label}
                                  className="h-6 rounded border border-[#C8C6C4] text-[10px] flex items-center justify-center cursor-pointer hover:scale-105 transition-transform"
                                  style={{ backgroundColor: item.color }}
                                >
                                  {item.color === 'transparent' ? 'No' : ''}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Font Color */}
                      <div className="relative flex items-center">
                        <IconBtn
                          onClick={() => onExecCommand('foreColor', activeFontColor)}
                          title="Font Color"
                          className="flex-col py-0.5"
                        >
                          <span className="font-bold text-xs leading-none">A</span>
                          <span
                            className="w-3.5 h-[2.5px] rounded-full mt-0.5"
                            style={{ backgroundColor: activeFontColor }}
                          />
                        </IconBtn>
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => toggleMenu('fontcolor')}
                          title="Choose Font Color"
                          className="h-6 px-0.5 rounded hover:bg-[#E1DFDD] cursor-pointer"
                        >
                          <ChevronDown className="w-2.5 h-2.5 text-[#605E5C]" />
                        </button>
                        {openMenu === 'fontcolor' && (
                          <div className="absolute left-0 top-7 bg-white border border-[#D2D0CE] rounded shadow-lg p-2 z-50 w-44">
                            <div className="text-[10px] font-semibold text-[#605E5C] mb-1.5">
                              Theme &amp; Standard Colors
                            </div>
                            <div className="grid grid-cols-5 gap-1.5">
                              {TEXT_COLORS.map((hex) => (
                                <button
                                  key={hex}
                                  type="button"
                                  onMouseDown={(e) => e.preventDefault()}
                                  onClick={() => {
                                    setActiveFontColor(hex);
                                    onExecCommand('foreColor', hex);
                                    setOpenMenu(null);
                                  }}
                                  title={hex}
                                  className="w-6 h-6 rounded border border-[#D2D0CE] cursor-pointer hover:scale-110 transition-transform"
                                  style={{ backgroundColor: hex }}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </RibbonGroup>

                {/* Paragraph Group */}
                <RibbonGroup label="Paragraph">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-0.5">
                      <IconBtn
                        active={formatting.unorderedList}
                        onClick={() => onExecCommand('insertUnorderedList')}
                        title="Bullets"
                      >
                        <List className="w-3.5 h-3.5" />
                      </IconBtn>
                      <IconBtn
                        active={formatting.orderedList}
                        onClick={() => onExecCommand('insertOrderedList')}
                        title="Numbering"
                      >
                        <ListOrdered className="w-3.5 h-3.5" />
                      </IconBtn>
                      <IconBtn
                        onClick={() => onExecCommand('insertHTML', '<p>☐ Task item</p>')}
                        title="Insert Checklist Item"
                      >
                        <CheckSquare className="w-3.5 h-3.5" />
                      </IconBtn>

                      <div className="w-px h-4 bg-[#E1DFDD] mx-1" />

                      <IconBtn onClick={() => onExecCommand('outdent')} title="Decrease Indent">
                        <IndentDecrease className="w-3.5 h-3.5" />
                      </IconBtn>
                      <IconBtn onClick={() => onExecCommand('indent')} title="Increase Indent">
                        <IndentIncrease className="w-3.5 h-3.5" />
                      </IconBtn>

                      <div className="relative">
                        <IconBtn
                          onClick={() => toggleMenu('spacing')}
                          title="Line and Paragraph Spacing"
                        >
                          <Pilcrow className="w-3.5 h-3.5" />
                          <ChevronDown className="w-2.5 h-2.5 ml-0.5" />
                        </IconBtn>
                        {openMenu === 'spacing' && (
                          <div className="absolute left-0 top-7 bg-white border border-[#D2D0CE] rounded shadow-lg py-1 z-50 w-28">
                            {[1.0, 1.15, 1.5, 2.0].map((val) => (
                              <button
                                key={val}
                                type="button"
                                onClick={() => {
                                  onUpdateSettings({ lineSpacing: val });
                                  setOpenMenu(null);
                                }}
                                className={`w-full px-3 py-1 text-left text-xs hover:bg-[#F3F2F1] flex justify-between cursor-pointer tabular-nums ${
                                  settings.lineSpacing === val ? 'font-semibold text-[#185ABD]' : ''
                                }`}
                              >
                                <span>{val.toFixed(2).replace(/\.00$/, '.0')}</span>
                                {settings.lineSpacing === val && <span>✓</span>}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-0.5">
                      <IconBtn
                        active={formatting.align === 'left'}
                        onClick={() => onExecCommand('justifyLeft')}
                        title="Align Left (Ctrl+L)"
                      >
                        <AlignLeft className="w-3.5 h-3.5" />
                      </IconBtn>
                      <IconBtn
                        active={formatting.align === 'center'}
                        onClick={() => onExecCommand('justifyCenter')}
                        title="Center (Ctrl+E)"
                      >
                        <AlignCenter className="w-3.5 h-3.5" />
                      </IconBtn>
                      <IconBtn
                        active={formatting.align === 'right'}
                        onClick={() => onExecCommand('justifyRight')}
                        title="Align Right (Ctrl+R)"
                      >
                        <AlignRight className="w-3.5 h-3.5" />
                      </IconBtn>
                      <IconBtn
                        active={formatting.align === 'justify'}
                        onClick={() => onExecCommand('justifyFull')}
                        title="Justify (Ctrl+J)"
                      >
                        <AlignJustify className="w-3.5 h-3.5" />
                      </IconBtn>

                      <div className="w-px h-4 bg-[#E1DFDD] mx-1" />

                      <IconBtn
                        onClick={() => onExecCommand('hiliteColor', '#EDEBE9')}
                        title="Paragraph Shading"
                      >
                        <PaintBucket className="w-3.5 h-3.5 text-[#185ABD]" />
                      </IconBtn>
                      <IconBtn onClick={onInsertHorizontalRule} title="Insert Horizontal Divider">
                        <Minus className="w-3.5 h-3.5" />
                      </IconBtn>
                    </div>
                  </div>
                </RibbonGroup>

                {/* Styles Gallery Group */}
                <RibbonGroup label="Styles">
                  <div className="flex items-center gap-1 bg-[#FAF9F8] border border-[#E1DFDD] rounded p-1">
                    {[
                      { id: 'p' as const, label: 'Normal', preview: 'AaBbCc', cls: 'text-[11px] text-[#242424]' },
                      { id: 'h1' as const, label: 'Heading 1', preview: 'AaBbCc', cls: 'text-xs text-[#0F6CBD] font-normal' },
                      { id: 'h2' as const, label: 'Heading 2', preview: 'AaBbCc', cls: 'text-[11px] text-[#0F6CBD] font-normal' },
                      { id: 'h3' as const, label: 'Heading 3', preview: 'AaBbCc', cls: 'text-[11px] text-[#104A9E] font-semibold' },
                      { id: 'title' as const, label: 'Title', preview: 'AaBb', cls: 'text-sm font-light text-[#242424]' },
                      { id: 'blockquote' as const, label: 'Quote', preview: 'AaBbCc', cls: 'text-[11px] italic text-[#484644]' },
                    ].map((st) => {
                      const active =
                        (st.id === 'p' && (formatting.blockTag === 'p' || formatting.blockTag === 'div')) ||
                        formatting.blockTag === st.id;
                      return (
                        <button
                          key={st.id}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => onApplyStyle(st.id)}
                          className={`w-16 h-12 rounded px-1 flex flex-col items-center justify-center bg-white border transition-colors cursor-pointer shrink-0 ${
                            active
                              ? 'border-[#185ABD] ring-1 ring-[#185ABD]'
                              : 'border-[#E1DFDD] hover:border-[#8A8886]'
                          }`}
                        >
                          <span className={`leading-none mb-1 ${st.cls}`}>{st.preview}</span>
                          <span className="text-[9.5px] text-[#605E5C] truncate max-w-full">
                            {st.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </RibbonGroup>

                {/* Editing Group */}
                <RibbonGroup label="Editing">
                  <div className="flex flex-col gap-0.5">
                    <IconBtn
                      onClick={() => onOpenFindReplace('find')}
                      title="Find text (Ctrl+F)"
                      className="justify-start px-2 gap-1.5"
                    >
                      <Search className="w-3.5 h-3.5 text-[#185ABD]" />
                      <span className="text-[11px]">Find</span>
                    </IconBtn>
                    <IconBtn
                      onClick={() => onOpenFindReplace('replace')}
                      title="Find and Replace (Ctrl+H)"
                      className="justify-start px-2 gap-1.5"
                    >
                      <Replace className="w-3.5 h-3.5 text-[#185ABD]" />
                      <span className="text-[11px]">Replace</span>
                    </IconBtn>
                    <IconBtn
                      onClick={onSelectAll}
                      title="Select All (Ctrl+A)"
                      className="justify-start px-2 gap-1.5"
                    >
                      <LayoutGrid className="w-3.5 h-3.5 text-[#605E5C]" />
                      <span className="text-[11px]">Select All</span>
                    </IconBtn>
                  </div>
                </RibbonGroup>
              </>
            )}

            {activeTab === 'Insert' && (
              <>
                <RibbonGroup label="Pages">
                  <LargeBtn
                    onClick={onInsertBlankPage}
                    title="Insert Blank Page"
                    icon={<FilePlus className="w-5 h-5 text-[#185ABD]" />}
                    label="Blank Page"
                  />
                  <LargeBtn
                    onClick={onInsertPageBreak}
                    title="Insert Page Break"
                    icon={<FileText className="w-5 h-5 text-[#605E5C]" />}
                    label="Page Break"
                  />
                </RibbonGroup>

                <RibbonGroup label="Tables">
                  <div className="relative">
                    <LargeBtn
                      active={openMenu === 'tableGrid'}
                      onClick={() => toggleMenu('tableGrid')}
                      title="Insert Table"
                      icon={<TableIcon className="w-5 h-5 text-[#185ABD]" />}
                      label="Table"
                    />
                    {openMenu === 'tableGrid' && (
                      <div className="absolute left-0 top-16 bg-white border border-[#D2D0CE] rounded shadow-xl p-3 z-50 w-52">
                        <div className="text-xs font-semibold text-[#242424] mb-2 tabular-nums">
                          {tableHover.r} × {tableHover.c} Table
                        </div>
                        <div className="grid grid-cols-8 gap-1">
                          {Array.from({ length: 64 }).map((_, idx) => {
                            const r = Math.floor(idx / 8) + 1;
                            const c = (idx % 8) + 1;
                            const highlighted = r <= tableHover.r && c <= tableHover.c;
                            return (
                              <button
                                key={idx}
                                type="button"
                                onMouseEnter={() => setTableHover({ r, c })}
                                onClick={() => {
                                  onInsertTable(r, c);
                                  setOpenMenu(null);
                                }}
                                aria-label={`Insert ${r} by ${c} table`}
                                className={`w-4 h-4 border rounded-[1px] cursor-pointer ${
                                  highlighted
                                    ? 'bg-[#CFE4FA] border-[#185ABD]'
                                    : 'bg-white border-[#C8C6C4]'
                                }`}
                              />
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </RibbonGroup>

                <RibbonGroup label="Illustrations">
                  <LargeBtn
                    onClick={() => imageInputRef.current?.click()}
                    title="Insert Picture from Computer"
                    icon={<ImageIcon className="w-5 h-5 text-[#107C41]" />}
                    label="Pictures"
                  />
                  <LargeBtn
                    onClick={onInsertCallout}
                    title="Insert Callout Box"
                    icon={<LayoutGrid className="w-5 h-5 text-[#185ABD]" />}
                    label="Callout Box"
                  />
                  <LargeBtn
                    onClick={onInsertHorizontalRule}
                    title="Insert Horizontal Line"
                    icon={<Minus className="w-5 h-5 text-[#605E5C]" />}
                    label="Line"
                  />
                </RibbonGroup>

                <RibbonGroup label="Links & Comments">
                  <LargeBtn
                    onClick={onOpenLinkDialog}
                    title="Insert Hyperlink"
                    icon={<Link2 className="w-5 h-5 text-[#0F6CBD]" />}
                    label="Link"
                  />
                  <LargeBtn
                    onClick={onAddComment}
                    title="Insert Comment"
                    icon={<MessageSquarePlus className="w-5 h-5 text-[#8764B8]" />}
                    label="Comment"
                  />
                </RibbonGroup>

                <RibbonGroup label="Header & Footer">
                  <LargeBtn
                    active={settings.showHeaderFooter}
                    onClick={onToggleHeaderFooter}
                    title="Toggle Header and Footer editing areas"
                    icon={<Bookmark className="w-5 h-5 text-[#185ABD]" />}
                    label="Header/Footer"
                  />
                  <div className="relative">
                    <LargeBtn
                      active={openMenu === 'pageNumber'}
                      onClick={() => toggleMenu('pageNumber')}
                      title="Insert Automatic Page Number in Footer"
                      icon={<Hash className="w-5 h-5 text-[#185ABD]" />}
                      label="Page Number"
                    />
                    {openMenu === 'pageNumber' && (
                      <div className="absolute left-0 top-16 bg-white border border-[#D2D0CE] rounded shadow-xl py-1 z-50 w-52">
                        <div className="px-3 py-1 text-[10.5px] font-semibold text-[#605E5C] border-b border-[#EDEBE9]">
                          Insert Page Number in Footer
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            onInsertPageNumber('pageOfTotal');
                            setOpenMenu(null);
                          }}
                          className="w-full px-3 py-1.5 text-left text-xs hover:bg-[#F3F2F1] flex items-center justify-between cursor-pointer"
                        >
                          <span>Page 1 of X</span>
                          <span className="text-[10px] font-mono text-[#605E5C]">{'{PAGE}/{NUMPAGES}'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onInsertPageNumber('pageOnly');
                            setOpenMenu(null);
                          }}
                          className="w-full px-3 py-1.5 text-left text-xs hover:bg-[#F3F2F1] flex items-center justify-between cursor-pointer"
                        >
                          <span>Page 1</span>
                          <span className="text-[10px] font-mono text-[#605E5C]">Page {'{PAGE}'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onInsertPageNumber('numberOnly');
                            setOpenMenu(null);
                          }}
                          className="w-full px-3 py-1.5 text-left text-xs hover:bg-[#F3F2F1] flex items-center justify-between cursor-pointer"
                        >
                          <span>Plain Number</span>
                          <span className="text-[10px] font-mono text-[#605E5C]">{'{PAGE}'}</span>
                        </button>
                        <div className="border-t border-[#EDEBE9] mt-1 pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              onInsertPageNumber('remove');
                              setOpenMenu(null);
                            }}
                            className="w-full px-3 py-1.5 text-left text-xs text-[#A4262C] hover:bg-[#F3F2F1] cursor-pointer"
                          >
                            Remove Page Numbers
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  <LargeBtn
                    onClick={onInsertDateTime}
                    title="Insert Current Date"
                    icon={<Type className="w-5 h-5 text-[#484644]" />}
                    label="Date & Time"
                  />
                </RibbonGroup>

                <RibbonGroup label="Symbols">
                  <div className="relative">
                    <LargeBtn
                      active={openMenu === 'symbols'}
                      onClick={() => toggleMenu('symbols')}
                      title="Insert Symbol"
                      icon={<Sigma className="w-5 h-5 text-[#242424]" />}
                      label="Symbol"
                    />
                    {openMenu === 'symbols' && (
                      <div className="absolute left-0 top-16 bg-white border border-[#D2D0CE] rounded shadow-xl p-2 z-50 w-52">
                        <div className="text-[11px] font-semibold text-[#605E5C] mb-1.5">
                          Insert Symbol
                        </div>
                        <div className="grid grid-cols-6 gap-1">
                          {SYMBOLS.map((sym) => (
                            <button
                              key={sym}
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => {
                                onInsertSymbol(sym);
                                setOpenMenu(null);
                              }}
                              className="h-7 rounded border border-[#E1DFDD] hover:bg-[#CFE4FA] hover:border-[#185ABD] text-sm cursor-pointer"
                            >
                              {sym}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </RibbonGroup>
              </>
            )}

            {activeTab === 'Draw' && (
              <>
                <RibbonGroup label="Drawing Canvas">
                  <LargeBtn
                    onClick={onOpenDrawPad}
                    title="Open Freehand Sketch & Signature Pad"
                    icon={<PenTool className="w-5 h-5 text-[#185ABD]" />}
                    label="Sketch / Sign"
                  />
                </RibbonGroup>
                <RibbonGroup label="Quick Highlight Pens">
                  <IconBtn
                    onClick={() => onExecCommand('hiliteColor', '#FFF59D')}
                    title="Yellow Highlighter"
                    className="gap-1.5 px-2.5 h-9"
                  >
                    <span className="w-3.5 h-3.5 rounded-full bg-[#FFF59D] border border-[#C8C6C4]" />
                    <span>Yellow Marker</span>
                  </IconBtn>
                  <IconBtn
                    onClick={() => onExecCommand('hiliteColor', '#BBF7D0')}
                    title="Green Highlighter"
                    className="gap-1.5 px-2.5 h-9"
                  >
                    <span className="w-3.5 h-3.5 rounded-full bg-[#BBF7D0] border border-[#C8C6C4]" />
                    <span>Green Marker</span>
                  </IconBtn>
                  <IconBtn
                    onClick={() => onExecCommand('hiliteColor', 'transparent')}
                    title="Erase Highlight"
                    className="gap-1.5 px-2.5 h-9"
                  >
                    <Eraser className="w-3.5 h-3.5 text-[#A4262C]" />
                    <span>Erase Highlight</span>
                  </IconBtn>
                </RibbonGroup>
              </>
            )}

            {activeTab === 'Design' && (
              <>
                <RibbonGroup label="Document Themes">
                  <div className="flex items-center gap-1.5">
                    {(Object.keys(THEME_PALETTES) as ThemePreset[]).map((key) => {
                      const t = THEME_PALETTES[key];
                      const active = settings.theme === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => onUpdateSettings({ theme: key })}
                          className={`h-14 px-2.5 rounded border flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors ${
                            active
                              ? 'bg-[#CFE4FA] border-[#185ABD]'
                              : 'bg-white border-[#E1DFDD] hover:border-[#8A8886]'
                          }`}
                        >
                          <div className="flex gap-1">
                            <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: t.primary }} />
                            <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: t.secondary }} />
                          </div>
                          <span className="text-[10px] text-[#242424] whitespace-nowrap">{t.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </RibbonGroup>

                <RibbonGroup label="Page Background">
                  <LargeBtn
                    onClick={onOpenWatermarkDialog}
                    title="Add or Remove Page Watermark"
                    icon={<Stamp className="w-5 h-5 text-[#605E5C]" />}
                    label="Watermark"
                  />

                  <div className="relative">
                    <LargeBtn
                      active={openMenu === 'pageColor'}
                      onClick={() => toggleMenu('pageColor')}
                      title="Page Background Color"
                      icon={<Palette className="w-5 h-5 text-[#185ABD]" />}
                      label="Page Color"
                    />
                    {openMenu === 'pageColor' && (
                      <div className="absolute left-0 top-16 bg-white border border-[#D2D0CE] rounded shadow-xl p-2.5 z-50 w-44">
                        <div className="text-[11px] font-semibold text-[#605E5C] mb-2">
                          Page Paper Color
                        </div>
                        <div className="grid grid-cols-4 gap-1.5">
                          {[
                            { name: 'Pure White', hex: '#FFFFFF' },
                            { name: 'Warm Ivory', hex: '#FDFBF7' },
                            { name: 'Soft Blue', hex: '#F4F8FD' },
                            { name: 'Mint Tint', hex: '#F3FAF6' },
                          ].map((c) => (
                            <button
                              key={c.hex}
                              type="button"
                              onClick={() => {
                                onUpdateSettings({ pageColor: c.hex });
                                setOpenMenu(null);
                              }}
                              title={c.name}
                              className={`h-7 rounded border cursor-pointer ${
                                settings.pageColor === c.hex
                                  ? 'border-[#185ABD] ring-2 ring-[#185ABD]/40'
                                  : 'border-[#C8C6C4]'
                              }`}
                              style={{ backgroundColor: c.hex }}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="relative">
                    <LargeBtn
                      active={openMenu === 'pageBorder'}
                      onClick={() => toggleMenu('pageBorder')}
                      title="Page Borders"
                      icon={<LayoutGrid className="w-5 h-5 text-[#484644]" />}
                      label="Page Borders"
                    />
                    {openMenu === 'pageBorder' && (
                      <div className="absolute left-0 top-16 bg-white border border-[#D2D0CE] rounded shadow-xl py-1 z-50 w-36">
                        {(['none', 'box', 'shadow', 'double'] as PageBorderStyle[]).map((b) => (
                          <button
                            key={b}
                            type="button"
                            onClick={() => {
                              onUpdateSettings({ pageBorder: b });
                              setOpenMenu(null);
                            }}
                            className={`w-full px-3 py-1.5 text-left text-xs capitalize hover:bg-[#F3F2F1] flex justify-between cursor-pointer ${
                              settings.pageBorder === b ? 'font-semibold text-[#185ABD]' : ''
                            }`}
                          >
                            <span>{b}</span>
                            {settings.pageBorder === b && <span>✓</span>}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </RibbonGroup>
              </>
            )}

            {activeTab === 'Layout' && (
              <>
                <RibbonGroup label="Page Setup">
                  <div className="relative">
                    <LargeBtn
                      active={openMenu === 'margins'}
                      onClick={() => toggleMenu('margins')}
                      title="Page Margins"
                      icon={<Maximize2 className="w-5 h-5 text-[#185ABD]" />}
                      label="Margins"
                    />
                    {openMenu === 'margins' && (
                      <div className="absolute left-0 top-16 bg-white border border-[#D2D0CE] rounded shadow-xl py-1 z-50 w-60">
                        {(Object.keys(MARGIN_INCHES) as MarginPreset[]).map((key) => {
                          const m = MARGIN_INCHES[key];
                          return (
                            <button
                              key={key}
                              type="button"
                              onClick={() => {
                                onUpdateSettings({ margins: key });
                                setOpenMenu(null);
                              }}
                              className={`w-full px-3 py-2 text-left hover:bg-[#F3F2F1] cursor-pointer ${
                                settings.margins === key ? 'bg-[#CFE4FA]/50' : ''
                              }`}
                            >
                              <div className="text-xs font-semibold text-[#242424]">{m.label}</div>
                              <div className="text-[10.5px] text-[#605E5C]">{m.desc}</div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="relative">
                    <LargeBtn
                      active={openMenu === 'orientation'}
                      onClick={() => toggleMenu('orientation')}
                      title="Page Orientation"
                      icon={<RotateCcw className="w-5 h-5 text-[#484644]" />}
                      label="Orientation"
                    />
                    {openMenu === 'orientation' && (
                      <div className="absolute left-0 top-16 bg-white border border-[#D2D0CE] rounded shadow-xl py-1 z-50 w-36">
                        {(['portrait', 'landscape'] as Orientation[]).map((o) => (
                          <button
                            key={o}
                            type="button"
                            onClick={() => {
                              onUpdateSettings({ orientation: o });
                              setOpenMenu(null);
                            }}
                            className={`w-full px-3 py-1.5 text-left text-xs capitalize hover:bg-[#F3F2F1] flex justify-between cursor-pointer ${
                              settings.orientation === o ? 'font-semibold text-[#185ABD]' : ''
                            }`}
                          >
                            <span>{o}</span>
                            {settings.orientation === o && <span>✓</span>}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="relative">
                    <LargeBtn
                      active={openMenu === 'size'}
                      onClick={() => toggleMenu('size')}
                      title="Paper Size"
                      icon={<FileText className="w-5 h-5 text-[#185ABD]" />}
                      label="Size"
                    />
                    {openMenu === 'size' && (
                      <div className="absolute left-0 top-16 bg-white border border-[#D2D0CE] rounded shadow-xl py-1 z-50 w-44">
                        {(Object.keys(PAGE_DIMENSIONS_INCHES) as PageSize[]).map((sz) => (
                          <button
                            key={sz}
                            type="button"
                            onClick={() => {
                              onUpdateSettings({ pageSize: sz });
                              setOpenMenu(null);
                            }}
                            className={`w-full px-3 py-1.5 text-left text-xs hover:bg-[#F3F2F1] flex justify-between cursor-pointer ${
                              settings.pageSize === sz ? 'font-semibold text-[#185ABD]' : ''
                            }`}
                          >
                            <span>{PAGE_DIMENSIONS_INCHES[sz].label}</span>
                            {settings.pageSize === sz && <span>✓</span>}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="relative">
                    <LargeBtn
                      active={openMenu === 'columns'}
                      onClick={() => toggleMenu('columns')}
                      title="Split Text into Columns"
                      icon={<Columns3 className="w-5 h-5 text-[#107C41]" />}
                      label="Columns"
                    />
                    {openMenu === 'columns' && (
                      <div className="absolute left-0 top-16 bg-white border border-[#D2D0CE] rounded shadow-xl py-1 z-50 w-32">
                        {([1, 2, 3] as const).map((col) => (
                          <button
                            key={col}
                            type="button"
                            onClick={() => {
                              onUpdateSettings({ columns: col });
                              setOpenMenu(null);
                            }}
                            className={`w-full px-3 py-1.5 text-left text-xs hover:bg-[#F3F2F1] flex justify-between cursor-pointer ${
                              settings.columns === col ? 'font-semibold text-[#185ABD]' : ''
                            }`}
                          >
                            <span>{col === 1 ? 'One' : col === 2 ? 'Two' : 'Three'}</span>
                            {settings.columns === col && <span>✓</span>}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </RibbonGroup>

                <RibbonGroup label="Paragraph">
                  <div className="flex flex-col gap-1 justify-center">
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="text-[#605E5C] w-14">Spacing:</span>
                      <select
                        value={settings.lineSpacing}
                        onChange={(e) => onUpdateSettings({ lineSpacing: Number(e.target.value) })}
                        className="h-6 px-1.5 bg-white border border-[#C8C6C4] rounded text-xs tabular-nums cursor-pointer"
                      >
                        <option value={1.0}>1.0 (Single)</option>
                        <option value={1.15}>1.15 (Word Default)</option>
                        <option value={1.5}>1.5 lines</option>
                        <option value={2.0}>2.0 (Double)</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-1">
                      <IconBtn onClick={() => onExecCommand('outdent')} title="Decrease Indent">
                        <IndentDecrease className="w-3.5 h-3.5 mr-1" />
                        <span>Outdent</span>
                      </IconBtn>
                      <IconBtn onClick={() => onExecCommand('indent')} title="Increase Indent">
                        <IndentIncrease className="w-3.5 h-3.5 mr-1" />
                        <span>Indent</span>
                      </IconBtn>
                    </div>
                  </div>
                </RibbonGroup>
              </>
            )}

            {activeTab === 'References' && (
              <>
                <RibbonGroup label="Table of Contents">
                  <LargeBtn
                    onClick={onInsertToc}
                    title="Auto-generate Table of Contents from Headings"
                    icon={<ListTree className="w-5 h-5 text-[#185ABD]" />}
                    label="Table of Contents"
                  />
                </RibbonGroup>
                <RibbonGroup label="Footnotes & Citations">
                  <LargeBtn
                    onClick={onInsertFootnote}
                    title="Insert Numbered Footnote"
                    icon={<Bookmark className="w-5 h-5 text-[#107C41]" />}
                    label="Insert Footnote"
                  />
                  <LargeBtn
                    onClick={onOpenCitationDialog}
                    title="Insert Formatted Citation (APA/MLA)"
                    icon={<BookOpen className="w-5 h-5 text-[#8764B8]" />}
                    label="Insert Citation"
                  />
                </RibbonGroup>
              </>
            )}

            {activeTab === 'Mailings' && (
              <>
                <RibbonGroup label="Write & Insert Fields">
                  {['FirstName', 'LastName', 'Company', 'Email', 'Date'].map((field) => (
                    <IconBtn
                      key={field}
                      onClick={() => onInsertMergeField(field)}
                      title={`Insert «${field}» merge placeholder`}
                      className="h-9 px-2.5 border border-[#E1DFDD] bg-[#FAF9F8]"
                    >
                      <span className="font-mono text-[11px] text-[#185ABD]">«{field}»</span>
                    </IconBtn>
                  ))}
                </RibbonGroup>
                <RibbonGroup label="Finish">
                  <LargeBtn
                    onClick={onOpenMailMergeDialog}
                    title="Fill and Merge Fields in Document"
                    icon={<Sparkles className="w-5 h-5 text-[#185ABD]" />}
                    label="Finish & Merge"
                  />
                </RibbonGroup>
              </>
            )}

            {activeTab === 'Review' && (
              <>
                <RibbonGroup label="Proofing">
                  <LargeBtn
                    onClick={onRunProofing}
                    title="Check Spelling & Repeated Words"
                    icon={<SpellCheck className="w-5 h-5 text-[#185ABD]" />}
                    label="Spelling"
                  />
                  <LargeBtn
                    onClick={onOpenWordCount}
                    title="Word Count & Document Statistics"
                    icon={<Type className="w-5 h-5 text-[#484644]" />}
                    label="Word Count"
                  />
                </RibbonGroup>

                <RibbonGroup label="Speech">
                  <LargeBtn
                    active={isReadingAloud}
                    onClick={onToggleReadAloud}
                    title="Read Document Aloud"
                    icon={
                      isReadingAloud ? (
                        <VolumeX className="w-5 h-5 text-[#A4262C]" />
                      ) : (
                        <Volume2 className="w-5 h-5 text-[#185ABD]" />
                      )
                    }
                    label={isReadingAloud ? 'Stop Reading' : 'Read Aloud'}
                  />
                </RibbonGroup>

                <RibbonGroup label="Comments">
                  <LargeBtn
                    onClick={onAddComment}
                    title="New Comment on Selected Text"
                    icon={<MessageSquarePlus className="w-5 h-5 text-[#8764B8]" />}
                    label="New Comment"
                  />
                  <LargeBtn
                    active={commentsOpen}
                    onClick={onToggleCommentsPane}
                    title="Show or Hide Comments Pane"
                    icon={<MessageSquareText className="w-5 h-5 text-[#484644]" />}
                    label="Show Comments"
                  />
                </RibbonGroup>
              </>
            )}

            {activeTab === 'View' && (
              <>
                <RibbonGroup label="Views">
                  <LargeBtn
                    active={viewMode === 'read'}
                    onClick={() => onViewModeChange('read')}
                    title="Distraction-Free Read Mode"
                    icon={<BookOpen className="w-5 h-5 text-[#185ABD]" />}
                    label="Read Mode"
                  />
                  <LargeBtn
                    active={viewMode === 'print'}
                    onClick={() => onViewModeChange('print')}
                    title="Print Layout (Default Word Page View)"
                    icon={<Printer className="w-5 h-5 text-[#185ABD]" />}
                    label="Print Layout"
                  />
                  <LargeBtn
                    active={viewMode === 'web'}
                    onClick={() => onViewModeChange('web')}
                    title="Full-Width Web Layout"
                    icon={<Globe className="w-5 h-5 text-[#107C41]" />}
                    label="Web Layout"
                  />
                </RibbonGroup>

                <RibbonGroup label="Show">
                  <div className="flex flex-col gap-1 justify-center px-1">
                    <label className="flex items-center gap-2 text-xs text-[#242424] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.showRuler}
                        onChange={(e) => onUpdateSettings({ showRuler: e.target.checked })}
                        className="accent-[#185ABD] cursor-pointer"
                      />
                      <Ruler className="w-3.5 h-3.5 text-[#605E5C]" />
                      <span>Ruler</span>
                    </label>
                    <label className="flex items-center gap-2 text-xs text-[#242424] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.showMarginGuides}
                        onChange={(e) => onUpdateSettings({ showMarginGuides: e.target.checked })}
                        className="accent-[#185ABD] cursor-pointer"
                      />
                      <LayoutGrid className="w-3.5 h-3.5 text-[#605E5C]" />
                      <span>Margin Guides</span>
                    </label>
                    <label className="flex items-center gap-2 text-xs text-[#242424] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.showNavigationPane}
                        onChange={(e) => onUpdateSettings({ showNavigationPane: e.target.checked })}
                        className="accent-[#185ABD] cursor-pointer"
                      />
                      <ListTree className="w-3.5 h-3.5 text-[#605E5C]" />
                      <span>Navigation Pane</span>
                    </label>
                  </div>
                </RibbonGroup>

                <RibbonGroup label="Zoom">
                  <div className="flex items-center gap-1">
                    {[75, 100, 125, 150].map((z) => (
                      <IconBtn
                        key={z}
                        active={zoom === z}
                        onClick={() => onZoomChange(z)}
                        title={`Set Zoom to ${z}%`}
                        className="h-9 px-2.5 tabular-nums"
                      >
                        {z}%
                      </IconBtn>
                    ))}
                    <LargeBtn
                      onClick={onFitPageWidth}
                      title="Fit Page Width"
                      icon={<Maximize2 className="w-5 h-5 text-[#484644]" />}
                      label="Page Width"
                    />
                  </div>
                </RibbonGroup>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
