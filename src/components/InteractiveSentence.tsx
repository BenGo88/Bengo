import { useState } from "react";
import type { WordBreakdown } from "../lib/types";

interface Props {
  tokens: WordBreakdown[];
  className?: string;
}

/**
 * Renders a Japanese sentence as tappable word tokens.
 * Tapping a token highlights it and shows an inline explanation card below.
 * No fragile floating popups — works reliably on mobile and desktop.
 */
export default function InteractiveSentence({ tokens, className = "" }: Props) {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  function handleTokenClick(idx: number) {
    setActiveIdx(activeIdx === idx ? null : idx);
  }

  const active = activeIdx !== null ? tokens[activeIdx] : null;

  return (
    <div className={className}>
      {/* Token pills */}
      <p className="text-lg font-display text-ink-100 leading-loose flex flex-wrap gap-y-1">
        {tokens.map((t, i) => (
          <span
            key={i}
            onClick={() => handleTokenClick(i)}
            className={`cursor-pointer transition-all duration-150 rounded-md px-1 py-0.5 ${
              activeIdx === i
                ? "bg-vermillion-500/25 text-vermillion-400 ring-1 ring-vermillion-500/40"
                : "bg-ink-800/40 hover:bg-ink-800/70 border-b border-dotted border-ink-600"
            }`}
          >
            {t.text}
          </span>
        ))}
      </p>

      {/* Inline explanation card — appears below sentence */}
      {active && (
        <div className="mt-3 p-3 rounded-xl bg-ink-800/60 border border-ink-700/50 animate-fade-in">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-lg font-display font-bold text-ink-50">{active.text}</span>
                {active.reading && active.reading !== active.text && (
                  <span className="text-sm text-ink-400 font-mono">{active.reading}</span>
                )}
              </div>
              <p className="text-sm text-ink-200">{active.meaning}</p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {active.partOfSpeech && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-jade-500/15 text-jade-400 font-semibold">
                    {active.partOfSpeech}
                  </span>
                )}
                {active.role && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-vermillion-500/15 text-vermillion-400 font-semibold">
                    {active.role}
                  </span>
                )}
              </div>
              {active.note && (
                <p className="text-xs text-ink-500 italic mt-1.5">{active.note}</p>
              )}
            </div>
            <button
              className="text-ink-600 hover:text-ink-400 text-xs shrink-0 p-1"
              onClick={() => setActiveIdx(null)}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
