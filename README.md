# FO Mhealth

A private, offline-first mental wellness companion for the web. Mood check-ins, journaling, guided exercises, validated self-report screens, and insight trends, all wrapped in **encrypted local storage with integrity verification**.

Live demo: `https://aicodedecode.github.io/fo-mhealth/`

## Why it exists

FO Mhealth is an **original, open-source rebuild** of the feature set popularized by mental-health apps like MindDoc (whose Android app was studied in a decompiled teardown to map the feature surface) and, later, a survey of UpLife (see `TEARDOWN.md` for both). No proprietary code, assets, or copy were reused; everything here was written from scratch. The screening instruments (PHQ-9, GAD-7) are public-domain questionnaires.

## Features

- **Mood check-ins** — 5-point mood, energy and sleep sliders, context tags, notes. Multiple per day.
- **Journaling** — free writing plus 10 rotating guided prompts.
- **My day** — pick a few practices each morning, check them off, fresh list every day.
- **Mind gym** — 10 guided exercises: box breathing, 4-7-8, 5-4-3-2-1 grounding, thought record, gratitude, scheduled worry time, body scan, self-compassion, sleep wind-down, morning energy reset. Interactive step-by-step with breath timer.
- **Screenings** — PHQ-9 (depression) and GAD-7 (anxiety), public-domain instruments, with scoring, severity bands, history, and crisis-line signposting on relevant answers.
- **Learn** — five short psychoeducation reads (stress cycle, CBT basics, sleep, behavioral activation, connection).
- **Trends** — 7-day mood chart, averages, top context tags, recent check-ins.
- **Encrypted vault** — AES-256-GCM over the entire dataset, key derived from your passphrase (PBKDF2-SHA-256, 150,000 rounds). Integrity verification on every unlock; encrypted backups you can export/import; change passphrase; lock on demand. There is no reset: forget the passphrase and the data stays sealed, by design.
- **PWA** — installable, works fully offline via service worker. Reading-size accessibility control in Settings.

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

The included workflow (`.github/workflows/deploy.yml`) deploys to Pages on every push to `main`.

## Tech

Vanilla HTML/CSS/JS, zero dependencies, zero build. Web Crypto for encryption, SVG for charts, localStorage for the encrypted vault. ~45 KB of code total.

## Disclaimer

FO Mhealth supports self-reflection and habit building. It is not a medical device, does not diagnose, and does not replace professional care. If you are in crisis, please use the support lines listed in the app (Settings → Support) or your local emergency number.

MIT licensed. Built for the community, in the open.
