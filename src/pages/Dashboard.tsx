import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getProfile, getDueItems, getWeakItems, getLearnedCount, getStats, getAllItems } from "../lib/storage";
import { getContentCounts, getNextIncompleteUnit } from "../lib/content";
import type { UserProfile, JLPTLevel } from "../lib/types";

export default function Dashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  useEffect(() => { setProfile(getProfile()); }, []);

  const forecast = useMemo(() => {
    const items = getAllItems().filter((i) => i.srsStage !== "lesson" && i.srsStage !== "burned");
    const now = new Date();
    const todayEnd = new Date(now); todayEnd.setHours(23, 59, 59);
    const tmrEnd = new Date(todayEnd); tmrEnd.setDate(tmrEnd.getDate() + 1);
    const weekEnd = new Date(now); weekEnd.setDate(weekEnd.getDate() + 7);
    let laterToday = 0, tomorrow = 0, thisWeek = 0;
    for (const i of items) {
      const d = new Date(i.nextReview);
      if (d <= now) continue;
      if (d <= todayEnd) laterToday++;
      else if (d <= tmrEnd) tomorrow++;
      else if (d <= weekEnd) thisWeek++;
    }
    return { laterToday, tomorrow, thisWeek };
  }, [profile]);

  const nextUnit = useMemo(() => {
    if (!profile) return null;
    return getNextIncompleteUnit(profile.targetLevel as JLPTLevel);
  }, [profile]);

  if (!profile) return null;

  const stats = getStats();
  const dueItems = getDueItems();
  const weakItems = getWeakItems();
  const counts = getContentCounts(profile.targetLevel as JLPTLevel);
  const learned = { kanji: getLearnedCount("kanji"), vocab: getLearnedCount("vocab"), grammar: getLearnedCount("grammar") };
  const unlearnedTotal = counts.kanji + counts.vocab + counts.grammar - learned.kanji - learned.vocab - learned.grammar;

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
      <header>
        <p className="label mb-1">Dashboard</p>
        <h1 className="font-display text-2xl md:text-3xl font-bold text-ink-50 tracking-tight">{getMessage(profile)}</h1>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SC label="Streak" value={`${profile.currentStreak}日`} accent="vermillion" />
        <SC label="XP" value={profile.totalXp.toLocaleString()} accent="jade" />
        <SC label="Accuracy" value={stats.totalReviews > 0 ? `${stats.accuracy}%` : "—"} />
        <SC label="Due Now" value={String(dueItems.length)} accent={dueItems.length > 0 ? "vermillion" : undefined} />
      </div>

      {/* Continue Curriculum */}
      {nextUnit ? (
        <div className="card-hover p-5 border-vermillion-500/20" onClick={() => navigate(`/lessons/session?type=mixed&unit=${encodeURIComponent(nextUnit.name)}`)}>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-lg">📖</span>
            <div>
              <h3 className="font-semibold text-ink-100">Continue Curriculum</h3>
              <p className="text-xs text-ink-500">{profile.targetLevel} — {nextUnit.name}</p>
            </div>
          </div>
          <p className="text-sm text-ink-400">{nextUnit.grammar.map(g => g.title).join(", ")}</p>
          <button className="btn-primary mt-3 w-full">Start Next Lesson</button>
        </div>
      ) : !profile.placementLevel ? (
        <div className="card-hover p-5 border-jade-500/20" onClick={() => navigate("/placement")}>
          <div className="flex items-center gap-3 mb-2"><span className="text-lg">🎯</span><h3 className="font-semibold text-ink-100">Find Your Level</h3></div>
          <p className="text-sm text-ink-400">Take a placement quiz to find your starting point.</p>
        </div>
      ) : (
        <div className="card p-4 flex items-center justify-between">
          <div><p className="text-xs text-ink-500">Recommended level</p><p className="text-lg font-display font-bold text-vermillion-400">{profile.placementLevel}</p></div>
          <button className="btn-secondary text-xs" onClick={() => navigate("/placement")}>Retake</button>
        </div>
      )}

      {/* Study actions */}
      <section className="space-y-3">
        <h2 className="label">Today&apos;s Study</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <AC title="Reviews Due" count={dueItems.length} sub={dueItems.length === 0 ? "All caught up" : `${dueItems.length} waiting`} action={dueItems.length > 0 ? "Start Reviews" : "Practice Quiz"} onClick={() => navigate(dueItems.length > 0 ? "/reviews" : "/quiz")} />
          <AC title="New Lessons" count={unlearnedTotal} sub={`${counts.kanji + counts.vocab + counts.grammar} total ${profile.targetLevel} items`} action="Start Lesson" onClick={() => navigate("/lessons/session?type=mixed")} />
        </div>
      </section>

      {(forecast.laterToday > 0 || forecast.tomorrow > 0 || forecast.thisWeek > 0) && (
        <div className="card p-4">
          <h2 className="label mb-2">Review Forecast</h2>
          <div className="flex gap-6 text-sm">
            <div><span className="text-ink-500">Later today:</span> <span className="text-ink-200 font-semibold">{forecast.laterToday}</span></div>
            <div><span className="text-ink-500">Tomorrow:</span> <span className="text-ink-200 font-semibold">{forecast.tomorrow}</span></div>
            <div><span className="text-ink-500">This week:</span> <span className="text-ink-200 font-semibold">{forecast.thisWeek}</span></div>
          </div>
        </div>
      )}

      <section className="grid gap-3 md:grid-cols-2">
        <div className="card-hover p-5" onClick={() => navigate(`/curriculum/${profile.targetLevel.toLowerCase()}`)}>
          <div className="flex items-center gap-3 mb-2"><span className="text-lg">🗺</span><h3 className="font-semibold text-ink-100">{profile.targetLevel} Curriculum</h3></div>
          <p className="text-sm text-ink-400">View units and track your progress</p>
        </div>
        <div className="card-hover p-5" onClick={() => navigate("/weak-points")}>
          <div className="flex items-center gap-3 mb-2"><span className="text-lg">△</span><h3 className="font-semibold text-ink-100">Weak Points</h3></div>
          {weakItems.length > 0 ? <p className="text-sm text-vermillion-400">{weakItems.length} need practice</p> : <p className="text-sm text-ink-400">No weak points!</p>}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="label">Quick Actions</h2>
        <div className="flex flex-wrap gap-2">
          <button className="btn-secondary" onClick={() => navigate("/quiz")}>Practice Test</button>
          <button className="btn-secondary" onClick={() => navigate("/kanji")}>Browse Kanji</button>
          <button className="btn-secondary" onClick={() => navigate("/grammar")}>Browse Grammar</button>
          <button className="btn-secondary" onClick={() => navigate("/study-path")}>Study Path</button>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="label">{profile.targetLevel} Progress</h2>
        <div className="card p-5 space-y-4">
          <PR label="Kanji" cur={learned.kanji} tot={counts.kanji} />
          <PR label="Vocabulary" cur={learned.vocab} tot={counts.vocab} />
          <PR label="Grammar" cur={learned.grammar} tot={counts.grammar} />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="label">Lifetime Stats</h2>
        <div className="card p-5"><div className="grid grid-cols-2 md:grid-cols-4 gap-y-4 gap-x-6 text-sm">
          <MS l="Reviews" v={stats.totalReviews} /><MS l="Correct" v={stats.totalCorrect} />
          <MS l="Weak" v={stats.weakCount} /><MS l="Burned" v={stats.burnedCount} />
        </div></div>
      </section>
    </div>
  );
}

function SC({ label, value, accent }: { label: string; value: string; accent?: "vermillion" | "jade" }) {
  const c = accent === "vermillion" ? "text-vermillion-400" : accent === "jade" ? "text-jade-400" : "text-ink-100";
  return <div className="card px-4 py-3"><p className="label mb-1">{label}</p><p className={`text-xl font-bold font-display ${c}`}>{value}</p></div>;
}
function AC({ title, count, sub, action, onClick }: { title: string; count: number; sub: string; action: string; onClick: () => void }) {
  return <div className="card-hover p-5 flex flex-col gap-3"><div><div className="flex items-baseline justify-between"><h3 className="font-semibold text-ink-100">{title}</h3><span className="text-2xl font-display font-bold text-ink-300">{count}</span></div><p className="text-sm text-ink-400 mt-1">{sub}</p></div><button className="btn-primary mt-auto w-full" onClick={onClick}>{action}</button></div>;
}
function PR({ label, cur, tot }: { label: string; cur: number; tot: number }) {
  const p = tot > 0 ? Math.round((cur / tot) * 100) : 0;
  return <div><div className="flex justify-between text-sm mb-1.5"><span className="text-ink-300 font-medium">{label}</span><span className="text-ink-500">{tot > 0 ? `${cur} / ${tot}` : "No content"}</span></div><div className="h-2 rounded-full bg-ink-800 overflow-hidden"><div className="h-full rounded-full bg-jade-500 transition-all duration-500" style={{ width: `${p}%` }} /></div></div>;
}
function MS({ l, v }: { l: string; v: number }) { return <div><p className="text-ink-500">{l}</p><p className="font-semibold text-ink-200">{v}</p></div>; }
function getMessage(p: UserProfile): string {
  if (p.currentStreak === 0 && p.totalXp === 0) return `Welcome, ${p.displayName}! Ready to start?`;
  if (p.currentStreak >= 7) return `${p.currentStreak}-day streak! Keep going, ${p.displayName}.`;
  return `Welcome back, ${p.displayName}. Let's study ${p.targetLevel} today.`;
}
