/* ── Content types (loaded from JSON data files) ─────────────────────────── */

export type JLPTLevel = "N5" | "N4" | "N3" | "N2" | "N1";

export interface Kanji {
  id: string;
  character: string;
  meanings: string[];
  onyomi: string[];
  kunyomi: string[];
  mnemonic?: string;
  components?: string;
  similar?: string[];
  common_words: { word: string; reading: string; meaning: string }[];
  usage_note?: string;
  jlpt: JLPTLevel;
  tags?: string[];
}

export interface Vocab {
  id: string;
  word: string;
  reading: string;
  meanings: string[];
  part_of_speech: string;
  jlpt: JLPTLevel;
  sentences: { ja: string; en: string }[];
  nuance?: string;
  collocations?: string[];
  similar?: { word: string; note: string }[];
  formality?: "formal" | "informal" | "neutral";
  tags?: string[];
}

export interface GrammarPoint {
  id: string;
  title: string;
  meaning_short: string;
  explanation: string;
  formation: string[];
  examples: { ja: string; en: string; note?: string }[];
  similar?: { title: string; diff: string }[];
  common_mistakes?: { wrong: string; correct: string; why: string }[];
  jlpt: JLPTLevel;
  tags?: string[];
}

/* ── User progress (stored in localStorage) ──────────────────────────────── */

export type SRSStage =
  | "lesson"
  | "apprentice1"
  | "apprentice2"
  | "apprentice3"
  | "guru1"
  | "guru2"
  | "master"
  | "enlightened"
  | "burned";

export type ItemType = "kanji" | "vocab" | "grammar";

export interface UserItem {
  id: string;           // matches content id
  type: ItemType;
  srsStage: SRSStage;
  nextReview: string;   // ISO datetime
  lastReviewed?: string;
  totalReviews: number;
  totalCorrect: number;
  totalWrong: number;
  consecutiveWrong: number;
  isWeak: boolean;
}

export interface UserProfile {
  displayName: string;
  targetLevel: JLPTLevel;
  dailyGoalMin: number;
  newItemsPerDay: number;
  currentStreak: number;
  longestStreak: number;
  totalXp: number;
  lastStudyDate: string | null; // YYYY-MM-DD
}

export interface UserData {
  profile: UserProfile;
  items: Record<string, UserItem>;  // keyed by `${type}:${id}`
  version: number;
}
