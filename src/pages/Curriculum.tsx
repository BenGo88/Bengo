import { useParams, useNavigate, Link } from "react-router-dom";
import { getContentCounts } from "../lib/content";
import { getLearnedCount, getProfile } from "../lib/storage";
import type { JLPTLevel } from "../lib/types";

const LEVEL_INFO: Record<string, { name: string; desc: string; focus: string[] }> = {
  foundation: { name: "Foundation", desc: "Writing systems and basic building blocks.", focus: ["Hiragana & Katakana", "Basic particles", "です/ます", "Word order"] },
  n5: { name: "N5", desc: "Absolute beginner — survive basic conversations.", focus: ["~100 kanji", "~800 vocab", "Basic patterns", "Self-intro"] },
  n4: { name: "N4", desc: "Elementary — handle daily life conversations.", focus: ["~300 kanji", "~1,500 vocab", "て-form", "Conditionals"] },
  n3: { name: "N3", desc: "Intermediate bridge — read everyday material.", focus: ["~650 kanji", "~3,700 vocab", "Complex sentences", "Register"] },
  n2: { name: "N2", desc: "Upper intermediate — newspapers, workplace, nuance.", focus: ["~1,000 kanji", "~6,000 vocab", "Advanced patterns", "Business"] },
  n1: { name: "N1", desc: "Advanced — near-native reading and comprehension.", focus: ["~2,000 kanji", "~10,000 vocab", "Literary patterns", "Academic"] },
};

export default function Curriculum() {
  const { level } = useParams<{ level: string }>();
  const navigate = useNavigate();
  const profile = getProfile();
  const info = level ? LEVEL_INFO[level] : null;

  if (!info || !level) {
    return (
      <div className="max-w-md mx-auto text-center py-20">
        <p className="text-ink-400">Level not found.</p>
        <button className="btn-secondary mt-4" onClick={() => navigate("/study-path")}>← Study Path</button>
      </div>
    );
  }

  const jlpt = level.toUpperCase() as JLPTLevel;
  const counts = level === "foundation" ? { kanji: 0, vocab: 0, grammar: 0 } : getContentCounts(jlpt);
  const learned = { kanji: getLearnedCount("kanji"), vocab: getLearnedCount("vocab"), grammar: getLearnedCount("grammar") };
  const total = counts.kanji + counts.vocab + counts.grammar;
  const isTarget = profile.targetLevel === jlpt;

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <button className="btn-secondary text-xs" onClick={() => navigate("/study-path")}>← Study Path</button>

      <header className="card p-6">
        <div className="flex items-center gap-3 mb-2">
          <span className={`text-2xl font-display font-bold ${isTarget ? "text-vermillion-400" : "text-ink-200"}`}>
            {info.name}
          </span>
          {isTarget && <span className="text-[10px] px-2 py-0.5 rounded-full bg-vermillion-500/20 text-vermillion-400 font-semibold">Current Target</span>}
        </div>
        <p className="text-sm text-ink-400">{info.desc}</p>
        <div className="flex flex-wrap gap-1.5 mt-3">
          {info.focus.map((f, i) => (
            <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-ink-800 text-ink-500">{f}</span>
          ))}
        </div>
      </header>

      {/* Content stats */}
      {total > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <StatBox label="Kanji" count={counts.kanji} />
          <StatBox label="Vocab" count={counts.vocab} />
          <StatBox label="Grammar" count={counts.grammar} />
        </div>
      )}

      {total === 0 && (
        <div className="card p-5 text-center">
          <p className="text-sm text-ink-500">Content for this level is coming soon.</p>
        </div>
      )}

      {/* Actions */}
      {total > 0 && (
        <div className="space-y-2">
          <h2 className="label">Actions</h2>
          <button className="btn-primary w-full py-3" onClick={() => navigate(`/lessons/session?type=mixed`)}>
            Start {info.name} Lesson
          </button>
          <button className="btn-secondary w-full" onClick={() => navigate("/quiz")}>
            Take {info.name} Practice Test
          </button>
          <div className="grid grid-cols-3 gap-2">
            <Link to="/kanji" className="btn-secondary text-center text-xs">Browse Kanji</Link>
            <Link to="/vocab" className="btn-secondary text-center text-xs">Browse Vocab</Link>
            <Link to="/grammar" className="btn-secondary text-center text-xs">Browse Grammar</Link>
          </div>
        </div>
      )}
    </div>
  );
}

function StatBox({ label, count }: { label: string; count: number }) {
  return (
    <div className="card px-3 py-3 text-center">
      <p className="text-xl font-display font-bold text-ink-200">{count}</p>
      <p className="text-[10px] text-ink-500 font-semibold uppercase tracking-wider">{label}</p>
    </div>
  );
}
