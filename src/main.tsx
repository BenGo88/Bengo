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
import Reviews from "./pages/Reviews";
import Quiz from "./pages/Quiz";
import WeakPoints from "./pages/WeakPoints";
import StudyPath from "./pages/StudyPath";
import Placement from "./pages/Placement";
import ContentTools from "./pages/ContentTools";
import Curriculum from "./pages/Curriculum";
import Sources from "./pages/Sources";
import ReadingLibrary from "./pages/ReadingLibrary";
import ReadingDetail from "./pages/ReadingDetail";
import TestHistory from "./pages/TestHistory";
import "./index.css";

if (import.meta.env.DEV) {
  import("./lib/contentValidation").then((m) => m.logContentIssues());
}

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
          <Route path="/reviews" element={<Reviews />} />
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/weak-points" element={<WeakPoints />} />
          <Route path="/study-path" element={<StudyPath />} />
          <Route path="/placement" element={<Placement />} />
          <Route path="/content-tools" element={<ContentTools />} />
          <Route path="/curriculum/:level" element={<Curriculum />} />
          <Route path="/reading" element={<ReadingLibrary />} />
          <Route path="/reading/:id" element={<ReadingDetail />} />
          <Route path="/test-history" element={<TestHistory />} />
          <Route path="/sources" element={<Sources />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </HashRouter>
  </React.StrictMode>,
);
