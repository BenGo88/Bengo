import { useEffect, useState } from "react";
import { getProfile, getDueItems, getWeakItems, getLearnedCount, getStats } from "../lib/storage";
import { getContentCounts } from "../lib/content";
import type { UserProfile, JLPTLevel } from "../lib/types";

export default function Dashboard() {
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    setProfile(getProfile());
  }, []);

  if (!profile) return null;

  const stats = getStats();
  const dueItems = getDueItems();
  const weakItems = getWeakItems();
  const counts = getContentCounts(profile.targetLevel as JLPTLevel);
  const learned = {
    kanji: getLearnedCount("kanji"),
    vocab: getLearnedCount("vocab"),
    grammar: getLearnedCount("grammar"),
  };

  const message = getMessage(profile);

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <header>
        <p className="label mb-1">Dashboard</p>
        <h1 className="font-display text-2xl md:text-3xl font-bold text-ink-50 tracking-tight">
          {message}
        </h1>
      </header>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          label="Streak"
          value={`${profile.currentStreak}日`}
          accent="vermillion"
        />
        <StatCard
          label="XP"
          value={profile.totalXp.toLocaleString()}
          accent="jade"
        />
        <StatCard
          label="Accuracy"
          value={stats.totalReviews > 0 ? `${stats.accuracy}%` : "—"}
        />
        <StatCard label="Target" value={profile.targetLevel} accent="vermillion" />
      </div>

      {/* Today's study actions */}
      <section className="space-y-3">
        <h2 className="label">Today&apos;s Study</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <ActionCard
            title="Reviews Due"
            count={dueItems.length}
            subtitle={
              dueItems.length === 0
                ? "You're all caught up"
                : `${dueItems.length} item${dueItems.length === 1 ? "" : "s"} waiting`
            }
            action="Start Reviews"
            disabled={dueItems.length === 0}
          />
          <ActionCard
            title="New Lessons"
            count={counts.kanji + counts.vocab + counts.grammar - learned.kanji - learned.vocab - learned.grammar}
            subtitle={`${counts.kanji + counts.vocab + counts.grammar} total ${profile.targetLevel} items`}
            action="Start Lessons"
            disabled={false}
          />
        </div>
      </section>

      {/* Quick actions */}
      <section className="space-y-3">
        <h2 className="label">Quick Actions</h2>
        <div className="flex flex-wrap gap-2">
          <QuickButton label={`Random ${profile.targetLevel} Quiz`} disabled />
          <QuickButton
            label={`Weak Points${weakItems.length > 0 ? ` (${weakItems.length})` : ""}`}
            disabled
          />
          <QuickButton label="Browse Kanji" disabled />
          <QuickButton label="Browse Grammar" disabled />
        </div>
        <p className="text-xs text-ink-500">
          Quiz, browse, and weak point features coming in v0.3+
        </p>
      </section>

      {/* Progress */}
      <section className="space-y-3">
        <h2 className="label">{profile.targetLevel} Progress</h2>
        <div className="card p-5 space-y-4">
          <ProgressRow label="Kanji" current={learned.kanji} total={counts.kanji} />
          <ProgressRow label="Vocabulary" current={learned.vocab} total={counts.vocab} />
          <ProgressRow label="Grammar" current={learned.grammar} total={counts.grammar} />
        </div>
      </section>

      {/* Weak points summary */}
      {weakItems.length > 0 && (
        <section className="space-y-3">
          <h2 className="label">Weak Points</h2>
          <div className="card border-vermillion-500/20 p-5">
            <p className="text-sm text-ink-300">
              <span className="text-vermillion-400 font-semibold">{weakItems.length}</span>{" "}
              item{weakItems.length === 1 ? "" : "s"} flagged as weak.
              These need extra review.
            </p>
          </div>
        </section>
      )}

      {/* Content stats */}
      <section className="space-y-3">
        <h2 className="label">Lifetime Stats</h2>
        <div className="card p-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-y-4 gap-x-6 text-sm">
            <MiniStat label="Total Reviews" value={stats.totalReviews} />
            <MiniStat label="Correct" value={stats.totalCorrect} />
            <MiniStat label="Weak Items" value={stats.weakCount} />
            <MiniStat label="Burned" value={stats.burnedCount} />
          </div>
        </div>
      </section>
    </div>
  );
}

/* ── Sub-components ──────────────────────────────────────────────────────── */

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "vermillion" | "jade";
}) {
  const cls =
    accent === "vermillion"
      ? "text-vermillion-400"
      : accent === "jade"
        ? "text-jade-400"
        : "text-ink-100";
  return (
    <div className="card px-4 py-3">
      <p className="label mb-1">{label}</p>
      <p className={`text-xl font-bold font-display ${cls}`}>{value}</p>
    </div>
  );
}

function ActionCard({
  title,
  count,
  subtitle,
  action,
  disabled,
}: {
  title: string;
  count: number;
  subtitle: string;
  action: string;
  disabled: boolean;
}) {
  return (
    <div className="card-hover p-5 flex flex-col gap-3">
      <div>
        <div className="flex items-baseline justify-between">
          <h3 className="font-semibold text-ink-100">{title}</h3>
          <span className="text-2xl font-display font-bold text-ink-300">{count}</span>
        </div>
        <p className="text-sm text-ink-400 mt-1">{subtitle}</p>
      </div>
      <button className="btn-primary mt-auto w-full" disabled={disabled}>
        {action}
      </button>
    </div>
  );
}

function QuickButton({ label, disabled }: { label: string; disabled?: boolean }) {
  return (
    <button className="btn-secondary" disabled={disabled}>
      {label}
    </button>
  );
}

function ProgressRow({
  label,
  current,
  total,
}: {
  label: string;
  current: number;
  total: number;
}) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-sm mb-1.5">
        <span className="text-ink-300 font-medium">{label}</span>
        <span className="text-ink-500">
          {total > 0 ? `${current} / ${total}` : "No content yet"}
        </span>
      </div>
      <div className="h-2 rounded-full bg-ink-800 overflow-hidden">
        <div
          className="h-full rounded-full bg-jade-500 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-ink-500">{label}</p>
      <p className="font-semibold text-ink-200">{value}</p>
    </div>
  );
}

function getMessage(profile: UserProfile): string {
  if (profile.currentStreak === 0 && profile.totalXp === 0) {
    return `Welcome, ${profile.displayName}! Ready to start your ${profile.targetLevel} journey?`;
  }
  if (profile.currentStreak >= 7) {
    return `${profile.currentStreak}-day streak! 🔥 Keep going, ${profile.displayName}.`;
  }
  return `Welcome back, ${profile.displayName}. Let's study ${profile.targetLevel} today.`;
}
