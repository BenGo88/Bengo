import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { updateProfile, getProfile } from "../lib/storage";
import { buildQuizQueue, type Question } from "../lib/questions";
import QuestionCard from "../components/QuestionCard";
import type { JLPTLevel } from "../lib/types";

type Phase = "intro" | "quiz" | "result";

const LEVELS: JLPTLevel[] = ["N5", "N4", "N3", "N2"];

export default function Placement() {
  const navigate = useNavigate();
  const profile = getProfile();
  const [phase, setPhase] = useState<Phase>(profile.placementLevel ? "result" : "intro");
  const [qIdx, setQIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<{ level: string; correct: boolean }[]>([]);

  // Build questions: 5 per level from available content
  const questions = useMemo(() => {
    const all: (Question & { level: string })[] = [];
    for (const lvl of LEVELS) {
      const qs = buildQuizQueue("mixed", lvl, "all", 5);
      qs.forEach((q) => all.push({ ...q, level: lvl }));
    }
    return all;
  }, []);

  // ── Intro ──
  if (phase === "intro") {
    return (
      <div className="max-w-lg mx-auto text-center py-16 animate-fade-in">
        <div className="text-5xl mb-5">🎯</div>
        <h1 className="font-display text-2xl font-bold text-ink-50 mb-3">Find Your Level</h1>
        <p className="text-sm text-ink-400 mb-2 leading-relaxed">
          Answer {questions.length} questions across N5–N2 to find your recommended starting point.
        </p>
        <p className="text-xs text-ink-600 mb-8">
          This does not affect your SRS progress. You can retake it anytime.
        </p>
        {questions.length === 0 ? (
          <p className="text-sm text-vermillion-400 mb-6">Not enough content to generate a placement quiz yet.</p>
        ) : (
          <button className="btn-primary w-64 py-3" onClick={() => { setPhase("quiz"); setQIdx(0); setAnswers([]); }}>
            Start Placement Quiz
          </button>
        )}
        {profile.placementLevel && (
          <div className="mt-6 card p-4 inline-block">
            <p className="text-xs text-ink-500">Previous result: <span className="text-vermillion-400 font-bold">{profile.placementLevel}</span></p>
            <button className="text-xs text-ink-500 underline mt-1" onClick={() => setPhase("result")}>View result</button>
          </div>
        )}
        <div className="mt-6">
          <button className="btn-secondary" onClick={() => navigate("/")}>← Dashboard</button>
        </div>
      </div>
    );
  }

  // ── Quiz ──
  if (phase === "quiz" && qIdx < questions.length) {
    const q = questions[qIdx];
    const answered = selected !== null;

    return (
      <div className="max-w-2xl mx-auto animate-fade-in" key={qIdx}>
        <div className="flex items-center justify-between mb-4">
          <span className="label">Placement</span>
          <span className="text-xs text-ink-500">{qIdx + 1} / {questions.length}</span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-ink-800 text-ink-400 font-semibold">{q.level}</span>
        </div>
        <div className="h-1.5 rounded-full bg-ink-800 mb-8 overflow-hidden">
          <div className="h-full rounded-full bg-jade-500 transition-all duration-300" style={{ width: `${((qIdx + 1) / questions.length) * 100}%` }} />
        </div>

        <QuestionCard question={q} selectedAnswer={selected} onSelect={(i) => setSelected(i)} />

        {answered && (
          <button className="btn-primary w-full mt-6 py-3" onClick={() => {
            const correct = selected === q.correctIndex;
            const newAnswers = [...answers, { level: q.level, correct }];
            setAnswers(newAnswers);
            setSelected(null);
            if (qIdx < questions.length - 1) {
              setQIdx(qIdx + 1);
            } else {
              // Calculate and save result
              const scores: Record<string, number> = {};
              for (const lvl of LEVELS) {
                const lvlAnswers = newAnswers.filter((a) => a.level === lvl);
                const lvlCorrect = lvlAnswers.filter((a) => a.correct).length;
                scores[lvl] = lvlAnswers.length > 0 ? Math.round((lvlCorrect / lvlAnswers.length) * 100) : 0;
              }
              const recommended = getRecommendation(scores);
              updateProfile({
                placementLevel: recommended,
                placementDate: new Date().toISOString().slice(0, 10),
                placementScores: scores,
              });
              setPhase("result");
            }
          }}>
            {qIdx < questions.length - 1 ? "Next →" : "See Results →"}
          </button>
        )}
      </div>
    );
  }

  // ── Result ──
  const savedProfile = getProfile();
  const scores = savedProfile.placementScores ?? {};
  const recommended = savedProfile.placementLevel ?? "N5";

  return (
    <div className="max-w-lg mx-auto animate-fade-in">
      <div className="text-center py-8">
        <div className="text-5xl mb-4">📊</div>
        <h1 className="font-display text-2xl font-bold text-ink-50 mb-2">Your Recommended Level</h1>
        <div className="inline-block px-6 py-3 rounded-xl bg-vermillion-500/20 border border-vermillion-500/40 mt-2">
          <span className="text-3xl font-display font-bold text-vermillion-400">{recommended}</span>
        </div>
        {savedProfile.placementDate && (
          <p className="text-xs text-ink-600 mt-3">Taken {savedProfile.placementDate}</p>
        )}
      </div>

      {/* Score breakdown */}
      <div className="card p-5 space-y-3 mb-6">
        <h2 className="label">Score by Level</h2>
        {LEVELS.map((lvl) => {
          const score = scores[lvl] ?? 0;
          return (
            <div key={lvl}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-ink-300 font-medium">{lvl}</span>
                <span className="text-ink-500">{score}%</span>
              </div>
              <div className="h-2 rounded-full bg-ink-800 overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-500 ${score >= 70 ? "bg-jade-500" : score >= 40 ? "bg-yellow-500" : "bg-vermillion-500"}`} style={{ width: `${score}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-3">
        <button className="btn-primary w-full" onClick={() => {
          updateProfile({ targetLevel: recommended === "Foundation" ? "N5" : recommended as JLPTLevel });
          navigate("/study-path");
        }}>
          Set Target to {recommended} & View Path
        </button>
        <button className="btn-secondary w-full" onClick={() => { setPhase("intro"); }}>
          Retake Quiz
        </button>
        <button className="btn-secondary w-full" onClick={() => navigate("/")}>
          ← Dashboard
        </button>
      </div>
    </div>
  );
}

function getRecommendation(scores: Record<string, number>): JLPTLevel | "Foundation" {
  if ((scores["N5"] ?? 0) < 50) return "Foundation";
  if ((scores["N5"] ?? 0) < 70) return "N5";
  if ((scores["N4"] ?? 0) < 70) return "N4";
  if ((scores["N3"] ?? 0) < 70) return "N3";
  return "N2";
}
