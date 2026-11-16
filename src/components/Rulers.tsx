import React from 'react';
import { MARGIN_INCHES, MarginPreset } from '../types/word';

interface HorizontalRulerProps {
  pageWidthInches: number;
  margins: MarginPreset;
  zoom: number;
}

export const HorizontalRuler: React.FC<HorizontalRulerProps> = ({
  pageWidthInches,
  margins,
  zoom,
}) => {
  const pxPerInch = 96 * (zoom / 100);
  const totalWidth = pageWidthInches * pxPerInch;
  const margin = MARGIN_INCHES[margins];
  const leftMarginPx = margin.left * pxPerInch;
  const rightMarginPx = margin.right * pxPerInch;
  const printableInches = pageWidthInches - margin.left - margin.right;

  const ticks: React.ReactNode[] = [];
  const totalEighths = Math.round(pageWidthInches * 8);

  for (let i = 0; i <= totalEighths; i++) {
    const inchPos = i / 8;
    const x = inchPos * pxPerInch;
    const isWholeInch = i % 8 === 0;
    const isHalfInch = i % 4 === 0 && !isWholeInch;
    const isQuarterInch = i % 2 === 0 && !isWholeInch && !isHalfInch;

    // Relate label to printable area starting at left margin
    const relativeInch = Math.round(inchPos - margin.left);
    const showLabel =
      isWholeInch &&
      inchPos >= margin.left - 0.01 &&
      inchPos <= pageWidthInches - margin.right + 0.01 &&
      relativeInch > 0 &&
      relativeInch < printableInches;

    const tickHeight = isWholeInch ? 8 : isHalfInch ? 6 : isQuarterInch ? 4 : 2.5;

    ticks.push(
      <div
        key={i}
        style={{ left: `${x}px` }}
        className="absolute bottom-0 flex flex-col items-center pointer-events-none"
      >
        {showLabel && (
          <span className="text-[9px] text-[#605E5C] leading-none mb-0.5 tabular-nums select-none">
            {relativeInch}
          </span>
        )}
        <div
          style={{ height: `${tickHeight}px` }}
          className="w-px bg-[#8A8886]"
        />
      </div>
    );
  }

  return (
    <div className="no-print h-6 bg-[#EDEBE9] border-b border-[#D2D0CE] flex justify-center items-end overflow-hidden shrink-0 select-none">
      <div
        style={{ width: `${totalWidth}px` }}
        className="relative h-4 bg-white border-x border-[#C8C6C4]"
      >
        {/* Left shaded margin zone */}
        <div
          style={{ width: `${leftMarginPx}px` }}
          className="absolute left-0 top-0 bottom-0 bg-[#DFDDD9]"
        />
        {/* Right shaded margin zone */}
        <div
          style={{ width: `${rightMarginPx}px` }}
          className="absolute right-0 top-0 bottom-0 bg-[#DFDDD9]"
        />
        {/* Left & Right Margin Indent Markers */}
        <div
          style={{ left: `${leftMarginPx - 4}px` }}
          className="absolute top-0 w-2 h-2 bg-[#A19F9D] rounded-b-sm pointer-events-none"
          title={`Left margin: ${margin.left}"`}
        />
        <div
          style={{ right: `${rightMarginPx - 4}px` }}
          className="absolute bottom-0 w-2 h-2 bg-[#A19F9D] rounded-t-sm pointer-events-none"
          title={`Right margin: ${margin.right}"`}
        />
        {ticks}
      </div>
    </div>
  );
};

interface VerticalRulerProps {
  pageHeightInches: number;
  margins: MarginPreset;
  zoom: number;
}

export const VerticalRuler: React.FC<VerticalRulerProps> = ({
  pageHeightInches,
  margins,
  zoom,
}) => {
  const pxPerInch = 96 * (zoom / 100);
  const totalHeight = pageHeightInches * pxPerInch;
  const margin = MARGIN_INCHES[margins];
  const topMarginPx = margin.top * pxPerInch;
  const bottomMarginPx = margin.bottom * pxPerInch;

  const ticks: React.ReactNode[] = [];
  const totalQuarters = Math.round(pageHeightInches * 4);

  for (let i = 0; i <= totalQuarters; i++) {
    const inchPos = i / 4;
    const y = inchPos * pxPerInch;
    const isWholeInch = i % 4 === 0;
    const isHalfInch = i % 2 === 0 && !isWholeInch;
    const relativeInch = Math.round(inchPos - margin.top);
    const showLabel =
      isWholeInch &&
      inchPos >= margin.top - 0.01 &&
      inchPos <= pageHeightInches - margin.bottom + 0.01 &&
      relativeInch > 0 &&
      relativeInch < pageHeightInches - margin.top - margin.bottom;

    ticks.push(
      <div
        key={i}
        style={{ top: `${y}px` }}
        className="absolute right-0 flex items-center pointer-events-none"
      >
        {showLabel && (
          <span className="text-[8px] text-[#605E5C] mr-0.5 leading-none tabular-nums">
            {relativeInch}
          </span>
        )}
        <div
          style={{ width: `${isWholeInch ? 7 : isHalfInch ? 5 : 3}px` }}
          className="h-px bg-[#8A8886]"
        />
      </div>
    );
  }

  return (
    <div className="no-print w-5 bg-[#EDEBE9] border-r border-[#D2D0CE] shrink-0 hidden md:flex justify-end pt-7 overflow-hidden select-none">
      <div
        style={{ height: `${totalHeight}px` }}
        className="relative w-3.5 bg-white border-y border-[#C8C6C4]"
      >
        <div
          style={{ height: `${topMarginPx}px` }}
          className="absolute top-0 left-0 right-0 bg-[#DFDDD9]"
        />
        <div
          style={{ height: `${bottomMarginPx}px` }}
          className="absolute bottom-0 left-0 right-0 bg-[#DFDDD9]"
        />
        {ticks}
      </div>
    </div>
  );
};
