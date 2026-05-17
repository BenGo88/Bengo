/**
 * contentValidation.ts — development-time content quality checks.
 * Call validateContent() on app startup in dev mode.
 */

import { allKanji, allVocab, allGrammar } from "./content";

interface ValidationIssue {
  level: "error" | "warn";
  item: string;
  message: string;
}

export function validateContent(): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const ids = new Set<string>();

  // Check kanji
  for (const k of allKanji) {
    if (ids.has(k.id)) issues.push({ level: "error", item: k.id, message: "Duplicate ID" });
    ids.add(k.id);
    if (!k.character) issues.push({ level: "error", item: k.id, message: "Missing character" });
    if (!k.meanings?.length) issues.push({ level: "error", item: k.id, message: "Missing meanings" });
    if (!["N5","N4","N3","N2","N1"].includes(k.jlpt)) issues.push({ level: "error", item: k.id, message: `Invalid JLPT: ${k.jlpt}` });
  }

  // Check vocab
  for (const v of allVocab) {
    if (ids.has(v.id)) issues.push({ level: "error", item: v.id, message: "Duplicate ID" });
    ids.add(v.id);
    if (!v.word) issues.push({ level: "error", item: v.id, message: "Missing word" });
    if (!v.reading) issues.push({ level: "error", item: v.id, message: "Missing reading" });
    if (!v.meanings?.length) issues.push({ level: "error", item: v.id, message: "Missing meanings" });
    for (let i = 0; i < (v.sentences?.length ?? 0); i++) {
      const s = v.sentences[i];
      if (!s.ja) issues.push({ level: "error", item: `${v.id} ex[${i}]`, message: "Missing japanese" });
      if (!s.en) issues.push({ level: "error", item: `${v.id} ex[${i}]`, message: "Missing english" });
      if (!s.tokens?.length && !s.breakdown?.length) {
        issues.push({ level: "warn", item: `${v.id} ex[${i}]`, message: "No tokens/breakdown" });
      }
    }
  }

  // Check grammar
  for (const g of allGrammar) {
    if (ids.has(g.id)) issues.push({ level: "error", item: g.id, message: "Duplicate ID" });
    ids.add(g.id);
    if (!g.title) issues.push({ level: "error", item: g.id, message: "Missing title" });
    if (!g.meaning_short) issues.push({ level: "error", item: g.id, message: "Missing meaning_short" });
    if (!g.simple_explanation) issues.push({ level: "warn", item: g.id, message: "Missing simple_explanation" });
    for (let i = 0; i < (g.examples?.length ?? 0); i++) {
      const ex = g.examples[i];
      if (!ex.ja) issues.push({ level: "error", item: `${g.id} ex[${i}]`, message: "Missing japanese" });
      if (!ex.en) issues.push({ level: "error", item: `${g.id} ex[${i}]`, message: "Missing english" });
      if (!ex.tokens?.length && !ex.breakdown?.length) {
        issues.push({ level: "warn", item: `${g.id} ex[${i}]`, message: "No tokens/breakdown" });
      }
    }
  }

  return issues;
}

/** Log validation issues to console in development. */
export function logContentIssues() {
  const issues = validateContent();
  if (issues.length === 0) {
    console.log("✅ Content validation passed — no issues found.");
    return;
  }
  const errors = issues.filter((i) => i.level === "error");
  const warns = issues.filter((i) => i.level === "warn");
  if (errors.length > 0) {
    console.error(`❌ Content errors (${errors.length}):`);
    errors.forEach((e) => console.error(`  ${e.item}: ${e.message}`));
  }
  if (warns.length > 0) {
    console.warn(`⚠️ Content warnings (${warns.length}):`);
    warns.forEach((w) => console.warn(`  ${w.item}: ${w.message}`));
  }
}
