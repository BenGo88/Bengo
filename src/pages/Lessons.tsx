import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { allKanji, allVocab, allGrammar } from "../lib/content";
import { getUserItem, getProfile } from "../lib/storage";
import type { Kanji, Vocab, GrammarPoint, JLPTLevel } from "../lib/types";

export default function Lessons() {
  const navigate = useNavigate();
  const profile = getProfile();
  const level = profile.targetLevel as JLPTLevel;

  const unlearned = useMemo(() => {
    const kanji = allKanji.filter((k) => k.jlpt === level && !getUserItem("kanji", k.id));
    const vocab = allVocab.filter((v) => v.jlpt === level && !getUserItem("vocab", v.id));
    const grammar = allGrammar.filter((g) => g.jlpt === level && !getUserItem("grammar", g.id));
    return { kanji, vocab, grammar };
  }, [level]);

  const totalUnlearned = unlearned.kanji.length + unlearned.vocab.length + unlearned.grammar.length;

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
      <header>
        <p className="label mb-1">Lessons</p>
        <h1 className="font-display text-2xl md:text-3xl font-bold text-ink-50 tracking-tight">
          Choose What to Learn
        </h1>
        <p className="text-sm text-ink-400 mt-1">
          {totalUnlearned > 0
            ? `${totalUnlearned} unlearned ${level} items available`
            : `All ${level} items learned! Change your target level in Settings to unlock more.`}
        </p>
      </header>

      {/* Kanji section */}
      <CategorySection
        title="Kanji"
        count={unlearned.kanji.length}
        browseLink="/kanji"
        isEmpty={unlearned.kanji.length === 0}
      >
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {unlearned.kanji.slice(0, 10).map((k: Kanji) => (
            <Link
              key={k.id}
              to={`/kanji/${k.id}`}
              className="card-hover p-3 text-center"
            >
              <span className="text-2xl font-display">{k.character}</span>
              <p className="text-xs text-ink-400 mt-1 truncate">{k.meanings[0]}</p>
            </Link>
          ))}
        </div>
      </CategorySection>

      {/* Vocab section */}
      <CategorySection
        title="Vocabulary"
        count={unlearned.vocab.length}
        browseLink="/vocab"
        isEmpty={unlearned.vocab.length === 0}
      >
        <div className="space-y-2">
          {unlearned.vocab.slice(0, 5).map((v: Vocab) => (
            <Link
              key={v.id}
              to={`/vocab/${v.id}`}
              className="card-hover p-3 flex items-baseline gap-3"
            >
              <span className="text-base font-display font-bold text-ink-100">{v.word}</span>
              <span className="text-sm text-ink-500 font-mono">{v.reading}</span>
              <span className="text-sm text-ink-400 truncate">{v.meanings[0]}</span>
            </Link>
          ))}
        </div>
      </CategorySection>

      {/* Grammar section */}
      <CategorySection
        title="Grammar"
        count={unlearned.grammar.length}
        browseLink="/grammar"
        isEmpty={unlearned.grammar.length === 0}
      >
        <div className="space-y-2">
          {unlearned.grammar.slice(0, 5).map((g: GrammarPoint) => (
            <Link
              key={g.id}
              to={`/grammar/${g.id}`}
              className="card-hover p-4 block"
            >
              <h3 className="text-base font-display font-bold text-ink-100">{g.title}</h3>
              <p className="text-sm text-ink-400 mt-0.5">{g.meaning_short}</p>
            </Link>
          ))}
        </div>
      </CategorySection>

      <div className="text-center pt-4">
        <button className="btn-secondary" onClick={() => navigate("/")}>
          ← Back to Dashboard
        </button>
      </div>
    </div>
  );
}

function CategorySection({
  title,
  count,
  browseLink,
  isEmpty,
  children,
}: {
  title: string;
  count: number;
  browseLink: string;
  isEmpty: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="label">
          {title}{" "}
          <span className="text-ink-600">
            ({count} unlearned)
          </span>
        </h2>
        <Link to={browseLink} className="text-xs text-vermillion-400 hover:text-vermillion-300 font-medium">
          Browse All →
        </Link>
      </div>
      {isEmpty ? (
        <div className="card p-4 text-center">
          <p className="text-sm text-ink-500">All {title.toLowerCase()} learned at this level.</p>
        </div>
      ) : (
        children
      )}
    </section>
  );
}
