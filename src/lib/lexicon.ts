/**
 * lexicon.ts — shared vocabulary/particle dictionary layer.
 * Tokens in sentences can reference lexicon entries via lexemeId
 * to avoid duplicating reading/meaning/partOfSpeech everywhere.
 */

import type { LexiconEntry, WordBreakdown } from "./types";

import lexFoundation from "../data/lexicon/foundation.json";
import lexN5 from "../data/lexicon/n5.json";
import lexN4 from "../data/lexicon/n4.json";
import lexN3 from "../data/lexicon/n3.json";
import lexN2 from "../data/lexicon/n2.json";
import lexN1 from "../data/lexicon/n1.json";

export const allLexicon: LexiconEntry[] = [
  ...lexFoundation, ...lexN5, ...lexN4, ...lexN3, ...lexN2, ...lexN1,
] as LexiconEntry[];

const byId = new Map<string, LexiconEntry>();
const byText = new Map<string, LexiconEntry[]>();

// Build indexes on load
for (const entry of allLexicon) {
  byId.set(entry.id, entry);
  const existing = byText.get(entry.text) ?? [];
  existing.push(entry);
  byText.set(entry.text, existing);
}

export function findLexiconById(id: string): LexiconEntry | undefined {
  return byId.get(id);
}

export function findLexiconByText(text: string): LexiconEntry[] {
  return byText.get(text) ?? [];
}

export function getLexiconCounts() {
  const counts: Record<string, number> = {};
  for (const e of allLexicon) {
    counts[e.jlpt] = (counts[e.jlpt] ?? 0) + 1;
  }
  return { total: allLexicon.length, byLevel: counts };
}

/** Enrich a token with lexicon data. Local fields override lexicon. */
export interface EnrichedToken {
  text: string;
  reading: string;
  meaning: string;
  partOfSpeech: string;
  role?: string;
  note?: string;
  fromLexicon: boolean;
}

export function enrichToken(token: WordBreakdown): EnrichedToken {
  let lex: LexiconEntry | undefined;
  if (token.lexemeId) {
    lex = findLexiconById(token.lexemeId);
  }

  return {
    text: token.text,
    reading: token.reading ?? lex?.reading ?? "",
    meaning: token.meaning ?? lex?.meanings?.[0] ?? "",
    partOfSpeech: token.partOfSpeech ?? lex?.partOfSpeech ?? "",
    role: token.role,
    note: token.note ?? lex?.notes,
    fromLexicon: !!lex,
  };
}

export function enrichTokens(tokens: WordBreakdown[]): EnrichedToken[] {
  return tokens.map(enrichToken);
}

/**
 * Auto-detect lexicon entries in a plain sentence (no tokens).
 * Simple substring matching — not a real parser.
 * Returns detected entries sorted by position in sentence.
 */
export function autoDetectLexicon(sentence: string): LexiconEntry[] {
  const detected: { entry: LexiconEntry; pos: number }[] = [];
  const seen = new Set<string>();

  // Sort lexicon by text length descending (match longer words first)
  const sorted = [...allLexicon].sort((a, b) => b.text.length - a.text.length);

  for (const entry of sorted) {
    if (entry.text.length < 2 && entry.partOfSpeech !== "particle") continue; // skip single chars except particles
    const pos = sentence.indexOf(entry.text);
    if (pos >= 0 && !seen.has(entry.text)) {
      detected.push({ entry, pos });
      seen.add(entry.text);
    }
  }

  // Sort by position in sentence
  detected.sort((a, b) => a.pos - b.pos);
  return detected.map((d) => d.entry);
}
