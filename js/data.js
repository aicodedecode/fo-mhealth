/* FO Mhealth — content library (original writing; screening scales are public-domain instruments) */
window.DATA = {};

/* ---------- Screening instruments (PHQ-9 & GAD-7: public domain, Kroenke/Spitzer et al.) ---------- */
DATA.assessments = [
  {
    id: "phq9", name: "Depression Check (PHQ-9)", short: "PHQ-9",
    intro: "Nine questions about how often you have been bothered by certain problems over the last 2 weeks. Takes about 2 minutes. This is a self-report screen, not a diagnosis.",
    scale: [
      "Not at all", "Several days", "More than half the days", "Nearly every day"
    ],
    questions: [
      "Little interest or pleasure in doing things",
      "Feeling down, depressed, or hopeless",
      "Trouble falling or staying asleep, or sleeping too much",
      "Feeling tired or having little energy",
      "Poor appetite or overeating",
      "Feeling bad about yourself or that you are a failure or have let yourself or your family down",
      "Trouble concentrating on things, such as reading or watching television",
      "Moving or speaking so slowly that other people could have noticed, or being so fidgety or restless that you have been moving around a lot more than usual",
      "Thoughts that you would be better off dead or of hurting yourself in some way"
    ],
    bands: [
      { max: 4, label: "Minimal", tone: "g", note: "Symptoms look minimal right now. Keep tracking how things feel over time." },
      { max: 9, label: "Mild", tone: "g", note: "Mild symptom load. Small daily habits (sleep, movement, journaling) often help here." },
      { max: 14, label: "Moderate", tone: "o", note: "Moderate symptom load. Consider talking to someone you trust, and repeat the screen in 1-2 weeks to see the trend." },
      { max: 19, label: "Moderately severe", tone: "o", note: "This level of symptom load usually deserves a conversation with a professional. Checking in with a doctor or counselor is a reasonable next step." },
      { max: 27, label: "Severe", tone: "r", note: "High symptom load. Please consider reaching out to a mental health professional soon. If you are having thoughts of harming yourself, use the Support section right now." }
    ]
  },
  {
    id: "gad7", name: "Anxiety Check (GAD-7)", short: "GAD-7",
    intro: "Seven questions about how often you have been bothered by anxiety-related problems over the last 2 weeks. Takes about a minute. This is a self-report screen, not a diagnosis.",
    scale: [
      "Not at all", "Several days", "More than half the days", "Nearly every day"
    ],
    questions: [
      "Feeling nervous, anxious, or on edge",
      "Not being able to stop or control worrying",
      "Worrying too much about different things",
      "Trouble relaxing",
      "Being so restless that it is hard to sit still",
      "Becoming easily annoyed or irritable",
      "Feeling afraid as if something awful might happen"
    ],
    bands: [
      { max: 4, label: "Minimal", tone: "g", note: "Minimal anxiety symptoms right now. Keep an eye on how things trend." },
      { max: 9, label: "Mild", tone: "g", note: "Mild anxiety symptoms. Breathing and grounding exercises work well at this level." },
      { max: 14, label: "Moderate", tone: "o", note: "Moderate anxiety symptoms. Consider sharing this result with someone who can support you." },
      { max: 21, label: "Severe", tone: "r", note: "High anxiety symptom load. A conversation with a professional is worth prioritizing." }
    ]
  }
];

/* ---------- Mood + context tags ---------- */
DATA.moods = [
  { v: 1, label: "Very low", face: "frown4" },
  { v: 2, label: "Low", face: "frown2" },
  { v: 3, label: "Okay", face: "flat" },
  { v: 4, label: "Good", face: "smile2" },
  { v: 5, label: "Great", face: "smile4" }
];
DATA.moodTags = ["work", "family", "friends", "health", "money", "sleep", "study", "lonely", "grateful", "stressed", "energetic", "tired", "hopeful", "angry", "relaxed", "productive"];
DATA.moodPrompts = [
  "What shaped your mood most today?",
  "One thing that went better than expected?",
  "What is taking up space in your head right now?",
  "What did you do for yourself today?",
  "If today had a headline, what would it say?",
  "What would make tomorrow 5% better?"
];
DATA.journalPrompts = [
  "Three things I handled well recently",
  "A thought that keeps looping, and what it would sound like from a friend",
  "Something I am avoiding, and the smallest first step",
  "What my body is telling me lately",
  "A person who made my week lighter",
  "What I want more of, and less of, next month",
  "The last time I felt genuinely calm. What was different?",
  "A worry written down, then the most likely outcome",
  "What does rest actually look like for me?",
  "A small win nobody noticed but me"
];

/* ---------- Guided exercises (original content) ---------- */
DATA.exercises = [
  {
    id: "box-breathing", cat: "Calm", em: "breath", title: "Box breathing",
    sub: "4 counts in, hold, out, hold. Steadies a racing nervous system.",
    minutes: 3,
    steps: [
      { type: "breath", pattern: [4, 4, 4, 4], label: "Box: in, hold, out, hold", rounds: 6 }
    ]
  },
  {
    id: "478", cat: "Calm", em: "breath", title: "4-7-8 breathing",
    sub: "Long exhale to slow the body down before sleep or a hard moment.",
    minutes: 3,
    steps: [
      { type: "breath", pattern: [4, 7, 8, 0], label: "In 4, hold 7, out 8", rounds: 4 }
    ]
  },
  {
    id: "grounding", cat: "Grounding", em: "sense", title: "5-4-3-2-1 grounding",
    sub: "Anchor to the room through your senses when thoughts spiral.",
    minutes: 5,
    steps: [
      { type: "write", label: "Name 5 things you can see right now", lines: 3 },
      { type: "write", label: "Name 4 things you can feel (chair, clothes, air)", lines: 3 },
      { type: "write", label: "Name 3 things you can hear", lines: 2 },
      { type: "write", label: "Name 2 things you can smell", lines: 2 },
      { type: "write", label: "Name 1 thing you can taste", lines: 1 }
    ]
  },
  {
    id: "thought-record", cat: "CBT", em: "brain", title: "Thought record",
    sub: "Catch an automatic thought and test it against evidence.",
    minutes: 10,
    steps: [
      { type: "write", label: "What happened? Just the facts.", lines: 3 },
      { type: "write", label: "What thought went through your mind? How strongly do you believe it (0-100)?", lines: 2 },
      { type: "write", label: "What emotion came up, and how strong (0-100)?", lines: 2 },
      { type: "write", label: "What evidence supports the thought?", lines: 3 },
      { type: "write", label: "What evidence does not fit it? What would you tell a friend who had this thought?", lines: 4 },
      { type: "write", label: "A more balanced version of the thought, and how you feel now (0-100)", lines: 3 }
    ]
  },
  {
    id: "gratitude", cat: "Positivity", em: "heart", title: "Three good things",
    sub: "The classic evening habit. Trains attention toward what worked.",
    minutes: 3,
    steps: [
      { type: "write", label: "Good thing #1, however small", lines: 2 },
      { type: "write", label: "Good thing #2", lines: 2 },
      { type: "write", label: "Good thing #3", lines: 2 },
      { type: "write", label: "Which one would you like more of this week?", lines: 2 }
    ]
  },
  {
    id: "worry-time", cat: "CBT", em: "clock", title: "Scheduled worry time",
    sub: "Contain rumination: postpone it to a fixed 15-minute window.",
    minutes: 15,
    steps: [
      { type: "write", label: "Park every worry here. List them raw, unedited.", lines: 6 },
      { type: "write", label: "Circle the ones you can act on. What is one action for the top one?", lines: 3 },
      { type: "write", label: "Read the rest once, then close the notebook. They have an appointment, not a home in your head.", lines: 0 }
    ]
  },
  {
    id: "body-scan", cat: "Grounding", em: "body", title: "Quick body scan",
    sub: "Find where stress is sitting, and let it loosen a little.",
    minutes: 6,
    steps: [
      { type: "pace", label: "Close your eyes if safe. Start at the top of your head. Notice without fixing.", seconds: 60 },
      { type: "pace", label: "Jaw, neck, shoulders. If a spot is tight, breathe toward it.", seconds: 60 },
      { type: "pace", label: "Chest and stomach. Notice the breath moving it.", seconds: 60 },
      { type: "pace", label: "Legs down to the feet. Then one full breath for the whole body.", seconds: 60 }
    ]
  },
  {
    id: "self-compassion", cat: "Positivity", em: "heart", title: "Talk to yourself like a friend",
    sub: "Rewrite a harsh inner moment with the tone you give others.",
    minutes: 5,
    steps: [
      { type: "write", label: "What did you criticize yourself for today?", lines: 2 },
      { type: "write", label: "Now write it again, in the exact words you would use for a close friend in the same spot.", lines: 4 },
      { type: "write", label: "One sentence of permission you need to hear.", lines: 2 }
    ]
  },
  {
    id: "wind-down", cat: "Sleep", em: "moon", title: "Sleep wind-down",
    sub: "A 10-minute ramp: unload the mind, then slow the body.",
    minutes: 10,
    steps: [
      { type: "write", label: "Unload: anything unfinished goes on paper so your brain can put it down.", lines: 5 },
      { type: "write", label: "Set tomorrow's first task in one line.", lines: 1 },
      { type: "breath", pattern: [4, 7, 8, 0], label: "4-7-8 breathing to drop the heart rate", rounds: 4 }
    ]
  },
  {
    id: "energy-check", cat: "Sleep", em: "sun", title: "Morning energy reset",
    sub: "Two minutes to pick today's realistic pace before the day picks it for you.",
    minutes: 2,
    steps: [
      { type: "write", label: "Energy today, honestly: battery 0-100, and one reason.", lines: 2 },
      { type: "write", label: "The ONE thing that would make today count.", lines: 1 },
      { type: "write", label: "One thing you will deliberately NOT do today.", lines: 1 }
    ]
  }
];

/* ---------- Learn library (original psychoeducation shorts) ---------- */
DATA.lessons = [
  { id: "stress-cycle", title: "Your stress has a finish line", minutes: 3, body: [
    "Stress is not a state of mind, it is a body state with a beginning and an end. Your heart rate rises, stress hormones flow, muscles tense. The system is designed to complete this cycle with physical movement, connection, or emotional release.",
    "Problems start when the stressor is an inbox, not a tiger: the cycle starts but never finishes. You sit still while your body is mid-charge, for hours, for years.",
    "What completes the cycle: brisk movement (even 10 minutes), talking it out, crying, laughing, deep breathing. What does not: distraction alone. Scrolling parks the charge; it does not discharge it.",
    "Today's take: when a stressful day ends, give the charge somewhere to go. A walk counts. So does a good rant with a friend."
  ]},
  { id: "cbt-thoughts", title: "Thoughts are events, not verdicts", minutes: 4, body: [
    "Cognitive behavioral therapy starts with one observation: it is usually not events that upset us, but our reading of them. The same unanswered message reads as 'they're busy' or 'they hate me' depending on the day.",
    "Automatic thoughts are fast, believable, and often distorted. Common shapes: catastrophizing (worst case as only case), all-or-nothing (perfect or failure), mind reading (assuming others' verdicts), and personalizing (everything is about me).",
    "The skill is not positive thinking. It is checking: what is the evidence for and against? What would I tell a friend? What is the most balanced version, not the most comforting one?",
    "Try it once today with the Thought Record exercise. The goal is not to feel great, it is to feel accurate."
  ]},
  { id: "sleep-basics", title: "Sleep: the cheapest medicine there is", minutes: 3, body: [
    "Poor sleep and low mood feed each other in a loop. The single most reliable lever most people have is regularity: same wake time every day, weekends included. Wake time anchors the whole rhythm.",
    "Light matters more than most habits: get bright light within an hour of waking, and dim things down 90 minutes before bed. Caffeine has a half-life of 5-6 hours, so a 4pm coffee is still half-present at 10pm.",
    "If you cannot sleep after ~20 minutes, get up and do something dull in dim light. Beds should mean sleep, not wrestling.",
    "Today's take: pick one anchor (wake time OR dim-evening) and hold it for a week. Not both. One."
  ]},
  { id: "behavioral-activation", title: "Action first, motivation second", minutes: 3, body: [
    "When mood drops, the instinct is to wait for motivation to return before doing anything. Research says the arrow points the other way: small actions come first, and motivation follows them.",
    "This is called behavioral activation, and it is one of the most evidence-backed tools for low mood. The trick is size: the action must be almost embarrassingly small. Not 'clean the flat', 'put two dishes in the sink'.",
    "Track it, because depression edits memory toward failure. A checked box on a bad day is a counterweight.",
    "Today's take: choose one 5-minute action you have been postponing, and do it before you finish deciding whether you feel like it."
  ]},
  { id: "social-basics", title: "Connection is a health behavior", minutes: 3, body: [
    "Loneliness is not a personality flaw, it is a physiological state with real health effects, and it responds to intervention like any other behavior.",
    "Two kinds matter: deep ties (one good conversation beats ten casual chats) and low-key belonging (the regular chai vendor, the gym regular, the classmate you nod at). Both count. The second kind is easier to grow.",
    "Reaching out when you feel worst is the hardest moment to do it, and the moment it matters most. Keep one message half-written in your drafts for exactly those days.",
    "Today's take: send one low-stakes message to someone you have not spoken to in a month. No agenda. 'Saw this and thought of you' is a complete message."
  ]}
];

/* ---------- Focus areas for onboarding ---------- */
DATA.focuses = ["low mood", "anxiety", "sleep", "focus & motivation", "stress at work", "relationships", "habits", "self-esteem"];

/* Journeys: multi-day programs (original copy). */
DATA.journeys = [
  {
    id: "calm7", title: "7 days calmer", sub: "One small practice a day to lower the baseline hum of stress.", minutes: 5,
    days: [
      { title: "Name the hum", body: "Stress is easier to manage once it has a name. Today, three times, pause and ask: what is the feeling, and where do I feel it?", practice: "Do the 4-7-8 breathing once today." },
      { title: "The 90-second wave", body: "A strong emotion peaks and fades in about 90 seconds if you do not feed it with a story. Next time one hits, set a timer and just breathe through it.", practice: "Try paced breathing during one spike." },
      { title: "Worry window", body: "Give worries an appointment instead of letting them drop in all day. Ten minutes, same time daily, and worry only there.", practice: "Pick a 10-minute worry window tonight." },
      { title: "One task, fully", body: "Split attention feeds anxiety. Pick one ordinary task and do it with full attention, like it matters, because it does.", practice: "Single-task one chore today." },
      { title: "Loosen the jaw", body: "Stress parks itself in the body: jaw, shoulders, hands. A slow body scan from forehead to feet tells your nervous system the threat has passed.", practice: "Do the body scan once." },
      { title: "Say the kind thing", body: "Notice how you talk to yourself when you slip up. Say to yourself what you would say to a friend in the same spot.", practice: "Write one kind line to yourself in the journal." },
      { title: "Keep what worked", body: "Seven days of small experiments. Which one actually helped? That one becomes a keeper, not a memory.", practice: "Add your keeper to My day." }
    ]
  },
  {
    id: "sleep7", title: "Sleep reset", sub: "A week of evening habits that make falling asleep less of a fight.", minutes: 4,
    days: [
      { title: "Set your alarm, not your bedtime", body: "A fixed wake time is the anchor everything else hangs on. Bedtime follows it. Set one wake time for the whole week.", practice: "Commit to one wake time for 7 days." },
      { title: "Dim the evening", body: "Bright light tells your brain it is noon. An hour before bed, lower the lights and the screen brightness.", practice: "Try 30 dim minutes before bed." },
      { title: "The brain dump", body: "Racing thoughts at night are tomorrow's to-do list arriving early. Write them down and the mind can let them go.", practice: "Journal tonight: what is on your mind?" },
      { title: "Cool, dark, quiet", body: "Body temperature dropping is part of the sleep signal. A cooler room, darker room, quieter room: check all three tonight.", practice: "Fix one thing in your sleep space." },
      { title: "No doomscroll in bed", body: "Bed is for sleep, so the brain learns what the bed means. If you cannot sleep for 20 minutes, get up and do something dull.", practice: "Keep the phone off the pillow tonight." },
      { title: "Wind-down ritual", body: "Same three steps in the same order every night: the sequence itself becomes the sleep cue. Make yours simple.", practice: "Pick your three wind-down steps." },
      { title: "Review the week", body: "Falling asleep is a skill that responds to practice, not a personality trait. Note what changed this week and keep the best habit.", practice: "Log your week in the journal." }
    ]
  },
  {
    id: "focus7", title: "Focus rebuild", sub: "Seven days of attention training for a mind that keeps tab-hopping.", minutes: 4,
    days: [
      { title: "Count the switches", body: "Before fixing attention, see the problem: roughly note how often you switch tasks today. The number is usually embarrassing and useful.", practice: "Count your task switches today." },
      { title: "One 25-minute block", body: "One timer, one task, nothing else. Twenty-five focused minutes beats two hours of half-attention.", practice: "Do one 25-minute focus block." },
      { title: "Park the thought", body: "Random thoughts arrive mid-task. Keep a scrap page beside you, park them there, and return to the task.", practice: "Keep a parking page today." },
      { title: "Boredom reps", body: "Attention is a muscle and boredom is the gym. Stand in a queue or sip tea without your phone and let the mind settle.", practice: "Five phoneless minutes today." },
      { title: "Kill the loudest ping", body: "Notifications are other people's priorities arriving in yours. Turn off the noisiest three apps today.", practice: "Silence three apps." },
      { title: "Slow breath, sharp mind", body: "Six breaths a minute for a few minutes measurably steadies attention. Do it before your hardest task.", practice: "Breathe 6/min for 3 minutes before one task." },
      { title: "Your focus formula", body: "You now know your biggest leak and your best block. Write your one-line focus rule and keep it where you work.", practice: "Write your focus rule in the journal." }
    ]
  }
];
