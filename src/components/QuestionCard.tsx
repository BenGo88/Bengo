import type { Question } from "../lib/questions";
import type { ItemType } from "../lib/types";

interface Props {
  question: Question;
  selectedAnswer: number | null;
  onSelect: (index: number) => void;
}

export default function QuestionCard({ question, selectedAnswer, onSelect }: Props) {
  const answered = selectedAnswer !== null;
  const isCorrect = selectedAnswer === question.correctIndex;

  return (
    <div className="space-y-6">
      {/* Prompt */}
      <div className="text-center">
        <p className="label mb-3">{question.promptLabel}</p>
        <p className="text-4xl md:text-5xl font-display font-bold text-ink-50">
          {question.prompt}
        </p>
      </div>

      {/* Choices */}
      <div className="space-y-2.5">
        {question.choices.map((choice, i) => {
          let cls = "w-full text-left card p-4 text-sm font-medium transition-all duration-150 ";
          if (answered) {
            if (i === question.correctIndex)
              cls += "border-jade-500/60 bg-jade-500/10 text-jade-400";
            else if (i === selectedAnswer && !isCorrect)
              cls += "border-vermillion-500/60 bg-vermillion-500/10 text-vermillion-400";
            else cls += "opacity-30 text-ink-500";
          } else {
            cls += "text-ink-200 hover:border-ink-600 hover:bg-ink-800/80 cursor-pointer active:scale-[0.98]";
          }
          return (
            <button
              key={i}
              className={cls}
              onClick={() => { if (!answered) onSelect(i); }}
              disabled={answered}
            >
              <span className="text-ink-600 mr-3 font-mono text-xs">{["A","B","C","D"][i]}</span>
              {choice}
            </button>
          );
        })}
      </div>

      {/* Feedback */}
      {answered && (
        <div className="text-center animate-fade-in space-y-1">
          <p className={`text-lg font-bold ${isCorrect ? "text-jade-400" : "text-vermillion-400"}`}>
            {isCorrect ? "Correct!" : "Incorrect"}
          </p>
          {!isCorrect && (
            <p className="text-sm text-ink-400">
              Answer: <span className="text-ink-200 font-semibold">{question.choices[question.correctIndex]}</span>
            </p>
          )}
          <p className="text-xs text-ink-500">{question.explanation}</p>
        </div>
      )}
    </div>
  );
}

export function TypeBadge({ type }: { type: ItemType }) {
  const cfg = {
    kanji:   { label: "Kanji",   cls: "bg-vermillion-500/15 text-vermillion-400" },
    vocab:   { label: "Vocab",   cls: "bg-jade-500/15 text-jade-400" },
    grammar: { label: "Grammar", cls: "bg-ink-700/60 text-ink-300" },
  }[type];
  return (
    <span className={`inline-block text-[10px] px-2 py-0.5 rounded font-semibold ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}
