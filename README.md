# CropShield

**Scan a weed. Know what to do. Spray less.**

CropShield is an offline-first weed helper for small farmers. Point your phone at a weed and get its name, a safe next step and a spoken answer in your own language, with no internet and no server.

Built for the **AgriMinds Hackathon 2026**.

[**Try the web app**](https://cropshield-app.github.io/CropShield/) · [**Download the Android app**](https://drive.google.com/drive/folders/1nqlWEnjOw3h4m0OoZrPlSg6fQYkArRvK?usp=share_link)

---

## The problem

- Small farmers often cannot tell weeds apart, so they pick the wrong method and repeat it.
- Whole fields get sprayed "just in case", which costs money and harms health and soil.
- Most farming apps need internet and speak only English.
- Unpredictable weather makes it hard to choose the right day to weed or spray.
- Weeding by hand needs workers, and they are hard to find in time.

## What CropShield does

- **Identifies the weed.** Scan a photo or video, or use the live camera. In our test of 5 weeds, accuracy was **98%**.
- **Works offline.** The AI model runs on the phone itself.
- **Speaks your language.** English, Telugu, Hindi and Bengali. Results are read aloud.
- **Sprays only where needed.** A field map lets you mark weedy squares and treat only those. Gentler methods (pull, mulch, dig) are suggested first.
- **Tracks weather and farm data.** Saved weather forecast, GPS land area, soil, water source, crop stage, notes and a weed history chart.
- **Finds manual labour.** A job board with search and filters. Share jobs by SMS, QR code or code.
- **Asks and answers.** An offline helper with voice search.

CropShield guides where and when. The farmer decides, and always follows the product label.

## How it works

Everything runs on the phone. There is no backend server.

| Layer | What it does |
| --- | --- |
| Front end | Scan, Ask helper, My farm, Jobs, Languages |
| On the phone | AI model, weed facts, local database, voice, ask logic |
| Only when online, or done once | Weather update, voice input, model training |

## Built with

- React and Vite
- TensorFlow.js with a MobileNet model, trained in Google Colab
- Progressive Web App (works offline once loaded)
- Capacitor for the Android app

## Run it on your laptop

1. Install Node.js (LTS) from [nodejs.org](https://nodejs.org).
2. Open this folder in VS Code and open the terminal.
3. Run `npm install` (needs internet, once).
4. Run `npm run dev` and open <http://localhost:5173>.

### Test that it works offline

1. Run `npm run build`, then `npm run preview`, and open the link.
2. Press F12, go to Network, choose **Offline**, and refresh. The app must still open.

## Where files go

| What | Where |
| --- | --- |
| Model files (`model.json`, `.bin`, `labels.json`) | `public/model/` |
| Weed advice | `src/data/weeds.json` |
| Language files (one per language, listed in `languages.json`) | `src/i18n/` |
| Offline voice models (optional) | `public/voice/`, listed in `src/voiceModels.js` |
| Helper scripts | `scripts/` |
| Photos | `raw_photos/`, `organised_photos/` |

## Build the Android app (APK)

```bash
npm run build
npx cap add android
npx cap sync
npx cap open android
```

Then in Android Studio choose **Build > Build APK**.

## Limitations

- Only 5 weeds are recognised so far.
- The 98% figure comes from our own test of those 5 weeds, not a field trial.
- Advice and translations are drafts and still need expert review.
- Herbicide savings have not yet been measured in real fields.
- The Android app is Android only. iPhone users use the web version.

## What's next

1. Expert review of advice and translations.
2. Pilot with agricultural universities and farmer groups.
3. Measure herbicide use before and after.
4. More weeds, then pests and diseases.

Adding a new language takes one file. Adding a new weed takes photos and one row of advice.

## Team

| Name | Contribution |
| --- | --- |
| **Kaminedi Vignitha Anagha** (Team Lead) | Combined the team's work into one app. AI model (Colab notebook, MobileNet, TensorFlow.js). React + Vite app, scan logic and offline use. Android APK build. |
| **Sheik Umerah** | Python training and data analysis. Weed facts sheet and `weeds.json`. Language packs (English, Telugu, Hindi, Bengali). Language scripts and photo sorting. |
| **A Pawani Rao** | Demo video and demo script. Presentation slides. |

## Data

- Weather forecasts come from [Open-Meteo](https://open-meteo.com).
- Weed advice was drafted from agricultural sources and is pending expert review. Always follow the herbicide product label.
