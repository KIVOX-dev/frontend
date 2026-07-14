// ════════ INSTITUTIONAL FACULTY LOGIC ════════

let _facExtractionState = {
  name: false,
  roll: false,
  email: false,
  dept: '',
  year: '',
  mappedCols: { name: '', roll: '', email: '' }
};

function resetFacultyUpload() {
  _facExtractionState = { 
    name: false, roll: false, email: false, dept: '', year: '',
    mappedCols: { name: '', roll: '', email: '' }
  };
  
  // Clear hidden inputs
  const deptInput = document.getElementById('fac-selected-dept');
  const yearInput = document.getElementById('fac-selected-year');
  if (deptInput) deptInput.value = '';
  if (yearInput) yearInput.value = '';

  // Reset UI classes
  document.querySelectorAll('.sk-choice-btn').forEach(b => b.classList.remove('active'));
  
  // Reset Steps
  const step2 = document.getElementById('fac-step-2');
  const step3 = document.getElementById('fac-step-3');
  if (step2) step2.classList.add('disabled');
  if (step3) step3.classList.add('disabled');

  // Reset Forms
  const form = document.getElementById('fac-upload-form');
  const progress = document.getElementById('fac-upload-progress');
  const summary = document.getElementById('fac-upload-summary');
  const fileName = document.getElementById('fac-file-name');
  const fileInput = document.getElementById('fac-stu-file');
  const submitBtn = document.getElementById('fac-final-submit');
  const extractionTools = document.getElementById('fac-extraction-tools');

  if (form) form.style.display = 'block';
  if (progress) progress.style.display = 'none';
  if (summary) summary.style.display = 'none';
  if (fileName) fileName.textContent = 'No file selected';
  if (fileInput) fileInput.value = '';
  if (submitBtn) submitBtn.style.display = 'none';
  if (extractionTools) extractionTools.style.display = 'none';

  // Reset extraction buttons
  ['name', 'roll', 'email'].forEach(f => {
    const btn = document.getElementById(`btn-extract-${f}`);
    if (btn) {
      btn.classList.remove('btn-p');
      btn.classList.add('btn-o');
      btn.innerHTML = f === 'roll' ? 'Roll No' : f.charAt(0).toUpperCase() + f.slice(1) + (f === 'email' ? ' (Optional)' : '');
    }
  });
}

function selectFacDept(dept, el) {
  _facExtractionState.dept = dept;
  const deptInput = document.getElementById('fac-selected-dept');
  if (deptInput) deptInput.value = dept;
  
  // Update UI
  const grid = document.getElementById('fac-dept-grid');
  if (grid) grid.querySelectorAll('.sk-choice-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');

  // Enable Step 2
  const step2 = document.getElementById('fac-step-2');
  if (step2) step2.classList.remove('disabled');
  showToast(`Department ${dept} selected`);
}

function selectFacYear(year, el) {
  _facExtractionState.year = year;
  const yearInput = document.getElementById('fac-selected-year');
  if (yearInput) yearInput.value = year;

  // Update UI
  const step = document.getElementById('fac-step-2');
  if (step) step.querySelectorAll('.sk-choice-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');

  // Enable Step 3
  const step3 = document.getElementById('fac-step-3');
  if (step3) step3.classList.remove('disabled');
}

function handleFacultyFileUpload(input) {
  const file = input.files[0];
  if (!file) return;
  const fileName = document.getElementById('fac-file-name');
  if (fileName) fileName.textContent = file.name;

  const reader = new FileReader();
  reader.onload = (e) => {
    if (typeof XLSX === 'undefined') { showToast('XLSX Library not loaded'); return; }
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheet = workbook.SheetNames[0];
      const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet]);
      window._pendingExtractedData = jsonData;
      
      // Show extraction tools and AUTO-EXTRACT
      const tools = document.getElementById('fac-extraction-tools');
      if (tools) tools.style.display = 'block';
      
      autoExtractAll();
    } catch (err) {
      showToast('Error reading Excel file.');
    }
  };
  reader.readAsArrayBuffer(file);
}

async function autoExtractAll() {
  showToast('File uploaded successfully. Auto-extracting data...');
  
  // Sequential extraction with small delays for UX
  await runExtraction('name', 300);
  await runExtraction('roll', 300);
  await runExtraction('email', 300);
  
  showExtractionSummary();
}

function findColumn(patterns) {
  if (!window._pendingExtractedData || !window._pendingExtractedData.length) return null;
  const firstRow = window._pendingExtractedData[0];
  const keys = Object.keys(firstRow);
  
  for (const p of patterns) {
    const match = keys.find(k => k.toLowerCase().includes(p.toLowerCase()));
    if (match) return match;
  }
  return null;
}

function runExtraction(field, duration = 80) {
  return new Promise((resolve) => {
    const progressLine = document.getElementById('fac-upload-progress');
    const fill = document.getElementById('fac-progress-fill');
    const perc = document.getElementById('fac-progress-perc');
    const lbl = document.getElementById('fac-progress-lbl');

    if (!progressLine) { resolve(); return; }

    progressLine.style.display = 'block';
    lbl.textContent = `Extracting ${field}...`;
    
    const patterns = {
      name: ['name', 'full name', 'student', 'nom'],
      roll: ['roll', 'hall ticket', 'register', 'id', 'htno'],
      email: ['email', 'mail', 'email id', 'mail id']
    };

    const col = findColumn(patterns[field]);
    if (col) {
      _facExtractionState.mappedCols[field] = col;
    }

    let p = 0;
    const stepTime = duration / 5;
    const iv = setInterval(() => {
      p += 20;
      if (fill) fill.style.width = p + '%';
      if (perc) perc.textContent = p + '%';
      if (p >= 100) {
        clearInterval(iv);
        setTimeout(() => {
          progressLine.style.display = 'none';
          markFieldExtracted(field, !!col);
          resolve();
        }, 200);
      }
    }, stepTime);
  });
}

function markFieldExtracted(field, success) {
  _facExtractionState[field] = true;
  const btn = document.getElementById(`btn-extract-${field}`);
  if (btn) {
    btn.classList.remove('btn-o');
    btn.classList.add('btn-p');
    btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" width="12" height="12"><polyline points="20 6 9 17 4 12"/></svg> ${field === 'roll' ? 'Roll No' : field.charAt(0).toUpperCase() + field.slice(1)}`;
  }

  if (!success && field !== 'email') {
    // console.warn(`Auto-detect failed for ${field}`);
  }
}

function getInitials(name) {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + (parts[parts.length - 1][0] || '')).toUpperCase();
}

function showExtractionSummary() {
  const summary = document.getElementById('fac-upload-summary');
  const summaryText = document.getElementById('fac-summary-text');
  const submitBtn = document.getElementById('fac-final-submit');

  if (summary) summary.style.display = 'block';
  if (submitBtn) submitBtn.style.display = 'flex';

  const data = window._pendingExtractedData || [];
  const count = data.length;
  const dept = _facExtractionState.dept;
  const year = _facExtractionState.year;
  const college = typeof activeCollege !== 'undefined' ? activeCollege : 'Premium Institute';

  // Creative Status Chips
  const fields = [
    { id: 'name', label: 'Student Names' },
    { id: 'roll', label: 'Roll Numbers' },
    { id: 'email', label: 'Email IDs' }
  ];

  const chipsHtml = fields.map(f => `
    <div class="sk-glass-chip ${_facExtractionState.mappedCols[f.id] ? 'success' : ''}">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="12" height="12">
        ${_facExtractionState.mappedCols[f.id] 
          ? '<polyline points="20 6 9 17 4 12" />' 
          : '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>'}
      </svg>
      ${f.label}
    </div>
  `).join('');

  // Premium Glass Table Rows (ALL records)
  let rowsHtml = '';
  data.forEach((s, i) => {
    const n = s[_facExtractionState.mappedCols.name] || 'N/A';
    const r = s[_facExtractionState.mappedCols.roll] || 'N/A';
    const e = s[_facExtractionState.mappedCols.email] || '—';
    const ini = getInitials(n);
    
    rowsHtml += `
      <tr>
        <td>
          <div style="display:flex; align-items:center">
            <div class="sk-table-avatar">${ini}</div>
            ${n}
          </div>
        </td>
        <td style="font-weight:600; font-family:monospace; color:var(--dark)">${r}</td>
        <td style="color:var(--muted); font-size:12px">${e}</td>
      </tr>
    `;
  });

  if (summaryText) {
    summaryText.innerHTML = `
      <div class="sk-preview-header">
        <div class="sk-college-tag">${college}</div>
        <div style="font-size: 18px; font-weight: 800; color: var(--text)">Onboarding Student Batch</div>
        <div style="font-size: 13px; color: var(--muted); margin-bottom: 4px">
          Successfully verified <strong>${count}</strong> student records for <strong>${dept} ${year}</strong>.
        </div>
        <div class="sk-chip-group">${chipsHtml}</div>
      </div>

      <div class="sk-glass-table-wrap">
        <div class="sk-table-scroll">
          <table class="sk-glass-table">
            <thead>
              <tr>
                <th>Student Full Name</th>
                <th>Roll Number</th>
                <th>Email Address</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </div>
      </div>
      
      <div style="margin-top: 16px; font-size: 11px; color: var(--muted); text-align: center">
        Scroll to view all <strong>${count}</strong> records
      </div>
    `;
  }
}

async function submitForApproval() {
  const dept = _facExtractionState.dept;
  const year = _facExtractionState.year;
  const rawData = window._pendingExtractedData || [];
  const colMap = _facExtractionState.mappedCols;

  if (!rawData.length) { showToast('No data to submit'); return; }

  // 1. Map students for internal system
  const students = rawData.map(s => ({
    name: (s[colMap.name] || 'Unknown').trim(),
    roll: (s[colMap.roll] || 'N/A').trim().toUpperCase(),
    email: (s[colMap.email] || '').trim(),
    status: 'pending'
  }));

  showToast('Submitting batch for platform verification...');

  // 2. Create the batch object
  const batchId = 'BATCH-' + Date.now();
  const college = typeof activeCollege !== 'undefined' ? activeCollege : 'Premium Institute';
  
  try {
    const result = await apiFetch('/batches', {
      method: 'POST',
      body: JSON.stringify({
        batchId,
        name: `${dept} - ${year} - Batch ${new Date().getFullYear()}`,
        college: college,
        department: dept,
        year: year,
        students: students
      })
    });

    if (result.success) {
      showToast('Success! Batch submitted to Platform Admin.');
      resetFacultyUpload();
      if (window.ss) window.ss('fac-history', 'nav-fac-history');
      loadFacultyHistory(); // Refresh history
    }
  } catch (e) {
    showToast('Submission failed: ' + e.message);
  }
}

let _facHistoryData = [];
async function loadFacultyHistory() {
  const historyList = document.getElementById('fac-history-list');
  if (!historyList) return;
  
  try {
    const result = await apiFetch('/batches/history');
    _facHistoryData = result.data || [];
    renderFacHistory(_facHistoryData);
  } catch (e) {
    console.error('History load failed:', e);
  }
}

function renderFacHistory(batches) {
  const historyList = document.getElementById('fac-history-list');
  if (!historyList) return;

  historyList.innerHTML = batches.map(b => `
    <tr>
      <td style="font-family:monospace; font-weight:600">#${b.batchId.split('-')[1]}</td>
      <td style="font-weight:700">${b.name}</td>
      <td>${b.students.length} Students</td>
      <td>${b.department} / ${b.year}</td>
      <td style="font-size:12px; color:var(--muted)">${new Date(b.submittedAt).toLocaleDateString()}</td>
      <td><span class="badge ${b.status === 'pending' ? 'ba' : (b.status === 'approved' ? 'bg' : 'br')}">${b.status.toUpperCase()}</span></td>
    </tr>
  `).join('');
  
  if (!batches.length) {
    historyList.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:40px; color:var(--muted)">No submission history found.</td></tr>';
  }
}

function filterFacHistory(status) {
  if (status === 'all') {
    renderFacHistory(_facHistoryData);
  } else {
    const filtered = _facHistoryData.filter(b => b.status === status);
    renderFacHistory(filtered);
  }
}

let _facStudentData = [];
async function loadFacultyTracker() {
  const trackerList = document.getElementById('fac-tracker-list');
  if (!trackerList) return;

  try {
    const result = await apiFetch('/batches/students');
    _facStudentData = result.data || [];
    
    // Fill dept filter
    const depts = [...new Set(_facStudentData.map(s => s.department))];
    const deptFilter = document.getElementById('fac-student-dept-filter');
    if (deptFilter) {
      deptFilter.innerHTML = '<option value="all">All Departments</option>' + 
        depts.map(d => `<option value="${d}">${d}</option>`).join('');
    }
    
    renderFacStudents(_facStudentData);
  } catch (e) {
    console.error('Tracker load failed:', e);
  }
}

function renderFacStudents(students) {
  const trackerList = document.getElementById('fac-tracker-list');
  if (!trackerList) return;

  trackerList.innerHTML = students.map(s => {
    const acc = s.stats?.avgAccuracy || 0;
    const tests = s.stats?.testsCompleted || 0;
    const lastActive = s.lastSession?.lastActivePage ? 'Active Now' : 'Recent';
    
    return `
      <tr>
        <td>
          <div style="display:flex; align-items:center; gap:10px">
            <div class="sk-table-avatar" style="background:var(--accent-l); color:var(--accent)">${getInitials(s.name)}</div>
            <div style="font-weight:700">${s.name}</div>
          </div>
        </td>
        <td style="font-family:monospace">${s.studentId}</td>
        <td style="font-size:12px">${s.department} / ${s.year} Year</td>
        <td><span class="badge bp">${tests} Tests</span></td>
        <td>
          <div style="display:flex; align-items:center; gap:8px">
             <div class="pw" style="width:60px; height:6px"><div class="pf" style="width:${acc}%"></div></div>
             <span style="font-weight:600; font-size:12px">${acc}%</span>
          </div>
        </td>
        <td style="font-size:12px; color:var(--muted)">${lastActive}</td>
      </tr>
    `;
  }).join('');

  if (!students.length) {
    trackerList.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:40px; color:var(--muted)">No students found in your approved batches.</td></tr>';
  }
}

function filterFacStudents(search = '') {
  const dept = document.getElementById('fac-student-dept-filter')?.value || 'all';
  const query = search.toLowerCase() || (document.querySelector('#screen-fac-tracker input')?.value.toLowerCase() || '');

  let filtered = _facStudentData;
  if (dept !== 'all') {
    filtered = filtered.filter(s => s.department === dept);
  }
  if (query) {
    filtered = filtered.filter(s => s.name.toLowerCase().includes(query) || s.studentId.toLowerCase().includes(query));
  }
  renderFacStudents(filtered);
}

// Intercept screen switch to fac-history
const originalSs = window.ss;
window.ss = function(id, navId) {
  if (id === 'fac-history') loadFacultyHistory();
  if (id === 'fac-tracker') loadFacultyTracker();
  if (originalSs) originalSs(id, navId);
};
