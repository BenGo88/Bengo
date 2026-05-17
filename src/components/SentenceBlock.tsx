import { useState } from "react";
import { getFuriganaMode, getBeginnerAssist } from "../lib/storage";
import InteractiveSentence from "./InteractiveSentence";
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
  const [showStructure, setShowStructure] = useState(assist);
  const hasTokens = sentence.breakdown && sentence.breakdown.length > 0;
  const hasReading = !!sentence.reading;
  const hasStructure = !!sentence.structure;
  const isHoverMode = furigana === "hover";

  return (
    <div className={compact ? "space-y-1.5" : "space-y-2"}>
      {/* Interactive tokens or plain sentence */}
      {hasTokens ? (
        <InteractiveSentence tokens={sentence.breakdown!} className={compact ? "text-base" : ""} />
      ) : (
        <p
          className={`text-ink-100 font-display leading-relaxed ${compact ? "text-base" : "text-lg"} ${
            isHoverMode && hasReading ? "cursor-pointer border-b border-dotted border-ink-700 inline-block" : ""
          }`}
          onClick={isHoverMode && hasReading ? () => setShowReading(!showReading) : undefined}
        >
          {sentence.ja}
          {isHoverMode && hasReading && !showReading && (
            <span className="text-xs text-ink-600 ml-2 font-body">(tap for reading)</span>
          )}
        </p>
      )}

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

      {/* Structure section */}
      {hasStructure && (
        <div className="pt-1">
          <button
            className="text-xs text-jade-400 hover:text-jade-300 font-medium"
            onClick={() => setShowStructure(!showStructure)}
          >
            {showStructure ? "Hide structure ▾" : "Show structure ▸"}
          </button>
          {showStructure && (
            <p className="text-xs text-ink-400 mt-1.5 pl-2 border-l-2 border-jade-500/30 leading-relaxed animate-fade-in">
              {sentence.structure}
            </p>
          )}
        </div>
      )}

      {/* Word breakdown list */}
      {hasTokens && (
        <div className="pt-1">
          <button
            className="text-xs text-vermillion-400 hover:text-vermillion-300 font-medium"
            onClick={() => setShowBreakdown(!showBreakdown)}
          >
            {showBreakdown ? "Hide word list ▾" : "Show word list ▸"}
          </button>
          {showBreakdown && (
            <div className="grid gap-1 pl-2 border-l-2 border-ink-800 mt-1.5 animate-fade-in">
              {sentence.breakdown!.map((w, i) => (
                <div key={i} className="flex items-baseline gap-2 text-xs flex-wrap">
                  <span className="text-ink-200 font-display font-semibold">{w.text}</span>
                  {w.reading !== w.text && (
                    <span className="text-ink-500 font-mono">{w.reading}</span>
                  )}
                  <span className="text-ink-400">= {w.meaning}</span>
                  {w.partOfSpeech && (
                    <span className="text-[9px] px-1 py-0.5 rounded bg-ink-800 text-ink-500">{w.partOfSpeech}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
