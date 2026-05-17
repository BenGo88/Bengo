import { useParams, useNavigate } from "react-router-dom";
import { getContentCounts, getUnitsForLevel, type CurriculumUnit } from "../lib/content";
import { getLearnedCount, getProfile, getUserItem } from "../lib/storage";
import type { JLPTLevel, ItemType } from "../lib/types";

const LEVEL_META: Record<string, { name: string; desc: string }> = {
  foundation: { name: "Foundation", desc: "Writing systems and basic building blocks." },
  n5: { name: "N5", desc: "Absolute beginner — survive basic conversations." },
  n4: { name: "N4", desc: "Elementary — handle daily life conversations." },
  n3: { name: "N3", desc: "Intermediate — read everyday material." },
  n2: { name: "N2", desc: "Upper intermediate — newspapers, workplace, nuance." },
  n1: { name: "N1", desc: "Advanced — near-native comprehension." },
};

export default function Curriculum() {
  const { level } = useParams<{ level: string }>();
  const navigate = useNavigate();
  const profile = getProfile();
  const meta = level ? LEVEL_META[level] : null;
  if (!meta || !level) return <div className="max-w-md mx-auto text-center py-20"><p className="text-ink-400">Level not found.</p><button className="btn-secondary mt-4" onClick={() => navigate("/study-path")}>← Study Path</button></div>;

  const jlpt = level.toUpperCase() as JLPTLevel;
  const counts = level === "foundation" ? { kanji: 0, vocab: 0, grammar: 0 } : getContentCounts(jlpt);
  const total = counts.kanji + counts.vocab + counts.grammar;
  const units = level !== "foundation" ? getUnitsForLevel(jlpt) : [];
  const isTarget = profile.targetLevel === jlpt;

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <button className="btn-secondary text-xs" onClick={() => navigate("/study-path")}>← Study Path</button>

      <header className="card p-6">
        <div className="flex items-center gap-3 mb-2">
          <span className={`text-2xl font-display font-bold ${isTarget ? "text-vermillion-400" : "text-ink-200"}`}>{meta.name}</span>
          {isTarget && <span className="text-[10px] px-2 py-0.5 rounded-full bg-vermillion-500/20 text-vermillion-400 font-semibold">Current Target</span>}
        </div>
        <p className="text-sm text-ink-400">{meta.desc}</p>
        {total > 0 && (
          <div className="flex gap-4 mt-3 text-xs text-ink-500">
            <span>{counts.kanji} kanji</span><span>{counts.vocab} vocab</span><span>{counts.grammar} grammar</span>
          </div>
        )}
      </header>

      {/* Unit cards */}
      {units.length > 0 ? (
        <div className="space-y-3">
          <h2 className="label">Curriculum Units</h2>
          {units.map((unit, i) => <UnitCard key={i} unit={unit} index={i} level={jlpt} navigate={navigate} />)}
        </div>
      ) : total > 0 ? (
        <div className="card p-5 text-center">
          <p className="text-sm text-ink-400 mb-3">No curriculum units defined yet. Browse content directly.</p>
          <div className="flex gap-2 justify-center">
            <button className="btn-primary" onClick={() => navigate(`/lessons/session?type=mixed`)}>Start Lesson</button>
            <button className="btn-secondary" onClick={() => navigate("/quiz")}>Practice Test</button>
          </div>
        </div>
      ) : (
        <div className="card p-5 text-center"><p className="text-sm text-ink-500">Content for this level coming soon.</p></div>
      )}

      {/* Level-wide actions */}
      {total > 0 && (
        <div className="space-y-2">
          <h2 className="label">Level Actions</h2>
          <button className="btn-secondary w-full" onClick={() => navigate("/quiz")}>Take {meta.name} Practice Test</button>
          <div className="grid grid-cols-3 gap-2">
            <button className="btn-secondary text-xs" onClick={() => navigate("/kanji")}>Kanji</button>
            <button className="btn-secondary text-xs" onClick={() => navigate("/vocab")}>Vocab</button>
            <button className="btn-secondary text-xs" onClick={() => navigate("/grammar")}>Grammar</button>
          </div>
        </div>
      )}
    </div>
  );
}

function UnitCard({ unit, index, level, navigate }: { unit: CurriculumUnit; index: number; level: JLPTLevel; navigate: (p: string) => void }) {
  const items = unit.grammar.map((g) => ({ type: "grammar" as ItemType, id: g.id }));
  const learned = items.filter(({ type, id }) => getUserItem(type, id)).length;
  const total = items.length;
  const pct = total > 0 ? Math.round((learned / total) * 100) : 0;
  const isComplete = learned === total && total > 0;

  return (
    <div className={`card p-4 ${isComplete ? "border-jade-500/20" : ""}`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-ink-100 text-sm">{unit.name}</h3>
        <span className="text-xs text-ink-500">{learned}/{total}</span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 rounded-full bg-ink-800 mb-3 overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${isComplete ? "bg-jade-500" : "bg-vermillion-500"}`} style={{ width: `${pct}%` }} />
      </div>

      {/* Grammar items in unit */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {unit.grammar.map((g) => {
          const isLearned = !!getUserItem("grammar", g.id);
          return (
            <span key={g.id} onClick={() => navigate(`/grammar/${g.id}`)}
              className={`text-xs px-2 py-1 rounded-md cursor-pointer transition-all ${
                isLearned ? "bg-jade-500/15 text-jade-400" : "bg-ink-800/60 text-ink-400 hover:bg-ink-800"
              }`}>
              {g.title}
            </span>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {!isComplete && (
          <button className="btn-primary text-xs flex-1" onClick={() => navigate(`/lessons/session?type=mixed&unit=${encodeURIComponent(unit.name)}`)}>
            {learned > 0 ? "Continue" : "Start"} Unit
          </button>
        )}
        <button className="btn-secondary text-xs flex-1" onClick={() => navigate(`/quiz?unit=${encodeURIComponent(unit.name)}&level=${level}`)}>
          Practice
        </button>
      </div>
    </div>
  );
}
