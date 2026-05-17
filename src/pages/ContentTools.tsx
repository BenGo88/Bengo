import { useState } from "react";
import { validateContent } from "../lib/contentValidation";
import { getContentCounts, allKanji, allVocab, allGrammar } from "../lib/content";
import { getLexiconCounts } from "../lib/lexicon";

type ContentType = "kanji" | "vocab" | "grammar";

export default function ContentTools() {
  const [input, setInput] = useState("");
  const [contentType, setContentType] = useState<ContentType>("grammar");
  const [level, setLevel] = useState("N5");
  const [result, setResult] = useState<{ errors: string[]; warnings: string[]; parsed: number } | null>(null);
  const [copied, setCopied] = useState(false);

  const counts = getContentCounts();
  const issues = validateContent();
  const errors = issues.filter((i) => i.level === "error");
  const warns = issues.filter((i) => i.level === "warn");

  function handleValidate() {
    setCopied(false);
    try {
      const data = JSON.parse(input);
      if (!Array.isArray(data)) {
        setResult({ errors: ["Input must be a JSON array."], warnings: [], parsed: 0 });
        return;
      }

      const errs: string[] = [];
      const wrns: string[] = [];
      const ids = new Set<string>();

      for (let i = 0; i < data.length; i++) {
        const item = data[i];
        const prefix = `[${i}]`;

        if (!item.id) errs.push(`${prefix} Missing id`);
        else if (ids.has(item.id)) errs.push(`${prefix} Duplicate id: ${item.id}`);
        else ids.add(item.id);

        if (!item.jlpt) errs.push(`${prefix} Missing jlpt`);
        else if (!["N5","N4","N3","N2","N1"].includes(item.jlpt)) errs.push(`${prefix} Invalid jlpt: ${item.jlpt}`);

        if (contentType === "kanji") {
          if (!item.character) errs.push(`${prefix} Missing character`);
          if (!item.meanings?.length) errs.push(`${prefix} Missing meanings`);
          if (!item.onyomi?.length && !item.kunyomi?.length) wrns.push(`${prefix} No readings`);
        } else if (contentType === "vocab") {
          if (!item.word) errs.push(`${prefix} Missing word`);
          if (!item.reading) errs.push(`${prefix} Missing reading`);
          if (!item.meanings?.length) errs.push(`${prefix} Missing meanings`);
          for (let j = 0; j < (item.sentences?.length ?? 0); j++) {
            const s = item.sentences[j];
            if (!s.ja) errs.push(`${prefix} sentences[${j}] missing ja`);
            if (!s.en) errs.push(`${prefix} sentences[${j}] missing en`);
            if (!s.tokens?.length && !s.breakdown?.length) wrns.push(`${prefix} sentences[${j}] no tokens`);
          }
        } else {
          if (!item.title) errs.push(`${prefix} Missing title`);
          if (!item.meaning_short) errs.push(`${prefix} Missing meaning_short`);
          if (!item.simple_explanation) wrns.push(`${prefix} Missing simple_explanation`);
          for (let j = 0; j < (item.examples?.length ?? 0); j++) {
            const ex = item.examples[j];
            if (!ex.ja) errs.push(`${prefix} examples[${j}] missing ja`);
            if (!ex.en) errs.push(`${prefix} examples[${j}] missing en`);
            if (!ex.tokens?.length && !ex.breakdown?.length) wrns.push(`${prefix} examples[${j}] no tokens`);
          }
        }
      }

      setResult({ errors: errs, warnings: wrns, parsed: data.length });
    } catch (e: any) {
      setResult({ errors: [`JSON parse error: ${e.message}`], warnings: [], parsed: 0 });
    }
  }

  function handleCopy() {
    try {
      const data = JSON.parse(input);
      navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <header>
        <p className="label mb-1">Content Tools</p>
        <h1 className="font-display text-2xl font-bold text-ink-50">Content Validator</h1>
        <p className="text-sm text-ink-400 mt-1">Paste JSON, validate, then commit to the repo.</p>
      </header>

      {/* Content health */}
      <div className="card p-5">
        <h2 className="label mb-3">Current Content Health</h2>
        <div className="grid grid-cols-3 gap-3 text-center mb-3">
          <div><p className="text-xl font-bold text-ink-200">{counts.kanji}</p><p className="text-xs text-ink-500">Kanji</p></div>
          <div><p className="text-xl font-bold text-ink-200">{counts.vocab}</p><p className="text-xs text-ink-500">Vocab</p></div>
          <div><p className="text-xl font-bold text-ink-200">{counts.grammar}</p><p className="text-xs text-ink-500">Grammar</p></div>
        </div>
        <div className="flex gap-4 text-xs">
          <span className={errors.length > 0 ? "text-vermillion-400" : "text-jade-400"}>
            {errors.length} errors
          </span>
          <span className="text-yellow-500">{warns.length} warnings</span>
        </div>
      </div>

      {/* Input area */}
      <div className="space-y-3">
        <div className="flex gap-2">
          {(["grammar", "vocab", "kanji"] as ContentType[]).map((t) => (
            <button key={t} onClick={() => setContentType(t)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold ${contentType === t ? "bg-vermillion-500 text-white" : "bg-ink-800 text-ink-400 hover:bg-ink-700"}`}>
              {t}
            </button>
          ))}
          <span className="text-xs text-ink-500 self-center ml-2">Level: </span>
          {["N5","N4","N3","N2","N1"].map((l) => (
            <button key={l} onClick={() => setLevel(l)}
              className={`px-2 py-1 rounded text-xs font-semibold ${level === l ? "bg-ink-700 text-ink-200" : "text-ink-500 hover:text-ink-300"}`}>
              {l}
            </button>
          ))}
        </div>

        <textarea
          className="field-input h-64 font-mono text-xs"
          placeholder={`Paste ${contentType} JSON array here...`}
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />

        <div className="flex gap-3">
          <button className="btn-primary" onClick={handleValidate} disabled={!input.trim()}>
            Validate
          </button>
          <button className="btn-secondary" onClick={handleCopy} disabled={!input.trim()}>
            {copied ? "✓ Copied" : "Copy Formatted"}
          </button>
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="card p-5 space-y-3 animate-fade-in">
          <h2 className="label">Validation Result</h2>
          <p className="text-sm text-ink-200">Parsed {result.parsed} items</p>

          {result.errors.length === 0 && result.warnings.length === 0 && (
            <p className="text-sm text-jade-400 font-semibold">✅ All checks passed!</p>
          )}

          {result.errors.length > 0 && (
            <div>
              <p className="text-xs text-vermillion-400 font-semibold mb-1">Errors ({result.errors.length}):</p>
              <div className="max-h-40 overflow-y-auto space-y-0.5">
                {result.errors.map((e, i) => <p key={i} className="text-xs text-ink-400 font-mono">{e}</p>)}
              </div>
            </div>
          )}

          {result.warnings.length > 0 && (
            <div>
              <p className="text-xs text-yellow-500 font-semibold mb-1">Warnings ({result.warnings.length}):</p>
              <div className="max-h-40 overflow-y-auto space-y-0.5">
                {result.warnings.map((w, i) => <p key={i} className="text-xs text-ink-500 font-mono">{w}</p>)}
              </div>
            </div>
          )}

          <p className="text-xs text-ink-600 mt-2">
            Place validated JSON in: <code className="bg-ink-800 px-1 rounded">src/data/{contentType}/{level.toLowerCase()}.json</code>
          </p>
        </div>
      )}
    </div>
  );
}
