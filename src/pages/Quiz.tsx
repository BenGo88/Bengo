import { useState, useMemo, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  getProfile,
  startLearning,
  getUserItem,
  recordStudySession,
} from "../lib/storage";
import { buildQuizQueue, buildUnitQuizQueue, buildMixedQuizQueue, buildJLPTStyleTest, type Question } from "../lib/questions";
import { getContentCounts } from "../lib/content";
import { saveTestResult } from "../lib/reading";
import QuestionCard, { TypeBadge } from "../components/QuestionCard";
import SessionSummary, { type ResultItem } from "../components/SessionSummary";
import type { ItemType, JLPTLevel } from "../lib/types";

type Phase = "setup" | "session" | "summary";
type Category = ItemType | "mixed";
type Source = "all" | "learned" | "unlearned" | "weak" | "unit";

const LEVELS: JLPTLevel[] = ["N5", "N4", "N3", "N2", "N1"];
const SIZES = [
  { label: "Quick", value: 10 },
  { label: "Normal", value: 25 },
  { label: "Long", value: 50 },
];
const CATEGORIES: { label: string; value: Category }[] = [
  { label: "Mixed", value: "mixed" },
  { label: "Kanji", value: "kanji" },
  { label: "Vocabulary", value: "vocab" },
  { label: "Grammar", value: "grammar" },
];
const SOURCES: { label: string; value: Source; desc: string }[] = [
  { label: "All", value: "all", desc: "All available content" },
  { label: "Unit", value: "unit", desc: "From a specific curriculum unit" },
  { label: "Learned", value: "learned", desc: "Items you've studied" },
  { label: "Unlearned", value: "unlearned", desc: "New challenge" },
  { label: "Weak", value: "weak", desc: "Items you struggle with" },
];

export default function Quiz() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const profile = getProfile();

  // Read URL params
  const urlLevel = searchParams.get("level") as JLPTLevel | null;
  const urlUnit = searchParams.get("unit");

  // Setup state
  const [level, setLevel] = useState<JLPTLevel>(urlLevel || profile.targetLevel);
  const [category, setCategory] = useState<Category>("mixed");
  const [size, setSize] = useState(10);
  const [source, setSource] = useState<Source>(urlUnit ? "unit" : "all");
  const [unitName, setUnitName] = useState(urlUnit || "");
  const [testMode, setTestMode] = useState(false);
  const [questionStyle, setQuestionStyle] = useState<"standard" | "reading" | "mixed">("mixed");
  const [testType, setTestType] = useState<"quick" | "practice" | "jlpt">("quick");
  const [testLength, setTestLength] = useState<"short" | "medium" | "long">("short");
  const [timed, setTimed] = useState(false);
  const [timerStart, setTimerStart] = useState(0);
  const [remainingTime, setRemainingTime] = useState(0);
  const [timedOut, setTimedOut] = useState(false);

  // Session state
  const [phase, setPhase] = useState<Phase>("setup");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [qIndex, setQIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [results, setResults] = useState<ResultItem[]>([]);
  const [addedMissed, setAddedMissed] = useState(false);

  // Interval-based countdown timer
  const timeLimits = { short: 15 * 60, medium: 30 * 60, long: 60 * 60 };
  useEffect(() => {
    if (!timed || phase !== "session" || !timerStart) return;
    const limit = timeLimits[testLength];
    const tick = () => {
      const elapsed = Math.floor((Date.now() - timerStart) / 1000);
      const rem = Math.max(0, limit - elapsed);
      setRemainingTime(rem);
      if (rem <= 0 && !timedOut) {
        setTimedOut(true);
        recordStudySession();
        setPhase("summary");
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [timed, phase, timerStart, testLength, timedOut]);

  const counts = getContentCounts(level);
  const totalAvailable = counts.kanji + counts.vocab + counts.grammar;

  function startQuiz() {
    let q: Question[];
    if (testType === "jlpt") {
      q = buildJLPTStyleTest(level, testLength);
    } else if (source === "unit" && unitName) {
      q = buildUnitQuizQueue(level, unitName, size);
    } else if (questionStyle === "reading") {
      q = buildMixedQuizQueue(category, level, source === "unit" ? "all" : source, size, 80);
    } else if (questionStyle === "mixed") {
      q = buildMixedQuizQueue(category, level, source === "unit" ? "all" : source, size, 40);
    } else {
      q = buildQuizQueue(category, level, source === "unit" ? "all" : source, size);
    }
    if (q.length === 0) return;
    setQuestions(q);
    setQIndex(0);
    setSelectedAnswer(null);
    setResults([]);
    setAddedMissed(false);
    if (timed) setTimerStart(Date.now());
    setTimedOut(false);
    setPhase("session");
  }

  function handleAddMissedToQueue() {
    const missed = results.filter((r) => !r.correct);
    for (const r of missed) {
      if (!getUserItem(r.question.itemType, r.question.itemId)) {
        startLearning(r.question.itemType, r.question.itemId);
      }
    }
    setAddedMissed(true);
  }

  // ── Setup screen ──
  if (phase === "setup") {
    return (
      <div className="max-w-lg mx-auto space-y-6 animate-fade-in">
        <header>
          <p className="label mb-1">Quiz</p>
          <h1 className="font-display text-2xl font-bold text-ink-50">Random Quiz</h1>
          <p className="text-sm text-ink-400 mt-1">
            Free practice — quizzes do not change your SRS stages.
          </p>
        </header>

        {/* Level */}
        <OptionGroup label="JLPT Level">
          <div className="flex gap-1.5">
            {LEVELS.map((l) => (
              <Chip key={l} active={level === l} onClick={() => setLevel(l)}>{l}</Chip>
            ))}
          </div>
        </OptionGroup>

        {/* Category */}
        <OptionGroup label="Category">
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((c) => (
              <Chip key={c.value} active={category === c.value} onClick={() => setCategory(c.value)}>
                {c.label}
              </Chip>
            ))}
          </div>
        </OptionGroup>

        {/* Test Type */}
        <OptionGroup label="Test Type">
          <div className="flex flex-wrap gap-1.5">
            {(["quick", "practice", "jlpt"] as const).map((t) => (
              <Chip key={t} active={testType === t} onClick={() => setTestType(t)}>
                {t === "quick" ? "Quick Quiz" : t === "practice" ? "Practice Test" : "JLPT-style Test"}
              </Chip>
            ))}
          </div>
          {testType === "jlpt" && (
            <div className="mt-2 space-y-2">
              <p className="text-[10px] text-ink-500">Sectioned test: Vocab/Kanji → Grammar → Reading</p>
              <div className="flex gap-1.5">
                {(["short", "medium", "long"] as const).map((l) => (
                  <Chip key={l} active={testLength === l} onClick={() => setTestLength(l)}>
                    {l === "short" ? "Short (~15)" : l === "medium" ? "Medium (~30)" : "Long (~50)"}
                  </Chip>
                ))}
              </div>
              <div className="flex gap-1.5">
                <Chip active={!timed} onClick={() => setTimed(false)}>Untimed</Chip>
                <Chip active={timed} onClick={() => setTimed(true)}>Timed</Chip>
              </div>
            </div>
          )}
        </OptionGroup>

        {/* Size (for non-JLPT modes) */}
        {testType !== "jlpt" && (
        <OptionGroup label="Quiz Size">
          <div className="flex gap-1.5">
            {SIZES.map((s) => (
              <Chip key={s.value} active={size === s.value} onClick={() => setSize(s.value)}>
                {s.label} ({s.value})
              </Chip>
            ))}
          </div>
        </OptionGroup>
        )}

        {/* Source */}
        <OptionGroup label="Source">
          <div className="flex flex-wrap gap-1.5">
            {SOURCES.map((s) => (
              <Chip key={s.value} active={source === s.value} onClick={() => setSource(s.value)}>
                {s.label}
              </Chip>
            ))}
          </div>
          {source === "unit" && unitName && (
            <p className="text-xs text-vermillion-400 mt-1 font-medium">Unit: {unitName}</p>
          )}
          {source === "unit" && !unitName && (
            <p className="text-xs text-ink-500 mt-1">Select a unit from the Curriculum page to use unit filtering.</p>
          )}
        </OptionGroup>

        {/* Question Style */}
        <OptionGroup label="Question Style">
          <div className="flex flex-wrap gap-1.5">
            {(["standard", "reading", "mixed"] as const).map((s) => (
              <Chip key={s} active={questionStyle === s} onClick={() => setQuestionStyle(s)}>
                {s === "standard" ? "Standard" : s === "reading" ? "Reading-style" : "Mixed"}
              </Chip>
            ))}
          </div>
          <p className="text-[10px] text-ink-600 mt-1">
            {questionStyle === "standard" ? "Meaning and reading questions." :
             questionStyle === "reading" ? "Cloze and context questions where available." :
             "Mix of standard and reading-style questions."}
          </p>
        </OptionGroup>

        {/* Content count notice */}
        {totalAvailable === 0 ? (
          <div className="card p-4 border-vermillion-500/20 text-center">
            <p className="text-sm text-vermillion-400">No {level} content available yet.</p>
          </div>
        ) : totalAvailable < size ? (
          <div className="card p-4 text-center">
            <p className="text-sm text-ink-400">
              Only {totalAvailable} {level} items available — quiz will use all of them.
            </p>
          </div>
        ) : null}

        {/* Test mode toggle */}
        <OptionGroup label="Mode">
          <div className="flex gap-1.5">
            <Chip active={!testMode} onClick={() => setTestMode(false)}>Study (feedback each Q)</Chip>
            <Chip active={testMode} onClick={() => setTestMode(true)}>Practice Test (end only)</Chip>
          </div>
          {testMode && <p className="text-xs text-ink-500 mt-1">JLPT-style: no feedback until the end.</p>}
        </OptionGroup>

        <button
          className="btn-primary w-full text-base py-4"
          onClick={startQuiz}
          disabled={totalAvailable === 0}
        >
          {testMode ? "Start Practice Test" : "Start Quiz"}
        </button>

        <button className="btn-secondary w-full" onClick={() => navigate("/")}>
          ← Dashboard
        </button>
      </div>
    );
  }

  // ── Session ──
  if (phase === "session" && qIndex < questions.length) {
    const q = questions[qIndex];
    const answered = selectedAnswer !== null;
    const showFeedback = answered && !testMode;

    // Timer display from state
    const timerMin = Math.floor(remainingTime / 60);
    const timerSecStr = String(remainingTime % 60).padStart(2, "0");
    const timerWarn = timed && remainingTime <= 300;
    const timerCrit = timed && remainingTime <= 60;

    return (
      <div className="max-w-2xl mx-auto animate-fade-in" key={qIndex}>
        <div className="flex items-center justify-between mb-4">
          <span className="label">{testType === "jlpt" ? "JLPT-style Test" : testMode ? "Practice Test" : "Quiz"}</span>
          <span className="text-xs text-ink-500">{qIndex + 1} / {questions.length}</span>
          {timed && (
            <span className={`text-sm font-mono font-bold ${timerCrit ? "text-vermillion-400 animate-pulse" : timerWarn ? "text-yellow-500" : "text-ink-400"}`}>
              {timerMin}:{timerSecStr}
            </span>
          )}
          <TypeBadge type={q.itemType} />
        </div>

        {/* Section label for JLPT-style */}
        {q.section && (
          <div className="mb-2"><span className="text-[10px] px-2 py-0.5 rounded bg-ink-800 text-ink-500">{q.section}</span></div>
        )}

        <div className="h-1.5 rounded-full bg-ink-800 mb-8 overflow-hidden">
          <div className="h-full rounded-full bg-jade-500 transition-all duration-300" style={{ width: `${((qIndex + 1) / questions.length) * 100}%` }} />
        </div>

        {/* In test mode, show question without feedback on select */}
        <QuestionCard
          question={q}
          selectedAnswer={testMode ? null : selectedAnswer}
          onSelect={(idx) => {
            setSelectedAnswer(idx);
            if (testMode) {
              // In test mode, immediately move to next
              const correct = idx === q.correctIndex;
              const newResults = [...results, { question: q, correct, selectedIndex: idx }];
              setResults(newResults);
              setTimeout(() => {
                if (qIndex < questions.length - 1) {
                  setQIndex(qIndex + 1);
                  setSelectedAnswer(null);
                } else {
                  recordStudySession();
                  setPhase("summary");
                }
              }, 200);
            }
          }}
        />

        {/* Study mode: show feedback + next button */}
        {showFeedback && (
          <button
            className="btn-primary w-full mt-6 py-3"
            onClick={() => {
              const correct = selectedAnswer === q.correctIndex;
              const newResults = [...results, { question: q, correct, selectedIndex: selectedAnswer! }];
              setResults(newResults);

              if (qIndex < questions.length - 1) {
                setQIndex(qIndex + 1);
                setSelectedAnswer(null);
              } else {
                recordStudySession();
                setPhase("summary");
              }
            }}
          >
            {qIndex < questions.length - 1 ? "Next →" : "See Results →"}
          </button>
        )}
      </div>
    );
  }

  // ── Summary ──
  if (phase === "summary") {
    const missed = results.filter((r) => !r.correct);
    const totalCorrect = results.filter((r) => r.correct).length;
    const accuracy = results.length > 0 ? Math.round((totalCorrect / results.length) * 100) : 0;
    const durationSec = timerStart ? Math.floor((Date.now() - timerStart) / 1000) : 0;

    // Section breakdown
    const sections: { name: string; correct: number; total: number }[] = [];
    const sectionNames = [...new Set(results.map((r) => r.question.section).filter(Boolean))];
    for (const name of sectionNames) {
      const sectionResults = results.filter((r) => r.question.section === name);
      sections.push({ name: name!, correct: sectionResults.filter((r) => r.correct).length, total: sectionResults.length });
    }

    // Save test result for JLPT-style tests
    if (testType === "jlpt" && results.length > 0 && !addedMissed) {
      const testResult = {
        id: `test-${Date.now()}`, date: new Date().toISOString(), level, mode: testType,
        timed, durationSeconds: durationSec, totalQuestions: results.length,
        correct: totalCorrect, accuracy,
        sections: sections.map((s) => ({ name: s.name, total: s.total, correct: s.correct })),
      };
      saveTestResult(testResult);
    }

    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
        <SessionSummary title={testType === "jlpt" ? "JLPT-style Test Complete!" : "Quiz Complete!"} results={results} xpEarned={0}>
          {/* Section breakdown */}
          {sections.length > 0 && (
            <div className="card p-4 space-y-2 w-full">
              <p className="label">Section Breakdown</p>
              {sections.map((s) => {
                const pct = s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0;
                return (
                  <div key={s.name} className="flex items-center justify-between text-sm">
                    <span className="text-ink-300">{s.name}</span>
                    <span className={`font-bold ${pct >= 80 ? "text-jade-400" : pct >= 50 ? "text-yellow-500" : "text-vermillion-400"}`}>
                      {s.correct}/{s.total} ({pct}%)
                    </span>
                  </div>
                );
              })}
              {timed && durationSec > 0 && (
                <p className="text-xs text-ink-500 pt-1 border-t border-ink-800">Time: {Math.floor(durationSec / 60)}m {durationSec % 60}s</p>
              )}
            </div>
          )}

          {missed.length > 0 && !addedMissed && (
            <button className="btn-primary" onClick={handleAddMissedToQueue}>Add {missed.length} Missed to Study Queue</button>
          )}
          {addedMissed && <span className="text-sm text-jade-400 font-semibold">✓ Added to queue</span>}
          {missed.length > 0 && (
            <button className="btn-secondary" onClick={() => {
              const missedQs = missed.map((r) => r.question);
              setQuestions(missedQs); setQIndex(0); setSelectedAnswer(null); setResults([]); setAddedMissed(false); setPhase("session");
            }}>Retake Missed ({missed.length})</button>
          )}
          <button className="btn-secondary" onClick={() => setPhase("setup")}>New Quiz</button>
          <button className="btn-secondary" onClick={() => navigate("/")}>Dashboard</button>
        </SessionSummary>
      </div>
    );
  }

  return null;
}

/* ── Sub-components ──────────────────────────────────────────────────────── */

function OptionGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="label">{label}</p>
      {children}
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
        active
          ? "bg-vermillion-500 text-white shadow-lg shadow-vermillion-500/20"
          : "bg-ink-800 text-ink-400 hover:text-ink-200 hover:bg-ink-700"
      }`}
    >
      {children}
    </button>
  );
}
