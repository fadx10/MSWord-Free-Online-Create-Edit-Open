import React, { useMemo, useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  ChevronsDownUp,
  ChevronsUpDown,
  Heading1,
  Heading2,
  ListTree,
  Search,
  X,
} from 'lucide-react';
import { HeadingOutlineItem } from '../types/word';

interface DocumentOutlinePaneProps {
  headings: HeadingOutlineItem[];
  activeHeadingId: string | null;
  onJumpToHeading: (id: string) => void;
  onInsertSampleHeading?: (level: 'h1' | 'h2') => void;
  onClose: () => void;
}

interface OutlineTreeNode {
  item: HeadingOutlineItem;
  children: OutlineTreeNode[];
}

function buildOutlineTree(headings: HeadingOutlineItem[]): OutlineTreeNode[] {
  const roots: OutlineTreeNode[] = [];
  const stack: OutlineTreeNode[] = [];

  headings.forEach((item) => {
    const node: OutlineTreeNode = { item, children: [] };
    while (stack.length > 0 && stack[stack.length - 1].item.level >= item.level) {
      stack.pop();
    }
    if (stack.length === 0) {
      roots.push(node);
    } else {
      stack[stack.length - 1].children.push(node);
    }
    stack.push(node);
  });

  return roots;
}

const LEVEL_BADGE_CLASSES: Record<HeadingOutlineItem['level'], string> = {
  1: 'bg-[#EBF3FC] text-[#0F6CBD] border-[#CFE4FA]',
  2: 'bg-[#F3F2F1] text-[#323130] border-[#E1DFDD]',
  3: 'bg-[#FAF9F8] text-[#605E5C] border-[#E1DFDD]',
  4: 'bg-[#FAF9F8] text-[#8A8886] border-[#EDEBE9]',
};

export const DocumentOutlinePane: React.FC<DocumentOutlinePaneProps> = ({
  headings,
  activeHeadingId,
  onJumpToHeading,
  onInsertSampleHeading,
  onClose,
}) => {
  const [filterQuery, setFilterQuery] = useState('');
  const [maxDepth, setMaxDepth] = useState<1 | 2 | 3 | 4>(4);
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(() => new Set());

  const depthFilteredHeadings = useMemo(
    () => headings.filter((h) => h.level <= maxDepth),
    [headings, maxDepth]
  );

  const tree = useMemo(
    () => buildOutlineTree(depthFilteredHeadings),
    [depthFilteredHeadings]
  );

  const collapsibleIds = useMemo(() => {
    const ids: string[] = [];
    const walk = (nodes: OutlineTreeNode[]) => {
      nodes.forEach((n) => {
        if (n.children.length > 0) {
          ids.push(n.item.id);
          walk(n.children);
        }
      });
    };
    walk(tree);
    return ids;
  }, [tree]);

  const isSearching = filterQuery.trim().length > 0;
  const searchFilteredHeadings = useMemo(() => {
    const q = filterQuery.trim().toLowerCase();
    if (!q) return [];
    return depthFilteredHeadings.filter((h) => h.text.toLowerCase().includes(q));
  }, [depthFilteredHeadings, filterQuery]);

  const toggleCollapse = (id: string) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => setCollapsedIds(new Set());
  const collapseAll = () => setCollapsedIds(new Set(collapsibleIds));

  const renderTreeNodes = (nodes: OutlineTreeNode[], depth = 0): React.ReactNode => {
    return (
      <ul
        role={depth === 0 ? 'tree' : 'group'}
        className={depth > 0 ? 'ml-3 pl-1.5 border-l border-[#E1DFDD] space-y-0.5' : 'space-y-0.5'}
      >
        {nodes.map((node) => {
          const { item, children } = node;
          const hasChildren = children.length > 0;
          const isCollapsed = collapsedIds.has(item.id);
          const isActive = activeHeadingId === item.id;
          const label = item.tagLabel || `H${item.level}`;

          return (
            <li
              key={item.id}
              role="treeitem"
              aria-expanded={hasChildren ? !isCollapsed : undefined}
              aria-selected={isActive}
            >
              <div
                className={`group flex items-center gap-1 rounded transition-colors ${
                  isActive
                    ? 'bg-[#EBF3FC] text-[#0F6CBD] border-l-2 border-[#185ABD]'
                    : 'text-[#242424] hover:bg-[#EDEBE9]'
                }`}
              >
                {hasChildren ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleCollapse(item.id);
                    }}
                    title={isCollapsed ? 'Expand subheadings' : 'Collapse subheadings'}
                    aria-label={isCollapsed ? `Expand ${item.text}` : `Collapse ${item.text}`}
                    className="w-5 h-6 flex items-center justify-center text-[#605E5C] hover:text-[#185ABD] shrink-0 cursor-pointer rounded"
                  >
                    {isCollapsed ? (
                      <ChevronRight className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>
                ) : (
                  <span className="w-5 shrink-0 flex items-center justify-center">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isActive ? 'bg-[#185ABD]' : 'bg-[#C8C6C4]'
                      }`}
                    />
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => onJumpToHeading(item.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowLeft' && hasChildren && !isCollapsed) {
                      e.preventDefault();
                      toggleCollapse(item.id);
                    } else if (e.key === 'ArrowRight' && hasChildren && isCollapsed) {
                      e.preventDefault();
                      toggleCollapse(item.id);
                    }
                  }}
                  title={`Jump to "${item.text}"`}
                  className="flex-1 min-w-0 py-1.5 pr-1.5 text-left flex items-center justify-between gap-1.5 cursor-pointer"
                >
                  <span
                    className={`truncate text-xs ${
                      item.level === 1
                        ? 'font-semibold'
                        : item.level === 2
                          ? 'font-medium'
                          : 'font-normal text-[11.5px]'
                    } ${isActive ? 'text-[#0F6CBD]' : 'group-hover:text-[#185ABD]'}`}
                  >
                    {item.text}
                  </span>
                  <span
                    className={`px-1 py-0 rounded border text-[9.5px] font-medium shrink-0 ${LEVEL_BADGE_CLASSES[item.level]}`}
                  >
                    {label}
                  </span>
                </button>
              </div>

              {hasChildren && !isCollapsed && renderTreeNodes(children, depth + 1)}
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <aside
      aria-label="Document Outline"
      className="no-print w-64 sm:w-72 bg-[#FAF9F8] border-r border-[#D2D0CE] flex flex-col shrink-0 select-none"
    >
      {/* Header */}
      <div className="h-9 px-3 flex items-center justify-between border-b border-[#E1DFDD] bg-[#F3F2F1]">
        <div className="flex items-center gap-1.5 min-w-0">
          <ListTree className="w-3.5 h-3.5 text-[#185ABD] shrink-0" />
          <span className="text-xs font-semibold text-[#242424] truncate">
            Document Outline
          </span>
          <span className="px-1.5 py-0.5 rounded-full bg-white border border-[#E1DFDD] text-[10px] font-medium text-[#605E5C] tabular-nums shrink-0">
            {headings.length}
          </span>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          {collapsibleIds.length > 0 && (
            <>
              <button
                type="button"
                onClick={expandAll}
                title="Expand all sections"
                aria-label="Expand all sections"
                className="p-1 rounded hover:bg-[#E1DFDD] text-[#605E5C] cursor-pointer"
              >
                <ChevronsUpDown className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={collapseAll}
                title="Collapse all sections"
                aria-label="Collapse all sections"
                className="p-1 rounded hover:bg-[#E1DFDD] text-[#605E5C] cursor-pointer"
              >
                <ChevronsDownUp className="w-3.5 h-3.5" />
              </button>
            </>
          )}
          <button
            type="button"
            onClick={onClose}
            title="Close Document Outline"
            aria-label="Close Document Outline"
            className="p-1 rounded hover:bg-[#E1DFDD] text-[#605E5C] cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Filter & Depth Toolbar */}
      <div className="p-2.5 border-b border-[#E1DFDD] space-y-2 bg-white">
        <div className="flex items-center bg-[#FAF9F8] border border-[#D2D0CE] focus-within:border-[#185ABD] focus-within:bg-white rounded px-2 h-7">
          <Search className="w-3 h-3 text-[#605E5C] mr-1.5 shrink-0" />
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Filter headings..."
            aria-label="Filter headings"
            className="w-full text-xs outline-none bg-transparent"
          />
          {filterQuery && (
            <button
              type="button"
              onClick={() => setFilterQuery('')}
              aria-label="Clear heading filter"
              className="p-0.5 rounded hover:bg-[#EDEBE9] text-[#605E5C] cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        <div className="flex items-center justify-between gap-1 text-[10.5px]">
          <span className="text-[#605E5C] font-medium">Levels:</span>
          <div className="flex items-center gap-1">
            {(
              [
                { depth: 4, label: 'All' },
                { depth: 1, label: 'H1' },
                { depth: 2, label: '≤ H2' },
                { depth: 3, label: '≤ H3' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.depth}
                type="button"
                onClick={() => setMaxDepth(opt.depth)}
                className={`px-1.5 py-0.5 rounded font-medium cursor-pointer transition-colors ${
                  maxDepth === opt.depth
                    ? 'bg-[#185ABD] text-white'
                    : 'bg-[#F3F2F1] text-[#484644] hover:bg-[#E1DFDD]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Outline Hierarchy Body */}
      <div className="flex-1 overflow-y-auto p-2.5 office-scroll">
        {headings.length === 0 ? (
          <div className="bg-white border border-[#E1DFDD] rounded p-3 text-xs text-[#605E5C] space-y-2.5">
            <p className="leading-relaxed">
              No headings detected yet. Apply <strong>Title</strong>,{' '}
              <strong>Heading 1</strong>, <strong>Heading 2</strong>, or{' '}
              <strong>Heading 3</strong> styles to build an interactive document hierarchy.
            </p>
            {onInsertSampleHeading && (
              <div className="flex flex-col gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => onInsertSampleHeading('h1')}
                  className="w-full py-1.5 px-2.5 rounded border border-[#D2D0CE] bg-[#FAF9F8] hover:bg-[#EBF3FC] hover:border-[#185ABD] text-[#185ABD] font-medium flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Heading1 className="w-3.5 h-3.5" />
                  <span>Insert Heading 1</span>
                </button>
                <button
                  type="button"
                  onClick={() => onInsertSampleHeading('h2')}
                  className="w-full py-1.5 px-2.5 rounded border border-[#D2D0CE] bg-[#FAF9F8] hover:bg-[#EBF3FC] hover:border-[#185ABD] text-[#185ABD] font-medium flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Heading2 className="w-3.5 h-3.5" />
                  <span>Insert Heading 2</span>
                </button>
              </div>
            )}
          </div>
        ) : isSearching ? (
          searchFilteredHeadings.length === 0 ? (
            <div className="text-xs text-[#605E5C] p-3 text-center">
              No headings match "{filterQuery}"
            </div>
          ) : (
            <ul className="space-y-0.5">
              {searchFilteredHeadings.map((item) => {
                const isActive = activeHeadingId === item.id;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => onJumpToHeading(item.id)}
                      style={{ paddingLeft: `${(item.level - 1) * 10 + 8}px` }}
                      className={`w-full py-1.5 pr-2 text-left rounded flex items-center justify-between gap-1.5 cursor-pointer transition-colors ${
                        isActive
                          ? 'bg-[#EBF3FC] text-[#0F6CBD] border-l-2 border-[#185ABD]'
                          : 'text-[#242424] hover:bg-[#EDEBE9] hover:text-[#185ABD]'
                      }`}
                    >
                      <span className="truncate text-xs font-medium">{item.text}</span>
                      <span
                        className={`px-1 py-0 rounded border text-[9.5px] font-medium shrink-0 ${LEVEL_BADGE_CLASSES[item.level]}`}
                      >
                        {item.tagLabel || `H${item.level}`}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )
        ) : depthFilteredHeadings.length === 0 ? (
          <div className="text-xs text-[#605E5C] p-3 text-center">
            No headings at level ≤ H{maxDepth}. Switch to <strong>All</strong> to view deeper subheadings.
          </div>
        ) : (
          renderTreeNodes(tree)
        )}
      </div>

      {/* Footer Tip */}
      {headings.length > 0 && (
        <div className="px-3 py-1.5 border-t border-[#E1DFDD] bg-[#F3F2F1] text-[10.5px] text-[#605E5C] flex items-center justify-between">
          <span>Click any heading to jump</span>
          <span className="tabular-nums">
            {depthFilteredHeadings.length}/{headings.length} shown
          </span>
        </div>
      )}
    </aside>
  );
};
