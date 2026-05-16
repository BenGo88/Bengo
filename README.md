# Bengo 勉語

Personal Japanese study app for JLPT N2/N1 preparation.  
Zero backend. Hosted free on GitHub Pages. Auto-deploys on every push.

## Quick Setup (5 minutes, no coding tools needed)

### 1. Create the GitHub repo

- Go to https://github.com/new
- Name it **bengo**
- Set it to **Public** (required for free GitHub Pages)
- Click **Create repository**

### 2. Upload this code

On the repo page, click **"uploading an existing file"** and drag in all the
files from this folder. Commit to the `main` branch.

Or if you have `git` installed:
```bash
cd bengo
git init
git add .
git commit -m "v0.1 — foundation"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/bengo.git
git push -u origin main
```

### 3. Enable GitHub Pages

- Go to your repo → **Settings** → **Pages** (left sidebar)
- Under **Source**, select **GitHub Actions**
- That's it. The workflow will run automatically.

### 4. Wait ~2 minutes, then visit your app

```
https://YOUR_USERNAME.github.io/bengo/
```

The GitHub Actions workflow builds and deploys automatically on every push.

---

## How It Works

| What | Where |
|------|-------|
| Study content (kanji, vocab, grammar) | JSON files in `src/data/` |
| Your progress, SRS state, settings | Your browser's localStorage |
| Hosting | GitHub Pages (free) |
| Build & deploy | GitHub Actions (automatic on push) |

**No backend. No database server. No monthly costs.**

---

## Adding Content

Edit the JSON files in `src/data/`:
- `kanji.json` — kanji with meanings, readings, mnemonics, example words
- `vocab.json` — vocabulary with sentences, nuance notes, collocations
- `grammar.json` — grammar points with explanations, examples, comparisons

Push to `main` → the site rebuilds automatically in ~2 minutes.

---

## Backing Up Progress

Your study progress lives in your browser's localStorage.
Go to **Settings → Export Backup** to download a JSON file.
Use **Import Backup** to restore it on another device/browser.

---

## Local Development (optional)

Only needed if you want to preview changes locally before pushing.

```bash
npm install
npm run dev
```

Open http://localhost:5173

---

## Architecture

```
bengo/
├── .github/workflows/deploy.yml   ← auto-deploy to GitHub Pages
├── src/
│   ├── data/                      ← study content (JSON)
│   │   ├── kanji.json
│   │   ├── vocab.json
│   │   └── grammar.json
│   ├── lib/                       ← core logic
│   │   ├── content.ts             ← loads/queries content data
│   │   ├── storage.ts             ← localStorage persistence + SRS engine
│   │   └── types.ts               ← TypeScript types
│   ├── components/
│   │   └── Layout.tsx             ← app shell (sidebar + nav)
│   ├── pages/
│   │   ├── Dashboard.tsx          ← main study hub
│   │   └── Settings.tsx           ← preferences + data management
│   ├── main.tsx                   ← entry point + routing
│   └── index.css                  ← Tailwind + custom styles
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```
