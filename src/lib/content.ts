/**
 * content.ts — loads all study content from split JSON files.
 * Data is organized as src/data/{type}/{level}.json.
 * Static imports are combined at build time.
 */

import type { Kanji, Vocab, GrammarPoint, JLPTLevel, ItemType } from "./types";

// ── Static imports from split data files ────────────────────────────────────

import kanjiN5 from "../data/kanji/n5.json";
import kanjiN4 from "../data/kanji/n4.json";
import kanjiN3 from "../data/kanji/n3.json";
import kanjiN2 from "../data/kanji/n2.json";
import kanjiN1 from "../data/kanji/n1.json";

import vocabN5 from "../data/vocab/n5.json";
import vocabN4 from "../data/vocab/n4.json";
import vocabN3 from "../data/vocab/n3.json";
import vocabN2 from "../data/vocab/n2.json";
import vocabN1 from "../data/vocab/n1.json";

import grammarN5 from "../data/grammar/n5.json";
import grammarN4 from "../data/grammar/n4.json";
import grammarN3 from "../data/grammar/n3.json";
import grammarN2 from "../data/grammar/n2.json";
import grammarN1 from "../data/grammar/n1.json";

// ── Combined arrays ─────────────────────────────────────────────────────────

export const allKanji: Kanji[] = [
  ...kanjiN5, ...kanjiN4, ...kanjiN3, ...kanjiN2, ...kanjiN1,
] as Kanji[];

export const allVocab: Vocab[] = [
  ...vocabN5, ...vocabN4, ...vocabN3, ...vocabN2, ...vocabN1,
] as Vocab[];

export const allGrammar: GrammarPoint[] = [
  ...grammarN5, ...grammarN4, ...grammarN3, ...grammarN2, ...grammarN1,
] as GrammarPoint[];

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
  title: string;
  subtitle: string;
  jlpt: JLPTLevel;
}

function toLessonItem(type: ItemType, id: string, title: string, subtitle: string, jlpt: JLPTLevel): LessonItem {
  return { type, id, title, subtitle, jlpt };
}

export function getUnlearnedByType(type: ItemType, level: JLPTLevel): LessonItem[] {
  if (type === "kanji") {
    return getKanjiByLevel(level).filter((k) => !getUserItem("kanji", k.id))
      .map((k) => toLessonItem("kanji", k.id, k.character, k.meanings[0], k.jlpt));
  }
  if (type === "vocab") {
    return getVocabByLevel(level).filter((v) => !getUserItem("vocab", v.id))
      .map((v) => toLessonItem("vocab", v.id, v.word, v.meanings[0], v.jlpt));
  }
  return getGrammarByLevel(level).filter((g) => !getUserItem("grammar", g.id))
    .map((g) => toLessonItem("grammar", g.id, g.title, g.meaning_short, g.jlpt));
}

export function getSuggestedLessonBatch(level: JLPTLevel, filterType?: ItemType, batchSize = 4): LessonItem[] {
  if (filterType) return getUnlearnedByType(filterType, level).slice(0, batchSize);

  const kanji = getUnlearnedByType("kanji", level);
  const vocab = getUnlearnedByType("vocab", level);
  const grammar = getUnlearnedByType("grammar", level);

  const batch: LessonItem[] = [];
  if (kanji.length > 0) batch.push(kanji[0]);
  for (const v of vocab) { if (batch.length < 3) batch.push(v); }
  if (grammar.length > 0 && batch.length < 4) batch.push(grammar[0]);

  const used = new Set(batch.map((b) => `${b.type}:${b.id}`));
  const remaining = [...kanji, ...vocab, ...grammar].filter((i) => !used.has(`${i.type}:${i.id}`));
  for (const r of remaining) { if (batch.length >= batchSize) break; batch.push(r); }

  return batch.slice(0, batchSize);
}

/** Distractor meanings for multiple-choice quizzes. */
export function getDistractors(type: ItemType, excludeId: string, count = 3): string[] {
  let pool: string[];
  if (type === "kanji") pool = allKanji.filter((k) => k.id !== excludeId).map((k) => k.meanings[0]);
  else if (type === "vocab") pool = allVocab.filter((v) => v.id !== excludeId).map((v) => v.meanings[0]);
  else pool = allGrammar.filter((g) => g.id !== excludeId).map((g) => g.meaning_short);
  return pool.sort(() => Math.random() - 0.5).slice(0, count);
}

/** Distractor readings for kanji/vocab quizzes. */
export function getReadingDistractors(type: "kanji" | "vocab", excludeId: string, count = 3): string[] {
  let pool: string[];
  if (type === "kanji") pool = allKanji.filter((k) => k.id !== excludeId).flatMap((k) => [...k.onyomi, ...k.kunyomi]).filter(Boolean);
  else pool = allVocab.filter((v) => v.id !== excludeId).map((v) => v.reading);
  return pool.sort(() => Math.random() - 0.5).slice(0, count);
}

/* ── Unit/Curriculum helpers (v1.0) ──────────────────────────────────────── */

export interface CurriculumUnit {
  name: string;
  grammar: GrammarPoint[];
  vocab: Vocab[];
  kanji: Kanji[];
}

/** Get all curriculum units for a level, ordered by grammar order field. */
export function getUnitsForLevel(level: JLPTLevel): CurriculumUnit[] {
  const grammar = getGrammarByLevel(level).filter((g) => g.unit).sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
  const unitNames: string[] = [];
  for (const g of grammar) {
    if (g.unit && !unitNames.includes(g.unit)) unitNames.push(g.unit);
  }

  const vocab = getVocabByLevel(level);
  const kanji = getKanjiByLevel(level);

  return unitNames.map((name) => ({
    name,
    grammar: grammar.filter((g) => g.unit === name),
    vocab: vocab.filter((v) => (v as any).unit === name),
    kanji: kanji.filter((k) => (k as any).unit === name),
  }));
}

/** Get next incomplete unit for a level. */
export function getNextIncompleteUnit(level: JLPTLevel): CurriculumUnit | null {
  const units = getUnitsForLevel(level);
  for (const unit of units) {
    const allIds = [
      ...unit.grammar.map((g) => ({ type: "grammar" as ItemType, id: g.id })),
      ...unit.vocab.map((v) => ({ type: "vocab" as ItemType, id: v.id })),
      ...unit.kanji.map((k) => ({ type: "kanji" as ItemType, id: k.id })),
    ];
    const hasUnlearned = allIds.some(({ type, id }) => !getUserItem(type, id));
    if (hasUnlearned) return unit;
  }
  return null;
}

/** Get ordered lesson batch from curriculum. */
export function getCurriculumLessonBatch(level: JLPTLevel, batchSize = 4): LessonItem[] {
  const unit = getNextIncompleteUnit(level);
  if (!unit) {
    return getSuggestedLessonBatch(level, undefined, batchSize);
  }

  const batch: LessonItem[] = [];

  // Grammar from this unit first
  for (const g of unit.grammar) {
    if (!getUserItem("grammar", g.id) && batch.length < 2) {
      batch.push(toLessonItem("grammar", g.id, g.title, g.meaning_short, g.jlpt));
    }
  }

  // Unit-linked vocab first, then level-wide
  const unitVocab = unit.vocab.filter((v) => !getUserItem("vocab", v.id));
  const unitKanji = unit.kanji.filter((k) => !getUserItem("kanji", k.id));
  for (const v of unitVocab) { if (batch.length < batchSize - 1) batch.push(toLessonItem("vocab", v.id, v.word, v.meanings[0], v.jlpt)); }
  for (const k of unitKanji) { if (batch.length < batchSize) batch.push(toLessonItem("kanji", k.id, k.character, k.meanings[0], k.jlpt)); }

  // Fill remaining from level if needed
  if (batch.length < batchSize) {
    const vocab = getUnlearnedByType("vocab", level);
    const kanji = getUnlearnedByType("kanji", level);
    for (const v of vocab) { if (batch.length < batchSize - 1) batch.push(v); }
    for (const k of kanji) { if (batch.length < batchSize) batch.push(k); }
  }

  return batch.slice(0, batchSize);
}
