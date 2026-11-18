import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Check,
  Eraser,
  Search,
  X,
} from 'lucide-react';
import {
  DocumentStats,
  PageNumberAlignment,
  PageNumberConfig,
  PageNumberDisplayStyle,
  PageNumberFormat,
  PageNumberPlacement,
} from '../types/word';
import {
  buildPageNumberTokenString,
  formatPageNumber,
  resolvePageNumberPlaceholders,
  SpellingIssue,
} from '../utils/editorHelpers';

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

export type SymbolCategory = 'all' | 'math' | 'currency' | 'emoji' | 'typography';

interface SymbolEntry {
  char: string;
  name: string;
  category: Exclude<SymbolCategory, 'all'>;
  keywords: string;
}

const SYMBOL_CATALOG: SymbolEntry[] = [
  // Mathematical Symbols
  { char: '+', name: 'Plus Sign', category: 'math', keywords: 'add addition positive sum' },
  { char: '−', name: 'Minus Sign', category: 'math', keywords: 'subtract subtraction negative' },
  { char: '×', name: 'Multiplication Sign', category: 'math', keywords: 'multiply times cross product' },
  { char: '÷', name: 'Division Sign', category: 'math', keywords: 'divide division obelus' },
  { char: '±', name: 'Plus-Minus Sign', category: 'math', keywords: 'plus minus tolerance margin' },
  { char: '∓', name: 'Minus-or-Plus Sign', category: 'math', keywords: 'minus plus' },
  { char: '=', name: 'Equals Sign', category: 'math', keywords: 'equal equals equation' },
  { char: '≠', name: 'Not Equal To', category: 'math', keywords: 'not equal unequal' },
  { char: '≈', name: 'Almost Equal To', category: 'math', keywords: 'approximately roughly tilde' },
  { char: '≡', name: 'Identical To', category: 'math', keywords: 'congruent equivalent identical' },
  { char: '≤', name: 'Less-Than or Equal To', category: 'math', keywords: 'less than equal inequality' },
  { char: '≥', name: 'Greater-Than or Equal To', category: 'math', keywords: 'greater than equal inequality' },
  { char: '<', name: 'Less-Than Sign', category: 'math', keywords: 'less smaller angle' },
  { char: '>', name: 'Greater-Than Sign', category: 'math', keywords: 'greater larger angle' },
  { char: '≪', name: 'Much Less-Than', category: 'math', keywords: 'much smaller' },
  { char: '≫', name: 'Much Greater-Than', category: 'math', keywords: 'much larger' },
  { char: '∞', name: 'Infinity', category: 'math', keywords: 'infinity endless forever' },
  { char: '√', name: 'Square Root', category: 'math', keywords: 'radical sqrt root' },
  { char: '∛', name: 'Cube Root', category: 'math', keywords: 'radical cube root' },
  { char: '∑', name: 'N-Ary Summation', category: 'math', keywords: 'sum sigma total series' },
  { char: '∏', name: 'N-Ary Product', category: 'math', keywords: 'product pi capital' },
  { char: '∫', name: 'Integral', category: 'math', keywords: 'integral calculus antiderivative' },
  { char: '∬', name: 'Double Integral', category: 'math', keywords: 'double integral calculus' },
  { char: '∮', name: 'Contour Integral', category: 'math', keywords: 'contour closed integral' },
  { char: '∂', name: 'Partial Differential', category: 'math', keywords: 'partial derivative calculus' },
  { char: '∇', name: 'Nabla / Del', category: 'math', keywords: 'gradient divergence curl vector' },
  { char: '∆', name: 'Increment / Delta', category: 'math', keywords: 'delta change difference triangle' },
  { char: 'π', name: 'Greek Small Letter Pi', category: 'math', keywords: 'pi circle 3.14 constant' },
  { char: 'θ', name: 'Greek Small Letter Theta', category: 'math', keywords: 'theta angle' },
  { char: 'α', name: 'Greek Small Letter Alpha', category: 'math', keywords: 'alpha greek' },
  { char: 'β', name: 'Greek Small Letter Beta', category: 'math', keywords: 'beta greek' },
  { char: 'γ', name: 'Greek Small Letter Gamma', category: 'math', keywords: 'gamma greek' },
  { char: 'λ', name: 'Greek Small Letter Lambda', category: 'math', keywords: 'lambda wavelength' },
  { char: 'μ', name: 'Micro / Mu', category: 'math', keywords: 'mu micro mean' },
  { char: 'σ', name: 'Greek Small Letter Sigma', category: 'math', keywords: 'sigma standard deviation' },
  { char: 'φ', name: 'Greek Small Letter Phi', category: 'math', keywords: 'phi golden ratio angle' },
  { char: 'ω', name: 'Greek Small Letter Omega', category: 'math', keywords: 'omega angular frequency' },
  { char: 'Ω', name: 'Ohm / Capital Omega', category: 'math', keywords: 'ohm resistance omega' },
  { char: '°', name: 'Degree Sign', category: 'math', keywords: 'degree temperature angle celsius' },
  { char: '′', name: 'Prime', category: 'math', keywords: 'prime feet minutes derivative' },
  { char: '″', name: 'Double Prime', category: 'math', keywords: 'double prime inches seconds' },
  { char: '‰', name: 'Per Mille Sign', category: 'math', keywords: 'per mille permille thousandth' },
  { char: '∠', name: 'Angle', category: 'math', keywords: 'angle geometry' },
  { char: '⊥', name: 'Perpendicular / Up Tack', category: 'math', keywords: 'perpendicular orthogonal' },
  { char: '∥', name: 'Parallel To', category: 'math', keywords: 'parallel lines geometry' },
  { char: '∩', name: 'Intersection', category: 'math', keywords: 'set intersection and' },
  { char: '∪', name: 'Union', category: 'math', keywords: 'set union or' },
  { char: '∈', name: 'Element Of', category: 'math', keywords: 'in member set' },
  { char: '∉', name: 'Not an Element Of', category: 'math', keywords: 'not in member set' },
  { char: '⊂', name: 'Subset Of', category: 'math', keywords: 'subset set' },
  { char: '⊆', name: 'Subset of or Equal To', category: 'math', keywords: 'subset equal' },
  { char: '∀', name: 'For All', category: 'math', keywords: 'universal quantifier logic' },
  { char: '∃', name: 'There Exists', category: 'math', keywords: 'existential quantifier logic' },
  { char: '∴', name: 'Therefore', category: 'math', keywords: 'therefore logic proof' },
  { char: '∵', name: 'Because', category: 'math', keywords: 'because since logic proof' },
  { char: '∝', name: 'Proportional To', category: 'math', keywords: 'proportional varies' },
  { char: '¹', name: 'Superscript One', category: 'math', keywords: 'power 1 exponent' },
  { char: '²', name: 'Superscript Two', category: 'math', keywords: 'squared power 2 exponent' },
  { char: '³', name: 'Superscript Three', category: 'math', keywords: 'cubed power 3 exponent' },
  { char: '½', name: 'Vulgar Fraction One Half', category: 'math', keywords: 'half 1/2 fraction' },
  { char: '⅓', name: 'Vulgar Fraction One Third', category: 'math', keywords: 'third 1/3 fraction' },
  { char: '⅔', name: 'Vulgar Fraction Two Thirds', category: 'math', keywords: 'two thirds 2/3 fraction' },
  { char: '¼', name: 'Vulgar Fraction One Quarter', category: 'math', keywords: 'quarter fourth 1/4 fraction' },
  { char: '¾', name: 'Vulgar Fraction Three Quarters', category: 'math', keywords: 'three quarters 3/4 fraction' },

  // Currency Signs
  { char: '$', name: 'Dollar Sign', category: 'currency', keywords: 'dollar usd currency money price' },
  { char: '€', name: 'Euro Sign', category: 'currency', keywords: 'euro eur europe currency money' },
  { char: '£', name: 'Pound Sign', category: 'currency', keywords: 'pound sterling gbp uk currency money' },
  { char: '¥', name: 'Yen / Yuan Sign', category: 'currency', keywords: 'yen yuan jpy cny japan china currency' },
  { char: '₹', name: 'Indian Rupee Sign', category: 'currency', keywords: 'rupee inr india currency' },
  { char: '₩', name: 'Won Sign', category: 'currency', keywords: 'won krw korea currency' },
  { char: '₽', name: 'Ruble Sign', category: 'currency', keywords: 'ruble rub russia currency' },
  { char: '₺', name: 'Turkish Lira Sign', category: 'currency', keywords: 'lira try turkey currency' },
  { char: '₴', name: 'Hryvnia Sign', category: 'currency', keywords: 'hryvnia uah ukraine currency' },
  { char: '₦', name: 'Naira Sign', category: 'currency', keywords: 'naira ngn nigeria currency' },
  { char: '₱', name: 'Peso Sign', category: 'currency', keywords: 'peso php philippines currency' },
  { char: '฿', name: 'Thai Baht Sign', category: 'currency', keywords: 'baht thb thailand currency' },
  { char: '₫', name: 'Dong Sign', category: 'currency', keywords: 'dong vnd vietnam currency' },
  { char: '₪', name: 'New Sheqel Sign', category: 'currency', keywords: 'shekel ils israel currency' },
  { char: '₡', name: 'Colon Sign', category: 'currency', keywords: 'colon crc currency' },
  { char: '₣', name: 'French Franc Sign', category: 'currency', keywords: 'franc currency' },
  { char: '¢', name: 'Cent Sign', category: 'currency', keywords: 'cent penny coin currency' },
  { char: '₿', name: 'Bitcoin Sign', category: 'currency', keywords: 'bitcoin btc crypto currency' },
  { char: '₮', name: 'Tugrik Sign', category: 'currency', keywords: 'tugrik mnt mongolia currency' },
  { char: '₸', name: 'Tenge Sign', category: 'currency', keywords: 'tenge kzt kazakhstan currency' },
  { char: '₾', name: 'Lari Sign', category: 'currency', keywords: 'lari gel georgia currency' },
  { char: '₵', name: 'Cedi Sign', category: 'currency', keywords: 'cedi ghs ghana currency' },
  { char: '¤', name: 'Currency Sign', category: 'currency', keywords: 'generic currency scarab' },

  // Emojis
  { char: '😀', name: 'Grinning Face', category: 'emoji', keywords: 'smile happy face grin' },
  { char: '😊', name: 'Smiling Face with Smiling Eyes', category: 'emoji', keywords: 'smile blush happy warm' },
  { char: '😂', name: 'Face with Tears of Joy', category: 'emoji', keywords: 'laugh lol funny joy' },
  { char: '😍', name: 'Smiling Face with Heart-Eyes', category: 'emoji', keywords: 'love heart adore' },
  { char: '🥳', name: 'Partying Face', category: 'emoji', keywords: 'party celebrate birthday' },
  { char: '🤔', name: 'Thinking Face', category: 'emoji', keywords: 'think hmm consider question' },
  { char: '😎', name: 'Smiling Face with Sunglasses', category: 'emoji', keywords: 'cool sunglasses awesome' },
  { char: '👍', name: 'Thumbs Up', category: 'emoji', keywords: 'approve like yes good ok' },
  { char: '👎', name: 'Thumbs Down', category: 'emoji', keywords: 'dislike no bad' },
  { char: '👏', name: 'Clapping Hands', category: 'emoji', keywords: 'clap applause congrats bravo' },
  { char: '🙏', name: 'Folded Hands', category: 'emoji', keywords: 'please thank thanks' },
  { char: '🤝', name: 'Handshake', category: 'emoji', keywords: 'deal agreement partner welcome' },
  { char: '❤️', name: 'Red Heart', category: 'emoji', keywords: 'heart love favorite' },
  { char: '⭐', name: 'Star', category: 'emoji', keywords: 'star rating favorite highlight' },
  { char: '🔥', name: 'Fire', category: 'emoji', keywords: 'fire hot trending flame' },
  { char: '✨', name: 'Sparkles', category: 'emoji', keywords: 'sparkle magic clean new' },
  { char: '🎉', name: 'Party Popper', category: 'emoji', keywords: 'party celebrate confetti hooray' },
  { char: '🚀', name: 'Rocket', category: 'emoji', keywords: 'rocket launch ship fast growth' },
  { char: '💡', name: 'Light Bulb', category: 'emoji', keywords: 'idea tip insight smart' },
  { char: '📌', name: 'Pushpin', category: 'emoji', keywords: 'pin important notice memo' },
  { char: '📎', name: 'Paperclip', category: 'emoji', keywords: 'attach attachment clip file' },
  { char: '📝', name: 'Memo', category: 'emoji', keywords: 'note write edit memo document' },
  { char: '📅', name: 'Calendar', category: 'emoji', keywords: 'date schedule calendar event' },
  { char: '⏰', name: 'Alarm Clock', category: 'emoji', keywords: 'time deadline clock reminder' },
  { char: '✅', name: 'Check Mark Button', category: 'emoji', keywords: 'check done complete yes verified' },
  { char: '❌', name: 'Cross Mark', category: 'emoji', keywords: 'x no error cancel wrong' },
  { char: '⚠️', name: 'Warning', category: 'emoji', keywords: 'warning caution alert attention' },
  { char: '❓', name: 'Red Question Mark', category: 'emoji', keywords: 'question help faq' },
  { char: '❗', name: 'Exclamation Mark', category: 'emoji', keywords: 'important alert exclamation' },
  { char: '📊', name: 'Bar Chart', category: 'emoji', keywords: 'chart graph stats report data' },
  { char: '📈', name: 'Chart Increasing', category: 'emoji', keywords: 'growth up trend profit chart' },
  { char: '📉', name: 'Chart Decreasing', category: 'emoji', keywords: 'down decline loss chart' },
  { char: '💼', name: 'Briefcase', category: 'emoji', keywords: 'business work office job' },
  { char: '🔒', name: 'Locked', category: 'emoji', keywords: 'lock security private' },
  { char: '🔑', name: 'Key', category: 'emoji', keywords: 'key access password unlock' },
  { char: '🌍', name: 'Globe Europe-Africa', category: 'emoji', keywords: 'world earth global international' },
  { char: '🏆', name: 'Trophy', category: 'emoji', keywords: 'trophy winner award prize' },
  { char: '🎯', name: 'Direct Hit / Target', category: 'emoji', keywords: 'goal target objective bullseye' },
  { char: '💬', name: 'Speech Balloon', category: 'emoji', keywords: 'comment chat message talk' },
  { char: '📣', name: 'Megaphone', category: 'emoji', keywords: 'announce announcement update' },

  // Arrows & Typography
  { char: '©', name: 'Copyright Sign', category: 'typography', keywords: 'copyright legal ip' },
  { char: '®', name: 'Registered Sign', category: 'typography', keywords: 'registered trademark' },
  { char: '™', name: 'Trade Mark Sign', category: 'typography', keywords: 'trademark tm brand' },
  { char: '§', name: 'Section Sign', category: 'typography', keywords: 'section law clause' },
  { char: '¶', name: 'Pilcrow Sign', category: 'typography', keywords: 'paragraph pilcrow' },
  { char: '•', name: 'Bullet', category: 'typography', keywords: 'bullet dot list' },
  { char: '◦', name: 'White Bullet', category: 'typography', keywords: 'hollow bullet circle' },
  { char: '–', name: 'En Dash', category: 'typography', keywords: 'en dash range hyphen' },
  { char: '—', name: 'Em Dash', category: 'typography', keywords: 'em dash punctuation break' },
  { char: '…', name: 'Horizontal Ellipsis', category: 'typography', keywords: 'ellipsis dots three' },
  { char: '†', name: 'Dagger', category: 'typography', keywords: 'dagger footnote reference' },
  { char: '‡', name: 'Double Dagger', category: 'typography', keywords: 'double dagger footnote' },
  { char: '←', name: 'Leftwards Arrow', category: 'typography', keywords: 'arrow left back' },
  { char: '→', name: 'Rightwards Arrow', category: 'typography', keywords: 'arrow right next forward' },
  { char: '↑', name: 'Upwards Arrow', category: 'typography', keywords: 'arrow up' },
  { char: '↓', name: 'Downwards Arrow', category: 'typography', keywords: 'arrow down' },
  { char: '↔', name: 'Left Right Arrow', category: 'typography', keywords: 'arrow both bidirectional' },
  { char: '↕', name: 'Up Down Arrow', category: 'typography', keywords: 'arrow vertical' },
  { char: '⇒', name: 'Rightwards Double Arrow', category: 'typography', keywords: 'implies arrow double' },
  { char: '⇐', name: 'Leftwards Double Arrow', category: 'typography', keywords: 'arrow double left' },
  { char: '⇔', name: 'Left Right Double Arrow', category: 'typography', keywords: 'iff equivalence double arrow' },
  { char: '✓', name: 'Check Mark', category: 'typography', keywords: 'check tick yes' },
  { char: '✔', name: 'Heavy Check Mark', category: 'typography', keywords: 'check tick bold yes' },
  { char: '✗', name: 'Ballot X', category: 'typography', keywords: 'cross no fail' },
  { char: '★', name: 'Black Star', category: 'typography', keywords: 'star filled rating' },
  { char: '☆', name: 'White Star', category: 'typography', keywords: 'star outline rating' },
  { char: '♠', name: 'Spade Suit', category: 'typography', keywords: 'spade card suit' },
  { char: '♥', name: 'Heart Suit', category: 'typography', keywords: 'heart card suit' },
  { char: '♦', name: 'Diamond Suit', category: 'typography', keywords: 'diamond card suit' },
  { char: '♣', name: 'Club Suit', category: 'typography', keywords: 'club card suit' },
];

const SYMBOL_CATEGORIES: { id: SymbolCategory; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'math', label: 'Math' },
  { id: 'currency', label: 'Currency' },
  { id: 'emoji', label: 'Emojis' },
  { id: 'typography', label: 'Arrows & Text' },
];

function formatCodePoint(char: string): string {
  const cp = char.codePointAt(0);
  if (cp === undefined) return '';
  return `U+${cp.toString(16).toUpperCase().padStart(4, '0')}`;
}

export const InsertSymbolDialog: React.FC<{
  onInsert: (symbol: string) => void;
  onClose: () => void;
}> = ({ onInsert, onClose }) => {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<SymbolCategory>('all');
  const [keepOpen, setKeepOpen] = useState(false);
  const [hoveredSymbol, setHoveredSymbol] = useState<SymbolEntry | null>(SYMBOL_CATALOG[0]);
  const [recentChars, setRecentChars] = useState<string[]>(() => {
    try {
      const saved = sessionStorage.getItem('word_online_recent_symbols');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed.slice(0, 12);
      }
    } catch {
      // Ignore storage access errors
    }
    return ['±', '×', '÷', '€', '£', '¥', '✅', '🚀'];
  });

  const filteredSymbols = useMemo(() => {
    const q = query.trim().toLowerCase();
    return SYMBOL_CATALOG.filter((entry) => {
      if (category !== 'all' && entry.category !== category) return false;
      if (!q) return true;
      return (
        entry.char.toLowerCase().includes(q) ||
        entry.name.toLowerCase().includes(q) ||
        entry.keywords.toLowerCase().includes(q) ||
        entry.category.toLowerCase().includes(q)
      );
    });
  }, [category, query]);

  const categoryCounts = useMemo(() => {
    const counts: Record<SymbolCategory, number> = {
      all: SYMBOL_CATALOG.length,
      math: 0,
      currency: 0,
      emoji: 0,
      typography: 0,
    };
    SYMBOL_CATALOG.forEach((entry) => {
      counts[entry.category] += 1;
    });
    return counts;
  }, []);

  const handleSelectSymbol = (entry: SymbolEntry) => {
    onInsert(entry.char);
    setRecentChars((prev) => {
      const next = [entry.char, ...prev.filter((c) => c !== entry.char)].slice(0, 12);
      try {
        sessionStorage.setItem('word_online_recent_symbols', JSON.stringify(next));
      } catch {
        // Ignore storage errors
      }
      return next;
    });
    if (!keepOpen) {
      onClose();
    }
  };

  const recentEntries = useMemo(
    () =>
      recentChars
        .map((c) => SYMBOL_CATALOG.find((item) => item.char === c))
        .filter((item): item is SymbolEntry => Boolean(item)),
    [recentChars]
  );

  return (
    <ModalShell title="Insert Symbol" onClose={onClose} widthClass="max-w-xl">
      <div className="space-y-3 text-xs text-[#242424]">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-[#605E5C] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search symbols, math, currency, emojis (e.g., pi, euro, rocket, arrow)..."
            autoFocus
            className="w-full h-8 pl-8 pr-8 border border-[#C8C6C4] rounded focus:border-[#185ABD] outline-none text-xs"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Clear symbol search"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-[#EDEBE9] text-[#605E5C] cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 border-b border-[#E1DFDD] pb-2">
          {SYMBOL_CATEGORIES.map((cat) => {
            const active = category === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.id)}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#185ABD] text-white'
                    : 'bg-[#F3F2F1] text-[#323130] hover:bg-[#E1DFDD]'
                }`}
              >
                {cat.label}{' '}
                <span className={active ? 'text-white/80' : 'text-[#605E5C]'}>
                  ({categoryCounts[cat.id]})
                </span>
              </button>
            );
          })}
        </div>

        {/* Recently Used Row (hidden during active search to keep results focused) */}
        {!query.trim() && category === 'all' && recentEntries.length > 0 && (
          <div>
            <div className="text-[11px] font-semibold text-[#605E5C] mb-1">Recently used</div>
            <div className="flex flex-wrap gap-1">
              {recentEntries.map((entry) => (
                <button
                  key={`recent-${entry.char}`}
                  type="button"
                  title={`${entry.name} (${formatCodePoint(entry.char)})`}
                  onMouseEnter={() => setHoveredSymbol(entry)}
                  onClick={() => handleSelectSymbol(entry)}
                  className="w-8 h-8 rounded border border-[#E1DFDD] bg-[#FAF9F8] hover:bg-[#CFE4FA] hover:border-[#185ABD] text-base flex items-center justify-center cursor-pointer transition-colors"
                >
                  {entry.char}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Searchable Symbol Grid */}
        {filteredSymbols.length === 0 ? (
          <div className="h-52 border border-dashed border-[#D2D0CE] rounded flex flex-col items-center justify-center text-[#605E5C] gap-1">
            <span className="font-medium">No symbols matched "{query}"</span>
            <span className="text-[11px]">
              Try terms like "sum", "dollar", "euro", "smile", "check", or "arrow".
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-8 sm:grid-cols-10 gap-1.5 max-h-60 overflow-y-auto pr-1">
            {filteredSymbols.map((entry) => (
              <button
                key={`${entry.category}-${entry.char}-${entry.name}`}
                type="button"
                title={`${entry.name} (${formatCodePoint(entry.char)})`}
                onMouseEnter={() => setHoveredSymbol(entry)}
                onFocus={() => setHoveredSymbol(entry)}
                onClick={() => handleSelectSymbol(entry)}
                className="h-9 rounded border border-[#E1DFDD] bg-white hover:bg-[#CFE4FA] hover:border-[#185ABD] text-base flex items-center justify-center cursor-pointer transition-colors"
              >
                {entry.char}
              </button>
            ))}
          </div>
        )}

        {/* Footer Preview + Keep Open + Close */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#E1DFDD]">
          <div className="flex items-center gap-2.5 min-w-0">
            {hoveredSymbol ? (
              <>
                <div className="w-9 h-9 rounded border border-[#D2D0CE] bg-[#FAF9F8] flex items-center justify-center text-lg shrink-0">
                  {hoveredSymbol.char}
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-[#242424] truncate">
                    {hoveredSymbol.name}
                  </div>
                  <div className="text-[11px] text-[#605E5C]">
                    {formatCodePoint(hoveredSymbol.char)} · Click any symbol to insert
                  </div>
                </div>
              </>
            ) : (
              <span className="text-[11px] text-[#605E5C]">Click any symbol to insert</span>
            )}
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <label className="flex items-center gap-1.5 text-[11px] text-[#484644] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={keepOpen}
                onChange={(e) => setKeepOpen(e.target.checked)}
                className="rounded border-[#C8C6C4] accent-[#185ABD]"
              />
              <span>Keep open</span>
            </label>
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded border border-[#C8C6C4] hover:bg-[#F3F2F1] font-medium cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </ModalShell>
  );
};

const PAGE_NUMBER_FORMAT_OPTIONS: Array<{
  value: PageNumberFormat;
  label: string;
  sample: string;
}> = [
  { value: 'decimal', label: '1, 2, 3, ...', sample: '1, 2, 3' },
  { value: 'romanLower', label: 'i, ii, iii, ...', sample: 'i, ii, iii' },
  { value: 'romanUpper', label: 'I, II, III, ...', sample: 'I, II, III' },
  { value: 'alphaLower', label: 'a, b, c, ...', sample: 'a, b, c' },
  { value: 'alphaUpper', label: 'A, B, C, ...', sample: 'A, B, C' },
];

const PAGE_NUMBER_STYLE_OPTIONS: Array<{
  value: PageNumberDisplayStyle;
  label: string;
}> = [
  { value: 'numberOnly', label: 'Plain Number' },
  { value: 'pageOnly', label: 'Page Label' },
  { value: 'pageOfTotal', label: 'Page X of Y' },
  { value: 'dashWrapped', label: 'Dashed' },
];

export const PageNumberDialog: React.FC<{
  initialConfig: PageNumberConfig;
  totalPages: number;
  onApply: (config: PageNumberConfig) => void;
  onRemove: () => void;
  onClose: () => void;
}> = ({ initialConfig, totalPages, onApply, onRemove, onClose }) => {
  const [placement, setPlacement] = useState<PageNumberPlacement>(initialConfig.placement);
  const [alignment, setAlignment] = useState<PageNumberAlignment>(initialConfig.alignment);
  const [numberFormat, setNumberFormat] = useState<PageNumberFormat>(initialConfig.numberFormat);
  const [displayStyle, setDisplayStyle] = useState<PageNumberDisplayStyle>(
    initialConfig.displayStyle
  );
  const [startAtInput, setStartAtInput] = useState<string>(String(initialConfig.startAt || 1));
  const [showOnFirstPage, setShowOnFirstPage] = useState<boolean>(
    initialConfig.showOnFirstPage
  );
  const [previewPage, setPreviewPage] = useState<1 | 2>(1);

  const parsedStartAt = Math.max(1, Math.min(9999, Math.floor(Number(startAtInput) || 1)));

  const currentConfig: PageNumberConfig = {
    enabled: true,
    placement,
    alignment,
    numberFormat,
    displayStyle,
    startAt: parsedStartAt,
    showOnFirstPage,
  };

  const previewSample = useMemo(() => {
    const token = buildPageNumberTokenString(displayStyle);
    const effectiveTotal = Math.max(totalPages, 3);
    return resolvePageNumberPlaceholders(token, previewPage, effectiveTotal, currentConfig);
  }, [currentConfig, displayStyle, previewPage, totalPages]);

  const sequencePreview = useMemo(() => {
    return [0, 1, 2]
      .map((offset) => formatPageNumber(parsedStartAt + offset, numberFormat))
      .join(', ');
  }, [numberFormat, parsedStartAt]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onApply(currentConfig);
    onClose();
  };

  const previewAlignClass =
    alignment === 'left'
      ? 'justify-start text-left'
      : alignment === 'right'
        ? 'justify-end text-right'
        : 'justify-center text-center';

  return (
    <ModalShell title="Page Numbers" onClose={onClose} widthClass="max-w-xl">
      <form onSubmit={handleSubmit} className="space-y-4 text-xs text-[#242424]">
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_168px] gap-4 items-start">
          {/* Left Controls */}
          <div className="space-y-3.5">
            {/* Placement */}
            <div>
              <label className="block text-[11px] font-semibold text-[#484644] mb-1.5">
                Position (Placement)
              </label>
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#F3F2F1] rounded border border-[#E1DFDD]">
                {(
                  [
                    { id: 'top', label: 'Top of Page (Header)' },
                    { id: 'bottom', label: 'Bottom of Page (Footer)' },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setPlacement(opt.id)}
                    className={`py-1.5 px-2.5 rounded text-[11px] font-medium transition-colors cursor-pointer whitespace-nowrap ${
                      placement === opt.id
                        ? 'bg-white text-[#185ABD] shadow-xs border border-[#D2D0CE]'
                        : 'text-[#484644] hover:text-[#242424]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Alignment */}
            <div>
              <label className="block text-[11px] font-semibold text-[#484644] mb-1.5">
                Alignment
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(
                  [
                    { id: 'left', label: 'Left', icon: AlignLeft },
                    { id: 'center', label: 'Center', icon: AlignCenter },
                    { id: 'right', label: 'Right', icon: AlignRight },
                  ] as const
                ).map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setAlignment(id)}
                    className={`h-8 px-2.5 rounded border flex items-center justify-center gap-1.5 text-[11px] font-medium transition-colors cursor-pointer ${
                      alignment === id
                        ? 'bg-[#CFE4FA]/65 border-[#185ABD] text-[#185ABD]'
                        : 'border-[#C8C6C4] bg-white text-[#323130] hover:bg-[#F3F2F1]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Display Style */}
            <div>
              <label className="block text-[11px] font-semibold text-[#484644] mb-1.5">
                Display Style
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {PAGE_NUMBER_STYLE_OPTIONS.map((opt) => {
                  const sampleText = resolvePageNumberPlaceholders(
                    buildPageNumberTokenString(opt.value),
                    1,
                    Math.max(totalPages, 3),
                    { ...currentConfig, showOnFirstPage: true }
                  );
                  const active = displayStyle === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setDisplayStyle(opt.value)}
                      className={`px-2.5 py-2 rounded border text-left transition-colors cursor-pointer ${
                        active
                          ? 'bg-[#CFE4FA]/65 border-[#185ABD] text-[#185ABD]'
                          : 'border-[#C8C6C4] bg-white hover:bg-[#FAF9F8]'
                      }`}
                    >
                      <div className="text-[11px] font-semibold leading-tight">{opt.label}</div>
                      <div className="text-[11px] text-[#605E5C] mt-0.5 tabular-nums truncate">
                        {sampleText}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Number Format + Starting Number */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label
                  htmlFor="page-number-format"
                  className="block text-[11px] font-semibold text-[#484644] mb-1"
                >
                  Number format
                </label>
                <select
                  id="page-number-format"
                  value={numberFormat}
                  onChange={(e) => setNumberFormat(e.target.value as PageNumberFormat)}
                  className="w-full h-8 px-2 border border-[#C8C6C4] rounded bg-white text-xs focus:border-[#185ABD] outline-none"
                >
                  {PAGE_NUMBER_FORMAT_OPTIONS.map((fmt) => (
                    <option key={fmt.value} value={fmt.value}>
                      {fmt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="page-number-start-at"
                  className="block text-[11px] font-semibold text-[#484644] mb-1"
                >
                  Start at
                </label>
                <input
                  id="page-number-start-at"
                  type="number"
                  min={1}
                  max={9999}
                  value={startAtInput}
                  onChange={(e) => setStartAtInput(e.target.value)}
                  onBlur={() => setStartAtInput(String(parsedStartAt))}
                  className="w-full h-8 px-2.5 border border-[#C8C6C4] rounded focus:border-[#185ABD] outline-none tabular-nums"
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-0.5">
              <label className="flex items-center gap-2 text-[11px] text-[#323130] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showOnFirstPage}
                  onChange={(e) => setShowOnFirstPage(e.target.checked)}
                  className="rounded border-[#C8C6C4] accent-[#185ABD]"
                />
                <span>Show number on first page</span>
              </label>
              <span className="text-[11px] text-[#605E5C] tabular-nums">
                {sequencePreview}, ...
              </span>
            </div>
          </div>

          {/* Right Live Page Preview */}
          <div className="bg-[#F3F2F1] border border-[#E1DFDD] rounded p-3 flex flex-col items-center">
            <div className="w-full flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-[#484644]">Preview</span>
              <div className="flex items-center gap-1 bg-white border border-[#D2D0CE] rounded p-0.5">
                <button
                  type="button"
                  onClick={() => setPreviewPage(1)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-medium cursor-pointer ${
                    previewPage === 1 ? 'bg-[#185ABD] text-white' : 'text-[#605E5C]'
                  }`}
                >
                  P1
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewPage(2)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-medium cursor-pointer ${
                    previewPage === 2 ? 'bg-[#185ABD] text-white' : 'text-[#605E5C]'
                  }`}
                >
                  P2
                </button>
              </div>
            </div>

            <div className="w-32 h-44 bg-white border border-[#C8C6C4] shadow-sm rounded-[2px] p-2.5 flex flex-col justify-between">
              {/* Header Zone */}
              <div
                className={`min-h-4 flex items-center text-[9px] tabular-nums px-1 rounded ${previewAlignClass} ${
                  placement === 'top'
                    ? previewSample
                      ? 'bg-[#CFE4FA]/70 text-[#104A9E] font-semibold'
                      : 'bg-[#FAF9F8] text-[#8A8886] italic'
                    : 'text-transparent'
                }`}
              >
                {placement === 'top' ? previewSample || 'Hidden on P1' : '—'}
              </div>

              {/* Body Skeleton */}
              <div className="space-y-1.5 my-auto px-0.5">
                <div className="h-1.5 w-3/4 bg-[#E1DFDD] rounded-xs" />
                <div className="h-1 w-full bg-[#EDEBE9] rounded-xs" />
                <div className="h-1 w-11/12 bg-[#EDEBE9] rounded-xs" />
                <div className="h-1 w-full bg-[#EDEBE9] rounded-xs" />
                <div className="h-1 w-4/5 bg-[#EDEBE9] rounded-xs" />
                <div className="h-1 w-full bg-[#EDEBE9] rounded-xs mt-2" />
                <div className="h-1 w-2/3 bg-[#EDEBE9] rounded-xs" />
              </div>

              {/* Footer Zone */}
              <div
                className={`min-h-4 flex items-center text-[9px] tabular-nums px-1 rounded ${previewAlignClass} ${
                  placement === 'bottom'
                    ? previewSample
                      ? 'bg-[#CFE4FA]/70 text-[#104A9E] font-semibold'
                      : 'bg-[#FAF9F8] text-[#8A8886] italic'
                    : 'text-transparent'
                }`}
              >
                {placement === 'bottom' ? previewSample || 'Hidden on P1' : '—'}
              </div>
            </div>

            <div className="mt-2 text-[10.5px] text-[#605E5C] text-center">
              {placement === 'top' ? 'Header' : 'Footer'} · {alignment}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#E1DFDD]">
          <button
            type="button"
            onClick={() => {
              onRemove();
              onClose();
            }}
            className="px-3 py-1.5 rounded border border-[#C8C6C4] text-[#A4262C] hover:bg-[#F3F2F1] cursor-pointer"
          >
            Remove Page Numbers
          </button>

          <div className="flex items-center gap-2">
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
              Apply
            </button>
          </div>
        </div>
      </form>
    </ModalShell>
  );
};



