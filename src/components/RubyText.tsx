import { useState } from "react";
import { getFuriganaMode } from "../lib/storage";
import type { FuriganaMode } from "../lib/types";

interface Props {
  text: string;
  reading?: string;
  className?: string;
}

/**
 * Renders Japanese text with optional furigana (ruby annotation).
 * Respects the user's furigana display setting: always / hover / hide.
 */
export default function RubyText({ text, reading, className = "" }: Props) {
  const mode = getFuriganaMode();
  const [tapped, setTapped] = useState(false);

  if (!reading || mode === "hide") {
    return <span className={className}>{text}</span>;
  }

  if (mode === "always") {
    return (
      <ruby className={className}>
        {text}
        <rt className="text-[0.55em] text-ink-400 font-normal">{reading}</rt>
      </ruby>
    );
  }

  // hover/tap mode
  return (
    <ruby
      className={`${className} cursor-pointer group`}
      onClick={() => setTapped(!tapped)}
    >
      {text}
      <rt
        className={`text-[0.55em] text-ink-400 font-normal transition-opacity duration-200 ${
          tapped ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        }`}
      >
        {reading}
      </rt>
    </ruby>
  );
}
