import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  getDueItems,
  processAnswer,
  recordStudySession,
  getProfile,
} from "../lib/storage";
import { buildQuestionQueue, type Question } from "../lib/questions";
import QuestionCard, { TypeBadge } from "../components/QuestionCard";
import SessionSummary, { type ResultItem } from "../components/SessionSummary";
import type { UserItem } from "../lib/types";

type Phase = "queue" | "session" | "summary";

export default function Reviews() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>("queue");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [results, setResults] = useState<ResultItem[]>([]);
  const [xpEarned, setXpEarned] = useState(0);

  // Get due items once
  const dueItems = useMemo(() => getDueItems(), []);
  const kanjiDue = dueItems.filter((i) => i.type === "kanji").length;
  const vocabDue = dueItems.filter((i) => i.type === "vocab").length;
  const grammarDue = dueItems.filter((i) => i.type === "grammar").length;

  // Build questions
  const questions = useMemo(
    () => buildQuestionQueue(dueItems.map((i) => ({ type: i.type, id: i.id }))),
    [dueItems],
  );

  // ── Queue screen (no due items or start) ──
  if (phase === "queue") {
    if (dueItems.length === 0) {
      return (
        <div className="max-w-md mx-auto text-center py-20 animate-fade-in">
          <div className="text-5xl mb-5">✨</div>
          <h1 className="font-display text-2xl font-bold text-ink-100 mb-2">
            No Reviews Due
          </h1>
          <p className="text-sm text-ink-400 mb-8">
            Your SRS queue is clear. Learn new items or practice with a quiz!
          </p>
          <div className="flex flex-col gap-3 items-center">
            <button className="btn-primary w-60" onClick={() => navigate("/lessons")}>
              Learn New Items
            </button>
            <button className="btn-secondary w-60" onClick={() => navigate("/quiz")}>
              Random Quiz
            </button>
            <button className="btn-secondary w-60" onClick={() => navigate("/")}>
              ← Dashboard
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="max-w-lg mx-auto animate-fade-in">
        <header className="mb-8">
          <p className="label mb-1">Reviews</p>
          <h1 className="font-display text-2xl font-bold text-ink-50">
            {dueItems.length} item{dueItems.length === 1 ? "" : "s"} due
          </h1>
          <p className="text-sm text-ink-400 mt-1">
            Reviews update your SRS stages. Correct answers advance items, wrong answers drop them back.
          </p>
        </header>

        <div className="grid grid-cols-3 gap-3 mb-8">
          <StatBox label="Kanji" count={kanjiDue} />
          <StatBox label="Vocab" count={vocabDue} />
          <StatBox label="Grammar" count={grammarDue} />
        </div>

        <button
          className="btn-primary w-full text-base py-4"
          onClick={() => setPhase("session")}
        >
          Start Review
        </button>

        <button
          className="btn-secondary w-full mt-3"
          onClick={() => navigate("/")}
        >
          ← Dashboard
        </button>
      </div>
    );
  }

  // ── Session: one question at a time ──
  if (phase === "session" && questionIndex < questions.length) {
    const q = questions[questionIndex];
    const answered = selectedAnswer !== null;

    return (
      <div className="max-w-2xl mx-auto animate-fade-in" key={questionIndex}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <span className="label">Review</span>
          <span className="text-xs text-ink-500">
            {questionIndex + 1} / {questions.length}
          </span>
          <TypeBadge type={q.itemType} />
        </div>

        {/* Progress bar */}
        <div className="h-1.5 rounded-full bg-ink-800 mb-8 overflow-hidden">
          <div
            className="h-full rounded-full bg-vermillion-500 transition-all duration-300"
            style={{ width: `${((questionIndex + 1) / questions.length) * 100}%` }}
          />
        </div>

        <QuestionCard
          question={q}
          selectedAnswer={selectedAnswer}
          onSelect={(idx) => setSelectedAnswer(idx)}
        />

        {/* Next */}
        {answered && (
          <button
            className="btn-primary w-full mt-6 py-3"
            onClick={() => {
              const correct = selectedAnswer === q.correctIndex;

              // Process through SRS engine
              processAnswer(q.itemType, q.itemId, correct);
              if (correct) setXpEarned((x) => x + 5);

              const newResults = [...results, { question: q, correct, selectedIndex: selectedAnswer! }];
              setResults(newResults);

              if (questionIndex < questions.length - 1) {
                setQuestionIndex(questionIndex + 1);
                setSelectedAnswer(null);
              } else {
                recordStudySession();
                setPhase("summary");
              }
            }}
          >
            {questionIndex < questions.length - 1 ? "Next →" : "See Results →"}
          </button>
        )}
      </div>
    );
  }

  // ── Summary ──
  if (phase === "summary") {
    return (
      <SessionSummary
        title="Review Complete!"
        results={results}
        xpEarned={xpEarned}
      >
        <button className="btn-primary" onClick={() => navigate("/")}>
          Dashboard
        </button>
        <button className="btn-secondary" onClick={() => navigate("/quiz")}>
          Random Quiz
        </button>
        <button className="btn-secondary" onClick={() => navigate("/lessons")}>
          Learn More
        </button>
      </SessionSummary>
    );
  }

  return null;
}

function StatBox({ label, count }: { label: string; count: number }) {
  return (
    <div className="card px-3 py-3 text-center">
      <p className="text-xl font-display font-bold text-ink-200">{count}</p>
      <p className="text-[10px] text-ink-500 font-semibold uppercase tracking-wider">{label}</p>
    </div>
  );
}
