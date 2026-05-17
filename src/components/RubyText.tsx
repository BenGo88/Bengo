import { useState } from "react";
import { getFuriganaMode } from "../lib/storage";

interface Props {
  text: string;
  reading?: string;
  className?: string;
}

export default function RubyText({ text, reading, className = "" }: Props) {
  const mode = getFuriganaMode();
  const [revealed, setRevealed] = useState(false);

  if (!reading || mode === "hide") {
    return <span className={className}>{text}</span>;
  }

  if (mode === "always") {
    return (
      <ruby className={className}>
        {text}<rt className="text-[0.55em] text-ink-400 font-normal">{reading}</rt>
      </ruby>
    );
  }

  // Tap/Hover: show on click (mobile) or hover (desktop)
  return (
    <span
      className={`${className} cursor-pointer inline-block relative group`}
      onClick={(e) => { e.stopPropagation(); setRevealed(!revealed); }}
    >
      <span className={`${!revealed ? "border-b border-dotted border-ink-600" : ""}`}>
        {text}
      </span>
      <span
        className={`absolute -top-5 left-1/2 -translate-x-1/2 text-[0.65em] text-ink-400 font-mono whitespace-nowrap transition-all duration-150 pointer-events-none ${
          revealed ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        }`}
      >
        {reading}
      </span>
    </span>
  );
}
