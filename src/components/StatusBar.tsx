import React from 'react';
import { BookOpen, FileText, Globe, ListTree, Minus, Plus } from 'lucide-react';
import { DocumentStats, ViewMode } from '../types/word';

interface StatusBarProps {
  stats: DocumentStats;
  currentPage: number;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  onOpenWordCount: () => void;
  showDocumentOutline: boolean;
  headingCount: number;
  onToggleDocumentOutline: () => void;
  autoSaveEnabled: boolean;
  onOpenOptions: () => void;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  stats,
  currentPage,
  viewMode,
  onViewModeChange,
  zoom,
  onZoomChange,
  onOpenWordCount,
  showDocumentOutline,
  headingCount,
  onToggleDocumentOutline,
  autoSaveEnabled,
  onOpenOptions,
}) => {
  return (
    <footer className="no-print h-6 bg-[#F3F2F1] border-t border-[#D2D0CE] px-3 flex items-center justify-between text-[11px] text-[#484644] select-none shrink-0">
      {/* Left: Page, Word Count, Outline Toggle, Proofing Language */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenWordCount}
          className="hover:bg-[#E1DFDD] px-1.5 py-0.5 rounded whitespace-nowrap tabular-nums cursor-pointer transition-colors"
          title="Click for detailed document statistics"
        >
          Page {Math.min(currentPage, stats.pages)} of {stats.pages}
        </button>

        <button
          type="button"
          onClick={onOpenWordCount}
          className="hover:bg-[#E1DFDD] px-1.5 py-0.5 rounded whitespace-nowrap tabular-nums cursor-pointer transition-colors"
          title="Click for Word Count details"
        >
          {stats.words.toLocaleString()} {stats.words === 1 ? 'word' : 'words'}
        </button>

        <button
          type="button"
          onClick={onToggleDocumentOutline}
          aria-pressed={showDocumentOutline}
          title="Toggle Document Outline Panel"
          className={`flex items-center gap-1 px-1.5 py-0.5 rounded whitespace-nowrap cursor-pointer transition-colors ${
            showDocumentOutline
              ? 'bg-[#CFE4FA] text-[#0F6CBD] font-medium'
              : 'hover:bg-[#E1DFDD] text-[#484644]'
          }`}
        >
          <ListTree className="w-3 h-3" />
          <span>Outline</span>
          {headingCount > 0 && (
            <span className="text-[10px] opacity-75 tabular-nums">({headingCount})</span>
          )}
        </button>

        <span className="hidden sm:inline text-[#605E5C] whitespace-nowrap">
          English (United States)
        </span>

        <button
          type="button"
          onClick={onOpenOptions}
          title="Click to configure Auto-Save in Word Options"
          className="hidden md:flex items-center gap-1.5 hover:bg-[#E1DFDD] px-1.5 py-0.5 rounded whitespace-nowrap cursor-pointer transition-colors"
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              autoSaveEnabled ? 'bg-[#107C41]' : 'bg-[#D97706]'
            }`}
          />
          <span className="text-[#484644]">
            Auto-Save: {autoSaveEnabled ? 'On' : 'Off'}
          </span>
        </button>
      </div>

      {/* Right: View Modes + Zoom Slider */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="flex items-center border-r border-[#D2D0CE] pr-2 mr-1">
          <button
            type="button"
            onClick={() => onViewModeChange('read')}
            title="Read Mode"
            className={`p-1 rounded cursor-pointer transition-colors ${
              viewMode === 'read' ? 'bg-[#D2D0CE] text-[#185ABD]' : 'hover:bg-[#E1DFDD]'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange('print')}
            title="Print Layout"
            className={`p-1 rounded cursor-pointer transition-colors ${
              viewMode === 'print' ? 'bg-[#D2D0CE] text-[#185ABD]' : 'hover:bg-[#E1DFDD]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange('web')}
            title="Web Layout"
            className={`p-1 rounded cursor-pointer transition-colors ${
              viewMode === 'web' ? 'bg-[#D2D0CE] text-[#185ABD]' : 'hover:bg-[#E1DFDD]'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
          </button>
        </div>

        <button
          type="button"
          onClick={() => onZoomChange(Math.max(50, zoom - 10))}
          title="Zoom Out"
          className="p-0.5 rounded hover:bg-[#E1DFDD] cursor-pointer"
        >
          <Minus className="w-3 h-3" />
        </button>

        <input
          type="range"
          min={50}
          max={200}
          step={5}
          value={zoom}
          onChange={(e) => onZoomChange(Number(e.target.value))}
          aria-label="Zoom slider"
          className="word-zoom-slider w-20 sm:w-24"
        />

        <button
          type="button"
          onClick={() => onZoomChange(Math.min(200, zoom + 10))}
          title="Zoom In"
          className="p-0.5 rounded hover:bg-[#E1DFDD] cursor-pointer"
        >
          <Plus className="w-3 h-3" />
        </button>

        <button
          type="button"
          onClick={() => onZoomChange(100)}
          title="Reset Zoom to 100%"
          className="hover:bg-[#E1DFDD] px-1.5 py-0.5 rounded w-10 text-right tabular-nums cursor-pointer"
        >
          {zoom}%
        </button>
      </div>
    </footer>
  );
};
