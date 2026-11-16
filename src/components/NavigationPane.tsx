import React from 'react';
import { ChevronDown, ChevronUp, Replace, Search, X } from 'lucide-react';
import { HeadingOutlineItem } from '../types/word';

interface NavigationPaneProps {
  activeSubTab: 'outline' | 'find' | 'replace';
  onSubTabChange: (tab: 'outline' | 'find' | 'replace') => void;
  headings: HeadingOutlineItem[];
  onJumpToHeading: (id: string) => void;
  findQuery: string;
  onFindQueryChange: (q: string) => void;
  replaceQuery: string;
  onReplaceQueryChange: (q: string) => void;
  caseSensitive: boolean;
  onCaseSensitiveChange: (val: boolean) => void;
  matchCount: number;
  activeMatchIndex: number;
  onFindNext: (direction: 1 | -1) => void;
  onReplaceOne: () => void;
  onReplaceAll: () => void;
  onClose: () => void;
}

export const NavigationPane: React.FC<NavigationPaneProps> = ({
  activeSubTab,
  onSubTabChange,
  headings,
  onJumpToHeading,
  findQuery,
  onFindQueryChange,
  replaceQuery,
  onReplaceQueryChange,
  caseSensitive,
  onCaseSensitiveChange,
  matchCount,
  activeMatchIndex,
  onFindNext,
  onReplaceOne,
  onReplaceAll,
  onClose,
}) => {
  return (
    <aside className="no-print w-64 bg-[#FAF9F8] border-r border-[#D2D0CE] flex flex-col shrink-0 select-none">
      <div className="h-9 px-3 flex items-center justify-between border-b border-[#E1DFDD]">
        <span className="text-xs font-semibold text-[#242424]">Navigation</span>
        <button
          type="button"
          onClick={onClose}
          title="Close Navigation Pane"
          className="p-1 rounded hover:bg-[#E1DFDD] text-[#605E5C] cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Sub-tabs */}
      <div className="flex border-b border-[#E1DFDD] bg-[#F3F2F1] text-xs">
        <button
          type="button"
          onClick={() => onSubTabChange('outline')}
          className={`flex-1 py-2 font-medium cursor-pointer transition-colors ${
            activeSubTab === 'outline'
              ? 'bg-white text-[#185ABD] border-b-2 border-[#185ABD]'
              : 'text-[#605E5C] hover:text-[#242424]'
          }`}
        >
          Headings
        </button>
        <button
          type="button"
          onClick={() => onSubTabChange('find')}
          className={`flex-1 py-2 font-medium cursor-pointer transition-colors ${
            activeSubTab === 'find'
              ? 'bg-white text-[#185ABD] border-b-2 border-[#185ABD]'
              : 'text-[#605E5C] hover:text-[#242424]'
          }`}
        >
          Find
        </button>
        <button
          type="button"
          onClick={() => onSubTabChange('replace')}
          className={`flex-1 py-2 font-medium cursor-pointer transition-colors ${
            activeSubTab === 'replace'
              ? 'bg-white text-[#185ABD] border-b-2 border-[#185ABD]'
              : 'text-[#605E5C] hover:text-[#242424]'
          }`}
        >
          Replace
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 office-scroll">
        {activeSubTab === 'outline' && (
          <div>
            {headings.length === 0 ? (
              <div className="text-xs text-[#605E5C] leading-relaxed p-2">
                Add headings (Heading 1, Heading 2, or Heading 3) from the Home Styles gallery to build an outline of your document.
              </div>
            ) : (
              <ul className="space-y-1">
                {headings.map((h) => (
                  <li key={h.id}>
                    <button
                      type="button"
                      onClick={() => onJumpToHeading(h.id)}
                      style={{ paddingLeft: `${(h.level - 1) * 12 + 8}px` }}
                      className="w-full py-1.5 pr-2 text-left text-xs text-[#242424] hover:bg-[#EDEBE9] hover:text-[#185ABD] rounded truncate cursor-pointer transition-colors"
                    >
                      {h.text}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {(activeSubTab === 'find' || activeSubTab === 'replace') && (
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] text-[#605E5C] mb-1">Find in document</label>
              <div className="flex items-center bg-white border border-[#C8C6C4] focus-within:border-[#185ABD] rounded px-2 h-8">
                <Search className="w-3.5 h-3.5 text-[#605E5C] mr-1.5 shrink-0" />
                <input
                  type="text"
                  value={findQuery}
                  onChange={(e) => onFindQueryChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      onFindNext(e.shiftKey ? -1 : 1);
                    }
                  }}
                  placeholder="Search text..."
                  className="w-full text-xs outline-none bg-transparent"
                />
              </div>
              <div className="mt-2 flex items-center justify-between gap-2 rounded border border-[#E1DFDD] bg-white px-2.5 py-1.5 text-[11px]">
                <span
                  role="status"
                  aria-live="polite"
                  className={`tabular-nums truncate ${
                    findQuery.trim() && matchCount > 0
                      ? 'font-medium text-[#242424]'
                      : 'text-[#605E5C]'
                  }`}
                >
                  {findQuery.trim()
                    ? matchCount > 0
                      ? `${Math.min(activeMatchIndex + 1, matchCount)} of ${matchCount} ${matchCount === 1 ? 'result' : 'results'}`
                      : '0 results'
                    : 'Type to search'}
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => onFindNext(-1)}
                    disabled={matchCount === 0}
                    aria-label="Previous"
                    title="Previous (Shift+Enter)"
                    className="h-6 px-1.5 rounded border border-[#D2D0CE] bg-[#FAF9F8] hover:bg-[#EDEBE9] text-[#242424] flex items-center gap-0.5 disabled:opacity-40 disabled:cursor-default cursor-pointer transition-colors"
                  >
                    <ChevronUp className="w-3 h-3" />
                    <span className="text-[10.5px] font-medium">Prev</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onFindNext(1)}
                    disabled={matchCount === 0}
                    aria-label="Next"
                    title="Next (Enter)"
                    className="h-6 px-1.5 rounded border border-[#D2D0CE] bg-[#FAF9F8] hover:bg-[#EDEBE9] text-[#242424] flex items-center gap-0.5 disabled:opacity-40 disabled:cursor-default cursor-pointer transition-colors"
                  >
                    <span className="text-[10.5px] font-medium">Next</span>
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            <label className="flex items-center gap-2 text-[11px] text-[#605E5C] cursor-pointer">
              <input
                type="checkbox"
                checked={caseSensitive}
                onChange={(e) => onCaseSensitiveChange(e.target.checked)}
                className="accent-[#185ABD]"
              />
              <span>Match case</span>
            </label>

            {activeSubTab === 'replace' && (
              <div className="pt-2 border-t border-[#E1DFDD] space-y-2.5">
                <div>
                  <label className="block text-[11px] text-[#605E5C] mb-1">Replace with</label>
                  <div className="flex items-center bg-white border border-[#C8C6C4] focus-within:border-[#185ABD] rounded px-2 h-8">
                    <Replace className="w-3.5 h-3.5 text-[#605E5C] mr-1.5 shrink-0" />
                    <input
                      type="text"
                      value={replaceQuery}
                      onChange={(e) => onReplaceQueryChange(e.target.value)}
                      placeholder="Replacement text..."
                      className="w-full text-xs outline-none bg-transparent"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onReplaceOne}
                    disabled={!findQuery.trim() || matchCount === 0}
                    className="flex-1 h-7 rounded border border-[#C8C6C4] bg-white hover:bg-[#F3F2F1] text-xs font-medium disabled:opacity-40 cursor-pointer"
                  >
                    Replace
                  </button>
                  <button
                    type="button"
                    onClick={onReplaceAll}
                    disabled={!findQuery.trim() || matchCount === 0}
                    className="flex-1 h-7 rounded bg-[#185ABD] hover:bg-[#104A9E] text-white text-xs font-medium disabled:opacity-40 cursor-pointer"
                  >
                    Replace All
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
