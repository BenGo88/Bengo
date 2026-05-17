import { getBeginnerAssist } from "../lib/storage";

interface Props {
  simpleExplanation?: string;
  prerequisites?: string[];
  warning?: string;
  hint?: string;
}

/**
 * Displays beginner-friendly scaffolding when Beginner Assist is enabled.
 * Shows nothing when disabled — content stays compact for advanced users.
 */
export default function BeginnerNote({ simpleExplanation, prerequisites, warning, hint }: Props) {
  const assist = getBeginnerAssist();
  if (!assist) return null;

  const hasContent = simpleExplanation || (prerequisites && prerequisites.length > 0) || warning || hint;
  if (!hasContent) return null;

  return (
    <div className="space-y-3">
      {/* Simple explanation */}
      {simpleExplanation && (
        <div className="card p-4 border-jade-500/20 bg-jade-500/5">
          <p className="label mb-1 text-jade-400">Simple Explanation</p>
          <p className="text-sm text-ink-200 leading-relaxed">{simpleExplanation}</p>
        </div>
      )}

      {/* Beginner hint */}
      {hint && (
        <div className="card p-4 border-jade-500/20 bg-jade-500/5">
          <p className="label mb-1 text-jade-400">Hint</p>
          <p className="text-sm text-ink-200 leading-relaxed">{hint}</p>
        </div>
      )}

      {/* Prerequisites */}
      {prerequisites && prerequisites.length > 0 && (
        <div className="card p-4">
          <p className="label mb-2">Prerequisites</p>
          <div className="flex flex-wrap gap-1.5">
            {prerequisites.map((p, i) => (
              <span
                key={i}
                className="text-xs px-2.5 py-1 rounded-lg bg-ink-800 text-ink-300 font-medium"
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Warning */}
      {warning && (
        <div className="card p-4 border-vermillion-500/20 bg-vermillion-500/5">
          <p className="label mb-1 text-vermillion-400">Watch Out</p>
          <p className="text-sm text-ink-300 leading-relaxed">{warning}</p>
        </div>
      )}
    </div>
  );
}
