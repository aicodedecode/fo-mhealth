# MindDoc APK teardown (source research for FO Mhealth)

Research notes on the decompiled Android package that motivated this project. The APK
(`MindDoc.apk`, decompiled bundle) was unpacked and surveyed: ~21,000 files, ~9,300
Java sources, app package `de.moodpath.*`.

## What the app is

MindDoc (originally Moodpath) is a mental-health companion app. The decompile shows a
modular Kotlin architecture with these product modules:

| Module | Purpose |
|---|---|
| `onboarding` | welcome flow, initial questionnaire, consent/legal, notification setup, insight recommendation |
| `moodtracking` | recurring mood check-ins with mood selection and tags |
| `questionnaire` | assessment engine (screening instruments served from backend) |
| `exercise` | guided exercises with an audio player, subtitles, answer capture |
| `insights` | personalized insight feed (api/repository/ui/data layers) |
| `results` | assessment results and symptom reports |
| `discover` | content library of courses and singles (categories, sections, nested courses) |
| `journal`-type flows | free-form reflection around check-ins |
| `authorization`, `profile`, `settings`, `paywall` | accounts, subscription, prefs |
| `usertesttool` | internal QA harness |

Infrastructure visible in the decompile: Retrofit-style API clients, Room/database
persistence, Firebase, Braze push, AppsFlyer attribution, PayPal/YooMoney payments,
biometric auth, Glide image loading.

## What FO Mhealth takes from this

**Feature surface only.** The web app implements the core self-care loop with original
code, design, and writing:

1. mood check-ins with tags (the daily engagement hook)
2. screening assessments with scoring and history (PHQ-9/GAD-7, public domain)
3. guided exercises with step flow and answers
4. psychoeducation library
5. insight trends from tracked data
6. local-first storage

**Deliberately different:** no accounts, no backend, no paywall, no tracking SDKs,
no cloud sync. Encryption and integrity verification are built in at the storage layer
instead of trusting a server. Everything runs offline.

## Security design (why the vault is trustworthy)

- AES-256-GCM (authenticated encryption) over the full JSON dataset.
- Key = PBKDF2-SHA-256, 150,000 iterations, 16-byte random salt, per-write 12-byte IV.
- GCM authentication tag means tampered stores fail closed at unlock.
- SHA-256 fingerprint of the ciphertext is displayed and independently verifiable
  (Settings → Encryption), even while locked.
- Backups are the same sealed envelope; import verifies before restoring.

---

# Second teardown: UpLife (com.olearis.uplife)

A Flutter-based self-improvement/habit app studied the same way (REA static pass plus a
direct bundle survey of assets, manifest, and resources). REA's analyzer targets JavaScript
bundles, so on a Flutter (Dart AOT) package its results are limited; the survey below comes
from the shipped asset and resource tree.

## Feature surface observed (from shipped artifacts)

- **Daily routine / calendar** with a "my day" model: items can be added to my day,
  removed, or rescheduled; per-day mood check-in slot on the calendar.
- **Journeys**: structured multi-step programs, gated progress (locked states), a
  "start journey" entry point on home.
- **Audio-first content**: player controls (play/stop, ±15s), reading mode with a
  switch to audio, font-size controls for reading.
- **Onboarding clarifications**: profile questions with "why we're asking" explainers
  (daily activity rhythm, gender, name), importance-of-regularity explainer.
- **Engagement polish**: congrats animations (day passed, content consumed), favorites,
  notification preferences, aftercare preferences.
- Commercial stack: RevenueCat subscriptions, Amplitude/Branch/AppsFlyer analytics,
  social auth. FO Mhealth deliberately ships none of these.

## What FO Mhealth takes (original implementation, no copied UI or copy)

1. **My day** — a daily plan: pick a few practices each morning, check them off, fresh
   list every day. Borrowed as a concept from the "my day / daily routine" model.
2. **Reading size** — an accessibility control (A / A+ / A++) borrowed from UpLife's
   font-size controls.
3. The "explain why we ask" pattern for any future profile questions, and congrats-style
   microcopy on plan completion.

Nothing else transfers: no accounts, subscriptions, analytics, or gated content in FO Mhealth.
