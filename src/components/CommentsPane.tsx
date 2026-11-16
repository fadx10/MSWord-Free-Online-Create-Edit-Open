import React, { useState } from 'react';
import { Check, MessageSquarePlus, RotateCcw, Trash2, X } from 'lucide-react';
import { DocumentComment } from '../types/word';

interface CommentsPaneProps {
  comments: DocumentComment[];
  onAddComment: (text: string) => void;
  onToggleResolve: (id: string) => void;
  onDeleteComment: (id: string) => void;
  onClose: () => void;
}

export const CommentsPane: React.FC<CommentsPaneProps> = ({
  comments,
  onAddComment,
  onToggleResolve,
  onDeleteComment,
  onClose,
}) => {
  const [draft, setDraft] = useState('');

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
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={2}
          placeholder="Add a comment (uses selected text if any)..."
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
            No comments yet. Highlight text in the document or write a review note above.
          </div>
        ) : (
          comments.map((c) => (
            <div
              key={c.id}
              className={`bg-white border rounded p-3 transition-opacity ${
                c.resolved ? 'border-[#E1DFDD] opacity-70' : 'border-[#D2D0CE]'
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
                    onClick={() => onToggleResolve(c.id)}
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
                    onClick={() => onDeleteComment(c.id)}
                    title="Delete comment"
                    className="p-1 rounded hover:bg-[#EDEBE9] text-[#A4262C] cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {c.quote && (
                <div className="text-[11px] text-[#605E5C] bg-[#FAF9F8] px-2 py-1 rounded mb-1.5 truncate border border-[#EDEBE9]">
                  “{c.quote}”
                </div>
              )}

              <p className="text-xs text-[#242424] whitespace-pre-wrap">{c.text}</p>

              <div className="mt-1.5 text-[10px] text-[#605E5C] flex items-center justify-between">
                <span>{c.createdAt}</span>
                {c.resolved && <span className="text-[#107C41] font-medium">Resolved</span>}
              </div>
            </div>
          ))
        )}
      </div>
    </aside>
  );
};
