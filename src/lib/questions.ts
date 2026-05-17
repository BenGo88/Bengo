/**
 * questions.ts — shared question generation for reviews, quizzes, and lessons.
 */

import type { ItemType, Kanji, Vocab, GrammarPoint } from "./types";
import {
  getContentById,
  getDistractors,
  getReadingDistractors,
  allKanji,
  allVocab,
  allGrammar,
} from "./content";
import { getUserItem } from "./storage";

export interface Question {
  itemType: ItemType;
  itemId: string;
  prompt: string;
  promptLabel: string;
  choices: string[];
  correctIndex: number;
  explanation: string;
  questionKind: "meaning" | "reading" | "cloze" | "context";
  detailPath?: string;
  contextSentence?: string;  // Japanese sentence for cloze/context
  contextEnglish?: string;   // English meaning for context
}

/** Build a meaning question for any item type. */
function meaningQuestion(type: ItemType, id: string): Question | null {
  const content = getContentById(type, id);
  if (!content) return null;

  let prompt: string;
  let correct: string;
  let explanation: string;

  if (type === "kanji") {
    const k = content as Kanji;
    prompt = k.character;
    correct = k.meanings[0];
    explanation = `${k.character} means "${k.meanings.join(", ")}"`;
  } else if (type === "vocab") {
    const v = content as Vocab;
    prompt = v.word;
    correct = v.meanings[0];
    explanation = `${v.word}（${v.reading}）means "${v.meanings.join(", ")}"`;
  } else {
    const g = content as GrammarPoint;
    prompt = g.title;
    correct = g.meaning_short;
    explanation = g.simple_explanation || g.explanation.slice(0, 120) + "…";
  }

  const distractors = getDistractors(type, id, 3);
  const choices = [...distractors];
  const correctIndex = Math.floor(Math.random() * (choices.length + 1));
  choices.splice(correctIndex, 0, correct);

  return {
    itemType: type,
    itemId: id,
    prompt,
    promptLabel: `What does this ${type === "grammar" ? "grammar point" : type} mean?`,
    choices: choices.slice(0, 4),
    correctIndex: Math.min(correctIndex, 3),
    explanation,
    questionKind: "meaning" as const,
    detailPath: `/${type}/${id}`,
  };
}

/** Build a reading question for kanji or vocab. */
function readingQuestion(type: "kanji" | "vocab", id: string): Question | null {
  const content = getContentById(type, id);
  if (!content) return null;

  let prompt: string;
  let correct: string;
  let explanation: string;

  if (type === "kanji") {
    const k = content as Kanji;
    const readings = [...k.onyomi, ...k.kunyomi].filter(Boolean);
    if (readings.length === 0) return null;
    prompt = k.character;
    correct = readings[0];
    explanation = `${k.character} is read as ${readings.join("、")}`;
  } else {
    const v = content as Vocab;
    prompt = v.word;
    correct = v.reading;
    explanation = `${v.word} is read as ${v.reading}`;
  }

  const distractors = getReadingDistractors(type, id, 3);
  const choices = [...distractors];
  const correctIndex = Math.floor(Math.random() * (choices.length + 1));
  choices.splice(correctIndex, 0, correct);

  return {
    itemType: type,
    itemId: id,
    prompt,
    promptLabel: `What is the reading?`,
    choices: choices.slice(0, 4),
    correctIndex: Math.min(correctIndex, 3),
    explanation,
    questionKind: "reading" as const,
    detailPath: `/${type}/${id}`,
  };
}

/** Generate a question for a given item. Randomly picks meaning or reading. */
export function generateQuestion(type: ItemType, id: string): Question | null {
  if (type === "grammar") {
    return meaningQuestion(type, id);
  }
  // For kanji/vocab: randomly pick meaning or reading
  if (Math.random() < 0.5) {
    const rq = readingQuestion(type as "kanji" | "vocab", id);
    if (rq) return rq;
  }
  return meaningQuestion(type, id);
}

/** Build a queue of questions from item list. */
export function buildQuestionQueue(
  items: { type: ItemType; id: string }[],
): Question[] {
  const questions: Question[] = [];
  for (const item of items) {
    const q = generateQuestion(item.type, item.id);
    if (q) questions.push(q);
  }
  return questions;
}

/** Build quiz questions from content pool (not tied to SRS). */
export function buildQuizQueue(
  category: ItemType | "mixed",
  level: string,
  source: "all" | "learned" | "unlearned" | "weak",
  size: number,
): Question[] {
  // Gather candidate items
  const candidates: { type: ItemType; id: string }[] = [];

  const addPool = (type: ItemType, pool: { id: string; jlpt: string }[]) => {
    for (const item of pool) {
      if (item.jlpt !== level) continue;
      const ui = getUserItem(type, item.id);
      if (source === "learned" && !ui) continue;
      if (source === "unlearned" && ui) continue;
      if (source === "weak" && (!ui || !ui.isWeak)) continue;
      candidates.push({ type, id: item.id });
    }
  };

  if (category === "kanji" || category === "mixed") addPool("kanji", allKanji);
  if (category === "vocab" || category === "mixed") addPool("vocab", allVocab);
  if (category === "grammar" || category === "mixed") addPool("grammar", allGrammar);

  // Shuffle
  const shuffled = candidates.sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, size);

  return buildQuestionQueue(selected);
}

/** Build quiz questions from a specific curriculum unit. */
export function buildUnitQuizQueue(
  level: string,
  unitName: string,
  size: number,
): Question[] {
  const candidates: { type: ItemType; id: string }[] = [];

  // Grammar items in this unit
  for (const g of allGrammar) {
    if (g.jlpt === level && (g as any).unit === unitName) {
      candidates.push({ type: "grammar", id: g.id });
    }
  }

  // Vocab/kanji linked to this unit
  for (const v of allVocab) {
    if (v.jlpt === level && (v as any).unit === unitName) {
      candidates.push({ type: "vocab", id: v.id });
    }
  }
  for (const k of allKanji) {
    if (k.jlpt === level && (k as any).unit === unitName) {
      candidates.push({ type: "kanji", id: k.id });
    }
  }

  const shuffled = candidates.sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, size);
  return buildQuestionQueue(selected);
}

/** Generate a cloze question for a grammar item using its example sentence. */
function clozeGrammarQuestion(id: string): Question | null {
  const g = allGrammar.find((x) => x.id === id);
  if (!g || !g.examples?.length) return null;
  const ex = g.examples[0];
  if (!ex.ja || !ex.en) return null;

  // Replace the grammar pattern in the sentence with a blank
  const title = g.title.replace(/[〜～]/g, "");
  const blankSentence = ex.ja.includes(title) ? ex.ja.replace(title, "（　　）") : ex.ja.replace(/.$/, "（　　）。");

  // Build distractors from other grammar at same level
  const distractors = allGrammar
    .filter((x) => x.jlpt === g.jlpt && x.id !== id)
    .map((x) => x.title.replace(/[〜～]/g, ""))
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);

  const choices = [...distractors];
  const correctIndex = Math.floor(Math.random() * (choices.length + 1));
  choices.splice(correctIndex, 0, title);

  return {
    itemType: "grammar", itemId: id,
    prompt: blankSentence,
    promptLabel: "Choose the correct grammar:",
    choices: choices.slice(0, 4),
    correctIndex: Math.min(correctIndex, 3),
    explanation: `${g.title}: ${g.meaning_short}. ${g.simple_explanation || ""}`,
    questionKind: "cloze",
    detailPath: `/grammar/${id}`,
    contextSentence: ex.ja,
    contextEnglish: ex.en,
  };
}

/** Generate a cloze question for vocab using its example sentence. */
function clozeVocabQuestion(id: string): Question | null {
  const v = allVocab.find((x) => x.id === id);
  if (!v || !v.sentences?.length) return null;
  const ex = v.sentences[0];
  if (!ex.ja) return null;

  const blankSentence = ex.ja.includes(v.word) ? ex.ja.replace(v.word, "（　　）") : null;
  if (!blankSentence) return null;

  const distractors = allVocab
    .filter((x) => x.jlpt === v.jlpt && x.id !== id && x.part_of_speech === v.part_of_speech)
    .map((x) => x.word)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);

  if (distractors.length < 2) return null; // not enough distractors

  const choices = [...distractors];
  const correctIndex = Math.floor(Math.random() * (choices.length + 1));
  choices.splice(correctIndex, 0, v.word);

  return {
    itemType: "vocab", itemId: id,
    prompt: blankSentence,
    promptLabel: "Choose the correct word:",
    choices: choices.slice(0, 4),
    correctIndex: Math.min(correctIndex, 3),
    explanation: `${v.word} (${v.reading}) = ${v.meanings.join(", ")}`,
    questionKind: "cloze",
    detailPath: `/vocab/${id}`,
    contextSentence: ex.ja,
    contextEnglish: ex.en,
  };
}

/** Generate a reading-style question: pick the best one. Picks cloze or meaning randomly. */
export function generateReadingStyleQuestion(type: ItemType, id: string): Question | null {
  if (type === "grammar") return clozeGrammarQuestion(id);
  if (type === "vocab") return clozeVocabQuestion(id) ?? meaningQuestion(type, id);
  return meaningQuestion(type, id); // kanji falls back to standard
}

/** Build quiz with mixed standard + reading-style questions. */
export function buildMixedQuizQueue(
  category: ItemType | "mixed",
  level: string,
  source: "all" | "learned" | "unlearned" | "weak",
  size: number,
  readingPct = 40,
): Question[] {
  const candidates: { type: ItemType; id: string }[] = [];
  const addPool = (type: ItemType, pool: { id: string; jlpt: string }[]) => {
    for (const item of pool) {
      if (item.jlpt !== level) continue;
      const ui = getUserItem(type, item.id);
      if (source === "learned" && !ui) continue;
      if (source === "unlearned" && ui) continue;
      if (source === "weak" && (!ui || !ui.isWeak)) continue;
      candidates.push({ type, id: item.id });
    }
  };
  if (category === "kanji" || category === "mixed") addPool("kanji", allKanji);
  if (category === "vocab" || category === "mixed") addPool("vocab", allVocab);
  if (category === "grammar" || category === "mixed") addPool("grammar", allGrammar);

  const shuffled = candidates.sort(() => Math.random() - 0.5).slice(0, size);
  const questions: Question[] = [];
  for (const item of shuffled) {
    const useReading = Math.random() * 100 < readingPct;
    const q = useReading
      ? generateReadingStyleQuestion(item.type, item.id) ?? generateQuestion(item.type, item.id)
      : generateQuestion(item.type, item.id);
    if (q) questions.push(q);
  }
  return questions;
}
