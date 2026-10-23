# FO Mhealth

A private, offline-first mental wellness companion for the web. Mood check-ins, journaling, guided exercises, validated self-report screens, and insight trends, all wrapped in **encrypted local storage with integrity verification**.

Live demo: `https://<your-username>.github.io/fo-mhealth/` (once Pages is enabled)

## Why it exists

FO Mhealth is an **original, open-source rebuild** of the feature set popularized by mental-health apps like MindDoc (whose Android app was studied in a decompiled teardown to map the feature surface). No proprietary code, assets, or copy were reused; everything here was written from scratch. The screening instruments (PHQ-9, GAD-7) are public-domain questionnaires.

## Features

- **Mood check-ins** — 5-point mood, energy and sleep sliders, context tags, notes. Multiple per day.
- **Journaling** — free writing plus 10 rotating guided prompts.
- **Mind gym** — 10 guided exercises: box breathing, 4-7-8, 5-4-3-2-1 grounding, thought record, gratitude, scheduled worry time, body scan, self-compassion, sleep wind-down, morning energy reset. Interactive step-by-step with breath timer.
- **Screenings** — PHQ-9 (depression) and GAD-7 (anxiety), public-domain instruments, with scoring, severity bands, history, and crisis-line signposting on relevant answers.
- **Learn** — five short psychoeducation reads (stress cycle, CBT basics, sleep, behavioral activation, connection).
- **My day** — pick a few practices each morning, check them off, fresh list every day.
- **Trends** — 7-day mood chart, averages, top context tags, recent check-ins.
- **Encrypted vault** — AES-256-GCM over the entire dataset, key derived from your passphrase (PBKDF2-SHA-256, 150,000 rounds). Integrity verification on every unlock; encrypted backups you can export/import; change passphrase; lock on demand. There is no reset: forget the passphrase and the data stays sealed, by design.
- **PWA** — installable, works fully offline via service worker.

## Privacy model

Everything lives in your browser only. No accounts, no servers, no analytics, no sync. The only network request is the app shell itself (cached after first load). Data leaves the device only when *you* export an encrypted backup file.

## Run it

Static site, no build step:

```bash
# any static server, e.g.
python3 -m http.server 8080
# open http://localhost:8080
```

## Deploy (GitHub Pages)

1. Push this repo to GitHub.
2. Settings → Pages → Source: *Deploy from a branch* → `main` → `/ (root)`.
3. Your app is live at `https://<username>.github.io/fo-mhealth/`.

## Tech

Vanilla HTML/CSS/JS, zero dependencies, zero build. Web Crypto for encryption, SVG for charts, localStorage for the encrypted vault. ~35 KB of code total.

## Disclaimer

FO Mhealth supports self-reflection and habit building. It is not a medical device, does not diagnose, and does not replace professional care. If you are in crisis, please use the support lines listed in the app (Settings → Support) or your local emergency number.

MIT licensed. Built for the community, in the open.

## What's new in v2

- **7-day journeys**: structured programs (calmer, sleep reset, focus rebuild) with a progress ring, day-by-day steps and a daily practice.
- **Favorites**: star exercises and lessons; starred ones collect at the top of their lists.
- **Journal search**: filter entries as you type.
- **30-day trends chart** with animated line draw, count-up stats and tag frequency bars.
- **Light and dark themes**, both fully supported, with a one-tap toggle in the header.
- **Motion system**: screen transitions, staggered reveals, check-pop confirmations, a day-complete celebration, and a breathing ring paced to the exercise. All of it respects prefers-reduced-motion.
- **Desktop layout**: at 900px+ the bottom nav becomes a left rail and the content centers in a reading column.
- Design direction and the reason behind every visual decision: see [DESIGN.md](DESIGN.md).
