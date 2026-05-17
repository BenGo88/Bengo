import { useNavigate, Link } from "react-router-dom";
import { getProfile, getLearnedCount } from "../lib/storage";
import { getContentCounts } from "../lib/content";
import type { JLPTLevel } from "../lib/types";

interface LevelInfo {
  id: string;
  name: string;
  jlpt?: JLPTLevel;
  desc: string;
  topics: string[];
}

const LEVELS: LevelInfo[] = [
  {
    id: "foundation",
    name: "Foundation",
    desc: "Your starting point — learn the writing systems and basic sentence building blocks.",
    topics: ["Hiragana & Katakana", "Basic particles (は, が, を, に, で)", "です / ます basics", "Basic word order (SOV)", "Simple greetings"],
  },
  {
    id: "n5", name: "N5", jlpt: "N5",
    desc: "Absolute beginner — survive basic conversations, read simple signs and sentences.",
    topics: ["~100 kanji", "~800 vocab", "Basic grammar patterns", "Self-introduction", "Time, numbers, counters"],
  },
  {
    id: "n4", name: "N4", jlpt: "N4",
    desc: "Elementary — handle daily life conversations, understand simple paragraphs.",
    topics: ["~300 kanji", "~1,500 vocab", "て-form, ない-form, た-form", "Giving/receiving, potential, conditionals", "Basic reading passages"],
  },
  {
    id: "n3", name: "N3", jlpt: "N3",
    desc: "Intermediate bridge — read everyday material and follow natural speech.",
    topics: ["~650 kanji", "~3,700 vocab", "Complex sentence structures", "Formal vs casual register", "Longer reading comprehension"],
  },
  {
    id: "n2", name: "N2", jlpt: "N2",
    desc: "Upper intermediate — read newspapers, workplace communication, nuanced grammar.",
    topics: ["~1,000 kanji", "~6,000 vocab", "Advanced grammar patterns", "Business Japanese", "Abstract concepts & nuance"],
  },
  {
    id: "n1", name: "N1", jlpt: "N1",
    desc: "Advanced — near-native reading, complex texts, specialized vocabulary.",
    topics: ["~2,000 kanji", "~10,000 vocab", "Literary & formal patterns", "Academic/professional texts", "Cultural nuance"],
  },
];

export default function StudyPath() {
  const navigate = useNavigate();
  const profile = getProfile();

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <header>
        <p className="label mb-1">Study Path</p>
        <h1 className="font-display text-2xl font-bold text-ink-50">
          Your Journey to {profile.targetLevel}
        </h1>
        <p className="text-sm text-ink-400 mt-1">
          Follow the path from foundation to fluency. Your current target: {profile.targetLevel}.
        </p>
      </header>

      <div className="space-y-3">
        {LEVELS.map((level, i) => (
          <LevelCard
            key={level.id}
            level={level}
            index={i}
            isTarget={level.jlpt === profile.targetLevel}
            targetLevel={profile.targetLevel}
          />
        ))}
      </div>

      <div className="text-center pt-4">
        <button className="btn-secondary" onClick={() => navigate("/")}>
          ← Dashboard
        </button>
      </div>
    </div>
  );
}

function LevelCard({ level, index, isTarget, targetLevel }: {
  level: LevelInfo; index: number; isTarget: boolean; targetLevel: JLPTLevel;
}) {
  const counts = level.jlpt ? getContentCounts(level.jlpt) : null;
  const learned = level.jlpt ? {
    kanji: getLearnedCount("kanji"),
    vocab: getLearnedCount("vocab"),
    grammar: getLearnedCount("grammar"),
  } : null;

  // Note: getLearnedCount doesn't filter by level currently, so we show total available
  const totalContent = counts ? counts.kanji + counts.vocab + counts.grammar : 0;

  const jlptOrder = ["N5", "N4", "N3", "N2", "N1"];
  const targetIdx = jlptOrder.indexOf(targetLevel);
  const levelIdx = level.jlpt ? jlptOrder.indexOf(level.jlpt) : -1;
  const isPast = levelIdx >= 0 && levelIdx < targetIdx;
  const isFuture = levelIdx > targetIdx;

  return (
    <div className={`card p-5 relative ${
      isTarget ? "border-vermillion-500/40 bg-vermillion-500/5" :
      isPast ? "border-jade-500/20 bg-jade-500/5" :
      "border-ink-800/50"
    }`}>
      {/* Connection line */}
      {index > 0 && (
        <div className="absolute -top-3 left-8 w-0.5 h-3 bg-ink-700" />
      )}

      <div className="flex items-start gap-4">
        {/* Level marker */}
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold ${
          isTarget ? "bg-vermillion-500 text-white" :
          isPast ? "bg-jade-500/30 text-jade-400" :
          "bg-ink-800 text-ink-500"
        }`}>
          {level.jlpt || "基"}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-display font-bold text-ink-100">{level.name}</h3>
            {isTarget && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-vermillion-500/20 text-vermillion-400 font-semibold">
                Current Target
              </span>
            )}
            {isPast && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-jade-500/20 text-jade-400 font-semibold">
                Foundation
              </span>
            )}
          </div>
          <p className="text-sm text-ink-400 mt-1 leading-relaxed">{level.desc}</p>

          {/* Topics */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {level.topics.map((t, i) => (
              <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-ink-800 text-ink-500">
                {t}
              </span>
            ))}
          </div>

          {/* Content count */}
          {counts && totalContent > 0 && (
            <p className="text-xs text-ink-500 mt-2">
              {counts.kanji} kanji · {counts.vocab} vocab · {counts.grammar} grammar available
            </p>
          )}
          {counts && totalContent === 0 && (
            <p className="text-xs text-ink-600 mt-2">Content coming soon</p>
          )}

          {/* Curriculum link */}
          <Link
            to={`/curriculum/${level.id}`}
            className="inline-block text-xs text-vermillion-400 hover:text-vermillion-300 font-medium mt-2"
          >
            View {level.name} Curriculum →
          </Link>
        </div>
      </div>
    </div>
  );
}
