import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getListeningItemsByLevel, speakJapanese, findJapaneseVoice, recordListeningPractice, getListeningProgress, type ListeningItem } from "../lib/listening";
import type { JLPTLevel } from "../lib/types";
import { allVocab } from "../lib/content";

type Mode = "setup" | "sentence" | "meaning" | "shadowing";
const LEVELS: JLPTLevel[] = ["N5", "N4", "N3", "N2", "N1"];

export default function Listening() {
  const navigate = useNavigate();
  const [level, setLevel] = useState<JLPTLevel>("N5");
  const [mode, setMode] = useState<Mode>("setup");
  const [items, setItems] = useState<ListeningItem[]>([]);
  const [idx, setIdx] = useState(0);
  const [showTranscript, setShowTranscript] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [choices, setChoices] = useState<string[]>([]);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [hasVoice, setHasVoice] = useState(true);

  // Check for Japanese TTS voice
  useEffect(() => {
    const check = () => setHasVoice(!!findJapaneseVoice());
    check();
    if (typeof speechSynthesis !== "undefined") {
      speechSynthesis.onvoiceschanged = check;
    }
  }, []);

  const current = items[idx];

  function startSession(m: Mode) {
    const pool = getListeningItemsByLevel(level, 15);
    if (pool.length === 0) return;
    setItems(pool);
    setIdx(0);
    setShowTranscript(false);
    setShowTranslation(false);
    setSelected(null);
    setScore({ correct: 0, total: 0 });
    if (m === "meaning") buildChoices(pool[0], pool);
    setMode(m);
  }

  function buildChoices(item: ListeningItem, pool: ListeningItem[]) {
    const others = pool.filter((p) => p.id !== item.id).map((p) => p.english).sort(() => Math.random() - 0.5).slice(0, 3);
    const all = [...others, item.english].sort(() => Math.random() - 0.5);
    setChoices(all);
    setSelected(null);
  }

  function nextItem() {
    const next = idx + 1;
    if (next >= items.length) { setMode("setup"); return; }
    setIdx(next);
    setShowTranscript(false);
    setShowTranslation(false);
    setSelected(null);
    if (mode === "meaning") buildChoices(items[next], items);
  }

  function play(rate = 1) {
    if (current) speakJapanese(current.japanese, rate);
  }

  // Setup
  if (mode === "setup") {
    const progress = getListeningProgress();
    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
        <header>
          <p className="label mb-1">Listening Practice</p>
          <h1 className="font-display text-2xl font-bold text-ink-50">Listening</h1>
          <p className="text-sm text-ink-400 mt-1">Practice understanding spoken Japanese.</p>
        </header>

        {!hasVoice && (
          <div className="card p-4 border-yellow-500/30">
            <p className="text-xs text-yellow-500">⚠ Japanese TTS voice not available in this browser. Transcript practice still works.</p>
          </div>
        )}

        {progress.totalPracticed > 0 && (
          <div className="card p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-ink-500">Sessions practiced</p>
              <p className="text-lg font-bold text-ink-200">{progress.totalPracticed}</p>
            </div>
            {progress.totalMeaning > 0 && (
              <div>
                <p className="text-xs text-ink-500">Meaning accuracy</p>
                <p className="text-lg font-bold text-jade-400">{Math.round((progress.correctMeaning / progress.totalMeaning) * 100)}%</p>
              </div>
            )}
          </div>
        )}

        <div className="space-y-3">
          <p className="label">Level</p>
          <div className="flex flex-wrap gap-1.5">
            {LEVELS.map((l) => (
              <button key={l} onClick={() => setLevel(l)}
                className={`px-3 py-2 rounded-lg text-xs font-semibold ${level === l ? "bg-vermillion-500 text-white" : "bg-ink-800 text-ink-400 hover:bg-ink-700"}`}>{l}</button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <p className="label">Mode</p>
          <div className="space-y-2">
            <button className="card-hover p-4 w-full text-left" onClick={() => startSession("sentence")}>
              <h3 className="font-semibold text-ink-100">🔊 Sentence Listening</h3>
              <p className="text-xs text-ink-500 mt-1">Listen and check your understanding. Self-rate difficulty.</p>
            </button>
            <button className="card-hover p-4 w-full text-left" onClick={() => startSession("meaning")}>
              <h3 className="font-semibold text-ink-100">🎯 Meaning Choice</h3>
              <p className="text-xs text-ink-500 mt-1">Listen and choose the correct English meaning.</p>
            </button>
            <button className="card-hover p-4 w-full text-left" onClick={() => startSession("shadowing")}>
              <h3 className="font-semibold text-ink-100">🗣 Shadowing</h3>
              <p className="text-xs text-ink-500 mt-1">Listen and repeat. Match rhythm and pronunciation.</p>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!current) return <div className="text-center py-20 text-ink-500">No items available for this level.</div>;

  // Sentence Listening
  if (mode === "sentence") {
    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in" key={idx}>
        <div className="flex items-center justify-between">
          <p className="label">Sentence Listening</p>
          <span className="text-xs text-ink-500">{idx + 1} / {items.length}</span>
        </div>

        <div className="card p-6 text-center space-y-4">
          <div className="flex justify-center gap-3">
            <button className="btn-primary px-6 py-3 text-lg" onClick={() => play()}>▶ Play</button>
            <button className="btn-secondary px-4 py-3" onClick={() => play(0.7)}>🐢 Slow</button>
          </div>

          {showTranscript ? (
            <p className="text-xl font-display text-ink-100 leading-relaxed">{current.japanese}</p>
          ) : (
            <button className="text-xs text-ink-500 hover:text-ink-300" onClick={() => setShowTranscript(true)}>Show transcript</button>
          )}

          {showTranslation ? (
            <p className="text-sm text-ink-400">{current.english}</p>
          ) : (
            <button className="text-xs text-ink-500 hover:text-ink-300" onClick={() => setShowTranslation(true)}>Show translation</button>
          )}

          <p className="text-[10px] text-ink-600">Source: {current.source}</p>
        </div>

        <div className="flex gap-2">
          <button className="flex-1 card p-3 text-center text-xs text-jade-400 hover:bg-jade-500/10" onClick={() => { recordListeningPractice(); nextItem(); }}>Easy ✓</button>
          <button className="flex-1 card p-3 text-center text-xs text-yellow-500 hover:bg-yellow-500/10" onClick={() => { recordListeningPractice(); nextItem(); }}>Hard</button>
          <button className="flex-1 card p-3 text-center text-xs text-vermillion-400 hover:bg-vermillion-500/10" onClick={() => { recordListeningPractice(); nextItem(); }}>Didn't understand</button>
        </div>

        <button className="btn-secondary text-xs" onClick={() => setMode("setup")}>End Session</button>
      </div>
    );
  }

  // Meaning Choice
  if (mode === "meaning") {
    const answered = selected !== null;
    const isCorrect = answered && choices[selected!] === current.english;

    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in" key={idx}>
        <div className="flex items-center justify-between">
          <p className="label">Meaning Choice</p>
          <span className="text-xs text-ink-500">{idx + 1} / {items.length} · {score.correct}/{score.total}</span>
        </div>

        <div className="card p-6 text-center space-y-4">
          <button className="btn-primary px-6 py-3 text-lg" onClick={() => play()}>▶ Play</button>
          {answered && <p className="text-lg font-display text-ink-100">{current.japanese}</p>}
        </div>

        <div className="space-y-2">
          {choices.map((c, i) => {
            let cls = "w-full text-left card p-4 text-sm font-medium transition-all ";
            if (answered) {
              if (c === current.english) cls += "border-jade-500/60 bg-jade-500/10 text-jade-400";
              else if (i === selected && !isCorrect) cls += "border-vermillion-500/60 bg-vermillion-500/10 text-vermillion-400";
              else cls += "opacity-30 text-ink-500";
            } else {
              cls += "text-ink-200 hover:border-ink-600 cursor-pointer";
            }
            return <button key={i} className={cls} disabled={answered} onClick={() => {
              setSelected(i);
              const correct = c === current.english;
              setScore((s) => ({ correct: s.correct + (correct ? 1 : 0), total: s.total + 1 }));
              recordListeningPractice(correct);
            }}>{c}</button>;
          })}
        </div>

        {answered && (
          <div className="card p-4 animate-fade-in">
            <p className={`text-sm font-semibold ${isCorrect ? "text-jade-400" : "text-vermillion-400"}`}>
              {isCorrect ? "✓ Correct!" : `✗ Correct: ${current.english}`}
            </p>
            <button className="btn-primary mt-3 w-full" onClick={nextItem}>
              {idx < items.length - 1 ? "Next →" : "Finish"}
            </button>
          </div>
        )}

        <button className="btn-secondary text-xs" onClick={() => setMode("setup")}>End Session</button>
      </div>
    );
  }

  // Shadowing
  if (mode === "shadowing") {
    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in" key={idx}>
        <div className="flex items-center justify-between">
          <p className="label">Shadowing</p>
          <span className="text-xs text-ink-500">{idx + 1} / {items.length}</span>
        </div>

        <div className="card p-6 text-center space-y-4">
          <div className="flex justify-center gap-3">
            <button className="btn-primary px-6 py-3 text-lg" onClick={() => play()}>▶ Play</button>
            <button className="btn-secondary px-4 py-3" onClick={() => play(0.7)}>🐢 Slow</button>
          </div>

          <p className="text-xl font-display text-ink-100 leading-relaxed">{current.japanese}</p>
          {current.reading && <p className="text-sm text-ink-500">{current.reading}</p>}

          <div className="bg-ink-800/50 rounded-lg p-3">
            <p className="text-xs text-ink-400">🗣 Listen, then repeat out loud. Try to match the rhythm and pauses.</p>
          </div>

          <p className="text-sm text-ink-400">{current.english}</p>
          <p className="text-[10px] text-ink-600">Source: {current.source}</p>
        </div>

        <div className="flex gap-2">
          <button className="flex-1 card p-3 text-center text-xs text-jade-400 hover:bg-jade-500/10" onClick={() => { recordListeningPractice(); nextItem(); }}>Good ✓</button>
          <button className="flex-1 card p-3 text-center text-xs text-yellow-500 hover:bg-yellow-500/10" onClick={() => { recordListeningPractice(); nextItem(); }}>Needs practice</button>
        </div>

        <button className="btn-secondary text-xs" onClick={() => setMode("setup")}>End Session</button>
      </div>
    );
  }

  return null;
}
