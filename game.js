/* Treasure Diver — underwater integer chests. Mobile-first sample. */
(function () {
  'use strict';

  const API_NS = 'bnhs-tdiver-nov10-2026';
  const API = 'https://mantledb.sh/v2/' + API_NS;
  const API_EXPORT = 'https://mantledb.sh/v2/export/' + API_NS;
  const ADM_API =
    'https://script.google.com/macros/s/AKfycbwGMSP8NmPT4GYMJZTw4qruizfFd5wzORZHZRM-HOUJOSQyyg3Gx20L5MEWsqT5EFdl-w/exec';

  const LEVELS = 5;
  const ITEMS = 20;
  const LIVES = 3;
  const MAX_LIVES = 5;
  const MAX_ATTEMPTS = 1;
  const BASE_PTS = [0, 10, 20, 30, 40, 50];
  const ITEM_SEC = [0, 10, 9, 8, 8, 9];
  const MAX_PLAUSIBLE = 5000;
  const DEMO =
    /(?:\?|&)(?:demo|test)=1(?:&|$)/.test(location.search || '') ||
    location.hash === '#demo';

  const SESSION_LABEL = 'ADM Activity · Nov. 10, 2026';
  const SESSION_DATE = 'Nov. 10, 2026';
  const SESSION_ISO = '2026-11-10';
  const SESSION_KEY = 'nov10';
  // Scored play for the Nov. 10 ADM activity stays in the same score namespace.
  // Window (Asia/Manila): Nov 9, 2026 12:00 AM through Nov 13, 2026 11:59 PM. Demo always works. 1-try rule unchanged.
  const OPEN_FROM_MS = Date.parse('2026-11-09T00:00:00+08:00');
  const OPEN_UNTIL_MS = Date.parse('2026-11-13T23:59:59.999+08:00');
  function isSessionOpen() {
    var now = Date.now();
    return now >= OPEN_FROM_MS && now <= OPEN_UNTIL_MS;
  }


  function sessionClosedMessage() {
    return 'This Nov. 10 ADM activity is open through Nov. 13, 2026, 11:59 PM (Asia/Manila). Use ?demo=1 to practice anytime.';
  }

  // ---- Web Audio ----
  const Sound = (function () {
    let ctx = null, master = null, musicGain = null, sfxGain = null;
    let unlocked = false;
    let enabled = localStorage.getItem('td-sound') !== '0';
    let musicTimer = null, humOsc = null, humGain = null, level = 1;

    function ensure() {
      if (ctx) return ctx;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = enabled ? 0.7 : 0;
      master.connect(ctx.destination);
      musicGain = ctx.createGain();
      musicGain.gain.value = 0.18;
      musicGain.connect(master);
      sfxGain = ctx.createGain();
      sfxGain.gain.value = 0.55;
      sfxGain.connect(master);
      return ctx;
    }
    function unlock() {
      const c = ensure();
      if (!c) return;
      if (c.state === 'suspended') c.resume().catch(function () {});
      if (!unlocked) {
        unlocked = true;
        const o = c.createOscillator(), g = c.createGain();
        g.gain.value = 0.0001;
        o.connect(g); g.connect(master);
        o.start(); o.stop(c.currentTime + 0.01);
        if (enabled) startMusic(level);
      }
    }
    function setEnabled(on) {
      enabled = !!on;
      localStorage.setItem('td-sound', enabled ? '1' : '0');
      ensure();
      if (master) master.gain.setTargetAtTime(enabled ? 0.7 : 0, ctx.currentTime, 0.05);
      if (enabled && unlocked) startMusic(level); else stopMusic();
      paintBtn();
    }
    function toggle() { setEnabled(!enabled); }
    function paintBtn() {
      const b = document.getElementById('btn-sound');
      if (!b) return;
      b.textContent = enabled ? '🔊 On' : '🔇 Off';
      b.setAttribute('aria-pressed', enabled ? 'true' : 'false');
    }
    function tone(freq, dur, type, gain, when) {
      const c = ensure();
      if (!c || !enabled || !unlocked) return;
      const t0 = when != null ? when : c.currentTime;
      const o = c.createOscillator(), g = c.createGain();
      o.type = type || 'sine';
      o.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(gain || 0.3, t0 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(g); g.connect(sfxGain);
      o.start(t0); o.stop(t0 + dur + 0.02);
    }
    function ding() {
      const c = ensure(); if (!c) return;
      const t = c.currentTime;
      tone(880, 0.12, 'sine', 0.35, t);
      tone(1320, 0.18, 'sine', 0.25, t + 0.06);
    }
    function buzz() {
      const c = ensure(); if (!c) return;
      const t = c.currentTime;
      tone(140, 0.22, 'sawtooth', 0.22, t);
      tone(90, 0.28, 'square', 0.12, t + 0.04);
    }
    function twang() { bubble(); }
    function bubble() {
      const c = ensure(); if (!c) return;
      const t = c.currentTime;
      tone(380 + Math.random() * 120, 0.1, 'sine', 0.12, t);
      tone(220 + Math.random() * 80, 0.16, 'triangle', 0.08, t + 0.05);
    }
    function chestOpen() {
      const c = ensure(); if (!c) return;
      const t = c.currentTime;
      [392, 523, 659, 784].forEach(function (f, i) { tone(f, 0.14, 'triangle', 0.28, t + i * 0.07); });
      tone(1046, 0.2, 'sine', 0.15, t + 0.28);
    }
    function sharkBite() {
      const c = ensure(); if (!c) return;
      const t = c.currentTime;
      tone(90, 0.18, 'sawtooth', 0.3, t);
      tone(60, 0.25, 'square', 0.18, t + 0.05);
      tone(140, 0.12, 'sawtooth', 0.15, t + 0.12);
    }
    function heartbeat() {
      const c = ensure(); if (!c) return;
      const t = c.currentTime;
      tone(70, 0.08, 'sine', 0.35, t);
      tone(55, 0.12, 'sine', 0.22, t + 0.16);
    }
    function bonusLife() {
      const c = ensure(); if (!c) return;
      const t = c.currentTime;
      [523, 659, 784, 988, 1175].forEach(function (f, i) { tone(f, 0.13, 'sine', 0.28, t + i * 0.07); });
      tone(1568, 0.22, 'triangle', 0.18, t + 0.38);
    }
    function levelUp() {
      const c = ensure(); if (!c) return;
      const t = c.currentTime;
      [523, 659, 784, 1046].forEach(function (f, i) { tone(f, 0.12, 'sine', 0.22, t + i * 0.08); });
    }
    function stopMusic() {
      if (musicTimer) { clearInterval(musicTimer); musicTimer = null; }
      if (humOsc) { try { humOsc.stop(); } catch (e) {} humOsc = null; }
      if (humGain) humGain = null;
    }
    function startMusic(lv) {
      level = lv || level;
      const c = ensure();
      if (!c || !enabled || !unlocked) return;
      stopMusic();
      // Deep underwater hum
      humOsc = c.createOscillator();
      humGain = c.createGain();
      humOsc.type = 'sine';
      humOsc.frequency.value = 55 + level * 4;
      humGain.gain.value = 0.05;
      humOsc.connect(humGain); humGain.connect(musicGain);
      humOsc.start();
      const roots = [98, 110, 131, 147, 165, 196];
      musicTimer = setInterval(function () {
        if (!enabled || !unlocked) return;
        const f = roots[(Math.random() * roots.length) | 0];
        tone(f, 0.55, 'sine', 0.06, c.currentTime);
        tone(f * 1.5, 0.4, 'triangle', 0.035, c.currentTime + 0.15);
        // occasional bubble ping
        if (Math.random() < 0.35) tone(400 + Math.random() * 200, 0.12, 'sine', 0.04, c.currentTime + 0.2);
      }, 1100 - Math.min(350, level * 50));
    }
    function setLevel(lv) {
      level = lv;
      if (humOsc) humOsc.frequency.setTargetAtTime(55 + level * 4, (ctx && ctx.currentTime) || 0, 0.3);
    }
    return { unlock, toggle, setEnabled, paintBtn, ding, buzz, twang, bubble, chestOpen, sharkBite, heartbeat, bonusLife, levelUp, startMusic, stopMusic, setLevel };
  })();

  function $(id) { return document.getElementById(id); }
  const screens = {
    start: $('screen-start'),
    game: $('screen-game'),
    summary: $('screen-summary'),
    board: $('screen-board'),
  };
  function show(name) {
    Object.keys(screens).forEach(function (k) {
      screens[k].classList.toggle('active', k === name);
    });
  }

  let learners = [];
  let player = { name: '', grade: '', section: '' };
  let progress = blankProgress();
  let attempt = null;
  let run = null;
  let raf = 0;
  let shakeT = 0;
  let particles = [];

  function blankProgress() {
    return { attemptsUsed: 0, bestTotal: 0, bestLevel: 0, attemptScores: [] };
  }
  function keyOf(p) {
    return norm(p.name) + '-g' + String(p.grade).replace(/\D/g, '');
  }
  function norm(s) {
    return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 48) || 'anon';
  }
  function gradeNum(g) {
    const m = String(g || '').match(/(\d+)/);
    return m ? m[1] : String(g);
  }
  function loadLocal() {
    try {
      const raw = localStorage.getItem('td-progress-nov10-' + keyOf(player));
      if (raw) {
        const p = JSON.parse(raw);
        progress.attemptsUsed = Math.max(0, Number(p.attemptsUsed) || 0);
        progress.bestTotal = Math.max(0, Number(p.bestTotal) || 0);
        progress.bestLevel = Math.max(0, Number(p.bestLevel) || 0);
        progress.attemptScores = Array.isArray(p.attemptScores) ? p.attemptScores : [];
        if (p.openAttempt && typeof p.openAttempt === 'object') {
          progress.openAttempt = {
            num: Math.max(1, Number(p.openAttempt.num) || 1),
            score: Math.max(0, Number(p.openAttempt.score) || 0),
            bestLevel: Math.max(0, Number(p.openAttempt.bestLevel) || 0),
            totalCorrect: Math.max(0, Number(p.openAttempt.totalCorrect) || 0),
            nextLevel: clampLevel(p.openAttempt.nextLevel),
            awaitingNext: !!p.openAttempt.awaitingNext,
          };
        } else {
          clearOpenAttempt();
        }
      }
    } catch (e) {}
  }
  function saveLocal() {
    try {
      localStorage.setItem('td-progress-nov10-' + keyOf(player), JSON.stringify(progress));
    } catch (e) {}
  }


  function clampLevel(n) {
    n = Math.max(1, Math.min(LEVELS, Number(n) || 1));
    return n | 0;
  }

  function clearOpenAttempt() {
    if (progress && progress.openAttempt) delete progress.openAttempt;
  }

  /** Persist in-progress attempt. Mid-level: keep banked score only (restart that level). */
  function snapshotOpenAttempt(opts) {
    opts = opts || {};
    if (DEMO || !attempt || !attempt.active || !player || !player.name) return;
    var nextLevel = opts.nextLevel != null ? opts.nextLevel : 1;
    var awaitingNext = !!opts.awaitingNext;
    progress.openAttempt = {
      num: attempt.num,
      score: Math.max(0, Number(attempt.score) || 0),
      bestLevel: Math.max(0, Number(attempt.bestLevel) || 0),
      totalCorrect: Math.max(0, Number(attempt.totalCorrect) || 0),
      nextLevel: clampLevel(nextLevel),
      awaitingNext: awaitingNext,
    };
    saveLocal();
  }

  function persistOpenAttemptOnHide() {
    if (DEMO || !attempt || !attempt.active) return;
    if (run && run.over) {
      if (run.level < LEVELS) {
        snapshotOpenAttempt({ nextLevel: run.level + 1, awaitingNext: true });
      }
    } else if (run && !run.over) {
      snapshotOpenAttempt({ nextLevel: run.level, awaitingNext: false });
    } else {
      snapshotOpenAttempt({ nextLevel: 1, awaitingNext: false });
    }
  }


  async function fetchRemoteRecord() {
    try {
      const r = await fetch(API + '/scores/' + keyOf(player) + '?t=' + Date.now());
      if (!r.ok) return null;
      const j = await r.json();
      if (j && j.error) return null;
      if (j && j.name) return j;
      return null;
    } catch (e) { return null; }
  }
  function mergeRemote(rec) {
    if (!rec) return;
    const keepOpen = progress.openAttempt;
    progress.attemptsUsed = Math.max(progress.attemptsUsed, Math.max(0, Number(rec.attempts) || 0));
    progress.bestTotal = Math.max(progress.bestTotal, Math.max(0, Number(rec.total) || 0));
    progress.bestLevel = Math.max(progress.bestLevel, Math.max(0, Number(rec.bestLevel) || 0));
    if (Array.isArray(rec.attemptScores) && rec.attemptScores.length) {
      const set = new Set(progress.attemptScores.concat(rec.attemptScores.map(Number)));
      progress.attemptScores = [...set].filter(function (n) { return Number.isFinite(n); });
    }
    if (progress.attemptsUsed >= MAX_ATTEMPTS) {
      clearOpenAttempt();
    } else if (keepOpen) {
      progress.openAttempt = keepOpen;
    }
    saveLocal();
  }
  async function fetchBoard() {
    try {
      const r = await fetch(API_EXPORT + '?t=' + Date.now());
      const j = await r.json();
      const entries = [];
      const bag = (j && j.entries) || {};
      Object.keys(bag).forEach(function (path) {
        if (path.indexOf('scores/') === 0 && bag[path] && bag[path].name) entries.push(bag[path]);
      });
      return entries.filter(function (e) { return Number(e.total) <= MAX_PLAUSIBLE; });
    } catch (e) {
      try { return JSON.parse(localStorage.getItem('td-local-board-nov10') || '[]'); }
      catch (e2) { return []; }
    }
  }
  async function submitRecord(entry) {
    const local = JSON.parse(localStorage.getItem('td-local-board-nov10') || '[]');
    const idx = local.findIndex(function (e) {
      return norm(e.name) === norm(entry.name) && String(e.grade) === String(entry.grade);
    });
    if (idx >= 0) local[idx] = entry; else local.push(entry);
    localStorage.setItem('td-local-board-nov10', JSON.stringify(local));
    try {
      const path = API + '/scores/' + keyOf(entry);
      let best = Object.assign({}, entry);
      try {
        const prev = await (await fetch(path + '?t=' + Date.now())).json();
        if (prev && prev.name) {
          best.total = Math.max(Number(prev.total) || 0, Number(entry.total) || 0);
          best.bestLevel = Math.max(Number(prev.bestLevel) || 0, Number(entry.bestLevel) || 0);
          best.attempts = Math.min(MAX_ATTEMPTS, Math.max(Number(prev.attempts) || 0, Number(entry.attempts) || 0));
          const scores = []
            .concat(Array.isArray(prev.attemptScores) ? prev.attemptScores : [])
            .concat(Array.isArray(entry.attemptScores) ? entry.attemptScores : [])
            .map(Number).filter(function (n) { return Number.isFinite(n); });
          best.attemptScores = [...new Set(scores)].slice(-4);
          if ((Number(prev.attempts) || 0) >= MAX_ATTEMPTS) {
            best.attempts = MAX_ATTEMPTS;
            if (Array.isArray(prev.attemptScores) && prev.attemptScores.length >= MAX_ATTEMPTS) {
              best.attemptScores = prev.attemptScores.slice(0, MAX_ATTEMPTS);
            }
          }
          if ((Number(prev.total) || 0) > (Number(entry.total) || 0)) {
            best.name = prev.name;
            best.section = prev.section || entry.section;
          }
        }
      } catch (e) {}
      if (Number(best.total) > MAX_PLAUSIBLE) return false;
      best.attempts = Math.min(MAX_ATTEMPTS, Math.max(0, Number(best.attempts) || 0));
      const postRes = await fetch(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(best),
      });
      if (!postRes || !postRes.ok) return false;
      try { const pj = await postRes.clone().json(); if (pj && pj.success === false) return false; } catch (e) {}
      return true;
    } catch (e) { return false; }
  }


  /* ---- Reliable upload: pending queue + retry (added Nov 6 2026) ---- */
  var remoteConfirmed = false;
  function pendingKey(p) { return 'td-pending-nov10-' + keyOf(p); }
  function setPending(entry) {
    if (DEMO) return;
    try { localStorage.setItem(pendingKey(entry), JSON.stringify(entry)); } catch (e) {}
  }
  function clearPending(entry) {
    try { localStorage.removeItem(pendingKey(entry)); } catch (e) {}
  }
  function hasPending() {
    try { return !!(player && localStorage.getItem(pendingKey(player))); } catch (e) { return false; }
  }
  function sleepMs(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  async function submitWithRetry(entry) {
    if (DEMO) return false;
    var waits = [0, 1500, 4000, 9000];
    for (var i = 0; i < waits.length; i++) {
      if (waits[i]) await sleepMs(waits[i]);
      var ok = false;
      try { ok = await submitRecord(entry); } catch (e) { ok = false; }
      if (ok) { clearPending(entry); remoteConfirmed = true; return true; }
    }
    return false;
  }
  var flushing = false;
  async function flushPending() {
    if (DEMO || flushing) return;
    flushing = true;
    var keys = [];
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k && k.indexOf('td-pending-nov10-') === 0) keys.push(k);
      }
      for (var j = 0; j < keys.length; j++) {
        var e = null;
        try { e = JSON.parse(localStorage.getItem(keys[j]) || 'null'); } catch (x) {}
        if (!e || !e.name) { localStorage.removeItem(keys[j]); continue; }
        await submitWithRetry(e);
      }
    } finally { flushing = false; }
    try { if (keys.length && player && progress) paintLobby(); } catch (e) {}
  }
  function afterRemote(rec) {
    if (DEMO || !player) return;
    remoteConfirmed = !!(rec && rec.name && Number(rec.total) >= Number(progress.bestTotal || 0) && Number(rec.attempts) >= 1);
    // Heal old phones: try used locally but no confirmed server row -> queue upload.
    if (!remoteConfirmed && progress.attemptsUsed >= MAX_ATTEMPTS && !hasPending()) {
      setPending({
        name: player.name, grade: player.grade, section: player.section || '',
        total: progress.bestTotal, bestLevel: progress.bestLevel,
        attempts: progress.attemptsUsed, attemptScores: (progress.attemptScores || []).slice(-4),
        ts: Date.now(),
        date: SESSION_ISO,
        admDate: SESSION_DATE,
        session: SESSION_KEY,
      });
    }
    if (hasPending()) flushPending();
  }
  function boardNote() {
    if (hasPending()) return 'Saved on this phone only — not yet on the leaderboard. It will upload automatically when you are online (reopen this page with internet).';
    if (remoteConfirmed) return 'That score is on the leaderboard.';
    return 'Checking the leaderboard… open this page with internet to confirm.';
  }
  if (!DEMO) {
    window.addEventListener('online', function () { flushPending(); });
    document.addEventListener('visibilitychange', function () { if (!document.hidden) flushPending(); });
    setInterval(function () { if (navigator.onLine !== false) flushPending(); }, 30000);
    setTimeout(flushPending, 1500);
  }

  const MEDALS = ['', '🥇', '🥈', '🥉'];
  function sortBoard(list) {
    return list.slice().sort(function (a, b) {
      const pt = Number(b.total) - Number(a.total);
      if (pt) return pt;
      const lv = Number(b.bestLevel || 0) - Number(a.bestLevel || 0);
      if (lv) return lv;
      const ta = Number(a.ts) || Number.MAX_SAFE_INTEGER;
      const tb = Number(b.ts) || Number.MAX_SAFE_INTEGER;
      return ta - tb;
    });
  }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function renderBoard(entries, filter) {
    const tb = $('board-body');
    tb.innerHTML = '';
    let list = entries.slice();
    if (filter === '11' || filter === '12') {
      list = list.filter(function (e) { return String(e.grade) === filter; });
    }
    list = sortBoard(list);
    var isGrade = (filter === '11' || filter === '12');
    var shown = isGrade ? list : list.slice(0, 10);
    var cap = document.getElementById('board-caption');
    if (cap) {
      if (!list.length) {
        cap.textContent = isGrade ? ('Grade ' + filter + ' · no scores yet') : 'Overall · no scores yet';
      } else if (isGrade) {
        cap.textContent = 'Grade ' + filter + ' · all ' + list.length + ' player' + (list.length === 1 ? '' : 's');
      } else {
        cap.textContent = 'Overall · Top 10' + (list.length > 10 ? ' of ' + list.length : '');
      }
    }
    if (!list.length) {
      tb.innerHTML = '<tr><td colspan="5" class="muted">No scores yet</td></tr>';
      return;
    }
    shown.forEach(function (e, i) {
      const rank = i + 1;
      const tr = document.createElement('tr');
      if (rank <= 3) tr.className = 'rank-' + rank;
      const medal = MEDALS[rank] || '';
      const gs = 'G' + esc(e.grade) + (e.section ? ' · ' + esc(e.section) : '');
      tr.innerHTML =
        '<td class="rank-cell">' + (medal ? medal + ' ' : '') + rank + '</td>' +
        '<td>' + esc(e.name) + '</td>' +
        '<td class="gs">' + gs + '</td>' +
        '<td class="pts">' + Number(e.total) + '</td>' +
        '<td class="lvl">L' + Number(e.bestLevel || 0) + '</td>';
      tb.appendChild(tr);
    });
  }

  // ---- Master list ----
  async function loadLearners() {
    const status = $('load-status');
    try {
      const r = await fetch(ADM_API + '?action=config&t=' + Date.now());
      const j = await r.json();
      learners = Array.isArray(j.learners) ? j.learners.filter(function (x) { return x && x.n && x.g && x.s; }) : [];
      if (!learners.length) {
        status.textContent = 'Class list empty — ask your teacher.';
        return;
      }
      const grades = [...new Set(learners.map(function (x) { return gradeNum(x.g); }))].sort();
      const gSel = $('inp-grade');
      gSel.innerHTML = '<option value="">Select grade</option>';
      grades.forEach(function (g) {
        const o = document.createElement('option');
        o.value = g; o.textContent = 'Grade ' + g;
        gSel.appendChild(o);
      });
      const g11 = learners.filter(function (x) { return gradeNum(x.g) === '11'; }).length;
      const g12 = learners.filter(function (x) { return gradeNum(x.g) === '12'; }).length;
      status.textContent = 'Loaded ' + learners.length + ' learners (G11: ' + g11 + ', G12: ' + g12 + ').';
      $('btn-play').disabled = true;
    } catch (e) {
      status.textContent = 'Could not load class list. Check connection / try again.';
      $('inp-grade').innerHTML = '<option value="">Unavailable</option>';
    }
  }
  function fillSections() {
    const g = $('inp-grade').value;
    const sSel = $('inp-section'), nSel = $('inp-name');
    nSel.innerHTML = '<option value="">Select section first</option>';
    nSel.disabled = true;
    $('btn-play').disabled = true;
    if (!g) {
      sSel.innerHTML = '<option value="">Select grade first</option>';
      sSel.disabled = true;
      return;
    }
    const secs = [...new Set(learners.filter(function (x) { return gradeNum(x.g) === g; }).map(function (x) { return x.s; }))].sort();
    sSel.innerHTML = '<option value="">Select section</option>';
    secs.forEach(function (s) {
      const o = document.createElement('option');
      o.value = s; o.textContent = s;
      sSel.appendChild(o);
    });
    sSel.disabled = false;
  }
  function fillNames() {
    const g = $('inp-grade').value, s = $('inp-section').value;
    const nSel = $('inp-name');
    $('btn-play').disabled = true;
    if (!g || !s) {
      nSel.innerHTML = '<option value="">Select section first</option>';
      nSel.disabled = true;
      return;
    }
    const names = learners.filter(function (x) { return gradeNum(x.g) === g && x.s === s; })
      .map(function (x) { return x.n; }).sort(function (a, b) { return a.localeCompare(b); });
    nSel.innerHTML = '<option value="">Select your name</option>';
    names.forEach(function (n) {
      const o = document.createElement('option');
      o.value = n; o.textContent = n;
      nSel.appendChild(o);
    });
    nSel.disabled = false;
  }
  $('inp-grade').onchange = fillSections;
  $('inp-section').onchange = fillNames;
  $('inp-name').onchange = function () { $('btn-play').disabled = !$('inp-name').value; };

  // ---- Canvas / diver gameplay ----
  const canvas = $('game');
  const ctx = canvas.getContext('2d');
  let W = 360, H = 640, dpr = 1;
  let tapChest = true;
  let keys = Object.create(null);
  let pointer = { down: false, x: 0, y: 0 };
  let warnFlash = 0;
  let heartBeatAcc = 0;
  let animT = 0;
  let bgCache = null, bgCacheKey = '';

  function resize() {
    const wrap = $('game-wrap');
    const rect = wrap.getBoundingClientRect();
    W = Math.max(280, Math.floor(rect.width));
    H = Math.max(240, Math.floor(rect.height));
    dpr = Math.min(2.5, window.devicePixelRatio || 1);
    canvas.width = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    bgCache = null;
    bgCacheKey = '';
  }

  function itemDuration(level) { return ITEM_SEC[level] || 7; }

  function makeOffscreen(w, h) {
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.floor(w * dpr));
    c.height = Math.max(1, Math.floor(h * dpr));
    const cctx = c.getContext('2d');
    cctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { canvas: c, ctx: cctx };
  }

  function paintStaticOcean(c, w, h) {
    const g = c.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#48cae4');
    g.addColorStop(0.18, '#0096c7');
    g.addColorStop(0.45, '#0077b6');
    g.addColorStop(0.72, '#023e8a');
    g.addColorStop(1, '#001d3d');
    c.fillStyle = g;
    c.fillRect(0, 0, w, h);
    const sg = c.createLinearGradient(0, 0, 0, h * 0.12);
    sg.addColorStop(0, 'rgba(255,255,255,.35)');
    sg.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = sg;
    c.fillRect(0, 0, w, h * 0.12);
    function reef(baseY, amp, color, seed) {
      c.fillStyle = color;
      c.beginPath();
      c.moveTo(0, h);
      c.lineTo(0, baseY);
      for (let x = 0; x <= w; x += 16) {
        const n = Math.sin(x * 0.04 + seed) * amp + Math.sin(x * 0.09 + seed * 2) * amp * 0.4;
        c.lineTo(x, baseY - Math.abs(n));
      }
      c.lineTo(w, h); c.closePath(); c.fill();
    }
    reef(h * 0.78, h * 0.06, '#014f86', 1.1);
    reef(h * 0.84, h * 0.05, '#023e8a', 2.4);
    const sand = c.createLinearGradient(0, h * 0.88, 0, h);
    sand.addColorStop(0, '#c2b280');
    sand.addColorStop(0.4, '#d4c4a8');
    sand.addColorStop(1, '#a89070');
    c.fillStyle = sand;
    c.beginPath();
    c.moveTo(0, h * 0.9);
    for (let x = 0; x <= w; x += 20) c.lineTo(x, h * 0.9 + Math.sin(x * 0.05) * 4);
    c.lineTo(w, h); c.lineTo(0, h); c.closePath(); c.fill();
    c.fillStyle = 'rgba(120,100,70,.25)';
    for (let i = 0; i < 60; i++) {
      c.fillRect((i * 53) % w, h * 0.92 + ((i * 37) % Math.floor(h * 0.08)), 2, 1);
    }
    function coral(x, y, s, color) {
      c.strokeStyle = color; c.lineWidth = 4 * s; c.lineCap = 'round';
      for (let i = -2; i <= 2; i++) {
        c.beginPath(); c.moveTo(x, y);
        c.quadraticCurveTo(x + i * 8 * s, y - 18 * s, x + i * 10 * s, y - 32 * s - Math.abs(i) * 4);
        c.stroke();
      }
    }
    coral(w * 0.12, h * 0.9, 1.0, '#e63980');
    coral(w * 0.28, h * 0.92, 0.7, '#f4a261');
    coral(w * 0.78, h * 0.91, 1.1, '#e76f51');
    coral(w * 0.9, h * 0.93, 0.65, '#2a9d8f');
    c.fillStyle = '#4a5568';
    c.beginPath(); c.ellipse(w * 0.55, h * 0.93, 40, 14, 0, 0, Math.PI * 2); c.fill();
  }

  function ensureBg() {
    const key = W + 'x' + H + '@' + dpr;
    if (bgCache && bgCacheKey === key) return bgCache;
    const off = makeOffscreen(W, H);
    paintStaticOcean(off.ctx, W, H);
    bgCache = off; bgCacheKey = key;
    return bgCache;
  }

  function spawnChests(q, level) {
    const opts = (q.options || []).slice(0, 3);
    if (level >= 4) {
      let decoy = q.answer + (Math.random() < 0.5 ? 1 : -1) * (1 + ((Math.random() * 5) | 0));
      let guard = 0;
      while (opts.includes(decoy) && guard++ < 20) decoy += (Math.random() < 0.5 ? 1 : -1);
      if (!opts.includes(decoy)) opts.push(decoy);
    }
    const n = opts.length;
    return opts.map(function (val, i) {
      const lane = (i + 0.5) / n;
      return {
        value: val,
        x: W * (0.22 + lane * 0.62) + (Math.random() - 0.5) * 20,
        y: H * (0.28 + Math.random() * 0.45),
        vx: (Math.random() - 0.5) * (12 + level * 4),
        vy: (Math.random() - 0.5) * (8 + level * 3),
        r: Math.max(28, Math.min(42, W * 0.075)),
        phase: Math.random() * Math.PI * 2,
        open: false, burst: 0, hit: false,
      };
    });
  }

  function spawnHazards(level) {
    const n = 1 + (level >= 3 ? 1 : 0) + (level >= 5 ? 1 : 0);
    const list = [];
    for (let i = 0; i < n; i++) {
      const kind = (i % 2 === 0) ? 'shark' : 'jelly';
      list.push({
        kind: kind,
        x: W * (0.3 + Math.random() * 0.6),
        y: H * (0.25 + Math.random() * 0.5),
        vx: (Math.random() < 0.5 ? -1 : 1) * (40 + level * 18),
        vy: (Math.random() - 0.5) * (20 + level * 8),
        r: kind === 'shark' ? 28 : 18,
        phase: Math.random() * Math.PI * 2,
      });
    }
    return list;
  }

  function resetSwim() {
    if (!run) return;
    run.diver = {
      x: W * 0.18, y: H * 0.45, vx: 0, vy: 0,
      facing: 1, kick: 0, bubbleT: 0, target: null,
    };
    run.phase = 'swim';
    run.resolved = false;
  }

  function startAttempt() {
    return (async function () {
      if (!DEMO && !isSessionOpen()) {
        alert(sessionClosedMessage());
        return;
      }
      if (!DEMO) {
        const rec = await fetchRemoteRecord();
        mergeRemote(rec); afterRemote(rec);
        if (progress.attemptsUsed >= MAX_ATTEMPTS) {
          clearOpenAttempt();
          saveLocal();
          paintLobby();
          return;
        }
      }
      if (!DEMO && progress.openAttempt && progress.attemptsUsed < MAX_ATTEMPTS) {
        const oa = progress.openAttempt;
        const lvl = clampLevel(oa.nextLevel);
        attempt = {
          num: Math.max(1, Number(oa.num) || progress.attemptsUsed + 1),
          score: Math.max(0, Number(oa.score) || 0),
          unlocked: LEVELS,
          bestLevel: Math.max(0, Number(oa.bestLevel) || 0),
          totalCorrect: Math.max(0, Number(oa.totalCorrect) || 0),
          active: true,
        };
        Sound.unlock();
        Sound.startMusic(lvl);
        snapshotOpenAttempt({ nextLevel: lvl, awaitingNext: false });
        startLevel(lvl);
        return;
      }
      attempt = {
        num: DEMO ? 1 : progress.attemptsUsed + 1,
        score: 0, unlocked: LEVELS, bestLevel: 0, totalCorrect: 0, active: true,
      };
      if (!DEMO) snapshotOpenAttempt({ nextLevel: 1, awaitingNext: false });
      Sound.unlock();
      Sound.startMusic(1);
      startLevel(1);
    })();
  }


  function pickBonusIndices(n) {
    // Exactly 2 bonus items per level: never item 1 (index 0), never adjacent.
    const pool = [];
    for (let i = 1; i < n; i++) pool.push(i);
    for (let i = pool.length - 1; i > 0; i--) {
      const j = (Math.random() * (i + 1)) | 0;
      const tmp = pool[i]; pool[i] = pool[j]; pool[j] = tmp;
    }
    const a = pool[0];
    let b = null;
    for (let i = 1; i < pool.length; i++) {
      if (Math.abs(pool[i] - a) > 1) { b = pool[i]; break; }
    }
    if (b == null) b = (a >= n - 2) ? a - 2 : a + 2;
    return a < b ? [a, b] : [b, a];
  }
  function isBonusQ() {
    return !!(run && run.bonusIdx && run.bonusIdx.indexOf(run.qIndex) >= 0);
  }

  function startLevel(level) {
    if (!attempt || !attempt.active) { alert('Start an attempt first.'); return; }
    Sound.setLevel(level);
    if (level > 1) Sound.levelUp();
    const questions = IRQuestions.generateLevel(level, ITEMS);
    const bonusIdx = pickBonusIndices(ITEMS);
    run = {
      level: level, questions: questions, qIndex: 0, bonusIdx: bonusIdx, lives: LIVES,
      correct: 0, score: 0, streak: 0,
      itemT: itemDuration(level), itemMax: itemDuration(level),
      flash: null, over: false, endedByLives: false, lastTs: 0,
      chests: [], hazards: [], diver: null, phase: 'swim', resolved: false, skyT: 0,
    };
    particles = [];
    warnFlash = 0;
    spawnCurrent();
    updateHud();
    show('game');
    resize();
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(loop);
    if (!DEMO && attempt && attempt.active) {
      snapshotOpenAttempt({ nextLevel: level, awaitingNext: false });
    }
  }

  function spawnCurrent() {
    const q = run.questions[run.qIndex];
    resetSwim();
    run.chests = spawnChests(q, run.level);
    run.hazards = spawnHazards(run.level);
    run.itemT = itemDuration(run.level);
    run.itemMax = run.itemT;
    if (run.hazards.some(function (h) { return h.kind === 'shark'; })) warnFlash = 0.85;
    if (isBonusQ()) {
      try { Sound.bonusLife(); } catch (e) {}
    }
  }

  function updateHud() {
    if (!run) return;
    $('hud-attempt').textContent = MAX_ATTEMPTS === 1 ? '1 try only' : ('Attempt ' + (attempt ? attempt.num : '?') + ' of ' + MAX_ATTEMPTS);
    $('hud-level').textContent = 'L' + run.level;
    $('hud-q').textContent = (run.qIndex + 1) + '/' + ITEMS;
    $('hud-score').textContent = String((attempt ? attempt.score : 0) + run.score);
    const lifeFill = Math.max(0, run.lives);
    $('hud-lives').textContent = '❤'.repeat(lifeFill) + (lifeFill < LIVES ? '♡'.repeat(LIVES - lifeFill) : '');
    const q = run.questions[run.qIndex];
    const bonus = isBonusQ();
    const ban = $('hud-bonus');
    if (ban) {
      ban.textContent = '❤ BONUS LIFE question';
      ban.classList.toggle('show', bonus);
      ban.hidden = !bonus;
    }
    $('hud-prompt').textContent = q ? (q.promptDisplay || q.prompt) : '—';
    $('hud-prompt').classList.toggle('bonus', bonus);
    const pct = Math.max(0, run.itemT / run.itemMax);
    $('timer-bar').style.transform = 'scaleX(' + pct + ')';
    $('timer-label').textContent = run.itemT.toFixed(1) + 's';
  }

  function burstAt(x, y, ok) {
    const cols = ok ? ['#ffd54f', '#fff176', '#ffb300', '#fff'] : ['#ef5350', '#b71c1c', '#ff8a80'];
    for (let i = 0; i < 18; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 40 + Math.random() * 120;
      particles.push({ x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 30,
        r: 2 + Math.random() * 4, t: 0.45 + Math.random() * 0.35, c: cols[(Math.random() * cols.length) | 0] });
    }
  }

  function resolveHit(chest) {
    if (!run || run.resolved || run.over) return;
    run.resolved = true;
    run.phase = 'resolve';
    if (run.diver) run.diver.target = null;
    const q = run.questions[run.qIndex];
    const ok = chest && chest.value === q.answer;
    if (chest) { chest.hit = true; chest.open = ok; chest.burst = 0.55; }
    if (ok) {
      run.correct++; run.streak++;
      const gained = BASE_PTS[run.level] + Math.floor(run.streak / 3) * 5;
      run.score += gained;
      let bonusGain = false;
      if (isBonusQ() && run.lives < MAX_LIVES) {
        run.lives++;
        bonusGain = true;
      }
      run.flash = { kind: 'ok', t: 0.7, gained: gained, bonusLife: bonusGain };
      burstAt(chest.x, chest.y, true);
      Sound.chestOpen(); Sound.ding();
      if (bonusGain) Sound.bonusLife();
    } else {
      run.streak = 0; run.lives--;
      run.flash = { kind: 'bad', t: 0.55 };
      shakeT = 0.4;
      if (chest) burstAt(chest.x, chest.y, false);
      Sound.sharkBite(); Sound.buzz();
      if (run.lives <= 0) { run.endedByLives = true; endLevel(false); return; }
    }
    updateHud();
  }

  function resolveMiss(reason) {
    if (!run || run.resolved || run.over) return;
    run.resolved = true;
    run.phase = 'resolve';
    if (run.diver) run.diver.target = null;
    run.streak = 0; run.lives--;
    run.flash = { kind: 'bad', t: 0.55, reason: reason || 'miss' };
    shakeT = 0.35;
    if (reason === 'shark') warnFlash = 0.6;
    Sound.sharkBite(); Sound.buzz();
    if (run.lives <= 0) { run.endedByLives = true; endLevel(false); return; }
    updateHud();
  }

  function advanceQuestion() {
    run.qIndex++;
    if (run.qIndex >= ITEMS) { endLevel(true); return; }
    spawnCurrent();
    updateHud();
  }

  function endLevel(finishedAllItems) {
    if (!run || run.over) return;
    run.over = true;
    cancelAnimationFrame(raf);
    if (attempt) {
      attempt.score += run.score;
      attempt.totalCorrect += run.correct;
      attempt.bestLevel = Math.max(attempt.bestLevel, run.level);
    }
    const isLast = run.level >= LEVELS;
    const died = !!run.endedByLives;
    $('sum-title').textContent = isLast ? 'Treasure run complete!' : (died ? 'Out of lives — next level' : 'Level ' + run.level + ' Clear!');
    $('sum-detail').textContent =
      'Correct: ' + run.correct + '/' + (died ? run.qIndex + 1 : ITEMS) +
      ' · Level points: ' + run.score +
      ' · Attempt total: ' + (attempt ? attempt.score : 0) +
      (died && !isLast ? ' · Fresh 3 lives on next level' : '') +
      (isLast ? ' · All 5 levels done' : '');
    if (isLast) {
      finishAttempt().then(function () { paintSummaryButtons(false); });
    } else {
      if (!DEMO) snapshotOpenAttempt({ nextLevel: run.level + 1, awaitingNext: true });
      $('sum-sync').textContent =
        (MAX_ATTEMPTS === 1 ? '1 try' : ('Attempt ' + attempt.num + ' of ' + MAX_ATTEMPTS)) +
        ' · Level ' + (run.level + 1) + ' next.';
      paintSummaryButtons(true);
    }
    show('summary');
  }

  async function finishAttempt() {
    if (!attempt || !attempt.active) return;
    attempt.active = false;
    Sound.stopMusic();
    const score = attempt.score;
    const bestLevel = attempt.bestLevel;
    if (DEMO) {
      $('sum-sync').textContent = 'Demo mode — score not saved (' + score + ' pts).';
      return;
    }
    progress.attemptsUsed = Math.max(progress.attemptsUsed + 1, attempt.num);
    progress.attemptScores = (progress.attemptScores || []).concat([score]);
    progress.bestTotal = Math.max(progress.bestTotal, score);
    progress.bestLevel = Math.max(progress.bestLevel, bestLevel);
    clearOpenAttempt();
    saveLocal();
    const entry = {
      name: player.name, grade: player.grade, section: player.section || '',
      total: progress.bestTotal, bestLevel: progress.bestLevel,
      attempts: progress.attemptsUsed, attemptScores: progress.attemptScores.slice(-4),
      correct: attempt.totalCorrect, ts: Date.now(),
        date: SESSION_ISO,
        admDate: SESSION_DATE,
        session: SESSION_KEY,
    };
    $('sum-sync').textContent = 'Saving best score…';
    setPending(entry);
    const ok = await submitWithRetry(entry);
    $('sum-sync').textContent = ok
      ? 'Saved online — on the leaderboard. Your score: ' + progress.bestTotal + ' · Tries used: ' + progress.attemptsUsed + '/' + MAX_ATTEMPTS
      : 'No internet — saved on this phone only. It will upload automatically when you are online (keep or reopen this page). Score: ' + progress.bestTotal + ' · Tries: ' + progress.attemptsUsed + '/' + MAX_ATTEMPTS;
  }

  function paintSummaryButtons(canNext) {
    const left = MAX_ATTEMPTS - progress.attemptsUsed;
    $('btn-next').style.display = canNext ? '' : 'none';
    $('btn-next').textContent = 'Next Level';
    if (!canNext && left > 0) {
      $('btn-retry').style.display = '';
      $('btn-retry').textContent = MAX_ATTEMPTS === 1 ? 'Start Run (1 try)' : ('Start Attempt ' + (progress.attemptsUsed + 1) + ' of ' + MAX_ATTEMPTS);
    } else {
      $('btn-retry').style.display = 'none';
    }
    $('btn-menu').style.display = '';
    $('btn-menu').textContent = 'Back';
  }

  function pointerPos(ev) {
    const r = canvas.getBoundingClientRect();
    const src = ev.touches && ev.touches[0] ? ev.touches[0] : (ev.changedTouches && ev.changedTouches[0] ? ev.changedTouches[0] : ev);
    return {
      x: ((src.clientX - r.left) / r.width) * W,
      y: ((src.clientY - r.top) / r.height) * H,
    };
  }

  function chestAt(x, y) {
    if (!run) return null;
    let best = null, bestD = 1e9;
    for (let i = 0; i < run.chests.length; i++) {
      const t = run.chests[i];
      if (t.hit) continue;
      const d = Math.hypot(t.x - x, t.y - y);
      if (d <= t.r * 1.45 && d < bestD) { best = t; bestD = d; }
    }
    return best;
  }

  function onPointerDown(ev) {
    if (!run || run.over || run.resolved || run.phase !== 'swim') return;
    ev.preventDefault();
    Sound.unlock();
    const p = pointerPos(ev);
    if (tapChest) {
      const t = chestAt(p.x, p.y);
      if (t) {
        run.diver.target = t;
        return;
      }
    }
    pointer.down = true;
    pointer.x = p.x; pointer.y = p.y;
    if (run.diver) run.diver.target = null;
  }
  function onPointerMove(ev) {
    if (!run || !pointer.down) return;
    ev.preventDefault();
    const p = pointerPos(ev);
    pointer.x = p.x; pointer.y = p.y;
  }
  function onPointerUp(ev) {
    if (!pointer.down) return;
    ev.preventDefault();
    pointer.down = false;
  }

  canvas.addEventListener('mousedown', onPointerDown);
  canvas.addEventListener('mousemove', onPointerMove);
  window.addEventListener('mouseup', onPointerUp);
  canvas.addEventListener('touchstart', onPointerDown, { passive: false });
  canvas.addEventListener('touchmove', onPointerMove, { passive: false });
  canvas.addEventListener('touchend', onPointerUp, { passive: false });
  canvas.addEventListener('touchcancel', onPointerUp, { passive: false });

  window.addEventListener('keydown', function (e) {
    keys[e.key] = true;
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].indexOf(e.key) >= 0) e.preventDefault();
    Sound.unlock();
  });
  window.addEventListener('keyup', function (e) { keys[e.key] = false; });

  $('chk-tap').onchange = function (e) {
    tapChest = !!e.target.checked;
    $('ctrl-hint').textContent = tapChest
      ? 'Drag to swim · tap a chest to dive to it · arrows on PC'
      : 'Drag / hold to swim · arrow keys or WASD on PC';
  };

  function drawRays() {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 6; i++) {
      const x = W * (0.1 + i * 0.15) + Math.sin(animT * 0.3 + i) * 10;
      const grd = ctx.createLinearGradient(x, 0, x + 40, H * 0.7);
      grd.addColorStop(0, 'rgba(255,255,220,.18)');
      grd.addColorStop(1, 'rgba(255,255,220,0)');
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.moveTo(x - 8, 0);
      ctx.lineTo(x + 18, 0);
      ctx.lineTo(x + 55 + i * 5, H * 0.75);
      ctx.lineTo(x - 30 - i * 3, H * 0.75);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  function drawSeaweed() {
    ctx.save();
    for (let i = 0; i < 8; i++) {
      const x = W * (0.05 + i * 0.12);
      const base = H * 0.9;
      const sway = Math.sin(animT * 1.5 + i) * 10;
      ctx.strokeStyle = i % 2 ? '#2a9d8f' : '#1b7a6e';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x, base);
      ctx.quadraticCurveTo(x + sway, base - 40, x + sway * 0.5, base - 70 - (i % 3) * 8);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawFishSchool() {
    ctx.save();
    for (let i = 0; i < 7; i++) {
      const x = (W * 0.2 + i * 28 + animT * (18 + i * 2)) % (W + 40) - 20;
      const y = H * 0.2 + Math.sin(animT + i) * 12 + i * 6;
      ctx.fillStyle = i % 2 ? '#ffd166' : '#ef476f';
      ctx.beginPath();
      ctx.ellipse(x, y, 7, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x - 7, y);
      ctx.lineTo(x - 12, y - 4);
      ctx.lineTo(x - 12, y + 4);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  function drawBubbles() {
    ctx.save();
    ctx.fillStyle = 'rgba(200,240,255,.35)';
    for (let i = 0; i < 12; i++) {
      const x = (i * 47 + animT * 8) % W;
      const y = H - ((animT * (20 + i * 3) + i * 40) % (H * 0.9));
      ctx.beginPath();
      ctx.arc(x, y, 2 + (i % 3), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawDepthMeter() {
    const x = 10, top = H * 0.12, bot = H * 0.85, h = bot - top;
    ctx.save();
    ctx.fillStyle = 'rgba(0,20,40,.45)';
    ctx.fillRect(x, top - 8, 36, h + 16);
    ctx.strokeStyle = 'rgba(144,224,239,.7)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x, top - 8, 36, h + 16);
    ctx.fillStyle = '#90e0ef';
    ctx.font = 'bold 9px system-ui';
    ctx.textAlign = 'center';
    const marks = [0, -10, -25, -40, -55];
    marks.forEach(function (m, i) {
      const yy = top + (i / (marks.length - 1)) * h;
      ctx.fillText(m === 0 ? '0 m' : (m + ' m'), x + 18, yy + 3);
      ctx.beginPath();
      ctx.moveTo(x + 2, yy); ctx.lineTo(x + 8, yy); ctx.stroke();
    });
    if (run && run.diver) {
      const depthFrac = Math.min(1, Math.max(0, (run.diver.y - H * 0.08) / (H * 0.8)));
      const dy = top + depthFrac * h;
      ctx.fillStyle = '#ffd166';
      ctx.beginPath();
      ctx.moveTo(x + 34, dy);
      ctx.lineTo(x + 42, dy - 5);
      ctx.lineTo(x + 42, dy + 5);
      ctx.closePath();
      ctx.fill();
      const meters = -Math.round(depthFrac * 55);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 10px system-ui';
      ctx.fillText(meters + ' m', x + 18, bot + 14);
    }
    ctx.restore();
  }

  function drawChest(t) {
    if (t.hit && t.burst <= 0 && !t.open) return;
    const alpha = (t.hit && !t.open) ? Math.max(0, t.burst * 2) : 1;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(t.x, t.y + Math.sin(animT * 2 + t.phase) * 3);
    const s = t.r / 32;
    ctx.scale(s, s);
    // glow
    if (isBonusQ() && !t.hit) {
      const pulse = 0.35 + 0.25 * Math.sin(animT * 6 + t.phase);
      ctx.fillStyle = 'rgba(255,213,79,' + pulse + ')';
      ctx.beginPath(); ctx.arc(0, 0, 52, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(255,235,59,.95)';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(0, 0, 44, 0, Math.PI * 2); ctx.stroke();
    } else {
      ctx.fillStyle = 'rgba(255,215,0,.2)';
      ctx.beginPath(); ctx.arc(0, 0, 40, 0, Math.PI * 2); ctx.fill();
    }
    // body
    ctx.fillStyle = t.open ? '#8d6e63' : '#6d4c41';
    ctx.fillRect(-22, -6, 44, 28);
    // lid
    ctx.fillStyle = '#a1887f';
    if (t.open) {
      ctx.save();
      ctx.translate(-22, -6);
      ctx.rotate(-0.9);
      ctx.fillRect(0, -16, 44, 16);
      ctx.restore();
      // gold
      ctx.fillStyle = '#ffd54f';
      ctx.beginPath(); ctx.ellipse(0, 4, 14, 8, 0, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.fillRect(-22, -20, 44, 16);
      ctx.fillStyle = '#ffd54f';
      ctx.fillRect(-4, -4, 8, 10);
      ctx.beginPath(); ctx.arc(0, -4, 4, 0, Math.PI * 2); ctx.fill();
    }
    // band
    ctx.fillStyle = '#5d4037';
    ctx.fillRect(-22, 2, 44, 4);
    // number banner
    const label = String(t.value);
    ctx.font = 'bold 18px system-ui,sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const tw = Math.max(36, ctx.measureText(label).width + 12);
    ctx.fillStyle = 'rgba(255,253,245,.95)';
    ctx.strokeStyle = '#3e2723';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.rect(-tw / 2, 14, tw, 22);
    ctx.fill(); ctx.stroke();
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(255,255,255,.9)';
    ctx.fillStyle = '#001d3d';
    ctx.strokeText(label, 0, 25);
    ctx.fillText(label, 0, 25);
    ctx.restore();
  }

  function drawShark(h) {
    ctx.save();
    ctx.translate(h.x, h.y);
    const dir = h.vx >= 0 ? 1 : -1;
    ctx.scale(dir, 1);
    ctx.fillStyle = '#607d8b';
    ctx.beginPath();
    ctx.ellipse(0, 0, 32, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    // tail
    ctx.beginPath();
    ctx.moveTo(-28, 0);
    ctx.lineTo(-44, -14);
    ctx.lineTo(-38, 0);
    ctx.lineTo(-44, 14);
    ctx.closePath();
    ctx.fill();
    // fin
    ctx.beginPath();
    ctx.moveTo(-4, -10);
    ctx.lineTo(4, -26);
    ctx.lineTo(10, -10);
    ctx.closePath();
    ctx.fill();
    // eye / teeth hint
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(18, -3, 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#111';
    ctx.beginPath(); ctx.arc(19, -3, 1.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(22, 4); ctx.lineTo(28, 2); ctx.lineTo(22, 0);
    ctx.fill();
    ctx.restore();
  }

  function drawJelly(h) {
    ctx.save();
    ctx.translate(h.x, h.y + Math.sin(animT * 3 + h.phase) * 4);
    ctx.fillStyle = 'rgba(186,104,200,.75)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 14, 10, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(225,190,231,.8)';
    ctx.lineWidth = 1.5;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 4, 2);
      ctx.quadraticCurveTo(i * 4 + Math.sin(animT * 4 + i) * 3, 14, i * 3, 22);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawDiver(d) {
    if (!d) return;
    ctx.save();
    ctx.translate(d.x, d.y);
    ctx.scale(d.facing, 1);
    const kick = Math.sin(d.kick) * 0.45;
    // tank
    ctx.fillStyle = '#546e7a';
    ctx.fillRect(-14, -10, 8, 22);
    ctx.fillStyle = '#90a4ae';
    ctx.fillRect(-13, -12, 6, 4);
    // body / wetsuit
    ctx.fillStyle = '#1a237e';
    ctx.beginPath();
    ctx.ellipse(0, 2, 11, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    // head + mask
    ctx.fillStyle = '#ffcc80';
    ctx.beginPath(); ctx.arc(2, -16, 9, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(100,180,220,.55)';
    ctx.beginPath(); ctx.ellipse(5, -16, 7, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#37474f';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // arms
    ctx.strokeStyle = '#1a237e';
    ctx.lineWidth = 5; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(4, -4);
    ctx.quadraticCurveTo(16, -2 + kick * 4, 22, 4);
    ctx.stroke();
    // fins
    ctx.fillStyle = '#000';
    ctx.save();
    ctx.translate(-2, 16);
    ctx.rotate(0.4 + kick);
    ctx.beginPath(); ctx.ellipse(10, 0, 12, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.translate(-2, 16);
    ctx.rotate(-0.2 - kick);
    ctx.beginPath(); ctx.ellipse(10, 4, 12, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    // regulator bubbles
    if (d.bubbleT > 0.05) {
      ctx.fillStyle = 'rgba(200,240,255,.5)';
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(10 + i * 4, -20 - i * 6 - (1 - d.bubbleT) * 10, 2 + i * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  function draw() {
    if (!run) return;
    ctx.save();
    if (shakeT > 0) {
      ctx.translate((Math.random() - 0.5) * 8 * shakeT, (Math.random() - 0.5) * 8 * shakeT);
    }
    const bg = ensureBg();
    ctx.drawImage(bg.canvas, 0, 0, W, H);
    drawRays();
    drawFishSchool();
    drawSeaweed();
    drawBubbles();

    for (let i = 0; i < run.chests.length; i++) drawChest(run.chests[i]);
    for (let i = 0; i < run.hazards.length; i++) {
      if (run.hazards[i].kind === 'shark') drawShark(run.hazards[i]);
      else drawJelly(run.hazards[i]);
    }

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      ctx.globalAlpha = Math.max(0, p.t * 2);
      ctx.fillStyle = p.c;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;

    drawDiver(run.diver);
    drawDepthMeter();

    if (warnFlash > 0) {
      ctx.fillStyle = 'rgba(183,28,28,' + Math.min(0.4, warnFlash * 0.45) + ')';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 18px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('⚠ SHARKS NEARBY', W / 2, H * 0.18);
    }

    if (run.flash) {
      ctx.fillStyle = run.flash.kind === 'ok'
        ? 'rgba(76,175,80,' + Math.min(0.35, run.flash.t) + ')'
        : 'rgba(244,67,54,' + Math.min(0.35, run.flash.t) + ')';
      ctx.fillRect(0, 0, W, H);
      if (run.flash.kind === 'ok' && run.flash.gained) {
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 28px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText('+' + run.flash.gained, W / 2, H * 0.4);
        if (run.flash.bonusLife) {
          ctx.fillStyle = '#ffd54f';
          ctx.font = 'bold 26px system-ui';
          ctx.fillText('+1 ❤', W / 2, H * 0.4 + 34);
        }
      }
    }
    ctx.restore();
  }

  function loop(ts) {
    if (!run || run.over) return;
    if (!run.lastTs) run.lastTs = ts;
    let dt = Math.min(0.05, (ts - run.lastTs) / 1000);
    run.lastTs = ts;
    run.skyT += dt;
    animT += dt;
    if (shakeT > 0) shakeT = Math.max(0, shakeT - dt);
    if (warnFlash > 0) warnFlash = Math.max(0, warnFlash - dt);

    const d = run.diver;
    if (d && !run.resolved && run.phase === 'swim') {
      let ax = 0, ay = 0;
      if (pointer.down) {
        ax = pointer.x - d.x;
        ay = pointer.y - d.y;
      }
      if (keys.ArrowLeft || keys.a || keys.A) ax -= 120;
      if (keys.ArrowRight || keys.d || keys.D) ax += 120;
      if (keys.ArrowUp || keys.w || keys.W) ay -= 120;
      if (keys.ArrowDown || keys.s || keys.S) ay += 120;
      if (d.target && !d.target.hit) {
        ax = d.target.x - d.x;
        ay = d.target.y - d.y;
      }
      const mag = Math.hypot(ax, ay);
      const maxSp = 160 + run.level * 12;
      if (mag > 8) {
        const nx = ax / mag, ny = ay / mag;
        d.vx += nx * 520 * dt;
        d.vy += ny * 520 * dt;
        d.facing = nx >= 0 ? 1 : -1;
        d.kick += dt * 12;
        d.bubbleT = 0.4;
        if (Math.random() < dt * 3) Sound.bubble();
      } else {
        d.kick += dt * 3;
        d.bubbleT = Math.max(0, d.bubbleT - dt);
      }
      // drag
      d.vx *= Math.pow(0.08, dt);
      d.vy *= Math.pow(0.08, dt);
      const sp = Math.hypot(d.vx, d.vy);
      if (sp > maxSp) { d.vx *= maxSp / sp; d.vy *= maxSp / sp; }
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      d.x = Math.max(24, Math.min(W - 24, d.x));
      d.y = Math.max(H * 0.1, Math.min(H * 0.88, d.y));

      // collide chests — must touch the chest you open
      for (let i = 0; i < run.chests.length; i++) {
        const t = run.chests[i];
        if (t.hit) continue;
        if (Math.hypot(d.x - t.x, d.y - t.y) <= t.r * 0.95) {
          // if auto-targeting a different chest, ignore until that one
          if (d.target && d.target !== t) continue;
          resolveHit(t);
          break;
        }
      }

      // hazards
      if (!run.resolved) {
        for (let i = 0; i < run.hazards.length; i++) {
          const h = run.hazards[i];
          if (Math.hypot(d.x - h.x, d.y - h.y) <= h.r + 12) {
            resolveMiss(h.kind === 'shark' ? 'shark' : 'jelly');
            break;
          }
        }
      }
    }

    // move chests gently
    for (let i = 0; i < run.chests.length; i++) {
      const t = run.chests[i];
      if (t.hit) { t.burst = Math.max(0, t.burst - dt); continue; }
      t.phase += dt;
      t.x += t.vx * dt;
      t.y += t.vy * dt + Math.sin(t.phase * 2) * 6 * dt;
      if (t.x < t.r + 40) { t.x = t.r + 40; t.vx = Math.abs(t.vx); }
      if (t.x > W - t.r - 10) { t.x = W - t.r - 10; t.vx = -Math.abs(t.vx); }
      if (t.y < H * 0.18) { t.y = H * 0.18; t.vy = Math.abs(t.vy); }
      if (t.y > H * 0.78) { t.y = H * 0.78; t.vy = -Math.abs(t.vy); }
    }

    // move hazards
    const hSp = 50 + run.level * 22;
    for (let i = 0; i < run.hazards.length; i++) {
      const h = run.hazards[i];
      h.phase += dt;
      h.x += h.vx * dt;
      h.y += h.vy * dt + Math.sin(h.phase * 2) * (h.kind === 'jelly' ? 20 : 8) * dt;
      if (h.x < 20) { h.x = 20; h.vx = Math.abs(h.vx); }
      if (h.x > W - 20) { h.x = W - 20; h.vx = -Math.abs(h.vx); }
      if (h.y < H * 0.15) { h.y = H * 0.15; h.vy = Math.abs(h.vy); }
      if (h.y > H * 0.8) { h.y = H * 0.8; h.vy = -Math.abs(h.vy); }
      const sp = Math.hypot(h.vx, h.vy);
      if (sp > hSp) { h.vx *= hSp / sp; h.vy *= hSp / sp; }
      // erratic
      if (Math.random() < (0.3 + run.level * 0.1) * dt) {
        h.vx += (Math.random() - 0.5) * 40;
        h.vy += (Math.random() - 0.5) * 30;
      }
    }

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.t -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 40 * dt;
      if (p.t <= 0) particles.splice(i, 1);
    }

    if (run.flash) {
      run.flash.t -= dt;
      if (run.flash.t <= 0) {
        run.flash = null;
        if (run.resolved && !run.over) advanceQuestion();
      }
    } else if (!run.resolved && run.phase === 'swim') {
      run.itemT -= dt;
      // heartbeat when low time
      if (run.itemT < 2.5 && run.itemT > 0) {
        heartBeatAcc += dt;
        if (heartBeatAcc > 0.55) { heartBeatAcc = 0; Sound.heartbeat(); }
      } else heartBeatAcc = 0;
      if (run.itemT <= 0) {
        run.itemT = 0;
        resolveMiss('time');
      }
      updateHud();
    }

    draw();
    raf = requestAnimationFrame(loop);
  }

  function paintLobby() {
    $('levels-wrap').style.display = '';
    const left = MAX_ATTEMPTS - progress.attemptsUsed;
    $('player-label').textContent =
      player.name + ' · G' + player.grade +
      (player.section ? ' · ' + player.section : '') +
      ' · Best: ' + progress.bestTotal;
    const box = $('level-btns');
    box.innerHTML = '';
    if (left <= 0) {
      const msg = document.createElement('div');
      msg.className = 'no-tries';
      msg.innerHTML =
        '<strong>No tries left</strong><br>Your score: <b>' + progress.bestTotal + '</b>' +
        (progress.bestLevel ? ' (reached L' + progress.bestLevel + ')' : '') +
        '<br><span class="note" style="opacity:1;color:#b71c1c">' + boardNote() + '</span>';
      box.appendChild(msg);
      return;
    }
    const oa = progress.openAttempt;
    const resumeLvl = oa ? clampLevel(oa.nextLevel) : 0;
    const b = document.createElement('button');
    b.className = 'lvl';
    b.textContent = oa
      ? ('Resume Level ' + resumeLvl)
      : (MAX_ATTEMPTS === 1 ? 'Start Run (1 try)' : ('Start Attempt ' + (progress.attemptsUsed + 1) + ' of ' + MAX_ATTEMPTS));
    b.onclick = function () { startAttempt(); };
    box.appendChild(b);
    const hint = document.createElement('p');
    hint.className = 'note';
    hint.textContent = oa
      ? 'Your phone saved your place. You cannot restart from Level 1.'
      : '1 try only · 5 levels × 20 items (100 total) · Leaderboard saves your best · Nov. 10 games, open through Nov. 13.';
    box.appendChild(hint);
  }

  $('btn-play').onclick = async function () {
    const name = $('inp-name').value.trim();
    const grade = $('inp-grade').value;
    const section = $('inp-section').value.trim();
    if (!name || !grade || !section) {
      alert('Select Grade, Section, and your Name from the list.');
      return;
    }
    const ok = learners.some(function (x) {
      return x.n === name && gradeNum(x.g) === grade && x.s === section;
    });
    if (!ok) { alert('Name not on the class list.'); return; }
    player = { name: name, grade: grade, section: section };
    localStorage.setItem('td-name', name);
    localStorage.setItem('td-grade', grade);
    localStorage.setItem('td-section', section);
    progress = blankProgress();
    loadLocal();
    if (!DEMO && !isSessionOpen()) {
      alert(sessionClosedMessage());
      return;
    }
    $('btn-play').disabled = true;
    $('btn-play').textContent = 'Checking tries…';
    const rec = await fetchRemoteRecord();
    mergeRemote(rec); afterRemote(rec);
    $('btn-play').disabled = false;
    $('btn-play').textContent = 'Continue';
    paintLobby();
  };

  $('btn-go-board').onclick = async function () {
    show('board');
    $('board-body').innerHTML = '<tr><td colspan="5">Loading…</td></tr>';
    renderBoard(await fetchBoard(), $('board-filter').value);
  };
  $('board-filter').onchange = async function () {
    renderBoard(await fetchBoard(), $('board-filter').value);
  };
  $('btn-board-back').onclick = function () { show('start'); };
  $('btn-next').onclick = function () {
    if (attempt && attempt.active && run) startLevel(run.level + 1);
  };
  $('btn-retry').onclick = function () { startAttempt(); };
  $('btn-menu').onclick = function () {
    if (attempt && attempt.active) {
      if (run && !run.over) {
        run.over = true;
        cancelAnimationFrame(raf);
        if (!DEMO) snapshotOpenAttempt({ nextLevel: run.level, awaitingNext: false });
      } else if (run && run.over && run.level < LEVELS) {
        if (!DEMO) snapshotOpenAttempt({ nextLevel: run.level + 1, awaitingNext: true });
      } else if (!run) {
        if (!DEMO) snapshotOpenAttempt({ nextLevel: 1, awaitingNext: false });
      }
      try { Sound.stopMusic(); } catch (e) {}
      attempt = null;
      run = null;
      show('start');
      paintLobby();
      return;
    }
    show('start');
    paintLobby();
  };

  function onLeavePage() {
    persistOpenAttemptOnHide();
  }
  window.addEventListener('pagehide', onLeavePage);
  window.addEventListener('beforeunload', onLeavePage);
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') onLeavePage();
  });

  window.__TD_TEST__ = {
    SESSION_LABEL: SESSION_LABEL,
    SESSION_ISO: SESSION_ISO,
    API_NS: API_NS,
    isSessionOpen: isSessionOpen,
    DEMO: DEMO,
    ITEM_SEC: ITEM_SEC,
    MAX_ATTEMPTS: MAX_ATTEMPTS,
    LEVELS: LEVELS,
    ITEMS: ITEMS,
    getRun: function () { return run; },
    getAttempt: function () { return attempt; },
    getProgress: function () { return progress; },
    getLearners: function () { return learners; },
    chestAt: chestAt,
    resolveHit: resolveHit,
    pickBonusIndices: pickBonusIndices,
    isBonusQ: isBonusQ,
    MAX_LIVES: MAX_LIVES,
    resolveMiss: resolveMiss,
    spawnChests: spawnChests,
    spawnHazards: spawnHazards,
    forceDemoStart: function (level) {
      player = (player && player.name) ? player : { name: 'Demo Diver', grade: '11', section: 'TEST' };
      attempt = { num: 1, score: 0, unlocked: LEVELS, bestLevel: 0, totalCorrect: 0, active: true };
      Sound.unlock();
      startLevel(level || 1);
    },
    swimTo: function (x, y) {
      if (!run || !run.diver) return;
      run.diver.target = null;
      pointer.down = true; pointer.x = x; pointer.y = y;
    },
    releasePointer: function () { pointer.down = false; },
    tapChestAt: function (x, y) {
      const t = chestAt(x, y);
      if (t && run && run.diver) run.diver.target = t;
      return t;
    },
  };

  if (DEMO) {
    $('load-status').textContent = 'Demo mode — scores not saved.';
    let kicked = false;
    const kick = function () {
      if (kicked) return;
      kicked = true;
      try { window.__TD_TEST__.forceDemoStart(1); } catch (e) {}
    };
    const waitLearners = setInterval(function () {
      if (learners && learners.length) { clearInterval(waitLearners); kick(); }
    }, 200);
    setTimeout(function () { clearInterval(waitLearners); kick(); }, 4000);
  }

  loadLearners();
  Sound.paintBtn();
  const btnSound = $('btn-sound');
  if (btnSound) btnSound.onclick = function () { Sound.toggle(); };
  function onViewportChange() {
    if (screens.game.classList.contains('active')) resize();
  }
  window.addEventListener('resize', onViewportChange);
  window.addEventListener('orientationchange', function () { setTimeout(onViewportChange, 120); });
  show('start');
})();
