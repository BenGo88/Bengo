import type { ReadingPassage, ReadingProgress, JLPTLevel } from "./types";

import rN5 from "../data/reading/n5.json";
import rN4 from "../data/reading/n4.json";
import rN3 from "../data/reading/n3.json";
import rN2 from "../data/reading/n2.json";
import rN1 from "../data/reading/n1.json";

export const allReadings: ReadingPassage[] = [
  ...rN5, ...rN4, ...rN3, ...rN2, ...rN1,
] as ReadingPassage[];

export function getReadingsByLevel(level: JLPTLevel): ReadingPassage[] {
  return allReadings.filter((r) => r.jlpt === level);
}

export function getReadingById(id: string): ReadingPassage | undefined {
  return allReadings.find((r) => r.id === id);
}

export function getReadingCounts() {
  const counts: Record<string, number> = {};
  for (const r of allReadings) counts[r.jlpt] = (counts[r.jlpt] ?? 0) + 1;
  return { total: allReadings.length, byLevel: counts };
}

// ── Reading progress storage ────────────────────────────────────────────────

const READING_KEY = "bengo_reading_progress";

function loadAll(): Record<string, ReadingProgress> {
  try { return JSON.parse(localStorage.getItem(READING_KEY) || "{}"); } catch { return {}; }
}
function saveAll(data: Record<string, ReadingProgress>) {
  localStorage.setItem(READING_KEY, JSON.stringify(data));
}

export function getReadingProgress(id: string): ReadingProgress | null {
  return loadAll()[id] ?? null;
}

export function saveReadingResult(id: string, score: number, total: number, unknownWords: string[]) {
  const all = loadAll();
  const prev = all[id];
  const pct = total > 0 ? Math.round((score / total) * 100) : 0;
  all[id] = {
    readingId: id,
    completed: true,
    bestScore: Math.max(prev?.bestScore ?? 0, pct),
    lastScore: pct,
    timesRead: (prev?.timesRead ?? 0) + 1,
    unknownWords: [...new Set([...(prev?.unknownWords ?? []), ...unknownWords])],
    completedAt: prev?.completedAt ?? new Date().toISOString(),
    lastReadAt: new Date().toISOString(),
  };
  saveAll(all);
}

export function getAllReadingProgress(): Record<string, ReadingProgress> {
  return loadAll();
}

export function getCompletedReadingCount(): number {
  return Object.values(loadAll()).filter((p) => p.completed).length;
}

export function getRecommendedReading(level: JLPTLevel): ReadingPassage | null {
  const passages = getReadingsByLevel(level);
  const progress = loadAll();
  // Find first uncompleted passage
  for (const p of passages) {
    if (!progress[p.id]?.completed) return p;
  }
  // If all completed, find lowest score
  let lowest: ReadingPassage | null = null;
  let lowestScore = 101;
  for (const p of passages) {
    const pr = progress[p.id];
    if (pr && pr.bestScore < lowestScore) { lowest = p; lowestScore = pr.bestScore; }
  }
  return lowest ?? passages[0] ?? null;
}

// ── Practice test history ───────────────────────────────────────────────────

const TEST_HISTORY_KEY = "bengo_test_history";

export interface TestResult {
  id: string;
  date: string;
  level: string;
  mode: string;
  timed: boolean;
  durationSeconds: number;
  totalQuestions: number;
  correct: number;
  accuracy: number;
  sections: { name: string; total: number; correct: number }[];
}

function loadTestHistory(): TestResult[] {
  try { return JSON.parse(localStorage.getItem(TEST_HISTORY_KEY) || "[]"); } catch { return []; }
}

export function saveTestResult(result: TestResult) {
  const history = loadTestHistory();
  history.unshift(result);
  if (history.length > 50) history.length = 50; // keep last 50
  localStorage.setItem(TEST_HISTORY_KEY, JSON.stringify(history));
}

export function getTestHistory(): TestResult[] {
  return loadTestHistory();
}

export function getRecentTests(count = 5): TestResult[] {
  return loadTestHistory().slice(0, count);
}
