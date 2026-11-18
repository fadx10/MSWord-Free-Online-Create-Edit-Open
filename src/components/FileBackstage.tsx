import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Clock,
  Download,
  FileCode2,
  FilePlus2,
  FileText,
  FolderOpen,
  HardDrive,
  Home,
  Info,
  Printer,
  Save,
  Search,
  Settings,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { WORD_TEMPLATES, WordTemplate } from '../data/templates';
import {
  DocumentRecord,
  DocumentSettings,
  DocumentStats,
  MARGIN_INCHES,
  PAGE_DIMENSIONS_INCHES,
  THEME_PALETTES,
} from '../types/word';
import { resolvePageNumberPlaceholders } from '../utils/editorHelpers';

export type BackstageSection = 'home' | 'new' | 'open' | 'info' | 'export' | 'options';

const PREVIEW_VIRTUAL_WIDTH = 560;
const PREVIEW_VIRTUAL_HEIGHT = Math.round((PREVIEW_VIRTUAL_WIDTH * 4) / 3);

const TemplateMiniPreview: React.FC<{ template: WordTemplate }> = ({ template }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [cardWidth, setCardWidth] = useState(176);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateWidth = () => {
      if (el.clientWidth > 0) {
        setCardWidth(el.clientWidth);
      }
    };
    updateWidth();

    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(updateWidth);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  if (template.id === 'blank') {
    return (
      <div
        ref={containerRef}
        className="aspect-[3/4] w-full bg-white border border-[#D2D0CE] group-hover:border-[#185ABD] group-hover:shadow-md rounded-[3px] transition-all flex flex-col items-center justify-center p-4 relative overflow-hidden"
      >
        <div
          className="absolute top-0 left-0 right-0 h-1"
          style={{ backgroundColor: template.accentColor }}
        />
        <div className="w-11 h-11 rounded-full bg-[#EDF4FC] text-[#185ABD] flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
          <FilePlus2 className="w-5 h-5" />
        </div>
        <span className="text-[11px] font-medium text-[#605E5C]">Blank Page</span>
      </div>
    );
  }

  const themeKey = template.settings.theme ?? 'office';
  const theme = THEME_PALETTES[themeKey];
  const marginKey = template.settings.margins ?? 'normal';
  const margins = MARGIN_INCHES[marginKey];
  const padY = Math.round(margins.top * 34);
  const padX = Math.round(margins.left * 34);
  const scale = cardWidth / PREVIEW_VIRTUAL_WIDTH;
  const resolvedFooter = template.footerText
    ? resolvePageNumberPlaceholders(template.footerText, 1, 1, template.settings.pageNumbers)
    : '';

  return (
    <div
      ref={containerRef}
      className="aspect-[3/4] w-full bg-white border border-[#D2D0CE] group-hover:border-[#185ABD] group-hover:shadow-md rounded-[3px] transition-all relative overflow-hidden"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none select-none absolute top-0 left-0 bg-white flex flex-col justify-between"
        style={{
          width: `${PREVIEW_VIRTUAL_WIDTH}px`,
          height: `${PREVIEW_VIRTUAL_HEIGHT}px`,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          padding: `${padY}px ${padX}px`,
          backgroundColor: template.settings.pageColor ?? '#FFFFFF',
          borderTop: `4px solid ${template.accentColor}`,
        }}
      >
        {template.headerText ? (
          <div className="text-[8.5pt] text-[#8A8886] text-right pb-2 truncate">
            {resolvePageNumberPlaceholders(template.headerText, 1, 1, template.settings.pageNumbers)}
          </div>
        ) : (
          <div />
        )}

        <div
          className="word-editor-content flex-1 overflow-hidden"
          style={
            {
              fontFamily: theme.fontBody,
              lineHeight: template.settings.lineSpacing ?? 1.15,
              '--doc-heading-color': theme.primary,
            } as React.CSSProperties
          }
          dangerouslySetInnerHTML={{ __html: template.contentHtml }}
        />

        {resolvedFooter ? (
          <div className="text-[8.5pt] text-[#8A8886] text-center pt-2 border-t border-[#F3F2F1] truncate">
            {resolvedFooter}
          </div>
        ) : null}
      </div>
    </div>
  );
};

interface FileBackstageProps {
  initialSection?: BackstageSection;
  activeDoc: DocumentRecord;
  stats: DocumentStats;
  recentDocs: DocumentRecord[];
  autoSaveEnabled: boolean;
  lastSavedText: string;
  authorName: string;
  onToggleAutoSave: (enabled: boolean) => void;
  onManualSaveLocal: () => void;
  onAuthorChange: (name: string) => void;
  onUpdateSettings: (patch: Partial<DocumentSettings>) => void;
  onClose: () => void;
  onCreateFromTemplate: (tpl: WordTemplate) => void;
  onOpenLocalFile: (file: File) => void;
  onOpenRecentDoc: (doc: DocumentRecord) => void;
  onDeleteRecentDoc: (id: string) => void;
  onClearRecentDocs: () => void;
  onExportDocx: () => void;
  onExportHtml: () => void;
  onExportTxt: () => void;
  onPrint: () => void;
  onRenameActive: (newTitle: string) => void;
}

export const FileBackstage: React.FC<FileBackstageProps> = ({
  initialSection = 'home',
  activeDoc,
  stats,
  recentDocs,
  autoSaveEnabled,
  lastSavedText,
  authorName,
  onToggleAutoSave,
  onManualSaveLocal,
  onAuthorChange,
  onUpdateSettings,
  onClose,
  onCreateFromTemplate,
  onOpenLocalFile,
  onOpenRecentDoc,
  onDeleteRecentDoc,
  onClearRecentDocs,
  onExportDocx,
  onExportHtml,
  onExportTxt,
  onPrint,
  onRenameActive,
}) => {
  const [section, setSection] = useState<BackstageSection>(initialSection);
  const [isDragging, setIsDragging] = useState(false);
  const [templateCategory, setTemplateCategory] = useState<string>('All');
  const [templateQuery, setTemplateQuery] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const templateCategories = useMemo(() => {
    const unique = Array.from(new Set(WORD_TEMPLATES.map((t) => t.category)));
    return ['All', ...unique];
  }, []);

  const filteredTemplates = useMemo(() => {
    const q = templateQuery.trim().toLowerCase();
    return WORD_TEMPLATES.filter((tpl) => {
      if (templateCategory !== 'All' && tpl.category !== templateCategory) return false;
      if (!q) return true;
      return (
        tpl.name.toLowerCase().includes(q) ||
        tpl.category.toLowerCase().includes(q) ||
        tpl.description.toLowerCase().includes(q)
      );
    });
  }, [templateCategory, templateQuery]);

  const navItems: Array<{ id: BackstageSection; label: string; icon: React.ReactNode }> = [
    { id: 'home', label: 'Home', icon: <Home className="w-4 h-4" /> },
    { id: 'new', label: 'New', icon: <FilePlus2 className="w-4 h-4" /> },
    { id: 'open', label: 'Open', icon: <FolderOpen className="w-4 h-4" /> },
    { id: 'info', label: 'Info', icon: <Info className="w-4 h-4" /> },
    { id: 'export', label: 'Save As / Export', icon: <Download className="w-4 h-4" /> },
  ];

  return (
    <div className="no-print fixed inset-0 z-50 flex bg-[#FAF9F8] text-[#242424]">
      <input
        ref={fileInputRef}
        type="file"
        accept=".docx,.html,.htm,.txt,.md"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            onOpenLocalFile(file);
            e.target.value = '';
          }
        }}
      />

      {/* Left Cobalt Word Rail */}
      <aside className="w-44 sm:w-52 bg-[#185ABD] text-white flex flex-col justify-between py-4 shrink-0">
        <div>
          <button
            type="button"
            onClick={onClose}
            className="mx-3 mb-5 w-9 h-9 rounded-full border border-white/30 flex items-center justify-center hover:bg-white/15 transition-colors cursor-pointer"
            title="Back to Document"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <nav className="flex flex-col">
            {navItems.map((item) => {
              const active = section === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSection(item.id)}
                  className={`px-5 py-3 text-left text-xs font-medium flex items-center gap-3 transition-colors cursor-pointer ${
                    active ? 'bg-[#104A9E] font-semibold' : 'hover:bg-white/10'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}

            <div className="my-2 mx-4 border-t border-white/20" />

            <button
              type="button"
              onClick={() => {
                onClose();
                setTimeout(onPrint, 120);
              }}
              className="px-5 py-3 text-left text-xs font-medium flex items-center gap-3 hover:bg-white/10 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print / PDF</span>
            </button>

            <button
              type="button"
              onClick={() => setSection('options')}
              className={`px-5 py-3 text-left text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                section === 'options' ? 'bg-[#104A9E] font-semibold' : 'hover:bg-white/10'
              }`}
            >
              <span className="flex items-center gap-3">
                <Settings className="w-4 h-4" />
                <span>Options</span>
              </span>
              <span
                className={`w-2 h-2 rounded-full ${
                  autoSaveEnabled ? 'bg-[#86EFAC]' : 'bg-[#FCD34D]'
                }`}
                title={autoSaveEnabled ? 'Auto-Save is active' : 'Auto-Save is off'}
              />
            </button>
          </nav>
        </div>

        <div className="px-5 text-[11px] text-white/75">
          Word Online · Client-Side .docx Engine
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-6 sm:p-10 office-scroll">
        {(section === 'home' || section === 'new') && (
          <div className="max-w-5xl space-y-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-semibold text-[#242424]">
                  {section === 'home' ? 'Good day — Ready to write' : 'New Document'}
                </h1>
                <p className="text-xs text-[#605E5C] mt-1">
                  Start from a blank sheet, choose a structured template, or open an existing Word (.docx) file.
                </p>
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 rounded bg-[#185ABD] hover:bg-[#104A9E] text-white text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors"
              >
                <Upload className="w-4 h-4" />
                <span>Open .docx File</span>
              </button>
            </div>

            {/* Templates Grid */}
            <section>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <h2 className="text-sm font-semibold text-[#242424]">
                  Templates{' '}
                  <span className="text-xs font-normal text-[#605E5C]">
                    ({filteredTemplates.length})
                  </span>
                </h2>
                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-[#605E5C] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={templateQuery}
                    onChange={(e) => setTemplateQuery(e.target.value)}
                    placeholder="Search templates (e.g. invoice, resume)..."
                    className="w-full h-7 pl-8 pr-7 text-xs bg-white border border-[#D2D0CE] rounded focus:border-[#185ABD] outline-none"
                  />
                  {templateQuery && (
                    <button
                      type="button"
                      onClick={() => setTemplateQuery('')}
                      aria-label="Clear template search"
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-[#EDEBE9] text-[#605E5C] cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Category Filter Pills */}
              <div className="flex flex-wrap items-center gap-1.5 mb-4">
                {templateCategories.map((cat) => {
                  const active = templateCategory === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setTemplateCategory(cat)}
                      className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                        active
                          ? 'bg-[#185ABD] text-white'
                          : 'bg-white border border-[#E1DFDD] text-[#323130] hover:bg-[#F3F2F1]'
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>

              {filteredTemplates.length === 0 ? (
                <div className="bg-white border border-dashed border-[#D2D0CE] rounded p-6 text-center text-xs text-[#605E5C]">
                  No templates matched "{templateQuery}".{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setTemplateQuery('');
                      setTemplateCategory('All');
                    }}
                    className="text-[#185ABD] hover:underline font-medium cursor-pointer"
                  >
                    Show all templates
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
                  {filteredTemplates.map((tpl) => (
                    <button
                      key={tpl.id}
                      type="button"
                      title={tpl.description}
                      onClick={() => onCreateFromTemplate(tpl)}
                      className="group text-left cursor-pointer flex flex-col"
                    >
                      <TemplateMiniPreview template={tpl} />
                      <div className="mt-2 text-xs font-semibold text-[#242424] group-hover:text-[#185ABD] truncate">
                        {tpl.name}
                      </div>
                      <div className="text-[10.5px] text-[#605E5C] line-clamp-2 leading-snug mt-0.5">
                        {tpl.category} · {tpl.description}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </section>

            {/* Recent Documents */}
            {section === 'home' && (
              <section>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <h2 className="text-sm font-semibold text-[#242424] flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#605E5C]" />
                    <span>Recent Browser Drafts</span>
                  </h2>
                  {recentDocs.length > 0 && (
                    <button
                      type="button"
                      onClick={onClearRecentDocs}
                      className="text-[11px] text-[#A4262C] hover:underline cursor-pointer"
                    >
                      Clear All Local Drafts
                    </button>
                  )}
                </div>
                {recentDocs.length === 0 ? (
                  <div className="bg-white border border-[#E1DFDD] rounded p-6 text-xs text-[#605E5C]">
                    No saved drafts in this browser. Imported files from your computer are kept only for the current session and are automatically removed when you refresh or close the tab.
                  </div>
                ) : (
                  <div className="bg-white border border-[#E1DFDD] rounded divide-y divide-[#EDEBE9]">
                    {recentDocs.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between px-4 py-2.5 hover:bg-[#F3F2F1] transition-colors"
                      >
                        <button
                          type="button"
                          onClick={() => onOpenRecentDoc(doc)}
                          className="flex items-center gap-3 text-left flex-1 min-w-0 cursor-pointer"
                        >
                          <div className="w-7 h-7 rounded bg-[#185ABD]/10 text-[#185ABD] flex items-center justify-center font-bold text-xs shrink-0">
                            W
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-[#242424] truncate">
                              {doc.title}.docx
                              {doc.id === activeDoc.id && (
                                <span className="ml-2 text-[11px] font-normal text-[#185ABD]">
                                  (Current)
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-[#605E5C]">
                              Modified {new Date(doc.updatedAt).toLocaleString()}
                            </div>
                          </div>
                        </button>
                        {doc.id !== activeDoc.id && (
                          <button
                            type="button"
                            onClick={() => onDeleteRecentDoc(doc.id)}
                            title="Remove from recent list"
                            className="p-1.5 rounded text-[#605E5C] hover:text-[#A4262C] hover:bg-[#EDEBE9] cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}
          </div>
        )}

        {section === 'open' && (
          <div className="max-w-3xl space-y-6">
            <div>
              <h1 className="text-2xl font-semibold text-[#242424]">Open Document</h1>
              <p className="text-xs text-[#605E5C] mt-1">
                Import Microsoft Word (.docx), HTML (.html), Markdown (.md), or Plain Text (.txt) files.
              </p>
            </div>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                const file = e.dataTransfer.files?.[0];
                if (file) onOpenLocalFile(file);
              }}
              className={`border-2 border-dashed rounded-md p-10 text-center transition-colors ${
                isDragging
                  ? 'border-[#185ABD] bg-[#CFE4FA]/30'
                  : 'border-[#C8C6C4] bg-white hover:border-[#185ABD]'
              }`}
            >
              <FolderOpen className="w-10 h-10 text-[#185ABD] mx-auto mb-3" />
              <div className="text-sm font-semibold text-[#242424]">
                Drag and drop a .docx file here
              </div>
              <p className="text-xs text-[#605E5C] mt-1 mb-4">
                Files stay locally in your current browser tab only — never uploaded to a server and automatically cleared on page refresh.
              </p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-5 py-2 rounded bg-[#185ABD] hover:bg-[#104A9E] text-white text-xs font-semibold cursor-pointer"
              >
                Browse Computer
              </button>
            </div>

            {recentDocs.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-[#242424] mb-2">Recent Local Files</h2>
                <div className="bg-white border border-[#E1DFDD] rounded divide-y divide-[#EDEBE9]">
                  {recentDocs.map((doc) => (
                    <button
                      key={doc.id}
                      type="button"
                      onClick={() => onOpenRecentDoc(doc)}
                      className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-[#F3F2F1] text-left cursor-pointer"
                    >
                      <span className="text-xs font-medium text-[#242424]">{doc.title}.docx</span>
                      <span className="text-[11px] text-[#605E5C]">
                        {new Date(doc.updatedAt).toLocaleDateString()}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {section === 'info' && (
          <div className="max-w-2xl space-y-6">
            <div>
              <h1 className="text-2xl font-semibold text-[#242424]">Document Information</h1>
              <p className="text-xs text-[#605E5C] mt-1">
                Inspect properties, page dimensions, and live statistics for the active document.
              </p>
            </div>

            <div className="bg-white border border-[#E1DFDD] rounded p-5 space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-[#605E5C] mb-1">
                  Document Filename
                </label>
                <input
                  type="text"
                  value={activeDoc.title}
                  onChange={(e) => onRenameActive(e.target.value)}
                  className="w-full h-8 px-3 text-xs border border-[#C8C6C4] rounded focus:border-[#185ABD] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-[#EDEBE9] text-xs">
                <div>
                  <span className="text-[#605E5C] block">Pages</span>
                  <span className="font-semibold tabular-nums">{stats.pages}</span>
                </div>
                <div>
                  <span className="text-[#605E5C] block">Words</span>
                  <span className="font-semibold tabular-nums">{stats.words.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-[#605E5C] block">Characters (with spaces)</span>
                  <span className="font-semibold tabular-nums">
                    {stats.charactersWithSpaces.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-[#605E5C] block">Paragraphs</span>
                  <span className="font-semibold tabular-nums">{stats.paragraphs}</span>
                </div>
                <div>
                  <span className="text-[#605E5C] block">Paper Size &amp; Orientation</span>
                  <span className="font-semibold capitalize">
                    {PAGE_DIMENSIONS_INCHES[activeDoc.settings.pageSize].label} ·{' '}
                    {activeDoc.settings.orientation}
                  </span>
                </div>
                <div>
                  <span className="text-[#605E5C] block">Margins</span>
                  <span className="font-semibold">
                    {MARGIN_INCHES[activeDoc.settings.margins].label}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {section === 'export' && (
          <div className="max-w-3xl space-y-6">
            <div>
              <h1 className="text-2xl font-semibold text-[#242424]">Save As &amp; Export</h1>
              <p className="text-xs text-[#605E5C] mt-1">
                Download your document as a genuine Microsoft Word (.docx) file or export to other formats.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={onExportDocx}
                className="bg-white border border-[#D2D0CE] hover:border-[#185ABD] hover:shadow-sm rounded p-5 text-left flex items-start gap-4 cursor-pointer transition-all"
              >
                <div className="w-10 h-10 rounded bg-[#185ABD] text-white flex items-center justify-center font-bold shrink-0">
                  W
                </div>
                <div>
                  <div className="text-sm font-semibold text-[#242424]">Word Document (.docx)</div>
                  <div className="text-xs text-[#605E5C] mt-1">
                    Standard OpenXML Word file compatible with Microsoft Word, Google Docs, and LibreOffice.
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  setTimeout(onPrint, 120);
                }}
                className="bg-white border border-[#D2D0CE] hover:border-[#185ABD] hover:shadow-sm rounded p-5 text-left flex items-start gap-4 cursor-pointer transition-all"
              >
                <div className="w-10 h-10 rounded bg-[#A4262C] text-white flex items-center justify-center shrink-0">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-[#242424]">Print / Save as PDF</div>
                  <div className="text-xs text-[#605E5C] mt-1">
                    Opens system print dialog with clean page margins to print or save as PDF.
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={onExportHtml}
                className="bg-white border border-[#D2D0CE] hover:border-[#185ABD] hover:shadow-sm rounded p-5 text-left flex items-start gap-4 cursor-pointer transition-all"
              >
                <div className="w-10 h-10 rounded bg-[#107C41] text-white flex items-center justify-center shrink-0">
                  <FileCode2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-[#242424]">Web Page (.html)</div>
                  <div className="text-xs text-[#605E5C] mt-1">
                    Self-contained HTML document preserving headings, tables, and inline styling.
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={onExportTxt}
                className="bg-white border border-[#D2D0CE] hover:border-[#185ABD] hover:shadow-sm rounded p-5 text-left flex items-start gap-4 cursor-pointer transition-all"
              >
                <div className="w-10 h-10 rounded bg-[#605E5C] text-white flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-[#242424]">Plain Text (.txt)</div>
                  <div className="text-xs text-[#605E5C] mt-1">
                    Unformatted plain text extract suitable for scripts and markdown editors.
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}

        {section === 'options' && (
          <div className="max-w-2xl space-y-6">
            <div>
              <h1 className="text-2xl font-semibold text-[#242424]">Word Options</h1>
              <p className="text-xs text-[#605E5C] mt-1">
                Configure automatic local storage saving, author identity, and workspace display preferences.
              </p>
            </div>

            {/* Save & Auto-Save Section */}
            <div className="bg-white border border-[#E1DFDD] rounded p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-[#EDEBE9] pb-3">
                <div className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-[#185ABD]" />
                  <h2 className="text-sm font-semibold text-[#242424]">Save &amp; Browser Storage</h2>
                </div>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-semibold border ${
                    autoSaveEnabled
                      ? 'bg-[#ECFDF3] text-[#107C41] border-[#BBF7D0]'
                      : 'bg-[#FFFBEB] text-[#92400E] border-[#FDE68A]'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      autoSaveEnabled ? 'bg-[#107C41]' : 'bg-[#D97706]'
                    }`}
                  />
                  <span>{autoSaveEnabled ? 'Auto-Save Active' : 'Auto-Save Off'}</span>
                </span>
              </div>

              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <label
                    htmlFor="options-autosave-toggle"
                    className="text-xs font-semibold text-[#242424] cursor-pointer block"
                  >
                    Automatically save documents to local storage
                  </label>
                  <p className="text-xs text-[#605E5C] leading-relaxed">
                    When enabled, edits to your document content, header, and footer are saved automatically to browser local storage after a short pause. Turn this off if you prefer manual saving or ephemeral editing.
                  </p>
                </div>

                <button
                  id="options-autosave-toggle"
                  type="button"
                  role="switch"
                  aria-checked={autoSaveEnabled}
                  onClick={() => onToggleAutoSave(!autoSaveEnabled)}
                  className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#185ABD]/40 ${
                    autoSaveEnabled ? 'bg-[#185ABD]' : 'bg-[#C8C6C4]'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                      autoSaveEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="pt-3 border-t border-[#EDEBE9] flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-[#605E5C]">
                  Current status:{' '}
                  <span className="font-semibold text-[#242424]">{lastSavedText}</span>
                </div>
                <button
                  type="button"
                  onClick={onManualSaveLocal}
                  className="px-3 py-1.5 rounded border border-[#C8C6C4] bg-white hover:bg-[#F3F2F1] text-xs font-medium text-[#242424] flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Save className="w-3.5 h-3.5 text-[#185ABD]" />
                  <span>Save Snapshot Now</span>
                </button>
              </div>
            </div>

            {/* General & Display Preferences */}
            <div className="bg-white border border-[#E1DFDD] rounded p-5 space-y-4">
              <h2 className="text-sm font-semibold text-[#242424] border-b border-[#EDEBE9] pb-2">
                General &amp; Display
              </h2>

              <div>
                <label className="block text-[11px] font-semibold text-[#605E5C] mb-1">
                  User / Author Name
                </label>
                <input
                  type="text"
                  value={authorName}
                  onChange={(e) => onAuthorChange(e.target.value)}
                  placeholder="Word User"
                  className="w-full max-w-xs h-8 px-3 text-xs border border-[#C8C6C4] rounded focus:border-[#185ABD] outline-none"
                />
              </div>

              <div className="space-y-2.5 pt-1">
                <label className="flex items-center gap-2.5 text-xs text-[#242424] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={activeDoc.settings.showRuler}
                    onChange={(e) => onUpdateSettings({ showRuler: e.target.checked })}
                    className="accent-[#185ABD]"
                  />
                  <span>Show horizontal and vertical page rulers in Print Layout</span>
                </label>

                <label className="flex items-center gap-2.5 text-xs text-[#242424] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={activeDoc.settings.showMarginGuides}
                    onChange={(e) => onUpdateSettings({ showMarginGuides: e.target.checked })}
                    className="accent-[#185ABD]"
                  />
                  <span>Show subtle margin crop marks on page corners</span>
                </label>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
