import { useState, useCallback, useRef } from "react";
import TokenPopup from "./TokenPopup";
import type { WordBreakdown } from "../lib/types";

export interface EnrichedToken extends WordBreakdown {
  partOfSpeech?: string;
  role?: string;
  note?: string;
}

interface Props {
  tokens: EnrichedToken[];
  className?: string;
}

export default function InteractiveSentence({ tokens, className = "" }: Props) {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [popupRect, setPopupRect] = useState<DOMRect | null>(null);
  const tokenRefs = useRef<(HTMLSpanElement | null)[]>([]);

  const handleTokenClick = useCallback((idx: number) => {
    if (activeIdx === idx) {
      setActiveIdx(null);
      return;
    }
    const el = tokenRefs.current[idx];
    if (el) setPopupRect(el.getBoundingClientRect());
    setActiveIdx(idx);
  }, [activeIdx]);

  return (
    <div className={`relative ${className}`}>
      <p className="text-lg font-display text-ink-100 leading-loose">
        {tokens.map((t, i) => (
          <span
            key={i}
            ref={(el) => { tokenRefs.current[i] = el; }}
            onClick={() => handleTokenClick(i)}
            className={`cursor-pointer transition-all duration-150 rounded px-0.5 ${
              activeIdx === i
                ? "bg-vermillion-500/20 text-vermillion-400"
                : "hover:bg-ink-800/60 border-b border-dotted border-transparent hover:border-ink-600"
            }`}
          >
            {t.text}
          </span>
        ))}
      </p>

      {activeIdx !== null && tokens[activeIdx] && (
        <TokenPopup
          token={tokens[activeIdx]}
          onClose={() => setActiveIdx(null)}
          anchorRect={popupRect}
        />
      )}
    </div>
  );
}
