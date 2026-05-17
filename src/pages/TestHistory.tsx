import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getTestHistory, type TestResult } from "../lib/reading";

const LEVELS = ["All", "N5", "N4", "N3", "N2", "N1"];

export default function TestHistory() {
  const navigate = useNavigate();
  const [levelFilter, setLevelFilter] = useState("All");
  const [selected, setSelected] = useState<TestResult | null>(null);
  const history = getTestHistory();

  const filtered = levelFilter === "All" ? history : history.filter((t) => t.level === levelFilter);

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <header>
        <p className="label mb-1">Practice Tests</p>
        <h1 className="font-display text-2xl font-bold text-ink-50">Test History</h1>
        <p className="text-sm text-ink-400 mt-1">Review your past JLPT-style practice tests.</p>
      </header>

      {/* Level filter */}
      <div className="flex flex-wrap gap-1.5">
        {LEVELS.map((l) => (
          <button key={l} onClick={() => { setLevelFilter(l); setSelected(null); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              levelFilter === l ? "bg-vermillion-500 text-white" : "bg-ink-800 text-ink-400 hover:bg-ink-700"
            }`}>{l}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card p-6 text-center">
          <p className="text-sm text-ink-500">No practice tests completed yet.</p>
          <button className="btn-primary mt-3" onClick={() => navigate("/quiz")}>Take a Test</button>
        </div>
      ) : selected ? (
        /* Detail view */
        <div className="space-y-4">
          <button className="btn-secondary text-xs" onClick={() => setSelected(null)}>← Back to list</button>
          <div className="card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-vermillion-500/20 text-vermillion-400 font-bold">{selected.level}</span>
                <span className="text-[10px] text-ink-600 ml-2">{selected.timed ? "Timed" : "Untimed"}</span>
              </div>
              <p className="text-xs text-ink-600">{new Date(selected.date).toLocaleDateString()}</p>
            </div>
            <div className="text-center">
              <p className={`text-4xl font-display font-bold ${selected.accuracy >= 80 ? "text-jade-400" : selected.accuracy >= 50 ? "text-yellow-500" : "text-vermillion-400"}`}>
                {selected.accuracy}%
              </p>
              <p className="text-sm text-ink-400">{selected.correct} / {selected.totalQuestions} correct</p>
              {selected.durationSeconds > 0 && (
                <p className="text-xs text-ink-600">Duration: {Math.floor(selected.durationSeconds / 60)}m {selected.durationSeconds % 60}s</p>
              )}
            </div>

            {/* Section breakdown */}
            {selected.sections && selected.sections.length > 0 && (
              <div className="space-y-2 pt-3 border-t border-ink-800">
                <p className="label">Section Breakdown</p>
                {selected.sections.map((s, i) => {
                  const pct = s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0;
                  return (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-sm text-ink-300">{s.name}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 rounded-full bg-ink-800 overflow-hidden">
                          <div className={`h-full rounded-full ${pct >= 80 ? "bg-jade-500" : pct >= 50 ? "bg-yellow-500" : "bg-vermillion-500"}`} style={{ width: `${pct}%` }} />
                        </div>
                        <span className={`text-xs font-bold w-16 text-right ${pct >= 80 ? "text-jade-400" : pct >= 50 ? "text-yellow-500" : "text-vermillion-400"}`}>
                          {s.correct}/{s.total}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button className="btn-primary flex-1" onClick={() => navigate("/quiz")}>Retake Test</button>
            </div>
          </div>
        </div>
      ) : (
        /* List view */
        <div className="space-y-2">
          {filtered.map((t) => (
            <div key={t.id} className="card-hover p-4" onClick={() => setSelected(t)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-ink-700 text-ink-400 font-bold">{t.level}</span>
                  <span className="text-sm text-ink-200">{t.correct}/{t.totalQuestions}</span>
                  <span className={`text-sm font-bold ${t.accuracy >= 80 ? "text-jade-400" : t.accuracy >= 50 ? "text-yellow-500" : "text-vermillion-400"}`}>
                    {t.accuracy}%
                  </span>
                  {t.timed && <span className="text-[10px] text-ink-600">⏱</span>}
                </div>
                <span className="text-xs text-ink-600">{new Date(t.date).toLocaleDateString()}</span>
              </div>
              {t.sections && t.sections.length > 0 && (
                <div className="flex gap-3 mt-1">
                  {t.sections.map((s, i) => (
                    <span key={i} className="text-[10px] text-ink-600">{s.name.split(" ")[0]}: {s.correct}/{s.total}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
