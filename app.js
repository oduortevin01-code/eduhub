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
          <div class="pemail" id="drawerEmail">—</div>
        </div>
      </div>
      <div class="drawer-nav">
        <a class="drawer-item" href="${PAGES}home.html"><span class="di-icon">🏠</span> Home</a>
        <a class="drawer-item" href="${PAGES}chat.html"><span class="di-icon">💬</span> Ask Zimora</a>
        <a class="drawer-item" href="${PAGES}library.html"><span class="di-icon">📚</span> Study Library</a>
        <a class="drawer-item" href="${PAGES}notes.html"><span class="di-icon">📘</span> Notes</a>
        <a class="drawer-item" href="${PAGES}papers.html"><span class="di-icon">📄</span> Past Papers</a>
        <a class="drawer-item" href="${PAGES}exam.html"><span class="di-icon">🎯</span> Exam Coach</a>
        <a class="drawer-item" href="${PAGES}quiz.html"><span class="di-icon">🧠</span> Quick Quiz</a>
        <a class="drawer-item" href="${PAGES}scanner.html"><span class="di-icon">📷</span> Scan a Question</a>
        <a class="drawer-item" href="${PAGES}profile.html"><span class="di-icon">👤</span> Profile</a>
        <a class="drawer-item" href="${PAGES}settings.html"><span class="di-icon">⚙️</span> Settings</a>
        <a class="drawer-item" href="${PAGES}privacy.html"><span class="di-icon">🔒</span> Privacy Policy</a>
        <a class="drawer-item" href="${PAGES}about.html"><span class="di-icon">ℹ️</span> About Zimora</a>
        <a class="drawer-item" href="${PAGES}help.html"><span class="di-icon">💬</span> Help &amp; Support</a>
        <button class="drawer-item danger" id="signOutBtn"><span class="di-icon">↩️</span> Sign Out</button>
      </div>
      <div class="drawer-foot">Zimora v1.0.0 · Learn · Grow · Achieve</div>
    </div>
  `;

  if (currentUser) {
    document.getElementById('drawerName').textContent = eduName;
    document.getElementById('drawerEmail').textContent = currentUser.email;
    document.getElementById('drawerAvatar').textContent = initials(eduName);
  }

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
   PAGE: home
===================================================== */
function initHomePage(){
  const greet = document.getElementById('greetName');
  if (greet) greet.textContent = eduName.split(' ')[0];
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
      <button class="msg-action-btn" data-action="pdf">⬇️ Save as PDF</button>
      <button class="msg-action-btn" data-action="speak">🔊 Listen</button>
    `;
    wrap.appendChild(actions);
    actions.querySelector('[data-action="pdf"]').addEventListener('click', () => downloadAsPDF(wrap, 'Zimora-Notes'));
    actions.querySelector('[data-action="speak"]').addEventListener('click', (e) => {
      const clone = wrap.cloneNode(true);
      clone.querySelectorAll('.msg-actions').forEach(el => el.remove());
      speakText(clone.textContent.trim(), e.currentTarget);
    });
  }
  chatEl.scrollTop = chatEl.scrollHeight;
  return wrap;
}

function startFreshChat(){
  chatHistory = [];
  document.getElementById('chat').innerHTML = '';
  chatAddMsg(`Hello ${eduName.split(' ')[0]}! I'm **Zimora AI** for ${eduLevel}.

I can help with **all subjects**: Math, Biology, Physics, Chemistry, Geography, History, French, ICT, Business.

Ask me to:
1. Solve problems step-by-step
2. Draw a diagram
3. Recommend an explainer video
4. Quiz you on something you're revising

What would you like to learn today?`, 'ai');
}

function initChatPage(){
  const chatEl = document.getElementById('chat');
  if (!chatEl) return;

  // If arriving from Scanner or Library with pending content, load it
  const pendingImage = sessionStorage.getItem('zimora_pending_image');
  const pendingNotes = sessionStorage.getItem('zimora_pending_notes');
  const pendingNotesName = sessionStorage.getItem('zimora_pending_notes_name');

  startFreshChat();

  if (pendingNotes) {
    notesContext = pendingNotes.slice(0, 16000);
    document.getElementById('notesPillText').textContent = '📄 Studying: ' + pendingNotesName;
    document.getElementById('notesPill').style.display = 'flex';
    chatAddMsg(`Got your notes from **${pendingNotesName}**! Ask me anything about it, or say "quiz me on this".`, 'ai');
    sessionStorage.removeItem('zimora_pending_notes');
    sessionStorage.removeItem('zimora_pending_notes_name');
  }

  document.getElementById('notesPillClear')?.addEventListener('click', () => {
    notesContext = '';
    document.getElementById('notesPill').style.display = 'none';
  });

  if (pendingImage) {
    sessionStorage.removeItem('zimora_pending_image');
    const imgWrap = document.createElement('div');
    imgWrap.className = 'msg user';
    imgWrap.innerHTML = `<img src="${pendingImage}" alt="Uploaded photo" style="max-width:100%; border-radius:12px; display:block;">`;
    chatEl.appendChild(imgWrap);
    sendToAI('Please read this and explain the answer step by step.', pendingImage);
  }

  async function sendToAI(text, image){
    const sendBtn = document.getElementById('sendBtn');
    sendBtn.disabled = true;
    const thinking = chatAddMsg('<span class="typing-dots"><span></span><span></span><span></span></span>', 'ai', false);
    try {
      const data = await askZimora({
        prompt: text,
        history: chatHistory.slice(-10).join('\n'),
        notes: notesContext,
        image: image || undefined
      });
      thinking.remove();
      const reply = data.reply || 'Sorry, I had trouble with that. Try asking again.';
      const wrap = chatAddMsg(reply, 'ai');
      chatHistory.push('User: ' + text);
      chatHistory.push('AI: ' + reply);
      if (voiceModeActive) speakAndListenAgain(wrap);
    } catch (e) {
      thinking.remove();
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
   PAGE: notes (AI-generated notes on any topic)
===================================================== */
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
    try {
      const data = await askZimora({ prompt });
      const wrap = document.createElement('div');
      wrap.className = 'msg ai';
      renderRichText(wrap, data.reply || 'Could not generate notes. Try again.');
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
    try {
      const data = await askZimora({ prompt });
      const wrap = document.createElement('div');
      wrap.className = 'msg ai';
      renderRichText(wrap, data.reply || 'Could not generate the paper. Try again.');
      const actions = document.createElement('div');
      actions.className = 'msg-actions';
      actions.innerHTML = `<button class="msg-action-btn" data-action="pdf">⬇️ Download Paper (PDF)</button>`;
      wrap.appendChild(actions);
      actions.querySelector('[data-action="pdf"]').addEventListener('click', () => downloadAsPDF(wrap, 'Zimora-Paper-' + subject.replace(/\s+/g,'-')));
      result.innerHTML = '';
      result.appendChild(wrap);
      result.style.display = 'block';
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

async function generateExamQuestions({ subject, topic, difficulty, count, msgEl, btn, setupEl, areaEl }){
  if (!subject || !topic) {
    if (msgEl) { msgEl.textContent = 'Please fill in both subject and topic.'; msgEl.className = 'auth-msg error'; }
    return;
  }
  if (msgEl) msgEl.textContent = '';
  const originalLabel = btn.innerHTML;
  btn.disabled = true; btn.innerHTML = '<span class="spinner-sm"></span>';

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
    renderExamQuestions(parsed.questions, subject, topic, setupEl, areaEl);
  } catch (e) {
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
    settings: initSettingsPage
  };
  if (initMap[PAGE]) initMap[PAGE]();
})();
