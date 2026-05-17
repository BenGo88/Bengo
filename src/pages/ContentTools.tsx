import { useState, useMemo } from "react";
import { validateContent } from "../lib/contentValidation";
import { getContentCounts, allKanji, allVocab, allGrammar } from "../lib/content";
import { getLexiconCounts, allLexicon, findLexiconByText } from "../lib/lexicon";
import type { JLPTLevel } from "../lib/types";

type ContentType = "kanji" | "vocab" | "grammar" | "lexicon";
const LEVELS: JLPTLevel[] = ["N5", "N4", "N3", "N2", "N1"];
const TARGETS: Record<string, { k: number; v: number; g: number }> = {
  N5: { k: 80, v: 250, g: 50 }, N4: { k: 120, v: 300, g: 60 }, N3: { k: 300, v: 1000, g: 150 },
  N2: { k: 1000, v: 6000, g: 200 }, N1: { k: 2000, v: 10000, g: 300 },
};

/** Infer contentStatus from item data */
function inferStatus(item: any, type: string): string {
  if (item.contentStatus) return item.contentStatus;
  if (type === "grammar") {
    const hasTokens = item.examples?.some((e: any) => e.tokens?.length > 0);
    const hasStructure = item.examples?.some((e: any) => e.structure);
    const hasUnit = !!item.unit;
    if (hasTokens && hasStructure && hasUnit && item.simple_explanation && item.prerequisites) return "lesson_ready";
    if (item.examples?.length > 0 && item.explanation) return "study_ready";
    return "base";
  }
  if (type === "vocab") {
    const hasTokens = item.sentences?.some((s: any) => s.tokens?.length > 0);
    if (hasTokens && item.simple_usage && item.unit) return "lesson_ready";
    if (item.sentences?.length > 0 && item.reading) return "study_ready";
    return "base";
  }
  if (type === "kanji") {
    if (item.mnemonic && item.beginner_hint && item.common_words?.length > 0 && item.unit) return "lesson_ready";
    if (item.common_words?.length > 0) return "study_ready";
    return "base";
  }
  return "base";
}

export default function ContentTools() {
  const [input, setInput] = useState("");
  const [contentType, setContentType] = useState<ContentType>("grammar");
  const [level, setLevel] = useState("N5");
  const [result, setResult] = useState<{ errors: string[]; warnings: string[]; parsed: number } | null>(null);
  const [copied, setCopied] = useState(false);

  const counts = getContentCounts();
  const lexCounts = getLexiconCounts();
  const issues = validateContent();
  const errors = issues.filter((i) => i.level === "error");
  const warns = issues.filter((i) => i.level === "warn");

  // Per-level detailed stats
  const levelStats = useMemo(() => {
    return LEVELS.map((lvl) => {
      const lc = getContentCounts(lvl);
      const t = TARGETS[lvl];
      const gItems = allGrammar.filter((g) => g.jlpt === lvl);
      const vItems = allVocab.filter((v) => v.jlpt === lvl);
      const kItems = allKanji.filter((k) => k.jlpt === lvl);

      // Status counts
      const statuses = { base: 0, study_ready: 0, lesson_ready: 0, needs_review: 0 };
      gItems.forEach((g) => { statuses[inferStatus(g, "grammar") as keyof typeof statuses]++; });
      vItems.forEach((v) => { statuses[inferStatus(v, "vocab") as keyof typeof statuses]++; });
      kItems.forEach((k) => { statuses[inferStatus(k, "kanji") as keyof typeof statuses]++; });

      // Token coverage (grammar examples)
      let gExTotal = 0, gExTokens = 0;
      gItems.forEach((g) => g.examples?.forEach((ex: any) => { gExTotal++; if (ex.tokens?.length) gExTokens++; }));
      const tokenPct = gExTotal > 0 ? Math.round((gExTokens / gExTotal) * 100) : 0;

      // Vocab token coverage (first example)
      const vTokTotal = vItems.filter((v) => v.sentences?.length > 0).length;
      const vTokHas = vItems.filter((v) => v.sentences?.some((s: any) => s.tokens?.length > 0)).length;
      const vTokPct = vTokTotal > 0 ? Math.round((vTokHas / vTokTotal) * 100) : 0;

      // Lexicon coverage (vocab with matching lexicon)
      const vLexHas = vItems.filter((v) => findLexiconByText(v.word).length > 0).length;
      const lexPct = vItems.length > 0 ? Math.round((vLexHas / vItems.length) * 100) : 0;

      // Unit coverage
      const gUnitPct = gItems.length > 0 ? Math.round((gItems.filter((g) => g.unit).length / gItems.length) * 100) : 0;
      const vUnitPct = vItems.length > 0 ? Math.round((vItems.filter((v: any) => v.unit).length / vItems.length) * 100) : 0;

      // Quantity %
      const qtyPct = Math.min(100, Math.round(((lc.kanji / t.k + lc.vocab / t.v + lc.grammar / t.g) / 3) * 100));

      // Readiness
      const readiness = Math.round(qtyPct * 0.3 + tokenPct * 0.2 + vTokPct * 0.1 + lexPct * 0.1 + gUnitPct * 0.15 + vUnitPct * 0.15);

      return { lvl, lc, statuses, tokenPct, vTokPct, lexPct, gUnitPct, vUnitPct, qtyPct, readiness };
    });
  }, []);

  // Next available ID
  const nextId = useMemo(() => {
    const prefix = contentType === "kanji" ? "k" : contentType === "vocab" ? "v" : contentType === "grammar" ? "g" : "lex";
    const lvlKey = level.toLowerCase();
    let maxNum = 0;
    const pool = contentType === "kanji" ? allKanji : contentType === "vocab" ? allVocab : contentType === "grammar" ? allGrammar : allLexicon;
    const pattern = new RegExp(`^${prefix}-?${lvlKey}-?(\\d+)`);
    for (const item of pool as any[]) {
      if (item.jlpt === level) {
        const m = item.id.match(pattern);
        if (m) maxNum = Math.max(maxNum, parseInt(m[1]));
        // Also check legacy IDs like "g001"
        const m2 = item.id.match(new RegExp(`^${prefix}(\\d+)$`));
        if (m2) maxNum = Math.max(maxNum, parseInt(m2[1]));
      }
    }
    return `${prefix}-${lvlKey}-${String(maxNum + 1).padStart(3, "0")}`;
  }, [contentType, level]);

  function handleValidate() {
    setCopied(false);
    try {
      const data = JSON.parse(input);
      if (!Array.isArray(data)) { setResult({ errors: ["Input must be a JSON array."], warnings: [], parsed: 0 }); return; }
      const errs: string[] = [], wrns: string[] = [];
      const ids = new Set<string>();
      for (let i = 0; i < data.length; i++) {
        const item = data[i]; const p = `[${i}]`;
        if (!item.id) errs.push(`${p} Missing id`);
        else if (ids.has(item.id)) errs.push(`${p} Duplicate id: ${item.id}`);
        else ids.add(item.id);
        if (!item.jlpt) errs.push(`${p} Missing jlpt`);
        if (contentType === "kanji") {
          if (!item.character) errs.push(`${p} Missing character`);
          if (!item.meanings?.length) errs.push(`${p} Missing meanings`);
        } else if (contentType === "vocab") {
          if (!item.word) errs.push(`${p} Missing word`);
          if (!item.reading) errs.push(`${p} Missing reading`);
          if (!item.meanings?.length) errs.push(`${p} Missing meanings`);
          if (!item.sentences?.length) wrns.push(`${p} No examples`);
        } else if (contentType === "grammar") {
          if (!item.title) errs.push(`${p} Missing title`);
          if (!item.meaning_short) errs.push(`${p} Missing meaning_short`);
          if (!item.simple_explanation) wrns.push(`${p} Missing simple_explanation`);
          for (let j = 0; j < (item.examples?.length ?? 0); j++) {
            if (!item.examples[j].tokens?.length) wrns.push(`${p} examples[${j}] no tokens`);
          }
        } else {
          if (!item.text) errs.push(`${p} Missing text`);
          if (!item.reading) errs.push(`${p} Missing reading`);
          if (!item.meanings?.length) errs.push(`${p} Missing meanings`);
        }
        const status = inferStatus(item, contentType);
        if (status === "base") wrns.push(`${p} Inferred status: base (add more data for study_ready)`);
      }
      setResult({ errors: errs, warnings: wrns, parsed: data.length });
    } catch (e: any) { setResult({ errors: [`JSON parse error: ${e.message}`], warnings: [], parsed: 0 }); }
  }

  function handleCopy() {
    try { const d = JSON.parse(input); navigator.clipboard.writeText(JSON.stringify(d, null, 2)); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <header>
        <p className="label mb-1">Content Factory</p>
        <h1 className="font-display text-2xl font-bold text-ink-50">Content Tools</h1>
        <p className="text-sm text-ink-400 mt-1">Validate, expand, and track content quality.</p>
      </header>

      {/* ── Content Health Dashboard ── */}
      <div className="card p-5">
        <h2 className="label mb-3">Content Health</h2>
        <div className="grid grid-cols-4 gap-3 text-center mb-4">
          <div><p className="text-xl font-bold text-ink-200">{counts.kanji}</p><p className="text-xs text-ink-500">Kanji</p></div>
          <div><p className="text-xl font-bold text-ink-200">{counts.vocab}</p><p className="text-xs text-ink-500">Vocab</p></div>
          <div><p className="text-xl font-bold text-ink-200">{counts.grammar}</p><p className="text-xs text-ink-500">Grammar</p></div>
          <div><p className="text-xl font-bold text-jade-400">{lexCounts.total}</p><p className="text-xs text-ink-500">Lexicon</p></div>
        </div>
        <div className="flex gap-4 text-xs mb-3">
          <span className={errors.length > 0 ? "text-vermillion-400" : "text-jade-400"}>{errors.length} errors</span>
          <span className="text-yellow-500">{warns.length} warnings</span>
        </div>
      </div>

      {/* ── Content Readiness by Level ── */}
      <div className="card p-5">
        <h2 className="label mb-3">Content Readiness <span className="text-ink-600 font-normal">(not learner readiness)</span></h2>
        <div className="space-y-3">
          {levelStats.map((s) => (
            <div key={s.lvl} className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-6 text-xs font-bold text-ink-300">{s.lvl}</span>
                <div className="flex-1 h-2 rounded-full bg-ink-800 overflow-hidden">
                  <div className={`h-full rounded-full ${s.readiness >= 50 ? "bg-jade-500" : s.readiness >= 25 ? "bg-yellow-500" : "bg-ink-700"}`} style={{ width: `${s.readiness}%` }} />
                </div>
                <span className={`text-xs font-bold w-10 text-right ${s.readiness >= 50 ? "text-jade-400" : s.readiness >= 25 ? "text-yellow-500" : "text-ink-500"}`}>{s.readiness}%</span>
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-ink-600 pl-8">
                <span>{s.lc.kanji}k/{TARGETS[s.lvl].k} {s.lc.vocab}v/{TARGETS[s.lvl].v} {s.lc.grammar}g/{TARGETS[s.lvl].g}</span>
                <span>gTok:{s.tokenPct}%</span>
                <span>vTok:{s.vTokPct}%</span>
                <span>lex:{s.lexPct}%</span>
                <span>gUnit:{s.gUnitPct}%</span>
                <span>vUnit:{s.vUnitPct}%</span>
              </div>
              <div className="flex gap-2 text-[10px] pl-8">
                <span className="text-jade-500">✓{s.statuses.lesson_ready}</span>
                <span className="text-yellow-500">◉{s.statuses.study_ready}</span>
                <span className="text-ink-500">○{s.statuses.base}</span>
              </div>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-ink-600 mt-3">Targets are internal aspirational goals, not official JLPT lists. ✓=lesson_ready ◉=study_ready ○=base</p>
      </div>

      {/* ── Batch Validator ── */}
      <div className="card p-5 space-y-3">
        <h2 className="label">Batch Import / Validator</h2>
        <div className="flex gap-2 flex-wrap">
          {(["grammar", "vocab", "kanji", "lexicon"] as ContentType[]).map((t) => (
            <button key={t} onClick={() => setContentType(t)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold ${contentType === t ? "bg-vermillion-500 text-white" : "bg-ink-800 text-ink-400 hover:bg-ink-700"}`}>{t}</button>
          ))}
          <span className="text-xs text-ink-500 self-center ml-2">Level:</span>
          {LEVELS.map((l) => (
            <button key={l} onClick={() => setLevel(l)}
              className={`px-2 py-1 rounded text-xs font-semibold ${level === l ? "bg-ink-700 text-ink-200" : "text-ink-500 hover:text-ink-300"}`}>{l}</button>
          ))}
        </div>

        {/* ID helper */}
        <div className="bg-ink-800/50 rounded-lg px-3 py-2 flex items-center gap-2">
          <span className="text-xs text-ink-500">Next ID:</span>
          <code className="text-xs text-jade-400 font-mono">{nextId}</code>
        </div>

        <textarea className="field-input h-48 font-mono text-xs" placeholder={`Paste ${contentType} JSON array here...`} value={input} onChange={(e) => setInput(e.target.value)} />
        <div className="flex gap-3">
          <button className="btn-primary" onClick={handleValidate} disabled={!input.trim()}>Validate</button>
          <button className="btn-secondary" onClick={handleCopy} disabled={!input.trim()}>{copied ? "✓ Copied" : "Copy Formatted"}</button>
        </div>

        {result && (
          <div className="space-y-2 animate-fade-in">
            <p className="text-sm text-ink-200">Parsed {result.parsed} items</p>
            {result.errors.length === 0 && result.warnings.length === 0 && <p className="text-sm text-jade-400 font-semibold">✅ All checks passed!</p>}
            {result.errors.length > 0 && <div><p className="text-xs text-vermillion-400 font-semibold mb-1">Errors ({result.errors.length}):</p><div className="max-h-32 overflow-y-auto space-y-0.5">{result.errors.map((e, i) => <p key={i} className="text-xs text-ink-400 font-mono">{e}</p>)}</div></div>}
            {result.warnings.length > 0 && <div><p className="text-xs text-yellow-500 font-semibold mb-1">Warnings ({result.warnings.length}):</p><div className="max-h-32 overflow-y-auto space-y-0.5">{result.warnings.map((w, i) => <p key={i} className="text-xs text-ink-500 font-mono">{w}</p>)}</div></div>}
            <p className="text-[10px] text-ink-600">Place validated JSON in: <code className="bg-ink-800 px-1 rounded">src/data/{contentType}/{level.toLowerCase()}.json</code></p>
          </div>
        )}
      </div>

      {/* ── Upgrade Checklist ── */}
      <div className="card p-5">
        <h2 className="label mb-2">Upgrade Checklist</h2>
        <div className="grid md:grid-cols-2 gap-4 text-xs text-ink-400">
          <div>
            <p className="text-ink-300 font-semibold mb-1">base → study_ready</p>
            <p>• Add example sentence</p><p>• Add reading</p><p>• Add simple_usage</p><p>• Add quiz support</p>
          </div>
          <div>
            <p className="text-ink-300 font-semibold mb-1">study_ready → lesson_ready</p>
            <p>• Add sentence tokens</p><p>• Add sentence structure</p><p>• Add common mistakes</p><p>• Add similar items</p><p>• Add prerequisites</p><p>• Add curriculum unit/order</p>
          </div>
        </div>
      </div>

      {/* ── Workflow ── */}
      <div className="card p-5">
        <h2 className="label mb-2">Content Pack Workflow</h2>
        <ol className="text-xs text-ink-400 space-y-1 list-decimal list-inside">
          <li>Generate or write batch JSON</li>
          <li>Paste into validator above</li>
          <li>Fix errors and warnings</li>
          <li>Copy formatted JSON</li>
          <li>Replace/merge into <code className="bg-ink-800 px-1 rounded">src/data/{'{type}'}/{'{level}'}.json</code></li>
          <li>Commit to GitHub → auto-deploys</li>
        </ol>
      </div>
    </div>
  );
}
