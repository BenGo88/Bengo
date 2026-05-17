import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getReadingsByLevel, allReadings, getReadingProgress } from "../lib/reading";
import type { JLPTLevel } from "../lib/types";

const LEVELS: (JLPTLevel | "All")[] = ["All", "N5", "N4", "N3", "N2", "N1"];

export default function ReadingLibrary() {
  const navigate = useNavigate();
  const [level, setLevel] = useState<JLPTLevel | "All">("All");

  const passages = useMemo(() => {
    if (level === "All") return allReadings;
    return getReadingsByLevel(level);
  }, [level]);

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <header>
        <p className="label mb-1">Reading Practice</p>
        <h1 className="font-display text-2xl font-bold text-ink-50">Reading Library</h1>
        <p className="text-sm text-ink-400 mt-1">Practice reading comprehension at your level.</p>
      </header>

      {/* Level filter */}
      <div className="flex flex-wrap gap-1.5">
        {LEVELS.map((l) => (
          <button key={l} onClick={() => setLevel(l)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              level === l ? "bg-vermillion-500 text-white" : "bg-ink-800 text-ink-400 hover:bg-ink-700"
            }`}>{l}</button>
        ))}
      </div>

      {/* Passage cards */}
      {passages.length === 0 ? (
        <div className="card p-6 text-center"><p className="text-sm text-ink-500">No reading passages for this level yet.</p></div>
      ) : (
        <div className="space-y-3">
          {passages.map((p) => {
            const progress = getReadingProgress(p.id);
            return (
              <div key={p.id} className="card-hover p-4" onClick={() => navigate(`/reading/${p.id}`)}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                        p.jlpt === "N5" ? "bg-jade-500/20 text-jade-400" :
                        p.jlpt === "N4" ? "bg-yellow-500/20 text-yellow-500" :
                        p.jlpt === "N3" ? "bg-vermillion-500/20 text-vermillion-400" :
                        "bg-ink-700 text-ink-400"
                      }`}>{p.jlpt}</span>
                      <span className="text-[10px] text-ink-600">~{p.estimatedMinutes} min</span>
                      <span className="text-[10px] text-ink-600">{p.questions.length} questions</span>
                    </div>
                    <h3 className="font-display font-semibold text-ink-100">{p.title}</h3>
                    <p className="text-xs text-ink-500 mt-0.5">{p.summary}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    {progress?.completed ? (
                      <div>
                        <span className="text-jade-400 text-sm font-bold">{progress.bestScore}%</span>
                        <p className="text-[10px] text-ink-600">best</p>
                      </div>
                    ) : (
                      <span className="text-[10px] text-ink-600">New</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
