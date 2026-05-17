import { useNavigate } from "react-router-dom";

export default function Sources() {
  const navigate = useNavigate();
  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <header>
        <p className="label mb-1">About</p>
        <h1 className="font-display text-2xl font-bold text-ink-50">Sources & Attribution</h1>
      </header>

      <div className="card p-5 space-y-4">
        <h2 className="label">Content</h2>
        <p className="text-sm text-ink-300 leading-relaxed">
          Bengo uses original curated content written for study purposes. Explanations, example
          sentences, and mnemonics are written from scratch using common Japanese learning knowledge.
        </p>
        <p className="text-sm text-ink-300 leading-relaxed">
          No content is copied from proprietary textbooks (Genki, Minna no Nihongo, Sou Matome,
          Shin Kanzen Master) or paid platforms (WaniKani, Bunpro). These are used only as
          inspiration for feature design.
        </p>
      </div>

      <div className="card p-5 space-y-4">
        <h2 className="label">JLPT Levels</h2>
        <p className="text-sm text-ink-300 leading-relaxed">
          The JLPT (Japanese Language Proficiency Test) does not publish official current
          vocabulary, kanji, or grammar lists. Bengo uses approximate study-level estimates
          based on common learning resources and community knowledge.
        </p>
        <p className="text-sm text-ink-400 text-xs">
          JLPT level labels in this app are for study guidance only and do not represent
          official test content.
        </p>
      </div>

      <div className="card p-5 space-y-4">
        <h2 className="label">Future Attribution</h2>
        <p className="text-sm text-ink-300 leading-relaxed">
          If dictionary data from JMdict/KANJIDIC (Electronic Dictionary Research and Development Group)
          is incorporated in the future, proper attribution will be included as required by their
          license terms.
        </p>
        <p className="text-sm text-ink-300 leading-relaxed">
          If example sentences from Tatoeba are used, attribution and CC-BY license requirements
          will be followed.
        </p>
      </div>

      <div className="card p-5 space-y-4">
        <h2 className="label">Technology</h2>
        <p className="text-sm text-ink-300 leading-relaxed">
          Bengo is a personal study tool built with React, TypeScript, and Tailwind CSS.
          Hosted on GitHub Pages. All progress is stored locally in your browser.
        </p>
      </div>

      <button className="btn-secondary" onClick={() => navigate("/")}>← Dashboard</button>
    </div>
  );
}
