/* FO Mhealth — app logic, part 1: state, shell, boot, onboarding, home. All data stays in this browser; storage is AES-256-GCM encrypted (see crypto.js). */
"use strict";
var LEGACY_KEY = "fomhealth.v1"; /* pre-encryption format */
var $app = document.getElementById("app");
var S = null;          /* decrypted state, memory only */
var encrypted = false; /* true once a passphrase protects the store */
var unlocked = false;

function blank() {
    return { profile: null, checkins: [], journals: [], assessments: [], exercises: [], plan: null, journeys: {}, favorites: [], settings: { theme: "dark" } };
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
var GLYPH = {
    breath: '<path d="M3 8h9a2.5 2.5 0 1 0-2.4-3.2M3 12h13a3 3 0 1 1-2.8 4M3 16h7a2 2 0 1 1-1.9 2.6" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>',
    brain: '<path d="M9.5 4.5A3 3 0 0 0 6.7 8 3 3 0 0 0 5 11c0 1.2.7 2.2 1.6 2.7-.4 2 1 3.8 3 3.8h1V4.5a2 2 0 0 0-1.1 0zM14.5 4.5A3 3 0 0 1 17.3 8 3 3 0 0 1 19 11c0 1.2-.7 2.2-1.6 2.7.4 2-1 3.8-3 3.8h-1" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>',
    pen: '<path d="M5 19h14M7 15.5 16.5 6a1.9 1.9 0 0 1 2.7 2.7L9.7 18.2 6 19z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>',
    heart: '<path d="M12 20s-7-4.6-7-9.3C5 8 7 6.2 9.3 6.2c1.2 0 2.2.6 2.7 1.5.5-.9 1.5-1.5 2.7-1.5C17 6.2 19 8 19 10.7 19 15.4 12 20 12 20z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>',
    moon: '<path d="M20 13.5A8 8 0 0 1 10.5 4 8 8 0 1 0 20 13.5z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>',
    sun: '<circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>',
    sense: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" fill="none" stroke="currentColor" stroke-width="1.7"/><circle cx="12" cy="12" r="2.6" fill="none" stroke="currentColor" stroke-width="1.7"/>',
    clock: '<circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M12 7.5V12l3 2" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>',
    body: '<circle cx="12" cy="5" r="2.2" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M12 8v6M12 14l-3 6M12 14l3 6M7.5 10.5c3-1.5 6-1.5 9 0" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>',
    book: '<path d="M12 6.5C10 4.8 7 4.5 4.5 5v13c2.5-.5 5.5-.2 7.5 1.5 2-1.7 5-2 7.5-1.5V5c-2.5-.5-5.5-.2-7.5 1.5zM12 6.5V19.5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>'
  };
function iconGlyph(k) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke-linecap="round" style="width:26px;height:26px;color:var(--accent)">' + (GLYPH[k] || GLYPH.body) + "</svg>";
  }

/* ---------- shell ---------- */
function shell(active, html) {
    var nav = [["home", "home", "Home"], ["journal", "pen", "Journal"], ["assess", "heart", "Check"], ["exercises", "menu", "Gym"], ["insights", "chart", "Trends"]];
    var navHtml = '<nav class="bottomnav"><div class="wrap">' + nav.map(function (n) {
      return '<button class="navbtn' + (active === n[0] ? " on" : "") + '" data-go="#/' + n[0] + '">' + icon(n[1]) + "<span>" + n[2] + "</span></button>";
    }).join("") + "</div></nav>";
    var lock = encrypted && unlocked ? '<button class="iconbtn" id="locknow" title="Lock">&#128274;</button>' : "";
    var themeBtn = S && S.profile ? '<button class="iconbtn" id="themetoggle" title="Light or dark">' + iconGlyph((S.settings && S.settings.theme === "light") ? "moon" : "sun") + "</button>" : "";
    $app.innerHTML =
      '<div class="topbar"><div class="brand"><img src="assets/icon.svg" alt="FO Mhealth"><div><h1>FO Mhealth</h1><small>' + (encrypted ? "encrypted & offline" : "private & offline") + "</small></div></div>" +
      "<div>" + lock + themeBtn + '<button class="iconbtn" data-go="#/settings" title="Settings">' + icon("menu") + "</button></div></div>" +
      html + navHtml +
      '<div class="footer">FO Mhealth is a self-care companion, not a medical product and not a diagnosis. If you are in crisis, use Support in Settings.</div>';
    $app.querySelectorAll("[data-go]").forEach(function (b) {
      b.addEventListener("click", function () { go(b.getAttribute("data-go")); });
    });
    var lb = document.getElementById("locknow");
    if (lb) lb.addEventListener("click", function () { lockNow(); });
    var tb = document.getElementById("themetoggle");
    if (tb) tb.addEventListener("click", function () {
      S.settings.theme = (S.settings.theme === "light") ? "dark" : "light"; save(); render();
    });
  }
function bindNav() {
    $app.querySelectorAll("[data-go]").forEach(function (b) {
      b.addEventListener("click", function () { go(b.getAttribute("data-go")); });
    });
    bindFavs();
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
      myDayCard() + journeyCard() + '<div class="sectiontitle">This week</div>' +
      '<div class="card"><svg class="moodchart" id="wkchart" viewBox="0 0 300 150" preserveAspectRatio="none"></svg></div>' +
      '<div class="sectiontitle">Mind gym</div><div class="grid two">' +
      tile("#/exercises", "breath", "Guided exercises", "Breathing, grounding, CBT tools") +
      tile("#/learn", "brain", "Learn", "Short reads on how minds work") + "</div>" +
      '<div class="sectiontitle">Write</div><div class="grid two">' +
      tile("#/journalNew", "pen", "Journal entry", "Free write or a guided prompt") +
      tile("#/journal", "heart", "Past entries", S.journals.length + " saved, all local") + "</div>";
    shell("home", html);
    drawWeek("wkchart"); bindMyDay(); bindNav();
  }
function tile(href, em, title, sub) {
    return '<button class="tile" data-go="' + href + '"><div class="em">' + iconGlyph(em) + "</div><h3>" + title + "</h3><p>" + sub + "</p></button>";
  }

/* ---------- my day (daily plan) ---------- */
function todayKey() {
    var d = new Date();
    return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2);
  }
function plan() {
    if (!S.plan || S.plan.date !== todayKey()) { S.plan = { date: todayKey(), items: [], done: {} }; }
    return S.plan;
  }
function myDayCard() {
    var p = plan();
    var dn = p.items.filter(function (id) { return p.done[id]; }).length;
    var pct = p.items.length ? Math.round(dn / p.items.length * 100) : 0;
    var html = '<div class="sectiontitle">My day</div><div class="card">' + (p.items.length ? '<div class="planhead">' + ring(pct) + '<div><h2>Today\u2019s plan</h2><p class="sub" style="margin:2px 0 0">' + dn + " of " + p.items.length + " done</p></div></div>" : "<h2>Today\u2019s plan</h2>");
    if (!p.items.length) {
      html += '<p class="sub">Pick a few practices for today. Small and doable beats ambitious.</p><div class="chips">';
      DATA.exercises.slice(0, 6).forEach(function (e) {
        html += '<button class="chip" data-plan-add="' + e.id + '">' + esc(e.title) + "</button>";
      });
      html += "</div>";
    } else {
      html += '<div class="planlist">';
      p.items.forEach(function (id) {
        var e = DATA.exercises.find(function (x) { return x.id === id; });
        if (!e) return;
        var done = !!p.done[id];
        html += '<div class="planrow' + (done ? " done" : "") + '"><button class="plancheck" data-plan-toggle="' + id + '">' + (done ? "\u2713" : "") + "</button><span>" + esc(e.title) + "</span></div>";
      });
      html += '</div><div class="btnrow"><button class="chip" data-plan-add="__more">+ add another</button></div>';
      var all = p.items.every(function (id) { return p.done[id]; });
      if (all) html += '<p class="sub" style="color:var(--accent)">Plan complete. That is the whole point.</p>';
    }
    html += "</div>";
    return html;
  }
function bindMyDay() {
    $app.querySelectorAll("[data-plan-add]").forEach(function (b) {
      b.addEventListener("click", function () {
        var id = b.getAttribute("data-plan-add");
        var p = plan();
        if (id === "__more") {
          var nxt = DATA.exercises.find(function (x) { return p.items.indexOf(x.id) < 0; });
          if (nxt) { p.items.push(nxt.id); } else { toast("All practices are already listed"); }
        } else if (p.items.indexOf(id) < 0) { p.items.push(id); }
        save(); render();
      });
    });
    $app.querySelectorAll("[data-plan-toggle]").forEach(function (b) {
      b.addEventListener("click", function () {
        var id = b.getAttribute("data-plan-toggle");
        var p = plan();
        if (p.done[id]) { delete p.done[id]; } else { p.done[id] = Date.now(); }
        save(); render();
        var p2 = plan();
        if (p2.items.length && p2.items.every(function (x) { return p2.done[x]; }) && !p2.celebrated) {
          p2.celebrated = true; save(); showCongrats("Day complete", "You did everything you picked this morning. That is the whole trick.");
        }
      });
    });
  }

function zoomCardHtml() {
    var zv = (S && S.settings.zoom) || 1;
    var row = [1, 1.15, 1.3].map(function (v) {
      return '<button class="btn ' + (zv === v ? "primary" : "ghost") + '" data-zoom="' + v + '">' + (v === 1 ? "A" : v === 1.15 ? "A+" : "A++") + "</button>";
    }).join("");
    return '<div class="card"><h2>Reading size</h2><div class="btnrow">' + row + '</div><p class="sub">Larger text across the whole app.</p></div>';
  }

/* ---------- helpers: ring, favorites, congrats, count-up ---------- */
function ring(pct) {
    var r = 27, c = 2 * Math.PI * r;
    return '<div class="ring"><svg viewBox="0 0 64 64"><circle class="track" cx="32" cy="32" r="' + r + '"/><circle class="val" cx="32" cy="32" r="' + r + '" stroke-dasharray="' + c.toFixed(1) + '" stroke-dashoffset="' + (c * (1 - pct / 100)).toFixed(1) + '"/></svg><b>' + pct + "%</b></div>";
  }
function favs() { return S.favorites || []; }
function bindFavs() {
    $app.querySelectorAll("[data-fav]").forEach(function (b) {
      b.addEventListener("click", function (ev) {
        ev.stopPropagation();
        var id = b.getAttribute("data-fav");
        if (!S.favorites) S.favorites = [];
        var i = S.favorites.indexOf(id);
        if (i >= 0) S.favorites.splice(i, 1); else S.favorites.push(id);
        save(); render();
      });
    });
  }
function showCongrats(title, sub) {
    var el = document.createElement("div"); el.className = "congrats";
    var sparks = "";
    for (var i = 0; i < 14; i++) {
      var ang = Math.random() * Math.PI * 2, dist = 70 + Math.random() * 100;
      sparks += '<i style="left:50%;top:45%;--dx:' + (Math.cos(ang) * dist).toFixed(0) + 'px;--dy:' + (Math.sin(ang) * dist).toFixed(0) + 'px;animation-delay:' + (Math.random() * 0.2).toFixed(2) + 's"></i>';
    }
    el.innerHTML = '<div class="box"><div class="sparks" style="position:relative">' + sparks + '</div><div class="big">&#127881;</div><h2>' + esc(title || "Done for today") + "</h2><p>" + esc(sub || "Small steps, kept daily, are the whole trick.") + "</p></div>";
    document.body.appendChild(el);
    el.addEventListener("click", function () { el.remove(); });
    setTimeout(function () { if (el.parentNode) el.remove(); }, 3400);
  }
function countUp() {
    $app.querySelectorAll("[data-count]").forEach(function (el) {
      var target = parseFloat(el.getAttribute("data-count")), dec = +(el.getAttribute("data-dec") || 0), t0 = null;
      function frame(t) {
        if (t0 === null) t0 = t;
        var k = Math.min(1, (t - t0) / 750);
        el.textContent = (target * (1 - Math.pow(1 - k, 3))).toFixed(dec);
        if (k < 1) requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    });
  }
