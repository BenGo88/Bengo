import { useState } from "react";
import { getFuriganaMode, getBeginnerAssist } from "../lib/storage";
import type { RichSentence } from "../lib/types";

interface Props {
  sentence: RichSentence;
  compact?: boolean;
}

export default function SentenceBlock({ sentence, compact = false }: Props) {
  const furigana = getFuriganaMode();
  const assist = getBeginnerAssist();
  const [showReading, setShowReading] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const hasBreakdown = sentence.breakdown && sentence.breakdown.length > 0;
  const hasReading = !!sentence.reading;
  const isHoverMode = furigana === "hover";

  return (
    <div className={compact ? "space-y-1" : "space-y-2"}>
      {/* Japanese sentence — tappable in hover mode */}
      <p
        className={`text-ink-100 font-display leading-relaxed ${compact ? "text-base" : "text-lg"} ${
          isHoverMode && hasReading ? "cursor-pointer border-b border-dotted border-ink-700 inline-block group" : ""
        }`}
        onClick={isHoverMode && hasReading ? () => setShowReading(!showReading) : undefined}
      >
        {sentence.ja}
        {isHoverMode && hasReading && !showReading && (
          <span className="text-xs text-ink-600 ml-2 font-body">(tap for reading)</span>
        )}
      </p>

      {/* Reading line */}
      {hasReading && furigana === "always" && (
        <p className="text-sm text-ink-500 font-mono">{sentence.reading}</p>
      )}
      {hasReading && isHoverMode && showReading && (
        <p className="text-sm text-ink-500 font-mono animate-fade-in">{sentence.reading}</p>
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
