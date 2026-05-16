/**
 * storage.ts — localStorage persistence for user progress.
 *
 * All study content lives in static JSON files (src/data/).
 * User progress, SRS state, and settings live here in localStorage.
 * This replaces the entire FastAPI backend from the old design.
 */

import type { UserData, UserProfile, UserItem, ItemType, SRSStage } from "./types";

const STORAGE_KEY = "bengo";
const CURRENT_VERSION = 1;

/* ── Defaults ────────────────────────────────────────────────────────────── */

const DEFAULT_PROFILE: UserProfile = {
  displayName: "Ben",
  targetLevel: "N2",
  dailyGoalMin: 30,
  newItemsPerDay: 10,
  currentStreak: 0,
  longestStreak: 0,
  totalXp: 0,
  lastStudyDate: null,
};

function createDefaultData(): UserData {
  return {
    profile: { ...DEFAULT_PROFILE },
    items: {},
    version: CURRENT_VERSION,
  };
}

/* ── Core read/write ─────────────────────────────────────────────────────── */

export function loadUserData(): UserData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultData();
    const parsed = JSON.parse(raw) as UserData;
    if (parsed.version !== CURRENT_VERSION) {
      // future: run migrations here
      return createDefaultData();
    }
    return parsed;
  } catch {
    return createDefaultData();
  }
}

export function saveUserData(data: UserData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/* ── Profile helpers ─────────────────────────────────────────────────────── */

export function getProfile(): UserProfile {
  return loadUserData().profile;
}

export function updateProfile(updates: Partial<UserProfile>): UserProfile {
  const data = loadUserData();
  data.profile = { ...data.profile, ...updates };
  saveUserData(data);
  return data.profile;
}

/* ── SRS item helpers ────────────────────────────────────────────────────── */

function itemKey(type: ItemType, id: string): string {
  return `${type}:${id}`;
}

export function getUserItem(type: ItemType, id: string): UserItem | null {
  const data = loadUserData();
  return data.items[itemKey(type, id)] ?? null;
}

export function getAllItems(): UserItem[] {
  const data = loadUserData();
  return Object.values(data.items);
}

export function getItemsByType(type: ItemType): UserItem[] {
  return getAllItems().filter((i) => i.type === type);
}

export function getDueItems(now?: Date): UserItem[] {
  const cutoff = (now ?? new Date()).toISOString();
  return getAllItems().filter(
    (i) => i.srsStage !== "lesson" && i.srsStage !== "burned" && i.nextReview <= cutoff,
  );
}

export function getWeakItems(): UserItem[] {
  return getAllItems().filter((i) => i.isWeak);
}

export function getLearnedCount(type: ItemType): number {
  return getItemsByType(type).filter((i) => i.srsStage !== "lesson").length;
}

/* ── SRS engine ──────────────────────────────────────────────────────────── */

const SRS_ORDER: SRSStage[] = [
  "lesson",
  "apprentice1",
  "apprentice2",
  "apprentice3",
  "guru1",
  "guru2",
  "master",
  "enlightened",
  "burned",
];

// Hours until next review for each stage
const SRS_INTERVALS: Record<SRSStage, number> = {
  lesson: 0,
  apprentice1: 4,
  apprentice2: 8,
  apprentice3: 24,
  guru1: 72,
  guru2: 168,
  master: 336,
  enlightened: 720,
  burned: Infinity,
};

function stageIndex(stage: SRSStage): number {
  return SRS_ORDER.indexOf(stage);
}

export function startLearning(type: ItemType, id: string): UserItem {
  const data = loadUserData();
  const key = itemKey(type, id);
  const now = new Date();

  const item: UserItem = {
    id,
    type,
    srsStage: "apprentice1",
    nextReview: new Date(now.getTime() + SRS_INTERVALS.apprentice1 * 3600000).toISOString(),
    lastReviewed: now.toISOString(),
    totalReviews: 0,
    totalCorrect: 0,
    totalWrong: 0,
    consecutiveWrong: 0,
    isWeak: false,
  };

  data.items[key] = item;
  data.profile.totalXp += 10; // XP for learning new item
  saveUserData(data);
  return item;
}

export function processAnswer(type: ItemType, id: string, correct: boolean): UserItem {
  const data = loadUserData();
  const key = itemKey(type, id);
  const item = data.items[key];
  if (!item) throw new Error(`Item not found: ${key}`);

  const now = new Date();
  item.totalReviews += 1;
  item.lastReviewed = now.toISOString();

  if (correct) {
    item.totalCorrect += 1;
    item.consecutiveWrong = 0;
    data.profile.totalXp += 5;

    // Advance one stage
    const idx = stageIndex(item.srsStage);
    if (idx < SRS_ORDER.length - 1) {
      item.srsStage = SRS_ORDER[idx + 1];
    }
  } else {
    item.totalWrong += 1;
    item.consecutiveWrong += 1;

    // Drop back: higher stages drop more
    const idx = stageIndex(item.srsStage);
    const penalty = Math.max(1, Math.floor(idx / 2));
    const newIdx = Math.max(1, idx - penalty); // never below apprentice1
    item.srsStage = SRS_ORDER[newIdx];

    // Weak detection: wrong 3+ times total, or 2+ in a row, or <60% accuracy
    const accuracy = item.totalReviews > 0 ? item.totalCorrect / item.totalReviews : 1;
    if (item.totalWrong >= 3 || item.consecutiveWrong >= 2 || accuracy < 0.6) {
      item.isWeak = true;
    }
  }

  // Schedule next review
  if (item.srsStage === "burned") {
    item.nextReview = "9999-12-31T23:59:59Z";
  } else {
    const hours = SRS_INTERVALS[item.srsStage];
    item.nextReview = new Date(now.getTime() + hours * 3600000).toISOString();
  }

  data.items[key] = item;
  saveUserData(data);
  return item;
}

/* ── Streak tracking ─────────────────────────────────────────────────────── */

export function recordStudySession(): void {
  const data = loadUserData();
  const today = new Date().toISOString().slice(0, 10);

  if (data.profile.lastStudyDate === today) return; // already logged today

  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (data.profile.lastStudyDate === yesterday) {
    data.profile.currentStreak += 1;
  } else {
    data.profile.currentStreak = 1;
  }

  data.profile.longestStreak = Math.max(
    data.profile.longestStreak,
    data.profile.currentStreak,
  );
  data.profile.lastStudyDate = today;
  saveUserData(data);
}

/* ── Stats ───────────────────────────────────────────────────────────────── */

export function getStats() {
  const items = getAllItems();
  const active = items.filter((i) => i.srsStage !== "lesson");
  const totalReviews = active.reduce((s, i) => s + i.totalReviews, 0);
  const totalCorrect = active.reduce((s, i) => s + i.totalCorrect, 0);

  return {
    totalItems: items.length,
    activeItems: active.length,
    totalReviews,
    totalCorrect,
    accuracy: totalReviews > 0 ? Math.round((totalCorrect / totalReviews) * 100) : 0,
    weakCount: items.filter((i) => i.isWeak).length,
    burnedCount: items.filter((i) => i.srsStage === "burned").length,
  };
}

/* ── Export / Import (for backup) ────────────────────────────────────────── */

export function exportData(): string {
  return JSON.stringify(loadUserData(), null, 2);
}

export function importData(json: string): boolean {
  try {
    const data = JSON.parse(json) as UserData;
    if (data.version && data.profile && data.items) {
      saveUserData(data);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export function resetAllData(): void {
  saveUserData(createDefaultData());
}
