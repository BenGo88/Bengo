import { useEffect, useState, useRef } from "react";
import {
  getProfile,
  updateProfile,
  exportData,
  importData,
  resetAllData,
  getStats,
} from "../lib/storage";
import type { UserProfile, JLPTLevel } from "../lib/types";

const LEVELS: JLPTLevel[] = ["N5", "N4", "N3", "N2", "N1"];

export default function Settings() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [saved, setSaved] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setProfile(getProfile());
  }, []);

  if (!profile) return null;

  function handleSave() {
    if (!profile) return;
    updateProfile(profile);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleExport() {
    const json = exportData();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bengo-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const ok = importData(reader.result as string);
      if (ok) {
        setProfile(getProfile());
        setImportStatus("Import successful!");
      } else {
        setImportStatus("Invalid file format.");
      }
      setTimeout(() => setImportStatus(null), 3000);
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  function handleReset() {
    resetAllData();
    setProfile(getProfile());
    setShowReset(false);
  }

  const stats = getStats();

  return (
    <div className="max-w-xl mx-auto space-y-8 animate-fade-in">
      <header>
        <p className="label mb-1">Settings</p>
        <h1 className="font-display text-2xl font-bold text-ink-50 tracking-tight">
          Study Preferences
        </h1>
      </header>

      {/* Profile settings */}
      <div className="card p-6 space-y-6">
        <Field label="Display Name">
          <input
            type="text"
            value={profile.displayName}
            onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
            className="field-input"
          />
        </Field>

        <Field label="Target JLPT Level">
          <div className="flex gap-2">
            {LEVELS.map((l) => (
              <button
                key={l}
                onClick={() => setProfile({ ...profile, targetLevel: l })}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  profile.targetLevel === l
                    ? "bg-vermillion-500 text-white shadow-lg shadow-vermillion-500/20"
                    : "bg-ink-800 text-ink-400 hover:text-ink-200 hover:bg-ink-700"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Daily Study Goal (minutes)">
          <div className="flex items-center gap-4">
            <input
              type="range"
              min={5}
              max={120}
              step={5}
              value={profile.dailyGoalMin}
              onChange={(e) =>
                setProfile({ ...profile, dailyGoalMin: Number(e.target.value) })
              }
              className="flex-1 accent-vermillion-500"
            />
            <span className="text-lg font-display font-bold text-ink-200 w-16 text-right">
              {profile.dailyGoalMin}m
            </span>
          </div>
        </Field>

        <Field label="New Items Per Day">
          <div className="flex items-center gap-4">
            <input
              type="range"
              min={3}
              max={30}
              step={1}
              value={profile.newItemsPerDay}
              onChange={(e) =>
                setProfile({ ...profile, newItemsPerDay: Number(e.target.value) })
              }
              className="flex-1 accent-vermillion-500"
            />
            <span className="text-lg font-display font-bold text-ink-200 w-16 text-right">
              {profile.newItemsPerDay}
            </span>
          </div>
        </Field>

        <div className="flex items-center gap-3 pt-2">
          <button className="btn-primary" onClick={handleSave}>
            Save Changes
          </button>
          {saved && (
            <span className="text-sm text-jade-400 font-medium animate-fade-in">
              ✓ Saved
            </span>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="card p-6 space-y-3">
        <h2 className="label">Study Stats</h2>
        <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-sm">
          <Stat label="Total Reviews" value={stats.totalReviews} />
          <Stat label="Total Correct" value={stats.totalCorrect} />
          <Stat label="Total XP" value={profile.totalXp} />
          <Stat label="Current Streak" value={`${profile.currentStreak} days`} />
          <Stat label="Longest Streak" value={`${profile.longestStreak} days`} />
          <Stat label="Last Study" value={profile.lastStudyDate ?? "Not yet"} />
        </div>
      </div>

      {/* Data management */}
      <div className="card p-6 space-y-4">
        <h2 className="label">Data Management</h2>
        <p className="text-sm text-ink-400">
          Your progress is saved in your browser. Export regularly to keep a backup.
        </p>
        <div className="flex flex-wrap gap-3">
          <button className="btn-secondary" onClick={handleExport}>
            Export Backup
          </button>
          <button className="btn-secondary" onClick={() => fileRef.current?.click()}>
            Import Backup
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleImport}
          />
          <button
            className="btn-secondary text-vermillion-400 border-vermillion-500/30 hover:bg-vermillion-500/10"
            onClick={() => setShowReset(true)}
          >
            Reset All Data
          </button>
        </div>
        {importStatus && (
          <p className="text-sm text-jade-400 animate-fade-in">{importStatus}</p>
        )}
      </div>

      {/* Reset confirmation */}
      {showReset && (
        <div className="card border-vermillion-500/40 p-6 space-y-3">
          <p className="text-sm text-ink-200 font-semibold">
            Are you sure? This will erase all your progress permanently.
          </p>
          <div className="flex gap-3">
            <button
              className="btn-primary bg-vermillion-600"
              onClick={handleReset}
            >
              Yes, Reset Everything
            </button>
            <button className="btn-secondary" onClick={() => setShowReset(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="label">{label}</label>
      {children}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-ink-500">{label}</p>
      <p className="font-semibold text-ink-200">{value}</p>
    </div>
  );
}
