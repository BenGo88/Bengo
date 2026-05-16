import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getGrammarById } from "../lib/content";
import { getUserItem, startLearning } from "../lib/storage";

export default function GrammarDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const grammar = id ? getGrammarById(id) : undefined;
  const [userItem, setUserItem] = useState(() =>
    id ? getUserItem("grammar", id) : null
  );
  const [justStarted, setJustStarted] = useState(false);

  if (!grammar) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20 animate-fade-in">
        <p className="text-ink-400">Grammar point not found.</p>
        <button className="btn-secondary mt-4" onClick={() => navigate("/grammar")}>
          ← Back to Grammar
        </button>
      </div>
    );
  }

  function handleStartLearning() {
    if (!id) return;
    const item = startLearning("grammar", id);
    setUserItem(item);
    setJustStarted(true);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
      <button className="btn-secondary text-xs" onClick={() => navigate("/grammar")}>
        ← All Grammar
      </button>

      {/* Header */}
      <div className="card p-8">
        <span className="text-[10px] px-2 py-0.5 rounded bg-ink-800 text-ink-400 font-semibold">
          {grammar.jlpt}
        </span>
        <h1 className="text-3xl md:text-4xl font-display font-bold text-ink-50 mt-3">
          {grammar.title}
        </h1>
        <p className="text-lg text-vermillion-400 mt-2 font-medium">
          {grammar.meaning_short}
        </p>
      </div>

      {/* Explanation */}
      <Section title="Explanation">
        <p className="text-sm text-ink-200 leading-relaxed">{grammar.explanation}</p>
      </Section>

      {/* Formation */}
      <Section title="Formation">
        <div className="space-y-2">
          {grammar.formation.map((f, i) => (
            <div key={i} className="px-4 py-3 rounded-lg bg-ink-800/60 border border-ink-700/30 font-mono text-sm text-ink-200">
              {f}
            </div>
          ))}
        </div>
      </Section>

      {/* Examples */}
      {grammar.examples.length > 0 && (
        <Section title="Example Sentences">
          <div className="space-y-5">
            {grammar.examples.map((ex, i) => (
              <div key={i} className="space-y-1">
                <p className="text-base text-ink-100 font-display leading-relaxed">{ex.ja}</p>
                <p className="text-sm text-ink-400">{ex.en}</p>
                {ex.note && <p className="text-xs text-ink-500 italic">💡 {ex.note}</p>}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Common Mistakes */}
      {grammar.common_mistakes && grammar.common_mistakes.length > 0 && (
        <Section title="Common Mistakes">
          <div className="space-y-4">
            {grammar.common_mistakes.map((m, i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-start gap-2">
                  <span className="text-vermillion-400 text-sm font-bold shrink-0">✗</span>
                  <p className="text-sm text-vermillion-400/80 font-display">{m.wrong}</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-jade-400 text-sm font-bold shrink-0">✓</span>
                  <p className="text-sm text-jade-400/90 font-display">{m.correct}</p>
                </div>
                <p className="text-xs text-ink-400 pl-5">{m.why}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Similar Grammar */}
      {grammar.similar && grammar.similar.length > 0 && (
        <Section title="Similar Grammar — Know the Difference">
          <div className="space-y-4">
            {grammar.similar.map((s, i) => (
              <div key={i} className="p-4 rounded-xl bg-ink-800/40 border border-ink-700/30 space-y-2">
                <h3 className="font-display font-bold text-ink-100">{s.title}</h3>
                <p className="text-sm text-ink-300 leading-relaxed">{s.diff}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Start Learning */}
      <div className="card p-5 text-center space-y-3">
        {userItem ? (
          <>
            <div className="flex items-center justify-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-jade-500" />
              <span className="text-sm text-jade-400 font-semibold">
                {justStarted ? "Added to your study queue!" : `Learning — ${formatStage(userItem.srsStage)}`}
              </span>
            </div>
            <p className="text-xs text-ink-500">
              This grammar point is in your SRS review queue.
            </p>
          </>
        ) : (
          <>
            <button className="btn-primary w-full text-base py-4" onClick={handleStartLearning}>
              Add to Study Queue 「{grammar.title}」
            </button>
            <p className="text-xs text-ink-500">
              Adds this grammar point to your SRS queue. Or try a guided lesson from the Lessons page.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card p-5 space-y-3">
      <h2 className="label">{title}</h2>
      {children}
    </section>
  );
}

function formatStage(stage: string): string {
  return stage.replace(/([0-9])/g, " $1").replace(/^\w/, (c) => c.toUpperCase());
}
