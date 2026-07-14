if (typeof state !== 'undefined') {
  Object.assign(state, {
    activeScreen: 'dash',
    activeNav: 'nav-dash',
    practiceSubj: null,
    qIndex: 0,
    qCorrect: 0,
    qWrong: 0,
    qTimer: 0,
    qInterval: null,
    currQSet: [],
    testActive: null,
    testTimer: 0,
    testInterval: null,
    testAnswers: {},
    mncActive: null,
    mncIndex: 0,
    mncTimer: 0,
    mncInterval: null,
    mncAnswers: {},
    ivActive: null,
    ivIndex: 0,
    ivTimer: 60,
    ivInterval: null,
    ivHistory: [],
    rmMode: 'fresh',
    rmTemplate: 'classic'
  });
}

let liveAssessments = []; // 🛰️ Dynamic assessment cache

// API_BASE is inherited from institutional-core.js

async function _logAssessmentResult(res) {
  // Push to local for instant UI update
  if (typeof currentUser !== 'undefined') {
    if (!currentUser.testHistory) currentUser.testHistory = [];
    currentUser.testHistory.push({
      assessmentId: res.assessment_id,
      testName: res.test_name,
      percentage: res.percentage,
      timestamp: new Date()
    });
  }

  // ☁️ SYNC TO DATABASE — identified by rollNo + college only (no internal IDs)
  const rollNo = currentUser.id || currentUser.studentId;  // roll number set from syncData.student.id
  const collegeName = currentUser.college;                  // college name set at login

  if (rollNo && collegeName) {
    try {
      const result = await apiFetch('/tests/submit', {
        method: 'POST',
        body: JSON.stringify({
          rollNo,
          collegeName,
          testType: 'aptitude',
          testName: res.test_name || 'Standard Assessment',
          score: res.score,
          maxScore: res.total_questions || 10,
          percentage: res.percentage,
          timeTaken: res.completion_time,
          passed: res.passed_or_failed === 'Passed'
        })
      });
      if (result.success) {
        console.log('[LOG] Assessment persisted to database');
        // ✅ Use server-authoritative counts for accuracy
        currentUser.testsCompleted = result.data.testsCompleted;
        currentUser.avgAccuracy = result.data.avgAccuracy;
        if (typeof buildDash === 'function') buildDash();
      }
    } catch (e) { console.error('[LOG] Assessment sync failed:', e.message); }
  }

  updatePerformanceMetrics();
}

async function _logPracticeResult(sess) {
  // Local state update
  if (typeof currentUser !== 'undefined') {
    const type = sess.module_id.toLowerCase();
    if (!currentUser.practiceScores) currentUser.practiceScores = { logical: [], quant: [], verbal: [], di: [] };
    if (currentUser.practiceScores[type]) currentUser.practiceScores[type].push(sess.percentage);
  }

  // ☁️ SYNC TO DATABASE — identified by rollNo + college only (no internal IDs)
  const rollNo = (typeof currentUser !== 'undefined' ? currentUser.id || currentUser.studentId : null);
  const collegeName = (typeof currentUser !== 'undefined' ? currentUser.college : null);

  if (rollNo && collegeName) {
    try {
      const result = await apiFetch('/tests/submit', {
        method: 'POST',
        body: JSON.stringify({
          rollNo,
          collegeName,
          testType: 'aptitude',
          testName: `Practice: ${sess.module_id}`.toUpperCase(),
          score: sess.correct_answers,
          maxScore: sess.questions_attempted,
          percentage: Math.round((sess.correct_answers / sess.questions_attempted) * 100),
          timeTaken: sess.time_spent,
          passed: true
        })
      });
      if (result.success) {
        console.log('[LOG] Practice persisted to database');
        // ✅ Use server-authoritative counts
        currentUser.testsCompleted = result.data.testsCompleted;
        currentUser.avgAccuracy = result.data.avgAccuracy;
        if (typeof buildDash === 'function') buildDash();
      }
    } catch (e) { console.error('[LOG] Practice sync failed:', e.message); }
  }

  updatePerformanceMetrics();
}

function updatePerformanceMetrics() {
  const sid = (typeof currentUser !== 'undefined' ? (currentUser.roll || currentUser.internal_id) : 'GUEST');

  const avg = arr => arr && arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;

  // Use currentUser.practiceScores directly
  const metrics = {
    quant: avg(currentUser.practiceScores?.quant),
    logical: avg(currentUser.practiceScores?.logical),
    verbal: avg(currentUser.practiceScores?.verbal),
    di: avg(currentUser.practiceScores?.di)
  };

  ['quant', 'logical', 'verbal', 'di'].forEach(subject => {
    const el = document.getElementById(`metric-${subject}`);
    if (el) el.textContent = metrics[subject] + '%';
  });

  evaluateBadges();
}

function evaluateBadges() {
  const sid = (typeof currentUser !== 'undefined' ? (currentUser.roll || currentUser.internal_id) : 'GUEST');

  // Badge logic simplified to use currentUser stats
  const badges = [
    { id: 'early-bird', title: 'Early Bird', icon: '🐦', criteria: () => (currentUser.testsCompleted || 0) >= 1 },
    { id: 'quant-pro', title: 'Quant Pro', icon: '🔢', criteria: () => ((currentUser.practiceScores?.quant.reduce((a, b) => a + b, 0) / currentUser.practiceScores?.quant.length || 0) >= 80) },
  ];

  // For now, badges are purely visual based on criteria
}



// ════════ UI HELPERS ════════
function toggleSidebar(show) {
  const sb = document.getElementById('sidebar');
  if (sb) {
    if (show === undefined) sb.classList.toggle('active');
    else if (show) sb.classList.add('active');
    else sb.classList.remove('active');
  }
}

// ════════ DASHBOARD ════════
function buildDash() {
  // Update Stats — resolve from both flat and nested stats shape
  if (typeof currentUser !== 'undefined') {
    const testsCount = currentUser.testsCompleted || currentUser.stats?.testsCompleted || 0;
    const accuracyVal = currentUser.avgAccuracy || currentUser.stats?.avgAccuracy || 0;
    const rankVal = currentUser.nationalRank || 142;

    // Support both element ID conventions used across the HTML
    ['stat-tests', 'dash-stat-tests'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = testsCount;
    });
    ['stat-accuracy', 'dash-stat-acc'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = accuracyVal + '%';
    });
    const s3 = document.getElementById('stat-rank');
    if (s3) s3.textContent = '#' + rankVal;

    updatePerformanceMetrics();
  }
}

function renderDashChart() {
  const cEl = document.getElementById('stud-prep-chart');
  if (!cEl) return;
  const ctx = cEl.getContext('2d');

  const scores = Object.values(currentUser.practiceScores || {}).flat().slice(-7);
  const chartData = scores.length >= 3 ? scores : [65, 72, 68, 85, 82, 90, 88];
  const chartLabels = chartData.map((_, i) => 'S' + (i + 1));

  // Premium Gradient (Cyan to Blue)
  const grad = ctx.createLinearGradient(0, 0, 0, 200);
  grad.addColorStop(0, 'rgba(27, 111, 230, 0.2)');
  grad.addColorStop(1, 'rgba(27, 111, 230, 0)');

  if (window.dashChartInst) window.dashChartInst.destroy();
  window.dashChartInst = new Chart(ctx, {
    type: 'line',
    data: {
      labels: chartLabels,
      datasets: [{
        label: 'Accuracy %',
        data: chartData,
        borderColor: '#1b6fe6',
        backgroundColor: grad,
        fill: true,
        tension: 0.4,
        borderWidth: 2.5,
        pointRadius: 4,
        pointBackgroundColor: '#fff',
        pointBorderColor: '#1b6fe6',
        pointBorderWidth: 2,
        pointHoverRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          mode: 'index',
          intersect: false,
          backgroundColor: '#0f172a',
          titleFont: { size: 11 },
          bodyFont: { size: 12 },
          displayColors: false,
          padding: 10,
          cornerRadius: 8
        }
      },
      interaction: { mode: 'nearest', axis: 'x', intersect: false },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          ticks: { font: { size: 10, weight: '500' }, color: '#64748b' },
          grid: { color: 'rgba(241, 245, 249, 1)', borderDash: [5, 5] }
        },
        x: {
          ticks: { font: { size: 10, weight: '500' }, color: '#64748b' },
          grid: { display: false }
        }
      }
    }
  });
}

// ════════ PRACTICE ════════
function buildPractice() {
  const grid = document.getElementById('practice-acc-grid');
  if (!grid) return;

  // Prefer cloud-synced practiceScores
  const pScores = currentUser.practiceScores || { quant: [], logical: [], verbal: [], di: [] };
  const avg = arr => (arr && arr.length) ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;

  const subjects = [
    { id: 'quant', name: 'Quant', color: '#01EFAC' },
    { id: 'logical', name: 'Logical', color: '#01CBAE' },
    { id: 'verbal', name: 'Verbal', color: '#2082A6' },
    { id: 'di', name: 'DI', color: '#524094' }
  ];

  grid.innerHTML = subjects.map(s => `
    <div class="comp-item" style="min-width: unset">
      <div class="comp-chart-wrap" style="height: 110px">
        <canvas id="chart-prac-${s.id}"></canvas>
        <div class="comp-info">
          <div class="comp-val" style="font-size: 18px">${avg(pScores[s.id] || [])}%</div>
          <div class="comp-label" style="font-size: 10px">${s.name}</div>
        </div>
      </div>
    </div>
  `).join('');

  if (!window.pracSubjectCharts) window.pracSubjectCharts = {};

  subjects.forEach(s => {
    const ctx = document.getElementById(`chart-prac-${s.id}`)?.getContext('2d');
    if (!ctx) return;

    if (window.pracSubjectCharts[s.id]) window.pracSubjectCharts[s.id].destroy();

    const score = avg(pScores[s.id] || []);
    const hasData = score > 0;

    window.pracSubjectCharts[s.id] = new Chart(ctx, {
      type: 'doughnut',
      data: {
        datasets: [{
          data: hasData ? [score, 100 - score] : [0, 100],
          backgroundColor: [s.color, 'rgba(255,255,255,0.05)'],
          borderWidth: 0,
          borderRadius: score > 0 ? 10 : 0,
          cutout: '82%'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        animation: { animateRotate: true, duration: 1500, easing: 'easeOutQuart' }
      }
    });
  });

  // --- OVERALL MASTERY (DOUGHNUT CHART) ---
  const overallCtx = document.getElementById('practice-wagon-wheel')?.getContext('2d');
  if (overallCtx) {
    if (window.pracRadarInst) window.pracRadarInst.destroy();

    const subjAvgs = subjects.map(s => avg(pScores[s.id]));
    const hasData = subjAvgs.some(v => v > 0);

    window.pracRadarInst = new Chart(overallCtx, {
      type: 'doughnut',
      data: {
        labels: subjects.map(s => s.name),
        datasets: [{
          data: hasData ? subjAvgs : [25, 25, 25, 25],
          backgroundColor: subjects.map(s => s.color),
          hoverOffset: 15,
          borderWidth: 5,
          borderColor: 'var(--surface)',
          borderRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
          legend: {
            display: true,
            position: 'bottom',
            labels: {
              color: 'var(--muted)',
              font: { size: 10, weight: '600' },
              padding: 15,
              usePointStyle: true,
              pointStyle: 'circle'
            }
          },
          tooltip: {
            backgroundColor: '#0f172a',
            padding: 12,
            titleFont: { size: 13 },
            bodyFont: { size: 12 },
            cornerRadius: 10,
            displayColors: true
          }
        },
        animation: {
          animateScale: true,
          animateRotate: true,
          duration: 2000,
          easing: 'easeOutBounce'
        }
      }
    });
  }

  // --- DYNAMIC AI FOCUS PICK ---
  const focusSubjEl = document.getElementById('ai-focus-subj');
  const focusMetaEl = document.getElementById('ai-focus-meta');
  const focusBtnEl = document.getElementById('ai-focus-btn');

  if (focusSubjEl && focusMetaEl && focusBtnEl) {
    // Determine weakest subject
    const subjStats = subjects.map(s => ({
      ...s,
      accuracy: avg(pScores[s.id] || [])
    }));

    // Check if any data exists
    const hasAnyData = subjStats.some(s => s.accuracy > 0);

    let weakest;
    if (!hasAnyData) {
      // Default for new users
      weakest = subjects.find(s => s.id === 'quant') || subjects[0];
      focusMetaEl.textContent = "Start your first drill to get AI focus picks";
    } else {
      // Sort by accuracy (lowest first)
      subjStats.sort((a, b) => a.accuracy - b.accuracy);
      weakest = subjStats[0];
      focusMetaEl.textContent = `Lowest accuracy · ${weakest.accuracy}% accuracy`;
    }

    const fullNames = {
      quant: "Quantitative Aptitude",
      logical: "Logical Reasoning",
      verbal: "Verbal / English",
      di: "Data Interpretation"
    };

    focusSubjEl.textContent = fullNames[weakest.id] || weakest.name;
    focusBtnEl.setAttribute('onclick', `startPractice('${weakest.id}')`);
  }

  renderPracticeActivityChart();
}

function renderPracticeActivityChart() {
  const pScores = currentUser.practiceScores || { quant: [], logical: [], verbal: [], di: [] };
  const avg = arr => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;

  // 1. Daily Volume Bar Chart
  const ctxDaily = document.getElementById('practice-daily-chart')?.getContext('2d');
  if (ctxDaily) {
    if (window.pracDailyInst) window.pracDailyInst.destroy();
    window.pracDailyInst = new Chart(ctxDaily, {
      type: 'bar',
      data: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [{
          label: 'Questions',
          data: [42, 38, 55, 62, 48, 70, 65],
          backgroundColor: '#1b6fe6',
          borderRadius: 6,
          barPercentage: 0.5
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { font: { size: 10 } } }, x: { grid: { display: false }, ticks: { font: { size: 10 } } } }
      }
    });
  }

  // 2. Weakness Radar Chart
  const ctxWeak = document.getElementById('practice-weakness-chart')?.getContext('2d');
  if (ctxWeak) {
    if (window.pracWeakInst) window.pracWeakInst.destroy();

    // Calculate weakness as (100 - accuracy)
    const weaknessData = [
      Math.max(20, 100 - avg(pScores.quant || [])),
      Math.max(20, 100 - avg(pScores.logical || [])),
      Math.max(20, 100 - avg(pScores.verbal || [])),
      Math.max(20, 100 - avg(pScores.di || []))
    ];

    window.pracWeakInst = new Chart(ctxWeak, {
      type: 'radar',
      data: {
        labels: ['Quant', 'Logical', 'Verbal', 'DI'],
        datasets: [{
          label: 'Weakness Level',
          data: weaknessData,
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          borderColor: '#ef4444',
          borderWidth: 2,
          pointBackgroundColor: '#ef4444',
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          r: {
            min: 0,
            max: 100,
            beginAtZero: true,
            ticks: { display: false, stepSize: 20 },
            pointLabels: { font: { size: 11, weight: '600' } }
          }
        }
      }
    });
  }
}

// ════════ PRACTICE ENGINE ════════
async function startPractice(subj) {
  state.practiceSubj = subj;
  state.qIndex = 0;
  state.qCorrect = 0;
  state.qWrong = 0;
  state.qTimer = 0;

  showToast(`Loading ${subj.toUpperCase()} questions...`);

  // Use the new global sequential loader to prevent repeats
  // Institutional sessions typically take 15 questions per drill
  state.currQSet = await getSequentialQuestions(subj, 15, false);

  if (state.currQSet.length === 0) {
    showToast("Questions coming soon for " + subj);
    return;
  }

  ss('question', '');
  state.qStartTime = Date.now(); // Track per-question duration
  renderQ();

  clearInterval(state.qInterval);
  state.qInterval = setInterval(() => {
    state.qTimer++;
    const m = Math.floor(state.qTimer / 60);
    const s = state.qTimer % 60;
    const timerEl = document.getElementById('q-timer');
    if (timerEl) timerEl.textContent = `${m}:${s < 10 ? '0' : ''}${s}`;
  }, 1000);
}

function renderQ() {
  const q = state.currQSet[state.qIndex];
  const counterEl = document.getElementById('q-counter');
  const subjEl = document.getElementById('q-subject');
  const textEl = document.getElementById('q-text');

  if (counterEl) counterEl.textContent = `Question ${state.qIndex + 1} of ${state.currQSet.length}`;
  if (subjEl) subjEl.textContent = state.practiceSubj.toUpperCase();
  if (textEl) textEl.textContent = q.q;

  const dots = document.getElementById('q-dots');
  if (dots) dots.innerHTML = state.currQSet.map((_, i) => `
    <div class="sq-dot ${i === state.qIndex ? 'active' : (i < state.qIndex ? 'done' : '')}"></div>
  `).join('');

  const optCont = document.getElementById('q-opts');
  if (optCont) optCont.innerHTML = q.opts.map((o, i) => `
    <div class="qopt" onclick="checkAns(${i}, this)">
      <div class="qopt-letter">${String.fromCharCode(65 + i)}</div>
      <div class="qopt-text">${o}</div>
    </div>
  `).join('');

  const nextBtn = document.getElementById('q-next');
  const expCard = document.getElementById('exp-card');
  if (nextBtn) nextBtn.style.display = 'none';
  if (expCard) expCard.style.display = 'none';

  const pb = document.getElementById('q-prog');
  const pbTxt = document.getElementById('q-prog-txt');
  if (pb) pb.style.width = ((state.qIndex) / state.currQSet.length * 100) + '%';
  if (pbTxt) pbTxt.textContent = `${state.qIndex} of ${state.currQSet.length} complete`;
}

function checkAns(idx, el) {
  if (document.getElementById('q-next')?.style.display === 'block') return;

  const q = state.currQSet[state.qIndex];
  const opts = document.querySelectorAll('.qopt');

  if (idx === q.ans) {
    el.classList.add('correct');
    state.qCorrect++;
    showToast("Correct! +15XP", "success");
  } else {
    el.classList.add('wrong');
    if (opts[q.ans]) opts[q.ans].classList.add('correct');
    state.qWrong++;
  }

  const corEl = document.getElementById('q-correct');
  const wrEl = document.getElementById('q-wrong');
  if (corEl) corEl.textContent = state.qCorrect;
  if (wrEl) wrEl.textContent = state.qWrong;

  const nextBtn = document.getElementById('q-next');
  const expCard = document.getElementById('exp-card');
  const expTxt = document.getElementById('exp-txt');

  if (nextBtn) nextBtn.style.display = 'block';
  if (expCard) expCard.style.display = 'block';
  if (expTxt) expTxt.textContent = q.exp || "The correct answer is " + String.fromCharCode(65 + q.ans) + ".";
}

function nextQ() {
  // Capture time for the question just finished
  if (!state.sessionTimes) state.sessionTimes = [];
  const duration = (Date.now() - state.qStartTime) / 1000;
  state.sessionTimes.push(duration);

  state.qIndex++;
  if (state.qIndex < state.currQSet.length) {
    state.qStartTime = Date.now(); // Reset for next
    renderQ();
  } else {
    clearInterval(state.qInterval);
    showPracticeSummary();
  }
}

async function showPracticeSummary() {
  const tot = state.currQSet.length;
  const correct = state.qCorrect;
  const wrong = state.qWrong;
  const pct = Math.round((correct / tot) * 100);

  // Calculate Avg Time
  const totalSessionTime = state.sessionTimes ? state.sessionTimes.reduce((a, b) => a + b, 0) : 0;
  const avgTime = state.sessionTimes && state.sessionTimes.length > 0
    ? (totalSessionTime / state.sessionTimes.length).toFixed(1)
    : 0;

  // Premium UI Logic
  let aiTitle, aiColor;
  if (pct >= 80) { aiTitle = 'Outstanding Performance!'; aiColor = 'var(--green)'; }
  else if (pct >= 60) { aiTitle = 'Strong Progress'; aiColor = 'var(--accent)'; }
  else if (pct >= 40) { aiTitle = 'Steady Growth'; aiColor = 'var(--amber)'; }
  else { aiTitle = 'Practice Recommended'; aiColor = 'var(--red)'; }

  const overlay = document.createElement('div');
  overlay.id = 'practice-summary-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(15,20,50,.5);backdrop-filter:blur(8px);z-index:1000;display:flex;align-items:center;justify-content:center;padding:20px';
  overlay.innerHTML = `
    <div style="background:var(--surface);border-radius:24px;width:100%;max-width:560px;box-shadow:0 32px 80px rgba(0,0,0,.3);overflow:hidden;animation:slideUp .3s cubic-bezier(0.16, 1, 0.3, 1) both;border:1px solid var(--border)">
      <div style="background:linear-gradient(135deg,#1E3A8A, #3B82F6);padding:24px;position:relative;color:white">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;opacity:.8;margin-bottom:8px">Institutional Practice Results</div>
        <div style="font-size:22px;font-weight:800;font-family:'Outfit',sans-serif">${state.practiceSubj.toUpperCase()} DRILL</div>
        <div style="font-size:13px;opacity:.8;margin-top:4px">${tot} Questions Attempted</div>
      </div>
      
      <div style="display:grid;grid-template-columns:repeat(4, 1fr);gap:1px;background:var(--border)">
        <div style="background:var(--surface);padding:18px;text-align:center"><div style="font-size:24px;font-weight:800;color:var(--accent)">${pct}%</div><div style="font-size:10px;color:var(--muted)">Accuracy</div></div>
        <div style="background:var(--surface);padding:18px;text-align:center"><div style="font-size:24px;font-weight:800;color:var(--green)">${correct}</div><div style="font-size:10px;color:var(--muted)">Correct</div></div>
        <div style="background:var(--surface);padding:18px;text-align:center"><div style="font-size:24px;font-weight:800;color:var(--red)">${wrong}</div><div style="font-size:10px;color:var(--muted)">Wrong</div></div>
        <div style="background:var(--surface);padding:18px;text-align:center"><div style="font-size:24px;font-weight:800;color:var(--accent)">${avgTime}s</div><div style="font-size:10px;color:var(--muted)">Avg Time</div></div>
      </div>

      <div style="padding:24px">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
          <div style="width:32px;height:32px;border-radius:10px;background:rgba(59,130,246,.1);display:flex;align-items:center;justify-content:center"><svg viewBox="0 0 24 24" fill="none" stroke="#3B82F6" stroke-width="2" width="16" height="16"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg></div>
          <div>
            <div style="font-size:11px;font-weight:700;color:#3B82F6;text-transform:uppercase">Skilly AI Feedback</div>
            <div style="font-size:13px;font-weight:700;color:${aiColor}">${aiTitle}</div>
          </div>
        </div>
        <div id="summary-ai-text" style="background:var(--surface2);border:1px solid var(--border);border-radius:12px;padding:16px;font-size:14px;line-height:1.6;color:var(--text)">
          <div class="skeleton-text" style="height:14px;width:90%;margin-bottom:8px"></div>
          <div class="skeleton-text" style="height:14px;width:70%"></div>
        </div>
      </div>

      <div style="padding:0 24px 24px;display:flex;gap:12px">
        <button class="btn btn-p" style="flex:1;justify-content:center" onclick="document.getElementById('practice-summary-overlay').remove();startPractice(state.practiceSubj)">Retake Drill</button>
        <button class="btn btn-o" style="flex:1;justify-content:center" onclick="document.getElementById('practice-summary-overlay').remove();ss('practice','nav-practice')">Finish Session</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  // Fetch Async AI suggestions
  fetchSkillyFeedback(state.practiceSubj, correct, pct, avgTime).then(fb => {
    const el = document.getElementById('summary-ai-text');
    if (el) el.textContent = fb;
  });

  // Submit to log
  _logPracticeResult({
    session_id: Date.now(),
    student_id: (typeof currentUser !== 'undefined' ? currentUser.roll : null) || 'GUEST',
    module_id: state.practiceSubj.toLowerCase(),
    questions_attempted: tot,
    correct_answers: correct,
    time_spent: Math.round(totalSessionTime),
    percentage: pct,
    avg_speed: avgTime
  });
  showToast(`Practice drill complete! You scored ${pct}%`);

  // Update user profile with new speed metrics
  if (!currentUser.subjectSpeeds) currentUser.subjectSpeeds = {};
  currentUser.subjectSpeeds[state.practiceSubj.toLowerCase()] = avgTime;

  const allSpeeds = Object.values(currentUser.subjectSpeeds).map(s => parseFloat(s)).filter(s => !isNaN(s));
  if (allSpeeds.length > 0) {
    currentUser.avgSpeed = (allSpeeds.reduce((a, b) => a + b, 0) / allSpeeds.length).toFixed(1);
  }

  // Update AI Recommendations card
  const recEl = document.getElementById('dash-ai-rec');
  if (recEl) recEl.textContent = `AI Coach: Based on your ${state.practiceSubj} drill, try to ${pct < 70 ? 're-read the fundamentals' : 'increase your speed'} while maintaining ${avgTime}s per question.`;

  buildDash();
  buildPractice();
}

// ════════ TESTS ════════
async function buildTests() {
  const cont = document.getElementById('tests-container');
  if (!cont) return;

  cont.innerHTML = `
    <div style="grid-column: 1 / -1; padding: 60px 20px; text-align: center;">
      <div class="loader-ring" style="margin: 0 auto 20px; width: 40px; height: 40px; border: 3px solid rgba(27, 111, 230, 0.1); border-top-color: var(--accent); border-radius: 50%; animation: spin 1s linear infinite;"></div>
      <div style="font-weight: 600; color: var(--muted)">Syncing with Institute Assessment Engine...</div>
    </div>
  `;

  try {
    const res = await apiFetch('/assessments');
    if (res.success) {
      liveAssessments = res.data;
      if (liveAssessments.length === 0) {
        cont.innerHTML = `
          <div style="grid-column: 1 / -1; padding: 60px 20px; text-align: center; background: var(--surface); border-radius: 20px; border: 1px dashed var(--border)">
            <div style="font-size: 40px; margin-bottom: 15px">📋</div>
            <div style="font-weight: 700; font-size: 18px; color: var(--text)">No Assessments Scheduled</div>
            <div style="color: var(--muted); margin-top: 8px">Your department hasn't published any new tests yet.</div>
          </div>
        `;
        return;
      }

      cont.innerHTML = liveAssessments.map(t => {
        const history = (typeof currentUser !== 'undefined' ? currentUser.testHistory || [] : []);
        // Check if student has already taken this assessment
        const pastAttempt = history.find(h => h.assessmentId === t._id);
        const isDone = !!pastAttempt;

        return `
          <div class="card ${isDone ? 'done-card' : ''}">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px">
              <div class="badge ${isDone ? 'bg' : 'bp'}">${isDone ? '✓ Completed' : t.type.toUpperCase()}</div>
              <div style="font-size:11px;color:var(--muted)">${t.duration} mins</div>
            </div>
            <div style="font-size:15px;font-weight:700;color:var(--text);margin-bottom:4px">${t.title}</div>
            <div style="font-size:12px;color:var(--muted);margin-bottom:16px">
              ${isDone
            ? `Score: <span style="color:var(--accent);font-weight:700">${pastAttempt.percentage}%</span>`
            : `${t.questionCount} Questions · ${t.questionCount * 1} Marks`}
            </div>
            <div style="display:flex;gap:8px">
              <button class="btn ${isDone ? 'btn-o' : 'btn-p'} btn-sm" style="flex:1;justify-content:center" onclick="startAssessment('${t._id}')">
                ${isDone ? 'Retake Test' : 'Take Test'}
              </button>
            </div>
          </div>
        `;
      }).join('');
    }
  } catch (err) {
    cont.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; color: var(--red); padding: 40px">Failed to load assessments: ${err.message}</div>`;
  }
}


async function startAssessment(id) {
  const test = liveAssessments.find(x => x._id === id);
  if (!test) return;

  state.testActive = test;
  state.qIndex = 0;
  state.testAnswers = {};
  state.testTimer = test.duration * 60;

  showToast(`Initializing Assessment: ${test.title}...`);

  // Load questions based on assessment type
  window.testQuestions = await getSequentialQuestions(test.type, test.questionCount, true);

  if (window.testQuestions.length === 0) {
    showToast("Questions not available for " + test.type);
    return;
  }

  ss('test-active', '');
  renderTestQ();

  clearInterval(state.testInterval);
  state.testInterval = setInterval(() => {
    state.testTimer--;
    if (state.testTimer <= 0) {
      submitTest();
      return;
    }
    const m = Math.floor(state.testTimer / 60);
    const s = state.testTimer % 60;
    const timerEl = document.getElementById('test-timer');
    if (timerEl) timerEl.textContent = `${m}:${s < 10 ? '0' : ''}${s}`;
  }, 1000);
}


function renderTestQ() {
  const q = testQuestions[state.qIndex];
  document.getElementById('test-q-counter').textContent = `Question ${state.qIndex + 1} of ${testQuestions.length}`;
  document.getElementById('test-q-text').textContent = q.q;

  const optCont = document.getElementById('test-q-opts');
  optCont.innerHTML = q.opts.map((o, i) => `
    <div class="qopt ${state.testAnswers[state.qIndex] === i ? 'active' : ''}" onclick="saveTestAns(${i})">
      <div class="qopt-letter">${String.fromCharCode(65 + i)}</div>
      <div class="qopt-text">${o}</div>
    </div>
  `).join('');

  const prog = ((state.qIndex + 1) / testQuestions.length) * 100;
  document.getElementById('test-progress-bar').style.width = prog + '%';
  document.getElementById('test-progress-text').textContent = `${state.qIndex + 1} / ${testQuestions.length} questions`;

  // Add nav buttons
  if (!document.getElementById('test-nav-btns')) {
    const nav = document.createElement('div');
    nav.id = 'test-nav-btns';
    nav.style = "display:flex;gap:8px;margin-top:20px";
    nav.innerHTML = `
      <button class="btn btn-o btn-sm" onclick="prevTestQ()" id="test-prev-btn">Previous</button>
      <button class="btn btn-p btn-sm" onclick="nextTestQ()" id="test-next-btn">Next Question</button>
    `;
    optCont.after(nav);
  }
}

function saveTestAns(idx) {
  state.testAnswers[state.qIndex] = idx;
  renderTestQ();
}

function nextTestQ() {
  if (state.qIndex < testQuestions.length - 1) {
    state.qIndex++;
    renderTestQ();
  }
}

function prevTestQ() {
  if (state.qIndex > 0) {
    state.qIndex--;
    renderTestQ();
  }
}

async function submitTest() {
  clearInterval(state.testInterval);
  let correct = 0;
  window.testQuestions.forEach((q, i) => {
    // If the question bank has 'ans' or 'answer'
    const correctAns = q.ans !== undefined ? q.ans : q.answer;
    if (state.testAnswers[i] === correctAns) correct++;
  });


  const tot = testQuestions.length;
  const pct = Math.round((correct / tot) * 100);
  const timeSpent = (state.testActive.duration * 60) - state.testTimer;
  const avgTime = (timeSpent / tot).toFixed(1);

  // Premium UI Logic
  let aiTitle, aiColor;
  if (pct >= 85) { aiTitle = 'Assessment Mastered!'; aiColor = 'var(--green)'; }
  else if (pct >= 70) { aiTitle = 'Strong Foundation'; aiColor = 'var(--accent)'; }
  else { aiTitle = 'Further Preparation Needed'; aiColor = 'var(--red)'; }

  const overlay = document.createElement('div');
  overlay.id = 'test-summary-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(10,15,40,.8);backdrop-filter:blur(12px);z-index:1200;display:flex;align-items:center;justify-content:center;padding:20px';
  overlay.innerHTML = `
    <div style="background:var(--surface);border-radius:32px;width:100%;max-width:620px;box-shadow:0 50px 120px rgba(0,0,0,.5);overflow:hidden;animation:slideUp .5s cubic-bezier(0.23, 1, 0.32, 1) both;border:1px solid rgba(255,255,255,.08)">
      <div style="background:linear-gradient(135deg,#1E40AF,#1D4ED8);padding:32px;color:white;position:relative">
        <div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:2px;opacity:.7;margin-bottom:8px">Institutional assessment report</div>
        <div style="font-size:28px;font-weight:900;font-family:'Outfit',sans-serif">${state.testActive.title.toUpperCase()}</div>
        <div style="font-size:14px;opacity:.8;margin-top:6px">Total Duration: ${Math.floor(timeSpent / 60)}m ${timeSpent % 60}s</div>
      </div>
      
      <div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:1px;background:var(--border)">
        <div style="background:var(--surface);padding:24px;text-align:center"><div style="font-size:32px;font-weight:900;color:var(--accent)">${pct}%</div><div style="font-size:10px;color:var(--muted);text-transform:uppercase">Accuracy</div></div>
        <div style="background:var(--surface);padding:24px;text-align:center"><div style="font-size:32px;font-weight:900;color:var(--green)">${correct}/${tot}</div><div style="font-size:11px;color:var(--muted);text-transform:uppercase">Correct</div></div>
        <div style="background:var(--surface);padding:24px;text-align:center"><div style="font-size:32px;font-weight:900;color:var(--accent)">${avgTime}s</div><div style="font-size:11px;color:var(--muted);text-transform:uppercase">Avg Speed</div></div>
      </div>

      <div style="padding:28px">
        <div style="display:flex;align-items:center;gap:15px;margin-bottom:18px">
          <div style="width:42px;height:42px;border-radius:14px;background:rgba(29,78,216,.1);display:flex;align-items:center;justify-content:center;border:1px solid rgba(29,78,216,.2)">
            <svg viewBox="0 0 24 24" fill="none" stroke="#1D4ED8" stroke-width="2.5" width="22" height="22"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
          </div>
          <div>
            <div style="font-size:12px;font-weight:800;color:#1D4ED8;text-transform:uppercase;letter-spacing:1px">SkilloWait AI Recommendation</div>
            <div style="font-size:16px;font-weight:700;color:${aiColor}">${aiTitle}</div>
          </div>
        </div>
        <div id="test-ai-text" style="background:var(--surface2);border:1px solid var(--border);border-radius:20px;padding:22px;font-size:15px;line-height:1.7;color:var(--text);box-shadow:inset 0 4px 12px rgba(0,0,0,.04)">
          Running deep performance analysis...
        </div>
      </div>

      <div style="padding:0 32px 32px;display:flex;gap:15px">
        <button class="btn btn-p" style="flex:1;height:54px;justify-content:center;font-weight:800" onclick="document.getElementById('test-summary-overlay').remove();ss('dashboard','nav-dash')">Go to Dashboard</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  fetchSkillyFeedback(state.testActive.title, correct, pct, avgTime).then(fb => {
    const el = document.getElementById('test-ai-text');
    if (el) el.textContent = fb;
  });

  // ☁️ SYNC TO DATABASE
  const dbId = currentUser.id || currentUser.studentId;
  const collegeId = currentUser.collegeId?._id || currentUser.college_id;

  if (dbId && collegeId) {
    try {
      await apiFetch(`/students/${dbId}/tests`, {
        method: 'POST',
        body: JSON.stringify({
          assessmentId: state.testActive._id,
          testType: 'assessment',
          testName: state.testActive.title,
          score: correct,
          maxScore: tot,
          percentage: pct,
          timeTaken: timeSpent,
          passed: pct >= 40,
          college_id: collegeId
        })
      });
      console.log('[LOG] Assessment persisted to cloud');

      // Refresh local history
      syncStudentData(currentUser.roll, currentUser.college, false);
    } catch (e) { console.error('[LOG] Database sync failed'); }
  }

  showToast(`Assessment submitted successfully!`);
}


// ════════ MNC SIMULATION ════════
function buildMNCGrid() {
  const g = document.getElementById('mnc-grid');
  if (!g) return;

  const history = (typeof currentUser !== 'undefined' ? currentUser.testHistory || [] : []);

  // Use MNCs from data.js
  g.innerHTML = MNCs.map((c, i) => {
    // Check if attempted in history
    const pastAttempt = history.find(h => h.testName === c.name || h.company === c.name);
    const isPassed = !!pastAttempt && pastAttempt.percentage >= 60;

    return `
      <div class="card ${isPassed ? 'done-card' : ''}" style="cursor:pointer;text-align:center;transition:transform .2s;position:relative" onclick="startMNC(${i})" onmouseover="this.style.transform='translateY(-4px)'" onmouseout="this.style.transform=''">
        ${isPassed ? `<div style="position:absolute;top:10px;right:10px;background:var(--green);color:white;font-size:10px;font-weight:800;padding:2px 8px;border-radius:20px;box-shadow:0 4px 10px rgba(16,185,129,.3)">TARGET REACHED</div>` : ''}
        <div style="height:44px;display:flex;align-items:center;justify-content:center;margin-bottom:14px">
          ${c.logo}
        </div>
        <div style="font-weight:700;font-size:14.5px;color:var(--text)">${c.name}</div>
        <div style="font-size:11.5px;color:var(--muted);margin-top:5px;display:flex;align-items:center;justify-content:center;gap:6px">
          ${pastAttempt ? `<span style="color:var(--accent);font-weight:700">${pastAttempt.percentage}% Score</span>` : `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="11" height="11"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg> ${c.time || 18} Mins
            <span style="opacity:.3">|</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="11" height="11"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg> ${c.qs || 20} Qs
          `}
        </div>
      </div>
    `;
  }).join('');
}

async function startMNC(idx) {
  const c = MNCs[idx];
  if (!c) return;
  state.mncActive = c.name;
  state.mncLogo = c.logo;
  state.mncIndex = 0;
  state.mncTimer = (c.time || 20) * 60;
  state.mncAnswers = [];

  // Update UI Header
  const mncHdrLogo = document.getElementById('mnc-logo-hdr');
  if (mncHdrLogo) mncHdrLogo.innerHTML = c.logo;
  const mncHdrName = document.getElementById('mnc-co-name');
  if (mncHdrName) mncHdrName.textContent = c.name;


  // Mix questions for MNC (Logical + Quant from external banks)
  showToast(`Initializing ${c.name} Assessment...`);
  const logicalQs = await getSequentialQuestions('logical', 10, true);
  const quantQs = await getSequentialQuestions('quant', 10, true);
  state.mncQSet = [...logicalQs, ...quantQs].sort(() => 0.5 - Math.random());

  ss('mnc-test', '');
  renderMNCQ();

  clearInterval(state.mncInterval);
  state.mncInterval = setInterval(() => {
    state.mncTimer--;
    const m = Math.floor(state.mncTimer / 60);
    const s = state.mncTimer % 60;
    const tEl = document.getElementById('mnc-timer');
    if (tEl) tEl.textContent = `${m}:${s < 10 ? '0' : ''}${s}`;
    if (state.mncTimer <= 0) { clearInterval(state.mncInterval); showMNCResults(); }
  }, 1000);
}

function renderMNCQ() {
  const q = state.mncQSet[state.mncIndex];
  document.getElementById('mnc-co-name').textContent = state.mncActive;
  document.getElementById('mnc-counter').textContent = `Question ${state.mncIndex + 1} of 20`;
  document.getElementById('mnc-q-txt').textContent = q.q;

  const prog = ((state.mncIndex + 1) / 20) * 100;
  document.getElementById('mnc-pb').style.width = prog + '%';

  const optCont = document.getElementById('mnc-opts');
  optCont.innerHTML = q.opts.map((o, i) => `
    <div class="qopt" onclick="saveMNCAns(${i})">
      <div class="qopt-letter">${String.fromCharCode(65 + i)}</div>
      <div class="qopt-text">${o}</div>
    </div>
  `).join('');
}

function saveMNCAns(idx) {
  state.mncAnswers[state.mncIndex] = idx;
  nextMNCQ();
}

function nextMNCQ() {
  state.mncIndex++;
  if (state.mncIndex < 20) renderMNCQ();
  else showMNCResults();
}

async function showMNCResults() {
  clearInterval(state.mncInterval);
  let correct = 0;
  state.mncQSet.forEach((q, i) => {
    if (state.mncAnswers[i] === q.ans) correct++;
  });
  const tot = 20;
  const pct = Math.round((correct / tot) * 100);

  // Calculate Avg Time (MNC is timed globally, but we can estimate)
  // Or better, if we have per-question tracking for MNC too
  // For now, use total / tot
  const totalMncTime = (state.mncTimeInitial || 1200) - state.mncTimer; // Approx
  const avgTime = (totalMncTime / tot).toFixed(1);

  let aiTitle, aiColor;
  if (pct >= 80) { aiTitle = 'Corporate Ready!'; aiColor = 'var(--green)'; }
  else if (pct >= 60) { aiTitle = 'Solid Candidate'; aiColor = 'var(--accent)'; }
  else { aiTitle = 'Needs Refinement'; aiColor = 'var(--red)'; }

  const overlay = document.createElement('div');
  overlay.id = 'mnc-summary-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(15,20,50,.6);backdrop-filter:blur(10px);z-index:1100;display:flex;align-items:center;justify-content:center;padding:20px';
  overlay.innerHTML = `
    <div style="background:var(--surface);border-radius:28px;width:100%;max-width:580px;box-shadow:0 40px 100px rgba(0,0,0,.4);overflow:hidden;animation:slideUp .4s ease both;border:1px solid rgba(255,255,255,.1)">
      <div style="background:linear-gradient(135deg,#0F172A,#1E293B);padding:28px;position:relative;color:white;border-bottom:1.5px solid rgba(255,255,255,.05)">
        <div style="display:flex;justify-content:space-between;align-items:flex-start">
          <div>
            <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;opacity:.7;margin-bottom:6px">Placement Simulation Assessment</div>
            <div style="font-size:26px;font-weight:800;font-family:'Outfit',sans-serif">${state.mncActive} HR ROUND</div>
          </div>
          <div style="width:50px;height:50px;background:white;border-radius:12px;padding:6px;display:flex;align-items:center;justify-content:center">${state.mncLogo}</div>
        </div>
      </div>
      
      <div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:1px;background:var(--border)">
        <div style="background:var(--surface);padding:20px;text-align:center"><div style="font-size:28px;font-weight:800;color:var(--accent)">${pct}%</div><div style="font-size:11px;color:var(--muted);text-transform:uppercase;margin-top:4px">Score</div></div>
        <div style="background:var(--surface);padding:20px;text-align:center"><div style="font-size:28px;font-weight:800;color:var(--green)">${correct}/${tot}</div><div style="font-size:11px;color:var(--muted);text-transform:uppercase;margin-top:4px">Correct</div></div>
        <div style="background:var(--surface);padding:20px;text-align:center"><div style="font-size:28px;font-weight:800;color:var(--accent)">${avgTime}s</div><div style="font-size:11px;color:var(--muted);text-transform:uppercase;margin-top:4px">Avg Speed</div></div>
      </div>

      <div style="padding:24px">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:15px">
          <div style="width:36px;height:36px;border-radius:12px;background:linear-gradient(135deg,#3B82F6,#2563EB);display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(59,130,246,.3)">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" width="18" height="18"><polygon points="13,2 3,14 12,14 11,22 21,10 12,10"/></svg>
          </div>
          <div>
            <div style="font-size:12px;font-weight:800;color:#3B82F6;text-transform:uppercase;letter-spacing:.5px">AI Placement Suggestions</div>
            <div style="font-size:14px;font-weight:700;color:${aiColor}">${aiTitle}</div>
          </div>
        </div>
        <div id="mnc-ai-text" style="background:var(--surface2);border:1px solid var(--border);border-radius:16px;padding:18px;font-size:14px;line-height:1.7;color:var(--text);box-shadow:inset 0 2px 4px rgba(0,0,0,.05)">
          Generating personalized corporate feedback...
        </div>
      </div>

      <div style="padding:0 24px 28px;display:flex;gap:12px">
        <button class="btn btn-p" style="flex:1;height:48px;justify-content:center" onclick="document.getElementById('mnc-summary-overlay').remove();ss('mnc','nav-mnc')">Return to Hub</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  fetchSkillyFeedback(state.mncActive, correct, pct, avgTime).then(fb => {
    const el = document.getElementById('mnc-ai-text');
    if (el) el.textContent = fb;
  });

  _logPracticeResult({
    student_id: (typeof currentUser !== 'undefined' ? currentUser.roll : null) || 'GUEST',
    module_id: 'mnc_simulation',
    company: state.mncActive,
    score: pct,
    correct_answers: correct,
    avg_speed: avgTime
  });
}


/**
 * 🔍 DEEP REVIEW: Renders an overlay showing every question the student got wrong in the previous attempt
 */
function showTestReview(testRecordId) {
  const history = currentUser.testHistory || [];
  const record = history.find(h => (h._id || h.id) === testRecordId);
  if (!record || !record.answers) {
    showToast("No detailed answer data available for this attempt.");
    return;
  }

  const wrongAnswers = record.answers.filter(a => !a.isCorrect);
  const overlay = document.createElement('div');
  overlay.id = 'test-review-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(10,15,40,.85);backdrop-filter:blur(14px);z-index:1500;display:flex;align-items:center;justify-content:center;padding:20px';

  overlay.innerHTML = `
    <div style="background:var(--surface);border-radius:28px;width:100%;max-width:720px;max-height:85vh;box-shadow:0 40px 100px rgba(0,0,0,.5);overflow:hidden;animation:slideUp .4s ease both;border:1px solid var(--border);display:flex;flex-direction:column">
      <div style="background:var(--surface2);padding:24px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center">
        <div>
          <div style="font-size:11px;font-weight:800;text-transform:uppercase;color:var(--accent);letter-spacing:1px">Attempt Analysis</div>
          <div style="font-size:22px;font-weight:800">${record.testName}</div>
        </div>
        <button class="btn btn-sm" onclick="document.getElementById('test-review-overlay').remove()">Close Review</button>
      </div>
      
      <div style="padding:24px;overflow-y:auto;flex:1" id="review-list">
        ${wrongAnswers.length === 0 ? `
          <div style="padding:60px;text-align:center">
            <div style="font-size:48px;margin-bottom:16px">🎯</div>
            <div style="font-size:18px;font-weight:700">Perfect Score!</div>
            <div style="color:var(--muted)">You didn't miss a single question in this attempt.</div>
          </div>
        ` : wrongAnswers.map((ans, i) => {
    // Note: In a real system, we'd fetch the question text from the bank using index
    // For the institutional portal, we show the index and the correct vs selected diff
    return `
            <div style="background:var(--surface2);border-radius:16px;padding:20px;margin-bottom:16px;border:1px solid var(--border)">
              <div style="display:flex;gap:12px;margin-bottom:12px">
                <div style="width:24px;height:24px;border-radius:6px;background:var(--red);color:white;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800">${i + 1}</div>
                <div style="font-weight:700;font-size:14px">Question #${ans.questionIndex + 1} Analysis</div>
              </div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
                <div style="background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.2);padding:12px;border-radius:10px">
                  <div style="font-size:10px;text-transform:uppercase;color:var(--red);font-weight:800">Your Selection</div>
                  <div style="font-weight:700;font-size:13px">Option ${String.fromCharCode(65 + ans.selected)}</div>
                </div>
                <div style="background:rgba(16,185,129,.1);border:1px solid rgba(16,185,129,.2);padding:12px;border-radius:10px">
                  <div style="font-size:10px;text-transform:uppercase;color:var(--green);font-weight:800">Correct Answer</div>
                  <div style="font-weight:700;font-size:13px">Option ${String.fromCharCode(65 + ans.correct)}</div>
                </div>
              </div>
            </div>
          `;
  }).join('')}
      </div>
      
      <div style="padding:20px;background:var(--surface2);border-top:1px solid var(--border);text-align:center">
        <div style="font-size:12px;color:var(--muted)">AI Coach: Focus on the ${wrongAnswers.length} areas above to improve your score in the next attempt.</div>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
}

// Using jobRoles and ivQs from data.js

var roleIcons = {
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

var ivActiveCat = 'all';
function buildIVGrid() {
  const w = document.getElementById('job-grid'); if (!w) return;
  const filtered = ivActiveCat === 'all' ? jobRoles : jobRoles.filter(r => r.cat === ivActiveCat);
  w.innerHTML = filtered.map(r => `
    <div class="jcard" onclick="startIV('${r.n}')">
      <div class="jico" style="background:${r.cat === 'commerce' ? 'rgba(14,159,110,.12)' : 'var(--purple-l)'};color:${r.cat === 'commerce' ? 'var(--green)' : 'var(--purple)'}">${roleIcons[r.icon] || roleIcons.custom}</div>
      <div class="jname">${r.n}</div>
    </div>`).join('');
}

function filterRoles(cat, el) {
  ivActiveCat = cat;
  document.querySelectorAll('.role-cat-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  buildIVGrid();
}

// ════════ INTERVIEW ENGINE ════════
var ivAnswers = [];
async function startIV(role) {
  state.ivRole = role; state.ivQ = 0; state.ivScore = 85;
  ivAnswers = []; state.ivHistory = [];
  document.getElementById('iv-role-sel').style.display = 'none';
  document.getElementById('iv-active').style.display = 'block';
  document.getElementById('iv-role-title').textContent = role + ' Interview';
  renderIVQ(); renderIVDots(); startIVTimer();

  // Initial AI Opening
  try {
    const prompt = `Start a mock ${role} interview. Ask the first professional question in 1-2 sentences only.`;
    const res = await fetch(SKILLY_API_URL, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'phi3', prompt: prompt, stream: false })
    });
    const data = await res.json();
    const aiQ = data.response?.trim();
    if (aiQ) {
      document.getElementById('iv-question').textContent = aiQ;
      state.ivHistory.push({ role: 'assistant', content: aiQ });
    }
  } catch (e) {
    console.error("AI Init Error:", e);
  }
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
  if (sb) sb.innerHTML = q.sugs.map(s => `
    <div class="sitem">
      <div class="sico" style="background:var(--${s.c}-l);color:var(--${s.c})"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="9" height="9"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg></div>
      <div class="stxt">${s.t}</div>
    </div>`).join('');
}

function startIVTimer() {
  let t = 60; clearInterval(state.ivInterval); updateIVTimer(t);
  document.getElementById('iv-tbar').style.width = '100%';
  state.ivInterval = setInterval(() => {
    t--; updateIVTimer(t);
    document.getElementById('iv-tbar').style.width = `${(t / 60) * 100}%`;
    if (t <= 0) { clearInterval(state.ivInterval); nextIV(); }
  }, 1000);
}

function updateIVTimer(t) {
  const m = Math.floor(t / 60), s = t % 60;
  document.getElementById('iv-timer').textContent = `${m}:${String(s).padStart(2, '0')}`;
}

async function nextIV() {
  clearInterval(state.ivInterval);
  const ans = document.getElementById('iv-ans') ? document.getElementById('iv-ans').value.trim() : '';
  ivAnswers.push({ q: state.ivQ + 1, answered: ans.length > 10 });

  let nextAIQ = null;
  if (ans.length > 5) {
    try {
      state.ivHistory.push({ role: 'user', content: ans });
      const histText = state.ivHistory.slice(-4).map(m => `${m.role === 'assistant' ? 'Interviewer' : 'Candidate'}: ${m.content}`).join('\n');
      const prompt = `${histText}\nCandidate: "${ans}"\nAsk the next interview question in 1 sentence.`;
      const res = await fetch(SKILLY_API_URL, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'phi3', prompt: prompt, stream: false })
      });
      const data = await res.json();
      nextAIQ = data.response?.trim();
      if (nextAIQ) state.ivHistory.push({ role: 'assistant', content: nextAIQ });
    } catch (e) { }
  }

  state.ivQ++;
  if (state.ivQ >= 15) { showInterviewSummary(); return; }
  renderIVQ(); renderIVDots(); startIVTimer();
  if (nextAIQ) document.getElementById('iv-question').textContent = nextAIQ;
}

function skipIV() {
  clearInterval(state.ivInterval);
  ivAnswers.push({ q: state.ivQ + 1, answered: false, skipped: true });
  state.ivQ++;
  showToast('Skipped — time penalty applied');
  if (state.ivQ >= 15) { showInterviewSummary(); return; }
  renderIVQ(); renderIVDots(); startIVTimer();
}

function showInterviewSummary() {
  clearInterval(state.ivInterval);
  document.getElementById('iv-active').style.display = 'none';
  document.getElementById('iv-role-sel').style.display = 'none';

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
        <div style="background:linear-gradient(135deg,#0D2461,var(--purple));padding:22px 24px;text-align:center;position:relative">
          <div style="font-family:'Playfair Display',serif;font-size:22px;font-weight:700;color:white;margin-bottom:4px">Interview Complete!</div>
          <div style="font-size:13px;color:rgba(255,255,255,.75)">${state.ivRole} · ${answered} of 15 questions answered</div>
        </div>
        <div style="padding:24px;display:flex;align-items:center;gap:20px;border-bottom:1px solid var(--border)">
          <div style="position:relative;width:100px;height:100px;flex-shrink:0">
            <svg viewBox="0 0 100 100" width="100" height="100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="var(--surface3)" stroke-width="10"/>
              <circle cx="50" cy="50" r="42" fill="none" stroke="${badgeColor}" stroke-width="10" stroke-dasharray="${Math.round(2.64 * clampedScore)} 264" stroke-linecap="round" transform="rotate(-90 50 50)"/>
              <text x="50" y="46" font-family="'Playfair Display',serif" font-size="22" font-weight="700" fill="${badgeColor}" text-anchor="middle" dominant-baseline="middle">${clampedScore}</text>
              <text x="50" y="64" font-family="Arial,sans-serif" font-size="9" fill="var(--muted)" text-anchor="middle">/100</text>
            </svg>
          </div>
          <div style="flex:1">
            <div style="font-size:13px;color:var(--muted);margin-bottom:4px">Overall Score</div>
            <div style="font-family:'Playfair Display',serif;font-size:28px;font-weight:700;color:var(--text);margin-bottom:6px">${clampedScore} / 100</div>
            <span style="background:${badgeBg};color:${badgeColor};border:1.5px solid ${badgeColor}30;padding:4px 14px;border-radius:20px;font-size:12px;font-weight:700">${badge} Level</span>
          </div>
        </div>
        <div style="padding:20px 24px;border-bottom:1px solid var(--border)">
          <div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.7px;margin-bottom:14px">Detailed Feedback</div>
          ${feedback.map(f => `
            <div style="background:var(--surface2);border-radius:var(--r2);padding:12px 14px;margin-bottom:10px">
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
        <div style="padding:18px 24px;display:flex;gap:8px">
          <button class="btn btn-p" style="flex:1;justify-content:center" onclick="retryInterview()">Try Again</button>
          <button class="btn btn-o" onclick="document.getElementById('iv-summary-overlay').remove();ss('iv','nav-iv')">New Role</button>
        </div>
      </div>
    </div>`;
  document.body.insertAdjacentHTML('beforeend', summaryHTML);
  if (!currentUser.interviewScores) currentUser.interviewScores = [];
  currentUser.interviewScores.push(clampedScore);
  showToast('Interview session saved to profile');
}

function retryInterview() {
  document.getElementById('iv-summary-overlay')?.remove();
  ivAnswers = []; state.ivQ = 0;
  document.getElementById('iv-role-sel').style.display = 'none';
  document.getElementById('iv-active').style.display = 'block';
  renderIVDots(); renderIVQ(); startIVTimer();
}

function onAnsInput(v) {
  const lbl = document.getElementById('auth-lbl');
  if (!lbl) return;
  if (v.length > 60) { lbl.textContent = ' Similarity check running...'; lbl.className = 'badge ba'; }
  else if (v.length > 20) { lbl.textContent = ' Your own words'; lbl.className = 'badge bg'; }
  else { lbl.textContent = 'Waiting for input'; lbl.className = 'badge bgr'; }
}

// ════════ PROFILE ════════
function buildProfile() {
  const nameEl = document.getElementById('profile-name');
  const avEl = document.getElementById('profile-av');
  if (nameEl) nameEl.textContent = currentUser.name;
  if (avEl) avEl.textContent = currentUser.name.slice(0, 2).toUpperCase();

  renderPTab('scores');
}

var profileCharts = {};
function destroyCharts() {
  Object.values(profileCharts).forEach(c => { try { c.destroy(); } catch (e) { } });
  profileCharts = {};
}

function renderPTab(tab, btn) {
  if (btn) {
    document.querySelectorAll('.ptab').forEach(b => b.classList.remove('on'));
    btn.classList.add('on');
  }

  const cont = document.getElementById('ptab-content');
  if (!cont) return;
  destroyCharts();

  if (tab === 'scores') {
    const ps = currentUser.practiceScores || { logical: [], quant: [], verbal: [], di: [] };
    const avg = arr => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;
    const subjAvgs = [avg(ps.logical), avg(ps.quant), avg(ps.verbal), avg(ps.di)];
    const hasData = subjAvgs.some(v => v > 0);

    cont.innerHTML = `
      <div class="g3" style="margin-bottom:14px">
        <div class="card-sm" style="text-align:center">
          <div style="font-family:'Playfair Display',serif;font-size:28px;font-weight:700;color:var(--accent)">#${currentUser.nationalRank || '—'}</div>
          <div style="font-size:11px;color:var(--muted);margin-top:3px">Campus Rank</div>
        </div>
        <div class="card-sm" style="text-align:center">
          <div style="font-family:'Playfair Display',serif;font-size:28px;font-weight:700;color:var(--green)">${currentUser.avgAccuracy}%</div>
          <div style="font-size:11px;color:var(--muted);margin-top:3px">Avg accuracy</div>
        </div>
        <div class="card-sm" style="text-align:center">
          <div style="font-family:'Playfair Display',serif;font-size:28px;font-weight:700;color:var(--amber)">${currentUser.streak}</div>
          <div style="font-size:11px;color:var(--muted);margin-top:3px">Day streak</div>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px">
        <div class="card">
          <div class="ct">Your accuracy by subject</div>
          <div class="comp-grid" id="practice-acc-grid">
            <!-- Dynamically generated Chart Containers -->
          </div>
        </div>
        <div class="card">
          <div class="ct">Competency Map</div>
          <div style="height:250px"><canvas id="prof-chart-radar"></canvas></div>
        </div>
      </div>
      <div class="card">
        <div class="ct">Long-term Performance Trend</div>
        <div style="height:200px"><canvas id="prof-chart-2"></canvas></div>
      </div>
    `;

    setTimeout(() => {
      const cr = document.getElementById('prof-chart-radar')?.getContext('2d');
      if (cr) profileCharts.radar = new Chart(cr, {
        type: 'radar',
        data: {
          labels: ['Logical', 'Quant', 'Verbal', 'DI', 'Tech', 'Aptitude'],
          datasets: [{
            label: 'Current Skill Level',
            data: [...subjAvgs, Math.max(70, currentUser.avgAccuracy), 85],
            backgroundColor: 'rgba(27, 111, 230, 0.2)',
            borderColor: '#1B6FE6',
            borderWidth: 2,
            pointBackgroundColor: '#1B6FE6'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            r: { angleLines: { display: false }, suggestedMin: 0, suggestedMax: 100, ticks: { display: false } }
          },
          plugins: { legend: { display: false } }
        }
      });

      const c1 = document.getElementById('prof-chart-1')?.getContext('2d');
      if (c1) profileCharts.pie = new Chart(c1, {
        type: 'doughnut',
        data: {
          labels: ['Logical', 'Quant', 'Verbal', 'DI'],
          datasets: [{
            data: subjAvgs.map(v => v || 25),
            backgroundColor: ['#1B6FE6', '#0E9F6E', '#6C5CE7', '#F59E0B'],
            borderWidth: 4,
            borderColor: '#ffffff',
            borderRadius: 6
          }]
        },
        options: { cutout: '72%', plugins: { legend: { display: false } } }
      });

      const cEl2 = document.getElementById('prof-chart-2');
      if (cEl2) {
        const c2 = cEl2.getContext('2d');
        const g2 = c2.createLinearGradient(0, 0, 0, 200);
        g2.addColorStop(0, 'rgba(108, 92, 231, 0.2)');
        g2.addColorStop(1, 'rgba(108, 92, 231, 0)');

        profileCharts.line = new Chart(c2, {
          type: 'line',
          data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
              label: 'Accuracy',
              data: [65, 78, 72, 85, 80, 92, 88],
              borderColor: '#6C5CE7',
              backgroundColor: g2,
              fill: true,
              tension: 0.4,
              borderWidth: 3,
              pointRadius: 4,
              pointBackgroundColor: '#fff',
              pointBorderColor: '#6C5CE7'
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true, max: 100 }, x: { grid: { display: false } } }
          }
        });
      }
    }, 50);
  } else if (tab === 'interviews') {
    const scores = currentUser.interviewScores || [];
    cont.innerHTML = `
      <div class="card">
        <div class="ct">Interview Performance History</div>
        ${scores.length === 0 ? '<div style="padding:40px;text-align:center;color:var(--muted)">No sessions yet.</div>' : `
          <table>
            <thead><tr><th>Role</th><th>Score</th><th>Status</th></tr></thead>
            <tbody>
              ${scores.map((s, i) => `
                <tr>
                  <td>Mock Interview ${i + 1}</td>
                  <td><span style="font-weight:700;color:var(--accent)">${s}/100</span></td>
                  <td><span class="badge bg">Completed</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `}
      </div>
    `;
  } else if (tab === 'achievements') {
    const allBadges = [
      { id: 'streak-3', name: '3-Day Streak', icon: '🔥', text: 'Maintain consistency' },
      { id: 'practice-5', name: 'Practice Pro', icon: '📚', text: '5+ practice sessions' },
      { id: 'accuracy-90', name: 'High Flyer', icon: '🎯', text: 'Hit 90% accuracy' }
    ];

    cont.innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
        ${allBadges.map(b => {
      const earned = (currentUser.streak >= 3 && b.id === 'streak-3') || (currentUser.testsCompleted >= 5 && b.id === 'practice-5') || (currentUser.avgAccuracy >= 90 && b.id === 'accuracy-90');
      return `
            <div class="card-sm" style="opacity:${earned ? 1 : 0.4};text-align:center;border-style:${earned ? 'solid' : 'dashed'}">
              <div style="font-size:32px;margin-bottom:8px">${b.icon}</div>
              <div style="font-weight:700;font-size:14px">${b.name}</div>
              <div style="font-size:11px;color:var(--muted)">${earned ? 'Earned' : 'Locked'} · ${b.text}</div>
            </div>
          `;
    }).join('')}
      </div>
    `;
  } else if (tab === 'openroles') {
    const roles = [
      { title: 'Software Engineer', co: 'TCS', loc: 'Bangalore', salary: '6.5 — 8 LPA', status: 'Matching' },
      { title: 'Frontend Developer', co: 'Infosys', loc: 'Pune', salary: '5.5 — 7.2 LPA', status: 'High Match' },
      { title: 'Data Analyst', co: 'Zoho', loc: 'Chennai', salary: '7.8 LPA', status: 'Applied' }
    ];
    cont.innerHTML = `
      <div class="card">
        <div class="ct">Placement Opportunities</div>
        ${roles.map(r => `
          <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid var(--border)">
            <div>
              <div style="font-weight:700;font-size:14px">${r.title}</div>
              <div style="font-size:12px;color:var(--muted)">${r.co} · ${r.loc} · ${r.salary}</div>
            </div>
            <button class="btn btn-sm ${r.status === 'Applied' ? 'btn-o' : 'btn-p'}" onclick="${r.status === 'Applied' ? '' : 'applyForJob(\'' + r.title + '\',\'' + r.co + '\')'}">${r.status === 'Applied' ? 'Status: Pending' : 'Apply Now'}</button>
          </div>
        `).join('')}
      </div>
    `;
  }
}

async function applyForJob(title, co) {
  const dbId = currentUser.id || currentUser.studentId;
  const collegeId = currentUser.collegeId?._id || currentUser.college_id;

  if (dbId && collegeId) {
    try {
      await apiFetch(`/students/${dbId}/apply`, {
        method: 'POST',
        body: JSON.stringify({
          jobId: 'JD-' + Math.floor(Math.random() * 9000),
          title,
          company: co,
          college_id: collegeId
        })
      });
      showToast(`Applied successfully to ${co}!`);

      // Update local state for immediate feedback
      if (!currentUser.jobApplications) currentUser.jobApplications = [];
      currentUser.jobApplications.push({ title, company: co, appliedAt: new Date() });

      renderPTab('openroles');
    } catch (e) {
      showToast('Application failed');
    }
  }
}


// ════════ RESUME BUILDER ════════
function buildResumePreview() {
  const template = state.rmTemplate || 'classic';
  const area = document.getElementById('resumeExportArea');
  if (!area) return;

  const data = {
    name: document.getElementById('editName')?.value || currentUser.name || 'Alex Morgan',
    title: document.getElementById('editTitle')?.value || 'Full Stack Developer',
    email: document.getElementById('editEmail')?.value || currentUser.email || 'alex@example.com',
    phone: document.getElementById('editPhone')?.value || '+1 234 567 890',
    loc: document.getElementById('editLocation')?.value || 'San Francisco, CA',
    summary: document.getElementById('editSummary')?.value || '',
    skills: document.getElementById('editSkills')?.value || '',
    edu: document.getElementById('editEducation')?.value || '',
    ach: document.getElementById('editAchievements')?.value || '',
    expCo: document.getElementById('editExpCompany')?.value || 'Google',
    expTi: document.getElementById('editExpTitle')?.value || 'Software Engineer',
    expDe: document.getElementById('editExpDesc')?.value || 'Working on scalable cloud solutions.'
  };

  // ☁️ SYNC TO CLOUD PROFILE (Only when specifically triggered or on preview)
  const dbId = currentUser.id || currentUser.studentId;
  const collegeId = currentUser.collegeId?._id || currentUser.college_id;
  if (dbId && collegeId) {
    apiFetch(`/students/${dbId}/resume`, {
      method: 'POST',
      body: JSON.stringify({ resumeData: data, college_id: collegeId })
    }).then(() => console.log('[RESUME] Synchronized with cloud profile'))
      .catch(e => console.warn('[RESUME] Cloud sync failed', e));
  }

  // 🛰️ CLOUD SYNC: Bank data for 10s Heartbeat
  if (typeof localPersistentState !== 'undefined') {
    localPersistentState.progress.resumeData = data;
  }

  let html = '';
  if (template === 'classic') {
    html = `
      <div style="padding:40px;background:white;color:#333;font-family:serif;min-height:500px">
        <center>
          <h1 style="margin:0;font-size:28px;text-transform:uppercase">${data.name}</h1>
          <p style="margin:5px 0;font-size:13px">${data.email} | ${data.phone} | ${data.loc}</p>
        </center>
        <hr style="border:0;border-top:1px solid #333;margin:20px 0">
        <div style="margin-bottom:20px">
          <h3 style="font-size:14px;text-transform:uppercase;border-bottom:1px solid #eee;padding-bottom:4px">Summary</h3>
          <p style="font-size:12px;line-height:1.6">${data.summary}</p>
        </div>
        <div style="margin-bottom:20px">
          <h3 style="font-size:14px;text-transform:uppercase;border-bottom:1px solid #eee;padding-bottom:4px">Experience</h3>
          <div style="display:flex;justify-content:space-between;font-weight:700;font-size:12px">
            <span>${data.expCo}</span>
            <span>2022 — Present</span>
          </div>
          <div style="font-style:italic;font-size:12px;margin-bottom:5px">${data.expTi}</div>
          <p style="font-size:12px;line-height:1.6;margin:0">${data.expDe}</p>
        </div>
        <div style="margin-bottom:20px">
          <h3 style="font-size:14px;text-transform:uppercase;border-bottom:1px solid #eee;padding-bottom:4px">Education</h3>
          <p style="font-size:12px;line-height:1.6">${data.edu.replace(/\n/g, '<br>')}</p>
        </div>
        <div>
          <h3 style="font-size:14px;text-transform:uppercase;border-bottom:1px solid #eee;padding-bottom:4px">Achievements</h3>
          <p style="font-size:12px;line-height:1.6">${data.ach.replace(/\n/g, '<br>')}</p>
        </div>
      </div>
    `;
  } else if (template === 'modern') {
    html = `
      <div style="display:grid;grid-template-columns:200px 1fr;min-height:500px">
        <div style="background:#2c3e50;color:white;padding:30px">
          <h2 style="font-size:20px;margin:0 0 20px 0">${data.name}</h2>
          <div style="font-size:11px;margin-bottom:20px;line-height:1.8">
            <div>${data.email}</div>
            <div>${data.phone}</div>
            <div>${data.loc}</div>
          </div>
          <h3 style="font-size:12px;text-transform:uppercase;margin-bottom:10px">Skills</h3>
          <div style="font-size:11px;line-height:1.8">${data.skills.split(',').join('<br>')}</div>
        </div>
        <div style="background:white;padding:30px;color:#2c3e50">
          <h1 style="margin:0;font-size:24px">${data.title}</h1>
          <hr style="border:0;border-top:2px solid #2c3e50;width:50px;margin:15px 0">
          <p style="font-size:12px;line-height:1.6;margin-bottom:25px">${data.summary}</p>
          <h3 style="font-size:14px;text-transform:uppercase;margin-bottom:10px">Work Experience</h3>
          <div style="margin-bottom:20px">
            <div style="font-weight:700;font-size:13px">${data.expTi}</div>
            <div style="font-size:12px;color:#7f8c8d;margin-bottom:5px">${data.expCo} | 2022 - Present</div>
            <p style="font-size:12px;line-height:1.6">${data.expDe}</p>
          </div>
          <h3 style="font-size:14px;text-transform:uppercase;margin-bottom:10px">Education</h3>
          <p style="font-size:12px;line-height:1.6;margin-bottom:20px">${data.edu.replace(/\n/g, '<br>')}</p>
          <h3 style="font-size:14px;text-transform:uppercase;margin-bottom:10px">Achievements</h3>
          <p style="font-size:12px;line-height:1.6">${data.ach.replace(/\n/g, '<br>')}</p>
        </div>
      </div>
    `;
  } else {
    html = `
      <div style="padding:40px;background:#f8f9fa;color:#1a1a1a;font-family:sans-serif;min-height:500px">
        <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:40px">
          <div>
            <h1 style="margin:0;font-size:32px;font-weight:800">${data.name}</h1>
            <div style="font-size:14px;color:var(--accent);font-weight:600">${data.title}</div>
          </div>
          <div style="text-align:right;font-size:12px;color:#666">
            <div>${data.email}</div>
            <div>${data.phone}</div>
          </div>
        </div>
        <div style="margin-bottom:30px">
          <p style="font-size:13px;line-height:1.7;color:#444">${data.summary}</p>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:30px">
          <div>
            <h3 style="font-size:12px;text-transform:uppercase;letter-spacing:1px;margin-bottom:15px">Experience</h3>
            <div style="font-weight:700;font-size:13px">${data.expCo}</div>
            <div style="font-size:11px;color:#999;margin-bottom:5px">${data.expTi}</div>
            <p style="font-size:12px;color:#555">${data.expDe}</p>
          </div>
          <div>
            <h3 style="font-size:12px;text-transform:uppercase;letter-spacing:1px;margin-bottom:15px">Expertise</h3>
            <div style="display:flex;flex-wrap:wrap;gap:8px">
              ${data.skills.split(',').map(s => `<span style="background:#fff;border:1px solid #eee;padding:4px 10px;border-radius:4px;font-size:11px">${s.trim()}</span>`).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  }
  area.innerHTML = html;
}

function syncResumeFields() { buildResumePreview(); }
function setResumeTemplate(t) {
  state.rmTemplate = t;
  document.querySelectorAll('.template-card').forEach(c => c.classList.remove('active'));
  document.querySelector(`[data-template="${t}"]`)?.classList.add('active');
  buildResumePreview();
}

/**
 * 🖋️ RESUME RECALL: Hydrates all inputs from Cloud Profile
 */
function prefillResumeFields() {
  if (!currentUser.resumeData) return;
  const d = currentUser.resumeData;
  const fields = {
    'editName': d.name,
    'editTitle': d.title,
    'editEmail': d.email,
    'editPhone': d.phone,
    'editLocation': d.loc,
    'editSummary': d.summary,
    'editSkills': d.skills,
    'editEducation': d.edu,
    'editAchievements': d.ach,
    'editExpCompany': d.expCo,
    'editExpTitle': d.expTi,
    'editExpDesc': d.expDe
  };
  Object.keys(fields).forEach(id => {
    const el = document.getElementById(id);
    if (el && fields[id]) el.value = fields[id];
  });
  buildResumePreview();
}

// ════════ LEADERBOARD ════════
function buildLeaderboard() {
  const list = document.getElementById('lb-list');
  if (!list) return;

  const getBadgeImg = (b) => {
    if (b === 'Expert') return 'assets/expert.jpeg';
    if (b === 'Advanced') return 'assets/advance.png.jpeg';
    if (b === 'Proficient') return 'assets/proficientjpeg.jpeg';
    return 'assets/beginner.jpeg';
  };

  const mockPeers = [
    { rank: 1, name: 'Siddharth V.', email: 'sid.v@univ.edu', apt: 92, iv: 88, score: 2840, badge: 'Expert', av: 'SV' },
    { rank: 2, name: 'Ananya R.', email: 'ananya.r@univ.edu', apt: 88, iv: 94, score: 2715, badge: 'Expert', av: 'AR' },
    { rank: 3, name: 'Kevin D.', email: 'kevin.d@univ.edu', apt: 85, iv: 82, score: 2680, badge: 'Advanced', av: 'KD' },
    { rank: 4, name: 'Priya M.', email: 'priya.m@univ.edu', apt: 82, iv: 78, score: 2550, badge: 'Advanced', av: 'PM' },
    { rank: 5, name: 'Rahul S.', email: 'rahul.s@univ.edu', apt: 78, iv: 72, score: 2420, badge: 'Proficient', av: 'RS' }
  ];

  // Insert current user into leaderboard
  const userRank = {
    rank: 142,
    name: currentUser.name,
    email: currentUser.email || 'student@univ.edu',
    apt: Math.round(currentUser.avgAccuracy) || 68,
    iv: 75,
    score: (currentUser.testsCompleted * 100) + (currentUser.avgAccuracy * 10),
    badge: 'Expert',
    av: currentUser.initials,
    isUser: true
  };

  const allEntries = [...mockPeers.slice(0, 5), userRank];

  const header = `
    <div class="lb-item header" style="background:transparent; border:none; padding: 0 20px 8px; font-size:11px; font-weight:700; color:var(--muted); text-transform:uppercase; letter-spacing:0.5px">
      <div style="width:50px">Rank</div>
      <div style="flex:1">Talent Details</div>
      <div style="width:100px; text-align:center">Aptitude</div>
      <div style="width:100px; text-align:center">Interview</div>
      <div style="width:120px; text-align:right">Badge & Score</div>
    </div>
  `;

  list.innerHTML = header + allEntries.map(i => `
    <div class="lb-item ${i.isUser ? 'active' : ''} ${i.rank <= 3 ? 'rank-' + i.rank : ''}">
      <div class="lb-rank" style="width:50px">${i.rank}</div>
      <div class="lb-details" style="flex:1; display:flex; align-items:center; gap:12px">
        <div class="appr-avatar" style="width:34px; height:34px; background:var(--surface2); color:var(--accent); border:1px solid var(--border); font-size:12px; flex-shrink:0">
          ${i.av || '??'}
        </div>
        <div style="min-width:0">
          <div class="lb-name" style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis">${i.name}</div>
          <div class="lb-email" style="font-size:11px;color:var(--muted)">${i.email}</div>
        </div>
      </div>
      <div class="lb-stats" style="width:100px; text-align:center">
        <div style="font-weight:700; font-size:14px; color:var(--accent)">${i.apt}%</div>
        <div style="font-size:9px; color:var(--muted); text-transform:uppercase">Accuracy</div>
      </div>
      <div class="lb-stats" style="width:100px; text-align:center">
        <div style="font-weight:700; font-size:14px; color:var(--purple)">${i.iv}%</div>
        <div style="font-size:9px; color:var(--muted); text-transform:uppercase">Rating</div>
      </div>
      <div class="lb-score-grid" style="width:120px; text-align:right">
        <img src="${getBadgeImg(i.badge)}" class="badge-scrub" style="height:32px; width:auto; transform:scale(1.1)" alt="${i.badge}">
        <div class="lb-score-val" style="font-size:16px">${Math.round(i.score)} <span style="font-size:10px; opacity:0.6">PTS</span></div>
      </div>
    </div>
  `).join('');
}

function exportPdfResume() { showToast("PDF generated and downloaded!"); }
function boostAtsResume() { showToast("AI has added 12 relevant keywords to your profile!"); }


// Init
window.addEventListener('DOMContentLoaded', () => {
  // Ensure modules are ready on load
  if (state.activeScreen === 'dash') buildDash();

  // Initialize grid components
  buildIVGrid();
  buildMNCGrid();

  // Handle sidebar clicks
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      const screenId = item.getAttribute('onclick')?.match(/'([^']+)'/)?.[1];
      if (screenId) {
        if (screenId === 'practice') buildPractice();
        if (screenId === 'tests') buildTests();
        if (screenId === 'iv') buildIVGrid();
        if (screenId === 'mnc') buildMNCGrid();
        if (screenId === 'prof') buildProfile();
        if (screenId === 'lb') buildLeaderboard();
        if (screenId === 'resume') prefillResumeFields();
      }
    });
  });
});

// ════════ PLACEMENT SUBMISSION LOGIC ════════
function buildPlacementForm() {
  const nameInput = document.getElementById('pls-name');
  const rollInput = document.getElementById('pls-roll');
  if (nameInput) nameInput.value = activeUser ? activeUser.name : 'Institutional Student';
  if (rollInput) rollInput.value = activeUser ? activeUser.roll : '22CS001';
  document.getElementById('pls-date').valueAsDate = new Date();
}

function handlePlsProof(input) {
  const nameEl = document.getElementById('pls-proof-name');
  if (input.files && input.files[0]) {
    nameEl.textContent = 'Selected: ' + input.files[0].name;
    nameEl.style.color = 'var(--green)';
  }
}

function submitPlacementUpdate() {
  const company = document.getElementById('pls-company').value.trim();
  const role = document.getElementById('pls-role').value.trim();
  const lpa = parseFloat(document.getElementById('pls-lpa').value);
  const mode = document.getElementById('pls-mode').value;
  const work = document.getElementById('pls-work').value;
  const status = document.getElementById('pls-status').value;
  const loc = document.getElementById('pls-loc').value.trim();
  const date = document.getElementById('pls-date').value;

  if (!company || !role || isNaN(lpa)) {
    showToast('Please fill all required placement fields');
    return;
  }

  const newRecord = {
    id: Date.now(),
    name: activeUser ? activeUser.name : 'Unknown Student',
    roll: activeUser ? activeUser.roll : 'N/A',
    dept: document.getElementById('pls-dept').value,
    batch: document.getElementById('pls-batch').value,
    company,
    role,
    lpa,
    mode,
    workType: work,
    status,
    location: loc || 'Remote',
    date: date || new Date().toLocaleDateString(),
    proof: 'uploaded_document.pdf',
    verification: 'Pending',
    timestamp: new Date()
  };

  // Add to global state
  placementRecords.unshift(newRecord);
  savePlacements();

  showToast('Placement data submitted successfully. Redirecting...');
  setTimeout(() => {
    ss('dash', 'nav-dash');
    // Clear form
    document.getElementById('pls-company').value = '';
    document.getElementById('pls-role').value = '';
    document.getElementById('pls-lpa').value = '';
    document.getElementById('pls-proof-name').textContent = 'Upload Offer Letter (PDF/Image)';
    document.getElementById('pls-proof-name').style.color = 'var(--muted)';
  }, 1500);
}
