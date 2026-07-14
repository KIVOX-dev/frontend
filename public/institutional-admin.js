// ════════ INSTITUTIONAL ADMIN REAL-TIME SYNC ════════
let dashSyncInterval = null;
/* MOVED VARS TO core.js */

function startDashboardSync() {
  if (dashSyncInterval) clearInterval(dashSyncInterval);
  /* MOVED SYNC LOGIC TO core.js */
}

async function buildCadmDash() {
  try {
    const result = await apiFetch('/dashboard/admin');

    if (result.success) {
      const { overview } = result.data;

      // Update Top Stat Cards
      const stats = [
        { id: 'cadm-stat-students', val: overview.totalStudents },
        { id: 'cadm-stat-placed', val: overview.totalPlaced },
        { id: 'cadm-stat-jobs', val: overview.totalPlaced || 0 },
        { id: 'cadm-stat-companies', val: overview.totalFaculty || 0 },
        { id: 'cadm-stat-openings', val: (overview.totalPlaced * 3) || 0 }
      ];

      stats.forEach(s => {
        const el = document.getElementById(s.id);
        if (el) el.textContent = s.val.toLocaleString();
      });

      // Update Placement Overview Section
      const placementFields = [
        { id: 'cadm-overview-applying', val: overview.totalApplying },
        { id: 'cadm-overview-placed', val: overview.totalPlaced },
        { id: 'cadm-overview-notplaced', val: overview.notPlacedCount },
        { id: 'cadm-overview-oncampus', val: overview.onCampusCount },
        { id: 'cadm-overview-offcampus', val: overview.offCampusCount }
      ];

      placementFields.forEach(f => {
        const el = document.getElementById(f.id);
        if (el) el.textContent = f.val.toLocaleString();
      });

      // Update Labels and Bar
      const applyingPct = overview.totalStudents > 0 ? Math.round((overview.totalApplying / overview.totalStudents) * 100) : 0;
      const appLabel = document.getElementById('cadm-overview-applying-label');
      if (appLabel) appLabel.textContent = `Applying (${applyingPct}%)`;

      const placedLabel = document.getElementById('cadm-overview-placed-label');
      if (placedLabel) placedLabel.textContent = `Placed (${overview.placementRate}%)`;

      const rateText = document.getElementById('cadm-overview-rate-text');
      if (rateText) rateText.textContent = overview.placementRate + '%';

      const rateBar = document.getElementById('cadm-overview-rate-bar');
      if (rateBar) rateBar.style.width = overview.placementRate + '%';

      // Update Salary Overview
      const salAvg = document.getElementById('cadm-sal-avg');
      if (salAvg) salAvg.textContent = '₹ ' + (overview.avgSalary || 0) + ' LPA';

      const salMin = document.getElementById('cadm-sal-min');
      if (salMin) salMin.textContent = '₹ ' + (overview.minSalary || 0) + ' LPA';

      const salMax = document.getElementById('cadm-sal-max');
      if (salMax) salMax.textContent = '₹ ' + (overview.maxSalary || 0) + ' LPA';

      // Update Dashboard Title with College Name
      const dashTitle = document.querySelector('#screen-cadm-dash .pt');
      if (dashTitle && activeCollege) {
        dashTitle.textContent = activeCollege + ' Dashboard';
      }
    }
  } catch (err) {
    console.warn('Dashboard sync skipped (Offline or No Permission)');
  }
}
cadmActiveDept = 'all';
cadmAllStudents = [];

function filterByDept(dept, el) {
  cadmActiveDept = dept;
  document.querySelectorAll('.col-sel-chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  applyFilters();
}

// ════════ SHARED FILTER HELPER ════════
// Single source of truth — used by table rendering, Excel, and Word downloads

/* HELPERS MOVED TO core.js */

// ════════ ASSESSMENT MANAGEMENT ════════
let selectedAssessDepts = [];

async function loadAdminAssessments() {
  const list = document.getElementById('cadm-assess-list');
  const resSelect = document.getElementById('res-assess-filter');
  if (!list) return;

  try {
    const res = await apiFetch('/assessments');
    if (res.success) {
      const assessments = res.data;

      // Update Assessment List Table
      list.innerHTML = assessments.map((a, i) => `
        <tr>
          <td>${i + 1}</td>
          <td><b>${a.title}</b></td>
          <td><span class="cpill cpill-blue">${a.type.toUpperCase()}</span></td>
          <td>${a.questionCount}</td>
          <td>${a.duration} min</td>
          <td>${a.departments.join(', ')}</td>
          <td>${a.dueDate ? new Date(a.dueDate).toLocaleDateString() : 'No Deadline'}</td>
          <td><span class="cpill ${a.status === 'active' ? 'cpill-green' : 'cpill-amber'}">${a.status}</span></td>
          <td>
            <div style="display:flex;gap:4px">
              <span class="aib" title="View Results" onclick="switchAssessTab('results'); document.getElementById('res-assess-filter').value='${a._id}'; loadAssessmentResults('${a._id}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg></span>
              <span class="aib" title="Delete" onclick="deleteAssessment('${a._id}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><polyline points="3,6 5,6 21,6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6" /></svg></span>
            </div>
          </td>
        </tr>
      `).join('');

      // Update Results Filter Select
      const currentVal = resSelect.value;
      resSelect.innerHTML = '<option value="">Select Assessment</option>' +
        assessments.map(a => `<option value="${a._id}">${a.title}</option>`).join('');
      resSelect.value = currentVal;
    }
  } catch (err) {
    console.error('Failed to load assessments:', err);
  }
}

function switchAssessTab(tab) {
  document.querySelectorAll('.assess-tab-pane').forEach(p => p.style.display = 'none');
  document.querySelectorAll('.cadm-tab').forEach(t => t.classList.remove('active'));

  const target = document.getElementById(`assess-content-${tab}`);
  if (target) target.style.display = 'block';

  const tabBtn = document.querySelector(`.cadm-tab[data-assess-tab="${tab}"]`);
  if (tabBtn) tabBtn.classList.add('active');

  if (tab === 'all') loadAdminAssessments();
  if (tab === 'overview') loadAssessmentOverview();
}

async function openCreateAssessmentModal() {
  const modal = document.getElementById('create-assess-modal');
  modal.style.display = 'flex';
  setTimeout(() => modal.classList.add('active'), 10);

  // Clear form
  document.getElementById('assess-title').value = '';
  document.getElementById('assess-count').value = '20';
  document.getElementById('assess-duration').value = '30';
  document.getElementById('assess-date').value = '';
  selectedAssessDepts = [];
  renderAssessDeptChips();

  // Populate depts from active college
  const deptSelect = document.getElementById('assess-dept-select');
  try {
    const res = await apiFetch('/colleges/me');
    if (res.success && res.data.departments) {
      deptSelect.innerHTML = '<option value="All">All Departments</option>' +
        res.data.departments.map(d => `<option value="${d}">${d}</option>`).join('');
    } else {
      deptSelect.innerHTML = '<option value="All">All Departments</option><option value="CSE">CSE</option><option value="ECE">ECE</option><option value="MECH">MECH</option>';
    }
  } catch (err) {
    deptSelect.innerHTML = '<option value="All">All Departments</option>';
  }
}

function closeCreateAssessmentModal() {
  const modal = document.getElementById('create-assess-modal');
  modal.classList.remove('active');
  setTimeout(() => modal.style.display = 'none', 300);
}

function addAssessDept() {
  const val = document.getElementById('assess-dept-select').value;
  if (val && !selectedAssessDepts.includes(val)) {
    if (val === 'All') selectedAssessDepts = ['All'];
    else {
      selectedAssessDepts = selectedAssessDepts.filter(d => d !== 'All');
      selectedAssessDepts.push(val);
    }
    renderAssessDeptChips();
  }
}

function renderAssessDeptChips() {
  const cont = document.getElementById('assess-dept-chips');
  if (!cont) return;
  cont.innerHTML = selectedAssessDepts.map(d => `
    <span class="cpill cpill-blue" style="padding: 4px 10px; display:flex; align-items:center; gap:6px">
      ${d}
      <svg onclick="removeAssessDept('${d}')" style="cursor:pointer" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" width="10" height="10"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
    </span>
  `).join('');
}

function removeAssessDept(dept) {
  selectedAssessDepts = selectedAssessDepts.filter(d => d !== dept);
  renderAssessDeptChips();
}

async function saveAssessment() {
  const payload = {
    title: document.getElementById('assess-title').value,
    type: document.getElementById('assess-type').value,
    questionCount: parseInt(document.getElementById('assess-count').value),
    duration: parseInt(document.getElementById('assess-duration').value),
    departments: selectedAssessDepts,
    dueDate: document.getElementById('assess-date').value,
    difficulty: document.getElementById('assess-difficulty').value,
    negativeMarking: document.getElementById('assess-neg').checked
  };

  if (!payload.title || payload.departments.length === 0) {
    return showToast('Title and Departments are required');
  }

  try {
    const res = await apiFetch('/assessments', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    if (res.success) {
      showToast('Assessment Published Successfully!');
      closeCreateAssessmentModal();
      loadAdminAssessments();
    }
  } catch (err) {
    showToast(err.message);
  }
}

let currentResultsData = [];

async function loadAssessmentResults(id) {
  if (!id) {
    id = document.getElementById('res-assess-filter').value;
    if (!id) return;
  }
  const list = document.getElementById('cadm-res-list');
  list.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 40px;">Loading results...</td></tr>';

  try {
    const res = await apiFetch(`/assessments/${id}/results`);
    if (res.success) {
      currentResultsData = res.data;
      applyResultsFilter();
    }
  } catch (err) {
    showToast('Failed to load results');
  }
}

function applyResultsFilter() {
  const deptFilter = document.getElementById('res-dept-filter').value;
  const scoreFilter = document.getElementById('res-score-filter').value;
  const list = document.getElementById('cadm-res-list');

  if (!currentResultsData || currentResultsData.length === 0) {
    list.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 40px; color: var(--muted)">No students have attempted this assessment yet.</td></tr>';
    return;
  }

  let filtered = currentResultsData;

  if (deptFilter !== 'all') {
    filtered = filtered.filter(r => (r.studentId?.department || '').toLowerCase() === deptFilter.toLowerCase());
  }

  if (scoreFilter === 'pass') {
    filtered = filtered.filter(r => r.percentage >= 60);
  } else if (scoreFilter === 'fail') {
    filtered = filtered.filter(r => r.percentage < 60);
  }

  if (filtered.length === 0) {
    list.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 40px; color: var(--muted)">No students match the selected criteria.</td></tr>';
    return;
  }

  list.innerHTML = filtered.map(r => `
    <tr>
      <td><b>${r.studentId?.name || 'Unknown'}</b></td>
      <td>${r.studentId?.studentId || 'N/A'}</td>
      <td>${r.studentId?.department || 'N/A'}</td>
      <td>${r.score} / ${r.maxScore}</td>
      <td><span class="cpill ${r.percentage >= 60 ? 'cpill-green' : 'cpill-amber'}">${r.percentage}%</span></td>
      <td>${r.timeTaken || 0}s</td>
      <td>${new Date(r.createdAt).toLocaleDateString()}</td>
    </tr>
  `).join('');
}

async function deleteAssessment(id) {
  if (!confirm('Are you sure you want to delete this assessment?')) return;
  try {
    const res = await apiFetch(`/assessments/${id}`, { method: 'DELETE' });
    if (res.success) {
      showToast('Assessment Deleted');
      loadAdminAssessments();
    }
  } catch (err) {
    showToast(err.message);
  }
}

let overviewCategoryChart = null;
let overviewScoresChart = null;

async function loadAssessmentOverview() {
  const deptFilter = document.getElementById('overview-dept-filter').value;
  const dateFilter = document.getElementById('overview-date-filter').value;

  try {
    const res = await apiFetch(`/assessments/overview/stats?days=${dateFilter}&dept=${deptFilter}`);
    if (!res.success) return;
    const stats = res.data;

    document.getElementById('ov-total-assess').textContent = stats.totalAssessments.toLocaleString();
    document.getElementById('ov-total-attempts').textContent = stats.totalAttempts.toLocaleString();
    document.getElementById('ov-avg-score').textContent = stats.avgOverallScore + '%';

    const ctxCat = document.getElementById('ov-category-chart').getContext('2d');
    if (overviewCategoryChart) overviewCategoryChart.destroy();
    overviewCategoryChart = new Chart(ctxCat, {
      type: 'doughnut',
      data: {
        labels: ['Quantitative', 'Verbal', 'Logical', 'Data Interpretation', 'Mixed'],
        datasets: [{
          data: [
            stats.categoryCounts.quantitative || 0,
            stats.categoryCounts.verbal || 0,
            stats.categoryCounts.logical || 0,
            stats.categoryCounts.di || 0,
            stats.categoryCounts.mixed || 0
          ],
          backgroundColor: ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#6b7280']
        }]
      },
      options: { maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { boxWidth: 12, font: { size: 11 } } } }, cutout: '70%' }
    });

    const ctxScore = document.getElementById('ov-scores-chart').getContext('2d');
    if (overviewScoresChart) overviewScoresChart.destroy();
    overviewScoresChart = new Chart(ctxScore, {
      type: 'bar',
      data: {
        labels: ['Quantitative', 'Verbal', 'Logical', 'Data Interpretation', 'Mixed'],
        datasets: [{
          label: 'Average Score (%)',
          data: [
            stats.categoryAvgScores.quantitative || 0,
            stats.categoryAvgScores.verbal || 0,
            stats.categoryAvgScores.logical || 0,
            stats.categoryAvgScores.di || 0,
            stats.categoryAvgScores.mixed || 0
          ],
          backgroundColor: '#3b82f6',
          borderRadius: 4
        }]
      },
      options: { maintainAspectRatio: false, scales: { y: { beginAtZero: true, max: 100 } } }
    });

  } catch (err) {
    console.error('Failed to load assessment overview', err);
  }
}
