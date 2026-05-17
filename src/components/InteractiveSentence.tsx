import { useState, useMemo } from "react";
import { enrichTokens, type EnrichedToken } from "../lib/lexicon";
import type { WordBreakdown } from "../lib/types";

interface Props {
  tokens: WordBreakdown[];
  className?: string;
}

export default function InteractiveSentence({ tokens, className = "" }: Props) {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const enriched = useMemo(() => enrichTokens(tokens), [tokens]);

  function handleClick(idx: number) {
    setActiveIdx(activeIdx === idx ? null : idx);
  }

  const active = activeIdx !== null ? enriched[activeIdx] : null;

  return (
    <div className={className}>
      <p className="text-lg font-display text-ink-100 leading-loose flex flex-wrap gap-y-1">
        {enriched.map((t, i) => (
          <span
            key={i}
            onClick={() => handleClick(i)}
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
                {active.fromLexicon && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-ink-700/60 text-ink-500 font-semibold">
                    lexicon
                  </span>
                )}
              </div>
              {active.note && <p className="text-xs text-ink-500 italic mt-1.5">{active.note}</p>}
            </div>
            <button className="text-ink-600 hover:text-ink-400 text-xs shrink-0 p-1" onClick={() => setActiveIdx(null)}>✕</button>
          </div>
        </div>
      )}
    </div>
  );
}

/** Auto-detected word chips — shown when no tokens exist */
export function AutoDetectedChips({ entries }: { entries: { text: string; reading: string; meanings: string[]; partOfSpeech: string }[] }) {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const active = activeIdx !== null ? entries[activeIdx] : null;

  if (entries.length === 0) return null;

  return (
    <div className="mt-2">
      <p className="text-[10px] text-ink-600 mb-1">Detected words (approximate):</p>
      <div className="flex flex-wrap gap-1">
        {entries.map((e, i) => (
          <button
            key={i}
            onClick={() => setActiveIdx(activeIdx === i ? null : i)}
            className={`text-xs px-2 py-1 rounded-md transition-all ${
              activeIdx === i
                ? "bg-jade-500/20 text-jade-400 ring-1 ring-jade-500/30"
                : "bg-ink-800/50 text-ink-400 hover:bg-ink-800/80 border border-dashed border-ink-700/40"
            }`}
          >
            {e.text}
          </button>
        ))}
      </div>
      {active && (
        <div className="mt-2 p-2.5 rounded-lg bg-ink-800/40 border border-ink-700/30 animate-fade-in">
          <div className="flex items-baseline gap-2 mb-1">
            <span className="font-display font-bold text-ink-100">{active.text}</span>
            {active.reading !== active.text && <span className="text-xs text-ink-500 font-mono">{active.reading}</span>}
          </div>
          <p className="text-xs text-ink-300">{active.meanings.join(", ")}</p>
          <span className="text-[9px] text-ink-600">{active.partOfSpeech}</span>
        </div>
      )}
    </div>
  );
}
