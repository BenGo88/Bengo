import { useEffect, useRef } from "react";
import type { WordBreakdown } from "../lib/types";

interface Props {
  token: WordBreakdown & { partOfSpeech?: string; role?: string; note?: string };
  onClose: () => void;
  anchorRect?: DOMRect | null;
}

export default function TokenPopup({ token, onClose, anchorRect }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute z-50 w-64 card p-4 shadow-xl shadow-black/40 border-ink-700/60 animate-fade-in"
      style={{
        left: anchorRect ? Math.min(anchorRect.left, window.innerWidth - 280) : 0,
        top: anchorRect ? anchorRect.bottom + 8 : 0,
        position: "fixed",
      }}
    >
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-xl font-display font-bold text-ink-50">{token.text}</span>
        <button className="text-ink-600 hover:text-ink-400 text-xs" onClick={onClose}>✕</button>
      </div>
      {token.reading && token.reading !== token.text && (
        <p className="text-sm text-ink-400 font-mono mb-2">{token.reading}</p>
      )}
      <p className="text-sm text-ink-200 mb-2">{token.meaning}</p>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {token.partOfSpeech && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-jade-500/15 text-jade-400 font-semibold">
            {token.partOfSpeech}
          </span>
        )}
        {token.role && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-vermillion-500/15 text-vermillion-400 font-semibold">
            {token.role}
          </span>
        )}
      </div>
      {token.note && <p className="text-xs text-ink-500 italic">{token.note}</p>}
    </div>
  );
}
