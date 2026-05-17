import { useState } from "react";
import { getFuriganaMode, getBeginnerAssist } from "../lib/storage";
import type { RichSentence } from "../lib/types";

interface Props {
  sentence: RichSentence;
  compact?: boolean;
}

/**
 * Displays a Japanese example sentence with:
 * - Japanese text (with optional reading line)
 * - English translation
 * - Collapsible word-by-word breakdown
 * - Optional note
 */
export default function SentenceBlock({ sentence, compact = false }: Props) {
  const furigana = getFuriganaMode();
  const assist = getBeginnerAssist();
  const [showBreakdown, setShowBreakdown] = useState(false);
  const hasBreakdown = sentence.breakdown && sentence.breakdown.length > 0;

  return (
    <div className={compact ? "space-y-1" : "space-y-2"}>
      {/* Japanese sentence */}
      <p className={`text-ink-100 font-display leading-relaxed ${compact ? "text-base" : "text-lg"}`}>
        {sentence.ja}
      </p>

      {/* Full reading line (furigana mode: always or hover/tapped) */}
      {sentence.reading && furigana !== "hide" && (
        <p className="text-sm text-ink-500 font-mono">{sentence.reading}</p>
      )}

      {/* English */}
      <p className="text-sm text-ink-400">{sentence.en}</p>

      {/* Note */}
      {sentence.note && (
        <p className="text-xs text-ink-500 italic">💡 {sentence.note}</p>
      )}

      {/* Breakdown toggle */}
      {hasBreakdown && (assist || showBreakdown) && (
        <div className="pt-1">
          {!showBreakdown ? (
            <button
              className="text-xs text-vermillion-400 hover:text-vermillion-300 font-medium"
              onClick={() => setShowBreakdown(true)}
            >
              Show word breakdown ▸
            </button>
          ) : (
            <>
              <button
                className="text-xs text-ink-500 hover:text-ink-400 font-medium mb-2"
                onClick={() => setShowBreakdown(false)}
              >
                Hide breakdown ▾
              </button>
              <div className="grid gap-1 pl-2 border-l-2 border-ink-800">
                {sentence.breakdown!.map((w, i) => (
                  <div key={i} className="flex items-baseline gap-2 text-xs">
                    <span className="text-ink-200 font-display font-semibold">{w.text}</span>
                    {w.reading !== w.text && (
                      <span className="text-ink-500 font-mono">{w.reading}</span>
                    )}
                    <span className="text-ink-400">= {w.meaning}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
