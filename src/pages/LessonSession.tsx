import { useState, useMemo, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  getSuggestedLessonBatch,
  getContentById,
  getDistractors,
  getReadingDistractors,
  type LessonItem,
} from "../lib/content";
import { getProfile, startLearning, recordStudySession } from "../lib/storage";
import type { ItemType, Kanji, Vocab, GrammarPoint, JLPTLevel } from "../lib/types";

type Phase = "preview" | "teach" | "quiz" | "results";

interface QuizQuestion {
  itemIndex: number;
  prompt: string;
  promptLabel: string;
  choices: string[];
  correctIndex: number;
}

export default function LessonSession() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const filterType = searchParams.get("type") as ItemType | "mixed" | null;
  const profile = getProfile();
  const level = profile.targetLevel as JLPTLevel;

  const batch = useMemo(
    () =>
      getSuggestedLessonBatch(
        level,
        filterType && filterType !== "mixed" ? (filterType as ItemType) : undefined,
      ),
    [level, filterType],
  );

  const [phase, setPhase] = useState<Phase>("preview");
  const [teachIndex, setTeachIndex] = useState(0);
  const [quizIndex, setQuizIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [quizResults, setQuizResults] = useState<boolean[]>([]);
  const [finished, setFinished] = useState(false);

  // Generate quiz questions once
  const quizQuestions: QuizQuestion[] = useMemo(() => buildQuiz(batch), [batch]);

  // ── Empty state ──
  if (batch.length === 0) {
    return (
      <div className="max-w-md mx-auto text-center py-20 animate-fade-in">
        <div className="text-5xl mb-4">✨</div>
        <h1 className="font-display text-2xl font-bold text-ink-100 mb-2">Nothing new to learn!</h1>
        <p className="text-sm text-ink-400 mb-6">
          All {level} items are already in your study queue. Add more content or change your target level.
        </p>
        <button className="btn-secondary" onClick={() => navigate("/lessons")}>← Back</button>
      </div>
    );
  }

  // ── Phase A: Preview ──
  if (phase === "preview") {
    return (
      <div className="max-w-2xl mx-auto animate-fade-in">
        <PhaseHeader phase="Preview" step={0} total={batch.length} onBack={() => navigate("/lessons")} />

        <div className="text-center mb-8">
          <h1 className="font-display text-2xl font-bold text-ink-50 mb-2">
            Today's Lesson
          </h1>
          <p className="text-sm text-ink-400">
            {batch.length} item{batch.length === 1 ? "" : "s"} to learn
          </p>
        </div>

        <div className="space-y-2 mb-8">
          {batch.map((item, i) => (
            <div key={`${item.type}:${item.id}`} className="card p-4 flex items-center gap-4">
              <span className="text-2xl font-display w-12 text-center shrink-0">{item.title}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-ink-200 font-medium truncate">{item.subtitle}</p>
              </div>
              <TypeBadge type={item.type} />
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-ink-800 text-ink-500 font-semibold shrink-0">
                {i + 1}/{batch.length}
              </span>
            </div>
          ))}
        </div>

        <button
          className="btn-primary w-full text-base py-4"
          onClick={() => { setPhase("teach"); setTeachIndex(0); }}
        >
          Start Lesson
        </button>
      </div>
    );
  }

  // ── Phase B: Teach ──
  if (phase === "teach") {
    const currentItem = batch[teachIndex];
    const content = getContentById(currentItem.type, currentItem.id);

    return (
      <div className="max-w-2xl mx-auto animate-fade-in" key={`teach-${teachIndex}`}>
        <PhaseHeader
          phase="Lesson"
          step={teachIndex + 1}
          total={batch.length}
          onBack={() => teachIndex === 0 ? setPhase("preview") : setTeachIndex(teachIndex - 1)}
        />

        {/* Progress */}
        <div className="h-1.5 rounded-full bg-ink-800 mb-6 overflow-hidden">
          <div
            className="h-full rounded-full bg-vermillion-500 transition-all duration-300"
            style={{ width: `${((teachIndex + 1) / batch.length) * 100}%` }}
          />
        </div>

        {/* Content card */}
        <div className="space-y-6">
          {currentItem.type === "kanji" && content && <TeachKanji kanji={content as Kanji} />}
          {currentItem.type === "vocab" && content && <TeachVocab vocab={content as Vocab} />}
          {currentItem.type === "grammar" && content && <TeachGrammar grammar={content as GrammarPoint} />}
        </div>

        {/* Navigation */}
        <div className="flex gap-3 mt-8">
          {teachIndex > 0 && (
            <button className="btn-secondary flex-1" onClick={() => setTeachIndex(teachIndex - 1)}>
              ← Previous
            </button>
          )}
          <button
            className="btn-primary flex-1 py-3"
            onClick={() => {
              if (teachIndex < batch.length - 1) {
                setTeachIndex(teachIndex + 1);
              } else {
                setPhase("quiz");
                setQuizIndex(0);
                setSelectedAnswer(null);
                setQuizResults([]);
              }
            }}
          >
            {teachIndex < batch.length - 1 ? "Next →" : "Start Quiz →"}
          </button>
        </div>
      </div>
    );
  }

  // ── Phase C: Quiz ──
  if (phase === "quiz" && quizIndex < quizQuestions.length) {
    const q = quizQuestions[quizIndex];
    const answered = selectedAnswer !== null;
    const isCorrect = selectedAnswer === q.correctIndex;

    return (
      <div className="max-w-2xl mx-auto animate-fade-in" key={`quiz-${quizIndex}`}>
        <PhaseHeader
          phase="Quiz"
          step={quizIndex + 1}
          total={quizQuestions.length}
          onBack={() => {
            if (quizIndex === 0) { setPhase("teach"); setTeachIndex(batch.length - 1); }
            else { setQuizIndex(quizIndex - 1); setSelectedAnswer(null); setQuizResults(quizResults.slice(0, -1)); }
          }}
        />

        <div className="h-1.5 rounded-full bg-ink-800 mb-8 overflow-hidden">
          <div
            className="h-full rounded-full bg-jade-500 transition-all duration-300"
            style={{ width: `${((quizIndex + 1) / quizQuestions.length) * 100}%` }}
          />
        </div>

        {/* Question */}
        <div className="text-center mb-8">
          <p className="label mb-3">{q.promptLabel}</p>
          <p className="text-4xl md:text-5xl font-display font-bold text-ink-50">{q.prompt}</p>
        </div>

        {/* Choices */}
        <div className="space-y-3 mb-8">
          {q.choices.map((choice, i) => {
            let cls = "card-hover p-4 text-center text-sm font-medium transition-all ";
            if (answered) {
              if (i === q.correctIndex) cls += "border-jade-500/60 bg-jade-500/10 text-jade-400";
              else if (i === selectedAnswer && !isCorrect) cls += "border-vermillion-500/60 bg-vermillion-500/10 text-vermillion-400";
              else cls += "opacity-40";
            } else {
              cls += "text-ink-200 cursor-pointer";
            }
            return (
              <button
                key={i}
                className={cls}
                onClick={() => { if (!answered) setSelectedAnswer(i); }}
                disabled={answered}
              >
                {choice}
              </button>
            );
          })}
        </div>

        {/* Feedback */}
        {answered && (
          <div className="text-center mb-6 animate-fade-in">
            <p className={`text-lg font-bold ${isCorrect ? "text-jade-400" : "text-vermillion-400"}`}>
              {isCorrect ? "Correct!" : "Not quite"}
            </p>
            {!isCorrect && (
              <p className="text-sm text-ink-400 mt-1">
                The answer was: <span className="text-ink-200 font-semibold">{q.choices[q.correctIndex]}</span>
              </p>
            )}
          </div>
        )}

        {/* Next button */}
        {answered && (
          <button
            className="btn-primary w-full py-3"
            onClick={() => {
              const newResults = [...quizResults, isCorrect];
              setQuizResults(newResults);
              if (quizIndex < quizQuestions.length - 1) {
                setQuizIndex(quizIndex + 1);
                setSelectedAnswer(null);
              } else {
                // Add all items to SRS
                for (let i = 0; i < batch.length; i++) {
                  startLearning(batch[i].type, batch[i].id);
                }
                recordStudySession();
                setQuizResults(newResults);
                setFinished(true);
                setPhase("results");
              }
            }}
          >
            {quizIndex < quizQuestions.length - 1 ? "Next Question →" : "See Results →"}
          </button>
        )}
      </div>
    );
  }

  // ── Phase D: Results ──
  if (phase === "results" && finished) {
    const correctCount = quizResults.filter(Boolean).length;
    const total = quizResults.length;
    const pct = total > 0 ? Math.round((correctCount / total) * 100) : 0;

    return (
      <div className="max-w-2xl mx-auto animate-fade-in">
        <div className="text-center py-8">
          <div className="text-5xl mb-4">{pct >= 75 ? "🎉" : pct >= 50 ? "👍" : "💪"}</div>
          <h1 className="font-display text-2xl font-bold text-ink-50 mb-2">
            Lesson Complete!
          </h1>
          <p className="text-ink-400">
            {correctCount}/{total} correct — {pct}%
          </p>
        </div>

        {/* Score bar */}
        <div className="card p-5 mb-6">
          <div className="h-3 rounded-full bg-ink-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${pct >= 75 ? "bg-jade-500" : pct >= 50 ? "bg-yellow-500" : "bg-vermillion-500"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-xs text-ink-500 mt-2 text-center">
            +{batch.length * 10} XP earned — {batch.length} items added to your study queue
          </p>
        </div>

        {/* Item results */}
        <div className="space-y-2 mb-8">
          {batch.map((item, i) => {
            const passed = quizResults[i] ?? true;
            return (
              <div key={`${item.type}:${item.id}`} className="card p-4 flex items-center gap-3">
                <span className={`text-lg w-6 text-center ${passed ? "text-jade-400" : "text-vermillion-400"}`}>
                  {passed ? "✓" : "✗"}
                </span>
                <span className="text-xl font-display shrink-0">{item.title}</span>
                <span className="text-sm text-ink-400 flex-1 truncate">{item.subtitle}</span>
                <TypeBadge type={item.type} />
                {!passed && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-vermillion-500/20 text-vermillion-400 font-semibold">
                    Needs review
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex gap-3">
          <button className="btn-secondary flex-1" onClick={() => navigate("/lessons")}>
            More Lessons
          </button>
          <button className="btn-primary flex-1" onClick={() => navigate("/")}>
            Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Fallback
  return null;
}

/* ── Teach sub-components ────────────────────────────────────────────────── */

function TeachKanji({ kanji }: { kanji: Kanji }) {
  return (
    <>
      <div className="card p-6 text-center">
        <TypeBadge type="kanji" />
        <div className="text-7xl font-display text-ink-50 my-4">{kanji.character}</div>
        <div className="flex flex-wrap gap-2 justify-center">
          {kanji.meanings.map((m) => (
            <span key={m} className="px-3 py-1 rounded-full bg-ink-800 text-ink-200 text-sm">{m}</span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="card p-4">
          <p className="label mb-1">On'yomi</p>
          <p className="text-lg font-display text-ink-100">{kanji.onyomi.join("、") || "—"}</p>
        </div>
        <div className="card p-4">
          <p className="label mb-1">Kun'yomi</p>
          <p className="text-lg font-display text-ink-100">{kanji.kunyomi.join("、") || "—"}</p>
        </div>
      </div>

      {kanji.mnemonic && (
        <div className="card p-4">
          <p className="label mb-1">Mnemonic</p>
          <p className="text-sm text-ink-300 leading-relaxed">{kanji.mnemonic}</p>
        </div>
      )}

      {kanji.common_words.length > 0 && (
        <div className="card p-4">
          <p className="label mb-2">Common Words</p>
          {kanji.common_words.map((w, i) => (
            <div key={i} className="flex items-baseline gap-2 text-sm mb-1">
              <span className="text-ink-100 font-display font-semibold">{w.word}</span>
              <span className="text-ink-500 font-mono text-xs">{w.reading}</span>
              <span className="text-ink-400">{w.meaning}</span>
            </div>
          ))}
        </div>
      )}

      {kanji.usage_note && (
        <div className="card p-4">
          <p className="label mb-1">Where You'll See This</p>
          <p className="text-sm text-ink-300">{kanji.usage_note}</p>
        </div>
      )}
    </>
  );
}

function TeachVocab({ vocab }: { vocab: Vocab }) {
  return (
    <>
      <div className="card p-6 text-center">
        <TypeBadge type="vocab" />
        <div className="text-4xl font-display font-bold text-ink-50 my-3">{vocab.word}</div>
        <p className="text-lg text-ink-400 font-mono">{vocab.reading}</p>
        <div className="flex flex-wrap gap-2 justify-center mt-3">
          {vocab.meanings.map((m) => (
            <span key={m} className="px-3 py-1 rounded-full bg-ink-800 text-ink-200 text-sm">{m}</span>
          ))}
        </div>
      </div>

      {vocab.sentences.length > 0 && (
        <div className="card p-4">
          <p className="label mb-2">Examples</p>
          {vocab.sentences.map((s, i) => (
            <div key={i} className="mb-3 last:mb-0">
              <p className="text-base text-ink-100 font-display">{s.ja}</p>
              <p className="text-sm text-ink-400">{s.en}</p>
            </div>
          ))}
        </div>
      )}

      {vocab.nuance && (
        <div className="card p-4">
          <p className="label mb-1">Nuance</p>
          <p className="text-sm text-ink-300">{vocab.nuance}</p>
        </div>
      )}

      {vocab.collocations && vocab.collocations.length > 0 && (
        <div className="card p-4">
          <p className="label mb-2">Collocations</p>
          <div className="flex flex-wrap gap-2">
            {vocab.collocations.map((c, i) => (
              <span key={i} className="px-2 py-1 rounded-lg bg-ink-800 text-ink-200 text-sm font-display">{c}</span>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function TeachGrammar({ grammar }: { grammar: GrammarPoint }) {
  return (
    <>
      <div className="card p-6">
        <TypeBadge type="grammar" />
        <h2 className="text-2xl font-display font-bold text-ink-50 mt-3">{grammar.title}</h2>
        <p className="text-base text-vermillion-400 font-medium mt-1">{grammar.meaning_short}</p>
      </div>

      <div className="card p-4">
        <p className="label mb-2">Explanation</p>
        <p className="text-sm text-ink-200 leading-relaxed">{grammar.explanation}</p>
      </div>

      <div className="card p-4">
        <p className="label mb-2">Formation</p>
        {grammar.formation.map((f, i) => (
          <div key={i} className="px-3 py-2 rounded-lg bg-ink-800/60 border border-ink-700/30 font-mono text-sm text-ink-200 mb-2 last:mb-0">
            {f}
          </div>
        ))}
      </div>

      {grammar.examples.length > 0 && (
        <div className="card p-4">
          <p className="label mb-2">Examples</p>
          {grammar.examples.map((ex, i) => (
            <div key={i} className="mb-3 last:mb-0">
              <p className="text-base text-ink-100 font-display">{ex.ja}</p>
              <p className="text-sm text-ink-400">{ex.en}</p>
            </div>
          ))}
        </div>
      )}

      {grammar.common_mistakes && grammar.common_mistakes.length > 0 && (
        <div className="card p-4">
          <p className="label mb-2">Common Mistakes</p>
          {grammar.common_mistakes.map((m, i) => (
            <div key={i} className="mb-3 last:mb-0">
              <div className="flex gap-2 text-sm"><span className="text-vermillion-400 font-bold">✗</span><span className="text-vermillion-400/80 font-display">{m.wrong}</span></div>
              <div className="flex gap-2 text-sm mt-1"><span className="text-jade-400 font-bold">✓</span><span className="text-jade-400/90 font-display">{m.correct}</span></div>
              <p className="text-xs text-ink-500 pl-5 mt-1">{m.why}</p>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

/* ── Shared sub-components ───────────────────────────────────────────────── */

function PhaseHeader({ phase, step, total, onBack }: { phase: string; step: number; total: number; onBack: () => void }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <button className="btn-secondary text-xs py-1.5 px-3" onClick={onBack}>← Back</button>
      <span className="label">{phase}</span>
      <span className="text-xs text-ink-500">
        {step > 0 ? `${step} / ${total}` : `${total} items`}
      </span>
    </div>
  );
}

function TypeBadge({ type }: { type: ItemType }) {
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

/* ── Quiz builder ────────────────────────────────────────────────────────── */

function buildQuiz(batch: LessonItem[]): QuizQuestion[] {
  return batch.map((item, i) => {
    const correct = item.subtitle;
    const distractors = getDistractors(item.type, item.id, 3);

    // Build choices: correct answer at random position
    const choices = [...distractors];
    const correctIndex = Math.floor(Math.random() * (choices.length + 1));
    choices.splice(correctIndex, 0, correct);

    return {
      itemIndex: i,
      prompt: item.title,
      promptLabel: `What does this ${item.type === "grammar" ? "grammar point" : item.type} mean?`,
      choices: choices.slice(0, 4),
      correctIndex,
    };
  });
}
