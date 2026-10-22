# CropShield

Offline-first weed helper for small farmers. Scan a weed, get safe advice in your language,
map your field, track jobs, and speak your questions.

## Run it on your laptop
1. Install Node.js (LTS) from nodejs.org.
2. Open this folder in VS Code. Press Ctrl + ~ to open the terminal.
3. Type `npm install` and press Enter (needs internet, once).
4. Type `npm run dev` and open http://localhost:5173

## Test that it works offline
1. `npm run build`, then `npm run preview`, and open the link.
2. Press F12 > Network > choose "Offline" > refresh. The app must still open.

## Where other people's files go
- Model files (model.json, .bin, labels.json): `public/model/`
- Weed advice: `src/data/weeds.json`
- Language files: `src/i18n/` (one file per language; list them in `languages.json`)
- Offline voice models (optional): `public/voice/`, listed in `src/voiceModels.js`

## What is inside
- Scan page: upload a photo or video, or use the live camera. Offline AI helper with voice search.
- My farm: field map, weather (saved), GPS land area, soil, water, crop stage, weed chart.
- Labor: job board with search and filters, share jobs by SMS, QR or code.
- Languages: searchable list, import a language pack, bigger-text button.

## Read aloud
- Scan results are read aloud (name, advice, methods, caution) in the language the text is written in. A switch turns automatic reading on or off.

## Make an Android app (APK)
See the team plan. In short: `npm run build`, then `npx cap add android`, `npx cap sync`, `npx cap open android`.
