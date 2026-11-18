import React, { useEffect, useRef, useState } from 'react';
import { Check, Highlighter, MessageSquarePlus, RotateCcw, Trash2, X } from 'lucide-react';
import { DocumentComment } from '../types/word';

interface CommentsPaneProps {
  comments: DocumentComment[];
  activeCommentId?: string | null;
  pendingQuote?: string;
  onAddComment: (text: string) => void;
  onSelectComment?: (id: string) => void;
  onToggleResolve: (id: string) => void;
  onDeleteComment: (id: string) => void;
  onClose: () => void;
}

export const CommentsPane: React.FC<CommentsPaneProps> = ({
  comments,
  activeCommentId = null,
  pendingQuote = '',
  onAddComment,
  onSelectComment,
  onToggleResolve,
  onDeleteComment,
  onClose,
}) => {
  const [draft, setDraft] = useState('');
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (!activeCommentId) return;
    const cardEl = cardRefs.current[activeCommentId];
    if (cardEl) {
      cardEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [activeCommentId, comments.length]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    onAddComment(draft.trim());
    setDraft('');
  };

  return (
    <aside className="no-print w-72 bg-[#FAF9F8] border-l border-[#D2D0CE] flex flex-col shrink-0 select-none">
      <div className="h-9 px-3 flex items-center justify-between border-b border-[#E1DFDD]">
        <span className="text-xs font-semibold text-[#242424]">
          Comments ({comments.length})
        </span>
        <button
          type="button"
          onClick={onClose}
          title="Close Comments"
          className="p-1 rounded hover:bg-[#E1DFDD] text-[#605E5C] cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Add new comment */}
      <form onSubmit={handleSubmit} className="p-3 border-b border-[#E1DFDD] bg-white">
        {pendingQuote && (
          <div
            title={pendingQuote}
            className="mb-2 px-2 py-1 rounded bg-[#FFFBEB] border border-[#FDE68A] border-l-2 border-l-[#F59E0B] text-[11px] text-[#78350F] flex items-center gap-1.5"
          >
            <Highlighter className="w-3 h-3 text-[#D97706] shrink-0" />
            <span className="truncate">“{pendingQuote}”</span>
          </div>
        )}
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={2}
          placeholder={
            pendingQuote
              ? 'Comment on selected text...'
              : 'Add a comment (select text in doc to highlight)...'
          }
          className="w-full p-2 text-xs border border-[#C8C6C4] focus:border-[#185ABD] rounded outline-none resize-none"
        />
        <div className="flex justify-end mt-1.5">
          <button
            type="submit"
            disabled={!draft.trim()}
            className="h-7 px-3 rounded bg-[#185ABD] hover:bg-[#104A9E] text-white text-xs font-semibold flex items-center gap-1.5 disabled:opacity-40 cursor-pointer"
          >
            <MessageSquarePlus className="w-3.5 h-3.5" />
            <span>Post</span>
          </button>
        </div>
      </form>

      {/* Comments Thread List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 office-scroll">
        {comments.length === 0 ? (
          <div className="text-xs text-[#605E5C] text-center py-8 px-2">
            No comments yet. Select text in the document or write a review note above.
          </div>
        ) : (
          comments.map((c) => {
            const isActive = activeCommentId === c.id;
            return (
              <div
                key={c.id}
                ref={(el) => {
                  cardRefs.current[c.id] = el;
                }}
                onClick={() => onSelectComment?.(c.id)}
                className={`rounded p-3 transition-all cursor-pointer border ${
                  isActive
                    ? 'bg-[#F8FBFF] border-[#185ABD] ring-2 ring-[#185ABD]/20 shadow-xs'
                    : c.resolved
                      ? 'bg-white border-[#E1DFDD] opacity-75 hover:opacity-100'
                      : 'bg-white border-[#D2D0CE] hover:border-[#A19F9D]'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="w-5 h-5 rounded-full bg-[#185ABD] text-white text-[10px] font-semibold flex items-center justify-center shrink-0">
                      {c.author.slice(0, 2).toUpperCase()}
                    </span>
                    <span className="text-xs font-semibold text-[#242424] truncate">
                      {c.author}
                    </span>
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleResolve(c.id);
                      }}
                      title={c.resolved ? 'Reopen comment' : 'Resolve comment'}
                      className="p-1 rounded hover:bg-[#EDEBE9] text-[#107C41] cursor-pointer"
                    >
                      {c.resolved ? (
                        <RotateCcw className="w-3.5 h-3.5" />
                      ) : (
                        <Check className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteComment(c.id);
                      }}
                      title="Delete comment"
                      className="p-1 rounded hover:bg-[#EDEBE9] text-[#A4262C] cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {c.quote && (
                  <div
                    title="Click to jump to highlighted text"
                    className={`text-[11px] px-2 py-1 rounded mb-1.5 truncate border ${
                      c.resolved
                        ? 'text-[#64748B] bg-[#F8FAFC] border-[#E2E8F0] border-l-2 border-l-[#94A3B8]'
                        : 'text-[#78350F] bg-[#FFFBEB]/80 border-[#FDE68A] border-l-2 border-l-[#F59E0B]'
                    }`}
                  >
                    “{c.quote}”
                  </div>
                )}

                <p className="text-xs text-[#242424] whitespace-pre-wrap">{c.text}</p>

                <div className="mt-1.5 text-[10px] text-[#605E5C] flex items-center justify-between">
                  <span>{c.createdAt}</span>
                  <div className="flex items-center gap-2">
                    {isActive && (
                      <span className="text-[#185ABD] font-medium">Selected</span>
                    )}
                    {c.resolved && (
                      <span className="text-[#107C41] font-medium">Resolved</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};
