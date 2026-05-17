import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getReadingById, saveReadingResult, getReadingProgress } from "../lib/reading";
import { startLearning, getUserItem } from "../lib/storage";
import { autoDetectLexicon } from "../lib/lexicon";
import SentenceBlock from "../components/SentenceBlock";
import type { ReadingQuestion } from "../lib/types";

type Phase = "reading" | "questions" | "summary";

export default function ReadingDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const passage = id ? getReadingById(id) : null;
  const progress = id ? getReadingProgress(id) : null;

  const [phase, setPhase] = useState<Phase>("reading");
  const [showEnglish, setShowEnglish] = useState(false);
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState<(string | null)[]>([]);
  const [unknownWords, setUnknownWords] = useState<string[]>([]);

  if (!passage) return <div className="max-w-md mx-auto text-center py-20"><p className="text-ink-400">Passage not found.</p><button className="btn-secondary mt-4" onClick={() => navigate("/reading")}>← Reading Library</button></div>;

  const questions = passage.questions;
  const currentQ = questions[qIndex];
  const score = answers.filter((a, i) => a === questions[i]?.answer).length;

  function handleAnswer(choice: string) {
    const newAnswers = [...answers];
    newAnswers[qIndex] = choice;
    setAnswers(newAnswers);
  }

  function nextQuestion() {
    if (qIndex < questions.length - 1) {
      setQIndex(qIndex + 1);
    } else {
      saveReadingResult(passage!.id, score + (answers[qIndex] === currentQ.answer ? 1 : 0), questions.length, unknownWords);
      setPhase("summary");
    }
  }

  function toggleUnknown(word: string) {
    setUnknownWords((prev) => prev.includes(word) ? prev.filter((w) => w !== word) : [...prev, word]);
  }

  // Reading phase
  if (phase === "reading") {
    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
        <button className="btn-secondary text-xs" onClick={() => navigate("/reading")}>← Reading Library</button>

        <header className="card p-5">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] px-2 py-0.5 rounded bg-vermillion-500/20 text-vermillion-400 font-bold">{passage.jlpt}</span>
            <span className="text-[10px] text-ink-600">~{passage.estimatedMinutes} min</span>
            <span className="text-[10px] text-ink-600 capitalize">{passage.category.replace("_", " ")}</span>
          </div>
          <h1 className="font-display text-xl font-bold text-ink-50">{passage.title}</h1>
        </header>

        {/* Toggle controls */}
        <div className="flex gap-2">
          <button className={`text-xs px-3 py-1.5 rounded-lg ${showEnglish ? "bg-jade-500/20 text-jade-400" : "bg-ink-800 text-ink-500"}`}
            onClick={() => setShowEnglish(!showEnglish)}>
            {showEnglish ? "Hide English" : "Show English"}
          </button>
        </div>

        {/* Passage */}
        <div className="card p-5 space-y-5">
          {passage.sentences.map((s, i) => (
            <div key={i} className="space-y-1">
              <SentenceBlock sentence={{ ja: s.japanese, en: showEnglish ? s.english : "", reading: s.reading, tokens: s.tokens, structure: s.structure }} compact />
              {!showEnglish && <p className="text-[10px] text-ink-700 italic">Tap "Show English" to see translation</p>}
            </div>
          ))}
        </div>

        {passage.notes && <p className="text-xs text-ink-500 italic">💡 {passage.notes}</p>}

        <button className="btn-primary w-full py-3" onClick={() => { setPhase("questions"); setAnswers(new Array(questions.length).fill(null)); }}>
          Answer Questions ({questions.length})
        </button>
      </div>
    );
  }

  // Questions phase
  if (phase === "questions" && currentQ) {
    const answered = answers[qIndex] !== null;
    const isCorrect = answers[qIndex] === currentQ.answer;

    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <p className="label">Question {qIndex + 1} / {questions.length}</p>
          <span className="text-[10px] px-2 py-0.5 rounded bg-ink-800 text-ink-500 capitalize">{currentQ.type.replace("_", " ")}</span>
        </div>

        <div className="card p-5">
          <p className="text-lg font-display font-bold text-ink-100 leading-relaxed">{currentQ.question}</p>
        </div>

        <div className="space-y-2">
          {currentQ.choices.map((choice, i) => {
            let cls = "w-full text-left card p-4 text-sm font-medium transition-all duration-150 ";
            if (answered) {
              if (choice === currentQ.answer) cls += "border-jade-500/60 bg-jade-500/10 text-jade-400";
              else if (choice === answers[qIndex] && !isCorrect) cls += "border-vermillion-500/60 bg-vermillion-500/10 text-vermillion-400";
              else cls += "opacity-30 text-ink-500";
            } else {
              cls += "text-ink-200 hover:border-ink-600 hover:bg-ink-800/80 cursor-pointer";
            }
            return <button key={i} className={cls} onClick={() => !answered && handleAnswer(choice)} disabled={answered}>{choice}</button>;
          })}
        </div>

        {answered && (
          <div className="card p-4 animate-fade-in">
            <p className={`text-sm font-semibold ${isCorrect ? "text-jade-400" : "text-vermillion-400"}`}>
              {isCorrect ? "✓ Correct!" : `✗ Wrong — correct answer: ${currentQ.answer}`}
            </p>
            <p className="text-xs text-ink-400 mt-1">{currentQ.explanation}</p>
            <button className="btn-primary mt-3 w-full" onClick={nextQuestion}>
              {qIndex < questions.length - 1 ? "Next Question" : "See Results"}
            </button>
          </div>
        )}
      </div>
    );
  }

  // Summary phase
  const finalScore = answers.filter((a, i) => a === questions[i]?.answer).length;
  const pct = questions.length > 0 ? Math.round((finalScore / questions.length) * 100) : 0;

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <header className="text-center">
        <p className="label mb-2">Reading Complete</p>
        <h1 className="font-display text-3xl font-bold text-ink-50">{passage.title}</h1>
      </header>

      <div className="card p-6 text-center">
        <p className={`text-5xl font-display font-bold ${pct >= 80 ? "text-jade-400" : pct >= 50 ? "text-yellow-500" : "text-vermillion-400"}`}>{pct}%</p>
        <p className="text-sm text-ink-400 mt-2">{finalScore} / {questions.length} correct</p>
        {progress && progress.timesRead > 0 && <p className="text-xs text-ink-600 mt-1">Best: {Math.max(progress.bestScore, pct)}%</p>}
      </div>

      {/* Review answers */}
      <div className="card p-5 space-y-3">
        <h2 className="label">Review</h2>
        {questions.map((q, i) => {
          const correct = answers[i] === q.answer;
          return (
            <div key={i} className="space-y-1 pb-3 border-b border-ink-800/50 last:border-0 last:pb-0">
              <div className="flex items-start gap-2">
                <span className={`text-sm ${correct ? "text-jade-400" : "text-vermillion-400"}`}>{correct ? "✓" : "✗"}</span>
                <div>
                  <p className="text-sm text-ink-200">{q.question}</p>
                  {!correct && <p className="text-xs text-ink-400">Your answer: {answers[i]} → Correct: {q.answer}</p>}
                  <p className="text-xs text-ink-500 mt-0.5">{q.explanation}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex gap-3 justify-center">
        <button className="btn-primary" onClick={() => navigate("/reading")}>Back to Library</button>
        <button className="btn-secondary" onClick={() => { setPhase("reading"); setQIndex(0); setAnswers([]); }}>Read Again</button>
      </div>
    </div>
  );
}
