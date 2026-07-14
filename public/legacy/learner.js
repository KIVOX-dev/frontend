// ════════ API CONFIGURATION ════════
const API_HOST = window.location.hostname === 'localhost' ? 'localhost:5000' : `${window.location.hostname}:5000`;
const API_BASE = `http://${API_HOST}/api`;

// ════════ PRACTICE ════════
// Marks allocation: Logical 30, Quant 30, Verbal 15, DI 15 (total 90)
// Each question = 0.5 marks → questions = marks × 2
const subjectConfig = {
  quant: { name: 'Quantitative Aptitude', totalQ: 60, maxMarks: 30 },
  logical: { name: 'Logical Reasoning', totalQ: 60, maxMarks: 30 },
  verbal: { name: 'Verbal / English', totalQ: 30, maxMarks: 15 },
  di: { name: 'Data Interpretation', totalQ: 30, maxMarks: 15 }
};

// Per-question result tracking: null=unanswered, true=correct, false=wrong
let qResults = [];

// ════════ GOOGLE AUTH INITIALIZATION ════════
function initGoogleAuth() {
  if (typeof google === 'undefined') {
    console.warn('GSI Script not loaded yet. Retrying...');
    setTimeout(initGoogleAuth, 1000);
    return;
  }

  google.accounts.id.initialize({
    client_id: "990682432689-lumtdtk3t979kqkbv88p81pq1riptlo7.apps.googleusercontent.com",
    callback: handleGoogleCredentialResponse
  });

  const containers = document.querySelectorAll('.google-login-btn-container');
  containers.forEach(container => {
    google.accounts.id.renderButton(container, {
      theme: 'outline',
      size: 'large',
      width: container.parentElement.offsetWidth || 280
    });
  });

  console.log('Google Auth Initialized (Learner)');
}

async function handleGoogleCredentialResponse(response) {
  showToast('Authenticating with Google...');
  try {
    const res = await fetch(`${API_BASE}/auth/google-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential: response.credential, role: 'student' })
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || `Server error: ${res.status}`);
    }

    const result = await res.json();
    if (result.success) {
      localStorage.setItem('sk_token', result.data.token);
      _handleLearnerGoogleLoginSuccess(result.data.user);
    } else {
      showToast(result.message || 'Verification failed');
    }
  } catch (e) {
    console.error('Auth Connection Error:', e);
    showToast('Login Failed: ' + e.message);
    if (e.message.toLowerCase().includes('failed to fetch')) {
      alert('Backend connection failed! Ensure your API server is running at http://localhost:5000');
    }
  }
}

// Start initialization
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGoogleAuth);
} else {
  initGoogleAuth();
}

// Start initialization
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGoogleAuth);
} else {
  initGoogleAuth();
}

async function doLearnerForgotPassword() {
  const email = document.getElementById('learner-login-email').value.trim();
  if (!email) {
    showToast('Please enter your email first');
    return;
  }

  showToast('Processing request...');
  try {
    const res = await fetch(`${API_BASE}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const result = await res.json();
    if (result.success) {
      alert('Password reset link has been sent to ' + email);
    } else {
      showToast(result.message || 'Recovery failed');
    }
  } catch (e) {
    showToast('Recovery connection failed');
  }
}

function shuffleArray(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

async function startPractice(subj) {
  const cfg = subjectConfig[subj];
  state.subj = subj; state.qIdx = 0; state.qCorrect = 0; state.qWrong = 0;
  qResults = Array(cfg.totalQ).fill(null);
  clearInterval(state.qTimer);
  ss('question', 'nav-practice');

  showToast(`Loading ${subjectConfig[subj].name} questions...`);

  // Track session metrics
  state.sessionTotalTime = 0;
  state.sessionTimes = [];

  // Use the new global sequential loader to prevent repeats
  // QBank logic is now async
  const sessionQs = await getSequentialQuestions(subj, cfg.totalQ);
  
  if (sessionQs.length === 0) {
    showToast("Error: No questions found for this subject.");
    ss('practice', 'nav-practice');
    return;
  }

  window.Qs[subj + '_session'] = sessionQs;
  state.subjSrc = subj + '_session';

  if (!swAIMode) {
    // If we're not in pure AI mode, we might still want to merge in some Skilly AI-generated questions
    // But for now, let's prioritize the bank as requested.
    renderQ();
  } else {
    renderQ();
  }
}

function renderQ() {
  const cfg = subjectConfig[state.subj];
  const src = state.subjSrc || state.subj;
  const qs = window.Qs[src] || window.Qs[state.subj] || [];
  
  if (!qs || qs.length === 0) {
    console.error("No questions found for", src, state.subj);
    showToast("Error loading question bank data.");
    return;
  }
  const q = qs[state.qIdx] || qs[state.qIdx % qs.length];
  
  state.subjSrc = src;
  state.qStartTime = Date.now(); // Mark start time for avg calculation

  const tot = cfg.totalQ;
  const aiModeTag = !swAIMode
    ? `<span style="font-size:10px;background:rgba(139,92,246,.12);color:#8B5CF6;border:1px solid rgba(139,92,246,.2);border-radius:8px;padding:1px 7px;margin-left:6px">Skilly AI</span>`
    : `<span style="font-size:10px;background:var(--accent-l);color:var(--accent);border:1px solid rgba(27,111,230,.18);border-radius:8px;padding:1px 7px;margin-left:6px">SW AI</span>`;

  document.getElementById('q-counter').textContent = `Question ${state.qIdx + 1} of ${tot} · ${cfg.name}`;
  document.getElementById('q-subject').innerHTML = `${cfg.name} · 0.5 marks per question ${aiModeTag}`;
  document.getElementById('q-text').textContent = q.q;
  document.getElementById('q-prog').style.width = `${(state.qIdx / tot) * 100}%`;
  document.getElementById('q-prog-txt').textContent = `${state.qIdx} of ${tot} complete`;
  document.getElementById('q-correct').textContent = (state.qCorrect * 0.5).toFixed(1);
  document.getElementById('q-wrong').textContent = state.qWrong;
  document.getElementById('q-next').style.display = 'none';
  document.getElementById('exp-card').classList.remove('show');

  const dr = document.getElementById('q-dots');
  dr.innerHTML = Array.from({ length: tot }, (_, i) => {
    let cls = '';
    if (i === state.qIdx) cls = 'active';
    else if (qResults[i] === true) cls = 'done';
    else if (qResults[i] === false) cls = 'wrong';
    return `<div class="qdot ${cls}" title="Q${i + 1}: ${qResults[i] === true ? 'Correct' : qResults[i] === false ? 'Wrong' : 'Pending'}"></div>`;
  }).join('');

  const ow = document.getElementById('q-opts');
  ow.innerHTML = q.opts.map((o, i) => `<div class="opt" onclick="selOpt(${i})" id="opt-${i}"><span class="ol">${String.fromCharCode(65 + i)}</span>${o}</div>`).join('');
  startQTimer();
}

function subName(s) { return subjectConfig[s]?.name || s; }

let selIdx = -1;
function selOpt(i) {
  document.querySelectorAll('.opt').forEach(o => o.classList.remove('sel'));
  if (i >= 0) document.getElementById('opt-' + i)?.classList.add('sel');
  selIdx = i;
  clearInterval(state.qTimer);
  
  // Calculate time spent on this question
  const timeSpent = (Date.now() - state.qStartTime) / 1000;
  state.sessionTimes.push(timeSpent);
  state.sessionTotalTime += timeSpent;

  const src = state.subjSrc || state.subj;
  const q = (Qs[src] || Qs[state.subj])[state.qIdx % (Qs[src] || Qs[state.subj]).length];
  const correct = i === q.ans;
  // Record result for dot colour
  qResults[state.qIdx] = correct;
  if (correct) state.qCorrect++; else state.qWrong++;
  document.querySelectorAll('.opt').forEach((o, idx) => {
    o.style.pointerEvents = 'none';
    if (idx === q.ans) o.classList.add('cor');
    else if (idx === i && !correct) o.classList.add('wrg');
  });
  document.getElementById('exp-card').classList.add('show');
  document.getElementById('exp-txt').textContent = q.exp;
  document.getElementById('q-correct').textContent = (state.qCorrect * 0.5).toFixed(1);
  document.getElementById('q-wrong').textContent = state.qWrong;
  document.getElementById('q-next').style.display = 'block';
  // Refresh dots immediately to show red/green for this question
  refreshDots();
}

function refreshDots() {
  const cfg = subjectConfig[state.subj];
  const tot = cfg.totalQ;
  const dr = document.getElementById('q-dots');
  if (!dr) return;
  dr.innerHTML = Array.from({ length: tot }, (_, i) => {
    let cls = '';
    if (i === state.qIdx) cls = 'active';
    else if (qResults[i] === true) cls = 'done';
    else if (qResults[i] === false) cls = 'wrong';
    return `<div class="qdot ${cls}" title="Q${i + 1}: ${qResults[i] === true ? 'Correct' : qResults[i] === false ? 'Wrong' : 'Pending'}"></div>`;
  }).join('');
}

function nextQ() {
  state.qIdx++;
  const cfg = subjectConfig[state.subj];
  if (state.qIdx >= cfg.totalQ) {
    showPracticeSummary();
    return;
  }
  renderQ();
}

async function showPracticeSummary() {
  clearInterval(state.qTimer);
  const cfg = subjectConfig[state.subj];
  const correct = state.qCorrect;
  const wrong = state.qWrong;
  const skipped = cfg.totalQ - correct - wrong;
  const marks = (correct * 0.5).toFixed(1);
  const pct = Math.round(correct / cfg.totalQ * 100);
  const avgTime = state.sessionTimes.length > 0 ? (state.sessionTotalTime / state.sessionTimes.length).toFixed(1) : 0;

  // Local fallback title/color
  let aiTitle, aiColor;
  if (pct >= 80) { aiTitle = 'Excellent Performance!'; aiColor = 'var(--green)'; }
  else if (pct >= 60) { aiTitle = 'Good Performance'; aiColor = 'var(--accent)'; }
  else if (pct >= 40) { aiTitle = 'Needs Improvement'; aiColor = 'var(--amber)'; }
  else { aiTitle = 'More Practice Needed'; aiColor = 'var(--red)'; }

  // Local fallback text
  let aiText;
  if (pct >= 80) aiText = `Outstanding result in ${cfg.name}! You scored ${marks}/${cfg.maxMarks} marks (${pct}% accuracy) across ${cfg.totalQ} questions. Your consistency shows strong command of this subject.`;
  else if (pct >= 60) aiText = `Solid effort in ${cfg.name}. You scored ${marks}/${cfg.maxMarks} marks (${pct}% accuracy). You answered ${correct} correctly. One more focused session should push you above 80%.`;
  else if (pct >= 40) aiText = `You scored ${marks}/${cfg.maxMarks} marks (${pct}% accuracy) in ${cfg.name}. Practice shorter sets of 10 questions daily to build confidence.`;
  else aiText = `You scored ${marks}/${cfg.maxMarks} marks (${pct}% accuracy) in ${cfg.name}. Start with basics and review AI explanations for each wrong answer.`;

  // Build overlay immediately with local text
  const engineLabel = swAIMode ? 'BerthAI' : 'Skilly AI';
  const engineColor = swAIMode ? 'var(--accent)' : '#8B5CF6';

  const overlay = document.createElement('div');
  overlay.id = 'practice-summary-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(15,20,50,.5);backdrop-filter:blur(6px);z-index:600;display:flex;align-items:center;justify-content:center;padding:20px';
  overlay.innerHTML = `
    <div style="background:var(--surface);border-radius:18px;width:100%;max-width:560px;box-shadow:0 24px 64px rgba(15,20,50,.25);overflow:hidden;animation:slideUp .25s ease both">
      <div style="background:linear-gradient(135deg,#0D2461,var(--accent));padding:22px 24px;position:relative;overflow:hidden">
        <div style="position:absolute;top:-20px;right:-20px;width:120px;height:120px;border-radius:50%;background:rgba(255,255,255,.06)"></div>
        <div style="font-size:11px;font-weight:700;color:rgba(255,255,255,.7);text-transform:uppercase;letter-spacing:.8px;margin-bottom:6px">Session Complete</div>
        <div style="font-family:'Playfair Display',serif;font-size:20px;font-weight:700;color:white;position:relative;z-index:1">${cfg.name}</div>
        <div style="font-size:12px;color:rgba(255,255,255,.72);margin-top:3px">${cfg.totalQ} questions · 0.5 marks each · Max ${cfg.maxMarks} marks</div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr 1fr;gap:1px;background:var(--border)">
        <div style="background:var(--surface);padding:14px;text-align:center"><div style="font-family:'Playfair Display',serif;font-size:24px;font-weight:700;color:var(--green)">${marks}</div><div style="font-size:10px;color:var(--muted);margin-top:2px">Marks / ${cfg.maxMarks}</div></div>
        <div style="background:var(--surface);padding:14px;text-align:center"><div style="font-family:'Playfair Display',serif;font-size:24px;font-weight:700;color:var(--accent)">${pct}%</div><div style="font-size:10px;color:var(--muted);margin-top:2px">Accuracy</div></div>
        <div style="background:var(--surface);padding:14px;text-align:center"><div style="font-family:'Playfair Display',serif;font-size:24px;font-weight:700;color:var(--green)">${correct}</div><div style="font-size:10px;color:var(--muted);margin-top:2px">Correct</div></div>
        <div style="background:var(--surface);padding:14px;text-align:center"><div style="font-family:'Playfair Display',serif;font-size:24px;font-weight:700;color:var(--red)">${wrong}</div><div style="font-size:10px;color:var(--muted);margin-top:2px">Wrong</div></div>
        <div style="background:var(--surface);padding:14px;text-align:center"><div style="font-family:'Playfair Display',serif;font-size:24px;font-weight:700;color:var(--accent)">${avgTime}s</div><div style="font-size:10px;color:var(--muted);margin-top:2px">Avg Time</div></div>
      </div>
      <div style="padding:16px 24px 0">
        <div style="display:flex;justify-content:space-between;font-size:11.5px;margin-bottom:6px">
          <span style="color:var(--muted)">Score</span>
          <span style="font-weight:700;color:${aiColor}">${marks} / ${cfg.maxMarks}</span>
        </div>
        <div style="height:8px;background:var(--surface3);border-radius:4px;overflow:hidden">
          <div style="height:100%;width:${(parseFloat(marks) / cfg.maxMarks) * 100}%;background:${aiColor};border-radius:4px;transition:width .6s ease"></div>
        </div>
      </div>
      <div style="padding:16px 24px 20px">
        <div style="display:flex;align-items:center;gap:7px;margin-bottom:10px">
          <div style="width:28px;height:28px;border-radius:7px;background:var(--accent-l);display:flex;align-items:center;justify-content:center">
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2" width="14" height="14"><polygon points="13,2 3,14 12,14 11,22 21,10 12,10"/></svg>
          </div>
          <div>
            <div style="font-size:11px;font-weight:700;color:${engineColor};text-transform:uppercase;letter-spacing:.5px">${engineLabel} Performance Summary</div>
            <div style="font-size:12px;font-weight:700;color:${aiColor}">${aiTitle}</div>
          </div>
        </div>
        <div id="summary-ai-text" style="font-size:13px;color:var(--text);line-height:1.7;background:var(--surface2);border:1px solid var(--border);border-radius:var(--r2);padding:13px 14px">${aiText}</div>
      </div>
      <div style="padding:0 24px 20px;display:flex;gap:8px">
        <button class="btn btn-p" style="flex:1;justify-content:center" onclick="document.getElementById('practice-summary-overlay').remove();startPractice(state.subj)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="13" height="13"><polyline points="1,4 1,10 7,10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>
          Try Again
        </button>
        <button class="btn btn-o" onclick="document.getElementById('practice-summary-overlay').remove();ss('practice','nav-practice')">Back to Practice</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);

  // Now fetch real AI feedback async and update the text box
  fetchSkillyFeedback(state.subj, parseFloat(marks), pct, avgTime).then(fb => {
    const stats = [
      { id: 'dash-stat-tests', val: currentUser.testsCompleted || 0 },
      { id: 'dash-stat-acc', val: (currentUser.avgAccuracy || 0) + '%' },
      { id: 'dash-stat-streak', val: (currentUser.streak || 0) + ' Days' },
      { id: 'dash-stat-rank', val: currentUser.nationalRank ? '#' + currentUser.nationalRank : '—' },
      { id: 'dash-stat-speed', val: currentUser.avgSpeed ? currentUser.avgSpeed + 's' : '—' }
    ];
    stats.forEach(s => { const el = document.getElementById(s.id); if (el) el.textContent = s.val; });
    if (fb) {
      const el = document.getElementById('summary-ai-text');
      if (el) el.textContent = fb;
    }
  });

  // Also submit session to backend
  apiPost('/practice/submit', {
    user_id: state.userId || 'guest',
    subject: state.subj,
    score: parseFloat(marks),
    accuracy: pct / 100,
    correct: Array.from({ length: cfg.totalQ }, (_, i) => qResults[i] === true),
    time_taken: Math.round(state.sessionTotalTime)
  });

  // ── Update live user stats ──
  if (!currentUser.practiceScores) currentUser.practiceScores = {};
  if (!currentUser.practiceScores[state.subj]) currentUser.practiceScores[state.subj] = [];
  currentUser.practiceScores[state.subj].push(pct);

  // Update speed metrics
  if (!currentUser.subjectSpeeds) currentUser.subjectSpeeds = {};
  currentUser.subjectSpeeds[state.subj] = avgTime;
  
  const allSpeeds = Object.values(currentUser.subjectSpeeds).map(s => parseFloat(s)).filter(s => !isNaN(s));
  if (allSpeeds.length > 0) {
    currentUser.avgSpeed = (allSpeeds.reduce((a, b) => a + b, 0) / allSpeeds.length).toFixed(1);
  }

  // Update AI Recommendations card
  const recEl = document.getElementById('dash-ai-rec');
  if (recEl) recEl.textContent = `AI Coach: Based on your ${state.subj} drill, try to ${pct < 70 ? 're-verify the concepts' : 'improve your response speed'} while maintaining ${avgTime}s per question.`;

  buildDash();
  buildPractice();
  recordTestScore(state.subj, pct);
  pushActivity(`✓ ${cfg.name} — ${marks}/${cfg.maxMarks} marks · ${pct}% accuracy`);
}

function startQTimer() {
  let t = 15; clearInterval(state.qTimer); updateQTimer(t);
  state.qTimer = setInterval(() => { t--; updateQTimer(t); if (t <= 0) { clearInterval(state.qTimer); selOpt(-1); } }, 1000);
}

function updateQTimer(t) {
  const m = Math.floor(t / 60), s = t % 60;
  document.getElementById('q-timer').textContent = `${m}:${String(s).padStart(2, '0')}`;
}

let mncSearchQuery = '';
function searchMNCs(q) {
  mncSearchQuery = q.toLowerCase();
  buildMNCGrid();
}

function buildMNCGrid() {
  const w = document.getElementById('mnc-grid'); if (!w) return;
  const isPro = state.userType === 'college' || state.userPlan === 'pro';

  const filtered = mncSearchQuery
    ? MNCs.filter(m => m.name.toLowerCase().includes(mncSearchQuery))
    : MNCs;

  if (filtered.length === 0) {
    w.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:48px;color:var(--muted)">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="40" height="40" style="display:block;margin:0 auto 10px;opacity:.3"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      No companies found matching "${mncSearchQuery}"
    </div>`;
    return;
  }

  w.innerHTML = filtered.map((m, i) => {
    // Find original index for startMNC
    const originalIndex = MNCs.findIndex(orig => orig.name === m.name);
    return `
    <div class="mncc ${(!isPro && originalIndex > 1) ? 'lk' : ''}" onclick="${(!isPro && originalIndex > 1) ? 'showToast(\'Upgrade to Pro to unlock\')' : 'startMNC(' + originalIndex + ')'}">
      <div style="width:56px;height:56px;border-radius:12px;overflow:hidden;display:flex;align-items:center;justify-content:center;background:#ffffff;border:1.5px solid rgba(30,35,80,.1);margin-bottom:12px;padding:6px;box-shadow:0 2px 8px rgba(30,35,80,.08)">${m.logo}</div>
      <div class="mncn">${m.name}</div>
      <div class="mncs">${m.secs} sections · ${m.time} min</div>
      <div>${m.note ? `<span class="mncpill">${m.note}</span>` : ''}</div>
      ${(!isPro && originalIndex > 1) ? '<div style="position:absolute;top:10px;right:10px"><span class="badge ba">Pro</span></div>' : ''}
    </div>`;
  }).join('');
}

async function startMNC(i) {
  state.mncChosen = MNCs[i]; state.mncQ = 0;
  document.getElementById('mnc-co-name').textContent = state.mncChosen.name;
  document.getElementById('mnc-logo-hdr').innerHTML = `<div style="width:34px;height:34px;border-radius:7px;overflow:hidden;background:#f8f9ff;display:flex;align-items:center;justify-content:center">${state.mncChosen.logo}</div>`;
  ss('mnc-test', null);
  startMNCTimer();

  // Fetch AI questions for this MNC test
  const mncQEl = document.getElementById('mnc-q-txt');
  if (mncQEl) mncQEl.innerHTML = `<span style="color:var(--muted);font-style:italic">Loading ${state.mncChosen.name} questions via Skilly AI...</span>`;

  try {
    let questions;
    if (swAIMode) {
      const data = await apiPost('/ai/questions', { subject: 'quant', count: 20, difficulty: 'medium' });
      questions = data?.questions;
    } else {
      const prompt = `Generate 20 multiple-choice aptitude questions specifically for ${state.mncChosen.name} campus placement test. Mix Quantitative, Logical and Verbal.
Respond ONLY with valid JSON array:
[{"q":"question","opts":["A","B","C","D"],"ans":0,"exp":"explanation"}]`;
      const res = await fetch(SKILLY_API_URL, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'phi3', prompt: prompt, stream: false })
      });
      const data = await res.json();
      const raw = data.response || '[]';
      questions = JSON.parse(raw.replace(/```json|```/g, '').trim());
      // Store to backend DB
      apiPost('/ai/questions', { subject: 'quant', count: 20, difficulty: 'medium', _store_only: true });
    }
    if (questions && questions.length > 0) {
      // Override MNCQs for this session
      window._mncSessionQs = questions;
      showToast(`${state.mncChosen.name} — ${questions.length} questions loaded`);
    }
  } catch (e) {
    window._mncSessionQs = null;
    showToast(`Using standard ${state.mncChosen.name} question set`);
  }
  renderMNCQ();
}

function renderMNCQ() {
  const sessionQs = window._mncSessionQs;
  const q = sessionQs ? sessionQs[state.mncQ % sessionQs.length] : MNCQs[state.mncQ % MNCQs.length];
  document.getElementById('mnc-counter').textContent = `Q${state.mncQ + 1} of 20 · ${state.mncChosen?.name || ''} Test`;
  document.getElementById('mnc-q-txt').textContent = q.q;
  document.getElementById('mnc-pb').style.width = `${((state.mncQ + 1) / 20) * 100}%`;
  document.getElementById('mnc-pt').textContent = `Q${state.mncQ + 1} of 20`;
  document.getElementById('mnc-next').style.display = 'none';
  document.getElementById('mnc-opts').innerHTML = q.opts.map((o, i) => `<div class="opt" onclick="mncSelOpt(${i})" id="mnc-opt-${i}"><span class="ol">${String.fromCharCode(65 + i)}</span>${o}</div>`).join('');
}

function mncSelOpt(i) {
  const sessionQs = window._mncSessionQs;
  const q = sessionQs ? sessionQs[state.mncQ % sessionQs.length] : MNCQs[state.mncQ % MNCQs.length];
  document.querySelectorAll('#mnc-opts .opt').forEach((o, idx) => {
    o.style.pointerEvents = 'none';
    if (idx === q.ans) o.classList.add('cor');
    else if (idx === i && i !== q.ans) o.classList.add('wrg');
  });
  document.getElementById('mnc-next').style.display = 'block';
}

function nextMNCQ() {
  state.mncQ++;
  if (state.mncQ >= 20) {
    showToast('Test complete! Score: 82/100');
    // Submit to backend
    apiPost('/practice/submit', {
      user_id: state.userId || 'guest', subject: 'quant',
      score: 82, accuracy: 0.82, correct: [], time_taken: 300
    });
    ss('mnc', 'nav-mnc'); clearInterval(state.mncTimer); return;
  }
  renderMNCQ();
}

function startMNCTimer() {
  let t = 15; clearInterval(state.mncTimer);
  updateMNCTimer(t);
  state.mncTimer = setInterval(() => { t--; updateMNCTimer(t); if (t <= 0) { clearInterval(state.mncTimer); showToast('Time up! Auto-submitted.'); ss('mnc', 'nav-mnc'); } }, 1000);
}

function updateMNCTimer(t) {
  const m = Math.floor(t / 60), s = t % 60;
  document.getElementById('mnc-timer').textContent = `${m}:${String(s).padStart(2, '0')}`;
}

// ════════ JOB GRID ════════
const roleIcons = {
  code: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><polyline points="16,18 22,12 16,6"/><polyline points="8,6 2,12 8,18"/></svg>',
  monitor: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>',
  server: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>',
  atom: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><circle cx="12" cy="12" r="1"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2"/><path d="M2 12C2 12 7 7 12 7s10 5 10 5-5 5-10 5-10-5-10-5"/></svg>',
  node: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M12 2L2 7l10 5 10-5-10-5M2 17l10 5 10-5M2 12l10 5 10-5"/></svg>',
  python: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M12 2C8 2 6 4 6 6v3h6v1H5C3 10 2 11.5 2 13.5S3 17 5 17h1v3c0 2 2 4 6 4s6-2 6-4v-3h-6v-1h7c2 0 3-1.5 3-3.5S19 10 17 10h-1V7c0-2-2-5-4-5z"/></svg>',
  java: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M8 18s-2 0-2-2V6"/><path d="M16 6v10s0 2-2 2"/><path d="M6 13h12"/></svg>',
  mobile: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>',
  apple: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M12 2a3 3 0 003-3M18 10c0 5-3 9-6 9s-6-4-6-9 3-7 6-7 6 2 6 7z"/></svg>',
  flutter: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><polygon points="12,2 22,12 12,22 2,12"/></svg>',
  design: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="8"/><line x1="12" y1="16" x2="12" y2="22"/></svg>',
  devops: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><polyline points="16,3 21,3 21,8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21,16 21,21 16,21"/><line x1="15" y1="15" x2="21" y2="21"/></svg>',
  chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
  science: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M9 3H5v11l7 7 7-7V3h-4M9 3v6l-4 5M15 3v6l4 5M9 9h6"/></svg>',
  ai: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9h1v6H9M14 9h-1.5a1.5 1.5 0 000 3H14a1.5 1.5 0 010 3H12"/></svg>',
  cloud: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z"/></svg>',
  azure: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><polygon points="12,2 2,19 22,19"/><line x1="12" y1="9" x2="12" y2="14"/></svg>',
  shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
  qa: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><polyline points="9,11 12,14 22,4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>',
  product: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>',
  biz: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>',
  chain: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>',
  game: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><line x1="6" y1="12" x2="10" y2="12"/><line x1="8" y1="10" x2="8" y2="14"/><line x1="15" y1="11" x2="15.01" y2="11"/><line x1="17" y1="13" x2="17.01" y2="13"/><rect x="2" y="6" width="20" height="12" rx="4"/></svg>',
  chip: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><rect x="7" y="7" width="10" height="10" rx="1"/><path d="M7 9H4M7 12H4M7 15H4M17 9h3M17 12h3M17 15h3M9 7V4M12 7V4M15 7V4M9 17v3M12 17v3M15 17v3"/></svg>',
  api: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M4 6h16M4 12h16M4 18h7"/><path d="M15 15l5 3-5 3"/></svg>',
  db: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>',
  sysdes: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><rect x="2" y="3" width="7" height="7"/><rect x="15" y="3" width="7" height="7"/><rect x="2" y="14" width="7" height="7"/><rect x="15" y="14" width="7" height="7"/><path d="M9 6.5h6M18.5 10v4M5.5 10v4M9 17.5h6"/></svg>',
  network: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><circle cx="12" cy="5" r="2"/><circle cx="5" cy="19" r="2"/><circle cx="19" cy="19" r="2"/><path d="M12 7v3M12 10l-5.5 7M12 10l5.5 7"/></svg>',
  support: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013 5.18 2 2 0 015 3h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L9.09 10.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 17v-.08z"/></svg>',
  // Commerce icons
  acc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
  fin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>',
  bank: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M3 22V11M21 22V11M12 22V11M2 11l10-9 10 9M2 22h20"/></svg>',
  ca: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/><polyline points="9,9 12,12 15,9"/></svg>',
  tax: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="9" y1="15" x2="15" y2="9"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="15" x2="15.01" y2="15"/></svg>',
  audit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><polyline points="9,11 12,14 22,4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>',
  plan: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/></svg>',
  risk: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
  equity: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><polyline points="22,7 13.5,15.5 8.5,10.5 2,17"/><polyline points="16,7 22,7 22,13"/></svg>',
  credit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>',
  supply: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h11a2 2 0 012 2v3m4 8h-4a2 2 0 00-2 2v1a2 2 0 002 2h4a2 2 0 002-2v-1a2 2 0 00-2-2z"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>',
  ops: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>',
  hr: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>',
  mktg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>',
  sales: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><polyline points="23,6 13.5,15.5 8.5,10.5 1,18"/><polyline points="17,6 23,6 23,12"/></svg>',
  logis: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><rect x="1" y="3" width="15" height="13"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>',
  bankop: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3"/></svg>',
  insur: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9,12 11,14 15,10"/></svg>',
  act: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><path d="M4 20h16"/></svg>',
  custom: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>',
};

let jobSearchQuery = '';
function searchJobRoles(q) {
  jobSearchQuery = q.toLowerCase();
  buildJobGrid();
}

let activeCat = 'all';
function buildJobGrid() {
  const w = document.getElementById('job-grid'); if (!w) return;

  let filtered = activeCat === 'all' ? jobRoles : jobRoles.filter(r => r.cat === activeCat);

  if (jobSearchQuery) {
    filtered = filtered.filter(r => r.n.toLowerCase().includes(jobSearchQuery));
  }

  if (filtered.length === 0) {
    w.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:48px;color:var(--muted)">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="40" height="40" style="display:block;margin:0 auto 10px;opacity:.3"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      No job roles found matching "${jobSearchQuery}"
    </div>`;
    return;
  }

  w.innerHTML = filtered.map(r => `
    <div class="jcard" onclick="startIV('${r.n}')">
      <div class="jico" style="background:${r.cat === 'commerce' ? 'rgba(14,159,110,.12)' : 'var(--purple-l)'};color:${r.cat === 'commerce' ? 'var(--green)' : 'var(--purple)'}">${roleIcons[r.icon] || roleIcons.custom}</div>
      <div class="jname">${r.n}</div>
    </div>`).join('');
}
window.buildIVGrid = buildJobGrid;

function filterRoles(cat, el) {
  activeCat = cat;
  document.querySelectorAll('.role-cat-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  buildJobGrid();
}

// ════════ INTERVIEW ════════
// ════════ INTERVIEW ════════
async function startIV(role) {
  state.ivRole = role; state.ivQ = 0; state.ivScore = 85;
  ivAnswers = []; ivHistory = [];
  document.getElementById('iv-role-sel').style.display = 'none';
  document.getElementById('iv-active').style.display = 'block';
  document.getElementById('iv-role-title').textContent = role + ' Interview';
  renderIVQ(); renderIVDots(); startIVTimer();
  // Get AI opening question
  try {
    let aiQ;
    const engine = swAIMode ? 'berth' : 'skilly';
    if (swAIMode) {
      const data = await apiPost('/ai/interview', { job_role: role, message: 'Start the interview', history: [] });
      aiQ = data?.reply;
    } else {
      const prompt = `Start a mock ${role} interview. Ask the first professional question in 1-2 sentences only.`;
      const res = await fetch(SKILLY_API_URL, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'phi3', prompt: prompt, stream: false })
      });
      const data = await res.json();
      aiQ = data.response?.trim();
    }
    if (aiQ) {
      document.getElementById('iv-question').textContent = aiQ;
      ivHistory.push({ role: 'assistant', content: aiQ });
    }
  } catch (e) { }
}

function renderIVDots() {
  const w = document.getElementById('iv-dots');
  const ivDotColors = Array.from({ length: 15 }, (_, i) => i < state.ivQ ? 'var(--green)' : i === state.ivQ ? 'var(--purple)' : 'var(--surface3)');
  w.innerHTML = ivDotColors.map(c => '<div style="width:9px;height:9px;border-radius:50%;background:' + c + '"></div>').join('');
}

function renderIVQ() {
  const q = ivQs[state.ivQ % ivQs.length];
  document.getElementById('iv-qn').textContent = state.ivQ + 1;
  document.getElementById('iv-qbadge').textContent = state.ivQ + 1;
  document.getElementById('iv-question').textContent = q.q;
  document.getElementById('iv-ans').value = '';
  const sb = document.getElementById('sug-body');
  if (sb) sb.innerHTML = q.sugs.map(s => `<div class="sitem"><div class="sico" style="background:var(--${s.c}-l);color:var(--${s.c})"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="9" height="9"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg></div><div class="stxt">${s.t}</div></div>`).join('');
}

function startIVTimer() {
  let t = 60; clearInterval(state.ivTimer); updateIVTimer(t);
  document.getElementById('iv-tbar').style.width = '100%';
  state.ivTimer = setInterval(() => {
    t--; updateIVTimer(t);
    document.getElementById('iv-tbar').style.width = `${(t / 60) * 100}%`;
    if (t <= 0) { clearInterval(state.ivTimer); nextIV(); }
  }, 1000);
}

function updateIVTimer(t) {
  const m = Math.floor(t / 60), s = t % 60;
  document.getElementById('iv-timer').textContent = `${m}:${String(s).padStart(2, '0')}`;
}

// Track answers for summary
let ivAnswers = [];

function skipIV() {
  clearInterval(state.ivTimer);
  ivAnswers.push({ q: state.ivQ + 1, answered: false, skipped: true });
  state.ivQ++;
  showToast('Skipped — time penalty applied');
  if (state.ivQ >= 15) { showInterviewSummary(); return; }
  renderIVQ(); renderIVDots(); startIVTimer();
}

async function nextIV() {
  clearInterval(state.ivTimer);
  const ans = document.getElementById('iv-ans') ? document.getElementById('iv-ans').value.trim() : '';
  ivAnswers.push({ q: state.ivQ + 1, answered: ans.length > 10 });

  // Get AI follow-up question for next round
  let nextAIQ = null;
  if (ans.length > 5) {
    try {
      ivHistory.push({ role: 'user', content: ans });
      if (swAIMode) {
        const data = await apiPost('/ai/interview', { job_role: state.ivRole, message: ans, history: ivHistory });
        nextAIQ = data?.reply;
      } else {
        const histText = ivHistory.slice(-4).map(m => `${m.role === 'assistant' ? 'Interviewer' : 'Candidate'}: ${m.content}`).join('\n');
        const prompt = `${histText}\nCandidate: "${ans}"\nAsk the next interview question in 1 sentence.`;
        const res = await fetch(SKILLY_API_URL, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: 'phi3', prompt: prompt, stream: false })
        });
        const data = await res.json();
        nextAIQ = data.response?.trim();
        apiPost('/ai/interview', { job_role: state.ivRole, message: ans, history: ivHistory });
      }
      if (nextAIQ) ivHistory.push({ role: 'assistant', content: nextAIQ });
    } catch (e) { }
  }

  state.ivQ++;
  if (state.ivQ >= 15) { showInterviewSummary(); return; }
  renderIVQ(); renderIVDots(); startIVTimer();
  // Override with AI question if we got one
  if (nextAIQ) document.getElementById('iv-question').textContent = nextAIQ;
}

function showInterviewSummary() {
  clearInterval(state.ivTimer);
  document.getElementById('iv-active').style.display = 'none';
  document.getElementById('iv-role-sel').style.display = 'none';

  // Calculate scores
  const answered = ivAnswers.filter(a => a.answered).length;
  const score = Math.round(55 + (answered / 15) * 35 + Math.random() * 5);
  const clampedScore = Math.min(94, Math.max(52, score));
  let badge, badgeColor, badgeBg;
  if (clampedScore >= 90) { badge = 'Expert'; badgeColor = '#7C3AED'; badgeBg = 'rgba(108,92,231,.1)'; }
  else if (clampedScore >= 80) { badge = 'Advanced'; badgeColor = '#D97706'; badgeBg = 'rgba(245,158,11,.1)'; }
  else if (clampedScore >= 65) { badge = 'Proficient'; badgeColor = '#1B6FE6'; badgeBg = 'rgba(27,111,230,.1)'; }
  else { badge = 'Beginner'; badgeColor = '#6B7280'; badgeBg = 'rgba(107,114,128,.1)'; }

  const feedback = [
    { icon: 'good', title: 'Communication', score: Math.round(clampedScore * 0.96), tip: 'Clear structure with good use of examples. Keep answers concise.' },
    { icon: 'good', title: 'Technical Depth', score: Math.round(clampedScore * 0.92), tip: 'Good technical awareness. Quantify outcomes where possible.' },
    { icon: 'warn', title: 'STAR Framework', score: Math.round(clampedScore * 0.85), tip: 'Some answers lacked a clear Result. Always close with measurable impact.' },
    { icon: 'info', title: 'Keywords Used', score: Math.round(clampedScore * 0.90), tip: 'Industry keywords detected. Mention specific tools and technologies more.' },
  ];

  const summaryHTML = `
    <div style="position:fixed;inset:0;background:rgba(15,20,50,.55);backdrop-filter:blur(6px);z-index:700;display:flex;align-items:flex-start;justify-content:center;padding:32px 20px;overflow-y:auto" id="iv-summary-overlay">
      <div style="background:var(--surface);border-radius:16px;width:100%;max-width:620px;box-shadow:0 24px 64px rgba(15,20,50,.22);overflow:hidden">
        <!-- Header -->
        <div style="background:linear-gradient(135deg,#0D2461,var(--purple));padding:22px 24px;text-align:center;position:relative">
          <div style="font-family:'Playfair Display',serif;font-size:22px;font-weight:700;color:white;margin-bottom:4px">Interview Complete!</div>
          <div style="font-size:13px;color:rgba(255,255,255,.75)">${state.ivRole} · ${answered} of 15 questions answered</div>
        </div>
        <!-- Score ring -->
        <div style="padding:24px;display:flex;align-items:center;gap:20px;border-bottom:1px solid var(--border)">
          <div style="position:relative;width:100px;height:100px;flex-shrink:0">
            <svg viewBox="0 0 100 100" width="100" height="100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="var(--surface3)" stroke-width="10"/>
              <circle cx="50" cy="50" r="42" fill="none" stroke="${badgeColor}" stroke-width="10"
                stroke-dasharray="${Math.round(2.64 * clampedScore)} 264"
                stroke-linecap="round" transform="rotate(-90 50 50)"/>
              <text x="50" y="46" font-family="'Playfair Display',serif" font-size="22" font-weight="700" fill="${badgeColor}" text-anchor="middle" dominant-baseline="middle">${clampedScore}</text>
              <text x="50" y="64" font-family="Arial,sans-serif" font-size="9" fill="var(--muted)" text-anchor="middle">/100</text>
            </svg>
          </div>
          <div style="flex:1">
            <div style="font-size:13px;color:var(--muted);margin-bottom:4px">Overall Score</div>
            <div style="font-family:'Playfair Display',serif;font-size:28px;font-weight:700;color:var(--text);margin-bottom:6px">${clampedScore} / 100</div>
            <span style="background:${badgeBg};color:${badgeColor};border:1.5px solid ${badgeColor}30;padding:4px 14px;border-radius:20px;font-size:12px;font-weight:700">${badge} Level</span>
          </div>
          <div style="text-align:center;padding:12px 16px;background:var(--surface2);border-radius:var(--r2);min-width:80px">
            <div style="font-family:'Playfair Display',serif;font-size:22px;font-weight:700;color:var(--green)">${answered}</div>
            <div style="font-size:10.5px;color:var(--muted)">Answered</div>
          </div>
        </div>
        <!-- Per-category feedback -->
        <div style="padding:20px 24px;border-bottom:1px solid var(--border)">
          <div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.7px;margin-bottom:14px">Detailed Feedback</div>
          <div style="display:flex;flex-direction:column;gap:12px">
            ${feedback.map(f => `
              <div style="background:var(--surface2);border-radius:var(--r2);padding:12px 14px">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
                  <div style="font-size:13px;font-weight:700;color:var(--text)">${f.title}</div>
                  <div style="font-family:'Playfair Display',serif;font-size:15px;font-weight:700;color:${f.score >= 80 ? 'var(--green)' : f.score >= 65 ? 'var(--accent)' : 'var(--amber)'}">${f.score}/100</div>
                </div>
                <div style="height:4px;background:var(--surface3);border-radius:2px;overflow:hidden;margin-bottom:7px">
                  <div style="height:100%;border-radius:2px;width:${f.score}%;background:${f.score >= 80 ? 'var(--green)' : f.score >= 65 ? 'var(--accent)' : 'var(--amber)'}"></div>
                </div>
                <div style="font-size:11.5px;color:var(--muted);line-height:1.55">${f.tip}</div>
              </div>`).join('')}
          </div>
        </div>
        <!-- AI Summary -->
        <div style="padding:20px 24px;border-bottom:1px solid var(--border)">
          <div style="font-size:11px;font-weight:700;color:var(--accent);text-transform:uppercase;letter-spacing:.7px;margin-bottom:10px;display:flex;align-items:center;gap:5px">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><polygon points="13,2 3,14 12,14 11,22 21,10 12,10"/></svg>
            AI Performance Summary
          </div>
          <div style="font-size:13px;color:var(--text);line-height:1.7;background:var(--accent-l);border:1px solid rgba(27,111,230,.14);border-radius:var(--r2);padding:13px 14px">
            Strong performance overall with good command of technical concepts. Communication was clear but some answers would benefit from a tighter STAR structure. For ${state.ivRole} roles, focus on quantifying your project outcomes and mentioning specific tools and technologies relevant to the domain. Your logical reasoning and analytical scores are a genuine differentiator — mention them when discussing your problem-solving approach in interviews.
          </div>
        </div>
        <!-- Actions -->
        <div style="padding:18px 24px;display:flex;gap:8px">
          <button class="btn btn-p" style="flex:1;justify-content:center" onclick="retryInterview()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="14" height="14"><polyline points="1,4 1,10 7,10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>
            Try Again
          </button>
          <button class="btn btn-green" style="justify-content:center" onclick="document.getElementById('iv-summary-overlay').remove();ss('profile','nav-profile')">
            View Profile
          </button>
          <button class="btn btn-o" onclick="document.getElementById('iv-summary-overlay').remove();ss('iv','nav-iv')">
            New Role
          </button>
        </div>
      </div>
    </div>`;

  document.body.insertAdjacentHTML('beforeend', summaryHTML);

  // ── Update live user stats ──
  currentUser.interviewScores.push(clampedScore);
  pushActivity(`🎤 ${state.ivRole} interview — ${clampedScore}/100 · ${badge}`);
  recordTestScore('logical', clampedScore); // count interview as a session
}

function retryInterview() {
  document.getElementById('iv-summary-overlay')?.remove();
  ivAnswers = [];
  state.ivQ = 0;
  document.getElementById('iv-role-sel').style.display = 'none';
  document.getElementById('iv-active').style.display = 'block';
  renderIVDots(); renderIVQ(); startIVTimer();
}

function onAnsInput(v) {
  const lbl = document.getElementById('auth-lbl');
  if (v.length > 60) {
    lbl.textContent = ' Similarity check running...'; lbl.className = 'badge ba';
  } else if (v.length > 20) {
    lbl.textContent = ' Your own words'; lbl.className = 'badge bg';
  } else {
    lbl.textContent = 'Waiting for input'; lbl.className = 'badge bgr';
  }
}

// ════════ PROFILE TABS ════════
let profileCharts = {};
function destroyCharts() { Object.values(profileCharts).forEach(c => { try { c.destroy() } catch (e) { } }); profileCharts = {}; }

function renderPTab(tab, btn) {
  if (btn) { document.querySelectorAll('.ptab').forEach(b => b.classList.remove('on')); btn.classList.add('on'); }
  state.ptab = tab; const c = document.getElementById('ptab-content');
  destroyCharts();

  if (tab === 'scores') {
    // Build dynamic subject accuracy from currentUser
    const ps = currentUser.practiceScores;
    const avg = arr => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : null;
    const subjAvg = { logical: avg(ps.logical), quant: avg(ps.quant), verbal: avg(ps.verbal), di: avg(ps.di) };
    const hasData = Object.values(subjAvg).some(v => v !== null);
    const safeAvg = s => subjAvg[s] !== null ? subjAvg[s] + '%' : '—';
    const bestSubj = hasData ? Object.entries(subjAvg).filter(([, v]) => v !== null).sort((a, b) => b[1] - a[1])[0] : null;
    const bestLabel = { logical: 'Logical Reasoning', quant: 'Quantitative', verbal: 'Verbal / English', di: 'Data Interpretation' };
    const rankLabel = currentUser.nationalRank ? 'Top ' + Math.round(currentUser.nationalRank / 10) + '%' : '—';

    const pieData = [subjAvg.logical || 0, subjAvg.verbal || 0, subjAvg.quant || 0, subjAvg.di || 0];
    const trendLabels = currentUser.recentActivity.slice().reverse().slice(0, 6).map((_, i) => 'S' + (i + 1));
    const allScores = [...ps.quant, ...ps.logical, ...ps.verbal, ...ps.di];
    const trendData = allScores.slice(-6);

    c.innerHTML = `<div class="g3" style="margin-bottom:14px">
      <div class="card-sm" style="text-align:center"><div style="font-family:'Playfair Display',serif;font-size:28px;font-weight:700;color:var(--accent)">${rankLabel}</div><div style="font-size:11px;color:var(--muted);margin-top:3px">Overall Percentile</div></div>
      <div class="card-sm" style="text-align:center"><div style="font-family:'Playfair Display',serif;font-size:28px;font-weight:700;color:var(--green)">${bestSubj ? bestSubj[1] + '%' : '—'}</div><div style="font-size:11px;color:var(--muted);margin-top:3px">Best: ${bestSubj ? bestLabel[bestSubj[0]] : 'No data yet'}</div></div>
      <div class="card-sm" style="text-align:center"><div style="font-family:'Playfair Display',serif;font-size:28px;font-weight:700;color:var(--amber)">${currentUser.testsCompleted}</div><div style="font-size:11px;color:var(--muted);margin-top:3px">Sessions completed</div></div>
    </div>
    ${!hasData ? `<div class="card" style="text-align:center;padding:48px 24px">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="44" height="44" style="display:block;margin:0 auto 12px;opacity:.3"><polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/></svg>
      <div style="font-size:14px;font-weight:600;color:var(--text);margin-bottom:6px">No scores yet</div>
      <div style="font-size:13px;color:var(--muted);margin-bottom:16px">Complete a practice session to see your accuracy charts here.</div>
      <button class="btn btn-p btn-sm" onclick="ss('practice','nav-practice')">Start Practice</button>
    </div>` : `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
      <div class="card">
        <div class="ct">Subject Accuracy</div>
        <div style="position:relative;height:220px;display:flex;align-items:center;justify-content:center">
          <canvas id="pie-accuracy"></canvas>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:10px">
          <div style="display:flex;align-items:center;gap:6px;font-size:11px"><span style="width:10px;height:10px;border-radius:50%;background:#1B6FE6;display:inline-block"></span>Logical ${safeAvg('logical')}</div>
          <div style="display:flex;align-items:center;gap:6px;font-size:11px"><span style="width:10px;height:10px;border-radius:50%;background:#4A90F5;display:inline-block"></span>Verbal ${safeAvg('verbal')}</div>
          <div style="display:flex;align-items:center;gap:6px;font-size:11px"><span style="width:10px;height:10px;border-radius:50%;background:#0D9488;display:inline-block"></span>Quant ${safeAvg('quant')}</div>
          <div style="display:flex;align-items:center;gap:6px;font-size:11px"><span style="width:10px;height:10px;border-radius:50%;background:#EF4444;display:inline-block"></span>DI ${safeAvg('di')}</div>
        </div>
      </div>
      <div class="card">
        <div class="ct">Score Trend (Recent Sessions)</div>
        <div style="position:relative;height:220px"><canvas id="line-trend"></canvas></div>
      </div>
    </div>`}`;
    if (hasData) setTimeout(() => {
      const ctxPie = document.getElementById('pie-accuracy');
      if (ctxPie) { profileCharts.pie = new Chart(ctxPie, { type: 'doughnut', data: { labels: ['Logical', 'Verbal', 'Quant', 'DI'], datasets: [{ data: pieData, backgroundColor: ['#1B6FE6', '#4A90F5', '#0D9488', '#EF4444'], borderWidth: 0, hoverOffset: 6 }] }, options: { responsive: true, maintainAspectRatio: false, cutout: '68%', plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => `${ctx.label}: ${ctx.raw}%` } } } } }); }
      const ctxLine = document.getElementById('line-trend');
      if (ctxLine && trendData.length) {
        const labels = trendData.map((_, i) => 'S' + (i + 1));
        profileCharts.line = new Chart(ctxLine, { type: 'line', data: { labels, datasets: [{ label: 'Score', data: trendData, borderColor: '#1B6FE6', backgroundColor: 'rgba(27,111,230,.08)', tension: .42, pointRadius: 4, pointBackgroundColor: '#1B6FE6', fill: true, borderWidth: 2 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { min: 0, max: 100, grid: { color: 'rgba(30,35,80,.06)' }, ticks: { font: { size: 10 }, color: '#6B7280' } }, x: { grid: { display: false }, ticks: { font: { size: 10 }, color: '#6B7280' } } } } });
      }
    }, 80);
  } else if (tab === 'interviews') {
    const ivScores = currentUser.interviewScores;
    const ivAvg = ivScores.length ? Math.round(ivScores.reduce((a, b) => a + b, 0) / ivScores.length) : null;
    const ivBest = ivScores.length ? Math.max(...ivScores) : null;
    const badgeFromScore = s => s >= 90 ? 'Expert' : s >= 80 ? 'Advanced' : s >= 65 ? 'Proficient' : 'Beginner';
    const badgeColor = s => s >= 90 ? 'var(--purple)' : s >= 80 ? 'var(--amber)' : s >= 65 ? 'var(--accent)' : 'var(--muted)';
    const hasIV = ivScores.length > 0;

    c.innerHTML = `<div class="card" style="margin-bottom:14px">
      <div class="ct">Interview History</div>
      ${!hasIV ? `<div style="text-align:center;padding:36px;color:var(--muted);font-size:13px">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="40" height="40" style="display:block;margin:0 auto 10px;opacity:.3"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
        No interview sessions yet. <button class="btn btn-p btn-sm" style="margin-left:8px" onclick="ss('iv','nav-iv')">Start Interview</button>
      </div>` : `
      <div class="g3" style="margin-bottom:16px">
        <div class="card-sm" style="text-align:center"><div style="font-family:'Playfair Display',serif;font-size:24px;font-weight:700;color:var(--text)">${ivScores.length}</div><div style="font-size:11px;color:var(--muted)">Total sessions</div></div>
        <div class="card-sm" style="text-align:center"><div style="font-family:'Playfair Display',serif;font-size:24px;font-weight:700;color:var(--accent)">${ivAvg}</div><div style="font-size:11px;color:var(--muted)">Avg score</div></div>
        <div class="card-sm" style="text-align:center"><div style="font-size:13px;font-weight:700;color:${badgeColor(ivAvg)}">${badgeFromScore(ivAvg)}</div><div style="font-size:11px;color:var(--muted)">Current badge</div></div>
      </div>
      <table><thead><tr><th>#</th><th>Score</th><th>Badge</th></tr></thead>
      <tbody>${ivScores.map((s, i) => `<tr><td>Session ${i + 1}</td><td><span style="font-weight:700;color:${badgeColor(s)}">${s}</span>/100</td><td><span class="badge" style="font-size:10px;color:${badgeColor(s)}">${badgeFromScore(s)}</span></td></tr>`).join('')}
      </tbody></table>`}
    </div>`;
  } else if (tab === 'openroles') {
    c.innerHTML = `<div class="card"><div class="ct">Open Roles Matching Your Profile</div>
      <div style="display:flex;flex-direction:column;gap:12px">
        <div class="vcard"><div class="vtit">Full Stack Developer</div><div class="vco"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="11" height="11"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>Zoho Corporation · Internship</div><div style="font-size:12px;color:var(--muted);margin-bottom:10px">Required: Logical Reasoning, Quantitative · Min score: 65</div><div style="display:flex;justify-content:space-between;align-items:center"><span class="badge ba">Deadline: 30 Dec</span><button class="btn btn-p btn-sm" onclick="openApplyModal('Full Stack Developer','Zoho Corporation · Internship')">Apply Now</button></div></div>
        <div class="vcard"><div class="vtit">Backend Engineer</div><div class="vco"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="11" height="11"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>Freshworks · Full-time</div><div style="font-size:12px;color:var(--muted);margin-bottom:10px">Required: Logical Reasoning, DI · Min score: 70</div><div style="display:flex;justify-content:space-between;align-items:center"><span class="badge ba">Deadline: 15 Jan</span><button class="btn btn-o btn-sm" onclick="openApplyModal('Backend Engineer','Freshworks · Full-time')">Apply</button></div></div>
        <div class="vcard"><div class="vtit">Finance Analyst</div><div class="vco"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="11" height="11"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>HDFC Bank · Full-time</div><div style="font-size:12px;color:var(--muted);margin-bottom:10px">Required: Quantitative, DI · Min score: 70</div><div style="display:flex;justify-content:space-between;align-items:center"><span class="badge ba">Deadline: 20 Jan</span><button class="btn btn-o btn-sm" onclick="openApplyModal('Finance Analyst','HDFC Bank · Full-time')">Apply</button></div></div>
        <div class="vcard"><div class="vtit">Data Analyst</div><div class="vco"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="11" height="11"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>Razorpay · Full-time</div><div style="font-size:12px;color:var(--muted);margin-bottom:10px">Required: DI, Quantitative · Min score: 75</div><div style="display:flex;justify-content:space-between;align-items:center"><span class="badge br">Score too low (74/75)</span><button class="btn btn-g btn-sm" onclick="startPractice('di')">Improve score</button></div></div>
      </div></div>`;
  } else {
    // Achievements — fully dynamic
    const u = currentUser;
    const ivScores = u.interviewScores;
    const ivAvg = ivScores.length ? Math.round(ivScores.reduce((a, b) => a + b, 0) / ivScores.length) : 0;
    const badgeFromScore = s => s >= 90 ? { label: 'Expert', color: 'var(--purple)', bg: 'var(--purple-l)' } : s >= 80 ? { label: 'Advanced', color: 'var(--amber)', bg: 'var(--amber-l)' } : s >= 65 ? { label: 'Proficient', color: 'var(--accent)', bg: 'var(--accent-l)' } : { label: 'Beginner', color: 'var(--muted)', bg: 'var(--surface2)' };
    const ps = u.practiceScores;
    const avg = arr => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;
    const earned = [];
    if (u.streak >= 3) earned.push({ icon: '🔥', title: `${u.streak}-Day Streak`, sub: 'Consistency milestone', color: 'var(--amber-l)', border: 'rgba(245,158,11,.25)' });
    if (u.testsCompleted >= 5) earned.push({ icon: '📚', title: '5 Sessions Done', sub: 'Practice milestone', color: 'var(--accent-l)', border: 'rgba(27,111,230,.25)' });
    if (u.testsCompleted >= 20) earned.push({ icon: '🏆', title: '20 Sessions', sub: 'Dedicated learner', color: 'var(--purple-l)', border: 'rgba(108,92,231,.25)' });
    if (u.avgAccuracy >= 80) earned.push({ icon: '⭐', title: '80%+ Accuracy', sub: 'Advanced learner', color: 'var(--teal-l)', border: 'rgba(13,148,136,.25)' });
    if (u.avgAccuracy >= 90) earned.push({ icon: '💎', title: '90%+ Accuracy', sub: 'Expert level', color: 'var(--purple-l)', border: 'rgba(108,92,231,.35)' });
    if (ivScores.length >= 1) earned.push({ icon: '🎤', title: 'First Interview', sub: 'Mock interview done', color: 'var(--green-l)', border: 'rgba(14,159,110,.25)' });
    if (u.nationalRank && u.nationalRank <= 200) earned.push({ icon: '🌟', title: 'Top 20% National', sub: 'Leaderboard rank', color: 'var(--amber-l)', border: 'rgba(245,158,11,.3)' });
    if (u.plan === 'pro' || u.role === 'college') earned.push({ icon: '🚀', title: 'Pro Access', sub: 'Unlimited features', color: 'var(--accent-l)', border: 'rgba(27,111,230,.25)' });

    c.innerHTML = `<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
      <div class="card">
        <div class="ct">Badges Earned</div>
        ${ivScores.length === 0 && u.testsCompleted === 0 ? `<div style="text-align:center;padding:28px;color:var(--muted);font-size:13px">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="36" height="36" style="display:block;margin:0 auto 10px;opacity:.3"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>
          Complete sessions to earn badges</div>` :
        `<div style="display:flex;flex-direction:column;gap:10px">
          ${ivScores.length ? (() => {
          const b = badgeFromScore(ivAvg); return `<div style="display:flex;align-items:center;gap:12px;padding:12px;background:${b.bg};border:1px solid ${b.color}30;border-radius:var(--r2)">
            <div style="width:42px;height:42px;border-radius:10px;background:${b.bg};border:1.5px solid ${b.color}40;display:flex;align-items:center;justify-content:center;flex-shrink:0"><svg viewBox="0 0 24 24" fill="none" stroke="${b.color}" stroke-width="2" width="20" height="20"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/></svg></div>
            <div><div style="font-size:13px;font-weight:700;color:var(--text)">Mock Interview</div><div style="font-size:11px;color:${b.color}">${b.label} · Avg ${ivAvg}/100 · ${ivScores.length} session${ivScores.length > 1 ? 's' : ''}</div></div>
          </div>`;
        })() : ''}
          ${u.avgAccuracy ? (() => {
          const b = badgeFromScore(u.avgAccuracy); return `<div style="display:flex;align-items:center;gap:12px;padding:12px;background:${b.bg};border:1px solid ${b.color}30;border-radius:var(--r2)">
            <div style="width:42px;height:42px;border-radius:10px;background:${b.bg};border:1.5px solid ${b.color}40;display:flex;align-items:center;justify-content:center;flex-shrink:0"><svg viewBox="0 0 24 24" fill="none" stroke="${b.color}" stroke-width="2" width="20" height="20"><polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/></svg></div>
            <div><div style="font-size:13px;font-weight:700;color:var(--text)">Practice Aptitude</div><div style="font-size:11px;color:${b.color}">${b.label} · ${u.avgAccuracy}% avg · ${u.testsCompleted} sessions</div></div>
          </div>`;
        })() : ''}
        </div>`}
      </div>
      <div class="card">
        <div class="ct">Milestones</div>
        ${!earned.length ? `<div style="text-align:center;padding:28px;color:var(--muted);font-size:13px">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="36" height="36" style="display:block;margin:0 auto 10px;opacity:.3"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>
          Milestones appear as you practise</div>` :
        `<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          ${earned.map(m => `<div class="card-sm" style="text-align:center;border-color:${m.border};background:${m.color}">
            <div style="font-size:24px;margin-bottom:5px">${m.icon}</div>
            <div style="font-size:12px;font-weight:700;color:var(--text)">${m.title}</div>
            <div style="font-size:10px;color:var(--muted)">${m.sub}</div>
          </div>`).join('')}
        </div>`}
      </div>
    </div>`;
  }
}

function setPTab(t, btn) { renderPTab(t, btn); }

// ════════ RESUME ════════
function setRM(m) {
  state.rmMode = m;
  document.getElementById('rb-fresh').style.display = m === 'fresh' ? 'block' : 'none';
  document.getElementById('rb-upload').style.display = m === 'upload' ? 'block' : 'none';
  document.getElementById('rb-fb').className = `btn btn-sm ${m === 'fresh' ? 'btn-p' : 'btn-o'}`;
  document.getElementById('rb-ub').className = `btn btn-sm ${m === 'upload' ? 'btn-p' : 'btn-o'}`;
}

function simulateUpload() {
  const s = document.getElementById('upload-status'); s.style.display = 'block';
  s.textContent = 'Parsing your document...';
  setTimeout(() => { s.textContent = 'AI enhancing bullet points...'; }, 1200);
  setTimeout(() => { s.textContent = 'Running ATS analysis...'; }, 2400);
  setTimeout(() => { s.style.color = 'var(--green)'; s.textContent = 'Enhanced successfully '; setRM('fresh'); showToast('Resume uploaded and AI-enhanced'); }, 3600);
}

// ════════ LEARNER PORTAL LOGIN ════════
function doLearnerPortalLogin() {
  const email = (document.getElementById('learner-login-email')?.value || '').trim();
  const pass = (document.getElementById('learner-login-pass')?.value || '').trim();
  const errEl = document.getElementById('learner-login-err');

  // Validate
  if (!email || !email.includes('@')) {
    errEl.textContent = 'Please enter a valid Gmail address.';
    errEl.style.display = 'block';
    document.getElementById('learner-login-email')?.classList.add('input-err');
    return;
  }
  if (pass.length < 6) {
    errEl.textContent = 'Password must be at least 6 characters.';
    errEl.style.display = 'block';
    document.getElementById('learner-login-pass')?.classList.add('input-err');
    return;
  }

  // Demo credential check: password must be "student123"
  if (pass !== 'student123') {
    errEl.textContent = 'Incorrect password. Demo password is student123';
    errEl.style.display = 'block';
    return;
  }

  // Success — hide error, set user info, reveal app
  errEl.style.display = 'none';
  const name = email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  currentUser.name = name;
  currentUser.email = email;

  // Update UI name placeholders
  const unameEl = document.getElementById('user-name');
  const uInitEl = document.getElementById('user-initials');
  if (unameEl) unameEl.textContent = name;
  if (uInitEl) uInitEl.textContent = name.slice(0, 2).toUpperCase();

  // Animate transition
  const loginPage = document.getElementById('learner-login-page');
  const app = document.getElementById('app');
  if (loginPage) {
    loginPage.style.opacity = '0';
    loginPage.style.transition = 'opacity 0.35s ease';
    setTimeout(() => {
      loginPage.style.display = 'none';
      if (app) { app.classList.add('show'); }
    }, 350);
  } else if (app) {
    app.classList.add('show');
  }
  showToast('Welcome back, ' + name + '! 👋');
}

// doGoogleLogin removed as official button is now rendered via initGoogleAuth

function _handleLearnerGoogleLoginSuccess(user) {
  const name = user.name;
  const email = user.email;
  currentUser.name = name;
  currentUser.email = email;

  // Update UI name placeholders
  const unameEl = document.getElementById('user-name');
  const uInitEl = document.getElementById('user-initials');
  if (unameEl) unameEl.textContent = name;
  if (uInitEl) uInitEl.textContent = name.slice(0, 2).toUpperCase();

  // Animate transition
  const loginPage = document.getElementById('learner-login-page');
  const app = document.getElementById('app');
  if (loginPage) {
    loginPage.style.opacity = '0';
    loginPage.style.transition = 'opacity 0.35s ease';
    setTimeout(() => {
      loginPage.style.display = 'none';
      if (app) { app.classList.add('show'); }
    }, 350);
  } else if (app) {
    app.classList.add('show');
  }
  showToast('Welcome back, ' + name + '! 👋');
}
