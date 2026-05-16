/**
 * content.ts — loads and provides access to all study content.
 *
 * Content is stored as JSON files in src/data/ and bundled at build time.
 * To add content: edit the JSON files, push to GitHub, it auto-deploys.
 */

import type { Kanji, Vocab, GrammarPoint, JLPTLevel, ItemType } from "./types";

import kanjiData from "../data/kanji.json";
import vocabData from "../data/vocab.json";
import grammarData from "../data/grammar.json";

// Cast imported JSON to typed arrays
export const allKanji: Kanji[] = kanjiData as Kanji[];
export const allVocab: Vocab[] = vocabData as Vocab[];
export const allGrammar: GrammarPoint[] = grammarData as GrammarPoint[];

/* ── Lookup helpers ──────────────────────────────────────────────────────── */

export function getKanjiById(id: string): Kanji | undefined {
  return allKanji.find((k) => k.id === id);
}

export function getVocabById(id: string): Vocab | undefined {
  return allVocab.find((v) => v.id === id);
}

export function getGrammarById(id: string): GrammarPoint | undefined {
  return allGrammar.find((g) => g.id === id);
}

export function getContentById(type: ItemType, id: string) {
  if (type === "kanji") return getKanjiById(id);
  if (type === "vocab") return getVocabById(id);
  if (type === "grammar") return getGrammarById(id);
  return undefined;
}

/* ── Filter by level ─────────────────────────────────────────────────────── */

export function getKanjiByLevel(level: JLPTLevel): Kanji[] {
  return allKanji.filter((k) => k.jlpt === level);
}

export function getVocabByLevel(level: JLPTLevel): Vocab[] {
  return allVocab.filter((v) => v.jlpt === level);
}

export function getGrammarByLevel(level: JLPTLevel): GrammarPoint[] {
  return allGrammar.filter((g) => g.jlpt === level);
}

/* ── Counts ──────────────────────────────────────────────────────────────── */

export function getContentCounts(level?: JLPTLevel) {
  const k = level ? getKanjiByLevel(level) : allKanji;
  const v = level ? getVocabByLevel(level) : allVocab;
  const g = level ? getGrammarByLevel(level) : allGrammar;
  return { kanji: k.length, vocab: v.length, grammar: g.length };
}

/* ── Lesson helpers ──────────────────────────────────────────────────────── */

import { getUserItem } from "./storage";

export interface LessonItem {
  type: ItemType;
  id: string;
  title: string;       // character, word, or grammar pattern
  subtitle: string;    // first meaning
  jlpt: JLPTLevel;
}

function toLessonItem(type: ItemType, id: string, title: string, subtitle: string, jlpt: JLPTLevel): LessonItem {
  return { type, id, title, subtitle, jlpt };
}

export function getUnlearnedByType(type: ItemType, level: JLPTLevel): LessonItem[] {
  if (type === "kanji") {
    return getKanjiByLevel(level)
      .filter((k) => !getUserItem("kanji", k.id))
      .map((k) => toLessonItem("kanji", k.id, k.character, k.meanings[0], k.jlpt));
  }
  if (type === "vocab") {
    return getVocabByLevel(level)
      .filter((v) => !getUserItem("vocab", v.id))
      .map((v) => toLessonItem("vocab", v.id, v.word, v.meanings[0], v.jlpt));
  }
  return getGrammarByLevel(level)
    .filter((g) => !getUserItem("grammar", g.id))
    .map((g) => toLessonItem("grammar", g.id, g.title, g.meaning_short, g.jlpt));
}

export function getSuggestedLessonBatch(
  level: JLPTLevel,
  filterType?: ItemType,
  batchSize = 4,
): LessonItem[] {
  if (filterType) {
    return getUnlearnedByType(filterType, level).slice(0, batchSize);
  }
  // Mixed: 1 kanji, 2 vocab, 1 grammar — fill from other types if short
  const kanji = getUnlearnedByType("kanji", level);
  const vocab = getUnlearnedByType("vocab", level);
  const grammar = getUnlearnedByType("grammar", level);

  const batch: LessonItem[] = [];
  if (kanji.length > 0) batch.push(kanji[0]);
  for (const v of vocab) { if (batch.length < 3) batch.push(v); }
  if (grammar.length > 0 && batch.length < 4) batch.push(grammar[0]);

  // If batch is still under size, fill from whatever's left
  const used = new Set(batch.map((b) => `${b.type}:${b.id}`));
  const remaining = [...kanji, ...vocab, ...grammar].filter((i) => !used.has(`${i.type}:${i.id}`));
  for (const r of remaining) { if (batch.length >= batchSize) break; batch.push(r); }

  return batch.slice(0, batchSize);
}

/** Get distractor meanings for multiple-choice quizzes. */
export function getDistractors(type: ItemType, excludeId: string, count = 3): string[] {
  let pool: string[];
  if (type === "kanji") {
    pool = allKanji.filter((k) => k.id !== excludeId).map((k) => k.meanings[0]);
  } else if (type === "vocab") {
    pool = allVocab.filter((v) => v.id !== excludeId).map((v) => v.meanings[0]);
  } else {
    pool = allGrammar.filter((g) => g.id !== excludeId).map((g) => g.meaning_short);
  }
  // Shuffle and take
  const shuffled = pool.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/** Get distractor readings for kanji/vocab quizzes. */
export function getReadingDistractors(type: "kanji" | "vocab", excludeId: string, count = 3): string[] {
  let pool: string[];
  if (type === "kanji") {
    pool = allKanji.filter((k) => k.id !== excludeId).flatMap((k) => [...k.onyomi, ...k.kunyomi]).filter(Boolean);
  } else {
    pool = allVocab.filter((v) => v.id !== excludeId).map((v) => v.reading);
  }
  const shuffled = pool.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
