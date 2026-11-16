import React, { useEffect, useRef, useState } from 'react';
import {
  ChevronUp,
  ChevronDown,
  Download,
  FilePlus2,
  FolderOpen,
  Printer,
  Redo2,
  Save,
  Search,
  Undo2,
  User,
} from 'lucide-react';

export interface QuickCommandItem {
  id: string;
  label: string;
  category: string;
  shortcut?: string;
  action: () => void;
}

interface TitleBarProps {
  title: string;
  onTitleChange: (newTitle: string) => void;
  authorName: string;
  onAuthorChange: (name: string) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onSaveDocx: () => void;
  onNewDoc: () => void;
  onOpenFile: () => void;
  onPrint: () => void;
  ribbonCollapsed: boolean;
  onToggleRibbon: () => void;
  commands: QuickCommandItem[];
  lastSavedText: string;
  autoSaveEnabled: boolean;
  onOpenOptions: () => void;
}

export const TitleBar: React.FC<TitleBarProps> = ({
  title,
  onTitleChange,
  authorName,
  onAuthorChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onSaveDocx,
  onNewDoc,
  onOpenFile,
  onPrint,
  ribbonCollapsed,
  onToggleRibbon,
  commands,
  lastSavedText,
  autoSaveEnabled,
  onOpenOptions,
}) => {
  const [editingTitle, setEditingTitle] = useState(false);
  const [draftTitle, setDraftTitle] = useState(title);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [editingAuthor, setEditingAuthor] = useState(false);
  const [draftAuthor, setDraftAuthor] = useState(authorName);
  const searchBoxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDraftTitle(title);
  }, [title]);

  useEffect(() => {
    setDraftAuthor(authorName);
  }, [authorName]);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) {
        setSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const filteredCommands = searchQuery.trim()
    ? commands
        .filter(
          (c) =>
            c.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.category.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .slice(0, 8)
    : commands.slice(0, 6);

  const commitTitle = () => {
    setEditingTitle(false);
    const cleaned = draftTitle.trim() || 'Document1';
    onTitleChange(cleaned);
  };

  const commitAuthor = () => {
    setEditingAuthor(false);
    const cleaned = draftAuthor.trim() || 'Word User';
    onAuthorChange(cleaned);
  };

  return (
    <header className="no-print h-10 bg-[#185ABD] text-white flex items-center justify-between px-2.5 select-none shrink-0 border-b border-[#144FA4]">
      {/* Left: Word Mark + Quick Access Toolbar */}
      <div className="flex items-center gap-1 min-w-0 shrink-0">
        <div
          className="w-7 h-7 rounded flex items-center justify-center bg-[#104A9E] border border-white/15 mr-1 font-bold text-sm tracking-tight"
          title="Microsoft Word Online"
        >
          W
        </div>

        <button
          type="button"
          onClick={onSaveDocx}
          title="Save as .docx (Ctrl+S)"
          className="h-7 w-7 rounded flex items-center justify-center hover:bg-white/15 active:bg-white/25 transition-colors cursor-pointer"
        >
          <Save className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
          className={`h-7 w-7 rounded flex items-center justify-center transition-colors ${
            canUndo ? 'hover:bg-white/15 active:bg-white/25 cursor-pointer' : 'opacity-40 cursor-default'
          }`}
        >
          <Undo2 className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo (Ctrl+Y)"
          className={`h-7 w-7 rounded flex items-center justify-center transition-colors ${
            canRedo ? 'hover:bg-white/15 active:bg-white/25 cursor-pointer' : 'opacity-40 cursor-default'
          }`}
        >
          <Redo2 className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={onNewDoc}
          title="New Blank Document"
          className="hidden sm:flex h-7 w-7 rounded items-center justify-center hover:bg-white/15 active:bg-white/25 transition-colors cursor-pointer"
        >
          <FilePlus2 className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={onOpenFile}
          title="Open .docx / .html / .txt file"
          className="hidden sm:flex h-7 w-7 rounded items-center justify-center hover:bg-white/15 active:bg-white/25 transition-colors cursor-pointer"
        >
          <FolderOpen className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={onPrint}
          title="Print Document (Ctrl+P)"
          className="hidden md:flex h-7 w-7 rounded items-center justify-center hover:bg-white/15 active:bg-white/25 transition-colors cursor-pointer"
        >
          <Printer className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Center: Editable Document Title + Word Search Bar */}
      <div className="flex items-center gap-3 flex-1 justify-center max-w-2xl px-3 min-w-0">
        {editingTitle ? (
          <input
            type="text"
            value={draftTitle}
            autoFocus
            onChange={(e) => setDraftTitle(e.target.value)}
            onBlur={commitTitle}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitTitle();
              if (e.key === 'Escape') {
                setDraftTitle(title);
                setEditingTitle(false);
              }
            }}
            className="bg-white text-[#242424] text-xs font-medium px-2.5 py-1 rounded w-44 outline-none border border-[#B4D6FA]"
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditingTitle(true)}
            title="Click to rename document"
            className="text-xs font-medium text-white/95 hover:bg-white/15 px-2.5 py-1 rounded truncate max-w-[200px] whitespace-nowrap cursor-pointer transition-colors"
          >
            {title} - Word
          </button>
        )}

        <div ref={searchBoxRef} className="relative flex-1 max-w-xs hidden sm:block">
          <div className="flex items-center bg-[#326EC8] hover:bg-[#3A77D2] focus-within:bg-white focus-within:text-[#242424] rounded px-2.5 h-7 border border-white/15 transition-colors">
            <Search className="w-3.5 h-3.5 shrink-0 opacity-85 mr-2" />
            <input
              type="text"
              value={searchQuery}
              onFocus={() => setSearchFocused(true)}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSearchFocused(true);
              }}
              placeholder="Search commands..."
              aria-label="Search Word commands"
              className="w-full bg-transparent text-xs outline-none placeholder:text-white/80 focus:placeholder:text-[#605E5C]"
            />
          </div>

          {searchFocused && (
            <div className="absolute left-0 right-0 top-8 bg-white text-[#242424] rounded shadow-lg border border-[#D2D0CE] py-1 z-50">
              <div className="px-3 py-1 text-[11px] font-semibold text-[#605E5C] border-b border-[#EDEBE9]">
                {searchQuery.trim() ? 'Matching Actions' : 'Suggested Actions'}
              </div>
              {filteredCommands.length === 0 ? (
                <div className="px-3 py-2 text-xs text-[#605E5C]">No matching command</div>
              ) : (
                filteredCommands.map((cmd) => (
                  <button
                    key={cmd.id}
                    type="button"
                    onClick={() => {
                      cmd.action();
                      setSearchFocused(false);
                      setSearchQuery('');
                    }}
                    className="w-full px-3 py-1.5 text-left text-xs hover:bg-[#F3F2F1] flex items-center justify-between gap-2 cursor-pointer"
                  >
                    <span className="truncate font-medium">{cmd.label}</span>
                    <span className="text-[11px] text-[#605E5C] shrink-0">
                      {cmd.shortcut || cmd.category}
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right: Auto-Save Indicator, Author, Download .docx, Ribbon Collapse */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={onOpenOptions}
          title={
            autoSaveEnabled
              ? `Auto-Save to local storage is ON (${lastSavedText}). Click to open Options.`
              : 'Auto-Save to local storage is OFF. Click to open Options.'
          }
          className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded bg-[#104A9E]/75 hover:bg-[#104A9E] border border-white/15 text-[11px] text-white/95 mr-1 whitespace-nowrap cursor-pointer transition-colors"
        >
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${
              autoSaveEnabled ? 'bg-[#86EFAC]' : 'bg-[#FCD34D]'
            }`}
          />
          <span className="font-medium">
            {autoSaveEnabled ? 'Auto-Save On' : 'Auto-Save Off'}
          </span>
          <span className="hidden lg:inline text-white/75">· {lastSavedText}</span>
        </button>

        {editingAuthor ? (
          <input
            type="text"
            value={draftAuthor}
            autoFocus
            onChange={(e) => setDraftAuthor(e.target.value)}
            onBlur={commitAuthor}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitAuthor();
              if (e.key === 'Escape') {
                setDraftAuthor(authorName);
                setEditingAuthor(false);
              }
            }}
            className="bg-white text-[#242424] text-xs px-2 py-0.5 rounded w-28 outline-none"
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditingAuthor(true)}
            title="Click to change author name"
            className="hidden md:flex items-center gap-1.5 px-2 py-1 rounded hover:bg-white/15 text-xs whitespace-nowrap cursor-pointer transition-colors"
          >
            <span className="w-5 h-5 rounded-full bg-[#104A9E] border border-white/25 flex items-center justify-center text-[10px] font-semibold">
              {authorName.slice(0, 2).toUpperCase()}
            </span>
            <span className="max-w-[90px] truncate">{authorName}</span>
          </button>
        )}

        <button
          type="button"
          onClick={onSaveDocx}
          title="Download as Microsoft Word (.docx)"
          className="flex items-center gap-1.5 px-2.5 h-7 rounded bg-white text-[#185ABD] hover:bg-[#F3F2F1] text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Download .docx</span>
        </button>

        <button
          type="button"
          onClick={onToggleRibbon}
          title={ribbonCollapsed ? 'Show Ribbon' : 'Collapse Ribbon'}
          className="h-7 w-7 rounded flex items-center justify-center hover:bg-white/15 transition-colors cursor-pointer"
        >
          {ribbonCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};
