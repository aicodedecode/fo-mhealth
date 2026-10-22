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
