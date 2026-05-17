import { Link } from "react-router-dom";
import type { Question } from "../lib/questions";
import { TypeBadge } from "./QuestionCard";

interface ResultItem {
  question: Question;
  correct: boolean;
}

interface Props {
  title: string;
  results: ResultItem[];
  xpEarned: number;
  children?: React.ReactNode; // extra action buttons
}

export default function SessionSummary({ title, results, xpEarned, children }: Props) {
  const correct = results.filter((r) => r.correct).length;
  const total = results.length;
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
  const missed = results.filter((r) => !r.correct);

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="text-center py-8">
        <div className="text-5xl mb-4">{pct >= 80 ? "🎉" : pct >= 50 ? "👍" : "💪"}</div>
        <h1 className="font-display text-2xl font-bold text-ink-50 mb-2">{title}</h1>
        <p className="text-ink-400">
          {correct}/{total} correct — {pct}%
        </p>
      </div>

      {/* Score bar */}
      <div className="card p-5 mb-6">
        <div className="h-3 rounded-full bg-ink-800 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              pct >= 80 ? "bg-jade-500" : pct >= 50 ? "bg-yellow-500" : "bg-vermillion-500"
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
        {xpEarned > 0 && (
          <p className="text-xs text-ink-500 mt-2 text-center">+{xpEarned} XP earned</p>
        )}
      </div>

      {/* Results list */}
      <div className="space-y-1.5 mb-8">
        {results.map((r, i) => (
          <div key={i} className="card px-4 py-3 flex items-center gap-3">
            <span className={`text-base w-5 text-center ${r.correct ? "text-jade-400" : "text-vermillion-400"}`}>
              {r.correct ? "✓" : "✗"}
            </span>
            <span className="text-lg font-display shrink-0">{r.question.prompt}</span>
            <span className="text-sm text-ink-400 flex-1 truncate">
              {r.question.choices[r.question.correctIndex]}
            </span>
            <TypeBadge type={r.question.itemType} />
          </div>
        ))}
      </div>

      {/* Mistakes detail */}
      {missed.length > 0 && (
        <div className="card p-5 mb-6 space-y-3">
          <h2 className="label text-vermillion-400">Mistakes to Review</h2>
          {missed.map((r, i) => (
            <div key={i} className="space-y-1 pb-3 border-b border-ink-800/50 last:border-0 last:pb-0">
              <div className="flex items-baseline gap-2">
                <span className="font-display font-bold text-ink-100">{r.question.prompt}</span>
                <TypeBadge type={r.question.itemType} />
              </div>
              <p className="text-xs text-ink-300">
                <span className="text-jade-400">Correct:</span> {r.question.choices[r.question.correctIndex]}
              </p>
              <p className="text-xs text-ink-400">{r.question.explanation}</p>
              {r.question.detailPath && (
                <Link to={r.question.detailPath} className="text-xs text-vermillion-400 hover:text-vermillion-300">
                  View full explanation →
                </Link>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Action buttons (passed via children) */}
      {children && <div className="flex flex-wrap gap-3 justify-center">{children}</div>}
    </div>
  );
}

export type { ResultItem };
