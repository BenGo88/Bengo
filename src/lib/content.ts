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
