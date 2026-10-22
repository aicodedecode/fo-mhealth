/* FO Mhealth — app logic. All data stays in this browser.
   Storage: AES-256-GCM encrypted (see crypto.js), integrity-verified on every unlock. */
(function () {
  "use strict";
  var LEGACY_KEY = "fomhealth.v1"; /* pre-encryption format */
  var $app = document.getElementById("app");
  var S = null;          /* decrypted state, memory only */
  var encrypted = false; /* true once a passphrase protects the store */
  var unlocked = false;

  function blank() {
    return { profile: null, checkins: [], journals: [], assessments: [], exercises: [], settings: { theme: "dark" } };
  }
  function save() {
    if (encrypted) CRYPTO.write(S);
    else { try { localStorage.setItem(LEGACY_KEY, JSON.stringify(S)); } catch (e) {} }
  }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function fmt(ts) {
    var d = new Date(ts), now = new Date();
    var day = d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
    var time = d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
    return d.toDateString() === now.toDateString() ? "Today " + time : day + ", " + time;
  }
  function toast(msg) {
    var t = document.createElement("div"); t.className = "toast"; t.textContent = msg;
    document.body.appendChild(t); setTimeout(function () { t.remove(); }, 2200);
  }
  function go(hash) { location.hash = hash; }
  function partOfDay() {
    var h = new Date().getHours();
    return h < 12 ? "Morning" : h < 17 ? "Afternoon" : h < 21 ? "Evening" : "Night";
  }
  function sameDay(a, b) { return new Date(a).toDateString() === new Date(b).toDateString(); }
  function streak() {
    if (!S || !S.checkins.length) return 0;
    var days = {}; S.checkins.forEach(function (c) { days[new Date(c.ts).toDateString()] = true; });
    var n = 0, d = new Date();
    while (days[d.toDateString()]) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }

  /* ---------- faces & icons ---------- */
  var FACE = {
    frown4: 'M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18z M8.5 15.5c1-1.6 2.2-2.4 3.5-2.4s2.5.8 3.5 2.4 M8.7 10l1.6-1.6 M9.6 10.4 8 8.8 M15.3 10l-1.6-1.6 M14.4 10.4 16 8.8',
    frown2: 'M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18z M8.5 15.5c1-1.2 2.2-1.8 3.5-1.8s2.5.6 3.5 1.8 M9 9.8h.01 M15 9.8h.01',
    flat:   'M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18z M8.7 14.5h6.4 M9 9.8h.01 M15 9.8h.01',
    smile2: 'M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18z M8.5 13.5c1 1.2 2.2 1.8 3.5 1.8s2.5-.6 3.5-1.8 M9 9.8h.01 M15 9.8h.01',
    smile4: 'M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18z M8 13.2c1 2 2.3 3 4 3s3-1 4-3 M8.8 9.6l1.8 1.2 M15.2 9.6l-1.8 1.2'
  };
  function face(key) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" style="width:30px;height:30px"><path d="' + FACE[key] + '" fill-rule="evenodd"/></svg>';
  }
  var ICON = {
    home: '<path d="M4 11.5 12 4l8 7.5M6 10v9h12v-9" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
    heart: '<path d="M12 20s-7-4.6-7-9.3C5 8 7 6.2 9.3 6.2c1.2 0 2.2.6 2.7 1.5.5-.9 1.5-1.5 2.7-1.5C17 6.2 19 8 19 10.7 19 15.4 12 20 12 20z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>',
    pen: '<path d="M5 19h14M7 15.5 16.5 6a1.9 1.9 0 0 1 2.7 2.7L9.7 18.2 6 19z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
    chart: '<path d="M5 19h14M7 16v-4M11 16V8M15 16v-6M19 16V5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
    menu: '<path d="M5 8h14M5 12h14M5 16h14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>'
  };
  function icon(k) { return '<svg viewBox="0 0 24 24" style="width:22px;height:22px">' + ICON[k] + "</svg>"; }
  function iconGlyph(k) {
    return { breath: "&#127811;", brain: "&#129504;", pen: "&#9997;&#65039;", heart: "&#129505;", moon: "&#127769;", sun: "&#9728;&#65039;", sense: "&#128064;", clock: "&#128336;&#65039;", body: "&#129492;" }[k] || "&#9679;";
  }

  /* ---------- shell ---------- */
  function shell(active, html) {
    var nav = [["home", "home", "Home"], ["journal", "pen", "Journal"], ["assess", "heart", "Check"], ["exercises", "menu", "Gym"], ["insights", "chart", "Trends"]];
    var navHtml = '<nav class="bottomnav"><div class="wrap">' + nav.map(function (n) {
      return '<button class="navbtn' + (active === n[0] ? " on" : "") + '" data-go="#/' + n[0] + '">' + icon(n[1]) + "<span>" + n[2] + "</span></button>";
    }).join("") + "</div></nav>";
    var lock = encrypted && unlocked ? '<button class="iconbtn" id="locknow" title="Lock">&#128274;</button>' : "";
    $app.innerHTML =
      '<div class="topbar"><div class="brand"><img src="assets/icon.svg" alt="FO Mhealth"><div><h1>FO Mhealth</h1><small>' + (encrypted ? "encrypted & offline" : "private & offline") + "</small></div></div>" +
      "<div>" + lock + '<button class="iconbtn" data-go="#/settings" title="Settings">' + icon("menu") + "</button></div></div>" +
      html + navHtml +
      '<div class="footer">FO Mhealth is a self-care companion, not a medical product and not a diagnosis. If you are in crisis, use Support in Settings.</div>';
    $app.querySelectorAll("[data-go]").forEach(function (b) {
      b.addEventListener("click", function () { go(b.getAttribute("data-go")); });
    });
    var lb = document.getElementById("locknow");
    if (lb) lb.addEventListener("click", function () { lockNow(); });
  }
  function bindNav() {
    $app.querySelectorAll("[data-go]").forEach(function (b) {
      b.addEventListener("click", function () { go(b.getAttribute("data-go")); });
    });
  }
  function lockNow() {
    S = null; unlocked = false; CRYPTO.forget();
    go("#/"); boot();
  }

  /* ---------- boot & unlock ---------- */
  function boot() {
    if (CRYPTO.hasEnc()) { unlockScreen(); return; }
    var legacy = null;
    try { legacy = JSON.parse(localStorage.getItem(LEGACY_KEY)); } catch (e) {}
    if (legacy && legacy.profile) {
      S = legacy; save(); /* carried into encrypted store on next save after setup */
      setupPassScreen("You have existing data. Set a passphrase to encrypt and carry it over.");
    } else if (legacy) {
      S = legacy; setupPassScreen("Set a passphrase to encrypt everything (recommended).");
    } else {
      S = blank();
      onboarding();
    }
  }
  function unlockScreen(err) {
    $app.innerHTML =
      '<div class="topbar"><div class="brand"><img src="assets/icon.svg" alt="FO Mhealth"><div><h1>FO Mhealth</h1><small>encrypted</small></div></div></div>' +
      '<div class="card center" style="margin-top:40px"><div style="font-size:40px">&#128274;</div><h2 style="margin-top:8px">Unlock your data</h2>' +
      '<p class="sub">This vault is sealed with your passphrase. Nothing leaves this device; there is no reset, by design.</p>' +
      '<input type="text" id="pass" placeholder="Passphrase" style="margin-top:10px" autocomplete="off">' +
      (err ? '<p style="color:var(--danger);font-size:13px;margin-top:10px">' + esc(err) + "</p>" : "") +
      '<div class="btnrow"><button class="btn primary block" id="go">Unlock</button></div>' +
      '<p class="sub" id="fp" style="margin-top:14px"></p></div>';
    CRYPTO.verify().then(function (r) {
      var el = document.getElementById("fp");
      if (r && el) el.textContent = r.ok ? "Integrity check passed · fingerprint " + r.stored.slice(0, 12) : "INTEGRITY CHECK FAILED — data was modified outside the app";
      if (r && !r.ok) el.style.color = "var(--danger)";
    });
    function tryOpen() {
      var pass = document.getElementById("pass").value;
      if (!pass) return;
      CRYPTO.open(CRYPTO.store(), pass).then(function (st) {
        S = st; unlocked = true; encrypted = true;
        save();
        location.hash = "#/home"; render();
      }, function () { unlockScreen("Wrong passphrase. Try again."); });
    }
    document.getElementById("go").addEventListener("click", tryOpen);
    document.getElementById("pass").addEventListener("keydown", function (e) { if (e.key === "Enter") tryOpen(); });
  }
  function setupPassScreen(msg) {
    $app.innerHTML =
      '<div class="topbar"><div class="brand"><img src="assets/icon.svg" alt="FO Mhealth"><div><h1>FO Mhealth</h1><small>setup</small></div></div></div>' +
      '<div class="card" style="margin-top:20px"><h2>Encryption</h2><p class="sub">' + esc(msg) + "</p>" +
      '<p class="sub" style="color:var(--warn)">Choose a passphrase you will not lose. There is no reset: if it is forgotten, the data is unrecoverable. Everything is encrypted on this device with AES-256 and integrity-checked on every unlock.</p>' +
      '<label class="fld">Passphrase (min 6 chars)</label><input type="text" id="p1" autocomplete="off">' +
      '<label class="fld">Repeat it</label><input type="text" id="p2" autocomplete="off">' +
      '<div class="btnrow"><button class="btn primary block" id="go">Encrypt &amp; continue</button></div>' +
      '<div class="btnrow"><button class="btn ghost block" id="skip">Skip for now (stays unencrypted)</button></div></div>';
    document.getElementById("go").addEventListener("click", function () {
      var a = document.getElementById("p1").value, b = document.getElementById("p2").value;
      if (a.length < 6) { toast("Use at least 6 characters"); return; }
      if (a !== b) { toast("The two passphrases don't match"); return; }
      CRYPTO.init(a).then(function () {
        encrypted = true; unlocked = true;
        localStorage.removeItem(LEGACY_KEY);
        save();
        if (!S.profile) onboarding();
        else { location.hash = "#/home"; render(); }
        toast("Encrypted. You're protected.");
      });
    });
    document.getElementById("skip").addEventListener("click", function () {
      encrypted = false; unlocked = true;
      save();
      if (!S.profile) onboarding(); else { location.hash = "#/home"; render(); }
    });
  }

  /* ---------- routes ---------- */
  var routes = {
    "": home, home: home, onboarding: onboarding, checkin: checkin, journal: journal,
    journalNew: journalNew, assess: assess, assessRun: assessRun, exercises: exercises,
    exerciseRun: exerciseRun, learn: learn, lessonRun: lessonRun, insights: insights, settings: settings
  };
  function render() {
    document.documentElement.setAttribute("data-theme", (S && S.settings && S.settings.theme) || "dark");
    if (!unlocked) { boot(); return; }
    var path = (location.hash || "#/").replace(/^#\//, "");
    var h = path.split("/")[0];
    if ((!S || !S.profile) && h !== "settings") { if (!S) S = blank(); routes.onboarding(path); return; }
    (routes[h] || home)(path);
    window.scrollTo(0, 0);
  }
  window.addEventListener("hashchange", render);

  /* ---------- onboarding ---------- */
  function onboarding() {
    $app.innerHTML =
      '<div class="topbar"><div class="brand"><img src="assets/icon.svg" alt="FO Mhealth"><div><h1>FO Mhealth</h1><small>' + (encrypted ? "encrypted & offline" : "private & offline") + "</small></div></div></div>" +
      '<div class="card"><h2>Welcome' + (S.profile ? " back" : "") + ". Let's set this up.</h2><p class=\"sub\">A mood tracker, journal, and mind gym, built as an open community project. Everything stays in this browser. No account, no server, no sync.</p>" +
      '<label class="fld">What should we call you?</label><input type="text" id="ob-name" placeholder="A name or nickname" maxlength="24">' +
      '<label class="fld">What brings you here? (pick any)</label><div class="chips" id="ob-focus"></div>' +
      '<div class="btnrow"><button class="btn primary block" id="ob-go">Start</button></div></div>' +
      '<div class="banner"><b>One honest note:</b> this app supports self-reflection and habit building. It does not diagnose, treat, or replace a professional. If things feel heavy, please reach out to a real person. Support lines are one tap away in Settings.</div>';
    var box = document.getElementById("ob-focus");
    DATA.focuses.forEach(function (f) {
      var c = document.createElement("button"); c.className = "chip"; c.textContent = f;
      c.addEventListener("click", function () { c.classList.toggle("sel"); });
      box.appendChild(c);
    });
    document.getElementById("ob-go").addEventListener("click", function () {
      var name = document.getElementById("ob-name").value.trim() || "friend";
      var picked = Array.prototype.map.call(box.querySelectorAll(".sel"), function (c) { return c.textContent; });
      S.profile = { name: name, focuses: picked, createdAt: Date.now() };
      save();
      if (!encrypted) { setupPassScreen("Last step: seal your data. Choose a passphrase and everything you write is encrypted on this device."); }
      else { go("#/home"); toast("Welcome, " + name); }
    });
  }

  /* ---------- home ---------- */
  function home() {
    var today = S.checkins.filter(function (c) { return sameDay(c.ts, Date.now()); });
    var doneToday = today.length > 0;
    var html =
      '<div class="grid three" style="margin-top:6px">' +
      '<div class="stat"><b>' + streak() + '</b><span>day streak</span></div>' +
      '<div class="stat"><b>' + S.journals.length + '</b><span>journal entries</span></div>' +
      '<div class="stat"><b>' + S.exercises.length + '</b><span>exercises done</span></div></div>' +
      '<div class="card"><h2>' + partOfDay() + ', ' + esc(S.profile.name) + '</h2><p class="sub">' +
      (doneToday ? "You have checked in today. Nice." : "First thing: a 60-second check-in.") + "</p>" +
      '<div class="btnrow"><button class="btn primary" data-go="#/checkin">' + (doneToday ? "Log another check-in" : "Start check-in") + "</button>" +
      '<button class="btn ghost" data-go="#/assess">Screenings</button></div></div>' +
      '<div class="sectiontitle">This week</div>' +
      '<div class="card"><svg class="moodchart" id="wkchart" viewBox="0 0 300 150" preserveAspectRatio="none"></svg></div>' +
      '<div class="sectiontitle">Mind gym</div><div class="grid two">' +
      tile("#/exercises", "breath", "Guided exercises", "Breathing, grounding, CBT tools") +
      tile("#/learn", "brain", "Learn", "Short reads on how minds work") + "</div>" +
      '<div class="sectiontitle">Write</div><div class="grid two">' +
      tile("#/journalNew", "pen", "Journal entry", "Free write or a guided prompt") +
      tile("#/journal", "heart", "Past entries", S.journals.length + " saved, all local") + "</div>";
    shell("home", html);
    drawWeek("wkchart"); bindNav();
  }
  function tile(href, em, title, sub) {
    return '<button class="tile" data-go="' + href + '"><div class="em">' + iconGlyph(em) + "</div><h3>" + title + "</h3><p>" + sub + "</p></button>";
  }

  /* ---------- mood chart ---------- */
  function weekMoods() {
    var out = [], d = new Date();
    for (var i = 6; i >= 0; i--) {
      var dd = new Date(d); dd.setDate(d.getDate() - i);
      var day = S.checkins.filter(function (c) { return sameDay(c.ts, dd); });
      var avg = day.length ? day.reduce(function (a, c) { return a + c.mood; }, 0) / day.length : null;
      out.push({ label: dd.toLocaleDateString(undefined, { weekday: "narrow" }), mood: avg });
    }
    return out;
  }
  function drawWeek(id) {
    var svg = document.getElementById(id); if (!svg) return;
    var w = 300, h = 150, pad = 22, step = (w - pad * 2) / 6, pts = [];
    var data = weekMoods();
    data.forEach(function (d, i) {
      if (d.mood == null) return;
      pts.push([pad + i * step, h - 24 - ((d.mood - 1) / 4) * (h - 48)]);
    });
    var s = "";
    [1, 3, 5].forEach(function (m) {
      var y = h - 24 - ((m - 1) / 4) * (h - 48);
      s += '<line x1="' + pad + '" y1="' + y + '" x2="' + (w - pad) + '" y2="' + y + '" stroke="rgba(128,150,170,.15)" stroke-dasharray="3 4"/>';
    });
    if (pts.length > 1) {
      s += '<polyline points="' + pts.map(function (p) { return p[0].toFixed(1) + "," + p[1].toFixed(1); }).join(" ") + '" fill="none" stroke="#3fd0a4" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>';
    }
    pts.forEach(function (p) { s += '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="3.5" fill="#3fd0a4"/>'; });
    data.forEach(function (d, i) {
      s += '<text x="' + (pad + i * step) + '" y="' + (h - 6) + '" fill="rgba(128,150,170,.7)" font-size="10" text-anchor="middle">' + d.label + "</text>";
    });
    if (!pts.length) s += '<text x="150" y="75" fill="rgba(128,150,170,.6)" font-size="12" text-anchor="middle">No check-ins yet. Yours is 60 seconds away.</text>';
    svg.innerHTML = s;
  }

  /* ---------- check-in ---------- */
  function checkin() {
    var mood = 0;
    $app.innerHTML =
      '<div class="topbar"><div class="brand"><h1>Check-in</h1></div><button class="iconbtn" data-go="#/home">&#8592;</button></div>' +
      '<div class="card"><p class="stepchip">' + partOfDay().toUpperCase() + " CHECK-IN</p>" +
      "<h2>How is your mood right now?</h2>" + '<div class="moodrow" id="moodrow"></div>' +
      '<label class="fld">Energy right now</label><input type="range" class="slider" id="energy" min="1" max="5" value="3"><div class="sliderlabel"><span>empty</span><span>full</span></div>' +
      '<label class="fld">Hours of sleep last night (about)</label><input type="range" class="slider" id="sleep" min="0" max="12" value="7"><div class="sliderlabel"><span>0h</span><span>12h</span></div>' +
      '<label class="fld">What\'s in the mix?</label><div class="chips" id="tags"></div>' +
      '<label class="fld">A line about it (optional)</label><textarea id="note" rows="3" placeholder="' + esc(DATA.moodPrompts[Math.floor(Math.random() * DATA.moodPrompts.length)]) + '"></textarea>' +
      '<div class="btnrow"><button class="btn primary block" id="save">Save check-in</button></div></div>';
    var mr = document.getElementById("moodrow");
    DATA.moods.forEach(function (m) {
      var b = document.createElement("button"); b.className = "moodopt";
      b.innerHTML = face(m.face) + "<span>" + m.label + "</span>";
      b.addEventListener("click", function () {
        mood = m.v;
        mr.querySelectorAll(".moodopt").forEach(function (x) { x.classList.remove("sel"); });
        b.classList.add("sel");
      });
      mr.appendChild(b);
    });
    var tc = document.getElementById("tags");
    DATA.moodTags.forEach(function (t) {
      var c = document.createElement("button"); c.className = "chip"; c.textContent = t;
      c.addEventListener("click", function () { c.classList.toggle("sel"); });
      tc.appendChild(c);
    });
    document.getElementById("save").addEventListener("click", function () {
      if (!mood) { toast("Pick a mood first"); return; }
      S.checkins.push({
        id: uid(), ts: Date.now(), part: partOfDay(), mood: mood, energy: +document.getElementById("energy").value,
        sleep: +document.getElementById("sleep").value,
        tags: Array.prototype.map.call(tc.querySelectorAll(".sel"), function (c) { return c.textContent; }),
        note: document.getElementById("note").value.trim()
      });
      save(); go("#/home"); toast("Logged. " + streak() + "-day streak");
    });
    bindNav();
  }

  /* ---------- journal ---------- */
  function journal() {
    var items = S.journals.slice().sort(function (a, b) { return b.ts - a.ts; });
    var html = '<div class="topbar"><div class="brand"><h1>Journal</h1></div><button class="btn small primary" data-go="#/journalNew">New</button></div>';
    html += '<div class="card">';
    if (!items.length) html += '<p class="sub">Nothing written yet. A blank page and a prompt is a good combo.</p>';
    items.forEach(function (j) {
      html += '<div class="row"><div class="ic">&#9997;&#65039;</div><div class="grow"><h4>' + esc(j.title || (j.text || "").slice(0, 48) || "Untitled") + "</h4><p>" + esc((j.text || "").slice(0, 80)) + '</p></div><div class="meta">' + fmt(j.ts) + "</div></div>";
    });
    html += "</div>";
    shell("journal", html); bindNav();
  }
  function journalNew() {
    var cur = DATA.journalPrompts[Math.floor(Math.random() * DATA.journalPrompts.length)];
    $app.innerHTML =
      '<div class="topbar"><div class="brand"><h1>New entry</h1></div><button class="iconbtn" data-go="#/journal">&#8592;</button></div>' +
      '<div class="card"><label class="fld">Prompt (tap to shuffle)</label><button class="chip" id="prompt" style="width:100%"></button>' +
      '<label class="fld">Title (optional)</label><input type="text" id="title" maxlength="60">' +
      '<label class="fld">Write</label><textarea id="text" rows="10" placeholder="Start anywhere. Ugly drafts welcome."></textarea>' +
      '<div class="btnrow"><button class="btn primary block" id="save">Save entry</button></div></div>';
    var pb = document.getElementById("prompt");
    pb.textContent = cur;
    pb.addEventListener("click", function () {
      cur = DATA.journalPrompts[Math.floor(Math.random() * DATA.journalPrompts.length)];
      pb.textContent = cur;
    });
    document.getElementById("save").addEventListener("click", function () {
      var text = document.getElementById("text").value.trim();
      if (!text) { toast("Write a line first"); return; }
      S.journals.push({ id: uid(), ts: Date.now(), title: document.getElementById("title").value.trim(), prompt: cur, text: text });
      save(); go("#/journal"); toast("Saved");
    });
    bindNav();
  }

  /* ---------- assessments ---------- */
  function assess() {
    var html = '<div class="topbar"><div class="brand"><h1>Screenings</h1></div></div>' +
      '<div class="banner">These are validated <b>self-report screens</b>, not diagnoses. Scores show a trend over time. Bring them to a professional, not a conclusion.</div>';
    DATA.assessments.forEach(function (a) {
      var last = S.assessments.filter(function (r) { return r.type === a.id; }).sort(function (x, y) { return y.ts - x.ts; })[0];
      html += '<div class="card"><h2>' + a.name + "</h2><p class='sub'>" + a.questions.length + " questions · about " + Math.ceil(a.questions.length * 0.35) + " min</p>";
      if (last) {
        var band = bandFor(a, last.score);
        html += '<p>Last: <b>' + last.score + "</b> / " + a.questions.length * 4 + ' <span class="badge ' + band.tone + '">' + band.label + "</span> <span style='color:var(--ink3);font-size:12px'>· " + fmt(last.ts) + "</span></p>";
      }
      html += '<div class="btnrow"><button class="btn primary" data-go="#/assessRun/' + a.id + '">' + (last ? "Retake" : "Start") + "</button></div></div>";
    });
    var hist = S.assessments.slice().sort(function (a, b) { return b.ts - a.ts; }).slice(0, 8);
    if (hist.length) {
      html += '<div class="sectiontitle">History</div><div class="card">';
      hist.forEach(function (r) {
        var a = DATA.assessments.find(function (x) { return x.id === r.type; });
        html += '<div class="row"><div class="grow"><h4>' + a.short + "</h4><p>" + fmt(r.ts) + "</p></div><div class='meta'><b>" + r.score + "</b>/" + a.questions.length * 4 + "</div></div>";
      });
      html += "</div>";
    }
    shell("assess", html); bindNav();
  }
  function bandFor(a, score) {
    return a.bands.find(function (x) { return score <= x.max; }) || a.bands[a.bands.length - 1];
  }
  function assessRun(path) {
    var id = path.split("/")[1];
    var a = DATA.assessments.find(function (x) { return x.id === id; });
    if (!a) { go("#/assess"); return; }
    var qi = 0, answers = [];
    function draw() {
      var pct = Math.round((qi / a.questions.length) * 100);
      var q = a.questions[qi];
      var opts = a.scale.map(function (s, si) {
        return '<button class="opt" data-v="' + si + '"><b>' + si + "</b> · " + s + "</button>";
      }).join("");
      $app.innerHTML =
        '<div class="topbar"><div class="brand"><h1>' + a.short + "</h1></div><button class='iconbtn' data-go='#/assess'>&#8592;</button></div>" +
        '<div class="progress"><i style="width:' + pct + '%"></i></div><p style="font-size:12px;color:var(--ink3)">Question ' + (qi + 1) + " of " + a.questions.length + " · over the last 2 weeks, how often…</p>" +
        '<div class="card"><div class="q"><p>' + esc(q) + "</p><div class='opts>" + opts + "</div></div></div>";
      $app.querySelectorAll(".opt").forEach(function (o) {
        o.addEventListener("click", function () {
          answers.push(+o.getAttribute("data-v"));
          qi++;
          if (qi < a.questions.length) draw(); else finish();
        });
      });
      bindNav();
    }
    function finish() {
      var score = answers.reduce(function (x, y) { return x + y; }, 0);
      var band = bandFor(a, score);
      S.assessments.push({ id: uid(), ts: Date.now(), type: a.id, answers: answers, score: score });
      save();
      var crisis = a.id === "phq9" && answers[8] >= 1;
      $app.innerHTML =
        '<div class="topbar"><div class="brand"><h1>' + a.short + " result</h1></div><button class='iconbtn' data-go='#/assess'>&#8592;</button></div>" +
        '<div class="card center"><p style="font-size:13px;color:var(--ink3)">YOUR SCORE</p><div class="timerdigit">' + score + "<span style='font-size:16px;color:var(--ink3)'>/" + a.questions.length * 4 + "</span></div>" +
        '<span class="badge ' + band.tone + '" style="font-size:13px">' + band.label + "</span>" +
        "<p class='sub' style='margin-top:12px;text-align:left'>" + esc(band.note) + "</p></div>" +
        (crisis ? '<div class="banner"><b>Please read this:</b> you indicated thoughts of self-harm. You deserve support today, not someday. In India, Tele-MANAS: <b>14416</b> (24×7, free) · AASRA: <b>+91 9820466726</b> · iCall: <b>+91 9152987821</b>. If you are in immediate danger, call emergency services.</div>' : "") +
        '<div class="card"><p class="sub">Repeat this screen every 1-2 weeks. One score is a snapshot; the trend is the story.</p><div class="btnrow"><button class="btn primary" data-go="#/insights">See trends</button><button class="btn ghost" data-go="#/home">Done</button></div></div>';
      bindNav();
    }
    draw();
  }

  /* ---------- exercises ---------- */
  function exercises() {
    var cats = {};
    DATA.exercises.forEach(function (e) { (cats[e.cat] = cats[e.cat] || []).push(e); });
    var html = '<div class="topbar"><div class="brand"><h1>Mind gym</h1></div><button class="btn small primary" data-go="#/learn">Learn</button></div>' +
      '<div class="card"><p class="sub">Short guided practices. Done ' + S.exercises.length + " times so far.</p></div>";
    Object.keys(cats).forEach(function (cat) {
      html += '<div class="sectiontitle">' + esc(cat) + '</div><div class="grid two">';
      cats[cat].forEach(function (e) {
        var n = S.exercises.filter(function (x) { return x.exerciseId === e.id; }).length;
        html += '<button class="tile" data-go="#/exerciseRun/' + e.id + '"><div class="em">' + iconGlyph(e.em) + "</div><h3>" + esc(e.title) + (n ? ' <span class="badge b">×' + n + "</span>" : "") + "</h3><p>" + esc(e.sub) + "</p></button>";
      });
      html += "</div>";
    });
    shell("exercises", html); bindNav();
  }
  var breathTimer = null;
  function exerciseRun(path) {
    var id = path.split("/")[1];
    var e = DATA.exercises.find(function (x) { return x.id === id; });
    if (!e) { go("#/exercises"); return; }
    var si = 0, log = [];
    function draw() {
      var st = e.steps[si];
      var body = "";
      if (st.type === "breath") body = '<div class="center"><div class="breathcircle inflate" id="bc"><div><div id="bl" style="font-weight:700">Breathe in</div><div id="bc2" style="font-size:13px;color:var(--ink3)"></div></div></div><p class="sub">' + esc(st.label) + "</p></div>";
      else if (st.type === "pace") body = '<div class="center"><div class="timerdigit" id="pd">--</div><p class="sub" style="margin-top:8px">' + esc(st.label) + "</p></div>";
      else if (st.type === "write") body = (st.lines ? '<textarea rows="' + Math.max(3, st.lines) + '" id="w"></textarea>' : "<p class='sub'>" + esc(st.label) + "</p>");
      $app.innerHTML =
        '<div class="topbar"><div class="brand"><h1>' + esc(e.title) + "</h1></div><button class='iconbtn' data-go='#/exercises'>&#215;</button></div>" +
        '<div class="progress"><i style="width:' + Math.round((si / e.steps.length) * 100) + '%"></i></div>' +
        '<p style="font-size:12px;color:var(--ink3);margin:4px 4px 0">Step ' + (si + 1) + " of " + e.steps.length + " · " + e.minutes + " min total</p>" +
        '<div class="card"><p class="stepchip">' + esc(e.cat.toUpperCase()) + "</p>" + body +
        '<div class="btnrow"><button class="btn primary block" id="next">' + (si === e.steps.length - 1 ? "Finish" : "Next step") + "</button></div></div>";
      var btn = document.getElementById("next");
      if (st.type === "breath") {
        startBreath(st);
        btn.addEventListener("click", function () { if (breathTimer) { clearInterval(breathTimer); breathTimer = null; } advance(); });
      } else if (st.type === "pace") {
        var left = st.seconds, d = document.getElementById("pd");
        var iv = setInterval(function () {
          left--; d.textContent = Math.floor(left / 60) + ":" + ("0" + Math.max(0, left % 60)).slice(-2);
          if (left <= 0) { clearInterval(iv); d.textContent = "done"; }
        }, 1000);
        btn.addEventListener("click", function () { clearInterval(iv); advance(); });
      } else {
        btn.addEventListener("click", function () {
          var t = document.getElementById("w");
          if (t) log.push({ label: st.label, text: t.value.trim() });
          advance();
        });
      }
      bindNav();
    }
    function advance() {
      si++;
      if (si < e.steps.length) draw();
      else {
        S.exercises.push({ id: uid(), ts: Date.now(), exerciseId: e.id, log: log });
        save(); go("#/exercises"); toast(e.title + " done");
      }
    }
    draw();
  }
  function startBreath(st) {
    var labels = ["Breathe in", "Hold", "Breathe out", "Hold"];
    var round = 0, phase = 0, left = st.pattern[0];
    var bc = document.getElementById("bc"), bl = document.getElementById("bl"), bc2 = document.getElementById("bc2");
    function tick() {
      if (left <= 0) {
        phase = (phase + 1) % 4;
        if (phase === 0) { round++; if (round >= st.rounds) { bl.textContent = "Complete"; bc2.textContent = ""; return; } }
        left = st.pattern[phase];
      }
      bl.textContent = labels[phase];
      bc2.textContent = left + "s · round " + (round + 1) + "/" + st.rounds;
      if (phase === 0) bc.className = "breathcircle inflate";
      else if (phase === 2) bc.className = "breathcircle deflate";
      left--;
    }
    tick();
    breathTimer = setInterval(tick, 1000);
  }

  /* ---------- learn ---------- */
  function learn() {
    var html = '<div class="topbar"><div class="brand"><h1>Learn</h1></div><button class="btn small primary" data-go="#/exercises">Gym</button></div>' +
      '<div class="card"><p class="sub">Three-minute reads on how minds actually work. Plain language, no fluff.</p></div><div class="grid two">';
    DATA.lessons.forEach(function (l) {
      html += '<button class="tile" data-go="#/lessonRun/' + l.id + '"><div class="em">&#128218;</div><h3>' + esc(l.title) + "</h3><p>" + l.minutes + " min read</p></button>";
    });
    html += "</div>";
    shell("exercises", html); bindNav();
  }
  function lessonRun(path) {
    var id = path.split("/")[1];
    var l = DATA.lessons.find(function (x) { return x.id === id; });
    if (!l) { go("#/learn"); return; }
    var body = l.body.map(function (p) { return "<p style='margin:12px 0;color:var(--ink2)'>" + esc(p) + "</p>"; }).join("");
    $app.innerHTML =
      '<div class="topbar"><div class="brand"><h1>' + esc(l.title) + "</h1></div><button class='iconbtn' data-go='#/learn'>&#8592;</button></div>" +
      '<div class="card"><p class="stepchip">' + l.minutes + " MIN READ</p>" + body + "</div>" +
      '<div class="card"><p class="sub">Reading helps most when it moves. Try a related exercise next.</p><div class="btnrow"><button class="btn primary" data-go="#/exercises">Open mind gym</button></div></div>';
    bindNav();
  }

  /* ---------- insights ---------- */
  function insights() {
    var n = S.checkins.length;
    var avg = n ? (S.checkins.reduce(function (a, c) { return a + c.mood; }, 0) / n).toFixed(1) : null;
    var sleepAvg = n ? (S.checkins.reduce(function (a, c) { return a + c.sleep; }, 0) / n).toFixed(1) : null;
    var tagCount = {};
    S.checkins.forEach(function (c) { (c.tags || []).forEach(function (t) { tagCount[t] = (tagCount[t] || 0) + 1; }); });
    var topTags = Object.keys(tagCount).sort(function (a, b) { return tagCount[b] - tagCount[a]; }).slice(0, 6);
    var html = '<div class="topbar"><div class="brand"><h1>Trends</h1></div></div>' +
      '<div class="grid three"><div class="stat"><b>' + (avg || "–") + '</b><span>avg mood</span></div>' +
      '<div class="stat"><b>' + (sleepAvg || "–") + 'h</b><span>avg sleep</span></div>' +
      '<div class="stat"><b>' + n + '</b><span>check-ins</span></div></div>' +
      '<div class="card"><h2>Last 7 days</h2><svg class="moodchart" id="wk2" viewBox="0 0 300 150" preserveAspectRatio="none"></svg></div>';
    if (topTags.length) {
      html += '<div class="card"><h2>What shows up most</h2><div class="tagline">' +
        topTags.map(function (t) { return '<span class="tagpill">' + esc(t) + " ×" + tagCount[t] + "</span>"; }).join("") + "</div></div>";
    }
    var rows = S.checkins.slice().sort(function (a, b) { return b.ts - a.ts; }).slice(0, 10);
    html += '<div class="sectiontitle">Recent check-ins</div><div class="card">';
    if (!rows.length) html += "<p class='sub'>No data yet.</p>";
    rows.forEach(function (c) {
      html += '<div class="row"><div class="ic">' + face(DATA.moods[c.mood - 1].face) + "</div><div class='grow'><h4>" + DATA.moods[c.mood - 1].label + " · " + esc(c.part) + "</h4><p>" + esc(c.note || (c.tags || []).join(", ") || "no note") + "</p></div><div class='meta'>" + fmt(c.ts) + "</div></div>";
    });
    html += "</div>";
    shell("insights", html);
    drawWeek("wk2"); bindNav();
  }

  /* ---------- settings ---------- */
  function settings() {
    var back = S && S.profile ? "#/home" : "#/";
    CRYPTO.verify().then(function (r) {
      var el = document.getElementById("fpstat");
      if (!el) return;
      if (!r) { el.innerHTML = '<span class="badge o">unencrypted mode</span>'; return; }
      el.innerHTML = r.ok
        ? '<span class="badge g">verified</span> <span style="font-size:12px;color:var(--ink3)">SHA-256 ' + r.stored.slice(0, 16) + " · last write " + fmt(r.updated) + "</span>"
        : '<span class="badge r">integrity check FAILED — the store was modified outside the app</span>';
    });
    $app.innerHTML =
      '<div class="topbar"><div class="brand"><h1>Settings</h1></div><button class="iconbtn" data-go="' + back + '">&#8592;</button></div>' +
      '<div class="card"><h2>Encryption &amp; data</h2><p class="sub">' + (S ? S.checkins.length : 0) + " check-ins · " + (S ? S.journals.length : 0) + " entries · " + (S ? S.assessments.length : 0) + " screenings · " + (S ? S.exercises.length : 0) + " exercises</p>" +
      '<p id="fpstat"></p>' +
      '<p class="sub" style="margin-top:8px">' + (encrypted
        ? "Everything is sealed with AES-256-GCM under your passphrase (PBKDF2, 150,000 rounds). The key never leaves this device and there is no reset."
        : "Currently unencrypted. Set a passphrase to seal everything.") + "</p>" +
      '<div class="btnrow">' +
      (encrypted
        ? '<button class="btn primary" id="chpass">Change passphrase</button><button class="btn ghost" id="locknow2">Lock now</button>'
        : '<button class="btn primary" id="setupenc">Encrypt now</button>') +
      "<button class=\"btn\" id=\"exp\">Encrypted backup</button>" +
      '<label class="btn ghost" style="cursor:pointer">Restore backup<input type="file" id="imp" accept=".json,.fomh" class="hidden"></label>' +
      '<button class="btn danger" id="wipe">Erase everything</button></div></div>' +
      '<div class="card"><h2>Appearance</h2><div class="btnrow"><button class="btn ' + ((S && S.settings.theme !== "light") ? "primary" : "ghost") + '" id="tdark">Dark</button><button class="btn ' + (S && S.settings.theme === "light" ? "primary" : "ghost") + '" id="tlight">Light</button></div></div>' +
      '<div class="card"><h2>Support (India)</h2><p class="sub">If things feel heavier than self-help, use these. All free.</p>' +
      '<div class="row"><div class="grow"><h4>Tele-MANAS (Govt of India)</h4><p>24×7, 20+ languages</p></div><div class="meta"><b>14416</b></div></div>' +
      '<div class="row"><div class="grow"><h4>AASRA</h4><p>24×7 crisis line</p></div><div class="meta"><b>+91 9820466726</b></div></div>' +
      '<div class="row"><div class="grow"><h4>iCall (TISS)</h4><p>Mon-Sat, 10am-8pm</p></div><div class="meta"><b>+91 9152987821</b></div></div>' +
      '<div class="row"><div class="grow"><h4>Emergency</h4><p>Ambulance</p></div><div class="meta"><b>108</b></div></div></div>' +
      '<div class="card"><h2>About</h2><p class="sub">FO Mhealth is an open-source, offline-first mental wellness companion: mood check-ins, journaling, guided exercises, and validated self-report screens (PHQ-9, GAD-7 — public-domain instruments). Rebuilt from scratch as an original community project, inspired by the feature sets popularized by apps like MindDoc. Not affiliated with any app maker.</p>' +
      '<p class="sub">This is not medical advice, diagnosis, or treatment. If you are struggling, please see a professional.</p></div>';
    if (encrypted) {
      document.getElementById("locknow2").addEventListener("click", lockNow);
      document.getElementById("chpass").addEventListener("click", function () {
        var cur = prompt("Current passphrase");
        if (cur == null) return;
        CRYPTO.open(CRYPTO.store(), cur).then(function () {
          var np = prompt("New passphrase (min 6 chars)");
          if (!np || np.length < 6) { toast("Too short"); return; }
          CRYPTO.init(np).then(function () { save(); toast("Passphrase changed"); });
        }, function () { toast("Wrong current passphrase"); });
      });
    } else {
      document.getElementById("setupenc").addEventListener("click", function () { setupPassScreen("All existing data will be sealed under the passphrase you choose."); });
    }
    document.getElementById("exp").addEventListener("click", function () {
      if (!encrypted) { toast("Set a passphrase first: backups are encrypted"); return; }
      CRYPTO.write(S).then(function () {
        var st = CRYPTO.store();
        var blob = new Blob([JSON.stringify({ kind: "fomhealth-backup", v: 2, iter: st.iter, salt: st.salt, iv: st.iv, ct: st.ct, fp: st.fp, updated: st.updated }, null, 2)], { type: "application/json" });
        var a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "fo-mhealth-vault-" + new Date().toISOString().slice(0, 10) + ".json";
        a.click();
        toast("Encrypted backup saved");
      });
    });
    document.getElementById("imp").addEventListener("change", function (ev) {
      var f = ev.target.files[0]; if (!f) return;
      var r = new FileReader();
      r.onload = function () {
        var d;
        try { d = JSON.parse(r.result); } catch (e) { toast("Not a backup file"); return; }
        if (!d || d.kind !== "fomhealth-backup" || !d.ct) { toast("Not a FO Mhealth backup"); return; }
        var pass = prompt("Backup passphrase");
        if (!pass) return;
        CRYPTO.open(d, pass).then(function (st) {
          var ok = confirm("Restore this backup? It replaces the data currently in this browser.");
          if (!ok) return;
          S = st;
          CRYPTO.write(S).then(function () { toast("Restored & verified"); location.hash = "#/home"; render(); });
        }, function () { toast("Wrong passphrase for that backup"); });
      };
      r.readAsText(f);
    });
    document.getElementById("wipe").addEventListener("click", function () {
      if (confirm("Erase ALL data from this browser? This cannot be undone.")) {
        CRYPTO.wipe(); localStorage.removeItem(LEGACY_KEY);
        S = blank(); encrypted = false; unlocked = true;
        save(); go("#/"); boot();
      }
    });
    document.getElementById("tdark").addEventListener("click", function () { S.settings.theme = "dark"; save(); render(); });
    document.getElementById("tlight").addEventListener("click", function () { S.settings.theme = "light"; save(); render(); });
    bindNav();
  }

  boot();
})();
