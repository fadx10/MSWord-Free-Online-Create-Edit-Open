import React, { useEffect, useRef, useState } from 'react';
import { Check, Eraser, X } from 'lucide-react';
import { DocumentStats } from '../types/word';
import { SpellingIssue } from '../utils/editorHelpers';

interface ModalShellProps {
  title: string;
  onClose: () => void;
  widthClass?: string;
  children: React.ReactNode;
}

const ModalShell: React.FC<ModalShellProps> = ({
  title,
  onClose,
  widthClass = 'max-w-md',
  children,
}) => (
  <div className="no-print fixed inset-0 z-50 bg-black/35 flex items-center justify-center p-4">
    <div
      className={`bg-white rounded-md shadow-2xl border border-[#D2D0CE] w-full ${widthClass} overflow-hidden`}
    >
      <div className="h-10 px-4 bg-[#F3F2F1] border-b border-[#E1DFDD] flex items-center justify-between">
        <h3 className="text-xs font-semibold text-[#242424]">{title}</h3>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded hover:bg-[#E1DFDD] text-[#605E5C] cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="p-4">{children}</div>
    </div>
  </div>
);

export const WordCountDialog: React.FC<{
  stats: DocumentStats;
  onClose: () => void;
}> = ({ stats, onClose }) => (
  <ModalShell title="Word Count" onClose={onClose} widthClass="max-w-xs">
    <div className="text-xs text-[#242424]">
      <div className="font-semibold mb-2">Statistics:</div>
      <div className="border border-[#E1DFDD] rounded divide-y divide-[#EDEBE9]">
        {[
          ['Pages', stats.pages],
          ['Words', stats.words],
          ['Characters (no spaces)', stats.charactersNoSpaces],
          ['Characters (with spaces)', stats.charactersWithSpaces],
          ['Paragraphs', stats.paragraphs],
          ['Lines', stats.lines],
        ].map(([label, val]) => (
          <div key={String(label)} className="flex justify-between px-3 py-2">
            <span className="text-[#605E5C]">{label}</span>
            <span className="font-semibold tabular-nums">{Number(val).toLocaleString()}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-1.5 rounded bg-[#185ABD] text-white text-xs font-semibold hover:bg-[#104A9E] cursor-pointer"
        >
          Close
        </button>
      </div>
    </div>
  </ModalShell>
);

export const LinkDialog: React.FC<{
  initialText: string;
  onInsert: (text: string, url: string) => void;
  onClose: () => void;
}> = ({ initialText, onInsert, onClose }) => {
  const [text, setText] = useState(initialText);
  const [url, setUrl] = useState('https://');

  return (
    <ModalShell title="Insert Hyperlink" onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!url.trim()) return;
          onInsert(text.trim() || url.trim(), url.trim());
          onClose();
        }}
        className="space-y-3 text-xs"
      >
        <div>
          <label className="block text-[#605E5C] mb-1">Text to display</label>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Link text"
            className="w-full h-8 px-2.5 border border-[#C8C6C4] rounded focus:border-[#185ABD] outline-none"
          />
        </div>
        <div>
          <label className="block text-[#605E5C] mb-1">Address (URL)</label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            required
            autoFocus
            className="w-full h-8 px-2.5 border border-[#C8C6C4] rounded focus:border-[#185ABD] outline-none"
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded border border-[#C8C6C4] hover:bg-[#F3F2F1] cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-1.5 rounded bg-[#185ABD] text-white font-semibold hover:bg-[#104A9E] cursor-pointer"
          >
            Insert Link
          </button>
        </div>
      </form>
    </ModalShell>
  );
};

export const DrawPadDialog: React.FC<{
  onInsertDrawing: (dataUrl: string) => void;
  onClose: () => void;
}> = ({ onInsertDrawing, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [penColor, setPenColor] = useState('#185ABD');
  const [penSize, setPenSize] = useState(3);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }, []);

  const getCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * e.currentTarget.width,
      y: ((e.clientY - rect.top) / rect.height) * e.currentTarget.height,
    };
  };

  const startDraw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const { x, y } = getCoords(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = penColor;
    ctx.lineWidth = penSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    setDrawing(true);
  };

  const moveDraw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const { x, y } = getCoords(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const endDraw = () => {
    setDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  return (
    <ModalShell title="Draw / Signature Pad" onClose={onClose} widthClass="max-w-lg">
      <div className="space-y-3 text-xs">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {['#185ABD', '#1B1A19', '#C00000', '#107C41'].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setPenColor(c)}
                className={`w-6 h-6 rounded-full border cursor-pointer ${
                  penColor === c ? 'ring-2 ring-[#185ABD] ring-offset-1' : 'border-[#C8C6C4]'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
            <select
              value={penSize}
              onChange={(e) => setPenSize(Number(e.target.value))}
              className="h-7 px-2 border border-[#C8C6C4] rounded bg-white"
            >
              <option value={2}>Fine (2px)</option>
              <option value={3}>Medium (3px)</option>
              <option value={6}>Thick (6px)</option>
            </select>
          </div>
          <button
            type="button"
            onClick={clearCanvas}
            className="px-2.5 py-1 rounded border border-[#C8C6C4] hover:bg-[#F3F2F1] flex items-center gap-1 cursor-pointer"
          >
            <Eraser className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        </div>

        <canvas
          ref={canvasRef}
          width={520}
          height={220}
          onPointerDown={startDraw}
          onPointerMove={moveDraw}
          onPointerUp={endDraw}
          onPointerLeave={endDraw}
          className="w-full border border-[#C8C6C4] rounded cursor-crosshair touch-none bg-white"
        />

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded border border-[#C8C6C4] hover:bg-[#F3F2F1] cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              const canvas = canvasRef.current;
              if (canvas) {
                onInsertDrawing(canvas.toDataURL('image/png'));
              }
              onClose();
            }}
            className="px-4 py-1.5 rounded bg-[#185ABD] text-white font-semibold hover:bg-[#104A9E] cursor-pointer"
          >
            Insert into Document
          </button>
        </div>
      </div>
    </ModalShell>
  );
};

export const WatermarkDialog: React.FC<{
  current: string;
  onApply: (text: string) => void;
  onClose: () => void;
}> = ({ current, onApply, onClose }) => {
  const [text, setText] = useState(current);

  return (
    <ModalShell title="Page Watermark" onClose={onClose} widthClass="max-w-sm">
      <div className="space-y-3 text-xs">
        <div className="grid grid-cols-2 gap-2">
          {['CONFIDENTIAL', 'DRAFT', 'DO NOT COPY', 'SAMPLE'].map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setText(preset)}
              className={`py-2 px-3 rounded border font-semibold cursor-pointer ${
                text === preset
                  ? 'bg-[#CFE4FA] border-[#185ABD] text-[#185ABD]'
                  : 'border-[#D2D0CE] hover:bg-[#F3F2F1]'
              }`}
            >
              {preset}
            </button>
          ))}
        </div>

        <div>
          <label className="block text-[#605E5C] mb-1">Custom Watermark Text</label>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Leave empty for no watermark"
            className="w-full h-8 px-2.5 border border-[#C8C6C4] rounded focus:border-[#185ABD] outline-none"
          />
        </div>

        <div className="flex justify-between pt-2">
          <button
            type="button"
            onClick={() => {
              onApply('');
              onClose();
            }}
            className="px-3 py-1.5 rounded border border-[#C8C6C4] text-[#A4262C] hover:bg-[#F3F2F1] cursor-pointer"
          >
            Remove Watermark
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded border border-[#C8C6C4] hover:bg-[#F3F2F1] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                onApply(text.trim());
                onClose();
              }}
              className="px-4 py-1.5 rounded bg-[#185ABD] text-white font-semibold hover:bg-[#104A9E] cursor-pointer"
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </ModalShell>
  );
};

export const CitationDialog: React.FC<{
  onInsert: (citationHtml: string) => void;
  onClose: () => void;
}> = ({ onInsert, onClose }) => {
  const [author, setAuthor] = useState('');
  const [year, setYear] = useState('2026');
  const [title, setTitle] = useState('');
  const [publisher, setPublisher] = useState('');

  return (
    <ModalShell title="Insert Citation (APA)" onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const formatted = `${author.trim() || 'Author'} (${year.trim() || 'n.d.'}). <em>${title.trim() || 'Untitled Source'}</em>.${publisher.trim() ? ` ${publisher.trim()}.` : ''}`;
          onInsert(`<p>${formatted}</p>`);
          onClose();
        }}
        className="space-y-3 text-xs"
      >
        <div>
          <label className="block text-[#605E5C] mb-1">Author (Last, F. M.)</label>
          <input
            type="text"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="e.g., Smith, J."
            required
            className="w-full h-8 px-2.5 border border-[#C8C6C4] rounded focus:border-[#185ABD] outline-none"
          />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-[#605E5C] mb-1">Year</label>
            <input
              type="text"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="w-full h-8 px-2.5 border border-[#C8C6C4] rounded focus:border-[#185ABD] outline-none"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-[#605E5C] mb-1">Publisher / Journal</label>
            <input
              type="text"
              value={publisher}
              onChange={(e) => setPublisher(e.target.value)}
              placeholder="Academic Press"
              className="w-full h-8 px-2.5 border border-[#C8C6C4] rounded focus:border-[#185ABD] outline-none"
            />
          </div>
        </div>
        <div>
          <label className="block text-[#605E5C] mb-1">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Document Architecture Principles"
            required
            className="w-full h-8 px-2.5 border border-[#C8C6C4] rounded focus:border-[#185ABD] outline-none"
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded border border-[#C8C6C4] hover:bg-[#F3F2F1] cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-1.5 rounded bg-[#185ABD] text-white font-semibold hover:bg-[#104A9E] cursor-pointer"
          >
            Insert Citation
          </button>
        </div>
      </form>
    </ModalShell>
  );
};

export const MailMergeDialog: React.FC<{
  onApplyMerge: (values: Record<string, string>) => void;
  onClose: () => void;
}> = ({ onApplyMerge, onClose }) => {
  const [values, setValues] = useState<Record<string, string>>({
    FirstName: 'Taylor',
    LastName: 'Morgan',
    Company: 'Contoso Ltd.',
    Email: 'taylor.morgan@contoso.com',
    Date: new Date().toLocaleDateString(),
  });

  return (
    <ModalShell title="Mail Merge — Fill & Apply Fields" onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onApplyMerge(values);
          onClose();
        }}
        className="space-y-2.5 text-xs"
      >
        <p className="text-[#605E5C]">
          Replaces matching <code className="font-mono">«Field»</code> placeholders across your document.
        </p>
        {Object.keys(values).map((key) => (
          <div key={key} className="grid grid-cols-3 items-center gap-2">
            <label className="font-mono text-[11px] text-[#185ABD]">«{key}»</label>
            <input
              type="text"
              value={values[key]}
              onChange={(e) => setValues((prev) => ({ ...prev, [key]: e.target.value }))}
              className="col-span-2 h-7 px-2 border border-[#C8C6C4] rounded focus:border-[#185ABD] outline-none"
            />
          </div>
        ))}
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded border border-[#C8C6C4] hover:bg-[#F3F2F1] cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-1.5 rounded bg-[#185ABD] text-white font-semibold hover:bg-[#104A9E] cursor-pointer"
          >
            Merge Document
          </button>
        </div>
      </form>
    </ModalShell>
  );
};

export const ProofingDialog: React.FC<{
  issues: SpellingIssue[];
  onFixIssue: (issue: SpellingIssue) => void;
  onClose: () => void;
}> = ({ issues, onFixIssue, onClose }) => (
  <ModalShell title="Spelling & Proofing Check" onClose={onClose}>
    <div className="text-xs space-y-3">
      {issues.length === 0 ? (
        <div className="py-6 text-center space-y-2">
          <div className="w-9 h-9 rounded-full bg-[#DFF6DD] text-[#107C41] flex items-center justify-center mx-auto">
            <Check className="w-5 h-5" />
          </div>
          <div className="font-semibold text-[#242424]">Proofing complete</div>
          <div className="text-[#605E5C]">No common spelling or repeated-word issues found.</div>
        </div>
      ) : (
        <div className="divide-y divide-[#EDEBE9] border border-[#E1DFDD] rounded max-h-64 overflow-y-auto">
          {issues.map((issue) => (
            <div key={issue.id} className="p-2.5 flex items-center justify-between gap-3">
              <div>
                <div className="font-semibold text-[#A4262C]">{issue.word}</div>
                <div className="text-[11px] text-[#605E5C]">
                  {issue.reason} → <span className="font-semibold text-[#107C41]">{issue.suggestion}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onFixIssue(issue)}
                className="px-2.5 py-1 rounded bg-[#185ABD] text-white font-medium hover:bg-[#104A9E] cursor-pointer shrink-0"
              >
                Change
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-1.5 rounded border border-[#C8C6C4] hover:bg-[#F3F2F1] cursor-pointer"
        >
          Done
        </button>
      </div>
    </div>
  </ModalShell>
);

export const SplitCellsDialog: React.FC<{
  selectedCount: number;
  initialCols: number;
  initialRows: number;
  onSplit: (cols: number, rows: number) => void;
  onClose: () => void;
}> = ({ selectedCount, initialCols, initialRows, onSplit, onClose }) => {
  const [cols, setCols] = useState(Math.max(1, initialCols));
  const [rows, setRows] = useState(Math.max(1, initialRows));

  return (
    <ModalShell title="Split Cells" onClose={onClose} widthClass="max-w-xs">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSplit(cols, rows);
          onClose();
        }}
        className="space-y-3 text-xs text-[#242424]"
      >
        <p className="text-[#605E5C]">
          Split {selectedCount > 1 ? `${selectedCount} selected cells` : 'the active cell'} into:
        </p>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[#605E5C] mb-1">Number of columns</label>
            <input
              type="number"
              min={1}
              max={8}
              value={cols}
              onChange={(e) => setCols(Math.max(1, Math.min(8, Number(e.target.value) || 1)))}
              className="w-full h-8 px-2.5 border border-[#C8C6C4] rounded focus:border-[#185ABD] outline-none tabular-nums"
            />
          </div>
          <div>
            <label className="block text-[#605E5C] mb-1">Number of rows</label>
            <input
              type="number"
              min={1}
              max={8}
              value={rows}
              onChange={(e) => setRows(Math.max(1, Math.min(8, Number(e.target.value) || 1)))}
              className="w-full h-8 px-2.5 border border-[#C8C6C4] rounded focus:border-[#185ABD] outline-none tabular-nums"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded border border-[#C8C6C4] hover:bg-[#F3F2F1] cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-1.5 rounded bg-[#185ABD] text-white font-semibold hover:bg-[#104A9E] cursor-pointer"
          >
            Split
          </button>
        </div>
      </form>
    </ModalShell>
  );
};

