import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import Lessons from "./pages/Lessons";
import LessonSession from "./pages/LessonSession";
import KanjiList from "./pages/KanjiList";
import KanjiDetail from "./pages/KanjiDetail";
import VocabList from "./pages/VocabList";
import VocabDetail from "./pages/VocabDetail";
import GrammarList from "./pages/GrammarList";
import GrammarDetail from "./pages/GrammarDetail";
import ComingSoon from "./pages/ComingSoon";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/lessons" element={<Lessons />} />
          <Route path="/lessons/session" element={<LessonSession />} />
          <Route path="/kanji" element={<KanjiList />} />
          <Route path="/kanji/:id" element={<KanjiDetail />} />
          <Route path="/vocab" element={<VocabList />} />
          <Route path="/vocab/:id" element={<VocabDetail />} />
          <Route path="/grammar" element={<GrammarList />} />
          <Route path="/grammar/:id" element={<GrammarDetail />} />
          <Route path="/reviews" element={<ComingSoon title="Reviews" description="SRS review sessions using your study queue. Answer questions on kanji, vocabulary, and grammar you've learned — spaced repetition keeps items fresh." version="v0.4" />} />
          <Route path="/quiz" element={<ComingSoon title="Random Quiz" description="Generate random N2/N1 quizzes by category — kanji, vocabulary, grammar, or mixed. Choose quick (10), normal (25), or long (50) question sets." version="v0.5" />} />
          <Route path="/weak-points" element={<ComingSoon title="Weak Points" description="Items you repeatedly get wrong will appear here. Practice targeted drills on your weakest kanji, vocabulary, and grammar." version="v0.6" />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </HashRouter>
  </React.StrictMode>,
);
