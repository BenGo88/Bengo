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
  questionKind: "meaning" | "reading";
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
    questionKind: "meaning",
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
    questionKind: "reading",
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
