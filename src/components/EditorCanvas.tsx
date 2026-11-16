import React from 'react';
import {
  DocumentSettings,
  MARGIN_INCHES,
  PAGE_DIMENSIONS_INCHES,
  THEME_PALETTES,
  ViewMode,
} from '../types/word';

interface EditorCanvasProps {
  editorRef: React.RefObject<HTMLDivElement | null>;
  settings: DocumentSettings;
  viewMode: ViewMode;
  zoom: number;
  headerText: string;
  footerText: string;
  onHeaderChange: (val: string) => void;
  onFooterChange: (val: string) => void;
  onInput: () => void;
  onSelectionChange: () => void;
  onContextMenu: (e: React.MouseEvent<HTMLDivElement>) => void;
  onDropFile: (file: File) => void;
}

export const EditorCanvas: React.FC<EditorCanvasProps> = ({
  editorRef,
  settings,
  viewMode,
  zoom,
  headerText,
  footerText,
  onHeaderChange,
  onFooterChange,
  onInput,
  onSelectionChange,
  onContextMenu,
  onDropFile,
}) => {
  const dim = PAGE_DIMENSIONS_INCHES[settings.pageSize];
  const isLandscape = settings.orientation === 'landscape';
  const widthInches = isLandscape ? dim.height : dim.width;
  const heightInches = isLandscape ? dim.width : dim.height;

  const pxWidth = viewMode === 'web' ? 1120 : Math.round(widthInches * 96);
  const pxMinHeight = viewMode === 'web' ? 680 : Math.round(heightInches * 96);
  const margins = MARGIN_INCHES[settings.margins];
  const padTop = viewMode === 'web' ? 40 : Math.round(margins.top * 96);
  const padRight = viewMode === 'web' ? 48 : Math.round(margins.right * 96);
  const padBottom = viewMode === 'web' ? 48 : Math.round(margins.bottom * 96);
  const padLeft = viewMode === 'web' ? 48 : Math.round(margins.left * 96);

  const theme = THEME_PALETTES[settings.theme];

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
              value={headerText}
              onChange={(e) => onHeaderChange(e.target.value)}
              placeholder="Document Header (click to edit)"
              readOnly={viewMode === 'read'}
              className="w-full text-[9.5pt] text-[#605E5C] bg-transparent outline-none text-right placeholder:text-[#A19F9D]"
            />
          </div>
        )}

        {/* Main ContentEditable Document Surface */}
        <div
          ref={editorRef}
          contentEditable={viewMode !== 'read'}
          suppressContentEditableWarning
          spellCheck
          onInput={onInput}
          onKeyUp={onSelectionChange}
          onMouseUp={onSelectionChange}
          onContextMenu={onContextMenu}
          style={{
            fontFamily: theme.fontBody,
            lineHeight: settings.lineSpacing,
            columnCount: settings.columns,
            columnGap: settings.columns > 1 ? '28px' : undefined,
            minHeight: `${Math.max(300, pxMinHeight - padTop - padBottom)}px`,
          }}
          className="word-editor-content relative z-10"
        />

        {/* Footer Zone */}
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
              value={footerText}
              onChange={(e) => onFooterChange(e.target.value)}
              placeholder="Document Footer (click to edit)"
              readOnly={viewMode === 'read'}
              className="w-full text-[9.5pt] text-[#605E5C] bg-transparent outline-none text-center placeholder:text-[#A19F9D]"
            />
          </div>
        )}
      </div>
    </div>
  );
};
