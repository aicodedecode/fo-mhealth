/* FO Mhealth — app logic, part 2: journeys, mind gym, learn, insights, settings, routes. */
"use strict";
/* ---------- journeys ---------- */
function journeyCard() {
    var ids = Object.keys(S.journeys || {});
    if (!ids.length) {
      return '<div class="sectiontitle">Journeys</div><div class="card"><h2>Start a 7-day journey</h2><p class="sub">Structured programs, one small step a day: calmer, better sleep, sharper focus.</p><div class="btnrow"><button class="btn primary" data-go="#/journeys">Browse journeys</button></div></div>';
    }
    var j = DATA.journeys.find(function (x) { return x.id === ids[0]; });
    var st = S.journeys[ids[0]];
    var pct = Math.min(100, Math.round(st.step / j.days.length * 100));
    return '<div class="sectiontitle">Journeys</div><div class="card"><div class="planhead">' + ring(pct) +
      '<div><h2>' + esc(j.title) + '</h2><p class="sub" style="margin:2px 0 0">Day ' + Math.min(st.step + 1, j.days.length) + " of " + j.days.length + (pct >= 100 ? " \u00b7 complete" : "") + '</p></div></div>' +
      '<div class="btnrow"><button class="btn primary" data-go="#/journeyRun/' + ids[0] + '">' + (pct >= 100 ? "Review" : "Continue") + '</button><button class="btn ghost" data-go="#/journeys">All journeys</button></div></div>';
}
function journeys() {
    var html = '<div class="topbar"><div class="brand"><h1>Journeys</h1></div><button class="iconbtn" data-go="#/home">&#8592;</button></div>' +
      '<div class="card"><p class="sub">Multi-day programs: one small step a day, each with a practice to try. Progress stays on this device.</p></div>';
    DATA.journeys.forEach(function (j) {
      var st = S.journeys && S.journeys[j.id];
      var pct = st ? Math.min(100, Math.round(st.step / j.days.length * 100)) : 0;
      html += '<button class="tile" data-go="#/journeyRun/' + j.id + '" style="margin-top:14px;width:100%"><div class="planhead">' + ring(pct) + '<div><h3>' + esc(j.title) + "</h3><p>" + esc(j.sub) + '</p></div></div><p class="sub" style="margin:10px 0 0">' + (st ? (pct >= 100 ? "Complete" : "Day " + Math.min(st.step + 1, j.days.length) + " of " + j.days.length) : "Not started \u00b7 " + j.days.length + " days") + "</p></button>";
    });
    shell("home", html); bindNav();
}
function journeyRun(path) {
    var id = path.split("/")[1];
    var j = DATA.journeys.find(function (x) { return x.id === id; });
    if (!j) { go("#/journeys"); return; }
    if (!S.journeys) S.journeys = {};
    if (!S.journeys[id]) S.journeys[id] = { step: 0, startedAt: Date.now() };
    var st = S.journeys[id];
    function draw() {
      var i = st.step, day = j.days[i];
      var stepsHtml = j.days.map(function (d, k) {
        return '<div class="jstep' + (k < st.step ? " done" : "") + '"><h4>' + esc(d.title) + "</h4>" + (k <= st.step ? "<p>" + esc(d.body) + "</p>" : "") + "</div>";
      }).join("");
      var body = day ?
        '<div class="card"><p class="stepchip">DAY ' + (i + 1) + " OF " + j.days.length + '</p><h2>' + esc(day.title) + '</h2><p style="margin:8px 0 10px">' + esc(day.body) + '</p><div class="banner" style="margin-top:4px"><b>Today\u2019s practice:</b> ' + esc(day.practice) + "</div>" +
        '<div class="btnrow"><button class="btn primary block" id="jnext">' + (st.step >= j.days.length - 1 ? "Complete journey" : "Mark day done") + "</button></div></div>" : "";
      $app.innerHTML =
        '<div class="topbar"><div class="brand"><h1>' + esc(j.title) + "</h1></div><button class='iconbtn' data-go='#/journeys'>&#8592;</button></div>" +
        '<div class="planhead" style="padding:4px 2px 0">' + ring(Math.min(100, Math.round(st.step / j.days.length * 100))) + '<div><h2 style="font-size:15px">' + (st.step >= j.days.length ? "Journey complete" : "Day " + (st.step + 1) + " of " + j.days.length) + '</h2><p class="sub" style="margin:2px 0 0">' + esc(j.sub) + "</p></div></div>" +
        body + '<div class="card"><p class="sub" style="margin-bottom:8px">All days</p>' + stepsHtml + "</div>";
      var nb = document.getElementById("jnext");
      if (nb) nb.addEventListener("click", function () {
        st.step++;
        save(); render();
        if (st.step >= j.days.length) showCongrats(j.title + " complete", "Seven days of showing up. Keep what worked.");
      });
      bindNav();
    }
    draw();
}

/* ---------- mood chart ---------- */
function moodsSeries(ndays) {
    var out = [], d = new Date();
    for (var i = ndays - 1; i >= 0; i--) {
      var dd = new Date(d); dd.setDate(d.getDate() - i);
      var day = S.checkins.filter(function (c) { return sameDay(c.ts, dd); });
      var avg = day.length ? day.reduce(function (a, c) { return a + c.mood; }, 0) / day.length : null;
      out.push({ label: dd.toLocaleDateString(undefined, { weekday: "narrow" }), mood: avg });
    }
    return out;
}
function drawChart(id, ndays) {
    var svg = document.getElementById(id); if (!svg) return;
    var w = 300, h = 150, pad = 22, step = (w - pad * 2) / (ndays - 1), pts = [];
    var data = moodsSeries(ndays);
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
      s += '<polyline pathLength="1" class="chartline" points="' + pts.map(function (p) { return p[0].toFixed(1) + "," + p[1].toFixed(1); }).join(" ") + '" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>';
    }
    pts.forEach(function (p, i) { s += '<circle class="chartdot" style="animation-delay:' + (0.15 + i * 0.05).toFixed(2) + 's" cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="3.5" fill="var(--accent)"/>'; });
    var every = ndays > 10 ? 5 : 1;
    data.forEach(function (d, i) {
      if (i % every) return;
      s += '<text x="' + (pad + i * step) + '" y="' + (h - 6) + '" fill="rgba(128,150,170,.7)" font-size="10" text-anchor="middle">' + d.label + "</text>";
    });
    if (!pts.length) s += '<text x="150" y="75" fill="rgba(128,150,170,.6)" font-size="12" text-anchor="middle">No check-ins yet. Yours is 60 seconds away.</text>';
    svg.innerHTML = s;
}
function drawWeek(id) { drawChart(id, 7); }

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
    html += '<div class="searchbox"><span class="sic">&#128269;</span><input type="text" id="jsearch" placeholder="Search entries" autocomplete="off"></div><div class="card"><div id="jlist">';
    if (!items.length) html += '<p class="sub">Nothing written yet. A blank page and a prompt is a good combo.</p>';
    items.forEach(function (j) {
      var q = ((j.title || "") + " " + j.text).toLowerCase();
      html += '<div class="row" data-q="' + esc(q) + '"><div class="ic">&#9997;&#65039;</div><div class="grow"><h4>' + esc(j.title || (j.text || "").slice(0, 48) || "Untitled") + "</h4><p>" + esc((j.text || "").slice(0, 80)) + '</p></div><div class="meta">' + fmt(j.ts) + "</div></div>";
    });
    html += "</div></div>";
    shell("journal", html); bindNav();
    var sbox = document.getElementById("jsearch");
    if (sbox) sbox.addEventListener("input", function () {
      var q = sbox.value.toLowerCase();
      $app.querySelectorAll("#jlist .row").forEach(function (r) {
        r.style.display = (r.getAttribute("data-q") || "").indexOf(q) >= 0 ? "" : "none";
      });
    });
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
        '<div class="card"><div class="q"><p>' + esc(q) + "</p><div class='opts'>" + opts + "</div></div></div>";
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
    var favsL = DATA.exercises.filter(function (e) { return favs().indexOf(e.id) >= 0; });
    var html = '<div class="topbar"><div class="brand"><h1>Mind gym</h1></div><button class="btn small primary" data-go="#/learn">Learn</button></div>' +
      '<div class="card"><p class="sub">Short guided practices. Done ' + S.exercises.length + " times so far.</p></div>";
    if (favsL.length) {
      html += '<div class="sectiontitle">Favorites</div><div class="grid two">';
      favsL.forEach(function (e) { html += tileEx(e); });
      html += "</div>";
    }
    Object.keys(cats).forEach(function (cat) {
      html += '<div class="sectiontitle">' + esc(cat) + '</div><div class="grid two">';
      cats[cat].forEach(function (e) {
        html += tileEx(e);
      });
      html += "</div>";
    });
    shell("exercises", html); bindNav();
}
function tileEx(e) {
    var n = S.exercises.filter(function (x) { return x.exerciseId === e.id; }).length;
    return '<button class="tile" data-go="#/exerciseRun/' + e.id + '"><div class="em">' + iconGlyph(e.em) + "</div><h3>" + esc(e.title) + (n ? ' <span class="badge b">×' + n + "</span>" : "") + "</h3><p>" + esc(e.sub) + "</p></button>";
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
      if (st.type === "breath") body = '<div class="center"><div class="breathring deflate" id="bc"><div><div id="bl" style="font-weight:700">Breathe in</div><div id="bc2" style="font-size:13px;color:var(--ink3)"></div></div></div><p class="sub">' + esc(st.label) + "</p></div>";
      else if (st.type === "pace") body = '<div class="center"><div class="timerdigit" id="pd">--</div><p class="sub" style="margin-top:8px">' + esc(st.label) + "</p></div>";
      else if (st.type === "write") body = (st.lines ? '<textarea rows="' + Math.max(3, st.lines) + '" id="w"></textarea>' : "<p class='sub'>" + esc(st.label) + "</p>");
      var fav = favs().indexOf(e.id) >= 0;
      $app.innerHTML =
        '<div class="topbar"><div class="brand"><h1>' + esc(e.title) + '</h1></div><div style="display:flex;gap:8px"><button class="iconbtn" data-fav="' + e.id + '" title="Save to favorites">' + (fav ? "\u2605" : "\u2606") + '</button><button class="iconbtn" data-go="#/exercises">&#215;</button></div></div>' +
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
      if (phase === 0) { bc.className = "breathring"; bc.style.transitionDuration = st.pattern[phase] + "s"; }
      else if (phase === 2) { bc.className = "breathring deflate"; bc.style.transitionDuration = st.pattern[phase] + "s"; }
      left--;
    }
    tick();
    breathTimer = setInterval(tick, 1000);
}

/* ---------- learn ---------- */
function learn() {
    var html = '<div class="topbar"><div class="brand"><h1>Learn</h1></div><button class="btn small primary" data-go="#/exercises">Gym</button></div>' +
      '<div class="card"><p class="sub">Three-minute reads on how minds actually work. Plain language, no fluff.</p></div><div class="grid two">';
    var favL = DATA.lessons.filter(function (l) { return favs().indexOf(l.id) >= 0; });
    if (favL.length) {
      html += '<div class="sectiontitle">Favorites</div><div class="grid two">';
      favL.forEach(function (l) { html += tileLesson(l); });
      html += "</div>";
    }
    DATA.lessons.forEach(function (l) {
      html += tileLesson(l);
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
      '<div class="topbar"><div class="brand"><h1>' + esc(l.title) + '</h1></div><div style="display:flex;gap:8px"><button class="iconbtn" data-fav="' + l.id + '" title="Save to favorites">' + (favs().indexOf(l.id) >= 0 ? "\u2605" : "\u2606") + '</button><button class="iconbtn" data-go="#/learn">&#8592;</button></div></div>' +
      '<div class="card"><p class="stepchip">' + l.minutes + " MIN READ</p>" + body + "</div>" +
      '<div class="card"><p class="sub">Reading helps most when it moves. Try a related exercise next.</p><div class="btnrow"><button class="btn primary" data-go="#/exercises">Open mind gym</button></div></div>';
    bindNav();
}

function tileLesson(l) {
    return '<button class="tile" data-go="#/lessonRun/' + l.id + '"><div class="em">' + iconGlyph("book") + '</div><h3>' + esc(l.title) + "</h3><p>" + l.minutes + " min read</p></button>";
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
      '<div class="grid three"><div class="stat"><b' + (avg ? ' data-count="' + avg + '" data-dec="1"' : "") + '>' + (avg || "–") + '</b><span>avg mood</span></div>' +
      '<div class="stat"><b' + (sleepAvg ? ' data-count="' + sleepAvg + '" data-dec="1"' : "") + '>' + (sleepAvg || "–") + 'h</b><span>avg sleep</span></div>' +
      '<div class="stat"><b' + (n ? ' data-count="' + n + '" data-dec="0"' : "") + '>' + n + '</b><span>check-ins</span></div></div>' +
      '<div class="card"><h2>Last 30 days</h2><svg class="moodchart" id="m30" viewBox="0 0 300 150" preserveAspectRatio="none"></svg></div>';
    if (topTags.length) {
      var maxT = tagCount[topTags[0]];
      html += '<div class="card"><h2>What shows up most</h2>';
      topTags.forEach(function (t) {
        html += '<div style="margin-top:10px"><div style="display:flex;justify-content:space-between;font-size:12.5px"><span>' + esc(t) + '</span><span style="color:var(--ink3)">' + tagCount[t] + "</span></div>" +
          '<div class="tagbar"><i style="--w:' + Math.round(tagCount[t] / maxT * 100) + '%"></i></div></div>';
      });
      html += "</div>";
    }
    var rows = S.checkins.slice().sort(function (a, b) { return b.ts - a.ts; }).slice(0, 10);
    html += '<div class="sectiontitle">Recent check-ins</div><div class="card">';
    if (!rows.length) html += "<p class='sub'>No data yet.</p>";
    rows.forEach(function (c) {
      html += '<div class="row"><div class="ic">' + face(DATA.moods[c.mood - 1].face) + "</div><div class='grow'><h4>" + DATA.moods[c.mood - 1].label + " · " + esc(c.part) + "</h4><p>" + esc(c.note || (c.tags || []).join(", ") || "no note") + "</p></div><div class='meta'>" + fmt(c.ts) + "</div></div>";
    });
    html += "</div>";
    shell("insights", html);
    drawChart("m30", 30); bindNav(); countUp();
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
      '<div class="card"><h2>Appearance</h2><div class="btnrow"><button class="btn ' + ((S && S.settings.theme !== "light") ? "primary" : "ghost") + '" id="tdark">Dark</button><button class="btn ' + (S && S.settings.theme === "light" ? "primary" : "ghost") + '" id="tlight">Light</button></div></div>' + zoomCardHtml() +

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
    $app.querySelectorAll("[data-zoom]").forEach(function (b) {
      b.addEventListener("click", function () { S.settings.zoom = +b.getAttribute("data-zoom"); save(); render(); });
    });
    bindNav();
}

/* ---------- routes ---------- */
var routes = {
    "": home, home: home, onboarding: onboarding, checkin: checkin, journal: journal,
    journalNew: journalNew, assess: assess, assessRun: assessRun, exercises: exercises,
    exerciseRun: exerciseRun, learn: learn, lessonRun: lessonRun, insights: insights, journeys: journeys, journeyRun: journeyRun, settings: settings
};
function render() {
    document.documentElement.setAttribute("data-theme", (S && S.settings && S.settings.theme) || "dark");
    $app.style.zoom = (S && S.settings && S.settings.zoom) || 1;
    if (!unlocked) { boot(); return; }
    var path = (location.hash || "#/").replace(/^#\//, "");
    var h = path.split("/")[0];
    if ((!S || !S.profile) && h !== "settings") { if (!S) S = blank(); routes.onboarding(path); return; }
    (routes[h] || home)(path);
    $app.classList.remove("view-enter"); void $app.offsetWidth; $app.classList.add("view-enter");
    window.scrollTo(0, 0);
}
window.addEventListener("hashchange", render);
boot();