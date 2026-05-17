import { useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getWeakItems, getAllItems } from "../lib/storage";
import { getContentById } from "../lib/content";
import { TypeBadge } from "../components/QuestionCard";
import type { UserItem, Kanji, Vocab, GrammarPoint } from "../lib/types";

export default function WeakPoints() {
  const navigate = useNavigate();
  const weakItems = useMemo(() => getWeakItems(), []);
  const recentlyMissed = useMemo(() => {
    return getAllItems()
      .filter((i) => i.totalWrong > 0 && !i.isWeak)
      .sort((a, b) => b.totalWrong - a.totalWrong)
      .slice(0, 5);
  }, []);

  if (weakItems.length === 0 && recentlyMissed.length === 0) {
    return (
      <div className="max-w-md mx-auto text-center py-20 animate-fade-in">
        <div className="text-5xl mb-5">🎯</div>
        <h1 className="font-display text-2xl font-bold text-ink-100 mb-2">No Weak Points!</h1>
        <p className="text-sm text-ink-400 mb-8">
          Great work — no items are flagged as weak. Keep studying to maintain your accuracy!
        </p>
        <div className="flex flex-col gap-3 items-center">
          <button className="btn-primary w-60" onClick={() => navigate("/quiz")}>Random Quiz</button>
          <button className="btn-secondary w-60" onClick={() => navigate("/lessons")}>Learn New Items</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
      <header>
        <p className="label mb-1">Weak Points</p>
        <h1 className="font-display text-2xl font-bold text-ink-50">
          {weakItems.length} item{weakItems.length === 1 ? "" : "s"} need extra practice
        </h1>
        <p className="text-sm text-ink-400 mt-1">
          Items flagged as weak: wrong 3+ times, or wrong 2x in a row, or below 60% accuracy.
        </p>
      </header>

      {weakItems.length > 0 && (
        <button
          className="btn-primary w-full py-3 text-base"
          onClick={() => navigate("/quiz")}
        >
          Practice All Weak Points
        </button>
      )}

      {/* Weak items */}
      {weakItems.length > 0 && (
        <section className="space-y-2">
          <h2 className="label">Weak Items</h2>
          {weakItems.map((item) => (
            <WeakItemCard key={`${item.type}:${item.id}`} item={item} />
          ))}
        </section>
      )}

      {/* Recently missed (not yet weak) */}
      {recentlyMissed.length > 0 && (
        <section className="space-y-2">
          <h2 className="label">Recently Missed (not yet weak)</h2>
          {recentlyMissed.map((item) => (
            <WeakItemCard key={`${item.type}:${item.id}`} item={item} />
          ))}
        </section>
      )}

      <button className="btn-secondary w-full" onClick={() => navigate("/")}>
        ← Dashboard
      </button>
    </div>
  );
}

function WeakItemCard({ item }: { item: UserItem }) {
  const content = getContentById(item.type, item.id);
  if (!content) return null;

  let title: string;
  let subtitle: string;
  let detailPath: string;

  if (item.type === "kanji") {
    const k = content as Kanji;
    title = k.character;
    subtitle = k.meanings[0];
    detailPath = `/kanji/${item.id}`;
  } else if (item.type === "vocab") {
    const v = content as Vocab;
    title = v.word;
    subtitle = v.meanings[0];
    detailPath = `/vocab/${item.id}`;
  } else {
    const g = content as GrammarPoint;
    title = g.title;
    subtitle = g.meaning_short;
    detailPath = `/grammar/${item.id}`;
  }

  const accuracy = item.totalReviews > 0
    ? Math.round((item.totalCorrect / item.totalReviews) * 100)
    : 0;

  return (
    <Link
      to={detailPath}
      className="card-hover p-4 flex items-center gap-4"
    >
      <span className="text-2xl font-display w-12 text-center shrink-0">{title}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-ink-200 font-medium truncate">{subtitle}</p>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-xs text-ink-500">
            {accuracy}% accuracy
          </span>
          <span className="text-xs text-vermillion-400">
            {item.totalWrong} wrong
          </span>
          {item.consecutiveWrong >= 2 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-vermillion-500/20 text-vermillion-400 font-semibold">
              {item.consecutiveWrong}x in a row
            </span>
          )}
        </div>
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        <TypeBadge type={item.type} />
        <span className="text-[10px] text-ink-600 capitalize">
          {item.srsStage.replace(/([0-9])/g, " $1")}
        </span>
      </div>
    </Link>
  );
}
