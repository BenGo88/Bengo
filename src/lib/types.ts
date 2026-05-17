/* ── Shared enrichment types ──────────────────────────────────────────────── */

export interface LexiconEntry {
  id: string;
  text: string;
  reading: string;
  meanings: string[];
  partOfSpeech: string;
  jlpt: string;
  tags?: string[];
  notes?: string;
}

export interface WordBreakdown {
  text: string;
  lexemeId?: string;           // reference to lexicon entry (v0.8+)
  reading?: string;            // local override or standalone
  meaning?: string;            // local override or standalone
  partOfSpeech?: string;
  role?: string;
  note?: string;
}

/** Sentence with optional furigana, interactive tokens, and notes. */
export interface RichSentence {
  ja: string;
  en: string;
  reading?: string;
  tokens?: WordBreakdown[];
  breakdown?: WordBreakdown[];
  structure?: string;
  note?: string;
}

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
  beginner_hint?: string;
  component_explanation?: string;
}

export interface Vocab {
  id: string;
  word: string;
  reading: string;
  meanings: string[];
  part_of_speech: string;
  jlpt: JLPTLevel;
  sentences: RichSentence[];
  nuance?: string;
  collocations?: string[];
  similar?: { word: string; note: string }[];
  formality?: "formal" | "informal" | "neutral";
  tags?: string[];
  simple_usage?: string;
  beginner_warning?: string;
  related_basic_words?: string[];
}

export interface GrammarPoint {
  id: string;
  title: string;
  meaning_short: string;
  explanation: string;
  formation: string[];
  examples: RichSentence[];
  similar?: { title: string; diff: string }[];
  common_mistakes?: { wrong: string; correct: string; why: string }[];
  jlpt: JLPTLevel;
  tags?: string[];
  simple_explanation?: string;
  prerequisites?: string[];
  beginner_warning?: string;
  // Curriculum metadata (v1.0+)
  order?: number;
  unit?: string;
}

/* ── User progress (stored in localStorage) ──────────────────────────────── */

export type SRSStage =
  | "lesson" | "apprentice1" | "apprentice2" | "apprentice3"
  | "guru1" | "guru2" | "master" | "enlightened" | "burned";

export type ItemType = "kanji" | "vocab" | "grammar";
export type FuriganaMode = "always" | "hover" | "hide";

export interface UserItem {
  id: string;
  type: ItemType;
  srsStage: SRSStage;
  nextReview: string;
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
  lastStudyDate: string | null;
  furiganaMode?: FuriganaMode;
  beginnerAssist?: boolean;
  // Placement (v0.7+)
  placementLevel?: JLPTLevel | "Foundation";
  placementDate?: string;
  placementScores?: Record<string, number>;
}

export interface UserData {
  profile: UserProfile;
  items: Record<string, UserItem>;
  version: number;
}
