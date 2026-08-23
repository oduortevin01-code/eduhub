/* =====================================================
   ZIMORA — SHARED APP CORE
   Loaded on every page. Each page sets <body data-page="...">
   so this file only runs the logic that page actually needs —
   a missing element on one page can never crash another page.
===================================================== */

const SUPABASE_URL = "https://mmyvoxhseuyuwpgnpedb.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_dZkQ55EXtobSqXuLbzTZQA_8Er9k-tP";
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const PAGE = document.body.dataset.page || '';
const IN_PAGES_FOLDER = location.pathname.includes('/pages/');
const ROOT = IN_PAGES_FOLDER ? '../' : './';         // path back to project root
const PAGES = IN_PAGES_FOLDER ? './' : 'pages/';     // path to the pages/ folder

/* ===================== Helpers ===================== */
function toast(msg){
  let t = document.getElementById('toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast';
    t.className = 'toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2200);
}
function initials(name){
  if (!name) return 'Z';
  return name.trim().split(/\s+/).map(p => p[0]).slice(0, 2).join('').toUpperCase();
}
function esc(value){
  return String(value)
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
}

/* ===================== Session / student info (shared across pages) ===================== */
let currentUser = null;
let eduName = 'Student', eduLevel = 'not specified';

function applyUserToState(user){
  currentUser = user;
  eduName = (user.user_metadata && user.user_metadata.full_name) || user.email.split('@')[0];
  eduLevel = (user.user_metadata && user.user_metadata.level) || 'not specified';
}

async function requireAuth(){
  const { data } = await sb.auth.getSession();
  if (!data || !data.session) {
    window.location.href = ROOT + 'index.html';
    return null;
  }
  applyUserToState(data.session.user);
  return data.session.user;
}

/* ===================== Shared chrome (topbar + drawer) ===================== */
function renderChrome(){
  const mount = document.getElementById('chrome');
  if (!mount) return;

  mount.innerHTML = `
    <div class="topbar">
      <div class="topbar-left">
        <img class="zimora-logo" src="${ROOT}zimora-logo.png" alt="Zimora">
        <span class="topbar-title">Zimora</span>
      </div>
      <div style="display:flex; gap:8px;">
        <a class="chat-icon-btn" href="${PAGES}home.html" aria-label="Home" style="background:rgba(255,255,255,0.08); color:var(--white); display:flex; align-items:center; justify-content:center; text-decoration:none;">🏠</a>
        <button class="icon-btn" id="menuOpenBtn" aria-label="Open menu">☰</button>
      </div>
    </div>
    <div class="drawer-backdrop" id="drawerBackdrop"></div>
    <div class="drawer" id="drawer">
      <div class="drawer-profile">
        <div class="avatar-circle" id="drawerAvatar">Z</div>
        <div>
          <div class="pname" id="drawerName">Student</div>
          <div class="pemail" id="drawerLevel">—</div>
        </div>
      </div>
      <div class="drawer-nav">
        <a class="drawer-item" href="${PAGES}home.html"><span class="di-icon">🏠</span> Home</a>

        <button class="drawer-item drawer-group-toggle" data-group="learn" type="button">
          <span class="di-icon">📚</span> Learn <span class="di-chev">›</span>
        </button>
        <div class="drawer-group" data-group-panel="learn">
          <a class="drawer-item drawer-sub" href="${PAGES}notes.html"><span class="di-icon">📘</span> Notes</a>
          <a class="drawer-item drawer-sub" href="${PAGES}library.html"><span class="di-icon">📚</span> Study Library</a>
          <a class="drawer-item drawer-sub" href="${PAGES}talking.html"><span class="di-icon">🎙️</span> Learn by Talking</a>
        </div>

        <button class="drawer-item drawer-group-toggle" data-group="practice" type="button">
          <span class="di-icon">🧠</span> Practice <span class="di-chev">›</span>
        </button>
        <div class="drawer-group" data-group-panel="practice">
          <a class="drawer-item drawer-sub" href="${PAGES}quiz.html"><span class="di-icon">🧠</span> Quick Quiz</a>
          <a class="drawer-item drawer-sub" href="${PAGES}exam.html"><span class="di-icon">🎯</span> Exam Coach</a>
          <a class="drawer-item drawer-sub" href="${PAGES}papers.html"><span class="di-icon">📄</span> Practice Papers</a>
        </div>

        <button class="drawer-item drawer-group-toggle" data-group="ai" type="button">
          <span class="di-icon">🤖</span> AI Tools <span class="di-chev">›</span>
        </button>
        <div class="drawer-group" data-group-panel="ai">
          <a class="drawer-item drawer-sub" href="${PAGES}chat.html"><span class="di-icon">🤖</span> Ask Zimora</a>
          <a class="drawer-item drawer-sub" href="${PAGES}scanner.html"><span class="di-icon">📷</span> Scan a Question</a>
        </div>

        <div class="drawer-divider"></div>
        <a class="drawer-item" href="${PAGES}profile.html"><span class="di-icon">📊</span> My Progress</a>
        <a class="drawer-item" href="${PAGES}profile.html"><span class="di-icon">🏆</span> Achievements</a>
        <a class="drawer-item" href="${PAGES}profile.html"><span class="di-icon">👤</span> Profile</a>
        <a class="drawer-item" href="${PAGES}settings.html"><span class="di-icon">⚙️</span> Settings</a>
        <a class="drawer-item" href="${PAGES}about.html"><span class="di-icon">ℹ️</span> About Zimora</a>
        <div class="drawer-divider"></div>
        <button class="drawer-item danger" id="signOutBtn"><span class="di-icon">🚪</span> Sign Out</button>
      </div>
      <div class="drawer-foot">Zimora v1.0.0 · Learn · Grow · Achieve</div>
    </div>
  `;

  if (currentUser) {
    document.getElementById('drawerName').textContent = eduName;
    document.getElementById('drawerLevel').textContent = eduLevel && eduLevel !== 'not specified' ? eduLevel : 'Learner';
    document.getElementById('drawerAvatar').textContent = initials(eduName);
  }

  document.querySelectorAll('.drawer-group-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const panel = document.querySelector(`[data-group-panel="${btn.dataset.group}"]`);
      const willOpen = !panel.classList.contains('open');
      document.querySelectorAll('.drawer-group').forEach(p => p.classList.remove('open'));
      document.querySelectorAll('.drawer-group-toggle').forEach(b => b.classList.remove('open'));
      if (willOpen) { panel.classList.add('open'); btn.classList.add('open'); }
    });
  });

  const drawer = document.getElementById('drawer');
  const drawerBackdrop = document.getElementById('drawerBackdrop');
  document.getElementById('menuOpenBtn')?.addEventListener('click', () => {
    drawer.classList.add('show'); drawerBackdrop.classList.add('show');
  });
  drawerBackdrop.addEventListener('click', () => {
    drawer.classList.remove('show'); drawerBackdrop.classList.remove('show');
  });
  document.getElementById('signOutBtn')?.addEventListener('click', async () => {
    await sb.auth.signOut();
    window.location.href = ROOT + 'index.html';
  });
}

/* =====================================================
   PAGE: auth (index.html)
===================================================== */
function initAuthPage(){
  const splash = document.getElementById('splash');
  const auth = document.getElementById('auth');

  sb.auth.getSession().then(({ data }) => {
    setTimeout(() => {
      if (data && data.session) {
        window.location.href = 'pages/home.html';
      } else {
        splash.classList.remove('active');
        auth.classList.add('active');
      }
    }, 4000);
  });

  const tabSignIn = document.getElementById('tabSignIn');
  const tabSignUp = document.getElementById('tabSignUp');
  const formSignIn = document.getElementById('formSignIn');
  const formSignUp = document.getElementById('formSignUp');

  tabSignIn.addEventListener('click', () => {
    tabSignIn.classList.add('active'); tabSignUp.classList.remove('active');
    formSignIn.style.display = 'block'; formSignUp.style.display = 'none';
  });
  tabSignUp.addEventListener('click', () => {
    tabSignUp.classList.add('active'); tabSignIn.classList.remove('active');
    formSignUp.style.display = 'block'; formSignIn.style.display = 'none';
  });

  formSignIn.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btnSignIn');
    const msg = document.getElementById('siMsg');
    msg.textContent = ''; msg.className = 'auth-msg';
    const email = document.getElementById('siEmail').value.trim();
    const password = document.getElementById('siPassword').value;

    btn.disabled = true; btn.innerHTML = '<span class="spinner-sm"></span>';
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    btn.disabled = false; btn.innerHTML = '<span class="btn-label">Sign In</span>';

    if (error) {
      msg.textContent = error.message || 'Could not sign in. Check your details and try again.';
      msg.classList.add('error');
      return;
    }
    msg.textContent = 'Signed in!'; msg.classList.add('success');
    window.location.href = 'pages/home.html';
  });

  formSignUp.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btnSignUp');
    const msg = document.getElementById('suMsg');
    msg.textContent = ''; msg.className = 'auth-msg';

    const name = document.getElementById('suName').value.trim();
    const level = document.getElementById('suLevel').value;
    const email = document.getElementById('suEmail').value.trim();
    const password = document.getElementById('suPassword').value;

    btn.disabled = true; btn.innerHTML = '<span class="spinner-sm"></span>';
    const { data, error } = await sb.auth.signUp({
      email, password,
      options: { data: { full_name: name, level: level } }
    });
    btn.disabled = false; btn.innerHTML = '<span class="btn-label">Create Account</span>';

    if (error) {
      msg.textContent = error.message || 'Could not create your account. Try again.';
      msg.classList.add('error');
      return;
    }
    if (data.session) {
      msg.textContent = 'Account created!'; msg.classList.add('success');
      window.location.href = 'pages/home.html';
    } else {
      msg.textContent = 'Account created — check your email to confirm, then sign in.';
      msg.classList.add('success');
      setTimeout(() => tabSignIn.click(), 1800);
    }
  });
}

/* =====================================================
   PAGE: home — real dashboard, no fake cards. Every number
   comes from Supabase `activity_log`; sections show an honest
   empty state until the learner actually has activity.
===================================================== */
const DAILY_GOAL_MINUTES = 30; // a target shown on the goal bar, not fabricated activity

async function initHomePage(){
  const greet = document.getElementById('greetName');
  if (!greet) return;
  greet.textContent = eduName.split(' ')[0];

  const continueSlot = document.getElementById('continueSlot');
  const todaySlot = document.getElementById('todaySlot');
  const goalFill = document.getElementById('goalFill');
  const goalReadout = document.getElementById('goalReadout');
  const streakRow = document.getElementById('streakRow');
  const statLessons = document.getElementById('statLessons');
  const statQuizzes = document.getElementById('statQuizzes');
  const statExams = document.getElementById('statExams');

  const { data: rows, error } = await sb.from('activity_log')
    .select('kind, subject, topic, minutes, progress, created_at')
    .eq('user_id', currentUser.id)
    .order('created_at', { ascending: false });

  if (error) {
    if (continueSlot) continueSlot.innerHTML = `<p class="empty-note">Could not load your activity right now.</p>`;
    if (todaySlot) todaySlot.innerHTML = `<p class="empty-note">Could not load today's activity right now.</p>`;
    return;
  }

  const all = rows || [];

  // Continue Learning — most recent lesson-type activity, real or nothing
  const lastLesson = all.find(r => r.kind === 'lesson');
  if (continueSlot) {
    continueSlot.innerHTML = lastLesson
      ? `<b>📘 ${esc(lastLesson.subject)}${lastLesson.topic ? ' — ' + esc(lastLesson.topic) : ''}</b>
         <div class="progress" style="margin-top:10px"><i style="width:${Math.max(0, Math.min(100, lastLesson.progress || 0))}%"></i></div>
         <a class="btn-primary" style="display:block;text-align:center;margin-top:12px;text-decoration:none" href="notes.html">Continue →</a>`
      : `<p class="empty-note">No lesson started yet.</p>
         <a class="btn-primary" style="display:block;text-align:center;margin-top:10px;text-decoration:none" href="notes.html">📘 Start a lesson</a>`;
  }

  // Today's learning, grouped by subject
  const todayStr = new Date().toDateString();
  const todayRows = all.filter(r => new Date(r.created_at).toDateString() === todayStr);
  const todayMinutes = todayRows.reduce((sum, r) => sum + (r.minutes || 0), 0);

  if (todaySlot) {
    if (todayRows.length) {
      const bySubject = {};
      todayRows.forEach(r => { bySubject[r.subject] = (bySubject[r.subject] || 0) + (r.minutes || 0); });
      const dots = ['#f5b301', '#4f8fef', '#1c8a4a', '#e0483e'];
      todaySlot.innerHTML = Object.entries(bySubject).map(([subject, mins], i) =>
        `<div class="today-row"><span><span class="dot" style="background:${dots[i % dots.length]}"></span>${esc(subject)}</span><span class="mins">${mins} min</span></div>`
      ).join('');
    } else {
      todaySlot.innerHTML = `<p class="empty-note">No activity yet today — once you start a lesson or quiz, it'll show up here.</p>`;
    }
  }

  if (goalFill && goalReadout) {
    const pct = Math.max(0, Math.min(100, Math.round((todayMinutes / DAILY_GOAL_MINUTES) * 100)));
    goalFill.style.width = pct + '%';
    goalReadout.textContent = `${todayMinutes}/${DAILY_GOAL_MINUTES} min`;
  }

  // Lesson / quiz / exam counts, all-time
  const counts = { lesson: 0, quiz: 0, exam: 0 };
  all.forEach(r => { if (counts[r.kind] !== undefined) counts[r.kind]++; });
  if (statLessons) statLessons.textContent = counts.lesson;
  if (statQuizzes) statQuizzes.textContent = counts.quiz;
  if (statExams) statExams.textContent = counts.exam;

  // Streak — consecutive days (today or yesterday, then backward) with any activity
  const activeDays = new Set(all.map(r => new Date(r.created_at).toDateString()));
  let streak = 0;
  let cursor = new Date();
  if (!activeDays.has(cursor.toDateString())) cursor.setDate(cursor.getDate() - 1);
  while (activeDays.has(cursor.toDateString())) { streak++; cursor.setDate(cursor.getDate() - 1); }
  if (streakRow) {
    streakRow.innerHTML = streak > 0
      ? `<span class="streak-num">🔥 ${streak}</span><span class="streak-txt">day${streak === 1 ? '' : 's'} streak</span>`
      : `<span class="streak-txt">Start today to begin your streak</span>`;
  }
}

// Records one real learning event. Call this from any page right after
// a lesson/quiz/exam actually happens — never on page load, never speculatively.
async function logActivity({ kind, subject, topic = null, minutes = 0, score = null, progress = null }){
  if (!currentUser) return;
  const { error } = await sb.from('activity_log').insert({
    user_id: currentUser.id, kind, subject, topic, minutes, score, progress
  });
  if (error) console.warn('logActivity failed:', error.message);
}

/* =====================================================
   Shared: notes rendering (chat / library / notes / papers all reuse this)
===================================================== */
function renderRichText(container, text){
  const safeText = text.replace(/\[YOUTUBE_SEARCH:(.*?)\]/g, (m, q) => {
    const query = q.trim();
    const url = 'https://www.youtube.com/results?search_query=' + encodeURIComponent(query + ' explanation for students');
    return `<div class="video-card"><div class="video-card-label">🎬 Recommended video</div><a href="${url}" target="_blank" rel="noopener">Search "${query}" on YouTube ↗</a></div>`;
  });
  container.innerHTML = marked.parse(safeText);

  if (window.renderMathInElement) {
    renderMathInElement(container, { delimiters:[{left:"$$",right:"$$",display:true},{left:"$",right:"$",display:false}] });
  }
  const mermaidBlocks = container.querySelectorAll('code.language-mermaid');
  if (mermaidBlocks.length && window.mermaid) {
    mermaidBlocks.forEach(block => {
      const div = document.createElement('div');
      div.className = 'mermaid';
      div.textContent = block.textContent;
      block.closest('pre').replaceWith(div);
    });
    try { mermaid.init(undefined, container.querySelectorAll('.mermaid')); } catch(e) { console.error(e); }
  }
}

async function downloadAsPDF(el, filenamePrefix){
  if (!window.html2canvas || !window.jspdf) { toast('PDF tool still loading, try again in a moment.'); return; }
  try {
    const canvas = await html2canvas(el, { backgroundColor: '#ffffff', scale: 2 });
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p', 'pt', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth - 40;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 20;
    const imgData = canvas.toDataURL('image/png');
    pdf.addImage(imgData, 'PNG', 20, position, imgWidth, imgHeight);
    heightLeft -= (pageHeight - 40);
    while (heightLeft > 0) {
      position = heightLeft - imgHeight + 20;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 20, position, imgWidth, imgHeight);
      heightLeft -= (pageHeight - 40);
    }
    pdf.save(`${filenamePrefix}-${Date.now()}.pdf`);
  } catch (e) {
    console.error(e);
    toast('Could not create PDF. Try again.');
  }
}

let currentUtterance = null;
function speakText(text, btn){
  if (!window.speechSynthesis) { toast('Voice playback is not supported on this browser.'); return; }
  if (currentUtterance && speechSynthesis.speaking) {
    speechSynthesis.cancel();
    document.querySelectorAll('.msg-action-btn.speaking').forEach(b => { b.classList.remove('speaking'); b.textContent = '🔊 Listen'; });
    currentUtterance = null;
    return;
  }
  const utter = new SpeechSynthesisUtterance(text);
  utter.rate = 0.98;
  utter.onstart = () => { if (btn) { btn.classList.add('speaking'); btn.textContent = '⏸ Stop'; } };
  utter.onend = () => { if (btn) { btn.classList.remove('speaking'); btn.textContent = '🔊 Listen'; } currentUtterance = null; };
  utter.onerror = () => { if (btn) { btn.classList.remove('speaking'); btn.textContent = '🔊 Listen'; } currentUtterance = null; };
  currentUtterance = utter;
  speechSynthesis.speak(utter);
}

async function askZimora(body){
  const res = await fetch('/api/ask', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(Object.assign({ eduName, eduLevel }, body))
  });
  return res.json();
}

// Streaming variant — shows Zimora's reply token-by-token as it's generated
// instead of waiting for the whole answer. This is the real fix for "slow":
// the first words appear as soon as the model starts responding, rather than
// after the full ~1500-token reply has finished generating server-side.
// onToken(fullTextSoFar) is called after every chunk; returns the final text.
async function askZimoraStream(body, onToken){
  const res = await fetch('/api/ask', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(Object.assign({ eduName, eduLevel, stream: true }, body))
  });
  if (!res.ok || !res.body) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.reply || 'Connection error.');
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let full = '';
  let buffer = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop(); // keep the last partial line for next chunk
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const payload = line.slice(6).trim();
      if (payload === '[DONE]') continue;
      try {
        const parsed = JSON.parse(payload);
        const delta = parsed.choices?.[0]?.delta?.content;
        if (delta) { full += delta; onToken(full); }
      } catch (e) { /* ignore partial/malformed chunk */ }
    }
  }
  return full;
}

/* =====================================================
   PAGE: chat
===================================================== */
let chatHistory = [];
let notesContext = '';
let voiceModeActive = false;

function chatAddMsg(text, who, withActions){
  if (withActions === undefined) withActions = true;
  const chatEl = document.getElementById('chat');
  const wrap = document.createElement('div');
  wrap.className = 'msg ' + who;
  renderRichText(wrap, text);
  chatEl.appendChild(wrap);

  if (who === 'ai' && withActions) {
    const actions = document.createElement('div');
    actions.className = 'msg-actions';
    actions.innerHTML = `
      <button class="msg-action-btn" data-action="speak">🔊 Listen</button>
      <button class="msg-action-btn" data-action="copy">📋 Copy</button>
      <button class="msg-action-btn" data-action="regenerate">🔄 Regenerate</button>
      <button class="msg-action-btn" data-action="pdf">⬇️ PDF</button>
      <button class="msg-action-btn" data-action="simpler">💡 Explain simpler</button>
      <button class="msg-action-btn" data-action="example">📝 Example</button>
      <button class="msg-action-btn" data-action="quizme">🧠 Quiz me</button>
    `;
    wrap.appendChild(actions);
    actions.querySelector('[data-action="pdf"]').addEventListener('click', () => downloadAsPDF(wrap, 'Zimora-Notes'));
    actions.querySelector('[data-action="speak"]').addEventListener('click', (e) => {
      const clone = wrap.cloneNode(true);
      clone.querySelectorAll('.msg-actions').forEach(el => el.remove());
      speakText(clone.textContent.trim(), e.currentTarget);
    });
    actions.querySelector('[data-action="copy"]').addEventListener('click', async (e) => {
      const clone = wrap.cloneNode(true);
      clone.querySelectorAll('.msg-actions').forEach(el => el.remove());
      try {
        await navigator.clipboard.writeText(clone.textContent.trim());
        const btn = e.currentTarget; const old = btn.textContent;
        btn.textContent = '✅ Copied'; setTimeout(() => btn.textContent = old, 1500);
      } catch (err) { toast('Could not copy. Try selecting the text manually.'); }
    });
    actions.querySelector('[data-action="regenerate"]').addEventListener('click', () => {
      if (window.zimoraResend) window.zimoraResend();
    });
    actions.querySelector('[data-action="simpler"]').addEventListener('click', () => {
      if (window.zimoraFollowUp) window.zimoraFollowUp('Can you explain that more simply?');
    });
    actions.querySelector('[data-action="example"]').addEventListener('click', () => {
      if (window.zimoraFollowUp) window.zimoraFollowUp('Can you give me an example of that?');
    });
    actions.querySelector('[data-action="quizme"]').addEventListener('click', () => {
      if (window.zimoraFollowUp) window.zimoraFollowUp('Quiz me on that.');
    });
  }
  chatEl.scrollTop = chatEl.scrollHeight;
  return wrap;
}

function startFreshChat(){
  chatHistory = [];
  document.getElementById('chat').innerHTML = '';
  const welcome = document.getElementById('chatWelcome');
  if (welcome) welcome.style.display = 'block';
}

function initChatPage(){
  const chatEl = document.getElementById('chat');
  if (!chatEl) return;

  const welcomeName = document.getElementById('welcomeName');
  if (welcomeName) welcomeName.textContent = eduName.split(' ')[0];

  let lastPrompt = '', lastImage = null;

  // If arriving from Scanner or Library with pending content, load it
  const pendingImage = sessionStorage.getItem('zimora_pending_image');
  const pendingNotes = sessionStorage.getItem('zimora_pending_notes');
  const pendingNotesName = sessionStorage.getItem('zimora_pending_notes_name');
  const pendingPrompt = sessionStorage.getItem('zimora_pending_prompt');

  startFreshChat();

  let promptConsumed = false;
  if (pendingNotes) {
    notesContext = pendingNotes.slice(0, 16000);
    document.getElementById('notesPillText').textContent = '📄 Studying: ' + pendingNotesName;
    document.getElementById('notesPill').style.display = 'flex';
    hideWelcome();
    sessionStorage.removeItem('zimora_pending_notes');
    sessionStorage.removeItem('zimora_pending_notes_name');
    if (pendingPrompt) {
      sessionStorage.removeItem('zimora_pending_prompt');
      promptConsumed = true;
      chatAddMsg(pendingPrompt, 'user');
      sendToAI(pendingPrompt);
    } else {
      chatAddMsg(`Got your notes from **${pendingNotesName}**! Ask me anything about it, or say "quiz me on this".`, 'ai');
    }
  }

  document.getElementById('notesPillClear')?.addEventListener('click', () => {
    notesContext = '';
    document.getElementById('notesPill').style.display = 'none';
  });

  function hideWelcome(){
    const welcome = document.getElementById('chatWelcome');
    if (welcome) welcome.style.display = 'none';
  }

  document.querySelectorAll('.suggest-card').forEach(card => {
    card.addEventListener('click', () => {
      const p = document.getElementById('prompt');
      p.value = card.dataset.prompt;
      p.focus();
      p.setSelectionRange(p.value.length, p.value.length);
    });
  });

  if (pendingImage) {
    sessionStorage.removeItem('zimora_pending_image');
    hideWelcome();
    const imgWrap = document.createElement('div');
    imgWrap.className = 'msg user';
    imgWrap.innerHTML = `<img src="${pendingImage}" alt="Uploaded photo" style="max-width:100%; border-radius:12px; display:block;">`;
    chatEl.appendChild(imgWrap);
    sendToAI('Please read this and explain the answer step by step.', pendingImage);
  }

  if (pendingPrompt && !pendingImage && !promptConsumed) {
    sessionStorage.removeItem('zimora_pending_prompt');
    hideWelcome();
    chatAddMsg(pendingPrompt, 'user');
    sendToAI(pendingPrompt);
  }

  async function sendToAI(text, image){
    hideWelcome();
    lastPrompt = text; lastImage = image || null;
    const sendBtn = document.getElementById('sendBtn');
    sendBtn.disabled = true;

    if (image) {
      // Vision replies aren't streamed by the model — keep the typing indicator for these.
      const thinking = chatAddMsg('<span class="typing-dots"><span></span><span></span><span></span></span>', 'ai', false);
      try {
        const data = await askZimora({ prompt: text, history: chatHistory.slice(-10).join('\n'), notes: notesContext, image });
        thinking.remove();
        const reply = data.reply || 'Sorry, I had trouble with that. Try asking again.';
        const wrap = chatAddMsg(reply, 'ai');
        chatHistory.push('User: ' + text); chatHistory.push('AI: ' + reply);
        if (voiceModeActive) speakAndListenAgain(wrap);
      } catch (e) {
        thinking.remove();
        chatAddMsg('Connection error. Check your internet and try again.', 'ai');
      }
      sendBtn.disabled = false;
      return;
    }

    // Live token-by-token reply
    const wrap = document.createElement('div');
    wrap.className = 'msg ai';
    wrap.innerHTML = '<span class="typing-dots"><span></span><span></span><span></span></span>';
    chatEl.appendChild(wrap);
    chatEl.scrollTop = chatEl.scrollHeight;

    try {
      let firstToken = true;
      const full = await askZimoraStream(
        { prompt: text, history: chatHistory.slice(-10).join('\n'), notes: notesContext },
        (soFar) => {
          if (firstToken) { wrap.textContent = ''; firstToken = false; }
          wrap.textContent = soFar; // fast raw text while streaming
          chatEl.scrollTop = chatEl.scrollHeight;
        }
      );
      const reply = full || 'Sorry, I had trouble with that. Try asking again.';
      wrap.remove();
      const finalWrap = chatAddMsg(reply, 'ai'); // final pass: full markdown/math/mermaid render
      chatHistory.push('User: ' + text);
      chatHistory.push('AI: ' + reply);
      logActivity({ kind: 'lesson', subject: notesContext ? 'Uploaded material' : 'Ask Zimora', topic: text.slice(0, 80), minutes: 1 });
      if (voiceModeActive) speakAndListenAgain(finalWrap);
    } catch (e) {
      wrap.remove();
      chatAddMsg('Connection error. Check your internet and try again.', 'ai');
    }
    sendBtn.disabled = false;
  }

  function sendMsg(){
    const p = document.getElementById('prompt');
    const text = p.value.trim();
    if (!text) return;
    chatAddMsg(text, 'user');
    p.value = ''; p.style.height = 'auto';
    sendToAI(text);
  }

  window.zimoraResend = function(){
    if (!lastPrompt && !lastImage) return;
    sendToAI(lastPrompt, lastImage);
  };
  window.zimoraFollowUp = function(text){
    chatAddMsg(text, 'user');
    sendToAI(text);
  };

  document.getElementById('sendBtn')?.addEventListener('click', sendMsg);
  document.getElementById('prompt')?.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg(); }
  });
  document.getElementById('prompt')?.addEventListener('input', function(){
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 110) + 'px';
  });
  document.getElementById('newChatBtn')?.addEventListener('click', () => {
    if (confirm('Start a new chat? This clears the current conversation.')) startFreshChat();
  });

  function startListening(){
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { toast('Voice input is not supported on this browser.'); return; }
    const rec = new SR();
    rec.lang = 'en-KE';
    const micBtn = document.getElementById('micBtn');
    micBtn.classList.add('mic-listening'); micBtn.textContent = '🔴';
    rec.onresult = e => { document.getElementById('prompt').value = e.results[0][0].transcript; sendMsg(); };
    rec.onend = () => { micBtn.classList.remove('mic-listening'); micBtn.textContent = '🎤'; };
    rec.onerror = () => { micBtn.classList.remove('mic-listening'); micBtn.textContent = '🎤'; };
    rec.start();
  }
  window.startListening = startListening; // used by voice-mode auto-loop too
  document.getElementById('micBtn')?.addEventListener('click', startListening);

  function speakAndListenAgain(wrap){
    const actions = wrap.querySelector('.msg-actions');
    const speakBtn = actions ? actions.querySelector('[data-action="speak"]') : null;
    if (!speakBtn || !window.speechSynthesis) return;
    const clone = wrap.cloneNode(true);
    clone.querySelectorAll('.msg-actions').forEach(el => el.remove());
    const text = clone.textContent.trim();
    if (!text) return;
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 0.98;
    utter.onstart = () => { speakBtn.classList.add('speaking'); speakBtn.textContent = '⏸ Stop'; };
    utter.onend = () => { speakBtn.classList.remove('speaking'); speakBtn.textContent = '🔊 Listen'; if (voiceModeActive) startListening(); };
    utter.onerror = () => { speakBtn.classList.remove('speaking'); speakBtn.textContent = '🔊 Listen'; };
    currentUtterance = utter;
    speechSynthesis.speak(utter);
  }

  const voiceParam = new URLSearchParams(location.search).get('voice');
  if (voiceParam === '1') {
    voiceModeActive = true;
    document.getElementById('voiceModeBar').style.display = 'flex';
  }
  document.getElementById('voiceModeOffBtn')?.addEventListener('click', () => {
    voiceModeActive = false;
    document.getElementById('voiceModeBar').style.display = 'none';
    if (window.speechSynthesis) speechSynthesis.cancel();
  });

  // Attach / upload sheet
  const uploadSheet = document.getElementById('uploadSheet');
  const uploadBackdrop = document.getElementById('uploadBackdrop');
  function openSheet(){ uploadSheet.classList.add('show'); uploadBackdrop.classList.add('show'); }
  function closeSheet(){ uploadSheet.classList.remove('show'); uploadBackdrop.classList.remove('show'); }
  document.getElementById('attachBtn')?.addEventListener('click', openSheet);
  uploadBackdrop.addEventListener('click', closeSheet);
  document.querySelectorAll('[data-pick]').forEach(btn => {
    btn.addEventListener('click', () => {
      closeSheet();
      const kind = btn.dataset.pick;
      if (kind === 'image') document.getElementById('fileImage').click();
      if (kind === 'file') document.getElementById('fileDoc').click();
      if (kind === 'video') document.getElementById('fileVideo').click();
    });
  });

  document.getElementById('fileDoc')?.addEventListener('change', async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const wrap = document.createElement('div');
    wrap.className = 'msg attach';
    wrap.textContent = '📄 Reading ' + f.name + '…';
    chatEl.appendChild(wrap);
    try {
      const text = await extractTextFromFile(f);
      if (!text || !text.trim()) throw new Error('Could not find any readable text in that file.');
      wrap.textContent = '📄 ' + f.name;
      notesContext = text.slice(0, 16000);
      document.getElementById('notesPillText').textContent = '📄 Studying: ' + f.name;
      document.getElementById('notesPill').style.display = 'flex';
      chatAddMsg(`Got your notes from **${f.name}**! Ask me anything about it, or say "quiz me on this".`, 'ai');
    } catch (err) {
      wrap.remove();
      toast(err.message || 'Could not read that file.');
    }
    e.target.value = '';
  });

  document.getElementById('fileImage')?.addEventListener('change', async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const dataUrl = await fileToDataURL(f);
    const imgWrap = document.createElement('div');
    imgWrap.className = 'msg user';
    imgWrap.innerHTML = `<img src="${dataUrl}" alt="Uploaded photo" style="max-width:100%; border-radius:12px; display:block;">`;
    chatEl.appendChild(imgWrap);
    const p = document.getElementById('prompt');
    const userText = p.value.trim() || 'Please read this and explain the answer step by step.';
    p.value = '';
    sendToAI(userText, dataUrl);
    e.target.value = '';
  });

  document.getElementById('fileVideo')?.addEventListener('change', (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const wrap = document.createElement('div');
    wrap.className = 'msg attach';
    wrap.textContent = '📎 ' + f.name;
    chatEl.appendChild(wrap);
    e.target.value = '';
  });
}

function fileToDataURL(file){
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function extractTextFromFile(file){
  const name = file.name.toLowerCase();
  if (name.endsWith('.txt')) return await file.text();
  if (name.endsWith('.pdf')) {
    if (!window.pdfjsLib) throw new Error('PDF reader still loading, try again in a moment.');
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    const buf = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
    let text = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map(it => it.str).join(' ') + '\n\n';
    }
    return text;
  }
  if (name.endsWith('.docx')) {
    if (!window.mammoth) throw new Error('Word reader still loading, try again in a moment.');
    const buf = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer: buf });
    return result.value;
  }
  if (name.endsWith('.doc')) throw new Error("Older .doc files aren't supported — please save as PDF, DOCX, or TXT.");
  throw new Error('Unsupported file type.');
}

/* =====================================================
   PAGE: library (study from your own uploaded notes)
===================================================== */
function initLibraryPage(){
  const dropBtn = document.getElementById('libraryUploadBtn');
  if (!dropBtn) return;
  const input = document.getElementById('libraryFileInput');
  const status = document.getElementById('libraryStatus');

  dropBtn.addEventListener('click', () => input.click());
  input.addEventListener('change', async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    status.textContent = 'Reading ' + f.name + '…';
    try {
      const text = await extractTextFromFile(f);
      if (!text || !text.trim()) throw new Error('Could not find readable text in that file.');
      sessionStorage.setItem('zimora_pending_notes', text);
      sessionStorage.setItem('zimora_pending_notes_name', f.name);
      status.textContent = 'Got it! Opening your study session…';
      setTimeout(() => { window.location.href = 'chat.html'; }, 500);
    } catch (err) {
      status.textContent = err.message || 'Could not read that file.';
    }
  });
}

/* =====================================================
   PAGE: talking (Learn by Talking — real AI tutor entry point,
   routes into the actual chat engine so nothing here is a
   separate/fake conversation system)
===================================================== */
function initTalkingPage(){
  const startBtn = document.getElementById('talkStartBtn');
  if (!startBtn) return;

  const talkName = document.getElementById('talkName');
  if (talkName) talkName.textContent = eduName.split(' ')[0];

  let selectedStyle = document.querySelector('#styleChips .chip.active')?.dataset.style || '';

  document.querySelectorAll('#styleChips .chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('#styleChips .chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      selectedStyle = chip.dataset.style;
    });
  });

  function goToChat(prompt){
    const status = document.getElementById('talkStatus');
    if (status) status.textContent = '✨ Zimora is preparing your lesson…';
    const finalPrompt = selectedStyle ? `${prompt} (${selectedStyle})` : prompt;
    sessionStorage.setItem('zimora_pending_prompt', finalPrompt);
    window.location.href = 'chat.html';
  }

  // Structured interactive lesson (Tutor page) — used for topic-based modes,
  // where a real step-by-step lesson with a diagram + quiz check is more
  // useful than a plain chat reply.
  function goToTutor(topic, mode){
    const finalTopic = selectedStyle ? `${topic} — ${selectedStyle}` : topic;
    localStorage.setItem('zimoraLearningRequest', finalTopic);
    localStorage.setItem('zimoraLearningMode', mode);
    window.location.href = 'tutor.html';
  }

  startBtn.addEventListener('click', () => {
    const text = document.getElementById('talkPrompt').value.trim();
    if (text) { goToTutor(text, 'teach'); return; }
    window.location.href = 'voice-learning.html';
  });
  document.getElementById('talkPrompt')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') startBtn.click();
  });

  const modeLabels = {
    teach: 'Teach me', quiz: 'Quiz me', assignment: 'Give me an assignment',
    revise: 'Revise with me', explain: 'Explain a topic', showwork: 'Show my work'
  };
  document.querySelectorAll('#modeGrid [data-mode]').forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.mode;
      if (mode === 'showwork') {
        // Needs an actual attempt/photo — that's a conversation, not a single lesson card.
        goToChat('I want to show you my work on a question so you can check it and explain any mistakes. Ask me to describe or attach my attempt.');
        return;
      }
      const p = document.getElementById('talkPrompt');
      const typed = p.value.trim();
      if (typed) { goToTutor(typed, mode); return; }
      p.placeholder = `What topic? (${modeLabels[mode]})`;
      p.focus();
    });
  });

  // Voice input for the main prompt field
  document.getElementById('talkMicBtn')?.addEventListener('click', () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { toast('Voice input is not supported on this browser.'); return; }
    const rec = new SR();
    rec.lang = 'en-KE';
    const status = document.getElementById('talkStatus');
    if (status) status.textContent = '🎙️ Zimora is listening…';
    rec.onresult = e => { document.getElementById('talkPrompt').value = e.results[0][0].transcript; };
    rec.onend = () => { if (status) status.textContent = '🟢 Zimora is ready to teach'; };
    rec.onerror = () => { if (status) status.textContent = '🟢 Zimora is ready to teach'; };
    rec.start();
  });

  // Learn from your material — same real handoff pattern as the Library page
  document.getElementById('talkFileBtn')?.addEventListener('click', () => document.getElementById('talkFileInput').click());
  document.getElementById('talkImageBtn')?.addEventListener('click', () => document.getElementById('talkImageInput').click());
  document.getElementById('talkLibraryBtn')?.addEventListener('click', () => { window.location.href = 'library.html'; });

  document.getElementById('talkFileInput')?.addEventListener('change', async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const status = document.getElementById('talkStatus');
    if (status) status.textContent = '📖 Reading your material…';
    try {
      const text = await extractTextFromFile(f);
      if (!text || !text.trim()) throw new Error('Could not find readable text in that file.');
      sessionStorage.setItem('zimora_pending_notes', text);
      sessionStorage.setItem('zimora_pending_notes_name', f.name);
      sessionStorage.setItem('zimora_pending_prompt', `Teach me from this material, starting from the beginning.${selectedStyle ? ' (' + selectedStyle + ')' : ''}`);
      window.location.href = 'chat.html';
    } catch (err) {
      if (status) status.textContent = '🟢 Zimora is ready to teach';
      toast(err.message || 'Could not read that file.');
    }
  });

  document.getElementById('talkImageInput')?.addEventListener('change', async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const dataUrl = await fileToDataURL(f);
    sessionStorage.setItem('zimora_pending_image', dataUrl);
    window.location.href = 'chat.html';
  });

  // Continue Learning — real, from activity_log, same as Home
  (async () => {
    const slot = document.getElementById('talkContinueSlot');
    if (!slot) return;
    const { data: lastLesson } = await sb.from('activity_log')
      .select('subject, topic, progress, created_at')
      .eq('user_id', currentUser.id).eq('kind', 'lesson')
      .order('created_at', { ascending: false }).limit(1).maybeSingle();
    slot.innerHTML = lastLesson
      ? `<b>📘 ${esc(lastLesson.subject)}${lastLesson.topic ? ' — ' + esc(lastLesson.topic) : ''}</b>
         <div class="progress" style="margin-top:10px"><i style="width:${Math.max(0, Math.min(100, lastLesson.progress || 0))}%"></i></div>
         <button class="btn-primary" style="display:block;width:100%;margin-top:12px" id="talkContinueBtn">▶ Continue Learning</button>`
      : `<p class="empty-note">No lesson started yet — pick a mode above to begin.</p>`;
    document.getElementById('talkContinueBtn')?.addEventListener('click', () => {
      goToTutor(`Continue where I left off with ${lastLesson.subject}${lastLesson.topic ? ': ' + lastLesson.topic : ''}`, 'teach');
    });
  })();
}

/* =====================================================
   Structured interactive lesson — same JSON shape the Tutor
   page renders, generated via our real NVIDIA-backed askZimora
   (not a separate AI provider).
===================================================== */
async function getZimoraLesson(message, mode, eduLevelParam){
  const prompt = `You are Zimora, a patient AI tutor. Education level: ${eduLevelParam || eduLevel}. Mode: ${mode || 'teach'}.
Teach the following clearly, step by step, with a simple example: "${message}"

Respond with ONLY valid JSON (no markdown fences, no extra text) in exactly this shape:
{"title":"...", "introduction":"...", "explanation":"...", "keyPoints":["...","..."], "example":"...", "visual":{"type":"diagram|none","title":"...","description":"...","searchQuery":"...","diagramCode":"flowchart TD; A-->B;"}, "nextStepQuestion":"...", "quiz":{"question":"...","options":["A","B","C","D"],"correctAnswer":0,"explanation":"..."}}
If a diagram would genuinely help, set visual.type to "diagram" and give real mermaid flowchart code; otherwise set type to "none" and leave diagramCode empty.`;

  const data = await askZimora({ prompt });
  let raw = (data.reply || '').trim();
  raw = raw.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```\s*$/, '');
  return JSON.parse(raw);
}

/* =====================================================
   PAGE: voice — full-screen voice capture, hands off to Tutor
===================================================== */
function initVoiceLearningPage(){
  const micButton = document.getElementById('micButton');
  if (!micButton) return;

  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  let recognition = null, isListening = false;

  document.getElementById('openLessonBtn')?.addEventListener('click', () => {
    window.location.href = 'tutor.html';
  });

  if (!SR) {
    document.getElementById('voiceTitle').textContent = 'Voice input is not supported on this browser.';
    document.getElementById('controlLabel').textContent = 'Try typing your topic on the Learn by Talking page instead.';
    micButton.disabled = true;
    return;
  }

  recognition = new SR();
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.lang = 'en-KE';

  recognition.onstart = () => {
    isListening = true;
    document.getElementById('voiceStage').classList.add('listening');
    micButton.classList.add('listening');
    document.getElementById('voiceTitle').textContent = "I'm listening…";
    document.getElementById('statusText').textContent = '🎙️ Zimora is listening';
  };
  recognition.onresult = (e) => {
    let t = '';
    for (let i = e.resultIndex; i < e.results.length; i++) t += e.results[i][0].transcript;
    document.getElementById('transcriptCard').style.display = 'block';
    document.getElementById('transcriptText').textContent = t;
    if (e.results[e.results.length - 1].isFinal) {
      localStorage.setItem('zimoraLearningRequest', t);
      localStorage.setItem('zimoraLearningMode', 'teach');
      document.getElementById('responseCard').style.display = 'block';
      document.getElementById('responseText').textContent = "Great! I have your topic. Open the interactive lesson and I'll teach you step by step.";
      speakOnce("Great! I have your topic. Let's learn it step by step.");
    }
  };
  recognition.onend = () => {
    isListening = false;
    document.getElementById('voiceStage').classList.remove('listening');
    micButton.classList.remove('listening');
    document.getElementById('statusText').textContent = '🟢 Zimora is ready';
  };
  recognition.onerror = () => {
    isListening = false;
    document.getElementById('voiceTitle').textContent = 'Please try again.';
  };

  function speakOnce(text){
    if (!window.speechSynthesis) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.95;
    speechSynthesis.speak(u);
  }

  micButton.addEventListener('click', () => {
    if (window.speechSynthesis) speechSynthesis.cancel();
    if (isListening) recognition.stop(); else recognition.start();
  });
}

/* =====================================================
   PAGE: tutor — structured interactive lesson viewer
===================================================== */
function initTutorPage(){
  const loading = document.getElementById('lessonLoading');
  if (!loading) return;
  loadZimoraLesson();

  async function loadZimoraLesson(){
    const message = localStorage.getItem('zimoraLearningRequest');
    if (!message) { window.location.href = 'talking.html'; return; }
    const mode = localStorage.getItem('zimoraLearningMode') || 'teach';
    const stopStatus = cycleStatus(loading, [
      '🤖 Understanding your topic…',
      '📖 Preparing the lesson…',
      '💡 Adding examples…',
      '🧠 Creating your quick check…'
    ], 1500);
    try {
      const lesson = await getZimoraLesson(message, mode);
      stopStatus();
      loading.style.display = 'none';
      document.getElementById('zimoraLesson').style.display = 'block';
      renderLesson(lesson);
      logActivity({ kind: 'lesson', subject: 'Learn by Talking', topic: message.slice(0, 80), minutes: 2, progress: 0 });
    } catch (e) {
      stopStatus();
      loading.textContent = 'Could not load the lesson: ' + (e.message || 'please try again.');
    }
  }

  let currentLessonData = null;

  function renderLesson(l){
    currentLessonData = l;
    document.getElementById('lessonTitle').textContent = l.title || '';
    document.getElementById('lessonIntroduction').textContent = l.introduction || '';
    document.getElementById('lessonExplanation').textContent = l.explanation || '';
    document.getElementById('lessonExample').textContent = l.example || '';
    document.getElementById('nextStepQuestion').textContent = l.nextStepQuestion || '';
    const kp = document.getElementById('keyPoints');
    kp.innerHTML = '';
    (l.keyPoints || []).forEach(x => {
      const d = document.createElement('div');
      d.className = 'key-point';
      d.textContent = '✓ ' + x;
      kp.appendChild(d);
    });
    renderVisual(l.visual || { type: 'none', title: 'Visual Learning', description: '' });
    renderQuiz(l.quiz);
  }

  async function renderVisual(v){
    document.getElementById('visualTitle').textContent = v.title || 'Visual Learning';
    document.getElementById('visualDescription').textContent = v.description || '';
    const c = document.getElementById('visualContent');
    c.innerHTML = '';
    if (v.type === 'diagram' && v.diagramCode && window.mermaid) {
      const d = document.createElement('div');
      d.className = 'mermaid-diagram';
      c.appendChild(d);
      try {
        const out = await mermaid.render('zimora-lesson-' + Date.now(), v.diagramCode);
        d.innerHTML = out.svg;
      } catch (e) { c.textContent = 'Diagram could not be rendered.'; }
    } else {
      c.innerHTML = `<div style="text-align:center"><h3 style="font-family:var(--font-display);margin:0 0 6px">📚 ${esc(v.title || '')}</h3><p style="color:var(--muted);font-size:12.5px">${esc(v.description || '')}</p></div>`;
    }
  }

  function renderQuiz(q){
    if (!q) return;
    document.getElementById('quizQuestion').textContent = q.question || '';
    const c = document.getElementById('quizOptions');
    c.innerHTML = '';
    document.getElementById('quizFeedback').style.display = 'none';
    (q.options || []).forEach((o, i) => {
      const b = document.createElement('button');
      b.className = 'quiz-option';
      b.textContent = o;
      b.addEventListener('click', () => checkQuiz(i, q, b));
      c.appendChild(b);
    });
  }

  function checkQuiz(i, q, b){
    const all = document.querySelectorAll('.quiz-option');
    all.forEach(x => x.disabled = true);
    if (all[q.correctAnswer]) all[q.correctAnswer].classList.add('correct');
    if (i !== q.correctAnswer) b.classList.add('wrong');
    const f = document.getElementById('quizFeedback');
    f.style.display = 'block';
    f.textContent = (i === q.correctAnswer ? '🎉 Correct! ' : '💡 Not quite. ') + (q.explanation || '');
  }

  document.getElementById('speakLessonBtn')?.addEventListener('click', () => {
    if (!currentLessonData || !window.speechSynthesis) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(`${currentLessonData.title}. ${currentLessonData.introduction}. ${currentLessonData.explanation}`);
    u.rate = 0.95;
    speechSynthesis.speak(u);
  });
  document.getElementById('continueLessonBtn')?.addEventListener('click', () => {
    localStorage.removeItem('zimoraLearningRequest');
    localStorage.removeItem('zimoraLearningMode');
    window.location.href = 'talking.html';
  });
}

function initNotesPage(){
  const form = document.getElementById('notesForm');
  if (!form) return;
  const result = document.getElementById('notesResult');
  const btn = document.getElementById('notesGenBtn');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const topic = document.getElementById('notesTopic').value.trim();
    if (!topic) return;
    btn.disabled = true; btn.innerHTML = '<span class="spinner-sm"></span>';
    result.style.display = 'none';

    const prompt = `Make detailed, exam-focused notes with a diagram on: ${topic}. Include a mermaid diagram if a diagram would help, and recommend one explainer video with a [YOUTUBE_SEARCH:...] tag.`;
    result.innerHTML = '<div class="msg ai" id="notesStreamTarget"><span class="typing-dots"><span></span><span></span><span></span></span></div>';
    result.style.display = 'block';
    const streamTarget = document.getElementById('notesStreamTarget');
    try {
      let first = true;
      const full = await askZimoraStream({ prompt }, (soFar) => {
        if (first) { streamTarget.textContent = ''; first = false; }
        streamTarget.textContent = soFar;
      });
      const wrap = document.createElement('div');
      wrap.className = 'msg ai';
      renderRichText(wrap, full || 'Could not generate notes. Try again.');
      const actions = document.createElement('div');
      actions.className = 'msg-actions';
      actions.innerHTML = `<button class="msg-action-btn" data-action="pdf">⬇️ Save as PDF</button><button class="msg-action-btn" data-action="speak">🔊 Listen</button>`;
      wrap.appendChild(actions);
      actions.querySelector('[data-action="pdf"]').addEventListener('click', () => downloadAsPDF(wrap, 'Zimora-Notes-' + topic.replace(/\s+/g,'-')));
      actions.querySelector('[data-action="speak"]').addEventListener('click', (e) => {
        const clone = wrap.cloneNode(true);
        clone.querySelectorAll('.msg-actions').forEach(el => el.remove());
        speakText(clone.textContent.trim(), e.currentTarget);
      });
      result.innerHTML = '';
      result.appendChild(wrap);
      result.style.display = 'block';
      logActivity({ kind: 'lesson', subject: 'Notes', topic, minutes: 1, progress: 0 });
    } catch (err) {
      toast('Could not generate notes. Try again.');
    }
    btn.disabled = false; btn.textContent = 'Generate Notes';
  });
}

/* =====================================================
   PAGE: papers (full mock exam paper with marking scheme)
===================================================== */
function initPapersPage(){
  const form = document.getElementById('papersForm');
  if (!form) return;
  const result = document.getElementById('papersResult');
  const btn = document.getElementById('papersGenBtn');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const subject = document.getElementById('papersSubject').value.trim();
    const topic = document.getElementById('papersTopic').value.trim();
    if (!subject) return;
    btn.disabled = true; btn.innerHTML = '<span class="spinner-sm"></span>';
    result.style.display = 'none';

    const prompt = `Generate a full mock exam paper for ${eduLevel} on ${subject}${topic ? ' — ' + topic : ''}, with 10 questions and a full marking scheme at the end. Start with an exam-style header (subject, level, time allowed).`;
    result.innerHTML = '<div class="msg ai" id="papersStreamTarget"><span class="typing-dots"><span></span><span></span><span></span></span></div>';
    result.style.display = 'block';
    const streamTarget = document.getElementById('papersStreamTarget');
    try {
      let first = true;
      const full = await askZimoraStream({ prompt }, (soFar) => {
        if (first) { streamTarget.textContent = ''; first = false; }
        streamTarget.textContent = soFar;
      });
      const wrap = document.createElement('div');
      wrap.className = 'msg ai';
      renderRichText(wrap, full || 'Could not generate the paper. Try again.');
      const actions = document.createElement('div');
      actions.className = 'msg-actions';
      actions.innerHTML = `<button class="msg-action-btn" data-action="pdf">⬇️ Download Paper (PDF)</button>`;
      wrap.appendChild(actions);
      actions.querySelector('[data-action="pdf"]').addEventListener('click', () => downloadAsPDF(wrap, 'Zimora-Paper-' + subject.replace(/\s+/g,'-')));
      result.innerHTML = '';
      result.appendChild(wrap);
      result.style.display = 'block';
      logActivity({ kind: 'exam', subject, topic: topic || 'General', minutes: 1 });
    } catch (err) {
      toast('Could not generate the paper. Try again.');
    }
    btn.disabled = false; btn.textContent = 'Generate Paper';
  });
}

/* =====================================================
   PAGE: exam (interactive Exam Coach)
===================================================== */
function initExamPage(){
  const btn = document.getElementById('examStartBtn');
  if (!btn) return;

  btn.addEventListener('click', () => generateExamQuestions({
    subject: document.getElementById('examSubject').value.trim(),
    topic: document.getElementById('examTopic').value.trim(),
    difficulty: document.getElementById('examDifficulty').value,
    count: document.getElementById('examCount').value,
    msgEl: document.getElementById('examSetupMsg'),
    btn,
    setupEl: document.getElementById('examSetup'),
    areaEl: document.getElementById('examQuizArea')
  }));
}

/* =====================================================
   PAGE: quiz (quick 5-question quiz by subject)
===================================================== */
function initQuizPage(){
  const buttons = document.querySelectorAll('.quiz-start');
  if (!buttons.length) return;
  buttons.forEach(b => {
    b.addEventListener('click', () => {
      const subject = b.dataset.subject;
      generateExamQuestions({
        subject, topic: 'general revision', difficulty: 'Medium', count: '5',
        msgEl: document.getElementById('quizMsg'),
        btn: b,
        setupEl: document.getElementById('quizPicker'),
        areaEl: document.getElementById('quizArea')
      });
    });
  });
}

function cycleStatus(el, steps, intervalMs){
  if (!el) return () => {};
  let i = 0;
  el.textContent = steps[0];
  const id = setInterval(() => { i = (i + 1) % steps.length; el.textContent = steps[i]; }, intervalMs);
  return () => clearInterval(id);
}

async function generateExamQuestions({ subject, topic, difficulty, count, msgEl, btn, setupEl, areaEl }){
  if (!subject || !topic) {
    if (msgEl) { msgEl.textContent = 'Please fill in both subject and topic.'; msgEl.className = 'auth-msg error'; }
    return;
  }
  const originalLabel = btn.innerHTML;
  btn.disabled = true; btn.innerHTML = '<span class="spinner-sm"></span>';
  const stopStatus = cycleStatus(msgEl, [
    'Understanding your topic…', 'Preparing your questions…', 'Adding explanations…', 'Almost ready…'
  ], 1400);
  if (msgEl) msgEl.className = 'auth-msg';

  const prompt = `Generate a ${count}-question ${difficulty.toLowerCase()} exam for ${eduLevel} on ${subject}: ${topic}.
Respond with ONLY valid JSON (no markdown fences, no extra text), in exactly this shape:
{"questions":[{"question":"...", "options":["A text","B text","C text","D text"], "correctIndex":0, "explanation":"short explanation of the correct answer"}]}
Each question must be multiple choice with exactly 4 options.`;

  try {
    const data = await askZimora({ prompt });
    let raw = (data.reply || '').trim();
    raw = raw.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```\s*$/, '');
    const parsed = JSON.parse(raw);
    if (!parsed.questions || !parsed.questions.length) throw new Error('empty');
    stopStatus();
    if (msgEl) msgEl.textContent = '';
    renderExamQuestions(parsed.questions, subject, topic, setupEl, areaEl);
    logActivity({ kind: areaEl && areaEl.id === 'quizArea' ? 'quiz' : 'exam', subject, topic, minutes: 1 });
  } catch (e) {
    stopStatus();
    if (msgEl) { msgEl.textContent = 'Could not generate questions. Please try again.'; msgEl.className = 'auth-msg error'; }
  }
  btn.disabled = false; btn.innerHTML = originalLabel;
}

function renderExamQuestions(questions, subject, topic, setupEl, areaEl){
  if (setupEl) setupEl.style.display = 'none';
  areaEl.style.display = 'block';
  areaEl.innerHTML = '';
  const answers = new Array(questions.length).fill(null);

  questions.forEach((q, qi) => {
    const card = document.createElement('div');
    card.className = 'exam-question';
    card.innerHTML = `
      <div class="eq-num">Question ${qi + 1} of ${questions.length}</div>
      <div class="eq-text"></div>
      <div class="eq-options"></div>
      <div class="exam-explanation"></div>
    `;
    card.querySelector('.eq-text').textContent = q.question;
    const optsEl = card.querySelector('.eq-options');
    q.options.forEach((optText, oi) => {
      const optBtn = document.createElement('button');
      optBtn.className = 'exam-option';
      optBtn.textContent = optText;
      optBtn.addEventListener('click', () => {
        if (answers[qi] !== null) return;
        answers[qi] = oi;
        optsEl.querySelectorAll('.exam-option').forEach((b, bi) => {
          if (bi === q.correctIndex) b.classList.add('correct');
          else if (bi === oi) b.classList.add('incorrect');
        });
        const expl = card.querySelector('.exam-explanation');
        expl.textContent = (oi === q.correctIndex ? '✅ Correct! ' : '❌ Not quite. ') + (q.explanation || '');
        expl.classList.add('show');
      });
      optsEl.appendChild(optBtn);
    });
    areaEl.appendChild(card);
  });

  const finishBtn = document.createElement('button');
  finishBtn.className = 'btn-primary';
  finishBtn.textContent = 'See my score';
  finishBtn.style.marginTop = '10px';
  finishBtn.addEventListener('click', () => {
    if (answers.some(a => a === null)) { toast('Please answer all questions first.'); return; }
    const correctCount = answers.filter((a, i) => a === questions[i].correctIndex).length;
    const pct = Math.round((correctCount / questions.length) * 100);
    const scoreCard = document.createElement('div');
    scoreCard.className = 'exam-score-card';
    scoreCard.innerHTML = `
      <div style="font-size:13px; opacity:0.85;">${esc(subject)} — ${esc(topic)}</div>
      <div class="big-score">${pct}%</div>
      <div>${correctCount} / ${questions.length} correct</div>
    `;
    areaEl.prepend(scoreCard);
    finishBtn.remove();
    scoreCard.scrollIntoView({ behavior: 'smooth' });
  });
  areaEl.appendChild(finishBtn);

  const retryBtn = document.createElement('button');
  retryBtn.className = 'back-btn-inline';
  retryBtn.textContent = '← Try again';
  retryBtn.addEventListener('click', () => {
    if (setupEl) setupEl.style.display = 'block';
    areaEl.style.display = 'none';
    areaEl.innerHTML = '';
  });
  areaEl.appendChild(retryBtn);
}

/* =====================================================
   PAGE: scanner (AI Vision)
===================================================== */
function initScannerPage(){
  const btn = document.getElementById('scanBtn');
  if (!btn) return;
  const input = document.getElementById('scanInput');
  const preview = document.getElementById('scanPreview');
  const result = document.getElementById('scanResult');

  btn.addEventListener('click', () => input.click());
  input.addEventListener('change', async () => {
    const file = input.files[0];
    if (!file) return;
    const dataUrl = await fileToDataURL(file);

    preview.innerHTML = `<img src="${dataUrl}" alt="Scanned question" style="max-width:100%; border-radius:14px;">`;
    result.style.display = 'block';
    result.innerHTML = '<div class="msg ai"><span class="typing-dots"><span></span><span></span><span></span></span></div>';

    try {
      const data = await askZimora({ prompt: 'Please read this and explain the answer step by step.', image: dataUrl });
      const wrap = document.createElement('div');
      wrap.className = 'msg ai';
      renderRichText(wrap, data.reply || 'Could not read that photo. Try a clearer shot.');
      const actions = document.createElement('div');
      actions.className = 'msg-actions';
      actions.innerHTML = `<button class="msg-action-btn" data-action="speak">🔊 Listen</button>`;
      wrap.appendChild(actions);
      actions.querySelector('[data-action="speak"]').addEventListener('click', (e) => {
        const clone = wrap.cloneNode(true);
        clone.querySelectorAll('.msg-actions').forEach(el => el.remove());
        speakText(clone.textContent.trim(), e.currentTarget);
      });
      result.innerHTML = '';
      result.appendChild(wrap);

      const continueLink = document.createElement('a');
      continueLink.className = 'btn-primary';
      continueLink.style.cssText = 'display:block; text-align:center; text-decoration:none; margin-top:10px;';
      continueLink.textContent = 'Continue this conversation in chat →';
      continueLink.href = '#';
      continueLink.addEventListener('click', (e) => {
        e.preventDefault();
        sessionStorage.setItem('zimora_pending_image', dataUrl);
        window.location.href = 'chat.html';
      });
      result.appendChild(continueLink);
    } catch (e) {
      result.innerHTML = '<div class="msg ai">Connection error reading that photo. Try again.</div>';
    }
  });
}

/* =====================================================
   PAGE: profile
===================================================== */
function initProfilePage(){
  const nameEl = document.getElementById('profileName');
  if (!nameEl) return;
  document.getElementById('profileName').textContent = eduName;
  document.getElementById('profileEmail').textContent = currentUser.email;
  document.getElementById('profileLevel').textContent = eduLevel;
  document.getElementById('profileAvatar').textContent = initials(eduName);
}

/* =====================================================
   PAGE: settings
===================================================== */
function initSettingsPage(){
  const toggles = document.querySelectorAll('[data-toggle]');
  if (!toggles.length) return;
  toggles.forEach(t => t.addEventListener('click', () => t.classList.toggle('on')));
}

/* =====================================================
   BOOT — run only what this page declares itself to be
===================================================== */
(async function boot(){
  if (PAGE === 'auth') {
    initAuthPage();
    return;
  }

  // every other page requires a session first
  const user = await requireAuth();
  if (!user) return;

  renderChrome();

  const initMap = {
    home: initHomePage,
    chat: initChatPage,
    library: initLibraryPage,
    notes: initNotesPage,
    papers: initPapersPage,
    exam: initExamPage,
    quiz: initQuizPage,
    scanner: initScannerPage,
    profile: initProfilePage,
    settings: initSettingsPage,
    talking: initTalkingPage,
    voice: initVoiceLearningPage,
    tutor: initTutorPage
  };
  if (initMap[PAGE]) initMap[PAGE]();
})();
