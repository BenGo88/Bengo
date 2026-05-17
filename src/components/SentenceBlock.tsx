import { useState, useMemo } from "react";
import { getFuriganaMode, getBeginnerAssist } from "../lib/storage";
import { autoDetectLexicon } from "../lib/lexicon";
import InteractiveSentence, { AutoDetectedChips } from "./InteractiveSentence";
import type { RichSentence } from "../lib/types";

interface Props {
  sentence: RichSentence;
  compact?: boolean;
}

export default function SentenceBlock({ sentence, compact = false }: Props) {
  const furigana = getFuriganaMode();
  const assist = getBeginnerAssist();
  const [showReading, setShowReading] = useState(false);
  const [showStructure, setShowStructure] = useState(assist);

  const tokenData = sentence.tokens ?? sentence.breakdown;
  const hasTokens = tokenData && tokenData.length > 0;
  const hasReading = !!sentence.reading;
  const hasStructure = !!sentence.structure;
  const isHoverMode = furigana === "hover";

  // Auto-detect lexicon entries when no tokens exist
  const autoDetected = useMemo(() => {
    if (hasTokens) return [];
    return autoDetectLexicon(sentence.ja);
  }, [sentence.ja, hasTokens]);

  return (
    <div className={compact ? "space-y-1.5" : "space-y-2"}>
      {/* Interactive tokens OR plain sentence */}
      {hasTokens ? (
        <InteractiveSentence tokens={tokenData!} className={compact ? "text-base" : ""} />
      ) : (
        <>
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
          {/* Auto-detected word chips */}
          {autoDetected.length > 0 && <AutoDetectedChips entries={autoDetected} />}
        </>
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

      {sentence.note && <p className="text-xs text-ink-500 italic">💡 {sentence.note}</p>}

      {hasStructure && (
        <div className="pt-1">
          <button className="text-xs text-jade-400 hover:text-jade-300 font-medium" onClick={() => setShowStructure(!showStructure)}>
            {showStructure ? "Hide structure ▾" : "Show structure ▸"}
          </button>
          {showStructure && (
            <p className="text-xs text-ink-400 mt-1.5 pl-2 border-l-2 border-jade-500/30 leading-relaxed animate-fade-in">{sentence.structure}</p>
          )}
        </div>
      )}
    </div>
  );
}
