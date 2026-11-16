import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, Check, X } from 'lucide-react';
import { CommentsPane } from './components/CommentsPane';
import { ContextMenu } from './components/ContextMenu';
import {
  CitationDialog,
  DrawPadDialog,
  LinkDialog,
  MailMergeDialog,
  ProofingDialog,
  SplitCellsDialog,
  WatermarkDialog,
  WordCountDialog,
} from './components/Dialogs';
import { EditorCanvas, SearchHighlightRect } from './components/EditorCanvas';
import { BackstageSection, FileBackstage } from './components/FileBackstage';
import { NavigationPane } from './components/NavigationPane';
import { ActiveFormattingState, Ribbon } from './components/Ribbon';
import { HorizontalRuler, VerticalRuler } from './components/Rulers';
import { StatusBar } from './components/StatusBar';
import { QuickCommandItem, TitleBar } from './components/TitleBar';
import {
  INITIAL_STARTER_HTML,
  mergeTemplateSettings,
  WORD_TEMPLATES,
  WordTemplate,
} from './data/templates';
import {
  DEFAULT_DOCUMENT_SETTINGS,
  DocumentComment,
  DocumentRecord,
  DocumentSettings,
  DocumentStats,
  HeadingOutlineItem,
  MARGIN_INCHES,
  PAGE_DIMENSIONS_INCHES,
  RibbonTab,
  ViewMode,
} from './types/word';
import {
  exportHtmlToDocx,
  exportHtmlToHtmlFile,
  exportHtmlToTextFile,
  importFileToHtml,
} from './utils/docxEngine';
import {
  applySearchHighlights,
  buildTableHtml,
  buildTableOfContentsHtml,
  computeDocumentStats,
  computePaginationMetrics,
  extractHeadingOutline,
  findSearchMatchRanges,
  runQuickProofingCheck,
  SpellingIssue,
} from './utils/editorHelpers';
import {
  getSelectedTableCells,
  mergeTableCells,
  splitTableCells,
  unmergeCell,
} from './utils/tableHelpers';

const STORAGE_RECENT_KEY = 'word_online_recent_docs_v1';
const STORAGE_ACTIVE_ID_KEY = 'word_online_active_id_v1';
const STORAGE_AUTOSAVE_KEY = 'word_online_autosave_enabled_v1';

function loadAutoSavePreference(): boolean {
  try {
    const val = localStorage.getItem(STORAGE_AUTOSAVE_KEY);
    if (val === 'false') return false;
  } catch {
    // Ignore storage access errors
  }
  return true;
}

function createInitialDocument(): DocumentRecord {
  return {
    id: `doc-${Date.now()}`,
    title: 'Document1',
    contentHtml: INITIAL_STARTER_HTML,
    headerText: '',
    footerText: '',
    updatedAt: new Date().toISOString(),
    settings: { ...DEFAULT_DOCUMENT_SETTINGS },
    comments: [],
  };
}

function loadStoredDocuments(): { active: DocumentRecord; recent: DocumentRecord[] } {
  try {
    const raw = localStorage.getItem(STORAGE_RECENT_KEY);
    const activeId = localStorage.getItem(STORAGE_ACTIVE_ID_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DocumentRecord[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        const found = parsed.find((d) => d.id === activeId) ?? parsed[0];
        return {
          active: {
            ...found,
            settings: { ...DEFAULT_DOCUMENT_SETTINGS, ...(found.settings || {}) },
            comments: Array.isArray(found.comments) ? found.comments : [],
          },
          recent: parsed,
        };
      }
    }
  } catch {
    // Fallback to initial doc
  }
  const initial = createInitialDocument();
  return { active: initial, recent: [initial] };
}

export default function App() {
  const initialStore = useMemo(() => loadStoredDocuments(), []);
  const initialAutoSave = useMemo(() => loadAutoSavePreference(), []);
  const [activeDoc, setActiveDoc] = useState<DocumentRecord>(initialStore.active);
  const [recentDocs, setRecentDocs] = useState<DocumentRecord[]>(initialStore.recent);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState<boolean>(initialAutoSave);

  const [activeTab, setActiveTab] = useState<RibbonTab>('Home');
  const [ribbonCollapsed, setRibbonCollapsed] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('print');
  const [zoom, setZoom] = useState(100);
  const [authorName, setAuthorName] = useState('Word User');
  const [lastSavedText, setLastSavedText] = useState(
    initialAutoSave ? 'Saved locally' : 'Auto-save paused'
  );

  // Backstage & side panes
  const [backstageOpen, setBackstageOpen] = useState(false);
  const [backstageSection, setBackstageSection] = useState<BackstageSection>('home');
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [navSubTab, setNavSubTab] = useState<'outline' | 'find' | 'replace'>('outline');

  // Modals
  const [modal, setModal] = useState<
    | null
    | 'wordCount'
    | 'link'
    | 'drawPad'
    | 'watermark'
    | 'citation'
    | 'mailMerge'
    | 'proofing'
    | 'splitCells'
  >(null);
  const [proofingIssues, setProofingIssues] = useState<SpellingIssue[]>([]);
  const [splitTarget, setSplitTarget] = useState<{
    table: HTMLTableElement;
    cells: HTMLTableCellElement[];
    initialCols: number;
    initialRows: number;
  } | null>(null);

  // Context Menu
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    selectedText: string;
    insideTable: boolean;
    targetCell: HTMLTableCellElement | null;
    selectedTableRows: HTMLTableRowElement[];
    selectedTableCells: HTMLTableCellElement[];
    activeColumnLabel: string;
  } | null>(null);

  // Find & Replace
  const [findQuery, setFindQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [findCaseSensitive, setFindCaseSensitive] = useState(false);
  const [activeMatchIndex, setActiveMatchIndex] = useState(0);
  const [findMatchCount, setFindMatchCount] = useState(0);
  const [fallbackHighlightRects, setFallbackHighlightRects] = useState<SearchHighlightRect[]>([]);

  // Stats, Outline & Formatting State
  const [stats, setStats] = useState<DocumentStats>({
    words: 0,
    charactersWithSpaces: 0,
    charactersNoSpaces: 0,
    paragraphs: 1,
    lines: 1,
    pages: 1,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [headings, setHeadings] = useState<HeadingOutlineItem[]>([]);
  const [formatting, setFormatting] = useState<ActiveFormattingState>({
    bold: false,
    italic: false,
    underline: false,
    strikeThrough: false,
    subscript: false,
    superscript: false,
    align: 'left',
    orderedList: false,
    unorderedList: false,
    fontName: 'Calibri, "Plus Jakarta Sans", sans-serif',
    fontSizePt: '11',
    blockTag: 'p',
  });

  // Undo / Redo Snapshot History
  const [undoStack, setUndoStack] = useState<string[]>([initialStore.active.contentHtml]);
  const [redoStack, setRedoStack] = useState<string[]>([]);

  // Format Painter & Read Aloud
  const [formatPainterStyle, setFormatPainterStyle] = useState<{
    fontWeight: string;
    fontStyle: string;
    textDecoration: string;
    color: string;
    backgroundColor: string;
  } | null>(null);
  const [isReadingAloud, setIsReadingAloud] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [saveToastVisible, setSaveToastVisible] = useState(false);

  const editorRef = useRef<HTMLDivElement | null>(null);
  const savedRangeRef = useRef<Range | null>(null);
  const hiddenOpenFileRef = useRef<HTMLInputElement | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const saveToastTimerRef = useRef<number | null>(null);
  const lastSavedContentRef = useRef<{
    id: string;
    contentHtml: string;
    headerText: string;
    footerText: string;
  }>({
    id: initialStore.active.id,
    contentHtml: initialStore.active.contentHtml,
    headerText: initialStore.active.headerText,
    footerText: initialStore.active.footerText,
  });

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(null), 3200);
  }, []);

  const showSaveToast = useCallback(() => {
    setSaveToastVisible(true);
    if (saveToastTimerRef.current) window.clearTimeout(saveToastTimerRef.current);
    saveToastTimerRef.current = window.setTimeout(() => setSaveToastVisible(false), 2400);
  }, []);

  // Sync browser tab title like MS Word
  useEffect(() => {
    document.title = `${activeDoc.title} - Word`;
  }, [activeDoc.title]);

  const getPrintablePageHeightPx = useCallback(() => {
    const dim = PAGE_DIMENSIONS_INCHES[activeDoc.settings.pageSize];
    const heightIn = activeDoc.settings.orientation === 'landscape' ? dim.width : dim.height;
    const margins = MARGIN_INCHES[activeDoc.settings.margins];
    return Math.max(300, (heightIn - margins.top - margins.bottom) * 96);
  }, [activeDoc.settings.margins, activeDoc.settings.orientation, activeDoc.settings.pageSize]);

  // Hydrate contentEditable only when switching documents
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = activeDoc.contentHtml || '<p><br /></p>';
    }
    const printableH = getPrintablePageHeightPx();
    const estStats = computeDocumentStats(editorRef.current, printableH);
    setStats(estStats);
    setCurrentPage(1);
    setHeadings(extractHeadingOutline(editorRef.current));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDoc.id]);

  // Recalculate page metrics when page size, margins, or orientation change
  useEffect(() => {
    const printableH = getPrintablePageHeightPx();
    const { currentPage: nextPage, totalPages } = computePaginationMetrics(
      editorRef.current,
      printableH,
      savedRangeRef.current
    );
    setCurrentPage(nextPage);
    setStats((prev) => (prev.pages === totalPages ? prev : { ...prev, pages: totalPages }));
  }, [getPrintablePageHeightPx]);

  const persistDocumentToLocalStorage = useCallback(
    (doc: DocumentRecord, notifyToast: boolean) => {
      try {
        setRecentDocs((prev) => {
          const filtered = prev.filter((d) => d.id !== doc.id);
          const updated = [doc, ...filtered].slice(0, 12);
          localStorage.setItem(STORAGE_RECENT_KEY, JSON.stringify(updated));
          localStorage.setItem(STORAGE_ACTIVE_ID_KEY, doc.id);
          return updated;
        });
        setLastSavedText('Saved locally');
        lastSavedContentRef.current = {
          id: doc.id,
          contentHtml: doc.contentHtml,
          headerText: doc.headerText,
          footerText: doc.footerText,
        };
        if (notifyToast) {
          showSaveToast();
        }
      } catch {
        // Ignore storage quota issues
      }
    },
    [showSaveToast]
  );

  const handleToggleAutoSave = useCallback(
    (enabled: boolean) => {
      setAutoSaveEnabled(enabled);
      try {
        localStorage.setItem(STORAGE_AUTOSAVE_KEY, String(enabled));
      } catch {
        // Ignore storage access issues
      }
      if (enabled) {
        persistDocumentToLocalStorage(activeDoc, false);
        showToast('Auto-save to local storage enabled');
      } else {
        setLastSavedText('Auto-save paused');
        showToast('Auto-save to local storage disabled');
      }
    },
    [activeDoc, persistDocumentToLocalStorage, showToast]
  );

  const handleManualSaveLocal = useCallback(() => {
    persistDocumentToLocalStorage(activeDoc, true);
  }, [activeDoc, persistDocumentToLocalStorage]);

  // Persist active & recent docs to localStorage when auto-save is enabled
  useEffect(() => {
    const contentChanged =
      lastSavedContentRef.current.id === activeDoc.id &&
      (lastSavedContentRef.current.contentHtml !== activeDoc.contentHtml ||
        lastSavedContentRef.current.headerText !== activeDoc.headerText ||
        lastSavedContentRef.current.footerText !== activeDoc.footerText);

    if (!autoSaveEnabled) {
      if (contentChanged) {
        setLastSavedText('Unsaved changes');
      }
      return;
    }

    const timer = window.setTimeout(() => {
      persistDocumentToLocalStorage(activeDoc, contentChanged);
    }, 800);
    return () => window.clearTimeout(timer);
  }, [activeDoc, autoSaveEnabled, persistDocumentToLocalStorage]);

  const refreshEditorDerivedState = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    const html = el.innerHTML;
    const printableH = getPrintablePageHeightPx();
    const sel = window.getSelection();
    const range = sel && sel.rangeCount > 0 ? sel.getRangeAt(0) : savedRangeRef.current;
    const pagination = computePaginationMetrics(el, printableH, range);

    setStats(computeDocumentStats(el, printableH));
    setCurrentPage(pagination.currentPage);
    setHeadings(extractHeadingOutline(el));
    setLastSavedText(autoSaveEnabled ? 'Saving...' : 'Unsaved changes');

    setActiveDoc((prev) => ({
      ...prev,
      contentHtml: html,
      updatedAt: new Date().toISOString(),
    }));

    setUndoStack((prev) => {
      if (prev[prev.length - 1] === html) return prev;
      return [...prev.slice(-49), html];
    });
    setRedoStack([]);
  }, [autoSaveEnabled, getPrintablePageHeightPx]);

  const saveSelection = useCallback(() => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && editorRef.current?.contains(sel.anchorNode)) {
      savedRangeRef.current = sel.getRangeAt(0).cloneRange();
    }
  }, []);

  const restoreSelection = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    el.focus();
    const sel = window.getSelection();
    if (sel && savedRangeRef.current) {
      sel.removeAllRanges();
      sel.addRange(savedRangeRef.current);
    }
  }, []);

  const updateFormattingState = useCallback(() => {
    saveSelection();
    const selObj = window.getSelection();
    const activeRange =
      selObj && selObj.rangeCount > 0 ? selObj.getRangeAt(0) : savedRangeRef.current;
    const { currentPage: nextPage, totalPages } = computePaginationMetrics(
      editorRef.current,
      getPrintablePageHeightPx(),
      activeRange
    );
    setCurrentPage(nextPage);
    setStats((prev) => (prev.pages === totalPages ? prev : { ...prev, pages: totalPages }));
    try {
      const bold = document.queryCommandState('bold');
      const italic = document.queryCommandState('italic');
      const underline = document.queryCommandState('underline');
      const strikeThrough = document.queryCommandState('strikeThrough');
      const subscript = document.queryCommandState('subscript');
      const superscript = document.queryCommandState('superscript');
      const orderedList = document.queryCommandState('insertOrderedList');
      const unorderedList = document.queryCommandState('insertUnorderedList');

      let align: ActiveFormattingState['align'] = 'left';
      if (document.queryCommandState('justifyCenter')) align = 'center';
      else if (document.queryCommandState('justifyRight')) align = 'right';
      else if (document.queryCommandState('justifyFull')) align = 'justify';

      let blockTag = 'p';
      const sel = window.getSelection();
      if (sel && sel.anchorNode) {
        let node: Node | null = sel.anchorNode;
        while (node && node !== editorRef.current) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const tag = (node as HTMLElement).tagName.toLowerCase();
            if (['h1', 'h2', 'h3', 'h4', 'p', 'blockquote', 'div'].includes(tag)) {
              blockTag = tag === 'h4' ? 'title' : tag;
              break;
            }
          }
          node = node.parentNode;
        }
      }

      setFormatting((prev) => ({
        ...prev,
        bold,
        italic,
        underline,
        strikeThrough,
        subscript,
        superscript,
        align,
        orderedList,
        unorderedList,
        blockTag,
      }));
    } catch {
      // Ignore queryCommandState errors when unfocused
    }
  }, [saveSelection]);

  // Apply Format Painter when mouse releases inside editor
  const handleEditorMouseUp = useCallback(() => {
    if (formatPainterStyle) {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
        const range = sel.getRangeAt(0);
        const span = document.createElement('span');
        span.style.fontWeight = formatPainterStyle.fontWeight;
        span.style.fontStyle = formatPainterStyle.fontStyle;
        span.style.textDecoration = formatPainterStyle.textDecoration;
        span.style.color = formatPainterStyle.color;
        if (
          formatPainterStyle.backgroundColor &&
          formatPainterStyle.backgroundColor !== 'rgba(0, 0, 0, 0)'
        ) {
          span.style.backgroundColor = formatPainterStyle.backgroundColor;
        }
        try {
          range.surroundContents(span);
        } catch {
          const frag = range.extractContents();
          span.appendChild(frag);
          range.insertNode(span);
        }
        refreshEditorDerivedState();
      }
      setFormatPainterStyle(null);
    }
    updateFormattingState();
  }, [formatPainterStyle, refreshEditorDerivedState, updateFormattingState]);

  const toggleFormatPainter = useCallback(() => {
    if (formatPainterStyle) {
      setFormatPainterStyle(null);
      return;
    }
    const sel = window.getSelection();
    const anchorEl =
      sel?.anchorNode?.nodeType === Node.TEXT_NODE
        ? sel.anchorNode.parentElement
        : (sel?.anchorNode as HTMLElement | null);
    if (anchorEl && editorRef.current?.contains(anchorEl)) {
      const cs = window.getComputedStyle(anchorEl);
      setFormatPainterStyle({
        fontWeight: cs.fontWeight,
        fontStyle: cs.fontStyle,
        textDecoration: cs.textDecorationLine,
        color: cs.color,
        backgroundColor: cs.backgroundColor,
      });
      showToast('Format Painter active — select text to apply formatting');
    } else {
      showToast('Place cursor inside formatted text first');
    }
  }, [formatPainterStyle, showToast]);

  const execEditorCommand = useCallback(
    (cmd: string, value?: string) => {
      restoreSelection();
      document.execCommand('styleWithCSS', false, 'true');
      document.execCommand(cmd, false, value);
      refreshEditorDerivedState();
      updateFormattingState();
    },
    [refreshEditorDerivedState, restoreSelection, updateFormattingState]
  );

  const insertHtmlAtCursor = useCallback(
    (html: string) => {
      restoreSelection();
      document.execCommand('insertHTML', false, html);
      refreshEditorDerivedState();
      updateFormattingState();
    },
    [refreshEditorDerivedState, restoreSelection, updateFormattingState]
  );

  const applyFontFamily = useCallback(
    (font: string) => {
      setFormatting((prev) => ({ ...prev, fontName: font }));
      restoreSelection();
      document.execCommand('styleWithCSS', false, 'true');
      document.execCommand('fontName', false, font);
      refreshEditorDerivedState();
    },
    [refreshEditorDerivedState, restoreSelection]
  );

  const applyFontSizePt = useCallback(
    (ptStr: string) => {
      setFormatting((prev) => ({ ...prev, fontSizePt: ptStr }));
      restoreSelection();
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
        const range = sel.getRangeAt(0);
        const span = document.createElement('span');
        span.style.fontSize = `${ptStr}pt`;
        try {
          range.surroundContents(span);
        } catch {
          const frag = range.extractContents();
          span.appendChild(frag);
          range.insertNode(span);
        }
      } else if (editorRef.current) {
        document.execCommand('fontSize', false, '4');
        const fonts = editorRef.current.querySelectorAll('font[size="4"]');
        fonts.forEach((f) => {
          const span = document.createElement('span');
          span.style.fontSize = `${ptStr}pt`;
          span.innerHTML = f.innerHTML;
          f.replaceWith(span);
        });
      }
      refreshEditorDerivedState();
    },
    [refreshEditorDerivedState, restoreSelection]
  );

  const stepFontSize = useCallback(
    (delta: number) => {
      const sizes = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 36, 48, 72];
      const current = Number(formatting.fontSizePt) || 11;
      let idx = sizes.findIndex((s) => s >= current);
      if (idx === -1) idx = 3;
      const nextIdx = Math.max(0, Math.min(sizes.length - 1, idx + delta));
      applyFontSizePt(String(sizes[nextIdx]));
    },
    [applyFontSizePt, formatting.fontSizePt]
  );

  const handleChangeCase = useCallback(
    (mode: 'upper' | 'lower' | 'title') => {
      restoreSelection();
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed) return;
      const text = sel.toString();
      const converted =
        mode === 'upper'
          ? text.toUpperCase()
          : mode === 'lower'
            ? text.toLowerCase()
            : text.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
      document.execCommand('insertText', false, converted);
      refreshEditorDerivedState();
    },
    [refreshEditorDerivedState, restoreSelection]
  );

  const handleApplyStyle = useCallback(
    (style: 'p' | 'h1' | 'h2' | 'h3' | 'title' | 'subtitle' | 'blockquote') => {
      restoreSelection();
      if (style === 'title') {
        document.execCommand('formatBlock', false, 'h4');
        const sel = window.getSelection();
        const block = sel?.anchorNode?.parentElement?.closest('h4');
        if (block) block.classList.add('word-title');
      } else if (style === 'subtitle') {
        document.execCommand('formatBlock', false, 'p');
        const sel = window.getSelection();
        const block = sel?.anchorNode?.parentElement?.closest('p');
        if (block) block.classList.add('word-subtitle');
      } else {
        document.execCommand('formatBlock', false, style);
      }
      refreshEditorDerivedState();
      updateFormattingState();
    },
    [refreshEditorDerivedState, restoreSelection, updateFormattingState]
  );

  const handleUndo = useCallback(() => {
    if (undoStack.length <= 1) return;
    const current = undoStack[undoStack.length - 1];
    const previous = undoStack[undoStack.length - 2];
    setUndoStack((prev) => prev.slice(0, -1));
    setRedoStack((prev) => [...prev, current]);
    if (editorRef.current) {
      editorRef.current.innerHTML = previous;
    }
    setActiveDoc((prev) => ({ ...prev, contentHtml: previous }));
    setHeadings(extractHeadingOutline(editorRef.current));
  }, [undoStack]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.slice(0, -1));
    setUndoStack((prev) => [...prev, next]);
    if (editorRef.current) {
      editorRef.current.innerHTML = next;
    }
    setActiveDoc((prev) => ({ ...prev, contentHtml: next }));
    setHeadings(extractHeadingOutline(editorRef.current));
  }, [redoStack]);

  // Clipboard helpers
  const handleCopy = useCallback(async () => {
    const sel = window.getSelection();
    const text = sel?.toString() || '';
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      showToast('Copied to clipboard');
    } catch {
      document.execCommand('copy');
    }
  }, [showToast]);

  const handleCut = useCallback(async () => {
    const sel = window.getSelection();
    const text = sel?.toString() || '';
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // fallback
    }
    document.execCommand('delete');
    refreshEditorDerivedState();
  }, [refreshEditorDerivedState]);

  const handlePaste = useCallback(
    async (plainOnly = false) => {
      restoreSelection();
      try {
        const text = await navigator.clipboard.readText();
        if (text) {
          if (plainOnly) {
            document.execCommand('insertText', false, text);
          } else {
            document.execCommand('insertText', false, text);
          }
          refreshEditorDerivedState();
          return;
        }
      } catch {
        showToast('Use Ctrl+V / Cmd+V to paste directly into the document');
      }
    },
    [refreshEditorDerivedState, restoreSelection, showToast]
  );

  // File Open & Export
  const handleOpenLocalFile = useCallback(
    async (file: File) => {
      try {
        const imported = await importFileToHtml(file);
        const newDoc: DocumentRecord = {
          id: `doc-${Date.now()}`,
          title: imported.title,
          contentHtml: imported.contentHtml,
          headerText: '',
          footerText: '',
          updatedAt: new Date().toISOString(),
          settings: { ...DEFAULT_DOCUMENT_SETTINGS },
          comments: [],
        };
        setActiveDoc(newDoc);
        setUndoStack([imported.contentHtml]);
        setRedoStack([]);
        setBackstageOpen(false);
        showToast(`Opened "${file.name}"`);
      } catch (err) {
        showToast(
          `Could not open file: ${err instanceof Error ? err.message : 'Unsupported format'}`
        );
      }
    },
    [showToast]
  );

  const handleCreateFromTemplate = useCallback(
    (tpl: WordTemplate) => {
      const newDoc: DocumentRecord = {
        id: `doc-${Date.now()}`,
        title: tpl.id === 'blank' ? `Document${recentDocs.length + 1}` : tpl.name,
        contentHtml: tpl.contentHtml,
        headerText: tpl.headerText,
        footerText: tpl.footerText,
        updatedAt: new Date().toISOString(),
        settings: mergeTemplateSettings(tpl.settings),
        comments: [],
      };
      setActiveDoc(newDoc);
      setUndoStack([tpl.contentHtml]);
      setRedoStack([]);
      setBackstageOpen(false);
      showToast(`Created "${newDoc.title}"`);
    },
    [recentDocs.length, showToast]
  );

  const handleExportDocx = useCallback(async () => {
    try {
      await exportHtmlToDocx(
        activeDoc.title,
        editorRef.current?.innerHTML ?? activeDoc.contentHtml,
        activeDoc.headerText,
        activeDoc.footerText,
        activeDoc.settings
      );
      showToast(`Downloaded "${activeDoc.title}.docx"`);
    } catch {
      showToast('Export failed — check document images and try again');
    }
  }, [activeDoc, showToast]);

  const handleInsertImageFile = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          insertHtmlAtCursor(
            `<img src="${reader.result}" alt="${file.name}" style="max-width:480px;height:auto;" /><p><br /></p>`
          );
        }
      };
      reader.readAsDataURL(file);
    },
    [insertHtmlAtCursor]
  );

  // Table cell contextual actions
  const handleTableAction = useCallback(
    (
      action:
        | 'addRow'
        | 'addCol'
        | 'delRow'
        | 'delCol'
        | 'delTable'
        | 'mergeCells'
        | 'unmergeCells'
        | 'splitCells'
        | 'sortAlphaAsc'
        | 'sortAlphaDesc'
        | 'sortNumAsc'
        | 'sortNumDesc'
    ) => {
      const cell = contextMenu?.targetCell;
      if (!cell) return;
      const row = cell.closest('tr');
      const table = cell.closest('table');
      if (!row || !table) return;

      const cellIndex = Array.from(row.children).indexOf(cell);

      if (action === 'addRow') {
        const newRow = document.createElement('tr');
        for (let i = 0; i < row.children.length; i++) {
          const td = document.createElement('td');
          td.innerHTML = '<br />';
          newRow.appendChild(td);
        }
        row.after(newRow);
      } else if (action === 'addCol') {
        table.querySelectorAll('tr').forEach((tr) => {
          const isHead = tr.parentElement?.tagName.toLowerCase() === 'thead';
          const newCell = document.createElement(isHead ? 'th' : 'td');
          newCell.innerHTML = isHead ? 'Column' : '<br />';
          tr.appendChild(newCell);
        });
      } else if (action === 'delRow') {
        if (table.querySelectorAll('tr').length <= 1) table.remove();
        else row.remove();
      } else if (action === 'delCol') {
        table.querySelectorAll('tr').forEach((tr) => {
          if (tr.children[cellIndex]) tr.children[cellIndex].remove();
        });
      } else if (action === 'delTable') {
        table.remove();
      } else if (action === 'mergeCells') {
        const cells = contextMenu.selectedTableCells;
        if (mergeTableCells(table, cells)) {
          showToast(`Merged ${cells.length} cells`);
        } else {
          showToast('Select 2 or more adjacent cells in the same table section to merge');
        }
      } else if (action === 'unmergeCells') {
        const merged = contextMenu.selectedTableCells.filter(
          (c) => (c.colSpan || 1) > 1 || (c.rowSpan || 1) > 1
        );
        let unmergedCount = 0;
        merged.forEach((c) => {
          if (unmergeCell(table, c)) unmergedCount++;
        });
        if (unmergedCount > 0) {
          showToast(`Unmerged ${unmergedCount} cell${unmergedCount === 1 ? '' : 's'}`);
        }
      } else if (action === 'splitCells') {
        const cells =
          contextMenu.selectedTableCells.length > 0
            ? contextMenu.selectedTableCells
            : [cell];
        const primary = cells[0];
        setSplitTarget({
          table,
          cells,
          initialCols: primary.colSpan > 1 ? primary.colSpan : 2,
          initialRows: primary.rowSpan > 1 ? primary.rowSpan : 1,
        });
        setModal('splitCells');
        return;
      } else if (
        action === 'sortAlphaAsc' ||
        action === 'sortAlphaDesc' ||
        action === 'sortNumAsc' ||
        action === 'sortNumDesc'
      ) {
        const selectedRows = contextMenu.selectedTableRows;
        let rowsToSort: HTMLTableRowElement[] = [];

        if (selectedRows.length > 1) {
          rowsToSort = [...selectedRows];
        } else {
          const tbody = table.querySelector('tbody');
          const candidateRows = tbody
            ? Array.from(tbody.querySelectorAll<HTMLTableRowElement>(':scope > tr'))
            : Array.from(table.querySelectorAll<HTMLTableRowElement>('tr'));
          rowsToSort = candidateRows.filter((tr, idx) => {
            if (tr.closest('thead')) return false;
            if (!tbody && idx === 0 && tr.querySelector('th')) return false;
            return true;
          });
        }

        if (rowsToSort.length < 2) {
          showToast('Need at least 2 data rows to sort');
          return;
        }

        const getCellText = (tr: HTMLTableRowElement) =>
          (tr.children[cellIndex]?.textContent ?? '').trim();

        const parseNumeric = (raw: string): number | null => {
          const cleaned = raw.replace(/,/g, '').trim();
          const match = cleaned.match(/-?\d+(?:\.\d+)?/);
          if (!match) return null;
          const num = Number(match[0]);
          return Number.isFinite(num) ? num : null;
        };

        // Record insertion anchors so selected rows stay in their original slots
        const parent = rowsToSort[0].parentElement;
        if (!parent) return;
        const placeholderNodes = rowsToSort.map((r) => {
          const marker = document.createComment('sort-slot');
          r.parentElement?.insertBefore(marker, r);
          return marker;
        });

        const sorted = [...rowsToSort].sort((a, b) => {
          const textA = getCellText(a);
          const textB = getCellText(b);

          if (action === 'sortNumAsc' || action === 'sortNumDesc') {
            const numA = parseNumeric(textA);
            const numB = parseNumeric(textB);
            if (numA === null && numB === null) {
              return textA.localeCompare(textB, undefined, { sensitivity: 'base' });
            }
            if (numA === null) return 1;
            if (numB === null) return -1;
            return action === 'sortNumAsc' ? numA - numB : numB - numA;
          }

          if (!textA && !textB) return 0;
          if (!textA) return 1;
          if (!textB) return -1;
          const cmp = textA.localeCompare(textB, undefined, {
            sensitivity: 'base',
            numeric: false,
          });
          return action === 'sortAlphaAsc' ? cmp : -cmp;
        });

        sorted.forEach((sortedRow, i) => {
          const marker = placeholderNodes[i];
          marker.parentElement?.insertBefore(sortedRow, marker);
          marker.remove();
        });

        const modeLabel =
          action === 'sortAlphaAsc'
            ? 'A → Z'
            : action === 'sortAlphaDesc'
              ? 'Z → A'
              : action === 'sortNumAsc'
                ? '0 → 9'
                : '9 → 0';
        showToast(
          `Sorted ${sorted.length} row${sorted.length === 1 ? '' : 's'} by ${contextMenu.activeColumnLabel} (${modeLabel})`
        );
      }
      refreshEditorDerivedState();
    },
    [contextMenu, refreshEditorDerivedState, showToast]
  );

  // Find & Replace
  const isFindReplaceActive =
    activeDoc.settings.showNavigationPane &&
    viewMode !== 'read' &&
    (navSubTab === 'find' || navSubTab === 'replace') &&
    findQuery.trim().length > 0;

  const scrollRangeIntoView = useCallback((range: Range) => {
    const scrollContainer = editorRef.current?.closest('.print-only-container') as HTMLElement | null;
    const rect = range.getBoundingClientRect();
    if (scrollContainer && rect.height > 0) {
      const containerRect = scrollContainer.getBoundingClientRect();
      const targetTop =
        scrollContainer.scrollTop +
        (rect.top - containerRect.top) -
        containerRect.height / 2 +
        rect.height / 2;
      scrollContainer.scrollTo({
        top: Math.max(0, targetTop),
        behavior: 'smooth',
      });
      return;
    }
    const anchorEl =
      range.startContainer.nodeType === Node.TEXT_NODE
        ? range.startContainer.parentElement
        : (range.startContainer as HTMLElement | null);
    anchorEl?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
  }, []);

  // Reset active match index when query, case sensitivity, or document changes
  useEffect(() => {
    setActiveMatchIndex(0);
  }, [findQuery, findCaseSensitive, activeDoc.id]);

  // Highlight all matching occurrences non-destructively whenever Find & Replace is active
  useEffect(() => {
    const editorEl = editorRef.current;
    if (!isFindReplaceActive || !editorEl) {
      applySearchHighlights([], 0);
      setFindMatchCount(0);
      setFallbackHighlightRects((prev) => (prev.length === 0 ? prev : []));
      return;
    }

    const ranges = findSearchMatchRanges(editorEl, findQuery, findCaseSensitive);
    setFindMatchCount(ranges.length);

    if (ranges.length === 0) {
      applySearchHighlights([], 0);
      setFallbackHighlightRects((prev) => (prev.length === 0 ? prev : []));
      return;
    }

    const clampedIdx = Math.max(0, Math.min(activeMatchIndex, ranges.length - 1));
    if (clampedIdx !== activeMatchIndex) {
      setActiveMatchIndex(clampedIdx);
    }

    const nativeSupported = applySearchHighlights(ranges, clampedIdx);
    if (nativeSupported) {
      setFallbackHighlightRects((prev) => (prev.length === 0 ? prev : []));
    } else {
      const editorRect = editorEl.getBoundingClientRect();
      const scale = zoom / 100 || 1;
      const rects: SearchHighlightRect[] = [];
      ranges.forEach((range, idx) => {
        const clientRects = Array.from(range.getClientRects());
        clientRects.forEach((r) => {
          if (r.width <= 0 || r.height <= 0) return;
          rects.push({
            top: (r.top - editorRect.top) / scale,
            left: (r.left - editorRect.left) / scale,
            width: r.width / scale,
            height: r.height / scale,
            active: idx === clampedIdx,
          });
        });
      });
      setFallbackHighlightRects(rects);
    }
  }, [
    isFindReplaceActive,
    findQuery,
    findCaseSensitive,
    activeDoc.contentHtml,
    activeDoc.id,
    activeMatchIndex,
    zoom,
    activeDoc.settings.columns,
    activeDoc.settings.pageSize,
    activeDoc.settings.margins,
    activeDoc.settings.orientation,
    viewMode,
  ]);

  // Ensure highlights are cleared on unmount
  useEffect(() => {
    return () => {
      applySearchHighlights([], 0);
    };
  }, []);

  const handleFindNext = useCallback(
    (direction: 1 | -1) => {
      if (!findQuery.trim() || !editorRef.current) return;
      const ranges = findSearchMatchRanges(editorRef.current, findQuery, findCaseSensitive);
      if (ranges.length === 0) return;

      const nextIndex = (activeMatchIndex + direction + ranges.length) % ranges.length;
      setActiveMatchIndex(nextIndex);
      scrollRangeIntoView(ranges[nextIndex]);
    },
    [activeMatchIndex, findCaseSensitive, findQuery, scrollRangeIntoView]
  );

  const handleReplaceOne = useCallback(() => {
    if (!findQuery.trim() || !editorRef.current) return;
    const ranges = findSearchMatchRanges(editorRef.current, findQuery, findCaseSensitive);
    if (ranges.length === 0) return;

    const targetIndex = Math.max(0, Math.min(activeMatchIndex, ranges.length - 1));
    const targetRange = ranges[targetIndex];

    targetRange.deleteContents();
    targetRange.insertNode(document.createTextNode(replaceQuery));
    editorRef.current.normalize();

    refreshEditorDerivedState();

    const remainingCount = ranges.length - 1;
    if (remainingCount <= 0) {
      setActiveMatchIndex(0);
    } else {
      const nextIndex = targetIndex >= remainingCount ? 0 : targetIndex;
      setActiveMatchIndex(nextIndex);
      const nextRanges = findSearchMatchRanges(editorRef.current, findQuery, findCaseSensitive);
      if (nextRanges[nextIndex]) {
        scrollRangeIntoView(nextRanges[nextIndex]);
      }
    }
  }, [
    activeMatchIndex,
    findCaseSensitive,
    findQuery,
    refreshEditorDerivedState,
    replaceQuery,
    scrollRangeIntoView,
  ]);

  const handleReplaceAll = useCallback(() => {
    if (!findQuery.trim() || !editorRef.current) return;
    const escaped = findQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, findCaseSensitive ? 'g' : 'gi');
    const walker = document.createTreeWalker(editorRef.current, NodeFilter.SHOW_TEXT);
    const nodes: Text[] = [];
    let current = walker.nextNode();
    while (current) {
      nodes.push(current as Text);
      current = walker.nextNode();
    }
    let replaced = 0;
    nodes.forEach((node) => {
      if (node.nodeValue && regex.test(node.nodeValue)) {
        regex.lastIndex = 0;
        node.nodeValue = node.nodeValue.replace(regex, () => {
          replaced++;
          return replaceQuery;
        });
      }
    });
    editorRef.current.normalize();
    setActiveMatchIndex(0);
    refreshEditorDerivedState();
    showToast(`Replaced ${replaced} occurrence${replaced === 1 ? '' : 's'}`);
  }, [findCaseSensitive, findQuery, refreshEditorDerivedState, replaceQuery, showToast]);

  // Read Aloud
  const handleToggleReadAloud = useCallback(
    (customText?: string) => {
      if (!('speechSynthesis' in window)) {
        showToast('Speech synthesis is not supported in this browser');
        return;
      }
      if (isReadingAloud && !customText) {
        window.speechSynthesis.cancel();
        setIsReadingAloud(false);
        return;
      }
      window.speechSynthesis.cancel();
      const text =
        customText?.trim() ||
        window.getSelection()?.toString().trim() ||
        editorRef.current?.innerText?.trim() ||
        '';
      if (!text) {
        showToast('Nothing to read aloud');
        return;
      }
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = () => setIsReadingAloud(false);
      utterance.onerror = () => setIsReadingAloud(false);
      setIsReadingAloud(true);
      window.speechSynthesis.speak(utterance);
    },
    [isReadingAloud, showToast]
  );

  // Comments
  const handleAddComment = useCallback(
    (text?: string) => {
      const quote = window.getSelection()?.toString().trim() || '';
      if (!text) {
        setCommentsOpen(true);
        return;
      }
      const newComment: DocumentComment = {
        id: `cmt-${Date.now()}`,
        author: authorName,
        text,
        quote,
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        resolved: false,
      };
      setActiveDoc((prev) => ({
        ...prev,
        comments: [newComment, ...prev.comments],
      }));
      setCommentsOpen(true);
    },
    [authorName]
  );

  const updateSettings = useCallback((patch: Partial<DocumentSettings>) => {
    setActiveDoc((prev) => ({
      ...prev,
      settings: { ...prev.settings, ...patch },
    }));
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (!mod) return;
      const key = e.key.toLowerCase();
      if (key === 's') {
        e.preventDefault();
        handleExportDocx();
      } else if (key === 'o') {
        e.preventDefault();
        hiddenOpenFileRef.current?.click();
      } else if (key === 'f') {
        e.preventDefault();
        updateSettings({ showNavigationPane: true });
        setNavSubTab('find');
      } else if (key === 'h') {
        e.preventDefault();
        updateSettings({ showNavigationPane: true });
        setNavSubTab('replace');
      } else if (key === 'p') {
        e.preventDefault();
        window.print();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleExportDocx, updateSettings]);

  const pageWidthInches = useMemo(() => {
    const dim = PAGE_DIMENSIONS_INCHES[activeDoc.settings.pageSize];
    return activeDoc.settings.orientation === 'landscape' ? dim.height : dim.width;
  }, [activeDoc.settings.orientation, activeDoc.settings.pageSize]);

  const pageHeightInches = useMemo(() => {
    const dim = PAGE_DIMENSIONS_INCHES[activeDoc.settings.pageSize];
    return activeDoc.settings.orientation === 'landscape' ? dim.width : dim.height;
  }, [activeDoc.settings.orientation, activeDoc.settings.pageSize]);

  const quickCommands: QuickCommandItem[] = useMemo(
    () => [
      {
        id: 'save-docx',
        label: 'Download as Word (.docx)',
        category: 'File',
        shortcut: 'Ctrl+S',
        action: handleExportDocx,
      },
      {
        id: 'open-file',
        label: 'Open .docx / .html / .txt File',
        category: 'File',
        shortcut: 'Ctrl+O',
        action: () => hiddenOpenFileRef.current?.click(),
      },
      {
        id: 'templates',
        label: 'Browse Document Templates',
        category: 'File',
        action: () => {
          setBackstageSection('new');
          setBackstageOpen(true);
        },
      },
      {
        id: 'insert-table',
        label: 'Insert 3 × 3 Table',
        category: 'Insert',
        action: () => insertHtmlAtCursor(buildTableHtml(3, 3)),
      },
      {
        id: 'insert-page-number',
        label: 'Insert Page Number in Footer',
        category: 'Insert',
        action: () => {
          setActiveDoc((prev) => {
            const existing = prev.footerText.trim();
            const token = 'Page {PAGE} of {NUMPAGES}';
            const nextFooter = existing
              ? /\{PAGE\}|\{NUMPAGES\}/.test(existing)
                ? existing
                : `${existing} · ${token}`
              : token;
            return {
              ...prev,
              footerText: nextFooter,
              settings: { ...prev.settings, showHeaderFooter: true },
            };
          });
          showToast('Inserted automatic page number in footer');
        },
      },
      {
        id: 'word-count',
        label: 'Word Count & Statistics',
        category: 'Review',
        action: () => setModal('wordCount'),
      },
      {
        id: 'find-replace',
        label: 'Find & Replace',
        category: 'Editing',
        shortcut: 'Ctrl+H',
        action: () => {
          updateSettings({ showNavigationPane: true });
          setNavSubTab('replace');
        },
      },
      {
        id: 'read-aloud',
        label: isReadingAloud ? 'Stop Reading Aloud' : 'Read Document Aloud',
        category: 'Review',
        action: () => handleToggleReadAloud(),
      },
      {
        id: 'print',
        label: 'Print / Save as PDF',
        category: 'File',
        shortcut: 'Ctrl+P',
        action: () => window.print(),
      },
      {
        id: 'toggle-ruler',
        label: 'Toggle Ruler',
        category: 'View',
        action: () => updateSettings({ showRuler: !activeDoc.settings.showRuler }),
      },
      {
        id: 'draw-pad',
        label: 'Open Signature & Sketch Pad',
        category: 'Draw',
        action: () => setModal('drawPad'),
      },
      {
        id: 'word-options',
        label: 'Word Options (Auto-Save & Preferences)',
        category: 'File',
        action: () => {
          setBackstageSection('options');
          setBackstageOpen(true);
        },
      },
    ],
    [
      activeDoc.settings.showRuler,
      handleExportDocx,
      handleToggleReadAloud,
      insertHtmlAtCursor,
      isReadingAloud,
      showToast,
      updateSettings,
    ]
  );

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-[#E8E6E4] text-[#242424]">
      {/* Hidden input for quick Open (.docx/.html/.txt/.md) */}
      <input
        ref={hiddenOpenFileRef}
        type="file"
        accept=".docx,.html,.htm,.txt,.md"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) {
            handleOpenLocalFile(f);
            e.target.value = '';
          }
        }}
      />

      {/* Top Blue MS Word Program Frame */}
      {viewMode !== 'read' && (
        <TitleBar
          title={activeDoc.title}
          onTitleChange={(newTitle) => setActiveDoc((prev) => ({ ...prev, title: newTitle }))}
          authorName={authorName}
          onAuthorChange={setAuthorName}
          canUndo={undoStack.length > 1}
          canRedo={redoStack.length > 0}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onSaveDocx={handleExportDocx}
          onNewDoc={() => handleCreateFromTemplate(WORD_TEMPLATES[0])}
          onOpenFile={() => hiddenOpenFileRef.current?.click()}
          onPrint={() => window.print()}
          ribbonCollapsed={ribbonCollapsed}
          onToggleRibbon={() => setRibbonCollapsed((c) => !c)}
          commands={quickCommands}
          lastSavedText={lastSavedText}
          autoSaveEnabled={autoSaveEnabled}
          onOpenOptions={() => {
            setBackstageSection('options');
            setBackstageOpen(true);
          }}
        />
      )}

      {/* Read Mode Exit Bar */}
      {viewMode === 'read' && (
        <div className="no-print h-10 bg-[#185ABD] text-white px-4 flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-2 font-medium">
            <BookOpen className="w-4 h-4" />
            <span>Read Mode — {activeDoc.title}</span>
          </div>
          <button
            type="button"
            onClick={() => setViewMode('print')}
            className="px-3 py-1 rounded bg-white text-[#185ABD] font-semibold hover:bg-[#F3F2F1] flex items-center gap-1 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>Exit Read Mode</span>
          </button>
        </div>
      )}

      {/* Menu Tabs & Fluent Ribbon */}
      {viewMode !== 'read' && (
        <Ribbon
          activeTab={activeTab}
          onSelectTab={(tab) => {
            setActiveTab(tab);
            if (ribbonCollapsed) setRibbonCollapsed(false);
          }}
          onOpenFileBackstage={() => {
            setBackstageSection('home');
            setBackstageOpen(true);
          }}
          collapsed={ribbonCollapsed}
          formatting={formatting}
          settings={activeDoc.settings}
          viewMode={viewMode}
          zoom={zoom}
          commentsCount={activeDoc.comments.length}
          commentsOpen={commentsOpen}
          onToggleCommentsPane={() => setCommentsOpen((o) => !o)}
          isReadingAloud={isReadingAloud}
          formatPainterActive={Boolean(formatPainterStyle)}
          onToggleFormatPainter={toggleFormatPainter}
          onExecCommand={execEditorCommand}
          onApplyFontFamily={applyFontFamily}
          onApplyFontSize={applyFontSizePt}
          onStepFontSize={stepFontSize}
          onChangeCase={handleChangeCase}
          onClearFormatting={() => execEditorCommand('removeFormat')}
          onApplyStyle={handleApplyStyle}
          onPaste={() => handlePaste(false)}
          onCut={handleCut}
          onCopy={handleCopy}
          onSelectAll={() => {
            editorRef.current?.focus();
            document.execCommand('selectAll');
          }}
          onOpenFindReplace={(sub) => {
            updateSettings({ showNavigationPane: true });
            setNavSubTab(sub);
          }}
          onInsertPageBreak={() =>
            insertHtmlAtCursor('<div class="word-page-break" contenteditable="false"></div><p><br /></p>')
          }
          onInsertBlankPage={() =>
            insertHtmlAtCursor(
              '<div class="word-page-break" contenteditable="false"></div><p><br /></p><div class="word-page-break" contenteditable="false"></div><p><br /></p>'
            )
          }
          onInsertTable={(r, c) => insertHtmlAtCursor(buildTableHtml(r, c))}
          onInsertImageFile={handleInsertImageFile}
          onInsertHorizontalRule={() => insertHtmlAtCursor('<hr /><p><br /></p>')}
          onInsertCallout={() =>
            insertHtmlAtCursor(
              '<div class="word-callout"><strong>Note:</strong> Type key highlights or summary details here.</div><p><br /></p>'
            )
          }
          onOpenLinkDialog={() => {
            saveSelection();
            setModal('link');
          }}
          onToggleHeaderFooter={() =>
            updateSettings({ showHeaderFooter: !activeDoc.settings.showHeaderFooter })
          }
          onInsertPageNumber={(format) => {
            setActiveDoc((prev) => {
              const existing = prev.footerText
                .replace(/\s*·?\s*Page\s*\{PAGE\}(\s*of\s*\{NUMPAGES\})?/gi, '')
                .replace(/\s*·?\s*\{PAGE\}(\s*\/\s*\{NUMPAGES\})?/gi, '')
                .trim();

              if (format === 'remove') {
                return {
                  ...prev,
                  footerText: existing,
                };
              }

              const token =
                format === 'pageOfTotal'
                  ? 'Page {PAGE} of {NUMPAGES}'
                  : format === 'pageOnly'
                    ? 'Page {PAGE}'
                    : '{PAGE}';

              const nextFooter = existing ? `${existing} · ${token}` : token;
              return {
                ...prev,
                footerText: nextFooter,
                settings: { ...prev.settings, showHeaderFooter: true },
              };
            });
            showToast(
              format === 'remove'
                ? 'Removed page numbers from footer'
                : 'Automatic page numbering added to footer'
            );
          }}
          onInsertDateTime={() =>
            insertHtmlAtCursor(
              new Date().toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })
            )
          }
          onInsertSymbol={(sym) => insertHtmlAtCursor(sym)}
          onOpenDrawPad={() => {
            saveSelection();
            setModal('drawPad');
          }}
          onUpdateSettings={updateSettings}
          onOpenWatermarkDialog={() => setModal('watermark')}
          onInsertToc={() => insertHtmlAtCursor(buildTableOfContentsHtml(editorRef.current))}
          onInsertFootnote={() => {
            const count = (editorRef.current?.querySelectorAll('sup[data-fn]').length ?? 0) + 1;
            insertHtmlAtCursor(`<sup data-fn="${count}">[${count}]</sup>`);
            if (editorRef.current) {
              const fnBlock = document.createElement('p');
              fnBlock.style.fontSize = '9.5pt';
              fnBlock.style.color = '#605E5C';
              fnBlock.innerHTML = `[${count}] Enter footnote citation here.`;
              editorRef.current.appendChild(fnBlock);
              refreshEditorDerivedState();
            }
          }}
          onOpenCitationDialog={() => {
            saveSelection();
            setModal('citation');
          }}
          onOpenMailMergeDialog={() => setModal('mailMerge')}
          onInsertMergeField={(field) => insertHtmlAtCursor(`«${field}»`)}
          onRunProofing={() => {
            const text = editorRef.current?.innerText ?? '';
            setProofingIssues(runQuickProofingCheck(text));
            setModal('proofing');
          }}
          onOpenWordCount={() => setModal('wordCount')}
          onToggleReadAloud={() => handleToggleReadAloud()}
          onAddComment={() => setCommentsOpen(true)}
          onViewModeChange={setViewMode}
          onZoomChange={setZoom}
          onFitPageWidth={() => {
            const avail = window.innerWidth - 120;
            const target = Math.max(60, Math.min(160, Math.floor((avail / (pageWidthInches * 96)) * 100)));
            setZoom(target);
          }}
        />
      )}

      {/* Horizontal Page Ruler */}
      {activeDoc.settings.showRuler && viewMode === 'print' && (
        <HorizontalRuler
          pageWidthInches={pageWidthInches}
          margins={activeDoc.settings.margins}
          zoom={zoom}
        />
      )}

      {/* Main Workspace Row: Navigation Pane + Vertical Ruler + Document Page + Comments Pane */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {activeDoc.settings.showNavigationPane && viewMode !== 'read' && (
          <NavigationPane
            activeSubTab={navSubTab}
            onSubTabChange={setNavSubTab}
            headings={headings}
            onJumpToHeading={(id) => {
              const el = document.getElementById(id);
              el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }}
            findQuery={findQuery}
            onFindQueryChange={setFindQuery}
            replaceQuery={replaceQuery}
            onReplaceQueryChange={setReplaceQuery}
            caseSensitive={findCaseSensitive}
            onCaseSensitiveChange={setFindCaseSensitive}
            matchCount={findMatchCount}
            activeMatchIndex={activeMatchIndex}
            onFindNext={handleFindNext}
            onReplaceOne={handleReplaceOne}
            onReplaceAll={handleReplaceAll}
            onClose={() => updateSettings({ showNavigationPane: false })}
          />
        )}

        {activeDoc.settings.showRuler && viewMode === 'print' && (
          <VerticalRuler
            pageHeightInches={pageHeightInches}
            margins={activeDoc.settings.margins}
            zoom={zoom}
          />
        )}

        <EditorCanvas
          editorRef={editorRef}
          settings={activeDoc.settings}
          viewMode={viewMode}
          zoom={zoom}
          currentPage={currentPage}
          totalPages={stats.pages}
          headerText={activeDoc.headerText}
          footerText={activeDoc.footerText}
          searchHighlightRects={fallbackHighlightRects}
          onHeaderChange={(val) => setActiveDoc((prev) => ({ ...prev, headerText: val }))}
          onFooterChange={(val) => setActiveDoc((prev) => ({ ...prev, footerText: val }))}
          onInput={refreshEditorDerivedState}
          onSelectionChange={handleEditorMouseUp}
          onContextMenu={(e) => {
            e.preventDefault();
            const sel = window.getSelection();
            const targetEl = e.target as HTMLElement;
            const cell = targetEl.closest('td, th') as HTMLTableCellElement | null;
            const table = cell?.closest('table') ?? null;
            const activeRow = cell?.closest('tr') ?? null;
            const colIndex =
              cell && activeRow ? Array.from(activeRow.children).indexOf(cell) : 0;

            const prevRange = savedRangeRef.current;
            let activeRange: Range | null = null;
            if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
              activeRange = sel.getRangeAt(0).cloneRange();
              savedRangeRef.current = activeRange;
            } else if (
              prevRange &&
              !prevRange.collapsed &&
              cell &&
              prevRange.intersectsNode(cell)
            ) {
              activeRange = prevRange;
            } else {
              saveSelection();
            }

            const selText =
              activeRange?.toString().trim() || sel?.toString().trim() || '';

            let selectedTableRows: HTMLTableRowElement[] = [];
            let selectedTableCells: HTMLTableCellElement[] = [];
            let activeColumnLabel = `Col ${colIndex + 1}`;

            if (table && cell) {
              const headerRow =
                table.querySelector('thead tr') || table.querySelector('tr');
              const headerText = headerRow?.children[colIndex]?.textContent?.trim();
              if (headerText && headerRow !== activeRow) {
                activeColumnLabel = `"${headerText.slice(0, 18)}${headerText.length > 18 ? '…' : ''}"`;
              }

              selectedTableCells = getSelectedTableCells(table, cell, activeRange);

              if (activeRange && !activeRange.collapsed) {
                selectedTableRows = Array.from(table.querySelectorAll('tr')).filter(
                  (tr) => !tr.closest('thead') && activeRange.intersectsNode(tr)
                );
              }
            }

            setContextMenu({
              x: e.clientX,
              y: e.clientY,
              selectedText: selText,
              insideTable: Boolean(cell),
              targetCell: cell,
              selectedTableRows,
              selectedTableCells,
              activeColumnLabel,
            });
          }}
          onDropFile={(file) => {
            if (file.type.startsWith('image/')) {
              handleInsertImageFile(file);
            } else {
              handleOpenLocalFile(file);
            }
          }}
        />

        {commentsOpen && viewMode !== 'read' && (
          <CommentsPane
            comments={activeDoc.comments}
            onAddComment={(txt) => handleAddComment(txt)}
            onToggleResolve={(id) =>
              setActiveDoc((prev) => ({
                ...prev,
                comments: prev.comments.map((c) =>
                  c.id === id ? { ...c, resolved: !c.resolved } : c
                ),
              }))
            }
            onDeleteComment={(id) =>
              setActiveDoc((prev) => ({
                ...prev,
                comments: prev.comments.filter((c) => c.id !== id),
              }))
            }
            onClose={() => setCommentsOpen(false)}
          />
        )}
      </div>

      {/* Bottom MS Word Status Bar */}
      <StatusBar
        stats={stats}
        currentPage={currentPage}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        zoom={zoom}
        onZoomChange={setZoom}
        onOpenWordCount={() => setModal('wordCount')}
        autoSaveEnabled={autoSaveEnabled}
        onOpenOptions={() => {
          setBackstageSection('options');
          setBackstageOpen(true);
        }}
      />

      {/* Right-Click Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          selectedText={contextMenu.selectedText}
          insideTable={contextMenu.insideTable}
          activeColumnLabel={contextMenu.activeColumnLabel}
          selectedRowCount={contextMenu.selectedTableRows.length}
          selectedCellCount={contextMenu.selectedTableCells.length}
          hasMergedCell={contextMenu.selectedTableCells.some(
            (c) => (c.colSpan || 1) > 1 || (c.rowSpan || 1) > 1
          )}
          onClose={() => setContextMenu(null)}
          onCut={handleCut}
          onCopy={handleCopy}
          onPasteFormatted={() => handlePaste(false)}
          onPastePlain={() => handlePaste(true)}
          onExecCommand={execEditorCommand}
          onClearFormatting={() => execEditorCommand('removeFormat')}
          onOpenLinkDialog={() => setModal('link')}
          onAddComment={() => setCommentsOpen(true)}
          onReadSelection={() => handleToggleReadAloud(contextMenu.selectedText)}
          onSearchSelection={(q) => {
            updateSettings({ showNavigationPane: true });
            setNavSubTab('find');
            if (q) setFindQuery(q);
          }}
          onTableAction={handleTableAction}
        />
      )}

      {/* File Backstage Overlay */}
      {backstageOpen && (
        <FileBackstage
          initialSection={backstageSection}
          activeDoc={activeDoc}
          stats={stats}
          recentDocs={recentDocs}
          autoSaveEnabled={autoSaveEnabled}
          lastSavedText={lastSavedText}
          authorName={authorName}
          onToggleAutoSave={handleToggleAutoSave}
          onManualSaveLocal={handleManualSaveLocal}
          onAuthorChange={setAuthorName}
          onUpdateSettings={updateSettings}
          onClose={() => setBackstageOpen(false)}
          onCreateFromTemplate={handleCreateFromTemplate}
          onOpenLocalFile={handleOpenLocalFile}
          onOpenRecentDoc={(doc) => {
            setActiveDoc(doc);
            setUndoStack([doc.contentHtml]);
            setRedoStack([]);
            setBackstageOpen(false);
          }}
          onDeleteRecentDoc={(id) => {
            setRecentDocs((prev) => {
              const next = prev.filter((d) => d.id !== id);
              localStorage.setItem(STORAGE_RECENT_KEY, JSON.stringify(next));
              return next;
            });
          }}
          onExportDocx={handleExportDocx}
          onExportHtml={() => {
            exportHtmlToHtmlFile(
              activeDoc.title,
              editorRef.current?.innerHTML ?? activeDoc.contentHtml
            );
            showToast(`Exported "${activeDoc.title}.html"`);
          }}
          onExportTxt={() => {
            exportHtmlToTextFile(
              activeDoc.title,
              editorRef.current?.innerHTML ?? activeDoc.contentHtml
            );
            showToast(`Exported "${activeDoc.title}.txt"`);
          }}
          onPrint={() => window.print()}
          onRenameActive={(newTitle) =>
            setActiveDoc((prev) => ({ ...prev, title: newTitle || 'Document1' }))
          }
        />
      )}

      {/* Feature Modals */}
      {modal === 'wordCount' && (
        <WordCountDialog stats={stats} onClose={() => setModal(null)} />
      )}

      {modal === 'link' && (
        <LinkDialog
          initialText={window.getSelection()?.toString() || ''}
          onInsert={(text, url) =>
            insertHtmlAtCursor(
              `<a href="${url}" target="_blank" rel="noopener noreferrer">${text}</a>`
            )
          }
          onClose={() => setModal(null)}
        />
      )}

      {modal === 'drawPad' && (
        <DrawPadDialog
          onInsertDrawing={(dataUrl) =>
            insertHtmlAtCursor(
              `<img src="${dataUrl}" alt="Drawing" style="max-width:340px;height:auto;" /><p><br /></p>`
            )
          }
          onClose={() => setModal(null)}
        />
      )}

      {modal === 'watermark' && (
        <WatermarkDialog
          current={activeDoc.settings.watermark}
          onApply={(text) => updateSettings({ watermark: text })}
          onClose={() => setModal(null)}
        />
      )}

      {modal === 'citation' && (
        <CitationDialog
          onInsert={(html) => insertHtmlAtCursor(html)}
          onClose={() => setModal(null)}
        />
      )}

      {modal === 'mailMerge' && (
        <MailMergeDialog
          onApplyMerge={(values) => {
            if (!editorRef.current) return;
            let html = editorRef.current.innerHTML;
            Object.entries(values).forEach(([k, v]) => {
              html = html.replaceAll(`«${k}»`, v);
            });
            editorRef.current.innerHTML = html;
            refreshEditorDerivedState();
            showToast('Mail Merge fields applied');
          }}
          onClose={() => setModal(null)}
        />
      )}

      {modal === 'proofing' && (
        <ProofingDialog
          issues={proofingIssues}
          onFixIssue={(issue) => {
            if (!editorRef.current) return;
            const walker = document.createTreeWalker(editorRef.current, NodeFilter.SHOW_TEXT);
            const escaped = issue.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`\\b${escaped}\\b`, 'gi');
            let node = walker.nextNode();
            while (node) {
              if (node.nodeValue && regex.test(node.nodeValue)) {
                node.nodeValue = node.nodeValue.replace(regex, issue.suggestion);
              }
              node = walker.nextNode();
            }
            refreshEditorDerivedState();
            setProofingIssues((prev) => prev.filter((p) => p.id !== issue.id));
          }}
          onClose={() => setModal(null)}
        />
      )}

      {modal === 'splitCells' && splitTarget && (
        <SplitCellsDialog
          selectedCount={splitTarget.cells.length}
          initialCols={splitTarget.initialCols}
          initialRows={splitTarget.initialRows}
          onSplit={(cols, rows) => {
            if (splitTableCells(splitTarget.table, splitTarget.cells, cols, rows)) {
              refreshEditorDerivedState();
              showToast(`Split into ${cols} × ${rows}`);
            }
          }}
          onClose={() => {
            setModal(null);
            setSplitTarget(null);
          }}
        />
      )}

      {/* Subtle Action & Auto-Save Toasts */}
      <div className="no-print fixed bottom-9 right-4 z-50 flex flex-col items-end gap-1.5 pointer-events-none">
        {saveToastVisible && (
          <div
            role="status"
            aria-live="polite"
            className="bg-white/95 text-[#484644] text-[11px] font-medium px-3 py-1.5 rounded shadow-sm border border-[#D2D0CE] flex items-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5 text-[#107C41] shrink-0" />
            <span>Changes saved to local storage</span>
          </div>
        )}
        {toast && (
          <div className="bg-[#242424] text-white text-xs px-3.5 py-2 rounded shadow-lg border border-white/10">
            {toast}
          </div>
        )}
      </div>
    </div>
  );
}
