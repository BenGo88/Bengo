import type { JLPTLevel } from "./types";
import { allVocab, allGrammar } from "./content";
import { allReadings } from "./reading";

export interface ListeningItem {
  id: string;
  japanese: string;
  reading: string;
  english: string;
  source: string;
  level: JLPTLevel;
}

/** Find a Japanese voice for SpeechSynthesis. */
export function findJapaneseVoice(): SpeechSynthesisVoice | null {
  if (typeof speechSynthesis === "undefined") return null;
  const voices = speechSynthesis.getVoices();
  return voices.find((v) => v.lang.startsWith("ja")) ?? null;
}

/** Speak Japanese text using browser TTS. */
export function speakJapanese(text: string, rate = 1): boolean {
  if (typeof speechSynthesis === "undefined") return false;
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  const voice = findJapaneseVoice();
  if (voice) utterance.voice = voice;
  utterance.lang = "ja-JP";
  utterance.rate = rate;
  speechSynthesis.speak(utterance);
  return true;
}

/** Build listening items from existing content for a level. */
export function getListeningItemsByLevel(level: JLPTLevel, max = 30): ListeningItem[] {
  const items: ListeningItem[] = [];

  // From vocab sentences
  for (const v of allVocab) {
    if (v.jlpt !== level || !v.sentences?.length) continue;
    const s = v.sentences[0];
    if (s.ja && s.en) {
      items.push({ id: `listen-v-${v.id}`, japanese: s.ja, reading: s.reading || "", english: s.en, source: `vocab: ${v.word}`, level });
    }
  }

  // From grammar examples
  for (const g of allGrammar) {
    if (g.jlpt !== level || !g.examples?.length) continue;
    const ex = g.examples[0];
    if (ex.ja && ex.en) {
      items.push({ id: `listen-g-${g.id}`, japanese: ex.ja, reading: ex.reading || "", english: ex.en, source: `grammar: ${g.title}`, level });
    }
  }

  // From reading sentences
  for (const r of allReadings) {
    if (r.jlpt !== level) continue;
    for (const s of r.sentences.slice(0, 3)) {
      items.push({ id: `listen-r-${r.id}-${items.length}`, japanese: s.japanese, reading: s.reading || "", english: s.english, source: `reading: ${r.title}`, level });
    }
  }

  return items.sort(() => Math.random() - 0.5).slice(0, max);
}

// ── Listening progress storage ──────────────────────────────────────────────

const LISTENING_KEY = "bengo_listening_progress";

export interface ListeningProgress {
  totalPracticed: number;
  correctMeaning: number;
  totalMeaning: number;
  lastPracticedAt?: string;
}

function loadListeningProgress(): ListeningProgress {
  try { return JSON.parse(localStorage.getItem(LISTENING_KEY) || '{"totalPracticed":0,"correctMeaning":0,"totalMeaning":0}'); }
  catch { return { totalPracticed: 0, correctMeaning: 0, totalMeaning: 0 }; }
}

export function getListeningProgress(): ListeningProgress {
  return loadListeningProgress();
}

export function recordListeningPractice(correct?: boolean) {
  const p = loadListeningProgress();
  p.totalPracticed++;
  if (correct !== undefined) {
    p.totalMeaning++;
    if (correct) p.correctMeaning++;
  }
  p.lastPracticedAt = new Date().toISOString();
  localStorage.setItem(LISTENING_KEY, JSON.stringify(p));
}
