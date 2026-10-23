# FO Mhealth design direction

Personal mental-wellness companion for daily use on phones first. Calm, hand-made feel: soft depth, rounded surfaces, one sage-green accent the app has carried since v1. Dial: ENERGY 2 / RHYTHM 2 / MOTION 2.

Reasons (one line each):

- Dark blue-slate base: evening is when check-ins happen; it is also the existing identity, kept for continuity.
- Sage green accent (#3fd0a4), used only on actions and progress: one deliberate accent, nothing else competes.
- Amber only for warnings, red only for danger: color never carries meaning alone, a label rides along.
- Flat buttons, no gradients or glow: decoration without purpose reads as template, and contrast stays predictable.
- Radius hierarchy: cards 20px, buttons and inputs 14px, chips pill. Variation is the hierarchy, not uniform pills.
- System font stack: the app must work fully offline, so no webfont; hierarchy comes from weight and size instead.
- Cards over tables: content is a list of small daily objects, and a card gives each one a clear edge in both themes.
- Soft shadows only in light theme to lift cards off the page; dark theme uses 1px borders because shadows go invisible on dark.
- Motion purposes (each one, stated): screen transition = orient you after a tap; staggered card reveal = reads top-down in scan order; check-pop and day-complete celebration = reward completing the daily plan; breath ring scale = guide the breathing pace; chart line draw = show the trend forming. Nothing else animates. prefers-reduced-motion turns all of it off.
- Desktop 900px+: the bottom nav becomes a left rail and content centers in a reading column; same markup, repositioned, because re-implementing nav twice would drift.
- Doodle face icons for moods and text-glyph icons elsewhere: hand-drawn feel matches journaling; no stock icon library look.

Feature surface (from the studied apps' feature sets, rebuilt as original code and copy): mood check-ins with tags, journal with prompts and search, PHQ-9/GAD-7 screens with history, guided exercises with breath pacing, learning library, my-day daily plan with celebration, multi-day journeys with progress, favorites, trends with a 30-day chart, reading size, light/dark themes. No accounts, no backend, no tracking.
