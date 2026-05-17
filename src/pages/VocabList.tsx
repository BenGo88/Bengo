import { useState } from "react";
import { Link } from "react-router-dom";
import { allVocab } from "../lib/content";
import { getUserItem } from "../lib/storage";
import type { JLPTLevel } from "../lib/types";

const LEVELS: JLPTLevel[] = ["N5", "N4", "N3", "N2", "N1"];

export default function VocabList() {
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState<JLPTLevel | "all">("all");

  const filtered = allVocab.filter((v) => {
    if (level !== "all" && v.jlpt !== level) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        v.word.includes(q) ||
        v.reading.includes(q) ||
        v.meanings.some((m) => m.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <header>
        <p className="label mb-1">Vocabulary</p>
        <h1 className="font-display text-2xl font-bold text-ink-50">
          Browse Vocabulary
        </h1>
        <p className="text-sm text-ink-400 mt-1">
          {allVocab.length} words available. Click any to see full details and start learning.
        </p>
      </header>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search by word, reading, or meaning…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="field-input flex-1"
        />
        <div className="flex gap-1.5">
          <FilterBtn active={level === "all"} onClick={() => setLevel("all")}>All</FilterBtn>
          {LEVELS.map((l) => (
            <FilterBtn key={l} active={level === l} onClick={() => setLevel(l)}>{l}</FilterBtn>
          ))}
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-ink-500">No vocabulary found matching your filters.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((v) => {
            const item = getUserItem("vocab", v.id);
            return (
              <Link
                key={v.id}
                to={`/vocab/${v.id}`}
                className="card-hover p-4 flex items-center gap-4 group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-display font-bold text-ink-100 group-hover:text-vermillion-400 transition-colors">
                      {v.word}
                    </span>
                    <span className="text-sm text-ink-400 font-mono">{v.reading}</span>
                  </div>
                  <p className="text-sm text-ink-400 mt-0.5 truncate">{v.meanings.join(", ")}</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-ink-800 text-ink-400 font-semibold">
                    {v.jlpt}
                  </span>
                  <span className="text-[10px] text-ink-600">{v.part_of_speech}</span>
                  {item && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                      item.isWeak
                        ? "bg-vermillion-500/20 text-vermillion-400"
                        : "bg-jade-500/20 text-jade-400"
                    }`}>
                      {item.isWeak ? "Weak" : "Learning"}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function FilterBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
        active
          ? "bg-vermillion-500 text-white"
          : "bg-ink-800 text-ink-400 hover:text-ink-200 hover:bg-ink-700"
      }`}
    >
      {children}
    </button>
  );
}
