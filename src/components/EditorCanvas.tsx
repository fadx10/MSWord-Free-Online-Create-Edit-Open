import React, { useState } from 'react';
import {
  DocumentSettings,
  MARGIN_INCHES,
  PAGE_DIMENSIONS_INCHES,
  THEME_PALETTES,
  ViewMode,
} from '../types/word';
import { resolvePageNumberPlaceholders } from '../utils/editorHelpers';

export interface SearchHighlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
  active: boolean;
}

interface EditorCanvasProps {
  editorRef: React.RefObject<HTMLDivElement | null>;
  settings: DocumentSettings;
  viewMode: ViewMode;
  zoom: number;
  currentPage: number;
  totalPages: number;
  headerText: string;
  footerText: string;
  searchHighlightRects?: SearchHighlightRect[];
  onHeaderChange: (val: string) => void;
  onFooterChange: (val: string) => void;
  onInput: () => void;
  onSelectionChange: () => void;
  onClickComment?: (commentId: string) => void;
  onContextMenu: (e: React.MouseEvent<HTMLDivElement>) => void;
  onDropFile: (file: File) => void;
}

export const EditorCanvas: React.FC<EditorCanvasProps> = ({
  editorRef,
  settings,
  viewMode,
  zoom,
  currentPage,
  totalPages,
  headerText,
  footerText,
  searchHighlightRects = [],
  onHeaderChange,
  onFooterChange,
  onInput,
  onSelectionChange,
  onClickComment,
  onContextMenu,
  onDropFile,
}) => {
  const [headerFocused, setHeaderFocused] = useState(false);
  const [footerFocused, setFooterFocused] = useState(false);

  const dim = PAGE_DIMENSIONS_INCHES[settings.pageSize];
  const isLandscape = settings.orientation === 'landscape';
  const widthInches = isLandscape ? dim.height : dim.width;
  const heightInches = isLandscape ? dim.width : dim.height;

  const pxWidth = viewMode === 'web' ? 1120 : Math.round(widthInches * 96);
  const pxMinHeight = viewMode === 'web' ? 680 : Math.round(heightInches * 96);
  const margins = settings.customMargins ?? MARGIN_INCHES[settings.margins];
  const padTop = viewMode === 'web' ? 40 : Math.round(margins.top * 96);
  const padRight = viewMode === 'web' ? 48 : Math.round(margins.right * 96);
  const padBottom = viewMode === 'web' ? 48 : Math.round(margins.bottom * 96);
  const padLeft = viewMode === 'web' ? 48 : Math.round(margins.left * 96);

  const theme = THEME_PALETTES[settings.theme];
  const isImported = Boolean(settings.preserveImportedStyles);

  const borderStyle =
    settings.pageBorder === 'box'
      ? '1px solid #8A8886'
      : settings.pageBorder === 'double'
        ? '4px double #605E5C'
        : undefined;

  const sheetShadow =
    settings.pageBorder === 'shadow'
      ? '4px 4px 0px #8A8886, 0 2px 10px rgba(0,0,0,0.12)'
      : '0 2px 8px rgba(0, 0, 0, 0.12), 0 0 1px rgba(0, 0, 0, 0.08)';

  const pageNumberConfig = settings.pageNumbers;
  const hasHeaderPlaceholder = /\{PAGE\}|\{NUMPAGES\}/.test(headerText);
  const hasFooterPlaceholder = /\{PAGE\}|\{NUMPAGES\}/.test(footerText);
  const resolvedHeader = resolvePageNumberPlaceholders(
    headerText,
    currentPage,
    totalPages,
    pageNumberConfig
  );
  const resolvedFooter = resolvePageNumberPlaceholders(
    footerText,
    currentPage,
    totalPages,
    pageNumberConfig
  );

  const headerAlignClass =
    pageNumberConfig?.enabled && pageNumberConfig.placement === 'top'
      ? pageNumberConfig.alignment === 'left'
        ? 'text-left'
        : pageNumberConfig.alignment === 'center'
          ? 'text-center'
          : 'text-right'
      : 'text-right';

  const footerAlignClass =
    pageNumberConfig?.enabled && pageNumberConfig.placement === 'bottom'
      ? pageNumberConfig.alignment === 'left'
        ? 'text-left'
        : pageNumberConfig.alignment === 'right'
          ? 'text-right'
          : 'text-center'
      : 'text-center';

  return (
    <div
      className={`print-only-container flex-1 overflow-auto office-scroll flex justify-center items-start py-6 px-4 sm:px-8 ${
        viewMode === 'read' ? 'bg-[#FAF9F8]' : 'bg-[#E8E6E4]'
      }`}
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes('Files')) {
          e.preventDefault();
        }
      }}
      onDrop={(e) => {
        const file = e.dataTransfer.files?.[0];
        if (file) {
          e.preventDefault();
          onDropFile(file);
        }
      }}
    >
      {/* Realistic MS Word Page Sheet */}
      <div
        className="print-page-sheet relative transition-colors duration-150 shrink-0"
        style={{
          width: `${pxWidth}px`,
          minHeight: `${pxMinHeight}px`,
          backgroundColor: settings.pageColor,
          boxShadow: viewMode === 'web' ? '0 1px 4px rgba(0,0,0,0.08)' : sheetShadow,
          border: borderStyle ?? '1px solid #D2D0CE',
          zoom: zoom / 100,
          paddingTop: `${padTop}px`,
          paddingRight: `${padRight}px`,
          paddingBottom: `${padBottom}px`,
          paddingLeft: `${padLeft}px`,
        }}
      >
        {/* Subtle MS Word Margin Crop Marks */}
        {settings.showMarginGuides && viewMode === 'print' && (
          <div className="no-print pointer-events-none">
            {/* Top-left */}
            <div
              style={{ top: `${padTop}px`, left: `${padLeft}px` }}
              className="absolute w-3 h-3 -translate-x-3 -translate-y-3 border-r border-b border-[#C8C6C4]"
            />
            {/* Top-right */}
            <div
              style={{ top: `${padTop}px`, right: `${padRight}px` }}
              className="absolute w-3 h-3 translate-x-3 -translate-y-3 border-l border-b border-[#C8C6C4]"
            />
            {/* Bottom-left */}
            <div
              style={{ bottom: `${padBottom}px`, left: `${padLeft}px` }}
              className="absolute w-3 h-3 -translate-x-3 translate-y-3 border-r border-t border-[#C8C6C4]"
            />
            {/* Bottom-right */}
            <div
              style={{ bottom: `${padBottom}px`, right: `${padRight}px` }}
              className="absolute w-3 h-3 translate-x-3 translate-y-3 border-l border-t border-[#C8C6C4]"
            />
          </div>
        )}

        {/* Optional Diagonal Watermark */}
        {settings.watermark && (
          <div className="pointer-events-none select-none absolute inset-0 flex items-center justify-center overflow-hidden">
            <span className="text-[72px] font-bold tracking-widest text-black/[0.06] -rotate-45 whitespace-nowrap">
              {settings.watermark}
            </span>
          </div>
        )}

        {/* Header Zone */}
        {(settings.showHeaderFooter || headerText.trim()) && viewMode !== 'web' && (
          <div
            style={{
              top: `${Math.max(16, Math.round(padTop * 0.42))}px`,
              left: `${padLeft}px`,
              right: `${padRight}px`,
            }}
            className="absolute border-b border-dashed border-transparent focus-within:border-[#B4D6FA]"
          >
            <input
              type="text"
              value={headerFocused ? headerText : resolvedHeader}
              onFocus={() => setHeaderFocused(true)}
              onBlur={() => setHeaderFocused(false)}
              onChange={(e) => onHeaderChange(e.target.value)}
              placeholder="Document Header (click to edit)"
              title={
                hasHeaderPlaceholder
                  ? 'Automatic page numbering active ({PAGE} / {NUMPAGES})'
                  : 'Click to edit header'
              }
              readOnly={viewMode === 'read'}
              className={`w-full text-[9.5pt] text-[#605E5C] bg-transparent outline-none tabular-nums placeholder:text-[#A19F9D] ${headerAlignClass}`}
            />
            {headerFocused && hasHeaderPlaceholder && (
              <div className="no-print text-[10px] text-[#185ABD] text-center mt-0.5 select-none">
                Use {'{PAGE}'} for current page and {'{NUMPAGES}'} for total pages
              </div>
            )}
          </div>
        )}

        {/* Main ContentEditable Document Surface + Non-destructive Fallback Search Overlay */}
        <div className="relative">
          {isImported && settings.importedCss && (
            <style>{settings.importedCss}</style>
          )}
          {searchHighlightRects.length > 0 && (
            <div
              aria-hidden="true"
              className="no-print pointer-events-none absolute inset-0 z-0 overflow-hidden"
            >
              {searchHighlightRects.map((rect, idx) => (
                <div
                  key={idx}
                  style={{
                    top: `${rect.top}px`,
                    left: `${rect.left}px`,
                    width: `${rect.width}px`,
                    height: `${rect.height}px`,
                    backgroundColor: rect.active ? '#f59e0b' : '#fef08a',
                  }}
                  className="absolute rounded-[2px]"
                />
              ))}
            </div>
          )}

          <div
            ref={editorRef}
            contentEditable={viewMode !== 'read'}
            suppressContentEditableWarning
            spellCheck
            onInput={onInput}
            onChange={(e) => {
              const target = e.target as HTMLElement;
              if (
                target instanceof HTMLInputElement &&
                target.classList.contains('word-tickbox')
              ) {
                if (target.checked) {
                  target.setAttribute('checked', 'checked');
                } else {
                  target.removeAttribute('checked');
                }
                onInput();
              }
            }}
            onKeyDown={(e) => {
              if (e.key !== 'Enter' || e.shiftKey || viewMode === 'read') return;
              const sel = window.getSelection();
              if (!sel || sel.rangeCount === 0) return;
              const range = sel.getRangeAt(0);
              const anchorEl =
                range.startContainer.nodeType === Node.ELEMENT_NODE
                  ? (range.startContainer as HTMLElement)
                  : range.startContainer.parentElement;
              const checklistItem = anchorEl?.closest(
                'p.word-checklist-item'
              ) as HTMLParagraphElement | null;
              if (!checklistItem || !editorRef.current?.contains(checklistItem)) return;

              e.preventDefault();

              const clone = checklistItem.cloneNode(true) as HTMLElement;
              clone.querySelectorAll('.word-tickbox-wrap').forEach((w) => w.remove());
              const itemText = (clone.textContent ?? '').replace(/\u00a0/g, ' ').trim();

              if (!itemText) {
                checklistItem.classList.remove('word-checklist-item');
                checklistItem.querySelectorAll('.word-tickbox-wrap').forEach((w) => w.remove());
                checklistItem.innerHTML = '<br />';
                const exitRange = document.createRange();
                exitRange.selectNodeContents(checklistItem);
                exitRange.collapse(true);
                sel.removeAllRanges();
                sel.addRange(exitRange);
                onInput();
                return;
              }

              if (!range.collapsed) {
                range.deleteContents();
              }

              const tailRange = document.createRange();
              tailRange.setStart(range.endContainer, range.endOffset);
              tailRange.setEnd(checklistItem, checklistItem.childNodes.length);
              const trailingFrag = tailRange.extractContents();

              const nextItem = document.createElement('p');
              nextItem.className = 'word-checklist-item';
              const wrap = document.createElement('span');
              wrap.className = 'word-tickbox-wrap';
              wrap.setAttribute('contenteditable', 'false');
              const cb = document.createElement('input');
              cb.type = 'checkbox';
              cb.className = 'word-tickbox';
              cb.setAttribute('aria-label', 'Tick box');
              wrap.appendChild(cb);

              nextItem.appendChild(wrap);
              const spaceNode = document.createTextNode('\u00a0');
              nextItem.appendChild(spaceNode);

              const trailingText = (trailingFrag.textContent ?? '')
                .replace(/\u00a0/g, '')
                .trim();
              if (trailingText) {
                nextItem.appendChild(trailingFrag);
              }

              checklistItem.after(nextItem);

              const caretRange = document.createRange();
              caretRange.setStart(spaceNode, spaceNode.length);
              caretRange.collapse(true);
              sel.removeAllRanges();
              sel.addRange(caretRange);

              onInput();
            }}
            onKeyUp={onSelectionChange}
            onMouseUp={onSelectionChange}
            onClick={(e) => {
              const sel = window.getSelection();
              if (sel && !sel.isCollapsed) return;
              const target = e.target as HTMLElement | null;
              const mark = target?.closest<HTMLElement>('.word-comment-highlight[data-comment-id]');
              if (mark && editorRef.current?.contains(mark)) {
                const commentId = mark.getAttribute('data-comment-id');
                if (commentId) {
                  onClickComment?.(commentId);
                }
              }
            }}
            onContextMenu={onContextMenu}
            style={{
              fontFamily: isImported
                ? settings.importedBaseStyle?.fontFamily
                : theme.fontBody,
              fontSize:
                isImported && settings.importedBaseStyle?.fontSizePt
                  ? `${settings.importedBaseStyle.fontSizePt}pt`
                  : undefined,
              color: isImported ? settings.importedBaseStyle?.color : undefined,
              lineHeight: isImported
                ? settings.importedBaseStyle?.lineHeight ?? settings.lineSpacing
                : settings.lineSpacing,
              columnCount: settings.columns,
              columnGap: settings.columns > 1 ? '28px' : undefined,
              minHeight: `${Math.max(300, pxMinHeight - padTop - padBottom)}px`,
            }}
            className={`word-editor-content relative z-10 ${
              isImported ? 'word-imported-doc' : ''
            }`}
          />
        </div>

        {/* Footer Zone with Automatic Page Number Placeholder Resolution */}
        {(settings.showHeaderFooter || footerText.trim()) && viewMode !== 'web' && (
          <div
            style={{
              bottom: `${Math.max(16, Math.round(padBottom * 0.42))}px`,
              left: `${padLeft}px`,
              right: `${padRight}px`,
            }}
            className="absolute border-t border-dashed border-transparent focus-within:border-[#B4D6FA]"
          >
            <input
              type="text"
              value={footerFocused ? footerText : resolvedFooter}
              onFocus={() => setFooterFocused(true)}
              onBlur={() => setFooterFocused(false)}
              onChange={(e) => onFooterChange(e.target.value)}
              placeholder="Document Footer (click to edit)"
              title={
                hasFooterPlaceholder
                  ? 'Automatic page numbering active ({PAGE} / {NUMPAGES})'
                  : 'Click to edit footer'
              }
              readOnly={viewMode === 'read'}
              className={`w-full text-[9.5pt] text-[#605E5C] bg-transparent outline-none tabular-nums placeholder:text-[#A19F9D] ${footerAlignClass}`}
            />
            {footerFocused && (
              <div className="no-print text-[10px] text-[#185ABD] text-center mt-0.5 select-none">
                Use {'{PAGE}'} for current page and {'{NUMPAGES}'} for total pages
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
