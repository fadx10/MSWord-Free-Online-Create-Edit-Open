import React, { useState } from 'react';
import {
  ArrowDown,
  ArrowDownUp,
  ArrowUp,
  Bookmark,
  Check,
  MapPin,
  Pencil,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { FootnoteItem } from '../utils/footnoteHelpers';

interface FootnotesPaneProps {
  footnotes: FootnoteItem[];
  onInsertFootnote: (text: string) => void;
  onUpdateFootnote: (id: string, text: string) => void;
  onMoveFootnote: (id: string, direction: -1 | 1) => void;
  onSyncOrder: () => void;
  onRemoveFootnote: (id: string) => void;
  onLocateFootnote: (id: string) => void;
  onClose: () => void;
}

export const FootnotesPane: React.FC<FootnotesPaneProps> = ({
  footnotes,
  onInsertFootnote,
  onUpdateFootnote,
  onMoveFootnote,
  onSyncOrder,
  onRemoveFootnote,
  onLocateFootnote,
  onClose,
}) => {
  const [draft, setDraft] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  const handleInsert = (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim() || 'Enter footnote citation here.';
    onInsertFootnote(text);
    setDraft('');
  };

  const startEditing = (item: FootnoteItem) => {
    setEditingId(item.id);
    setEditingText(item.text);
  };

  const saveEdit = () => {
    if (!editingId) return;
    const trimmed = editingText.trim();
    if (trimmed) {
      onUpdateFootnote(editingId, trimmed);
    }
    setEditingId(null);
    setEditingText('');
  };

  return (
    <aside
      aria-label="Footnotes Manager"
      className="no-print w-72 sm:w-80 bg-[#FAF9F8] border-l border-[#D2D0CE] flex flex-col shrink-0 select-none"
    >
      {/* Header */}
      <div className="h-9 px-3 flex items-center justify-between border-b border-[#E1DFDD] bg-[#F3F2F1]">
        <div className="flex items-center gap-1.5 min-w-0">
          <Bookmark className="w-3.5 h-3.5 text-[#107C41] shrink-0" />
          <span className="text-xs font-semibold text-[#242424] truncate">
            Footnotes ({footnotes.length})
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {footnotes.length >= 2 && (
            <button
              type="button"
              onClick={onSyncOrder}
              title="Order footnotes by appearance in document text"
              className="px-1.5 py-0.5 rounded border border-[#D2D0CE] bg-white hover:bg-[#EDEBE9] text-[10.5px] font-medium text-[#242424] flex items-center gap-1 cursor-pointer"
            >
              <ArrowDownUp className="w-3 h-3 text-[#185ABD]" />
              <span>Sync Order</span>
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            title="Close Footnotes Manager"
            aria-label="Close Footnotes Manager"
            className="p-1 rounded hover:bg-[#E1DFDD] text-[#605E5C] cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Quick Insert New Footnote */}
      <form onSubmit={handleInsert} className="p-3 border-b border-[#E1DFDD] bg-white">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={2}
          placeholder="Type footnote citation or reference note..."
          className="w-full p-2 text-xs border border-[#C8C6C4] focus:border-[#185ABD] rounded outline-none resize-none"
        />
        <div className="flex items-center justify-between gap-2 mt-1.5">
          <span className="text-[10.5px] text-[#605E5C]">
            Inserts [{footnotes.length + 1}] at cursor
          </span>
          <button
            type="submit"
            className="h-7 px-3 rounded bg-[#185ABD] hover:bg-[#104A9E] text-white text-xs font-semibold flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Footnote</span>
          </button>
        </div>
      </form>

      {/* Footnotes List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 office-scroll">
        {footnotes.length === 0 ? (
          <div className="bg-white border border-[#E1DFDD] rounded p-4 text-xs text-[#605E5C] text-center space-y-1.5">
            <p className="font-medium text-[#242424]">No footnotes in this document</p>
            <p className="leading-relaxed">
              Add a footnote above or via <strong>References → Insert Footnote</strong>.
              You can edit, reorder, locate, and remove them here.
            </p>
          </div>
        ) : (
          footnotes.map((fn, idx) => {
            const isEditing = editingId === fn.id;
            const isFirst = idx === 0;
            const isLast = idx === footnotes.length - 1;

            return (
              <div
                key={fn.id}
                className="bg-white border border-[#D2D0CE] rounded p-2.5 space-y-2"
              >
                {/* Top Card Row: Badge + Actions */}
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => onLocateFootnote(fn.id)}
                    title="Jump to citation marker in document"
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#EBF3FC] hover:bg-[#CFE4FA] text-[#0F6CBD] text-[11px] font-semibold cursor-pointer transition-colors"
                  >
                    <span>[{fn.number}]</span>
                    <MapPin className="w-3 h-3" />
                  </button>

                  <div className="flex items-center gap-0.5">
                    <button
                      type="button"
                      disabled={isFirst}
                      onClick={() => onMoveFootnote(fn.id, -1)}
                      title="Move footnote up"
                      aria-label={`Move footnote ${fn.number} up`}
                      className="p-1 rounded hover:bg-[#EDEBE9] text-[#484644] disabled:opacity-35 disabled:cursor-default cursor-pointer"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={isLast}
                      onClick={() => onMoveFootnote(fn.id, 1)}
                      title="Move footnote down"
                      aria-label={`Move footnote ${fn.number} down`}
                      className="p-1 rounded hover:bg-[#EDEBE9] text-[#484644] disabled:opacity-35 disabled:cursor-default cursor-pointer"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => (isEditing ? saveEdit() : startEditing(fn))}
                      title={isEditing ? 'Save footnote' : 'Edit footnote text'}
                      aria-label={
                        isEditing
                          ? `Save footnote ${fn.number}`
                          : `Edit footnote ${fn.number}`
                      }
                      className="p-1 rounded hover:bg-[#EDEBE9] text-[#185ABD] cursor-pointer"
                    >
                      {isEditing ? (
                        <Check className="w-3.5 h-3.5 text-[#107C41]" />
                      ) : (
                        <Pencil className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (isEditing) {
                          setEditingId(null);
                          setEditingText('');
                        }
                        onRemoveFootnote(fn.id);
                      }}
                      title="Remove footnote and citation marker"
                      aria-label={`Remove footnote ${fn.number}`}
                      className="p-1 rounded hover:bg-[#EDEBE9] text-[#A4262C] cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Context Snippet */}
                {fn.contextSnippet && (
                  <button
                    type="button"
                    onClick={() => onLocateFootnote(fn.id)}
                    title="Click to locate reference in document"
                    className="w-full text-left text-[11px] text-[#605E5C] bg-[#FAF9F8] hover:bg-[#F3F2F1] px-2 py-1 rounded border border-[#EDEBE9] truncate cursor-pointer"
                  >
                    {fn.contextSnippet}
                  </button>
                )}

                {/* Footnote Text or Inline Editor */}
                {isEditing ? (
                  <div className="space-y-1.5">
                    <textarea
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      onKeyDown={(e) => {
                        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                          e.preventDefault();
                          saveEdit();
                        } else if (e.key === 'Escape') {
                          e.preventDefault();
                          setEditingId(null);
                          setEditingText('');
                        }
                      }}
                      rows={3}
                      autoFocus
                      className="w-full p-2 text-xs border border-[#185ABD] rounded outline-none resize-y"
                    />
                    <div className="flex justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(null);
                          setEditingText('');
                        }}
                        className="px-2.5 py-1 rounded border border-[#C8C6C4] hover:bg-[#F3F2F1] text-[11px] cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={saveEdit}
                        className="px-2.5 py-1 rounded bg-[#185ABD] hover:bg-[#104A9E] text-white text-[11px] font-semibold cursor-pointer"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <p
                    onClick={() => startEditing(fn)}
                    title="Click to edit footnote text"
                    className="text-xs text-[#242424] whitespace-pre-wrap leading-relaxed cursor-text hover:bg-[#FAF9F8] rounded px-1 py-0.5 -mx-1"
                  >
                    {fn.text || (
                      <span className="italic text-[#8A8886]">(Empty footnote — click to edit)</span>
                    )}
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>

      {footnotes.length > 0 && (
        <div className="px-3 py-1.5 border-t border-[#E1DFDD] bg-[#F3F2F1] text-[10.5px] text-[#605E5C] flex items-center justify-between">
          <span>Click text to edit · Arrows reorder</span>
          <span>Auto-numbered</span>
        </div>
      )}
    </aside>
  );
};
