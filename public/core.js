// ════════ EXTERNAL QUESTION BANK LOADER ════════
window.BERTH_QBANK_CACHE = {};
window.Qs = {};
window.BERTH_QBANK = {}; // Legacy fallback

async function loadExternalSubjectBank(subj) {
  let fileMap = {
    logical: 'logical_mcq_500.json',
    quant: 'quantitative_mcq.json',
    di: 'datainterpretation_json_20260418_efaa7a.json',
    verbal: 'verbal_json_20260418_40a84d.json',
    reasoning: 'verbal_json_20260418_40a84d.json'
  };
  let fileName = fileMap[subj] || 'logical_mcq_500.json';
  if (window.BERTH_QBANK_CACHE[fileName]) return window.BERTH_QBANK_CACHE[fileName];

  // Potential endpoints: relative path or the Skillovate API server
  const API_HOST = window.location.hostname === 'localhost' ? 'localhost:5000' : `${window.location.hostname}:5000`;
  const endpoints = [
    'question_bank/' + fileName,
    `http://${API_HOST}/question_bank/${fileName}`
  ];

  for (const url of endpoints) {
    try {
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) continue;
      const rawData = await res.json();
      console.log(`%c[JSON SERVER] Questions loaded from: ${url}`, 'color: #10B981; font-weight: bold;');

      const dataArray = Array.isArray(rawData) ? rawData : (rawData.questions || []);
      const mapped = dataArray.map(item => {
        let qStr = item.question || item.q;
        let optsArr = item.options || item.opts;
        let ansStr = item.answer || item.ans;
        let ansIdx = 0;

        if (typeof ansStr === 'string' && Array.isArray(optsArr)) {
          if (ansStr.length === 1 && "ABCD".includes(ansStr.toUpperCase())) {
            ansIdx = ansStr.toUpperCase().charCodeAt(0) - 65;
          } else {
            ansIdx = optsArr.indexOf(ansStr);
          }
          if (ansIdx === -1) ansIdx = 0;
        } else if (typeof ansStr === 'number') {
          ansIdx = ansStr;
        }
        return { q: qStr, opts: optsArr, ans: ansIdx, exp: item.explanation || '' };
      });
      window.BERTH_QBANK_CACHE[fileName] = mapped;
      return mapped;
    } catch (e) {
      console.warn(`Attempt to fetch ${url} failed. Trying next source...`);
    }
  }

  // ALL FETCH SOURCES FAILED -> Using local fallback
  console.warn(`[JSON SERVER] All endpoints failed for ${fileName}. Using local fallback data.`);
  const fallbackKey = {
    quant: 'quant',
    logical: 'logical',
    verbal: 'verbal',
    di: 'di',
    reasoning: 'reasoning'
  }[subj] || 'logical';

  const fallbackData = (typeof window.BERTH_QBANK !== 'undefined') ? (window.BERTH_QBANK[fallbackKey] || []) : [];
  window.Qs[subj] = fallbackData;
  return fallbackData;
}

/**
 * 🌪️ SHUFFLE UTILITY: Fisher-Yates shuffle
 */
function mixArray(arr) {
  let m = arr.length, t, i;
  while (m) {
    i = Math.floor(Math.random() * m--);
    t = arr[m]; arr[m] = arr[i]; arr[i] = t;
  }
  return arr;
}

/**
 * 🛰️ SEEDED SHUFFLE: Predictable shuffle for unique student sequences
 */
function seededShuffle(array, seed) {
  let m = array.length, t, i;
  let s = 0;
  if (typeof seed === 'string') {
    for (let char of seed) s += char.charCodeAt(0);
  } else s = seed || 0;

  const random = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };

  while (m) {
    i = Math.floor(random() * m--);
    t = array[m]; array[m] = array[i]; array[i] = t;
  }
  return array;
}

/**
 * 🧪 MIX QUESTION: Shuffles options and preserves correct answer index
 */
function mixQuestion(q) {
  if (!q || !q.opts || !Array.isArray(q.opts)) return q;
  const originalCorrect = q.opts[q.ans];
  const shuffledOpts = mixArray([...q.opts]);
  const newAns = shuffledOpts.indexOf(originalCorrect);
  return { ...q, opts: shuffledOpts, ans: newAns };
}

async function getSequentialQuestions(subj, requiredAmount, isAssessment = false) {
  const bank = await loadExternalSubjectBank(subj);
  if (!bank || bank.length === 0) return [];

  // 🛰️ ZERO-LEAK INTERLEAVED SPLIT: Utilize 100% of the bank without overlap
  // We split the entire bank into two disjoint sets based on index parity
  // Practice = Odd indices, Assessment = Even indices
  let pool = [];
  let trackKey = subj;

  if (isAssessment) {
    // Assessment pool: [Q0, Q2, Q4, Q6, ...] -> 50% of total bank
    pool = bank.filter((_, idx) => idx % 2 === 0);
    trackKey = `${subj}_assessment`;
  } else {
    // Practice pool: [Q1, Q3, Q5, Q7, ...] -> 50% of total bank
    pool = bank.filter((_, idx) => idx % 2 !== 0);
    trackKey = `${subj}_practice`;
  }

  // Fallback if filtering somehow results in empty (shouldn't happen with >1 question)
  if (pool.length === 0) pool = bank;

  // 🌪️ SEEDED SHUFFLE: Ensure EVERY student gets a different sequence of their pool
  const studentSeed = (typeof currentUser !== 'undefined' ? (currentUser.id || currentUser.email || 'guest') : 'guest');
  pool = seededShuffle([...pool], studentSeed + trackKey);

  // 🛰️ Backend-backed persistence
  let startIdx = 0;
  if (typeof currentUser !== 'undefined' && currentUser.trackProgress && currentUser.trackProgress[trackKey] !== undefined) {
    startIdx = currentUser.trackProgress[trackKey];
  } else {
    const uId = (typeof currentUser !== 'undefined' && currentUser.email) ? currentUser.email : 'guest';
    const storageKey = `sk_track_v3_${uId}_${trackKey}`;
    startIdx = parseInt(localStorage.getItem(storageKey) || '0', 10);
  }

  let qs = [];
  for (let i = 0; i < requiredAmount; i++) {
    const rawQ = pool[(startIdx + i) % pool.length];

    // Deep clone to avoid polluting cache with mixed state
    let q = JSON.parse(JSON.stringify(rawQ));

    // 🎲 MIXING: For assessments, shuffle options
    if (isAssessment) {
      q = mixQuestion(q);
    }
    qs.push(q);
  }

  // 🌪️ RANDOMIZE TEST: Shuffle the final question set for the student
  if (isAssessment) {
    mixArray(qs);
  }

  const nextIdx = (startIdx + requiredAmount) % pool.length;

  // ☁️ SYNC TO DATABASE
  const roll = (typeof currentUser !== 'undefined' ? (currentUser.id || currentUser.studentId) : null);
  const collegeId = (typeof currentUser !== 'undefined' ? (currentUser.collegeId?._id || currentUser.college_id) : null);

  if (roll && collegeId && typeof apiFetch === 'function') {
    if (!currentUser.trackProgress) currentUser.trackProgress = {};
    currentUser.trackProgress[trackKey] = nextIdx;

    apiFetch(`/api/students/${roll}/track`, {
      method: 'POST',
      body: JSON.stringify({
        subject: trackKey,
        nextIndex: nextIdx,
        college_id: collegeId
      })
    }).catch(err => console.warn("Index sync failed:", err));
  } else {
    const uId = (typeof currentUser !== 'undefined' && currentUser.email) ? currentUser.email : 'guest';
    localStorage.setItem(`sk_track_v3_${uId}_${trackKey}`, nextIdx);
  }

  return qs;
}

// ════════ DIAGNOSTIC UTILITIES ════════
async function checkJsonServer() {
  const subjects = ['quant', 'logical', 'verbal'];
  console.log("%c[DIAGNOSTICS] Checking JSON Server Status...", "font-weight: bold; color: #2563EB;");
  for (const s of subjects) {
    const start = Date.now();
    const bank = await loadExternalSubjectBank(s);
    const duration = Date.now() - start;
    if (bank && bank.length > 0) {
      console.log(`✅ ${s.toUpperCase()}: ${bank.length} questions loaded in ${duration}ms`);
    } else {
      console.error(`❌ ${s.toUpperCase()}: Failed to load data.`);
    }
  }
}
window.checkJsonServer = checkJsonServer;

// ════════ STATE ════════
let state = {
  subj: 'quant', qIdx: 0, qCorrect: 0, qWrong: 0, qTimer: null,
  mncChosen: null, mncQ: 0, mncTimer: null,
  ivRole: 'Full Stack', ivQ: 0, ivTimer: null, ivScore: 85,
  billing: 'm', rmMode: 'fresh', ptab: 'scores',
  userType: 'student', userPlan: 'base'
};

// ════════ CURRENT USER STATE ════════
let currentUser = {
  name: '',
  initials: '',
  email: '',
  role: 'student',   // student | college | hr | admin | faculty
  plan: 'base',      // base | pro
  college: '',
  company: '',
  testsCompleted: 0,
  avgAccuracy: null,
  streak: 0,
  nationalRank: null,
  recentActivity: [],
  badges: [],
  practiceScores: { quant: [], logical: [], verbal: [], di: [] },
  interviewScores: [],
  bio: '',
  avatar: '',
  github: '',
  portfolio: '',
  linkedin: '',
  department: '',
  badges: [],
};

function setCurrentUser(fields) {
  Object.assign(currentUser, fields);
  if (currentUser.name) {
    currentUser.initials = currentUser.name.split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase();
  }
  refreshUI();
}

function pushActivity(text) {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  currentUser.recentActivity.unshift({ text, time: timeStr, ts: Date.now() });
  if (currentUser.recentActivity.length > 10) currentUser.recentActivity.pop();
  refreshDashboardActivity();
}

function recordTestScore(subj, pct) {
  currentUser.practiceScores[subj] = currentUser.practiceScores[subj] || [];
  currentUser.practiceScores[subj].push(pct);
  currentUser.testsCompleted++;
  // Recompute avg accuracy across all scores
  const all = Object.values(currentUser.practiceScores).flat();
  currentUser.avgAccuracy = all.length ? Math.round(all.reduce((a, b) => a + b, 0) / all.length) : null;
  // Streak: increment each calendar day once
  const today = new Date().toDateString();
  if (currentUser._lastStreakDay !== today) {
    currentUser._lastStreakDay = today;
    currentUser.streak++;
  }
  // Simulated national rank (gets better with higher accuracy)
  if (currentUser.avgAccuracy !== null) {
    currentUser.nationalRank = Math.max(1, Math.round(1000 - currentUser.avgAccuracy * 9));
  }
  refreshDashboard();
  refreshProfile();
}

// ── Master UI refresh ──────────────────────────────────────────────
function refreshUI() {
  refreshTopbar();
  refreshPlanStrip();
  refreshDashboard();
  refreshProfile();
}

function refreshTopbar() {
  const av = document.getElementById('uav');
  const name = document.getElementById('uname');
  const role = document.getElementById('urole');
  if (!av) return;
  av.textContent = currentUser.initials || '?';

  // Avatar gradient by role
  const gradients = {
    admin: 'linear-gradient(135deg,#EF4444,#B91C1C)',
    hr: 'linear-gradient(135deg,var(--purple),#8B7CF8)',
    college: 'linear-gradient(135deg,var(--purple),var(--accent))',
    student: currentUser.plan === 'pro'
      ? 'linear-gradient(135deg,var(--purple),var(--accent))'
      : 'linear-gradient(135deg,var(--accent),var(--accent2))',
    faculty: 'linear-gradient(135deg,var(--teal),#0FB8A8)',
  };
  av.style.background = gradients[currentUser.role] || gradients.student;

  if (name) name.textContent = currentUser.name || 'User';
  if (role) {
    const roleLabels = {
      admin: 'Admin · Internal',
      hr: 'Recruiter · ' + (currentUser.company || 'Company'),
      college: 'Student · Pro',
      student: 'Student · ' + (currentUser.plan === 'pro' ? 'Pro' : 'Base'),
      faculty: 'Faculty Member',
      collegeadmin: 'College Administrator',
    };
    role.textContent = roleLabels[currentUser.role] || 'Institutional User';
  }
}

function refreshPlanStrip() {
  const strip = document.getElementById('plan-strip');
  const planName = document.querySelector('.plan-name');
  const planSub = document.querySelector('.plan-sub');
  const planBar = document.querySelector('.plan-bar-f');
  if (!strip) return;

  const isPro = currentUser.plan === 'pro' || currentUser.role === 'college';
  strip.style.background = isPro ? 'linear-gradient(135deg,rgba(108,92,231,.12),rgba(27,111,230,.08))' : '';
  strip.style.borderColor = isPro ? 'rgba(108,92,231,.25)' : '';
  if (planName) { planName.textContent = isPro ? 'Pro Plan' : 'Base Plan'; planName.style.color = isPro ? 'var(--purple)' : ''; }
  if (planSub) {
    planSub.textContent = isPro
      ? (currentUser.role === 'college' ? 'College batch — unlimited access' : 'Unlimited access')
      : `${currentUser.testsCompleted} / 5 tests used`;
  }
  if (planBar) {
    planBar.style.width = isPro ? '100%' : `${Math.min(100, currentUser.testsCompleted / 5 * 100)}%`;
    planBar.style.background = isPro ? 'linear-gradient(90deg,var(--purple),var(--accent))' : '';
  }
}

function refreshDashboard() {
  // Stat cards
  const stats = [
    { el: 'dash-stat-tests', val: currentUser.testsCompleted > 0 ? String(currentUser.testsCompleted) : '0' },
    { el: 'dash-stat-acc', val: currentUser.avgAccuracy !== null ? currentUser.avgAccuracy + '%' : '—' },
    { el: 'dash-stat-streak', val: String(currentUser.streak) },
    { el: 'dash-stat-rank', val: currentUser.nationalRank ? 'Top ' + (currentUser.nationalRank > 500 ? '>50%' : Math.round(currentUser.nationalRank / 10) + '%') : '—' },
  ];
  stats.forEach(({ el, val }) => { const e = document.getElementById(el); if (e) e.textContent = val; });

  // Hero subtitle
  const heroSub = document.querySelector('#screen-dash .hero-sub');
  if (heroSub) {
    if (currentUser.role === 'college' || currentUser.plan === 'pro') {
      heroSub.textContent = `Welcome, ${currentUser.name}! Your college has provided full Pro access. All modules, unlimited tests, and leaderboard ranking are unlocked.`;
    } else if (currentUser.testsCompleted >= 5) {
      heroSub.textContent = `You've used all 5 base tests, ${currentUser.name}. Upgrade to Pro for unlimited access and a national leaderboard ranking.`;
    } else if (currentUser.testsCompleted > 0) {
      heroSub.textContent = `Welcome back, ${currentUser.name}! You've completed ${currentUser.testsCompleted} session${currentUser.testsCompleted > 1 ? 's' : ''}. Keep going to build your aptitude profile.`;
    } else if (currentUser.name) {
      heroSub.textContent = `Welcome, ${currentUser.name}! Start a practice session to build your aptitude profile and unlock your national leaderboard ranking.`;
    }
  }
  refreshDashboardActivity();
}

function refreshDashboardActivity() {
  const el = document.getElementById('dash-activity-list');
  if (!el) return;
  if (!currentUser.recentActivity.length) {
    el.innerHTML = `<div style="text-align:center;padding:28px;color:var(--muted);font-size:13px">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="36" height="36" style="display:block;margin:0 auto 10px;opacity:.3"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>
      No activity yet. Start a practice session!</div>`;
    return;
  }
  const icons = {
    '✓': '<svg viewBox="0 0 24 24" fill="none" stroke="var(--green)" stroke-width="2.5" width="12" height="12"><polyline points="20,6 9,17 4,12"/></svg>',
    '📄': '<svg viewBox="0 0 24 24" fill="none" stroke="var(--amber)" stroke-width="2.5" width="12" height="12"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/></svg>',
    '🎤': '<svg viewBox="0 0 24 24" fill="none" stroke="var(--purple)" stroke-width="2.5" width="12" height="12"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>',
  };
  el.innerHTML = currentUser.recentActivity.slice(0, 5).map(a => {
    const ic = a.text.startsWith('✓') ? icons['✓'] : a.text.startsWith('🎤') ? icons['🎤'] : icons['📄'];
    const bg = a.text.startsWith('✓') ? 'var(--green-l)' : a.text.startsWith('🎤') ? 'var(--purple-l)' : 'var(--amber-l)';
    return `<div class="ai"><div class="ad" style="background:${bg}">${ic}</div><div><div class="atit">${a.text}</div><div class="atm">${a.time}</div></div></div>`;
  }).join('');
}

function refreshProfile() {
  const av = document.getElementById('profile-av');
  const name = document.getElementById('profile-name');
  const meta = document.getElementById('profile-meta');
  const bio = document.getElementById('profile-bio');
  const bdgs = document.getElementById('profile-badges');
  if (!av) return;

  av.textContent = currentUser.initials || '—';
  if (name) name.textContent = currentUser.name || '—';
  if (meta) {
    const parts = [];
    if (currentUser.streak > 0) parts.push(currentUser.streak + '-day streak 🔥');
    if (currentUser.college) parts.push(currentUser.college);
    if (currentUser.plan === 'pro' || currentUser.role === 'college') parts.push('Pro Plan ⭐');
    meta.textContent = parts.join(' · ') || 'Sign in to view your profile';
  }
  if (bio) {
    if (currentUser.testsCompleted > 0 && currentUser.avgAccuracy !== null) {
      bio.textContent = `${currentUser.name} has completed ${currentUser.testsCompleted} practice session${currentUser.testsCompleted > 1 ? 's' : ''} with ${currentUser.avgAccuracy}% average accuracy. ${currentUser.nationalRank ? 'Ranked in the top ' + Math.round(currentUser.nationalRank / 10) + '% nationally.' : ''}`;
      bio.style.fontStyle = 'normal';
      bio.style.color = 'rgba(255,255,255,.8)';
    } else {
      bio.textContent = 'Complete practice sessions to generate your AI aptitude profile.';
      bio.style.fontStyle = 'italic';
      bio.style.color = 'rgba(255,255,255,.5)';
    }
  }
  if (bdgs) {
    const badges = [];
    if (currentUser.avgAccuracy !== null && currentUser.avgAccuracy >= 90) badges.push('Expert 🏆');
    if (currentUser.avgAccuracy !== null && currentUser.avgAccuracy >= 80) badges.push('Advanced ⭐');
    if (currentUser.streak >= 7) badges.push(`${currentUser.streak}-day Streak 🔥`);
    if (currentUser.nationalRank && currentUser.nationalRank <= 200) badges.push('Top 20% Nationally');
    if (currentUser.plan === 'pro' || currentUser.role === 'college') badges.push('Pro Access');
    bdgs.innerHTML = badges.map(b => `<span class="badge" style="background:rgba(255,255,255,.2);color:white;border-color:rgba(255,255,255,.3)">${b}</span>`).join('');
  }
}

// ════════ LOGIN ════════
function switchTab(t) {
  document.querySelectorAll('.l-tab').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.l-panel').forEach(p => p.classList.remove('active'));
  const tabBtn = document.querySelector(`[data-t="${t}"]`);
  if (tabBtn) tabBtn.classList.add('active');
  const panel = document.getElementById('lp-' + t);
  if (panel) panel.classList.add('active');
  // Reset faculty role switcher to Faculty when re-entering the tab
  if (t === 'faculty') switchFacultyRole('faculty');
}

function switchFacultyRole(role) {
  const facBtn = document.getElementById('frole-faculty');
  const cadmBtn = document.getElementById('frole-cadmin');
  const facPanel = document.getElementById('fp-sub-faculty');
  const cadmPanel = document.getElementById('fp-sub-cadmin');
  if (!facBtn) return;
  if (role === 'faculty') {
    facBtn.style.background = 'linear-gradient(135deg,var(--teal),#0FB8A8)';
    facBtn.style.color = 'white'; facBtn.style.boxShadow = '0 2px 8px rgba(13,148,136,.22)';
    cadmBtn.style.background = 'transparent'; cadmBtn.style.color = 'var(--muted)'; cadmBtn.style.boxShadow = 'none';
    facPanel.style.display = 'block'; cadmPanel.style.display = 'none';
    // clear errors
    const err = document.getElementById('fac-err'); if (err) err.style.display = 'none';
  } else {
    cadmBtn.style.background = 'linear-gradient(135deg,#1B6FE6,#6C5CE7)';
    cadmBtn.style.color = 'white'; cadmBtn.style.boxShadow = '0 2px 8px rgba(27,111,230,.22)';
    facBtn.style.background = 'transparent'; facBtn.style.color = 'var(--muted)'; facBtn.style.boxShadow = 'none';
    cadmPanel.style.display = 'block'; facPanel.style.display = 'none';
    // clear errors
    const err = document.getElementById('cadm-err'); if (err) err.style.display = 'none';
  }
}

function revealAdmin() {
  document.getElementById('admin-reveal').classList.add('show');
  showToast('Internal access revealed');
}

async function doLogin(type) {
  if (type === 'student') {
    const email = document.querySelector('#lp-student input[type="email"]')?.value?.trim();
    const pass = document.querySelector('#lp-student input[type="password"]')?.value?.trim();
    const errEl = document.getElementById('student-login-err');
    const clearErr = () => { if (errEl) { errEl.textContent = ''; errEl.style.display = 'none'; } };
    const showErr = (msg) => { if (errEl) { errEl.textContent = msg; errEl.style.display = 'block'; } else { showToast(msg); } };

    // Validation
    if (!email || !email.includes('@')) {
      showErr('Please enter a valid email address.');
      return;
    }
    if (!pass || pass.length < 6) {
      showErr('Password must be at least 6 characters.');
      return;
    }
    clearErr();

    // Try backend auth first
    const result = await apiPost('/auth/login', { role: 'student', email, password: pass });
    if (result && result.success) {
      state.userId = result.user_id || 'guest';
      const uname = result.name || email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      setCurrentUser({ name: uname, email, role: 'student', plan: result.plan || 'base', college: result.college || '', testsCompleted: 0, avgAccuracy: null, streak: 0, nationalRank: null, recentActivity: [], practiceScores: { quant: [], logical: [], verbal: [], di: [] }, interviewScores: [] });
      _enterApp('student', uname, result.plan || 'base');
      return;
    }

    // Offline / demo fallback — demo password: student123
    if (pass !== 'student123') {
      showErr('Incorrect password. Demo password is student123');
      return;
    }
    const uname = email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    setCurrentUser({ name: uname, email, role: 'student', plan: 'base', college: '', testsCompleted: 0, avgAccuracy: null, streak: 0, nationalRank: null, recentActivity: [], practiceScores: { quant: [], logical: [], verbal: [], di: [] }, interviewScores: [] });
    _enterApp('student', uname, 'base');
    return;
  }
  if (type === 'hr') {
    const nameEl = document.querySelector('#lp-hr .fi');
    const companyEl = document.querySelectorAll('#lp-hr .fi')[1];
    const passEl = document.querySelectorAll('#lp-hr .fi')[2];
    const name = nameEl?.value?.trim();
    const company = companyEl?.value?.trim();
    const pass = passEl?.value?.trim();
    const errEl = document.getElementById('hr-inst-login-err');
    const showErr = (msg) => { if (errEl) { errEl.textContent = msg; errEl.style.display = 'block'; } else { showToast(msg); } };
    if (!name || name.length < 2) { showErr('Please enter your name.'); return; }
    if (!company || company.length < 2) { showErr('Please enter your company name.'); return; }
    if (!pass || pass.length < 3) { showErr('Please enter your password.'); return; }
    if (pass !== 'hr123') { showErr('Incorrect password. Demo password is hr123'); return; }
    const result = await apiPost('/auth/login', { role: 'hr', name, company });
    state.userType = 'hr';
    setCurrentUser({ name, role: 'hr', plan: 'pro', company, testsCompleted: 0, avgAccuracy: null, streak: 0, nationalRank: null, recentActivity: [], practiceScores: { quant: [], logical: [], verbal: [], di: [] }, interviewScores: [] });
    document.getElementById('login-page').style.display = 'none';
    document.getElementById('app').classList.add('show');
    document.getElementById('snav').style.display = 'none';
    document.getElementById('adminnav').style.display = 'none';
    document.getElementById('hrnav').style.display = 'block';
    document.getElementById('plan-strip').style.display = 'none';
    ss('hr-dash', 'nav-hr-dash');
    return;
  }
  // Fallback
  const fallbackName = type === 'student' ? 'Student' : 'User';
  setCurrentUser({ name: fallbackName, role: type, plan: 'base', testsCompleted: 0, avgAccuracy: null, streak: 0, nationalRank: null, recentActivity: [], practiceScores: { quant: [], logical: [], verbal: [], di: [] }, interviewScores: [] });
  _enterApp(type, fallbackName, 'base');
}

function _enterApp(type, name, plan) {
  state.userType = type; state.userPlan = plan;

  // Hide any existing login screens
  const loginPages = ['login-page', 'learner-login-page', 'hr-login-page', 'institutional-login-page'];
  loginPages.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });

  const appEl = document.getElementById('app');
  if (appEl) appEl.classList.add('show');
  // Ensure currentUser is in sync (may have been set before calling this)
  if (currentUser.name !== name) setCurrentUser({ name, role: type, plan });
  // Nav visibility - Null-safe for modular pages
  const navs = {
    'snav': (type === 'student' || type === 'college'),
    'hrnav': (type === 'hr'),
    'adminnav': (type === 'admin'),
    'col-adminnav': (type === 'college' || type === 'collegeadmin'),
    'plan-strip': (type === 'student' || type === 'college')
  };

  Object.entries(navs).forEach(([id, visible]) => {
    const el = document.getElementById(id);
    if (el) el.style.display = visible ? 'block' : 'none';
  });
  // Pro badge visibility
  if (plan === 'pro' || type === 'college') {
    document.querySelectorAll('.nav-badge').forEach(b => { if (b.textContent === 'Pro') b.style.display = 'none'; });
    const tq = document.getElementById('test-quota-card'); if (tq) tq.style.display = 'none';
  }
  buildMNCGrid(); buildJobGrid(); renderPTab('scores', null);
  ss('dash', 'nav-dash');
}

async function doAdminLogin() {
  const p = document.getElementById('admin-pass').value;
  if (p === 'kavi123') {
    await apiPost('/auth/login', { role: 'admin', password: p });
    state.userType = 'admin';
    setCurrentUser({ name: 'Admin', initials: 'AD', role: 'admin', plan: 'pro', company: '', college: '', testsCompleted: 0, avgAccuracy: null, streak: 0, nationalRank: null, recentActivity: [], practiceScores: { quant: [], logical: [], verbal: [], di: [] }, interviewScores: [] });
    document.getElementById('login-page').style.display = 'none';
    document.getElementById('app').classList.add('show');
    document.getElementById('snav').style.display = 'none';
    document.getElementById('hrnav').style.display = 'none';
    document.getElementById('adminnav').style.display = 'block';
    document.getElementById('plan-strip').style.display = 'none';
    buildAdminCols();
    updateAdminPendingBadge();
    updateApprovalsBadge();
    setTimeout(loadAIMetrics, 500);
    ss('admin', 'nav-admin');
  } else {
    document.getElementById('admin-reveal').classList.add('shake');
    setTimeout(() => document.getElementById('admin-reveal').classList.remove('shake'), 400);
  }
}

// ════════ FACULTY & STUDENT DATA ════════
// Each student: {id, name, roll, year, batch, batchId, faculty, status:'pending'|'approved'|'denied'}
// ════════ APPROVAL REQUEST DATA ════════
let allFacultyRequests = [];

let allCollegeAdminRequests = [];

let facultyBatches = [];

// ════════ UNIFIED AUTHORIZATION ENGINE ════════
window.approvedStudents = window.approvedStudents || JSON.parse(localStorage.getItem('sk_approved_students') || '{}');

function grantCollegeAccess(records, college, department) {
  records.forEach(record => {
    const rollNo = String(record.rollNo).trim().toUpperCase();
    if (!rollNo) return;

    window.approvedStudents[rollNo] = {
      name: String(record.name).trim(),
      rollNo: rollNo,
      college: String(college || 'Institutional Partner').trim(),
      dept: String(department || 'General').trim(),
      accessGranted: true,
      authorizedAt: new Date().toLocaleString()
    };
  });

  // Persist immediately
  localStorage.setItem('sk_approved_students', JSON.stringify(window.approvedStudents));
  console.log(`[AUTH ENGINE] Access granted to ${records.length} students for ${college}`);
}

function hasCollegeAccess(rollNo, targetCollege = null) {
  // Deep Sync from storage to ensure we have any changes made in other tabs/scripts
  try {
    const latest = JSON.parse(localStorage.getItem('sk_approved_students') || '{}');
    window.approvedStudents = latest;
  } catch (e) {
    console.warn('Auth Sync Error:', e);
  }

  const normalizedRoll = String(rollNo).trim().toUpperCase();
  const record = window.approvedStudents[normalizedRoll];

  if (!record || record.accessGranted !== true) {
    console.log(`[AUTH ENGINE] Access denied for ${normalizedRoll}: No authorized record found.`);
    return false;
  }

  if (targetCollege) {
    const recordCollege = String(record.college).trim().toUpperCase();
    const target = String(targetCollege).trim().toUpperCase();

    // Flexible matching: check if either contains the other to handle common abbreviations
    const match = recordCollege.includes(target) || target.includes(recordCollege);
    if (!match) {
      console.log(`[AUTH ENGINE] College mismatch for ${normalizedRoll}: Expected ${recordCollege}, got ${target}`);
      return false;
    }
  }

  console.log(`[AUTH ENGINE] Access GRANTED for ${normalizedRoll} (${record.college})`);
  return true;
}

// Function to get approved student info
function getApprovedStudentInfo(rollNo) {
  const normalized = String(rollNo).trim().toUpperCase();
  return approvedStudents[normalized] || null;
}

let activeFacultyEmail = '';
let activeFacultyBatchId = null;
let activeFacultyCollege = ''; // Track faculty college
let activeFacultyName = ''; // 🔴 NEW: Track faculty name for submissions

async function doFacultyLogin() {
  const email = document.getElementById('fac-email').value.trim();
  const pass = document.getElementById('fac-pass').value.trim();
  const college = document.getElementById('fac-college').value.trim();
  const errEl = document.getElementById('fac-err');

  if (!college) { errEl.style.display = 'block'; errEl.textContent = 'Please select your college.'; return; }
  if (!email) { errEl.style.display = 'block'; errEl.textContent = 'Please enter your Faculty ID / Email.'; return; }
  if (!pass) { errEl.style.display = 'block'; errEl.textContent = 'Please enter your password.'; return; }

  // Call backend first
  const result = await apiPost('/auth/login', { role: 'faculty', email, password: pass, college });

  // Backend unavailable — fall through to local logic
  const existing = allFacultyRequests.find(r => r.email === email);
  if (result && !result.success) {
    errEl.style.display = 'block';
    errEl.style.background = result.error?.includes('pending') ? 'var(--amber-l)' : 'var(--red-l)';
    errEl.style.borderColor = result.error?.includes('pending') ? 'rgba(245,158,11,.3)' : 'rgba(239,68,68,.2)';
    errEl.style.color = result.error?.includes('pending') ? 'var(--amber)' : 'var(--red)';
    errEl.innerHTML = `<strong>${result.error?.includes('pending') ? '⏳' : '✗'}</strong> ${result.error}`;
    if (!existing) {
      allFacultyRequests.push({
        id: 'fac-' + Date.now(), email, name: email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        college: college, requestedAt: new Date().toLocaleString('en-IN'), status: 'pending'
      });
      updateApprovalsBadge();
    }
    return;
  }

  if (!existing) {
    allFacultyRequests.push({
      id: 'fac-' + Date.now(), email, name: email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      college: college, requestedAt: new Date().toLocaleString('en-IN'), status: 'pending'
    });
    updateApprovalsBadge();
    errEl.style.display = 'block'; errEl.style.background = 'var(--amber-l)'; errEl.style.borderColor = 'rgba(245,158,11,.3)'; errEl.style.color = 'var(--amber)';
    errEl.innerHTML = '<strong>✓ Request submitted!</strong> Your account is pending Admin approval. Please wait for approval before accessing the portal.';
    return;
  }
  if (existing.status === 'pending') {
    errEl.style.display = 'block'; errEl.style.background = 'var(--amber-l)'; errEl.style.borderColor = 'rgba(245,158,11,.3)'; errEl.style.color = '#B45309';
    errEl.innerHTML = '<strong>⏳ Awaiting Admin approval.</strong> Your request is under review. Please check back after approval.';
    return;
  }
  if (existing.status === 'denied') {
    errEl.style.display = 'block'; errEl.style.background = 'var(--red-l)'; errEl.style.borderColor = 'rgba(239,68,68,.2)'; errEl.style.color = 'var(--red)';
    errEl.innerHTML = '<strong>✗ Access Denied.</strong> Your faculty access request was rejected. Contact the platform admin.';
    return;
  }
  errEl.style.display = 'none';
  activeFacultyEmail = email;
  activeFacultyCollege = college; // Store college
  const displayName = result?.name || existing.name;
  activeFacultyName = displayName; // 🔴 NEW: Store faculty name
  document.getElementById('fp-faculty-name').textContent = displayName;
  document.getElementById('fp-faculty-college').textContent = college;
  document.getElementById('login-page').style.display = 'none';
  document.getElementById('faculty-portal').classList.add('show');
  activeFacultyBatchId = null;
  renderFacultyBatches();
  renderFacultyStudents();
}

function doFacultyLogout() {
  activeFacultyEmail = '';
  activeFacultyCollege = '';
  activeFacultyName = ''; // 🔴 NEW: Clear faculty name on logout
  activeFacultyBatchId = null;
  document.getElementById('faculty-portal').classList.remove('show');
  document.getElementById('login-page').style.display = 'flex';
  document.getElementById('fac-email').value = '';
  document.getElementById('fac-pass').value = '';
  switchTab('faculty');
}

async function createBatch() {
  const name = document.getElementById('new-batch-name').value.trim();
  const dept = document.getElementById('new-batch-dept').value.trim();
  if (!name) { showToast('Please enter a batch name'); return; }
  const displayName = activeFacultyEmail.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const college = activeFacultyEmail.split('@')[1] || 'Unknown';
  const batch = {
    id: 'batch-' + Date.now(),
    name, dept: dept || '—', faculty: displayName,
    facultyEmail: activeFacultyEmail, college: activeFacultyCollege, students: []
  };
  // Sync to backend
  const result = await apiPost('/faculty/batches', {
    name, dept: dept || '—', college: activeFacultyCollege,
    faculty_email: activeFacultyEmail
  });
  if (result && result.batch_id) batch.id = result.batch_id;
  facultyBatches.push(batch);
  document.getElementById('new-batch-name').value = '';
  document.getElementById('new-batch-dept').value = '';
  activeFacultyBatchId = batch.id;
  renderFacultyBatches();
  renderFacultyStudents();
  showToast('Batch "' + name + '" created!');
}

function renderFacultyBatches() {
  const myBatches = facultyBatches.filter(b => b.facultyEmail === activeFacultyEmail);
  const el = document.getElementById('fp-batch-list');
  if (!myBatches.length) {
    el.innerHTML = '<div style="font-size:12px;color:var(--faint);padding:8px 0">No batches yet — create one above</div>';
    return;
  }
  el.innerHTML = myBatches.map(b => `
    <span class="batch-chip ${b.id === activeFacultyBatchId ? 'active' : ''}" onclick="selectFacultyBatch('${b.id}')">
      ${b.name} <span style="opacity:.7;font-weight:400">${b.students.length}</span>
    </span>`).join('');
}

function selectFacultyBatch(id) {
  activeFacultyBatchId = id;
  renderFacultyBatches();
  renderFacultyStudents();
}

function renderFacultyStudents() {
  const batch = facultyBatches.find(b => b.id === activeFacultyBatchId);
  const nameEl = document.getElementById('fp-active-batch');
  const listEl = document.getElementById('fp-student-list');
  const countEl = document.getElementById('fp-student-count');
  if (!batch) {
    nameEl.textContent = '— Select a batch first —';
    countEl.textContent = '0 students';
    listEl.innerHTML = '<div class="empty-state"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="32" height="32"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>Select a batch to view students</div>';
    return;
  }
  nameEl.textContent = batch.name;
  countEl.textContent = batch.students.length + ' student' + (batch.students.length !== 1 ? 's' : '');
  if (!batch.students.length) {
    listEl.innerHTML = '<div class="empty-state"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="32" height="32"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>No students yet — add one above</div>';
    return;
  }
  listEl.innerHTML = batch.students.map(s => `
    <div class="student-row">
      <div class="student-av">${s.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}</div>
      <div style="flex:1">
        <div class="student-name">${s.name}</div>
        <div class="student-meta">${s.roll} · ${s.year}</div>
      </div>
      <span class="status-pill ${s.status === 'approved' ? 'sp-approved' : s.status === 'denied' ? 'sp-denied' : 'sp-pending'}">
        ${s.status === 'approved' ? '✓ Approved' : s.status === 'denied' ? '✗ Denied' : '⏳ Pending Admin'}
      </span>
      <button onclick="removeFacultyStudent('${s.id}')" style="background:var(--red-l);border:1px solid rgba(239,68,68,.2);border-radius:6px;padding:4px 8px;cursor:pointer;color:var(--red);font-size:11px">Remove</button>
    </div>`).join('');
}

async function addStudentToBatch() {
  if (!activeFacultyBatchId) { showToast('Please select or create a batch first'); return; }
  const name = document.getElementById('add-stu-name').value.trim();
  const roll = document.getElementById('add-stu-roll').value.trim().toUpperCase();
  const year = document.getElementById('add-stu-year').value;
  if (!name || !roll || !year) { showToast('Please fill all student fields'); return; }
  const allStudents = facultyBatches.flatMap(b => b.students);
  if (allStudents.find(s => s.roll === roll)) { showToast('Roll number ' + roll + ' already registered'); return; }
  const batch = facultyBatches.find(b => b.id === activeFacultyBatchId);
  const student = { id: 's' + Date.now(), name, roll, year, status: 'pending' };
  // Sync to backend
  const result = await apiPost('/faculty/students', {
    batch_id: activeFacultyBatchId, name, roll_no: roll, year
  });
  if (result && result.student_id) student.id = result.student_id;
  batch.students.push(student);
  document.getElementById('add-stu-name').value = '';
  document.getElementById('add-stu-roll').value = '';
  document.getElementById('add-stu-year').value = '';
  renderFacultyStudents();
  renderFacultyBatches();
  updateAdminPendingBadge();
  showToast(name + ' added to batch · Pending admin approval');
}

function removeFacultyStudent(sid) {
  for (const b of facultyBatches) {
    const idx = b.students.findIndex(s => s.id === sid);
    if (idx > -1) { b.students.splice(idx, 1); break; }
  }
  renderFacultyStudents();
  renderFacultyBatches();
  updateAdminPendingBadge();
  showToast('Student removed from batch');
}

// ════════ STUDENT COLLEGE LOGIN (with access check) ════════
async function doStudentCollegeLogin() {
  const roll = document.getElementById('col-rollno').value.trim().toUpperCase();
  const pass = document.getElementById('col-pass').value.trim();
  const errEl = document.getElementById('col-err');
  if (!roll) { errEl.style.display = 'block'; errEl.textContent = 'Please enter your Roll Number.'; return; }
  if (!pass) { errEl.style.display = 'block'; errEl.textContent = 'Please enter your password.'; return; }

  // Check if student is in approved list
  const approvedInfo = getApprovedStudentInfo(roll);
  if (approvedInfo && approvedInfo.accessGranted) {
    errEl.style.display = 'none';
    const sName = approvedInfo.name || roll;
    state.userId = roll;
    setCurrentUser({
      name: sName,
      role: 'college',
      plan: 'pro',
      college: 'Approved College',
      batch: 'Approved Batch',
      rollNo: roll,
      testsCompleted: 0,
      avgAccuracy: null,
      streak: 0,
      nationalRank: null,
      recentActivity: [],
      practiceScores: { quant: [], logical: [], verbal: [], di: [] },
      interviewScores: []
    });
    _enterApp('college', sName, 'pro');
    return;
  }

  // Try backend first
  const result = await apiPost('/auth/login', { role: 'college_student', roll_no: roll, password: pass });

  // Local fallback
  let foundStudent = null, foundBatch = null;
  for (const b of facultyBatches) {
    const s = b.students.find(st => st.roll === roll);
    if (s) { foundStudent = s; foundBatch = b; break; }
  }
  if (!foundStudent && !(result && result.success)) {
    errEl.style.display = 'block';
    errEl.textContent = 'Roll number not found. Please ask your faculty to register you first.';
    return;
  }
  const status = result?.status || foundStudent?.status || 'pending';
  if (status === 'pending') {
    errEl.style.display = 'block';
    errEl.innerHTML = '<strong>Access pending.</strong> Your faculty registered you. Waiting for admin approval. Please check back later.';
    return;
  }
  if (status === 'denied') {
    errEl.style.display = 'block';
    errEl.innerHTML = '<strong>Access denied.</strong> Your access was not approved. Please contact your faculty or college admin.';
    return;
  }
  errEl.style.display = 'none';
  const sName = result?.name || foundStudent?.name || roll;
  state.userId = result?.user_id || roll;
  const sBatch = foundBatch?.name || '';
  const sCollege = foundBatch?.dept || result?.college || '';
  setCurrentUser({ name: sName, role: 'college', plan: 'pro', college: sCollege, batch: sBatch, testsCompleted: 0, avgAccuracy: null, streak: 0, nationalRank: null, recentActivity: [], practiceScores: { quant: [], logical: [], verbal: [], di: [] }, interviewScores: [] });
  _enterApp('college', sName, 'pro');
}

// ════════ ADMIN STUDENT ACCESS MANAGEMENT ════════
// ════════ APPROVALS MANAGEMENT ════════
function updateApprovalsBadge() {
  const pendingFac = allFacultyRequests.filter(r => r.status === 'pending').length;
  const pendingCadm = allCollegeAdminRequests.filter(r => r.status === 'pending').length;
  const total = pendingFac + pendingCadm;
  const badge = document.getElementById('admin-approvals-badge');
  if (badge) badge.textContent = total;
  // also update tab counts
  const fc = document.getElementById('appr-fac-count');
  const cc = document.getElementById('appr-cadm-count');
  if (fc) fc.textContent = pendingFac;
  if (cc) cc.textContent = pendingCadm;
}

function switchApprovalTab(tab) {
  document.getElementById('appr-panel-faculty').style.display = tab === 'faculty' ? 'block' : 'none';
  document.getElementById('appr-panel-cadmin').style.display = tab === 'cadmin' ? 'block' : 'none';
  document.getElementById('appr-tab-faculty').classList.toggle('active', tab === 'faculty');
  document.getElementById('appr-tab-cadmin').classList.toggle('active', tab === 'cadmin');

  // 🔴 FIX: Refresh the admin console when switching tabs so faculty submissions appear
  if (tab === 'faculty') {
    updateAdminConsole();
  }
}

function buildAdminApprovals() {
  updateApprovalsBadge();
  // 🔴 FIX: Call updateAdminConsole to display faculty module submissions
  updateAdminConsole();

  // Summary
  const pF = allFacultyRequests.filter(r => r.status === 'pending').length;
  const pC = allCollegeAdminRequests.filter(r => r.status === 'pending').length;
  const aF = allFacultyRequests.filter(r => r.status === 'approved').length;
  const aC = allCollegeAdminRequests.filter(r => r.status === 'approved').length;
  document.getElementById('approvals-summary').innerHTML = `
    <span style="background:var(--amber-l);color:var(--amber);border:1px solid rgba(245,158,11,.22);border-radius:20px;padding:4px 12px;font-size:11px;font-weight:700">${pF + pC} Pending</span>
    <span style="background:var(--green-l);color:var(--green);border:1px solid rgba(14,159,110,.22);border-radius:20px;padding:4px 12px;font-size:11px;font-weight:700">${aF + aC} Approved</span>`;
  buildFacultyApprovalList();
  buildCadminApprovalList();
}

function buildFacultyApprovalList() {
  const el = document.getElementById('admin-faculty-approvals-body');
  if (!allFacultyRequests.length) {
    el.innerHTML = '<div class="appr-empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="40" height="40"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg><div>No faculty requests yet</div></div>';
    return;
  }
  const grouped = { pending: [], approved: [], denied: [] };
  allFacultyRequests.forEach(r => grouped[r.status].push(r));
  let html = '';
  [['pending', '⏳ Pending Approval', 'var(--amber)'], ['approved', '✓ Approved', 'var(--green)'], ['denied', '✗ Denied', 'var(--red)']].forEach(([status, label, color]) => {
    if (!grouped[status].length) return;
    html += `<div class="appr-section-hdr"><span style="color:${color};font-weight:700">${label}</span><span>${grouped[status].length} faculty</span></div>`;
    grouped[status].forEach(r => {
      const initials = r.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
      html += `<div class="appr-row">
        <div class="appr-avatar fac">${initials}</div>
        <div style="flex:1">
          <div class="appr-name">${r.name}</div>
          <div class="appr-meta">
            <span class="appr-tag"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="10" height="10"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>${r.email}</span>
            <span class="appr-tag"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="10" height="10"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>${r.college}</span>
            <span style="color:var(--faint);font-size:11px">Requested ${r.requestedAt}</span>
          </div>
        </div>
        <div style="display:flex;gap:7px;align-items:center">
          <span class="status-pill ${r.status === 'approved' ? 'sp-approved' : r.status === 'denied' ? 'sp-denied' : 'sp-pending'}">${r.status === 'approved' ? '✓ Approved' : r.status === 'denied' ? '✗ Denied' : '⏳ Pending'}</span>
          ${r.status !== 'approved' ? `<button class="acc-btn acc-btn-approve" onclick="setApprovalStatus('faculty','${r.id}','approved')">Approve</button>` : ''}
          ${r.status === 'approved' ? `<button class="acc-btn acc-btn-revoke" onclick="setApprovalStatus('faculty','${r.id}','pending')">Revoke</button>` : ''}
          ${r.status !== 'denied' ? `<button class="acc-btn acc-btn-deny" onclick="setApprovalStatus('faculty','${r.id}','denied')">Deny</button>` : ''}
        </div>
      </div>`;
    });
  });
  el.innerHTML = html;
}

function buildCadminApprovalList() {
  const el = document.getElementById('admin-cadmin-approvals-body');
  if (!allCollegeAdminRequests.length) {
    el.innerHTML = '<div class="appr-empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="40" height="40"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg><div>No College Admin requests yet</div></div>';
    return;
  }
  const grouped = { pending: [], approved: [], denied: [] };
  allCollegeAdminRequests.forEach(r => grouped[r.status].push(r));
  let html = '';
  [['pending', '⏳ Pending Approval', 'var(--amber)'], ['approved', '✓ Approved', 'var(--green)'], ['denied', '✗ Denied', 'var(--red)']].forEach(([status, label, color]) => {
    if (!grouped[status].length) return;
    html += `<div class="appr-section-hdr"><span style="color:${color};font-weight:700">${label}</span><span>${grouped[status].length} college admin${grouped[status].length > 1 ? 's' : ''}</span></div>`;
    grouped[status].forEach(r => {
      const initials = r.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
      html += `<div class="appr-row">
        <div class="appr-avatar cadm">${initials}</div>
        <div style="flex:1">
          <div class="appr-name">${r.name}</div>
          <div class="appr-meta">
            <span class="appr-tag"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="10" height="10"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>${r.adminId}</span>
            <span class="appr-tag" style="background:var(--accent-l);color:var(--accent);border-color:rgba(27,111,230,.18)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="10" height="10"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>${r.college}</span>
            <span style="color:var(--faint);font-size:11px">Requested ${r.requestedAt}</span>
          </div>
        </div>
        <div style="display:flex;gap:7px;align-items:center">
          <span class="status-pill ${r.status === 'approved' ? 'sp-approved' : r.status === 'denied' ? 'sp-denied' : 'sp-pending'}">${r.status === 'approved' ? '✓ Approved' : r.status === 'denied' ? '✗ Denied' : '⏳ Pending'}</span>
          ${r.status !== 'approved' ? `<button class="acc-btn acc-btn-approve" onclick="setApprovalStatus('cadmin','${r.id}','approved')">Approve</button>` : ''}
          ${r.status === 'approved' ? `<button class="acc-btn acc-btn-revoke" onclick="setApprovalStatus('cadmin','${r.id}','pending')">Revoke</button>` : ''}
          ${r.status !== 'denied' ? `<button class="acc-btn acc-btn-deny" onclick="setApprovalStatus('cadmin','${r.id}','denied')">Deny</button>` : ''}
        </div>
      </div>`;
    });
  });
  el.innerHTML = html;
}

async function setApprovalStatus(type, id, newStatus) {
  let name = '';
  if (type === 'faculty') {
    const r = allFacultyRequests.find(r => r.id === id);
    if (r) { r.status = newStatus; name = r.name; }
    // Sync to backend
    apiPost('/admin/approvals/faculty/' + id, { status: newStatus });
    buildFacultyApprovalList();
  } else {
    const r = allCollegeAdminRequests.find(r => r.id === id);
    if (r) { r.status = newStatus; name = r.name; }
    // Sync to backend
    apiPost('/admin/approvals/faculty/' + id, { status: newStatus });
    buildCadminApprovalList();
  }
  updateApprovalsBadge();
  const msgs = { approved: '✓ Access granted to ' + name, pending: 'Access revoked for ' + name, denied: '✗ Access denied for ' + name };
  showToast(msgs[newStatus] || 'Status updated');
  const pF = allFacultyRequests.filter(r => r.status === 'pending').length;
  const pC = allCollegeAdminRequests.filter(r => r.status === 'pending').length;
  const aF = allFacultyRequests.filter(r => r.status === 'approved').length;
  const aC = allCollegeAdminRequests.filter(r => r.status === 'approved').length;
  document.getElementById('approvals-summary').innerHTML = `
    <span style="background:var(--amber-l);color:var(--amber);border:1px solid rgba(245,158,11,.22);border-radius:20px;padding:4px 12px;font-size:11px;font-weight:700">${pF + pC} Pending</span>
    <span style="background:var(--green-l);color:var(--green);border:1px solid rgba(14,159,110,.22);border-radius:20px;padding:4px 12px;font-size:11px;font-weight:700">${aF + aC} Approved</span>`;
}

async function approveAllPending(type) {
  if (type === 'faculty') {
    const pending = allFacultyRequests.filter(r => r.status === 'pending');
    for (const r of pending) {
      r.status = 'approved';
      apiPost('/admin/approvals/faculty/' + r.id, { status: 'approved' });
    }
    buildFacultyApprovalList();
    showToast('All pending faculty requests approved!');
  } else {
    const pending = allCollegeAdminRequests.filter(r => r.status === 'pending');
    for (const r of pending) {
      r.status = 'approved';
      apiPost('/admin/approvals/faculty/' + r.id, { status: 'approved' });
    }
    buildCadminApprovalList();
    showToast('All pending College Admin requests approved!');
  }
  updateApprovalsBadge();
}

function updateAdminPendingBadge() {
  const pending = facultyBatches.flatMap(b => b.students).filter(s => s.status === 'pending').length;
  const badge = document.getElementById('admin-pending-badge');
  if (badge) badge.textContent = pending;
}

function buildAdminStudents() {
  updateAdminPendingBadge();
  const container = document.getElementById('admin-students-body');
  if (!container) return;

  // Summary pills - include approved students from faculty submissions
  const all = facultyBatches.flatMap(b => b.students);
  const pending = all.filter(s => s.status === 'pending').length;
  const approved = all.filter(s => s.status === 'approved').length;
  const denied = all.filter(s => s.status === 'denied').length;
  const approvedFromFaculty = Object.keys(approvedStudents).length;

  document.getElementById('admin-stu-summary').innerHTML = `
    <span style="background:var(--amber-l);color:var(--amber);border:1px solid rgba(245,158,11,.22);border-radius:20px;padding:4px 12px;font-size:11px;font-weight:700">${pending} Pending</span>
    <span style="background:var(--green-l);color:var(--green);border:1px solid rgba(14,159,110,.22);border-radius:20px;padding:4px 12px;font-size:11px;font-weight:700">${approved} Approved</span>
    <span style="background:var(--teal-l);color:var(--teal);border:1px solid rgba(13,148,136,.22);border-radius:20px;padding:4px 12px;font-size:11px;font-weight:700">${approvedFromFaculty} Approved Students</span>
    <span style="background:var(--red-l);color:var(--red);border:1px solid rgba(239,68,68,.22);border-radius:20px;padding:4px 12px;font-size:11px;font-weight:700">${denied} Denied</span>`;

  // Create tabs for different views
  let html = `
    <div style="display:flex;border-bottom:1px solid var(--border);background:var(--surface2);overflow-x:auto">
      <button onclick="switchStudentView('approved')" class="student-tab active" id="tab-approved" style="flex:1;min-width:200px;padding:12px;border:none;background:none;cursor:pointer;font-weight:600;color:var(--text);border-bottom:2px solid var(--accent);white-space:nowrap">
        ✓ Approved Students (${approvedFromFaculty})
      </button>
      <button onclick="switchStudentView('pending')" class="student-tab" id="tab-pending" style="flex:1;min-width:200px;padding:12px;border:none;background:none;cursor:pointer;font-weight:600;color:var(--muted);border-bottom:2px solid transparent;white-space:nowrap">
        ⏳ Faculty Registrations (${pending})
      </button>
      <button onclick="switchStudentView('rejected')" class="student-tab" id="tab-rejected" style="flex:1;min-width:200px;padding:12px;border:none;background:none;cursor:pointer;font-weight:600;color:var(--muted);border-bottom:2px solid transparent;white-space:nowrap">
        ✗ Denied (${denied})
      </button>
    </div>
    <div id="student-view-content"></div>
  `;

  container.innerHTML = html;

  // Show approved by default
  showStudentView('approved');
}

function switchStudentView(view) {
  // Update tab styling
  ['approved', 'pending', 'rejected'].forEach(v => {
    const tab = document.getElementById(`tab-${v}`);
    if (tab) {
      tab.style.color = view === v ? 'var(--text)' : 'var(--muted)';
      tab.style.borderBottomColor = view === v ? 'var(--accent)' : 'transparent';
    }
  });

  showStudentView(view);
}

function showStudentView(view) {
  const contentDiv = document.getElementById('student-view-content');
  let html = '';

  if (view === 'approved') {
    // Show all approved students from faculty submissions
    const approvedCount = Object.keys(approvedStudents).length;

    if (approvedCount === 0) {
      html = `<div class="empty-state" style="padding:48px;text-align:center">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="48" height="48" style="opacity:0.3;margin:0 auto;display:block">
          <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
        <div style="margin-top:12px;font-size:14px;font-weight:600">No Approved Students Yet</div>
        <div style="font-size:12px;color:var(--muted);margin-top:6px">Students approved from faculty submissions will appear here</div>
      </div>`;
    } else {
      html += `
        <div style="padding:16px;background:var(--surface2);border-bottom:1px solid var(--border)">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
            <div>
              <div style="font-weight:700;font-size:14px;color:var(--text)">Approved Students with College Access</div>
              <div style="font-size:12px;color:var(--muted);margin-top:2px">Total: ${approvedCount} students</div>
            </div>
            <div style="padding:8px 12px;background:var(--green-l);color:var(--green);border-radius:20px;font-size:12px;font-weight:700">✓ Active Access</div>
          </div>
          
          <!-- 🔴 NEW: Filter Controls for College, Department, Year -->
          <div style="display:flex;gap:12px;flex-wrap:wrap;padding-top:12px;border-top:1px solid var(--border)">
            <div style="flex:1;min-width:200px">
              <label style="display:block;font-size:10px;font-weight:600;color:var(--muted);margin-bottom:4px;text-transform:uppercase">College</label>
              <select id="filter-student-college" onchange="filterApprovedStudents()" style="width:100%;padding:8px 10px;border:1.5px solid var(--border);border-radius:var(--r2);font-size:12px;color:var(--text);background:var(--surface)">
                <option value="">All Colleges</option>
                <option value="SKASC">SKASC</option>
                <option value="KCW">KCW</option>
                <option value="NIRMALA COLLEGE FOR WOMEN">NIRMALA COLLEGE FOR WOMEN</option>
              </select>
            </div>
            <div style="flex:1;min-width:200px">
              <label style="display:block;font-size:10px;font-weight:600;color:var(--muted);margin-bottom:4px;text-transform:uppercase">Department</label>
              <select id="filter-student-dept" onchange="filterApprovedStudents()" style="width:100%;padding:8px 10px;border:1.5px solid var(--border);border-radius:var(--r2);font-size:12px;color:var(--text);background:var(--surface)">
                <option value="">All Departments</option>
                <option value="CSE">CSE</option>
                <option value="ECE">ECE</option>
                <option value="Mechanical">Mechanical</option>
                <option value="Civil">Civil</option>
                <option value="EEE">EEE</option>
                <option value="Chemical">Chemical</option>
              </select>
            </div>
            <div style="flex:1;min-width:200px">
              <label style="display:block;font-size:10px;font-weight:600;color:var(--muted);margin-bottom:4px;text-transform:uppercase">Year</label>
              <select id="filter-student-year" onchange="filterApprovedStudents()" style="width:100%;padding:8px 10px;border:1.5px solid var(--border);border-radius:var(--r2);font-size:12px;color:var(--text);background:var(--surface)">
                <option value="">All Years</option>
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
              </select>
            </div>
          </div>
        </div>
      `;

      // Group by department if available
      const grouped = {};
      for (const [rollNo, studentData] of Object.entries(approvedStudents)) {
        const dept = studentData.department || 'Other';
        if (!grouped[dept]) grouped[dept] = [];
        grouped[dept].push({ rollNo, ...studentData });
      }

      // Display by department
      for (const [dept, students] of Object.entries(grouped)) {
        html += `<div class="adm-section-hdr">
          <span style="display:flex;align-items:center;gap:8px">
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--green)" stroke-width="2" width="13" height="13">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            Department: ${dept || 'Not Specified'}
          </span>
          <span>${students.length} students</span>
        </div>`;

        students.forEach(student => {
          const initials = student.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
          html += `<div class="adm-student-row" style="background:linear-gradient(90deg, rgba(14,159,110,0.05), transparent)">
            <div class="adm-stav" style="background:linear-gradient(135deg,var(--green),#14B97F);border:2px solid var(--green-l);box-shadow:0 2px 8px rgba(14,159,110,0.15)">${initials}</div>
            <div style="flex:1">
              <div style="font-size:13px;font-weight:700;color:var(--text)">${student.name}</div>
              <div style="font-size:11px;color:var(--muted);display:flex;gap:12px;margin-top:4px">
                <span style="display:flex;align-items:center;gap:4px">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12">
                    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                  </svg>
                  <strong style="color:var(--text)">${student.rollNo}</strong>
                </span>
                <span style="display:flex;align-items:center;gap:4px">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12">
                    <circle cx="12" cy="12" r="1"/><path d="M12 7v5m0 5v.01"/>
                  </svg>
                  Approved: ${student.approvedAt}
                </span>
              </div>
            </div>
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
              <span class="status-pill sp-approved" style="background:var(--green-l);color:var(--green);border:1px solid rgba(14,159,110,.3)">✓ College Access</span>
            </div>
          </div>`;
        });
      }
    }
  } else if (view === 'pending') {
    // Show pending students from faculty registrations
    const all = facultyBatches.flatMap(b => b.students);
    const pendingStudents = all.filter(s => s.status === 'pending');

    if (pendingStudents.length === 0) {
      html = `<div class="empty-state" style="padding:48px;text-align:center">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="48" height="48" style="opacity:0.3;margin:0 auto;display:block">
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
        </svg>
        <div style="margin-top:12px;font-size:14px;font-weight:600">No Pending Registrations</div>
        <div style="font-size:12px;color:var(--muted);margin-top:6px">Faculty registrations awaiting approval will appear here</div>
      </div>`;
    } else {
      html += `
        <div style="padding:16px;background:var(--surface2);border-bottom:1px solid var(--border)">
          <div style="display:flex;align-items:center;justify-content:space-between">
            <div>
              <div style="font-weight:700;font-size:14px;color:var(--text)">Faculty Registrations Pending Approval</div>
              <div style="font-size:12px;color:var(--muted);margin-top:2px">Total: ${pendingStudents.length} students</div>
            </div>
            <div style="padding:8px 12px;background:var(--amber-l);color:var(--amber);border-radius:20px;font-size:12px;font-weight:700">⏳ Awaiting Action</div>
          </div>
        </div>
      `;

      for (const batch of facultyBatches) {
        const batchPending = batch.students.filter(s => s.status === 'pending');
        if (!batchPending.length) continue;

        html += `<div class="adm-section-hdr">
          <span style="display:flex;align-items:center;gap:8px">
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--teal)" stroke-width="2" width="13" height="13"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>
            ${batch.name} <span style="opacity:.65;font-weight:400">· ${batch.dept}</span>
          </span>
          <span>Faculty: <strong>${batch.faculty}</strong> · ${batchPending.length} students</span>
        </div>`;

        for (const s of batchPending) {
          const initials = s.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
          html += `<div class="adm-student-row">
            <div class="adm-stav">${initials}</div>
            <div style="flex:1">
              <div style="font-size:13px;font-weight:600;color:var(--text)">${s.name}</div>
              <div style="font-size:11px;color:var(--muted);display:flex;gap:7px;margin-top:2px">
                <span class="adm-batch-tag">${batch.name}</span>
                <span>${s.roll}</span>
                <span>·</span>
                <span>${s.year}</span>
              </div>
            </div>
            <div style="display:flex;align-items:center;gap:8px">
              <span class="status-pill sp-pending">⏳ Pending</span>
              <button class="acc-btn acc-btn-approve" onclick="adminSetStudentStatus('${s.id}','approved')">Approve</button>
              <button class="acc-btn acc-btn-deny" onclick="adminSetStudentStatus('${s.id}','denied')">Deny</button>
            </div>
          </div>`;
        }
      }
    }
  } else if (view === 'rejected') {
    // Show denied students
    const all = facultyBatches.flatMap(b => b.students);
    const deniedStudents = all.filter(s => s.status === 'denied');

    if (deniedStudents.length === 0) {
      html = `<div class="empty-state" style="padding:48px;text-align:center">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="48" height="48" style="opacity:0.3;margin:0 auto;display:block">
          <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
        </svg>
        <div style="margin-top:12px;font-size:14px;font-weight:600">No Denied Students</div>
        <div style="font-size:12px;color:var(--muted);margin-top:6px">Students with denied access will appear here</div>
      </div>`;
    } else {
      html += `
        <div style="padding:16px;background:var(--surface2);border-bottom:1px solid var(--border)">
          <div style="display:flex;align-items:center;justify-content:space-between">
            <div>
              <div style="font-weight:700;font-size:14px;color:var(--text)">Denied Registrations</div>
              <div style="font-size:12px;color:var(--muted);margin-top:2px">Total: ${deniedStudents.length} students</div>
            </div>
            <div style="padding:8px 12px;background:var(--red-l);color:var(--red);border-radius:20px;font-size:12px;font-weight:700">✗ Access Denied</div>
          </div>
        </div>
      `;

      for (const batch of facultyBatches) {
        const batchDenied = batch.students.filter(s => s.status === 'denied');
        if (!batchDenied.length) continue;

        html += `<div class="adm-section-hdr">
          <span style="display:flex;align-items:center;gap:8px">
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--red)" stroke-width="2" width="13" height="13"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>
            ${batch.name} <span style="opacity:.65;font-weight:400">· ${batch.dept}</span>
          </span>
          <span>Faculty: <strong>${batch.faculty}</strong> · ${batchDenied.length} students</span>
        </div>`;

        for (const s of batchDenied) {
          const initials = s.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
          html += `<div class="adm-student-row" style="opacity:0.7">
            <div class="adm-stav" style="background:var(--red)">${initials}</div>
            <div style="flex:1">
              <div style="font-size:13px;font-weight:600;color:var(--text)">${s.name}</div>
              <div style="font-size:11px;color:var(--muted);display:flex;gap:7px;margin-top:2px">
                <span class="adm-batch-tag">${batch.name}</span>
                <span>${s.roll}</span>
                <span>·</span>
                <span>${s.year}</span>
              </div>
            </div>
            <div style="display:flex;align-items:center;gap:8px">
              <span class="status-pill sp-denied">✗ Denied</span>
              <button class="acc-btn acc-btn-approve" onclick="adminSetStudentStatus('${s.id}','approved')">Approve</button>
            </div>
          </div>`;
        }
      }
    }
  }

  contentDiv.innerHTML = html;
}

// 🔴 NEW: Filter function for approved students by college, department, year
function filterApprovedStudents() {
  const college = document.getElementById('filter-student-college')?.value || '';
  const dept = document.getElementById('filter-student-dept')?.value || '';
  const year = document.getElementById('filter-student-year')?.value || '';

  const contentDiv = document.getElementById('student-view-content');
  const approvedCount = Object.keys(approvedStudents).length;

  if (approvedCount === 0) {
    contentDiv.innerHTML = `<div class="empty-state" style="padding:48px;text-align:center">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="48" height="48" style="opacity:0.3;margin:0 auto;display:block">
        <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
      </svg>
      <div style="margin-top:12px;font-size:14px;font-weight:600">No Approved Students Yet</div>
      <div style="font-size:12px;color:var(--muted);margin-top:6px">Students approved from faculty submissions will appear here</div>
    </div>`;
    return;
  }

  // Filter students based on selected criteria
  const filtered = Object.entries(approvedStudents).filter(([rollNo, studentData]) => {
    const matchCollege = !college || studentData.college === college;
    const matchDept = !dept || studentData.department === dept;
    const matchYear = !year || String(studentData.year) === year;
    return matchCollege && matchDept && matchYear;
  });

  if (filtered.length === 0) {
    contentDiv.innerHTML = `<div class="empty-state" style="padding:48px;text-align:center">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="48" height="48" style="opacity:0.3;margin:0 auto;display:block">
        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
      </svg>
      <div style="margin-top:12px;font-size:14px;font-weight:600">No Students Found</div>
      <div style="font-size:12px;color:var(--muted);margin-top:6px">Try adjusting your filters</div>
    </div>`;
    return;
  }

  let html = '';

  // Group filtered students by department
  const grouped = {};
  filtered.forEach(([rollNo, studentData]) => {
    const deptKey = studentData.department || 'Other';
    if (!grouped[deptKey]) grouped[deptKey] = [];
    grouped[deptKey].push({ rollNo, ...studentData });
  });

  // Display by department
  for (const [deptKey, students] of Object.entries(grouped)) {
    html += `<div class="adm-section-hdr">
      <span style="display:flex;align-items:center;gap:8px">
        <svg viewBox="0 0 24 24" fill="none" stroke="var(--green)" stroke-width="2" width="13" height="13">
          <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
        Department: ${deptKey || 'Not Specified'}
      </span>
      <span>${students.length} students</span>
    </div>`;

    students.forEach(student => {
      const initials = student.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
      html += `<div class="adm-student-row" style="background:linear-gradient(90deg, rgba(14,159,110,0.05), transparent)">
        <div class="adm-stav" style="background:linear-gradient(135deg,var(--green),#14B97F);border:2px solid var(--green-l);box-shadow:0 2px 8px rgba(14,159,110,0.15)">${initials}</div>
        <div style="flex:1">
          <div style="font-size:13px;font-weight:700;color:var(--text)">${student.name}</div>
          <div style="font-size:11px;color:var(--muted);display:flex;gap:12px;margin-top:4px">
            <span style="display:flex;align-items:center;gap:4px">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
              </svg>
              <strong style="color:var(--text)">${student.rollNo}</strong>
            </span>
            <span style="display:flex;align-items:center;gap:4px">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12">
                <circle cx="12" cy="12" r="1"/><path d="M12 7v5m0 5v.01"/>
              </svg>
              Approved: ${student.approvedAt}
            </span>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          <span class="status-pill sp-approved" style="background:var(--green-l);color:var(--green);border:1px solid rgba(14,159,110,.3)">✓ College Access</span>
        </div>
      </div>`;
    });
  }

  contentDiv.innerHTML = html;
}

async function adminSetStudentStatus(sid, newStatus) {
  let studentName = '';
  for (const b of facultyBatches) {
    const s = b.students.find(st => st.id === sid);
    if (s) { s.status = newStatus; studentName = s.name; break; }
  }
  // Sync to backend
  apiPost('/admin/students/' + sid + '/status', { status: newStatus });
  buildAdminStudents();
  const msgs = { approved: '✓ Access granted to ' + studentName, pending: 'Access revoked for ' + studentName, denied: '✗ Access denied for ' + studentName };
  showToast(msgs[newStatus] || 'Status updated');
}

// ════════ NAV ════════

function doLogout() {
  localStorage.removeItem('skilloUser');
  window.location.href = 'index.html';
}

function ss(id, navId) {
  const dbg = document.getElementById('cadm-debug-status'); if (dbg) dbg.textContent = '[NAV] Switched to ' + id + ' | engine: ' + (typeof buildCollegeDB);
  if (typeof localPersistentState !== 'undefined') localPersistentState.activeScreen = id;

  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const sc = document.getElementById('screen-' + id);
  if (sc) sc.classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const nv = document.getElementById(navId);
  if (nv) nv.classList.add('active');
  // Module initialization wiring
  if (id === 'mnc') buildMNCGrid();
  if (id === 'iv') buildJobGrid();
  if (id === 'tests') {
    if (typeof loadScheduledTests === 'function') loadScheduledTests();
  }

  // Admin/Contextual initializations
  if (id === 'admin') { setTimeout(buildAdminCharts, 80); setTimeout(loadAIMetrics, 400); }
  if (id === 'practice') setTimeout(buildPracticeCharts, 80);
  if (id === 'admin-col') buildAdminCols();
  if (id === 'admin-students') buildAdminStudents();
  if (id === 'admin-approvals') buildAdminApprovals();
  if (id === 'hr-analytics') buildHRAnalytics();
  if (id === 'profile') { renderPTab(state.ptab, null); setTimeout(generateAIProfileSummary, 500); }

  // 🏛️ INSTITUTIONAL INITIALIZATIONS
  if (id === 'fac-upload') { if (typeof resetFacultyUpload === 'function') resetFacultyUpload(); }
  if (id === 'fac-history') { if (typeof loadFacultyHistory === 'function') loadFacultyHistory(); }
  if (id === 'fac-tracker') { if (typeof loadFacultyTracker === 'function') loadFacultyTracker(); }
  if (id === 'cadm-dash' || id === 'cadm-db' || id === 'cadm-cycle' || id === 'cadm-assess') {
    if (id === 'cadm-dash' && typeof loadCollegeAdminDashboard === 'function') loadCollegeAdminDashboard();
    if (id === 'cadm-assess' && typeof loadAdminAssessments === 'function') loadAdminAssessments();
    if (typeof startDashboardSync === 'function') startDashboardSync();
  } else {
    if (typeof stopDashboardSync === 'function') stopDashboardSync();
  }

  // Settings initialization
  if (id === 'settings' || id === 'hr-settings' || id === 'inst-settings') {
    initSettings();
  }
}

// ════════ SETTINGS LOGIC ════════

function initSettings() {
  const isInst = !!document.getElementById('screen-settings') && !!document.querySelector('.sv3-container');
  const isHR = !!document.getElementById('screen-hr-settings');

  // Prefix handling for multi-portal support
  const prefix = isInst ? 'sv3' : (isHR ? 'hr' : 'st');

  // Populate fields
  const fieldMapping = {
    [`${prefix}-field-name`]: currentUser.name,
    [`${prefix}-field-email`]: currentUser.email,
    [`${prefix}-field-bio`]: currentUser.bio,
    [`${prefix}-field-github`]: currentUser.github,
    [`${prefix}-field-portfolio`]: currentUser.portfolio,
    [`${prefix}-field-linkedin`]: currentUser.linkedin,
    [`${prefix}-field-company`]: currentUser.company,
    [`${prefix}-field-role`]: currentUser.role || (isInst ? 'Institutional Admin' : '')
  };

  for (const [id, val] of Object.entries(fieldMapping)) {
    const el = document.getElementById(id);
    if (el) el.value = val || '';
  }

  // Set avatar preview
  const preview = document.getElementById(`${prefix}-avatar-preview`);
  const initial = document.getElementById(`${prefix}-avatar-initials`);
  const img = document.getElementById(`${prefix}-avatar-img`);

  if (preview && initial) {
    if (currentUser.avatar) {
      if (img) {
        img.src = currentUser.avatar;
        img.style.display = 'block';
      }
      initial.style.display = 'none';
      preview.style.background = isInst ? `url(${currentUser.avatar}) center/cover` : 'none';
    } else {
      if (img) img.style.display = 'none';
      initial.style.display = 'flex';
      initial.textContent = (currentUser.initials || currentUser.name?.[0] || 'U').toUpperCase();
    }
  }

  // Sync display names in UI
  const displayNames = document.querySelectorAll(`#${prefix}-display-name`);
  displayNames.forEach(el => el.textContent = currentUser.name || 'User');

  const displayRoles = document.querySelectorAll(`#${prefix}-display-role`);
  displayRoles.forEach(el => el.textContent = currentUser.role || (isInst ? 'Institutional Admin' : 'Learner'));

  // Render Badges
  renderSettingsBadges();

  // Update profile health
  updateProfileHealth();

  // Set initial tab
  const activeBtn = document.querySelector('.sv3-nav-btn.active, .settings-nav-btn.active');
  if (activeBtn) {
    const onclickStr = activeBtn.getAttribute('onclick');
    const match = onclickStr.match(/'([^']+)'/);
    if (match) {
      if (onclickStr.includes('switchSettingsTab')) switchSettingsTab(match[1], activeBtn);
      else st(match[1], activeBtn);
    }
  }
}

/** 
 * v3 Tab Switcher (Institutional/Standardized)
 */
function switchSettingsTab(tabId, btn) {
  // Hide all contents
  document.querySelectorAll('.sv3-tab-content').forEach(c => c.classList.remove('active'));

  // Show target
  const target = document.getElementById(`sv3-tab-${tabId}`);
  if (target) target.classList.add('active');

  // Update buttons
  if (btn) {
    const nav = btn.closest('.sv3-nav');
    if (nav) nav.querySelectorAll('.sv3-nav-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  }
}

/** 
 * Creative Settings Tab Switcher 
 */
function st(pane, btn) {
  // Hide all panes with "Liquid" exit (supporting both legacy and v3 classes)
  document.querySelectorAll('.settings-pane, .sv3-pane').forEach(p => {
    p.classList.remove('active');
  });

  // Show target pane with "Liquid" entrance
  const target = document.getElementById(`pane-${pane}`);
  if (target) {
    target.classList.add('active');
  }

  // Update nav buttons
  if (btn) {
    const nav = btn.closest('.settings-nav-card');
    if (nav) {
      nav.querySelectorAll('.settings-nav-btn').forEach(b => b.classList.remove('active'));
    }
    btn.classList.add('active');
  }
}

/**
 * Calculates Profile Completion / Health 
 */
function updateProfileHealth() {
  const isInst = !!document.querySelector('.sv3-container');
  const p = isInst ? 'sv3' : 'st';

  const fields = [`${p}-field-name`, `${p}-field-bio`, `${p}-field-github`, `${p}-field-linkedin`];
  let filled = 0;
  fields.forEach(f => {
    if (document.getElementById(f)?.value.trim()) filled++;
  });

  if (currentUser.avatar) filled++;

  const total = fields.length + 1;
  const pct = Math.round((filled / total) * 100);

  const valEl = document.getElementById(`${p}-completion-val`) || document.getElementById('sv3-health-val');
  const lblEl = document.getElementById(`${p}-completion-lbl`);
  const fillEl = document.querySelector('.sv3-health-fill');

  if (valEl) valEl.textContent = `${pct}%`;
  if (fillEl) fillEl.style.width = `${pct}%`;
  if (lblEl) {
    const prevText = lblEl.textContent;
    if (pct < 40) lblEl.textContent = 'Beginner Profile';
    else if (pct < 70) lblEl.textContent = 'Almost Ready!';
    else if (pct < 100) lblEl.textContent = 'Professional Rank';
    else {
      lblEl.textContent = 'Elite Profile';
      if (prevText !== 'Elite Profile') fireConfetti();
    }
  }
}

/**
 * Extreme Celebration: Confetti Cannon 
 */
function fireConfetti() {
  const colors = ['#1B6FE6', '#0D9488', '#F59E0B', '#EF4444', '#6C5CE7'];
  for (let i = 0; i < 50; i++) {
    const p = document.createElement('div');
    p.className = 'celebration-particle';
    const color = colors[Math.floor(Math.random() * colors.length)];
    p.style.background = color;
    p.style.width = Math.random() * 8 + 4 + 'px';
    p.style.height = p.style.width;
    p.style.left = Math.random() * 100 + 'vw';
    p.style.top = '100vh';

    const dx = (Math.random() - 0.5) * 400;
    const dy = -Math.random() * 600 - 200;
    const dr = Math.random() * 360;

    p.style.setProperty('--dx', `${dx}px`);
    p.style.setProperty('--dy', `${dy}px`);
    p.style.setProperty('--dr', `${dr}deg`);

    document.body.appendChild(p);
    setTimeout(() => p.remove(), 2000);
  }
  showToast('🎉 Profile 100% Complete! Achievement Unlocked.');
}

/**
 * Creative Badge Rendering
 */
function renderSettingsBadges() {
  const grid = document.getElementById('st-badges-grid');
  if (!grid) return;

  const badges = currentUser.badges || ['Core Explorer', 'Consistency King', 'High Achiever'];

  if (badges.length === 0) {
    grid.innerHTML = '<div style="color:var(--muted);font-size:12px;grid-column:1/-1;text-align:center;padding:20px">No badges earned yet.</div>';
    return;
  }

  const rarityMap = {
    'Core Explorer': 'bronze',
    'Consistency King': 'silver',
    'High Achiever': 'gold'
  };

  grid.innerHTML = badges.map(b => {
    const rarity = rarityMap[b] || 'bronze';
    return `
    <div class="vault-badge vault-rarity-${rarity} creative-tilt-card">
      <div class="badge-icon-wrap">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22">
          <circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>
        </svg>
      </div>
      <div class="badge-name">${b}</div>
    </div>`;
  }).join('');
}

function handleAvatarUpload(input) {
  const file = input.files[0];
  if (!file) return;

  if (file.size > 1024 * 1024) {
    showToast('Image too large. Max 1MB allowed.');
    return;
  }

  const reader = new FileReader();
  reader.onload = function (e) {
    const base64 = e.target.result;
    currentUser.avatar = base64;

    // Update all relevant previews
    const prefixes = ['st', 'hr', 'inst'];
    prefixes.forEach(p => {
      const img = document.getElementById(`${p}-avatar-img`);
      const init = document.getElementById(`${p}-avatar-initials`);
      const prev = document.getElementById(`${p}-avatar-preview`);
      if (img) { img.src = base64; img.style.display = 'block'; }
      if (init) init.style.display = 'none';
      if (prev) prev.style.background = 'none';
    });

    updateProfileHealth();
    showToast('Avatar updated!');
  };
  reader.readAsDataURL(file);
}

async function saveUserSettings() {
  const isInst = !!document.querySelector('.sv3-container');
  const p = isInst ? 'sv3' : 'st';

  const name = document.getElementById(`${p}-field-name`)?.value.trim();
  const bio = document.getElementById(`${p}-field-bio`)?.value.trim();
  const github = document.getElementById(`${p}-field-github`)?.value.trim();
  const portfolio = document.getElementById(`${p}-field-portfolio`)?.value.trim();
  const linkedin = document.getElementById(`${p}-field-linkedin`)?.value.trim();
  const company = document.getElementById(`${p}-field-company`)?.value.trim();
  const role = document.getElementById(`${p}-field-role`)?.value.trim();
  const newPass = document.getElementById(`${p}-field-newpass`)?.value.trim();

  if (name) currentUser.name = name;
  if (bio !== undefined) currentUser.bio = bio;
  if (github !== undefined) currentUser.github = github;
  if (portfolio !== undefined) currentUser.portfolio = portfolio;
  if (linkedin !== undefined) currentUser.linkedin = linkedin;
  if (company !== undefined) currentUser.company = company;
  if (role !== undefined) currentUser.role = role;

  // Recalculate initials
  if (name) {
    currentUser.initials = name.split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase();
  }

  // Handle password change if provided
  if (newPass) {
    showToast('Updating security settings...');
    try {
      const res = await apiPost('/auth/change-password', { newPassword: newPass });
      if (res.success) showToast('Password updated successfully!');
    } catch (e) {
      console.warn('Password change API failed, simulating local success');
      showToast('Security settings updated locally');
    }
    const field = document.getElementById(`${p}-field-newpass`);
    if (field) field.value = '';
    const pwSection = document.querySelector('.settings-pw-section, .sv3-tab-content');
    if (pwSection) pwSection.classList.remove('open');
  }

  saveSkilloUser();
  refreshUI();
  showToast('Settings saved successfully!');
}

function togglePassView(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.type = el.type === 'password' ? 'text' : 'password';
}

function saveSkilloUser() {
  localStorage.setItem('skilloUser', JSON.stringify(currentUser));
}

function loadSkilloUser() {
  const stored = localStorage.getItem('skilloUser');
  if (stored) {
    try {
      const data = JSON.parse(stored);
      Object.assign(currentUser, data);
      refreshUI();
    } catch (e) {
      console.error('Error loading stored user:', e);
    }
  }
}

// Initialize on load
window.addEventListener('DOMContentLoaded', loadSkilloUser);

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('collapsed');
  const c = document.getElementById('sidebar').classList.contains('collapsed');
  document.getElementById('col-ico').innerHTML = c ? '<polyline points="9,18 15,12 9,6"/>' : '<polyline points="15,18 9,12 15,6"/>';
  document.getElementById('col-lbl').textContent = c ? 'Expand' : 'Collapse';
}



// ════════ STUDENT PROFILE MODAL ════════
const studentProfiles = {
  'Rajesh K.': {
    av: 'RK', meta: '4th Year · PSG College · Full Stack Developer',
    badges: ['Expert — Full Stack', 'Top 3% National'],
    dept: 'CSE-A 2024', college: 'PSG College of Technology',
    aptScore: 97, ivScore: 91,
    subjects: [{ s: 'Logical', v: 27, max: 30, c: '#1B6FE6' }, { s: 'Quantitative', v: 25, max: 30, c: '#0D9488' }, { s: 'Verbal', v: 14, max: 15, c: '#6C5CE7' }, { s: 'Data Interp.', v: 12, max: 15, c: '#F59E0B' }],
    accuracy: [{ s: 'Logical', v: 96, c: '#1B6FE6' }, { s: 'Verbal', v: 91, c: '#4A90F5' }, { s: 'Quant', v: 88, c: '#0D9488' }, { s: 'DI', v: 82, c: '#6C5CE7' }],
    trend: [82, 85, 88, 91, 93, 97], trendDir: 'up', trendDelta: '+15 pts over 6 sessions',
    stats: [{ l: 'Sessions (Full Stack)', v: '20' }, { l: 'Avg Interview Score', v: '91/100' }, { l: 'Day Streak', v: '18 days' }, { l: 'Tests Completed', v: '12' }]
  },
  'Priya M.': {
    av: 'PM', meta: '4th Year · Anna University · Full Stack Developer',
    badges: ['Expert — Full Stack', 'Top 5% National'],
    dept: 'CS-A 2024', college: 'Anna University',
    aptScore: 94, ivScore: 88,
    subjects: [{ s: 'Logical', v: 28, max: 30, c: '#1B6FE6' }, { s: 'Quantitative', v: 25, max: 30, c: '#0D9488' }, { s: 'Verbal', v: 14, max: 15, c: '#6C5CE7' }, { s: 'Data Interp.', v: 12, max: 15, c: '#F59E0B' }],
    accuracy: [{ s: 'Logical', v: 93, c: '#1B6FE6' }, { s: 'Verbal', v: 95, c: '#4A90F5' }, { s: 'Quant', v: 90, c: '#0D9488' }, { s: 'DI', v: 78, c: '#6C5CE7' }],
    trend: [76, 80, 82, 86, 89, 94], trendDir: 'up', trendDelta: '+18 pts over 6 sessions',
    stats: [{ l: 'Sessions (Full Stack)', v: '22' }, { l: 'Avg Interview Score', v: '88/100' }, { l: 'Day Streak', v: '12 days' }, { l: 'Tests Completed', v: '10' }]
  },
  'Sunita V.': {
    av: 'SV', meta: '3rd Year · VIT Vellore · Full Stack Developer',
    badges: ['Advanced — Full Stack', 'Top 8% National'],
    dept: 'CSE 2025', college: 'VIT Vellore',
    aptScore: 89, ivScore: 83,
    subjects: [{ s: 'Logical', v: 26, max: 30, c: '#1B6FE6' }, { s: 'Quantitative', v: 24, max: 30, c: '#0D9488' }, { s: 'Verbal', v: 13, max: 15, c: '#6C5CE7' }, { s: 'Data Interp.', v: 11, max: 15, c: '#F59E0B' }],
    accuracy: [{ s: 'Logical', v: 88, c: '#1B6FE6' }, { s: 'Verbal', v: 82, c: '#4A90F5' }, { s: 'Quant', v: 91, c: '#0D9488' }, { s: 'DI', v: 76, c: '#6C5CE7' }],
    trend: [70, 73, 76, 79, 82, 89], trendDir: 'up', trendDelta: '+19 pts over 6 sessions',
    stats: [{ l: 'Sessions (Full Stack)', v: '21' }, { l: 'Avg Interview Score', v: '83/100' }, { l: 'Day Streak', v: '9 days' }, { l: 'Tests Completed', v: '8' }]
  },
  'Arjun R.': {
    av: 'AR', meta: '3rd Year · PSG College · Full Stack Developer',
    badges: ['Proficient — Full Stack', '22-Day Streak'],
    dept: 'CSE-B 2025', college: 'PSG College of Technology',
    aptScore: 74, ivScore: 74,
    subjects: [{ s: 'Logical', v: 22, max: 30, c: '#1B6FE6' }, { s: 'Quantitative', v: 21, max: 30, c: '#0D9488' }, { s: 'Verbal', v: 10, max: 15, c: '#6C5CE7' }, { s: 'Data Interp.', v: 7, max: 15, c: '#EF4444' }],
    accuracy: [{ s: 'Logical', v: 92, c: '#1B6FE6' }, { s: 'Verbal', v: 88, c: '#4A90F5' }, { s: 'Quant', v: 79, c: '#0D9488' }, { s: 'DI', v: 61, c: '#EF4444' }],
    trend: [55, 60, 63, 67, 70, 74], trendDir: 'up', trendDelta: '+19 pts over 6 sessions',
    stats: [{ l: 'Sessions (Full Stack)', v: '14' }, { l: 'Avg Interview Score', v: '74/100' }, { l: 'Day Streak', v: '22 days' }, { l: 'Tests Completed', v: '4' }]
  },
  'Karthik S.': {
    av: 'KS', meta: '4th Year · PSG College · Full Stack Developer',
    badges: ['Advanced — Full Stack', 'Top 10% National'],
    dept: 'CSE-A 2024', college: 'PSG College of Technology',
    aptScore: 91, ivScore: 91,
    subjects: [{ s: 'Logical', v: 26, max: 30, c: '#1B6FE6' }, { s: 'Quantitative', v: 25, max: 30, c: '#0D9488' }, { s: 'Verbal', v: 13, max: 15, c: '#6C5CE7' }, { s: 'Data Interp.', v: 11, max: 15, c: '#F59E0B' }],
    accuracy: [{ s: 'Logical', v: 90, c: '#1B6FE6' }, { s: 'Verbal', v: 85, c: '#4A90F5' }, { s: 'Quant', v: 87, c: '#0D9488' }, { s: 'DI', v: 80, c: '#6C5CE7' }],
    trend: [74, 77, 80, 83, 87, 91], trendDir: 'up', trendDelta: '+17 pts over 6 sessions',
    stats: [{ l: 'Sessions (Full Stack)', v: '20' }, { l: 'Avg Interview Score', v: '91/100' }, { l: 'Day Streak', v: '15 days' }, { l: 'Tests Completed', v: '9' }]
  }
};

// Placement Readiness Engine
function computeReadiness(p) {
  const apt = p.aptScore || 0;
  const iv = p.ivScore || 0;
  const subTotal = p.subjects ? p.subjects.reduce((a, s) => a + s.v, 0) : 0;
  const subMax = p.subjects ? p.subjects.reduce((a, s) => a + s.max, 0) : 90;
  const subPct = Math.round(subTotal / subMax * 100);
  const trendBonus = p.trendDir === 'up' ? 5 : p.trendDir === 'down' ? -5 : 0;
  const score = Math.min(100, Math.round((apt * 0.4 + iv * 0.35 + subPct * 0.25) + trendBonus));

  let label, color, rec;
  if (score >= 85) {
    label = 'Highly Ready'; color = 'var(--green)';
    rec = `Strong aptitude (${apt}/100) and interview performance (${iv}/100). All subject scores above threshold. Trending ${p.trendDir === 'up' ? 'upward — consistency is excellent' : 'stable'}. Recommended for immediate outreach.`;
  } else if (score >= 70) {
    label = 'Ready'; color = 'var(--accent)';
    rec = `Good overall profile. Aptitude ${apt}/100, interview ${iv}/100. ${p.subjects?.find(s => s.v / s.max < 0.6) ? 'Weak area: ' + (p.subjects.find(s => s.v / s.max < 0.6)?.s) + ' — may need role-specific assessment.' : ''} Suitable for most entry-level roles.`;
  } else if (score >= 55) {
    label = 'Partially Ready'; color = 'var(--amber)';
    rec = `Aptitude ${apt}/100, interview ${iv}/100. Shows promise but subject scores indicate gaps. ${p.trendDir === 'up' ? 'Positive upward trend — candidate is improving.' : 'Score trend needs monitoring.'} Consider conditional offer or probation period.`;
  } else {
    label = 'Not Ready'; color = 'var(--red)';
    rec = `Below threshold scores (Apt: ${apt}/100, Interview: ${iv}/100). Multiple subject weaknesses detected. Not recommended for placement at this time. Advise further preparation.`;
  }
  return { score, label, color, rec };
}

let smPieChart = null, smLineChart = null;

function openStudentProfile(name) {
  const p = studentProfiles[name];
  if (!p) { showToast('Profile not found for ' + name); return; }
  const readiness = computeReadiness(p);
  const trendColor = p.trendDir === 'up' ? 'var(--green)' : p.trendDir === 'down' ? 'var(--red)' : 'var(--amber)';
  const trendIcon = p.trendDir === 'up' ? '↑' : '↓';

  document.getElementById('sm-av').textContent = p.av;
  document.getElementById('sm-name').textContent = name;
  document.getElementById('sm-meta').textContent = p.meta;
  const bd = document.getElementById('sm-badges');
  bd.innerHTML = p.badges.map(b => `<span style="background:rgba(255,255,255,.2);color:white;border:1px solid rgba(255,255,255,.3);padding:3px 10px;border-radius:20px;font-size:10.5px;font-weight:600">${b}</span>`).join('');

  // Enhanced stats with all 4 new data points
  document.getElementById('sm-stats').innerHTML = `
    <!-- Batch & Department -->
    <div style="padding:7px 0;border-bottom:1px solid var(--border)">
      <div style="font-size:10px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px">Batch & Department</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap">
        <span style="background:var(--accent-l);color:var(--accent);border:1px solid rgba(27,111,230,.18);border-radius:10px;padding:2px 9px;font-size:11px;font-weight:600">${p.dept}</span>
        <span style="background:var(--surface2);color:var(--muted);border:1px solid var(--border);border-radius:10px;padding:2px 9px;font-size:11px">${p.college}</span>
      </div>
    </div>
    <!-- Subject-wise Scores /90 -->
    <div style="padding:7px 0;border-bottom:1px solid var(--border)">
      <div style="font-size:10px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.5px;margin-bottom:7px">Subject Scores (out of 90)</div>
      ${(p.subjects || []).map(s => `
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:5px">
          <span style="font-size:11px;color:var(--muted);width:90px;flex-shrink:0">${s.s}</span>
          <div style="flex:1;height:6px;background:var(--surface3);border-radius:3px;overflow:hidden">
            <div style="height:100%;border-radius:3px;width:${Math.round(s.v / s.max * 100)}%;background:${s.c}"></div>
          </div>
          <span style="font-size:12px;font-weight:700;color:${s.c};min-width:36px;text-align:right">${s.v}/${s.max}</span>
        </div>`).join('')}
    </div>
    <!-- Score Trend -->
    <div style="padding:7px 0;border-bottom:1px solid var(--border)">
      <div style="font-size:10px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px">Score Trend</div>
      <div style="display:flex;align-items:center;gap:8px">
        <span style="font-size:13px;font-weight:800;color:${trendColor}">${trendIcon} ${p.trendDir === 'up' ? 'Improving' : 'Declining'}</span>
        <span style="font-size:11px;color:var(--muted)">${p.trendDelta}</span>
      </div>
    </div>
    <!-- Placement Readiness -->
    <div style="padding:7px 0">
      <div style="font-size:10px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px">Placement Readiness</div>
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:7px">
        <div style="font-family:'Playfair Display',serif;font-size:26px;font-weight:700;color:${readiness.color}">${readiness.score}</div>
        <div>
          <div style="font-size:12px;font-weight:700;color:${readiness.color}">${readiness.label}</div>
          <div style="height:5px;width:100px;background:var(--surface3);border-radius:3px;margin-top:3px;overflow:hidden"><div style="height:100%;border-radius:3px;width:${readiness.score}%;background:${readiness.color}"></div></div>
        </div>
      </div>
      <div style="font-size:11.5px;color:var(--muted);line-height:1.6;background:var(--surface2);border-radius:var(--r2);padding:9px 11px;border:1px solid var(--border)">${readiness.rec}</div>
    </div>
    ${p.stats.map(s => `<div style="display:flex;justify-content:space-between;font-size:12px;padding:5px 0;border-bottom:1px solid var(--border)"><span style="color:var(--muted)">${s.l}</span><span style="font-weight:700;color:var(--text)">${s.v}</span></div>`).join('')}
  `;

  document.getElementById('student-modal').classList.add('open');
  setTimeout(() => {
    if (smPieChart) { smPieChart.destroy(); smPieChart = null; }
    if (smLineChart) { smLineChart.destroy(); smLineChart = null; }
    const cp = document.getElementById('sm-pie-chart');
    if (cp) smPieChart = new Chart(cp, { type: 'doughnut', data: { labels: p.accuracy.map(a => a.s), datasets: [{ data: p.accuracy.map(a => a.v), backgroundColor: p.accuracy.map(a => a.c), borderWidth: 0 }] }, options: { responsive: true, maintainAspectRatio: false, cutout: '65%', plugins: { legend: { position: 'bottom', labels: { boxWidth: 9, font: { size: 10 }, color: '#6B7280' } }, tooltip: { callbacks: { label: ctx => `${ctx.label}: ${ctx.raw}%` } } } } });
    const cl = document.getElementById('sm-line-chart');
    if (cl) smLineChart = new Chart(cl, { type: 'line', data: { labels: ['S1', 'S2', 'S3', 'S4', 'S5', 'S6'], datasets: [{ label: 'Score', data: p.trend, borderColor: '#6C5CE7', backgroundColor: 'rgba(108,92,231,.1)', tension: .42, pointRadius: 4, pointBackgroundColor: '#6C5CE7', fill: true, borderWidth: 2 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { min: 40, max: 100, grid: { color: 'rgba(30,35,80,.06)' }, ticks: { font: { size: 10 }, color: '#6B7280' } }, x: { grid: { display: false }, ticks: { font: { size: 10 }, color: '#6B7280' } } } } });
  }, 80);
}

function closeStudentModal() {
  document.getElementById('student-modal').classList.remove('open');
  if (smPieChart) { smPieChart.destroy(); smPieChart = null; }
  if (smLineChart) { smLineChart.destroy(); smLineChart = null; }
}

// ════════ APPLY MODAL ════════
const appliedResumes = {}; // store {studentName: filename}

function openApplyModal(title, company) {
  document.getElementById('amodal-title').textContent = 'Apply — ' + title;
  document.getElementById('amodal-company').textContent = company;
  document.getElementById('apply-modal').classList.add('open');
  document.getElementById('apply-drop-zone').className = 'resume-file-zone';
  document.getElementById('apply-drop-content').innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="var(--muted)" stroke-width="1.5" width="28" height="28" style="display:block;margin:0 auto 8px"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17,8 12,3 7,8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
    <div style="font-size:13px;font-weight:600;color:var(--text);margin-bottom:3px">Drop your resume here or click to browse</div>
    <div style="font-size:11.5px;color:var(--muted)">PDF, DOC, DOCX — max 5 MB</div>`;
  document.getElementById('apply-note').value = '';
}

function closeApplyModal() {
  document.getElementById('apply-modal').classList.remove('open');
}

function handleApplyFile(file) {
  if (!file) return;
  const zone = document.getElementById('apply-drop-zone');
  zone.className = 'resume-file-zone has-file';
  const size = (file.size / 1024).toFixed(0);
  document.getElementById('apply-drop-content').innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="var(--green)" stroke-width="2" width="28" height="28" style="display:block;margin:0 auto 8px"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>
    <div style="font-size:13px;font-weight:700;color:var(--green);margin-bottom:2px">${file.name}</div>
    <div style="font-size:11.5px;color:var(--muted)">${size} KB · Click to change</div>`;
  // Store filename linked to student
  appliedResumes['Arjun R.'] = { name: file.name, size: size, file: file };
}

function handleApplyDrop(e) {
  e.preventDefault();
  const file = e.dataTransfer.files[0];
  if (file) handleApplyFile(file);
}

function submitApplication() {
  const title = document.getElementById('amodal-title').textContent.replace('Apply — ', '');
  const hasResume = document.getElementById('apply-drop-zone').classList.contains('has-file');
  closeApplyModal();
  showToast('Application submitted to ' + title + (hasResume ? ' · Resume attached' : '') + ' !');
}

// ════════ HR RESUME VIEWER ════════
function viewApplicantResume(btn) {
  const row = btn.closest('tr');
  const nameEl = row ? row.querySelector('.tn') : null;
  const name = nameEl ? nameEl.textContent : 'Student';
  const stored = appliedResumes[name];

  if (stored) {
    // Show resume preview modal
    showResumePreview(name, stored);
  } else {
    // Simulate a stored resume for demo data
    const demoResumes = {
      'Rajesh K.': 'Rajesh_Kumar_Resume_2024.pdf',
      'Priya M.': 'Priya_Meenakshi_CV.pdf',
      'Sunita V.': 'Sunita_Venkatesan_Resume.pdf',
      'Arjun R.': null
    };
    const fname = demoResumes[name];
    if (fname) {
      showResumePreview(name, { name: fname, size: '185' });
    } else {
      showToast(name + ' has not attached a resume yet');
    }
  }
}

function showResumePreview(name, resumeInfo) {
  // Create overlay
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(15,20,50,.5);backdrop-filter:blur(6px);z-index:600;display:flex;align-items:center;justify-content:center';
  overlay.onclick = e => { if (e.target === overlay) document.body.removeChild(overlay); };
  overlay.innerHTML = `
    <div style="background:var(--surface);border-radius:16px;width:520px;max-width:90vw;box-shadow:0 24px 64px rgba(15,20,50,.25);overflow:hidden">
      <div style="background:linear-gradient(135deg,var(--green),#14B97F);padding:16px 20px;display:flex;align-items:center;justify-content:space-between">
        <div>
          <div style="font-family:'Playfair Display',serif;font-size:17px;font-weight:700;color:white">${name} — Resume</div>
          <div style="font-size:11.5px;color:rgba(255,255,255,.75);margin-top:2px">${resumeInfo.name}</div>
        </div>
        <button onclick="this.closest('[style]').remove()" style="background:rgba(255,255,255,.2);border:none;border-radius:8px;padding:5px 12px;color:white;cursor:pointer;font-size:12px">Close</button>
      </div>
      <div style="padding:20px">
        <div style="background:var(--surface2);border:1.5px solid var(--border);border-radius:var(--r2);padding:20px;margin-bottom:16px">
          <div style="display:flex;align-items:center;gap:14px;margin-bottom:14px">
            <div style="width:48px;height:48px;border-radius:10px;background:var(--red-l);border:1.5px solid rgba(239,68,68,.2);display:flex;align-items:center;justify-content:center">
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--red)" stroke-width="2" width="22" height="22"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>
            </div>
            <div>
              <div style="font-size:14px;font-weight:700;color:var(--text)">${resumeInfo.name}</div>
              <div style="font-size:12px;color:var(--muted);margin-top:2px">${resumeInfo.size} KB · PDF Document</div>
            </div>
          </div>
          <div style="font-size:12px;color:var(--muted);line-height:1.6;background:white;border-radius:var(--r2);padding:14px;border:1px solid var(--border)">
            <strong style="color:var(--text)">${name}</strong><br>
            Final-year CS/Commerce student · PSG College / Anna University<br><br>
            <strong style="color:var(--text)">Aptitude Highlights (via Skilly AI)</strong><br>
            • Top 14% in Logical Reasoning nationally<br>
            • 92% accuracy across 400+ practice questions<br>
            • Interview badge: Full Stack Developer — Proficient<br>
            • 22-day practice streak · TCS mock test: 82/100<br><br>
            <em style="color:var(--faint)">Full resume content available after download</em>
          </div>
        </div>
        <div style="display:flex;gap:8px">
          <button class="btn btn-p" style="flex:1;justify-content:center" onclick="showToast('${resumeInfo.name} downloaded');this.closest('[style]').remove()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="14" height="14"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7,10 12,15 17,10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Download Resume
          </button>
          <button class="btn btn-green" onclick="showToast('${name} shortlisted!');this.closest('[style]').remove()">Shortlist</button>
          <button class="btn btn-o" onclick="this.closest('[style]').remove()">Close</button>
        </div>
      </div>
    </div>`;
  document.body.appendChild(overlay);
}

// ════════ UI MODE TOGGLE ════════
let isMobileView = false;

function toggleUIMode() {
  isMobileView = !isMobileView;
  applyUIMode();
  showToast(isMobileView ? '📱 Mobile view on' : '🖥️ PC view on');
}

function applyUIMode() {
  document.body.classList.toggle('mobile-view', isMobileView);
  const track = document.getElementById('ui-toggle-track');
  const thumb = document.getElementById('ui-toggle-thumb');
  const lbl = document.getElementById('ui-mode-lbl');
  const btn = document.getElementById('ui-toggle-btn');
  const iconPC = document.getElementById('toggle-icon-pc');
  const iconMob = document.getElementById('toggle-icon-mob');
  if (!track) return;

  // Animate the toggle
  track.style.background = isMobileView ? 'var(--green)' : 'var(--faint)';
  if (thumb) thumb.style.left = isMobileView ? '21px' : '3px';

  // Label + icon
  lbl.textContent = isMobileView ? 'Mobile' : 'PC View';
  lbl.style.color = isMobileView ? 'var(--green)' : 'var(--accent)';
  iconPC.style.display = isMobileView ? 'none' : '';
  iconMob.style.display = isMobileView ? '' : 'none';

  // Button border color
  if (btn) btn.style.borderColor = isMobileView ? 'rgba(14,159,110,.35)' : 'var(--border2)';

  // Reset sidebar when switching back to PC
  if (!isMobileView) {
    document.getElementById('sidebar').classList.remove('mobile-open');
    const ov = document.getElementById('sidebar-overlay');
    if (ov) ov.classList.remove('show');
  }
}

// ════════ MOBILE SIDEBAR (used in mobile view) ════════
function toggleMobileSidebar() {
  if (!isMobileView) return;
  const sb = document.getElementById('sidebar');
  const ov = document.getElementById('sidebar-overlay');
  const open = sb.classList.toggle('mobile-open');
  if (ov) ov.classList.toggle('show', open);
}

function closeMobileSidebar() {
  document.getElementById('sidebar').classList.remove('mobile-open');
  const ov = document.getElementById('sidebar-overlay');
  if (ov) ov.classList.remove('show');
}

// Auto-close sidebar on nav click in mobile view
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      if (isMobileView) closeMobileSidebar();
    });
  });
});

// ════════ COLLEGE ADMIN EXTENDED JS ════════

// Tab switcher for cadm tabs - FIXED: Handle all tab content properly
function cadmTab(el, contentId) {
  const tabs = el.closest('.cadm-tabs');
  if (tabs) {
    tabs.querySelectorAll('.cadm-tab').forEach(t => t.classList.remove('active'));
  }
  el.classList.add('active');

  // Hide all possible content divs
  const allCandidates = ['cdt-overview', 'cdt-students', 'cdt-campus', 'cdt-team',
    'cjt-active', 'cjt-closed', 'cjt-draft', 'cjt-all', 'mp-jobs', 'mp-declined'];
  allCandidates.forEach(id => {
    const el2 = document.getElementById(id);
    if (el2) el2.style.display = 'none';
  });

  // Show the target content
  const target = document.getElementById(contentId);
  if (target) {
    target.style.display = 'block';
    // Ensure visibility
    target.style.visibility = 'visible';
    target.style.opacity = '1';
  }
}

// Dashboard charts
function buildCadmDash() {
  setTimeout(() => {
    const c1 = document.getElementById('dash-trends-chart');
    if (c1 && !c1._built) {
      c1._built = true;
      new Chart(c1, {
        type: 'line',
        data: {
          labels: ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'],
          datasets: [{
            label: 'Jobs Posted', data: [28, 42, 38, 22, 55, 61, 48],
            borderColor: '#1B6FE6', backgroundColor: 'rgba(27,111,230,.1)',
            fill: true, tension: 0.4, pointBackgroundColor: '#1B6FE6', pointRadius: 4
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { color: 'rgba(30,35,80,.05)' }, ticks: { color: 'var(--muted)', font: { size: 10 } } },
            y: { grid: { color: 'rgba(30,35,80,.05)' }, ticks: { color: 'var(--muted)', font: { size: 10 } } }
          }
        }
      });
    }
    const c2 = document.getElementById('dash-type-chart');
    if (c2 && !c2._built) {
      c2._built = true;
      new Chart(c2, {
        type: 'doughnut',
        data: {
          labels: ['Full Time', 'Internship+PPO', 'Internship', 'Contract'],
          datasets: [{
            data: [180, 60, 52, 20],
            backgroundColor: ['#1B6FE6', '#0D9488', '#F59E0B', '#EF4444'],
            borderWidth: 0
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false, cutout: '65%',
          plugins: { legend: { position: 'bottom', labels: { color: 'var(--muted)', font: { size: 10 }, padding: 8 } } }
        }
      });
    }
    // Reports charts
    const c3 = document.getElementById('rpt-trends-chart');
    if (c3 && !c3._built) {
      c3._built = true;
      new Chart(c3, {
        type: 'bar',
        data: {
          labels: ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'],
          datasets: [{ data: [18, 28, 42, 38, 22, 55, 61, 48], backgroundColor: 'rgba(27,111,230,.7)', borderRadius: 4 }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { color: 'rgba(30,35,80,.05)' }, ticks: { color: 'var(--muted)', font: { size: 10 } } },
            y: { grid: { color: 'rgba(30,35,80,.05)' }, ticks: { color: 'var(--muted)', font: { size: 10 } } }
          }
        }
      });
    }
    const c4 = document.getElementById('rpt-loc-chart');
    if (c4 && !c4._built) {
      c4._built = true;
      new Chart(c4, {
        type: 'bar', indexAxis: 'y',
        data: {
          labels: ['Bangalore', 'Chennai', 'Hyderabad', 'Pune', 'Mumbai', 'Remote', 'Delhi', 'Noida', 'Coimbatore', 'Kochi'],
          datasets: [{ data: [88, 72, 64, 48, 42, 38, 30, 24, 18, 12], backgroundColor: 'rgba(13,148,136,.7)', borderRadius: 4 }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { color: 'rgba(30,35,80,.05)' }, ticks: { color: 'var(--muted)', font: { size: 9 } } },
            y: { grid: { color: 'rgba(30,35,80,.05)' }, ticks: { color: 'var(--muted)', font: { size: 9 } } }
          }
        }
      });
    }
  }, 100);
}

// ════════ MY JOBS BUTTON HANDLERS - FIXED ════════

// CREATE JOB HANDLER
function createNewJob() {
  showToast('📝 Create Job form opened');
  // In production, open a modal or navigate to job creation form
}

// CLOSE JOB HANDLER
function closeJobListing(btn, jobTitle) {
  const row = btn.closest('tr');
  if (!row) return;

  // Find the status cell
  const cells = row.querySelectorAll('td');
  if (cells.length >= 9) {
    const statusCell = cells[8];
    statusCell.innerHTML = '<span class="cpill cpill-red">Closed</span>';
  }

  // Disable action buttons
  const actionCell = cells[9];
  if (actionCell) {
    actionCell.innerHTML = '<div style="display:flex;gap:4px"><span class="aib" title="Edit" onclick="showToast(\'Cannot edit closed job\')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></span></div>';
  }

  showToast(`✓ Job "${jobTitle}" closed!`);
}

// DELETE JOB HANDLER
function deleteJobListing(btn) {
  if (confirm('Are you sure you want to delete this job permanently?')) {
    const row = btn.closest('tr');
    if (row) {
      row.style.opacity = '0.5';
      setTimeout(() => {
        row.remove();
        showToast('✓ Job deleted');
      }, 300);
    }
  }
}

// SEARCH JOBS HANDLER
function searchJobs(searchTerm) {
  const tbody = document.getElementById('cadm-jobs-tbody');
  if (!tbody) return;

  const rows = tbody.querySelectorAll('tr');
  const term = searchTerm.toLowerCase();

  rows.forEach(row => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(term) ? '' : 'none';
  });
}

// FILTER JOBS HANDLER
function filterJobs(filterType) {
  showToast(`Filters applied: ${filterType}`);
}

// REOPEN CLOSED JOB
function reopenJobListing(btn, jobTitle) {
  const confirmed = confirm(`Reopen "${jobTitle}"?`);
  if (confirmed) {
    showToast(`✓ "${jobTitle}" reopened successfully`);
    btn.closest('tr').remove();
  }
}

// EDIT DRAFT JOB
function editDraftJob(btn, jobTitle) {
  const editForm = `
    <div style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:var(--surface);border-radius:var(--r);padding:24px;z-index:300;max-width:600px;width:90%;box-shadow:var(--sh2);overflow-y:auto;max-height:90vh">
      <h3 style="margin-bottom:16px;font-size:16px;font-weight:700">Edit Job: ${jobTitle}</h3>
      <div style="margin-bottom:12px">
        <label class="lbl">Job Title</label>
        <input class="fi" value="${jobTitle}">
      </div>
      <div style="margin-bottom:12px">
        <label class="lbl">Company</label>
        <input class="fi" value="Company Name">
      </div>
      <div style="margin-bottom:12px">
        <label class="lbl">Location</label>
        <input class="fi" value="Location">
      </div>
      <div style="margin-bottom:12px">
        <label class="lbl">CTC Range</label>
        <input class="fi" value="5-10 LPA">
      </div>
      <div style="margin-bottom:16px;display:flex;gap:8px">
        <button class="btn btn-p" style="flex:1" onclick="showToast('✓ Job updated successfully!');this.closest('div').parentElement.remove()">Update</button>
        <button class="btn btn-o" style="flex:1" onclick="this.closest('div').parentElement.remove()">Cancel</button>
      </div>
    </div>
    <div style="position:fixed;inset:0;background:rgba(0,0,0,.2);z-index:299;backdrop-filter:blur(4px)" onclick="this.remove();this.nextElementSibling.remove()"></div>
  `;
  document.body.insertAdjacentHTML('beforeend', editForm);
}

// PUBLISH DRAFT JOB
function publishDraftJob(btn, jobTitle) {
  const confirmed = confirm(`Publish "${jobTitle}" as active?`);
  if (confirmed) {
    showToast(`✓ "${jobTitle}" published and is now active`);
    btn.closest('tr').remove();
  }
}

// EXPORT JOBS HANDLER
function exportJobsToExcel() {
  const tbody = document.getElementById('cadm-jobs-tbody');
  if (!tbody) return;

  const data = [];
  const rows = tbody.querySelectorAll('tr');

  rows.forEach(row => {
    const cols = row.querySelectorAll('td');
    const rowData = [];
    cols.forEach(col => {
      rowData.push(col.textContent.trim());
    });
    data.push(rowData);
  });

  // Create workbook
  const ws = XLSX.utils.aoa_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Jobs');
  XLSX.writeFile(wb, 'my-jobs.xlsx');

  showToast('✓ Jobs exported to Excel');
}


// ════════ PLACEMENT CYCLE FUNCTIONS ════════

// SHOW CREATE PLACEMENT CYCLE FORM
function showCreatePlacementCycleForm() {
  const form = `
    <div style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:var(--surface);border-radius:var(--r);padding:24px;z-index:300;max-width:600px;width:90%;box-shadow:var(--sh2);overflow-y:auto;max-height:90vh">
      <h3 style="margin-bottom:16px;font-size:16px;font-weight:700">Create New Placement Cycle</h3>
      <div style="margin-bottom:12px">
        <label class="lbl">Cycle Name</label>
        <input class="fi" placeholder="e.g., 2025-26 Placement Drive">
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
        <div>
          <label class="lbl">Start Date</label>
          <input class="fi" type="date">
        </div>
        <div>
          <label class="lbl">End Date</label>
          <input class="fi" type="date">
        </div>
      </div>
      <div style="margin-bottom:12px">
        <label class="lbl">Description</label>
        <textarea class="fi" placeholder="Add details about this placement cycle" style="min-height:100px;resize:vertical"></textarea>
      </div>
      <div style="margin-bottom:16px;display:flex;gap:8px">
        <button class="btn btn-p" style="flex:1" onclick="showToast('✓ Placement Cycle created successfully!');this.closest('div').parentElement.remove()">Create</button>
        <button class="btn btn-o" style="flex:1" onclick="this.closest('div').parentElement.remove()">Cancel</button>
      </div>
    </div>
    <div style="position:fixed;inset:0;background:rgba(0,0,0,.2);z-index:299;backdrop-filter:blur(4px)" onclick="this.remove();this.nextElementSibling.remove()"></div>
  `;
  document.body.insertAdjacentHTML('beforeend', form);
}

// EDIT PLACEMENT CYCLE
function editPlacementCycle(btn, cycleName) {
  const form = `
    <div style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:var(--surface);border-radius:var(--r);padding:24px;z-index:300;max-width:600px;width:90%;box-shadow:var(--sh2);overflow-y:auto;max-height:90vh">
      <h3 style="margin-bottom:16px;font-size:16px;font-weight:700">Edit Placement Cycle: ${cycleName}</h3>
      <div style="margin-bottom:12px">
        <label class="lbl">Cycle Name</label>
        <input class="fi" value="${cycleName}">
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
        <div>
          <label class="lbl">Start Date</label>
          <input class="fi" type="date" value="2024-08-01">
        </div>
        <div>
          <label class="lbl">End Date</label>
          <input class="fi" type="date" value="2025-03-31">
        </div>
      </div>
      <div style="margin-bottom:12px">
        <label class="lbl">Status</label>
        <select class="fi"><option>Active</option><option>Completed</option><option>Upcoming</option><option>Paused</option></select>
      </div>
      <div style="margin-bottom:16px;display:flex;gap:8px">
        <button class="btn btn-p" style="flex:1" onclick="showToast('✓ Placement Cycle updated successfully!');this.closest('div').parentElement.remove()">Update</button>
        <button class="btn btn-o" style="flex:1" onclick="this.closest('div').parentElement.remove()">Cancel</button>
      </div>
    </div>
    <div style="position:fixed;inset:0;background:rgba(0,0,0,.2);z-index:299;backdrop-filter:blur(4px)" onclick="this.remove();this.nextElementSibling.remove()"></div>
  `;
  document.body.insertAdjacentHTML('beforeend', form);
}

// VIEW PLACEMENT CYCLE
function viewPlacementCycle(btn, cycleName) {
  const form = `
    <div style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:var(--surface);border-radius:var(--r);padding:24px;z-index:300;max-width:700px;width:90%;box-shadow:var(--sh2);overflow-y:auto;max-height:90vh">
      <h3 style="margin-bottom:16px;font-size:16px;font-weight:700">${cycleName}</h3>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px">
        <div style="background:var(--surface2);padding:12px;border-radius:var(--r2)">
          <div style="font-size:11px;color:var(--muted);margin-bottom:4px">Status</div>
          <div style="font-weight:700;color:var(--green)">Active</div>
        </div>
        <div style="background:var(--surface2);padding:12px;border-radius:var(--r2)">
          <div style="font-size:11px;color:var(--muted);margin-bottom:4px">Duration</div>
          <div style="font-weight:700">Aug 1, 2024 – Mar 31, 2025</div>
        </div>
      </div>
      <div style="background:var(--surface2);padding:12px;border-radius:var(--r2);margin-bottom:16px">
        <div style="font-size:11px;color:var(--muted);margin-bottom:4px">Quick Stats</div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-top:8px">
          <div><div style="font-size:12px;color:var(--muted)">Jobs Posted</div><div style="font-weight:700;font-size:16px">48</div></div>
          <div><div style="font-size:12px;color:var(--muted)">Students Placed</div><div style="font-weight:700;font-size:16px">186</div></div>
          <div><div style="font-size:12px;color:var(--muted)">Applications</div><div style="font-weight:700;font-size:16px">2,341</div></div>
        </div>
      </div>
      <div style="margin-bottom:16px;display:flex;gap:8px">
        <button class="btn btn-p" style="flex:1" onclick="this.closest('div').parentElement.remove()">Close</button>
      </div>
    </div>
    <div style="position:fixed;inset:0;background:rgba(0,0,0,.2);z-index:299;backdrop-filter:blur(4px)" onclick="this.remove();this.nextElementSibling.remove()"></div>
  `;
  document.body.insertAdjacentHTML('beforeend', form);
}

// DELETE PLACEMENT CYCLE
function deletePlacementCycle(btn, cycleName) {
  const confirmed = confirm(`Delete Placement Cycle "${cycleName}"? This action cannot be undone.`);
  if (confirmed) {
    showToast(`✓ Placement Cycle "${cycleName}" deleted`);
    btn.closest('tr').remove();
  }
}

// ════════ FACULTY MODULE ENHANCEMENTS ════════

// Initialize Faculty Module State
const facultyState = {
  selectedDepartment: '',
  selectedYear: '',
  selectedCourse: '',
  uploadedFile: null,
  extractedData: null,
  submissions: [],
  adminPending: [],
  extractionProgress: 0
};

// Department Selection Handler
function selectDepartment(dept) {
  facultyState.selectedDepartment = dept;

  // Update UI
  const btns = document.querySelectorAll('.fac-dept-btn');
  btns.forEach(b => b.classList.remove('active'));
  event.target.closest('.fac-dept-btn')?.classList.add('active');

  // Enable file upload
  const uploadArea = document.getElementById('fac-upload-area');
  if (uploadArea) uploadArea.style.opacity = '1';

  showToast(`✓ ${dept} selected`);
}

// Year Selection Handler
function selectYear(year) {
  facultyState.selectedYear = year;

  // Update UI
  const btns = document.querySelectorAll('.fac-year-btn');
  btns.forEach(b => b.classList.remove('active'));
  event.target.closest('.fac-year-btn')?.classList.add('active');

  showToast(`✓ ${year} selected`);
}

// Course Selection Handler
function selectCourse(course) {
  facultyState.selectedCourse = course;

  // Update UI
  const btns = document.querySelectorAll('.fac-course-btn');
  btns.forEach(b => b.classList.remove('active'));
  event.target.closest('.fac-course-btn')?.classList.add('active');

  // Enable file upload if year is also selected
  const uploadArea = document.getElementById('fac-upload-area');
  if (uploadArea && facultyState.selectedYear) uploadArea.style.opacity = '1';

  showToast(`✓ ${course} selected`);
}

// File Upload Handlers
function handleFileDrop(e) {
  e.preventDefault();
  e.stopPropagation();

  if (!facultyState.selectedYear) {
    showToast('⚠ Please select year first');
    return;
  }

  if (!facultyState.selectedCourse) {
    showToast('⚠ Please select course first');
    return;
  }

  const dropZone = document.getElementById('fac-upload-area');
  dropZone.classList.remove('drag-active');

  const files = e.dataTransfer?.files;
  if (files && files[0]) {
    handleFileSelect(files[0]);
  }
}

function handleFileSelect(file) {
  // Validate file type
  const validTypes = ['.xlsx', '.xls', '.csv'];
  const fileName = file.name.toLowerCase();
  const hasValidType = validTypes.some(type => fileName.endsWith(type));

  if (!hasValidType) {
    showToast('⚠ Only .xlsx, .xls, and .csv files are supported');
    return;
  }

  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    showToast('⚠ File size exceeds 10MB limit');
    return;
  }

  facultyState.uploadedFile = file;

  // Update UI with file info
  const uploadArea = document.getElementById('fac-upload-area');
  const fileInfo = document.getElementById('fac-file-info');
  const fileSize = (file.size / 1024 / 1024).toFixed(2);

  if (fileInfo) {
    fileInfo.innerHTML = `
      <div style="display:flex;align-items:center;gap:12px;padding:12px;background:var(--green-l);border:1.5px solid rgba(14,159,110,.2);border-radius:var(--r2);">
        <svg style="width:20px;height:20px;color:var(--green);flex-shrink:0" viewBox="0 0 24 24" fill="currentColor">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
        </svg>
        <div style="flex:1;">
          <div style="font-weight:600;color:var(--green);font-size:13px;">${file.name}</div>
          <div style="font-size:11px;color:var(--muted);margin-top:2px;">${fileSize} MB</div>
        </div>
        <button onclick="clearFileUpload()" style="background:none;border:none;color:var(--muted);cursor:pointer;font-size:18px;">×</button>
      </div>
    `;
    uploadArea.style.display = 'none';
  }

  // Show extract button
  const extractBtn = document.getElementById('fac-extract-btn');
  if (extractBtn) extractBtn.style.display = 'flex';

  showToast('✓ File uploaded successfully');
}

function clearFileUpload() {
  facultyState.uploadedFile = null;
  const uploadArea = document.getElementById('fac-upload-area');
  const fileInfo = document.getElementById('fac-file-info');
  const extractBtn = document.getElementById('fac-extract-btn');

  if (uploadArea) uploadArea.style.display = 'flex';
  if (fileInfo) fileInfo.innerHTML = '';
  if (extractBtn) extractBtn.style.display = 'none';

  showToast('✓ File cleared');
}

// Data Extraction with Progress
function startDataExtraction() {
  if (!facultyState.uploadedFile) {
    showToast('⚠ Please upload a file first');
    return;
  }

  const progressContainer = document.getElementById('fac-progress-container');
  if (progressContainer) progressContainer.style.display = 'block';

  // Start actual file extraction immediately
  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      // Simulate progress while reading
      let progress = 10;
      const progressInterval = setInterval(() => {
        progress += Math.random() * 25;
        if (progress >= 85) progress = 85;
        updateExtractionProgress(progress);
      }, 200);

      const data = e.target.result;
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      // Get all keys from the first row to find Name and Roll No columns dynamically
      const firstRow = jsonData[0];
      if (!firstRow) {
        showToast('⚠ No data found in Excel file');
        clearInterval(progressInterval);
        return;
      }

      // Find column names dynamically (case-insensitive)
      const allKeys = Object.keys(firstRow);
      let rollNoCol = null;
      let nameCol = null;

      // Find Roll No column
      rollNoCol = allKeys.find(key =>
        key.toLowerCase().includes('roll') ||
        key.toLowerCase() === 'id' ||
        key.toLowerCase() === 'student id'
      );

      // Find Name column
      nameCol = allKeys.find(key =>
        key.toLowerCase().includes('name') ||
        key.toLowerCase().includes('student')
      );

      if (!rollNoCol || !nameCol) {
        showToast(`⚠ Required columns not found. Found: ${allKeys.join(', ')}`);
        clearInterval(progressInterval);
        return;
      }

      // Extract only Roll No and Name from all rows
      const records = jsonData
        .map(row => ({
          rollNo: String(row[rollNoCol]).trim(),
          name: String(row[nameCol]).trim()
        }))
        .filter(r => r.rollNo && r.name && r.rollNo.toLowerCase() !== 'nan'); // Filter empty rows

      if (records.length === 0) {
        showToast('⚠ No valid student records found');
        clearInterval(progressInterval);
        return;
      }

      // Complete progress
      clearInterval(progressInterval);
      updateExtractionProgress(100);

      facultyState.extractedData = {
        totalRecords: records.length,
        department: facultyState.selectedDepartment,
        records: records
      };

      // Show preview section after a brief delay
      setTimeout(() => {
        const previewSection = document.getElementById('fac-preview-section');
        if (previewSection) previewSection.style.display = 'block';

        // Show extracted data summary
        displayExtractionSummary();
        displayDataPreview();

        // Hide extract button
        const extractBtn = document.getElementById('fac-extract-btn');
        if (extractBtn) extractBtn.style.display = 'none';

        showToast(`✓ Successfully extracted ${records.length} student records`);
      }, 500);

    } catch (error) {
      showToast('⚠ Error reading Excel file. Ensure it is a valid .xlsx or .csv file');
      console.error('File parsing error:', error);
    }
  };

  reader.onerror = function () {
    showToast('⚠ Error reading file');
  };

  reader.readAsArrayBuffer(facultyState.uploadedFile);
}

function updateExtractionProgress(progress) {
  const progressBar = document.getElementById('fac-progress-bar');
  const progressText = document.getElementById('fac-progress-text');

  if (progressBar) progressBar.style.width = Math.min(progress, 100) + '%';
  if (progressText) progressText.textContent = `${Math.min(Math.floor(progress), 100)}%`;
}

function completeExtraction() {
  // This function is no longer needed as extraction happens in startDataExtraction
  // Kept as placeholder for backwards compatibility
}

function displayExtractionSummary() {
  const summaryContainer = document.getElementById('fac-summary');
  if (!summaryContainer || !facultyState.extractedData) return;

  const data = facultyState.extractedData;
  summaryContainer.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px;">
      <div style="background:var(--surface2);border:1.5px solid var(--border);border-radius:var(--r2);padding:16px;">
        <div style="font-size:11px;color:var(--muted);font-weight:600;margin-bottom:6px;">TOTAL RECORDS</div>
        <div style="font-size:24px;font-weight:700;color:var(--accent);">${data.totalRecords}</div>
      </div>
      <div style="background:var(--surface2);border:1.5px solid var(--border);border-radius:var(--r2);padding:16px;">
        <div style="font-size:11px;color:var(--muted);font-weight:600;margin-bottom:6px;">DEPARTMENT</div>
        <div style="font-size:16px;font-weight:700;color:var(--text);">${data.department}</div>
      </div>
      <div style="background:var(--surface2);border:1.5px solid var(--border);border-radius:var(--r2);padding:16px;">
        <div style="font-size:11px;color:var(--muted);font-weight:600;margin-bottom:6px;">PREVIEW RECORDS</div>
        <div style="font-size:24px;font-weight:700;color:var(--accent);">${data.records.length}</div>
      </div>
    </div>
  `;
}

function displayDataPreview() {
  const previewTable = document.getElementById('fac-preview-table');
  if (!previewTable || !facultyState.extractedData) return;

  const records = facultyState.extractedData.records;
  let html = `
    <table style="width:100%;border-collapse:collapse;">
      <thead>
        <tr style="border-bottom:1.5px solid var(--border2);">
          <th style="padding:12px;text-align:left;font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;width:30%;">Roll No</th>
          <th style="padding:12px;text-align:left;font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;width:70%;">Name</th>
        </tr>
      </thead>
      <tbody>
  `;

  records.forEach(record => {
    html += `
      <tr style="border-bottom:1px solid var(--border);transition:background .2s;">
        <td style="padding:12px;font-size:13px;color:var(--text);font-weight:600;">${record.rollNo}</td>
        <td style="padding:12px;font-size:13px;color:var(--text);">${record.name}</td>
      </tr>
    `;
  });

  html += `</tbody></table>`;
  previewTable.innerHTML = html;
}

// Send for Admin Approval
function sendForAdminApproval() {
  if (!facultyState.extractedData) {
    showToast('⚠ No data to submit');
    return;
  }

  // Generate submission ID
  const submissionId = 'SUB-' + Date.now().toString().slice(-8);

  // 🔴 FIX: Include college info so approval knows which college's database to update
  const submission = {
    id: submissionId,
    college: activeFacultyCollege || 'Nirmala College for Women',  // Add college
    department: facultyState.selectedDepartment,
    year: facultyState.selectedYear,
    course: facultyState.selectedCourse,
    fileName: facultyState.uploadedFile.name,
    totalRecords: facultyState.extractedData.totalRecords,
    records: facultyState.extractedData.records,
    submittedAt: new Date().toLocaleString(),
    status: 'Pending',
    facultyName: activeFacultyName || 'Faculty User', // 🔴 NEW: Add faculty name
    facultyEmail: activeFacultyEmail || 'faculty@college.edu' // Add faculty email
  };

  // Add to faculty submissions
  facultyState.submissions.push(submission);

  // Add to admin pending
  facultyState.adminPending.push({
    ...submission,
    facultyEmail: 'faculty@college.edu'
  });

  // Update Faculty tab
  updateFacultySubmissions();

  // Update Admin Console
  updateAdminConsole();

  // Reset form
  resetFacultyForm();

  showToast(`✓ Submitted for approval (ID: ${submissionId})`);
}

function updateFacultySubmissions() {
  const tbody = document.getElementById('fac-submissions-tbody');
  if (!tbody) return;

  tbody.innerHTML = '';

  if (facultyState.submissions.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="padding:32px;text-align:center;color:var(--faint);">No submissions yet</td></tr>';
    updateSubmissionStats();
    return;
  }

  facultyState.submissions.forEach(sub => {
    const row = document.createElement('tr');
    row.className = 'fac-submission-row';
    row.setAttribute('data-status', sub.status);
    row.setAttribute('data-course', sub.course);
    row.setAttribute('data-year', sub.year);
    row.setAttribute('data-id', sub.id);

    row.innerHTML = `
      <td style="padding:12px;font-size:13px;color:var(--text);font-weight:600;">${sub.id}</td>
      <td style="padding:12px;font-size:13px;color:var(--text);">${sub.course || 'N/A'}</td>
      <td style="padding:12px;font-size:13px;color:var(--text);">${sub.year || 'N/A'}</td>
      <td style="padding:12px;font-size:13px;color:var(--muted);">${sub.totalRecords}</td>
      <td style="padding:12px;font-size:12px;color:var(--muted);">${sub.submittedAt}</td>
      <td style="padding:12px;">
        <span style="background:${sub.status === 'Pending' ? 'var(--amber-l)' : sub.status === 'Approved' ? 'var(--green-l)' : 'var(--red-l)'};color:${sub.status === 'Pending' ? 'var(--amber)' : sub.status === 'Approved' ? 'var(--green)' : 'var(--red)'};padding:4px 10px;border-radius:20px;font-size:11px;font-weight:600;white-space:nowrap;">
          ${sub.status === 'Pending' ? '⏳ ' : sub.status === 'Approved' ? '✓ ' : '✕ '}${sub.status}
        </span>
      </td>
      <td style="padding:12px;text-align:center;">
        <button onclick="viewSubmissionDetails('${sub.id}')" style="padding:4px 8px;background:var(--accent-l);color:var(--accent);border:1px solid rgba(27,111,230,.2);border-radius:var(--r2);font-size:11px;font-weight:600;cursor:pointer;transition:all .2s;" title="View details">👁</button>
      </td>
    `;
    tbody.appendChild(row);
  });

  updateSubmissionStats();
}

function updateSubmissionStats() {
  const total = facultyState.submissions.length;
  const pending = facultyState.submissions.filter(s => s.status === 'Pending').length;
  const approved = facultyState.submissions.filter(s => s.status === 'Approved').length;
  const rejected = facultyState.submissions.filter(s => s.status === 'Rejected').length;

  const statTotal = document.getElementById('stat-total');
  const statPending = document.getElementById('stat-pending');
  const statApproved = document.getElementById('stat-approved');
  const statRejected = document.getElementById('stat-rejected');

  if (statTotal) statTotal.textContent = total;
  if (statPending) statPending.textContent = pending;
  if (statApproved) statApproved.textContent = approved;
  if (statRejected) statRejected.textContent = rejected;
}

function searchSubmissions(query) {
  const rows = document.querySelectorAll('.fac-submission-row');
  const term = query.toLowerCase();

  rows.forEach(row => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(term) ? '' : 'none';
  });
}

function filterSubmissions(status) {
  const rows = document.querySelectorAll('.fac-submission-row');

  rows.forEach(row => {
    const rowStatus = row.getAttribute('data-status');
    row.style.display = (status === '' || rowStatus === status) ? '' : 'none';
  });
}

function viewSubmissionDetails(submissionId) {
  const submission = facultyState.submissions.find(s => s.id === submissionId);
  if (!submission) return;

  // Create modal or expand view
  const detailsHTML = `
    <div style="position:fixed;inset:0;background:rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;z-index:1000;padding:20px;" onclick="if(event.target===this)this.remove()">
      <div style="background:var(--surface);border-radius:var(--r);padding:24px;max-width:600px;max-height:80vh;overflow-y:auto;width:100%;box-shadow:var(--sh2);">
        <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:16px;">
          <div>
            <div style="font-size:18px;font-weight:700;color:var(--text);">${submission.id}</div>
            <div style="font-size:12px;color:var(--muted);margin-top:4px;">${submission.department} Department</div>
          </div>
          <button onclick="this.closest('div').parentElement.remove()" style="background:none;border:none;font-size:24px;cursor:pointer;color:var(--muted);">×</button>
        </div>
        
        <div style="background:var(--surface2);border:1.5px solid var(--border);border-radius:var(--r2);padding:12px;margin-bottom:16px;">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:12px;">
            <div>
              <div style="color:var(--muted);font-weight:600;margin-bottom:2px;">Total Records</div>
              <div style="color:var(--text);font-weight:700;">${submission.totalRecords}</div>
            </div>
            <div>
              <div style="color:var(--muted);font-weight:600;margin-bottom:2px;">Status</div>
              <div style="color:${submission.status === 'Pending' ? 'var(--amber)' : submission.status === 'Approved' ? 'var(--green)' : 'var(--red)'};font-weight:700;">${submission.status}</div>
            </div>
            <div>
              <div style="color:var(--muted);font-weight:600;margin-bottom:2px;">Submitted</div>
              <div style="color:var(--text);">${submission.submittedAt}</div>
            </div>
            <div>
              <div style="color:var(--muted);font-weight:600;margin-bottom:2px;">File Name</div>
              <div style="color:var(--text);font-size:11px;">${submission.fileName}</div>
            </div>
          </div>
        </div>
        
        <div style="margin-bottom:16px;">
          <div style="font-weight:700;color:var(--text);margin-bottom:8px;font-size:13px;">All Records (${submission.records.length})</div>
          <div style="max-height:400px;overflow-y:auto;border:1.5px solid var(--border);border-radius:var(--r2);padding:12px;">
            <table style="width:100%;font-size:11px;border-collapse:collapse;">
              <thead style="border-bottom:1px solid var(--border);">
                <tr>
                  <th style="text-align:left;padding:8px;font-weight:700;color:var(--muted);width:35%;">Roll No</th>
                  <th style="text-align:left;padding:8px;font-weight:700;color:var(--muted);width:65%;">Name</th>
                </tr>
              </thead>
              <tbody>
                ${submission.records.map(r => `
                  <tr style="border-bottom:1px solid var(--border);">
                    <td style="padding:8px;color:var(--text);font-weight:600;">${r.rollNo}</td>
                    <td style="padding:8px;color:var(--text);">${r.name}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
        
        <div style="display:flex;gap:10px;padding-top:12px;border-top:1px solid var(--border);">
          <button onclick="downloadSubmissionPDF('${submission.id}')" style="flex:1;padding:10px;background:var(--accent-l);color:var(--accent);border:1.5px solid rgba(27,111,230,.2);border-radius:var(--r2);font-weight:600;cursor:pointer;font-size:12px;">📄 Download PDF</button>
          <button onclick="this.closest('div').parentElement.remove()" style="flex:1;padding:10px;background:var(--surface2);color:var(--muted);border:1.5px solid var(--border);border-radius:var(--r2);font-weight:600;cursor:pointer;font-size:12px;">Close</button>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', detailsHTML);
}

function exportSubmissions() {
  if (facultyState.submissions.length === 0) {
    showToast('No submissions to export');
    return;
  }

  // Prepare CSV data
  let csv = 'Submission ID,Department,Total Records,Status,Submitted\n';

  facultyState.submissions.forEach(sub => {
    csv += `"${sub.id}","${sub.department}",${sub.totalRecords},"${sub.status}","${sub.submittedAt}"\n`;
  });

  // Download CSV
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `submissions_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);

  showToast('✓ Submissions exported to CSV');
}

function downloadSubmissionPDF(submissionId) {
  const submission = facultyState.submissions.find(s => s.id === submissionId);
  if (!submission) return;

  showToast('📄 PDF generation feature coming soon');
  // In production, this would generate a real PDF using a library like jsPDF
}


function resetFacultyForm() {
  facultyState.selectedDepartment = '';
  facultyState.selectedYear = '';
  facultyState.selectedCourse = '';
  facultyState.uploadedFile = null;
  facultyState.extractedData = null;

  // Reset UI
  document.querySelectorAll('.fac-dept-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.fac-year-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.fac-course-btn').forEach(b => b.classList.remove('active'));
  const uploadArea = document.getElementById('fac-upload-area');
  const fileInfo = document.getElementById('fac-file-info');
  const previewSection = document.getElementById('fac-preview-section');
  const progressContainer = document.getElementById('fac-progress-container');

  if (uploadArea) uploadArea.style.display = 'flex';
  if (fileInfo) fileInfo.innerHTML = '';
  if (previewSection) previewSection.style.display = 'none';
  if (progressContainer) progressContainer.style.display = 'none';
}

// Admin Console - Approval Handlers
function approveSubmission(submissionId) {
  const index = facultyState.adminPending.findIndex(s => s.id === submissionId);
  if (index !== -1) {
    const submission = facultyState.adminPending[index];

    // Grant college module access to all students in this submission
    if (submission.records && submission.records.length > 0) {
      // 🔴 FIX: Pass college and department to grantCollegeAccess for filtering
      grantCollegeAccess(submission.records, submission.college, submission.department);
      // 🔴 FIX: Add approved students to facultyBatches so they appear in College Admin database
      addStudentsToFacultyBatches(submission);
    }

    submission.status = 'Approved';
    submission.approvedAt = new Date().toLocaleString();

    // Update faculty submissions
    const facIndex = facultyState.submissions.findIndex(s => s.id === submissionId);
    if (facIndex !== -1) {
      facultyState.submissions[facIndex].status = 'Approved';
    }

    updateAdminConsole();
    updateFacultySubmissions();
    showToast(`✓ Submission ${submissionId} approved - ${submission.records.length} students granted access`);
  }
}

function rejectSubmission(submissionId) {
  const reasonEl = document.getElementById(`reject-reason-${submissionId}`);
  const reason = reasonEl ? reasonEl.value.trim() : '';

  if (!reason) {
    showToast('⚠ Please provide a rejection reason');
    return;
  }

  const index = facultyState.adminPending.findIndex(s => s.id === submissionId);
  if (index !== -1) {
    facultyState.adminPending[index].status = 'Rejected';
    facultyState.adminPending[index].rejectionReason = reason;
    facultyState.adminPending[index].rejectedAt = new Date().toLocaleString();

    // Update faculty submissions
    const facIndex = facultyState.submissions.findIndex(s => s.id === submissionId);
    if (facIndex !== -1) {
      facultyState.submissions[facIndex].status = 'Rejected';
    }

    updateAdminConsole();
    updateFacultySubmissions();
    showToast(`✓ Submission ${submissionId} rejected`);
  }
}

function approveAllPending() {
  const pending = facultyState.adminPending.filter(s => s.status === 'Pending');
  if (pending.length === 0) {
    showToast('No pending submissions to approve');
    return;
  }

  let totalStudents = 0;

  pending.forEach(sub => {
    const index = facultyState.adminPending.findIndex(s => s.id === sub.id);
    if (index !== -1) {
      const submission = facultyState.adminPending[index];

      // Grant college module access to all students in this submission
      if (submission.records && submission.records.length > 0) {
        // 🔴 FIX: Pass college and department to grantCollegeAccess for bulk approvals
        grantCollegeAccess(submission.records, submission.college, submission.department);
        // 🔴 FIX: Add approved students to facultyBatches for bulk approvals too
        addStudentsToFacultyBatches(submission);
        totalStudents += submission.records.length;
      }

      submission.status = 'Approved';
      submission.approvedAt = new Date().toLocaleString();

      const facIndex = facultyState.submissions.findIndex(s => s.id === sub.id);
      if (facIndex !== -1) {
        facultyState.submissions[facIndex].status = 'Approved';
      }
    }
  });

  updateAdminConsole();
  updateFacultySubmissions();
  showToast(`✓ ${pending.length} submissions approved - ${totalStudents} students granted college access`);
}

function rejectAllPending() {
  const pending = facultyState.adminPending.filter(s => s.status === 'Pending');
  if (pending.length === 0) {
    showToast('No pending submissions to reject');
    return;
  }

  if (confirm(`Are you sure you want to reject ${pending.length} submissions? This will require providing rejection reasons.`)) {
    showToast('⚠ Please provide rejection reasons individually');
  }
}



function updateAdminConsole() {
  const container = document.getElementById('cadm-faculty-approvals');
  const emptyState = document.getElementById('cadm-faculty-approvals-empty');
  const countEl = document.getElementById('appr-fac-count');

  if (!container) return;

  // Update analytics
  updateAdminAnalytics();

  // Update count
  const pendingCount = facultyState.adminPending.filter(s => s.status === 'Pending').length;
  if (countEl) countEl.textContent = pendingCount;

  // Clear container
  container.innerHTML = '';

  if (pendingCount === 0) {
    if (emptyState) emptyState.style.display = 'block';
    return;
  }

  if (emptyState) emptyState.style.display = 'none';

  // 🔴 FIX: Refresh College Admin database after approvals
  if (activeCollegeAdmin) {
    buildCollegeDB();
  }

  facultyState.adminPending.forEach(sub => {
    const card = document.createElement('div');
    card.style.cssText = `
      background:var(--surface2);
      border:1.5px solid var(--border);
      border-radius:var(--r2);
      padding:16px;
      margin-bottom:12px;
      transition:all .2s;
    `;

    const statusColor = sub.status === 'Pending' ? 'var(--amber)' : sub.status === 'Approved' ? 'var(--green)' : 'var(--red)';
    const statusBg = sub.status === 'Pending' ? 'var(--amber-l)' : sub.status === 'Approved' ? 'var(--green-l)' : 'var(--red-l)';

    card.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:12px;">
        <div style="flex:1;">
          <div style="font-weight:700;color:var(--text);margin-bottom:2px;font-size:13px;">${sub.id}</div>
          <div style="font-size:11px;color:var(--muted);margin-bottom:4px;">${sub.department} Department • ${sub.totalRecords} student records</div>
          <div style="font-size:10px;color:var(--faint);">${sub.submittedAt}</div>
        </div>
        <span style="background:${statusBg};color:${statusColor};padding:4px 10px;border-radius:20px;font-size:11px;font-weight:600;white-space:nowrap;margin-left:12px;">${sub.status}</span>
      </div>
      
      ${sub.status === 'Pending' ? `
        <div style="background:var(--surface);border-radius:var(--r2);padding:12px;margin-bottom:12px;border:1px solid var(--border);">
          <div style="font-size:10px;font-weight:700;color:var(--muted);margin-bottom:8px;text-transform:uppercase;letter-spacing:0.5px;">Data Preview (${sub.records.length} records)</div>
          <div style="max-height:150px;overflow-y:auto;">
            <table style="width:100%;font-size:11px;border-collapse:collapse;">
              <thead style="border-bottom:1px solid var(--border);">
                <tr>
                  <th style="text-align:left;padding:6px;font-weight:600;color:var(--muted);width:35%;">Roll No</th>
                  <th style="text-align:left;padding:6px;font-weight:600;color:var(--muted);width:65%;">Name</th>
                </tr>
              </thead>
              <tbody>
                ${sub.records.map(r => `
                  <tr style="border-bottom:1px solid var(--border);">
                    <td style="padding:6px;color:var(--text);font-weight:600;">${r.rollNo}</td>
                    <td style="padding:6px;color:var(--text);">${r.name}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
        
        <div style="margin-bottom:12px;">
          <label style="display:block;font-size:11px;font-weight:600;color:var(--muted);margin-bottom:6px;text-transform:uppercase;">Rejection Reason (optional)</label>
          <textarea id="reject-reason-${sub.id}" placeholder="Provide feedback if rejecting..." style="width:100%;padding:8px;border:1.5px solid var(--border);border-radius:var(--r2);font-size:12px;font-family:inherit;resize:vertical;min-height:50px;box-sizing:border-box;"></textarea>
        </div>
        
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
          <button onclick="approveSubmission('${sub.id}')" style="padding:10px;background:var(--green);color:white;border:none;border-radius:var(--r2);font-weight:600;cursor:pointer;font-size:12px;transition:all .2s;" onmouseover="this.style.opacity='0.9'" onmouseout="this.style.opacity='1'">
            ✓ Approve
          </button>
          <button onclick="rejectSubmission('${sub.id}')" style="padding:10px;background:var(--red);color:white;border:none;border-radius:var(--r2);font-weight:600;cursor:pointer;font-size:12px;transition:all .2s;" onmouseover="this.style.opacity='0.9'" onmouseout="this.style.opacity='1'">
            ✕ Reject
          </button>
        </div>
      ` : `
        <div style="padding:12px;background:${sub.status === 'Approved' ? 'var(--green-l)' : 'var(--red-l)'};border-radius:var(--r2);font-size:12px;color:${statusColor};font-weight:600;border:1px solid ${sub.status === 'Approved' ? 'rgba(14,159,110,.2)' : 'rgba(239,68,68,.2)'};">
          ${sub.status === 'Approved' ? '✓ Approved on ' + (sub.approvedAt || 'N/A') : `✕ Rejected${sub.rejectionReason ? ': ' + sub.rejectionReason : ''}`}
        </div>
      `}
    `;

    container.appendChild(card);
  });
}

function updateAdminAnalytics() {
  const total = facultyState.adminPending.length;
  const pending = facultyState.adminPending.filter(s => s.status === 'Pending').length;
  const approved = facultyState.adminPending.filter(s => s.status === 'Approved').length;
  const rejected = facultyState.adminPending.filter(s => s.status === 'Rejected').length;
  const totalRecords = facultyState.adminPending.reduce((sum, s) => sum + s.totalRecords, 0);

  // Update analytics elements
  const updateEl = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };

  updateEl('admin-total-subs', total);
  updateEl('admin-pending-subs', pending);
  updateEl('admin-approved-subs', approved);
  updateEl('admin-rejected-subs', rejected);
  updateEl('admin-total-records', totalRecords);
  updateEl('admin-pending-count', pending);
  updateEl('admin-approved-count', approved);
  updateEl('admin-rejected-count', rejected);
}

function downloadAdminReport() {
  if (facultyState.adminPending.length === 0) {
    showToast('No submissions to report');
    return;
  }

  const total = facultyState.adminPending.length;
  const pending = facultyState.adminPending.filter(s => s.status === 'Pending').length;
  const approved = facultyState.adminPending.filter(s => s.status === 'Approved').length;
  const rejected = facultyState.adminPending.filter(s => s.status === 'Rejected').length;
  const totalRecords = facultyState.adminPending.reduce((sum, s) => sum + s.totalRecords, 0);

  let report = `FACULTY MODULE - SUBMISSION REPORT\n`;
  report += `Generated: ${new Date().toLocaleString()}\n\n`;
  report += `SUMMARY STATISTICS\n`;
  report += `==================\n`;
  report += `Total Submissions: ${total}\n`;
  report += `Pending Review: ${pending}\n`;
  report += `Approved: ${approved}\n`;
  report += `Rejected: ${rejected}\n`;
  report += `Total Records: ${totalRecords}\n\n`;
  report += `SUBMISSIONS DETAIL\n`;
  report += `==================\n`;

  facultyState.adminPending.forEach(sub => {
    report += `\n${sub.id}\n`;
    report += `Department: ${sub.department}\n`;
    report += `Records: ${sub.totalRecords}\n`;
    report += `Status: ${sub.status}\n`;
    report += `Submitted: ${sub.submittedAt}\n`;
    if (sub.status === 'Rejected') {
      report += `Reason: ${sub.rejectionReason}\n`;
    }
  });

  const blob = new Blob([report], { type: 'text/plain' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `faculty-report_${new Date().toISOString().split('T')[0]}.txt`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);

  showToast('✓ Report downloaded');
}

// ════ RESUME BUILDER COLLEGE MODULE FUNCTIONS ════
let resumeCurrentTemplate = 'classic';
let resumeData = {
  name: 'Alex Morgan',
  title: 'Computer Science Student & Frontend Intern',
  email: 'alex.morgan@university.edu',
  phone: '+1 987 654 3210',
  location: 'San Francisco, CA',
  summary: 'Ambitious Computer Science student with 3+ years of project experience in web development and data analytics.',
  skills: ['React', 'JavaScript', 'Python', 'Node.js', 'SQL', 'Tailwind CSS', 'Git'],
  company: 'TechSolutions Inc.',
  expTitle: 'Frontend Developer Intern',
  duration: 'Jun 2024 – Present',
  expDesc: 'Developed responsive components using React and Tailwind, improved performance by 20%.',
  education: 'B.S. in Computer Science, Stanford University, 2023–2027 | GPA: 3.8/4.0',
  achievements: ['Dean\'s List 2024, 2025', 'Hackathon Winner - CodeFest 2024', 'Published Technical Blog on React Performance']
};

function setRM(mode) {
  const fresh = document.getElementById('rb-fresh');
  const upload = document.getElementById('rb-upload');
  const uploadSection = document.getElementById('uploadSection');
  if (mode === 'fresh') {
    if (uploadSection) uploadSection.style.display = 'none';
  } else {
    if (uploadSection) uploadSection.style.display = 'block';
  }
}

function setResumeTemplate(tpl) {
  resumeCurrentTemplate = tpl;
  document.querySelectorAll('.template-card').forEach(card => {
    if (card.getAttribute('data-template') === tpl) {
      card.style.borderColor = '#1e6fdf';
      card.style.background = '#ecf5ff';
      card.style.boxShadow = '0 2px 6px rgba(30,111,223,0.1)';
    } else {
      card.style.borderColor = '#e2edf2';
      card.style.background = '#f9fbfd';
      card.style.boxShadow = 'none';
    }
  });
  syncResumeFields();
}

function syncResumeFields() {
  resumeData.name = document.getElementById('editName')?.value || '';
  resumeData.title = document.getElementById('editTitle')?.value || '';
  resumeData.email = document.getElementById('editEmail')?.value || '';
  resumeData.phone = document.getElementById('editPhone')?.value || '';
  resumeData.location = document.getElementById('editLocation')?.value || '';
  resumeData.summary = document.getElementById('editSummary')?.value || '';
  resumeData.company = document.getElementById('editExpCompany')?.value || '';
  resumeData.expTitle = document.getElementById('editExpTitle')?.value || '';
  resumeData.duration = document.getElementById('editExpDuration')?.value || '';
  resumeData.expDesc = document.getElementById('editExpDesc')?.value || '';
  resumeData.education = document.getElementById('editEducation')?.value || '';

  const skillsStr = document.getElementById('editSkills')?.value || '';
  resumeData.skills = skillsStr.split(',').map(s => s.trim()).filter(s => s);

  const achievementsStr = document.getElementById('editAchievements')?.value || '';
  resumeData.achievements = achievementsStr.split('\n').filter(s => s.trim());

  renderResumePreview();
  updateAtsScore();
}

function renderResumePreview() {
  const container = document.getElementById('resumeExportArea');
  if (!container) return;

  const d = resumeData;
  const skillsHtml = d.skills.map(s => `<span style="display:inline-block;background:#eef2ff;padding:4px 12px;border-radius:30px;font-size:11px;margin:3px 4px 3px 0;">${escapeHtmlResume(s)}</span>`).join('');
  const achievementsHtml = d.achievements.map(a => `<li style="margin-left:20px;font-size:12px;">${escapeHtmlResume(a)}</li>`).join('');

  let html = '';
  if (resumeCurrentTemplate === 'classic') {
    html = `<div style="background:white;font-family:'Segoe UI',system-ui;padding:0">
      <div style="background:linear-gradient(135deg,#1e3c72,#2b4f8c);color:white;padding:24px 28px">
        <div style="font-size:26px;font-weight:700">${escapeHtmlResume(d.name)}</div>
        <div style="font-size:14px;opacity:0.9;margin:5px 0">${escapeHtmlResume(d.title)}</div>
        <div style="display:flex;gap:18px;font-size:11px;flex-wrap:wrap;margin-top:8px">${escapeHtmlResume(d.email)} &nbsp; ${escapeHtmlResume(d.phone)} &nbsp; ${escapeHtmlResume(d.location)}</div>
      </div>
      <div style="padding:18px 28px;border-bottom:1px solid #e9edf2"><div style="font-weight:700;font-size:14px;color:#1e3c72">Summary</div><div style="font-size:13px;margin-top:6px">${escapeHtmlResume(d.summary)}</div></div>
      <div style="padding:18px 28px;border-bottom:1px solid #e9edf2"><div style="font-weight:700;font-size:14px;color:#1e3c72">Skills</div><div style="margin-top:8px">${skillsHtml}</div></div>
      <div style="padding:18px 28px;border-bottom:1px solid #e9edf2"><div style="font-weight:700;font-size:14px;color:#1e3c72">Experience</div><div style="font-weight:600;font-size:14px">${escapeHtmlResume(d.expTitle)} @ ${escapeHtmlResume(d.company)}</div><div style="font-size:11px;color:#5c7c9e">${escapeHtmlResume(d.duration)}</div><div style="font-size:12px;margin-top:6px">${escapeHtmlResume(d.expDesc)}</div></div>
      <div style="padding:18px 28px;border-bottom:1px solid #e9edf2"><div style="font-weight:700;font-size:14px;color:#1e3c72">Education</div><div style="font-size:12px">${escapeHtmlResume(d.education)}</div></div>
      <div style="padding:18px 28px"><div style="font-weight:700;font-size:14px;color:#1e3c72">Achievements</div><ul style="margin-top:6px">${achievementsHtml}</ul></div>
    </div>`;
  } else if (resumeCurrentTemplate === 'modern') {
    html = `<div style="background:white;font-family:'Inter',system-ui;border-top:5px solid #2b6fdf;padding:0">
      <div style="display:flex;justify-content:space-between;padding:24px 28px;background:#fafcff;flex-wrap:wrap">
        <div><div style="font-size:28px;font-weight:800">${escapeHtmlResume(d.name)}</div><div style="color:#2b6fdf;font-weight:500">${escapeHtmlResume(d.title)}</div></div>
        <div style="text-align:right;font-size:12px">${escapeHtmlResume(d.email)}<br>${escapeHtmlResume(d.phone)}<br>${escapeHtmlResume(d.location)}</div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 2fr;gap:20px;padding:20px 28px">
        <div><div style="font-weight:700">Skills</div>${skillsHtml}<div style="margin-top:20px;font-weight:700">Education</div><div style="font-size:12px">${escapeHtmlResume(d.education)}</div></div>
        <div><div style="font-weight:700">Profile</div><div style="font-size:13px">${escapeHtmlResume(d.summary)}</div><div style="margin-top:16px;font-weight:700">Experience</div><div><strong>${escapeHtmlResume(d.expTitle)}</strong> at ${escapeHtmlResume(d.company)} (${escapeHtmlResume(d.duration)})</div><div style="font-size:12px">${escapeHtmlResume(d.expDesc)}</div><div style="margin-top:14px;font-weight:700">Achievements</div><ul>${achievementsHtml}</ul></div>
      </div>
    </div>`;
  } else {
    html = `<div style="background:white;font-family:system-ui;padding:20px">
      <div style="border-bottom:2px solid #ccc;padding-bottom:10px"><div style="font-size:28px;font-weight:600">${escapeHtmlResume(d.name)}</div><div>${escapeHtmlResume(d.title)} | ${escapeHtmlResume(d.email)} | ${escapeHtmlResume(d.phone)}</div></div>
      <div style="margin:12px 0"><strong>Summary</strong><div>${escapeHtmlResume(d.summary)}</div></div>
      <div><strong>Skills</strong><div>${d.skills.join(' · ')}</div></div>
      <div style="margin:12px 0"><strong>Experience</strong><div><em>${escapeHtmlResume(d.expTitle)} @ ${escapeHtmlResume(d.company)}</em> (${escapeHtmlResume(d.duration)})<br>${escapeHtmlResume(d.expDesc)}</div></div>
      <div><strong>Education</strong><div>${escapeHtmlResume(d.education)}</div></div>
      <div><strong>Achievements</strong><ul>${achievementsHtml}</ul></div>
    </div>`;
  }

  container.innerHTML = html;
}

function escapeHtmlResume(str) {
  if (!str) return '';
  return str.replace(/[&<>]/g, m => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;'
  }[m] || m));
}

function updateAtsScore() {
  let score = 55;
  const skillsStr = (resumeData.skills || []).join(' ').toLowerCase();
  const keywords = ['react', 'python', 'javascript', 'node', 'sql', 'api', 'rest', 'full stack', 'frontend', 'backend', 'cloud', 'git', 'agile', 'ci/cd'];
  let matchCount = 0;
  keywords.forEach(kw => { if (skillsStr.includes(kw)) matchCount++; });
  score += Math.min(30, matchCount * 3);
  if (resumeData.expDesc && resumeData.expDesc.length > 40) score += 5;
  if (resumeData.achievements.length >= 2) score += 5;
  if (resumeData.summary && resumeData.summary.length > 30) score += 3;
  score = Math.min(100, score);

  const scoreCircle = document.getElementById('atsScoreCircle');
  const scoreNum = document.getElementById('atsScoreNumber');
  if (scoreCircle) scoreCircle.textContent = score;
  if (scoreNum) scoreNum.textContent = score;

  const suggestions = [];
  if (!skillsStr.includes('react')) suggestions.push('React');
  if (!skillsStr.includes('node')) suggestions.push('Node.js');
  if (!skillsStr.includes('api')) suggestions.push('REST API');
  if (!skillsStr.includes('agile')) suggestions.push('Agile');

  const suggestDiv = document.getElementById('keywordSuggestions');
  if (suggestDiv) {
    if (suggestions.length) {
      suggestDiv.innerHTML = suggestions.map(s => `<span style="background:#f0f4f9;padding:4px 12px;border-radius:30px;font-size:11px;font-weight:500">${s}</span>`).join('');
    } else {
      suggestDiv.innerHTML = '<span style="background:#f0f4f9;padding:4px 12px;border-radius:30px;font-size:11px;font-weight:500">Great keyword coverage!</span>';
    }
  }
}

function boostAtsResume() {
  let newSkills = [...resumeData.skills];
  const currentSkillsLower = resumeData.skills.map(s => s.toLowerCase());
  if (!currentSkillsLower.some(s => s.includes('rest'))) newSkills.push('REST API');
  if (!currentSkillsLower.some(s => s.includes('agile'))) newSkills.push('Agile Methodology');
  if (!currentSkillsLower.some(s => s.includes('ci/cd'))) newSkills.push('CI/CD');
  if (!currentSkillsLower.some(s => s.includes('graphql'))) newSkills.push('GraphQL');

  resumeData.skills = [...new Set(newSkills)];
  const editSkills = document.getElementById('editSkills');
  if (editSkills) editSkills.value = resumeData.skills.join(', ');

  syncResumeFields();
  showToast('ATS keywords added: REST API, Agile, CI/CD, GraphQL');
}

function exportPdfResume() {
  const element = document.getElementById('resumeExportArea');
  if (!element) {
    showToast('Resume preview not found');
    return;
  }

  // Clone the element to avoid modifying the original
  const clonedElement = element.cloneNode(true);

  // Remove any inline event listeners and IDs
  clonedElement.id = '';

  // Ensure the cloned element has proper styling
  clonedElement.style.margin = '0';
  clonedElement.style.padding = '20px';
  clonedElement.style.background = 'white';

  try {
    const opt = {
      margin: 10,
      filename: `${resumeData.name.replace(/\s+/g, '_')}_Resume.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, letterRendering: true, useCORS: true, allowTaint: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    if (typeof html2pdf !== 'undefined') {
      html2pdf().set(opt).from(clonedElement).save().then(() => {
        showToast('Resume downloaded successfully');
      }).catch(err => {
        console.error('PDF export error:', err);
        showToast('Error exporting PDF. Please try again.');
      });
    } else {
      showToast('PDF export library not loaded. Please refresh the page.');
    }
  } catch (error) {
    console.error('PDF export error:', error);
    showToast('Error generating PDF: ' + error.message);
  }
}

// ════════ COLLEGE ADMIN - EVENTS FUNCTIONS ════════
function viewJobBoard() {
  const form = `
    <div style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:var(--surface);border-radius:var(--r);padding:24px;z-index:300;max-width:800px;width:90%;box-shadow:var(--sh2);overflow-y:auto;max-height:90vh">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
        <h3 style="font-size:16px;font-weight:700">Job Board</h3>
        <span style="cursor:pointer;font-size:20px" onclick="this.closest('div').parentElement.remove()">✕</span>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
        <div style="background:var(--surface2);padding:12px;border-radius:var(--r2)">
          <div style="font-size:11px;color:var(--muted);margin-bottom:4px">Total Jobs</div>
          <div style="font-size:20px;font-weight:700">48</div>
        </div>
        <div style="background:var(--surface2);padding:12px;border-radius:var(--r2)">
          <div style="font-size:11px;color:var(--muted);margin-bottom:4px">Active Postings</div>
          <div style="font-size:20px;font-weight:700">38</div>
        </div>
      </div>
      <div style="margin-top:16px;font-weight:700;margin-bottom:8px">Active Job Listings</div>
      <table class="cadm-table">
        <thead><tr><th>Job Title</th><th>Company</th><th>Openings</th><th>Applications</th></tr></thead>
        <tbody>
          <tr><td>Software Engineer</td><td>Infosys</td><td>20</td><td>142</td></tr>
          <tr><td>Data Analyst</td><td>TCS</td><td>12</td><td>98</td></tr>
          <tr><td>ML Intern</td><td>Amazon</td><td>3</td><td>210</td></tr>
          <tr><td>DevOps Engineer</td><td>Zoho</td><td>5</td><td>67</td></tr>
        </tbody>
      </table>
      <button class="btn btn-p" style="width:100%;margin-top:16px" onclick="this.closest('div').parentElement.remove()">Close</button>
    </div>
    <div style="position:fixed;inset:0;background:rgba(0,0,0,.2);z-index:299;backdrop-filter:blur(4px)" onclick="this.remove();this.nextElementSibling.remove()"></div>
  `;
  document.body.insertAdjacentHTML('beforeend', form);
  showToast('✓ Job Board loaded');
}

// SWITCH EVENTS TABS
function switchEventsTabs(el, tabId) {
  const screen = document.getElementById('screen-cadm-events');
  if (screen) {
    const tabs = screen.querySelectorAll('.cadm-tab');
    tabs.forEach(t => t.classList.remove('active'));
    el.classList.add('active');

    // Hide all content
    const contents = screen.querySelectorAll('[id^="events-"]');
    contents.forEach(c => c.style.display = 'none');

    // Show selected
    const target = document.getElementById(tabId);
    if (target) target.style.display = 'block';
  }
}

function createNewEvent() {
  showToast('Opening Create Event form...');
  // Open event creation modal/form
  const eventForm = `
    <div style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:var(--surface);border-radius:var(--r);padding:24px;z-index:300;max-width:500px;width:90%;box-shadow:var(--sh2)">
      <h3 style="margin-bottom:16px;font-size:16px;font-weight:700">Create New Event</h3>
      <div style="margin-bottom:12px">
        <label class="lbl">Event Name</label>
        <input class="fi" placeholder="Enter event name">
      </div>
      <div style="margin-bottom:12px">
        <label class="lbl">Event Date</label>
        <input class="fi" type="date">
      </div>
      <div style="margin-bottom:12px">
        <label class="lbl">Location</label>
        <input class="fi" placeholder="Enter location">
      </div>
      <div style="margin-bottom:16px;display:flex;gap:8px">
        <button class="btn btn-p" style="flex:1" onclick="showToast('Event created successfully!');this.closest('div').parentElement.remove()">Create</button>
        <button class="btn btn-o" style="flex:1" onclick="this.closest('div').parentElement.remove()">Cancel</button>
      </div>
    </div>
    <div style="position:fixed;inset:0;background:rgba(0,0,0,.2);z-index:299;backdrop-filter:blur(4px)" onclick="this.remove();this.nextElementSibling.remove()"></div>
  `;
  document.body.insertAdjacentHTML('beforeend', eventForm);
}

function searchEvents(query) {
  if (query.trim() === '') {
    showToast('Showing all events');
  } else {
    showToast(`Searching for: "${query}"`);
  }
  // Filter event cards based on query
  const eventCards = document.querySelectorAll('.ev-card');
  eventCards.forEach(card => {
    const text = card.textContent.toLowerCase();
    card.style.display = text.includes(query.toLowerCase()) ? '' : 'none';
  });
}

// ════════ COLLEGE ADMIN - MOCK INTERVIEW FUNCTIONS ════════
function scheduleMockInterview() {
  showToast('Opening Schedule Mock Interview form...');
  const scheduleForm = `
    <div style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:var(--surface);border-radius:var(--r);padding:24px;z-index:300;max-width:600px;width:90%;box-shadow:var(--sh2);overflow-y:auto;max-height:90vh">
      <h3 style="margin-bottom:16px;font-size:16px;font-weight:700">Schedule Mock Interview</h3>
      <div style="margin-bottom:12px">
        <label class="lbl">Candidate Name</label>
        <input class="fi" placeholder="Enter candidate name">
      </div>
      <div style="margin-bottom:12px">
        <label class="lbl">Interview Date</label>
        <input class="fi" type="date">
      </div>
      <div style="margin-bottom:12px">
        <label class="lbl">Time</label>
        <input class="fi" type="time">
      </div>
      <div style="margin-bottom:12px">
        <label class="lbl">Interviewer</label>
        <select class="fi"><option>Select Interviewer</option><option>Dr. R. Kumar</option><option>Preethi S</option></select>
      </div>
      <div style="margin-bottom:16px;display:flex;gap:8px">
        <button class="btn btn-p" style="flex:1" onclick="showToast('Mock Interview scheduled!');this.closest('div').parentElement.remove()">Schedule</button>
        <button class="btn btn-o" style="flex:1" onclick="this.closest('div').parentElement.remove()">Cancel</button>
      </div>
    </div>
    <div style="position:fixed;inset:0;background:rgba(0,0,0,.2);z-index:299;backdrop-filter:blur(4px)" onclick="this.remove();this.nextElementSibling.remove()"></div>
  `;
  document.body.insertAdjacentHTML('beforeend', scheduleForm);
}

function filterMockInterviews(filter) {
  showToast(`Showing ${filter} interviews`);
  // Update active tab
  document.querySelectorAll('.cadm-tab').forEach((tab, idx) => {
    tab.classList.remove('active');
    if ((filter === 'upcoming' && idx === 0) || (filter === 'completed' && idx === 1) || (filter === 'all' && idx === 2)) {
      tab.classList.add('active');
    }
  });
  // Filter table rows based on filter
  const rows = document.querySelectorAll('#screen-cadm-mockiv tbody tr');
  rows.forEach(row => {
    const status = row.querySelector('.cpill').textContent.trim();
    if (filter === 'upcoming') {
      row.style.display = status === 'Upcoming' ? '' : 'none';
    } else if (filter === 'completed') {
      row.style.display = status === 'Completed' ? '' : 'none';
    } else {
      row.style.display = '';
    }
  });
}

function viewMockInterview(id) {
  showToast(`Viewing Mock Interview #${id}`);
  // Show interview details
  const interviewDetails = `
    <div style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:var(--surface);border-radius:var(--r);padding:24px;z-index:300;max-width:500px;width:90%;box-shadow:var(--sh2)">
      <h3 style="margin-bottom:16px;font-size:16px;font-weight:700">Interview Details - #${id}</h3>
      <div style="background:var(--surface2);padding:16px;border-radius:var(--r2);margin-bottom:16px">
        <p><strong>Candidate:</strong> Interview Candidate #${id}</p>
        <p style="margin-top:8px"><strong>Date:</strong> Mar ${28 + id}, 2025</p>
        <p style="margin-top:8px"><strong>Status:</strong> <span class="cpill cpill-blue">Upcoming</span></p>
        <p style="margin-top:8px"><strong>Interviewer:</strong> Interview Panel</p>
      </div>
      <button class="btn btn-p" style="width:100%" onclick="this.closest('div').parentElement.remove()">Close</button>
    </div>
    <div style="position:fixed;inset:0;background:rgba(0,0,0,.2);z-index:299;backdrop-filter:blur(4px)" onclick="this.remove();this.nextElementSibling.remove()"></div>
  `;
  document.body.insertAdjacentHTML('beforeend', interviewDetails);
}

function editMockInterview(id) {
  showToast(`Editing Mock Interview #${id}`);
  const editForm = `
    <div style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:var(--surface);border-radius:var(--r);padding:24px;z-index:300;max-width:500px;width:90%;box-shadow:var(--sh2);overflow-y:auto;max-height:90vh">
      <h3 style="margin-bottom:16px;font-size:16px;font-weight:700">Edit Mock Interview #${id}</h3>
      <div style="margin-bottom:12px">
        <label class="lbl">Candidate Name</label>
        <input class="fi" placeholder="Candidate name" value="Interview Candidate #${id}">
      </div>
      <div style="margin-bottom:12px">
        <label class="lbl">Interview Date</label>
        <input class="fi" type="date">
      </div>
      <div style="margin-bottom:12px">
        <label class="lbl">Time</label>
        <input class="fi" type="time">
      </div>
      <div style="margin-bottom:16px;display:flex;gap:8px">
        <button class="btn btn-p" style="flex:1" onclick="showToast('Interview updated!');this.closest('div').parentElement.remove()">Update</button>
        <button class="btn btn-o" style="flex:1" onclick="this.closest('div').parentElement.remove()">Cancel</button>
      </div>
    </div>
    <div style="position:fixed;inset:0;background:rgba(0,0,0,.2);z-index:299;backdrop-filter:blur(4px)" onclick="this.remove();this.nextElementSibling.remove()"></div>
  `;
  document.body.insertAdjacentHTML('beforeend', editForm);
}

function deleteMockInterview(id) {
  const confirmed = confirm(`Are you sure you want to delete Mock Interview #${id}?`);
  if (confirmed) {
    showToast(`Mock Interview #${id} deleted successfully`);
    // Remove the row from table
    event.target.closest('tr').remove();
  }
}

// 🔴 NEW: COLLEGE ADMIN - SCHEDULE TEST FUNCTIONS ════════
function openScheduleTestModal() {
  const modal = `
    <div style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:var(--surface);border-radius:var(--r);padding:24px;z-index:300;max-width:600px;width:90%;box-shadow:var(--sh2);overflow-y:auto;max-height:90vh">
      <h3 style="margin-bottom:16px;font-size:16px;font-weight:700">Schedule New Test</h3>
      <div style="margin-bottom:12px">
        <label class="lbl">Test Name</label>
        <input class="fi" placeholder="e.g., Quantitative Aptitude - Round 1" id="test-name">
      </div>
      <div style="margin-bottom:12px">
        <label class="lbl">Test Type</label>
        <select class="fi" id="test-type">
          <option>Select Test Type</option>
          <option>Quantitative</option>
          <option>Verbal</option>
          <option>Reasoning</option>
          <option>Data Interpretation</option>
          <option>Mixed (All)</option>
        </select>
      </div>
      <div style="margin-bottom:12px">
        <label class="lbl">Department</label>
        <select class="fi" id="test-dept">
          <option>Select Department</option>
          <option>CSE</option>
          <option>ECE</option>
          <option>Mechanical</option>
          <option>Civil</option>
          <option>EEE</option>
          <option>Chemical</option>
        </select>
      </div>
      <div style="margin-bottom:12px">
        <label class="lbl">Year</label>
        <select class="fi" id="test-year">
          <option>Select Year</option>
          <option>1st Year</option>
          <option>2nd Year</option>
          <option>3rd Year</option>
          <option>4th Year</option>
          <option>5th Year</option>
        </select>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
        <div>
          <label class="lbl">Date</label>
          <input class="fi" type="date" id="test-date">
        </div>
        <div>
          <label class="lbl">Time</label>
          <input class="fi" type="time" id="test-time">
        </div>
      </div>
      <div style="margin-bottom:12px">
        <label class="lbl">Duration (minutes)</label>
        <input class="fi" type="number" placeholder="60" id="test-duration">
      </div>
      <div style="margin-bottom:16px;display:flex;gap:8px">
        <button class="btn btn-p" style="flex:1" onclick="createTest()">Schedule Test</button>
        <button class="btn btn-o" style="flex:1" onclick="closeTestModal()">Cancel</button>
      </div>
    </div>
    <div style="position:fixed;inset:0;background:rgba(0,0,0,.2);z-index:299;backdrop-filter:blur(4px)" onclick="this.remove();this.nextElementSibling.remove()"></div>
  `;
  document.body.insertAdjacentHTML('beforeend', modal);
}

function createTest() {
  const name = document.getElementById('test-name').value.trim();
  const type = document.getElementById('test-type').value;
  const course = document.getElementById('test-course').value || document.getElementById('test-dept').value;
  const year = document.getElementById('test-year').value;
  const date = document.getElementById('test-date').value;
  const time = document.getElementById('test-time').value;
  const duration = document.getElementById('test-duration').value;

  if (!name || type === 'Select Test Type' || course === 'Select Department' || year === 'Select Year') {
    showToast('⚠ Please fill all required fields');
    return;
  }

  // Create new test object
  const newTest = {
    id: assignedTests.length + 1,
    name: name,
    subject: type,
    duration: parseInt(duration) || 60,
    questions: Math.ceil((parseInt(duration) || 60) / 1.2),
    difficulty: 'Intermediate',
    status: 'active',
    college: 'All',
    scheduledDate: date,
    scheduledTime: time,
    year: year,
    course: course,
    assignedCourses: [course],
    assignedYears: [year],
    assignedDepts: [course] // Keep for backward compatibility
  };

  // Add to assignedTests array
  assignedTests.push(newTest);

  showToast(`✓ Test "${name}" scheduled for ${course} (${year}) successfully!`);
  console.log('📝 New test added to assignedTests:', newTest);
  console.log('📊 Total tests now:', assignedTests.length);

  // Close modal
  const backdrop = document.querySelector('[style*="z-index:299"]');
  const modal = document.querySelector('[style*="z-index:300"]');
  if (backdrop) backdrop.remove();
  if (modal) modal.remove();

  // Refresh table
  if (document.getElementById('tests-tbody')) {
    applyTestFilters();
  }
}

function closeTestModal() {
  const backdrop = document.querySelector('[style*="z-index:299"]');
  const modal = document.querySelector('[style*="z-index:300"]');
  if (backdrop) backdrop.remove();
  if (modal) modal.remove();
}

function buildScheduleTestPage() {
  applyTestFilters();
}

function applyTestFilters() {
  const type = document.getElementById('filter-test-type')?.value || '';
  const dept = document.getElementById('filter-test-dept')?.value || '';
  const year = document.getElementById('filter-test-year')?.value || '';

  const tbody = document.getElementById('tests-tbody');
  if (!tbody) return; // Not on schedule test page

  // Filter assignedTests based on selected filters
  let filtered = assignedTests.filter(test => {
    const typeMatch = !type || test.subject === type;
    const deptMatch = !dept || test.assignedDepts.includes(dept);
    const yearMatch = !year || test.year === year;
    return typeMatch && deptMatch && yearMatch;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;padding:20px;color:var(--muted)">No tests found matching your filters</td></tr>';
    return;
  }

  // Display filtered tests in table
  tbody.innerHTML = filtered.map((test, index) => {
    const statusBadge = test.status === 'active' ? '<span class="cpill cpill-blue">Upcoming</span>' : '<span class="cpill cpill-green">Completed</span>';
    return `
      <tr>
        <td>${index + 1}</td>
        <td><b>${test.name}</b></td>
        <td><span style="background:var(--blue-l);color:#0066cc;padding:2px 8px;border-radius:4px;font-size:10px;font-weight:600">${test.subject}</span></td>
        <td>${test.assignedDepts.join(', ')}</td>
        <td>${test.year || 'N/A'}</td>
        <td>${new Date(test.scheduledDate).toLocaleDateString()} ${test.scheduledTime || ''}</td>
        <td>${test.duration} min</td>
        <td>${statusBadge}</td>
        <td><span style="font-weight:700">--</span> / --</td>
        <td style="display:flex;gap:4px">
          <span class="aib" title="Edit" style="cursor:pointer" onclick="editTest(${test.id})"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></span>
          <span class="aib" title="Delete" style="cursor:pointer" onclick="deleteTest(${test.id})"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><polyline points="3,6 5,6 21,6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6"/></svg></span>
        </td>
      </tr>
    `;
  }).join('');
}

function editTest(testId) {
  const test = assignedTests.find(t => t.id === testId);
  if (test) {
    showToast(`Editing: ${test.name}`);
  }
}

function deleteTest(testId) {
  if (confirm('Are you sure you want to delete this test?')) {
    assignedTests = assignedTests.filter(t => t.id !== testId);
    applyTestFilters();
    showToast('✓ Test deleted successfully');
  }
}

// 🔴 NEW: COLLEGE ADMIN - LEARNING MATERIALS FUNCTIONS ════════
function openPostMaterialModal() {
  const modal = `
    <div style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:var(--surface);border-radius:var(--r);padding:24px;z-index:300;max-width:600px;width:90%;box-shadow:var(--sh2);overflow-y:auto;max-height:90vh">
      <h3 style="margin-bottom:16px;font-size:16px;font-weight:700">Post Learning Material</h3>
      <div style="margin-bottom:12px">
        <label class="lbl">Material Title</label>
        <input class="fi" placeholder="Enter material title" id="material-title">
      </div>
      <div style="margin-bottom:12px">
        <label class="lbl">Material Type</label>
        <select class="fi" id="material-type" onchange="toggleMaterialInput()">
          <option>Select Type</option>
          <option value="Video">Video (YouTube URL)</option>
          <option value="Document">Document (PDF/Word)</option>
          <option value="Link">External Link</option>
        </select>
      </div>
      <div style="margin-bottom:12px">
        <label class="lbl">YouTube URL / Document Link</label>
        <input class="fi" placeholder="https://youtu.be/... or file URL" id="material-url">
      </div>
      <div style="margin-bottom:12px">
        <label class="lbl">Department(s)</label>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
          <label style="display:flex;align-items:center;gap:6px;font-size:12px;color:var(--text);cursor:pointer">
            <input type="checkbox" value="CSE" class="material-dept"> CSE
          </label>
          <label style="display:flex;align-items:center;gap:6px;font-size:12px;color:var(--text);cursor:pointer">
            <input type="checkbox" value="ECE" class="material-dept"> ECE
          </label>
          <label style="display:flex;align-items:center;gap:6px;font-size:12px;color:var(--text);cursor:pointer">
            <input type="checkbox" value="Mechanical" class="material-dept"> Mechanical
          </label>
          <label style="display:flex;align-items:center;gap:6px;font-size:12px;color:var(--text);cursor:pointer">
            <input type="checkbox" value="General" class="material-dept"> General
          </label>
        </div>
      </div>
      <div style="margin-bottom:12px">
        <label class="lbl">Description</label>
        <textarea class="fi" style="resize:vertical;min-height:80px" placeholder="Brief description of the material" id="material-desc"></textarea>
      </div>
      <div style="margin-bottom:16px;display:flex;gap:8px">
        <button class="btn btn-p" style="flex:1" onclick="postMaterial()">Post Material</button>
        <button class="btn btn-o" style="flex:1" onclick="this.closest('div').parentElement.remove()">Cancel</button>
      </div>
    </div>
    <div style="position:fixed;inset:0;background:rgba(0,0,0,.2);z-index:299;backdrop-filter:blur(4px)" onclick="this.remove();this.nextElementSibling.remove()"></div>
  `;
  document.body.insertAdjacentHTML('beforeend', modal);
}

function toggleMaterialInput() {
  const type = document.getElementById('material-type').value;
  const input = document.getElementById('material-url');
  if (type === 'Video') {
    input.placeholder = 'https://youtu.be/dQw4w9WgXcQ';
  } else if (type === 'Document') {
    input.placeholder = 'PDF or Document URL';
  } else {
    input.placeholder = 'Full URL to resource';
  }
}

function postMaterial() {
  const title = document.getElementById('material-title').value.trim();
  const type = document.getElementById('material-type').value;
  const url = document.getElementById('material-url').value.trim();
  const depts = Array.from(document.querySelectorAll('.material-dept:checked')).map(c => c.value);

  if (!title || type === 'Select Type' || !url || depts.length === 0) {
    showToast('⚠ Please fill all required fields');
    return;
  }

  showToast(`✓ Material "${title}" posted successfully!`);
  document.querySelector('[style*="position:fixed"][style*="z-index:300"]').parentElement.remove();
  document.querySelector('[style*="position:fixed"][style*="z-index:299"]').remove();
}

function applyMaterialFilters() {
  const type = document.getElementById('filter-material-type')?.value || '';
  const dept = document.getElementById('filter-material-dept')?.value || '';
  showToast(`Filtering materials: ${type || 'All Types'} | ${dept || 'All Depts'}`);
}

function playYouTubeVideo(videoId) {
  const modal = `
    <div style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:var(--surface);border-radius:var(--r);padding:16px;z-index:300;max-width:800px;width:90%;box-shadow:var(--sh2)">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
        <h3 style="font-size:16px;font-weight:700">Video Player</h3>
        <button onclick="this.closest('div').parentElement.remove();document.querySelector('[style*=z-index:299]').remove()" style="background:none;border:none;font-size:20px;cursor:pointer;color:var(--muted)">✕</button>
      </div>
      <iframe width="100%" height="400" src="https://www.youtube.com/embed/${videoId}?autoplay=1" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="border-radius:var(--r2)"></iframe>
      <div style="margin-top:12px;padding:12px;background:var(--surface2);border-radius:var(--r2);font-size:12px;color:var(--muted)">You can skip, pause, and control the video playback above ▲</div>
    </div>
    <div style="position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:299;backdrop-filter:blur(4px)" onclick="this.remove();this.nextElementSibling.remove()"></div>
  `;
  document.body.insertAdjacentHTML('beforeend', modal);
}

function downloadMaterial(fileName) {
  showToast(`⬇ Downloading ${fileName}...`);
  // Simulate file download
  const link = document.createElement('a');
  link.href = '#';
  link.download = fileName;
  showToast(`✓ ${fileName} ready for download`);
}

// ════════ COLLEGE ADMIN - MEMBERS FUNCTIONS ════════
function showAddMembersForm() {
  showToast('Opening Add Members form...');
  const addForm = `
    <div style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:var(--surface);border-radius:var(--r);padding:24px;z-index:300;max-width:500px;width:90%;box-shadow:var(--sh2);overflow-y:auto;max-height:90vh">
      <h3 style="margin-bottom:16px;font-size:16px;font-weight:700">Add New Member</h3>
      <div style="margin-bottom:12px">
        <label class="lbl">Member Name</label>
        <input class="fi" placeholder="Enter full name">
      </div>
      <div style="margin-bottom:12px">
        <label class="lbl">Email</label>
        <input class="fi" type="email" placeholder="Enter email address">
      </div>
      <div style="margin-bottom:12px">
        <label class="lbl">Role</label>
        <select class="fi"><option>Choose Role</option><option>Member</option><option>Admin</option><option>Super Admin</option></select>
      </div>
      <div style="margin-bottom:12px">
        <label class="lbl">Department</label>
        <select class="fi"><option>Choose Department</option><option>HR</option><option>Finance</option><option>Operations</option></select>
      </div>
      <div style="margin-bottom:16px;display:flex;gap:8px">
        <button class="btn btn-p" style="flex:1" onclick="showToast('Member added successfully!');this.closest('div').parentElement.remove()">Add Member</button>
        <button class="btn btn-o" style="flex:1" onclick="this.closest('div').parentElement.remove()">Cancel</button>
      </div>
    </div>
    <div style="position:fixed;inset:0;background:rgba(0,0,0,.2);z-index:299;backdrop-filter:blur(4px)" onclick="this.remove();this.nextElementSibling.remove()"></div>
  `;
  document.body.insertAdjacentHTML('beforeend', addForm);
}

function inviteMemberByEmail() {
  const emailInput = document.getElementById('memberEmail');
  const roleSelect = document.getElementById('memberRole');

  if (!emailInput || !roleSelect) {
    showToast('Please fill in all fields');
    return;
  }

  const email = emailInput.value.trim();
  const role = roleSelect.value;

  if (!email || email === 'example@abc.com') {
    showToast('Please enter a valid email address');
    return;
  }

  if (role === 'Choose Role') {
    showToast('Please select a role');
    return;
  }

  showToast(`Invitation sent to ${email} as ${role}`);
  emailInput.value = '';
  roleSelect.selectedIndex = 0;
}

function assignJobsToMember(memberName, memberId) {
  showToast(`Assigning jobs to ${memberName}...`);
  const assignForm = `
    <div style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:var(--surface);border-radius:var(--r);padding:24px;z-index:300;max-width:600px;width:90%;box-shadow:var(--sh2);overflow-y:auto;max-height:90vh">
      <h3 style="margin-bottom:16px;font-size:16px;font-weight:700">Assign Jobs to ${memberName}</h3>
      <div style="margin-bottom:16px">
        <label class="lbl">Select Jobs to Assign</label>
        <div style="background:var(--surface2);padding:12px;border-radius:var(--r2);max-height:300px;overflow-y:auto">
          <label style="display:flex;align-items:center;gap:8px;margin-bottom:8px;cursor:pointer"><input type="checkbox"> Software Engineer - Infosys</label>
          <label style="display:flex;align-items:center;gap:8px;margin-bottom:8px;cursor:pointer"><input type="checkbox"> Data Analyst - TCS</label>
          <label style="display:flex;align-items:center;gap:8px;margin-bottom:8px;cursor:pointer"><input type="checkbox"> DevOps Engineer - Amazon</label>
          <label style="display:flex;align-items:center;gap:8px;margin-bottom:8px;cursor:pointer"><input type="checkbox"> Frontend Developer - Zoho</label>
          <label style="display:flex;align-items:center;gap:8px;margin-bottom:8px;cursor:pointer"><input type="checkbox"> Backend Developer - Freshworks</label>
        </div>
      </div>
      <div style="margin-bottom:16px;display:flex;gap:8px">
        <button class="btn btn-p" style="flex:1" onclick="showToast('Jobs assigned successfully to ${memberName}!');this.closest('div').parentElement.remove()">Assign</button>
        <button class="btn btn-o" style="flex:1" onclick="this.closest('div').parentElement.remove()">Cancel</button>
      </div>
    </div>
    <div style="position:fixed;inset:0;background:rgba(0,0,0,.2);z-index:299;backdrop-filter:blur(4px)" onclick="this.remove();this.nextElementSibling?.remove()"></div>
  `;
  document.body.insertAdjacentHTML('beforeend', assignForm);
}

// ════════ MEMBERS FILTER ════════
function filterMembers(type) {
  const tabs = document.querySelectorAll('.cadm-tab');
  tabs.forEach(t => t.classList.remove('active'));
  const clicked = [...tabs].find(t => t.onclick?.toString().includes("'" + type + "'") || t.getAttribute('onclick')?.includes("'" + type + "'"));
  if (clicked) clicked.classList.add('active');
  showToast('Showing ' + type + ' members');
}

// ════════ TESTS FEATURE ════════
let assignedTests = [];

let testResults = [
  { id: 1, studentName: 'Rajesh K.', rollNo: 'CS001', dept: 'CSE', testId: 1, testName: 'Quantitative Aptitude - Mock 1', testType: 'Quantitative', score: 38, totalQuestions: 50, percentage: 76, submittedDate: '2025-04-15', status: 'Submitted' },
  { id: 2, studentName: 'Priya M.', rollNo: 'CS002', dept: 'CSE', testId: 1, testName: 'Quantitative Aptitude - Mock 1', testType: 'Quantitative', score: 42, totalQuestions: 50, percentage: 84, submittedDate: '2025-04-15', status: 'Submitted' },
  { id: 3, studentName: 'Sunita V.', rollNo: 'CS003', dept: 'CSE', testId: 2, testName: 'Logical Reasoning - Mock 2', testType: 'Logical', score: 28, totalQuestions: 40, percentage: 70, submittedDate: '2025-04-20', status: 'Submitted' },
  { id: 4, studentName: 'Arjun R.', rollNo: 'EC001', dept: 'ECE', testId: 1, testName: 'Quantitative Aptitude - Mock 1', testType: 'Quantitative', score: 35, totalQuestions: 50, percentage: 70, submittedDate: '2025-04-15', status: 'Submitted' },
  { id: 5, studentName: 'Neha S.', rollNo: 'ME001', dept: 'Mechanical', testId: 2, testName: 'Logical Reasoning - Mock 2', testType: 'Logical', score: 32, totalQuestions: 40, percentage: 80, submittedDate: '2025-04-20', status: 'Submitted' }
];

let currentTest = null;
let testState = { currentQuestion: 0, answers: [], startTime: null, submitted: false };
let testTimer = null;
let currentStudentDept = 'CSE';

function loadScheduledTests() {
  const container = document.getElementById('tests-container');
  const empty = document.getElementById('tests-empty');

  if (!container) return; // Not on tests page

  console.log('🔍 loadScheduledTests called');
  console.log('📊 assignedTests:', assignedTests);
  console.log('👤 currentUser:', currentUser);
  console.log('📚 facultyBatches:', facultyBatches);

  // Get student's department, course and year
  let studentCourse = 'B.Sc. Computer Science';
  let studentYear = '1st Year';
  let studentDept = currentUser.department || 'General';

  if (currentUser && currentUser.batch) {
    // Try to find the batch in facultyBatches to get course and year
    const matchingBatch = facultyBatches.find(b => b.name === currentUser.batch);
    if (matchingBatch) {
      studentCourse = matchingBatch.course;
      studentYear = matchingBatch.year;
      // If department isn't set, use batch name as fallback
      if (!studentDept || studentDept === 'General') studentDept = matchingBatch.name;
      console.log(`✅ Found student batch: ${studentCourse} - ${studentYear} (Dept: ${studentDept})`);
    }
  }

  console.log(`🎓 Student Dept: ${studentDept}, Course: ${studentCourse}, Year: ${studentYear}`);

  // Filter tests assigned to this department, course/year or "All"
  const availableTests = assignedTests.filter(test => {
    // Check if test is assigned to all, or matches this department
    const deptMatch = test.assignedDepts ?
      (test.assignedDepts.includes('All') || test.assignedDepts.includes(studentDept)) :
      true;

    const courseMatch = test.assignedCourses ?
      (test.assignedCourses.includes('All') || test.assignedCourses.includes(studentCourse)) :
      true;

    const yearMatch = test.assignedYears ?
      (test.assignedYears.includes('All') || test.assignedYears.includes(studentYear)) :
      true;

    const match = deptMatch && courseMatch && yearMatch;
    console.log(`  ✓ Test "${test.name}" depts:[${test.assignedDepts}] courses:[${test.assignedCourses}] years:[${test.assignedYears}] - Match? ${match}`);
    return match;
  });

  console.log('✅ Available tests:', availableTests.length);

  if (!availableTests || availableTests.length === 0) {
    console.log('⚠️  No tests available');
    container.innerHTML = '';
    empty.style.display = 'block';
    return;
  }

  empty.style.display = 'none';
  container.innerHTML = availableTests.map(test => `
    <div class="card" style="cursor:pointer;transition:all .2s" onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='var(--sh2)'" onmouseout="this.style.transform='none';this.style.boxShadow='var(--sh)'">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px">
        <div>
          <div style="font-size:13px;font-weight:700;color:var(--text)">${test.name}</div>
          <div style="font-size:11px;color:var(--muted);margin-top:4px">${test.subject}</div>
        </div>
        <span class="badge ba">${test.difficulty}</span>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px;font-size:12px;color:var(--muted)">
        <div><span style="font-weight:600">⏱ ${test.duration}</span> min</div>
        <div><span style="font-weight:600">${test.questions}</span> questions</div>
      </div>
      <div style="background:var(--surface2);padding:8px 12px;border-radius:var(--r2);margin-bottom:12px;font-size:11px;color:var(--muted);text-align:center">
        Assigned to: ${test.assignedDepts.join(', ')}
      </div>
      <button class="btn btn-p" style="width:100%;justify-content:center" onclick="startTest(${test.id})">
        Start Test <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><polyline points="9,18 15,12 9,6"/></svg>
      </button>
    </div>
  `).join('');
}

function startTest(testId) {
  currentTest = assignedTests.find(t => t.id === testId);
  if (!currentTest) {
    showToast('Test not found');
    return;
  }

  testState = {
    currentQuestion: 0,
    answers: Array(currentTest.questions).fill(null),
    startTime: Date.now(),
    submitted: false,
    testId: testId
  };

  // Initialize test display
  document.getElementById('test-title').textContent = currentTest.name;
  document.getElementById('test-subject').textContent = currentTest.subject + ' Aptitude';
  document.getElementById('test-duration').textContent = currentTest.duration + ' minutes';
  document.getElementById('test-questions').textContent = currentTest.questions;

  displayQuestion();
  startTestTimer();
  ss('test-active', 'nav-tests');
}

function displayQuestion() {
  const qNum = testState.currentQuestion + 1;
  const totalQuestions = currentTest.questions;

  document.getElementById('current-q').textContent = qNum;
  document.getElementById('total-q').textContent = totalQuestions;
  document.getElementById('question-text').textContent = `Question ${qNum}: This is a sample ${currentTest.subject} question. What is the answer to this aptitude problem?`;
  document.getElementById('test-progress').textContent = `${testState.currentQuestion}/${totalQuestions}`;

  const progressPercent = (testState.currentQuestion / totalQuestions) * 100;
  document.getElementById('test-progress-bar').style.width = progressPercent + '%';

  // Update button visibility
  document.getElementById('prev-btn').style.display = qNum === 1 ? 'none' : 'flex';
  document.getElementById('next-btn').style.display = qNum === totalQuestions ? 'none' : 'flex';
  document.getElementById('submit-btn').style.display = qNum === totalQuestions ? 'flex' : 'none';

  // Display selected answer
  const options = document.querySelectorAll('input[name="answer"]');
  options.forEach((opt, idx) => {
    opt.checked = testState.answers[testState.currentQuestion] === idx;
  });

  updateMarksDisplay();
}

function updateMarksDisplay() {
  let correct = 0, wrong = 0;
  testState.answers.forEach((ans, idx) => {
    if (ans !== null) {
      correct += Math.random() > 0.3 ? 1 : 0;
      if (ans === null) return;
      wrong = testState.answers.filter(a => a === -1).length;
    }
  });
  document.getElementById('test-marks').textContent = correct;
}

function nextQuestion() {
  const options = document.querySelectorAll('input[name="answer"]');
  const selected = Array.from(options).findIndex(o => o.checked);
  if (selected !== -1) testState.answers[testState.currentQuestion] = selected;

  if (testState.currentQuestion < currentTest.questions - 1) {
    testState.currentQuestion++;
    displayQuestion();
  }
}

function previousQuestion() {
  const options = document.querySelectorAll('input[name="answer"]');
  const selected = Array.from(options).findIndex(o => o.checked);
  if (selected !== -1) testState.answers[testState.currentQuestion] = selected;

  if (testState.currentQuestion > 0) {
    testState.currentQuestion--;
    displayQuestion();
  }
}

function startTestTimer() {
  let timeLeft = currentTest.duration * 60;

  testTimer = setInterval(() => {
    timeLeft--;
    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    document.getElementById('test-timer').textContent =
      String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');

    if (timeLeft <= 0) {
      clearInterval(testTimer);
      submitTest();
    }
  }, 1000);
}

function submitTest() {
  clearInterval(testTimer);

  const options = document.querySelectorAll('input[name="answer"]');
  const selected = Array.from(options).findIndex(o => o.checked);
  if (selected !== -1) testState.answers[testState.currentQuestion] = selected;

  // Calculate results
  let correctCount = 0, wrongCount = 0, unattemptedCount = 0;
  testState.answers.forEach((ans, idx) => {
    if (ans === null) {
      unattemptedCount++;
    } else {
      correctCount += Math.random() > 0.35 ? 1 : 0;
      if (Math.random() <= 0.35) wrongCount++;
    }
  });
  unattemptedCount = currentTest.questions - testState.answers.filter(a => a !== null).length;

  const totalCorrect = Math.min(correctCount, currentTest.questions - unattemptedCount);
  const percentage = Math.round((totalCorrect / currentTest.questions) * 100);

  // Save result to database
  let studentCourse = 'B.Sc. Computer Science';
  let studentYear = '1st Year';

  if (currentUser && currentUser.batch) {
    // Find matching batch to get course and year
    const matchingBatch = facultyBatches.find(b => b.name === currentUser.batch);
    if (matchingBatch) {
      studentCourse = matchingBatch.course;
      studentYear = matchingBatch.year;
    }
  }

  const newResult = {
    id: testResults.length + 1,
    studentName: currentUser.name,
    rollNo: currentUser.rollNo || 'CS-TEMP',
    dept: studentCourse,
    course: studentCourse,
    year: studentYear,
    batch: currentUser.batch,
    testId: testState.testId,
    testName: currentTest.name,
    testType: currentTest.subject,
    score: totalCorrect,
    totalQuestions: currentTest.questions,
    percentage: percentage,
    submittedDate: new Date().toISOString().split('T')[0],
    status: 'Submitted'
  };
  testResults.push(newResult);

  // Display results
  document.getElementById('result-title').textContent = currentTest.name + ' - Results';
  document.getElementById('result-subtitle').textContent = 'Submitted on ' + new Date().toLocaleString();
  document.getElementById('result-score').textContent = totalCorrect + '/' + currentTest.questions;
  document.getElementById('result-percentage').textContent = percentage;
  document.getElementById('result-correct').textContent = totalCorrect;
  document.getElementById('result-wrong').textContent = wrongCount;
  document.getElementById('result-unattempted').textContent = unattemptedCount;

  // Category breakdown
  const categories = ['Quantitative', 'Logical', 'Verbal', 'DI'];
  const breakdown = categories.map(cat => {
    const catCorrect = Math.floor(Math.random() * 5) + 3;
    return `<div style="background:var(--surface2);padding:10px;border-radius:var(--r2);text-align:center"><div style="font-size:11px;color:var(--muted);margin-bottom:4px">${cat}</div><div style="font-size:16px;font-weight:700;color:var(--accent);font-family:'Playfair Display',serif">${catCorrect}/10</div></div>`;
  }).join('');
  document.getElementById('category-breakdown').innerHTML = breakdown;

  showToast('✓ Test submitted! Results saved to college admin database.');
  ss('test-results', 'nav-tests');
}

// ════════ COLLEGE ADMIN TEST RESULTS ════════
function buildTestResults() {
  buildTestResultsStats();
  displayTestResultsTable(testResults);
}

function buildTestResultsStats() {
  const stats = document.getElementById('test-results-stats');
  const totalSubmissions = testResults.length;
  const avgPercentage = Math.round(testResults.reduce((sum, r) => sum + r.percentage, 0) / (totalSubmissions || 1));
  const passCount = testResults.filter(r => r.percentage >= 50).length;

  stats.innerHTML = `
    <div class="card-sm" style="background:var(--accent-l);border-color:rgba(27,111,230,.2)">
      <div style="font-size:11px;font-weight:700;color:var(--accent);text-transform:uppercase">Total Submissions</div>
      <div style="font-size:24px;font-weight:700;color:var(--accent);margin-top:6px">${totalSubmissions}</div>
    </div>
    <div class="card-sm" style="background:var(--green-l);border-color:rgba(14,159,110,.2)">
      <div style="font-size:11px;font-weight:700;color:var(--green);text-transform:uppercase">Avg Percentage</div>
      <div style="font-size:24px;font-weight:700;color:var(--green);margin-top:6px">${avgPercentage}%</div>
    </div>
    <div class="card-sm" style="background:var(--purple-l);border-color:rgba(108,92,231,.2)">
      <div style="font-size:11px;font-weight:700;color:var(--purple);text-transform:uppercase">Pass Rate</div>
      <div style="font-size:24px;font-weight:700;color:var(--purple);margin-top:6px">${totalSubmissions > 0 ? Math.round((passCount / totalSubmissions) * 100) : 0}%</div>
    </div>
  `;
}

function displayTestResultsTable(results) {
  const tbody = document.getElementById('test-results-tbody');
  const empty = document.getElementById('test-results-empty');

  if (!results || results.length === 0) {
    tbody.innerHTML = '';
    empty.style.display = 'block';
    return;
  }

  empty.style.display = 'none';
  tbody.innerHTML = results.map((r, i) => `
    <tr>
      <td>${i + 1}</td>
      <td><strong>${r.studentName}</strong></td>
      <td>${r.rollNo}</td>
      <td>${r.dept}</td>
      <td>${r.testName}</td>
      <td><span class="badge bp">${r.testType}</span></td>
      <td style="text-align:center;font-size:12px">${new Date(r.submittedDate).toLocaleDateString()}</td>
      <td style="text-align:center"><strong>${r.score}/${r.totalQuestions}</strong></td>
      <td style="text-align:center"><strong style="color:${r.percentage >= 70 ? 'var(--green)' : r.percentage >= 50 ? 'var(--amber)' : 'var(--red)'}">${r.percentage}%</strong></td>
      <td style="text-align:center"><span class="badge bg">${r.status}</span></td>
      <td style="text-align:center"><button class="btn btn-g btn-sm" onclick="viewTestResultDetail(${r.id})">View</button></td>
    </tr>
  `).join('');
}

function applyTestFilters() {
  const testType = document.getElementById('filter-test-type').value;
  const dept = document.getElementById('filter-test-dept').value;
  const date = document.getElementById('filter-test-date').value;

  let filtered = testResults;

  if (testType) filtered = filtered.filter(r => r.testType === testType);
  if (dept) filtered = filtered.filter(r => r.dept === dept);
  if (date) filtered = filtered.filter(r => r.submittedDate === date);

  displayTestResultsTable(filtered);
  buildTestResultsStats();
}

function resetTestFilters() {
  document.getElementById('filter-test-type').value = '';
  document.getElementById('filter-test-dept').value = '';
  document.getElementById('filter-test-date').value = '';
  displayTestResultsTable(testResults);
  buildTestResultsStats();
}

function viewTestResultDetail(resultId) {
  const result = testResults.find(r => r.id === resultId);
  if (result) {
    showToast(`Viewing detailed results for ${result.studentName} - ${result.testName}`);
  }
}

function downloadTestResultsExcel() {
  const csv = [
    ['S.No', 'Student Name', 'Roll No', 'Department', 'Test Name', 'Test Type', 'Submitted Date', 'Score', 'Percentage', 'Status'],
    ...testResults.map((r, i) => [
      i + 1,
      r.studentName,
      r.rollNo,
      r.dept,
      r.testName,
      r.testType,
      r.submittedDate,
      r.score + '/' + r.totalQuestions,
      r.percentage + '%',
      r.status
    ])
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(csv);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Test Results');
  XLSX.writeFile(workbook, 'Test_Results_' + new Date().toISOString().split('T')[0] + '.xlsx');
  showToast('✓ Test results exported to Excel');
}

// Initialize tests when page loads
document.addEventListener('DOMContentLoaded', function () {
  // Add sample tests for demonstration (can be removed when using college admin)
  if (assignedTests.length === 0) {
    assignedTests = [
      { id: 1, name: 'Quantitative Aptitude - Mock 1', subject: 'Quantitative', duration: 60, questions: 50, difficulty: 'Intermediate', status: 'active', college: 'All', scheduledDate: '2025-04-15', scheduledTime: '10:00', year: '2nd Year', assignedDepts: ['CSE', 'ECE'], assignedCourses: ['B.E. Computer Science'] },
      { id: 2, name: 'Logical Reasoning - Mock 2', subject: 'Logical', duration: 45, questions: 40, difficulty: 'Hard', status: 'active', college: 'All', scheduledDate: '2025-04-20', scheduledTime: '14:00', year: '2nd Year', assignedDepts: ['CSE', 'Mechanical'], assignedCourses: ['B.E. Computer Science'] },
      { id: 3, name: 'Verbal Ability - Mock 1', subject: 'Verbal', duration: 30, questions: 35, difficulty: 'Easy', status: 'active', college: 'All', scheduledDate: '2025-04-25', scheduledTime: '09:00', year: 'All', assignedDepts: ['All'], assignedCourses: ['All'] },
      { id: 4, name: 'Data Interpretation - Mock 1', subject: 'DI', duration: 50, questions: 30, difficulty: 'Intermediate', status: 'active', college: 'All', scheduledDate: '2025-05-01', scheduledTime: '15:00', year: '2nd Year', assignedDepts: ['CSE', 'ECE', 'Civil'], assignedCourses: ['B.E. Computer Science'] }
    ];
    console.log('📚 Sample tests loaded for demonstration');
  }

  loadScheduledTests();
});

const SKILLY_API_URL = 'http://localhost:11434/api/generate';

// ════════ AI FEEDBACK (Skilly AI) ════════
async function fetchSkillyFeedback(subj, score, accuracy, avgTime) {
  const prompt = `You are Skilly AI, an AI Career Coach. A student completed a ${subj} drill.
Score: ${score}, Accuracy: ${accuracy}%, Speed: ${avgTime}s/q.
Give 3 specific actionable tips to improve. Max 50 words total. No intro.`;

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), 8000); // 8s timeout

  try {
    const res = await fetch(SKILLY_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'phi3', prompt: prompt, stream: false }),
      signal: controller.signal
    });
    clearTimeout(id);
    if (!res.ok) throw new Error('Skilly AI connection failed');
    const data = await res.json();
    return data.response?.trim() || "Great effort! Focus on maintaining your speed and accuracy.";
  } catch (e) {
    clearTimeout(id);
    console.warn('Skilly AI error:', e.message);
    if (e.name === 'AbortError') return "Skilly AI analysis timed out. Ensure the engine is running.";
    return "Skilly AI currently offline. Tip: Focus on reducing your average response time below 2s.";
  }
}


/**
 * 📡 SKILLY AI MONITOR: Periodically checks if the local AI service is active
 */
async function monitorSkillyStatus() {
  const dot = document.getElementById('skilly-status-dot');
  const bubble = document.getElementById('skilly-status-bubble');
  if (!dot) return;

  try {
    const res = await fetch('http://localhost:11434/api/tags', { method: 'GET' });
    if (res.ok) {
      dot.style.background = '#10B981'; // Green
      bubble.title = 'Skilly AI: Online (Ready)';
    } else {
      throw new Error();
    }
  } catch (e) {
    dot.style.background = '#EF4444'; // Red
    bubble.title = 'Skilly AI: Offline. Ensure the engine is running.';
  }
}

// Start monitoring
setInterval(monitorSkillyStatus, 15000); // Check every 15s
monitorSkillyStatus();

// ════════ END OF SCRIPT ════════
