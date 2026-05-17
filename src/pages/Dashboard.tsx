import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getProfile, getDueItems, getWeakItems, getLearnedCount, getStats } from "../lib/storage";
import { getContentCounts } from "../lib/content";
import type { UserProfile, JLPTLevel } from "../lib/types";

export default function Dashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  useEffect(() => { setProfile(getProfile()); }, []);
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
        <SC label="Reviews Due" value={String(dueItems.length)} accent={dueItems.length > 0 ? "vermillion" : undefined} />
      </div>

      <section className="space-y-3">
        <h2 className="label">Today&apos;s Study</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <AC title="Reviews Due" count={dueItems.length} sub={dueItems.length === 0 ? "All caught up" : `${dueItems.length} waiting`} action={dueItems.length > 0 ? "Start Reviews" : "Practice Quiz"} onClick={() => navigate(dueItems.length > 0 ? "/reviews" : "/quiz")} />
          <AC title="New Lessons" count={unlearnedTotal} sub={`${counts.kanji + counts.vocab + counts.grammar} total ${profile.targetLevel} items`} action="Start Lesson" onClick={() => navigate("/lessons/session?type=mixed")} />
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2">
        <div className="card-hover p-5" onClick={() => navigate("/study-path")}>
          <div className="flex items-center gap-3 mb-2"><span className="text-lg">🗺</span><h3 className="font-semibold text-ink-100">Study Path</h3></div>
          <p className="text-sm text-ink-400">Foundation → N5 → N4 → N3 → N2 → N1</p>
          <p className="text-xs text-vermillion-400 mt-2 font-medium">Target: {profile.targetLevel}</p>
        </div>
        <div className="card-hover p-5" onClick={() => navigate("/weak-points")}>
          <div className="flex items-center gap-3 mb-2"><span className="text-lg">△</span><h3 className="font-semibold text-ink-100">Weak Points</h3></div>
          {weakItems.length > 0 ? <p className="text-sm text-vermillion-400">{weakItems.length} need practice</p> : <p className="text-sm text-ink-400">No weak points — keep it up!</p>}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="label">Quick Actions</h2>
        <div className="flex flex-wrap gap-2">
          <button className="btn-secondary" onClick={() => navigate("/lessons/session?type=mixed")}>Mixed Lesson</button>
          <button className="btn-secondary" onClick={() => navigate("/quiz")}>{profile.targetLevel} Quiz</button>
          <button className="btn-secondary" onClick={() => navigate("/kanji")}>Browse Kanji</button>
          <button className="btn-secondary" onClick={() => navigate("/grammar")}>Browse Grammar</button>
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
          <MS l="Total Reviews" v={stats.totalReviews} /><MS l="Correct" v={stats.totalCorrect} />
          <MS l="Weak Items" v={stats.weakCount} /><MS l="Burned" v={stats.burnedCount} />
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
  if (p.currentStreak === 0 && p.totalXp === 0) return `Welcome, ${p.displayName}! Ready to start your ${p.targetLevel} journey?`;
  if (p.currentStreak >= 7) return `${p.currentStreak}-day streak! Keep going, ${p.displayName}.`;
  return `Welcome back, ${p.displayName}. Let's study ${p.targetLevel} today.`;
}
