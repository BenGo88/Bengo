Bengo 勉語
Personal Japanese study app — Foundation to N1.
Live: https://bengo88.github.io/Bengo/
> **Note:** The JLPT does not publish official current vocabulary/kanji/grammar lists. Bengo uses curated study-level estimates based on common learning resources.
Content Structure
Data files are split by type and JLPT level:
```
src/data/
  grammar/n5.json, n4.json, n3.json, n2.json, n1.json
  vocab/n5.json, n4.json, n3.json, n2.json, n1.json
  kanji/n5.json, n4.json, n3.json, n2.json, n1.json
```
Empty levels use `[]`. Content is loaded via static imports in `src/lib/content.ts`.
ID Convention
Kanji: `k-n5-001`, `k001` (legacy N2)
Vocab: `v-n5-001`, `v001` (legacy N2)
Grammar: `g-n5-001`, `g001` (legacy N2)
Example Sentence Format
```json
{
  "ja": "毎日運動するようにしている。",
  "en": "I try to exercise every day.",
  "reading": "まいにち うんどう する ように している。",
  "structure": "毎日 (time) + 運動する (action) + ようにしている (habitual effort)",
  "tokens": [
    { "text": "毎日", "reading": "まいにち", "meaning": "every day", "partOfSpeech": "adverb", "role": "when" },
    { "text": "運動する", "reading": "うんどうする", "meaning": "to exercise", "partOfSpeech": "suru-verb", "role": "action" },
    { "text": "ようにしている", "reading": "ようにしている", "meaning": "make a habit of", "partOfSpeech": "grammar pattern", "role": "target grammar" }
  ],
  "note": "Common for habits."
}
```
`tokens` is the canonical field. Legacy `breakdown` is still supported. Both use the same `WordBreakdown` type.
Adding Content
Edit the appropriate `src/data/{type}/{level}.json` file
Follow the ID convention
Include `tokens` for interactive sentence features
Commit to `main` — auto-deploys in ~2 minutes
Validation
In dev mode (`npm run dev`), content issues are logged to the browser console automatically.
Deploy
Push to `main` branch → GitHub Actions builds and deploys to Pages automatically.
Local Dev (optional)
```bash
npm install
npm run dev
```