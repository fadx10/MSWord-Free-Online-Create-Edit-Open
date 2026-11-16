import React, { useEffect, useRef, useState } from 'react';
import {
  Bold,
  Clipboard,
  Copy,
  Eraser,
  Highlighter,
  Italic,
  Link2,
  MessageSquarePlus,
  Scissors,
  Search,
  ArrowDownAZ,
  ArrowUpZA,
  ArrowDown01,
  ArrowUp10,
  Combine,
  SplitSquareHorizontal,
  Table as TableIcon,
  Type,
  Underline,
  Volume2,
} from 'lucide-react';

interface ContextMenuProps {
  x: number;
  y: number;
  selectedText: string;
  insideTable: boolean;
  activeColumnLabel?: string;
  selectedRowCount?: number;
  selectedCellCount?: number;
  hasMergedCell?: boolean;
  onClose: () => void;
  onCut: () => void;
  onCopy: () => void;
  onPasteFormatted: () => void;
  onPastePlain: () => void;
  onExecCommand: (cmd: string, val?: string) => void;
  onClearFormatting: () => void;
  onOpenLinkDialog: () => void;
  onAddComment: () => void;
  onReadSelection: () => void;
  onSearchSelection: (query: string) => void;
  onTableAction: (
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
  ) => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  selectedText,
  insideTable,
  activeColumnLabel,
  selectedRowCount = 0,
  selectedCellCount = 1,
  hasMergedCell = false,
  onClose,
  onCut,
  onCopy,
  onPasteFormatted,
  onPastePlain,
  onExecCommand,
  onClearFormatting,
  onOpenLinkDialog,
  onAddComment,
  onReadSelection,
  onSearchSelection,
  onTableAction,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  // Clamp position within viewport
  const left = Math.min(x, window.innerWidth - 260);
  const top = Math.min(y, window.innerHeight - (insideTable ? 620 : 400));

  const items = [
    {
      id: 'cut',
      label: 'Cut',
      icon: <Scissors className="w-3.5 h-3.5 text-[#605E5C]" />,
      shortcut: 'Ctrl+X',
      action: onCut,
    },
    {
      id: 'copy',
      label: 'Copy',
      icon: <Copy className="w-3.5 h-3.5 text-[#185ABD]" />,
      shortcut: 'Ctrl+C',
      action: onCopy,
    },
    {
      id: 'comment',
      label: 'New Comment',
      icon: <MessageSquarePlus className="w-3.5 h-3.5 text-[#8764B8]" />,
      action: onAddComment,
    },
    {
      id: 'link',
      label: 'Link...',
      icon: <Link2 className="w-3.5 h-3.5 text-[#0F6CBD]" />,
      action: onOpenLinkDialog,
    },
    {
      id: 'search',
      label: selectedText
        ? `Find "${selectedText.slice(0, 16)}${selectedText.length > 16 ? '…' : ''}"`
        : 'Search Document',
      icon: <Search className="w-3.5 h-3.5 text-[#185ABD]" />,
      action: () => onSearchSelection(selectedText),
    },
    {
      id: 'read',
      label: 'Read Aloud',
      icon: <Volume2 className="w-3.5 h-3.5 text-[#185ABD]" />,
      action: onReadSelection,
    },
    {
      id: 'clear',
      label: 'Clear Formatting',
      icon: <Eraser className="w-3.5 h-3.5 text-[#A4262C]" />,
      action: onClearFormatting,
    },
  ];

  const visibleItems = filter.trim()
    ? items.filter((it) => it.label.toLowerCase().includes(filter.toLowerCase()))
    : items;

  return (
    <div
      ref={menuRef}
      style={{ left: `${Math.max(8, left)}px`, top: `${Math.max(8, top)}px` }}
      className="no-print fixed z-50 w-60 bg-white rounded-md shadow-xl border border-[#D2D0CE] py-1.5 text-xs text-[#242424] select-none"
    >
      {/* Top Quick Search Box (matching screenshot!) */}
      <div className="px-2 pb-1.5 border-b border-[#EDEBE9]">
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Search the menus"
          className="w-full h-7 px-2.5 text-xs bg-[#FAF9F8] border border-[#D2D0CE] rounded outline-none focus:border-[#185ABD]"
        />
      </div>

      {/* Mini Formatting Strip */}
      <div className="px-2 py-1.5 border-b border-[#EDEBE9] flex items-center justify-between gap-1">
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onExecCommand('bold')}
          title="Bold"
          className="w-7 h-7 rounded hover:bg-[#EDEBE9] flex items-center justify-center cursor-pointer"
        >
          <Bold className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onExecCommand('italic')}
          title="Italic"
          className="w-7 h-7 rounded hover:bg-[#EDEBE9] flex items-center justify-center cursor-pointer"
        >
          <Italic className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onExecCommand('underline')}
          title="Underline"
          className="w-7 h-7 rounded hover:bg-[#EDEBE9] flex items-center justify-center cursor-pointer"
        >
          <Underline className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onExecCommand('hiliteColor', '#FFF59D')}
          title="Highlight Yellow"
          className="w-7 h-7 rounded hover:bg-[#EDEBE9] flex items-center justify-center cursor-pointer"
        >
          <Highlighter className="w-3.5 h-3.5 text-[#C27803]" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onExecCommand('foreColor', '#0F6CBD')}
          title="Blue Font"
          className="w-7 h-7 rounded hover:bg-[#EDEBE9] flex items-center justify-center cursor-pointer font-bold text-[#0F6CBD]"
        >
          A
        </button>
      </div>

      {/* Paste Options Row (matching screenshot!) */}
      <div className="px-3 py-1.5 border-b border-[#EDEBE9]">
        <div className="text-[10.5px] text-[#605E5C] mb-1">Paste Options:</div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              onPasteFormatted();
              onClose();
            }}
            title="Keep Source Formatting"
            className="px-2 py-1 rounded border border-[#E1DFDD] hover:bg-[#CFE4FA] hover:border-[#185ABD] flex items-center gap-1 text-[11px] cursor-pointer"
          >
            <Clipboard className="w-3 h-3 text-[#C27803]" />
            <span>Keep</span>
          </button>
          <button
            type="button"
            onClick={() => {
              onPastePlain();
              onClose();
            }}
            title="Keep Text Only"
            className="px-2 py-1 rounded border border-[#E1DFDD] hover:bg-[#CFE4FA] hover:border-[#185ABD] flex items-center gap-1 text-[11px] cursor-pointer"
          >
            <Type className="w-3 h-3 text-[#484644]" />
            <span>Text Only</span>
          </button>
        </div>
      </div>

      {/* Menu Actions */}
      <div className="py-1">
        {visibleItems.map((it) => (
          <button
            key={it.id}
            type="button"
            onClick={() => {
              it.action();
              onClose();
            }}
            className="w-full px-3 py-1.5 hover:bg-[#F3F2F1] flex items-center justify-between text-left cursor-pointer"
          >
            <span className="flex items-center gap-2.5 truncate">
              {it.icon}
              <span className="truncate">{it.label}</span>
            </span>
            {it.shortcut && <span className="text-[10px] text-[#605E5C]">{it.shortcut}</span>}
          </button>
        ))}
      </div>

      {/* Contextual Table Commands */}
      {insideTable && (
        <div className="border-t border-[#EDEBE9] pt-1 mt-1">
          <div className="px-3 py-0.5 text-[10px] font-semibold text-[#185ABD] flex items-center gap-1">
            <TableIcon className="w-3 h-3" />
            <span>Table Actions</span>
          </div>
          <button
            type="button"
            onClick={() => {
              onTableAction('addRow');
              onClose();
            }}
            className="w-full px-3 py-1 text-left hover:bg-[#F3F2F1] cursor-pointer"
          >
            Insert Row Below
          </button>
          <button
            type="button"
            onClick={() => {
              onTableAction('addCol');
              onClose();
            }}
            className="w-full px-3 py-1 text-left hover:bg-[#F3F2F1] cursor-pointer"
          >
            Insert Column Right
          </button>
          <button
            type="button"
            onClick={() => {
              onTableAction('delRow');
              onClose();
            }}
            className="w-full px-3 py-1 text-left hover:bg-[#F3F2F1] text-[#A4262C] cursor-pointer"
          >
            Delete Row
          </button>
          <button
            type="button"
            onClick={() => {
              onTableAction('delCol');
              onClose();
            }}
            className="w-full px-3 py-1 text-left hover:bg-[#F3F2F1] text-[#A4262C] cursor-pointer"
          >
            Delete Column
          </button>

          <div className="border-t border-[#EDEBE9] mt-1 pt-1">
            <button
              type="button"
              disabled={selectedCellCount < 2}
              onClick={() => {
                onTableAction('mergeCells');
                onClose();
              }}
              title={
                selectedCellCount < 2
                  ? 'Select 2 or more cells to merge'
                  : `Merge ${selectedCellCount} selected cells`
              }
              className={`w-full px-3 py-1 text-left flex items-center justify-between ${
                selectedCellCount >= 2
                  ? 'hover:bg-[#F3F2F1] text-[#242424] cursor-pointer'
                  : 'text-[#A19F9D] cursor-default'
              }`}
            >
              <span className="flex items-center gap-2">
                <Combine className="w-3.5 h-3.5 text-[#185ABD]" />
                <span>
                  Merge Cells{selectedCellCount >= 2 ? ` (${selectedCellCount})` : ''}
                </span>
              </span>
            </button>

            {hasMergedCell && (
              <button
                type="button"
                onClick={() => {
                  onTableAction('unmergeCells');
                  onClose();
                }}
                className="w-full px-3 py-1 text-left hover:bg-[#F3F2F1] flex items-center gap-2 text-[#242424] cursor-pointer"
              >
                <SplitSquareHorizontal className="w-3.5 h-3.5 text-[#107C41]" />
                <span>Unmerge Cells</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                onTableAction('splitCells');
                onClose();
              }}
              className="w-full px-3 py-1 text-left hover:bg-[#F3F2F1] flex items-center gap-2 text-[#242424] cursor-pointer"
            >
              <SplitSquareHorizontal className="w-3.5 h-3.5 text-[#185ABD]" />
              <span>Split Cells...</span>
            </button>
          </div>

          <div className="border-t border-[#EDEBE9] mt-1 pt-1">
            <div className="px-3 py-0.5 text-[10px] font-semibold text-[#605E5C] truncate">
              Sort {selectedRowCount > 1 ? `${selectedRowCount} Selected Rows` : 'Rows'} by{' '}
              {activeColumnLabel || 'Column'}
            </div>
            <div className="grid grid-cols-2 gap-1 px-2 py-1">
              <button
                type="button"
                onClick={() => {
                  onTableAction('sortAlphaAsc');
                  onClose();
                }}
                title="Sort Alphabetically (A to Z)"
                className="px-2 py-1 rounded border border-[#E1DFDD] hover:bg-[#CFE4FA] hover:border-[#185ABD] flex items-center gap-1.5 text-[11px] cursor-pointer"
              >
                <ArrowDownAZ className="w-3.5 h-3.5 text-[#185ABD] shrink-0" />
                <span>A → Z</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onTableAction('sortAlphaDesc');
                  onClose();
                }}
                title="Sort Alphabetically (Z to A)"
                className="px-2 py-1 rounded border border-[#E1DFDD] hover:bg-[#CFE4FA] hover:border-[#185ABD] flex items-center gap-1.5 text-[11px] cursor-pointer"
              >
                <ArrowUpZA className="w-3.5 h-3.5 text-[#185ABD] shrink-0" />
                <span>Z → A</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onTableAction('sortNumAsc');
                  onClose();
                }}
                title="Sort Numerically (Smallest to Largest)"
                className="px-2 py-1 rounded border border-[#E1DFDD] hover:bg-[#CFE4FA] hover:border-[#185ABD] flex items-center gap-1.5 text-[11px] cursor-pointer"
              >
                <ArrowDown01 className="w-3.5 h-3.5 text-[#107C41] shrink-0" />
                <span>0 → 9</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onTableAction('sortNumDesc');
                  onClose();
                }}
                title="Sort Numerically (Largest to Smallest)"
                className="px-2 py-1 rounded border border-[#E1DFDD] hover:bg-[#CFE4FA] hover:border-[#185ABD] flex items-center gap-1.5 text-[11px] cursor-pointer"
              >
                <ArrowUp10 className="w-3.5 h-3.5 text-[#107C41] shrink-0" />
                <span>9 → 0</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
