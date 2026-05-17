import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getKanjiById } from "../lib/content";
import { getUserItem, startLearning } from "../lib/storage";
import BeginnerNote from "../components/BeginnerNote";

export default function KanjiDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const kanji = id ? getKanjiById(id) : undefined;
  const [userItem, setUserItem] = useState(() =>
    id ? getUserItem("kanji", id) : null
  );
  const [justStarted, setJustStarted] = useState(false);

  if (!kanji) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20 animate-fade-in">
        <p className="text-ink-400">Kanji not found.</p>
        <button className="btn-secondary mt-4" onClick={() => navigate("/kanji")}>
          ← Back to Kanji
        </button>
      </div>
    );
  }

  function handleStartLearning() {
    if (!id) return;
    const item = startLearning("kanji", id);
    setUserItem(item);
    setJustStarted(true);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
      {/* Back link */}
      <button
        className="btn-secondary text-xs"
        onClick={() => navigate("/kanji")}
      >
        ← All Kanji
      </button>

      {/* Main character */}
      <div className="card p-8 text-center">
        <span className="text-8xl font-display text-ink-50">{kanji.character}</span>
        <div className="mt-4 flex flex-wrap gap-2 justify-center">
          {kanji.meanings.map((m) => (
            <span key={m} className="px-3 py-1 rounded-full bg-ink-800 text-ink-200 text-sm font-medium">
              {m}
            </span>
          ))}
        </div>
        <span className="inline-block mt-3 text-[10px] px-2 py-0.5 rounded bg-ink-800 text-ink-400 font-semibold">
          {kanji.jlpt}
        </span>
      </div>

      {/* Readings */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card p-4">
          <p className="label mb-2">On'yomi</p>
          <p className="text-lg font-display text-ink-100">
            {kanji.onyomi.length > 0 ? kanji.onyomi.join("、") : "—"}
          </p>
        </div>
        <div className="card p-4">
          <p className="label mb-2">Kun'yomi</p>
          <p className="text-lg font-display text-ink-100">
            {kanji.kunyomi.length > 0 ? kanji.kunyomi.join("、") : "—"}
          </p>
        </div>
      </div>

      {/* Beginner support */}
      <BeginnerNote
        hint={kanji.beginner_hint}
        simpleExplanation={kanji.component_explanation}
      />

      {/* Mnemonic */}
      {kanji.mnemonic && (
        <Section title="Mnemonic">
          <p className="text-sm text-ink-300 leading-relaxed">{kanji.mnemonic}</p>
        </Section>
      )}

      {/* Components */}
      {kanji.components && (
        <Section title="Components / Radicals">
          <p className="text-sm text-ink-300">{kanji.components}</p>
        </Section>
      )}

      {/* Common Words */}
      {kanji.common_words.length > 0 && (
        <Section title="Common Words">
          <div className="space-y-2">
            {kanji.common_words.map((w, i) => (
              <div key={i} className="flex items-baseline gap-3 text-sm">
                <span className="text-ink-100 font-semibold font-display text-base">{w.word}</span>
                <span className="text-ink-400 font-mono text-xs">{w.reading}</span>
                <span className="text-ink-300">{w.meaning}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Usage Note */}
      {kanji.usage_note && (
        <Section title="Where You'll See This">
          <p className="text-sm text-ink-300 leading-relaxed">{kanji.usage_note}</p>
        </Section>
      )}

      {/* Similar Kanji */}
      {kanji.similar && kanji.similar.length > 0 && (
        <Section title="Similar Kanji — Don't Confuse">
          <div className="flex flex-wrap gap-2">
            {kanji.similar.map((s, i) => (
              <span key={i} className="px-3 py-1.5 rounded-lg bg-vermillion-500/10 border border-vermillion-500/20 text-vermillion-400 text-sm font-medium">
                {s}
              </span>
            ))}
          </div>
        </Section>
      )}

      {/* Start Learning Button */}
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
              This item is in your SRS review queue. Reviews coming in v0.4.
            </p>
          </>
        ) : (
          <>
            <button className="btn-primary w-full text-base py-4" onClick={handleStartLearning}>
              Add to Study Queue 「{kanji.character}」
            </button>
            <p className="text-xs text-ink-500">
              Adds this kanji to your SRS queue. Or try a guided lesson from the Lessons page.
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
  return stage
    .replace(/([0-9])/g, " $1")
    .replace(/^\w/, (c) => c.toUpperCase());
}
