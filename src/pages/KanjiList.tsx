import { useState } from "react";
import { Link } from "react-router-dom";
import { allKanji } from "../lib/content";
import { getUserItem } from "../lib/storage";
import type { JLPTLevel } from "../lib/types";

const LEVELS: JLPTLevel[] = ["N5", "N4", "N3", "N2", "N1"];

export default function KanjiList() {
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState<JLPTLevel | "all">("all");

  const filtered = allKanji.filter((k) => {
    if (level !== "all" && k.jlpt !== level) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        k.character.includes(q) ||
        k.meanings.some((m) => m.toLowerCase().includes(q)) ||
        k.onyomi.some((r) => r.includes(q)) ||
        k.kunyomi.some((r) => r.includes(q))
      );
    }
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <header>
        <p className="label mb-1">Kanji</p>
        <h1 className="font-display text-2xl font-bold text-ink-50">
          Browse Kanji
        </h1>
        <p className="text-sm text-ink-400 mt-1">
          {allKanji.length} kanji available. Click any to see full details and start learning.
        </p>
      </header>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search by kanji, meaning, or reading…"
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

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-ink-500">No kanji found matching your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {filtered.map((k) => {
            const item = getUserItem("kanji", k.id);
            return (
              <Link
                key={k.id}
                to={`/kanji/${k.id}`}
                className="card-hover p-4 flex flex-col items-center gap-2 text-center group"
              >
                <span className="text-4xl font-display group-hover:text-vermillion-400 transition-colors">
                  {k.character}
                </span>
                <span className="text-sm text-ink-300 font-medium line-clamp-1">
                  {k.meanings[0]}
                </span>
                <span className="text-xs text-ink-500 font-mono">
                  {k.onyomi[0] || k.kunyomi[0] || "—"}
                </span>
                <div className="flex gap-1.5 mt-1">
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-ink-800 text-ink-400 font-semibold">
                    {k.jlpt}
                  </span>
                  {item && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                      item.isWeak
                        ? "bg-vermillion-500/20 text-vermillion-400"
                        : "bg-jade-500/20 text-jade-400"
                    }`}>
                      {item.isWeak ? "Weak" : item.srsStage === "burned" ? "Burned" : "Learning"}
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
