import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getVocabById } from "../lib/content";
import { getUserItem, startLearning } from "../lib/storage";

export default function VocabDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const vocab = id ? getVocabById(id) : undefined;
  const [userItem, setUserItem] = useState(() =>
    id ? getUserItem("vocab", id) : null
  );
  const [justStarted, setJustStarted] = useState(false);

  if (!vocab) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20 animate-fade-in">
        <p className="text-ink-400">Vocabulary item not found.</p>
        <button className="btn-secondary mt-4" onClick={() => navigate("/vocab")}>
          ← Back to Vocabulary
        </button>
      </div>
    );
  }

  function handleStartLearning() {
    if (!id) return;
    const item = startLearning("vocab", id);
    setUserItem(item);
    setJustStarted(true);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
      <button className="btn-secondary text-xs" onClick={() => navigate("/vocab")}>
        ← All Vocabulary
      </button>

      {/* Word header */}
      <div className="card p-8 text-center">
        <span className="text-5xl font-display font-bold text-ink-50">{vocab.word}</span>
        <p className="text-xl text-ink-400 font-mono mt-2">{vocab.reading}</p>
        <div className="mt-4 flex flex-wrap gap-2 justify-center">
          {vocab.meanings.map((m) => (
            <span key={m} className="px-3 py-1 rounded-full bg-ink-800 text-ink-200 text-sm font-medium">
              {m}
            </span>
          ))}
        </div>
        <div className="flex gap-2 justify-center mt-3">
          <span className="text-[10px] px-2 py-0.5 rounded bg-ink-800 text-ink-400 font-semibold">{vocab.jlpt}</span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-ink-800 text-ink-400 font-semibold">{vocab.part_of_speech}</span>
          {vocab.formality && (
            <span className="text-[10px] px-2 py-0.5 rounded bg-ink-800 text-ink-400 font-semibold">{vocab.formality}</span>
          )}
        </div>
      </div>

      {/* Example Sentences */}
      {vocab.sentences.length > 0 && (
        <Section title="Example Sentences">
          <div className="space-y-4">
            {vocab.sentences.map((s, i) => (
              <div key={i} className="space-y-1">
                <p className="text-base text-ink-100 font-display leading-relaxed">{s.ja}</p>
                <p className="text-sm text-ink-400">{s.en}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Nuance */}
      {vocab.nuance && (
        <Section title="Nuance & Usage">
          <p className="text-sm text-ink-300 leading-relaxed">{vocab.nuance}</p>
        </Section>
      )}

      {/* Collocations */}
      {vocab.collocations && vocab.collocations.length > 0 && (
        <Section title="Common Collocations">
          <div className="flex flex-wrap gap-2">
            {vocab.collocations.map((c, i) => (
              <span key={i} className="px-3 py-1.5 rounded-lg bg-ink-800 text-ink-200 text-sm font-display">
                {c}
              </span>
            ))}
          </div>
        </Section>
      )}

      {/* Similar Words */}
      {vocab.similar && vocab.similar.length > 0 && (
        <Section title="Similar Words — Know the Difference">
          <div className="space-y-3">
            {vocab.similar.map((s, i) => (
              <div key={i} className="p-3 rounded-lg bg-ink-800/50 border border-ink-700/30">
                <span className="text-sm font-semibold text-vermillion-400 font-display">{s.word}</span>
                <p className="text-sm text-ink-400 mt-1">{s.note}</p>
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
              This item is in your SRS review queue.
            </p>
          </>
        ) : (
          <>
            <button className="btn-primary w-full text-base py-4" onClick={handleStartLearning}>
              Start Learning 「{vocab.word}」
            </button>
            <p className="text-xs text-ink-500">
              Adds this word to your study progress and SRS queue.
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
